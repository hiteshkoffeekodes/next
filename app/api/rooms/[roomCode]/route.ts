import { NextRequest, NextResponse } from 'next/server';
import { GameService } from '@/lib/sync/service';

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await props.params;
    const room = await GameService.getRoom(roomCode);

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json(room);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch room';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await props.params;
    const body = await req.json().catch(() => ({}));
    const { playerId } = body;

    if (playerId) {
      await GameService.leaveGame(roomCode, playerId);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to leave room';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
