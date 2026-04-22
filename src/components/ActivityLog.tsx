import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityLogProps {
  logs: string[];
}

export const ActivityLog: React.FC<ActivityLogProps> = React.memo(({ logs }) => {
  const visibleLogs = logs.slice().reverse().slice(0, 15);
  
  return (
    <div className="flex flex-col h-[350px] shrink-0 p-6 gap-4 bg-gray-50/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-text-dark/60 font-black text-[10px] uppercase tracking-[0.2em]">
          <History size={12} />
          Game Events
        </div>
        <div className="px-2 py-0.5 rounded bg-black/5 text-[9px] font-bold text-gray-400">
          Last {visibleLogs.length}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
        <AnimatePresence initial={false}>
          {visibleLogs.map((log, i) => {
            const isCritical = log.includes("wins") || log.includes("Victory") || log.includes("Robber");
            const isResource = log.includes("received");
            
            return (
              <motion.div
                key={`${logs.length - i}-${log}`}
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={cn(
                  "text-[12px] p-3 rounded-2xl border transition-all duration-300 backdrop-blur-sm",
                  isCritical 
                    ? "bg-accent/10 border-accent/30 text-text-dark font-black shadow-lg shadow-accent/5" 
                    : isResource 
                      ? "bg-white/40 border-black/5 text-gray-500 italic"
                      : "bg-white border-black/5 text-text-dark/80 shadow-sm"
                )}
              >
                <div className="flex gap-3">
                  <div className="flex flex-col items-center shrink-0 w-4">
                    <span className="text-[8px] font-black text-gray-300 font-mono mt-1">{logs.length - i}</span>
                  </div>
                  <span className="leading-relaxed">{log}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
});

ActivityLog.displayName = 'ActivityLog';
