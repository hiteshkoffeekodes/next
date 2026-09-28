'use client';

import { useMemo } from 'react';
import { Sparkles, Check } from 'lucide-react';

interface BingoBoardProps {
  board: number[];
  calledNumbers: number[];
  lastCalledNumber: number | null;
  completedCellIndices?: number[];
  isGameActive: boolean;
  isMyTurn: boolean;
  currentTurnPlayerName: string | null;
  callingNumber: number | null;
  onCallNumber: (num: number) => void;
}

export function BingoBoard({
  board,
  calledNumbers,
  lastCalledNumber,
  completedCellIndices = [],
  isGameActive,
  isMyTurn,
  currentTurnPlayerName,
  callingNumber,
  onCallNumber,
}: BingoBoardProps) {
  const calledSet = useMemo(() => new Set(calledNumbers), [calledNumbers]);
  const completedIndicesSet = useMemo(() => new Set(completedCellIndices), [completedCellIndices]);

  if (!board || board.length !== 25) {
    return (
      <div className="flex items-center justify-center p-8 bg-white/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
        Generating your unique board...
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[430px] mx-auto p-2.5 sm:p-3.5 bg-white/95 dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-950/90 backdrop-blur-xl border-2 border-slate-200/90 dark:border-slate-800/80 rounded-3xl shadow-xl shadow-indigo-100/60 dark:shadow-indigo-950/40 transition-colors">
      {/* 5x5 Grid */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {board.map((num, idx) => {
          const isCalled = calledSet.has(num);
          const isLastCalled = lastCalledNumber === num;
          const isPartOfWinningLine = completedIndicesSet.has(idx);
          const isBeingCalled = callingNumber === num;

          const canClick = isGameActive && isMyTurn && !isCalled && !isBeingCalled;

          return (
            <button
              key={`${idx}-${num}`}
              onClick={() => {
                if (canClick) {
                  onCallNumber(num);
                }
              }}
              disabled={!canClick}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-xl sm:rounded-2xl font-bold select-none
                transition-all duration-200 outline-none
                ${
                  isLastCalled
                    ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-white font-black shadow-lg shadow-amber-400/50 scale-102 ring-4 ring-amber-300 dark:ring-amber-400/60 z-10 animate-pulse'
                    : isPartOfWinningLine
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-2 border-emerald-300 shadow-md shadow-emerald-400/40 ring-1 ring-emerald-300'
                    : isCalled
                    ? 'bg-violet-100 dark:bg-indigo-950/80 text-violet-700 dark:text-indigo-300 border-2 border-violet-200/80 dark:border-indigo-500/40 shadow-inner'
                    : canClick
                    ? 'bg-white dark:bg-slate-800/90 hover:bg-emerald-50 dark:hover:bg-emerald-600/30 text-slate-800 dark:text-white border-2 border-emerald-400/80 dark:border-slate-700 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-200/50 active:scale-95 cursor-pointer ring-2 ring-emerald-400/30 dark:ring-emerald-500/30 shadow-sm'
                    : isGameActive && !isMyTurn
                    ? 'bg-slate-50 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800/80 cursor-not-allowed opacity-80'
                    : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 cursor-not-allowed'
                }
              `}
              title={
                isCalled
                  ? `Number ${num} already called`
                  : !isMyTurn
                  ? `Waiting for ${currentTurnPlayerName || 'other player'}'s turn`
                  : `Your turn! Click to call ${num}`
              }
            >
              {/* Number Typography */}
              <span
                className={`text-lg sm:text-2xl font-black transition-transform duration-200 ${
                  isLastCalled ? 'scale-110 drop-shadow-sm' : ''
                }`}
              >
                {num}
              </span>

              {/* Status Badges */}
              {isLastCalled ? (
                <span className="absolute bottom-1 text-[8px] font-black uppercase tracking-wider bg-slate-950/80 text-amber-300 px-1 rounded-sm">
                  LAST
                </span>
              ) : isPartOfWinningLine ? (
                <Sparkles className="absolute top-1 right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-100 opacity-95" />
              ) : isCalled ? (
                <Check className="absolute top-1 right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 text-violet-600 dark:text-indigo-400" />
              ) : null}

              {/* Calling Spinner Overlay */}
              {isBeingCalled && (
                <div className="absolute inset-0 bg-violet-600/80 dark:bg-indigo-900/80 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
