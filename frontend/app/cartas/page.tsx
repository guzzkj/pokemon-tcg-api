"use client";

import { useCallback, useEffect, useState } from "react";
import { get, post, put, del, extractList } from "@/lib/api";
import { Carta, Colecao, PagedResponse, ApiError } from "@/lib/types";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import Toast from "@/components/Toast";
import { Field, Input, Select } from "@/components/Field";
import { CreditCard, Plus, Search, X, Pencil, Trash2, Filter } from "lucide-react";

type View = "list" | "create" | "edit";
type Categoria = "POKEMON" | "TREINADOR" | "ENERGIA";

interface CartaForm { nome: string; categoria: Categoria; pontosDeVida: string; imagemUrl: string; idExterno: string; numeroLocal: string; colecaoId: string; }
const emptyForm: CartaForm = { nome: "", categoria: "POKEMON", pontosDeVida: "", imagemUrl: "", idExterno: "", numeroLocal: "", colecaoId: "" };

const categoriaBadge: Record<Categoria, string> = {
  POKEMON: "bg-pk-red/10 text-pk-red border border-pk-red/20",
  TREINADOR: "bg-pk-blue/10 text-pk-blue border border-pk-blue/20",
  ENERGIA: "bg-pk-yellow/10 text-pk-yellow border border-pk-yellow/20",
};

function toPayload(f: CartaForm) {
  return { nome: f.nome, categoria: f.categoria, pontosDeVida: f.pontosDeVida ? parseInt(f.pontosDeVida) : undefined, imagemUrl: f.imagemUrl || undefined, idExterno: f.idExterno || undefined, numeroLocal: f.numeroLocal || undefined, colecao: f.colecaoId ? { id: parseInt(f.colecaoId) } : undefined };
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

  const load = useCallback(async (page = 0, nome = "", colecaoId = "") => {
    setLoading(true);
    try {
      const path = colecaoId ? `/colecoes/${colecaoId}/cartas?page=${page}&size=10`
        : nome ? `/cartas/buscar?nome=${encodeURIComponent(nome)}&page=${page}&size=10`
        : `/cartas?page=${page}&size=10`;
      const data = await get<PagedResponse<Carta>>(path);
      setCartas(extractList(data, "cartaList"));
      setPageInfo({ number: data.page.number, totalPages: data.page.totalPages, totalElements: data.page.totalElements });
    } catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Erro ao carregar", type: "error" }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load(0, search, filterColecao);
    get<PagedResponse<Colecao>>("/colecoes?size=200").then((d) => setColecoes(extractList(d, "colecaoList"))).catch(() => {});
  }, [load, search, filterColecao]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      if (view === "create") { await post("/cartas", toPayload(form)); setToast({ message: "Carta criada!", type: "success" }); }
      else { await put(`/cartas/${editId}`, toPayload(form)); setToast({ message: "Carta atualizada!", type: "success" }); }
      setView("list"); load(pageInfo.number, search, filterColecao);
    } catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Erro", type: "error" }); }
    finally { setSaving(false); }
  }

  async function handleDelete(c: Carta) {
    try { await del(`/cartas/${c.id}`); setToast({ message: `"${c.nome}" removida.`, type: "success" }); setDeleteTarget(null); load(pageInfo.number, search, filterColecao); }
    catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Erro", type: "error" }); setDeleteTarget(null); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-pk-surface-2 border border-pk-border rounded-lg flex items-center justify-center">
            <CreditCard size={18} className="text-pk-yellow" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-pk-text">Cartas</h1>
            <p className="text-pk-subtle text-xs">CRUD completo de cartas</p>
          </div>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setView("create"); }}
          className="flex items-center gap-2 bg-pk-red hover:bg-pk-red-dark text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm cursor-pointer">
          <Plus size={16} /> Nova Carta
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <form onSubmit={(e) => { e.preventDefault(); setFilterColecao(""); setSearch(searchInput); }} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-pk-subtle" />
            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Buscar por nome (mín. 2 chars)..."
              className="w-full bg-pk-surface border border-pk-border rounded-lg pl-9 pr-3 py-2 text-sm text-pk-text placeholder:text-pk-subtle focus:outline-none focus:border-pk-red transition-colors" />
          </div>
          <button type="submit" className="bg-pk-surface-2 border border-pk-border px-4 py-2 rounded-lg text-sm text-pk-muted hover:text-pk-text transition-colors cursor-pointer">Buscar</button>
          {(search || filterColecao) && <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setFilterColecao(""); }} className="p-2 text-pk-muted hover:text-pk-text cursor-pointer"><X size={16} /></button>}
        </form>
        <div className="relative">
          <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-pk-subtle pointer-events-none" />
          <select value={filterColecao} onChange={(e) => { setFilterColecao(e.target.value); setSearch(""); setSearchInput(""); }}
            className="bg-pk-surface border border-pk-border rounded-lg pl-9 pr-3 py-2 text-sm text-pk-muted focus:outline-none focus:border-pk-red cursor-pointer md:w-52">
            <option value="">Todas as coleções</option>
            {colecoes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-pk-surface border border-pk-border rounded-xl overflow-hidden">
        {loading ? <div className="p-10 text-center text-pk-subtle text-sm">Carregando...</div>
          : cartas.length === 0 ? <div className="p-10 text-center text-pk-subtle text-sm">Nenhuma carta encontrada.</div>
          : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pk-border">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-pk-subtle uppercase tracking-wider w-12">Img</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-pk-subtle uppercase tracking-wider">Nome</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-pk-subtle uppercase tracking-wider">Categoria</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-pk-subtle uppercase tracking-wider">HP</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-pk-subtle uppercase tracking-wider">Coleção</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-pk-subtle uppercase tracking-wider">Nº</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-pk-subtle uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {cartas.map((c) => (
                  <tr key={c.id} className="border-b border-pk-border/50 hover:bg-pk-surface-2 transition-colors">
                    <td className="px-3 py-2">
                      {c.imagemUrl
                        ? <img src={c.imagemUrl} alt={c.nome} className="h-10 w-7 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        : <div className="h-10 w-7 bg-pk-surface-3 rounded flex items-center justify-center text-pk-subtle text-xs">?</div>}
                    </td>
                    <td className="px-3 py-2 font-semibold text-pk-text">{c.nome}</td>
                    <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono ${categoriaBadge[c.categoria]}`}>{c.categoria}</span></td>
                    <td className="px-3 py-2 text-pk-muted text-xs font-mono">{c.pontosDeVida != null ? `${c.pontosDeVida} HP` : "—"}</td>
                    <td className="px-3 py-2 text-pk-subtle text-xs">{c.colecao?.nome ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs text-pk-subtle">{c.numeroLocal ?? "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => { setForm({ nome: c.nome, categoria: c.categoria, pontosDeVida: c.pontosDeVida?.toString() ?? "", imagemUrl: c.imagemUrl ?? "", idExterno: c.idExterno ?? "", numeroLocal: c.numeroLocal ?? "", colecaoId: c.colecao?.id?.toString() ?? "" }); setEditId(c.id); setView("edit"); }}
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

      <Pagination page={pageInfo.number} totalPages={pageInfo.totalPages} totalElements={pageInfo.totalElements} onPage={(p) => load(p, search, filterColecao)} />

      {(view === "create" || view === "edit") && (
        <Modal title={view === "create" ? "Nova Carta" : "Editar Carta"} onClose={() => setView("list")}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nome" required><Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="ex: Charizard" /></Field>
            <Field label="Categoria" required>
              <Select required value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as Categoria })}>
                <option value="POKEMON">POKEMON</option>
                <option value="TREINADOR">TREINADOR</option>
                <option value="ENERGIA">ENERGIA</option>
              </Select>
            </Field>
            {form.categoria === "POKEMON" && (
              <Field label="Pontos de Vida (HP)"><Input type="number" min="0" max="999" value={form.pontosDeVida} onChange={(e) => setForm({ ...form, pontosDeVida: e.target.value })} placeholder="ex: 120" /></Field>
            )}
            <Field label="Coleção">
              <Select value={form.colecaoId} onChange={(e) => setForm({ ...form, colecaoId: e.target.value })}>
                <option value="">— sem coleção —</option>
                {colecoes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Número Local"><Input value={form.numeroLocal} onChange={(e) => setForm({ ...form, numeroLocal: e.target.value })} placeholder="ex: 4" /></Field>
              <Field label="ID Externo"><Input value={form.idExterno} onChange={(e) => setForm({ ...form, idExterno: e.target.value })} placeholder="ex: base1-4" /></Field>
            </div>
            <Field label="URL da Imagem">
              <Input type="url" value={form.imagemUrl} onChange={(e) => setForm({ ...form, imagemUrl: e.target.value })} placeholder="https://..." />
              {form.imagemUrl && <img src={form.imagemUrl} alt="preview" className="mt-2 h-20 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
            </Field>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex-1 bg-pk-red hover:bg-pk-red-dark text-white font-bold py-2.5 rounded-lg text-sm disabled:opacity-60 cursor-pointer">{saving ? "Salvando..." : view === "create" ? "Criar" : "Salvar"}</button>
              <button type="button" onClick={() => setView("list")} className="px-4 border border-pk-border rounded-lg text-sm text-pk-muted hover:text-pk-text hover:bg-pk-surface-2 cursor-pointer">Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Confirmar exclusão" onClose={() => setDeleteTarget(null)}>
          <p className="text-pk-muted text-sm mb-5">Excluir <span className="font-semibold text-pk-text">"{deleteTarget.nome}"</span>?</p>
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
