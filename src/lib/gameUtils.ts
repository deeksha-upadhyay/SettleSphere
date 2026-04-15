import { TileData } from '../types';

export const getVertexTiles = (q: number, r: number, vIndex: number) => {
  const neighbors = [
    [q, r-1], [q+1, r-1], [q+1, r], [q, r+1], [q-1, r+1], [q-1, r]
  ];
  
  switch(vIndex) {
    case 0: return [[q, r], [q, r-1], [q+1, r-1]];
    case 1: return [[q, r], [q+1, r-1], [q+1, r]];
    case 2: return [[q, r], [q+1, r], [q, r+1]];
    case 3: return [[q, r], [q, r+1], [q-1, r+1]];
    case 4: return [[q, r], [q-1, r+1], [q-1, r]];
    case 5: return [[q, r], [q-1, r], [q, r-1]];
    default: return [[q, r]];
  }
};

export const getCanonicalVertexId = (q: number, r: number, vIndex: number) => {
  const tiles = getVertexTiles(q, r, vIndex);
  return 'v:' + tiles.map(([tq, tr]) => `${tq},${tr}`).sort().join('|');
};

export const getCanonicalEdgeId = (q: number, r: number, eIndex: number) => {
  // Edge 0 is between vertex 0 and 1
  const v1 = getCanonicalVertexId(q, r, eIndex);
  const v2 = getCanonicalVertexId(q, r, (eIndex + 1) % 6);
  return 'e:' + [v1, v2].sort().join('|');
};

export const getTileAt = (tiles: TileData[], q: number, r: number) => {
  return tiles.find(t => t.q === q && t.r === r);
};
