"use client";

import { useCallback, useEffect, useState } from "react";
import { get, post, put, del, extractList } from "@/lib/api";
import { Serie, PagedResponse, ApiError } from "@/lib/types";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import Toast from "@/components/Toast";

type View = "list" | "create" | "edit";

const empty: Omit<Serie, "id"> = { nome: "", idExterno: "", logoUrl: "" };

export default function SeriesPage() {
  const [series, setSeries] = useState<Serie[]>([]);
  const [pageInfo, setPageInfo] = useState({ number: 0, totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [form, setForm] = useState<Omit<Serie, "id">>(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Serie | null>(null);

  const load = useCallback(async (page = 0, nome = "") => {
    setLoading(true);
    try {
      const path = nome
        ? `/series/buscar?nome=${encodeURIComponent(nome)}&page=${page}&size=10`
        : `/series?page=${page}&size=10`;
      const data = await get<PagedResponse<Serie>>(path);
      setSeries(extractList(data, "serieList"));
      setPageInfo({
        number: data.page.number,
        totalPages: data.page.totalPages,
        totalElements: data.page.totalElements,
      });
    } catch (e) {
      const err = e as ApiError;
      setToast({ message: err.mensagem ?? "Erro ao carregar séries", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0, search);
  }, [load, search]);

  function openCreate() {
    setForm(empty);
    setEditId(null);
    setView("create");
  }

  function openEdit(s: Serie) {
    setForm({ nome: s.nome, idExterno: s.idExterno ?? "", logoUrl: s.logoUrl ?? "" });
    setEditId(s.id);
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
        await post("/series", form);
        setToast({ message: "Série criada com sucesso!", type: "success" });
      } else {
        await put(`/series/${editId}`, form);
        setToast({ message: "Série atualizada com sucesso!", type: "success" });
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

  async function handleDelete(s: Serie) {
    try {
      await del(`/series/${s.id}`);
      setToast({ message: `Série "${s.nome}" removida.`, type: "success" });
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
          <h1 className="text-2xl font-black text-pk-blue">📚 Séries</h1>
          <p className="text-gray-500 text-sm">Gerenciar séries do Pokémon TCG</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-pk-red hover:bg-pk-red-dark text-white font-bold px-4 py-2 rounded-lg transition-colors"
        >
          + Nova Série
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
        ) : series.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {search ? `Nenhuma série encontrada para "${search}"` : "Nenhuma série cadastrada."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-pk-blue text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Nome</th>
                <th className="px-4 py-3 text-left font-semibold">ID Externo</th>
                <th className="px-4 py-3 text-left font-semibold">Logo</th>
                <th className="px-4 py-3 text-center font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {series.map((s, i) => (
                <tr
                  key={s.id}
                  className={i % 2 === 0 ? "bg-white" : "bg-pk-gray"}
                >
                  <td className="px-4 py-3 text-gray-400 font-mono">{s.id}</td>
                  <td className="px-4 py-3 font-medium text-pk-blue">{s.nome}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{s.idExterno || "—"}</td>
                  <td className="px-4 py-3">
                    {s.logoUrl ? (
                      <img
                        src={s.logoUrl}
                        alt={s.nome}
                        className="h-8 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => openEdit(s)}
                        className="px-3 py-1 bg-pk-blue text-white rounded text-xs font-medium hover:bg-pk-blue-light transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteTarget(s)}
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
          title={view === "create" ? "Nova Série" : "Editar Série"}
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
                placeholder="ex: Base"
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
                placeholder="ex: base"
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
                {saving ? "Salvando..." : view === "create" ? "Criar Série" : "Salvar Alterações"}
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

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <Modal title="Confirmar Exclusão" onClose={() => setDeleteTarget(null)}>
          <p className="text-gray-700 mb-4">
            Deseja excluir a série <strong>"{deleteTarget.nome}"</strong>?
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
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
