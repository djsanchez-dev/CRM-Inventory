import { useState } from 'react';
import { X, Car, Wrench, Droplets } from '../Icons';

const QUICK_SERVICES = {
  carwash: ['Lavado exterior', 'Lavado completo', 'Encerado', 'Aspirado', 'Lavado de motor'],
  mecanica: ['Cambio de aceite', 'Afinamiento', 'Frenos', 'Suspensión', 'Cambio de llanta'],
};

export default function ServiceFormModal({ onClose, onSave, customers }) {
  const [tipo, setTipo] = useState('carwash');
  const [nombre, setNombre] = useState('');
  const [placa, setPlaca] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [precio, setPrecio] = useState('');
  const [notas, setNotas] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const quickOptions = QUICK_SERVICES[tipo] || [];

  const handleQuick = (name) => {
    setNombre(name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('Ingresa el nombre del servicio');
      return;
    }
    if (precio === '' || isNaN(parseFloat(precio)) || parseFloat(precio) < 0) {
      setError('Ingresa un precio válido');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        tipo,
        nombre: nombre.trim(),
        placa: placa.trim() || null,
        cliente_id: clienteId ? parseInt(clienteId, 10) : null,
        precio: parseFloat(precio),
        notas: notas.trim() || null,
        fecha,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Registrar Servicio</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="error-message" style={{ marginBottom: 12 }}>
                {error}
              </div>
            )}

            {/* Tipo de servicio */}
            <div className="form-group">
              <label>Tipo de Servicio</label>
              <div className="service-type-toggle">
                <button
                  type="button"
                  className={`service-type-btn ${tipo === 'carwash' ? 'active' : ''}`}
                  onClick={() => { setTipo('carwash'); setNombre(''); }}
                >
                  <Droplets size={18} />
                  <span>Car Wash</span>
                </button>
                <button
                  type="button"
                  className={`service-type-btn ${tipo === 'mecanica' ? 'active' : ''}`}
                  onClick={() => { setTipo('mecanica'); setNombre(''); }}
                >
                  <Wrench size={18} />
                  <span>Mecánica</span>
                </button>
              </div>
            </div>

            {/* Nombre + quick options */}
            <div className="form-group">
              <label htmlFor="svc-nombre">Servicio realizado</label>
              <input
                id="svc-nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder={tipo === 'carwash' ? 'Ej: Lavado completo' : 'Ej: Cambio de aceite'}
                autoFocus
              />
              <div className="quick-services">
                {quickOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`quick-service-chip ${nombre === opt ? 'selected' : ''}`}
                    onClick={() => handleQuick(opt)}
                  >
                    {tipo === 'carwash' ? <Droplets size={12} /> : <Car size={12} />}
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="svc-placa">Placa del vehículo</label>
                <input
                  id="svc-placa"
                  type="text"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value)}
                  placeholder="Ej: ABC-123"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="svc-precio">Precio</label>
                <input
                  id="svc-precio"
                  type="number"
                  min="0"
                  step="0.01"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="svc-fecha">Fecha</label>
                <input
                  id="svc-fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="form-group">
                <label htmlFor="svc-cliente">Cliente (opcional)</label>
                <select
                  id="svc-cliente"
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                >
                  <option value="">Sin cliente</option>
                  {(customers || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                      {c.placa ? ` — ${c.placa}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="svc-notas">Notas (opcional)</label>
              <textarea
                id="svc-notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones del servicio..."
                rows={2}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Registrando...' : `Registrar — ${precio ? formatCurrency(parseFloat(precio)) : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
