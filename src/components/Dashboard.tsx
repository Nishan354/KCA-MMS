import React, { useState, useMemo } from 'react';
import { Member, UserSession, hasAdminPrivilege, isUnitOperatorRole } from '../types/member';
import { FinanceTransaction } from '../types/finance';
import { InventoryItem, InventoryMovementLog } from '../types/inventory';
import { CulturalClass, ClassParticipant } from '../types/classes';
import { StudentWingMember } from '../types/studentsWing';
import {
  formatAED,
  formatDate,
  getExpiryStatus,
  formatCardBloodGroup,
  isMemberEffectivelyActive,
  getEffectiveMemberStatus,
} from '../utils/idGenerator';
import { OfficialKcaHeaderBanner } from './Logo';
import { downloadComprehensiveDashboardPdf } from '../utils/dashboardReportGenerator';
import { downloadSystemDocumentationPdf } from '../utils/systemDocumentationPdfGenerator';
import {
  downloadCommitteeSummaryPdf,
  exportCommitteeSummaryCsv,
} from '../utils/committeeSummaryReportGenerator';
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
  FileSpreadsheet,
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
  studentsWingMembers?: StudentWingMember[];
  units?: string[];
  userSession?: UserSession;
  onSelectMember?: (member: Member) => void;
  onOpenNewMember: () => void;
  onOpenNewStudent?: () => void;
  onViewStudentIdCard?: (student: StudentWingMember) => void;
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
  studentsWingMembers = [],
  units = ['Fujairah', 'Kalba', 'Khorfakhan', 'Dibba', 'Central Committee'],
  userSession,
  onSelectMember,
  onOpenNewMember,
  onOpenNewStudent,
  onViewStudentIdCard,
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
  const [isExportingCommitteePdf, setIsExportingCommitteePdf] = useState(false);

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

  const displayedStudentsWing = useMemo(() => {
    if (activeUnitFilter === 'All') return studentsWingMembers;
    const isCentral = activeUnitFilter.toLowerCase().startsWith('central');
    return studentsWingMembers.filter((s) => {
      if (isCentral) return s.unit.toLowerCase().startsWith('central');
      return s.unit.toLowerCase() === activeUnitFilter.toLowerCase();
    });
  }, [studentsWingMembers, activeUnitFilter]);
  const kcaLinkedStudentsCount = useMemo(
    () => displayedStudentsWing.filter((s) => s.isParentKcaMember).length,
    [displayedStudentsWing]
  );

  // 1. Membership, Ladies Wing, Children's Wing & Committee Metrics for Unified Summary
  const totalMembers = displayedMembers.length;
  const activeMembers = useMemo(
    () => displayedMembers.filter(isMemberEffectivelyActive),
    [displayedMembers]
  );
  const activeMembersCount = activeMembers.length;
  const expiringMembers = useMemo(
    () =>
      displayedMembers.filter((m) => {
        const status = getExpiryStatus(m.expiryDate);
        return status.isExpired || status.daysRemaining <= 60;
      }),
    [displayedMembers]
  );

  const displayedLadiesWing = useMemo(
    () =>
      displayedMembers.filter(
        (m) =>
          (m.gender || '').toLowerCase() === 'female' ||
          (m.subcommittee || '').toLowerCase() === 'ladies wing'
      ),
    [displayedMembers]
  );
  const activeLadiesWingCount = useMemo(
    () => displayedLadiesWing.filter(isMemberEffectivelyActive).length,
    [displayedLadiesWing]
  );

  const displayedCommitteeMembers = useMemo(
    () =>
      displayedMembers.filter(
        (m) =>
          m.membershipType === 'Central Committee Member' ||
          m.membershipType === 'Executive Member' ||
          m.committeeTier === 'Central' ||
          m.committeeTier === 'Unit' ||
          m.committeeTier === 'Central Coordination' ||
          m.committeeTier === 'Executive Coordination' ||
          Boolean(m.coordinationCommittee) ||
          Boolean(m.designation && m.designation.trim())
      ),
    [displayedMembers]
  );
  const centralCommitteeCount = useMemo(
    () =>
      displayedCommitteeMembers.filter(
        (m) => m.membershipType === 'Central Committee Member' || m.committeeTier === 'Central'
      ).length,
    [displayedCommitteeMembers]
  );
  const coordinationCommitteeCount = useMemo(
    () =>
      displayedCommitteeMembers.filter(
        (m) =>
          Boolean(m.coordinationCommittee) ||
          m.committeeTier === 'Central Coordination' ||
          m.committeeTier === 'Executive Coordination'
      ).length,
    [displayedCommitteeMembers]
  );
  const unitCommitteeCount = useMemo(
    () =>
      displayedCommitteeMembers.filter(
        (m) =>
          !(m.membershipType === 'Central Committee Member' || m.committeeTier === 'Central') &&
          (m.membershipType === 'Executive Member' ||
            m.committeeTier === 'Unit' ||
            Boolean(m.designation && m.designation.trim()))
      ).length,
    [displayedCommitteeMembers]
  );

  // 2. Finance Metrics
  const { totalIncomeAED, totalExpenseAED, netCashFlowAED } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of displayedFinance) {
      if (t.type === 'INCOME') income += t.amountAED || 0;
      else if (t.type === 'EXPENSE') expense += t.amountAED || 0;
    }
    return {
      totalIncomeAED: income,
      totalExpenseAED: expense,
      netCashFlowAED: income - expense,
    };
  }, [displayedFinance]);

  // 3. Inventory Metrics
  const totalAssetsCount = displayedInventory.length;
  const { availableQuantitySum, issuedQuantitySum } = useMemo(() => {
    let avail = 0;
    let issued = 0;
    for (const i of displayedInventory) {
      avail += i.availableQuantity || 0;
      issued += i.issuedQuantity || 0;
    }
    return { availableQuantitySum: avail, issuedQuantitySum: issued };
  }, [displayedInventory]);

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

    const active = uMembers.filter(isMemberEffectivelyActive).length;
    const expired = count - active;
    const pct = members.length > 0 ? Math.round((count / members.length) * 100) : 0;

    const uLadiesCount = uMembers.filter(
      (m) =>
        (m.gender || '').toLowerCase() === 'female' ||
        (m.subcommittee || '').toLowerCase() === 'ladies wing'
    ).length;

    const uChildrensCount = studentsWingMembers.filter((s) => {
      if (isCentral) return s.unit.toLowerCase().startsWith('central');
      return s.unit.toLowerCase() === u.toLowerCase();
    }).length;

    const uCommitteeCount = uMembers.filter(
      (m) =>
        m.membershipType === 'Central Committee Member' ||
        m.membershipType === 'Executive Member' ||
        m.committeeTier === 'Central' ||
        m.committeeTier === 'Unit' ||
        Boolean(m.designation && m.designation.trim())
    ).length;

    return {
      name: u,
      count,
      active,
      expired,
      ladiesCount: uLadiesCount,
      childrensCount: uChildrensCount,
      committeeCount: uCommitteeCount,
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
              style={{ color: 'var(--color-primary, #0ea5e9)' }}
            >
              + Add {userSession.unit} Member
            </button>
          </div>
        </div>
      )}

      {/* Executive Command Filter & Action Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Unit Scope Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 shrink-0">
            <Building2 className="w-4 h-4 text-[#8b0000]" />
            <span>Unit Scope:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveUnitFilter('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeUnitFilter === 'All'
                  ? 'bg-[#8b0000] text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              All Units ({members.length})
            </button>

            {unitStats.map((u) => (
              <button
                key={u.name}
                onClick={() => setActiveUnitFilter(u.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeUnitFilter === u.name
                    ? 'bg-[#8b0000] text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {u.name} ({u.count})
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenNewMember}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-xs bg-[#8b0000] hover:bg-[#730000] cursor-pointer active:scale-95"
          >
            <Users className="w-3.5 h-3.5" />
            <span>+ Add Member</span>
          </button>

          <button
            onClick={handleGenerateDashboardReport}
            disabled={isExportingReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all border border-slate-200 shadow-xs cursor-pointer disabled:opacity-50"
            title="Download Executive PDF Summary"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{isExportingReport ? 'Compiling...' : 'Executive PDF'}</span>
          </button>

          <button
            onClick={() => downloadSystemDocumentationPdf(userSession?.fullName || 'KCA Executive Administration')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all border border-slate-200 shadow-xs cursor-pointer"
            title="Export Portal System Architecture & Logic Manual (PDF)"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden md:inline">System Manual</span>
          </button>

          {onOpenReportGenerator && (
            <button
              onClick={onOpenReportGenerator}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all border border-slate-200 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Advanced Reports</span>
            </button>
          )}
        </div>
      </div>

      {/* Single Unified Committee Summary: Members, Ladies Wing, Children's Wing & Committee */}
      <div className="bg-white p-6 sm:p-7 rounded-xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[#8b0000] bg-rose-50 border border-rose-200 shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#8b0000]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-display font-bold text-lg text-slate-900">
                  Members Summary: Members, Ladies Wing &amp; Children&apos;s Wing
                </h4>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                  {activeUnitFilter === 'All' ? 'All Units Consolidated' : `${activeUnitFilter} Unit`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Consolidated members summary including all registered Members, Ladies Wing, Children&apos;s Wing, and Committees
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isExportingCommitteePdf}
              onClick={async () => {
                try {
                  setIsExportingCommitteePdf(true);
                  await downloadCommitteeSummaryPdf({
                    unitFilter: activeUnitFilter,
                    members,
                    studentsWingMembers,
                    units,
                    generatedBy: userSession?.fullName || 'KCA Executive Administration',
                  });
                  confetti({ particleCount: 40, spread: 55 });
                } catch (err) {
                  console.error('Error exporting members summary PDF:', err);
                  alert('Unable to generate Members Summary PDF.');
                } finally {
                  setIsExportingCommitteePdf(false);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 bg-[#8b0000] hover:bg-[#730000]"
              title="Export Members Summary Report (PDF) - Includes all members, wings & committees"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>{isExportingCommitteePdf ? 'Exporting...' : 'Export Members Summary (PDF)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                exportCommitteeSummaryCsv({
                  unitFilter: activeUnitFilter,
                  members,
                  studentsWingMembers,
                  units,
                });
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer border border-slate-200"
              title="Export Members Summary to Spreadsheet (CSV) - Includes full member roster & wings"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-700" />
              <span>Export Members Summary (CSV)</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('members')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
            >
              Members Directory
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('coordination_committee')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
            >
              Coordination Committee
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('ladies_wing')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
            >
              Ladies Wing
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('students_wing')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
            >
              Children&apos;s Wing
            </button>
          </div>
        </div>

        {/* 3 Unified Summary Cards: Members | Ladies Wing | Children's Wing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Members */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('members')}
            className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Total Members
              </span>
              <div className="w-9 h-9 rounded-lg bg-rose-50 text-[#8b0000] border border-rose-200 flex items-center justify-center transition-transform group-hover:scale-110">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="font-display font-black text-3xl sm:text-4xl text-slate-900 mt-3 tabular-nums">
              {totalMembers}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-2 flex items-center justify-between pt-2 border-t border-slate-100">
              <span>{activeMembersCount} Active Roster</span>
              <span className="font-bold text-emerald-600">
                {totalMembers > 0 ? Math.round((activeMembersCount / totalMembers) * 100) : 0}% Active
              </span>
            </div>
          </div>

          {/* 2. Ladies Wing */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('ladies_wing')}
            className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Ladies Wing
              </span>
              <div className="w-9 h-9 rounded-lg bg-pink-50 text-pink-700 border border-pink-200 flex items-center justify-center transition-transform group-hover:scale-110">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="font-display font-black text-3xl sm:text-4xl text-pink-700 mt-3 tabular-nums">
              {displayedLadiesWing.length}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-2 flex items-center justify-between pt-2 border-t border-slate-100">
              <span>{activeLadiesWingCount} Active Members</span>
              <span className="font-bold text-pink-700">
                {totalMembers > 0 ? Math.round((displayedLadiesWing.length / totalMembers) * 100) : 0}% of KCA
              </span>
            </div>
          </div>

          {/* 3. Children's Wing */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('students_wing')}
            className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Children&apos;s Wing
              </span>
              <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center transition-transform group-hover:scale-110">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="font-display font-black text-3xl sm:text-4xl text-sky-700 mt-3 tabular-nums">
              {displayedStudentsWing.length}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-2 flex items-center justify-between pt-2 border-t border-slate-100">
              <span>{kcaLinkedStudentsCount} KCA Parents</span>
              <span className="font-bold text-sky-700">Separate Register</span>
            </div>
          </div>
        </div>

        {/* Consolidated Unit-Wise Summary Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10.5px] tracking-wider">
                <th className="py-2.5 px-4">Unit</th>
                <th className="py-2.5 px-4 text-center">Members</th>
                <th className="py-2.5 px-4 text-center">Active (%)</th>
                <th className="py-2.5 px-4 text-center">Ladies Wing</th>
                <th className="py-2.5 px-4 text-center">Children&apos;s Wing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {unitStats.map((u) => (
                <tr
                  key={u.name}
                  onClick={() => setActiveUnitFilter(u.name)}
                  className={`cursor-pointer transition-colors ${
                    activeUnitFilter === u.name
                      ? 'bg-rose-50/70 font-bold'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#8b0000] shrink-0" />
                    <span>{u.name}</span>
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900">
                    {u.count}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono text-emerald-600 font-bold">
                    {u.active} ({u.count > 0 ? Math.round((u.active / u.count) * 100) : 0}%)
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-pink-700">
                    {u.ladiesCount}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-blue-700">
                    {u.childrensCount}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800 text-white font-bold text-xs">
                <td className="py-2.5 px-4">Total KCA Strength</td>
                <td className="py-2.5 px-4 text-center font-mono">{members.length}</td>
                <td className="py-2.5 px-4 text-center font-mono text-emerald-400">
                  {members.filter(isMemberEffectivelyActive).length} ({members.length > 0 ? Math.round((members.filter(isMemberEffectivelyActive).length / members.length) * 100) : 0}%)
                </td>
                <td className="py-2.5 px-4 text-center font-mono text-pink-300">
                  {
                    members.filter(
                      (m) =>
                        (m.gender || '').toLowerCase() === 'female' ||
                        (m.subcommittee || '').toLowerCase() === 'ladies wing'
                    ).length
                  }
                </td>
                <td className="py-2.5 px-4 text-center font-mono text-sky-300">
                  {studentsWingMembers.length}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Operational KPI Highlight Cards (Finance, Inventory, Blood Donors) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: Financial Balance */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('finance')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Net Balance
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className={`font-mono font-bold text-2xl mt-2 ${netCashFlowAED >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatAED(netCashFlowAED)}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">
            In: {formatAED(totalIncomeAED)} &bull; Out: {formatAED(totalExpenseAED)}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-emerald-700 group-hover:underline">
            <span>{displayedFinance.length} Vouchers</span>
            <span>View Ledger &rarr;</span>
          </div>
        </div>

        {/* KPI 2: Asset Inventory */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('inventory')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Asset Inventory
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl text-slate-900 mt-2">
            {totalAssetsCount} <span className="text-xs font-normal text-slate-500">Types</span>
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">
            {availableQuantitySum} Available &bull; {issuedQuantitySum} Issued
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-blue-700 group-hover:underline">
            <span>Stock Assets</span>
            <span>View Inventory &rarr;</span>
          </div>
        </div>

        {/* KPI 3: Blood Bank Standby */}
        <div
          onClick={() => (onNavigateTab ? onNavigateTab('blood') : onOpenBloodDirectory('ALL'))}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-rose-300 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Blood Bank Standby
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 text-[#8b0000] flex items-center justify-center">
              <HeartPulse className="w-4 h-4 text-[#8b0000]" />
            </div>
          </div>
          <div className="font-display font-black text-2xl text-[#8b0000] mt-2">
            {totalMembers} <span className="text-xs font-normal text-slate-500">Donors</span>
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">
            Emergency Network across UAE
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-[#8b0000] group-hover:underline">
            <span>8 Blood Groups</span>
            <span>Open Blood Bank &rarr;</span>
          </div>
        </div>
      </div>

      {/* Main Command Launchpad & Module Shortcuts */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div>
              <h4 className="font-display font-bold text-base text-slate-900">
                Operations Launchpad &amp; Quick Modules
              </h4>
              <p className="text-xs text-slate-500">
                Direct access to core organization modules, registers, and digital tools
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
          {/* Module: Members */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('members')}
            className="p-4 rounded-xl border border-slate-200 hover:border-rose-300 bg-slate-50 hover:bg-white transition-all cursor-pointer text-center group shadow-xs hover:shadow-md"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-rose-50 border border-rose-200 text-[#8b0000] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-900 mt-2.5">
              Members
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {members.length} Registered
            </div>
          </div>

          {/* Module: Children's Wing */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('students_wing')}
            className="p-4 rounded-xl border border-slate-200 hover:border-sky-300 bg-slate-50 hover:bg-white transition-all cursor-pointer text-center group shadow-xs hover:shadow-md"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-900 mt-2.5">
              Children&apos;s Wing
            </div>
            <div className="text-[10px] text-sky-700 font-semibold mt-0.5">
              {studentsWingMembers.length} Enrolled
            </div>
          </div>

          {/* Module: Digital ID Cards */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('idcards')}
            className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white transition-all cursor-pointer text-center group shadow-xs hover:shadow-md"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <IdCard className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-900 mt-2.5">
              ID Cards Studio
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              QR Verified
            </div>
          </div>

          {/* Module: Letter Pad */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('letters')}
            className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white transition-all cursor-pointer text-center group shadow-xs hover:shadow-md"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-900 mt-2.5">
              Letter Pad
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Auto Ref &amp; Signs
            </div>
          </div>

          {/* Module: General Documents */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('documents')}
            className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white transition-all cursor-pointer text-center group shadow-xs hover:shadow-md"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-900 mt-2.5">
              Documents Store
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              By Category
            </div>
          </div>

          {/* Module: Contact Bank */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('contacts')}
            className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white transition-all cursor-pointer text-center group shadow-xs hover:shadow-md"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Contact className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-900 mt-2.5">
              Contact Bank
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              VIPs &amp; Directory
            </div>
          </div>

          {/* Module: Finance */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('finance')}
            className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50 hover:bg-white transition-all cursor-pointer text-center group shadow-xs hover:shadow-md"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Coins className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-900 mt-2.5">
              Finance Ledger
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Vouchers &amp; Dues
            </div>
          </div>

          {/* Module: Cultural Classes */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('classes')}
            className="p-4 rounded-xl border border-slate-200 hover:border-purple-300 bg-slate-50 hover:bg-white transition-all cursor-pointer text-center group shadow-xs hover:shadow-md"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-900 mt-2.5">
              Cultural Classes
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {classes.length} Batches
            </div>
          </div>

          {/* Module: Blood Bank */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('blood')}
            className="p-4 rounded-xl border border-slate-200 hover:border-rose-300 bg-slate-50 hover:bg-white transition-all cursor-pointer text-center group shadow-xs hover:shadow-md"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-rose-50 border border-rose-200 text-[#8b0000] flex items-center justify-center group-hover:scale-110 transition-transform">
              <HeartPulse className="w-5 h-5 text-rose-700" />
            </div>
            <div className="font-bold text-xs text-slate-900 mt-2.5">
              Blood Bank
            </div>
            <div className="text-[10px] text-rose-700 font-semibold mt-0.5">
              {totalMembers} Donors
            </div>
          </div>
        </div>
      </div>

      {/* Unit Breakdown & Renewal Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Unit Strength Breakdown */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#8b0000]" />
              <h4 className="font-display font-bold text-base text-slate-900">
                Unit Distribution &amp; Operational Strength
              </h4>
            </div>
            <span className="text-xs font-semibold text-slate-500">
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
                    ? 'border-[#8b0000] bg-rose-50/50 shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#8b0000]" />
                    <span>{u.name} Unit</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-mono">
                    {u.count} members
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Active: {u.active} ({u.count > 0 ? Math.round((u.active / u.count) * 100) : 0}%)</span>
                    <span>{u.percentage}% of KCA</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-[#8b0000]"
                      style={{
                        width: `${u.percentage}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Net Cash:</span>
                  <span className={`font-mono font-bold ${u.netCash >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatAED(u.netCash)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Renewals & Attention Needed Widget */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h4 className="font-display font-bold text-sm text-slate-900">
                  Renewals Due ({expiringMembers.length})
                </h4>
              </div>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
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
                    className="p-2.5 rounded-lg border border-amber-200 hover:border-amber-400 bg-amber-50/50 hover:bg-amber-100/50 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {m.fullName}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {m.membershipId} &bull; {m.unit}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0 bg-amber-100 border border-amber-300 text-amber-800">
                      {status.isExpired ? 'Expired' : `${status.daysRemaining}d left`}
                    </span>
                  </div>
                );
              })}

              {expiringMembers.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                  All membership cards in {activeUnitFilter} unit are currently active.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigateTab && onNavigateTab('members')}
              className="w-full py-2 px-3 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Manage All Renewals</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
