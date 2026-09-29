import React, { useState, useEffect, useMemo } from 'react';
import { UnitCashBalance, UnitBalanceAuditItem } from '../types/finance';
import { UserSession, isUnitOperatorRole, hasAdminPrivilege, isCentralAdminSession } from '../types/member';
import { formatAED, formatDate } from '../utils/idGenerator';
import {
  X,
  Wallet,
  Building2,
  TrendingUp,
  TrendingDown,
  History,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowUpDown,
  Lock,
} from 'lucide-react';

interface UnitCashLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitBalances: UnitCashBalance[];
  onSaveBalances: (balances: UnitCashBalance[]) => void;
  userSession?: UserSession | null;
}

export const UnitCashLedgerModal: React.FC<UnitCashLedgerModalProps> = ({
  isOpen,
  onClose,
  unitBalances,
  onSaveBalances,
  userSession,
}) => {
  // Central admin check: Only Super Admin and central unrestricted Admin see multi-unit balances.
  // All other users/operators see ONLY their assigned unit balance summary.
  const isCentralAdmin = isCentralAdminSession(userSession);
  const isUnitScopedUser = !isCentralAdmin;
  const assignedUnit = userSession?.unit || (isUnitScopedUser ? 'Fujairah' : undefined);
  const defaultSelectedUnit = isUnitScopedUser && assignedUnit ? assignedUnit : (unitBalances[0]?.unit || 'Fujairah');

  // Filter visible balances strictly for unit operator / user's assigned unit
  const visibleUnitBalances = useMemo(() => {
    if (isUnitScopedUser && assignedUnit) {
      const match = unitBalances.filter((u) => u.unit.toLowerCase().trim() === assignedUnit.toLowerCase().trim());
      if (match.length > 0) return match;
      // Fallback if balance record for this unit is being initialized
      return [{
        unit: assignedUnit,
        cashInHandAED: 0,
        bankBalanceAED: 0,
        openingBalanceAED: 0,
        lastUpdated: new Date().toISOString().split('T')[0],
      }];
    }
    return unitBalances;
  }, [unitBalances, isUnitScopedUser, assignedUnit]);

  const [selectedUnitName, setSelectedUnitName] = useState<string>(defaultSelectedUnit);
  const [activeTab, setActiveTab] = useState<'overview' | 'adjust' | 'direct_edit' | 'history'>('overview');

  // Keep selectedUnitName locked to assignedUnit for unit users
  useEffect(() => {
    if (isUnitScopedUser && assignedUnit) {
      setSelectedUnitName(assignedUnit);
    }
  }, [isUnitScopedUser, assignedUnit, isOpen]);

  // Adjustment Form State
  const [adjustmentAction, setAdjustmentAction] = useState<UnitBalanceAuditItem['action']>('Manual Adjustment');
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [targetAccount, setTargetAccount] = useState<'cashInHand' | 'bankBalance' | 'openingBalance'>('cashInHand');
  const [adjustNotes, setAdjustNotes] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Direct Manual Balance State
  const [manualCash, setManualCash] = useState<number>(0);
  const [manualBank, setManualBank] = useState<number>(0);
  const [manualOpening, setManualOpening] = useState<number>(0);

  // Sync manual edit states when unit changes or modal opens
  useEffect(() => {
    const target = unitBalances.find((u) => u.unit === selectedUnitName);
    if (target) {
      setManualCash(target.cashInHandAED ?? 0);
      setManualBank(target.bankBalanceAED ?? 0);
      setManualOpening(target.openingBalanceAED ?? 0);
    } else {
      setManualCash(0);
      setManualBank(0);
      setManualOpening(0);
    }
  }, [selectedUnitName, unitBalances, isOpen]);

  // Close on Escape
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

  if (!isOpen) return null;

  const currentUnitData = unitBalances.find((u) => u.unit === selectedUnitName) || unitBalances[0];

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustAmount || adjustAmount === 0) {
      alert('Please enter a non-zero adjustment amount.');
      return;
    }

    const prevCash = currentUnitData.cashInHandAED;
    const prevBank = currentUnitData.bankBalanceAED;
    const prevOpening = currentUnitData.openingBalanceAED;

    let newCash = prevCash;
    let newBank = prevBank;
    let newOpening = prevOpening;
    let prevMetric = 0;
    let newMetric = 0;

    if (targetAccount === 'cashInHand') {
      prevMetric = prevCash;
      newCash = prevCash + adjustAmount;
      newMetric = newCash;
    } else if (targetAccount === 'bankBalance') {
      prevMetric = prevBank;
      newBank = prevBank + adjustAmount;
      newMetric = newBank;
    } else {
      prevMetric = prevOpening;
      newOpening = prevOpening + adjustAmount;
      newMetric = newOpening;
    }

    const auditEntry: UnitBalanceAuditItem = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: adjustmentAction,
      amount: adjustAmount,
      previousBalance: prevMetric,
      newBalance: newMetric,
      performedBy: userSession?.fullName || 'Finance Administrator',
      notes: `${targetAccount} adjustment: ${adjustNotes || 'Reconciliation / balance update'}`,
    };

    const updatedBalances = unitBalances.map((u) => {
      if (u.unit === selectedUnitName) {
        return {
          ...u,
          cashInHandAED: newCash,
          bankBalanceAED: newBank,
          openingBalanceAED: newOpening,
          lastUpdated: new Date().toISOString().split('T')[0],
          auditHistory: [auditEntry, ...(u.auditHistory || [])],
        };
      }
      return u;
    });

    onSaveBalances(updatedBalances);
    setSuccessMsg(`Successfully applied ${formatAED(adjustAmount)} adjustment to ${selectedUnitName} ${targetAccount}!`);
    setAdjustAmount(0);
    setAdjustNotes('');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleSaveManualBalances = (e: React.FormEvent) => {
    e.preventDefault();
    const prevCash = currentUnitData.cashInHandAED ?? 0;
    const prevBank = currentUnitData.bankBalanceAED ?? 0;
    const prevOpening = currentUnitData.openingBalanceAED ?? 0;

    const auditEntry: UnitBalanceAuditItem = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Manual Adjustment',
      amount: (manualCash - prevCash) + (manualBank - prevBank),
      previousBalance: prevCash + prevBank,
      newBalance: manualCash + manualBank,
      performedBy: userSession?.fullName || 'Finance Administrator',
      notes: `Direct manual balance update: Cash=${manualCash} AED, Bank=${manualBank} AED, Opening=${manualOpening} AED`,
    };

    const updatedBalances = unitBalances.map((u) => {
      if (u.unit === selectedUnitName) {
        return {
          ...u,
          cashInHandAED: Number(manualCash) || 0,
          bankBalanceAED: Number(manualBank) || 0,
          openingBalanceAED: Number(manualOpening) || 0,
          lastUpdated: new Date().toISOString().split('T')[0],
          auditHistory: [auditEntry, ...(u.auditHistory || [])],
        };
      }
      return u;
    });

    onSaveBalances(updatedBalances);
    setSuccessMsg(`Saved custom balances for ${selectedUnitName} unit successfully without background overwriting!`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleResetBalancesToZero = () => {
    if (!confirm(`Are you sure you want to reset all initial balances for ${selectedUnitName} strictly to 0 AED?`)) {
      return;
    }
    setManualCash(0);
    setManualBank(0);
    setManualOpening(0);
    setAdjustAmount(0);
    setAdjustNotes('');

    const auditEntry: UnitBalanceAuditItem = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Manual Adjustment',
      amount: -(currentUnitData.cashInHandAED + currentUnitData.bankBalanceAED),
      previousBalance: currentUnitData.cashInHandAED + currentUnitData.bankBalanceAED,
      newBalance: 0,
      performedBy: userSession?.fullName || 'Finance Administrator',
      notes: 'Full balance reset strictly to 0 AED default',
    };

    const updatedBalances = unitBalances.map((u) => {
      if (u.unit === selectedUnitName) {
        return {
          ...u,
          cashInHandAED: 0,
          bankBalanceAED: 0,
          openingBalanceAED: 0,
          lastUpdated: new Date().toISOString().split('T')[0],
          auditHistory: [auditEntry, ...(u.auditHistory || [])],
        };
      }
      return u;
    });

    onSaveBalances(updatedBalances);
    setSuccessMsg(`Reset balances for ${selectedUnitName} strictly to 0.00 AED.`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-4 max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-4 bg-[#881337] text-white flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 p-1 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base tracking-tight leading-tight">
                {isUnitScopedUser && assignedUnit
                  ? `${assignedUnit} Unit Cash-in-Balance Management & Ledger`
                  : 'Unit Cash-in-Balance Management & Ledger'}
              </h2>
              <p className="text-[11px] text-rose-100 font-medium">
                {isUnitScopedUser && assignedUnit
                  ? `${assignedUnit} Unit Operational Liquidity, Cash-in-Hand & Balance Summary`
                  : 'Multi-Unit Operational Liquidity, Cash-in-Hand & Audit Trail'}
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

        {/* Unit Selector Strip */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
          {isUnitScopedUser && assignedUnit ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Scope:</span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#881337] text-white flex items-center gap-1.5 shadow-xs">
                <Building2 className="w-3.5 h-3.5" />
                <span>{assignedUnit} Unit</span>
              </span>
              <span className="text-[10px] bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 font-semibold px-2 py-0.5 rounded-full">
                Strict Unit Scoped Access
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {visibleUnitBalances.map((u) => {
                const isSelected = selectedUnitName === u.unit;
                return (
                  <button
                    key={u.unit}
                    type="button"
                    onClick={() => setSelectedUnitName(u.unit)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#881337] text-white shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{u.unit}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Sub Tabs */}
          <div className="flex bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1 rounded-md font-bold transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white dark:bg-slate-800 text-[#881337] dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('direct_edit')}
              className={`px-3 py-1 rounded-md font-bold transition-colors ${
                activeTab === 'direct_edit'
                  ? 'bg-white dark:bg-slate-800 text-[#881337] dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Manual Balances (Strict 0 Default)
            </button>
            <button
              onClick={() => setActiveTab('adjust')}
              className={`px-3 py-1 rounded-md font-bold transition-colors ${
                activeTab === 'adjust'
                  ? 'bg-white dark:bg-slate-800 text-[#881337] dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Adjust Balance
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 rounded-md font-bold transition-colors ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-800 text-[#881337] dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Audit History ({currentUnitData?.auditHistory?.length || 0})
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Stat Cards for Current Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Cash in Hand (Physical)
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatAED(currentUnitData.cashInHandAED)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Available for immediate petty expense disbursements
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Bank Account Liquidity
                  </div>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                    {formatAED(currentUnitData.bankBalanceAED)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Central bank account allocated operational balance
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Opening Fiscal Allocation
                  </div>
                  <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                    {formatAED(currentUnitData.openingBalanceAED)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Fiscal year baseline set on {currentUnitData.lastUpdated}
                  </div>
                </div>
              </div>

              {/* Total Unit Liquidity Banner */}
              <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#881337] dark:text-rose-300 uppercase">
                    Total Operational Funds for {currentUnitData.unit} Unit
                  </div>
                  <div className="text-xl font-black text-[#881337] dark:text-rose-200 mt-0.5">
                    {formatAED(currentUnitData.cashInHandAED + currentUnitData.bankBalanceAED)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('adjust')}
                  className="px-4 py-2 rounded-lg bg-[#881337] text-white text-xs font-bold hover:bg-[#700f2b] transition-colors cursor-pointer"
                >
                  Reconcile / Adjust
                </button>
              </div>

              {/* Unit Balance Summary Table (Scoped for unit operators/users) */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-3 bg-slate-50 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span>
                    {isUnitScopedUser && assignedUnit
                      ? `${assignedUnit} Unit Cash & Balance Summary`
                      : 'All Association Units Balance Summary'}
                  </span>
                  {isUnitScopedUser && assignedUnit && (
                    <span className="text-[10px] bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 font-semibold px-2 py-0.5 rounded-full">
                      Strict Unit Scoped Access
                    </span>
                  )}
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase">
                    <tr>
                      <th className="p-2.5">Unit</th>
                      <th className="p-2.5">Cash in Hand</th>
                      <th className="p-2.5">Bank Balance</th>
                      <th className="p-2.5">Total Funds</th>
                      <th className="p-2.5">Last Reconciliation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {visibleUnitBalances.map((u) => (
                      <tr
                        key={u.unit}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                          u.unit === selectedUnitName ? 'bg-rose-50/40 dark:bg-rose-950/20 font-bold' : ''
                        }`}
                      >
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#881337]" />
                          <span>{u.unit}</span>
                        </td>
                        <td className="p-2.5 font-mono text-emerald-600 font-bold">
                          {formatAED(u.cashInHandAED)}
                        </td>
                        <td className="p-2.5 font-mono text-blue-600 font-bold">
                          {formatAED(u.bankBalanceAED)}
                        </td>
                        <td className="p-2.5 font-mono font-black text-slate-900 dark:text-slate-100">
                          {formatAED(u.cashInHandAED + u.bankBalanceAED)}
                        </td>
                        <td className="p-2.5 text-slate-500 font-mono">{u.lastUpdated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: DIRECT MANUAL BALANCE ENTRY (Strict 0 Defaults) */}
          {activeTab === 'direct_edit' && (
            <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Direct Balance &amp; Opening Allocation ({selectedUnitName})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Initial values default strictly to 0 AED upon reset. Manual values are saved directly and preserved without background overwriting.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveManualBalances} className="space-y-4 text-xs mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900">
                    <label className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                      Cash in Hand (AED)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualCash}
                      onChange={(e) => setManualCash(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-emerald-300 dark:border-emerald-700 rounded-lg text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 font-mono font-bold text-sm"
                      placeholder="0.00"
                    />
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block">
                      Physical drawer petty cash
                    </span>
                  </div>

                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900">
                    <label className="font-bold text-blue-800 dark:text-blue-300 block mb-1">
                      Bank Balance (AED)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualBank}
                      onChange={(e) => setManualBank(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-blue-300 dark:border-blue-700 rounded-lg text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 font-mono font-bold text-sm"
                      placeholder="0.00"
                    />
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 block">
                      Assigned bank liquidity
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Opening Balance (AED)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualOpening}
                      onChange={(e) => setManualOpening(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 font-mono font-bold text-sm"
                      placeholder="0.00"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Baseline starting record
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-100 dark:bg-slate-700/40 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Total Unit Fund Position:</span>
                  <span className="font-mono font-black text-sm text-[#881337] dark:text-rose-300">
                    {formatAED((Number(manualCash) || 0) + (Number(manualBank) || 0))}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleResetBalancesToZero}
                    className="px-3 py-2 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-bold transition-colors cursor-pointer"
                  >
                    Reset Form to 0.00
                  </button>

                  <button
                    type="submit"
                    className="py-2 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Custom Balances</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: ADJUST BALANCE */}
          {activeTab === 'adjust' && (
            <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                Log Ledger Balance Adjustment for {selectedUnitName} Unit
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Record official petty cash top-ups, bank transfers, or manual balance reconciliations with full audit attribution.
              </p>

              <form onSubmit={handleApplyAdjustment} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Target Ledger Account *
                  </label>
                  <select
                    value={targetAccount}
                    onChange={(e: any) => setTargetAccount(e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 font-bold"
                  >
                    <option value="cashInHand">Cash in Hand (Current: {formatAED(currentUnitData.cashInHandAED)})</option>
                    <option value="bankBalance">Bank Balance (Current: {formatAED(currentUnitData.bankBalanceAED)})</option>
                    <option value="openingBalance">Opening Allocation (Current: {formatAED(currentUnitData.openingBalanceAED)})</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Adjustment Type *
                  </label>
                  <select
                    value={adjustmentAction}
                    onChange={(e: any) => setAdjustmentAction(e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 font-semibold"
                  >
                    <option value="Manual Adjustment">Manual Reconciliation / Audit Fix</option>
                    <option value="Fund Transfer">Central Fund Transfer / Allocation</option>
                    <option value="Opening Set">Reset Opening Balance</option>
                    <option value="Cash Received">Unrecorded Direct Cash Top-up</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Amount in AED (Positive to Add, Negative to Deduct) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={adjustAmount === 0 ? '' : adjustAmount}
                    onChange={(e) => setAdjustAmount(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 500 or -200"
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Reason / Official Audit Notes *
                  </label>
                  <textarea
                    rows={2}
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                    placeholder="e.g. Approved monthly petty cash advance for event production..."
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-[#881337] hover:bg-[#700f2b] text-white font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>Apply &amp; Sign Audit Entry</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: AUDIT HISTORY */}
          {activeTab === 'history' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-3 bg-slate-50 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>Audit Ledger History for {selectedUnitName} Unit</span>
                <span className="font-mono text-slate-500">
                  {currentUnitData.auditHistory?.length || 0} Events
                </span>
              </div>

              {!currentUnitData.auditHistory || currentUnitData.auditHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  No adjustments recorded for this unit.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {currentUnitData.auditHistory.map((item) => (
                    <div key={item.id} className="p-3 text-xs flex flex-col sm:flex-row items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {item.action}
                          </span>
                          <span
                            className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                              item.amount >= 0
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {item.amount >= 0 ? `+${formatAED(item.amount)}` : formatAED(item.amount)}
                          </span>
                        </div>
                        <div className="text-slate-600 dark:text-slate-400 mt-1">
                          {item.notes || 'Reconciliation update'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Actor: {item.performedBy} • Previous: {formatAED(item.previousBalance)} → New: {formatAED(item.newBalance)}
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-slate-400 sm:text-right shrink-0">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
