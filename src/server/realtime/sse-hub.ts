/**
 * Server-Sent Events (SSE) In-Memory Hub for SchoolCare
 * 
 * ARCHITECTURE NOTE (Single-Instance Hackathon MVP):
 * This hub maintains process-local subscriptions in memory, mapping report IDs
 * to active HTTP response stream controllers.
 * 
 * Distributed pub/sub infrastructure (e.g. PostgreSQL LISTEN/NOTIFY or Redis)
 * is intentionally out-of-scope for the single-instance demo architecture.
 */

export interface SSEClient {
  id: string;
  reportId: string;
  send: (event: string, data: unknown) => void;
  sendComment: (comment: string) => void;
  close: () => void;
}

export interface StatusUpdatedEventPayload {
  status: string;
  updated_at: string;
}

export interface MessageEventPayload {
  id: string;
  sender_role: "STUDENT" | "COUNSELOR";
  message: string;
  created_at: string;
}

export class SSEHub {
  // Map<reportId, Set<SSEClient>>
  private subscriptions = new Map<string, Set<SSEClient>>();

  /**
   * Subscribes an SSE client to updates for a specific reportId.
   * Returns an unsubscribe function for cleanup.
   */
  subscribe(client: SSEClient): () => void {
    let clientSet = this.subscriptions.get(client.reportId);
    if (!clientSet) {
      clientSet = new Set();
      this.subscriptions.set(client.reportId, clientSet);
    }
    clientSet.add(client);

    return () => {
      this.unsubscribe(client);
    };
  }

  /**
   * Removes an SSE client from the hub.
   */
  unsubscribe(client: SSEClient): void {
    const clientSet = this.subscriptions.get(client.reportId);
    if (clientSet) {
      clientSet.delete(client);
      if (clientSet.size === 0) {
        this.subscriptions.delete(client.reportId);
      }
    }
  }

  /**
   * Broadcasts a `status_updated` event strictly to clients subscribed to the given reportId.
   * Never leaks updates to other reports.
   */
  publishStatusUpdate(reportId: string, status: string, updatedAt: string): number {
    const clientSet = this.subscriptions.get(reportId);
    if (!clientSet || clientSet.size === 0) {
      return 0;
    }

    const payload: StatusUpdatedEventPayload = {
      status,
      updated_at: updatedAt,
    };

    let deliveredCount = 0;
    for (const client of Array.from(clientSet)) {
      try {
        client.send("status_updated", payload);
        deliveredCount++;
      } catch {
        // Broken pipe / connection lost, remove subscriber
        this.unsubscribe(client);
      }
    }

    return deliveredCount;
  }

  /**
   * Broadcasts a `new_message` event strictly to clients subscribed to the given reportId.
   * Never leaks messages to other reports.
   */
  publishNewMessage(reportId: string, message: MessageEventPayload): number {
    const clientSet = this.subscriptions.get(reportId);
    if (!clientSet || clientSet.size === 0) {
      return 0;
    }

    let deliveredCount = 0;
    for (const client of Array.from(clientSet)) {
      try {
        client.send("new_message", message);
        deliveredCount++;
      } catch {
        // Broken pipe / connection lost, remove subscriber
        this.unsubscribe(client);
      }
    }

    return deliveredCount;
  }

  /**
   * Returns the count of connected clients for a given reportId or across all reports.
   */
  getSubscriberCount(reportId?: string): number {
    if (reportId) {
      return this.subscriptions.get(reportId)?.size ?? 0;
    }
    let total = 0;
    for (const set of this.subscriptions.values()) {
      total += set.size;
    }
    return total;
  }

  /**
   * Resets all connections (primarily for automated testing).
   */
  clear(): void {
    for (const clientSet of this.subscriptions.values()) {
      for (const client of clientSet) {
        try {
          client.close();
        } catch {
          // ignore
        }
      }
    }
    this.subscriptions.clear();
  }
}

// Preserve hub singleton across Next.js hot module reloads in development
const globalForSSE = globalThis as unknown as {
  sseHub: SSEHub | undefined;
};

export const sseHub = globalForSSE.sseHub ?? new SSEHub();

if (process.env.NODE_ENV !== "production") {
  globalForSSE.sseHub = sseHub;
}
