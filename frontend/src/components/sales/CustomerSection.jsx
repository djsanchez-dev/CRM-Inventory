import { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, Users, Star, Phone, User } from 'lucide-react';

export default function CustomerSection({
  customers,
  selectedCustomer,
  onSelectCustomer,
  onRemoveCustomer,
  onQuickCreate,
}) {
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    if (showCustomerSearch && customerSearch.length >= 1) {
      const filtered = customers.filter(
        (c) =>
          c.nombre.toLowerCase().includes(customerSearch.toLowerCase()) ||
          (c.telefono && c.telefono.includes(customerSearch))
      );
      setCustomerResults(filtered.slice(0, 8));
    } else {
      setCustomerResults([]);
    }
  }, [customerSearch, customers, showCustomerSearch]);

  const handleAddCustomer = (customer) => {
    onSelectCustomer(customer);
    setCustomerSearch('');
    setCustomerResults([]);
    setShowCustomerSearch(false);
    setShowQuickForm(false);
  };

  const handleQuickCreate = async () => {
    if (!quickName.trim()) return;
    try {
      const newCustomer = await onQuickCreate(quickName.trim(), quickPhone.trim() || null);
      setQuickName('');
      setQuickPhone('');
      setShowQuickForm(false);
      // onSelectCustomer is called inside onQuickCreate
    } catch (e) {
      // error handled by parent
    }
  };

  const handleRemoveCustomer = () => {
    onRemoveCustomer();
    setCustomerSearch('');
    setCustomerResults([]);
  };

  if (!selectedCustomer) {
    return (
      <div className="customer-section">
        <div className="customer-default">
          <div className="customer-default-badge">
            <Users size={16} />
            <span>Venta Directa</span>
          </div>
          <p className="customer-default-hint">Venta sin cliente registrado</p>
          <div className="customer-actions-row">
            <button
              className="btn btn-sm btn-outline"
              onClick={() => {
                setShowCustomerSearch(!showCustomerSearch);
                setShowQuickForm(false);
              }}
            >
              <Search size={14} />
              Buscar cliente
            </button>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => {
                setShowQuickForm(true);
                setShowCustomerSearch(false);
              }}
            >
              <Plus size={14} />
              Registrar
            </button>
          </div>
        </div>

        {showCustomerSearch && (
          <div className="customer-search-panel">
            <div className="search-box customer-search-input">
              <Search size={14} />
              <input
                ref={searchRef}
                type="text"
                placeholder="Buscar por nombre o teléfono..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                autoFocus
              />
              {customerSearch && (
                <button className="clear-btn" onClick={() => setCustomerSearch('')}>
                  <X size={14} />
                </button>
              )}
            </div>
            {customerResults.length > 0 && (
              <div className="customer-results">
                {customerResults.map((c) => (
                  <div
                    key={c.id}
                    className="customer-result-item"
                    onClick={() => handleAddCustomer(c)}
                  >
                    <div className="customer-result-avatar">
                      {c.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="customer-result-info">
                      <span className="customer-result-name">{c.nombre}</span>
                      {c.telefono && (
                        <span className="customer-result-phone">{c.telefono}</span>
                      )}
                    </div>
                    <span className="customer-result-points">
                      <Star size={12} />
                      {c.puntos || 0}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {customerSearch && customerResults.length === 0 && (
              <p className="text-muted customer-no-results">
                No se encontraron clientes.{' '}
                <button
                  className="link-btn"
                  onClick={() => {
                    setQuickName(customerSearch);
                    setShowQuickForm(true);
                    setShowCustomerSearch(false);
                  }}
                >
                  Registrar &quot;{customerSearch}&quot;
                </button>
              </p>
            )}
          </div>
        )}

        {showQuickForm && (
          <div className="quick-customer-form">
            <div className="quick-form-row">
              <input
                type="text"
                placeholder="Nombre *"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                className="quick-form-input"
                autoFocus
              />
              <input
                type="text"
                placeholder="Teléfono"
                value={quickPhone}
                onChange={(e) => setQuickPhone(e.target.value)}
                className="quick-form-input"
              />
            </div>
            <div className="quick-form-actions">
              <button
                className="btn btn-sm btn-primary"
                onClick={handleQuickCreate}
                disabled={!quickName.trim()}
              >
                <User size={14} />
                Registrar y seleccionar
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setShowQuickForm(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="customer-section">
      <div className="customer-selected">
        <div className="customer-selected-header">
          <div className="customer-selected-info">
            <div className="customer-selected-avatar">
              {selectedCustomer.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="customer-selected-details">
              <span className="customer-selected-name">{selectedCustomer.nombre}</span>
              {selectedCustomer.telefono && (
                <span className="customer-selected-phone">
                  <Phone size={12} />
                  {selectedCustomer.telefono}
                </span>
              )}
            </div>
          </div>
          <button className="btn-icon" onClick={handleRemoveCustomer} title="Desvincular cliente">
            <X size={14} />
          </button>
        </div>

        <div className="customer-selected-stats">
          <div className="cstat">
            <span className="cstat-label">Compras</span>
            <span className="cstat-value">{selectedCustomer.total_compras || 0}</span>
          </div>
          <div className="cstat">
            <span className="cstat-label">Gastado</span>
            <span className="cstat-value">
              {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(
                selectedCustomer.total_gastado || 0
              )}
            </span>
          </div>
          <div className="cstat points">
            <span className="cstat-label">
              <Star size={12} /> Puntos
            </span>
            <span className="cstat-value">{selectedCustomer.puntos || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
