export type ResourceType = 'wood' | 'brick' | 'sheep' | 'wheat' | 'ore' | 'desert';

export interface TileData {
  id: number;
  type: ResourceType;
  number: number | null;
}

export interface Player {
  id: number;
  name: string;
  color: string;
  score: number;
  resources: {
    wood: number;
    brick: number;
    sheep: number;
    wheat: number;
    ore: number;
  };
}
