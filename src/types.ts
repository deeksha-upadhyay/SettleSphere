export type ResourceType = 'wood' | 'brick' | 'sheep' | 'wheat' | 'ore' | 'desert';

export interface TileData {
  id: number;
  type: ResourceType;
  number: number | null;
  q: number; // axial coordinates
  r: number;
}

export interface Player {
  id: number;
  name: string;
  color: string;
  resources: Record<ResourceType, number>;
  victoryPoints: number;
  roads: number;
  settlements: number;
  cities: number;
}

export type StructureType = 'settlement' | 'city';

export interface Settlement {
  playerId: number;
  type: StructureType;
  vertexId: string;
}

export interface Road {
  playerId: number;
  edgeId: string;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  dice: [number, number];
  hasRolled: boolean;
  robberTileId: number;
  settlements: Record<string, Settlement>; // key: vertexId
  roads: Record<string, Road>; // key: edgeId
  winner: number | null;
  gamePhase: 'waiting' | 'setup' | 'play' | 'robber' | 'discarding';
  setupStep: number; // for initial placement
  discardingPlayers: number[]; // IDs of players who still need to discard
  victims: number[]; // IDs of players who can be stolen from
  logs: string[];
}
