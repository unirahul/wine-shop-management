import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Truck,
  Plus,
  Search,
  Building2,
  Receipt,
  DollarSign,
  Calendar,
  CheckCircle,
  X,
  CreditCard,
  Eye,
  Wine,
  Users
} from 'lucide-react';

export default function Purchasing() {
  const { branches, selectedBranchId, formatCurrency, addToast, triggerRefresh, refreshKey } = useApp();
  const [subTab, setSubTab] = useState('orders'); // 'orders', 'vendors'

  const [purchases, setPurchases] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Purchase Bill Modal
  const [showPOModal, setShowPOModal] = useState(false);
  const [poForm, setPoForm] = useState({
    branch_id: selectedBranchId !== 'all' ? selectedBranchId : 1,
    vendor_id: '',
    supplier_invoice_no: '',
    purchase_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    notes: '',
    paid_amount: 0,
    items: [{ product_id: '', quantity: 12, unit_cost: 0, tax_rate: 18.0 }]
  });

  // New Vendor Modal
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    tax_id: '',
    address: '',
    city: '',
    country: 'France',
    payment_terms_days: 30
  });

  // Selected Purchase Detail Modal
  const [selectedPO, setSelectedPO] = useState(null);
  const [poDetails, setPoDetails] = useState(null);

  // Disburse Payment Modal
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('Wire Transfer');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [payBankId, setPayBankId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [pursRes, vendsRes, prodsRes] = await Promise.all([
        api.getPurchases({ branch_id: selectedBranchId }),
        api.getVendors(),
        api.getProducts({ branch_id: 'all' })
      ]);
      if (pursRes.success) setPurchases(pursRes.purchases || []);
      if (vendsRes.success) setVendors(vendsRes.vendors || []);
      if (prodsRes.success) setProducts(prodsRes.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBranchId, refreshKey]);

  // Open PO Details
  const openPODetail = async (id) => {
    try {
      const res = await api.getPurchase(id);
      if (res.success) {
        setPoDetails(res);
        setSelectedPO(id);
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Open Payment Modal
  const openPayModal = async (po) => {
    setPayModal(po);
    setPayAmount(po.balance_amount.toString());
    try {
      const res = await api.getBankAccounts('all');
      if (res.success && res.accounts?.length > 0) {
        setBankAccounts(res.accounts);
        setPayBankId(res.accounts[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisbursePayment = async () => {
    if (!payBankId || !payAmount || Number(payAmount) <= 0) {
      addToast('Enter a valid amount and disbursement bank', 'error');
      return;
    }

    try {
      const res = await api.createPayment({
        branch_id: payModal.branch_id,
        vendor_id: payModal.vendor_id,
        purchase_id: payModal.id,
        bank_account_id: Number(payBankId),
        payment_date: new Date().toISOString().split('T')[0],
        amount: Number(payAmount),
        payment_mode: payMode,
        payment_type: 'Vendor Bill Payment',
        payee_name: payModal.vendor_name,
        reference_no: `PAY-PO-${payModal.purchase_no}`,
        notes: `Wire payment for winery bill ${payModal.purchase_no}`
      });

      if (res.success) {
        addToast(`Payment ${res.paymentNo} disbursed to winery!`, 'success');
        setPayModal(null);
        loadData();
        triggerRefresh();
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Submit PO
  const handlePOSubmit = async (e) => {
    e.preventDefault();
    if (!poForm.vendor_id) {
      addToast('Select winery or distributor vendor', 'error');
      return;
    }

    const validItems = poForm.items.filter(it => it.product_id && it.quantity > 0);
    if (validItems.length === 0) {
      addToast('Add at least one wine item to the purchase bill', 'error');
      return;
    }

    try {
      const res = await api.createPurchase({
        ...poForm,
        branch_id: Number(poForm.branch_id),
        vendor_id: Number(poForm.vendor_id),
        paid_amount: Number(poForm.paid_amount || 0),
        items: validItems.map(it => ({
          product_id: Number(it.product_id),
          quantity: Number(it.quantity),
          unit_cost: Number(it.unit_cost),
          tax_rate: Number(it.tax_rate)
        }))
      });

      if (res.success) {
        addToast(`Purchase bill ${res.purchaseNo} received & inventory stocked!`, 'success');
        setShowPOModal(false);
        loadData();
        triggerRefresh();
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Submit Vendor
  const handleVendorSubmit = async (e) => {
    e.preventDefault();
    if (!vendorForm.name) {
      addToast('Vendor name is required', 'error');
      return;
    }

    try {
      const res = await api.createVendor(vendorForm);
      if (res.success) {
        addToast('Winery / Distributor added successfully!', 'success');
        setShowVendorModal(false);
        loadData();
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const totalPurchased = purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);
  const totalPayable = purchases.reduce((sum, p) => sum + (p.balance_amount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-400" />
            Purchasing, Wineries & Inward Invoices
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Order wine allocations directly from Bordeaux, Napa, and Tuscan estates. Inward receipts automatically restock cellar inventory and post to Accounts Payable.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVendorModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>New Winery / Vendor</span>
          </button>
          <button
            onClick={() => setShowPOModal(true)}
            className="bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Inward Wine Purchase</span>
          </button>
        </div>
      </div>

      {/* Stats Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Purchases</span>
          <p className="text-xl font-bold text-white mt-1">{formatCurrency(totalPurchased)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Outstanding Payables (AP)</span>
          <p className="text-xl font-bold text-rose-400 mt-1">{formatCurrency(totalPayable)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Purchase Orders</span>
          <p className="text-xl font-bold text-amber-300 mt-1">{purchases.length} bills</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Wineries & Importers</span>
          <p className="text-xl font-bold text-sky-400 mt-1">{vendors.length} vendors</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setSubTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            subTab === 'orders' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-white'
          }`}
        >
          Purchase Bills & Orders ({purchases.length})
        </button>
        <button
          onClick={() => setSubTab('vendors')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            subTab === 'vendors' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-white'
          }`}
        >
          Wineries & Distributors Directory ({vendors.length})
        </button>
      </div>

      {/* TAB 1: PURCHASES LIST */}
      {subTab === 'orders' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800/80 text-slate-400 border-b border-slate-700/80 uppercase font-semibold tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">PO / Bill #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Winery / Distributor</th>
                  <th className="py-3.5 px-4">Receiving Branch</th>
                  <th className="py-3.5 px-4">Supplier Inv #</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-right">Unpaid Balance</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-400">Loading purchase bills...</td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-500">No purchases found.</td>
                  </tr>
                ) : (
                  purchases.map(p => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{p.purchase_no}</td>
                      <td className="py-3.5 px-4 text-slate-400">{p.purchase_date}</td>
                      <td className="py-3.5 px-4 font-semibold text-white">{p.vendor_name}</td>
                      <td className="py-3.5 px-4 text-slate-300">{p.branch_name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{p.supplier_invoice_no || '—'}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-white font-mono">{formatCurrency(p.total_amount)}</td>
                      <td className="py-3.5 px-4 text-right font-bold font-mono">
                        {p.balance_amount > 0 ? (
                          <span className="text-rose-400">{formatCurrency(p.balance_amount)}</span>
                        ) : (
                          <span className="text-slate-500">$0.00</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.balance_amount <= 0
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : p.paid_amount > 0
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {p.balance_amount <= 0 ? 'Fully Paid' : p.paid_amount > 0 ? 'Partially Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => openPODetail(p.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="View Bill Items"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {p.balance_amount > 0 && (
                          <button
                            onClick={() => openPayModal(p)}
                            className="px-2 py-1 rounded bg-rose-700 hover:bg-rose-600 text-white font-semibold text-[10px]"
                          >
                            Pay Vendor
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: VENDORS / WINERIES DIRECTORY */}
      {subTab === 'vendors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map(v => (
            <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif font-bold text-white text-base">{v.name}</h3>
                  <span className="text-[10px] text-amber-300 font-mono">{v.code}</span>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  {v.country}
                </span>
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <p>Contact: <span className="text-slate-200">{v.contact_person || 'Estate Manager'}</span></p>
                <p>Phone: <span className="text-slate-200">{v.phone}</span></p>
                <p>Email: <span className="text-slate-200">{v.email}</span></p>
                <p>Credit Terms: <span className="text-slate-200">{v.payment_terms_days} days</span></p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500 text-[10px]">Outstanding Payable:</span>
                  <p className="font-bold text-rose-400 font-mono">{formatCurrency(v.current_balance)}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[10px]">Total Orders:</span>
                  <p className="font-bold text-white">{v.total_orders || 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NEW PURCHASE BILL MODAL */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                Record Inward Wine Shipment / Bill
              </h3>
              <button onClick={() => setShowPOModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePOSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Receiving Branch Outlet *</label>
                  <select
                    required
                    value={poForm.branch_id}
                    onChange={(e) => setPoForm({ ...poForm, branch_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.is_warehouse ? 'Warehouse' : 'Store'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Winery / Distributor *</label>
                  <select
                    required
                    value={poForm.vendor_id}
                    onChange={(e) => setPoForm({ ...poForm, vendor_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="">Select vendor...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.country})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Supplier Invoice / Bill #</label>
                  <input
                    type="text"
                    value={poForm.supplier_invoice_no}
                    onChange={(e) => setPoForm({ ...poForm, supplier_invoice_no: e.target.value })}
                    placeholder="e.g. FAC-2026-991"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Invoice Date</label>
                  <input
                    type="date"
                    value={poForm.purchase_date}
                    onChange={(e) => setPoForm({ ...poForm, purchase_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Payment Due Date</label>
                  <input
                    type="date"
                    value={poForm.due_date}
                    onChange={(e) => setPoForm({ ...poForm, due_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <label className="block text-slate-400 font-medium">Wine Items & Acquisition Costs</label>
                {poForm.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/60">
                    <div className="col-span-5">
                      <select
                        required
                        value={item.product_id}
                        onChange={(e) => {
                          const pId = e.target.value;
                          const found = products.find(p => String(p.id) === String(pId));
                          const newItems = [...poForm.items];
                          newItems[idx].product_id = pId;
                          if (found) {
                            newItems[idx].unit_cost = found.cost_price;
                            newItems[idx].tax_rate = found.tax_rate;
                          }
                          setPoForm({ ...poForm, items: newItems });
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                      >
                        <option value="">Select wine...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...poForm.items];
                          newItems[idx].quantity = Number(e.target.value);
                          setPoForm({ ...poForm, items: newItems });
                        }}
                        placeholder="Bottles"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-center font-bold"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={item.unit_cost}
                        onChange={(e) => {
                          const newItems = [...poForm.items];
                          newItems[idx].unit_cost = Number(e.target.value);
                          setPoForm({ ...poForm, items: newItems });
                        }}
                        placeholder="Cost"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-right font-mono"
                      />
                    </div>

                    <div className="col-span-2 text-right font-bold text-amber-300 font-mono">
                      {formatCurrency(item.quantity * item.unit_cost)}
                    </div>

                    <div className="col-span-1 text-right">
                      {poForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setPoForm({
                              ...poForm,
                              items: poForm.items.filter((_, i) => i !== idx)
                            });
                          }}
                          className="text-rose-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setPoForm({
                    ...poForm,
                    items: [...poForm.items, { product_id: '', quantity: 12, unit_cost: 0, tax_rate: 18.0 }]
                  })}
                  className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Wine Line</span>
                </button>
              </div>

              {/* Payment Advance */}
              <div className="grid grid-cols-2 gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
                <div>
                  <label className="block text-slate-400 mb-1">Immediate Advance Paid ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={poForm.paid_amount}
                    onChange={(e) => setPoForm({ ...poForm, paid_amount: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Shipment Notes</label>
                  <input
                    type="text"
                    value={poForm.notes}
                    onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                    placeholder="e.g. Temperature-controlled reefer container"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPOModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Record Bill & Restock Cellar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW VENDOR MODAL */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                Add Winery / Importer Profile
              </h3>
              <button onClick={() => setShowVendorModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVendorSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Winery / Distributor Name *</label>
                <input
                  type="text"
                  required
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                  placeholder="e.g. Domaine de la Romanée-Conti"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={vendorForm.contact_person}
                    onChange={(e) => setVendorForm({ ...vendorForm, contact_person: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Country</label>
                  <input
                    type="text"
                    value={vendorForm.country}
                    onChange={(e) => setVendorForm({ ...vendorForm, country: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Payment Credit Terms (Days)</label>
                <input
                  type="number"
                  value={vendorForm.payment_terms_days}
                  onChange={(e) => setVendorForm({ ...vendorForm, payment_terms_days: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISBURSE PAYMENT MODAL */}
      {payModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-rose-400" />
                Pay Winery / Vendor
              </h3>
              <button onClick={() => setPayModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Bill #:</span>
                <span className="font-mono text-emerald-400 font-bold">{payModal.purchase_no}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Winery:</span>
                <span className="text-white font-medium">{payModal.vendor_name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Balance Due:</span>
                <span className="text-rose-400 font-bold">{formatCurrency(payModal.balance_amount)}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Disbursement Amount ($)</label>
                <input
                  type="number"
                  min="0.01"
                  max={payModal.balance_amount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Payment Mode</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Wire Transfer">Wire / Swift Transfer</option>
                  <option value="Check">Commercial Check</option>
                  <option value="Corporate Card">Corporate Credit Card</option>
                  <option value="Direct Debit">Direct Debit</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Disburse From Bank Account</label>
                <select
                  value={payBankId}
                  onChange={(e) => setPayBankId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {bankAccounts.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.account_name} ({formatCurrency(b.current_balance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleDisbursePayment}
                className="flex-1 bg-rose-700 hover:bg-rose-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm Wire Disbursement</span>
              </button>
              <button
                onClick={() => setPayModal(null)}
                className="bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PO DETAIL MODAL */}
      {selectedPO && poDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-white">
                  Purchase Order: {poDetails.purchase.purchase_no}
                </h3>
                <p className="text-xs text-slate-400">Supplier: {poDetails.purchase.vendor_name}</p>
              </div>
              <button onClick={() => { setSelectedPO(null); setPoDetails(null); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">Receiving Outlet:</span>
                  <p className="font-semibold text-white">{poDetails.purchase.branch_name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Supplier Bill #:</span>
                  <p className="font-mono text-amber-300">{poDetails.purchase.supplier_invoice_no || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Date Received:</span>
                  <p className="text-white">{poDetails.purchase.purchase_date}</p>
                </div>
                <div>
                  <span className="text-slate-400">Payment Status:</span>
                  <p className="font-bold text-emerald-400">{poDetails.purchase.status}</p>
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden mt-3">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-slate-400 text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="p-2.5">Wine Item</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Cost</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {poDetails.items.map((it, i) => (
                      <tr key={i}>
                        <td className="p-2.5 text-white font-medium">{it.product_name}</td>
                        <td className="p-2.5 text-center font-bold text-white">{it.quantity}</td>
                        <td className="p-2.5 text-right font-mono text-slate-300">${it.unit_cost.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-amber-300">${it.total_cost.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 text-right text-xs space-y-1">
                <p className="text-slate-400">Subtotal: <span className="text-white font-mono">${poDetails.purchase.subtotal.toFixed(2)}</span></p>
                <p className="text-slate-400">Tax: <span className="text-white font-mono">${poDetails.purchase.tax_amount.toFixed(2)}</span></p>
                <p className="text-sm font-bold text-white">Total Bill: <span className="text-amber-300 font-mono">${poDetails.purchase.total_amount.toFixed(2)}</span></p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => { setSelectedPO(null); setPoDetails(null); }}
                className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
