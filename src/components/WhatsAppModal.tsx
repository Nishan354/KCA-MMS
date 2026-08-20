import React, { useState, useEffect, useRef } from 'react';
import { Member, UserSession } from '../types/member';
import { KcaLogo } from './Logo';
import {
  formatAED,
  formatCardDate,
  formatDate,
  getMemberVerifyUrl,
  getBasePortalUrl,
  setCustomPortalUrl,
} from '../utils/idGenerator';
import { downloadMemberIdCardPng } from '../utils/cardExporter';
import { downloadReceiptPdf } from '../utils/pdfGenerator';
import {
  X,
  Send,
  MessageSquare,
  Users,
  User,
  CheckCircle2,
  ExternalLink,
  Phone,
  Sparkles,
  IdCard,
  Copy,
  Globe,
  Settings2,
  Check,
  RotateCcw,
  ShieldCheck,
  FileText,
  Paperclip,
  Download,
  Search,
  Filter,
  CheckSquare,
  Square,
  Layers,
  Upload,
  Clock,
  ChevronRight,
  ChevronLeft,
  FileUp,
  File,
  Image as ImageIcon,
  Trash2,
  Tag,
  Plus,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WhatsAppModalProps {
  isOpen: boolean;
  members: Member[];
  initialMember?: Member | null;
  userSession?: UserSession | null;
  onClose: () => void;
}

export type WhatsAppTemplateKey =
  | 'id_card'
  | 'receipt'
  | 'renewal'
  | 'announcement'
  | 'welcome'
  | 'custom';

export type AttachmentType = 'none' | 'id_card_png' | 'receipt_pdf' | 'custom_file';

export interface CustomUploadedFile {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  members,
  initialMember,
  userSession,
  onClose,
}) => {
  // Recipient Selection State
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(() => {
    if (initialMember) return [initialMember.id];
    return members.length > 0 ? [members[0].id] : [];
  });
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewMemberId, setPreviewMemberId] = useState<string>(
    initialMember ? initialMember.id : members[0]?.id || ''
  );

  // Template State
  const [templateKey, setTemplateKey] = useState<WhatsAppTemplateKey>(
    initialMember ? 'id_card' : 'announcement'
  );

  // Verification Link Toggle: Rule specifies Default ON for id_card & receipt, Default OFF for others
  const [includeVerificationLink, setIncludeVerificationLink] = useState<boolean>(() => {
    return initialMember ? true : false;
  });

  // Custom Message Fields
  const [customTitle, setCustomTitle] = useState('Important Association Announcement');
  const [customBody, setCustomBody] = useState(
    'Dear *{Name}*,\n\nPlease review this important communication regarding {Unit} Unit.\n\n*Member ID:* {Member ID}\n*Validity:* {Validity}\n\n{Attachment}'
  );
  const [includeHeaderFooter, setIncludeHeaderFooter] = useState(true);
  const [includeAttachmentInBody, setIncludeAttachmentInBody] = useState(true);

  // Attachment State
  const [attachmentType, setAttachmentType] = useState<AttachmentType>('none');
  const [customFile, setCustomFile] = useState<CustomUploadedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Batch progress tracking
  const [activeBatchIndex, setActiveBatchIndex] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [preparingAttachment, setPreparingAttachment] = useState<boolean>(false);

  // Portal URL configuration
  const [portalUrl, setPortalUrl] = useState(() => getBasePortalUrl());
  const [showUrlSettings, setShowUrlSettings] = useState(false);
  const [urlSaveSuccess, setUrlSaveSuccess] = useState(false);

  // Whenever templateKey changes, configure appropriate default for verification link & attachment
  useEffect(() => {
    if (templateKey === 'id_card' || templateKey === 'receipt') {
      setIncludeVerificationLink(true);
    } else {
      // Announcements, Reminders, Renewals, Welcome, Custom messages do NOT include link by default
      setIncludeVerificationLink(false);
    }

    if (templateKey === 'id_card') {
      setAttachmentType('id_card_png');
    } else if (templateKey === 'receipt') {
      setAttachmentType('receipt_pdf');
    }
  }, [templateKey]);

  // Sync initial member if prop changes
  useEffect(() => {
    if (initialMember) {
      setSelectedMemberIds([initialMember.id]);
      setPreviewMemberId(initialMember.id);
    }
  }, [initialMember]);

  if (!isOpen) return null;

  const unitsList: string[] = Array.from(new Set(members.map((m) => m.unit))).filter(Boolean) as string[];

  // Filtered members for recipient selection
  const filteredMembers = members.filter((m) => {
    const matchesUnit = unitFilter === 'all' || m.unit.toLowerCase() === unitFilter.toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesUnit;
    const matchesSearch =
      m.fullName.toLowerCase().includes(q) ||
      m.membershipId.toLowerCase().includes(q) ||
      (m.phoneUAE || '').includes(q) ||
      (m.whatsapp || '').includes(q) ||
      m.unit.toLowerCase().includes(q);
    return matchesUnit && matchesSearch;
  });

  const selectedMembers = members.filter((m) => selectedMemberIds.includes(m.id));
  const currentPreviewMember =
    members.find((m) => m.id === previewMemberId) || selectedMembers[0] || members[0];

  const SIGNATURE = `_Warm Regards,_\n*Kairali Cultural Association Fujairah*`;

  // Handle custom file upload
  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read as DataURL for easy local download/preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomFile({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl: (event.target?.result as string) || '',
      });
      setAttachmentType('custom_file');
    };
    reader.readAsDataURL(file);
  };

  // Download uploaded custom file
  const downloadCustomUploadedFile = () => {
    if (!customFile) return;
    try {
      const link = document.createElement('a');
      link.href = customFile.dataUrl;
      link.download = customFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Failed to download custom file:', e);
    }
  };

  // Insert token tag into textarea at current cursor position
  const insertTokenIntoTextarea = (token: string) => {
    if (!textareaRef.current) {
      setCustomBody((prev) => `${prev} ${token}`);
      return;
    }
    const elem = textareaRef.current;
    const start = elem.selectionStart || 0;
    const end = elem.selectionEnd || 0;
    const text = customBody;
    const nextText = text.substring(0, start) + token + text.substring(end);
    setCustomBody(nextText);
    setTimeout(() => {
      elem.focus();
      elem.setSelectionRange(start + token.length, start + token.length);
    }, 50);
  };

  // Format clean UAE/International phone number for WhatsApp wa.me API
  const cleanPhoneForWhatsApp = (phone?: string): string => {
    if (!phone) return '';
    let digits = phone.replace(/[^0-9]/g, '');
    if (digits.startsWith('05')) {
      digits = '971' + digits.substring(1);
    } else if (digits.startsWith('5') && digits.length === 9) {
      digits = '971' + digits;
    }
    return digits;
  };

  // Get formatted attachment description for dynamic insertion into message
  const getAttachmentDescription = (m: Member): string => {
    if (attachmentType === 'custom_file' && customFile) {
      return `📎 *Attached File:* ${customFile.name} (${(customFile.size / 1024).toFixed(1)} KB)`;
    }
    if (attachmentType === 'id_card_png') {
      return `📎 *Attached Document:* Digital Membership ID Card (${m.membershipId}.png)`;
    }
    if (attachmentType === 'receipt_pdf') {
      return `📎 *Attached Document:* Official Payment Receipt PDF (${m.receiptNumber || 'REC-' + m.membershipId}.pdf)`;
    }
    return '';
  };

  const getAttachmentFileName = (m: Member): string => {
    if (attachmentType === 'custom_file' && customFile) {
      return customFile.name;
    }
    if (attachmentType === 'id_card_png') {
      return `KCA_ID_Card_${m.membershipId}.png`;
    }
    if (attachmentType === 'receipt_pdf') {
      return `KCA_Receipt_${m.receiptNumber || m.membershipId}.pdf`;
    }
    return '';
  };

  // Generate Message text according to rules and dynamic placeholders
  const generateMessageText = (m: Member): string => {
    const firstName = m.fullName.split(' ')[0] || m.fullName;
    const verifyUrl = getMemberVerifyUrl(m, false, true);
    const receiptUrl = getMemberVerifyUrl(m, true, true);
    const attachDesc = getAttachmentDescription(m);
    const attachFileName = getAttachmentFileName(m);

    let content = '';

    switch (templateKey) {
      case 'id_card': {
        content = `*KAIRALI CULTURAL ASSOCIATION FUJAIRAH*\n*OFFICIAL DIGITAL MEMBERSHIP ID CARD*\n\nDear *${m.fullName}*,\n\nYour official KCA Fujairah Membership ID Card has been updated and active in our central register.\n\n📋 *Membership Summary:*\n• *Member ID:* ${m.membershipId}\n• *Full Name:* ${m.fullName}${m.malayalamName ? ` (${m.malayalamName})` : ''}\n• *Unit:* ${m.unit} Unit\n• *Blood Group:* ${m.bloodGroup}\n• *Validity:* ${formatCardDate(m.expiryDate)}\n${m.joinDate ? `• *Join Date:* ${formatDate(m.joinDate)}\n` : ''}`;

        if (includeAttachmentInBody && attachDesc && attachmentType !== 'id_card_png') {
          content += `\n${attachDesc}\n`;
        }

        if (includeVerificationLink) {
          content += `\n🔗 *View & Download Digital ID Card:*\n${verifyUrl}\n`;
        }
        content += `\nPlease keep this card for association events, welfare programs, and member privileges.\n\n${SIGNATURE}`;
        break;
      }

      case 'receipt': {
        const isRenewal =
          m.registrationCategory === 'Renewal' ||
          (m.paymentHistory && m.paymentHistory.some((p) => p.purpose === 'Renewal Fee')) ||
          (!!m.lastRenewalDate && m.lastRenewalDate !== m.registrationDate);
        const feeDesc = isRenewal ? 'Renewal Membership Fee' : 'New Membership Fee';

        content = `*KAIRALI CULTURAL ASSOCIATION FUJAIRAH*\n*OFFICIAL PAYMENT RECEIPT (AED)*\n\nDear *${m.fullName}*,\n\nWe acknowledge with thanks the receipt of your membership subscription.\n\n🧾 *Receipt Voucher:* ${m.receiptNumber || 'REC-' + m.membershipId}\n• *Member ID:* ${m.membershipId}\n• *Description:* ${feeDesc}\n• *Amount Received:* ${formatAED(m.feeAmountAED)}\n• *Payment Mode:* ${m.paymentMethod || 'Cash'}\n• *Valid Thru:* ${formatDate(m.expiryDate)}\n• *Status:* ${m.paymentStatus}\n`;

        if (includeAttachmentInBody && attachDesc && attachmentType !== 'receipt_pdf') {
          content += `\n${attachDesc}\n`;
        }

        if (includeVerificationLink) {
          content += `\n🔗 *View & Download Official Receipt PDF:*\n${receiptUrl}\n`;
        }
        content += `\n${SIGNATURE}`;
        break;
      }

      case 'renewal': {
        content = `*KAIRALI CULTURAL ASSOCIATION FUJAIRAH*\n*MEMBERSHIP RENEWAL NOTICE*\n\nDear *${m.fullName}* (${m.membershipId}),\n\nThis is a friendly reminder regarding your KCA Fujairah membership validity up to *${formatCardDate(m.expiryDate)}*.\n\nPlease contact your *${m.unit} Unit Coordinator* or visit the office to complete your membership renewal.`;

        if (includeAttachmentInBody && attachDesc) {
          content += `\n\n${attachDesc}`;
        }

        if (includeVerificationLink) {
          content += `\n\n🔗 *Check Membership Status:*\n${verifyUrl}`;
        }
        content += `\n\n${SIGNATURE}`;
        break;
      }

      case 'announcement': {
        content = `*KAIRALI CULTURAL ASSOCIATION FUJAIRAH*\n*${customTitle.toUpperCase()}*\n\nDear *${firstName}*,\n\n${customBody || 'You are cordially invited to participate in our upcoming association program and general meeting. We request all active members and families of Fujairah, Kalba, Khorfakhan, and Dibba units to attend and support our community.'}`;

        if (includeAttachmentInBody && attachDesc && !content.includes(attachDesc)) {
          content += `\n\n${attachDesc}`;
        }

        if (includeVerificationLink) {
          content += `\n\n🔗 *Association Portal:*\n${verifyUrl}`;
        }
        content += `\n\n${SIGNATURE}`;
        break;
      }

      case 'welcome': {
        content = `*KAIRALI CULTURAL ASSOCIATION FUJAIRAH*\n*WELCOME TO KAIRALI FAMILY*\n\nDear *${m.fullName}*,\n\nWe are delighted to welcome you as a member of *Kairali Cultural Association Fujairah* (${m.unit} Unit).\n\n• *Member ID:* ${m.membershipId}\n• *Registered Date:* ${formatDate(m.registrationDate)}\n• *Validity:* ${formatCardDate(m.expiryDate)}`;

        if (includeAttachmentInBody && attachDesc) {
          content += `\n\n${attachDesc}`;
        }

        if (includeVerificationLink) {
          content += `\n\n🔗 *Access Member Profile:*\n${verifyUrl}`;
        }
        content += `\n\n${SIGNATURE}`;
        break;
      }

      case 'custom': {
        let text = (customBody || '').trim();
        if (!text) {
          text = `Dear *{Name}*,\n\nPlease review this important communication regarding {Unit} Unit.\n\n*Member ID:* {Member ID}\n*Validity:* {Validity}${attachDesc ? `\n\n${attachDesc}` : ''}`;
        }

        // Dynamic Placeholder Replacements
        const hasAttachmentToken = /\{(?:attachment|attached[\s_]?file|attached[\s_]?document|document|file|attachment[\s_]?name|file[\s_]?name|document[\s_]?name)\}/gi.test(text);

        text = text
          .replace(/\{(?:name|full[\s_]?name|member[\s_]?name)\}/gi, m.fullName)
          .replace(/\{(?:first[\s_]?name)\}/gi, firstName)
          .replace(/\{(?:id|member[\s_]?id|membership[\s_]?id)\}/gi, m.membershipId)
          .replace(/\{(?:unit|unit[\s_]?name)\}/gi, `${m.unit} Unit`)
          .replace(/\{(?:blood|blood[\s_]?group)\}/gi, m.bloodGroup)
          .replace(/\{(?:dob|date[\s_]?of[\s_]?birth)\}/gi, formatDate(m.dateOfBirth))
          .replace(/\{(?:validity|expiry|expiry[\s_]?date)\}/gi, formatCardDate(m.expiryDate))
          .replace(/\{(?:join|join[\s_]?date)\}/gi, m.joinDate ? formatDate(m.joinDate) : '')
          .replace(/\{(?:phone|uae[\s_]?phone|mobile|whatsapp)\}/gi, m.whatsapp || m.phoneUAE || '')
          .replace(/\{(?:receipt|receipt[\s_]?no|receipt[\s_]?number)\}/gi, m.receiptNumber || `REC-${m.membershipId}`)
          .replace(/\{(?:fee|fee[\s_]?amount|amount)\}/gi, formatAED(m.feeAmountAED))
          .replace(/\{(?:link|verify[\s_]?link|download[\s_]?link)\}/gi, verifyUrl)
          .replace(/\{(?:attachment|attached[\s_]?file|attached[\s_]?document|document|file)\}/gi, attachDesc || '')
          .replace(/\{(?:attachment[\s_]?name|file[\s_]?name|document[\s_]?name)\}/gi, attachFileName || '');

        // If user didn't explicitly place {Attachment} token in customBody, but checked includeAttachmentInBody:
        if (includeAttachmentInBody && attachDesc && !hasAttachmentToken && !text.includes(attachDesc) && !text.includes(attachFileName)) {
          text += `\n\n${attachDesc}`;
        }

        if (includeHeaderFooter) {
          content = `*KAIRALI CULTURAL ASSOCIATION FUJAIRAH*\n${customTitle ? `*${customTitle.toUpperCase()}*\n\n` : '\n'}${text}`;
          if (includeVerificationLink && !text.includes(verifyUrl)) {
            content += `\n\n🔗 *Member Verification:*\n${verifyUrl}`;
          }
          content += `\n\n${SIGNATURE}`;
        } else {
          content = text;
          if (includeVerificationLink && !text.includes(verifyUrl)) {
            content += `\n\n🔗 *Verification Link:* ${verifyUrl}`;
          }
        }
        break;
      }
    }

    return content;
  };

  // Toggle Member selection
  const toggleSelectMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredMembers.map((m) => m.id);
    const areAllSelected = allFilteredIds.every((id) => selectedMemberIds.includes(id));
    if (areAllSelected) {
      setSelectedMemberIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedMemberIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleOpenWhatsAppForMember = (m: Member) => {
    const text = generateMessageText(m);
    const phone = cleanPhoneForWhatsApp(m.whatsapp || m.phoneUAE);
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyMessage = (m: Member) => {
    const text = generateMessageText(m);
    navigator.clipboard.writeText(text);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyLink = (m: Member) => {
    const url =
      templateKey === 'receipt' ? getMemberVerifyUrl(m, true) : getMemberVerifyUrl(m);
    navigator.clipboard.writeText(url);
    setCopiedLinkId(m.id);
    setTimeout(() => setCopiedLinkId(null), 2500);
  };

  // Download Attachment for Member (Supports Digital ID Card PNG, Receipt PDF, or Custom Uploaded File)
  const handleDownloadAttachmentForMember = async (m: Member) => {
    try {
      setPreparingAttachment(true);
      if (attachmentType === 'id_card_png') {
        await downloadMemberIdCardPng(m);
      } else if (attachmentType === 'receipt_pdf') {
        await downloadReceiptPdf(m);
      } else if (attachmentType === 'custom_file') {
        downloadCustomUploadedFile();
      }
    } catch (e) {
      console.error('Error downloading attachment:', e);
      alert('Could not download attachment. You can copy the message text directly.');
    } finally {
      setPreparingAttachment(false);
    }
  };

  // Batch Next Sender
  const handleSendNextBatch = () => {
    if (selectedMembers.length === 0) return;
    const currentM = selectedMembers[activeBatchIndex];
    if (currentM) {
      handleOpenWhatsAppForMember(currentM);
      if (activeBatchIndex < selectedMembers.length - 1) {
        setActiveBatchIndex((prev) => prev + 1);
      }
    }
  };

  const handleSavePortalUrl = () => {
    setCustomPortalUrl(portalUrl);
    setUrlSaveSuccess(true);
    setTimeout(() => setUrlSaveSuccess(false), 2500);
  };

  const handleResetPortalUrl = () => {
    localStorage.removeItem('kca_custom_portal_url');
    const def = getBasePortalUrl();
    setPortalUrl(def);
    setUrlSaveSuccess(true);
    setTimeout(() => setUrlSaveSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden my-auto animate-fadeIn">
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#128C7E] text-white flex items-center justify-between border-b border-[#0e6f64]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white p-1 flex items-center justify-center shadow-xs">
              <KcaLogo size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-white">
                  WhatsApp Message Center &amp; Dispatcher
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider">
                  KCA Fujairah
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Customizable message templates, multi-member selection &amp; attachment dispatch
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Link Policy & Domain Bar */}
        <div className="bg-emerald-50 px-6 py-2 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-950 font-medium">
            <Globe className="w-4 h-4 text-[#128C7E] shrink-0" />
            <span>
              Published Verification Base URL:{' '}
              <strong className="font-mono text-emerald-900">{portalUrl}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowUrlSettings(!showUrlSettings)}
            className="text-xs font-bold text-[#128C7E] hover:text-[#0e6f64] underline inline-flex items-center gap-1 cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{showUrlSettings ? 'Hide URL Config' : 'Configure Base URL'}</span>
          </button>
        </div>

        {/* URL Configuration Panel */}
        {showUrlSettings && (
          <div className="bg-white p-4 border-b border-slate-200 space-y-2 text-xs animate-fadeIn">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>Production Verification Domain (Default: https://kca-fuj-mms.ai.studio)</span>
              {urlSaveSuccess && (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Domain Saved!
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={portalUrl}
                onChange={(e) => setPortalUrl(e.target.value)}
                placeholder="https://kca-fuj-mms.ai.studio"
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md font-mono text-xs text-slate-900 bg-slate-50 focus:bg-white outline-none"
              />
              <button
                type="button"
                onClick={handleSavePortalUrl}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md font-bold transition-colors cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleResetPortalUrl}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Default</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          {/* Top 3 Columns: 1. Template Choice | 2. Custom Message & Options | 3. Attachments */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Template Choice */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Message Template
              </label>

              <div className="grid grid-cols-1 gap-1.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setTemplateKey('id_card')}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                    templateKey === 'id_card'
                      ? 'bg-emerald-50 border-[#128C7E] text-emerald-950 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <IdCard className="w-4 h-4 text-[#128C7E]" />
                    <span>Digital Membership Card</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                    With Link
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateKey('receipt')}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                    templateKey === 'receipt'
                      ? 'bg-emerald-50 border-[#128C7E] text-emerald-950 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#128C7E]" />
                    <span>Official Payment Receipt</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                    With Link
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateKey('renewal')}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                    templateKey === 'renewal'
                      ? 'bg-emerald-50 border-[#128C7E] text-emerald-950 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#128C7E]" />
                    <span>Renewal Reminder</span>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                    Notice Only
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateKey('announcement')}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                    templateKey === 'announcement'
                      ? 'bg-emerald-50 border-[#128C7E] text-emerald-950 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#128C7E]" />
                    <span>General Announcement</span>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                    No Link
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateKey('welcome')}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                    templateKey === 'welcome'
                      ? 'bg-emerald-50 border-[#128C7E] text-emerald-950 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#128C7E]" />
                    <span>Welcome New Member</span>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                    No Link
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateKey('custom')}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                    templateKey === 'custom'
                      ? 'bg-emerald-50 border-[#128C7E] text-emerald-950 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-[#128C7E]" />
                    <span>Custom Message &amp; Text</span>
                  </div>
                  <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-mono font-bold">
                    Custom
                  </span>
                </button>
              </div>
            </div>

            {/* 2. Custom Message Content & Token Insertions */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Customize Message Text
                </label>
                {templateKey === 'custom' && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Freeform Mode
                  </span>
                )}
              </div>

              {(templateKey === 'announcement' || templateKey === 'custom') && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Subject / Title:
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Monthly General Meeting / Cultural Fest / Emergency Notice"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:ring-1 focus:ring-[#128C7E]"
                  />
                </div>
              )}

              {/* Dynamic Tag Placeholder Pills */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Message Body (Click token to insert):
                  </label>
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {[
                    { label: '+ {Name}', token: '{Name}' },
                    { label: '+ {First Name}', token: '{First Name}' },
                    { label: '+ {Member ID}', token: '{Member ID}' },
                    { label: '+ {Unit}', token: '{Unit}' },
                    { label: '+ {Attachment}', token: '{Attachment}', highlight: true },
                    { label: '+ {File Name}', token: '{File Name}', highlight: true },
                    { label: '+ {Validity}', token: '{Validity}' },
                    { label: '+ {Blood Group}', token: '{Blood Group}' },
                    { label: '+ {Phone}', token: '{Phone}' },
                    { label: '+ {Receipt No}', token: '{Receipt No}' },
                    { label: '+ {Fee Amount}', token: '{Fee Amount}' },
                    { label: '+ {Verify Link}', token: '{Verify Link}' },
                  ].map((btn) => (
                    <button
                      key={btn.token}
                      type="button"
                      onClick={() => insertTokenIntoTextarea(btn.token)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer border ${
                        btn.highlight
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                          : 'bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 border-slate-200'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <textarea
                  ref={textareaRef}
                  rows={4}
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  placeholder={
                    templateKey === 'announcement'
                      ? 'Type event date, location, agenda, and instructions...'
                      : templateKey === 'custom'
                      ? 'Write your custom WhatsApp message here... (use tokens like {Name}, {Member ID}, {Unit})'
                      : 'Add any optional personal note or instruction...'
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 outline-none focus:ring-1 focus:ring-[#128C7E] font-sans"
                />
              </div>

              {/* Header/Footer & Verification Link Toggles */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                {templateKey === 'custom' && (
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeHeaderFooter}
                      onChange={(e) => setIncludeHeaderFooter(e.target.checked)}
                      className="h-3.5 w-3.5 rounded text-[#128C7E] focus:ring-[#128C7E] border-slate-300"
                    />
                    <span className="font-semibold text-[11px]">
                      Include Official KCA Header &amp; Signature
                    </span>
                  </label>
                )}

                <label className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeVerificationLink}
                    onChange={(e) => setIncludeVerificationLink(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded text-[#128C7E] focus:ring-[#128C7E] border-slate-300 cursor-pointer"
                  />
                  <div>
                    <div className="font-bold text-[11px] text-slate-800">
                      Include Digital Verification / Download Link
                    </div>
                    <div className="text-[10px] text-slate-500 leading-normal">
                      {includeVerificationLink
                        ? 'Verification link will be appended to the WhatsApp message.'
                        : 'No link will be added (clean notice mode).'}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* 3. Attachments: Universal File Upload, Digital ID Card, or Receipt */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                3. Attachments &amp; Documents
              </label>

              <div className="space-y-1.5 text-xs">
                {/* 1. Custom File Upload Option */}
                <label
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                    attachmentType === 'custom_file'
                      ? 'bg-emerald-50 border-[#128C7E] font-bold text-emerald-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="wa_attachment"
                    checked={attachmentType === 'custom_file'}
                    onChange={() => setAttachmentType('custom_file')}
                    className="text-[#128C7E] focus:ring-[#128C7E]"
                  />
                  <FileUp className="w-4 h-4 text-[#128C7E]" />
                  <span>Custom File (Upload Any Image/PDF/Doc)</span>
                </label>

                {/* 2. Digital ID Card */}
                <label
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                    attachmentType === 'id_card_png'
                      ? 'bg-emerald-50 border-[#128C7E] font-bold text-emerald-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="wa_attachment"
                    checked={attachmentType === 'id_card_png'}
                    onChange={() => setAttachmentType('id_card_png')}
                    className="text-[#128C7E] focus:ring-[#128C7E]"
                  />
                  <IdCard className="w-4 h-4 text-[#128C7E]" />
                  <span>Digital ID Card (PNG Image)</span>
                </label>

                {/* 3. Payment Receipt */}
                <label
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                    attachmentType === 'receipt_pdf'
                      ? 'bg-emerald-50 border-[#128C7E] font-bold text-emerald-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="wa_attachment"
                    checked={attachmentType === 'receipt_pdf'}
                    onChange={() => setAttachmentType('receipt_pdf')}
                    className="text-[#128C7E] focus:ring-[#128C7E]"
                  />
                  <FileText className="w-4 h-4 text-[#128C7E]" />
                  <span>Payment Receipt (PDF Document)</span>
                </label>

                {/* 4. None */}
                <label
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                    attachmentType === 'none'
                      ? 'bg-emerald-50 border-[#128C7E] font-bold text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="wa_attachment"
                    checked={attachmentType === 'none'}
                    onChange={() => setAttachmentType('none')}
                    className="text-[#128C7E] focus:ring-[#128C7E]"
                  />
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <span>Text Message Only (No File)</span>
                </label>
              </div>

              {/* Attachment in Message Options */}
              {attachmentType !== 'none' && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/60 border border-emerald-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeAttachmentInBody}
                      onChange={(e) => setIncludeAttachmentInBody(e.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 rounded text-[#128C7E] focus:ring-[#128C7E] border-slate-300 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-emerald-950 block">
                        Include Attachment Note in Message Body
                      </span>
                      <span className="text-[10px] text-emerald-800">
                        Automatically embeds the attached file name into the WhatsApp text.
                      </span>
                    </div>
                  </label>

                  {templateKey === 'custom' && (
                    <button
                      type="button"
                      onClick={() => insertTokenIntoTextarea('{Attachment}')}
                      className="w-full py-1.5 px-2.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Insert <code className="text-emerald-800 font-mono font-bold">{'{Attachment}'}</code> Tag into Message Text</span>
                    </button>
                  )}
                </div>
              )}

              {/* Custom File Upload Box */}
              {attachmentType === 'custom_file' && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 animate-fadeIn text-xs">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleCustomFileUpload}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    className="hidden"
                  />

                  {customFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-emerald-200">
                        <div className="flex items-center gap-2 min-w-0">
                          {customFile.type.startsWith('image/') ? (
                            <img
                              src={customFile.dataUrl}
                              alt="preview"
                              className="w-7 h-7 object-cover rounded border border-slate-200 shrink-0"
                            />
                          ) : (
                            <File className="w-6 h-6 text-emerald-700 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 truncate text-[11px]">
                              {customFile.name}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {(customFile.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-1 text-slate-600 hover:text-slate-900 bg-slate-100 rounded hover:bg-slate-200 text-[10px] font-semibold cursor-pointer"
                            title="Change File"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomFile(null)}
                            className="p-1 text-rose-600 hover:text-rose-800 bg-rose-50 rounded hover:bg-rose-100 text-[10px] cursor-pointer"
                            title="Remove File"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={downloadCustomUploadedFile}
                        className="w-full py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Attached File</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 px-3 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl bg-white hover:bg-emerald-50/50 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center"
                      >
                        <Upload className="w-5 h-5 text-emerald-700" />
                        <span className="font-bold text-emerald-950 text-xs">
                          Click to Attach Any File
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Images, PDFs, Word, Posters, Circulars (up to 20MB)
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ID Card / Receipt Download Preview */}
              {(attachmentType === 'id_card_png' || attachmentType === 'receipt_pdf') &&
                currentPreviewMember && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleDownloadAttachmentForMember(currentPreviewMember)}
                      disabled={preparingAttachment}
                      className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>
                        {preparingAttachment
                          ? 'Preparing Document...'
                          : `Download ${
                              attachmentType === 'id_card_png'
                                ? 'ID Card (PNG)'
                                : 'Receipt (PDF)'
                            } to Attach`}
                      </span>
                    </button>
                    <p className="text-[10px] text-slate-500 mt-1 text-center">
                      Files can be dragged and dropped directly into WhatsApp Web/Desktop.
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* Live Message Preview Box */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Live Message Preview
                </span>
                <span className="text-xs font-mono text-[#128C7E] bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                  For: {currentPreviewMember?.fullName} ({currentPreviewMember?.membershipId})
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Previewing recipient:</span>
                <select
                  value={previewMemberId}
                  onChange={(e) => setPreviewMemberId(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded text-xs bg-slate-50 font-medium outline-none"
                >
                  {selectedMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.membershipId})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* WhatsApp Bubble Preview */}
            <div className="bg-[#EFEAE2] p-4 rounded-xl border border-[#e0dad0] text-xs text-slate-900 font-sans whitespace-pre-wrap leading-relaxed shadow-inner max-h-56 overflow-y-auto">
              {currentPreviewMember && generateMessageText(currentPreviewMember)}
            </div>
          </div>

          {/* Recipients Selection Table with Multi-Select */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Table Header Bar with Unit Filter and Select All */}
            <div className="px-5 py-3.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-[#128C7E] cursor-pointer"
                >
                  {filteredMembers.length > 0 &&
                  filteredMembers.every((m) => selectedMemberIds.includes(m.id)) ? (
                    <CheckSquare className="w-4 h-4 text-[#128C7E]" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>
                    Select All ({selectedMemberIds.length}/{members.length} selected)
                  </span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search member, ID, mobile..."
                    className="pl-8 pr-3 py-1 border border-slate-300 rounded-md text-xs bg-white text-slate-800 outline-none w-48 focus:w-56 transition-all"
                  />
                </div>

                {/* Unit filter */}
                <div className="flex items-center gap-1 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={unitFilter}
                    onChange={(e) => setUnitFilter(e.target.value)}
                    className="px-2 py-1 border border-slate-300 rounded-md text-xs bg-white text-slate-800 outline-none"
                  >
                    <option value="all">All Units ({members.length})</option>
                    {unitsList.map((u) => (
                      <option key={u} value={u}>
                        {u} Unit ({members.filter((m) => m.unit.toLowerCase() === u.toLowerCase()).length})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Recipients List Table */}
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {filteredMembers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No members matched your search or unit filter.
                </div>
              ) : (
                filteredMembers.map((m) => {
                  const isSelected = selectedMemberIds.includes(m.id);
                  const phone = cleanPhoneForWhatsApp(m.whatsapp || m.phoneUAE);
                  const hasPhone = !!phone;

                  return (
                    <div
                      key={m.id}
                      className={`px-5 py-3 flex items-center justify-between transition-colors gap-3 ${
                        isSelected ? 'bg-emerald-50/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Checkbox and Member Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleSelectMember(m.id)}
                          className="text-slate-400 hover:text-[#128C7E] cursor-pointer shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4.5 h-4.5 text-[#128C7E]" />
                          ) : (
                            <Square className="w-4.5 h-4.5" />
                          )}
                        </button>

                        <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 shrink-0">
                          <img
                            src={m.photoUrl}
                            alt={m.fullName}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 truncate flex items-center gap-2">
                            <span>{m.fullName}</span>
                            <span className="font-mono text-[10px] text-[#128C7E] bg-emerald-50 px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
                              {m.membershipId}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 rounded">
                              {m.unit} Unit
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {m.whatsapp || m.phoneUAE || 'No Phone'}
                            </span>
                            {m.joinDate && (
                              <span>Join: {formatDate(m.joinDate)}</span>
                            )}
                            <span>Exp: {formatCardDate(m.expiryDate)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Download Attachment */}
                        {attachmentType !== 'none' && (
                          <button
                            type="button"
                            onClick={() => handleDownloadAttachmentForMember(m)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 rounded bg-slate-100 hover:bg-slate-200 text-xs flex items-center gap-1 cursor-pointer font-medium"
                            title="Download Attachment File"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">
                              {attachmentType === 'custom_file' ? 'Download File' : 'Download'}
                            </span>
                          </button>
                        )}

                        {/* Copy Link */}
                        {includeVerificationLink && (
                          <button
                            type="button"
                            onClick={() => handleCopyLink(m)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 rounded bg-slate-100 hover:bg-slate-200 text-xs flex items-center gap-1 cursor-pointer font-medium"
                            title="Copy Verification Link"
                          >
                            {copiedLinkId === m.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Globe className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">
                              {copiedLinkId === m.id ? 'Copied' : 'Link'}
                            </span>
                          </button>
                        )}

                        {/* Copy Full Message */}
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(m)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 rounded bg-slate-100 hover:bg-slate-200 text-xs flex items-center gap-1 cursor-pointer font-medium"
                          title="Copy Full Message to Clipboard"
                        >
                          {copiedId === m.id ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">
                            {copiedId === m.id ? 'Copied' : 'Copy'}
                          </span>
                        </button>

                        {/* 1-Click WhatsApp Direct Send */}
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsAppForMember(m)}
                          disabled={!hasPhone}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer with Batch Dispatch Assistant */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-800">
              Selected: {selectedMembers.length} {selectedMembers.length === 1 ? 'member' : 'members'}
            </span>
            {selectedMembers.length > 1 && (
              <span className="text-slate-500">
                (Recipient #{activeBatchIndex + 1}:{' '}
                <strong className="text-slate-800">
                  {selectedMembers[activeBatchIndex]?.fullName || 'Ready'}
                </strong>
                )
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedMembers.length > 1 && (
              <button
                type="button"
                onClick={handleSendNextBatch}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  Send Next ({activeBatchIndex + 1}/{selectedMembers.length})
                </span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition-colors cursor-pointer text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
