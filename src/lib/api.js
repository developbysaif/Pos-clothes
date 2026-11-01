// Centralized API Client for MR BILAL Ladies Wear POS
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const token = typeof window !== 'undefined' ? localStorage.getItem('boutique_token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
    }
    return data;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return response;
}

export const api = {
  // Auth
  login: (credentials) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => fetchApi('/auth/me'),

  // Dashboard
  getDashboardStats: () => fetchApi('/dashboard/stats'),

  // Products & Variants
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/products${query ? `?${query}` : ''}`);
  },
  getProductById: (id) => fetchApi(`/products/${id}`),
  createProduct: (data) => fetchApi('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => fetchApi(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => fetchApi(`/products/${id}`, { method: 'DELETE' }),

  // POS & Barcode Scanner
  scanBarcode: (code) => fetchApi(`/sales/scan?code=${encodeURIComponent(code)}`),
  createSale: (data) => fetchApi('/sales', { method: 'POST', body: JSON.stringify(data) }),
  getSales: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/sales${query ? `?${query}` : ''}`);
  },
  getSaleById: (id) => fetchApi(`/sales/${id}`),
  cancelSale: (id, reason) => fetchApi(`/sales/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Returns & Exchanges
  getReturns: () => fetchApi('/returns'),
  createReturn: (data) => fetchApi('/returns', { method: 'POST', body: JSON.stringify(data) }),

  // Inventory & Stock
  getInventory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/inventory${query ? `?${query}` : ''}`);
  },
  adjustStock: (data) => fetchApi('/inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),
  getStockMovements: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/inventory/movements${query ? `?${query}` : ''}`);
  },
  getTransfers: () => fetchApi('/inventory/transfers'),
  createTransfer: (data) => fetchApi('/inventory/transfers', { method: 'POST', body: JSON.stringify(data) }),

  // Purchases & Suppliers
  getPurchases: () => fetchApi('/purchases'),
  createPurchase: (data) => fetchApi('/purchases', { method: 'POST', body: JSON.stringify(data) }),
  getSuppliers: () => fetchApi('/suppliers'),
  createSupplier: (data) => fetchApi('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  getSupplierById: (id) => fetchApi(`/suppliers/${id}`),
  paySupplier: (id, data) => fetchApi(`/suppliers/${id}/pay`, { method: 'POST', body: JSON.stringify(data) }),

  // Customers (CRM)
  getCustomers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/customers${query ? `?${query}` : ''}`);
  },
  createCustomer: (data) => fetchApi('/customers', { method: 'POST', body: JSON.stringify(data) }),
  getCustomerById: (id) => fetchApi(`/customers/${id}`),
  updateCustomer: (id, data) => fetchApi(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  payCustomer: (id, data) => fetchApi(`/customers/${id}/pay`, { method: 'POST', body: JSON.stringify(data) }),

  // Expenses & Accounts
  getExpenses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/expenses${query ? `?${query}` : ''}`);
  },
  createExpense: (data) => fetchApi('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  deleteExpense: (id) => fetchApi(`/expenses/${id}`, { method: 'DELETE' }),

  // Cash Register Shifts
  getCurrentShift: () => fetchApi('/cash-register/current'),
  openShift: (data) => fetchApi('/cash-register/open', { method: 'POST', body: JSON.stringify(data) }),
  closeShift: (data) => fetchApi('/cash-register/close', { method: 'POST', body: JSON.stringify(data) }),
  getShiftHistory: () => fetchApi('/cash-register/history'),

  // Reports
  getSalesReport: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/reports/sales-summary${query ? `?${query}` : ''}`);
  },
  getProfitLossReport: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/reports/profit-loss${query ? `?${query}` : ''}`);
  },
  getInventoryValuation: () => fetchApi('/reports/inventory-valuation'),

  // Categories, Brands, Sizes, Colors
  getCategories: () => fetchApi('/categories'),
  createCategory: (data) => fetchApi('/categories', { method: 'POST', body: JSON.stringify(data) }),

  // Employees & Roles
  getEmployees: () => fetchApi('/employees'),
  createEmployee: (data) => fetchApi('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id, data) => fetchApi(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Settings & Backup
  getSettings: () => fetchApi('/settings'),
  updateSettings: (data) => fetchApi('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  downloadBackup: () => fetchApi('/settings/backup'),
  restoreBackup: (backupData) => fetchApi('/settings/restore', { method: 'POST', body: JSON.stringify({ backupData }) }),
};
