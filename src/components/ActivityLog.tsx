import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityLogProps {
  logs: string[];
}

export const ActivityLog: React.FC<ActivityLogProps> = React.memo(({ logs }) => {
  return (
    <motion.aside
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="hidden xl:flex w-72 bg-white/90 backdrop-blur-md border-l border-black/5 flex-col p-6 gap-4"
    >
      <div className="flex items-center gap-2 text-text-dark/60 font-black text-xs uppercase tracking-widest">
        <History size={14} />
        Activity Log
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
        <AnimatePresence initial={false}>
          {logs.slice().reverse().map((log, i) => (
            <motion.div
              key={`${logs.length - i}-${log}`}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={cn(
                "text-[13px] font-medium p-3 rounded-xl border border-black/5 shadow-sm transition-all hover:scale-[1.02]",
                log.includes("wins") || log.includes("Victory") ? "bg-accent/20 border-accent/30 text-text-dark font-black" : "bg-white text-text-dark/80"
              )}
            >
              <div className="flex gap-2">
                <span className="text-gray-400 font-mono text-[10px] mt-0.5">{logs.length - i}</span>
                <span>{log}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
});

ActivityLog.displayName = 'ActivityLog';
