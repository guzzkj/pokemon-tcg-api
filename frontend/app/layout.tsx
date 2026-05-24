import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Pokémon TCG Admin",
  description: "Painel administrativo da Pokémon TCG API",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-pk-bg text-pk-text min-h-screen">
        <Sidebar />
        {/* Content shifted right on desktop for sidebar */}
        <div className="lg:pl-60 flex flex-col min-h-screen">
          {/* Top bar spacer on mobile */}
          <div className="lg:hidden h-14" />
          <main className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto">
            {children}
          </main>
          <footer className="px-6 py-3 border-t border-pk-border text-pk-subtle text-xs text-center">
            Pokémon TCG API — SENAC TSI
          </footer>
        </div>
      </body>
    </html>
  );
}
