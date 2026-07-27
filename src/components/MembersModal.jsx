function CopyBtn({ value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={handleCopy} className="shrink-0 text-surface-500 hover:text-primary-400 transition-colors" title="Copy">
      {copied ? (
        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

function InfoRow({ label, value, copyable }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-2 py-2 border-b border-surface-800/60 last:border-0">
      <span className="text-xs text-surface-500 shrink-0 w-28">{label}</span>
      <span className="text-xs text-surface-200 text-right flex-1 break-all">{value}</span>
      {copyable && value && <CopyBtn value={value} />}
    </div>
  );
}

import { useState } from 'react';

export default function MembersModal({ users, currentUserId, onClose }) {
  const [selectedMember, setSelectedMember] = useState(null);

  const member = selectedMember ? users.find(u => u.id === selectedMember) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-auto glass-card-elevated p-5 max-h-[88dvh] overflow-y-auto slide-up rounded-3xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {selectedMember && (
              <button onClick={() => setSelectedMember(null)} className="text-surface-400 hover:text-white mr-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="font-bold text-white gradient-text">{selectedMember ? member?.name : 'Members'}</h2>
          </div>
          <button onClick={onClose} className="text-surface-500 hover:text-surface-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Member List */}
        {!selectedMember && (
          <div className="space-y-2">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedMember(u.id)}
                className="w-full flex items-center gap-4 glass-card p-4 hover:border-surface-600 active:scale-95 transition-all text-left"
              >
                <div className="relative">
                  <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-full object-cover border-2 border-surface-700" />
                  {u.isAdmin && (
                    <span className="absolute -top-1 -right-1 text-xs bg-yellow-500 text-black rounded-full w-4 h-4 flex items-center justify-center font-bold">⚡</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">
                    {u.name} {u.id === currentUserId && <span className="text-xs text-primary-400 font-normal">(you)</span>}
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">{u.rollNo || 'No roll no.'}</p>
                </div>
                <svg className="w-4 h-4 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Individual Member Detail */}
        {selectedMember && member && (
          <div className="space-y-3">
            {/* Avatar */}
            <div className="flex flex-col items-center py-3">
              <img src={member.avatar} alt={member.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary-500/40 shadow-lg mb-2" />
              <h3 className="font-bold text-white text-lg">{member.name}</h3>
              {member.isAdmin && (
                <span className="mt-1 px-3 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-yellow-500/30">⚡ Admin</span>
              )}
            </div>

            {/* Info Cards */}
            <div className="glass-card p-3 space-y-0">
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Academic</p>
              <InfoRow label="Roll No." value={member.rollNo} copyable />
              <InfoRow label="College Email" value={member.collegeEmail} copyable />
            </div>

            <div className="glass-card p-3 space-y-0">
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Contact</p>
              <InfoRow label="Phone" value={member.phone} copyable />
              <InfoRow label="Personal Email" value={member.personalEmail} copyable />
            </div>

            <div className="glass-card p-3 space-y-0">
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Parents</p>
              <InfoRow label="Mom" value={member.momPhone || '—'} copyable={!!member.momPhone} />
              <InfoRow label="Dad" value={member.dadPhone || '—'} copyable={!!member.dadPhone} />
            </div>

            <div className="glass-card p-3 space-y-0">
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Payment</p>
              <InfoRow label="UPI ID" value={member.upiId} copyable />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
