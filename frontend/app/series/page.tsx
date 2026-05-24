"use client";

import { useCallback, useEffect, useState } from "react";
import { get, post, put, del, extractList } from "@/lib/api";
import { Serie, PagedResponse, ApiError } from "@/lib/types";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import Toast from "@/components/Toast";
import { Field, Input } from "@/components/Field";
import { BookMarked, Plus, Search, X, Pencil, Trash2 } from "lucide-react";

type View = "list" | "create" | "edit";
const empty = { nome: "", idExterno: "", logoUrl: "" };

export default function SeriesPage() {
  const [series, setSeries] = useState<Serie[]>([]);
  const [pageInfo, setPageInfo] = useState({ number: 0, totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [form, setForm] = useState(empty);
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
      setPageInfo({ number: data.page.number, totalPages: data.page.totalPages, totalElements: data.page.totalElements });
    } catch (e) {
      setToast({ message: (e as ApiError).mensagem ?? "Erro ao carregar", type: "error" });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(0, search); }, [load, search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (view === "create") { await post("/series", form); setToast({ message: "Série criada!", type: "success" }); }
      else { await put(`/series/${editId}`, form); setToast({ message: "Série atualizada!", type: "success" }); }
      setView("list");
      load(pageInfo.number, search);
    } catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Erro ao salvar", type: "error" }); }
    finally { setSaving(false); }
  }

  async function handleDelete(s: Serie) {
    try {
      await del(`/series/${s.id}`);
      setToast({ message: `"${s.nome}" removida.`, type: "success" });
      setDeleteTarget(null);
      load(pageInfo.number, search);
    } catch (e) {
      setToast({ message: (e as ApiError).mensagem ?? "Erro ao deletar", type: "error" });
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-pk-surface-2 border border-pk-border rounded-lg flex items-center justify-center">
            <BookMarked size={18} className="text-pk-red" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-pk-text">Séries</h1>
            <p className="text-pk-subtle text-xs">Gerenciar séries do Pokémon TCG</p>
          </div>
        </div>
        <button
          onClick={() => { setForm(empty); setEditId(null); setView("create"); }}
          className="flex items-center gap-2 bg-pk-red hover:bg-pk-red-dark text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm cursor-pointer"
        >
          <Plus size={16} />
          Nova Série
        </button>
      </div>

      {/* Search */}
      <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-pk-subtle" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full bg-pk-surface border border-pk-border rounded-lg pl-9 pr-3 py-2 text-sm text-pk-text placeholder:text-pk-subtle focus:outline-none focus:border-pk-red transition-colors"
          />
        </div>
        <button type="submit" className="bg-pk-surface-2 border border-pk-border px-4 py-2 rounded-lg text-sm text-pk-muted hover:text-pk-text hover:border-pk-border-2 transition-colors cursor-pointer">
          Buscar
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(""); setSearchInput(""); }}
            className="p-2 text-pk-muted hover:text-pk-text transition-colors cursor-pointer">
            <X size={16} />
          </button>
        )}
      </form>

      {/* Table */}
      <div className="bg-pk-surface border border-pk-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-pk-subtle text-sm">Carregando...</div>
        ) : series.length === 0 ? (
          <div className="p-10 text-center text-pk-subtle text-sm">
            {search ? `Nenhuma série para "${search}"` : "Nenhuma série cadastrada."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pk-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-pk-subtle uppercase tracking-wider w-16">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-pk-subtle uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-pk-subtle uppercase tracking-wider">ID Externo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-pk-subtle uppercase tracking-wider">Logo</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-pk-subtle uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {series.map((s) => (
                <tr key={s.id} className="border-b border-pk-border/50 hover:bg-pk-surface-2 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-pk-subtle">{s.id}</td>
                  <td className="px-4 py-3 font-semibold text-pk-text">{s.nome}</td>
                  <td className="px-4 py-3 font-mono text-xs text-pk-muted">{s.idExterno || "—"}</td>
                  <td className="px-4 py-3">
                    {s.logoUrl
                      ? <img src={s.logoUrl} alt={s.nome} className="h-7 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      : <span className="text-pk-subtle">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => { setForm({ nome: s.nome, idExterno: s.idExterno ?? "", logoUrl: s.logoUrl ?? "" }); setEditId(s.id); setView("edit"); }}
                        className="p-1.5 rounded-lg text-pk-muted hover:text-pk-blue hover:bg-pk-surface-3 transition-colors cursor-pointer" aria-label="Editar">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(s)}
                        className="p-1.5 rounded-lg text-pk-muted hover:text-pk-red hover:bg-pk-surface-3 transition-colors cursor-pointer" aria-label="Excluir">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={pageInfo.number} totalPages={pageInfo.totalPages} totalElements={pageInfo.totalElements} onPage={(p) => load(p, search)} />

      {/* Form Modal */}
      {(view === "create" || view === "edit") && (
        <Modal title={view === "create" ? "Nova Série" : "Editar Série"} onClose={() => setView("list")}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nome" required>
              <Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="ex: Base" />
            </Field>
            <Field label="ID Externo">
              <Input value={form.idExterno} onChange={(e) => setForm({ ...form, idExterno: e.target.value })} placeholder="ex: base" />
            </Field>
            <Field label="URL do Logo">
              <Input type="url" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." />
              {form.logoUrl && <img src={form.logoUrl} alt="preview" className="mt-2 h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
            </Field>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex-1 bg-pk-red hover:bg-pk-red-dark text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-60 cursor-pointer text-sm">
                {saving ? "Salvando..." : view === "create" ? "Criar Série" : "Salvar"}
              </button>
              <button type="button" onClick={() => setView("list")}
                className="px-4 py-2.5 border border-pk-border rounded-lg text-sm text-pk-muted hover:text-pk-text hover:bg-pk-surface-2 transition-colors cursor-pointer">
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <Modal title="Confirmar exclusão" onClose={() => setDeleteTarget(null)}>
          <p className="text-pk-muted text-sm mb-5">
            Excluir <span className="font-semibold text-pk-text">"{deleteTarget.nome}"</span>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3">
            <button onClick={() => handleDelete(deleteTarget)}
              className="flex-1 bg-pk-red hover:bg-pk-red-dark text-white font-bold py-2.5 rounded-lg transition-colors cursor-pointer text-sm">
              Excluir
            </button>
            <button onClick={() => setDeleteTarget(null)}
              className="flex-1 border border-pk-border rounded-lg py-2.5 text-sm text-pk-muted hover:text-pk-text hover:bg-pk-surface-2 transition-colors cursor-pointer">
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
