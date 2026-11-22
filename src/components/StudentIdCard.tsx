import React, { useEffect, useState } from 'react';
import { StudentWingMember } from '../types/studentsWing';
import { HeaderTitleStyle } from '../types/portal';
import { BrandTitleLockup } from './BrandTitleLockup';
import { resolveEffectiveTitleStyle } from '../utils/titleGraphic';
import { KcaLogo } from './Logo';
import {
  generateStudentWingQrCode,
  normalizeChildrenWingId,
} from '../utils/studentsWingStorage';
import { formatCardBloodGroup, formatCardDate } from '../utils/idGenerator';
import { loadSavedTheme, darkenColor, lightenColor } from '../utils/theme';
import { ThemePreset } from '../types/theme';
import { ShieldCheck, User, Sparkles } from 'lucide-react';
import { usePortalConfig } from '../hooks/usePortalConfig';

export type StudentCardFormat = 'landscape';

interface StudentIdCardProps {
  student: StudentWingMember;
  side?: 'front' | 'back' | 'both';
  format?: StudentCardFormat | string;
  theme?: string;
  scale?: number;
  showShadow?: boolean;
  className?: string;
  idPrefix?: string;
  titleStyle?: HeaderTitleStyle;
}

export const StudentIdCard: React.FC<StudentIdCardProps> = ({
  student,
  side = 'front',
  scale = 1,
  showShadow = true,
  className = '',
  idPrefix = 'kca-student-card',
  titleStyle,
}) => {
  const { portalConfig } = usePortalConfig();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [activeTheme, setActiveTheme] = useState<ThemePreset>(() => loadSavedTheme());

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      setActiveTheme(e?.detail || loadSavedTheme());
    };
    window.addEventListener('kca-theme-changed', handleThemeChange);
    return () => window.removeEventListener('kca-theme-changed', handleThemeChange);
  }, []);

  useEffect(() => {
    let isMounted = true;
    generateStudentWingQrCode(student).then((url) => {
      if (isMounted) setQrCodeUrl(url);
    });
    return () => {
      isMounted = false;
    };
  }, [student]);

  const cardDomId = `${idPrefix}-${student.id}`;
  const displayMemberId = normalizeChildrenWingId(student.studentId);
  const cleanParentName = (student.parentName || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
  const effectiveTitleStyle: HeaderTitleStyle = resolveEffectiveTitleStyle(
    portalConfig,
    'student_card',
    titleStyle
  );

  // Dynamic theme colors computed from active application theme
  const cardPrimary = activeTheme.primary || '#8b0000';
  const cardDark = darkenColor(cardPrimary, 25);
  const cardMid = darkenColor(cardPrimary, 12);

  // ============================================================================
  // HORIZONTAL CHILDREN'S WING ID CARD (480px x 300px)
  // Dynamic theme styling with pure Children's Wing identity
  // ============================================================================
  return (
    <div className={`inline-flex flex-col lg:flex-row gap-6 items-center justify-center select-none ${className}`}>
      {/* FRONT SIDE OF ID CARD */}
      {(side === 'front' || side === 'both') && (
        <div
          id={`${cardDomId}-front`}
          className="id-card-print-target relative overflow-hidden bg-white text-slate-900 border border-slate-300 font-sans shrink-0"
          style={{
            width: '480px',
            height: '300px',
            borderRadius: '16px',
            boxShadow: showShadow
              ? '0 12px 28px -6px rgba(0, 0, 0, 0.18), 0 4px 10px -2px rgba(0, 0, 0, 0.06)'
              : 'none',
            transform: scale !== 1 ? `scale(${scale})` : undefined,
            transformOrigin: 'top left',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Subtle Geometric Faceted Background */}
          <div className="absolute inset-0 pointer-events-none opacity-45 z-0">
            <svg width="100%" height="100%" viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="0,0 260,0 190,150 0,110" fill="#f8fafc" />
              <polygon points="260,0 480,0 370,175 190,150" fill="#f1f5f9" />
              <polygon points="190,150 370,175 310,300 110,300" fill="#f8fafc" />
              <polygon points="0,110 190,150 110,300 0,300" fill="#e2e8f0" opacity="0.38" />
            </svg>
          </div>

          {/* Left Edge Vertical Accent Ribbon */}
          <div className="absolute top-0 bottom-0 left-0 w-[8px] pointer-events-none z-20 flex flex-col">
            <div className="h-1/3 w-full" style={{ backgroundColor: cardDark }} />
            <div className="h-1/3 w-full" style={{ backgroundColor: cardMid }} />
            <div className="h-1/3 w-full" style={{ backgroundColor: cardPrimary }} />
          </div>

          {/* Top-Right Angular Geometric Chevrons Graphic */}
          <div className="absolute top-0 right-0 w-[225px] h-[86px] pointer-events-none z-10">
            <svg viewBox="0 0 225 86" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <polygon points="10,0 225,0 225,72 140,72 72,35" fill={cardDark} />
              <polygon points="36,0 225,0 225,55 150,55 92,24" fill={cardMid} />
              <polygon points="65,0 225,0 225,38 162,38 114,12" fill={cardPrimary} />
              <polyline
                points="22,0 82,30 144,63 225,63"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <polyline
                points="52,0 104,26 156,46 225,46"
                stroke="#ffffff"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.85"
              />
            </svg>
          </div>

          {/* Bottom-Left Angular Geometric Step Graphic */}
          <div className="absolute bottom-0 left-0 w-[240px] h-[54px] pointer-events-none z-10">
            <svg viewBox="0 0 240 54" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <polygon points="0,18 82,18 140,42 240,42 240,54 0,54" fill={cardDark} />
              <polygon points="0,28 72,28 125,47 210,47 210,54 0,54" fill={cardMid} />
              <polygon points="0,38 62,38 108,54 0,54" fill={cardPrimary} />
              <polyline
                points="0,23 78,23 134,45 230,45"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>

          {/* Bottom-Right Anchored QR Code */}
          <div className="absolute bottom-3.5 right-4 z-30 bg-white p-1 rounded-md border border-slate-200 shadow-xs">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="Member Verification QR"
                crossOrigin="anonymous"
                className="w-[44px] h-[44px] object-contain block"
              />
            ) : (
              <div className="w-[44px] h-[44px] bg-slate-100 flex items-center justify-center text-[8px] font-mono text-slate-400">
                QR
              </div>
            )}
          </div>

          {/* Foreground Card Content */}
          <div className="relative z-20 h-full flex flex-col pl-5 pr-4 pt-3.5 pb-4">
            {/* TOP HEADER ROW: Focused Children's Wing Identity */}
            <div className="flex items-center justify-between shrink-0">
              {effectiveTitleStyle !== 'standard' ? (
                <BrandTitleLockup
                  styleMode={effectiveTitleStyle}
                  portalConfig={portalConfig}
                  variant="student_card"
                  logoSize={46}
                  primaryColor={cardPrimary}
                  sublineText="CHILDREN'S WING IDENTITY CARD"
                />
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="shrink-0 drop-shadow-xs">
                    <KcaLogo size={46} />
                  </div>

                  <div className="flex flex-col text-left max-w-[210px]">
                    <h2
                      className="font-display font-black text-[12px] tracking-tight uppercase leading-[1.2] m-0 p-0 truncate"
                      style={{ color: cardPrimary }}
                    >
                      {portalConfig.shortName || portalConfig.portalName}
                    </h2>
                    <div className="font-display font-bold text-[9.5px] tracking-wider uppercase text-slate-700 leading-[1.2]">
                      CHILDREN&apos;S WING IDENTITY CARD
                    </div>
                    <div className="text-[8px] font-semibold text-slate-500 tracking-wider leading-[1.2] mt-0.5 truncate">
                      {portalConfig.affiliationText || portalConfig.jurisdiction}
                    </div>
                  </div>
                </div>
              )}

              <div className="w-24 shrink-0" />
            </div>

            {/* MAIN CARD BODY AREA - Vertically Centered & Aligned */}
            <div className="flex-1 flex items-center gap-4 pt-1 pb-2">
              {/* Left: Member Photo with Distinct Double-Corner Frame */}
              <div className="shrink-0 pl-0.5">
                <div
                  className="relative p-1 rounded-xl bg-white shadow-md"
                  style={{ border: `2px solid ${cardPrimary}` }}
                >
                  <div
                    className="absolute -top-1 -left-1 w-3.5 h-3.5 rounded-tl-md pointer-events-none"
                    style={{ borderTop: `3px solid ${cardDark}`, borderLeft: `3px solid ${cardDark}` }}
                  />
                  <div
                    className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-br-md pointer-events-none"
                    style={{ borderBottom: `3px solid ${cardDark}`, borderRight: `3px solid ${cardDark}` }}
                  />
                  <div className="w-[100px] h-[122px] rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                    {student.photoUrl ? (
                      <img
                        src={student.photoUrl}
                        alt={student.fullName}
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover block"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 text-center">
                        <User className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                          Photo
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Children's Wing Badge + Member Name + Aligned Details Table */}
              <div className="flex-1 flex flex-col justify-center min-w-0">
                {/* Badge */}
                <div className="mb-1.5 flex items-center">
                  <div
                    className="inline-flex items-center justify-center px-3 py-1 rounded-md shadow-xs text-white whitespace-nowrap shrink-0"
                    style={{
                      backgroundColor: cardPrimary,
                      borderLeft: `3px solid ${cardDark}`,
                    }}
                  >
                    <span className="font-display font-black text-[10.5px] tracking-wider uppercase leading-none whitespace-nowrap">
                      CHILDREN&apos;S WING ID CARD
                    </span>
                  </div>
                </div>

                {/* Member Name */}
                <div className="mb-1.5">
                  <h3
                    className="font-display font-black text-[15px] leading-[1.2] tracking-tight uppercase truncate m-0 p-0 text-left"
                    style={{ color: cardPrimary }}
                    title={student.fullName}
                  >
                    {student.fullName}
                  </h3>
                </div>

                {/* Strictly Aligned Details Rows */}
                <div className="space-y-[2.5px] text-slate-900 font-sans text-[11px] leading-[1.3]">
                  <div className="flex items-center">
                    <span className="w-[76px] shrink-0 font-bold text-left whitespace-nowrap">Member ID</span>
                    <span className="w-[10px] shrink-0 font-bold text-center">:</span>
                    <span className="flex-1 min-w-0 font-bold font-mono tracking-tight text-left truncate">
                      {displayMemberId}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span className="w-[76px] shrink-0 font-bold text-left whitespace-nowrap">Role / Wing</span>
                    <span className="w-[10px] shrink-0 font-bold text-center">:</span>
                    <span className="flex-1 min-w-0 font-bold text-slate-800 text-left truncate">
                      {(student.wingRole || "Children's Wing Member")
                        .replace(/Students Wing/gi, "Children's Wing")
                        .replace(/^Student Member$/i, "Children's Wing Member")}
                    </span>
                  </div>

                  {student.schoolOrCollege && (
                    <div className="flex items-center">
                      <span className="w-[76px] shrink-0 font-bold text-left whitespace-nowrap">School</span>
                      <span className="w-[10px] shrink-0 font-bold text-center">:</span>
                      <span className="flex-1 min-w-0 font-semibold text-slate-800 text-left truncate">
                        {student.schoolOrCollege}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center">
                    <span className="w-[76px] shrink-0 font-bold text-left whitespace-nowrap">Parent</span>
                    <span className="w-[10px] shrink-0 font-bold text-center">:</span>
                    <span className="flex-1 min-w-0 font-semibold text-slate-800 text-left truncate">
                      {cleanParentName} ({student.parentRelation})
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span className="w-[76px] shrink-0 font-bold text-left whitespace-nowrap">Unit</span>
                    <span className="w-[10px] shrink-0 font-bold text-center">:</span>
                    <span className="flex-1 min-w-0 font-semibold text-slate-800 text-left truncate">
                      {student.unit} Unit
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span className="w-[76px] shrink-0 font-bold text-left whitespace-nowrap">Blood Group</span>
                    <span className="w-[10px] shrink-0 font-bold text-center">:</span>
                    <span className="flex-1 min-w-0 font-bold text-left" style={{ color: cardPrimary }}>
                      {formatCardBloodGroup(student.bloodGroup)}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span className="w-[76px] shrink-0 font-bold text-left whitespace-nowrap">Emergency</span>
                    <span className="w-[10px] shrink-0 font-bold text-center">:</span>
                    <span className="flex-1 min-w-0 font-mono font-bold text-slate-800 text-left truncate">
                      {student.parentPhoneUAE}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BACK SIDE OF ID CARD */}
      {(side === 'back' || side === 'both') && (
        <div
          id={`${cardDomId}-back`}
          className="id-card-print-target relative overflow-hidden bg-white text-slate-900 border border-slate-300 font-sans shrink-0"
          style={{
            width: '480px',
            height: '300px',
            borderRadius: '16px',
            boxShadow: showShadow
              ? '0 12px 28px -6px rgba(0, 0, 0, 0.18), 0 4px 10px -2px rgba(0, 0, 0, 0.06)'
              : 'none',
            transform: scale !== 1 ? `scale(${scale})` : undefined,
            transformOrigin: 'top left',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Subtle Geometric Background */}
          <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
            <svg width="100%" height="100%" viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="0,0 240,0 180,180 0,140" fill="#f8fafc" />
              <polygon points="240,0 480,0 420,160 180,180" fill="#f1f5f9" />
              <polygon points="180,180 420,160 360,300 120,300" fill="#f8fafc" />
              <polygon points="0,140 180,180 120,300 0,300" fill="#e2e8f0" opacity="0.3" />
            </svg>
          </div>

          {/* Top Bar with Solid Theme Color */}
          <div
            className="relative z-10 text-white px-4 py-2 flex items-center justify-between shadow-xs h-[38px]"
            style={{ backgroundColor: cardPrimary, borderBottom: `2px solid ${cardDark}` }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="font-display font-bold text-xs tracking-wider uppercase text-white whitespace-nowrap">
                CHILDREN&apos;S WING OFFICIAL IDENTITY CARD
              </span>
            </div>
            <span className="text-[9.5px] font-mono text-white/90 font-bold uppercase whitespace-nowrap">
              CR-80 SECURE
            </span>
          </div>

          <div className="relative z-10 px-4 py-3 flex flex-col justify-between text-[10px] leading-relaxed text-slate-700 h-[262px] text-left">
            <div className="space-y-1.5 bg-slate-50/90 p-2.5 rounded-lg border border-slate-200">
              <p className="flex items-start gap-1.5 m-0">
                <span className="font-bold shrink-0" style={{ color: cardPrimary }}>1.</span>
                <span>
                  This card identifies the holder as an official registered member of{' '}
                  <strong className="text-slate-900">Children&apos;s Wing</strong>.
                </span>
              </p>
              <p className="flex items-start gap-1.5 m-0">
                <span className="font-bold shrink-0" style={{ color: cardPrimary }}>2.</span>
                <span>
                  Entitles the member to participate in cultural festivals, Kalolsavam, literary seminars, and youth programs.
                </span>
              </p>
              <p className="flex items-start gap-1.5 m-0">
                <span className="font-bold shrink-0" style={{ color: cardPrimary }}>3.</span>
                <span>
                  If found, please contact the parent/guardian below or return to {portalConfig.shortName || portalConfig.portalName} Office.
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[9.5px] bg-slate-50/90 p-2.5 rounded-lg border border-slate-200">
              <div className="min-w-0">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[8.5px]">
                  Parent / Guardian Details:
                </div>
                <div className="font-semibold text-slate-900 truncate">
                  {cleanParentName} ({student.parentRelation})
                </div>
                {student.secondaryParentName && (
                  <div className="text-[9px] text-slate-600 truncate">
                    Other Parent: <strong>{student.secondaryParentName}</strong>
                  </div>
                )}
                <div className="font-mono font-bold" style={{ color: cardPrimary }}>
                  {student.parentPhoneUAE}
                </div>
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[8.5px]">
                  Affiliation &amp; Unit Details:
                </div>
                <div className="font-semibold text-slate-900 truncate">
                  {student.unit} {portalConfig.unitTerm || 'Unit'} {student.schoolOrCollege ? `• ${student.schoolOrCollege}` : ''}
                </div>
                <div className="font-bold text-[8.5px] truncate" style={{ color: cardPrimary }}>
                  {portalConfig.affiliationText || portalConfig.jurisdiction}
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between pt-1 border-t border-slate-200">
              <div className="text-center">
                <div className="w-28 h-5 border-b border-dashed border-slate-400 mx-auto flex items-center justify-center">
                  <span className="italic text-[8px] text-slate-400">Authorized Signature</span>
                </div>
                <div className="text-[8.5px] font-bold text-slate-600 mt-0.5">
                  Coordinator / General Secretary
                </div>
              </div>

              <div className="text-right">
                <div className="text-[8.5px] font-mono text-slate-500">
                  Member ID: <span className="font-bold text-slate-800">{displayMemberId}</span>
                </div>
                <div className="text-[8.5px] font-bold" style={{ color: cardPrimary }}>
                  Children&apos;s Wing
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
