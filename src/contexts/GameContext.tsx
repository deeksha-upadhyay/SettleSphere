import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { GameState, Player, ResourceType, TileData, Settlement, Road, StructureType } from '../types';
import initialTiles from '../data/tiles.json';
import { getCanonicalVertexId, getVertexTiles, getTileAt } from '../lib/gameUtils';

interface GameContextType {
  state: GameState;
  rollDice: () => void;
  endTurn: () => void;
  buildSettlement: (vertexId: string) => void;
  buildRoad: (edgeId: string) => void;
  upgradeToCity: (vertexId: string) => void;
  moveRobber: (tileId: number) => void;
  tiles: TileData[];
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const INITIAL_RESOURCES: Record<ResourceType, number> = {
  wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0, desert: 0
};

const COSTS = {
  road: { wood: 1, brick: 1 },
  settlement: { wood: 1, brick: 1, sheep: 1, wheat: 1 },
  city: { ore: 3, wheat: 2 }
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [state, setState] = useState<GameState>({
    players: [
      { id: 1, name: "Player 1", color: "bg-red-500", resources: { ...INITIAL_RESOURCES, wood: 4, brick: 4, sheep: 2, wheat: 2 }, victoryPoints: 0, roads: 0, settlements: 0, cities: 0 },
      { id: 2, name: "Player 2", color: "bg-blue-500", resources: { ...INITIAL_RESOURCES, wood: 2, brick: 2, sheep: 2, wheat: 2 }, victoryPoints: 0, roads: 0, settlements: 0, cities: 0 },
      { id: 3, name: "Player 3", color: "bg-orange-500", resources: { ...INITIAL_RESOURCES, wood: 2, brick: 2, sheep: 2, wheat: 2 }, victoryPoints: 0, roads: 0, settlements: 0, cities: 0 },
    ],
    currentPlayerIndex: 0,
    dice: [1, 1],
    hasRolled: false,
    robberTileId: 8, // Desert by default
    settlements: {},
    roads: {},
    winner: null,
    gamePhase: 'play',
    setupStep: 0,
  });

  useEffect(() => {
    // Shuffle tiles once on mount
    const shuffled = [...initialTiles].sort(() => Math.random() - 0.5) as TileData[];
    setTiles(shuffled);
    // Find desert for initial robber
    const desert = shuffled.find(t => t.type === 'desert');
    if (desert) {
      setState(prev => ({ ...prev, robberTileId: desert.id }));
    }
  }, []);

  const currentPlayer = state.players[state.currentPlayerIndex];

  const rollDice = useCallback(() => {
    if (state.hasRolled) return;

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;

    setState(prev => {
      const newState = { ...prev, dice: [d1, d2] as [number, number], hasRolled: true };
      
      if (total === 7) {
        newState.gamePhase = 'robber';
        return newState;
      }

      // Distribute resources
      const updatedPlayers = [...prev.players];
      
      (Object.values(prev.settlements) as Settlement[]).forEach(settlement => {
        const playerIndex = updatedPlayers.findIndex(p => p.id === settlement.playerId);
        if (playerIndex === -1) return;

        const tileCoords = settlement.vertexId.replace('v:', '').split('|').map(s => s.split(',').map(Number));
        
        tileCoords.forEach(([q, r]) => {
          const tile = getTileAt(tiles, q, r);
          if (tile && tile.number === total && tile.id !== prev.robberTileId) {
            const amount = settlement.type === 'city' ? 2 : 1;
            const resType = tile.type;
            if (resType !== 'desert') {
              const updatedResources = { ...updatedPlayers[playerIndex].resources };
              updatedResources[resType] += amount;
              updatedPlayers[playerIndex] = {
                ...updatedPlayers[playerIndex],
                resources: updatedResources
              };
            }
          }
        });
      });

      return { ...newState, players: updatedPlayers };
    });
  }, [state.hasRolled, tiles]);

  const endTurn = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
      hasRolled: false,
      gamePhase: 'play'
    }));
  }, []);

  const buildSettlement = useCallback((vertexId: string) => {
    if (state.settlements[vertexId] || state.winner) return;
    
    // Basic distance rule: No settlement can be adjacent to another
    const vertexTiles = vertexId.replace('v:', '').split('|').map(s => s.split(',').map(Number));
    // This is complex to check perfectly without a full vertex adjacency map,
    // but we can check if any existing settlement is "too close".
    // For now, let's stick to resource and ownership rules.

    const canAfford = Object.entries(COSTS.settlement).every(
      ([res, amount]) => currentPlayer.resources[res as ResourceType] >= amount
    );

    if (!canAfford) return;

    setState(prev => {
      const players = [...prev.players];
      const p = { ...players[prev.currentPlayerIndex] };
      
      Object.entries(COSTS.settlement).forEach(([res, amount]) => {
        p.resources[res as ResourceType] -= amount;
      });

      p.settlements += 1;
      p.victoryPoints += 1;
      players[prev.currentPlayerIndex] = p;

      const newState = {
        ...prev,
        players,
        settlements: {
          ...prev.settlements,
          [vertexId]: { playerId: p.id, type: 'settlement', vertexId }
        }
      };

      if (p.victoryPoints >= 10) {
        newState.winner = p.id;
      }

      return newState;
    });
  }, [currentPlayer, state.settlements, state.winner]);

  const buildRoad = useCallback((edgeId: string) => {
    if (state.roads[edgeId]) return;

    const canAfford = Object.entries(COSTS.road).every(
      ([res, amount]) => currentPlayer.resources[res as ResourceType] >= amount
    );

    if (!canAfford) return;

    setState(prev => {
      const players = [...prev.players];
      const p = { ...players[prev.currentPlayerIndex] };
      
      Object.entries(COSTS.road).forEach(([res, amount]) => {
        p.resources[res as ResourceType] -= amount;
      });

      p.roads += 1;
      players[prev.currentPlayerIndex] = p;

      return {
        ...prev,
        players,
        roads: {
          ...prev.roads,
          [edgeId]: { playerId: p.id, edgeId }
        }
      };
    });
  }, [currentPlayer, state.roads]);

  const upgradeToCity = useCallback((vertexId: string) => {
    const s = state.settlements[vertexId];
    if (!s || s.playerId !== currentPlayer.id || s.type === 'city' || state.winner) return;

    const canAfford = Object.entries(COSTS.city).every(
      ([res, amount]) => currentPlayer.resources[res as ResourceType] >= amount
    );

    if (!canAfford) return;

    setState(prev => {
      const players = [...prev.players];
      const p = { ...players[prev.currentPlayerIndex] };
      
      Object.entries(COSTS.city).forEach(([res, amount]) => {
        p.resources[res as ResourceType] -= amount;
      });

      p.cities += 1;
      p.victoryPoints += 1; // City adds 1 more point (total 2 for that spot)
      players[prev.currentPlayerIndex] = p;

      const newState = {
        ...prev,
        players,
        settlements: {
          ...prev.settlements,
          [vertexId]: { ...s, type: 'city' }
        }
      };

      if (p.victoryPoints >= 10) {
        newState.winner = p.id;
      }

      return newState;
    });
  }, [currentPlayer, state.settlements, state.winner]);

  const moveRobber = useCallback((tileId: number) => {
    if (state.gamePhase !== 'robber') return;
    setState(prev => ({
      ...prev,
      robberTileId: tileId,
      gamePhase: 'play'
    }));
  }, [state.gamePhase]);

  return (
    <GameContext.Provider value={{ 
      state, 
      rollDice, 
      endTurn, 
      buildSettlement, 
      buildRoad, 
      upgradeToCity, 
      moveRobber,
      tiles
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};
