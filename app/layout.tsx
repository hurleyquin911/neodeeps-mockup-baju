import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GOOGLE_FONTS_HREF } from "@/lib/editor/fonts";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Studio Kaos — Editor Desain 3D",
  description:
    "Desain kaos dengan tools lengkap: teks, gambar, bentuk, layer, lalu generate pratinjau 3D sesuai ukuran baju asli.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href={GOOGLE_FONTS_HREF} rel="stylesheet" />
      </head>
      <body className="h-full overflow-hidden bg-[#07080c] text-white">{children}</body>
    </html>
  );
}
