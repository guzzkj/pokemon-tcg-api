"use client";

import { useCallback, useEffect, useState } from "react";
import { get, extractList } from "@/lib/api";
import { PagedResponse, ApiError } from "@/lib/types";
import Pagination from "@/components/Pagination";
import Modal from "@/components/Modal";
import Toast from "@/components/Toast";

interface TcgdexCarta {
  id: string;
  localId: string;
  name: string;
  image?: string;
}

interface TcgdexColecao {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
}

interface TcgdexCartaDetalhe extends TcgdexCarta {
  hp?: number;
  types?: string[];
  rarity?: string;
  artist?: string;
  description?: string;
  evolveFrom?: string;
  set?: { id: string; name: string };
}

interface TcgdexColecaoDetalhe extends TcgdexColecao {
  serie?: { id: string; name: string };
  cards?: TcgdexCarta[];
  cardCount?: { total: number };
}

type Tab = "cartas" | "colecoes";

export default function TcgdexPage() {
  const [tab, setTab] = useState<Tab>("cartas");

  // Cartas state
  const [cartas, setCartas] = useState<TcgdexCarta[]>([]);
  const [cartasPage, setCartasPage] = useState({ number: 0, totalPages: 0, totalElements: 0 });
  const [cartasLoading, setCartasLoading] = useState(false);
  const [nomeSearch, setNomeSearch] = useState("");
  const [nomeInput, setNomeInput] = useState("");
  const [cartaDetalhe, setCartaDetalhe] = useState<TcgdexCartaDetalhe | null>(null);
  const [detalheLoading, setDetalheLoading] = useState(false);

  // Coleções state
  const [colecoes, setColecoes] = useState<TcgdexColecao[]>([]);
  const [colecoesPage, setColecoesPage] = useState({ number: 0, totalPages: 0, totalElements: 0 });
  const [colecoesLoading, setColecoesLoading] = useState(false);
  const [colecaoDetalhe, setColecaoDetalhe] = useState<TcgdexColecaoDetalhe | null>(null);
  const [colecaoDetalheLoading, setColecaoDetalheLoading] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadCartas = useCallback(async (page = 0, nome = "") => {
    setCartasLoading(true);
    try {
      const path = nome
        ? `/tcgdex/cartas/buscar?nome=${encodeURIComponent(nome)}&page=${page}&size=20`
        : `/tcgdex/cartas?page=${page}&size=20`;
      const data = await get<PagedResponse<TcgdexCarta>>(path);
      setCartas(extractList(data, "tcgdexCartaResumidaDtoList"));
      setCartasPage({
        number: data.page.number,
        totalPages: data.page.totalPages,
        totalElements: data.page.totalElements,
      });
    } catch (e) {
      const err = e as ApiError;
      setToast({ message: err.mensagem ?? "Erro ao consultar TCGdex", type: "error" });
    } finally {
      setCartasLoading(false);
    }
  }, []);

  const loadColecoes = useCallback(async (page = 0) => {
    setColecoesLoading(true);
    try {
      const data = await get<PagedResponse<TcgdexColecao>>(`/tcgdex/colecoes?page=${page}&size=20`);
      setColecoes(extractList(data, "tcgdexColecaoResumidaDtoList"));
      setColecoesPage({
        number: data.page.number,
        totalPages: data.page.totalPages,
        totalElements: data.page.totalElements,
      });
    } catch (e) {
      const err = e as ApiError;
      setToast({ message: err.mensagem ?? "Erro ao consultar TCGdex", type: "error" });
    } finally {
      setColecoesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "cartas") loadCartas(0, nomeSearch);
    else loadColecoes(0);
  }, [tab, loadCartas, loadColecoes, nomeSearch]);

  async function abrirCartaDetalhe(id: string) {
    setDetalheLoading(true);
    setCartaDetalhe(null);
    try {
      const data = await get<TcgdexCartaDetalhe>(`/tcgdex/cartas/${id}`);
      setCartaDetalhe(data);
    } catch (e) {
      const err = e as ApiError;
      setToast({ message: err.mensagem ?? "Carta não encontrada", type: "error" });
    } finally {
      setDetalheLoading(false);
    }
  }

  async function abrirColecaoDetalhe(id: string) {
    setColecaoDetalheLoading(true);
    setColecaoDetalhe(null);
    try {
      const data = await get<TcgdexColecaoDetalhe>(`/tcgdex/colecoes/${id}`);
      setColecaoDetalhe(data);
    } catch (e) {
      const err = e as ApiError;
      setToast({ message: err.mensagem ?? "Coleção não encontrada", type: "error" });
    } finally {
      setColecaoDetalheLoading(false);
    }
  }

  function handleNomeSearch(e: React.FormEvent) {
    e.preventDefault();
    setNomeSearch(nomeInput);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-pk-blue">🌐 TCGdex</h1>
        <p className="text-gray-500 text-sm">
          Explorar catálogo externo — dados não são salvos no banco
        </p>
        <div className="mt-1 inline-block bg-pk-yellow text-pk-blue font-bold px-3 py-0.5 rounded-full text-xs">
          Somente leitura · API externa
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 border-b border-pk-border">
        {(["cartas", "colecoes"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-bold capitalize transition-colors -mb-px border-b-2 ${
              tab === t
                ? "border-pk-red text-pk-red"
                : "border-transparent text-gray-500 hover:text-pk-blue"
            }`}
          >
            {t === "cartas" ? "🃏 Cartas" : "🗂️ Coleções"}
          </button>
        ))}
      </div>

      {/* ── Cartas tab ── */}
      {tab === "cartas" && (
        <div>
          <form onSubmit={handleNomeSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              value={nomeInput}
              onChange={(e) => setNomeInput(e.target.value)}
              placeholder="Buscar carta por nome..."
              className="flex-1 border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red"
            />
            <button
              type="submit"
              className="bg-pk-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pk-blue-light transition-colors"
            >
              Buscar
            </button>
            {nomeSearch && (
              <button
                type="button"
                onClick={() => { setNomeSearch(""); setNomeInput(""); }}
                className="px-3 py-2 rounded-lg border border-pk-border text-sm hover:bg-pk-gray transition-colors"
              >
                Limpar
              </button>
            )}
          </form>

          {cartasLoading ? (
            <div className="p-12 text-center text-gray-400">Consultando TCGdex...</div>
          ) : cartas.length === 0 ? (
            <div className="p-12 text-center text-gray-400">Nenhuma carta encontrada.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {cartas.map((c) => (
                <button
                  key={c.id}
                  onClick={() => abrirCartaDetalhe(c.id)}
                  className="bg-white rounded-xl border border-pk-border shadow-sm hover:border-pk-red hover:shadow-md transition-all text-left overflow-hidden group"
                >
                  {c.image ? (
                    <img
                      src={`${c.image}/low.png`}
                      alt={c.name}
                      className="w-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-full aspect-[2.5/3.5] bg-pk-gray flex items-center justify-center text-3xl">
                      🃏
                    </div>
                  )}
                  <div className="p-2">
                    <p className="font-bold text-xs text-pk-blue truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{c.id}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <Pagination
            page={cartasPage.number}
            totalPages={cartasPage.totalPages}
            totalElements={cartasPage.totalElements}
            onPage={(p) => loadCartas(p, nomeSearch)}
          />
        </div>
      )}

      {/* ── Coleções tab ── */}
      {tab === "colecoes" && (
        <div>
          {colecoesLoading ? (
            <div className="p-12 text-center text-gray-400">Consultando TCGdex...</div>
          ) : colecoes.length === 0 ? (
            <div className="p-12 text-center text-gray-400">Nenhuma coleção encontrada.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {colecoes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => abrirColecaoDetalhe(c.id)}
                  className="bg-white rounded-xl border border-pk-border shadow-sm hover:border-pk-red hover:shadow-md transition-all text-left p-4 group"
                >
                  <div className="flex items-center gap-3">
                    {c.logo ? (
                      <img
                        src={c.logo}
                        alt={c.name}
                        className="h-10 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="text-2xl">🗂️</div>
                    )}
                    <div>
                      <p className="font-bold text-pk-blue group-hover:text-pk-red transition-colors">
                        {c.name}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">{c.id}</p>
                    </div>
                    {c.symbol && (
                      <img
                        src={c.symbol}
                        alt="símbolo"
                        className="h-6 ml-auto object-contain opacity-60"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          <Pagination
            page={colecoesPage.number}
            totalPages={colecoesPage.totalPages}
            totalElements={colecoesPage.totalElements}
            onPage={(p) => loadColecoes(p)}
          />
        </div>
      )}

      {/* ── Modal: Detalhe Carta ── */}
      {(cartaDetalhe || detalheLoading) && (
        <Modal
          title={detalheLoading ? "Carregando..." : `${cartaDetalhe!.name} · ${cartaDetalhe!.id}`}
          onClose={() => setCartaDetalhe(null)}
        >
          {detalheLoading ? (
            <div className="p-8 text-center text-gray-400">Buscando na TCGdex...</div>
          ) : cartaDetalhe && (
            <div className="flex gap-5">
              {cartaDetalhe.image && (
                <img
                  src={`${cartaDetalhe.image}/high.png`}
                  alt={cartaDetalhe.name}
                  className="w-36 object-contain rounded-lg shadow-md flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
              <div className="flex flex-col gap-2 text-sm flex-1">
                {cartaDetalhe.hp && (
                  <Row label="HP" value={`${cartaDetalhe.hp} HP`} />
                )}
                {cartaDetalhe.types && cartaDetalhe.types.length > 0 && (
                  <Row label="Tipos" value={cartaDetalhe.types.join(", ")} />
                )}
                {cartaDetalhe.rarity && (
                  <Row label="Raridade" value={cartaDetalhe.rarity} highlight />
                )}
                {cartaDetalhe.artist && (
                  <Row label="Artista" value={cartaDetalhe.artist} />
                )}
                {cartaDetalhe.evolveFrom && (
                  <Row label="Evolui De" value={cartaDetalhe.evolveFrom} />
                )}
                {cartaDetalhe.set && (
                  <Row label="Coleção" value={`${cartaDetalhe.set.name} (${cartaDetalhe.set.id})`} />
                )}
                {cartaDetalhe.description && (
                  <div className="mt-2 p-3 bg-pk-gray rounded-lg text-gray-600 italic text-xs leading-relaxed">
                    "{cartaDetalhe.description}"
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ── Modal: Detalhe Coleção ── */}
      {(colecaoDetalhe || colecaoDetalheLoading) && (
        <Modal
          title={colecaoDetalheLoading ? "Carregando..." : `${colecaoDetalhe!.name}`}
          onClose={() => setColecaoDetalhe(null)}
        >
          {colecaoDetalheLoading ? (
            <div className="p-8 text-center text-gray-400">Buscando na TCGdex...</div>
          ) : colecaoDetalhe && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                {colecaoDetalhe.logo && (
                  <img src={colecaoDetalhe.logo} alt={colecaoDetalhe.name} className="h-12 object-contain" />
                )}
                <div>
                  <p className="text-xs text-gray-400 font-mono">{colecaoDetalhe.id}</p>
                  {colecaoDetalhe.serie && (
                    <p className="text-sm text-gray-600">Série: {colecaoDetalhe.serie.name}</p>
                  )}
                  {colecaoDetalhe.cardCount && (
                    <p className="text-sm font-bold text-pk-blue">
                      {colecaoDetalhe.cardCount.total} cartas
                    </p>
                  )}
                </div>
              </div>

              {colecaoDetalhe.cards && colecaoDetalhe.cards.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2">
                    Cartas ({colecaoDetalhe.cards.length})
                  </p>
                  <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                    {colecaoDetalhe.cards.map((c) => (
                      <div key={c.id} className="text-center">
                        {c.image && (
                          <img
                            src={`${c.image}/low.png`}
                            alt={c.name}
                            className="w-full rounded cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => { setColecaoDetalhe(null); abrirCartaDetalhe(c.id); }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                        <p className="text-xs text-gray-500 truncate">{c.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 w-20 flex-shrink-0">{label}:</span>
      {highlight ? (
        <span className="bg-pk-yellow text-pk-blue font-bold px-2 py-0.5 rounded-full text-xs">
          {value}
        </span>
      ) : (
        <span className="font-medium text-gray-700">{value}</span>
      )}
    </div>
  );
}
