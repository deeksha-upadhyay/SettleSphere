import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../contexts/GameContext';
import { cn } from '@/lib/utils';

interface FeedbackItem {
  id: string;
  text: string;
  type: 'resource' | 'info' | 'warning';
  x: number;
  y: number;
}

export const FloatingFeedback: React.FC = () => {
  const { state } = useGame();
  const [items, setItems] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    if (!state) return;
    
    // Watch for new logs to trigger feedback
    const lastLog = state.logs[state.logs.length - 1];
    if (!lastLog) return;

    // Simple heuristic: if log contains "rolled", show dice feedback
    // If log contains "built", show build feedback
    // In a real app, we might have a dedicated event for this.
    
    // For now, let's just use a simple random position or center for general feedback
    // But better to trigger it from specific actions.
  }, [state?.logs.length]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      <AnimatePresence>
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: item.y, x: item.x }}
            animate={{ opacity: 1, y: item.y - 100 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={cn(
              "absolute font-black text-xl drop-shadow-lg",
              item.type === 'resource' ? "text-green-500" : 
              item.type === 'warning' ? "text-red-500" : "text-accent"
            )}
          >
            {item.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Helper to add feedback from outside if needed
export const useFeedback = () => {
  // This could be a global state or event bus
};
