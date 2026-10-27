import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Load saved user from localStorage
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('wine_erp_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(() => {
    try {
      const saved = localStorage.getItem('wine_erp_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.role !== 'admin' && u.branch_id) {
          return u.branch_id;
        }
      }
    } catch (e) {}
    return 'all';
  });

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

  // When user changes, enforce branch selection
  useEffect(() => {
    if (user && user.role !== 'admin' && user.branch_id) {
      setSelectedBranchId(user.branch_id);
    }
  }, [user]);

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

  // Login handler
  const login = async (username, password) => {
    const res = await api.login({ username, password });
    if (res.success && res.user) {
      setUser(res.user);
      localStorage.setItem('wine_erp_user', JSON.stringify(res.user));
      if (res.user.role !== 'admin' && res.user.branch_id) {
        setSelectedBranchId(res.user.branch_id);
      } else {
        setSelectedBranchId('all');
      }
      addToast(res.message || `Welcome, ${res.user.name}!`, 'success');
      return res.user;
    }
    throw new Error(res.error || 'Login failed');
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    localStorage.removeItem('wine_erp_user');
    setSelectedBranchId('all');
    addToast('Logged out successfully', 'info');
  };

  // Branch switcher guard (blocks non-admins from changing branch)
  const handleSetSelectedBranchId = (newId) => {
    if (user && user.role !== 'admin' && user.branch_id) {
      addToast(`Locked to your assigned branch: ${user.branch_name}`, 'info');
      return;
    }
    setSelectedBranchId(newId);
  };

  const selectedBranch = selectedBranchId === 'all'
    ? { id: 'all', code: 'ALL', name: 'All Branches (Consolidated)', is_warehouse: 0 }
    : branches.find(b => String(b.id) === String(selectedBranchId)) || { id: 'all', name: 'All Branches' };

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const handleCleanDatabase = async () => {
    try {
      const res = await api.cleanDatabase();
      if (res.success) {
        addToast('Database successfully cleaned and re-seeded with Indian catalog & outlets! (डेटाबेस साफ़ कर नया डेटा भरा गया)', 'success');
        // Refresh local state
        triggerRefresh();
        // If current logged-in user was an old one, update to admin
        if (!user || user.role === 'admin') {
          setSelectedBranchId('all');
        }
        return res;
      }
    } catch (err) {
      addToast('Failed to clean database: ' + err.message, 'error');
      throw err;
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      login,
      logout,
      branches,
      fetchBranches,
      selectedBranchId,
      setSelectedBranchId: handleSetSelectedBranchId,
      selectedBranch,
      loadingBranches,
      toasts,
      addToast,
      removeToast,
      formatCurrency,
      refreshKey,
      triggerRefresh,
      cleanDatabase: handleCleanDatabase
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
