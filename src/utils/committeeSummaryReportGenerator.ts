import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Member } from '../types/member';
import { StudentWingMember } from '../types/studentsWing';
import {
  getExpiryStatus,
  formatAED,
  isMemberEffectivelyActive,
  getEffectiveMemberStatus,
} from './idGenerator';
import { OFFICIAL_LOCATION } from '../config/constants';
import { getActiveLogoPngDataUrl } from '../components/Logo';

export interface CommitteeSummaryReportParams {
  unitFilter: string;
  members: Member[];
  studentsWingMembers: StudentWingMember[];
  units: string[];
  generatedBy?: string;
}

/**
 * Generates an official Members Summary Report for:
 * All Members, Ladies Wing & Children's Wing.
 */
export async function downloadCommitteeSummaryPdf({
  unitFilter,
  members,
  studentsWingMembers,
  units,
  generatedBy = 'KCA Executive Administration',
}: CommitteeSummaryReportParams): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const primaryMaroon = [136, 19, 55]; // #881337
  const goldAccent = [217, 119, 6]; // #d97706
  const slateDark = [30, 41, 59];
  const slateMuted = [100, 116, 139];

  // 1. Filter dataset by Unit Scope
  const isCentralFilter = unitFilter.toLowerCase().startsWith('central');
  const filteredMembers =
    unitFilter === 'All'
      ? members
      : isCentralFilter
      ? members.filter(
          (m) =>
            m.membershipType === 'Central Committee Member' ||
            m.unit.toLowerCase().startsWith('central')
        )
      : members.filter((m) => m.unit.toLowerCase() === unitFilter.toLowerCase());

  const filteredChildren =
    unitFilter === 'All'
      ? studentsWingMembers
      : isCentralFilter
      ? studentsWingMembers.filter((s) => s.unit.toLowerCase().startsWith('central'))
      : studentsWingMembers.filter((s) => s.unit.toLowerCase() === unitFilter.toLowerCase());

  // 2. Metrics calculation using strict effective active status
  const totalMembers = filteredMembers.length;
  const activeMembers = filteredMembers.filter(isMemberEffectivelyActive).length;
  const expiredMembers = totalMembers - activeMembers;

  const ladiesWingList = filteredMembers.filter(
    (m) =>
      (m.gender || '').toLowerCase() === 'female' ||
      (m.subcommittee || '').toLowerCase() === 'ladies wing'
  );
  const totalLadies = ladiesWingList.length;
  const activeLadies = ladiesWingList.filter(isMemberEffectivelyActive).length;

  const totalChildren = filteredChildren.length;
  const kcaLinkedChildren = filteredChildren.filter((s) => s.isParentKcaMember).length;

  const committeeMembers = filteredMembers.filter(
    (m) =>
      m.membershipType === 'Central Committee Member' ||
      m.membershipType === 'Executive Member' ||
      m.committeeTier === 'Central' ||
      m.committeeTier === 'Unit' ||
      m.committeeTier === 'Central Coordination' ||
      m.committeeTier === 'Executive Coordination' ||
      Boolean(m.coordinationCommittee) ||
      Boolean(m.designation && m.designation.trim())
  );
  const centralCommitteeCount = committeeMembers.filter(
    (m) => m.membershipType === 'Central Committee Member' || m.committeeTier === 'Central'
  ).length;
  const centralCoordCount = committeeMembers.filter(
    (m) =>
      m.coordinationCommittee === 'Central Coordination Committee' ||
      m.committeeTier === 'Central Coordination'
  ).length;
  const execCoordCount = committeeMembers.filter(
    (m) =>
      m.coordinationCommittee === 'Executive Coordination Committee' ||
      m.committeeTier === 'Executive Coordination'
  ).length;
  const unitExecCount = committeeMembers.filter(
    (m) =>
      !(m.membershipType === 'Central Committee Member' || m.committeeTier === 'Central') &&
      !m.coordinationCommittee &&
      (m.membershipType === 'Executive Member' ||
        m.committeeTier === 'Unit' ||
        Boolean(m.designation && m.designation.trim()))
  ).length;

  // 3. Header Banner
  doc.setFillColor(primaryMaroon[0], primaryMaroon[1], primaryMaroon[2]);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setFillColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.rect(0, 32, pageWidth, 2, 'F');

  try {
    const logoData = await getActiveLogoPngDataUrl();
    doc.addImage(logoData, 'PNG', 10, 4, 24, 24);
  } catch (e) {
    // fallback
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('KAIRALI CULTURAL ASSOCIATION FUJAIRAH - UAE', 115, 11, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(254, 240, 138);
  doc.text(
    'MEMBERS SUMMARY',
    115,
    18,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  const todayStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  doc.text(
    `Scope: ${unitFilter === 'All' ? 'All Units Consolidated' : `${unitFilter} Unit`}  •  Date: ${todayStr}  •  Prepared by: ${generatedBy}`,
    115,
    25,
    { align: 'center' }
  );

  // 4. Executive KPI Metric Cards (3 Cards across: Members, Ladies Wing, Children's Wing)
  const yPos = 40;
  const cardWidth = 58;
  const cardGap = 6;
  const startX = 15;

  // Card 1: Members
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(startX, yPos, cardWidth, 24, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryMaroon[0], primaryMaroon[1], primaryMaroon[2]);
  doc.text('TOTAL MEMBERS', startX + 4, yPos + 6);
  doc.setFontSize(14);
  doc.text(`${totalMembers}`, startX + 4, yPos + 14);
  doc.setFontSize(7);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(
    `${activeMembers} Active (${totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0}%) • ${expiredMembers} Inactive`,
    startX + 4,
    yPos + 20
  );

  // Card 2: Ladies Wing
  const x2 = startX + cardWidth + cardGap;
  doc.setFillColor(253, 242, 248);
  doc.setDrawColor(251, 207, 232);
  doc.roundedRect(x2, yPos, cardWidth, 24, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(190, 24, 93);
  doc.text('LADIES WING', x2 + 4, yPos + 6);
  doc.setFontSize(14);
  doc.text(`${totalLadies}`, x2 + 4, yPos + 14);
  doc.setFontSize(7);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(
    `${activeLadies} Active • ${totalMembers > 0 ? Math.round((totalLadies / totalMembers) * 100) : 0}% of KCA`,
    x2 + 4,
    yPos + 20
  );

  // Card 3: Children's Wing
  const x3 = x2 + cardWidth + cardGap;
  doc.setFillColor(255, 241, 242);
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(x3, yPos, cardWidth, 24, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(153, 27, 27);
  doc.text("CHILDREN'S WING", x3 + 4, yPos + 6);
  doc.setFontSize(14);
  doc.text(`${totalChildren}`, x3 + 4, yPos + 14);
  doc.setFontSize(7);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(
    `${kcaLinkedChildren} Linked KCA Parents • Dedicated Register`,
    x3 + 4,
    yPos + 20
  );

  // 5. Section Heading: Unit Distribution Breakdown
  let curY = yPos + 32;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('1. CONSOLIDATED UNIT STRENGTH & WING DISTRIBUTION', 12, curY);

  const allKnownUnits = Array.from(new Set([...units, ...members.map((m) => m.unit)]));
  const tableRows = allKnownUnits.map((u) => {
    const isCentral = u.toLowerCase().startsWith('central');
    const uMembers = isCentral
      ? members.filter(
          (m) =>
            m.membershipType === 'Central Committee Member' ||
            m.unit.toLowerCase().startsWith('central')
        )
      : members.filter((m) => m.unit === u);

    const uActive = uMembers.filter(isMemberEffectivelyActive).length;

    const uLadies = uMembers.filter(
      (m) =>
        (m.gender || '').toLowerCase() === 'female' ||
        (m.subcommittee || '').toLowerCase() === 'ladies wing'
    ).length;

    const uChildren = studentsWingMembers.filter((s) => {
      if (isCentral) return s.unit.toLowerCase().startsWith('central');
      return s.unit.toLowerCase() === u.toLowerCase();
    }).length;

    const pct =
      members.length > 0 ? `${Math.round((uMembers.length / members.length) * 100)}%` : '0%';

    return [
      u,
      String(uMembers.length),
      `${uActive} (${uMembers.length > 0 ? Math.round((uActive / uMembers.length) * 100) : 0}%)`,
      String(uLadies),
      String(uChildren),
      pct,
    ];
  });

  const totalActiveAll = members.filter(isMemberEffectivelyActive).length;
  const totalLadiesAll = members.filter(
    (m) =>
      (m.gender || '').toLowerCase() === 'female' ||
      (m.subcommittee || '').toLowerCase() === 'ladies wing'
  ).length;

  autoTable(doc, {
    startY: curY + 3,
    head: [
      [
        'Unit Name',
        'Total Members',
        'Active (%)',
        'Ladies Wing',
        "Children's Wing",
        'Share of KCA',
      ],
    ],
    body: tableRows,
    foot: [
      [
        'Total KCA Strength',
        String(members.length),
        `${totalActiveAll} Active (${members.length > 0 ? Math.round((totalActiveAll / members.length) * 100) : 0}%)`,
        String(totalLadiesAll),
        String(studentsWingMembers.length),
        '100%',
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    footStyles: {
      fillColor: [136, 19, 55],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left', cellWidth: 44 },
      1: { halign: 'center', fontStyle: 'bold' },
      2: { halign: 'center' },
      3: { halign: 'center', fontStyle: 'bold', textColor: [190, 24, 93] },
      4: { halign: 'center', fontStyle: 'bold', textColor: [153, 27, 27] },
      5: { halign: 'center', fontStyle: 'bold' },
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    margin: { left: 12, right: 12 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || curY + 65;

  // 6. Section 2: Coordination Committees & Governance Architecture
  const govY = finalY + 8;
  if (govY < 235) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text('2. GOVERNANCE ARCHITECTURE & COORDINATION FRAMEWORK', 12, govY);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(12, govY + 3, pageWidth - 24, 26, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryMaroon[0], primaryMaroon[1], primaryMaroon[2]);
    doc.text('Central Coordination Committee (CCC):', 16, govY + 9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(
      `Strategic coordination between Central Committee and Unit leadership. Active strength: ${centralCoordCount} coordinators.`,
      78,
      govY + 9
    );

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('Executive Coordination Committee (ECC):', 16, govY + 16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(
      `Operational & executive action across Unit Executive teams. Active strength: ${execCoordCount} coordinators.`,
      78,
      govY + 16
    );

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text('Three-Tier Hierarchy:', 16, govY + 23);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Apex: Central Committee (CC)  -->  Coordination Layer (CCC & ECC)  -->  Execution: Unit Committees (UC)',
      54,
      govY + 23
    );
  }

  // 7. Signature / Verification Block at the bottom
  const signY = 268;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);

  doc.line(20, signY, 75, signY);
  doc.line(pageWidth - 75, signY, pageWidth - 20, signY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryMaroon[0], primaryMaroon[1], primaryMaroon[2]);
  doc.text('General Secretary', 47.5, signY + 4, { align: 'center' });
  doc.text('President', pageWidth - 47.5, signY + 4, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Kairali Cultural Association Fujairah', 47.5, signY + 8, { align: 'center' });
  doc.text('Kairali Cultural Association Fujairah', pageWidth - 47.5, signY + 8, {
    align: 'center',
  });

  // Footer stamp on Page 1
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Official Members Summary Document • Certified by KCA Central Management Portal • ${OFFICIAL_LOCATION}`,
    105,
    288,
    { align: 'center' }
  );

  // =========================================================================
  // PAGE 2+: COMPLETE ALL MEMBERS DIRECTORY & WINGS ROSTERS
  // =========================================================================
  doc.addPage();

  // Page 2 Header Banner
  doc.setFillColor(primaryMaroon[0], primaryMaroon[1], primaryMaroon[2]);
  doc.rect(0, 0, pageWidth, 22, 'F');

  doc.setFillColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.rect(0, 22, pageWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('KAIRALI CULTURAL ASSOCIATION FUJAIRAH - UAE', 105, 9, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(254, 240, 138);
  doc.text(
    `MEMBERS SUMMARY – ALL REGISTERED MEMBERS DIRECTORY (${totalMembers} Members)`,
    105,
    15,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `Scope: ${unitFilter === 'All' ? 'All Units Consolidated' : `${unitFilter} Unit`}  •  Complete Registry`,
    105,
    19.5,
    { align: 'center' }
  );

  let curTableY = 27;

  // 1. ALL MEMBERS ROSTER TABLE (INCLUDES ALL MEMBERS IN SCOPE)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`1. ALL REGISTERED MEMBERS DIRECTORY (${filteredMembers.length} MEMBERS)`, 12, curTableY);

  const allMembersRows = filteredMembers.map((m, idx) => {
    const effStatus = getEffectiveMemberStatus(m);
    return [
      String(idx + 1),
      m.membershipId,
      m.fullName,
      m.unit,
      m.membershipType === 'Central Committee Member'
        ? 'Central Committee'
        : m.membershipType === 'Executive Member'
        ? 'Unit Executive'
        : 'General Member',
      m.designation ||
        (m.subcommittee
          ? `${m.subcommittee}`
          : m.coordinationCommittee
          ? 'Coordination'
          : 'Member'),
      m.bloodGroup || '—',
      m.phoneUAE || '—',
      effStatus,
      m.expiryDate || '—',
    ];
  });

  if (allMembersRows.length === 0) {
    allMembersRows.push(['—', '—', 'No members found in selected scope', '—', '—', '—', '—', '—', '—', '—']);
  }

  autoTable(doc, {
    startY: curTableY + 2,
    head: [['#', 'Member ID', 'Full Name', 'Unit', 'Category', 'Role / Wing', 'Blood', 'Contact UAE', 'Status', 'Expiry']],
    body: allMembersRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'left',
    },
    styles: { fontSize: 6.5, cellPadding: 1.5 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 22 },
      2: { fontStyle: 'bold', cellWidth: 38 },
      3: { cellWidth: 18 },
      4: { cellWidth: 22 },
      5: { cellWidth: 24 },
      6: { halign: 'center', cellWidth: 10 },
      7: { cellWidth: 20 },
      8: { halign: 'center', cellWidth: 12 },
      9: { halign: 'center', cellWidth: 14 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 8) {
        if (data.cell.raw === 'Active') {
          data.cell.styles.textColor = [22, 101, 52];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'Inactive') {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 12, right: 12 },
  });

  let nextY = (doc as any).lastAutoTable.finalY + 8;

  // Check if we need a new page for Ladies Wing
  if (nextY > 220) {
    doc.addPage();
    nextY = 20;
  }

  // 2. LADIES WING DIRECTORY (ALL LADIES IN SCOPE)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`2. LADIES WING – MEMBERS & LEADERSHIP DIRECTORY (${ladiesWingList.length} MEMBERS)`, 12, nextY);

  const ladiesRows = ladiesWingList.map((m, idx) => [
    String(idx + 1),
    m.membershipId,
    m.fullName,
    m.unit,
    m.designation || (m.subcommittee ? `${m.subcommittee} Member` : 'Ladies Wing Member'),
    m.bloodGroup || '—',
    m.phoneUAE || '—',
    getEffectiveMemberStatus(m),
  ]);

  if (ladiesRows.length === 0) {
    ladiesRows.push(['—', '—', 'No registered members in Ladies Wing for this scope', '—', '—', '—', '—', '—']);
  }

  autoTable(doc, {
    startY: nextY + 2,
    head: [['#', 'Member ID', 'Full Name', 'Unit', 'Wing Designation / Role', 'Blood', 'Contact UAE', 'Status']],
    body: ladiesRows,
    theme: 'grid',
    headStyles: {
      fillColor: [190, 24, 93],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'left',
    },
    styles: { fontSize: 6.5, cellPadding: 1.5 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 24 },
      2: { fontStyle: 'bold', cellWidth: 42 },
      3: { cellWidth: 22 },
      4: { cellWidth: 38 },
      5: { halign: 'center', cellWidth: 12 },
      6: { cellWidth: 24 },
      7: { halign: 'center', cellWidth: 16 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        if (data.cell.raw === 'Active') {
          data.cell.styles.textColor = [22, 101, 52];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'Inactive') {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 12, right: 12 },
  });

  let nextY2 = (doc as any).lastAutoTable.finalY + 8;

  // Check if we need a new page for Children's Wing
  if (nextY2 > 220) {
    doc.addPage();
    nextY2 = 20;
  }

  // 3. CHILDREN'S WING DIRECTORY (ALL CHILDREN IN SCOPE)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`3. CHILDREN'S WING – REGISTER & PARENT AFFILIATION (${filteredChildren.length} MEMBERS)`, 12, nextY2);

  const childrenRows = filteredChildren.map((s, idx) => [
    String(idx + 1),
    s.studentId,
    s.fullName,
    s.unit,
    s.wingRole || "Children's Wing Member",
    s.parentName,
    s.isParentKcaMember ? `Yes (${s.parentMembershipId || 'KCA Member'})` : 'Non-Member Parent',
    s.parentPhoneUAE || '—',
  ]);

  if (childrenRows.length === 0) {
    childrenRows.push(['—', '—', "No registered Children's Wing members for this scope", '—', '—', '—', '—', '—']);
  }

  autoTable(doc, {
    startY: nextY2 + 2,
    head: [['#', 'Member ID', 'Child Name', 'Unit', 'Wing Role', 'Parent Name', 'Parent KCA Link', 'Parent Contact']],
    body: childrenRows,
    theme: 'grid',
    headStyles: {
      fillColor: [153, 27, 27],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'left',
    },
    styles: { fontSize: 6.5, cellPadding: 1.5 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 24 },
      2: { fontStyle: 'bold', cellWidth: 38 },
      3: { cellWidth: 20 },
      4: { cellWidth: 28 },
      5: { cellWidth: 30 },
      6: { cellWidth: 24 },
      7: { cellWidth: 20 },
    },
    margin: { left: 12, right: 12 },
  });

  let nextY3 = (doc as any).lastAutoTable.finalY + 8;

  // Check if we need a new page for Coordination Committee
  if (nextY3 > 220) {
    doc.addPage();
    nextY3 = 20;
  }

  // 4. COORDINATION COMMITTEES (CCC & ECC)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('4. COORDINATION COMMITTEES (CCC & ECC) APPOINTMENTS', 12, nextY3);

  const coordMembers = committeeMembers.filter(
    (m) =>
      Boolean(m.coordinationCommittee) ||
      m.committeeTier === 'Central Coordination' ||
      m.committeeTier === 'Executive Coordination'
  );

  const coordRows = coordMembers.map((m, idx) => [
    String(idx + 1),
    m.membershipId,
    m.fullName,
    m.coordinationCommittee ||
      (m.committeeTier === 'Central Coordination'
        ? 'Central Coordination Committee'
        : 'Executive Coordination Committee'),
    m.coordinationDesignation || m.designation || 'Coordinator',
    m.unit,
    m.phoneUAE || '—',
  ]);

  if (coordRows.length === 0) {
    coordRows.push(['—', '—', 'No coordinators assigned in current scope', '—', '—', '—', '—']);
  }

  autoTable(doc, {
    startY: nextY3 + 2,
    head: [['#', 'Member ID', 'Coordinator Name', 'Coordination Body', 'Designated Role', 'Unit', 'Contact UAE']],
    body: coordRows,
    theme: 'grid',
    headStyles: {
      fillColor: [180, 83, 9],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'left',
    },
    styles: { fontSize: 6.5, cellPadding: 1.5 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 22 },
      2: { fontStyle: 'bold', cellWidth: 40 },
      3: { cellWidth: 42 },
      4: { fontStyle: 'bold', cellWidth: 32 },
      5: { cellWidth: 22 },
      6: { cellWidth: 22 },
    },
    margin: { left: 12, right: 12 },
  });

  let endY = (doc as any).lastAutoTable.finalY + 14;

  if (endY > 240) {
    doc.addPage();
    endY = 30;
  }

  // Final Official Verification Signatures Block
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);

  doc.line(20, endY, 75, endY);
  doc.line(pageWidth - 75, endY, pageWidth - 20, endY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryMaroon[0], primaryMaroon[1], primaryMaroon[2]);
  doc.text('General Secretary', 47.5, endY + 4, { align: 'center' });
  doc.text('President', pageWidth - 47.5, endY + 4, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Kairali Cultural Association Fujairah', 47.5, endY + 8, { align: 'center' });
  doc.text('Kairali Cultural Association Fujairah', pageWidth - 47.5, endY + 8, {
    align: 'center',
  });

  // Stamp page numbers and official certification footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `KCA Fujairah Members Summary  •  Page ${i} of ${totalPages}  •  Certified by KCA Central Portal  •  ${OFFICIAL_LOCATION}`,
      pageWidth / 2,
      292,
      { align: 'center' }
    );
  }

  const cleanScope = unitFilter.replace(/\s+/g, '_');
  const dateStamp = new Date().toISOString().split('T')[0];
  doc.save(`KCA_Members_Summary_${cleanScope}_${dateStamp}.pdf`);
}

/**
 * Exports Committee & Wings Summary Table as clean CSV / Spreadsheet
 */
export function exportCommitteeSummaryCsv({
  unitFilter,
  members,
  studentsWingMembers,
  units,
}: CommitteeSummaryReportParams): void {
  const isCentralFilter = unitFilter.toLowerCase().startsWith('central');
  const filteredMembers =
    unitFilter === 'All'
      ? members
      : isCentralFilter
      ? members.filter(
          (m) =>
            m.membershipType === 'Central Committee Member' ||
            m.unit.toLowerCase().startsWith('central')
        )
      : members.filter((m) => m.unit.toLowerCase() === unitFilter.toLowerCase());

  const filteredChildren =
    unitFilter === 'All'
      ? studentsWingMembers
      : isCentralFilter
      ? studentsWingMembers.filter((s) => s.unit.toLowerCase().startsWith('central'))
      : studentsWingMembers.filter((s) => s.unit.toLowerCase() === unitFilter.toLowerCase());

  const lines: string[] = [];

  // SECTION 1: UNIT BREAKDOWN
  lines.push('--- SECTION 1: CONSOLIDATED UNIT STRENGTH & WINGS DISTRIBUTION ---');
  lines.push(
    [
      'Unit Name',
      'Total Members',
      'Active Members',
      'Active Percentage',
      'Ladies Wing Strength',
      "Children's Wing Strength",
      'Share of KCA (%)',
    ]
      .map((c) => `"${c}"`)
      .join(',')
  );

  const allKnownUnits = Array.from(new Set([...units, ...members.map((m) => m.unit)]));
  allKnownUnits.forEach((u) => {
    const isCentral = u.toLowerCase().startsWith('central');
    const uMembers = isCentral
      ? members.filter(
          (m) =>
            m.membershipType === 'Central Committee Member' ||
            m.unit.toLowerCase().startsWith('central')
        )
      : members.filter((m) => m.unit === u);

    const uActive = uMembers.filter(isMemberEffectivelyActive).length;

    const uLadies = uMembers.filter(
      (m) =>
        (m.gender || '').toLowerCase() === 'female' ||
        (m.subcommittee || '').toLowerCase() === 'ladies wing'
    ).length;

    const uChildren = studentsWingMembers.filter((s) => {
      if (isCentral) return s.unit.toLowerCase().startsWith('central');
      return s.unit.toLowerCase() === u.toLowerCase();
    }).length;

    const pct = members.length > 0 ? Math.round((uMembers.length / members.length) * 100) : 0;

    lines.push(
      [
        u,
        uMembers.length,
        uActive,
        `${uMembers.length > 0 ? Math.round((uActive / uMembers.length) * 100) : 0}%`,
        uLadies,
        uChildren,
        `${pct}%`,
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(',')
    );
  });

  const totalActiveAll = members.filter(isMemberEffectivelyActive).length;
  const totalLadiesAll = members.filter(
    (m) =>
      (m.gender || '').toLowerCase() === 'female' ||
      (m.subcommittee || '').toLowerCase() === 'ladies wing'
  ).length;

  // Totals Row (Total KCA Strength without Committee)
  lines.push(
    [
      'TOTAL KCA STRENGTH',
      members.length,
      totalActiveAll,
      `${members.length > 0 ? Math.round((totalActiveAll / members.length) * 100) : 0}%`,
      totalLadiesAll,
      studentsWingMembers.length,
      '100%',
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(',')
  );

  lines.push('');

  // SECTION 2: ALL REGISTERED MEMBERS DIRECTORY (FULL ROSTER)
  lines.push(`--- SECTION 2: ALL REGISTERED MEMBERS DIRECTORY (${filteredMembers.length} MEMBERS) ---`);
  lines.push(
    [
      'Sl No',
      'Member ID',
      'Full Name',
      'Unit',
      'Membership Category',
      'Designation / Wing',
      'Blood Group',
      'Phone UAE',
      'Email',
      'Status',
      'Joining Date',
      'Expiry Date',
    ]
      .map((c) => `"${c}"`)
      .join(',')
  );
  filteredMembers.forEach((m, idx) => {
    lines.push(
      [
        idx + 1,
        m.membershipId,
        m.fullName,
        m.unit,
        m.membershipType,
        m.designation || (m.subcommittee ? m.subcommittee : (m.coordinationCommittee ? 'Coordination' : 'General Member')),
        m.bloodGroup || '',
        m.phoneUAE || '',
        m.email || '',
        getEffectiveMemberStatus(m),
        m.registrationDate || '',
        m.expiryDate || '',
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(',')
    );
  });

  lines.push('');

  // SECTION 3: LADIES WING ROSTER
  lines.push('--- SECTION 3: LADIES WING LEADERSHIP & ROSTER ---');
  lines.push(['Member ID', 'Full Name', 'Unit', 'Role / Designation', 'Contact UAE', 'Status'].map((c) => `"${c}"`).join(','));
  const ladiesList = filteredMembers.filter(
    (m) =>
      (m.gender || '').toLowerCase() === 'female' ||
      (m.subcommittee || '').toLowerCase() === 'ladies wing'
  );
  ladiesList.forEach((m) => {
    lines.push(
      [
        m.membershipId,
        m.fullName,
        m.unit,
        m.designation || (m.subcommittee ? `${m.subcommittee} Member` : 'Ladies Wing Member'),
        m.phoneUAE,
        getEffectiveMemberStatus(m),
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(',')
    );
  });

  lines.push('');

  // SECTION 4: CHILDREN'S WING ROSTER
  lines.push("--- SECTION 4: CHILDREN'S WING REGISTER & PARENT LINKS ---");
  lines.push(['Member ID', 'Full Name', 'Gender', 'Unit', 'Parent Name', 'Parent KCA Member Link', 'Parent Phone UAE', 'School/Institution'].map((c) => `"${c}"`).join(','));
  filteredChildren.forEach((s) => {
    lines.push(
      [
        s.studentId,
        s.fullName,
        s.gender,
        s.unit,
        s.parentName,
        s.isParentKcaMember ? `Yes (${s.parentMembershipId || 'KCA Member'})` : 'Non-Member Parent',
        s.parentPhoneUAE,
        s.schoolOrCollege || '',
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(',')
    );
  });

  lines.push('');

  // SECTION 5: COORDINATION COMMITTEES
  lines.push('--- SECTION 5: COORDINATION COMMITTEES (CCC & ECC) APPOINTMENTS ---');
  lines.push(['Member ID', 'Full Name', 'Coordination Committee', 'Coordination Role', 'Unit', 'Contact UAE'].map((c) => `"${c}"`).join(','));
  const coordList = filteredMembers.filter(
    (m) =>
      Boolean(m.coordinationCommittee) ||
      m.committeeTier === 'Central Coordination' ||
      m.committeeTier === 'Executive Coordination'
  );
  coordList.forEach((m) => {
    lines.push(
      [
        m.membershipId,
        m.fullName,
        m.coordinationCommittee || (m.committeeTier === 'Central Coordination' ? 'Central Coordination Committee' : 'Executive Coordination Committee'),
        m.coordinationDesignation || m.designation || 'Coordinator',
        m.unit,
        m.phoneUAE,
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(',')
    );
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const cleanScope = unitFilter.replace(/\s+/g, '_');
  const dateStamp = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `KCA_Members_Summary_${cleanScope}_${dateStamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
