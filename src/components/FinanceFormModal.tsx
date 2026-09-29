import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FinanceTransaction,
  TransactionType,
  PaymentMethodType,
  TransactionStatus,
  BillAttachment,
  FinancialParticular,
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
  Paperclip,
  Upload,
  Eye,
  Trash2,
  FileCheck,
  Image as ImageIcon,
  FolderTree,
  CornerDownRight,
  Clock,
} from 'lucide-react';

interface FinanceFormModalProps {
  isOpen: boolean;
  transactionToEdit: FinanceTransaction | null;
  initialType?: TransactionType;
  existingTransactions: FinanceTransaction[];
  particularsList?: FinancialParticular[];
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
  particularsList = [],
  units,
  userSession,
  lockedUnit,
  onClose,
  onSave,
}) => {
  // Ensure Central is available as an option
  const financeUnits = useMemo(() => {
    const list = [...units.filter((u) => !u.toLowerCase().startsWith('central'))];
    list.push('Central');
    return list;
  }, [units]);

  const [type, setType] = useState<TransactionType>(initialType);
  const [isInvoice, setIsInvoice] = useState<boolean>(false);
  const [dueDate, setDueDate] = useState<string>('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [unit, setUnit] = useState(lockedUnit || (financeUnits[0] || 'Fujairah'));
  
  // Particulars Hierarchy
  const [selectedMainParticularId, setSelectedMainParticularId] = useState<string>('');
  const [selectedSubParticularId, setSelectedSubParticularId] = useState<string>('');
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
  const [billAttachment, setBillAttachment] = useState<BillAttachment | undefined>(undefined);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Close on Escape key press
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

  // Available Main Particulars filtered by active type
  const availableMainParticulars = useMemo(() => {
    return particularsList.filter((p) => p.type === type && !p.parentId);
  }, [particularsList, type]);

  // Available Sub Particulars filtered by selected Main Particular
  const availableSubParticulars = useMemo(() => {
    if (!selectedMainParticularId) return [];
    return particularsList.filter((p) => p.parentId === selectedMainParticularId);
  }, [particularsList, selectedMainParticularId]);

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setType(transactionToEdit.type);
        setIsInvoice(!!transactionToEdit.isInvoice);
        setDueDate(transactionToEdit.dueDate || '');
        setReceiptNumber(transactionToEdit.receiptNumber);
        setDate(transactionToEdit.date);
        setUnit(transactionToEdit.unit);
        setParticulars(transactionToEdit.particulars || '');
        setSelectedMainParticularId(transactionToEdit.mainParticularId || '');
        setSelectedSubParticularId(transactionToEdit.subParticularId || '');
        setAmountAED(transactionToEdit.amountAED);
        setPaymentMethod(transactionToEdit.paymentMethod);
        setPartyName(transactionToEdit.partyName);
        setContactNumber(transactionToEdit.contactNumber || '');
        setReferenceNumber(transactionToEdit.referenceNumber || '');
        setNotes(transactionToEdit.notes || '');
        setStatus(transactionToEdit.status);
        setBillAttachment(transactionToEdit.billAttachment);

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
        const nextNo = getNextReceiptNumber(existingTransactions, startType, defaultUnit, isInvoice);
        setType(startType);
        setIsInvoice(false);
        setDueDate('');
        setReceiptNumber(nextNo);
        setDate(new Date().toISOString().split('T')[0]);
        setUnit(defaultUnit);
        setSelectedMainParticularId('');
        setSelectedSubParticularId('');
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
        setBillAttachment(undefined);
      }
      setError(null);
    }
  }, [isOpen, transactionToEdit, initialType, existingTransactions, lockedUnit, financeUnits]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setSelectedMainParticularId('');
    setSelectedSubParticularId('');
    if (!transactionToEdit) {
      setReceiptNumber(getNextReceiptNumber(existingTransactions, newType, unit, isInvoice));
      setCategory(newType === 'INCOME' ? FINANCE_INCOME_CATEGORIES[0] : FINANCE_EXPENSE_CATEGORIES[0]);
    }
  };

  const handleMainParticularChange = (mainId: string) => {
    setSelectedMainParticularId(mainId);
    setSelectedSubParticularId('');
    const foundMain = particularsList.find((p) => p.id === mainId);
    if (foundMain) {
      setCategory(foundMain.name);
      if (!particulars.trim()) {
        setParticulars(foundMain.name);
      }
    }
  };

  const handleSubParticularChange = (subId: string) => {
    setSelectedSubParticularId(subId);
    const foundSub = particularsList.find((p) => p.id === subId);
    if (foundSub) {
      const foundMain = particularsList.find((p) => p.id === selectedMainParticularId);
      const prefix = foundMain ? `${foundMain.name} - ` : '';
      setParticulars(`${prefix}${foundSub.name}`);
    }
  };

  const handleUnitChange = (newUnit: string) => {
    setUnit(newUnit);
    if (!transactionToEdit) {
      setReceiptNumber(getNextReceiptNumber(existingTransactions, type, newUnit, isInvoice));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setBillAttachment({
        fileName: file.name,
        fileType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        dataUrl,
        fileSizeKb: Math.round(file.size / 1024),
        uploadedAt: new Date().toISOString(),
      });
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read selected file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setBillAttachment(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = typeof amountAED === 'number' ? amountAED : parseFloat(String(amountAED));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
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
      receiptNumber: receiptNumber.trim() || getNextReceiptNumber(existingTransactions, type, finalUnit, isInvoice),
      date,
      type,
      category: finalCategory,
      mainParticularId: selectedMainParticularId || undefined,
      subParticularId: selectedSubParticularId || undefined,
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
      billAttachment: billAttachment || undefined,
      isInvoice,
      dueDate: isInvoice ? dueDate || undefined : undefined,
      createdAt: transactionToEdit ? transactionToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(savedTransaction);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-fade-in"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#881337] text-white flex items-center justify-between shadow-xs shrink-0">
          <div>
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-amber-300" />
              <span>
                {transactionToEdit
                  ? 'Edit Financial Voucher Record'
                  : isInvoice
                  ? 'Issue Invoice'
                  : type === 'INCOME'
                  ? 'Issue OFFICIAL RECEIPT'
                  : 'Issue OFFICIAL PAYMENT VOUCHER'}
              </span>
            </h3>
            <p className="text-[11px] text-rose-100 font-medium mt-0.5">
              Permanently printed contact: Email: kairalicaf@gmail.com • Unit-Scoped Ledger
            </p>
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

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-200 flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Selector (Income vs Expense vs Invoice) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300">Transaction Type:</span>
              <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInvoice}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsInvoice(checked);
                    if (!transactionToEdit) {
                      setReceiptNumber(getNextReceiptNumber(existingTransactions, type, unit, checked));
                    }
                  }}
                  className="rounded text-[#881337] focus:ring-[#881337]"
                />
                <span>Generate as Invoice</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('INCOME')}
                className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === 'INCOME'
                    ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-500/50'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>+ INCOME (Official Receipt)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('EXPENSE')}
                className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === 'EXPENSE'
                    ? 'bg-rose-700 text-white shadow-xs ring-2 ring-rose-500/50'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>- EXPENSE (Official Voucher)</span>
              </button>
            </div>
          </div>

          {/* Document Number, Date, and Unit Scoping */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Doc Number *</span>
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-[#881337]"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Date of Issue *</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#881337]"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Unit (Ledger) *</span>
              </label>
              <select
                value={unit}
                onChange={(e) => handleUnitChange(e.target.value)}
                disabled={!!lockedUnit}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-[#881337] disabled:opacity-60"
              >
                {financeUnits.map((u) => (
                  <option key={u} value={u}>
                    {u} {u === 'Central' ? 'Committee' : 'Unit'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Invoice Due Date (if Invoice mode active) */}
          {isInvoice && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-200 block text-xs">
                    Invoice Payment Due Date
                  </span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1 px-2.5 py-1 text-xs border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
              <div className="text-[11px] text-amber-700 dark:text-amber-300 max-w-xs text-right">
                Invoices can be converted into Official Receipts with 1-click once payment is collected.
              </div>
            </div>
          )}

          {/* Financial Particulars Hierarchy Picker */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#881337] dark:text-rose-400 flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5" />
                <span>Financial Particulars Classification</span>
              </label>
              <span className="text-[10px] text-slate-400">Auto Parent-Child Linking</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Main Particular Head *
                </label>
                <select
                  value={selectedMainParticularId}
                  onChange={(e) => handleMainParticularChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium outline-none focus:ring-1 focus:ring-[#881337]"
                >
                  <option value="">-- Select Master Head --</option>
                  {availableMainParticulars.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.code ? `(${p.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Sub-Particular Breakdown
                </label>
                <select
                  value={selectedSubParticularId}
                  onChange={(e) => handleSubParticularChange(e.target.value)}
                  disabled={!selectedMainParticularId || availableSubParticulars.length === 0}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium outline-none focus:ring-1 focus:ring-[#881337] disabled:opacity-40"
                >
                  <option value="">
                    {availableSubParticulars.length === 0 ? 'No Sub-Items' : '-- Select Sub-Particular --'}
                  </option>
                  {availableSubParticulars.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Line Item / Particulars Detail Description */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Particulars / Line Item Description *
            </label>
            <textarea
              rows={2}
              value={particulars}
              onChange={(e) => setParticulars(e.target.value)}
              placeholder="Detailed description for the voucher / receipt line item..."
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#881337]"
            />
          </div>

          {/* Amount and Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1">
                <DirhamIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Amount (AED) *</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amountAED}
                onChange={(e) => setAmountAED(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-[#881337]"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Payment Method *</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-[#881337]"
              >
                <option value="Cash">Cash (Immediate Handover)</option>
                <option value="Bank Transfer">Bank Transfer (Direct / Online)</option>
                <option value="Cheque">Cheque</option>
                <option value="Online / Card">Online / Card Payment</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Party Name and Contact Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {type === 'INCOME' ? 'Received From (Payer / Member) *' : 'Paid To (Payee / Vendor) *'}
                </span>
              </label>
              <input
                type="text"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder={type === 'INCOME' ? 'Payer name or company' : 'Vendor or beneficiary name'}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#881337]"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Party Contact / Mobile (Optional)
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+971 50 xxx xxxx"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#881337]"
              />
            </div>
          </div>

          {/* Reference Number and Transaction Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                External Bill / Cheque / Bank Ref No
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. CHQ-9921 or TXN-44219"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#881337]"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Voucher Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-[#881337]"
              >
                <option value="Completed">Completed (Cleared &amp; Disbursed)</option>
                <option value="Pending">Pending (Draft / Unsettled)</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Notes / Remarks */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Treasury Remarks / Internal Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional committee note, approval note, or authorization detail..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#881337]"
            />
          </div>

          {/* Attachment Upload (Bill / Invoice Proof) */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-[#881337] dark:text-rose-400" />
              <span>Attach Bill / Invoice / Voucher Scan (PDF or Image, max 10MB)</span>
            </label>

            {billAttachment ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 truncate">
                  {billAttachment.fileType.startsWith('image/') ? (
                    <ImageIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  <div className="truncate">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                      {billAttachment.fileName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {billAttachment.fileSizeKb} KB &bull; Uploaded
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewModalOpen(true)}
                    className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                    title="Preview attached bill"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    className="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    title="Remove attachment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#881337] rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/40"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,application/pdf"
                  className="hidden"
                />
                <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                <div className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                  Click to attach invoice scan or receipt photo
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Modal Footer with Cancel & Submit always visible */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-[#881337] hover:bg-[#700f2b] text-white font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-amber-300" />
            <span>{transactionToEdit ? 'Save Changes' : 'Record & Issue Document'}</span>
          </button>
        </div>
      </form>

      {/* Bill Preview Submodal */}
      {previewModalOpen && billAttachment && (
        <div
          onClick={() => setPreviewModalOpen(false)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl p-4 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 dark:text-white text-xs">
                {billAttachment.fileName}
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg p-2">
              {billAttachment.fileType.includes('pdf') ? (
                <iframe
                  src={billAttachment.dataUrl}
                  title="PDF Bill Preview"
                  className="w-full h-96 border-none"
                />
              ) : (
                <img
                  src={billAttachment.dataUrl}
                  alt="Bill attachment preview"
                  className="max-w-full max-h-[65vh] object-contain rounded"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
