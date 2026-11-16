/**
 * FarmerManagement — Admin only
 * List all farmers + Register new farmer + Edit farmer details
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, Plus, Search, Edit2, X, Loader2, AlertCircle, CheckCircle,
  Phone, MapPin, Layers, Mail, User, ChevronDown, ChevronUp,
} from 'lucide-react';
import { BASE_URL, getAdminToken } from '../services/aquagrowApi';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Farmer {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  location?: string;
  farmSize?: number;
  createdAt?: string;
}

interface FarmerForm {
  name: string;
  phoneNumber: string;
  email: string;
  location: string;
  farmSize: string;
  password: string;
}

const EMPTY_FORM: FarmerForm = { name: '', phoneNumber: '', email: '', location: '', farmSize: '', password: '' };

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
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any).error || `HTTP ${res.status}`);
  return json as T;
}

const fetchFarmers = (q?: string): Promise<Farmer[]> =>
  apiFetch(`/farmers${q ? `?q=${encodeURIComponent(q)}` : '?limit=200'}`);
const registerFarmer = (data: Partial<FarmerForm>): Promise<Farmer> =>
  apiFetch('/farmers', { method: 'POST', body: JSON.stringify(data) });
const updateFarmer = (id: string, data: Partial<FarmerForm>): Promise<Farmer> =>
  apiFetch(`/farmers/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// ─── Components ───────────────────────────────────────────────────────────────
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-semibold text-zinc-400 mb-1">{label}</label>
    {children}
  </div>
);

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition';

// ─── Modal ───────────────────────────────────────────────────────────────────
interface ModalProps {
  mode: 'register' | 'edit';
  farmer?: Farmer;
  onClose: () => void;
  onSaved: (f: Farmer) => void;
}

const FarmerModal: React.FC<ModalProps> = ({ mode, farmer, onClose, onSaved }) => {
  const [form, setForm] = useState<FarmerForm>(
    mode === 'edit' && farmer
      ? { name: farmer.name, phoneNumber: farmer.phoneNumber, email: farmer.email || '', location: farmer.location || '', farmSize: farmer.farmSize?.toString() || '', password: '' }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FarmerForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim() || undefined,
        location: form.location.trim() || undefined,
        farmSize: form.farmSize ? Number(form.farmSize) : 0,
      };
      if (mode === 'register') payload.password = form.password.trim() || form.phoneNumber.trim();
      const saved = mode === 'register'
        ? await registerFarmer(payload)
        : await updateFarmer(farmer!._id, payload);
      onSaved(saved);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              {mode === 'register' ? <Plus size={16} className="text-emerald-400" /> : <Edit2 size={16} className="text-blue-400" />}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{mode === 'register' ? 'Register Farmer' : 'Edit Farmer'}</p>
              <p className="text-xs text-zinc-500">{mode === 'register' ? 'Add a new farmer account' : farmer?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/8 transition">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />{error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name *">
              <input className={inputCls} placeholder="Ravi Kumar" value={form.name} onChange={set('name')} required />
            </Field>
            <Field label="Phone Number *">
              <input className={inputCls} placeholder="9876543210" value={form.phoneNumber} onChange={set('phoneNumber')} required />
            </Field>
          </div>

          <Field label="Email">
            <input className={inputCls} type="email" placeholder="farmer@example.com" value={form.email} onChange={set('email')} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Location / Village">
              <input className={inputCls} placeholder="Nellore" value={form.location} onChange={set('location')} />
            </Field>
            <Field label="Farm Size (acres)">
              <input className={inputCls} type="number" min="0" step="0.5" placeholder="2.5" value={form.farmSize} onChange={set('farmSize')} />
            </Field>
          </div>

          {mode === 'register' && (
            <Field label="Password (default: phone number)">
              <input className={inputCls} type="password" placeholder="Leave blank to use phone as password" value={form.password} onChange={set('password')} />
            </Field>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 bg-white/5 hover:bg-white/10 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Saving…' : mode === 'register' ? 'Register Farmer' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const FarmerManagement: React.FC = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ mode: 'register' | 'edit'; farmer?: Farmer } | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [sortField, setSortField] = useState<'name' | 'createdAt'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const data = await fetchFarmers(q);
      setFarmers(data);
    } catch {
      showToast('Failed to load farmers', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(search || undefined), 350);
    return () => clearTimeout(t);
  }, [search, load]);

  const handleSaved = (saved: Farmer) => {
    setFarmers(prev => {
      const idx = prev.findIndex(f => f._id === saved._id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    setModal(null);
    showToast(modal?.mode === 'register' ? 'Farmer registered successfully' : 'Farmer updated');
  };

  const sorted = [...farmers].sort((a, b) => {
    const av = sortField === 'name' ? a.name : (a.createdAt || '');
    const bv = sortField === 'name' ? b.name : (b.createdAt || '');
    return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const toggleSort = (f: 'name' | 'createdAt') => {
    if (sortField === f) setSortAsc(a => !a);
    else { setSortField(f); setSortAsc(true); }
  };

  const SortIcon = ({ field }: { field: 'name' | 'createdAt' }) =>
    sortField === field
      ? (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
      : null;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold text-white ${toast.ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {toast.msg}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <FarmerModal
          mode={modal.mode}
          farmer={modal.farmer}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users size={22} className="text-emerald-400" /> Farmer Register
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">{farmers.length} farmers registered</p>
        </div>
        <button
          onClick={() => setModal({ mode: 'register' })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition shadow-lg shadow-emerald-500/20"
        >
          <Plus size={16} /> Register Farmer
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500/50 transition"
          placeholder="Search by name or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/8 text-xs font-bold uppercase tracking-widest text-zinc-500">
          <button className="col-span-3 flex items-center gap-1 hover:text-zinc-300 transition text-left" onClick={() => toggleSort('name')}>
            Farmer <SortIcon field="name" />
          </button>
          <div className="col-span-2">Phone</div>
          <div className="col-span-2">Location</div>
          <div className="col-span-2">Farm Size</div>
          <button className="col-span-2 flex items-center gap-1 hover:text-zinc-300 transition" onClick={() => toggleSort('createdAt')}>
            Registered <SortIcon field="createdAt" />
          </button>
          <div className="col-span-1 text-right">Edit</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-emerald-400" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
            <User size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">{search ? 'No farmers match your search' : 'No farmers registered yet'}</p>
            {!search && (
              <button onClick={() => setModal({ mode: 'register' })} className="mt-3 text-emerald-400 text-sm hover:underline">
                Register first farmer →
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {sorted.map(farmer => (
              <div key={farmer._id} className="grid grid-cols-12 gap-2 px-4 py-3.5 items-center hover:bg-white/3 transition text-sm">
                {/* Name + email */}
                <div className="col-span-3 min-w-0">
                  <p className="font-semibold text-white truncate">{farmer.name}</p>
                  {farmer.email && <p className="text-xs text-zinc-500 truncate">{farmer.email}</p>}
                </div>
                {/* Phone */}
                <div className="col-span-2 flex items-center gap-1.5 text-zinc-300">
                  <Phone size={12} className="text-zinc-600 shrink-0" />
                  <span className="text-xs font-mono">{farmer.phoneNumber}</span>
                </div>
                {/* Location */}
                <div className="col-span-2 flex items-center gap-1.5 text-zinc-400 text-xs">
                  <MapPin size={12} className="text-zinc-600 shrink-0" />
                  {farmer.location || <span className="text-zinc-700">—</span>}
                </div>
                {/* Farm size */}
                <div className="col-span-2 flex items-center gap-1.5 text-zinc-400 text-xs">
                  <Layers size={12} className="text-zinc-600 shrink-0" />
                  {farmer.farmSize ? `${farmer.farmSize} ac` : <span className="text-zinc-700">—</span>}
                </div>
                {/* Date */}
                <div className="col-span-2 text-xs text-zinc-500">
                  {farmer.createdAt ? new Date(farmer.createdAt).toLocaleDateString('en-IN') : '—'}
                </div>
                {/* Edit */}
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => setModal({ mode: 'edit', farmer })}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition"
                    title="Edit farmer"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerManagement;
