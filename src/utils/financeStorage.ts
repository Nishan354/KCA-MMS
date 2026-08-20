import { FinanceTransaction } from '../types/finance';
import { INITIAL_FINANCE_TRANSACTIONS } from '../data/initialFinanceData';
import { getUnitCode } from './idGenerator';

export const STORAGE_KEY_FINANCE = 'kca_fujairah_finance_transactions_v1';

export function loadFinanceTransactions(): FinanceTransaction[] {
  if (typeof window === 'undefined') return INITIAL_FINANCE_TRANSACTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FINANCE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
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
 * Determines which finance ledger unit receives the payment:
 * - If Central Committee Member: 'Central' (regardless of which local unit they belong to)
 * - Otherwise: their local unit (e.g. 'Fujairah', 'Kalba', 'Khorfakhan', 'Dibba')
 */
export function getFinanceLedgerUnitForMember(member: { membershipType?: string; unit?: string } | null | undefined): string {
  if (isCentralCommitteeMember(member)) {
    return 'Central';
  }
  return member?.unit || 'Fujairah';
}

/**
 * Returns a unit-specific receipt or expense voucher code prefix:
 * Examples:
 * - Income (Receipt):
 *   - Fujairah:   KCA-FU-REC-2026-101
 *   - Kalba:      KCA-KB-REC-2026-101
 *   - Khorfakhan: KCA-KF-REC-2026-101
 *   - Dibba:      KCA-DB-REC-2026-101
 *   - Central Committee: KCA-CC-REC-2026-101
 *
 * - Expense (Payment Voucher):
 *   - Fujairah:   KCA-FU-EXP-2026-101
 *   - Kalba:      KCA-KB-EXP-2026-101
 *   - Khorfakhan: KCA-KF-EXP-2026-101
 *   - Dibba:      KCA-DB-EXP-2026-101
 *   - Central Committee: KCA-CC-EXP-2026-101
 */
export function getNextReceiptNumber(
  transactions: FinanceTransaction[],
  type: 'INCOME' | 'EXPENSE',
  unitName: string = 'Fujairah'
): string {
  const unitCode = getUnitCode(unitName);
  const typeCode = type === 'INCOME' ? 'REC' : 'EXP';
  const year = new Date().getFullYear();
  const prefix = `KCA-${unitCode}-${typeCode}-${year}-`;
  const startNum = 101;

  // Escape special regex characters in the prefix
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escapedPrefix}(\\d+)`, 'i');

  // Also support legacy/unscoped format matching if needed
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
        // Check legacy regex if same unit
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
    'Receipt / Voucher No',
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
}
