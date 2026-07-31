const API_BASE = '/api';
const MAX_RETRIES = 2;

// Store pending token refresh promise to avoid race conditions
let pendingTokenRefresh = null;

/**
 * Create a fetch request with timeout and abort support
 */
function createFetch(url, options = {}, timeout = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  return fetch(url, {
    ...options,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }).finally(() => clearTimeout(timeoutId));
}

/**
 * Attempt to refresh the JWT token.
 * Returns the new token or null if refresh fails.
 */
async function refreshToken() {
  // Deduplicate concurrent refresh attempts
  if (pendingTokenRefresh) return pendingTokenRefresh;

  pendingTokenRefresh = (async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const res = await createFetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }, 10000);

      if (!res.ok) return null;

      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        return data.token;
      }
      return null;
    } catch {
      return null;
    } finally {
      pendingTokenRefresh = null;
    }
  })();

  return pendingTokenRefresh;
}

/**
 * Clear all auth state and redirect to login
 */
function clearSession() {
  const keys = ['token', 'user', 'business', 'businessConfig'];
  keys.forEach(key => localStorage.removeItem(key));
  window.location.href = '/login';
}

/**
 * Interceptor-style request function
 */
async function request(endpoint, options = {}) {
  const { retryCount = 0, ...fetchOptions } = options;
  const token = localStorage.getItem('token');

  // Build headers
  const headers = { ...fetchOptions.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Don't set Content-Type for FormData (auto-set by browser)
  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await createFetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
    });
  } catch (error) {
    // Network error — retry once
    if (error.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado. Intente de nuevo.');
    }
    if (retryCount < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
      return request(endpoint, { ...options, retryCount: retryCount + 1 });
    }
    throw new Error('Error de conexión. Verifique su internet.');
  }

  // Handle 401 — try token refresh once
  if (response.status === 401) {
    if (retryCount === 0) {
      const newToken = await refreshToken();
      if (newToken) {
        return request(endpoint, { ...options, retryCount: 1 });
      }
    }
    clearSession();
    throw new Error('Sesión expirada');
  }

  // Parse response
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.error || data.message || 'Error en la solicitud';
    // Throw with field-level details if available
    const error = new Error(errorMessage);
    error.status = response.status;
    error.details = data.details;
    throw error;
  }

  return data;
}

/**
 * Helper to build query string from params object
 */
function buildQuery(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Public API methods
 */
export const api = {
  // ========== Business ==========
  checkBusinessStatus: () => request('/business/status'),
  
  setupBusiness: (data) =>
    request('/business/setup', { method: 'POST', body: JSON.stringify(data) }),

  getBusinessConfig: () => request('/business/config'),
  
  updateBusinessConfig: (data) =>
    request('/business/config', { method: 'PUT', body: JSON.stringify(data) }),

  // ========== Auth ==========
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  verifyToken: () => request('/auth/verify'),

  // ========== Products ==========
  getProducts: (params = '') =>
    request(`/products${typeof params === 'string' ? params : buildQuery(params)}`),

  getProduct: (id) => request(`/products/${id}`),

  createProduct: (data) =>
    request('/products', { method: 'POST', body: JSON.stringify(data) }),

  updateProduct: (id, data) =>
    request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteProduct: (id) =>
    request(`/products/${id}`, { method: 'DELETE' }),

  // ========== Categories ==========
  getCategories: () => request('/categories'),

  getCategory: (id) => request(`/categories/${id}`),

  createCategory: (data) =>
    request('/categories', { method: 'POST', body: JSON.stringify(data) }),

  updateCategory: (id, data) =>
    request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteCategory: (id) =>
    request(`/categories/${id}`, { method: 'DELETE' }),

  // ========== Customers ==========
  getCustomers: (params = '') =>
    request(`/customers${typeof params === 'string' ? params : buildQuery(params)}`),

  getCustomer: (id) => request(`/customers/${id}`),

  createCustomer: (data) =>
    request('/customers', { method: 'POST', body: JSON.stringify(data) }),

  updateCustomer: (id, data) =>
    request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteCustomer: (id) =>
    request(`/customers/${id}`, { method: 'DELETE' }),

  quickCreateCustomer: (data) =>
    request('/customers/quick', { method: 'POST', body: JSON.stringify(data) }),

  // ========== Suppliers ==========
  getSuppliers: (params = '') =>
    request(`/suppliers${typeof params === 'string' ? params : buildQuery(params)}`),

  getSupplier: (id) => request(`/suppliers/${id}`),

  createSupplier: (data) =>
    request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),

  updateSupplier: (id, data) =>
    request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteSupplier: (id) =>
    request(`/suppliers/${id}`, { method: 'DELETE' }),

  // ========== Sales ==========
  getSales: (params = '') =>
    request(`/sales${typeof params === 'string' ? params : buildQuery(params)}`),

  getSale: (id) => request(`/sales/${id}`),

  createSale: (data) =>
    request('/sales', { method: 'POST', body: JSON.stringify(data) }),

  deleteSale: (id) =>
    request(`/sales/${id}`, { method: 'DELETE' }),

  // ========== Services (Car Wash / Mecánica) ==========
  getServices: (params = '') =>
    request(`/services${typeof params === 'string' ? params : buildQuery(params)}`),

  getServicesSummary: (params = '') =>
    request(`/services/summary${typeof params === 'string' ? params : buildQuery(params)}`),

  createService: (data) =>
    request('/services', { method: 'POST', body: JSON.stringify(data) }),

  deleteService: (id) =>
    request(`/services/${id}`, { method: 'DELETE' }),

  // ========== Purchases ==========
  getPurchases: (params = '') =>
    request(`/purchases${typeof params === 'string' ? params : buildQuery(params)}`),

  getPurchase: (id) => request(`/purchases/${id}`),

  createPurchase: (data) =>
    request('/purchases', { method: 'POST', body: JSON.stringify(data) }),

  deletePurchase: (id) =>
    request(`/purchases/${id}`, { method: 'DELETE' }),

  // ========== Users ==========
  getUsers: () => request('/users'),

  getUser: (id) => request(`/users/${id}`),

  createUser: (data) =>
    request('/users', { method: 'POST', body: JSON.stringify(data) }),

  updateUser: (id, data) =>
    request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteUser: (id) =>
    request(`/users/${id}`, { method: 'DELETE' }),

  updateProfile: (data) =>
    request('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // ========== Dashboard ==========
  getDashboard: () => request('/dashboard/stats'),

  // ========== Reports ==========
  getSupplierSpending: (params = '') =>
    request(`/reports/supplier-spending${typeof params === 'string' ? params : buildQuery(params)}`),

  getServicesReport: (params = '') =>
    request(`/reports/services${typeof params === 'string' ? params : buildQuery(params)}`),

  // ========== Super Admin ==========
  getAdminStats: () => request('/admin/stats'),

  getAdminBusinesses: (params = '') =>
    request(`/admin/businesses${typeof params === 'string' ? params : buildQuery(params)}`),

  getAdminBusiness: (id) => request(`/admin/businesses/${id}`),

  deleteAdminBusiness: (id) =>
    request(`/admin/businesses/${id}`, { method: 'DELETE' }),

  getAdminUsers: (params = '') =>
    request(`/admin/users${typeof params === 'string' ? params : buildQuery(params)}`),

  updateAdminUser: (id, data) =>
    request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  resetAdminUserPassword: (id, newPassword) =>
    request(`/admin/users/${id}/reset-password`, { method: 'PUT', body: JSON.stringify({ newPassword }) }),

  deleteAdminUser: (id) =>
    request(`/admin/users/${id}`, { method: 'DELETE' }),
};
