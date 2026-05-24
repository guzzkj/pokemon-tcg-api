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
      <span className="text-gray-500">{totalElements} registro(s)</span>
      <div className="flex gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 0}
          className="px-3 py-1.5 rounded border border-pk-border bg-white disabled:opacity-40 hover:bg-pk-gray transition-colors"
        >
          ← Anterior
        </button>
        <span className="px-3 py-1.5 bg-pk-red text-white rounded font-medium">
          {page + 1} / {totalPages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages - 1}
          className="px-3 py-1.5 rounded border border-pk-border bg-white disabled:opacity-40 hover:bg-pk-gray transition-colors"
        >
          Próxima →
        </button>
      </div>
    </div>
  );
}
