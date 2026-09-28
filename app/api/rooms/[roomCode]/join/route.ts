import { NextRequest, NextResponse } from 'next/server';
import { GameService } from '@/lib/sync/service';

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await props.params;
    const body = await req.json();
    const { playerName } = body;

    if (!playerName || typeof playerName !== 'string') {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }

    const result = await GameService.joinRoom(roomCode, playerName);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to join room';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
