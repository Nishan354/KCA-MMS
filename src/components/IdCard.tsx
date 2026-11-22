import React, { useEffect, useState } from 'react';
import { Member, CustomFieldDefinition } from '../types/member';
import { IdCardDesignId } from '../types/cardDesign';
import { HeaderTitleStyle } from '../types/portal';
import { BrandTitleLockup } from './BrandTitleLockup';
import { resolveEffectiveTitleStyle } from '../utils/titleGraphic';
import { KcaLogo } from './Logo';
import { generateMemberQrCode, formatCardBloodGroup, formatCardDate } from '../utils/idGenerator';
import {
  ShieldCheck,
  User,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Award,
  Crown,
  Fingerprint,
  Phone,
  Building2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { usePortalConfig } from '../hooks/usePortalConfig';

interface IdCardProps {
  member: Member;
  customFields?: CustomFieldDefinition[];
  side?: 'front' | 'back' | 'both';
  scale?: number;
  showShadow?: boolean;
  className?: string;
  idPrefix?: string;
  cardDesign?: IdCardDesignId;
  titleStyle?: HeaderTitleStyle;
}

export const IdCard: React.FC<IdCardProps> = ({
  member,
  customFields = [],
  side = 'front',
  scale = 1,
  showShadow = true,
  className = '',
  idPrefix = 'kca-id-card',
  cardDesign,
  titleStyle,
}) => {
  const { portalConfig, unitTerm } = usePortalConfig();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    generateMemberQrCode(member).then((url) => {
      if (isMounted) setQrCodeUrl(url);
    });
    return () => {
      isMounted = false;
    };
  }, [member]);

  const cardDomId = `${idPrefix}-${member.id}`;
  const idCardCustomFields = customFields.filter(
    (f) => f.showOnIdCard && member.customFields && member.customFields[f.id]
  );
  const displayMemberId = member.membershipId;

  // Resolve active design: prop override -> member's saved design -> portal default -> classic_wave
  const activeDesign: IdCardDesignId =
    cardDesign || member.cardDesign || portalConfig.defaultCardDesign || 'classic_wave';

  const effectiveTitleStyle: HeaderTitleStyle = resolveEffectiveTitleStyle(
    portalConfig,
    'member_card',
    titleStyle
  );

  const primaryColor = portalConfig.primaryColor || '#8b0000';

  // Base card wrapper styles with strictly separated non-shorthand properties
  const cardBaseStyle: React.CSSProperties = {
    width: '480px',
    height: '300px',
    borderRadius: '16px',
    boxShadow: showShadow
      ? '0 12px 28px -6px rgba(0, 0, 0, 0.18), 0 4px 10px -2px rgba(0, 0, 0, 0.06)'
      : 'none',
    transform: scale !== 1 ? `scale(${scale})` : undefined,
    transformOrigin: 'top left',
  };

  const cardStyleWhite: React.CSSProperties = {
    ...cardBaseStyle,
    backgroundColor: '#ffffff',
  };

  const cardStylePrestige: React.CSSProperties = {
    ...cardBaseStyle,
    backgroundColor: '#070e1e',
    backgroundImage: 'linear-gradient(135deg, #070e1e 0%, #0d1b36 50%, #050a14 100%)',
    border: '1.5px solid #ca8a04',
  };

  // =========================================================================
  // DESIGN 1: CLASSIC HERITAGE WAVE (Original Signature Layout)
  // =========================================================================
  const renderClassicWaveFront = () => (
    <div
      key={`classic-wave-front-${cardDomId}`}
      id={`${cardDomId}-front`}
      className="id-card-print-target relative overflow-hidden bg-white text-slate-900 border border-slate-300 font-sans shrink-0"
      style={cardStyleWhite}
    >
      {/* Subtle Geometric Polygonal Background */}
      <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
        <svg width="100%" height="100%" viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="0,0 220,0 160,180 0,130" fill="#f8fafc" />
          <polygon points="220,0 380,0 320,160 160,180" fill="#f1f5f9" />
          <polygon points="160,180 320,160 260,300 90,300" fill="#f8fafc" />
          <polygon points="320,160 480,0 480,210 260,300" fill="#f1f5f9" />
          <polygon points="0,130 160,180 90,300 0,300" fill="#e2e8f0" opacity="0.4" />
        </svg>
      </div>

      {/* Top-Right Red Flowing Waves Graphic */}
      <div className="absolute top-0 right-0 w-[240px] h-[95px] pointer-events-none z-10">
        <svg viewBox="0 0 240 95" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M 0 0 L 240 0 L 240 75 C 205 70 170 82 135 68 C 100 54 65 30 0 0 Z" fill="#7f1d1d" />
          <path d="M 20 0 L 240 0 L 240 60 C 200 55 165 65 130 52 C 95 40 60 20 20 0 Z" fill="#991b1b" />
          <path d="M 45 0 L 240 0 L 240 45 C 195 40 160 48 125 36 C 90 25 65 12 45 0 Z" fill={primaryColor} />
          <path d="M 15 0 C 60 22 98 44 135 56 C 170 67 205 58 240 64" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M 50 0 C 80 16 112 30 145 38 C 178 45 208 40 240 44" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.85" />
        </svg>
      </div>

      {/* Bottom-Left Red Flowing Waves Graphic */}
      <div className="absolute bottom-0 left-0 w-[240px] h-[75px] pointer-events-none z-10">
        <svg viewBox="0 0 240 75" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M 0 75 L 240 75 C 175 75 140 45 105 55 C 70 65 35 35 0 35 Z" fill="#7f1d1d" />
          <path d="M 0 75 L 210 75 C 155 75 125 52 95 60 C 65 68 30 45 0 45 Z" fill="#991b1b" />
          <path d="M 0 75 L 180 75 C 135 75 110 58 80 65 C 50 72 25 55 0 55 Z" fill={primaryColor} />
          <path d="M 0 32 C 38 32 72 62 108 52 C 142 42 178 72 240 72" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M 0 48 C 30 48 62 68 95 58 C 128 48 160 72 210 72" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8" />
        </svg>
      </div>

      {/* Foreground Content */}
      <div className="relative z-20 h-full flex flex-col justify-between p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          {effectiveTitleStyle !== 'standard' ? (
            <BrandTitleLockup
              styleMode={effectiveTitleStyle}
              portalConfig={portalConfig}
              variant="card"
              logoSize={48}
              primaryColor={primaryColor}
              sublineText={portalConfig.affiliationText || undefined}
            />
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="shrink-0 drop-shadow-xs">
                <KcaLogo size={48} />
              </div>
              <div className="flex flex-col text-left max-w-[210px]">
                <h2 className="font-display font-black text-[11.5px] tracking-tight uppercase text-slate-900 leading-[1.25] m-0 p-0 line-clamp-2">
                  {portalConfig.portalName}
                </h2>
                <div className="font-display font-bold text-[9.5px] tracking-wide uppercase text-slate-700 leading-[1.2] truncate">
                  {portalConfig.jurisdiction}
                </div>
                <div
                  className="text-[8px] font-bold tracking-wider leading-[1.2] mt-0.5 truncate"
                  style={{ color: primaryColor }}
                >
                  {portalConfig.affiliationText || portalConfig.subtitle}
                </div>
              </div>
            </div>
          )}
          <div className="w-24 shrink-0" />
        </div>

        {/* Body Area */}
        <div className="flex items-center gap-4 my-auto pt-1">
          {/* Member Photo */}
          <div className="shrink-0 pl-1">
            <div className="relative p-1 rounded-lg bg-white shadow-md border-2" style={{ borderColor: primaryColor }}>
              <div className="w-[100px] h-[118px] rounded-md overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt={member.fullName}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 text-center">
                    <User className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">Photo</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Member Info */}
          <div className="flex-1 flex flex-col justify-center min-w-0 pr-1">
            <div className="mb-1.5 flex-none">
              <div
                className="inline-flex items-center justify-center px-3 py-1 rounded-full shadow-xs text-white whitespace-nowrap shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                <span className="font-display font-black text-[11px] tracking-wider uppercase leading-none whitespace-nowrap">
                  MEMBERSHIP ID CARD
                </span>
              </div>
            </div>

            <div className="mb-1.5">
              <h3
                className="font-display font-black text-[15px] leading-tight tracking-tight uppercase truncate m-0 p-0"
                style={{ color: primaryColor }}
                title={member.fullName}
              >
                {member.fullName}
              </h3>
            </div>

            <div className="grid grid-cols-[80px_8px_1fr] items-center gap-y-0.5 text-slate-900 font-sans text-[11px] leading-tight">
              <span className="font-bold whitespace-nowrap">Member ID</span>
              <span className="font-bold text-center">:</span>
              <span className="font-bold font-mono tracking-tight truncate">{displayMemberId}</span>

              <span className="font-bold whitespace-nowrap">{unitTerm}</span>
              <span className="font-bold text-center">:</span>
              <span className="font-bold truncate">{member.unit}</span>

              <span className="font-bold whitespace-nowrap">Blood group</span>
              <span className="font-bold text-center">:</span>
              <span className="font-bold">{formatCardBloodGroup(member.bloodGroup)}</span>

              <span className="font-bold whitespace-nowrap">Validity</span>
              <span className="font-bold text-center">:</span>
              <span className="font-bold">{formatCardDate(member.expiryDate)}</span>

              {member.norkaId && member.norkaId.trim() && (
                <>
                  <span className="font-bold whitespace-nowrap">NORKA ID</span>
                  <span className="font-bold text-center">:</span>
                  <span className="font-bold font-mono tracking-tight truncate">{member.norkaId.trim()}</span>
                </>
              )}

              {idCardCustomFields.map((cf) => {
                const val = member.customFields?.[cf.id];
                if (!val) return null;
                return (
                  <React.Fragment key={cf.id}>
                    <span className="font-bold truncate" title={cf.label}>{cf.label}</span>
                    <span className="font-bold text-center">:</span>
                    <span className="font-bold truncate">{String(val)}</span>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex items-end justify-end">
          <div className="shrink-0 bg-white p-1 rounded-md border border-slate-200 shadow-xs z-30">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="Member Verification QR"
                crossOrigin="anonymous"
                className="w-[42px] h-[42px] object-contain"
              />
            ) : (
              <div className="w-[42px] h-[42px] bg-slate-100 flex items-center justify-center text-[8px] font-mono text-slate-400">
                QR
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderClassicWaveBack = () => (
    <div
      key={`classic-wave-back-${cardDomId}`}
      id={`${cardDomId}-back`}
      className="id-card-print-target relative overflow-hidden bg-white text-slate-800 border border-slate-300 font-sans shrink-0"
      style={cardStyleWhite}
    >
      <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
        <svg width="100%" height="100%" viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="0,0 240,0 180,180 0,140" fill="#f8fafc" />
          <polygon points="240,0 480,0 420,160 180,180" fill="#f1f5f9" />
          <polygon points="180,180 420,160 360,300 120,300" fill="#f8fafc" />
          <polygon points="0,140 180,180 120,300 0,300" fill="#e2e8f0" opacity="0.3" />
        </svg>
      </div>

      <div
        className="relative z-10 text-white px-4 py-2 flex items-center justify-between shadow-xs"
        style={{ backgroundColor: primaryColor, borderBottom: '2px solid rgba(0,0,0,0.2)' }}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="font-display font-bold text-xs tracking-wider uppercase text-white whitespace-nowrap truncate max-w-[280px]">
            {portalConfig.portalName}
          </span>
        </div>
        <span className="text-[9.5px] font-mono text-red-100 font-bold uppercase whitespace-nowrap">
          TERMS &amp; CONDITIONS
        </span>
      </div>

      <div className="relative z-10 p-3.5 flex flex-col justify-between text-[10px] leading-relaxed text-slate-700 h-[calc(100%-40px)]">
        <div className="space-y-1.5 bg-slate-50/90 p-2.5 rounded-lg border border-slate-200">
          <p className="flex items-start gap-1.5 m-0">
            <span className="font-bold" style={{ color: primaryColor }}>1.</span>
            <span>
              This identity card is non-transferable and remains the official property of{' '}
              <strong className="text-slate-900">{portalConfig.portalName}</strong>.
            </span>
          </p>
          <p className="flex items-start gap-1.5 m-0">
            <span className="font-bold" style={{ color: primaryColor }}>2.</span>
            <span>
              Entitles active member to official privileges, organizational programs, activities, and welfare support.
            </span>
          </p>
          <p className="flex items-start gap-1.5 m-0">
            <span className="font-bold" style={{ color: primaryColor }}>3.</span>
            <span>
              If found, please return to {portalConfig.shortName || portalConfig.portalName} Administration Office or hand over to an authorized {unitTerm} Coordinator.
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[9.5px] bg-slate-50/90 p-2 rounded-lg border border-slate-200">
          <div>
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[8.5px]">Emergency Contact:</div>
            <div className="font-semibold text-slate-900 truncate">
              {member.emergencyContactName} ({member.emergencyContactRelation})
            </div>
            <div className="font-mono font-bold" style={{ color: primaryColor }}>
              {member.emergencyContactPhone || member.phoneUAE}
            </div>
          </div>
          <div>
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[8.5px]">Affiliation &amp; Head Office:</div>
            <div className="font-semibold text-slate-900 truncate">{portalConfig.jurisdiction}</div>
            <div className="font-bold text-[8.5px] truncate" style={{ color: primaryColor }}>
              {portalConfig.affiliationText || portalConfig.subtitle}
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between pt-1 border-t border-slate-200">
          <div className="text-center">
            <div className="w-28 h-5 border-b border-dashed border-slate-400 mx-auto flex items-center justify-center">
              <span className="italic text-[8px] text-slate-400">Authorized Signature</span>
            </div>
            <div className="text-[8.5px] font-bold text-slate-600 mt-0.5">Authorized Signatory</div>
          </div>
          <div className="text-right">
            <div className="text-[8.5px] font-mono text-slate-500">
              ID: <span className="font-bold text-slate-800">{member.membershipId}</span>
            </div>
            <div className="text-[8.5px] font-bold truncate max-w-[150px]" style={{ color: primaryColor }}>
              {portalConfig.shortName || portalConfig.portalName}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // DESIGN 2: MODERN MINIMALIST (Clean Edge & Swiss Typography)
  // =========================================================================
  const renderModernMinimalFront = () => (
    <div
      key={`modern-minimal-front-${cardDomId}`}
      id={`${cardDomId}-front`}
      className="id-card-print-target relative overflow-hidden bg-white text-slate-900 border border-slate-300 font-sans shrink-0 flex"
      style={cardStyleWhite}
    >
      {/* Left Vertical Accent Pillar */}
      <div
        className="w-[20px] shrink-0 h-full flex flex-col items-center justify-between py-3 text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <span className="text-[7px] font-mono font-bold tracking-widest uppercase [writing-mode:vertical-lr] rotate-180 opacity-90">
          {portalConfig.shortName || 'PORTAL'}
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      </div>

      {/* Main Body */}
      <div className="flex-1 p-3.5 flex flex-col justify-between relative bg-radial from-slate-50 to-white">
        {/* Subtle dot matrix */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: 'radial-gradient(#94a3b8 0.75px, transparent 0.75px)',
            backgroundSize: '12px 12px',
          }}
        />

        {/* Top Header */}
        <div className="relative z-10 flex items-start justify-between border-b border-slate-200/80 pb-2">
          {effectiveTitleStyle !== 'standard' ? (
            <BrandTitleLockup
              styleMode={effectiveTitleStyle}
              portalConfig={portalConfig}
              variant="compact_card"
              logoSize={38}
              primaryColor={primaryColor}
            />
          ) : (
            <div className="flex items-center gap-2">
              <KcaLogo size={36} />
              <div className="max-w-[260px]">
                <h2 className="font-display font-black text-[12px] tracking-tight uppercase text-slate-900 leading-tight truncate">
                  {portalConfig.portalName}
                </h2>
                <div className="text-[9px] font-medium text-slate-500 truncate">
                  {portalConfig.jurisdiction} • {portalConfig.affiliationText || portalConfig.subtitle}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col items-end shrink-0">
            <span
              className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border"
              style={{
                backgroundColor: `${primaryColor}12`,
                borderColor: `${primaryColor}30`,
                color: primaryColor,
              }}
            >
              ACTIVE MEMBER
            </span>
            <span className="text-[8px] font-mono text-slate-400 mt-0.5">CR-80 SPEC</span>
          </div>
        </div>

        {/* Mid Section: Photo + Modern Two-Column Data */}
        <div className="relative z-10 flex items-center gap-3.5 my-auto">
          {/* Photo */}
          <div className="shrink-0">
            <div className="w-[96px] h-[116px] rounded-xl overflow-hidden border border-slate-300 shadow-sm bg-slate-100 flex items-center justify-center relative">
              {member.photoUrl ? (
                <img
                  src={member.photoUrl}
                  alt={member.fullName}
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-slate-300" />
              )}
              <div
                className="absolute bottom-0 inset-x-0 h-1.5"
                style={{ backgroundColor: primaryColor }}
              />
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-1">
            <div>
              <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Holder Identification
              </div>
              <h3 className="font-display font-black text-[16px] text-slate-900 tracking-tight leading-none uppercase truncate">
                {member.fullName}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[10px]">
              <div>
                <span className="text-[8px] font-mono uppercase text-slate-400 block leading-tight">Identifier</span>
                <span className="font-mono font-bold text-slate-900">{displayMemberId}</span>
              </div>
              <div>
                <span className="text-[8px] font-mono uppercase text-slate-400 block leading-tight">{unitTerm}</span>
                <span className="font-semibold text-slate-800 truncate block">{member.unit}</span>
              </div>
              <div>
                <span className="text-[8px] font-mono uppercase text-slate-400 block leading-tight">Blood Type</span>
                <span className="font-bold text-rose-700">{formatCardBloodGroup(member.bloodGroup)}</span>
              </div>
              <div>
                <span className="text-[8px] font-mono uppercase text-slate-400 block leading-tight">Valid Until</span>
                <span className="font-medium text-slate-700">{formatCardDate(member.expiryDate)}</span>
              </div>
            </div>

            {member.norkaId && (
              <div className="text-[9px] pt-0.5">
                <span className="text-slate-400 font-mono text-[8px] uppercase">NORKA: </span>
                <span className="font-mono font-bold text-slate-800">{member.norkaId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar: QR + Security Bar */}
        <div className="relative z-10 flex items-center justify-between border-t border-slate-200/80 pt-1.5">
          <div className="flex items-center gap-1.5 text-[8.5px] text-slate-500 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Digital Chip &amp; QR Verified Official Credential</span>
          </div>

          <div className="shrink-0 bg-white p-0.5 rounded border border-slate-200 shadow-xs">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR" className="w-[34px] h-[34px] object-contain" />
            ) : (
              <div className="w-[34px] h-[34px] bg-slate-100 flex items-center justify-center text-[7px] font-mono">QR</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderModernMinimalBack = () => (
    <div
      key={`modern-minimal-back-${cardDomId}`}
      id={`${cardDomId}-back`}
      className="id-card-print-target relative overflow-hidden bg-white text-slate-800 border border-slate-300 font-sans shrink-0 flex"
      style={cardStyleWhite}
    >
      <div
        className="w-[20px] shrink-0 h-full flex flex-col items-center justify-between py-3 text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <span className="text-[7px] font-mono font-bold tracking-widest uppercase [writing-mode:vertical-lr] rotate-180 opacity-90">
          TERMS
        </span>
      </div>

      <div className="flex-1 p-4 flex flex-col justify-between text-[10px]">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-1.5 font-display font-bold text-xs uppercase text-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{portalConfig.portalName}</span>
          </div>
          <span className="text-[9px] font-mono text-slate-400 uppercase">Cardholder Code</span>
        </div>

        <div className="space-y-1.5 text-[9.5px] text-slate-600 leading-relaxed py-1">
          <p className="m-0">
            &bull; This credential confirms authorized active standing with <strong>{portalConfig.portalName}</strong>.
          </p>
          <p className="m-0">
            &bull; Non-transferable. Present upon request for official proceedings, welfare benefits, and general meetings.
          </p>
          <p className="m-0">
            &bull; Loss must be immediately reported to the central administration desk.
          </p>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-[9px]">
          <div>
            <span className="text-slate-400 font-mono uppercase text-[8px] block">Emergency Notification</span>
            <span className="font-bold text-slate-900 block truncate">{member.emergencyContactName} ({member.emergencyContactRelation})</span>
            <span className="font-mono font-bold" style={{ color: primaryColor }}>{member.emergencyContactPhone || member.phoneUAE}</span>
          </div>
          <div>
            <span className="text-slate-400 font-mono uppercase text-[8px] block">Secretariat Office</span>
            <span className="font-semibold text-slate-800 block truncate">{portalConfig.jurisdiction}</span>
            <span className="text-slate-500 block truncate">{portalConfig.contactPhone || portalConfig.contactEmail}</span>
          </div>
        </div>

        <div className="flex items-end justify-between pt-1 border-t border-slate-200 text-[8.5px]">
          <div>
            <span className="text-slate-400 font-mono">Issued to: </span>
            <span className="font-bold text-slate-800">{member.membershipId}</span>
          </div>
          <div className="text-center">
            <div className="w-24 border-b border-slate-400 mx-auto" />
            <span className="text-[8px] text-slate-500">Authorized Officer</span>
          </div>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // DESIGN 3: CORPORATE EXECUTIVE & TECH (Enterprise Grid & Metallic Ribbon)
  // =========================================================================
  const renderCorporateExecutiveFront = () => (
    <div
      key={`corporate-front-${cardDomId}`}
      id={`${cardDomId}-front`}
      className="id-card-print-target relative overflow-hidden bg-white text-slate-900 border border-slate-300 font-sans shrink-0 flex flex-col justify-between"
      style={cardStyleWhite}
    >
      {/* Dark Executive Header */}
      <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between relative overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:8px_8px]" />
        {effectiveTitleStyle !== 'standard' ? (
          <div className="relative z-10">
            <BrandTitleLockup
              styleMode={effectiveTitleStyle}
              portalConfig={portalConfig}
              variant="compact_card"
              darkSurface={true}
              logoSize={36}
              primaryColor="#38bdf8"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2.5 relative z-10">
            <KcaLogo size={36} />
            <div>
              <h2 className="font-display font-black text-[12px] tracking-wider uppercase text-white leading-tight truncate max-w-[260px]">
                {portalConfig.portalName}
              </h2>
              <div className="text-[8.5px] font-mono text-cyan-300 uppercase tracking-widest">
                {portalConfig.jurisdiction} • OFFICIAL REGISTER
              </div>
            </div>
          </div>
        )}

        <div className="relative z-10 flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 border border-white/20 text-[9px] font-mono font-bold text-amber-300">
          <Award className="w-3 h-3 text-amber-400" />
          <span>EXECUTIVE</span>
        </div>
      </div>

      {/* Metallic Gold / Accent Ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 shrink-0" />

      {/* Main Body */}
      <div className="p-3.5 flex-1 flex items-center gap-4 relative">
        {/* Subtle guilloché watermark in background */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <svg width="100%" height="100%" viewBox="0 0 480 200" fill="none">
            <circle cx="240" cy="100" r="140" stroke="#000" strokeWidth="1" strokeDasharray="4 2" />
            <circle cx="240" cy="100" r="110" stroke="#000" strokeWidth="1" />
            <circle cx="240" cy="100" r="80" stroke="#000" strokeWidth="1" strokeDasharray="2 4" />
          </svg>
        </div>

        {/* Photo + Smart Chip Motif */}
        <div className="shrink-0 flex flex-col items-center gap-1.5 relative z-10">
          <div className="w-[96px] h-[112px] rounded-lg overflow-hidden border-2 border-slate-800 shadow-md bg-slate-100 flex items-center justify-center">
            {member.photoUrl ? (
              <img src={member.photoUrl} alt={member.fullName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-slate-300" />
            )}
          </div>
          {/* Smart Chip SVG Icon */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-300/80 shadow-2xs">
            <svg width="18" height="13" viewBox="0 0 18 13" fill="none">
              <rect x="0.5" y="0.5" width="17" height="12" rx="2" fill="#fef3c7" stroke="#d97706" />
              <path d="M5 0.5V12.5M13 0.5V12.5M5 6.5H13M0.5 4H5M0.5 9H5M13 4H17.5M13 9H17.5" stroke="#d97706" strokeWidth="0.8" />
            </svg>
            <span className="text-[7.5px] font-mono font-bold text-amber-900 tracking-tight">SMART-ID</span>
          </div>
        </div>

        {/* Credentials Table */}
        <div className="flex-1 min-w-0 relative z-10">
          <div className="border-b border-slate-200 pb-1 mb-1.5">
            <div className="text-[8.5px] font-mono uppercase text-slate-500 tracking-wider">Corporate Personnel Card</div>
            <h3 className="font-display font-black text-[15px] uppercase text-slate-900 tracking-tight leading-tight truncate">
              {member.fullName}
            </h3>
          </div>

          <div className="space-y-0.5 text-[10.5px]">
            <div className="flex items-center justify-between py-0.5 px-1 rounded bg-slate-50 font-sans">
              <span className="font-mono text-[9px] uppercase text-slate-500">Credential ID:</span>
              <span className="font-mono font-bold text-slate-900">{displayMemberId}</span>
            </div>
            <div className="flex items-center justify-between py-0.5 px-1 font-sans">
              <span className="font-mono text-[9px] uppercase text-slate-500">{unitTerm} / Div:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[130px]">{member.unit}</span>
            </div>
            <div className="flex items-center justify-between py-0.5 px-1 rounded bg-slate-50 font-sans">
              <span className="font-mono text-[9px] uppercase text-slate-500">Blood Group:</span>
              <span className="font-bold text-rose-700">{formatCardBloodGroup(member.bloodGroup)}</span>
            </div>
            <div className="flex items-center justify-between py-0.5 px-1 font-sans">
              <span className="font-mono text-[9px] uppercase text-slate-500">Valid Through:</span>
              <span className="font-semibold text-slate-800">{formatCardDate(member.expiryDate)}</span>
            </div>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="shrink-0 flex flex-col items-center justify-center p-1 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs relative z-10">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="QR" className="w-[44px] h-[44px] object-contain" />
          ) : (
            <div className="w-[44px] h-[44px] bg-slate-100 flex items-center justify-center text-[8px] font-mono">QR</div>
          )}
          <span className="text-[6.5px] font-mono uppercase text-slate-500 mt-0.5 font-bold">VERIFY</span>
        </div>
      </div>

      {/* Footer Bar */}
      <div className="bg-slate-100 px-4 py-1.5 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-600 font-mono shrink-0">
        <span>SECURITY CHIP &bull; AUTH-REG: {displayMemberId}</span>
        <span className="font-bold text-slate-800">{portalConfig.shortName || portalConfig.portalName}</span>
      </div>
    </div>
  );

  const renderCorporateExecutiveBack = () => (
    <div
      key={`corporate-back-${cardDomId}`}
      id={`${cardDomId}-back`}
      className="id-card-print-target relative overflow-hidden bg-white text-slate-800 border border-slate-300 font-sans shrink-0 flex flex-col justify-between"
      style={cardStyleWhite}
    >
      <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-400" />
          <span className="font-display font-bold text-xs uppercase tracking-wider text-white truncate max-w-[280px]">
            {portalConfig.portalName}
          </span>
        </div>
        <span className="text-[9px] font-mono text-cyan-300 uppercase font-bold">CORPORATE POLICY</span>
      </div>
      <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 shrink-0" />

      <div className="p-3.5 flex-1 flex flex-col justify-between text-[10px]">
        <div className="space-y-1.5 text-[9px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <p className="m-0">
            <strong>1. Ownership:</strong> This card is property of {portalConfig.portalName}. Surrender upon cessation of membership or employment.
          </p>
          <p className="m-0">
            <strong>2. Access Rights:</strong> Grants entry to authorized facilities, meetings, corporate venues and affiliate networks.
          </p>
          <p className="m-0">
            <strong>3. Misuse:</strong> Alteration, unauthorized duplication or transfer voids all privileges and triggers review.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[9px] bg-slate-50 p-2 rounded-lg border border-slate-200">
          <div>
            <span className="text-slate-400 font-mono uppercase text-[7.5px] block font-bold">Incident / Emergency Hotline:</span>
            <span className="font-bold text-slate-900 truncate block">{member.emergencyContactName} ({member.emergencyContactRelation})</span>
            <span className="font-mono font-bold text-blue-900">{member.emergencyContactPhone || member.phoneUAE}</span>
          </div>
          <div>
            <span className="text-slate-400 font-mono uppercase text-[7.5px] block font-bold">Registrar General:</span>
            <span className="font-semibold text-slate-800 truncate block">{portalConfig.jurisdiction}</span>
            <span className="text-slate-500 truncate block">{portalConfig.contactEmail || portalConfig.contactPhone}</span>
          </div>
        </div>

        <div className="flex items-end justify-between pt-1 border-t border-slate-200 text-[8.5px]">
          <div className="text-left">
            <span className="text-slate-400 font-mono">CREDENTIAL: </span>
            <span className="font-mono font-bold text-slate-900">{displayMemberId}</span>
          </div>
          <div className="text-center">
            <div className="w-28 border-b border-dashed border-slate-400 mx-auto" />
            <span className="text-[7.5px] text-slate-500 uppercase font-bold">Executive Director Signature</span>
          </div>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // DESIGN 4: PRESTIGE ROYAL SOVEREIGN (Luxury VIP Gold & Deep Midnight)
  // =========================================================================
  const renderPrestigeRoyalFront = () => (
    <div
      key={`prestige-front-${cardDomId}`}
      id={`${cardDomId}-front`}
      className="id-card-print-target relative overflow-hidden text-amber-50 font-sans shrink-0 flex flex-col justify-between p-3.5"
      style={cardStylePrestige}
    >
      {/* Corner Ornaments */}
      <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
      <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
      <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-amber-400 pointer-events-none" />
      <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-amber-400 pointer-events-none" />

      {/* Watermark Crest */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
        <Crown className="w-56 h-56 text-amber-400" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-amber-500/30 pb-2">
        {effectiveTitleStyle !== 'standard' ? (
          <BrandTitleLockup
            styleMode={effectiveTitleStyle}
            portalConfig={portalConfig}
            variant="compact_card"
            darkSurface={true}
            logoSize={40}
            primaryColor="#fde047"
          />
        ) : (
          <div className="flex items-center gap-2.5">
            <KcaLogo size={40} />
            <div>
              <h2 className="font-serif font-bold text-[13px] tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 uppercase truncate max-w-[260px] m-0">
                {portalConfig.portalName}
              </h2>
              <div className="text-[8.5px] font-mono text-amber-300/80 uppercase tracking-widest">
                {portalConfig.jurisdiction} • SOVEREIGN REGISTER
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/50 text-[9px] font-mono font-bold text-amber-300">
          <Crown className="w-3 h-3 text-amber-400" />
          <span>VIP CREDENTIAL</span>
        </div>
      </div>

      {/* Main Section */}
      <div className="relative z-10 flex items-center gap-4 my-auto">
        {/* Photo in Ornate Gold Frame */}
        <div className="shrink-0 p-1 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-200 to-amber-600 shadow-lg">
          <div className="w-[96px] h-[112px] rounded-lg overflow-hidden bg-slate-900 border border-black/40 flex items-center justify-center">
            {member.photoUrl ? (
              <img src={member.photoUrl} alt={member.fullName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-amber-200/60" />
            )}
          </div>
        </div>

        {/* Credentials */}
        <div className="flex-1 min-w-0 space-y-1">
          <div>
            <div className="text-[8px] font-mono uppercase tracking-widest text-amber-300/80">Distinguished Member</div>
            <h3 className="font-serif font-bold text-[16px] text-amber-100 tracking-tight leading-tight uppercase truncate">
              {member.fullName}
            </h3>
          </div>

          <div className="grid grid-cols-[76px_8px_1fr] items-center gap-y-0.5 text-[10.5px] text-amber-100/90 font-sans">
            <span className="font-mono text-[9px] uppercase text-amber-300/70">Registry ID</span>
            <span className="text-amber-400 text-center">:</span>
            <span className="font-mono font-bold text-amber-200 truncate">{displayMemberId}</span>

            <span className="font-mono text-[9px] uppercase text-amber-300/70">{unitTerm}</span>
            <span className="text-amber-400 text-center">:</span>
            <span className="font-semibold truncate">{member.unit}</span>

            <span className="font-mono text-[9px] uppercase text-amber-300/70">Blood Group</span>
            <span className="text-amber-400 text-center">:</span>
            <span className="font-bold text-rose-300">{formatCardBloodGroup(member.bloodGroup)}</span>

            <span className="font-mono text-[9px] uppercase text-amber-300/70">Valid Thru</span>
            <span className="text-amber-400 text-center">:</span>
            <span className="font-medium text-amber-200/90">{formatCardDate(member.expiryDate)}</span>
          </div>
        </div>

        {/* QR Code in Gold Frame */}
        <div className="shrink-0 p-1 rounded-lg bg-amber-950/60 border border-amber-400/60 shadow-md">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="QR" className="w-[42px] h-[42px] object-contain rounded bg-white p-0.5" />
          ) : (
            <div className="w-[42px] h-[42px] bg-slate-900 flex items-center justify-center text-[7px] text-amber-300">QR</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 flex items-center justify-between border-t border-amber-500/30 pt-1.5 text-[8.5px] text-amber-300/80 font-mono">
        <span>SOVEREIGN HONORARY REGISTER &bull; NO. {displayMemberId}</span>
        <span className="text-amber-200 font-bold">{portalConfig.shortName || portalConfig.portalName}</span>
      </div>
    </div>
  );

  const renderPrestigeRoyalBack = () => (
    <div
      key={`prestige-back-${cardDomId}`}
      id={`${cardDomId}-back`}
      className="id-card-print-target relative overflow-hidden text-amber-50 font-sans shrink-0 flex flex-col justify-between p-3.5"
      style={cardStylePrestige}
    >
      <div className="relative z-10 flex items-center justify-between border-b border-amber-500/30 pb-2">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="font-serif font-bold text-xs uppercase tracking-wider text-amber-200 truncate max-w-[280px]">
            {portalConfig.portalName}
          </span>
        </div>
        <span className="text-[9px] font-mono text-amber-300 uppercase font-bold">SOVEREIGN PRIVILEGES</span>
      </div>

      <div className="relative z-10 space-y-1.5 text-[9px] text-amber-100/80 leading-relaxed bg-amber-950/40 p-2.5 rounded-lg border border-amber-500/20">
        <p className="m-0">
          &bull; The bearer is accorded official privileges, representation, and sovereign courtesies of {portalConfig.portalName}.
        </p>
        <p className="m-0">
          &bull; Non-transferable. Valid for official convocations, cultural assemblies, and distinguished benefits.
        </p>
        <p className="m-0">
          &bull; Direct inquiries or return requests to the High Commission &amp; Executive Council.
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-2 text-[9px] bg-amber-950/40 p-2 rounded-lg border border-amber-500/20">
        <div>
          <span className="text-amber-300/70 font-mono uppercase text-[7.5px] block font-bold">VIP Emergency Contact:</span>
          <span className="font-bold text-amber-100 truncate block">{member.emergencyContactName} ({member.emergencyContactRelation})</span>
          <span className="font-mono font-bold text-amber-300">{member.emergencyContactPhone || member.phoneUAE}</span>
        </div>
        <div>
          <span className="text-amber-300/70 font-mono uppercase text-[7.5px] block font-bold">Central Council:</span>
          <span className="font-semibold text-amber-100 truncate block">{portalConfig.jurisdiction}</span>
          <span className="text-amber-300/80 truncate block">{portalConfig.affiliationText || portalConfig.subtitle}</span>
        </div>
      </div>

      <div className="relative z-10 flex items-end justify-between pt-1 border-t border-amber-500/30 text-[8.5px]">
        <div>
          <span className="text-amber-300/70 font-mono">REGISTRY: </span>
          <span className="font-mono font-bold text-amber-200">{displayMemberId}</span>
        </div>
        <div className="text-center">
          <div className="w-28 border-b border-dashed border-amber-400 mx-auto" />
          <span className="text-[7.5px] text-amber-300/80 uppercase font-bold">Executive Council Seal</span>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // DESIGN 5: DYNAMIC VIBRANT ANGLE (Contemporary Bold Gradient)
  // =========================================================================
  const renderVibrantDiagonalFront = () => (
    <div
      key={`vibrant-front-${cardDomId}`}
      id={`${cardDomId}-front`}
      className="id-card-print-target relative overflow-hidden bg-white text-slate-900 border border-slate-300 font-sans shrink-0 flex flex-col justify-between"
      style={cardStyleWhite}
    >
      {/* 38-degree angular header banner across top right */}
      <div
        className="absolute -top-12 -right-12 w-[320px] h-[170px] pointer-events-none rotate-12 opacity-95 shadow-lg"
        style={{
          backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, #db2777 100%)`,
        }}
      />
      <div
        className="absolute -top-14 -right-14 w-[340px] h-[180px] pointer-events-none rotate-12 opacity-30"
        style={{
          backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, #f59e0b 100%)`,
        }}
      />

      {/* Top Header */}
      <div className="relative z-10 p-3.5 pb-0 flex items-start justify-between">
        {effectiveTitleStyle !== 'standard' ? (
          <BrandTitleLockup
            styleMode={effectiveTitleStyle}
            portalConfig={portalConfig}
            variant="compact_card"
            logoSize={42}
            primaryColor={primaryColor}
          />
        ) : (
          <div className="flex items-center gap-2.5">
            <KcaLogo size={42} />
            <div className="max-w-[210px]">
              <h2 className="font-display font-black text-[12px] tracking-tight uppercase text-slate-900 leading-tight truncate">
                {portalConfig.portalName}
              </h2>
              <div className="text-[8.5px] font-bold text-slate-500 uppercase truncate">
                {portalConfig.jurisdiction}
              </div>
            </div>
          </div>
        )}

        <div className="text-white text-right pr-2 pt-1">
          <span className="text-[8px] font-mono tracking-widest uppercase block text-white/80">COMMUNITY PASS</span>
          <span className="text-[10px] font-mono font-black text-white">{displayMemberId}</span>
        </div>
      </div>

      {/* Mid Section */}
      <div className="relative z-10 px-4 flex items-center gap-4 my-auto">
        {/* Photo with gradient glow ring */}
        <div className="shrink-0 p-1 rounded-2xl shadow-md bg-gradient-to-br from-rose-500 to-amber-500">
          <div className="w-[96px] h-[112px] rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center relative">
            {member.photoUrl ? (
              <img src={member.photoUrl} alt={member.fullName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-slate-300" />
            )}
            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
          </div>
        </div>

        {/* Credentials */}
        <div className="flex-1 min-w-0 space-y-1">
          <div>
            <div className="text-[8.5px] font-mono uppercase text-slate-400 font-bold">Active Member</div>
            <h3 className="font-display font-black text-[16px] text-slate-900 uppercase tracking-tight leading-none truncate">
              {member.fullName}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
            <div className="p-1 rounded bg-slate-50 border border-slate-100">
              <span className="text-[7.5px] font-mono uppercase text-slate-400 block">{unitTerm}</span>
              <span className="font-bold text-slate-800 truncate block">{member.unit}</span>
            </div>
            <div className="p-1 rounded bg-slate-50 border border-slate-100">
              <span className="text-[7.5px] font-mono uppercase text-slate-400 block">Blood Group</span>
              <span className="font-bold text-rose-600 block">{formatCardBloodGroup(member.bloodGroup)}</span>
            </div>
            <div className="p-1 rounded bg-slate-50 border border-slate-100">
              <span className="text-[7.5px] font-mono uppercase text-slate-400 block">Valid Thru</span>
              <span className="font-bold text-slate-800 block">{formatCardDate(member.expiryDate)}</span>
            </div>
            <div className="p-1 rounded bg-slate-50 border border-slate-100">
              <span className="text-[7.5px] font-mono uppercase text-slate-400 block">Status</span>
              <span className="font-bold text-emerald-700 block">Verified Active</span>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="shrink-0 p-1 rounded-xl bg-white border border-slate-200 shadow-xs">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="QR" className="w-[42px] h-[42px] object-contain" />
          ) : (
            <div className="w-[42px] h-[42px] bg-slate-100 flex items-center justify-center text-[7px] font-mono">QR</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 px-4 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[8px] font-mono text-slate-500">
        <span>DYNAMIC CR80 ID &bull; {member.membershipId}</span>
        <span className="font-bold text-slate-800">{portalConfig.shortName || portalConfig.portalName}</span>
      </div>
    </div>
  );

  const renderVibrantDiagonalBack = () => (
    <div
      key={`vibrant-back-${cardDomId}`}
      id={`${cardDomId}-back`}
      className="id-card-print-target relative overflow-hidden bg-white text-slate-800 border border-slate-300 font-sans shrink-0 flex flex-col justify-between"
      style={cardStyleWhite}
    >
      <div
        className="px-4 py-2 text-white flex items-center justify-between"
        style={{
          backgroundColor: primaryColor,
          backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, #db2777 100%)`,
        }}
      >
        <span className="font-display font-bold text-xs uppercase tracking-wider">{portalConfig.portalName}</span>
        <span className="text-[9px] font-mono text-rose-100 uppercase font-bold">TERMS &amp; CARE</span>
      </div>

      <div className="p-3.5 flex-1 flex flex-col justify-between text-[10px]">
        <div className="space-y-1.5 text-[9px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <p className="m-0">
            &bull; This card certifies membership in good standing with <strong>{portalConfig.portalName}</strong>.
          </p>
          <p className="m-0">
            &bull; Grants access to scheduled activities, wing functions, and social welfare provisions.
          </p>
          <p className="m-0">
            &bull; Property of the issuing body. Report damaged or lost cards immediately.
          </p>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-[9px]">
          <div>
            <span className="text-slate-400 font-mono uppercase text-[7.5px] block font-bold">Emergency Support:</span>
            <span className="font-bold text-slate-900 block truncate">{member.emergencyContactName} ({member.emergencyContactRelation})</span>
            <span className="font-mono font-bold text-rose-700">{member.emergencyContactPhone || member.phoneUAE}</span>
          </div>
          <div>
            <span className="text-slate-400 font-mono uppercase text-[7.5px] block font-bold">Administration Center:</span>
            <span className="font-semibold text-slate-800 block truncate">{portalConfig.jurisdiction}</span>
            <span className="text-slate-500 block truncate">{portalConfig.contactEmail || portalConfig.contactPhone}</span>
          </div>
        </div>

        <div className="flex items-end justify-between pt-1 border-t border-slate-200 text-[8.5px]">
          <div>
            <span className="text-slate-400 font-mono">HOLDER ID: </span>
            <span className="font-mono font-bold text-slate-900">{displayMemberId}</span>
          </div>
          <div className="text-center">
            <div className="w-24 border-b border-dashed border-slate-400 mx-auto" />
            <span className="text-[7.5px] text-slate-500 uppercase">Authorized Signature</span>
          </div>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // DESIGN 6: SMART SECURITY IDENTITY (Biometric Chip & Guilloché Pattern)
  // =========================================================================
  const renderSmartCompactFront = () => (
    <div
      key={`smart-front-${cardDomId}`}
      id={`${cardDomId}-front`}
      className="id-card-print-target relative overflow-hidden bg-white text-slate-900 border border-slate-400 font-sans shrink-0 flex flex-col justify-between"
      style={cardStyleWhite}
    >
      {/* Top Security Banner */}
      <div className="bg-emerald-900 text-white px-3.5 py-1.5 flex items-center justify-between border-b-2 border-emerald-600 shrink-0">
        {effectiveTitleStyle !== 'standard' ? (
          <BrandTitleLockup
            styleMode={effectiveTitleStyle}
            portalConfig={portalConfig}
            variant="compact_card"
            darkSurface={true}
            logoSize={30}
            primaryColor="#6ee7b7"
          />
        ) : (
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-emerald-400" />
            <h2 className="font-display font-black text-[11px] uppercase tracking-wider text-white truncate max-w-[270px]">
              {portalConfig.portalName}
            </h2>
          </div>
        )}
        <span className="text-[8px] font-mono text-emerald-300 font-bold uppercase tracking-widest shrink-0">
          BIOMETRIC SECURE
        </span>
      </div>

      {/* Guilloché security lines in background */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <svg width="100%" height="100%" viewBox="0 0 480 300" fill="none">
          <path d="M 0 50 Q 120 120 240 50 T 480 50" stroke="#047857" strokeWidth="1" fill="none" />
          <path d="M 0 80 Q 120 150 240 80 T 480 80" stroke="#047857" strokeWidth="1" fill="none" />
          <path d="M 0 110 Q 120 180 240 110 T 480 110" stroke="#047857" strokeWidth="1" fill="none" />
          <path d="M 0 140 Q 120 210 240 140 T 480 140" stroke="#047857" strokeWidth="1" fill="none" />
          <path d="M 0 170 Q 120 240 240 170 T 480 170" stroke="#047857" strokeWidth="1" fill="none" />
          <path d="M 0 200 Q 120 270 240 200 T 480 200" stroke="#047857" strokeWidth="1" fill="none" />
        </svg>
      </div>

      {/* Security thread line */}
      <div className="bg-emerald-100 text-emerald-900 text-[6.5px] font-mono px-3 py-0.5 tracking-widest uppercase border-b border-emerald-200 font-bold shrink-0">
        OFFICIAL NATIONAL ID CREDENTIAL &bull; AUTHORIZED HOLDER &bull; ENCRYPTED CHIP VERIFIED
      </div>

      {/* Main Body */}
      <div className="p-3 flex-1 flex items-center gap-3.5 relative z-10">
        {/* Photo + Smart Chip */}
        <div className="shrink-0 flex flex-col items-center gap-1.5">
          <div className="w-[96px] h-[114px] rounded-md overflow-hidden border-2 border-emerald-800 shadow-sm bg-slate-100 flex items-center justify-center relative">
            {member.photoUrl ? (
              <img src={member.photoUrl} alt={member.fullName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-slate-300" />
            )}
            <div className="absolute bottom-0 inset-x-0 bg-emerald-900/80 text-white text-[7px] font-mono text-center py-0.5 uppercase">
              VERIFIED
            </div>
          </div>

          {/* Microchip */}
          <div className="w-9 h-6 rounded bg-amber-200 border border-amber-500 shadow-2xs flex items-center justify-center">
            <svg width="28" height="18" viewBox="0 0 28 18" fill="none">
              <rect x="1" y="1" width="26" height="16" rx="2" fill="#fef3c7" stroke="#b45309" strokeWidth="0.8" />
              <path d="M8 1V17M20 1V17M8 9H20M1 5H8M1 13H8M20 5H27M20 13H27" stroke="#b45309" strokeWidth="0.6" />
            </svg>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="flex-1 min-w-0 space-y-1">
          <div>
            <span className="text-[7.5px] font-mono uppercase text-emerald-800 font-bold">Holder Identity</span>
            <h3 className="font-display font-black text-[15px] uppercase text-slate-900 tracking-tight leading-tight truncate">
              {member.fullName}
            </h3>
          </div>

          <div className="grid grid-cols-[70px_8px_1fr] items-center gap-y-0.5 text-[10px] font-sans">
            <span className="font-mono text-[8.5px] uppercase text-slate-500">Card ID</span>
            <span className="text-slate-400 text-center">:</span>
            <span className="font-mono font-bold text-slate-900 truncate">{displayMemberId}</span>

            <span className="font-mono text-[8.5px] uppercase text-slate-500">{unitTerm}</span>
            <span className="text-slate-400 text-center">:</span>
            <span className="font-semibold text-slate-800 truncate">{member.unit}</span>

            <span className="font-mono text-[8.5px] uppercase text-slate-500">Blood Group</span>
            <span className="text-slate-400 text-center">:</span>
            <span className="font-bold text-rose-700">{formatCardBloodGroup(member.bloodGroup)}</span>

            <span className="font-mono text-[8.5px] uppercase text-slate-500">Expiry</span>
            <span className="text-slate-400 text-center">:</span>
            <span className="font-medium text-slate-800">{formatCardDate(member.expiryDate)}</span>

            {member.norkaId && (
              <>
                <span className="font-mono text-[8.5px] uppercase text-slate-500">NORKA</span>
                <span className="text-slate-400 text-center">:</span>
                <span className="font-mono font-bold text-slate-900 truncate">{member.norkaId}</span>
              </>
            )}
          </div>

          {/* Barcode simulation */}
          <div className="pt-1">
            <div className="h-4 w-full bg-slate-900 [mask-image:repeating-linear-gradient(to_right,#000_0px,#000_2px,transparent_2px,transparent_4px)] opacity-70" />
            <span className="text-[7px] font-mono text-slate-400 block text-center tracking-widest">{member.membershipId}</span>
          </div>
        </div>

        {/* QR Code */}
        <div className="shrink-0 p-1 rounded bg-white border border-slate-300 shadow-2xs">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="QR" className="w-[42px] h-[42px] object-contain" />
          ) : (
            <div className="w-[42px] h-[42px] bg-slate-100 flex items-center justify-center text-[7px] font-mono">QR</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-emerald-950 text-emerald-200 px-3.5 py-1 text-[7.5px] font-mono flex items-center justify-between shrink-0">
        <span>SECURITY CHIP CR80 • {portalConfig.jurisdiction}</span>
        <span className="font-bold text-white">{portalConfig.shortName || portalConfig.portalName}</span>
      </div>
    </div>
  );

  const renderSmartCompactBack = () => (
    <div
      key={`smart-back-${cardDomId}`}
      id={`${cardDomId}-back`}
      className="id-card-print-target relative overflow-hidden bg-white text-slate-800 border border-slate-400 font-sans shrink-0 flex flex-col justify-between"
      style={cardStyleWhite}
    >
      {/* Magnetic Stripe Simulation */}
      <div className="w-full h-8 bg-slate-900 border-b border-slate-700 shrink-0" />

      <div className="p-3.5 flex-1 flex flex-col justify-between text-[10px]">
        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
          <span className="font-display font-bold text-xs uppercase text-slate-900">{portalConfig.portalName}</span>
          <span className="text-[8px] font-mono text-emerald-800 uppercase font-bold">TERMS OF ISSUE</span>
        </div>

        <div className="space-y-1 text-[8.5px] text-slate-600 leading-tight">
          <p className="m-0">
            1. Official property of {portalConfig.portalName}. Found cards must be deposited in the nearest post box or returned to the administration desk.
          </p>
          <p className="m-0">
            2. The cardholder agrees to abide by organizational bylaws and constitutional protocols.
          </p>
        </div>

        <div className="bg-slate-50 p-2 rounded border border-slate-200 grid grid-cols-2 gap-2 text-[8.5px]">
          <div>
            <span className="text-slate-400 font-mono uppercase text-[7px] block font-bold">EMERGENCY DISPATCH:</span>
            <span className="font-bold text-slate-900 block truncate">{member.emergencyContactName} ({member.emergencyContactRelation})</span>
            <span className="font-mono font-bold text-emerald-800">{member.emergencyContactPhone || member.phoneUAE}</span>
          </div>
          <div>
            <span className="text-slate-400 font-mono uppercase text-[7px] block font-bold">HEAD OFFICE:</span>
            <span className="font-semibold text-slate-800 block truncate">{portalConfig.jurisdiction}</span>
            <span className="text-slate-500 block truncate">{portalConfig.contactPhone || portalConfig.contactEmail}</span>
          </div>
        </div>

        <div className="flex items-end justify-between pt-1 border-t border-slate-200 text-[8px]">
          <div className="font-mono">
            <span>CHIP: </span>
            <span className="font-bold text-slate-900">{displayMemberId}</span>
          </div>
          <div className="text-center">
            <div className="w-24 border-b border-dashed border-slate-400 mx-auto" />
            <span className="text-[7px] text-slate-500 uppercase">Authorized Registrar</span>
          </div>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // RENDER SELECTION ACCORDING TO ACTIVE DESIGN
  // =========================================================================
  const renderFront = () => {
    switch (activeDesign) {
      case 'modern_minimalist':
        return renderModernMinimalFront();
      case 'corporate_executive':
        return renderCorporateExecutiveFront();
      case 'prestige_royal':
        return renderPrestigeRoyalFront();
      case 'vibrant_diagonal':
        return renderVibrantDiagonalFront();
      case 'smart_compact':
        return renderSmartCompactFront();
      case 'classic_wave':
      default:
        return renderClassicWaveFront();
    }
  };

  const renderBack = () => {
    switch (activeDesign) {
      case 'modern_minimalist':
        return renderModernMinimalBack();
      case 'corporate_executive':
        return renderCorporateExecutiveBack();
      case 'prestige_royal':
        return renderPrestigeRoyalBack();
      case 'vibrant_diagonal':
        return renderVibrantDiagonalBack();
      case 'smart_compact':
        return renderSmartCompactBack();
      case 'classic_wave':
      default:
        return renderClassicWaveBack();
    }
  };

  return (
    <div className={`inline-flex flex-col md:flex-row gap-6 items-center justify-center select-none ${className}`}>
      {(side === 'front' || side === 'both') && renderFront()}
      {(side === 'back' || side === 'both') && renderBack()}
    </div>
  );
};