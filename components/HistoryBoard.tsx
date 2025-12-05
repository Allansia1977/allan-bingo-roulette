import React from 'react';
import { generateRange } from '../utils/random';

interface HistoryBoardProps {
  history: number[];
  lastCalled: number | null;
}

const HistoryBoard: React.FC<HistoryBoardProps> = ({ history, lastCalled }) => {
  const allNumbers = generateRange(1, 75);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-1">
         <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            History
         </h3>
         <span className="text-slate-500 text-[10px] font-bold">{history.length} / 75</span>
      </div>
      
      <div className="grid grid-cols-[repeat(auto-fill,minmax(1.75rem,1fr))] gap-0.5">
        {allNumbers.map((num) => {
          const isCalled = history.includes(num);
          const isLast = num === lastCalled;

          let bgClass = 'bg-slate-700/30 text-slate-600';
          let borderClass = 'border-transparent';
          
          if (isCalled) {
             bgClass = 'bg-slate-600 text-slate-300';
          }
          if (isLast) {
             bgClass = 'bg-emerald-500 text-white shadow-lg z-10';
             borderClass = 'border-white/50';
          }

          return (
            <div
              key={num}
              className={`
                aspect-square flex items-center justify-center rounded text-[10px] font-bold border transition-all duration-300
                ${bgClass} ${borderClass}
              `}
            >
              {num}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryBoard;