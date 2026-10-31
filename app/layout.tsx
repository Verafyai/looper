import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { OrbitBackground } from "@/components/OrbitBackground";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Looper",
  description: "Health, score, schedule and cost for every agent loop.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${inter.className}`}>
        <OrbitBackground />
        {children}
      </body>
    </html>
  );
}
