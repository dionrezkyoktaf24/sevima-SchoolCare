import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ShieldIcon } from "@/components/ui/icons";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 mt-auto">
      <Container size="wide" className="py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-md w-fit"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-700 text-white shadow-xs">
                <ShieldIcon className="h-4.5 w-4.5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                SchoolCare
              </span>
            </Link>
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm">
              Platform pelaporan dan tindak lanjut untuk lingkungan sekolah yang
              lebih aman, saling peduli, dan bertanggung jawab.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Navigasi
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-slate-600">
              <li>
                <Link
                  href="#tentang"
                  className="hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-xs"
                >
                  Tentang
                </Link>
              </li>
              <li>
                <Link
                  href="#cara-kerja"
                  className="hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-xs"
                >
                  Cara Kerja
                </Link>
              </li>
              <li>
                <Link
                  href="#faq"
                  className="hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-xs"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Support / Direct Access */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Layanan Siswa
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-slate-600">
              <li>
                <Link
                  href="/lapor"
                  className="hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-xs"
                >
                  Buat Laporan Baru
                </Link>
              </li>
              <li>
                <Link
                  href="/lacak"
                  className="hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-xs"
                >
                  Lacak Status Laporan
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 SchoolCare. Semua hak dilindungi.</p>
          <p className="text-slate-400">
            Dikelola bersama Bimbingan Konseling & Tim Pencegahan Kekerasan Sekolah.
          </p>
        </div>
      </Container>
    </footer>
  );
}
