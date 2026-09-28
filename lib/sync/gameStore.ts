import { Game, Player, CalledNumber, RoomState, CallNumberResponse } from '@/types/game';
import { generateBoard } from '@/lib/bingo/generateBoard';
import { calculateCompletedLines, hasWinner } from '@/lib/bingo/calculateLines';
import { generateRoomCode, normalizeRoomCode, isValidPlayerName } from '@/lib/bingo/gameRules';

interface InternalRoom {
  game: Game;
  players: Map<string, Player>;
  calledNumbers: CalledNumber[];
  listeners: Set<(state: RoomState) => void>;
}

// Global in-memory rooms registry (persists across hot reloads in dev server via globalThis)
const globalRooms = (globalThis as unknown as { __bingoRooms?: Map<string, InternalRoom> });
if (!globalRooms.__bingoRooms) {
  globalRooms.__bingoRooms = new Map<string, InternalRoom>();
}
const rooms = globalRooms.__bingoRooms;

function getRoomSnapshot(room: InternalRoom): RoomState {
  const playersList = Array.from(room.players.values());
  const lastCalled = room.calledNumbers.length > 0 ? room.calledNumbers[room.calledNumbers.length - 1] : null;
  const currentTurnPlayer = room.game.current_turn_player_id
    ? room.players.get(room.game.current_turn_player_id)
    : null;

  return {
    game: { ...room.game, turn_order: [...(room.game.turn_order || [])] },
    players: playersList.map((p) => ({ ...p, board: [...p.board] })),
    calledNumbers: room.calledNumbers.map((c) => ({ ...c })),
    lastCalledNumber: lastCalled ? lastCalled.number : null,
    lastCalledByName: lastCalled ? lastCalled.called_by_name : null,
    currentTurnPlayerName: currentTurnPlayer ? currentTurnPlayer.name : null,
  };
}

function notifyRoom(room: InternalRoom) {
  const snapshot = getRoomSnapshot(room);
  room.listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (e) {
      console.error('Error in room listener:', e);
    }
  });
}

export const GameStore = {
  /**
   * Creates a new game room with host player
   */
  createRoom(hostName: string): { roomCode: string; playerId: string; state: RoomState } {
    if (!isValidPlayerName(hostName)) {
      throw new Error('Player name must be between 2 and 20 characters');
    }

    let code = generateRoomCode();
    while (rooms.has(code)) {
      code = generateRoomCode();
    }

    const gameId = 'game_' + Math.random().toString(36).substring(2, 10);
    const hostId = 'player_' + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();

    const hostPlayer: Player = {
      id: hostId,
      game_id: gameId,
      name: hostName.trim(),
      board: generateBoard(), // CRITICAL: independently randomized 1-25 board
      completed_lines: 0,
      is_host: true,
      joined_at: now,
      last_seen_at: now,
    };

    const game: Game = {
      id: gameId,
      room_code: code,
      host_id: hostId,
      status: 'waiting',
      winner_id: null,
      winner_name: null,
      current_turn_player_id: hostId,
      turn_order: [hostId],
      created_at: now,
      started_at: null,
      finished_at: null,
    };

    const internalRoom: InternalRoom = {
      game,
      players: new Map([[hostId, hostPlayer]]),
      calledNumbers: [],
      listeners: new Set(),
    };

    rooms.set(code, internalRoom);

    return {
      roomCode: code,
      playerId: hostId,
      state: getRoomSnapshot(internalRoom),
    };
  },

  /**
   * Joins an existing game room
   */
  joinRoom(roomCode: string, playerName: string): { playerId: string; state: RoomState } {
    const code = normalizeRoomCode(roomCode);
    const room = rooms.get(code);

    if (!room) {
      throw new Error(`Room "${code}" was not found.`);
    }

    if (room.game.status === 'finished') {
      throw new Error('This game has already finished.');
    }

    if (!isValidPlayerName(playerName)) {
      throw new Error('Player name must be between 2 and 20 characters');
    }

    // Check if player name already taken in room
    const existingPlayers = Array.from(room.players.values());
    const nameConflict = existingPlayers.find(
      (p) => p.name.trim().toLowerCase() === playerName.trim().toLowerCase()
    );
    if (nameConflict) {
      // Reconnection support: if the same name reconnects, return their existing session
      return {
        playerId: nameConflict.id,
        state: getRoomSnapshot(room),
      };
    }

    const playerId = 'player_' + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();

    const newPlayer: Player = {
      id: playerId,
      game_id: room.game.id,
      name: playerName.trim(),
      board: generateBoard(), // CRITICAL: independently randomized 1-25 board for Player B/C...
      completed_lines: 0,
      is_host: false,
      joined_at: now,
      last_seen_at: now,
    };

    // Calculate current completed lines if game is already playing
    if (room.calledNumbers.length > 0) {
      const numbers = room.calledNumbers.map((c) => c.number);
      const res = calculateCompletedLines(newPlayer.board, numbers);
      newPlayer.completed_lines = res.completedLines;
    }

    room.players.set(playerId, newPlayer);
    if (!room.game.turn_order) {
      room.game.turn_order = [];
    }
    if (!room.game.turn_order.includes(playerId)) {
      room.game.turn_order.push(playerId);
    }
    notifyRoom(room);

    return {
      playerId,
      state: getRoomSnapshot(room),
    };
  },

  /**
   * Retrieves current room state
   */
  getRoom(roomCode: string): RoomState | null {
    const code = normalizeRoomCode(roomCode);
    const room = rooms.get(code);
    return room ? getRoomSnapshot(room) : null;
  },

  /**
   * Starts the game (host only)
   */
  startGame(roomCode: string, playerId: string): RoomState {
    const code = normalizeRoomCode(roomCode);
    const room = rooms.get(code);
    if (!room) {
      throw new Error('Room not found');
    }

    const player = room.players.get(playerId);
    if (!player || !player.is_host) {
      throw new Error('Only the room host can start the game');
    }

    if (room.players.size < 1) {
      throw new Error('At least 1 player is required to start');
    }

    room.game.status = 'playing';
    room.game.started_at = new Date().toISOString();
    room.game.winner_id = null;
    room.game.winner_name = null;
    room.calledNumbers = [];
    room.game.turn_order = Array.from(room.players.keys());
    room.game.current_turn_player_id = room.game.turn_order[0] || null;

    // Reset lines
    room.players.forEach((p) => {
      p.completed_lines = 0;
    });

    notifyRoom(room);
    return getRoomSnapshot(room);
  },

  /**
   * Calls a number atomically with race-condition prevention and server winner verification
   */
  callNumber(roomCode: string, playerId: string, number: number): CallNumberResponse {
    const code = normalizeRoomCode(roomCode);
    const room = rooms.get(code);
    if (!room) {
      return {
        success: false,
        number,
        called_by: playerId,
        called_by_name: '',
        winner_id: null,
        winner_name: null,
        game_status: 'finished',
        message: 'Room not found',
      };
    }

    if (room.game.status !== 'playing') {
      return {
        success: false,
        number,
        called_by: playerId,
        called_by_name: '',
        winner_id: room.game.winner_id,
        winner_name: room.game.winner_name,
        game_status: room.game.status,
        message: 'Game is not in playing state',
      };
    }

    if (room.game.winner_id) {
      return {
        success: false,
        number,
        called_by: playerId,
        called_by_name: '',
        winner_id: room.game.winner_id,
        winner_name: room.game.winner_name,
        game_status: 'finished',
        message: 'Game has already concluded',
      };
    }

    const player = room.players.get(playerId);
    if (!player) {
      return {
        success: false,
        number,
        called_by: playerId,
        called_by_name: '',
        winner_id: null,
        winner_name: null,
        game_status: room.game.status,
        message: 'Player not recognized',
      };
    }

    // STRICT TURN VALIDATION: Player can only click/call on their turn
    if (room.game.current_turn_player_id && room.game.current_turn_player_id !== playerId) {
      const activePlayer = room.players.get(room.game.current_turn_player_id);
      const activeName = activePlayer ? activePlayer.name : 'another player';
      return {
        success: false,
        number,
        called_by: playerId,
        called_by_name: player.name,
        winner_id: room.game.winner_id,
        winner_name: room.game.winner_name,
        game_status: room.game.status,
        message: `It is not your turn! Please wait for ${activeName} to call a number.`,
      };
    }

    if (number < 1 || number > 25) {
      return {
        success: false,
        number,
        called_by: playerId,
        called_by_name: player.name,
        winner_id: null,
        winner_name: null,
        game_status: room.game.status,
        message: 'Number must be between 1 and 25',
      };
    }

    // Atomic duplicate check
    const alreadyCalled = room.calledNumbers.some((c) => c.number === number);
    if (alreadyCalled) {
      return {
        success: false,
        number,
        called_by: playerId,
        called_by_name: player.name,
        winner_id: room.game.winner_id,
        winner_name: room.game.winner_name,
        game_status: room.game.status,
        message: `Number ${number} has already been called!`,
      };
    }

    // Record called number
    const callRecord: CalledNumber = {
      id: 'call_' + Math.random().toString(36).substring(2, 9),
      game_id: room.game.id,
      number,
      called_by: playerId,
      called_by_name: player.name,
      created_at: new Date().toISOString(),
    };
    room.calledNumbers.push(callRecord);

    const allCalledNumbers = room.calledNumbers.map((c) => c.number);

    // Atomically recalculate completed lines for ALL players
    let firstWinner: Player | null = null;
    room.players.forEach((p) => {
      const lineRes = calculateCompletedLines(p.board, allCalledNumbers);
      p.completed_lines = lineRes.completedLines;

      if (hasWinner(lineRes.completedLines) && !firstWinner) {
        firstWinner = p;
      }
    });

    // Check winner
    if (firstWinner) {
      const winner = firstWinner as Player;
      room.game.winner_id = winner.id;
      room.game.winner_name = winner.name;
      room.game.status = 'finished';
      room.game.finished_at = new Date().toISOString();
    } else {
      // Advance turn to the next player in turn_order
      const order = room.game.turn_order && room.game.turn_order.length > 0
        ? room.game.turn_order
        : Array.from(room.players.keys());
      const currentIdx = order.indexOf(playerId);
      if (currentIdx !== -1 && order.length > 0) {
        const nextIdx = (currentIdx + 1) % order.length;
        room.game.current_turn_player_id = order[nextIdx];
      }
    }

    notifyRoom(room);

    return {
      success: true,
      number,
      called_by: playerId,
      called_by_name: player.name,
      winner_id: room.game.winner_id,
      winner_name: room.game.winner_name,
      game_status: room.game.status,
    };
  },

  /**
   * Resets the game for "Play Again" with fresh independent boards
   */
  resetGame(roomCode: string): RoomState {
    const code = normalizeRoomCode(roomCode);
    const room = rooms.get(code);
    if (!room) {
      throw new Error('Room not found');
    }

    // Reset game state
    room.game.status = 'playing';
    room.game.winner_id = null;
    room.game.winner_name = null;
    room.game.started_at = new Date().toISOString();
    room.game.finished_at = null;
    room.calledNumbers = [];
    room.game.turn_order = Array.from(room.players.keys());
    room.game.current_turn_player_id = room.game.turn_order[0] || null;

    // CRITICAL: Generate new independent 1-25 boards for every player
    room.players.forEach((p) => {
      p.board = generateBoard();
      p.completed_lines = 0;
    });

    notifyRoom(room);
    return getRoomSnapshot(room);
  },

  /**
   * Handles player leaving and host migration
   */
  leaveRoom(roomCode: string, playerId: string): { remainingCount: number } {
    const code = normalizeRoomCode(roomCode);
    const room = rooms.get(code);
    if (!room) {
      return { remainingCount: 0 };
    }

    const leavingPlayer = room.players.get(playerId);
    room.players.delete(playerId);

    // Update turn order
    room.game.turn_order = (room.game.turn_order || []).filter((id) => id !== playerId);
    if (room.game.current_turn_player_id === playerId && room.game.turn_order.length > 0) {
      room.game.current_turn_player_id = room.game.turn_order[0];
    }

    // Host migration: if the host left, assign another player as host
    if (leavingPlayer?.is_host && room.players.size > 0) {
      const nextHost = room.players.values().next().value;
      if (nextHost) {
        nextHost.is_host = true;
        room.game.host_id = nextHost.id;
      }
    }

    // If room is empty, remove it after a delay
    if (room.players.size === 0) {
      setTimeout(() => {
        if (room.players.size === 0) {
          rooms.delete(code);
        }
      }, 60000); // 1 minute cleanup
    } else {
      notifyRoom(room);
    }

    return { remainingCount: room.players.size };
  },

  /**
   * Subscribes to real-time room updates (SSE / polling / in-memory callbacks)
   */
  subscribe(roomCode: string, callback: (state: RoomState) => void): () => void {
    const code = normalizeRoomCode(roomCode);
    const room = rooms.get(code);
    if (!room) {
      return () => {};
    }

    room.listeners.add(callback);
    // Send immediate snapshot
    callback(getRoomSnapshot(room));

    return () => {
      room.listeners.delete(callback);
    };
  },
};
