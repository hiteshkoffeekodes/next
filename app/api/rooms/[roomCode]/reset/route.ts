import { NextRequest, NextResponse } from 'next/server';
import { GameService } from '@/lib/sync/service';

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await props.params;
    const body = await req.json();
    const { playerId } = body;

    if (!playerId || typeof playerId !== 'string') {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    const state = await GameService.resetGame(roomCode);
    return NextResponse.json({ success: true, state });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reset game';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
