"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, LockIcon, ArrowRightIcon } from "@/components/ui/icons";

interface ReportSuccessProps {
  token: string;
  reportId: string;
  category: string;
  schoolId: string;
  onReset?: () => void;
}

export function ReportSuccess({
  token,
  category,
  onReset,
}: ReportSuccessProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(token);
        setCopied(true);
        setCopyError(false);
        setTimeout(() => setCopied(false), 3000);
      } else {
        throw new Error("Clipboard API unavailable");
      }
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 4000);
    }
  };

  return (
    <div className="flex flex-col items-center text-center p-6 sm:p-10 rounded-2xl border border-slate-200 bg-white shadow-xs">
      {/* Success Icon */}
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mb-5">
        <CheckCircleIcon className="h-8 w-8" />
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
        Laporan Berhasil Terkirim
      </h2>
      <p className="text-sm sm:text-base text-slate-600 max-w-md mb-8 leading-relaxed">
        Laporan kategori <span className="font-semibold text-slate-800">{category}</span> telah
        diterima oleh sistem. Simpan kode tiket di bawah ini untuk memantau proses penanganan.
      </p>

      {/* Secret Token Display Box */}
      <div className="w-full max-w-md rounded-xl border-2 border-dashed border-sky-300 bg-sky-50/70 p-5 sm:p-6 mb-4">
        <span className="block text-xs font-semibold text-sky-800 uppercase tracking-wider mb-2">
          Kode Tiket Pelacakan Anda
        </span>
        <div className="font-mono text-2xl sm:text-3xl font-bold tracking-widest text-slate-900 select-all py-1">
          {token}
        </div>
      </div>

      {/* Copy Feedback */}
      <div className="h-6 mb-6">
        {copied && (
          <span className="text-xs font-semibold text-emerald-700 animate-in fade-in duration-150">
            ✓ Kode tiket berhasil disalin ke clipboard!
          </span>
        )}
        {copyError && (
          <span className="text-xs text-amber-700">
            Penyalinan otomatis gagal. Silakan salin kode secara manual.
          </span>
        )}
      </div>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md mb-8">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleCopy}
          className="w-full sm:w-1/2 justify-center"
        >
          {copied ? "Tersalin!" : "Salin Kode Tiket"}
        </Button>
        <Button
          href={`/lacak?token=${encodeURIComponent(token)}`}
          variant="primary"
          size="lg"
          className="w-full sm:w-1/2 justify-center"
        >
          <span>Lacak Laporan</span>
          <ArrowRightIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* Reassurance Notice */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200 text-left max-w-md mb-6">
        <LockIcon className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-800">Penting:</strong> Kode tiket ini adalah satu-satunya
          kunci untuk melihat perkembangan laporan dan berkomunikasi dengan tim sekolah. Jangan
          bagikan kode ini kepada pihak yang tidak berwenang.
        </p>
      </div>

      {/* Secondary Reset / Home link */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <Link
          href="/"
          className="hover:text-slate-900 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-xs"
        >
          Kembali ke Beranda
        </Link>
        {onReset && (
          <>
            <span>•</span>
            <button
              type="button"
              onClick={onReset}
              className="hover:text-slate-900 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-xs"
            >
              Buat Laporan Lain
            </button>
          </>
        )}
      </div>
    </div>
  );
}
