import { TOTAL_CELLS, MIN_NUMBER, MAX_NUMBER } from './gameRules';

/**
 * Generates an independently shuffled 5x5 board containing numbers 1 to 25.
 * Uses the Fisher-Yates (Knuth) shuffle algorithm to guarantee uniform distribution.
 * 
 * Every call generates a unique independent arrangement.
 * 
 * @returns Array of 25 numbers containing exactly 1-25 in random order.
 */
export function generateBoard(): number[] {
  // Create an array with numbers 1 to 25
  const numbers: number[] = [];
  for (let i = MIN_NUMBER; i <= MAX_NUMBER; i++) {
    numbers.push(i);
  }

  // Fisher-Yates shuffle
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = numbers[i];
    numbers[i] = numbers[j];
    numbers[j] = temp;
  }

  return numbers;
}

/**
 * Validates that a given board contains exactly numbers 1-25 with no duplicates.
 */
export function isValidBoard(board: number[]): boolean {
  if (!Array.isArray(board) || board.length !== TOTAL_CELLS) {
    return false;
  }

  const seen = new Set<number>();
  for (const num of board) {
    if (typeof num !== 'number' || num < MIN_NUMBER || num > MAX_NUMBER) {
      return false;
    }
    if (seen.has(num)) {
      return false;
    }
    seen.add(num);
  }

  return seen.size === TOTAL_CELLS;
}
