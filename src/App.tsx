import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Existing pages
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Operations from './pages/Operations';
import ProviderRegistry from './pages/ProviderRegistry';
import Finance from './pages/Finance';
import AIControl from './pages/AIControl';
import Marketing from './pages/Marketing';
import PriceControl from './pages/PriceControl';
import BuyerManagement from './pages/BuyerManagement';
import SupplyChain from './pages/SupplyChain';
import SupportTickets from './pages/SupportTickets';
import Login from './pages/Login';

// New pages
import HarvestManagement from './pages/HarvestManagement';
import Certifications from './pages/Certifications';
import IoTDevices from './pages/IoTDevices';
import Subscriptions from './pages/Subscriptions';
import ContentManagement from './pages/ContentManagement';
import ProductsManagement from './pages/ProductsManagement';
import RevenueManagement from './pages/RevenueManagement';
import OrderManagement from './pages/OrderManagement';
import EmployeeManagement from './pages/EmployeeManagement';
import Alerts from './pages/Alerts';
import SettingsPage from './pages/Settings';
import RBACManagement from './pages/RBACManagement';
import FarmIntelligence from './pages/FarmIntelligence';

// Route guards
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Super-Admin-only route guard
const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isSuperAdmin } = useAuth();
  return isSuperAdmin ? <>{children}</> : <Navigate to="/" replace />;
};

// Placeholder for pages not yet built
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="space-y-8">
    <h1 className="text-4xl font-display font-bold tracking-tight">{title}</h1>
    <div className="glass-panel p-20 text-center">
      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
        <TrendingUp size={40} className="text-zinc-600" />
      </div>
      <h3 className="text-xl font-display font-bold mb-2">Module Under Development</h3>
      <p className="text-zinc-400">The <span className="text-emerald-400">{title}</span> module is being built.</p>
    </div>
  </div>
);

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* ── Core ──────────────────────────────────────── */}
        <Route path="/"                   element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/farm-intelligence"  element={<ProtectedRoute><Layout><FarmIntelligence /></Layout></ProtectedRoute>} />

        {/* ── Farm Management ───────────────────────────── */}
        <Route path="/providers"     element={<ProtectedRoute><Layout><ProviderRegistry /></Layout></ProtectedRoute>} />
        <Route path="/employees"     element={<ProtectedRoute><Layout><EmployeeManagement /></Layout></ProtectedRoute>} />
        <Route path="/harvests"      element={<ProtectedRoute><Layout><HarvestManagement /></Layout></ProtectedRoute>} />
        <Route path="/certifications"element={<ProtectedRoute><Layout><Certifications /></Layout></ProtectedRoute>} />
        <Route path="/iot-devices"   element={<ProtectedRoute><Layout><IoTDevices /></Layout></ProtectedRoute>} />

        {/* ── Commerce ──────────────────────────────────────── */}
        <Route path="/orders"          element={<ProtectedRoute><Layout><Orders /></Layout></ProtectedRoute>} />
        <Route path="/order-management"element={<ProtectedRoute><Layout><OrderManagement /></Layout></ProtectedRoute>} />
        <Route path="/price-control"   element={<ProtectedRoute><Layout><PriceControl /></Layout></ProtectedRoute>} />
        <Route path="/buyers"          element={<ProtectedRoute><Layout><BuyerManagement /></Layout></ProtectedRoute>} />
        <Route path="/supply-chain"    element={<ProtectedRoute><Layout><SupplyChain /></Layout></ProtectedRoute>} />
        <Route path="/finance"         element={<ProtectedRoute><Layout><Finance /></Layout></ProtectedRoute>} />
        <Route path="/subscriptions"   element={<ProtectedRoute><Layout><Subscriptions /></Layout></ProtectedRoute>} />
        <Route path="/products"        element={<ProtectedRoute><Layout><ProductsManagement /></Layout></ProtectedRoute>} />
        <Route path="/revenue"         element={<ProtectedRoute><Layout><RevenueManagement /></Layout></ProtectedRoute>} />

        {/* ── Growth & Comms ────────────────────────────── */}
        <Route path="/marketing"          element={<ProtectedRoute><Layout><Marketing /></Layout></ProtectedRoute>} />
        <Route path="/content"            element={<ProtectedRoute><Layout><ContentManagement /></Layout></ProtectedRoute>} />
        <Route path="/alerts"             element={<ProtectedRoute><Layout><Alerts /></Layout></ProtectedRoute>} />

        {/* ── System ────────────────────────────────────── */}
        <Route path="/support"    element={<ProtectedRoute><Layout><SupportTickets /></Layout></ProtectedRoute>} />
        <Route path="/ai-control" element={<ProtectedRoute><Layout><AIControl /></Layout></ProtectedRoute>} />
        <Route path="/operations" element={<ProtectedRoute><Layout><Operations /></Layout></ProtectedRoute>} />
        <Route path="/settings"   element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
        <Route path="/rbac"       element={<SuperAdminRoute><Layout><RBACManagement /></Layout></SuperAdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
