import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { GameState, Player, ResourceType, TileData, Settlement, Road, StructureType } from '../types';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface GameContextType {
  state: GameState | null;
  playerId: number | null;
  roomId: string | null;
  tiles: TileData[];
  messages: ChatMessage[];
  createGame: (playerName: string) => void;
  joinGame: (roomId: string, playerName: string) => void;
  rollDice: () => void;
  endTurn: () => void;
  buildSettlement: (vertexId: string) => void;
  buildRoad: (edgeId: string) => void;
  upgradeToCity: (vertexId: string) => void;
  moveRobber: (tileId: number) => void;
  sendMessage: (message: string) => void;
  startGame: () => void;
  discardCards: (resources: Record<ResourceType, number>) => void;
  stealCard: (targetPlayerId: number) => void;
  startDemo: () => void;
  pauseDemo: () => void;
  resumeDemo: () => void;
  restartDemo: () => void;
  setSimulationSpeed: (speed: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState | null>(null);
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    // Check for existing session
    const savedRoomId = localStorage.getItem('katan_roomId');
    const savedPlayerId = localStorage.getItem('katan_playerId');
    const savedPlayerName = localStorage.getItem('katan_playerName');

    if (savedRoomId && savedPlayerId && savedPlayerName) {
      socket.emit('joinGame', { roomId: savedRoomId, playerName: savedPlayerName, reconnecting: true });
    }

    socket.on('gameCreated', ({ roomId, state, tiles, playerId, playerName }) => {
      setRoomId(roomId);
      setState(state);
      setTiles(tiles);
      setPlayerId(playerId);
      localStorage.setItem('katan_roomId', roomId);
      localStorage.setItem('katan_playerId', playerId.toString());
      localStorage.setItem('katan_playerName', playerName);
    });

    socket.on('gameJoined', ({ roomId, state, tiles, playerId, playerName }) => {
      setRoomId(roomId);
      setState(state);
      setTiles(tiles);
      setPlayerId(playerId);
      localStorage.setItem('katan_roomId', roomId);
      localStorage.setItem('katan_playerId', playerId.toString());
      localStorage.setItem('katan_playerName', playerName);
    });

    socket.on('gameStateUpdate', (newState: GameState) => {
      setState(prev => {
        if (prev && newState.logs.length > prev.logs.length) {
          const newLogs = newState.logs.slice(prev.logs.length);
          newLogs.forEach(log => {
            if (log.includes('victory') || log.includes('wins')) {
              toast.success(log, { icon: '🏆', duration: 5000 });
            } else if (log.includes('rolled')) {
              toast(log, { icon: '🎲' });
            } else if (log.includes('built')) {
              toast.success(log, { icon: '🏠' });
            } else if (log.includes('stole') || log.includes('Robber')) {
              toast.warning(log, { icon: '🕵️' });
            } else if (log.includes('joined')) {
              toast.info(log, { icon: '👋' });
            } else {
              toast(log);
            }
          });
        }
        return newState;
      });
    });

    socket.on('newMessage', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
      toast(`New message from ${msg.sender}`, { duration: 2000 });
    });

    socket.on('error', (msg) => {
      toast.error(msg);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createGame = useCallback((playerName: string) => {
    socketRef.current?.emit('createGame', { playerName });
  }, []);

  const joinGame = useCallback((roomId: string, playerName: string) => {
    socketRef.current?.emit('joinGame', { roomId, playerName });
  }, []);

  const rollDice = useCallback(() => {
    if (!roomId) return;
    socketRef.current?.emit('rollDice', { roomId });
  }, [roomId]);

  const endTurn = useCallback(() => {
    if (!roomId) return;
    socketRef.current?.emit('endTurn', { roomId });
  }, [roomId]);

  const buildSettlement = useCallback((vertexId: string) => {
    if (!roomId) return;
    socketRef.current?.emit('buildSettlement', { roomId, vertexId });
  }, [roomId]);

  const buildRoad = useCallback((edgeId: string) => {
    if (!roomId) return;
    socketRef.current?.emit('buildRoad', { roomId, edgeId });
  }, [roomId]);

  const upgradeToCity = useCallback((vertexId: string) => {
    if (!roomId) return;
    socketRef.current?.emit('upgradeToCity', { roomId, vertexId });
  }, [roomId]);

  const moveRobber = useCallback((tileId: number) => {
    if (!roomId) return;
    socketRef.current?.emit('moveRobber', { roomId, tileId });
  }, [roomId]);

  const sendMessage = useCallback((message: string) => {
    if (!roomId) return;
    socketRef.current?.emit('sendMessage', { roomId, message });
  }, [roomId]);

  const startGame = useCallback(() => {
    if (!roomId) return;
    socketRef.current?.emit('startGame', { roomId });
  }, [roomId]);

  const discardCards = useCallback((resources: Record<ResourceType, number>) => {
    if (!roomId) return;
    socketRef.current?.emit('discardCards', { roomId, resources });
  }, [roomId]);

  const stealCard = useCallback((targetPlayerId: number) => {
    if (!roomId) return;
    socketRef.current?.emit('stealCard', { roomId, targetPlayerId });
  }, [roomId]);

  const startDemo = useCallback(() => {
    socketRef.current?.emit('startDemo');
  }, []);

  const pauseDemo = useCallback(() => {
    if (!roomId) return;
    socketRef.current?.emit('pauseDemo', { roomId });
  }, [roomId]);

  const resumeDemo = useCallback(() => {
    if (!roomId) return;
    socketRef.current?.emit('resumeDemo', { roomId });
  }, [roomId]);

  const restartDemo = useCallback(() => {
    if (!roomId) return;
    socketRef.current?.emit('restartDemo', { roomId });
  }, [roomId]);

  const setSimulationSpeed = useCallback((speed: number) => {
    if (!roomId) return;
    socketRef.current?.emit('setSimulationSpeed', { roomId, speed });
  }, [roomId]);

  return (
    <GameContext.Provider value={{ 
      state, 
      playerId,
      roomId,
      tiles,
      messages,
      createGame,
      joinGame,
      rollDice, 
      endTurn, 
      buildSettlement, 
      buildRoad, 
      upgradeToCity, 
      moveRobber,
      sendMessage,
      startGame,
      discardCards,
      stealCard,
      startDemo,
      pauseDemo,
      resumeDemo,
      restartDemo,
      setSimulationSpeed
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};
