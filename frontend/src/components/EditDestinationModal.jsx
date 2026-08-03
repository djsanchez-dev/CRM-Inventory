import { useState } from 'react';
import DestinationPicker from './DestinationPicker';
import { X, MapPin, Save } from './Icons';

/**
 * EditDestinationModal — lets the store edit the destination of an existing
 * delivery order using the same taxi-style picker (type address → search,
 * or drag the pin on the map). Saves via PUT /sales/:id/delivery.
 */
export default function EditDestinationModal({ sale, onClose, onSaved }) {
  const [address, setAddress] = useState(sale.direccion_entrega || '');
  const [coords, setCoords] = useState(
    sale.destino_lat != null && sale.destino_lng != null
      ? { lat: sale.destino_lat, lng: sale.destino_lng }
      : null
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (text, latlng) => {
    setAddress(text);
    if (latlng) setCoords(latlng);
  };

  const handleSave = async () => {
    if (!address.trim()) {
      setError('Escribe la dirección de entrega.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSaved({
        direccion_entrega: address.trim(),
        destino_lat: coords ? coords.lat : null,
        destino_lng: coords ? coords.lng : null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el destino.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <MapPin size={18} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
            Editar destino · Pedido #{sale.id}
          </h2>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <DestinationPicker
            value={address}
            onChange={handleChange}
            initialLat={coords ? coords.lat : undefined}
            initialLng={coords ? coords.lng : undefined}
          />
          {error && <div className="edit-dest-error">{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={busy}>
            <Save size={16} />
            <span>{busy ? 'Guardando...' : 'Guardar destino'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
