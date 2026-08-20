import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FinanceTransaction } from '../types/finance';
import { formatAED, formatDate } from './idGenerator';
import { PUBLISHED_PORTAL_URL, OFFICIAL_ORG_NAME, OFFICIAL_EMAIL } from '../config/constants';
import { getActiveLogoDataUrl } from '../components/Logo';

/**
 * Generates and downloads an authentic, official PDF Financial Receipt / Payment Voucher
 * Strict specifications:
 * - Kairali Cultural Association Header
 * - Which unit transaction is clearly specified and reflected
 * - Full manual particulars and transaction details
 * - Receipt / Voucher Number
 * - Signatures: Secretary and Treasurer only (No mention of central committee)
 */
export async function downloadFinanceReceiptPdf(transaction: FinanceTransaction): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isIncome = transaction.type === 'INCOME';
  const primaryRed = [139, 0, 0]; // #8b0000
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
    console.warn('Could not draw logo in financial receipt:', logoErr);
  }

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('KAIRALI CULTURAL ASSOCIATION FUJAIRAH', 114, 14, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('FUJAIRAH, UNITED ARAB EMIRATES', 114, 20, { align: 'center' });

  doc.setFontSize(8.5);
  doc.text(`Email: ${OFFICIAL_EMAIL}  |  Portal: ${PUBLISHED_PORTAL_URL}`, 114, 26, { align: 'center' });

  // Official Receipt Title Ribbon
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 45, 180, 22, 2, 2, 'FD');
  doc.setDrawColor(226, 232, 240);

  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(isIncome ? 'OFFICIAL INCOME RECEIPT (AED)' : 'OFFICIAL PAYMENT VOUCHER (AED)', 22, 53);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`RECEIPT NO: ${transaction.receiptNumber}`, 22, 61);

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date of Issue: ${formatDate(transaction.date)}`, 135, 53);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isIncome ? 16 : 225, isIncome ? 185 : 29, isIncome ? 129 : 72);
  doc.text(`Unit: ${transaction.unit} Unit`, 135, 61);

  // Transaction Overview Details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.text('TRANSACTION DETAILS', 15, 76);

  const txDetails = [
    [
      { content: isIncome ? 'Received From:' : 'Paid To:', styles: { fontStyle: 'bold', textColor: slateMuted } },
      { content: transaction.partyName || 'N/A', styles: { fontStyle: 'bold', textColor: slateDark } },
      { content: 'Assigned Unit:', styles: { fontStyle: 'bold', textColor: slateMuted } },
      { content: `${transaction.unit} Unit`, styles: { fontStyle: 'bold', textColor: primaryRed } },
    ],
    [
      { content: 'Category:', styles: { fontStyle: 'bold', textColor: slateMuted } },
      { content: transaction.category, styles: { textColor: slateDark } },
      { content: 'Payment Mode:', styles: { fontStyle: 'bold', textColor: slateMuted } },
      { content: transaction.paymentMethod, styles: { fontStyle: 'bold', textColor: slateDark } },
    ],
    [
      { content: 'Contact Number:', styles: { fontStyle: 'bold', textColor: slateMuted } },
      { content: transaction.contactNumber || 'N/A', styles: { textColor: slateDark } },
      { content: 'Reference / Bill No:', styles: { fontStyle: 'bold', textColor: slateMuted } },
      { content: transaction.referenceNumber || 'N/A', styles: { textColor: slateDark } },
    ],
  ];

  autoTable(doc, {
    startY: 79,
    body: txDetails as any,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 2.2 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 50 },
      2: { cellWidth: 45 },
      3: { cellWidth: 45 },
    },
  });

  // Financial Table with Particulars description
  const tableStartY = (doc as any).lastAutoTable.finalY + 6;

  autoTable(doc, {
    startY: tableStartY,
    head: [['Particulars / Description', 'Unit', 'Payment Method', 'Amount (AED)']],
    body: [
      [
        transaction.particulars || transaction.category,
        `${transaction.unit} Unit`,
        transaction.paymentMethod,
        formatAED(transaction.amountAED),
      ],
    ],
    foot: [
      [
        isIncome ? 'TOTAL AMOUNT RECEIVED' : 'TOTAL AMOUNT PAID',
        '',
        '',
        formatAED(transaction.amountAED),
      ],
    ],
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
    styles: { fontSize: 8.5, cellPadding: 4.5 },
    theme: 'grid',
  });

  const postTableY = (doc as any).lastAutoTable.finalY + 8;

  // Notes or remarks if available
  if (transaction.notes && transaction.notes.trim()) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text('Remarks / Notes:', 15, postTableY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(transaction.notes.trim(), 45, postTableY + 4);
  }

  // Signatures: Strictly Secretary and Treasurer (Do not mention central committee)
  const sigY = postTableY + 28;
  doc.setDrawColor(180, 180, 180);
  doc.line(25, sigY + 12, 75, sigY + 12);
  doc.line(135, sigY + 12, 185, sigY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('Secretary', 50, sigY + 18, { align: 'center' });
  doc.text('Treasurer', 160, sigY + 18, { align: 'center' });

  // Bottom Notice
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(
    `Official financial document issued by Kairali Cultural Association Fujairah • ${transaction.unit} Unit`,
    105,
    280,
    { align: 'center' }
  );

  const cleanNo = transaction.receiptNumber.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`KCA_Finance_${cleanNo}_${transaction.unit}.pdf`);
}
