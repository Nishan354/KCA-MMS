import { GeneralDocument, INITIAL_GENERAL_DOCUMENTS } from '../types/document';

export const STORAGE_KEY_DOCUMENTS = 'kca_fujairah_general_documents_v1';

export function loadDocuments(): GeneralDocument[] {
  if (typeof window === 'undefined') return INITIAL_GENERAL_DOCUMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DOCUMENTS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading documents from localStorage:', err);
  }
  return INITIAL_GENERAL_DOCUMENTS;
}

export function saveDocuments(documents: GeneralDocument[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(documents));
  } catch (err) {
    console.error('Error saving documents to localStorage:', err);
  }
}

export function getUnitDocPrefix(unitName: string): string {
  const u = (unitName || 'Central').trim().toUpperCase();
  if (u.includes('FUJ')) return 'FUJ';
  if (u.includes('KAL') || u.includes('KLB')) return 'KLB';
  if (u.includes('KHOR') || u.includes('KHF')) return 'KHF';
  if (u.includes('DIB') || u.includes('DBA')) return 'DBA';
  if (u.includes('CEN') || u === 'ALL') return 'CEN';
  const clean = u.replace(/[^A-Z0-9]/g, '');
  return clean.slice(0, 3).padEnd(3, 'X');
}

export function generateNextDocumentReference(
  unitName: string,
  existingDocuments: GeneralDocument[],
  year = new Date().getFullYear()
): string {
  const prefix = getUnitDocPrefix(unitName);
  const patternPrefix = `DOC-KCA-${prefix}-${year}-`;
  
  let maxSeq = 0;
  existingDocuments.forEach((doc) => {
    if (doc.referenceCode) {
      if (doc.referenceCode.startsWith(patternPrefix)) {
        const numPart = doc.referenceCode.replace(patternPrefix, '');
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed) && parsed > maxSeq) {
          maxSeq = parsed;
        }
      } else if (doc.referenceCode.includes(`-${prefix}-`) || doc.referenceCode.includes(`-${prefix}`)) {
        const match = doc.referenceCode.match(/\d+$/);
        if (match) {
          const parsed = parseInt(match[0], 10);
          if (!isNaN(parsed) && parsed > maxSeq) {
            maxSeq = parsed;
          }
        }
      }
    }
  });

  const nextSeq = maxSeq + 1;
  return `DOC-KCA-${prefix}-${year}-${String(nextSeq).padStart(3, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function downloadDocumentFile(doc: GeneralDocument): void {
  if (doc.fileDataUrl) {
    const a = document.createElement('a');
    a.href = doc.fileDataUrl;
    a.download = doc.fileName || `${doc.referenceCode}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // If no base64 stored, create an official summary text/html/receipt document
  const content = `KAIRALI CULTURAL ASSOCIATION FUJAIRAH
A Norka Affiliated Organisation (Govt. of Kerala)
Fujairah, United Arab Emirates
-------------------------------------------------------
DOCUMENT ARCHIVE METADATA CERTIFICATE
-------------------------------------------------------
Document Title:    ${doc.title}
Reference Code:    ${doc.referenceCode}
Category:          ${doc.category}
Unit / Chapter:    ${doc.unit}
Document Date:     ${doc.documentDate}
${doc.expiryDate ? `Expiry Date:       ${doc.expiryDate}\n` : ''}Access Level:      ${doc.accessLevel}
Version:           ${doc.version || 'v1.0'}
File Name:         ${doc.fileName}
File Size:         ${formatFileSize(doc.fileSize)}
Uploaded By:       ${doc.uploadedBy || 'Executive Secretariat'}
Tags:              ${(doc.tags || []).join(', ')}

SUMMARY / DESCRIPTION:
${doc.description || 'Official records preserved in KCA Fujairah Central Archive.'}

-------------------------------------------------------
Digitally Certified & Archived in KCA Fujairah Documents Store
System Timestamp: ${new Date().toISOString()}
-------------------------------------------------------`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = doc.fileName.endsWith('.txt') ? doc.fileName : `${doc.fileName.replace(/\.[^/.]+$/, '')}_Meta.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportDocumentsCsv(docs: GeneralDocument[], filename = 'KCA_General_Documents_Register.csv'): void {
  const headers = [
    'Reference Code',
    'Document Title',
    'Category',
    'Unit',
    'Document Date',
    'Expiry Date',
    'Access Level',
    'File Name',
    'File Type',
    'File Size',
    'Version',
    'Uploaded By',
    'Tags',
    'Description',
    'Created At',
  ];

  const rows = docs.map((d) => [
    `"${(d.referenceCode || '').replace(/"/g, '""')}"`,
    `"${(d.title || '').replace(/"/g, '""')}"`,
    `"${(d.category || '').replace(/"/g, '""')}"`,
    `"${(d.unit || '').replace(/"/g, '""')}"`,
    `"${(d.documentDate || '').replace(/"/g, '""')}"`,
    `"${(d.expiryDate || '').replace(/"/g, '""')}"`,
    `"${(d.accessLevel || '').replace(/"/g, '""')}"`,
    `"${(d.fileName || '').replace(/"/g, '""')}"`,
    `"${(d.fileType || '').replace(/"/g, '""')}"`,
    `"${formatFileSize(d.fileSize)}"`,
    `"${(d.version || '').replace(/"/g, '""')}"`,
    `"${(d.uploadedBy || '').replace(/"/g, '""')}"`,
    `"${(d.tags || []).join(', ').replace(/"/g, '""')}"`,
    `"${(d.description || '').replace(/"/g, '""')}"`,
    `"${(d.createdAt || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
