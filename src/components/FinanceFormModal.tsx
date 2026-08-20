import React, { useState, useEffect } from 'react';
import {
  FinanceTransaction,
  TransactionType,
  PaymentMethodType,
  TransactionStatus,
  FINANCE_INCOME_CATEGORIES,
  FINANCE_EXPENSE_CATEGORIES,
} from '../types/finance';
import { UserSession } from '../types/member';
import { getNextReceiptNumber } from '../utils/financeStorage';
import { DirhamIcon } from './DirhamIcon';
import {
  X,
  PlusCircle,
  Building2,
  FileText,
  CreditCard,
  User,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface FinanceFormModalProps {
  isOpen: boolean;
  transactionToEdit: FinanceTransaction | null;
  initialType?: TransactionType;
  existingTransactions: FinanceTransaction[];
  units: string[];
  userSession: UserSession | null;
  lockedUnit?: string;
  onClose: () => void;
  onSave: (transaction: FinanceTransaction) => void;
}

export const FinanceFormModal: React.FC<FinanceFormModalProps> = ({
  isOpen,
  transactionToEdit,
  initialType = 'INCOME',
  existingTransactions,
  units,
  userSession,
  lockedUnit,
  onClose,
  onSave,
}) => {
  // Ensure Central is available as an option
  const financeUnits = React.useMemo(() => {
    const list = [...units.filter((u) => !u.toLowerCase().startsWith('central'))];
    list.push('Central');
    return list;
  }, [units]);

  const [type, setType] = useState<TransactionType>(initialType);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [unit, setUnit] = useState(lockedUnit || (financeUnits[0] || 'Fujairah'));
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [particulars, setParticulars] = useState('');
  const [amountAED, setAmountAED] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Cash');
  const [partyName, setPartyName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<TransactionStatus>('Completed');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setType(transactionToEdit.type);
        setReceiptNumber(transactionToEdit.receiptNumber);
        setDate(transactionToEdit.date);
        setUnit(transactionToEdit.unit);
        setParticulars(transactionToEdit.particulars || '');
        setAmountAED(transactionToEdit.amountAED);
        setPaymentMethod(transactionToEdit.paymentMethod);
        setPartyName(transactionToEdit.partyName);
        setContactNumber(transactionToEdit.contactNumber || '');
        setReferenceNumber(transactionToEdit.referenceNumber || '');
        setNotes(transactionToEdit.notes || '');
        setStatus(transactionToEdit.status);

        const isIncomeCat = (FINANCE_INCOME_CATEGORIES as readonly string[]).includes(transactionToEdit.category);
        const isExpenseCat = (FINANCE_EXPENSE_CATEGORIES as readonly string[]).includes(transactionToEdit.category);
        if (isIncomeCat || isExpenseCat) {
          setCategory(transactionToEdit.category);
          setCustomCategory('');
        } else {
          setCategory('CUSTOM');
          setCustomCategory(transactionToEdit.category);
        }
      } else {
        const defaultUnit = lockedUnit || (financeUnits[0] || 'Fujairah');
        const startType: TransactionType = initialType === 'EXPENSE' ? 'EXPENSE' : 'INCOME';
        const nextNo = getNextReceiptNumber(existingTransactions, startType, defaultUnit);
        setType(startType);
        setReceiptNumber(nextNo);
        setDate(new Date().toISOString().split('T')[0]);
        setUnit(defaultUnit);
        setCategory(startType === 'INCOME' ? FINANCE_INCOME_CATEGORIES[0] : FINANCE_EXPENSE_CATEGORIES[0]);
        setCustomCategory('');
        setParticulars('');
        setAmountAED('');
        setPaymentMethod('Cash');
        setPartyName('');
        setContactNumber('');
        setReferenceNumber('');
        setNotes('');
        setStatus('Completed');
      }
      setError(null);
    }
  }, [isOpen, transactionToEdit, initialType, existingTransactions, lockedUnit, financeUnits]);

  // When switching type on a new transaction, update default category and receipt prefix
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (!transactionToEdit) {
      setReceiptNumber(getNextReceiptNumber(existingTransactions, newType, unit));
      setCategory(newType === 'INCOME' ? FINANCE_INCOME_CATEGORIES[0] : FINANCE_EXPENSE_CATEGORIES[0]);
    }
  };

  const handleUnitChange = (newUnit: string) => {
    setUnit(newUnit);
    if (!transactionToEdit) {
      setReceiptNumber(getNextReceiptNumber(existingTransactions, type, newUnit));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = typeof amountAED === 'number' ? amountAED : parseFloat(String(amountAED));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0 AED.');
      return;
    }

    if (!particulars.trim()) {
      setError('Please enter transaction particulars / description.');
      return;
    }

    if (!partyName.trim()) {
      setError(type === 'INCOME' ? 'Please enter the name of the payer / contributor.' : 'Please enter the payee / recipient name.');
      return;
    }

    const finalCategory = category === 'CUSTOM' ? (customCategory.trim() || 'General Transaction') : category;
    const finalUnit = lockedUnit || unit;

    const savedTransaction: FinanceTransaction = {
      id: transactionToEdit ? transactionToEdit.id : `fin-${Date.now()}`,
      receiptNumber: receiptNumber.trim() || getNextReceiptNumber(existingTransactions, type, finalUnit),
      date,
      type,
      category: finalCategory,
      particulars: particulars.trim(),
      unit: finalUnit,
      amountAED: numAmount,
      paymentMethod,
      partyName: partyName.trim(),
      contactNumber: contactNumber.trim() || undefined,
      recordedBy: userSession?.fullName || 'Finance Desk',
      referenceNumber: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      status,
      createdAt: transactionToEdit ? transactionToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(savedTransaction);
  };

  const categories = type === 'INCOME' ? FINANCE_INCOME_CATEGORIES : FINANCE_EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-[#8b0000] text-white flex items-center justify-between border-b border-[#730000]">
          <div>
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-amber-300" />
              <span>{transactionToEdit ? 'Edit Transaction Record' : 'Manual Entry: Record Transaction'}</span>
            </h3>
            <p className="text-xs text-red-100 mt-0.5">
              Record Income or Expense with official receipt generation and unit tracking
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-md transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Selector (Income vs Expense) */}
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700 w-28">Transaction Type:</span>
            <div className="grid grid-cols-2 gap-2 flex-1">
              <button
                type="button"
                onClick={() => handleTypeChange('INCOME')}
                className={`py-2 px-4 rounded-md font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === 'INCOME'
                    ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-500/50'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span>+ INCOME (Received)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('EXPENSE')}
                className={`py-2 px-4 rounded-md font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === 'EXPENSE'
                    ? 'bg-rose-700 text-white shadow-sm ring-2 ring-rose-500/50'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span>- EXPENSE (Payment)</span>
              </button>
            </div>
          </div>

          {/* Row 1: Receipt Number, Date, Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Receipt / Voucher No *</span>
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                required
                placeholder="e.g. KCA-REC-2026-105"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono font-bold text-slate-800 focus:ring-1 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Transaction Date *</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-slate-800 focus:ring-1 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#8b0000]" />
                <span>Unit (Area) *</span>
              </label>
              <select
                value={unit}
                onChange={(e) => handleUnitChange(e.target.value)}
                disabled={!!lockedUnit}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-bold text-slate-800 focus:ring-1 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none disabled:bg-slate-100"
              >
                {financeUnits.map((u) => (
                  <option key={u} value={u}>
                    {u} {u === 'Central Committee' ? '' : 'Unit'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Category */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-semibold text-slate-800 focus:ring-1 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="CUSTOM">+ Custom Category (Manual)</option>
            </select>

            {category === 'CUSTOM' && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Type custom category name..."
                className="mt-2 w-full px-3 py-1.5 border border-amber-300 bg-amber-50/50 rounded-md text-slate-800 focus:ring-1 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none"
                required
              />
            )}
          </div>

          {/* Row 3: Manual Particulars (Detailed text description) */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Particulars / Transaction Description (Manual Entry) *
            </label>
            <textarea
              value={particulars}
              onChange={(e) => setParticulars(e.target.value)}
              rows={2}
              required
              placeholder="e.g. Monthly membership fee batch collection from 15 members, or Onam celebration auditorium hall booking advance payment"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-800 focus:ring-1 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none leading-relaxed"
            />
          </div>

          {/* Row 4: Amount & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <DirhamIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Amount (AED) *</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amountAED}
                onChange={(e) => setAmountAED(e.target.value ? parseFloat(e.target.value) : '')}
                required
                placeholder="e.g. 500.00"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono font-black text-base text-[#8b0000] focus:ring-1 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Payment Method *</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-slate-800 font-semibold focus:ring-1 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none"
              >
                <option value="Cash">Cash Payment</option>
                <option value="Bank Transfer">Bank Transfer (Direct / Online)</option>
                <option value="Cheque">Cheque</option>
                <option value="Card / POS">Card / POS Terminal</option>
                <option value="Online">Online Payment Gateway</option>
              </select>
            </div>
          </div>

          {/* Row 5: Party Name & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {type === 'INCOME' ? 'Received From (Payer / Member) *' : 'Paid To (Beneficiary / Vendor) *'}
                </span>
              </label>
              <input
                type="text"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                required
                placeholder={type === 'INCOME' ? 'e.g. Member Name or Sponsor Org' : 'e.g. Auditorium Manager / Printer Vendor'}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-slate-800 focus:ring-1 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Party Contact Number (Optional)
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+971 50 123 4567"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-slate-800 font-mono focus:ring-1 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none"
              />
            </div>
          </div>

          {/* Row 6: Reference No & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Reference / Cheque / Txn / Bill No (Optional)
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. CHQ-99212 or FAB-TXN-8823"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono text-slate-800 focus:ring-1 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Internal Account Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Audited, verified against invoice, etc."
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-slate-800 focus:ring-1 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-md bg-[#8b0000] hover:bg-[#730000] text-white font-bold transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <span>Save &amp; Generate Voucher</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
