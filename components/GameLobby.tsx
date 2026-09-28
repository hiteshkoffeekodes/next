'use client';

import { RoomState } from '@/types/game';
import { RoomCode } from './RoomCode';
import { PlayerList } from './PlayerList';
import { Play, Loader2, Sparkles, LogOut, ShieldCheck } from 'lucide-react';

interface GameLobbyProps {
  roomState: RoomState;
  currentPlayerId: string | null;
  onStartGame: () => void;
  onLeaveGame: () => void;
}

export function GameLobby({
  roomState,
  currentPlayerId,
  onStartGame,
  onLeaveGame,
}: GameLobbyProps) {
  const isHost =
    roomState.game.host_id === currentPlayerId ||
    roomState.players.find((p) => p.id === currentPlayerId)?.is_host;

  const playerCount = roomState.players.length;

  return (
    <div className="flex flex-col items-center max-w-xl w-full mx-auto gap-6 px-4 py-8 animate-in fade-in duration-300">
      {/* Title & Badge */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-indigo-500/10 border border-violet-300 dark:border-indigo-500/30 text-violet-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multiplayer Room Lobby</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          Ready to Play BINGO?
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
          Share the room code or invite link with friends. Every player gets their own independently shuffled 5×5 board!
        </p>
      </div>

      {/* Room Code Card */}
      <div className="w-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border-2 border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-indigo-100/50 dark:shadow-2xl flex flex-col items-center gap-4 text-center transition-colors">
        <span className="text-xs uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">
          Your Game Code
        </span>
        <RoomCode code={roomState.game.room_code} size="lg" />
      </div>

      {/* Players List Card */}
      <div className="w-full">
        <PlayerList
          players={roomState.players}
          currentPlayerId={currentPlayerId}
          hostId={roomState.game.host_id}
        />
      </div>

      {/* Action Area */}
      <div className="w-full flex flex-col items-center gap-3">
        {isHost ? (
          <button
            onClick={onStartGame}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-lg tracking-wide uppercase shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start Game ({playerCount} {playerCount === 1 ? 'Player' : 'Players'})</span>
          </button>
        ) : (
          <div className="w-full p-4 rounded-2xl bg-violet-50 dark:bg-slate-900/80 border border-violet-200 dark:border-indigo-500/30 flex items-center justify-center gap-3 text-violet-800 dark:text-indigo-300 font-bold text-sm shadow-sm">
            <Loader2 className="w-4 h-4 animate-spin text-violet-600 dark:text-indigo-400" />
            <span>Waiting for host to start the game...</span>
          </div>
        )}

        <button
          onClick={onLeaveGame}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors py-2 px-4 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Leave Room</span>
        </button>
      </div>

      {/* Quick Rules Callout */}
      <div className="w-full p-4 rounded-2xl bg-white/90 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3 shadow-sm">
        <ShieldCheck className="w-5 h-5 text-violet-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200">How real-time play works: </span>
          Players take turns calling 1 number at a time. The first player to complete 5 lines (crossing all B-I-N-G-O letters) wins!
        </div>
      </div>
    </div>
  );
}
