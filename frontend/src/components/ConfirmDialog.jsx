import { useEffect, useRef } from 'react';
import { AlertCircle, X, Bell } from './Icons';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  message = '¿Estás seguro de realizar esta acción?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger', // 'danger' | 'warning' | 'info'
  loading = false,
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the confirm button when opened
      setTimeout(() => confirmRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const variantColors = {
    danger: { border: '#fecaca', bg: '#fef2f2', icon: '#ef4444', btnBg: '#ef4444', btnHover: '#dc2626' },
    warning: { border: '#fde68a', bg: '#fffbeb', icon: '#f59e0b', btnBg: '#f59e0b', btnHover: '#d97706' },
    info: { border: '#bfdbfe', bg: '#eff6ff', icon: '#3b82f6', btnBg: '#3b82f6', btnHover: '#2563eb' },
  };

  const colors = variantColors[variant] || variantColors.danger;

  return (
    <>
      <div
        className="modal-overlay"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.15s ease-out' }}
      />
      <div
        className="modal modal-sm confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        style={{ animation: 'slideUp 0.2s ease-out', zIndex: 201 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ borderBottom: 'none' }}>
          <h2 id="confirm-title">{title}</h2>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body" style={{ paddingTop: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              padding: 16,
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ color: colors.icon, flexShrink: 0, marginTop: 2 }}>
              {variant === 'danger' ? (
                <AlertCircle size={22} />
              ) : variant === 'warning' ? (
                <AlertCircle size={22} />
              ) : (
                <Bell size={22} />
              )}
            </div>
            <div>
              <p
                style={{
                  color: '#475569',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            className="btn"
            onClick={onConfirm}
            disabled={loading}
            style={{
              background: colors.btnBg,
              color: 'white',
              fontWeight: 600,
              minWidth: 100,
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => e.target.style.background = colors.btnHover}
            onMouseLeave={(e) => e.target.style.background = colors.btnBg}
          >
            {loading ? (
              <span className="spinner-small" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </>
  );
}
