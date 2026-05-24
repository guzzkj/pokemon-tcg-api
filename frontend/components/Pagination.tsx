import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  totalElements: number;
  onPage: (p: number) => void;
}

export default function Pagination({ page, totalPages, totalElements, onPage }: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <span className="text-pk-subtle font-mono text-xs">{totalElements} registro(s)</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-pk-border bg-pk-surface-2 text-pk-muted hover:text-pk-text hover:border-pk-border-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft size={14} />
          Anterior
        </button>
        <span className="px-3 py-1.5 bg-pk-red text-white rounded-lg font-bold text-xs font-mono">
          {page + 1} / {totalPages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages - 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-pk-border bg-pk-surface-2 text-pk-muted hover:text-pk-text hover:border-pk-border-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Próxima
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
