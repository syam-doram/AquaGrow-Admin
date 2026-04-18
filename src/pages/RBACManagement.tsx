import React, { useState } from 'react';
import {
  Crown, DollarSign, Settings, TrendingUp, Headphones, Package,
  Cpu, Users, Shield, Eye, Plus, Edit3, Trash2, X, Check,
  ChevronDown, ChevronRight, Lock, Unlock, Activity, Clock,
  AlertTriangle, CheckCircle2, Search, Filter, MoreVertical,
  Key, Layers, BarChart3, Zap, Building2, UserCheck, Star,
  ArrowUpRight, Bell, BookOpen, Truck, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Permission = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export';

type ModuleId =
  | 'dashboard' | 'farmers' | 'orders' | 'finance' | 'payments' | 'revenue'
  | 'inventory' | 'products' | 'iot_devices' | 'providers' | 'employees'
  | 'support' | 'subscriptions' | 'marketing' | 'operations' | 'harvest'
  | 'ponds' | 'logs' | 'system' | 'settings' | 'rbac';

type RoleId =
  | 'super_admin' | 'finance_admin' | 'operations_admin'
  | 'sales_admin' | 'support_admin' | 'inventory_admin'
  | 'technical_admin' | 'hr_admin';

interface ModulePermissions {
  [moduleId: string]: Permission[];
}

interface AdminRole {
  id: RoleId;
  name: string;
  icon: React.FC<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  tagline: string;
  permissions: ModulePermissions;
  users: AdminUser[];
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  roleId: RoleId;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  joinedDate: string;
  twoFA: boolean;
}

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  roleId: RoleId;
  action: string;
  module: string;
  timestamp: string;
  ip: string;
  result: 'success' | 'blocked' | 'warning';
}

// ─── Module Definitions ───────────────────────────────────────────────────────

const MODULES: { id: ModuleId; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'dashboard',     label: 'Dashboard',         icon: BarChart3   },
  { id: 'farmers',       label: 'Farmers',            icon: Users       },
  { id: 'orders',        label: 'Orders',             icon: Package     },
  { id: 'finance',       label: 'Finance',            icon: DollarSign  },
  { id: 'payments',      label: 'Payments & Payouts', icon: DollarSign  },
  { id: 'revenue',       label: 'Revenue Reports',    icon: TrendingUp  },
  { id: 'inventory',     label: 'Inventory',          icon: Layers      },
  { id: 'products',      label: 'Products',           icon: Package     },
  { id: 'iot_devices',   label: 'IoT Devices',        icon: Cpu         },
  { id: 'providers',     label: 'Providers',          icon: UserCheck   },
  { id: 'employees',     label: 'Employees',          icon: Building2   },
  { id: 'support',       label: 'Support Tickets',    icon: Headphones  },
  { id: 'subscriptions', label: 'Subscriptions',      icon: Star        },
  { id: 'marketing',     label: 'Marketing',          icon: Globe       },
  { id: 'operations',    label: 'Operations',         icon: Settings    },
  { id: 'harvest',       label: 'Harvest',            icon: Truck       },
  { id: 'ponds',         label: 'Pond Management',    icon: Activity    },
  { id: 'logs',          label: 'Audit Logs',         icon: BookOpen    },
  { id: 'system',        label: 'System Config',      icon: Zap         },
  { id: 'settings',      label: 'Settings',           icon: Settings    },
  { id: 'rbac',          label: 'RBAC / Roles',       icon: Key         },
];

const ALL_PERMISSIONS: Permission[] = ['view', 'create', 'edit', 'delete', 'approve', 'export'];

// ─── Role Definitions with full permission maps ────────────────────────────────

const ROLES: AdminRole[] = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    icon: Crown,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description: 'Full unrestricted access to every module, user, financial data and system configuration.',
    tagline: '👑 No one above this role',
    permissions: Object.fromEntries(MODULES.map(m => [m.id, [...ALL_PERMISSIONS]])),
    users: [
      { id: 'U001', name: 'Syam Kumar', email: 'syam@aquagrow.in', avatar: 'SK', roleId: 'super_admin', status: 'active', lastLogin: '2026-04-18 11:30', joinedDate: '2024-01-01', twoFA: true },
    ],
  },
  {
    id: 'finance_admin',
    name: 'Finance Admin',
    icon: DollarSign,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    description: 'Manages all money operations — payments, payouts, commissions, GST and invoices.',
    tagline: '💰 No access to user editing or operations',
    permissions: {
      dashboard:     ['view'],
      farmers:       ['view'],
      orders:        ['view', 'export'],
      finance:       ['view', 'create', 'edit', 'approve', 'export'],
      payments:      ['view', 'create', 'edit', 'approve', 'export'],
      revenue:       ['view', 'export'],
      inventory:     [],
      products:      ['view'],
      iot_devices:   [],
      providers:     [],
      employees:     ['view'],
      support:       ['view'],
      subscriptions: ['view', 'export'],
      marketing:     [],
      operations:    [],
      harvest:       ['view'],
      ponds:         [],
      logs:          ['view', 'export'],
      system:        [],
      settings:      [],
      rbac:          [],
    },
    users: [
      { id: 'U002', name: 'Priya Reddy', email: 'priya.finance@aquagrow.in', avatar: 'PR', roleId: 'finance_admin', status: 'active', lastLogin: '2026-04-18 09:15', joinedDate: '2024-03-10', twoFA: true },
      { id: 'U003', name: 'Ravi Sharma', email: 'ravi.finance@aquagrow.in', avatar: 'RS', roleId: 'finance_admin', status: 'active', lastLogin: '2026-04-17 16:45', joinedDate: '2025-01-05', twoFA: false },
    ],
  },
  {
    id: 'operations_admin',
    name: 'Operations Admin',
    icon: Settings,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    description: 'Runs day-to-day business — orders, field staff, deliveries and installations.',
    tagline: '⚙️ Core execution role',
    permissions: {
      dashboard:     ['view'],
      farmers:       ['view', 'edit'],
      orders:        ['view', 'create', 'edit', 'approve'],
      finance:       ['view'],
      payments:      ['view'],
      revenue:       ['view'],
      inventory:     ['view', 'edit'],
      products:      ['view'],
      iot_devices:   ['view', 'edit'],
      providers:     ['view', 'create', 'edit'],
      employees:     ['view', 'create', 'edit'],
      support:       ['view', 'create'],
      subscriptions: ['view'],
      marketing:     ['view'],
      operations:    ['view', 'create', 'edit', 'approve'],
      harvest:       ['view', 'create', 'edit', 'approve'],
      ponds:         ['view', 'edit'],
      logs:          ['view'],
      system:        [],
      settings:      [],
      rbac:          [],
    },
    users: [
      { id: 'U004', name: 'Venkat Naidu', email: 'venkat.ops@aquagrow.in', avatar: 'VN', roleId: 'operations_admin', status: 'active', lastLogin: '2026-04-18 10:00', joinedDate: '2024-06-15', twoFA: true },
    ],
  },
  {
    id: 'sales_admin',
    name: 'Sales / Growth Admin',
    icon: TrendingUp,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    description: 'Drives farmer onboarding, subscription sales, targets and offer management.',
    tagline: '📈 Drives business growth',
    permissions: {
      dashboard:     ['view'],
      farmers:       ['view', 'create', 'edit'],
      orders:        ['view', 'create'],
      finance:       [],
      payments:      ['view'],
      revenue:       ['view'],
      inventory:     ['view'],
      products:      ['view', 'edit'],
      iot_devices:   ['view'],
      providers:     ['view', 'create', 'edit'],
      employees:     ['view'],
      support:       ['view'],
      subscriptions: ['view', 'create', 'edit', 'approve'],
      marketing:     ['view', 'create', 'edit', 'approve', 'export'],
      operations:    ['view'],
      harvest:       ['view'],
      ponds:         ['view'],
      logs:          ['view'],
      system:        [],
      settings:      [],
      rbac:          [],
    },
    users: [
      { id: 'U005', name: 'Kavya Singh', email: 'kavya.sales@aquagrow.in', avatar: 'KS', roleId: 'sales_admin', status: 'active', lastLogin: '2026-04-18 08:30', joinedDate: '2025-02-20', twoFA: false },
      { id: 'U006', name: 'Arun Babu', email: 'arun.sales@aquagrow.in', avatar: 'AB', roleId: 'sales_admin', status: 'inactive', lastLogin: '2026-04-10 14:00', joinedDate: '2025-04-01', twoFA: false },
    ],
  },
  {
    id: 'support_admin',
    name: 'Support Admin',
    icon: Headphones,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    description: 'Handles all customer issues — tickets, escalations, SLA management.',
    tagline: '🎧 Protects user trust',
    permissions: {
      dashboard:     ['view'],
      farmers:       ['view'],
      orders:        ['view'],
      finance:       [],
      payments:      ['view'],
      revenue:       [],
      inventory:     [],
      products:      ['view'],
      iot_devices:   ['view'],
      providers:     ['view'],
      employees:     ['view'],
      support:       ['view', 'create', 'edit', 'approve', 'export'],
      subscriptions: ['view'],
      marketing:     [],
      operations:    ['view'],
      harvest:       ['view'],
      ponds:         ['view'],
      logs:          ['view'],
      system:        [],
      settings:      [],
      rbac:          [],
    },
    users: [
      { id: 'U007', name: 'Meena Patel', email: 'meena.support@aquagrow.in', avatar: 'MP', roleId: 'support_admin', status: 'active', lastLogin: '2026-04-18 11:00', joinedDate: '2024-09-01', twoFA: true },
      { id: 'U008', name: 'Kiran Rao', email: 'kiran.support@aquagrow.in', avatar: 'KR', roleId: 'support_admin', status: 'active', lastLogin: '2026-04-17 18:00', joinedDate: '2025-01-15', twoFA: false },
    ],
  },
  {
    id: 'inventory_admin',
    name: 'Inventory / Warehouse Admin',
    icon: Package,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    description: 'Controls all stock, logistics, packing, dispatch and expiry tracking.',
    tagline: '📦 Prevents stock loss & errors',
    permissions: {
      dashboard:     ['view'],
      farmers:       ['view'],
      orders:        ['view', 'edit'],
      finance:       [],
      payments:      [],
      revenue:       [],
      inventory:     ['view', 'create', 'edit', 'approve', 'export'],
      products:      ['view', 'create', 'edit'],
      iot_devices:   ['view', 'create', 'edit'],
      providers:     ['view'],
      employees:     ['view'],
      support:       ['view'],
      subscriptions: [],
      marketing:     [],
      operations:    ['view'],
      harvest:       ['view'],
      ponds:         [],
      logs:          ['view'],
      system:        [],
      settings:      [],
      rbac:          [],
    },
    users: [
      { id: 'U009', name: 'Suresh Babu', email: 'suresh.warehouse@aquagrow.in', avatar: 'SB', roleId: 'inventory_admin', status: 'active', lastLogin: '2026-04-18 07:45', joinedDate: '2024-07-10', twoFA: false },
    ],
  },
  {
    id: 'technical_admin',
    name: 'Technical Admin',
    icon: Cpu,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    description: 'Manages IoT systems, device activation, API integrations and system uptime.',
    tagline: '🧠 Keeps system running',
    permissions: {
      dashboard:     ['view'],
      farmers:       ['view'],
      orders:        ['view'],
      finance:       [],
      payments:      [],
      revenue:       [],
      inventory:     ['view'],
      products:      ['view'],
      iot_devices:   ['view', 'create', 'edit', 'delete', 'approve'],
      providers:     ['view'],
      employees:     ['view'],
      support:       ['view', 'create'],
      subscriptions: ['view'],
      marketing:     [],
      operations:    ['view'],
      harvest:       ['view'],
      ponds:         ['view', 'edit'],
      logs:          ['view', 'export'],
      system:        ['view', 'create', 'edit', 'approve'],
      settings:      ['view', 'edit'],
      rbac:          [],
    },
    users: [
      { id: 'U010', name: 'Aditya Tech', email: 'aditya.tech@aquagrow.in', avatar: 'AT', roleId: 'technical_admin', status: 'active', lastLogin: '2026-04-18 11:25', joinedDate: '2024-04-20', twoFA: true },
    ],
  },
  {
    id: 'hr_admin',
    name: 'HR / Employee Admin',
    icon: Users,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    description: 'Manages the internal team — onboarding, roles, attendance, targets and incentives.',
    tagline: '👥 Builds the team',
    permissions: {
      dashboard:     ['view'],
      farmers:       ['view'],
      orders:        ['view'],
      finance:       ['view'],
      payments:      ['view'],
      revenue:       [],
      inventory:     [],
      products:      [],
      iot_devices:   [],
      providers:     ['view', 'create', 'edit', 'approve'],
      employees:     ['view', 'create', 'edit', 'approve', 'export'],
      support:       ['view'],
      subscriptions: [],
      marketing:     [],
      operations:    ['view'],
      harvest:       ['view'],
      ponds:         [],
      logs:          ['view'],
      system:        [],
      settings:      [],
      rbac:          ['view'],
    },
    users: [
      { id: 'U011', name: 'Lakshmi Devi', email: 'lakshmi.hr@aquagrow.in', avatar: 'LD', roleId: 'hr_admin', status: 'active', lastLogin: '2026-04-18 09:45', joinedDate: '2024-11-01', twoFA: false },
    ],
  },
];

// ─── Seed Activity Logs ────────────────────────────────────────────────────────

const SEED_LOGS: ActivityLog[] = [
  { id: 'L001', userId: 'U001', userName: 'Syam Kumar',   roleId: 'super_admin',   action: 'Approved ₹45,000 payout to Govind Rao',  module: 'Payments',  timestamp: '2026-04-18 11:30', ip: '192.168.1.1',  result: 'success' },
  { id: 'L002', userId: 'U002', userName: 'Priya Reddy',  roleId: 'finance_admin', action: 'Generated GST invoice INV-2026-0118',      module: 'Finance',   timestamp: '2026-04-18 09:15', ip: '192.168.1.12', result: 'success' },
  { id: 'L003', userId: 'U007', userName: 'Meena Patel',  roleId: 'support_admin', action: 'Attempted to edit payment record PAY-009', module: 'Payments',  timestamp: '2026-04-18 08:45', ip: '192.168.1.34', result: 'blocked' },
  { id: 'L004', userId: 'U004', userName: 'Venkat Naidu', roleId: 'operations_admin', action: 'Assigned IoT install to Suresh Babu',  module: 'IoT Devices', timestamp: '2026-04-18 10:00', ip: '192.168.1.22', result: 'success' },
  { id: 'L005', userId: 'U005', userName: 'Kavya Singh',  roleId: 'sales_admin',   action: 'Created subscription for Farmer #F028',    module: 'Subscriptions', timestamp: '2026-04-18 08:30', ip: '192.168.1.55', result: 'success' },
  { id: 'L006', userId: 'U009', userName: 'Suresh Babu',  roleId: 'inventory_admin', action: 'Updated batch BSI-MED-0326 stock qty',  module: 'Inventory', timestamp: '2026-04-18 07:45', ip: '192.168.1.78', result: 'success' },
  { id: 'L007', userId: 'U003', userName: 'Ravi Sharma',  roleId: 'finance_admin', action: 'Attempted to delete farmer #F019',         module: 'Farmers',   timestamp: '2026-04-17 16:45', ip: '192.168.1.13', result: 'blocked' },
  { id: 'L008', userId: 'U010', userName: 'Aditya Tech',  roleId: 'technical_admin', action: 'Activated device SN-AQ-004 for pond',   module: 'IoT Devices', timestamp: '2026-04-18 11:25', ip: '192.168.1.90', result: 'success' },
  { id: 'L009', userId: 'U011', userName: 'Lakshmi Devi', roleId: 'hr_admin',      action: 'Onboarded new provider Raju Field Tech',   module: 'Employees', timestamp: '2026-04-18 09:45', ip: '192.168.1.45', result: 'success' },
  { id: 'L010', userId: 'U006', userName: 'Arun Babu',    roleId: 'sales_admin',   action: 'Attempted access to Finance module',       module: 'Finance',   timestamp: '2026-04-10 14:00', ip: '192.168.1.60', result: 'blocked' },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const PERM_COLOR: Record<Permission, string> = {
  view:    'bg-blue-500/15 text-blue-400 border-blue-500/20',
  create:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  edit:    'bg-amber-500/15 text-amber-400 border-amber-500/20',
  delete:  'bg-red-500/15 text-red-400 border-red-500/20',
  approve: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  export:  'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
};

const PERM_ICON: Record<Permission, string> = {
  view: '👁', create: '✚', edit: '✎', delete: '✕', approve: '✓', export: '↓',
};

type MainTab = 'roles' | 'matrix' | 'users' | 'logs';

// ─── Sub-components ───────────────────────────────────────────────────────────

const PermBadge = ({ perm }: { perm: Permission }) => (
  <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded border ${PERM_COLOR[perm]}`}>
    {PERM_ICON[perm]} {perm}
  </span>
);

const StatusDot = ({ status }: { status: AdminUser['status'] }) => (
  <span className={`w-2 h-2 rounded-full shrink-0 ${
    status === 'active' ? 'bg-emerald-400 animate-pulse' :
    status === 'suspended' ? 'bg-red-400' : 'bg-zinc-600'
  }`} />
);

// ─── Role Card ────────────────────────────────────────────────────────────────

const RoleCard = ({
  role, isSelected, onClick
}: {
  role: AdminRole;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const Icon = role.icon;
  const totalPerms = Object.values(role.permissions).flat().length;
  const moduleCount = Object.entries(role.permissions).filter(([, p]) => p.length > 0).length;

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      onClick={onClick}
      className={`glass-panel p-5 cursor-pointer border transition-all ${
        isSelected ? `${role.borderColor} shadow-lg shadow-black/20` : 'border-white/5 hover:border-white/10'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-2xl ${role.bgColor}`}>
          <Icon size={20} className={role.color} />
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${role.bgColor} ${role.borderColor} ${role.color}`}>
          {role.users.length} user{role.users.length !== 1 ? 's' : ''}
        </span>
      </div>
      <h3 className={`text-sm font-display font-bold mb-0.5 ${isSelected ? role.color : 'text-zinc-100'}`}>
        {role.name}
      </h3>
      <p className="text-[10px] text-zinc-500 mb-3 line-clamp-2">{role.description}</p>
      <div className="flex items-center gap-3 text-center pt-3 border-t border-white/5">
        <div>
          <p className={`text-base font-display font-bold ${role.color}`}>{moduleCount}</p>
          <p className="text-[8px] text-zinc-600 uppercase font-bold">modules</p>
        </div>
        <div className="w-px h-6 bg-white/5" />
        <div>
          <p className={`text-base font-display font-bold ${role.color}`}>{totalPerms}</p>
          <p className="text-[8px] text-zinc-600 uppercase font-bold">permissions</p>
        </div>
        <div className="flex-1" />
        {isSelected && <ChevronRight size={14} className={role.color} />}
      </div>
    </motion.div>
  );
};

// ─── Role Detail Panel ────────────────────────────────────────────────────────

const RoleDetailPanel = ({ role, onClose }: { role: AdminRole; onClose: () => void }) => {
  const Icon = role.icon;
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-zinc-950 border-l border-white/5 z-50 flex flex-col overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div className={`p-6 border-b border-white/5 bg-zinc-900`}>
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-2xl ${role.bgColor}`}>
            <Icon size={22} className={role.color} />
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 transition-colors">
            <X size={18} />
          </button>
        </div>
        <h2 className={`text-xl font-display font-bold ${role.color} mb-0.5`}>{role.name}</h2>
        <p className="text-xs text-zinc-400 mb-1">{role.description}</p>
        <p className="text-[10px] text-zinc-600 italic">{role.tagline}</p>
      </div>

      {/* Users in role */}
      {role.users.length > 0 && (
        <div className="px-6 pt-4 pb-2 border-b border-white/5">
          <p className="text-[9px] text-zinc-500 uppercase font-bold mb-2">Users in this role</p>
          <div className="flex flex-wrap gap-2">
            {role.users.map(u => (
              <div key={u.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                <div className={`w-5 h-5 rounded-full ${role.bgColor} ${role.color} flex items-center justify-center text-[8px] font-bold shrink-0`}>
                  {u.avatar[0]}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-200">{u.name}</p>
                  <div className="flex items-center gap-1">
                    <StatusDot status={u.status} />
                    <span className="text-[8px] text-zinc-600 capitalize">{u.status}</span>
                  </div>
                </div>
                {u.twoFA && <Shield size={10} className="text-emerald-400 ml-1" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Permission matrix per module */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-2">
          <p className="text-[9px] text-zinc-500 uppercase font-bold mb-3">Module Permissions</p>
          {MODULES.map(mod => {
            const perms = role.permissions[mod.id] ?? [];
            const isExpanded = expandedModule === mod.id;
            const ModIcon = mod.icon;
            const hasAccess = perms.length > 0;
            return (
              <div
                key={mod.id}
                onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                className={`rounded-xl border transition-all cursor-pointer ${
                  hasAccess
                    ? `${role.borderColor} bg-zinc-900 hover:bg-zinc-800`
                    : 'border-zinc-800/50 bg-zinc-900/30 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${hasAccess ? role.bgColor : 'bg-zinc-800'}`}>
                      <ModIcon size={11} className={hasAccess ? role.color : 'text-zinc-600'} />
                    </div>
                    <span className={`text-xs font-bold ${hasAccess ? 'text-zinc-100' : 'text-zinc-600'}`}>
                      {mod.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasAccess ? (
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${role.bgColor} ${role.color}`}>
                        {perms.length} perms
                      </span>
                    ) : (
                      <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-600 flex items-center gap-1">
                        <Lock size={8} /> No Access
                      </span>
                    )}
                    {hasAccess && (
                      isExpanded ? <ChevronDown size={12} className="text-zinc-500" /> : <ChevronRight size={12} className="text-zinc-600" />
                    )}
                  </div>
                </div>
                {isExpanded && hasAccess && (
                  <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                    {perms.map(p => <PermBadge key={p} perm={p} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      {/* <div className="p-5 border-t border-white/5 flex items-center gap-3">
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 text-zinc-300 hover:bg-white/10 text-xs font-bold transition-all">
          <Edit3 size={13} /> Edit Permissions
        </button>
      </div> */}
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const RBACManagement: React.FC = () => {
  const [tab, setTab] = useState<MainTab>('roles');
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
  const [logFilter, setLogFilter] = useState<'all' | 'blocked' | 'success'>('all');
  const [searchQ, setSearchQ] = useState('');

  const allUsers = ROLES.flatMap(r => r.users);
  const totalRoles = ROLES.length;
  const totalUsers = allUsers.length;
  const activeUsers = allUsers.filter(u => u.status === 'active').length;
  const blockedAttempts = SEED_LOGS.filter(l => l.result === 'blocked').length;

  const filteredLogs = SEED_LOGS.filter(l => {
    if (logFilter === 'blocked' && l.result !== 'blocked') return false;
    if (logFilter === 'success' && l.result !== 'success') return false;
    if (searchQ && !l.userName.toLowerCase().includes(searchQ.toLowerCase()) &&
        !l.action.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  const TABS: { id: MainTab; label: string; icon: React.FC<{ size?: number }> }[] = [
    { id: 'roles',  label: 'Roles & Permissions', icon: Key      },
    { id: 'matrix', label: 'Permission Matrix',   icon: Layers   },
    { id: 'users',  label: 'Admin Users',         icon: Users    },
    { id: 'logs',   label: 'Activity Log',        icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-zinc-100 flex items-center gap-2">
            <Shield size={22} className="text-amber-400" /> Role-Based Access Control
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Company hierarchy · Permission enforcement · Activity audit
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
            <AlertTriangle size={13} /> {blockedAttempts} blocked attempts today
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-900 text-sm font-bold transition-all">
            <Plus size={15} /> Invite Admin
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Admin Roles',    value: totalRoles,     color: 'text-amber-400',  icon: Key      },
          { label: 'Total Admins',   value: totalUsers,     color: 'text-blue-400',   icon: Users    },
          { label: 'Active Now',     value: activeUsers,    color: 'text-emerald-400', icon: CheckCircle2 },
          { label: 'Access Blocked', value: blockedAttempts, color: 'text-red-400',   icon: Lock     },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-panel p-5 flex items-center gap-4">
              <div className={`p-3 rounded-2xl bg-white/5`}><Icon size={18} className={s.color} /></div>
              <div>
                <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-zinc-500 uppercase font-bold">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                tab === t.id
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300'
              }`}>
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── ROLES TAB ──────────────────────────────────────────────────────────── */}
      {tab === 'roles' && (
        <div>
          {/* Hierarchy banner */}
          <div className="glass-panel p-4 mb-5 border border-amber-500/10 bg-amber-500/3">
            <div className="flex items-start gap-3">
              <Crown size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-400">
                <span className="text-amber-400 font-bold">Principle of Least Privilege:</span>
                {' '}Each admin receives only the minimum permissions required for their role.
                Finance cannot touch farmer data. Support cannot change payments. Inventory cannot see revenue.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ROLES.map(role => (
              <RoleCard
                key={role.id}
                role={role}
                isSelected={selectedRole?.id === role.id}
                onClick={() => setSelectedRole(selectedRole?.id === role.id ? null : role)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── PERMISSION MATRIX TAB ──────────────────────────────────────────────── */}
      {tab === 'matrix' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 border border-blue-500/10 bg-blue-500/3">
            <p className="text-xs text-zinc-400">
              <span className="text-blue-400 font-bold">Permission Matrix</span>
              {' '}— Full grid showing every role's access to every module. Green = full access. Orange = partial. Red dash = no access.
            </p>
          </div>
          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-zinc-900">
                    <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase whitespace-nowrap sticky left-0 bg-zinc-900 z-10 min-w-[140px]">
                      Module
                    </th>
                    {ROLES.map(r => {
                      const Icon = r.icon;
                      return (
                        <th key={r.id} className="px-3 py-3 text-center align-top">
                          <div className="flex flex-col items-center gap-1">
                            <div className={`p-1.5 rounded-lg ${r.bgColor}`}>
                              <Icon size={11} className={r.color} />
                            </div>
                            <span className={`text-[8px] font-bold ${r.color} whitespace-nowrap`}>
                              {r.name.split(' ')[0]}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {MODULES.map((mod, mi) => {
                    const ModIcon = mod.icon;
                    return (
                      <tr key={mod.id} className={`hover:bg-white/3 transition-colors ${mi % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                        <td className="px-4 py-3 sticky left-0 bg-inherit z-10">
                          <div className="flex items-center gap-2">
                            <ModIcon size={11} className="text-zinc-500 shrink-0" />
                            <span className="text-[10px] font-bold text-zinc-300 whitespace-nowrap">{mod.label}</span>
                          </div>
                        </td>
                        {ROLES.map(r => {
                          const perms = r.permissions[mod.id] ?? [];
                          const hasAll = ALL_PERMISSIONS.every(p => perms.includes(p));
                          const hasNone = perms.length === 0;
                          return (
                            <td key={r.id} className="px-2 py-2 text-center">
                              {hasNone ? (
                                <span className="inline-block w-5 h-5 rounded-full bg-red-500/10 border border-red-500/10 text-red-700 text-[9px] font-bold leading-5">—</span>
                              ) : hasAll ? (
                                <span className="inline-block w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold leading-5">✓</span>
                              ) : (
                                <span
                                  title={perms.join(', ')}
                                  className="inline-block w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/20 text-amber-400 text-[8px] font-bold leading-5 cursor-help"
                                >
                                  {perms.length}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Legend */}
            <div className="p-4 border-t border-white/5 flex items-center gap-4 flex-wrap">
              {[
                { label: 'Full Access', cls: 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400', sym: '✓' },
                { label: 'Partial Access (N = # permissions)', cls: 'bg-amber-500/15 border-amber-500/20 text-amber-400', sym: 'N' },
                { label: 'No Access', cls: 'bg-red-500/10 border-red-500/10 text-red-700', sym: '—' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full border inline-flex items-center justify-center text-[9px] font-bold ${l.cls}`}>{l.sym}</span>
                  <span className="text-[10px] text-zinc-500">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── USERS TAB ──────────────────────────────────────────────────────────── */}
      {tab === 'users' && (
        <div className="space-y-5">
          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-white/3 flex items-center justify-between flex-wrap gap-3">
              <h4 className="font-display font-bold">All Admin Users</h4>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors">
                <Plus size={12} /> Invite User
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {ROLES.flatMap(role =>
                role.users.map((u, i) => {
                  const Icon = role.icon;
                  return (
                    <motion.div key={u.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="p-5 flex flex-wrap items-center gap-4 hover:bg-white/3 transition-all group"
                    >
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-2xl ${role.bgColor} ${role.color} flex items-center justify-center text-sm font-display font-bold shrink-0`}>
                        {u.avatar}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-[160px]">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-zinc-100">{u.name}</p>
                          <StatusDot status={u.status} />
                          {u.twoFA && <Shield size={11} className="text-emerald-400" title="2FA Enabled" />}
                        </div>
                        <p className="text-[10px] text-zinc-500">{u.email}</p>
                      </div>

                      {/* Role badge */}
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${role.bgColor} border ${role.borderColor}`}>
                        <Icon size={11} className={role.color} />
                        <span className={`text-[9px] font-bold ${role.color}`}>{role.name}</span>
                      </div>

                      {/* Meta */}
                      <div className="hidden md:flex items-center gap-6 text-center">
                        <div>
                          <p className="text-[9px] text-zinc-500 uppercase font-bold">Last Login</p>
                          <p className="text-[10px] font-mono text-zinc-300">{u.lastLogin}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-zinc-500 uppercase font-bold">Joined</p>
                          <p className="text-[10px] font-mono text-zinc-400">{u.joinedDate}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-zinc-500 uppercase font-bold">2FA</p>
                          <p className={`text-[10px] font-bold ${u.twoFA ? 'text-emerald-400' : 'text-red-400'}`}>
                            {u.twoFA ? '🔒 On' : '⚠ Off'}
                          </p>
                        </div>
                      </div>

                      {/* Status */}
                      <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full capitalize shrink-0 ${
                        u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                        u.status === 'suspended' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-500/10 text-zinc-400'
                      }`}>{u.status}</span>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-zinc-200 transition-colors">
                          <Edit3 size={12} />
                        </button>
                        {u.status === 'active' && role.id !== 'super_admin' && (
                          <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors">
                            <Lock size={12} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* 2FA Warning */}
          {allUsers.some(u => !u.twoFA) && (
            <div className="glass-panel p-4 border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
              <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-400 mb-0.5">2FA Not Enabled for {allUsers.filter(u => !u.twoFA).length} users</p>
                <p className="text-[10px] text-zinc-500">
                  {allUsers.filter(u => !u.twoFA).map(u => u.name).join(', ')} — recommend enabling 2FA for all admin accounts to prevent unauthorized access.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ACTIVITY LOG TAB ───────────────────────────────────────────────────── */}
      {tab === 'logs' && (
        <div className="space-y-5">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 glass-panel px-4 py-2.5 min-w-[220px]">
              <Search size={14} className="text-zinc-500 shrink-0" />
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search user or action..."
                className="bg-transparent text-sm text-zinc-200 outline-none flex-1 placeholder:text-zinc-600"
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'success', 'blocked'] as const).map(f => (
                <button key={f} onClick={() => setLogFilter(f)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                    logFilter === f
                      ? f === 'blocked' ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                        : f === 'success' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/10 text-zinc-200 border border-white/10'
                      : 'bg-white/5 text-zinc-500 hover:bg-white/10'
                  }`}>{f}</button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Events', value: SEED_LOGS.length, color: 'text-blue-400' },
              { label: 'Successful', value: SEED_LOGS.filter(l => l.result === 'success').length, color: 'text-emerald-400' },
              { label: 'Access Blocked', value: SEED_LOGS.filter(l => l.result === 'blocked').length, color: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="glass-panel p-4 text-center">
                <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-zinc-500 uppercase font-bold mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Log list */}
          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-white/3">
              <h4 className="font-display font-bold">Admin Activity Audit Trail</h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">Every admin action logged — who, what, when, from where</p>
            </div>
            <div className="divide-y divide-white/5">
              {filteredLogs.map((log, i) => {
                const role = ROLES.find(r => r.id === log.roleId)!;
                const Icon = role.icon;
                return (
                  <motion.div key={log.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className={`p-5 flex flex-wrap items-start gap-4 hover:bg-white/3 transition-all ${
                      log.result === 'blocked' ? 'border-l-2 border-red-500/40' : ''
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      log.result === 'blocked' ? 'bg-red-500/10 text-red-400' :
                      log.result === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {log.result === 'blocked' ? <Lock size={13} /> : <CheckCircle2 size={13} />}
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${role.bgColor}`}>
                          <Icon size={9} className={role.color} />
                          <span className={`text-[8px] font-bold ${role.color}`}>{log.userName}</span>
                        </div>
                        <span className="text-[9px] text-zinc-600 font-mono">{log.module}</span>
                      </div>
                      <p className={`text-xs font-bold ${log.result === 'blocked' ? 'text-red-300' : 'text-zinc-100'}`}>
                        {log.result === 'blocked' ? '🚫 BLOCKED: ' : ''}{log.action}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-center flex-wrap shrink-0">
                      <div>
                        <p className="text-[9px] text-zinc-500 uppercase font-bold">Time</p>
                        <p className="text-[10px] font-mono text-zinc-400">{log.timestamp}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-500 uppercase font-bold">IP</p>
                        <p className="text-[10px] font-mono text-zinc-600">{log.ip}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                        log.result === 'blocked' ? 'bg-red-500/15 text-red-400' :
                        log.result === 'warning' ? 'bg-amber-500/15 text-amber-400' :
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>{log.result.toUpperCase()}</span>
                    </div>
                  </motion.div>
                );
              })}
              {filteredLogs.length === 0 && (
                <div className="py-12 text-center text-zinc-600 text-sm">No logs match the current filter</div>
              )}
            </div>
          </div>

          {/* Security rules info */}
          <div className="glass-panel p-6 border border-purple-500/10">
            <h4 className="font-bold text-purple-300 mb-4 flex items-center gap-2"><Shield size={14} /> Company-Level Security Rules</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Approval System', icon: '✓', desc: 'Payouts > ₹10,000 require Super Admin approval. Refunds require Finance Admin approval before processing.' },
                { title: 'Access Blocking', icon: '🚫', desc: 'Any attempt to access a module without permission is automatically blocked and logged with timestamp and IP.' },
                { title: 'Role Scalability', icon: '📈', desc: 'New roles like Regional Manager or Team Lead can be added as the company grows. Permissions are granular per module.' },
              ].map(r => (
                <div key={r.title} className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                  <p className="text-base mb-1">{r.icon}</p>
                  <p className="text-xs font-bold text-zinc-100 mb-1">{r.title}</p>
                  <p className="text-[10px] text-zinc-500">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Role Detail Side Panel */}
      <AnimatePresence>
        {selectedRole && tab === 'roles' && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedRole(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <RoleDetailPanel role={selectedRole} onClose={() => setSelectedRole(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RBACManagement;
