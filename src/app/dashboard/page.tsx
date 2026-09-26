import { redirect } from "next/navigation";
import { getSessionFromCookie } from "@/lib/auth/session";

export default async function DashboardPage() {
  const session = await getSessionFromCookie();
  if (!session) {
    redirect("/dashboard/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">TPPK / BK</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900">Dashboard Sekolah</h1>
        <p className="mt-3 text-sm text-slate-600">
          Selamat datang, {session.username}. Fitur dashboard lanjutan akan dibangun pada Phase 5B.
        </p>
      </div>
    </main>
  );
}
