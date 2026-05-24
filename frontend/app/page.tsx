"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { get, extractList } from "@/lib/api";
import { PagedResponse } from "@/lib/types";
import {
  BookMarked, FolderOpen, CreditCard, Flame,
  BarChart2, Globe, Key, ArrowRight, Zap, TrendingUp,
} from "lucide-react";

interface StatCard {
  label: string;
  value: number | null;
  icon: React.ElementType;
  href: string;
  color: string;
}

async function fetchCount(path: string): Promise<number> {
  const data = await get<PagedResponse<unknown>>(`${path}?size=1`);
  return data.page.totalElements;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<(number | null)[]>([null, null, null, null, null]);

  useEffect(() => {
    Promise.allSettled([
      fetchCount("/series"),
      fetchCount("/colecoes"),
      fetchCount("/cartas"),
      fetchCount("/tipos"),
      fetchCount("/detalhes"),
    ]).then((results) => {
      setStats(results.map((r) => (r.status === "fulfilled" ? r.value : 0)));
    });
  }, []);

  const cards: StatCard[] = [
    { label: "Séries", value: stats[0], icon: BookMarked, href: "/series", color: "text-pk-red" },
    { label: "Coleções", value: stats[1], icon: FolderOpen, href: "/colecoes", color: "text-pk-blue" },
    { label: "Cartas", value: stats[2], icon: CreditCard, href: "/cartas", color: "text-pk-yellow" },
    { label: "Tipos", value: stats[3], icon: Flame, href: "/tipos", color: "text-pk-red" },
    { label: "Detalhes", value: stats[4], icon: BarChart2, href: "/detalhes", color: "text-pk-blue" },
  ];

  const quickLinks = [
    { href: "/tcgdex", icon: Globe, label: "Explorar TCGdex", desc: "Catálogo externo de cartas e coleções" },
    { href: "/api-keys", icon: Key, label: "Gerenciar API Keys", desc: "Gerar ou configurar chave de acesso" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden bg-pk-surface border border-pk-border rounded-2xl p-6">
        {/* Background Pokéball */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border-[32px] border-pk-border-2/20 pointer-events-none" />
        <div className="absolute -right-16 top-[80px] w-64 h-2 bg-pk-border-2/20 pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-pk-red rounded-full flex items-center justify-center shadow-lg shadow-pk-red/30">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-pk-muted text-sm font-medium">Pokémon TCG API</span>
          </div>
          <h1 className="text-2xl font-bold text-pk-text mb-1">Dashboard</h1>
          <p className="text-pk-muted text-sm max-w-md">
            Painel administrativo para gerenciar séries, coleções, cartas e dados da Pokémon TCG API.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="flex items-center gap-1.5 text-xs bg-pk-surface-2 border border-pk-border px-3 py-1.5 rounded-full text-pk-muted font-mono">
              <span className="w-1.5 h-1.5 bg-pk-success rounded-full" />
              REST API
            </span>
            <span className="flex items-center gap-1.5 text-xs bg-pk-surface-2 border border-pk-border px-3 py-1.5 rounded-full text-pk-muted font-mono">
              <span className="w-1.5 h-1.5 bg-pk-yellow rounded-full" />
              HATEOAS
            </span>
            <span className="flex items-center gap-1.5 text-xs bg-pk-surface-2 border border-pk-border px-3 py-1.5 rounded-full text-pk-muted font-mono">
              <span className="w-1.5 h-1.5 bg-pk-blue rounded-full" />
              v1 · v2
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-pk-muted" />
          <h2 className="text-sm font-semibold text-pk-muted uppercase tracking-wider">Totais no banco</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {cards.map(({ label, value, icon: Icon, href, color }) => (
            <Link
              key={href}
              href={href}
              className="group bg-pk-surface border border-pk-border rounded-xl p-4 hover:border-pk-border-2 hover:bg-pk-surface-2 transition-all duration-150 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon size={18} className={color} />
                <ArrowRight size={14} className="text-pk-subtle group-hover:text-pk-muted transition-colors" />
              </div>
              <p className={`text-2xl font-bold font-mono ${value === null ? "text-pk-subtle" : "text-pk-text"}`}>
                {value === null ? "—" : value}
              </p>
              <p className="text-pk-muted text-xs mt-1 font-medium">{label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid md:grid-cols-2 gap-3">
        {quickLinks.map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 bg-pk-surface border border-pk-border rounded-xl p-4 hover:border-pk-red/40 hover:bg-pk-surface-2 transition-all duration-150 cursor-pointer"
          >
            <div className="w-10 h-10 bg-pk-surface-3 border border-pk-border rounded-lg flex items-center justify-center flex-shrink-0 group-hover:border-pk-red/40 transition-colors">
              <Icon size={18} className="text-pk-muted group-hover:text-pk-red transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-pk-text text-sm">{label}</p>
              <p className="text-pk-subtle text-xs mt-0.5 truncate">{desc}</p>
            </div>
            <ArrowRight size={16} className="text-pk-subtle group-hover:text-pk-red transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Auth info */}
      <div className="bg-pk-surface border border-pk-border rounded-xl p-4 text-sm text-pk-muted">
        <p className="font-semibold text-pk-text mb-1 flex items-center gap-2">
          <Key size={14} className="text-pk-yellow" />
          Autenticação
        </p>
        <p>
          Configure sua API Key em{" "}
          <Link href="/api-keys" className="text-pk-red hover:underline font-medium">API Keys</Link>
          {" "}para autenticar as requisições via header{" "}
          <code className="bg-pk-surface-2 px-1.5 py-0.5 rounded text-pk-yellow text-xs font-mono">X-API-Key</code>.
        </p>
      </div>
    </div>
  );
}
