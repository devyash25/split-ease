import { useState } from 'react';
import { markSplitPaid } from '../db';
import toast from 'react-hot-toast';

export default function WhoOwesMe({ owed }) {
  const [settlingId, setSettlingId] = useState(null);

  const handleSettle = async (split) => {
    setSettlingId(split.id);
    try {
      await markSplitPaid(split.id, true);
      toast.success(`"${split.description}" settled by ${split.owerName}!`);
    } catch {
      toast.error('Failed to update. Try again.');
    } finally {
      setSettlingId(null);
    }
  };

  if (owed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center slide-up">
        <div className="text-5xl mb-4">✨</div>
        <h3 className="text-lg font-semibold text-surface-200 mb-1">Nobody owes you</h3>
        <p className="text-surface-500 text-sm">All settled up! Add an expense to start tracking.</p>
      </div>
    );
  }

  // Group by ower
  const grouped = owed.reduce((acc, item) => {
    const key = item.owerName || item.owerId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4 mt-2">
      {Object.entries(grouped).map(([owerName, items]) => {
        const total = items.reduce((sum, i) => sum + (i.amount || 0), 0);
        return (
          <div key={owerName} className="slide-up">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
                ← From {owerName}
              </p>
              <span className="text-xs font-bold text-success-400">
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="space-y-2">
              {items.map((split) => (
                <div
                  key={split.id}
                  className="glass-card p-3.5 flex items-center gap-3 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-success-500/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-success-400 whitespace-nowrap">
                      ₹{(split.amount || 0).toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => handleSettle(split)}
                      disabled={settlingId === split.id}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-success-500/15 text-success-400 font-semibold hover:bg-success-500/25 transition-colors disabled:opacity-50"
                      id={`settle-${split.id}`}
                    >
                      Settle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
