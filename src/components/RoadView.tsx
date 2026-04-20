import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Player, Road } from '../types';

interface RoadViewProps {
  eId: string;
  road: Road | null;
  owner: Player | null;
  isValidRoad: boolean;
  isMyTurn: boolean;
  onClick: () => void;
  style: React.CSSProperties;
}

export const RoadView: React.FC<RoadViewProps> = React.memo(({
  eId, road, owner, isValidRoad, isMyTurn, onClick, style
}) => {
  return (
    <motion.div
      initial={road ? { scaleX: 0, opacity: 0 } : false}
      animate={road ? { 
        scaleX: 1, 
        opacity: 1,
        filter: ['brightness(1)', 'brightness(2)', 'brightness(1)']
      } : { 
        opacity: isValidRoad ? 1 : 0,
        scaleY: isValidRoad ? [1, 1.3, 1] : 1
      }}
      transition={road ? { 
        duration: 0.6, 
        ease: "circOut",
        filter: { duration: 0.8, times: [0, 0.2, 1] }
      } : {
        opacity: { duration: 0.2 },
        scaleY: isValidRoad ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : { duration: 0.2 }
      }}
      onClick={onClick}
      style={style}
      className={cn(
        "absolute w-10 h-2 z-20 transition-all",
        isMyTurn ? "cursor-pointer" : "cursor-default",
        road 
          ? cn(owner?.color, "h-3 shadow-lg border border-white/30")
          : cn(
              "bg-white/20 border border-white/30 backdrop-blur-sm",
              isValidRoad && "bg-white/40 border-accent shadow-[0_0_10px_rgba(255,215,0,0.3)] ring-1 ring-accent/40"
            )
      )}
    />
  );
});

RoadView.displayName = 'RoadView';
