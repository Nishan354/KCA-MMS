import React, { useState, useMemo } from 'react';
import { Member, UserSession, hasAdminPrivilege, isUnitOperatorRole } from '../types/member';
import { FinanceTransaction } from '../types/finance';
import { InventoryItem, InventoryMovementLog } from '../types/inventory';
import { CulturalClass, ClassParticipant } from '../types/classes';
import { formatAED, formatDate, getExpiryStatus, formatCardBloodGroup } from '../utils/idGenerator';
import { OfficialKcaHeaderBanner } from './Logo';
import { downloadComprehensiveDashboardPdf } from '../utils/dashboardReportGenerator';
import { downloadSystemDocumentationPdf } from '../utils/systemDocumentationPdfGenerator';
import { NavTab } from './Navbar';
import {
  Users,
  HeartPulse,
  IdCard,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  Receipt,
  Download,
  Building2,
  FileText,
  FolderOpen,
  MapPin,
  ArrowRight,
  GraduationCap,
  Sparkles,
  Contact,
  Award,
  AlertTriangle,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Send,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DashboardProps {
  members: Member[];
  financeTransactions?: FinanceTransaction[];
  inventoryItems?: InventoryItem[];
  inventoryLogs?: InventoryMovementLog[];
  classes?: CulturalClass[];
  participants?: ClassParticipant[];
  units?: string[];
  userSession?: UserSession;
  onSelectMember?: (member: Member) => void;
  onOpenNewMember: () => void;
  onOpenBatchPrint: () => void;
  onOpenBloodDirectory: (bloodGroupFilter?: string) => void;
  onOpenBackupModal: () => void;
  onOpenVerifyModal: () => void;
  onOpenReportGenerator?: () => void;
  onOpenNewFinance?: () => void;
  onOpenNewInventory?: () => void;
  onNavigateTab?: (tab: NavTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  members,
  financeTransactions = [],
  inventoryItems = [],
  inventoryLogs = [],
  classes = [],
  participants = [],
  units = ['Fujairah', 'Kalba', 'Khorfakhan', 'Dibba', 'Central Committee'],
  userSession,
  onSelectMember,
  onOpenNewMember,
  onOpenBatchPrint,
  onOpenBloodDirectory,
  onOpenReportGenerator,
  onOpenNewFinance,
  onNavigateTab,
}) => {
  const handleSelectMember = onSelectMember || (() => {});
  const isUnitOp = !!userSession && isUnitOperatorRole(userSession.role);

  // Active Scope Filter
  const [activeUnitFilter, setActiveUnitFilter] = useState<string>(
    isUnitOp && userSession?.unit ? userSession.unit : 'All'
  );

  // Keep activeUnitFilter in sync when user logs in/out or switches accounts
  React.useEffect(() => {
    if (isUnitOp && userSession?.unit) {
      setActiveUnitFilter(userSession.unit);
    } else {
      setActiveUnitFilter('All');
    }
  }, [userSession?.role, userSession?.unit, isUnitOp]);

  const [isExportingReport, setIsExportingReport] = useState(false);

  // Filtered Datasets based on selected Unit Scope
  const displayedMembers = useMemo(() => {
    if (activeUnitFilter === 'All') return members;
    const isCentral = activeUnitFilter.toLowerCase().startsWith('central');
    if (isCentral) {
      return members.filter((m) => m.membershipType === 'Central Committee Member' || m.unit.toLowerCase().startsWith('central'));
    }
    return members.filter((m) => m.unit.toLowerCase() === activeUnitFilter.toLowerCase());
  }, [members, activeUnitFilter]);

  const displayedFinance = useMemo(() => {
    if (activeUnitFilter === 'All') return financeTransactions;
    const isCentral = activeUnitFilter.toLowerCase().startsWith('central');
    return financeTransactions.filter((f) => {
      if (isCentral) return f.unit.toLowerCase().startsWith('central');
      return f.unit.toLowerCase() === activeUnitFilter.toLowerCase();
    });
  }, [financeTransactions, activeUnitFilter]);

  const displayedInventory = useMemo(() => {
    if (activeUnitFilter === 'All') return inventoryItems;
    const isCentral = activeUnitFilter.toLowerCase().startsWith('central');
    return inventoryItems.filter((i) => {
      if (isCentral) return i.unit.toLowerCase().startsWith('central');
      return i.unit.toLowerCase() === activeUnitFilter.toLowerCase();
    });
  }, [inventoryItems, activeUnitFilter]);

  // 1. Membership Metrics
  const totalMembers = displayedMembers.length;
  const activeMembers = displayedMembers.filter((m) => m.status === 'Active' && !getExpiryStatus(m.expiryDate).isExpired);
  const activeMembersCount = activeMembers.length;
  const expiringMembers = displayedMembers.filter((m) => {
    const status = getExpiryStatus(m.expiryDate);
    return status.isExpired || status.daysRemaining <= 60;
  });

  // 2. Finance Metrics
  const totalIncomeAED = displayedFinance
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + (t.amountAED || 0), 0);
  const totalExpenseAED = displayedFinance
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + (t.amountAED || 0), 0);
  const netCashFlowAED = totalIncomeAED - totalExpenseAED;

  // 3. Inventory Metrics
  const totalAssetsCount = displayedInventory.length;
  const availableQuantitySum = displayedInventory.reduce((sum, i) => sum + (i.availableQuantity || 0), 0);
  const issuedQuantitySum = displayedInventory.reduce((sum, i) => sum + (i.issuedQuantity || 0), 0);

  // 4. Blood Donors
  const bloodCounts: Record<string, number> = {
    'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0,
  };
  displayedMembers.forEach((m) => {
    if (m.bloodGroup && bloodCounts[m.bloodGroup] !== undefined) {
      bloodCounts[m.bloodGroup]++;
    }
  });

  // Unit breakdown stats calculation for all known units in system
  const allKnownUnits = Array.from(new Set([...units, ...members.map((m) => m.unit)]));
  const unitStats = allKnownUnits.map((u) => {
    const isCentral = u.toLowerCase().startsWith('central');
    const uMembers = isCentral
      ? members.filter((m) => m.membershipType === 'Central Committee Member' || m.unit.toLowerCase().startsWith('central'))
      : members.filter((m) => m.unit === u);
    const count = uMembers.length;

    const uFinance = financeTransactions.filter((f) => {
      if (isCentral) return f.unit.toLowerCase().startsWith('central');
      return f.unit.toLowerCase() === u.toLowerCase();
    });
    const uIncome = uFinance.filter((f) => f.type === 'INCOME').reduce((sum, f) => sum + (f.amountAED || 0), 0);
    const uExpense = uFinance.filter((f) => f.type === 'EXPENSE').reduce((sum, f) => sum + (f.amountAED || 0), 0);

    const active = uMembers.filter((m) => m.status === 'Active' && !getExpiryStatus(m.expiryDate).isExpired).length;
    const expired = count - active;
    const pct = members.length > 0 ? Math.round((count / members.length) * 100) : 0;

    return {
      name: u,
      count,
      active,
      expired,
      netCash: uIncome - uExpense,
      percentage: pct,
    };
  }).sort((a, b) => b.count - a.count);

  // Handle Instant Comprehensive PDF Dashboard Export
  const handleGenerateDashboardReport = async () => {
    try {
      setIsExportingReport(true);
      await downloadComprehensiveDashboardPdf({
        unitFilter: activeUnitFilter,
        members,
        financeTransactions,
        inventoryItems,
        inventoryLogs,
        classes,
        participants,
        generatedBy: userSession?.fullName || 'Central Committee Administrator',
      });
      confetti({ particleCount: 45, spread: 60 });
    } catch (err) {
      console.error('Error generating consolidated dashboard report:', err);
      alert('Could not compile dashboard report. Please try the detailed Report Generator.');
    } finally {
      setIsExportingReport(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans antialiased">
      {/* Official Top Organization Banner */}
      <OfficialKcaHeaderBanner />

      {/* Unit Operator Scope Notice */}
      {isUnitOp && userSession?.unit && (
        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-white">
                  {userSession.unit} Unit Management
                </h3>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded">
                  Operator Role
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Logged in as <strong>{userSession.fullName}</strong>. Viewing filtered metrics for <strong>{userSession.unit} Unit</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenNewMember}
              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              style={{ color: 'var(--color-primary, #881337)' }}
            >
              + Add {userSession.unit} Member
            </button>
          </div>
        </div>
      )}

      {/* Executive Command Filter & Action Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Unit Scope Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 shrink-0">
            <Building2 className="w-4 h-4" style={{ color: 'var(--color-primary, #881337)' }} />
            <span>Unit Scope:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveUnitFilter('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeUnitFilter === 'All'
                  ? 'text-white shadow-xs font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              style={activeUnitFilter === 'All' ? { backgroundColor: 'var(--color-primary, #881337)' } : undefined}
            >
              All Units ({members.length})
            </button>

            {unitStats.map((u) => (
              <button
                key={u.name}
                onClick={() => setActiveUnitFilter(u.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeUnitFilter === u.name
                    ? 'text-white font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                style={activeUnitFilter === u.name ? { backgroundColor: 'var(--color-primary, #881337)' } : undefined}
              >
                {u.name} ({u.count})
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewMember}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            style={{ backgroundColor: 'var(--color-primary, #881337)' }}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>

          <button
            onClick={handleGenerateDashboardReport}
            disabled={isExportingReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Download Executive PDF Summary"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingReport ? 'Compiling...' : 'Executive PDF'}</span>
          </button>

          <button
            onClick={() => downloadSystemDocumentationPdf(userSession?.fullName || 'KCA Executive Administration')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Export Portal System Architecture & Logic Manual (PDF)"
          >
            <FileText className="w-3.5 h-3.5 text-rose-300" />
            <span className="hidden md:inline">System Manual (PDF)</span>
          </button>

          {onOpenReportGenerator && (
            <button
              onClick={onOpenReportGenerator}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Advanced Reports</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Executive KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Membership Strength */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('members')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Registered Members
            </span>
            <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/40 text-[#881337] dark:text-red-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl text-slate-900 dark:text-white mt-2">
            {totalMembers}
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>{activeMembersCount} Active Cards</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {totalMembers > 0 ? Math.round((activeMembersCount / totalMembers) * 100) : 0}% Active
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-[#881337] dark:text-red-400 group-hover:underline">
            <span>{activeUnitFilter === 'All' ? 'Fujairah Total' : `${activeUnitFilter} Scope`}</span>
            <span>View Members &rarr;</span>
          </div>
        </div>

        {/* KPI 2: Financial Balance */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('finance')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-600 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Net Balance
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className={`font-mono font-bold text-2xl mt-2 ${netCashFlowAED >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
            {formatAED(netCashFlowAED)}
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            In: {formatAED(totalIncomeAED)} &bull; Out: {formatAED(totalExpenseAED)}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline">
            <span>{displayedFinance.length} Vouchers</span>
            <span>View Ledger &rarr;</span>
          </div>
        </div>

        {/* KPI 3: Asset Inventory */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('inventory')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-600 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Asset Inventory
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl text-slate-900 dark:text-white mt-2">
            {totalAssetsCount} <span className="text-xs font-normal text-slate-500">Types</span>
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            {availableQuantitySum} Available &bull; {issuedQuantitySum} Issued
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">
            <span>Stock Assets</span>
            <span>View Inventory &rarr;</span>
          </div>
        </div>

        {/* KPI 4: Blood Bank Standby */}
        <div
          onClick={() => onOpenBloodDirectory('ALL')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-600 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Blood Donors Standby
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 flex items-center justify-center">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl text-rose-700 dark:text-rose-400 mt-2">
            {totalMembers} <span className="text-xs font-normal text-slate-500">Donors</span>
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Emergency Network across UAE
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-rose-700 dark:text-rose-400 group-hover:underline">
            <span>8 Blood Groups</span>
            <span>Open Helpline &rarr;</span>
          </div>
        </div>
      </div>

      {/* Main Command Launchpad & Module Shortcuts */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#881337] dark:text-red-400" />
            <div>
              <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
                Operations Launchpad &amp; Quick Modules
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct access to core organization modules, registers, and digital tools
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {/* Module: Members */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('members')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#881337] dark:hover:border-red-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer text-center group"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-red-100 dark:bg-red-950/60 text-[#881337] dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-900 dark:text-white mt-2.5">
              Members
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {members.length} Registered
            </div>
          </div>

          {/* Module: Digital ID Cards */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('idcards')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer text-center group"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <IdCard className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-900 dark:text-white mt-2.5">
              ID Cards Studio
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              QR Verified
            </div>
          </div>

          {/* Module: Letter Pad */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('letters')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer text-center group"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-900 dark:text-white mt-2.5">
              Letter Pad
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Auto Ref &amp; Signs
            </div>
          </div>

          {/* Module: General Documents */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('documents')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer text-center group"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-900 dark:text-white mt-2.5">
              Documents Store
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              By Category
            </div>
          </div>

          {/* Module: Contact Bank */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('contacts')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer text-center group"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Contact className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-900 dark:text-white mt-2.5">
              Contact Bank
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              VIPs &amp; Directory
            </div>
          </div>

          {/* Module: Finance */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('finance')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer text-center group"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Coins className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-900 dark:text-white mt-2.5">
              Finance Ledger
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Vouchers &amp; Dues
            </div>
          </div>

          {/* Module: Cultural Classes */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('classes')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer text-center group"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-900 dark:text-white mt-2.5">
              Cultural Classes
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {classes.length} Batches
            </div>
          </div>
        </div>
      </div>

      {/* Unit Breakdown & Renewal Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Unit Strength Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#881337] dark:text-red-400" />
              <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
                Unit Distribution &amp; Operational Strength
              </h4>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {unitStats.length} Registered Units
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unitStats.map((u) => (
              <div
                key={u.name}
                onClick={() => setActiveUnitFilter(u.name)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  activeUnitFilter === u.name
                    ? 'border-[#881337] dark:border-red-500 bg-red-50/40 dark:bg-red-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-400 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#881337] dark:text-red-400" />
                    <span>{u.name} Unit</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono">
                    {u.count} members
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    <span>Active: {u.active} ({u.count > 0 ? Math.round((u.active / u.count) * 100) : 0}%)</span>
                    <span>{u.percentage}% of KCA</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${u.percentage}%`,
                        backgroundColor: 'var(--color-primary, #881337)',
                      }}
                    />
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Net Cash:</span>
                  <span className={`font-mono font-bold ${u.netCash >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatAED(u.netCash)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Renewals & Attention Needed Widget */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  Renewals Due ({expiringMembers.length})
                </h4>
              </div>
              <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded">
                Action Required
              </span>
            </div>

            <div className="mt-3 space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {expiringMembers.slice(0, 5).map((m) => {
                const status = getExpiryStatus(m.expiryDate);
                return (
                  <div
                    key={m.id}
                    onClick={() => handleSelectMember(m)}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-amber-400 bg-amber-50/30 dark:bg-amber-950/20 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {m.fullName}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {m.membershipId} &bull; {m.unit}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                      {status.isExpired ? 'Expired' : `${status.daysRemaining}d left`}
                    </span>
                  </div>
                );
              })}

              {expiringMembers.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                  All membership cards in {activeUnitFilter} unit are currently active.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onNavigateTab && onNavigateTab('members')}
              className="w-full py-2 px-3 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Manage All Renewals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
