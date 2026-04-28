import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const UserMenu: React.FC = () => {
  const { user, signInWithGoogle, signOut, loading } = useAuth();

  if (loading) return <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />;

  return (
    <div className="relative flex items-center gap-4">
      <AnimatePresence mode="wait">
        {user ? (
          <motion.div 
            key="user-signed-in"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20"
          >
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium text-white leading-none">{user.displayName}</span>
              <button 
                onClick={() => signOut()}
                className="text-[10px] text-white/60 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || 'User'} 
                className="w-8 h-8 rounded-full border-2 border-white/40 shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center border-2 border-white/40 shadow-sm">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
            )}
          </motion.div>
        ) : (
          <motion.button
            key="user-signed-out"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={signInWithGoogle}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 px-4 py-2 rounded-full text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            Sign in with Google
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
