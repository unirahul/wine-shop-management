import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Wine,
  LayoutDashboard,
  ShoppingCart,
  ReceiptText,
  Boxes,
  Truck,
  Building2,
  Landmark,
  Scale,
  Users,
  CreditCard,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Plus,
  Store,
  Sparkles
} from 'lucide-react';

export default function Layout({ activeTab, setActiveTab, children }) {
  const {
    branches,
    selectedBranchId,
    setSelectedBranchId,
    selectedBranch,
    toasts,
    removeToast
  } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'POS Counter (Billing)', icon: ShoppingCart, highlight: true },
    { id: 'sales', label: 'Sales & Invoices', icon: ReceiptText },
    { id: 'catalog', label: 'Wine Catalog & SKUs', icon: Wine },
    { id: 'inventory', label: 'Inventory & Transfers', icon: Boxes },
    { id: 'purchasing', label: 'Purchases & Wineries', icon: Truck },
    { id: 'banking', label: 'Banking & Liquidity', icon: Landmark },
    { id: 'receipts_payments', label: 'Receipts & Payments', icon: CreditCard },
    { id: 'accounting', label: 'Accounting & Reports', icon: Scale },
    { id: 'branches', label: 'Wine Branches', icon: Building2 },
    { id: 'customers', label: 'Customers & Sommelier Club', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-2xl border transition-all transform translate-y-0 backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-100'
                : toast.type === 'info'
                ? 'bg-sky-950/90 border-sky-500/50 text-sky-100'
                : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100'
            }`}
          >
            <div className="flex items-center gap-3">
              {toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : toast.type === 'info' ? (
                <Info className="w-5 h-5 text-sky-400 shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <p className="text-sm font-medium leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Sidebar Navigation */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800/80 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3 bg-gradient-to-r from-wine-950/60 to-slate-900">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-wine-700 to-amber-600 flex items-center justify-center shadow-lg shadow-wine-900/40 ring-1 ring-amber-400/30">
            <Wine className="w-6 h-6 text-amber-100" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-black tracking-wider text-amber-200 text-lg uppercase">
                Grand Cru
              </span>
              <span className="text-[10px] bg-wine-800/80 text-wine-200 font-semibold px-1.5 py-0.5 rounded tracking-wide uppercase">
                ERP
              </span>
            </div>
            <p className="text-xs text-slate-400">Multi-Branch Wine & Spirits</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-wine-700 to-wine-800 text-white shadow-md shadow-wine-950/60 ring-1 ring-wine-500/40'
                    : item.highlight
                    ? 'text-amber-300 hover:bg-amber-500/10 hover:text-amber-200'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : item.highlight ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="ml-auto text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-semibold">
                    POS
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Active Branch Widget in Sidebar */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/60">
          <div className="bg-slate-800/70 rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1 font-medium">
                <Store className="w-3.5 h-3.5 text-amber-400" />
                Active Outlet
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 rounded text-amber-300 font-mono">
                {selectedBranch?.code || 'ALL'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-200 truncate">
              {selectedBranch?.name || 'All Branches'}
            </p>
            {selectedBranch?.license_number && (
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                Lic: {selectedBranch.license_number}
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-slate-900/95 border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0 backdrop-blur-md">
          {/* Branch Selector Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5 font-medium">
                Store Location / Warehouse Filter
              </label>
              <div className="relative flex items-center">
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="appearance-none bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-slate-100 text-sm font-semibold rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-wine-500 transition-colors cursor-pointer min-w-[260px]"
                >
                  <option value="all">🌐 All Branches (Consolidated View)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.is_warehouse ? '📦' : '🏪'} {b.code} - {b.name} ({b.city || 'US'})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5" />
              </div>
            </div>

            {selectedBranchId !== 'all' && (
              <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs text-slate-300">
                  {selectedBranch?.city ? `${selectedBranch.city}, ${selectedBranch.state || ''}` : 'Operational'}
                </span>
                {selectedBranch?.is_warehouse ? (
                  <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded font-medium">
                    Central Distribution
                  </span>
                ) : (
                  <span className="text-[10px] bg-wine-950 text-wine-300 border border-wine-800 px-2 py-0.5 rounded font-medium">
                    Retail & Tasting
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions & Status */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('pos')}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-sm shadow-md shadow-amber-950/40 transition-all transform active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>POS Checkout</span>
            </button>

            <button
              onClick={() => setActiveTab('purchasing')}
              className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-sm border border-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Inward Purchase</span>
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-200">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-emerald-400 flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Double-Entry Active
              </p>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
