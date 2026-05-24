"use client";

import { useCallback, useEffect, useState } from "react";
import { get, post, put, del, extractList } from "@/lib/api";
import { Tipo, Carta, PagedResponse, ApiError } from "@/lib/types";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import Toast from "@/components/Toast";

type View = "list" | "create" | "edit";

const TIPO_ICONS: Record<string, string> = {
  fogo: "🔥", fire: "🔥",
  água: "💧", agua: "💧", water: "💧",
  grama: "🌿", grass: "🌿",
  elétrico: "⚡", eletrico: "⚡", electric: "⚡", lightning: "⚡",
  psíquico: "🔮", psiquico: "🔮", psychic: "🔮",
  lutador: "🥊", fighting: "🥊",
  incolor: "⭐", colorless: "⭐", normal: "⭐",
  sombrio: "🌑", dark: "🌑", darkness: "🌑",
  metal: "⚙️", steel: "⚙️",
  dragão: "🐉", dragao: "🐉", dragon: "🐉",
  fada: "✨", fairy: "✨",
  veneno: "☠️", poison: "☠️",
  gelo: "❄️", ice: "❄️",
};

function getTipoIcon(nome: string) {
  const key = nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const [k, v] of Object.entries(TIPO_ICONS)) {
    if (key.includes(k)) return v;
  }
  return "🏷️";
}

export default function TiposPage() {
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [pageInfo, setPageInfo] = useState({ number: 0, totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [form, setForm] = useState({ nome: "" });
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tipo | null>(null);

  // Many-to-Many management
  const [assocTipo, setAssocTipo] = useState<Tipo | null>(null);
  const [assocCartas, setAssocCartas] = useState<Carta[]>([]);
  const [assocLoading, setAssocLoading] = useState(false);
  const [cartaIdInput, setCartaIdInput] = useState("");
  const [assocSaving, setAssocSaving] = useState(false);

  const load = useCallback(async (page = 0, nome = "") => {
    setLoading(true);
    try {
      const path = nome
        ? `/tipos/buscar?nome=${encodeURIComponent(nome)}&page=${page}&size=10`
        : `/tipos?page=${page}&size=10`;
      const data = await get<PagedResponse<Tipo>>(path);
      setTipos(extractList(data, "tipoList"));
      setPageInfo({
        number: data.page.number,
        totalPages: data.page.totalPages,
        totalElements: data.page.totalElements,
      });
    } catch (e) {
      const err = e as ApiError;
      setToast({ message: err.mensagem ?? "Erro ao carregar tipos", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0, search);
  }, [load, search]);

  async function openAssoc(tipo: Tipo) {
    setAssocTipo(tipo);
    setAssocCartas([]);
    setCartaIdInput("");
    setAssocLoading(true);
    try {
      const data = await get<Tipo & { cartas?: Carta[] }>(`/tipos/${tipo.id}`);
      setAssocCartas(data.cartas ?? []);
    } catch (e) {
      const err = e as ApiError;
      setToast({ message: err.mensagem ?? "Erro ao carregar cartas do tipo", type: "error" });
    } finally {
      setAssocLoading(false);
    }
  }

  async function adicionarCarta() {
    if (!assocTipo || !cartaIdInput.trim()) return;
    setAssocSaving(true);
    try {
      await post(`/tipos/${assocTipo.id}/cartas/${cartaIdInput.trim()}`, null);
      setToast({ message: "Carta associada com sucesso!", type: "success" });
      setCartaIdInput("");
      await openAssoc(assocTipo);
    } catch (e) {
      const err = e as ApiError;
      setToast({ message: err.mensagem ?? "Erro ao associar carta", type: "error" });
    } finally {
      setAssocSaving(false);
    }
  }

  async function removerCarta(cartaId: number) {
    if (!assocTipo) return;
    try {
      await del(`/tipos/${assocTipo.id}/cartas/${cartaId}`);
      setToast({ message: "Associação removida.", type: "success" });
      setAssocCartas((prev) => prev.filter((c) => c.id !== cartaId));
    } catch (e) {
      const err = e as ApiError;
      setToast({ message: err.mensagem ?? "Erro ao remover associação", type: "error" });
    }
  }

  function openCreate() {
    setForm({ nome: "" });
    setEditId(null);
    setView("create");
  }

  function openEdit(t: Tipo) {
    setForm({ nome: t.nome });
    setEditId(t.id);
    setView("edit");
  }

  function closeModal() {
    setView("list");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (view === "create") {
        await post("/tipos", form);
        setToast({ message: "Tipo criado com sucesso!", type: "success" });
      } else {
        await put(`/tipos/${editId}`, form);
        setToast({ message: "Tipo atualizado com sucesso!", type: "success" });
      }
      closeModal();
      load(pageInfo.number, search);
    } catch (e) {
      const err = e as ApiError;
      setToast({ message: err.mensagem ?? "Erro ao salvar", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(t: Tipo) {
    try {
      await del(`/tipos/${t.id}`);
      setToast({ message: `Tipo "${t.nome}" removido.`, type: "success" });
      setDeleteTarget(null);
      load(pageInfo.number, search);
    } catch (e) {
      const err = e as ApiError;
      setToast({ message: err.mensagem ?? "Erro ao deletar", type: "error" });
      setDeleteTarget(null);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-pk-blue">🔥 Tipos</h1>
          <p className="text-gray-500 text-sm">Tipos de energia das cartas (Many-to-Many com Carta)</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-pk-red hover:bg-pk-red-dark text-white font-bold px-4 py-2 rounded-lg transition-colors"
        >
          + Novo Tipo
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por nome..."
          className="flex-1 border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red"
        />
        <button
          type="submit"
          className="bg-pk-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pk-blue-light transition-colors"
        >
          Buscar
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(""); setSearchInput(""); }}
            className="px-3 py-2 rounded-lg border border-pk-border text-sm hover:bg-pk-gray transition-colors"
          >
            Limpar
          </button>
        )}
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-pk-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : tipos.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {search ? `Nenhum tipo encontrado para "${search}"` : "Nenhum tipo cadastrado."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-pk-blue text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold w-12">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                <th className="px-4 py-3 text-center font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tipos.map((t, i) => (
                <tr key={t.id} className={i % 2 === 0 ? "bg-white" : "bg-pk-gray"}>
                  <td className="px-4 py-3 text-gray-400 font-mono">{t.id}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium text-pk-blue">
                      <span className="text-xl">{getTipoIcon(t.nome)}</span>
                      {t.nome}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => openAssoc(t)}
                        className="px-3 py-1 bg-pk-yellow text-pk-blue rounded text-xs font-bold hover:bg-pk-yellow-dark transition-colors"
                      >
                        Cartas
                      </button>
                      <button
                        onClick={() => openEdit(t)}
                        className="px-3 py-1 bg-pk-blue text-white rounded text-xs font-medium hover:bg-pk-blue-light transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        className="px-3 py-1 bg-pk-red text-white rounded text-xs font-medium hover:bg-pk-red-dark transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        page={pageInfo.number}
        totalPages={pageInfo.totalPages}
        totalElements={pageInfo.totalElements}
        onPage={(p) => load(p, search)}
      />

      {/* Create / Edit Modal */}
      {(view === "create" || view === "edit") && (
        <Modal
          title={view === "create" ? "Novo Tipo" : "Editar Tipo"}
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nome <span className="text-pk-red">*</span>
              </label>
              <input
                type="text"
                required
                value={form.nome}
                onChange={(e) => setForm({ nome: e.target.value })}
                className="w-full border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red"
                placeholder="ex: Fogo, Água, Grama..."
              />
              {form.nome && (
                <p className="mt-1 text-2xl">{getTipoIcon(form.nome)}</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-pk-red hover:bg-pk-red-dark text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? "Salvando..." : view === "create" ? "Criar Tipo" : "Salvar"}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-pk-border rounded-lg text-sm hover:bg-pk-gray transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Many-to-Many: Cartas do Tipo */}
      {assocTipo && (
        <Modal
          title={`${getTipoIcon(assocTipo.nome)} Cartas — ${assocTipo.nome}`}
          onClose={() => setAssocTipo(null)}
        >
          <div className="flex flex-col gap-4">
            {/* Add carta */}
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={cartaIdInput}
                onChange={(e) => setCartaIdInput(e.target.value)}
                placeholder="ID da carta"
                className="flex-1 border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red"
              />
              <button
                onClick={adicionarCarta}
                disabled={assocSaving || !cartaIdInput.trim()}
                className="px-4 py-2 bg-pk-blue text-white text-sm font-medium rounded-lg hover:bg-pk-blue-light disabled:opacity-50 transition-colors"
              >
                + Associar
              </button>
            </div>

            {/* Carta list */}
            {assocLoading ? (
              <div className="text-center text-gray-400 py-4">Carregando...</div>
            ) : assocCartas.length === 0 ? (
              <div className="text-center text-gray-400 py-4">
                Nenhuma carta associada a este tipo.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {assocCartas.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between bg-pk-gray rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      {c.imagemUrl && (
                        <img
                          src={c.imagemUrl}
                          alt={c.nome}
                          className="h-8 w-6 object-cover rounded"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      <div>
                        <p className="font-medium text-sm text-pk-blue">{c.nome}</p>
                        <p className="text-xs text-gray-400">ID: {c.id}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removerCarta(c.id)}
                      className="px-2 py-1 bg-pk-red text-white rounded text-xs font-medium hover:bg-pk-red-dark transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <Modal title="Confirmar Exclusão" onClose={() => setDeleteTarget(null)}>
          <p className="text-gray-700 mb-4">
            Deseja excluir o tipo <strong>"{deleteTarget.nome}"</strong>?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleDelete(deleteTarget)}
              className="flex-1 bg-pk-red hover:bg-pk-red-dark text-white font-bold py-2 rounded-lg transition-colors"
            >
              Excluir
            </button>
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 border border-pk-border rounded-lg py-2 text-sm hover:bg-pk-gray transition-colors"
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
