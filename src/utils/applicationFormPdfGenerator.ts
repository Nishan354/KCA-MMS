import jsPDF from 'jspdf';
import { Member } from '../types/member';
import { getActiveLogoPngDataUrl } from '../components/Logo';
import { OFFICIAL_AFFILIATION, OFFICIAL_LETTER_EMAIL, OFFICIAL_LOCATION } from '../config/constants';
import { loadStoredSignatures } from './signatureStorage';

export interface ApplicationFormOptions {
  prefillOfficeUse?: boolean;
  includeDigitalSignatures?: boolean;
  customFormNumber?: string;
  isBlankForm?: boolean;
  blankUnitName?: string;
}

/**
 * Returns an empty Member template used for Blank / Free Form generation
 */
export function createBlankApplicationMember(unit: string = 'Central Committee'): Member {
  return {
    id: 'blank-form',
    membershipId: '',
    fullName: '',
    malayalamName: '',
    gender: '',
    dateOfBirth: '',
    bloodGroup: '' as any,
    unit,
    photoUrl: '',
    expiryDate: '',
    membershipType: 'General Member',
    registrationCategory: 'New',
    registrationDate: '',
    status: 'Pending',
    phoneUAE: '',
    whatsapp: '',
    email: '',
    poBox: '',
    facebookId: '',
    instagramId: '',
    emiratesId: '',
    emiratesIdExpiry: '',
    passportNumber: '',
    passportExpiry: '',
    profession: '',
    companyName: '',
    applicationNumber: '',
    uaeAddress: '',
    uaeArea: '',
    keralaAddress: '',
    keralaDistrict: '',
    indiaMobile: '',
    indiaLandline: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
    feeAmountAED: 30,
    paymentStatus: 'Pending',
    paymentMethod: 'Cash',
    receiptNumber: '',
    paymentHistory: [],
    createdAt: '',
    updatedAt: '',
  };
}

/**
 * Calculates age in years from YYYY-MM-DD date string
 */
export function calculateAgeFromDob(dob?: string): string {
  if (!dob) return '';
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age > 0 && age < 120 ? String(age) : '';
}

/**
 * Splits a YYYY-MM-DD date into { dd, mm, yyyy }
 */
export function splitDateParts(dateStr?: string): { dd: string; mm: string; yyyy: string } {
  if (!dateStr) return { dd: '', mm: '', yyyy: '' };
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    return {
      yyyy: parts[0],
      mm: parts[1],
      dd: parts[2],
    };
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return {
      dd: String(d.getDate()).padStart(2, '0'),
      mm: String(d.getMonth() + 1).padStart(2, '0'),
      yyyy: String(d.getFullYear()),
    };
  }
  return { dd: '', mm: '', yyyy: '' };
}

/**
 * Extracts Proposer / Introduced By display string
 */
export function getIntroducedByDisplay(member?: Member | null): string {
  if (!member || !member.introducedBy) return '';
  if (typeof member.introducedBy === 'string') return member.introducedBy;
  const parts: string[] = [];
  if (member.introducedBy.name) parts.push(member.introducedBy.name);
  if (member.introducedBy.membershipId) parts.push(`(${member.introducedBy.membershipId})`);
  if (member.introducedBy.phone) parts.push(`- ${member.introducedBy.phone}`);
  return parts.join(' ');
}

/**
 * Generates the official Modern KCA Membership Application Form PDF (A4 Portrait)
 * Combines the latest LetterPad letterhead with a modern, clean Application Form layout.
 */
export async function generateApplicationFormPdfDoc(
  inputMember?: Member | null,
  options: ApplicationFormOptions = {}
): Promise<jsPDF> {
  const {
    prefillOfficeUse = true,
    includeDigitalSignatures = false,
    customFormNumber,
    isBlankForm = false,
    blankUnitName = 'Central Committee',
  } = options;

  const member: Member =
    isBlankForm || !inputMember
      ? createBlankApplicationMember(blankUnitName)
      : inputMember;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;

  // 1. Modern Outer Double Frame (Stroke only - pure white paper interior)
  doc.setDrawColor(136, 19, 55); // Maroon outer frame
  doc.setLineWidth(0.8);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S');
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.rect(9.4, 9.4, pageWidth - 18.8, pageHeight - 18.8, 'S');

  // 2. Latest LetterPad Top Decorative Brand Bars inside Frame
  doc.setFillColor(136, 19, 55); // #881337 KCA Primary Maroon
  doc.rect(9.5, 9.5, pageWidth - 19, 4.2, 'F');

  doc.setFillColor(217, 119, 6); // Amber-600 Gold Accent
  doc.rect(9.5, 13.7, pageWidth - 19, 1.2, 'F');

  // 3. Official LetterPad Header Block
  try {
    const logoDataUrl = await getActiveLogoPngDataUrl();
    doc.addImage(logoDataUrl, 'PNG', 14, 16.5, 22, 22);
  } catch (err) {
    console.warn('Could not draw logo in application form PDF:', err);
  }

  // Organization Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(136, 19, 55);
  doc.text('KAIRALI CULTURAL ASSOCIATION - FUJAIRAH', 40, 23);

  // NORKA Affiliation Line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.2);
  doc.setTextColor(180, 83, 9);
  doc.text(OFFICIAL_AFFILIATION, 40, 28);

  // Unit & Email Contact Line (Same as LetterPad)
  const unitLabel =
    !member.unit || member.unit === 'Central' || member.unit === 'Central Committee'
      ? 'Central Committee'
      : `${member.unit} Unit`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(30, 41, 59);
  doc.text(
    `${unitLabel}  |  ${OFFICIAL_LOCATION}  |  E-mail: ${OFFICIAL_LETTER_EMAIL}`,
    40,
    33
  );

  // Letterhead Divider Line
  doc.setDrawColor(136, 19, 55);
  doc.setLineWidth(0.5);
  doc.line(14, 40.5, pageWidth - 14, 40.5);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.25);
  doc.line(14, 41.3, pageWidth - 14, 41.3);

  // 4. Modern Form Title Pill & Form Number Box
  doc.setFillColor(136, 19, 55);
  doc.roundedRect(58, 43.5, 94, 7.5, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('MEMBERSHIP APPLICATION FORM', 105, 48.5, { align: 'center' });

  // Form No on Right (Stroke only so interior is always pure white)
  const formNo = isBlankForm
    ? ''
    : customFormNumber || member.applicationNumber || member.membershipId || '';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Form No:', 154, 48.5);
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.35);
  doc.roundedRect(170, 44, 26, 6.5, 1, 1, 'S');
  if (formNo) {
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(136, 19, 55);
    doc.text(formNo, 183, 48.4, { align: 'center' });
  }

  // 5. Top Right Passport Photo Box (Stroke only - pure white interior)
  const photoBoxX = 161;
  const photoBoxY = 53.5;
  const photoBoxW = 35;
  const photoBoxH = 43;
  doc.setDrawColor(136, 19, 55);
  doc.setLineWidth(0.5);
  doc.roundedRect(photoBoxX, photoBoxY, photoBoxW, photoBoxH, 1.5, 1.5, 'S');

  if (!isBlankForm && member.photoUrl && member.photoUrl.startsWith('data:image/')) {
    try {
      const format = member.photoUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(
        member.photoUrl,
        format,
        photoBoxX + 0.8,
        photoBoxY + 0.8,
        photoBoxW - 1.6,
        photoBoxH - 1.6
      );
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('PASSPORT PHOTO', photoBoxX + photoBoxW / 2, photoBoxY + photoBoxH / 2, {
        align: 'center',
      });
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('AFFIX PASSPORT', photoBoxX + photoBoxW / 2, photoBoxY + 19, {
      align: 'center',
    });
    doc.text('SIZE PHOTO', photoBoxX + photoBoxW / 2, photoBoxY + 24, {
      align: 'center',
    });
  }

  // Helper to draw modern label + underlined value
  const drawFieldLine = (
    label: string,
    value: string,
    x: number,
    y: number,
    lineEndX: number,
    fontSize: number = 9.2
  ) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fontSize);
    doc.setTextColor(30, 41, 59);
    doc.text(label, x, y);
    const labelW = doc.getTextWidth(label);
    const lineStartX = x + labelW + 1.8;

    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.3);
    doc.line(lineStartX, y + 1, lineEndX, y + 1);

    if (!isBlankForm && value && value.trim()) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fontSize);
      doc.setTextColor(15, 23, 42);
      const maxValW = Math.max(10, lineEndX - lineStartX - 3);
      const truncated = doc.splitTextToSize(value.trim(), maxValW)[0] || '';
      doc.text(truncated, lineStartX + 1.5, y);
    }
  };

  // Helper to draw DD / MM / YYYY clean white stroke-only boxes (never fills black!)
  const drawDateBoxes = (
    label: string,
    parts: { dd: string; mm: string; yyyy: string },
    labelX: number,
    y: number
  ) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.2);
    doc.setTextColor(30, 41, 59);
    doc.text(label, labelX, y);
    const lw = doc.getTextWidth(label);
    const startX = labelX + lw + 2;
    const boxY = y - 4.2;
    const boxH = 5.6;

    // Draw all 3 boxes first with 'S' (Stroke Only - pure white interior, never black)
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.32);
    doc.roundedRect(startX, boxY, 10, boxH, 0.8, 0.8, 'S');
    doc.roundedRect(startX + 13, boxY, 10, boxH, 0.8, 0.8, 'S');
    doc.roundedRect(startX + 26, boxY, 15, boxH, 0.8, 0.8, 'S');

    // Draw slashes between boxes
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.2);
    doc.setTextColor(71, 85, 105);
    doc.text('/', startX + 11.2, y);
    doc.text('/', startX + 24.2, y);

    // Only draw digits when date is present; leave completely blank when empty for handwriting
    if (!isBlankForm && parts.dd) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(9.2);
      doc.setTextColor(15, 23, 42);
      doc.text(parts.dd, startX + 5, y - 0.2, { align: 'center' });
      doc.text(parts.mm, startX + 18, y - 0.2, { align: 'center' });
      doc.text(parts.yyyy, startX + 33.5, y - 0.2, { align: 'center' });
    }
  };

  // 6. Personal Details (Left of Photo Box)
  const leftX = 14;
  const leftEndBeforePhoto = 157;
  const fullRightX = 196;

  // Row 1: Name of the Applicant
  const displayName = member.malayalamName
    ? `${member.fullName} (${member.malayalamName})`
    : member.fullName || '';
  drawFieldLine('Name of the Applicant:', displayName.toUpperCase(), leftX, 59, leftEndBeforePhoto);

  // Row 2: Age & Date of Birth
  const ageStr = isBlankForm ? '' : calculateAgeFromDob(member.dateOfBirth);
  const dobParts = isBlankForm ? { dd: '', mm: '', yyyy: '' } : splitDateParts(member.dateOfBirth);
  drawFieldLine('Age:', ageStr ? `${ageStr} Years` : '', leftX, 68, 78);
  drawDateBoxes('Date of Birth:', dobParts, 82, 68);

  // Row 3: Gender & Blood Group
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.2);
  doc.setTextColor(30, 41, 59);
  doc.text('Gender:', leftX, 77);

  const isFemale = !isBlankForm && (member.gender || '').toLowerCase().startsWith('f');
  const isMale = !isBlankForm && !isFemale && (member.gender || '').toLowerCase().startsWith('m');

  // Male pill
  if (isMale) {
    doc.setFillColor(136, 19, 55);
    doc.setDrawColor(136, 19, 55);
    doc.roundedRect(29, 72.8, 18, 5.4, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(255, 255, 255);
    doc.text('Male', 38, 76.5, { align: 'center' });
  } else {
    doc.setDrawColor(100, 116, 139);
    doc.roundedRect(29, 72.8, 18, 5.4, 1, 1, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(71, 85, 105);
    doc.text('Male', 38, 76.5, { align: 'center' });
  }

  // Female pill
  if (isFemale) {
    doc.setFillColor(136, 19, 55);
    doc.setDrawColor(136, 19, 55);
    doc.roundedRect(49, 72.8, 21, 5.4, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(255, 255, 255);
    doc.text('Female', 59.5, 76.5, { align: 'center' });
  } else {
    doc.setDrawColor(100, 116, 139);
    doc.roundedRect(49, 72.8, 21, 5.4, 1, 1, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(71, 85, 105);
    doc.text('Female', 59.5, 76.5, { align: 'center' });
  }

  drawFieldLine('Blood Group:', isBlankForm ? '' : member.bloodGroup || '', 76, 77, leftEndBeforePhoto);

  // Row 4: Address in U.A.E. : Place of Work
  const workPlace = isBlankForm
    ? ''
    : [member.companyName, member.profession]
        .filter((v) => v && v.trim() && v.trim().toLowerCase() !== 'member')
        .join(' - ');
  drawFieldLine('Address in U.A.E. (Place of Work):', workPlace, leftX, 86, leftEndBeforePhoto);

  // Row 5: Area
  const areaVal = isBlankForm
    ? ''
    : member.uaeArea || (member.unit ? `${member.unit}, U.A.E.` : '');
  drawFieldLine('Area / Unit:', areaVal, leftX, 95, leftEndBeforePhoto);

  // Row 6: Contact Address in U.A.E.
  const uaeAddrClean =
    !isBlankForm && member.uaeAddress && member.uaeAddress !== 'member@kca-fujairah.ae'
      ? member.uaeAddress
      : '';
  drawFieldLine('Contact Address in U.A.E.:', uaeAddrClean, leftX, 105, fullRightX);

  // Row 7: P.O. Box No & Mobile Nos.
  drawFieldLine('P.O. Box No:', isBlankForm ? '' : member.poBox || '', leftX, 114, 84);
  drawFieldLine('U.A.E. Mobile No.:', isBlankForm ? '' : member.phoneUAE || '', 88, 114, fullRightX);

  // Row 8: Modern 3-Column Social Media & Messaging Bar (Facebook | Instagram | WhatsApp)
  // Stroke-only outer box so writing area is 100% pure white; empty when not provided so user can write by hand
  const socialBarY = 119.5;
  const socialBarH = 10.5;
  const totalSocialW = fullRightX - leftX; // 182mm
  const colW = totalSocialW / 3; // ~60.66mm each

  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.4);
  doc.roundedRect(leftX, socialBarY, totalSocialW, socialBarH, 1.2, 1.2, 'S');

  // Column 1: Facebook
  const fbX = leftX;
  doc.setFillColor(24, 119, 242); // Facebook Blue
  doc.roundedRect(fbX + 1.5, socialBarY + 1.5, 18, socialBarH - 3, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Facebook', fbX + 10.5, socialBarY + 6.3, { align: 'center' });

  const fbVal = isBlankForm ? '' : (member.facebookId || '').trim();
  if (fbVal) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    const fbTrunc = doc.splitTextToSize(fbVal, colW - 22)[0] || '';
    doc.text(fbTrunc, fbX + 21.5, socialBarY + 6.4);
  }

  // Divider 1
  const igX = leftX + colW;
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.35);
  doc.line(igX, socialBarY, igX, socialBarY + socialBarH);

  // Column 2: Instagram
  doc.setFillColor(225, 48, 108); // Instagram Rose/Magenta
  doc.roundedRect(igX + 1.5, socialBarY + 1.5, 19, socialBarH - 3, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Instagram', igX + 11, socialBarY + 6.3, { align: 'center' });

  const igVal = isBlankForm ? '' : (member.instagramId || '').trim();
  if (igVal) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    const igTrunc = doc.splitTextToSize(igVal, colW - 23)[0] || '';
    doc.text(igTrunc, igX + 22.5, socialBarY + 6.4);
  }

  // Divider 2
  const waX = leftX + colW * 2;
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.35);
  doc.line(waX, socialBarY, waX, socialBarY + socialBarH);

  // Column 3: WhatsApp
  doc.setFillColor(22, 163, 74); // WhatsApp Green
  doc.roundedRect(waX + 1.5, socialBarY + 1.5, 19, socialBarH - 3, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('WhatsApp', waX + 11, socialBarY + 6.3, { align: 'center' });

  const waNum = isBlankForm ? '' : (member.whatsapp || member.phoneUAE || '').trim();
  if (waNum) {
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(15, 23, 42);
    const waTrunc = doc.splitTextToSize(waNum, colW - 23)[0] || '';
    doc.text(waTrunc, waX + 22, socialBarY + 6.4);
  }

  // Row 9: E-mail Address
  const cleanEmail =
    !isBlankForm && member.email && member.email !== 'member@kca-fujairah.ae'
      ? member.email
      : '';
  drawFieldLine('E-mail Address:', cleanEmail, leftX, 138, fullRightX);

  // Row 10: Passport Number & Valid till
  const passExp = isBlankForm
    ? { dd: '', mm: '', yyyy: '' }
    : splitDateParts(member.passportExpiry);
  drawFieldLine('Passport Number:', isBlankForm ? '' : member.passportNumber || '', leftX, 148, 130);
  drawDateBoxes('Valid till:', passExp, 134, 148);

  // Row 11: Emirates ID Number & Valid till
  const eidVal =
    !isBlankForm && member.emiratesId && member.emiratesId.trim() !== '784-'
      ? member.emiratesId
      : '';
  const eidExp = isBlankForm
    ? { dd: '', mm: '', yyyy: '' }
    : splitDateParts(member.emiratesIdExpiry);
  drawFieldLine('Emirates ID Number:', eidVal, leftX, 158, 130);
  drawDateBoxes('Valid till:', eidExp, 134, 158);

  // Row 12: Contact Address in India (2 lines)
  const indiaAddrLine1 = isBlankForm ? '' : member.keralaAddress || '';
  const indiaAddrLine2 =
    !isBlankForm && member.keralaDistrict
      ? `District: ${member.keralaDistrict}, Kerala, India`
      : '';
  drawFieldLine('Contact Address in India:', indiaAddrLine1, leftX, 168, fullRightX);
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.3);
  doc.line(leftX, 176.5, fullRightX, 176.5);
  if (indiaAddrLine2) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.2);
    doc.setTextColor(15, 23, 42);
    doc.text(indiaAddrLine2, leftX + 2, 175.4);
  }

  // Row 13: Contact Nos. in India: Mobile & Landline
  const indiaMob = isBlankForm
    ? ''
    : member.indiaMobile ||
      (member.emergencyContactPhone &&
      member.emergencyContactPhone.trim() !== '+971' &&
      member.emergencyContactPhone.trim() !== member.phoneUAE.trim()
        ? member.emergencyContactPhone
        : '');
  drawFieldLine('Contact Nos. in India (Mobile):', indiaMob, leftX, 185, 122);
  drawFieldLine('Landline:', isBlankForm ? '' : member.indiaLandline || '', 126, 185, fullRightX);

  // Row 14: Introduced by & Proposer Signature
  const introText = isBlankForm ? '' : getIntroducedByDisplay(member);
  drawFieldLine('Introduced by (Proposer):', introText, leftX, 194, fullRightX);

  if (!isBlankForm && includeDigitalSignatures && member.proposerSignatureUrl) {
    try {
      const fmt = member.proposerSignatureUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(member.proposerSignatureUrl, fmt, 156, 194.5, 34, 8.2);
    } catch (err) {
      console.warn('Could not draw proposer signature in PDF:', err);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.2);
  doc.setTextColor(30, 41, 59);
  doc.text('Proposer Signature:', 118, 202.5);
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.3);
  doc.line(151, 203.2, fullRightX, 203.2);

  // 7. Modern Declaration Section
  const declY = 207.5;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(136, 19, 55);
  doc.setLineWidth(0.35);
  doc.roundedRect(leftX, declY, fullRightX - leftX, 6.5, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(136, 19, 55);
  doc.text('DECLARATION BY THE APPLICANT', 105, declY + 4.6, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    'I hereby undertake and declare that I am ready to abide by the rules and regulations of Kairali Cultural Association, Fujairah.',
    leftX + 1,
    declY + 11.2
  );

  // Date on Left & Applicant Signature on Right
  const regParts = isBlankForm
    ? { dd: '', mm: '', yyyy: '' }
    : splitDateParts(member.registrationDate);
  const regFormatted = regParts.dd ? `${regParts.dd}/${regParts.mm}/${regParts.yyyy}` : '';
  drawFieldLine('Date:', regFormatted, leftX, declY + 21, 75);

  if (!isBlankForm && includeDigitalSignatures && member.applicantSignatureUrl) {
    try {
      const fmt = member.applicantSignatureUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(member.applicantSignatureUrl, fmt, 150, declY + 12.2, 38, 9);
    } catch (err) {
      console.warn('Could not draw applicant signature in PDF:', err);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.2);
  doc.setTextColor(30, 41, 59);
  doc.text('Signature of the Applicant:', 96, declY + 21);
  doc.setDrawColor(100, 116, 139);
  doc.line(141, declY + 21.8, fullRightX, declY + 21.8);

  // 8. For Office Use Section
  const officeY = 234;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(136, 19, 55);
  doc.setLineWidth(0.35);
  doc.roundedRect(leftX, officeY, fullRightX - leftX, 6.5, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(136, 19, 55);
  doc.text('FOR OFFICE USE & COMMITTEE APPROVAL', 105, officeY + 4.6, { align: 'center' });

  // Membership Number & Valid Till Grid Box
  const boxRowY = officeY + 10;
  const boxH = 9.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Membership Number :', leftX, boxRowY + 6.3);

  // Main Box for Membership No + Valid Till + 8 Digit Boxes (Stroke only - pure white cells)
  const gridStartX = 58;
  const memNoBoxW = 39;
  const validLabelBoxW = 22;
  const digitBoxW = 9.5;
  const totalGridW = memNoBoxW + validLabelBoxW + digitBoxW * 8;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.rect(gridStartX, boxRowY, totalGridW, boxH, 'S');

  // Divider after Membership Number
  doc.line(gridStartX + memNoBoxW, boxRowY, gridStartX + memNoBoxW, boxRowY + boxH);

  if (!isBlankForm && prefillOfficeUse && member.membershipId) {
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(136, 19, 55);
    doc.text(member.membershipId, gridStartX + memNoBoxW / 2, boxRowY + 6.3, {
      align: 'center',
    });
  }

  // Valid till label cell
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(15, 23, 42);
  doc.text('Valid till', gridStartX + memNoBoxW + validLabelBoxW / 2, boxRowY + 6, {
    align: 'center',
  });

  // 8 Digit cells for DDMMYYYY
  const expParts = isBlankForm ? { dd: '', mm: '', yyyy: '' } : splitDateParts(member.expiryDate);
  const expDigits =
    !isBlankForm && prefillOfficeUse && expParts.dd
      ? `${expParts.dd}${expParts.mm}${expParts.yyyy}`.split('')
      : [];

  const digitsStartX = gridStartX + memNoBoxW + validLabelBoxW;
  for (let i = 0; i < 8; i++) {
    const cellX = digitsStartX + i * digitBoxW;
    doc.line(cellX, boxRowY, cellX, boxRowY + boxH);
    if (expDigits[i]) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(expDigits[i], cellX + digitBoxW / 2, boxRowY + 6.3, {
        align: 'center',
      });
    }
  }

  // 9. Bottom Committee Approval Signatures (President & Secretary)
  const sigLineY = 276.5;

  if (includeDigitalSignatures) {
    const storedSigs = loadStoredSignatures();
    const presSig = storedSigs.find((s) => s.signatoryRole === 'President');
    const secSig = storedSigs.find((s) => s.signatoryRole === 'General Secretary');
    if (presSig?.signatureDataUrl) {
      try {
        const fmt = presSig.signatureDataUrl.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(presSig.signatureDataUrl, fmt, 35, sigLineY - 14.5, 36, 13.5);
      } catch {}
    }
    if (secSig?.signatureDataUrl) {
      try {
        const fmt = secSig.signatureDataUrl.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(secSig.signatureDataUrl, fmt, 139, sigLineY - 14.5, 36, 13.5);
      } catch {}
    }
  }

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.45);
  // President signature line
  doc.line(18, sigLineY, 88, sigLineY);
  // Secretary signature line
  doc.line(122, sigLineY, 192, sigLineY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('President', 53, sigLineY + 5, { align: 'center' });
  doc.text('Secretary', 157, sigLineY + 5, { align: 'center' });

  return doc;
}

/**
 * Downloads the Membership Application Form as a PDF file
 */
export async function downloadApplicationFormPdf(
  member?: Member | null,
  options: ApplicationFormOptions = {}
): Promise<void> {
  const doc = await generateApplicationFormPdfDoc(member, options);
  if (options.isBlankForm || !member || !member.fullName) {
    doc.save('KCA_Blank_Membership_Application_Form.pdf');
    return;
  }
  const safeId = (member.membershipId || member.fullName || 'Applicant').replace(
    /[^a-zA-Z0-9_-]/g,
    '_'
  );
  doc.save(`KCA_Membership_Application_${safeId}.pdf`);
}

/**
 * Downloads a Blank / Free Membership Application Form PDF
 */
export async function downloadBlankApplicationFormPdf(unit?: string): Promise<void> {
  await downloadApplicationFormPdf(null, {
    isBlankForm: true,
    prefillOfficeUse: false,
    blankUnitName: unit || 'Central Committee',
  });
}

/**
 * Returns a base64 Data URL of the generated Membership Application Form PDF
 * so it can be attached directly to the member's document records.
 */
export async function getApplicationFormPdfDataUrl(
  member: Member,
  options: ApplicationFormOptions = {}
): Promise<string> {
  const doc = await generateApplicationFormPdfDoc(member, options);
  return doc.output('datauristring');
}
