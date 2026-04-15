import React from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Dices } from 'lucide-react';

export const Dice: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-accent px-6 py-3 rounded-full font-bold text-text-dark shadow-lg text-sm tracking-wider">
        MARCUS'S TURN
      </div>
      <div className="bg-white p-5 rounded-[20px] shadow-lg flex gap-3 items-center border border-gray-100">
        <Die value={4} />
        <Die value={2} />
      </div>
      <Button 
        className="bg-text-dark hover:bg-[#4F5D75] text-white font-bold py-7 px-10 rounded-xl shadow-lg transition-all uppercase tracking-widest text-sm"
      >
        Roll Dice
      </Button>
    </div>
  );
};

const Die: React.FC<{ value: number }> = ({ value }) => (
  <motion.div 
    whileHover={{ rotate: 5 }}
    className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center border-2 border-text-dark"
  >
    <span className="text-2xl font-bold text-text-dark">{value}</span>
  </motion.div>
);
