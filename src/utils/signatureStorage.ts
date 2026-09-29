export interface StoredSignature {
  id: string;
  signatoryRole: 'President' | 'General Secretary' | 'Treasurer' | 'Convener' | 'Custom';
  customTitle?: string;
  name: string;
  unit: string;
  signatureDataUrl: string; // Base64 PNG image
  uploadedAt: string;
}

export const STORAGE_KEY_SIGNATURES = 'kca_fujairah_signatures_v1';

export const DEFAULT_SIGNATURES: StoredSignature[] = [
  {
    id: 'sig_president',
    signatoryRole: 'President',
    name: 'K. V. Mohanan',
    unit: 'Central',
    signatureDataUrl: '', // Can be uploaded
    uploadedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'sig_gen_sec',
    signatoryRole: 'General Secretary',
    name: 'Suresh Kumar Pillai',
    unit: 'Central',
    signatureDataUrl: '',
    uploadedAt: '2026-01-01T00:00:00Z',
  },
];

export function loadStoredSignatures(): StoredSignature[] {
  if (typeof window === 'undefined') return DEFAULT_SIGNATURES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SIGNATURES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading stored signatures:', err);
  }
  return DEFAULT_SIGNATURES;
}

export function saveStoredSignatures(signatures: StoredSignature[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SIGNATURES, JSON.stringify(signatures));
  } catch (err) {
    console.error('Error saving stored signatures:', err);
  }
}

export function upsertStoredSignature(signature: StoredSignature): StoredSignature[] {
  const current = loadStoredSignatures();
  const index = current.findIndex((s) => s.id === signature.id || (s.signatoryRole === signature.signatoryRole && s.unit === signature.unit));
  let updated: StoredSignature[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = signature;
  } else {
    updated = [signature, ...current];
  }
  saveStoredSignatures(updated);
  return updated;
}

export function clearStoredSignature(role: string, unit?: string): StoredSignature[] {
  const current = loadStoredSignatures();
  const updated = current.map((s) => {
    if (s.signatoryRole === role && (!unit || s.unit === unit)) {
      return { ...s, signatureDataUrl: '' };
    }
    return s;
  });
  saveStoredSignatures(updated);
  return updated;
}

export function removeStoredSignatureById(id: string): StoredSignature[] {
  const current = loadStoredSignatures();
  const updated = current.map((s) => {
    if (s.id === id) {
      return { ...s, signatureDataUrl: '' };
    }
    return s;
  });
  saveStoredSignatures(updated);
  return updated;
}
