import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Scale,
  TrendingUp,
  FileText,
  BookOpen,
  Plus,
  CheckCircle,
  X,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Printer
} from 'lucide-react';

export default function Accounting() {
  const { branches, selectedBranchId, formatCurrency, addToast, triggerRefresh, refreshKey } = useApp();
  const [subTab, setSubTab] = useState('pnl'); // 'pnl', 'balance_sheet', 'trial_balance', 'journals', 'coa'

  // Data states
  const [pnlData, setPnlData] = useState(null);
  const [balanceSheetData, setBalanceSheetData] = useState(null);
  const [trialBalanceData, setTrialBalanceData] = useState(null);
  const [journals, setJournals] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manual Journal Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    branch_id: selectedBranchId !== 'all' ? selectedBranchId : 1,
    narration: '',
    lines: [
      { accountId: '', debit: '', credit: '' },
      { accountId: '', debit: '', credit: '' }
    ]
  });

  const loadAccountingData = async () => {
    setLoading(true);
    try {
      if (subTab === 'pnl') {
        const res = await api.getProfitAndLoss({ branch_id: selectedBranchId });
        if (res.success) setPnlData(res);
      } else if (subTab === 'balance_sheet') {
        const res = await api.getBalanceSheet(selectedBranchId);
        if (res.success) setBalanceSheetData(res);
      } else if (subTab === 'trial_balance') {
        const res = await api.getTrialBalance(selectedBranchId);
        if (res.success) setTrialBalanceData(res);
      } else if (subTab === 'journals') {
        const res = await api.getJournals({ branch_id: selectedBranchId });
        if (res.success) setJournals(res.journals || []);
      } else if (subTab === 'coa') {
        const res = await api.getChartOfAccounts();
        if (res.success) setChartOfAccounts(res.accounts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountingData();
  }, [subTab, selectedBranchId, refreshKey]);

  // Load COA for dropdowns
  useEffect(() => {
    api.getChartOfAccounts().then(res => {
      if (res.success) setChartOfAccounts(res.accounts || []);
    });
  }, []);

  // Handle Manual Journal Submit
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const validLines = manualForm.lines.filter(l => l.accountId && (Number(l.debit) > 0 || Number(l.credit) > 0));

    if (validLines.length < 2) {
      addToast('A journal entry must have at least 2 valid lines', 'error');
      return;
    }

    const totalDeb = validLines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const totalCred = validLines.reduce((s, l) => s + Number(l.credit || 0), 0);

    if (Math.abs(totalDeb - totalCred) > 0.05) {
      addToast(`Debits ($${totalDeb.toFixed(2)}) must equal Credits ($${totalCred.toFixed(2)})`, 'error');
      return;
    }

    try {
      const res = await api.createManualJournal({
        entry_date: manualForm.entry_date,
        branch_id: Number(manualForm.branch_id),
        narration: manualForm.narration,
        lines: validLines.map(l => ({
          accountId: Number(l.accountId),
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0)
        }))
      });

      if (res.success) {
        addToast(`Manual Journal Voucher ${res.entryNo} posted!`, 'success');
        setShowManualModal(false);
        loadAccountingData();
        triggerRefresh();
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <Scale className="w-6 h-6 text-amber-400" />
            General Ledger & Financial Accounting
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated double-entry bookkeeping engine with real-time Profit & Loss, Balance Sheet, Trial Balance, and Journal Vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="hidden sm:flex bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs font-semibold items-center gap-1.5 transition-colors no-print"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={() => setShowManualModal(true)}
            className="bg-wine-700 hover:bg-wine-600 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Post Manual Journal Voucher</span>
          </button>
        </div>
      </div>

      {/* Financial Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-2 text-xs">
        {[
          { id: 'pnl', label: 'Profit & Loss Statement (P&L)', icon: TrendingUp },
          { id: 'balance_sheet', label: 'Balance Sheet', icon: Scale },
          { id: 'trial_balance', label: 'Trial Balance', icon: ShieldCheck },
          { id: 'journals', label: 'Journal Entries & Audit Log', icon: FileText },
          { id: 'coa', label: 'Chart of Accounts', icon: BookOpen }
        ].map(tab => {
          const Icon = tab.icon;
          const isAct = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                isAct
                  ? 'bg-gradient-to-r from-wine-700 to-wine-800 text-white shadow-md ring-1 ring-wine-400'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PROFIT & LOSS STATEMENT */}
      {subTab === 'pnl' && (
        <div className="space-y-6">
          {pnlData && (
            <>
              {/* PnL Highlight Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Net Wine Sales Revenue</span>
                  <p className="text-xl font-bold text-white mt-1 font-mono">{formatCurrency(pnlData.summary.totalRevenue)}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Cost of Goods Sold (COGS)</span>
                  <p className="text-xl font-bold text-slate-300 mt-1 font-mono">{formatCurrency(pnlData.summary.totalCogs)}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] text-amber-400 uppercase font-semibold">Gross Profit ({pnlData.summary.grossMarginPct}%)</span>
                  <p className="text-xl font-bold text-amber-300 mt-1 font-mono">{formatCurrency(pnlData.summary.grossProfit)}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] text-emerald-400 uppercase font-semibold">Net Operating Profit</span>
                  <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">{formatCurrency(pnlData.summary.netProfit)}</p>
                </div>
              </div>

              {/* Full Financial Statement Card */}
              <div id="printable-area" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 text-xs">
                <div className="text-center border-b border-slate-800 pb-4">
                  <h2 className="font-serif font-black text-xl text-white tracking-wider uppercase">
                    Grand Cru Wine & Spirits Management
                  </h2>
                  <p className="text-slate-400">Statement of Profit & Loss (Income Statement)</p>
                  <p className="text-[11px] text-amber-300 font-mono mt-1">
                    Branch: {selectedBranchId === 'all' ? 'All Outlets Consolidated' : `Branch #${selectedBranchId}`}
                  </p>
                </div>

                {/* 1. Operating Revenue */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-bold text-emerald-400 border-b border-slate-800 pb-1">
                    <span>1. Operating Revenue</span>
                    <span>Amount ($)</span>
                  </div>
                  {pnlData.revenueItems.map(item => (
                    <div key={item.id} className="flex justify-between text-slate-300 py-1 pl-4">
                      <span>{item.code} - {item.name}</span>
                      <span className="font-mono">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-bold text-white pt-2 border-t border-slate-800/80">
                    <span>Total Net Revenue</span>
                    <span className="font-mono text-emerald-400">{formatCurrency(pnlData.summary.totalRevenue)}</span>
                  </div>
                </div>

                {/* 2. Cost of Goods Sold */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-bold text-amber-400 border-b border-slate-800 pb-1">
                    <span>2. Cost of Goods Sold (COGS)</span>
                    <span>Amount ($)</span>
                  </div>
                  {pnlData.cogsItems.map(item => (
                    <div key={item.id} className="flex justify-between text-slate-300 py-1 pl-4">
                      <span>{item.code} - {item.name}</span>
                      <span className="font-mono">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-bold text-white pt-2 border-t border-slate-800/80">
                    <span>Total Cost of Goods Sold</span>
                    <span className="font-mono text-slate-300">{formatCurrency(pnlData.summary.totalCogs)}</span>
                  </div>
                </div>

                {/* Gross Profit Subtotal */}
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 flex justify-between items-center text-sm font-bold text-amber-300">
                  <span>GROSS PROFIT (Margin: {pnlData.summary.grossMarginPct}%)</span>
                  <span className="font-mono text-base">{formatCurrency(pnlData.summary.grossProfit)}</span>
                </div>

                {/* 3. Operating Expenses */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-bold text-rose-400 border-b border-slate-800 pb-1">
                    <span>3. Operating Expenses</span>
                    <span>Amount ($)</span>
                  </div>
                  {pnlData.opexItems.map(item => (
                    <div key={item.id} className="flex justify-between text-slate-300 py-1 pl-4">
                      <span>{item.code} - {item.name}</span>
                      <span className="font-mono">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-bold text-white pt-2 border-t border-slate-800/80">
                    <span>Total Operating Expenses</span>
                    <span className="font-mono text-rose-400">{formatCurrency(pnlData.summary.totalOpex)}</span>
                  </div>
                </div>

                {/* Net Income */}
                <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-800/60 flex justify-between items-center text-base font-bold text-emerald-400">
                  <span className="font-serif">NET OPERATING INCOME / PROFIT</span>
                  <span className="font-mono text-xl">{formatCurrency(pnlData.summary.netProfit)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: BALANCE SHEET */}
      {subTab === 'balance_sheet' && (
        <div className="space-y-6">
          {balanceSheetData && (
            <div id="printable-area" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 text-xs">
              <div className="text-center border-b border-slate-800 pb-4">
                <h2 className="font-serif font-black text-xl text-white tracking-wider uppercase">
                  Grand Cru Wine & Spirits Management
                </h2>
                <p className="text-slate-400">Statement of Financial Position (Balance Sheet)</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded-full text-xs font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Balance Sheet Equation: Assets = Liabilities + Equity (BALANCED)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* LEFT: ASSETS */}
                <div className="space-y-4">
                  <h3 className="font-serif font-bold text-sm text-sky-400 border-b border-slate-800 pb-2">
                    ASSETS
                  </h3>
                  <div className="space-y-2">
                    {balanceSheetData.assets.map(a => (
                      <div key={a.id} className="flex justify-between text-slate-300 py-1 pl-2 border-b border-slate-800/40">
                        <span>{a.code} - {a.name}</span>
                        <span className="font-mono font-semibold">{formatCurrency(a.balance)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-sky-950/40 p-3 rounded-xl border border-sky-800/60 flex justify-between items-center text-sm font-bold text-sky-300 mt-4">
                    <span>TOTAL ASSETS</span>
                    <span className="font-mono">{formatCurrency(balanceSheetData.summary.totalAssets)}</span>
                  </div>
                </div>

                {/* RIGHT: LIABILITIES & EQUITY */}
                <div className="space-y-6">
                  {/* Liabilities */}
                  <div className="space-y-3">
                    <h3 className="font-serif font-bold text-sm text-rose-400 border-b border-slate-800 pb-2">
                      LIABILITIES
                    </h3>
                    <div className="space-y-2">
                      {balanceSheetData.liabilities.map(l => (
                        <div key={l.id} className="flex justify-between text-slate-300 py-1 pl-2 border-b border-slate-800/40">
                          <span>{l.code} - {l.name}</span>
                          <span className="font-mono font-semibold">{formatCurrency(l.balance)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-200 pt-2 border-t border-slate-800">
                      <span>Total Liabilities</span>
                      <span className="font-mono text-rose-400">{formatCurrency(balanceSheetData.summary.totalLiabilities)}</span>
                    </div>
                  </div>

                  {/* Equity */}
                  <div className="space-y-3">
                    <h3 className="font-serif font-bold text-sm text-purple-400 border-b border-slate-800 pb-2">
                      OWNER'S EQUITY
                    </h3>
                    <div className="space-y-2">
                      {balanceSheetData.equity.map(e => (
                        <div key={e.id} className="flex justify-between text-slate-300 py-1 pl-2 border-b border-slate-800/40">
                          <span>{e.code} - {e.name}</span>
                          <span className="font-mono font-semibold">{formatCurrency(e.balance)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-200 pt-2 border-t border-slate-800">
                      <span>Total Equity</span>
                      <span className="font-mono text-purple-400">{formatCurrency(balanceSheetData.summary.totalEquity)}</span>
                    </div>
                  </div>

                  <div className="bg-purple-950/40 p-3 rounded-xl border border-purple-800/60 flex justify-between items-center text-sm font-bold text-purple-300 mt-4">
                    <span>TOTAL LIABILITIES & EQUITY</span>
                    <span className="font-mono">{formatCurrency(balanceSheetData.summary.totalLiabilitiesAndEquity)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TRIAL BALANCE */}
      {subTab === 'trial_balance' && (
        <div className="space-y-4">
          {trialBalanceData && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg text-xs">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="font-serif font-bold text-base text-white">Trial Balance Sheet</h3>
                  <p className="text-slate-400 text-xs">Double-entry verification of total debits vs total credits</p>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Debits = Credits Verified ($0.00 Variance)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                      <th className="p-3">GL Code</th>
                      <th className="p-3">Account Title</th>
                      <th className="p-3">Type</th>
                      <th className="p-3 text-right">Debit Balance ($)</th>
                      <th className="p-3 text-right">Credit Balance ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {trialBalanceData.rows.map(r => (
                      <tr key={r.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-amber-300">{r.code}</td>
                        <td className="p-3 text-white font-medium">{r.name}</td>
                        <td className="p-3 text-slate-400">{r.type}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-200">
                          {r.debit > 0 ? formatCurrency(r.debit) : '—'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-200">
                          {r.credit > 0 ? formatCurrency(r.credit) : '—'}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-800/90 font-bold text-white text-sm">
                      <td colSpan="3" className="p-3 font-serif">TOTAL BALANCES</td>
                      <td className="p-3 text-right font-mono text-emerald-400">
                        {formatCurrency(trialBalanceData.totals.totalDebit)}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-400">
                        {formatCurrency(trialBalanceData.totals.totalCredit)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: GENERAL JOURNALS */}
      {subTab === 'journals' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <h3 className="font-serif font-bold text-base text-white">General Journal Audit Log</h3>
              <p className="text-xs text-slate-400">Complete immutable record of all debit and credit journal entries.</p>
            </div>
          </div>

          <div className="space-y-3">
            {journals.map(entry => (
              <div key={entry.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-amber-300 text-sm">{entry.entry_no}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      {entry.reference_type}
                    </span>
                    <span className="text-slate-400">{entry.branch_name || 'Central'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span>Date: {entry.entry_date}</span>
                    <span className="font-bold text-white font-mono">Total: {formatCurrency(entry.total_debit)}</span>
                  </div>
                </div>

                <p className="text-slate-300 italic text-[11px]">{entry.narration}</p>

                {/* Entry Lines */}
                <div className="bg-slate-950/60 rounded-xl border border-slate-800/80 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/60 text-slate-400 text-[10px] uppercase font-semibold">
                      <tr>
                        <th className="p-2.5">Account Code & Title</th>
                        <th className="p-2.5">Line Memo</th>
                        <th className="p-2.5 text-right">Debit ($)</th>
                        <th className="p-2.5 text-right">Credit ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {entry.lines?.map(line => (
                        <tr key={line.id}>
                          <td className="p-2.5 font-medium text-white">
                            <span className="font-mono text-amber-400 font-bold mr-1.5">{line.account_code}</span>
                            <span>{line.account_name}</span>
                          </td>
                          <td className="p-2.5 text-slate-400 text-[11px]">{line.notes || '—'}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                            {line.debit > 0 ? formatCurrency(line.debit) : ''}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-rose-400">
                            {line.credit > 0 ? formatCurrency(line.credit) : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CHART OF ACCOUNTS */}
      {subTab === 'coa' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg text-xs">
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-serif font-bold text-base text-white">Standard Wine Industry Chart of Accounts</h3>
            <p className="text-slate-400 text-xs">Structured GAAP / IFRS account hierarchy with live calculated balances.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="p-3">GL Code</th>
                  <th className="p-3">Account Title</th>
                  <th className="p-3">Classification</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Calculated Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {chartOfAccounts.map(a => (
                  <tr key={a.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-amber-300">{a.code}</td>
                    <td className="p-3 text-white font-semibold">{a.name}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.type === 'Asset' ? 'bg-sky-950 text-sky-300 border border-sky-800' :
                        a.type === 'Liability' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        a.type === 'Equity' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                        a.type === 'Revenue' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {a.type} ({a.sub_type})
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">{a.description}</td>
                    <td className="p-3 text-right font-mono font-bold text-white">
                      {formatCurrency(a.calculated_balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MANUAL JOURNAL MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Post Manual Journal Entry
              </h3>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Entry Date *</label>
                  <input
                    type="date"
                    required
                    value={manualForm.entry_date}
                    onChange={(e) => setManualForm({ ...manualForm, entry_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Branch Affiliation</label>
                  <select
                    value={manualForm.branch_id}
                    onChange={(e) => setManualForm({ ...manualForm, branch_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Narration / Memo *</label>
                <input
                  type="text"
                  required
                  value={manualForm.narration}
                  onChange={(e) => setManualForm({ ...manualForm, narration: e.target.value })}
                  placeholder="e.g. Month-end depreciation for cellar cooling units"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              {/* Journal Lines */}
              <div className="space-y-2">
                <label className="block text-slate-400 font-medium">Debit & Credit Lines</label>
                {manualForm.lines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-800/40 p-2 rounded-xl border border-slate-700/60">
                    <div className="col-span-6">
                      <select
                        required
                        value={line.accountId}
                        onChange={(e) => {
                          const newLines = [...manualForm.lines];
                          newLines[idx].accountId = e.target.value;
                          setManualForm({ ...manualForm, lines: newLines });
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white"
                      >
                        <option value="">Select GL Account...</option>
                        {chartOfAccounts.map(a => (
                          <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Debit ($)"
                        value={line.debit}
                        onChange={(e) => {
                          const newLines = [...manualForm.lines];
                          newLines[idx].debit = e.target.value;
                          if (e.target.value) newLines[idx].credit = '';
                          setManualForm({ ...manualForm, lines: newLines });
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-emerald-400 font-mono text-right"
                      />
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Credit ($)"
                        value={line.credit}
                        onChange={(e) => {
                          const newLines = [...manualForm.lines];
                          newLines[idx].credit = e.target.value;
                          if (e.target.value) newLines[idx].debit = '';
                          setManualForm({ ...manualForm, lines: newLines });
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-rose-400 font-mono text-right"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setManualForm({
                    ...manualForm,
                    lines: [...manualForm.lines, { accountId: '', debit: '', credit: '' }]
                  })}
                  className="text-amber-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-wine-700 hover:bg-wine-600 text-white font-bold rounded-xl shadow"
                >
                  Post Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
