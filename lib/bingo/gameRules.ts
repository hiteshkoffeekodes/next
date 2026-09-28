export const BOARD_SIZE = 5;
export const TOTAL_CELLS = 25; // 5x5
export const MIN_NUMBER = 1;
export const MAX_NUMBER = 25;
export const WINNING_LINES_COUNT = 5;
export const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'] as const;

export type BingoLetter = typeof BINGO_LETTERS[number];

/**
 * Validates a room code format (6 alphanumeric characters)
 */
export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{4,8}$/i.test(code.trim());
}

/**
 * Normalizes a room code to uppercase
 */
export function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Validates a player name
 */
export function isValidPlayerName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 20;
}

/**
 * Generates a clean random 6-character room code (avoiding ambiguous chars like O/0, I/1)
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
