import { OfficialLetter, LetterSeriesConfig, DEFAULT_LETTER_TEMPLATES } from '../types/letter';
import jsPDF from 'jspdf';
import { getActiveLogoPngDataUrl } from '../components/Logo';
import { OFFICIAL_ORG_NAME, OFFICIAL_AFFILIATION, OFFICIAL_LETTER_EMAIL, OFFICIAL_PHONE, OFFICIAL_LOCATION } from '../config/constants';

export const STORAGE_KEY_LETTERS = 'kca_fujairah_letters_v1';
export const STORAGE_KEY_LETTER_SERIES = 'kca_letter_series_config_v1';

export const UNIT_CODE_MAP: Record<string, string> = {
  Central: 'CENTRAL',
  Fujairah: 'FUJ',
  Kalba: 'KLB',
  Khorfakhan: 'KHK',
  Dibba: 'DBA',
};

export const INITIAL_LETTERS: OfficialLetter[] = [];

export function loadLetters(): OfficialLetter[] {
  if (typeof window === 'undefined') return INITIAL_LETTERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LETTERS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading letters from storage:', err);
  }
  return INITIAL_LETTERS;
}

export function saveLetters(letters: OfficialLetter[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_LETTERS, JSON.stringify(letters));
  } catch (err) {
    console.error('Error saving letters to storage:', err);
  }
}

export function getNextReferenceNumber(unit: string = 'Central'): { referenceNumber: string; seriesNumber: number } {
  const currentYear = new Date().getFullYear();
  const unitCode = UNIT_CODE_MAP[unit] || unit.toUpperCase().slice(0, 3);
  const letters = loadLetters();

  // Find max series for this unit & year
  const matching = letters.filter((l) => {
    return l.unit === unit && (l.date ? new Date(l.date).getFullYear() === currentYear : true);
  });

  const nextSeries = matching.length > 0 ? Math.max(...matching.map((m) => m.seriesNumber || 0)) + 1 : 1;
  const paddedSeries = String(nextSeries).padStart(3, '0');
  const referenceNumber = `KCA/${unitCode}/REF/${currentYear}/${paddedSeries}`;

  return { referenceNumber, seriesNumber: nextSeries };
}

/**
 * Generate High-Resolution Print-Ready PDF Letter Pad
 */
export async function downloadLetterPdf(letter: OfficialLetter): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // 1. Top Decorative Brand Bar
  doc.setFillColor(136, 19, 55); // #881337 primary maroon
  doc.rect(0, 0, pageWidth, 7, 'F');

  // Gold accent bar
  doc.setFillColor(217, 119, 6); // amber-600 gold
  doc.rect(0, 7, pageWidth, 1.5, 'F');

  // 2. Official Header Block
  // Draw Official Logo
  try {
    const logoDataUrl = await getActiveLogoPngDataUrl();
    doc.addImage(logoDataUrl, 'PNG', margin, 12, 22, 22);
  } catch (err) {
    console.warn('Could not draw logo in letter PDF:', err);
  }

  // Header Title & Branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(136, 19, 55);
  doc.text('KAIRALI CULTURAL ASSOCIATION FUJAIRAH', margin + 26, 18.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9); // Gold/Amber
  doc.text(OFFICIAL_AFFILIATION, margin + 26, 23.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const unitLabel = letter.unit === 'Central' ? 'Central Committee' : `${letter.unit} Unit`;
  doc.text(`${unitLabel}  •  Fujairah, UAE  •  Email: ${OFFICIAL_LETTER_EMAIL}`, margin + 26, 28);

  // Header Divider Line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.6);
  doc.line(margin, 35, pageWidth - margin, 35);

  // 3. Reference & Date Bar
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`Ref: ${letter.referenceNumber}`, margin, 44);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const formattedDate = new Date(letter.date || new Date()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Date: ${formattedDate}`, pageWidth - margin, 44, { align: 'right' });

  // 4. To Address
  let currentY = 53;
  if (letter.toAddress) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    const toLines = doc.splitTextToSize(letter.toAddress, 90);
    doc.text(toLines, margin, currentY);
    currentY += toLines.length * 5 + 5;
  }

  // 5. Subject Line
  if (letter.subject) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    const subPrefix = 'Subject: ';
    const subjectFull = subPrefix + letter.subject.toUpperCase();
    const subjectLines = doc.splitTextToSize(subjectFull, contentWidth);
    doc.text(subjectLines, margin, currentY);

    // Subject underline
    const subjectWidth = Math.min(doc.getTextWidth(subjectFull), contentWidth);
    doc.setDrawColor(136, 19, 55);
    doc.setLineWidth(0.4);
    doc.line(margin, currentY + 1.5, margin + subjectWidth, currentY + 1.5);

    currentY += subjectLines.length * 5 + 6;
  }

  // 6. Salutation
  if (letter.salutation) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(letter.salutation, margin, currentY);
    currentY += 6;
  }

  // 7. Letter Body (Convert HTML / Paragraphs to clean text)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  // Helper to strip html tags and preserve linebreaks
  const cleanBodyText = letter.bodyHtml
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<strong>/gi, '')
    .replace(/<\/strong>/gi, '')
    .replace(/<em>/gi, '')
    .replace(/<\/em>/gi, '')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();

  const paragraphs = cleanBodyText.split('\n\n');
  for (const para of paragraphs) {
    if (!para.trim()) continue;
    const lines = doc.splitTextToSize(para.trim(), contentWidth);
    doc.text(lines, margin, currentY);
    currentY += lines.length * 5 + 4;
  }

  // 8. Sign-off Statement
  currentY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('Yours faithfully,', margin, currentY);
  currentY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.text('For KAIRALI CULTURAL ASSOCIATION FUJAIRAH', margin, currentY);

  // 9. Signatures Block (Bottom)
  const sigY = Math.max(currentY + 14, pageHeight - 50);

  if (letter.signatories && letter.signatories.length > 0) {
    const colCount = letter.signatories.length;
    const colWidth = contentWidth / colCount;

    letter.signatories.forEach((sig, idx) => {
      const colX = margin + idx * colWidth;

      // Draw digital signature image if uploaded & enabled
      if (sig.signatureDataUrl && sig.showSignature) {
        try {
          doc.addImage(sig.signatureDataUrl, 'PNG', colX + 5, sigY - 14, 32, 12);
        } catch (e) {
          console.warn('Could not draw signature image in letter PDF:', e);
        }
      }

      // Signature line
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.4);
      doc.line(colX, sigY, colX + colWidth - 12, sigY);

      // Signatory Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(sig.name, colX, sigY + 4.5);

      // Signatory Title
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const targetUnit = sig.unit || letter.unit;
      const unitLabel = targetUnit === 'Central' ? 'Central Committee' : `${targetUnit} Unit`;
      const fullTitle = `${sig.title}, KCA Fujairah (${unitLabel})`;
      doc.text(fullTitle, colX, sigY + 8.5);
    });
  }

  // 10. Bottom Footer Ribbon
  doc.setFillColor(248, 250, 252);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(0, pageHeight - 12, pageWidth, pageHeight - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Official Correspondence • KCA Fujairah • Email: ${OFFICIAL_LETTER_EMAIL} • Ref: ${letter.referenceNumber} • Status: ${letter.status.toUpperCase()}`,
    pageWidth / 2,
    pageHeight - 5,
    { align: 'center' }
  );

  const safeFileName = `KCA_Letter_${letter.referenceNumber.replace(/[\/\\]/g, '_')}.pdf`;
  doc.save(safeFileName);
}
