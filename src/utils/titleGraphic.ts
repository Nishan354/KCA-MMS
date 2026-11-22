import { HeaderTitleStyle, PortalBrandingConfig } from '../types/portal';

/**
 * Local path to the attached official KCA title graphic asset.
 */
export const OFFICIAL_TITLE_ASSET_PATH = '/assets/aistudio/template_1daab234.png';

export type TitleSurface = 'member_card' | 'student_card' | 'certificate';

/**
 * Determines which header title style should render on a given surface,
 * respecting explicit overrides and per-surface toggles in PortalBrandingConfig.
 */
export function resolveEffectiveTitleStyle(
  portalConfig: PortalBrandingConfig,
  surface: TitleSurface,
  override?: HeaderTitleStyle
): HeaderTitleStyle {
  if (override) {
    return override;
  }

  const configuredStyle: HeaderTitleStyle = portalConfig.headerTitleStyle || 'official_lockup';
  if (configuredStyle === 'standard') {
    return 'standard';
  }

  if (surface === 'member_card' && portalConfig.applyTitleToMemberCards === false) {
    return 'standard';
  }
  if (surface === 'student_card' && portalConfig.applyTitleToStudentCards === false) {
    return 'standard';
  }
  if (surface === 'certificate' && portalConfig.applyTitleToCertificates === false) {
    return 'standard';
  }

  return configuredStyle;
}

/**
 * Resolves the 3 lockup text lines cleanly so custom organizations still work seamlessly
 * even when using the signature Official Lockup typography.
 */
export function getTitleLockupLines(portalConfig: PortalBrandingConfig): {
  line1: string;
  line2: string;
  line3: string;
} {
  const isDefaultKca =
    !portalConfig.portalName ||
    portalConfig.portalName.toLowerCase().includes('kairali');

  if (isDefaultKca) {
    return {
      line1: portalConfig.titleLine1?.trim() || 'KAIRALI',
      line2: portalConfig.titleLine2?.trim() || 'CULTURAL ASSOCIATION',
      line3: portalConfig.titleLine3?.trim() || 'Fujairah',
    };
  }

  const words = portalConfig.portalName.trim().split(/\s+/);
  const derivedLine1 = portalConfig.titleLine1 && portalConfig.titleLine1 !== 'KAIRALI'
    ? portalConfig.titleLine1
    : (words[0] || portalConfig.shortName || 'ORGANIZATION').toUpperCase();
  const derivedLine2 = portalConfig.titleLine2 && portalConfig.titleLine2 !== 'CULTURAL ASSOCIATION'
    ? portalConfig.titleLine2
    : (words.slice(1).join(' ') || portalConfig.subtitle || 'OFFICIAL PORTAL').toUpperCase();
  const derivedLine3 = portalConfig.titleLine3 && portalConfig.titleLine3 !== 'Fujairah'
    ? portalConfig.titleLine3
    : (portalConfig.jurisdiction?.split(/[•,]/)[0]?.trim() || '');

  return {
    line1: derivedLine1,
    line2: derivedLine2,
    line3: derivedLine3,
  };
}

interface TrimmedGraphicResult {
  dataUrl: string;
  aspectRatio: number;
}

const trimmedCache = new Map<string, TrimmedGraphicResult>();

/**
 * Loads the official title graphic (/assets/aistudio/template_1daab234.png or custom banner),
 * automatically crops excessive uniform white margins on an offscreen canvas so it renders crisp
 * and full-scale on ID cards and PDF certificates, and converts pure white backdrop pixels
 * cleanly to transparent (while keeping the emblem interior intact).
 */
export async function getTrimmedTitleGraphicDataUrl(
  customUrl?: string | null,
  transparentBackground = true
): Promise<TrimmedGraphicResult> {
  const source = customUrl || OFFICIAL_TITLE_ASSET_PATH;
  const cacheKey = `${source}::${transparentBackground ? 'tr' : 'wh'}`;
  const cached = trimmedCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { dataUrl: source, aspectRatio: 4.5 };
  }

  try {
    const result = await new Promise<TrimmedGraphicResult>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;
          if (!w || !h) {
            resolve({ dataUrl: source, aspectRatio: 4.5 });
            return;
          }

          const srcCanvas = document.createElement('canvas');
          srcCanvas.width = w;
          srcCanvas.height = h;
          const srcCtx = srcCanvas.getContext('2d');
          if (!srcCtx) {
            resolve({ dataUrl: source, aspectRatio: w / h });
            return;
          }

          srcCtx.drawImage(img, 0, 0, w, h);
          const imgData = srcCtx.getImageData(0, 0, w, h);
          const data = imgData.data;

          let minX = w;
          let minY = h;
          let maxX = -1;
          let maxY = -1;

          // Scan for non-white / non-transparent content pixels
          for (let y = 0; y < h; y++) {
            const rowOffset = y * w * 4;
            for (let x = 0; x < w; x++) {
              const idx = rowOffset + x * 4;
              const a = data[idx + 3];
              if (a < 20) continue;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              // Anything darker than near-white (#f3f3f3) counts as foreground artwork
              if (r < 243 || g < 243 || b < 243) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          if (maxX <= minX || maxY <= minY) {
            resolve({ dataUrl: source, aspectRatio: w / h });
            return;
          }

          const pad = Math.max(6, Math.round(Math.min(maxX - minX, maxY - minY) * 0.04));
          const cropX = Math.max(0, minX - pad);
          const cropY = Math.max(0, minY - pad);
          const cropW = Math.min(w - cropX, maxX - minX + pad * 2);
          const cropH = Math.min(h - cropY, maxY - minY + pad * 2);

          // Optionally key out outer near-white margin pixels using edge flood fill so inner whites stay opaque
          if (transparentBackground) {
            const croppedData = srcCtx.getImageData(cropX, cropY, cropW, cropH);
            const cd = croppedData.data;
            const visited = new Uint8Array(cropW * cropH);
            const queue = new Int32Array(cropW * cropH);
            let qHead = 0;
            let qTail = 0;

            const isNearWhite = (pixelIdx: number) => {
              const i = pixelIdx * 4;
              return cd[i + 3] < 20 || (cd[i] >= 242 && cd[i + 1] >= 242 && cd[i + 2] >= 242);
            };

            const enqueueIfWhite = (x: number, y: number) => {
              if (x < 0 || y < 0 || x >= cropW || y >= cropH) return;
              const pIdx = y * cropW + x;
              if (visited[pIdx]) return;
              if (isNearWhite(pIdx)) {
                visited[pIdx] = 1;
                queue[qTail++] = pIdx;
              }
            };

            for (let x = 0; x < cropW; x++) {
              enqueueIfWhite(x, 0);
              enqueueIfWhite(x, cropH - 1);
            }
            for (let y = 0; y < cropH; y++) {
              enqueueIfWhite(0, y);
              enqueueIfWhite(cropW - 1, y);
            }

            while (qHead < qTail) {
              const pIdx = queue[qHead++];
              cd[pIdx * 4 + 3] = 0;
              const px = pIdx % cropW;
              const py = (pIdx - px) / cropW;
              enqueueIfWhite(px + 1, py);
              enqueueIfWhite(px - 1, py);
              enqueueIfWhite(px, py + 1);
              enqueueIfWhite(px, py - 1);
            }

            const outCanvas = document.createElement('canvas');
            outCanvas.width = cropW;
            outCanvas.height = cropH;
            const outCtx = outCanvas.getContext('2d');
            if (outCtx) {
              outCtx.putImageData(croppedData, 0, 0);
              resolve({
                dataUrl: outCanvas.toDataURL('image/png'),
                aspectRatio: cropW / cropH,
              });
              return;
            }
          }

          const outCanvas = document.createElement('canvas');
          outCanvas.width = cropW;
          outCanvas.height = cropH;
          const outCtx = outCanvas.getContext('2d');
          if (outCtx) {
            outCtx.drawImage(srcCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
            resolve({
              dataUrl: outCanvas.toDataURL('image/png'),
              aspectRatio: cropW / cropH,
            });
            return;
          }

          resolve({ dataUrl: source, aspectRatio: w / h });
        } catch (err) {
          console.warn('Title graphic crop fallback:', err);
          resolve({ dataUrl: source, aspectRatio: 4.5 });
        }
      };
      img.onerror = () => {
        resolve({ dataUrl: source, aspectRatio: 4.5 });
      };
      img.src = source;
    });

    trimmedCache.set(cacheKey, result);
    return result;
  } catch {
    return { dataUrl: source, aspectRatio: 4.5 };
  }
}

export function invalidateTitleGraphicCache(): void {
  trimmedCache.clear();
}
