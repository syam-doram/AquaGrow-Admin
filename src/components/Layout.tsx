import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, TrendingUp, Settings, Bell,
  Search, LogOut, Menu, X, MessageSquare, ShieldCheck, DollarSign,
  BarChart3, ChevronRight, Waves, Map, Cpu, Wallet, Megaphone,
  Building2, Truck, Activity, LifeBuoy, Package, Award, Wifi,
  CreditCard, BookOpen, ClipboardList, FileText, Key, Database,
  Sun, Moon
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const SidebarItem = ({ icon: Icon, label, path, active, collapsed }: { icon: any; label: string; path: string; active: boolean; collapsed: boolean }) => (
  <Link
    to={path}
    className={cn(
      'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative',
      active
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
    )}
  >
    <Icon size={18} className={cn('shrink-0', active ? 'text-white' : 'group-hover:text-emerald-400')} />
    {!collapsed && <span className="font-medium truncate text-sm">{label}</span>}
    {collapsed && (
      <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
        {label}
      </div>
    )}
  </Link>
);

const SectionLabel = ({ label, collapsed }: { label: string; collapsed: boolean }) => (
  collapsed
    ? <div className="my-2 border-t border-[var(--border-subtle)]" />
    : <p className="px-4 pt-5 pb-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{label}</p>
);

/* ─── Animated Theme Toggle ──────────────────────────────────────────────── */
const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative w-[52px] h-[28px] rounded-full transition-colors duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      style={{ background: isDark ? 'rgba(5,150,105,0.25)' : 'rgba(5,150,105,0.18)', border: '1px solid rgba(5,150,105,0.4)' }}
    >
      {/* Track icons */}
      <span className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none">
        <Moon size={12} className={cn('transition-all duration-300', isDark ? 'text-emerald-300 opacity-100' : 'opacity-0')} />
        <Sun  size={12} className={cn('transition-all duration-300', !isDark ? 'text-amber-400 opacity-100' : 'opacity-0')} />
      </span>
      {/* Thumb */}
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 35 }}
        className="absolute top-[3px] w-[22px] h-[22px] rounded-full emerald-gradient shadow-md flex items-center justify-center"
        style={{ left: isDark ? '3px' : 'calc(100% - 25px)' }}
      >
        {isDark
          ? <Moon size={11} className="text-white" />
          : <Sun  size={11} className="text-white" />
        }
      </motion.span>
    </button>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { isSuperAdmin, user, logout } = useAuth();
  const { isDark } = useTheme();

  const menuSections = [
    {
      label: 'Overview',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Database, label: 'Farm Intelligence (Live DB)', path: '/farm-intelligence' },
      ],
    },
    {
      label: 'Farmers',
      items: [
        { icon: Package, label: 'Harvest Management', path: '/harvests' },
        { icon: Award,   label: 'Certifications',    path: '/certifications' },
      ],
    },
    {
      label: 'Providers & Field Ops',
      items: [
        { icon: ShieldCheck, label: 'Provider Registry', path: '/providers' },
        { icon: Users,       label: 'Staff & Field Ops', path: '/employees' },
        { icon: Wifi,        label: 'IoT Devices',       path: '/iot-devices' },
      ],
    },
    {
      label: 'Commerce',
      items: [
        { icon: ClipboardList,label: 'Order Management',   path: '/order-management' },
        { icon: Package,      label: 'Products & Sales',   path: '/products' },
        { icon: DollarSign,   label: 'Price Control',      path: '/price-control' },
        { icon: Building2,    label: 'Buyer Management',   path: '/buyers' },
        { icon: Truck,        label: 'Supply Chain',       path: '/supply-chain' },
        { icon: Wallet,       label: 'Finance & Payments', path: '/finance' },
        { icon: TrendingUp,   label: 'Revenue Management', path: '/revenue' },
        { icon: CreditCard,   label: 'Subscriptions',      path: '/subscriptions' },
      ],
    },
    {
      label: 'Growth & Comms',
      items: [
        { icon: Megaphone, label: 'Marketing',    path: '/marketing' },
        { icon: BookOpen,  label: 'Content',      path: '/content' },
        { icon: Bell,      label: 'Alerts System',path: '/alerts' },
      ],
    },
    {
      label: 'System',
      items: [
        { icon: LifeBuoy,  label: 'Support Tickets',       path: '/support' },
        { icon: Cpu,       label: 'AI Control',            path: '/ai-control' },
        { icon: Activity,  label: 'Operations',            path: '/operations' },
        ...(isSuperAdmin ? [{ icon: Key, label: 'Roles & Access (RBAC)', path: '/rbac' }] : []),
        { icon: Settings,  label: 'Settings',              path: '/settings' },
      ],
    },
  ];

  const handleLogout = () => { logout(); navigate('/login'); };

  const renderNav = (collapse: boolean) => (
    <nav className="flex-1 px-3 py-2 overflow-y-auto custom-scrollbar">
      {menuSections.map(section => (
        <div key={section.label}>
          <SectionLabel label={section.label} collapsed={collapse} />
          <div className="space-y-0.5">
            {section.items.map(item => (
              <SidebarItem key={item.path} {...item} active={location.pathname === item.path} collapsed={collapse} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Sidebar – Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 272 }}
        className="hidden lg:flex flex-col z-30 flex-shrink-0"
        style={{
          background: 'var(--sidebar-bg)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        <div className="p-5 flex items-center justify-between">
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <div className="w-8 h-8 emerald-gradient rounded-lg flex items-center justify-center">
                <TrendingUp size={18} className="text-white" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>
                AquaGrow
              </span>
            </motion.div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg transition-colors ml-auto"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {renderNav(collapsed)}

        <div className="p-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 w-full rounded-xl transition-all',
              collapsed && 'justify-center'
            )}
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.10)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <LogOut size={18} />
            {!collapsed && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar – Mobile */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: mobileMenuOpen ? 0 : -300 }}
        className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden flex flex-col"
        style={{ background: 'var(--sidebar-bg)', backdropFilter: 'blur(20px)' }}
      >
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 emerald-gradient rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>
              AquaGrow
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>
        {renderNav(false)}
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header
          className="h-18 min-h-[4.5rem] flex items-center justify-between px-6 lg:px-10 z-20"
          style={{
            background: 'var(--header-bg)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Menu size={22} />
            </button>
            <div
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl w-80"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border-default)' }}
            >
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search anything..."
                className="bg-transparent border-none outline-none text-sm w-full"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            {/* 🌗 Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <button
              className="p-2.5 rounded-xl transition-colors relative"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Bell size={20} />
              <span
                className="absolute top-2 right-2 w-2 h-2 rounded-full border-2"
                style={{ background: '#10b981', borderColor: 'var(--bg-base)' }}
              />
            </button>

            <div className="h-7 w-px hidden sm:block" style={{ background: 'var(--border-default)' }} />

            <div className="flex items-center gap-3 pl-1">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {user?.name ?? 'Admin'}
                </p>
                <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                  {user?.role ? ROLE_LABELS[user.role] : 'Administrator'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl emerald-gradient p-0.5">
                <div
                  className="w-full h-full rounded-[10px] flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'var(--avatar-bg)' }}
                >
                  {user?.avatar ?? 'A'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar"
          style={{ backgroundColor: 'var(--bg-base)' }}
        >
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
