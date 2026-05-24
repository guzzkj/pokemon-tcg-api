"use client";

import { useCallback, useEffect, useState } from "react";
import { get, post, put, del, extractList } from "@/lib/api";
import { DetalheEstatistica, PagedResponse, ApiError } from "@/lib/types";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import Toast from "@/components/Toast";

type View = "list" | "create" | "edit";

interface DetalheForm {
  raridade: string;
  artista: string;
  descricao: string;
  evolucaoDe: string;
  cartaId: string;
}

const emptyForm: DetalheForm = {
  raridade: "",
  artista: "",
  descricao: "",
  evolucaoDe: "",
  cartaId: "",
};

export default function DetalhesPage() {
  const [detalhes, setDetalhes] = useState<DetalheEstatistica[]>([]);
  const [pageInfo, setPageInfo] = useState({ number: 0, totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [form, setForm] = useState<DetalheForm>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [artistaSearch, setArtistaSearch] = useState("");
  const [artistaInput, setArtistaInput] = useState("");
  const [cartaIdSearch, setCartaIdSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DetalheEstatistica | null>(null);

  const load = useCallback(async (page = 0, artista = "") => {
    setLoading(true);
    try {
      const path = artista
        ? `/detalhes/buscar?artista=${encodeURIComponent(artista)}&page=${page}&size=10`
        : `/detalhes?page=${page}&size=10`;
      const data = await get<PagedResponse<DetalheEstatistica>>(path);
      setDetalhes(extractList(data, "detalheEstatisticaList"));
      setPageInfo({
        number: data.page.number,
        totalPages: data.page.totalPages,
        totalElements: data.page.totalElements,
      });
    } catch (e) {
      const err = e as ApiError;
      setToast({ message: err.mensagem ?? "Erro ao carregar detalhes", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0, artistaSearch);
  }, [load, artistaSearch]);

  async function buscarPorCarta(e: React.FormEvent) {
    e.preventDefault();
    if (!cartaIdSearch.trim()) return;
    setLoading(true);
    try {
      const data = await get<DetalheEstatistica>(`/detalhes/carta/${cartaIdSearch.trim()}`);
      setDetalhes([data]);
      setPageInfo({ number: 0, totalPages: 1, totalElements: 1 });
    } catch (e) {
      const err = e as ApiError;
      setToast({ message: err.mensagem ?? "Detalhe não encontrado para esta carta", type: "error" });
      setDetalhes([]);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(emptyForm);
    setEditId(null);
    setView("create");
  }

  function openEdit(d: DetalheEstatistica) {
    setForm({
      raridade: d.raridade ?? "",
      artista: d.artista ?? "",
      descricao: d.descricao ?? "",
      evolucaoDe: d.evolucaoDe ?? "",
      cartaId: d.carta?.id?.toString() ?? "",
    });
    setEditId(d.id);
    setView("edit");
  }

  function closeModal() {
    setView("list");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        raridade: form.raridade || undefined,
        artista: form.artista || undefined,
        descricao: form.descricao || undefined,
        evolucaoDe: form.evolucaoDe || undefined,
      };

      if (view === "create") {
        if (!form.cartaId) {
          setToast({ message: "Informe o ID da carta", type: "error" });
          setSaving(false);
          return;
        }
        await post(`/detalhes/carta/${form.cartaId}`, payload);
        setToast({ message: "Detalhe criado com sucesso!", type: "success" });
      } else {
        await put(`/detalhes/${editId}`, payload);
        setToast({ message: "Detalhe atualizado com sucesso!", type: "success" });
      }
      closeModal();
      load(pageInfo.number, artistaSearch);
    } catch (e) {
      const err = e as ApiError;
      setToast({ message: err.mensagem ?? "Erro ao salvar", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(d: DetalheEstatistica) {
    try {
      await del(`/detalhes/${d.id}`);
      setToast({ message: "Detalhe removido.", type: "success" });
      setDeleteTarget(null);
      load(pageInfo.number, artistaSearch);
    } catch (e) {
      const err = e as ApiError;
      setToast({ message: err.mensagem ?? "Erro ao deletar", type: "error" });
      setDeleteTarget(null);
    }
  }

  function handleArtistaSearch(e: React.FormEvent) {
    e.preventDefault();
    setCartaIdSearch("");
    setArtistaSearch(artistaInput);
  }

  function limparFiltros() {
    setArtistaSearch("");
    setArtistaInput("");
    setCartaIdSearch("");
    load(0, "");
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-pk-blue">📊 Detalhes Estatísticos</h1>
          <p className="text-gray-500 text-sm">Raridade, artista e lore (1:1 com Carta)</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-pk-red hover:bg-pk-red-dark text-white font-bold px-4 py-2 rounded-lg transition-colors"
        >
          + Novo Detalhe
        </button>
      </div>

      {/* Filters */}
      <div className="grid md:grid-cols-2 gap-2 mb-4">
        <form onSubmit={handleArtistaSearch} className="flex gap-2">
          <input
            type="text"
            value={artistaInput}
            onChange={(e) => setArtistaInput(e.target.value)}
            placeholder="Buscar por artista..."
            className="flex-1 border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red"
          />
          <button
            type="submit"
            className="bg-pk-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pk-blue-light transition-colors"
          >
            Buscar
          </button>
        </form>

        <form onSubmit={buscarPorCarta} className="flex gap-2">
          <input
            type="number"
            min="1"
            value={cartaIdSearch}
            onChange={(e) => setCartaIdSearch(e.target.value)}
            placeholder="ID da carta..."
            className="flex-1 border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red"
          />
          <button
            type="submit"
            className="bg-pk-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pk-blue-light transition-colors"
          >
            Por Carta
          </button>
          {(artistaSearch || cartaIdSearch) && (
            <button
              type="button"
              onClick={limparFiltros}
              className="px-3 py-2 rounded-lg border border-pk-border text-sm hover:bg-pk-gray transition-colors"
            >
              Limpar
            </button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-pk-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : detalhes.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhum detalhe encontrado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-pk-blue text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Carta</th>
                <th className="px-4 py-3 text-left font-semibold">Raridade</th>
                <th className="px-4 py-3 text-left font-semibold">Artista</th>
                <th className="px-4 py-3 text-left font-semibold">Evolui De</th>
                <th className="px-4 py-3 text-center font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {detalhes.map((d, i) => (
                <tr key={d.id} className={i % 2 === 0 ? "bg-white" : "bg-pk-gray"}>
                  <td className="px-4 py-3 text-gray-400 font-mono">{d.id}</td>
                  <td className="px-4 py-3">
                    {d.carta ? (
                      <div>
                        <p className="font-medium text-pk-blue">{d.carta.nome}</p>
                        <p className="text-xs text-gray-400">ID: {d.carta.id}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {d.raridade ? (
                      <span className="bg-pk-yellow text-pk-blue font-bold px-2 py-0.5 rounded-full text-xs">
                        {d.raridade}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 italic">
                    {d.artista ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {d.evolucaoDe ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => openEdit(d)}
                        className="px-3 py-1 bg-pk-blue text-white rounded text-xs font-medium hover:bg-pk-blue-light transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteTarget(d)}
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
        onPage={(p) => load(p, artistaSearch)}
      />

      {/* Create / Edit Modal */}
      {(view === "create" || view === "edit") && (
        <Modal
          title={view === "create" ? "Novo Detalhe Estatístico" : "Editar Detalhe"}
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {view === "create" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  ID da Carta <span className="text-pk-red">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.cartaId}
                  onChange={(e) => setForm({ ...form, cartaId: e.target.value })}
                  className="w-full border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red"
                  placeholder="ex: 1"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Cada carta pode ter apenas um detalhe (1:1)
                </p>
              </div>
            )}

            {view === "edit" && form.cartaId && (
              <div className="bg-pk-gray rounded-lg px-3 py-2 text-sm text-gray-600">
                Carta ID: <strong>{form.cartaId}</strong> (não alterável)
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Raridade</label>
                <input
                  type="text"
                  value={form.raridade}
                  onChange={(e) => setForm({ ...form, raridade: e.target.value })}
                  className="w-full border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red"
                  placeholder="ex: Rare Holo"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Artista</label>
                <input
                  type="text"
                  value={form.artista}
                  onChange={(e) => setForm({ ...form, artista: e.target.value })}
                  className="w-full border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red"
                  placeholder="ex: Mitsuhiro Arita"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Evolui De</label>
              <input
                type="text"
                value={form.evolucaoDe}
                onChange={(e) => setForm({ ...form, evolucaoDe: e.target.value })}
                className="w-full border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red"
                placeholder="ex: Charmeleon"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Descrição (Flavor Text)
              </label>
              <textarea
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="w-full border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red resize-none"
                placeholder="ex: Spits fire that is hot enough to melt boulders."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-pk-red hover:bg-pk-red-dark text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? "Salvando..." : view === "create" ? "Criar Detalhe" : "Salvar Alterações"}
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

      {/* Delete Confirm */}
      {deleteTarget && (
        <Modal title="Confirmar Exclusão" onClose={() => setDeleteTarget(null)}>
          <p className="text-gray-700 mb-4">
            Deseja excluir o detalhe da carta{" "}
            <strong>"{deleteTarget.carta?.nome ?? `ID ${deleteTarget.id}`}"</strong>?
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
