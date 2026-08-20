export type TransactionType = 'INCOME' | 'EXPENSE';

export type PaymentMethodType = 'Cash' | 'Bank Transfer' | 'Cheque' | 'Card / POS' | 'Online';

export type TransactionStatus = 'Completed' | 'Pending' | 'Cancelled';

export interface FinanceTransaction {
  id: string;
  receiptNumber: string; // e.g. KCA-REC-2026-001 or KCA-EXP-2026-001
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
  particulars: string; // Description / Details entered manually
  unit: string; // e.g. Fujairah, Kalba, Khorfakhan, Dibba, or General / All Units
  amountAED: number;
  paymentMethod: PaymentMethodType;
  partyName: string; // Received from (Income) or Paid to (Expense)
  contactNumber?: string;
  recordedBy: string; // Name of person who entered the record
  referenceNumber?: string; // Cheque No, Bank Ref, Bill No
  notes?: string;
  status: TransactionStatus;
  createdAt: string;
  updatedAt?: string;
}

export const FINANCE_INCOME_CATEGORIES = [
  'Membership Dues & Renewals',
  'Cultural Class & Course Fees',
  'Voluntary Donations & Contributions',
  'Event / Program Sponsorship',
  'Cultural Festival / Onam Celebration Passes',
  'Sports & Youth Wing Subscriptions',
  'Welfare Fund Collection',
  'Souvenir / Advertisement Space',
  'Miscellaneous Income',
] as const;

export const FINANCE_EXPENSE_CATEGORIES = [
  'Hall Rent & Venue Booking',
  'Event Stage, Light & Sound Setup',
  'Printing, ID Cards & Stationery',
  'Member Welfare & Medical Assistance',
  'Food & Refreshments',
  'Prizes, Trophies & Mementos',
  'Office Administration & Utilities',
  'Media, Photography & Promotion',
  'Transportation & Logistics',
  'Miscellaneous Expense',
] as const;
