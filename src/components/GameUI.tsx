import React from 'react';
import { Board } from './Board';
import { PlayerPanel } from './PlayerPanel';
import { Dice } from './Dice';
import { Lobby } from './Lobby';
import { WaitingRoom } from './WaitingRoom';
import { DiscardOverlay } from './DiscardOverlay';
import { StealOverlay } from './StealOverlay';
import { Chat } from './Chat';
import { HowToPlay } from './HowToPlay';
import { DemoControls } from './DemoControls';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../contexts/GameContext';
import { Button } from './ui/button';
import { Toaster } from './ui/sonner';
import { ScrollText, History, Trophy, PartyPopper } from 'lucide-react';

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
      <Toaster position="top-center" />
      <DemoControls />
      
      {/* Winner Overlay */}
      {state.winner !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-12 rounded-[48px] shadow-2xl text-center flex flex-col items-center gap-6 max-w-md mx-4"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Trophy size={80} className="text-yellow-500" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="absolute -top-4 -right-4"
              >
                <PartyPopper size={40} className="text-orange-500" />
              </motion.div>
            </div>
            
            <div>
              <h2 className="text-4xl font-black text-text-dark uppercase tracking-tighter mb-2">Victory!</h2>
              <p className="text-xl font-bold text-gray-500">
                {state.players.find(p => p.id === state.winner)?.name} has conquered Katan!
              </p>
            </div>

            <Button 
              onClick={() => window.location.reload()}
              className="w-full bg-text-dark hover:bg-accent hover:text-text-dark font-black py-8 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-sm"
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

      {/* Sidebar - Left */}
      <motion.aside 
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex flex-col gap-4 p-6"
      >
        <PlayerPanel />
        
        {/* AI Thinking Indicator */}
        {state.players[state.currentPlayerIndex].isBot && !state.winner && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-accent text-white p-4 rounded-2xl shadow-lg flex items-center gap-3"
          >
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            <span className="text-xs font-bold">{state.players[state.currentPlayerIndex].name} is thinking...</span>
          </motion.div>
        )}
      </motion.aside>

      {/* Main Game Area */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-4">
        {/* Top Bar */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute top-6 left-6 right-6 flex flex-wrap justify-between items-center gap-4 z-10"
        >
          <div className="flex items-center gap-6">
            <h1 className="font-serif italic text-3xl md:text-4xl text-white drop-shadow-md">
              The Isle of Katan
            </h1>
            <HowToPlay />
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white font-bold text-xs border border-white/10 uppercase tracking-widest">
              Match ID: #{roomId}
            </div>
          </div>
        </motion.div>

        {/* The Board */}
        <div className="w-full h-full flex items-center justify-center overflow-auto custom-scrollbar">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 1, ease: "backOut" }}
            className="relative z-0 scale-75 md:scale-100"
          >
            <Board />
          </motion.div>
        </div>

        {/* Action Panel (Bottom Center) */}
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
        >
          <Dice />
        </motion.div>

        {/* Chat Panel (Floating Bottom Right) */}
        <div className="absolute bottom-6 right-6 z-30">
          <Chat />
        </div>
      </main>

      {/* Activity Log - Right Sidebar (Hidden on small screens) */}
      <motion.aside
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden xl:flex w-72 bg-white/90 backdrop-blur-md border-l border-black/5 flex-col p-6 gap-4"
      >
        <div className="flex items-center gap-2 text-text-dark/60 font-black text-xs uppercase tracking-widest">
          <History size={14} />
          Activity Log
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
          <AnimatePresence initial={false}>
            {state.logs.slice().reverse().map((log, i) => (
              <motion.div
                key={`${i}-${log}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[13px] font-medium text-text-dark/80 bg-white p-3 rounded-xl border border-black/5 shadow-sm"
              >
                {log}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.aside>
    </div>
  );
};
