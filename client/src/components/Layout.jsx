import React, { useState } from 'react';
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
  Sparkles,
  Menu,
  LogOut,
  Lock,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export default function Layout({ activeTab, setActiveTab, children }) {
  const {
    user,
    logout,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    selectedBranch,
    toasts,
    removeToast,
    cleanDatabase
  } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const handleCleanConfirm = async () => {
    setCleaning(true);
    try {
      await cleanDatabase();
      setShowCleanModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCleaning(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard (डैशबोर्ड)', icon: LayoutDashboard },
    { id: 'pos', label: 'POS Billing Counter (गल्ला)', icon: ShoppingCart, highlight: true },
    { id: 'sales', label: 'Sales & Invoices (बिक्री बिल)', icon: ReceiptText },
    { id: 'catalog', label: 'Liquor Catalog & MRP (शराब सूची)', icon: Wine },
    { id: 'inventory', label: 'Godown Inventory (गोदाम स्टॉक)', icon: Boxes },
    { id: 'purchasing', label: 'Inward Purchases (आवक खरीद)', icon: Truck },
    { id: 'banking', label: 'Banking & UPI (बैंक व गल्ला)', icon: Landmark },
    { id: 'receipts_payments', label: 'Receipts & Payments (जमा/भुगतान)', icon: CreditCard },
    { id: 'accounting', label: 'Accounting & Ledgers (बहीखाता)', icon: Scale },
    { id: 'branches', label: 'Outlets & Vends (दुकानें / ठेके)', icon: Building2 },
    { id: 'customers', label: 'Customers & Khata (ग्राहक खाता)', icon: Users },
    { id: 'users', label: 'Staff & Cashiers (कैशियर / स्टाफ)', icon: ShieldCheck, adminOnly: true },
  ];

  const visibleNavItems = navItems.filter(item => !item.adminOnly || user?.role === 'admin');

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

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          aria-label="Close menu backdrop"
        />
      )}

      {/* Sidebar Navigation - Drawer on mobile, static on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800/80 flex flex-col shrink-0 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between gap-3 bg-gradient-to-r from-wine-950/60 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-amber-600 to-wine-700 flex items-center justify-center shadow-lg shadow-wine-900/40 ring-1 ring-amber-400/40 shrink-0">
              <Wine className="w-5 h-5 sm:w-6 sm:h-6 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-black tracking-wider text-amber-300 text-base sm:text-lg uppercase">
                  Royal Heritage
                </span>
                <span className="text-[10px] bg-wine-800/90 text-amber-300 font-semibold px-1.5 py-0.5 rounded tracking-wide uppercase border border-amber-500/30">
                  INDIA ERP
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">Indian Liquor & Wine Management</p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
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
                {item.adminOnly && (
                  <span className="ml-auto text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Branch Widget in Sidebar */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 space-y-2">
          {/* Active Outlet Info */}
          <div className="bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/50">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
              <span className="flex items-center gap-1 font-medium">
                <Store className="w-3.5 h-3.5 text-amber-400" />
                Active Outlet
              </span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-700 rounded text-amber-300 font-mono">
                {selectedBranch?.code || 'ALL'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-200 truncate">
              {selectedBranch?.name || 'All Branches'}
            </p>
          </div>

          {/* User Profile Card */}
          <div className="bg-slate-800/90 rounded-xl p-2.5 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-wine-700 to-amber-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Staff'}</p>
                <p className="text-[10px] text-amber-400 font-medium truncate capitalize">
                  {user?.role === 'admin' ? 'Super Admin' : user?.role === 'manager' ? 'Store Manager' : 'POS Cashier'}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-rose-950/80 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-slate-900/95 border-b border-slate-800/80 px-3 sm:px-6 flex items-center justify-between shrink-0 backdrop-blur-md gap-2">
          {/* Mobile Hamburger + Branch Selector */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 border border-slate-700/80 text-amber-300 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Branch Selector: Admin gets full dropdown; Non-admin is locked to assigned branch */}
            {user?.role === 'admin' ? (
              <div className="relative min-w-0">
                <label className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5 font-medium truncate">
                  Outlet / Location
                </label>
                <div className="relative flex items-center">
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="appearance-none bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-slate-100 text-xs sm:text-sm font-semibold rounded-lg pl-2 sm:pl-3 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-wine-500 transition-colors cursor-pointer w-[130px] xs:w-[170px] sm:w-[260px] truncate"
                  >
                    <option value="all">🌐 All Outlets (Consolidated)</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.is_warehouse ? '📦' : '🏪'} {b.code} - {b.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2" />
                </div>
              </div>
            ) : (
              <div className="min-w-0">
                <label className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5 font-medium truncate">
                  Assigned Counter Outlet
                </label>
                <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-200">
                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate max-w-[120px] xs:max-w-[160px] sm:max-w-[220px]">
                    {user?.branch_name || selectedBranch?.name}
                  </span>
                  <span className="text-[10px] bg-wine-900 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                    {user?.branch_code || selectedBranch?.code}
                  </span>
                </div>
              </div>
            )}

            {selectedBranchId !== 'all' && (
              <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-slate-800">
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
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowCleanModal(true)}
              title="Clean & Reset Database to Indian Catalog"
              className="hidden lg:flex items-center gap-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-800/60 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Clean DB</span>
            </button>

            <button
              onClick={() => setActiveTab('pos')}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm shadow-md shadow-amber-950/40 transition-all transform active:scale-95 shrink-0"
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">POS Checkout</span>
              <span className="xs:hidden">POS</span>
            </button>

            <button
              onClick={() => setActiveTab('purchasing')}
              className="hidden md:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-sm border border-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Inward Purchase</span>
            </button>

            <button
              onClick={logout}
              title="Sign Out"
              className="flex items-center gap-1 bg-slate-800/90 hover:bg-rose-950/80 text-slate-300 hover:text-rose-200 px-2.5 py-1.5 rounded-lg text-xs border border-slate-700/80 transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-3 sm:p-6">
          {children}
        </main>
      </div>

      {/* Clean Database Confirmation Modal */}
      {showCleanModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-950 border border-rose-600/40 flex items-center justify-center text-rose-400 shrink-0">
                <RotateCcw className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Clean & Reset Database</h3>
                <p className="text-xs text-rose-300 font-medium">डेटाबेस साफ़ करें व भारतीय डेटा लोड करें</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will wipe all existing transaction data and completely reseed the database with clean Indian Wine Shop masters:
            </p>

            <ul className="text-[11px] text-slate-400 space-y-1 list-disc pl-4 bg-slate-800/50 p-3 rounded-xl border border-slate-700/40">
              <li><strong className="text-slate-200">Indian Brands:</strong> Royal Stag, Blenders Pride, Old Monk, Kingfisher, Bira 91, Sula, Indri Trini, Amrut</li>
              <li><strong className="text-slate-200">Indian Outlets:</strong> Mumbai Bandra (FL-II), Delhi CP (L-2), Bengaluru (CL-2), Goa & Bhiwandi Godown</li>
              <li><strong className="text-slate-200">Indian Banking:</strong> SBI, HDFC, ICICI, PhonePe / GPay UPI QR Soundbox & Cash Gullaks</li>
              <li><strong className="text-slate-200">Currency:</strong> 100% Indian Rupee (₹ INR) & GST / State Excise Ledgers</li>
            </ul>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={cleaning}
                onClick={() => setShowCleanModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={cleaning}
                onClick={handleCleanConfirm}
                className="px-5 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-950/50 transition-all flex items-center gap-2"
              >
                {cleaning ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cleaning...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Yes, Clean Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
