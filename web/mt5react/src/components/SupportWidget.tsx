// @ts-nocheck
import { useState, useEffect } from 'react';
import { MessageCircle, Crown, X, Sparkles, ChevronRight } from 'lucide-react';

const WHATSAPP_NUMBER = '254116081230';

const PLANS = [
  {
    id: 'lifetime',
    label: 'Lifetime Access',
    price: '$255',
    billing: 'one-time',
    color: 'from-amber-500 to-orange-600',
    badge: 'BEST VALUE',
    message: 'Hi PipTrader AI, I want Lifetime Access ($255). Please help me get set up.',
  },
  {
    id: 'yearly',
    label: 'Yearly Access',
    price: '$160',
    billing: '/ year',
    color: 'from-emerald-500 to-teal-600',
    badge: '',
    message: 'Hi PipTrader AI, I want Yearly Access ($160/year). Please help me get set up.',
  },
];

export function SupportWidget() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const handlePlanClick = (plan: typeof PLANS[number]) => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(plan.message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Get Piptrader AI — Support"
        className="fixed bottom-5 right-5 z-[90] group flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm shadow-2xl shadow-emerald-600/40 hover:scale-105 active:scale-95 transition-all"
      >
        <span className="relative flex w-2 h-2">
          <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-75" />
          <span className="relative w-2 h-2 rounded-full bg-white" />
        </span>
        <MessageCircle size={18} />
        <span className="hidden sm:inline">Get Access</span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-700/40 bg-gradient-to-r from-emerald-600/10 to-teal-600/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-2">
                    <Sparkles size={10} /> Get Piptrader AI
                  </div>
                  <h3 className="text-xl font-extrabold text-white">Choose Your Plan</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Pick a plan and we'll chat on WhatsApp to activate you instantly.
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-slate-400 hover:text-white p-1 transition"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Plan options */}
            <div className="p-4 space-y-3">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => handlePlanClick(plan)}
                  className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-slate-700/60 hover:border-slate-500/80 bg-slate-800/40 hover:bg-slate-800/70 transition-all text-left hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${plan.color} text-white shadow-lg`}>
                      <Crown size={20} />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm flex items-center gap-2">
                        {plan.label}
                        {plan.badge && (
                          <span className="text-[9px] bg-amber-400 text-black px-1.5 py-0.5 rounded-full font-extrabold uppercase">
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-300 text-xs mt-0.5">
                        {plan.price} <span className="text-slate-500">{plan.billing}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 shrink-0" />
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 pb-4">
              <p className="text-center text-[11px] text-slate-500">
                You'll be redirected to WhatsApp to complete your purchase.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
