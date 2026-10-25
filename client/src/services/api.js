const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }
  return data;
}

export const api = {
  // Dashboard
  getDashboard: (branchId) => request(`/dashboard?branch_id=${branchId || 'all'}`),

  // Branches
  getBranches: () => request('/branches'),
  createBranch: (data) => request('/branches', { method: 'POST', body: JSON.stringify(data) }),
  updateBranch: (id, data) => request(`/branches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBranch: (id, force = false) => request(`/branches/${id}${force ? '?force=true' : ''}`, { method: 'DELETE' }),

  // Products
  getProducts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/products${q ? `?${q}` : ''}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getCategories: () => request('/products/categories'),

  // Inventory
  getInventory: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/inventory${q ? `?${q}` : ''}`);
  },
  updateRackLocation: (branchId, productId, data) =>
    request(`/inventory/${branchId}/${productId}/location`, { method: 'PUT', body: JSON.stringify(data) }),
  getTransfers: (branchId) => request(`/inventory/transfers?branch_id=${branchId || 'all'}`),
  createTransfer: (data) => request('/inventory/transfers', { method: 'POST', body: JSON.stringify(data) }),
  updateTransferStatus: (id, data) => request(`/inventory/transfers/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  getAdjustments: (branchId) => request(`/inventory/adjustments?branch_id=${branchId || 'all'}`),
  createAdjustment: (data) => request('/inventory/adjustments', { method: 'POST', body: JSON.stringify(data) }),

  // Purchases & Vendors
  getPurchases: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/purchases${q ? `?${q}` : ''}`);
  },
  getPurchase: (id) => request(`/purchases/${id}`),
  createPurchase: (data) => request('/purchases', { method: 'POST', body: JSON.stringify(data) }),
  getVendors: () => request('/purchases/vendors'),
  createVendor: (data) => request('/purchases/vendors', { method: 'POST', body: JSON.stringify(data) }),

  // Sales & POS
  getSales: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/sales${q ? `?${q}` : ''}`);
  },
  getSale: (id) => request(`/sales/${id}`),
  createSale: (data) => request('/sales', { method: 'POST', body: JSON.stringify(data) }),
  getCustomers: () => request('/sales/customers'),
  createCustomer: (data) => request('/sales/customers', { method: 'POST', body: JSON.stringify(data) }),

  // Banking
  getBankAccounts: (branchId) => request(`/banking/accounts?branch_id=${branchId || 'all'}`),
  createBankAccount: (data) => request('/banking/accounts', { method: 'POST', body: JSON.stringify(data) }),
  getBankTransactions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/banking/transactions${q ? `?${q}` : ''}`);
  },
  transferFunds: (data) => request('/banking/transfer', { method: 'POST', body: JSON.stringify(data) }),
  reconcileTransaction: (data) => request('/banking/reconcile', { method: 'POST', body: JSON.stringify(data) }),

  // Receipts & Payments
  getReceipts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/payments/receipts${q ? `?${q}` : ''}`);
  },
  createReceipt: (data) => request('/payments/receipts', { method: 'POST', body: JSON.stringify(data) }),
  getPayments: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/payments/payments${q ? `?${q}` : ''}`);
  },
  createPayment: (data) => request('/payments/payments', { method: 'POST', body: JSON.stringify(data) }),

  // Accounting & GL
  getChartOfAccounts: () => request('/accounting/chart-of-accounts'),
  createAccount: (data) => request('/accounting/chart-of-accounts', { method: 'POST', body: JSON.stringify(data) }),
  getJournals: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/accounting/journals${q ? `?${q}` : ''}`);
  },
  createManualJournal: (data) => request('/accounting/manual-journal', { method: 'POST', body: JSON.stringify(data) }),
  getTrialBalance: (branchId) => request(`/accounting/trial-balance?branch_id=${branchId || 'all'}`),
  getProfitAndLoss: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/accounting/profit-and-loss${q ? `?${q}` : ''}`);
  },
  getBalanceSheet: (branchId) => request(`/accounting/balance-sheet?branch_id=${branchId || 'all'}`),
  getGeneralLedger: (accountId) => request(`/accounting/general-ledger/${accountId}`),
};
