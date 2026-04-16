import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { HelpCircle, Trophy, PlayCircle, Hammer, AlertTriangle, Info } from 'lucide-react';

export const HowToPlay: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm">
          <HelpCircle size={18} />
          How to Play
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-[32px] border-none shadow-2xl bg-white p-0">
        <div className="p-8 space-y-8">
          <DialogHeader>
            <DialogTitle className="text-4xl font-black text-text-dark uppercase tracking-tighter flex items-center gap-3">
              <PlayCircle className="text-accent-dark" size={36} />
              Welcome to Katan
            </DialogTitle>
            <DialogDescription className="text-lg text-gray-500 font-medium">
              A beginner-friendly guide to conquering the island.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-8 md:grid-cols-2">
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-text-dark flex items-center gap-2">
                <Trophy className="text-yellow-500" size={20} />
                The Objective
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Be the first player to reach <span className="font-bold text-text-dark">10 Victory Points</span>. You earn points by building settlements (1pt) and cities (2pts).
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-text-dark flex items-center gap-2">
                <PlayCircle className="text-blue-500" size={20} />
                Your Turn
              </h3>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li><span className="font-bold">Roll Dice</span> to see which tiles produce resources.</li>
                <li><span className="font-bold">Collect Resources</span> if you have a building on those tiles.</li>
                <li><span className="font-bold">Build</span> roads, settlements, or cities.</li>
                <li><span className="font-bold">End Turn</span> to let the next player go.</li>
              </ol>
            </section>
          </div>

          <section className="space-y-4 bg-gray-50 p-6 rounded-3xl border border-gray-100">
            <h3 className="text-xl font-bold text-text-dark flex items-center gap-2">
              <Hammer className="text-orange-500" size={20} />
              Building Costs
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-black text-gray-400 uppercase mb-1">Road</p>
                <p className="text-sm font-bold">1 Wood + 1 Brick</p>
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-black text-gray-400 uppercase mb-1">Settlement</p>
                <p className="text-sm font-bold">1 Wood, 1 Brick, 1 Sheep, 1 Wheat</p>
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-black text-gray-400 uppercase mb-1">City</p>
                <p className="text-sm font-bold">3 Ore + 2 Wheat</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-bold text-text-dark flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} />
              The Robber (Rolling a 7)
            </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>If you have more than 7 cards, you must <span className="font-bold">discard half</span>.</li>
              <li>The current player moves the robber to <span className="font-bold">block a tile</span>.</li>
              <li>That tile produces <span className="font-bold">no resources</span> until the robber is moved.</li>
              <li>The player who moved the robber can <span className="font-bold">steal one card</span> from an opponent on that tile.</li>
            </ul>
          </section>

          <div className="bg-accent/10 p-6 rounded-3xl border border-accent/20 flex gap-4 items-start">
            <Info className="text-accent-dark shrink-0" size={24} />
            <div className="space-y-1">
              <p className="font-bold text-text-dark">Pro Tip: Settlement Rule</p>
              <p className="text-sm text-gray-600">You can only build a settlement if it's at least two corners away from any other settlement!</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
