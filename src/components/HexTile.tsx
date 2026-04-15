import React from 'react';
import { motion } from 'motion/react';
import { ResourceType } from '../types';
import { cn } from '@/lib/utils';

interface HexTileProps {
  id: number;
  type: ResourceType;
  number: number | null;
  q: number;
  r: number;
  className?: string;
  isRobber?: boolean;
  onMoveRobber?: () => void;
}

const resourceColors: Record<ResourceType, { bg: string; text: string; icon: string }> = {
  wood: { bg: 'bg-wood', text: 'text-white', icon: '🌲' },
  brick: { bg: 'bg-brick', text: 'text-white', icon: '🧱' },
  sheep: { bg: 'bg-sheep', text: 'text-text-dark', icon: '🐑' },
  wheat: { bg: 'bg-wheat', text: 'text-text-dark', icon: '🌾' },
  ore: { bg: 'bg-ore', text: 'text-white', icon: '⛰️' },
  desert: { bg: 'bg-desert', text: 'text-text-dark', icon: '🏜️' },
};

export const HexTile: React.FC<HexTileProps> = ({ id, type, number, q, r, className, isRobber, onMoveRobber }) => {
  const color = resourceColors[type];

  return (
    <motion.div
      whileHover={{ scale: 1.05, zIndex: 10 }}
      onClick={onMoveRobber}
      className={cn(
        "relative w-[120px] h-[138px] flex items-center justify-center cursor-pointer transition-all duration-300",
        className
      )}
    >
      {/* Hexagon Shape */}
      <div 
        className={cn(
          "absolute inset-0 w-full h-full clip-hex shadow-inner transition-shadow duration-300",
          color.bg,
          isRobber && "brightness-50"
        )}
      />
      
      {/* Inner Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {isRobber && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="w-12 h-12 bg-gray-900 rounded-full border-4 border-gray-700 shadow-2xl flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
          </div>
        )}
        {number !== null && !isRobber && (
          <div className="bg-[#FDFCF0] rounded-full w-11 h-11 flex flex-col items-center justify-center shadow-md border border-[#D4D1C5]">
            <span className={cn(
              "font-extrabold text-lg leading-none",
              (number === 6 || number === 8) ? "text-[#E63946]" : "text-text-dark"
            )}>
              {number}
            </span>
            <div className="text-[10px] tracking-widest text-gray-400 leading-none mt-0.5">
              {"•".repeat(number === 2 || number === 12 ? 1 : number === 3 || number === 11 ? 2 : number === 4 || number === 10 ? 3 : number === 5 || number === 9 ? 4 : 5)}
            </div>
          </div>
        )}
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 w-full h-full clip-hex bg-black/0 hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
    </motion.div>
  );
};
