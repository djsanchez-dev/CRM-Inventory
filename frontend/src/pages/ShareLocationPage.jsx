import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import {
  Bike,
  MapPin,
  Crosshair,
  Refresh,
  X,
  CheckCircle2,
  AlertTriangle,
} from '../components/Icons';

const PUSH_INTERVAL = 4000; // push GPS every 4s while sharing

const STATUS_META = {
  idle: { title: 'Compartir mi ubicación', sub: 'Envía tu posición en tiempo real para que el cliente siga el pedido.', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' },
  requesting: { title: 'Solicitando permisos...', sub: 'Acepta el permiso de ubicación cuando el navegador lo pida.', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  sharing: { title: 'Compartiendo ubicación', sub: 'El cliente puede ver tu posición en el mapa en tiempo real.', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  stopped: { title: 'Ubicación detenida', sub: 'Ya no compartes tu posición.', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' },
  paused: { title: 'Ubicación en pausa', sub: 'Se pausó al pasar a segundo plano. Vuelve a la app para reanudar.', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  unsupported: { title: 'Navegador sin soporte', sub: 'Tu navegador no permite compartir la ubicación GPS.', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' },
  denied: { title: 'Permiso denegado', sub: 'Habilita la ubicación en tu navegador e inténtalo de nuevo.', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' },
  expired: { title: 'Pedido finalizado', sub: 'El pedido ya fue entregado o cancelado. Gracias.', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
};

/**
 * PUBLIC page the delivery person opens on their phone (link shared by the
 * store owner). NO login required. Uses the browser's geolocation API to
 * push GPS coordinates to the backend every few seconds so the customer's
 * tracking page can show a live map.
 */
export default function ShareLocationPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('idle'); // idle | requesting | sharing | stopped | paused | unsupported | denied | expired
  const [coords, setCoords] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [pushed, setPushed] = useState(0);
  const watchIdRef = useRef(null);
  const lastPushRef = useRef(0);
  const stoppedRef = useRef(false);
  const wasSharingRef = useRef(false); // resumed automatically after a visibility pause
  const mountedRef = useRef(true);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const pushLocation = useCallback(async (lat, lng) => {
    const now = Date.now();
    if (now - lastPushRef.current < PUSH_INTERVAL) return;
    lastPushRef.current = now;
    try {
      await api.updateTrackingLocation(token, lat, lng);
      if (mountedRef.current) setPushed((p) => p + 1);
    } catch (err) {
      // 410 → the order finished, stop sharing.
      if (err.status === 410 && mountedRef.current) {
        stopWatching();
        setStatus('expired');
      }
      // Other errors (network) are transient — keep trying next tick.
    }
  }, [token, stopWatching]);

  const stopSharing = () => {
    stoppedRef.current = true;
    wasSharingRef.current = false;
    stopWatching();
    setStatus('stopped');
  };

  // Extract the watch setup so both the button and the visibility handler
  // can start the same flow.
  const startWatch = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unsupported');
      return;
    }
    stoppedRef.current = false;
    wasSharingRef.current = false; // a manual start clears any pending auto-resume
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (!mountedRef.current || stoppedRef.current) return;
        const { latitude, longitude, accuracy: acc } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setAccuracy(Math.round(acc));
        setStatus('sharing');
        pushLocation(latitude, longitude);
      },
      (err) => {
        if (!mountedRef.current) return;
        if (err.code === err.PERMISSION_DENIED) {
          stopWatching();
          setStatus('denied');
        } else {
          // Position temporarily unavailable — keep watching.
          setStatus((s) => (s === 'sharing' ? s : 'requesting'));
        }
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
  }, [pushLocation, stopWatching]);

  const startSharing = () => {
    if (!('geolocation' in navigator)) {
      setStatus('unsupported');
      return;
    }
    setStatus('requesting');
    startWatch();
  };

  useEffect(() => {
    mountedRef.current = true;

    // Battery-friendly: pause the GPS watch while the tab is in the
    // background and resume automatically when the rider comes back — but
    // only if they were actually sharing when it was paused.
    const onVisibility = () => {
      if (document.hidden) {
        if (watchIdRef.current !== null) {
          wasSharingRef.current = true;
          stopWatching();
          if (mountedRef.current) setStatus('paused');
        }
      } else if (wasSharingRef.current && mountedRef.current) {
        wasSharingRef.current = false;
        setStatus('requesting');
        startWatch();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      mountedRef.current = false;
      stoppedRef.current = true;
      stopWatching();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [stopWatching, startWatch]);

  const meta = STATUS_META[status] || STATUS_META.idle;
  const sharing = status === 'sharing' || status === 'requesting';

  return (
    <div className="share-page">
      <div className="share-card">
        {/* Icon header */}
        <div className="share-icon" style={{ background: meta.bg, color: meta.color }}>
          {status === 'sharing' || status === 'requesting' ? <Crosshair size={40} /> : <Bike size={40} />}
        </div>
        <h2>{meta.title}</h2>
        <p className="share-sub">{meta.sub}</p>

        {/* Live coordinates readout */}
        {coords && sharing && (
          <div className="share-coords">
            <div className="share-coords-live">
              <span className="tracking-live-dot" />
              <span>Enviando posición en vivo</span>
            </div>
            <div className="share-coord-row">
              <MapPin size={15} />
              <span>{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</span>
            </div>
            {accuracy && (
              <div className="share-accuracy">
                Precisión: ±{accuracy} m
              </div>
            )}
            <div className="share-pushed">
              <Refresh size={13} />
              Actualizaciones enviadas: {pushed}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="share-actions">
          {!sharing && status !== 'expired' && status !== 'paused' && (
            <button className="btn btn-primary share-start" onClick={startSharing}>
              <Crosshair size={18} />
              <span>{status === 'stopped' || status === 'denied' ? 'Reanudar' : 'Iniciar'} ubicación</span>
            </button>
          )}
          {status === 'paused' && (
            <button className="btn btn-primary share-start" onClick={startSharing}>
              <Refresh size={18} />
              <span>Reanudar</span>
            </button>
          )}
          {sharing && (
            <button className="btn btn-danger share-stop" onClick={stopSharing}>
              <X size={18} />
              <span>Detener</span>
            </button>
          )}
        </div>

        {/* Status helper */}
        {(status === 'denied' || status === 'unsupported') && (
          <div className="share-warning">
            <AlertTriangle size={16} />
            <span>Activa el permiso de ubicación (GPS) en tu navegador y vuelve a intentarlo.</span>
          </div>
        )}
        {status === 'expired' && (
          <div className="share-done">
            <CheckCircle2 size={18} />
            <span>El cliente ya recibió su pedido. Puedes cerrar esta página.</span>
          </div>
        )}
        {!sharing && coords && (
          <button className="share-restart-link" onClick={startSharing}>
            Reanudar envío de ubicación
          </button>
        )}
      </div>
    </div>
  );
}
