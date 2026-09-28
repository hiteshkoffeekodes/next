import { describe, it, expect } from 'vitest';
import { GameStore } from '../lib/sync/gameStore';

describe('Turn-based Gameplay (One Click per Player per Turn)', () => {
  it('enforces that players take turns and can only call one number at a time', () => {
    // 1. Host (Player A) creates room
    const { roomCode, playerId: playerAId } = GameStore.createRoom('Hitesh');

    // 2. Player B joins
    const { playerId: playerBId } = GameStore.joinRoom(roomCode, 'Rahul');

    // 3. Player C joins
    const { playerId: playerCId } = GameStore.joinRoom(roomCode, 'Jay');

    // 4. Host starts game
    const started = GameStore.startGame(roomCode, playerAId);
    expect(started.game.status).toBe('playing');
    expect(started.game.current_turn_player_id).toBe(playerAId);
    expect(started.currentTurnPlayerName).toBe('Hitesh');

    // 5. Player B tries to call out of turn -> MUST BE REJECTED
    const outOfTurnCall = GameStore.callNumber(roomCode, playerBId, 5);
    expect(outOfTurnCall.success).toBe(false);
    expect(outOfTurnCall.message).toContain('not your turn');

    // 6. Player A calls 1 valid number on their turn -> MUST SUCCEED
    const playerABoard = started.players.find((p) => p.id === playerAId)!.board;
    const firstCallNum = playerABoard[0];
    const call1 = GameStore.callNumber(roomCode, playerAId, firstCallNum);
    expect(call1.success).toBe(true);
    expect(call1.number).toBe(firstCallNum);

    // 7. Verify turn has now advanced to Player B (Rahul)
    const afterCall1 = GameStore.getRoom(roomCode)!;
    expect(afterCall1.game.current_turn_player_id).toBe(playerBId);
    expect(afterCall1.currentTurnPlayerName).toBe('Rahul');

    // 8. Player A tries to click/call again immediately -> MUST BE REJECTED (Ek time e ek j vakhat click!)
    const playerASecondClick = GameStore.callNumber(roomCode, playerAId, playerABoard[1]);
    expect(playerASecondClick.success).toBe(false);
    expect(playerASecondClick.message).toContain('not your turn');
    expect(playerASecondClick.message).toContain('Rahul');

    // 9. Player B calls a number on their turn -> MUST SUCCEED
    const playerBBoard = started.players.find((p) => p.id === playerBId)!.board;
    // Choose a number not yet called
    const secondCallNum = playerBBoard.find((n) => n !== firstCallNum)!;
    const call2 = GameStore.callNumber(roomCode, playerBId, secondCallNum);
    expect(call2.success).toBe(true);

    // 10. Verify turn has advanced to Player C (Jay)
    const afterCall2 = GameStore.getRoom(roomCode)!;
    expect(afterCall2.game.current_turn_player_id).toBe(playerCId);
    expect(afterCall2.currentTurnPlayerName).toBe('Jay');

    // 11. Player C calls -> Turn loops back to Player A
    const playerCBoard = started.players.find((p) => p.id === playerCId)!.board;
    const thirdCallNum = playerCBoard.find((n) => n !== firstCallNum && n !== secondCallNum)!;
    const call3 = GameStore.callNumber(roomCode, playerCId, thirdCallNum);
    expect(call3.success).toBe(true);

    const afterCall3 = GameStore.getRoom(roomCode)!;
    expect(afterCall3.game.current_turn_player_id).toBe(playerAId);
    expect(afterCall3.currentTurnPlayerName).toBe('Hitesh');
  });
});
