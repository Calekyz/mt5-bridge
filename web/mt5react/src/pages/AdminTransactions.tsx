// ═══════════════════════════════════════════════════════════════════
// Admin Transactions — approval queue for pending payments
// Reads /v1/payments/admin/all, approve/reject via /v1/payments/admin/verify
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import {
  RefreshCw, CheckCircle2, XCircle, Clock, Search,
  DollarSign, Smartphone, Wallet, AlertCircle, Loader2
} from 'lucide-react';
import { AdminApi } from '../api';
import type { PaymentRecordDTO } from '../payments/types';

type StatusFilter = 'ALL' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export default function AdminTransactions() {
  const [payments, setPayments] = useState<PaymentRecordDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('PENDING');
  const [search, setSearch] = useState('');
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await AdminApi.getAllPayments();
      setPayments(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleVerify = async (id: string, approve: boolean) => {
    const note = approve ? 'Approved by admin' : prompt('Reason for rejection?') || 'Rejected by admin';
    setActing(id);
    try {
      const r = await AdminApi.verifyPayment(id, approve, note);
      if (r.success) await load();
      else setError(r.message || 'Action failed');
    } catch (err: any) {
      setError(err?.message || 'Action failed');
    } finally {
      setActing(null);
    }
  };

  const filtered = payments.filter((p) => {
    if (filter !== 'ALL' && p.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.userEmail?.toLowerCase().includes(q) ||
        p.id?.toLowerCase().includes(q) ||
        p.mpesaReceiptNumber?.toLowerCase().includes(q) ||
        p.transactionHash?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    ALL: payments.length,
    PENDING: payments.filter((p) => p.status === 'PENDING').length,
    PROCESSING: payments.filter((p) => p.status === 'PROCESSING').length,
    COMPLETED: payments.filter((p) => p.status === 'COMPLETED').length,
    FAILED: payments.filter((p) => p.status === 'FAILED').length,
    CANCELLED: payments.filter((p) => p.status === 'CANCELLED').length,
  };

  const methodIcon = (m: string) => {
    if (m === 'mpesa_automated' || m === 'mpesa_manual') return <Smartphone size={14} />;
    if (m === 'binance_usdt') return <Wallet size={14} />;
    return <DollarSign size={14} />;
  };

  const statusColor = (s: string) => {
    if (s === 'COMPLETED') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (s === 'PENDING' || s === 'PROCESSING') return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    if (s === 'FAILED' || s === 'CANCELLED') return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Payment Approvals</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Approve pending payments to activate users
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-white border border-slate-700"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-3">
        {(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'ALL'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              filter === s
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email, ID, receipt, tx hash..."
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* List */}
      {loading && payments.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-slate-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          No payments match this filter.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white truncate">
                      {p.userEmail}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${statusColor(p.status)}`}>
                      {p.status}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      {methodIcon(p.paymentMethod)}
                      {p.paymentMethod}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span>ID: {p.id}</span>
                    <span>Product: {p.productName}</span>
                    <span>${p.usdPrice} ≈ KES {p.kesAmount}</span>
                    {p.mpesaReceiptNumber && <span>Receipt: {p.mpesaReceiptNumber}</span>}
                    {p.transactionHash && (
                      <span className="truncate max-w-[200px]">Tx: {p.transactionHash}</span>
                    )}
                    <span>{new Date(p.createdAt).toLocaleString()}</span>
                  </div>
                  {p.statusMessage && (
                    <div className="text-xs text-slate-400 mt-1 italic">{p.statusMessage}</div>
                  )}
                </div>

                {(p.status === 'PENDING' || p.status === 'PROCESSING') && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleVerify(p.id, true)}
                      disabled={acting === p.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold"
                    >
                      {acting === p.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleVerify(p.id, false)}
                      disabled={acting === p.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold"
                    >
                      <XCircle size={12} />
                      Reject
                    </button>
                  </div>
                )}

                {p.status === 'COMPLETED' && (
                  <div className="flex items-center gap-1 text-emerald-400 text-xs shrink-0">
                    <CheckCircle2 size={14} />
                    Activated
                  </div>
                )}

                {(p.status === 'PENDING' || p.status === 'PROCESSING') && !acting && (
                  <div className="flex items-center gap-1 text-amber-400 text-xs shrink-0">
                    <Clock size={12} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
