/**
 * ShopStaffManagement.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Owner-only page: register, edit, activate/deactivate shop staff.
 * Connects to real backend endpoints:
 *   GET  /api/staff          → list all staff
 *   POST /api/staff          → create staff (name, mobile, loginId, password, role, shopId)
 *   PUT  /api/staff/:id      → update staff (name, mobile, role, shopId, isActive)
 *   POST /api/staff/:id/reset-password → trigger password reset
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Search, Edit2, Power, Key, Eye, EyeOff,
  X, AlertTriangle, CheckCircle2, Clock, Shield, Store,
  RefreshCw, ChevronDown, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BASE_URL, getAdminToken } from '../services/aquagrowApi';

// ─── Types ───────────────────────────────────────────────────────────────────
type StaffRole = 'stock_staff' | 'billing_staff' | 'shop_manager' | 'owner';

interface StaffMember {
  _id: string;
  name: string;
  mobile: string;
  loginId: string;
  role: StaffRole;
  shopId?: string;
  shopName?: string;
  isActive: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
  lastLogin?: string;
  createdBy?: string;
}

interface CreateStaffForm {
  name: string;
  mobile: string;
  loginId: string;
  password: string;
  role: StaffRole;
  shopId: string;
}

interface UpdateStaffForm {
  name: string;
  mobile: string;
  role: StaffRole;
  shopId: string;
  isActive: boolean;
}

// ─── API helpers ──────────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok) throw new Error((json as any).error || `Request failed: ${res.status}`);
  return json as T;
}

const fetchStaff        = ()                       => apiFetch<StaffMember[]>('/staff');
const createStaff       = (d: CreateStaffForm)     => apiFetch<StaffMember>('/staff', { method: 'POST', body: JSON.stringify(d) });
const updateStaff       = (id: string, d: UpdateStaffForm) => apiFetch<StaffMember>(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(d) });
const toggleActive      = (id: string, isActive: boolean) => apiFetch<StaffMember>(`/staff/${id}`, { method: 'PUT', body: JSON.stringify({ isActive }) });
const resetPassword     = (id: string, newPassword: string) => apiFetch(`/staff/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) });

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<StaffRole, string> = {
  stock_staff:   'Stock Staff',
  billing_staff: 'Billing Staff',
  shop_manager:  'Shop Manager',
  owner:         'Owner',
};

const ROLE_COLORS: Record<StaffRole, string> = {
  stock_staff:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
  billing_staff: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  shop_manager:  'bg-purple-500/15 text-purple-400 border-purple-500/30',
  owner:         'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

const ROLE_PERMISSIONS: Record<StaffRole, string[]> = {
  stock_staff:   ['Stock inward entry', 'Product stock lookup', 'Physical stock counting'],
  billing_staff: ['Approved selling-price lookup', 'Farmer billing', 'Payment receipts', 'Farmer statements'],
  shop_manager:  ['All Stock Staff permissions', 'All Billing Staff permissions', 'Daily sales review', 'Day-close submission', 'Harvest draft entry'],
  owner:         ['Staff management', 'Purchase costing', 'Selling price & discounts', 'Profit/margin reports', 'Stock adjustments', 'Day-close approval', 'Culture settlements'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const initials = (name: string) =>
  name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);

const avatarBg = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-teal-500', 'bg-rose-500'];
const avBg = (name: string) => avatarBg[name.charCodeAt(0) % avatarBg.length];

const fmtDate = (s?: string) => {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Inline Spinner ───────────────────────────────────────────────────────────
const Spinner = () => <Loader2 size={16} className="animate-spin" />;

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
const StaffModal = ({
  mode,
  staff,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit';
  staff: StaffMember | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const isEdit = mode === 'edit';

  const [form, setForm] = useState<CreateStaffForm>({
    name:     staff?.name     ?? '',
    mobile:   staff?.mobile   ?? '',
    loginId:  staff?.loginId  ?? '',
    password: '',
    role:     (staff?.role as StaffRole) ?? 'stock_staff',
    shopId:   staff?.shopId   ?? '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const set = (k: keyof CreateStaffForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim())    return setError('Name is required');
    if (!form.loginId.trim()) return setError('Login ID is required');
    if (!isEdit && !form.password) return setError('Password is required for new staff');
    if (!isEdit && form.password.length < 8) return setError('Password must be at least 8 characters');
    setError(null);
    setLoading(true);
    try {
      if (isEdit && staff) {
        await updateStaff(staff._id, {
          name:     form.name,
          mobile:   form.mobile,
          role:     form.role,
          shopId:   form.shopId,
          isActive: staff.isActive,
        });
      } else {
        await createStaff(form);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to save staff member');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-zinc-600';
  const labelCls = 'block text-[10px] text-zinc-500 uppercase font-bold mb-1.5 tracking-wider';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
          className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <UserPlus size={16} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base">{isEdit ? 'Edit Staff Member' : 'Register New Staff'}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{isEdit ? 'Update details & role' : 'Create account with secure password'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 transition-colors"><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                <AlertTriangle size={13} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="md:col-span-2">
                <label className={labelCls}>Full Name *</label>
                <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Ravi Kumar" className={inputCls} required />
              </div>

              {/* Mobile */}
              <div>
                <label className={labelCls}>Mobile Number</label>
                <input type="tel" value={form.mobile} onChange={set('mobile')} placeholder="9876543210" className={inputCls} />
              </div>

              {/* Login ID */}
              <div>
                <label className={labelCls}>Login Identifier *</label>
                <input
                  type="text" value={form.loginId} onChange={set('loginId')}
                  placeholder="Username or phone"
                  className={inputCls}
                  disabled={isEdit}
                  title={isEdit ? 'Login ID cannot be changed after creation' : ''}
                  required
                />
              </div>

              {/* Password — only on create */}
              {!isEdit && (
                <div className="md:col-span-2">
                  <label className={labelCls}>Initial Password * <span className="text-zinc-600 normal-case">(min 8 chars — staff must change on first login)</span></label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password} onChange={set('password')}
                      placeholder="••••••••"
                      className={`${inputCls} pr-11`}
                      required
                    />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Role */}
              <div>
                <label className={labelCls}>Role *</label>
                <div className="relative">
                  <select value={form.role} onChange={set('role')} className={`${inputCls} appearance-none`}>
                    {(Object.entries(ROLE_LABELS) as [StaffRole, string][])
                      .filter(([r]) => r !== 'owner')
                      .map(([r, l]) => (
                        <option key={r} value={r} className="bg-zinc-900">{l}</option>
                      ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Shop */}
              <div>
                <label className={labelCls}>Shop / Branch ID</label>
                <input type="text" value={form.shopId} onChange={set('shopId')} placeholder="shop_001" className={inputCls} />
              </div>
            </div>

            {/* Permission preview */}
            {form.role && (
              <div className="p-4 rounded-xl bg-white/3 border border-white/8">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Permissions for {ROLE_LABELS[form.role]}</p>
                <ul className="space-y-1">
                  {ROLE_PERMISSIONS[form.role].map(p => (
                    <li key={p} className="flex items-center gap-2 text-xs text-zinc-400">
                      <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary text-sm px-5 py-2.5">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-50">
                {loading ? <Spinner /> : (isEdit ? <Edit2 size={14} /> : <UserPlus size={14} />)}
                {isEdit ? 'Save Changes' : 'Register Staff'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Reset Password Modal ─────────────────────────────────────────────────────
const ResetPasswordModal = ({ staff, onClose, onDone }: { staff: StaffMember; onClose: () => void; onDone: () => void }) => {
  const [newPw, setNewPw]   = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [done, setDone]     = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) return setError('Password must be at least 8 characters');
    setError(null);
    setLoading(true);
    try {
      await resetPassword(staff._id, newPw);
      setDone(true);
      setTimeout(() => { onDone(); onClose(); }, 1500);
    } catch (err: any) {
      setError(err.message ?? 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-sm"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Key size={16} className="text-amber-400" />
              <h3 className="font-display font-bold">Reset Password</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/5 text-zinc-500"><X size={16} /></button>
          </div>
          <form onSubmit={handleReset} className="p-5 space-y-4">
            <p className="text-xs text-zinc-400">
              Set a new password for <span className="text-white font-semibold">{staff.name}</span>.
              They will be required to change it on next login.
            </p>
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertTriangle size={12} /> {error}
              </div>
            )}
            {done && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                <CheckCircle2 size={12} /> Password reset successfully!
              </div>
            )}
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={newPw} onChange={e => setNewPw(e.target.value)}
                placeholder="New password (min 8 chars)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-11 text-sm text-zinc-100 outline-none focus:border-amber-500/60 transition-all"
                required minLength={8}
              />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 py-2">Cancel</button>
              <button type="submit" disabled={loading || done}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-900 text-xs font-bold transition-colors disabled:opacity-50">
                {loading ? <Spinner /> : <Key size={13} />}
                Reset Password
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ShopStaffManagement: React.FC = () => {
  const [staff, setStaff]       = useState<StaffMember[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');
  const [showModal, setShowModal]   = useState(false);
  const [editStaff, setEditStaff]   = useState<StaffMember | null>(null);
  const [resetTarget, setResetTarget] = useState<StaffMember | null>(null);
  const [togglingId, setTogglingId]   = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStaff();
      setStaff(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleActive = async (member: StaffMember) => {
    setTogglingId(member._id);
    try {
      await toggleActive(member._id, !member.isActive);
      showToast(`${member.name} ${!member.isActive ? 'activated' : 'deactivated'}`);
      await load();
    } catch (err: any) {
      showToast(err.message ?? 'Failed to update status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = staff.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.loginId.toLowerCase().includes(search.toLowerCase()) ||
      (s.mobile || '').includes(search);
    const matchRole = roleFilter === 'all' || s.role === roleFilter;
    return matchSearch && matchRole;
  });

  const stats = {
    total:   staff.length,
    active:  staff.filter(s => s.isActive).length,
    inactive: staff.filter(s => !s.isActive).length,
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold shadow-xl ${
              toast.type === 'success'
                ? 'bg-emerald-500/90 text-white'
                : 'bg-red-500/90 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Shield size={15} className="text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Owner Access</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Shop Staff Management</h1>
          <p className="text-zinc-400 text-sm">Register staff, assign roles and shop access, activate or deactivate accounts.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={() => { setEditStaff(null); setShowModal(true); }} className="btn-primary flex items-center gap-2 text-sm">
            <UserPlus size={15} />
            Register Staff
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Staff',   value: stats.total,    color: 'text-zinc-100',    icon: <Users size={16} /> },
          { label: 'Active',        value: stats.active,   color: 'text-emerald-400', icon: <CheckCircle2 size={16} /> },
          { label: 'Inactive',      value: stats.inactive, color: 'text-red-400',     icon: <Power size={16} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="glass-panel p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{label}</p>
              <span className={color}>{icon}</span>
            </div>
            <p className={`text-3xl font-display font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters + Table */}
      <div className="glass-panel overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-white/5 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-white/4 border border-white/8 rounded-xl px-3 py-2">
            <Search size={13} className="text-zinc-500 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, login ID, or mobile…"
              className="bg-transparent text-sm text-zinc-100 outline-none flex-1 placeholder:text-zinc-600"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none"
          >
            <option value="all" className="bg-zinc-900">All Roles</option>
            {(Object.entries(ROLE_LABELS) as [StaffRole, string][]).map(([r, l]) => (
              <option key={r} value={r} className="bg-zinc-900">{l}</option>
            ))}
          </select>
        </div>

        {/* Error state */}
        {error && (
          <div className="p-8 text-center">
            <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-bold mb-1">Failed to load staff</p>
            <p className="text-zinc-500 text-sm mb-4">{error}</p>
            <button onClick={load} className="btn-secondary text-sm">Try Again</button>
          </div>
        )}

        {/* Loading state */}
        {loading && !error && (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">Loading staff…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="p-12 text-center">
            <Users size={40} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-bold mb-1">
              {staff.length === 0 ? 'No staff registered yet' : 'No staff match your filters'}
            </p>
            <p className="text-zinc-600 text-sm mb-4">
              {staff.length === 0 ? 'Register your first staff member to get started.' : 'Try adjusting your search or role filter.'}
            </p>
            {staff.length === 0 && (
              <button onClick={() => { setEditStaff(null); setShowModal(true); }} className="btn-primary text-sm">
                Register First Staff Member
              </button>
            )}
          </div>
        )}

        {/* Staff list */}
        {!loading && !error && filtered.length > 0 && (
          <div className="divide-y divide-white/5">
            {filtered.map((member, i) => (
              <motion.div
                key={member._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="p-5 flex items-center gap-4 hover:bg-white/2 transition-all"
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl ${avBg(member.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {initials(member.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-zinc-100">{member.name}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${ROLE_COLORS[member.role]}`}>
                      {ROLE_LABELS[member.role]}
                    </span>
                    {member.mustChangePassword && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/30">
                        Must Change Password
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-[10px] text-zinc-500 font-mono">{member.loginId}</p>
                    {member.mobile && <p className="text-[10px] text-zinc-600">{member.mobile}</p>}
                    {member.shopId && (
                      <p className="text-[10px] text-zinc-600 flex items-center gap-1">
                        <Store size={9} /> {member.shopId}
                      </p>
                    )}
                  </div>
                </div>

                {/* Last login */}
                <div className="hidden md:block text-right shrink-0">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Last Login</p>
                  <p className="text-xs text-zinc-400 flex items-center gap-1 justify-end mt-0.5">
                    <Clock size={10} />
                    {fmtDate(member.lastLogin)}
                  </p>
                </div>

                {/* Status */}
                <div className="shrink-0">
                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                    member.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Edit */}
                  <button
                    title="Edit"
                    onClick={() => { setEditStaff(member); setShowModal(true); }}
                    className="p-2 rounded-xl hover:bg-white/8 text-zinc-500 hover:text-zinc-200 transition-colors"
                  >
                    <Edit2 size={15} />
                  </button>

                  {/* Reset password */}
                  <button
                    title="Reset Password"
                    onClick={() => setResetTarget(member)}
                    className="p-2 rounded-xl hover:bg-amber-500/10 text-zinc-500 hover:text-amber-400 transition-colors"
                  >
                    <Key size={15} />
                  </button>

                  {/* Toggle active */}
                  <button
                    title={member.isActive ? 'Deactivate Account' : 'Activate Account'}
                    onClick={() => handleToggleActive(member)}
                    disabled={togglingId === member._id}
                    className={`p-2 rounded-xl transition-colors disabled:opacity-50 ${
                      member.isActive
                        ? 'hover:bg-red-500/10 text-zinc-500 hover:text-red-400'
                        : 'hover:bg-emerald-500/10 text-zinc-500 hover:text-emerald-400'
                    }`}
                  >
                    {togglingId === member._id ? <Spinner /> : <Power size={15} />}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer row count */}
        {!loading && !error && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-white/5">
            <p className="text-[10px] text-zinc-600">Showing {filtered.length} of {staff.length} staff members</p>
          </div>
        )}
      </div>

      {/* Role Permission Guide */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield size={16} className="text-emerald-400" />
          <h3 className="font-display font-bold text-sm">Permission Groups Reference</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.entries(ROLE_LABELS) as [StaffRole, string][]).map(([role, label]) => (
            <div key={role} className="p-4 rounded-xl bg-white/3 border border-white/8">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border mb-3 inline-block ${ROLE_COLORS[role]}`}>
                {label}
              </span>
              <ul className="space-y-1.5">
                {ROLE_PERMISSIONS[role].map(p => (
                  <li key={p} className="flex items-start gap-1.5 text-[10px] text-zinc-500">
                    <CheckCircle2 size={10} className="text-emerald-600 shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <StaffModal
          mode={editStaff ? 'edit' : 'create'}
          staff={editStaff}
          onClose={() => { setShowModal(false); setEditStaff(null); }}
          onSaved={() => { load(); showToast(editStaff ? 'Staff updated' : 'Staff registered'); }}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          staff={resetTarget}
          onClose={() => setResetTarget(null)}
          onDone={() => showToast('Password reset — staff must change on next login')}
        />
      )}
    </div>
  );
};

export default ShopStaffManagement;
