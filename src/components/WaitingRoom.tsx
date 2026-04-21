import React from 'react';
import { useGame } from '../contexts/GameContext';
import { Button } from './ui/button';
import { motion } from 'motion/react';
import { Users, Copy, Play } from 'lucide-react';

import { toast } from 'sonner';

export const WaitingRoom: React.FC = () => {
  const { state, roomId, startGame, playerId } = useGame();

  if (!state) return null;

  const isCreator = playerId === 1;

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      toast.success('Room ID copied to clipboard!');
    }
  };

  const copyRoomLink = () => {
    if (roomId) {
      const url = `${window.location.origin}/room/${roomId}`;
      navigator.clipboard.writeText(url);
      toast.success('Room link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen w-full bg-sea flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 360],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-20 -left-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl"
      />
      
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md flex flex-col gap-8 relative z-10"
      >
        <div className="text-center">
          <h1 className="font-serif italic text-5xl text-text-dark mb-2">Waiting Room</h1>
          <div className="flex flex-col gap-2 items-center">
            <div 
              onClick={copyRoomId}
              className="inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100"
            >
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Code:</span>
              <span className="text-lg font-black text-text-dark tracking-tighter">{roomId}</span>
              <Copy size={16} className="text-gray-400" />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={copyRoomLink}
              className="rounded-full text-[10px] font-black uppercase tracking-widest py-4 border-gray-200"
            >
              Copy Shareable Link
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            <Users size={14} />
            <span>Players ({state.players.length}/4)</span>
          </div>
          
          <div className="space-y-2">
            {state.players.map((player) => (
              <div key={player.id} className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className={`w-3 h-3 rounded-full ${player.color}`} />
                <span className="font-bold text-text-dark">{player.name}</span>
                {player.id === 1 && (
                  <span className="ml-auto text-[10px] bg-accent/20 text-accent-dark px-2 py-1 rounded-md font-black uppercase">Host</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          {isCreator ? (
            <Button 
              onClick={startGame}
              disabled={state.players.length < 2}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-8 rounded-2xl text-lg font-bold shadow-lg shadow-orange-600/20 disabled:opacity-50 flex gap-2 items-center justify-center"
            >
              <Play size={20} fill="currentColor" />
              Start Game
            </Button>
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                Waiting for host to start...
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
