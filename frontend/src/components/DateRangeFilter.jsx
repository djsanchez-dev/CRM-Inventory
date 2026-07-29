import { useState, useEffect } from 'react';
import { X } from './Icons';

/**
 * Componente reutilizable para filtro por rango de fechas
 * @param {Object} props
 * @param {function} props.onFilter - Callback con { startDate, endDate } al cambiar
 * @param {Object} props.presets - Array de presets opcionales [{ label, days }]
 */
export default function DateRangeFilter({ onFilter, presets }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState(null);

  const defaultPresets = presets || [
    { label: 'Hoy', days: 0 },
    { label: '7 días', days: 7 },
    { label: '30 días', days: 30 },
    { label: '90 días', days: 90 },
  ];

  const applyPreset = (days) => {
    const end = new Date();
    const start = new Date();
    if (days > 0) {
      start.setDate(start.getDate() - days);
    }
    const fmtStart = start.toISOString().split('T')[0];
    const fmtEnd = end.toISOString().split('T')[0];
    setStartDate(fmtStart);
    setEndDate(fmtEnd);
    setActivePreset(days);
    onFilter({ startDate: fmtStart, endDate: fmtEnd });
  };

  const handleStartChange = (e) => {
    const val = e.target.value;
    setStartDate(val);
    setActivePreset(null);
    onFilter({ startDate: val, endDate });
  };

  const handleEndChange = (e) => {
    const val = e.target.value;
    setEndDate(val);
    setActivePreset(null);
    onFilter({ startDate, endDate: val });
  };

  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
    setActivePreset(null);
    onFilter({ startDate: '', endDate: '' });
  };

  const hasFilter = startDate || endDate;

  return (
    <div className="date-range-filter">
      <div className="date-inputs">
        <div className="date-field">
          <label htmlFor="df-start">Desde</label>
          <input
            id="df-start"
            type="date"
            value={startDate}
            onChange={handleStartChange}
            max={endDate || undefined}
          />
        </div>
        <span className="date-separator">—</span>
        <div className="date-field">
          <label htmlFor="df-end">Hasta</label>
          <input
            id="df-end"
            type="date"
            value={endDate}
            onChange={handleEndChange}
            min={startDate || undefined}
          />
        </div>
      </div>

      <div className="date-presets">
        {defaultPresets.map((preset) => (
          <button
            key={preset.days}
            className={`preset-btn ${activePreset === preset.days ? 'active' : ''}`}
            onClick={() => applyPreset(preset.days)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {hasFilter && (
        <button className="clear-filter-btn" onClick={clearFilter} title="Limpiar filtros">
          <X size={14} />
          Limpiar
        </button>
      )}
    </div>
  );
}
