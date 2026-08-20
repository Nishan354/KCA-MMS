import { Member } from '../types/member';

/**
 * Normalizes phone numbers to standard searchable digit strings.
 * Handles UAE prefix (+971, 00971, 971, 0), spaces, dashes, etc.
 */
export function normalizePhoneDigits(phone?: string | null): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Extracts key phone suffix/core for comparison (e.g. last 9 or 7 digits).
 */
export function getCorePhoneDigits(phone?: string | null): string {
  const digits = normalizePhoneDigits(phone);
  if (digits.length >= 9) {
    return digits.slice(-9); // UAE mobile core: e.g. 504829134
  }
  return digits;
}

/**
 * Checks if a search query matches a member's phone number.
 */
export function matchesPhoneNumber(queryDigits: string, phone?: string | null): boolean {
  if (!queryDigits || queryDigits.length < 5 || !phone) return false;
  
  const targetDigits = normalizePhoneDigits(phone);
  if (!targetDigits) return false;

  // Exact digit match
  if (targetDigits === queryDigits) return true;

  // Substring match if query is long enough
  if (queryDigits.length >= 7 && targetDigits.includes(queryDigits)) return true;
  if (targetDigits.length >= 7 && queryDigits.includes(targetDigits)) return true;

  // Core UAE 9-digit match (e.g. 504829134 vs 0504829134 vs +971504829134)
  const qCore9 = queryDigits.length >= 9 ? queryDigits.slice(-9) : null;
  const tCore9 = targetDigits.length >= 9 ? targetDigits.slice(-9) : null;
  if (qCore9 && tCore9 && qCore9 === tCore9) return true;

  // Last 7-digit local suffix match (e.g. 4829134)
  if (queryDigits.length >= 7 && targetDigits.length >= 7) {
    if (queryDigits.slice(-7) === targetDigits.slice(-7)) return true;
  }

  // Handle leading zero variations: e.g. "0504829134" and "504829134"
  const qWithoutZero = queryDigits.startsWith('0') ? queryDigits.slice(1) : queryDigits;
  const tWithoutZero = targetDigits.startsWith('0') ? targetDigits.slice(1) : targetDigits;
  if (qWithoutZero === tWithoutZero) return true;

  return false;
}

/**
 * Comprehensive Member Lookup function.
 * Searches across:
 * 1. Mobile Phone (phoneUAE)
 * 2. WhatsApp Number (whatsapp)
 * 3. India Phone / Alt Phone (phoneIndia, emergencyContactPhone)
 * 4. Membership ID (e.g. "KCA-FU-1001", "FU-1001", "1001")
 * 5. System ID
 * 6. Emirates ID (e.g. "784-1988-1234567-1")
 * 7. Full Name / Email
 */
export function findMemberByQuery(rawQuery: string, members: Member[]): Member | null {
  if (!rawQuery || !members || members.length === 0) return null;

  const query = rawQuery.trim();
  const queryLower = query.toLowerCase();
  const queryAlnum = queryLower.replace(/[^a-z0-9]/g, '');
  const queryDigits = query.replace(/\D/g, '');

  // 1. Direct Membership ID exact or normalized match
  for (const m of members) {
    const mId = (m.membershipId || '').trim();
    const mIdLower = mId.toLowerCase();
    const mIdAlnum = mIdLower.replace(/[^a-z0-9]/g, '');

    if (mIdLower === queryLower || (queryAlnum.length >= 3 && mIdAlnum === queryAlnum)) {
      return m;
    }

    if ((m.id || '').toLowerCase() === queryLower) {
      return m;
    }
  }

  // 2. Mobile / WhatsApp / Emergency Phone match (High Priority)
  if (queryDigits.length >= 5) {
    for (const m of members) {
      if (matchesPhoneNumber(queryDigits, m.phoneUAE)) return m;
      if (matchesPhoneNumber(queryDigits, m.whatsapp)) return m;
      if (matchesPhoneNumber(queryDigits, m.emergencyContactPhone)) return m;
    }
  }

  // 3. Emirates ID match (digits or full string)
  if (queryDigits.length >= 6 || queryAlnum.length >= 6) {
    for (const m of members) {
      const eidDigits = (m.emiratesId || '').replace(/\D/g, '');
      if (eidDigits && (eidDigits === queryDigits || (queryDigits.length >= 7 && eidDigits.includes(queryDigits)))) {
        return m;
      }
      const cleanEid = (m.emiratesId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanEid && cleanEid.includes(queryAlnum)) {
        return m;
      }
    }
  }

  // 4. Membership ID suffix match (e.g. user typed "1001" or "FU-1001")
  if (queryAlnum.length >= 3) {
    for (const m of members) {
      const mIdAlnum = (m.membershipId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (mIdAlnum.endsWith(queryAlnum) || mIdAlnum.includes(queryAlnum)) {
        return m;
      }
    }
  }

  // 5. Full Name substring match (if length >= 3)
  if (queryLower.length >= 3) {
    for (const m of members) {
      const name = (m.fullName || '').toLowerCase();
      if (name === queryLower || name.includes(queryLower)) {
        return m;
      }
      const email = (m.email || '').toLowerCase();
      if (email && email === queryLower) {
        return m;
      }
    }
  }

  return null;
}
