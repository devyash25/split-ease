import { useState, useEffect } from 'react';
import {
  subscribeToRecentExpenses,
  getUsers,
  updateUser,
  addUser,
  deleteExpenseEntirely,
} from '../db';
import toast from 'react-hot-toast';

function MemberCard({ member, onEdit }) {
  return (
    <div className="glass-card p-3 flex items-center gap-3">
      <img src={member.avatar || '/devyash.jpg'} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-surface-600" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm truncate">{member.name}</p>
        <p className="text-xs text-surface-500 truncate">{member.rollNo || 'No roll no.'}</p>
        {member.isAdmin && <span className="text-xs text-yellow-400 font-semibold">⚡ Admin</span>}
      </div>
      <button
        onClick={() => onEdit(member)}
        className="text-xs px-3 py-1.5 rounded-lg bg-surface-700 text-surface-300 hover:bg-primary-600/30 hover:text-primary-300 transition-all"
      >
        Edit
      </button>
    </div>
  );
}

function EditMemberModal({ member, onClose, onSave }) {
  const [form, setForm] = useState({
    name: member?.name || '',
    pin: member?.pin || '',
    rollNo: member?.rollNo || '',
    phone: member?.phone || '',
    personalEmail: member?.personalEmail || '',
    collegeEmail: member?.collegeEmail || '',
    upiId: member?.upiId || '',
    isAdmin: member?.isAdmin || false,
  });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (member?.id) {
        await updateUser(member.id, form);
        toast.success('Member updated!');
      } else {
        const avatar = `/${(form.name || 'user').toLowerCase()}.jpg`;
        await addUser({ ...form, avatar });
        toast.success('Member added!');
      }
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save member.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-auto glass-card-elevated p-5 max-h-[90dvh] overflow-y-auto slide-up rounded-3xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white">{member?.id ? `Edit: ${member.name}` : 'Add New Member'}</h3>
          <button onClick={onClose} className="text-surface-500 hover:text-surface-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Name', key: 'name' },
            { label: 'PIN', key: 'pin', type: 'password' },
            { label: 'Roll No.', key: 'rollNo' },
            { label: 'Phone', key: 'phone', type: 'tel' },
            { label: 'Personal Email', key: 'personalEmail', type: 'email' },
            { label: 'College Email', key: 'collegeEmail', type: 'email' },
            { label: 'UPI ID', key: 'upiId' },
          ].map(({ label, key, type = 'text' }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1 block">{label}</label>
              <input type={type} value={form[key]} onChange={set(key)} className="input-field text-sm" />
            </div>
          ))}
          <label className="flex items-center gap-3 glass-card p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isAdmin}
              onChange={e => setForm(p => ({ ...p, isAdmin: e.target.checked }))}
              className="checkbox-custom"
            />
            <span className="text-sm text-surface-200">Admin privileges</span>
          </label>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 mt-4">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export default function AdminPanel({ currentUser, onClose }) {
  const [tab, setTab] = useState('expenses');
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [editingMember, setEditingMember] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const unsub = subscribeToRecentExpenses(setExpenses);
    return unsub;
  }, []);

  const loadMembers = () => {
    setLoadingMembers(true);
    getUsers().then(u => { setMembers(u); setLoadingMembers(false); });
  };

  useEffect(() => {
    if (tab === 'members') loadMembers();
  }, [tab]);

  const handleDelete = async (expenseId) => {
    if (!confirm('Delete this expense and all its debts for everyone?')) return;
    setDeleting(expenseId);
    try {
      await deleteExpenseEntirely(expenseId);
      toast.success('Expense deleted!');
    } catch (err) {
      toast.error('Failed to delete.');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (exp) => {
    const d = exp.expenseDate || exp.createdAt?.toDate?.();
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col fade-in bg-[#000000]">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3 border-b border-surface-800/50 bg-surface-900/50 backdrop-blur-md sticky top-0">
        <button onClick={onClose} className="text-surface-400 hover:text-white transition-colors p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="font-bold text-white">Admin Panel</h1>
          <p className="text-xs text-yellow-400">⚡ Full control mode</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex bg-surface-800 p-1 rounded-xl">
          {[{ id: 'expenses', label: '📋 All Expenses' }, { id: 'members', label: '👥 Members' }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                tab === t.id ? 'bg-surface-700 text-white shadow-sm' : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {tab === 'expenses' && (
          <div className="space-y-3 mt-2">
            {expenses.length === 0 ? (
              <p className="text-center text-surface-500 py-12">No expenses found.</p>
            ) : (
              expenses.map(exp => (
                <div key={exp.id} className="glass-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{exp.description}</p>
                      <p className="text-xs text-surface-500 mt-0.5">
                        Paid by {exp.payerName} · {formatDate(exp)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-base font-bold text-emerald-400">₹{(exp.totalAmount || 0).toLocaleString('en-IN')}</span>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        disabled={deleting === exp.id}
                        className="text-danger-400 hover:text-danger-300 transition-colors p-1 rounded-lg hover:bg-danger-400/10"
                      >
                        {deleting === exp.id ? (
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'members' && (
          <div className="space-y-3 mt-2">
            <button
              onClick={() => setShowAddMember(true)}
              className="w-full glass-card p-3 flex items-center justify-center gap-2 text-primary-400 hover:text-primary-300 border-dashed border-primary-500/30 hover:border-primary-500/60 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-semibold">Add New Member</span>
            </button>
            {loadingMembers ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="glass-card h-16 shimmer-loading" />)}
              </div>
            ) : (
              members.map(m => (
                <MemberCard key={m.id} member={m} onEdit={setEditingMember} />
              ))
            )}
          </div>
        )}
      </div>

      {(editingMember || showAddMember) && (
        <EditMemberModal
          member={editingMember}
          onClose={() => { setEditingMember(null); setShowAddMember(false); }}
          onSave={loadMembers}
        />
      )}
    </div>
  );
}
