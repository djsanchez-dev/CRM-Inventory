export default function PointsSection({
  puntosDisponibles,
  puntosToUse,
  onPuntosChange,
  subtotal,
  formatCurrency,
}) {
  const maxPuntosUsables = Math.min(puntosDisponibles, subtotal);

  if (puntosDisponibles <= 0) return null;

  return (
    <div className="points-section">
      <label className="points-label">Usar puntos como descuento</label>
      <div className="points-control">
        <input
          type="range"
          min={0}
          max={maxPuntosUsables}
          value={puntosToUse}
          onChange={(e) => onPuntosChange(parseInt(e.target.value) || 0)}
          className="points-slider"
        />
        <div className="points-input-group">
          <input
            type="number"
            min={0}
            max={maxPuntosUsables}
            value={puntosToUse}
            onChange={(e) => {
              const v = parseInt(e.target.value) || 0;
              onPuntosChange(Math.min(v, maxPuntosUsables));
            }}
            className="points-number-input"
          />
          <span className="points-unit">pts</span>
        </div>
      </div>
      {puntosToUse > 0 && (
        <div className="points-discount">
          Descuento por puntos: -{formatCurrency(puntosToUse)}
        </div>
      )}
    </div>
  );
}
