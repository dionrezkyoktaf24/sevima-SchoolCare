"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function TppkLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        setError(json?.error?.message ?? "Email atau password tidak valid.");
        return;
      }

      router.push("/dashboard");
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
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Masuk TPPK</h1>
          <p className="mt-2 text-sm text-slate-600">
            Akses ruang kerja internal untuk penanganan laporan sekolah.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-label="Form login TPPK">
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-slate-700">
              Username / Email
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              placeholder="username atau email"
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              placeholder="Masukkan password"
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>

          {error && (
            <div id="login-error" role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="md" className="w-full justify-center" disabled={isSubmitting}>
            {isSubmitting ? "Memeriksa kredensial..." : "Masuk ke Dashboard"}
          </Button>
        </form>
      </div>
    </main>
  );
}
