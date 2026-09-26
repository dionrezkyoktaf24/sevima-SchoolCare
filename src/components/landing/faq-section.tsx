import React from "react";
import { Container } from "@/components/ui/container";

export function FaqSection() {
  const faqs = [
    {
      question: "Apakah saya harus membuat akun?",
      answer:
        "Tidak. SchoolCare dirancang agar siswa dapat membuat laporan tanpa registrasi atau login akun.",
    },
    {
      question: "Bagaimana cara melacak laporan?",
      answer:
        "Setelah laporan dikirim, sistem memberikan token pelacakan rahasia (contoh: CARE-XXXX-XXXX) yang dapat digunakan untuk membuka halaman tracking dan memantau perkembangan status secara langsung.",
    },
    {
      question: "Apakah laporan saya langsung diputuskan oleh AI?",
      answer:
        "Tidak. AI hanya memberikan ringkasan risiko dan informasi pendukung awal. Seluruh evaluasi, verifikasi, dan keputusan penanganan tetap dilakukan oleh manusia (guru BK dan tim TPPK sekolah).",
    },
    {
      question: "Apa yang harus saya lakukan jika saya tidak yakin harus melapor?",
      answer:
        "Kamu tetap dapat menyampaikan kejadian yang kamu alami atau ketahui. Jelaskan informasi yang kamu ketahui secara jujur dan secukupnya. Tim sekolah siap mendengarkan dan mendampingi.",
    },
    {
      question: "Siapa yang dapat membaca isi laporan saya?",
      answer:
        "Laporan hanya dapat diakses secara tertutup oleh Guru Bimbingan Konseling (BK) dan Tim Pencegahan & Penanganan Kekerasan (TPPK) resmi yang bertugas di sekolah terkait.",
    },
  ];

  return (
    <section id="faq" className="py-16 md:py-24 bg-white">
      <Container size="narrow">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-3">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Hal-hal mendasar yang perlu kamu ketahui seputar proses pelaporan dan
            privasi di SchoolCare.
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, idx) => (
            <details
              key={idx}
              className="group rounded-xl border border-slate-200 bg-white p-5 transition-colors duration-150 hover:border-slate-300 focus-within:ring-2 focus-within:ring-sky-600 focus-within:ring-offset-1"
            >
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-slate-900 text-sm sm:text-base select-none list-none focus:outline-none">
                <span className="pr-4">{faq.question}</span>
                <span className="shrink-0 text-slate-400 group-open:rotate-180 transition-transform duration-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m19.5 8.25-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
