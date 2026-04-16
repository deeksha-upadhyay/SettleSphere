import React from 'react';
import { useGame } from '../contexts/GameContext';
import { Button } from './ui/button';
import { Play, Pause, RotateCcw, FastForward, Timer, Home } from 'lucide-react';
import { motion } from 'motion/react';

export const DemoControls: React.FC = () => {
  const { roomId, pauseDemo, resumeDemo, restartDemo, setSimulationSpeed, state } = useGame();
  
  if (!roomId?.startsWith('DEMO-')) return null;

  const isPaused = state?.logs[state.logs.length - 1]?.includes('paused');

  return (
    <motion.div 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-md p-4 rounded-[32px] shadow-2xl border border-white/20 flex items-center gap-4"
    >
      <div className="flex flex-col mr-4">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Demo Mode</span>
        <span className="text-xs font-bold text-accent">Spectating AI</span>
      </div>

      <div className="flex gap-2">
        {isPaused ? (
          <Button onClick={resumeDemo} className="bg-green-500 hover:bg-green-600 text-white rounded-2xl p-4 h-auto">
            <Play size={20} />
          </Button>
        ) : (
          <Button onClick={pauseDemo} className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl p-4 h-auto">
            <Pause size={20} />
          </Button>
        )}
        
        <Button onClick={restartDemo} variant="outline" className="rounded-2xl p-4 h-auto border-gray-200">
          <RotateCcw size={20} />
        </Button>

        <Button onClick={() => window.location.reload()} variant="outline" className="rounded-2xl p-4 h-auto border-gray-200">
          <Home size={20} />
        </Button>
      </div>

      <div className="h-8 w-px bg-gray-100 mx-2" />

      <div className="flex gap-2">
        <Button 
          onClick={() => setSimulationSpeed(2000)} 
          variant="ghost" 
          className="rounded-xl text-[10px] font-black uppercase tracking-tighter h-auto py-2 px-3"
        >
          <Timer size={14} className="mr-1" />
          Slow
        </Button>
        <Button 
          onClick={() => setSimulationSpeed(1000)} 
          variant="ghost" 
          className="rounded-xl text-[10px] font-black uppercase tracking-tighter h-auto py-2 px-3"
        >
          <FastForward size={14} className="mr-1" />
          Fast
        </Button>
      </div>
    </motion.div>
  );
};
