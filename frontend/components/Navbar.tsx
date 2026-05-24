"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/series", label: "Séries" },
  { href: "/colecoes", label: "Coleções" },
  { href: "/cartas", label: "Cartas" },
  { href: "/tipos", label: "Tipos" },
  { href: "/detalhes", label: "Detalhes" },
  { href: "/tcgdex", label: "TCGdex" },
  { href: "/api-keys", label: "API Keys" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-pk-red shadow-md">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-pk-yellow font-black text-xl tracking-tight">
            ⚡ Pokémon TCG
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                pathname === l.href
                  ? "bg-pk-yellow text-pk-blue font-bold"
                  : "text-white hover:bg-pk-red-dark"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden bg-pk-red-dark px-4 pb-3 flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`px-3 py-2 rounded text-sm font-medium ${
                pathname === l.href
                  ? "bg-pk-yellow text-pk-blue font-bold"
                  : "text-white hover:bg-pk-red"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
