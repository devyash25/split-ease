import { useState, useRef } from 'react';
import { updateUser, uploadAvatar } from '../db';
import toast from 'react-hot-toast';

function CopyBtn({ value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-2 text-xs text-surface-500 hover:text-primary-400 transition-colors"
      title="Copy"
    >
      {copied ? (
        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

function Field({ label, value, onChange, type = 'text', readOnly = false, copyable = false, hint }) {
  return (
    <div>
      <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5 block">{label}</label>
      <div className="flex items-center">
        <input
          type={type}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          className={`input-field flex-1 text-sm ${readOnly ? 'opacity-60 cursor-default' : ''}`}
          placeholder={hint || ''}
        />
        {copyable && value && <CopyBtn value={value} />}
      </div>
    </div>
  );
}

export default function SettingsModal({ currentUser, onClose, onUserUpdate }) {
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({
    name: currentUser.name || '',
    rollNo: currentUser.rollNo || '',
    phone: currentUser.phone || '',
    parentsPhone: currentUser.parentsPhone || '',
    momPhone: currentUser.momPhone || '',
    dadPhone: currentUser.dadPhone || '',
    personalEmail: currentUser.personalEmail || '',
    collegeEmail: currentUser.collegeEmail || '',
    upiId: currentUser.upiId || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(currentUser.id, file);
      await updateUser(currentUser.id, { avatar: url });
      onUserUpdate({ ...currentUser, avatar: url });
      toast.success('Profile picture updated!');
    } catch (err) {
      console.error(err);
      toast.error('Upload failed. Try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser(currentUser.id, {
        name: form.name.trim(),
        rollNo: form.rollNo.trim(),
        phone: form.phone.trim(),
        momPhone: form.momPhone.trim(),
        dadPhone: form.dadPhone.trim(),
        personalEmail: form.personalEmail.trim(),
        collegeEmail: form.collegeEmail.trim(),
        upiId: form.upiId.trim(),
      });
      onUserUpdate({ ...currentUser, ...form });
      toast.success('Profile saved!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'contact', label: 'Contact' },
    { id: 'payment', label: 'Payment' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-auto glass-card-elevated p-5 max-h-[90dvh] overflow-y-auto slide-up rounded-3xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold gradient-text">Settings</h2>
          <button onClick={onClose} className="text-surface-500 hover:text-surface-300 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-5">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-24 h-24 rounded-full object-cover border-2 border-primary-500/50 shadow-lg"
            />
            {uploadingAvatar ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                <svg className="w-6 h-6 animate-spin text-white" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                </svg>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            )}
          </div>
          <p className="text-xs text-surface-500 mt-2">Tap photo to change</p>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          {currentUser.isAdmin && (
            <span className="mt-2 px-3 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold tracking-wide border border-yellow-500/30">
              ⚡ Admin
            </span>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-surface-800 p-1 rounded-xl mb-4">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                tab === t.id ? 'bg-surface-700 text-white shadow-sm' : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {tab === 'profile' && (
            <>
              <Field label="Display Name" value={form.name} onChange={set('name')} hint="Your name" />
              <Field label="College Roll No." value={form.rollNo} onChange={set('rollNo')} hint="e.g. 2025UEC2598" copyable />
            </>
          )}

          {tab === 'contact' && (
            <>
              <div>
                <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5 block">Your Number</label>
                <div className="flex items-center">
                  <input type="tel" value={form.phone} onChange={set('phone')} className="input-field flex-1 text-sm" placeholder="Phone number" />
                  {form.phone && <CopyBtn value={form.phone} />}
                </div>
              </div>

              <div className="glass-card p-3 space-y-3">
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Parents' Numbers</p>
                <div>
                  <label className="text-xs text-surface-500 mb-1 block">Mom</label>
                  <div className="flex items-center">
                    <input type="tel" value={form.momPhone} onChange={set('momPhone')} className="input-field flex-1 text-sm" placeholder="Mom's number" />
                    {form.momPhone && <CopyBtn value={form.momPhone} />}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-surface-500 mb-1 block">Dad</label>
                  <div className="flex items-center">
                    <input type="tel" value={form.dadPhone} onChange={set('dadPhone')} className="input-field flex-1 text-sm" placeholder="Dad's number" />
                    {form.dadPhone && <CopyBtn value={form.dadPhone} />}
                  </div>
                </div>
              </div>

              <div className="glass-card p-3 space-y-3">
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Email IDs</p>
                <div>
                  <label className="text-xs text-surface-500 mb-1 block">Personal</label>
                  <div className="flex items-center">
                    <input type="email" value={form.personalEmail} onChange={set('personalEmail')} className="input-field flex-1 text-sm" placeholder="your@gmail.com" />
                    {form.personalEmail && <CopyBtn value={form.personalEmail} />}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-surface-500 mb-1 block">College</label>
                  <div className="flex items-center">
                    <input type="email" value={form.collegeEmail} onChange={set('collegeEmail')} className="input-field flex-1 text-sm" placeholder="your@nsut.ac.in" />
                    {form.collegeEmail && <CopyBtn value={form.collegeEmail} />}
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'payment' && (
            <div>
              <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5 block">UPI ID</label>
              <div className="flex items-center">
                <input type="text" value={form.upiId} onChange={set('upiId')} className="input-field flex-1 text-sm" placeholder="yourname@upi" />
                {form.upiId && <CopyBtn value={form.upiId} />}
              </div>
              <p className="text-xs text-surface-500 mt-2">This UPI ID will be used by others when settling debts with you.</p>
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full py-3.5 text-base mt-5"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
