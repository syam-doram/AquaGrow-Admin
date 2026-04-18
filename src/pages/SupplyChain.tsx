import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Thermometer, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  MoreVertical, 
  Activity,
  Box,
  User,
  Phone,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { LogisticsEntry } from '../types';

const mockLogistics: LogisticsEntry[] = [
  { 
    id: 'LOG-001', 
    orderId: 'ORD-101', 
    truckId: 'AP-05-TX-1234', 
    driverName: 'Ramesh Kumar', 
    status: 'IN_TRANSIT', 
    currentLocation: 'Nellore Highway', 
    temperature: -18, 
    estimatedArrival: '2026-04-10 18:30' 
  },
  { 
    id: 'LOG-002', 
    orderId: 'ORD-102', 
    truckId: 'AP-05-TX-5678', 
    driverName: 'Suresh Singh', 
    status: 'PICKUP_SCHEDULED', 
    currentLocation: 'Coastal Valley Depot', 
    estimatedArrival: '2026-04-11 09:00' 
  },
  { 
    id: 'LOG-003', 
    orderId: 'ORD-098', 
    truckId: 'AP-05-TX-9012', 
    driverName: 'Anil Babu', 
    status: 'DELIVERED', 
    currentLocation: 'ABC SeaFoods Facility', 
    temperature: -20, 
    estimatedArrival: '2026-04-10 14:00' 
  },
];

const SupplyChain = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Supply Chain Management</h1>
          <p className="text-zinc-400">Monitor harvest logistics, truck assignments, and cold storage tracking.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center justify-center gap-2">
            <Navigation size={20} />
            Live Map View
          </button>
          <button className="btn-primary flex items-center justify-center gap-2">
            <Truck size={20} />
            Assign New Truck
          </button>
        </div>
      </div>

      {/* Logistics Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Truck size={24} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Active Trucks</p>
            <h3 className="text-2xl font-display font-bold">18</h3>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Box size={24} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">In Transit</p>
            <h3 className="text-2xl font-display font-bold">12</h3>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-radiant-sun/10 flex items-center justify-center text-radiant-sun">
            <Thermometer size={24} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Cold Storage</p>
            <h3 className="text-2xl font-display font-bold">85%</h3>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Delivered Today</p>
            <h3 className="text-2xl font-display font-bold">42</h3>
          </div>
        </div>
      </div>

      {/* Logistics Tracking Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-display font-bold flex items-center gap-2">
            <Activity size={20} className="text-emerald-400" />
            Live Logistics Tracking
          </h3>
          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search by truck or order..." 
              className="input-field w-full pl-9 py-2 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Logistics ID / Order</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Truck / Driver</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Current Location</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Temp / ETA</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockLogistics.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-mono text-sm text-zinc-400">{log.id}</p>
                    <p className="font-bold text-zinc-100">{log.orderId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-100">{log.driverName}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">{log.truckId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <MapPin size={14} className="text-emerald-400" />
                      {log.currentLocation}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs space-y-1">
                      {log.temperature !== undefined && (
                        <p className={`font-bold ${log.temperature > -15 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {log.temperature}°C
                        </p>
                      )}
                      <p className="text-zinc-500 flex items-center gap-1">
                        <Clock size={10} />
                        {log.estimatedArrival}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      log.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      log.status === 'IN_TRANSIT' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      log.status === 'PICKUP_SCHEDULED' ? 'bg-radiant-sun/10 text-radiant-sun border-radiant-sun/20' :
                      'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                    }`}>
                      {log.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-400">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supply Chain Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-8">
          <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-400" />
            Cold Storage Health
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center gap-3">
                <Thermometer size={20} className="text-emerald-400" />
                <div>
                  <p className="font-bold">Nellore Hub</p>
                  <p className="text-xs text-zinc-500">8 Units Active</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-emerald-400">-22°C</p>
                <p className="text-[10px] text-zinc-500">Optimal</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
              <div className="flex items-center gap-3">
                <Thermometer size={20} className="text-red-400" />
                <div>
                  <p className="font-bold">Coastal Depot</p>
                  <p className="text-xs text-zinc-500">Unit #4 Warning</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-red-400">-12°C</p>
                <p className="text-[10px] text-zinc-500">Check Required</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-8">
          <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
            <Activity size={20} className="text-emerald-400" />
            Logistics Efficiency
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">On-Time Delivery</span>
                <span className="text-emerald-400 font-bold">94%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="w-[94%] h-full bg-emerald-500 rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Fuel Efficiency Index</span>
                <span className="text-blue-400 font-bold">82%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="w-[82%] h-full bg-blue-500 rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Fleet Utilization</span>
                <span className="text-radiant-sun font-bold">75%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="w-[75%] h-full bg-radiant-sun rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplyChain;
