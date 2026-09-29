import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getActiveLogoPngDataUrl } from '../components/Logo';
import { OFFICIAL_ORG_NAME, OFFICIAL_LOCATION } from '../config/constants';

/**
 * Generates an official, comprehensive System Architecture & Logic Manual in PDF format.
 */
export async function downloadSystemDocumentationPdf(generatedBy: string = 'KCA System Administration'): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryRed: [number, number, number] = [136, 19, 55]; // #881337 deep rose/burgundy
  const slateDark: [number, number, number] = [30, 41, 59];
  const slateMuted: [number, number, number] = [100, 116, 139];
  const goldAccent: [number, number, number] = [217, 119, 6];

  let currentY = 15;

  // Add Official Header
  try {
    const logoDataUrl = await getActiveLogoPngDataUrl();
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', 14, currentY, 18, 18);
    }
  } catch (e) {
    console.warn('Logo could not be loaded for documentation PDF', e);
  }

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.text(OFFICIAL_ORG_NAME, 36, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('UNIFIED MANAGEMENT PORTAL — SYSTEM ARCHITECTURE & LOGIC MANUAL', 36, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  doc.text(`Official Reference Manual | Generated: ${dateStr} | Authority: ${generatedBy} | ${OFFICIAL_LOCATION}`, 36, currentY + 16);

  // Divider line
  currentY += 21;
  doc.setDrawColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.setLineWidth(0.8);
  doc.line(14, currentY, pageWidth - 14, currentY);

  currentY += 6;

  // Section 1: Executive Overview
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.text('1. SYSTEM OVERVIEW & ARCHITECTURAL FOUNDATIONS', 14, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  const overviewText = 
    'The Kairali Cultural Association (KCA) Fujairah Management Portal is an enterprise-grade, offline-capable Progressive Web Application ' +
    'engineered for end-to-end community governance, member directory maintenance, bilingual PVC ID card generation, double-entry financial ledgering, ' +
    'cultural academy management, and official bilingual correspondence. All application data is permanently preserved in local PC storage (localStorage) ' +
    'with instant multi-tab BroadcastChannel synchronization, ensuring complete offline autonomy with zero recurring cloud dependencies.';
  
  const splitOverview = doc.splitTextToSize(overviewText, pageWidth - 28);
  doc.text(splitOverview, 14, currentY);
  currentY += splitOverview.length * 4.2 + 4;

  // Section 2: Role-Based Access Control (RBAC) Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.text('2. ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSIONS MATRIX', 14, currentY);
  currentY += 4;

  autoTable(doc, {
    startY: currentY,
    head: [['Role', 'Unit Jurisdiction', 'Financial Scope', 'Membership Directory', 'Inventories & Classes', 'System Administration']],
    body: [
      ['Super Admin', 'Global (All Units + Central)', 'Full Access (All units, ledger, voiding, particulars)', 'Full CRUD, Batch Print, Schema Manager', 'Full management across all units', 'Full Backup/Restore, Accounts, Custom Logos, Themes'],
      ['Admin / Executive', 'Global (All Units + Central)', 'All Income & Expenses, Financial Reports', 'Full CRUD, Member Approvals, ID Issuance', 'View & Issue Items, Manage Classes', 'System Backup, Audit Logs, Custom Fields'],
      ['Desk Auditor', 'Global (Read-Only)', 'Read-Only Ledger, Audit Reconciliation', 'View & Search Member Roster, CSV Export', 'View Inventories, Classes, Attendance', 'View System Audit Logs & Reports'],
      ['Unit Coordinator', 'Scoped (Assigned Unit)', 'Assigned Unit Cash Balance & Local Ledger', 'CRUD within Assigned Unit only', 'Unit Asset Custodianship & Unit Classes', 'Personal/Unit CSV & JSON Backups'],
      ['Unit Data Operator', 'Scoped (Assigned Unit)', 'Assigned Unit Balance & Scoped Receipts', 'Register & Update Assigned Unit Members', 'View Assigned Unit Classes/Assets', 'Unit Member CSV Export'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: primaryRed,
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: slateDark,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 28 },
      1: { cellWidth: 32 },
      2: { cellWidth: 36 },
      3: { cellWidth: 32 },
      4: { cellWidth: 30 },
      5: { cellWidth: 30 },
    },
    margin: { left: 14, right: 14 },
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  currentY = doc.lastAutoTable.finalY + 8;

  // Section 3: Module Workflows & Logic
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.text('3. CORE FUNCTIONAL MODULES & OPERATIONAL WORKFLOWS', 14, currentY);
  currentY += 4;

  autoTable(doc, {
    startY: currentY,
    head: [['Module', 'Key Capabilities', 'Standard Operating Workflow & Security Rules']],
    body: [
      [
        'Membership & ID Engine',
        '• English-to-Malayalam transliteration\n• PVC 300DPI Card Canvas (CR80 standard)\n• Anti-tamper verification QR code\n• Batch multi-card print & ZIP export',
        '1. Operator registers member profile; transliteration engine auto-generates Malayalam name.\n' +
        '2. System assigns unique ID format: KCA-[UNIT]-[YEAR]-[SEQ] (e.g. KCA-FUJ-2026-0042).\n' +
        '3. Passport photo is compressed into local DataURL storage.\n' +
        '4. Front/Back PVC ID cards are rendered with security micro-patterns and scannable QR verification.'
      ],
      [
        'Financial Ledger & Unit Balances',
        '• Hierarchical Particulars Account Tree\n• Unit cash-in-hand liquidity balances\n• Bilingual PDF receipts & vouchers\n• Permanent voiding & audit trail',
        '1. Income receipts and expense payment vouchers are booked under hierarchical account codes.\n' +
        '2. Unit Operators are strictly scoped to view and manage only their assigned unit balance summary.\n' +
        '3. Central Admins access aggregated association liquidity, P&L statements, and net treasury balance.\n' +
        '4. Transactions cannot be deleted without an immutable void log entry.'
      ],
      [
        'Inventory & Asset Custodianship',
        '• Asset categorization & conditions\n• Unit location & custodian assignment\n• Issue & return transaction logging',
        '1. Equipment and cultural props are cataloged with serial numbers and condition statuses.\n' +
        '2. Items checked out to members/volunteers update real-time stock levels.\n' +
        '3. Return logs calculate duration, condition upon receipt, and custodian sign-off.'
      ],
      [
        'Cultural Academy & Classes',
        '• Courses (Malayalam, Dance, Music, Yoga)\n• Student enrollment & age batches\n• Monthly attendance register PDF export',
        '1. Coordinators define batch timings, instructors, and capacity limits.\n' +
        '2. Students are enrolled with parent contacts and registration fees.\n' +
        '3. Attendance sheets are marked per session and exportable as printable registers.'
      ],
      [
        'Official Letter Pad & Documents',
        '• Auto-incrementing Reference Numbers\n• Bilingual official templates\n• Official seal, stamps, and signatures',
        '1. Letter generation uses strict series sequence: KCA/[UNIT]/[YEAR]/[SERIES_NO].\n' +
        '2. Presets include Appointments, Sponsorships, Ministry/Embassy representations, and Notices.\n' +
        '3. Document Vault archives meeting minutes, circulars, and executive resolutions.'
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.2,
      textColor: slateDark,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 38 },
      1: { cellWidth: 54 },
      2: { cellWidth: 96 },
    },
    margin: { left: 14, right: 14 },
  });

  // New Page for Data Storage & Recovery Architecture
  doc.addPage();
  currentY = 15;

  // Header on Page 2
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.text('4. DATABASE PERSISTENCE, STORAGE KEYS & BACKUP ARCHITECTURE', 14, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  const storageIntro = 
    'The portal operates on a partitioned local key-value schema. Full system backup archives contain all 18 database partitions ' +
    'in a single structured JSON snapshot. Restoring a snapshot performs atomic multi-table replacement and dispatches ' +
    'system-wide synchronization events to refresh all open client windows without data loss.';
  
  const splitStorageIntro = doc.splitTextToSize(storageIntro, pageWidth - 28);
  doc.text(splitStorageIntro, 14, currentY);
  currentY += splitStorageIntro.length * 4.2 + 4;

  autoTable(doc, {
    startY: currentY,
    head: [['Database Table Key', 'Storage Scope', 'Description & Entity Fields']],
    body: [
      ['kca_fujairah_members_v2', 'Membership Database', 'Member ID, English/Malayalam names, unit, blood group, mobile, status, photo DataURL, custom fields.'],
      ['kca_fujairah_finance_transactions_v1', 'Financial Ledger', 'Voucher ID, transaction type (INCOME/EXPENSE), particular account, amount (AED), payment method, date, unit, receipt.'],
      ['kca_fujairah_finance_particulars_v1', 'Chart of Accounts', 'Hierarchical account codes, category titles, income/expense classifications, parent-child nodes.'],
      ['kca_fujairah_finance_unit_balances_v1', 'Unit Balances', 'Cash-in-hand, bank balances, opening balances, and audit timestamps per association unit.'],
      ['kca_fujairah_inventory_items_v1', 'Inventory Items', 'Item code, name, category, total quantity, available quantity, unit location, condition status.'],
      ['kca_fujairah_inventory_logs_v1', 'Asset Logs', 'Checkout/Return movement history, member badge ID, borrower contact, return condition.'],
      ['kca_cultural_classes_v1', 'Class Schedules', 'Course name, instructor, batch schedules, fees, classroom venue.'],
      ['kca_class_participants_v1', 'Enrolled Students', 'Student name, parent contact, enrolled class ID, enrollment date, fee status.'],
      ['kca_class_attendance_v1', 'Attendance Sheets', 'Date-wise present/absent logs, session topics, instructor signatures.'],
      ['kca_fujairah_letters_v1', 'Letter Pad Records', 'Official reference number, recipient, subject, body HTML, signatory designation, issue date.'],
      ['kca_letter_series_config_v1', 'Letter Series', 'Annual sequence counter and unit reference code map.'],
      ['kca_fujairah_general_documents_v1', 'Document Vault', 'Meeting minutes, regulatory permits, circulars, upload timestamps, file attachments.'],
      ['kca_fujairah_contact_bank_v1', 'Directory Bank', 'Community directory, emergency services, diplomatic contacts, UAE hotline numbers.'],
      ['kca_fujairah_units_v1', 'Units & Committees', 'Association unit names, executive coordinators, office bearers, meeting locations.'],
      ['kca_fujairah_signatures_v1', 'Digital Signatures', 'President, General Secretary, and Treasurer authorized signature images & stamps.'],
      ['kca_fujairah_admin_accounts_v2', 'User Security', 'Login usernames, password hashes, assigned roles, unit jurisdiction constraints.'],
      ['kca_fujairah_custom_fields_v2', 'Schema Extensions', 'Dynamic field definitions, data types (text, date, select), and visibility rules.'],
      ['kca_fujairah_audit_logs_v2', 'Audit Trail', 'Immutable logs of all record creations, edits, deletions, imports, and logins.'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: primaryRed,
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 6.8,
      textColor: slateDark,
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55 },
      1: { cellWidth: 35 },
      2: { cellWidth: 98 },
    },
    margin: { left: 14, right: 14 },
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  currentY = doc.lastAutoTable.finalY + 8;

  // Section 5: Standard Operating Procedures
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.text('5. STANDARD OPERATING PROCEDURES & DATA SECURITY CHECKLIST', 14, currentY);
  currentY += 4;

  const sopPoints = [
    '• Daily Backup Protocol: Super Admins and Unit Coordinators should download a JSON snapshot at the close of every session.',
    '• Offline Readiness: The portal is fully pre-cached; operators can bookmark the URL and perform full record-keeping with zero internet connectivity.',
    '• ID Issuance Integrity: All generated cards must verify successfully against the built-in QR scanner modal before PVC physical printing.',
    '• Financial Audit Closure: At month-end, Unit Coordinators must reconcile cash-in-hand against the system ledger and submit signed reports.'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  sopPoints.forEach((point) => {
    doc.text(point, 14, currentY);
    currentY += 4.2;
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(`${OFFICIAL_ORG_NAME} — System Architecture & Workflow Manual`, 14, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }

  // Save the document
  const fileName = `KCA_Fujairah_System_Architecture_Manual_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

