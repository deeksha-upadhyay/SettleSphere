import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { Button } from './ui/button';
import { motion } from 'motion/react';
import { ResourceType } from '../types';
import { Minus, Plus, AlertCircle } from 'lucide-react';

export const DiscardOverlay: React.FC = () => {
  const { state, playerId, discardCards } = useGame();
  const [toDiscard, setToDiscard] = useState<Record<ResourceType, number>>({
    wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0, desert: 0
  });

  if (!state || state.gamePhase !== 'discarding') return null;

  const player = state.players.find(p => p.id === playerId);
  if (!player || !state.discardingPlayers.includes(player.id)) {
    return (
      <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white p-8 rounded-3xl shadow-2xl text-center"
        >
          <p className="text-lg font-bold text-text-dark uppercase tracking-widest animate-pulse">
            Waiting for others to discard...
          </p>
        </motion.div>
      </div>
    );
  }

  const totalResources = Object.values(player.resources).reduce((a, b) => (a as number) + (b as number), 0) as number;
  const requiredDiscard = Math.floor(totalResources / 2);
  const currentDiscardTotal = Object.values(toDiscard).reduce((a, b) => (a as number) + (b as number), 0) as number;

  const handleAdjust = (res: ResourceType, delta: number) => {
    const newVal = toDiscard[res] + delta;
    if (newVal >= 0 && newVal <= player.resources[res]) {
      setToDiscard({ ...toDiscard, [res]: newVal });
    }
  };

  const handleSubmit = () => {
    if (currentDiscardTotal === requiredDiscard) {
      discardCards(toDiscard);
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-md flex items-center justify-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-lg flex flex-col gap-8"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-3xl font-black text-text-dark uppercase tracking-tighter">The Robber Strikes!</h2>
          <p className="text-gray-500 font-medium">You have too many resources. Discard half.</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Cards</span>
            <span className={`text-sm font-black px-3 py-1 rounded-full ${currentDiscardTotal === requiredDiscard ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
              {currentDiscardTotal} / {requiredDiscard}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(['wood', 'brick', 'sheep', 'wheat', 'ore'] as ResourceType[]).map((res) => (
              <div key={res} className="flex items-center justify-between bg-white p-3 rounded-2xl border border-gray-100">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">{res}</span>
                  <span className="text-sm font-bold text-text-dark">Have: {player.resources[res]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleAdjust(res, -1)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-4 text-center font-black text-text-dark">{toDiscard[res]}</span>
                  <button 
                    onClick={() => handleAdjust(res, 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={currentDiscardTotal !== requiredDiscard}
          className="w-full bg-text-dark hover:bg-accent hover:text-text-dark py-8 rounded-2xl text-lg font-bold transition-all disabled:opacity-50"
        >
          Confirm Discard
        </Button>
      </motion.div>
    </div>
  );
};
