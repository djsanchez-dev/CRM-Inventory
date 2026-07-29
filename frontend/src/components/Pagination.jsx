import { ChevronLeft, ChevronRight } from './Icons';

/**
 * Reusable pagination component.
 *
 * Props:
 *   pagination  – { page, limit, total, totalPages }
 *   onPageChange – callback(newPage)
 */
export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, limit, total, totalPages } = pagination;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Build page range: show first, last, and up to 5 pages around current
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(2, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages - 1, start + maxVisible - 1);
  if (end - start < maxVisible - 1) {
    start = Math.max(2, end - maxVisible + 1);
  }

  pages.push(1);

  if (start > 2) pages.push('...');

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages - 1) pages.push('...');

  if (totalPages > 1) pages.push(totalPages);

  const btn = (label, disabled, onClick, active = false) => (
    <button
      className={`pagination-btn${active ? ' active' : ''}`}
      disabled={disabled}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
    >
      {label}
    </button>
  );

  return (
    <div className="pagination">
      <span className="pagination-info">
        Mostrando {from}–{to} de {total} resultados
      </span>

      <div className="pagination-controls">
        {btn(
          <ChevronLeft size={16} />,
          page <= 1,
          () => onPageChange(page - 1),
        )}

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="pagination-ellipsis">
              …
            </span>
          ) : (
            btn(p, false, () => onPageChange(p), p === page)
          ),
        )}

        {btn(
          <ChevronRight size={16} />,
          page >= totalPages,
          () => onPageChange(page + 1),
        )}
      </div>
    </div>
  );
}
