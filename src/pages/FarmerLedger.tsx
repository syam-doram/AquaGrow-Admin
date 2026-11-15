/**
 * FarmerLedger.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Owner: view farmer-wise purchase/payment ledger, outstanding dues,
 * culture lifecycle, and credit history.
 *
 * Endpoints:
 *   GET /farmers               → list farmers
 *   GET /ledger/:farmerId      → farmer ledger entries
 *   GET /cultures?farmerId=    → culture list
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, RefreshCw, AlertTriangle, ChevronRight,
  Eye, X, Loader2, TrendingUp, Wallet, Calendar,
  ArrowUpRight, ArrowDownRight, FileText, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BASE_URL, getAdminToken } from '../services/aquagrowApi';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Farmer {
  _id: string;
  name: string;
  phoneNumber?: string;
  location?: string;
  outstandingPaise?: number;
}

interface LedgerEntry {
  _id: string;
  date: string;
  type: 'invoice' | 'payment' | 'return' | 'discount' | 'harvest_recovery';
  description: string;
  debitPaise: number;
  creditPaise: number;
  balancePaise: number;
  referenceId?: string;
}

// ─── API ─────────────────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok) throw new Error((json as any).error || `Request failed: ${res.status}`);
  return json as T;
}

const fetchFarmers = () =>
  apiFetch<Farmer[]>('/farmers').catch(() =>
    apiFetch<{ farmers: Farmer[] }>('/admin/farmers').then(r => r.farmers ?? (r as any))
  );

const fetchLedger = (farmerId: string, from?: string, to?: string) => {
  const params = new URLSearchParams({ farmerId });
  if (from) params.set('from', from);
  if (to)   params.set('to', to);
  return apiFetch<LedgerEntry[]>(`/ledger?${params}`);
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtRs   = (p: number) => `₹${(p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const todayISO  = () => new Date().toISOString().slice(0, 10);
const monthAgoISO = () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10); };
const Spinner = () => <Loader2 size={14} className="animate-spin" />;

const TYPE_META: Record<LedgerEntry['type'], { label: string; color: string; sign: string }> = {
  invoice:          { label: 'Sale',             color: 'text-blue-400',    sign: 'Dr' },
  payment:          { label: 'Payment',          color: 'text-emerald-400', sign: 'Cr' },
  return:           { label: 'Return',           color: 'text-amber-400',   sign: 'Cr' },
  discount:         { label: 'Discount',         color: 'text-purple-400',  sign: 'Cr' },
  harvest_recovery: { label: 'Harvest Recovery', color: 'text-teal-400',    sign: 'Cr' },
};

// ─── Ledger Panel ─────────────────────────────────────────────────────────────
const LedgerPanel = ({ farmer, onClose }: { farmer: Farmer; onClose: () => void }) => {
  const [entries, setEntries]   = useState<LedgerEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [from, setFrom]         = useState(monthAgoISO());
  const [to, setTo]             = useState(todayISO());

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      setEntries(await fetchLedger(farmer._id, from, to));
    } catch (err: any) {
      setError(err.message ?? 'Failed to load ledger');
    } finally {
      setLoading(false);
    }
  }, [farmer._id, from, to]);

  useEffect(() => { load(); }, [load]);

  const totalDebit  = entries.reduce((s, e) => s + e.debitPaise, 0);
  const totalCredit = entries.reduce((s, e) => s + e.creditPaise, 0);
  const outstanding = totalDebit - totalCredit;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-display font-bold">{farmer.name} — Ledger</h3>
              <p className="text-xs text-zinc-500 mt-0.5">{farmer.phoneNumber ?? '—'} · {farmer.location ?? '—'}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400"><X size={16} /></button>
          </div>

          {/* Date range */}
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500">From</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-emerald-500/60" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500">To</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-emerald-500/60" />
            </div>
            <button onClick={load} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
              Reload
            </button>
          </div>

          {/* Summary */}
          {!loading && !error && (
            <div className="px-5 py-4 border-b border-white/5 grid grid-cols-3 gap-4 shrink-0">
              {[
                { label: 'Total Purchases', value: fmtRs(totalDebit),   color: 'text-blue-400' },
                { label: 'Total Paid',       value: fmtRs(totalCredit),  color: 'text-emerald-400' },
                { label: 'Outstanding',      value: fmtRs(Math.max(0, outstanding)), color: outstanding > 0 ? 'text-amber-400' : 'text-emerald-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-3 rounded-xl bg-white/3 border border-white/8">
                  <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">{label}</p>
                  <p className={`text-base font-bold mt-1 ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Ledger entries */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="p-10 flex flex-col items-center gap-3">
                <div className="w-7 h-7 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-zinc-500 text-sm">Loading ledger…</p>
              </div>
            )}
            {!loading && error && (
              <div className="p-8 text-center">
                <AlertTriangle size={24} className="text-red-400 mx-auto mb-2" />
                <p className="text-red-400 text-sm font-bold">{error}</p>
                <button onClick={load} className="btn-secondary text-xs mt-3">Retry</button>
              </div>
            )}
            {!loading && !error && entries.length === 0 && (
              <div className="p-10 text-center">
                <FileText size={32} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-400 font-bold">No ledger entries in this period</p>
              </div>
            )}
            {!loading && !error && entries.length > 0 && (
              <div>
                <div className="grid grid-cols-12 px-5 py-2 bg-white/3 text-[9px] text-zinc-500 uppercase font-bold tracking-wider">
                  <span className="col-span-2">Date</span>
                  <span className="col-span-4">Description</span>
                  <span className="col-span-1 text-center">Type</span>
                  <span className="col-span-2 text-right">Debit</span>
                  <span className="col-span-2 text-right">Credit</span>
                  <span className="col-span-1 text-right">Balance</span>
                </div>
                <div className="divide-y divide-white/5">
                  {entries.map((e, i) => {
                    const meta = TYPE_META[e.type] ?? { label: e.type, color: 'text-zinc-400', sign: '' };
                    return (
                      <div key={e._id} className="grid grid-cols-12 px-5 py-3 text-xs hover:bg-white/2 transition-all">
                        <span className="col-span-2 text-zinc-500">{fmtDate(e.date)}</span>
                        <span className="col-span-4 text-zinc-200">{e.description}</span>
                        <span className={`col-span-1 text-center text-[9px] font-bold ${meta.color}`}>{meta.label}</span>
                        <span className="col-span-2 text-right text-blue-400 font-mono">
                          {e.debitPaise > 0 ? fmtRs(e.debitPaise) : '—'}
                        </span>
                        <span className="col-span-2 text-right text-emerald-400 font-mono">
                          {e.creditPaise > 0 ? fmtRs(e.creditPaise) : '—'}
                        </span>
                        <span className={`col-span-1 text-right font-mono font-bold ${
                          e.balancePaise > 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {fmtRs(e.balancePaise)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const FarmerLedger: React.FC = () => {
  const [farmers, setFarmers]   = useState<Farmer[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState<Farmer | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      setFarmers(await fetchFarmers());
    } catch (err: any) {
      setError(err.message ?? 'Failed to load farmers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = farmers.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.phoneNumber ?? '').includes(search) ||
    (f.location ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const initials = (name: string) =>
    name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const bgColors = ['bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500'];
  const avBg = (name: string) => bgColors[name.charCodeAt(0) % bgColors.length];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Wallet size={15} className="text-blue-400" />
            </div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Finance</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Farmer Credit Ledger</h1>
          <p className="text-zinc-400 text-sm">View purchase history, payments, outstanding dues per farmer.</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm shrink-0" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-2">
          <Search size={13} className="text-zinc-500 shrink-0" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search farmer by name, phone, or location…"
            className="bg-transparent text-sm text-zinc-100 outline-none flex-1 placeholder:text-zinc-600"
          />
        </div>

        {loading && (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">Loading farmers…</p>
          </div>
        )}

        {!loading && error && (
          <div className="p-8 text-center">
            <AlertTriangle size={28} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-bold text-sm mb-3">{error}</p>
            <button onClick={load} className="btn-secondary text-sm">Try Again</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="p-12 text-center">
            <Users size={36} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-bold">No farmers found</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="divide-y divide-white/5">
            {filtered.map((f, i) => (
              <motion.div
                key={f._id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="p-4 flex items-center gap-4 hover:bg-white/2 transition-all cursor-pointer"
                onClick={() => setSelected(f)}
              >
                <div className={`w-10 h-10 rounded-xl ${avBg(f.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {initials(f.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-100">{f.name}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {f.phoneNumber ?? '—'}{f.location ? ` · ${f.location}` : ''}
                  </p>
                </div>
                {f.outstandingPaise != null && f.outstandingPaise > 0 && (
                  <div className="shrink-0 text-right">
                    <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Outstanding</p>
                    <p className="text-sm font-bold text-amber-400 mt-0.5">{fmtRs(f.outstandingPaise)}</p>
                  </div>
                )}
                <ChevronRight size={14} className="text-zinc-600 shrink-0" />
              </motion.div>
            ))}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-white/5">
            <p className="text-[10px] text-zinc-600">{filtered.length} farmers</p>
          </div>
        )}
      </div>

      {selected && <LedgerPanel farmer={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default FarmerLedger;
