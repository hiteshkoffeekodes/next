import { NextRequest, NextResponse } from 'next/server';
import { GameService } from '@/lib/sync/service';

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await props.params;
    const body = await req.json();
    const { playerId, number } = body;

    if (!playerId || typeof playerId !== 'string') {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    if (typeof number !== 'number' || number < 1 || number > 25) {
      return NextResponse.json({ error: 'Valid number between 1 and 25 is required' }, { status: 400 });
    }

    const result = await GameService.callNumber(roomCode, playerId, number);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to call number';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
