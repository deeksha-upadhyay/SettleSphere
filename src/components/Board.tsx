import React, { useState, useCallback, useMemo } from 'react';
import { HexTile } from './HexTile';
import { useGameState, useGameActions } from '../contexts/GameContext';
import { Settlement, Road } from '../types';
import { getCanonicalVertexId, getCanonicalEdgeId } from '../lib/gameUtils';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { ConfirmDialog } from './ConfirmDialog';
import { SettlementView } from './SettlementView';
import { RoadView } from './RoadView';

export const Board: React.FC = React.memo(() => {
  const { state, tiles, playerId } = useGameState();
  const { buildSettlement, buildRoad, upgradeToCity, moveRobber } = useGameActions();
  const [confirmAction, setConfirmAction] = useState<{ type: 'settlement' | 'road' | 'city', id: string } | null>(null);

  const isMyTurn = useMemo(() => 
    state?.isLocal || state?.players[state.currentPlayerIndex].id === playerId,
    [state?.isLocal, state?.currentPlayerIndex, playerId]
  );

  // Pre-calculate board layout (static)
  const boardLayout = useMemo(() => {
    if (!tiles.length) return { rows: [], vertices: [], edges: [] };

    const rows = [
      tiles.slice(0, 3),
      tiles.slice(3, 7),
      tiles.slice(7, 12),
      tiles.slice(12, 16),
      tiles.slice(16, 19),
    ];

    const vertices: { id: string; pos: any }[] = [];
    const edges: { id: string; pos: any }[] = [];
    const seenV = new Set<string>();
    const seenE = new Set<string>();

    const vertexStyles = [
      { top: '-2%', left: '50%' },
      { top: '25%', left: '100%' },
      { top: '75%', left: '100%' },
      { top: '102%', left: '50%' },
      { top: '75%', left: '0%' },
      { top: '25%', left: '0%' },
    ];

    const edgeStyles = [
      { top: '12%', left: '75%', rotate: '30deg' },
      { top: '50%', left: '100%', rotate: '90deg' },
      { top: '88%', left: '75%', rotate: '150deg' },
      { top: '88%', left: '25%', rotate: '210deg' },
      { top: '50%', left: '0%', rotate: '270deg' },
      { top: '12%', left: '25%', rotate: '330deg' },
    ];

    tiles.forEach(tile => {
      [0,1,2,3,4,5].forEach(i => {
        const vId = getCanonicalVertexId(tile.q, tile.r, i);
        if (!seenV.has(vId)) {
          seenV.add(vId);
          // Calculate global position relative to tile container
          // This is tricky because we use relative positioning in CSS
          // For now, we'll keep the relative layout but pre-calculate IDs
        }
        const eId = getCanonicalEdgeId(tile.q, tile.r, i);
        if (!seenE.has(eId)) {
          seenE.add(eId);
        }
      });
    });

    return { rows, vertexStyles, edgeStyles };
  }, [tiles]);

  const validityMap = useMemo(() => {
    if (!state || !playerId) return { settlements: {}, roads: {} };
    
    const activePlayerId = state.isLocal ? state.players[state.currentPlayerIndex].id : playerId;
    const settlementValidity: Record<string, boolean> = {};
    const roadValidity: Record<string, boolean> = {};

    const existingSettlementKeys = Object.keys(state.settlements);
    const existingRoadValues = Object.values(state.roads) as Road[];

    // Check phase
    if (state.gamePhase === 'waiting' || state.gamePhase === 'robber' || state.gamePhase === 'discarding') {
      return { settlements: {}, roads: {} };
    }

    if (!isMyTurn) return { settlements: {}, roads: {} };

    // This is still O(V*S) but at least it's only once per state change
    tiles.forEach(tile => {
      [0,1,2,3,4,5].forEach(i => {
        const vId = getCanonicalVertexId(tile.q, tile.r, i);
        if (!state.settlements[vId]) {
          const isTooClose = existingSettlementKeys.some(existingId => {
            const t1 = vId.replace('v:', '').split('|');
            const t2 = existingId.replace('v:', '').split('|');
            const common = t1.filter(t => t2.includes(t));
            return common.length >= 2;
          });

          if (!isTooClose) {
            const isConnectedToRoad = existingRoadValues.some(road => 
              road.playerId === activePlayerId && road.edgeId.includes(vId)
            );
            
            if (state.gamePhase === 'setup') {
              const mySettlements = Object.values(state.settlements).filter(s => (s as Settlement).playerId === activePlayerId).length;
              if (mySettlements < 2) settlementValidity[vId] = true;
            } else if (isConnectedToRoad) {
              settlementValidity[vId] = true;
            }
          }
        }

        const eId = getCanonicalEdgeId(tile.q, tile.r, i);
        if (!state.roads[eId]) {
          const isConnectedToMyRoad = existingRoadValues.some(r => 
            (r as Road).playerId === activePlayerId && (r.edgeId.split('|').some(v => eId.includes(v)))
          );
          const isConnectedToMySettlement = (Object.values(state.settlements) as Settlement[]).some(s => 
            s.playerId === activePlayerId && eId.includes(s.vertexId)
          );
          roadValidity[eId] = (state.gamePhase === 'setup' ? isConnectedToMySettlement : (isConnectedToMyRoad || isConnectedToMySettlement));
        }
      });
    });

    return { settlements: settlementValidity, roads: roadValidity };
  }, [state, playerId, tiles]);

  const handleSettlementClick = useCallback((vId: string, settlement: Settlement | null) => {
    if (!isMyTurn || !state) return;
    if (state.gamePhase === 'setup') {
      settlement ? upgradeToCity(vId) : buildSettlement(vId);
    } else {
      setConfirmAction({ type: settlement ? 'city' : 'settlement', id: vId });
    }
  }, [isMyTurn, state?.gamePhase, upgradeToCity, buildSettlement]);

  const handleRoadClick = useCallback((eId: string) => {
    if (!isMyTurn || !state) return;
    if (state.gamePhase === 'setup') {
      buildRoad(eId);
    } else {
      setConfirmAction({ type: 'road', id: eId });
    }
  }, [isMyTurn, state?.gamePhase, buildRoad]);

  const handleMoveRobber = useCallback((tileId: number) => {
    if (isMyTurn && state?.gamePhase === 'robber') {
      moveRobber(tileId);
    }
  }, [isMyTurn, state?.gamePhase, moveRobber]);

  const flatVertices = useMemo(() => {
    const vertices: { id: string; vIndex: number; q: number; r: number }[] = [];
    const seenV = new Set<string>();
    tiles.forEach(tile => {
      [0, 1, 2, 3, 4, 5].forEach(vIndex => {
        const vId = getCanonicalVertexId(tile.q, tile.r, vIndex);
        if (!seenV.has(vId)) {
          seenV.add(vId);
          vertices.push({ id: vId, vIndex, q: tile.q, r: tile.r });
        }
      });
    });
    return vertices;
  }, [tiles]);

  const flatEdges = useMemo(() => {
    const edges: { id: string; eIndex: number; q: number; r: number }[] = [];
    const seenE = new Set<string>();
    tiles.forEach(tile => {
      [0, 1, 2, 3, 4, 5].forEach(eIndex => {
        const eId = getCanonicalEdgeId(tile.q, tile.r, eIndex);
        if (!seenE.has(eId)) {
          seenE.add(eId);
          edges.push({ id: eId, eIndex, q: tile.q, r: tile.r });
        }
      });
    });
    return edges;
  }, [tiles]);

  if (!state || tiles.length === 0) return null;

  const renderedVertices = new Set<string>();
  const renderedEdges = new Set<string>();

  return (
    <div className="flex flex-col items-center justify-center p-8 select-none relative">
      {boardLayout.rows.map((row, rowIndex) => (
        <div 
          key={`row-${rowIndex}`} 
          className="flex justify-center -mt-[34px] first:mt-0"
        >
          {row.map((tile) => {
            const isRobber = state.robberTileId === tile.id;
            
            return (
              <div key={`tile-${tile.id}`} className="relative mx-[2px]">
                <HexTile 
                  id={tile.id}
                  type={tile.type} 
                  number={tile.number} 
                  q={tile.q}
                  r={tile.r}
                  isRobber={isRobber}
                  onMoveRobber={handleMoveRobber}
                />
                
                {/* Vertices */}
                {[0, 1, 2, 3, 4, 5].map(vIndex => {
                  const vId = getCanonicalVertexId(tile.q, tile.r, vIndex);
                  if (renderedVertices.has(vId)) return null;
                  renderedVertices.add(vId);

                  const settlement = state.settlements[vId];
                  const owner = settlement ? state.players.find(p => p.id === settlement.playerId) : null;
                  const isValidBuild = !!validityMap.settlements[vId];
                  const activePlayerId = state.isLocal ? state.players[state.currentPlayerIndex].id : playerId;
                  const canUpgrade = isMyTurn && settlement && settlement.playerId === activePlayerId && settlement.type === 'settlement' && state.gamePhase === 'play';

                  return (
                    <SettlementView
                      key={vId}
                      vId={vId}
                      settlement={settlement || null}
                      owner={owner || null}
                      isValidBuild={isValidBuild}
                      canUpgrade={canUpgrade}
                      isMyTurn={isMyTurn}
                      onClick={handleSettlementClick}
                      style={boardLayout.vertexStyles[vIndex]}
                    />
                  );
                })}

                {/* Edges */}
                {[0, 1, 2, 3, 4, 5].map(eIndex => {
                  const eId = getCanonicalEdgeId(tile.q, tile.r, eIndex);
                  if (renderedEdges.has(eId)) return null;
                  renderedEdges.add(eId);

                  const road = state.roads[eId];
                  const owner = road ? state.players.find(p => p.id === road.playerId) : null;
                  const isValidRoad = !!validityMap.roads[eId];
                  const styles = boardLayout.edgeStyles[eIndex];

                  return (
                    <RoadView
                      key={eId}
                      eId={eId}
                      road={road || null}
                      owner={owner || null}
                      isValidRoad={isValidRoad}
                      isMyTurn={isMyTurn}
                      onClick={handleRoadClick}
                      style={{ 
                        top: styles.top, 
                        left: styles.left, 
                        transform: `translate(-50%, -50%) rotate(${styles.rotate})`,
                        transformOrigin: 'center'
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
      <ConfirmDialog 
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (!confirmAction) return;
          if (confirmAction.type === 'settlement') buildSettlement(confirmAction.id);
          else if (confirmAction.type === 'road') buildRoad(confirmAction.id);
          else if (confirmAction.type === 'city') upgradeToCity(confirmAction.id);
          setConfirmAction(null);
        }}
        title={`Build ${confirmAction?.type === 'city' ? 'City' : confirmAction?.type === 'settlement' ? 'Settlement' : 'Road'}?`}
        description={`Are you sure you want to build this ${confirmAction?.type}? This action cannot be undone.`}
      />
    </div>
  );
});
