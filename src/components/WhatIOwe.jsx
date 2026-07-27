import { useState } from 'react';
import { markSplitPaid } from '../db';
import toast from 'react-hot-toast';

export default function WhatIOwe({ debts }) {
  const [payingId, setPayingId] = useState(null);

  const handlePay = async (split) => {
    setPayingId(split.id);
    try {
      await markSplitPaid(split.id, true);
      toast.success(`Marked "${split.description}" as paid!`);
    } catch {
      toast.error('Failed to update. Try again.');
    } finally {
      setPayingId(null);
    }
  };

  if (debts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center slide-up">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-lg font-semibold text-surface-200 mb-1">All clear!</h3>
        <p className="text-surface-500 text-sm">You don't owe anyone right now.</p>
      </div>
    );
  }

  // Group debts by payer
  const grouped = debts.reduce((acc, debt) => {
    const key = debt.payerName || debt.payerId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(debt);
    return acc;
  }, {});

  return (
    <div className="space-y-4 mt-2">
      {Object.entries(grouped).map(([payerName, items]) => (
        <div key={payerName} className="slide-up">
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2 px-1">
            → To {payerName}
          </p>
          <div className="space-y-2">
            {items.map((split) => (
              <div
                key={split.id}
                className="glass-card p-3.5 flex items-center gap-3 transition-all duration-200"
              >
                <input
                  type="checkbox"
                  className="checkbox-custom"
                  checked={false}
                  onChange={() => handlePay(split)}
                  disabled={payingId === split.id}
                  id={`pay-${split.id}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-200 truncate">
                    {split.description}
                    {split.isRecurring && (
                      <span className="ml-2 text-[0.65rem] px-1.5 py-0.5 rounded-full bg-accent-600/20 text-accent-400 font-medium">
                        Monthly
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-sm font-bold text-danger-400 whitespace-nowrap">
                  ₹{(split.amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
