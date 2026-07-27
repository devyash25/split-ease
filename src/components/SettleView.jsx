import { useState } from 'react';
import { markSplitPaid } from '../db';
import toast from 'react-hot-toast';

function formatCurrency(n) {
  return '₹' + (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(item) {
  const d = item.expenseDate || item.createdAt?.toDate?.();
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// Step 1: Transaction selector
// Step 2: UPI app picker (after computing amount)
// Step 3: Confirmation (did you pay?)

export default function SettleView({ friend, splits, currentUser, onClose }) {
  const [selected, setSelected] = useState(() => new Set(splits.map(s => s.id)));
  const [step, setStep] = useState('select'); // 'select' | 'upi_picker' | 'confirm'
  const [paying, setPaying] = useState(false);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Net: positive = friend owes me, negative = I owe friend
  const netAmount = splits
    .filter(s => selected.has(s.id))
    .reduce((sum, s) => {
      if (s.owerId === currentUser.id) return sum - s.amount;
      return sum + s.amount;
    }, 0);

  const iOweFriend = netAmount < 0;
  const absAmount = Math.abs(netAmount);

  const buildUpiUrl = (scheme) => {
    const upiId = encodeURIComponent(friend.upiId);
    const name = encodeURIComponent(friend.name);
    const note = encodeURIComponent('Zookiepookie split expense');
    const amount = absAmount.toFixed(2);
    if (scheme === 'gpay') {
      return `tez://upi/pay?pa=${upiId}&pn=${name}&am=${amount}&cu=INR&tn=${note}`;
    }
    if (scheme === 'paytm') {
      return `paytmmp://pay?pa=${upiId}&pn=${name}&am=${amount}&cu=INR&tn=${note}`;
    }
    if (scheme === 'phonepe') {
      return `phonepe://pay?pa=${upiId}&pn=${name}&am=${amount}&cu=INR&tn=${note}`;
    }
    // Generic UPI (works with any UPI app)
    return `upi://pay?pa=${upiId}&pn=${name}&am=${amount}&cu=INR&tn=${note}`;
  };

  const handleOpenUpiApp = (scheme) => {
    const url = buildUpiUrl(scheme);
    window.location.href = url;
    // After 1.5s, assume user has been redirected to UPI app, show confirm step
    setTimeout(() => setStep('confirm'), 1500);
  };

  const handleMarkPaid = async () => {
    if (selected.size === 0) { toast.error('No items selected!'); return; }
    setPaying(true);
    try {
      await Promise.all([...selected].map(id => markSplitPaid(id, true)));
      toast.success('Marked as settled! 🎉');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update. Try again.');
    } finally {
      setPaying(false);
    }
  };

  const UPI_APPS = [
    {
      id: 'gpay',
      label: 'Google Pay',
      color: 'from-blue-600 to-indigo-600',
      icon: (
        <svg viewBox="0 0 48 48" className="w-7 h-7">
          <path fill="#4285F4" d="M44.5 20H24v8h11.8C34.7 33.9 29.8 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.2-2.7-.5-4z"/>
          <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 15.8 18.9 13 24 13c3.1 0 5.9 1.1 8.1 2.9l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
          <path fill="#FBBC05" d="M24 44c5.6 0 10.5-1.9 14.3-5.1l-6.6-5.4C29.8 35.3 27 36 24 36c-5.7 0-10.6-3.8-12.4-9.1L5 31.7C8.3 38.8 15.6 44 24 44z"/>
          <path fill="#EA4335" d="M44.5 20H24v8h11.8c-.8 2.3-2.2 4.3-4.1 5.8l6.6 5.4C41.8 36.1 44.5 30.3 44.5 24c0-1.3-.2-2.7-.5-4z"/>
        </svg>
      ),
    },
    {
      id: 'paytm',
      label: 'Paytm',
      color: 'from-sky-500 to-cyan-600',
      icon: (
        <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
          <rect width="48" height="48" rx="10" fill="#00B9F1"/>
          <text x="24" y="31" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">Pay</text>
        </svg>
      ),
    },
    {
      id: 'phonepe',
      label: 'PhonePe',
      color: 'from-violet-600 to-purple-700',
      icon: (
        <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
          <rect width="48" height="48" rx="10" fill="#5F259F"/>
          <text x="24" y="31" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white">Pe</text>
        </svg>
      ),
    },
    {
      id: 'upi',
      label: 'Any UPI App',
      color: 'from-orange-500 to-amber-600',
      icon: (
        <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
          <rect width="48" height="48" rx="10" fill="#F0A500"/>
          <text x="24" y="31" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">UPI</text>
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-auto glass-card-elevated p-5 max-h-[92dvh] overflow-y-auto slide-up rounded-3xl flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full object-cover border border-surface-600" />
            <div>
              <h2 className="font-bold text-white">{friend.name}</h2>
              <p className="text-xs text-surface-500">
                {iOweFriend ? `You owe ${friend.name}` : netAmount > 0 ? `${friend.name} owes you` : 'All settled!'}
              </p>
            </div>
          </div>
          <button onClick={step === 'confirm' ? () => setStep('upi_picker') : onClose} className="text-surface-500 hover:text-surface-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step === 'confirm' ? "M15 19l-7-7 7-7" : "M6 18L18 6M6 6l12 12"} />
            </svg>
          </button>
        </div>

        {/* Net Balance */}
        <div className={`rounded-2xl p-4 text-center border ${
          iOweFriend ? 'border-danger-500/30 bg-danger-500/10' : netAmount > 0 ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-surface-700 bg-surface-800/50'
        }`}>
          <p className="text-xs text-surface-400 mb-1 uppercase tracking-wider">
            {iOweFriend ? 'You owe' : netAmount > 0 ? 'You get back' : 'Net Balance'}
          </p>
          <p className={`text-4xl font-black ${iOweFriend ? 'text-danger-400' : netAmount > 0 ? 'text-emerald-400' : 'text-surface-400'}`}>
            {formatCurrency(absAmount)}
          </p>
          <p className="text-xs text-surface-500 mt-1">Based on {selected.size} selected item{selected.size !== 1 ? 's' : ''}</p>
        </div>

        {/* ── STEP: SELECT ── */}
        {step === 'select' && (
          <>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Transactions — select to include</p>
              {splits.length === 0 && (
                <p className="text-center text-surface-500 py-8">No active transactions with {friend.name}.</p>
              )}
              {splits.map(s => {
                const iOwe = s.owerId === currentUser.id;
                const isSelected = selected.has(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-start gap-3 rounded-2xl p-3 cursor-pointer border transition-all ${
                      isSelected
                        ? iOwe ? 'border-danger-500/40 bg-danger-500/10' : 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-surface-700/50 bg-surface-800/30 opacity-50'
                    }`}
                  >
                    <input type="checkbox" checked={isSelected} onChange={() => toggle(s.id)} className="checkbox-custom mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{s.description}</p>
                      <p className="text-xs text-surface-500 mt-0.5">
                        {iOwe ? `You owe ${friend.name}` : `${friend.name} owes you`} · {formatDate(s)}
                      </p>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ${iOwe ? 'text-danger-400' : 'text-emerald-400'}`}>
                      {iOwe ? '-' : '+'}{formatCurrency(s.amount)}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="flex gap-2">
              {iOweFriend && absAmount > 0 && (
                <button
                  onClick={() => setStep('upi_picker')}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Pay via UPI
                </button>
              )}
              <button
                onClick={handleMarkPaid}
                disabled={paying || selected.size === 0}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm btn-primary flex items-center justify-center gap-2"
              >
                {paying ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {paying ? 'Marking...' : 'Mark Settled'}
              </button>
            </div>
          </>
        )}

        {/* ── STEP: UPI APP PICKER ── */}
        {step === 'upi_picker' && (
          <div className="space-y-3">
            <div className="text-center mb-1">
              <p className="font-semibold text-white">Choose payment app</p>
              <p className="text-xs text-surface-500 mt-0.5">You'll be redirected. Come back to confirm after paying.</p>
            </div>
            {UPI_APPS.map(app => (
              <button
                key={app.id}
                onClick={() => handleOpenUpiApp(app.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r ${app.color} hover:opacity-90 active:scale-95 transition-all`}
              >
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  {app.icon}
                </div>
                <span className="font-bold text-white text-base">{app.label}</span>
                <svg className="w-5 h-5 text-white/60 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
            <p className="text-xs text-surface-500 text-center pt-1">
              ℹ️ We can't auto-confirm UPI payments — you'll manually confirm after paying.
            </p>
          </div>
        )}

        {/* ── STEP: CONFIRM ── */}
        {step === 'confirm' && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-white text-lg">Did you complete the payment?</p>
              <p className="text-sm text-surface-400 mt-1">
                If you paid <span className="text-emerald-400 font-semibold">{formatCurrency(absAmount)}</span> to {friend.name}, confirm below to mark the selected expenses as settled.
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setStep('upi_picker')}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm border border-surface-600 text-surface-300 hover:bg-surface-800 transition-all"
              >
                Not yet
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={paying}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center justify-center gap-2"
              >
                {paying ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {paying ? 'Settling...' : 'Yes, I paid!'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
