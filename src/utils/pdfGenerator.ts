import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Member, CustomFieldDefinition } from '../types/member';
import { formatAED, formatDate, formatCardBloodGroup, getMemberReceiptVerifyUrl } from './idGenerator';
import { PUBLISHED_PORTAL_URL, OFFICIAL_ORG_NAME, OFFICIAL_EMAIL } from '../config/constants';
import { getActiveLogoPngDataUrl } from '../components/Logo';
import { generateDirectCardPng, generateDirectBackCardPng } from './cardExporter';
import { downloadFinanceVoucherPdf, memberToFinanceTransaction } from './financeVoucherGenerator';
import QRCode from 'qrcode';

/**
 * Generates and downloads an authentic, official PDF Payment Receipt for a member
 * Unified to match the Finance Ledger Receipt / Voucher format 100%
 */
export async function downloadReceiptPdf(member: Member): Promise<void> {
  const transaction = memberToFinanceTransaction(member);
  await downloadFinanceVoucherPdf(transaction);
}

/**
 * Report Filter Options Interface
 */
export interface ReportFilterOptions {
  unit?: string;
  membershipType?: string;
  registrationCategory?: string;
  paymentStatus?: string;
  bloodGroup?: string;
  profession?: string;
  status?: string;
  dateRange?: 'all' | '30days' | 'this_year' | 'last_year';
  title?: string;
  reportMode?: 'detailed' | 'profession' | 'standard';
  searchQuery?: string;
}

// Clean & normalize profession string so generic role fallbacks don't mask actual occupations
export const formatCleanProfession = (prof?: string | null): string => {
  if (!prof || !prof.trim()) return '';
  const trimmed = prof.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower === 'member' ||
    lower === 'general member' ||
    lower === 'active member' ||
    lower === 'registered member' ||
    lower === 'n/a' ||
    lower === 'na' ||
    lower === 'none' ||
    lower === 'null' ||
    lower === 'undefined'
  ) {
    return '';
  }
  return trimmed;
};

/**
 * Generates and downloads an official, formatted Membership Audit / Statistical PDF Report
 * Supports Comprehensive Detailed Mode, Professional & Occupational Register Mode, and Standard Mode.
 */
export function downloadMembershipReportPdf(
  members: Member[],
  filters: ReportFilterOptions = {}
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const primaryRed = [139, 0, 0];
  const slateDark = [30, 41, 59];
  const slateMuted = [100, 116, 139];
  const reportMode = filters.reportMode || 'detailed';

  // Header Banner
  doc.setFillColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.rect(0, 0, 297, 26, 'F');

  doc.setFillColor(217, 119, 6);
  doc.rect(0, 26, 297, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);

  let bannerTitle = 'KAIRALI CULTURAL ASSOCIATION FUJAIRAH — COMPREHENSIVE MEMBERSHIP & PROFESSIONAL REPORT';
  if (reportMode === 'profession') {
    bannerTitle = 'KAIRALI CULTURAL ASSOCIATION FUJAIRAH — OCCUPATIONAL & PROFESSIONAL DIRECTORY';
  } else if (reportMode === 'standard') {
    bannerTitle = 'KAIRALI CULTURAL ASSOCIATION FUJAIRAH — OFFICIAL MEMBERSHIP REGISTER';
  }
  if (filters.title) bannerTitle = filters.title;

  doc.text(bannerTitle, 148.5, 11, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Official Executive Management Register • Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • Scope: ${filters.unit || 'All Fujairah Units'}`,
    148.5,
    18,
    { align: 'center' }
  );

  // Filter Summary & Metrics Box
  const totalCollections = members.reduce((sum, m) => sum + (m.feeAmountAED || 0), 0);
  const paidCount = members.filter((m) => m.paymentStatus === 'Paid').length;
  const activeCount = members.filter((m) => m.status === 'Active').length;

  // Calculate Profession breakdown
  const professionCounts: Record<string, number> = {};
  members.forEach((m) => {
    const prof = formatCleanProfession(m.profession) || 'Not Specified';
    professionCounts[prof] = (professionCounts[prof] || 0) + 1;
  });

  const sortedProfessions = Object.entries(professionCounts)
    .filter(([p]) => p !== 'Not Specified')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([p, count]) => `${p} (${count})`)
    .join(', ');

  const totalUniqueProfessions = Object.keys(professionCounts).filter((p) => p !== 'Not Specified').length;

  doc.setFillColor(248, 250, 252);
  doc.rect(14, 31, 269, 18, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, 31, 269, 18, 'D');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.text(`Scope: ${filters.unit || 'All Fujairah Units'}`, 18, 37);
  doc.text(`Total Records: ${members.length} Members`, 78, 37);
  doc.text(`Active: ${activeCount}`, 135, 37);
  doc.text(`Collections: ${formatAED(totalCollections)} (${paidCount} Paid)`, 175, 37);
  doc.text(`Professions: ${totalUniqueProfessions} Roles`, 245, 37);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(
    `Filters: Role: ${filters.membershipType || 'All'} | Reg Type: ${filters.registrationCategory || 'All'} | Profession: ${filters.profession || 'All'} | Blood: ${filters.bloodGroup || 'All'} | Status: ${filters.status || 'All'}`,
    18,
    42
  );

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text(
    `Top Professions in Set: ${sortedProfessions || 'None Recorded (Unspecified)'}`,
    18,
    46
  );

  let headers: string[][] = [];
  let tableData: any[][] = [];

  if (reportMode === 'profession') {
    // Professional & Occupational Directory
    headers = [
      [
        '#',
        'Member ID',
        'Full Name',
        'Profession / Job Title',
        'Company / Workplace',
        'Unit',
        'Phone (UAE)',
        'WhatsApp',
        'Email Address',
        'Emirates ID',
        'Kerala District',
        'NORKA ID',
        'Blood',
      ],
    ];

    tableData = members.map((m, index) => [
      index + 1,
      m.membershipId,
      m.fullName,
      formatCleanProfession(m.profession) || 'Not Specified',
      m.companyName && m.companyName.trim() ? m.companyName.trim() : 'Not Specified',
      m.unit,
      m.phoneUAE || 'N/A',
      m.whatsapp || m.phoneUAE || 'N/A',
      m.email || 'N/A',
      m.emiratesId || 'N/A',
      m.keralaDistrict || 'N/A',
      m.norkaId || 'N/A',
      formatCardBloodGroup(m.bloodGroup),
    ]);
  } else if (reportMode === 'detailed') {
    // Comprehensive Detailed Report
    headers = [
      [
        '#',
        'Member ID',
        'Full Name & Malayalam',
        'Profession & Workplace',
        'Unit',
        'Contact / WhatsApp',
        'Emirates ID / NORKA',
        'District (Kerala)',
        'Blood',
        'Role / Category',
        'Fee & Payment',
        'Status & Expiry',
      ],
    ];

    tableData = members.map((m, index) => {
      const nameMalayalam = m.malayalamName ? `${m.fullName}\n(${m.malayalamName})` : m.fullName;
      const cleanProf = formatCleanProfession(m.profession) || 'Not Specified';
      const profCompany = m.companyName && m.companyName.trim()
        ? `${cleanProf}\n@ ${m.companyName.trim()}`
        : cleanProf;
      const contactInfo = `${m.phoneUAE || 'N/A'}${m.whatsapp && m.whatsapp !== m.phoneUAE ? '\nWA: ' + m.whatsapp : ''}`;
      const eidNorka = `${m.emiratesId || 'EID: N/A'}${m.norkaId ? '\nNRK: ' + m.norkaId : ''}`;
      const roleCat = `${m.membershipType.replace(' Member', '')}\n(${m.registrationCategory})`;
      const feePay = `${formatAED(m.feeAmountAED)}\n${m.paymentStatus}${m.receiptNumber ? ' (#' + m.receiptNumber + ')' : ''}`;
      const statusExp = `${m.status}\nExp: ${formatDate(m.expiryDate)}`;

      return [
        index + 1,
        m.membershipId,
        nameMalayalam,
        profCompany,
        m.unit,
        contactInfo,
        eidNorka,
        m.keralaDistrict || 'N/A',
        formatCardBloodGroup(m.bloodGroup),
        roleCat,
        feePay,
        statusExp,
      ];
    });
  } else {
    // Standard Register
    headers = [
      [
        '#',
        'Member ID',
        'Full Name',
        'Unit',
        'Contact / WhatsApp',
        'Profession',
        'Role',
        'Category',
        'Expiry Date',
        'Fee (AED)',
        'Payment',
      ],
    ];

    tableData = members.map((m, index) => [
      index + 1,
      m.membershipId,
      m.fullName,
      m.unit,
      m.phoneUAE || m.whatsapp || 'N/A',
      formatCleanProfession(m.profession) || 'Not Specified',
      m.membershipType.replace(' Member', ''),
      m.registrationCategory,
      formatDate(m.expiryDate),
      formatAED(m.feeAmountAED),
      m.paymentStatus,
    ]);
  }

  autoTable(doc, {
    startY: 52,
    head: headers,
    body: tableData,
    headStyles: {
      fillColor: [139, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles:
      reportMode === 'detailed'
        ? {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 22, fontStyle: 'bold' },
            2: { cellWidth: 32 },
            3: { cellWidth: 32 },
            4: { cellWidth: 16 },
            5: { cellWidth: 26 },
            6: { cellWidth: 30 },
            7: { cellWidth: 20 },
            8: { cellWidth: 12, halign: 'center' },
            9: { cellWidth: 20 },
            10: { cellWidth: 24, halign: 'right' },
            11: { cellWidth: 24 },
          }
        : reportMode === 'profession'
        ? {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 22, fontStyle: 'bold' },
            2: { cellWidth: 32 },
            3: { cellWidth: 30 },
            4: { cellWidth: 30 },
            5: { cellWidth: 16 },
            6: { cellWidth: 22 },
            7: { cellWidth: 22 },
            8: { cellWidth: 30 },
            9: { cellWidth: 26 },
            10: { cellWidth: 18 },
            11: { cellWidth: 18 },
            12: { cellWidth: 12, halign: 'center' },
          }
        : undefined,
    theme: 'grid',
  });

  // Footer on each page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(
      `KAIRALI CULTURAL ASSOCIATION FUJAIRAH • Official Membership & Professional Audit Register • Page ${i} of ${pageCount}`,
      148.5,
      203,
      { align: 'center' }
    );
  }

  const cleanUnit = (filters.unit || 'All_Units').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanMode = reportMode.toUpperCase();
  doc.save(`KCA_${cleanMode}_Report_${cleanUnit}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Exports current member records to CSV with full professional and contact fields
 */
export function exportMembersToCsv(members: Member[], filename: string = 'KCA_Fujairah_Members.csv'): void {
  const headers = [
    'Membership ID',
    'Full Name',
    'Malayalam Name',
    'Gender',
    'Date of Birth',
    'Unit',
    'Member Joined Date',
    'Role / Type',
    'Registration Category',
    'UAE Phone',
    'WhatsApp',
    'Email',
    'Blood Group',
    'Emirates ID',
    'Passport Number',
    'NORKA ID',
    'Profession',
    'Company / Employer',
    'UAE Address',
    'Kerala Address',
    'Kerala District',
    'Emergency Contact Name',
    'Emergency Contact Relation',
    'Emergency Contact Phone',
    'Fee (AED)',
    'Payment Status',
    'Payment Method',
    'Receipt Number',
    'Registration Date',
    'Expiry Date',
    'Status',
  ];

  const rows = members.map((m) => [
    `"${m.membershipId}"`,
    `"${m.fullName.replace(/"/g, '""')}"`,
    `"${(m.malayalamName || '').replace(/"/g, '""')}"`,
    `"${m.gender || ''}"`,
    `"${m.dateOfBirth || ''}"`,
    `"${m.unit}"`,
    `"${m.joinDate || m.registrationDate}"`,
    `"${m.membershipType}"`,
    `"${m.registrationCategory}"`,
    `"${m.phoneUAE || ''}"`,
    `"${m.whatsapp || ''}"`,
    `"${m.email || ''}"`,
    `"${m.bloodGroup || ''}"`,
    `"${m.emiratesId || ''}"`,
    `"${m.passportNumber || ''}"`,
    `"${m.norkaId || ''}"`,
    `"${(formatCleanProfession(m.profession)).replace(/"/g, '""')}"`,
    `"${(m.companyName || '').replace(/"/g, '""')}"`,
    `"${(m.uaeAddress || '').replace(/"/g, '""')}"`,
    `"${(m.keralaAddress || '').replace(/"/g, '""')}"`,
    `"${(m.keralaDistrict || '').replace(/"/g, '""')}"`,
    `"${(m.emergencyContactName || '').replace(/"/g, '""')}"`,
    `"${(m.emergencyContactRelation || '').replace(/"/g, '""')}"`,
    `"${(m.emergencyContactPhone || '').replace(/"/g, '""')}"`,
    `"${m.feeAmountAED || 0}"`,
    `"${m.paymentStatus}"`,
    `"${m.paymentMethod || ''}"`,
    `"${m.receiptNumber || ''}"`,
    `"${m.registrationDate}"`,
    `"${m.expiryDate}"`,
    `"${m.status}"`,
  ]);

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

export interface BatchPdfOptions {
  side?: 'front' | 'back' | 'both';
  layout?: '8_per_page' | '10_per_page';
  showCropMarks?: boolean;
  bothSideMode?: 'side_by_side' | 'duplex_pages';
  customFields?: CustomFieldDefinition[];
  onProgress?: (current: number, total: number) => void;
}

/**
 * Generates an authentic, perfectly aligned A4 PDF sheet for batch printing CR-80 ID cards.
 * Standard CR-80 format: 85.6mm × 54.0mm (standard PVC ID card dimensions).
 */
export async function generateBatchIdCardsPdf(
  members: Member[],
  options: BatchPdfOptions = {}
): Promise<void> {
  const {
    side = 'front',
    layout = '8_per_page',
    showCropMarks = true,
    bothSideMode = 'side_by_side',
    customFields = [],
    onProgress,
  } = options;

  if (!members || members.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const cardWidth = 85.6;
  const cardHeight = 54.0;

  // Grid coordinates for A4 (210mm × 297mm)
  const is8PerPage = layout === '8_per_page';
  const cols = 2;
  const rows = is8PerPage ? 4 : 5;
  const cardsPerPage = cols * rows;

  const colX = is8PerPage ? [14.4, 110.0] : [14.4, 110.0];
  const rowY = is8PerPage
    ? [22.0, 82.0, 142.0, 202.0]
    : [15.0, 69.0, 123.0, 177.0, 231.0];

  // Draw Page Header & Crop marks
  const drawPageDecoration = (pageNum: number, totalPages: number) => {
    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(139, 0, 0);
    doc.text(
      'KAIRALI CULTURAL ASSOCIATION FUJAIRAH • OFFICIAL DIGITAL MEMBERSHIP CARDS',
      105,
      is8PerPage ? 14 : 9,
      { align: 'center' }
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Standard CR-80 PVC Size (85.6mm × 54.0mm) • A4 Sheet Print (100% Actual Size / No Scaling)`,
      105,
      is8PerPage ? 18 : 12.5,
      { align: 'center' }
    );

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Sheet ${pageNum} of ${totalPages} • Kairali Cultural Association Central Register`,
      105,
      is8PerPage ? 275 : 291,
      { align: 'center' }
    );
  };

  // Compile list of card items to place
  interface CardItem {
    member: Member;
    sideType: 'front' | 'back';
  }

  const cardItems: CardItem[] = [];

  if (side === 'front') {
    members.forEach((m) => cardItems.push({ member: m, sideType: 'front' }));
  } else if (side === 'back') {
    members.forEach((m) => cardItems.push({ member: m, sideType: 'back' }));
  } else {
    // 'both' sides
    if (bothSideMode === 'side_by_side') {
      members.forEach((m) => {
        cardItems.push({ member: m, sideType: 'front' });
        cardItems.push({ member: m, sideType: 'back' });
      });
    } else {
      // Duplex pages: Page of Fronts followed by Page of Backs
      // We will handle via pages grouping
    }
  }

  const totalItems =
    side === 'both' && bothSideMode === 'duplex_pages'
      ? members.length * 2
      : cardItems.length;

  let processedCount = 0;

  if (side === 'both' && bothSideMode === 'duplex_pages') {
    // Duplex mode: Fronts on Sheet 1, Backs on Sheet 2
    const totalPages = Math.ceil(members.length / cardsPerPage) * 2;
    let currentPageIndex = 0;

    for (let i = 0; i < members.length; i += cardsPerPage) {
      const chunk = members.slice(i, i + cardsPerPage);

      // 1. Fronts Page
      if (currentPageIndex > 0) doc.addPage('a4', 'portrait');
      currentPageIndex++;
      drawPageDecoration(currentPageIndex, totalPages);

      for (let j = 0; j < chunk.length; j++) {
        const member = chunk[j];
        const col = j % cols;
        const row = Math.floor(j / cols);
        const x = colX[col];
        const y = rowY[row];

        if (showCropMarks) {
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.3);
          doc.setLineDashPattern([2, 2], 0);
          doc.rect(x - 0.5, y - 0.5, cardWidth + 1, cardHeight + 1, 'S');
          doc.setLineDashPattern([], 0);
        }

        const frontDataUrl = await generateDirectCardPng(member, customFields);
        doc.addImage(frontDataUrl, 'PNG', x, y, cardWidth, cardHeight);

        processedCount++;
        if (onProgress) onProgress(processedCount, totalItems);
      }

      // 2. Backs Page (Mirrored horizontally for short-edge / standard duplex)
      doc.addPage('a4', 'portrait');
      currentPageIndex++;
      drawPageDecoration(currentPageIndex, totalPages);

      for (let j = 0; j < chunk.length; j++) {
        const member = chunk[j];
        // Mirror column so front and back align perfectly on double-sided print
        const origCol = j % cols;
        const col = origCol === 0 ? 1 : 0;
        const row = Math.floor(j / cols);
        const x = colX[col];
        const y = rowY[row];

        if (showCropMarks) {
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.3);
          doc.setLineDashPattern([2, 2], 0);
          doc.rect(x - 0.5, y - 0.5, cardWidth + 1, cardHeight + 1, 'S');
          doc.setLineDashPattern([], 0);
        }

        const backDataUrl = await generateDirectBackCardPng(member, customFields);
        doc.addImage(backDataUrl, 'PNG', x, y, cardWidth, cardHeight);

        processedCount++;
        if (onProgress) onProgress(processedCount, totalItems);
      }
    }
  } else {
    // Normal sequential placement
    const totalPages = Math.ceil(cardItems.length / cardsPerPage);

    for (let p = 0; p < totalPages; p++) {
      if (p > 0) doc.addPage('a4', 'portrait');
      drawPageDecoration(p + 1, totalPages);

      const pageItems = cardItems.slice(p * cardsPerPage, (p + 1) * cardsPerPage);

      for (let j = 0; j < pageItems.length; j++) {
        const item = pageItems[j];
        const col = j % cols;
        const row = Math.floor(j / cols);
        const x = colX[col];
        const y = rowY[row];

        if (showCropMarks) {
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.3);
          doc.setLineDashPattern([2, 2], 0);
          doc.rect(x - 0.5, y - 0.5, cardWidth + 1, cardHeight + 1, 'S');
          doc.setLineDashPattern([], 0);
        }

        const cardDataUrl =
          item.sideType === 'front'
            ? await generateDirectCardPng(item.member, customFields)
            : await generateDirectBackCardPng(item.member, customFields);

        doc.addImage(cardDataUrl, 'PNG', x, y, cardWidth, cardHeight);

        processedCount++;
        if (onProgress) onProgress(processedCount, totalItems);
      }
    }
  }

  const cleanSide = side.toUpperCase();
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`KCA_Batch_ID_Cards_${cleanSide}_A4_${dateStr}.pdf`);
}
