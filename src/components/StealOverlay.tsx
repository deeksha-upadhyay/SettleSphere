import React from 'react';
import { useGame } from '../contexts/GameContext';
import { Button } from './ui/button';
import { Hand } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export const StealOverlay: React.FC = () => {
  const { state, playerId, stealCard } = useGame();

  if (!state) return null;

  const isCurrentPlayer = state.players[state.currentPlayerIndex].id === playerId;
  const hasVictims = state.gamePhase === 'robber' && state.victims && state.victims.length > 0;

  return (
    <AnimatePresence>
      {hasVictims && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          {!isCurrentPlayer ? (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-white p-8 rounded-3xl shadow-2xl text-center"
            >
              <p className="text-lg font-bold text-text-dark uppercase tracking-widest animate-pulse">
                Waiting for {state.players[state.currentPlayerIndex].name} to steal...
              </p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md flex flex-col gap-8"
            >
              <div className="text-center">
                <motion.div 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-accent/20 text-accent-dark rounded-full mb-4"
                >
                  <Hand size={32} />
                </motion.div>
                <h2 className="text-3xl font-black text-text-dark uppercase tracking-tighter">Steal a Card</h2>
                <p className="text-gray-500 font-medium">Choose a player to steal a random resource from.</p>
              </div>

              <div className="flex flex-col gap-3">
                {state.victims!.map((victimId) => {
                  const victim = state.players.find(p => p.id === victimId);
                  if (!victim) return null;
                  return (
                    <motion.button
                      key={victimId}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => stealCard(victimId)}
                      className="flex items-center gap-4 p-5 bg-gray-50 hover:bg-accent hover:text-text-dark rounded-2xl border border-gray-100 transition-all group text-left"
                    >
                      <div className={`w-4 h-4 rounded-full ${victim.color}`} />
                      <span className="font-bold text-lg">{victim.name}</span>
                      <span className="ml-auto text-xs font-black text-gray-400 group-hover:text-text-dark/40 uppercase">
                        {Object.values(victim.resources).reduce((a, b) => (a as number) + (b as number), 0)} Cards
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};
