import QRCode from 'qrcode';
import { Member } from '../types/member';
import { PUBLISHED_PORTAL_URL } from '../config/constants';
import { transliterateEnglishToMalayalam } from './malayalamTransliterate';

/**
 * Returns the public base URL for member verification and card downloads.
 * Prioritizes custom saved URL, production URL (https://kca-fuj-mms.ai.studio),
 * or auto-resolves dev to preview domain.
 */
export function getBasePortalUrl(): string {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('kca_custom_portal_url');
      if (saved && saved.trim().startsWith('http') && !saved.includes('kca-fuj-mms.ai.studio') && !saved.includes('kca-mms-db.ai.studio')) {
        return saved.trim().replace(/\/$/, '');
      }

      // If running on actual browser origin
      if (window.location?.origin && window.location.origin.startsWith('http')) {
        let origin = window.location.origin;
        if (origin.includes('ais-dev-')) {
          origin = origin.replace('ais-dev-', 'ais-pre-');
        }
        // If not localhost or dev container, prefer window origin or PUBLISHED_PORTAL_URL
        if (!origin.includes('localhost') && !origin.includes('127.0.0.1') && !origin.includes('stackblitz') && !origin.includes('webcontainer')) {
          return origin.replace(/\/$/, '');
        }
      }
    } catch (e) {
      console.warn('Error reading base portal url:', e);
    }
  }
  return PUBLISHED_PORTAL_URL || 'https://ais-pre-m2j4i76aqzeukeo3v6v6lx-309601622756.europe-west2.run.app';
}

/**
 * Saves a user-defined custom portal domain if desired (e.g. https://kca-fuj-mms.ai.studio)
 */
export function setCustomPortalUrl(url: string): void {
  if (typeof window !== 'undefined') {
    try {
      if (url && url.trim().startsWith('http')) {
        localStorage.setItem('kca_custom_portal_url', url.trim().replace(/\/$/, ''));
      } else {
        localStorage.removeItem('kca_custom_portal_url');
      }
    } catch (e) {
      console.warn('Error saving custom portal url:', e);
    }
  }
}

/**
 * Encodes a Member object into a compact, URL-safe base64 string so updated member records
 * can be transferred accurately to external devices/phones without relying on shared local storage.
 */
export function encodeMemberToPayload(member: Partial<Member>): string {
  try {
    const compact: Record<string, any> = {
      id: member.id,
      mId: member.membershipId,
      name: member.fullName,
      mName: member.malayalamName,
      gen: member.gender,
      bg: member.bloodGroup,
      dob: member.dateOfBirth,
      jd: member.joinDate,
      rd: member.registrationDate,
      exp: member.expiryDate,
      eid: member.emiratesId,
      ph: member.phoneUAE,
      wa: member.whatsapp,
      em: member.email,
      adU: member.uaeAddress,
      adK: member.keralaAddress,
      unit: member.unit,
      cat: member.registrationCategory,
      typ: member.membershipType,
      fee: member.feeAmountAED,
      ps: member.paymentStatus,
      pm: member.paymentMethod,
      rec: member.receiptNumber,
      norka: member.norkaId,
      cf: member.customFields,
      // Only include photoUrl if http or compact data
      pic: member.photoUrl && (member.photoUrl.startsWith('http') || member.photoUrl.length < 50000) ? member.photoUrl : undefined,
    };
    const jsonStr = JSON.stringify(compact);
    return btoa(
      encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
  } catch (e) {
    console.error('Failed to encode member payload:', e);
    return '';
  }
}

/**
 * Decodes a member payload string back into a Member object.
 */
export function decodeMemberFromPayload(payload: string): Partial<Member> | null {
  try {
    if (!payload || !payload.trim()) return null;
    const binary = atob(payload.trim());
    const jsonStr = decodeURIComponent(
      binary
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const compact = JSON.parse(jsonStr);
    return {
      id: compact.id,
      membershipId: compact.mId,
      fullName: compact.name,
      malayalamName: compact.mName,
      gender: compact.gen,
      bloodGroup: compact.bg,
      dateOfBirth: compact.dob,
      joinDate: compact.jd,
      registrationDate: compact.rd,
      expiryDate: compact.exp,
      emiratesId: compact.eid,
      phoneUAE: compact.ph,
      whatsapp: compact.wa,
      email: compact.em,
      uaeAddress: compact.adU,
      keralaAddress: compact.adK,
      unit: compact.unit,
      registrationCategory: compact.cat,
      membershipType: compact.typ,
      feeAmountAED: typeof compact.fee === 'number' ? compact.fee : undefined,
      paymentStatus: compact.ps,
      paymentMethod: compact.pm,
      receiptNumber: compact.rec,
      norkaId: compact.norka,
      customFields: compact.cf,
      photoUrl: compact.pic || undefined,
    };
  } catch (e) {
    console.error('Failed to decode member payload:', e);
    return null;
  }
}

/**
 * Ensures a fully conforming Member object from partial decoded payload
 */
export function createFullMemberFromPartial(emb: Partial<Member>, fallbackId: string = ''): Member {
  const mId = emb.membershipId || fallbackId || `KCA-FU-${Math.floor(1000 + Math.random() * 9000)}`;
  const resolvedFullName = emb.fullName || 'Registered Member';
  const resolvedMalayalam =
    emb.malayalamName && emb.malayalamName.trim()
      ? emb.malayalamName.trim()
      : transliterateEnglishToMalayalam(resolvedFullName);

  const defaultPhoto =
    emb.gender === 'Female'
      ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80';

  return {
    id: emb.id || `m-${Date.now()}`,
    membershipId: mId,
    fullName: resolvedFullName,
    malayalamName: resolvedMalayalam || undefined,
    gender: emb.gender || 'Male',
    dateOfBirth: emb.dateOfBirth || '1990-01-01',
    joinDate: emb.joinDate || '2024-01-01',
    bloodGroup: emb.bloodGroup || 'O+',
    unit: emb.unit || 'Fujairah',
    photoUrl: emb.photoUrl || defaultPhoto,
    expiryDate: emb.expiryDate || '2026-12-31',
    membershipType: emb.membershipType || 'General Member',
    registrationCategory: emb.registrationCategory || 'New',
    registrationDate: emb.registrationDate || new Date().toISOString().split('T')[0],
    lastRenewalDate: emb.lastRenewalDate,
    status: emb.status || 'Active',
    phoneUAE: emb.phoneUAE || '+971 50 000 0000',
    whatsapp: emb.whatsapp || emb.phoneUAE || '+971 50 000 0000',
    email: emb.email || 'member@kca-fujairah.ae',
    emiratesId: emb.emiratesId,
    passportNumber: emb.passportNumber,
    norkaId: emb.norkaId,
    profession: emb.profession || 'Executive',
    companyName: emb.companyName || 'Fujairah Enterprise',
    uaeAddress: emb.uaeAddress || 'Fujairah, UAE',
    keralaAddress: emb.keralaAddress || 'Kerala, India',
    keralaDistrict: emb.keralaDistrict || 'Kozhikode',
    emergencyContactName: emb.emergencyContactName || 'KCA Helpline',
    emergencyContactRelation: emb.emergencyContactRelation || 'Relation',
    emergencyContactPhone: emb.emergencyContactPhone || '+971 50 000 0000',
    feeAmountAED: typeof emb.feeAmountAED === 'number' ? emb.feeAmountAED : 50,
    paymentStatus: emb.paymentStatus || 'Paid',
    paymentMethod: emb.paymentMethod || 'Cash',
    receiptNumber: emb.receiptNumber || `REC-${mId}`,
    paymentHistory: emb.paymentHistory || [
      {
        id: `pay-${Date.now()}`,
        receiptNumber: emb.receiptNumber || `REC-${mId}`,
        amountAED: typeof emb.feeAmountAED === 'number' ? emb.feeAmountAED : 50,
        date: emb.registrationDate || new Date().toISOString().split('T')[0],
        purpose: 'New Membership Fee',
        status: emb.paymentStatus || 'Paid',
        method: emb.paymentMethod || 'Cash',
        recordedBy: 'Admin Desk',
      },
    ],
    documents: emb.documents || [],
    customFields: emb.customFields || {},
    createdAt: emb.createdAt || new Date().toISOString(),
    updatedAt: emb.updatedAt || new Date().toISOString(),
  };
}

/**
 * Returns the official member verification and digital ID download URL.
 * Produces clean, short URLs by default (e.g. https://kcaf-mms.ai.studio/?verify=KCA-DB-1001)
 */
export function getMemberVerifyUrl(
  memberOrId: Member | string,
  showReceipt: boolean = false,
  embedData: boolean = true
): string {
  const baseUrl = getBasePortalUrl();
  const mId = typeof memberOrId === 'string' ? memberOrId : memberOrId.membershipId;
  let url = `${baseUrl}/?verify=${encodeURIComponent(mId)}`;

  if (typeof memberOrId !== 'string' && embedData) {
    const payload = encodeMemberToPayload(memberOrId);
    if (payload) {
      url += `&d=${encodeURIComponent(payload)}`;
    }
  }

  if (showReceipt) {
    url += '&receipt=1';
  }

  return url;
}

/**
 * Returns the strictly shortened member verification URL
 */
export function getMemberShortVerifyUrl(memberOrId: Member | string, showReceipt: boolean = false): string {
  return getMemberVerifyUrl(memberOrId, showReceipt, false);
}

/**
 * Returns the official receipt verification and download URL
 */
export function getMemberReceiptVerifyUrl(memberOrId: Member | string): string {
  return getMemberVerifyUrl(memberOrId, true, false);
}

/**
 * Standard Unit Code Mapping:
 * Fujairah          -> FU
 * Kalba             -> KB
 * Khorfakhan        -> KF
 * Dibba             -> DB
 * Central Committee -> CC
 */
export function getUnitCode(unitName?: string): string {
  if (!unitName) return 'FU';
  const clean = unitName.trim().toLowerCase();

  if (clean.includes('central') || clean.includes('cc')) return 'CC';
  if (clean.includes('fuj')) return 'FU';
  if (clean.includes('kal')) return 'KB';
  if (clean.includes('khor') || clean.includes('fak') || clean.includes('kf')) return 'KF';
  if (clean.includes('dib') || clean.includes('db')) return 'DB';

  // Fallback for custom added units: take first 2 uppercase letters
  const letters = unitName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  return letters.length >= 2 ? letters.substring(0, 2) : 'FU';
}

/**
 * Unit Prefix Mapping:
 * Fujairah          -> KCA-FU-
 * Kalba             -> KCA-KB-
 * Khorfakhan        -> KCA-KF-
 * Dibba             -> KCA-DB-
 * Central Committee -> KCA-CC-
 */
export function getUnitIdPrefix(unitName?: string): string {
  const code = getUnitCode(unitName);
  return `KCA-${code}-`;
}

/**
 * Calculates the next sequential Member Payment Receipt Code for a specific Unit:
 * - Fujairah:   REC-FU-2026-001, REC-FU-2026-002...
 * - Kalba:      REC-KB-2026-001, REC-KB-2026-002...
 * - Khorfakhan: REC-KF-2026-001, REC-KF-2026-002...
 * - Dibba:      REC-DB-2026-001, REC-DB-2026-002...
 * - Central:    REC-CC-2026-001, REC-CC-2026-002...
 */
export function getNextMemberReceiptNumber(existingMembers: Member[], unitName: string = 'Fujairah'): string {
  const unitCode = getUnitCode(unitName);
  const year = new Date().getFullYear();
  const prefix = `REC-${unitCode}-${year}-`;
  const startNumber = 1;

  if (!existingMembers || existingMembers.length === 0) {
    return `${prefix}${String(startNumber).padStart(3, '0')}`;
  }

  let maxNum = 0;
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escapedPrefix}(\\d+)`, 'i');

  // Also check legacy unscoped receipt numbers (e.g. REC-2026-001) for this unit
  const legacyPrefix = `REC-${year}-`;
  const legacyRegex = new RegExp(`^REC-(?:\\d{4}-)?(\\d+)`, 'i');

  for (const m of existingMembers) {
    if (m.receiptNumber) {
      const match = m.receiptNumber.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      } else if (m.unit && getUnitCode(m.unit) === unitCode) {
        const legMatch = m.receiptNumber.match(legacyRegex);
        if (legMatch && legMatch[1]) {
          const num = parseInt(legMatch[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }
  }

  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
}

/**
 * Calculates the next sequential KCA Membership ID for a specific Unit:
 * - Fujairah:   KCA-FU-1001, KCA-FU-1002...
 * - Kalba:      KCA-KB-1001, KCA-KB-1002...
 * - Khorfakhan: KCA-KF-1001, KCA-KF-1002...
 * - Dibba:      KCA-DB-1001, KCA-DB-1002...
 */
export function getNextMembershipId(existingMembers: Member[], unitName: string = 'Fujairah'): string {
  const prefix = getUnitIdPrefix(unitName);
  const startNumber = 1001;

  if (!existingMembers || existingMembers.length === 0) {
    return `${prefix}${startNumber}`;
  }

  let maxNum = startNumber - 1;
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escapedPrefix}(\\d+)`, 'i');

  for (const m of existingMembers) {
    if (m.membershipId) {
      const match = m.membershipId.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  return `${prefix}${maxNum + 1}`;
}

/**
 * Generates a DataURL QR code for a member pointing directly to the published verification URL
 */
export async function generateMemberQrCode(member: Member): Promise<string> {
  const verifyUrl = getMemberVerifyUrl(member, false, true);

  try {
    const dataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 260,
      color: {
        dark: '#1e293b', // High-contrast deep slate for instant phone camera scanning
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

/**
 * Format blood group for card: 'A+' -> 'A+ve', 'O-' -> 'O-ve'
 */
export function formatCardBloodGroup(bg?: string): string {
  if (!bg) return 'N/A';
  if (bg.endsWith('+') && !bg.endsWith('+ve')) return `${bg}ve`;
  if (bg.endsWith('-') && !bg.endsWith('-ve')) return `${bg}ve`;
  return bg;
}

/**
 * Format date for card validity: "31-3-2026" or "DD-MM-YYYY"
 */
export function formatCardDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return `${day}-${month}-${year}`;
      }
    }
    return dateString;
  } catch {
    return dateString;
  }
}

/**
 * Formats AED Currency (United Arab Emirates Dirham)
 */
export function formatAED(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'AED 0.00';
  return `AED ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format date for cards: "DD MMM YYYY" or "DD/MM/YYYY"
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    if (dateString.includes('T') || dateString.includes(':') || dateString.includes('/')) {
      const d = new Date(dateString);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      }
    }
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Calculates the next March 31 date string (YYYY-03-31).
 * If today is before or on March 31: returns March 31 of this year (or + yearsOffset).
 * If today is after March 31: returns March 31 of next year (+ yearsOffset).
 */
export function getNextMarch31Date(baseDate: Date | string = new Date(), yearsOffset: number = 0): string {
  const d = typeof baseDate === 'string' ? new Date(baseDate) : new Date(baseDate);
  const now = isNaN(d.getTime()) ? new Date() : d;

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed: 0=Jan, 1=Feb, 2=Mar, 3=Apr...
  const currentDate = now.getDate();

  let targetYear = currentYear;
  // If after March 31 (i.e. April onwards or after March 31)
  if (currentMonth > 2 || (currentMonth === 2 && currentDate > 31)) {
    targetYear = currentYear + 1;
  }

  targetYear += yearsOffset;
  return `${targetYear}-03-31`;
}

/**
 * Calculates renewal expiry date defaulting strictly to March 31.
 * If member already has an expiry date, advances to March 31 of next cycle.
 */
export function getRenewalExpiryDate(currentExpiryDate?: string, yearsToAdd: number = 1): string {
  if (!currentExpiryDate) {
    return getNextMarch31Date(new Date(), Math.max(0, yearsToAdd - 1));
  }

  try {
    const parts = currentExpiryDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (!isNaN(year)) {
        const today = new Date();
        const currentExpiry = new Date(year, month - 1, day);
        if (currentExpiry >= today) {
          return `${year + yearsToAdd}-03-31`;
        }
      }
    }
  } catch (e) {
    console.warn('Error parsing renewal expiry date:', e);
  }

  return getNextMarch31Date(new Date(), Math.max(0, yearsToAdd - 1));
}

/**
 * Calculate default expiry date defaulting strictly to the next March 31st
 */
export function getDefaultExpiryDate(yearsToAdd = 0): string {
  return getNextMarch31Date(new Date(), yearsToAdd);
}

/**
 * Check if a membership is expired or about to expire
 */
export function getExpiryStatus(expiryDate: string): {
  isExpired: boolean;
  daysRemaining: number;
  label: string;
  color: string;
} {
  if (!expiryDate) {
    return {
      isExpired: false,
      daysRemaining: 999,
      label: 'Active',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      isExpired: true,
      daysRemaining: diffDays,
      label: `Expired (${Math.abs(diffDays)}d ago)`,
      color: 'text-rose-700 bg-rose-50 border-rose-200',
    };
  } else if (diffDays <= 30) {
    return {
      isExpired: false,
      daysRemaining: diffDays,
      label: `Expires in ${diffDays}d`,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    };
  } else {
    return {
      isExpired: false,
      daysRemaining: diffDays,
      label: `Valid (${diffDays}d left)`,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    };
  }
}
