import React from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { useGame } from '../contexts/GameContext';
import { cn } from '@/lib/utils';

export const Dice: React.FC = () => {
  const { state, rollDice, endTurn } = useGame();
  const currentPlayer = state.players[state.currentPlayerIndex];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-accent px-6 py-3 rounded-full font-bold text-text-dark shadow-lg text-sm tracking-wider flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full animate-pulse", currentPlayer.color)} />
        {currentPlayer.name.toUpperCase()}'S TURN
      </div>
      <div className="bg-white p-5 rounded-[20px] shadow-lg flex gap-3 items-center border border-gray-100">
        <Die value={state.dice[0]} />
        <Die value={state.dice[1]} />
      </div>
      <div className="flex gap-2 w-full">
        <Button 
          onClick={rollDice}
          disabled={state.hasRolled}
          className="flex-1 bg-text-dark hover:bg-[#4F5D75] text-white font-bold py-7 rounded-xl shadow-lg transition-all uppercase tracking-widest text-sm disabled:opacity-50"
        >
          Roll Dice
        </Button>
        <Button 
          onClick={endTurn}
          disabled={!state.hasRolled}
          className="flex-1 bg-accent hover:bg-[#FFD166]/80 text-text-dark font-bold py-7 rounded-xl shadow-lg transition-all uppercase tracking-widest text-sm disabled:opacity-50"
        >
          End Turn
        </Button>
      </div>
    </div>
  );
};

const Die: React.FC<{ value: number }> = ({ value }) => (
  <motion.div 
    whileHover={{ rotate: 5 }}
    className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center border-2 border-text-dark"
  >
    <span className="text-2xl font-bold text-text-dark">{value}</span>
  </motion.div>
);
