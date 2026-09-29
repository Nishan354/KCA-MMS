import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FinanceTransaction } from '../types/finance';
import { OFFICIAL_ORG_NAME, OFFICIAL_AFFILIATION, OFFICIAL_LOCATION } from '../config/constants';
import { formatAED, formatDate } from './idGenerator';
import { getActiveLogoPngDataUrl } from '../components/Logo';

export interface FinanceReportFilter {
  unit: string;
  type: 'ALL' | 'INCOME' | 'EXPENSE';
  startDate?: string;
  endDate?: string;
  category?: string;
}

export async function generateFinanceReportPdf(
  transactions: FinanceTransaction[],
  filter: FinanceReportFilter,
  generatedBy: string = 'Authorized Finance Desk'
): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;

  // Deduplicate transactions by unique ID
  const uniqueTransactions = Array.from(new Map(transactions.map((t) => [t.id, t])).values());

  // Filter transactions
  const filtered = uniqueTransactions.filter((t) => {
    if (filter.unit !== 'ALL') {
      const isCentral = filter.unit.toLowerCase().startsWith('central');
      if (isCentral) {
        if (!t.unit.toLowerCase().startsWith('central')) return false;
      } else if (t.unit.toLowerCase() !== filter.unit.toLowerCase()) {
        return false;
      }
    }
    if (filter.type !== 'ALL' && t.type !== filter.type) return false;
    if (filter.category && filter.category !== 'ALL' && t.category !== filter.category) return false;
    if (filter.startDate && t.date < filter.startDate) return false;
    if (filter.endDate && t.date > filter.endDate) return false;
    return true;
  });

  const totalIncome = filtered.filter((t) => t.type === 'INCOME').reduce((s, t) => s + (t.amountAED || 0), 0);
  const totalExpense = filtered.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + (t.amountAED || 0), 0);
  const netBalance = totalIncome - totalExpense;

  // Header Box
  doc.setFillColor(136, 19, 55); // Burgundy
  doc.rect(0, 0, pageWidth, 34, 'F');

  // Draw Logo in Header
  try {
    const logoPngUrl = await getActiveLogoPngDataUrl();
    doc.addImage(logoPngUrl, 'PNG', 12, 4.5, 25, 25);
  } catch (e) {
    console.warn('Finance Report Logo Error:', e);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('KAIRALI CULTURAL ASSOCIATION FUJAIRAH', pageWidth / 2 + 10, 12, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(253, 230, 138); // Gold
  doc.text('A NORKA Affiliated Association', pageWidth / 2 + 10, 17, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `OFFICIAL FINANCIAL AUDIT REPORT & TREASURY STATEMENT | ${OFFICIAL_LOCATION}`,
    pageWidth / 2 + 10,
    23,
    { align: 'center' }
  );

  const scopeUnitText = filter.unit === 'ALL' ? 'All Units & Central Committee' : `${filter.unit} Unit`;
  const dateRangeText =
    filter.startDate && filter.endDate
      ? `${formatDate(filter.startDate)} to ${formatDate(filter.endDate)}`
      : 'Complete Historical Ledger';

  doc.setFontSize(7.5);
  doc.setTextColor(241, 245, 249);
  doc.text(`Scope: ${scopeUnitText}  |  Period: ${dateRangeText}`, pageWidth / 2 + 10, 29, {
    align: 'center',
  });

  // Report Meta info
  let currentY = 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, currentY);
  doc.text(`Audited Ledger Entries: ${filtered.length}`, pageWidth - 14, currentY, { align: 'right' });

  currentY += 6;

  // Executive Summary KPI Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'FD');

  // Total Income Column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL REVENUE / INCOME', 24, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(5, 150, 105); // Green
  doc.text(`AED ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 24, currentY + 16);

  // Total Expense Column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL EXPENDITURE', 85, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(225, 29, 72); // Rose
  doc.text(`AED ${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 85, currentY + 16);

  // Net Balance Column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('NET TREASURY BALANCE', 145, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(netBalance >= 0 ? 5 : 225, netBalance >= 0 ? 150 : 29, netBalance >= 0 ? 105 : 72);
  doc.text(
    `AED ${netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${netBalance >= 0 ? '(Surplus)' : '(Deficit)'}`,
    145,
    currentY + 16
  );

  currentY += 28;

  // Table of Transactions
  const tableData = filtered.map((t) => [
    t.receiptNumber || '—',
    formatDate(t.date),
    t.type,
    t.unit,
    t.particulars || t.category,
    t.partyName || '—',
    t.paymentMethod || 'Cash',
    t.type === 'INCOME'
      ? `+${formatAED(t.amountAED)}`
      : `-${formatAED(t.amountAED)}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Voucher #', 'Date', 'Type', 'Unit', 'Particulars', 'Party / Vendor', 'Mode', 'Amount (AED)']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      font: 'helvetica',
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [136, 19, 55],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { font: 'courier', fontStyle: 'bold', cellWidth: 26 },
      1: { cellWidth: 20 },
      2: { cellWidth: 16, fontStyle: 'bold' },
      3: { cellWidth: 18 },
      4: { cellWidth: 44 },
      5: { cellWidth: 26 },
      6: { cellWidth: 16 },
      7: { halign: 'right', fontStyle: 'bold', cellWidth: 24 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        if (data.cell.raw === 'INCOME') {
          data.cell.styles.textColor = [5, 150, 105];
        } else {
          data.cell.styles.textColor = [225, 29, 72];
        }
      }
      if (data.section === 'body' && data.column.index === 7) {
        const str = String(data.cell.raw || '');
        if (str.startsWith('+')) {
          data.cell.styles.textColor = [5, 150, 105];
        } else {
          data.cell.styles.textColor = [225, 29, 72];
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Footer Signatures
  const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 18 : 240;
  const signY = finalY > pageHeight - 35 ? (doc.addPage(), 40) : finalY;

  const unitTitle = filter.unit === 'ALL' || filter.unit.toLowerCase().startsWith('central')
    ? 'Central Committee'
    : `${filter.unit} Unit`;

  // Left Signature: Secretary
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(20, signY, 80, signY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`${unitTitle} Secretary`, 50, signY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Verification', 50, signY + 9, { align: 'center' });

  // Right Signature: Treasurer
  doc.line(pageWidth - 80, signY, pageWidth - 20, signY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`${unitTitle} Treasurer`, pageWidth - 50, signY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Treasury Sign-off', pageWidth - 50, signY + 9, { align: 'center' });

  // Footer text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Official Financial Audit Document • Kairali Cultural Association Fujairah • ${OFFICIAL_AFFILIATION}`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  return doc;
}
