/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameUI } from './components/GameUI';
import { GameProvider } from './contexts/GameContext';
import { TooltipProvider } from './components/ui/tooltip';

export default function App() {
  return (
    <TooltipProvider>
      <GameProvider>
        <div className="w-full h-screen overflow-hidden">
          <GameUI />
        </div>
      </GameProvider>
    </TooltipProvider>
  );
}
