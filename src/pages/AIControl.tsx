import React, { useState } from 'react';
import { 
  Cpu, 
  Brain, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Upload, 
  Eye, 
  Zap,
  BarChart3,
  Sparkles,
  Camera,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';

const AIControl = () => {
  const [isTraining, setIsTraining] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">AI System Control</h1>
          <p className="text-zinc-400">Monitor AI predictions, train models for disease detection, and analyze trends.</p>
        </div>
        <button 
          onClick={() => setIsTraining(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Brain size={20} />
          Train New Model
        </button>
      </div>

      {/* AI Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Prediction Accuracy</p>
            <h3 className="text-2xl font-display font-bold">94.2%</h3>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Daily AI Scans</p>
            <h3 className="text-2xl font-display font-bold">1,420</h3>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-radiant-sun/10 flex items-center justify-center text-radiant-sun">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Models Active</p>
            <h3 className="text-2xl font-display font-bold">8</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Disease Detection Training */}
        <div className="glass-panel p-8">
          <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
            <Camera size={20} className="text-emerald-400" />
            Disease Detection Training
          </h3>
          <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center hover:border-emerald-500/50 transition-all cursor-pointer group">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Upload size={32} className="text-zinc-500 group-hover:text-emerald-400" />
            </div>
            <p className="text-zinc-400 font-medium">Upload shrimp images to train AI</p>
            <p className="text-[10px] text-zinc-600 mt-2 uppercase tracking-widest">Supports JPG, PNG, MP4</p>
          </div>
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <BarChart3 size={18} className="text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold">White Spot Syndrome</p>
                  <p className="text-xs text-zinc-500">Model v2.4 • 98% Accuracy</p>
                </div>
              </div>
              <button className="text-xs text-emerald-400 hover:underline">Retrain</button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <BarChart3 size={18} className="text-radiant-sun" />
                </div>
                <div>
                  <p className="font-bold">Early Mortality Syndrome</p>
                  <p className="text-xs text-zinc-500">Model v1.8 • 85% Accuracy</p>
                </div>
              </div>
              <button className="text-xs text-emerald-400 hover:underline">Retrain</button>
            </div>
          </div>
        </div>

        {/* AI Prediction Trends */}
        <div className="glass-panel p-8">
          <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-400" />
            AI Prediction Trends
          </h3>
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertTriangle size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">High Risk Detected</span>
              </div>
              <p className="text-sm font-medium">AI predicts 75% chance of disease spread in Coastal Valley within 48 hours.</p>
              <button className="mt-4 w-full btn-primary py-2 text-xs">Broadcast Warning</button>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2">Growth Prediction</p>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">Central Plains Region</span>
                <span className="text-emerald-400 font-bold">+12% Yield</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="w-[85%] h-full bg-emerald-500 rounded-full"></div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2">Market Price Forecast</p>
              <div className="flex items-center justify-between">
                <span className="font-bold">Shrimp (L. Vannamei)</span>
                <span className="text-emerald-400 font-bold">₹485/kg</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2">AI expects 5% increase due to global supply shortage.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIControl;
