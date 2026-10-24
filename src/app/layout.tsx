import type { Metadata } from "next";
import { Inter, Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ConstructIQ — AI-Based Construction Site Management & Project Intelligence",
  description:
    "Every site decision, backed by evidence. Connect construction progress, materials, field evidence, quality, safety, and explainable schedule risk.",
  icons: {
    icon: "/constructiq-logo.png",
    apple: "/constructiq-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} ${mono.variable}`}>
      <body className="font-sans bg-construct-bg text-construct-text antialiased min-h-screen selection:bg-construct-orange/20 selection:text-construct-text">
        {children}
      </body>
    </html>
  );
}
