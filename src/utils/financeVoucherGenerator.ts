import jsPDF from 'jspdf';
import { FinanceTransaction } from '../types/finance';
import { formatDate, formatAED } from './idGenerator';
import { getActiveLogoDataUrl } from '../components/Logo';
import { OFFICIAL_EMAIL, PUBLISHED_PORTAL_URL } from '../config/constants';

/**
 * Generates an official payment voucher / income receipt PDF
 * Designed cleanly without Central Committee titles for association signatories
 */
export async function downloadFinanceVoucherPdf(transaction: FinanceTransaction): Promise<void> {
  const isIncome = transaction.type === 'INCOME';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Outer Border Box
  doc.setDrawColor(139, 0, 0); // #8b0000
  doc.setLineWidth(1);
  doc.rect(margin, margin, contentWidth, 267);

  // Inner Border Frame
  doc.setDrawColor(220, 226, 235);
  doc.setLineWidth(0.3);
  doc.rect(margin + 2, margin + 2, contentWidth - 4, 263);

  // Top Header Banner
  doc.setFillColor(139, 0, 0); // #8b0000
  doc.rect(margin + 2, margin + 2, contentWidth - 4, 30, 'F');

  // Load Logo
  try {
    const logoDataUrl = getActiveLogoDataUrl();
    doc.addImage(logoDataUrl, 'PNG', margin + 6, margin + 4, 24, 24);
  } catch (e) {
    console.warn('Voucher PDF Logo error:', e);
  }

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('KAIRALI CULTURAL ASSOCIATION FUJAIRAH', margin + 35, margin + 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('FUJAIRAH', margin + 35, margin + 17);
  doc.text(`Email: ${OFFICIAL_EMAIL}`, margin + 35, margin + 23);

  // Voucher Title Bar
  const titleY = margin + 38;
  if (isIncome) {
    doc.setFillColor(236, 253, 245); // Emerald light
    doc.setDrawColor(16, 185, 129); // Emerald border
  } else {
    doc.setFillColor(255, 241, 242); // Rose light
    doc.setDrawColor(225, 29, 72); // Rose border
  }
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + 4, titleY, contentWidth - 8, 12, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  if (isIncome) {
    doc.setTextColor(6, 95, 70); // #065f46
    doc.text('OFFICIAL INCOME RECEIPT VOUCHER', margin + 8, titleY + 8);
  } else {
    doc.setTextColor(159, 18, 57); // #9f1239
    doc.text('OFFICIAL PAYMENT / EXPENSE VOUCHER', margin + 8, titleY + 8);
  }

  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`VOUCHER NO: ${transaction.receiptNumber}`, margin + contentWidth - 10, titleY + 8, {
    align: 'right',
  });

  // Voucher Meta Grid
  const metaY = titleY + 16;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin + 4, metaY, contentWidth - 8, 22, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);

  // Row 1
  doc.text('Date of Transaction:', margin + 8, metaY + 6);
  doc.text('Association Unit:', margin + 65, metaY + 6);
  doc.text('Payment Mode:', margin + 120, metaY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatDate(transaction.date), margin + 8, metaY + 11);
  const unitDisplay = transaction.unit === 'Central Committee' ? 'Central Committee' : `${transaction.unit} Unit`;
  doc.text(unitDisplay, margin + 65, metaY + 11);
  doc.text(transaction.paymentMethod, margin + 120, metaY + 11);

  // Row 2
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(isIncome ? 'Received From:' : 'Paid To (Beneficiary / Vendor):', margin + 8, metaY + 16);
  doc.text('Status:', margin + 120, metaY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(139, 0, 0);
  doc.text(transaction.partyName, margin + 8, metaY + 20);

  doc.setTextColor(15, 23, 42);
  doc.text(transaction.status, margin + 120, metaY + 20);

  // Main Details Table
  const tableY = metaY + 28;
  doc.setFillColor(139, 0, 0);
  doc.rect(margin + 4, tableY, contentWidth - 8, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SL', margin + 8, tableY + 5.5);
  doc.text('PARTICULARS & DESCRIPTION', margin + 22, tableY + 5.5);
  doc.text('CATEGORY', margin + 105, tableY + 5.5);
  doc.text('AMOUNT (AED)', margin + contentWidth - 10, tableY + 5.5, { align: 'right' });

  // Table Row
  const rowY = tableY + 8;
  const rowHeight = 42;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin + 4, rowY, contentWidth - 8, rowHeight);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('1.', margin + 8, rowY + 8);

  // Multiline particulars
  doc.setFont('helvetica', 'bold');
  const particularsLines = doc.splitTextToSize(transaction.particulars, 78);
  doc.text(particularsLines, margin + 22, rowY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  if (transaction.referenceNumber) {
    doc.text(`Ref / Bill / Cheque No: ${transaction.referenceNumber}`, margin + 22, rowY + 8 + particularsLines.length * 5);
  }
  if (transaction.contactNumber) {
    doc.text(`Contact: ${transaction.contactNumber}`, margin + 22, rowY + 13 + particularsLines.length * 5);
  }

  // Category
  doc.setTextColor(15, 23, 42);
  const catLines = doc.splitTextToSize(transaction.category, 42);
  doc.text(catLines, margin + 105, rowY + 8);

  // Amount
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(139, 0, 0);
  doc.text(formatAED(transaction.amountAED), margin + contentWidth - 10, rowY + 10, { align: 'right' });

  // Total Summary Row
  const totalY = rowY + rowHeight;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + 4, totalY, contentWidth - 8, 12, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL AMOUNT:', margin + 105, totalY + 8);
  doc.setTextColor(139, 0, 0);
  doc.setFontSize(12);
  doc.text(formatAED(transaction.amountAED), margin + contentWidth - 10, totalY + 8, { align: 'right' });

  // In Words Box
  const wordsY = totalY + 16;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin + 4, wordsY, contentWidth - 8, 18, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Amount in words (AED):', margin + 8, wordsY + 5);

  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`AED ${transaction.amountAED.toFixed(2)} Only`, margin + 8, wordsY + 11);

  if (transaction.notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Notes: ${transaction.notes}`, margin + 8, wordsY + 15);
  }

  // Signatures Section: Secretary and Treasurer
  const signY = wordsY + 36;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);

  // Sign Box 1: Secretary
  doc.line(margin + 20, signY, margin + 80, signY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Secretary', margin + 50, signY + 4, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(unitDisplay, margin + 50, signY + 9, { align: 'center' });

  // Sign Box 2: Treasurer
  doc.line(margin + contentWidth - 80, signY, margin + contentWidth - 20, signY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Treasurer', margin + contentWidth - 50, signY + 4, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('KCA Fujairah', margin + contentWidth - 50, signY + 9, { align: 'center' });

  // Bottom Notice
  const footerY = 270;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `This is an official ${isIncome ? 'receipt' : 'payment voucher'} issued by Kairali Cultural Association Fujairah.`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  const sanitizedParty = transaction.partyName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `KCA_${isIncome ? 'RECEIPT' : 'VOUCHER'}_${transaction.receiptNumber}_${sanitizedParty}.pdf`;
  doc.save(filename);
}
