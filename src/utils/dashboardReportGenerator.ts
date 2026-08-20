import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Member } from '../types/member';
import { FinanceTransaction } from '../types/finance';
import { InventoryItem, InventoryMovementLog } from '../types/inventory';
import { CulturalClass, ClassParticipant } from '../types/classes';
import { formatAED, formatDate } from './idGenerator';
import { PUBLISHED_PORTAL_URL } from '../config/constants';
import { getActiveLogoDataUrl } from '../components/Logo';

export interface ComprehensiveDashboardReportParams {
  unitFilter: string;
  members: Member[];
  financeTransactions: FinanceTransaction[];
  inventoryItems: InventoryItem[];
  inventoryLogs?: InventoryMovementLog[];
  classes?: CulturalClass[];
  participants?: ClassParticipant[];
  generatedBy?: string;
}

/**
 * Generates an executive-level Comprehensive Management Dashboard Report in PDF format.
 * Covers Membership metrics, Finance Ledger & Vouchers, Asset Inventory status, and Cultural Classes & Student Registries.
 * (Note: Blood bank details are explicitly omitted as per executive reporting requirements).
 */
export function downloadComprehensiveDashboardPdf({
  unitFilter,
  members,
  financeTransactions,
  inventoryItems,
  inventoryLogs = [],
  classes = [],
  participants = [],
  generatedBy = 'Central Committee Executive Board',
}: ComprehensiveDashboardReportParams): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryRed = [139, 0, 0];
  const goldAccent = [217, 119, 6];
  const slateDark = [30, 41, 59];
  const slateMuted = [100, 116, 139];

  // 1. Filter data based on unit
  const isCentralFilter = unitFilter.toLowerCase().startsWith('central');
  const targetMembers =
    unitFilter === 'All'
      ? members
      : isCentralFilter
      ? members.filter((m) => m.membershipType === 'Central Committee Member' || m.unit.toLowerCase().startsWith('central'))
      : members.filter((m) => m.unit.toLowerCase() === unitFilter.toLowerCase());

  const targetFinance =
    unitFilter === 'All'
      ? financeTransactions
      : isCentralFilter
      ? financeTransactions.filter((f) => f.unit.toLowerCase().startsWith('central'))
      : financeTransactions.filter((f) => f.unit.toLowerCase() === unitFilter.toLowerCase());

  const targetInventory =
    unitFilter === 'All'
      ? inventoryItems
      : isCentralFilter
      ? inventoryItems.filter((i) => i.unit.toLowerCase().startsWith('central'))
      : inventoryItems.filter((i) => i.unit.toLowerCase() === unitFilter.toLowerCase());

  const targetClasses =
    unitFilter === 'All'
      ? classes
      : classes.filter((c) => c.unit.toLowerCase() === unitFilter.toLowerCase());

  const targetParticipants =
    unitFilter === 'All'
      ? participants
      : participants.filter((p) => p.unit.toLowerCase() === unitFilter.toLowerCase());

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

  const activeClassesCount = targetClasses.filter((c) => c.status === 'Active').length;
  const activeStudentsCount = targetParticipants.filter((p) => p.status === 'Active').length;

  // --- PAGE 1: EXECUTIVE BRIEFING & CORE MATRICES ---
  // Header Banner
  doc.setFillColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setFillColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.rect(0, 32, 210, 2, 'F');

  // Logo insertion
  try {
    const logoData = getActiveLogoDataUrl();
    doc.addImage(logoData, 'PNG', 10, 4, 24, 24);
  } catch (e) {
    // fallback
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('KAIRALI CULTURAL ASSOCIATION FUJAIRAH - UAE', 115, 12, { align: 'center' });

  doc.setFontSize(10);
  doc.text('CONSOLIDATED EXECUTIVE MANAGEMENT REPORT', 115, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    `Scope: ${unitFilter === 'All' ? 'All Units Consolidated' : `${unitFilter} Unit`}  •  Date: ${new Date().toLocaleDateString('en-GB')}  •  Compiled by: ${generatedBy}`,
    115,
    25,
    { align: 'center' }
  );

  // 4 Executive KPI Highlight Cards
  let yPos = 40;

  // Box 1: Membership
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(12, yPos, 43, 24, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('TOTAL MEMBERS', 16, yPos + 6);
  doc.setFontSize(13);
  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.text(`${totalMembers}`, 16, yPos + 14);
  doc.setFontSize(7);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`${activeMembers} Active • ${expiredMembers} Expired`, 16, yPos + 20);

  // Box 2: Finance
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(59, yPos, 43, 24, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('NET CASH POSITION', 63, yPos + 6);
  doc.setFontSize(11.5);
  doc.setTextColor(netBalance >= 0 ? 16 : 185, netBalance >= 0 ? 120 : 28, netBalance >= 0 ? 60 : 28);
  doc.text(formatAED(netBalance), 63, yPos + 14);
  doc.setFontSize(7);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`Inc: ${formatAED(totalIncome)} | Exp: ${formatAED(totalExpense)}`, 63, yPos + 20);

  // Box 3: Inventory
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(106, yPos, 43, 24, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('EQUIPMENT ASSETS', 110, yPos + 6);
  doc.setFontSize(13);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`${targetInventory.length} Items`, 110, yPos + 14);
  doc.setFontSize(7);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`${availableAssetQty} in Stock • ${issuedAssetQty} Issued`, 110, yPos + 20);

  // Box 4: Cultural Classes & Students
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(153, yPos, 45, 24, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('CLASSES & STUDENTS', 157, yPos + 6);
  doc.setFontSize(13);
  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.text(`${targetParticipants.length} Students`, 157, yPos + 14);
  doc.setFontSize(7);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`${activeClassesCount} Classes • ${activeStudentsCount} Active`, 157, yPos + 20);

  yPos += 30;

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
    head: [['Unit / Region', 'Total Registered', 'Active Cards', 'Renewals Due', 'Total Fees (AED)', 'Community Share']],
    body: unitRows,
    theme: 'grid',
    headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 12, right: 12 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // --- SECTION 2: FINANCE OVERVIEW & RECENT VOUCHERS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.text('2. FINANCIAL LEDGER & VOUCHER OVERVIEW', 12, yPos);

  const financeRows = targetFinance.slice(0, 5).map((f) => [
    f.receiptNumber,
    formatDate(f.date),
    f.type,
    f.category,
    f.unit,
    f.partyName,
    formatAED(f.amountAED),
  ]);

  if (financeRows.length === 0) {
    financeRows.push(['N/A', 'N/A', 'N/A', 'No financial transactions logged for this unit.', 'N/A', 'N/A', 'AED 0']);
  }

  autoTable(doc, {
    startY: yPos + 3,
    head: [['Voucher / Receipt No', 'Date', 'Type', 'Category', 'Unit', 'Party / Beneficiary', 'Amount (AED)']],
    body: financeRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 12, right: 12 },
  });

  // --- PAGE 2: INVENTORY ASSETS & CULTURAL CLASSES ---
  doc.addPage('a4', 'portrait');

  // Header Banner for Page 2
  doc.setFillColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.rect(0, 0, 210, 18, 'F');
  doc.setFillColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.rect(0, 18, 210, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('KAIRALI CULTURAL ASSOCIATION FUJAIRAH - ASSETS & CULTURAL ACADEMIES', 105, 11, { align: 'center' });

  yPos = 26;

  // --- SECTION 3: INVENTORY ASSET AUDIT ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.text('3. INVENTORY & EQUIPMENT ASSET MANAGEMENT', 12, yPos);

  const inventoryRows = targetInventory.slice(0, 6).map((item) => [
    item.itemCode,
    item.name,
    item.category,
    item.unit,
    `${item.availableQuantity} / ${item.totalQuantity} ${item.unitOfMeasure}`,
    item.condition,
    item.status,
  ]);

  if (inventoryRows.length === 0) {
    inventoryRows.push(['N/A', 'No assets currently recorded in this unit scope.', 'N/A', 'N/A', '0', 'N/A', 'N/A']);
  }

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

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // --- SECTION 4: UNIT CULTURAL CLASSES & STUDENT PARTICIPANTS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.text('4. UNIT CULTURAL CLASSES, TRAINING PROGRAMMES & PARTICIPANTS', 12, yPos);

  const participantRows = targetParticipants.slice(0, 8).map((p) => [
    p.studentId,
    p.fullName,
    p.className,
    p.unit,
    p.guardianPhone || 'N/A',
    formatAED(p.feeAmountAED),
    p.feeStatus,
    p.status,
  ]);

  if (participantRows.length === 0) {
    participantRows.push(['N/A', 'No students enrolled yet for this unit.', 'N/A', 'N/A', 'N/A', 'AED 0', 'N/A', 'N/A']);
  }

  autoTable(doc, {
    startY: yPos + 3,
    head: [['Student ID', 'Student Name', 'Course / Class', 'Unit', 'Parent Phone', 'Fee (AED)', 'Fee Status', 'State']],
    body: participantRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 12, right: 12 },
  });

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
      `KCA Fujairah Official Executive Dashboard Report • Page ${i} of ${totalPages} • Portal: ${PUBLISHED_PORTAL_URL}`,
      105,
      290,
      { align: 'center' }
    );
  }

  const cleanUnit = (unitFilter || 'All_Units').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`KCA_Executive_Report_${cleanUnit}_${new Date().toISOString().split('T')[0]}.pdf`);
}
