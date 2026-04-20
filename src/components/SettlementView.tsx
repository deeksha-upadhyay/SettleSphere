import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Settlement, Player } from '../types';

interface SettlementViewProps {
  vId: string;
  settlement: Settlement | null;
  owner: Player | null;
  isValidBuild: boolean;
  canUpgrade: boolean;
  isMyTurn: boolean;
  onClick: () => void;
  style: React.CSSProperties;
}

export const SettlementView: React.FC<SettlementViewProps> = React.memo(({ 
  vId, settlement, owner, isValidBuild, canUpgrade, isMyTurn, onClick, style 
}) => {
  return (
    <motion.div
      initial={settlement ? { scale: 0, opacity: 0, rotate: -45 } : false}
      animate={settlement ? { 
        scale: settlement.type === 'city' ? 1.25 : 1, 
        opacity: 1, 
        rotate: 0,
        boxShadow: ['0 0 0px rgba(255,255,255,0)', '0 0 20px rgba(255,255,255,0.8)', '0 0 0px rgba(255,255,255,0)']
      } : { 
        opacity: isValidBuild ? 1 : 0,
        scale: isValidBuild ? [1, 1.15, 1] : 1
      }}
      transition={settlement ? { 
        type: "spring", 
        stiffness: 400, 
        damping: 15,
        boxShadow: { duration: 1, times: [0, 0.5, 1] }
      } : { 
        opacity: { duration: 0.2 },
        scale: isValidBuild ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : { duration: 0.2 }
      }}
      whileHover={isMyTurn && isValidBuild ? { scale: 1.3, zIndex: 40 } : {}}
      onClick={onClick}
      style={style}
      className={cn(
        "absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 z-30 rounded-full flex items-center justify-center transition-all",
        isMyTurn ? "cursor-pointer" : "cursor-default",
        settlement 
          ? cn(owner?.color, settlement.type === 'city' ? "rounded-sm shadow-xl" : "rounded-full shadow-lg")
          : cn(
              "bg-white/30 border border-white/50 backdrop-blur-sm",
              isValidBuild && "border-accent ring-2 ring-accent/50 ring-offset-2 shadow-[0_0_15px_rgba(255,215,0,0.4)]"
            ),
        canUpgrade && "ring-4 ring-accent ring-offset-2 shadow-[0_0_20px_rgba(255,215,0,0.6)]"
      )}
    >
      {settlement && (
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-[10px] font-bold text-white"
        >
          {settlement.type === 'city' ? 'C' : 'S'}
        </motion.span>
      )}
    </motion.div>
  );
});

SettlementView.displayName = 'SettlementView';
