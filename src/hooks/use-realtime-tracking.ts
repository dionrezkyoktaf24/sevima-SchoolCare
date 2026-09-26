"use client";

import { useEffect, useRef, useState } from "react";

export type ConnectionStatus = "connected" | "connecting" | "disconnected";

interface UseRealtimeTrackingOptions {
  token: string | null;
  onStatusUpdated?: (data: { status: string; updated_at: string }) => void;
  onNewMessage?: (data: { id: string; sender_role: string; message: string; created_at: string }) => void;
}

export function useRealtimeTracking({
  token,
  onStatusUpdated,
  onNewMessage,
}: UseRealtimeTrackingOptions) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(() =>
    token ? "connecting" : "disconnected"
  );

  // Keep latest callbacks in refs to avoid recreating EventSource when handlers change
  const onStatusUpdatedRef = useRef(onStatusUpdated);
  const onNewMessageRef = useRef(onNewMessage);

  useEffect(() => {
    onStatusUpdatedRef.current = onStatusUpdated;
  }, [onStatusUpdated]);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isUnmounted = false;
    let eventSource: EventSource | null = null;

    try {
      const url = `/api/realtime?token=${encodeURIComponent(token)}`;
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        if (isUnmounted) return;
        setConnectionStatus("connected");
      };

      // Listen for status_updated events
      eventSource.addEventListener("status_updated", (event: MessageEvent) => {
        if (isUnmounted) return;
        try {
          const data = JSON.parse(event.data);
          if (onStatusUpdatedRef.current) {
            onStatusUpdatedRef.current(data);
          }
        } catch {
          // Safe JSON parse error suppression
        }
      });

      // Listen for new_message events
      eventSource.addEventListener("new_message", (event: MessageEvent) => {
        if (isUnmounted) return;
        try {
          const data = JSON.parse(event.data);
          if (onNewMessageRef.current) {
            onNewMessageRef.current(data);
          }
        } catch {
          // Safe JSON parse error suppression
        }
      });

      eventSource.onerror = () => {
        if (isUnmounted) return;

        if (eventSource?.readyState === EventSource.CONNECTING) {
          setConnectionStatus("connecting");
        } else if (eventSource?.readyState === EventSource.CLOSED) {
          setConnectionStatus("disconnected");
        }
      };
    } catch {
      // Ignore invalid EventSource creation issues; token guard ensures only valid references reach this point.
    }

    return () => {
      isUnmounted = true;
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }, [token]);

  return { connectionStatus };
}
