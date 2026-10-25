import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Wine,
  Search,
  Plus,
  Edit,
  Eye,
  Filter,
  Layers,
  Sparkles,
  Tag,
  DollarSign,
  Boxes,
  X,
  CheckCircle
} from 'lucide-react';

export default function ProductsCatalog() {
  const { selectedBranchId, formatCurrency, addToast } = useApp();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockDetailModal, setStockDetailModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    category_id: 1,
    wine_type: 'Red',
    varietal: '',
    vintage_year: new Date().getFullYear() - 3,
    region: '',
    country: '',
    bottle_size: '750ml',
    abv: 13.5,
    cost_price: '',
    selling_price: '',
    wholesale_price: '',
    tax_rate: 18.0,
    min_stock_level: 10,
    description: '',
    tasting_notes: '',
    food_pairing: ''
  });

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const [prodsRes, catsRes] = await Promise.all([
        api.getProducts({
          branch_id: selectedBranchId,
          category_id: categoryFilter || undefined,
          wine_type: typeFilter || undefined,
          search: search || undefined
        }),
        api.getCategories()
      ]);

      if (prodsRes.success) setProducts(prodsRes.products || []);
      if (catsRes.success) setCategories(catsRes.categories || []);
    } catch (err) {
      console.error(err);
      addToast('Error loading catalog: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [selectedBranchId, categoryFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCatalog();
  };

  const handleOpenAdd = () => {
    setFormData({
      sku: `WINE-${Date.now().toString().slice(-4)}`,
      barcode: Date.now().toString(),
      name: '',
      category_id: categories[0]?.id || 1,
      wine_type: 'Red',
      varietal: '',
      vintage_year: 2021,
      region: '',
      country: '',
      bottle_size: '750ml',
      abv: 13.5,
      cost_price: '',
      selling_price: '',
      wholesale_price: '',
      tax_rate: 18.0,
      min_stock_level: 10,
      description: '',
      tasting_notes: '',
      food_pairing: ''
    });
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (p) => {
    setFormData({
      sku: p.sku,
      barcode: p.barcode || '',
      name: p.name,
      category_id: p.category_id || 1,
      wine_type: p.wine_type || 'Red',
      varietal: p.varietal || '',
      vintage_year: p.vintage_year || '',
      region: p.region || '',
      country: p.country || '',
      bottle_size: p.bottle_size || '750ml',
      abv: p.abv || 13.5,
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      wholesale_price: p.wholesale_price || '',
      tax_rate: p.tax_rate || 18.0,
      min_stock_level: p.min_stock_level || 10,
      description: p.description || '',
      tasting_notes: p.tasting_notes || '',
      food_pairing: p.food_pairing || ''
    });
    setEditingProduct(p);
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.selling_price) {
      addToast('Name and Selling Price are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
        addToast('Wine product updated successfully!', 'success');
      } else {
        await api.createProduct(formData);
        addToast('New wine added to catalog & initialized across all branches!', 'success');
      }
      setShowAddModal(false);
      loadCatalog();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openBranchStockDetail = async (pId) => {
    try {
      const res = await api.getProduct(pId);
      if (res.success) {
        setStockDetailModal(res);
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
            <Wine className="w-6 h-6 text-wine-400" />
            Wine Catalog & Master Inventory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage fine wines, spirits, vintages, tasting notes, grape varietals, pricing, and multi-branch stocks.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-gradient-to-r from-wine-700 to-wine-800 hover:from-wine-600 hover:to-wine-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs shadow-lg flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>Add Wine to Catalog</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search wine, vintage, region, SKU..."
            className="w-full bg-slate-800 border border-slate-700 text-xs rounded-xl pl-9 pr-3 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="Red">Red Wine</option>
            <option value="White">White Wine</option>
            <option value="Sparkling">Champagne & Sparkling</option>
            <option value="Rosé">Rosé Wine</option>
            <option value="Fortified">Fortified & Port</option>
            <option value="Accessories">Accessories</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 border-b border-slate-700/80 uppercase font-semibold tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Wine / SKU</th>
                <th className="py-3.5 px-4">Type & Varietal</th>
                <th className="py-3.5 px-4">Region / Vintage</th>
                <th className="py-3.5 px-4 text-right">Cost Price</th>
                <th className="py-3.5 px-4 text-right">Retail Price</th>
                <th className="py-3.5 px-4 text-center">Stock ({selectedBranchId === 'all' ? 'All' : 'Branch'})</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    Loading catalog items...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    No wines found matching your search.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const stock = selectedBranchId === 'all' ? p.total_stock : p.branch_stock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white text-sm block">{p.name}</span>
                        <span className="text-[10px] text-amber-300 font-mono">SKU: {p.sku}</span>
                        <span className="text-[10px] text-slate-400 ml-2">Size: {p.bottle_size} ({p.abv}%)</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                          p.wine_type === 'Red' ? 'bg-red-950 text-red-300 border border-red-800/50' :
                          p.wine_type === 'White' ? 'bg-amber-950 text-amber-200 border border-amber-800/50' :
                          p.wine_type === 'Sparkling' ? 'bg-yellow-950 text-yellow-300 border border-yellow-800/50' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {p.wine_type}
                        </span>
                        <span className="block text-[11px] text-slate-300 mt-1">{p.varietal}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-200">{p.region || '—'}, {p.country}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">Vintage: {p.vintage_year || 'NV'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                        {formatCurrency(p.cost_price)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-300">
                        {formatCurrency(p.selling_price)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => openBranchStockDetail(p.id)}
                          className={`font-bold px-2.5 py-1 rounded-full text-xs transition-colors ${
                            stock <= 0
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : stock <= p.min_stock_level
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                          title="Click to view breakdown across all branches"
                        >
                          {stock} bottles
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => openBranchStockDetail(p.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="View Branch Stock Breakdown"
                        >
                          <Boxes className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Edit Wine Details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT WINE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                <Wine className="w-5 h-5 text-amber-400" />
                {editingProduct ? 'Edit Wine Details' : 'Add New Wine / Spirit to Master Catalog'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">Wine / Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Château Margaux Premier Grand Cru Classé"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">SKU Code *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingProduct}
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Wine Type</label>
                  <select
                    value={formData.wine_type}
                    onChange={(e) => setFormData({ ...formData, wine_type: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="Red">Red Wine</option>
                    <option value="White">White Wine</option>
                    <option value="Sparkling">Sparkling / Champagne</option>
                    <option value="Rosé">Rosé Wine</option>
                    <option value="Fortified">Fortified / Port</option>
                    <option value="Dessert">Dessert & Ice Wine</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Grape Varietal</label>
                  <input
                    type="text"
                    value={formData.varietal}
                    onChange={(e) => setFormData({ ...formData, varietal: e.target.value })}
                    placeholder="e.g. Cabernet Sauvignon"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Vintage Year</label>
                  <input
                    type="number"
                    min="1900"
                    max="2099"
                    value={formData.vintage_year || ''}
                    onChange={(e) => setFormData({ ...formData, vintage_year: e.target.value ? Number(e.target.value) : null })}
                    placeholder="2020 or blank for NV"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Region / Appellation</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="e.g. Bordeaux"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g. France"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Bottle Size</label>
                  <select
                    value={formData.bottle_size}
                    onChange={(e) => setFormData({ ...formData, bottle_size: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="750ml">750ml Standard</option>
                    <option value="375ml">375ml Half Bottle</option>
                    <option value="1.5L">1.5L Magnum</option>
                    <option value="3.0L">3.0L Double Magnum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">ABV (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.abv}
                    onChange={(e) => setFormData({ ...formData, abv: Number(e.target.value) })}
                    placeholder="13.5"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Pricing & Stock Levels */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-amber-300 mb-1 font-medium">Retail Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-800 border border-amber-500/50 rounded-xl px-3 py-2 text-amber-300 font-bold focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: Number(e.target.value) })}
                    placeholder="18.0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Min Stock Alert</label>
                  <input
                    type="number"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: Number(e.target.value) })}
                    placeholder="10"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Tasting Notes */}
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Sommelier Tasting Notes</label>
                <textarea
                  rows="2"
                  value={formData.tasting_notes}
                  onChange={(e) => setFormData({ ...formData, tasting_notes: e.target.value })}
                  placeholder="Aromas of cassis, dark plum, French oak vanilla, silky finish..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-wine-700 hover:bg-wine-600 text-white font-semibold flex items-center gap-1.5 shadow-md"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingProduct ? 'Save Changes' : 'Add to Catalog'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MULTI-BRANCH STOCK BREAKDOWN MODAL */}
      {stockDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-white">
                  {stockDetailModal.product?.name}
                </h3>
                <p className="text-xs text-amber-300 font-mono">SKU: {stockDetailModal.product?.sku}</p>
              </div>
              <button onClick={() => setStockDetailModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Live bottle count and cellar rack bin locations across all outlets:
            </p>

            <div className="space-y-2">
              {stockDetailModal.branchStocks?.map(bs => (
                <div key={bs.branch_id} className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white block">{bs.branch_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Location: {bs.rack_location}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold font-mono ${
                      bs.quantity <= 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {bs.quantity} bottles
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      Val: {formatCurrency(bs.quantity * stockDetailModal.product.cost_price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setStockDetailModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
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
