import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  CreditCard,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Building,
  DollarSign,
  CheckCircle,
  X,
  FileText,
  Landmark,
  User,
  Tag
} from 'lucide-react';

export default function ReceiptsPayments() {
  const { branches, selectedBranchId, formatCurrency, addToast, triggerRefresh, refreshKey } = useApp();
  const [activeTab, setActiveTab] = useState('receipts'); // 'receipts' or 'payments'

  const [receipts, setReceipts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Modals
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Aux data
  const [customers, setCustomers] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);

  // New Receipt Form
  const [receiptForm, setReceiptForm] = useState({
    branch_id: selectedBranchId !== 'all' ? selectedBranchId : 1,
    customer_id: '',
    bank_account_id: '',
    receipt_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_mode: 'Cash',
    reference_no: '',
    notes: ''
  });

  // New Expense / Payment Form
  const [expenseForm, setExpenseForm] = useState({
    branch_id: selectedBranchId !== 'all' ? selectedBranchId : 1,
    bank_account_id: '',
    expense_account_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_mode: 'Direct Debit',
    payment_type: 'Operating Expense',
    payee_name: '',
    reference_no: '',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [recsRes, paysRes, custsRes, banksRes, coaRes] = await Promise.all([
        api.getReceipts({ branch_id: selectedBranchId }),
        api.getPayments({ branch_id: selectedBranchId }),
        api.getCustomers(),
        api.getBankAccounts('all'),
        api.getChartOfAccounts()
      ]);

      if (recsRes.success) setReceipts(recsRes.receipts || []);
      if (paysRes.success) setPayments(paysRes.payments || []);
      if (custsRes.success) setCustomers(custsRes.customers || []);
      if (banksRes.success) {
        setBankAccounts(banksRes.accounts || []);
        if (banksRes.accounts?.length > 0) {
          setReceiptForm(f => ({ ...f, bank_account_id: banksRes.accounts[0].id }));
          setExpenseForm(f => ({ ...f, bank_account_id: banksRes.accounts[0].id }));
        }
      }
      if (coaRes.success) {
        setChartOfAccounts(coaRes.accounts || []);
        const opex = coaRes.accounts.find(a => a.type === 'Expense');
        if (opex) {
          setExpenseForm(f => ({ ...f, expense_account_id: opex.id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBranchId, refreshKey]);

  // Handle Receipt Submit
  const handleReceiptSubmit = async (e) => {
    e.preventDefault();
    if (!receiptForm.amount || Number(receiptForm.amount) <= 0 || !receiptForm.bank_account_id) {
      addToast('Enter valid receipt amount and bank account', 'error');
      return;
    }

    try {
      const res = await api.createReceipt({
        ...receiptForm,
        branch_id: Number(receiptForm.branch_id),
        customer_id: receiptForm.customer_id ? Number(receiptForm.customer_id) : null,
        bank_account_id: Number(receiptForm.bank_account_id),
        amount: Number(receiptForm.amount)
      });

      if (res.success) {
        addToast(`Customer receipt ${res.receiptNo} recorded and posted!`, 'success');
        setShowReceiptModal(false);
        loadData();
        triggerRefresh();
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Handle Expense Submit
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0 || !expenseForm.bank_account_id) {
      addToast('Enter valid payment amount and disbursement bank', 'error');
      return;
    }

    try {
      const res = await api.createPayment({
        ...expenseForm,
        branch_id: Number(expenseForm.branch_id),
        bank_account_id: Number(expenseForm.bank_account_id),
        expense_account_id: Number(expenseForm.expense_account_id),
        amount: Number(expenseForm.amount)
      });

      if (res.success) {
        addToast(`Operating expense voucher ${res.paymentNo} disbursed!`, 'success');
        setShowExpenseModal(false);
        loadData();
        triggerRefresh();
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const totalReceipts = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalDisbursements = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-amber-400" />
            Receipts & Payment Vouchers
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Customer receivables collection, vendor bill disbursements, cellar utilities, store rent, and excise compliance expense vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReceiptModal(true)}
            className="bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>New Customer Receipt (+)</span>
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="bg-rose-800 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Record Expense Voucher (-)</span>
          </button>
        </div>
      </div>

      {/* Stats Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold flex items-center gap-1.5">
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              Total Customer Receipts (Inflow)
            </span>
            <p className="text-2xl font-bold text-emerald-400 mt-2 font-mono">{formatCurrency(totalReceipts)}</p>
            <p className="text-xs text-slate-500 mt-1">{receipts.length} receipt vouchers recorded</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
              Total Payments & Expenses (Outflow)
            </span>
            <p className="text-2xl font-bold text-rose-400 mt-2 font-mono">{formatCurrency(totalDisbursements)}</p>
            <p className="text-xs text-slate-500 mt-1">{payments.length} payment vouchers disbursed</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('receipts')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'receipts'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Customer Inward Receipts ({receipts.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'payments'
              ? 'bg-slate-800 text-rose-400 border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Vendor Payments & Operating Expenses ({payments.length})
        </button>
      </div>

      {/* TAB 1: RECEIPTS */}
      {activeTab === 'receipts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800/80 text-slate-400 border-b border-slate-700/80 uppercase font-semibold tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Receipt #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Branch</th>
                  <th className="py-3.5 px-4">Deposited Into</th>
                  <th className="py-3.5 px-4">Payment Mode</th>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4 text-right">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">Loading receipts...</td>
                  </tr>
                ) : receipts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-500">No receipts found.</td>
                  </tr>
                ) : (
                  receipts.map(r => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-300">{r.receipt_no}</td>
                      <td className="py-3.5 px-4 text-slate-400">{r.receipt_date}</td>
                      <td className="py-3.5 px-4 font-semibold text-white">{r.customer_name || 'Walk-in Guest'}</td>
                      <td className="py-3.5 px-4 text-slate-300">{r.branch_name}</td>
                      <td className="py-3.5 px-4 text-slate-300">{r.bank_name}</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] border border-slate-700">
                          {r.payment_mode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{r.reference_no || '—'}</td>
                      <td className="py-3.5 px-4 text-right font-bold font-mono text-emerald-400">
                        +{formatCurrency(r.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENTS & EXPENSES */}
      {activeTab === 'payments' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800/80 text-slate-400 border-b border-slate-700/80 uppercase font-semibold tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Payment #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Payee / Vendor</th>
                  <th className="py-3.5 px-4">Type / Category</th>
                  <th className="py-3.5 px-4">Branch</th>
                  <th className="py-3.5 px-4">Disbursed From</th>
                  <th className="py-3.5 px-4">Mode / Ref</th>
                  <th className="py-3.5 px-4 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">Loading payment vouchers...</td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-500">No payments found.</td>
                  </tr>
                ) : (
                  payments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-300">{p.payment_no}</td>
                      <td className="py-3.5 px-4 text-slate-400">{p.payment_date}</td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {p.payee_name || p.vendor_name || 'Operating payee'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.payment_type === 'Vendor Bill Payment'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-purple-950 text-purple-300 border border-purple-800'
                        }`}>
                          {p.payment_type}
                        </span>
                        {p.expense_account_name && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">{p.expense_account_name}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{p.branch_name}</td>
                      <td className="py-3.5 px-4 text-slate-300">{p.bank_name}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-300">{p.payment_mode}</span>
                        {p.reference_no && <span className="block text-[10px] text-slate-500 font-mono">{p.reference_no}</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold font-mono text-rose-400">
                        -{formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW RECEIPT MODAL */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                Record Customer Inward Receipt
              </h3>
              <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiptSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Receiving Branch Outlet *</label>
                <select
                  required
                  value={receiptForm.branch_id}
                  onChange={(e) => setReceiptForm({ ...receiptForm, branch_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Customer / Member</label>
                <select
                  value={receiptForm.customer_id}
                  onChange={(e) => setReceiptForm({ ...receiptForm, customer_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">Walk-in Guest / Unassigned</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (Balance: {formatCurrency(c.current_balance)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={receiptForm.amount}
                    onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Receipt Date</label>
                  <input
                    type="date"
                    value={receiptForm.receipt_date}
                    onChange={(e) => setReceiptForm({ ...receiptForm, receipt_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Payment Mode</label>
                  <select
                    value={receiptForm.payment_mode}
                    onChange={(e) => setReceiptForm({ ...receiptForm, payment_mode: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI / QR</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Deposit Account *</label>
                  <select
                    required
                    value={receiptForm.bank_account_id}
                    onChange={(e) => setReceiptForm({ ...receiptForm, bank_account_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{b.account_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reference / Cheque #</label>
                <input
                  type="text"
                  value={receiptForm.reference_no}
                  onChange={(e) => setReceiptForm({ ...receiptForm, reference_no: e.target.value })}
                  placeholder="e.g. WIRE-BISTRO-99"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Post Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW OPERATING EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-rose-400" />
                Record Operating Expense Voucher
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Branch Outlet *</label>
                <select
                  required
                  value={expenseForm.branch_id}
                  onChange={(e) => setExpenseForm({ ...expenseForm, branch_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Expense Account (GL Category) *</label>
                <select
                  required
                  value={expenseForm.expense_account_id}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expense_account_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                >
                  {chartOfAccounts
                    .filter(a => a.type === 'Expense')
                    .map(a => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name} ({a.sub_type})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Payee / Service Provider *</label>
                <input
                  type="text"
                  required
                  value={expenseForm.payee_name}
                  onChange={(e) => setExpenseForm({ ...expenseForm, payee_name: e.target.value })}
                  placeholder="e.g. ConEd Climate Power, State Liquor Board, Landlord"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={expenseForm.payment_date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, payment_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Payment Mode</label>
                  <select
                    value={expenseForm.payment_mode}
                    onChange={(e) => setExpenseForm({ ...expenseForm, payment_mode: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Direct Debit">Direct Debit / ACH</option>
                    <option value="Check">Commercial Check</option>
                    <option value="Corporate Card">Corporate Card</option>
                    <option value="Cash Drawer">Cash Drawer</option>
                    <option value="Wire Transfer">Wire Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Disburse From Bank *</label>
                  <select
                    required
                    value={expenseForm.bank_account_id}
                    onChange={(e) => setExpenseForm({ ...expenseForm, bank_account_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{b.account_name} ({formatCurrency(b.current_balance)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notes / Voucher Reference</label>
                <input
                  type="text"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="e.g. Cellar precision humidity maintenance bill for October"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Disburse & Post Voucher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
