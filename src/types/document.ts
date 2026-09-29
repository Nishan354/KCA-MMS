export type DocumentCategory =
  | 'Legal & Governance'
  | 'Government & NORKA'
  | 'Minutes & Resolutions'
  | 'Financial & Audit'
  | 'Events & Programs'
  | 'Circulars & Notices'
  | 'Forms & Templates'
  | 'Unit Administration'
  | 'Press & Media'
  | 'Other';

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'Legal & Governance',
  'Government & NORKA',
  'Minutes & Resolutions',
  'Financial & Audit',
  'Events & Programs',
  'Circulars & Notices',
  'Forms & Templates',
  'Unit Administration',
  'Press & Media',
  'Other',
];

export type DocumentAccessLevel =
  | 'General / All Members'
  | 'Executive Committee'
  | 'Confidential / Admin Only';

export interface GeneralDocument {
  id: string;
  title: string;
  referenceCode: string; // e.g. "DOC-KCA-2026-NORKA-01"
  category: DocumentCategory | string;
  description?: string;
  fileName: string;
  fileType: 'pdf' | 'word' | 'excel' | 'image' | 'archive' | 'text' | 'other';
  mimeType?: string;
  fileSize: number; // in bytes
  fileDataUrl?: string; // Base64 data URL for preview/download
  externalUrl?: string;
  unit: string; // "Central", "Fujairah", "Kalba", "Khorfakhan", "Dibba"
  documentDate: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD (e.g. for registration, permits, insurance)
  accessLevel: DocumentAccessLevel;
  tags: string[];
  version?: string; // e.g. "v1.0", "Rev 2"
  uploadedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export const INITIAL_GENERAL_DOCUMENTS: GeneralDocument[] = [];

