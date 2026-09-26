"use client";

import React from "react";
import type { ConnectionStatus } from "@/hooks/use-realtime-tracking";

interface RealtimeIndicatorProps {
  status: ConnectionStatus;
  className?: string;
}

export function RealtimeIndicator({ status, className = "" }: RealtimeIndicatorProps) {
  let dotColor = "bg-slate-400";
  let label = "Realtime tidak tersedia";
  let ping = false;

  if (status === "connected") {
    dotColor = "bg-emerald-500";
    label = "Terhubung";
    ping = true;
  } else if (status === "connecting") {
    dotColor = "bg-amber-500";
    label = "Menghubungkan...";
    ping = false;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
        status === "connected"
          ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
          : status === "connecting"
          ? "border-amber-200 bg-amber-50/80 text-amber-800"
          : "border-slate-200 bg-slate-100 text-slate-600"
      } ${className}`}
      title={`Status Koneksi Realtime: ${label}`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {ping && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
      </span>
      <span>{label}</span>
    </div>
  );
}
