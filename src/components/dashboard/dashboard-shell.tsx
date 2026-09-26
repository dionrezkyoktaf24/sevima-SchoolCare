"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type DashboardReportRow = {
  id: string;
  status: "RECEIVED" | "UNDER_REVIEW" | "ACTION_TAKEN" | "RESOLVED";
  category: string;
  aiSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  incidentLocation: string;
  incidentTime: string | null;
  description: string;
  schoolName: string;
  city: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

interface DashboardShellProps {
  username: string;
  reports: DashboardReportRow[];
}

const statusLabels: Record<DashboardReportRow["status"], string> = {
  RECEIVED: "Diterima",
  UNDER_REVIEW: "Ditinjau",
  ACTION_TAKEN: "Tindakan",
  RESOLVED: "Selesai",
};

const severityLabels: Record<DashboardReportRow["aiSeverity"], string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
  CRITICAL: "Kritis",
};

function getStatusBadge(status: DashboardReportRow["status"]) {
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

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

export function DashboardShell({ username, reports }: DashboardShellProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const categories = ["ALL", ...new Set(reports.map((report) => report.category))];

  const filteredReports = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesQuery =
        normalized.length === 0 ||
        report.schoolName.toLowerCase().includes(normalized) ||
        report.category.toLowerCase().includes(normalized) ||
        report.incidentLocation.toLowerCase().includes(normalized) ||
        report.description.toLowerCase().includes(normalized) ||
        report.id.toLowerCase().includes(normalized);

      const matchesStatus = statusFilter === "ALL" || report.status === statusFilter;
      const matchesSeverity = severityFilter === "ALL" || report.aiSeverity === severityFilter;
      const matchesCategory = categoryFilter === "ALL" || report.category === categoryFilter;

      return matchesQuery && matchesStatus && matchesSeverity && matchesCategory;
    });
  }, [query, statusFilter, severityFilter, categoryFilter, reports]);

  const totals = {
    total: reports.length,
    received: reports.filter((report) => report.status === "RECEIVED").length,
    underReview: reports.filter((report) => report.status === "UNDER_REVIEW").length,
    actionTaken: reports.filter((report) => report.status === "ACTION_TAKEN").length,
    resolved: reports.filter((report) => report.status === "RESOLVED").length,
  };

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/dashboard/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">SchoolCare</p>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Dashboard TPPK</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="font-medium">Pengguna:</span> {username}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
                Keluar
              </Button>
            </div>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Total Laporan", value: totals.total, tone: "slate" },
            { label: "Diterima", value: totals.received, tone: "slate" },
            { label: "Sedang Ditinjau", value: totals.underReview, tone: "brand" },
            { label: "Tindakan", value: totals.actionTaken, tone: "amber" },
            { label: "Selesai", value: totals.resolved, tone: "emerald" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-600">{card.label}</p>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">LIVE</span>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-slate-900">{card.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-bold text-slate-900">Daftar Laporan</h2>
            <div className="text-sm text-slate-500">{filteredReports.length} hasil</div>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="block text-sm font-medium text-slate-700">
              Cari
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                placeholder="Kelola kata kunci..."
                aria-label="Cari laporan"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                aria-label="Filter status laporan"
              >
                <option value="ALL">Semua</option>
                <option value="RECEIVED">Diterima</option>
                <option value="UNDER_REVIEW">Ditinjau</option>
                <option value="ACTION_TAKEN">Tindakan</option>
                <option value="RESOLVED">Selesai</option>
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Severity
              <select
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                aria-label="Filter severity laporan"
              >
                <option value="ALL">Semua</option>
                <option value="LOW">Rendah</option>
                <option value="MEDIUM">Sedang</option>
                <option value="HIGH">Tinggi</option>
                <option value="CRITICAL">Kritis</option>
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Kategori
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                aria-label="Filter kategori laporan"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "ALL" ? "Semua" : category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="hidden grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr_0.8fr_0.7fr_0.7fr] gap-3 bg-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 md:grid">
              <span>Sekolah</span>
              <span>Kategori</span>
              <span>Severity</span>
              <span>Status</span>
              <span>Update</span>
              <span>Pesan</span>
              <span>Aksi</span>
            </div>

            <div className="divide-y divide-slate-200 bg-white">
              {filteredReports.length === 0 && (
                <div className="p-6 text-sm text-slate-500">Tidak ada laporan yang sesuai filter saat ini.</div>
              )}

              {filteredReports.map((report) => (
                <div key={report.id} className="grid gap-3 p-4 md:grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr_0.8fr_0.7fr_0.7fr] md:items-center">
                  <div>
                    <p className="font-semibold text-slate-900">{report.schoolName}</p>
                    <p className="text-xs text-slate-500">{report.city}</p>
                    <p className="mt-1 text-xs text-slate-500">{report.incidentLocation}</p>
                  </div>

                  <div className="text-sm text-slate-700">{report.category}</div>

                  <div>
                    <Badge variant={
                      report.aiSeverity === "CRITICAL"
                        ? "amber"
                        : report.aiSeverity === "HIGH"
                          ? "amber"
                          : report.aiSeverity === "MEDIUM"
                            ? "brand"
                            : "slate"
                    }>{severityLabels[report.aiSeverity]}</Badge>
                  </div>

                  <div>{getStatusBadge(report.status)}</div>

                  <div className="text-sm text-slate-600">{formatDate(report.updatedAt)}</div>

                  <div className="text-sm text-slate-600">{report.messageCount}</div>

                  <div>
                    <Link
                      href={`/dashboard/reports/${report.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800 transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                    >
                      Lihat
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
