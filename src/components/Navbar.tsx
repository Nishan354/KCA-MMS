import React, { useState } from 'react';
import { KcaLogo } from './Logo';
import { LiveSyncIndicator } from './LiveSyncIndicator';
import { UserSession, hasAdminPrivilege, isUnitOperatorRole, isSuperAdminOrAdmin } from '../types/member';
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
} from 'lucide-react';

export type NavTab = 'dashboard' | 'members' | 'idcards' | 'finance' | 'inventory' | 'classes' | 'blood' | 'backup' | 'verify';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenNewMember: () => void;
  onOpenAdminManager: () => void;
  onOpenLogoManager?: () => void;
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
  onOpenLogoManager,
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
  const isAdmin = hasAdminPrivilege(userSession.role);
  const isStorageAdmin = isSuperAdminOrAdmin(userSession.role);
  const isUnitOp = isUnitOperatorRole(userSession.role);

  const rawNavItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'idcards', label: 'ID Cards', icon: IdCard },
    { id: 'finance', label: 'Finance', icon: Wallet },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'classes', label: 'Classes & Attendance', icon: GraduationCap },
    { id: 'blood', label: 'Blood Donors', icon: HeartPulse },
    { id: 'backup', label: 'Storage', icon: HardDrive, adminOnly: true },
    { id: 'verify', label: 'Verify', icon: QrCode },
  ];

  const navItems = rawNavItems.filter((item) => !item.adminOnly || isStorageAdmin);

  return (
    <header
      className="sticky top-0 z-40 text-white select-none border-b border-black/20 transition-colors duration-300 shadow-sm backdrop-blur-md"
      style={{ backgroundColor: 'var(--color-primary, #881337)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-3">
        {/* Zone 1: Brand Title & Concentric Logo */}
        <div
          onClick={() => {
            onSelectTab('dashboard');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-2.5 cursor-pointer shrink-0 group"
          role="button"
          tabIndex={0}
        >
          <div className="w-9 h-9 rounded-xl bg-white p-0.5 shadow-sm border border-white/40 flex items-center justify-center transition-transform group-hover:scale-105">
            <KcaLogo size={32} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-sm tracking-tight text-white uppercase whitespace-nowrap">
              KCA FUJAIRAH
            </span>
            {isUnitOp && userSession.unit ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-200 border border-amber-300/30 uppercase tracking-wider whitespace-nowrap hidden sm:inline-flex items-center gap-1 font-mono">
                <Building2 className="w-2.5 h-2.5" />
                {userSession.unit}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/15 text-white/90 border border-white/20 uppercase tracking-wider whitespace-nowrap hidden md:inline font-mono">
                PORTAL
              </span>
            )}
          </div>
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 bg-black/10 p-1 rounded-xl border border-white/10">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                style={isActive ? { color: 'var(--color-primary, #881337)' } : undefined}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live Cloud Multi-Device Sync Indicator */}
          <LiveSyncIndicator
            isAdmin={isStorageAdmin}
            onOpenStorageSettings={isStorageAdmin ? () => onSelectTab('backup') : undefined}
          />

          {/* Quick Tools Dropdown */}
          <div className="relative">
            <button
              onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
              onBlur={() => setTimeout(() => setToolsDropdownOpen(false), 220)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors border border-white/20 shadow-xs cursor-pointer active:scale-95"
              title="Official Tools & Communication"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Tools</span>
              <ChevronDown className="w-3 h-3 text-white/70" />
            </button>

            {toolsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-slate-800 animate-fadeIn">
                {onOpenWhatsApp && (
                  <button
                    onClick={() => {
                      onOpenWhatsApp();
                      setToolsDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-bold">WhatsApp Messenger</div>
                      <div className="text-[10px] text-slate-500">Send Cards &amp; Notifications</div>
                    </div>
                  </button>
                )}

                {onOpenMailbox && (
                  <button
                    onClick={() => {
                      onOpenMailbox();
                      setToolsDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 text-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="font-bold">Official Mailbox</div>
                      <div className="text-[10px] text-slate-500">kairalifujairah@gmail.com</div>
                    </div>
                  </button>
                )}

                {onOpenReportGenerator && (
                  <button
                    onClick={() => {
                      onOpenReportGenerator();
                      setToolsDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 text-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="font-bold">Reports &amp; Analytics</div>
                      <div className="text-[10px] text-slate-500">Download PDF / CSV summaries</div>
                    </div>
                  </button>
                )}

                {isAdmin && onOpenThemeSelector && (
                  <button
                    onClick={() => {
                      onOpenThemeSelector();
                      setToolsDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 text-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Palette className="w-4 h-4 text-rose-600" />
                    <div>
                      <div className="font-bold">Theme &amp; Colors</div>
                      <div className="text-[10px] text-slate-500">Customize portal palette</div>
                    </div>
                  </button>
                )}

                {isAdmin && onOpenLogoManager && (
                  <button
                    onClick={() => {
                      onOpenLogoManager();
                      setToolsDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 text-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="font-bold">Logo Customizer</div>
                      <div className="text-[10px] text-slate-500">Upload association badge</div>
                    </div>
                  </button>
                )}

                {isAdmin && (
                  <div className="pt-1 mt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        onOpenAdminManager();
                        setToolsDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs hover:bg-amber-50 text-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="font-bold text-amber-900">User Access &amp; Operators</div>
                        <div className="text-[10px] text-slate-500">Manage portal user accounts</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Add Member button */}
          <button
            onClick={onOpenNewMember}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-bold whitespace-nowrap shrink-0 transition-all shadow-sm cursor-pointer active:scale-95 border border-white/30"
            style={{ color: 'var(--color-primary, #881337)' }}
            title={isUnitOp && userSession.unit ? `Add New Member for ${userSession.unit} Unit` : 'Add New Member'}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isUnitOp && userSession.unit ? `+ ${userSession.unit}` : 'New Member'}
            </span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center pl-2 border-l border-white/25 gap-1">
            <div className="hidden xl:flex flex-col text-right">
              <span className="text-xs font-bold text-white truncate max-w-[130px]">
                {userSession.fullName}
              </span>
              <span className="text-[10px] text-amber-200 font-mono flex items-center justify-end gap-1">
                {isUnitOp && userSession.unit ? (
                  <span className="bg-white/20 px-1 py-0.2 rounded text-white font-semibold">{userSession.unit}</span>
                ) : null}
                <span>{userSession.role === 'Super Admin' ? 'Super Admin' : userSession.role}</span>
              </span>
            </div>

            {onOpenChangePassword && (
              <button
                onClick={onOpenChangePassword}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                title="Change Password"
              >
                <KeyRound className="w-4 h-4 text-amber-300" />
              </button>
            )}

            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer ml-1"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden px-4 py-3 border-t border-black/20 space-y-1.5 animate-fadeIn"
          style={{ backgroundColor: 'var(--color-primary-hover, #700c2b)' }}
        >
          <div className="grid grid-cols-2 gap-1.5 pb-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 ${
                    isActive ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-white/85 hover:text-white hover:bg-white/10'
                  }`}
                  style={isActive ? { color: 'var(--color-primary, #881337)' } : undefined}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
