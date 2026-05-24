"use client";

import { useCallback, useEffect, useState } from "react";
import { get, post, put, del, extractList } from "@/lib/api";
import { Carta, Colecao, PagedResponse, ApiError } from "@/lib/types";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import Toast from "@/components/Toast";

type View = "list" | "create" | "edit";
type Categoria = "POKEMON" | "TREINADOR" | "ENERGIA";

interface CartaForm {
  nome: string;
  categoria: Categoria;
  pontosDeVida: string;
  imagemUrl: string;
  idExterno: string;
  numeroLocal: string;
  colecaoId: string;
}

const emptyForm: CartaForm = {
  nome: "",
  categoria: "POKEMON",
  pontosDeVida: "",
  imagemUrl: "",
  idExterno: "",
  numeroLocal: "",
  colecaoId: "",
};

const categoriaBadge: Record<Categoria, string> = {
  POKEMON: "bg-pk-red text-white",
  TREINADOR: "bg-pk-blue text-white",
  ENERGIA: "bg-pk-yellow text-pk-blue",
};

function toPayload(form: CartaForm) {
  return {
    nome: form.nome,
    categoria: form.categoria,
    pontosDeVida: form.pontosDeVida ? parseInt(form.pontosDeVida) : undefined,
    imagemUrl: form.imagemUrl || undefined,
    idExterno: form.idExterno || undefined,
    numeroLocal: form.numeroLocal || undefined,
    colecao: form.colecaoId ? { id: parseInt(form.colecaoId) } : undefined,
  };
}

export default function CartasPage() {
  const [cartas, setCartas] = useState<Carta[]>([]);
  const [colecoes, setColecoes] = useState<Colecao[]>([]);
  const [pageInfo, setPageInfo] = useState({ number: 0, totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [form, setForm] = useState<CartaForm>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterColecao, setFilterColecao] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Carta | null>(null);

  const loadColecoes = useCallback(async () => {
    try {
      const data = await get<PagedResponse<Colecao>>("/colecoes?size=200");
      setColecoes(extractList(data, "colecaoList"));
    } catch {
      // non-critical
    }
  }, []);

  const load = useCallback(async (page = 0, nome = "", colecaoId = "") => {
    setLoading(true);
    try {
      let path: string;
      if (colecaoId) {
        path = `/colecoes/${colecaoId}/cartas?page=${page}&size=10`;
      } else if (nome) {
        path = `/cartas/buscar?nome=${encodeURIComponent(nome)}&page=${page}&size=10`;
      } else {
        path = `/cartas?page=${page}&size=10`;
      }
      const data = await get<PagedResponse<Carta>>(path);
      setCartas(extractList(data, "cartaList"));
      setPageInfo({
        number: data.page.number,
        totalPages: data.page.totalPages,
        totalElements: data.page.totalElements,
      });
    } catch (e) {
      const err = e as ApiError;
      setToast({ message: err.mensagem ?? "Erro ao carregar cartas", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0, search, filterColecao);
    loadColecoes();
  }, [load, loadColecoes, search, filterColecao]);

  function openCreate() {
    setForm(emptyForm);
    setEditId(null);
    setView("create");
  }

  function openEdit(c: Carta) {
    setForm({
      nome: c.nome,
      categoria: c.categoria,
      pontosDeVida: c.pontosDeVida?.toString() ?? "",
      imagemUrl: c.imagemUrl ?? "",
      idExterno: c.idExterno ?? "",
      numeroLocal: c.numeroLocal ?? "",
      colecaoId: c.colecao?.id?.toString() ?? "",
    });
    setEditId(c.id);
    setView("edit");
  }

  function closeModal() {
    setView("list");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = toPayload(form);
      if (view === "create") {
        await post("/cartas", payload);
        setToast({ message: "Carta criada com sucesso!", type: "success" });
      } else {
        await put(`/cartas/${editId}`, payload);
        setToast({ message: "Carta atualizada com sucesso!", type: "success" });
      }
      closeModal();
      load(pageInfo.number, search, filterColecao);
    } catch (e) {
      const err = e as ApiError;
      setToast({ message: err.mensagem ?? "Erro ao salvar", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Carta) {
    try {
      await del(`/cartas/${c.id}`);
      setToast({ message: `Carta "${c.nome}" removida.`, type: "success" });
      setDeleteTarget(null);
      load(pageInfo.number, search, filterColecao);
    } catch (e) {
      const err = e as ApiError;
      setToast({ message: err.mensagem ?? "Erro ao deletar", type: "error" });
      setDeleteTarget(null);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilterColecao("");
    setSearch(searchInput);
  }

  function handleColecaoFilter(id: string) {
    setFilterColecao(id);
    setSearch("");
    setSearchInput("");
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-pk-blue">🃏 Cartas</h1>
          <p className="text-gray-500 text-sm">CRUD completo de cartas do TCG</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-pk-red hover:bg-pk-red-dark text-white font-bold px-4 py-2 rounded-lg transition-colors"
        >
          + Nova Carta
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nome (mín. 2 chars)..."
            className="flex-1 border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red"
          />
          <button
            type="submit"
            className="bg-pk-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pk-blue-light transition-colors"
          >
            Buscar
          </button>
          {(search || filterColecao) && (
            <button
              type="button"
              onClick={() => { setSearch(""); setSearchInput(""); setFilterColecao(""); }}
              className="px-3 py-2 rounded-lg border border-pk-border text-sm hover:bg-pk-gray transition-colors"
            >
              Limpar
            </button>
          )}
        </form>
        <select
          value={filterColecao}
          onChange={(e) => handleColecaoFilter(e.target.value)}
          className="border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red bg-white md:w-56"
        >
          <option value="">Filtrar por coleção...</option>
          {colecoes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-pk-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : cartas.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhuma carta encontrada.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-pk-blue text-white">
              <tr>
                <th className="px-3 py-3 text-left font-semibold w-12">Img</th>
                <th className="px-3 py-3 text-left font-semibold">Nome</th>
                <th className="px-3 py-3 text-left font-semibold">Categoria</th>
                <th className="px-3 py-3 text-left font-semibold">HP</th>
                <th className="px-3 py-3 text-left font-semibold">Coleção</th>
                <th className="px-3 py-3 text-left font-semibold">Nº</th>
                <th className="px-3 py-3 text-center font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {cartas.map((c, i) => (
                <tr key={c.id} className={i % 2 === 0 ? "bg-white" : "bg-pk-gray"}>
                  <td className="px-3 py-2">
                    {c.imagemUrl ? (
                      <img
                        src={c.imagemUrl}
                        alt={c.nome}
                        className="h-10 w-7 object-cover rounded"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="h-10 w-7 bg-gray-100 rounded flex items-center justify-center text-gray-300 text-xs">
                        ?
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium text-pk-blue">{c.nome}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${categoriaBadge[c.categoria]}`}>
                      {c.categoria}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {c.pontosDeVida != null ? `${c.pontosDeVida} HP` : "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-500 text-xs">
                    {c.colecao?.nome ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-400 font-mono text-xs">
                    {c.numeroLocal ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => openEdit(c)}
                        className="px-3 py-1 bg-pk-blue text-white rounded text-xs font-medium hover:bg-pk-blue-light transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteTarget(c)}
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
        onPage={(p) => load(p, search, filterColecao)}
      />

      {/* Create / Edit Modal */}
      {(view === "create" || view === "edit") && (
        <Modal
          title={view === "create" ? "Nova Carta" : "Editar Carta"}
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
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="w-full border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red"
                placeholder="ex: Charizard"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Categoria <span className="text-pk-red">*</span>
              </label>
              <select
                required
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value as Categoria })}
                className="w-full border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red bg-white"
              >
                <option value="POKEMON">POKEMON</option>
                <option value="TREINADOR">TREINADOR</option>
                <option value="ENERGIA">ENERGIA</option>
              </select>
            </div>

            {form.categoria === "POKEMON" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Pontos de Vida (HP)
                </label>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={form.pontosDeVida}
                  onChange={(e) => setForm({ ...form, pontosDeVida: e.target.value })}
                  className="w-full border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red"
                  placeholder="ex: 120"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Coleção
              </label>
              <select
                value={form.colecaoId}
                onChange={(e) => setForm({ ...form, colecaoId: e.target.value })}
                className="w-full border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red bg-white"
              >
                <option value="">— sem coleção —</option>
                {colecoes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Número Local
                </label>
                <input
                  type="text"
                  value={form.numeroLocal}
                  onChange={(e) => setForm({ ...form, numeroLocal: e.target.value })}
                  className="w-full border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red"
                  placeholder="ex: 4"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  ID Externo
                </label>
                <input
                  type="text"
                  value={form.idExterno}
                  onChange={(e) => setForm({ ...form, idExterno: e.target.value })}
                  className="w-full border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red"
                  placeholder="ex: base1-4"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                URL da Imagem
              </label>
              <input
                type="url"
                value={form.imagemUrl}
                onChange={(e) => setForm({ ...form, imagemUrl: e.target.value })}
                className="w-full border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red"
                placeholder="https://..."
              />
              {form.imagemUrl && (
                <img
                  src={form.imagemUrl}
                  alt="preview"
                  className="mt-2 h-24 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-pk-red hover:bg-pk-red-dark text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? "Salvando..." : view === "create" ? "Criar Carta" : "Salvar Alterações"}
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
            Deseja excluir a carta <strong>"{deleteTarget.nome}"</strong>?
            Esta ação não pode ser desfeita.
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
