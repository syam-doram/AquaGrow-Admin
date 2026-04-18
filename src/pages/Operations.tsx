import React, { useState } from 'react';
import { 
  Waves, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Thermometer, 
  Droplets, 
  Activity,
  ChevronRight,
  MoreVertical,
  Cpu,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import { Pond } from '../types';

const mockPonds: Pond[] = [
  { id: 'POND-001', farmerId: 'F-101', farmerName: 'John Doe', name: 'Pond Alpha', sizeInAcres: 2.5, species: 'L. Vannamei', stockingDensity: 80, stockingDate: '2026-02-15', expectedHarvestDate: '2026-05-15', feedUsage: 1200, mortalityRate: 2.5, survivalRate: 97.5, status: 'ACTIVE', lastAiAnalysis: { timestamp: '2026-04-10 10:00', result: 'Optimal Growth', confidence: 98 } },
  { id: 'POND-002', farmerId: 'F-102', farmerName: 'Jane Smith', name: 'Smith Pond 1', sizeInAcres: 1.5, species: 'L. Vannamei', stockingDensity: 70, stockingDate: '2026-01-10', expectedHarvestDate: '2026-04-20', feedUsage: 2500, mortalityRate: 8.2, survivalRate: 91.8, status: 'ALERT', lastAiAnalysis: { timestamp: '2026-04-10 09:30', result: 'Low Oxygen Risk', confidence: 85 } },
  { id: 'POND-003', farmerId: 'F-101', farmerName: 'John Doe', name: 'Pond Beta', sizeInAcres: 3.0, species: 'Tiger Shrimp', stockingDensity: 60, stockingDate: '2026-03-01', expectedHarvestDate: '2026-06-01', feedUsage: 450, mortalityRate: 15.0, survivalRate: 85.0, status: 'DISEASE_DETECTED', lastAiAnalysis: { timestamp: '2026-04-10 11:00', result: 'White Spot Syndrome', confidence: 92 } },
];

const StatusBadge = ({ status }: { status: Pond['status'] }) => {
  const styles: Record<Pond['status'], string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    ALERT: "bg-radiant-sun/10 text-radiant-sun border-radiant-sun/20",
    DISEASE_DETECTED: "bg-red-500/10 text-red-400 border-red-500/20",
    HARVESTED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    EMPTY: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

const Operations = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Operations Management</h1>
          <p className="text-zinc-400">Pond stocking, harvest planning, and real-time health monitoring.</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Waves size={24} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Active Ponds</p>
            <h3 className="text-2xl font-display font-bold">128</h3>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-radiant-sun/10 flex items-center justify-center text-radiant-sun">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Harvests This Month</p>
            <h3 className="text-2xl font-display font-bold">14</h3>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Disease Alerts</p>
            <h3 className="text-2xl font-display font-bold">3</h3>
          </div>
        </div>
      </div>

      {/* Pond List */}
      <div className="glass-panel overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-display font-bold">Active Ponds & Health</h3>
          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search ponds or farmers..." 
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
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Pond ID / Farmer</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Stocking / Harvest</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Feed / Mortality</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">AI Analysis</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockPonds.map((pond) => (
                <tr key={pond.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-mono text-sm text-zinc-400">{pond.id}</p>
                    <p className="font-bold text-zinc-100">{pond.farmerName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs space-y-1">
                      <p className="text-zinc-500">Stock: {pond.stockingDate}</p>
                      <p className="text-emerald-400">Harvest: {pond.expectedHarvestDate}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs space-y-1">
                      <p className="text-zinc-100">{pond.feedUsage} kg Feed</p>
                      <p className={pond.mortalityRate > 10 ? 'text-red-400' : 'text-zinc-500'}>
                        {pond.mortalityRate}% Mortality
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {pond.lastAiAnalysis && (
                      <div className="flex items-center gap-2">
                        <Cpu size={14} className="text-emerald-400" />
                        <div>
                          <p className="text-xs font-medium text-zinc-100">{pond.lastAiAnalysis.result}</p>
                          <p className="text-[10px] text-zinc-500">{pond.lastAiAnalysis.confidence}% confidence</p>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={pond.status} />
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
    </div>
  );
};

export default Operations;
