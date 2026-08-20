import { CulturalClass, ClassParticipant, ClassAttendanceRecord } from '../types/classes';
import { INITIAL_CLASSES, INITIAL_PARTICIPANTS, INITIAL_ATTENDANCE } from '../data/initialClassesData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatAED, formatDate } from './idGenerator';
import { getActiveLogoDataUrl } from '../components/Logo';
import { PUBLISHED_PORTAL_URL } from '../config/constants';

const CLASSES_KEY = 'kca_cultural_classes_v1';
const PARTICIPANTS_KEY = 'kca_class_participants_v1';
const ATTENDANCE_KEY = 'kca_class_attendance_v1';

export function loadClasses(): CulturalClass[] {
  try {
    const raw = localStorage.getItem(CLASSES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Failed to load classes from storage:', err);
  }
  return INITIAL_CLASSES;
}

export function saveClasses(classes: CulturalClass[]): void {
  try {
    localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
  } catch (err) {
    console.error('Failed to save classes to storage:', err);
  }
}

export function loadParticipants(): ClassParticipant[] {
  try {
    const raw = localStorage.getItem(PARTICIPANTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Failed to load participants from storage:', err);
  }
  return INITIAL_PARTICIPANTS;
}

export function saveParticipants(participants: ClassParticipant[]): void {
  try {
    localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
  } catch (err) {
    console.error('Failed to save participants to storage:', err);
  }
}

export function loadAttendance(): ClassAttendanceRecord[] {
  try {
    const raw = localStorage.getItem(ATTENDANCE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Failed to load attendance from storage:', err);
  }
  return INITIAL_ATTENDANCE;
}

export function saveAttendance(records: ClassAttendanceRecord[]): void {
  try {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save attendance to storage:', err);
  }
}

/**
 * Generate Next Class Code (e.g. CLS-FUJ-003)
 */
export function generateNextClassCode(unit: string, existingClasses: CulturalClass[]): string {
  const prefix = (unit.slice(0, 3) || 'GEN').toUpperCase();
  const unitClasses = existingClasses.filter((c) => c.unit.toLowerCase() === unit.toLowerCase());
  const nextNum = unitClasses.length + 1;
  return `CLS-${prefix}-${String(nextNum).padStart(3, '0')}`;
}

/**
 * Generate Next Student ID (e.g. STU-FUJ-004)
 */
export function generateNextStudentId(unit: string, existingParticipants: ClassParticipant[]): string {
  const prefix = (unit.slice(0, 3) || 'GEN').toUpperCase();
  const unitStudents = existingParticipants.filter((p) => p.unit.toLowerCase() === unit.toLowerCase());
  const nextNum = unitStudents.length + 1;
  return `STU-${prefix}-${String(nextNum).padStart(3, '0')}`;
}

/**
 * Export Participants to CSV
 */
export function exportParticipantsCsv(
  participants: ClassParticipant[],
  filename: string = 'KCA_Class_Participants.csv'
): void {
  const headers = [
    'Student ID',
    'Full Name',
    'Class / Course',
    'Unit',
    'Age',
    'Gender',
    'Parent / Guardian',
    'Guardian Phone',
    'WhatsApp',
    'Email',
    'Address',
    'Monthly Fee (AED)',
    'Fee Status',
    'Enrollment Date',
    'Status',
    'Custom Options',
    'Notes',
  ];

  const rows = participants.map((p) => {
    const customOpts = p.customOptions ? JSON.stringify(p.customOptions).replace(/"/g, '""') : '';
    return [
      `"${p.studentId}"`,
      `"${p.fullName.replace(/"/g, '""')}"`,
      `"${p.className.replace(/"/g, '""')}"`,
      `"${p.unit}"`,
      `"${p.age || ''}"`,
      `"${p.gender}"`,
      `"${(p.guardianName || '').replace(/"/g, '""')}"`,
      `"${p.guardianPhone || ''}"`,
      `"${p.whatsapp || ''}"`,
      `"${p.email || ''}"`,
      `"${(p.address || '').replace(/"/g, '""')}"`,
      `"${p.feeAmountAED || 0}"`,
      `"${p.feeStatus}"`,
      `"${p.joiningDate}"`,
      `"${p.status}"`,
      `"${customOpts}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ];
  });

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

/**
 * Generate Printable PDF Attendance Register Sheet
 */
export function downloadAttendanceSheetPdf(
  targetClass: CulturalClass,
  students: ClassParticipant[],
  attendanceHistory: ClassAttendanceRecord[] = []
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const primaryRed = [139, 0, 0];
  const goldAccent = [217, 119, 6];
  const slateDark = [30, 41, 59];

  // Header Banner
  doc.setFillColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.rect(0, 0, 297, 24, 'F');
  doc.setFillColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.rect(0, 24, 297, 2, 'F');

  try {
    const logo = getActiveLogoDataUrl();
    doc.addImage(logo, 'PNG', 10, 2, 20, 20);
  } catch {}

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('KAIRALI CULTURAL ASSOCIATION FUJAIRAH - CLASS ATTENDANCE REGISTER', 148.5, 10, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Class: ${targetClass.name}  |  Unit: ${targetClass.unit} Unit  |  Instructor: ${targetClass.instructorName}  |  Schedule: ${targetClass.scheduleDays.join(', ')} (${targetClass.scheduleTime})`,
    148.5,
    17,
    { align: 'center' }
  );

  // Table Data: Student Name + 8 Blank Attendance Columns for manual check or dates
  const headers = [
    '#',
    'Student ID',
    'Student Full Name',
    'Age/Gender',
    'Parent / Guardian Phone',
    'Fee Status',
    'Session 1\n__/__',
    'Session 2\n__/__',
    'Session 3\n__/__',
    'Session 4\n__/__',
    'Session 5\n__/__',
    'Session 6\n__/__',
    'Remarks',
  ];

  const body = students.map((s, idx) => [
    idx + 1,
    s.studentId,
    s.fullName,
    `${s.age || '—'} / ${s.gender.charAt(0)}`,
    `${s.guardianName ? s.guardianName + ': ' : ''}${s.guardianPhone}`,
    s.feeStatus,
    '',
    '',
    '',
    '',
    '',
    '',
    s.notes || '',
  ]);

  if (body.length === 0) {
    body.push([1, 'N/A', 'No students currently enrolled in this class', '', '', '', '', '', '', '', '', '', '']);
  }

  autoTable(doc, {
    startY: 30,
    head: [headers],
    body,
    theme: 'grid',
    headStyles: {
      fillColor: [139, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 42 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 42 },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 18, halign: 'center' },
      8: { cellWidth: 18, halign: 'center' },
      9: { cellWidth: 18, halign: 'center' },
      10: { cellWidth: 18, halign: 'center' },
      11: { cellWidth: 18, halign: 'center' },
      12: { cellWidth: 35 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;
  if (finalY < 185) {
    doc.setDrawColor(180, 180, 180);
    doc.line(20, finalY + 10, 70, finalY + 10);
    doc.line(220, finalY + 10, 270, finalY + 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text('Class Instructor Signature', 45, finalY + 15, { align: 'center' });
    doc.text('Unit Cultural Secretary', 245, finalY + 15, { align: 'center' });
  }

  const cleanName = targetClass.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`KCA_Attendance_Sheet_${targetClass.unit}_${cleanName}.pdf`);
}
