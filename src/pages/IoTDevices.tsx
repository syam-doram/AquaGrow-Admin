import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cpu, Wifi, WifiOff, AlertTriangle, Zap, Droplets, Wind, Activity,
  Search, Package, Warehouse, BarChart2, ShoppingCart, Truck, MapPin,
  CheckCircle, Wrench, Radio, Monitor, LifeBuoy, RefreshCcw, Shield,
  History, Bell, Plus, X, ChevronRight, Calendar, User, Hash,
  DollarSign, Tag, Building2, FileText, Camera, Star, ArrowRight,
  AlertCircle, Clock, CheckCircle2, XCircle, Battery, TrendingUp
} from 'lucide-react';
import { fetchIoTLogs, LiveAeratorLog } from '../services/aquagrowApi';

// ─── Types ────────────────────────────────────────────────────────────────────

type DeviceStatus = 'IN_STOCK' | 'RESERVED' | 'DISPATCHED' | 'DELIVERED' | 'INSTALLED' | 'ACTIVE' | 'FAULTY' | 'RETURNED' | 'REPLACED';
type DeviceType = 'AERATOR_CONTROLLER' | 'OXYGEN_SENSOR' | 'WATER_SENSOR' | 'POWER_METER' | 'MULTI_PARAM' | 'GATEWAY';
type LiveStatus = 'ONLINE' | 'OFFLINE' | 'FAULT' | 'MAINTENANCE';

interface IoTDevice {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  imei: string;
  type: DeviceType;
  supplierId: string;
  supplierName: string;
  costPrice: number;
  sellingPrice: number;
  warehouseId: string;
  status: DeviceStatus;
  liveStatus?: LiveStatus;
  farmerId?: string;
  farmerName?: string;
  pondId?: string;
  pondName?: string;
  installedBy?: string;
  installedDate?: string;
  activatedDate?: string;
  warrantyStart?: string;
  warrantyEnd?: string;
  lastSeen?: string;
  batteryLevel?: number;
  orderId?: string;
  trackingId?: string;
  notes?: string;
}

interface Procurement {
  id: string;
  date: string;
  supplierName: string;
  deviceModel: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  warehouseId: string;
  invoiceNo: string;
  status: 'PENDING' | 'RECEIVED' | 'PARTIAL';
}

interface Warehouse {
  id: string;
  name: string;
  location: string;
  manager: string;
  totalCapacity: number;
  inStock: number;
  reserved: number;
  damaged: number;
}

interface DeviceOrder {
  id: string;
  farmerId: string;
  farmerName: string;
  deviceId: string;
  deviceName: string;
  serialNumber: string;
  orderDate: string;
  amount: number;
  paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL';
  deliveryStatus: 'PROCESSING' | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  trackingId: string;
  technician?: string;
  installDate?: string;
  installStatus?: 'SCHEDULED' | 'COMPLETED' | 'PENDING';
}

interface SupportTicket {
  id: string;
  deviceId: string;
  serialNumber: string;
  farmerName: string;
  issue: string;
  createdDate: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  assignedTo?: string;
  resolution?: string;
}

interface DeviceHistory {
  deviceId: string;
  event: string;
  date: string;
  by: string;
  notes?: string;
  icon: 'procure' | 'warehouse' | 'order' | 'dispatch' | 'deliver' | 'install' | 'activate' | 'support' | 'return';
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_WAREHOUSES: Warehouse[] = [
  { id: 'WH001', name: 'Nellore Central Store', location: 'Nellore, AP', manager: 'Ravi Kumar', totalCapacity: 500, inStock: 142, reserved: 28, damaged: 5 },
  { id: 'WH002', name: 'Bhimavaram Hub', location: 'West Godavari, AP', manager: 'Priya Sharma', totalCapacity: 300, inStock: 88, reserved: 12, damaged: 2 },
];

const SEED_DEVICES: IoTDevice[] = [
  { id: 'D001', name: 'AquaSense Pro X1', model: 'ASX-1000', serialNumber: 'SN-AQ-001', imei: '352999001234567', type: 'MULTI_PARAM', supplierId: 'SUP001', supplierName: 'TechAqua Systems', costPrice: 8500, sellingPrice: 12000, warehouseId: 'WH001', status: 'ACTIVE', liveStatus: 'ONLINE', farmerId: 'F001', farmerName: 'Govind Rao', pondId: 'P001', pondName: 'Pond A1', installedBy: 'Suresh Babu', installedDate: '2026-03-10', activatedDate: '2026-03-11', warrantyStart: '2026-03-11', warrantyEnd: '2027-03-11', lastSeen: '2026-04-18 11:25', batteryLevel: 87, orderId: 'ORD001' },
  { id: 'D002', name: 'AeroControl V3', model: 'AC-300', serialNumber: 'SN-AC-002', imei: '352999002345678', type: 'AERATOR_CONTROLLER', supplierId: 'SUP001', supplierName: 'TechAqua Systems', costPrice: 6200, sellingPrice: 9500, warehouseId: 'WH001', status: 'ACTIVE', liveStatus: 'ONLINE', farmerId: 'F002', farmerName: 'Krishnamurthy', pondId: 'P002', pondName: 'Pond B3', installedBy: 'Priya Sharma', installedDate: '2026-03-15', activatedDate: '2026-03-16', warrantyStart: '2026-03-16', warrantyEnd: '2027-03-16', lastSeen: '2026-04-18 11:28', batteryLevel: 94, orderId: 'ORD002' },
  { id: 'D003', name: 'OxyTrack Lite', model: 'OT-200', serialNumber: 'SN-OT-003', imei: '352999003456789', type: 'OXYGEN_SENSOR', supplierId: 'SUP002', supplierName: 'SmartFarm Electronics', costPrice: 3200, sellingPrice: 5000, warehouseId: 'WH001', status: 'ACTIVE', liveStatus: 'FAULT', farmerId: 'F001', farmerName: 'Govind Rao', pondId: 'P003', pondName: 'Pond A2', installedBy: 'Suresh Babu', installedDate: '2026-02-20', activatedDate: '2026-02-21', warrantyStart: '2026-02-21', warrantyEnd: '2027-02-21', lastSeen: '2026-04-17 08:12', batteryLevel: 12, orderId: 'ORD003' },
  { id: 'D004', name: 'AquaSense Pro X1', model: 'ASX-1000', serialNumber: 'SN-AQ-004', imei: '352999004567890', type: 'MULTI_PARAM', supplierId: 'SUP001', supplierName: 'TechAqua Systems', costPrice: 8500, sellingPrice: 12000, warehouseId: 'WH001', status: 'INSTALLED', installedBy: 'Priya Sharma', installedDate: '2026-04-17', farmerId: 'F003', farmerName: 'Venkatesh Naidu', pondId: 'P004', pondName: 'Main Pond', warrantyStart: '2026-04-17', warrantyEnd: '2027-04-17', orderId: 'ORD004' },
  { id: 'D005', name: 'Gateway Hub 4G', model: 'GH-4G', serialNumber: 'SN-GH-005', imei: '352999005678901', type: 'GATEWAY', supplierId: 'SUP002', supplierName: 'SmartFarm Electronics', costPrice: 4800, sellingPrice: 7500, warehouseId: 'WH001', status: 'DISPATCHED', liveStatus: undefined, farmerId: 'F004', farmerName: 'Raju Babu', trackingId: 'DTDC-789012', orderId: 'ORD005' },
  { id: 'D006', name: 'WaterGuard Plus', model: 'WG-500', serialNumber: 'SN-WG-006', imei: '352999006789012', type: 'WATER_SENSOR', supplierId: 'SUP001', supplierName: 'TechAqua Systems', costPrice: 2800, sellingPrice: 4500, warehouseId: 'WH002', status: 'IN_STOCK' },
  { id: 'D007', name: 'WaterGuard Plus', model: 'WG-500', serialNumber: 'SN-WG-007', imei: '352999007890123', type: 'WATER_SENSOR', supplierId: 'SUP001', supplierName: 'TechAqua Systems', costPrice: 2800, sellingPrice: 4500, warehouseId: 'WH002', status: 'IN_STOCK' },
  { id: 'D008', name: 'PowerMon C2', model: 'PM-200', serialNumber: 'SN-PM-008', imei: '352999008901234', type: 'POWER_METER', supplierId: 'SUP003', supplierName: 'AquaElec Corp', costPrice: 3500, sellingPrice: 5800, warehouseId: 'WH001', status: 'FAULTY', liveStatus: 'FAULT', farmerId: 'F005', farmerName: 'Suryanarayana', pondId: 'P005', pondName: 'East Pond', installedDate: '2026-01-15', warrantyEnd: '2027-01-15', lastSeen: '2026-04-10 14:00' },
  { id: 'D009', name: 'OxyTrack Lite', model: 'OT-200', serialNumber: 'SN-OT-009', imei: '352999009012345', type: 'OXYGEN_SENSOR', supplierId: 'SUP002', supplierName: 'SmartFarm Electronics', costPrice: 3200, sellingPrice: 5000, warehouseId: 'WH001', status: 'RESERVED', orderId: 'ORD006' },
  { id: 'D010', name: 'AeroControl V3', model: 'AC-300', serialNumber: 'SN-AC-010', imei: '352999010123456', type: 'AERATOR_CONTROLLER', supplierId: 'SUP001', supplierName: 'TechAqua Systems', costPrice: 6200, sellingPrice: 9500, warehouseId: 'WH002', status: 'ACTIVE', liveStatus: 'OFFLINE', farmerId: 'F006', farmerName: 'Lakshmi Devi', pondId: 'P006', pondName: 'West Pond', installedDate: '2026-02-10', activatedDate: '2026-02-11', warrantyEnd: '2027-02-11', lastSeen: '2026-04-16 18:00', batteryLevel: 65, orderId: 'ORD007' },
];

const SEED_PROCUREMENTS: Procurement[] = [
  { id: 'PR001', date: '2026-04-10', supplierName: 'TechAqua Systems', deviceModel: 'ASX-1000', quantity: 30, unitCost: 8500, totalCost: 255000, warehouseId: 'WH001', invoiceNo: 'INV-TA-4421', status: 'RECEIVED' },
  { id: 'PR002', date: '2026-04-05', supplierName: 'SmartFarm Electronics', deviceModel: 'OT-200', quantity: 20, unitCost: 3200, totalCost: 64000, warehouseId: 'WH001', invoiceNo: 'INV-SF-8812', status: 'RECEIVED' },
  { id: 'PR003', date: '2026-04-15', supplierName: 'TechAqua Systems', deviceModel: 'WG-500', quantity: 50, unitCost: 2800, totalCost: 140000, warehouseId: 'WH002', invoiceNo: 'INV-TA-4898', status: 'PARTIAL' },
  { id: 'PR004', date: '2026-04-18', supplierName: 'AquaElec Corp', deviceModel: 'GH-4G', quantity: 15, unitCost: 4800, totalCost: 72000, warehouseId: 'WH001', invoiceNo: 'INV-AE-1123', status: 'PENDING' },
];

const SEED_ORDERS: DeviceOrder[] = [
  { id: 'ORD001', farmerId: 'F001', farmerName: 'Govind Rao', deviceId: 'D001', deviceName: 'AquaSense Pro X1', serialNumber: 'SN-AQ-001', orderDate: '2026-03-08', amount: 12000, paymentStatus: 'PAID', deliveryStatus: 'DELIVERED', trackingId: 'DTDC-112233', technician: 'Suresh Babu', installDate: '2026-03-10', installStatus: 'COMPLETED' },
  { id: 'ORD002', farmerId: 'F002', farmerName: 'Krishnamurthy', deviceId: 'D002', deviceName: 'AeroControl V3', serialNumber: 'SN-AC-002', orderDate: '2026-03-12', amount: 9500, paymentStatus: 'PAID', deliveryStatus: 'DELIVERED', trackingId: 'DTDC-224455', technician: 'Priya Sharma', installDate: '2026-03-15', installStatus: 'COMPLETED' },
  { id: 'ORD003', farmerId: 'F001', farmerName: 'Govind Rao', deviceId: 'D003', deviceName: 'OxyTrack Lite', serialNumber: 'SN-OT-003', orderDate: '2026-02-18', amount: 5000, paymentStatus: 'PAID', deliveryStatus: 'DELIVERED', trackingId: 'DTDC-336677', technician: 'Suresh Babu', installDate: '2026-02-20', installStatus: 'COMPLETED' },
  { id: 'ORD004', farmerId: 'F003', farmerName: 'Venkatesh Naidu', deviceId: 'D004', deviceName: 'AquaSense Pro X1', serialNumber: 'SN-AQ-004', orderDate: '2026-04-14', amount: 12000, paymentStatus: 'PAID', deliveryStatus: 'DELIVERED', trackingId: 'DTDC-448899', technician: 'Priya Sharma', installDate: '2026-04-17', installStatus: 'COMPLETED' },
  { id: 'ORD005', farmerId: 'F004', farmerName: 'Raju Babu', deviceId: 'D005', deviceName: 'Gateway Hub 4G', serialNumber: 'SN-GH-005', orderDate: '2026-04-16', amount: 7500, paymentStatus: 'PAID', deliveryStatus: 'SHIPPED', trackingId: 'DTDC-789012', installStatus: 'PENDING' },
  { id: 'ORD006', farmerId: 'F007', farmerName: 'Ramaiah', deviceId: 'D009', deviceName: 'OxyTrack Lite', serialNumber: 'SN-OT-009', orderDate: '2026-04-17', amount: 5000, paymentStatus: 'PENDING', deliveryStatus: 'PROCESSING', trackingId: '', installStatus: 'PENDING' },
];

const SEED_SUPPORT: SupportTicket[] = [
  { id: 'ST001', deviceId: 'D003', serialNumber: 'SN-OT-003', farmerName: 'Govind Rao', issue: 'Very low oxygen readings – sensor may be miscalibrated', createdDate: '2026-04-16', status: 'IN_PROGRESS', assignedTo: 'Suresh Babu', resolution: '' },
  { id: 'ST002', deviceId: 'D008', serialNumber: 'SN-PM-008', farmerName: 'Suryanarayana', issue: 'Device shows OFFLINE – not responding for 8 days', createdDate: '2026-04-11', status: 'OPEN', assignedTo: 'Priya Sharma' },
  { id: 'ST003', deviceId: 'D010', serialNumber: 'SN-AC-010', farmerName: 'Lakshmi Devi', issue: 'Aerator not triggering on schedule', createdDate: '2026-04-15', status: 'IN_PROGRESS', assignedTo: 'Suresh Babu' },
  { id: 'ST004', deviceId: 'D001', serialNumber: 'SN-AQ-001', farmerName: 'Govind Rao', issue: 'Connectivity drop every night', createdDate: '2026-04-12', status: 'RESOLVED', assignedTo: 'Suresh Babu', resolution: 'Updated firmware + repositioned antenna' },
];

const SEED_HISTORY: DeviceHistory[] = [
  { deviceId: 'D001', event: 'Procured from TechAqua Systems', date: '2026-03-01', by: 'Admin', icon: 'procure' },
  { deviceId: 'D001', event: 'Stored in Nellore Central Store', date: '2026-03-02', by: 'Admin', icon: 'warehouse' },
  { deviceId: 'D001', event: 'Order placed by Govind Rao', date: '2026-03-08', by: 'Govind Rao', icon: 'order' },
  { deviceId: 'D001', event: 'Dispatched via DTDC – Tracking: DTDC-112233', date: '2026-03-09', by: 'Admin', icon: 'dispatch' },
  { deviceId: 'D001', event: 'Delivered and confirmed by OTP', date: '2026-03-09', by: 'Govind Rao', icon: 'deliver' },
  { deviceId: 'D001', event: 'Installed at Pond A1 by Suresh Babu', date: '2026-03-10', by: 'Suresh Babu', icon: 'install' },
  { deviceId: 'D001', event: 'Device Activated & Linked to Farmer Account', date: '2026-03-11', by: 'System', icon: 'activate' },
  { deviceId: 'D001', event: 'Support ticket ST004: Connectivity drop', date: '2026-04-12', by: 'Govind Rao', icon: 'support', notes: 'Firmware updated' },
];

const ALERTS_DATA = [
  { id: 'A1', type: 'LOW_STOCK', message: 'WaterGuard Plus (WG-500) stock below 10 units', severity: 'MEDIUM', timestamp: '2026-04-18T09:00:00' },
  { id: 'A2', type: 'DEVICE_OFFLINE', message: 'SN-AC-010 (Lakshmi Devi) offline since April 16', severity: 'HIGH', timestamp: '2026-04-18T07:00:00' },
  { id: 'A3', type: 'DEVICE_FAULT', message: 'SN-OT-003 (Govind Rao – Pond A2) reporting fault', severity: 'HIGH', timestamp: '2026-04-17T08:12:00' },
  { id: 'A4', type: 'INSTALL_PENDING', message: 'ORD005: Gateway Hub 4G delivered – installation unscheduled', severity: 'MEDIUM', timestamp: '2026-04-18T10:00:00' },
  { id: 'A5', type: 'WARRANTY_EXPIRY', message: 'SN-OT-003 warranty expires in 30 days', severity: 'LOW', timestamp: '2026-04-18T06:00:00' },
  { id: 'A6', type: 'LOW_BATTERY', message: 'SN-OT-003 battery at 12% – needs replacement', severity: 'HIGH', timestamp: '2026-04-18T11:00:00' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<DeviceStatus, { label: string; color: string }> = {
  IN_STOCK:   { label: 'In Stock',   color: 'bg-emerald-500/10 text-emerald-400' },
  RESERVED:   { label: 'Reserved',   color: 'bg-blue-500/10 text-blue-400' },
  DISPATCHED: { label: 'Dispatched', color: 'bg-purple-500/10 text-purple-400' },
  DELIVERED:  { label: 'Delivered',  color: 'bg-teal-500/10 text-teal-400' },
  INSTALLED:  { label: 'Installed',  color: 'bg-cyan-500/10 text-cyan-400' },
  ACTIVE:     { label: 'Active',     color: 'bg-emerald-500/10 text-emerald-400' },
  FAULTY:     { label: 'Faulty',     color: 'bg-red-500/10 text-red-400' },
  RETURNED:   { label: 'Returned',   color: 'bg-zinc-500/10 text-zinc-400' },
  REPLACED:   { label: 'Replaced',   color: 'bg-amber-500/10 text-amber-400' },
};

const LIVE_META: Record<LiveStatus, { color: string; dot: string }> = {
  ONLINE:      { color: 'text-emerald-400', dot: 'bg-emerald-400' },
  OFFLINE:     { color: 'text-zinc-400',    dot: 'bg-zinc-500' },
  FAULT:       { color: 'text-red-400',     dot: 'bg-red-400' },
  MAINTENANCE: { color: 'text-blue-400',    dot: 'bg-blue-400' },
};

const TYPE_META: Record<DeviceType, { label: string; icon: (size: number) => React.ReactElement; color: string }> = {
  AERATOR_CONTROLLER: { label: 'Aerator Controller', icon: (s) => <Wind size={s} />, color: 'text-blue-400 bg-blue-500/10' },
  OXYGEN_SENSOR:      { label: 'Oxygen Sensor',       icon: (s) => <Droplets size={s} />, color: 'text-cyan-400 bg-cyan-500/10' },
  WATER_SENSOR:       { label: 'Water Sensor',         icon: (s) => <Droplets size={s} />, color: 'text-teal-400 bg-teal-500/10' },
  POWER_METER:        { label: 'Power Meter',          icon: (s) => <Zap size={s} />, color: 'text-amber-400 bg-amber-500/10' },
  MULTI_PARAM:        { label: 'Multi-Param Sensor',   icon: (s) => <Monitor size={s} />, color: 'text-purple-400 bg-purple-500/10' },
  GATEWAY:            { label: 'Gateway Hub',           icon: (s) => <Radio size={s} />, color: 'text-emerald-400 bg-emerald-500/10' },
};

const LIFECYCLE_STEPS = [
  'Procurement', 'Warehouse', 'Inventory', 'Orders',
  'Dispatch', 'Delivery', 'Installation', 'Activation',
  'Monitoring', 'Support', 'Returns', 'Warranty', 'History', 'Alerts'
];

const MiniBar = ({ value, color = 'bg-emerald-500' }: { value: number; color?: string }) => (
  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
    <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
  </div>
);

const StatCard = ({ label, value, icon, color = 'text-emerald-400', sub }: { label: string; value: string | number; icon: React.ReactNode; color?: string; sub?: string }) => (
  <div className="glass-panel p-5">
    <div className="flex items-center justify-between mb-3">
      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{label}</p>
      <div className={`${color} opacity-60`}>{icon}</div>
    </div>
    <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
    {sub && <p className="text-[10px] text-zinc-500 mt-1">{sub}</p>}
  </div>
);

const SectionTitle = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="mb-5">
    <h3 className="text-base font-display font-bold text-zinc-100">{title}</h3>
    {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
  </div>
);

// ─── Device Detail Panel ──────────────────────────────────────────────────────

const DevicePanel = ({ device, history, onClose }: {
  device: IoTDevice;
  history: DeviceHistory[];
  onClose: () => void;
}) => {
  const dh = history.filter(h => h.deviceId === device.id);
  const histIcons: Record<DeviceHistory['icon'], React.ReactNode> = {
    procure: <Package size={12} />, warehouse: <Warehouse size={12} />, order: <ShoppingCart size={12} />,
    dispatch: <Truck size={12} />, deliver: <MapPin size={12} />, install: <Wrench size={12} />,
    activate: <Zap size={12} />, support: <LifeBuoy size={12} />, return: <RefreshCcw size={12} />,
  };
  const warrantyDaysLeft = device.warrantyEnd
    ? Math.max(0, Math.round((new Date(device.warrantyEnd).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}>
        <motion.div initial={{ x: 440, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 440, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-[480px] bg-zinc-950 border-l border-white/10 overflow-y-auto"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="p-6 border-b border-white/5 bg-zinc-900">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl ${TYPE_META[device.type].color}`}>
                {TYPE_META[device.type].icon(22)}
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 transition-colors"><X size={18} /></button>
            </div>
            <h3 className="text-lg font-display font-bold text-zinc-100">{device.name}</h3>
            <p className="text-xs text-zinc-500">Model: {device.model} · SN: {device.serialNumber}</p>
            <p className="text-[10px] font-mono text-zinc-600 mt-0.5">IMEI: {device.imei}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${STATUS_META[device.status].color}`}>{STATUS_META[device.status].label}</span>
              {device.liveStatus && (
                <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${LIVE_META[device.liveStatus].color} bg-white/5`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${LIVE_META[device.liveStatus].dot} ${device.liveStatus === 'ONLINE' ? 'animate-pulse' : ''}`} />
                  {device.liveStatus}
                </span>
              )}
              <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${TYPE_META[device.type].color}`}>{TYPE_META[device.type].label}</span>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Farmer & Pond */}
            {device.farmerName && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Farmer</p>
                  <p className="text-xs font-bold text-zinc-200">{device.farmerName}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Pond</p>
                  <p className="text-xs font-bold text-zinc-200">{device.pondName || '—'}</p>
                </div>
              </div>
            )}

            {/* Battery */}
            {device.batteryLevel !== undefined && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">Battery</p>
                  <p className={`text-[10px] font-bold ${device.batteryLevel < 20 ? 'text-red-400' : device.batteryLevel < 50 ? 'text-amber-400' : 'text-emerald-400'}`}>{device.batteryLevel}%</p>
                </div>
                <MiniBar value={device.batteryLevel} color={device.batteryLevel < 20 ? 'bg-red-500' : device.batteryLevel < 50 ? 'bg-amber-500' : 'bg-emerald-500'} />
              </div>
            )}

            {/* Installation & Pricing */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Installed By', value: device.installedBy || '—' },
                { label: 'Install Date', value: device.installedDate || '—' },
                { label: 'Cost Price', value: device.costPrice ? `₹${device.costPrice.toLocaleString()}` : '—' },
                { label: 'Sell Price', value: device.sellingPrice ? `₹${device.sellingPrice.toLocaleString()}` : '—' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl bg-white/5">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold mb-0.5">{item.label}</p>
                  <p className="text-xs font-bold text-zinc-200">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Warranty */}
            {device.warrantyEnd && (
              <div className={`p-4 rounded-xl border ${warrantyDaysLeft! <= 30 ? 'border-amber-500/20 bg-amber-500/5' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Warranty Status</p>
                    <p className={`text-sm font-bold ${warrantyDaysLeft! <= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {warrantyDaysLeft! > 0 ? `${warrantyDaysLeft} days remaining` : 'EXPIRED'}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{device.warrantyStart} → {device.warrantyEnd}</p>
                  </div>
                  <Shield size={24} className={warrantyDaysLeft! <= 30 ? 'text-amber-400' : 'text-emerald-400'} />
                </div>
              </div>
            )}

            {/* Supplier */}
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Supplier</p>
              <p className="text-xs font-bold text-zinc-200">{device.supplierName}</p>
            </div>

            {/* History Timeline */}
            {dh.length > 0 && (
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-3">Device History</p>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-white/5" />
                  <div className="space-y-3">
                    {dh.map((h, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="relative z-10 w-8 h-8 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0">
                          {histIcons[h.icon]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-zinc-200">{h.event}</p>
                          <p className="text-[9px] text-zinc-500">{h.date} · by {h.by}</p>
                          {h.notes && <p className="text-[9px] text-zinc-600 italic">{h.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const MAIN_TABS = [
  { id: 'overview',      label: 'Overview',      icon: <Monitor size={13} /> },
  { id: 'procurement',   label: 'Procurement',   icon: <Package size={13} /> },
  { id: 'warehouse',     label: 'Warehouse',     icon: <Warehouse size={13} /> },
  { id: 'inventory',     label: 'Inventory',     icon: <BarChart2 size={13} /> },
  { id: 'orders',        label: 'Orders',        icon: <ShoppingCart size={13} /> },
  { id: 'dispatch',      label: 'Dispatch',      icon: <Truck size={13} /> },
  { id: 'installation',  label: 'Installation',  icon: <Wrench size={13} /> },
  { id: 'activation',    label: 'Activation',    icon: <Zap size={13} /> },
  { id: 'monitoring',    label: 'Live Monitor',  icon: <Radio size={13} /> },
  { id: 'support',       label: 'Support',       icon: <LifeBuoy size={13} /> },
  { id: 'warranty',      label: 'Warranty',      icon: <Shield size={13} /> },
  { id: 'history',       label: 'History',       icon: <History size={13} /> },
  { id: 'alerts',        label: 'Alerts',        icon: <Bell size={13} /> },
];

const IoTDevices: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [devices] = useState<IoTDevice[]>(SEED_DEVICES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'ALL'>('ALL');
  const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);
  const [aeratorLogs, setAeratorLogs] = useState<LiveAeratorLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    fetchIoTLogs().then(setAeratorLogs).catch(console.error).finally(() => setLogsLoading(false));
  }, []);

  const filteredDevices = useMemo(() => devices.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = d.name.toLowerCase().includes(q) || d.serialNumber.toLowerCase().includes(q) || d.imei.includes(q) || (d.farmerName ?? '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchSearch && matchStatus;
  }), [devices, search, statusFilter]);

  const stats = useMemo(() => ({
    total: devices.length,
    active: devices.filter(d => d.status === 'ACTIVE').length,
    online: devices.filter(d => d.liveStatus === 'ONLINE').length,
    offline: devices.filter(d => d.liveStatus === 'OFFLINE').length,
    fault: devices.filter(d => d.liveStatus === 'FAULT' || d.status === 'FAULTY').length,
    inStock: devices.filter(d => d.status === 'IN_STOCK').length,
    dispatched: devices.filter(d => d.status === 'DISPATCHED').length,
    installed: devices.filter(d => d.status === 'INSTALLED').length,
    openAlerts: ALERTS_DATA.filter(a => a.severity === 'HIGH').length,
    revenue: SEED_ORDERS.reduce((s, o) => s + (o.paymentStatus === 'PAID' ? o.amount : 0), 0),
  }), [devices]);

  // ─── Overview ─────────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Devices" value={stats.total} icon={<Cpu size={18} />} color="text-emerald-400" sub="In system" />
        <StatCard label="Active & Online" value={stats.online} icon={<Wifi size={18} />} color="text-emerald-400" sub={`${stats.fault} faults`} />
        <StatCard label="In Stock" value={stats.inStock} icon={<Package size={18} />} color="text-blue-400" sub="Ready to dispatch" />
        <StatCard label="Revenue (MTD)" value={`₹${(stats.revenue / 1000).toFixed(1)}K`} icon={<DollarSign size={18} />} color="text-amber-400" />
      </div>

      {/* Lifecycle Flow */}
      <div className="glass-panel p-6">
        <SectionTitle title="Device Lifecycle Pipeline" sub="Current device count at each stage" />
        <div className="flex flex-wrap gap-2 items-center">
          {[
            { label: 'In Stock', count: stats.inStock, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
            { label: 'Reserved', count: devices.filter(d => d.status === 'RESERVED').length, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
            { label: 'Dispatched', count: stats.dispatched, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
            { label: 'Delivered', count: devices.filter(d => d.status === 'DELIVERED').length, color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
            { label: 'Installed', count: stats.installed, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
            { label: 'Active', count: stats.active, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
            { label: 'Faulty', count: stats.fault, color: 'bg-red-500/10 text-red-400 border-red-500/20' },
          ].map((stage, i) => (
            <React.Fragment key={stage.label}>
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold ${stage.color}`}>
                <span className="text-lg font-display font-bold">{stage.count}</span>
                <span>{stage.label}</span>
              </div>
              {i < 6 && <ArrowRight size={14} className="text-zinc-700 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Recent Devices */}
      <div className="glass-panel overflow-hidden">
        <div className="p-5 border-b border-white/5 flex flex-wrap gap-3 items-center justify-between">
          <h4 className="font-display font-bold">All Devices</h4>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
              <Search size={12} className="text-zinc-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Serial / IMEI / Farmer…"
                className="bg-transparent text-xs text-zinc-100 outline-none w-40 placeholder:text-zinc-600" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none">
              <option value="ALL" className="bg-zinc-900">All Status</option>
              {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k} className="bg-zinc-900">{v.label}</option>)}
            </select>
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {filteredDevices.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              className="p-5 flex flex-wrap items-center gap-4 hover:bg-white/3 transition-all cursor-pointer group"
              onClick={() => setSelectedDevice(d)}>
              <div className={`p-2.5 rounded-xl shrink-0 ${TYPE_META[d.type].color}`}>
                {TYPE_META[d.type].icon(14)}
              </div>
              <div className="flex-1 min-w-[160px]">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold text-zinc-100">{d.name}</p>
                  <span className="font-mono text-[9px] text-zinc-600">{d.serialNumber}</span>
                </div>
                <p className="text-[10px] text-zinc-500">{TYPE_META[d.type].label} · {d.supplierName}</p>
              </div>
              <div className="hidden md:block text-center min-w-[100px]">
                <p className="text-[9px] text-zinc-500 uppercase font-bold mb-0.5">Farmer</p>
                <p className="text-xs font-bold text-zinc-300">{d.farmerName || '—'}</p>
              </div>
              <div className="flex items-center gap-3">
                {d.liveStatus && (
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${LIVE_META[d.liveStatus].color} bg-white/5`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${LIVE_META[d.liveStatus].dot} ${d.liveStatus === 'ONLINE' ? 'animate-pulse' : ''}`} />
                    {d.liveStatus}
                  </span>
                )}
                <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${STATUS_META[d.status].color}`}>{STATUS_META[d.status].label}</span>
                {d.batteryLevel !== undefined && (
                  <span className={`text-[9px] font-mono font-bold flex items-center gap-1 ${d.batteryLevel < 20 ? 'text-red-400' : 'text-zinc-400'}`}>
                    <Battery size={10} /> {d.batteryLevel}%
                  </span>
                )}
              </div>
              <ChevronRight size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Procurement ──────────────────────────────────────────────────────────

  const renderProcurement = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total Procured" value={SEED_PROCUREMENTS.reduce((s, p) => s + p.quantity, 0)} icon={<Package size={18} />} color="text-emerald-400" />
        <StatCard label="Total Investment" value={`₹${(SEED_PROCUREMENTS.reduce((s, p) => s + p.totalCost, 0) / 1000).toFixed(0)}K`} icon={<DollarSign size={18} />} color="text-amber-400" />
        <StatCard label="Pending Shipments" value={SEED_PROCUREMENTS.filter(p => p.status === 'PENDING').length} icon={<Truck size={18} />} color="text-red-400" />
      </div>
      <div className="glass-panel overflow-hidden">
        <div className="p-5 border-b border-white/5 bg-white/3 flex items-center justify-between">
          <h4 className="font-display font-bold">Procurement Records</h4>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors">
            <Plus size={12} /> New Order
          </button>
        </div>
        <div className="divide-y divide-white/5">
          {SEED_PROCUREMENTS.map((p, i) => (
            <div key={p.id} className="p-5 flex flex-wrap items-center gap-4 hover:bg-white/3 transition-all">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0"><Package size={15} /></div>
              <div className="flex-1 min-w-[160px]">
                <p className="text-sm font-bold text-zinc-100">{p.deviceModel} × {p.quantity}</p>
                <p className="text-[10px] text-zinc-500">{p.supplierName} · Invoice: {p.invoiceNo}</p>
              </div>
              <div className="hidden md:grid grid-cols-3 gap-6 text-center">
                <div><p className="text-[9px] text-zinc-500 uppercase font-bold">Date</p><p className="text-xs font-mono text-zinc-300">{p.date}</p></div>
                <div><p className="text-[9px] text-zinc-500 uppercase font-bold">Unit Cost</p><p className="text-xs font-mono text-zinc-300">₹{p.unitCost.toLocaleString()}</p></div>
                <div><p className="text-[9px] text-zinc-500 uppercase font-bold">Total</p><p className="text-xs font-mono font-bold text-emerald-400">₹{p.totalCost.toLocaleString()}</p></div>
              </div>
              <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full shrink-0 ${p.status === 'RECEIVED' ? 'bg-emerald-500/10 text-emerald-400' : p.status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Warehouse ────────────────────────────────────────────────────────────

  const renderWarehouse = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {SEED_WAREHOUSES.map(wh => {
          const utilPct = Math.round((wh.inStock + wh.reserved + wh.damaged) / wh.totalCapacity * 100);
          return (
            <div key={wh.id} className="glass-panel p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400"><Warehouse size={16} /></div>
                    <h4 className="font-display font-bold text-zinc-100">{wh.name}</h4>
                  </div>
                  <p className="text-[10px] text-zinc-500">{wh.location} · Manager: {wh.manager}</p>
                </div>
                <span className="text-lg font-display font-bold text-blue-400">{utilPct}%</span>
              </div>
              <div className="mb-4">
                <div className="flex justify-between mb-1.5"><p className="text-[10px] text-zinc-500 uppercase font-bold">Capacity Utilization</p><p className="text-[10px] text-zinc-400">{wh.inStock + wh.reserved + wh.damaged} / {wh.totalCapacity}</p></div>
                <MiniBar value={utilPct} color={utilPct > 80 ? 'bg-red-500' : utilPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                  <p className="text-2xl font-display font-bold text-emerald-400">{wh.inStock}</p>
                  <p className="text-[9px] text-zinc-500 uppercase font-bold mt-0.5">In Stock</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center">
                  <p className="text-2xl font-display font-bold text-blue-400">{wh.reserved}</p>
                  <p className="text-[9px] text-zinc-500 uppercase font-bold mt-0.5">Reserved</p>
                </div>
                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-center">
                  <p className="text-2xl font-display font-bold text-red-400">{wh.damaged}</p>
                  <p className="text-[9px] text-zinc-500 uppercase font-bold mt-0.5">Damaged</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Stock by Type */}
      <div className="glass-panel p-6">
        <SectionTitle title="Stock by Device Type" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(TYPE_META).map(([type, meta]) => {
            const count = devices.filter(d => d.type === type && d.status === 'IN_STOCK').length;
            return (
              <div key={type} className="p-4 rounded-xl bg-white/5 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${meta.color}`}>{meta.icon(14)}</div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">{meta.label}</p>
                  <p className={`text-xl font-display font-bold ${meta.color.split(' ')[0]}`}>{count}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ─── Inventory ────────────────────────────────────────────────────────────

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(STATUS_META).map(([k, v]) => {
          const count = devices.filter(d => d.status === k).length;
          return count > 0 ? (
            <div key={k} className="glass-panel p-4 text-center">
              <p className={`text-2xl font-display font-bold ${v.color.split(' ')[1]}`}>{count}</p>
              <p className="text-[9px] text-zinc-500 uppercase font-bold mt-1">{v.label}</p>
            </div>
          ) : null;
        })}
      </div>
      <div className="glass-panel overflow-hidden">
        <div className="p-5 border-b border-white/5 bg-white/3">
          <h4 className="font-display font-bold">Device Inventory — Serial Number Tracking</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr className="border-b border-white/5 bg-white/3">
              {['Serial No', 'IMEI', 'Model', 'Type', 'Warehouse', 'Status', 'Farmer', 'Warranty'].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {devices.map(d => (
                <tr key={d.id} className="hover:bg-white/3 transition-colors cursor-pointer" onClick={() => setSelectedDevice(d)}>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-200 whitespace-nowrap">{d.serialNumber}</td>
                  <td className="px-4 py-3 font-mono text-[10px] text-zinc-500">{d.imei}</td>
                  <td className="px-4 py-3 text-xs font-bold text-zinc-200">{d.model}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${TYPE_META[d.type].color}`}>{TYPE_META[d.type].label}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{SEED_WAREHOUSES.find(w => w.id === d.warehouseId)?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_META[d.status].color}`}>{STATUS_META[d.status].label}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{d.farmerName || '—'}</td>
                  <td className="px-4 py-3 text-[10px] text-zinc-500">{d.warrantyEnd || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ─── Orders ───────────────────────────────────────────────────────────────

  const renderOrders = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={SEED_ORDERS.length} icon={<ShoppingCart size={18} />} color="text-blue-400" />
        <StatCard label="Revenue Collected" value={`₹${(stats.revenue / 1000).toFixed(1)}K`} icon={<DollarSign size={18} />} color="text-emerald-400" />
        <StatCard label="Pending Payment" value={SEED_ORDERS.filter(o => o.paymentStatus === 'PENDING').length} icon={<Clock size={18} />} color="text-amber-400" />
        <StatCard label="In Transit" value={SEED_ORDERS.filter(o => o.deliveryStatus === 'SHIPPED' || o.deliveryStatus === 'OUT_FOR_DELIVERY').length} icon={<Truck size={18} />} color="text-purple-400" />
      </div>
      <div className="glass-panel overflow-hidden">
        <div className="p-5 border-b border-white/5 bg-white/3"><h4 className="font-display font-bold">Device Orders</h4></div>
        <div className="divide-y divide-white/5">
          {SEED_ORDERS.map((o, i) => (
            <motion.div key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
              className="p-5 flex flex-wrap items-center gap-4 hover:bg-white/3 transition-all">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0"><ShoppingCart size={14} /></div>
              <div className="flex-1 min-w-[160px]">
                <p className="text-sm font-bold text-zinc-100">{o.deviceName}</p>
                <p className="text-[10px] text-zinc-500">{o.farmerName} · SN: {o.serialNumber} · {o.orderDate}</p>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-right">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold">Amount</p>
                  <p className="text-sm font-bold text-emerald-400">₹{o.amount.toLocaleString()}</p>
                </div>
                <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${o.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{o.paymentStatus}</span>
                <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${o.deliveryStatus === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400' : o.deliveryStatus === 'SHIPPED' ? 'bg-purple-500/10 text-purple-400' : 'bg-zinc-500/10 text-zinc-400'}`}>{o.deliveryStatus.replace('_', ' ')}</span>
                {o.installStatus && <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${o.installStatus === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>Install: {o.installStatus}</span>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Dispatch ─────────────────────────────────────────────────────────────

  const renderDispatch = () => {
    const dispatching = SEED_ORDERS.filter(o => ['PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.deliveryStatus));
    const steps = ['PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    return (
      <div className="space-y-6">
        <div className="glass-panel overflow-hidden">
          <div className="p-5 border-b border-white/5 bg-white/3"><h4 className="font-display font-bold">Active Shipments</h4></div>
          <div className="divide-y divide-white/5">
            {dispatching.map((o, i) => {
              const stepIdx = steps.indexOf(o.deliveryStatus);
              return (
                <motion.div key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                  className="p-6 hover:bg-white/3 transition-all">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-sm font-bold text-zinc-100">{o.deviceName}</p>
                      <p className="text-[10px] text-zinc-500">{o.farmerName} · Order: {o.id}</p>
                      {o.trackingId && <p className="text-[10px] font-mono text-blue-400 mt-0.5">Tracking: {o.trackingId}</p>}
                    </div>
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${o.deliveryStatus === 'OUT_FOR_DELIVERY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'}`}>
                      {o.deliveryStatus.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-0">
                    {steps.map((step, si) => (
                      <React.Fragment key={step}>
                        <div className={`flex flex-col items-center`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border-2 ${si <= stepIdx ? 'border-emerald-500 bg-emerald-500 text-zinc-900' : 'border-zinc-700 bg-transparent text-zinc-700'}`}>
                            {si <= stepIdx ? '✓' : si + 1}
                          </div>
                          <p className={`text-[8px] mt-1 font-bold ${si <= stepIdx ? 'text-emerald-400' : 'text-zinc-700'} whitespace-nowrap`}>{step.replace('_', ' ')}</p>
                        </div>
                        {si < steps.length - 1 && (
                          <div className={`flex-1 h-0.5 mt-[-10px] ${si < stepIdx ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </motion.div>
              );
            })}
            {dispatching.length === 0 && (
              <div className="py-12 text-center text-zinc-500 text-sm">No active shipments right now</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── Installation ─────────────────────────────────────────────────────────

  const renderInstallation = () => {
    const pending = SEED_ORDERS.filter(o => o.installStatus === 'PENDING' && o.deliveryStatus === 'DELIVERED');
    const completed = SEED_ORDERS.filter(o => o.installStatus === 'COMPLETED');
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Pending Install" value={pending.length} icon={<Clock size={18} />} color="text-amber-400" sub="Awaiting technician" />
          <StatCard label="Completed" value={completed.length} icon={<CheckCircle size={18} />} color="text-emerald-400" />
          <StatCard label="Technicians Active" value={2} icon={<User size={18} />} color="text-blue-400" />
        </div>

        {pending.length > 0 && (
          <div className="glass-panel p-5 border border-amber-500/10 bg-amber-500/3">
            <div className="flex items-center gap-2 mb-4"><AlertCircle size={14} className="text-amber-400" /><h4 className="font-bold text-amber-300 text-sm">Pending Installation</h4></div>
            <div className="space-y-3">
              {pending.map(o => (
                <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="text-sm font-bold text-zinc-100">{o.deviceName}</p>
                    <p className="text-[10px] text-zinc-500">{o.farmerName} · SN: {o.serialNumber}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <select className="bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-300 outline-none">
                      <option className="bg-zinc-900">Assign Technician</option>
                      <option className="bg-zinc-900">Suresh Babu</option>
                      <option className="bg-zinc-900">Priya Sharma</option>
                    </select>
                    <button className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors">Schedule Visit</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass-panel overflow-hidden">
          <div className="p-5 border-b border-white/5 bg-white/3"><h4 className="font-display font-bold">Completed Installations</h4></div>
          <div className="divide-y divide-white/5">
            {completed.map((o, i) => (
              <div key={o.id} className="p-5 flex flex-wrap items-center gap-4 hover:bg-white/3 transition-all">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0"><CheckCircle size={14} /></div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-100">{o.deviceName} → {o.farmerName}</p>
                  <p className="text-[10px] text-zinc-500">Installed by {o.technician} on {o.installDate} · SN: {o.serialNumber}</p>
                </div>
                <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400">COMPLETED</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── Activation ───────────────────────────────────────────────────────────

  const renderActivation = () => {
    const readyToActivate = devices.filter(d => d.status === 'INSTALLED');
    const activated = devices.filter(d => d.status === 'ACTIVE');
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Ready to Activate" value={readyToActivate.length} icon={<Zap size={18} />} color="text-amber-400" sub="Installed but not active" />
          <StatCard label="Active Devices" value={activated.length} icon={<CheckCircle size={18} />} color="text-emerald-400" />
          <StatCard label="Online Now" value={stats.online} icon={<Wifi size={18} />} color="text-blue-400" />
        </div>
        {readyToActivate.length > 0 && (
          <div className="glass-panel p-5 border border-amber-500/10">
            <div className="flex items-center gap-2 mb-4"><Zap size={14} className="text-amber-400" /><h4 className="font-bold text-amber-300 text-sm">Awaiting Activation</h4></div>
            <div className="space-y-3">
              {readyToActivate.map(d => (
                <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="text-sm font-bold text-zinc-100">{d.name} — {d.farmerName}</p>
                    <p className="text-[10px] text-zinc-500">SN: {d.serialNumber} · Pond: {d.pondName} · Installed: {d.installedDate}</p>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-900 text-xs font-bold transition-all flex items-center gap-2">
                    <Zap size={12} /> Activate Device
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="glass-panel overflow-hidden">
          <div className="p-5 border-b border-white/5 bg-white/3"><h4 className="font-display font-bold">Active Devices — Linked to Farmer & Pond</h4></div>
          <div className="divide-y divide-white/5">
            {activated.map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="p-5 flex flex-wrap items-center gap-4 hover:bg-white/3 transition-all">
                <div className={`p-2.5 rounded-xl ${TYPE_META[d.type].color} shrink-0`}>{TYPE_META[d.type].icon(14)}</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-100">{d.name}</p>
                  <p className="text-[10px] text-zinc-500">Farmer: {d.farmerName} · Pond: {d.pondName} · Activated: {d.activatedDate}</p>
                </div>
                <div className="flex items-center gap-2">
                  {d.liveStatus && (
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 bg-white/5 ${LIVE_META[d.liveStatus].color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${LIVE_META[d.liveStatus].dot} ${d.liveStatus === 'ONLINE' ? 'animate-pulse' : ''}`} />
                      {d.liveStatus}
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-600">Last: {d.lastSeen}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── Live Monitoring ──────────────────────────────────────────────────────

  const renderMonitoring = () => {
    const activeDevices = devices.filter(d => d.status === 'ACTIVE');
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Online" value={stats.online} icon={<Wifi size={18} />} color="text-emerald-400" />
          <StatCard label="Offline" value={stats.offline} icon={<WifiOff size={18} />} color="text-zinc-400" />
          <StatCard label="Fault" value={stats.fault} icon={<AlertTriangle size={18} />} color="text-red-400" />
          <StatCard label="Low Battery" value={devices.filter(d => (d.batteryLevel ?? 100) < 20).length} icon={<Battery size={18} />} color="text-amber-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {activeDevices.map(d => (
            <motion.div key={d.id} whileHover={{ y: -2 }} className="glass-panel p-5 cursor-pointer" onClick={() => setSelectedDevice(d)}>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${TYPE_META[d.type].color}`}>{TYPE_META[d.type].icon(14)}</div>
                {d.liveStatus && (
                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 bg-white/5 ${LIVE_META[d.liveStatus].color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${LIVE_META[d.liveStatus].dot} ${d.liveStatus === 'ONLINE' ? 'animate-pulse' : ''}`} />
                    {d.liveStatus}
                  </span>
                )}
              </div>
              <p className="font-bold text-sm text-zinc-100 mb-0.5">{d.name}</p>
              <p className="text-[10px] text-zinc-500 mb-3">{d.farmerName} · {d.pondName}</p>
              <p className="font-mono text-[9px] text-zinc-600 mb-4">SN: {d.serialNumber}</p>
              {d.batteryLevel !== undefined && (
                <div className="mb-2">
                  <div className="flex justify-between mb-1">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Battery</p>
                    <p className={`text-[9px] font-bold ${d.batteryLevel < 20 ? 'text-red-400' : 'text-zinc-400'}`}>{d.batteryLevel}%</p>
                  </div>
                  <MiniBar value={d.batteryLevel} color={d.batteryLevel < 20 ? 'bg-red-500' : d.batteryLevel < 50 ? 'bg-amber-500' : 'bg-emerald-500'} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="p-2 rounded-xl bg-white/5 text-center">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold">Activated</p>
                  <p className="text-[10px] text-zinc-300">{d.activatedDate}</p>
                </div>
                <div className="p-2 rounded-xl bg-white/5 text-center">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold">Last Seen</p>
                  <p className="text-[10px] text-zinc-300">{d.lastSeen?.split(' ')[1]}</p>
                </div>
              </div>
              {d.liveStatus === 'FAULT' && (
                <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle size={12} className="text-red-400 shrink-0" />
                  <p className="text-[10px] text-red-400 font-bold">Device reporting fault — check required</p>
                </div>
              )}
              {d.liveStatus === 'OFFLINE' && (
                <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-zinc-500/10 border border-zinc-500/20">
                  <WifiOff size={12} className="text-zinc-400 shrink-0" />
                  <p className="text-[10px] text-zinc-400 font-bold">Last seen: {d.lastSeen}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Live aerator logs from MongoDB */}
        <div className="glass-panel overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h4 className="font-display font-bold flex items-center gap-2">
              Aerator Logs — Live from App
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">LIVE</span>
            </h4>
            <span className="text-xs text-zinc-500">{logsLoading ? 'Loading…' : `${aeratorLogs.length} records`}</span>
          </div>
          <div className="overflow-x-auto">
            {logsLoading ? (
              <div className="p-8 text-center text-zinc-500">Loading aerator logs…</div>
            ) : aeratorLogs.length === 0 ? (
              <div className="p-8 text-center text-zinc-600">No aerator logs found in database.</div>
            ) : (
              <table className="w-full text-left">
                <thead><tr className="border-b border-white/5 bg-white/5">
                  {['Farmer','Phone','Pond','Status','Run Hours','Power (kW)','Date'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {aeratorLogs.map(log => (
                    <tr key={log._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4 font-bold text-sm">{log.farmer?.name ?? '—'}</td>
                      <td className="px-5 py-4 text-xs text-zinc-500">{log.farmer?.phoneNumber ?? '—'}</td>
                      <td className="px-5 py-4 text-xs text-zinc-400">{log.pond?.name ?? log.pondId?.slice(-6) ?? '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${log.status === 'on' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700/10 text-zinc-500'}`}>
                          {log.status ?? '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-sm text-blue-400">{log.runHours ?? '—'}</td>
                      <td className="px-5 py-4 font-mono text-sm text-amber-400">{log.powerKw ?? '—'}</td>
                      <td className="px-5 py-4 text-xs text-zinc-500">{log.createdAt ? new Date(log.createdAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── Support ─────────────────────────────────────────────────────────────

  const renderSupport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Open Tickets" value={SEED_SUPPORT.filter(t => t.status === 'OPEN').length} icon={<AlertCircle size={18} />} color="text-red-400" />
        <StatCard label="In Progress" value={SEED_SUPPORT.filter(t => t.status === 'IN_PROGRESS').length} icon={<Activity size={18} />} color="text-amber-400" />
        <StatCard label="Resolved" value={SEED_SUPPORT.filter(t => t.status === 'RESOLVED').length} icon={<CheckCircle size={18} />} color="text-emerald-400" />
      </div>
      <div className="glass-panel overflow-hidden">
        <div className="p-5 border-b border-white/5 bg-white/3 flex items-center justify-between">
          <h4 className="font-display font-bold">Support Tickets</h4>
          <button className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors flex items-center gap-2">
            <Plus size={12} /> New Ticket
          </button>
        </div>
        <div className="divide-y divide-white/5">
          {SEED_SUPPORT.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
              className="p-5 hover:bg-white/3 transition-all">
              <div className="flex flex-wrap items-start gap-4">
                <div className={`p-2.5 rounded-xl shrink-0 ${t.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400' : t.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                  <LifeBuoy size={14} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-zinc-100">{t.issue}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${t.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400' : t.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>{t.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">{t.farmerName} · SN: {t.serialNumber} · {t.createdDate}</p>
                  {t.assignedTo && <p className="text-[10px] text-blue-400 mt-0.5">Assigned: {t.assignedTo}</p>}
                  {t.resolution && <p className="text-[10px] text-emerald-400 mt-1 italic">✓ {t.resolution}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Warranty ─────────────────────────────────────────────────────────────

  const renderWarranty = () => {
    const warrantyDevices = devices.filter(d => d.warrantyEnd).map(d => {
      const daysLeft = Math.max(0, Math.round((new Date(d.warrantyEnd!).getTime() - Date.now()) / 86400000));
      return { ...d, daysLeft };
    }).sort((a, b) => a.daysLeft - b.daysLeft);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Under Warranty" value={warrantyDevices.filter(d => d.daysLeft > 0).length} icon={<Shield size={18} />} color="text-emerald-400" />
          <StatCard label="Expiring in 30d" value={warrantyDevices.filter(d => d.daysLeft <= 30 && d.daysLeft > 0).length} icon={<AlertCircle size={18} />} color="text-amber-400" />
          <StatCard label="Expired" value={warrantyDevices.filter(d => d.daysLeft === 0).length} icon={<XCircle size={18} />} color="text-red-400" />
        </div>
        <div className="glass-panel overflow-hidden">
          <div className="p-5 border-b border-white/5 bg-white/3"><h4 className="font-display font-bold">Warranty Tracker</h4></div>
          <div className="divide-y divide-white/5">
            {warrantyDevices.map((d, i) => (
              <div key={d.id} className="p-5 flex flex-wrap items-center gap-4 hover:bg-white/3 transition-all">
                <div className={`p-2.5 rounded-xl shrink-0 ${d.daysLeft === 0 ? 'bg-red-500/10 text-red-400' : d.daysLeft <= 30 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  <Shield size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-100">{d.name}</p>
                  <p className="text-[10px] text-zinc-500">{d.farmerName ?? '—'} · SN: {d.serialNumber}</p>
                  <p className="text-[10px] text-zinc-600">{d.warrantyStart} → {d.warrantyEnd}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-display font-bold ${d.daysLeft === 0 ? 'text-red-400' : d.daysLeft <= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {d.daysLeft === 0 ? 'EXPIRED' : `${d.daysLeft}d`}
                  </p>
                  <p className="text-[9px] text-zinc-600">remaining</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── History ──────────────────────────────────────────────────────────────

  const renderHistory = () => {
    const histIcons: Record<DeviceHistory['icon'], { node: React.ReactNode; color: string }> = {
      procure:   { node: <Package size={12} />,     color: 'bg-blue-500/10 text-blue-400' },
      warehouse: { node: <Warehouse size={12} />,   color: 'bg-zinc-500/10 text-zinc-400' },
      order:     { node: <ShoppingCart size={12} />, color: 'bg-purple-500/10 text-purple-400' },
      dispatch:  { node: <Truck size={12} />,       color: 'bg-amber-500/10 text-amber-400' },
      deliver:   { node: <MapPin size={12} />,      color: 'bg-teal-500/10 text-teal-400' },
      install:   { node: <Wrench size={12} />,      color: 'bg-orange-500/10 text-orange-400' },
      activate:  { node: <Zap size={12} />,         color: 'bg-emerald-500/10 text-emerald-400' },
      support:   { node: <LifeBuoy size={12} />,    color: 'bg-red-500/10 text-red-400' },
      return:    { node: <RefreshCcw size={12} />,  color: 'bg-zinc-500/10 text-zinc-400' },
    };
    return (
      <div className="space-y-6">
        <div className="glass-panel p-5 border border-blue-500/10 bg-blue-500/3">
          <p className="text-xs text-zinc-400"><span className="text-blue-400 font-bold">Full Traceability</span> — Every device has a complete lifecycle audit trail from procurement to current state.</p>
        </div>
        <div className="glass-panel overflow-hidden">
          <div className="p-5 border-b border-white/5 bg-white/3">
            <h4 className="font-display font-bold">Device: SN-AQ-001 — AquaSense Pro X1 (Govind Rao)</h4>
          </div>
          <div className="p-6">
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-white/5" />
              <div className="space-y-4">
                {SEED_HISTORY.map((h, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-4">
                    <div className={`relative z-10 w-10 h-10 rounded-xl ${histIcons[h.icon].color} flex items-center justify-center shrink-0`}>
                      {histIcons[h.icon].node}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-bold text-zinc-100">{h.event}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Calendar size={9} /> {h.date}</span>
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1"><User size={9} /> {h.by}</span>
                      </div>
                      {h.notes && <p className="text-[10px] text-zinc-600 italic mt-0.5">{h.notes}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Alerts ───────────────────────────────────────────────────────────────

  const renderAlertsList = () => {
    const alertTypeIcon: Record<string, React.ReactNode> = {
      LOW_STOCK:       <Package size={14} />,
      DEVICE_OFFLINE:  <WifiOff size={14} />,
      DEVICE_FAULT:    <AlertTriangle size={14} />,
      INSTALL_PENDING: <Wrench size={14} />,
      WARRANTY_EXPIRY: <Shield size={14} />,
      LOW_BATTERY:     <Battery size={14} />,
    };
    const alertBg: Record<string, string> = {
      HIGH: 'border-red-500/20 bg-red-500/5 text-red-400',
      MEDIUM: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
      LOW: 'border-zinc-500/20 bg-zinc-500/5 text-zinc-400',
    };
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Critical Alerts" value={ALERTS_DATA.filter(a => a.severity === 'HIGH').length} icon={<AlertTriangle size={18} />} color="text-red-400" />
          <StatCard label="Medium Priority" value={ALERTS_DATA.filter(a => a.severity === 'MEDIUM').length} icon={<AlertCircle size={18} />} color="text-amber-400" />
          <StatCard label="Info" value={ALERTS_DATA.filter(a => a.severity === 'LOW').length} icon={<Bell size={18} />} color="text-zinc-400" />
        </div>
        <div className="space-y-3">
          {ALERTS_DATA.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className={`flex flex-wrap items-start gap-4 p-5 rounded-2xl border ${alertBg[a.severity]}`}>
              <div className="shrink-0 mt-0.5">{alertTypeIcon[a.type]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="text-sm font-bold">{a.message}</p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${a.severity === 'HIGH' ? 'bg-red-500/20 text-red-300' : a.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-500/20 text-zinc-400'}`}>{a.severity}</span>
                </div>
                <p className="text-[10px] text-zinc-500 flex items-center gap-1"><Clock size={9} /> {new Date(a.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
              </div>
              <button className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-all shrink-0">Resolve</button>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-zinc-100">IoT Device Lifecycle</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Warehouse → Farmer → Active Device — Full traceability by Serial No & IMEI</p>
        </div>
        <div className="flex items-center gap-3">
          {stats.openAlerts > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
              <AlertTriangle size={14} /> {stats.openAlerts} critical alerts
            </div>
          )}
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-900 text-sm font-bold transition-all">
            <Plus size={16} /> Add Device
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {MAIN_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === t.id
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300'
            }`}>
            {t.icon} {t.label}
            {t.id === 'alerts' && ALERTS_DATA.filter(a => a.severity === 'HIGH').length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                {ALERTS_DATA.filter(a => a.severity === 'HIGH').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
          {activeTab === 'overview'     && renderOverview()}
          {activeTab === 'procurement'  && renderProcurement()}
          {activeTab === 'warehouse'    && renderWarehouse()}
          {activeTab === 'inventory'    && renderInventory()}
          {activeTab === 'orders'       && renderOrders()}
          {activeTab === 'dispatch'     && renderDispatch()}
          {activeTab === 'installation' && renderInstallation()}
          {activeTab === 'activation'   && renderActivation()}
          {activeTab === 'monitoring'   && renderMonitoring()}
          {activeTab === 'support'      && renderSupport()}
          {activeTab === 'warranty'     && renderWarranty()}
          {activeTab === 'history'      && renderHistory()}
          {activeTab === 'alerts'       && renderAlertsList()}
        </motion.div>
      </AnimatePresence>

      {/* Device Detail Panel */}
      {selectedDevice && (
        <DevicePanel
          device={selectedDevice}
          history={SEED_HISTORY}
          onClose={() => setSelectedDevice(null)}
        />
      )}
    </div>
  );
};

export default IoTDevices;
