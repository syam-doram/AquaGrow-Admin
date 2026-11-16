/**
 * HarvestDraftReview.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Owner view: review harvest drafts submitted by staff.
 * Mark as reviewed/settled, add notes, optionally link to a culture.
 *
 * Endpoints:
 *   GET  /harvests              → list all harvest drafts
 *   GET  /harvests?status=draft → pending drafts
 *   PUT  /harvests/:id/review   → { status, reviewNotes, cultureId? }
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Sprout, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  Eye, Loader2, X, ChevronDown, Search, Edit3, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BASE_URL, getAdminToken } from '../services/aquagrowApi';

// ─── Types ───────────────────────────────────────────────────────────────────
interface HarvestDraft {
  _id: string;
  farmerId: string;
  farmerName?: string;
  pondId: string;
  weightKg: number;
  date: string;
  notes?: string;
  status: 'draft' | 'reviewed' | 'settled';
  submittedBy?: string;
  submittedByName?: string;
  reviewNotes?: string;
  cultureId?: string;
  createdAt: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (s: string) =>
  new Date(s).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const STATUS_META = {
  draft:    { label: 'Pending Review', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  reviewed: { label: 'Reviewed',       cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  settled:  { label: 'Settled',        cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

// ─── Review Modal ─────────────────────────────────────────────────────────────
const ReviewModal: React.FC<{
  draft: HarvestDraft;
  onClose: () => void;
  onDone: () => void;
}> = ({ draft, onClose, onDone }) => {
  const [status, setStatus] = useState<'reviewed' | 'settled'>(
    draft.status === 'settled' ? 'settled' : 'reviewed'
  );
  const [notes, setNotes] = useState(draft.reviewNotes ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      await apiFetch(`/harvests/${draft._id}/review`, {
        method: 'PUT',
        body: JSON.stringify({ status, reviewNotes: notes }),
      });
      onDone();
    } catch (e: any) {
      setErr(e.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Sprout size={16} className="text-lime-400" />
            <p className="font-bold text-zinc-100">Review Harvest Draft</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Draft info */}
          <div className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Farmer</span>
              <span className="text-zinc-200 font-medium">{draft.farmerName ?? draft.farmerId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Pond</span>
              <span className="text-zinc-200 font-medium">{draft.pondId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Weight</span>
              <span className="text-zinc-200 font-bold">{draft.weightKg} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Date</span>
              <span className="text-zinc-200">{fmtDate(draft.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Submitted by</span>
              <span className="text-zinc-200">{draft.submittedByName ?? '—'}</span>
            </div>
            {draft.notes && (
              <div className="pt-1 border-t border-white/5">
                <p className="text-zinc-500 text-xs">Staff notes</p>
                <p className="text-zinc-300 text-xs mt-0.5">{draft.notes}</p>
              </div>
            )}
          </div>

          {/* New status */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Mark as</label>
            <div className="flex gap-2">
              {(['reviewed', 'settled'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${
                    status === s
                      ? s === 'settled'
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                      : 'bg-white/4 border-white/8 text-zinc-500 hover:bg-white/8'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Owner notes */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Review Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Notes for staff or for settlement…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-lime-500/60 transition resize-none"
            />
          </div>

          {err && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {err}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-400 text-sm hover:bg-white/5 transition">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-lime-600 hover:bg-lime-500 disabled:opacity-60 text-white font-bold text-sm transition flex items-center justify-center gap-1.5"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const HarvestDraftReview: React.FC = () => {
  const [drafts, setDrafts] = useState<HarvestDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('draft');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<HarvestDraft | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const data = await apiFetch<HarvestDraft[]>(`/harvests?${params}`);
      setDrafts(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const q = search.toLowerCase();
  const filtered = drafts.filter(d =>
    !q ||
    d.farmerName?.toLowerCase().includes(q) ||
    d.farmerId?.toLowerCase().includes(q) ||
    d.pondId?.toLowerCase().includes(q) ||
    d.submittedByName?.toLowerCase().includes(q)
  );

  const counts = {
    draft:    drafts.filter(d => d.status === 'draft').length,
    reviewed: drafts.filter(d => d.status === 'reviewed').length,
    settled:  drafts.filter(d => d.status === 'settled').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sprout size={22} className="text-lime-400" /> Harvest Drafts
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">Review and settle harvest drafts submitted by staff.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-zinc-400 text-sm hover:bg-white/5 transition"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {([['draft', counts.draft, 'Pending'], ['reviewed', counts.reviewed, 'Reviewed'], ['settled', counts.settled, 'Settled']] as const).map(([k, c, label]) => (
          <div key={k} className="bg-white/4 border border-white/8 rounded-2xl p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${k === 'draft' && c > 0 ? 'text-amber-400' : k === 'settled' ? 'text-emerald-400' : 'text-zinc-200'}`}>{c}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-white/5 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search farmer, pond…"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-lime-500/50 transition"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1">
            {(['draft', 'reviewed', 'settled', 'all'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === f
                    ? 'bg-lime-600 text-white'
                    : 'text-zinc-500 hover:bg-white/5'
                }`}
              >
                {f === 'all' ? 'All' : STATUS_META[f as keyof typeof STATUS_META].label}
                {f === 'draft' && counts.draft > 0 && (
                  <span className={`ml-1 text-[9px] px-1 py-0.5 rounded-full ${statusFilter === f ? 'bg-white/20' : 'bg-amber-500 text-zinc-900'}`}>
                    {counts.draft}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-lime-500/30 border-t-lime-500 rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">Loading harvest drafts…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-8 text-center">
            <AlertTriangle size={28} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-bold text-sm mb-3">{error}</p>
            <button onClick={load} className="px-4 py-2 text-sm border border-white/10 rounded-xl text-zinc-400 hover:bg-white/5">Try Again</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="p-12 text-center">
            <Sprout size={36} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-bold mb-1">
              {drafts.length === 0 ? 'No harvest drafts yet' : 'No drafts match filters'}
            </p>
            <p className="text-zinc-600 text-sm">
              Staff submit harvest drafts from the Staff Portal.
            </p>
          </div>
        )}

        {/* Rows */}
        {!loading && !error && filtered.length > 0 && (
          <div className="divide-y divide-white/5">
            {filtered.map((d, i) => {
              const meta = STATUS_META[d.status] ?? STATUS_META.draft;
              return (
                <motion.div
                  key={d._id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="p-4 flex items-center gap-4 hover:bg-white/2 transition-all cursor-pointer"
                  onClick={() => setSelected(d)}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    d.status === 'draft' ? 'bg-amber-500/10 border border-amber-500/20' :
                    d.status === 'settled' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                    'bg-blue-500/10 border border-blue-500/20'
                  }`}>
                    <Sprout size={14} className={
                      d.status === 'draft' ? 'text-amber-400' :
                      d.status === 'settled' ? 'text-emerald-400' : 'text-blue-400'
                    } />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-zinc-100">{d.farmerName ?? d.farmerId}</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-zinc-500">Pond: {d.pondId}</span>
                      <span className="text-[10px] text-zinc-600">{fmtDate(d.date)}</span>
                      {d.submittedByName && (
                        <span className="text-[10px] text-zinc-600">by {d.submittedByName}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Weight</p>
                    <p className="text-sm font-bold text-zinc-100 mt-0.5">{d.weightKg} kg</p>
                  </div>

                  <Edit3 size={13} className="text-zinc-600 shrink-0" />
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {!loading && !error && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
            <p className="text-[10px] text-zinc-600">{filtered.length} of {drafts.length} drafts</p>
            <p className="text-xs text-zinc-400 font-bold">
              Total: {filtered.reduce((s, d) => s + d.weightKg, 0).toFixed(1)} kg
            </p>
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-zinc-800 border border-white/10 text-zinc-100 text-sm px-4 py-2.5 rounded-xl shadow-xl z-50 flex items-center gap-2"
          >
            <CheckCircle2 size={14} className="text-emerald-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review modal */}
      <AnimatePresence>
        {selected && (
          <ReviewModal
            draft={selected}
            onClose={() => setSelected(null)}
            onDone={() => {
              setSelected(null);
              load();
              showToast('Harvest draft updated');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default HarvestDraftReview;
