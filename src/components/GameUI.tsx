import React from 'react';
import { Board } from './Board';
import { PlayerPanel } from './PlayerPanel';
import { Dice } from './Dice';
import { motion } from 'motion/react';

export const GameUI: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-sea flex overflow-hidden font-sans text-text-dark relative">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <PlayerPanel />
      </motion.aside>

      {/* Main Game Area */}
      <main className="flex-1 relative flex flex-col items-center justify-center">
        {/* Top Bar */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute top-8 left-8 right-8 flex justify-between items-center z-10"
        >
          <h1 className="font-serif italic text-4xl text-white drop-shadow-md">
            The Isle of Katan
          </h1>
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-white font-semibold text-sm border border-white/10">
            Match ID: #4492-X
          </div>
        </motion.div>

        {/* The Board */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 1, ease: "backOut" }}
          className="relative z-0"
        >
          <Board />
        </motion.div>

        {/* Action Panel (Floating Bottom Right) */}
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="absolute bottom-10 right-10 z-20"
        >
          <Dice />
        </motion.div>
      </main>
    </div>
  );
};
