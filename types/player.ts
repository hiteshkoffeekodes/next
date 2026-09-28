export interface Player {
  id: string;
  game_id: string;
  name: string;
  board: number[]; // 25 numbers (1-25) in unique random order
  completed_lines: number;
  is_host: boolean;
  joined_at: string;
  last_seen_at?: string;
}

export interface PlayerProgress {
  id: string;
  name: string;
  isHost: boolean;
  completedLines: number;
  isWinner: boolean;
}
