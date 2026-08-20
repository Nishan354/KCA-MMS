import React, { useState, useMemo } from 'react';
import { FinanceTransaction, TransactionType } from '../types/finance';
import { UserSession, hasAdminPrivilege, isUnitOperatorRole } from '../types/member';
import { formatAED, formatDate } from '../utils/idGenerator';
import { exportFinanceCsv } from '../utils/financeStorage';
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
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  transactions,
  units,
  userSession,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onViewReceipt,
}) => {
  const isAdmin = !userSession || hasAdminPrivilege(userSession.role);
  const isUnitOp = !!userSession && isUnitOperatorRole(userSession.role);
  const assignedUnit = userSession?.unit;

  // Complete list of units for finance including "Central"
  const financeUnits = useMemo(() => {
    const list = [...units.filter((u) => !u.toLowerCase().startsWith('central'))];
    list.push('Central');
    return list;
  }, [units]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | TransactionType>('ALL');
  const [selectedUnit, setSelectedUnit] = useState<string>(isUnitOp && assignedUnit ? assignedUnit : 'ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'date' | 'amountAED' | 'receiptNumber'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter visible transactions (strictly enforces unit operator role access)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Unit scoping for operators: ONLY see their own unit's transactions
      if (isUnitOp && assignedUnit) {
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

      // Category filter
      if (selectedCategory !== 'ALL' && t.category !== selectedCategory) {
        return false;
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
  }, [transactions, isUnitOp, assignedUnit, selectedUnit, selectedType, selectedCategory, searchQuery]);

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
    if (isUnitOp && assignedUnit) {
      return transactions.filter((t) => t.unit.toLowerCase().trim() === assignedUnit.toLowerCase().trim());
    }
    return transactions;
  }, [transactions, isUnitOp, assignedUnit]);

  const totalIncome = useMemo(() => {
    return scopedBaseTransactions
      .filter((t) => t.type === 'INCOME' && t.status === 'Completed')
      .reduce((sum, t) => sum + (t.amountAED || 0), 0);
  }, [scopedBaseTransactions]);

  const totalExpense = useMemo(() => {
    return scopedBaseTransactions
      .filter((t) => t.type === 'EXPENSE' && t.status === 'Completed')
      .reduce((sum, t) => sum + (t.amountAED || 0), 0);
  }, [scopedBaseTransactions]);

  const netBalance = totalIncome - totalExpense;

  // Unit-wise summary for Admins
  const unitSummaries = useMemo(() => {
    const map: Record<string, { income: number; expense: number; count: number }> = {};
    financeUnits.forEach((u) => {
      map[u] = { income: 0, expense: 0, count: 0 };
    });

    transactions.forEach((t) => {
      if (t.status === 'Completed') {
        const u = t.unit || 'General';
        if (!map[u]) map[u] = { income: 0, expense: 0, count: 0 };
        if (t.type === 'INCOME') map[u].income += t.amountAED;
        else map[u].expense += t.amountAED;
        map[u].count += 1;
      }
    });

    return map;
  }, [transactions, financeUnits]);

  const handleSort = (field: 'date' | 'amountAED' | 'receiptNumber') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExportCsv = () => {
    exportFinanceCsv(sortedTransactions, `KCA_Finance_Ledger_${selectedUnit}_${new Date().toISOString().split('T')[0]}.csv`);
    confetti({ particleCount: 40, spread: 60 });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16 antialiased">
      {/* Top Banner / Scoping Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="p-1.5 rounded-lg text-white"
              style={{ backgroundColor: 'var(--color-primary, #881337)' }}
            >
              <DirhamIcon className="w-5 h-5 text-amber-300" />
            </span>
            <h2 className="font-display font-bold text-xl text-slate-900 tracking-tight">
              Finance &amp; Accounts Ledger
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            {isUnitOp && assignedUnit ? (
              <span>
                <strong>{assignedUnit} Unit Operator Scope</strong>: Displaying ledger and voucher accounts for {assignedUnit} Unit only.
              </span>
            ) : (
              <span>
                Consolidated Association &amp; Unit ledger in UAE Dirhams (AED) with Central Committee and area unit tracking.
              </span>
            )}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenNewTransaction('INCOME')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Record New Income Transaction"
          >
            <PlusCircle className="w-4 h-4 text-emerald-200" />
            <span>+ Record Income</span>
          </button>

          <button
            onClick={() => onOpenNewTransaction('EXPENSE')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Record New Expense Payment"
          >
            <PlusCircle className="w-4 h-4 text-rose-200" />
            <span>- Record Expense</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards: Total Income, Total Expense, Net Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Income */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Income Received
            </span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="font-mono font-bold text-2xl text-emerald-700 mt-2">
            {formatAED(totalIncome)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {scopedBaseTransactions.filter((t) => t.type === 'INCOME').length} income vouchers recorded
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Expenses Paid
            </span>
            <span className="p-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="font-mono font-bold text-2xl text-rose-700 mt-2">
            {formatAED(totalExpense)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {scopedBaseTransactions.filter((t) => t.type === 'EXPENSE').length} expense payments recorded
          </div>
        </div>

        {/* Net Treasury Balance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Net Balance / Surplus
            </span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <DirhamIcon className="w-4 h-4 text-blue-700" />
            </span>
          </div>
          <div
            className={`font-mono font-bold text-2xl mt-2 ${
              netBalance >= 0 ? 'text-slate-900' : 'text-rose-700'
            }`}
          >
            {formatAED(netBalance)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {netBalance >= 0 ? 'Surplus balance in treasury (AED)' : 'Deficit across recorded ledger'}
          </div>
        </div>
      </div>

      {/* Unit Breakdown Ribbon */}
      {!isUnitOp && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4" style={{ color: 'var(--color-primary, #881337)' }} />
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
              Unit-Wise Financial Breakdown &amp; Central Committee
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {financeUnits.map((u) => {
              const summary = unitSummaries[u] || { income: 0, expense: 0, count: 0 };
              const unitNet = summary.income - summary.expense;
              const isSelected = selectedUnit === u;

              return (
                <button
                  key={u}
                  onClick={() => setSelectedUnit(isSelected ? 'ALL' : u)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs truncate">{u}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {summary.count} txns
                    </span>
                  </div>
                  <div className="mt-2 space-y-0.5 text-[11px]">
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
                              : 'text-emerald-700'
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

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Voucher #, Particulars, Vendor, Unit..."
              className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type & Unit Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type Filter */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setSelectedType('ALL')}
                className={`px-3 py-1 rounded-md transition-colors font-semibold cursor-pointer ${
                  selectedType === 'ALL' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('INCOME')}
                className={`px-3 py-1 rounded-md transition-colors font-semibold cursor-pointer ${
                  selectedType === 'INCOME' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-700'
                }`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('EXPENSE')}
                className={`px-3 py-1 rounded-md transition-colors font-semibold cursor-pointer ${
                  selectedType === 'EXPENSE' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-700'
                }`}
              >
                Expense
              </button>
            </div>

            {/* Unit Dropdown */}
            {!isUnitOp && (
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white outline-none cursor-pointer"
              >
                <option value="ALL">All Units</option>
                {financeUnits.map((u) => (
                  <option key={u} value={u}>
                    {u} {u === 'Central Committee' ? '' : 'Unit'}
                  </option>
                ))}
              </select>
            )}

            {/* Export & Print */}
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
              title="Download CSV Ledger"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
              title="Print Ledger"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider select-none">
              <tr>
                <th
                  onClick={() => handleSort('receiptNumber')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Voucher / Receipt #</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('date')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Unit</th>
                <th className="p-3.5 min-w-[240px]">Particulars</th>
                <th className="p-3.5">Party / Beneficiary</th>
                <th className="p-3.5">Mode</th>
                <th
                  onClick={() => handleSort('amountAED')}
                  className="p-3.5 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Amount (AED)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5 text-center">Receipt &amp; Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500">
                    No financial transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                sortedTransactions.map((t) => {
                  const isIncome = t.type === 'INCOME';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Voucher Number */}
                      <td className="p-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs">
                          {t.receiptNumber}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="p-3.5 text-slate-700 whitespace-nowrap font-medium font-mono">
                        {formatDate(t.date)}
                      </td>

                      {/* Type Badge */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            isIncome
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {isIncome ? '+ INCOME' : '- EXPENSE'}
                        </span>
                      </td>

                      {/* Unit */}
                      <td className="p-3.5 whitespace-nowrap font-bold text-slate-800">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="w-3 h-3" style={{ color: 'var(--color-primary, #881337)' }} />
                          <span>{t.unit}</span>
                        </span>
                      </td>

                      {/* Particulars */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {t.particulars}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Category: {t.category}
                          {t.referenceNumber ? ` • Ref: ${t.referenceNumber}` : ''}
                        </div>
                      </td>

                      {/* Party Name */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{t.partyName}</div>
                        {t.contactNumber && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            {t.contactNumber}
                          </div>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="p-3.5 whitespace-nowrap text-slate-600 font-medium">
                        {t.paymentMethod}
                      </td>

                      {/* Amount in AED */}
                      <td className="p-3.5 whitespace-nowrap text-right font-mono font-bold text-sm">
                        <span className={isIncome ? 'text-emerald-700' : 'text-rose-700'}>
                          {isIncome ? '+' : '-'} {formatAED(t.amountAED)}
                        </span>
                      </td>

                      {/* Actions & Official Receipt */}
                      <td className="p-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onViewReceipt(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-white text-[11px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                            style={{ backgroundColor: 'var(--color-primary, #881337)' }}
                            title="View &amp; Print Official Voucher Receipt"
                          >
                            <FileText className="w-3 h-3 text-amber-300" />
                            <span>Receipt</span>
                          </button>

                          <button
                            onClick={() => onEditTransaction(t)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Transaction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Are you sure you want to remove financial transaction record ${t.receiptNumber}?`
                                  )
                                ) {
                                  onDeleteTransaction(t.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
  );
};
