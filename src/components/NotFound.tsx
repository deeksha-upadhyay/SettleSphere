import React from 'react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, AlertCircle } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-sea flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-12 rounded-[48px] shadow-2xl text-center flex flex-col items-center gap-6 max-w-md w-full border-4 border-white/20 backdrop-blur-sm"
      >
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-2">
          <AlertCircle size={48} />
        </div>
        
        <div>
          <h1 className="text-6xl font-black text-text-dark uppercase tracking-tighter mb-2 italic">404</h1>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 tracking-tight">Settlement Not Found</h2>
          <p className="text-gray-500 font-medium leading-relaxed">
            It seems the robber has stolen this page! The hexagonal path you followed doesn't exist.
          </p>
        </div>

        <Button 
          onClick={() => navigate('/')}
          className="w-full bg-text-dark hover:bg-accent hover:text-text-dark font-black py-8 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2"
        >
          <Home size={18} />
          Back to Harbor
        </Button>
      </motion.div>
    </div>
  );
};
