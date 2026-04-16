import React from 'react';
import { HexTile } from './HexTile';
import { useGame } from '../contexts/GameContext';
import { getCanonicalVertexId, getCanonicalEdgeId } from '../lib/gameUtils';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export const Board: React.FC = () => {
  const { state, tiles, buildSettlement, buildRoad, upgradeToCity, moveRobber, playerId } = useGame();

  if (!state || tiles.length === 0) return null;

  const isMyTurn = state.players[state.currentPlayerIndex].id === playerId;

  // Split tiles into rows: 3-4-5-4-3
  const rows = [
    tiles.slice(0, 3),
    tiles.slice(3, 7),
    tiles.slice(7, 12),
    tiles.slice(12, 16),
    tiles.slice(16, 19),
  ];

  const renderedVertices = new Set<string>();
  const renderedEdges = new Set<string>();

  return (
    <div className="flex flex-col items-center justify-center p-8 select-none relative">
      {rows.map((row, rowIndex) => (
        <div 
          key={rowIndex} 
          className="flex justify-center -mt-[34px] first:mt-0"
        >
          {row.map((tile) => {
            const isRobber = state.robberTileId === tile.id;
            
            return (
              <div key={tile.id} className="relative mx-[2px]">
                <HexTile 
                  id={tile.id}
                  type={tile.type} 
                  number={tile.number} 
                  q={tile.q}
                  r={tile.r}
                  isRobber={isRobber}
                  onMoveRobber={() => {
                    if (isMyTurn && state.gamePhase === 'robber') {
                      moveRobber(tile.id);
                    }
                  }}
                />
                
                {/* Vertices */}
                {[0, 1, 2, 3, 4, 5].map(vIndex => {
                  const vId = getCanonicalVertexId(tile.q, tile.r, vIndex);
                  if (renderedVertices.has(vId)) return null;
                  renderedVertices.add(vId);

                  const settlement = state.settlements[vId];
                  const owner = settlement ? state.players.find(p => p.id === settlement.playerId) : null;

                  // Position mapping
                  const pos = [
                    { top: '-2%', left: '50%' },
                    { top: '25%', left: '100%' },
                    { top: '75%', left: '100%' },
                    { top: '102%', left: '50%' },
                    { top: '75%', left: '0%' },
                    { top: '25%', left: '0%' },
                  ][vIndex];

                  return (
                    <motion.div
                      key={vId}
                      whileHover={isMyTurn ? { scale: 1.2 } : {}}
                      onClick={() => {
                        if (!isMyTurn) return;
                        settlement ? upgradeToCity(vId) : buildSettlement(vId);
                      }}
                      style={pos}
                      className={cn(
                        "absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 z-30 rounded-full flex items-center justify-center transition-all",
                        isMyTurn ? "cursor-pointer" : "cursor-default",
                        settlement 
                          ? cn(owner?.color, settlement.type === 'city' ? "rounded-sm scale-125" : "rounded-full")
                          : "bg-white/20 hover:bg-white/50 border border-white/30 opacity-0 hover:opacity-100"
                      )}
                    >
                      {settlement && (
                        <span className="text-[10px] font-bold text-white">
                          {settlement.type === 'city' ? 'C' : 'S'}
                        </span>
                      )}
                    </motion.div>
                  );
                })}

                {/* Edges */}
                {[0, 1, 2, 3, 4, 5].map(eIndex => {
                  const eId = getCanonicalEdgeId(tile.q, tile.r, eIndex);
                  if (renderedEdges.has(eId)) return null;
                  renderedEdges.add(eId);

                  const road = state.roads[eId];
                  const owner = road ? state.players.find(p => p.id === road.playerId) : null;

                  // Position and rotation mapping
                  const styles = [
                    { top: '12%', left: '75%', rotate: '30deg' },
                    { top: '50%', left: '100%', rotate: '90deg' },
                    { top: '88%', left: '75%', rotate: '150deg' },
                    { top: '88%', left: '25%', rotate: '210deg' },
                    { top: '50%', left: '0%', rotate: '270deg' },
                    { top: '12%', left: '25%', rotate: '330deg' },
                  ][eIndex];

                  return (
                    <motion.div
                      key={eId}
                      onClick={() => {
                        if (!isMyTurn) return;
                        buildRoad(eId);
                      }}
                      style={{ 
                        top: styles.top, 
                        left: styles.left, 
                        transform: `translate(-50%, -50%) rotate(${styles.rotate})` 
                      }}
                      className={cn(
                        "absolute w-10 h-2 z-20 transition-all",
                        isMyTurn ? "cursor-pointer" : "cursor-default",
                        road 
                          ? cn(owner?.color, "h-3 shadow-md")
                          : "bg-white/10 hover:bg-white/40 opacity-0 hover:opacity-100"
                      )}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
