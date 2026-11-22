import React, { useId, useState, useEffect, useMemo } from 'react';
import { loadCustomLogo, loadPortalConfig } from '../utils/storage';
import { STORAGE_KEY_PORTAL_CONFIG } from '../types/portal';


interface LogoProps {
  size?: number | string;
  className?: string;
  showText?: boolean;
  customLogoUrl?: string | null;
}

/**
 * Hook to retrieve and listen for custom logo updates
 */
export function useCustomLogo(): {
  customLogo: string | null;
  setCustomLogoState: (url: string | null) => void;
} {
  const [customLogo, setCustomLogo] = useState<string | null>(() => loadCustomLogo());

  useEffect(() => {
    const handleLogoChange = (e: Event) => {
      const customEvent = e as CustomEvent<string | null>;
      const hasDetail = 'detail' in customEvent && customEvent.detail !== undefined;
      setCustomLogo(hasDetail ? customEvent.detail : loadCustomLogo());
    };

    const handleConfigChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ customLogoUrl?: string | null }>;
      if (customEvent.detail && customEvent.detail.customLogoUrl !== undefined) {
        setCustomLogo(customEvent.detail.customLogoUrl ?? null);
      } else {
        setCustomLogo(loadCustomLogo());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'kca_fujairah_custom_logo_v1' || e.key === STORAGE_KEY_PORTAL_CONFIG) {
        setCustomLogo(loadCustomLogo());
      }
    };

    window.addEventListener('kca-custom-logo-changed', handleLogoChange);
    window.addEventListener('kca-portal-config-changed', handleConfigChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('kca-custom-logo-changed', handleLogoChange);
      window.removeEventListener('kca-portal-config-changed', handleConfigChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return { customLogo, setCustomLogoState: setCustomLogo };
}

/**
 * Standard Standalone Official SVG String for KCA Fujairah Emblem
 * Clean, perfectly concentric, and aligned so that all circles and arcs share the exact (120, 120) center.
 */
export const OFFICIAL_KCA_EMBLEM_SVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 240 240" width="240" height="240">
  <defs>
    <linearGradient id="kcaBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#991b1b" />
      <stop offset="50%" stop-color="#800000" />
      <stop offset="100%" stop-color="#600000" />
    </linearGradient>
    <radialGradient id="kcaSunGrad" cx="50%" cy="100%" r="90%">
      <stop offset="0%" stop-color="#fffde7" />
      <stop offset="50%" stop-color="#fbc02d" />
      <stop offset="100%" stop-color="#f57f17" />
    </radialGradient>
    <!-- Top Text Arc: Exactly centered at (120, 120) with Radius 92 -->
    <path id="kcaTopArcPath" d="M 28 120 A 92 92 0 0 1 212 120" fill="none" />
    <!-- Bottom Text Arc: Exactly centered at (120, 120) with Radius 92 -->
    <path id="kcaBottomArcPath" d="M 212 120 A 92 92 0 0 1 28 120" fill="none" />
  </defs>

  <!-- Outer Deep Crimson Ring with Golden Border -->
  <circle cx="120" cy="120" r="114" fill="url(#kcaBgGrad)" stroke="#f59e0b" stroke-width="3.2" />
  <circle cx="120" cy="120" r="109" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.9" />

  <!-- Inner Disc Base (White) -->
  <circle cx="120" cy="120" r="76" fill="#ffffff" stroke="#f59e0b" stroke-width="2.8" />

  <!-- Top Circular Text: KAIRALI CULTURAL ASSOCIATION -->
  <text fill="#ffffff" font-size="13" font-weight="900" font-family="'Arial Black', Arial, sans-serif" letter-spacing="1.2">
    <textPath href="#kcaTopArcPath" xlink:href="#kcaTopArcPath" startOffset="50%" text-anchor="middle">
      KAIRALI CULTURAL ASSOCIATION
    </textPath>
  </text>

  <!-- Bottom Circular Text: FUJAIRAH • UAE -->
  <text fill="#fef08a" font-size="13.5" font-weight="900" font-family="'Arial Black', Arial, sans-serif" letter-spacing="2">
    <textPath href="#kcaBottomArcPath" xlink:href="#kcaBottomArcPath" startOffset="50%" text-anchor="middle">
      FUJAIRAH • UAE
    </textPath>
  </text>

  <!-- Inner Center Shield Area -->
  <g>
    <!-- Upper Fan / Rising Sun Arcs -->
    <!-- Green Arc -->
    <path d="M 52 120 A 68 68 0 0 1 188 120 L 176 120 A 56 56 0 0 0 64 120 Z" fill="#047857" />
    <!-- Cyan Arc -->
    <path d="M 64 120 A 56 56 0 0 1 176 120 L 168 120 A 48 48 0 0 0 72 120 Z" fill="#06b6d4" />
    <!-- Blue Arc -->
    <path d="M 72 120 A 48 48 0 0 1 168 120 L 160 120 A 40 40 0 0 0 80 120 Z" fill="#2563eb" />
    <!-- Red Arc -->
    <path d="M 80 120 A 40 40 0 0 1 160 120 L 153 120 A 33 33 0 0 0 87 120 Z" fill="#dc2626" />
    <!-- Amber Arc -->
    <path d="M 87 120 A 33 33 0 0 1 153 120 L 146 120 A 26 26 0 0 0 94 120 Z" fill="#f59e0b" />
    
    <!-- Central Rising Sun -->
    <path d="M 94 120 A 26 26 0 0 1 146 120 Z" fill="url(#kcaSunGrad)" />
    <circle cx="120" cy="120" r="13" fill="#fde047" />

    <!-- Center Line Divider -->
    <line x1="48" y1="120" x2="192" y2="120" stroke="#ffffff" stroke-width="2.5" />

    <!-- Lower Section: KCA 3D Lettering & Community -->
    <!-- Letter K -->
    <path d="M 52 124 L 68 124 L 68 178 L 52 178 Z" fill="#1e3a8a" />
    <path d="M 68 148 L 86 124 L 102 124 L 78 152 Z" fill="#1d4ed8" />
    <path d="M 74 148 L 99 184 L 102 188 L 83 188 L 65 158 Z" fill="#2563eb" />

    <!-- Letter C -->
    <path d="M 102 124 L 138 124 L 138 138 L 118 138 L 118 168 L 138 168 L 138 184 L 102 184 Z" fill="#0284c7" />
    <circle cx="125" cy="153" r="11" fill="#ffffff" />

    <!-- Letter A with Community Silhouette -->
    <path d="M 142 124 L 188 124 L 188 184 L 170 184 L 170 172 L 158 172 L 158 184 L 142 184 Z" fill="#b91c1c" />
    <circle cx="164" cy="144" r="5" fill="#ffffff" />
    <path d="M 157 166 C 157 156 171 156 171 166 Z" fill="#ffffff" />

    <!-- Inner Golden Border Ring -->
    <circle cx="120" cy="120" r="74" fill="none" stroke="#f59e0b" stroke-width="1.8" />
  </g>
</svg>`;

/**
 * Returns a base64 Data URL for the official KCA emblem SVG
 */
export function getOfficialKcaEmblemDataUrl(): string {
  if (typeof window !== 'undefined' && window.btoa) {
    try {
      return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(OFFICIAL_KCA_EMBLEM_SVG)))}`;
    } catch {
      // fallback
    }
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(OFFICIAL_KCA_EMBLEM_SVG)}`;
}

let cachedRasterOfficialLogoPng: string | null = null;
let cachedCustomLogoSource: string | null = null;
let cachedRasterCustomLogoPng: string | null = null;

/**
 * Explicitly invalidates the cached raster logos so any new manual upload is immediately reflected.
 */
export function invalidateLogoCache(): void {
  cachedCustomLogoSource = null;
  cachedRasterCustomLogoPng = null;
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      getActiveLogoPngDataUrl().catch(() => {});
    }, 20);
  }
}

// Listen to custom logo change events across the whole application
if (typeof window !== 'undefined') {
  window.addEventListener('kca-custom-logo-changed', () => {
    invalidateLogoCache();
  });
  window.addEventListener('kca-portal-config-changed', () => {
    invalidateLogoCache();
  });
  window.addEventListener('storage', (e) => {
    if (e.key === 'kca_fujairah_custom_logo_v1' || e.key === STORAGE_KEY_PORTAL_CONFIG) {
      invalidateLogoCache();
    }
  });
}

/**
 * Converts any image source or SVG Data URL to a pure PNG Base64 Data URL
 * which jsPDF and HTML Canvas can directly embed without format errors.
 */
export async function getActiveLogoPngDataUrl(): Promise<string> {
  const custom = loadCustomLogo();

  // If custom logo is already a PNG or JPEG data URL
  if (custom) {
    if (
      custom.startsWith('data:image/png') ||
      custom.startsWith('data:image/jpeg') ||
      custom.startsWith('data:image/webp')
    ) {
      return custom;
    }
    if (custom === cachedCustomLogoSource && cachedRasterCustomLogoPng) {
      return cachedRasterCustomLogoPng;
    }
  } else if (cachedRasterOfficialLogoPng) {
    return cachedRasterOfficialLogoPng;
  }

  const src = custom || getOfficialKcaEmblemDataUrl();

  // If running in browser environment, rasterize to PNG via canvas
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const pngUrl = await new Promise<string>((resolve) => {
        const img = new Image();
        if (src.startsWith('http://') || src.startsWith('https://')) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, 512, 512);
              const data = canvas.toDataURL('image/png');
              resolve(data);
              return;
            }
          } catch (e) {
            console.warn('Canvas raster error for logo:', e);
          }
          resolve(src);
        };
        img.onerror = (err) => {
          console.warn('Image load error for logo PNG rasterization:', err);
          resolve(src);
        };
        img.src = src;
      });

      if (custom) {
        cachedCustomLogoSource = custom;
        cachedRasterCustomLogoPng = pngUrl;
      } else {
        cachedRasterOfficialLogoPng = pngUrl;
      }
      return pngUrl;
    } catch {
      return src;
    }
  }

  return src;
}

// Background pre-warm the official raster logo on application boot
if (typeof window !== 'undefined') {
  setTimeout(() => {
    getActiveLogoPngDataUrl().catch(() => {});
  }, 100);
}

/**
 * Returns the currently active logo Data URL (custom uploaded if set, or official emblem)
 */
export function getActiveLogoDataUrl(): string {
  const custom = loadCustomLogo();
  if (custom) return custom;
  if (cachedRasterOfficialLogoPng) return cachedRasterOfficialLogoPng;
  return getOfficialKcaEmblemDataUrl();
}

/**
 * Dynamic Emblem or Custom Uploaded Logo
 * Guaranteed 100% concentric, perfectly aligned circular badge
 */
export const KcaLogo: React.FC<LogoProps> = ({
  size = 64,
  className = '',
  showText = false,
  customLogoUrl,
}) => {
  const uid = useId().replace(/:/g, '_');
  const { customLogo: storedLogo } = useCustomLogo();
  const [config, setConfig] = useState(() => loadPortalConfig());

  useEffect(() => {
    const handleConfig = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setConfig(detail || loadPortalConfig());
    };
    window.addEventListener('kca-portal-config-changed', handleConfig);
    return () => window.removeEventListener('kca-portal-config-changed', handleConfig);
  }, []);

  const activeLogoUrl =
    customLogoUrl !== undefined
      ? customLogoUrl
      : storedLogo !== null
      ? storedLogo
      : config.customLogoUrl || null;
  const numericSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 64;

  const isDefaultKca =
    !config.portalName ||
    config.portalName.toLowerCase().includes('kairali') ||
    config.portalName.toLowerCase().includes('kca');

  // Compute monogram for custom organizations
  const monogram = useMemo(() => {
    if (config.shortName && config.shortName.length <= 4) {
      return config.shortName.replace(/[^a-zA-Z0-9]/g, '');
    }
    const words = (config.portalName || 'ORG').trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + (words[1] ? words[1][0] : '')).toUpperCase();
  }, [config.portalName, config.shortName]);

  const primaryCol = config.primaryColor || '#8b0000';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {activeLogoUrl ? (
        // Custom Uploaded Logo (or explicit image URL)
        <div
          className="shrink-0 relative rounded-full overflow-hidden flex items-center justify-center bg-white shadow-xs border border-slate-200"
          style={{ width: `${numericSize}px`, height: `${numericSize}px` }}
        >
          <img
            key={activeLogoUrl.slice(0, 128) + activeLogoUrl.length}
            src={activeLogoUrl}
            alt={`${config.portalName} Logo`}
            className="w-full h-full object-contain p-0.5"
            crossOrigin={activeLogoUrl.startsWith('data:') ? undefined : 'anonymous'}
          />
        </div>
      ) : isDefaultKca ? (
        // Official KCA Fujairah Vector Emblem
        <div
          className="shrink-0 relative rounded-full overflow-hidden flex items-center justify-center bg-transparent shadow-xs"
          style={{ width: `${numericSize}px`, height: `${numericSize}px` }}
        >
          <svg
            width={numericSize}
            height={numericSize}
            viewBox="0 0 240 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full select-none shrink-0"
          >
            <defs>
              <linearGradient id={`kcaBgGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#991b1b" />
                <stop offset="50%" stopColor="#800000" />
                <stop offset="100%" stopColor="#600000" />
              </linearGradient>
              <radialGradient id={`kcaSunGrad_${uid}`} cx="50%" cy="100%" r="90%">
                <stop offset="0%" stopColor="#fffde7" />
                <stop offset="50%" stopColor="#fbc02d" />
                <stop offset="100%" stopColor="#f57f17" />
              </radialGradient>
              <path id={`kcaTopArc_${uid}`} d="M 28 120 A 92 92 0 0 1 212 120" fill="none" />
              <path id={`kcaBottomArc_${uid}`} d="M 212 120 A 92 92 0 0 1 28 120" fill="none" />
            </defs>

            {/* Outer Deep Crimson Ring with Golden Border */}
            <circle cx="120" cy="120" r="114" fill={`url(#kcaBgGrad_${uid})`} stroke="#f59e0b" strokeWidth="3.2" />
            <circle cx="120" cy="120" r="109" fill="none" stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />

            {/* Inner Disc Base (White) */}
            <circle cx="120" cy="120" r="76" fill="#ffffff" stroke="#f59e0b" strokeWidth="2.8" />

            {/* Top Circular Text: KAIRALI CULTURAL ASSOCIATION */}
            <text fill="#ffffff" fontSize="13" fontWeight="900" fontFamily="'Arial Black', Arial, sans-serif" letterSpacing="1.2">
              <textPath href={`#kcaTopArc_${uid}`} xlinkHref={`#kcaTopArc_${uid}`} startOffset="50%" textAnchor="middle">
                KAIRALI CULTURAL ASSOCIATION
              </textPath>
            </text>

            {/* Bottom Circular Text: FUJAIRAH • UAE */}
            <text fill="#fef08a" fontSize="13.5" fontWeight="900" fontFamily="'Arial Black', Arial, sans-serif" letterSpacing="2">
              <textPath href={`#kcaBottomArc_${uid}`} xlinkHref={`#kcaBottomArc_${uid}`} startOffset="50%" textAnchor="middle">
                FUJAIRAH &bull; UAE
              </textPath>
            </text>

            {/* Upper Fan / Rising Sun */}
            <path d="M 52 120 A 68 68 0 0 1 188 120 L 176 120 A 56 56 0 0 0 64 120 Z" fill="#047857" />
            <path d="M 64 120 A 56 56 0 0 1 176 120 L 168 120 A 48 48 0 0 0 72 120 Z" fill="#06b6d4" />
            <path d="M 72 120 A 48 48 0 0 1 168 120 L 160 120 A 40 40 0 0 0 80 120 Z" fill="#2563eb" />
            <path d="M 80 120 A 40 40 0 0 1 160 120 L 153 120 A 33 33 0 0 0 87 120 Z" fill="#dc2626" />
            <path d="M 87 120 A 33 33 0 0 1 153 120 L 146 120 A 26 26 0 0 0 94 120 Z" fill="#f59e0b" />
            
            <path d="M 94 120 A 26 26 0 0 1 146 120 Z" fill={`url(#kcaSunGrad_${uid})`} />
            <circle cx="120" cy="120" r="13" fill="#fde047" />

            {/* Center Line Divider */}
            <line x1="48" y1="120" x2="192" y2="120" stroke="#ffffff" strokeWidth="2.5" />

            {/* Lower Section: KCA 3D Lettering */}
            <path d="M 52 124 L 68 124 L 68 178 L 52 178 Z" fill="#1e3a8a" />
            <path d="M 68 148 L 86 124 L 102 124 L 78 152 Z" fill="#1d4ed8" />
            <path d="M 74 148 L 99 184 L 102 188 L 83 188 L 65 158 Z" fill="#2563eb" />

            <path d="M 102 124 L 138 124 L 138 138 L 118 138 L 118 168 L 138 168 L 138 184 L 102 184 Z" fill="#0284c7" />
            <circle cx="125" cy="153" r="11" fill="#ffffff" />

            <path d="M 142 124 L 188 124 L 188 184 L 170 184 L 170 172 L 158 172 L 158 184 L 142 184 Z" fill="#b91c1c" />
            <circle cx="164" cy="144" r="5" fill="#ffffff" />
            <path d="M 157 166 C 157 156 171 156 171 166 Z" fill="#ffffff" />

            <circle cx="120" cy="120" r="74" fill="none" stroke="#f59e0b" strokeWidth="1.8" />
          </svg>
        </div>
      ) : (
        // Custom Organization Monogram Crest Emblem
        <div
          className="shrink-0 relative rounded-full overflow-hidden flex items-center justify-center bg-transparent shadow-xs"
          style={{ width: `${numericSize}px`, height: `${numericSize}px` }}
        >
          <svg
            width={numericSize}
            height={numericSize}
            viewBox="0 0 240 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full select-none shrink-0"
          >
            <defs>
              <linearGradient id={`customBgGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={primaryCol} />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>

            {/* Outer Ring with Golden Border */}
            <circle cx="120" cy="120" r="114" fill={`url(#customBgGrad_${uid})`} stroke="#f59e0b" strokeWidth="3.5" />
            <circle cx="120" cy="120" r="108" fill="none" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" />

            {/* Inner Disc */}
            <circle cx="120" cy="120" r="78" fill="#ffffff" stroke="#f59e0b" strokeWidth="2.5" />

            {/* Monogram in Center */}
            <text
              x="120"
              y="132"
              fill={primaryCol}
              fontSize={monogram.length > 3 ? '42' : '52'}
              fontWeight="900"
              fontFamily="'Arial Black', Arial, sans-serif"
              textAnchor="middle"
              dominantBaseline="middle"
              letterSpacing="1"
            >
              {monogram}
            </text>

            {/* Star Accents */}
            <circle cx="120" cy="65" r="4" fill="#f59e0b" />
            <circle cx="120" cy="175" r="4" fill="#f59e0b" />
          </svg>
        </div>
      )}

      {showText && (
        <div className="flex flex-col text-left">
          <span className="font-display font-bold text-slate-900 leading-tight tracking-tight text-lg">
            {config.portalName}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-primary, #8b0000)' }}>
            {config.jurisdiction}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Official Dynamic Header Banner for configured Organization
 */
export const OfficialKcaHeaderBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [config, setConfig] = useState(() => loadPortalConfig());

  useEffect(() => {
    const handleConfig = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setConfig(detail || loadPortalConfig());
    };
    window.addEventListener('kca-portal-config-changed', handleConfig);
    return () => window.removeEventListener('kca-portal-config-changed', handleConfig);
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/15 text-white shadow-xs p-5 transition-all duration-300 ${className}`}
      style={{ backgroundColor: 'var(--color-primary, #8b0000)' }}
    >
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white p-1 shadow-xs border border-white/20 shrink-0 flex items-center justify-center">
            <KcaLogo size={46} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/15 text-[10px] font-bold text-white/90 uppercase tracking-widest mb-1">
              <span>{config.affiliationText || `Established ${config.establishedYear || '1978'}`}</span>
            </div>
            <h1 className="font-display font-black text-lg sm:text-xl tracking-tight text-white uppercase leading-snug">
              {config.portalName}
            </h1>
            <p className="text-xs text-white/80 font-medium">
              {config.subtitle} &bull; {config.jurisdiction}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 shrink-0 text-right">
          <div className="bg-black/20 px-3.5 py-2 rounded-xl border border-white/15 text-right">
            <div className="text-[10px] text-white/70 uppercase font-semibold tracking-wider">
              {config.shortName || 'Portal'}
            </div>
            <div className="text-xs font-bold text-white">
              Executive Administration
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


