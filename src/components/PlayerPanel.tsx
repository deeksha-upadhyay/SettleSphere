import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Player } from '../types';
import { cn } from '@/lib/utils';
import { useGame } from '../contexts/GameContext';

export const PlayerPanel: React.FC = () => {
  const { state, playerId } = useGame();
  if (!state) return null;
  const players = state.players;
  const myPlayer = players.find(p => p.id === playerId) || players[0];

  return (
    <div className="w-[260px] flex flex-col gap-6 h-full overflow-y-auto p-8 bg-panel border-r border-black/10 shadow-[4px_0_20px_rgba(0,0,0,0.05)] custom-scrollbar z-10">
      <div>
        <h3 className="text-[14px] font-bold text-text-dark/60 uppercase tracking-[1.5px] mb-4">Active Players</h3>
        <div className="space-y-3">
          {players.map((player, index) => (
            <div 
              key={player.id} 
              className={cn(
                "p-4 rounded-2xl bg-white shadow-[0_2px_6px_rgba(0,0,0,0.04)] border-2 transition-all",
                state.currentPlayerIndex === index ? "border-[#E9C46A] shadow-[0_0_15px_rgba(233,196,106,0.3)]" : "border-transparent opacity-80"
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("w-8 h-8 rounded-full shadow-sm", player.color)} />
                <span className="font-bold text-[15px] text-text-dark">{player.name} {state.currentPlayerIndex === index && "(Turn)"}</span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 gap-x-1 text-[13px] text-gray-500">
                <div className="flex items-center gap-1.5">🏠 {player.settlements} Set.</div>
                <div className="flex items-center gap-1.5">🏙️ {player.cities} Cities</div>
                <div className="flex items-center gap-1.5">🛤️ {player.roads} Roads</div>
                <div className="flex items-center gap-1.5 font-bold text-text-dark">🏆 {player.victoryPoints} VP</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto">
        <h3 className="text-[14px] font-bold text-text-dark/60 uppercase tracking-[1.5px] mb-4">Your Resources</h3>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(myPlayer.resources).map(([res, count]) => (
            res !== 'desert' && (
              <div key={res} className="text-center bg-white/50 p-2 rounded-xl border border-black/5">
                <div className="text-xl mb-0.5">
                  {res === 'wood' ? '🌲' : res === 'brick' ? '🧱' : res === 'sheep' ? '🐑' : res === 'wheat' ? '🌾' : '⛰️'}
                </div>
                <div className="text-[11px] font-bold text-text-dark">{count}</div>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
};
