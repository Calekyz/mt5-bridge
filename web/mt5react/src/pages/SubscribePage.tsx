// @ts-nocheck
import { useState } from 'react';
import { Crown, Check, Sparkles } from 'lucide-react';
import { DynamicPaymentModal } from '../payments/DynamicPaymentModal';

function currentUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function SubscribePage() {
  const [showModal, setShowModal] = useState(false);
  const [productId, setProductId] = useState<'lifetime' | 'yearly'>('lifetime');
  const user = currentUser();

  const plans = [
    {
      id: 'lifetime', name: 'Lifetime Access', usd: 255, billing: 'one-time',
      badge: 'BEST VALUE', color: 'from-amber-500 to-orange-600', highlighted: true,
      features: ['Full MT5 Bridge dashboard','Auto-trading signals (unlimited)','VPS included — lifetime','EA license — lifetime','All future features included','Priority support'],
    },
    {
      id: 'yearly', name: 'Yearly Access', usd: 160, billing: '/ year',
      color: 'from-emerald-500 to-teal-600', highlighted: false,
      features: ['Full MT5 Bridge dashboard','Auto-trading signals (unlimited)','VPS included ($10/mo — bundled)','EA license — 12 months','All features during subscription','Support via WhatsApp/Telegram'],
    },
  ];

  const openPlan = (id: 'lifetime' | 'yearly') => {
    setProductId(id);
    setShowModal(true);
  };

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles size={12} /> Get Piptrader AI
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Unlock Full Access</h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Choose your plan. Pay via M-Pesa (automatic) or Binance USDT. Activation is instant for M-Pesa.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`relative rounded-2xl p-6 border-2 ${p.highlighted ? 'border-amber-400/60 bg-gradient-to-br from-amber-500/10 to-orange-600/5 shadow-2xl shadow-amber-500/20' : 'border-slate-700 bg-slate-900/60'}`}
          >
            {p.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-lg">
                {p.badge}
              </div>
            )}
            <div className="text-center mb-5">
              <Crown className={`mx-auto mb-2 ${p.highlighted ? 'text-amber-400' : 'text-emerald-400'}`} size={32} />
              <h2 className="text-xl font-bold text-white">{p.name}</h2>
              <div className="mt-2">
                <span className="text-4xl font-extrabold text-white">${p.usd}</span>
                <span className="text-slate-400 text-sm ml-2">{p.billing}</span>
              </div>
              <div className="text-slate-500 text-xs mt-1">≈ KES {(p.usd * 129).toLocaleString()}</div>
            </div>
            <ul className="space-y-2 mb-6">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                  <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => openPlan(p.id as any)}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all bg-gradient-to-r ${p.color} hover:scale-[1.02] active:scale-[0.98] shadow-lg`}
            >
              Get Piptrader AI
            </button>
          </div>
        ))}
      </div>

      <div className="text-center mt-8 text-xs text-slate-500">
        Already paid but no access? Contact support via WhatsApp.
      </div>

      {showModal && (
        <DynamicPaymentModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          productId={productId}
          user={user}
          onPaymentSuccess={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
