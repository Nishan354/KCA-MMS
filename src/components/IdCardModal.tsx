import React, { useState } from 'react';
import { Member, CustomFieldDefinition } from '../types/member';
import { IdCard } from './IdCard';
import { downloadMemberIdCardPng } from '../utils/cardExporter';
import { getMemberVerifyUrl } from '../utils/idGenerator';
import {
  X,
  Download,
  Printer,
  CheckCircle,
  Share2,
  AlertCircle,
  Sparkles,
  Loader2,
  FileText,
  CreditCard,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LogoManagerModal } from './LogoManagerModal';

interface IdCardModalProps {
  member: Member | null;
  customFields?: CustomFieldDefinition[];
  onClose: () => void;
  onViewReceipt?: (member: Member) => void;
}

export const IdCardModal: React.FC<IdCardModalProps> = ({
  member,
  customFields = [],
  onClose,
  onViewReceipt,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);

  if (!member) return null;

  /**
   * High-definition 300-DPI ID Card Download (Front View Only)
   */
  const handleDownloadCard = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportMessage('Generating High-Definition ID Card PNG (Front View)...');

    try {
      await downloadMemberIdCardPng(member, customFields);
      setExportMessage('ID Card (Front View) downloaded successfully!');
      confetti({ particleCount: 40, spread: 60 });
      setTimeout(() => setExportMessage(null), 3500);
    } catch (err: any) {
      console.error('ID Card export error:', err);
      setExportError(`Export failed: ${err?.message || 'Unable to download image'}. Please use "Print Card" to Save as PDF.`);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyShareLink = () => {
    const verifyUrl = getMemberVerifyUrl(member);
    const text = `*Kairali Cultural Association Fujairah*\nMember ID: ${member.membershipId}\nName: ${member.fullName}\nUnit: ${member.unit} Unit\nBlood Group: ${member.bloodGroup}\nValid Thru: ${member.expiryDate}\nDigital Verification: ${verifyUrl}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden my-auto">
          {/* Modal Header */}
          <div className="px-6 py-4 bg-[#8b0000] text-white flex items-center justify-between border-b border-[#730000]">
            <div>
              <div className="text-xs font-medium text-red-100 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                <span>KCA Fujairah &bull; Official Membership ID Card</span>
              </div>
              <h3 className="font-display font-bold text-xl text-white mt-0.5">
                {member.fullName} ({member.membershipId})
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLogoModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-md border border-white/20 text-xs font-medium transition-colors cursor-pointer"
                title="Upload custom logo or reset to original"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Logo Options</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-white/80 hover:text-white rounded-md transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Status notification messages */}
          {exportMessage && (
            <div className="bg-emerald-50 text-emerald-800 px-6 py-2.5 border-b border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportMessage}</span>
            </div>
          )}

          {exportError && (
            <div className="bg-red-50 text-red-800 px-6 py-2.5 border-b border-red-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{exportError}</span>
            </div>
          )}

          {/* Modal Content - Front View Only */}
          <div className="p-6 md:p-8 bg-slate-100 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[360px]">
            <div className="transform scale-95 sm:scale-100 transition-transform">
              <IdCard
                member={member}
                customFields={customFields}
                side="front"
                idPrefix="visible-card"
                showShadow={true}
              />
            </div>

            <p className="text-xs text-slate-500 mt-6 text-center max-w-md">
              Rendered in standard CR-80 ISO format with member photo, official KCA emblem, Unit designation, and digital QR verification.
            </p>
          </div>

          {/* Modal Action Bar */}
          <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyShareLink}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors cursor-pointer"
              >
                {copiedLink ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-600" />}
                {copiedLink ? 'Copied Details!' : 'Share Card Info'}
              </button>

              {onViewReceipt && (
                <button
                  onClick={() => {
                    onClose();
                    onViewReceipt(member);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#8b0000]" />
                  <span>View Receipt</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-900 text-white transition-colors shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Card
              </button>

              {/* High-Resolution PNG Download Button */}
              <button
                onClick={handleDownloadCard}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-4.5 py-2 text-xs font-semibold rounded-md bg-[#8b0000] hover:bg-[#730000] text-white transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-amber-300" />}
                {isExporting ? 'Generating...' : 'Download ID Card (PNG)'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logo Customizer Modal */}
      <LogoManagerModal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
      />
    </>
  );
};
