import "./globals.css";
import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChatbotMount } from "@/components/ChatbotMount";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Sora({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "ADVANCIA Trainings — Premium IT, Cloud & Business Training",
  description:
    "ADVANCIA Trainings — Premium training programs in IT, Telecom, Cloud, Cybersecurity, Project Management, Data, AI and Business productivity.",
  keywords: ["ADVANCIA", "trainings", "IT", "cloud", "cybersecurity", "AI", "data", "telecom"]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen antialiased">
        <Providers>
          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-warm-radial -z-10" />
            <Navbar />
            <main className="min-h-[70vh]">{children}</main>
            <Footer />
            <ChatbotMount />
          </div>
        </Providers>
      </body>
    </html>
  );
}
