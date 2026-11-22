import React, { useState } from 'react';
import {
  Wrench,
  Award,
  FileText,
  Send,
  Mail,
  MapPin,
  Building2,
  Palette,
  HardDrive,
  QrCode,
  Shield,
  KeyRound,
  Download,
  X,
  Search,
  ExternalLink,
} from 'lucide-react';
import { UserSession, hasAdminPrivilege } from '../types/member';
import { downloadSystemDocumentationPdf } from '../utils/systemDocumentationPdfGenerator';

interface SystemUtilitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession | null;
  onOpenCertificateGenerator?: () => void;
  onOpenReportGenerator?: () => void;
  onOpenWhatsApp?: () => void;
  onOpenMailbox?: () => void;
  onOpenUnitManager?: () => void;
  onOpenLogoManager?: () => void;
  onOpenThemeSelector?: () => void;
  onOpenBackupSettings?: () => void;
  onOpenAdminManager?: () => void;
  onOpenChangePassword?: () => void;
  onOpenSystemManual?: () => void;
  onOpenVerify?: () => void;
}

export const SystemUtilitiesModal: React.FC<SystemUtilitiesModalProps> = ({
  isOpen,
  onClose,
  userSession,
  onOpenCertificateGenerator,
  onOpenReportGenerator,
  onOpenWhatsApp,
  onOpenMailbox,
  onOpenUnitManager,
  onOpenLogoManager,
  onOpenThemeSelector,
  onOpenBackupSettings,
  onOpenAdminManager,
  onOpenChangePassword,
  onOpenSystemManual,
  onOpenVerify,
}) => {
  const [search, setSearch] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (!isOpen) return null;

  const isAdmin = userSession ? hasAdminPrivilege(userSession.role) : false;

  const utilities = [
    {
      id: 'certificates',
      title: 'Certificates Studio',
      description: 'Issue official Kalolsavam, cultural achievement & appreciation certificates',
      icon: Award,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      category: 'Communications & Documents',
      action: () => {
        onClose();
        onOpenCertificateGenerator?.();
      },
      available: !!onOpenCertificateGenerator,
    },
    {
      id: 'reports',
      title: 'Executive Reports & Analytics',
      description: 'Generate membership distribution, demographic & analytical summaries',
      icon: FileText,
      iconColor: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
      category: 'Communications & Documents',
      action: () => {
        onClose();
        onOpenReportGenerator?.();
      },
      available: !!onOpenReportGenerator,
    },
    {
      id: 'whatsapp',
      title: 'Central WhatsApp Hub',
      description: 'Direct WhatsApp communication with members, units & coordination desks',
      icon: Send,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      category: 'Communications & Documents',
      action: () => {
        onClose();
        onOpenWhatsApp?.();
      },
      available: !!onOpenWhatsApp,
    },
    {
      id: 'mailbox',
      title: 'Official Mailbox',
      description: 'Official correspondence dispatch, drafts, and records management',
      icon: Mail,
      iconColor: 'text-sky-500',
      bgColor: 'bg-sky-500/10',
      category: 'Communications & Documents',
      action: () => {
        onClose();
        onOpenMailbox?.();
      },
      available: !!onOpenMailbox,
    },
    {
      id: 'units',
      title: 'Units & Regional Structure',
      description: 'Configure branches, departments, chapters, and regional units',
      icon: MapPin,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-600/10',
      category: 'Administration & Setup',
      adminOnly: true,
      action: () => {
        onClose();
        onOpenUnitManager?.();
      },
      available: isAdmin && !!onOpenUnitManager,
    },
    {
      id: 'logo',
      title: 'Organisation & Dynamic Branding',
      description: 'Customize organization name, themes, logos, ID prefixes, and terminology for any company or club',
      icon: Building2,
      iconColor: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      category: 'Administration & Setup',
      adminOnly: true,
      action: () => {
        onClose();
        onOpenUnitManager?.();
      },
      available: isAdmin && (!!onOpenUnitManager || !!onOpenLogoManager),
    },
    {
      id: 'theme',
      title: 'Theme & Color Palette',
      description: 'Customize header and accent color themes (Maroon, Royal Blue, Emerald, etc.)',
      icon: Palette,
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      category: 'Administration & Setup',
      adminOnly: true,
      action: () => {
        onClose();
        onOpenThemeSelector?.();
      },
      available: isAdmin && !!onOpenThemeSelector,
    },
    {
      id: 'admins',
      title: 'Admin Accounts & Roles',
      description: 'Manage administrator credentials, user role assignments & permissions',
      icon: Shield,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      category: 'Administration & Setup',
      adminOnly: true,
      action: () => {
        onClose();
        onOpenAdminManager?.();
      },
      available: isAdmin && !!onOpenAdminManager,
    },
    {
      id: 'backup',
      title: 'Cloud & Database Backup',
      description: 'Full JSON/CSV database snapshot, Google Drive sync, and system restore',
      icon: HardDrive,
      iconColor: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      category: 'Storage & Security',
      action: () => {
        onClose();
        onOpenBackupSettings?.();
      },
      available: !!onOpenBackupSettings,
    },
    {
      id: 'verify',
      title: 'Card & Receipt QR Verifier',
      description: 'Scan or verify member digital ID cards and official payment receipts',
      icon: QrCode,
      iconColor: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
      category: 'Storage & Security',
      action: () => {
        onClose();
        onOpenVerify?.();
      },
      available: !!onOpenVerify,
    },
    {
      id: 'password',
      title: 'Change Password',
      description: 'Update your personal account security login credentials',
      icon: KeyRound,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      category: 'Storage & Security',
      action: () => {
        onClose();
        onOpenChangePassword?.();
      },
      available: !!onOpenChangePassword,
    },
    {
      id: 'manual',
      title: 'System Manual & Guides',
      description: 'Interactive operating handbook, module tutorials & Windows setup guide',
      icon: FileText,
      iconColor: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
      category: 'Documentation',
      action: () => {
        onClose();
        onOpenSystemManual?.();
      },
      available: !!onOpenSystemManual,
    },
    {
      id: 'manual_pdf',
      title: 'Download Manual (PDF)',
      description: 'Export complete printable PDF documentation of portal architecture',
      icon: Download,
      iconColor: 'text-slate-600',
      bgColor: 'bg-slate-500/10',
      category: 'Documentation',
      action: async () => {
        try {
          setDownloadingPdf(true);
          await downloadSystemDocumentationPdf(
            userSession?.fullName || 'KCA Executive Administration'
          );
        } finally {
          setDownloadingPdf(false);
          onClose();
        }
      },
      available: true,
    },
  ];

  const filtered = utilities.filter((u) => {
    if (!u.available) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.title.toLowerCase().includes(q) ||
      u.description.toLowerCase().includes(q) ||
      u.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Wrench className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">System Utilities &amp; Tools</h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {filtered.length} Available
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official tools, administration utilities, communications &amp; manuals
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search utility, tool or action (e.g. certificates, backup, reports, whatsapp)..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Utilities Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No utilities matching &quot;{search}&quot;.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filtered.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    disabled={downloadingPdf && item.id === 'manual_pdf'}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all text-left flex flex-col justify-between gap-3 group cursor-pointer active:scale-98"
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${item.iconColor}`} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.adminOnly && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                            Admin
                          </span>
                        )}
                        <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-slate-950">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-snug line-clamp-2 mt-1">
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <div>
            Logged in as <span className="font-semibold text-slate-900">{userSession?.fullName}</span> ({userSession?.role})
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
