import React from "react";
import { Container } from "@/components/ui/container";

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Ceritakan kejadian",
      description:
        "Sampaikan apa yang terjadi melalui formulir laporan secara objektif dan jelas. Nama dan identitas pribadi tidak diwajibkan.",
    },
    {
      number: "02",
      title: "Simpan token laporan",
      description:
        "Setelah laporan dikirim, sistem memberikan token pelacakan rahasia (contoh: CARE-XXXX-XXXX) sebagai kunci akses laporanmu.",
    },
    {
      number: "03",
      title: "Pantau tindak lanjut",
      description:
        "Gunakan token tersebut untuk melihat perkembangan status penanganan dan berkomunikasi secara tertutup dengan pihak sekolah.",
    },
  ];

  return (
    <section id="cara-kerja" className="py-16 md:py-24 bg-white">
      <Container size="default">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-4">
            Bagaimana cara kerjanya?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Alur pelaporan dirancang agar ringkas, melindungi privasi pelapor, dan
            memastikan setiap laporan memiliki jalur tindak lanjut yang jelas.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="flex flex-col p-6 rounded-xl border border-slate-200 bg-white relative hover:border-slate-300 transition-colors"
            >
              {/* Visual Numbering */}
              <div className="text-3xl font-black text-sky-700/80 mb-4 font-mono">
                {step.number}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2.5">
                {step.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
