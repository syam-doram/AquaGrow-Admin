import React, { useState } from 'react';
import {
  LayoutDashboard, Users, TrendingUp, Settings, Bell,
  Search, LogOut, Menu, X, MessageSquare, ShieldCheck, DollarSign,
  BarChart3, ChevronRight, ChevronLeft, Waves, Cpu, Wallet, Megaphone,
  Building2, Truck, Activity, LifeBuoy, Package, Award, Wifi,
  CreditCard, BookOpen, ClipboardList, Key, Database,
  Sun, Moon, Fish, Boxes, UserCheck, ShoppingBag,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// ─── Types ───────────────────────────────────────────────────────────────────
interface NavItem {
  icon: React.FC<any>;
  label: string;
  path: string;
  badge?: number;
  accent?: string; // tailwind text color class for icon tint
}
interface NavSection {
  label: string;
  emoji: string;
  items: NavItem[];
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={cn(
        'relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 border',
        isDark
          ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-emerald-500/50 hover:text-white'
          : 'bg-amber-50 border-amber-200 text-amber-700 hover:border-amber-400'
      )}
    >
      <motion.div
        key={isDark ? 'moon' : 'sun'}
        initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {isDark ? <Moon size={14} /> : <Sun size={14} className="text-amber-500" />}
      </motion.div>
      <span className="hidden sm:block">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
};

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────
const SidebarItem = ({
  icon: Icon, label, path, active, collapsed, badge, accent = 'text-zinc-400',
}: NavItem & { active: boolean; collapsed: boolean }) => {
  const { isDark } = useTheme();

  return (
    <Link
      to={path}
      title={collapsed ? label : undefined}
      className={cn(
        'group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm',
        active
          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 font-semibold'
          : cn(
              'font-medium',
              isDark
                ? 'text-zinc-400 hover:text-white hover:bg-white/8'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/6'
            )
      )}
    >
      {/* Active left glow bar */}
      {active && (
        <motion.div
          layoutId="active-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-white/60"
        />
      )}

      <Icon
        size={17}
        className={cn(
          'shrink-0 transition-colors duration-200',
          active ? 'text-white' : cn('group-hover:text-emerald-400', accent)
        )}
      />

      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.15 }}
            className="flex-1 truncate"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Badge */}
      {!collapsed && badge != null && badge > 0 && (
        <span className={cn(
          'flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold',
          active ? 'bg-white/25 text-white' : 'bg-emerald-500 text-white'
        )}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}

      {/* Collapsed tooltip */}
      {collapsed && (
        <div className={cn(
          'pointer-events-none absolute left-full ml-3 z-50 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap shadow-xl',
          'opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0',
          isDark
            ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
            : 'bg-white text-zinc-800 border border-zinc-200 shadow-zinc-200/60'
        )}>
          {label}
          {badge != null && badge > 0 && (
            <span className="ml-1.5 bg-emerald-500 text-white px-1 rounded-full text-[9px]">{badge}</span>
          )}
        </div>
      )}
    </Link>
  );
};

// ─── Section Label ─────────────────────────────────────────────────────────────
const SectionLabel = ({ label, emoji, collapsed }: { label: string; emoji: string; collapsed: boolean }) => {
  const { isDark } = useTheme();
  if (collapsed) return <div className={cn('my-1.5 mx-3 h-px', isDark ? 'bg-white/6' : 'bg-black/8')} />;
  return (
    <div className="flex items-center gap-1.5 px-3 pt-4 pb-1">
      <span className="text-[11px]">{emoji}</span>
      <p className={cn(
        'text-[10px] font-bold uppercase tracking-widest',
        isDark ? 'text-zinc-600' : 'text-zinc-400'
      )}>{label}</p>
    </div>
  );
};

// ─── User Card at bottom of sidebar ─────────────────────────────────────────
const UserCard = ({ collapsed, onLogout }: { collapsed: boolean; onLogout: () => void }) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const initials = (user?.name ?? 'Admin').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className={cn('p-3 space-y-1', isDark ? 'border-t border-white/6' : 'border-t border-black/8')}>
      {/* User info row */}
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            'flex items-center gap-2.5 px-3 py-2.5 rounded-xl',
            isDark ? 'bg-white/4' : 'bg-black/4'
          )}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md shadow-emerald-500/30">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-semibold truncate', isDark ? 'text-zinc-100' : 'text-zinc-800')}>
              {user?.name ?? 'Admin'}
            </p>
            <p className={cn('text-[10px] truncate', isDark ? 'text-zinc-500' : 'text-zinc-400')}>
              {user?.role ? ROLE_LABELS[user.role] : 'Administrator'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Logout */}
      <button
        onClick={onLogout}
        title={collapsed ? 'Logout' : undefined}
        className={cn(
          'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 text-sm font-medium group',
          collapsed && 'justify-center',
          isDark
            ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10'
            : 'text-zinc-400 hover:text-red-500 hover:bg-red-50'
        )}
      >
        <LogOut size={16} className="shrink-0 transition-colors group-hover:text-red-400" />
        {!collapsed && <span>Logout</span>}
      </button>
    </div>
  );
};

// ─── Sidebar Logo / Brand ────────────────────────────────────────────────────
const SidebarBrand = ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => {
  const { isDark } = useTheme();
  return (
    <div className={cn(
      'flex items-center px-4 py-4',
      collapsed ? 'justify-center' : 'justify-between',
      isDark ? 'border-b border-white/6' : 'border-b border-black/6'
    )}>
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-500/30">
            <Fish size={16} className="text-white" />
          </div>
          <div>
            <p className={cn('font-display font-bold text-base leading-none', isDark ? 'text-white' : 'text-zinc-900')}>
              AquaGrow
            </p>
            <p className={cn('text-[9px] font-medium uppercase tracking-widest mt-0.5', isDark ? 'text-emerald-400' : 'text-emerald-600')}>
              Admin Panel
            </p>
          </div>
        </motion.div>
      )}
      {collapsed && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-500/30">
          <Fish size={16} className="text-white" />
        </div>
      )}
      <button
        onClick={onToggle}
        className={cn(
          'p-1.5 rounded-lg transition-all duration-200',
          isDark
            ? 'text-zinc-500 hover:text-white hover:bg-white/8'
            : 'text-zinc-400 hover:text-zinc-800 hover:bg-black/6',
          collapsed && 'hidden'
        )}
      >
        <ChevronLeft size={16} />
      </button>
    </div>
  );
};

// ─── Main Layout ─────────────────────────────────────────────────────────────
const Layout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed]         = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { isSuperAdmin, user } = useAuth();
  const { isDark } = useTheme();
  const role = user?.role ?? 'super_admin';

  // ─── Role-based page access ───────────────────────────────────────────────
  /** Returns true if the logged-in role is allowed to see this page */
  const canSee = (allowedRoles: string[]): boolean =>
    isSuperAdmin || allowedRoles.includes(role);

  const menuSections: NavSection[] = [
    {
      label: 'Overview', emoji: '🏠',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard',       path: '/' },
        ...(canSee(['hr_admin', 'operations_admin', 'finance_admin', 'sales_admin', 'technical_admin', 'inventory_admin', 'support_admin'])
          ? [{ icon: Database, label: 'Farm Intelligence', path: '/farm-intelligence', accent: 'text-purple-400' }]
          : []),
      ],
    },
    ...(canSee(['operations_admin', 'hr_admin'])
      ? [{
          label: 'Farmers', emoji: '🌾',
          items: [
            { icon: Package,  label: 'Harvest Management', path: '/harvests',       accent: 'text-teal-400' },
            { icon: Award,    label: 'Certifications',     path: '/certifications', accent: 'text-yellow-400' },
          ],
        }]
      : []),
    {
      label: 'Operations', emoji: '⚙️',
      items: [
        ...(canSee(['operations_admin', 'inventory_admin'])
          ? [{ icon: ShieldCheck, label: 'Provider Registry', path: '/providers', accent: 'text-blue-400' }]
          : []),
        ...(canSee(['hr_admin', 'operations_admin'])
          ? [{ icon: UserCheck, label: 'Staff & Field Ops', path: '/employees', accent: 'text-indigo-400' }]
          : []),
        ...(canSee(['technical_admin', 'inventory_admin', 'operations_admin'])
          ? [{ icon: Wifi, label: 'IoT Devices', path: '/iot-devices', accent: 'text-cyan-400' }]
          : []),
      ].filter(Boolean),
    },
    ...(canSee(['finance_admin', 'operations_admin', 'inventory_admin', 'sales_admin'])
      ? [{
          label: 'Commerce', emoji: '🛒',
          items: [
            ...(canSee(['operations_admin', 'inventory_admin'])
              ? [{ icon: ClipboardList, label: 'Order Management', path: '/order-management', accent: 'text-orange-400' }]
              : []),
            ...(canSee(['inventory_admin', 'sales_admin'])
              ? [
                  { icon: ShoppingBag, label: 'Products & Sales',  path: '/products',       accent: 'text-amber-400' },
                  { icon: DollarSign,  label: 'Price Control',     path: '/price-control',  accent: 'text-lime-400' },
                ]
              : []),
            ...(canSee(['sales_admin', 'operations_admin'])
              ? [{ icon: Building2, label: 'Buyer Management', path: '/buyers', accent: 'text-sky-400' }]
              : []),
            ...(canSee(['operations_admin', 'inventory_admin'])
              ? [{ icon: Truck, label: 'Supply Chain', path: '/supply-chain', accent: 'text-blue-300' }]
              : []),
            ...(canSee(['finance_admin', 'operations_admin'])
              ? [
                  { icon: Wallet,     label: 'Finance & Payments', path: '/finance',        accent: 'text-emerald-400' },
                  { icon: TrendingUp, label: 'Revenue Management', path: '/revenue',        accent: 'text-green-400' },
                  { icon: CreditCard, label: 'Subscriptions',      path: '/subscriptions',  accent: 'text-violet-400' },
                ]
              : []),
          ].filter(Boolean),
        }]
      : []),
    ...(canSee(['sales_admin', 'technical_admin', 'operations_admin'])
      ? [{
          label: 'Growth & Comms', emoji: '📣',
          items: [
            ...(canSee(['sales_admin'])
              ? [
                  { icon: Megaphone, label: 'Marketing', path: '/marketing', accent: 'text-pink-400' },
                  { icon: BookOpen,  label: 'Content',   path: '/content',   accent: 'text-blue-300' },
                ]
              : []),
            { icon: Bell, label: 'Alerts System', path: '/alerts', accent: 'text-amber-400' },
          ].filter(Boolean),
        }]
      : []),
    {
      label: 'System', emoji: '🔧',
      items: [
        ...(canSee(['support_admin', 'operations_admin'])
          ? [{ icon: LifeBuoy, label: 'Support Tickets', path: '/support', accent: 'text-red-400' }]
          : []),
        ...(canSee(['technical_admin'])
          ? [{ icon: Cpu, label: 'AI Control', path: '/ai-control', accent: 'text-purple-400' }]
          : []),
        ...(canSee(['operations_admin'])
          ? [{ icon: Activity, label: 'Operations', path: '/operations', accent: 'text-teal-400' }]
          : []),
        ...(isSuperAdmin
          ? [{ icon: Key, label: 'Roles & Access', path: '/rbac', accent: 'text-yellow-400' }]
          : []),
        { icon: Settings, label: 'Settings', path: '/settings', accent: 'text-zinc-400' },
      ].filter(Boolean),
    },
  ].filter(s => s.items.length > 0);

  const handleLogout = () => { navigate('/login'); };

  const sidebarStyle: React.CSSProperties = {
    background: isDark
      ? 'linear-gradient(180deg, rgba(9,9,11,0.97) 0%, rgba(14,14,18,0.97) 100%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(246,255,247,0.98) 100%)',
    backdropFilter: 'blur(24px)',
    borderRight: isDark
      ? '1px solid rgba(255,255,255,0.06)'
      : '1px solid rgba(0,0,0,0.07)',
    boxShadow: isDark
      ? '4px 0 24px rgba(0,0,0,0.4)'
      : '4px 0 24px rgba(0,0,0,0.06)',
  };

  const renderNav = (collapse: boolean) => (
    <nav className="flex-1 px-2 py-2 overflow-y-auto" style={{
      scrollbarWidth: 'thin',
      scrollbarColor: isDark ? 'rgba(5,150,105,0.25) transparent' : 'rgba(5,150,105,0.2) transparent',
    }}>
      {menuSections.map(section => (
        <div key={section.label}>
          <SectionLabel label={section.label} emoji={section.emoji} collapsed={collapse} />
          <div className="space-y-0.5 mb-1">
            {section.items.map(item => (
              <SidebarItem
                key={item.path}
                {...item}
                active={location.pathname === item.path}
                collapsed={collapse}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: isDark ? '#09090b' : '#f0fdf4', color: isDark ? '#f4f4f5' : '#18181b' }}
    >
      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 68 : 264 }}
        transition={{ type: 'spring', stiffness: 330, damping: 34 }}
        className="hidden lg:flex flex-col z-30 flex-shrink-0 relative"
        style={sidebarStyle}
      >
        <SidebarBrand collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        {renderNav(collapsed)}
        <UserCard collapsed={collapsed} onLogout={handleLogout} />

        {/* Collapsed expand button */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className={cn(
              'absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 z-10',
              isDark
                ? 'bg-zinc-700 text-zinc-300 hover:bg-emerald-500 hover:text-white border border-zinc-600'
                : 'bg-white text-zinc-500 hover:bg-emerald-500 hover:text-white border border-zinc-200'
            )}
          >
            <ChevronRight size={12} />
          </button>
        )}
      </motion.aside>

      {/* ── Mobile Overlay ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── Mobile Sidebar ──────────────────────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ x: mobileMenuOpen ? 0 : -280 }}
        transition={{ type: 'spring', stiffness: 330, damping: 34 }}
        className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden flex flex-col"
        style={sidebarStyle}
      >
        <div className={cn(
          'flex items-center justify-between px-4 py-4',
          isDark ? 'border-b border-white/6' : 'border-b border-black/6'
        )}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md">
              <Fish size={16} className="text-white" />
            </div>
            <div>
              <p className={cn('font-display font-bold text-base leading-none', isDark ? 'text-white' : 'text-zinc-900')}>AquaGrow</p>
              <p className={cn('text-[9px] uppercase tracking-widest mt-0.5', isDark ? 'text-emerald-400' : 'text-emerald-600')}>Admin Panel</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className={cn('p-1.5 rounded-lg', isDark ? 'text-zinc-500 hover:text-white hover:bg-white/8' : 'text-zinc-400 hover:text-zinc-900 hover:bg-black/6')}
          >
            <X size={18} />
          </button>
        </div>
        {renderNav(false)}
        <UserCard collapsed={false} onLogout={handleLogout} />
      </motion.aside>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header
          className="h-16 flex items-center justify-between px-5 lg:px-8 z-20 shrink-0"
          style={{
            background: isDark
              ? 'rgba(9,9,11,0.75)'
              : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
            boxShadow: isDark ? '0 1px 16px rgba(0,0,0,0.35)' : '0 1px 16px rgba(0,0,0,0.06)',
          }}
        >
          {/* Left: burger + search */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={cn(
                'lg:hidden p-2 rounded-lg transition-colors',
                isDark ? 'text-zinc-400 hover:text-white hover:bg-white/8' : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/6'
              )}
            >
              <Menu size={20} />
            </button>

            {/* Search bar */}
            <div
              className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl w-72 transition-all duration-200"
              style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.09)',
              }}
            >
              <Search size={14} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
              <input
                type="text"
                placeholder="Search anything..."
                className="bg-transparent border-none outline-none text-sm w-full"
                style={{ color: isDark ? '#f4f4f5' : '#18181b' }}
              />
              <kbd className={cn(
                'hidden lg:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border',
                isDark ? 'text-zinc-600 border-zinc-700 bg-zinc-800' : 'text-zinc-400 border-zinc-200 bg-zinc-100'
              )}>⌘K</kbd>
            </div>
          </div>

          {/* Right: theme + bell + user */}
          <div className="flex items-center gap-2 lg:gap-3">
            <ThemeToggle />

            <div className={cn('hidden sm:block h-6 w-px', isDark ? 'bg-white/8' : 'bg-black/10')} />

            {/* Notification bell */}
            <button
              className={cn(
                'relative p-2 rounded-xl transition-all duration-200',
                isDark ? 'text-zinc-400 hover:text-white hover:bg-white/8' : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/6'
              )}
            >
              <Bell size={18} />
              <span className={cn(
                'absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2',
                isDark ? 'ring-zinc-950' : 'ring-white'
              )} />
            </button>

            {/* User avatar */}
            <div className={cn(
              'flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer',
              isDark ? 'hover:bg-white/6' : 'hover:bg-black/5'
            )}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-emerald-500/25">
                {/* initials rendered via AuthContext */}
                <UserAvatar />
              </div>
              <div className="hidden sm:block text-left">
                <UserInfo />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto p-5 lg:p-8 custom-scrollbar"
          style={{ backgroundColor: isDark ? '#09090b' : '#f0fdf4' }}
        >
          <div className="max-w-[1400px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

// ─── Small inline helpers (keep Layout file self-contained) ──────────────────
const UserAvatar = () => {
  const { user } = useAuth();
  return <>{(user?.name ?? 'A').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</>;
};
const UserInfo = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  return (
    <>
      <p className={cn('text-sm font-semibold leading-none', isDark ? 'text-zinc-100' : 'text-zinc-800')}>
        {user?.name ?? 'Admin'}
      </p>
      <p className={cn('text-[10px] mt-0.5 capitalize', isDark ? 'text-zinc-500' : 'text-zinc-400')}>
        {user?.role ? ROLE_LABELS[user.role] : 'Administrator'}
      </p>
    </>
  );
};

export default Layout;
