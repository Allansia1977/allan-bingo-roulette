import React, { useState, useCallback } from 'react';
import RouletteDisplay from './components/RouletteDisplay';
import HistoryBoard from './components/HistoryBoard';
import { GameStatus } from './types';
import { generateRange, pickRandom } from './utils/random';

const App: React.FC = () => {
  const [availableNumbers, setAvailableNumbers] = useState<number[]>(() => generateRange(1, 75));
  const [history, setHistory] = useState<number[]>([]);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [targetNumber, setTargetNumber] = useState<number | null>(null);
  const [resetCount, setResetCount] = useState(0);

  const handleRoll = useCallback(() => {
    if (availableNumbers.length === 0) {
      setStatus(GameStatus.FINISHED);
      return;
    }

    if (status === GameStatus.SPINNING) return;

    const winner = pickRandom(availableNumbers);
    if (!winner) return;

    setStatus(GameStatus.SPINNING);
    setTargetNumber(winner);
  }, [availableNumbers, status]);

  const handleSpinComplete = useCallback(() => {
    if (targetNumber === null) return;

    // Add to history and remove from available
    setAvailableNumbers(prev => prev.filter(n => n !== targetNumber));
    setHistory(prev => [...prev, targetNumber]);
    
    if (availableNumbers.length <= 1) {
        setStatus(GameStatus.FINISHED);
    } else {
        setStatus(GameStatus.IDLE);
    }
  }, [targetNumber, availableNumbers.length]);

  const handleReset = useCallback(() => {
    // Immediate reset without confirmation dialog
    setAvailableNumbers(generateRange(1, 75));
    setHistory([]);
    setTargetNumber(null);
    setStatus(GameStatus.IDLE);
    setResetCount(prev => prev + 1);
  }, []);

  return (
    <div className="h-screen bg-slate-900 text-slate-100 flex flex-col overflow-hidden font-sans">
      {/* Header: Title and Reset Button */}
      <header className="flex-none flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 shadow-md z-10">
        <div className="flex flex-col">
            <h1 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2 leading-none">
            <span className="text-red-500">Bingo</span> Roulette
            </h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Allan Fun game series
            </span>
        </div>
        <button
          onClick={handleReset}
          disabled={status === GameStatus.SPINNING}
          className="px-3 py-1.5 rounded-lg font-bold text-xs text-slate-400 border border-slate-600 hover:bg-slate-700 hover:text-white transition-colors uppercase tracking-wider disabled:opacity-50 active:scale-95"
        >
          Reset
        </button>
      </header>

      {/* Main Content: Roulette Wheel */}
      <main className="flex-grow flex items-center justify-center relative p-2 bg-[#0f172a] overflow-hidden">
        <RouletteDisplay 
            status={status} 
            targetNumber={targetNumber} 
            history={history}
            onSpinComplete={handleSpinComplete}
            resetTrigger={resetCount}
            onRoll={handleRoll}
            canRoll={status !== GameStatus.SPINNING && status !== GameStatus.FINISHED}
        />
      </main>

      {/* Footer: Compact History Board */}
      <footer className="flex-none bg-slate-800 border-t border-slate-700 p-2 z-10 pb-safe">
        <HistoryBoard 
            history={history} 
            lastCalled={targetNumber && status !== GameStatus.SPINNING ? targetNumber : null} 
        />
      </footer>
    </div>
  );
};

export default App;