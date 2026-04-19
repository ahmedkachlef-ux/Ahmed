import "./globals.css";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "CanvasAI — Business Model Canvas Generator",
  description:
    "Génération automatique du Business Model Canvas d'une entreprise et analyse synthétique, à partir de sources publiques fiables.",
  themeColor: "#0A0B10"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        <div className="grid-bg pointer-events-none fixed inset-0 -z-10" />
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
