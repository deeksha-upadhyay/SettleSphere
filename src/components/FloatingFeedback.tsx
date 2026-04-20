
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface FloatingFeedbackProps {
  id: string;
  text: string;
  icon?: string;
  color?: string;
  onComplete: (id: string) => void;
}

export const FloatingFeedback: React.FC<FloatingFeedbackProps> = ({ id, text, icon, color, onComplete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.5 }}
      animate={{ opacity: 1, y: -100, scale: 1.2 }}
      exit={{ opacity: 0, scale: 1.5 }}
      onAnimationComplete={() => onComplete(id)}
      className={cn(
        "fixed z-[120] pointer-events-none flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-2xl border border-white/50",
        color
      )}
      style={{
        left: `calc(50% + ${Math.random() * 100 - 50}px)`,
        top: `calc(50% + ${Math.random() * 100 - 50}px)`,
      }}
    >
      {icon && <span className="text-xl">{icon}</span>}
      <span className="font-black text-lg tracking-tight">{text}</span>
    </motion.div>
  );
};
