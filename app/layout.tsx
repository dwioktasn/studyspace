import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StudySpace | Focus Better",
  description: "Cozy virtual rooms, gentle Pomodoros, and a community that shows up every day.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        {/* Ambient background glows */}
        <div className="ambient-glow-1"></div>
        <div className="ambient-glow-2"></div>
        
        {children}
      </body>
    </html>
  );
}
