import React, { useState, useEffect, useRef } from 'react';
import { Member, CustomFieldDefinition, AdminAccount, UserSession } from '../types/member';
import { KcaLogo } from './Logo';
import { IdCard } from './IdCard';
import { findMemberByQuery } from '../utils/memberLookup';
import { formatCardDate, getExpiryStatus, getMemberVerifyUrl } from '../utils/idGenerator';
import { downloadMemberIdCardPng } from '../utils/cardExporter';
import { getIsDarkMode, toggleDarkMode } from '../utils/theme';
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
  Maximize2,
  Minimize2,
  Key,
  Users,
  Award,
  BookOpen,
  DollarSign,
  Package,
  HeartPulse,
  ArrowRight,
  Clock,
  Sun,
  Moon,
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

  // Staff login state
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Desktop Station Clock, Fullscreen & Dark Mode State
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => getIsDarkMode());
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Live Desktop Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString([], {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync Dark Mode state changes
  useEffect(() => {
    const handleDarkChange = () => {
      setIsDarkMode(getIsDarkMode());
    };
    window.addEventListener('kca-darkmode-changed', handleDarkChange);
    window.addEventListener('storage', handleDarkChange);
    return () => {
      window.removeEventListener('kca-darkmode-changed', handleDarkChange);
      window.removeEventListener('storage', handleDarkChange);
    };
  }, []);

  // Keyboard shortcut listener (Alt+S for scanner, Alt+F for fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        onOpenQrScanner();
      } else if (e.altKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenQrScanner]);

  // Fullscreen toggle for PC station / Kiosk
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const handleToggleTheme = () => {
    const next = toggleDarkMode();
    setIsDarkMode(next);
  };

  // Handle Search Verification across memory and server
  const handleVerifySearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchError(null);
    setVerifiedMember(null);

    const q = searchQuery.trim();
    if (!q) {
      setSearchError(
        'Please enter a UAE Mobile Number (e.g. 050 482 9134), Membership ID (e.g. KCA-FU-1001), or Emirates ID.'
      );
      return;
    }

    // 1. Try instant cache first
    const foundLocal = findMemberByQuery(q, members);
    if (foundLocal) {
      setVerifiedMember(foundLocal);
      confetti({ particleCount: 35, spread: 60 });
      return;
    }

    // 2. Query server as fallback
    setIsSearchingCloud(true);
    try {
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
      console.warn('Network lookup notice:', err);
    } finally {
      setIsSearchingCloud(false);
    }

    setSearchError(
      `No member record found for "${q}". Please check the mobile number, membership ID, or Emirates ID and try again.`
    );
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
      onLogin(session, rememberMe);
      return;
    }

    // Default fallback administrator credentials
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
      onLogin(session, rememberMe);
    } else {
      setLoginError('Invalid credentials. Please check your username and password.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans selection:bg-[#881337] selection:text-white transition-colors duration-200">
      {/* 1. APP HEADER */}
      <header
        className="sticky top-0 z-40 text-white shadow-lg border-b border-black/20"
        style={{ backgroundColor: 'var(--color-primary, #881337)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white p-1 shadow-md flex items-center justify-center shrink-0 border border-white/30">
              <KcaLogo size={38} />
            </div>
            <div>
              <span className="font-display font-black text-sm sm:text-base tracking-tight text-white uppercase leading-tight block">
                KAIRALI CULTURAL ASSOCIATION FUJAIRAH
              </span>
              <p className="text-[11px] text-rose-100/90 font-medium">
                Centralized Organization Management &amp; Digital Registry System
              </p>
            </div>
          </div>

          {/* Header Utilities: Live Clock, Dark/Light Mode, Fullscreen */}
          <div className="flex items-center gap-2.5">
            {/* Real-time Workstation Clock */}
            <div className="hidden sm:flex flex-col items-end px-3 py-1 bg-black/20 rounded-lg border border-white/15 text-right">
              <div className="font-mono text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>{currentTime || '00:00:00'}</span>
              </div>
              <span className="text-[9.5px] text-rose-100 font-medium">{currentDate}</span>
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={handleToggleTheme}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/15 shadow-xs"
              aria-label="Toggle Dark and Light Mode"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-300" />
              ) : (
                <Moon className="w-4 h-4 text-slate-100" />
              )}
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (F11)'}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/15 shadow-xs"
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN LAUNCHING INTERFACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 lg:py-8 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* LEFT PANEL (Col 7): MEMBER VERIFICATION & ID TERMINAL */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-5 sm:p-7 space-y-5 transition-colors">
            <div className="space-y-3">
              {/* Header Badge */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800/60 text-[#881337] dark:text-amber-300 text-xs font-bold tracking-wide">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Public &amp; Reception Lookup Terminal</span>
                </div>
              </div>

              <div>
                <h1 className="font-display font-black text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
                  Member Verification &amp; Digital ID
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Search member credentials by UAE Mobile Number, Membership ID, or Emirates ID.
                </p>
              </div>

              {/* Search Bar with Barcode Scanner Integration */}
              <form onSubmit={handleVerifySearch} className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSearchError(null);
                      }}
                      placeholder="Enter Mobile (e.g. 050 482 9134) or ID (e.g. KCA-FU-1001)"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none shadow-inner"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isSearchingCloud}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      {isSearchingCloud ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Searching...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5" />
                          <span>Search Registry</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={onOpenQrScanner}
                      title="Scan Physical QR Code (Alt + S)"
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <QrCode className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                      <span className="hidden sm:inline">Scan QR</span>
                    </button>
                  </div>
                </div>

                {searchError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-600/50 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span>{searchError}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Verification Result Display */}
            {verifiedMember ? (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-fadeIn">
                {(() => {
                  const exp = getExpiryStatus(verifiedMember.expiryDate);
                  const isAct = verifiedMember.status === 'Active' && !exp.isExpired;
                  return (
                    <div
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isAct
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-100'
                          : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-500/40 text-amber-900 dark:text-amber-100'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                            isAct
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          }`}
                        >
                          <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                isAct
                                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950'
                                  : 'bg-amber-600 text-white dark:bg-amber-500 dark:text-amber-950'
                              }`}
                            >
                              {isAct ? 'Official Verified Member' : 'Renewal Due'}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                              {verifiedMember.membershipId}
                            </span>
                          </div>
                          <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                            {verifiedMember.fullName}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-3 flex-wrap mt-0.5">
                            <span>
                              Unit: <strong>{verifiedMember.unit}</strong>
                            </span>
                            <span>
                              Mobile: <strong>{verifiedMember.phoneUAE}</strong>
                            </span>
                            <span>
                              Valid Till:{' '}
                              <strong>{formatCardDate(verifiedMember.expiryDate)}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleDownloadCard(verifiedMember)}
                          disabled={isExportingPng}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isExportingPng ? 'Saving...' : 'Download Card'}</span>
                        </button>

                        <button
                          onClick={() => onOpenPublicVerify(verifiedMember)}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
                          <span>Full ID Card</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Inline Front ID Card Preview */}
                <div className="flex flex-col items-center justify-center pt-1">
                  <div className="p-2 sm:p-3 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg max-w-full overflow-x-auto">
                    <IdCard member={verifiedMember} customFields={customFields} side="front" />
                  </div>
                </div>
              </div>
            ) : (
              /* Organization Modules Overview */
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Comprehensive Organization Modules
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-[11px]">Member Registry</div>
                      <div className="text-[9.5px] text-slate-500 dark:text-slate-400">5 Unit Portals</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2.5">
                    <Award className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-[11px]">Certificate Studio</div>
                      <div className="text-[9.5px] text-slate-500 dark:text-slate-400">8 Themes &amp; Seals</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2.5">
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-[11px]">Ledgers &amp; Accounts</div>
                      <div className="text-[9.5px] text-slate-500 dark:text-slate-400">Multi-Unit Vouchers</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-[11px]">Cultural Classes</div>
                      <div className="text-[9.5px] text-slate-500 dark:text-slate-400">Attendance &amp; Fees</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-[11px]">Asset Inventory</div>
                      <div className="text-[9.5px] text-slate-500 dark:text-slate-400">Issue &amp; Return Logs</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2.5">
                    <HeartPulse className="w-4 h-4 text-rose-500 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-[11px]">Blood Donors</div>
                      <div className="text-[9.5px] text-slate-500 dark:text-slate-400">Emergency Bank</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL (Col 5): STAFF & EXECUTIVE SIGN-IN CONSOLE */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-5 sm:p-7 space-y-5 transition-colors">
            <div>
              {/* Header Box */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-[#881337] flex items-center justify-center text-white shadow-md">
                  <Lock className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="font-display font-black text-base text-slate-900 dark:text-white tracking-tight uppercase">
                    Staff &amp; Executive Console
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Secure Role-Based Portal Access
                  </p>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5 mt-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Username or Registered Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      value={usernameInput}
                      onChange={(e) => {
                        setUsernameInput(e.target.value);
                        setLoginError(null);
                      }}
                      placeholder="Enter username or email"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#881337] focus:border-rose-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
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
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#881337] focus:border-rose-500 outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-[#881337] focus:ring-0"
                    />
                    <span>Remember on this computer</span>
                  </label>
                </div>

                {loginError && (
                  <div className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 p-2.5 rounded-xl border border-rose-200 dark:border-rose-700/60 flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#881337] hover:bg-[#700f2b] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99] mt-2"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>Launch Management Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Security & Access Protection Notice */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Official Staff &amp; Committee Access
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Authorized credentials required for ledger modification and administrative operations.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. FOOTER WITH DEVELOPER COPYRIGHT */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-3.5 px-4 sm:px-6 text-xs text-slate-600 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-300 font-semibold">
            <KcaLogo size={20} />
            <span className="text-xs">KAIRALI CULTURAL ASSOCIATION FUJAIRAH</span>
            <span className="text-slate-400 dark:text-slate-600 hidden sm:inline">•</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
              Fujairah, Kalba, Khorfakhan, Dibba, Central
            </span>
          </div>

          <div className="flex items-center flex-wrap justify-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
              App Developed by : Nishan &copy;
            </span>
            <span>&copy; {new Date().getFullYear()} KCA Fujairah. All Rights Reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
