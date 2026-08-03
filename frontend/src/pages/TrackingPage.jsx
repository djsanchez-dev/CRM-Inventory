import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import {
  Bike,
  MapPin,
  Clock,
  User,
  CheckCircle2,
  Truck,
  X,
  Package,
  Store,
  Phone,
  Refresh,
  LinkIcon,
  Navigation,
} from '../components/Icons';
import DeliveryMap from '../components/DeliveryMap';

const POLL_INTERVAL = 6000; // refresh live status every 6s

const STEPS = [
  { id: 'pendiente', label: 'Pedido confirmado', icon: Package, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  { id: 'en_camino', label: 'En camino', icon: Truck, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' },
  { id: 'entregado', label: 'Entregado', icon: CheckCircle2, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
];

const STATE_META = {
  pendiente: { label: 'Pendiente', sub: 'Estamos preparando tu pedido', icon: Package, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  en_camino: { label: 'En camino', sub: 'Tu pedido está en ruta', icon: Truck, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' },
  entregado: { label: 'Entregado', sub: 'Gracias por tu compra', icon: CheckCircle2, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  cancelado: { label: 'Cancelado', sub: 'Este pedido fue cancelado', icon: X, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
};

const TIPO_PAGO_LABEL = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  yape: 'Yape',
  plin: 'Plin',
};

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(v, moneda) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda || 'PEN' }).format(Number(v) || 0);
}

/**
 * Public real-time delivery tracker.
 * Customer opens a shared link (WhatsApp / phone call) — NO login required.
 * Polls the public API every few seconds and shows the order's live state.
 * When the order is delivered/cancelled the link expires and this page
 * shows the final state.
 */
export default function TrackingPage() {
  const { token } = useParams();
  const [tracking, setTracking] = useState(null);
  const [finalState, setFinalState] = useState(null); // { estado_delivery, ... }
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const load = async () => {
    try {
      const data = await api.getTracking(token);
      if (mountedRef.current) {
        setTracking(data);
        setError(null);
        setLoading(false);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      // 410 → link expired (delivered/cancelled): show final state screen
      if (err.status === 410) {
        setFinalState(err.data || { estado_delivery: 'entregado' });
        setLoading(false);
        return;
      }
      // 404 → invalid link
      if (err.status === 404) {
        setError(err.message || 'Enlace de seguimiento no válido');
        setLoading(false);
        return;
      }
      // Network errors and 5xx are transient — always release the spinner
      // and keep the last known data instead of a misleading screen.
      setLoading(false);
    }
  };

  // Freeze polling once the link is expired/invalid (no wasted requests)
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (finalState || error) setDone(true);
  }, [finalState, error]);

  useEffect(() => {
    if (done) return;
    mountedRef.current = true;
    load();
    const interval = setInterval(load, POLL_INTERVAL);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, done]);

  // ---- Loading state (also while there's no data yet, e.g. after a
  // transient network error that kept tracking === null) ----
  if (loading || !tracking) {
    return (
      <div className="tracking-page">
        <div className="tracking-loading">
          <div className="tracking-spinner"><Bike size={32} /></div>
          <p>Cargando seguimiento...</p>
        </div>
      </div>
    );
  }

  // ---- Invalid / expired link ----
  if (error || finalState) {
    const expired = !!finalState;
    const meta = expired ? (STATE_META[finalState.estado_delivery] || STATE_META.entregado) : null;
    return (
      <div className="tracking-page">
        <div className="tracking-card tracking-expired">
          {expired ? (
            <>
              <div className="tracking-expired-icon" style={{ background: meta.bg, color: meta.color }}>
                <meta.icon size={44} />
              </div>
              <h2>{meta.label}</h2>
              <p>{meta.sub}</p>
              {finalState.order_id && (
                <span className="tracking-order-chip">Pedido #{finalState.order_id}</span>
              )}
              {finalState.business_name && (
                <span className="tracking-business-name">{finalState.business_name}</span>
              )}
              <div className="tracking-expired-note">
                <LinkIcon size={14} />
                <span>Este enlace de seguimiento ya no está disponible.</span>
              </div>
            </>
          ) : (
            <>
              <div className="tracking-expired-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <X size={44} />
              </div>
              <h2>Enlace no válido</h2>
              <p>Este enlace de seguimiento no es válido o ya no existe.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---- Live tracking ----
  const meta = STATE_META[tracking.estado_delivery] || STATE_META.pendiente;
  const StatusIcon = meta.icon;
  const currentStepIdx = STEPS.findIndex((s) => s.id === tracking.estado_delivery);
  const activeIdx = currentStepIdx === -1 ? 0 : currentStepIdx;
  const driverPos =
    tracking.repartidor_lat != null && tracking.repartidor_lng != null
      ? { lat: tracking.repartidor_lat, lng: tracking.repartidor_lng }
      : null;
  const hasDriver = !!driverPos;

  return (
    <div className="tracking-page">
      <div className="tracking-card">
        {/* Header */}
        <div className="tracking-header">
          <div className="tracking-store">
            <div className="tracking-store-icon"><Store size={20} /></div>
            <div>
              <h2>{tracking.business_name || 'Tu pedido'}</h2>
              <span className="tracking-order">Pedido #{tracking.order_id}</span>
            </div>
          </div>
          <div className="tracking-live">
            <span className="tracking-live-dot" />
            <span>En vivo</span>
          </div>
        </div>

        {/* Real-time map (Google Maps) */}
        <div className="tracking-map-block">
          <DeliveryMap
            storeLocation={tracking.store_location}
            driverPos={driverPos}
            destAddress={tracking.direccion_entrega}
            destCoords={tracking.destino_lat != null && tracking.destino_lng != null
              ? { lat: tracking.destino_lat, lng: tracking.destino_lng }
              : null}
          />
          <div className="tracking-map-legend">
            <span className="tracking-legend-item">
              <span className="tracking-legend-badge" style={{ background: 'rgba(14,165,233,0.12)', color: '#0ea5e9' }}>🏪</span>
              Tienda
            </span>
            <span className="tracking-legend-item">
              <span className="tracking-legend-badge" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>🛵</span>
              Repartidor
            </span>
            <span className="tracking-legend-item">
              <span className="tracking-legend-badge" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>📍</span>
              Destino
            </span>
          </div>
          {hasDriver ? (
            <div className="tracking-map-hint">
              <Navigation size={13} />
              <span>La moto 🛵 marca la ubicación del repartidor en tiempo real.</span>
            </div>
          ) : (
            <div className="tracking-map-hint">
              <Bike size={13} />
              <span>El repartidor aún no comparte su ubicación. Esta es la ruta sugerida.</span>
            </div>
          )}
        </div>

        {/* Big status */}
        <div className="tracking-status" style={{ background: meta.bg, color: meta.color }}>
          <StatusIcon size={34} />
          <div>
            <strong>{meta.label}</strong>
            <span>{meta.sub}</span>
          </div>
        </div>

        {/* Progress steps */}
        <div className="tracking-steps">
          {STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            const isDone = idx < activeIdx;
            const isCurrent = idx === activeIdx;
            return (
              <div key={step.id} className="tracking-step-col">
                <div className="tracking-step-connector-track">
                  {idx > 0 && <div className={`tracking-step-connector ${isDone ? 'done' : ''}`} />}
                  <div
                    className={`tracking-step-dot ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
                    style={isCurrent ? { background: step.color, borderColor: step.color } : undefined}
                  >
                    <StepIcon size={16} />
                  </div>
                </div>
                <span className={`tracking-step-label ${isDone || isCurrent ? 'active' : ''}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Details */}
        <div className="tracking-details">
          {tracking.direccion_entrega && (
            <div className="tracking-detail">
              <MapPin size={18} />
              <div>
                <span className="tracking-detail-label">Dirección de entrega</span>
                <span className="tracking-detail-value">{tracking.direccion_entrega}</span>
              </div>
            </div>
          )}
          {tracking.repartidor && (
            <div className="tracking-detail">
              <User size={18} />
              <div>
                <span className="tracking-detail-label">Repartidor</span>
                <span className="tracking-detail-value">{tracking.repartidor}</span>
              </div>
            </div>
          )}
          <div className="tracking-detail">
            <Clock size={18} />
            <div>
              <span className="tracking-detail-label">Hora del pedido</span>
              <span className="tracking-detail-value">{formatTime(tracking.created_at)}</span>
            </div>
          </div>
          {tracking.total > 0 && (
            <div className="tracking-detail tracking-total-row">
              <Package size={18} />
              <div>
                <span className="tracking-detail-label">Total a pagar</span>
                <span className="tracking-detail-value tracking-total">{formatCurrency(tracking.total, tracking.moneda)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="tracking-footer">
          {tracking.tipo_pago && (
            <span className="tracking-pay">
              Pago: {TIPO_PAGO_LABEL[tracking.tipo_pago] || tracking.tipo_pago}
            </span>
          )}
          <span className="tracking-updated">
            <Refresh size={12} />
            Actualizado: {formatTime(new Date())}
          </span>
        </div>

        <div className="tracking-helper">
          <Phone size={13} />
          <span>¿Alguna duda? Comunícate con la tienda.</span>
        </div>
      </div>
    </div>
  );
}
