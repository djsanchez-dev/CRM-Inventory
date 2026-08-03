import { useState, useRef, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { api } from '../api/client';
import { X, LinkIcon, Share, Navigation, MapPin, CheckCircle2, Refresh } from '../components/Icons';

const trackingUrl = (token) => `${window.location.origin}/tracking/${token}`;
const shareUrl = (token) => `${window.location.origin}/share/${token}`;

/** Inline QR block — the phone camera opens the link when scanned */
function QrBlock({ url, caption }) {
  return (
    <div className="share-modal-qr">
      <div className="share-modal-qr-canvas">
        {url ? (
          <QRCode value={url} size={132} bgColor="#ffffff" fgColor="#0f172a" level="M" />
        ) : (
          <div className="share-modal-qr-pending">
            <Refresh size={20} />
            <span>Generando link...</span>
          </div>
        )}
      </div>
      <span className="share-modal-qr-caption">{caption}</span>
    </div>
  );
}

/** Copy text to clipboard with a fallback for non-secure contexts (LAN HTTP) */
async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

/**
 * ShareDeliveryModal — one place to share both public links of a delivery:
 *  - customer tracking link (/tracking/:token)
 *  - rider location link (/share/:token)
 * Each can be copied or sent by WhatsApp. Generates the token on the fly
 * for old orders that predate the tracking feature.
 */
export default function ShareDeliveryModal({ sale, onClose }) {
  const [token, setToken] = useState(sale.tracking_token || '');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(null); // 'cliente' | 'repartidor'
  const busyRef = useRef(false); // guards against double-clicks (state lags)
  const copiedTimeoutRef = useRef(null);

  const ensureToken = async () => {
    if (token) return token;
    if (busyRef.current) return token;
    busyRef.current = true;
    setBusy(true);
    try {
      const res = await api.createTrackingToken(sale.id);
      setToken(res.tracking_token);
      return res.tracking_token;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  // Clean up the copied-state timer on unmount
  useEffect(() => () => clearTimeout(copiedTimeoutRef.current), []);

  // Auto-generate the token on open (for old orders that predate the tracking
  // feature) so the QR appears immediately without an extra click.
  useEffect(() => {
    if (!sale.tracking_token) ensureToken().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = async (kind) => {
    try {
      const t = await ensureToken();
      if (!t) return;
      const url = kind === 'cliente' ? trackingUrl(t) : shareUrl(t);
      await copyToClipboard(url);
      setCopied(kind);
      clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setCopied((c) => (c === kind ? null : c)), 1800);
    } catch (e) {
      // silent fallback — buttons remain visible
    }
  };

  const handleWhatsApp = async (kind) => {
    try {
      const t = await ensureToken();
      if (!t) return;
      const url = kind === 'cliente' ? trackingUrl(t) : shareUrl(t);
      const msg = encodeURIComponent(
        kind === 'cliente'
          ? `¡Hola! Tu pedido #${sale.id} va en camino. Sigue su entrega en tiempo real aquí: ${url}`
          : `Comparte tu ubicación en vivo para el pedido #${sale.id}: ${url}`
      );
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    } catch (e) {}
  };



  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Compartir Pedido #{sale.id}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="share-modal-links">
            <div className="share-modal-section">
              <span className="share-modal-section-title" style={{ color: 'var(--primary)' }}>
                <Navigation size={16} /> Link del cliente (seguimiento en vivo)
              </span>
              <div className="share-modal-url">
                <LinkIcon size={13} />
                <span>{token ? trackingUrl(token) : 'Generando link...'}</span>
              </div>
              <div className="share-modal-actions">
                <button
                  className={`btn btn-sm ${copied === 'cliente' ? 'btn-copied' : 'btn-primary'}`}
                  onClick={() => handleCopy('cliente')}
                  disabled={busy}
                >
                  {copied === 'cliente' ? (
                    <><CheckCircle2 size={15} /> Copiado</>
                  ) : (
                    <><LinkIcon size={15} /> Copiar</>
                  )}
                </button>
                <button className="btn btn-sm btn-success" onClick={() => handleWhatsApp('cliente')} disabled={busy}>
                  <Share size={15} /> WhatsApp
                </button>
              </div>
              <QrBlock
                url={token ? trackingUrl(token) : null}
                caption="Escanea para ver el seguimiento en el celular del cliente"
              />
            </div>

            <div className="share-modal-section">
              <span className="share-modal-section-title" style={{ color: '#059669' }}>
                <MapPin size={16} /> Link del repartidor (ubicación GPS)
              </span>
              <div className="share-modal-url">
                <MapPin size={13} />
                <span>{token ? shareUrl(token) : 'Generando link...'}</span>
              </div>
              <div className="share-modal-actions">
                <button
                  className={`btn btn-sm ${copied === 'repartidor' ? 'btn-copied' : 'btn-primary'}`}
                  onClick={() => handleCopy('repartidor')}
                  disabled={busy}
                >
                  {copied === 'repartidor' ? (
                    <><CheckCircle2 size={15} /> Copiado</>
                  ) : (
                    <><LinkIcon size={15} /> Copiar</>
                  )}
                </button>
                <button className="btn btn-sm btn-success" onClick={() => handleWhatsApp('repartidor')} disabled={busy}>
                  <Share size={15} /> WhatsApp
                </button>
              </div>
              <QrBlock
                url={token ? shareUrl(token) : null}
                caption="Escanea para que el repartidor comparta su ubicación desde el celular"
              />
            </div>

            <div className="share-modal-note">
              <Refresh size={14} />
              <span>
                El cliente ve el mapa en tiempo real con la ruta sugerida y la moto del repartidor.
                El repartidor abre su link y pulsa «Iniciar ubicación» para compartir su GPS.
                Ambos enlaces se desactivan cuando el pedido se entrega o cancela.
              </span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
