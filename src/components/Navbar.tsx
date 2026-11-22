import React, { useState, useEffect, useMemo } from 'react';
import { KcaLogo } from './Logo';
import {
  UserSession,
  hasAdminPrivilege,
  isUnitOperatorRole,
} from '../types/member';
import { loadSavedTheme } from '../utils/theme';
import { ThemePreset } from '../types/theme';
import { usePortalConfig } from '../hooks/usePortalConfig';
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
  FolderOpen,
  GitBranch,
  Search,
  Wrench,
  ExternalLink,
} from 'lucide-react';
import { OFFICIAL_AFFILIATION } from '../config/constants';
import { downloadSystemDocumentationPdf } from '../utils/systemDocumentationPdfGenerator';
import { SystemUtilitiesModal } from './SystemUtilitiesModal';

export type NavTab =
  | 'dashboard'
  | 'members'
  | 'coordination_committee'
  | 'ladies_wing'
  | 'students_wing'
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
  onOpenSystemManual?: () => void;
  onOpenSystemUtilities?: () => void;
  userSession: UserSession;
  onLogout: () => void;
}

interface NavItemDef {
  id: NavTab;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
}

interface UtilityItemDef {
  id: string;
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  action: () => void;
  adminOnly?: boolean;
  color: string;
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
  onOpenSystemManual,
  onOpenSystemUtilities,
  userSession,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUtilitiesModal, setShowUtilitiesModal] = useState(false);
  const [theme, setTheme] = useState<ThemePreset>(() => loadSavedTheme());
  const { portalConfig, unitTerm } = usePortalConfig();

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      if (e?.detail) {
        setTheme(e.detail);
      } else {
        setTheme(loadSavedTheme());
      }
    };
    window.addEventListener('kca-theme-changed', handleThemeChange);
    return () => window.removeEventListener('kca-theme-changed', handleThemeChange);
  }, []);

  const isAdmin = hasAdminPrivilege(userSession.role);
  const isUnitOp = isUnitOperatorRole(userSession.role);

  const handleOpenUtilitiesHub = () => {
    if (onOpenSystemUtilities) {
      onOpenSystemUtilities();
    } else {
      setShowUtilitiesModal(true);
    }
  };

  // Group 1: Core Community & Governance Modules
  const coreNavItems: NavItemDef[] = useMemo(
    () => [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'members', label: 'Members Directory', icon: Users },
      { id: 'coordination_committee', label: 'Coordination Committee', icon: GitBranch },
      { id: 'ladies_wing', label: 'Ladies Wing', icon: Sparkles },
      { id: 'students_wing', label: "Children's Wing", icon: Sparkles },
    ],
    []
  );

  // Group 2: Operations, Registers & Services
  const operationsNavItems: NavItemDef[] = useMemo(
    () => [
      { id: 'finance', label: 'Finance Ledger', icon: Wallet },
      { id: 'inventory', label: 'Asset Inventory', icon: Boxes },
      { id: 'classes', label: 'Cultural Classes', icon: GraduationCap },
      { id: 'blood', label: 'Blood Bank', icon: HeartPulse },
      { id: 'idcards', label: 'ID Cards Studio', icon: IdCard },
      { id: 'letters', label: 'Letter Pad', icon: FileText },
      { id: 'documents', label: 'General Documents', icon: FolderOpen },
      { id: 'contacts', label: 'Contact Bank', icon: Contact },
      { id: 'verify', label: 'Card Verification', icon: QrCode },
      { id: 'backup', label: 'Cloud & Backup', icon: HardDrive },
    ],
    []
  );

  // System Utilities List
  const utilityNavItems: UtilityItemDef[] = useMemo(
    () => [
      {
        id: 'cert',
        label: 'Certificates Studio',
        description: 'Issue Kalolsavam & cultural appreciation certificates',
        icon: Award,
        color: 'text-amber-400',
        action: () => {
          onOpenCertificateGenerator?.();
          setMobileMenuOpen(false);
        },
      },
      {
        id: 'reports',
        label: 'Executive Reports',
        description: 'Generate membership demographic & statistical reports',
        icon: FileText,
        color: 'text-rose-400',
        action: () => {
          onOpenReportGenerator?.();
          setMobileMenuOpen(false);
        },
      },
      {
        id: 'whatsapp',
        label: 'WhatsApp Messenger',
        description: 'Central broadcast & direct WhatsApp messaging',
        icon: Send,
        color: 'text-emerald-400',
        action: () => {
          onOpenWhatsApp?.();
          setMobileMenuOpen(false);
        },
      },
      {
        id: 'mailbox',
        label: 'Official Mailbox',
        description: 'Official correspondence dispatch and records',
        icon: Mail,
        color: 'text-sky-400',
        action: () => {
          onOpenMailbox?.();
          setMobileMenuOpen(false);
        },
      },
      ...(isAdmin
        ? [
            {
              id: 'units',
              label: 'Units Management',
              description: 'Manage Fujairah, Kalba, Khorfakkan & Dibba units',
              icon: MapPin,
              color: 'text-amber-300',
              adminOnly: true,
              action: () => {
                onOpenUnitManager?.();
                setMobileMenuOpen(false);
              },
            },
            {
              id: 'logo',
              label: 'Logo & Branding',
              description: 'Upload custom association crest and logo',
              icon: Building2,
              color: 'text-indigo-400',
              adminOnly: true,
              action: () => {
                onOpenLogoManager?.();
                setMobileMenuOpen(false);
              },
            },
            {
              id: 'theme',
              label: 'Theme Palette',
              description: 'Customize solid header and accent themes',
              icon: Palette,
              color: 'text-purple-300',
              adminOnly: true,
              action: () => {
                onOpenThemeSelector?.();
                setMobileMenuOpen(false);
              },
            },
            {
              id: 'admins',
              label: 'Admin Accounts',
              description: 'Manage administrator accounts, roles & staff access',
              icon: Shield,
              color: 'text-blue-400',
              adminOnly: true,
              action: () => {
                onOpenAdminManager();
                setMobileMenuOpen(false);
              },
            },
          ]
        : []),
      {
        id: 'manual',
        label: 'System Manual & Setup',
        description: 'Handbook & Windows PC setup guides',
        icon: FileText,
        color: 'text-teal-400',
        action: () => {
          onOpenSystemManual?.();
          setMobileMenuOpen(false);
        },
      },
      {
        id: 'manual_pdf',
        label: 'Download Manual (PDF)',
        description: 'Printable system manual document',
        icon: ExternalLink,
        color: 'text-slate-400',
        action: () => {
          downloadSystemDocumentationPdf(userSession?.fullName || 'KCA Executive Administration');
          setMobileMenuOpen(false);
        },
      },
    ],
    [
      isAdmin,
      onOpenCertificateGenerator,
      onOpenReportGenerator,
      onOpenWhatsApp,
      onOpenMailbox,
      onOpenUnitManager,
      onOpenLogoManager,
      onOpenThemeSelector,
      onOpenAdminManager,
      onOpenSystemManual,
      userSession,
    ]
  );

  // Filter items if searching
  const filteredCore = useMemo(() => {
    if (!searchQuery.trim()) return coreNavItems;
    const q = searchQuery.toLowerCase();
    return coreNavItems.filter((i) => i.label.toLowerCase().includes(q));
  }, [coreNavItems, searchQuery]);

  const filteredOps = useMemo(() => {
    if (!searchQuery.trim()) return operationsNavItems;
    const q = searchQuery.toLowerCase();
    return operationsNavItems.filter((i) => i.label.toLowerCase().includes(q));
  }, [operationsNavItems, searchQuery]);

  const filteredUtilities = useMemo(() => {
    if (!searchQuery.trim()) return utilityNavItems;
    const q = searchQuery.toLowerCase();
    return utilityNavItems.filter(
      (i) => i.label.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
    );
  }, [utilityNavItems, searchQuery]);

  const renderNavButton = (item: NavItemDef) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => {
          onSelectTab(item.id);
          setMobileMenuOpen(false);
        }}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer text-left ${
          isActive
            ? 'text-white font-bold shadow-xs'
            : 'text-slate-300 hover:text-white hover:bg-white/8'
        }`}
        style={
          isActive
            ? {
                backgroundColor: theme.primary,
              }
            : undefined
        }
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            className={`w-4 h-4 shrink-0 transition-transform ${
              isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
            }`}
          />
          <span className="truncate">{item.label}</span>
        </div>
        {item.badge && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/15 text-white/90">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  const verticalSidebarContent = (
    <div className="flex flex-col h-full select-none text-slate-100 bg-[#0f172a]">
      {/* 1. Clean Top Brand Header */}
      <div
        className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/3 transition-colors"
        onClick={() => {
          onSelectTab('dashboard');
          setMobileMenuOpen(false);
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/10 p-1 border border-white/15 flex items-center justify-center shrink-0 shadow-xs">
            <KcaLogo size={32} />
          </div>
          <div className="min-w-0">
            <div className="font-display font-black text-sm tracking-tight text-white uppercase leading-none truncate max-w-[150px]">
              {portalConfig.shortName || portalConfig.portalName}
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wide truncate mt-1 max-w-[150px]">
              {portalConfig.subtitle || 'Membership Portal'}
            </div>
          </div>
        </div>

        {/* Scope Tag */}
        <span
          className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-white shrink-0 border border-white/15"
          style={{ backgroundColor: theme.primary }}
          title={userSession.role}
        >
          {isUnitOp && userSession.unit ? userSession.unit : userSession.role.replace('_', ' ')}
        </span>
      </div>

      {/* 2. Primary Action Button */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={() => {
            onOpenNewMember();
            setMobileMenuOpen(false);
          }}
          style={{ backgroundColor: theme.primary }}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-98 hover:brightness-110 border border-white/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Register Member</span>
        </button>
      </div>

      {/* 3. Fast Module Search Bar */}
      <div className="px-3 py-1">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search modules & tools..."
            className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-slate-700 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Scrollable Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 custom-scrollbar">
        {/* Core Modules */}
        {filteredCore.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Core Modules
            </div>
            {filteredCore.map(renderNavButton)}
          </div>
        )}

        {/* Operations & Records */}
        {filteredOps.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Operations &amp; Ledgers
            </div>
            {filteredOps.map(renderNavButton)}
          </div>
        )}

        {/* Search Results for System Utilities */}
        {searchQuery && filteredUtilities.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-amber-400">
              System Utilities &amp; Tools ({filteredUtilities.length})
            </div>
            {filteredUtilities.map((u) => {
              const Icon = u.icon;
              return (
                <button
                  key={u.id}
                  onClick={u.action}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/8 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${u.color}`} />
                    <span className="truncate">{u.label}</span>
                  </div>
                  {u.adminOnly && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300">
                      Admin
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* No results notice */}
        {filteredCore.length === 0 &&
          filteredOps.length === 0 &&
          filteredUtilities.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-400">
              No modules or utilities match &quot;{searchQuery}&quot;
            </div>
          )}

        {/* System Utilities Hub Launcher */}
        {!searchQuery && (
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                handleOpenUtilitiesHub();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/8 transition-all cursor-pointer text-left"
              title="Open System Utilities & Admin Tools Hub"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">System Utilities</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                10+ Tools
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 5. Minimalist User Profile & Account Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 pr-1">
          <div
            className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs border border-white/20"
            style={{ backgroundColor: theme.primary }}
          >
            {userSession.fullName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white truncate">
              {userSession.fullName}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {userSession.username}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {isAdmin && (
            <button
              onClick={onOpenAdminManager}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Admin Accounts & Roles"
            >
              <Shield className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenChangePassword && (
            <button
              onClick={onOpenChangePassword}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Change Password"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Vertical Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 h-screen sticky top-0 shrink-0 z-30 shadow-xl border-r border-slate-800 bg-[#0f172a]">
        {verticalSidebarContent}
      </aside>

      {/* Mobile Top Header */}
      <header
        className="lg:hidden sticky top-0 z-40 text-white select-none border-b border-black/15 shadow-sm px-4 h-14 flex items-center justify-between"
        style={{ backgroundColor: theme.primary }}
      >
        <div
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-white/15 p-0.5 border border-white/20 shadow-xs flex items-center justify-center">
            <KcaLogo size={26} />
          </div>
          <div>
            <div className="font-display font-black text-xs text-white uppercase tracking-tight truncate max-w-[170px]">
              {portalConfig.shortName || portalConfig.portalName}
            </div>
            <div className="text-[9px] text-white/80 truncate font-medium max-w-[170px]">
              {portalConfig.affiliationText || portalConfig.jurisdiction}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenNewMember()}
            className="px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs cursor-pointer shadow-xs border border-white/30 flex items-center gap-1"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Register</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-white transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
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
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-4/5 max-w-xs h-full bg-[#0f172a] border-r border-slate-800 shadow-2xl z-10 flex flex-col animate-slideRight">
            <div className="absolute top-3 right-3 z-20">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 border border-white/15 cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {verticalSidebarContent}
          </div>
        </div>
      )}

      {/* Fallback Local System Utilities Modal (Only if not handled by parent) */}
      {!onOpenSystemUtilities && showUtilitiesModal && (
        <SystemUtilitiesModal
          isOpen={showUtilitiesModal}
          onClose={() => setShowUtilitiesModal(false)}
          userSession={userSession}
          onOpenCertificateGenerator={onOpenCertificateGenerator}
          onOpenReportGenerator={onOpenReportGenerator}
          onOpenWhatsApp={onOpenWhatsApp}
          onOpenMailbox={onOpenMailbox}
          onOpenUnitManager={onOpenUnitManager}
          onOpenLogoManager={onOpenLogoManager}
          onOpenThemeSelector={onOpenThemeSelector}
          onOpenBackupSettings={onOpenBackupSettings}
          onOpenAdminManager={onOpenAdminManager}
          onOpenChangePassword={onOpenChangePassword}
          onOpenSystemManual={onOpenSystemManual}
          onOpenVerify={() => onSelectTab('verify')}
        />
      )}
    </>
  );
};
