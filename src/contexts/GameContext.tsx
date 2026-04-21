import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { GameState, Player, ResourceType, TileData, Settlement, Road, StructureType } from '../types';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface GameActionsType {
  createGame: (playerName: string, isLocal?: boolean, playerCount?: number) => void;
  joinGame: (roomId: string, playerName: string) => void;
  rollDice: () => void;
  endTurn: () => void;
  buildSettlement: (vertexId: string) => void;
  buildRoad: (edgeId: string) => void;
  upgradeToCity: (vertexId: string) => void;
  moveRobber: (tileId: number) => void;
  sendMessage: (message: string) => void;
  startGame: () => void;
  discardCards: (resources: Record<ResourceType, number>) => void;
  stealCard: (targetPlayerId: number) => void;
  startDemo: () => void;
  pauseDemo: () => void;
  resumeDemo: () => void;
  restartDemo: () => void;
  setSimulationSpeed: (speed: number) => void;
}

interface GameStateContextType {
  state: GameState | null;
  playerId: number | null;
  roomId: string | null;
  tiles: TileData[];
}

interface ActivityContextType {
  messages: ChatMessage[];
  logs: string[];
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);
const GameActionsContext = createContext<GameActionsType | undefined>(undefined);
const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState | null>(null);
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    // Check for existing session
    const savedRoomId = localStorage.getItem('katan_roomId');
    const savedPlayerId = localStorage.getItem('katan_playerId');
    const savedPlayerName = localStorage.getItem('katan_playerName');

    if (savedRoomId && savedPlayerId && savedPlayerName) {
      socket.emit('joinGame', { roomId: savedRoomId, playerName: savedPlayerName, reconnecting: true });
    }

    socket.on('gameCreated', ({ roomId, state, tiles, playerId, playerName }) => {
      setRoomId(roomId);
      setState(state);
      setTiles(tiles);
      setPlayerId(playerId);
      if (state.logs) setLogs(state.logs);
      localStorage.setItem('katan_roomId', roomId);
      localStorage.setItem('katan_playerId', playerId.toString());
      localStorage.setItem('katan_playerName', playerName);
    });

    socket.on('gameJoined', ({ roomId, state, tiles, playerId, playerName }) => {
      setRoomId(roomId);
      setState(state);
      setTiles(tiles);
      setPlayerId(playerId);
      if (state.logs) setLogs(state.logs);
      localStorage.setItem('katan_roomId', roomId);
      localStorage.setItem('katan_playerId', playerId.toString());
      localStorage.setItem('katan_playerName', playerName);
    });

    socket.on('gameStateUpdate', (newState: GameState) => {
      setState(prev => {
        // Optimization: only update if version is newer
        if (prev && newState.version <= prev.version) return prev;
        
        // Merge logs if they exist (usually won't in optimized updates)
        if (newState.logs) {
          setLogs(newState.logs);
        }
        
        return {
          ...newState,
          logs: prev?.logs || newState.logs || []
        };
      });
    });

    socket.on('newLog', (log: string) => {
      setLogs(prev => {
        const next = [...prev, log];
        if (next.length > 50) next.shift();
        return next;
      });

      // Filter toasts to reduce spam
      if (log.includes('victory') || log.includes('wins')) {
        toast.success(log, { icon: '🏆', duration: 8000 });
      } else if (log.includes('rolled a 7')) {
        toast.error(log, { icon: '🎲' });
      } else if (log.includes('stole') || log.includes('Robber')) {
        toast.warning(log, { icon: '🕵️' });
      } else if (log.includes('joined')) {
        toast.info(log, { icon: '👋' });
      } else if (log.includes('received')) {
        // No toast for resources, use the sidebar
        return;
      }
    });

    socket.on('newMessage', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
      toast(`New message from ${msg.sender}`, { duration: 2000 });
    });

    socket.on('error', (msg) => {
      toast.error(msg);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createGame = useCallback((playerName: string, isLocal?: boolean, playerCount?: number) => {
    socketRef.current?.emit('createGame', { playerName, isLocal, playerCount });
  }, []);

  const joinGame = useCallback((roomId: string, playerName: string) => {
    socketRef.current?.emit('joinGame', { roomId, playerName });
  }, []);

  const rollDice = useCallback(() => {
    if (!roomId) return;
    socketRef.current?.emit('rollDice', { roomId });
  }, [roomId]);

  const endTurn = useCallback(() => {
    if (!roomId) return;
    socketRef.current?.emit('endTurn', { roomId });
  }, [roomId]);

  const buildSettlement = useCallback((vertexId: string) => {
    if (!roomId) return;
    socketRef.current?.emit('buildSettlement', { roomId, vertexId });
  }, [roomId]);

  const buildRoad = useCallback((edgeId: string) => {
    if (!roomId) return;
    socketRef.current?.emit('buildRoad', { roomId, edgeId });
  }, [roomId]);

  const upgradeToCity = useCallback((vertexId: string) => {
    if (!roomId) return;
    socketRef.current?.emit('upgradeToCity', { roomId, vertexId });
  }, [roomId]);

  const moveRobber = useCallback((tileId: number) => {
    if (!roomId) return;
    socketRef.current?.emit('moveRobber', { roomId, tileId });
  }, [roomId]);

  const sendMessage = useCallback((message: string) => {
    if (!roomId) return;
    socketRef.current?.emit('sendMessage', { roomId, message });
  }, [roomId]);

  const startGame = useCallback(() => {
    if (!roomId) return;
    socketRef.current?.emit('startGame', { roomId });
  }, [roomId]);

  const discardCards = useCallback((resources: Record<ResourceType, number>) => {
    if (!roomId) return;
    socketRef.current?.emit('discardCards', { roomId, resources });
  }, [roomId]);

  const stealCard = useCallback((targetPlayerId: number) => {
    if (!roomId) return;
    socketRef.current?.emit('stealCard', { roomId, targetPlayerId });
  }, [roomId]);

  const startDemo = useCallback(() => {
    socketRef.current?.emit('startDemo');
  }, []);

  const pauseDemo = useCallback(() => {
    if (!roomId) return;
    socketRef.current?.emit('pauseDemo', { roomId });
  }, [roomId]);

  const resumeDemo = useCallback(() => {
    if (!roomId) return;
    socketRef.current?.emit('resumeDemo', { roomId });
  }, [roomId]);

  const restartDemo = useCallback(() => {
    if (!roomId) return;
    socketRef.current?.emit('restartDemo', { roomId });
  }, [roomId]);

  const setSimulationSpeed = useCallback((speed: number) => {
    if (!roomId) return;
    socketRef.current?.emit('setSimulationSpeed', { roomId, speed });
  }, [roomId]);

  const stateValue = useMemo(() => ({ 
    state, 
    playerId,
    roomId,
    tiles,
  }), [state, playerId, roomId, tiles]);

  const activityValue = useMemo(() => ({
    messages,
    logs
  }), [messages, logs]);

  const actionValue = useMemo(() => ({
    createGame,
    joinGame,
    rollDice, 
    endTurn, 
    buildSettlement, 
    buildRoad, 
    upgradeToCity, 
    moveRobber,
    sendMessage,
    startGame,
    discardCards,
    stealCard,
    startDemo,
    pauseDemo,
    resumeDemo,
    restartDemo,
    setSimulationSpeed
  }), [
    createGame, 
    joinGame, 
    rollDice, 
    endTurn, 
    buildSettlement, 
    buildRoad, 
    upgradeToCity, 
    moveRobber, 
    sendMessage, 
    startGame, 
    discardCards, 
    stealCard, 
    startDemo, 
    pauseDemo, 
    resumeDemo, 
    restartDemo, 
    setSimulationSpeed
  ]);

  return (
    <GameStateContext.Provider value={stateValue}>
      <ActivityContext.Provider value={activityValue}>
        <GameActionsContext.Provider value={actionValue}>
          {children}
        </GameActionsContext.Provider>
      </ActivityContext.Provider>
    </GameStateContext.Provider>
  );
};

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) throw new Error('useGameState must be used within a GameProvider');
  return context;
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) throw new Error('useActivity must be used within a GameProvider');
  return context;
};

export const useGameActions = () => {
  const context = useContext(GameActionsContext);
  if (!context) throw new Error('useGameActions must be used within a GameProvider');
  return context;
};

// Backward compatibility or for common usage
export const useGame = () => {
  const state = useGameState();
  const activity = useActivity();
  const actions = useGameActions();
  return useMemo(() => ({ ...state, ...activity, ...actions }), [state, activity, actions]);
};
