import React, { useEffect, useState } from 'react';
import { HeaderTitleStyle, PortalBrandingConfig } from '../types/portal';
import { KcaLogo, useCustomLogo } from './Logo';
import {
  OFFICIAL_TITLE_ASSET_PATH,
  getTitleLockupLines,
  getTrimmedTitleGraphicDataUrl,
} from '../utils/titleGraphic';

interface BrandTitleLockupProps {
  styleMode: HeaderTitleStyle;
  portalConfig: PortalBrandingConfig;
  variant?: 'card' | 'compact_card' | 'student_card' | 'certificate' | 'preview';
  darkSurface?: boolean;
  hideLogo?: boolean;
  logoSize?: number;
  primaryColor?: string;
  sublineText?: string;
  className?: string;
}

/**
 * Shared Official Organization Title Lockup supporting:
 * 1) 'official_lockup': Signature chiseled crimson serif KAIRALI + CULTURAL ASSOCIATION + Fujairah lockup
 * 2) 'title_graphic': Direct trimmed /assets/aistudio/template_1daab234.png (or custom banner upload),
 *    falling back cleanly to custom logo + lockup typography if a new org logo was uploaded.
 * 3) 'standard': Classic portalName + subline fallback
 */
export const BrandTitleLockup: React.FC<BrandTitleLockupProps> = ({
  styleMode,
  portalConfig,
  variant = 'card',
  darkSurface = false,
  hideLogo = false,
  logoSize = 44,
  primaryColor = '#8b0000',
  sublineText,
  className = '',
}) => {
  const { customLogo } = useCustomLogo();
  const activeCustomLogo =
    portalConfig.customLogoUrl !== undefined ? portalConfig.customLogoUrl : customLogo;

  const [trimmedSrc, setTrimmedSrc] = useState<string>(
    portalConfig.customTitleGraphicUrl || OFFICIAL_TITLE_ASSET_PATH
  );

  // If title_graphic mode is active, no separate custom banner was uploaded,
  // AND user uploaded a new org custom logo, render the new logo + title typography
  // instead of masking it with the baked-in crest in template_1daab234.png.
  const shouldRenderStaticGraphic =
    styleMode === 'title_graphic' &&
    (!!portalConfig.customTitleGraphicUrl || !activeCustomLogo);

  useEffect(() => {
    if (!shouldRenderStaticGraphic) return;
    let isMounted = true;
    getTrimmedTitleGraphicDataUrl(portalConfig.customTitleGraphicUrl, true).then((res) => {
      if (isMounted && res.dataUrl) {
        setTrimmedSrc(res.dataUrl);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [shouldRenderStaticGraphic, portalConfig.customTitleGraphicUrl]);

  const { line1, line2, line3 } = getTitleLockupLines(portalConfig);

  if (shouldRenderStaticGraphic) {
    const heightClass =
      variant === 'certificate'
        ? 'h-11 sm:h-12 max-w-[260px]'
        : variant === 'preview'
        ? 'h-12 max-w-[260px]'
        : variant === 'compact_card'
        ? 'h-[34px] max-w-[210px]'
        : 'h-[42px] max-w-[225px]';

    return (
      <div className={`inline-flex flex-col ${variant === 'certificate' ? 'items-center' : 'items-start'} ${className}`}>
        <div
          className={`inline-flex items-center justify-center overflow-hidden ${
            darkSurface ? 'bg-white/95 px-2 py-0.5 rounded-lg shadow-xs' : ''
          }`}
        >
          <img
            key={trimmedSrc.slice(0, 96) + trimmedSrc.length}
            src={trimmedSrc}
            alt={`${line1} ${line2} ${line3}`.trim()}
            crossOrigin={trimmedSrc.startsWith('data:') ? undefined : 'anonymous'}
            className={`${heightClass} w-auto object-contain select-none`}
          />
        </div>
        {sublineText && (
          <div
            className={`text-[7.5px] font-bold tracking-wider uppercase leading-tight mt-0.5 truncate max-w-[220px] ${
              darkSurface ? 'text-amber-200/90' : 'text-slate-600'
            }`}
          >
            {sublineText}
          </div>
        )}
      </div>
    );
  }

  if (styleMode === 'official_lockup' || (styleMode === 'title_graphic' && !shouldRenderStaticGraphic)) {
    const isCert = variant === 'certificate';
    const isCompact = variant === 'compact_card';
    const isPreview = variant === 'preview';

    const line1Color = darkSurface ? '#fde047' : '#dc2626';
    const line2Color = darkSurface ? '#ffffff' : '#0f172a';
    const line3Color = darkSurface ? '#e2e8f0' : '#0f172a';

    const line1Size = isCert
      ? 'text-[17px] sm:text-[21px]'
      : isPreview
      ? 'text-[22px]'
      : isCompact
      ? 'text-[13px]'
      : 'text-[16px]';

    const line2Size = isCert
      ? 'text-[7.5px] sm:text-[9px]'
      : isPreview
      ? 'text-[9.5px]'
      : isCompact
      ? 'text-[6.5px]'
      : 'text-[7.5px]';

    const line3Size = isCert
      ? 'text-[8px] sm:text-[9.5px]'
      : isPreview
      ? 'text-[10px]'
      : isCompact
      ? 'text-[7px]'
      : 'text-[8px]';

    return (
      <div className={`inline-flex items-center ${isCert ? 'gap-2.5 justify-center' : 'gap-2'} ${className}`}>
        {!hideLogo && (
          <div className="shrink-0 drop-shadow-xs">
            <KcaLogo size={logoSize} />
          </div>
        )}
        <div className={`flex flex-col ${hideLogo && isCert ? 'items-center text-center' : 'items-center text-center'} leading-none min-w-0`}>
          <span
            className={`font-serif font-bold uppercase tracking-[0.04em] leading-[0.95] whitespace-nowrap ${line1Size}`}
            style={{
              color: line1Color,
              fontFamily: "'Cinzel', 'Georgia', 'Times New Roman', serif",
            }}
          >
            {line1}
          </span>
          {line2 && (
            <span
              className={`font-sans font-extrabold uppercase tracking-[0.08em] leading-[1.1] mt-[1px] whitespace-nowrap ${line2Size}`}
              style={{ color: line2Color }}
            >
              {line2}
            </span>
          )}
          {line3 && (
            <span
              className={`font-sans font-bold tracking-[0.02em] leading-[1.1] mt-[0.5px] whitespace-nowrap ${line3Size}`}
              style={{ color: line3Color }}
            >
              {line3}
            </span>
          )}
          {sublineText && (
            <span
              className="text-[7px] font-bold tracking-wider uppercase leading-tight mt-0.5 truncate max-w-[205px]"
              style={{ color: darkSurface ? '#cbd5e1' : primaryColor }}
            >
              {sublineText}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Fallback Standard Header
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {!hideLogo && (
        <div className="shrink-0 drop-shadow-xs">
          <KcaLogo size={logoSize} />
        </div>
      )}
      <div className="flex flex-col text-left max-w-[220px] min-w-0">
        <h2
          className={`font-display font-black text-[11.5px] tracking-tight uppercase leading-[1.2] m-0 p-0 truncate ${
            darkSurface ? 'text-white' : 'text-slate-900'
          }`}
        >
          {portalConfig.portalName}
        </h2>
        <div
          className={`font-display font-bold text-[9px] tracking-wide uppercase leading-[1.2] truncate ${
            darkSurface ? 'text-amber-200' : 'text-slate-700'
          }`}
        >
          {portalConfig.jurisdiction}
        </div>
        {(sublineText || portalConfig.affiliationText) && (
          <div
            className="text-[7.5px] font-bold tracking-wider leading-[1.2] mt-0.5 truncate"
            style={{ color: darkSurface ? '#cbd5e1' : primaryColor }}
          >
            {sublineText || portalConfig.affiliationText || portalConfig.subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
