"use client";

import { useEffect } from "react";

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

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white font-medium max-w-sm ${
        type === "success" ? "bg-green-600" : "bg-pk-red"
      }`}
    >
      <div className="flex items-center gap-3">
        <span>{type === "success" ? "✓" : "✕"}</span>
        <span>{message}</span>
        <button onClick={onClose} className="ml-auto opacity-75 hover:opacity-100">
          ×
        </button>
      </div>
    </div>
  );
}
