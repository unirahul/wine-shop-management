import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Landmark,
  Plus,
  ArrowRightLeft,
  CheckCircle,
  X,
  CreditCard,
  Building,
  TrendingUp,
  FileSpreadsheet,
  Clock,
  ShieldCheck,
  Search,
  Wallet
} from 'lucide-react';

export default function Banking() {
  const { branches, selectedBranchId, formatCurrency, addToast, triggerRefresh, refreshKey } = useApp();

  const [accounts, setAccounts] = useState([]);
  const [totalLiquidity, setTotalLiquidity] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState('all');

  // Transfer Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: '',
    transfer_date: new Date().toISOString().split('T')[0],
    reference_no: '',
    description: ''
  });

  // New Account Modal
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountForm, setAccountForm] = useState({
    account_code: '',
    account_name: '',
    bank_name: '',
    account_number: '',
    account_type: 'Checking / Current',
    branch_id: '',
    opening_balance: 0
  });

  const loadBanking = async () => {
    setLoading(true);
    try {
      const [accRes, txnRes] = await Promise.all([
        api.getBankAccounts(selectedBranchId),
        api.getBankTransactions({ bank_account_id: selectedAccountFilter })
      ]);

      if (accRes.success) {
        setAccounts(accRes.accounts || []);
        setTotalLiquidity(accRes.totalLiquidAssets || 0);
      }
      if (txnRes.success) {
        setTransactions(txnRes.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanking();
  }, [selectedBranchId, selectedAccountFilter, refreshKey]);

  // Handle Transfer
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferForm.from_account_id || !transferForm.to_account_id || !transferForm.amount) {
      addToast('Select source, destination and valid amount', 'error');
      return;
    }

    try {
      const res = await api.transferFunds({
        ...transferForm,
        from_account_id: Number(transferForm.from_account_id),
        to_account_id: Number(transferForm.to_account_id),
        amount: Number(transferForm.amount)
      });
      if (res.success) {
        addToast(res.message, 'success');
        setShowTransferModal(false);
        setTransferForm({
          from_account_id: '',
          to_account_id: '',
          amount: '',
          transfer_date: new Date().toISOString().split('T')[0],
          reference_no: '',
          description: ''
        });
        loadBanking();
        triggerRefresh();
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Handle Account Create
  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    if (!accountForm.account_name || !accountForm.bank_name || !accountForm.account_number) {
      addToast('Account name, bank name and number are required', 'error');
      return;
    }

    try {
      const res = await api.createBankAccount({
        ...accountForm,
        branch_id: accountForm.branch_id ? Number(accountForm.branch_id) : null,
        opening_balance: Number(accountForm.opening_balance || 0)
      });
      if (res.success) {
        addToast('Bank account / Cash Drawer created successfully!', 'success');
        setShowAccountModal(false);
        loadBanking();
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Mark Reconciled
  const handleReconcile = async (txnId) => {
    try {
      const res = await api.reconcileTransaction({ transaction_id: txnId, status: 'Reconciled' });
      if (res.success) {
        addToast('Transaction reconciled against bank statement!', 'success');
        loadBanking();
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <Landmark className="w-6 h-6 text-sky-400" />
            Banking, Cash Drawers & Liquidity
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Commercial operating accounts, branch counter cash drawers, merchant gateways, inter-account transfers, and bank statement reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAccountModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Bank / Drawer</span>
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Fund Transfer / Safe Drop</span>
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {accounts.map(acc => {
          const isCash = acc.account_type?.includes('Cash');
          const isGateway = acc.account_type?.includes('Merchant');
          return (
            <div
              key={acc.id}
              className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                isCash
                  ? 'bg-gradient-to-br from-amber-950/30 to-slate-900 border-amber-900/50'
                  : isGateway
                  ? 'bg-gradient-to-br from-purple-950/30 to-slate-900 border-purple-900/50'
                  : 'bg-gradient-to-br from-sky-950/30 to-slate-900 border-sky-900/50'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isCash ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    isGateway ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                    'bg-sky-950 text-sky-300 border border-sky-800'
                  }`}>
                    {acc.account_type}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{acc.account_code}</span>
                </div>

                <h3 className="font-serif font-bold text-white text-base leading-snug">
                  {acc.account_name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{acc.bank_name}</p>
                <p className="text-[10px] text-slate-500 font-mono">Acct: {acc.account_number}</p>
                {acc.branch_name && (
                  <p className="text-[10px] text-amber-300/80 mt-1">Outlet: {acc.branch_name}</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-baseline">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Available Balance</span>
                <span className="text-lg font-bold text-white font-mono">
                  {formatCurrency(acc.current_balance)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transactions & Bank Statement */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-base text-white">Bank Statement & Reconciliation Log</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filter Account:</span>
            <select
              value={selectedAccountFilter}
              onChange={(e) => setSelectedAccountFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none"
            >
              <option value="all">All Bank & Cash Accounts</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.account_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800/80 text-slate-400 border-b border-slate-700/80 uppercase font-semibold tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Txn #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Bank Account</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Description / Reference</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Balance After</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-400">Loading banking entries...</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-500">No bank transactions recorded.</td>
                  </tr>
                ) : (
                  transactions.map(t => {
                    const isCredit = t.type.includes('Deposit') || t.type.includes('Transfer In');
                    return (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-400">{t.transaction_no}</td>
                        <td className="py-3.5 px-4 text-slate-400">{t.transaction_date}</td>
                        <td className="py-3.5 px-4 font-medium text-white">{t.account_name}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCredit ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-slate-200">{t.description}</p>
                          {t.reference_no && <p className="text-[10px] text-slate-400 font-mono">Ref: {t.reference_no}</p>}
                        </td>
                        <td className={`py-3.5 px-4 text-right font-mono font-bold ${
                          isCredit ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isCredit ? '+' : '-'}{formatCurrency(t.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300 font-semibold">
                          {formatCurrency(t.balance_after)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.reconciliation_status === 'Reconciled'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {t.reconciliation_status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {t.reconciliation_status !== 'Reconciled' && (
                            <button
                              onClick={() => handleReconcile(t.id)}
                              className="px-2 py-1 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold transition-colors"
                              title="Reconcile with bank statement"
                            >
                              Reconcile
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FUND TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-sky-400" />
                Transfer Funds / Daily Cash Safe Drop
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">From Account (Source) *</label>
                <select
                  required
                  value={transferForm.from_account_id}
                  onChange={(e) => setTransferForm({ ...transferForm, from_account_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">Select source account...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.account_name} ({formatCurrency(a.current_balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">To Account (Destination) *</label>
                <select
                  required
                  value={transferForm.to_account_id}
                  onChange={(e) => setTransferForm({ ...transferForm, to_account_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">Select destination...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.account_name} ({formatCurrency(a.current_balance)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Transfer Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={transferForm.transfer_date}
                    onChange={(e) => setTransferForm({ ...transferForm, transfer_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reference # / Notes</label>
                <input
                  type="text"
                  value={transferForm.description}
                  onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                  placeholder="e.g. End of day cash drawer drop to commercial operating account"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Execute Fund Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW ACCOUNT MODAL */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-400" />
                Add Bank Account / Branch Cash Drawer
              </h3>
              <button onClick={() => setShowAccountModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAccountSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Account Display Name *</label>
                <input
                  type="text"
                  required
                  value={accountForm.account_name}
                  onChange={(e) => setAccountForm({ ...accountForm, account_name: e.target.value })}
                  placeholder="e.g. Marina POS Safe Drawer or Citi Commercial"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Bank / Institution Name *</label>
                  <input
                    type="text"
                    required
                    value={accountForm.bank_name}
                    onChange={(e) => setAccountForm({ ...accountForm, bank_name: e.target.value })}
                    placeholder="e.g. JPMorgan Chase"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Account Number *</label>
                  <input
                    type="text"
                    required
                    value={accountForm.account_number}
                    onChange={(e) => setAccountForm({ ...accountForm, account_number: e.target.value })}
                    placeholder="e.g. 1948-2849-01"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Account Type</label>
                  <select
                    value={accountForm.account_type}
                    onChange={(e) => setAccountForm({ ...accountForm, account_type: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Checking / Current">Checking / Current</option>
                    <option value="Savings">Savings</option>
                    <option value="Cash Drawer POS">Cash Drawer POS</option>
                    <option value="Merchant Settlement">Merchant Settlement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Branch Affiliation</label>
                  <select
                    value={accountForm.branch_id}
                    onChange={(e) => setAccountForm({ ...accountForm, branch_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="">Master Central (All Branches)</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Opening Cash Balance ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={accountForm.opening_balance}
                  onChange={(e) => setAccountForm({ ...accountForm, opening_balance: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
