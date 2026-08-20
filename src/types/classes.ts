export type ClassCategory =
  | 'Dance'
  | 'Instrumental'
  | 'Music'
  | 'Language'
  | 'Martial Arts'
  | 'Art & Craft'
  | 'Fitness'
  | 'Theatre & Drama'
  | 'Other';

export const CLASS_CATEGORY_OPTIONS: ClassCategory[] = [
  'Dance',
  'Instrumental',
  'Music',
  'Language',
  'Martial Arts',
  'Art & Craft',
  'Fitness',
  'Theatre & Drama',
  'Other',
];

export const CLASS_PRESET_NAMES = [
  'Chenda Melam (Beginners / Intermediate / Advanced)',
  'Classical Dance / Bharatanatyam',
  'Mohiniyattam',
  'Kuchipudi',
  'Carnatic Classical Vocal Music',
  'Light Music & Keyboard',
  'Violin & Instrumental',
  'Yoga & Wellness',
  'Malayalam Bhasha Padanam (Language Class)',
  'Karate & Martial Arts',
  'Drawing, Painting & Fine Arts',
  'Folk Dance & Semi-Classical',
  'Mridangam / Thavil',
  'Drama & Theatre Acting Workshop',
  'Custom Class / Workshop',
];

export interface CulturalClass {
  id: string;
  code: string; // e.g. CLS-FUJ-001
  name: string; // e.g. Chenda Melam
  category: ClassCategory;
  unit: string; // e.g. Fujairah, Kalba, Khorfakhan, Dibba, Central
  instructorName: string;
  instructorContact?: string;
  scheduleDays: string[]; // e.g. ['Friday', 'Saturday']
  scheduleTime: string; // e.g. '05:00 PM - 07:00 PM'
  location: string; // e.g. 'KCA Fujairah Unit Hall'
  monthlyFeeAED: number;
  status: 'Active' | 'On Hold' | 'Completed';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ParticipantFeeStatus = 'Paid' | 'Pending' | 'Not Paid' | 'Exempt';
export type ParticipantStatus = 'Active' | 'Inactive' | 'Graduated';

export interface ClassParticipant {
  id: string;
  studentId: string; // e.g. STU-FUJ-001
  classId: string;
  className: string;
  unit: string;
  fullName: string;
  age?: number;
  gender: 'Male' | 'Female' | 'Other';
  guardianName: string;
  guardianPhone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  joiningDate: string;
  feeStatus: ParticipantFeeStatus;
  feeAmountAED: number;
  paymentMethod?: string;
  receiptNumber?: string;
  paymentDate?: string;
  status: ParticipantStatus;
  customOptions?: Record<string, string>; // e.g. { "Batch": "Morning A", "Experience": "1 Year", "Uniform Size": "M" }
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface ParticipantAttendanceEntry {
  participantId: string;
  studentName: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface ClassAttendanceRecord {
  id: string;
  classId: string;
  className: string;
  unit: string;
  date: string; // YYYY-MM-DD
  topicCovered?: string;
  recordedBy: string;
  records: ParticipantAttendanceEntry[];
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  createdAt: string;
}
