import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Member, CustomFieldDefinition } from '../types/member';
import { formatAED, formatDate, formatCardBloodGroup, getMemberReceiptVerifyUrl } from './idGenerator';
import { PUBLISHED_PORTAL_URL, OFFICIAL_ORG_NAME, OFFICIAL_EMAIL } from '../config/constants';
import { getActiveLogoDataUrl } from '../components/Logo';
import { generateDirectCardPng, generateDirectBackCardPng } from './cardExporter';
import QRCode from 'qrcode';

/**
 * Generates and downloads an authentic, official PDF Payment Receipt for a member
 */
export async function downloadReceiptPdf(member: Member): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryRed = [139, 0, 0]; // #8b0000
  const darkRed = [115, 0, 0];
  const slateDark = [30, 41, 59];
  const slateMuted = [100, 116, 139];

  // Header Banner
  doc.setFillColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.rect(0, 0, 210, 36, 'F');

  // Gold accent bar
  doc.setFillColor(217, 119, 6);
  doc.rect(0, 36, 210, 2.5, 'F');

  // Draw Official KCA Logo in Header
  try {
    const logoDataUrl = getActiveLogoDataUrl();
    doc.addImage(logoDataUrl, 'PNG', 12, 5, 26, 26);
  } catch (logoErr) {
    console.warn('Could not draw logo in PDF receipt:', logoErr);
  }

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('KAIRALI CULTURAL ASSOCIATION FUJAIRAH', 114, 15, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('FUJAIRAH', 114, 22, { align: 'center' });

  doc.setFontSize(8.5);
  doc.text(`Email: ${OFFICIAL_EMAIL}`, 114, 28, { align: 'center' });

  // Official Receipt Title Ribbon
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 45, 180, 20, 2, 2, 'FD');
  doc.setDrawColor(226, 232, 240);

  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('OFFICIAL PAYMENT RECEIPT (AED)', 22, 53);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`RECEIPT NO: ${member.receiptNumber || 'REC-' + member.membershipId}`, 22, 60);

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date of Issue: ${formatDate(member.registrationDate)}`, 140, 53);
  doc.text(`Status: ${member.paymentStatus.toUpperCase()}`, 140, 60);

  // Member Information Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.text('MEMBER DETAILS', 15, 74);

  const isRenewal =
    member.registrationCategory === 'Renewal' ||
    (member.paymentHistory && member.paymentHistory.some((p) => p.purpose === 'Renewal Fee')) ||
    (!!member.lastRenewalDate && member.lastRenewalDate !== member.registrationDate);
  const paymentDescription = isRenewal ? 'Renewal Membership Fee' : 'New Membership Fee';

  const memberDetails = [
    [
      { content: 'Received From:', styles: { fontStyle: 'bold', textColor: slateMuted } },
      { content: member.fullName, styles: { fontStyle: 'bold', textColor: slateDark } },
      { content: 'Membership ID:', styles: { fontStyle: 'bold', textColor: slateMuted } },
      { content: member.membershipId, styles: { fontStyle: 'bold', textColor: primaryRed } },
    ],
    [
      { content: 'Assigned Unit:', styles: { fontStyle: 'bold', textColor: slateMuted } },
      { content: `${member.unit} Unit`, styles: { textColor: slateDark } },
      { content: 'Validity Period:', styles: { fontStyle: 'bold', textColor: slateMuted } },
      { content: `Up to ${formatDate(member.expiryDate)}`, styles: { fontStyle: 'bold', textColor: slateDark } },
    ],
    [
      { content: 'UAE Mobile / WhatsApp:', styles: { fontStyle: 'bold', textColor: slateMuted } },
      { content: member.phoneUAE || member.whatsapp || 'N/A', styles: { textColor: slateDark } },
      { content: 'Payment Status:', styles: { fontStyle: 'bold', textColor: slateMuted } },
      { content: member.paymentStatus.toUpperCase(), styles: { fontStyle: 'bold', textColor: [16, 185, 129] } },
    ],
  ];

  autoTable(doc, {
    startY: 77,
    body: memberDetails as any,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 50 },
      2: { cellWidth: 45 },
      3: { cellWidth: 45 },
    },
  });

  // Financial Table
  const tableStartY = (doc as any).lastAutoTable.finalY + 6;

  autoTable(doc, {
    startY: tableStartY,
    head: [['Item / Description', 'Validity', 'Payment Method', 'Amount (AED)']],
    body: [
      [
        paymentDescription,
        `Valid Thru: ${formatDate(member.expiryDate)}`,
        `${member.paymentMethod || 'Cash'}`,
        formatAED(member.feeAmountAED),
      ],
    ],
    foot: [['TOTAL AMOUNT RECEIVED', '', '', formatAED(member.feeAmountAED)]],
    headStyles: {
      fillColor: [139, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    footStyles: {
      fillColor: [248, 250, 252],
      textColor: [139, 0, 0],
      fontStyle: 'bold',
      fontSize: 10,
    },
    styles: { fontSize: 8.5, cellPadding: 4 },
    theme: 'grid',
  });

  const postTableY = (doc as any).lastAutoTable.finalY + 12;

  // Generate Verification QR Code in PDF
  try {
    const verifyUrl = getMemberReceiptVerifyUrl(member);
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 140,
      color: { dark: '#1e293b', light: '#ffffff' },
    });
    doc.addImage(qrDataUrl, 'PNG', 15, postTableY, 26, 26);
    doc.setFontSize(7.5);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text('Scan with phone camera to', 44, postTableY + 10);
    doc.text('verify payment & digital ID', 44, postTableY + 15);
  } catch (err) {
    console.error('Failed to append QR to PDF:', err);
  }

  // Only two signatures: Secretary and Treasurer
  const sigY = postTableY + 28;
  doc.setDrawColor(180, 180, 180);
  doc.line(20, sigY + 12, 70, sigY + 12);
  doc.line(140, sigY + 12, 190, sigY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('Secretary', 45, sigY + 17, { align: 'center' });
  doc.text('Treasurer', 165, sigY + 17, { align: 'center' });

  // Bottom Notice
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(
    'This is an official receipt issued by Kairali Cultural Association Fujairah.',
    105,
    280,
    { align: 'center' }
  );

  const cleanName = member.fullName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`KCA_Receipt_${member.receiptNumber || member.membershipId}_${cleanName}.pdf`);
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
  status?: string;
  dateRange?: 'all' | '30days' | 'this_year' | 'last_year';
  title?: string;
}

/**
 * Generates and downloads an official, formatted Membership Audit / Statistical PDF Report
 */
export function downloadMembershipReportPdf(
  members: Member[],
  filters: ReportFilterOptions
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const primaryRed = [139, 0, 0];
  const slateDark = [30, 41, 59];
  const slateMuted = [100, 116, 139];

  // Header Banner
  doc.setFillColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.rect(0, 0, 297, 26, 'F');

  doc.setFillColor(217, 119, 6);
  doc.rect(0, 26, 297, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('KAIRALI CULTURAL ASSOCIATION FUJAIRAH - MEMBERSHIP REPORT', 148.5, 11, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Official Management Report • Date: ${new Date().toLocaleDateString('en-GB')}`,
    148.5,
    18,
    { align: 'center' }
  );

  // Filter Summary Box
  const totalCollections = members.reduce((sum, m) => sum + (m.feeAmountAED || 0), 0);
  const paidCount = members.filter((m) => m.paymentStatus === 'Paid').length;
  const activeCount = members.filter((m) => m.status === 'Active').length;

  doc.setFillColor(248, 250, 252);
  doc.rect(14, 32, 269, 14, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, 32, 269, 14, 'D');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.text(`Scope: ${filters.unit || 'All Fujairah Units'}`, 18, 38);
  doc.text(`Total Records: ${members.length} Members`, 80, 38);
  doc.text(`Active Members: ${activeCount}`, 145, 38);
  doc.text(`Total Collections: ${formatAED(totalCollections)} (${paidCount} Paid)`, 205, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(
    `Filters: Category: ${filters.membershipType || 'All'} | Type: ${filters.registrationCategory || 'All'} | Status: ${filters.status || 'All'}`,
    18,
    43
  );

  // Table Data Columns
  const tableData = members.map((m, index) => [
    index + 1,
    m.membershipId,
    m.fullName,
    m.unit,
    m.phoneUAE || m.whatsapp || 'N/A',
    m.profession || 'Member',
    m.membershipType.replace(' Member', ''),
    m.registrationCategory,
    formatDate(m.expiryDate),
    formatAED(m.feeAmountAED),
    m.paymentStatus,
  ]);

  autoTable(doc, {
    startY: 49,
    head: [
      [
        '#',
        'Member ID',
        'Full Name',
        'Unit',
        'Contact / WhatsApp',
        'Profession',
        'Category',
        'Reg Type',
        'Expiry Date',
        'Fee (AED)',
        'Payment',
      ],
    ],
    body: tableData,
    headStyles: {
      fillColor: [139, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    theme: 'grid',
  });

  // Footer note on last page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(
      `KCA Fujairah Official Membership Register • Page ${i} of ${pageCount}`,
      148.5,
      202,
      { align: 'center' }
    );
  }

  const cleanUnit = (filters.unit || 'All_Units').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`KCA_Membership_Report_${cleanUnit}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Exports current member records to CSV
 */
export function exportMembersToCsv(members: Member[], filename: string = 'KCA_Fujairah_Members.csv'): void {
  const headers = [
    'Membership ID',
    'Full Name',
    'Malayalam Name',
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
    'Fee (AED)',
    'Payment Status',
    'Receipt Number',
    'Registration Date',
    'Expiry Date',
    'Status',
  ];

  const rows = members.map((m) => [
    `"${m.membershipId}"`,
    `"${m.fullName.replace(/"/g, '""')}"`,
    `"${(m.malayalamName || '').replace(/"/g, '""')}"`,
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
    `"${(m.profession || '').replace(/"/g, '""')}"`,
    `"${m.feeAmountAED || 0}"`,
    `"${m.paymentStatus}"`,
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
