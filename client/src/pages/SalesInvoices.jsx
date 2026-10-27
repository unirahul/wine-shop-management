import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  ReceiptText,
  Search,
  Filter,
  Eye,
  Printer,
  X,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  ArrowDownCircle,
  FileText
} from 'lucide-react';

export default function SalesInvoices() {
  const { selectedBranchId, formatCurrency, addToast, triggerRefresh, refreshKey } = useApp();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected invoice for detail view / printable
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Quick Receipt Modal for unpaid balance
  const [receiptModal, setReceiptModal] = useState(null);
  const [receiptAmount, setReceiptAmount] = useState('');
  const [receiptMode, setReceiptMode] = useState('Cash');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [receiptBankId, setReceiptBankId] = useState('');
  const [recordingReceipt, setRecordingReceipt] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.getSales({
        branch_id: selectedBranchId,
        status: statusFilter || undefined,
        search: search || undefined
      });
      if (res.success) {
        setInvoices(res.invoices || []);
      }
    } catch (err) {
      console.error('Fetch invoices error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [selectedBranchId, statusFilter, refreshKey]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInvoices();
  };

  const openInvoiceDetail = async (id) => {
    setLoadingDetail(true);
    setSelectedInvoice(id);
    try {
      const res = await api.getSale(id);
      if (res.success) {
        setInvoiceDetails(res);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  const openReceiptModal = async (inv) => {
    setReceiptModal(inv);
    setReceiptAmount(inv.balance_amount.toString());
    try {
      const res = await api.getBankAccounts(inv.branch_id);
      if (res.success && res.accounts?.length > 0) {
        setBankAccounts(res.accounts);
        setReceiptBankId(res.accounts[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitReceipt = async () => {
    if (!receiptBankId || !receiptAmount || Number(receiptAmount) <= 0) {
      addToast('Please enter a valid receipt amount and choose a settlement bank', 'error');
      return;
    }

    setRecordingReceipt(true);
    try {
      const payload = {
        branch_id: receiptModal.branch_id,
        customer_id: receiptModal.customer_id,
        sales_invoice_id: receiptModal.id,
        bank_account_id: Number(receiptBankId),
        amount: Number(receiptAmount),
        payment_mode: receiptMode,
        reference_no: `REC-INV-${receiptModal.invoice_no}`,
        notes: `Settlement for invoice ${receiptModal.invoice_no}`
      };

      const res = await api.createReceipt(payload);
      if (res.success) {
        addToast(`Payment received! Receipt #${res.receiptNo} posted`, 'success');
        setReceiptModal(null);
        fetchInvoices();
        triggerRefresh();
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setRecordingReceipt(false);
    }
  };

  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalReceivable = invoices.reduce((sum, inv) => sum + (inv.balance_amount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <ReceiptText className="w-6 h-6 text-amber-400" />
            Wine Sales & Customer Invoicing
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse POS receipts, wholesale B2B invoices, customer receivables, and print tax invoices.
          </p>
        </div>

        {/* Financial Summary Badges */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
            <p className="text-[10px] uppercase font-semibold text-slate-400">Total Invoiced</p>
            <p className="text-sm font-bold text-white">{formatCurrency(totalBilled)}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
            <p className="text-[10px] uppercase font-semibold text-slate-400">Total Collected</p>
            <p className="text-sm font-bold text-emerald-400">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
            <p className="text-[10px] uppercase font-semibold text-slate-400">Outstanding AR</p>
            <p className="text-sm font-bold text-rose-400">{formatCurrency(totalReceivable)}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice # or customer..."
            className="w-full bg-slate-800 border border-slate-700 text-xs rounded-xl pl-9 pr-3 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 border-b border-slate-700/80 uppercase font-semibold tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Branch Outlet</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Type & Mode</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4 text-right">Balance Due</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-500">
                    No sales invoices found matching your filters.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                      {inv.invoice_no}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {inv.invoice_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-200">{inv.branch_name}</span>
                      <span className="block text-[10px] text-slate-500 font-mono">{inv.branch_code}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-200">{inv.customer_name}</span>
                      {inv.customer_phone && (
                        <span className="block text-[10px] text-slate-400">{inv.customer_phone}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-300">{inv.invoice_type}</span>
                      <span className="block text-[10px] text-slate-400">{inv.payment_method}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold">
                      {inv.balance_amount > 0 ? (
                        <span className="text-rose-400">{formatCurrency(inv.balance_amount)}</span>
                      ) : (
                        <span className="text-slate-500">₹0.00</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : inv.status === 'Partially Paid'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => openInvoiceDetail(inv.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="View & Print Invoice"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {inv.balance_amount > 0 && (
                        <button
                          onClick={() => openReceiptModal(inv)}
                          className="px-2 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-[10px] transition-colors"
                        >
                          Collect
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

      {/* FULL INVOICE VIEW / PRINT MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-8 shadow-2xl relative my-8">
            <button
              onClick={() => { setSelectedInvoice(null); setInvoiceDetails(null); }}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-900 no-print"
            >
              <X className="w-6 h-6" />
            </button>

            {loadingDetail || !invoiceDetails ? (
              <div className="py-12 text-center text-slate-500 font-sans">Loading invoice data...</div>
            ) : (
              <div id="printable-area" className="font-sans text-xs space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                  <div>
                    <h2 className="font-serif font-black text-2xl text-slate-950 uppercase tracking-wider">
                      Royal Heritage Wines & Spirits
                    </h2>
                    <p className="text-slate-600 font-medium">{invoiceDetails.invoice.branch_name}</p>
                    <p className="text-slate-500 text-[11px]">{invoiceDetails.invoice.branch_address}</p>
                    <p className="text-slate-500 text-[11px]">State Excise Lic: <span className="font-mono font-bold">{invoiceDetails.invoice.branch_license}</span></p>
                    <p className="text-slate-500 text-[11px]">Tel: {invoiceDetails.invoice.branch_phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2">
                      Tax Invoice
                    </span>
                    <p className="text-base font-bold font-mono text-slate-900">{invoiceDetails.invoice.invoice_no}</p>
                    <p className="text-slate-500 text-[11px]">Date: {invoiceDetails.invoice.invoice_date}</p>
                    <p className="text-slate-500 text-[11px]">Payment: {invoiceDetails.invoice.payment_method}</p>
                  </div>
                </div>

                {/* Bill To */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bill To Guest / Client:</p>
                    <p className="text-sm font-bold text-slate-900">{invoiceDetails.invoice.customer_name}</p>
                    {invoiceDetails.invoice.customer_phone && <p className="text-slate-600">{invoiceDetails.invoice.customer_phone}</p>}
                    {invoiceDetails.invoice.customer_address && <p className="text-slate-600">{invoiceDetails.invoice.customer_address}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice Status:</p>
                    <span className={`inline-block font-bold px-2 py-0.5 rounded text-xs mt-1 ${
                      invoiceDetails.invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {invoiceDetails.invoice.status}
                    </span>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-900 text-[10px] uppercase font-bold text-slate-600">
                      <th className="py-2">Item Description & Varietal</th>
                      <th className="py-2 text-center">Vintage</th>
                      <th className="py-2 text-right">Price</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">VAT/Tax</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoiceDetails.items.map((it, idx) => (
                      <tr key={idx} className="py-2.5">
                        <td className="py-2.5">
                          <p className="font-bold text-slate-900">{it.product_name}</p>
                          <p className="text-[10px] text-slate-500">{it.varietal} • {it.bottle_size} • {it.region || ''}</p>
                        </td>
                        <td className="py-2.5 text-center text-slate-600 font-mono">{it.vintage_year || 'NV'}</td>
                        <td className="py-2.5 text-right font-mono">₹{it.unit_price.toFixed(2)}</td>
                        <td className="py-2.5 text-center font-bold">{it.quantity}</td>
                        <td className="py-2.5 text-right font-mono text-slate-600">₹{it.tax_amount.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900">₹{it.line_total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals Summary */}
                <div className="flex justify-end pt-2">
                  <div className="w-64 space-y-1.5 text-right text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-mono font-semibold">₹{invoiceDetails.invoice.subtotal.toFixed(2)}</span>
                    </div>
                    {invoiceDetails.invoice.discount_amount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount:</span>
                        <span className="font-mono font-semibold">-₹{invoiceDetails.invoice.discount_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Liquor VAT/Tax:</span>
                      <span className="font-mono font-semibold">₹{invoiceDetails.invoice.tax_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-slate-950 pt-2 border-t-2 border-slate-900">
                      <span>Total Amount:</span>
                      <span className="font-mono">₹{invoiceDetails.invoice.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Amount Paid:</span>
                      <span className="font-mono font-semibold">₹{invoiceDetails.invoice.paid_amount.toFixed(2)}</span>
                    </div>
                    {invoiceDetails.invoice.balance_amount > 0 && (
                      <div className="flex justify-between text-rose-700 font-bold">
                        <span>Balance Due:</span>
                        <span className="font-mono">₹{invoiceDetails.invoice.balance_amount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer notes & signature */}
                <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
                  <div>
                    <p className="font-bold text-slate-800">Terms & Conditions:</p>
                    <p>1. Proof of legal drinking age (21+) required for all sales.</p>
                    <p>2. Unopened wine may be returned within 7 days in original condition.</p>
                  </div>
                  <div className="text-center">
                    <div className="w-40 border-b border-slate-400 mb-1"></div>
                    <p>Authorized Sommelier Signature</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3 no-print font-sans">
              <button
                onClick={() => window.print()}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Tax Invoice</span>
              </button>
              <button
                onClick={() => { setSelectedInvoice(null); setInvoiceDetails(null); }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-4 py-2 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK RECEIPT COLLECTION MODAL */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Collect Customer Payment
              </h3>
              <button onClick={() => setReceiptModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Invoice:</span>
                <span className="font-mono text-amber-300 font-bold">{receiptModal.invoice_no}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Customer:</span>
                <span className="text-white font-medium">{receiptModal.customer_name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Due:</span>
                <span className="text-rose-400 font-bold">{formatCurrency(receiptModal.balance_amount)}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Receipt Amount (₹)</label>
                <input
                  type="number"
                  min="0.01"
                  max={receiptModal.balance_amount}
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Payment Mode</label>
                <select
                  value={receiptMode}
                  onChange={(e) => setReceiptMode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Bank Transfer">Bank Wire Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Deposit Bank / Cash Drawer</label>
                <select
                  value={receiptBankId}
                  onChange={(e) => setReceiptBankId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
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
                onClick={submitReceipt}
                disabled={recordingReceipt}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm Receipt</span>
              </button>
              <button
                onClick={() => setReceiptModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
