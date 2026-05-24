import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Pokémon TCG API",
  description: "Interface de gerenciamento da Pokémon TCG API",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
          {children}
        </main>
        <footer className="bg-pk-blue text-white text-center py-3 text-sm">
          Pokémon TCG API — Senac TSI
        </footer>
      </body>
    </html>
  );
}
