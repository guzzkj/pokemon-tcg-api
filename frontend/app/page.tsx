import Link from "next/link";

const sections = [
  { href: "/series", icon: "📚", label: "Séries", desc: "Gerenciar séries do TCG" },
  { href: "/colecoes", icon: "🗂️", label: "Coleções", desc: "Coleções por série" },
  { href: "/cartas", icon: "🃏", label: "Cartas", desc: "CRUD completo de cartas" },
  { href: "/tipos", icon: "🔥", label: "Tipos", desc: "Tipos de Pokémon" },
  { href: "/detalhes", icon: "📊", label: "Detalhes", desc: "Estatísticas das cartas" },
  { href: "/tcgdex", icon: "🌐", label: "TCGdex", desc: "Importar dados externos" },
  { href: "/api-keys", icon: "🔑", label: "API Keys", desc: "Gerenciar chaves de acesso" },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-pk-red rounded-xl p-8 mb-8 text-white text-center">
        <div className="text-6xl mb-3">⚡</div>
        <h1 className="text-3xl font-black mb-2">Pokémon TCG API</h1>
        <p className="text-white/80 text-lg">
          Interface de gerenciamento — SENAC TSI
        </p>
        <div className="mt-4 inline-block bg-pk-yellow text-pk-blue font-bold px-4 py-1.5 rounded-full text-sm">
          v1 · v2 · HATEOAS
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-white rounded-xl p-5 shadow-sm border border-pk-border hover:border-pk-red hover:shadow-md transition-all group"
          >
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="font-bold text-pk-blue group-hover:text-pk-red transition-colors">
              {s.label}
            </div>
            <div className="text-gray-500 text-sm mt-1">{s.desc}</div>
          </Link>
        ))}
      </div>

      {/* Info */}
      <div className="mt-8 bg-white rounded-xl p-5 border border-pk-border text-sm text-gray-600">
        <p className="font-semibold text-pk-blue mb-1">Como usar</p>
        <p>
          Gere uma API Key em <Link href="/api-keys" className="text-pk-red font-medium">API Keys</Link>{" "}
          e use no header <code className="bg-gray-100 px-1 rounded">X-API-Key</code> para autenticar.
          Configure sua chave na seção de configurações da página de API Keys.
        </p>
      </div>
    </div>
  );
}
