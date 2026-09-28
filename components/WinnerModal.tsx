'use client';

import { Trophy, RotateCcw, Home, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface WinnerModalProps {
  winnerName: string;
  isCurrentUserWinner: boolean;
  onPlayAgain: () => void;
  onLeaveGame: () => void;
}

export function WinnerModal({
  winnerName,
  isCurrentUserWinner,
  onPlayAgain,
  onLeaveGame,
}: WinnerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-gradient-to-b from-white to-amber-50/70 dark:from-slate-900 dark:to-slate-950 border-2 border-amber-400 dark:border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-400/20 text-center flex flex-col items-center gap-5 animate-in zoom-in-95 duration-300 transition-colors">
        {/* Glow Ring */}
        <div className="absolute -top-12 flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 border-4 border-white dark:border-slate-950 shadow-xl shadow-amber-400/50">
          <Trophy className="w-12 h-12 text-slate-950 fill-current animate-bounce" />
        </div>

        <div className="pt-8 flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>🎉 BINGO! 🎉</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isCurrentUserWinner
              ? `Congratulations ${winnerName}!`
              : `${winnerName.toUpperCase()} WON THE GAME!`}
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-300">
            {isCurrentUserWinner
              ? 'You completed all 5 lines first!'
              : `${winnerName} completed all 5 lines first.`}
          </p>
        </div>

        {/* Winner Card */}
        <div className="w-full bg-amber-50/60 dark:bg-slate-800/60 border border-amber-200 dark:border-slate-700/80 rounded-2xl p-4 flex items-center justify-around text-center shadow-inner">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Winner</span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400 truncate max-w-[140px]">{winnerName}</span>
          </div>
          <div className="h-8 w-px bg-amber-200 dark:bg-slate-700" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Lines</span>
            <span className="text-lg font-mono font-black text-emerald-600 dark:text-emerald-400">5 / 5</span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-2.5 pt-2">
          <button
            onClick={onPlayAgain}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-base uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          <Link
            href="/"
            onClick={onLeaveGame}
            className="w-full py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition-all border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
