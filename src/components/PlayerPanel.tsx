import React, { useMemo } from 'react';
import { Player } from '../types';
import { cn } from '@/lib/utils';
import { useGameState } from '../contexts/GameContext';
import { User, Home, Building2, Map, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PlayerCard: React.FC<{ player: Player; isCurrent: boolean }> = React.memo(({ player, isCurrent }) => {
  return (
    <motion.div 
      initial={false}
      layout
      animate={isCurrent ? {
        scale: 1.05,
        borderColor: '#F4D03F',
        boxShadow: ['0 0 10px rgba(244, 208, 63, 0.2)', '0 0 25px rgba(244, 208, 63, 0.5)', '0 0 10px rgba(244, 208, 63, 0.2)'],
        opacity: 1,
        filter: 'grayscale(0)'
      } : {
        scale: 1,
        borderColor: 'transparent',
        boxShadow: 'none',
        opacity: 0.85,
        filter: 'grayscale(0.2)'
      }}
      transition={isCurrent ? {
        boxShadow: { repeat: Infinity, duration: 2, ease: "easeInOut" },
        default: { type: "spring", stiffness: 300, damping: 20 }
      } : { duration: 0.5 }}
      className={cn(
        "p-4 rounded-[20px] transition-all duration-500 border relative overflow-hidden",
        isCurrent ? "bg-white z-10" : "bg-gray-50/80"
      )}
    >
      {isCurrent && (
        <motion.div 
          initial={{ x: 100 }}
          animate={{ x: 0 }}
          className="absolute top-0 right-0 bg-accent px-3 py-1 rounded-bl-xl text-[10px] font-black text-text-dark uppercase tracking-widest"
        >
          Active
        </motion.div>
      )}
      
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("w-8 h-8 rounded-full shadow-inner border-2 border-white", player.color)} />
        <div className="flex flex-col">
          <span className="font-black text-sm text-text-dark leading-none truncate max-w-[120px]">{player.name}</span>
          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Player {player.id}</span>
        </div>
        <div className="ml-auto bg-white/50 px-2 py-1 rounded-md border border-black/5 flex items-center gap-1">
          <Trophy size={10} className="text-yellow-600" />
          <span className="text-xs font-black text-text-dark">{player.victoryPoints}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <StatItem icon={<Home size={10} />} label="Sett." value={player.settlements} />
        <StatItem icon={<Building2 size={10} />} label="Cities" value={player.cities} />
        <StatItem icon={<Map size={10} />} label="Roads" value={player.roads} />
        <StatItem icon={<Trophy size={10} />} label="VPs" value={player.victoryPoints} color="text-yellow-600" />
      </div>

      {/* Resource Snapshot for ALL players */}
      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-black/5">
        {Object.entries(player.resources).map(([res, count]) => (
          res !== 'desert' && (
            <div key={res} className="flex items-center gap-1 bg-white/40 px-1.5 py-0.5 rounded-lg border border-black/5">
              <span className="text-[12px]">
                {res === 'wood' ? '🌲' : res === 'brick' ? '🧱' : res === 'sheep' ? '🐑' : res === 'wheat' ? '🌾' : '⛰️'}
              </span>
              <span className="text-[10px] font-black">{count}</span>
            </div>
          )
        ))}
      </div>
    </motion.div>
  );
});

PlayerCard.displayName = 'PlayerCard';

const BuildingStat: React.FC<{ value: number }> = React.memo(({ value }) => (
  <StatItem icon={<Building2 size={12} />} label="Cities" value={value} />
));

const RoadStat: React.FC<{ value: number }> = React.memo(({ value }) => (
  <StatItem icon={<Map size={12} />} label="Roads" value={value} />
));

const StatItem: React.FC<{ icon: React.ReactNode; label: string; value: number; color?: string }> = React.memo(({ icon, label, value, color }) => (
  <div className="flex items-center gap-2 bg-white/50 p-2 rounded-xl border border-black/5">
    <div className="text-gray-400">{icon}</div>
    <div className="flex flex-col">
      <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-0.5">{label}</span>
      <span className={cn("text-xs font-black leading-none", color || "text-text-dark")}>{value}</span>
    </div>
  </div>
));

StatItem.displayName = 'StatItem';

const ResourceItem: React.FC<{ res: string; count: number }> = React.memo(({ res, count }) => (
  <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-shadow">
    <div className="text-2xl">
      {res === 'wood' ? '🌲' : res === 'brick' ? '🧱' : res === 'sheep' ? '🐑' : res === 'wheat' ? '🌾' : '⛰️'}
    </div>
    <div className="flex flex-col">
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-1">{res}</span>
      <span className="text-lg font-black text-text-dark leading-none">{count}</span>
    </div>
  </div>
));

ResourceItem.displayName = 'ResourceItem';

export const PlayerPanel: React.FC = React.memo(() => {
  const { state, playerId } = useGameState();
  if (!state) return null;
  const players = state.players;
  const currentPlayerIndex = state.currentPlayerIndex;
  
  const myPlayer = useMemo(() => 
    state.isLocal ? players[currentPlayerIndex] : (players.find(p => p.id === playerId) || players[currentPlayerIndex]),
    [players, playerId, currentPlayerIndex, state.isLocal]
  );

  return (
    <div className="w-[300px] flex flex-col gap-8 h-full overflow-y-auto p-8 bg-white/95 backdrop-blur-md border-r border-black/5 shadow-2xl custom-scrollbar z-10">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <User className="text-text-dark/40" size={16} />
          <h3 className="text-[12px] font-black text-text-dark/40 uppercase tracking-[2px]">The Settlers</h3>
        </div>
        
        <div className="space-y-4">
          {players.map((player, index) => {
            const isCurrent = state.currentPlayerIndex === index;
            const isThinking = isCurrent && player.isBot && state.gamePhase !== 'robber' && state.gamePhase !== 'discarding' && state.gamePhase !== 'waiting';
            
            return (
              <div key={player.id} className="relative">
                <PlayerCard 
                  player={player} 
                  isCurrent={isCurrent} 
                />
                <AnimatePresence>
                  {isThinking && (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.8, opacity: 0, y: 10 }}
                      className="absolute -bottom-2 right-4 bg-accent text-text-dark px-3 py-1 rounded-full shadow-lg border-2 border-white flex items-center gap-2 z-20"
                    >
                      <div className="flex gap-0.5">
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-text-dark rounded-full" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-text-dark rounded-full" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-text-dark rounded-full" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Thinking...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto pt-8 border-t border-black/5">
        <div className="flex items-center gap-2 mb-6">
          <Map className="text-text-dark/40" size={16} />
          <h3 className="text-[12px] font-black text-text-dark/40 uppercase tracking-[2px]">Your Resources</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(myPlayer.resources).map(([res, count]) => (
            res !== 'desert' && (
              <ResourceItem key={res} res={res} count={count} />
            )
          ))}
        </div>
      </div>
    </div>
  );
});
