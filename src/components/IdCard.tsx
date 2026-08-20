import React, { useEffect, useState } from 'react';
import { Member, CustomFieldDefinition } from '../types/member';
import { KcaLogo } from './Logo';
import { generateMemberQrCode, formatCardBloodGroup, formatCardDate } from '../utils/idGenerator';
import { ShieldCheck } from 'lucide-react';

interface IdCardProps {
  member: Member;
  customFields?: CustomFieldDefinition[];
  side?: 'front' | 'back' | 'both';
  scale?: number;
  showShadow?: boolean;
  className?: string;
  idPrefix?: string;
}

export const IdCard: React.FC<IdCardProps> = ({
  member,
  customFields = [],
  side = 'front',
  scale = 1,
  showShadow = true,
  className = '',
  idPrefix = 'kca-id-card',
}) => {
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

  // Find custom fields that should be displayed on ID Card
  const idCardCustomFields = customFields.filter(
    (f) => f.showOnIdCard && member.customFields && member.customFields[f.id]
  );

  const displayMemberId = member.membershipId;

  return (
    <div className={`inline-flex flex-col md:flex-row gap-6 items-center justify-center select-none ${className}`}>
      {/* FRONT SIDE OF ID CARD */}
      {(side === 'front' || side === 'both') && (
        <div
          id={`${cardDomId}-front`}
          className="id-card-print-target relative overflow-hidden bg-white text-slate-900 border border-slate-300 font-sans shrink-0"
          style={{
            width: '480px',
            height: '300px', // Standard CR80 Ratio
            borderRadius: '16px',
            boxShadow: showShadow
              ? '0 12px 28px -6px rgba(168, 16, 23, 0.18), 0 4px 10px -2px rgba(0, 0, 0, 0.06)'
              : 'none',
            transform: scale !== 1 ? `scale(${scale})` : undefined,
            transformOrigin: 'top left',
            backgroundColor: '#ffffff',
          }}
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
              {/* Outer Deep Dark Maroon Base */}
              <path
                d="M 0 0 L 240 0 L 240 75 C 205 70 170 82 135 68 C 100 54 65 30 0 0 Z"
                fill="#7f1d1d"
              />
              {/* Mid Layer Scarlet Red Wave */}
              <path
                d="M 20 0 L 240 0 L 240 60 C 200 55 165 65 130 52 C 95 40 60 20 20 0 Z"
                fill="#991b1b"
              />
              {/* Top Vibrant Crimson Ribbon */}
              <path
                d="M 45 0 L 240 0 L 240 45 C 195 40 160 48 125 36 C 90 25 65 12 45 0 Z"
                fill="#b91c1c"
              />
              {/* White Highlight Curving Separation Line 1 */}
              <path
                d="M 15 0 C 60 22 98 44 135 56 C 170 67 205 58 240 64"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* White Highlight Curving Separation Line 2 */}
              <path
                d="M 50 0 C 80 16 112 30 145 38 C 178 45 208 40 240 44"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
                opacity="0.85"
              />
            </svg>
          </div>

          {/* Bottom-Left Red Flowing Waves Graphic */}
          <div className="absolute bottom-0 left-0 w-[240px] h-[75px] pointer-events-none z-10">
            <svg viewBox="0 0 240 75" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              {/* Dark Maroon Base */}
              <path
                d="M 0 75 L 240 75 C 175 75 140 45 105 55 C 70 65 35 35 0 35 Z"
                fill="#7f1d1d"
              />
              {/* Mid Layer Scarlet Wave */}
              <path
                d="M 0 75 L 210 75 C 155 75 125 52 95 60 C 65 68 30 45 0 45 Z"
                fill="#991b1b"
              />
              {/* Top Vibrant Crimson Ribbon */}
              <path
                d="M 0 75 L 180 75 C 135 75 110 58 80 65 C 50 72 25 55 0 55 Z"
                fill="#b91c1c"
              />
              {/* White Highlight Lines */}
              <path
                d="M 0 32 C 38 32 72 62 108 52 C 142 42 178 72 240 72"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 0 48 C 30 48 62 68 95 58 C 128 48 160 72 210 72"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.8"
              />
            </svg>
          </div>

          {/* Foreground Card Content Grid */}
          <div className="relative z-20 h-full flex flex-col justify-between p-4.5">
            {/* TOP HEADER ROW */}
            <div className="flex items-start justify-between">
              {/* Left: Original KCA Fujairah Logo / Uploaded Logo & Header Typography */}
              <div className="flex items-center gap-2.5">
                {/* KCA Emblem / Custom Uploaded Logo */}
                <div className="shrink-0 drop-shadow-xs">
                  <KcaLogo size={48} />
                </div>

                {/* Association Title */}
                <div className="flex flex-col text-left">
                  <h2 className="font-display font-black text-[13px] tracking-tight uppercase text-slate-900 leading-tight">
                    KAIRALI CULTURAL ASSOCIATION
                  </h2>
                  <div className="font-display font-black text-[11px] tracking-wide uppercase text-slate-900 leading-tight mt-0.5">
                    FUJAIRAH
                  </div>
                  <div className="text-[9px] font-medium text-slate-600 leading-tight mt-0.5">
                    kairalicaf@gmail.com
                  </div>
                </div>
              </div>

              {/* Right: Space preserved for top-right flowing red ribbons */}
              <div className="w-28 shrink-0" />
            </div>

            {/* MAIN CARD BODY AREA */}
            <div className="flex items-center gap-4.5 my-auto pt-1">
              {/* Left: BOXED Member Photo with Red Double-Border Frame */}
              <div className="shrink-0 pl-1">
                <div className="relative p-1 rounded-lg bg-white shadow-md border-2 border-[#b91c1c]">
                  <div className="w-[104px] h-[122px] rounded-md overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                    <img
                      src={
                        member.photoUrl ||
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
                      }
                      alt={member.fullName}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Membership ID Card Pill + Member Info Fields */}
              <div className="flex-1 flex flex-col justify-center min-w-0 pr-1">
                {/* "MEMBERSHIP ID CARD" Solid Red Pill (Rounded stadium shape) */}
                <div className="mb-2">
                  <div
                    className="inline-flex items-center justify-center px-4.5 py-1.5 rounded-full shadow-xs text-white"
                    style={{ backgroundColor: '#b91c1c' }}
                  >
                    <span className="font-display font-black text-xs md:text-[13px] tracking-wider uppercase leading-none">
                      MEMBERSHIP ID CARD
                    </span>
                  </div>
                </div>

                {/* Member Name in Bold Red Uppercase */}
                <div className="mb-2">
                  <h3
                    className="font-display font-black text-[16px] leading-tight tracking-tight uppercase truncate"
                    style={{ color: '#b91c1c' }}
                    title={member.fullName}
                  >
                    {member.fullName}
                  </h3>
                </div>

                {/* Tabular Aligned Details (Member ID, Unit, Blood group, Validity, NORKA ID) */}
                <div className="grid grid-cols-[84px_8px_1fr] items-center gap-y-1 text-slate-900 font-sans text-[11.5px] leading-tight">
                  {/* Row 1: Member ID */}
                  <span className="font-bold text-slate-900 whitespace-nowrap">Member ID</span>
                  <span className="font-bold text-slate-900 text-center">:</span>
                  <span className="font-bold text-slate-900 font-mono tracking-tight truncate">
                    {displayMemberId}
                  </span>

                  {/* Row 2: Unit */}
                  <span className="font-bold text-slate-900 whitespace-nowrap">Unit</span>
                  <span className="font-bold text-slate-900 text-center">:</span>
                  <span className="font-bold text-slate-900 truncate">{member.unit}</span>

                  {/* Row 3: Blood group */}
                  <span className="font-bold text-slate-900 whitespace-nowrap">Blood group</span>
                  <span className="font-bold text-slate-900 text-center">:</span>
                  <span className="font-bold text-slate-900 font-sans">
                    {formatCardBloodGroup(member.bloodGroup)}
                  </span>

                  {/* Row 4: Validity */}
                  <span className="font-bold text-slate-900 whitespace-nowrap">Validity</span>
                  <span className="font-bold text-slate-900 text-center">:</span>
                  <span className="font-bold text-slate-900 font-sans">
                    {formatCardDate(member.expiryDate)}
                  </span>

                  {/* Row 5: NORKA Pravasi ID (Optional - only displayed if present and non-empty) */}
                  {member.norkaId && member.norkaId.trim() && (
                    <>
                      <span className="font-bold text-slate-900 whitespace-nowrap">NORKA ID</span>
                      <span className="font-bold text-slate-900 text-center">:</span>
                      <span className="font-bold text-slate-900 font-mono tracking-tight truncate">
                        {member.norkaId.trim()}
                      </span>
                    </>
                  )}

                  {/* Custom Fields if enabled */}
                  {idCardCustomFields.map((cf) => {
                    const val = member.customFields?.[cf.id];
                    if (!val) return null;
                    return (
                      <React.Fragment key={cf.id}>
                        <span className="font-bold text-slate-900 truncate" title={cf.label}>
                          {cf.label}
                        </span>
                        <span className="font-bold text-slate-900 text-center">:</span>
                        <span className="font-bold text-slate-900 truncate">
                          {String(val)}
                        </span>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* BOTTOM ROW: QR CODE (Bottom Right) */}
            <div className="flex items-end justify-end">
              {/* QR Code Container in Bottom Right Corner */}
              <div className="shrink-0 bg-white p-1 rounded-md border border-slate-200 shadow-xs z-30">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Member Verification QR"
                    crossOrigin="anonymous"
                    className="w-[46px] h-[46px] object-contain"
                  />
                ) : (
                  <div className="w-[46px] h-[46px] bg-slate-100 flex items-center justify-center text-[8px] font-mono text-slate-400">
                    QR
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BACK SIDE OF ID CARD */}
      {(side === 'back' || side === 'both') && (
        <div
          id={`${cardDomId}-back`}
          className="id-card-print-target relative overflow-hidden bg-white text-slate-800 border border-slate-300 font-sans shrink-0"
          style={{
            width: '480px',
            height: '300px',
            borderRadius: '16px',
            boxShadow: showShadow
              ? '0 12px 28px -6px rgba(168, 16, 23, 0.18), 0 4px 10px -2px rgba(0, 0, 0, 0.06)'
              : 'none',
            transform: scale !== 1 ? `scale(${scale})` : undefined,
            transformOrigin: 'top left',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Subtle Geometric Watermark Background */}
          <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
            <svg width="100%" height="100%" viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="0,0 240,0 180,180 0,140" fill="#f8fafc" />
              <polygon points="240,0 480,0 420,160 180,180" fill="#f1f5f9" />
              <polygon points="180,180 420,160 360,300 120,300" fill="#f8fafc" />
              <polygon points="0,140 180,180 120,300 0,300" fill="#e2e8f0" opacity="0.3" />
            </svg>
          </div>

          {/* Top Header Wave Band */}
          <div
            className="relative z-10 text-white px-4 py-2 flex items-center justify-between shadow-xs"
            style={{ backgroundColor: '#991b1b', borderBottom: '2px solid #7f1d1d' }}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="font-display font-bold text-xs tracking-wider uppercase text-white">
                KAIRALI CULTURAL ASSOCIATION FUJAIRAH
              </span>
            </div>
            <span className="text-[9.5px] font-mono text-red-100 font-bold uppercase">
              TERMS & CONDITIONS
            </span>
          </div>

          {/* Card Back Content Body */}
          <div className="relative z-10 p-3.5 flex flex-col justify-between text-[10px] leading-relaxed text-slate-700 h-[calc(100%-40px)]">
            {/* Rules */}
            <div className="space-y-1.5 bg-slate-50/90 p-2.5 rounded-lg border border-slate-200">
              <p className="flex items-start gap-1.5">
                <span className="text-[#b91c1c] font-bold">1.</span>
                <span>
                  This identity card is non-transferable and remains the official property of{' '}
                  <strong className="text-slate-900">Kairali Cultural Association Fujairah</strong>.
                </span>
              </p>
              <p className="flex items-start gap-1.5">
                <span className="text-[#b91c1c] font-bold">2.</span>
                <span>
                  Entitles active member to participate in association events, cultural activities, sports programs, and welfare support.
                </span>
              </p>
              <p className="flex items-start gap-1.5">
                <span className="text-[#b91c1c] font-bold">3.</span>
                <span>
                  If found, please return to KCA Fujairah Office or email{' '}
                  <strong className="text-slate-900 font-mono">kairalicaf@gmail.com</strong>.
                </span>
              </p>
            </div>

            {/* Emergency and Official Contact details */}
            <div className="grid grid-cols-2 gap-2 text-[9.5px] bg-slate-50/90 p-2 rounded-lg border border-slate-200">
              <div>
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[8.5px]">
                  Emergency Contact:
                </div>
                <div className="font-semibold text-slate-900 truncate">
                  {member.emergencyContactName} ({member.emergencyContactRelation})
                </div>
                <div className="font-mono text-[#b91c1c] font-bold">
                  {member.emergencyContactPhone || member.phoneUAE}
                </div>
              </div>
              <div>
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[8.5px]">
                  Association Head Office:
                </div>
                <div className="font-semibold text-slate-900">Fujairah &bull; Kalba &bull; Khorfakhan &bull; Dibba</div>
                <div className="font-mono text-slate-600">kairalicaf@gmail.com</div>
              </div>
            </div>

            {/* Authorized Signatures & Seal */}
            <div className="flex items-end justify-between pt-1 border-t border-slate-200">
              <div className="text-center">
                <div className="w-28 h-5 border-b border-dashed border-slate-400 mx-auto flex items-center justify-center">
                  <span className="italic text-[8px] text-slate-400">Authorized Signature</span>
                </div>
                <div className="text-[8.5px] font-bold text-slate-600 mt-0.5">
                  President / General Secretary
                </div>
              </div>

              <div className="text-right">
                <div className="text-[8.5px] font-mono text-slate-500">
                  ID: <span className="font-bold text-slate-800">{member.membershipId}</span>
                </div>
                <div className="text-[8.5px] font-bold text-[#b91c1c]">
                  KCA Fujairah &bull; Central Committee
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
