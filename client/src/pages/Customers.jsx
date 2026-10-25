import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Users,
  Plus,
  Search,
  Award,
  DollarSign,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle,
  X,
  CreditCard,
  Wine
} from 'lucide-react';

export default function Customers() {
  const { formatCurrency, addToast, triggerRefresh, refreshKey } = useApp();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    tax_id: '',
    address: '',
    city: 'New York',
    loyalty_tier: 'Silver Cellar',
    credit_limit: 5000,
    notes: ''
  });

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomers();
      if (res.success) setCustomers(res.customers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [refreshKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      addToast('Customer name is required', 'error');
      return;
    }

    try {
      const res = await api.createCustomer(form);
      if (res.success) {
        addToast('Customer / Wine Club Member registered successfully!', 'success');
        setShowModal(false);
        setForm({
          name: '',
          phone: '',
          email: '',
          tax_id: '',
          address: '',
          city: 'New York',
          loyalty_tier: 'Silver Cellar',
          credit_limit: 5000,
          notes: ''
        });
        loadCustomers();
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search)) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
    (c.code && c.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            Sommelier Wine Club & Customer Accounts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track VIP wine collectors, restaurant wholesale accounts, loyalty reward points, credit limits, and receivables.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-wine-700 hover:bg-wine-600 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Customer / Member</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone, code..."
            className="w-full bg-slate-800 border border-slate-700 text-xs rounded-xl pl-9 pr-3 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(c => {
          const isPlatinum = c.loyalty_tier?.includes('Platinum');
          const isGold = c.loyalty_tier?.includes('Gold');
          const isWholesale = c.loyalty_tier?.includes('Corporate');

          return (
            <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-slate-700 transition-all">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isPlatinum ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                    isGold ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    isWholesale ? 'bg-sky-950 text-sky-300 border border-sky-800' :
                    'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {c.loyalty_tier}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{c.code}</span>
                </div>

                <h3 className="font-serif font-bold text-white text-base leading-snug">
                  {c.name}
                </h3>

                <div className="mt-3 space-y-1 text-xs text-slate-400">
                  <p className="flex items-center gap-1.5 truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{c.phone || 'No phone recorded'}</span>
                  </p>
                  <p className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{c.email || 'No email'}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium pt-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Age 21+ Verified (Legal Compliance)</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Loyalty Rewards:</span>
                  <span className="font-bold text-amber-300 font-mono flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-400" />
                    {c.loyalty_points || 0} pts
                  </span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Outstanding Receivables:</span>
                  <span className={`font-bold font-mono ${c.current_balance > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                    {formatCurrency(c.current_balance)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Credit Limit:</span>
                  <span className="font-mono text-slate-300">{formatCurrency(c.credit_limit)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* REGISTER CUSTOMER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                Register Wine Customer / Member
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name / Corporate Entity *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Arthur Sterling or The Four Seasons Bistro"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 212-555-0192"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="sommelier@client.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Club Membership Tier</label>
                  <select
                    value={form.loyalty_tier}
                    onChange={(e) => setForm({ ...form, loyalty_tier: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Silver Cellar">Silver Cellar</option>
                    <option value="Gold Reserve">Gold Reserve</option>
                    <option value="Platinum Sommelier">Platinum Sommelier</option>
                    <option value="Corporate Wholesale">Corporate Wholesale</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Credit Limit ($)</label>
                  <input
                    type="number"
                    value={form.credit_limit}
                    onChange={(e) => setForm({ ...form, credit_limit: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Billing / Delivery Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street and City"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/60 flex items-center gap-2 text-emerald-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px]">Age 21+ legal compliance certified for wine purchasing.</span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-wine-700 hover:bg-wine-600 text-white font-bold rounded-xl"
                >
                  Save Member Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
