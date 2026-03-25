interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

function pageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];

  if (current > 3) pages.push("…");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("…");

  pages.push(total);

  return pages;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const items = pageRange(page, totalPages);

  const btnBase =
    "font-mono text-[10px] uppercase tracking-wider min-w-[2rem] h-8 px-2 border-2 border-text-primary transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center justify-between pt-6 border-t-2 border-text-primary mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={`${btnBase} bg-background text-text-primary hover:enabled:-translate-y-0.5 hover:enabled:shadow-[3px_3px_0px_0px_rgba(36,36,34,1)]`}
      >
        ← Prev
      </button>

      <div className="flex items-center gap-1">
        {items.map((item, i) =>
          item === "…" ? (
            <span key={`ellipsis-${i}`} className="font-mono text-[10px] text-text-muted px-1">
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              className={`${btnBase} ${
                item === page
                  ? "bg-text-primary text-background"
                  : "bg-background text-text-primary hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(36,36,34,1)]"
              }`}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={`${btnBase} bg-background text-text-primary hover:enabled:-translate-y-0.5 hover:enabled:shadow-[3px_3px_0px_0px_rgba(36,36,34,1)]`}
      >
        Next →
      </button>
    </div>
  );
}
