import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchBranches = async () => {
    try {
      const res = await api.getBranches();
      if (res.success) {
        setBranches(res.branches || []);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const triggerRefresh = () => {
    setRefreshKey(k => k + 1);
    fetchBranches();
  };

  const selectedBranch = selectedBranchId === 'all'
    ? { id: 'all', code: 'ALL', name: 'All Branches (Consolidated)', is_warehouse: 0 }
    : branches.find(b => String(b.id) === String(selectedBranchId)) || { id: 'all', name: 'All Branches' };

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  return (
    <AppContext.Provider value={{
      branches,
      fetchBranches,
      selectedBranchId,
      setSelectedBranchId,
      selectedBranch,
      loadingBranches,
      toasts,
      addToast,
      removeToast,
      formatCurrency,
      refreshKey,
      triggerRefresh
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
