import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ResourceType } from '../types';
import { cn } from '@/lib/utils';
import { useGame } from '../contexts/GameContext';
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
  onMoveRobber?: () => void;
}

const resourceInfo: Record<ResourceType, { bg: string; text: string; icon: string; label: string; color: string }> = {
  wood: { bg: 'bg-wood', text: 'text-white', icon: '🌲', label: 'Wood Forest', color: '#2D5A27' },
  brick: { bg: 'bg-brick', text: 'text-white', icon: '🧱', label: 'Brick Quarry', color: '#A0522D' },
  sheep: { bg: 'bg-sheep', text: 'text-text-dark', icon: '🐑', label: 'Sheep Pasture', color: '#90EE90' },
  wheat: { bg: 'bg-wheat', text: 'text-text-dark', icon: '🌾', label: 'Wheat Field', color: '#F4D03F' },
  ore: { bg: 'bg-ore', text: 'text-white', icon: '⛰️', label: 'Ore Mine', color: '#708090' },
  desert: { bg: 'bg-desert', text: 'text-text-dark', icon: '🏜️', label: 'Desert', color: '#EDC9AF' },
};

export const HexTile: React.FC<HexTileProps> = React.memo(({ id, type, number, q, r, className, isRobber, onMoveRobber }) => {
  const { state } = useGame();
  const info = resourceInfo[type];
  const [isProducing, setIsProducing] = useState(false);

  useEffect(() => {
    if (!state || !number) return;
    const diceSum = state.dice[0] + state.dice[1];
    if (state.hasRolled && diceSum === number && !isRobber) {
      setIsProducing(true);
      const timer = setTimeout(() => setIsProducing(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [state?.dice, state?.hasRolled, number, isRobber]);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <motion.div
            whileHover={{ scale: 1.05, zIndex: 10 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMoveRobber}
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
                "absolute inset-0 w-full h-full clip-hex shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] transition-shadow duration-300",
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
                  className="absolute inset-0 flex items-center justify-center z-20"
                >
                  <div className="w-12 h-12 bg-gray-900 rounded-full border-4 border-gray-700 shadow-2xl flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                </motion.div>
              )}
              
              <motion.div 
                animate={isProducing ? { y: [0, -10, 0] } : {}}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-2xl drop-shadow-sm">{info.icon}</span>
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-tighter opacity-80",
                  info.text
                )}>
                  {info.label}
                </span>
              </motion.div>

              {number !== null && !isRobber && (
                <motion.div 
                  animate={isProducing ? { scale: [1, 1.2, 1] } : {}}
                  className="mt-2 bg-[#FDFCF0] rounded-full w-12 h-12 flex flex-col items-center justify-center shadow-md border border-[#D4D1C5]"
                >
                  <span className={cn(
                    "font-black text-xl leading-none",
                    (number === 6 || number === 8) ? "text-[#E63946]" : "text-text-dark"
                  )}>
                    {number}
                  </span>
                  <div className="text-[10px] tracking-widest text-gray-400 leading-none mt-0.5">
                    {"•".repeat(number === 2 || number === 12 ? 1 : number === 3 || number === 11 ? 2 : number === 4 || number === 10 ? 3 : number === 5 || number === 9 ? 4 : 5)}
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
