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
import { UserMenu } from './Auth/UserMenu';
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
    <div className="h-screen w-full bg-[#f8f9fa] flex overflow-hidden font-sans text-text-dark relative">
      <Toaster position="top-right" closeButton richColors />
      <DemoControls />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Player Info) */}
        <div className="hidden lg:block shrink-0">
          <PlayerPanel />
        </div>

        {/* Center Game Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_center,_#ffffff_0%,_#f1f1f1_100%)]">
          {/* Top Bar */}
          <div className="h-16 w-full bg-white/80 backdrop-blur-md border-b border-black/5 flex items-center justify-between px-6 z-40">
            {/* ... */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Room ID</span>
                <span className="text-xs font-black text-text-dark leading-none">{roomId}</span>
              </div>
              <div className="h-8 w-px bg-black/5" />
              <div className="bg-text-dark text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                {state.gamePhase} phase
              </div>
            </div>

            <div className="flex items-center justify-center absolute left-1/2 -translate-x-1/2">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={state.currentPlayerIndex}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className={cn(
                    "px-6 py-2 rounded-2xl border flex items-center gap-3 transition-all shadow-sm",
                    (state.isLocal || state.players[state.currentPlayerIndex].id === playerId) 
                      ? "bg-accent border-accent text-text-dark shadow-xl shadow-accent/10 scale-105" 
                      : "bg-white border-black/5 text-gray-500"
                  )}
                >
                  <div className={cn("w-3 h-3 rounded-full animate-pulse shrink-0", state.players[state.currentPlayerIndex].color)} />
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-50">Current Turn</span>
                    <span className="text-sm font-black truncate max-w-[120px]">{state.players[state.currentPlayerIndex].name}</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2">
               <div className="hidden lg:block mr-2">
                 <UserMenu />
               </div>
               <Button 
                variant="outline" 
                size="icon" 
                className="lg:hidden rounded-xl border-black/5"
                onClick={() => setIsPlayerPanelOpen(true)}
               >
                 <Trophy size={18} className="text-yellow-600" />
               </Button>
               <Button 
                variant="outline" 
                size="icon" 
                className="xl:hidden rounded-xl border-black/5"
                onClick={() => setIsLogOpen(true)}
               >
                 <ScrollText size={18} className="text-gray-500" />
               </Button>
            </div>
          </div>

          {/* New: Status Ribbon */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <AnimatePresence mode="wait">
              {showYourTurn && (
                <motion.div
                  initial={{ y: -100, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -100, opacity: 0, scale: 0.8 }}
                  className="bg-accent text-text-dark px-10 py-3 rounded-full shadow-2xl border-4 border-white font-black text-xl italic uppercase tracking-tighter flex items-center gap-3"
                >
                  <PartyPopper className="text-orange-600 animate-bounce" />
                  Your Turn to Rule!
                </motion.div>
              )}
              {state.isRolling && (
                <motion.div
                  initial={{ y: -100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -100, opacity: 0 }}
                  className="bg-white text-text-dark px-8 py-3 rounded-full shadow-lg border border-gray-100 font-black text-sm uppercase tracking-widest flex items-center gap-3"
                >
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  {state.players[state.currentPlayerIndex].name} is rolling...
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Board Viewport */}
          <div className="flex-1 relative overflow-auto custom-scrollbar flex items-center justify-center p-4 lg:p-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative z-0 scale-[0.6] sm:scale-[0.8] md:scale-90 lg:scale-100"
            >
              <Board />
            </motion.div>
          </div>

          {/* Bottom Action Area */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4">
            <Dice />
          </div>
          
          {/* Chat - Floating properly */}
          <div className="absolute bottom-6 right-6 z-30">
            <Chat />
          </div>
        </div>

        {/* Right Sidebar (Log) */}
        <div className="hidden xl:flex w-[360px] flex-col bg-white border-l border-black/5 h-full overflow-hidden shrink-0">
          <ActivityLog logs={logs} />
          <div className="flex-1 p-6 flex flex-col transition-all bg-gray-50/20">
             <div className="flex items-center gap-2 text-text-dark/40 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                <MessageSquare size={12} />
                Strategic Intel
             </div>
             <div className="flex-1 bg-white rounded-[32px] border border-black/5 shadow-inner p-4 text-[11px] text-gray-400 italic flex items-center justify-center text-center">
                Keep track of your opponents' moves in the activity log above.
             </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlays for Sidebars */}
      <AnimatePresence>
        {isPlayerPanelOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setIsPlayerPanelOpen(false)}
          >
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-[320px] bg-white shadow-2xl relative"
            >
               <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 rounded-full z-[70]"
                onClick={() => setIsPlayerPanelOpen(false)}
               >
                 <X size={20} />
               </Button>
               <PlayerPanel />
            </motion.div>
          </motion.div>
        )}

        {isLogOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm xl:hidden"
            onClick={() => setIsLogOpen(false)}
          >
            <motion.div
              initial={{ x: 360 }}
              animate={{ x: 0 }}
              exit={{ x: 360 }}
              className="absolute right-0 h-full w-[360px] bg-white shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
               <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 left-4 rounded-full z-[70]"
                onClick={() => setIsLogOpen(false)}
               >
                 <X size={20} />
               </Button>
               <ActivityLog logs={logs} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discard & Steal */}
      <DiscardOverlay />
      <StealOverlay />
      
      {/* Winner */}
      {state.winner !== null && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-[64px] p-12 text-center max-w-lg w-full shadow-2xl border-8 border-accent"
          >
             <Trophy size={100} className="text-yellow-500 mx-auto mb-8" />
             <h2 className="text-5xl font-black text-text-dark mb-4 uppercase">Katan Crowned!</h2>
             <p className="text-2xl font-bold text-gray-500 mb-10">
               {state.players.find(p => p.id === state.winner)?.name} is the Master Settler.
             </p>
             <Button 
              onClick={() => window.location.reload()}
              className="bg-accent text-text-dark px-12 py-8 rounded-3xl font-black text-xl hover:scale-105 transition-transform w-full shadow-xl"
             >
                Start New Adventure
             </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
});

GameUI.displayName = 'GameUI';
