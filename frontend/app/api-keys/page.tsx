"use client";

import { useEffect, useState } from "react";
import { generateApiKey } from "@/lib/api";
import { ApiKeyEntity, ApiError } from "@/lib/types";
import Toast from "@/components/Toast";
import { Key, CheckCircle, AlertTriangle, Copy, Check, Trash2, Zap, Shield, Code } from "lucide-react";

export default function ApiKeysPage() {
  const [nomeCliente, setNomeCliente] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<ApiKeyEntity | null>(null);
  const [currentKey, setCurrentKey] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("pokemon_api_key") ?? "";
    setCurrentKey(stored);
    setManualKey(stored);
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeCliente.trim()) return;
    setGenerating(true);
    try {
      const data = await generateApiKey(nomeCliente.trim());
      setGenerated(data);
      setToast({ message: "API Key gerada com sucesso!", type: "success" });
    } catch (e) { setToast({ message: (e as ApiError).mensagem ?? "Erro ao gerar chave", type: "error" }); }
    finally { setGenerating(false); }
  }

  function saveKey(key: string) {
    localStorage.setItem("pokemon_api_key", key);
    setCurrentKey(key);
    setManualKey(key);
    setToast({ message: "Chave configurada! Será usada em todas as requisições.", type: "success" });
  }

  function clearKey() {
    localStorage.removeItem("pokemon_api_key");
    setCurrentKey("");
    setManualKey("");
    setGenerated(null);
    setToast({ message: "Chave removida.", type: "success" });
  }

  function handleSaveManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manualKey.trim()) return;
    saveKey(manualKey.trim());
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { setToast({ message: "Não foi possível copiar", type: "error" }); }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-pk-surface-2 border border-pk-border rounded-lg flex items-center justify-center">
          <Key size={18} className="text-pk-yellow" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-pk-text">API Keys</h1>
          <p className="text-pk-subtle text-xs">Gere e configure a chave de autenticação</p>
        </div>
      </div>

      {/* Status atual */}
      <div className={`rounded-xl border p-4 flex items-start justify-between gap-3 ${currentKey ? "bg-pk-success/5 border-pk-success/30" : "bg-pk-yellow/5 border-pk-yellow/30"}`}>
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {currentKey
            ? <CheckCircle size={18} className="text-pk-success flex-shrink-0 mt-0.5" />
            : <AlertTriangle size={18} className="text-pk-yellow flex-shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm mb-1 ${currentKey ? "text-pk-success" : "text-pk-yellow"}`}>
              {currentKey ? "Chave configurada" : "Sem chave configurada"}
            </p>
            {currentKey
              ? <p className="font-mono text-xs text-pk-muted bg-pk-surface-2 border border-pk-border px-2 py-1 rounded break-all">{currentKey}</p>
              : <p className="text-xs text-pk-muted">Gere ou insira uma chave. Sem ela, requisições retornam <code className="bg-pk-surface-3 px-1 rounded text-pk-yellow">401</code>.</p>}
          </div>
        </div>
        {currentKey && (
          <button onClick={clearKey} className="flex items-center gap-1 text-xs text-pk-muted hover:text-pk-red transition-colors flex-shrink-0 cursor-pointer">
            <Trash2 size={13} /> Remover
          </button>
        )}
      </div>

      {/* Gerar nova chave */}
      <div className="bg-pk-surface border border-pk-border rounded-xl p-5 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={15} className="text-pk-yellow" />
            <h2 className="font-bold text-pk-text text-sm">Gerar nova chave</h2>
          </div>
          <p className="text-pk-subtle text-xs">Cria uma API Key via <code className="bg-pk-surface-2 border border-pk-border px-1.5 py-0.5 rounded text-pk-yellow font-mono">POST /api-keys</code></p>
        </div>

        <form onSubmit={handleGenerate} className="flex gap-2">
          <input type="text" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} placeholder="Nome do cliente (ex: professor-teste)"
            className="flex-1 bg-pk-surface-2 border border-pk-border rounded-lg px-3 py-2 text-sm text-pk-text placeholder:text-pk-subtle focus:outline-none focus:border-pk-red transition-colors" />
          <button type="submit" disabled={generating || !nomeCliente.trim()}
            className="bg-pk-red hover:bg-pk-red-dark text-white font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-60 text-sm cursor-pointer whitespace-nowrap">
            {generating ? "Gerando..." : "Gerar"}
          </button>
        </form>

        {generated && (
          <div className="p-4 bg-pk-surface-2 border border-pk-border rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-pk-text">Chave gerada</p>
              <div className="flex gap-2">
                <button onClick={() => copyToClipboard(generated.chave)}
                  className="flex items-center gap-1 text-xs bg-pk-surface-3 border border-pk-border px-2.5 py-1 rounded-lg text-pk-muted hover:text-pk-text transition-colors cursor-pointer">
                  {copied ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
                </button>
                <button onClick={() => saveKey(generated.chave)}
                  className="flex items-center gap-1 text-xs bg-pk-red hover:bg-pk-red-dark text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer">
                  <Key size={12} /> Usar esta chave
                </button>
              </div>
            </div>
            <p className="font-mono text-xs break-all bg-pk-surface border border-pk-border px-3 py-2 rounded-lg text-pk-muted">{generated.chave}</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-pk-subtle font-mono">
              <span>ID: <span className="text-pk-text">{generated.id}</span></span>
              <span>Cliente: <span className="text-pk-text">{generated.nomeCliente}</span></span>
              <span>Ativa: <span className={generated.ativa ? "text-pk-success" : "text-pk-red"}>{generated.ativa ? "Sim" : "Não"}</span></span>
              <span>Criada: <span className="text-pk-text">{new Date(generated.criadaEm).toLocaleString("pt-BR")}</span></span>
            </div>
          </div>
        )}
      </div>

      {/* Chave manual */}
      <div className="bg-pk-surface border border-pk-border rounded-xl p-5 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={15} className="text-pk-blue" />
            <h2 className="font-bold text-pk-text text-sm">Usar chave existente</h2>
          </div>
          <p className="text-pk-subtle text-xs">Cole uma chave gerada anteriormente</p>
        </div>

        <form onSubmit={handleSaveManual} className="flex gap-2">
          <input type="text" value={manualKey} onChange={(e) => setManualKey(e.target.value)} placeholder="Cole sua API Key aqui..."
            className="flex-1 bg-pk-surface-2 border border-pk-border rounded-lg px-3 py-2 text-sm font-mono text-pk-text placeholder:text-pk-subtle focus:outline-none focus:border-pk-red transition-colors" />
          <button type="submit" disabled={!manualKey.trim()}
            className="bg-pk-blue hover:bg-pk-blue/80 text-white font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-60 text-sm cursor-pointer">
            Salvar
          </button>
        </form>
      </div>

      {/* Como usar */}
      <div className="bg-pk-surface border border-pk-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Code size={15} className="text-pk-muted" />
          <h2 className="font-bold text-pk-text text-sm">Como funciona</h2>
        </div>
        <div className="space-y-3">
          {[
            "Gere uma chave informando seu nome de cliente",
            "Clique em \"Usar esta chave\" — salva no localStorage do navegador",
            "Todas as requisições passam automaticamente o header X-API-Key",
            "Sem chave configurada → requisições retornam 401 Unauthorized",
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="bg-pk-red text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <span className="text-pk-muted text-sm">{text}</span>
            </div>
          ))}
        </div>
        <div className="bg-pk-surface-2 border border-pk-border rounded-lg p-3">
          <p className="text-xs text-pk-subtle mb-1 font-semibold">Header enviado em cada request:</p>
          <code className="text-xs font-mono text-pk-yellow">X-API-Key: {currentKey || "<sua-chave>"}</code>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
