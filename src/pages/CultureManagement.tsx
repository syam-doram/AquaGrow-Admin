/**
 * CultureManagement.tsx
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * Manages aqua culture cycles for farmers.
 * Each farmer can run multiple culture cycles sequentially (never overlapping).
 *
 * Endpoints:
 *   GET  /api/cultures                         â†’ list all cultures
 *   POST /api/cultures                         â†’ start new culture
 *   PUT  /api/cultures/:id/close               â†’ close a culture
 *   GET  /api/cultures/:id/sales               â†’ sales for a culture
 *   GET  /api/cultures/:id/payments            â†’ payments for a culture
 *   GET  /api/farmers                          â†’ farmer list
 *   GET  /api/sales/invoices?culture=unassigned â†’ unassigned sales
 *   PUT  /api/sales/invoices/:id/assign-culture â†’ assign sale to culture
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Fish, Plus, Search, RefreshCw, AlertTriangle, CheckCircle2,
  X, Loader2, Eye, IndianRupee, CalendarDays, Phone, User,
  FileText, XCircle, ChevronDown, Info, Archive, Layers,
  Users, Hash, CreditCard, ArrowRight, AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BASE_URL, getAdminToken } from '../services/aquagrowApi';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type CultureStatus = 'active' | 'closed';
type FilterTab = 'all' | 'active' | 'closed';

interface Farmer {
  _id: string;
  name: string;
  phoneNumber: string;
  village?: string;
}

interface Culture {
  _id: string;
  cultureId: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  startDate: string;
  endDate?: string;
  status: CultureStatus;
  notes?: string;
  salesCount?: number;
}

interface SaleItem {
  productName: string;
  quantity: number;
  unit: string;
  rate: number;
}

interface Sale {
  _id: string;
  invoiceNumber: string;
  date: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod?: string;
  status?: string;
}

interface Payment {
  _id: string;
  date: string;
  method: string;
  amount: number;
  reference?: string;
}

interface CultureSalesResponse {
  sales: Sale[];
  totalBilled: number;
  totalCollected: number;
  outstanding: number;
}

interface UnassignedSale {
  _id: string;
  invoiceNumber: string;
  date: string;
  farmerName: string;
  farmerPhone?: string;
  farmerId?: string;
  totalAmount: number;
  items: SaleItem[];
}

// â”€â”€â”€ API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const fmtRs   = (n?: number) => n != null ? `â‚¹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'â€”';
const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'â€”';
const today   = () => new Date().toISOString().slice(0, 10);

// â”€â”€â”€ Spinner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Spinner = () => <Loader2 size={15} className="animate-spin" />;

// â”€â”€â”€ Status Badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const StatusBadge = ({ status }: { status: CultureStatus }) => (
  <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
    status === 'active'
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
  }`}>
    {status === 'active' ? <CheckCircle2 size={9} /> : <Archive size={9} />}
    {status === 'active' ? 'Active' : 'Closed'}
  </span>
);

// â”€â”€â”€ Input / Label classes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const iCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/60 transition-all placeholder:text-zinc-600';
const lCls = 'block text-[10px] text-zinc-500 uppercase font-bold mb-1.5 tracking-wider';

// â”€â”€â”€ StartCultureModal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const StartCultureModal = ({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [farmers, setFarmers]         = useState<Farmer[]>([]);
  const [farmersLoading, setFL]       = useState(true);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [showFarmerDrop, setShowFarmerDrop] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [startDate, setStartDate]     = useState(today());
  const [notes, setNotes]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [hasActiveCulture, setHasActiveCulture] = useState(false);
  const [cultures, setCultures]       = useState<Culture[]>([]);

  useEffect(() => {
    setFL(true);
    Promise.all([
      apiFetch<Farmer[]>('/farmers'),
      apiFetch<Culture[]>('/cultures'),
    ]).then(([f, c]) => {
      setFarmers(f);
      setCultures(c);
    }).catch(() => {}).finally(() => setFL(false));
  }, []);

  const filteredFarmers = farmers.filter(f =>
    !farmerSearch ||
    f.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
    f.phoneNumber.includes(farmerSearch)
  );

  const pickFarmer = (f: Farmer) => {
    setSelectedFarmer(f);
    setFarmerSearch(f.name);
    setShowFarmerDrop(false);
    // check for active culture
    const active = cultures.find(c => c.farmerId === f._id && c.status === 'active');
    setHasActiveCulture(!!active);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmer) return setError('Please select a farmer');
    if (!startDate) return setError('Start date is required');
    setError(null);
    setLoading(true);
    try {
      await apiFetch('/cultures', {
        method: 'POST',
        body: JSON.stringify({ farmerId: selectedFarmer._id, startDate, notes: notes.trim() }),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to start culture');
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
          className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Fish size={16} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="font-display font-bold">Start Culture Cycle</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Begin a new culture for a farmer</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400"><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                <AlertTriangle size={13} className="shrink-0" /> {error}
              </div>
            )}

            {hasActiveCulture && selectedFarmer && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                <span>Farmer already has an active culture. Close it first before starting a new one.</span>
              </div>
            )}

            {/* Farmer */}
            <div>
              <label className={lCls}>Select Farmer *</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={farmerSearch}
                  onChange={e => { setFarmerSearch(e.target.value); setShowFarmerDrop(true); setSelectedFarmer(null); setHasActiveCulture(false); }}
                  onFocus={() => setShowFarmerDrop(true)}
                  placeholder={farmersLoading ? 'Loading farmersâ€¦' : 'Search farmer name or phoneâ€¦'}
                  disabled={farmersLoading}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/60 transition placeholder:text-zinc-600 disabled:opacity-50"
                />
                {showFarmerDrop && filteredFarmers.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-zinc-800 border border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredFarmers.slice(0, 20).map(f => (
                      <button key={f._id} type="button" onClick={() => pickFarmer(f)}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/8 text-sm flex justify-between items-center gap-2">
                        <span className="text-white font-medium">{f.name}</span>
                        <span className="text-zinc-500 text-xs shrink-0">{f.phoneNumber}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className={lCls}>Start Date *</label>
              <input type="date" value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className={iCls} required />
            </div>

            {/* Notes */}
            <div>
              <label className={lCls}>Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Any notes about this culture cycleâ€¦"
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/60 transition-all placeholder:text-zinc-600 resize-none" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary text-sm px-5 py-2.5">Cancel</button>
              <button type="submit" disabled={loading || hasActiveCulture || !selectedFarmer}
                className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-50">
                {loading ? <Spinner /> : <Plus size={14} />}
                Start Culture
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// â”€â”€â”€ CloseCultureModal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CloseCultureModal = ({
  culture,
  onClose,
  onSaved,
}: {
  culture: Culture;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [endDate, setEndDate] = useState(today());
  const [notes, setNotes]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endDate) return setError('End date is required');
    setError(null);
    setLoading(true);
    try {
      await apiFetch(`/cultures/${culture._id}/close`, {
        method: 'PUT',
        body: JSON.stringify({ endDate, notes: notes.trim() }),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to close culture');
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
          className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center">
                <Archive size={16} className="text-zinc-400" />
              </div>
              <div>
                <h3 className="font-display font-bold">Close Culture</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Mark this cycle as complete</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400"><X size={18} /></button>
          </div>

          <div className="p-6 space-y-5">
            {/* Culture info */}
            <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Culture ID</span>
                <span className="text-zinc-200 font-mono font-bold">{culture.cultureId}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Farmer</span>
                <span className="text-zinc-200 font-semibold">{culture.farmerName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Started</span>
                <span className="text-zinc-200">{fmtDate(culture.startDate)}</span>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              <span>Closing a culture is permanent. Its entire history will be preserved. This action cannot be undone.</span>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                <AlertTriangle size={13} className="shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={lCls}>End Date *</label>
                <input type="date" value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className={iCls} required />
              </div>
              <div>
                <label className={lCls}>Closing Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Any remarks about closing this cycleâ€¦"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/60 transition-all placeholder:text-zinc-600 resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={onClose} className="btn-secondary text-sm px-5 py-2.5">Cancel</button>
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-600 hover:bg-zinc-500 text-white text-sm font-bold transition disabled:opacity-50">
                  {loading ? <Spinner /> : <Archive size={14} />}
                  Confirm Close
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// â”€â”€â”€ CultureDetailModal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type DetailTab = 'sales' | 'payments';

const CultureDetailModal = ({
  culture,
  onClose,
}: {
  culture: Culture;
  onClose: () => void;
}) => {
  const [tab, setTab]           = useState<DetailTab>('sales');
  const [salesData, setSalesData] = useState<CultureSalesResponse | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const loadTab = useCallback(async (t: DetailTab) => {
    setLoading(true);
    setError(null);
    try {
      if (t === 'sales') {
        const data = await apiFetch<CultureSalesResponse>(`/cultures/${culture._id}/sales`);
        setSalesData(data);
      } else {
        const data = await apiFetch<Payment[]>(`/cultures/${culture._id}/payments`);
        setPayments(data);
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [culture._id]);

  useEffect(() => { loadTab('sales'); }, [loadTab]);

  const switchTab = (t: DetailTab) => { setTab(t); loadTab(t); };

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
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold font-mono">{culture.cultureId}</h3>
                <StatusBadge status={culture.status} />
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {culture.farmerName} Â· {culture.farmerPhone} Â· {fmtDate(culture.startDate)}
                {culture.endDate ? ` â†’ ${fmtDate(culture.endDate)}` : ''}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400"><X size={18} /></button>
          </div>

          {/* Culture details strip */}
          <div className="px-5 py-3 border-b border-white/5 grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
            {[
              { label: 'Farmer', value: culture.farmerName },
              { label: 'Phone', value: culture.farmerPhone },
              { label: 'Start Date', value: fmtDate(culture.startDate) },
              { label: 'End Date', value: fmtDate(culture.endDate) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider">{label}</p>
                <p className="text-xs text-zinc-200 font-semibold mt-0.5">{value}</p>
              </div>
            ))}
            {culture.notes && (
              <div className="col-span-2 md:col-span-4">
                <p className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider">Notes</p>
                <p className="text-xs text-zinc-400 mt-0.5">{culture.notes}</p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="px-5 pt-4 pb-0 flex gap-1 shrink-0">
            {(['sales', 'payments'] as DetailTab[]).map(t => (
              <button key={t} onClick={() => switchTab(t)}
                className={`px-4 py-2 rounded-t-lg text-xs font-bold transition-all ${
                  tab === t
                    ? 'bg-white/8 text-white border border-b-0 border-white/10'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}>
                {t === 'sales' ? 'Sales History' : 'Payments'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto border border-white/8 rounded-b-xl mx-5 mb-5">
            {loading && (
              <div className="p-10 flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-zinc-500 text-xs">Loadingâ€¦</p>
              </div>
            )}
            {!loading && error && (
              <div className="p-8 text-center">
                <AlertTriangle size={24} className="text-red-400 mx-auto mb-2" />
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            {/* Sales History */}
            {!loading && !error && tab === 'sales' && salesData && (
              <div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/8">
                      {['Invoice #', 'Date', 'Products', 'Total â‚¹', 'Method', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[9px] text-zinc-500 uppercase tracking-wider font-bold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {salesData.sales.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-600">No sales linked to this culture</td></tr>
                    )}
                    {salesData.sales.map(s => (
                      <tr key={s._id} className="hover:bg-white/2 transition-all">
                        <td className="px-4 py-3 font-mono font-bold text-zinc-200">{s.invoiceNumber}</td>
                        <td className="px-4 py-3 text-zinc-400">{fmtDate(s.date)}</td>
                        <td className="px-4 py-3 text-zinc-400">{s.items.map(i => i.productName).join(', ')}</td>
                        <td className="px-4 py-3 font-bold text-zinc-200">{fmtRs(s.totalAmount)}</td>
                        <td className="px-4 py-3 text-zinc-400">{s.paymentMethod ?? 'â€”'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            s.status === 'paid'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : s.status === 'partial'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
                          }`}>{s.status ?? 'â€”'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Totals */}
                <div className="border-t border-white/8 p-4 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total Billed', value: fmtRs(salesData.totalBilled), color: 'text-zinc-200' },
                    { label: 'Total Collected', value: fmtRs(salesData.totalCollected), color: 'text-emerald-400' },
                    { label: 'Outstanding', value: fmtRs(salesData.outstanding), color: 'text-amber-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center">
                      <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">{label}</p>
                      <p className={`text-base font-display font-bold mt-0.5 ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payments */}
            {!loading && !error && tab === 'payments' && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/8">
                    {['Date', 'Method', 'Amount â‚¹', 'Reference'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[9px] text-zinc-500 uppercase tracking-wider font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payments.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-600">No payments recorded for this culture</td></tr>
                  )}
                  {payments.map(p => (
                    <tr key={p._id} className="hover:bg-white/2 transition-all">
                      <td className="px-4 py-3 text-zinc-400">{fmtDate(p.date)}</td>
                      <td className="px-4 py-3 text-zinc-300 font-semibold">{p.method}</td>
                      <td className="px-4 py-3 font-bold text-emerald-400">{fmtRs(p.amount)}</td>
                      <td className="px-4 py-3 text-zinc-500 font-mono">{p.reference ?? 'â€”'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// â”€â”€â”€ AssignCultureModal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AssignCultureModal = ({
  sale,
  cultures,
  onClose,
  onSaved,
}: {
  sale: UnassignedSale;
  cultures: Culture[];
  onClose: () => void;
  onSaved: () => void;
}) => {
  const farmerCultures = cultures.filter(c => c.farmerId === sale.farmerId);
  const [selectedCultureId, setSelectedCultureId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCultureId) return setError('Please select a culture');
    setError(null);
    setLoading(true);
    try {
      await apiFetch(`/sales/invoices/${sale._id}/assign-culture`, {
        method: 'PUT',
        body: JSON.stringify({ cultureId: selectedCultureId }),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to assign');
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
            <h3 className="font-display font-bold">Assign to Culture</h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400"><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="p-3 rounded-xl bg-white/3 border border-white/8 text-xs space-y-1">
              <p className="font-bold text-zinc-200">{sale.invoiceNumber}</p>
              <p className="text-zinc-500">{sale.farmerName} Â· {fmtRs(sale.totalAmount)} Â· {fmtDate(sale.date)}</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                <AlertTriangle size={12} /> {error}
              </div>
            )}

            {farmerCultures.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">No cultures found for this farmer.</p>
            ) : (
              <div>
                <label className={lCls}>Select Culture</label>
                <div className="relative">
                  <select value={selectedCultureId} onChange={e => setSelectedCultureId(e.target.value)}
                    className={`${iCls} appearance-none`}>
                    <option value="">â€” choose culture â€”</option>
                    {farmerCultures.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.cultureId} Â· {fmtDate(c.startDate)} ({c.status})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary text-sm px-4 py-2">Cancel</button>
              <button type="submit" disabled={loading || farmerCultures.length === 0}
                className="btn-primary text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50">
                {loading ? <Spinner /> : <ArrowRight size={14} />}
                Assign
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CultureManagement: React.FC = () => {
  const [cultures, setCultures]       = useState<Culture[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [filterTab, setFilterTab]     = useState<FilterTab>('all');
  const [showStart, setShowStart]     = useState(false);
  const [closeCulture, setCloseCulture] = useState<Culture | null>(null);
  const [detailCulture, setDetailCulture] = useState<Culture | null>(null);
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Unassigned sales
  const [unassigned, setUnassigned]   = useState<UnassignedSale[]>([]);
  const [unassignedLoading, setUL]    = useState(false);
  const [assignSale, setAssignSale]   = useState<UnassignedSale | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Culture[]>('/cultures');
      setCultures(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load cultures');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUnassigned = useCallback(async () => {
    setUL(true);
    try {
      const data = await apiFetch<UnassignedSale[]>('/sales/invoices?culture=unassigned');
      setUnassigned(data);
    } catch {
      // silent
    } finally {
      setUL(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadUnassigned();
  }, [load, loadUnassigned]);

  const stats = {
    active:    cultures.filter(c => c.status === 'active').length,
    closed:    cultures.filter(c => c.status === 'closed').length,
    noActive:  [...new Set(cultures.map(c => c.farmerId))].filter(fid =>
      !cultures.some(c => c.farmerId === fid && c.status === 'active')
    ).length,
    total:     cultures.length,
  };

  const filtered = cultures.filter(c => {
    const matchSearch = !search ||
      c.cultureId.toLowerCase().includes(search.toLowerCase()) ||
      c.farmerName.toLowerCase().includes(search.toLowerCase()) ||
      c.farmerPhone.includes(search);
    const matchTab = filterTab === 'all' || c.status === filterTab;
    return matchSearch && matchTab;
  });

  return (
    <div className="space-y-8 pb-10">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold shadow-xl ${
              toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
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
              <Fish size={15} className="text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Shop ERP</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Culture Management</h1>
          <p className="text-zinc-400 text-sm">Track aquaculture cycles per farmer. Each farmer runs sequential, non-overlapping cultures.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button onClick={() => { load(); loadUnassigned(); }} className="btn-secondary flex items-center gap-2 text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setShowStart(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Start Culture
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Cultures',           value: stats.active,   color: 'text-emerald-400', icon: <Fish size={16} /> },
          { label: 'Closed Cultures',           value: stats.closed,   color: 'text-zinc-400',    icon: <Archive size={16} /> },
          { label: 'Farmers w/ No Active',      value: stats.noActive, color: 'text-amber-400',   icon: <Users size={16} /> },
          { label: 'Total Cultures',            value: stats.total,    color: 'text-zinc-100',    icon: <Layers size={16} /> },
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

      {/* Cultures Table */}
      <div className="glass-panel overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-white/4 border border-white/8 rounded-xl px-3 py-2">
            <Search size={13} className="text-zinc-500 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by culture ID, farmer name, phoneâ€¦"
              className="bg-transparent text-sm text-zinc-100 outline-none flex-1 placeholder:text-zinc-600" />
          </div>
          <div className="flex items-center gap-1 p-1 bg-white/4 rounded-xl border border-white/8">
            {(['all', 'active', 'closed'] as FilterTab[]).map(f => (
              <button key={f} onClick={() => setFilterTab(f)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${
                  filterTab === f ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:text-zinc-200'
                }`}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">Loading culturesâ€¦</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-8 text-center">
            <AlertTriangle size={28} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-bold text-sm mb-3">{error}</p>
            <button onClick={load} className="btn-secondary text-sm">Try Again</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="p-12 text-center">
            <Fish size={40} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-bold mb-1">
              {cultures.length === 0 ? 'No cultures yet' : 'No cultures match filters'}
            </p>
            <p className="text-zinc-600 text-sm mb-4">
              {cultures.length === 0 ? 'Start the first culture cycle for a farmer.' : 'Try adjusting your search or filter.'}
            </p>
            {cultures.length === 0 && (
              <button onClick={() => setShowStart(true)} className="btn-primary text-sm">
                Start First Culture
              </button>
            )}
          </div>
        )}

        {/* Table */}
        {!loading && !error && filtered.length > 0 && (
          <>
            {/* Desktop table header */}
            <div className="hidden md:grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1.5fr_1fr_1fr_auto] gap-2 px-4 py-2.5 border-b border-white/5">
              {['Culture ID', 'Farmer', 'Phone', 'Start Date', 'End Date', 'Status', 'Sales', 'Actions'].map(h => (
                <p key={h} className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">{h}</p>
              ))}
            </div>

            <div className="divide-y divide-white/5">
              {filtered.map((c, i) => (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="p-4 hover:bg-white/2 transition-all cursor-pointer"
                  onClick={() => setDetailCulture(c)}
                >
                  {/* Mobile layout */}
                  <div className="md:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-mono text-zinc-100">{c.cultureId}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      {c.status === 'active' && (
                        <button
                          onClick={e => { e.stopPropagation(); setCloseCulture(c); }}
                          className="text-[10px] px-2 py-1 rounded-lg bg-zinc-700/50 hover:bg-zinc-700 text-zinc-300 font-bold transition"
                        >
                          Close
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-zinc-200 font-semibold">{c.farmerName}</p>
                    <div className="flex gap-3 text-xs text-zinc-500">
                      <span>{c.farmerPhone}</span>
                      <span>{fmtDate(c.startDate)}</span>
                      {c.endDate && <span>â†’ {fmtDate(c.endDate)}</span>}
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1.5fr_1fr_1fr_auto] gap-2 items-center">
                    <span className="text-xs font-bold font-mono text-zinc-200">{c.cultureId}</span>
                    <span className="text-xs text-zinc-200 font-semibold truncate">{c.farmerName}</span>
                    <span className="text-xs text-zinc-500 flex items-center gap-1"><Phone size={10} />{c.farmerPhone}</span>
                    <span className="text-xs text-zinc-400 flex items-center gap-1"><CalendarDays size={10} />{fmtDate(c.startDate)}</span>
                    <span className="text-xs text-zinc-400">{fmtDate(c.endDate)}</span>
                    <StatusBadge status={c.status} />
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Hash size={10} />{c.salesCount ?? 0}
                    </span>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setDetailCulture(c)}
                        className="p-1.5 rounded-lg hover:bg-white/8 text-zinc-500 hover:text-zinc-200 transition" title="View details">
                        <Eye size={13} />
                      </button>
                      {c.status === 'active' && (
                        <button onClick={() => setCloseCulture(c)}
                          className="p-1.5 rounded-lg hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-200 transition" title="Close culture">
                          <XCircle size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-white/5">
              <p className="text-[10px] text-zinc-600">{filtered.length} of {cultures.length} cultures</p>
            </div>
          </>
        )}
      </div>

      {/* Unassigned Sales Section */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <FileText size={14} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-200">Unassigned Sales</p>
              <p className="text-xs text-zinc-500">Sales made when farmer had no active culture</p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
            {unassigned.length} pending
          </span>
        </div>

        {unassignedLoading && (
          <div className="p-8 flex justify-center">
            <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        )}

        {!unassignedLoading && unassigned.length === 0 && (
          <div className="p-8 text-center">
            <CheckCircle2 size={28} className="text-emerald-500/50 mx-auto mb-2" />
            <p className="text-zinc-500 text-sm">All sales are assigned to cultures</p>
          </div>
        )}

        {!unassignedLoading && unassigned.length > 0 && (
          <div className="divide-y divide-white/5">
            {unassigned.map((s, i) => (
              <motion.div
                key={s._id}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="p-4 flex items-center gap-4"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <IndianRupee size={12} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold font-mono text-zinc-200">{s.invoiceNumber}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">Unassigned</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{s.farmerName} Â· {fmtDate(s.date)} Â· {fmtRs(s.totalAmount)}</p>
                </div>
                <button
                  onClick={() => setAssignSale(s)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold transition"
                >
                  <ArrowRight size={12} /> Assign to Culture
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showStart && (
        <StartCultureModal
          onClose={() => setShowStart(false)}
          onSaved={() => { showToast('Culture started successfully'); load(); }}
        />
      )}

      {closeCulture && (
        <CloseCultureModal
          culture={closeCulture}
          onClose={() => setCloseCulture(null)}
          onSaved={() => { showToast('Culture closed'); load(); }}
        />
      )}

      {detailCulture && (
        <CultureDetailModal
          culture={detailCulture}
          onClose={() => setDetailCulture(null)}
        />
      )}

      {assignSale && (
        <AssignCultureModal
          sale={assignSale}
          cultures={cultures}
          onClose={() => setAssignSale(null)}
          onSaved={() => { showToast('Sale assigned to culture'); loadUnassigned(); }}
        />
      )}
    </div>
  );
};

export default CultureManagement;
