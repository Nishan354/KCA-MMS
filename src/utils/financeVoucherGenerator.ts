import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { FinanceTransaction } from '../types/finance';
import { Member } from '../types/member';
import { formatDate, formatAED } from './idGenerator';
import { getActiveLogoPngDataUrl } from '../components/Logo';
import { OFFICIAL_AFFILIATION } from '../config/constants';

/**
 * Converts a numerical AED amount to standard English words
 */
export function amountToWordsAED(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Zero Dirhams Only';
  const units = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertChunk(n: number): string {
    if (n === 0) return '';
    if (n < 20) return units[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '') + ' ';
    return units[Math.floor(n / 100)] + ' Hundred ' + (n % 100 !== 0 ? convertChunk(n % 100) : '');
  }

  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);

  let words = '';
  if (integerPart >= 1000000) {
    words += convertChunk(Math.floor(integerPart / 1000000)) + 'Million ';
  }
  if (integerPart % 1000000 >= 1000) {
    words += convertChunk(Math.floor((integerPart % 1000000) / 1000)) + 'Thousand ';
  }
  if (integerPart % 1000 > 0 || words === '') {
    words += convertChunk(integerPart % 1000);
  }

  words = words.trim() + ' Dirhams';
  if (decimalPart > 0) {
    words += ' and ' + convertChunk(decimalPart).trim() + ' Fils';
  }
  return words + ' Only';
}

/**
 * Converts a Member object into a standard FinanceTransaction for uniform receipt generation
 */
export function memberToFinanceTransaction(member: Member): FinanceTransaction {
  const isRenewal =
    member.registrationCategory === 'Renewal' ||
    (member.paymentHistory && member.paymentHistory.some((p) => p.purpose === 'Renewal Fee')) ||
    (!!member.lastRenewalDate && member.lastRenewalDate !== member.registrationDate);

  const category = isRenewal ? 'Renewal Membership Fee' : 'New Membership Fee';
  const particulars = isRenewal
    ? `Annual Membership Renewal Fee - ID: ${member.membershipId} (${member.fullName})\nValidity Period: Up to ${formatDate(member.expiryDate)}`
    : `Annual Membership Registration Fee - ID: ${member.membershipId} (${member.fullName})\nValidity Period: Up to ${formatDate(member.expiryDate)}`;

  const unit =
    member.unit === 'Central' || member.unit === 'Central Committee'
      ? 'Central Committee'
      : member.unit;

  return {
    id: `tx_${member.id}`,
    receiptNumber: member.receiptNumber || `REC-${member.membershipId}`,
    date: member.lastRenewalDate || member.registrationDate,
    type: 'INCOME',
    category,
    amountAED: member.feeAmountAED,
    unit,
    partyName: member.fullName,
    contactNumber: member.phoneUAE || member.whatsapp || '',
    paymentMethod: (member.paymentMethod as any) || 'Cash',
    particulars,
    referenceNumber: member.membershipId,
    status: (member.paymentStatus as any) || 'Completed',
    notes: `Membership ID: ${member.membershipId} • Valid Thru: ${formatDate(member.expiryDate)}`,
    createdAt: member.registrationDate || new Date().toISOString(),
  };
}

/**
 * Generates an official payment voucher / income receipt PDF
 * Designed cleanly with unit-specific signatories (Secretary & Treasurer)
 */
export async function downloadFinanceVoucherPdf(transaction: FinanceTransaction): Promise<void> {
  const isIncome = transaction.type === 'INCOME';
  const isInvoice = !!transaction.isInvoice;
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

  // Load Logo (PNG Data URL guaranteed)
  try {
    const logoPngUrl = await getActiveLogoPngDataUrl();
    doc.addImage(logoPngUrl, 'PNG', margin + 6, margin + 3.5, 23, 23);
  } catch (e) {
    console.warn('Voucher PDF Logo error:', e);
  }

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('KAIRALI CULTURAL ASSOCIATION FUJAIRAH', margin + 35, margin + 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`FUJAIRAH • UAE  |  Email: kairalicaf@gmail.com`, margin + 35, margin + 17);
  doc.text(OFFICIAL_AFFILIATION, margin + 35, margin + 23);

  // Voucher Title Bar
  const titleY = margin + 38;
  if (isInvoice) {
    doc.setFillColor(254, 243, 199); // Amber light
    doc.setDrawColor(245, 158, 11); // Amber border
  } else if (isIncome) {
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
  if (isInvoice) {
    doc.setTextColor(146, 64, 14); // #92400e
    doc.text('INVOICE', margin + 8, titleY + 8);
  } else if (isIncome) {
    doc.setTextColor(6, 95, 70); // #065f46
    doc.text('OFFICIAL INCOME RECEIPT VOUCHER', margin + 8, titleY + 8);
  } else {
    doc.setTextColor(159, 18, 57); // #9f1239
    doc.text('OFFICIAL PAYMENT / EXPENSE VOUCHER', margin + 8, titleY + 8);
  }

  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `${isInvoice ? 'INVOICE NO' : 'DOC NO'}: ${transaction.receiptNumber}`,
    margin + contentWidth - 10,
    titleY + 8,
    {
      align: 'right',
    }
  );

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
  const unitDisplay =
    transaction.unit === 'Central Committee' || transaction.unit === 'Central'
      ? 'Central Committee'
      : `${transaction.unit} Unit`;
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
  let subTextOffset = rowY + 8 + particularsLines.length * 5;
  if (transaction.referenceNumber) {
    doc.text(`Ref / Member ID: ${transaction.referenceNumber}`, margin + 22, subTextOffset);
    subTextOffset += 4.5;
  }
  if (transaction.contactNumber) {
    doc.text(`Contact: ${transaction.contactNumber}`, margin + 22, subTextOffset);
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
  const wordsText = `${amountToWordsAED(transaction.amountAED)} (AED ${transaction.amountAED.toFixed(2)})`;
  doc.text(wordsText, margin + 8, wordsY + 11);

  if (transaction.notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const shortNotes = transaction.notes.length > 90 ? transaction.notes.substring(0, 90) + '...' : transaction.notes;
    doc.text(`Notes: ${shortNotes}`, margin + 8, wordsY + 15.5);
  }

  // QR Code for authenticity verification
  try {
    const qrString = `KCA OFFICIAL ${isIncome ? 'RECEIPT' : 'VOUCHER'}\nDoc: ${transaction.receiptNumber}\nDate: ${formatDate(transaction.date)}\nParty: ${transaction.partyName}\nAmount: AED ${transaction.amountAED}\nUnit: ${unitDisplay}\nContact: kairalicaf@gmail.com`;
    const qrDataUrl = await QRCode.toDataURL(qrString, {
      margin: 1,
      width: 100,
      color: { dark: '#1e293b', light: '#ffffff' },
    });
    doc.addImage(qrDataUrl, 'PNG', margin + contentWidth - 28, wordsY + 20, 22, 22);
  } catch (qrErr) {
    console.warn('QR code generation error in voucher:', qrErr);
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
  doc.text(unitDisplay, margin + contentWidth - 50, signY + 9, { align: 'center' });

  // Bottom Notice
  const footerY = 270;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Official financial document issued by Kairali Cultural Association Fujairah • Email: kairalicaf@gmail.com`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  const sanitizedParty = transaction.partyName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `KCA_${isIncome ? 'RECEIPT' : 'VOUCHER'}_${transaction.receiptNumber}_${sanitizedParty}.pdf`;
  doc.save(filename);
}
