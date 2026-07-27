import React from 'react';
import { format } from 'date-fns';
import { BadgeCheck } from 'lucide-react';

export default function History({ historyList, currentUser }) {
  if (historyList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-surface-800/30 rounded-2xl border border-surface-700/50 mt-4">
        <div className="w-16 h-16 rounded-full bg-surface-700/30 flex items-center justify-center mb-4">
          <BadgeCheck className="w-8 h-8 text-surface-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No History Yet</h3>
        <p className="text-surface-300 text-sm">Settled expenses will appear here once you clear your debts or someone pays you back.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4 pb-20">
      {historyList.map((item) => {
        const iOwed = item.owerId === currentUser.id;
        
        // Use expenseDate if available, otherwise fallback to createdAt
        let dateStr = 'Unknown Date';
        if (item.expenseDate) {
          dateStr = format(new Date(item.expenseDate), 'MMM d, yyyy');
        } else if (item.createdAt?.toMillis) {
          dateStr = format(new Date(item.createdAt.toMillis()), 'MMM d, yyyy');
        }

        return (
          <div key={item.id} className="bg-surface-800/40 rounded-2xl p-4 border border-surface-700/50 flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
               <BadgeCheck className="w-16 h-16 text-emerald-500" />
            </div>
            <div className="flex justify-between items-start z-10">
              <div>
                <p className="text-white font-medium text-lg leading-tight mb-1">{item.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-surface-400 bg-surface-700/50 px-2 py-0.5 rounded-full">
                    {dateStr}
                  </span>
                  {item.isRecurring && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full">
                      Recurring
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className={`text-xl font-bold ${iOwed ? 'text-emerald-400' : 'text-emerald-400'}`}>
                  ₹{item.amount.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] font-semibold text-surface-300 uppercase tracking-wide">Settled</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-1 text-sm z-10">
              <div className="flex items-center gap-1.5 text-surface-200">
                <span className="opacity-60">You {iOwed ? 'paid' : 'were paid by'}</span>
                <span className="font-semibold text-white">
                  {iOwed ? item.payerName : item.owerName}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
