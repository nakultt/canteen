"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface SSEMessage {
  type: string;
  data: Record<string, unknown>;
}

/**
 * Hook to subscribe to Server-Sent Events for live dashboard updates.
 * Automatically reconnects on disconnection.
 */
export function useLiveUpdates(
  onEvent: (event: SSEMessage) => void,
  enabled = true
) {
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (!enabled) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const eventSource = new EventSource(
      `/api/events?token=${encodeURIComponent(token)}`
    );

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed: SSEMessage = JSON.parse(event.data);
        onEventRef.current(parsed);
      } catch {
        // ignore non-JSON messages (keepalive)
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
      eventSource.close();
      // Reconnect after 3 seconds
      setTimeout(connect, 3000);
    };

    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, [enabled]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  return { connected };
}
