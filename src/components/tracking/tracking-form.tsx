"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LockIcon, SearchIcon } from "@/components/ui/icons";

interface TrackingFormProps {
  tokenInput: string;
  setTokenInput: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string | null;
  savedToken: string | null;
  onUseSavedToken: (token: string) => void;
}

export function TrackingForm({
  tokenInput,
  setTokenInput,
  onSubmit,
  isLoading,
  error,
  savedToken,
  onUseSavedToken,
}: TrackingFormProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Automatically uppercase and trim leading whitespace
    const val = e.target.value.toUpperCase();
    setTokenInput(val);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-slate-100">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-xs"
        >
          <span>← Kembali ke Beranda</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
          Lacak Perkembangan Laporan
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Gunakan kode tiket rahasia yang kamu peroleh saat mengirim laporan untuk melihat status
          penanganan secara langsung.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          id="token-error"
          role="alert"
          className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm flex items-start gap-3"
        >
          <span className="font-bold shrink-0">!</span>
          <p>{error}</p>
        </div>
      )}

      {/* Saved Token Quick-Fill Option */}
      {savedToken && tokenInput !== savedToken && (
        <div className="mb-6 p-4 rounded-xl border border-sky-200 bg-sky-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-sky-950">
          <div>
            <span className="font-semibold block mb-0.5">Ditemukan kode tiket tersimpan di peramban ini:</span>
            <span className="font-mono font-bold text-sky-900">{savedToken}</span>
          </div>
          <button
            type="button"
            onClick={() => onUseSavedToken(savedToken)}
            className="px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-medium text-xs transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            Gunakan Kode Ini
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <div>
          <label htmlFor="token-input" className="block text-sm font-semibold text-slate-900 mb-1.5">
            Kode Tiket Laporan <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <input
              id="token-input"
              type="text"
              value={tokenInput}
              onChange={handleInputChange}
              maxLength={20}
              placeholder="CARE-XXXX-XXXX"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck="false"
              aria-invalid={!!error}
              aria-describedby={error ? "token-error token-hint" : "token-hint"}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base sm:text-lg font-mono font-semibold tracking-wider text-slate-900 placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:border-sky-600 transition-colors uppercase"
            />
          </div>
          <p id="token-hint" className="mt-1.5 text-xs text-slate-500">
            Format: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">CARE-XXXX-XXXX</code> (contoh: CARE-8F2A-99BC)
          </p>
        </div>

        {/* Reassurance Notice */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
          <LockIcon className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>
            Kode tiket berfungsi sebagai kredensial pelacakan rahasia Anda. Anda tidak perlu memasukkan
            kata sandi atau data pribadi untuk melihat perkembangan laporan.
          </p>
        </div>

        {/* Submit Button */}
        <div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isLoading}
            className="w-full justify-center text-base"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Memuat Status Laporan...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <SearchIcon className="h-4 w-4" />
                <span>Lacak Laporan</span>
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
