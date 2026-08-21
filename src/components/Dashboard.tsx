import React, { useState, useMemo } from 'react';
import { Member, UserSession, hasAdminPrivilege, isUnitOperatorRole } from '../types/member';
import { FinanceTransaction } from '../types/finance';
import { InventoryItem, InventoryMovementLog } from '../types/inventory';
import { CulturalClass, ClassParticipant } from '../types/classes';
import { formatAED, formatDate, getExpiryStatus, formatCardBloodGroup } from '../utils/idGenerator';
import { OfficialKcaHeaderBanner } from './Logo';
import { downloadComprehensiveDashboardPdf } from '../utils/dashboardReportGenerator';
import {
  Users,
  HeartPulse,
  IdCard,
  BarChart3,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  Receipt,
  Download,
  Building2,
  FileText,
  MapPin,
  ArrowRight,
  GraduationCap,
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
  onNavigateTab?: (tab: 'dashboard' | 'members' | 'idcards' | 'finance' | 'inventory' | 'classes' | 'blood' | 'backup' | 'verify') => void;
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

  // Active Scope Filter & Interactive Pillar Tabs
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

  const [activePillarTab, setActivePillarTab] = useState<'overview' | 'membership' | 'finance' | 'inventory' | 'bloodbank'>('overview');
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
  const activeMembersCount = displayedMembers.filter((m) => m.status === 'Active' && !getExpiryStatus(m.expiryDate).isExpired).length;
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
  
  // Membership fees collected: for local units, do NOT include Central Committee member fees; for Central, include all CC member fees
  const membershipFeesCollectedAED = useMemo(() => {
    if (activeUnitFilter === 'All') {
      return members.reduce((sum, m) => sum + (m.feeAmountAED || 0), 0);
    }
    const isCentral = activeUnitFilter.toLowerCase().startsWith('central');
    if (isCentral) {
      return members
        .filter((m) => m.membershipType === 'Central Committee Member' || m.unit.toLowerCase().startsWith('central'))
        .reduce((sum, m) => sum + (m.feeAmountAED || 0), 0);
    }
    return members
      .filter((m) => m.unit.toLowerCase() === activeUnitFilter.toLowerCase() && m.membershipType !== 'Central Committee Member')
      .reduce((sum, m) => sum + (m.feeAmountAED || 0), 0);
  }, [members, activeUnitFilter]);

  // 3. Inventory Metrics
  const totalAssetsCount = displayedInventory.length;
  const availableQuantitySum = displayedInventory.reduce((sum, i) => sum + (i.availableQuantity || 0), 0);
  const issuedQuantitySum = displayedInventory.reduce((sum, i) => sum + (i.issuedQuantity || 0), 0);
  const totalInventoryValuationAED = displayedInventory.reduce(
    (sum, i) => sum + (i.purchasePriceAED ? i.purchasePriceAED * i.totalQuantity : 0),
    0
  );

  // 4. Blood Bank Metrics
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
    
    // For local units, Central Committee member payments are credited to Central
    const collections = isCentral
      ? members.filter((m) => m.membershipType === 'Central Committee Member' || m.unit.toLowerCase().startsWith('central')).reduce((sum, m) => sum + (m.feeAmountAED || 0), 0)
      : uMembers.filter((m) => m.membershipType !== 'Central Committee Member').reduce((sum, m) => sum + (m.feeAmountAED || 0), 0);

    const active = uMembers.filter((m) => m.status === 'Active' && !getExpiryStatus(m.expiryDate).isExpired).length;
    const expired = count - active;
    const uFinance = financeTransactions.filter((f) => {
      if (isCentral) return f.unit.toLowerCase().startsWith('central');
      return f.unit.toLowerCase() === u.toLowerCase();
    });
    const uIncome = uFinance.filter((f) => f.type === 'INCOME').reduce((sum, f) => sum + (f.amountAED || 0), 0);
    const uExpense = uFinance.filter((f) => f.type === 'EXPENSE').reduce((sum, f) => sum + (f.amountAED || 0), 0);
    const uInventory = inventoryItems.filter((i) => {
      if (isCentral) return i.unit.toLowerCase().startsWith('central');
      return i.unit.toLowerCase() === u.toLowerCase();
    });
    const pct = members.length > 0 ? Math.round((count / members.length) * 100) : 0;

    return {
      name: u,
      count,
      collections,
      active,
      expired,
      uIncome,
      uExpense,
      netCash: uIncome - uExpense,
      inventoryCount: uInventory.length,
      percentage: pct,
    };
  }).sort((a, b) => b.count - a.count);

  // Handle Instant Comprehensive PDF Dashboard Export
  const handleGenerateDashboardReport = () => {
    try {
      setIsExportingReport(true);
      downloadComprehensiveDashboardPdf({
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
                  {userSession.unit} Unit Management Portal
                </h3>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded">
                  Operator Role
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Logged in as <strong>{userSession.fullName}</strong>. Viewing filtered registers for <strong>{userSession.unit} Unit</strong>.
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

      {/* Interactive Control & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Left: Unit Scope Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 shrink-0">
            <Building2 className="w-4 h-4" style={{ color: 'var(--color-primary, #881337)' }} />
            <span>Unit Scope:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveUnitFilter('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeUnitFilter === 'All'
                  ? 'text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                style={activeUnitFilter === u.name ? { backgroundColor: 'var(--color-primary, #881337)' } : undefined}
              >
                {u.name} ({u.count})
              </button>
            ))}
          </div>
        </div>

        {/* Right: Instant Management Report Generators */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateDashboardReport}
            disabled={isExportingReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Download Consolidated 4-Pillar Executive Report (PDF)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingReport ? 'Compiling PDF...' : 'Executive Report (PDF)'}</span>
          </button>

          {onOpenReportGenerator && (
            <button
              onClick={onOpenReportGenerator}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              <span>Advanced Reports</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Interactive Pillars Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: Membership Directory */}
        <div
          onClick={() => setActivePillarTab('membership')}
          className={`p-5 rounded-xl border transition-all cursor-pointer group ${
            activePillarTab === 'membership'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-400 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pillar I &bull; Membership
            </span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${activePillarTab === 'membership' ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'}`}>
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-bold text-2xl mt-2 tracking-tight">
            {totalMembers} <span className="text-xs font-normal opacity-80">Members</span>
          </div>
          <div className="text-xs font-medium opacity-75 mt-1">
            {activeMembersCount} Active Cards &bull; {expiringMembers.length} Renewals Due
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/20 flex items-center justify-between text-[11px] font-semibold group-hover:underline" style={{ color: 'var(--color-primary, #881337)' }}>
            <span>{activeUnitFilter === 'All' ? 'Fujairah Total' : `${activeUnitFilter} Unit`}</span>
            <span>View Pillar &rarr;</span>
          </div>
        </div>

        {/* Pillar 2: Finance & Cash Flow */}
        <div
          onClick={() => setActivePillarTab('finance')}
          className={`p-5 rounded-xl border transition-all cursor-pointer group ${
            activePillarTab === 'finance'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500'
              : 'bg-white text-slate-900 border-slate-200 hover:border-emerald-600 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Pillar II &bull; Finance Ledger
            </span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${activePillarTab === 'finance' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-2xl mt-2 text-emerald-600">
            {formatAED(netCashFlowAED)}
          </div>
          <div className="text-xs font-medium opacity-75 mt-1">
            Inc: {formatAED(totalIncomeAED)} &bull; Exp: {formatAED(totalExpenseAED)}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/20 flex items-center justify-between text-[11px] font-semibold text-emerald-600 group-hover:underline">
            <span>{displayedFinance.length} Vouchers Recorded</span>
            <span>View Ledger &rarr;</span>
          </div>
        </div>

        {/* Pillar 3: Inventory & Equipment */}
        <div
          onClick={() => setActivePillarTab('inventory')}
          className={`p-5 rounded-xl border transition-all cursor-pointer group ${
            activePillarTab === 'inventory'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-blue-500'
              : 'bg-white text-slate-900 border-slate-200 hover:border-blue-600 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              Pillar III &bull; Asset Inventory
            </span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${activePillarTab === 'inventory' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-bold text-2xl mt-2">
            {totalAssetsCount} <span className="text-xs font-normal opacity-80">Asset Types</span>
          </div>
          <div className="text-xs font-medium opacity-75 mt-1">
            {availableQuantitySum} in Stock &bull; {issuedQuantitySum} Issued in Use
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/20 flex items-center justify-between text-[11px] font-semibold text-blue-600 group-hover:underline">
            <span>Valuation: {formatAED(totalInventoryValuationAED)}</span>
            <span>View Assets &rarr;</span>
          </div>
        </div>

        {/* Pillar 4: Blood Bank Standby */}
        <div
          onClick={() => setActivePillarTab('bloodbank')}
          className={`p-5 rounded-xl border transition-all cursor-pointer group ${
            activePillarTab === 'bloodbank'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-rose-500'
              : 'bg-white text-slate-900 border-slate-200 hover:border-rose-600 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              Pillar IV &bull; Blood Bank
            </span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${activePillarTab === 'bloodbank' ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-bold text-2xl mt-2 text-rose-700">
            {totalMembers} <span className="text-xs font-normal opacity-80">Donors</span>
          </div>
          <div className="text-xs font-medium opacity-75 mt-1">
            8 Blood Groups &bull; Emergency Standby
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/20 flex items-center justify-between text-[11px] font-semibold text-rose-700 group-hover:underline">
            <span>Standby Directory</span>
            <span>View Donors &rarr;</span>
          </div>
        </div>
      </div>

      {/* Interactive Navigation Tabs for Dashboard Deep-Dive */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActivePillarTab('overview')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activePillarTab === 'overview'
              ? 'text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          style={activePillarTab === 'overview' ? { backgroundColor: 'var(--color-primary, #881337)' } : undefined}
        >
          Consolidated Matrix
        </button>

        <button
          onClick={() => setActivePillarTab('membership')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activePillarTab === 'membership'
              ? 'text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          style={activePillarTab === 'membership' ? { backgroundColor: 'var(--color-primary, #881337)' } : undefined}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Membership &amp; Renewals</span>
        </button>

        <button
          onClick={() => setActivePillarTab('finance')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activePillarTab === 'finance'
              ? 'text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          style={activePillarTab === 'finance' ? { backgroundColor: 'var(--color-primary, #881337)' } : undefined}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Finance &amp; Ledgers</span>
        </button>

        <button
          onClick={() => setActivePillarTab('inventory')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activePillarTab === 'inventory'
              ? 'text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          style={activePillarTab === 'inventory' ? { backgroundColor: 'var(--color-primary, #881337)' } : undefined}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Asset Inventory</span>
        </button>

        <button
          onClick={() => setActivePillarTab('bloodbank')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activePillarTab === 'bloodbank'
              ? 'text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          style={activePillarTab === 'bloodbank' ? { backgroundColor: 'var(--color-primary, #881337)' } : undefined}
        >
          <HeartPulse className="w-3.5 h-3.5" />
          <span>Blood Bank</span>
        </button>
      </div>

      {/* QUICK ACCESS ACTION STRIP */}
      <div
        className="p-5 rounded-xl text-white shadow-xs border border-black/15 transition-colors"
        style={{ backgroundColor: 'var(--color-primary, #881337)' }}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-lg text-white">
              {isUnitOp && userSession?.unit ? `KCA ${userSession.unit} Operations Center` : 'KCA Fujairah Central Executive Operations'}
            </h3>
            <p className="text-xs text-white/85 mt-1 max-w-xl">
              One-click access to register members, issue ID cards, log financial receipts/vouchers, audit equipment, and generate PDF registers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenNewMember}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white text-slate-900 text-xs font-bold hover:bg-slate-50 transition-colors shadow-xs cursor-pointer active:scale-95"
              style={{ color: 'var(--color-primary, #881337)' }}
            >
              <Users className="w-4 h-4" />
              <span>Register Member</span>
            </button>

            {onOpenNewFinance && (
              <button
                onClick={onOpenNewFinance}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors border border-white/25 shadow-xs cursor-pointer"
              >
                <Receipt className="w-4 h-4 text-amber-300" />
                <span>Record Voucher</span>
              </button>
            )}

            <button
              onClick={onOpenBatchPrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors border border-white/20 shadow-xs cursor-pointer"
            >
              <IdCard className="w-4 h-4" />
              <span>Batch ID Cards</span>
            </button>

            <button
              onClick={handleGenerateDashboardReport}
              disabled={isExportingReport}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors border border-emerald-600 shadow-xs cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>{isExportingReport ? 'Exporting...' : 'Export Management PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW SECTION 1: CONSOLIDATED CROSS-PILLAR MATRIX */}
      {(activePillarTab === 'overview' || activePillarTab === 'membership') && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" style={{ color: 'var(--color-primary, #881337)' }} />
              <div>
                <h4 className="font-display font-bold text-base text-slate-900">
                  Comprehensive Unit Performance &amp; Operational Matrix
                </h4>
                <p className="text-xs text-slate-500">
                  Consolidation of membership, subscription fees, net financial position, and asset distribution
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerateDashboardReport}
              className="text-xs font-bold hover:underline cursor-pointer flex items-center gap-1"
              style={{ color: 'var(--color-primary, #881337)' }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Matrix PDF</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Unit / Zone</th>
                  <th className="p-3 text-center">Members</th>
                  <th className="p-3 text-center">Active Cards</th>
                  <th className="p-3 text-center">Renewals</th>
                  <th className="p-3 text-right">Fee Collections</th>
                  <th className="p-3 text-right">Net Cash (AED)</th>
                  <th className="p-3 text-center">Equipment Types</th>
                  <th className="p-3 text-right">Quick Filter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unitStats.map((u) => (
                  <tr key={u.name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--color-primary, #881337)' }} />
                        <span>{u.name} Unit</span>
                      </div>
                    </td>

                    <td className="p-3 text-center font-bold text-slate-900">
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-xs">
                        {u.count}
                      </span>
                    </td>

                    <td className="p-3 text-center font-semibold text-emerald-700">
                      {u.active} active
                    </td>

                    <td className="p-3 text-center">
                      {u.expired > 0 ? (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {u.expired} due
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {formatAED(u.collections)}
                    </td>

                    <td className="p-3 text-right font-mono font-bold">
                      <span className={u.netCash >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {formatAED(u.netCash)}
                      </span>
                    </td>

                    <td className="p-3 text-center font-mono text-slate-700">
                      {u.inventoryCount} items
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() => setActiveUnitFilter(u.name)}
                        className="text-xs font-semibold hover:underline cursor-pointer"
                        style={{ color: 'var(--color-primary, #881337)' }}
                      >
                        Filter Unit &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300">
                <tr>
                  <td className="p-3 text-slate-900">TOTAL CONSOLIDATED</td>
                  <td className="p-3 text-center font-mono text-xs" style={{ color: 'var(--color-primary, #881337)' }}>{members.length}</td>
                  <td className="p-3 text-center font-mono text-emerald-700">{activeMembersCount}</td>
                  <td className="p-3 text-center font-mono text-amber-700">{expiringMembers.length}</td>
                  <td className="p-3 text-right font-mono text-slate-900 text-xs">
                    {formatAED(members.reduce((sum, m) => sum + (m.feeAmountAED || 0), 0))}
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-700 text-xs">
                    {formatAED(financeTransactions.filter((f) => f.type === 'INCOME').reduce((sum, f) => sum + (f.amountAED || 0), 0) - financeTransactions.filter((f) => f.type === 'EXPENSE').reduce((sum, f) => sum + (f.amountAED || 0), 0))}
                  </td>
                  <td className="p-3 text-center font-mono">{inventoryItems.length} items</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={handleGenerateDashboardReport}
                      className="text-xs hover:underline font-bold"
                      style={{ color: 'var(--color-primary, #881337)' }}
                    >
                      Export PDF
                    </button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* VIEW SECTION 2: FINANCE OVERVIEW & RECENT VOUCHERS */}
      {(activePillarTab === 'overview' || activePillarTab === 'finance') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-700" />
                <h4 className="font-display font-bold text-base text-slate-900">
                  Recent Finance Vouchers &amp; Receipts ({activeUnitFilter})
                </h4>
              </div>

              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('finance')}
                  className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Open Full Finance Ledger</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Voucher / Receipt No</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Party / Beneficiary</th>
                    <th className="p-2.5 text-right">Amount (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedFinance.slice(0, 5).map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-900">{f.receiptNumber}</td>
                      <td className="p-2.5 text-slate-600">{formatDate(f.date)}</td>
                      <td className="p-2.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.type === 'INCOME'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {f.type === 'INCOME' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {f.type}
                        </span>
                      </td>
                      <td className="p-2.5 font-medium text-slate-700 truncate max-w-[150px]">{f.category}</td>
                      <td className="p-2.5 text-slate-600 truncate max-w-[140px]">{f.partyName}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        {formatAED(f.amountAED)}
                      </td>
                    </tr>
                  ))}
                  {displayedFinance.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-400">
                        No financial vouchers logged for {activeUnitFilter} unit.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-xs space-y-3">
              <h4 className="font-display font-bold text-sm text-amber-300">
                Finance Summary ({activeUnitFilter})
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Total Income</span>
                  <span className="font-mono font-bold text-emerald-400">{formatAED(totalIncomeAED)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Total Expenses</span>
                  <span className="font-mono font-bold text-rose-400">{formatAED(totalExpenseAED)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Member Fee Dues</span>
                  <span className="font-mono font-bold text-amber-300">{formatAED(membershipFeesCollectedAED)}</span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-bold">
                  <span className="text-white">Net Balance</span>
                  <span className="font-mono text-emerald-400">{formatAED(netCashFlowAED)}</span>
                </div>
              </div>

              {onOpenNewFinance && (
                <button
                  onClick={onOpenNewFinance}
                  className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  + Record New Transaction
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW SECTION 3: INVENTORY ASSET STATUS & RECENT MOVEMENTS */}
      {(activePillarTab === 'overview' || activePillarTab === 'inventory') && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-display font-bold text-base text-slate-900">
                  Equipment Asset Inventory &amp; Stock Availability ({activeUnitFilter})
                </h4>
                <p className="text-xs text-slate-500">
                  Real-time stock status, physical condition, and equipment custody records
                </p>
              </div>
            </div>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('inventory')}
                className="text-xs text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Open Full Inventory Manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {displayedInventory.slice(0, 4).map((item) => (
              <div key={item.id} className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--color-primary, #881337)' }}>{item.itemCode}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.status === 'In Stock' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {item.status}
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-900 truncate">{item.name}</div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>Unit: {item.unit}</span>
                  <span className="font-semibold text-slate-800">{item.availableQuantity} / {item.totalQuantity} {item.unitOfMeasure}</span>
                </div>
              </div>
            ))}
            {displayedInventory.length === 0 && (
              <div className="col-span-4 py-6 text-center text-xs text-slate-400">
                No inventory assets registered under {activeUnitFilter} unit.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW SECTION 4: BLOOD BANK STANDBY DONOR DIRECTORY */}
      {(activePillarTab === 'overview' || activePillarTab === 'bloodbank') && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-700" />
              <div>
                <h4 className="font-display font-bold text-base text-slate-900">
                  Blood Donors Availability Standby Directory ({activeUnitFilter === 'All' ? 'All Fujairah Units' : `${activeUnitFilter} Unit`})
                </h4>
                <p className="text-xs text-slate-500">
                  Community standby registry for emergency blood donations across hospitals in UAE
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenBloodDirectory('ALL')}
              className="text-xs font-bold text-rose-700 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Open Blood Helpline &rarr;</span>
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {Object.entries(bloodCounts).map(([group, count]) => (
              <div
                key={group}
                onClick={() => onOpenBloodDirectory(group)}
                className="p-3 rounded-xl bg-red-50/60 border border-red-100 text-center hover:border-slate-400 hover:bg-red-50 transition-all cursor-pointer group"
                title={`View all ${count} donors with ${group} blood group`}
              >
                <div className="font-mono font-bold text-sm group-hover:scale-105 transition-transform" style={{ color: 'var(--color-primary, #881337)' }}>
                  {formatCardBloodGroup(group)}
                </div>
                <div className="font-display font-bold text-xl text-slate-900 mt-1">
                  {count}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">donors</div>
              </div>
            ))}
          </div>

          {/* Quick Donors List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {displayedMembers.slice(0, 4).map((m) => (
              <div
                key={m.id}
                onClick={() => handleSelectMember(m)}
                className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 truncate">{m.fullName}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{m.phoneUAE} &bull; {m.unit}</div>
                </div>
                <span className="font-mono font-bold text-xs bg-red-100 px-2 py-0.5 rounded shrink-0" style={{ color: 'var(--color-primary, #881337)' }}>
                  {m.bloodGroup}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
