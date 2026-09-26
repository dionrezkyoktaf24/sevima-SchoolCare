"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type DetailReport = {
  id: string;
  category: string;
  status: "RECEIVED" | "UNDER_REVIEW" | "ACTION_TAKEN" | "RESOLVED";
  aiSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  aiConfidence: number | null;
  aiRiskSummary: string | null;
  aiActionPlan: Array<{ priority: number; action: string; reason: string }>;
  aiDraftResponse: string | null;
  incidentLocation: string;
  incidentTime: string | null;
  description: string;
  evidenceUrl: string | null;
  schoolName: string;
  city: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    sender_role: "STUDENT" | "COUNSELOR";
    message: string;
    created_at: string;
  }>;
};

interface ReportDetailClientProps {
  username: string;
  report: DetailReport;
}

const statusLabels: Record<DetailReport["status"], string> = {
  RECEIVED: "Diterima",
  UNDER_REVIEW: "Ditinjau",
  ACTION_TAKEN: "Tindakan",
  RESOLVED: "Selesai",
};

const statusOptions: DetailReport["status"][] = [
  "RECEIVED",
  "UNDER_REVIEW",
  "ACTION_TAKEN",
  "RESOLVED",
];

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatStatusBadge(status: DetailReport["status"]) {
  switch (status) {
    case "RECEIVED":
      return <Badge variant="slate">{statusLabels[status]}</Badge>;
    case "UNDER_REVIEW":
      return <Badge variant="brand">{statusLabels[status]}</Badge>;
    case "ACTION_TAKEN":
      return <Badge variant="amber">{statusLabels[status]}</Badge>;
    case "RESOLVED":
      return <Badge variant="emerald">{statusLabels[status]}</Badge>;
    default:
      return <Badge variant="slate">{status}</Badge>;
  }
}

export function ReportDetailClient({ username, report: initialReport }: ReportDetailClientProps) {
  const [report, setReport] = useState(initialReport);
  const [selectedStatus, setSelectedStatus] = useState<DetailReport["status"]>(initialReport.status);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageData, setTriageData] = useState<{
    severity: string;
    confidence: number;
    risk_summary: string;
    action_plans: Array<{ priority: number; action: string; reason: string }>;
    draft_response: string;
  } | null>(null);
  const [chatMessages, setChatMessages] = useState(report.messages);
  const [chatDraft, setChatDraft] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const severityLabel = useMemo(() => {
    if (triageData?.severity) return triageData.severity;
    return report.aiSeverity;
  }, [report.aiSeverity, triageData]);

  const refreshMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/counselor?report_id=${report.id}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const json = await response.json();
      if (response.ok && json.success && Array.isArray(json.data.messages)) {
        setChatMessages(json.data.messages);
      }
    } catch {
      // no-op; UI handles user-visible errors on send
    }
  }, [report.id]);

  useEffect(() => {
    let isMounted = true;

    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/chat/counselor?report_id=${report.id}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        const json = await response.json();
        if (!isMounted) {
          return;
        }
        if (response.ok && json.success && Array.isArray(json.data.messages)) {
          setChatMessages(json.data.messages);
        }
      } catch {
        // no-op
      }
    };

    loadMessages();

    const source = new EventSource(`/api/realtime?report_id=${report.id}`);
    const onStatus = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as { status?: DetailReport["status"]; updated_at?: string };
        if (payload.status) {
          setReport((prev) => ({
            ...prev,
            status: payload.status as DetailReport["status"],
            updatedAt: payload.updated_at ?? prev.updatedAt,
          }));
          setSelectedStatus(payload.status as DetailReport["status"]);
        }
      } catch {
        // ignore malformed event payloads
      }
    };

    const onMessage = async () => {
      await refreshMessages();
    };

    source.addEventListener("status_updated", onStatus);
    source.addEventListener("new_message", onMessage);

    return () => {
      isMounted = false;
      source.removeEventListener("status_updated", onStatus);
      source.removeEventListener("new_message", onMessage);
      source.close();
    };
  }, [refreshMessages, report.id]);

  async function handleStatusUpdate() {
    if (selectedStatus === report.status) {
      return;
    }

    setStatusLoading(true);
    setStatusMessage(null);
    try {
      const response = await fetch("/api/reports/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: report.id, status: selectedStatus }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        setStatusMessage(json?.error?.message ?? "Gagal memperbarui status laporan.");
        return;
      }
      setReport((prev) => ({
        ...prev,
        status: selectedStatus,
        updatedAt: json.data.updated_at,
      }));
      setStatusMessage("Status laporan berhasil diperbarui.");
    } catch {
      setStatusMessage("Tidak dapat terhubung ke server. Silakan coba lagi.");
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleRunTriage() {
    setTriageLoading(true);
    try {
      const response = await fetch(`/api/reports/${report.id}/triage`, {
        method: "POST",
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        setStatusMessage(json?.error?.message ?? "Triase AI gagal dijalankan.");
        return;
      }
      const result = json.data.triage;
      setTriageData(result);
      setReport((prev) => ({
        ...prev,
        aiSeverity: result.severity,
        aiConfidence: result.confidence,
        aiRiskSummary: result.risk_summary,
        aiActionPlan: result.action_plans,
        aiDraftResponse: result.draft_response,
        updatedAt: json.data.updated_at,
      }));
      setStatusMessage("Rekomendasi AI berhasil disimpan sebagai referensi TPPK.");
    } catch {
      setStatusMessage("Triase AI belum tersedia. Silakan coba kembali nanti.");
    } finally {
      setTriageLoading(false);
    }
  }

  async function handleSendChat() {
    const message = chatDraft.trim();
    if (!message) {
      setChatError("Pesan wajib diisi sebelum dikirim.");
      return;
    }

    setChatSending(true);
    setChatError(null);
    try {
      const response = await fetch("/api/chat/counselor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: report.id, message }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        setChatError(json?.error?.message ?? "Gagal mengirim pesan ke pelapor.");
        return;
      }
      setChatDraft("");
      await refreshMessages();
    } catch {
      setChatError("Tidak dapat mengirim pesan saat ini. Silakan coba lagi.");
    } finally {
      setChatSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm font-medium text-sky-700 hover:text-sky-800">← Kembali ke dashboard</Link>
          </div>
          <div className="text-sm text-slate-500">Pengguna: {username}</div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Laporan</p>
              <h1 className="mt-2 text-3xl font-extrabold text-slate-900">{report.schoolName}</h1>
              <p className="mt-1 text-sm text-slate-500">{report.city}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {formatStatusBadge(report.status)}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900">Detail Laporan</h2>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Kategori</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">{report.category}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Lokasi</dt>
                  <dd className="mt-1 text-sm text-slate-900">{report.incidentLocation}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Waktu Kejadian</dt>
                  <dd className="mt-1 text-sm text-slate-900">{report.incidentTime ?? "Belum tercatat"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Dibuat</dt>
                  <dd className="mt-1 text-sm text-slate-900">{formatDate(report.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Diperbarui</dt>
                  <dd className="mt-1 text-sm text-slate-900">{formatDate(report.updatedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Evidence URL</dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {report.evidenceUrl ? (
                      <a href={report.evidenceUrl} target="_blank" rel="noreferrer" className="text-sky-700 underline">Buka bukti</a>
                    ) : (
                      <span className="text-slate-500">Tidak tersedia</span>
                    )}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Deskripsi</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-800">{report.description}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">AI Triage</h2>
                <Button type="button" variant="primary" size="sm" onClick={handleRunTriage} disabled={triageLoading}>
                  {triageLoading ? "Menganalisis..." : "Jalankan AI Triage"}
                </Button>
              </div>

              <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                AI memberikan rekomendasi pendukung. Keputusan akhir tetap berada pada TPPK/BK dan harus diverifikasi secara manusia.
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Severity</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{severityLabel}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Confidence</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{(report.aiConfidence ?? triageData?.confidence ?? 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Risk Summary</p>
                  <p className="mt-2 text-sm leading-7 text-slate-800">{triageData?.risk_summary ?? report.aiRiskSummary ?? "Triase AI belum tersedia untuk laporan ini."}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Action Plans</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-800">
                    {(triageData?.action_plans ?? report.aiActionPlan ?? []).map((plan) => (
                      <li key={`${plan.priority}-${plan.action}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="font-semibold">Prioritas {plan.priority}</div>
                        <div>{plan.action}</div>
                        <div className="mt-1 text-slate-600">{plan.reason}</div>
                      </li>
                    ))}
                    {!(triageData?.action_plans ?? report.aiActionPlan ?? []).length && (
                      <li className="text-slate-500">Belum ada rekomendasi tindak lanjut.</li>
                    )}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Draft Response</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-800">{triageData?.draft_response ?? report.aiDraftResponse ?? "Belum ada draf respon yang dihasilkan."}</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900">Ubah Status</h2>
              <div className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Status laporan
                  <select
                    value={selectedStatus}
                    onChange={(event) => setSelectedStatus(event.target.value as DetailReport["status"])}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                    aria-label="Ubah status laporan"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>

                <Button type="button" variant="primary" onClick={handleStatusUpdate} disabled={statusLoading} className="w-full justify-center">
                  {statusLoading ? "Memperbarui..." : "Simpan Status"}
                </Button>

                {statusMessage && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{statusMessage}</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900">Chat Pelapor</h2>

              <div className="mt-4 max-h-[380px] space-y-3 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
                {chatMessages.length === 0 && <p className="text-sm text-slate-500">Belum ada pesan untuk laporan ini.</p>}
                {chatMessages.map((message) => {
                  const isCounselor = message.sender_role === "COUNSELOR";
                  return (
                    <div key={message.id} className={`flex ${isCounselor ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${isCounselor ? "bg-sky-700 text-white" : "bg-white text-slate-800 border border-slate-200"}`}>
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] opacity-75">
                          {isCounselor ? "BK / TPPK" : "Pelapor"}
                        </div>
                        <p className="whitespace-pre-wrap">{message.message}</p>
                        <div className={`mt-1 text-[10px] ${isCounselor ? "text-sky-100" : "text-slate-500"}`}>
                          {formatDate(message.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 space-y-3">
                <textarea
                  value={chatDraft}
                  onChange={(event) => setChatDraft(event.target.value)}
                  className="min-h-[100px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                  placeholder="Tulis balasan untuk pelapor..."
                  aria-label="Balasan chat untuk pelapor"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">Maksimal 2000 karakter</span>
                  <Button type="button" variant="primary" size="sm" onClick={handleSendChat} disabled={chatSending}>
                    {chatSending ? "Mengirim..." : "Kirim Pesan"}
                  </Button>
                </div>
                {chatError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{chatError}</div>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
