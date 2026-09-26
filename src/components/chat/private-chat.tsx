"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  SendIcon,
  UserIcon,
  ShieldIcon,
  RefreshCwIcon,
  MessageSquareIcon,
} from "@/components/ui/icons";

export interface ChatMessage {
  id: string;
  sender_role: "STUDENT" | "COUNSELOR";
  message: string;
  created_at: string;
}

interface PrivateChatProps {
  token: string;
  sseRefreshTrigger?: number; // increments when SSE new_message arrives
}

export function PrivateChat({ token, sseRefreshTrigger = 0 }: PrivateChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  // Auto scroll to bottom of chat when new messages arrive
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }
  }, []);

  // Format message timestamp
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return isoString;
    }
  };

  // 1. Fetch Chat Messages (Source of Truth)
  const fetchMessages = useCallback(
    async (isManualRefresh = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (isManualRefresh) {
        setIsRefreshing(true);
      }
      setLoadError(null);

      try {
        const res = await fetch(`/api/chat?token=${encodeURIComponent(token)}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (res.status === 200) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data?.messages)) {
            // Deduplicate messages by ID
            const incoming: ChatMessage[] = json.data.messages;
            setMessages((prev) => {
              const map = new Map<string, ChatMessage>();
              prev.forEach((m) => map.set(m.id, m));
              incoming.forEach((m) => map.set(m.id, m));
              return Array.from(map.values()).sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            });
          }
        } else if (res.status === 429) {
          setLoadError("Terlalu banyak permintaan pesan. Silakan tunggu sebentar.");
        } else if (res.status === 404) {
          setLoadError("Laporan tidak ditemukan. Periksa kembali kode tiket kamu.");
        } else {
          setLoadError("Gagal memuat percakapan. Silakan segarkan beberapa saat lagi.");
        }
      } catch {
        setLoadError("Gagal terhubung ke server percakapan. Periksa koneksi internet kamu.");
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token]
  );

  // Initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchMessages(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchMessages]);

  // Refetch when SSE new_message triggers
  useEffect(() => {
    if (sseRefreshTrigger > 0) {
      const timer = setTimeout(() => {
        void fetchMessages(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [sseRefreshTrigger, fetchMessages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(true);
    }
  }, [messages.length, scrollToBottom]);

  // 2. Send Message Handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const trimmed = draft.trim();

    if (!trimmed) {
      setSendError("Pesan tidak boleh kosong.");
      return;
    }

    if (trimmed.length > 2000) {
      setSendError("Pesan melebihi batas maksimal 2000 karakter.");
      return;
    }

    if (isSending) return;

    setIsSending(true);
    setSendError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          token,
          message: trimmed,
        }),
      });

      if (res.status === 201) {
        const json = await res.json();
        // Clear draft on success
        setDraft("");

        // If returned message object is available, append optimistically with deduplication
        if (json.success && json.data) {
          const sentMessage: ChatMessage = {
            id: json.data.id,
            sender_role: json.data.sender_role,
            message: json.data.message,
            created_at: json.data.created_at,
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === sentMessage.id)) return prev;
            return [...prev, sentMessage];
          });
        }

        // Re-fetch to ensure complete synchronization with database
        fetchMessages(false);
      } else if (res.status === 429) {
        setSendError("Terlalu banyak percobaan. Tunggu sebentar sebelum mengirim lagi.");
      } else if (res.status === 400) {
        setSendError("Format pesan tidak valid atau melebihi 2000 karakter.");
      } else if (res.status === 404) {
        setSendError("Laporan tidak ditemukan. Periksa kembali kode tiket kamu.");
      } else {
        setSendError("Pesan belum dapat dikirim. Silakan coba lagi.");
      }
    } catch {
      // Retain draft on network error so student does not lose their typed explanation
      setSendError("Gagal mengirim pesan karena gangguan koneksi. Draft pesan kamu tetap tersimpan.");
    } finally {
      setIsSending(false);
    }
  };

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const characterCount = draft.length;
  const isOverLimit = characterCount > 2000;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
            <MessageSquareIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Percakapan Privat dengan BK / TPPK</span>
            </h3>
            <p className="text-xs text-slate-500">
              Sampaikan informasi tambahan atau ajukan pertanyaan secara aman dan terlindungi.
            </p>
          </div>
        </div>

        {/* Manual Refresh Button */}
        <div className="shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fetchMessages(true)}
            disabled={isRefreshing || isLoading}
            className="text-xs text-slate-600 hover:text-slate-900"
            aria-label="Segarkan pesan chat"
          >
            <RefreshCwIcon className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Segarkan Chat</span>
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {loadError && (
        <div
          role="alert"
          className="mt-4 p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start gap-2.5"
        >
          <span className="font-bold shrink-0">!</span>
          <p>{loadError}</p>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="my-6">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <RefreshCwIcon className="h-5 w-5 animate-spin mx-auto text-sky-700" />
            <p>Memuat riwayat percakapan...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-xl bg-slate-50/80 border border-dashed border-slate-200 space-y-2">
            <p className="text-sm font-semibold text-slate-700">Belum ada pesan</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Ruang ini adalah saluran komunikasi rahasia antara kamu dan Guru BK/TPPK. Kamu dapat
              mengirim pesan jika ingin memberikan informasi atau bukti tambahan.
            </p>
          </div>
        ) : (
          <ul
            role="log"
            aria-live="polite"
            aria-label="Daftar pesan percakapan"
            className="space-y-4 max-h-96 overflow-y-auto pr-1"
          >
            {messages.map((item) => {
              const isStudent = item.sender_role === "STUDENT";

              return (
                <li
                  key={item.id}
                  className={`flex flex-col ${isStudent ? "items-end" : "items-start"}`}
                >
                  {/* Sender Header Badge */}
                  <div
                    className={`flex items-center gap-1.5 text-[11px] font-semibold mb-1 text-slate-500 ${
                      isStudent ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {isStudent ? (
                      <>
                        <UserIcon className="h-3 w-3 text-sky-600" />
                        <span>Saya / Pelapor</span>
                      </>
                    ) : (
                      <>
                        <ShieldIcon className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-800 font-bold">Tim BK / TPPK</span>
                      </>
                    )}
                    <span className="text-slate-300">•</span>
                    <time
                      dateTime={item.created_at}
                      className="text-[10px] text-slate-400 font-normal"
                    >
                      {formatTime(item.created_at)}
                    </time>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isStudent
                        ? "bg-sky-700 text-white rounded-tr-xs"
                        : "bg-slate-100 text-slate-900 border border-slate-200/80 rounded-tl-xs"
                    }`}
                  >
                    {item.message}
                  </div>
                </li>
              );
            })}
            <div ref={messagesEndRef} aria-hidden="true" />
          </ul>
        )}
      </div>

      {/* Send Message Form */}
      <form onSubmit={handleSendMessage} noValidate className="space-y-3 pt-4 border-t border-slate-100">
        {sendError && (
          <div
            role="alert"
            className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start gap-2"
          >
            <span className="font-bold shrink-0">!</span>
            <p>{sendError}</p>
          </div>
        )}

        <div>
          <label
            htmlFor="chat-message-input"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
          >
            Kirim Pesan Tambahan
          </label>
          <textarea
            id="chat-message-input"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tulis informasi tambahan, klarifikasi, atau pertanyaan untuk Guru BK / TPPK..."
            maxLength={2000}
            disabled={isSending}
            aria-describedby="chat-counter chat-hint"
            className={`w-full rounded-xl border p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 transition-colors resize-y min-h-[80px] ${
              isOverLimit ? "border-rose-400 focus-visible:ring-rose-600" : "border-slate-300 bg-white"
            }`}
          />
        </div>

        {/* Action Row & Character Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div id="chat-hint" className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>Gunakan Ctrl+Enter untuk mengirim cepat.</span>
            <span>•</span>
            <span
              id="chat-counter"
              className={`font-mono font-medium ${
                isOverLimit ? "text-rose-600 font-bold" : characterCount > 1800 ? "text-amber-600" : "text-slate-500"
              }`}
            >
              {characterCount} / 2000
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSending || draft.trim().length === 0 || isOverLimit}
            className="w-full sm:w-auto justify-center"
            aria-label="Kirim pesan ke BK / TPPK"
          >
            {isSending ? (
              <>
                <RefreshCwIcon className="h-3.5 w-3.5 animate-spin" />
                <span>Mengirim...</span>
              </>
            ) : (
              <>
                <SendIcon className="h-3.5 w-3.5" />
                <span>Kirim Pesan</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
