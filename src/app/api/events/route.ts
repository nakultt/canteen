import { verifyToken } from "@/lib/auth";
import { eventBus, type SSEEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // EventSource can't send headers, so accept token via query param too
  const { searchParams } = new URL(request.url);
  const queryToken = searchParams.get("token");

  let user = null;
  if (queryToken) {
    user = await verifyToken(queryToken);
  }

  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial keepalive
      controller.enqueue(encoder.encode(": connected\n\n"));

      const listener = (event: SSEEvent) => {
        // Filter: DEV sees everything; others only see their company's events
        if (
          user.role !== "DEV" &&
          event.companyId !== undefined &&
          event.companyId !== null &&
          event.companyId !== user.companyId
        ) {
          return;
        }

        const data = JSON.stringify({
          type: event.type,
          data: event.data,
        });
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // stream closed
        }
      };

      const unsubscribe = eventBus.subscribe(listener);

      // Keepalive ping every 30s
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(keepalive);
        }
      }, 30000);

      // Cleanup on abort
      request.signal.addEventListener("abort", () => {
        unsubscribe();
        clearInterval(keepalive);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
