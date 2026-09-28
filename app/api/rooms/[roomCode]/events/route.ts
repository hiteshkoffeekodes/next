import { NextRequest } from 'next/server';
import { GameStore } from '@/lib/sync/gameStore';
import { normalizeRoomCode } from '@/lib/bingo/gameRules';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ roomCode: string }> }
) {
  const { roomCode } = await props.params;
  const code = normalizeRoomCode(roomCode);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial state if room exists
      const room = GameStore.getRoom(code);
      if (room) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(room)}\n\n`));
      }

      // Subscribe to real-time room events
      const unsubscribe = GameStore.subscribe(code, (state) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(state)}\n\n`));
        } catch {
          unsubscribe();
        }
      });

      // Keepalive heartbeat every 15s to prevent intermediate proxy timeout
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // stream already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
