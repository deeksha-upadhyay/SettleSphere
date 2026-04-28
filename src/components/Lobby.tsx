import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { motion } from 'motion/react';
import { useParams } from 'react-router-dom';

import { HowToPlay } from './HowToPlay';
import { UserMenu } from './Auth/UserMenu';

import { Play, Eye, Users } from 'lucide-react';

export const Lobby: React.FC = () => {
  const { id: urlRoomId } = useParams<{ id: string }>();
  const { createGame, joinGame, startDemo } = useGame();
  const { user } = useAuth();
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    if (user?.displayName) {
      setPlayerName(user.displayName);
    }
  }, [user]);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [mode, setMode] = useState<'selection' | 'local' | 'online' | 'join'>('selection');
  const [playerCount, setPlayerCount] = useState(3);

  useEffect(() => {
    if (urlRoomId) {
      setMode('join');
      setRoomIdInput(urlRoomId.toUpperCase());
    }
  }, [urlRoomId]);

  const renderSelection = () => (
    <div className="space-y-4">
      <Button 
        onClick={() => setMode('local')}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-10 rounded-2xl text-xl font-bold shadow-lg shadow-orange-600/20 flex flex-col gap-1 items-center justify-center h-auto"
      >
        <div className="flex items-center gap-2">
          <Play size={24} fill="currentColor" />
          Play Locally
        </div>
        <span className="text-xs font-medium opacity-80 normal-case">Same device hotseat</span>
      </Button>

      <Button 
        onClick={() => setMode('online')}
        className="w-full bg-text-dark hover:bg-text-dark/90 text-white py-10 rounded-2xl text-xl font-bold shadow-lg flex flex-col gap-1 items-center justify-center h-auto"
      >
        <div className="flex items-center gap-2">
          <Users size={24} />
          Play Online
        </div>
        <span className="text-xs font-medium opacity-80 normal-case">Join or create a room</span>
      </Button>

      <div className="relative flex items-center gap-4 py-2">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">or watch</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      <Button 
        onClick={startDemo}
        variant="outline"
        className="w-full border-2 border-accent text-text-dark hover:bg-accent/10 py-6 rounded-2xl text-lg font-black uppercase tracking-widest flex gap-3 h-auto"
      >
        <Eye size={24} />
        Watch AI Demo
      </Button>
    </div>
  );

  const renderLocalSetup = () => (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        onClick={() => setMode('selection')}
        className="text-gray-400 hover:text-text-dark p-0 h-auto font-bold uppercase text-xs tracking-widest flex items-center gap-1"
      >
        ← Back to Selection
      </Button>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Number of Players</label>
          <div className="flex gap-2">
            {[2, 3, 4].map(num => (
              <button
                key={num}
                onClick={() => setPlayerCount(num)}
                className={`flex-1 py-4 rounded-xl font-black text-xl transition-all ${
                  playerCount === num 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 ring-2 ring-orange-400' 
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Your Name (Player 1)</label>
          <input 
            type="text" 
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter name..."
            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-accent focus:bg-white outline-none transition-all font-bold text-text-dark"
          />
        </div>

        <Button 
          onClick={() => playerName && createGame(playerName, true, playerCount)}
          disabled={!playerName}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-8 rounded-2xl text-lg font-bold shadow-lg shadow-orange-600/20 disabled:opacity-50 mt-4 h-auto"
        >
          Start Local Session
        </Button>
      </div>
    </div>
  );

  const renderOnlineSetup = () => (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        onClick={() => setMode('selection')}
        className="text-gray-400 hover:text-text-dark p-0 h-auto font-bold uppercase text-xs tracking-widest flex items-center gap-1"
      >
        ← Back to Selection
      </Button>

      <div className="space-y-4">
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
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-8 rounded-2xl text-lg font-bold shadow-lg shadow-orange-600/20 disabled:opacity-50 flex gap-3 items-center justify-center h-auto"
          >
            <Play size={20} fill="currentColor" />
            Create Online Room
          </Button>

          <div className="relative flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">or join existing</span>
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
      </div>
    </div>
  );

  const renderJoinSetup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-xs font-bold text-accent-dark uppercase tracking-widest mb-1">You've been invited to join</p>
        <p className="text-2xl font-black text-text-dark tracking-tighter">Room: {roomIdInput}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Enter Your Name</label>
          <input 
            type="text" 
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Name..."
            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-accent focus:bg-white outline-none transition-all font-bold text-text-dark"
          />
        </div>

        <Button 
          onClick={() => playerName && roomIdInput && joinGame(roomIdInput.toUpperCase(), playerName)}
          disabled={!playerName}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-8 rounded-2xl text-lg font-bold shadow-lg shadow-orange-600/20 disabled:opacity-50 h-auto"
        >
          Join Game
        </Button>
      </div>
      
      <Button 
        variant="ghost" 
        onClick={() => setMode('selection')}
        className="w-full text-gray-400 hover:text-text-dark h-auto font-bold uppercase text-[10px] tracking-widest"
      >
        Or create your own game instead
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-sea flex items-center justify-center p-4 relative overflow-hidden">
      {/* User Auth Menu */}
      <div className="absolute top-6 right-6 z-50">
        <UserMenu />
      </div>

      {/* Animated Background Elements (reused from previous design) */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-20 -left-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl opacity-50"
      />
      
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md flex flex-col gap-6 relative z-10 border-4 border-white/20 backdrop-blur-sm"
      >
        <div className="text-center">
          <h1 className="font-serif italic text-6xl text-text-dark mb-1 tracking-tighter">Katan</h1>
          <p className="text-[10px] font-black text-accent-dark uppercase tracking-[0.3em] mb-4">The Settlers Challenge</p>
        </div>

        {mode === 'selection' && renderSelection()}
        {mode === 'local' && renderLocalSetup()}
        {mode === 'online' && renderOnlineSetup()}
        {mode === 'join' && renderJoinSetup()}

        <div className="pt-6 border-t border-gray-100 flex justify-center">
          <HowToPlay />
        </div>
      </motion.div>
    </div>
  );
};
