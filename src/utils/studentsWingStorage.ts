import QRCode from 'qrcode';
import { StudentWingMember } from '../types/studentsWing';

export const STORAGE_KEY_STUDENTS_WING = 'kca_fujairah_students_wing_v1';

export function normalizeChildrenWingId(rawId: string): string {
  if (!rawId) return '';
  return rawId.trim().replace(/^KCA-SW-/i, 'KCA-CW-');
}

export function loadStudentsWing(): StudentWingMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENTS_WING);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    let didMigrate = false;
    const migrated = parsed.map((s: StudentWingMember) => {
      const normalizedId = normalizeChildrenWingId(s.studentId);
      const normalizedRole = s.wingRole
        ? s.wingRole
            .replace(/Students Wing/gi, "Children's Wing")
            .replace(/^Student Member$/i, "Children's Wing Member")
            .replace(/^Student Coordinator$/i, "Children's Wing Coordinator")
            .replace(/^Student Volunteer$/i, 'Volunteer')
        : "Children's Wing Member";

      if (normalizedId !== s.studentId || normalizedRole !== s.wingRole) {
        didMigrate = true;
      }

      return {
        ...s,
        studentId: normalizedId,
        wingRole: normalizedRole,
      };
    });

    if (didMigrate) {
      try {
        localStorage.setItem(STORAGE_KEY_STUDENTS_WING, JSON.stringify(migrated));
      } catch {
        // ignore storage quota errors on auto-migration
      }
    }

    return migrated;
  } catch (e) {
    console.warn("Failed to load Children's Wing from localStorage:", e);
    return [];
  }
}

export function saveStudentsWing(students: StudentWingMember[]): void {
  try {
    const normalized = students.map((s) => ({
      ...s,
      studentId: normalizeChildrenWingId(s.studentId),
    }));
    localStorage.setItem(STORAGE_KEY_STUDENTS_WING, JSON.stringify(normalized));
  } catch (e) {
    console.error("Failed to save Children's Wing to localStorage:", e);
  }
}

export function getUnitShortCode(unit: string): string {
  const clean = (unit || 'FUJ').trim().toUpperCase();
  if (clean.startsWith('FUJ')) return 'FUJ';
  if (clean.startsWith('KAL')) return 'KAL';
  if (clean.startsWith('KHO')) return 'KHO';
  if (clean.startsWith('DIB')) return 'DIB';
  if (clean.startsWith('CEN')) return 'CEN';
  return clean.replace(/[^A-Z]/g, '').slice(0, 3) || 'FUJ';
}

export function generateNextStudentWingId(
  existingStudents: StudentWingMember[],
  unit: string = 'Fujairah'
): string {
  const unitCode = getUnitShortCode(unit);
  const prefix = `KCA-CW-${unitCode}-`;

  let maxNum = 100;
  existingStudents.forEach((s) => {
    const m = s.studentId.match(/(\d+)$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n > maxNum) {
        maxNum = n;
      }
    }
  });

  return `${prefix}${maxNum + 1}`;
}

export async function generateStudentWingQrCode(student: StudentWingMember): Promise<string> {
  const displayMemberId = normalizeChildrenWingId(student.studentId);
  const verifyPayload = [
    `KCA FUJAIRAH - CHILDREN'S WING ID`,
    `Member ID: ${displayMemberId}`,
    `Name: ${student.fullName}`,
    `Role: ${student.wingRole}`,
    `Unit: ${student.unit}`,
    student.schoolOrCollege ? `Institution: ${student.schoolOrCollege}` : '',
    student.bloodGroup ? `Blood Group: ${student.bloodGroup}` : '',
    `Parent: ${student.parentName}`,
    `Emergency Contact: ${student.parentPhoneUAE}`,
    `Valid Until: ${student.expiryDate}`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    return await QRCode.toDataURL(verifyPayload, {
      width: 240,
      margin: 1,
      color: {
        dark: '#7f1d1d',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.warn("Children's Wing QR code generation failed:", err);
    return '';
  }
}
