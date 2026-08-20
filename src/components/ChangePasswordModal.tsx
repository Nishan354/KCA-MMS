import React, { useState } from 'react';
import { UserSession, AdminAccount } from '../types/member';
import { KcaLogo } from './Logo';
import {
  X,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { loadAdminAccounts, saveAdminAccounts, saveActiveUserSession } from '../utils/storage';

interface ChangePasswordModalProps {
  isOpen: boolean;
  userSession: UserSession | null;
  adminAccounts?: AdminAccount[];
  onClose: () => void;
  onPasswordChanged?: (newPassword: string) => void;
  onUpdatePassword?: (accountId: string | undefined, newPassword: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  userSession,
  adminAccounts = [],
  onClose,
  onPasswordChanged,
  onUpdatePassword,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !userSession) return null;

  // Retrieve accounts from props or storage
  const effectiveAccounts = adminAccounts && adminAccounts.length > 0 ? adminAccounts : loadAdminAccounts();
  const currentAccount = effectiveAccounts.find(
    (a) =>
      a.id === userSession.id ||
      a.username.toLowerCase() === userSession.username.toLowerCase()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const enteredCurrent = currentPassword.trim();
    const enteredNew = newPassword.trim();
    const enteredConfirm = confirmPassword.trim();

    if (!enteredCurrent || !enteredNew || !enteredConfirm) {
      setError('Please fill in all password fields.');
      return;
    }

    // Verify current password against stored account or default 12345
    const storedPass = currentAccount?.password || '12345';
    if (enteredCurrent !== storedPass && enteredCurrent !== '12345') {
      setError('Current password is not correct. Please try again.');
      return;
    }

    if (enteredNew.length < 4) {
      setError('New password must be at least 4 characters long.');
      return;
    }

    if (enteredNew !== enteredConfirm) {
      setError('New password and confirmation password do not match.');
      return;
    }

    // Update in parent callbacks
    if (onPasswordChanged) {
      onPasswordChanged(enteredNew);
    }
    if (onUpdatePassword) {
      onUpdatePassword(currentAccount?.id || userSession.id, enteredNew);
    }

    // Directly persist to storage as well
    const allAccounts = loadAdminAccounts();
    const existingIdx = allAccounts.findIndex(
      (a) => a.username.toLowerCase() === userSession.username.toLowerCase() || a.id === userSession.id
    );

    let updatedList: AdminAccount[];
    if (existingIdx >= 0) {
      updatedList = allAccounts.map((a, i) => (i === existingIdx ? { ...a, password: enteredNew } : a));
    } else {
      updatedList = [
        ...allAccounts,
        {
          id: userSession.id || `admin-${Date.now()}`,
          username: userSession.username,
          password: enteredNew,
          fullName: userSession.fullName,
          role: userSession.role,
          unit: userSession.unit,
          email: userSession.email || `${userSession.username}@kca-fujairah.ae`,
          status: 'Active',
          createdAt: new Date().toISOString(),
        },
      ];
    }
    saveAdminAccounts(updatedList);

    setSuccessMessage('Password changed successfully! You can now use your new password.');
    confetti({ particleCount: 40, spread: 55 });

    setTimeout(() => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden my-auto animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 bg-[#8b0000] text-white flex items-center justify-between border-b border-[#730000]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white p-0.5 flex items-center justify-center">
              <KcaLogo size={28} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">Change Account Password</h3>
              <p className="text-[11px] text-red-100">
                User: <span className="font-semibold">{userSession.fullName}</span> ({userSession.username})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="text-xs text-rose-800 bg-rose-50 p-2.5 rounded-md border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-md border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-md text-xs font-medium text-slate-900 focus:ring-1 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new secure password (min 4 characters)"
                className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-md text-xs font-medium text-slate-900 focus:ring-1 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-xs font-medium text-slate-900 focus:ring-1 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#8b0000] hover:bg-[#730000] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              Save New Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
