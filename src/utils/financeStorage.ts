import {
  FinanceTransaction,
  FinancialParticular,
  UnitCashBalance,
  INITIAL_DEFAULT_PARTICULARS,
} from '../types/finance';
import { INITIAL_FINANCE_TRANSACTIONS } from '../data/initialFinanceData';
import { getUnitCode } from './idGenerator';

export const STORAGE_KEY_FINANCE = 'kca_fujairah_finance_transactions_v1';
export const STORAGE_KEY_PARTICULARS = 'kca_fujairah_finance_particulars_v1';
export const STORAGE_KEY_UNIT_BALANCES = 'kca_fujairah_finance_unit_balances_v1';

export const DEFAULT_UNITS = ['Fujairah', 'Kalba', 'Khorfakhan', 'Dibba', 'Central'];

export function loadFinanceTransactions(): FinanceTransaction[] {
  if (typeof window === 'undefined') return INITIAL_FINANCE_TRANSACTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FINANCE);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading finance transactions from storage:', e);
  }
  return INITIAL_FINANCE_TRANSACTIONS;
}

export function saveFinanceTransactions(transactions: FinanceTransaction[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_FINANCE, JSON.stringify(transactions));
  } catch (e) {
    console.error('Error saving finance transactions to storage:', e);
  }
}

// ----------------------------------------------------
// Master Particulars Storage & Hierarchy Management
// ----------------------------------------------------
export function loadFinancialParticulars(): FinancialParticular[] {
  if (typeof window === 'undefined') return INITIAL_DEFAULT_PARTICULARS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PARTICULARS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading particulars from storage:', e);
  }
  return INITIAL_DEFAULT_PARTICULARS;
}

export function saveFinancialParticulars(particulars: FinancialParticular[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PARTICULARS, JSON.stringify(particulars));
  } catch (e) {
    console.error('Error saving particulars to storage:', e);
  }
}

// ----------------------------------------------------
// Multi-Unit Cash-in-Balance Management & Audit Logs
// ----------------------------------------------------
export function loadUnitCashBalances(): UnitCashBalance[] {
  const zeroDefaultBalances: UnitCashBalance[] = DEFAULT_UNITS.map((unit) => ({
    unit,
    openingBalanceAED: 0,
    cashInHandAED: 0,
    bankBalanceAED: 0,
    lastUpdated: new Date().toISOString().split('T')[0],
    notes: `Opening balance 0.00 AED for ${unit} unit ledger`,
    auditHistory: [
      {
        id: `audit-${unit}-init`,
        timestamp: new Date().toISOString(),
        action: 'Opening Set',
        amount: 0,
        previousBalance: 0,
        newBalance: 0,
        performedBy: 'System Administrator',
        notes: `Initial opening balance configured at 0.00 AED for ${unit} unit`,
      },
    ],
  }));

  if (typeof window === 'undefined') return zeroDefaultBalances;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UNIT_BALANCES);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading unit cash balances:', e);
  }
  return zeroDefaultBalances;
}

export function saveUnitCashBalances(balances: UnitCashBalance[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_UNIT_BALANCES, JSON.stringify(balances));
  } catch (e) {
    console.error('Error saving unit cash balances:', e);
  }
}

/**
 * Checks if a member has a Central Committee designation
 */
export function isCentralCommitteeMember(member: { membershipType?: string } | null | undefined): boolean {
  if (!member || !member.membershipType) return false;
  return (
    member.membershipType === 'Central Committee Member' ||
    member.membershipType.toLowerCase().includes('central')
  );
}

/**
 * Determines which finance ledger unit receives the payment
 */
export function getFinanceLedgerUnitForMember(
  member: { membershipType?: string; unit?: string } | null | undefined
): string {
  if (isCentralCommitteeMember(member)) {
    return 'Central';
  }
  return member?.unit || 'Fujairah';
}

/**
 * Returns a unit-specific receipt, expense voucher, or invoice code prefix
 */
export function getNextReceiptNumber(
  transactions: FinanceTransaction[],
  type: 'INCOME' | 'EXPENSE',
  unitName: string = 'Fujairah',
  isInvoice: boolean = false
): string {
  const unitCode = getUnitCode(unitName);
  const typeCode = isInvoice ? 'INV' : type === 'INCOME' ? 'REC' : 'EXP';
  const year = new Date().getFullYear();
  const prefix = `KCA-${unitCode}-${typeCode}-${year}-`;
  const startNum = 101;

  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escapedPrefix}(\\d+)`, 'i');

  const legacyPrefix = type === 'INCOME' ? `KCA-REC-${year}-` : `KCA-EXP-${year}-`;
  const escapedLegacy = legacyPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const legacyRegex = new RegExp(`^${escapedLegacy}(\\d+)`, 'i');

  let maxNum = startNum - 1;
  for (const t of transactions) {
    if (t.receiptNumber) {
      const match = t.receiptNumber.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      } else if (t.unit && getUnitCode(t.unit) === unitCode) {
        const legMatch = t.receiptNumber.match(legacyRegex);
        if (legMatch && legMatch[1]) {
          const num = parseInt(legMatch[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }
  }

  return `${prefix}${maxNum + 1}`;
}

export function exportFinanceCsv(transactions: FinanceTransaction[], filename = 'KCA_Finance_Ledger.csv'): void {
  const headers = [
    'Document / Receipt No',
    'Date',
    'Type',
    'Category',
    'Unit',
    'Particulars / Details',
    'Received From / Paid To',
    'Amount (AED)',
    'Payment Method',
    'Reference / Bill No',
    'Status',
    'Recorded By',
    'Notes',
  ];

  const escapeCsv = (str: string | number | undefined | null) => {
    if (str === undefined || str === null) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = transactions.map((t) => [
    escapeCsv(t.receiptNumber),
    escapeCsv(t.date),
    escapeCsv(t.type),
    escapeCsv(t.category),
    escapeCsv(t.unit),
    escapeCsv(t.particulars),
    escapeCsv(t.partyName),
    escapeCsv(t.amountAED),
    escapeCsv(t.paymentMethod),
    escapeCsv(t.referenceNumber || ''),
    escapeCsv(t.status),
    escapeCsv(t.recordedBy),
    escapeCsv(t.notes || ''),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
