import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Wine,
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  Store,
  Sparkles,
  ArrowRight,
  Building2,
  Boxes
} from 'lucide-react';

export default function Login() {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  const demoAccounts = [
    {
      role: 'Super Admin',
      username: 'admin',
      pass: 'admin123',
      branch: 'All India Outlets & Central GL',
      badge: 'Full Access',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: ShieldCheck
    },
    {
      role: 'Mumbai Bandra Cashier',
      username: 'mumbai',
      pass: 'mumbai123',
      branch: 'BR-01: Mumbai Bandra West (FL-II)',
      badge: 'Branch Locked',
      badgeColor: 'bg-wine-500/20 text-wine-300 border-wine-500/40',
      icon: Store
    },
    {
      role: 'Delhi CP Cashier',
      username: 'delhi',
      pass: 'delhi123',
      branch: 'BR-02: Delhi Connaught Vend (L-2)',
      badge: 'Branch Locked',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: Store
    },
    {
      role: 'Bengaluru Outlet Cashier',
      username: 'bengaluru',
      pass: 'bengaluru123',
      branch: 'BR-03: Bengaluru Indiranagar (CL-2)',
      badge: 'Branch Locked',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: Store
    },
    {
      role: 'Goa Calangute Cashier',
      username: 'goa',
      pass: 'goa123',
      branch: 'BR-04: Goa Calangute Beach Depot',
      badge: 'Branch Locked',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: Wine
    },
    {
      role: 'Bhiwandi Godown Manager',
      username: 'warehouse',
      pass: 'warehouse123',
      branch: 'BR-05: Bhiwandi Central Godown',
      badge: 'Logistics',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      icon: Boxes
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans text-slate-100">
      {/* Background ambient luxury lighting glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-wine-700/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-wine-700 to-amber-600 shadow-2xl shadow-wine-900/50 ring-2 ring-amber-400/40 mb-2">
            <Wine className="w-8 h-8 text-amber-100" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="font-serif font-black tracking-widest text-2xl text-amber-300 uppercase">
              Royal Heritage
            </h1>
            <span className="text-xs bg-wine-800/90 text-amber-300 font-bold px-2 py-0.5 rounded tracking-wider uppercase border border-amber-500/40">
              INDIA ERP
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Indian Wine & IMFL Liquor Shop, POS, Inventory & Excise Accounting
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          <div className="border-b border-slate-800/80 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Outlet Staff & Cashier Sign In
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your credentials to access your assigned outlet counter.
            </p>
          </div>

          {error && (
            <div className="bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs rounded-xl p-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Username / Counter ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin, mumbai, delhi, bengaluru, goa..."
                  className="w-full bg-slate-800/90 border border-slate-700 hover:border-slate-600 focus:border-amber-500 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all placeholder-slate-500"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Password / Staff PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your security password"
                  className="w-full bg-slate-800/90 border border-slate-700 hover:border-slate-600 focus:border-amber-500 text-white text-sm rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-white absolute right-3.5 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center gap-2 transform active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Wine className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Authenticating Outlet...</span>
                </>
              ) : (
                <>
                  <span>Log In to Counter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Quick 1-Tap Branch Logins
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Click to test</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => setDemoCredentials(acc.username, acc.pass)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 text-left transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-700/80 flex items-center justify-center text-amber-300 group-hover:bg-wine-700 transition-colors shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white group-hover:text-amber-200">
                            {acc.role}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({acc.username})
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                          {acc.branch}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${acc.badgeColor}`}>
                      {acc.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security & Regulatory Compliance Footer */}
        <div className="text-center space-y-1 text-slate-500 text-[11px]">
          <p className="flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Double-Entry Accounting & State Excise Liquor Compliance
          </p>
          <p className="text-[10px] text-slate-600">
            Royal Heritage Wines & Spirits ERP v1.0 • Multi-Branch Isolated Counter
          </p>
        </div>
      </div>
    </div>
  );
}
