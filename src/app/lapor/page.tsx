import React, { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/ui/container";
import { ReportForm } from "@/components/report/report-form";

export const metadata: Metadata = {
  title: "Buat Laporan Baru — SchoolCare",
  description:
    "Sampaikan laporan kejadian perundungan atau kekerasan di sekolah dengan aman, rahasia, dan tanpa perlu registrasi akun.",
};

interface LaporPageProps {
  searchParams: Promise<{ school_id?: string }>;
}

async function ReportFormWrapper({
  searchParams,
}: {
  searchParams: Promise<{ school_id?: string }>;
}) {
  const resolvedParams = await searchParams;
  const initialSchoolId = resolvedParams.school_id || "SMK-TELKOM-SBY";

  return <ReportForm initialSchoolId={initialSchoolId} />;
}

export default function LaporPage({ searchParams }: LaporPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <Header />
      <main id="main-content" className="flex-1 py-8 sm:py-12 md:py-16">
        <Container size="narrow">
          <Suspense
            fallback={
              <div className="p-12 text-center text-sm text-slate-500 rounded-2xl border border-slate-200 bg-white">
                Memuat formulir laporan...
              </div>
            }
          >
            <ReportFormWrapper searchParams={searchParams} />
          </Suspense>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
