import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, XCircle, Shield, Search, AlertCircle, Star, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Certification } from '../types';
import { storageService } from '../services/storageService';

const StatusBadge = ({ status }: { status: Certification['status'] }) => {
  const s = { ELIGIBLE: 'bg-blue-500/10 text-blue-400 border-blue-500/20', PENDING_REVIEW: 'bg-radiant-sun/10 text-radiant-sun border-radiant-sun/20', APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20', REVOKED: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' };
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s[status]}`}>{status.replace(/_/g, ' ')}</span>;
};

const TypeIcon = ({ type }: { type: Certification['type'] }) => {
  if (type === 'TRUSTED_FARMER') return <Shield size={16} className="text-emerald-400" />;
  if (type === 'QUALITY_ASSURED') return <Star size={16} className="text-radiant-sun" />;
  return <Award size={16} className="text-blue-400" />;
};

const Certifications = () => {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);

  useEffect(() => { loadData(); }, []);
  const loadData = () => setCerts(storageService.getCertifications());

  const stats = {
    approved: certs.filter(c => c.status === 'APPROVED').length,
    pending: certs.filter(c => c.status === 'PENDING_REVIEW').length,
    eligible: certs.filter(c => c.status === 'ELIGIBLE').length,
    revoked: certs.filter(c => c.status === 'REVOKED').length,
  };

  const filtered = certs.filter(c => {
    const ms = c.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toLowerCase().includes(searchTerm.toLowerCase());
    const mf = filterStatus === 'all' || c.status === filterStatus;
    return ms && mf;
  });

  const handleApprove = (cert: Certification) => {
    storageService.approveCertification(cert.id);
    setSelectedCert(null);
    loadData();
  };

  const handleReject = (cert: Certification) => {
    storageService.rejectCertification(cert.id);
    setSelectedCert(null);
    loadData();
  };

  const handleRevoke = (cert: Certification) => {
    if (window.confirm(`Revoke ${cert.type} certification for ${cert.farmerName}?`)) {
      storageService.revokeCertification(cert.id);
      loadData();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Certification Management</h1>
          <p className="text-zinc-400">Define rules, approve certifications, and manage trust badges for farmers.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-5"><div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit"><Award size={18} /></div><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Approved</p><h3 className="text-3xl font-display font-bold text-emerald-400">{stats.approved}</h3></div>
        <div className="glass-panel p-5"><div className="mb-3 p-2.5 rounded-xl bg-radiant-sun/10 text-radiant-sun w-fit"><AlertCircle size={18} /></div><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Pending Review</p><h3 className="text-3xl font-display font-bold text-radiant-sun">{stats.pending}</h3></div>
        <div className="glass-panel p-5"><div className="mb-3 p-2.5 rounded-xl bg-blue-500/10 text-blue-400 w-fit"><CheckCircle2 size={18} /></div><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Eligible (Auto)</p><h3 className="text-3xl font-display font-bold text-blue-400">{stats.eligible}</h3></div>
        <div className="glass-panel p-5"><div className="mb-3 p-2.5 rounded-xl bg-zinc-500/10 text-zinc-400 w-fit"><RotateCcw size={18} /></div><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Revoked</p><h3 className="text-3xl font-display font-bold">{stats.revoked}</h3></div>
      </div>

      {/* Certification Rules */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2"><Shield size={18} className="text-emerald-400" />Automatic Eligibility Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { cert: 'TRUSTED_FARMER', rules: ['Minimum 10 completed orders', 'Rating ≥ 4.5', 'Zero fraud flags', 'Active for 6+ months'] },
            { cert: 'QUALITY_ASSURED', rules: ['Minimum 5 A/B grade harvests', 'Provider-verified', 'No complaints in 90 days', 'Daily logs submitted 90%+ days'] },
          ].map(({ cert, rules }) => (
            <div key={cert} className="p-4 rounded-xl bg-white/5 border border-white/5">
              <p className="font-bold text-sm mb-3 text-emerald-400">{cert.replace(/_/g, ' ')}</p>
              <div className="space-y-1.5">
                {rules.map(rule => (
                  <div key={rule} className="flex items-center gap-2 text-xs text-zinc-400"><CheckCircle2 size={12} className="text-emerald-400 shrink-0" />{rule}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" /><input type="text" placeholder="Search by farmer name..." className="input-field w-full pl-12" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field bg-zinc-900 w-full md:w-auto">
          <option value="all">All Status</option>
          <option value="ELIGIBLE">Eligible</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="REVOKED">Revoked</option>
        </select>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(cert => (
          <motion.div key={cert.id} whileHover={{ y: -3 }} className="glass-panel p-6 cursor-pointer group" onClick={() => setSelectedCert(cert)}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><TypeIcon type={cert.type} /></div>
                <div>
                  <p className="font-bold group-hover:text-emerald-400 transition-colors">{cert.farmerName}</p>
                  <p className="text-xs text-zinc-500">{cert.farmerId}</p>
                </div>
              </div>
              <StatusBadge status={cert.status} />
            </div>
            <p className="text-sm font-bold text-zinc-300 mb-3">{cert.type.replace(/_/g, ' ')}</p>
            {cert.criteria && (
              <div className="space-y-1">
                {cert.criteria.map(c => (
                  <div key={c.label} className="flex items-center gap-2 text-xs">
                    {c.met ? <CheckCircle2 size={11} className="text-emerald-400 shrink-0" /> : <XCircle size={11} className="text-red-400 shrink-0" />}
                    <span className={c.met ? 'text-zinc-300' : 'text-zinc-500'}>{c.label}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-[10px] text-zinc-500">
              <span>Applied: {cert.appliedAt}</span>
              {cert.validUntil && <span className="text-emerald-400">Valid: {cert.validUntil}</span>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail / Action Modal */}
      <AnimatePresence>
        {selectedCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCert(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md glass-panel p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div><h2 className="text-xl font-display font-bold">{selectedCert.type.replace(/_/g, ' ')}</h2><p className="text-sm text-zinc-400">{selectedCert.farmerName}</p></div>
                <div className="flex items-center gap-2"><StatusBadge status={selectedCert.status} /><button onClick={() => setSelectedCert(null)} className="p-2 hover:bg-white/5 rounded-lg"><X size={20} /></button></div>
              </div>
              {selectedCert.criteria && (
                <div className="space-y-2 mb-6">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Criteria Check</p>
                  {selectedCert.criteria.map(c => (
                    <div key={c.label} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <span className="text-sm text-zinc-300">{c.label}</span>
                      {c.met ? <CheckCircle2 size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-red-400" />}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                {selectedCert.status === 'APPROVED' && (
                  <button onClick={() => handleRevoke(selectedCert)} className="px-4 py-2 bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-all text-sm font-medium flex items-center gap-2"><RotateCcw size={14} />Revoke</button>
                )}
                {(selectedCert.status === 'PENDING_REVIEW' || selectedCert.status === 'ELIGIBLE') && (<>
                  <button onClick={() => handleReject(selectedCert)} className="px-4 py-2 bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-all text-sm font-medium flex items-center gap-2"><XCircle size={14} />Reject</button>
                  <button onClick={() => handleApprove(selectedCert)} className="btn-primary flex items-center gap-2 text-sm py-2"><CheckCircle2 size={14} />Approve</button>
                </>)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Certifications;
