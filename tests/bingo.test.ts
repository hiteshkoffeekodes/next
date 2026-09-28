import { describe, it, expect } from 'vitest';
import { generateBoard, isValidBoard } from '../lib/bingo/generateBoard';
import {
  calculateCompletedLines,
  hasWinner,
} from '../lib/bingo/calculateLines';
import { isValidRoomCode, isValidPlayerName } from '../lib/bingo/gameRules';

describe('Bingo Board Generation', () => {
  it('generates a board with exactly 25 numbers from 1 to 25', () => {
    const board = generateBoard();
    expect(board).toHaveLength(25);
    expect(isValidBoard(board)).toBe(true);

    // Check all numbers 1..25 exist
    const sorted = [...board].sort((a, b) => a - b);
    for (let i = 1; i <= 25; i++) {
      expect(sorted[i - 1]).toBe(i);
    }
  });

  it('contains no duplicate numbers', () => {
    const board = generateBoard();
    const unique = new Set(board);
    expect(unique.size).toBe(25);
  });

  it('independently randomizes boards for different players (Player A vs Player B)', () => {
    const boardA = generateBoard();
    const boardB = generateBoard();
    const boardC = generateBoard();

    // Verify all are valid
    expect(isValidBoard(boardA)).toBe(true);
    expect(isValidBoard(boardB)).toBe(true);
    expect(isValidBoard(boardC)).toBe(true);

    // It is mathematically virtually impossible (1 in 25! ≈ 1.55 × 10^25) for two independently shuffled boards to match
    const sameAB = boardA.every((num, idx) => num === boardB[idx]);
    const sameBC = boardB.every((num, idx) => num === boardC[idx]);

    expect(sameAB).toBe(false);
    expect(sameBC).toBe(false);
  });
});

describe('Bingo Line Calculations', () => {
  // Sample fixed board for deterministic line tests
  // Row 0: 7, 21, 3, 18, 12
  // Row 1: 24, 5, 16, 9, 1
  // Row 2: 14, 23, 8, 25, 11
  // Row 3: 4, 17, 20, 6, 22
  // Row 4: 15, 2, 19, 10, 13
  const sampleBoard = [
    7, 21, 3, 18, 12,
    24, 5, 16, 9, 1,
    14, 23, 8, 25, 11,
    4, 17, 20, 6, 22,
    15, 2, 19, 10, 13,
  ];

  it('detects 0 completed lines when no numbers or partial numbers are called', () => {
    const res = calculateCompletedLines(sampleBoard, []);
    expect(res.completedLines).toBe(0);
    expect(res.isWinner).toBe(false);
    expect(res.crossedLetters).toEqual(['B', 'I', 'N', 'G', 'O']);

    // 4 out of 5 in row 1
    const resPartial = calculateCompletedLines(sampleBoard, [7, 21, 3, 18]);
    expect(resPartial.completedLines).toBe(0);
  });

  it('detects row completion (Row 1 -> B crossed: ✕ I N G O)', () => {
    const called = [7, 21, 3, 18, 12];
    const res = calculateCompletedLines(sampleBoard, called);

    expect(res.completedLines).toBe(1);
    const row0 = res.lines.find((l) => l.type === 'row' && l.index === 0);
    expect(row0?.completed).toBe(true);
    expect(res.crossedLetters).toEqual(['✕', 'I', 'N', 'G', 'O']);
    expect(res.isWinner).toBe(false);
  });

  it('detects column completion', () => {
    // Column 0: 7, 24, 14, 4, 15
    const called = [7, 24, 14, 4, 15];
    const res = calculateCompletedLines(sampleBoard, called);

    expect(res.completedLines).toBe(1);
    const col0 = res.lines.find((l) => l.type === 'column' && l.index === 0);
    expect(col0?.completed).toBe(true);
  });

  it('detects main diagonal completion ([0,0] to [4,4]: 7, 5, 8, 6, 13)', () => {
    const called = [7, 5, 8, 6, 13];
    const res = calculateCompletedLines(sampleBoard, called);

    expect(res.completedLines).toBe(1);
    const diag = res.lines.find((l) => l.type === 'main_diagonal');
    expect(diag?.completed).toBe(true);
  });

  it('detects anti-diagonal completion ([0,4] to [4,0]: 12, 9, 8, 17, 15)', () => {
    const called = [12, 9, 8, 17, 15];
    const res = calculateCompletedLines(sampleBoard, called);

    expect(res.completedLines).toBe(1);
    const antiDiag = res.lines.find((l) => l.type === 'anti_diagonal');
    expect(antiDiag?.completed).toBe(true);
  });

  it('detects multiple completed lines and tracks BINGO letter progress', () => {
    // Row 0 (7, 21, 3, 18, 12) + Row 1 (24, 5, 16, 9, 1) -> 2 lines -> ✕ ✕ N G O
    const called2 = [7, 21, 3, 18, 12, 24, 5, 16, 9, 1];
    const res2 = calculateCompletedLines(sampleBoard, called2);
    expect(res2.completedLines).toBe(2);
    expect(res2.crossedLetters).toEqual(['✕', '✕', 'N', 'G', 'O']);
    expect(res2.isWinner).toBe(false);

    // Add Row 2 (14, 23, 8, 25, 11) -> 3 lines -> ✕ ✕ ✕ G O
    const called3 = [...called2, 14, 23, 8, 25, 11];
    const res3 = calculateCompletedLines(sampleBoard, called3);
    expect(res3.completedLines).toBe(3);
    expect(res3.crossedLetters).toEqual(['✕', '✕', '✕', 'G', 'O']);

    // Add Row 3 (4, 17, 20, 6, 22) -> 4 lines -> ✕ ✕ ✕ ✕ O
    const called4 = [...called3, 4, 17, 20, 6, 22];
    const res4 = calculateCompletedLines(sampleBoard, called4);
    expect(res4.completedLines).toBe(4);
    expect(res4.crossedLetters).toEqual(['✕', '✕', '✕', '✕', 'O']);
  });

  it('triggers winner detection when 5 or more lines are completed', () => {
    // 5 Rows completed:
    const allRowNumbers = [
      7, 21, 3, 18, 12, // Row 0
      24, 5, 16, 9, 1,  // Row 1
      14, 23, 8, 25, 11,// Row 2
      4, 17, 20, 6, 22, // Row 3
      15, 2, 19, 10, 13,// Row 4
    ];
    // Calling 5 distinct non-diagonal lines: Row 0, 1, 2 and Col 0, Col 1
    // Row 0: 7, 21, 3, 18, 12
    // Row 1: 24, 5, 16, 9, 1
    // Row 2: 14, 23, 8, 25, 11
    // Col 0 needs: 4, 15 (from rows 3, 4)
    // Col 1 needs: 17, 2 (from rows 3, 4)
    // Total numbers called: 15 (rows 0,1,2) + 4 (4, 15, 17, 2) = 19 numbers.
    // Diagonals: Main needs 13 (not called). Anti-diagonal needs 15 (called), 17 (called), 8 (called), 9 (called), 12 (called) -> wait, anti-diag is completed too!
    // Simply test with all 5 rows (full board):
    const resAll = calculateCompletedLines(sampleBoard, allRowNumbers);
    expect(resAll.completedLines).toBe(12); // All 12 lines completed
    expect(resAll.isWinner).toBe(true);
    expect(hasWinner(resAll.completedLines)).toBe(true);
    expect(resAll.crossedLetters).toEqual(['✕', '✕', '✕', '✕', '✕']);

    // Now test exact 5 lines:
    // Let's call Row 0, Row 1, Row 2, Row 3 (4 lines)
    const res4 = calculateCompletedLines(sampleBoard, [
      7, 21, 3, 18, 12,
      24, 5, 16, 9, 1,
      14, 23, 8, 25, 11,
      4, 17, 20, 6, 22,
    ]);
    expect(res4.completedLines).toBe(4);
    expect(res4.isWinner).toBe(false);

    // Call 15: Row 4 col 0. Does not complete any row/col yet.
    // Call 2: Row 4 col 1.
    // Call 19: Row 4 col 2.
    // Call 10: Row 4 col 3.
    // Now row 4 is missing only 13.
    // Column 2 has: 3 (called), 16 (called), 8 (called), 20 (called), 19 (called) -> That completes Column 2!
    // Lines completed: 4 rows + 1 column (col 2) = exactly 5 lines!
    const res5 = calculateCompletedLines(sampleBoard, [
      7, 21, 3, 18, 12, // Row 0
      24, 5, 16, 9, 1,  // Row 1
      14, 23, 8, 25, 11,// Row 2
      4, 17, 20, 6, 22, // Row 3
      19                // completes Column 2 (3, 16, 8, 20, 19)
    ]);
    expect(res5.completedLines).toBe(5);
    expect(res5.isWinner).toBe(true);
    expect(hasWinner(res5.completedLines)).toBe(true);
    expect(res5.crossedLetters).toEqual(['✕', '✕', '✕', '✕', '✕']);
  });

  it('same called number highlights on different positions across different player boards', () => {
    const boardA = [
      7, 21, 3, 18, 12,
      24, 5, 16, 9, 1,
      14, 23, 8, 25, 11,
      4, 17, 20, 6, 22,
      15, 2, 19, 10, 13,
    ];
    const boardB = [
      17, 5, 12, 9, 24,
      4, 8, 21, 2, 13,
      23, 1, 7, 20, 25,
      14, 16, 3, 22, 11,
      18, 19, 10, 15, 6,
    ];

    const called = [17];
    // In board A, 17 is at row 3, col 1 (index 16)
    const idxA = boardA.indexOf(17);
    expect(idxA).toBe(16);
    expect(called.includes(boardA[idxA])).toBe(true);

    // In board B, 17 is at row 0, col 0 (index 0)
    const idxB = boardB.indexOf(17);
    expect(idxB).toBe(0);
    expect(called.includes(boardB[idxB])).toBe(true);
  });
});

describe('Validation Helpers', () => {
  it('validates room codes correctly', () => {
    expect(isValidRoomCode('AB7K92')).toBe(true);
    expect(isValidRoomCode('ab7k92')).toBe(true);
    expect(isValidRoomCode('AB12')).toBe(true);
    expect(isValidRoomCode('AB')).toBe(false);
    expect(isValidRoomCode('AB!@#$')).toBe(false);
  });

  it('validates player names correctly', () => {
    expect(isValidPlayerName('Hitesh')).toBe(true);
    expect(isValidPlayerName('J')).toBe(false); // too short
    expect(isValidPlayerName('   ')).toBe(false);
    expect(isValidPlayerName('A'.repeat(25))).toBe(false); // too long
  });
});
