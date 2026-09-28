'use client';

import { BINGO_LETTERS } from '@/lib/bingo/gameRules';

interface BingoLettersProps {
  completedLines: number;
}

const LETTER_COLORS = [
  'text-violet-600 dark:text-violet-400 border-t-violet-500',
  'text-sky-600 dark:text-sky-400 border-t-sky-500',
  'text-rose-600 dark:text-rose-400 border-t-rose-500',
  'text-amber-600 dark:text-amber-400 border-t-amber-500',
  'text-emerald-600 dark:text-emerald-400 border-t-emerald-500',
];

export function BingoLetters({ completedLines }: BingoLettersProps) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
        {BINGO_LETTERS.map((letter, idx) => {
          const isCrossed = idx < completedLines;
          const colorClass = LETTER_COLORS[idx] || '';

          return (
            <div
              key={letter}
              className={`relative flex items-center justify-center w-12 h-14 sm:w-14 sm:h-16 md:w-16 md:h-20 rounded-2xl font-black text-2xl sm:text-3xl md:text-4xl select-none transition-all duration-500 shadow-md ${
                isCrossed
                  ? 'bg-gradient-to-b from-emerald-500 to-teal-600 text-white border-2 border-emerald-300 shadow-lg shadow-emerald-500/30 scale-105 rotate-[-2deg]'
                  : `bg-white dark:bg-slate-800/90 border-2 border-slate-200/90 dark:border-slate-700/80 shadow-slate-200/70 dark:shadow-black/40 hover:border-violet-400 dark:hover:border-slate-600 border-t-4 ${colorClass}`
              }`}
            >
              {isCrossed ? (
                <div className="flex flex-col items-center justify-center animate-in zoom-in-75 duration-300">
                  <span className="text-white drop-shadow-[0_2px_8px_rgba(16,185,129,0.9)]">✕</span>
                  <span className="text-[9px] uppercase tracking-tighter text-emerald-100 font-bold -mt-1 opacity-90">
                    {letter}
                  </span>
                </div>
              ) : (
                <span className="tracking-wide font-black">
                  {letter}
                </span>
              )}

              {/* Glowing active indicator */}
              {isCrossed && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress pill */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm">
        <span>Lines Completed:</span>
        <span
          className={`font-bold px-2 py-0.5 rounded text-xs transition-colors ${
            completedLines >= 5
              ? 'bg-emerald-500 text-white font-black animate-pulse shadow-sm shadow-emerald-400/40'
              : completedLines > 0
              ? 'bg-violet-100 dark:bg-indigo-600/60 text-violet-700 dark:text-indigo-200'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
          }`}
        >
          {Math.min(completedLines, 5)} / 5
        </span>
      </div>
    </div>
  );
}
