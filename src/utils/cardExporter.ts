import { toPng } from 'html-to-image';
import QRCode from 'qrcode';
import { Member, CustomFieldDefinition } from '../types/member';
import { IdCardDesignId } from '../types/cardDesign';
import { HeaderTitleStyle } from '../types/portal';
import { formatCardBloodGroup, formatCardDate, getMemberVerifyUrl } from './idGenerator';
import { getActiveLogoPngDataUrl } from '../components/Logo';
import { loadCustomLogo, loadPortalConfig } from './storage';
import {
  getTitleLockupLines,
  getTrimmedTitleGraphicDataUrl,
  resolveEffectiveTitleStyle,
} from './titleGraphic';

/**
 * Trigger file download for a data URL or blob
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
  }, 150);
}

/**
 * Preloads all <img> tags inside an element to ensure complete rendering
 */
async function preloadImages(element: HTMLElement): Promise<void> {
  const imgElements = Array.from(element.querySelectorAll('img'));
  const promises = imgElements.map(async (img) => {
    if (!img.complete || img.naturalHeight === 0) {
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    }
    if (typeof img.decode === 'function') {
      try {
        await img.decode();
      } catch {
        // Ignore decode rejection for SVGs or partial assets
      }
    }
  });
  await Promise.all(promises);
}

/**
 * Captures an HTML element as high-resolution PNG using html-to-image
 */
export async function captureElementAsPng(
  element: HTMLElement,
  options: {
    pixelRatio?: number;
    backgroundColor?: string;
    quality?: number;
  } = {}
): Promise<string> {
  const { pixelRatio = 3, backgroundColor = '#ffffff', quality = 1.0 } = options;

  await preloadImages(element);
  await new Promise((resolve) => setTimeout(resolve, 60));

  try {
    const dataUrl = await toPng(element, {
      pixelRatio,
      backgroundColor,
      quality,
      cacheBust: false,
      skipFonts: true,
      fontEmbedCSS: '',
      style: {
        transform: 'none',
        margin: '0',
      },
      filter: (domNode) => {
        if (domNode instanceof HTMLElement && domNode.classList.contains('no-export')) {
          return false;
        }
        return true;
      },
    });

    return dataUrl;
  } catch (error) {
    console.warn('High-res toPng capture failed, retrying with pixelRatio 2...', error);
    try {
      const fallbackDataUrl = await toPng(element, {
        pixelRatio: 2,
        backgroundColor,
        quality: 0.95,
        cacheBust: false,
        skipFonts: true,
        fontEmbedCSS: '',
      });
      return fallbackDataUrl;
    } catch (fallbackError) {
      console.error('html-to-image fallback failed:', fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Helper to draw a rounded rectangle on Canvas
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill = true,
  stroke = false
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

/**
 * Pixel-Perfect Canvas Generator for KCA ID Card (Front View)
 * Matches IdCard.tsx layout 100% at 300-DPI high resolution (1440x900)
 */
export async function generateDirectCardPng(
  member: Member,
  customFields: CustomFieldDefinition[] = [],
  cardOptions?: { cardDesign?: IdCardDesignId; titleStyle?: HeaderTitleStyle }
): Promise<string> {
  // First check if matching DOM element is currently mounted in document
  const domIds = [
    `batch-front-${member.id}-front`,
    `visible-card-${member.id}-front`,
    `public-card-${member.id}-front`,
    `export-card-${member.id}-front`,
    `kca-id-card-${member.id}-front`,
  ];

  for (const id of domIds) {
    const el = document.getElementById(id);
    if (el) {
      try {
        return await captureElementAsPng(el, { pixelRatio: 3, backgroundColor: '#ffffff' });
      } catch (e) {
        console.warn('DOM capture attempt failed, rendering direct canvas...', e);
      }
    }
  }

  const width = 1440; // 3x of 480px
  const height = 900;  // 3x of 300px

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot create 2d canvas context');

  // 1. Background White Card with rounded corners
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 2. Subtle Geometric Watermark Background
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(720, 0);
  ctx.lineTo(540, 540);
  ctx.lineTo(0, 420);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.moveTo(720, 0);
  ctx.lineTo(1440, 0);
  ctx.lineTo(1260, 480);
  ctx.lineTo(540, 540);
  ctx.closePath();
  ctx.fill();

  // 3. Top-Right Red Waves (Matched from SVG in IdCard.tsx)
  // Outer Deep Dark Maroon Base (#7f1d1d)
  ctx.fillStyle = '#7f1d1d';
  ctx.beginPath();
  ctx.moveTo(720, 0);
  ctx.lineTo(1440, 0);
  ctx.lineTo(1440, 225);
  ctx.bezierCurveTo(1230, 210, 1020, 246, 810, 204);
  ctx.bezierCurveTo(600, 162, 390, 90, 720, 0);
  ctx.closePath();
  ctx.fill();

  // Mid Layer Scarlet Red Wave (#991b1b)
  ctx.fillStyle = '#991b1b';
  ctx.beginPath();
  ctx.moveTo(780, 0);
  ctx.lineTo(1440, 0);
  ctx.lineTo(1440, 180);
  ctx.bezierCurveTo(1200, 165, 990, 195, 780, 156);
  ctx.bezierCurveTo(570, 120, 360, 60, 780, 0);
  ctx.closePath();
  ctx.fill();

  // Top Vibrant Crimson Ribbon (#b91c1c)
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.moveTo(855, 0);
  ctx.lineTo(1440, 0);
  ctx.lineTo(1440, 135);
  ctx.bezierCurveTo(1170, 120, 960, 144, 750, 108);
  ctx.bezierCurveTo(540, 75, 390, 36, 855, 0);
  ctx.closePath();
  ctx.fill();

  // White highlight lines
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 7.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(765, 0);
  ctx.bezierCurveTo(900, 66, 1014, 132, 1125, 168);
  ctx.bezierCurveTo(1230, 201, 1335, 174, 1440, 192);
  ctx.stroke();

  // 4. Bottom-Left Red Flowing Waves Graphic
  ctx.fillStyle = '#7f1d1d';
  ctx.beginPath();
  ctx.moveTo(0, 900);
  ctx.lineTo(720, 900);
  ctx.bezierCurveTo(525, 900, 420, 810, 315, 840);
  ctx.bezierCurveTo(210, 870, 105, 780, 0, 780);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#991b1b';
  ctx.beginPath();
  ctx.moveTo(0, 900);
  ctx.lineTo(630, 900);
  ctx.bezierCurveTo(465, 900, 375, 831, 285, 855);
  ctx.bezierCurveTo(195, 879, 90, 810, 0, 810);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.moveTo(0, 900);
  ctx.lineTo(540, 900);
  ctx.bezierCurveTo(405, 900, 330, 849, 240, 870);
  ctx.bezierCurveTo(150, 891, 75, 840, 0, 840);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 7.5;
  ctx.beginPath();
  ctx.moveTo(0, 770);
  ctx.bezierCurveTo(114, 770, 216, 860, 324, 830);
  ctx.bezierCurveTo(426, 800, 534, 890, 720, 890);
  ctx.stroke();

  // 5. TOP HEADER: Draw Emblem Logo & Header Typography according to configured Title Style
  const portalConfig = loadPortalConfig();
  const effectiveTitleStyle = resolveEffectiveTitleStyle(
    portalConfig,
    'member_card',
    cardOptions?.titleStyle
  );
  const activeCustomLogo =
    portalConfig.customLogoUrl !== undefined ? portalConfig.customLogoUrl : loadCustomLogo();
  const hasCustomLogoWithoutCustomBanner = !portalConfig.customTitleGraphicUrl && !!activeCustomLogo;

  if (effectiveTitleStyle === 'title_graphic' && !hasCustomLogoWithoutCustomBanner) {
    try {
      const { dataUrl, aspectRatio } = await getTrimmedTitleGraphicDataUrl(
        portalConfig.customTitleGraphicUrl,
        true
      );
      const titleImg = new Image();
      if (/^https?:\/\//i.test(dataUrl)) {
        titleImg.crossOrigin = 'anonymous';
      }
      await new Promise<void>((resolve) => {
        titleImg.onload = () => resolve();
        titleImg.onerror = () => resolve();
        titleImg.src = dataUrl;
      });
      if (titleImg.complete && titleImg.naturalWidth > 0) {
        const drawH = 126;
        const drawW = Math.min(640, drawH * aspectRatio);
        ctx.drawImage(titleImg, 48, 36, drawW, drawH);
      }
    } catch (err) {
      console.warn('Canvas direct title graphic draw failed:', err);
    }
    ctx.fillStyle = '#b91c1c';
    ctx.font = '700 20px "Arial", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(portalConfig.affiliationText || 'NORKA Roots Affiliated', 52, 186);
  } else {
    try {
      const logoDataUrl = await getActiveLogoPngDataUrl();
      const logoImg = new Image();
      if (/^https?:\/\//i.test(logoDataUrl)) {
        logoImg.crossOrigin = 'anonymous';
      }
      await new Promise<void>((resolve) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = () => resolve();
        logoImg.src = logoDataUrl;
      });
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        ctx.drawImage(logoImg, 48, 38, 144, 144);
      }
    } catch (err) {
      console.warn('Canvas direct card logo draw failed:', err);
    }

    if (effectiveTitleStyle === 'official_lockup' || effectiveTitleStyle === 'title_graphic') {
      const { line1, line2, line3 } = getTitleLockupLines(portalConfig);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      const centerTextX = 435;

      ctx.fillStyle = '#dc2626';
      ctx.font = '700 54px "Georgia", "Times New Roman", serif';
      ctx.fillText(line1, centerTextX, 92);

      if (line2) {
        ctx.fillStyle = '#0f172a';
        ctx.font = '800 23px "Arial", sans-serif';
        ctx.fillText(line2, centerTextX, 122);
      }
      if (line3) {
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 24px "Arial", sans-serif';
        ctx.fillText(line3, centerTextX, 152);
      }
      ctx.fillStyle = '#b91c1c';
      ctx.font = '700 18px "Arial", sans-serif';
      ctx.fillText(portalConfig.affiliationText || 'NORKA Roots Affiliated', centerTextX, 180);
      ctx.textAlign = 'left';
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.font = '900 36px "Arial", sans-serif';
      ctx.fillText((portalConfig.portalName || 'KAIRALI CULTURAL ASSOCIATION').toUpperCase(), 210, 82);

      ctx.font = '900 30px "Arial", sans-serif';
      ctx.fillText((portalConfig.jurisdiction || 'FUJAIRAH').toUpperCase(), 210, 122);

      ctx.fillStyle = '#b91c1c';
      ctx.font = '700 22px "Arial", sans-serif';
      ctx.fillText(portalConfig.affiliationText || 'A NORKA Roots Affiliated Association', 210, 158);
    }
  }

  // 6. MAIN CARD BODY: Member Photo Frame (Left)
  const photoOuterX = 54;
  const photoOuterY = 216;
  const photoOuterW = 330;
  const photoOuterH = 390;

  // White base with red border
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 6;
  drawRoundedRect(ctx, photoOuterX, photoOuterY, photoOuterW, photoOuterH, 24, true, true);

  // Inner Photo Box
  const photoInnerX = photoOuterX + 12;
  const photoInnerY = photoOuterY + 12;
  const photoInnerW = photoOuterW - 24;
  const photoInnerH = photoOuterH - 24;

  ctx.fillStyle = '#f1f5f9';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, photoInnerX, photoInnerY, photoInnerW, photoInnerH, 16, true, true);

  // Load and draw photo if provided
  let photoDrawn = false;
  if (member.photoUrl && member.photoUrl.trim()) {
    try {
      const img = new Image();
      if (/^https?:\/\//i.test(member.photoUrl)) {
        img.crossOrigin = 'anonymous';
      }
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = member.photoUrl;
      });
      if (img.complete && img.naturalWidth > 0) {
        ctx.save();
        // Clip to inner rounded rectangle
        ctx.beginPath();
        drawRoundedRect(ctx, photoInnerX, photoInnerY, photoInnerW, photoInnerH, 16, false, false);
        ctx.clip();
        ctx.drawImage(img, photoInnerX, photoInnerY, photoInnerW, photoInnerH);
        ctx.restore();
        photoDrawn = true;
      }
    } catch (photoErr) {
      console.warn('Failed to load member photo:', photoErr);
    }
  }

  // Draw clean placeholder if no photo was drawn
  if (!photoDrawn) {
    ctx.save();
    ctx.beginPath();
    drawRoundedRect(ctx, photoInnerX, photoInnerY, photoInnerW, photoInnerH, 16, false, false);
    ctx.clip();

    // Neutral background
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(photoInnerX, photoInnerY, photoInnerW, photoInnerH);

    // Draw user silhouette icon
    const centerX = photoInnerX + photoInnerW / 2;
    const headY = photoInnerY + photoInnerH * 0.38;
    const headR = 36;

    ctx.fillStyle = '#cbd5e1';
    // Head circle
    ctx.beginPath();
    ctx.arc(centerX, headY, headR, 0, Math.PI * 2);
    ctx.fill();

    // Shoulders arc
    ctx.beginPath();
    ctx.ellipse(centerX, photoInnerY + photoInnerH * 0.82, 60, 42, 0, 0, Math.PI * 2);
    ctx.fill();

    // "PHOTO" label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 18px "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PHOTO', centerX, photoInnerY + photoInnerH - 16);

    ctx.restore();
  }

  // 7. RIGHT SIDE: "MEMBERSHIP ID CARD" Solid Red Pill
  const rightX = 420;
  const pillY = 216;
  const pillW = 440;
  const pillH = 50;

  ctx.fillStyle = '#b91c1c';
  drawRoundedRect(ctx, rightX, pillY, pillW, pillH, 25, true, false);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 26px "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MEMBERSHIP ID CARD', rightX + pillW / 2, pillY + pillH / 2 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Member Name in Bold Red Uppercase
  ctx.fillStyle = '#b91c1c';
  ctx.font = '900 40px "Arial", sans-serif';
  const truncatedName = member.fullName.length > 28 ? member.fullName.slice(0, 27) + '…' : member.fullName;
  ctx.fillText(truncatedName.toUpperCase(), rightX, 312);

  // 8. TABULAR DETAILS (Member ID, Unit, Blood group, Validity, NORKA ID)
  const detailStartY = 370;
  const lineSpacing = 42;
  const col1X = rightX;
  const colonX = rightX + 220;
  const col2X = rightX + 250;

  const rows: { label: string; value: string; isMono?: boolean }[] = [
    { label: 'Member ID', value: member.membershipId, isMono: true },
    { label: 'Unit', value: `${member.unit} Unit` },
    { label: 'Blood group', value: formatCardBloodGroup(member.bloodGroup) },
    { label: 'Validity', value: formatCardDate(member.expiryDate) },
  ];

  if (member.norkaId && member.norkaId.trim()) {
    rows.push({ label: 'NORKA ID', value: member.norkaId.trim(), isMono: true });
  }

  // Custom fields
  const activeCustomFields = customFields.filter((cf) => cf.showOnIdCard !== false);
  for (const cf of activeCustomFields) {
    const val = member.customFields?.[cf.id];
    if (val) {
      rows.push({ label: cf.label, value: String(val) });
    }
  }

  rows.forEach((row, index) => {
    const yPos = detailStartY + index * lineSpacing;
    if (yPos > 730) return; // Prevent overflow into QR zone

    // Label
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 28px "Arial", sans-serif';
    ctx.fillText(row.label, col1X, yPos);

    // Colon
    ctx.fillText(':', colonX, yPos);

    // Value
    if (row.isMono) {
      ctx.font = '700 28px "Courier New", monospace';
    } else {
      ctx.font = '700 28px "Arial", sans-serif';
    }
    ctx.fillText(row.value, col2X, yPos);
  });

  // 9. BOTTOM-RIGHT: QR Code Container
  const qrBoxSize = 160;
  const qrX = width - qrBoxSize - 45;
  const qrY = height - qrBoxSize - 45;

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, qrX, qrY, qrBoxSize, qrBoxSize, 18, true, true);

  try {
    const verifyUrl = getMemberVerifyUrl(member);
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 280,
      color: { dark: '#0f172a', light: '#ffffff' },
    });

    const qrImg = new Image();
    if (/^https?:\/\//i.test(qrDataUrl)) {
      qrImg.crossOrigin = 'anonymous';
    }
    await new Promise<void>((resolve) => {
      qrImg.onload = () => resolve();
      qrImg.onerror = () => resolve();
      qrImg.src = qrDataUrl;
    });
    if (qrImg.complete && qrImg.naturalWidth > 0) {
      ctx.drawImage(qrImg, qrX + 10, qrY + 10, qrBoxSize - 20, qrBoxSize - 20);
    }
  } catch (qrErr) {
    console.warn('Canvas direct QR code draw error:', qrErr);
  }

  // 10. Outer Crisp Border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 1, 1, width - 2, height - 2, 45, false, true);

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Pixel-Perfect Canvas Generator for ID Card (Back View)
 * Matches IdCard.tsx back side 100% at 300-DPI high resolution (1440x900)
 */
export async function generateDirectBackCardPng(
  member: Member,
  _customFields: CustomFieldDefinition[] = [],
  _cardOptions?: { cardDesign?: IdCardDesignId; titleStyle?: HeaderTitleStyle }
): Promise<string> {
  const domIds = [
    `batch-back-${member.id}-back`,
    `visible-card-${member.id}-back`,
    `public-card-${member.id}-back`,
    `export-card-${member.id}-back`,
    `kca-id-card-${member.id}-back`,
  ];

  for (const id of domIds) {
    const el = document.getElementById(id);
    if (el) {
      try {
        return await captureElementAsPng(el, { pixelRatio: 3, backgroundColor: '#ffffff' });
      } catch (e) {
        console.warn('DOM capture attempt failed, rendering direct canvas...', e);
      }
    }
  }

  const width = 1440;
  const height = 900;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot create 2d canvas context');

  // 1. Background White Card
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 2. Geometric Watermark Background
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(720, 0);
  ctx.lineTo(540, 540);
  ctx.lineTo(0, 420);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.moveTo(720, 0);
  ctx.lineTo(1440, 0);
  ctx.lineTo(1260, 480);
  ctx.lineTo(540, 540);
  ctx.closePath();
  ctx.fill();

  const portalConfig = loadPortalConfig();
  const orgNameDisplay = portalConfig.portalName || 'Kairali Cultural Association Fujairah';
  const orgShortDisplay = portalConfig.shortName || orgNameDisplay;
  const orgColor = portalConfig.primaryColor || '#991b1b';

  // 3. Top Header Banner
  ctx.fillStyle = orgColor;
  ctx.fillRect(0, 0, width, 110);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(0, 104, width, 6);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 32px "Arial", sans-serif';
  ctx.fillText(orgNameDisplay.toUpperCase(), 60, 68);

  ctx.fillStyle = '#fee2e2';
  ctx.font = '700 24px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('TERMS & CONDITIONS', width - 60, 68);
  ctx.textAlign = 'left';

  // 4. Terms and Rules Box
  const rulesBoxY = 140;
  const rulesBoxH = 300;
  ctx.fillStyle = 'rgba(248, 250, 252, 0.95)';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 45, rulesBoxY, width - 90, rulesBoxH, 20, true, true);

  const drawNumberedRule = (num: string, text1: string, text2: string, yPos: number) => {
    ctx.fillStyle = orgColor;
    ctx.font = '900 28px "Arial", sans-serif';
    ctx.fillText(num, 75, yPos);

    ctx.fillStyle = '#334155';
    ctx.font = '500 26px "Arial", sans-serif';
    ctx.fillText(text1, 120, yPos);
    if (text2) {
      ctx.fillText(text2, 120, yPos + 34);
    }
  };

  drawNumberedRule('1.', 'This identity card is non-transferable and remains the official property of', `${orgNameDisplay}.`, rulesBoxY + 50);
  drawNumberedRule('2.', 'Entitles active member to official privileges, organizational programs,', 'activities, community initiatives, and welfare support.', rulesBoxY + 140);
  drawNumberedRule('3.', `If found, please return to ${orgShortDisplay} Administration Office or`, `hand over to any authorized ${portalConfig.unitTerm || 'Unit'} Coordinator.`, rulesBoxY + 230);

  // 5. Emergency Contacts & Head Office Box
  const contactBoxY = 460;
  const contactBoxH = 200;
  ctx.fillStyle = 'rgba(248, 250, 252, 0.95)';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 45, contactBoxY, width - 90, contactBoxH, 20, true, true);

  // Left column: Emergency Contact
  ctx.fillStyle = '#64748b';
  ctx.font = '700 22px "Arial", sans-serif';
  ctx.fillText('EMERGENCY CONTACT:', 75, contactBoxY + 45);

  ctx.fillStyle = '#0f172a';
  ctx.font = '700 28px "Arial", sans-serif';
  ctx.fillText(
    `${member.emergencyContactName || orgShortDisplay + ' Helpline'} (${member.emergencyContactRelation || 'Relation'})`,
    75,
    contactBoxY + 90
  );

  ctx.fillStyle = orgColor;
  ctx.font = '700 28px "Courier New", monospace';
  ctx.fillText(member.emergencyContactPhone || member.phoneUAE || '+971 50 000 0000', 75, contactBoxY + 135);

  // Right column: Head Office
  const rightColX = 750;
  ctx.fillStyle = '#64748b';
  ctx.font = '700 22px "Arial", sans-serif';
  ctx.fillText('AFFILIATION & HEAD OFFICE:', rightColX, contactBoxY + 45);

  ctx.fillStyle = '#0f172a';
  ctx.font = '700 26px "Arial", sans-serif';
  ctx.fillText(portalConfig.jurisdiction || 'United Arab Emirates', rightColX, contactBoxY + 90);

  ctx.fillStyle = orgColor;
  ctx.font = '700 24px "Arial", sans-serif';
  ctx.fillText(portalConfig.affiliationText || portalConfig.subtitle || '', rightColX, contactBoxY + 135);

  // 6. Signatures & Bottom Bar
  ctx.strokeStyle = '#94a3b8';
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(75, 780);
  ctx.lineTo(420, 780);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#64748b';
  ctx.font = 'italic 20px "Arial", sans-serif';
  ctx.fillText('Authorized Signature', 160, 765);

  ctx.fillStyle = '#334155';
  ctx.font = '700 24px "Arial", sans-serif';
  ctx.fillText('Authorized Signatory', 110, 825);

  // Member ID & Central Committee label
  ctx.textAlign = 'right';
  ctx.fillStyle = '#475569';
  ctx.font = '700 24px "Courier New", monospace';
  ctx.fillText(`ID: ${member.membershipId}`, width - 75, 775);

  ctx.fillStyle = orgColor;
  ctx.font = '700 26px "Arial", sans-serif';
  ctx.fillText(`${orgShortDisplay} • Central Committee`, width - 75, 825);
  ctx.textAlign = 'left';

  // Outer Border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 1, 1, width - 2, height - 2, 45, false, true);

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * High-Reliability ID Card Download
 */
export async function downloadMemberIdCardPng(
  member: Member,
  customFields: CustomFieldDefinition[] = []
): Promise<void> {
  const sanitizedName = member.fullName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `KCA_ID_${member.membershipId}_${sanitizedName}_FRONT.png`;

  const canvasDataUrl = await generateDirectCardPng(member, customFields);
  downloadDataUrl(canvasDataUrl, filename);
}
