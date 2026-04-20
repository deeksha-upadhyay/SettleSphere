import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GameState, Player, ResourceType, TileData, Settlement, Road } from "./src/types";
import { getTileAt, getCanonicalVertexId, getCanonicalEdgeId } from "./src/lib/gameUtils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initialTiles = JSON.parse(fs.readFileSync(path.join(__dirname, "src/data/tiles.json"), "utf-8")) as TileData[];

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
  isDemo?: boolean;
  isPaused?: boolean;
  simulationSpeed?: number;
}

const rooms: Record<string, Room> = {};
let socketIo: Server | null = null;

function emitGameState(roomId: string) {
  if (!socketIo) return;
  const room = rooms[roomId];
  if (!room) return;
  room.state.version++;
  socketIo.to(roomId).emit("gameStateUpdate", room.state);
}

function getAllVertices(tiles: TileData[]) {
  const vertices = new Set<string>();
  tiles.forEach(t => {
    for (let i = 0; i < 6; i++) {
      vertices.add(getCanonicalVertexId(t.q, t.r, i));
    }
  });
  return Array.from(vertices);
}

function getAllEdges(tiles: TileData[]) {
  const edges = new Set<string>();
  tiles.forEach(t => {
    for (let i = 0; i < 6; i++) {
      edges.add(getCanonicalEdgeId(t.q, t.r, i));
    }
  });
  return Array.from(edges);
}

function runAiTurn(roomId: string, io: Server) {
  const room = rooms[roomId];
  if (!room || room.isPaused || room.state.winner) return;

  const playerIndex = room.state.currentPlayerIndex;
  const player = room.state.players[playerIndex];

  if (!player.isBot) return;

  const speed = room.simulationSpeed || 1500;

  setTimeout(() => {
    const room = rooms[roomId];
    if (!room || room.isPaused || room.state.winner) return;

    const state = room.state;
    const phase = state.gamePhase;

    if (phase === 'setup') {
      const vertices = getAllVertices(room.tiles);
      const validVertices = vertices.filter(vId => {
        if (state.settlements[vId]) return false;
        return !Object.keys(state.settlements).some(existingId => {
          const t1 = vId.replace('v:', '').split('|');
          const t2 = existingId.replace('v:', '').split('|');
          const common = t1.filter(t => t2.includes(t));
          return common.length >= 2;
        });
      });

      if (validVertices.length > 0) {
        const vertexId = validVertices[Math.floor(Math.random() * validVertices.length)];
        player.settlements += 1;
        player.victoryPoints += 1;
        state.settlements[vertexId] = { playerId: player.id, type: 'settlement', vertexId };
        addLog(room, `${player.name} built a settlement.`);

        if (state.setupStep >= state.players.length) {
          const tileCoords = vertexId.replace('v:', '').split('|').map(s => s.split(',').map(Number));
          tileCoords.forEach(([q, r]) => {
            const tile = getTileAt(room.tiles, q, r);
            if (tile && tile.type !== 'desert') {
              player.resources[tile.type] += 1;
            }
          });
        }

        const edges = getAllEdges(room.tiles);
        const validEdges = edges.filter(eId => eId.includes(vertexId) && !state.roads[eId]);
        if (validEdges.length > 0) {
          const edgeId = validEdges[Math.floor(Math.random() * validEdges.length)];
          player.roads += 1;
          state.roads[edgeId] = { playerId: player.id, edgeId };
          addLog(room, `${player.name} built a road.`);
        }

        state.setupStep += 1;
        const numPlayers = state.players.length;
        if (state.setupStep < numPlayers) {
          state.currentPlayerIndex = (state.currentPlayerIndex + 1) % numPlayers;
        } else if (state.setupStep === numPlayers) {
          state.currentPlayerIndex = numPlayers - 1;
        } else if (state.setupStep < numPlayers * 2) {
          state.currentPlayerIndex = (state.currentPlayerIndex - 1 + numPlayers) % numPlayers;
        } else {
          state.gamePhase = 'play';
          state.currentPlayerIndex = 0;
        }
      }
    } else if (phase === 'play') {
      if (!state.hasRolled) {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const total = d1 + d2;
        state.dice = [d1, d2];
        state.hasRolled = true;
        addLog(room, `${player.name} rolled a ${total}.`);

        if (total === 7) {
          const playersToDiscard = state.players
            .filter(p => Object.values(p.resources).reduce((a, b) => (a as number) + (b as number), 0) > 7)
            .map(p => p.id);
          if (playersToDiscard.length > 0) {
            state.gamePhase = 'discarding';
            state.discardingPlayers = playersToDiscard;
          } else {
            state.gamePhase = 'robber';
          }
        } else {
          (Object.values(state.settlements) as Settlement[]).forEach(settlement => {
            const p = state.players.find(p => p.id === settlement.playerId);
            if (!p) return;
            const tileCoords = settlement.vertexId.replace('v:', '').split('|').map(s => s.split(',').map(Number));
            tileCoords.forEach(([q, r]) => {
              const tile = getTileAt(room.tiles, q, r);
              if (tile && tile.number === total && tile.id !== state.robberTileId) {
                if (tile.type !== 'desert') {
                  p.resources[tile.type] += (settlement.type === 'city' ? 2 : 1);
                }
              }
            });
          });
        }
      } else {
        let actionTaken = false;
        const mySettlements = Object.values(state.settlements).filter(s => s.playerId === player.id && s.type === 'settlement');
        const canAffordCity = Object.entries(COSTS.city).every(([res, amount]) => player.resources[res as ResourceType] >= amount);
        if (canAffordCity && mySettlements.length > 0) {
          const s = mySettlements[Math.floor(Math.random() * mySettlements.length)];
          Object.entries(COSTS.city).forEach(([res, amount]) => player.resources[res as ResourceType] -= amount);
          player.cities += 1;
          player.victoryPoints += 1;
          s.type = 'city';
          addLog(room, `${player.name} upgraded to a city.`);
          actionTaken = true;
        }

        if (!actionTaken) {
          const canAffordSettlement = Object.entries(COSTS.settlement).every(([res, amount]) => player.resources[res as ResourceType] >= amount);
          if (canAffordSettlement) {
            const vertices = getAllVertices(room.tiles);
            const validSpots = vertices.filter(vId => {
              if (state.settlements[vId]) return false;
              const isTooClose = Object.keys(state.settlements).some(existingId => {
                const t1 = vId.replace('v:', '').split('|');
                const t2 = existingId.replace('v:', '').split('|');
                const common = t1.filter(t => t2.includes(t));
                return common.length >= 2;
              });
              if (isTooClose) return false;
              return (Object.values(state.roads) as Road[]).some(road => road.playerId === player.id && road.edgeId.includes(vId));
            });
            if (validSpots.length > 0) {
              const vertexId = validSpots[Math.floor(Math.random() * validSpots.length)];
              Object.entries(COSTS.settlement).forEach(([res, amount]) => player.resources[res as ResourceType] -= amount);
              player.settlements += 1;
              player.victoryPoints += 1;
              state.settlements[vertexId] = { playerId: player.id, type: 'settlement', vertexId };
              addLog(room, `${player.name} built a settlement.`);
              actionTaken = true;
            }
          }
        }

        if (!actionTaken) {
          const canAffordRoad = Object.entries(COSTS.road).every(([res, amount]) => player.resources[res as ResourceType] >= amount);
          if (canAffordRoad) {
            const edges = getAllEdges(room.tiles);
            const validEdges = edges.filter(eId => {
              if (state.roads[eId]) return false;
              const isConnectedToRoad = (Object.values(state.roads) as Road[]).some(r => r.playerId === player.id && (r.edgeId.includes(eId.split('|')[0]) || r.edgeId.includes(eId.split('|')[1])));
              const isConnectedToSettlement = (Object.values(state.settlements) as Settlement[]).some(s => s.playerId === player.id && eId.includes(s.vertexId));
              return isConnectedToRoad || isConnectedToSettlement;
            });
            if (validEdges.length > 0) {
              const edgeId = validEdges[Math.floor(Math.random() * validEdges.length)];
              Object.entries(COSTS.road).forEach(([res, amount]) => player.resources[res as ResourceType] -= amount);
              player.roads += 1;
              state.roads[edgeId] = { playerId: player.id, edgeId };
              addLog(room, `${player.name} built a road.`);
              actionTaken = true;
            }
          }
        }

        if (!actionTaken || Math.random() > 0.7) {
          state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
          state.hasRolled = false;
          addLog(room, `${player.name} ended their turn.`);
        }
      }
    } else if (phase === 'robber') {
      const otherTiles = room.tiles.filter(t => t.id !== state.robberTileId);
      const newTile = otherTiles[Math.floor(Math.random() * otherTiles.length)];
      state.robberTileId = newTile.id;
      addLog(room, `${player.name} moved the robber.`);
      state.gamePhase = 'play';
    } else if (phase === 'discarding') {
      state.players.forEach(p => {
        if (state.discardingPlayers.includes(p.id)) {
          const total = Object.values(p.resources).reduce((a, b) => (a as number) + (b as number), 0);
          const toDiscard = Math.floor(total / 2);
          let discarded = 0;
          while (discarded < toDiscard) {
            const resTypes = Object.keys(p.resources).filter(r => p.resources[r as ResourceType] > 0);
            if (resTypes.length === 0) break;
            const res = resTypes[Math.floor(Math.random() * resTypes.length)] as ResourceType;
            p.resources[res] -= 1;
            discarded += 1;
          }
          state.discardingPlayers = state.discardingPlayers.filter(id => id !== p.id);
        }
      });
      if (state.discardingPlayers.length === 0) {
        state.gamePhase = 'robber';
      }
    }

    if (player.victoryPoints >= 10) {
      state.winner = player.id;
    }

    emitGameState(roomId);
    if (!state.winner) {
      runAiTurn(roomId, io);
    }
  }, speed);
}

function addLog(room: Room, message: string) {
  room.state.logs.push(message);
  if (room.state.logs.length > 50) {
    room.state.logs.shift();
  }
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  socketIo = io;

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
          { id: 1, name: playerName, color: "bg-red-500", resources: { ...INITIAL_RESOURCES }, victoryPoints: 0, roads: 0, settlements: 0, cities: 0 }
        ],
        currentPlayerIndex: 0,
        dice: [1, 1],
        hasRolled: false,
        robberTileId: desert ? desert.id : 8,
        settlements: {},
        roads: {},
        winner: null,
        gamePhase: 'waiting',
        setupStep: 0,
        discardingPlayers: [],
        victims: [],
        logs: ["Game created. Waiting for players..."],
        version: 0,
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

    socket.on("startDemo", () => {
      const roomId = "DEMO-" + Math.random().toString(36).substring(2, 6).toUpperCase();
      const shuffledTiles = [...initialTiles].sort(() => Math.random() - 0.5) as TileData[];
      const desert = shuffledTiles.find(t => t.type === 'desert');

      const aiPlayers: Player[] = [
        { id: 1, name: "AI Alpha", color: "bg-red-500", resources: { ...INITIAL_RESOURCES }, victoryPoints: 0, roads: 0, settlements: 0, cities: 0, isBot: true },
        { id: 2, name: "AI Beta", color: "bg-blue-500", resources: { ...INITIAL_RESOURCES }, victoryPoints: 0, roads: 0, settlements: 0, cities: 0, isBot: true },
        { id: 3, name: "AI Gamma", color: "bg-green-500", resources: { ...INITIAL_RESOURCES }, victoryPoints: 0, roads: 0, settlements: 0, cities: 0, isBot: true },
        { id: 4, name: "AI Delta", color: "bg-orange-500", resources: { ...INITIAL_RESOURCES }, victoryPoints: 0, roads: 0, settlements: 0, cities: 0, isBot: true },
      ];

      const initialState: GameState = {
        players: aiPlayers,
        currentPlayerIndex: 0,
        dice: [1, 1],
        hasRolled: false,
        robberTileId: desert ? desert.id : 8,
        settlements: {},
        roads: {},
        winner: null,
        gamePhase: 'setup',
        setupStep: 0,
        discardingPlayers: [],
        victims: [],
        logs: ["AI Demo Game Started."],
        version: 0,
      };

      rooms[roomId] = {
        id: roomId,
        state: initialState,
        tiles: shuffledTiles,
        players: [{ socketId: socket.id, playerId: 0, name: "Spectator" }],
        isDemo: true,
        simulationSpeed: 1500
      };

      socket.join(roomId);
      socket.emit("gameJoined", { roomId, state: initialState, tiles: shuffledTiles, playerId: 0, playerName: "Spectator" });
      
      runAiTurn(roomId, io);
    });

    socket.on("pauseDemo", ({ roomId }) => {
      const room = rooms[roomId];
      if (room && room.isDemo) {
        room.isPaused = true;
        addLog(room, "Simulation paused.");
        emitGameState(roomId);
      }
    });

    socket.on("resumeDemo", ({ roomId }) => {
      const room = rooms[roomId];
      if (room && room.isDemo) {
        room.isPaused = false;
        addLog(room, "Simulation resumed.");
        emitGameState(roomId);
        runAiTurn(roomId, io);
      }
    });

    socket.on("restartDemo", ({ roomId }) => {
      const room = rooms[roomId];
      if (room && room.isDemo) {
        const shuffledTiles = [...initialTiles].sort(() => Math.random() - 0.5) as TileData[];
        const desert = shuffledTiles.find(t => t.type === 'desert');
        room.tiles = shuffledTiles;
        room.state.settlements = {};
        room.state.roads = {};
        room.state.currentPlayerIndex = 0;
        room.state.gamePhase = 'setup';
        room.state.setupStep = 0;
        room.state.winner = null;
        room.state.logs = ["AI Demo Game Restarted."];
        room.state.players.forEach(p => {
          p.resources = { ...INITIAL_RESOURCES };
          p.victoryPoints = 0;
          p.roads = 0;
          p.settlements = 0;
          p.cities = 0;
        });
        emitGameState(roomId);
        runAiTurn(roomId, io);
      }
    });

    socket.on("setSimulationSpeed", ({ roomId, speed }) => {
      const room = rooms[roomId];
      if (room && room.isDemo) {
        room.simulationSpeed = speed;
        addLog(room, `Simulation speed set to ${speed}ms.`);
        emitGameState(roomId);
      }
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
        resources: { ...INITIAL_RESOURCES },
        victoryPoints: 0,
        roads: 0,
        settlements: 0,
        cities: 0
      };

      room.state.players.push(newPlayer);
      room.players.push({ socketId: socket.id, playerId, name: playerName });
      addLog(room, `${playerName} joined the room.`);

      socket.join(roomId);
      socket.emit("gameJoined", { roomId, state: room.state, tiles: room.tiles, playerId, playerName });
      emitGameState(roomId);
    });

    socket.on("startGame", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room || room.state.gamePhase !== 'waiting') return;
      if (room.players[0].socketId !== socket.id) return; // Only creator can start

      if (room.state.players.length < 2) {
        socket.emit("error", "Need at least 2 players to start");
        return;
      }

      room.state.gamePhase = 'setup';
      addLog(room, "Game started! Setup phase begins.");
      room.state.currentPlayerIndex = 0;
      room.state.setupStep = 0;
      emitGameState(roomId);
    });

    socket.on("rollDice", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room || room.state.gamePhase !== 'play' || room.state.hasRolled) return;

      // Validation: only current player can roll
      const currentPlayer = room.players.find(p => p.playerId === room.state.players[room.state.currentPlayerIndex].id);
      if (currentPlayer?.socketId !== socket.id) return;

      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const total = d1 + d2;

      room.state.dice = [d1, d2];
      room.state.hasRolled = true;
      addLog(room, `${currentPlayer.name} rolled a ${total}.`);

      if (total === 7) {
        // Check for discards
        const playersToDiscard = room.state.players
          .filter(p => Object.values(p.resources).reduce((a, b) => (a as number) + (b as number), 0) > 7)
          .map(p => p.id);
        
        if (playersToDiscard.length > 0) {
          room.state.gamePhase = 'discarding';
          room.state.discardingPlayers = playersToDiscard;
        } else {
          room.state.gamePhase = 'robber';
        }
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

      emitGameState(roomId);
    });

    socket.on("discardCards", ({ roomId, resources }) => {
      const room = rooms[roomId];
      if (!room || room.state.gamePhase !== 'discarding') return;

      const player = room.state.players.find(p => {
        const pSocket = room.players.find(ps => ps.playerId === p.id);
        return pSocket?.socketId === socket.id;
      });

      if (!player || !room.state.discardingPlayers.includes(player.id)) return;

      // Validate discard amount
      const totalResources = Object.values(player.resources).reduce((a, b) => (a as number) + (b as number), 0);
      const discardAmount = Math.floor(totalResources / 2);
      const actualDiscardAmount = Object.values(resources as Record<ResourceType, number>).reduce((a, b) => (a as number) + (b as number), 0);

      if (actualDiscardAmount !== discardAmount) {
        socket.emit("error", `Must discard exactly ${discardAmount} cards`);
        return;
      }

      // Deduct resources
      for (const [res, amount] of Object.entries(resources)) {
        if (player.resources[res as ResourceType] < (amount as number)) return;
        player.resources[res as ResourceType] -= (amount as number);
      }

      room.state.discardingPlayers = room.state.discardingPlayers.filter(id => id !== player.id);
      if (room.state.discardingPlayers.length === 0) {
        room.state.gamePhase = 'robber';
      }

      emitGameState(roomId);
    });

    socket.on("buildSettlement", ({ roomId, vertexId }) => {
      const room = rooms[roomId];
      if (!room || room.state.settlements[vertexId] || room.state.winner) return;

      const playerIndex = room.state.currentPlayerIndex;
      const player = room.state.players[playerIndex];
      
      // Validation
      const playerSocket = room.players.find(p => p.playerId === player.id);
      if (playerSocket?.socketId !== socket.id) return;

      // Distance rule
      const isTooClose = Object.keys(room.state.settlements).some(existingId => {
        const t1 = vertexId.replace('v:', '').split('|');
        const t2 = existingId.replace('v:', '').split('|');
        const common = t1.filter(t => t2.includes(t));
        return common.length >= 2;
      });
      if (isTooClose) {
        socket.emit("error", "Too close to another settlement");
        return;
      }

      if (room.state.gamePhase === 'setup') {
        // Check if player already built a settlement this step
        const settlementsThisStep = Object.values(room.state.settlements).filter(s => 
          s.playerId === player.id && 
          ((room.state.setupStep < room.state.players.length && player.settlements === 0) ||
           (room.state.setupStep >= room.state.players.length && player.settlements === 1))
        );
        if (settlementsThisStep.length > 0) return;

        player.settlements += 1;
        player.victoryPoints += 1;
        room.state.settlements[vertexId] = { playerId: player.id, type: 'settlement', vertexId };
        addLog(room, `${player.name} built a settlement.`);

        // If 2nd settlement, give resources
        if (room.state.setupStep >= room.state.players.length) {
          const tileCoords = vertexId.replace('v:', '').split('|').map(s => s.split(',').map(Number));
          tileCoords.forEach(([q, r]) => {
            const tile = getTileAt(room.tiles, q, r);
            if (tile && tile.type !== 'desert') {
              player.resources[tile.type] += 1;
            }
          });
        }
      } else if (room.state.gamePhase === 'play') {
        const canAfford = Object.entries(COSTS.settlement).every(
          ([res, amount]) => player.resources[res as ResourceType] >= amount
        );
        if (!canAfford) return;

        // Must be connected to a road
        const isConnected = Object.values(room.state.roads).some(road => 
          road.playerId === player.id && road.edgeId.includes(vertexId)
        );
        if (!isConnected) {
          socket.emit("error", "Must be connected to your road");
          return;
        }

        // Deduct resources
        Object.entries(COSTS.settlement).forEach(([res, amount]) => {
          player.resources[res as ResourceType] -= amount;
        });

        player.settlements += 1;
        player.victoryPoints += 1;
        room.state.settlements[vertexId] = { playerId: player.id, type: 'settlement', vertexId };
        addLog(room, `${player.name} built a settlement.`);
      }

      if (player.victoryPoints >= 10) {
        room.state.winner = player.id;
      }

      emitGameState(roomId);
    });

    socket.on("buildRoad", ({ roomId, edgeId }) => {
      const room = rooms[roomId];
      if (!room || room.state.roads[edgeId] || room.state.winner) return;

      const playerIndex = room.state.currentPlayerIndex;
      const player = room.state.players[playerIndex];
      
      const playerSocket = room.players.find(p => p.playerId === player.id);
      if (playerSocket?.socketId !== socket.id) return;

      if (room.state.gamePhase === 'setup') {
        // Must connect to the settlement just built
        const settlement = Object.values(room.state.settlements).find(s => 
          s.playerId === player.id && edgeId.includes(s.vertexId)
        );
        if (!settlement) return;

        player.roads += 1;
        room.state.roads[edgeId] = { playerId: player.id, edgeId };
        addLog(room, `${player.name} built a road.`);

        // Progress setup step
        room.state.setupStep += 1;
        const numPlayers = room.state.players.length;
        if (room.state.setupStep < numPlayers) {
          room.state.currentPlayerIndex = (room.state.currentPlayerIndex + 1) % numPlayers;
        } else if (room.state.setupStep === numPlayers) {
          // Stay on same player for reverse order start
          room.state.currentPlayerIndex = numPlayers - 1;
        } else if (room.state.setupStep < numPlayers * 2) {
          room.state.currentPlayerIndex = (room.state.currentPlayerIndex - 1 + numPlayers) % numPlayers;
        } else {
          room.state.gamePhase = 'play';
          room.state.currentPlayerIndex = 0;
        }
      } else if (room.state.gamePhase === 'play') {
        const canAfford = Object.entries(COSTS.road).every(
          ([res, amount]) => player.resources[res as ResourceType] >= amount
        );
        if (!canAfford) return;

        Object.entries(COSTS.road).forEach(([res, amount]) => {
          player.resources[res as ResourceType] -= amount;
        });

        player.roads += 1;
        room.state.roads[edgeId] = { playerId: player.id, edgeId };
        addLog(room, `${player.name} built a road.`);
      }

      emitGameState(roomId);
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
      addLog(room, `${player.name} upgraded to a city.`);

      if (player.victoryPoints >= 10) {
        room.state.winner = player.id;
      }

      emitGameState(roomId);
    });

    socket.on("moveRobber", ({ roomId, tileId }) => {
      const room = rooms[roomId];
      if (!room || room.state.gamePhase !== 'robber') return;

      const playerIndex = room.state.currentPlayerIndex;
      const player = room.state.players[playerIndex];
      const playerSocket = room.players.find(p => p.playerId === player.id);
      if (playerSocket?.socketId !== socket.id) return;

      room.state.robberTileId = tileId;
      addLog(room, `${player.name} moved the robber.`);
      
      // Find potential victims on this tile
      const tile = room.tiles.find(t => t.id === tileId);
      if (!tile) return;

      const victims = new Set<number>();
      Object.values(room.state.settlements).forEach(s => {
        if (s.playerId === player.id) return;
        const tileCoords = s.vertexId.replace('v:', '').split('|').map(sc => sc.split(',').map(Number));
        const isOnTile = tileCoords.some(([q, r]) => q === tile.q && r === tile.r);
        if (isOnTile) {
          // Only if they have resources
          const targetPlayer = room.state.players.find(p => p.id === s.playerId);
          if (targetPlayer && Object.values(targetPlayer.resources).some(v => v > 0)) {
            victims.add(s.playerId);
          }
        }
      });

      if (victims.size > 0) {
        room.state.victims = Array.from(victims);
      } else {
        room.state.gamePhase = 'play';
        room.state.victims = [];
      }

      emitGameState(roomId);
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
      addLog(room, `${player.name} ended their turn.`);

      emitGameState(roomId);
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

    socket.on("stealCard", ({ roomId, targetPlayerId }) => {
      const room = rooms[roomId];
      if (!room || room.state.gamePhase !== 'robber') return;

      const playerIndex = room.state.currentPlayerIndex;
      const player = room.state.players[playerIndex];
      const playerSocket = room.players.find(p => p.playerId === player.id);
      if (playerSocket?.socketId !== socket.id) return;

      const targetPlayer = room.state.players.find(p => p.id === targetPlayerId);
      if (!targetPlayer || targetPlayer.id === player.id) return;

      // Get available resources
      const availableResources = Object.entries(targetPlayer.resources)
        .filter(([_, amount]) => amount > 0)
        .flatMap(([res, amount]) => Array(amount).fill(res)) as ResourceType[];

      if (availableResources.length > 0) {
        const stolenRes = availableResources[Math.floor(Math.random() * availableResources.length)];
        targetPlayer.resources[stolenRes] -= 1;
        player.resources[stolenRes] += 1;
        addLog(room, `${player.name} stole a card from ${targetPlayer.name}.`);
      }

      room.state.gamePhase = 'play';
      room.state.victims = [];
      emitGameState(roomId);
    });
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      // Optional: handle player removal or timeout
    });
  });

  // Vite middleware for development
  console.log(`[Server] Detected NODE_ENV: ${process.env.NODE_ENV}`);
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Starting in DEVELOPMENT mode with Vite middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    console.log(`[Server] Starting in PRODUCTION mode`);
    console.log(`[Server] Serving static assets from: ${distPath}`);
    
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`[Server] Error sending index.html: ${err.message}`);
          res.status(404).send("Application files could not be found. Please wait for the build to complete and try again.");
        }
      });
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
