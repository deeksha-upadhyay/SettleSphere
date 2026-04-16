import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { Button } from './ui/button';
import { motion } from 'motion/react';

import { HowToPlay } from './HowToPlay';

import { Play, Eye } from 'lucide-react';

export const Lobby: React.FC = () => {
  const { createGame, joinGame, startDemo } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');

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
        animate={{ 
          scale: [1, 1.3, 1],
          rotate: [360, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-20 -right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"
      />

      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md flex flex-col gap-8 relative z-10"
      >
        <div className="text-center">
          <h1 className="font-serif italic text-5xl text-text-dark mb-2">Katan</h1>
          <p className="text-gray-500 font-medium">Multiplayer Real-Time Strategy</p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={startDemo}
            variant="outline"
            className="w-full border-2 border-accent text-text-dark hover:bg-accent/10 py-8 rounded-2xl text-lg font-black uppercase tracking-widest flex gap-3"
          >
            <Eye size={24} />
            Watch AI Game
          </Button>

          <div className="relative flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">or play</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Your Name</label>
            <input 
              type="text" 
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter name..."
              className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-accent focus:bg-white outline-none transition-all font-bold text-text-dark"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col gap-4">
            <Button 
              onClick={() => playerName && createGame(playerName)}
              disabled={!playerName}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-8 rounded-2xl text-lg font-bold shadow-lg shadow-orange-600/20 disabled:opacity-50 flex gap-3 items-center justify-center"
            >
              <Play size={20} />
              Create New Game
            </Button>

            <div className="relative flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                placeholder="Room ID"
                className="flex-1 px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-accent focus:bg-white outline-none transition-all font-bold text-text-dark uppercase"
              />
              <Button 
                onClick={() => playerName && roomIdInput && joinGame(roomIdInput.toUpperCase(), playerName)}
                disabled={!playerName || !roomIdInput}
                className="bg-text-dark hover:bg-text-dark/90 text-white px-8 rounded-2xl font-bold disabled:opacity-50"
              >
                Join
              </Button>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-center">
            <HowToPlay />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
