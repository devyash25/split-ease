import { useState, useEffect } from 'react';
import Header from './Header';
import AddExpense from './AddExpense';
import SettleView from './SettleView';
import SettingsModal from './SettingsModal';
import AdminPanel from './AdminPanel';
import MembersModal from './MembersModal';
import {
  subscribeToMyDebts,
  subscribeToOwedToMe,
  subscribeToMyPaidDebts,
  subscribeToPaidToMe,
  subscribeToRecentExpenses,
} from '../db';

function formatCurrency(n) {
  return '₹' + (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(item) {
  const d = item.expenseDate || item.createdAt?.toDate?.();
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function Dashboard({ currentUser, users, onLogout, onUserUpdate }) {
  const [activeTab, setActiveTab] = useState('balances');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [settleWith, setSettleWith] = useState(null);
  const [myDebts, setMyDebts] = useState([]);
  const [owedToMe, setOwedToMe] = useState([]);
  const [myPaid, setMyPaid] = useState([]);
  const [paidToMe, setPaidToMe] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    const unsubDebts = subscribeToMyDebts(currentUser.id, (data) => { setMyDebts(data); setLoading(false); });
    const unsubOwed = subscribeToOwedToMe(currentUser.id, (data) => { setOwedToMe(data); setLoading(false); });
    const unsubMyPaid = subscribeToMyPaidDebts(currentUser.id, setMyPaid);
    const unsubPaidToMe = subscribeToPaidToMe(currentUser.id, setPaidToMe);
    const unsubExpenses = subscribeToRecentExpenses(setAllExpenses);
    return () => { unsubDebts(); unsubOwed(); unsubMyPaid(); unsubPaidToMe(); unsubExpenses(); };
  }, [currentUser]);

  const friendBalances = users
    .filter(u => u.id !== currentUser.id)
    .map(friend => {
      const iOwe = myDebts.filter(s => s.payerId === friend.id).reduce((sum, s) => sum + (s.amount || 0), 0);
      const theyOwe = owedToMe.filter(s => s.owerId === friend.id).reduce((sum, s) => sum + (s.amount || 0), 0);
      const net = theyOwe - iOwe;
      return { friend, net, iOwe, theyOwe };
    });

  const totalIOwe = myDebts.reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalOwedToMe = owedToMe.reduce((sum, d) => sum + (d.amount || 0), 0);
  const netBalance = totalOwedToMe - totalIOwe;

  // Merged activity: all expenses (paid and unpaid) chronologically
  const activityList = [...allExpenses].sort((a, b) => {
    const tA = a.expenseDate ? new Date(a.expenseDate).getTime() : (a.createdAt?.toMillis?.() || 0);
    const tB = b.expenseDate ? new Date(b.expenseDate).getTime() : (b.createdAt?.toMillis?.() || 0);
    return tB - tA;
  });

  // Settled items for activity tab
  const settledSplits = [...myPaid, ...paidToMe].sort((a, b) => {
    const tA = a.expenseDate ? new Date(a.expenseDate).getTime() : (a.createdAt?.toMillis?.() || 0);
    const tB = b.expenseDate ? new Date(b.expenseDate).getTime() : (b.createdAt?.toMillis?.() || 0);
    return tB - tA;
  });

  const settleWithSplits = settleWith
    ? [
        ...myDebts.filter(s => s.payerId === settleWith.id),
        ...owedToMe.filter(s => s.owerId === settleWith.id),
      ]
    : [];

  if (showAdmin && currentUser.isAdmin) {
    return <AdminPanel currentUser={currentUser} onClose={() => setShowAdmin(false)} />;
  }

  return (
    <div className="min-h-dvh flex flex-col fade-in">
      <Header
        user={currentUser}
        onLogout={onLogout}
        onOpenSettings={() => setShowSettings(true)}
        onOpenMembers={() => setShowMembers(true)}
        memberCount={users.length}
      />

      {/* Summary Cards */}
      <div className="px-4 pt-4 pb-2">
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-3 text-center">
            <p className="text-[0.65rem] uppercase tracking-wider text-surface-500 mb-1">I Owe</p>
            <p className="text-lg font-bold text-danger-400">{formatCurrency(totalIOwe)}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-[0.65rem] uppercase tracking-wider text-surface-500 mb-1">Owed to me</p>
            <p className="text-lg font-bold text-success-400">{formatCurrency(totalOwedToMe)}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-[0.65rem] uppercase tracking-wider text-surface-500 mb-1">Net</p>
            <p className={`text-lg font-bold ${netBalance >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
              {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation - only 2 tabs now */}
      <div className="px-4 pt-1 pb-2">
        <div className="flex bg-surface-800 p-1 rounded-xl">
          {[
            { id: 'balances', label: 'Balances' },
            { id: 'activity', label: 'Activity' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === t.id ? 'bg-surface-700 text-white shadow-sm' : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 px-4 pb-24">
        {loading ? (
          <div className="space-y-3 mt-2">
            {[1, 2, 3].map(i => <div key={i} className="glass-card p-4 shimmer-loading h-16 rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* ── BALANCES TAB ── */}
            {activeTab === 'balances' && (
              <div className="space-y-3 mt-2">
                <p className="text-xs text-surface-500 uppercase tracking-wider font-semibold">Tap a friend to settle up</p>
                {friendBalances.map(({ friend, net, iOwe, theyOwe }) => (
                  <button
                    key={friend.id}
                    onClick={() => setSettleWith(friend)}
                    className="w-full glass-card p-4 flex items-center gap-3 hover:border-surface-600 transition-all active:scale-95"
                  >
                    <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full object-cover border-2 border-surface-700" />
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-white">{friend.name}</p>
                      <p className="text-xs text-surface-500 mt-0.5">
                        {net === 0 ? 'All settled' : net > 0 ? `Owes you ${formatCurrency(theyOwe)}` : `You owe ${formatCurrency(iOwe)}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black ${net > 0 ? 'text-emerald-400' : net < 0 ? 'text-danger-400' : 'text-surface-500'}`}>
                        {net >= 0 ? '+' : ''}{formatCurrency(net)}
                      </p>
                      <svg className="w-4 h-4 text-surface-600 ml-auto mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
                {friendBalances.every(b => b.net === 0) && (
                  <div className="text-center py-10">
                    <p className="text-4xl mb-3">🎉</p>
                    <p className="font-bold text-white">All settled up!</p>
                    <p className="text-sm text-surface-500 mt-1">No outstanding balances</p>
                  </div>
                )}
              </div>
            )}

            {/* ── ACTIVITY TAB (merged expenses + history) ── */}
            {activeTab === 'activity' && (
              <div className="space-y-4 mt-2">

                {/* Active Expenses */}
                <div>
                  <p className="text-xs text-surface-500 uppercase tracking-wider font-semibold mb-2">Active Expenses</p>
                  {activityList.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-surface-500 text-sm">No expenses yet. Tap + to add one!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activityList.map(exp => {
                        const payer = users.find(u => u.id === exp.payerId);
                        return (
                          <div key={exp.id} className="glass-card p-4 flex items-start gap-3">
                            <img src={payer?.avatar || '/devyash.jpg'} alt={payer?.name} className="w-9 h-9 rounded-full object-cover border border-surface-700 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white text-sm truncate">{exp.description}</p>
                              <p className="text-xs text-surface-500 mt-0.5">
                                {exp.payerName} paid · {formatDate(exp)}
                                {exp.isRecurring && <span className="ml-1.5 text-primary-400">🔁</span>}
                              </p>
                            </div>
                            <span className="text-base font-bold text-white shrink-0">{formatCurrency(exp.totalAmount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Settled History */}
                {settledSplits.length > 0 && (
                  <div>
                    <p className="text-xs text-surface-500 uppercase tracking-wider font-semibold mb-2">Settled History</p>
                    <div className="space-y-2">
                      {settledSplits.map(s => {
                        const iWasPayer = s.payerId === currentUser.id;
                        return (
                          <div key={s.id} className="glass-card p-3 flex items-start gap-3 opacity-70">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${iWasPayer ? 'bg-emerald-400' : 'bg-surface-500'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-surface-300 truncate">{s.description}</p>
                              <p className="text-xs text-surface-600 mt-0.5">
                                {iWasPayer ? `${s.owerName} paid you` : `You paid ${s.payerName}`} · {formatDate(s)}
                              </p>
                            </div>
                            <span className={`text-sm font-semibold shrink-0 ${iWasPayer ? 'text-emerald-500' : 'text-surface-500'}`}>
                              {formatCurrency(s.amount)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB - Add Expense */}
      <button
        onClick={() => setShowAddExpense(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full btn-primary flex items-center justify-center shadow-lg z-40 scale-in"
        id="add-expense-fab"
        style={{ padding: 0 }}
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Admin FAB (Devyash only) */}
      {currentUser.isAdmin && (
        <button
          onClick={() => setShowAdmin(true)}
          className="fixed bottom-6 left-6 w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg z-40"
          title="Admin Panel"
          id="admin-panel-fab"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </button>
      )}

      {/* Modals */}
      {showAddExpense && <AddExpense currentUser={currentUser} users={users} onClose={() => setShowAddExpense(false)} />}
      {showSettings && <SettingsModal currentUser={currentUser} onClose={() => setShowSettings(false)} onUserUpdate={(u) => { onUserUpdate(u); setShowSettings(false); }} />}
      {showMembers && <MembersModal users={users} currentUserId={currentUser.id} onClose={() => setShowMembers(false)} />}
      {settleWith && <SettleView friend={settleWith} splits={settleWithSplits} currentUser={currentUser} onClose={() => setSettleWith(null)} />}
    </div>
  );
}
