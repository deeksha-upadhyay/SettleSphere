import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Player } from '../types';
import { cn } from '@/lib/utils';
import { User, Trophy, Package } from 'lucide-react';

const dummyPlayers: Player[] = [
  {
    id: 1,
    name: "Player 1",
    color: "bg-red-500",
    score: 4,
    resources: { wood: 2, brick: 1, sheep: 3, wheat: 0, ore: 1 }
  },
  {
    id: 2,
    name: "Player 2",
    color: "bg-blue-500",
    score: 2,
    resources: { wood: 0, brick: 2, sheep: 1, wheat: 4, ore: 0 }
  },
  {
    id: 3,
    name: "Player 3",
    color: "bg-orange-500",
    score: 3,
    resources: { wood: 1, brick: 0, sheep: 2, wheat: 1, ore: 2 }
  }
];

export const PlayerPanel: React.FC = () => {
  return (
    <div className="w-[260px] flex flex-col gap-6 h-full overflow-y-auto p-8 bg-panel border-r border-black/10 shadow-[4px_0_20px_rgba(0,0,0,0.05)] custom-scrollbar z-10">
      <div>
        <h3 className="text-[14px] font-bold text-text-dark/60 uppercase tracking-[1.5px] mb-4">Active Players</h3>
        <div className="space-y-3">
          {dummyPlayers.map((player) => (
            <div 
              key={player.id} 
              className={cn(
                "p-4 rounded-2xl bg-white shadow-[0_2px_6px_rgba(0,0,0,0.04)] border-2 transition-all",
                player.id === 1 ? "border-[#E9C46A] shadow-[0_0_15px_rgba(233,196,106,0.3)]" : "border-transparent opacity-80"
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("w-8 h-8 rounded-full shadow-sm", player.color)} />
                <span className="font-bold text-[15px] text-text-dark">{player.name} {player.id === 1 && "(You)"}</span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 gap-x-1 text-[13px] text-gray-500">
                <div className="flex items-center gap-1.5">🏠 3 Settlements</div>
                <div className="flex items-center gap-1.5">🛤️ 5 Roads</div>
                <div className="flex items-center gap-1.5">🃏 2 Cards</div>
                <div className="flex items-center gap-1.5">🏆 {player.score} Points</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto">
        <h3 className="text-[14px] font-bold text-text-dark/60 uppercase tracking-[1.5px] mb-4">Resources</h3>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(dummyPlayers[0].resources).map(([res, count]) => (
            <div key={res} className="text-center">
              <div className="text-xl mb-0.5">
                {res === 'wood' ? '🌲' : res === 'brick' ? '🧱' : res === 'sheep' ? '🐑' : res === 'wheat' ? '🌾' : '⛰️'}
              </div>
              <div className="text-[11px] font-bold text-text-dark">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
