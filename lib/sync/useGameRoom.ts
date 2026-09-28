'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RoomState, Player } from '@/types/game';
import { calculateCompletedLines, CompletedLinesResult } from '@/lib/bingo/calculateLines';
import { Sound } from '@/components/SoundManager';
import confetti from 'canvas-confetti';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

export function useGameRoom(roomCode: string) {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(`bingo_session_${roomCode}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.playerId || null;
      }
    } catch {
      // Ignore
    }
    return null;
  });

  const [playerName, setPlayerName] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(`bingo_session_${roomCode}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.playerName || null;
      }
    } catch {
      // Ignore
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callingNumber, setCallingNumber] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(() => Sound.isMuted());

  // Ref tracking previous states to trigger sound/animations only on changes
  const prevLineCountRef = useRef<number>(0);
  const prevStatusRef = useRef<string>('waiting');
  const prevCalledLengthRef = useRef<number>(0);

  // Persist player session
  const saveSession = useCallback((pid: string, name: string) => {
    setPlayerId(pid);
    setPlayerName(name);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          `bingo_session_${roomCode}`,
          JSON.stringify({ playerId: pid, playerName: name })
        );
      } catch {
        // Ignore
      }
    }
  }, [roomCode]);

  // Clear session on leave
  const clearSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`bingo_session_${roomCode}`);
      } catch {
        // Ignore
      }
    }
    setPlayerId(null);
  }, [roomCode]);

  // Fetch state via REST
  const fetchRoomState = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomCode}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load game room');
      }
      const data: RoomState = await res.json();
      setRoomState(data);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading room';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [roomCode]);

  // Handle incoming state updates with effects (audio, confetti)
  const handleIncomingState = useCallback((nextState: RoomState) => {
    setRoomState(nextState);
    setIsLoading(false);
    setError(null);

    // Audio on new called number
    if (nextState.calledNumbers.length > prevCalledLengthRef.current) {
      Sound.playClick();
      prevCalledLengthRef.current = nextState.calledNumbers.length;
    }

    // Audio & Confetti on game win
    if (nextState.game.status === 'finished' && prevStatusRef.current !== 'finished') {
      Sound.playBingoWin();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#3B82F6'],
        });
      } catch {
        // Ignore confetti error
      }
    }
    prevStatusRef.current = nextState.game.status;
  }, []);

  // Real-time EventSource (SSE) + Supabase Realtime Fallback
  useEffect(() => {
    let sse: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const initRoom = async () => {
      await fetchRoomState();
    };
    void initRoom();

    // 1. Setup Server-Sent Events for instant zero-latency updates
    try {
      sse = new EventSource(`/api/rooms/${roomCode}/events`);
      sse.onmessage = (event) => {
        if (isCancelled) return;
        try {
          const data = JSON.parse(event.data);
          handleIncomingState(data);
        } catch {
          // heartbeat or parse error
        }
      };
      sse.onerror = () => {
        // SSE error, fallback to polling
      };
    } catch {
      // SSE not supported
    }

    // 2. Setup Supabase Realtime channel if configured
    let supabaseChannel: ReturnType<NonNullable<ReturnType<typeof getSupabaseClient>>['channel']> | null = null;
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabaseChannel = supabase
          .channel(`bingo_room_${roomCode}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'called_numbers' }, () => {
            fetchRoomState();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `room_code=eq.${roomCode}` }, () => {
            fetchRoomState();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
            fetchRoomState();
          })
          .subscribe();
      }
    }

    // 3. Fallback periodic sync every 3 seconds to guarantee resilience against network drops
    pollInterval = setInterval(() => {
      if (!isCancelled) {
        fetchRoomState();
      }
    }, 3000);

    return () => {
      isCancelled = true;
      if (sse) sse.close();
      if (pollInterval) clearInterval(pollInterval);
      if (supabaseChannel) {
        const supabase = getSupabaseClient();
        if (supabase) supabase.removeChannel(supabaseChannel);
      }
    };
  }, [roomCode, fetchRoomState, handleIncomingState]);

  // Compute local player and completed lines
  const localPlayer: Player | null =
    roomState?.players.find((p) => p.id === playerId) || null;

  const calledNumbersList = (roomState?.calledNumbers || []).map((c) => c.number);

  const completedLinesResult: CompletedLinesResult | null =
    localPlayer && localPlayer.board
      ? calculateCompletedLines(localPlayer.board, calledNumbersList)
      : null;

  // Sound chime when local player completes a new line
  useEffect(() => {
    if (completedLinesResult) {
      if (completedLinesResult.completedLines > prevLineCountRef.current) {
        Sound.playLineComplete();
      }
      prevLineCountRef.current = completedLinesResult.completedLines;
    }
  }, [completedLinesResult]);

  // Actions
  const startGame = useCallback(async () => {
    if (!playerId) return;
    try {
      const res = await fetch(`/api/rooms/${roomCode}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start game');
      if (data.state) handleIncomingState(data.state);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    }
  }, [roomCode, playerId, handleIncomingState]);

  const callNumber = useCallback(
    async (number: number) => {
      if (!playerId || roomState?.game.status !== 'playing' || roomState.game.winner_id) return;
      if (calledNumbersList.includes(number)) return;

      setCallingNumber(number);
      try {
        const res = await fetch(`/api/rooms/${roomCode}/call`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId, number }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || data.error || 'Failed to call number');
        } else {
          // Immediately refresh or update
          fetchRoomState();
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to call number');
      } finally {
        setCallingNumber(null);
      }
    },
    [roomCode, playerId, roomState, calledNumbersList, fetchRoomState]
  );

  const resetGame = useCallback(async () => {
    if (!playerId) return;
    try {
      const res = await fetch(`/api/rooms/${roomCode}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset game');
      if (data.state) handleIncomingState(data.state);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset game');
    }
  }, [roomCode, playerId, handleIncomingState]);

  const leaveGame = useCallback(async () => {
    if (playerId) {
      try {
        await fetch(`/api/rooms/${roomCode}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId }),
        });
      } catch {
        // Ignore
      }
      clearSession();
    }
  }, [roomCode, playerId, clearSession]);

  const toggleSound = useCallback(() => {
    const muted = Sound.toggleMute();
    setIsMuted(muted);
  }, []);

  return {
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
    refetch: fetchRoomState,
  };
}
