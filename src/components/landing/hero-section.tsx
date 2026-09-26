import React from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon, LockIcon, ShieldIcon } from "@/components/ui/icons";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 bg-gradient-to-b from-sky-50/60 via-white to-white">
      <Container size="default">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Eyebrow Badge */}
          <div className="mb-6">
            <Badge variant="brand" className="shadow-2xs">
              <ShieldIcon className="w-3.5 h-3.5 text-sky-700" />
              <span>Ruang Aman & Bebas Perundungan Sekolah</span>
            </Badge>
          </div>

          {/* Main Hero Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-6">
            Laporkan dengan aman.
            <br />
            <span className="text-sky-700">Didengar dengan serius.</span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-2xl">
            Ruang aman untuk menyampaikan kejadian kekerasan atau perundungan di
            lingkungan sekolah dan membantu tim sekolah menindaklanjutinya dengan
            tepat dan bertanggung jawab.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mb-6">
            <Button
              href="/lapor"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto justify-center shadow-sm"
            >
              <span>Mulai Buat Laporan</span>
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

          {/* Realistic Reassurance Note */}
          <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
            <LockIcon className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Tanpa perlu membuat akun. Data pribadi dikumpulkan seminimal mungkin.
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}
