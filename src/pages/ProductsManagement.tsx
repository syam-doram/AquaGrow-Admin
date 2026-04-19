import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, ShoppingBag, Plus, Search, Filter, Edit3, Trash2, X,
  AlertTriangle, CheckCircle2, XCircle, Star, TrendingUp, BarChart3,
  DollarSign, Truck, Tag, Eye, Flag, RefreshCw, Zap, Activity,
  ChevronRight, Building2, Layers, BookOpen, MessageSquare, Bell, MapPin,
  Hash, Calendar, FlaskConical, Leaf, RotateCcw, Gauge, ArrowRight,
  ClipboardList, Clock, TrendingDown, ShoppingCart, Boxes
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Supplier, ShopOrder, ProductReview, ProductCategory } from '../types';
import { storageService } from '../services/storageService';
import { fetchAllOrders, updateShopOrderStatus as apiUpdateStatus, type LiveShopOrder } from '../services/aquagrowApi';

// ─── Normalize live DB order → ShopOrder shape ───────────────────────────────
const DB_STATUS_MAP: Record<string, ShopOrder['status']> = {
  assigned: 'PENDING', confirmed: 'CONFIRMED', shipped: 'SHIPPED',
  delivered: 'DELIVERED', cancelled: 'CANCELLED',
};
const ADMIN_TO_API: Record<string, string> = {
  CONFIRMED: 'confirmed', PACKED: 'confirmed', SHIPPED: 'shipped',
  DELIVERED: 'delivered', CANCELLED: 'cancelled',
};
function normalizeLiveOrder(o: LiveShopOrder): ShopOrder {
  const items = (o.items || []).map((it: any, i: number) => ({
    productId: it.productId || `prod-${i}`,
    productName: it.productName || it.name || 'Unknown',
    category: (it.category as ProductCategory) || 'Feed',
    quantity: it.qty ?? it.quantity ?? 1,
    unit: it.unit || 'kg',
    pricePerUnit: it.unitPrice ?? it.price ?? 0,
    totalPrice: it.subtotal ?? (it.qty ?? 1) * (it.unitPrice ?? 0),
  }));
  return {
    id: `DB-${o._id.slice(-8).toUpperCase()}`,
    _dbId: o._id,
    farmerId: o.farmerId,
    farmerName: o.farmerName || 'Farmer',
    farmerPhone: o.farmerPhone || '',
    deliveryAddress: o.address || 'See farmer profile',
    deliveryCharge: 0,
    items,
    totalAmount: o.totalAmount ?? 0,
    discountAmount: 0,
    finalAmount: o.totalAmount ?? 0,
    paymentMethod: 'COD' as const,
    paymentStatus: 'PENDING' as const,
    status: DB_STATUS_MAP[o.status] ?? 'PENDING',
    createdAt: o.createdAt?.split('T')[0] ?? new Date().toISOString().split('T')[0],
    updatedAt: o.updatedAt ?? o.createdAt ?? new Date().toISOString(),
    source: 'DB_LIVE',
  } as unknown as ShopOrder & { _dbId: string; source: string };
}

// ─── Feed & Medicine Lifecycle Types ─────────────────────────────────────────
interface ProcurementBatch {
  id: string;
  productId: string;
  productName: string;
  category: 'Feed' | 'Medicine' | 'Chemical';
  supplierName: string;
  quantity: number;
  unit: string;
  purchasePrice: number;
  totalCost: number;
  batchNumber: string;
  expiryDate: string;
  receivedDate: string;
  warehouseId: string;
  status: 'RECEIVED' | 'PARTIAL' | 'PENDING';
  invoiceNo: string;
}

interface PackingJob {
  id: string;
  orderId: string;
  farmerName: string;
  items: { product: string; qty: number; unit: string; batchNo: string }[];
  status: 'PENDING' | 'IN_PROGRESS' | 'PACKED' | 'DISPATCHED';
  assignedTo: string;
  createdAt: string;
  packedAt?: string;
}

interface UsageRecord {
  farmerId: string;
  farmerName: string;
  pondName: string;
  pondSize: number; // acres
  doc: number; // day of culture
  productId: string;
  productName: string;
  category: string;
  quantityUsed: number;
  unit: string;
  usageDate: string;
  notes: string;
}

interface ReorderSuggestion {
  farmerId: string;
  farmerName: string;
  productName: string;
  currentStock: number;
  dailyUsage: number;
  daysRemaining: number;
  recommendedQty: number;
  unit: string;
  urgency: 'CRITICAL' | 'HIGH' | 'NORMAL';
}

interface BatchAlert {
  batchId: string;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  daysToExpiry: number;
  quantityRemaining: number;
  unit: string;
  severity: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'OK';
}

// ─── Feed & Medicine Seed Data ────────────────────────────────────────────────
const SEED_BATCHES: ProcurementBatch[] = [
  { id: 'PB001', productId: 'P001', productName: 'AquaGrow Pro Feed 2mm', category: 'Feed', supplierName: 'VijayaGrow Agri', quantity: 500, unit: 'kg', purchasePrice: 55, totalCost: 27500, batchNumber: 'VGA-2604-A1', expiryDate: '2026-10-31', receivedDate: '2026-04-01', warehouseId: 'WH001', status: 'RECEIVED', invoiceNo: 'VGA-INV-1122' },
  { id: 'PB002', productId: 'P002', productName: 'AquaGrow Grower Feed 3mm', category: 'Feed', supplierName: 'VijayaGrow Agri', quantity: 300, unit: 'kg', purchasePrice: 58, totalCost: 17400, batchNumber: 'VGA-2604-B2', expiryDate: '2026-11-30', receivedDate: '2026-04-05', warehouseId: 'WH001', status: 'RECEIVED', invoiceNo: 'VGA-INV-1145' },
  { id: 'PB003', productId: 'P003', productName: 'WhiteSpot Shield Medicine', category: 'Medicine', supplierName: 'BioSolutions India', quantity: 80, unit: 'litre', purchasePrice: 420, totalCost: 33600, batchNumber: 'BSI-MED-0326', expiryDate: '2026-06-15', receivedDate: '2026-03-26', warehouseId: 'WH001', status: 'RECEIVED', invoiceNo: 'BSI-INV-882' },
  { id: 'PB004', productId: 'P004', productName: 'AquaProbiotic Plus', category: 'Medicine', supplierName: 'BioSolutions India', quantity: 60, unit: 'kg', purchasePrice: 380, totalCost: 22800, batchNumber: 'BSI-PRO-0318', expiryDate: '2026-05-20', receivedDate: '2026-03-18', warehouseId: 'WH002', status: 'RECEIVED', invoiceNo: 'BSI-INV-790' },
  { id: 'PB005', productId: 'P005', productName: 'Calcium Mineral Mix', category: 'Medicine', supplierName: 'AquaVet Pharma', quantity: 100, unit: 'kg', purchasePrice: 210, totalCost: 21000, batchNumber: 'AVP-MIN-0402', expiryDate: '2027-04-01', receivedDate: '2026-04-02', warehouseId: 'WH001', status: 'RECEIVED', invoiceNo: 'AVP-INV-441' },
  { id: 'PB006', productId: 'P006', productName: 'EcoPond Disinfectant', category: 'Chemical', supplierName: 'ChemAqua Ltd', quantity: 200, unit: 'litre', purchasePrice: 165, totalCost: 33000, batchNumber: 'CA-DIS-0415', expiryDate: '2026-09-30', receivedDate: '2026-04-15', warehouseId: 'WH002', status: 'PARTIAL', invoiceNo: 'CA-INV-2231' },
  { id: 'PB007', productId: 'P007', productName: 'ZeroAmmonia Treatment', category: 'Chemical', supplierName: 'ChemAqua Ltd', quantity: 150, unit: 'litre', purchasePrice: 195, totalCost: 29250, batchNumber: 'CA-AMM-0418', expiryDate: '2026-04-30', receivedDate: '2026-04-18', warehouseId: 'WH001', status: 'PENDING', invoiceNo: 'CA-INV-2280' },
];

const SEED_PACKING: PackingJob[] = [
  { id: 'PK001', orderId: 'SHO-112', farmerName: 'Govind Rao', items: [{ product: 'AquaGrow Pro Feed 2mm', qty: 50, unit: 'kg', batchNo: 'VGA-2604-A1' }, { product: 'AquaProbiotic Plus', qty: 2, unit: 'kg', batchNo: 'BSI-PRO-0318' }], status: 'PACKED',       assignedTo: 'Balu Naidu (Picker/Packer)',  createdAt: '2026-04-18', packedAt: '2026-04-18' },
  { id: 'PK002', orderId: 'SHO-113', farmerName: 'Krishnamurthy',    items: [{ product: 'WhiteSpot Shield Medicine', qty: 5, unit: 'litre', batchNo: 'BSI-MED-0326' }],                                                                                                status: 'IN_PROGRESS', assignedTo: 'Balu Naidu (Picker/Packer)',  createdAt: '2026-04-18' },
  { id: 'PK003', orderId: 'SHO-114', farmerName: 'Venkatesh Naidu', items: [{ product: 'AquaGrow Grower Feed 3mm', qty: 100, unit: 'kg', batchNo: 'VGA-2604-B2' }, { product: 'Calcium Mineral Mix', qty: 5, unit: 'kg', batchNo: 'AVP-MIN-0402' }],                status: 'PENDING',     assignedTo: 'Balu Naidu (Picker/Packer)',  createdAt: '2026-04-18' },
  { id: 'PK004', orderId: 'SHO-110', farmerName: 'Raju Babu',       items: [{ product: 'EcoPond Disinfectant', qty: 10, unit: 'litre', batchNo: 'CA-DIS-0415' }],                                                                                                    status: 'DISPATCHED',  assignedTo: 'Rupa Devi (Inventory Ctrl)', createdAt: '2026-04-17', packedAt: '2026-04-17' },
];

const SEED_USAGE: UsageRecord[] = [
  { farmerId: 'F001', farmerName: 'Govind Rao', pondName: 'Pond A1', pondSize: 1.5, doc: 45, productId: 'P001', productName: 'AquaGrow Pro Feed 2mm', category: 'Feed', quantityUsed: 25, unit: 'kg', usageDate: '2026-04-18', notes: 'Morning + evening dose, 3x daily' },
  { farmerId: 'F001', farmerName: 'Govind Rao', pondName: 'Pond A2', pondSize: 2.0, doc: 30, productId: 'P001', productName: 'AquaGrow Pro Feed 2mm', category: 'Feed', quantityUsed: 20, unit: 'kg', usageDate: '2026-04-18', notes: '4x daily feed' },
  { farmerId: 'F002', farmerName: 'Krishnamurthy', pondName: 'Pond B3', pondSize: 2.5, doc: 58, productId: 'P002', productName: 'AquaGrow Grower Feed 3mm', category: 'Feed', quantityUsed: 35, unit: 'kg', usageDate: '2026-04-18', notes: 'Pre-harvest grower feed' },
  { farmerId: 'F001', farmerName: 'Govind Rao', pondName: 'Pond A1', pondSize: 1.5, doc: 45, productId: 'P004', productName: 'AquaProbiotic Plus', category: 'Medicine', quantityUsed: 0.5, unit: 'kg', usageDate: '2026-04-17', notes: 'Weekly probiotic dosing' },
  { farmerId: 'F003', farmerName: 'Venkatesh Naidu', pondName: 'Main Pond', pondSize: 3.0, doc: 20, productId: 'P001', productName: 'AquaGrow Pro Feed 2mm', category: 'Feed', quantityUsed: 18, unit: 'kg', usageDate: '2026-04-17', notes: 'Starter feed DOC 20' },
  { farmerId: 'F004', farmerName: 'Raju Babu', pondName: 'East Pond', pondSize: 1.0, doc: 70, productId: 'P003', productName: 'WhiteSpot Shield Medicine', category: 'Medicine', quantityUsed: 1.5, unit: 'litre', usageDate: '2026-04-16', notes: 'WhiteSpot outbreak control' },
];

const SEED_REORDER: ReorderSuggestion[] = [
  { farmerId: 'F001', farmerName: 'Govind Rao', productName: 'AquaGrow Pro Feed 2mm', currentStock: 125, dailyUsage: 45, daysRemaining: 2, recommendedQty: 200, unit: 'kg', urgency: 'CRITICAL' },
  { farmerId: 'F002', farmerName: 'Krishnamurthy', productName: 'AquaGrow Grower Feed 3mm', currentStock: 80, dailyUsage: 35, daysRemaining: 2, recommendedQty: 150, unit: 'kg', urgency: 'CRITICAL' },
  { farmerId: 'F001', farmerName: 'Govind Rao', productName: 'AquaProbiotic Plus', currentStock: 2.5, dailyUsage: 0.5, daysRemaining: 5, recommendedQty: 5, unit: 'kg', urgency: 'HIGH' },
  { farmerId: 'F003', farmerName: 'Venkatesh Naidu', productName: 'AquaGrow Pro Feed 2mm', currentStock: 250, dailyUsage: 18, daysRemaining: 13, recommendedQty: 200, unit: 'kg', urgency: 'NORMAL' },
  { farmerId: 'F004', farmerName: 'Raju Babu', productName: 'WhiteSpot Shield Medicine', currentStock: 3, dailyUsage: 1.5, daysRemaining: 2, recommendedQty: 10, unit: 'litre', urgency: 'CRITICAL' },
];

const getBatchAlerts = (): BatchAlert[] => {
  const today = new Date('2026-04-18');
  return SEED_BATCHES.map(b => {
    const expiry = new Date(b.expiryDate);
    const daysToExpiry = Math.round((expiry.getTime() - today.getTime()) / 86400000);
    const severity: BatchAlert['severity'] = daysToExpiry <= 0 ? 'EXPIRED' : daysToExpiry <= 14 ? 'CRITICAL' : daysToExpiry <= 45 ? 'WARNING' : 'OK';
    return { batchId: b.id, productName: b.productName, batchNumber: b.batchNumber, expiryDate: b.expiryDate, daysToExpiry, quantityRemaining: b.quantity, unit: b.unit, severity };
  });
};
const BATCH_ALERTS = getBatchAlerts();

const MiniBar = ({ value, color = 'bg-emerald-500' }: { value: number; color?: string }) => (
  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
    <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES: ProductCategory[] = ['Feed', 'Medicine', 'Aerator', 'IoT Device', 'Equipment', 'Chemical'];

const CAT_COLORS: Record<ProductCategory, string> = {
  Feed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Medicine: 'bg-red-500/10 text-red-400 border-red-500/20',
  Aerator: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'IoT Device': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Equipment: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Chemical: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

const ORDER_STATUS_COLORS: Record<ShopOrder['status'], string> = {
  PENDING: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  CONFIRMED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PACKED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  SHIPPED: 'bg-radiant-sun/10 text-radiant-sun border-radiant-sun/20',
  DELIVERED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
  RETURNED: 'bg-zinc-700/10 text-zinc-500 border-zinc-700/20',
};

// ─── Small Components ─────────────────────────────────────────────────────────
const CatBadge = ({ cat }: { cat: ProductCategory }) => (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CAT_COLORS[cat] ?? 'bg-zinc-700/10 text-zinc-400 border-zinc-700/20'}`}>{cat}</span>
);

const StockBar = ({ qty, low }: { qty: number; low: number }) => {
  const pct = Math.min(100, Math.round((qty / Math.max(qty, low * 2)) * 100));
  const color = qty === 0 ? 'bg-red-500' : qty <= low ? 'bg-radiant-sun' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} /></div>
      <span className={`text-xs font-mono font-bold ${qty === 0 ? 'text-red-400' : qty <= low ? 'text-radiant-sun' : 'text-zinc-300'}`}>{qty}</span>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
type Tab = 'catalog' | 'inventory' | 'orders' | 'delivery' | 'payments' | 'offers' | 'returns' | 'suppliers' | 'reviews' | 'analytics' | 'procurement' | 'packing' | 'usage' | 'reorder' | 'expiry';

type ReturnStatus = 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED';
type ReturnType = 'RETURN' | 'WARRANTY';
interface ReturnEntry {
  id: string; orderId: string; farmerId: string; farmerName: string;
  product: string; reason: string; status: ReturnStatus; type: ReturnType;
  requestedAt: string; resolution: string;
}

const ProductsManagement = () => {

  const [tab, setTab] = useState<Tab>('catalog');
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [ordersStatus, setOrdersStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [fYear,   setFYear]   = useState('all');
  const [fMonth,  setFMonth]  = useState('all');
  const [fDate,   setFDate]   = useState('all');
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [editStockId, setEditStockId] = useState<string | null>(null);
  const [editStockQty, setEditStockQty] = useState(0);
  // Offers state (local — no backend endpoint)
  const [offers, setOffers] = useState([
    { id: 'OFF-001', name: 'Feed + Medicine Combo', type: 'Bundle', discount: 15, products: ['AquaGrow Pro Feed 2mm', 'WhiteSpot Shield Medicine'], validUntil: '2026-05-31', active: true },
    { id: 'OFF-002', name: 'Monsoon Season Sale', type: 'Seasonal', discount: 20, products: ['All Feed Products'], validUntil: '2026-06-30', active: true },
    { id: 'OFF-003', name: 'IoT Device Launch', type: 'Launch', discount: 10, products: ['SmartDO Sensor v2'], validUntil: '2026-04-30', active: false },
  ]);
  // Returns state (local — no backend endpoint)
  const [returns, setReturns] = useState<ReturnEntry[]>([]);

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    category: 'Feed', status: 'active', mrp: 0, sellingPrice: 0, discount: 0,
    stockQty: 0, lowStockThreshold: 20, unit: 'kg', tags: [], rating: 0, reviewCount: 0, soldCount: 0,
  });
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    categories: ['Feed'], status: 'active', performanceScore: 80, totalProducts: 0, paymentTerms: 'Net 30',
  });

  // Load catalog/suppliers/reviews from localStorage (no backend endpoint yet)
  const loadLocal = () => {
    setProducts(storageService.getProducts());
    setSuppliers(storageService.getSuppliers());
    setReviews(storageService.getReviews());
  };

  // Fetch live orders from backend
  const loadOrders = async () => {
    setOrdersStatus('loading');
    try {
      const raw = await fetchAllOrders();
      setShopOrders(raw.map(normalizeLiveOrder));
      setOrdersStatus('online');
      setLastSync(new Date().toLocaleTimeString());
    } catch {
      setOrdersStatus('offline');
      // fallback: keep whatever was loaded before
    }
  };

  useEffect(() => { loadLocal(); loadOrders(); }, []);

  // Auto-refresh orders every 90 s
  useEffect(() => {
    const t = setInterval(loadOrders, 90_000);
    return () => clearInterval(t);
  }, []);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    totalProducts: products.length,
    lowStock: products.filter(p => p.stockQty > 0 && p.stockQty <= p.lowStockThreshold).length,
    outOfStock: products.filter(p => p.stockQty === 0).length,
    pendingOrders: shopOrders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED').length,
    totalRevenue: shopOrders.filter(o => o.paymentStatus === 'PAID').reduce((s, o) => s + o.finalAmount, 0),
    pendingReviews: reviews.filter(r => !r.isApproved && !r.isFake).length,
    fakeReviews: reviews.filter(r => r.isFake).length,
    activeSuppliers: suppliers.filter(s => s.status === 'active').length,
  }), [products, shopOrders, reviews, suppliers]);

  // ── Filtered ──────────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => products.filter(p => {
    const ms = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const mc = filterCat === 'all' || p.category === filterCat;
    const ms2 = filterStatus === 'all' || p.status === filterStatus;
    return ms && mc && ms2;
  }), [products, searchTerm, filterCat, filterStatus]);

  const filteredOrders = useMemo(() => shopOrders.filter(o => {
    const ms = o.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.toLowerCase().includes(searchTerm.toLowerCase());
    const mf = filterStatus === 'all' || o.status === filterStatus;
    const d  = o.createdAt;
    const my = fYear  === 'all' || d.startsWith(fYear);
    const mm = fMonth === 'all' || d.startsWith(fMonth);
    const md = fDate  === 'all' || d.slice(0, 10) === fDate;
    return ms && mf && my && mm && md;
  }), [shopOrders, searchTerm, filterStatus, fYear, fMonth, fDate]);

  const orderYears = useMemo(() => [...new Set(shopOrders.map(o => o.createdAt.slice(0, 4)).filter(Boolean))].sort().reverse(), [shopOrders]);
  const orderMonths = useMemo(() => fYear === 'all' ? [] : [...new Set(shopOrders.filter(o => o.createdAt.startsWith(fYear)).map(o => o.createdAt.slice(0, 7)).filter(Boolean))].sort().reverse(), [shopOrders, fYear]);
  const orderDates = useMemo(() => fMonth === 'all' ? [] : [...new Set(shopOrders.filter(o => o.createdAt.startsWith(fMonth)).map(o => o.createdAt.slice(0, 10)).filter(Boolean))].sort().reverse(), [shopOrders, fMonth]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleAddProduct = () => {
    if (!newProduct.name) return;
    const today = new Date().toISOString().split('T')[0];
    storageService.saveProduct({
      ...(newProduct as Product),
      id: `PRD-${Date.now()}`, sku: `AG-${Date.now()}`, tags: newProduct.tags || [],
      createdAt: today, updatedAt: today,
    });
    setIsAddProductOpen(false);
    setNewProduct({ category: 'Feed', status: 'active', mrp: 0, sellingPrice: 0, discount: 0, stockQty: 0, lowStockThreshold: 20, unit: 'kg', tags: [], rating: 0, reviewCount: 0, soldCount: 0 });
    loadLocal();
  };

  const handleAddSupplier = () => {
    if (!newSupplier.name) return;
    storageService.saveSupplier({
      ...(newSupplier as Supplier),
      id: `SUP-${Date.now()}`, createdAt: new Date().toISOString().split('T')[0],
    });
    setIsAddSupplierOpen(false);
    setNewSupplier({ categories: ['Feed'], status: 'active', performanceScore: 80, totalProducts: 0, paymentTerms: 'Net 30' });
    loadLocal();
  };

  const handleDeleteProduct = (id: string) => { if (window.confirm('Delete this product?')) { storageService.deleteProduct(id); loadLocal(); } };
  const handleSaveStock = (id: string) => { storageService.updateStock(id, editStockQty); setEditStockId(null); loadLocal(); };

  // Order status update — push to API for live orders, optimistic update locally
  const handleOrderStatus = async (id: string, status: ShopOrder['status']) => {
    const order = shopOrders.find(o => o.id === id);
    const dbId = order ? (order as any)._dbId : null;
    const apiStatus = ADMIN_TO_API[status];
    if (dbId && apiStatus) {
      try { await apiUpdateStatus(dbId, apiStatus); } catch { /* non-fatal */ }
    }
    setShopOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const handleApproveReview = (id: string) => { storageService.approveReview(id); loadLocal(); };
  const handleFlagReview = (id: string) => { storageService.flagReview(id); loadLocal(); };
  const handleDeleteReview = (id: string) => { storageService.deleteReview(id); loadLocal(); };

  const handleReturnStatus = (id: string, status: ReturnStatus, resolution?: string) => {
    setReturns(prev => prev.map(r => r.id === id ? { ...r, status, resolution: resolution || r.resolution } : r));
  };

  const tabs: { id: Tab; label: string; icon: React.FC<any>; badge?: number }[] = [
    { id: 'catalog', label: 'Product Catalog', icon: Package, badge: stats.totalProducts },
    { id: 'inventory', label: 'Inventory', icon: Layers, badge: stats.lowStock + stats.outOfStock },
    { id: 'procurement', label: '📦 Procurement', icon: Boxes, badge: SEED_BATCHES.filter(b => b.status === 'PENDING').length },
    { id: 'packing', label: '📋 Packing', icon: ClipboardList, badge: SEED_PACKING.filter(p => p.status === 'PENDING' || p.status === 'IN_PROGRESS').length },
    { id: 'orders', label: 'Shop Orders', icon: ShoppingBag, badge: stats.pendingOrders },
    { id: 'delivery', label: 'Delivery & Logistics', icon: Truck },
    { id: 'payments', label: 'Payments & Billing', icon: DollarSign },
    { id: 'offers', label: 'Pricing & Offers', icon: Tag },
    { id: 'returns', label: 'Returns & Warranty', icon: RefreshCw, badge: returns.filter(r => r.status === 'PENDING').length },
    { id: 'suppliers', label: 'Suppliers', icon: Building2, badge: stats.activeSuppliers },
    { id: 'reviews', label: 'Reviews', icon: Star, badge: stats.pendingReviews },
    { id: 'usage', label: '🌱 Usage Tracking', icon: Leaf },
    { id: 'reorder', label: '🔁 Auto Reorder', icon: RotateCcw, badge: SEED_REORDER.filter(r => r.urgency === 'CRITICAL').length },
    { id: 'expiry', label: '⚠️ Expiry & Batch', icon: FlaskConical, badge: BATCH_ALERTS.filter(a => a.severity === 'CRITICAL' || a.severity === 'EXPIRED').length },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Products & Sales</h1>
          <p className="text-zinc-400">Manage catalog, inventory, shop orders, suppliers, and reviews.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live orders sync badge */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${
            ordersStatus === 'online'  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
            ordersStatus === 'offline' ? 'bg-red-500/5 border-red-500/20 text-red-400' :
                                         'bg-zinc-500/5 border-zinc-500/20 text-zinc-500'
          }`}>
            <RefreshCw size={12} className={ordersStatus === 'loading' ? 'animate-spin' : ''} />
            {ordersStatus === 'online' ? `${shopOrders.length} live orders` : ordersStatus === 'offline' ? 'Orders offline' : 'Syncing...'}
          </div>
          {lastSync && <span className="text-[10px] text-zinc-600">Synced {lastSync}</span>}
          <button onClick={loadOrders} disabled={ordersStatus === 'loading'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
            <RefreshCw size={12} className={ordersStatus === 'loading' ? 'animate-spin' : ''} /> Refresh
          </button>
          {tab === 'catalog' && <button onClick={() => setIsAddProductOpen(true)} className="btn-primary flex items-center gap-2"><Plus size={18} />Add Product</button>}
          {tab === 'suppliers' && <button onClick={() => setIsAddSupplierOpen(true)} className="btn-primary flex items-center gap-2"><Plus size={18} />Add Supplier</button>}
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Products', value: stats.totalProducts, color: '' },
          { label: 'Low Stock', value: stats.lowStock, color: 'text-radiant-sun' },
          { label: 'Out of Stock', value: stats.outOfStock, color: 'text-red-400' },
          { label: 'Pending Orders', value: stats.pendingOrders, color: 'text-blue-400' },
          { label: 'Revenue', value: `₹${(stats.totalRevenue / 1000).toFixed(0)}K`, color: 'text-emerald-400' },
          { label: 'Suppliers', value: stats.activeSuppliers, color: 'text-emerald-400' },
          { label: 'Pending Reviews', value: stats.pendingReviews, color: 'text-radiant-sun' },
          { label: 'Fake Reviews', value: stats.fakeReviews, color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-panel p-4 text-center">
            <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">{label}</p>
            <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Smart Recommendation Banner */}
      <div className="glass-panel p-4 border border-emerald-500/10 bg-emerald-500/3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0"><Zap size={16} /></div>
          <p className="text-sm text-zinc-300"><span className="font-bold text-emerald-400">Smart Recommendation Engine:</span> Farmer pond size → recommend feed qty · Water quality → suggest medicines · Oxygen low → auto-suggest aerator or IoT device</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1.5 bg-white/5 rounded-2xl overflow-x-auto w-fit max-w-full">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSearchTerm(''); setFilterStatus('all'); setFilterCat('all'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${tab === t.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
            <t.icon size={15} /> {t.label}
            {t.badge !== undefined && t.badge > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-white/20 text-white' : 'bg-white/10 text-zinc-300'}`}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CATALOG TAB                                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'catalog' && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" /><input type="text" placeholder="Search products or SKU..." className="input-field w-full pl-11" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5"><Filter size={15} className="text-zinc-500" />
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-transparent outline-none text-sm">
                <option value="all">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5"><Filter size={15} className="text-zinc-500" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-transparent outline-none text-sm">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredProducts.map(p => (
              <motion.div key={p.id} whileHover={{ y: -3 }} className="glass-panel p-5 group cursor-pointer" onClick={() => setDetailProduct(p)}>
                <div className="flex items-start justify-between mb-4">
                  <CatBadge cat={p.category} />
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${p.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : p.status === 'out_of_stock' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-zinc-700/10 text-zinc-500 border-zinc-700/20'}`}>
                      {p.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    {p.stockQty <= p.lowStockThreshold && p.stockQty > 0 && <AlertTriangle size={14} className="text-radiant-sun" />}
                  </div>
                </div>

                <h3 className="font-bold text-base mb-1 group-hover:text-emerald-400 transition-colors">{p.name}</h3>
                <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{p.description}</p>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-white/5 text-center"><p className="text-[9px] text-zinc-500 mb-0.5">Price</p><p className="text-sm font-bold text-emerald-400">₹{p.sellingPrice}</p></div>
                  <div className="p-2 rounded-lg bg-white/5 text-center"><p className="text-[9px] text-zinc-500 mb-0.5">Stock</p><p className={`text-sm font-bold ${p.stockQty === 0 ? 'text-red-400' : 'text-zinc-100'}`}>{p.stockQty} {p.unit}</p></div>
                  <div className="p-2 rounded-lg bg-white/5 text-center"><p className="text-[9px] text-zinc-500 mb-0.5">Sold</p><p className="text-sm font-bold text-blue-400">{p.soldCount}</p></div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {p.tags.slice(0, 3).map(tag => <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5">{tag}</span>)}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1"><Star size={11} className="fill-radiant-gold text-radiant-gold" /><span className="text-xs font-bold">{p.rating > 0 ? p.rating.toFixed(1) : '—'}</span><span className="text-[10px] text-zinc-600">({p.reviewCount})</span></div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditStockId(p.id); setEditStockQty(p.stockQty); setTab('inventory'); }} className="p-1.5 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-all" title="Edit Stock"><Layers size={14} /></button>
                    <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* INVENTORY TAB                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'inventory' && (
        <div className="space-y-5">
          {/* Alerts */}
          {(stats.lowStock > 0 || stats.outOfStock > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.outOfStock > 0 && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <AlertTriangle size={18} className="text-red-400 shrink-0" />
                  <div><p className="font-bold text-red-400 text-sm">{stats.outOfStock} products out of stock</p><p className="text-xs text-zinc-500">Restock urgently to avoid order failures.</p></div>
                </div>
              )}
              {stats.lowStock > 0 && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-radiant-sun/5 border border-radiant-sun/10">
                  <Bell size={18} className="text-radiant-sun shrink-0" />
                  <div><p className="font-bold text-radiant-sun text-sm">{stats.lowStock} products below reorder level</p><p className="text-xs text-zinc-500">Contact suppliers before stock runs out.</p></div>
                </div>
              )}
            </div>
          )}

          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-display font-bold">Stock Levels</h3>
              <div className="flex items-center gap-3">
                <p className="text-xs text-zinc-500">Click quantity to edit inline</p>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[10px] font-bold text-amber-400">
                  <span>📦</span> Owner: Satish Goud (WH Mgr) · Rupa Devi (Inventory Ctrl)
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-white/5 bg-white/5">
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Product</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">SKU</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Stock Level</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Reorder At</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Action</th>
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {products.sort((a, b) => (a.stockQty / a.lowStockThreshold) - (b.stockQty / b.lowStockThreshold)).map(p => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4"><p className="font-bold text-sm">{p.name}</p><p className="text-[10px] text-zinc-500">{p.unit}</p></td>
                      <td className="px-5 py-4"><CatBadge cat={p.category} /></td>
                      <td className="px-5 py-4"><span className="font-mono text-xs text-zinc-400">{p.sku}</span></td>
                      <td className="px-5 py-4">
                        {editStockId === p.id ? (
                          <div className="flex items-center gap-2">
                            <input type="number" value={editStockQty} onChange={e => setEditStockQty(+e.target.value)} className="w-20 input-field py-1 text-sm text-center" autoFocus />
                            <button onClick={() => handleSaveStock(p.id)} className="p-1.5 bg-emerald-500 text-white rounded-lg"><CheckCircle2 size={13} /></button>
                            <button onClick={() => setEditStockId(null)} className="p-1.5 bg-white/5 rounded-lg text-zinc-400"><X size={13} /></button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditStockId(p.id); setEditStockQty(p.stockQty); }} className="hover:text-emerald-400 transition-colors">
                            <StockBar qty={p.stockQty} low={p.lowStockThreshold} />
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4"><span className="text-xs text-zinc-500">{p.lowStockThreshold} {p.unit}</span></td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.stockQty === 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : p.stockQty <= p.lowStockThreshold ? 'bg-radiant-sun/10 text-radiant-sun border-radiant-sun/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                          {p.stockQty === 0 ? 'OUT OF STOCK' : p.stockQty <= p.lowStockThreshold ? 'LOW STOCK' : 'OK'}
                        </span>
                      </td>
                      <td className="px-5 py-4"><p className="text-xs text-zinc-400">{p.supplierName || '—'}</p></td>
                      <td className="px-5 py-4">
                        <button onClick={() => { setEditStockId(p.id); setEditStockQty(p.stockQty); }} className="text-xs text-emerald-400 hover:text-white border border-emerald-500/20 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"><Edit3 size={11} />Update</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ORDERS TAB                                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'orders' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-48"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" /><input type="text" placeholder="Search by order ID or farmer..." className="input-field w-full pl-11" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5"><Filter size={15} className="text-zinc-500" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-transparent outline-none text-sm">
                <option value="all">All Status</option>
                {(['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'] as ShopOrder['status'][]).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {/* Year */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <span className="text-zinc-500 text-xs">📅</span>
              <select value={fYear} onChange={e => { setFYear(e.target.value); setFMonth('all'); setFDate('all'); }} className="bg-transparent outline-none text-sm">
                <option value="all">All Years</option>
                {orderYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {fYear !== 'all' && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <select value={fMonth} onChange={e => { setFMonth(e.target.value); setFDate('all'); }} className="bg-transparent outline-none text-sm">
                  <option value="all">All Months</option>
                  {orderMonths.map(m => <option key={m} value={m}>{new Date(m + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</option>)}
                </select>
              </div>
            )}
            {fMonth !== 'all' && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <select value={fDate} onChange={e => setFDate(e.target.value)} className="bg-transparent outline-none text-sm">
                  <option value="all">All Dates</option>
                  {orderDates.map(d => <option key={d} value={d}>{new Date(d).toLocaleDateString('en-IN', { day: 'numeric', weekday: 'short', month: 'short' })}</option>)}
                </select>
              </div>
            )}
            {(fYear !== 'all' || fMonth !== 'all' || fDate !== 'all') && (
              <button onClick={() => { setFYear('all'); setFMonth('all'); setFDate('all'); }}
                className="px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all">✕ Clear</button>
            )}
            <p className="flex items-center text-xs text-zinc-500 px-1">{filteredOrders.length} orders</p>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-white/5 bg-white/5">
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Order</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Farmer</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Items</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Payment</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Tracking</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOrders.map(o => {
                    const nextStatus: Partial<Record<ShopOrder['status'], ShopOrder['status']>> = {
                      PENDING: 'CONFIRMED', CONFIRMED: 'PACKED', PACKED: 'SHIPPED', SHIPPED: 'DELIVERED',
                    };
                    const next = nextStatus[o.status];
                    return (
                      <tr key={o.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4"><span className="font-mono text-xs text-emerald-400 bg-emerald-400/5 px-2 py-0.5 rounded">{o.id}</span><p className="text-[10px] text-zinc-600 mt-0.5">{o.createdAt}</p></td>
                        <td className="px-5 py-4"><p className="font-bold text-sm">{o.farmerName}</p><p className="text-[10px] text-zinc-500">{o.deliveryAddress}</p></td>
                        <td className="px-5 py-4">
                          {o.items.slice(0, 2).map((item, i) => <p key={i} className="text-xs"><span className="font-bold">{item.quantity} {item.unit}</span> <span className="text-zinc-400">{item.productName}</span></p>)}
                          {o.items.length > 2 && <p className="text-[10px] text-zinc-600">+{o.items.length - 2} more</p>}
                        </td>
                        <td className="px-5 py-4"><p className="font-mono font-bold text-sm">₹{o.finalAmount.toLocaleString()}</p><p className="text-[10px] text-zinc-500">{o.paymentMethod}</p></td>
                        <td className="px-5 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${o.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : o.paymentStatus === 'FAILED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>{o.paymentStatus}</span>
                        </td>
                        <td className="px-5 py-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ORDER_STATUS_COLORS[o.status]}`}>{o.status}</span></td>
                        <td className="px-5 py-4"><p className="text-xs font-mono text-zinc-400">{o.trackingId ?? '—'}</p></td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {next && (
                              <button onClick={() => handleOrderStatus(o.id, next)} className="text-[10px] font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all flex items-center gap-1">
                                → {next}
                              </button>
                            )}
                            {o.status !== 'CANCELLED' && o.status !== 'DELIVERED' && o.status !== 'RETURNED' && (
                              <button onClick={() => handleOrderStatus(o.id, 'CANCELLED')} className="p-1.5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg" title="Cancel"><XCircle size={14} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredOrders.length === 0 && <div className="py-16 text-center"><ShoppingBag size={36} className="text-zinc-700 mx-auto mb-3" /><p className="text-zinc-500">No orders found.</p></div>}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SUPPLIERS TAB                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {suppliers.map(s => (
            <motion.div key={s.id} whileHover={{ y: -2 }} className="glass-panel p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center text-lg font-display font-bold text-blue-400 border border-white/5">{s.name.charAt(0)}</div>
                  <div>
                    <p className="font-bold">{s.name}</p>
                    <p className="text-xs text-zinc-500">{s.contact} · {s.phone}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{s.status.toUpperCase()}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    (s as any).kycStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    (s as any).kycStatus === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>KYC: {(s as any).kycStatus || 'PENDING'}</span>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs"><span className="text-zinc-500">Location</span><span className="text-zinc-300">{s.location}</span></div>
                <div className="flex justify-between text-xs"><span className="text-zinc-500">Payment Terms</span><span className="text-zinc-300">{s.paymentTerms}</span></div>
                {(s as any).gstNumber && <div className="flex justify-between text-xs"><span className="text-zinc-500">GST</span><span className="font-mono text-zinc-300">{(s as any).gstNumber}</span></div>}
                {(s as any).licenseType && <div className="flex justify-between text-xs"><span className="text-zinc-500">{(s as any).licenseType}</span><span className="text-zinc-300">{(s as any).licenseNumber}</span></div>}
                {(s as any).marginPercent !== undefined && <div className="flex justify-between text-xs"><span className="text-zinc-500">AquaGrow Margin</span><span className="font-bold text-emerald-400">{(s as any).marginPercent}%</span></div>}
                <div className="flex justify-between text-xs items-center"><span className="text-zinc-500">Performance</span>
                  <div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.performanceScore}%` }} /></div><span className="font-mono font-bold text-xs">{s.performanceScore}%</span></div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 pt-3 border-t border-white/5 mb-3">
                {s.categories.map(c => <CatBadge key={c} cat={c} />)}
              </div>
              {/* KYC Actions */}
              {(s as any).kycStatus !== 'APPROVED' && (
                <div className="flex gap-2">
                  <button onClick={() => { storageService.saveSupplier({ ...s, kycStatus: 'APPROVED', kycApprovedAt: new Date().toISOString().split('T')[0] } as any); loadLocal(); }}
                    className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all">✓ Approve KYC</button>
                  <button onClick={() => { storageService.saveSupplier({ ...s, kycStatus: 'REJECTED' } as any); loadLocal(); }}
                    className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all">✗ Reject KYC</button>
                </div>
              )}
              {(s as any).kycStatus === 'APPROVED' && (
                <button onClick={() => { storageService.saveSupplier({ ...s, kycStatus: 'PENDING' } as any); loadLocal(); }}
                  className="w-full text-[10px] font-bold py-1.5 rounded-lg bg-zinc-800 text-zinc-500 hover:bg-zinc-700 transition-all">Revoke KYC Approval</button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* REVIEWS TAB                                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'reviews' && (
        <div className="space-y-4">
          {/* Fake Reviews Alert */}
          {stats.fakeReviews > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
              <Flag size={16} className="text-red-400 shrink-0" />
              <p className="text-sm text-red-400 font-bold">{stats.fakeReviews} suspected fake review{stats.fakeReviews > 1 ? 's' : ''} detected</p>
            </div>
          )}
          <div className="glass-panel divide-y divide-white/5">
            {reviews.map(r => (
              <div key={r.id} className={`p-5 ${r.isFake ? 'bg-red-500/3' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} size={11} className={s <= r.rating ? 'fill-radiant-gold text-radiant-gold' : 'text-zinc-700 fill-zinc-700'} />)}</div>
                      <p className="text-xs font-bold">{r.farmerName}</p>
                      <span className="text-[9px] text-zinc-600">on <span className="text-zinc-400">{r.productName}</span></span>
                    </div>
                    <p className="text-sm text-zinc-300">{r.comment}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-zinc-600">{r.createdAt}</span>
                      {r.isFake && <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 flex items-center gap-1"><Flag size={9} />Suspected Fake</span>}
                      {r.isApproved && <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1"><CheckCircle2 size={9} />Approved</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!r.isApproved && !r.isFake && <button onClick={() => handleApproveReview(r.id)} className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all" title="Approve"><CheckCircle2 size={14} /></button>}
                    {!r.isFake && <button onClick={() => handleFlagReview(r.id)} className="p-1.5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition-all" title="Flag Fake"><Flag size={14} /></button>}
                    <button onClick={() => handleDeleteReview(r.id)} className="p-1.5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ANALYTICS TAB                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          {/* Revenue summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Total Revenue (Paid)', value: `₹${stats.totalRevenue.toLocaleString()}`, color: 'text-emerald-400' },
              { label: 'Total Orders', value: shopOrders.length, color: 'text-blue-400' },
              { label: 'Avg Order Value', value: shopOrders.length ? `₹${Math.round(shopOrders.reduce((s, o) => s + o.finalAmount, 0) / shopOrders.length).toLocaleString()}` : '₹0', color: 'text-radiant-sun' },
              { label: 'Delivery Charges Collected', value: `₹${shopOrders.reduce((s, o) => s + o.deliveryCharge, 0).toLocaleString()}`, color: 'text-blue-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-panel p-5"><p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">{label}</p><p className={`text-3xl font-display font-bold ${color}`}>{value}</p></div>
            ))}
          </div>

          {/* Top-selling products */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-400" />Top Selling Products</h3>
            <div className="space-y-3">
              {[...products].sort((a, b) => b.soldCount - a.soldCount).slice(0, 6).map((p, i) => (
                <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
                  <span className={`text-lg font-display font-bold w-6 text-center ${i === 0 ? 'text-radiant-gold' : i === 1 ? 'text-zinc-300' : 'text-zinc-600'}`}>#{i + 1}</span>
                  <div className="flex-1"><p className="font-bold text-sm">{p.name}</p><p className="text-[10px] text-zinc-500">{p.category} · {p.sku}</p></div>
                  <CatBadge cat={p.category} />
                  <div className="text-right"><p className="font-bold text-sm text-emerald-400">{p.soldCount} sold</p><p className="text-[10px] text-zinc-500">₹{p.sellingPrice}/{p.unit}</p></div>
                </div>
              ))}
            </div>
          </div>

          {/* Category revenue */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2"><BarChart3 size={18} className="text-blue-400" />Revenue by Category</h3>
            <div className="space-y-3">
              {CATEGORIES.map(cat => {
                const catProducts = products.filter(p => p.category === cat);
                const revenue = catProducts.reduce((s, p) => s + p.sellingPrice * p.soldCount, 0);
                const totalRevenue = products.reduce((s, p) => s + p.sellingPrice * p.soldCount, 0);
                const pct = totalRevenue ? (revenue / totalRevenue) * 100 : 0;
                return (
                  <div key={cat} className="flex items-center gap-4">
                    <div className="w-28 shrink-0"><CatBadge cat={cat} /></div>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} /></div>
                    <div className="text-right w-24 shrink-0"><p className="text-xs font-bold text-zinc-300">₹{(revenue / 1000).toFixed(0)}K</p><p className="text-[10px] text-zinc-500">{pct.toFixed(0)}%</p></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* DELIVERY & LOGISTICS TAB                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'delivery' && (
        <div className="space-y-6">
          {/* Active Shipments */}
          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-display font-bold flex items-center gap-2"><Truck size={18} className="text-blue-400" />Active Shipments</h3>
              <p className="text-xs text-zinc-500">{shopOrders.filter(o => o.status === 'SHIPPED').length} in transit · {shopOrders.filter(o => o.status === 'PACKED').length} awaiting pickup</p>
            </div>
            <div className="divide-y divide-white/5">
              {shopOrders.filter(o => ['CONFIRMED','PACKED','SHIPPED'].includes(o.status)).map(o => (
                <div key={o.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-8 rounded-full ${o.status === 'SHIPPED' ? 'bg-radiant-sun' : o.status === 'PACKED' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-emerald-400">{o.id}</span>
                        <span className="font-bold text-sm">{o.farmerName}</span>
                      </div>
                      <p className="text-xs text-zinc-500">{o.deliveryAddress} · Delivery charge: ₹{o.deliveryCharge}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500">Tracking</p>
                      <p className="text-xs font-mono text-zinc-300">{o.trackingId ?? '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500">Est. Delivery</p>
                      <p className="text-xs font-bold">{o.estimatedDelivery ?? '—'}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${ORDER_STATUS_COLORS[o.status]}`}>{o.status}</span>
                  </div>
                </div>
              ))}
              {shopOrders.filter(o => ['CONFIRMED','PACKED','SHIPPED'].includes(o.status)).length === 0 && (
                <div className="py-12 text-center text-zinc-500 text-sm">No active shipments</div>
              )}
            </div>
          </div>

          {/* Delivery Zones */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2"><MapPin size={16} className="text-emerald-400" />Delivery Zones & Charges</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {storageService.getDeliveryZones().map((z: any) => (
                <div key={z.id} className="p-5 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold">{z.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${z.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-700/10 text-zinc-500 border-zinc-700/20'}`}>{z.isActive ? 'ACTIVE' : 'DISABLED'}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs"><span className="text-zinc-500">Delivery Charge</span><span className="font-bold text-emerald-400">₹{z.charge}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-zinc-500">Est. Days</span><span className="font-bold">{z.estimatedDays} day{z.estimatedDays > 1 ? 's' : ''}</span></div>
                    <div className="flex flex-wrap gap-1 mt-2">{z.regions.map((r: string) => <span key={r} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-zinc-400">{r}</span>)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Total Delivered', value: shopOrders.filter(o => o.status === 'DELIVERED').length, color: 'text-emerald-400' },
              { label: 'In Transit', value: shopOrders.filter(o => o.status === 'SHIPPED').length, color: 'text-radiant-sun' },
              { label: 'Awaiting Pickup', value: shopOrders.filter(o => o.status === 'PACKED').length, color: 'text-blue-400' },
              { label: 'Delivery Revenue', value: `₹${shopOrders.reduce((s, o) => s + o.deliveryCharge, 0).toLocaleString()}`, color: 'text-emerald-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-panel p-5"><p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">{label}</p><p className={`text-3xl font-display font-bold ${color}`}>{value}</p></div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PAYMENTS & BILLING TAB                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'payments' && (
        <div className="space-y-6">
          {/* Payment Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Total Collected', value: `₹${shopOrders.filter(o => o.paymentStatus === 'PAID').reduce((s, o) => s + o.finalAmount, 0).toLocaleString()}`, color: 'text-emerald-400' },
              { label: 'Pending Payment', value: shopOrders.filter(o => o.paymentStatus === 'PENDING').length, color: 'text-radiant-sun' },
              { label: 'Failed Payments', value: shopOrders.filter(o => o.paymentStatus === 'FAILED').length, color: 'text-red-400' },
              { label: 'Refunds Issued', value: shopOrders.filter(o => o.paymentStatus === 'REFUNDED').length, color: 'text-blue-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-panel p-5"><p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">{label}</p><p className={`text-3xl font-display font-bold ${color}`}>{value}</p></div>
            ))}
          </div>

          {/* Payment Method Breakdown */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2"><DollarSign size={16} className="text-emerald-400" />Payment Method Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['UPI', 'CARD', 'COD', 'WALLET'] as const).map(method => {
                const count = shopOrders.filter(o => o.paymentMethod === method).length;
                const revenue = shopOrders.filter(o => o.paymentMethod === method && o.paymentStatus === 'PAID').reduce((s, o) => s + o.finalAmount, 0);
                return (
                  <div key={method} className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-sm font-bold mb-1">{method}</p>
                    <p className="text-2xl font-display font-bold text-emerald-400">{count}</p>
                    <p className="text-xs text-zinc-500 mt-1">₹{revenue.toLocaleString()} collected</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transaction Log */}
          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/5"><h3 className="text-xl font-display font-bold">Transaction Log</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-white/5 bg-white/5">
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Farmer</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Method</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Payment Status</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Action</th>
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {shopOrders.map(o => (
                    <tr key={o.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3"><span className="font-mono text-xs text-emerald-400 bg-emerald-400/5 px-2 py-0.5 rounded">{o.id}</span></td>
                      <td className="px-5 py-3"><p className="font-bold text-sm">{o.farmerName}</p></td>
                      <td className="px-5 py-3"><p className="font-mono font-bold text-sm">₹{o.finalAmount.toLocaleString()}</p><p className="text-[10px] text-zinc-500">+₹{o.deliveryCharge} delivery</p></td>
                      <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10">{o.paymentMethod}</span></td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          o.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : o.paymentStatus === 'FAILED' ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : o.paymentStatus === 'REFUNDED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>{o.paymentStatus}</span>
                      </td>
                      <td className="px-5 py-3"><p className="text-xs text-zinc-400">{o.createdAt}</p></td>
                      <td className="px-5 py-3">
                        {o.paymentStatus === 'FAILED' && (
                          <button onClick={() => setShopOrders(prev => prev.map(x => x.id === o.id ? { ...x, paymentStatus: 'PENDING' as const } : x))}
                            className="text-xs text-blue-400 hover:text-white border border-blue-500/20 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"><RefreshCw size={10} />Retry</button>
                        )}
                        {o.paymentStatus === 'PAID' && o.status === 'RETURNED' && (
                          <button onClick={() => setShopOrders(prev => prev.map(x => x.id === o.id ? { ...x, paymentStatus: 'REFUNDED' as const } : x))}
                            className="text-xs text-radiant-sun hover:text-white border border-radiant-sun/20 px-2.5 py-1 rounded-lg transition-all">Refund</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PRICING & OFFERS TAB                                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'offers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-zinc-400 text-sm">Manage discounts, bundles, and seasonal offers.</p>
            <button onClick={() => setOffers(prev => [
              { id: `OFF-${Date.now()}`, name: 'New Offer', type: 'Discount', discount: 10, products: [], validUntil: '2026-12-31', active: true },
              ...prev
            ])} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} />Create Offer</button>
          </div>

          {/* Offer Type info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { type: 'Bundle', icon: Layers, color: 'text-blue-400 bg-blue-500/5 border-blue-500/10', desc: 'Combine multiple products at a discount (e.g. Feed + Medicine)' },
              { type: 'Seasonal', icon: Zap, color: 'text-radiant-sun bg-radiant-sun/5 border-radiant-sun/10', desc: 'Time-limited seasonal or event discounts' },
              { type: 'Subscription', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10', desc: 'Exclusive pricing for subscribed farmers' },
            ].map(({ type, icon: Icon, color, desc }) => (
              <div key={type} className={`p-4 rounded-xl border flex items-start gap-3 ${color}`}>
                <Icon size={16} className="shrink-0 mt-0.5" />
                <div><p className="font-bold text-sm">{type} Offer</p><p className="text-xs text-zinc-400 mt-0.5">{desc}</p></div>
              </div>
            ))}
          </div>

          {/* Offers List */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {offers.map((offer, i) => (
              <motion.div key={offer.id} whileHover={{ y: -2 }} className={`glass-panel p-6 border ${offer.active ? 'border-emerald-500/10' : 'border-white/5 opacity-60'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <input className="bg-transparent font-bold text-base w-full outline-none focus:border-b focus:border-emerald-500 pb-0.5" value={offer.name}
                      onChange={e => setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, name: e.target.value } : o))} />
                    <p className="text-xs text-zinc-500 mt-0.5">{offer.type}</p>
                  </div>
                  <button onClick={() => setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, active: !o.active } : o))}
                    className={`p-1.5 rounded-lg transition-all ${offer.active ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}>
                    {offer.active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-4xl font-display font-bold text-emerald-400">{offer.discount}%</span>
                  <span className="text-zinc-500 text-sm">discount</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-zinc-500">Valid Until</span><span>{offer.validUntil}</span></div>
                  <div className="flex flex-wrap gap-1 mt-2">{offer.products.map(p => <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-zinc-400">{p}</span>)}</div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <input type="range" min={0} max={50} value={offer.discount}
                      onChange={e => setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, discount: +e.target.value } : o))}
                      className="w-24 accent-emerald-500" />
                    <span className="text-xs text-zinc-500">{offer.discount}%</span>
                  </div>
                  <button onClick={() => setOffers(prev => prev.filter(o => o.id !== offer.id))} className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={13} /></button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Price Comparison */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2"><Tag size={16} className="text-radiant-sun" />MRP vs Selling Price Analysis</h3>
            <div className="space-y-3">
              {products.map(p => {
                const savings = p.mrp - p.sellingPrice;
                return (
                  <div key={p.id} className="flex items-center gap-4">
                    <div className="w-40 shrink-0"><p className="text-xs font-bold truncate">{p.name}</p><CatBadge cat={p.category} /></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-zinc-500">MRP ₹{p.mrp}</span>
                        <span className="text-xs text-zinc-600">→</span>
                        <span className="text-xs font-bold text-emerald-400">₹{p.sellingPrice}</span>
                        {savings > 0 && <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">-₹{savings}</span>}
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(p.sellingPrice / p.mrp) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-radiant-sun w-12 text-right">{p.discount}% off</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* RETURNS & WARRANTY TAB                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'returns' && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Pending', value: returns.filter(r => r.status === 'PENDING').length, color: 'text-radiant-sun' },
              { label: 'Investigating', value: returns.filter(r => r.status === 'INVESTIGATING').length, color: 'text-blue-400' },
              { label: 'Resolved', value: returns.filter(r => r.status === 'RESOLVED').length, color: 'text-emerald-400' },
              { label: 'Returns', value: returns.filter(r => r.type === 'RETURN').length, color: 'text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-panel p-5"><p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">{label}</p><p className={`text-3xl font-display font-bold ${color}`}>{value}</p></div>
            ))}
          </div>

          {/* Returns Table */}
          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/5"><h3 className="text-xl font-display font-bold">Return & Warranty Requests</h3></div>
            <div className="divide-y divide-white/5">
              {returns.map(r => (
                <div key={r.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          r.type === 'WARRANTY' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>{r.type}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          r.status === 'PENDING' ? 'bg-radiant-sun/10 text-radiant-sun border-radiant-sun/20'
                          : r.status === 'INVESTIGATING' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : r.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>{r.status}</span>
                        <span className="text-[10px] font-mono text-zinc-600">{r.id} · {r.orderId}</span>
                      </div>
                      <p className="font-bold">{r.farmerName}</p>
                      <p className="text-sm text-zinc-400">{r.product}</p>
                      <p className="text-sm text-zinc-300 mt-2 p-3 rounded-lg bg-white/3 border border-white/5">{r.reason}</p>
                      {r.resolution && <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1"><CheckCircle2 size={10} />Resolution: {r.resolution}</p>}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {r.status === 'PENDING' && (
                        <button onClick={() => handleReturnStatus(r.id, 'INVESTIGATING')}
                          className="text-xs font-bold px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all">🔍 Start Investigation</button>
                      )}
                      {r.status === 'INVESTIGATING' && (
                        <>
                          <button onClick={() => handleReturnStatus(r.id, 'RESOLVED', 'Replacement approved and dispatched.')}
                            className="text-xs font-bold px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all">✓ Approve Replacement</button>
                          <button onClick={() => handleReturnStatus(r.id, 'RESOLVED', 'Repair arranged. ETA 5 business days.')}
                            className="text-xs font-bold px-4 py-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white rounded-xl transition-all">🔧 Arrange Repair</button>
                          <button onClick={() => handleReturnStatus(r.id, 'REJECTED')}
                            className="text-xs font-bold px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all">✗ Reject Claim</button>
                        </>
                      )}
                      <p className="text-[10px] text-zinc-600 text-center">Requested: {r.requestedAt}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PROCUREMENT TAB                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'procurement' && (
        <div className="space-y-6">
          <div className="glass-panel p-4 border border-blue-500/10 bg-blue-500/3">
            <p className="text-xs text-zinc-400"><span className="text-blue-400 font-bold">Batch Procurement</span> — Every purchase is tracked with Batch Number, Expiry Date, Supplier & Invoice. Critical for medicines.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Batches', value: SEED_BATCHES.length, color: 'text-blue-400' },
              { label: 'Total Investment', value: `₹${(SEED_BATCHES.reduce((s,b) => s + b.totalCost, 0) / 1000).toFixed(0)}K`, color: 'text-emerald-400' },
              { label: 'Medicine Batches', value: SEED_BATCHES.filter(b => b.category === 'Medicine').length, color: 'text-red-400' },
              { label: 'Pending Arrival', value: SEED_BATCHES.filter(b => b.status === 'PENDING').length, color: 'text-amber-400' },
            ].map(s => (
              <div key={s.label} className="glass-panel p-5 text-center">
                <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-zinc-500 uppercase font-bold mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-white/3 flex items-center justify-between">
              <h4 className="font-display font-bold">Procurement Batches</h4>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors">
                <Plus size={12} /> New Procurement
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {SEED_BATCHES.map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="p-5 flex flex-wrap items-center gap-4 hover:bg-white/3 transition-all">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    b.category === 'Feed' ? 'bg-emerald-500/10 text-emerald-400' :
                    b.category === 'Medicine' ? 'bg-red-500/10 text-red-400' : 'bg-purple-500/10 text-purple-400'
                  }`}>
                    {b.category === 'Feed' ? <Leaf size={14} /> : b.category === 'Medicine' ? <FlaskConical size={14} /> : <Package size={14} />}
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <p className="text-sm font-bold text-zinc-100">{b.productName}</p>
                    <p className="text-[10px] text-zinc-500">{b.supplierName} · Invoice: {b.invoiceNo}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-[9px] text-zinc-500 uppercase font-bold">Batch No</p>
                      <p className="text-[10px] font-mono font-bold text-blue-400">{b.batchNumber}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 uppercase font-bold">Qty</p>
                      <p className="text-xs font-bold text-zinc-200">{b.quantity} {b.unit}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 uppercase font-bold">Cost</p>
                      <p className="text-xs font-mono font-bold text-emerald-400">₹{b.totalCost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 uppercase font-bold">Expiry</p>
                      <p className={`text-xs font-bold ${
                        new Date(b.expiryDate) < new Date('2026-05-01') ? 'text-red-400' :
                        new Date(b.expiryDate) < new Date('2026-07-01') ? 'text-amber-400' : 'text-zinc-300'
                      }`}>{b.expiryDate}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                    b.status === 'RECEIVED' ? 'bg-emerald-500/10 text-emerald-400' :
                    b.status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                  }`}>{b.status}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PACKING TAB                                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'packing' && (
        <div className="space-y-6">
          <div className="glass-panel p-4 border border-purple-500/10 bg-purple-500/3">
            <p className="text-xs text-zinc-400"><span className="text-purple-400 font-bold">Packing Management</span> — Pick correct items per order, verify batch numbers, confirm pack before dispatch. Prevents wrong deliveries.</p>
          </div>

          {/* ── Warehouse Team Assignment ─────────────────────────────────── */}
          <div className="glass-panel p-5 border border-amber-500/10">
            <h3 className="text-sm font-bold text-zinc-300 mb-4 flex items-center gap-2">
              <span>📦</span> Warehouse Team — Task Ownership
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  name: 'Satish Goud',
                  role: 'Warehouse Manager',
                  emoji: '🏭',
                  color: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
                  tasks: ['Supervise all packing jobs', 'Approve batch usage', 'Coordinate dispatch with Logistics'],
                  jobCount: SEED_PACKING.filter(p => p.status === 'PENDING' || p.status === 'IN_PROGRESS').length,
                  jobLabel: 'Active Jobs',
                },
                {
                  name: 'Balu Naidu',
                  role: 'Picker / Packer',
                  emoji: '🫙',
                  color: 'border-blue-500/20 bg-blue-500/5 text-blue-400',
                  tasks: ['Pick items from shelves', 'Verify batch numbers', 'Seal & label packages'],
                  jobCount: SEED_PACKING.filter(p => p.assignedTo.includes('Balu')).length,
                  jobLabel: 'Assigned to Balu',
                },
                {
                  name: 'Rupa Devi',
                  role: 'Inventory Controller',
                  emoji: '📊',
                  color: 'border-purple-500/20 bg-purple-500/5 text-purple-400',
                  tasks: ['Update stock after packing', 'Flag expiry/low stock', 'Procurement requests'],
                  jobCount: SEED_PACKING.filter(p => p.assignedTo.includes('Rupa')).length,
                  jobLabel: 'Assigned to Rupa',
                },
                {
                  name: 'Suresh Babu',
                  role: 'QC Inspector',
                  emoji: '✅',
                  color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
                  tasks: ['Quality check before seal', 'Verify weight & quantity', 'Sign off on PACKED status'],
                  jobCount: SEED_PACKING.filter(p => p.status === 'PACKED').length,
                  jobLabel: 'QC Cleared',
                },
              ].map(({ name, role, emoji, color, tasks, jobCount, jobLabel }) => (
                <div key={name} className={`p-4 rounded-2xl border ${color.split(' ').slice(0,2).join(' ')}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold text-zinc-200">{emoji} {name}</p>
                      <p className="text-[9px] text-zinc-500 mt-0.5">{role}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>{jobCount} {jobLabel}</span>
                  </div>
                  <ul className="space-y-1">
                    {tasks.map(t => (
                      <li key={t} className="text-[9px] text-zinc-500 flex items-start gap-1.5">
                        <span className="text-zinc-700 mt-0.5 shrink-0">›</span>{t}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Pending Pack', value: SEED_PACKING.filter(p => p.status === 'PENDING').length, color: 'text-amber-400' },
              { label: 'In Progress', value: SEED_PACKING.filter(p => p.status === 'IN_PROGRESS').length, color: 'text-blue-400' },
              { label: 'Packed', value: SEED_PACKING.filter(p => p.status === 'PACKED').length, color: 'text-emerald-400' },
              { label: 'Dispatched', value: SEED_PACKING.filter(p => p.status === 'DISPATCHED').length, color: 'text-purple-400' },
            ].map(s => (
              <div key={s.label} className="glass-panel p-5 text-center">
                <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-zinc-500 uppercase font-bold mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {SEED_PACKING.map((job, i) => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`glass-panel p-6 border ${
                  job.status === 'PENDING' ? 'border-amber-500/10' :
                  job.status === 'IN_PROGRESS' ? 'border-blue-500/10' :
                  job.status === 'PACKED' ? 'border-emerald-500/10' : 'border-zinc-500/10'
                }`}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-zinc-100">{job.farmerName}</p>
                      <span className="font-mono text-[9px] text-zinc-600">{job.orderId}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500">Assigned to: {job.assignedTo} · Created: {job.createdAt}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${
                      job.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                      job.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-400' :
                      job.status === 'PACKED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'
                    }`}>{job.status.replace('_', ' ')}</span>
                    {job.status === 'IN_PROGRESS' && (
                      <button className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500 hover:text-zinc-900 transition-all">
                        ✓ Mark Packed
                      </button>
                    )}
                    {job.status === 'PENDING' && (
                      <button className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all">
                        Start Packing
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {job.items.map((item, j) => (
                    <div key={j} className="flex items-center justify-between p-3 rounded-xl bg-white/5 text-xs">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={12} className={job.status === 'PACKED' || job.status === 'DISPATCHED' ? 'text-emerald-400' : 'text-zinc-600'} />
                        <span className="font-bold text-zinc-200">{item.product}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-zinc-300">{item.qty} {item.unit}</span>
                        <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">Batch: {item.batchNo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* USAGE TRACKING TAB                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'usage' && (
        <div className="space-y-6">
          <div className="glass-panel p-4 border border-emerald-500/10 bg-emerald-500/3">
            <p className="text-xs text-zinc-400"><span className="text-emerald-400 font-bold">Smart Usage Tracking</span> — Track what each farmer uses, in which pond, at which DOC stage. This data powers auto-reorder and upselling recommendations.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Records', value: SEED_USAGE.length, color: 'text-emerald-400' },
              { label: 'Feed Usage Today', value: `${SEED_USAGE.filter(u => u.usageDate === '2026-04-18' && u.category === 'Feed').reduce((s,u) => s + u.quantityUsed, 0)} kg`, color: 'text-blue-400' },
              { label: 'Medicine Recorded', value: `${SEED_USAGE.filter(u => u.category === 'Medicine').length} uses`, color: 'text-red-400' },
              { label: 'Farmers Tracked', value: new Set(SEED_USAGE.map(u => u.farmerId)).size, color: 'text-purple-400' },
            ].map(s => (
              <div key={s.label} className="glass-panel p-5 text-center">
                <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-zinc-500 uppercase font-bold mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-white/3">
              <h4 className="font-display font-bold">Farm Usage Log</h4>
            </div>
            <div className="divide-y divide-white/5">
              {SEED_USAGE.map((u, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="p-5 flex flex-wrap items-start gap-4 hover:bg-white/3 transition-all">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    u.category === 'Feed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {u.category === 'Feed' ? <Leaf size={14} /> : <FlaskConical size={14} />}
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <p className="text-sm font-bold text-zinc-100">{u.productName}</p>
                    <p className="text-[10px] text-zinc-500">{u.farmerName} · {u.pondName} · {u.pondSize} acres</p>
                    <p className="text-[10px] text-zinc-600 italic mt-0.5">{u.notes}</p>
                  </div>
                  <div className="flex items-center gap-6 text-center flex-wrap">
                    <div>
                      <p className="text-[9px] text-zinc-500 uppercase font-bold">DOC</p>
                      <p className="text-sm font-bold text-zinc-200">{u.doc}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 uppercase font-bold">Used</p>
                      <p className="text-sm font-bold text-emerald-400">{u.quantityUsed} {u.unit}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 uppercase font-bold">Date</p>
                      <p className="text-[10px] font-mono text-zinc-400">{u.usageDate}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${
                      u.category === 'Feed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>{u.category}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          {/* Smart recommendations */}
          <div className="glass-panel p-6 border border-blue-500/10">
            <h4 className="font-bold text-blue-300 mb-4 flex items-center gap-2"><Zap size={14} /> AI-Backed Recommendations</h4>
            <div className="space-y-3">
              {[
                { farmer: 'Govind Rao', pond: 'Pond A1', doc: 45, rec: 'Switch from 2mm to 3mm grower feed — DOC 45+ needs bigger pellets for better FCR', type: 'UPSELL' },
                { farmer: 'Krishnamurthy', pond: 'Pond B3', doc: 58, rec: 'Consider pre-harvest probiotics to improve gut health and shrimp quality', type: 'HEALTH' },
                { farmer: 'Venkatesh Naidu', pond: 'Main Pond', doc: 20, rec: 'Introduce mineral mix from DOC 25 onwards for shell strength', type: 'NUTRITION' },
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <Zap size={12} className="text-blue-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-zinc-100">{r.farmer} — {r.pond} (DOC {r.doc})</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{r.rec}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    r.type === 'UPSELL' ? 'bg-emerald-500/10 text-emerald-400' :
                    r.type === 'HEALTH' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                  }`}>{r.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* AUTO REORDER TAB                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'reorder' && (
        <div className="space-y-6">
          <div className="glass-panel p-4 border border-amber-500/10 bg-amber-500/3">
            <p className="text-xs text-zinc-400"><span className="text-amber-400 font-bold">Smart Auto Reorder</span> — System predicts feed/medicine depletion per farmer based on daily usage. Alerts are sent before stock runs out.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Critical (≤2 days)', value: SEED_REORDER.filter(r => r.urgency === 'CRITICAL').length, color: 'text-red-400' },
              { label: 'High (≤5 days)', value: SEED_REORDER.filter(r => r.urgency === 'HIGH').length, color: 'text-amber-400' },
              { label: 'Normal', value: SEED_REORDER.filter(r => r.urgency === 'NORMAL').length, color: 'text-emerald-400' },
            ].map(s => (
              <div key={s.label} className="glass-panel p-5 text-center">
                <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-zinc-500 uppercase font-bold mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {SEED_REORDER.sort((a, b) => a.daysRemaining - b.daysRemaining).map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                className={`glass-panel p-6 border ${
                  r.urgency === 'CRITICAL' ? 'border-red-500/20 bg-red-500/3' :
                  r.urgency === 'HIGH' ? 'border-amber-500/20 bg-amber-500/3' : 'border-zinc-500/10'
                }`}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm font-bold text-zinc-100">{r.farmerName}</p>
                    <p className="text-[10px] text-zinc-500">{r.productName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${
                      r.urgency === 'CRITICAL' ? 'bg-red-500/10 text-red-400' :
                      r.urgency === 'HIGH' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>{r.urgency}</span>
                    <button className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      r.urgency === 'CRITICAL' ? 'bg-red-500 text-white hover:bg-red-400' :
                      r.urgency === 'HIGH' ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    }`}>Notify Farmer</button>
                    <button className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all">Create Order</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="p-3 rounded-xl bg-white/5 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold mb-0.5">Current Stock</p>
                    <p className="text-sm font-bold text-zinc-200">{r.currentStock} {r.unit}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold mb-0.5">Daily Usage</p>
                    <p className="text-sm font-bold text-zinc-200">{r.dailyUsage} {r.unit}</p>
                  </div>
                  <div className={`p-3 rounded-xl text-center ${
                    r.daysRemaining <= 2 ? 'bg-red-500/10' : r.daysRemaining <= 5 ? 'bg-amber-500/10' : 'bg-white/5'
                  }`}>
                    <p className="text-[9px] text-zinc-500 uppercase font-bold mb-0.5">Days Left</p>
                    <p className={`text-sm font-bold ${
                      r.daysRemaining <= 2 ? 'text-red-400 animate-pulse' : r.daysRemaining <= 5 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>{r.daysRemaining} days</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold mb-0.5">Suggest Order</p>
                    <p className="text-sm font-bold text-blue-400">{r.recommendedQty} {r.unit}</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Stock Level</p>
                    <p className="text-[9px] text-zinc-500">{Math.round((r.currentStock / (r.currentStock + r.recommendedQty)) * 100)}%</p>
                  </div>
                  <MiniBar
                    value={Math.round((r.currentStock / (r.currentStock + r.recommendedQty)) * 100)}
                    color={r.daysRemaining <= 2 ? 'bg-red-500' : r.daysRemaining <= 5 ? 'bg-amber-500' : 'bg-emerald-500'}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* EXPIRY & BATCH TRACKING TAB                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'expiry' && (
        <div className="space-y-6">
          <div className="glass-panel p-4 border border-red-500/10 bg-red-500/3">
            <p className="text-xs text-zinc-400"><span className="text-red-400 font-bold">Expiry & Batch Monitor</span> — All medicine and chemical batches tracked by expiry date. Prevents selling expired stock. Mandatory for compliance.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Expired Now', value: BATCH_ALERTS.filter(a => a.severity === 'EXPIRED').length, color: 'text-red-400' },
              { label: 'Expiring ≤14d', value: BATCH_ALERTS.filter(a => a.severity === 'CRITICAL').length, color: 'text-red-400' },
              { label: 'Expiring ≤45d', value: BATCH_ALERTS.filter(a => a.severity === 'WARNING').length, color: 'text-amber-400' },
              { label: 'Safe Batches', value: BATCH_ALERTS.filter(a => a.severity === 'OK').length, color: 'text-emerald-400' },
            ].map(s => (
              <div key={s.label} className="glass-panel p-5 text-center">
                <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-zinc-500 uppercase font-bold mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-white/3">
              <h4 className="font-display font-bold">Batch Expiry Dashboard</h4>
            </div>
            <div className="divide-y divide-white/5">
              {BATCH_ALERTS.sort((a, b) => a.daysToExpiry - b.daysToExpiry).map((a, i) => (
                <motion.div key={a.batchId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="p-5 flex flex-wrap items-center gap-4 hover:bg-white/3 transition-all">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    a.severity === 'EXPIRED' || a.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400' :
                    a.severity === 'WARNING' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    <FlaskConical size={14} />
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <p className="text-sm font-bold text-zinc-100">{a.productName}</p>
                    <p className="text-[10px] font-mono text-blue-400">Batch: {a.batchNumber}</p>
                  </div>
                  <div className="flex items-center gap-6 flex-wrap text-center">
                    <div>
                      <p className="text-[9px] text-zinc-500 uppercase font-bold">Expiry</p>
                      <p className={`text-xs font-bold ${
                        a.severity === 'EXPIRED' || a.severity === 'CRITICAL' ? 'text-red-400' :
                        a.severity === 'WARNING' ? 'text-amber-400' : 'text-zinc-300'
                      }`}>{a.expiryDate}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 uppercase font-bold">Days</p>
                      <p className={`text-sm font-bold ${
                        a.daysToExpiry <= 0 ? 'text-red-400' : a.daysToExpiry <= 14 ? 'text-red-400' :
                        a.daysToExpiry <= 45 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>{a.daysToExpiry <= 0 ? 'EXPIRED' : `${a.daysToExpiry}d`}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 uppercase font-bold">Qty</p>
                      <p className="text-xs font-bold text-zinc-300">{a.quantityRemaining} {a.unit}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      a.severity === 'EXPIRED' ? 'bg-red-500 text-white' :
                      a.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400' :
                      a.severity === 'WARNING' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>{a.severity}</span>
                    {(a.severity === 'EXPIRED' || a.severity === 'CRITICAL') && (
                      <button className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all shrink-0">⚠ Remove from Sale</button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* PRODUCT DETAIL SIDE PANEL                    */}
      {/* ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {detailProduct && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetailProduct(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-zinc-900 border-l border-white/5 z-50 flex flex-col overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div><h2 className="text-xl font-display font-bold">{detailProduct.name}</h2><p className="text-xs text-zinc-500">{detailProduct.sku} · {detailProduct.category}</p></div>
                <button onClick={() => setDetailProduct(null)} className="p-2 hover:bg-white/5 rounded-lg"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                <div className="flex flex-wrap gap-2">
                  <CatBadge cat={detailProduct.category} />
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${detailProduct.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{detailProduct.status.replace(/_/g, ' ').toUpperCase()}</span>
                  {(detailProduct as any).isRegulatoryApproved
                    ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">✓ Approved for Sale</span>
                    : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-red-500/10 text-red-400 border-red-500/20">🔒 Pending Approval</span>
                  }
                </div>
                <p className="text-sm text-zinc-400">{detailProduct.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'MRP', value: `₹${detailProduct.mrp}/${detailProduct.unit}` },
                    { label: 'Selling Price', value: `₹${detailProduct.sellingPrice}/${detailProduct.unit}` },
                    { label: 'Discount', value: `${detailProduct.discount}%` },
                    { label: 'Stock', value: `${detailProduct.stockQty} ${detailProduct.unit}` },
                    { label: 'Reorder At', value: `${detailProduct.lowStockThreshold} ${detailProduct.unit}` },
                    { label: 'Sold Count', value: String(detailProduct.soldCount) },
                    { label: 'Rating', value: detailProduct.rating > 0 ? `${detailProduct.rating} / 5 (${detailProduct.reviewCount} reviews)` : 'No ratings' },
                    { label: 'Species Target', value: detailProduct.speciesTarget || 'All species' },
                    ...(( detailProduct as any).batchNumber ? [{ label: 'Batch No', value: (detailProduct as any).batchNumber }] : []),
                    ...(( detailProduct as any).expiryDate  ? [{ label: 'Expiry Date', value: (detailProduct as any).expiryDate }] : []),
                    ...(( detailProduct as any).maxDosePerAcre ? [{ label: 'Max Dose / Acre', value: (detailProduct as any).maxDosePerAcre }] : []),
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-xl bg-white/5 border border-white/5"><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">{label}</p><p className="font-bold text-sm">{value}</p></div>
                  ))}
                </div>
                {(detailProduct as any).certifications?.length > 0 && (
                  <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                    <p className="text-xs font-bold text-purple-400 mb-2">📋 Certifications</p>
                    <div className="flex flex-wrap gap-2">{((detailProduct as any).certifications as string[]).map(c => <span key={c} className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">{c}</span>)}</div>
                  </div>
                )}
                {detailProduct.usageInstructions && <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10"><p className="text-xs font-bold text-blue-400 mb-1 flex items-center gap-1"><BookOpen size={10} />Usage Instructions</p><p className="text-sm text-zinc-300">{detailProduct.usageInstructions}</p></div>}
                {detailProduct.dosageInfo && <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10"><p className="text-xs font-bold text-emerald-400 mb-1">Dosage</p><p className="text-sm text-zinc-300">{detailProduct.dosageInfo}</p></div>}
                {detailProduct.warnings && <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10"><p className="text-xs font-bold text-red-400 mb-1 flex items-center gap-1"><AlertTriangle size={10} />Warnings</p><p className="text-sm text-zinc-300">{detailProduct.warnings}</p></div>}
                <div className="flex flex-wrap gap-1">{detailProduct.tags.map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/5 text-zinc-400">{t}</span>)}</div>
                {/* Regulatory toggle inline */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <div><p className="text-xs font-bold text-amber-400">Regulatory Approval</p><p className="text-[10px] text-zinc-500">Toggle to {(detailProduct as any).isRegulatoryApproved ? 'revoke from' : 'approve for'} AquaShop</p></div>
                  <button onClick={() => { const updated = { ...detailProduct, isRegulatoryApproved: !(detailProduct as any).isRegulatoryApproved }; storageService.saveProduct(updated as any); setDetailProduct(updated as any); loadLocal(); }}
                    className={`relative w-12 h-6 rounded-full transition-all ${(detailProduct as any).isRegulatoryApproved ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${(detailProduct as any).isRegulatoryApproved ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
              <div className="p-5 border-t border-white/5">
                <button onClick={() => handleDeleteProduct(detailProduct.id)} className="w-full py-2 text-xs text-zinc-600 hover:text-red-400 transition-colors flex items-center justify-center gap-1.5"><Trash2 size={13} />Delete Product</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Add Product Modal ──────────────────────── */}
      <AnimatePresence>
        {isAddProductOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddProductOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-2xl glass-panel p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Package size={20} /></div><h2 className="text-2xl font-display font-bold">Add Product</h2></div>
                <button onClick={() => setIsAddProductOpen(false)} className="p-2 hover:bg-white/5 rounded-lg"><X size={22} /></button>
              </div>
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Product Name *</label><input type="text" placeholder="e.g. AquaGrow Pro Feed" value={newProduct.name || ''} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="input-field w-full" /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Category</label>
                    <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value as ProductCategory })} className="input-field w-full bg-zinc-900">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Unit</label><input type="text" placeholder="kg / litre / unit" value={newProduct.unit || ''} onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })} className="input-field w-full" /></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Species Target</label><input type="text" placeholder="e.g. L. Vannamei" value={newProduct.speciesTarget || ''} onChange={e => setNewProduct({ ...newProduct, speciesTarget: e.target.value })} className="input-field w-full" /></div>
                </div>
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Description</label><textarea rows={2} value={newProduct.description || ''} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="input-field w-full resize-none" /></div>
                {/* Pricing */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">MRP (₹)</label><input type="number" value={newProduct.mrp || 0} onChange={e => setNewProduct({ ...newProduct, mrp: +e.target.value })} className="input-field w-full" /></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Selling Price (₹)</label><input type="number" value={newProduct.sellingPrice || 0} onChange={e => setNewProduct({ ...newProduct, sellingPrice: +e.target.value })} className="input-field w-full" /></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Discount (%)</label><input type="number" value={newProduct.discount || 0} onChange={e => setNewProduct({ ...newProduct, discount: +e.target.value })} className="input-field w-full" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Initial Stock</label><input type="number" value={newProduct.stockQty || 0} onChange={e => setNewProduct({ ...newProduct, stockQty: +e.target.value })} className="input-field w-full" /></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Low Stock Alert At</label><input type="number" value={newProduct.lowStockThreshold || 20} onChange={e => setNewProduct({ ...newProduct, lowStockThreshold: +e.target.value })} className="input-field w-full" /></div>
                </div>
                {/* Usage Info */}
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Usage Instructions</label><textarea rows={2} value={newProduct.usageInstructions || ''} onChange={e => setNewProduct({ ...newProduct, usageInstructions: e.target.value })} className="input-field w-full resize-none" placeholder="How to use this product..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Dosage Info</label><input type="text" value={newProduct.dosageInfo || ''} onChange={e => setNewProduct({ ...newProduct, dosageInfo: e.target.value })} className="input-field w-full" placeholder="e.g. 2 kg/acre, 3x daily" /></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Max Dose / Acre ⚠️</label><input type="text" value={(newProduct as any).maxDosePerAcre || ''} onChange={e => setNewProduct({ ...newProduct, maxDosePerAcre: e.target.value } as any)} className="input-field w-full" placeholder="e.g. 5 kg/acre (overdose limit)" /></div>
                </div>
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Warnings</label><input type="text" value={newProduct.warnings || ''} onChange={e => setNewProduct({ ...newProduct, warnings: e.target.value })} className="input-field w-full" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tags (comma sep.)</label><input type="text" placeholder="Growth, Vannamei, Bio" onChange={e => setNewProduct({ ...newProduct, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} className="input-field w-full" /></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Supplier Name</label><input type="text" value={newProduct.supplierName || ''} onChange={e => setNewProduct({ ...newProduct, supplierName: e.target.value })} className="input-field w-full" placeholder="Link to supplier" /></div>
                </div>
                {/* Compliance & Traceability */}
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 space-y-3">
                  <p className="text-xs font-bold text-red-400 flex items-center gap-2"><FlaskConical size={12} />Compliance & Traceability (Medicine / Chemical)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Expiry Date</label><input type="date" value={(newProduct as any).expiryDate || ''} onChange={e => setNewProduct({ ...newProduct, expiryDate: e.target.value } as any)} className="input-field w-full" /></div>
                    <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Batch Number</label><input type="text" placeholder="e.g. BSI-MED-0326" value={(newProduct as any).batchNumber || ''} onChange={e => setNewProduct({ ...newProduct, batchNumber: e.target.value } as any)} className="input-field w-full" /></div>
                  </div>
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Certifications (comma sep.)</label><input type="text" placeholder="ISO, FSSAI, Drugs License, BIS" onChange={e => setNewProduct({ ...newProduct, certifications: e.target.value.split(',').map(c => c.trim()).filter(Boolean) } as any)} className="input-field w-full" /></div>
                </div>
                {/* Regulatory Approval Gate */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <div>
                    <p className="text-sm font-bold text-amber-400">Regulatory Approval Gate</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Product won't appear in AquaShop until approved by admin.</p>
                  </div>
                  <button onClick={() => setNewProduct({ ...newProduct, isRegulatoryApproved: !(newProduct as any).isRegulatoryApproved } as any)}
                    className={`relative w-12 h-6 rounded-full transition-all ${(newProduct as any).isRegulatoryApproved ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${(newProduct as any).isRegulatoryApproved ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  <button onClick={() => setIsAddProductOpen(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleAddProduct} disabled={!newProduct.name} className="btn-primary flex items-center gap-2 disabled:opacity-50"><Package size={16} />Add Product</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add Supplier Modal ─────────────────────── */}
      <AnimatePresence>
        {isAddSupplierOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddSupplierOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg glass-panel p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center"><Building2 size={20} /></div><h2 className="text-2xl font-display font-bold">Add Supplier</h2></div>
                <button onClick={() => setIsAddSupplierOpen(false)} className="p-2 hover:bg-white/5 rounded-lg"><X size={22} /></button>
              </div>
              <div className="space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar pr-1">
                {/* Basic Info */}
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Supplier Name *</label><input type="text" value={newSupplier.name || ''} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} className="input-field w-full" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Contact Person</label><input type="text" value={newSupplier.contact || ''} onChange={e => setNewSupplier({ ...newSupplier, contact: e.target.value })} className="input-field w-full" /></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Phone</label><input type="text" value={newSupplier.phone || ''} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} className="input-field w-full" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Email</label><input type="email" value={newSupplier.email || ''} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} className="input-field w-full" /></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Location</label><input type="text" value={newSupplier.location || ''} onChange={e => setNewSupplier({ ...newSupplier, location: e.target.value })} className="input-field w-full" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Payment Terms</label><input type="text" placeholder="Net 30" value={newSupplier.paymentTerms || ''} onChange={e => setNewSupplier({ ...newSupplier, paymentTerms: e.target.value })} className="input-field w-full" /></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">AquaGrow Margin %</label><input type="number" min={0} max={50} value={(newSupplier as any).marginPercent || 15} onChange={e => setNewSupplier({ ...newSupplier, marginPercent: +e.target.value } as any)} className="input-field w-full" /></div>
                </div>
                {/* KYC & Compliance */}
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-3">
                  <p className="text-xs font-bold text-blue-400 flex items-center gap-2">🔐 KYC & Compliance</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">GST Number</label><input type="text" placeholder="22AAAAA0000A1Z5" value={(newSupplier as any).gstNumber || ''} onChange={e => setNewSupplier({ ...newSupplier, gstNumber: e.target.value } as any)} className="input-field w-full font-mono" /></div>
                    <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">PAN Number</label><input type="text" placeholder="AAAAA0000A" value={(newSupplier as any).panNumber || ''} onChange={e => setNewSupplier({ ...newSupplier, panNumber: e.target.value } as any)} className="input-field w-full font-mono" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">License Type</label>
                      <select value={(newSupplier as any).licenseType || ''} onChange={e => setNewSupplier({ ...newSupplier, licenseType: e.target.value } as any)} className="input-field w-full bg-zinc-900">
                        <option value="">Select type</option>
                        <option>Drug License</option><option>FSSAI</option><option>Trade License</option><option>Import License</option>
                      </select>
                    </div>
                    <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">License Number</label><input type="text" value={(newSupplier as any).licenseNumber || ''} onChange={e => setNewSupplier({ ...newSupplier, licenseNumber: e.target.value } as any)} className="input-field w-full" /></div>
                  </div>
                </div>
                {/* Bank Details */}
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-3">
                  <p className="text-xs font-bold text-emerald-400 flex items-center gap-2">🏦 Bank Details (for payouts)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Account Number</label><input type="text" value={(newSupplier as any).bankAccount || ''} onChange={e => setNewSupplier({ ...newSupplier, bankAccount: e.target.value } as any)} className="input-field w-full font-mono" /></div>
                    <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">IFSC Code</label><input type="text" placeholder="SBIN0000001" value={(newSupplier as any).bankIfsc || ''} onChange={e => setNewSupplier({ ...newSupplier, bankIfsc: e.target.value } as any)} className="input-field w-full font-mono" /></div>
                  </div>
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Bank Name</label><input type="text" value={(newSupplier as any).bankName || ''} onChange={e => setNewSupplier({ ...newSupplier, bankName: e.target.value } as any)} className="input-field w-full" /></div>
                </div>
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Internal Notes</label><textarea rows={2} value={(newSupplier as any).notes || ''} onChange={e => setNewSupplier({ ...newSupplier, notes: e.target.value } as any)} className="input-field w-full resize-none" /></div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  <button onClick={() => setIsAddSupplierOpen(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleAddSupplier} disabled={!newSupplier.name} className="btn-primary flex items-center gap-2 disabled:opacity-50"><Building2 size={16} />Add Supplier</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductsManagement;
