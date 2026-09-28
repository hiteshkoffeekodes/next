import { NextRequest, NextResponse } from 'next/server';
import { GameService } from '@/lib/sync/service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hostName } = body;

    if (!hostName || typeof hostName !== 'string') {
      return NextResponse.json({ error: 'Host name is required' }, { status: 400 });
    }

    const result = await GameService.createRoom(hostName);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create room';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
