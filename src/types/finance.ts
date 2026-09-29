// Finance & Accounting Types for KCA MMS

export type TransactionType = 'INCOME' | 'EXPENSE';

export type PaymentMethodType = 'Cash' | 'Bank Transfer';
export type PaymentMethod = PaymentMethodType;

export type TransactionStatus = 'Completed' | 'Pending' | 'Cancelled';

export interface FinancialParticular {
  id: string;
  name: string;
  type: TransactionType;
  parentId?: string | null; // Null if it's a Main Particular; contains parent ID if Sub Particular
  code?: string;
  description?: string;
  isDefault?: boolean;
  createdAt?: string;
}

export const INITIAL_DEFAULT_PARTICULARS: FinancialParticular[] = [
  // INCOME - Main Particulars
  { id: 'inc_mem', name: 'Membership & Registrations', type: 'INCOME', parentId: null, code: 'INC-MEM' },
  { id: 'inc_spon', name: 'Sponsorship & Donations', type: 'INCOME', parentId: null, code: 'INC-SPON' },
  { id: 'inc_events', name: 'Cultural Events & Programs', type: 'INCOME', parentId: null, code: 'INC-EVT' },
  { id: 'inc_tuition', name: 'Classes & Academy Tuition', type: 'INCOME', parentId: null, code: 'INC-TUT' },
  { id: 'inc_rent', name: 'Hall & Asset Rental', type: 'INCOME', parentId: null, code: 'INC-RENT' },
  { id: 'inc_welfare', name: 'Welfare Relief Funds', type: 'INCOME', parentId: null, code: 'INC-WELF' },
  { id: 'inc_other', name: 'General & Sundry Income', type: 'INCOME', parentId: null, code: 'INC-OTH' },

  // INCOME - Sub Particulars
  { id: 'sub_mem_new', name: 'New Membership Admission', type: 'INCOME', parentId: 'inc_mem' },
  { id: 'sub_mem_renew', name: 'Annual Membership Renewal', type: 'INCOME', parentId: 'inc_mem' },
  { id: 'sub_mem_life', name: 'Patron / Life Membership', type: 'INCOME', parentId: 'inc_mem' },

  { id: 'sub_spon_title', name: 'Title Event Sponsor', type: 'INCOME', parentId: 'inc_spon' },
  { id: 'sub_spon_co', name: 'Co-Sponsor & Corporate Banner', type: 'INCOME', parentId: 'inc_spon' },
  { id: 'sub_spon_indiv', name: 'Individual Patron Contribution', type: 'INCOME', parentId: 'inc_spon' },

  { id: 'sub_evt_tickets', name: 'Event Entry Tickets & Passes', type: 'INCOME', parentId: 'inc_events' },
  { id: 'sub_evt_foodstall', name: 'Food Stall / Exhibition Stalls', type: 'INCOME', parentId: 'inc_events' },
  { id: 'sub_evt_souvenir', name: 'Souvenir & Brochure Ads', type: 'INCOME', parentId: 'inc_events' },

  { id: 'sub_tut_dance', name: 'Classical Dance Class Tuition', type: 'INCOME', parentId: 'inc_tuition' },
  { id: 'sub_tut_music', name: 'Music & Instrumental Fee', type: 'INCOME', parentId: 'inc_tuition' },
  { id: 'sub_tut_malayalam', name: 'Malayalam Mission Tuition', type: 'INCOME', parentId: 'inc_tuition' },

  // EXPENSE - Main Particulars
  { id: 'exp_rent', name: 'Office Rent & Utilities', type: 'EXPENSE', parentId: null, code: 'EXP-RENT' },
  { id: 'exp_events', name: 'Event & Program Production', type: 'EXPENSE', parentId: null, code: 'EXP-EVT' },
  { id: 'exp_instructors', name: 'Instructor & Honorarium Fees', type: 'EXPENSE', parentId: null, code: 'EXP-INST' },
  { id: 'exp_welfare', name: 'Community Welfare & Medical Aid', type: 'EXPENSE', parentId: null, code: 'EXP-WELF' },
  { id: 'exp_print', name: 'Printing, Stationery & ID Cards', type: 'EXPENSE', parentId: null, code: 'EXP-PRNT' },
  { id: 'exp_admin', name: 'Admin, Bank & Government Fees', type: 'EXPENSE', parentId: null, code: 'EXP-ADM' },
  { id: 'exp_hospitality', name: 'Refreshments & Hospitality', type: 'EXPENSE', parentId: null, code: 'EXP-HOSP' },

  // EXPENSE - Sub Particulars
  { id: 'sub_exp_auditorium', name: 'Auditorium & Stage Setup', type: 'EXPENSE', parentId: 'exp_events' },
  { id: 'sub_exp_sound_light', name: 'Sound, Lighting & LED Walls', type: 'EXPENSE', parentId: 'exp_events' },
  { id: 'sub_exp_artist', name: 'Artist Travel, Visa & Accommodation', type: 'EXPENSE', parentId: 'exp_events' },
  { id: 'sub_exp_trophies', name: 'Mementos, Medals & Certificates', type: 'EXPENSE', parentId: 'exp_events' },

  { id: 'sub_exp_welfare_med', name: 'Emergency Medical Assistance', type: 'EXPENSE', parentId: 'exp_welfare' },
  { id: 'sub_exp_welfare_repat', name: 'Repatriation & Legal Aid', type: 'EXPENSE', parentId: 'exp_welfare' },

  { id: 'sub_exp_id_cards', name: 'PVC Membership Smart Cards', type: 'EXPENSE', parentId: 'exp_print' },
  { id: 'sub_exp_banners', name: 'Banners, Flyers & Publicity', type: 'EXPENSE', parentId: 'exp_print' },
];

export const FINANCE_INCOME_CATEGORIES = [
  'Membership Fee',
  'Membership Renewal',
  'Class / Tuition Fee',
  'Cultural Event Ticket',
  'Sponsorship & Donation',
  'Hall / Asset Rental',
  'Merchandise & Publication',
  'Welfare Relief Fund',
  'Other Income',
] as const;

export const FINANCE_EXPENSE_CATEGORIES = [
  'Office Rent & Utilities',
  'Event & Program Expenses',
  'Instructor & Trainer Fees',
  'Community Welfare & Relief',
  'Printing & ID Cards',
  'Asset & Inventory Purchase',
  'Refreshments & Hospitality',
  'Bank & Administrative Charges',
  'Other Expense',
] as const;

export interface BillAttachment {
  fileName: string;
  fileType: string;
  dataUrl: string;
  fileSizeKb?: number;
  uploadedAt?: string;
}

export interface UnitBalanceAuditItem {
  id: string;
  timestamp: string;
  action: 'Opening Set' | 'Manual Adjustment' | 'Cash Received' | 'Voucher Disbursed' | 'Fund Transfer';
  amount: number;
  previousBalance: number;
  newBalance: number;
  performedBy: string;
  notes?: string;
}

export interface UnitCashBalance {
  unit: string;
  openingBalanceAED: number;
  cashInHandAED: number;
  bankBalanceAED: number;
  lastUpdated: string;
  notes?: string;
  auditHistory: UnitBalanceAuditItem[];
}

export interface FinanceTransaction {
  id: string;
  receiptNumber: string; // e.g. "OR-2026-0012" (for Official Receipt) or "PV-2026-0008" (for Payment Voucher) or "INV-2026-0004"
  date: string;
  type: TransactionType;
  category: string;
  mainParticularId?: string; // Links to FinancialParticular
  subParticularId?: string; // Links to Sub-FinancialParticular
  particulars: string; // Human readable description
  amountAED: number;
  unit: string;
  paymentMethod: PaymentMethodType;
  partyName: string;
  contactNumber?: string;
  referenceNumber?: string;
  notes?: string;
  status: TransactionStatus;
  recordedBy?: string;
  studentId?: string;
  classId?: string;
  billAttachment?: BillAttachment;
  
  // Invoicing & Receipt Conversion
  isInvoice?: boolean;
  dueDate?: string;
  isInvoiceConvertedToReceipt?: boolean;
  convertedReceiptNumber?: string;
  convertedAt?: string;

  createdAt: string;
  updatedAt?: string;
}

export interface FinanceFilterOptions {
  search: string;
  type: 'ALL' | TransactionType;
  category: string;
  mainParticularId?: string;
  subParticularId?: string;
  unit: string;
  startDate: string;
  endDate: string;
}

export interface UnitFinanceSummary {
  unit: string;
  totalIncome: number;
  totalExpense: number;
  netSurplus: number;
  cashInHand: number;
  transactionCount: number;
}
