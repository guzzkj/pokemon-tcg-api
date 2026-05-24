"use client";

import { useEffect, useState } from "react";
import { generateApiKey } from "@/lib/api";
import { ApiKeyEntity, ApiError } from "@/lib/types";
import Toast from "@/components/Toast";

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
    } catch (e) {
      const err = e as ApiError;
      setToast({ message: err.mensagem ?? "Erro ao gerar chave", type: "error" });
    } finally {
      setGenerating(false);
    }
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
    } catch {
      setToast({ message: "Não foi possível copiar", type: "error" });
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-pk-blue">🔑 API Keys</h1>
        <p className="text-gray-500 text-sm">
          Gere e configure a chave de autenticação usada pelo frontend
        </p>
      </div>

      {/* Status atual */}
      <div className={`rounded-xl border p-5 mb-6 ${
        currentKey
          ? "bg-green-50 border-green-200"
          : "bg-yellow-50 border-yellow-200"
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className={`font-bold text-sm mb-1 ${currentKey ? "text-green-700" : "text-yellow-700"}`}>
              {currentKey ? "✓ Chave configurada" : "⚠ Sem chave configurada"}
            </p>
            {currentKey ? (
              <p className="font-mono text-xs text-green-800 break-all bg-green-100 px-2 py-1 rounded">
                {currentKey}
              </p>
            ) : (
              <p className="text-sm text-yellow-600">
                Gere uma nova chave ou insira uma existente abaixo. Sem chave, as requisições retornam 401.
              </p>
            )}
          </div>
          {currentKey && (
            <button
              onClick={clearKey}
              className="text-xs text-red-500 hover:text-red-700 font-medium flex-shrink-0"
            >
              Remover
            </button>
          )}
        </div>
      </div>

      {/* Gerar nova chave */}
      <div className="bg-white rounded-xl border border-pk-border shadow-sm p-5 mb-4">
        <h2 className="font-bold text-pk-blue mb-1">Gerar nova chave</h2>
        <p className="text-gray-500 text-xs mb-4">
          Cria uma nova API Key vinculada ao nome informado via{" "}
          <code className="bg-gray-100 px-1 rounded">POST /api-keys</code>
        </p>

        <form onSubmit={handleGenerate} className="flex gap-2">
          <input
            type="text"
            value={nomeCliente}
            onChange={(e) => setNomeCliente(e.target.value)}
            placeholder="Nome do cliente (ex: professor-teste)"
            className="flex-1 border border-pk-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pk-red"
          />
          <button
            type="submit"
            disabled={generating || !nomeCliente.trim()}
            className="bg-pk-red hover:bg-pk-red-dark text-white font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-60 text-sm"
          >
            {generating ? "Gerando..." : "Gerar"}
          </button>
        </form>

        {/* Resultado da geração */}
        {generated && (
          <div className="mt-4 p-4 bg-pk-gray rounded-xl border border-pk-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-pk-blue">Chave gerada</p>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(generated.chave)}
                  className="text-xs bg-pk-blue text-white px-2 py-1 rounded hover:bg-pk-blue-light transition-colors"
                >
                  {copied ? "✓ Copiado!" : "Copiar"}
                </button>
                <button
                  onClick={() => saveKey(generated.chave)}
                  className="text-xs bg-pk-red text-white px-2 py-1 rounded hover:bg-pk-red-dark transition-colors"
                >
                  Usar esta chave
                </button>
              </div>
            </div>
            <p className="font-mono text-xs break-all bg-white px-3 py-2 rounded border border-pk-border">
              {generated.chave}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
              <span>ID: <strong>{generated.id}</strong></span>
              <span>Cliente: <strong>{generated.nomeCliente}</strong></span>
              <span>Ativa: <strong>{generated.ativa ? "Sim" : "Não"}</strong></span>
              <span>Criada: <strong>{new Date(generated.criadaEm).toLocaleString("pt-BR")}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Inserir chave manualmente */}
      <div className="bg-white rounded-xl border border-pk-border shadow-sm p-5 mb-4">
        <h2 className="font-bold text-pk-blue mb-1">Usar chave existente</h2>
        <p className="text-gray-500 text-xs mb-4">Cole uma chave já gerada anteriormente</p>

        <form onSubmit={handleSaveManual} className="flex gap-2">
          <input
            type="text"
            value={manualKey}
            onChange={(e) => setManualKey(e.target.value)}
            placeholder="Cole sua API Key aqui..."
            className="flex-1 border border-pk-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-pk-red"
          />
          <button
            type="submit"
            disabled={!manualKey.trim()}
            className="bg-pk-blue hover:bg-pk-blue-light text-white font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-60 text-sm"
          >
            Salvar
          </button>
        </form>
      </div>

      {/* Como usar */}
      <div className="bg-white rounded-xl border border-pk-border shadow-sm p-5">
        <h2 className="font-bold text-pk-blue mb-3">Como funciona</h2>
        <div className="flex flex-col gap-3 text-sm text-gray-600">
          <Step n={1} text="Gere uma chave informando seu nome de cliente" />
          <Step n={2} text='Clique em "Usar esta chave" — ela é salva no localStorage do navegador' />
          <Step n={3} text="Todas as requisições do frontend passam automaticamente o header X-API-Key" />
          <Step n={4} text="Sem chave configurada → requisições retornam 401 Unauthorized" />
        </div>

        <div className="mt-4 p-3 bg-pk-gray rounded-lg">
          <p className="text-xs font-bold text-gray-600 mb-1">Header enviado:</p>
          <code className="text-xs text-pk-blue">X-API-Key: {currentKey || "<sua-chave>"}</code>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="bg-pk-red text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        {n}
      </span>
      <span>{text}</span>
    </div>
  );
}
