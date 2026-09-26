import React, { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/ui/container";
import { TrackingContainer } from "@/components/tracking/tracking-container";

export const metadata: Metadata = {
  title: "Lacak Status Laporan — SchoolCare",
  description:
    "Pantau perkembangan dan tindak lanjut laporan kejadian di sekolah secara transparan menggunakan kode tiket rahasia.",
};

export default function LacakPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <Header />
      <main id="main-content" className="flex-1 py-8 sm:py-12 md:py-16">
        <Container size="narrow">
          <Suspense
            fallback={
              <div className="p-8 sm:p-12 text-center text-sm text-slate-500 rounded-2xl border border-slate-200 bg-white shadow-xs">
                Memuat pelacakan laporan...
              </div>
            }
          >
            <TrackingContainer />
          </Suspense>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
