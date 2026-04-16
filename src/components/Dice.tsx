import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { useGame } from '../contexts/GameContext';
import { cn } from '@/lib/utils';
import { RotateCcw, Play, CheckCircle2, AlertCircle } from 'lucide-react';

export const Dice: React.FC = () => {
  const { state, rollDice: contextRollDice, endTurn, playerId } = useGame();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  
  if (!state) return null;
  
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isMyTurn = currentPlayer.id === playerId;

  const handleRollDice = () => {
    if (!isMyTurn || isRolling) return;
    setIsRolling(true);
    // Simulate rolling for 1.2s before calling context roll
    setTimeout(() => {
      contextRollDice();
      setIsRolling(false);
    }, 1200);
  };

  if (state.gamePhase === 'setup') {
    return (
      <div className="flex flex-col items-center gap-4">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-orange-100 px-6 py-3 rounded-full font-bold text-orange-800 shadow-lg text-sm tracking-wider flex items-center gap-2 border border-orange-200"
        >
          <div className={cn("w-2 h-2 rounded-full animate-pulse", currentPlayer.color)} />
          {isMyTurn ? "YOUR TURN: PLACE SETTLEMENT & ROAD" : `${currentPlayer.name.toUpperCase()}'S TURN: INITIAL PLACEMENT`}
        </motion.div>
        <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/20 text-xs font-bold text-text-dark/40 uppercase tracking-widest">
          Setup Phase
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div 
        key={state.currentPlayerIndex}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-accent px-6 py-3 rounded-full font-bold text-text-dark shadow-lg text-sm tracking-wider flex items-center gap-2"
      >
        <div className={cn("w-2 h-2 rounded-full animate-pulse", currentPlayer.color)} />
        {isMyTurn ? "YOUR TURN" : `${currentPlayer.name.toUpperCase()}'S TURN`}
      </motion.div>

      <div className="bg-white/90 backdrop-blur-md p-6 rounded-[32px] shadow-2xl flex flex-col gap-6 items-center border border-white/20">
        <div className="flex gap-4 items-center">
          <Die value={state.dice[0]} rolling={isRolling || (!state.hasRolled && isMyTurn)} />
          <Die value={state.dice[1]} rolling={isRolling || (!state.hasRolled && isMyTurn)} />
          <div className="ml-2 flex flex-col items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</span>
            <motion.span 
              key={state.dice[0] + state.dice[1]}
              initial={{ scale: 1.5, color: '#E63946' }}
              animate={{ scale: 1, color: '#2D3436' }}
              className="text-2xl font-black text-text-dark"
            >
              {state.dice[0] + state.dice[1]}
            </motion.span>
          </div>
        </div>

        <div className="flex gap-3 w-full min-w-[280px]">
          {!state.hasRolled ? (
            <Button 
              onClick={handleRollDice}
              disabled={!isMyTurn || isRolling}
              className="flex-1 bg-text-dark hover:bg-accent hover:text-text-dark font-black py-8 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs gap-2 disabled:opacity-50 relative overflow-hidden"
            >
              {isRolling && (
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.2, ease: "linear" }}
                  className="absolute inset-0 bg-white/20"
                />
              )}
              <RotateCcw size={16} className={cn(isRolling && "animate-spin")} />
              {isRolling ? "Rolling..." : "Roll Dice"}
            </Button>
          ) : (
            <div className="flex-1 flex gap-2">
              <AnimatePresence mode="wait">
                {!showConfirm ? (
                  <motion.div
                    key="end-btn"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex-1"
                  >
                    <Button 
                      onClick={() => setShowConfirm(true)}
                      disabled={!isMyTurn}
                      className="w-full bg-accent hover:bg-accent-dark text-text-dark font-black py-8 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} />
                      End Turn
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="confirm-btns"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex-1 flex gap-2"
                  >
                    <Button 
                      onClick={() => setShowConfirm(false)}
                      variant="outline"
                      className="flex-1 border-gray-200 hover:bg-gray-50 text-gray-500 font-bold py-8 rounded-2xl text-xs uppercase tracking-widest"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => {
                        endTurn();
                        setShowConfirm(false);
                      }}
                      className="flex-[2] bg-green-500 hover:bg-green-600 text-white font-black py-8 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs gap-2"
                    >
                      Confirm End
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Die: React.FC<{ value: number; rolling?: boolean }> = ({ value, rolling }) => (
  <motion.div 
    animate={rolling ? { 
      rotate: [0, 90, 180, 270, 360],
      scale: [1, 1.1, 1],
      y: [0, -20, 0],
    } : {
      rotate: 0,
      scale: 1,
      y: 0,
    }}
    transition={rolling ? { 
      repeat: Infinity, 
      duration: 0.4,
      ease: "easeInOut"
    } : {
      type: "spring",
      stiffness: 260,
      damping: 20
    }}
    className="w-16 h-16 bg-white rounded-2xl shadow-inner flex items-center justify-center border-2 border-gray-100 relative overflow-hidden group"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 opacity-50" />
    <AnimatePresence mode="wait">
      <motion.span 
        key={value}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-3xl font-black text-text-dark relative z-10"
      >
        {value}
      </motion.span>
    </AnimatePresence>
    
    {/* Pips for visual flair */}
    <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-gray-200 rounded-full" />
    <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-gray-200 rounded-full" />
  </motion.div>
);
