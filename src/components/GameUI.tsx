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
import { ScrollText, History, Trophy, PartyPopper, X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export const GameUI: React.FC = React.memo(() => {
  const { state, roomId, playerId } = useGameState();
  const { logs } = useActivity();
  const [showYourTurn, setShowYourTurn] = React.useState(false);
  const [showRobberAlert, setShowRobberAlert] = React.useState(false);
  const [isPlayerPanelOpen, setIsPlayerPanelOpen] = React.useState(false);
  const [isLogOpen, setIsLogOpen] = React.useState(false);

  React.useEffect(() => {
    if (!state || !playerId) return;
    const isMyTurn = state.isLocal || state.players[state.currentPlayerIndex].id === playerId;
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

      {/* Mobile Sidebar Toggles */}
      <div className="fixed top-20 left-4 z-40 lg:hidden flex flex-col gap-2">
        <Button 
          variant="secondary" 
          size="icon" 
          className="rounded-full shadow-lg bg-white/90 backdrop-blur-sm"
          onClick={() => setIsPlayerPanelOpen(!isPlayerPanelOpen)}
        >
          <Trophy size={20} className="text-yellow-600" />
        </Button>
        <Button 
          variant="secondary" 
          size="icon" 
          className="rounded-full shadow-lg bg-white/90 backdrop-blur-sm xl:hidden"
          onClick={() => setIsLogOpen(!isLogOpen)}
        >
          <History size={20} className="text-text-dark/60" />
        </Button>
      </div>

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
                <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter italic relative z-10 drop-shadow-lg">Your Turn!</h2>
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

      {/* Robber Alert - Adjusted to not overlap sidebar */}
      <AnimatePresence>
        {showRobberAlert && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[110]"
          >
            <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-red-400 backdrop-blur-md">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-xl">👤</span>
              </div>
              <div>
                <p className="font-black uppercase tracking-widest text-[10px]">Alert</p>
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

      {/* Sidebar - Left (Desktop: Fixed, Mobile: Animated Sheet) */}
      <AnimatePresence>
        {(isPlayerPanelOpen || window.innerWidth >= 1024) && (
          <motion.aside 
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            className={cn(
              "fixed lg:static inset-y-0 left-0 z-50 lg:z-10 flex flex-col gap-4",
              !isPlayerPanelOpen && "hidden lg:flex"
            )}
          >
            <div className="relative h-full">
              {isPlayerPanelOpen && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-4 right-4 lg:hidden rounded-full hover:bg-black/5"
                  onClick={() => setIsPlayerPanelOpen(false)}
                >
                  <X size={20} />
                </Button>
              )}
              <PlayerPanel />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay for mobile sidebar */}
      <AnimatePresence>
        {isPlayerPanelOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsPlayerPanelOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Game Area */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-4">
        {/* Top Bar */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute top-6 left-6 right-6 flex flex-wrap justify-between items-center gap-4 z-10 pointer-events-none"
        >
          <div className="flex items-center gap-6 pointer-events-auto">
            <h1 className="font-serif italic text-2xl md:text-4xl text-white drop-shadow-md">
              The Isle of Katan
            </h1>
            <HowToPlay />
          </div>
          <div className="flex items-center gap-4 pointer-events-auto">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white font-bold text-[10px] border border-white/10 uppercase tracking-widest hidden sm:block">
              Match ID: #{roomId}
            </div>
          </div>
        </motion.div>

        {/* The Board */}
        <div className="w-full h-full flex items-center justify-center overflow-auto custom-scrollbar pt-16 pb-24 lg:pt-0 lg:pb-0">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 1, ease: "backOut" }}
            className="relative z-0 scale-[0.6] sm:scale-75 md:scale-90 lg:scale-100"
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

        {/* Chat Panel (Floating Bottom Right) - Shifted to avoid overlap on mobile */}
        <div className="absolute bottom-6 right-6 z-30 sm:bottom-8 sm:right-8">
          <Chat />
        </div>
      </main>

      {/* Activity Log - Right Sidebar (Desktop: Fixed, Mobile: Toggleable) */}
      <AnimatePresence>
        {(isLogOpen || window.innerWidth >= 1280) && (
          <motion.aside 
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className={cn(
              "fixed xl:static inset-y-0 right-0 z-50 xl:z-10 flex flex-col",
              !isLogOpen && "hidden xl:flex"
            )}
          >
            <div className="relative h-full flex flex-col">
              {isLogOpen && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-4 left-4 xl:hidden rounded-full hover:bg-black/5"
                  onClick={() => setIsLogOpen(false)}
                >
                  <X size={20} />
                </Button>
              )}
              <ActivityLog logs={logs} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay for mobile log */}
      <AnimatePresence>
        {isLogOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLogOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 xl:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
});

GameUI.displayName = 'GameUI';
