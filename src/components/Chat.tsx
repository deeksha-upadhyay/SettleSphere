import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageSquare, X } from 'lucide-react';

export const Chat: React.FC = () => {
  const { messages, sendMessage } = useGame();
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            className="bg-white w-80 h-[450px] rounded-[30px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="p-5 bg-text-dark text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-accent" />
                <span className="font-bold tracking-wide">ISLAND CHAT</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] font-black text-text-dark/40 uppercase tracking-tighter">{msg.sender}</span>
                    <span className="text-[9px] text-gray-300">{msg.timestamp}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl rounded-tl-none text-sm text-text-dark font-medium border border-gray-100">
                    {msg.text}
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 grayscale">
                  <MessageSquare size={48} className="mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">No messages yet</p>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Say something..."
                className="flex-1 bg-white px-4 py-2 rounded-xl text-sm outline-none border border-transparent focus:border-accent transition-all font-medium"
              />
              <Button onClick={handleSend} className="bg-text-dark hover:bg-accent hover:text-text-dark p-2 h-auto rounded-xl transition-all">
                <Send size={16} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-text-dark text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all relative group"
      >
        <MessageSquare size={24} />
        {!isOpen && messages.length > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-text-dark text-[10px] font-black rounded-full flex items-center justify-center border-2 border-sea animate-bounce">
            {messages.length}
          </div>
        )}
      </button>
    </div>
  );
};
