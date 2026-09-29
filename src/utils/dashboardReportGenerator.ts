import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Member } from '../types/member';
import { FinanceTransaction } from '../types/finance';
import { InventoryItem, InventoryMovementLog } from '../types/inventory';
import { CulturalClass, ClassParticipant } from '../types/classes';
import { formatAED, formatDate } from './idGenerator';
import { OFFICIAL_LOCATION } from '../config/constants';
import { getActiveLogoPngDataUrl } from '../components/Logo';

export interface ComprehensiveDashboardReportParams {
  unitFilter: string;
  members: Member[];
  financeTransactions: FinanceTransaction[];
  inventoryItems?: InventoryItem[];
  inventoryLogs?: InventoryMovementLog[];
  classes?: CulturalClass[];
  participants?: ClassParticipant[];
  generatedBy?: string;
  includeInventory?: boolean; // Defaults to false as requested
  includeClasses?: boolean;
}

/**
 * Generates an executive-level Management Dashboard Report in PDF format.
 * Focuses on Finance (Income, Expenses, Net Treasury) and Members (Directory & Active Status).
 * Blood donor details are removed. Inventory can be optionally included if needed.
 */
export async function downloadComprehensiveDashboardPdf({
  unitFilter,
  members,
  financeTransactions,
  inventoryItems = [],
  inventoryLogs = [],
  classes = [],
  participants = [],
  generatedBy = 'Central Committee Executive Board',
  includeInventory = false,
  includeClasses = false,
}: ComprehensiveDashboardReportParams): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryRed = [139, 0, 0];
  const goldAccent = [217, 119, 6];
  const slateDark = [30, 41, 59];
  const slateMuted = [100, 116, 139];

  // Deduplicate records to ensure distinct records and prevent duplicate metrics
  const uniqueMembers = Array.from(new Map(members.map((m) => [m.id, m])).values());
  const uniqueFinance = Array.from(new Map(financeTransactions.map((f) => [f.id, f])).values());
  const uniqueInventory = Array.from(new Map(inventoryItems.map((i) => [i.id, i])).values());

  // 1. Filter data based on unit
  const isCentralFilter = unitFilter.toLowerCase().startsWith('central');
  const targetMembers =
    unitFilter === 'All'
      ? uniqueMembers
      : isCentralFilter
      ? uniqueMembers.filter((m) => m.membershipType === 'Central Committee Member' || m.unit.toLowerCase().startsWith('central'))
      : uniqueMembers.filter((m) => m.membershipType !== 'Central Committee Member' && m.unit.toLowerCase() === unitFilter.toLowerCase());

  const targetFinance =
    unitFilter === 'All'
      ? uniqueFinance
      : isCentralFilter
      ? uniqueFinance.filter((f) => f.unit.toLowerCase().startsWith('central'))
      : uniqueFinance.filter((f) => f.unit.toLowerCase() === unitFilter.toLowerCase());

  const targetInventory =
    unitFilter === 'All'
      ? uniqueInventory
      : isCentralFilter
      ? uniqueInventory.filter((i) => i.unit.toLowerCase().startsWith('central'))
      : uniqueInventory.filter((i) => i.unit.toLowerCase() === unitFilter.toLowerCase());

  // 2. Calculate Key Multi-Module Indicators
  const totalMembers = targetMembers.length;
  const activeMembers = targetMembers.filter((m) => m.status === 'Active').length;
  const expiredMembers = totalMembers - activeMembers;

  const totalIncome = targetFinance
    .filter((f) => f.type === 'INCOME')
    .reduce((sum, f) => sum + (f.amountAED || 0), 0);
  const totalExpense = targetFinance
    .filter((f) => f.type === 'EXPENSE')
    .reduce((sum, f) => sum + (f.amountAED || 0), 0);
  const netBalance = totalIncome - totalExpense;

  const availableAssetQty = targetInventory.reduce((sum, i) => sum + (i.availableQuantity || 0), 0);
  const issuedAssetQty = targetInventory.reduce((sum, i) => sum + (i.issuedQuantity || 0), 0);

  // --- PAGE 1: EXECUTIVE BRIEFING & CORE MATRICES (FINANCE & MEMBERS) ---
  // Header Banner
  doc.setFillColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setFillColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.rect(0, 32, 210, 2, 'F');

  // Logo insertion
  try {
    const logoData = await getActiveLogoPngDataUrl();
    doc.addImage(logoData, 'PNG', 10, 4, 24, 24);
  } catch (e) {
    // fallback
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('KAIRALI CULTURAL ASSOCIATION FUJAIRAH - UAE', 115, 12, { align: 'center' });

  doc.setFontSize(10);
  doc.text('EXECUTIVE MANAGEMENT SUMMARY: FINANCE & MEMBERSHIP', 115, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    `Scope: ${unitFilter === 'All' ? 'All Units Consolidated' : `${unitFilter} Unit`}  •  Date: ${new Date().toLocaleDateString('en-GB')}  •  Compiled by: ${generatedBy}`,
    115,
    25,
    { align: 'center' }
  );

  // Executive KPI Highlight Cards (Finance & Members)
  let yPos = 40;

  if (includeInventory) {
    // 3 Cards layout if inventory requested
    // Box 1: Membership
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(12, yPos, 58, 24, 2, 2, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text('TOTAL MEMBERSHIP', 16, yPos + 6);
    doc.setFontSize(13);
    doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
    doc.text(`${totalMembers}`, 16, yPos + 14);
    doc.setFontSize(7);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(`${activeMembers} Active Cards • ${expiredMembers} Renewals Due`, 16, yPos + 20);

    // Box 2: Finance
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(76, yPos, 60, 24, 2, 2, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text('NET TREASURY SURPLUS (AED)', 80, yPos + 6);
    doc.setFontSize(12);
    doc.setTextColor(netBalance >= 0 ? 16 : 185, netBalance >= 0 ? 120 : 28, netBalance >= 0 ? 60 : 28);
    doc.text(formatAED(netBalance), 80, yPos + 14);
    doc.setFontSize(7);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(`Inc: ${formatAED(totalIncome)} | Exp: ${formatAED(totalExpense)}`, 80, yPos + 20);

    // Box 3: Inventory (Optional)
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(142, yPos, 56, 24, 2, 2, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text('EQUIPMENT & ASSETS', 146, yPos + 6);
    doc.setFontSize(13);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(`${targetInventory.length} Items`, 146, yPos + 14);
    doc.setFontSize(7);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(`${availableAssetQty} In Stock • ${issuedAssetQty} Issued`, 146, yPos + 20);
  } else {
    // 2 Large Prominent Cards: Focus exclusively on Members & Finance
    // Box 1: Membership
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(12, yPos, 90, 25, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text('ASSOCIATION MEMBERSHIP OVERVIEW', 18, yPos + 6);
    doc.setFontSize(14);
    doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
    doc.text(`${totalMembers} Total Members`, 18, yPos + 15);
    doc.setFontSize(7.5);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(`${activeMembers} Active Registered Members  •  ${expiredMembers} Renewals Pending`, 18, yPos + 21);

    // Box 2: Finance Treasury
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(108, yPos, 90, 25, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text('TREASURY & FINANCIAL POSITION (AED)', 114, yPos + 6);
    doc.setFontSize(13);
    doc.setTextColor(netBalance >= 0 ? 16 : 185, netBalance >= 0 ? 120 : 28, netBalance >= 0 ? 60 : 28);
    doc.text(formatAED(netBalance), 114, yPos + 15);
    doc.setFontSize(7.5);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(`Total Income: ${formatAED(totalIncome)}  •  Total Expense: ${formatAED(totalExpense)}`, 114, yPos + 21);
  }

  yPos += 32;

  // --- SECTION 1: MEMBERSHIP MATRIX BY UNIT ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.text('1. MEMBERSHIP & COMMUNITY DIRECTORY SUMMARY', 12, yPos);

  const unitRows = ['Fujairah', 'Kalba', 'Khorfakhan', 'Dibba', 'Central Committee'].map((u) => {
    const isCentral = u.toLowerCase().startsWith('central');
    const uM = isCentral
      ? members.filter((m) => m.membershipType === 'Central Committee Member' || m.unit.toLowerCase().startsWith('central'))
      : members.filter((m) => m.unit === u);
    const uFees = isCentral
      ? members.filter((m) => m.membershipType === 'Central Committee Member' || m.unit.toLowerCase().startsWith('central')).reduce((sum, m) => sum + (m.feeAmountAED || 0), 0)
      : uM.filter((m) => m.membershipType !== 'Central Committee Member').reduce((sum, m) => sum + (m.feeAmountAED || 0), 0);
    const uActive = uM.filter((m) => m.status === 'Active').length;
    return [
      `${u} Unit`,
      uM.length,
      uActive,
      uM.length - uActive,
      formatAED(uFees),
      `${members.length > 0 ? Math.round((uM.length / members.length) * 100) : 0}%`,
    ];
  });

  autoTable(doc, {
    startY: yPos + 3,
    head: [['Unit / Jurisdiction', 'Total Registered', 'Active Cards', 'Renewals Due', 'Total Fees (AED)', 'Community Share']],
    body: unitRows,
    theme: 'grid',
    headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 12, right: 12 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // --- SECTION 2: FINANCE OVERVIEW & RECENT VOUCHERS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.text('2. FINANCIAL LEDGER & RECENT VOUCHERS', 12, yPos);

  const financeRows = targetFinance.slice(0, 8).map((f) => [
    f.receiptNumber,
    formatDate(f.date),
    f.type,
    f.category,
    f.unit,
    f.partyName,
    f.paymentMethod,
    formatAED(f.amountAED),
  ]);

  if (financeRows.length === 0) {
    financeRows.push(['N/A', 'N/A', 'N/A', 'No financial transactions logged for this unit.', 'N/A', 'N/A', 'N/A', 'AED 0']);
  }

  autoTable(doc, {
    startY: yPos + 3,
    head: [['Voucher / Receipt No', 'Date', 'Type', 'Category', 'Unit', 'Party / Beneficiary', 'Method', 'Amount (AED)']],
    body: financeRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 12, right: 12 },
  });

  // --- OPTIONAL SECTION 3: INVENTORY (ONLY IF INCLUDED) ---
  if (includeInventory && targetInventory.length > 0) {
    yPos = (doc as any).lastAutoTable.finalY + 8;
    if (yPos > 230) {
      doc.addPage('a4', 'portrait');
      yPos = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
    doc.text('3. INVENTORY & EQUIPMENT ASSETS (OPTIONAL ADDITION)', 12, yPos);

    const inventoryRows = targetInventory.slice(0, 10).map((item) => [
      item.itemCode,
      item.name,
      item.category,
      item.unit,
      `${item.availableQuantity} / ${item.totalQuantity} ${item.unitOfMeasure}`,
      item.condition,
      item.status,
    ]);

    autoTable(doc, {
      startY: yPos + 3,
      head: [['Asset Code', 'Equipment Name', 'Category', 'Unit', 'Stock Status', 'Condition', 'State']],
      body: inventoryRows,
      theme: 'grid',
      headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 12, right: 12 },
    });
  }

  // Footer & Authorizations
  const finalY = (doc as any).lastAutoTable.finalY + 12;
  if (finalY < 265) {
    doc.setDrawColor(180, 180, 180);
    doc.line(20, finalY + 12, 70, finalY + 12);
    doc.line(140, finalY + 12, 190, finalY + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text('General Secretary', 45, finalY + 17, { align: 'center' });
    doc.text('Treasurer & Auditor', 165, finalY + 17, { align: 'center' });
  }

  // Add Page Numbers
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(
      `KCA Fujairah Executive Summary • Page ${i} of ${totalPages}`,
      105,
      290,
      { align: 'center' }
    );
  }

  const cleanUnit = (unitFilter || 'All_Units').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`KCA_Executive_Summary_${cleanUnit}_${new Date().toISOString().split('T')[0]}.pdf`);
}
