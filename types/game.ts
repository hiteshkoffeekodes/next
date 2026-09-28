import { Player } from './player';
export * from './player';

export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface Game {
  id: string;
  room_code: string;
  host_id: string;
  status: GameStatus;
  winner_id: string | null;
  winner_name: string | null;
  current_turn_player_id: string | null;
  turn_order: string[];
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface CalledNumber {
  id: string;
  game_id: string;
  number: number;
  called_by: string;
  called_by_name: string;
  created_at: string;
}

export interface RoomState {
  game: Game;
  players: Player[];
  calledNumbers: CalledNumber[];
  lastCalledNumber: number | null;
  lastCalledByName: string | null;
  currentTurnPlayerName: string | null;
}

export interface CallNumberResponse {
  success: boolean;
  number: number;
  called_by: string;
  called_by_name: string;
  winner_id: string | null;
  winner_name: string | null;
  game_status: GameStatus;
  message?: string;
}
