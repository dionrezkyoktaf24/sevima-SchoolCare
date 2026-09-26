"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function TppkRegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, confirmPassword }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        setError(json?.error?.message ?? "Registrasi gagal.");
        return;
      }

      router.push("/dashboard/login");
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server. Silakan coba beberapa saat lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-700 text-white shadow-xs">
            <span aria-hidden="true" className="text-xl font-bold">S</span>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">SchoolCare</p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Daftar Guru / TPPK</h1>
          <p className="mt-2 text-sm text-slate-600">
            Buat akun internal default untuk login TPPK bila ingin mengganti kredensial demo.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-label="Form registrasi TPPK">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            Default demo tetap aktif jika belum ada akun custom: <span className="font-semibold">admin</span> / <span className="font-semibold">schoolcare-2026</span>
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-slate-700">
              Nama Sekolah
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              placeholder="Masukkan Nama Sekolah"
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "register-error" : undefined}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              placeholder="Masukkan password"
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "register-error" : undefined}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
              Konfirmasi Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              placeholder="Ulangi password"
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "register-error" : undefined}
            />
          </div>

          {error && (
            <div id="register-error" role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="md" className="w-full justify-center" disabled={isSubmitting}>
            {isSubmitting ? "Membuat akun..." : "Daftar Akun"}
          </Button>

          <p className="text-center text-sm text-slate-600">
            Sudah punya akun?{" "}
            <button
              type="button"
              onClick={() => router.push("/dashboard/login")}
              className="font-semibold text-sky-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-sm"
            >
              Masuk
            </button>
          </p>
        </form>
      </div>
    </main>
  );
}
