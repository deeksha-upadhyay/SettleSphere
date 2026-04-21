import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { useGameState, useGameActions } from '../contexts/GameContext';
import { cn } from '@/lib/utils';
import { RotateCcw, Play, CheckCircle2, AlertCircle, Home } from 'lucide-react';

export const Dice: React.FC = React.memo(() => {
  const { state, playerId } = useGameState();
  const { rollDice: contextRollDice, endTurn } = useGameActions();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  
  if (!state) return null;
  
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isMyTurn = state.isLocal || currentPlayer.id === playerId;

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
          className="bg-orange-600 px-8 py-4 rounded-[28px] font-black text-white shadow-2xl text-base tracking-tighter flex items-center gap-3 border-b-4 border-orange-800 active:translate-y-1 transition-all"
        >
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
            <Home size={20} />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] opacity-70 uppercase tracking-widest mb-1">Current Turn</span>
            <span className="text-xl">{isMyTurn ? "YOUR TURN: SETTLE" : `${currentPlayer.name.toUpperCase()}: SETTLING`}</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Dynamic Status Bar */}
      <motion.div 
        key={state.currentPlayerIndex + (isRolling ? 'rolling' : 'normal')}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "px-8 py-4 rounded-[28px] font-black shadow-2xl text-base tracking-tighter flex items-center gap-4 border-b-4 transition-all min-w-[320px]",
          isMyTurn ? "bg-accent text-text-dark border-accent-dark" : "bg-white text-text-dark border-gray-200"
        )}
      >
        <div className={cn("w-10 h-10 rounded-full shadow-inner border-2 border-white flex items-center justify-center text-white", currentPlayer.color)}>
           {isRolling ? <RotateCcw size={20} className="animate-spin" /> : <Play size={20} fill="currentColor" />}
        </div>
        <div className="flex flex-col items-start leading-tight">
          <span className="text-[10px] opacity-60 uppercase tracking-widest mb-0.5">
            {isRolling ? "Action" : "Current Turn"}
          </span>
          <span className="text-lg font-black truncate max-w-[200px]">
            {isRolling 
              ? `${currentPlayer.name} is rolling...` 
              : isMyTurn 
                ? "IT'S YOUR TURN" 
                : `${currentPlayer.name.toUpperCase()}'S TURN`
            }
          </span>
        </div>
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
            <div className="flex-1 relative">
              {isMyTurn && !isRolling && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-accent rounded-2xl blur-lg"
                />
              )}
              <Button 
                onClick={handleRollDice}
                disabled={!isMyTurn || isRolling}
                className={cn(
                  "w-full bg-text-dark hover:bg-accent hover:text-text-dark font-black py-8 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs gap-2 disabled:opacity-50 relative overflow-hidden",
                  isMyTurn && !isRolling && "ring-2 ring-accent/50 animate-pulse"
                )}
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
            </div>
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
});

const Die: React.FC<{ value: number; rolling?: boolean }> = React.memo(({ value, rolling }) => (
  <motion.div 
    animate={rolling ? { 
      rotate: [0, 15, -15, 30, -30, 360],
      scale: [1, 1.15, 0.9, 1.2, 1],
      y: [0, -40, 5, -20, 0],
      x: [0, 10, -10, 5, 0],
    } : {
      rotate: 0,
      scale: 1,
      y: 0,
      x: 0,
    }}
    transition={rolling ? { 
      repeat: Infinity, 
      duration: 0.6,
      ease: "linear"
    } : {
      type: "spring",
      stiffness: 400,
      damping: 15
    }}
    className="w-16 h-16 bg-white rounded-2xl shadow-inner flex items-center justify-center border-2 border-gray-100 relative overflow-hidden group"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-100 opacity-50" />
    <AnimatePresence mode="wait">
      <motion.div 
        key={value}
        initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 1.5, rotate: 45 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
        className="text-3xl font-black text-text-dark relative z-10"
      >
        {value}
      </motion.div>
    </AnimatePresence>
    
    {!rolling && (
      <motion.div 
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0, scale: 2 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 bg-accent/30 rounded-2xl z-0"
      />
    )}

    {/* Pips for visual style */}
    <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-gray-200 rounded-full" />
    <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 bg-gray-200 rounded-full" />
    <div className="absolute top-1.5 left-1.5 w-1 h-1 bg-gray-100 rounded-full" />
    <div className="absolute bottom-1.5 right-1.5 w-1 h-1 bg-gray-100 rounded-full" />
  </motion.div>
));

Die.displayName = 'Die';
