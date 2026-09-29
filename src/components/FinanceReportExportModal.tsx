import React, { useState, useMemo, useEffect } from 'react';
import { FinanceTransaction, TransactionType } from '../types/finance';
import { UserSession, hasAdminPrivilege, isUnitOperatorRole, isCentralAdminSession } from '../types/member';
import { generateFinanceReportPdf, FinanceReportFilter } from '../utils/financeReportGenerator';
import { exportFinanceCsv } from '../utils/financeStorage';
import { formatAED } from '../utils/idGenerator';
import { DirhamIcon } from './DirhamIcon';
import {
  X,
  FileText,
  Download,
  Printer,
  Calendar,
  Building2,
  TrendingUp,
  TrendingDown,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FinanceReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: FinanceTransaction[];
  units: string[];
  userSession: UserSession | null;
}

export const FinanceReportExportModal: React.FC<FinanceReportExportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  units,
  userSession,
}) => {
  const isCentralAdmin = isCentralAdminSession(userSession);
  const isUnitScopedUser = !isCentralAdmin;
  const assignedUnit = userSession?.unit || (isUnitScopedUser ? 'Fujairah' : undefined);

  const [selectedUnit, setSelectedUnit] = useState<string>(
    isUnitScopedUser && assignedUnit ? assignedUnit : 'ALL'
  );
  const [selectedType, setSelectedType] = useState<'ALL' | TransactionType>('ALL');
  const [datePreset, setDatePreset] = useState<'all' | 'this_month' | 'this_year' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync unit when modal opens or userSession updates
  useEffect(() => {
    if (isUnitScopedUser && assignedUnit) {
      setSelectedUnit(assignedUnit);
    }
  }, [isUnitScopedUser, assignedUnit, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const financeUnits = useMemo(() => {
    const list = [...units.filter((u) => !u.toLowerCase().startsWith('central'))];
    list.push('Central');
    return list;
  }, [units]);

  // Date range calculations based on preset
  const activeDateRange = useMemo(() => {
    const now = new Date();
    if (datePreset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      return { start: firstDay, end: lastDay };
    }
    if (datePreset === 'this_year') {
      const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
      return { start: firstDay, end: lastDay };
    }
    if (datePreset === 'custom') {
      return { start: startDate, end: endDate };
    }
    return { start: undefined, end: undefined };
  }, [datePreset, startDate, endDate]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedUnit !== 'ALL') {
        const isCentral = selectedUnit.toLowerCase().startsWith('central');
        if (isCentral) {
          if (!t.unit.toLowerCase().startsWith('central')) return false;
        } else if (t.unit.toLowerCase() !== selectedUnit.toLowerCase()) {
          return false;
        }
      }
      if (selectedType !== 'ALL' && t.type !== selectedType) return false;
      if (activeDateRange.start && t.date < activeDateRange.start) return false;
      if (activeDateRange.end && t.date > activeDateRange.end) return false;
      return true;
    });
  }, [transactions, selectedUnit, selectedType, activeDateRange]);

  const totalIncome = filtered.filter((t) => t.type === 'INCOME').reduce((s, t) => s + (t.amountAED || 0), 0);
  const totalExpense = filtered.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + (t.amountAED || 0), 0);
  const netBalance = totalIncome - totalExpense;

  if (!isOpen) return null;

  const reportFilter: FinanceReportFilter = {
    unit: selectedUnit,
    type: selectedType,
    startDate: activeDateRange.start,
    endDate: activeDateRange.end,
  };

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const pdf = await generateFinanceReportPdf(
        transactions,
        reportFilter,
        userSession?.fullName || 'Finance Coordinator'
      );
      const dateTag = activeDateRange.start ? `_${activeDateRange.start}_to_${activeDateRange.end}` : '_AllTime';
      pdf.save(`KCA_Finance_Report_${selectedUnit}${dateTag}.pdf`);
      confetti({ particleCount: 40, spread: 60 });
    } catch (err) {
      console.error('Error generating finance report PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    setIsGenerating(true);
    try {
      const pdf = await generateFinanceReportPdf(
        transactions,
        reportFilter,
        userSession?.fullName || 'Finance Coordinator'
      );
      pdf.autoPrint();
      window.open(pdf.output('bloburl'), '_blank');
    } catch (err) {
      console.error('Error printing finance report:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCsv = () => {
    exportFinanceCsv(filtered);
    confetti({ particleCount: 30, spread: 50 });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6"
      >
        {/* Header */}
        <div
          className="p-5 text-white flex items-center justify-between shrink-0 shadow-xs"
          style={{ backgroundColor: 'var(--color-primary, #881337)' }}
        >
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-white/10 text-amber-300">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-display font-bold text-base">Export Financial Audit Report</h2>
              <p className="text-xs text-rose-100 font-medium">
                Official Treasury Statements &amp; Ledger Exports with Unit-Wise Signatures
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
            title="Close modal (Esc)"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs">
          {/* Filters */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-rose-800" />
              <span>Report Scope &amp; Timeframe</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Unit Jurisdiction</label>
                {isUnitScopedUser && assignedUnit ? (
                  <div className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-bold text-[#881337] bg-rose-50/50 flex items-center justify-between">
                    <span>{assignedUnit} Unit</span>
                    <span className="text-[10px] text-slate-500 font-normal">Assigned</span>
                  </div>
                ) : (
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-semibold text-slate-800"
                  >
                    <option value="ALL">All Units &amp; Central Committee</option>
                    {financeUnits.map((u) => (
                      <option key={u} value={u}>
                        {u} {u.toLowerCase().startsWith('central') ? '' : 'Unit'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Transaction Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-semibold text-slate-800"
                >
                  <option value="ALL">All Types (Income &amp; Expense)</option>
                  <option value="INCOME">Income Only</option>
                  <option value="EXPENSE">Expense Only</option>
                </select>
              </div>
            </div>

            {/* Date Presets */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Period Selection</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'this_month', label: 'This Month' },
                  { id: 'this_year', label: 'This Year' },
                  { id: 'custom', label: 'Custom Range' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setDatePreset(p.id as any)}
                    className={`py-1.5 px-2 rounded-md font-semibold text-center transition-colors cursor-pointer text-[11px] ${
                      datePreset === p.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {datePreset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-semibold text-slate-600 block mb-0.5">From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-0.5">To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded-md"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Real-time Summary Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
              <div className="text-[10px] uppercase font-bold text-emerald-800">Total Income</div>
              <div className="font-mono font-bold text-sm text-emerald-600 mt-0.5">
                {formatAED(totalIncome)}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100">
              <div className="text-[10px] uppercase font-bold text-rose-800">Total Expense</div>
              <div className="font-mono font-bold text-sm text-rose-600 mt-0.5">
                {formatAED(totalExpense)}
              </div>
            </div>
            <div
              className={`p-2.5 rounded-lg border ${
                netBalance >= 0
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="text-[10px] uppercase font-bold">Net Balance</div>
              <div className="font-mono font-black text-sm mt-0.5">
                {formatAED(netBalance)}
              </div>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-500">
            Export includes <span className="font-bold text-slate-800">{filtered.length} audited transactions</span> matching your selected criteria.
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary, #881337)' }}
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Download PDF Financial Audit Report</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={isGenerating}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
