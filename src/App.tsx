/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route } from 'react-router-dom';
import { GameUI } from './components/GameUI';
import { NotFound } from './components/NotFound';
import { GameProvider } from './contexts/GameContext';
import { TooltipProvider } from './components/ui/tooltip';

export default function App() {
  return (
    <TooltipProvider>
      <GameProvider>
        <div className="w-full h-screen overflow-hidden">
          <Routes>
            <Route path="/" element={<GameUI />} />
            <Route path="/game" element={<GameUI />} />
            <Route path="/room/:id" element={<GameUI />} />
            {/* Fallback for unknown routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </GameProvider>
    </TooltipProvider>
  );
}
