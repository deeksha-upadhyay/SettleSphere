import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ResourceType } from '../types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";

interface HexTileProps {
  id: number;
  type: ResourceType;
  number: number | null;
  q: number;
  r: number;
  className?: string;
  isRobber?: boolean;
  onMoveRobber?: (id: number) => void;
  diceRoll?: number;
  hasRolled?: boolean;
}

const resourceInfo: Record<ResourceType, { bg: string; text: string; icon: string; label: string; color: string }> = {
  wood: { bg: 'bg-wood', text: 'text-white', icon: '🌲', label: 'Wood Forest', color: '#2D5A27' },
  brick: { bg: 'bg-brick', text: 'text-white', icon: '🧱', label: 'Brick Quarry', color: '#A0522D' },
  sheep: { bg: 'bg-sheep', text: 'text-text-dark', icon: '🐑', label: 'Sheep Pasture', color: '#90EE90' },
  wheat: { bg: 'bg-wheat', text: 'text-text-dark', icon: '🌾', label: 'Wheat Field', color: '#F4D03F' },
  ore: { bg: 'bg-ore', text: 'text-white', icon: '⛰️', label: 'Ore Mine', color: '#708090' },
  desert: { bg: 'bg-desert', text: 'text-text-dark', icon: '🏜️', label: 'Desert', color: '#EDC9AF' },
};

export const HexTile: React.FC<HexTileProps> = React.memo(({ 
  id, type, number, q, r, className, isRobber, onMoveRobber, diceRoll, hasRolled 
}) => {
  const info = resourceInfo[type];
  const [isProducing, setIsProducing] = useState(false);

  useEffect(() => {
    if (number && hasRolled && diceRoll === number && !isRobber) {
      setIsProducing(true);
      const timer = setTimeout(() => setIsProducing(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [diceRoll, hasRolled, number, isRobber]);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <motion.div
            whileHover={{ scale: 1.05, zIndex: 10 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onMoveRobber?.(id)}
            className={cn(
              "relative w-[120px] h-[138px] flex items-center justify-center cursor-pointer transition-all duration-300",
              className
            )}
          >
             {/* Hexagon Shape */}
            <motion.div 
              animate={isProducing ? {
                filter: ['brightness(1)', 'brightness(1.8)', 'brightness(1)'],
                scale: [1, 1.05, 1],
              } : {}}
              transition={{ duration: 0.6, repeat: isProducing ? 2 : 0, ease: "easeInOut" }}
              className={cn(
                "absolute inset-0 w-full h-full clip-hex shadow-[inset_0_0_30px_rgba(0,0,0,0.3)] transition-shadow duration-300 border-[3px] border-black/10",
                info.bg,
                isRobber && "brightness-50"
              )}
            />

            {/* Hover Glow Ring */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-[2px] w-[calc(100%-4px)] h-[calc(100%-4px)] clip-hex border-2 border-white/40 z-20 pointer-events-none"
            />

            {/* Production Glow */}
            <AnimatePresence>
              {isProducing && (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.4, scale: 1.1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 w-full h-full clip-hex bg-white z-0"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: -80 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute z-[60] pointer-events-none"
                  >
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-xl border border-white/50 flex items-center gap-1">
                      <span className="text-lg">{info.icon}</span>
                      <span className="text-sm font-black text-green-600">+1</span>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
            
            {/* Inner Content */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              {isRobber && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
                >
                  <div className="w-16 h-16 bg-gray-900/90 backdrop-blur-sm rounded-full border-4 border-gray-100/20 shadow-2xl flex items-center justify-center relative">
                    <span className="text-3xl filter drop-shadow-lg">🦹‍♂️</span>
                    <div className="absolute -top-6 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-white/20">Blocked</div>
                  </div>
                </motion.div>
              )}
              
              <motion.div 
                animate={isProducing ? { y: [0, -10, 0] } : {}}
                className="flex flex-col items-center gap-1 group-hover:scale-110 transition-transform duration-300"
              >
                <div className="text-3xl drop-shadow-md filter saturate-150 mb-1 group-hover:rotate-12 transition-transform">
                  {info.icon}
                </div>
                <div className={cn(
                  "px-2 py-0.5 rounded-full bg-black/10 backdrop-blur-[2px] transition-all",
                  "border border-white/10"
                )}>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-[0.1em]",
                    info.text
                  )}>
                    {type}
                  </span>
                </div>
              </motion.div>

              {number !== null && !isRobber && (
                <motion.div 
                  animate={isProducing ? { scale: [1, 1.2, 1] } : {}}
                  className="mt-3 bg-white rounded-[14px] w-12 h-14 flex flex-col items-center justify-center shadow-xl border-b-4 border-gray-200 relative overflow-hidden group/token"
                >
                  <div className="absolute top-0 inset-x-0 h-0.5 bg-gray-100" />
                  <span className={cn(
                    "font-black text-2xl leading-none",
                    (number === 6 || number === 8) ? "text-[#E63946]" : "text-text-dark"
                  )}>
                    {number}
                  </span>
                  <div className="flex gap-0.5 mt-1.5">
                    {Array.from({ length: 
                      number === 2 || number === 12 ? 1 : 
                      number === 3 || number === 11 ? 2 : 
                      number === 4 || number === 10 ? 3 : 
                      number === 5 || number === 9 ? 4 : 5 
                    }).map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-gray-300" />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 w-full h-full clip-hex bg-black/0 hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
          </motion.div>
        }
      />
      <TooltipContent className="bg-text-dark text-white border-none rounded-xl px-4 py-2 font-bold">
        <p>{info.label}</p>
        {number && <p className="text-xs font-medium opacity-70">Produces {type.charAt(0).toUpperCase() + type.slice(1)} when {number} is rolled</p>}
        {type === 'desert' && <p className="text-xs font-medium opacity-70">Produces nothing</p>}
      </TooltipContent>
    </Tooltip>
  );
});

HexTile.displayName = 'HexTile';
