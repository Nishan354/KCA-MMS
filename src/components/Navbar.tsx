import React, { useState, useEffect } from 'react';
import { KcaLogo } from './Logo';
import { getIsDarkMode, toggleDarkMode as toggleGlobalDarkMode } from '../utils/theme';
import {
  UserSession,
  hasAdminPrivilege,
  isUnitOperatorRole,
  isSuperAdminOrAdmin,
} from '../types/member';
import {
  Users,
  LayoutDashboard,
  IdCard,
  HeartPulse,
  HardDrive,
  QrCode,
  UserPlus,
  LogOut,
  Shield,
  Sparkles,
  Building2,
  Mail,
  Send,
  KeyRound,
  FileText,
  Palette,
  Wallet,
  Boxes,
  GraduationCap,
  ChevronDown,
  Menu,
  X,
  MapPin,
  Award,
  Contact,
  Sun,
  Moon,
  Cloud,
  FolderOpen,
  FolderSync,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import { OFFICIAL_AFFILIATION } from '../config/constants';
import { downloadSystemDocumentationPdf } from '../utils/systemDocumentationPdfGenerator';

export type NavTab =
  | 'dashboard'
  | 'members'
  | 'ladies_wing'
  | 'contacts'
  | 'documents'
  | 'letters'
  | 'idcards'
  | 'finance'
  | 'inventory'
  | 'classes'
  | 'blood'
  | 'backup'
  | 'verify';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenNewMember: () => void;
  onOpenAdminManager: () => void;
  onOpenUnitManager?: () => void;
  onOpenLogoManager?: () => void;
  onOpenCertificateGenerator?: () => void;
  onOpenBackupSettings?: () => void;
  onOpenThemeSelector?: () => void;
  onOpenMailbox?: () => void;
  onOpenWhatsApp?: () => void;
  onOpenChangePassword?: () => void;
  onOpenReportGenerator?: () => void;
  userSession: UserSession;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewMember,
  onOpenAdminManager,
  onOpenUnitManager,
  onOpenLogoManager,
  onOpenCertificateGenerator,
  onOpenBackupSettings,
  onOpenThemeSelector,
  onOpenMailbox,
  onOpenWhatsApp,
  onOpenChangePassword,
  onOpenReportGenerator,
  userSession,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => getIsDarkMode());

  const isAdmin = hasAdminPrivilege(userSession.role);
  const isStorageAdmin = isSuperAdminOrAdmin(userSession.role);
  const isUnitOp = isUnitOperatorRole(userSession.role);

  // Sync dark mode state with system and global events
  useEffect(() => {
    const handleStorageChange = () => {
      setIsDarkMode(getIsDarkMode());
    };

    window.addEventListener('kca-darkmode-changed', handleStorageChange as EventListener);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('kca-darkmode-changed', handleStorageChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const toggleDarkMode = () => {
    const nextMode = toggleGlobalDarkMode();
    setIsDarkMode(nextMode);
  };

  // Nav Groups for Vertical Layout
  const coreNavItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'ladies_wing', label: 'Ladies Wing', icon: Sparkles },
  ];

  const operationsNavItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'contacts', label: 'Contact Bank', icon: Contact },
    { id: 'documents', label: 'General Document', icon: FolderOpen },
    { id: 'finance', label: 'Finance Ledger', icon: Wallet },
    { id: 'inventory', label: 'Asset Inventory', icon: Boxes },
    { id: 'classes', label: 'Cultural Classes', icon: GraduationCap },
    { id: 'blood', label: 'Blood Donors', icon: HeartPulse },
  ];

  const servicesNavItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'letters', label: 'Letter Pad', icon: FileText },
    { id: 'idcards', label: 'ID Cards', icon: IdCard },
    { id: 'verify', label: 'Card Verification', icon: QrCode },
  ];

  const renderNavButton = (item: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => {
          onSelectTab(item.id);
          setMobileMenuOpen(false);
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group text-left ${
          isActive
            ? 'text-white shadow-xs font-bold'
            : 'text-slate-300 hover:text-white hover:bg-white/10'
        }`}
        style={isActive ? { backgroundColor: 'var(--color-primary, #881337)' } : undefined}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
          <span>{item.label}</span>
        </div>
        {isActive && (
          <ChevronRight className="w-3.5 h-3.5 text-white/80" />
        )}
      </button>
    );
  };

  const verticalSidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Top Brand Identity */}
      <div
        className="p-5 border-b border-white/10 flex flex-col gap-3 cursor-pointer"
        onClick={() => {
          onSelectTab('dashboard');
          setMobileMenuOpen(false);
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white p-1 shadow-md border border-white/40 flex items-center justify-center shrink-0">
            <KcaLogo size={36} />
          </div>
          <div className="min-w-0">
            <div className="font-display font-black text-sm tracking-tight text-white uppercase leading-tight">
              KCA FUJAIRAH
            </div>
            <div className="text-[10px] text-red-200 font-medium tracking-wide truncate mt-0.5">
              {OFFICIAL_AFFILIATION}
            </div>
          </div>
        </div>

        {/* User Scope / Role Tag */}
        <div className="flex items-center justify-between bg-black/25 px-3 py-1.5 rounded-lg border border-white/10 text-[11px]">
          <span className="text-slate-300 font-medium truncate">
            {isUnitOp && userSession.unit ? `${userSession.unit} Unit` : 'Central Portal'}
          </span>
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-300/30">
            {userSession.role.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="p-4 pb-2">
        <button
          onClick={() => {
            onOpenNewMember();
            setMobileMenuOpen(false);
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-md hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
          style={{ color: 'var(--color-primary, #881337)' }}
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Register Member</span>
        </button>
      </div>

      {/* Scrollable Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 custom-scrollbar">
        {/* Core Group */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/80">
            Core Modules
          </div>
          {coreNavItems.map(renderNavButton)}
        </div>

        {/* Operations Group */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/80">
            Operations &amp; Ledgers
          </div>
          {operationsNavItems.map(renderNavButton)}
        </div>

        {/* Services & Tools Group */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/80">
            Services &amp; Tools
          </div>
          {servicesNavItems.map(renderNavButton)}

          {onOpenCertificateGenerator && (
            <button
              onClick={() => {
                onOpenCertificateGenerator();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Certificates Studio</span>
            </button>
          )}

          {onOpenReportGenerator && (
            <button
              onClick={() => {
                onOpenReportGenerator();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Executive Reports</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Footer & Account Controls */}
      <div className="p-3 border-t border-white/10 bg-black/20 space-y-2">
        {/* Quick Tools Accordion / Popover Button */}
        <div className="relative">
          <button
            onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>System Utilities</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform ${toolsDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {toolsDropdownOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 py-2 z-50 text-slate-200 animate-fadeIn divide-y divide-slate-800">
              {/* Storage & Sync */}
              <div className="py-1">
                <button
                  onClick={() => {
                    if (onOpenBackupSettings) onOpenBackupSettings();
                    else onSelectTab('backup');
                    setToolsDropdownOpen(false);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs hover:bg-white/10 text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <HardDrive className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Backup &amp; Restore</span>
                </button>

                <button
                  onClick={() => {
                    if (onOpenBackupSettings) onOpenBackupSettings();
                    else onSelectTab('backup');
                    setToolsDropdownOpen(false);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs hover:bg-white/10 text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cloud Sync Engine</span>
                </button>

                <button
                  onClick={() => {
                    downloadSystemDocumentationPdf(userSession?.fullName || 'KCA Executive Administration');
                    setToolsDropdownOpen(false);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs hover:bg-white/10 text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-rose-300 shrink-0" />
                  <span>System Manual (PDF)</span>
                </button>
              </div>

              {/* Admin Tools */}
              <div className="py-1">
                {isAdmin && onOpenUnitManager && (
                  <button
                    onClick={() => {
                      onOpenUnitManager();
                      setToolsDropdownOpen(false);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-white/10 text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Units Management</span>
                  </button>
                )}

                {isAdmin && onOpenLogoManager && (
                  <button
                    onClick={() => {
                      onOpenLogoManager();
                      setToolsDropdownOpen(false);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-white/10 text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Logo &amp; Seal Branding</span>
                  </button>
                )}

                {onOpenWhatsApp && (
                  <button
                    onClick={() => {
                      onOpenWhatsApp();
                      setToolsDropdownOpen(false);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-white/10 text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>WhatsApp Messenger</span>
                  </button>
                )}

                {onOpenMailbox && (
                  <button
                    onClick={() => {
                      onOpenMailbox();
                      setToolsDropdownOpen(false);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-white/10 text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Official Mailbox</span>
                  </button>
                )}

                {isAdmin && onOpenThemeSelector && (
                  <button
                    onClick={() => {
                      onOpenThemeSelector();
                      setToolsDropdownOpen(false);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-white/10 text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Palette className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Theme Palette</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card & Action Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="min-w-0 pr-2">
            <div className="text-xs font-bold text-white truncate">
              {userSession.fullName}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {userSession.username}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-rose-200" />}
            </button>

            {/* Admin Manager */}
            {isAdmin && (
              <button
                onClick={onOpenAdminManager}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Manage Admin Accounts"
              >
                <Shield className="w-3.5 h-3.5 text-amber-300" />
              </button>
            )}

            {/* Password */}
            {onOpenChangePassword && (
              <button
                onClick={onOpenChangePassword}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Change Password"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-300" />
              </button>
            )}

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-200 hover:text-white transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Vertical Left-Side Navigation Panel */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 h-screen sticky top-0 bg-slate-900 text-white border-r border-slate-800 shrink-0 z-30 shadow-xl">
        {verticalSidebarContent}
      </aside>

      {/* Mobile Top Header */}
      <header
        className="lg:hidden sticky top-0 z-40 text-white select-none border-b border-black/20 shadow-sm backdrop-blur-md px-4 h-14 flex items-center justify-between"
        style={{ backgroundColor: 'var(--color-primary, #881337)' }}
      >
        <div
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-white p-0.5 shadow-sm flex items-center justify-center">
            <KcaLogo size={28} />
          </div>
          <div>
            <div className="font-display font-black text-xs text-white uppercase tracking-tight">
              KCA FUJAIRAH
            </div>
            <div className="text-[9px] text-red-200 truncate font-medium">
              {OFFICIAL_AFFILIATION}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-1.5 rounded-lg bg-white/10 text-white cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-rose-200" />}
          </button>

          <button
            onClick={() => onOpenNewMember()}
            className="p-1.5 rounded-lg bg-white text-slate-900 cursor-pointer shadow-2xs"
            style={{ color: 'var(--color-primary, #881337)' }}
            title="Add Member"
          >
            <UserPlus className="w-4 h-4" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Off-Canvas Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-4/5 max-w-xs h-full bg-slate-900 shadow-2xl z-10 flex flex-col animate-slideRight">
            <div className="absolute top-3 right-3 z-20">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {verticalSidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
