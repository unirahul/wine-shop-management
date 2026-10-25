import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Store,
  Warehouse,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle,
  X,
  Boxes,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

export default function Branches() {
  const { branches, fetchBranches, formatCurrency, addToast, setSelectedBranchId, selectedBranchId } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [forceDelete, setForceDelete] = useState(false);

  const [form, setForm] = useState({
    code: '',
    name: '',
    type: 'Retail Store & Tasting Lounge',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    license_number: '',
    manager_name: '',
    is_warehouse: 0,
    is_active: 1
  });

  const handleOpenAdd = () => {
    const nextCode = `BR-0${branches.length + 1}`;
    setForm({
      code: nextCode,
      name: '',
      type: 'Retail Store & Tasting Lounge',
      address: '',
      city: '',
      state: 'NY',
      zip_code: '',
      phone: '',
      email: '',
      license_number: `LIQ-${Math.floor(100000 + Math.random() * 900000)}`,
      manager_name: '',
      is_warehouse: 0,
      is_active: 1
    });
    setEditingBranch(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (b) => {
    setForm({
      code: b.code,
      name: b.name,
      type: b.type || 'Retail Store',
      address: b.address || '',
      city: b.city || '',
      state: b.state || '',
      zip_code: b.zip_code || '',
      phone: b.phone || '',
      email: b.email || '',
      license_number: b.license_number || '',
      manager_name: b.manager_name || '',
      is_warehouse: b.is_warehouse ? 1 : 0,
      is_active: b.is_active !== undefined ? b.is_active : 1
    });
    setEditingBranch(b);
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.name) {
      addToast('Branch code and name are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingBranch) {
        await api.updateBranch(editingBranch.id, form);
        addToast(`Branch "${form.name}" updated successfully!`, 'success');
      } else {
        await api.createBranch(form);
        addToast(`New wine branch "${form.name}" created and inventory initialized across all catalog wines!`, 'success');
      }
      setShowAddModal(false);
      fetchBranches();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      const res = await api.deleteBranch(deleteModal.id, forceDelete);
      if (res.success) {
        addToast(res.message, res.deactivated ? 'info' : 'success');
        if (selectedBranchId === deleteModal.id) {
          setSelectedBranchId('all');
        }
        setDeleteModal(null);
        setForceDelete(false);
        fetchBranches();
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            Wine Shop Outlets & Warehouse Hubs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Add new retail wine branches, edit location and license details, manage active status, and safely delete or deactivate outlets.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-wine-700 hover:bg-wine-600 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Wine Branch</span>
        </button>
      </div>

      {/* Guide Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-white">How Branch Management Works:</p>
            <p className="text-slate-400 text-[11px]">
              • <strong>Add Branch:</strong> Creates the outlet and automatically stocks initial cellar inventory records for all wines.
              <br />
              • <strong>Edit Branch:</strong> Update store name, liquor license, manager, or mark active/inactive.
              <br />
              • <strong>Delete Branch:</strong> Safely deletes unused branches, or soft-deactivates branches with existing invoices to protect accounting audits.
            </p>
          </div>
        </div>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(b => (
          <div
            key={b.id}
            className={`rounded-2xl p-6 border transition-all flex flex-col justify-between shadow-xl ${
              !b.is_active
                ? 'bg-slate-900/60 border-slate-800 opacity-60'
                : b.is_warehouse
                ? 'bg-gradient-to-br from-slate-900 via-sky-950/20 to-slate-900 border-sky-800/40 hover:border-sky-700'
                : 'bg-gradient-to-br from-slate-900 via-wine-950/20 to-slate-900 border-wine-800/40 hover:border-wine-700'
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    b.is_warehouse
                      ? 'bg-sky-950 text-sky-300 border border-sky-800'
                      : 'bg-wine-950 text-wine-300 border border-wine-800'
                  }`}>
                    {b.is_warehouse ? <Warehouse className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                    {b.is_warehouse ? 'Distribution Hub' : 'Retail Cellar'}
                  </span>

                  {!b.is_active && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800">
                      Deactivated
                    </span>
                  )}
                </div>

                <span className="text-xs font-mono font-bold text-amber-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {b.code}
                </span>
              </div>

              <h2 className="font-serif font-bold text-lg text-white leading-snug">
                {b.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">{b.type}</p>

              <div className="mt-4 space-y-2 text-xs text-slate-300">
                <p className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{b.address ? `${b.address}, ${b.city} ${b.state}` : 'Address on file'}</span>
                </p>
                <p className="flex items-center gap-2 text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{b.phone || 'No phone'}</span>
                </p>
                <p className="flex items-center gap-2 text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-mono text-[11px]">Lic: {b.license_number || 'LL-PENDING'}</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Store Sommelier / Lead: <span className="text-slate-200 font-semibold">{b.manager_name || 'Assigned Sommelier'}</span>
                </p>
              </div>
            </div>

            {/* Performance and Actions footer */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/60 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Stock on Hand</span>
                  <span className="font-bold font-mono text-white text-sm">{b.total_stock_bottles || 0} btls</span>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Lifetime Revenue</span>
                  <span className="font-bold font-mono text-emerald-400 text-sm">{formatCurrency(b.total_sales_revenue)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedBranchId(b.id)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold py-1.5 rounded-xl text-xs transition-colors"
                >
                  Switch to this Outlet
                </button>
                <button
                  onClick={() => handleOpenEdit(b)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs transition-colors"
                  title="Edit Branch Information"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteModal(b)}
                  className="px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900 border border-rose-800/50 text-rose-300 hover:text-white rounded-xl text-xs transition-colors"
                  title="Delete or Deactivate Branch"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT BRANCH MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                {editingBranch ? `Edit Wine Branch: ${editingBranch.name}` : 'Add New Wine Store / Warehouse'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Branch Code *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingBranch}
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="BR-05"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold disabled:opacity-50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1">Outlet Display Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Sommelier Reserve - Hudson Yards"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Outlet Category</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Retail Store & Tasting Lounge">Retail Store & Tasting Lounge</option>
                    <option value="Boutique Waterfront Store">Boutique Waterfront Store</option>
                    <option value="Central Warehouse & Hub">Central Warehouse & Hub</option>
                    <option value="Airport Duty Free Cellar">Airport Duty Free Cellar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Is Central Warehouse?</label>
                  <select
                    value={form.is_warehouse}
                    onChange={(e) => setForm({ ...form, is_warehouse: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value={0}>No (Retail Store / Cellar)</option>
                    <option value={1}>Yes (Central Warehouse / Logistics)</option>
                  </select>
                </div>
              </div>

              {editingBranch && (
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">Outlet Status</span>
                    <span className="text-[11px] text-slate-400">Control whether this branch is open for new sales & purchases</span>
                  </div>
                  <select
                    value={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: Number(e.target.value) })}
                    className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs"
                  >
                    <option value={1}>Active (Open)</option>
                    <option value={0}>Inactive (Closed / Deactivated)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Street Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="e.g. 500 West 33rd Street"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="New York"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">State</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="NY"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Zip Code</label>
                  <input
                    type="text"
                    value={form.zip_code}
                    onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
                    placeholder="10001"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 212-555-0199"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Liquor License #</label>
                  <input
                    type="text"
                    value={form.license_number}
                    onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                    placeholder="NY-LIQ-99120"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Lead Sommelier / Manager Name</label>
                <input
                  type="text"
                  value={form.manager_name}
                  onChange={(e) => setForm({ ...form, manager_name: e.target.value })}
                  placeholder="e.g. Master Sommelier Paul Dupont"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-wine-700 hover:bg-wine-600 text-white font-bold rounded-xl flex items-center gap-1.5 shadow"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingBranch ? 'Save Changes' : 'Initialize Outlet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE / DEACTIVATE CONFIRMATION MODAL */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Delete or Deactivate Branch
              </h3>
              <button onClick={() => setDeleteModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-200">
                Are you sure you want to remove or deactivate{' '}
                <strong className="text-white">"{deleteModal.name}" ({deleteModal.code})</strong>?
              </p>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Stock on Hand:</span>
                  <span className="font-bold text-white font-mono">{deleteModal.total_stock_bottles || 0} bottles</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Sales Revenue:</span>
                  <span className="font-bold text-emerald-400 font-mono">{formatCurrency(deleteModal.total_sales_revenue)}</span>
                </div>
              </div>

              <div className="bg-amber-950/30 p-3 rounded-xl border border-amber-800/40 text-amber-200 space-y-1 text-[11px]">
                <p className="font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Accounting Ledger Protection:
                </p>
                <p className="text-slate-300">
                  If this branch has past sales invoices or purchase records, it will be <strong>safely deactivated</strong> (soft-deleted) so all financial statements and double-entry journals remain 100% accurate.
                </p>
              </div>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={forceDelete}
                  onChange={(e) => setForceDelete(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-[11px] text-rose-300">
                  Force Hard Delete (Permanently remove all branch records and inventory)
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting ? 'Processing...' : forceDelete ? 'Force Delete Branch' : 'Confirm Safe Delete / Deactivate'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
