import React, { useState, useEffect } from 'react';
import { Member, CustomFieldDefinition, AdminAccount, UserSession } from '../types/member';
import { KcaLogo } from './Logo';
import { IdCard } from './IdCard';
import { findMemberByQuery } from '../utils/memberLookup';
import { formatCardDate, getExpiryStatus, getMemberVerifyUrl } from '../utils/idGenerator';
import { downloadMemberIdCardPng } from '../utils/cardExporter';
import {
  ShieldCheck,
  Search,
  QrCode,
  Lock,
  Download,
  AlertCircle,
  ExternalLink,
  User,
  Eye,
  EyeOff,
  RefreshCw,
  Share2,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LandingPageProps {
  members: Member[];
  customFields?: CustomFieldDefinition[];
  adminAccounts: AdminAccount[];
  onLogin: (session: UserSession, rememberMe?: boolean) => void;
  onOpenPublicVerify: (member: Member) => void;
  onOpenQrScanner: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  members = [],
  customFields = [],
  adminAccounts = [],
  onLogin,
  onOpenPublicVerify,
  onOpenQrScanner,
}) => {
  // Search verification state
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedMember, setVerifiedMember] = useState<Member | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchingCloud, setIsSearchingCloud] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Admin login modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Handle Search Verification across local memory AND remote cloud sync
  const handleVerifySearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchError(null);
    setVerifiedMember(null);

    const q = searchQuery.trim();
    if (!q) {
      setSearchError('Please enter a Mobile Number (e.g. 050 482 9134), Membership ID (e.g. KCA-FU-1001), or Emirates ID.');
      return;
    }

    // 1. Try local memory search first
    const foundLocal = findMemberByQuery(q, members);
    if (foundLocal) {
      setVerifiedMember(foundLocal);
      confetti({ particleCount: 35, spread: 60 });
      return;
    }

    // 2. Query live cloud server via direct verification API endpoint & sync state
    setIsSearchingCloud(true);
    try {
      // Try direct verify endpoint
      const directRes = await fetch(`/api/members/verify/${encodeURIComponent(q)}`);
      if (directRes.ok) {
        const directData = await directRes.json();
        if (directData.success && directData.member) {
          setVerifiedMember(directData.member);
          confetti({ particleCount: 35, spread: 60 });
          setIsSearchingCloud(false);
          return;
        }
      }

      // Fallback to full sync state
      const res = await fetch('/api/sync/state');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.members)) {
          const foundRemote = findMemberByQuery(q, data.members);
          if (foundRemote) {
            setVerifiedMember(foundRemote);
            confetti({ particleCount: 35, spread: 60 });
            setIsSearchingCloud(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Remote search error:', err);
    } finally {
      setIsSearchingCloud(false);
    }

    setSearchError(`No member record found for "${q}". Please check the mobile number or membership ID and try again.`);
  };

  // Handle ID Card Download (PNG)
  const handleDownloadCard = async (memberToDownload: Member) => {
    setIsExportingPng(true);
    try {
      await downloadMemberIdCardPng(memberToDownload, customFields);
      confetti({ particleCount: 45, spread: 70 });
    } catch (err: any) {
      console.error('Error exporting card:', err);
      alert('Could not download card image. Please open full verification to print.');
    } finally {
      setIsExportingPng(false);
    }
  };

  // Handle Copy Verification Link
  const handleCopyLink = (memberToShare: Member) => {
    const url = getMemberVerifyUrl(memberToShare);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Handle Staff Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    const u = usernameInput.trim().toLowerCase();
    const p = passwordInput.trim();

    if (!u || !p) {
      setLoginError('Please enter username and password.');
      setIsLoggingIn(false);
      return;
    }

    const matched = adminAccounts.find(
      (acc) =>
        (acc.username.toLowerCase() === u || acc.email.toLowerCase() === u) &&
        acc.status !== 'Inactive'
    );

    if (matched) {
      if (matched.password !== p) {
        setLoginError('Invalid username or password.');
        setIsLoggingIn(false);
        return;
      }
      const session: UserSession = {
        id: matched.id,
        username: matched.username,
        fullName: matched.fullName,
        role: matched.role,
        unit: matched.unit,
        email: matched.email,
        isLoggedIn: true,
      };
      setIsLoggingIn(false);
      setShowLoginModal(false);
      onLogin(session, rememberMe);
      return;
    }

    // Default fallback credentials
    if (u === 'admin' && p === '12345') {
      const session: UserSession = {
        id: 'admin-001',
        username: 'admin',
        fullName: 'Central Committee Administrator',
        role: 'Super Admin',
        unit: 'Fujairah',
        email: 'admin@kca-fujairah.ae',
        isLoggedIn: true,
      };
      setIsLoggingIn(false);
      setShowLoginModal(false);
      onLogin(session, rememberMe);
    } else {
      setLoginError('Invalid credentials. Please check your username and password.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-[#8b0000] selection:text-white">
      {/* 1. TOP BAR: LOGO & KAIRALI HEADER ONLY */}
      <header className="sticky top-0 z-40 bg-[#8b0000] border-b border-[#730000] text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Official Brand Logo & Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white p-1 shadow-md flex items-center justify-center shrink-0 border border-white/40">
              <KcaLogo size={38} />
            </div>
            <div>
              <span className="font-display font-black text-base sm:text-lg tracking-tight text-white uppercase leading-tight block">
                KAIRALI CULTURAL ASSOCIATION FUJAIRAH
              </span>
            </div>
          </div>

          {/* Staff Sign In Action */}
          <button
            onClick={() => setShowLoginModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer whitespace-nowrap"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Staff Sign In</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN BODY: VERIFICATION & DIGITAL ID SEARCH CARD */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-14">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          {/* Header Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-900/60 border border-red-700/50 text-amber-300 text-xs font-bold tracking-wide">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>Official Central Registry &amp; Digital Card Verification</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
              Member Verification &amp; Digital ID
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Enter your registered UAE Mobile Number, Membership ID, or Emirates ID to verify status and download your card.
            </p>
          </div>

          {/* Search Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-4">
            <form onSubmit={handleVerifySearch} className="space-y-3.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Search by Mobile Number or Member ID:
              </label>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchError(null);
                    }}
                    placeholder="e.g. 050 482 9134 or KCA-FU-1001"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder:text-slate-400 placeholder:font-normal focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none shadow-inner"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSearchingCloud}
                    className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    {isSearchingCloud ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Verify Member</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onOpenQrScanner}
                    title="Scan Physical QR Code"
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-amber-300" />
                  </button>
                </div>
              </div>

              {searchError && (
                <div className="p-3 bg-rose-950/80 border border-rose-600/50 rounded-xl text-rose-200 text-xs flex items-start gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{searchError}</span>
                </div>
              )}
            </form>

            {/* Verified Member Result Display */}
            {verifiedMember && (
              <div className="mt-6 pt-6 border-t border-slate-800 space-y-4 animate-fadeIn">
                {(() => {
                  const exp = getExpiryStatus(verifiedMember.expiryDate);
                  const isAct = verifiedMember.status === 'Active' && !exp.isExpired;
                  return (
                    <div
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isAct
                          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-100'
                          : 'bg-amber-950/60 border-amber-500/40 text-amber-100'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                            isAct
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                isAct ? 'bg-emerald-500 text-emerald-950' : 'bg-amber-500 text-amber-950'
                              }`}
                            >
                              {isAct ? 'Official Verified Member' : 'Renewal Due'}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-300">
                              {verifiedMember.membershipId}
                            </span>
                          </div>
                          <div className="text-base font-bold text-white mt-0.5">
                            {verifiedMember.fullName}
                          </div>
                          <div className="text-xs text-slate-300 flex items-center gap-3 flex-wrap mt-0.5">
                            <span>Unit: <strong>{verifiedMember.unit}</strong></span>
                            <span>Mobile: <strong>{verifiedMember.phoneUAE}</strong></span>
                            <span>Valid Till: <strong>{formatCardDate(verifiedMember.expiryDate)}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleDownloadCard(verifiedMember)}
                          disabled={isExportingPng}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isExportingPng ? 'Saving...' : 'Download Card'}</span>
                        </button>

                        <button
                          onClick={() => onOpenPublicVerify(verifiedMember)}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                          <span>Full ID Card</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Inline Front ID Card Preview */}
                <div className="flex flex-col items-center justify-center pt-2">
                  <div className="p-2 sm:p-4 bg-slate-950 rounded-xl border border-slate-800 shadow-xl max-w-full overflow-x-auto">
                    <IdCard member={verifiedMember} customFields={customFields} side="front" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 3. MINIMAL CLEAN FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-800 py-6 px-4 sm:px-6 text-xs text-slate-400">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <KcaLogo size={20} />
            <span>KAIRALI CULTURAL ASSOCIATION FUJAIRAH</span>
          </div>

          <div className="text-slate-400 text-[11px]">
            &copy; {new Date().getFullYear()} KCA Fujairah. All Rights Reserved.
          </div>
        </div>
      </footer>

      {/* 4. SECURE STAFF LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden my-auto animate-fadeIn">
            <div className="bg-[#8b0000] p-6 text-white text-center relative border-b border-[#730000]">
              <div className="w-14 h-14 mx-auto mb-2.5 bg-white p-1 rounded-full shadow-md flex items-center justify-center">
                <KcaLogo size={46} />
              </div>
              <h2 className="font-display font-black text-base tracking-tight uppercase text-white">
                Staff &amp; Committee Sign In
              </h2>
              <p className="text-xs text-red-100 mt-0.5">
                KCA Fujairah Centralized Management System
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
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
                      setLoginError(null);
                    }}
                    placeholder="e.g. admin or operator_fu"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setLoginError(null);
                    }}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

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

              {loginError && (
                <div className="text-xs text-rose-800 bg-rose-50 p-3 rounded-lg border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="flex-2 py-2.5 rounded-lg bg-[#8b0000] hover:bg-[#730000] text-white text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In to Portal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
