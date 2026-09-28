'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameRoom } from '@/lib/sync/useGameRoom';
import { BingoBoard } from '@/components/BingoBoard';
import { BingoLetters } from '@/components/BingoLetters';
import { CalledNumbers } from '@/components/CalledNumbers';
import { PlayerList } from '@/components/PlayerList';
import { GameLobby } from '@/components/GameLobby';
import { WinnerModal } from '@/components/WinnerModal';
import { RoomCode } from '@/components/RoomCode';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Volume2,
  VolumeX,
  LogOut,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Users,
  Info,
  Target,
} from 'lucide-react';

interface GamePageProps {
  params: Promise<{ roomCode: string }>;
}

export default function GamePage({ params }: GamePageProps) {
  const resolvedParams = use(params);
  const roomCode = resolvedParams.roomCode.toUpperCase();
  const router = useRouter();

  const {
    roomState,
    localPlayer,
    playerId,
    playerName,
    isLoading,
    error,
    callingNumber,
    isMuted,
    completedLinesResult,
    calledNumbersList,
    saveSession,
    startGame,
    callNumber,
    resetGame,
    leaveGame,
    toggleSound,
  } = useGameRoom(roomCode);

  // Modal for joining if direct link was opened without player session
  const [directJoinName, setDirectJoinName] = useState('');
  const [isJoiningDirectly, setIsJoiningDirectly] = useState(false);
  const [directJoinError, setDirectJoinError] = useState<string | null>(null);

  const handleDirectJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directJoinName.trim()) return;

    setIsJoiningDirectly(true);
    setDirectJoinError(null);

    try {
      const res = await fetch(`/api/rooms/${roomCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: directJoinName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join');
      }

      saveSession(data.playerId, directJoinName.trim());
    } catch (err: unknown) {
      setDirectJoinError(err instanceof Error ? err.message : 'Error joining');
    } finally {
      setIsJoiningDirectly(false);
    }
  };

  const handleLeaveAndExit = async () => {
    await leaveGame();
    router.push('/');
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center gap-4 transition-colors">
        <Loader2 className="w-10 h-10 animate-spin text-violet-600 dark:text-indigo-500" />
        <span className="text-sm font-bold tracking-wide text-slate-500 dark:text-slate-400">
          Connecting to room {roomCode}...
        </span>
      </div>
    );
  }

  // Error State (e.g. room not found)
  if (error && !roomState) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Room Unavailable</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
          <Link
            href="/"
            className="w-full py-3 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // If user opens link directly and isn't recognized as a player in this room
  if (!localPlayer) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 transition-colors">
        <div className="max-w-md w-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border-2 border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center gap-5 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-indigo-500/10 border border-violet-200 dark:border-indigo-500/30 flex items-center justify-center text-violet-600 dark:text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Join Room {roomCode}</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Enter your name to join this Bingo game.
            </p>
          </div>

          <form onSubmit={handleDirectJoin} className="w-full flex flex-col gap-3">
            <input
              type="text"
              value={directJoinName}
              onChange={(e) => setDirectJoinName(e.target.value)}
              placeholder="Your name (e.g. Rahul)"
              maxLength={20}
              required
              autoFocus
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/80 border-2 border-slate-200 dark:border-slate-700 focus:border-violet-500 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-semibold outline-none"
            />

            {directJoinError && (
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{directJoinError}</span>
            )}

            <button
              type="submit"
              disabled={isJoiningDirectly}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-teal-500 hover:from-violet-500 hover:to-teal-400 text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/30 transition-all cursor-pointer"
            >
              {isJoiningDirectly ? 'Joining...' : 'Enter Game'}
            </button>
          </form>

          <Link
            href="/"
            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          >
            Cancel and Return Home
          </Link>
        </div>
      </div>
    );
  }

  // If room is in waiting state, show the Lobby
  if (roomState?.game.status === 'waiting') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white transition-colors duration-300">
        <header className="w-full max-w-5xl mx-auto px-4 py-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-900">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <button
              onClick={toggleSound}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-sm"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handleLeaveAndExit}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-800 text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave</span>
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center">
          <GameLobby
            roomState={roomState}
            currentPlayerId={playerId}
            onStartGame={startGame}
            onLeaveGame={handleLeaveAndExit}
          />
        </main>
      </div>
    );
  }

  // ACTIVE GAME STATE (status === 'playing' or status === 'finished')
  const completedLinesCount = completedLinesResult?.completedLines || 0;
  const isWinner = roomState?.game.status === 'finished' && roomState.game.winner_id !== null;
  const isCurrentUserWinner = roomState?.game.winner_id === playerId;
  const winnerName = roomState?.game.winner_name || 'Player';

  const currentTurnPlayerId = roomState?.game.current_turn_player_id || null;
  const isMyTurn = currentTurnPlayerId === playerId;
  const currentTurnPlayerName =
    roomState?.currentTurnPlayerName ||
    roomState?.players.find((p) => p.id === currentTurnPlayerId)?.name ||
    'Player';

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-300">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-violet-400/20 via-pink-400/10 to-transparent dark:from-indigo-600/10 dark:via-purple-600/5 blur-3xl pointer-events-none -z-10" />

      {/* Top Navigation Bar */}
      <header className="w-full max-w-6xl mx-auto px-4 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-teal-400 text-white font-black text-sm shadow-md shadow-violet-500/30">
            B
          </div>
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden sm:inline">
            Room: <span className="text-violet-700 dark:text-indigo-400 font-black">{roomCode}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <RoomCode code={roomCode} size="sm" />
          <ThemeToggle />

          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-sm"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleLeaveAndExit}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-800 text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* Game Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        {/* B I N G O Header Progress */}
        <section className="flex flex-col items-center justify-center pt-2">
          <BingoLetters completedLines={completedLinesCount} />
        </section>

        {/* Turn-by-Turn Dynamic Banner */}
        {roomState && roomState.game.status === 'playing' && (
          <div className="w-full max-w-3xl mx-auto">
            {isMyTurn ? (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/20 dark:from-emerald-600/30 dark:via-emerald-500/20 dark:to-teal-600/30 border-2 border-emerald-500 dark:border-emerald-400/80 shadow-lg shadow-emerald-200/50 dark:shadow-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500 text-white dark:text-slate-950 font-black shrink-0 shadow-md shadow-emerald-500/50">
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs uppercase font-black tracking-widest text-emerald-800 dark:text-emerald-300">
                      🎯 YOUR TURN TO CALL! (તમારો વારો છે)
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Click 1 number on your board. It will be called globally for all players.
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/90 border border-emerald-400 px-3 py-1 rounded-full shrink-0 shadow-sm">
                  1 Click Per Turn
                </span>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border-2 border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500 dark:text-amber-400 shrink-0" />
                  <span>
                    Waiting for <strong className="text-amber-600 dark:text-amber-300 font-bold">{currentTurnPlayerName}</strong> to pick a number... (Players take turns one by one)
                  </span>
                </div>
                {roomState.lastCalledNumber !== null && (
                  <span className="font-mono text-slate-500 dark:text-slate-400 shrink-0 font-bold">
                    Last: <span className="text-amber-600 dark:text-amber-400">#{roomState.lastCalledNumber}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Main Game Grid & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Center: 5x5 Bingo Board */}
          <div className="lg:col-span-7 flex flex-col items-center gap-4">
            <div className="flex items-center justify-between w-full max-w-[420px] px-2 text-xs font-bold text-slate-600 dark:text-slate-400">
              <span>Your Board ({playerName || localPlayer.name})</span>
              <span className={isMyTurn ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-500 dark:text-slate-400'}>
                {isMyTurn ? '🟢 Your Turn' : `Waiting for ${currentTurnPlayerName}`}
              </span>
            </div>

            <BingoBoard
              board={localPlayer.board}
              calledNumbers={calledNumbersList}
              lastCalledNumber={roomState?.lastCalledNumber || null}
              completedCellIndices={completedLinesResult?.completedCellIndices || []}
              isGameActive={roomState?.game.status === 'playing' && !roomState.game.winner_id}
              isMyTurn={isMyTurn}
              currentTurnPlayerName={currentTurnPlayerName}
              callingNumber={callingNumber}
              onCallNumber={callNumber}
            />

            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 text-center max-w-sm">
              <Info className="w-3.5 h-3.5 shrink-0 text-violet-500 dark:text-indigo-400" />
              <span>
                {isMyTurn
                  ? 'Click any uncalled number on your board to call it.'
                  : `You can click when it's your turn. Currently waiting for ${currentTurnPlayerName}.`}
              </span>
            </div>
          </div>

          {/* Right Sidebar: Called Numbers & Live Player Progress */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <CalledNumbers
              calledNumbers={roomState?.calledNumbers || []}
              lastCalledNumber={roomState?.lastCalledNumber || null}
              lastCalledByName={roomState?.lastCalledByName || null}
            />

            <PlayerList
              players={roomState?.players || []}
              currentPlayerId={playerId}
              hostId={roomState?.game.host_id || ''}
              currentTurnPlayerId={currentTurnPlayerId}
            />
          </div>
        </div>
      </main>

      {/* Winner Celebration Modal */}
      {isWinner && (
        <WinnerModal
          winnerName={winnerName}
          isCurrentUserWinner={isCurrentUserWinner}
          onPlayAgain={resetGame}
          onLeaveGame={handleLeaveAndExit}
        />
      )}
    </div>
  );
}
