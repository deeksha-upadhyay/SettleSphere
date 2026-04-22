import React, { useMemo, useState, useEffect } from 'react';
import { Player } from '../types';
import { cn } from '@/lib/utils';
import { useGameState, useGameActions } from '../contexts/GameContext';
import { User, Home, Building2, Map, Trophy, Pencil, Check, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PlayerCard: React.FC<{ 
  player: Player; 
  isCurrent: boolean; 
  isMe: boolean;
  onUpdateName: (name: string) => void;
}> = React.memo(({ player, isCurrent, isMe, onUpdateName }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(player.name);

  useEffect(() => {
    setEditedName(player.name);
  }, [player.name]);

  const handleSave = () => {
    if (editedName.trim() && editedName !== player.name) {
      onUpdateName(editedName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditedName(player.name);
      setIsEditing(false);
    }
  };

  return (
    <motion.div 
      initial={false}
      layout
      animate={isCurrent ? {
        scale: 1.02,
        borderColor: '#F4D03F',
        boxShadow: ['0 0 10px rgba(244, 208, 63, 0.1)', '0 0 20px rgba(244, 208, 63, 0.3)', '0 0 10px rgba(244, 208, 63, 0.1)'],
        opacity: 1,
      } : {
        scale: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        boxShadow: 'none',
        opacity: 0.9,
      }}
      transition={isCurrent ? {
        boxShadow: { repeat: Infinity, duration: 2, ease: "easeInOut" },
        default: { type: "spring", stiffness: 300, damping: 25 }
      } : { duration: 0.5 }}
      className={cn(
        "p-4 rounded-[24px] transition-all duration-300 border relative overflow-hidden group/card",
        isCurrent ? "bg-white shadow-xl z-10" : "bg-gray-50/50"
      )}
    >
      {isCurrent && (
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute top-0 right-0 bg-accent px-3 py-1 rounded-bl-2xl text-[9px] font-black text-text-dark uppercase tracking-widest z-20"
        >
          Turn
        </motion.div>
      )}
      
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("w-10 h-10 rounded-full shadow-inner border-4 border-white shrink-0 shadow-lg", player.color)} />
        <div className="flex flex-col min-w-0 flex-1">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="w-full bg-white border-b-2 border-accent text-sm font-black text-text-dark outline-none py-0.5"
                maxLength={15}
              />
            </div>
          ) : (
            <div className="flex items-center gap-1 group/name">
              <span className="font-black text-sm text-text-dark leading-none truncate">{player.name}</span>
              {isMe && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="opacity-0 group-hover/name:opacity-100 transition-opacity p-1 hover:bg-black/5 rounded-full"
                >
                  <Pencil size={10} className="text-gray-400" />
                </button>
              )}
            </div>
          )}
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            {player.isBot ? "AI Companion" : `Player ${player.id}`} {isMe && "(You)"}
          </span>
        </div>
        <div className="bg-yellow-50 px-2 py-1.5 rounded-xl border border-yellow-100 flex flex-col items-center gap-0.5 shrink-0">
          <Trophy size={11} className="text-yellow-600" />
          <span className="text-[10px] font-black text-yellow-700 leading-none">{player.victoryPoints}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <StatItem icon={<Home size={11} />} label="Sett." value={player.settlements} />
        <StatItem icon={<Building2 size={11} />} label="Cities" value={player.cities} />
        <StatItem icon={<Map size={11} />} label="Roads" value={player.roads} />
        <StatItem icon={<Trophy size={11} />} label="VPs" value={player.victoryPoints} color="text-yellow-600" />
      </div>

      {/* Resource Snapshot */}
      <div className="flex flex-wrap gap-1.5 pt-4 border-t border-black/5">
        {Object.entries(player.resources).map(([res, count]) => (
          res !== 'desert' && (
            <div key={res} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-black/5 shadow-sm">
              <span className="text-sm">
                {res === 'wood' ? '🌲' : res === 'brick' ? '🧱' : res === 'sheep' ? '🐑' : res === 'wheat' ? '🌾' : '⛰️'}
              </span>
              <span className="text-[11px] font-black text-text-dark">{count}</span>
            </div>
          )
        ))}
      </div>
    </motion.div>
  );
});

PlayerCard.displayName = 'PlayerCard';

const StatItem: React.FC<{ icon: React.ReactNode; label: string; value: number; color?: string }> = React.memo(({ icon, label, value, color }) => (
  <div className="flex items-center gap-2 bg-white/60 px-2 py-1.5 rounded-xl border border-black/5">
    <div className="text-gray-400 shrink-0">{icon}</div>
    <div className="flex flex-col min-w-0">
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-0.5 truncate">{label}</span>
      <span className={cn("text-xs font-black leading-none", color || "text-text-dark")}>{value}</span>
    </div>
  </div>
));

StatItem.displayName = 'StatItem';

const ResourceItem: React.FC<{ res: string; count: number }> = React.memo(({ res, count }) => (
  <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 border-b-2 border-b-gray-100">
    <div className="text-3xl filter drop-shadow-sm">
      {res === 'wood' ? '🌲' : res === 'brick' ? '🧱' : res === 'sheep' ? '🐑' : res === 'wheat' ? '🌾' : '⛰️'}
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-1">{res}</span>
      <span className="text-xl font-black text-text-dark leading-none">{count}</span>
    </div>
  </div>
));

ResourceItem.displayName = 'ResourceItem';

export const PlayerPanel: React.FC = React.memo(() => {
  const { state, playerId } = useGameState();
  const { updatePlayerName } = useGameActions();
  const [collapsed, setCollapsed] = useState(false);

  if (!state) return null;
  
  const players = state.players;
  const currentPlayerIndex = state.currentPlayerIndex;
  
  const myPlayer = useMemo(() => 
    state.isLocal ? players[currentPlayerIndex] : (players.find(p => p.id === playerId) || players[currentPlayerIndex]),
    [players, playerId, currentPlayerIndex, state.isLocal]
  );

  return (
    <motion.div 
      animate={{ width: collapsed ? 80 : 320 }}
      className="h-full flex flex-col relative bg-white/95 backdrop-blur-xl border-r border-black/10 shadow-2xl z-10 overflow-hidden"
    >
      {/* Toggle button */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-8 right-2 transform translate-x-1/2 w-6 h-6 bg-white border border-black/5 rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-gray-50 transition-colors"
      >
        <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
           <CloseIcon size={12} className="text-gray-400" />
        </motion.div>
      </button>

      <div className={cn("flex-1 flex flex-col gap-8 p-8 overflow-y-auto custom-scrollbar", collapsed && "items-center overflow-x-hidden p-4 pt-12")}>
        <div className="space-y-6">
          <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
            <User className="text-text-dark/40" size={16} />
            {!collapsed && <h3 className="text-[12px] font-black text-text-dark/40 uppercase tracking-[2px]">The Settlers</h3>}
          </div>
          
          <div className="space-y-4">
            {players.map((player, index) => {
              const isCurrent = state.currentPlayerIndex === index;
              const isThinking = isCurrent && player.isBot && state.gamePhase !== 'robber' && state.gamePhase !== 'discarding' && state.gamePhase !== 'waiting';
              const isMe = state.isLocal ? true : player.id === playerId;
              
              if (collapsed) {
                return (
                  <div key={player.id} className="relative">
                    <motion.div 
                      className={cn(
                        "w-12 h-12 rounded-full border-4 shadow-lg transition-transform", 
                        player.color,
                        isCurrent ? "border-accent scale-110" : "border-white"
                      )}
                    />
                    {isCurrent && <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-white animate-pulse" />}
                  </div>
                );
              }

              return (
                <div key={player.id} className="relative">
                  <PlayerCard 
                    player={player} 
                    isCurrent={isCurrent} 
                    isMe={isMe}
                    onUpdateName={(name) => updatePlayerName(name, player.id)}
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

        {!collapsed && (
          <div className="mt-6 pt-10 border-t border-black/5 bg-gradient-to-b from-transparent to-gray-50/30 rounded-b-3xl">
            <div className="flex items-center gap-2 mb-6 px-2">
              <Map className="text-text-dark/40" size={16} />
              <h3 className="text-[12px] font-black text-text-dark/40 uppercase tracking-[2px]">Inventory</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3 px-2">
              {Object.entries(myPlayer.resources).map(([res, count]) => (
                res !== 'desert' && (
                  <ResourceItem key={res} res={res} count={count} />
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});
