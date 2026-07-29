import React from 'react';

/* ── Base Skeleton block ── */
function Block({ width = '100%', height = '16px', borderRadius = 'var(--radius-sm)', style = {}, className = '' }) {
  return (
    <div
      className={`skeleton-block ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

/* ── Circle ── */
function Circle({ size = 40 }) {
  return <Block width={`${size}px`} height={`${size}px`} borderRadius="50%" />;
}

/* ── Line (text placeholder) ── */
function Line({ width = '100%' }) {
  return <Block width={width} height="14px" borderRadius="4px" />;
}

/* ── Table skeleton ── */
function Table({ rows = 5, columns = 6 }) {
  const colWidths = ['30%', '15%', '20%', '12%', '12%', '10%'];
  return (
    <div className="skeleton-table" aria-label="Cargando tabla...">
      {/* Header */}
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, i) => (
          <Block key={`h-${i}`} width={colWidths[i] || '15%'} height="12px" borderRadius="4px" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`r-${r}`} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, c) => (
            <Block
              key={`c-${r}-${c}`}
              width={c === 0 ? colWidths[0] : colWidths[c] || '15%'}
              height="14px"
              borderRadius="4px"
              style={{ opacity: 1 - (r * 0.08) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Card grid skeleton ── */
function CardGrid({ count = 6 }) {
  return (
    <div className="skeleton-card-grid" aria-label="Cargando...">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.05}s` }}>
          <div className="skeleton-card-header">
            <Circle size={40} />
            <div className="skeleton-card-actions">
              <Block width="28px" height="28px" borderRadius="var(--radius-sm)" />
              <Block width="28px" height="28px" borderRadius="var(--radius-sm)" />
            </div>
          </div>
          <Block width="60%" height="16px" style={{ marginBottom: 8 }} />
          <Block width="90%" height="12px" style={{ marginBottom: 4 }} />
          <Block width="70%" height="12px" style={{ marginBottom: 16 }} />
          <Block width="40%" height="20px" borderRadius="100px" />
        </div>
      ))}
    </div>
  );
}

/* ── Stats grid skeleton (Dashboard) ── */
function Stats({ count = 4 }) {
  return (
    <div className="skeleton-stats-grid" aria-label="Cargando estadísticas...">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-stat" style={{ animationDelay: `${i * 0.08}s` }}>
          <Circle size={48} />
          <div className="skeleton-stat-info">
            <Block width="50%" height="12px" />
            <Block width="80%" height="24px" style={{ marginTop: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Chart skeleton ── */
function Chart() {
  return (
    <div className="skeleton-chart" aria-label="Cargando gráfico...">
      <Block width="40%" height="16px" style={{ marginBottom: 20 }} />
      <div className="skeleton-chart-bars">
        {Array.from({ length: 8 }).map((_, i) => (
          <Block
            key={i}
            width="100%"
            height={`${Math.max(20, 40 + Math.sin(i * 1.5) * 40)}px`}
            borderRadius="4px"
            style={{ maxWidth: 40 }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Financial cards skeleton ── */
function FinCards({ count = 4 }) {
  return (
    <div className="skeleton-fin-grid" aria-label="Cargando resumen financiero...">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-fin-card" style={{ animationDelay: `${i * 0.08}s` }}>
          <Circle size={40} />
          <div className="skeleton-fin-info">
            <Block width="60%" height="12px" />
            <Block width="85%" height="20px" style={{ marginTop: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Export ── */
const Skeleton = { Block, Circle, Line, Table, CardGrid, Stats, Chart, FinCards };
export default Skeleton;
