"use client";

import { useCallback, useEffect, useState } from "react";
import { get, post, put, del, extractList } from "@/lib/api";
import { DetalheEstatistica, PagedResponse, ApiError } from "@/lib/types";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import Toast from "@/components/Toast";
import { Field, Input, Textarea } from "@/components/Field";
import { BarChart2, Plus, Search, X, Pencil, Trash2, Hash } from "lucide-react";

type View = "list" | "create" | "edit";
interface DetalheForm { raridade: string; artista: string; descricao: string; evolucaoDe: string; cartaId: string; }
const emptyForm: DetalheForm = { raridade: "", artista: "", descricao: "", evolucaoDe: "", cartaId: "" };

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
      const path = artista ? `/detalhes/buscar?artista=${encodeURIComponent(artista)}&page=${page}&size=10` : `/detalhes?page=${page}&size=10`;
      const data = await get<PagedResponse<DetalheEstatistica>>(path);
      setDetalhes(extractList(data, "detalheEstatisticaList"));
      setPageInfo({ number: data.page.number, totalPages: data.page.totalPages, totalElements: data.page.totalElements });
    } catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Erro ao carregar", type: "error" }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(0, artistaSearch); }, [load, artistaSearch]);

  async function buscarPorCarta(e: React.FormEvent) {
    e.preventDefault();
    if (!cartaIdSearch.trim()) return;
    setLoading(true);
    try {
      const data = await get<DetalheEstatistica>(`/detalhes/carta/${cartaIdSearch.trim()}`);
      setDetalhes([data]);
      setPageInfo({ number: 0, totalPages: 1, totalElements: 1 });
    } catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Detalhe não encontrado", type: "error" }); setDetalhes([]); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { raridade: form.raridade || undefined, artista: form.artista || undefined, descricao: form.descricao || undefined, evolucaoDe: form.evolucaoDe || undefined };
      if (view === "create") {
        if (!form.cartaId) { setToast({ message: "Informe o ID da carta", type: "error" }); setSaving(false); return; }
        await post(`/detalhes/carta/${form.cartaId}`, payload);
        setToast({ message: "Detalhe criado!", type: "success" });
      } else {
        await put(`/detalhes/${editId}`, payload);
        setToast({ message: "Detalhe atualizado!", type: "success" });
      }
      setView("list"); load(pageInfo.number, artistaSearch);
    } catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Erro", type: "error" }); }
    finally { setSaving(false); }
  }

  async function handleDelete(d: DetalheEstatistica) {
    try { await del(`/detalhes/${d.id}`); setToast({ message: "Detalhe removido.", type: "success" }); setDeleteTarget(null); load(pageInfo.number, artistaSearch); }
    catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Erro", type: "error" }); setDeleteTarget(null); }
  }

  function limpar() { setArtistaSearch(""); setArtistaInput(""); setCartaIdSearch(""); load(0, ""); }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-pk-surface-2 border border-pk-border rounded-lg flex items-center justify-center">
            <BarChart2 size={18} className="text-pk-blue" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-pk-text">Detalhes Estatísticos</h1>
            <p className="text-pk-subtle text-xs">Raridade, artista e lore · 1:1 com Carta</p>
          </div>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setView("create"); }}
          className="flex items-center gap-2 bg-pk-red hover:bg-pk-red-dark text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm cursor-pointer">
          <Plus size={16} /> Novo Detalhe
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-2">
        <form onSubmit={(e) => { e.preventDefault(); setCartaIdSearch(""); setArtistaSearch(artistaInput); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-pk-subtle" />
            <input type="text" value={artistaInput} onChange={(e) => setArtistaInput(e.target.value)} placeholder="Buscar por artista..."
              className="w-full bg-pk-surface border border-pk-border rounded-lg pl-9 pr-3 py-2 text-sm text-pk-text placeholder:text-pk-subtle focus:outline-none focus:border-pk-red transition-colors" />
          </div>
          <button type="submit" className="bg-pk-surface-2 border border-pk-border px-4 py-2 rounded-lg text-sm text-pk-muted hover:text-pk-text transition-colors cursor-pointer">Buscar</button>
        </form>

        <form onSubmit={buscarPorCarta} className="flex gap-2">
          <div className="relative flex-1">
            <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-pk-subtle" />
            <input type="number" min="1" value={cartaIdSearch} onChange={(e) => setCartaIdSearch(e.target.value)} placeholder="ID da carta..."
              className="w-full bg-pk-surface border border-pk-border rounded-lg pl-9 pr-3 py-2 text-sm text-pk-text placeholder:text-pk-subtle focus:outline-none focus:border-pk-red transition-colors" />
          </div>
          <button type="submit" className="bg-pk-surface-2 border border-pk-border px-4 py-2 rounded-lg text-sm text-pk-muted hover:text-pk-text transition-colors cursor-pointer">Por Carta</button>
          {(artistaSearch || cartaIdSearch) && <button type="button" onClick={limpar} className="p-2 text-pk-muted hover:text-pk-text cursor-pointer"><X size={16} /></button>}
        </form>
      </div>

      <div className="bg-pk-surface border border-pk-border rounded-xl overflow-hidden">
        {loading ? <div className="p-10 text-center text-pk-subtle text-sm">Carregando...</div>
          : detalhes.length === 0 ? <div className="p-10 text-center text-pk-subtle text-sm">Nenhum detalhe encontrado.</div>
          : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pk-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-pk-subtle uppercase tracking-wider">Carta</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-pk-subtle uppercase tracking-wider">Raridade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-pk-subtle uppercase tracking-wider">Artista</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-pk-subtle uppercase tracking-wider">Evolui De</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-pk-subtle uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {detalhes.map((d) => (
                  <tr key={d.id} className="border-b border-pk-border/50 hover:bg-pk-surface-2 transition-colors">
                    <td className="px-4 py-3">
                      {d.carta ? (
                        <div>
                          <p className="font-semibold text-pk-text text-sm">{d.carta.nome}</p>
                          <p className="text-xs text-pk-subtle font-mono">ID: {d.carta.id}</p>
                        </div>
                      ) : <span className="text-pk-subtle">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {d.raridade
                        ? <span className="bg-pk-yellow/10 text-pk-yellow border border-pk-yellow/20 font-bold px-2 py-0.5 rounded-full text-xs font-mono">{d.raridade}</span>
                        : <span className="text-pk-subtle">—</span>}
                    </td>
                    <td className="px-4 py-3 text-pk-muted text-xs italic">{d.artista ?? "—"}</td>
                    <td className="px-4 py-3 text-pk-subtle text-xs">{d.evolucaoDe ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => { setForm({ raridade: d.raridade ?? "", artista: d.artista ?? "", descricao: d.descricao ?? "", evolucaoDe: d.evolucaoDe ?? "", cartaId: d.carta?.id?.toString() ?? "" }); setEditId(d.id); setView("edit"); }}
                          className="p-1.5 rounded-lg text-pk-muted hover:text-pk-blue hover:bg-pk-surface-3 transition-colors cursor-pointer"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteTarget(d)}
                          className="p-1.5 rounded-lg text-pk-muted hover:text-pk-red hover:bg-pk-surface-3 transition-colors cursor-pointer"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      <Pagination page={pageInfo.number} totalPages={pageInfo.totalPages} totalElements={pageInfo.totalElements} onPage={(p) => load(p, artistaSearch)} />

      {(view === "create" || view === "edit") && (
        <Modal title={view === "create" ? "Novo Detalhe" : "Editar Detalhe"} onClose={() => setView("list")}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {view === "create" && (
              <Field label="ID da Carta" required hint="Cada carta pode ter apenas um detalhe (1:1)">
                <Input type="number" min="1" required value={form.cartaId} onChange={(e) => setForm({ ...form, cartaId: e.target.value })} placeholder="ex: 1" />
              </Field>
            )}
            {view === "edit" && form.cartaId && (
              <div className="bg-pk-surface-3 border border-pk-border rounded-lg px-3 py-2 text-xs text-pk-muted font-mono">
                Carta ID: <span className="text-pk-text font-semibold">{form.cartaId}</span> · não alterável
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Raridade"><Input value={form.raridade} onChange={(e) => setForm({ ...form, raridade: e.target.value })} placeholder="ex: Rare Holo" /></Field>
              <Field label="Artista"><Input value={form.artista} onChange={(e) => setForm({ ...form, artista: e.target.value })} placeholder="ex: Mitsuhiro Arita" /></Field>
            </div>
            <Field label="Evolui De"><Input value={form.evolucaoDe} onChange={(e) => setForm({ ...form, evolucaoDe: e.target.value })} placeholder="ex: Charmeleon" /></Field>
            <Field label="Descrição (Flavor Text)">
              <Textarea rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="ex: Spits fire that is hot enough to melt boulders." />
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
          <p className="text-pk-muted text-sm mb-5">Excluir detalhe de <span className="font-semibold text-pk-text">"{deleteTarget.carta?.nome ?? `ID ${deleteTarget.id}`}"</span>?</p>
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
