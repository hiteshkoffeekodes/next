'use client';

import { Player } from '@/types/player';
import { Users, Crown, Target } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string | null;
  hostId: string;
  currentTurnPlayerId?: string | null;
}

export function PlayerList({
  players,
  currentPlayerId,
  hostId,
  currentTurnPlayerId,
}: PlayerListProps) {
  return (
    <div className="flex flex-col gap-3 bg-white/95 dark:bg-slate-900/80 backdrop-blur-md border-2 border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg shadow-indigo-100/40 dark:shadow-xl transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
            Players in Room
          </h3>
        </div>
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/60">
          {players.length} Online
        </span>
      </div>

      {/* Players List */}
      <div className="flex flex-col gap-2">
        {players.map((player) => {
          const isYou = player.id === currentPlayerId;
          const isHost = player.is_host || player.id === hostId;
          const isCurrentTurn = player.id === currentTurnPlayerId;
          const lines = Math.min(player.completed_lines || 0, 5);
          const progressPercent = (lines / 5) * 100;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                isCurrentTurn
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-400/80 dark:border-emerald-500/50 shadow-sm shadow-emerald-100 dark:shadow-emerald-900/30 ring-1 ring-emerald-400'
                  : isYou
                  ? 'bg-violet-50 dark:bg-indigo-950/40 border-violet-300/80 dark:border-indigo-500/50 shadow-sm shadow-indigo-100/50 dark:shadow-indigo-900/20'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800/80'
              }`}
            >
              {/* Left: Indicator, Crown, Name */}
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Live green indicator */}
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>

                <div className="flex items-center gap-1.5 truncate">
                  <span className={`text-sm font-bold truncate ${isYou ? 'text-violet-900 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>
                    {player.name}
                  </span>

                  {isYou && (
                    <span className="text-[10px] uppercase font-black tracking-wider bg-violet-100 dark:bg-indigo-500/30 text-violet-700 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-violet-200 dark:border-indigo-500/40">
                      You
                    </span>
                  )}

                  {isHost && (
                    <span title="Room Host">
                      <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    </span>
                  )}

                  {isCurrentTurn && (
                    <span
                      title="Current Turn"
                      className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 px-1.5 py-0.5 rounded animate-pulse"
                    >
                      <Target className="w-2.5 h-2.5" />
                      <span>{isYou ? 'Your Turn' : 'Turn'}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Bingo Lines Progress */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-16 sm:w-20 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      lines >= 5
                        ? 'bg-emerald-500'
                        : lines > 0
                        ? 'bg-violet-600 dark:bg-indigo-500'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    lines >= 5
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                      : lines > 0
                      ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-transparent'
                      : 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {lines} / 5
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
