import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { GameStore } from './gameStore';
import { RoomState, CallNumberResponse } from '@/types/game';
import { generateBoard } from '@/lib/bingo/generateBoard';
import { generateRoomCode, normalizeRoomCode } from '@/lib/bingo/gameRules';

export const GameService = {
  /**
   * Create a new room with a host player
   */
  async createRoom(hostName: string): Promise<{ roomCode: string; playerId: string; state: RoomState }> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const roomCode = generateRoomCode();
          const hostBoard = generateBoard();

          // Insert into games
          const { data: game, error: gameErr } = await supabase
            .from('games')
            .insert({
              room_code: roomCode,
              host_id: '00000000-0000-0000-0000-000000000000', // temporary placeholder updated after player insert
              status: 'waiting',
            })
            .select()
            .single();

          if (gameErr) throw gameErr;

          // Insert host player
          const { data: player, error: playerErr } = await supabase
            .from('players')
            .insert({
              game_id: game.id,
              name: hostName.trim(),
              board: hostBoard,
              completed_lines: 0,
              is_host: true,
            })
            .select()
            .single();

          if (playerErr) throw playerErr;

          // Update host_id on game
          await supabase.from('games').update({ host_id: player.id }).eq('id', game.id);
          game.host_id = player.id;

          const state: RoomState = {
            game: {
              id: game.id,
              room_code: roomCode,
              host_id: player.id,
              status: 'waiting',
              winner_id: null,
              winner_name: null,
              current_turn_player_id: player.id,
              turn_order: [player.id],
              created_at: game.created_at,
              started_at: null,
              finished_at: null,
            },
            players: [
              {
                id: player.id,
                game_id: game.id,
                name: player.name,
                board: hostBoard,
                completed_lines: 0,
                is_host: true,
                joined_at: player.joined_at,
              },
            ],
            calledNumbers: [],
            lastCalledNumber: null,
            lastCalledByName: null,
            currentTurnPlayerName: player.name,
          };

          return { roomCode, playerId: player.id, state };
        } catch (err) {
          console.warn('Supabase create room failed, falling back to GameStore:', err);
        }
      }
    }

    // Default or Fallback to GameStore
    return GameStore.createRoom(hostName);
  },

  /**
   * Join an existing room
   */
  async joinRoom(roomCode: string, playerName: string): Promise<{ playerId: string; state: RoomState }> {
    const code = normalizeRoomCode(roomCode);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data: game, error: gameErr } = await supabase
            .from('games')
            .select('*')
            .eq('room_code', code)
            .single();

          if (gameErr || !game) {
            throw new Error(`Room "${code}" not found.`);
          }

          if (game.status === 'finished') {
            throw new Error('This game has already finished.');
          }

          // Check if reconnecting
          const { data: existingPlayers } = await supabase
            .from('players')
            .select('*')
            .eq('game_id', game.id);

          const reconnecting = existingPlayers?.find(
            (p) => p.name.trim().toLowerCase() === playerName.trim().toLowerCase()
          );

          if (reconnecting) {
            const state = await this.getRoom(code);
            if (!state) throw new Error('Could not fetch room state');
            return { playerId: reconnecting.id, state };
          }

          // Generate independent board for new player
          const board = generateBoard();
          const { data: newPlayer, error: pErr } = await supabase
            .from('players')
            .insert({
              game_id: game.id,
              name: playerName.trim(),
              board,
              completed_lines: 0,
              is_host: false,
            })
            .select()
            .single();

          if (pErr) throw pErr;

          const state = await this.getRoom(code);
          if (!state) throw new Error('Could not load room');

          return { playerId: newPlayer.id, state };
        } catch (err) {
          console.warn('Supabase join failed, falling back to GameStore:', err);
        }
      }
    }

    return GameStore.joinRoom(code, playerName);
  },

  /**
   * Get complete room state
   */
  async getRoom(roomCode: string): Promise<RoomState | null> {
    const code = normalizeRoomCode(roomCode);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data: game } = await supabase
            .from('games')
            .select('*')
            .eq('room_code', code)
            .single();

          if (!game) return null;

          const [{ data: players }, { data: called }] = await Promise.all([
            supabase.from('players').select('*').eq('game_id', game.id),
            supabase.from('called_numbers').select('*').eq('game_id', game.id).order('created_at', { ascending: true }),
          ]);

          const lastCall = called && called.length > 0 ? called[called.length - 1] : null;

          const currentTurnPlayer = game.current_turn_player_id
            ? (players || []).find((p) => p.id === game.current_turn_player_id)
            : null;

          return {
            game: {
              id: game.id,
              room_code: game.room_code,
              host_id: game.host_id,
              status: game.status,
              winner_id: game.winner_id,
              winner_name: game.winner_name,
              current_turn_player_id: game.current_turn_player_id || null,
              turn_order: game.turn_order || (players || []).map((p) => p.id),
              created_at: game.created_at,
              started_at: game.started_at,
              finished_at: game.finished_at,
            },
            players: (players || []).map((p) => ({
              id: p.id,
              game_id: p.game_id,
              name: p.name,
              board: Array.isArray(p.board) ? p.board : JSON.parse(p.board),
              completed_lines: p.completed_lines,
              is_host: p.is_host,
              joined_at: p.joined_at,
            })),
            calledNumbers: (called || []).map((c) => ({
              id: c.id,
              game_id: c.game_id,
              number: c.number,
              called_by: c.called_by,
              called_by_name: c.called_by_name,
              created_at: c.created_at,
            })),
            lastCalledNumber: lastCall ? lastCall.number : null,
            lastCalledByName: lastCall ? lastCall.called_by_name : null,
            currentTurnPlayerName: currentTurnPlayer ? currentTurnPlayer.name : null,
          };
        } catch (err) {
          console.warn('Supabase getRoom failed, falling back to GameStore:', err);
        }
      }
    }

    return GameStore.getRoom(code);
  },

  /**
   * Start the game
   */
  async startGame(roomCode: string, playerId: string): Promise<RoomState> {
    const code = normalizeRoomCode(roomCode);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data: game } = await supabase.from('games').select('*').eq('room_code', code).single();
          if (!game) throw new Error('Room not found');

          await supabase
            .from('games')
            .update({
              status: 'playing',
              started_at: new Date().toISOString(),
              winner_id: null,
              winner_name: null,
            })
            .eq('id', game.id);

          await supabase.from('called_numbers').delete().eq('game_id', game.id);
          await supabase.from('players').update({ completed_lines: 0 }).eq('game_id', game.id);

          const state = await this.getRoom(code);
          if (state) return state;
        } catch (err) {
          console.warn('Supabase startGame failed, falling back to GameStore:', err);
        }
      }
    }

    return GameStore.startGame(code, playerId);
  },

  /**
   * Call a number
   */
  async callNumber(roomCode: string, playerId: string, number: number): Promise<CallNumberResponse> {
    const code = normalizeRoomCode(roomCode);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          // Call Postgres RPC function for atomic check and winner calculation
          const { data, error } = await supabase.rpc('rpc_call_bingo_number', {
            p_room_code: code,
            p_player_id: playerId,
            p_number: number,
          });

          if (error) throw error;
          return data as CallNumberResponse;
        } catch (err) {
          console.warn('Supabase callNumber failed, falling back to GameStore:', err);
        }
      }
    }

    return GameStore.callNumber(code, playerId, number);
  },

  /**
   * Reset game (play again)
   */
  async resetGame(roomCode: string): Promise<RoomState> {
    const code = normalizeRoomCode(roomCode);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data: game } = await supabase.from('games').select('*').eq('room_code', code).single();
          if (game) {
            await supabase
              .from('games')
              .update({
                status: 'playing',
                winner_id: null,
                winner_name: null,
                started_at: new Date().toISOString(),
                finished_at: null,
              })
              .eq('id', game.id);

            await supabase.from('called_numbers').delete().eq('game_id', game.id);

            // Fetch players and regenerate board for each player
            const { data: players } = await supabase.from('players').select('id').eq('game_id', game.id);
            if (players) {
              for (const p of players) {
                await supabase
                  .from('players')
                  .update({
                    board: generateBoard(),
                    completed_lines: 0,
                  })
                  .eq('id', p.id);
              }
            }

            const state = await this.getRoom(code);
            if (state) return state;
          }
        } catch (err) {
          console.warn('Supabase resetGame failed, falling back to GameStore:', err);
        }
      }
    }

    return GameStore.resetGame(code);
  },

  /**
   * Leave game
   */
  async leaveGame(roomCode: string, playerId: string): Promise<{ remainingCount: number }> {
    const code = normalizeRoomCode(roomCode);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('players').delete().eq('id', playerId);
        } catch (err) {
          console.warn('Supabase leaveGame error:', err);
        }
      }
    }

    return GameStore.leaveRoom(code, playerId);
  },
};
