import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Package, CheckCircle2, XCircle, Clock, Search, Filter, TrendingUp,
  DollarSign, Scale, Users, AlertTriangle, Truck, BarChart3, RefreshCw,
  Activity, Award, Fish, Wifi, WifiOff, Database, BadgeCheck, ArrowRight,
  MessageCircle, Send, Gavel, ShieldCheck, Star, Banknote, CreditCard,
  ChevronRight, CircleDot, CheckCircle, Loader2, Building2, Receipt,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  fetchHarvestRequests, fetchPonds, fetchFarmers, updateHarvestRequest,
  type LiveHarvestRequest, type LivePond, type LiveFarmer,
} from '../services/aquagrowApi';

// ─── Commission rate ──────────────────────────────────────────────────────────
const COMMISSION_PCT = 5; // 5% platform commission

// ─── Full lifecycle stages ────────────────────────────────────────────────────
export type HarvestStage =
  | 'pending'
  | 'rate_negotiation'
  | 'rate_confirmed'
  | 'buyer_deal'
  | 'buyer_confirmed'
  | 'provider_assigned'
  | 'quality_check'
  | 'quality_approved'
  | 'harvest_started'
  | 'harvested'
  | 'farmer_confirmation'
  | 'delivered'
  | 'buyer_confirmation'
  | 'payment_received'
  | 'finance_audit'
  | 'payment_released'
  | 'completed'
  | 'rejected';

interface StageConfig {
  label: string;
  short: string;
  color: string;
  icon: React.FC<any>;
  actor: 'admin' | 'provider' | 'system';
  description: string;
}

const STAGES: Record<HarvestStage, StageConfig> = {
  pending:          { label: 'Harvest Requested',    short: 'Requested',    color: 'text-amber-400  bg-amber-500/10  border-amber-500/20',  icon: Clock,         actor: 'admin',    description: 'Farmer submitted harvest request — await admin review' },
  rate_negotiation: { label: 'Rate Negotiation',     short: 'Negotiating',  color: 'text-blue-400   bg-blue-500/10   border-blue-500/20',    icon: MessageCircle, actor: 'admin',    description: 'Admin chatting with farmer to finalize rate' },
  rate_confirmed:   { label: 'Rate Confirmed',       short: 'Rate Set',     color: 'text-cyan-400   bg-cyan-500/10   border-cyan-500/20',    icon: CheckCircle2,  actor: 'admin',    description: 'Rate locked, commission calculated' },
  buyer_deal:       { label: 'Buyer Deal in Progress',short: 'Buyer Deal',  color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',  icon: Gavel,         actor: 'admin',    description: 'Admin negotiating deal with buyer at confirmed rate' },
  buyer_confirmed:  { label: 'Buyer Confirmed',      short: 'Buyer Set',    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',  icon: Building2,     actor: 'admin',    description: 'Buyer has agreed to purchase at confirmed rate' },
  provider_assigned:{ label: 'Provider Assigned',    short: 'Provider',     color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',  icon: Users,         actor: 'admin',    description: 'Service provider assigned for harvest operations' },
  quality_check:    { label: 'Quality Check',        short: 'QC',           color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',  icon: Star,          actor: 'provider', description: 'Provider performing on-site quality inspection' },
  quality_approved: { label: 'Quality Approved',     short: 'QC Passed',    color: 'text-lime-400   bg-lime-500/10   border-lime-500/20',    icon: ShieldCheck,   actor: 'provider', description: 'Provider confirmed quality — harvest cleared to proceed' },
  harvest_started:  { label: 'Harvest Started',      short: 'In Progress',  color: 'text-sky-400    bg-sky-500/10    border-sky-500/20',     icon: Activity,      actor: 'provider', description: 'Vehicle dispatched, harvest operation underway' },
  harvested:           { label: 'Harvested',               short: 'Harvested',      color: 'text-teal-400   bg-teal-500/10   border-teal-500/20',    icon: Fish,          actor: 'provider', description: 'Harvest completed and produce collected' },
  farmer_confirmation: { label: 'Farmer Confirmation',      short: 'Farmer Confirm', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',  icon: CheckCircle2,  actor: 'admin',    description: 'Farmer confirms actual harvest quantity and quality' },
  delivered:           { label: 'Delivered to Buyer',       short: 'Delivered',      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: Truck,        actor: 'admin',    description: 'Produce dispatched and delivered to buyer' },
  buyer_confirmation:  { label: 'Buyer Confirmation',       short: 'Buyer Confirm',  color: 'text-rose-400   bg-rose-500/10   border-rose-500/20',    icon: Building2,     actor: 'admin',    description: 'Buyer confirms receipt of produce and agrees to pay' },
  payment_received:    { label: 'Payment Received',         short: 'Buyer Paid',     color: 'text-green-400  bg-green-500/10  border-green-500/20',   icon: Banknote,      actor: 'system',   description: 'Buyer releases payment to company bank account' },
  finance_audit:       { label: 'Finance Team Audit',       short: 'Finance Audit',  color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',  icon: Receipt,       actor: 'admin',    description: 'Finance team audits harvest amount and commission calculation' },
  payment_released:    { label: 'Payment Released to Farmer', short: 'Farmer Paid', color: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20', icon: CreditCard,  actor: 'system',   description: 'Finance team releases net payment to farmer account' },
  completed:           { label: 'Completed',                short: 'Done',           color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: BadgeCheck,   actor: 'system',   description: 'Full harvest lifecycle completed successfully' },
  rejected:            { label: 'Rejected',                 short: 'Rejected',       color: 'text-red-400    bg-red-500/10    border-red-500/20',     icon: XCircle,       actor: 'admin',    description: 'Harvest request rejected' },
};

const PIPELINE_ORDER: HarvestStage[] = [
  'pending','rate_negotiation','rate_confirmed','buyer_deal','buyer_confirmed',
  'provider_assigned','quality_check','quality_approved','harvest_started',
  'harvested','farmer_confirmation','delivered','buyer_confirmation',
  'payment_received','finance_audit','payment_released','completed',
];

function stageIndex(s: string): number {
  return PIPELINE_ORDER.indexOf(s as HarvestStage);
}

// ─── Chat message type ────────────────────────────────────────────────────────
interface ChatMsg { from: 'admin' | 'farmer'; text: string; time: string; }

// ─── Enriched harvest ─────────────────────────────────────────────────────────
interface EnrichedHarvest extends LiveHarvestRequest {
  _pond?: LivePond;
  _farmer?: LiveFarmer;
  _commission?: number;
  _netFarmer?: number;
  _total?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const StageBadge = ({ stage }: { stage: string }) => {
  const cfg = STAGES[stage as HarvestStage];
  if (!cfg) return <span className="text-[10px] px-2 py-0.5 rounded-full border bg-zinc-700/10 text-zinc-500 border-zinc-700/20 font-bold">{stage.toUpperCase()}</span>;
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.color}`}>
      {cfg.short.toUpperCase()}
    </span>
  );
};

const fmtK = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${Math.round(n).toLocaleString('en-IN')}`;

// ─── Progress Timeline ────────────────────────────────────────────────────────
const ProgressTimeline = ({ current }: { current: string }) => {
  const idx = stageIndex(current);
  const showStages = PIPELINE_ORDER.filter(s => s !== 'rejected');
  return (
    <div className="flex items-center gap-0 overflow-x-auto py-3">
      {showStages.map((stage, i) => {
        const done    = i < idx;
        const active  = i === idx;
        const cfg     = STAGES[stage];
        return (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                done   ? 'bg-emerald-500 border-emerald-500 text-white' :
                active ? 'bg-emerald-600 border-emerald-400 text-white animate-pulse' :
                         'bg-zinc-900 border-zinc-700 text-zinc-600'
              }`}>
                {done ? <CheckCircle size={13} /> : active ? <CircleDot size={13} /> : <span className="text-[8px] font-bold">{i+1}</span>}
              </div>
              <p className={`text-[7px] font-bold mt-1 text-center w-12 leading-tight ${done || active ? 'text-zinc-300' : 'text-zinc-700'}`}>
                {cfg.short}
              </p>
            </div>
            {i < showStages.length - 1 && (
              <div className={`flex-1 h-0.5 mx-0.5 min-w-3 ${i < idx ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Commission panel ─────────────────────────────────────────────────────────
const CommissionPanel = ({ h }: { h: EnrichedHarvest }) => {
  const price  = h.price ?? 0;
  const weight = h.finalWeight ?? h.biomass;
  const gross  = price * weight;
  const comm   = Math.round(gross * COMMISSION_PCT / 100);
  const net    = gross - comm;
  return (
    <div className="p-4 rounded-2xl bg-white/3 border border-white/5 space-y-2.5">
      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"><Receipt size={12} className="text-emerald-400" /> Payment Breakdown</p>
      {[
        { label: 'Weight',           value: `${weight.toLocaleString()} kg`, color: '' },
        { label: 'Rate /kg',         value: price ? `₹${price}` : '—', color: '' },
        { label: 'Gross Amount',     value: gross ? fmtK(gross) : '—', color: 'text-white' },
        { label: `Commission (${COMMISSION_PCT}%)`, value: comm ? fmtK(comm) : '—', color: 'text-red-400' },
        { label: 'Net to Farmer',    value: net ? fmtK(net) : '—', color: 'text-emerald-400' },
      ].map(({ label, value, color }) => (
        <div key={label} className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">{label}</span>
          <span className={`font-bold font-mono ${color}`}>{value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Chat Panel ──────────────────────────────────────────────────────────────
const ChatPanel = ({ harvestId, farmerName, messages, onSend }: {
  harvestId: string; farmerName: string;
  messages: ChatMsg[]; onSend: (id: string, text: string) => void;
}) => {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  return (
    <div className="flex flex-col h-72 rounded-2xl bg-white/3 border border-white/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <MessageCircle size={14} className="text-blue-400" />
        <p className="text-sm font-bold">Rate Negotiation — {farmerName}</p>
        <span className="ml-auto text-[9px] text-zinc-600 font-bold">ADMIN ↔ FARMER</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-xs text-zinc-700 mt-6">Start negotiation by sending the proposed rate to farmer</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'admin' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
              m.from === 'admin' ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white/8 text-zinc-200 rounded-bl-sm'
            }`}>
              <p>{m.text}</p>
              <p className={`text-[9px] mt-0.5 ${m.from === 'admin' ? 'text-emerald-200' : 'text-zinc-500'}`}>{m.time}</p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t border-white/5 flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && text.trim()) { onSend(harvestId, text.trim()); setText(''); } }}
          placeholder="Type rate proposal or message..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50" />
        <button onClick={() => { if (text.trim()) { onSend(harvestId, text.trim()); setText(''); } }}
          className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all">
          <Send size={14} />
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  HARVEST DETAIL PANEL
// ═══════════════════════════════════════════════════════════════════════════════
const HarvestDetail = ({
  h, chat, onChat, onAdvance, onReject, advancing,
}: {
  h: EnrichedHarvest;
  chat: ChatMsg[];
  onChat: (id: string, text: string) => void;
  onAdvance: (id: string, to: HarvestStage, patch?: any) => Promise<void>;
  onReject: (id: string) => void;
  advancing: boolean;
}) => {
  const [price, setPrice] = useState(h.price ?? 450);
  const [weight, setWeight] = useState(h.finalWeight ?? h.biomass);
  const [buyerName, setBuyerName] = useState('');
  const [providerName, setProviderName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');

  const stage = h.status as HarvestStage;
  const idx = stageIndex(stage);
  const gross   = price * weight;
  const commiAmt = Math.round(gross * COMMISSION_PCT / 100);
  const netFarmer = gross - commiAmt;

  return (
    <div className="space-y-5">
      {/* Timeline */}
      <div className="card p-5">
        <p className="text-xs font-bold text-zinc-500 uppercase mb-3">Harvest Pipeline Progress</p>
        <ProgressTimeline current={stage} />
      </div>

      {/* Stage info banner */}
      <div className={`flex items-start gap-3 p-4 rounded-2xl border ${STAGES[stage]?.color ?? 'border-white/10'}`}>
        {React.createElement(STAGES[stage]?.icon ?? CircleDot, { size: 18, className: 'shrink-0 mt-0.5' })}
        <div>
          <p className="font-bold text-sm">{STAGES[stage]?.label ?? stage}</p>
          <p className="text-xs opacity-70 mt-0.5">{STAGES[stage]?.description}</p>
          <p className="text-[10px] opacity-50 mt-1">
            Actor: {STAGES[stage]?.actor?.toUpperCase() ?? '—'}
          </p>
        </div>
      </div>

      {/* Commission always visible once price is set */}
      <CommissionPanel h={{ ...h, price, _pond: h._pond, _farmer: h._farmer, finalWeight: weight } as any} />

      {/* ── Stage-specific actions ── */}

      {/* 1. PENDING → Rate Negotiation */}
      {stage === 'pending' && (
        <div className="card p-5 space-y-4">
          <h4 className="font-bold flex items-center gap-2"><MessageCircle size={15} className="text-blue-400" /> Start Rate Negotiation</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">Proposed Rate (₹/kg)</label>
              <input type="number" value={price} onChange={e => setPrice(+e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50" />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">Est. Weight (kg)</label>
              <input type="number" value={weight} onChange={e => setWeight(+e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onAdvance(h._id, 'rate_negotiation', { price, finalWeight: weight, status: 'rate_negotiation' })}
              disabled={advancing} className="flex-1 text-sm font-bold py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all flex items-center justify-center gap-2">
              {advancing ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
              Start Negotiation
            </button>
            <button onClick={() => onReject(h._id)}
              className="px-4 py-2.5 text-sm font-bold rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5">
              <XCircle size={14} /> Reject
            </button>
          </div>
        </div>
      )}

      {/* 2. RATE NEGOTIATION — chat + confirm */}
      {stage === 'rate_negotiation' && (
        <div className="card p-5 space-y-4">
          <h4 className="font-bold flex items-center gap-2"><MessageCircle size={15} className="text-blue-400" /> Chat with Farmer — Rate Negotiation</h4>
          <ChatPanel harvestId={h._id} farmerName={h._farmer?.name ?? 'Farmer'} messages={chat} onSend={onChat} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">Final Rate (₹/kg)</label>
              <input type="number" value={price} onChange={e => setPrice(+e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50" />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">Final Weight (kg)</label>
              <input type="number" value={weight} onChange={e => setWeight(+e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50" />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-sm">
            <p className="text-xs text-zinc-400">Total deal value after {COMMISSION_PCT}% commission</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{fmtK(netFarmer)} <span className="text-xs text-zinc-500 font-normal">to farmer</span></p>
            <p className="text-xs text-zinc-500 mt-0.5">Commission: {fmtK(commiAmt)} → AquaGrow account</p>
          </div>
          <button onClick={() => onAdvance(h._id, 'rate_confirmed', { price, finalWeight: weight, status: 'rate_confirmed' })}
            disabled={advancing} className="w-full text-sm font-bold py-2.5 rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 transition-all flex items-center justify-center gap-2">
            {advancing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Confirm Rate & Lock Deal
          </button>
        </div>
      )}

      {/* 3. RATE CONFIRMED → Buyer Deal */}
      {stage === 'rate_confirmed' && (
        <div className="card p-5 space-y-4">
          <h4 className="font-bold flex items-center gap-2"><Gavel size={15} className="text-purple-400" /> Find Buyer at ₹{h.price}/kg</h4>
          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-xs text-purple-300">
            Rate locked at <span className="font-bold">₹{h.price}/kg</span> · Total deal <span className="font-bold">{fmtK((h.price ?? 0) * (h.finalWeight ?? h.biomass))}</span>
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">Buyer Name / Company</label>
            <input value={buyerName} onChange={e => setBuyerName(e.target.value)}
              placeholder="e.g. Blue Ocean Traders"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/50" />
          </div>
          <button onClick={() => onAdvance(h._id, 'buyer_deal', { status: 'buyer_deal' })}
            disabled={advancing} className="w-full text-sm font-bold py-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition-all flex items-center justify-center gap-2">
            {advancing ? <Loader2 size={14} className="animate-spin" /> : <Gavel size={14} />}
            Start Buyer Negotiation
          </button>
        </div>
      )}

      {/* 4. BUYER DEAL → Confirm buyer */}
      {stage === 'buyer_deal' && (
        <div className="card p-5 space-y-4">
          <h4 className="font-bold flex items-center gap-2"><Building2 size={15} className="text-violet-400" /> Confirm Buyer Agreement</h4>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">Buyer Name</label>
            <input value={buyerName} onChange={e => setBuyerName(e.target.value)}
              placeholder="Buyer name or company"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/50" />
          </div>
          <button onClick={() => onAdvance(h._id, 'buyer_confirmed', { status: 'buyer_confirmed' })}
            disabled={!buyerName.trim() || advancing}
            className="w-full text-sm font-bold py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {advancing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Confirm Buyer Deal
          </button>
        </div>
      )}

      {/* 5. BUYER CONFIRMED → Assign Provider */}
      {stage === 'buyer_confirmed' && (
        <div className="card p-5 space-y-4">
          <h4 className="font-bold flex items-center gap-2"><Users size={15} className="text-indigo-400" /> Assign Service Provider</h4>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">Provider Name</label>
            <input value={providerName} onChange={e => setProviderName(e.target.value)}
              placeholder="e.g. AquaHarvest Services"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50" />
          </div>
          <button onClick={() => onAdvance(h._id, 'provider_assigned', { status: 'provider_assigned' })}
            disabled={!providerName.trim() || advancing}
            className="w-full text-sm font-bold py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {advancing ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
            Assign Provider
          </button>
        </div>
      )}

      {/* 6. PROVIDER ASSIGNED → Quality Check starts */}
      {stage === 'provider_assigned' && (
        <div className="card p-5 space-y-4">
          <h4 className="font-bold flex items-center gap-2"><Star size={15} className="text-orange-400" /> Initiate Quality Check</h4>
          <p className="text-sm text-zinc-400">Provider will visit the pond to inspect shrimp quality, water parameters, and biomass estimate.</p>
          <button onClick={() => onAdvance(h._id, 'quality_check', { status: 'quality_check' })}
            disabled={advancing} className="w-full text-sm font-bold py-2.5 rounded-xl bg-orange-600 text-white hover:bg-orange-500 transition-all flex items-center justify-center gap-2">
            {advancing ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
            Start Quality Check
          </button>
        </div>
      )}

      {/* 7. QUALITY CHECK → Provider approves */}
      {stage === 'quality_check' && (
        <div className="card p-5 space-y-4">
          <h4 className="font-bold flex items-center gap-2"><ShieldCheck size={15} className="text-lime-400" /> Provider Quality Approval</h4>
          <div className="space-y-2">
            {['Water quality parameters verified', 'Shrimp health condition checked', 'Biomass estimate validated', 'No disease indicators found'].map(item => (
              <div key={item} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/3 border border-white/5">
                <CheckCircle2 size={13} className="text-lime-400 shrink-0" />
                <span className="text-xs text-zinc-300">{item}</span>
              </div>
            ))}
          </div>
          <button onClick={() => onAdvance(h._id, 'quality_approved', { status: 'quality_approved' })}
            disabled={advancing} className="w-full text-sm font-bold py-2.5 rounded-xl bg-lime-700 text-white hover:bg-lime-600 transition-all flex items-center justify-center gap-2">
            {advancing ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            Approve Quality — Clear for Harvest
          </button>
        </div>
      )}

      {/* 8. QUALITY APPROVED → Start harvest */}
      {stage === 'quality_approved' && (
        <div className="card p-5 space-y-4">
          <h4 className="font-bold flex items-center gap-2"><Truck size={15} className="text-sky-400" /> Dispatch Harvest Vehicle</h4>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">Vehicle Number</label>
            <input value={vehicleNo} onChange={e => setVehicleNo(e.target.value)}
              placeholder="e.g. TN-01-AB-1234"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/50" />
          </div>
          <button onClick={() => onAdvance(h._id, 'harvest_started', { status: 'harvest_started' })}
            disabled={advancing} className="w-full text-sm font-bold py-2.5 rounded-xl bg-sky-600 text-white hover:bg-sky-500 transition-all flex items-center justify-center gap-2">
            {advancing ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
            Dispatch & Start Harvest
          </button>
        </div>
      )}

      {/* 9. HARVEST STARTED → Mark harvested */}
      {stage === 'harvest_started' && (
        <div className="card p-5 space-y-4">
          <h4 className="font-bold flex items-center gap-2"><Fish size={15} className="text-teal-400" /> Confirm Harvest Complete</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">Actual Weight (kg)</label>
              <input type="number" value={weight} onChange={e => setWeight(+e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500/50" />
            </div>
            <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/10 flex flex-col justify-center">
              <p className="text-[10px] text-zinc-500">Final Amount</p>
              <p className="font-bold text-teal-400 font-mono">{fmtK(price * weight)}</p>
            </div>
          </div>
          <button onClick={() => onAdvance(h._id, 'harvested', { status: 'harvested', finalWeight: weight })}
            disabled={advancing} className="w-full text-sm font-bold py-2.5 rounded-xl bg-teal-700 text-white hover:bg-teal-600 transition-all flex items-center justify-center gap-2">
            {advancing ? <Loader2 size={14} className="animate-spin" /> : <Fish size={14} />}
            Mark as Harvested
          </button>
        </div>
      )}

      {/* 10. HARVESTED → Farmer Confirmation */}
      {stage === 'harvested' && (
        <div className="card p-5 space-y-4">
          <h4 className="font-bold flex items-center gap-2"><CheckCircle2 size={15} className="text-yellow-400" /> Get Farmer Confirmation</h4>
          <p className="text-sm text-zinc-400">Farmer must confirm the actual harvested quantity matches expectations before dispatch.</p>
          <div className="space-y-2">
            {[
              `Farmer: ${h._farmer?.name ?? 'Farmer'}`,
              `Pond: ${h._pond?.name ?? `Pond…${h.pondId.slice(-6)}`}`,
              `Harvest weight: ${(h.finalWeight ?? h.biomass).toLocaleString()} kg`,
              `Agreed rate: ₹${h.price ?? '—'}/kg`,
            ].map(item => (
              <div key={item} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/3 border border-white/5">
                <CheckCircle2 size={12} className="text-yellow-400 shrink-0" />
                <span className="text-xs text-zinc-300">{item}</span>
              </div>
            ))}
          </div>
          <button onClick={() => onAdvance(h._id, 'farmer_confirmation', { status: 'farmer_confirmation' })}
            disabled={advancing} className="w-full text-sm font-bold py-2.5 rounded-xl bg-yellow-600 text-white hover:bg-yellow-500 transition-all flex items-center justify-center gap-2">
            {advancing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Mark Farmer Confirmed ✓
          </button>
        </div>
      )}

      {/* 11. FARMER CONFIRMATION → Delivered */}
      {stage === 'farmer_confirmation' && (
        <div className="card p-5 space-y-4">
          <h4 className="font-bold flex items-center gap-2"><Truck size={15} className="text-emerald-400" /> Dispatch & Deliver to Buyer</h4>
          <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10 text-xs text-yellow-300">
            ✓ Farmer confirmed — produce ready for dispatch to buyer
          </div>
          <button onClick={() => onAdvance(h._id, 'delivered', { status: 'delivered' })}
            disabled={advancing} className="w-full text-sm font-bold py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all flex items-center justify-center gap-2">
            {advancing ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
            Confirm Delivered to Buyer
          </button>
        </div>
      )}

      {/* 12. DELIVERED → Buyer Confirmation */}
      {stage === 'delivered' && (
        <div className="card p-5 space-y-4">
          <h4 className="font-bold flex items-center gap-2"><Building2 size={15} className="text-rose-400" /> Get Buyer Confirmation</h4>
          <p className="text-sm text-zinc-400">Buyer must confirm receipt of produce and agree to release payment.</p>
          <div className="space-y-2">
            {[
              'Buyer inspects received produce',
              'Quantity matches delivery note',
              'Quality matches agreed grade',
              'Buyer agrees to release payment',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/3 border border-white/5">
                <CheckCircle2 size={12} className="text-rose-400 shrink-0" />
                <span className="text-xs text-zinc-300">{item}</span>
              </div>
            ))}
          </div>
          <button onClick={() => onAdvance(h._id, 'buyer_confirmation', { status: 'buyer_confirmation' })}
            disabled={advancing} className="w-full text-sm font-bold py-2.5 rounded-xl bg-rose-700 text-white hover:bg-rose-600 transition-all flex items-center justify-center gap-2">
            {advancing ? <Loader2 size={14} className="animate-spin" /> : <Building2 size={14} />}
            Mark Buyer Confirmed ✓
          </button>
        </div>
      )}

      {/* 13. BUYER CONFIRMATION → Payment Received */}
      {stage === 'buyer_confirmation' && (
        <div className="card p-5 space-y-4">
          <h4 className="font-bold flex items-center gap-2"><Banknote size={15} className="text-green-400" /> Buyer Releases Payment</h4>
          <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-zinc-400">Gross Amount</span><span className="font-bold">{fmtK((h.price ?? 0) * (h.finalWeight ?? h.biomass))}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-400">Commission ({COMMISSION_PCT}%)</span><span className="font-bold text-red-400">− {fmtK(Math.round((h.price ?? 0) * (h.finalWeight ?? h.biomass) * COMMISSION_PCT / 100))}</span></div>
            <div className="flex justify-between text-sm border-t border-white/5 pt-2"><span className="text-zinc-400">Net to Farmer</span><span className="font-bold text-green-400">{fmtK(Math.round((h.price ?? 0) * (h.finalWeight ?? h.biomass) * (100 - COMMISSION_PCT) / 100))}</span></div>
          </div>
          <p className="text-xs text-zinc-500">Buyer has confirmed receipt — mark payment received in company bank account.</p>
          <button onClick={() => onAdvance(h._id, 'payment_received', { status: 'payment_received', finalTotal: (h.price ?? 0) * (h.finalWeight ?? h.biomass) })}
            disabled={advancing} className="w-full text-sm font-bold py-2.5 rounded-xl bg-green-700 text-white hover:bg-green-600 transition-all flex items-center justify-center gap-2">
            {advancing ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={14} />}
            Mark Payment Received from Buyer
          </button>
        </div>
      )}

      {/* 14. PAYMENT RECEIVED → Finance Audit */}
      {stage === 'payment_received' && (
        <div className="card p-5 space-y-4">
          <h4 className="font-bold flex items-center gap-2"><Receipt size={15} className="text-orange-400" /> Finance Team Audit</h4>
          <p className="text-sm text-zinc-400">Finance team reviews and audits the harvest transaction — verifies amounts, commission, and payment before releasing to farmer.</p>
          <div className="space-y-2">
            {[
              { label: 'Gross amount',          value: fmtK((h.price ?? 0) * (h.finalWeight ?? h.biomass)) },
              { label: `Commission (${COMMISSION_PCT}%)`, value: `− ${fmtK(Math.round((h.price ?? 0) * (h.finalWeight ?? h.biomass) * COMMISSION_PCT / 100))}` },
              { label: 'Net to farmer',          value: fmtK(Math.round((h.price ?? 0) * (h.finalWeight ?? h.biomass) * (100 - COMMISSION_PCT) / 100)) },
              { label: 'Harvest weight',         value: `${(h.finalWeight ?? h.biomass).toLocaleString()} kg` },
              { label: 'Rate per kg',            value: `₹${h.price ?? '—'}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between p-2.5 rounded-xl bg-white/3 border border-white/5">
                <span className="text-xs text-zinc-400">{label}</span>
                <span className="text-xs font-bold text-zinc-200 font-mono">{value}</span>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 text-xs text-orange-300">
            ⚠ Finance admin must review and approve before payment is released to farmer
          </div>
          <button onClick={() => onAdvance(h._id, 'finance_audit', { status: 'finance_audit' })}
            disabled={advancing} className="w-full text-sm font-bold py-2.5 rounded-xl bg-orange-700 text-white hover:bg-orange-600 transition-all flex items-center justify-center gap-2">
            {advancing ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />}
            Send for Finance Audit
          </button>
        </div>
      )}

      {/* 15. FINANCE AUDIT → Release to Farmer */}
      {stage === 'finance_audit' && (
        <div className="card p-5 space-y-4">
          <h4 className="font-bold flex items-center gap-2"><CreditCard size={15} className="text-emerald-300" /> Finance: Approve & Release to Farmer</h4>
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
            <p className="text-xs text-zinc-400 mb-1">Audited net amount (after {COMMISSION_PCT}% commission)</p>
            <p className="text-2xl font-bold text-emerald-400">{fmtK(Math.round((h.finalTotal ?? (h.price ?? 0) * (h.finalWeight ?? h.biomass)) * (100 - COMMISSION_PCT) / 100))}</p>
            <p className="text-xs text-zinc-500 mt-1">→ Will be transferred to farmer bank account</p>
          </div>
          <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
            <p className="text-xs font-bold text-orange-400 mb-2">Finance Audit Checklist</p>
            <div className="space-y-1.5">
              {['Amount matches approved harvest record', 'Commission correctly deducted', 'No pending disputes on this harvest', 'Farmer bank details verified'].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle2 size={11} className="text-orange-400 shrink-0" />{item}
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => onAdvance(h._id, 'payment_released', { status: 'payment_released' })}
            disabled={advancing} className="w-full text-sm font-bold py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all flex items-center justify-center gap-2">
            {advancing ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
            Finance Approved — Release Net Payment to Farmer
          </button>
        </div>
      )}

      {/* 16. PAYMENT RELEASED → Complete */}
      {stage === 'payment_released' && (
        <div className="card p-5 space-y-4">
          <h4 className="font-bold flex items-center gap-2"><BadgeCheck size={15} className="text-emerald-400" /> Mark Harvest Complete</h4>
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-300">
            ✓ Payment released to farmer — all stakeholders settled
          </div>
          <button onClick={() => onAdvance(h._id, 'completed', { status: 'completed' })}
            disabled={advancing} className="w-full text-sm font-bold py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all flex items-center justify-center gap-2">
            {advancing ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
            Complete Harvest Lifecycle ✓
          </button>
        </div>
      )}

      {/* COMPLETED */}
      {stage === 'completed' && (
        <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center">
          <BadgeCheck size={36} className="mx-auto text-emerald-400 mb-2" />
          <p className="font-bold text-emerald-400 text-lg">Harvest Lifecycle Complete</p>
          <p className="text-xs text-zinc-400 mt-1">All stages passed. Farmer paid. Commission settled.</p>
        </div>
      )}

      {/* REJECTED */}
      {stage === 'rejected' && (
        <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 text-center">
          <XCircle size={36} className="mx-auto text-red-400 mb-2" />
          <p className="font-bold text-red-400">Harvest Rejected</p>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const HarvestManagement = () => {
  const [harvests, setHarvests] = useState<LiveHarvestRequest[]>([]);
  const [ponds, setPonds]       = useState<LivePond[]>([]);
  const [farmers, setFarmers]   = useState<LiveFarmer[]>([]);
  const [loading, setLoading]   = useState(true);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'loading'>('loading');
  const [lastSync, setLastSync]   = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [filterStage, setFilterStage] = useState<'all' | HarvestStage>('all');
  const [filterYear,  setFilterYear]  = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterDate,  setFilterDate]  = useState('all');
  const [selected, setSelected] = useState<string | null>(null);    // harvest _id
  const [advancing, setAdvancing] = useState(false);
  // Chat messages keyed by harvestId
  const [chats, setChats] = useState<Record<string, ChatMsg[]>>({});

  const load = useCallback(async () => {
    setLoading(true); setApiStatus('loading');
    try {
      const [h, p, f] = await Promise.allSettled([
        fetchHarvestRequests(), fetchPonds(), fetchFarmers(),
      ]);
      if (h.status === 'fulfilled') setHarvests(h.value);
      if (p.status === 'fulfilled') setPonds(p.value);
      if (f.status === 'fulfilled') setFarmers(f.value);
      setApiStatus('online');
      setLastSync(new Date().toLocaleTimeString());
    } catch { setApiStatus('offline'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Enrich harvests
  const enriched: EnrichedHarvest[] = useMemo(() => harvests.map(h => {
    const pond   = ponds.find(p => p._id === h.pondId);
    const farmer = farmers.find(f => f._id === h.userId);
    const gross  = (h.price ?? 0) * (h.finalWeight ?? h.biomass);
    const comm   = Math.round(gross * COMMISSION_PCT / 100);
    return { ...h, _pond: pond, _farmer: farmer, _total: gross, _commission: comm, _netFarmer: gross - comm };
  }), [harvests, ponds, farmers]);

  // Stats
  const stats = useMemo(() => {
    const byStage = (s: string) => enriched.filter(h => h.status === s).length;
    return {
      pending:   byStage('pending'),
      active:    enriched.filter(h => !['pending','completed','rejected'].includes(h.status)).length,
      completed: byStage('completed'),
      totalRevenue: enriched.filter(h => h.status === 'completed').reduce((s, h) => s + (h.finalTotal ?? 0), 0),
      commission: enriched.filter(h => h._commission).reduce((s, h) => s + (h._commission ?? 0), 0),
    };
  }, [enriched]);

  // Date filter helpers
  const harvestYears = useMemo(() => {
    const ys = [...new Set(enriched.map(h => (h.createdAt ?? '').slice(0, 4)).filter(Boolean))];
    return ys.sort().reverse();
  }, [enriched]);
  const harvestMonths = useMemo(() => {
    if (filterYear === 'all') return [];
    const ms = [...new Set(enriched.filter(h => (h.createdAt ?? '').startsWith(filterYear)).map(h => (h.createdAt ?? '').slice(0, 7)).filter(Boolean))];
    return ms.sort().reverse();
  }, [enriched, filterYear]);
  const harvestDates = useMemo(() => {
    if (filterMonth === 'all') return [];
    const ds = [...new Set(enriched.filter(h => (h.createdAt ?? '').startsWith(filterMonth)).map(h => (h.createdAt ?? '').slice(0, 10)).filter(Boolean))];
    return ds.sort().reverse();
  }, [enriched, filterMonth]);

  // Filtered
  const filtered = useMemo(() => enriched.filter(h => {
    const ms = [h._farmer?.name, h._pond?.name, h._id.slice(-6)].some(s =>
      s?.toLowerCase().includes(search.toLowerCase())
    );
    const mf = filterStage === 'all' || h.status === filterStage;
    const d  = h.createdAt ?? '';
    const my = filterYear  === 'all' || d.startsWith(filterYear);
    const mm = filterMonth === 'all' || d.startsWith(filterMonth);
    const md = filterDate  === 'all' || d.slice(0, 10) === filterDate;
    return ms && mf && my && mm && md;
  }), [enriched, search, filterStage, filterYear, filterMonth, filterDate]);

  const selectedHarvest = useMemo(() => enriched.find(h => h._id === selected), [enriched, selected]);

  // Advance stage
  const handleAdvance = useCallback(async (id: string, to: HarvestStage, patch?: any) => {
    setAdvancing(true);
    try {
      await updateHarvestRequest(id, { ...patch, status: to });
      await load();
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setAdvancing(false); }
  }, [load]);

  const handleReject = useCallback(async (id: string) => {
    if (!window.confirm('Reject this harvest request?')) return;
    await handleAdvance(id, 'rejected');
    setSelected(null);
  }, [handleAdvance]);

  // Chat
  const handleChat = useCallback((id: string, text: string) => {
    const msg: ChatMsg = { from: 'admin', text, time: new Date().toLocaleTimeString() };
    setChats(prev => ({ ...prev, [id]: [...(prev[id] ?? []), msg] }));
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-1">Harvest Management</h1>
          <p className="text-zinc-400 text-sm">Full lifecycle — Request → Rate → Buyer → Provider → Quality → Harvest → Payment</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${
            apiStatus === 'online' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
            apiStatus === 'offline' ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-zinc-500/5 border-zinc-500/20 text-zinc-500'
          }`}>
            {apiStatus === 'online' ? <Wifi size={12}/> : apiStatus==='offline' ? <WifiOff size={12}/> : <RefreshCw size={12} className="animate-spin"/>}
            {apiStatus === 'online' ? 'DB Live' : apiStatus === 'offline' ? 'DB Offline' : 'Syncing...'}
          </div>
          {lastSync && <span className="text-[10px] text-zinc-600">Synced {lastSync}</span>}
          <button onClick={load} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/> Refresh
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Pending Review', value: stats.pending,    color: 'text-amber-400',   icon: Clock },
          { label: 'Active',         value: stats.active,     color: 'text-blue-400',    icon: Activity },
          { label: 'Completed',      value: stats.completed,  color: 'text-emerald-400', icon: BadgeCheck },
          { label: 'Total Revenue',  value: fmtK(stats.totalRevenue), color: 'text-emerald-400', icon: DollarSign },
          { label: `Commission (${COMMISSION_PCT}%)`, value: fmtK(stats.commission), color: 'text-purple-400', icon: Receipt },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-[9px] text-zinc-500 uppercase font-bold">{label}</p>
              <p className={`text-lg font-display font-bold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Left: Harvest list */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-44">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"/>
              <input className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Search farmer, pond..." value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            {/* Stage filter */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <Filter size={13} className="text-zinc-500"/>
              <select value={filterStage} onChange={e => setFilterStage(e.target.value as any)} className="bg-transparent outline-none text-sm">
                <option value="all">All Stages</option>
                {PIPELINE_ORDER.map(s => <option key={s} value={s}>{STAGES[s].short}</option>)}
                <option value="rejected">Rejected</option>
              </select>
            </div>
            {/* Year filter */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <span className="text-zinc-500 text-xs font-bold">📅</span>
              <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setFilterMonth('all'); setFilterDate('all'); }} className="bg-transparent outline-none text-sm">
                <option value="all">All Years</option>
                {harvestYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {/* Month filter */}
            {filterYear !== 'all' && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <select value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setFilterDate('all'); }} className="bg-transparent outline-none text-sm">
                  <option value="all">All Months</option>
                  {harvestMonths.map(m => <option key={m} value={m}>{new Date(m + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</option>)}
                </select>
              </div>
            )}
            {/* Date filter */}
            {filterMonth !== 'all' && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <select value={filterDate} onChange={e => setFilterDate(e.target.value)} className="bg-transparent outline-none text-sm">
                  <option value="all">All Dates</option>
                  {harvestDates.map(d => <option key={d} value={d}>{new Date(d).toLocaleDateString('en-IN', { day: 'numeric', weekday: 'short' })}</option>)}
                </select>
              </div>
            )}
            {/* Clear date filters */}
            {(filterYear !== 'all' || filterMonth !== 'all' || filterDate !== 'all') && (
              <button onClick={() => { setFilterYear('all'); setFilterMonth('all'); setFilterDate('all'); }}
                className="px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all">✕ Clear</button>
            )}
            <p className="flex items-center text-xs text-zinc-500 px-1">{filtered.length} harvests</p>
          </div>

          {/* Pipeline kanban (compact) */}
          <div className="card p-4">
            <p className="text-xs font-bold text-zinc-500 uppercase mb-3">Pipeline Overview</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {PIPELINE_ORDER.map(s => {
                const count = enriched.filter(h => h.status === s).length;
                if (count === 0) return null;
                const cfg = STAGES[s];
                const [textC] = cfg.color.split(' ');
                return (
                  <button key={s} onClick={() => setFilterStage(filterStage === s ? 'all' : s)}
                    className={`flex flex-col items-center shrink-0 px-3 py-2.5 rounded-xl border transition-all ${filterStage === s ? 'bg-white/10 border-white/20' : 'bg-white/3 border-white/5 hover:border-white/15'}`}>
                    <p className={`text-xl font-bold ${textC}`}>{count}</p>
                    <p className="text-[9px] text-zinc-500 font-bold mt-0.5">{cfg.short}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Harvest cards */}
          {loading ? (
            <div className="card p-12 text-center animate-pulse">
              <Database size={28} className="mx-auto text-zinc-700 mb-3"/>
              <p className="text-zinc-600">Loading from MongoDB...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <Package size={32} className="mx-auto text-zinc-600 mb-3"/>
              <p className="text-zinc-500">{harvests.length === 0 ? 'No harvest requests in database' : 'No matches found'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((h, i) => {
                const isSelected = selected === h._id;
                const idx = stageIndex(h.status);
                const progress = Math.round((idx / (PIPELINE_ORDER.length - 1)) * 100);
                return (
                  <motion.div key={h._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setSelected(isSelected ? null : h._id)}
                    className={`card p-5 cursor-pointer hover:border-white/20 transition-all ${isSelected ? 'border-emerald-500/40 bg-emerald-500/3' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold">{h._farmer?.name ?? `User…${h.userId.slice(-6)}`}</p>
                          <StageBadge stage={h.status} />
                        </div>
                        <p className="text-xs text-zinc-500">{h._pond?.name ?? `Pond…${h.pondId.slice(-6)}`} · {h.biomass.toLocaleString()} kg · Avg {h.avgWeight}g</p>
                      </div>
                      <div className="text-right">
                        {h.price && <p className="text-emerald-400 font-bold font-mono">₹{h.price}/kg</p>}
                        <p className="text-[10px] text-zinc-500 mt-0.5">{new Date(h.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    {h.status !== 'rejected' && (
                      <div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.6 }}
                            className="h-full bg-emerald-500 rounded-full" />
                        </div>
                        <p className="text-[9px] text-zinc-600 mt-1">Stage {idx + 1} of {PIPELINE_ORDER.length} · {progress}% complete</p>
                      </div>
                    )}
                    {/* Commission preview */}
                    {h.price && h.status !== 'pending' && (
                      <div className="mt-3 flex gap-3 text-[10px]">
                        <span className="text-zinc-500">Gross: <span className="text-white font-bold">{fmtK((h.price) * (h.finalWeight ?? h.biomass))}</span></span>
                        <span className="text-zinc-500">Commission: <span className="text-purple-400 font-bold">{fmtK(h._commission ?? 0)}</span></span>
                        <span className="text-zinc-500">Farmer: <span className="text-emerald-400 font-bold">{fmtK(h._netFarmer ?? 0)}</span></span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Detail panel */}
        <AnimatePresence>
          {selectedHarvest && (
            <motion.div key={selectedHarvest._id}
              initial={{ opacity: 0, x: 20, width: 0 }} animate={{ opacity: 1, x: 0, width: '400px' }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              className="w-[400px] shrink-0 overflow-y-auto max-h-[calc(100vh-160px)] sticky top-20">
              <div className="space-y-3">
                {/* Detail header */}
                <div className="card p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-lg">{selectedHarvest._farmer?.name ?? 'Farmer'}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{selectedHarvest._farmer?.phoneNumber} · {selectedHarvest._pond?.name ?? `Pond…${selectedHarvest.pondId.slice(-6)}`}</p>
                      <p className="text-xs text-zinc-500">{selectedHarvest.biomass.toLocaleString()} kg estimated · Avg {selectedHarvest.avgWeight}g/shrimp</p>
                    </div>
                    <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500">
                      <XCircle size={16}/>
                    </button>
                  </div>
                </div>

                <HarvestDetail
                  h={selectedHarvest}
                  chat={chats[selectedHarvest._id] ?? []}
                  onChat={handleChat}
                  onAdvance={handleAdvance}
                  onReject={handleReject}
                  advancing={advancing}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HarvestManagement;
