import React from 'react';
import { useGame } from '../contexts/GameContext';
import { Hand, User } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ResourceType } from '../types';

export const StealOverlay: React.FC = () => {
  const { state, playerId, stealCard } = useGame();

  if (!state || playerId === null) return null;

  const currentPlayer = state.players[state.currentPlayerIndex];
  const isMyTurn = state.isLocal || currentPlayer.id === playerId;
  const hasVictims = state.gamePhase === 'robber' && state.victims && state.victims.length > 0;

  const getResourceCount = (resources: Record<string, number>) => {
    return Object.entries(resources).reduce((sum, [key, count]) => {
      if (key === 'desert') return sum;
      return sum + count;
    }, 0);
  };

  return (
    <AnimatePresence>
      {hasVictims && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          {!isMyTurn ? (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-white p-10 rounded-[40px] shadow-2xl text-center max-w-sm"
            >
              <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Hand size={32} />
              </div>
              <p className="text-xl font-black text-text-dark uppercase tracking-tighter mb-2">
                Theft in Progress
              </p>
              <p className="text-gray-500 font-medium leading-tight">
                Waiting for <span className="text-text-dark font-bold">{currentPlayer.name}</span> to steal a card...
              </p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md flex flex-col gap-8 border-4 border-white/20"
            >
              <div className="text-center">
                <motion.div 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-accent/20 text-accent-dark rounded-full mb-4 shadow-inner"
                >
                  <Hand size={32} />
                </motion.div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-3xl font-black text-text-dark uppercase tracking-tighter">Steal a Card</h2>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Stealing As:</span>
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                      <div className={`w-2 h-2 rounded-full ${currentPlayer.color}`} />
                      <span className="text-[10px] font-bold text-text-dark">{currentPlayer.name}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {state.victims.map((victimId) => {
                  const victim = state.players.find(p => p.id === victimId);
                  if (!victim) return null;
                  const cardCount = getResourceCount(victim.resources);
                  
                  return (
                    <motion.button
                      key={victimId}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => stealCard(victimId)}
                      className="flex items-center gap-4 p-5 bg-gray-50 hover:bg-accent hover:border-accent group rounded-2xl border-2 border-transparent transition-all text-left shadow-sm"
                    >
                      <div className={`w-12 h-12 rounded-xl ${victim.color} flex items-center justify-center shadow-md border-2 border-white`}>
                        <User size={20} className="text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-lg text-text-dark leading-none mb-1 group-hover:text-text-dark">{victim.name}</span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-text-dark/60">
                          Potential Victim
                        </span>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="text-xl font-black text-text-dark leading-none">{cardCount}</div>
                        <div className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">Cards</div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-[0.2em] px-8 leading-relaxed">
                Choose a player to steal one random resource card from their hand.
              </p>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};
