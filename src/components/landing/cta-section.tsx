import React from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icons";

export function CtaSection() {
  return (
    <section className="py-16 md:py-20 border-t border-slate-200 bg-sky-50/50">
      <Container size="narrow">
        <div className="flex flex-col items-center text-center p-8 sm:p-12 rounded-2xl border border-sky-100 bg-white shadow-xs">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-3">
            Ada sesuatu yang perlu disampaikan?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg mb-8">
            Kamu tidak harus menyelesaikannya sendirian. Sekolah adalah tempat yang
            seharusnya aman dan saling mendukung bagi setiap siswa.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Button
              href="/lapor"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto justify-center"
            >
              <span>Buat Laporan</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Button>
            <Button
              href="/lacak"
              variant="outline"
              size="lg"
              className="w-full sm:w-auto justify-center"
            >
              <span>Lacak Laporan</span>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
