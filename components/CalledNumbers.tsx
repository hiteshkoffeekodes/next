'use client';

import { CalledNumber } from '@/types/game';
import { Flame, History } from 'lucide-react';

interface CalledNumbersProps {
  calledNumbers: CalledNumber[];
  lastCalledNumber: number | null;
  lastCalledByName: string | null;
}

export function CalledNumbers({
  calledNumbers,
  lastCalledNumber,
  lastCalledByName,
}: CalledNumbersProps) {
  const calledSet = new Set(calledNumbers.map((c) => c.number));

  return (
    <div className="flex flex-col gap-4 bg-white/95 dark:bg-slate-900/80 backdrop-blur-md border-2 border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg shadow-indigo-100/40 dark:shadow-xl transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-violet-600 dark:text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
            Called Numbers
          </h3>
        </div>
        <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/60">
          {calledNumbers.length} / 25
        </span>
      </div>

      {/* Latest Called Number Spotlight */}
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-500/30 rounded-xl">
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white font-black text-2xl shadow-lg shadow-amber-400/40 shrink-0">
          {lastCalledNumber !== null ? lastCalledNumber : '—'}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 animate-bounce" />
            <span>Last Number</span>
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-200">
            {lastCalledNumber !== null
              ? `Number ${lastCalledNumber} Called`
              : 'Waiting for first call...'}
          </span>
          {lastCalledByName && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              by <span className="text-slate-800 dark:text-slate-200 font-semibold">{lastCalledByName}</span>
            </span>
          )}
        </div>
      </div>

      {/* 1-25 Grid Tracker */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Board Tracker (1-25)
        </span>
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: 25 }, (_, i) => i + 1).map((num) => {
            const isCalled = calledSet.has(num);
            const isLast = lastCalledNumber === num;

            return (
              <div
                key={num}
                className={`
                  flex items-center justify-center h-8 rounded-lg text-xs font-bold font-mono transition-all duration-200
                  ${
                    isLast
                      ? 'bg-amber-500 text-white font-black shadow-md shadow-amber-400/40 ring-2 ring-amber-300'
                      : isCalled
                      ? 'bg-violet-100 dark:bg-indigo-600/40 text-violet-700 dark:text-indigo-200 border border-violet-200 dark:border-indigo-500/40 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800/80'
                  }
                `}
              >
                {num}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Feed List (Last 10 called) */}
      {calledNumbers.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/60">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Call History (Reverse Order)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[...calledNumbers]
              .reverse()
              .slice(0, 10)
              .map((c, i) => (
                <span
                  key={c.id || i}
                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    i === 0
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                  title={`Called by ${c.called_by_name}`}
                >
                  #{c.number}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
