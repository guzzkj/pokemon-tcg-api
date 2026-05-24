"use client";

import { useCallback, useEffect, useState } from "react";
import { get, post, put, del, extractList } from "@/lib/api";
import { Tipo, Carta, PagedResponse, ApiError } from "@/lib/types";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import Toast from "@/components/Toast";
import { Field, Input } from "@/components/Field";
import { Flame, Plus, Search, X, Pencil, Trash2, Link, Unlink } from "lucide-react";

type View = "list" | "create" | "edit";

const TYPE_COLORS: Record<string, string> = {
  fogo: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  fire: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  água: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  agua: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  water: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  grama: "bg-green-500/10 text-green-400 border-green-500/20",
  grass: "bg-green-500/10 text-green-400 border-green-500/20",
  elétrico: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  eletrico: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  electric: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  lightning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  psíquico: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  psiquico: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  psychic: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  sombrio: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  dark: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  darkness: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  metal: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  steel: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  dragão: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  dragao: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  dragon: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  fada: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  fairy: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  lutador: "bg-red-500/10 text-red-400 border-red-500/20",
  fighting: "bg-red-500/10 text-red-400 border-red-500/20",
  gelo: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  ice: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

function getTypeColor(nome: string): string {
  const key = nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const [k, v] of Object.entries(TYPE_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "bg-pk-surface-3 text-pk-muted border-pk-border";
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

  const [assocTipo, setAssocTipo] = useState<Tipo | null>(null);
  const [assocCartas, setAssocCartas] = useState<Carta[]>([]);
  const [assocLoading, setAssocLoading] = useState(false);
  const [cartaIdInput, setCartaIdInput] = useState("");
  const [assocSaving, setAssocSaving] = useState(false);

  const load = useCallback(async (page = 0, nome = "") => {
    setLoading(true);
    try {
      const path = nome ? `/tipos/buscar?nome=${encodeURIComponent(nome)}&page=${page}&size=10` : `/tipos?page=${page}&size=10`;
      const data = await get<PagedResponse<Tipo>>(path);
      setTipos(extractList(data, "tipoList"));
      setPageInfo({ number: data.page.number, totalPages: data.page.totalPages, totalElements: data.page.totalElements });
    } catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Erro ao carregar", type: "error" }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(0, search); }, [load, search]);

  async function openAssoc(tipo: Tipo) {
    setAssocTipo(tipo);
    setAssocCartas([]);
    setCartaIdInput("");
    setAssocLoading(true);
    try {
      const data = await get<Tipo & { cartas?: Carta[] }>(`/tipos/${tipo.id}`);
      setAssocCartas(data.cartas ?? []);
    } catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Erro ao carregar cartas", type: "error" }); }
    finally { setAssocLoading(false); }
  }

  async function adicionarCarta() {
    if (!assocTipo || !cartaIdInput.trim()) return;
    setAssocSaving(true);
    try {
      await post(`/tipos/${assocTipo.id}/cartas/${cartaIdInput.trim()}`, null);
      setToast({ message: "Carta associada!", type: "success" });
      setCartaIdInput("");
      await openAssoc(assocTipo);
    } catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Erro ao associar", type: "error" }); }
    finally { setAssocSaving(false); }
  }

  async function removerCarta(cartaId: number) {
    if (!assocTipo) return;
    try {
      await del(`/tipos/${assocTipo.id}/cartas/${cartaId}`);
      setToast({ message: "Associação removida.", type: "success" });
      setAssocCartas((prev) => prev.filter((c) => c.id !== cartaId));
    } catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Erro ao remover", type: "error" }); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      if (view === "create") { await post("/tipos", form); setToast({ message: "Tipo criado!", type: "success" }); }
      else { await put(`/tipos/${editId}`, form); setToast({ message: "Tipo atualizado!", type: "success" }); }
      setView("list"); load(pageInfo.number, search);
    } catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Erro", type: "error" }); }
    finally { setSaving(false); }
  }

  async function handleDelete(t: Tipo) {
    try { await del(`/tipos/${t.id}`); setToast({ message: `"${t.nome}" removido.`, type: "success" }); setDeleteTarget(null); load(pageInfo.number, search); }
    catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Erro", type: "error" }); setDeleteTarget(null); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-pk-surface-2 border border-pk-border rounded-lg flex items-center justify-center">
            <Flame size={18} className="text-pk-red" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-pk-text">Tipos</h1>
            <p className="text-pk-subtle text-xs">Tipos de energia · Many-to-Many com Carta</p>
          </div>
        </div>
        <button onClick={() => { setForm({ nome: "" }); setEditId(null); setView("create"); }}
          className="flex items-center gap-2 bg-pk-red hover:bg-pk-red-dark text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm cursor-pointer">
          <Plus size={16} /> Novo Tipo
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
          : tipos.length === 0 ? <div className="p-10 text-center text-pk-subtle text-sm">Nenhum tipo encontrado.</div>
          : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pk-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-pk-subtle uppercase tracking-wider w-16">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-pk-subtle uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-pk-subtle uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tipos.map((t) => (
                  <tr key={t.id} className="border-b border-pk-border/50 hover:bg-pk-surface-2 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-pk-subtle">{t.id}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getTypeColor(t.nome)}`}>
                        {t.nome}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => openAssoc(t)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-pk-muted hover:text-pk-yellow hover:bg-pk-surface-3 transition-colors cursor-pointer border border-pk-border/50">
                          <Link size={12} /> Cartas
                        </button>
                        <button onClick={() => { setForm({ nome: t.nome }); setEditId(t.id); setView("edit"); }}
                          className="p-1.5 rounded-lg text-pk-muted hover:text-pk-blue hover:bg-pk-surface-3 transition-colors cursor-pointer"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteTarget(t)}
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
        <Modal title={view === "create" ? "Novo Tipo" : "Editar Tipo"} onClose={() => setView("list")}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nome" required>
              <Input required value={form.nome} onChange={(e) => setForm({ nome: e.target.value })} placeholder="ex: Fogo, Água, Grama..." />
            </Field>
            {form.nome && (
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getTypeColor(form.nome)}`}>
                  {form.nome}
                </span>
                <span className="text-pk-subtle text-xs">prévia do badge</span>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex-1 bg-pk-red hover:bg-pk-red-dark text-white font-bold py-2.5 rounded-lg text-sm disabled:opacity-60 cursor-pointer">{saving ? "Salvando..." : view === "create" ? "Criar" : "Salvar"}</button>
              <button type="button" onClick={() => setView("list")} className="px-4 border border-pk-border rounded-lg text-sm text-pk-muted hover:text-pk-text hover:bg-pk-surface-2 cursor-pointer">Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {assocTipo && (
        <Modal title={`Cartas — ${assocTipo.nome}`} onClose={() => setAssocTipo(null)}>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input type="number" min="1" value={cartaIdInput} onChange={(e) => setCartaIdInput(e.target.value)} placeholder="ID da carta" />
              <button onClick={adicionarCarta} disabled={assocSaving || !cartaIdInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-pk-red hover:bg-pk-red-dark text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap">
                <Link size={14} /> Associar
              </button>
            </div>
            {assocLoading ? <div className="text-center text-pk-subtle py-6 text-sm">Carregando...</div>
              : assocCartas.length === 0 ? <div className="text-center text-pk-subtle py-6 text-sm">Nenhuma carta associada.</div>
              : (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {assocCartas.map((c) => (
                    <div key={c.id} className="flex items-center justify-between bg-pk-surface-2 border border-pk-border rounded-lg px-3 py-2">
                      <div className="flex items-center gap-3">
                        {c.imagemUrl && <img src={c.imagemUrl} alt={c.nome} className="h-8 w-6 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                        <div>
                          <p className="font-semibold text-sm text-pk-text">{c.nome}</p>
                          <p className="text-xs text-pk-subtle font-mono">ID: {c.id}</p>
                        </div>
                      </div>
                      <button onClick={() => removerCarta(c.id)}
                        className="p-1.5 rounded-lg text-pk-muted hover:text-pk-red hover:bg-pk-surface-3 transition-colors cursor-pointer">
                        <Unlink size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Confirmar exclusão" onClose={() => setDeleteTarget(null)}>
          <p className="text-pk-muted text-sm mb-5">Excluir tipo <span className="font-semibold text-pk-text">"{deleteTarget.nome}"</span>?</p>
          <div className="flex gap-3">
            <button onClick={() => handleDelete(deleteTarget)} className="flex-1 bg-pk-red hover:bg-pk-red-dark text-white font-bold py-2.5 rounded-lg text-sm cursor-pointer">Excluir</button>
            <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-pk-border rounded-lg py-2.5 text-sm text-pk-muted hover:text-pk-text hover:bg-pk-surface-2 cursor-pointer">Cancelar</button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
