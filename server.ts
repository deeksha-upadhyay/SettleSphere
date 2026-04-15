import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GameState, Player, ResourceType, TileData, Settlement, Road } from "./src/types";
import initialTiles from "./src/data/tiles.json" assert { type: "json" };
import { getTileAt } from "./src/lib/gameUtils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INITIAL_RESOURCES: Record<ResourceType, number> = {
  wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0, desert: 0
};

const COSTS = {
  road: { wood: 1, brick: 1 },
  settlement: { wood: 1, brick: 1, sheep: 1, wheat: 1 },
  city: { ore: 3, wheat: 2 }
};

interface Room {
  id: string;
  state: GameState;
  tiles: TileData[];
  players: { socketId: string; playerId: number; name: string }[];
}

const rooms: Record<string, Room> = {};

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(cors());
  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("createGame", ({ playerName }) => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const shuffledTiles = [...initialTiles].sort(() => Math.random() - 0.5) as TileData[];
      const desert = shuffledTiles.find(t => t.type === 'desert');

      const initialState: GameState = {
        players: [
          { id: 1, name: playerName, color: "bg-red-500", resources: { ...INITIAL_RESOURCES, wood: 4, brick: 4, sheep: 2, wheat: 2 }, victoryPoints: 0, roads: 0, settlements: 0, cities: 0 }
        ],
        currentPlayerIndex: 0,
        dice: [1, 1],
        hasRolled: false,
        robberTileId: desert ? desert.id : 8,
        settlements: {},
        roads: {},
        winner: null,
        gamePhase: 'play',
        setupStep: 0,
      };

      rooms[roomId] = {
        id: roomId,
        state: initialState,
        tiles: shuffledTiles,
        players: [{ socketId: socket.id, playerId: 1, name: playerName }]
      };

      socket.join(roomId);
      socket.emit("gameCreated", { roomId, state: initialState, tiles: shuffledTiles, playerId: 1, playerName });
    });

    socket.on("joinGame", ({ roomId, playerName, reconnecting }) => {
      const room = rooms[roomId];
      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }

      // Handle reconnection
      if (reconnecting) {
        const existingPlayer = room.players.find(p => p.name === playerName);
        if (existingPlayer) {
          existingPlayer.socketId = socket.id;
          socket.join(roomId);
          socket.emit("gameJoined", { roomId, state: room.state, tiles: room.tiles, playerId: existingPlayer.playerId, playerName });
          return;
        }
      }

      if (room.players.length >= 4) {
        socket.emit("error", "Room full");
        return;
      }

      const playerId = room.players.length + 1;
      const colors = ["bg-red-500", "bg-blue-500", "bg-orange-500", "bg-green-500"];
      
      const newPlayer: Player = {
        id: playerId,
        name: playerName,
        color: colors[playerId - 1],
        resources: { ...INITIAL_RESOURCES, wood: 2, brick: 2, sheep: 2, wheat: 2 },
        victoryPoints: 0,
        roads: 0,
        settlements: 0,
        cities: 0
      };

      room.state.players.push(newPlayer);
      room.players.push({ socketId: socket.id, playerId, name: playerName });

      socket.join(roomId);
      socket.emit("gameJoined", { roomId, state: room.state, tiles: room.tiles, playerId, playerName });
      io.to(roomId).emit("gameStateUpdate", room.state);
    });

    socket.on("rollDice", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room || room.state.hasRolled) return;

      // Validation: only current player can roll
      const currentPlayer = room.players.find(p => p.playerId === room.state.players[room.state.currentPlayerIndex].id);
      if (currentPlayer?.socketId !== socket.id) return;

      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const total = d1 + d2;

      room.state.dice = [d1, d2];
      room.state.hasRolled = true;

      if (total === 7) {
        room.state.gamePhase = 'robber';
      } else {
        // Distribute resources
        const updatedPlayers = [...room.state.players];
        (Object.values(room.state.settlements) as Settlement[]).forEach(settlement => {
          const playerIndex = updatedPlayers.findIndex(p => p.id === settlement.playerId);
          if (playerIndex === -1) return;

          const tileCoords = settlement.vertexId.replace('v:', '').split('|').map(s => s.split(',').map(Number));
          tileCoords.forEach(([q, r]) => {
            const tile = getTileAt(room.tiles, q, r);
            if (tile && tile.number === total && tile.id !== room.state.robberTileId) {
              const amount = settlement.type === 'city' ? 2 : 1;
              const resType = tile.type;
              if (resType !== 'desert') {
                updatedPlayers[playerIndex].resources[resType] += amount;
              }
            }
          });
        });
        room.state.players = updatedPlayers;
      }

      io.to(roomId).emit("gameStateUpdate", room.state);
    });

    socket.on("buildSettlement", ({ roomId, vertexId }) => {
      const room = rooms[roomId];
      if (!room || room.state.settlements[vertexId] || room.state.winner) return;

      const playerIndex = room.state.currentPlayerIndex;
      const player = room.state.players[playerIndex];
      
      // Validation
      const playerSocket = room.players.find(p => p.playerId === player.id);
      if (playerSocket?.socketId !== socket.id) return;

      const canAfford = Object.entries(COSTS.settlement).every(
        ([res, amount]) => player.resources[res as ResourceType] >= amount
      );
      if (!canAfford) return;

      // Deduct resources
      Object.entries(COSTS.settlement).forEach(([res, amount]) => {
        player.resources[res as ResourceType] -= amount;
      });

      player.settlements += 1;
      player.victoryPoints += 1;
      room.state.settlements[vertexId] = { playerId: player.id, type: 'settlement', vertexId };

      if (player.victoryPoints >= 10) {
        room.state.winner = player.id;
      }

      io.to(roomId).emit("gameStateUpdate", room.state);
    });

    socket.on("buildRoad", ({ roomId, edgeId }) => {
      const room = rooms[roomId];
      if (!room || room.state.roads[edgeId] || room.state.winner) return;

      const playerIndex = room.state.currentPlayerIndex;
      const player = room.state.players[playerIndex];
      
      const playerSocket = room.players.find(p => p.playerId === player.id);
      if (playerSocket?.socketId !== socket.id) return;

      const canAfford = Object.entries(COSTS.road).every(
        ([res, amount]) => player.resources[res as ResourceType] >= amount
      );
      if (!canAfford) return;

      Object.entries(COSTS.road).forEach(([res, amount]) => {
        player.resources[res as ResourceType] -= amount;
      });

      player.roads += 1;
      room.state.roads[edgeId] = { playerId: player.id, edgeId };

      io.to(roomId).emit("gameStateUpdate", room.state);
    });

    socket.on("upgradeToCity", ({ roomId, vertexId }) => {
      const room = rooms[roomId];
      if (!room || room.state.winner) return;

      const settlement = room.state.settlements[vertexId];
      if (!settlement || settlement.type === 'city') return;

      const playerIndex = room.state.currentPlayerIndex;
      const player = room.state.players[playerIndex];
      
      if (settlement.playerId !== player.id) return;
      const playerSocket = room.players.find(p => p.playerId === player.id);
      if (playerSocket?.socketId !== socket.id) return;

      const canAfford = Object.entries(COSTS.city).every(
        ([res, amount]) => player.resources[res as ResourceType] >= amount
      );
      if (!canAfford) return;

      Object.entries(COSTS.city).forEach(([res, amount]) => {
        player.resources[res as ResourceType] -= amount;
      });

      player.cities += 1;
      player.victoryPoints += 1;
      settlement.type = 'city';

      if (player.victoryPoints >= 10) {
        room.state.winner = player.id;
      }

      io.to(roomId).emit("gameStateUpdate", room.state);
    });

    socket.on("moveRobber", ({ roomId, tileId }) => {
      const room = rooms[roomId];
      if (!room || room.state.gamePhase !== 'robber') return;

      const playerIndex = room.state.currentPlayerIndex;
      const player = room.state.players[playerIndex];
      const playerSocket = room.players.find(p => p.playerId === player.id);
      if (playerSocket?.socketId !== socket.id) return;

      room.state.robberTileId = tileId;
      room.state.gamePhase = 'play';

      io.to(roomId).emit("gameStateUpdate", room.state);
    });

    socket.on("endTurn", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;

      const playerIndex = room.state.currentPlayerIndex;
      const player = room.state.players[playerIndex];
      const playerSocket = room.players.find(p => p.playerId === player.id);
      if (playerSocket?.socketId !== socket.id) return;

      room.state.currentPlayerIndex = (room.state.currentPlayerIndex + 1) % room.state.players.length;
      room.state.hasRolled = false;
      room.state.gamePhase = 'play';

      io.to(roomId).emit("gameStateUpdate", room.state);
    });

    socket.on("sendMessage", ({ roomId, message }) => {
      const room = rooms[roomId];
      if (!room) return;

      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) return;

      const chatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: player.name,
        text: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      io.to(roomId).emit("newMessage", chatMessage);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      // Optional: handle player removal or timeout
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
