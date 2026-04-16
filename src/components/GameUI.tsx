import React from 'react';
import { Board } from './Board';
import { PlayerPanel } from './PlayerPanel';
import { Dice } from './Dice';
import { Lobby } from './Lobby';
import { WaitingRoom } from './WaitingRoom';
import { DiscardOverlay } from './DiscardOverlay';
import { StealOverlay } from './StealOverlay';
import { Chat } from './Chat';
import { motion } from 'motion/react';
import { useGame } from '../contexts/GameContext';
import { Button } from './ui/button';

export const GameUI: React.FC = () => {
  const { state, roomId } = useGame();

  if (!state) {
    return <Lobby />;
  }

  if (state.gamePhase === 'waiting') {
    return <WaitingRoom />;
  }

  return (
    <div className="min-h-screen w-full bg-sea flex overflow-hidden font-sans text-text-dark relative">
      {/* Winner Overlay */}
      {state.winner !== null && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-12 rounded-[40px] shadow-2xl text-center flex flex-col items-center gap-6"
          >
            <div className="text-6xl">🏆</div>
            <h2 className="text-5xl font-black text-text-dark">
              {state.players.find(p => p.id === state.winner)?.name} WINS!
            </h2>
            <p className="text-xl text-gray-500">Congratulations on conquering Katan!</p>
            <Button 
              onClick={() => window.location.reload()}
              className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-12 py-8 rounded-2xl text-xl font-bold"
            >
              Play Again
            </Button>
          </motion.div>
        </div>
      )}

      {/* Discard Overlay */}
      <DiscardOverlay />

      {/* Steal Overlay */}
      <StealOverlay />

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
            Match ID: #{roomId}
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

        {/* Chat Panel (Floating Bottom Left) */}
        <Chat />
      </main>
    </div>
  );
};
