import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  IndianRupee,
  TrendingUp,
  Wine,
  Boxes,
  CreditCard,
  Building2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  PlusCircle,
  Truck,
  Landmark,
  Clock,
  Sparkles,
  RotateCcw
} from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const { selectedBranchId, selectedBranch, formatCurrency, refreshKey, user, addToast, triggerRefresh } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);

  const handleCleanDatabase = async () => {
    if (!window.confirm('Are you sure you want to clean and reseed the entire database with fresh Indian liquor store catalog, outlets, accounts, and demo stock? This cannot be undone.')) {
      return;
    }
    setCleaning(true);
    try {
      const res = await api.cleanDatabase();
      if (res.success) {
        addToast(res.message || 'Database reset successfully with clean Indian catalog!', 'success');
        triggerRefresh();
        fetchDashboard();
      } else {
        addToast(res.error || 'Failed to reset database', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error resetting database', 'error');
    } finally {
      setCleaning(false);
    }
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboard(selectedBranchId);
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedBranchId, refreshKey]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Wine className="w-10 h-10 text-wine-500 animate-bounce" />
          <p className="text-sm text-slate-400">Loading wine shop operational analytics...</p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const lowStock = data?.lowStockWines || [];
  const topWines = data?.topSellingWines || [];
  const recentInvoices = data?.recentInvoices || [];
  const recentPurchases = data?.recentPurchases || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-wine-900 via-wine-950 to-slate-900 border border-wine-800/40 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Live Cellar & Outlet Operations
              </span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-white tracking-tight">
              {selectedBranch?.name || 'All Wine Shop Branches'}
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              {selectedBranchId === 'all'
                ? 'Consolidated financial & inventory metrics across all wine store outlets and central cellars.'
                : `Active branch operations: ${selectedBranch?.address || 'Flagship retail store'}, ${selectedBranch?.city || ''}. License: ${selectedBranch?.license_number || 'N/A'}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('pos')}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Launch POS Counter</span>
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-medium px-4 py-2.5 rounded-xl border border-slate-700/80 transition-all"
            >
              <Boxes className="w-4 h-4 text-wine-400" />
              <span>Transfer Stock</span>
            </button>
            {(!user || user.role === 'admin') && (
              <button
                onClick={handleCleanDatabase}
                disabled={cleaning}
                className="flex items-center gap-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/70 font-semibold px-3.5 py-2.5 rounded-xl text-xs transition-all shadow"
                title="Wipe and clean database with fresh Indian liquor store catalog & outlets"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${cleaning ? 'animate-spin' : ''}`} />
                <span>{cleaning ? 'Resetting...' : 'Clean Indian DB'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Ambient background wine glass glow */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-wine-600/10 blur-3xl pointer-events-none"></div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sales Revenue (कुल बिक्री)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(kpis.totalRevenue)}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-xs">
            <span className="text-slate-400">Today's Sales (आज की बिक्री)</span>
            <span className="text-emerald-400 font-semibold">{formatCurrency(kpis.todayRevenue)} ({kpis.todayCount} bills)</span>
          </div>
        </div>

        {/* Gross Profit & Margin */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Profit Margin</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(kpis.grossProfit)}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-xs">
            <span className="text-slate-400">Margin Percentage</span>
            <span className="text-amber-400 font-semibold">{kpis.grossMarginPct}% Gross</span>
          </div>
        </div>

        {/* Inventory Stock & Valuation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Inventory Valuation</span>
            <div className="w-8 h-8 rounded-lg bg-wine-500/10 flex items-center justify-center text-wine-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(kpis.inventoryCostValuation)}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-xs">
            <span className="text-slate-400">Bottles in Stock</span>
            <span className="text-wine-300 font-semibold">{kpis.totalBottles?.toLocaleString()} Bottles</span>
          </div>
        </div>

        {/* Banking Liquidity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Bank & Cash Liquidity</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(kpis.liquidBankCash)}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-xs">
            <span className="text-slate-400">AR vs AP Balance</span>
            <span className="text-slate-300 font-medium">
              AR: <span className="text-emerald-400">${kpis.totalReceivable}</span> | AP: <span className="text-rose-400">${kpis.totalPayable}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStock.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-rose-300 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Low Cellar Stock Alerts ({lowStock.length} items needing reorder)</span>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs text-rose-300 hover:text-white underline font-medium"
            >
              View Full Inventory
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.map((item, idx) => (
              <div key={idx} className="bg-slate-900/90 border border-rose-900/40 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-200 truncate max-w-[200px]">{item.product_name}</p>
                  <p className="text-xs text-slate-400">{item.branch_name} • SKU: {item.sku}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {item.quantity} left
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Min: {item.min_stock_level}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Grid: Top Selling Wines & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Wines */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-serif font-bold text-white flex items-center gap-2">
                <Wine className="w-4 h-4 text-amber-400" />
                Top Selling Wines by Revenue
              </h2>
              <p className="text-xs text-slate-400">Best performing vintage labels and varietals</p>
            </div>
            <button
              onClick={() => setActiveTab('sales')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium"
            >
              View Sales
            </button>
          </div>

          {topWines.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No sales recorded yet for this selection.</p>
          ) : (
            <div className="space-y-3">
              {topWines.map((wine, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 text-xs font-bold flex items-center justify-center border border-slate-700">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{wine.product_name}</p>
                      <p className="text-xs text-slate-400">{wine.varietal} • {wine.region}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">{formatCurrency(wine.revenue_generated)}</p>
                    <p className="text-xs text-slate-400">{wine.bottles_sold} bottles sold</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Counter Invoices */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-serif font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Recent Invoices & POS Receipts
              </h2>
              <p className="text-xs text-slate-400">Latest customer wine billing activity</p>
            </div>
            <button
              onClick={() => setActiveTab('sales')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium"
            >
              All Invoices
            </button>
          </div>

          {recentInvoices.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No invoices yet.</p>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/40 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-amber-300">{inv.invoice_no}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{inv.customer_name} • {inv.branch_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{formatCurrency(inv.total_amount)}</p>
                    <p className="text-xs text-slate-400">{inv.payment_method}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
