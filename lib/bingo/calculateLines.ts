import { BOARD_SIZE, WINNING_LINES_COUNT, BINGO_LETTERS } from './gameRules';

export type LineType = 'row' | 'column' | 'main_diagonal' | 'anti_diagonal';

export interface LineDefinition {
  type: LineType;
  index: number; // 0-4 for rows/columns, 0 for diagonals
  name: string;
  indices: number[]; // Array of 5 board indices (0-24)
}

export interface LineResult {
  type: LineType;
  index: number;
  name: string;
  completed: boolean;
  indices: number[];
  numbers: number[];
}

export interface CompletedLinesResult {
  completedLines: number;
  lines: LineResult[];
  completedCellIndices: number[]; // Set of all cell indices that are in any completed line
  crossedLetters: string[]; // e.g. ['✕', '✕', 'N', 'G', 'O']
  isWinner: boolean;
}

/**
 * Pre-computes the 12 possible Bingo line definitions (5 rows, 5 columns, 2 diagonals)
 */
export const ALL_LINES: LineDefinition[] = [
  // 5 Rows
  ...Array.from({ length: BOARD_SIZE }, (_, r): LineDefinition => ({
    type: 'row',
    index: r,
    name: `Row ${r + 1}`,
    indices: Array.from({ length: BOARD_SIZE }, (_, c) => r * BOARD_SIZE + c),
  })),
  // 5 Columns
  ...Array.from({ length: BOARD_SIZE }, (_, c): LineDefinition => ({
    type: 'column',
    index: c,
    name: `Column ${c + 1}`,
    indices: Array.from({ length: BOARD_SIZE }, (_, r) => r * BOARD_SIZE + c),
  })),
  // Main diagonal: [0,0], [1,1], [2,2], [3,3], [4,4] -> 0, 6, 12, 18, 24
  {
    type: 'main_diagonal',
    index: 0,
    name: 'Main Diagonal',
    indices: Array.from({ length: BOARD_SIZE }, (_, i) => i * BOARD_SIZE + i),
  },
  // Anti-diagonal: [0,4], [1,3], [2,2], [3,1], [4,0] -> 4, 8, 12, 16, 20
  {
    type: 'anti_diagonal',
    index: 0,
    name: 'Anti Diagonal',
    indices: Array.from({ length: BOARD_SIZE }, (_, i) => i * BOARD_SIZE + (BOARD_SIZE - 1 - i)),
  },
];

/**
 * Calculates completed lines for a given board and list of called numbers.
 * 
 * @param board 25 numbers in the player's 5x5 board
 * @param calledNumbers Numbers that have been called in the game
 */
export function calculateCompletedLines(
  board: number[],
  calledNumbers: number[] | Set<number>
): CompletedLinesResult {
  const calledSet = calledNumbers instanceof Set ? calledNumbers : new Set(calledNumbers);
  const completedCellIndicesSet = new Set<number>();
  let completedCount = 0;

  const lines: LineResult[] = ALL_LINES.map((lineDef) => {
    const numbers = lineDef.indices.map((idx) => board[idx]);
    const completed = numbers.every((num) => num !== undefined && calledSet.has(num));

    if (completed) {
      completedCount++;
      lineDef.indices.forEach((idx) => completedCellIndicesSet.add(idx));
    }

    return {
      type: lineDef.type,
      index: lineDef.index,
      name: lineDef.name,
      completed,
      indices: lineDef.indices,
      numbers,
    };
  });

  const crossedLetters = BINGO_LETTERS.map((letter, i) =>
    i < completedCount ? '✕' : letter
  );

  return {
    completedLines: completedCount,
    lines,
    completedCellIndices: Array.from(completedCellIndicesSet),
    crossedLetters,
    isWinner: hasWinner(completedCount),
  };
}

/**
 * Returns true if the player has completed 5 or more lines
 */
export function hasWinner(completedLines: number): boolean {
  return completedLines >= WINNING_LINES_COUNT;
}
