import { useState, useEffect } from 'react';
import { verifyPin } from '../db';
import toast from 'react-hot-toast';

export default function PinModal({ user, onSuccess, onClose }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pin.length === 4) {
      handleVerify();
    }
  }, [pin]);

  const handleVerify = async () => {
    setLoading(true);
    setError(false);
    try {
      const valid = await verifyPin(user.id, pin);
      if (valid) {
        toast.success(`Welcome back, ${user.name}!`);
        onSuccess(user);
      } else {
        // Offline/fallback: check against local user data
        if (user.pin === pin) {
          toast.success(`Welcome back, ${user.name}!`);
          onSuccess(user);
        } else {
          setError(true);
          setPin('');
          toast.error('Wrong PIN. Try again.');
        }
      }
    } catch {
      // Fallback for offline/unconfigured Firebase
      if (user.pin === pin) {
        toast.success(`Welcome back, ${user.name}!`);
        onSuccess(user);
      } else {
        setError(true);
        setPin('');
        toast.error('Wrong PIN. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDigit = (digit) => {
    if (pin.length < 4 && !loading) {
      setPin((p) => p + digit);
      setError(false);
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center fade-in">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm mx-auto glass-card-elevated p-6 pb-8 sm:mb-0 slide-up">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-surface-500 hover:text-surface-300 transition-colors"
          id="pin-close-btn"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* User avatar & name */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-primary-600/30 to-accent-600/30 flex items-center justify-center text-3xl mx-auto mb-3 border border-surface-700/60">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xl font-bold text-surface-100">{user.name}</h2>
          <p className="text-surface-400 text-sm mt-1">Enter your 4-digit PIN</p>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`pin-dot ${
                pin.length > i ? 'filled' : ''
              } ${error ? '!border-danger-400' : ''}`}
            />
          ))}
        </div>

        {/* Numpad */}
        <div className="flex flex-col items-center gap-3">
          {[[1, 2, 3], [4, 5, 6], [7, 8, 9]].map((row, ri) => (
            <div key={ri} className="flex gap-4">
              {row.map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleDigit(String(digit))}
                  className="numpad-btn"
                  id={`pin-digit-${digit}`}
                  disabled={loading}
                >
                  {digit}
                </button>
              ))}
            </div>
          ))}
          <div className="flex gap-4">
            <div className="w-[4.5rem]" />
            <button
              onClick={() => handleDigit('0')}
              className="numpad-btn"
              id="pin-digit-0"
              disabled={loading}
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="numpad-btn !text-lg"
              id="pin-delete-btn"
              disabled={loading}
            >
              ⌫
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center mt-4 text-surface-400 text-sm">
            Verifying...
          </div>
        )}
      </div>
    </div>
  );
}
