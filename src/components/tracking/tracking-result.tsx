"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCwIcon,
  ExternalLinkIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import { TrackingStepper, type ReportStatusType } from "./tracking-stepper";
import { RealtimeIndicator } from "./realtime-indicator";
import { PrivateChat } from "@/components/chat/private-chat";
import type { ConnectionStatus } from "@/hooks/use-realtime-tracking";

export interface TrackedReportData {
  report_id: string;
  status: ReportStatusType;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: string;
  incident_location: string;
  incident_time: string | null;
  description: string;
  evidence_url: string | null;
  school: {
    id: string;
    name: string;
    city: string;
  };
  created_at: string;
  updated_at: string;
}

interface TrackingResultProps {
  report: TrackedReportData;
  token: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  onReset: () => void;
  connectionStatus: ConnectionStatus;
  sseChatTrigger: number;
}

export function TrackingResult({
  report,
  token,
  onRefresh,
  isRefreshing,
  onReset,
  connectionStatus,
  sseChatTrigger,
}: TrackingResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyToken = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // ignore
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: ReportStatusType) => {
    switch (status) {
      case "RECEIVED":
        return <Badge variant="slate">Laporan Diterima</Badge>;
      case "UNDER_REVIEW":
        return <Badge variant="brand">Sedang Ditinjau</Badge>;
      case "ACTION_TAKEN":
        return <Badge variant="amber">Tindakan Sedang Dilakukan</Badge>;
      case "RESOLVED":
        return <Badge variant="emerald">Penanganan Selesai</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-xs"
            >
              ← Lacak Laporan Lain
            </button>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                Status Laporan
              </h1>
              {getStatusBadge(report.status)}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {report.school.name} ({report.school.city})
            </p>
          </div>

          {/* Realtime Status Indicator & Manual Refresh Action */}
          <div className="flex flex-wrap items-center gap-2.5">
            <RealtimeIndicator status={connectionStatus} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="w-full sm:w-auto justify-center"
              aria-label="Segarkan status laporan"
            >
              <RefreshCwIcon
                className={`h-4 w-4 ${isRefreshing ? "animate-spin text-sky-700" : ""}`}
              />
              <span>{isRefreshing ? "Menyegarkan..." : "Segarkan Status"}</span>
            </Button>
          </div>
        </div>

        {/* Token Card & Timestamps */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Kode Tiket Pelacakan
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-lg font-bold tracking-widest text-slate-900 select-all">
                {token}
              </span>
              <button
                type="button"
                onClick={handleCopyToken}
                className="text-xs font-semibold text-sky-700 hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-xs py-1 px-1.5"
              >
                {copied ? "✓ Tersalin" : "Salin"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-center gap-1 text-xs text-slate-600">
            <div>
              <span className="font-semibold text-slate-700">Waktu Dikirim:</span>{" "}
              <span>{formatDate(report.created_at)}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Pembaruan Terakhir:</span>{" "}
              <span>{formatDate(report.updated_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <TrackingStepper currentStatus={report.status} />
      </div>

      {/* Incident Details Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
          Ringkasan Laporan Kejadian
        </h3>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <div>
            <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Kategori Kejadian
            </dt>
            <dd className="text-sm font-semibold text-slate-900">{report.category}</dd>
          </div>

          <div>
            <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Lokasi Kejadian
            </dt>
            <dd className="text-sm text-slate-900">{report.incident_location}</dd>
          </div>

          {report.incident_time && (
            <div>
              <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Perkiraan Waktu
              </dt>
              <dd className="text-sm text-slate-900">{report.incident_time}</dd>
            </div>
          )}

          {report.evidence_url && (
            <div>
              <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Tautan Bukti Pendukung
              </dt>
              <dd className="text-sm">
                <a
                  href={report.evidence_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sky-700 hover:text-sky-800 underline font-medium"
                >
                  <span>Buka Bukti</span>
                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                </a>
              </dd>
            </div>
          )}
        </dl>

        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Kronologi yang Disampaikan
          </h4>
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            {report.description}
          </div>
        </div>
      </div>

      {/* Safety & Counselor Note */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 flex items-start gap-3.5 text-xs text-slate-600 leading-relaxed">
        <ShieldIcon className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-800 mb-0.5">Penanganan Dilakukan Secara Manusiawi</p>
          <p>
            Semua tahapan penanganan dievaluasi langsung oleh Guru Bimbingan Konseling (BK) dan Tim
            Pencegahan dan Penanganan Kekerasan (TPPK) sekolah untuk menjamin perlindungan siswa.
          </p>
        </div>
      </div>

      {/* Private Chat Section */}
      <PrivateChat token={token} sseRefreshTrigger={sseChatTrigger} />
    </div>
  );
}
