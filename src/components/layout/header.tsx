"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ShieldIcon, MenuIcon, XIcon } from "@/components/ui/icons";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xs">
      <Container size="wide">
        <div className="flex h-16 items-center justify-between">
          {/* Brand Logo & Name */}
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-md py-1"
            onClick={closeMobileMenu}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-700 text-white shadow-xs">
              <ShieldIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 leading-none">
                SchoolCare
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-normal mt-0.5">
                Ruang Aman Sekolah
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600" aria-label="Navigasi Utama">
            <Link
              href="#tentang"
              className="transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-sm py-1"
            >
              Tentang
            </Link>
            <Link
              href="#cara-kerja"
              className="transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-sm py-1"
            >
              Cara Kerja
            </Link>
            <Link
              href="#faq"
              className="transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-sm py-1"
            >
              FAQ
            </Link>
          </nav>

          {/* Desktop Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Button href="/dashboard/login" variant="outline" size="sm">
              Masuk Guru / TPPK
            </Button>
            <Button href="/lacak" variant="outline" size="sm">
              Lacak Laporan
            </Button>
            <Button href="/lapor" variant="primary" size="sm">
              Buat Laporan
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="inline-flex md:hidden items-center justify-center p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
          >
            {mobileMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </Container>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white shadow-lg animate-in slide-in-from-top duration-150">
          <Container>
            <div className="flex flex-col py-4 gap-3">
              <nav className="flex flex-col gap-1 pb-3 border-b border-slate-100" aria-label="Navigasi Seluler">
                <Link
                  href="#tentang"
                  className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md"
                  onClick={closeMobileMenu}
                >
                  Tentang
                </Link>
                <Link
                  href="#cara-kerja"
                  className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md"
                  onClick={closeMobileMenu}
                >
                  Cara Kerja
                </Link>
                <Link
                  href="#faq"
                  className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md"
                  onClick={closeMobileMenu}
                >
                  FAQ
                </Link>
              </nav>

              <div className="flex flex-col gap-2 pt-1">
                <Button href="/dashboard/login" variant="outline" size="md" className="w-full justify-center" onClick={closeMobileMenu}>
                  Masuk Guru / TPPK
                </Button>
                <Button href="/lapor" variant="primary" size="md" className="w-full justify-center" onClick={closeMobileMenu}>
                  Buat Laporan
                </Button>
                <Button href="/lacak" variant="outline" size="md" className="w-full justify-center" onClick={closeMobileMenu}>
                  Lacak Laporan
                </Button>
              </div>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
