"use client";

import { useCallback, useEffect, useState } from "react";
import { get, extractList } from "@/lib/api";
import { PagedResponse, ApiError } from "@/lib/types";
import Pagination from "@/components/Pagination";
import Modal from "@/components/Modal";
import Toast from "@/components/Toast";
import { Globe, Search, X, CreditCard, FolderOpen, ExternalLink } from "lucide-react";

interface TcgdexCarta { id: string; localId: string; name: string; image?: string; }
interface TcgdexColecao { id: string; name: string; logo?: string; symbol?: string; }
interface TcgdexCartaDetalhe extends TcgdexCarta { hp?: number; types?: string[]; rarity?: string; artist?: string; description?: string; evolveFrom?: string; set?: { id: string; name: string }; }
interface TcgdexColecaoDetalhe extends TcgdexColecao { serie?: { id: string; name: string }; cards?: TcgdexCarta[]; cardCount?: { total: number }; }

type Tab = "cartas" | "colecoes";

export default function TcgdexPage() {
  const [tab, setTab] = useState<Tab>("cartas");

  const [cartas, setCartas] = useState<TcgdexCarta[]>([]);
  const [cartasPage, setCartasPage] = useState({ number: 0, totalPages: 0, totalElements: 0 });
  const [cartasLoading, setCartasLoading] = useState(false);
  const [nomeSearch, setNomeSearch] = useState("");
  const [nomeInput, setNomeInput] = useState("");
  const [cartaDetalhe, setCartaDetalhe] = useState<TcgdexCartaDetalhe | null>(null);
  const [detalheLoading, setDetalheLoading] = useState(false);

  const [colecoes, setColecoes] = useState<TcgdexColecao[]>([]);
  const [colecoesPage, setColecoesPage] = useState({ number: 0, totalPages: 0, totalElements: 0 });
  const [colecoesLoading, setColecoesLoading] = useState(false);
  const [colecaoDetalhe, setColecaoDetalhe] = useState<TcgdexColecaoDetalhe | null>(null);
  const [colecaoDetalheLoading, setColecaoDetalheLoading] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadCartas = useCallback(async (page = 0, nome = "") => {
    setCartasLoading(true);
    try {
      const path = nome ? `/tcgdex/cartas/buscar?nome=${encodeURIComponent(nome)}&page=${page}&size=20` : `/tcgdex/cartas?page=${page}&size=20`;
      const data = await get<PagedResponse<TcgdexCarta>>(path);
      setCartas(extractList(data, "tcgdexCartaResumidaDtoList"));
      setCartasPage({ number: data.page.number, totalPages: data.page.totalPages, totalElements: data.page.totalElements });
    } catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Erro ao consultar TCGdex", type: "error" }); }
    finally { setCartasLoading(false); }
  }, []);

  const loadColecoes = useCallback(async (page = 0) => {
    setColecoesLoading(true);
    try {
      const data = await get<PagedResponse<TcgdexColecao>>(`/tcgdex/colecoes?page=${page}&size=20`);
      setColecoes(extractList(data, "tcgdexColecaoResumidaDtoList"));
      setColecoesPage({ number: data.page.number, totalPages: data.page.totalPages, totalElements: data.page.totalElements });
    } catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Erro ao consultar TCGdex", type: "error" }); }
    finally { setColecoesLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === "cartas") loadCartas(0, nomeSearch);
    else loadColecoes(0);
  }, [tab, loadCartas, loadColecoes, nomeSearch]);

  async function abrirCartaDetalhe(id: string) {
    setDetalheLoading(true); setCartaDetalhe(null);
    try { const data = await get<TcgdexCartaDetalhe>(`/tcgdex/cartas/${id}`); setCartaDetalhe(data); }
    catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Carta não encontrada", type: "error" }); }
    finally { setDetalheLoading(false); }
  }

  async function abrirColecaoDetalhe(id: string) {
    setColecaoDetalheLoading(true); setColecaoDetalhe(null);
    try { const data = await get<TcgdexColecaoDetalhe>(`/tcgdex/colecoes/${id}`); setColecaoDetalhe(data); }
    catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Coleção não encontrada", type: "error" }); }
    finally { setColecaoDetalheLoading(false); }
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "cartas", label: "Cartas", icon: CreditCard },
    { key: "colecoes", label: "Coleções", icon: FolderOpen },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-pk-surface-2 border border-pk-border rounded-lg flex items-center justify-center">
          <Globe size={18} className="text-pk-blue" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-pk-text">TCGdex</h1>
            <span className="bg-pk-yellow/10 text-pk-yellow border border-pk-yellow/20 text-xs font-bold px-2 py-0.5 rounded-full">Somente leitura</span>
          </div>
          <p className="text-pk-subtle text-xs">Catálogo externo · dados não são salvos no banco</p>
        </div>
      </div>

      <div className="flex gap-1 bg-pk-surface-2 border border-pk-border p-1 rounded-lg w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-colors cursor-pointer ${tab === key ? "bg-pk-red text-white" : "text-pk-muted hover:text-pk-text"}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === "cartas" && (
        <div className="space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); setNomeSearch(nomeInput); }} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-pk-subtle" />
              <input type="text" value={nomeInput} onChange={(e) => setNomeInput(e.target.value)} placeholder="Buscar carta por nome..."
                className="w-full bg-pk-surface border border-pk-border rounded-lg pl-9 pr-3 py-2 text-sm text-pk-text placeholder:text-pk-subtle focus:outline-none focus:border-pk-red transition-colors" />
            </div>
            <button type="submit" className="bg-pk-surface-2 border border-pk-border px-4 py-2 rounded-lg text-sm text-pk-muted hover:text-pk-text transition-colors cursor-pointer">Buscar</button>
            {nomeSearch && <button type="button" onClick={() => { setNomeSearch(""); setNomeInput(""); }} className="p-2 text-pk-muted hover:text-pk-text cursor-pointer"><X size={16} /></button>}
          </form>

          {cartasLoading ? <div className="p-12 text-center text-pk-subtle text-sm">Consultando TCGdex...</div>
            : cartas.length === 0 ? <div className="p-12 text-center text-pk-subtle text-sm">Nenhuma carta encontrada.</div>
            : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {cartas.map((c) => (
                  <button key={c.id} onClick={() => abrirCartaDetalhe(c.id)}
                    className="bg-pk-surface border border-pk-border rounded-xl hover:border-pk-red hover:bg-pk-surface-2 transition-all text-left overflow-hidden group cursor-pointer">
                    {c.image
                      ? <img src={`${c.image}/low.png`} alt={c.name} className="w-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      : <div className="w-full aspect-[2.5/3.5] bg-pk-surface-3 flex items-center justify-center"><CreditCard size={32} className="text-pk-subtle" /></div>}
                    <div className="p-2">
                      <p className="font-bold text-xs text-pk-text truncate">{c.name}</p>
                      <p className="text-xs text-pk-subtle font-mono">{c.id}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

          <Pagination page={cartasPage.number} totalPages={cartasPage.totalPages} totalElements={cartasPage.totalElements} onPage={(p) => loadCartas(p, nomeSearch)} />
        </div>
      )}

      {tab === "colecoes" && (
        <div className="space-y-4">
          {colecoesLoading ? <div className="p-12 text-center text-pk-subtle text-sm">Consultando TCGdex...</div>
            : colecoes.length === 0 ? <div className="p-12 text-center text-pk-subtle text-sm">Nenhuma coleção encontrada.</div>
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {colecoes.map((c) => (
                  <button key={c.id} onClick={() => abrirColecaoDetalhe(c.id)}
                    className="bg-pk-surface border border-pk-border rounded-xl hover:border-pk-red hover:bg-pk-surface-2 transition-all text-left p-4 group cursor-pointer">
                    <div className="flex items-center gap-3">
                      {c.logo
                        ? <img src={c.logo} alt={c.name} className="h-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        : <div className="w-10 h-10 bg-pk-surface-3 border border-pk-border rounded-lg flex items-center justify-center"><FolderOpen size={18} className="text-pk-subtle" /></div>}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-pk-text text-sm group-hover:text-pk-red transition-colors truncate">{c.name}</p>
                        <p className="text-xs text-pk-subtle font-mono">{c.id}</p>
                      </div>
                      {c.symbol && <img src={c.symbol} alt="símbolo" className="h-6 object-contain opacity-50" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                    </div>
                  </button>
                ))}
              </div>
            )}

          <Pagination page={colecoesPage.number} totalPages={colecoesPage.totalPages} totalElements={colecoesPage.totalElements} onPage={(p) => loadColecoes(p)} />
        </div>
      )}

      {(cartaDetalhe || detalheLoading) && (
        <Modal title={detalheLoading ? "Carregando..." : `${cartaDetalhe!.name} · ${cartaDetalhe!.id}`} onClose={() => setCartaDetalhe(null)}>
          {detalheLoading ? <div className="p-8 text-center text-pk-subtle text-sm">Buscando na TCGdex...</div>
            : cartaDetalhe && (
              <div className="flex gap-5">
                {cartaDetalhe.image && (
                  <img src={`${cartaDetalhe.image}/high.png`} alt={cartaDetalhe.name}
                    className="w-36 object-contain rounded-lg flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
                <div className="flex flex-col gap-2.5 text-sm flex-1">
                  {cartaDetalhe.hp && <InfoRow label="HP" value={`${cartaDetalhe.hp} HP`} />}
                  {cartaDetalhe.types && cartaDetalhe.types.length > 0 && <InfoRow label="Tipos" value={cartaDetalhe.types.join(", ")} />}
                  {cartaDetalhe.rarity && <InfoRow label="Raridade" value={cartaDetalhe.rarity} badge />}
                  {cartaDetalhe.artist && <InfoRow label="Artista" value={cartaDetalhe.artist} />}
                  {cartaDetalhe.evolveFrom && <InfoRow label="Evolui De" value={cartaDetalhe.evolveFrom} />}
                  {cartaDetalhe.set && <InfoRow label="Coleção" value={`${cartaDetalhe.set.name} (${cartaDetalhe.set.id})`} />}
                  {cartaDetalhe.description && (
                    <div className="mt-1 p-3 bg-pk-surface-3 border border-pk-border rounded-lg text-pk-muted italic text-xs leading-relaxed">
                      &ldquo;{cartaDetalhe.description}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            )}
        </Modal>
      )}

      {(colecaoDetalhe || colecaoDetalheLoading) && (
        <Modal title={colecaoDetalheLoading ? "Carregando..." : colecaoDetalhe!.name} onClose={() => setColecaoDetalhe(null)}>
          {colecaoDetalheLoading ? <div className="p-8 text-center text-pk-subtle text-sm">Buscando na TCGdex...</div>
            : colecaoDetalhe && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {colecaoDetalhe.logo && <img src={colecaoDetalhe.logo} alt={colecaoDetalhe.name} className="h-12 object-contain" />}
                  <div>
                    <p className="text-xs text-pk-subtle font-mono mb-0.5">{colecaoDetalhe.id}</p>
                    {colecaoDetalhe.serie && <p className="text-sm text-pk-muted">Série: {colecaoDetalhe.serie.name}</p>}
                    {colecaoDetalhe.cardCount && (
                      <p className="text-sm font-bold text-pk-text">{colecaoDetalhe.cardCount.total} cartas</p>
                    )}
                  </div>
                </div>
                {colecaoDetalhe.cards && colecaoDetalhe.cards.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-pk-muted uppercase tracking-wider mb-2">Cartas ({colecaoDetalhe.cards.length})</p>
                    <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                      {colecaoDetalhe.cards.map((c) => (
                        <button key={c.id} onClick={() => { setColecaoDetalhe(null); abrirCartaDetalhe(c.id); }}
                          className="text-center group cursor-pointer">
                          {c.image && (
                            <img src={`${c.image}/low.png`} alt={c.name} className="w-full rounded group-hover:scale-105 transition-transform"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          )}
                          <p className="text-xs text-pk-subtle truncate mt-1">{c.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function InfoRow({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-pk-subtle text-xs w-20 flex-shrink-0">{label}</span>
      {badge
        ? <span className="bg-pk-yellow/10 text-pk-yellow border border-pk-yellow/20 font-bold px-2 py-0.5 rounded-full text-xs font-mono">{value}</span>
        : <span className="font-medium text-pk-text text-xs">{value}</span>}
    </div>
  );
}
