const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Sesión expirada');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error en la solicitud');
  }

  return data;
}

export const api = {
  // Business
  checkBusinessStatus: () => request('/business/status'),
  setupBusiness: (data) =>
    request('/business/setup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Auth
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  // Products (paginated)
  getProducts: (params = '') => request(`/products${params}`),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) =>
    request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProduct: (id, data) =>
    request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProduct: (id) =>
    request(`/products/${id}`, {
      method: 'DELETE',
    }),

  // Categories
  getCategories: () => request('/categories'),
  getCategory: (id) => request(`/categories/${id}`),
  createCategory: (data) =>
    request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id, data) =>
    request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id) =>
    request(`/categories/${id}`, {
      method: 'DELETE',
    }),

  // Customers (paginated)
  getCustomers: (params = '') => request(`/customers${params}`),
  getCustomer: (id) => request(`/customers/${id}`),
  createCustomer: (data) =>
    request('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCustomer: (id, data) =>
    request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCustomer: (id) =>
    request(`/customers/${id}`, {
      method: 'DELETE',
    }),
  quickCreateCustomer: (data) =>
    request('/customers/quick', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Suppliers (paginated)
  getSuppliers: (params = '') => request(`/suppliers${params}`),
  getSupplier: (id) => request(`/suppliers/${id}`),
  createSupplier: (data) =>
    request('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSupplier: (id, data) =>
    request(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSupplier: (id) =>
    request(`/suppliers/${id}`, {
      method: 'DELETE',
    }),

  // Sales (paginated)
  getSales: (params = '') => request(`/sales${params}`),
  getSale: (id) => request(`/sales/${id}`),
  createSale: (data) =>
    request('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteSale: (id) =>
    request(`/sales/${id}`, {
      method: 'DELETE',
    }),

  // Purchases
  getPurchases: (params = '') => request(`/purchases${params}`),
  getPurchase: (id) => request(`/purchases/${id}`),
  createPurchase: (data) =>
    request('/purchases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deletePurchase: (id) =>
    request(`/purchases/${id}`, {
      method: 'DELETE',
    }),

  // Users
  getUsers: () => request('/users'),
  getUser: (id) => request(`/users/${id}`),
  createUser: (data) =>
    request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id, data) =>
    request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteUser: (id) =>
    request(`/users/${id}`, {
      method: 'DELETE',
    }),

  // Profile
  updateProfile: (data) =>
    request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Business Config
  getBusinessConfig: () => request('/business/config'),
  updateBusinessConfig: (data) =>
    request('/business/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Dashboard
  getDashboard: () => request('/dashboard/stats'),

  // Reports
  getSupplierSpending: (params = '') => request(`/reports/supplier-spending${params}`),
};
