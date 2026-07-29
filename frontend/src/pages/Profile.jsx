import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBusinessConfig } from '../context/BusinessConfig';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import { User as UserIcon, Shield, Eye, EyeOff, Save, AlertCircle, Package } from '../components/Icons';

export default function Profile() {
  const { user, updateUser, business } = useAuth();
  const { t } = useBusinessConfig();
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword && newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword && !currentPassword) {
      setError('Debes ingresar tu contraseña actual para cambiarla');
      return;
    }

    setSaving(true);
    try {
      const data = { nombre };
      if (newPassword) {
        data.currentPassword = currentPassword;
        data.newPassword = newPassword;
      }

      const result = await api.updateProfile(data);

      // Update auth context and stored data
      updateUser(result.user, result.token);

      toast.success('Perfil actualizado correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-sidebar">
          <div className="profile-avatar">
            {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <h2 className="profile-name">{user?.nombre}</h2>
          <div className="profile-username">@{user?.username}</div>
          <span className={`badge ${user?.rol === 'admin' ? 'badge-admin' : 'badge-user'}`}>
            {user?.rol === 'admin' ? 'Administrador' : 'Usuario'}
          </span>

          <div className="profile-app-info">
            <div className="profile-app-logo">
              <Package size={20} />
            </div>
            <div className="profile-app-text">
              <span>{business?.nombre || 'CRM Inventario'}</span>
              <span className="text-muted">{t('dashboard')}</span>
            </div>
          </div>
        </div>

        <div className="profile-main">
          <h3>Mi Perfil</h3>
          <p className="profile-subtitle">Actualiza tu información personal y contraseña</p>

          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Nombre completo</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
              />
            </div>

            <div className="form-group">
              <label>Usuario</label>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="input-disabled"
              />
              <span className="field-hint">El nombre de usuario no se puede cambiar</span>
            </div>

            <hr className="profile-divider" />

            <h4>Cambiar Contraseña</h4>
            <p className="field-hint">Deja estos campos vacíos si no deseas cambiar tu contraseña</p>

            <div className="form-group">
              <label>Contraseña actual</label>
              <div className="password-input">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Tu contraseña actual"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPw(!showPw)}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Nueva contraseña</label>
                <input
                  type="password"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="form-group">
                <label>Confirmar contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary profile-save-btn" disabled={saving}>
              <Save size={18} />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
