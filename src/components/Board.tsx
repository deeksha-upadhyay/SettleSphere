import React, { useState, useEffect } from 'react';
import { HexTile } from './HexTile';
import tilesData from '../data/tiles.json';
import { TileData } from '../types';

export const Board: React.FC = () => {
  const [tiles, setTiles] = useState<TileData[]>([]);

  useEffect(() => {
    // Randomize tiles on load
    const shuffled = [...tilesData].sort(() => Math.random() - 0.5) as TileData[];
    setTiles(shuffled);
  }, []);

  if (tiles.length === 0) return null;

  // Split tiles into rows: 3-4-5-4-3
  const rows = [
    tiles.slice(0, 3),
    tiles.slice(3, 7),
    tiles.slice(7, 12),
    tiles.slice(12, 16),
    tiles.slice(16, 19),
  ];

  return (
    <div className="flex flex-col items-center justify-center p-8 select-none">
      {rows.map((row, rowIndex) => (
        <div 
          key={rowIndex} 
          className="flex justify-center -mt-[34px] first:mt-0"
        >
          {row.map((tile) => (
            <HexTile 
              key={tile.id} 
              type={tile.type} 
              number={tile.number} 
              className="mx-[2px]"
            />
          ))}
        </div>
      ))}
    </div>
  );
};
