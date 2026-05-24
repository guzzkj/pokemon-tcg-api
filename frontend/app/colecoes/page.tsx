"use client";

import { useCallback, useEffect, useState } from "react";
import { get, post, put, del, extractList } from "@/lib/api";
import { Colecao, Serie, PagedResponse, ApiError } from "@/lib/types";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import Toast from "@/components/Toast";
import { Field, Input, Select } from "@/components/Field";
import { FolderOpen, Plus, Search, X, Pencil, Trash2 } from "lucide-react";

type View = "list" | "create" | "edit";
interface ColecaoForm { nome: string; codigoExterno: string; logoUrl: string; totalDeCartas: string; serieId: string; }
const emptyForm: ColecaoForm = { nome: "", codigoExterno: "", logoUrl: "", totalDeCartas: "", serieId: "" };

function toPayload(f: ColecaoForm) {
  return { nome: f.nome, codigoExterno: f.codigoExterno || undefined, logoUrl: f.logoUrl || undefined, totalDeCartas: f.totalDeCartas ? parseInt(f.totalDeCartas) : undefined, serie: f.serieId ? { id: parseInt(f.serieId) } : undefined };
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

  const load = useCallback(async (page = 0, nome = "") => {
    setLoading(true);
    try {
      const path = nome ? `/colecoes/buscar?nome=${encodeURIComponent(nome)}&page=${page}&size=10` : `/colecoes?page=${page}&size=10`;
      const data = await get<PagedResponse<Colecao>>(path);
      setColecoes(extractList(data, "colecaoList"));
      setPageInfo({ number: data.page.number, totalPages: data.page.totalPages, totalElements: data.page.totalElements });
    } catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Erro ao carregar", type: "error" }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load(0, search);
    get<PagedResponse<Serie>>("/series?size=100").then((d) => setSeries(extractList(d, "serieList"))).catch(() => {});
  }, [load, search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      if (view === "create") { await post("/colecoes", toPayload(form)); setToast({ message: "Coleção criada!", type: "success" }); }
      else { await put(`/colecoes/${editId}`, toPayload(form)); setToast({ message: "Coleção atualizada!", type: "success" }); }
      setView("list"); load(pageInfo.number, search);
    } catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Erro", type: "error" }); }
    finally { setSaving(false); }
  }

  async function handleDelete(c: Colecao) {
    try { await del(`/colecoes/${c.id}`); setToast({ message: `"${c.nome}" removida.`, type: "success" }); setDeleteTarget(null); load(pageInfo.number, search); }
    catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Erro", type: "error" }); setDeleteTarget(null); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-pk-surface-2 border border-pk-border rounded-lg flex items-center justify-center">
            <FolderOpen size={18} className="text-pk-blue" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-pk-text">Coleções</h1>
            <p className="text-pk-subtle text-xs">Sets de cartas por série</p>
          </div>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setView("create"); }}
          className="flex items-center gap-2 bg-pk-red hover:bg-pk-red-dark text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm cursor-pointer">
          <Plus size={16} /> Nova Coleção
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-pk-subtle" />
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Buscar por nome..."
            className="w-full bg-pk-surface border border-pk-border rounded-lg pl-9 pr-3 py-2 text-sm text-pk-text placeholder:text-pk-subtle focus:outline-none focus:border-pk-red transition-colors" />
        </div>
        <button type="submit" className="bg-pk-surface-2 border border-pk-border px-4 py-2 rounded-lg text-sm text-pk-muted hover:text-pk-text transition-colors cursor-pointer">Buscar</button>
        {search && <button type="button" onClick={() => { setSearch(""); setSearchInput(""); }} className="p-2 text-pk-muted hover:text-pk-text cursor-pointer"><X size={16} /></button>}
      </form>

      <div className="bg-pk-surface border border-pk-border rounded-xl overflow-hidden">
        {loading ? <div className="p-10 text-center text-pk-subtle text-sm">Carregando...</div>
          : colecoes.length === 0 ? <div className="p-10 text-center text-pk-subtle text-sm">Nenhuma coleção encontrada.</div>
          : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pk-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-pk-subtle uppercase tracking-wider w-16">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-pk-subtle uppercase tracking-wider">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-pk-subtle uppercase tracking-wider">Série</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-pk-subtle uppercase tracking-wider">Cód.</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-pk-subtle uppercase tracking-wider">Cartas</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-pk-subtle uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {colecoes.map((c) => (
                  <tr key={c.id} className="border-b border-pk-border/50 hover:bg-pk-surface-2 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-pk-subtle">{c.id}</td>
                    <td className="px-4 py-3 font-semibold text-pk-text">{c.nome}</td>
                    <td className="px-4 py-3 text-pk-muted text-xs">{c.serie?.nome ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-pk-subtle">{c.codigoExterno || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      {c.totalDeCartas != null
                        ? <span className="bg-pk-yellow/10 text-pk-yellow border border-pk-yellow/20 font-bold px-2 py-0.5 rounded-full text-xs font-mono">{c.totalDeCartas}</span>
                        : <span className="text-pk-subtle">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => { setForm({ nome: c.nome, codigoExterno: c.codigoExterno ?? "", logoUrl: c.logoUrl ?? "", totalDeCartas: c.totalDeCartas?.toString() ?? "", serieId: c.serie?.id?.toString() ?? "" }); setEditId(c.id); setView("edit"); }}
                          className="p-1.5 rounded-lg text-pk-muted hover:text-pk-blue hover:bg-pk-surface-3 transition-colors cursor-pointer"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteTarget(c)}
                          className="p-1.5 rounded-lg text-pk-muted hover:text-pk-red hover:bg-pk-surface-3 transition-colors cursor-pointer"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      <Pagination page={pageInfo.number} totalPages={pageInfo.totalPages} totalElements={pageInfo.totalElements} onPage={(p) => load(p, search)} />

      {(view === "create" || view === "edit") && (
        <Modal title={view === "create" ? "Nova Coleção" : "Editar Coleção"} onClose={() => setView("list")}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nome" required><Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="ex: Base Set" /></Field>
            <Field label="Série">
              <Select value={form.serieId} onChange={(e) => setForm({ ...form, serieId: e.target.value })}>
                <option value="">— sem série —</option>
                {series.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Código Externo"><Input value={form.codigoExterno} onChange={(e) => setForm({ ...form, codigoExterno: e.target.value })} placeholder="ex: base1" /></Field>
              <Field label="Total de Cartas"><Input type="number" min="0" value={form.totalDeCartas} onChange={(e) => setForm({ ...form, totalDeCartas: e.target.value })} placeholder="ex: 102" /></Field>
            </div>
            <Field label="URL do Logo"><Input type="url" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." /></Field>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex-1 bg-pk-red hover:bg-pk-red-dark text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-60 cursor-pointer text-sm">
                {saving ? "Salvando..." : view === "create" ? "Criar" : "Salvar"}
              </button>
              <button type="button" onClick={() => setView("list")} className="px-4 py-2.5 border border-pk-border rounded-lg text-sm text-pk-muted hover:text-pk-text hover:bg-pk-surface-2 transition-colors cursor-pointer">Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Confirmar exclusão" onClose={() => setDeleteTarget(null)}>
          <p className="text-pk-muted text-sm mb-5">Excluir <span className="font-semibold text-pk-text">"{deleteTarget.nome}"</span>?</p>
          <div className="flex gap-3">
            <button onClick={() => handleDelete(deleteTarget)} className="flex-1 bg-pk-red hover:bg-pk-red-dark text-white font-bold py-2.5 rounded-lg text-sm cursor-pointer">Excluir</button>
            <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-pk-border rounded-lg py-2.5 text-sm text-pk-muted hover:text-pk-text hover:bg-pk-surface-2 transition-colors cursor-pointer">Cancelar</button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
