/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameUI } from './components/GameUI';
import { GameProvider } from './contexts/GameContext';

export default function App() {
  return (
    <GameProvider>
      <div className="w-full h-screen overflow-hidden">
        <GameUI />
      </div>
    </GameProvider>
  );
}
