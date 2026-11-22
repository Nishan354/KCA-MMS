import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { getActiveLogoPngDataUrl } from '../components/Logo';
import { HeaderTitleStyle, PortalBrandingConfig } from '../types/portal';
import { loadCustomLogo, loadPortalConfig } from './storage';
import {
  resolveEffectiveTitleStyle,
  getTitleLockupLines,
  getTrimmedTitleGraphicDataUrl,
} from './titleGraphic';

export type SealStyle =
  | 'gold_guilloche'
  | 'royal_ribbon'
  | 'association_crest'
  | 'traditional_kasavu'
  | 'luxury_gold_rosette'
  | 'none';

export interface CertificateData {
  id?: string;
  certNumber: string;
  templateId: string;
  recipientName: string;
  recipientMalayalamName?: string;
  memberOrStudentId?: string;
  title: string; // e.g. "CERTIFICATE OF EXCELLENCE"
  courseOrEvent: string; // e.g. "Annual Kerala Kalolsavam 2026"
  citation: string; // e.g. "for outstanding performance and securing First Place with A-Grade in Classical Dance"
  unit: string; // "Fujairah", "Kalba", "Khorfakhan", "Dibba", "Central"
  issueDate: string;
  norkaRegNumber?: string;
  signatory1Title: string; // "General Secretary"
  signatory1Name: string;
  signatory1SignatureUrl?: string;
  signatory2Title: string; // "President"
  signatory2Name: string;
  signatory2SignatureUrl?: string;
  signatory3Title?: string; // "Cultural Convener"
  signatory3Name?: string;
  signatory3SignatureUrl?: string;
  customLogoUrl?: string;
  sealType?: SealStyle;
  showWatermark?: boolean;
  titleStyle?: HeaderTitleStyle;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  category: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgColor: string;
  description: string;
  borderStyle:
    | 'crimson_gold_luxury'
    | 'formal_double'
    | 'minimal_clean'
    | 'heritage_ornate'
    | 'gold_accent'
    | 'navy_platinum'
    | 'festive_starburst'
    | 'vintage_parchment'
    | 'emerald_flourish';
}

export const CERTIFICATE_TEMPLATES: CertificateTemplate[] = [
  {
    id: 'crimson_gold_luxury',
    name: 'Royal Crimson & Gold Prestige',
    category: 'Executive Luxury & Honor',
    primaryColor: '#881337', // Deep Crimson Maroon
    secondaryColor: '#450A0A', // Deep Garnet
    accentColor: '#D97706', // Radiant Metallic Gold
    bgColor: '#FFFDF9',
    description: 'Modern executive luxury design with low-poly faceted ruby geometric corner frames, double gold borders, and gold rosette ribbon seal.',
    borderStyle: 'crimson_gold_luxury',
  },
  {
    id: 'classic_formal',
    name: 'Classic Royal Burgundy',
    category: 'Formal & Heritage',
    primaryColor: '#881337', // Deep Burgundy
    secondaryColor: '#1E293B', // Slate Navy
    accentColor: '#B45309', // Amber Gold
    bgColor: '#FFFDFB',
    description: 'Timeless formal layout with double precision borders, executive serif typography, and balanced layout.',
    borderStyle: 'formal_double',
  },
  {
    id: 'elegant_gold',
    name: 'Imperial Gold & Bronze',
    category: 'Prestige & Honor',
    primaryColor: '#92400E', // Bronze Ochre
    secondaryColor: '#78350F', // Dark Gold
    accentColor: '#D97706', // Shimmering Gold
    bgColor: '#FFFDF5',
    description: 'Prestigious golden borders with dual hairline frame and refined formal presentation.',
    borderStyle: 'gold_accent',
  },
  {
    id: 'traditional_heritage',
    name: 'Kerala Emerald Heritage',
    category: 'Cultural & Arts',
    primaryColor: '#065F46', // Kerala Emerald
    secondaryColor: '#831843', // Royal Crimson
    accentColor: '#D97706', // Gold/Ochre
    bgColor: '#FCFDFB',
    description: 'Kerala cultural aesthetic with heritage emerald framing, ornamental corner accents, and warm highlights.',
    borderStyle: 'heritage_ornate',
  },
  {
    id: 'royal_navy_silver',
    name: 'Executive Navy & Platinum',
    category: 'Leadership & Academic',
    primaryColor: '#0F172A', // Slate Navy
    secondaryColor: '#1E3A8A', // Deep Royal Blue
    accentColor: '#3B82F6', // Cobalt Accent
    bgColor: '#F8FAFC',
    description: 'Executive corporate styling, architectural borders, silver/platinum double lines and clean alignment.',
    borderStyle: 'navy_platinum',
  },
  {
    id: 'maroon_festive',
    name: 'Festive Crimson & Sunburst',
    category: 'Kalolsavam & Youth',
    primaryColor: '#991B1B', // Crimson
    secondaryColor: '#B45309', // Gold Amber
    accentColor: '#EA580C', // Sunset Ochre
    bgColor: '#FFFDF9',
    description: 'Festive cultural competition theme with radiant corner starbursts and double ribbon frames.',
    borderStyle: 'festive_starburst',
  },
  {
    id: 'vintage_parchment',
    name: 'Antique Parchment & Umber',
    category: 'Distinguished Service',
    primaryColor: '#451A03', // Deep Umber
    secondaryColor: '#78350F', // Sepia
    accentColor: '#B45309', // Antique Gold
    bgColor: '#FEFBF3',
    description: 'Classic engraved diploma style with warm ivory parchment tone, intricate guilloche filigree and vintage typography.',
    borderStyle: 'vintage_parchment',
  },
  {
    id: 'emerald_flourish',
    name: 'Emerald Botanic Flourish',
    category: 'Community & Sports',
    primaryColor: '#047857', // Forest Emerald
    secondaryColor: '#064E3B', // Deep Pine
    accentColor: '#F59E0B', // Sunburst Gold
    bgColor: '#F7FDF9',
    description: 'Fresh botanical emerald borders with laurel leaf accents, ideal for sports, youth and welfare merit.',
    borderStyle: 'emerald_flourish',
  },
  {
    id: 'modern_minimalist',
    name: 'Modern Minimalist',
    category: 'Contemporary Clean',
    primaryColor: '#1E293B', // Slate 800
    secondaryColor: '#475569', // Slate 600
    accentColor: '#2563EB', // Royal Blue
    bgColor: '#F8FAFC',
    description: 'Clean architectural framing, crisp typography, generous whitespace, and contemporary alignment.',
    borderStyle: 'minimal_clean',
  },
];

async function renderCertificateHeader(
  pdf: jsPDF,
  data: CertificateData,
  portalConfig: PortalBrandingConfig,
  pageWidth: number,
  pCol: { r: number; g: number; b: number },
  aCol: { r: number; g: number; b: number }
): Promise<void> {
  const effectiveTitleStyle = resolveEffectiveTitleStyle(
    portalConfig,
    'certificate',
    data.titleStyle
  );
  const certOrgName = (portalConfig.portalName || 'OFFICIAL ORGANIZATION').toUpperCase();
  const certAffiliation =
    portalConfig.affiliationText || portalConfig.subtitle || 'Recognized & Affiliated Forum';
  const certLocation = portalConfig.jurisdiction || 'United Arab Emirates';
  const unitTermLabel = portalConfig.unitTerm || 'Unit';
  const unitHeaderLabel =
    data.unit === 'Central' ? 'Executive Administration' : `${data.unit} ${unitTermLabel}`;

  const activeCustomLogo =
    portalConfig.customLogoUrl !== undefined ? portalConfig.customLogoUrl : loadCustomLogo();
  const hasCustomLogoWithoutCustomBanner =
    !portalConfig.customTitleGraphicUrl && !!activeCustomLogo;

  if (effectiveTitleStyle === 'title_graphic' && !hasCustomLogoWithoutCustomBanner) {
    // Draw trimmed official title graphic banner centered at top
    try {
      const graphic = await getTrimmedTitleGraphicDataUrl(
        portalConfig.customTitleGraphicUrl,
        true
      );
      const maxH = 14.5;
      const maxW = 86;
      let drawW = maxH * graphic.aspectRatio;
      let drawH = maxH;
      if (drawW > maxW) {
        drawW = maxW;
        drawH = drawW / graphic.aspectRatio;
      }
      pdf.addImage(
        graphic.dataUrl,
        'PNG',
        (pageWidth - drawW) / 2,
        14 + (maxH - drawH) / 2,
        drawW,
        drawH
      );
    } catch (err) {
      console.warn('Certificate Title Graphic Render:', err);
    }

    // Affiliation & Unit subtitle directly below the graphic
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(aCol.r, aCol.g, aCol.b);
    pdf.text(`${certAffiliation}  •  ${unitHeaderLabel}  •  ${certLocation}`, pageWidth / 2, 33.5, {
      align: 'center',
    });

    // Metadata cleanly on Top-Right
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`CERT: ${data.certNumber}`, pageWidth - 18, 19, { align: 'right' });
    pdf.text(`DATE: ${data.issueDate}`, pageWidth - 18, 24, { align: 'right' });
    if (data.norkaRegNumber) {
      pdf.setFontSize(6.5);
      pdf.text(`REG: ${data.norkaRegNumber}`, pageWidth - 18, 28.5, { align: 'right' });
    }
  } else if (
    effectiveTitleStyle === 'official_lockup' ||
    (effectiveTitleStyle === 'title_graphic' && hasCustomLogoWithoutCustomBanner)
  ) {
    const { line1, line2, line3 } = getTitleLockupLines(portalConfig);

    // Measure lockup text width so circular logo + stacked title block is centered around pageWidth/2
    pdf.setFont('times', 'bold');
    pdf.setFontSize(19.5);
    const l1W = pdf.getTextWidth(line1.toUpperCase());

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    const l2W = line2 ? pdf.getTextWidth(line2.toUpperCase()) : 0;

    const textBlockW = Math.max(l1W, l2W, 38);
    const emblemSize = 15;
    const gap = 3.2;
    const totalW = emblemSize + gap + textBlockW;
    const startX = (pageWidth - totalW) / 2;
    const textCenterX = startX + emblemSize + gap + textBlockW / 2;

    try {
      const logoPngUrl = await getActiveLogoPngDataUrl();
      pdf.addImage(logoPngUrl, 'PNG', startX, 14.2, emblemSize, emblemSize);
    } catch (err) {
      console.warn('Certificate Lockup Logo Render:', err);
    }

    // Line 1: Bold Red Serif ("KAIRALI")
    pdf.setFont('times', 'bold');
    pdf.setFontSize(19.5);
    pdf.setTextColor(220, 38, 38);
    pdf.text(line1.toUpperCase(), textCenterX, 20.5, { align: 'center' });

    // Line 2: Bold Dark Sans ("CULTURAL ASSOCIATION")
    if (line2) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(line2.toUpperCase(), textCenterX, 24.8, { align: 'center' });
    }

    // Line 3: Bold Location ("Fujairah")
    if (line3) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.2);
      pdf.setTextColor(15, 23, 42);
      pdf.text(line3, textCenterX, 28.6, { align: 'center' });
    }

    // Affiliation & Unit Subline
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.8);
    pdf.setTextColor(aCol.r, aCol.g, aCol.b);
    pdf.text(`${certAffiliation}  •  ${unitHeaderLabel}`, pageWidth / 2, 34.5, {
      align: 'center',
    });

    // Metadata cleanly on Top-Right
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`CERT: ${data.certNumber}`, pageWidth - 18, 19, { align: 'right' });
    pdf.text(`DATE: ${data.issueDate}`, pageWidth - 18, 24, { align: 'right' });
    if (data.norkaRegNumber) {
      pdf.setFontSize(6.5);
      pdf.text(`REG: ${data.norkaRegNumber}`, pageWidth - 18, 28.5, { align: 'right' });
    }
  } else {
    // Classic Standard Org Header + Right Emblem
    try {
      const logoPngUrl = await getActiveLogoPngDataUrl();
      pdf.addImage(logoPngUrl, 'PNG', pageWidth - 38, 15, 20, 20);
    } catch (err) {
      console.warn('Certificate Logo Render:', err);
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(certOrgName.length > 32 ? 14 : 16);
    pdf.setTextColor(pCol.r, pCol.g, pCol.b);
    pdf.text(certOrgName, pageWidth / 2, 23, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(aCol.r, aCol.g, aCol.b);
    pdf.text(certAffiliation, pageWidth / 2, 29, {
      align: 'center',
    });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`${unitHeaderLabel}  •  ${certLocation}`, pageWidth / 2, 34.5, {
      align: 'center',
    });

    // Top Meta Bar: Certificate Number and Date beside QR
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`CERT: ${data.certNumber}`, 40, 19, { align: 'left' });
    pdf.text(`DATE: ${data.issueDate}`, 40, 24, { align: 'left' });
  }
}

async function renderCertificatePage(
  pdf: jsPDF,
  data: CertificateData,
  portalConfig: PortalBrandingConfig
): Promise<void> {
  const template =
    CERTIFICATE_TEMPLATES.find((t) => t.id === data.templateId) || CERTIFICATE_TEMPLATES[0];

  const pageWidth = 297;
  const pageHeight = 210;

  const pCol = hexToRgb(template.primaryColor);
  const sCol = hexToRgb(template.secondaryColor);
  const aCol = hexToRgb(template.accentColor);
  const bgCol = hexToRgb(template.bgColor);

  // 1. Background Fill
  pdf.setFillColor(bgCol.r, bgCol.g, bgCol.b);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // 2. Watermark Emblem in Center (Subtle, <5% opacity, exactly centered)
  if (data.showWatermark !== false) {
    drawSubtleWatermark(pdf, pageWidth / 2, pageHeight / 2, aCol, bgCol);
  }

  // 3. Render Borders & Corner Filigree based on theme style
  renderGraphicBorder(pdf, template.borderStyle, pageWidth, pageHeight, pCol, sCol, aCol);

  const orgDisplayName = portalConfig.portalName || 'Official Organization';
  const orgAffiliation =
    portalConfig.affiliationText || portalConfig.subtitle || 'Authorized Organization';
  const unitTermLabel = portalConfig.unitTerm || 'Unit';

  // 4. Verification QR Code (Top-Left)
  const qrString = `${orgDisplayName.toUpperCase()} OFFICIAL CERTIFICATE\nCert No: ${data.certNumber}\nIssued To: ${data.recipientName}\nID/Roll: ${data.memberOrStudentId || 'N/A'}\nAchievement: ${data.title}\nCourse/Event: ${data.courseOrEvent}\n${unitTermLabel}: ${data.unit}\nDate: ${data.issueDate}\n${orgAffiliation}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(qrString, {
      margin: 1,
      width: 160,
      color: { dark: template.primaryColor, light: '#FFFFFF' },
    });
    pdf.addImage(qrDataUrl, 'PNG', 18, 16, 18, 18);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5);
    pdf.setTextColor(100, 116, 139);
    pdf.text('AUTHENTICITY QR', 27, 36.5, { align: 'center' });
  } catch {}

  // 5 & 6. Header: Official Lockup, Title Graphic Image, or Standard Organization Header
  await renderCertificateHeader(pdf, data, portalConfig, pageWidth, pCol, aCol);

  // Ornamental Divider Line
  pdf.setDrawColor(aCol.r, aCol.g, aCol.b);
  pdf.setLineWidth(0.8);
  pdf.line(65, 38, pageWidth - 65, 38);

  // 7. Main Title: "CERTIFICATE OF EXCELLENCE / MERIT / APPRECIATION"
  pdf.setFont('times', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(pCol.r, pCol.g, pCol.b);
  pdf.text(data.title.toUpperCase(), pageWidth / 2, 50, { align: 'center' });

  // 8. Subtext: "THIS IS PROUDLY PRESENTED TO"
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text('THIS IS PROUDLY PRESENTED TO', pageWidth / 2, 58, { align: 'center' });

  // 9. Recipient Name
  pdf.setFont('times', 'bold');
  pdf.setFontSize(25);
  pdf.setTextColor(15, 23, 42);
  pdf.text(data.recipientName, pageWidth / 2, 71, { align: 'center' });

  // Recipient Underline Accent
  pdf.setDrawColor(aCol.r, aCol.g, aCol.b);
  pdf.setLineWidth(1.1);
  const nameWidth = pdf.getTextWidth(data.recipientName);
  pdf.line(pageWidth / 2 - nameWidth / 2 - 8, 74, pageWidth / 2 + nameWidth / 2 + 8, 74);

  // Optional Registration ID
  if (data.memberOrStudentId) {
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      `ID / REGISTRATION NO: ${data.memberOrStudentId}   |   ${unitTermLabel.toUpperCase()}: ${data.unit}`,
      pageWidth / 2,
      80,
      { align: 'center' }
    );
  }

  // 10. Citation / Body Text
  pdf.setFont('times', 'italic');
  pdf.setFontSize(12.5);
  pdf.setTextColor(51, 65, 85);
  const citationFull = `${data.citation} during the ${data.courseOrEvent} organized by ${orgDisplayName}.`;
  const citationLines = pdf.splitTextToSize(citationFull, 215);
  const citationStartY = data.memberOrStudentId ? 88 : 84;
  pdf.text(citationLines, pageWidth / 2, citationStartY, { align: 'center', lineHeightFactor: 1.35 });
  const citationLineCount = citationLines.length;
  const citationEndY = citationStartY + (citationLineCount - 1) * 6.2;

  // 11. Signatories Setup
  const signY = 168;
  const hasSignatory3 = Boolean(data.signatory3Name);

  // 12. Center Seal / Graphic Stamp
  const sealType: SealStyle = data.sealType || 'gold_guilloche';
  if (sealType !== 'none') {
    let sealY: number;
    let sealR: number;

    if (hasSignatory3) {
      sealY = Math.min(135, Math.max(citationEndY + 13, 125));
      sealR = 10.5;
    } else {
      sealY = Math.min(140, Math.max(citationEndY + 16, 131));
      sealR = 13;
    }

    drawGraphicSeal(pdf, pageWidth / 2, sealY, sealType, pCol, aCol, sealR);
  } else {
    const divY = Math.min(138, Math.max(citationEndY + 14, 128));
    pdf.setDrawColor(aCol.r, aCol.g, aCol.b);
    pdf.setLineWidth(0.6);
    pdf.line(pageWidth / 2 - 40, divY, pageWidth / 2 - 8, divY);
    pdf.line(pageWidth / 2 + 8, divY, pageWidth / 2 + 40, divY);

    drawVectorDiamond(pdf, pageWidth / 2, divY, 3.5, 3.5, aCol);
    drawVectorStar(pdf, pageWidth / 2 - 14, divY, 1.8, 0.8, aCol);
    drawVectorStar(pdf, pageWidth / 2 + 14, divY, 1.8, 0.8, aCol);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(aCol.r, aCol.g, aCol.b);
    pdf.text('OFFICIAL RECOGNITION', pageWidth / 2, divY + 6.5, { align: 'center' });
  }

  // 13. Signatories (Left, Center optional, Right)
  if (data.signatory1SignatureUrl) {
    try {
      pdf.addImage(data.signatory1SignatureUrl, 'PNG', 46, signY - 14, 32, 12);
    } catch {}
  }
  pdf.setDrawColor(148, 163, 184);
  pdf.setLineWidth(0.6);
  pdf.line(28, signY, 96, signY);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(pCol.r, pCol.g, pCol.b);
  pdf.text(data.signatory1Name || 'Authorized Signatory', 62, signY + 5, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  const sig1UnitLabel =
    data.unit === 'Central' ? 'Central Committee' : `${data.unit} ${unitTermLabel}`;
  pdf.text(`${sig1UnitLabel} ${data.signatory1Title || 'General Secretary'}`, 62, signY + 9, {
    align: 'center',
  });

  if (data.signatory2SignatureUrl) {
    try {
      pdf.addImage(data.signatory2SignatureUrl, 'PNG', pageWidth - 78, signY - 14, 32, 12);
    } catch {}
  }
  pdf.line(pageWidth - 96, signY, pageWidth - 28, signY);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(pCol.r, pCol.g, pCol.b);
  pdf.text(data.signatory2Name || 'Authorized Signatory', pageWidth - 62, signY + 5, {
    align: 'center',
  });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  const sig2UnitLabel =
    data.unit === 'Central' ? 'Central Committee' : `${data.unit} ${unitTermLabel}`;
  pdf.text(`${sig2UnitLabel} ${data.signatory2Title || 'President'}`, pageWidth - 62, signY + 9, {
    align: 'center',
  });

  if (hasSignatory3 && data.signatory3Name) {
    if (data.signatory3SignatureUrl) {
      try {
        pdf.addImage(data.signatory3SignatureUrl, 'PNG', 132.5, signY - 14, 32, 12);
      } catch {}
    }
    pdf.line(114, signY, 183, signY);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(pCol.r, pCol.g, pCol.b);
    pdf.text(data.signatory3Name, 148.5, signY + 5, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(data.signatory3Title || 'Cultural Convener', 148.5, signY + 9, { align: 'center' });
  }

  // 14. Footer Line (Inside margins, safely above bottom border)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.8);
  pdf.setTextColor(148, 163, 184);
  pdf.text(
    `Official Certificate issued by ${orgDisplayName} • Verify authenticity via QR Code`,
    pageWidth / 2,
    pageHeight - 16.5,
    { align: 'center' }
  );
}

export async function generateCertificatePdf(data: CertificateData): Promise<jsPDF> {
  // A4 Landscape Dimensions: 297mm x 210mm
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });
  const portalConfig = loadPortalConfig();
  await renderCertificatePage(pdf, data, portalConfig);
  return pdf;
}

/**
 * Bulk Multi-Page Certificate Generator
 */
export async function generateBulkCertificatesPdf(
  records: CertificateData[],
  onProgress?: (percent: number) => void
): Promise<jsPDF> {
  const finalDoc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });
  const portalConfig = loadPortalConfig();

  for (let i = 0; i < records.length; i++) {
    if (i > 0) {
      finalDoc.addPage('a4', 'landscape');
    }
    await renderCertificatePage(finalDoc, records[i], portalConfig);
    if (onProgress) {
      onProgress(Math.round(((i + 1) / records.length) * 100));
    }
  }

  return finalDoc;
}

function hexToRgb(hex?: string | null): { r: number; g: number; b: number } {
  if (!hex || typeof hex !== 'string') {
    return { r: 139, g: 0, b: 0 };
  }
  let c = hex.replace('#', '').trim();
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) {
    return { r: 139, g: 0, b: 0 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Renders a crisp vector 5-pointed star in jsPDF without font character dependencies
 */
function drawVectorStar(
  pdf: jsPDF,
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  fillCol?: { r: number; g: number; b: number },
  strokeCol?: { r: number; g: number; b: number }
) {
  const points: { x: number; y: number }[] = [];
  const spikes = 5;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;

  for (let i = 0; i < spikes; i++) {
    points.push({
      x: cx + Math.cos(rot) * rOuter,
      y: cy + Math.sin(rot) * rOuter,
    });
    rot += step;
    points.push({
      x: cx + Math.cos(rot) * rInner,
      y: cy + Math.sin(rot) * rInner,
    });
    rot += step;
  }

  if (fillCol) {
    pdf.setFillColor(fillCol.r, fillCol.g, fillCol.b);
  }
  if (strokeCol) {
    pdf.setDrawColor(strokeCol.r, strokeCol.g, strokeCol.b);
    pdf.setLineWidth(0.15);
  }

  const renderStyle = fillCol && strokeCol ? 'FD' : fillCol ? 'F' : 'S';
  for (let i = 0; i < points.length; i++) {
    const next = (i + 1) % points.length;
    pdf.triangle(cx, cy, points[i].x, points[i].y, points[next].x, points[next].y, renderStyle);
  }
}

/**
 * Renders a vector diamond shape
 */
function drawVectorDiamond(
  pdf: jsPDF,
  cx: number,
  cy: number,
  w: number,
  h: number,
  fillCol?: { r: number; g: number; b: number },
  strokeCol?: { r: number; g: number; b: number }
) {
  if (fillCol) pdf.setFillColor(fillCol.r, fillCol.g, fillCol.b);
  if (strokeCol) {
    pdf.setDrawColor(strokeCol.r, strokeCol.g, strokeCol.b);
    pdf.setLineWidth(0.2);
  }
  const renderStyle = fillCol && strokeCol ? 'FD' : fillCol ? 'F' : 'S';
  pdf.triangle(cx, cy - h / 2, cx + w / 2, cy, cx - w / 2, cy, renderStyle);
  pdf.triangle(cx, cy + h / 2, cx + w / 2, cy, cx - w / 2, cy, renderStyle);
}

/**
 * Draws a rich graphic seal stamp on the certificate with clean centering and vector stars
 */
function drawGraphicSeal(
  pdf: jsPDF,
  cx: number,
  cy: number,
  sealType: SealStyle,
  pCol: { r: number; g: number; b: number },
  aCol: { r: number; g: number; b: number },
  r: number = 13.5
) {
  if (sealType === 'gold_guilloche') {
    // 1. Golden Guilloche Rosette Stamp
    // Outer glow / background
    pdf.setFillColor(254, 243, 199);
    pdf.circle(cx, cy, r + 0.8, 'F');

    // Radiating teeth / rosette spokes around outer rim (36 points)
    pdf.setDrawColor(aCol.r, aCol.g, aCol.b);
    pdf.setLineWidth(0.45);
    for (let angle = 0; angle < 360; angle += 10) {
      const rad = (angle * Math.PI) / 180;
      const x1 = cx + Math.cos(rad) * (r - 1.2);
      const y1 = cy + Math.sin(rad) * (r - 1.2);
      const x2 = cx + Math.cos(rad) * (r + 0.8);
      const y2 = cy + Math.sin(rad) * (r + 0.8);
      pdf.line(x1, y1, x2, y2);
    }

    // Concentric border rings
    pdf.setLineWidth(0.7);
    pdf.circle(cx, cy, r - 0.8);
    pdf.setLineWidth(0.35);
    pdf.circle(cx, cy, r - 2.4);

    // Inner background fill
    pdf.setFillColor(255, 251, 235);
    pdf.circle(cx, cy, r - 2.5, 'F');

    // Text & Vector Stars
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(r > 11 ? 4.2 : 3.6);
    pdf.setTextColor(pCol.r, pCol.g, pCol.b);
    pdf.text('OFFICIAL', cx, cy - r * 0.42, { align: 'center' });

    // 3 Crisp Gold Vector Stars in center
    const starMidY = cy - 0.5;
    drawVectorStar(pdf, cx - 4.5, starMidY, 1.6, 0.7, aCol);
    drawVectorStar(pdf, cx, starMidY, 2.4, 1.0, aCol);
    drawVectorStar(pdf, cx + 4.5, starMidY, 1.6, 0.7, aCol);

    pdf.setFontSize(r > 11 ? 4.8 : 4.2);
    pdf.setTextColor(pCol.r, pCol.g, pCol.b);
    pdf.text('EXCELLENCE', cx, cy + 3.6, { align: 'center' });

    pdf.setFontSize(r > 11 ? 3.8 : 3.2);
    pdf.setTextColor(aCol.r, aCol.g, aCol.b);
    pdf.text('VERIFIED', cx, cy + r * 0.52, { align: 'center' });
  } else if (sealType === 'royal_ribbon') {
    // 2. Royal Ribbon Badge
    // Symmetrical Ribbon Tails with angled notches
    pdf.setFillColor(pCol.r, pCol.g, pCol.b);
    const tailYStart = cy + r * 0.65;
    const tailYEnd = tailYStart + r * 0.9;

    // Left Ribbon Tail
    pdf.triangle(cx - r * 0.7, tailYStart, cx - r * 0.15, tailYStart, cx - r * 0.65, tailYEnd, 'F');
    pdf.triangle(cx - r * 0.15, tailYStart, cx - r * 0.65, tailYEnd, cx - r * 0.3, tailYEnd - 2.5, 'F');

    // Right Ribbon Tail
    pdf.triangle(cx + r * 0.15, tailYStart, cx + r * 0.7, tailYStart, cx + r * 0.65, tailYEnd, 'F');
    pdf.triangle(cx + r * 0.15, tailYStart, cx + r * 0.65, tailYEnd, cx + r * 0.3, tailYEnd - 2.5, 'F');

    // Central circular medallion
    pdf.setFillColor(254, 240, 138);
    pdf.circle(cx, cy, r, 'F');

    pdf.setDrawColor(aCol.r, aCol.g, aCol.b);
    pdf.setLineWidth(0.9);
    pdf.circle(cx, cy, r);

    pdf.setDrawColor(pCol.r, pCol.g, pCol.b);
    pdf.setLineWidth(0.45);
    pdf.circle(cx, cy, r - 2);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(r > 11 ? 4.8 : 4.2);
    pdf.setTextColor(pCol.r, pCol.g, pCol.b);
    pdf.text('KCA MERIT', cx, cy - r * 0.35, { align: 'center' });

    // Center Vector Stars
    drawVectorStar(pdf, cx - 4.2, cy + 0.5, 1.6, 0.7, aCol);
    drawVectorStar(pdf, cx, cy + 0.5, 2.2, 0.9, aCol);
    drawVectorStar(pdf, cx + 4.2, cy + 0.5, 1.6, 0.7, aCol);

    pdf.setFontSize(r > 11 ? 4.2 : 3.6);
    pdf.setTextColor(pCol.r, pCol.g, pCol.b);
    pdf.text('CERTIFIED', cx, cy + r * 0.48, { align: 'center' });
  } else if (sealType === 'association_crest') {
    // 3. Association Embossed Crest
    pdf.setFillColor(255, 255, 255);
    pdf.circle(cx, cy, r, 'F');

    pdf.setDrawColor(pCol.r, pCol.g, pCol.b);
    pdf.setLineWidth(1.1);
    pdf.circle(cx, cy, r);

    pdf.setDrawColor(aCol.r, aCol.g, aCol.b);
    pdf.setLineWidth(0.5);
    pdf.circle(cx, cy, r - 2);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(r > 11 ? 4.5 : 3.8);
    pdf.setTextColor(pCol.r, pCol.g, pCol.b);
    pdf.text('KAIRALI', cx, cy - r * 0.42, { align: 'center' });

    drawVectorStar(pdf, cx, cy - 0.5, 2.0, 0.9, aCol);

    pdf.setFontSize(r > 11 ? 5.2 : 4.4);
    pdf.setTextColor(aCol.r, aCol.g, aCol.b);
    pdf.text('FUJAIRAH', cx, cy + 3.5, { align: 'center' });

    pdf.setFontSize(r > 11 ? 3.4 : 3.0);
    pdf.setTextColor(100, 116, 139);
    pdf.text('OFFICIAL SEAL', cx, cy + r * 0.54, { align: 'center' });
  } else if (sealType === 'traditional_kasavu') {
    // 4. Kasavu Gold & Green Cultural Lotus Emblem
    pdf.setFillColor(254, 252, 232);
    pdf.circle(cx, cy, r, 'F');

    pdf.setDrawColor(aCol.r, aCol.g, aCol.b);
    pdf.setLineWidth(1.0);
    pdf.circle(cx, cy, r);
    pdf.setLineWidth(0.35);
    pdf.circle(cx, cy, r - 2.2);

    // 8 Petal accent notches
    for (let angle = 0; angle < 360; angle += 45) {
      const rad = (angle * Math.PI) / 180;
      const x1 = cx + Math.cos(rad) * (r - 2.2);
      const y1 = cy + Math.sin(rad) * (r - 2.2);
      const x2 = cx + Math.cos(rad) * (r - 0.2);
      const y2 = cy + Math.sin(rad) * (r - 0.2);
      pdf.line(x1, y1, x2, y2);
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(r > 11 ? 4.0 : 3.5);
    pdf.setTextColor(aCol.r, aCol.g, aCol.b);
    pdf.text('KALOLSAVAM', cx, cy - r * 0.38, { align: 'center' });

    drawVectorDiamond(pdf, cx, cy - 0.5, 3.2, 3.2, pCol);

    pdf.setFontSize(r > 11 ? 5.2 : 4.5);
    pdf.setTextColor(pCol.r, pCol.g, pCol.b);
    pdf.text('A-GRADE', cx, cy + 3.8, { align: 'center' });

    pdf.setFontSize(r > 11 ? 3.8 : 3.2);
    pdf.setTextColor(aCol.r, aCol.g, aCol.b);
    pdf.text('MERIT', cx, cy + r * 0.52, { align: 'center' });
  } else if (sealType === 'luxury_gold_rosette') {
    // 5. Luxury Gold Rosette with Deep Red Ribbon Tails & Golden Trim
    const tailYStart = cy + r * 0.65;
    const tailYEnd = tailYStart + r * 1.05;

    // Left Ribbon Tail
    pdf.setFillColor(136, 19, 55); // #881337
    pdf.triangle(cx - r * 0.75, tailYStart, cx - r * 0.15, tailYStart, cx - r * 0.7, tailYEnd, 'F');
    pdf.triangle(cx - r * 0.15, tailYStart, cx - r * 0.7, tailYEnd, cx - r * 0.35, tailYEnd - 2.8, 'F');

    // Right Ribbon Tail
    pdf.triangle(cx + r * 0.15, tailYStart, cx + r * 0.75, tailYStart, cx + r * 0.7, tailYEnd, 'F');
    pdf.triangle(cx + r * 0.15, tailYStart, cx + r * 0.7, tailYEnd, cx + r * 0.35, tailYEnd - 2.8, 'F');

    // Gold trim on ribbon edges
    pdf.setDrawColor(217, 119, 6);
    pdf.setLineWidth(0.35);
    pdf.line(cx - r * 0.75, tailYStart, cx - r * 0.7, tailYEnd);
    pdf.line(cx + r * 0.75, tailYStart, cx + r * 0.7, tailYEnd);

    // Radiating Golden Rosette Medallion
    pdf.setFillColor(254, 243, 199);
    pdf.circle(cx, cy, r + 0.8, 'F');

    pdf.setDrawColor(217, 119, 6);
    pdf.setLineWidth(0.45);
    for (let angle = 0; angle < 360; angle += 10) {
      const rad = (angle * Math.PI) / 180;
      pdf.line(
        cx + Math.cos(rad) * (r - 1.2),
        cy + Math.sin(rad) * (r - 1.2),
        cx + Math.cos(rad) * (r + 0.8),
        cy + Math.sin(rad) * (r + 0.8)
      );
    }

    // Outer & Inner Gold Concentric Rings
    pdf.setLineWidth(0.85);
    pdf.circle(cx, cy, r - 0.7);
    pdf.setLineWidth(0.4);
    pdf.circle(cx, cy, r - 2.2);

    // Inner Deep Red Core
    pdf.setFillColor(136, 19, 55);
    pdf.circle(cx, cy, r - 2.3, 'F');

    // Inner Text & Gold Star
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(r > 11 ? 4.2 : 3.6);
    pdf.setTextColor(254, 240, 138);
    pdf.text('KAIRALI', cx, cy - r * 0.38, { align: 'center' });

    drawVectorStar(pdf, cx, cy - 0.3, 2.3, 1.0, { r: 251, g: 191, b: 36 });

    pdf.setFontSize(r > 11 ? 4.8 : 4.0);
    pdf.setTextColor(255, 255, 255);
    pdf.text('HONOR', cx, cy + 3.8, { align: 'center' });

    pdf.setFontSize(r > 11 ? 3.4 : 2.8);
    pdf.setTextColor(253, 230, 138);
    pdf.text('PRESTIGE SEAL', cx, cy + r * 0.54, { align: 'center' });
  }
}

/**
 * Draws a subtle, elegant security watermark in the center of the certificate
 * calibrated to ~3.5% tint so it is faint and non-distracting after export,
 * never overpowering the recipient name or citation text.
 */
function drawSubtleWatermark(
  pdf: jsPDF,
  cx: number,
  cy: number,
  aCol: { r: number; g: number; b: number },
  bgCol: { r: number; g: number; b: number } = { r: 255, g: 255, b: 255 }
) {
  try {
    // Ultra-subtle watermark blend (~3.5% tint against canvas background)
    const blendFactor = 0.035;
    const wr = Math.round(bgCol.r * (1 - blendFactor) + aCol.r * blendFactor);
    const wg = Math.round(bgCol.g * (1 - blendFactor) + aCol.g * blendFactor);
    const wb = Math.round(bgCol.b * (1 - blendFactor) + aCol.b * blendFactor);

    pdf.setDrawColor(wr, wg, wb);
    pdf.setLineWidth(0.18);

    // Concentric Guilloche Security Rings
    pdf.circle(cx, cy, 22);
    pdf.circle(cx, cy, 34);
    pdf.circle(cx, cy, 46);
    pdf.circle(cx, cy, 58);

    // 24 Delicate Radial Filigree Rays
    for (let angle = 0; angle < 360; angle += 15) {
      const rad = (angle * Math.PI) / 180;
      const x1 = cx + Math.cos(rad) * 22;
      const y1 = cy + Math.sin(rad) * 22;
      const x2 = cx + Math.cos(rad) * 58;
      const y2 = cy + Math.sin(rad) * 58;
      pdf.line(x1, y1, x2, y2);
    }

    // Inner 8-pointed star security motif
    for (let angle = 0; angle < 360; angle += 45) {
      const rad1 = (angle * Math.PI) / 180;
      const rad2 = ((angle + 22.5) * Math.PI) / 180;
      const rad3 = ((angle + 45) * Math.PI) / 180;
      pdf.line(cx + Math.cos(rad1) * 11, cy + Math.sin(rad1) * 11, cx + Math.cos(rad2) * 21, cy + Math.sin(rad2) * 21);
      pdf.line(cx + Math.cos(rad2) * 21, cy + Math.sin(rad2) * 21, cx + Math.cos(rad3) * 11, cy + Math.sin(rad3) * 11);
    }
  } catch (err) {
    console.warn('Subtle Watermark Render:', err);
  }
}

/**
 * Renders distinct graphic borders and corner filigrees
 */
function renderGraphicBorder(
  pdf: jsPDF,
  style: string,
  pw: number,
  ph: number,
  pCol: { r: number; g: number; b: number },
  sCol: { r: number; g: number; b: number },
  aCol: { r: number; g: number; b: number }
) {
  if (style === 'crimson_gold_luxury') {
    drawLuxuryPolygonalCrimsonBorders(pdf, pw, ph, pCol, sCol, aCol);
  } else if (style === 'formal_double') {
    // Outer heavy border
    pdf.setDrawColor(pCol.r, pCol.g, pCol.b);
    pdf.setLineWidth(3);
    pdf.rect(8, 8, pw - 16, ph - 16);

    // Inner thin border
    pdf.setDrawColor(aCol.r, aCol.g, aCol.b);
    pdf.setLineWidth(0.8);
    pdf.rect(12, 12, pw - 24, ph - 24);

    drawCornerAccents(pdf, 12, 12, pw - 24, ph - 24, aCol);
  } else if (style === 'gold_accent') {
    // Elegant Gold Accent - Triple Golden Frames
    pdf.setDrawColor(aCol.r, aCol.g, aCol.b);
    pdf.setLineWidth(2.2);
    pdf.rect(8, 8, pw - 16, ph - 16);

    pdf.setDrawColor(pCol.r, pCol.g, pCol.b);
    pdf.setLineWidth(0.6);
    pdf.rect(11, 11, pw - 22, ph - 22);

    pdf.setDrawColor(aCol.r, aCol.g, aCol.b);
    pdf.setLineWidth(0.4);
    pdf.rect(13, 13, pw - 26, ph - 26);

    drawCornerSunbursts(pdf, 13, 13, pw - 26, ph - 26, aCol);
  } else if (style === 'heritage_ornate') {
    // Heritage multi-tier border with Kerala Lotus Corner Accents
    pdf.setDrawColor(pCol.r, pCol.g, pCol.b);
    pdf.setLineWidth(2.5);
    pdf.rect(8, 8, pw - 16, ph - 16);

    pdf.setDrawColor(aCol.r, aCol.g, aCol.b);
    pdf.setLineWidth(1.2);
    pdf.rect(11, 11, pw - 22, ph - 22);

    pdf.setDrawColor(sCol.r, sCol.g, sCol.b);
    pdf.setLineWidth(0.4);
    pdf.rect(13, 13, pw - 26, ph - 26);

    drawCornerLotusAccents(pdf, 13, 13, pw - 26, ph - 26, aCol, pCol);
  } else if (style === 'navy_platinum') {
    // Executive Navy & Platinum double frame
    pdf.setDrawColor(pCol.r, pCol.g, pCol.b);
    pdf.setLineWidth(2.5);
    pdf.rect(8, 8, pw - 16, ph - 16);

    pdf.setDrawColor(aCol.r, aCol.g, aCol.b);
    pdf.setLineWidth(0.8);
    pdf.rect(11, 11, pw - 22, ph - 22);

    // Corner square nodes
    drawCornerSquares(pdf, 11, 11, pw - 22, ph - 22, aCol);
  } else if (style === 'festive_starburst') {
    // Festive Starburst Frame
    pdf.setDrawColor(pCol.r, pCol.g, pCol.b);
    pdf.setLineWidth(3);
    pdf.rect(7, 7, pw - 14, ph - 14);

    pdf.setDrawColor(aCol.r, aCol.g, aCol.b);
    pdf.setLineWidth(1);
    pdf.rect(11, 11, pw - 22, ph - 22);

    drawCornerSunbursts(pdf, 11, 11, pw - 22, ph - 22, aCol);
  } else if (style === 'vintage_parchment') {
    // Antique Parchment with delicate Guilloche Corners
    pdf.setDrawColor(pCol.r, pCol.g, pCol.b);
    pdf.setLineWidth(1.8);
    pdf.rect(8, 8, pw - 16, ph - 16);

    pdf.setDrawColor(aCol.r, aCol.g, aCol.b);
    pdf.setLineWidth(0.6);
    pdf.rect(11.5, 11.5, pw - 23, ph - 23);

    drawCornerAccents(pdf, 11.5, 11.5, pw - 23, ph - 23, aCol);
  } else if (style === 'emerald_flourish') {
    // Emerald Botanic Frame
    pdf.setDrawColor(pCol.r, pCol.g, pCol.b);
    pdf.setLineWidth(2.8);
    pdf.rect(8, 8, pw - 16, ph - 16);

    pdf.setDrawColor(aCol.r, aCol.g, aCol.b);
    pdf.setLineWidth(0.8);
    pdf.rect(12, 12, pw - 24, ph - 24);

    drawCornerLotusAccents(pdf, 12, 12, pw - 24, ph - 24, aCol, pCol);
  } else {
    // Minimalist clean frame
    pdf.setDrawColor(sCol.r, sCol.g, sCol.b);
    pdf.setLineWidth(0.8);
    pdf.rect(10, 10, pw - 20, ph - 20);

    pdf.setFillColor(pCol.r, pCol.g, pCol.b);
    pdf.rect(10, 10, pw - 20, 3, 'F');

    pdf.setFillColor(aCol.r, aCol.g, aCol.b);
    pdf.rect(10, ph - 13, pw - 20, 1.5, 'F');
  }
}

function drawCornerAccents(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  col: { r: number; g: number; b: number }
) {
  pdf.setDrawColor(col.r, col.g, col.b);
  pdf.setLineWidth(1.2);

  const len = 9;
  // Top-Left
  pdf.line(x, y, x + len, y);
  pdf.line(x, y, x, y + len);

  // Top-Right
  pdf.line(x + w, y, x + w - len, y);
  pdf.line(x + w, y, x + w, y + len);

  // Bottom-Left
  pdf.line(x, y + h, x + len, y + h);
  pdf.line(x, y + h, x, y + h - len);

  // Bottom-Right
  pdf.line(x + w, y + h, x + w - len, y + h);
  pdf.line(x + w, y + h, x + w, y + h - len);
}

function drawCornerSunbursts(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  col: { r: number; g: number; b: number }
) {
  pdf.setDrawColor(col.r, col.g, col.b);
  pdf.setFillColor(col.r, col.g, col.b);

  const corners = [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ];

  corners.forEach(([cx, cy]) => {
    pdf.circle(cx, cy, 1.8, 'F');
    pdf.setLineWidth(0.6);
    pdf.line(cx - 4, cy, cx + 4, cy);
    pdf.line(cx, cy - 4, cx, cy + 4);
  });
}

function drawCornerLotusAccents(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  aCol: { r: number; g: number; b: number },
  pCol: { r: number; g: number; b: number }
) {
  pdf.setFillColor(aCol.r, aCol.g, aCol.b);
  const corners = [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ];

  corners.forEach(([cx, cy]) => {
    pdf.circle(cx, cy, 2.2, 'F');
    pdf.setDrawColor(pCol.r, pCol.g, pCol.b);
    pdf.setLineWidth(0.8);
    pdf.circle(cx, cy, 4);
  });
}

function drawCornerSquares(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  col: { r: number; g: number; b: number }
) {
  pdf.setFillColor(col.r, col.g, col.b);
  const s = 3;
  pdf.rect(x - s / 2, y - s / 2, s, s, 'F');
  pdf.rect(x + w - s / 2, y - s / 2, s, s, 'F');
  pdf.rect(x - s / 2, y + h - s / 2, s, s, 'F');
  pdf.rect(x + w - s / 2, y + h - s / 2, s, s, 'F');
}

/**
 * Renders luxury low-poly faceted ruby geometric corner clusters,
 * dual metallic gold precision borders, and ornate L-shaped gold corner brackets
 */
function drawLuxuryPolygonalCrimsonBorders(
  pdf: jsPDF,
  pw: number,
  ph: number,
  pCol: { r: number; g: number; b: number },
  sCol: { r: number; g: number; b: number },
  aCol: { r: number; g: number; b: number }
) {
  // 1. Shaded low-poly facet ruby & gold palette
  const rubyDark = { r: 69, g: 10, b: 10 }; // #450A0A
  const rubyDeep = { r: 127, g: 29, b: 29 }; // #7F1D1D
  const rubyMid = { r: 153, g: 27, b: 27 }; // #991B1B
  const rubyBright = { r: 190, g: 18, b: 60 }; // #BE123C
  const rubyRoyal = { r: 136, g: 19, b: 55 }; // #881337
  const goldDark = { r: 180, g: 83, b: 9 }; // #B45309
  const goldMid = { r: 217, g: 119, b: 6 }; // #D97706
  const goldBright = { r: 245, g: 158, b: 11 }; // #F59E0B

  const fillTri = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    col: { r: number; g: number; b: number }
  ) => {
    pdf.setFillColor(col.r, col.g, col.b);
    pdf.triangle(x1, y1, x2, y2, x3, y3, 'F');
  };

  // 2. Corner Facet Clusters
  // --- TOP-LEFT CORNER FACETS ---
  fillTri(0, 0, 52, 0, 22, 20, rubyDeep);
  fillTri(0, 0, 22, 20, 0, 52, rubyRoyal);
  fillTri(52, 0, 75, 0, 42, 22, rubyDark);
  fillTri(0, 52, 0, 75, 22, 42, rubyMid);
  fillTri(22, 20, 42, 22, 22, 42, rubyBright);
  fillTri(42, 22, 54, 16, 56, 0, goldMid);
  fillTri(22, 42, 16, 54, 0, 56, goldBright);
  fillTri(22, 20, 32, 12, 42, 22, goldDark);

  // --- BOTTOM-LEFT CORNER FACETS ---
  fillTri(0, ph, 52, ph, 22, ph - 20, rubyRoyal);
  fillTri(0, ph, 22, ph - 20, 0, ph - 52, rubyDeep);
  fillTri(52, ph, 75, ph, 42, ph - 22, rubyDark);
  fillTri(0, ph - 52, 0, ph - 75, 22, ph - 42, rubyMid);
  fillTri(22, ph - 20, 42, ph - 22, 22, ph - 42, rubyBright);
  fillTri(42, ph - 22, 54, ph - 16, 56, ph, goldMid);
  fillTri(22, ph - 42, 16, ph - 54, 0, ph - 56, goldBright);
  fillTri(22, ph - 20, 32, ph - 12, 42, ph - 22, goldDark);

  // --- TOP-RIGHT CORNER FACETS ---
  fillTri(pw, 0, pw - 52, 0, pw - 22, 20, rubyDeep);
  fillTri(pw, 0, pw - 22, 20, pw, 52, rubyRoyal);
  fillTri(pw - 52, 0, pw - 75, 0, pw - 42, 22, rubyDark);
  fillTri(pw, 52, pw, 75, pw - 22, 42, rubyMid);
  fillTri(pw - 22, 20, pw - 42, 22, pw - 22, 42, rubyBright);
  fillTri(pw - 42, 22, pw - 54, 16, pw - 56, 0, goldMid);
  fillTri(pw - 22, 42, pw - 16, 54, pw, 56, goldBright);
  fillTri(pw - 22, 20, pw - 32, 12, pw - 42, 22, goldDark);

  // --- BOTTOM-RIGHT CORNER FACETS ---
  fillTri(pw, ph, pw - 52, ph, pw - 22, ph - 20, rubyRoyal);
  fillTri(pw, ph, pw - 22, ph - 20, pw, ph - 52, rubyDeep);
  fillTri(pw - 52, ph, pw - 75, ph, pw - 42, ph - 22, rubyDark);
  fillTri(pw, ph - 52, pw, ph - 75, pw - 22, ph - 42, rubyMid);
  fillTri(pw - 22, ph - 20, pw - 42, ph - 22, pw - 22, ph - 42, rubyBright);
  fillTri(pw - 42, ph - 22, pw - 54, ph - 16, pw - 56, ph, goldMid);
  fillTri(pw - 22, ph - 42, pw - 16, ph - 54, pw, ph - 56, goldBright);
  fillTri(pw - 22, ph - 20, pw - 32, ph - 12, pw - 42, ph - 22, goldDark);

  // 3. Facet line accents in subtle gold
  pdf.setDrawColor(245, 158, 11);
  pdf.setLineWidth(0.25);
  pdf.line(0, 0, 22, 20);
  pdf.line(22, 20, 42, 22);
  pdf.line(0, ph, 22, ph - 20);
  pdf.line(22, ph - 20, 42, ph - 22);
  pdf.line(pw, 0, pw - 22, 20);
  pdf.line(pw - 22, 20, pw - 42, 22);
  pdf.line(pw, ph, pw - 22, ph - 20);
  pdf.line(pw - 22, ph - 20, pw - 42, ph - 22);

  // 4. Double Precision Metallic Gold Frame
  pdf.setDrawColor(goldMid.r, goldMid.g, goldMid.b);
  pdf.setLineWidth(1.8);
  pdf.rect(10, 10, pw - 20, ph - 20);

  pdf.setDrawColor(goldBright.r, goldBright.g, goldBright.b);
  pdf.setLineWidth(0.65);
  pdf.rect(13.5, 13.5, pw - 27, ph - 27);

  // 5. Ornate Geometric Gold Corner Brackets with Diamond Nodes
  drawLuxuryCornerBracket(pdf, 13.5, 13.5, pw - 27, ph - 27, goldMid, goldBright);
}

function drawLuxuryCornerBracket(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  colPrimary: { r: number; g: number; b: number },
  colAccent: { r: number; g: number; b: number }
) {
  const arm = 14;
  pdf.setDrawColor(colPrimary.r, colPrimary.g, colPrimary.b);
  pdf.setLineWidth(1.1);

  // Top-Left L-bracket
  pdf.line(x - 2, y, x + arm, y);
  pdf.line(x, y - 2, x, y + arm);
  pdf.line(x + 2.5, y + 2.5, x + arm - 3, y + 2.5);
  pdf.line(x + 2.5, y + 2.5, x + 2.5, y + arm - 3);
  drawVectorDiamond(pdf, x + arm + 1, y, 2.4, 2.4, colAccent);
  drawVectorDiamond(pdf, x, y + arm + 1, 2.4, 2.4, colAccent);
  drawVectorDiamond(pdf, x, y, 3.2, 3.2, colPrimary);

  // Top-Right L-bracket
  pdf.line(x + w + 2, y, x + w - arm, y);
  pdf.line(x + w, y - 2, x + w, y + arm);
  pdf.line(x + w - 2.5, y + 2.5, x + w - arm + 3, y + 2.5);
  pdf.line(x + w - 2.5, y + 2.5, x + w - 2.5, y + arm - 3);
  drawVectorDiamond(pdf, x + w - arm - 1, y, 2.4, 2.4, colAccent);
  drawVectorDiamond(pdf, x + w, y + arm + 1, 2.4, 2.4, colAccent);
  drawVectorDiamond(pdf, x + w, y, 3.2, 3.2, colPrimary);

  // Bottom-Left L-bracket
  pdf.line(x - 2, y + h, x + arm, y + h);
  pdf.line(x, y + h + 2, x, y + h - arm);
  pdf.line(x + 2.5, y + h - 2.5, x + arm - 3, y + h - 2.5);
  pdf.line(x + 2.5, y + h - 2.5, x + 2.5, y + h - arm + 3);
  drawVectorDiamond(pdf, x + arm + 1, y + h, 2.4, 2.4, colAccent);
  drawVectorDiamond(pdf, x, y + h - arm - 1, 2.4, 2.4, colAccent);
  drawVectorDiamond(pdf, x, y + h, 3.2, 3.2, colPrimary);

  // Bottom-Right L-bracket
  pdf.line(x + w + 2, y + h, x + w - arm, y + h);
  pdf.line(x + w, y + h + 2, x + w, y + h - arm);
  pdf.line(x + w - 2.5, y + h - 2.5, x + w - arm + 3, y + h - 2.5);
  pdf.line(x + w - 2.5, y + h - 2.5, x + w - 2.5, y + h - arm + 3);
  drawVectorDiamond(pdf, x + w - arm - 1, y + h, 2.4, 2.4, colAccent);
  drawVectorDiamond(pdf, x + w, y + h - arm - 1, 2.4, 2.4, colAccent);
  drawVectorDiamond(pdf, x + w, y + h, 3.2, 3.2, colPrimary);
}
