import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Boxes,
  Truck,
  AlertTriangle,
  ArrowRightLeft,
  Search,
  Plus,
  CheckCircle,
  X,
  MapPin,
  Clock,
  Sparkles,
  Wine,
  Building2,
  DollarSign
} from 'lucide-react';

export default function Inventory() {
  const { branches, selectedBranchId, formatCurrency, addToast, triggerRefresh, refreshKey } = useApp();
  const [activeSubTab, setActiveSubTab] = useState('stock'); // 'stock', 'transfers', 'adjustments'

  // Stock on Hand
  const [inventoryItems, setInventoryItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [loadingStock, setLoadingStock] = useState(true);
  const [searchStock, setSearchStock] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Transfers
  const [transfers, setTransfers] = useState([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Adjustments
  const [adjustments, setAdjustments] = useState([]);
  const [loadingAdjustments, setLoadingAdjustments] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

  // Rack Location Edit Modal
  const [editingLocation, setEditingLocation] = useState(null);
  const [rackLocationInput, setRackLocationInput] = useState('');
  const [batchLotInput, setBatchLotInput] = useState('');

  // Products list for dropdowns
  const [products, setProducts] = useState([]);

  // Transfer Form State
  const [transferForm, setTransferForm] = useState({
    from_branch_id: '',
    to_branch_id: '',
    transfer_date: new Date().toISOString().split('T')[0],
    notes: '',
    items: [{ product_id: '', quantity: 1 }]
  });

  // Adjustment Form State
  const [adjustmentForm, setAdjustmentForm] = useState({
    branch_id: selectedBranchId !== 'all' ? selectedBranchId : 1,
    product_id: '',
    adjustment_type: 'OUT',
    quantity: 1,
    reason: 'Bottle Breakage',
    notes: ''
  });

  const loadStock = async () => {
    setLoadingStock(true);
    try {
      const res = await api.getInventory({
        branch_id: selectedBranchId,
        search: searchStock || undefined,
        low_stock: lowStockOnly ? 'true' : undefined
      });
      if (res.success) {
        setInventoryItems(res.items || []);
        setSummary(res.summary || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStock(false);
    }
  };

  const loadTransfers = async () => {
    setLoadingTransfers(true);
    try {
      const res = await api.getTransfers(selectedBranchId);
      if (res.success) setTransfers(res.transfers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTransfers(false);
    }
  };

  const loadAdjustments = async () => {
    setLoadingAdjustments(true);
    try {
      const res = await api.getAdjustments(selectedBranchId);
      if (res.success) setAdjustments(res.adjustments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdjustments(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await api.getProducts({ branch_id: 'all' });
      if (res.success) setProducts(res.products || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'stock') loadStock();
    else if (activeSubTab === 'transfers') loadTransfers();
    else if (activeSubTab === 'adjustments') loadAdjustments();
  }, [activeSubTab, selectedBranchId, lowStockOnly, refreshKey]);

  // Handle Transfer Submit
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferForm.from_branch_id || !transferForm.to_branch_id) {
      addToast('Select both source and destination branches', 'error');
      return;
    }
    if (Number(transferForm.from_branch_id) === Number(transferForm.to_branch_id)) {
      addToast('Source and destination branches cannot be the same', 'error');
      return;
    }

    const validItems = transferForm.items.filter(it => it.product_id && it.quantity > 0);
    if (validItems.length === 0) {
      addToast('Add at least one wine with positive quantity', 'error');
      return;
    }

    try {
      const res = await api.createTransfer({
        ...transferForm,
        items: validItems.map(it => ({ product_id: Number(it.product_id), quantity: Number(it.quantity) }))
      });
      if (res.success) {
        addToast(`Transfer ${res.transferNo} dispatched successfully!`, 'success');
        setShowTransferModal(false);
        setTransferForm({
          from_branch_id: '',
          to_branch_id: '',
          transfer_date: new Date().toISOString().split('T')[0],
          notes: '',
          items: [{ product_id: '', quantity: 1 }]
        });
        loadTransfers();
        triggerRefresh();
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Receive Transfer
  const handleReceiveTransfer = async (id) => {
    try {
      const res = await api.updateTransferStatus(id, { status: 'Received' });
      if (res.success) {
        addToast('Stock transfer confirmed and received at destination branch!', 'success');
        loadTransfers();
        triggerRefresh();
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Handle Adjustment Submit
  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    if (!adjustmentForm.product_id) {
      addToast('Select a wine product for adjustment', 'error');
      return;
    }

    try {
      const res = await api.createAdjustment({
        ...adjustmentForm,
        branch_id: Number(adjustmentForm.branch_id),
        product_id: Number(adjustmentForm.product_id),
        quantity: Number(adjustmentForm.quantity)
      });
      if (res.success) {
        addToast(`Stock adjustment recorded (${res.adjustmentNo}) & journal posted!`, 'success');
        setShowAdjustmentModal(false);
        loadAdjustments();
        triggerRefresh();
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Update Rack Location
  const handleSaveRack = async () => {
    if (!editingLocation) return;
    try {
      await api.updateRackLocation(editingLocation.branch_id, editingLocation.product_id, {
        rack_location: rackLocationInput,
        batch_lot: batchLotInput
      });
      addToast('Cellar bin location updated!', 'success');
      setEditingLocation(null);
      loadStock();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-wine-400" />
            Multi-Branch Inventory & Cellar Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time stock across branches, inter-branch replenishment transfers, cellar rack locations, and breakage write-offs.
          </p>
        </div>

        {/* Sub-tab Navigation Pills */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab('stock')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'stock'
                ? 'bg-wine-700 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cellar Stock ({summary.totalBottles || 0} btls)
          </button>
          <button
            onClick={() => setActiveSubTab('transfers')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'transfers'
                ? 'bg-wine-700 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Inter-Branch Transfers
          </button>
          <button
            onClick={() => setActiveSubTab('adjustments')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'adjustments'
                ? 'bg-wine-700 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Breakage & Spoilage
          </button>
        </div>
      </div>

      {/* SUBTAB 1: STOCK ON HAND */}
      {activeSubTab === 'stock' && (
        <div className="space-y-4">
          {/* Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Bottles</span>
              <p className="text-xl font-bold text-white mt-1">{summary.totalBottles?.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Acquisition Cost Valuation</span>
              <p className="text-xl font-bold text-amber-300 mt-1">{formatCurrency(summary.totalCostValuation)}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Potential Retail Value</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(summary.totalRetailValuation)}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Low Stock Warnings</span>
              <p className={`text-xl font-bold mt-1 ${summary.lowStockCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {summary.lowStockCount || 0} items
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchStock}
                onChange={(e) => setSearchStock(e.target.value)}
                placeholder="Search inventory by wine or rack..."
                className="w-full bg-slate-800 border border-slate-700 text-xs rounded-xl pl-9 pr-3 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-wine-600 focus:ring-wine-500"
                />
                <span>Show Low Stock Only</span>
              </label>

              <button
                onClick={() => setShowTransferModal(true)}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>New Transfer</span>
              </button>

              <button
                onClick={() => setShowAdjustmentModal(true)}
                className="bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Record Spoilage / Breakage</span>
              </button>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-400 border-b border-slate-700/80 uppercase font-semibold tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Branch Outlet</th>
                    <th className="py-3.5 px-4">Wine / SKU</th>
                    <th className="py-3.5 px-4">Cellar Rack Location</th>
                    <th className="py-3.5 px-4 text-center">Batch / Lot</th>
                    <th className="py-3.5 px-4 text-right">Cost</th>
                    <th className="py-3.5 px-4 text-center">Stock</th>
                    <th className="py-3.5 px-4 text-right">Valuation</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {loadingStock ? (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-slate-400">Loading stock records...</td>
                    </tr>
                  ) : inventoryItems.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-slate-500">No inventory found.</td>
                    </tr>
                  ) : (
                    inventoryItems.map((item) => (
                      <tr key={item.inventory_id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-200">
                          {item.branch_name}
                          <span className="block text-[10px] text-slate-500 font-mono">{item.branch_code}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block">{item.product_name}</span>
                          <span className="text-[10px] text-amber-300 font-mono">SKU: {item.sku}</span>
                          <span className="text-[10px] text-slate-400 ml-2">{item.varietal} {item.vintage_year || ''}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-[11px] text-slate-300">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            {item.rack_location || 'Cellar Main'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-400">
                          {item.batch_lot || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                          {formatCurrency(item.cost_price)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-sm font-bold font-mono text-white">
                            {item.quantity}
                          </span>
                          <span className="block text-[10px] text-slate-500">Min: {item.min_stock_level}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-300">
                          {formatCurrency(item.total_valuation)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.stock_status === 'OUT_OF_STOCK'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : item.stock_status === 'LOW_STOCK'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {item.stock_status === 'OUT_OF_STOCK' ? 'Out of Stock' : item.stock_status === 'LOW_STOCK' ? 'Low Stock' : 'Optimal'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setEditingLocation(item);
                              setRackLocationInput(item.rack_location || '');
                              setBatchLotInput(item.batch_lot || '');
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-medium transition-colors"
                          >
                            Set Location
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: INTER-BRANCH TRANSFERS */}
      {activeSubTab === 'transfers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div>
              <h3 className="font-serif font-bold text-base text-white">Inter-Branch Stock Movement</h3>
              <p className="text-xs text-slate-400">Move wine cases from central distribution hub to retail boutiques.</p>
            </div>
            <button
              onClick={() => setShowTransferModal(true)}
              className="bg-wine-700 hover:bg-wine-600 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Stock Transfer</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-400 border-b border-slate-700/80 uppercase font-semibold tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Transfer #</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">From (Source)</th>
                    <th className="py-3.5 px-4">To (Destination)</th>
                    <th className="py-3.5 px-4">Items / Bottles</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {loadingTransfers ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">Loading transfers...</td>
                    </tr>
                  ) : transfers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500">No stock transfers recorded.</td>
                    </tr>
                  ) : (
                    transfers.map(t => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-300">{t.transfer_no}</td>
                        <td className="py-3.5 px-4 text-slate-400">{t.transfer_date}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-200">{t.from_branch_name}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-200">{t.to_branch_name}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white">{t.total_quantity} bottles</span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {t.items?.map(it => `${it.product_name} (${it.quantity})`).join(', ')}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'Received'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {t.status === 'In Transit' && (
                            <button
                              onClick={() => handleReceiveTransfer(t.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs shadow transition-colors"
                            >
                              Confirm Receipt
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
        </div>
      )}

      {/* SUBTAB 3: STOCK ADJUSTMENTS & SPOILAGE */}
      {activeSubTab === 'adjustments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div>
              <h3 className="font-serif font-bold text-base text-white">Loss, Breakage & Spoilage Log</h3>
              <p className="text-xs text-slate-400">Audit trail of broken bottles, cork taint spoilage, tasting flights, and physical count adjustments.</p>
            </div>
            <button
              onClick={() => setShowAdjustmentModal(true)}
              className="bg-rose-800 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Record Stock Adjustment</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-400 border-b border-slate-700/80 uppercase font-semibold tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Adjustment #</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Branch</th>
                    <th className="py-3.5 px-4">Wine</th>
                    <th className="py-3.5 px-4">Reason / Notes</th>
                    <th className="py-3.5 px-4 text-center">Direction</th>
                    <th className="py-3.5 px-4 text-center">Qty</th>
                    <th className="py-3.5 px-4 text-right">Cost Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {loadingAdjustments ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400">Loading adjustments...</td>
                    </tr>
                  ) : adjustments.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-500">No stock adjustments recorded.</td>
                    </tr>
                  ) : (
                    adjustments.map(a => (
                      <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-300">{a.adjustment_no}</td>
                        <td className="py-3.5 px-4 text-slate-400">{a.created_at?.slice(0, 10)}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-200">{a.branch_name}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-white block">{a.product_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">SKU: {a.sku}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-rose-300 block">{a.reason}</span>
                          {a.notes && <span className="text-[10px] text-slate-400">{a.notes}</span>}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.adjustment_type === 'OUT' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {a.adjustment_type === 'OUT' ? 'Deduction (-)' : 'Surplus (+)'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold font-mono text-white">{a.quantity}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-400">
                          {formatCurrency(a.total_cost)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NEW TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                Inter-Branch Wine Transfer
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">From (Source Outlet) *</label>
                  <select
                    required
                    value={transferForm.from_branch_id}
                    onChange={(e) => setTransferForm({ ...transferForm, from_branch_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="">Select source branch...</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">To (Destination Outlet) *</label>
                  <select
                    required
                    value={transferForm.to_branch_id}
                    onChange={(e) => setTransferForm({ ...transferForm, to_branch_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="">Select destination...</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items in transfer */}
              <div className="space-y-2">
                <label className="block text-slate-400 font-medium">Wine Items & Quantity</label>
                {transferForm.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={item.product_id}
                      onChange={(e) => {
                        const newItems = [...transferForm.items];
                        newItems[idx].product_id = e.target.value;
                        setTransferForm({ ...transferForm, items: newItems });
                      }}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="">Select wine...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...transferForm.items];
                        newItems[idx].quantity = Number(e.target.value);
                        setTransferForm({ ...transferForm, items: newItems });
                      }}
                      placeholder="Qty"
                      className="w-20 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-center"
                    />

                    {transferForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setTransferForm({
                            ...transferForm,
                            items: transferForm.items.filter((_, i) => i !== idx)
                          });
                        }}
                        className="p-2 text-rose-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setTransferForm({ ...transferForm, items: [...transferForm.items, { product_id: '', quantity: 1 }] })}
                  className="text-amber-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Wine</span>
                </button>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Transfer Notes / Waybill</label>
                <input
                  type="text"
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                  placeholder="e.g. Replenishment dispatch from warehouse pallet bay"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-wine-700 hover:bg-wine-600 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Truck className="w-4 h-4" />
                  <span>Dispatch Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD ADJUSTMENT MODAL */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Record Spoilage, Breakage & Loss
              </h3>
              <button onClick={() => setShowAdjustmentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Branch Outlet *</label>
                <select
                  required
                  value={adjustmentForm.branch_id}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, branch_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Wine Product *</label>
                <select
                  required
                  value={adjustmentForm.product_id}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, product_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="">Select wine...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Adjustment Type</label>
                  <select
                    value={adjustmentForm.adjustment_type}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, adjustment_type: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="OUT">Deduction (Loss/Write-off)</option>
                    <option value="IN">Surplus (Count Correction)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Bottles Qty *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={adjustmentForm.quantity}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Reason *</label>
                <select
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="Bottle Breakage">Bottle Breakage (Transit/Floor accident)</option>
                  <option value="Corked / Spoiled Wine">Corked / Oxidized Wine Taint</option>
                  <option value="Sommelier Tasting Flight">Sommelier Tasting Flight / Masterclass</option>
                  <option value="Stocktaking Discrepancy">Stocktaking Audit Discrepancy</option>
                  <option value="Promotional Gift">VIP Promotional Tasting Sample</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Incident Details</label>
                <textarea
                  rows="2"
                  value={adjustmentForm.notes}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, notes: e.target.value })}
                  placeholder="e.g. Dropped during shelf restocking by cellar assistant"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-600 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Post Adjustment to GL</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CELLAR RACK LOCATION MODAL */}
      {editingLocation && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-sm text-white">Update Cellar Location</h3>
              <button onClick={() => setEditingLocation(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <p className="font-bold text-white">{editingLocation.product_name}</p>
              <p className="text-slate-400">{editingLocation.branch_name}</p>

              <div>
                <label className="block text-slate-400 mb-1">Rack / Bin Location</label>
                <input
                  type="text"
                  value={rackLocationInput}
                  onChange={(e) => setRackLocationInput(e.target.value)}
                  placeholder="e.g. Aisle 3, Rack B, Bin 14"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Batch / Lot Number</label>
                <input
                  type="text"
                  value={batchLotInput}
                  onChange={(e) => setBatchLotInput(e.target.value)}
                  placeholder="e.g. LOT-2026-CHATEAU-01"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingLocation(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRack}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
              >
                Save Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
