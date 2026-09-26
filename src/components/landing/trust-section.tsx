import React from "react";
import { Container } from "@/components/ui/container";
import { EyeOffIcon, LockIcon, ClipboardCheckIcon } from "@/components/ui/icons";

export function TrustSection() {
  const trustPillars = [
    {
      title: "Tanpa Akun",
      description:
        "Buat laporan tanpa proses registrasi atau login. Tidak memerlukan nama lengkap maupun NISN.",
      icon: EyeOffIcon,
    },
    {
      title: "Privasi Diperhatikan",
      description:
        "Informasi laporan hanya digunakan untuk proses penanganan oleh pihak berwenang di sekolah.",
      icon: LockIcon,
    },
    {
      title: "Ada Tindak Lanjut",
      description:
        "Laporan dapat dipantau perkembangannya secara langsung menggunakan token pelacakan rahasia.",
      icon: ClipboardCheckIcon,
    },
  ];

  return (
    <section id="tentang" className="py-12 md:py-16 border-y border-slate-200 bg-slate-50/60">
      <Container size="default">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {trustPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="flex flex-col p-6 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition-colors duration-150"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700 border border-sky-100 mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-base font-bold text-slate-900 mb-2">
                  {pillar.title}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
