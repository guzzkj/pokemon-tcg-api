"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, BookMarked, FolderOpen, CreditCard,
  Flame, BarChart2, Globe, Key, Menu, X, Zap, ChevronRight,
} from "lucide-react";

const links = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/series", icon: BookMarked, label: "Séries" },
  { href: "/colecoes", icon: FolderOpen, label: "Coleções" },
  { href: "/cartas", icon: CreditCard, label: "Cartas" },
  { href: "/tipos", icon: Flame, label: "Tipos" },
  { href: "/detalhes", icon: BarChart2, label: "Detalhes" },
  { href: "/tcgdex", icon: Globe, label: "TCGdex" },
  { href: "/api-keys", icon: Key, label: "API Keys" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14 bg-pk-surface border-b border-pk-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-pk-red rounded-full flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-bold text-pk-text text-sm">Pokémon TCG</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 text-pk-muted hover:text-pk-text transition-colors cursor-pointer"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 w-60 flex flex-col bg-pk-surface border-r border-pk-border
          transition-transform duration-200 lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-pk-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-pk-red flex items-center justify-center shadow-lg shadow-pk-red/30">
                <Zap size={16} className="text-white" />
              </div>
            </div>
            <div>
              <p className="font-bold text-pk-text text-sm leading-none">Pokémon TCG</p>
              <p className="text-pk-subtle text-xs mt-0.5">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-1 text-pk-muted hover:text-pk-text transition-colors cursor-pointer"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <p className="text-pk-subtle text-xs font-semibold uppercase tracking-wider px-3 mb-2">
            Navegação
          </p>
          <ul className="flex flex-col gap-0.5">
            {links.map(({ href, icon: Icon, label }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group
                      ${active
                        ? "bg-pk-red text-white shadow-md shadow-pk-red/20"
                        : "text-pk-muted hover:text-pk-text hover:bg-pk-surface-2"
                      }`}
                  >
                    <Icon size={17} className={active ? "text-white" : "text-pk-subtle group-hover:text-pk-muted"} />
                    <span>{label}</span>
                    {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-pk-border flex-shrink-0">
          <p className="text-pk-subtle text-xs text-center">SENAC TSI · 2025</p>
        </div>
      </aside>
    </>
  );
}
