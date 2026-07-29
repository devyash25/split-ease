import { useState } from 'react';
import { addExpense, addExpenseSplit } from '../db';
import toast from 'react-hot-toast';

export default function AddExpense({ currentUser, users, onClose }) {
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [payerId, setPayerId] = useState(currentUser.id);
  const [isRecurring, setIsRecurring] = useState(false);
  const [splitMode, setSplitMode] = useState('equal');
  const [excludedUsers, setExcludedUsers] = useState([]);
  const [expenseDate, setExpenseDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [customAmounts, setCustomAmounts] = useState(
    Object.fromEntries(users.map((u) => [u.id, '']))
  );
  const [submitting, setSubmitting] = useState(false);

  const payer = users.find((u) => u.id === payerId);
  const amount = parseFloat(totalAmount) || 0;

  const getParticipants = () => {
    if (splitMode === 'equal') return users;
    if (splitMode === 'exclude') return users.filter((u) => !excludedUsers.includes(u.id));
    return users;
  };

  const getSplits = () => {
    const participants = getParticipants();
    if (participants.length === 0) return [];
    if (splitMode === 'custom') {
      return participants
        .filter((u) => u.id !== payerId && parseFloat(customAmounts[u.id]) > 0)
        .map((u) => ({
          owerId: u.id,
          owerName: u.name,
          amount: parseFloat(customAmounts[u.id]),
        }));
    }
    const perPerson = amount / participants.length;
    return participants
      .filter((u) => u.id !== payerId)
      .map((u) => ({
        owerId: u.id,
        owerName: u.name,
        amount: Math.round(perPerson * 100) / 100,
      }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return toast.error('Add a description');
    if (amount <= 0) return toast.error('Enter a valid amount');

    const splits = getSplits();
    if (splits.length === 0) return toast.error('No one to split with!');

    setSubmitting(true);
    try {
      const expenseId = await addExpense({
        payerId,
        payerName: payer?.name || 'Unknown',
        totalAmount: amount,
        description: description.trim(),
        isRecurring,
        date: expenseDate,
      });

      await Promise.all(
        splits.map((split) =>
          addExpenseSplit({
            expenseId,
            owerId: split.owerId,
            owerName: split.owerName,
            payerId,
            payerName: payer?.name || 'Unknown',
            amount: split.amount,
            description: description.trim(),
            isRecurring,
            date: expenseDate,
          })
        )
      );

      toast.success('Expense added!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExclude = (userId) => {
    setExcludedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center fade-in">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md mx-auto glass-card-elevated p-5 max-h-[90dvh] overflow-y-auto slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold gradient-text">Add Expense</h2>
          <button
            onClick={onClose}
            className="text-surface-500 hover:text-surface-300 transition-colors"
            id="add-expense-close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5 block">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Water Bill, Groceries..."
              className="input-field"
              id="expense-description"
              autoFocus
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5 block">Date</label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="input-field w-full"
              id="expense-date"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5 block">Total Amount (₹)</label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0"
              className="input-field text-2xl font-bold"
              min="0"
              step="0.01"
              id="expense-amount"
            />
          </div>

          {/* Paid By */}
          <div>
            <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5 block">Paid by</label>
            <div className="flex gap-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setPayerId(u.id)}
                  className={`flex-1 py-2.5 px-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                    payerId === u.id
                      ? 'border-primary-500/50 bg-primary-600/20 text-primary-300'
                      : 'border-surface-700/50 bg-surface-800/30 text-surface-400 hover:border-surface-600'
                  }`}
                  id={`payer-${u.id}`}
                >
                  <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover mx-auto mb-0.5 border border-surface-600" />
                  {u.name}
                </button>
              ))}
            </div>
          </div>

          {/* Split Mode */}
          <div>
            <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5 block">Split method</label>
            <div className="flex gap-2">
              {[
                { value: 'equal', label: 'Equal', icon: '⚖️' },
                { value: 'exclude', label: 'Exclude', icon: '🚫' },
                { value: 'custom', label: 'Custom', icon: '✏️' },
              ].map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setSplitMode(mode.value)}
                  className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                    splitMode === mode.value
                      ? 'border-primary-500/50 bg-primary-600/20 text-primary-300'
                      : 'border-surface-700/50 bg-surface-800/30 text-surface-400 hover:border-surface-600'
                  }`}
                  id={`split-mode-${mode.value}`}
                >
                  <span className="text-base block mb-0.5">{mode.icon}</span>
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Exclude Options */}
          {splitMode === 'exclude' && (
            <div className="space-y-2 slide-up">
              <p className="text-xs text-surface-500">Who should be excluded? (you can exclude yourself too)</p>
              {users
                .map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-3 glass-card p-3 cursor-pointer hover:border-surface-600 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={excludedUsers.includes(u.id)}
                      onChange={() => toggleExclude(u.id)}
                      className="checkbox-custom"
                      id={`exclude-${u.id}`}
                    />
                    <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover border border-surface-600" />
                    <span className="text-sm font-medium text-surface-200">{u.name}</span>
                  </label>
                ))}
            </div>
          )}

          {/* Custom Amounts */}
          {splitMode === 'custom' && (
            <div className="space-y-2 slide-up">
              <p className="text-xs text-surface-500">How much does each person owe?</p>
              {users
                .filter((u) => u.id !== payerId)
                .map((u) => (
                  <div key={u.id} className="flex items-center gap-3 glass-card p-3">
                    <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover border border-surface-600" />
                    <span className="text-sm font-medium text-surface-200 flex-1">{u.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-surface-500 text-sm">₹</span>
                      <input
                        type="number"
                        value={customAmounts[u.id]}
                        onChange={(e) =>
                          setCustomAmounts((prev) => ({
                            ...prev,
                            [u.id]: e.target.value,
                          }))
                        }
                        placeholder="0"
                        className="input-field w-24 text-right text-sm"
                        min="0"
                        step="0.01"
                        id={`custom-amount-${u.id}`}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Recurring */}
          <label className="flex items-center gap-3 glass-card p-3 cursor-pointer hover:border-surface-600 transition-colors">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="checkbox-custom"
              id="expense-recurring"
            />
            <div>
              <span className="text-sm font-medium text-surface-200">Monthly recurring bill</span>
              <p className="text-xs text-surface-500 mt-0.5">e.g. Rent, WiFi, Netflix</p>
            </div>
          </label>

          {/* Preview */}
          {amount > 0 && getSplits().length > 0 && (
            <div className="glass-card p-3 space-y-1.5 slide-up">
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Split Preview</p>
              {getSplits().map((s) => (
                <div key={s.owerId} className="flex items-center justify-between">
                  <span className="text-sm text-surface-300">{s.owerName} owes {payer?.name}</span>
                  <span className="text-sm font-semibold text-primary-400">₹{s.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3.5 text-base"
            id="submit-expense"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                </svg>
                Adding...
              </span>
            ) : (
              'Add Expense'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
