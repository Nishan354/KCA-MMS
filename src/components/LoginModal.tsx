import React, { useState } from 'react';
import { UserSession, AdminAccount, Member } from '../types/member';
import { KcaLogo } from './Logo';
import { findMemberByQuery } from '../utils/memberLookup';
import {
  Lock,
  User,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
  CreditCard,
  Search,
  Download,
  QrCode,
} from 'lucide-react';
import { OFFICIAL_ORG_NAME } from '../config/constants';

interface LoginModalProps {
  isOpen: boolean;
  adminAccounts: AdminAccount[];
  members?: Member[];
  onLogin: (session: UserSession, rememberMe?: boolean) => void;
  onOpenPublicCard?: (member: Member) => void;
  onSearchVerify?: (query: string) => void;
  onOpenQrScanner?: () => void;
  onClose?: () => void;
  canClose?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  adminAccounts,
  members = [],
  onLogin,
  onOpenPublicCard,
  onSearchVerify,
  onOpenQrScanner,
  onClose,
  canClose = false,
}) => {
  const [activeTab, setActiveTab] = useState<'member_portal' | 'admin_login'>('member_portal');

  // Member Search Portal State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  // Secure Admin Login State
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Handle Member Quick Search & ID Card Direct Download
  const handleMemberSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchError(null);

    const q = searchQuery.trim();
    if (!q) {
      setSearchError('Please enter your Registered Mobile (e.g. 050 482 9134), Membership ID (e.g. KCA-FU-1001), or Emirates ID.');
      return;
    }

    // Search among registered members with robust digit matching
    const matched = findMemberByQuery(q, members);

    if (matched && onOpenPublicCard) {
      onOpenPublicCard(matched);
    } else if (onSearchVerify) {
      onSearchVerify(q);
    } else if (matched) {
      if (onOpenPublicCard) {
        onOpenPublicCard(matched);
      }
    } else {
      setSearchError(`No member record found matching "${q}". Please verify your mobile number or Membership ID.`);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setIsSubmitting(true);

    const inputUser = usernameInput.trim().toLowerCase();
    const inputPass = password.trim();

    if (!inputUser || !inputPass) {
      setAdminError('Please enter both your username/email and password.');
      setIsSubmitting(false);
      return;
    }

    // Check credentials against registered accounts
    const matchedAccount = adminAccounts.find(
      (acc) =>
        (acc.username.toLowerCase() === inputUser || acc.email.toLowerCase() === inputUser) &&
        acc.status !== 'Inactive'
    );

    if (matchedAccount) {
      if (matchedAccount.password !== inputPass) {
        setAdminError('Invalid username or password. Please try again.');
        setIsSubmitting(false);
        return;
      }
      const session: UserSession = {
        id: matchedAccount.id,
        username: matchedAccount.username,
        fullName: matchedAccount.fullName,
        role: matchedAccount.role,
        unit: matchedAccount.unit,
        email: matchedAccount.email,
        isLoggedIn: true,
      };
      setIsSubmitting(false);
      onLogin(session, rememberMe);
      return;
    }

    // Default fallback check for initial built-in credentials
    if (inputUser === 'admin' && inputPass === '12345') {
      const session: UserSession = {
        id: 'admin-001',
        username: 'admin',
        fullName: 'Central Committee Administrator',
        role: 'Super Admin',
        unit: 'Fujairah',
        email: 'admin@kca-fujairah.ae',
        isLoggedIn: true,
      };
      setIsSubmitting(false);
      onLogin(session, rememberMe);
    } else {
      setAdminError('Invalid username or password. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-auto animate-fadeIn">
        {/* Header with Official KCA Fujairah Branding */}
        <div className="bg-[#8b0000] p-5 sm:p-6 text-white text-center relative border-b border-[#730000]">
          <div className="w-16 h-16 mx-auto mb-3 bg-white p-1 rounded-full shadow-md border-2 border-white/60 flex items-center justify-center">
            <KcaLogo size={52} />
          </div>

          <h1 className="font-display font-black text-lg tracking-tight uppercase leading-tight text-white">
            {OFFICIAL_ORG_NAME}
          </h1>
          <div className="font-display font-bold text-xs tracking-wider text-amber-300 mt-0.5">
            FUJAIRAH &bull; UNITED ARAB EMIRATES
          </div>
          <div className="text-xs text-red-100 font-medium mt-1">
            Official Member Verification &amp; Staff Access
          </div>
        </div>

        {/* Top Tab Bar: Member Card Self-Service VS Admin Login */}
        <div className="flex border-b border-slate-200 bg-slate-100/90 p-1.5 gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('member_portal');
              setSearchError(null);
              setAdminError(null);
            }}
            className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'member_portal'
                ? 'bg-white text-[#8b0000] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-[#8b0000]" />
            <span>Digital ID Card Verification</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin_login');
              setAdminError(null);
              setSearchError(null);
            }}
            className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'admin_login'
                ? 'bg-white text-[#8b0000] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <span>Staff Sign In</span>
          </button>
        </div>

        {/* TAB 1: MEMBER CARD SELF SERVICE & DOWNLOAD (No Login Required) */}
        {activeTab === 'member_portal' && (
          <div className="p-5 sm:p-6 space-y-4">
            <div className="text-center space-y-1">
              <h2 className="font-display font-bold text-base text-slate-900">
                Member Digital ID Verification
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Search by registered Mobile Number, Membership ID, or Emirates ID to verify and view your official digital card.
              </p>
            </div>

            <form onSubmit={(e) => handleMemberSearch(e)} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mobile Number / Membership ID / Emirates ID
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchError(null);
                    }}
                    placeholder="e.g. 050 482 9134 or KCA-FU-1001"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none placeholder:font-normal placeholder:text-slate-400 shadow-inner"
                  />
                </div>
              </div>

              {searchError && (
                <div className="text-xs text-rose-800 bg-rose-50 p-3 rounded-lg border border-rose-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{searchError}</span>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-lg bg-[#8b0000] hover:bg-[#730000] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Verify &amp; View Digital ID Card</span>
                </button>
              </div>

              {onOpenQrScanner && (
                <div className="pt-2 border-t border-slate-100 flex justify-center">
                  <button
                    type="button"
                    onClick={onOpenQrScanner}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-[#8b0000] py-1.5 px-3 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-[#8b0000]" />
                    <span>Scan Physical Card QR Code</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* TAB 2: SECURE ADMIN & OPERATOR LOGIN FORM */}
        {activeTab === 'admin_login' && (
          <form onSubmit={handleLoginSubmit} className="p-5 sm:p-6 space-y-4">
            <div className="text-center pb-1">
              <h2 className="font-display font-bold text-base text-slate-900">
                Staff &amp; Committee Sign In
              </h2>
              <p className="text-xs text-slate-500">
                Restricted access for Central Committee and Unit Data Operators
              </p>
            </div>

            {/* Username / Email Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    setAdminError(null);
                  }}
                  placeholder="Enter your username or email"
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none shadow-inner"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setAdminError(null);
                  }}
                  className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none font-mono shadow-inner"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between text-xs text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#8b0000] focus:ring-0"
                />
                <span>Remember me on this browser</span>
              </label>
            </div>

            {/* Error Banner */}
            {adminError && (
              <div className="text-xs text-rose-800 bg-rose-50 p-3 rounded-lg border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{adminError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg bg-[#8b0000] hover:bg-[#730000] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4.5 h-4.5" />
              <span>Sign In to Admin Portal</span>
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="bg-slate-50 px-5 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-[#8b0000]" />
            <span>KCA Fujairah Official Central Register</span>
          </div>
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
