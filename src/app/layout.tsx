import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0284c7",
};

export const metadata: Metadata = {
  title: "SchoolCare — Ruang Aman untuk Melaporkan Kejadian di Sekolah",
  description:
    "Platform pelaporan dan tindak lanjut aman untuk lingkungan sekolah. Sampaikan kejadian tanpa perlu akun, dapatkan token pelacakan rahasia, dan pantau proses penanganan secara realtime bersama guru BK dan TPPK.",
  keywords: [
    "SchoolCare",
    "lapor kekerasan sekolah",
    "stop bullying",
    "anti perundungan",
    "TPPK sekolah",
    "konseling sekolah",
  ],
  authors: [{ name: "SchoolCare Team" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900 selection:bg-sky-100 selection:text-sky-900">
        {children}
      </body>
    </html>
  );
}
