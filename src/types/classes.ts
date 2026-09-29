// Classes & Workshop Management Types for KCA-MMS

export const CLASS_CATEGORY_OPTIONS = [
  'Instrumental',
  'Dance',
  'Music',
  'Language',
  'Art & Craft',
  'Martial Arts & Yoga',
  'Theatre & Drama',
  'Other',
] as const;

export type ClassCategory = (typeof CLASS_CATEGORY_OPTIONS)[number] | string;

export const CLASS_PRESET_NAMES = [
  'Chenda Melam (Beginners / Intermediate / Advanced)',
  'Classical Dance / Bharatanatyam',
  'Mohiniyattam & Kerala Natanam',
  'Carnatic Classical Vocal Music',
  'Keyboard & Western Classical Piano',
  'Guitar & Acoustic Strings',
  'Violin (Carnatic / Western)',
  'Drawing, Oil Painting & Fine Arts',
  'Malayalam Bhasha Padanam (Language & Literacy Academy)',
  'Yoga & Mindful Wellbeing',
  'Karate & Self Defence Academy',
  'Maddalam & Panchavadyam Workshop',
  'Drama & Theatre Arts',
  'Chess & Cognitive Sports',
] as const;

export type ParticipantFeeStatus = 'Paid' | 'Pending' | 'Partial' | 'Exempt' | 'Not Paid';
export type ParticipantStatus = 'Active' | 'Inactive' | 'Completed' | 'Dropped';

export interface CulturalClass {
  id: string;
  code: string; // e.g. CLS-FUJ-001
  name: string;
  category: ClassCategory;
  unit: string;
  batchName?: string; // e.g. "Batch A - Morning", "Weekend Batch 1"
  instructorName: string;
  instructorContact?: string;
  scheduleDays: string[]; // e.g. ['Friday', 'Saturday']
  scheduleTime: string; // e.g. '04:30 PM - 06:30 PM'
  location: string;
  monthlyFeeAED: number;
  status: 'Active' | 'Inactive' | 'Upcoming' | 'Completed' | 'On Hold';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StudentSplitPayment {
  id: string;
  receiptNumber: string;
  amountAED: number;
  date: string;
  paymentMonth?: string;
  method: string; // 'Cash', 'Card / POS', 'Bank Transfer', 'Online', etc.
  notes?: string;
  recordedBy?: string;
  financeTransactionId?: string;
}

export type StudentPaymentRecord = StudentSplitPayment;

export interface ClassParticipant {
  id: string;
  studentId: string; // e.g. STU-FUJ-001
  classId: string;
  className: string;
  unit: string;
  batchName?: string; // e.g. "Weekend Morning Batch"
  fullName: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  guardianName: string;
  guardianPhone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  joiningDate: string;
  feeStatus: ParticipantFeeStatus;
  feeAmountAED: number; // Total fee required for course / month
  totalPaidAED?: number; // Sum of all payments / installments made
  balanceDueAED?: number; // feeAmountAED - totalPaidAED
  paymentMethod?: string;
  receiptNumber?: string;
  paymentDate?: string;
  lastPaidMonth?: string;
  paymentHistory?: StudentSplitPayment[];
  splitPayments?: StudentSplitPayment[];
  status: ParticipantStatus;
  customOptions?: Record<string, string>;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface AttendanceStudentEntry {
  participantId: string;
  studentName: string;
  status: AttendanceStatus;
  remarks?: string;
}

export type ParticipantAttendanceEntry = AttendanceStudentEntry;

export interface ClassAttendanceRecord {
  id: string;
  classId: string;
  className: string;
  unit: string;
  batchName?: string;
  date: string;
  topicCovered?: string;
  recordedBy: string;
  records: AttendanceStudentEntry[];
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  notes?: string;
  createdAt: string;
}
