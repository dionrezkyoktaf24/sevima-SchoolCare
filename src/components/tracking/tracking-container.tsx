"use client";

import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { TrackingForm } from "./tracking-form";
import { TrackingResult, type TrackedReportData } from "./tracking-result";
import { RefreshCwIcon } from "@/components/ui/icons";
import { useRealtimeTracking } from "@/hooks/use-realtime-tracking";

const TOKEN_REGEX = /^CARE-[0-9A-F]{4}-[0-9A-F]{4}$/i;

function subscribeToStorage(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSavedTokenSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const localToken =
      localStorage.getItem("schoolcare_tracking_token") ||
      localStorage.getItem("schoolcare_last_token");
    if (localToken) {
      const cleanToken = localToken.trim().toUpperCase();
      if (TOKEN_REGEX.test(cleanToken)) {
        return cleanToken;
      }
    }
  } catch {
    // Ignore error in restricted browser environments
  }
  return null;
}

function getSavedTokenServerSnapshot(): string | null {
  return null;
}

export function TrackingContainer() {
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token")?.trim().toUpperCase() || "";

  const savedToken = useSyncExternalStore(
    subscribeToStorage,
    getSavedTokenSnapshot,
    getSavedTokenServerSnapshot
  );

  const [tokenInput, setTokenInput] = useState(urlToken);
  const [currentTrackedToken, setCurrentTrackedToken] = useState<string | null>(null);
  const [report, setReport] = useState<TrackedReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (urlToken && !TOKEN_REGEX.test(urlToken)) {
      return "Format kode tiket tidak valid. Periksa kembali kode yang kamu masukkan.";
    }
    return null;
  });
  const [sseChatTrigger, setSseChatTrigger] = useState(0);

  // Prevent multiple concurrent fetches
  const fetchingRef = useRef(false);
  // Keep track of the initial mount URL check so it only runs once
  const initialCheckDone = useRef(false);

  // 1. Fetch Report Function
  const fetchReport = useCallback(
    async (rawToken: string, isRefresh = false) => {
      if (fetchingRef.current) return;

      const trimmedToken = rawToken.trim().toUpperCase();

      if (!trimmedToken) {
        setError("Masukkan kode tiket laporan terlebih dahulu.");
        return;
      }

      if (!TOKEN_REGEX.test(trimmedToken)) {
        setError(
          "Format kode tiket tidak valid. Periksa kembali kode yang kamu masukkan."
        );
        return;
      }

      fetchingRef.current = true;
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      try {
        const response = await fetch(
          `/api/reports/track?token=${encodeURIComponent(trimmedToken)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (response.status === 200) {
          const data = await response.json();
          if (data && data.success && data.data) {
            setReport(data.data as TrackedReportData);
            setCurrentTrackedToken(trimmedToken);
            setTokenInput(trimmedToken);
            setError(null);

            // Save to localStorage for convenience
            try {
              localStorage.setItem("schoolcare_tracking_token", trimmedToken);
              localStorage.setItem("schoolcare_last_token", trimmedToken);
              window.dispatchEvent(new Event("storage"));
            } catch {
              // Ignore localStorage failure in restricted/private browsing modes
            }

            // Update browser URL query param cleanly without reloading
            if (typeof window !== "undefined") {
              const url = new URL(window.location.href);
              url.searchParams.set("token", trimmedToken);
              window.history.replaceState({ path: url.pathname + url.search }, "", url.toString());
            }
          } else {
            setError("Laporan tidak ditemukan. Periksa kembali kode tiket yang kamu masukkan.");
          }
        } else if (response.status === 404) {
          setError("Laporan tidak ditemukan. Periksa kembali kode tiket yang kamu masukkan.");
          if (isRefresh) {
            setReport(null);
          }
        } else if (response.status === 429) {
          setError("Terlalu banyak percobaan. Silakan tunggu beberapa saat sebelum mencoba lagi.");
        } else if (response.status === 400) {
          setError("Format kode tiket tidak valid. Periksa kembali kode yang kamu masukkan.");
        } else {
          // 500 or any other server error status: safe user-facing message
          setError("Terjadi kendala pada sistem. Silakan coba beberapa saat lagi.");
        }
      } catch {
        // Network failures / fetch connection errors
        setError("Gagal terhubung ke server. Periksa koneksi internet kamu.");
      } finally {
        fetchingRef.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // 2. Initial Mount Check: Auto-fetch if token query param present
  useEffect(() => {
    if (initialCheckDone.current) return;
    initialCheckDone.current = true;

    // Check URL parameter
    if (urlToken && TOKEN_REGEX.test(urlToken)) {
      const timer = setTimeout(() => {
        void fetchReport(urlToken);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [urlToken, fetchReport]);

  // 3. Form Submit Handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport(tokenInput);
  };

  // 4. Quick-fill Saved Token Handler
  const handleUseSavedToken = (token: string) => {
    setTokenInput(token);
    fetchReport(token);
  };

  // 5. Refresh Status Handler
  const handleRefresh = useCallback(() => {
    if (currentTrackedToken) {
      fetchReport(currentTrackedToken, true);
    }
  }, [currentTrackedToken, fetchReport]);

  // 6. Realtime SSE Event Listeners
  const handleStatusUpdated = useCallback(() => {
    // Re-fetch report using GET /api/reports/track (Source of Truth)
    if (currentTrackedToken) {
      void fetchReport(currentTrackedToken, true);
    }
  }, [currentTrackedToken, fetchReport]);

  const handleNewMessage = useCallback(() => {
    // Notify PrivateChat component to re-fetch messages
    setSseChatTrigger((prev) => prev + 1);
  }, []);

  const { connectionStatus } = useRealtimeTracking({
    token: currentTrackedToken,
    onStatusUpdated: handleStatusUpdated,
    onNewMessage: handleNewMessage,
  });

  // 7. Reset / Track Another Report Handler
  const handleReset = () => {
    setReport(null);
    setCurrentTrackedToken(null);
    setError(null);
    setTokenInput("");
    setSseChatTrigger(0);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      window.history.replaceState({ path: url.pathname }, "", url.pathname);
    }
  };

  // Loading skeleton state during initial query/submit lookup
  if (isLoading && !report) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xs text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-sky-50 text-sky-700 animate-spin">
          <RefreshCwIcon className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">Memuat Laporan...</h2>
          <p className="text-xs text-slate-500">
            Sedang mengambil perkembangan status dari sistem keamanan sekolah.
          </p>
        </div>
      </div>
    );
  }

  // Active Report Result Display
  if (report && currentTrackedToken) {
    return (
      <TrackingResult
        report={report}
        token={currentTrackedToken}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onReset={handleReset}
        connectionStatus={connectionStatus}
        sseChatTrigger={sseChatTrigger}
      />
    );
  }

  // Token Input Form Display
  return (
    <TrackingForm
      tokenInput={tokenInput}
      setTokenInput={setTokenInput}
      onSubmit={handleFormSubmit}
      isLoading={isLoading}
      error={error}
      savedToken={savedToken}
      onUseSavedToken={handleUseSavedToken}
    />
  );
}
