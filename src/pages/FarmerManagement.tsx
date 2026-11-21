/**
 * FarmerManagement — Admin only
 *
 * TAB 1 — AquaGrow Mobile Farmers  (/api/farmers)
 *   Users registered via the AquaGrow mobile app (role=farmer in User collection).
 *   Can register new + edit. No delete (mobile accounts are managed by the app).
 *
 * TAB 2 — Shop ERP Farmers  (/api/shop/farmers)
 *   Farmers registered manually in the Shop ERP (ShopFarmer collection).
 *   Can register new + edit + DELETE.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, Plus, Search, Edit2, X, Loader2, AlertCircle, CheckCircle,
  Phone, MapPin, Layers, Mail, User, ChevronDown, ChevronUp, Trash2,
  Smartphone, Store, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BASE_URL, getAdminToken,
  fetchShopFarmers, createShopFarmer, updateShopFarmer, deleteShopFarmer,
  ShopFarmerRecord,
} from '../services/aquagrowApi';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AppFarmer {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  location?: string;
  farmSize?: number;
  createdAt?: string;
}

interface AppFarmerForm {
  name: string; phoneNumber: string; email: string;
  location: string; farmSize: string; password: string;
}
const EMPTY_APP_FORM: AppFarmerForm = { name: '', phoneNumber: '', email: '', location: '', farmSize: '', password: '' };

interface ShopFarmerForm {
  name: string; phoneNumber: string; email: string;
  address: string; village: string; district: string; notes: string;
}
const EMPTY_SHOP_FORM: ShopFarmerForm = { name: '', phoneNumber: '', email: '', address: '', village: '', district: '', notes: '' };

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

const fetchAppFarmers = (q?: string): Promise<AppFarmer[]> =>
  apiFetch(`/farmers${q ? `?q=${encodeURIComponent(q)}` : '?limit=200'}`);
const registerAppFarmer = (data: Partial<AppFarmerForm>): Promise<AppFarmer> =>
  apiFetch('/farmers', { method: 'POST', body: JSON.stringify(data) });
const updateAppFarmer = (id: string, data: Partial<AppFarmerForm>): Promise<AppFarmer> =>
  apiFetch(`/farmers/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// ─── Shared UI ────────────────────────────────────────────────────────────────
const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition';
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-semibold text-zinc-400 mb-1">{label}</label>
    {children}
  </div>
);

// ─── App Farmer Modal ─────────────────────────────────────────────────────────
const AppFarmerModal: React.FC<{
  mode: 'register' | 'edit'; farmer?: AppFarmer;
  onClose: () => void; onSaved: (f: AppFarmer) => void;
}> = ({ mode, farmer, onClose, onSaved }) => {
  const [form, setForm] = useState<AppFarmerForm>(
    mode === 'edit' && farmer
      ? { name: farmer.name, phoneNumber: farmer.phoneNumber, email: farmer.email || '', location: farmer.location || '', farmSize: farmer.farmSize?.toString() || '', password: '' }
      : EMPTY_APP_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof AppFarmerForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload: any = { name: form.name.trim(), phoneNumber: form.phoneNumber.trim(), email: form.email.trim() || undefined, location: form.location.trim() || undefined, farmSize: form.farmSize ? Number(form.farmSize) : 0 };
      if (mode === 'register') payload.password = form.password.trim() || form.phoneNumber.trim();
      const saved = mode === 'register' ? await registerAppFarmer(payload) : await updateAppFarmer(farmer!._id, payload);
      onSaved(saved);
    } catch (e: any) { setError(e.message || 'Failed to save'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              {mode === 'register' ? <Plus size={16} className="text-emerald-400" /> : <Edit2 size={16} className="text-blue-400" />}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{mode === 'register' ? 'Register AquaGrow Farmer' : 'Edit Farmer'}</p>
              <p className="text-xs text-zinc-500">{mode === 'register' ? 'Mobile app account' : farmer?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/8 transition"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"><AlertCircle size={15} className="shrink-0 mt-0.5" />{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name *"><input className={inputCls} placeholder="Ravi Kumar" value={form.name} onChange={set('name')} required /></Field>
            <Field label="Phone Number *"><input className={inputCls} placeholder="9876543210" value={form.phoneNumber} onChange={set('phoneNumber')} required /></Field>
          </div>
          <Field label="Email"><input className={inputCls} type="email" placeholder="farmer@example.com" value={form.email} onChange={set('email')} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location / Village"><input className={inputCls} placeholder="Nellore" value={form.location} onChange={set('location')} /></Field>
            <Field label="Farm Size (acres)"><input className={inputCls} type="number" min="0" step="0.5" placeholder="2.5" value={form.farmSize} onChange={set('farmSize')} /></Field>
          </div>
          {mode === 'register' && (
            <Field label="Password (default: phone number)">
              <input className={inputCls} type="password" placeholder="Leave blank to use phone as password" value={form.password} onChange={set('password')} />
            </Field>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 bg-white/5 hover:bg-white/10 transition">Cancel</button>
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

// ─── Shop Farmer Modal ────────────────────────────────────────────────────────
const ShopFarmerModal: React.FC<{
  mode: 'register' | 'edit'; farmer?: ShopFarmerRecord;
  onClose: () => void; onSaved: (f: ShopFarmerRecord) => void;
}> = ({ mode, farmer, onClose, onSaved }) => {
  const [form, setForm] = useState<ShopFarmerForm>(
    mode === 'edit' && farmer
      ? { name: farmer.name, phoneNumber: farmer.phoneNumber, email: farmer.email || '', address: farmer.address || '', village: farmer.village || '', district: farmer.district || '', notes: farmer.notes || '' }
      : EMPTY_SHOP_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof ShopFarmerForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { name: form.name.trim(), phoneNumber: form.phoneNumber.trim(), email: form.email.trim() || undefined, address: form.address.trim() || undefined, village: form.village.trim() || undefined, district: form.district.trim() || undefined, notes: form.notes.trim() || undefined };
      const saved = mode === 'register' ? await createShopFarmer(payload) : await updateShopFarmer(farmer!._id, payload);
      onSaved(saved);
    } catch (e: any) { setError(e.message || 'Failed to save'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center">
              {mode === 'register' ? <Plus size={16} className="text-blue-400" /> : <Edit2 size={16} className="text-blue-400" />}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{mode === 'register' ? 'Add Shop ERP Farmer' : 'Edit Shop Farmer'}</p>
              <p className="text-xs text-zinc-500">{mode === 'register' ? 'Walk-in / credit customer' : farmer?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/8 transition"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"><AlertCircle size={15} className="shrink-0 mt-0.5" />{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name *"><input className={inputCls} placeholder="Ravi Kumar" value={form.name} onChange={set('name')} required /></Field>
            <Field label="Phone Number *"><input className={inputCls} placeholder="9876543210" value={form.phoneNumber} onChange={set('phoneNumber')} required /></Field>
          </div>
          <Field label="Email"><input className={inputCls} type="email" placeholder="farmer@example.com" value={form.email} onChange={set('email')} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Village"><input className={inputCls} placeholder="Nellore" value={form.village} onChange={set('village')} /></Field>
            <Field label="District"><input className={inputCls} placeholder="Nellore District" value={form.district} onChange={set('district')} /></Field>
          </div>
          <Field label="Address"><input className={inputCls} placeholder="Door no., Street" value={form.address} onChange={set('address')} /></Field>
          <Field label="Notes">
            <textarea className={inputCls + ' resize-none'} rows={2} placeholder="Any notes about this customer…" value={form.notes} onChange={set('notes')} />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 bg-white/5 hover:bg-white/10 transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Saving…' : mode === 'register' ? 'Add Farmer' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────
const DeleteConfirm: React.FC<{
  farmer: ShopFarmerRecord; onCancel: () => void; onConfirm: () => void; deleting: boolean;
}> = ({ farmer, onCancel, onConfirm, deleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className="w-full max-w-sm bg-zinc-900 border border-red-500/30 rounded-2xl shadow-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
          <AlertTriangle size={20} className="text-red-400" />
        </div>
        <div>
          <p className="font-bold text-white">Delete Shop Farmer?</p>
          <p className="text-xs text-zinc-400 mt-0.5">This will deactivate the farmer record.</p>
        </div>
      </div>
      <div className="p-3 rounded-xl bg-white/5 border border-white/8 mb-5">
        <p className="font-semibold text-sm text-white">{farmer.name}</p>
        <p className="text-xs text-zinc-500">{farmer.phoneNumber}{farmer.village ? ` · ${farmer.village}` : ''}</p>
        {(farmer.totalCredit ?? 0) > 0 && (
          <p className="text-xs text-amber-400 mt-1 font-semibold">⚠ Outstanding credit: ₹{farmer.totalCredit}</p>
        )}
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 bg-white/5 hover:bg-white/10 transition">Cancel</button>
        <button onClick={onConfirm} disabled={deleting} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition">
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </motion.div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const FarmerManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'app' | 'shop'>('app');

  // ── Toast ──
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  // ════════════════════════════════════
  // TAB 1 — AquaGrow Mobile Farmers
  // ════════════════════════════════════
  const [appFarmers, setAppFarmers] = useState<AppFarmer[]>([]);
  const [appLoading, setAppLoading] = useState(true);
  const [appSearch, setAppSearch] = useState('');
  const [appModal, setAppModal] = useState<{ mode: 'register' | 'edit'; farmer?: AppFarmer } | null>(null);
  const [appSortField, setAppSortField] = useState<'name' | 'createdAt'>('name');
  const [appSortAsc, setAppSortAsc] = useState(true);

  const loadAppFarmers = useCallback(async (q?: string) => {
    setAppLoading(true);
    try { setAppFarmers(await fetchAppFarmers(q)); }
    catch { showToast('Failed to load app farmers', false); }
    finally { setAppLoading(false); }
  }, []);

  useEffect(() => { loadAppFarmers(); }, [loadAppFarmers]);
  useEffect(() => { const t = setTimeout(() => loadAppFarmers(appSearch || undefined), 350); return () => clearTimeout(t); }, [appSearch, loadAppFarmers]);

  const handleAppSaved = (saved: AppFarmer) => {
    setAppFarmers(prev => { const i = prev.findIndex(f => f._id === saved._id); if (i >= 0) { const n = [...prev]; n[i] = saved; return n; } return [saved, ...prev]; });
    setAppModal(null);
    showToast(appModal?.mode === 'register' ? 'Farmer registered' : 'Farmer updated');
  };

  const appSorted = [...appFarmers].sort((a, b) => {
    const av = appSortField === 'name' ? a.name : (a.createdAt || '');
    const bv = appSortField === 'name' ? b.name : (b.createdAt || '');
    return appSortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  // ════════════════════════════════════
  // TAB 2 — Shop ERP Farmers
  // ════════════════════════════════════
  const [shopFarmers, setShopFarmers] = useState<ShopFarmerRecord[]>([]);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopSearch, setShopSearch] = useState('');
  const [shopModal, setShopModal] = useState<{ mode: 'register' | 'edit'; farmer?: ShopFarmerRecord } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ShopFarmerRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [shopSortField, setShopSortField] = useState<'name' | 'createdAt'>('name');
  const [shopSortAsc, setShopSortAsc] = useState(true);

  const loadShopFarmers = useCallback(async (q?: string) => {
    setShopLoading(true);
    try { setShopFarmers(await fetchShopFarmers(q)); }
    catch { showToast('Failed to load shop farmers', false); }
    finally { setShopLoading(false); }
  }, []);

  useEffect(() => { if (activeTab === 'shop' && shopFarmers.length === 0 && !shopLoading) loadShopFarmers(); }, [activeTab]);
  useEffect(() => {
    if (activeTab !== 'shop') return;
    const t = setTimeout(() => loadShopFarmers(shopSearch || undefined), 350); return () => clearTimeout(t);
  }, [shopSearch, loadShopFarmers, activeTab]);

  const handleShopSaved = (saved: ShopFarmerRecord) => {
    setShopFarmers(prev => { const i = prev.findIndex(f => f._id === saved._id); if (i >= 0) { const n = [...prev]; n[i] = saved; return n; } return [saved, ...prev]; });
    setShopModal(null);
    showToast(shopModal?.mode === 'register' ? 'Farmer added to Shop ERP' : 'Farmer updated');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteShopFarmer(deleteTarget._id);
      setShopFarmers(prev => prev.filter(f => f._id !== deleteTarget._id));
      setDeleteTarget(null);
      showToast('Farmer deleted from Shop ERP');
    } catch (e: any) { showToast(e.message || 'Delete failed', false); }
    finally { setDeleting(false); }
  };

  const shopSorted = [...shopFarmers].sort((a, b) => {
    const av = shopSortField === 'name' ? a.name : (a.createdAt || '');
    const bv = shopSortField === 'name' ? b.name : (b.createdAt || '');
    return shopSortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  // ─── Sort icon helper ─────────────────────────────────────────────────────
  const SortIcon = ({ asc, active }: { asc: boolean; active: boolean }) =>
    active ? (asc ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null;

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold text-white ${toast.ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {appModal && <AppFarmerModal mode={appModal.mode} farmer={appModal.farmer} onClose={() => setAppModal(null)} onSaved={handleAppSaved} />}
      {shopModal && <ShopFarmerModal mode={shopModal.mode} farmer={shopModal.farmer} onClose={() => setShopModal(null)} onSaved={handleShopSaved} />}
      {deleteTarget && <DeleteConfirm farmer={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} deleting={deleting} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users size={22} className="text-emerald-400" /> Farmer Management
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">AquaGrow mobile users and Shop ERP customers are managed separately</p>
        </div>
        {activeTab === 'app' && (
          <button onClick={() => setAppModal({ mode: 'register' })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition shadow-lg shadow-emerald-500/20">
            <Plus size={16} /><Smartphone size={14} /> Register App Farmer
          </button>
        )}
        {activeTab === 'shop' && (
          <button onClick={() => setShopModal({ mode: 'register' })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition shadow-lg shadow-blue-500/20">
            <Plus size={16} /><Store size={14} /> Add Shop Farmer
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1.5 bg-white/5 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('app')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === 'app' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
          <Smartphone size={15} /> AquaGrow Mobile
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'app' ? 'bg-white/20' : 'bg-white/10 text-zinc-400'}`}>{appFarmers.length}</span>
        </button>
        <button onClick={() => setActiveTab('shop')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === 'shop' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
          <Store size={15} /> Shop ERP Farmers
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'shop' ? 'bg-white/20' : 'bg-white/10 text-zinc-400'}`}>{shopFarmers.length}</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════
          TAB 1 — AquaGrow Mobile Farmers
      ══════════════════════════════════════════ */}
      {activeTab === 'app' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-emerald-300">
            <Smartphone size={14} className="shrink-0" />
            Farmers who registered via the AquaGrow mobile app. These are real user accounts — edit carefully.
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500/50 transition"
              placeholder="Search by name or phone…" value={appSearch} onChange={e => setAppSearch(e.target.value)} />
          </div>

          <div className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/8 text-xs font-bold uppercase tracking-widest text-zinc-500">
              <button className="col-span-3 flex items-center gap-1 hover:text-zinc-300 transition text-left"
                onClick={() => { if (appSortField === 'name') setAppSortAsc(a => !a); else { setAppSortField('name'); setAppSortAsc(true); } }}>
                Farmer <SortIcon asc={appSortAsc} active={appSortField === 'name'} />
              </button>
              <div className="col-span-2">Phone</div>
              <div className="col-span-2">Location</div>
              <div className="col-span-2">Farm Size</div>
              <button className="col-span-2 flex items-center gap-1 hover:text-zinc-300 transition"
                onClick={() => { if (appSortField === 'createdAt') setAppSortAsc(a => !a); else { setAppSortField('createdAt'); setAppSortAsc(true); } }}>
                Registered <SortIcon asc={appSortAsc} active={appSortField === 'createdAt'} />
              </button>
              <div className="col-span-1 text-right">Edit</div>
            </div>

            {appLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-emerald-400" /></div>
            ) : appSorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
                <Smartphone size={36} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">{appSearch ? 'No farmers match your search' : 'No app farmers registered yet'}</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {appSorted.map(farmer => (
                  <div key={farmer._id} className="grid grid-cols-12 gap-2 px-4 py-3.5 items-center hover:bg-white/3 transition text-sm">
                    <div className="col-span-3 min-w-0">
                      <p className="font-semibold text-white truncate">{farmer.name}</p>
                      {farmer.email && <p className="text-xs text-zinc-500 truncate">{farmer.email}</p>}
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5 text-zinc-300">
                      <Phone size={12} className="text-zinc-600 shrink-0" />
                      <span className="text-xs font-mono">{farmer.phoneNumber}</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5 text-zinc-400 text-xs">
                      <MapPin size={12} className="text-zinc-600 shrink-0" />
                      {farmer.location || <span className="text-zinc-700">—</span>}
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5 text-zinc-400 text-xs">
                      <Layers size={12} className="text-zinc-600 shrink-0" />
                      {farmer.farmSize ? `${farmer.farmSize} ac` : <span className="text-zinc-700">—</span>}
                    </div>
                    <div className="col-span-2 text-xs text-zinc-500">
                      {farmer.createdAt ? new Date(farmer.createdAt).toLocaleDateString('en-IN') : '—'}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button onClick={() => setAppModal({ mode: 'edit', farmer })}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition" title="Edit farmer">
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB 2 — Shop ERP Farmers
      ══════════════════════════════════════════ */}
      {activeTab === 'shop' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-xs text-blue-300">
            <Store size={14} className="shrink-0" />
            Walk-in customers and credit buyers registered directly in the Shop ERP. These are separate from AquaGrow app accounts.
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-500/50 transition"
              placeholder="Search by name, phone or village…" value={shopSearch} onChange={e => setShopSearch(e.target.value)} />
          </div>

          <div className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/8 text-xs font-bold uppercase tracking-widest text-zinc-500">
              <button className="col-span-3 flex items-center gap-1 hover:text-zinc-300 transition text-left"
                onClick={() => { if (shopSortField === 'name') setShopSortAsc(a => !a); else { setShopSortField('name'); setShopSortAsc(true); } }}>
                Farmer <SortIcon asc={shopSortAsc} active={shopSortField === 'name'} />
              </button>
              <div className="col-span-2">Phone</div>
              <div className="col-span-2">Village / District</div>
              <div className="col-span-2">Outstanding</div>
              <button className="col-span-2 flex items-center gap-1 hover:text-zinc-300 transition"
                onClick={() => { if (shopSortField === 'createdAt') setShopSortAsc(a => !a); else { setShopSortField('createdAt'); setShopSortAsc(true); } }}>
                Added <SortIcon asc={shopSortAsc} active={shopSortField === 'createdAt'} />
              </button>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {shopLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-blue-400" /></div>
            ) : shopSorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
                <Store size={36} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">{shopSearch ? 'No farmers match your search' : 'No Shop ERP farmers added yet'}</p>
                {!shopSearch && (
                  <button onClick={() => setShopModal({ mode: 'register' })} className="mt-3 text-blue-400 text-sm hover:underline">
                    Add first farmer →
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {shopSorted.map(farmer => (
                  <div key={farmer._id} className="grid grid-cols-12 gap-2 px-4 py-3.5 items-center hover:bg-white/3 transition text-sm">
                    <div className="col-span-3 min-w-0">
                      <p className="font-semibold text-white truncate">{farmer.name}</p>
                      {farmer.email && <p className="text-xs text-zinc-500 truncate">{farmer.email}</p>}
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5 text-zinc-300">
                      <Phone size={12} className="text-zinc-600 shrink-0" />
                      <span className="text-xs font-mono">{farmer.phoneNumber}</span>
                    </div>
                    <div className="col-span-2 text-xs text-zinc-400">
                      <p>{farmer.village || <span className="text-zinc-700">—</span>}</p>
                      {farmer.district && <p className="text-zinc-600">{farmer.district}</p>}
                    </div>
                    <div className="col-span-2">
                      {(farmer.totalCredit ?? 0) > 0 ? (
                        <span className="text-xs font-bold text-amber-400">₹{farmer.totalCredit?.toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="text-xs text-zinc-700">—</span>
                      )}
                    </div>
                    <div className="col-span-2 text-xs text-zinc-500">
                      {farmer.createdAt ? new Date(farmer.createdAt).toLocaleDateString('en-IN') : '—'}
                    </div>
                    <div className="col-span-1 flex justify-end items-center gap-1">
                      <button onClick={() => setShopModal({ mode: 'edit', farmer })}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(farmer)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerManagement;
