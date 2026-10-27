import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Users as UsersIcon,
  UserPlus,
  ShieldCheck,
  Building2,
  Lock,
  Edit,
  Trash2,
  CheckCircle,
  X,
  KeyRound,
  Store,
  Phone,
  Mail,
  Search
} from 'lucide-react';

export default function Users() {
  const { branches, addToast } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('cashier');
  const [formBranchId, setFormBranchId] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      if (res.success) {
        setUsers(res.users || []);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormRole('cashier');
    setFormBranchId(branches[0]?.id || '');
    setFormPhone('');
    setFormEmail('');
    setModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormUsername(u.username);
    setFormPassword(''); // blank unless changing
    setFormRole(u.role);
    setFormBranchId(u.branch_id || '');
    setFormPhone(u.phone || '');
    setFormEmail(u.email || '');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim() || (!editingUser && !formUsername.trim())) {
      addToast('Please fill all required fields', 'error');
      return;
    }

    if (!editingUser && !formPassword.trim()) {
      addToast('Please enter a temporary password for new user', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, {
          name: formName,
          role: formRole,
          branch_id: formRole === 'admin' ? null : formBranchId,
          phone: formPhone,
          email: formEmail,
          password: formPassword.trim() || undefined
        });
        addToast(`Staff member "${formName}" updated successfully`);
      } else {
        await api.createUser({
          name: formName,
          username: formUsername,
          password: formPassword,
          role: formRole,
          branch_id: formRole === 'admin' ? null : formBranchId,
          phone: formPhone,
          email: formEmail
        });
        addToast(`New staff member "${formName}" created successfully`);
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (u.username === 'admin') {
      addToast('Primary Admin account cannot be deactivated', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to deactivate staff account "${u.name}" (${u.username})?`)) {
      return;
    }

    try {
      await api.deleteUser(u.id);
      addToast(`Account "${u.username}" deactivated`);
      fetchUsers();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.branch_name && u.branch_name.toLowerCase().includes(q)) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            Branch Staff & Cashier Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure branch-wise access, cashiers, store managers, and system administrators.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all transform active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Staff / Cashier</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name, username, branch, role..."
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Total Staff: <strong className="text-white">{users.length}</strong>
        </span>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 border-b border-slate-700/80 uppercase font-semibold tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Staff Name & Username</th>
                <th className="py-3.5 px-4">Assigned Branch Outlet</th>
                <th className="py-3.5 px-4">System Role</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    Loading staff members...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No staff users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-wine-900/60 border border-wine-700/40 flex items-center justify-center text-amber-300 font-bold text-xs shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{u.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">@{u.username}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg text-[11px] font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          All Outlets (Super Admin)
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-wine-400 shrink-0" />
                          <span className="font-medium text-slate-200">{u.branch_name || 'Unassigned'}</span>
                          {u.branch_code && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-400 font-mono rounded">
                              {u.branch_code}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : u.role === 'manager'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {u.role === 'admin' ? 'Super Admin' : u.role === 'manager' ? 'Branch Manager' : 'POS Cashier'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {u.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-500" /> {u.phone}</p>}
                      {u.email && <p className="flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3 text-slate-500" /> {u.email}</p>}
                      {!u.phone && !u.email && <span className="text-slate-600">—</span>}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.is_active
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit User or Reset Password"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Deactivate User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                {editingUser ? `Edit Staff: ${editingUser.name}` : 'Register New Staff / Cashier'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Jean-Luc Moreau, Victoria Sterling"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Username / Counter ID *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingUser)}
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="e.g. mumbai_cashier / bandra_pos"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>{editingUser ? 'New Password' : 'Password *'}</span>
                    {editingUser && <span className="text-[10px] text-slate-500">(Leave blank to keep)</span>}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={editingUser ? 'Enter to reset password' : 'Create secret password'}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Staff Role *
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="cashier">POS Cashier (Branch Locked)</option>
                    <option value="manager">Store / Cellar Manager</option>
                    <option value="admin">Super Admin (All Outlets)</option>
                  </select>
                </div>

                {formRole !== 'admin' && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Assigned Branch Outlet *
                    </label>
                    <select
                      value={formBranchId}
                      onChange={(e) => setFormBranchId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.code} - {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+1 555-0199"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="sommelier@grandcruwines.com"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs shadow-lg transition-all"
                >
                  {saving ? 'Saving...' : editingUser ? 'Update Staff Member' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
