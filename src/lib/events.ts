/**
 * Server-Sent Events (SSE) event bus for live dashboard updates.
 *
 * Events are typed so each dashboard can filter for relevant data:
 * - order:created, order:updated    → USER + ADMIN dashboards
 * - food:created, food:updated, food:deleted → ADMIN dashboard
 * - user:created, user:updated, user:deleted → DEV dashboard
 * - company:created, company:updated, company:deleted → DEV dashboard
 * - cart:updated                    → USER dashboard
 */

export type EventType =
  | "order:created"
  | "order:updated"
  | "food:created"
  | "food:updated"
  | "food:deleted"
  | "user:created"
  | "user:updated"
  | "user:deleted"
  | "company:created"
  | "company:updated"
  | "company:deleted"
  | "cart:updated";

export interface SSEEvent {
  type: EventType;
  data: Record<string, unknown>;
  /** If set, only clients matching this companyId (or DEV) receive the event */
  companyId?: number | null;
}

type Listener = (event: SSEEvent) => void;

/**
 * Global event bus singleton.  
 * We attach to `globalThis` to survive Next.js HMR in development.
 */
const GLOBAL_KEY = "__canteen_event_bus__" as const;

interface EventBus {
  listeners: Set<Listener>;
  emit: (event: SSEEvent) => void;
  subscribe: (listener: Listener) => () => void;
}

function createEventBus(): EventBus {
  const listeners = new Set<Listener>();

  return {
    listeners,
    emit(event: SSEEvent) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch {
          // ignore listener errors
        }
      }
    },
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

// biome-ignore lint: using globalThis for HMR persistence
const g = globalThis as unknown as Record<string, EventBus>;
if (!g[GLOBAL_KEY]) {
  g[GLOBAL_KEY] = createEventBus();
}

export const eventBus: EventBus = g[GLOBAL_KEY];
