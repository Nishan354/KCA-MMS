import React, { useState } from 'react';
import { Member, CustomFieldDefinition } from '../types/member';
import { IdCard } from './IdCard';
import { ID_CARD_DESIGNS, IdCardDesignId, getIdCardDesign } from '../types/cardDesign';
import { HeaderTitleStyle } from '../types/portal';
import { resolveEffectiveTitleStyle } from '../utils/titleGraphic';
import { downloadMemberIdCardPng, captureElementAsPng, downloadDataUrl } from '../utils/cardExporter';
import { getMemberVerifyUrl } from '../utils/idGenerator';
import { usePortalConfig } from '../hooks/usePortalConfig';
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
  Palette,
  Check,
  Bookmark,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LogoManagerModal } from './LogoManagerModal';

interface IdCardModalProps {
  member: Member | null;
  customFields?: CustomFieldDefinition[];
  onClose: () => void;
  onViewReceipt?: (member: Member) => void;
  onUpdateMember?: (updated: Member) => void;
}

export const IdCardModal: React.FC<IdCardModalProps> = ({
  member,
  customFields = [],
  onClose,
  onViewReceipt,
  onUpdateMember,
}) => {
  const { portalConfig, updateConfig } = usePortalConfig();
  const [selectedDesign, setSelectedDesign] = useState<IdCardDesignId>(
    () => member?.cardDesign || portalConfig.defaultCardDesign || 'classic_wave'
  );
  const [selectedTitleStyle, setSelectedTitleStyle] = useState<HeaderTitleStyle>(
    () => resolveEffectiveTitleStyle(portalConfig, 'member_card')
  );
  const [cardSide, setCardSide] = useState<'front' | 'back' | 'both'>('front');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);

  if (!member) return null;

  const currentDesignOption = getIdCardDesign(selectedDesign);

  /**
   * High-definition 300-DPI ID Card Download
   * Dynamically downloads either the front side, back side, or both based on selection
   */
  const handleDownloadCard = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportMessage(`Generating High-Definition ${currentDesignOption.name} PNG...`);

    try {
      const sanitizedName = member.fullName.replace(/[^a-zA-Z0-9_-]/g, '_');

      if (cardSide === 'back') {
        const backEl = document.getElementById(`visible-card-${member.id}-back`);
        if (backEl) {
          const dataUrl = await captureElementAsPng(backEl, { pixelRatio: 3, backgroundColor: '#ffffff' });
          downloadDataUrl(dataUrl, `ID_${member.membershipId}_${sanitizedName}_BACK_${selectedDesign.toUpperCase()}.png`);
        } else {
          throw new Error('Back of card element is not mounted');
        }
      } else if (cardSide === 'both') {
        const frontEl = document.getElementById(`visible-card-${member.id}-front`);
        const backEl = document.getElementById(`visible-card-${member.id}-back`);

        if (frontEl) {
          const frontData = await captureElementAsPng(frontEl, { pixelRatio: 3, backgroundColor: '#ffffff' });
          downloadDataUrl(frontData, `ID_${member.membershipId}_${sanitizedName}_FRONT_${selectedDesign.toUpperCase()}.png`);
        }
        if (backEl) {
          const backData = await captureElementAsPng(backEl, { pixelRatio: 3, backgroundColor: '#ffffff' });
          downloadDataUrl(backData, `ID_${member.membershipId}_${sanitizedName}_BACK_${selectedDesign.toUpperCase()}.png`);
        }
      } else {
        // Front View
        const frontEl = document.getElementById(`visible-card-${member.id}-front`);
        if (frontEl) {
          const dataUrl = await captureElementAsPng(frontEl, { pixelRatio: 3, backgroundColor: '#ffffff' });
          downloadDataUrl(dataUrl, `ID_${member.membershipId}_${sanitizedName}_FRONT_${selectedDesign.toUpperCase()}.png`);
        } else {
          await downloadMemberIdCardPng(member, customFields);
        }
      }

      setExportMessage(`ID Card (${currentDesignOption.name}) downloaded successfully!`);
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

  const handleSaveAsMemberDefault = () => {
    if (!onUpdateMember) return;
    const updated: Member = {
      ...member,
      cardDesign: selectedDesign,
    };
    onUpdateMember(updated);
    setExportMessage(`Saved "${currentDesignOption.name}" as ${member.fullName}'s default ID card design!`);
    confetti({ particleCount: 30, spread: 50 });
    setTimeout(() => setExportMessage(null), 3500);
  };

  const handleSaveAsSystemDefault = () => {
    updateConfig({ defaultCardDesign: selectedDesign });
    setExportMessage(`Set "${currentDesignOption.name}" as the organization-wide default ID card design!`);
    confetti({ particleCount: 35, spread: 55 });
    setTimeout(() => setExportMessage(null), 3500);
  };

  const handleApplyTitleToAllMembers = (styleToApply: HeaderTitleStyle) => {
    setSelectedTitleStyle(styleToApply);
    updateConfig({
      headerTitleStyle: styleToApply,
      applyTitleToMemberCards: styleToApply !== 'standard',
    });
    const label =
      styleToApply === 'official_lockup'
        ? 'Official KCA Title Lockup'
        : styleToApply === 'title_graphic'
        ? 'Official Title Graphic Banner'
        : 'Standard Header';
    setExportMessage(`Applied "${label}" across all Member ID cards!`);
    confetti({ particleCount: 30, spread: 50 });
    setTimeout(() => setExportMessage(null), 3500);
  };

  const handleCopyShareLink = () => {
    const verifyUrl = getMemberVerifyUrl(member);
    const bloodLine = member.bloodGroup ? `\nBlood Group: ${member.bloodGroup}` : '';
    const text = `*${portalConfig.portalName}*\nMember ID: ${member.membershipId}\nName: ${member.fullName}\nUnit: ${member.unit} Unit${bloodLine}\nValid Thru: ${member.expiryDate}\nDesign: ${currentDesignOption.name}\nDigital Verification: ${verifyUrl}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden my-auto animate-scaleUp">
          {/* Modal Header */}
          <div
            className="px-6 py-4 text-white flex items-center justify-between border-b"
            style={{
              backgroundColor: portalConfig.primaryColor || '#8b0000',
              borderColor: 'rgba(0,0,0,0.15)',
            }}
          >
            <div>
              <div className="text-xs font-semibold text-white/90 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-300" />
                <span>{portalConfig.shortName || portalConfig.portalName} &bull; Member Credential</span>
              </div>
              <h3 className="font-display font-black text-xl text-white mt-0.5">
                {member.fullName} <span className="font-mono text-sm opacity-90 font-bold">({member.membershipId})</span>
              </h3>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowLogoModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 text-xs font-semibold transition-colors cursor-pointer"
                title="Upload custom logo or reset to original"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Logo Options</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Dynamic Design Selector Toolbar */}
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-col gap-2.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Select ID Card Design:
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-200 font-bold text-slate-700">
                  {currentDesignOption.badge}
                </span>
              </div>

              {/* View Side Toggles & Default Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-xs font-semibold shadow-2xs">
                  <button
                    onClick={() => setCardSide('front')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      cardSide === 'front' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Front
                  </button>
                  <button
                    onClick={() => setCardSide('back')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      cardSide === 'back' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCardSide('both')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      cardSide === 'both' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Both
                  </button>
                </div>

                {onUpdateMember && (
                  <button
                    onClick={handleSaveAsMemberDefault}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold shadow-2xs cursor-pointer transition-colors"
                    title="Remember this design for this specific member"
                  >
                    <Bookmark className="w-3 h-3 text-rose-700" />
                    <span>Save for Member</span>
                  </button>
                )}

                <button
                  onClick={handleSaveAsSystemDefault}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold shadow-2xs cursor-pointer transition-colors"
                  title="Make this the default card design for all members"
                >
                  <Layers className="w-3 h-3 text-amber-600" />
                  <span>Set as System Default</span>
                </button>
              </div>
            </div>

            {/* Design Cards Carousel / Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-0.5">
              {ID_CARD_DESIGNS.map((d) => {
                const isSelected = d.id === selectedDesign;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDesign(d.id)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white border-slate-900 ring-2 ring-slate-900/20 shadow-xs'
                        : 'bg-white/80 hover:bg-white hover:border-slate-300 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1 w-full">
                      <div className="flex items-center gap-1">
                        <span
                          className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: d.previewColors.primary }}
                        />
                        <span className="text-[10.5px] font-bold text-slate-900 truncate">
                          {d.name.split(' ')[0]}
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-slate-900 shrink-0" />}
                    </div>
                    <span className="text-[9px] text-slate-500 line-clamp-1">
                      {d.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Header Title Lockup Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-200/80">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Header Title:
                </span>
                <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-[11px] font-semibold">
                  {(
                    [
                      { id: 'official_lockup', label: 'Official KCA Title' },
                      { id: 'title_graphic', label: 'Title Graphic Image' },
                      { id: 'standard', label: 'Standard Text' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedTitleStyle(opt.id)}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        selectedTitleStyle === opt.id
                          ? 'bg-slate-900 text-white font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleApplyTitleToAllMembers(selectedTitleStyle)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#8b0000] border border-rose-200 text-[11px] font-bold cursor-pointer transition-colors"
                title="Apply selected header title style to all member ID cards"
              >
                <Check className="w-3 h-3" />
                <span>Apply Title to All Member Cards</span>
              </button>
            </div>
          </div>

          {/* Status notification messages */}
          {exportMessage && (
            <div className="bg-emerald-50 text-emerald-800 px-6 py-2 border-b border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportMessage}</span>
            </div>
          )}

          {exportError && (
            <div className="bg-red-50 text-red-800 px-6 py-2 border-b border-red-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{exportError}</span>
            </div>
          )}

          {/* Modal Content - Live Card Preview */}
          <div className="p-6 md:p-8 bg-slate-100 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[380px]">
            <div className="transform scale-95 sm:scale-100 transition-transform">
              <IdCard
                member={member}
                customFields={customFields}
                side={cardSide}
                cardDesign={selectedDesign}
                titleStyle={selectedTitleStyle}
                idPrefix="visible-card"
                showShadow={true}
              />
            </div>

            <div className="text-center mt-6 max-w-lg">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/80 text-slate-700 text-[11px] font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Active Template: <strong>{currentDesignOption.name}</strong></span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {currentDesignOption.description}
              </p>
            </div>
          </div>

          {/* Modal Action Bar */}
          <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyShareLink}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors cursor-pointer"
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-rose-700" />
                  <span>View Receipt</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition-colors shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Card
              </button>

              {/* High-Resolution PNG Download Button */}
              <button
                onClick={handleDownloadCard}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-4.5 py-2 text-xs font-semibold rounded-lg text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
                style={{ backgroundColor: portalConfig.primaryColor || '#8b0000' }}
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-amber-300" />}
                {isExporting ? 'Generating...' : `Download ${currentDesignOption.name.split(' ')[0]} (PNG)`}
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
