import React from "react";
import { Container } from "@/components/ui/container";
import { UsersIcon, ShieldIcon, CheckCircleIcon } from "@/components/ui/icons";

export function SafetyHumanSection() {
  const principles = [
    {
      title: "Evaluasi Kontekstual oleh Guru BK & TPPK",
      description:
        "Setiap kronologi kejadian dan bukti ditelaah secara manusiawi dengan mempertimbangkan dinamika siswa dan lingkungan sekolah.",
      icon: UsersIcon,
    },
    {
      title: "Bukan Penghakiman Otomatis",
      description:
        "Sistem kecerdasan buatan hanya membantu menyusun rangkuman data pendukung. Tidak ada penjatuhan sanksi atau keputusan sepihak oleh algoritma.",
      icon: ShieldIcon,
    },
    {
      title: "Fokus Perlindungan & Pemulihan",
      description:
        "Tujuan utama penanganan adalah menghentikan perundungan, menjamin keselamatan pelapor, dan memberikan pembinaan edukatif.",
      icon: CheckCircleIcon,
    },
  ];

  return (
    <section className="py-16 md:py-20 border-y border-slate-200 bg-slate-50">
      <Container size="default">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-4">
            Keputusan tetap berada di tangan manusia.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            SchoolCare dapat membantu merangkum dan memberikan informasi pendukung
            kepada tim sekolah, tetapi evaluasi dan keputusan penanganan tetap
            dilakukan sepenuhnya oleh pihak yang berwenang.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {principles.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex flex-col p-6 rounded-xl border border-slate-200 bg-white shadow-2xs"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700 border border-sky-100 mb-3.5">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
