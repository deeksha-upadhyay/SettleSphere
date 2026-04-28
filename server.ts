import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cors from "cors";
import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseConfig: any = {};
try {
  const configPath = path.join(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log("[Server] Firebase configuration loaded.");
  } else {
    console.warn("[Server] WARNING: firebase-applet-config.json not found. Firebase will not be initialized.");
  }
} catch (err) {
  console.error("[Server] Error reading firebase-applet-config.json:", err);
}

let app: any = null;
let db: any = null;
let auth: any = null;

if (firebaseConfig.projectId) {
  try {
    const firebaseApp = initializeApp(firebaseConfig);
    db = initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId);
    console.log("[Server] Firebase initialized successfully.");
  } catch (err) {
    console.error("[Server] Firebase initialization failed:", err);
  }
}

// Vite is imported dynamically in dev mode to avoid production crashes
// import { createServer as createViteServer } from "vite";
import { GameState, Player, ResourceType, TileData, Settlement, Road } from "./src/types";
import { getTileAt, getCanonicalVertexId, getCanonicalEdgeId } from "./src/lib/gameUtils";

// Initial tiles for the hexagonal board
const initialTiles: TileData[] = [
  { id: 1, type: "wood", number: 11, q: 0, r: -2 },
  { id: 2, type: "sheep", number: 12, q: 1, r: -2 },
  { id: 3, type: "wheat", number: 9, q: 2, r: -2 },
  { id: 4, type: "brick", number: 4, q: -1, r: -1 },
  { id: 5, type: "ore", number: 6, q: 0, r: -1 },
  { id: 6, type: "brick", number: 5, q: 1, r: -1 },
  { id: 7, type: "sheep", number: 10, q: 2, r: -1 },
  { id: 8, type: "desert", number: null, q: -2, r: 0 },
  { id: 9, type: "wood", number: 3, q: -1, r: 0 },
  { id: 10, type: "wheat", number: 11, q: 0, r: 0 },
  { id: 11, type: "wood", number: 4, q: 1, r: 0 },
  { id: 12, type: "wheat", number: 8, q: 2, r: 0 },
  { id: 13, type: "brick", number: 8, q: -2, r: 1 },
  { id: 14, type: "sheep", number: 10, q: -1, r: 1 },
  { id: 15, type: "sheep", number: 9, q: 0, r: 1 },
  { id: 16, type: "ore", number: 3, q: 1, r: 1 },
  { id: 17, type: "ore", number: 5, q: -2, r: 2 },
  { id: 18, type: "wheat", number: 2, q: -1, r: 2 },
  { id: 19, type: "wood", number: 6, q: 0, r: 2 }
];

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
  isLocal?: boolean;
}

const rooms: Record<string, Room> = {};
let socketIo: Server | null = null;

async function persistRoom(roomId: string) {
  const room = rooms[roomId];
  if (!room || room.isDemo || !db) return;
  
  try {
    await setDoc(doc(db, 'rooms', roomId), {
      id: roomId,
      state: room.state,
      tiles: room.tiles,
      players: room.players.map(p => ({
        playerId: p.playerId,
        name: p.name
      })),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[Firebase] Error persisting room ${roomId}:`, error);
  }
}

async function loadRooms() {
  if (!db) {
    console.warn("[Firebase] Skipping loadRooms: Firestore not initialized.");
    return;
  }
  console.log("[Firebase] Loading rooms from Firestore...");
  try {
    const querySnapshot = await getDocs(collection(db, 'rooms'));
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Only load rooms updated in the last 24 hours to keep active memory clean
      const updatedAt = new Date(data.updatedAt);
      const now = new Date();
      const diffMs = now.getTime() - updatedAt.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);
      
      if (diffHrs < 24) {
        rooms[docSnap.id] = {
          id: docSnap.id,
          state: data.state,
          tiles: data.tiles,
          players: data.state.players.map((p: any) => ({
            socketId: "",
            playerId: p.id,
            name: p.name
          })),
          isLocal: data.state.isLocal
        };
        console.log(`[Firebase] Restored room: ${docSnap.id}`);
      }
    });
  } catch (error) {
    console.error("[Firebase] Error loading rooms:", error);
  }
}

function emitGameState(roomId: string, logMessage?: string) {
  if (!socketIo) return;
  const room = rooms[roomId];
  if (!room) return;
  room.state.version++;
  
  // Emit state without logs to reduce payload size if logs are already synchronized
  const { logs, ...stateWithoutLogs } = room.state;
  socketIo.to(roomId).emit("gameStateUpdate", stateWithoutLogs);
  
  if (logMessage) {
    socketIo.to(roomId).emit("newLog", logMessage);
  }

  // Persist to Firestore
  persistRoom(roomId);
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

  if (!player || !player.isBot) return;

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
      if (otherTiles.length > 0) {
        const newTile = otherTiles[Math.floor(Math.random() * otherTiles.length)];
        state.robberTileId = newTile.id;
        addLog(room, `${player.name} moved the robber.`);
      }
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
  emitGameState(room.id, message);
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

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`[Server] ${req.method} ${req.path}`);
    next();
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/ping", (req, res) => {
    res.send("pong");
  });

  app.get("/debug", (req, res) => {
    const distPath = path.join(__dirname, "dist");
    const indexPath = path.join(distPath, "index.html");
    res.json({
      env: process.env.NODE_ENV,
      cwd: process.cwd(),
      dirname: __dirname,
      distExists: fs.existsSync(distPath),
      indexExists: fs.existsSync(indexPath),
      distContent: fs.existsSync(distPath) ? fs.readdirSync(distPath) : [],
      headers: req.headers
    });
  });

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("createGame", ({ playerName, isLocal, playerCount }) => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const shuffledTiles = [...initialTiles].sort(() => Math.random() - 0.5) as TileData[];
      const desert = shuffledTiles.find(t => t.type === 'desert');

      const colors = ["bg-red-500", "bg-blue-500", "bg-orange-500", "bg-green-500"];
      const players: Player[] = [];
      const roomPlayers: { socketId: string; playerId: number; name: string }[] = [];

      if (isLocal) {
        const count = playerCount || 2;
        for (let i = 1; i <= count; i++) {
          const name = i === 1 ? playerName : `Player ${i}`;
          players.push({
            id: i,
            name: name,
            color: colors[i - 1],
            resources: { ...INITIAL_RESOURCES },
            victoryPoints: 0,
            roads: 0,
            settlements: 0,
            cities: 0
          });
          roomPlayers.push({ socketId: socket.id, playerId: i, name: name });
        }
      } else {
        players.push({
          id: 1,
          name: playerName,
          color: colors[0],
          resources: { ...INITIAL_RESOURCES },
          victoryPoints: 0,
          roads: 0,
          settlements: 0,
          cities: 0
        });
        roomPlayers.push({ socketId: socket.id, playerId: 1, name: playerName });
      }

      const initialState: GameState = {
        players: players,
        currentPlayerIndex: 0,
        dice: [1, 1],
        hasRolled: false,
        robberTileId: desert ? desert.id : 8,
        settlements: {},
        roads: {},
        winner: null,
        gamePhase: isLocal ? 'setup' : 'waiting',
        setupStep: 0,
        discardingPlayers: [],
        victims: [],
        logs: [isLocal ? "Local game started!" : "Online room created. Waiting for players..."],
        version: 0,
        isLocal: !!isLocal,
        isOnline: !isLocal,
        isRolling: false
      };

      rooms[roomId] = {
        id: roomId,
        state: initialState,
        tiles: shuffledTiles,
        players: roomPlayers,
        isLocal: !!isLocal
      };

      socket.join(roomId);
      socket.emit("gameCreated", { roomId, state: initialState, tiles: shuffledTiles, playerId: 1, playerName });
      console.log(`[Server] ${isLocal ? 'Local' : 'Online'} game created: ${roomId}`);
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

    socket.on("updatePlayerName", ({ roomId, playerId, name }) => {
      const room = rooms[roomId];
      if (!room) return;

      const player = room.state.players.find(p => p.id === playerId);
      if (player) {
         const oldName = player.name;
         player.name = name;
         
         // Also update the internal players list
         const internalPlayer = room.players.find(p => p.playerId === playerId);
         if (internalPlayer) {
           internalPlayer.name = name;
         }

         addLog(room, `${oldName} changed their name to ${name}.`);
         emitGameState(roomId);
      }
    });

    socket.on("joinGame", ({ roomId, playerName, reconnecting, storedPlayerId }) => {
      const room = rooms[roomId];
      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }

      // Robust reconnection logic using stored ID if available
      if (reconnecting || storedPlayerId) {
        const existingPlayer = room.players.find(p => 
          (storedPlayerId && p.playerId === Number(storedPlayerId)) || 
          (!storedPlayerId && p.name === playerName)
        );
        
        if (existingPlayer) {
          existingPlayer.socketId = socket.id;
          socket.join(roomId);
          socket.emit("gameJoined", { 
            roomId, 
            state: room.state, 
            tiles: room.tiles, 
            playerId: existingPlayer.playerId, 
            playerName: existingPlayer.name 
          });
          addLog(room, `${existingPlayer.name} reconnected.`);
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
      if (!room || room.state.gamePhase !== 'play' || room.state.hasRolled || room.state.isRolling) return;

      const currentPlayerId = room.state.players[room.state.currentPlayerIndex].id;
      const currentPlayerSocket = room.players.find(p => p.playerId === currentPlayerId);
      if (!room.isLocal && currentPlayerSocket?.socketId !== socket.id) return;

      room.state.isRolling = true;
      room.state.version++;
      emitGameState(roomId);

      setTimeout(() => {
        if (!rooms[roomId]) return;
        const freshRoom = rooms[roomId];
        
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const total = d1 + d2;

        freshRoom.state.dice = [d1, d2];
        freshRoom.state.hasRolled = true;
        freshRoom.state.isRolling = false;
        freshRoom.state.version++;
        
        addLog(freshRoom, `${freshRoom.state.players[freshRoom.state.currentPlayerIndex].name} rolled a ${total}.`);

        if (total === 7) {
          const playersToDiscard = freshRoom.state.players
            .filter(p => Object.values(p.resources).reduce((a, b) => (a as number) + (b as number), 0) > 7)
            .map(p => p.id);
          
          if (playersToDiscard.length > 0) {
            freshRoom.state.gamePhase = 'discarding';
            freshRoom.state.discardingPlayers = playersToDiscard;
          } else {
            freshRoom.state.gamePhase = 'robber';
          }
        } else {
          const updatedPlayers = [...freshRoom.state.players];
          const resourceGains: Record<string, Record<string, number>> = {};
          
          (Object.values(freshRoom.state.settlements) as Settlement[]).forEach(settlement => {
            const player = updatedPlayers.find(p => p.id === settlement.playerId);
            if (!player) return;

            const tileCoords = settlement.vertexId.replace('v:', '').split('|').map(s => s.split(',').map(Number));
            tileCoords.forEach(([q, r]) => {
              const tile = getTileAt(freshRoom.tiles, q, r);
              if (tile && tile.number === total && tile.id !== freshRoom.state.robberTileId) {
                const amount = settlement.type === 'city' ? 2 : 1;
                const resType = tile.type;
                if (resType !== 'desert') {
                  player.resources[resType] += amount;
                  if (!resourceGains[player.name]) resourceGains[player.name] = {};
                  resourceGains[player.name][resType] = (resourceGains[player.name][resType] || 0) + amount;
                }
              }
            });
          });

          Object.entries(resourceGains).forEach(([name, gains]) => {
            const gainStr = Object.entries(gains).map(([res, count]) => `${count} ${res}`).join(', ');
            if (gainStr) addLog(freshRoom, `${name} received: ${gainStr}`);
          });

          freshRoom.state.players = updatedPlayers;
        }
        emitGameState(roomId);
      }, 1500);
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

        // Connectivity Rule: Must be next to own settlement or own road
        // An edge ID looks like "v:0,0,0|v:0,0,1"
        const vertices = edgeId.replace('v:', '').split('|');
        const isConnected = Object.values(room.state.settlements).some(s => 
          s.playerId === player.id && vertices.includes(s.vertexId)
        ) || Object.values(room.state.roads).some(r => 
          r.playerId === player.id && (r.edgeId.includes(vertices[0]) || r.edgeId.includes(vertices[1]))
        );

        if (!isConnected) {
          socket.emit("error", "Road must be connected to your territory");
          return;
        }

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
      // We don't remove players immediately to allow reconnection
      // But we can log it for debug
      for (const roomId in rooms) {
        const room = rooms[roomId];
        const player = room.players.find(p => p.socketId === socket.id);
        if (player) {
          // console.log(`Player ${player.name} in room ${roomId} disconnected.`);
        }
      }
    });
  });

  // Serve static files and handle routing
  const nodeEnv = process.env.NODE_ENV || "production";
  const isDevelopment = nodeEnv !== "production";
  console.log(`[Server] Detected Environment: "${nodeEnv}" (isDevelopment: ${isDevelopment})`);
  
  if (isDevelopment && nodeEnv !== "test") {
    console.log("[Server] Attempting to start with Vite middleware (Development Mode)...");
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("[Server] Vite middleware attached successfully.");
    } catch (e) {
      console.error("[Server] Critical: Failed to load Vite middleware. Falling back to static files.", e);
      serveStaticFallback(app);
    }
  } else {
    // Production Mode
    serveStaticFallback(app);
  }

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] SUCCESS: Listening on 0.0.0.0:${PORT}`);
  });
}

function serveStaticFallback(app: any) {
  const rootDir = process.cwd();
  const distPath = path.resolve(rootDir, "dist");
  const indexPath = path.resolve(distPath, "index.html");
  
  console.log(`[Server] Static Fallback Initialized`);
  console.log(`[Server] Root Directory: ${rootDir}`);
  console.log(`[Server] Dist Path: ${distPath}`);
  console.log(`[Server] Index Path: ${indexPath}`);
  
  if (fs.existsSync(distPath)) {
    console.log(`[Server] Found dist folder. Serving static assets.`);
    app.use(express.static(distPath));
  } else {
    console.warn(`[Server] WARNING: dist folder NOT FOUND at ${distPath}. If this is production, the front-end will not load.`);
  }
  
  app.get("*", (req: any, res: any) => {
    // Skip API routes if they fell through
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "API route not found" });
    }
    
    console.log(`[Server] Static catch-all serving for: ${req.path}`);
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error(`[Server] ERROR: ${indexPath} missing.`);
      res.status(404).send(`
        <html>
          <body style="font-family: sans-serif; padding: 2rem; background: #f9fafb; color: #111827;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 2rem; border-radius: 0.75rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
              <h1 style="color: #ef4444;">Server Running, but Build Missing</h1>
              <p>The Node.js server is successfully listening on port 3000, but the front-end build artifacts (index.html) were not found.</p>
              <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid #e5e7eb;"/>
              <div style="font-size: 0.875rem; color: #4b5563;">
                <p><strong>Diagnosis Info:</strong></p>
                <ul style="list-style: none; padding: 0;">
                  <li>â€¢ Expected Path: <code>${indexPath}</code></li>
                  <li>â€¢ Current WorkDir: <code>${process.cwd()}</code></li>
                  <li>â€¢ Environment: <code>${process.env.NODE_ENV}</code></li>
                  <li>â€¢ Files in root: <code>${fs.readdirSync(process.cwd()).join(', ')}</code></li>
                </ul>
              </div>
            </div>
          </body>
        </html>
      `);
    }
  });
}

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('[Server] CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

async function testFirebaseConnection() {
  if (!db) return;
  try {
    const { getDocFromServer } = await import('firebase/firestore');
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("[Firebase] Connection check successful.");
  } catch (error: any) {
    if (error.message?.includes('the client is offline')) {
      console.error("[Firebase] CRITICAL: Client is offline. Check configuration.");
    } else {
      console.log("[Firebase] Connection check info:", error.message);
    }
  }
}

// Load existing rooms can be done in the background or awaited after server start
startServer().then(async () => {
  console.log("[Server] Attempting to load initial state from Firestore...");
  try {
    await loadRooms();
    await testFirebaseConnection();
  } catch (err) {
    console.error("[Server] Post-startup loading error:", err);
  }
}).catch(err => {
  console.error('[Server] CRITICAL: Fatal Startup Error:', err);
  process.exit(1);
});
