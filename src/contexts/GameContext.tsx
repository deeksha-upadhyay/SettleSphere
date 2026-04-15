import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { GameState, Player, ResourceType, TileData, Settlement, Road, StructureType } from '../types';
import { io, Socket } from 'socket.io-client';

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

    socket.on('gameStateUpdate', (newState) => {
      setState(newState);
    });

    socket.on('newMessage', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('error', (msg) => {
      alert(msg);
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
      sendMessage
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
