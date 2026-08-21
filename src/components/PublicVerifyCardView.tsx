import React, { useState, useEffect } from 'react';
import { Member, CustomFieldDefinition } from '../types/member';
import { IdCard } from './IdCard';
import { KcaLogo } from './Logo';
import { formatCardDate, getExpiryStatus, getMemberVerifyUrl, createFullMemberFromPartial } from '../utils/idGenerator';
import { downloadMemberIdCardPng } from '../utils/cardExporter';
import { findMemberByQuery } from '../utils/memberLookup';
import { saveCustomLogo } from '../utils/storage';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  Lock,
  Building2,
  Calendar,
  HeartPulse,
  Share2,
  CreditCard,
  Phone,
  Check,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PublicVerifyCardViewProps {
  member?: Member | null;
  searchId?: string;
  verifyId?: string;
  members?: Member[];
  customFields?: CustomFieldDefinition[];
  embeddedMember?: Partial<Member> | null;
  onGoToPortal?: () => void;
  onBackToHome?: () => void;
}

export const PublicVerifyCardView: React.FC<PublicVerifyCardViewProps> = ({
  member: directMember,
  searchId,
  verifyId,
  members = [],
  customFields = [],
  embeddedMember,
  onGoToPortal,
  onBackToHome,
}) => {
  const targetId = (searchId || verifyId || '').trim();
  const [cloudMember, setCloudMember] = useState<Member | null>(null);
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  // 1. Initial resolution from direct prop, local list, or embedded payload
  const initialResolved: Member | null = React.useMemo(() => {
    if (directMember) return directMember;

    if (targetId && members.length > 0) {
      const match = findMemberByQuery(targetId, members);
      if (match) return match;
    }

    if (embeddedMember) {
      return createFullMemberFromPartial(embeddedMember);
    }

    return null;
  }, [directMember, targetId, members, embeddedMember]);

  // 2. Fetch from cloud server (both dedicated verify endpoint and full sync state)
  useEffect(() => {
    let isSubscribed = true;

    // Fetch cloud state to update logo & verify member
    const fetchRemote = async () => {
      if (!initialResolved && targetId) {
        setIsCloudLoading(true);
      }

      try {
        // Try direct verify endpoint first
        if (targetId) {
          const directRes = await fetch(`/api/members/verify/${encodeURIComponent(targetId)}`);
          if (directRes.ok) {
            const directData = await directRes.json();
            if (isSubscribed && directData.success && directData.member) {
              setCloudMember(directData.member);
              if (directData.customLogoUrl !== undefined) {
                saveCustomLogo(directData.customLogoUrl);
              }
              setIsCloudLoading(false);
              return;
            }
          }
        }

        // Fallback to full sync state
        const res = await fetch('/api/sync/state');
        if (res.ok) {
          const data = await res.json();
          if (isSubscribed && data.success) {
            if (data.customLogoUrl !== undefined) {
              saveCustomLogo(data.customLogoUrl);
            }
            if (Array.isArray(data.members) && targetId && !initialResolved) {
              const found = findMemberByQuery(targetId, data.members);
              if (found) {
                setCloudMember(found);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Remote verification query failed:', err);
      } finally {
        if (isSubscribed) {
          setIsCloudLoading(false);
        }
      }
    };

    fetchRemote();

    return () => {
      isSubscribed = false;
    };
  }, [initialResolved, targetId]);

  const resolvedMember: Member | null = initialResolved || cloudMember;

  const [isExportingPng, setIsExportingPng] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handlePortalAction = onBackToHome || onGoToPortal;

  const handleDownloadIdCard = async () => {
    if (!resolvedMember) return;
    setIsExportingPng(true);
    setExportMessage('Generating High-Resolution ID Card PNG (300 DPI)...');

    try {
      await downloadMemberIdCardPng(resolvedMember, customFields);
      setExportMessage('Downloaded Official Front ID Card (PNG)!');
      confetti({ particleCount: 40, spread: 60 });
      setTimeout(() => setExportMessage(null), 3500);
    } catch (err: any) {
      console.error('ID Card export error:', err);
      alert(`Could not download image: ${err?.message || 'Error occurred'}. Please use Print to save.`);
    } finally {
      setIsExportingPng(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (!resolvedMember) return;
    const shareUrl = getMemberVerifyUrl(resolvedMember);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (!resolvedMember) {
    if (isCloudLoading) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-4 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-base font-bold text-white">Verifying Member Credentials...</h2>
            <p className="text-xs text-slate-400">
              Querying KCA Fujairah Central Registry for <strong className="text-amber-300 font-mono">{targetId}</strong>
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
        <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white p-0.5 shadow-md flex items-center justify-center">
              <KcaLogo size={38} />
            </div>
            <div>
              <h1 className="font-display font-black text-sm tracking-tight text-white uppercase">
                KAIRALI CULTURAL ASSOCIATION
              </h1>
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                FUJAIRAH
              </div>
            </div>
          </div>

          {handlePortalAction && (
            <button
              onClick={handlePortalAction}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Back to Portal</span>
            </button>
          )}
        </header>

        <div className="max-w-md w-full mx-auto bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-4 my-auto shadow-2xl">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white">Membership Record Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            No active member was found matching identification query{' '}
            <strong className="text-rose-400 font-mono font-bold">{targetId || 'N/A'}</strong>. Please verify the mobile number or membership ID and try again.
          </p>
          {handlePortalAction && (
            <button
              onClick={handlePortalAction}
              className="w-full py-2.5 rounded-lg bg-[#8b0000] hover:bg-[#730000] text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
            >
              Return to KCA Portal
            </button>
          )}
        </div>

        <footer className="text-center text-xs text-slate-600 py-4">
          Kairali Cultural Association Fujairah &bull; Official Digital Portal
        </footer>
      </div>
    );
  }

  const expiry = getExpiryStatus(resolvedMember.expiryDate);
  const isActive = resolvedMember.status === 'Active' && !expiry.isExpired;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#8b0000] border-b border-[#730000] text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white p-0.5 shadow-md flex items-center justify-center">
              <KcaLogo size={36} />
            </div>
            <div>
              <h1 className="font-display font-black text-sm sm:text-base tracking-tight text-white uppercase leading-tight">
                KAIRALI CULTURAL ASSOCIATION
              </h1>
              <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                FUJAIRAH &bull; OFFICIAL DIGITAL ID VERIFICATION
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {handlePortalAction && (
              <button
                onClick={handlePortalAction}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Portal Home</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        {/* Verification Status Banner */}
        <div
          className={`p-4 sm:p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg ${
            isActive
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-100'
              : 'bg-amber-950/70 border-amber-500/40 text-amber-100'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}
            >
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    isActive ? 'bg-emerald-500 text-emerald-950' : 'bg-amber-500 text-amber-950'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {isActive ? 'Official Verified Member' : 'Record Verified (Renewal Due)'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">{resolvedMember.membershipId}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                {resolvedMember.fullName}
              </h2>
              <div className="text-xs text-slate-300 flex items-center gap-3 flex-wrap mt-0.5">
                <span>Unit: <strong>{resolvedMember.unit}</strong></span>
                <span>Type: <strong>{resolvedMember.membershipType}</strong></span>
                <span>Expiry: <strong>{formatCardDate(resolvedMember.expiryDate)}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyLink}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedLink ? 'Link Copied' : 'Share Link'}</span>
            </button>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#8b0000] text-white shadow-md flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>Official Digital Identity Card</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadIdCard}
              disabled={isExportingPng}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPng ? 'Saving...' : 'Download Card (PNG)'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Card</span>
            </button>
          </div>
        </div>

        {exportMessage && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportMessage}</span>
          </div>
        )}

        {/* Digital Identity Card View */}
        <div className="flex flex-col items-center justify-center py-4 space-y-6">
          <div className="p-2 sm:p-4 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl inline-block max-w-full overflow-x-auto">
            <IdCard member={resolvedMember} customFields={customFields} side="front" />
          </div>
          <p className="text-xs text-slate-400 text-center max-w-md">
            Official high-resolution digital identification card recognized across all KCA Fujairah units &amp; affiliated events.
          </p>
        </div>

        {/* Member Quick Info Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Registered Unit</span>
            </div>
            <div className="text-sm font-bold text-white">
              {resolvedMember.unit} Unit
            </div>
            <div className="text-[11px] text-slate-400">
              {resolvedMember.uaeAddress || 'Fujairah Region, UAE'}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
              <span>Blood Group</span>
            </div>
            <div className="text-sm font-bold text-rose-400">
              {resolvedMember.bloodGroup || 'Not Specified'}
            </div>
            <div className="text-[11px] text-slate-400">
              Emergency Donor Registry
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Membership Validity</span>
            </div>
            <div className="text-sm font-bold text-white">
              {formatCardDate(resolvedMember.expiryDate)}
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold">
              {isActive ? 'Active & Valid' : 'Renewal Pending'}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Kairali Cultural Association Fujairah
      </footer>
    </div>
  );
};
