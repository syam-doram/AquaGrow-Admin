import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Search, Filter, Star, MapPin, ShieldCheck, AlertTriangle,
  UserPlus, X, CheckCircle2, XCircle, Flag, Phone, Mail, TrendingUp,
  BarChart3, DollarSign, Activity, Award, Zap, Lock, Unlock, Trash2,
  Clock, Eye, RefreshCw, Shield, Target, Building2, Tag, MessageSquare,
  CreditCard, Layers, ChevronRight, ArrowUpRight, Navigation2, Route,
  CheckSquare, Camera, Bell, Hexagon, Handshake, FileBarChart, Link2,
  Calendar, Fuel, ClipboardCheck, RadioTower, Gauge, AlertCircle,
  UserCheck, TrendingDown, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Provider, Farmer, Ticket } from '../types';
import { storageService } from '../services/storageService';

// ─── Field Tracking Types ─────────────────────────────────────────────────────
interface ProviderArea {
  id: string;
  providerId: string;
  state: string;
  district: string;
  mandal: string;
  villages: string[];
  geoFenceRadius: number; // km
}

interface CheckInRecord {
  id: string;
  providerId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  checkInLocation: string;
  checkOutLocation: string;
  workHours: number;
  distanceCovered: number; // km
  status: 'ACTIVE' | 'DONE' | 'MISSED';
}

interface ProviderFieldVisit {
  id: string;
  providerId: string;
  farmerName: string;
  farmName: string;
  pondDetails: string;
  visitDate: string;
  purpose: 'SALES' | 'SUPPORT' | 'INSPECTION' | 'INSTALLATION' | 'FOLLOWUP';
  notes: string;
  gpsCaptured: boolean;
  photoUploaded: boolean;
  location: string;
  outcome: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
}

interface ProviderTask {
  id: string;
  providerId: string;
  title: string;
  description: string;
  category: 'FARM_VISIT' | 'DEVICE_INSTALL' | 'SALES' | 'SUPPORT' | 'INSPECTION';
  targetCount: number;
  completedCount: number;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
}

interface DailyReport {
  providerId: string;
  date: string;
  totalVisits: number;
  distanceTravelled: number;
  salesAmount: number;
  farmersContacted: number;
  devicesInstalled: number;
  checkInTime: string;
  checkOutTime: string;
}

interface TrackingAlert {
  id: string;
  providerId: string;
  type: 'NO_CHECKIN' | 'IDLE' | 'OUTSIDE_AREA' | 'NO_ACTIVITY' | 'LATE';
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  resolved: boolean;
}

// ─── Field Tracking Seed Data ─────────────────────────────────────────────────
const SEED_AREAS: ProviderArea[] = [
  { id: 'A001', providerId: 'P001', state: 'Andhra Pradesh', district: 'Nellore', mandal: 'Nellore Urban', villages: ['Trunk Road', 'Magunta Layout', 'Industrial Area'], geoFenceRadius: 30 },
  { id: 'A002', providerId: 'P002', state: 'Andhra Pradesh', district: 'West Godavari', mandal: 'Bhimavaram', villages: ['Bhimavaram Town', 'Tadepalligudem', 'Narasapuram'], geoFenceRadius: 45 },
  { id: 'A003', providerId: 'P003', state: 'Andhra Pradesh', district: 'Prakasam', mandal: 'Ongole', villages: ['Ongole Town', 'Chirala', 'Kandukur'], geoFenceRadius: 50 },
];

const SEED_CHECKINS: CheckInRecord[] = [
  { id: 'CI001', providerId: 'P001', date: '2026-04-18', checkIn: '08:55', checkOut: '18:30', checkInLocation: 'Nellore HQ', checkOutLocation: 'Kavali Village', workHours: 9.6, distanceCovered: 72, status: 'DONE' },
  { id: 'CI002', providerId: 'P002', date: '2026-04-18', checkIn: '09:10', checkOut: '', checkInLocation: 'Bhimavaram Base', checkOutLocation: '', workHours: 0, distanceCovered: 38, status: 'ACTIVE' },
  { id: 'CI003', providerId: 'P003', date: '2026-04-18', checkIn: '', checkOut: '', checkInLocation: '', checkOutLocation: '', workHours: 0, distanceCovered: 0, status: 'MISSED' },
  { id: 'CI004', providerId: 'P001', date: '2026-04-17', checkIn: '08:30', checkOut: '17:45', checkInLocation: 'Nellore HQ', checkOutLocation: 'Gudur Road', workHours: 9.25, distanceCovered: 85, status: 'DONE' },
  { id: 'CI005', providerId: 'P002', date: '2026-04-17', checkIn: '09:00', checkOut: '18:00', checkInLocation: 'Bhimavaram Base', checkOutLocation: 'Narasapuram', workHours: 9.0, distanceCovered: 54, status: 'DONE' },
];

const SEED_FIELD_VISITS: ProviderFieldVisit[] = [
  { id: 'FV001', providerId: 'P001', farmerName: 'Govind Rao', farmName: 'Sri Lakshmi Aqua Farm', pondDetails: '3 ponds, 2.5 acres', visitDate: '2026-04-18', purpose: 'SALES', notes: 'Interested in IoT sensors + monthly feed package', gpsCaptured: true, photoUploaded: true, location: 'Kavali, Nellore', outcome: 'Closed: Azolla 50kg + Probiotic pack', status: 'COMPLETED' },
  { id: 'FV002', providerId: 'P001', farmerName: 'Krishnamurthy', farmName: 'Krishna Prawn Farm', pondDetails: '5 ponds, 4 acres', visitDate: '2026-04-18', purpose: 'SUPPORT', notes: 'Water quality issue – high ammonia levels', gpsCaptured: true, photoUploaded: true, location: 'Nellore Rural', outcome: 'Advised water exchange + medication', status: 'COMPLETED' },
  { id: 'FV003', providerId: 'P002', farmerName: 'Venkatesh Naidu', farmName: 'VN Aquaculture', pondDetails: '8 ponds, 6 acres', visitDate: '2026-04-18', purpose: 'INSTALLATION', notes: 'IoT aerator controller installation', gpsCaptured: true, photoUploaded: false, location: 'Bhimavaram', outcome: 'Installed 2 units, 1 pending', status: 'PENDING' },
  { id: 'FV004', providerId: 'P002', farmerName: 'Raju Babu', farmName: 'Raju Fish Farm', pondDetails: '2 ponds, 1.5 acres', visitDate: '2026-04-17', purpose: 'INSPECTION', notes: 'DOC 45 harvest assessment', gpsCaptured: true, photoUploaded: true, location: 'Narasapuram, WG', outcome: 'Harvest recommended in 10 days', status: 'COMPLETED' },
  { id: 'FV005', providerId: 'P003', farmerName: 'Suryanarayana', farmName: 'Modern Aqua Ltd', pondDetails: '12 ponds, 10 acres', visitDate: '2026-04-17', purpose: 'SALES', notes: 'Premium subscription pitch + full device package', gpsCaptured: false, photoUploaded: false, location: 'Ongole, Prakasam', outcome: 'Follow-up scheduled', status: 'PENDING' },
];

const SEED_PROVIDER_TASKS: ProviderTask[] = [
  { id: 'PT001', providerId: 'P001', title: 'Visit 5 Farms – Nellore Zone', description: 'Cover Kavali, Nellore Rural, and Gudur mandals', category: 'FARM_VISIT', targetCount: 5, completedCount: 3, dueDate: '2026-04-20', status: 'IN_PROGRESS' },
  { id: 'PT002', providerId: 'P001', title: 'Sell 10 Bags Feed – April', description: 'Target: Azolla + Probiotic combo packs', category: 'SALES', targetCount: 10, completedCount: 7, dueDate: '2026-04-30', status: 'IN_PROGRESS' },
  { id: 'PT003', providerId: 'P002', title: 'Install 4 IoT Devices', description: 'Aerator controllers at VN Aquaculture and Raju Fish Farm', category: 'DEVICE_INSTALL', targetCount: 4, completedCount: 2, dueDate: '2026-04-22', status: 'IN_PROGRESS' },
  { id: 'PT004', providerId: 'P002', title: 'Water Quality Survey – Bhimavaram', description: 'Test and report water quality across 6 farms', category: 'INSPECTION', targetCount: 6, completedCount: 6, dueDate: '2026-04-17', status: 'COMPLETED' },
  { id: 'PT005', providerId: 'P003', title: 'Farmer Onboarding – Ongole', description: 'Onboard 8 new farmers to AquaGrow platform', category: 'FARM_VISIT', targetCount: 8, completedCount: 2, dueDate: '2026-04-15', status: 'OVERDUE' },
];

const SEED_DAILY_REPORTS: DailyReport[] = [
  { providerId: 'P001', date: '2026-04-18', totalVisits: 3, distanceTravelled: 72, salesAmount: 12500, farmersContacted: 5, devicesInstalled: 0, checkInTime: '08:55', checkOutTime: '18:30' },
  { providerId: 'P002', date: '2026-04-18', totalVisits: 1, distanceTravelled: 38, salesAmount: 0, farmersContacted: 2, devicesInstalled: 2, checkInTime: '09:10', checkOutTime: '' },
  { providerId: 'P003', date: '2026-04-18', totalVisits: 0, distanceTravelled: 0, salesAmount: 0, farmersContacted: 0, devicesInstalled: 0, checkInTime: '', checkOutTime: '' },
  { providerId: 'P001', date: '2026-04-17', totalVisits: 4, distanceTravelled: 85, salesAmount: 18700, farmersContacted: 7, devicesInstalled: 1, checkInTime: '08:30', checkOutTime: '17:45' },
  { providerId: 'P002', date: '2026-04-17', totalVisits: 3, distanceTravelled: 54, salesAmount: 6500, farmersContacted: 4, devicesInstalled: 3, checkInTime: '09:00', checkOutTime: '18:00' },
];

const SEED_ALERTS: TrackingAlert[] = [
  { id: 'AL001', providerId: 'P003', type: 'NO_CHECKIN', message: 'No check-in recorded today (April 18)', severity: 'HIGH', timestamp: '2026-04-18T10:00:00', resolved: false },
  { id: 'AL002', providerId: 'P003', type: 'NO_ACTIVITY', message: 'No field visits logged in last 48 hours', severity: 'HIGH', timestamp: '2026-04-18T08:00:00', resolved: false },
  { id: 'AL003', providerId: 'P002', type: 'LATE', message: 'Check-in delayed by 70 minutes (expected 08:00)', severity: 'MEDIUM', timestamp: '2026-04-18T09:10:00', resolved: false },
  { id: 'AL004', providerId: 'P001', type: 'OUTSIDE_AREA', message: 'Activity logged 35 km outside assigned territory', severity: 'MEDIUM', timestamp: '2026-04-17T14:30:00', resolved: true },
];

const FARMER_INTERACTIONS = [
  { providerId: 'P001', farmerName: 'Govind Rao', interactions: 8, lastContact: '2026-04-18', strength: 92, stage: 'Customer' },
  { providerId: 'P001', farmerName: 'Krishnamurthy', interactions: 5, lastContact: '2026-04-18', strength: 78, stage: 'Active Lead' },
  { providerId: 'P001', farmerName: 'Venkataiah', interactions: 3, lastContact: '2026-04-15', strength: 55, stage: 'Prospect' },
  { providerId: 'P002', farmerName: 'Venkatesh Naidu', interactions: 6, lastContact: '2026-04-18', strength: 85, stage: 'Customer' },
  { providerId: 'P002', farmerName: 'Raju Babu', interactions: 4, lastContact: '2026-04-17', strength: 70, stage: 'Active Lead' },
  { providerId: 'P003', farmerName: 'Suryanarayana', interactions: 2, lastContact: '2026-04-17', strength: 40, stage: 'Prospect' },
];

// ─── Helper: mini provider name list ────────────────────────────────────────
const MOCK_PROV_NAMES: Record<string, string> = {
  P001: 'Ravi Aqua Services', P002: 'Priya Field Tech', P003: 'Suresh IoT Solutions',
};
const provNameById = (id: string, providers: { id: string; name: string }[]) =>
  providers.find(p => p.id === id)?.name ?? MOCK_PROV_NAMES[id] ?? id;

const purposeColor: Record<ProviderFieldVisit['purpose'], string> = {
  SALES: 'bg-emerald-500/10 text-emerald-400',
  SUPPORT: 'bg-blue-500/10 text-blue-400',
  INSPECTION: 'bg-purple-500/10 text-purple-400',
  INSTALLATION: 'bg-amber-500/10 text-amber-400',
  FOLLOWUP: 'bg-zinc-500/10 text-zinc-400',
};
const taskCatIcon: Record<ProviderTask['category'], React.ReactNode> = {
  FARM_VISIT: <MapPin size={12} />,
  DEVICE_INSTALL: <RadioTower size={12} />,
  SALES: <TrendingUp size={12} />,
  SUPPORT: <Phone size={12} />,
  INSPECTION: <ClipboardCheck size={12} />,
};
const alertIcon: Record<TrackingAlert['type'], React.ReactNode> = {
  NO_CHECKIN: <AlertCircle size={14} />,
  IDLE:       <Clock size={14} />,
  OUTSIDE_AREA: <Navigation2 size={14} />,
  NO_ACTIVITY: <Activity size={14} />,
  LATE: <Clock size={14} />,
};
const alertColor: Record<TrackingAlert['severity'], string> = {
  HIGH: 'border-red-500/20 bg-red-500/5 text-red-400',
  MEDIUM: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
  LOW: 'border-zinc-500/20 bg-zinc-500/5 text-zinc-400',
};

const MiniBar = ({ value, color = 'bg-emerald-500' }: { value: number; color?: string }) => (
  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
    <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, value)}%` }} />
  </div>
);

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  'Aqua Consultant', 'Feed Supplier', 'Medicine Supplier',
  'Technician', 'Water Testing', 'Shrimp Logistics', 'Equipment Supplier'
] as const;

// ─── Shared UI Components ─────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: Provider['status'] }) => {
  const map: Record<Provider['status'], string> = {
    verified: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    pending: 'bg-radiant-sun/10 text-radiant-sun border-radiant-sun/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    disabled: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };
  const icons: Record<Provider['status'], React.ReactNode> = {
    verified: <ShieldCheck size={10} />, pending: <Clock size={10} />,
    rejected: <XCircle size={10} />, disabled: <Lock size={10} />,
  };
  return (
    <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border w-fit ${map[status]}`}>
      {icons[status]}{status}
    </span>
  );
};

const SubModelBadge = ({ model }: { model?: Provider['subscriptionModel'] }) => {
  if (!model) return null;
  const map = { free: 'text-zinc-400 bg-zinc-700/20 border-zinc-700/30', premium: 'text-blue-400 bg-blue-500/10 border-blue-500/20', verified: 'text-radiant-sun bg-radiant-sun/10 border-radiant-sun/20' };
  return <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${map[model]}`}>{model.toUpperCase()}</span>;
};

const PerfBar = ({ score }: { score: number }) => {
  const color = score >= 90 ? 'bg-emerald-500' : score >= 70 ? 'bg-blue-500' : score >= 50 ? 'bg-radiant-sun' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} /></div>
      <span className="text-xs font-mono font-bold">{score}%</span>
    </div>
  );
};

const AvailabilityDot = ({ status }: { status?: Provider['availability'] }) => {
  const map = { available: 'bg-emerald-400', busy: 'bg-radiant-sun', unavailable: 'bg-red-400' };
  return <span className={`w-2 h-2 rounded-full inline-block ${map[status ?? 'unavailable']}`} />;
};

// ─── Main Component ──────────────────────────────────────────────────────────
type Tab = 'all' | 'onboarding' | 'performance' | 'subscriptions' | 'risk' | 'analytics' | 'tracking';

const ProviderRegistry = () => {
  const [tab, setTab] = useState<Tab>('all');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [detailProvider, setDetailProvider] = useState<Provider | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isFlagOpen, setIsFlagOpen] = useState(false);
  const [flagTarget, setFlagTarget] = useState<Provider | null>(null);
  const [flagReason, setFlagReason] = useState('');

  // ── Field Tracking State ─────────────────────────────────────────────────
  const [trackingTab, setTrackingTab] = useState<'overview' | 'checkin' | 'visits' | 'tasks' | 'alerts' | 'geo' | 'farmers' | 'reports' | 'integration'>('overview');
  const [trackingAlerts, setTrackingAlerts] = useState<TrackingAlert[]>(SEED_ALERTS);
  const [selectedTrackProvider, setSelectedTrackProvider] = useState<string>('ALL');

  const [newProv, setNewProv] = useState({
    name: '', category: 'Aqua Consultant' as Provider['category'],
    location: '', regions: '', phone: '', commissionRate: 5, subscriptionModel: 'free' as Provider['subscriptionModel'],
  });

  useEffect(() => { loadData(); }, []);
  const loadData = () => {
    setProviders(storageService.getProviders());
    setFarmers(storageService.getFarmers());
    setTickets(storageService.getTickets());
  };

  // ── Computed helpers ─────────────────────────────────────────────────────
  const farmersForProvider = (id: string) => farmers.filter(f => f.assignedProviderId === id);
  const complaintsForProvider = (id: string) => tickets.filter(t => farmersForProvider(id).some(f => f.id === t.userId));

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: providers.length,
    verified: providers.filter(p => p.status === 'verified').length,
    pending: providers.filter(p => p.status === 'pending').length,
    disabled: providers.filter(p => p.status === 'disabled').length,
    avgRating: providers.length ? +(providers.reduce((s, p) => s + p.rating, 0) / providers.length).toFixed(1) : 0,
    premium: providers.filter(p => p.subscriptionModel === 'premium' || p.subscriptionModel === 'verified').length,
    totalFarmers: providers.reduce((s, p) => s + p.assignedFarmersCount, 0),
    avgPerf: providers.length ? Math.round(providers.reduce((s, p) => s + p.performanceScore, 0) / providers.length) : 0,
  }), [providers]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = providers;
    if (tab === 'onboarding') list = list.filter(p => p.status === 'pending' || p.status === 'rejected');
    if (tab === 'risk') list = list.filter(p => p.performanceScore < 70 || p.status === 'disabled');
    if (searchTerm) list = list.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()) || p.location.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterStatus !== 'all') list = list.filter(p => p.status === filterStatus);
    if (filterCategory !== 'all') list = list.filter(p => p.category === filterCategory);
    return list;
  }, [providers, tab, searchTerm, filterStatus, filterCategory]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleVerify = (p: Provider) => { storageService.verifyProvider(p.id); loadData(); if (detailProvider?.id === p.id) setDetailProvider({ ...p, status: 'verified', verificationBadge: true }); };
  const handleReject = (p: Provider) => { storageService.saveProvider({ ...p, status: 'rejected' }); loadData(); };
  const handleDisable = (p: Provider) => { storageService.disableProvider(p.id); loadData(); };
  const handleEnable = (p: Provider) => { storageService.saveProvider({ ...p, status: 'verified' }); loadData(); };
  const handleFlag = () => {
    if (!flagTarget || !flagReason) return;
    storageService.saveProvider({ ...flagTarget, status: 'disabled' });
    setIsFlagOpen(false); setFlagReason(''); setFlagTarget(null); loadData();
  };
  const handleDelete = (id: string) => { if (window.confirm('Remove this provider?')) { storageService.deleteProvider(id); if (detailProvider?.id === id) setDetailProvider(null); loadData(); } };
  const handleSetSubModel = (p: Provider, model: Provider['subscriptionModel']) => { storageService.saveProvider({ ...p, subscriptionModel: model }); loadData(); };
  const handleSetCommission = (p: Provider, rate: number) => { storageService.saveProvider({ ...p, commissionRate: rate }); loadData(); };

  const handleAddProvider = () => {
    if (!newProv.name || !newProv.location) return;
    storageService.saveProvider({
      id: `P-${Date.now()}`, name: newProv.name, category: newProv.category,
      location: newProv.location, regions: newProv.regions.split(',').map(r => r.trim()).filter(Boolean),
      phone: newProv.phone || undefined, status: 'pending', rating: 0,
      performanceScore: 0, assignedFarmersCount: 0, activeOrdersCount: 0,
      commissionRate: newProv.commissionRate, subscriptionModel: newProv.subscriptionModel,
      availability: 'available',
    });
    setIsAddOpen(false);
    setNewProv({ name: '', category: 'Aqua Consultant', location: '', regions: '', phone: '', commissionRate: 5, subscriptionModel: 'free' });
    loadData();
  };

  const tabs: { id: Tab; label: string; icon: React.FC<any>; badge?: number }[] = [
    { id: 'all', label: 'All Providers', icon: Users, badge: stats.total },
    { id: 'onboarding', label: 'Onboarding', icon: UserPlus, badge: stats.pending },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'risk', label: 'Risk & Fraud', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'tracking', label: '🛰 Field Tracking', icon: Navigation2, badge: trackingAlerts.filter(a => !a.resolved).length },
  ];

  // ── Field Tracking helpers ────────────────────────────────────────────────
  const filteredCheckins = useMemo(() => SEED_CHECKINS.filter(c => selectedTrackProvider === 'ALL' || c.providerId === selectedTrackProvider), [selectedTrackProvider]);
  const filteredVisits = useMemo(() => SEED_FIELD_VISITS.filter(v => selectedTrackProvider === 'ALL' || v.providerId === selectedTrackProvider), [selectedTrackProvider]);
  const filteredTasks = useMemo(() => SEED_PROVIDER_TASKS.filter(t => selectedTrackProvider === 'ALL' || t.providerId === selectedTrackProvider), [selectedTrackProvider]);
  const filteredReports = useMemo(() => SEED_DAILY_REPORTS.filter(r => selectedTrackProvider === 'ALL' || r.providerId === selectedTrackProvider), [selectedTrackProvider]);
  const filteredInteractions = useMemo(() => FARMER_INTERACTIONS.filter(fi => selectedTrackProvider === 'ALL' || fi.providerId === selectedTrackProvider), [selectedTrackProvider]);
  const filteredAlerts = useMemo(() => trackingAlerts.filter(a => selectedTrackProvider === 'ALL' || a.providerId === selectedTrackProvider), [trackingAlerts, selectedTrackProvider]);

  const resolveAlert = (id: string) => setTrackingAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));

  const trackProviders = ['P001','P002','P003'];
  const trackStats = {
    activeToday: SEED_CHECKINS.filter(c => c.date === '2026-04-18' && c.status !== 'MISSED').length,
    missedToday: SEED_CHECKINS.filter(c => c.date === '2026-04-18' && c.status === 'MISSED').length,
    visitsToday: SEED_FIELD_VISITS.filter(v => v.visitDate === '2026-04-18').length,
    kmToday: SEED_CHECKINS.filter(c => c.date === '2026-04-18').reduce((s, c) => s + c.distanceCovered, 0),
    openAlerts: SEED_ALERTS.filter(a => !a.resolved).length,
    tasksOverdue: SEED_PROVIDER_TASKS.filter(t => t.status === 'OVERDUE').length,
  };

  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Provider Management</h1>
          <p className="text-zinc-400">Verify, monitor, and monetize service providers across all categories.</p>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="btn-primary flex items-center justify-center gap-2">
          <UserPlus size={20} /> Register Provider
        </button>
      </div>

      {/* ── KPI Bar ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Total', value: stats.total, color: '' },
          { label: 'Verified', value: stats.verified, color: 'text-emerald-400' },
          { label: 'Pending', value: stats.pending, color: 'text-radiant-sun' },
          { label: 'Disabled', value: stats.disabled, color: 'text-red-400' },
          { label: 'Avg Rating', value: stats.avgRating, color: 'text-radiant-gold' },
          { label: 'Premium', value: stats.premium, color: 'text-blue-400' },
          { label: 'Farmers Served', value: stats.totalFarmers, color: 'text-emerald-400' },
          { label: 'Avg Perf', value: `${stats.avgPerf}%`, color: stats.avgPerf >= 80 ? 'text-emerald-400' : 'text-radiant-sun' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-panel p-4 text-center">
            <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">{label}</p>
            <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Onboarding Policy Banner ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { icon: Shield, color: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10', text: 'Verify phone + business proof before approving' },
          { icon: Award, color: 'text-radiant-sun bg-radiant-sun/5 border-radiant-sun/10', text: 'Verified Badge given only after document review' },
          { icon: AlertTriangle, color: 'text-red-400 bg-red-500/5 border-red-500/10', text: 'Auto-flag if rating drops below 3.5 or complaints > 3' },
        ].map(({ icon: Icon, color, text }) => (
          <div key={text} className={`flex items-center gap-3 p-3.5 rounded-xl border ${color}`}>
            <Icon size={15} /> <p className="text-xs font-medium">{text}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div className="flex gap-1 p-1.5 bg-white/5 rounded-2xl overflow-x-auto w-fit max-w-full">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${tab === t.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
            <t.icon size={15} /> {t.label}
            {t.badge !== undefined && t.badge > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-white/20 text-white' : 'bg-white/10 text-zinc-300'}`}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: ALL + RISK (shared table)                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {(tab === 'all' || tab === 'risk') && (
        <div className="space-y-5">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input type="text" placeholder="Search by name, category, or location..." className="input-field w-full pl-11" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
              <Filter size={15} className="text-zinc-500 shrink-0" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-transparent outline-none text-sm">
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
              <Layers size={15} className="text-zinc-500 shrink-0" />
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-transparent outline-none text-sm">
                <option value="all">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(provider => (
              <motion.div key={provider.id} whileHover={{ y: -3 }} className="glass-panel p-5 group cursor-pointer" onClick={() => setDetailProvider(provider)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl emerald-gradient p-0.5">
                        <div className="w-full h-full rounded-[10px] bg-zinc-900 flex items-center justify-center text-lg font-display font-bold text-emerald-400">
                          {provider.name.charAt(0)}
                        </div>
                      </div>
                      {provider.verificationBadge && <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-zinc-900"><Shield size={8} className="text-white" /></div>}
                    </div>
                    <div>
                      <p className="font-bold group-hover:text-emerald-400 transition-colors">{provider.name}</p>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-1"><Tag size={9} />{provider.category}</p>
                      <p className="text-[10px] text-zinc-600 flex items-center gap-1"><MapPin size={9} />{provider.location}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge status={provider.status} />
                    <SubModelBadge model={provider.subscriptionModel} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-white/5 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Rating</p>
                    <p className="text-sm font-bold text-radiant-gold">{provider.rating > 0 ? provider.rating.toFixed(1) : '—'}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Farmers</p>
                    <p className="text-sm font-bold text-blue-400">{provider.assignedFarmersCount}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Perf</p>
                    <p className={`text-sm font-bold ${provider.performanceScore >= 80 ? 'text-emerald-400' : provider.performanceScore >= 60 ? 'text-radiant-sun' : 'text-red-400'}`}>{provider.performanceScore}%</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {provider.regions.slice(0, 3).map(r => <span key={r} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5">{r}</span>)}
                  {provider.regions.length > 3 && <span className="text-[9px] text-zinc-600">+{provider.regions.length - 3}</span>}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5">
                    <AvailabilityDot status={provider.availability} />
                    <span className="text-[10px] text-zinc-500 capitalize">{provider.availability ?? 'unknown'}</span>
                    {provider.commissionRate && <span className="text-[10px] text-zinc-600 ml-2">{provider.commissionRate}% comm.</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    {provider.status === 'pending' && (
                      <button onClick={() => handleVerify(provider)} className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all" title="Verify"><CheckCircle2 size={14} /></button>
                    )}
                    {provider.status === 'pending' && (
                      <button onClick={() => handleReject(provider)} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all" title="Reject"><XCircle size={14} /></button>
                    )}
                    {provider.status === 'verified' && (
                      <button onClick={() => { setFlagTarget(provider); setIsFlagOpen(true); }} className="p-1.5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition-all" title="Flag"><Flag size={14} /></button>
                    )}
                    {provider.status === 'disabled' && (
                      <button onClick={() => handleEnable(provider)} className="p-1.5 hover:bg-emerald-500/10 text-zinc-400 hover:text-emerald-400 rounded-lg transition-all" title="Re-enable"><Unlock size={14} /></button>
                    )}
                    <button onClick={() => handleDelete(provider.id)} className="p-1.5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="glass-panel py-16 text-center"><Users size={36} className="text-zinc-700 mx-auto mb-3" /><p className="text-zinc-500">No providers match this filter.</p></div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: ONBOARDING                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'onboarding' && (
        <div className="space-y-6">
          <div className="glass-panel p-5 border border-blue-500/10 bg-blue-500/3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400"><Shield size={18} /></div>
              <div>
                <p className="font-bold text-sm text-blue-400">Verification Checklist</p>
                <p className="text-xs text-zinc-400">Phone OTP · Business Proof · Experience / Certification · Service Area confirmation</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {providers.filter(p => p.status === 'pending').map(p => (
              <motion.div key={p.id} whileHover={{ y: -2 }} className="glass-panel p-6">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-2xl font-display font-bold text-emerald-400 border border-white/5">{p.name.charAt(0)}</div>
                    <div>
                      <p className="font-bold text-lg">{p.name}</p>
                      <p className="text-xs text-zinc-500 flex items-center gap-1"><Tag size={10} />{p.category}</p>
                      <p className="text-xs text-zinc-600 flex items-center gap-1"><MapPin size={10} />{p.location}</p>
                    </div>
                  </div>
                  <StatusBadge status="pending" />
                </div>

                {/* Verification Checks */}
                <div className="space-y-2 mb-5 p-4 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-2">Verification Steps</p>
                  {[
                    { label: 'Phone Verified', done: !!p.phone },
                    { label: 'Business Category Assigned', done: !!p.category },
                    { label: 'Service Region Defined', done: p.regions.length > 0 },
                    { label: 'Commission Rate Set', done: !!p.commissionRate },
                  ].map(({ label, done }) => (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      {done ? <CheckCircle2 size={12} className="text-emerald-400 shrink-0" /> : <XCircle size={12} className="text-zinc-700 shrink-0" />}
                      <span className={done ? 'text-zinc-300' : 'text-zinc-600'}>{label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={() => handleVerify(p)} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all">
                    <ShieldCheck size={15} />Verify & Approve
                  </button>
                  <button onClick={() => handleReject(p)} className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all">
                    <XCircle size={15} />Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {providers.filter(p => p.status === 'pending').length === 0 && (
            <div className="glass-panel py-16 text-center"><CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-3" /><p className="text-zinc-400">No pending provider registrations</p></div>
          )}

          {providers.some(p => p.status === 'rejected') && (
            <>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Recently Rejected</p>
              <div className="glass-panel divide-y divide-white/5">
                {providers.filter(p => p.status === 'rejected').map(p => (
                  <div key={p.id} className="flex items-center justify-between px-6 py-4">
                    <div><p className="font-bold text-zinc-300">{p.name}</p><p className="text-xs text-zinc-500">{p.category} · {p.location}</p></div>
                    <button onClick={() => handleVerify(p)} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"><RefreshCw size={12} />Re-verify</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: PERFORMANCE                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'performance' && (
        <div className="space-y-5">
          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-display font-bold">Provider Performance Leaderboard</h3>
              <p className="text-xs text-zinc-500">Ranked by performance score · {providers.filter(p => p.status === 'verified').length} active providers</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-white/5 bg-white/5">
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Provider</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Performance</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Farmers</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Complaints</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Availability</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Tier</th>
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {[...providers].filter(p => p.status === 'verified').sort((a, b) => b.performanceScore - a.performanceScore).map((p, i) => {
                    const complaints = complaintsForProvider(p.id).length;
                    return (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setDetailProvider(p)}>
                        <td className="px-6 py-4">
                          <span className={`text-lg font-display font-bold ${i === 0 ? 'text-radiant-gold' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-orange-400' : 'text-zinc-600'}`}>#{i + 1}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">{p.name.charAt(0)}</div>
                            <div>
                              <p className="font-bold text-sm flex items-center gap-1">{p.name}{p.verificationBadge && <Shield size={10} className="text-emerald-400" />}</p>
                              <p className="text-[10px] text-zinc-500">{p.location}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5">{p.category}</span></td>
                        <td className="px-6 py-4"><PerfBar score={p.performanceScore} /></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1"><Star size={12} className="fill-radiant-gold text-radiant-gold" /><span className="font-bold text-sm">{p.rating > 0 ? p.rating.toFixed(1) : '—'}</span></div>
                        </td>
                        <td className="px-6 py-4"><span className="font-bold text-blue-400">{p.assignedFarmersCount}</span></td>
                        <td className="px-6 py-4">
                          <span className={`font-bold text-sm ${complaints > 2 ? 'text-red-400' : complaints > 0 ? 'text-radiant-sun' : 'text-emerald-400'}`}>{complaints}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5"><AvailabilityDot status={p.availability} /><span className="text-xs text-zinc-400 capitalize">{p.availability}</span></div>
                        </td>
                        <td className="px-6 py-4"><SubModelBadge model={p.subscriptionModel} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance Alerts */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-radiant-sun" />Performance Alerts</h3>
            <div className="space-y-3">
              {providers.filter(p => p.performanceScore < 70 && p.status === 'verified').map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={16} className="text-red-400 shrink-0" />
                    <div><p className="font-bold text-sm">{p.name}</p><p className="text-xs text-zinc-500">{p.category} · Perf: {p.performanceScore}%</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setFlagTarget(p); setIsFlagOpen(true); }} className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 px-3 py-1 rounded-lg">⚠ Flag</button>
                    <button onClick={() => handleDisable(p)} className="text-xs text-zinc-400 hover:text-white border border-white/10 px-3 py-1 rounded-lg">Suspend</button>
                  </div>
                </div>
              ))}
              {providers.filter(p => p.performanceScore < 70 && p.status === 'verified').length === 0 && (
                <p className="text-zinc-500 text-sm flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" />All providers are performing well</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: SUBSCRIPTIONS                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'subscriptions' && (
        <div className="space-y-5">
          {/* Subscription model info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { model: 'free', label: 'Free Listing', color: 'text-zinc-400 border-zinc-700/30', features: ['Basic profile', 'Standard ranking', 'Manual lead access'], price: '₹0/mo' },
              { model: 'premium', label: 'Premium Listing', color: 'text-blue-400 border-blue-500/20', features: ['Priority ranking', 'Early lead access', 'Promotional badge'], price: '₹1,999/mo' },
              { model: 'verified', label: 'Verified Priority', color: 'text-radiant-sun border-radiant-sun/20', features: ['Top-of-list placement', 'First lead priority', 'Verified badge + analytics'], price: '₹3,499/mo' },
            ].map(({ model, label, color, features, price }) => (
              <div key={model} className={`glass-panel p-6 border ${color.split(' ')[1]}`}>
                <p className={`text-sm font-bold mb-1 ${color.split(' ')[0]}`}>{label}</p>
                <p className="text-2xl font-display font-bold mb-4">{price}</p>
                <div className="space-y-1.5 mb-5">
                  {features.map(f => <div key={f} className="flex items-center gap-2 text-xs text-zinc-400"><CheckCircle2 size={11} className="text-emerald-400 shrink-0" />{f}</div>)}
                </div>
                <p className="text-[10px] text-zinc-500">{providers.filter(p => p.subscriptionModel === model).length} providers on this plan</p>
              </div>
            ))}
          </div>

          {/* Per-provider controls */}
          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/5"><h3 className="text-xl font-display font-bold">Provider Subscription Control</h3></div>
            <div className="divide-y divide-white/5">
              {providers.filter(p => p.status === 'verified').map(p => (
                <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-emerald-400 shrink-0">{p.name.charAt(0)}</div>
                    <div>
                      <p className="font-bold text-sm">{p.name}</p>
                      <p className="text-[10px] text-zinc-500">{p.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex gap-1">
                      {(['free', 'premium', 'verified'] as const).map(m => (
                        <button key={m} onClick={() => handleSetSubModel(p, m)}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${p.subscriptionModel === m ? 'bg-emerald-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}>
                          {m.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign size={13} className="text-zinc-500" />
                      <input type="number" min={0} max={20} value={p.commissionRate || 0}
                        onChange={e => handleSetCommission(p, +e.target.value)}
                        className="w-14 text-xs font-mono text-center bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 outline-none" />
                      <span className="text-xs text-zinc-500">% comm.</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: ANALYTICS                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: FIELD TRACKING                                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'tracking' && (
        <div className="space-y-6">
          {/* Field Tracking Header */}
          <div className="glass-panel p-5 border border-blue-500/10 bg-gradient-to-r from-blue-500/5 to-emerald-500/5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400"><Navigation2 size={20} /></div>
                <div>
                  <p className="font-bold text-blue-300">Provider Field Tracking System</p>
                  <p className="text-xs text-zinc-400">E roju evaru ekkada pani chesaru, emi chesaru, result enti?</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Filter Provider:</span>
                <select value={selectedTrackProvider} onChange={e => setSelectedTrackProvider(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-200 outline-none">
                  <option value="ALL" className="bg-zinc-900">All Providers</option>
                  {trackProviders.map(id => (
                    <option key={id} value={id} className="bg-zinc-900">{provNameById(id, providers)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Active Today', value: trackStats.activeToday, color: 'text-emerald-400', icon: <CheckSquare size={16} /> },
              { label: 'Missed Check-in', value: trackStats.missedToday, color: 'text-red-400', icon: <AlertCircle size={16} /> },
              { label: 'Farm Visits', value: trackStats.visitsToday, color: 'text-blue-400', icon: <MapPin size={16} /> },
              { label: 'KM Covered', value: `${trackStats.kmToday}`, color: 'text-purple-400', icon: <Route size={16} /> },
              { label: 'Open Alerts', value: trackStats.openAlerts, color: 'text-amber-400', icon: <Bell size={16} /> },
              { label: 'Overdue Tasks', value: trackStats.tasksOverdue, color: 'text-red-400', icon: <ClipboardCheck size={16} /> },
            ].map(s => (
              <div key={s.label} className="glass-panel p-4 text-center">
                <div className={`flex justify-center mb-1 ${s.color} opacity-60`}>{s.icon}</div>
                <p className={`text-xl font-display font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-zinc-500 uppercase font-bold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Sub Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide flex-wrap">
            {([
              { id: 'overview', label: 'Overview', icon: <Gauge size={12} /> },
              { id: 'checkin', label: 'Check-in/out', icon: <Clock size={12} /> },
              { id: 'visits', label: 'Field Visits', icon: <MapPin size={12} /> },
              { id: 'tasks', label: 'Task Tracking', icon: <ClipboardCheck size={12} /> },
              { id: 'alerts', label: 'Alerts', icon: <Bell size={12} /> },
              { id: 'geo', label: 'Geo-fencing', icon: <Hexagon size={12} /> },
              { id: 'farmers', label: 'Farmer Links', icon: <Handshake size={12} /> },
              { id: 'reports', label: 'Daily Reports', icon: <FileBarChart size={12} /> },
              { id: 'integration', label: 'Integration', icon: <Link2 size={12} /> },
            ] as const).map(st => (
              <button key={st.id} onClick={() => setTrackingTab(st.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                  trackingTab === st.id ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300'
                }`}>
                {st.icon} {st.label}
              </button>
            ))}
          </div>

          {/* ── Overview ───────────────────────────────────────────────────── */}
          {trackingTab === 'overview' && (
            <div className="space-y-5">
              {trackProviders.map(pid => {
                const todayCheckin = SEED_CHECKINS.find(c => c.providerId === pid && c.date === '2026-04-18');
                const todayVisits = SEED_FIELD_VISITS.filter(v => v.providerId === pid && v.visitDate === '2026-04-18');
                const activeTasks = SEED_PROVIDER_TASKS.filter(t => t.providerId === pid && t.status !== 'COMPLETED');
                const area = SEED_AREAS.find(a => a.providerId === pid);
                const pName = provNameById(pid, providers);
                const statusColor = todayCheckin?.status === 'ACTIVE' ? 'border-emerald-500/20 bg-emerald-500/5' : todayCheckin?.status === 'DONE' ? 'border-blue-500/20 bg-blue-500/5' : 'border-red-500/20 bg-red-500/5';
                return (
                  <div key={pid} className={`glass-panel p-6 border ${statusColor}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-display font-bold text-lg">
                          {pName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-100">{pName}</p>
                          <p className="text-[10px] text-zinc-500">{area?.district ?? '—'} · {area?.mandal ?? '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${
                          todayCheckin?.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                          todayCheckin?.status === 'DONE' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {todayCheckin?.status === 'ACTIVE' ? '● ACTIVE' : todayCheckin?.status === 'DONE' ? '✓ DONE' : '✗ MISSED'}
                        </span>
                        {todayCheckin?.status === 'ACTIVE' && (
                          <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/5 text-emerald-300 animate-pulse">LIVE</span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-white/5">
                        <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Check-in</p>
                        <p className="text-sm font-mono font-bold text-zinc-200">{todayCheckin?.checkIn || '—'}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5">
                        <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Check-out</p>
                        <p className="text-sm font-mono font-bold text-zinc-200">{todayCheckin?.checkOut || todayCheckin?.status === 'ACTIVE' ? (todayCheckin?.checkOut || 'Ongoing') : '—'}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5">
                        <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">KM Covered</p>
                        <p className="text-sm font-mono font-bold text-blue-400">{todayCheckin?.distanceCovered ?? 0} km</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5">
                        <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Farm Visits</p>
                        <p className="text-sm font-mono font-bold text-purple-400">{todayVisits.length}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {todayVisits.slice(0, 2).map(v => (
                        <div key={v.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/3 text-xs">
                          <span className="text-zinc-300 font-bold">{v.farmerName} – {v.farmName}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${purposeColor[v.purpose]}`}>{v.purpose}</span>
                            {v.gpsCaptured && <span className="text-[9px] text-blue-400">📍GPS</span>}
                            {v.photoUploaded && <span className="text-[9px] text-emerald-400">📸Photo</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {activeTasks.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {activeTasks.slice(0, 2).map(t => (
                          <span key={t.id} className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${
                            t.status === 'OVERDUE' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {t.status === 'OVERDUE' ? '⚠' : '⏳'} {t.title.slice(0, 30)}…
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Check-in / Check-out ────────────────────────────────────────── */}
          {trackingTab === 'checkin' && (
            <div className="space-y-5">
              <div className="glass-panel overflow-hidden">
                <div className="p-5 border-b border-white/5 bg-white/3">
                  <h4 className="font-display font-bold flex items-center gap-2"><Clock size={16} className="text-blue-400" /> Check-in / Check-out Log</h4>
                </div>
                <div className="divide-y divide-white/5">
                  {filteredCheckins.map((ci, i) => {
                    const pName = provNameById(ci.providerId, providers);
                    const hoursText = ci.workHours > 0 ? `${ci.workHours}h` : ci.status === 'ACTIVE' ? 'Ongoing' : '—';
                    return (
                      <motion.div key={ci.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                        className="p-5 flex flex-wrap items-center gap-4 hover:bg-white/3 transition-all">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          ci.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : ci.status === 'DONE' ? 'bg-blue-400' : 'bg-red-400'
                        }`} />
                        <div className="flex-1 min-w-[160px]">
                          <p className="text-sm font-bold text-zinc-100">{pName}</p>
                          <p className="text-[10px] text-zinc-500 flex items-center gap-1"><Calendar size={9} /> {ci.date}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <p className="text-[9px] text-zinc-500 uppercase font-bold">Check-in</p>
                            <p className="text-xs font-mono font-bold text-zinc-200">{ci.checkIn || '—'}</p>
                            <p className="text-[9px] text-zinc-600 truncate max-w-[80px]">{ci.checkInLocation || '—'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-zinc-500 uppercase font-bold">Check-out</p>
                            <p className="text-xs font-mono font-bold text-zinc-200">{ci.checkOut || (ci.status === 'ACTIVE' ? 'Ongoing' : '—')}</p>
                            <p className="text-[9px] text-zinc-600 truncate max-w-[80px]">{ci.checkOutLocation || '—'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-zinc-500 uppercase font-bold">Hours</p>
                            <p className="text-sm font-mono font-bold text-blue-400">{hoursText}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-zinc-500 uppercase font-bold">KM</p>
                            <p className="text-sm font-mono font-bold text-purple-400">{ci.distanceCovered}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                          ci.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                          ci.status === 'DONE' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'
                        }`}>{ci.status}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Field Visits ────────────────────────────────────────────────── */}
          {trackingTab === 'visits' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total Visits', value: filteredVisits.length, color: 'text-blue-400' },
                  { label: 'Completed', value: filteredVisits.filter(v => v.status === 'COMPLETED').length, color: 'text-emerald-400' },
                  { label: 'GPS Verified', value: filteredVisits.filter(v => v.gpsCaptured).length, color: 'text-purple-400' },
                  { label: 'Photo Uploaded', value: filteredVisits.filter(v => v.photoUploaded).length, color: 'text-amber-400' },
                ].map(s => (
                  <div key={s.label} className="glass-panel p-4 text-center">
                    <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[9px] text-zinc-500 uppercase font-bold mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="glass-panel overflow-hidden">
                <div className="p-5 border-b border-white/5 bg-white/3">
                  <h4 className="font-display font-bold">Field Visit Log</h4>
                </div>
                <div className="divide-y divide-white/5">
                  {filteredVisits.map((v, i) => (
                    <motion.div key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      className="p-5 hover:bg-white/3 transition-all">
                      <div className="flex flex-wrap items-start gap-4">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                          <MapPin size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                            <div>
                              <p className="text-sm font-bold text-zinc-100">{v.farmName}</p>
                              <p className="text-[10px] text-zinc-500">{v.farmerName} · {v.location}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${purposeColor[v.purpose]}`}>{v.purpose}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                v.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                              }`}>{v.status}</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-zinc-400 mb-2">{v.notes}</p>
                          <p className="text-[10px] text-emerald-400 italic">Outcome: {v.outcome}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="text-[10px] flex items-center gap-1"><Calendar size={9} className="text-zinc-600" /> {v.visitDate}</span>
                            <span className={`text-[9px] font-bold flex items-center gap-1 ${v.gpsCaptured ? 'text-blue-400' : 'text-zinc-600'}`}>
                              📍 GPS {v.gpsCaptured ? 'Captured' : 'Missing'}
                            </span>
                            <span className={`text-[9px] font-bold flex items-center gap-1 ${v.photoUploaded ? 'text-emerald-400' : 'text-zinc-600'}`}>
                              📸 Photo {v.photoUploaded ? 'Uploaded' : 'Missing'}
                            </span>
                            <span className="text-[9px] text-zinc-500">{provNameById(v.providerId, providers)}</span>
                          </div>
                          {(!v.gpsCaptured || !v.photoUploaded) && (
                            <div className="mt-2 text-[9px] font-bold text-red-400 flex items-center gap-1">
                              <AlertCircle size={10} /> Proof incomplete – may be flagged as fake entry
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Task Tracking ────────────────────────────────────────────────── */}
          {trackingTab === 'tasks' && (
            <div className="space-y-5">
              <div className="glass-panel overflow-hidden">
                <div className="p-5 border-b border-white/5 bg-white/3 flex items-center justify-between">
                  <h4 className="font-display font-bold">Assigned Tasks</h4>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span className="text-emerald-400 font-bold">{filteredTasks.filter(t => t.status === 'COMPLETED').length} done</span>
                    <span>·</span>
                    <span className="text-red-400 font-bold">{filteredTasks.filter(t => t.status === 'OVERDUE').length} overdue</span>
                  </div>
                </div>
                <div className="divide-y divide-white/5">
                  {filteredTasks.map((task, i) => {
                    const completion = Math.round((task.completedCount / task.targetCount) * 100);
                    const statusColor = { COMPLETED: 'bg-emerald-500/10 text-emerald-400', IN_PROGRESS: 'bg-blue-500/10 text-blue-400', PENDING: 'bg-zinc-500/10 text-zinc-400', OVERDUE: 'bg-red-500/10 text-red-400' };
                    return (
                      <motion.div key={task.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                        className="p-5 hover:bg-white/3 transition-all">
                        <div className="flex flex-wrap items-start gap-3">
                          <div className="p-2 rounded-xl bg-white/5 text-zinc-400 shrink-0 mt-0.5">
                            {taskCatIcon[task.category]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                              <div>
                                <p className="text-sm font-bold text-zinc-100">{task.title}</p>
                                <p className="text-[10px] text-zinc-500">{task.description}</p>
                              </div>
                              <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full shrink-0 ${statusColor[task.status]}`}>
                                {task.status.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="text-[9px] text-zinc-500 uppercase font-bold">Progress</p>
                                <p className="text-[10px] font-mono font-bold text-zinc-300">{task.completedCount} / {task.targetCount}</p>
                              </div>
                              <MiniBar value={completion} color={task.status === 'OVERDUE' ? 'bg-red-500' : task.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500'} />
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-[9px] text-zinc-500 flex items-center gap-1"><Calendar size={9} /> Due: {task.dueDate}</span>
                              <span className="text-[9px] text-zinc-500">{provNameById(task.providerId, providers)}</span>
                              <span className={`text-[10px] font-bold ${completion >= 100 ? 'text-emerald-400' : 'text-blue-400'}`}>{completion}%</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Alerts & Monitoring ──────────────────────────────────────────── */}
          {trackingTab === 'alerts' && (
            <div className="space-y-5">
              <div className="glass-panel p-5 border border-amber-500/10 bg-amber-500/3">
                <p className="text-xs text-zinc-400">
                  <span className="text-amber-400 font-bold">Smart Alerts</span> — Auto-generated when providers miss check-in, stay idle, go outside assigned area, or have no field activity.
                </p>
              </div>
              <div className="space-y-3">
                {filteredAlerts.map((alert, i) => (
                  <motion.div key={alert.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    className={`flex flex-wrap items-start gap-4 p-5 rounded-2xl border ${alertColor[alert.severity]} ${alert.resolved ? 'opacity-50' : ''}`}>
                    <div className="shrink-0 mt-0.5">{alertIcon[alert.type]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-sm font-bold">{alert.message}</p>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          alert.severity === 'HIGH' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>{alert.severity}</span>
                        {alert.resolved && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">RESOLVED</span>}
                      </div>
                      <p className="text-[10px] text-zinc-500">{provNameById(alert.providerId, providers)} · {new Date(alert.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                    </div>
                    {!alert.resolved && (
                      <button onClick={() => resolveAlert(alert.id)}
                        className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-all shrink-0">
                        Mark Resolved
                      </button>
                    )}
                  </motion.div>
                ))}
                {filteredAlerts.length === 0 && (
                  <div className="glass-panel py-12 text-center">
                    <Bell size={28} className="text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500">No alerts for this provider</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Geo-fencing ──────────────────────────────────────────────────── */}
          {trackingTab === 'geo' && (
            <div className="space-y-5">
              <div className="glass-panel p-5 border border-purple-500/10 bg-purple-500/3">
                <div className="flex items-center gap-2 mb-2">
                  <Hexagon size={14} className="text-purple-400" />
                  <p className="text-xs font-bold text-purple-300">Geo-Fencing — Assigned Work Territories</p>
                </div>
                <p className="text-xs text-zinc-400">Each provider is locked to a specific geographic zone. Alerts are triggered when activity is detected outside the defined radius.</p>
              </div>
              <div className="space-y-4">
                {SEED_AREAS.map((area, i) => (
                  <div key={area.id} className="glass-panel p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="font-bold text-zinc-100">{provNameById(area.providerId, providers)}</p>
                        <p className="text-[10px] text-zinc-500">{area.state} → {area.district} → {area.mandal}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-zinc-500 uppercase font-bold mb-0.5">Geo-fence Radius</p>
                        <p className="text-xl font-display font-bold text-purple-400">{area.geoFenceRadius} km</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Assigned Villages / Areas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {area.villages.map(v => (
                          <span key={v} className="text-[10px] px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold">
                            📍 {v}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-white/5 text-center">
                        <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">State</p>
                        <p className="text-xs font-bold text-zinc-200">{area.state}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 text-center">
                        <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">District</p>
                        <p className="text-xs font-bold text-zinc-200">{area.district}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 text-center">
                        <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Mandal</p>
                        <p className="text-xs font-bold text-zinc-200">{area.mandal}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Farmer Interaction Tracking ──────────────────────────────────── */}
          {trackingTab === 'farmers' && (
            <div className="space-y-5">
              <div className="glass-panel overflow-hidden">
                <div className="p-5 border-b border-white/5 bg-white/3">
                  <h4 className="font-display font-bold flex items-center gap-2"><Handshake size={16} className="text-emerald-400" /> Farmer Interaction Map</h4>
                </div>
                <div className="divide-y divide-white/5">
                  {filteredInteractions.map((fi, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                      className="p-5 flex flex-wrap items-center gap-4 hover:bg-white/3 transition-all">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                        {fi.farmerName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-[140px]">
                        <p className="text-sm font-bold text-zinc-100">{fi.farmerName}</p>
                        <p className="text-[10px] text-zinc-500">{provNameById(fi.providerId, providers)} · Last: {fi.lastContact}</p>
                      </div>
                      <div className="w-32">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[9px] text-zinc-500 uppercase font-bold">Relationship</p>
                          <p className={`text-[10px] font-bold ${fi.strength >= 80 ? 'text-emerald-400' : fi.strength >= 60 ? 'text-blue-400' : 'text-amber-400'}`}>{fi.strength}%</p>
                        </div>
                        <MiniBar value={fi.strength} color={fi.strength >= 80 ? 'bg-emerald-500' : fi.strength >= 60 ? 'bg-blue-500' : 'bg-amber-500'} />
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-zinc-500 uppercase font-bold">Contacts</p>
                        <p className="text-sm font-bold text-zinc-200">{fi.interactions}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                        fi.stage === 'Customer' ? 'bg-emerald-500/10 text-emerald-400' :
                        fi.stage === 'Active Lead' ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-500/10 text-zinc-400'
                      }`}>{fi.stage}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Daily Auto Reports ───────────────────────────────────────────── */}
          {trackingTab === 'reports' && (
            <div className="space-y-5">
              <div className="glass-panel p-4 border border-emerald-500/10 bg-emerald-500/3">
                <p className="text-xs text-zinc-400">
                  <span className="text-emerald-400 font-bold">Auto-Generated Daily Reports</span> — No manual reporting needed. System automatically compiles field activity into daily summaries per provider.
                </p>
              </div>
              <div className="glass-panel overflow-hidden">
                <div className="p-5 border-b border-white/5 bg-white/3">
                  <h4 className="font-display font-bold">Daily Activity Summary</h4>
                </div>
                <div className="divide-y divide-white/5">
                  {filteredReports.map((rep, i) => (
                    <motion.div key={`${rep.providerId}-${rep.date}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      className="p-5 hover:bg-white/3 transition-all">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div>
                          <p className="text-sm font-bold text-zinc-100">{provNameById(rep.providerId, providers)}</p>
                          <p className="text-[10px] text-zinc-500 flex items-center gap-1"><Calendar size={9} /> {rep.date}</p>
                        </div>
                        <div className="text-right">
                          {rep.checkInTime ? (
                            <p className="text-[10px] font-mono text-zinc-400">{rep.checkInTime} → {rep.checkOutTime || 'Ongoing'}</p>
                          ) : (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">NO CHECK-IN</span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {[
                          { label: 'Farm Visits', value: rep.totalVisits, color: 'text-blue-400' },
                          { label: 'KM Travelled', value: `${rep.distanceTravelled}`, color: 'text-purple-400' },
                          { label: 'Sales (₹)', value: rep.salesAmount > 0 ? `₹${(rep.salesAmount / 1000).toFixed(1)}K` : '—', color: 'text-emerald-400' },
                          { label: 'Farmers', value: rep.farmersContacted, color: 'text-zinc-300' },
                          { label: 'IoT Installed', value: rep.devicesInstalled, color: 'text-amber-400' },
                        ].map(s => (
                          <div key={s.label} className="p-3 rounded-xl bg-white/5 text-center">
                            <p className={`text-lg font-display font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-[9px] text-zinc-500 uppercase font-bold mt-0.5">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Module Integration ───────────────────────────────────────────── */}
          {trackingTab === 'integration' && (
            <div className="space-y-5">
              <div className="glass-panel p-5 border border-blue-500/10">
                <p className="text-xs text-zinc-400">
                  <span className="text-blue-400 font-bold">Full Module Integration</span> — Every provider action is linked across Orders, Devices, Support, and Harvest modules. See the full impact of each provider.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  {
                    module: 'Orders & Sales', icon: <TrendingUp size={18} />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10',
                    items: [
                      { provider: 'Ravi Aqua Services', action: 'Sold Azolla 50kg + Probiotics', value: '₹12,500', date: '2026-04-18' },
                      { provider: 'Priya Field Tech', action: 'Sold Feed Package × 3', value: '₹6,500', date: '2026-04-17' },
                    ]
                  },
                  {
                    module: 'IoT Device Installs', icon: <RadioTower size={18} />, color: 'text-purple-400 bg-purple-500/10 border-purple-500/10',
                    items: [
                      { provider: 'Suresh IoT Solutions', action: 'Installed 4 sensors + gateway', value: '4 units', date: '2026-04-17' },
                      { provider: 'Priya Field Tech', action: 'Aerator controller install', value: '2 units', date: '2026-04-18' },
                    ]
                  },
                  {
                    module: 'Support Tickets', icon: <MessageSquare size={18} />, color: 'text-blue-400 bg-blue-500/10 border-blue-500/10',
                    items: [
                      { provider: 'Ravi Aqua Services', action: 'Resolved water quality issue', value: 'Ticket #T-102', date: '2026-04-18' },
                      { provider: 'Priya Field Tech', action: 'Aerator repair – Kavali', value: 'Ticket #T-98', date: '2026-04-16' },
                    ]
                  },
                  {
                    module: 'Harvest Management', icon: <Activity size={18} />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/10',
                    items: [
                      { provider: 'Ravi Aqua Services', action: 'Pre-harvest assessment done', value: 'VN Farm – 2.1T', date: '2026-04-17' },
                      { provider: 'Priya Field Tech', action: 'Recommended harvest in 10 days', value: 'Raju Farm – 1.5T', date: '2026-04-17' },
                    ]
                  },
                ].map(mod => (
                  <div key={mod.module} className={`glass-panel p-5 border ${mod.color.split(' ')[2]}`}>
                    <div className={`flex items-center gap-2 mb-4 ${mod.color.split(' ')[0]}`}>
                      <div className={`p-2 rounded-xl ${mod.color.split(' ')[1]}`}>{mod.icon}</div>
                      <h4 className="font-bold">{mod.module}</h4>
                    </div>
                    <div className="space-y-3">
                      {mod.items.map((item, j) => (
                        <div key={j} className="p-3 rounded-xl bg-white/3 border border-white/5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-bold text-zinc-200">{item.action}</p>
                              <p className="text-[9px] text-zinc-500 mt-0.5">{item.provider}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-xs font-bold ${mod.color.split(' ')[0]}`}>{item.value}</p>
                              <p className="text-[9px] text-zinc-600">{item.date}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-panel p-6 border border-white/5">
                <h4 className="font-bold mb-4 flex items-center gap-2"><UserCheck size={16} className="text-emerald-400" /> Provider Impact Score (Composite)</h4>
                <div className="space-y-4">
                  {[
                    { name: 'Ravi Aqua Services', visits: 7, sales: 31200, devices: 1, support: 2, score: 88 },
                    { name: 'Priya Field Tech', visits: 4, sales: 6500, devices: 5, support: 1, score: 76 },
                    { name: 'Suresh IoT Solutions', visits: 1, sales: 0, devices: 4, support: 0, score: 62 },
                  ].map((p, rank) => (
                    <div key={p.name} className="flex flex-wrap items-center gap-4">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        rank === 0 ? 'bg-amber-500 text-zinc-900' : rank === 1 ? 'bg-zinc-400 text-zinc-900' : 'bg-zinc-700 text-zinc-300'
                      }`}>{rank + 1}</div>
                      <div className="flex-1 min-w-[150px]">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-zinc-200">{p.name}</p>
                          <p className={`text-sm font-bold ${p.score >= 80 ? 'text-emerald-400' : p.score >= 65 ? 'text-blue-400' : 'text-amber-400'}`}>{p.score}%</p>
                        </div>
                        <MiniBar value={p.score} color={p.score >= 80 ? 'bg-emerald-500' : p.score >= 65 ? 'bg-blue-500' : 'bg-amber-500'} />
                        <div className="flex gap-4 mt-1.5">
                          <span className="text-[9px] text-zinc-600">{p.visits} visits</span>
                          <span className="text-[9px] text-zinc-600">₹{(p.sales / 1000).toFixed(1)}K sales</span>
                          <span className="text-[9px] text-zinc-600">{p.devices} devices</span>
                          <span className="text-[9px] text-zinc-600">{p.support} support</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'analytics' && (
        <div className="space-y-6">
          {/* Category breakdown */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2"><Layers size={18} className="text-blue-400" />Category Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {CATEGORIES.map(cat => {
                const count = providers.filter(p => p.category === cat).length;
                const pct = providers.length ? Math.round((count / providers.length) * 100) : 0;
                return (
                  <div key={cat} className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-zinc-500 mb-1">{cat}</p>
                    <p className="text-2xl font-display font-bold">{count}</p>
                    <div className="mt-2 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">{pct}% of total</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue insights */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2"><DollarSign size={18} className="text-emerald-400" />Commission Revenue Insights</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Avg Commission Rate', value: `${providers.length ? (providers.reduce((s, p) => s + (p.commissionRate || 0), 0) / providers.length).toFixed(1) : 0}%`, color: 'text-emerald-400' },
                { label: 'Premium Providers', value: providers.filter(p => p.subscriptionModel !== 'free').length, color: 'text-blue-400' },
                { label: 'Verified Badge Holders', value: providers.filter(p => p.verificationBadge).length, color: 'text-radiant-sun' },
                { label: 'Available Now', value: providers.filter(p => p.availability === 'available').length, color: 'text-emerald-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-5 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">{label}</p>
                  <p className={`text-3xl font-display font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top-performing per category */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2"><Award size={18} className="text-radiant-gold" />Top Provider Per Category</h3>
            <div className="space-y-3">
              {CATEGORIES.map(cat => {
                const best = [...providers].filter(p => p.category === cat).sort((a, b) => b.performanceScore - a.performanceScore)[0];
                if (!best) return null;
                return (
                  <div key={cat} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">{cat}</p>
                      <p className="font-bold">{best.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <PerfBar score={best.performanceScore} />
                      <div className="flex items-center gap-1"><Star size={11} className="fill-radiant-gold text-radiant-gold" /><span className="text-xs font-bold">{best.rating.toFixed(1)}</span></div>
                      <StatusBadge status={best.status} />
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PROVIDER DETAIL SIDE PANEL                                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {detailProvider && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetailProvider(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-zinc-900 border-l border-white/5 z-50 flex flex-col overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl emerald-gradient p-0.5">
                    <div className="w-full h-full rounded-[12px] bg-zinc-900 flex items-center justify-center text-2xl font-display font-bold text-emerald-400">{detailProvider.name.charAt(0)}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2"><h2 className="text-xl font-display font-bold">{detailProvider.name}</h2>{detailProvider.verificationBadge && <Shield size={16} className="text-emerald-400" />}</div>
                    <p className="text-xs text-zinc-500">{detailProvider.id} · {detailProvider.category}</p>
                  </div>
                </div>
                <button onClick={() => setDetailProvider(null)} className="p-2 hover:bg-white/5 rounded-lg"><X size={20} /></button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={detailProvider.status} />
                  <SubModelBadge model={detailProvider.subscriptionModel} />
                  <div className="flex items-center gap-1.5"><AvailabilityDot status={detailProvider.availability} /><span className="text-xs text-zinc-500 capitalize">{detailProvider.availability}</span></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Location', value: detailProvider.location, icon: MapPin },
                    { label: 'Phone', value: detailProvider.phone || 'Not provided', icon: Phone },
                    { label: 'Performance', value: `${detailProvider.performanceScore}%`, icon: Activity },
                    { label: 'Rating', value: detailProvider.rating > 0 ? `${detailProvider.rating.toFixed(1)} / 5` : 'Unrated', icon: Star },
                    { label: 'Assigned Farmers', value: String(detailProvider.assignedFarmersCount), icon: Users },
                    { label: 'Active Orders', value: String(detailProvider.activeOrdersCount), icon: BarChart3 },
                    { label: 'Commission Rate', value: `${detailProvider.commissionRate || 0}%`, icon: DollarSign },
                    { label: 'Complaints', value: String(complaintsForProvider(detailProvider.id).length), icon: MessageSquare },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-1.5 text-zinc-500 mb-1"><Icon size={11} /><p className="text-[10px] uppercase font-bold">{label}</p></div>
                      <p className="font-bold text-sm">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Regions */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-2">Service Regions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailProvider.regions.map(r => <span key={r} className="px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 text-zinc-300">{r}</span>)}
                  </div>
                </div>

                {/* Services */}
                {detailProvider.services && detailProvider.services.length > 0 && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-2">Services Offered</p>
                    <div className="flex flex-wrap gap-1.5">
                      {detailProvider.services.map(s => <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{s}</span>)}
                    </div>
                  </div>
                )}

                {/* Assigned Farmers */}
                {farmersForProvider(detailProvider.id).length > 0 && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-3">Assigned Farmers</p>
                    <div className="space-y-2">
                      {farmersForProvider(detailProvider.id).slice(0, 5).map(f => (
                        <div key={f.id} className="flex items-center justify-between">
                          <p className="text-sm font-bold">{f.name}</p>
                          <div className="flex items-center gap-2"><MapPin size={10} className="text-zinc-600" /><span className="text-xs text-zinc-500">{f.location}</span></div>
                        </div>
                      ))}
                      {farmersForProvider(detailProvider.id).length > 5 && <p className="text-xs text-zinc-600">+{farmersForProvider(detailProvider.id).length - 5} more</p>}
                    </div>
                  </div>
                )}

                {/* Complaints */}
                {complaintsForProvider(detailProvider.id).length > 0 && (
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                    <p className="text-xs font-bold text-red-400 uppercase mb-2">Open Complaints</p>
                    {complaintsForProvider(detailProvider.id).slice(0, 3).map(t => (
                      <div key={t.id} className="text-xs text-zinc-400 py-1 border-b border-white/5 last:border-0">{t.subject}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-5 border-t border-white/5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {detailProvider.status === 'pending' && (<>
                    <button onClick={() => { handleVerify(detailProvider); setDetailProvider({ ...detailProvider, status: 'verified', verificationBadge: true }); }}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all"><ShieldCheck size={15} />Verify</button>
                    <button onClick={() => { handleReject(detailProvider); setDetailProvider({ ...detailProvider, status: 'rejected' }); }}
                      className="py-2.5 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all"><XCircle size={15} />Reject</button>
                  </>)}
                  {detailProvider.status === 'verified' && (<>
                    <button onClick={() => { setFlagTarget(detailProvider); setIsFlagOpen(true); }}
                      className="py-2.5 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all"><Flag size={15} />Flag</button>
                    <button onClick={() => { handleDisable(detailProvider); setDetailProvider({ ...detailProvider, status: 'disabled' }); }}
                      className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all"><Lock size={15} />Suspend</button>
                  </>)}
                  {detailProvider.status === 'disabled' && (
                    <button onClick={() => { handleEnable(detailProvider); setDetailProvider({ ...detailProvider, status: 'verified' }); }}
                      className="col-span-2 py-2.5 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all"><Unlock size={15} />Re-enable Provider</button>
                  )}
                </div>
                <button onClick={() => handleDelete(detailProvider.id)} className="w-full py-2 text-xs text-zinc-600 hover:text-red-400 transition-colors flex items-center justify-center gap-1.5"><Trash2 size={13} />Remove Provider</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Add Provider Modal ──────────────────────────────── */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg glass-panel p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Building2 size={20} /></div><h2 className="text-2xl font-display font-bold">Register Provider</h2></div>
                <button onClick={() => setIsAddOpen(false)} className="p-2 hover:bg-white/5 rounded-lg"><X size={22} /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Business Name</label><input type="text" placeholder="e.g. AquaHarvest Solutions" value={newProv.name} onChange={e => setNewProv({ ...newProv, name: e.target.value })} className="input-field w-full" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Category</label>
                    <select value={newProv.category} onChange={e => setNewProv({ ...newProv, category: e.target.value as Provider['category'] })} className="input-field w-full bg-zinc-900">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Headquarters</label><input type="text" placeholder="e.g. Chennai, India" value={newProv.location} onChange={e => setNewProv({ ...newProv, location: e.target.value })} className="input-field w-full" /></div>
                </div>
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Phone</label><input type="text" placeholder="+91 98765 43210" value={newProv.phone} onChange={e => setNewProv({ ...newProv, phone: e.target.value })} className="input-field w-full" /></div>
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Operating Regions (comma-separated)</label><input type="text" placeholder="e.g. Zone A, Zone B, Zone C" value={newProv.regions} onChange={e => setNewProv({ ...newProv, regions: e.target.value })} className="input-field w-full" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Commission Rate (%)</label><input type="number" min={0} max={20} value={newProv.commissionRate} onChange={e => setNewProv({ ...newProv, commissionRate: +e.target.value })} className="input-field w-full" /></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Listing Tier</label>
                    <select value={newProv.subscriptionModel} onChange={e => setNewProv({ ...newProv, subscriptionModel: e.target.value as Provider['subscriptionModel'] })} className="input-field w-full bg-zinc-900">
                      <option value="free">Free Listing</option>
                      <option value="premium">Premium Listing</option>
                      <option value="verified">Verified Priority</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 p-3 rounded-lg bg-white/5 border border-white/5">ℹ Provider will be added as <span className="text-radiant-sun font-bold">Pending</span>. Review and verify before they go live on the platform.</p>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  <button onClick={() => setIsAddOpen(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleAddProvider} disabled={!newProv.name || !newProv.location} className="btn-primary flex items-center gap-2 disabled:opacity-50"><Building2 size={16} />Register</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Flag / Suspend Modal ─────────────────────────────── */}
      <AnimatePresence>
        {isFlagOpen && flagTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFlagOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md glass-panel p-8 shadow-2xl border border-red-500/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-red-500/10 text-red-400"><AlertTriangle size={20} /></div><h2 className="text-xl font-display font-bold">Flag & Suspend Provider</h2></div>
                <button onClick={() => setIsFlagOpen(false)} className="p-2 hover:bg-white/5 rounded-lg"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5"><p className="text-xs text-zinc-500 mb-0.5">Flagging</p><p className="font-bold text-red-400">{flagTarget.name}</p><p className="text-xs text-zinc-500">{flagTarget.category}</p></div>
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Reason</label><textarea placeholder="Describe the issue (fake services, overpricing, poor performance)..." value={flagReason} onChange={e => setFlagReason(e.target.value)} rows={4} className="input-field w-full resize-none" /></div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  <button onClick={() => setIsFlagOpen(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleFlag} disabled={!flagReason} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50 transition-all"><Flag size={15} />Flag & Suspend</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProviderRegistry;
