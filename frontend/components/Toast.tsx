"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

interface Props {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const isSuccess = type === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border max-w-sm
        ${isSuccess
          ? "bg-pk-surface border-pk-success/30 text-pk-text"
          : "bg-pk-surface border-pk-red/30 text-pk-text"
        }`}
    >
      {isSuccess
        ? <CheckCircle size={18} className="text-pk-success flex-shrink-0" />
        : <XCircle size={18} className="text-pk-red flex-shrink-0" />
      }
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        onClick={onClose}
        className="p-1 text-pk-muted hover:text-pk-text transition-colors cursor-pointer flex-shrink-0"
        aria-label="Fechar notificação"
      >
        <X size={14} />
      </button>
    </div>
  );
}
