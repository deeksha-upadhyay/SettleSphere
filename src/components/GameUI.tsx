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
import { ActivityLog } from './ActivityLog';
import { motion, AnimatePresence } from 'motion/react';
import { useGameState, useActivity } from '../contexts/GameContext';
import { Button } from './ui/button';
import { Toaster } from './ui/sonner';
import { ScrollText, History, Trophy, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';

export const GameUI: React.FC = React.memo(() => {
  const { state, roomId, playerId } = useGameState();
  const { logs } = useActivity();
  const [showYourTurn, setShowYourTurn] = React.useState(false);
  const [showRobberAlert, setShowRobberAlert] = React.useState(false);

  React.useEffect(() => {
    if (!state || !playerId) return;
    const isMyTurn = state.players[state.currentPlayerIndex].id === playerId;
    if (isMyTurn && state.gamePhase !== 'waiting') {
      setShowYourTurn(true);
      const timer = setTimeout(() => setShowYourTurn(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [state?.currentPlayerIndex, playerId]);

  React.useEffect(() => {
    if (state?.gamePhase === 'robber') {
      setShowRobberAlert(true);
      const timer = setTimeout(() => setShowRobberAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [state?.gamePhase]);

  if (!state) {
    return <Lobby />;
  }

  if (state.gamePhase === 'waiting') {
    return <WaitingRoom />;
  }

  return (
    <div className="min-h-screen w-full bg-sea flex overflow-hidden font-sans text-text-dark relative">
      <Toaster position="top-right" closeButton richColors />
      <DemoControls />

      {/* Your Turn Overlay */}
      <AnimatePresence>
        {showYourTurn && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: -100, rotateX: 45 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              y: 0, 
              rotateX: 0,
              boxShadow: ['0 0 20px rgba(244,208,63,0)', '0 0 50px rgba(244,208,63,0.6)', '0 0 20px rgba(244,208,63,0)']
            }}
            exit={{ scale: 1.5, opacity: 0, y: 100, rotateX: -45 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 15,
              boxShadow: { repeat: Infinity, duration: 1.5 }
            }}
            className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-none perspective-1000"
          >
            <div className="relative">
              <div className="bg-accent text-text-dark px-16 py-8 rounded-[48px] shadow-2xl border-4 border-white/60 backdrop-blur-md overflow-hidden">
                <motion.div 
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-20"
                />
                <h2 className="text-7xl font-black uppercase tracking-tighter italic relative z-10 drop-shadow-lg">Your Turn!</h2>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl border-2 border-accent"
              >
                <PartyPopper size={24} className="text-accent" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Robber Alert */}
      <AnimatePresence>
        {showRobberAlert && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed top-24 right-6 z-[110]"
          >
            <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-red-400">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-xl">👤</span>
              </div>
              <div>
                <p className="font-black uppercase tracking-widest text-xs">Alert</p>
                <p className="font-bold">Robber Activated!</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
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
      <ActivityLog logs={logs} />
    </div>
  );
});

GameUI.displayName = 'GameUI';
