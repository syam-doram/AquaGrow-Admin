/**
 * DayCloseApproval.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Owner: review staff-submitted day-close entries, approve stock adjustments.
 *
 * Endpoints:
 *   GET  /dayclose             → all day-close submissions
 *   GET  /dayclose/pending     → awaiting owner approval
 *   PUT  /dayclose/:id/approve → approve with optional notes
 *   PUT  /dayclose/:id/reject  → reject with reason
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardCheck, RefreshCw, AlertTriangle, CheckCircle2, X,
  Clock, Eye, ChevronDown, Loader2, Search, XCircle, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BASE_URL, getAdminToken } from '../services/aquagrowApi';

// ─── Types ───────────────────────────────────────────────────────────────────
interface DayCloseVariance {
  productId: string;
  productName?: string;
  unit: string;
  expectedQty: number;
  actualQty: number;
  variance: number;
  reason?: string;
}

interface DayCloseSubmission {
  _id: string;
  date: string;
  shopId?: string;
  submittedByName?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  variances: DayCloseVariance[];
  staffNotes?: string;
  ownerNotes?: string;
  approvedByName?: string;
  approvedAt?: string;
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

const fetchDayCloses = () =>
  apiFetch<DayCloseSubmission[]>('/dayclose/pending').catch(() =>
    apiFetch<DayCloseSubmission[]>('/dayclose')
  );

const approveDayClose = (id: string, notes: string) =>
  apiFetch(`/dayclose/${id}/approve`, { method: 'PUT', body: JSON.stringify({ ownerNotes: notes }) });

const rejectDayClose = (id: string, reason: string) =>
  apiFetch(`/dayclose/${id}/reject`, { method: 'PUT', body: JSON.stringify({ ownerNotes: reason }) });

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (s: string) => new Date(s).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const Spinner = () => <Loader2 size={14} className="animate-spin" />;

const STATUS_META = {
  pending:  { label: 'Pending Review', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  approved: { label: 'Approved',       cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  rejected: { label: 'Rejected',       cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

// ─── Detail & Action Modal ────────────────────────────────────────────────────
const DayCloseModal = ({
  submission,
  onClose,
  onActionDone,
}: {
  submission: DayCloseSubmission;
  onClose: () => void;
  onActionDone: () => void;
}) => {
  const [notes, setNotes]     = useState('');
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const act = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !notes.trim()) return setError('Please enter a reason for rejection.');
    setError(null);
    setLoading(action);
    try {
      if (action === 'approve') await approveDayClose(submission._id, notes);
      else                      await rejectDayClose(submission._id, notes);
      onActionDone();
      onClose();
    } catch (err: any) {
      setError(err.message ?? `Failed to ${action}`);
    } finally {
      setLoading(null);
    }
  };

  const hasVariances = submission.variances.some(v => v.variance !== 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold">Day Close Review</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {fmtDate(submission.date)} · {submission.shopId ?? '—'} · by {submission.submittedByName ?? '—'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${STATUS_META[submission.status].cls}`}>
                {STATUS_META[submission.status].label}
              </span>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400"><X size={16} /></button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Staff notes */}
            {submission.staffNotes && (
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15">
                <p className="text-[10px] text-blue-400 uppercase font-bold tracking-wider mb-1">Staff Notes</p>
                <p className="text-sm text-zinc-300">{submission.staffNotes}</p>
              </div>
            )}

            {/* Variances table */}
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">
                Stock Count Results ({submission.variances.length} products)
              </p>
              {submission.variances.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-white/3 border border-white/8">
                  <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
                  <p className="text-zinc-400 text-sm">No variances reported</p>
                </div>
              ) : (
                <div className="rounded-xl border border-white/8 overflow-hidden">
                  <div className="grid grid-cols-12 px-4 py-2 bg-white/3 text-[9px] text-zinc-500 uppercase font-bold tracking-wider">
                    <span className="col-span-4">Product</span>
                    <span className="col-span-2 text-right">Expected</span>
                    <span className="col-span-2 text-right">Actual</span>
                    <span className="col-span-2 text-right">Variance</span>
                    <span className="col-span-2 text-right">Reason</span>
                  </div>
                  {submission.variances.map((v, i) => (
                    <div key={i} className={`grid grid-cols-12 px-4 py-3 text-xs ${i > 0 ? 'border-t border-white/5' : ''}`}>
                      <span className="col-span-4 text-zinc-200 font-medium">{v.productName ?? v.productId}</span>
                      <span className="col-span-2 text-right text-zinc-400">{v.expectedQty} {v.unit}</span>
                      <span className="col-span-2 text-right text-zinc-400">{v.actualQty} {v.unit}</span>
                      <span className={`col-span-2 text-right font-bold ${
                        v.variance === 0 ? 'text-zinc-400' :
                        v.variance > 0  ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {v.variance > 0 ? '+' : ''}{v.variance} {v.unit}
                      </span>
                      <span className="col-span-2 text-right text-zinc-600 truncate">{v.reason ?? '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action area — only for pending */}
            {submission.status === 'pending' && (
              <div className="space-y-3">
                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    <AlertTriangle size={12} /> {error}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5 tracking-wider">
                    Owner Notes / Reason (required for rejection)
                  </label>
                  <textarea
                    value={notes} onChange={e => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Add notes for the record…"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none focus:border-emerald-500/60 transition-all resize-none placeholder:text-zinc-600"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => act('reject')}
                    disabled={!!loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    {loading === 'reject' ? <Spinner /> : <XCircle size={14} />}
                    Reject
                  </button>
                  <button
                    onClick={() => act('approve')}
                    disabled={!!loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    {loading === 'approve' ? <Spinner /> : <CheckCircle2 size={14} />}
                    Approve Adjustments
                  </button>
                </div>
              </div>
            )}

            {/* Already actioned */}
            {submission.status !== 'pending' && submission.ownerNotes && (
              <div className={`p-4 rounded-xl border ${
                submission.status === 'approved'
                  ? 'bg-emerald-500/5 border-emerald-500/15'
                  : 'bg-red-500/5 border-red-500/15'
              }`}>
                <p className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${
                  submission.status === 'approved' ? 'text-emerald-400' : 'text-red-400'
                }`}>Owner Notes</p>
                <p className="text-sm text-zinc-300">{submission.ownerNotes}</p>
                {submission.approvedByName && (
                  <p className="text-[10px] text-zinc-600 mt-1">— {submission.approvedByName}</p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const DayCloseApproval: React.FC = () => {
  const [submissions, setSubmissions] = useState<DayCloseSubmission[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DayCloseSubmission['status']>('pending');
  const [selected, setSelected]       = useState<DayCloseSubmission | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSubmissions(await fetchDayCloses());
    } catch (err: any) {
      setError(err.message ?? 'Failed to load day-close submissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = submissions.filter(s => {
    const matchSearch =
      (s.submittedByName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (s.shopId ?? '').toLowerCase().includes(search.toLowerCase()) ||
      s.date.includes(search);
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    pending:  submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/90 text-white text-sm font-bold shadow-xl"
          >
            <CheckCircle2 size={14} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <ClipboardCheck size={15} className="text-teal-400" />
            </div>
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Owner Approval</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Day Close Approvals</h1>
          <p className="text-zinc-400 text-sm">Review physical stock counts, approve or reject variance adjustments.</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm shrink-0" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Review', value: counts.pending,  color: 'text-amber-400',   icon: <Clock size={16} /> },
          { label: 'Approved',       value: counts.approved, color: 'text-emerald-400', icon: <CheckCircle2 size={16} /> },
          { label: 'Rejected',       value: counts.rejected, color: 'text-red-400',     icon: <XCircle size={16} /> },
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

      {/* List */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-white/5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-white/4 border border-white/8 rounded-xl px-3 py-2">
            <Search size={13} className="text-zinc-500 shrink-0" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by staff, shop, date…"
              className="bg-transparent text-sm text-zinc-100 outline-none flex-1 placeholder:text-zinc-600"
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-white/4 rounded-xl border border-white/8">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${
                  statusFilter === f ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                {f === 'pending' ? 'Pending' : f === 'all' ? 'All' : STATUS_META[f].label}
                {f === 'pending' && counts.pending > 0 && (
                  <span className={`ml-1 text-[9px] px-1 py-0.5 rounded-full ${statusFilter === f ? 'bg-white/20' : 'bg-amber-500 text-zinc-900'}`}>
                    {counts.pending}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">Loading day-close submissions…</p>
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
            <ClipboardCheck size={36} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-bold mb-1">
              {submissions.length === 0 ? 'No day-close submissions yet' : 'None match your filters'}
            </p>
            <p className="text-zinc-600 text-sm">Staff submit day-close from the Staff Portal at end of day.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="divide-y divide-white/5">
            {filtered.map((sub, i) => (
              <motion.div
                key={sub._id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="p-4 flex items-center gap-4 hover:bg-white/2 transition-all cursor-pointer"
                onClick={() => setSelected(sub)}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  sub.status === 'pending' ? 'bg-amber-500/10 border border-amber-500/20' :
                  sub.status === 'approved' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                  'bg-red-500/10 border border-red-500/20'
                }`}>
                  <ClipboardCheck size={14} className={
                    sub.status === 'pending' ? 'text-amber-400' :
                    sub.status === 'approved' ? 'text-emerald-400' : 'text-red-400'
                  } />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-zinc-100">{fmtDate(sub.date)}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${STATUS_META[sub.status].cls}`}>
                      {STATUS_META[sub.status].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-zinc-500">by {sub.submittedByName ?? '—'}</span>
                    {sub.shopId && <span className="text-[10px] text-zinc-600">{sub.shopId}</span>}
                    <span className="text-[10px] text-zinc-600">Submitted {fmtTime(sub.submittedAt)}</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Products</p>
                  <p className="text-sm font-bold text-zinc-200 mt-0.5">{sub.variances.length}</p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Variances</p>
                  <p className={`text-sm font-bold mt-0.5 ${
                    sub.variances.some(v => v.variance !== 0) ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {sub.variances.filter(v => v.variance !== 0).length}
                  </p>
                </div>

                <Eye size={13} className="text-zinc-600 shrink-0" />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <DayCloseModal
          submission={selected}
          onClose={() => setSelected(null)}
          onActionDone={() => { load(); showToast(`Day close ${selected.status === 'pending' ? 'actioned' : 'updated'} successfully`); }}
        />
      )}
    </div>
  );
};

export default DayCloseApproval;
