import React, { useState, useMemo } from 'react';
import {
  FinanceTransaction,
  TransactionType,
  FinancialParticular,
  UnitCashBalance,
} from '../types/finance';
import { UserSession, hasAdminPrivilege, isUnitOperatorRole, isCentralAdminSession } from '../types/member';
import { formatAED, formatDate } from '../utils/idGenerator';
import {
  exportFinanceCsv,
  loadFinancialParticulars,
  saveFinancialParticulars,
  loadUnitCashBalances,
  saveUnitCashBalances,
  getNextReceiptNumber,
} from '../utils/financeStorage';
import { FinanceReportExportModal } from './FinanceReportExportModal';
import { ParticularsManagerModal } from './ParticularsManagerModal';
import { UnitCashLedgerModal } from './UnitCashLedgerModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { DirhamIcon } from './DirhamIcon';

import {
  TrendingUp,
  TrendingDown,
  PlusCircle,
  Search,
  Download,
  Printer,
  FileText,
  Building2,
  Trash2,
  Edit2,
  ArrowUpDown,
  X,
  FolderTree,
  Wallet,
  CheckCircle2,
  Clock,
  ArrowRight,
  PieChart,
  BarChart3,
  ListFilter,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FinanceViewProps {
  transactions: FinanceTransaction[];
  units: string[];
  userSession: UserSession | null;
  onOpenNewTransaction: (type?: TransactionType) => void;
  onEditTransaction: (transaction: FinanceTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onViewReceipt: (transaction: FinanceTransaction) => void;
  onSaveTransactions?: (transactions: FinanceTransaction[]) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  transactions,
  units,
  userSession,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onViewReceipt,
  onSaveTransactions,
}) => {
  const isCentralAdmin = isCentralAdminSession(userSession);
  const isUnitScopedUser = !isCentralAdmin;
  const assignedUnit = userSession?.unit || (isUnitScopedUser ? 'Fujairah' : undefined);
  const isAdmin = !userSession || hasAdminPrivilege(userSession.role);

  // Complete list of units for finance including "Central"
  const financeUnits = useMemo(() => {
    const list = [...units.filter((u) => !u.toLowerCase().startsWith('central'))];
    list.push('Central');
    return list;
  }, [units]);

  // Master Particulars & Unit Balances State
  const [particulars, setParticulars] = useState<FinancialParticular[]>(() =>
    loadFinancialParticulars()
  );
  const [unitBalances, setUnitBalances] = useState<UnitCashBalance[]>(() =>
    loadUnitCashBalances()
  );

  // Sub-Modals
  const [showParticularsModal, setShowParticularsModal] = useState(false);
  const [showUnitLedgerModal, setShowUnitLedgerModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<FinanceTransaction | null>(null);

  // View Tab: 'ledger' | 'cashflow_drilldown'
  const [activeFinanceTab, setActiveFinanceTab] = useState<'ledger' | 'cashflow_drilldown'>('ledger');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | TransactionType>('ALL');
  const [selectedUnit, setSelectedUnit] = useState<string>(
    isUnitScopedUser && assignedUnit ? assignedUnit : 'ALL'
  );
  const [selectedMainParticularId, setSelectedMainParticularId] = useState<string>('ALL');
  const [selectedSubParticularId, setSelectedSubParticularId] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'date' | 'amountAED' | 'receiptNumber'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter visible transactions (strictly enforces unit operator role access)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Unit scoping for operators: ONLY see their own unit's transactions
      if (isUnitScopedUser && assignedUnit) {
        if (t.unit.toLowerCase().trim() !== assignedUnit.toLowerCase().trim()) {
          return false;
        }
      }

      // Unit filter for Admins (Central matches Central / Central Committee)
      if (selectedUnit !== 'ALL') {
        const isCentralFilter = selectedUnit.toLowerCase().startsWith('central');
        if (isCentralFilter) {
          if (!t.unit.toLowerCase().startsWith('central')) return false;
        } else if (t.unit.toLowerCase() !== selectedUnit.toLowerCase()) {
          return false;
        }
      }

      // Type filter
      if (selectedType !== 'ALL' && t.type !== selectedType) {
        return false;
      }

      // Main Particular Filter
      if (selectedMainParticularId !== 'ALL') {
        const matchesMainId = t.mainParticularId === selectedMainParticularId;
        const mainObj = particulars.find((p) => p.id === selectedMainParticularId);
        const matchesCatName = mainObj && t.category === mainObj.name;
        if (!matchesMainId && !matchesCatName) {
          return false;
        }
      }

      // Sub Particular Filter
      if (selectedSubParticularId !== 'ALL') {
        const matchesSubId = t.subParticularId === selectedSubParticularId;
        if (!matchesSubId) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNo = (t.receiptNumber || '').toLowerCase().includes(q);
        const matchesParticulars = (t.particulars || '').toLowerCase().includes(q);
        const matchesParty = (t.partyName || '').toLowerCase().includes(q);
        const matchesCategory = (t.category || '').toLowerCase().includes(q);
        const matchesUnit = (t.unit || '').toLowerCase().includes(q);
        const matchesRef = (t.referenceNumber || '').toLowerCase().includes(q);
        const matchesNotes = (t.notes || '').toLowerCase().includes(q);
        return (
          matchesNo ||
          matchesParticulars ||
          matchesParty ||
          matchesCategory ||
          matchesUnit ||
          matchesRef ||
          matchesNotes
        );
      }

      return true;
    });
  }, [
    transactions,
    isUnitScopedUser,
    assignedUnit,
    selectedUnit,
    selectedType,
    selectedMainParticularId,
    selectedSubParticularId,
    particulars,
    searchQuery,
  ]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'amountAED') {
        return sortOrder === 'asc' ? a.amountAED - b.amountAED : b.amountAED - a.amountAED;
      }

      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTransactions, sortField, sortOrder]);

  // Totals calculations based on unit-scoped view
  const scopedBaseTransactions = useMemo(() => {
    if (isUnitScopedUser && assignedUnit) {
      return transactions.filter(
        (t) => t.unit.toLowerCase().trim() === assignedUnit.toLowerCase().trim()
      );
    }
    return transactions;
  }, [transactions, isUnitScopedUser, assignedUnit]);

  const totalIncome = useMemo(() => {
    return scopedBaseTransactions
      .filter((t) => t.type === 'INCOME' && t.status !== 'Cancelled')
      .reduce((sum, t) => sum + (t.amountAED || 0), 0);
  }, [scopedBaseTransactions]);

  const totalExpense = useMemo(() => {
    return scopedBaseTransactions
      .filter((t) => t.type === 'EXPENSE' && t.status !== 'Cancelled')
      .reduce((sum, t) => sum + (t.amountAED || 0), 0);
  }, [scopedBaseTransactions]);

  const netBalance = totalIncome - totalExpense;

  // Unit-wise summaries
  const unitSummaries = useMemo(() => {
    const map: Record<string, { income: number; expense: number; count: number }> = {};
    financeUnits.forEach((u) => {
      map[u] = { income: 0, expense: 0, count: 0 };
    });

    transactions.forEach((t) => {
      if (t.status === 'Cancelled') return;
      const targetUnit = t.unit.toLowerCase().startsWith('central') ? 'Central' : t.unit;
      if (!map[targetUnit]) {
        map[targetUnit] = { income: 0, expense: 0, count: 0 };
      }
      map[targetUnit].count += 1;
      if (t.type === 'INCOME') {
        map[targetUnit].income += t.amountAED || 0;
      } else {
        map[targetUnit].expense += t.amountAED || 0;
      }
    });

    return map;
  }, [transactions, financeUnits]);

  // Save updated particulars
  const handleSaveParticulars = (newParticulars: FinancialParticular[]) => {
    setParticulars(newParticulars);
    saveFinancialParticulars(newParticulars);
  };

  // Save updated unit balances
  const handleSaveUnitBalances = (newBalances: UnitCashBalance[]) => {
    setUnitBalances(newBalances);
    saveUnitCashBalances(newBalances);
  };

  // Single-Click Convert Invoice to Official Receipt
  const handleConvertInvoiceToReceipt = (invoice: FinanceTransaction) => {
    if (!onSaveTransactions) return;
    const newRecNo = getNextReceiptNumber(transactions, 'INCOME', invoice.unit, false);

    const updatedTx: FinanceTransaction = {
      ...invoice,
      receiptNumber: newRecNo,
      type: 'INCOME',
      isInvoice: false,
      isInvoiceConvertedToReceipt: true,
      convertedReceiptNumber: newRecNo,
      convertedAt: new Date().toISOString(),
      status: 'Completed',
      notes: `${invoice.notes || ''} [Converted from Invoice #${invoice.receiptNumber} on ${new Date().toLocaleDateString()}]`.trim(),
      updatedAt: new Date().toISOString(),
    };

    const updatedList = transactions.map((t) => (t.id === invoice.id ? updatedTx : t));
    onSaveTransactions(updatedList);

    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } catch (_) {}

    onViewReceipt(updatedTx);
  };

  const handleSort = (field: 'date' | 'amountAED' | 'receiptNumber') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Drill-down particulars list for cashflow reporting tab
  const mainParticularsList = useMemo(() => {
    return particulars.filter((p) => !p.parentId);
  }, [particulars]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#881337] text-white shadow-xs">
              <DirhamIcon className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white tracking-tight">
                Finance &amp; Treasury Ledger (AED)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isUnitScopedUser && assignedUnit ? (
                  <span>
                    <strong>{assignedUnit} Unit Scope</strong>: Managing vouchers, receipts &amp; petty cash for {assignedUnit}.
                  </span>
                ) : (
                  <span>
                    Official Multi-Unit Accounts, Hierarchy Particulars &amp; Cashflow Drill-down.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Modal Triggers */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Master Particulars Creator */}
          <button
            onClick={() => setShowParticularsModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer"
            title="Configure Master Particulars Hierarchy"
          >
            <FolderTree className="w-4 h-4 text-[#881337] dark:text-rose-400" />
            <span>Particulars Creator</span>
          </button>

          {/* Unit Cash-in-Balance Management */}
          <button
            onClick={() => setShowUnitLedgerModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer"
            title={isUnitScopedUser && assignedUnit ? `Manage ${assignedUnit} Cash-in-Hand & Balance` : "Manage Unit Cash-in-Hand & Balances"}
          >
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>{isUnitScopedUser && assignedUnit ? `${assignedUnit} Cash Balance` : 'Unit Cash Balances'}</span>
          </button>

          {/* New Income Receipt */}
          <button
            onClick={() => onOpenNewTransaction('INCOME')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Record New Income (Official Receipt)"
          >
            <PlusCircle className="w-4 h-4 text-emerald-200" />
            <span>+ Official Receipt</span>
          </button>

          {/* New Expense Payment */}
          <button
            onClick={() => onOpenNewTransaction('EXPENSE')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#881337] hover:bg-[#700f2b] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Record New Expense (Payment Voucher)"
          >
            <PlusCircle className="w-4 h-4 text-rose-200" />
            <span>- Payment Voucher</span>
          </button>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Income */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isUnitScopedUser && assignedUnit ? `${assignedUnit} Total Income` : 'Total Income Received'}
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="font-mono font-black text-2xl text-emerald-700 dark:text-emerald-400 mt-2">
            {formatAED(totalIncome)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {scopedBaseTransactions.filter((t) => t.type === 'INCOME').length} receipts issued {isUnitScopedUser && assignedUnit ? `for ${assignedUnit}` : ''}
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isUnitScopedUser && assignedUnit ? `${assignedUnit} Total Expenses` : 'Total Expenses Disbursed'}
            </span>
            <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="font-mono font-black text-2xl text-rose-700 dark:text-rose-400 mt-2">
            {formatAED(totalExpense)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {scopedBaseTransactions.filter((t) => t.type === 'EXPENSE').length} vouchers recorded {isUnitScopedUser && assignedUnit ? `for ${assignedUnit}` : ''}
          </div>
        </div>

        {/* Net Treasury Balance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isUnitScopedUser && assignedUnit ? `${assignedUnit} Net Balance` : 'Net Surplus / Treasury Balance'}
            </span>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <DirhamIcon className="w-4 h-4 text-blue-700 dark:text-blue-300" />
            </span>
          </div>
          <div
            className={`font-mono font-black text-2xl mt-2 ${
              netBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-700'
            }`}
          >
            {formatAED(netBalance)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {netBalance >= 0
              ? isUnitScopedUser && assignedUnit
                ? `Net operational surplus for ${assignedUnit}`
                : 'Net positive liquidity across accounts'
              : `Deficit across ${isUnitScopedUser && assignedUnit ? assignedUnit : 'recorded'} ledger`}
          </div>
        </div>
      </div>

      {/* Primary Tab Switcher: Full Ledger vs Cashflow Drill-down */}
      <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveFinanceTab('ledger')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFinanceTab === 'ledger'
                ? 'bg-white dark:bg-slate-900 text-[#881337] dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>
              {isUnitScopedUser && assignedUnit
                ? `${assignedUnit} Ledger (${filteredTransactions.length})`
                : `Complete Financial Ledger (${filteredTransactions.length})`}
            </span>
          </button>

          <button
            onClick={() => setActiveFinanceTab('cashflow_drilldown')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFinanceTab === 'cashflow_drilldown'
                ? 'bg-white dark:bg-slate-900 text-[#881337] dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{isUnitScopedUser && assignedUnit ? `${assignedUnit} Particulars Drill-Down` : 'Cashflow Particulars Drill-Down'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#881337]" />
            <span>Export Statement</span>
          </button>

          <button
            onClick={() => exportFinanceCsv(filteredTransactions)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* TAB 1: FULL FINANCIAL LEDGER */}
      {activeFinanceTab === 'ledger' && (
        <div className="space-y-4">
          {/* Unit-Wise Summary Ribbon for Admins Only */}
          {!isUnitScopedUser && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#881337]" />
                  <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    Unit-Wise Balance Strip
                  </h3>
                </div>
                {selectedUnit !== 'ALL' && (
                  <button
                    onClick={() => setSelectedUnit('ALL')}
                    className="text-[11px] text-[#881337] dark:text-rose-400 font-bold hover:underline"
                  >
                    Reset to All Units
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {financeUnits.map((u) => {
                  const summary = unitSummaries[u] || { income: 0, expense: 0, count: 0 };
                  const unitNet = summary.income - summary.expense;
                  const isSelected = selectedUnit === u;

                  return (
                    <button
                      key={u}
                      onClick={() => setSelectedUnit(isSelected ? 'ALL' : u)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-rose-950 dark:border-rose-800 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs truncate">{u}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {summary.count} txns
                        </span>
                      </div>
                      <div className="mt-2 space-y-0.5 text-[10px]">
                        <div className="flex justify-between">
                          <span className={isSelected ? 'text-white/70' : 'text-slate-500'}>In:</span>
                          <span className="font-bold font-mono text-emerald-500">{formatAED(summary.income)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isSelected ? 'text-white/70' : 'text-slate-500'}>Out:</span>
                          <span className="font-bold font-mono text-rose-400">{formatAED(summary.expense)}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200/40">
                          <span className={isSelected ? 'text-white/70' : 'text-slate-500'}>Net:</span>
                          <span
                            className={`font-bold font-mono ${
                              unitNet >= 0
                                ? isSelected
                                  ? 'text-amber-300'
                                  : 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {formatAED(unitNet)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter Bar with Main & Sub Particulars Selector */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Search Box */}
              <div className="sm:col-span-4 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search receipt #, party, details, notes..."
                  className="w-full pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#881337]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Type Filter */}
              <div className="sm:col-span-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="w-full py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold outline-none"
                >
                  <option value="ALL">All Types</option>
                  <option value="INCOME">Income (Receipts)</option>
                  <option value="EXPENSE">Expense (Vouchers)</option>
                </select>
              </div>

              {/* Main Particular Filter */}
              <div className="sm:col-span-3">
                <select
                  value={selectedMainParticularId}
                  onChange={(e) => {
                    setSelectedMainParticularId(e.target.value);
                    setSelectedSubParticularId('ALL');
                  }}
                  className="w-full py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold outline-none"
                >
                  <option value="ALL">All Particular Heads</option>
                  {mainParticularsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.code ? `(${p.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub Particular Filter */}
              <div className="sm:col-span-3">
                <select
                  value={selectedSubParticularId}
                  onChange={(e) => setSelectedSubParticularId(e.target.value)}
                  disabled={selectedMainParticularId === 'ALL'}
                  className="w-full py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold outline-none disabled:opacity-40"
                >
                  <option value="ALL">All Sub-Particulars</option>
                  {particulars
                    .filter((p) => p.parentId === selectedMainParticularId)
                    .map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Financial Transactions Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-700 select-none">
                  <tr>
                    <th
                      onClick={() => handleSort('receiptNumber')}
                      className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Doc No</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('date')}
                      className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Date</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Unit</th>
                    <th className="p-3.5 min-w-[200px]">Particulars &amp; Head</th>
                    <th className="p-3.5">Party / Beneficiary</th>
                    <th className="p-3.5">Mode</th>
                    <th
                      onClick={() => handleSort('amountAED')}
                      className="p-3.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Amount (AED)</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="p-3.5 text-center">Receipt &amp; Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sortedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-slate-500 dark:text-slate-400">
                        No financial records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    sortedTransactions.map((t) => {
                      const isIncome = t.type === 'INCOME';
                      const isInvoice = !!t.isInvoice;

                      return (
                        <tr
                          key={t.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Voucher Number */}
                          <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-xs border font-mono ${
                                isInvoice
                                  ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {t.receiptNumber}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="p-3.5 text-slate-700 dark:text-slate-300 whitespace-nowrap font-mono">
                            {formatDate(t.date)}
                          </td>

                          {/* Type Badge */}
                          <td className="p-3.5 whitespace-nowrap">
                            {isInvoice ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                                <Clock className="w-3 h-3" />
                                INVOICE
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isIncome
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                                }`}
                              >
                                {isIncome ? '+ INCOME' : '- EXPENSE'}
                              </span>
                            )}
                          </td>

                          {/* Unit */}
                          <td className="p-3.5 whitespace-nowrap font-bold text-slate-800 dark:text-slate-200">
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-[#881337]" />
                              <span>{t.unit}</span>
                            </span>
                          </td>

                          {/* Particulars */}
                          <td className="p-3.5">
                            <div className="font-semibold text-slate-900 dark:text-white leading-snug">
                              {t.particulars}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <span>Head: {t.category}</span>
                              {t.referenceNumber && <span>• Ref: {t.referenceNumber}</span>}
                            </div>
                          </td>

                          {/* Party Name */}
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{t.partyName}</div>
                            {t.contactNumber && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                {t.contactNumber}
                              </div>
                            )}
                          </td>

                          {/* Payment Method */}
                          <td className="p-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium">
                            {t.paymentMethod}
                          </td>

                          {/* Amount in AED */}
                          <td className="p-3.5 whitespace-nowrap text-right font-mono font-bold text-sm">
                            <span
                              className={
                                isIncome
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }
                            >
                              {isIncome ? '+' : '-'} {formatAED(t.amountAED)}
                            </span>
                          </td>

                          {/* Actions & Official Receipt */}
                          <td className="p-3.5 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Invoice Conversion Action */}
                              {isInvoice && (
                                <button
                                  onClick={() => handleConvertInvoiceToReceipt(t)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                                  title="Receive Payment & Generate Official Receipt"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                                  <span>Receive &amp; Receipt</span>
                                </button>
                              )}

                              <button
                                onClick={() => onViewReceipt(t)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#881337] hover:bg-[#700f2b] text-white text-[11px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                                title="View & Print Official Document"
                              >
                                <FileText className="w-3 h-3 text-amber-300" />
                                <span>{isInvoice ? 'Invoice' : 'Receipt'}</span>
                              </button>

                              <button
                                onClick={() => onEditTransaction(t)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Edit Transaction"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {isAdmin && (
                                <button
                                  onClick={() => setTransactionToDelete(t)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  title="Delete Transaction"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CASHFLOW DRILL-DOWN REPORTING */}
      {activeFinanceTab === 'cashflow_drilldown' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Hierarchical Cashflow Particulars Breakdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Detailed drill-down of revenue streams and expense lines across all master and sub particulars.
                </p>
              </div>
            </div>

            {/* Income Drill Down */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>Income Classification &amp; Sub-Particulars Inflow</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {particulars
                  .filter((p) => p.type === 'INCOME' && !p.parentId)
                  .map((main) => {
                    const subs = particulars.filter((p) => p.parentId === main.id);
                    const matchingTxns = scopedBaseTransactions.filter(
                      (t) =>
                        t.type === 'INCOME' &&
                        (t.mainParticularId === main.id || t.category === main.name)
                    );
                    const mainTotal = matchingTxns.reduce(
                      (sum, t) => sum + (t.amountAED || 0),
                      0
                    );

                    return (
                      <div
                        key={main.id}
                        className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {main.name}
                            </span>
                            {main.code && (
                              <span className="ml-1.5 text-[9px] font-mono font-bold text-slate-500 bg-white dark:bg-slate-700 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-600">
                                {main.code}
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                            {formatAED(mainTotal)}
                          </span>
                        </div>

                        {/* Sub particular rows */}
                        {subs.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1 text-xs">
                            {subs.map((sub) => {
                              const subTxns = matchingTxns.filter(
                                (t) => t.subParticularId === sub.id
                              );
                              const subTotal = subTxns.reduce(
                                (sum, t) => sum + (t.amountAED || 0),
                                0
                              );
                              return (
                                <div
                                  key={sub.id}
                                  className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-[11px]"
                                >
                                  <span className="truncate pr-2">• {sub.name}</span>
                                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 shrink-0">
                                    {formatAED(subTotal)} ({subTxns.length})
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Expense Drill Down */}
            <div className="space-y-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-xs uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4" />
                <span>Expense Classification &amp; Sub-Particulars Outflow</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {particulars
                  .filter((p) => p.type === 'EXPENSE' && !p.parentId)
                  .map((main) => {
                    const subs = particulars.filter((p) => p.parentId === main.id);
                    const matchingTxns = scopedBaseTransactions.filter(
                      (t) =>
                        t.type === 'EXPENSE' &&
                        (t.mainParticularId === main.id || t.category === main.name)
                    );
                    const mainTotal = matchingTxns.reduce(
                      (sum, t) => sum + (t.amountAED || 0),
                      0
                    );

                    return (
                      <div
                        key={main.id}
                        className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {main.name}
                            </span>
                            {main.code && (
                              <span className="ml-1.5 text-[9px] font-mono font-bold text-slate-500 bg-white dark:bg-slate-700 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-600">
                                {main.code}
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                            {formatAED(mainTotal)}
                          </span>
                        </div>

                        {/* Sub particular rows */}
                        {subs.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1 text-xs">
                            {subs.map((sub) => {
                              const subTxns = matchingTxns.filter(
                                (t) => t.subParticularId === sub.id
                              );
                              const subTotal = subTxns.reduce(
                                (sum, t) => sum + (t.amountAED || 0),
                                0
                              );
                              return (
                                <div
                                  key={sub.id}
                                  className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-[11px]"
                                >
                                  <span className="truncate pr-2">• {sub.name}</span>
                                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 shrink-0">
                                    {formatAED(subTotal)} ({subTxns.length})
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Master Particulars Creator Modal */}
      <ParticularsManagerModal
        isOpen={showParticularsModal}
        onClose={() => setShowParticularsModal(false)}
        particulars={particulars}
        onSaveParticulars={handleSaveParticulars}
      />

      {/* Unit Cash-in-Balance Ledger Modal */}
      <UnitCashLedgerModal
        isOpen={showUnitLedgerModal}
        onClose={() => setShowUnitLedgerModal(false)}
        unitBalances={unitBalances}
        onSaveBalances={handleSaveUnitBalances}
        userSession={userSession}
      />

      {/* Finance Report Export Modal */}
      <FinanceReportExportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        transactions={transactions}
        units={units}
        userSession={userSession}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!transactionToDelete}
        title="Delete Financial Transaction"
        itemName={transactionToDelete?.receiptNumber || 'this transaction'}
        message={`Are you sure you want to permanently delete transaction "${transactionToDelete?.receiptNumber}" (${transactionToDelete?.particulars || 'No particulars'})? This will update all financial ledgers and cashflow balances.`}
        confirmLabel="Delete Transaction"
        onConfirm={() => {
          if (transactionToDelete) {
            onDeleteTransaction(transactionToDelete.id);
            setTransactionToDelete(null);
          }
        }}
        onClose={() => setTransactionToDelete(null)}
      />
    </div>
  );
};
