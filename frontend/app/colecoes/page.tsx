"use client";

import { useCallback, useEffect, useState } from "react";
import { get, post, put, del, extractList } from "@/lib/api";
import { Colecao, Serie, PagedResponse, ApiError } from "@/lib/types";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import Toast from "@/components/Toast";

type View = "list" | "create" | "edit";

interface ColecaoForm {
  nome: string;
  codigoExterno: string;
  logoUrl: string;
  totalDeCartas: string;
  serieId: string;
}

const emptyForm: ColecaoForm = {
  nome: "",
  codigoExterno: "",
  logoUrl: "",
  totalDeCartas: "",
  serieId: "",
};

function toPayload(form: ColecaoForm) {
  return {
    nome: form.nome,
    codigoExterno: form.codigoExterno || undefined,
    logoUrl: form.logoUrl || undefined,
    totalDeCartas: form.totalDeCartas ? parseInt(form.totalDeCartas) : undefined,
    serie: form.serieId ? { id: parseInt(form.serieId) } : undefined,
  };
}

export default function ColecoesPage() {
  const [colecoes, setColecoes] = useState<Colecao[]>([]);
  const [series, setSeries] = useState<Serie[]>([]);
  const [pageInfo, setPageInfo] = useState({ number: 0, totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [form, setForm] = useState<ColecaoForm>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Colecao | null>(null);

  const loadSeries = useCallback(async () => {
    try {
      const data = await get<PagedResponse<Serie>>("/series?size=100");
      setSeries(extractList(data, "serieList"));
    } catch {
      // non-critical — série dropdown may be empty
    }
  }, []);

  const load = useCallback(async (page = 0, nome = "") => {
    setLoading(true);
    try {
      const path = nome
        ? `/colecoes/buscar?nome=${encodeURIComponent(nome)}&page=${page}&size=10`
        : `/colecoes?page=${page}&size=10`;
      const data = await get<PagedResponse<Colecao>>(path);
      setColecoes(extractList(data, "colecaoList"));
      setPageInfo({
        number: data.page.number,
        totalPages: data.page.totalPages,
        totalElements: data.page.totalElements,
      });
    } catch (e) {
      const err = e as ApiError;
      setToast({ message: err.mensagem ?? "Erro ao carregar coleções", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0, search);
    loadSeries();
  }, [load, loadSeries, search]);

  function openCreate() {
    setForm(emptyForm);
    setEditId(null);
    setView("create");
  }

  function openEdit(c: Colecao) {
    setForm({
      nome: c.nome,
      codigoExterno: c.codigoExterno ?? "",
      logoUrl: c.logoUrl ?? "",
      totalDeCartas: c.totalDeCartas?.toString() ?? "",
      serieId: c.serie?.id?.toString() ?? "",
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
        await post("/colecoes", payload);
        setToast({ message: "Coleção criada com sucesso!", type: "success" });
      } else {
        await put(`/colecoes/${editId}`, payload);
        setToast({ message: "Coleção atualizada com sucesso!", type: "success" });
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

  async function handleDelete(c: Colecao) {
    try {
      await del(`/colecoes/${c.id}`);
      setToast({ message: `Coleção "${c.nome}" removida.`, type: "success" });
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
          <h1 className="text-2xl font-black text-pk-blue">🗂️ Coleções</h1>
          <p className="text-gray-500 text-sm">Sets de cartas por série</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-pk-red hover:bg-pk-red-dark text-white font-bold px-4 py-2 rounded-lg transition-colors"
        >
          + Nova Coleção
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
        ) : colecoes.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {search ? `Nenhuma coleção encontrada para "${search}"` : "Nenhuma coleção cadastrada."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-pk-blue text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Nome</th>
                <th className="px-4 py-3 text-left font-semibold">Série</th>
                <th className="px-4 py-3 text-left font-semibold">Cód. Externo</th>
                <th className="px-4 py-3 text-center font-semibold">Cartas</th>
                <th className="px-4 py-3 text-center font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {colecoes.map((c, i) => (
                <tr key={c.id} className={i % 2 === 0 ? "bg-white" : "bg-pk-gray"}>
                  <td className="px-4 py-3 text-gray-400 font-mono">{c.id}</td>
                  <td className="px-4 py-3 font-medium text-pk-blue">{c.nome}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.serie?.nome ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {c.codigoExterno || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.totalDeCartas != null ? (
                      <span className="bg-pk-yellow text-pk-blue font-bold px-2 py-0.5 rounded-full text-xs">
                        {c.totalDeCartas}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
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
        onPage={(p) => load(p, search)}
      />

      {/* Create / Edit Modal */}
      {(view === "create" || view === "edit") && (
        <Modal
          title={view === "create" ? "Nova Coleção" : "Editar Coleção"}
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
                placeholder="ex: Base Set"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Série
              </label>
              <select
                value={form.serieId}
                onChange={(e) => setForm({ ...form, serieId: e.target.value })}
                className="w-full border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red bg-white"
              >
                <option value="">— sem série —</option>
                {series.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Código Externo
              </label>
              <input
                type="text"
                value={form.codigoExterno}
                onChange={(e) => setForm({ ...form, codigoExterno: e.target.value })}
                className="w-full border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red"
                placeholder="ex: base1"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Total de Cartas
              </label>
              <input
                type="number"
                min="0"
                value={form.totalDeCartas}
                onChange={(e) => setForm({ ...form, totalDeCartas: e.target.value })}
                className="w-full border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red"
                placeholder="ex: 102"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                URL do Logo
              </label>
              <input
                type="url"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                className="w-full border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red"
                placeholder="https://..."
              />
              {form.logoUrl && (
                <img
                  src={form.logoUrl}
                  alt="preview"
                  className="mt-2 h-10 object-contain"
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
                {saving ? "Salvando..." : view === "create" ? "Criar Coleção" : "Salvar Alterações"}
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
            Deseja excluir a coleção <strong>"{deleteTarget.nome}"</strong>?
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
