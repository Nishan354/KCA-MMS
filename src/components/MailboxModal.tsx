import React, { useState, useEffect } from 'react';
import { Member, UserSession } from '../types/member';
import { formatDate } from '../utils/idGenerator';
import {
  X,
  Mail,
  Send,
  Inbox,
  Paperclip,
  CheckCircle2,
  Trash2,
  Reply,
  Star,
  Search,
  Building2,
  Copy,
  Check,
  ExternalLink,
  Filter,
  FileText,
  Clock,
  Sparkles,
  Archive,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { OFFICIAL_EMAIL, OFFICIAL_ORG_NAME } from '../config/constants';

interface MailItem {
  id: string;
  senderName: string;
  senderEmail: string;
  recipientEmail?: string;
  memberId?: string;
  unit?: string;
  subject: string;
  body: string;
  date: string;
  hasAttachment?: boolean;
  attachmentName?: string;
  isRead: boolean;
  isStarred?: boolean;
  category: 'document_submission' | 'inquiry' | 'renewal_request' | 'blood_donor' | 'official_notice';
}

interface MailboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  userSession: UserSession;
}

const STORAGE_KEY_INBOX = 'kca_fujairah_mailbox_inbox_v3';
const STORAGE_KEY_SENT = 'kca_fujairah_mailbox_sent_v3';

const INITIAL_INBOX: MailItem[] = [
  {
    id: 'mail-01',
    senderName: 'Suresh Kumar Pillai',
    senderEmail: 'suresh.pillai@example.com',
    memberId: 'KCA-FU-1001',
    unit: 'Fujairah',
    subject: 'Emirates ID Renewal Document Submission - KCA-FU-1001',
    body: 'Respected Kairali Cultural Association Central Committee,\n\nI have attached my renewed Emirates ID and Visa copy for updating my member file and issuing my 2026-2027 membership card.\n\nKindly confirm once verified.\n\nThank you,\nSuresh Kumar Pillai\nFujairah Unit\nMobile: +971 50 482 9134',
    date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    hasAttachment: true,
    attachmentName: 'Emirates_ID_Renewal_2026.pdf',
    isRead: false,
    isStarred: true,
    category: 'document_submission',
  },
  {
    id: 'mail-02',
    senderName: 'Rahul Rajan',
    senderEmail: 'rahul.rajan@example.com',
    memberId: 'KCA-KB-1001',
    unit: 'Kalba',
    subject: 'NORKA Pravasi ID Registration & Card Update',
    body: 'Dear Kairali Office,\n\nKindly note my new NORKA Pravasi ID: NRK-902184. Please update in my portal records.\n\nRegards,\nRahul Rajan\nKalba Unit',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    hasAttachment: false,
    isRead: true,
    category: 'renewal_request',
  },
  {
    id: 'mail-03',
    senderName: 'Manoj Viswanathan',
    senderEmail: 'manoj.v@example.com',
    memberId: 'KCA-KF-1001',
    unit: 'Khorfakhan',
    subject: 'Family Medical Camp & Blood Donor Volunteer Registration',
    body: 'Lal Salam,\n\nI would like to volunteer for the upcoming Kairali blood donation camp in Fujairah. My blood group is O+ Positive.\n\nWarm regards,\nManoj V\nKhorfakhan Unit',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    hasAttachment: false,
    isRead: true,
    isStarred: true,
    category: 'blood_donor',
  },
];

const INITIAL_SENT: MailItem[] = [
  {
    id: 'sent-01',
    senderName: 'KCA Fujairah Central Committee',
    senderEmail: OFFICIAL_EMAIL,
    recipientEmail: 'suresh.pillai@example.com',
    memberId: 'KCA-FU-1001',
    subject: 'Official KCA Fujairah Digital ID Card & Payment Receipt Ready',
    body: 'Dear Suresh Kumar Pillai,\n\nGreetings from Kairali Cultural Association Fujairah.\n\nYour membership record has been successfully verified. You can now download your official 2026-2027 Digital ID Card and Payment Voucher.\n\nPortal: https://kcaf-mms.ai.studio/?verify=KCA-FU-1001\n\nCentral Committee,\nKCA Fujairah, UAE',
    date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    isRead: true,
    category: 'official_notice',
  },
];

export const MailboxModal: React.FC<MailboxModalProps> = ({
  isOpen,
  onClose,
  members,
  userSession,
}) => {
  const officialMailboxEmail = OFFICIAL_EMAIL;

  const [activeFolder, setActiveFolder] = useState<'inbox' | 'compose' | 'sent' | 'starred'>('inbox');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Mails State with LocalStorage Persistence
  const [inboxMails, setInboxMails] = useState<MailItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_INBOX);
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_INBOX;
  });

  const [sentMails, setSentMails] = useState<MailItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SENT);
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_SENT;
  });

  // Save to storage on state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INBOX, JSON.stringify(inboxMails));
    } catch {}
  }, [inboxMails]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SENT, JSON.stringify(sentMails));
    } catch {}
  }, [sentMails]);

  // Compose State
  const [composeRecipient, setComposeRecipient] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeCategory, setComposeCategory] = useState<MailItem['category']>('official_notice');
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopyMailbox = () => {
    navigator.clipboard.writeText(officialMailboxEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyMessageBody = () => {
    if (!composeBody) return;
    const fullText = `To: ${composeRecipient}\nSubject: ${composeSubject}\n\n${composeBody}`;
    navigator.clipboard.writeText(fullText);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  // Quick Template Injector
  const applyTemplate = (templateKey: string) => {
    const selectedMember = members.find((m) => m.email === composeRecipient);
    const memberName = selectedMember ? selectedMember.fullName : 'Member';
    const memberId = selectedMember ? selectedMember.membershipId : 'KCA-FU-XXXX';

    switch (templateKey) {
      case 'card_ready':
        setComposeSubject(`KCA Fujairah - Official Digital ID Card Ready (${memberId})`);
        setComposeBody(
          `Dear ${memberName},\n\nGreetings from Kairali Cultural Association Fujairah.\n\nWe are pleased to inform you that your official KCA Membership Card for the 2026-2027 term has been approved and issued.\n\nYou can view and download your digital card and receipt using the portal below:\nPortal Link: https://kcaf-mms.ai.studio/?verify=${memberId}\n\nWarm regards,\nCentral Executive Committee\nKairali Cultural Association Fujairah, UAE`
        );
        break;
      case 'renewal_reminder':
        setComposeSubject(`KCA Fujairah - Membership Renewal & Document Update Notice (${memberId})`);
        setComposeBody(
          `Dear ${memberName},\n\nThis is a friendly reminder from Kairali Cultural Association Fujairah regarding your membership renewal.\n\nKindly submit your renewed Emirates ID / Visa copy to ensure uninterrupted membership welfare privileges and directory access.\n\nYou can reply directly to this email (${OFFICIAL_EMAIL}) with your documents attached.\n\nThank you for your active participation.\n\nKCA Fujairah Central Committee`
        );
        break;
      case 'blood_call':
        setComposeSubject(`[Urgent] KCA Emergency Blood Donor Request - Fujairah`);
        setComposeBody(
          `Dear ${memberName},\n\nThere is an urgent requirement for blood donation in Fujairah Hospital.\n\nIf you are available to donate, please reach out to the KCA Fujairah Blood Donor Helpline or reply to this communication immediately.\n\nEmergency Helpline: +971 50 482 9134\n\nThank you for standing by our community.\nKairali Cultural Association Fujairah`
        );
        break;
      default:
        break;
    }
  };

  // Real Email Launch via Mailto
  const handleOpenInEmailApp = () => {
    if (!composeRecipient || !composeSubject) {
      alert('Please fill in the recipient email and subject before opening mail client.');
      return;
    }
    const mailtoUrl = `mailto:${encodeURIComponent(composeRecipient)}?subject=${encodeURIComponent(composeSubject)}&body=${encodeURIComponent(composeBody)}`;
    window.open(mailtoUrl, '_blank');
  };

  // Send Email & Save to Sent History
  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeRecipient || !composeSubject) return;

    const matchedMember = members.find((m) => m.email === composeRecipient);

    const newSentItem: MailItem = {
      id: `sent-${Date.now()}`,
      senderName: userSession.fullName || 'KCA Fujairah Admin',
      senderEmail: OFFICIAL_EMAIL,
      recipientEmail: composeRecipient,
      memberId: matchedMember ? matchedMember.membershipId : undefined,
      subject: composeSubject,
      body: composeBody,
      date: new Date().toISOString(),
      isRead: true,
      category: composeCategory,
    };

    setSentMails((prev) => [newSentItem, ...prev]);
    setSentSuccess(true);
    confetti({ particleCount: 35, spread: 60 });

    setTimeout(() => {
      setSentSuccess(false);
      setComposeRecipient('');
      setComposeSubject('');
      setComposeBody('');
      setActiveFolder('sent');
      setSelectedMail(newSentItem);
    }, 1200);
  };

  const handleToggleStar = (mailId: string, isInbox: boolean) => {
    if (isInbox) {
      setInboxMails((prev) =>
        prev.map((m) => (m.id === mailId ? { ...m, isStarred: !m.isStarred } : m))
      );
    } else {
      setSentMails((prev) =>
        prev.map((m) => (m.id === mailId ? { ...m, isStarred: !m.isStarred } : m))
      );
    }
    if (selectedMail && selectedMail.id === mailId) {
      setSelectedMail((prev) => (prev ? { ...prev, isStarred: !prev.isStarred } : null));
    }
  };

  const handleDeleteMail = (mailId: string, isInbox: boolean) => {
    if (confirm('Are you sure you want to remove this message?')) {
      if (isInbox) {
        setInboxMails((prev) => prev.filter((m) => m.id !== mailId));
      } else {
        setSentMails((prev) => prev.filter((m) => m.id !== mailId));
      }
      setSelectedMail(null);
    }
  };

  // Get active list depending on folder
  const currentList =
    activeFolder === 'sent'
      ? sentMails
      : activeFolder === 'starred'
      ? [...inboxMails, ...sentMails].filter((m) => m.isStarred)
      : inboxMails;

  const filteredMails = currentList.filter((m) => {
    const matchesSearch =
      m.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.recipientEmail && m.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.memberId && m.memberId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.body.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || m.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const unreadCount = inboxMails.filter((m) => !m.isRead).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-3.5 bg-[#8b0000] text-white flex items-center justify-between border-b border-[#730000]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white border border-white/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-white">
                Official KCA Mailbox &amp; Member Communications
              </h3>
              <p className="text-xs text-red-100">
                Direct Dispatch &amp; Official Records for Member Applications &amp; Inquiries
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mailbox Banner */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Official Receiving Address:</span>
            <code className="bg-white px-2 py-0.5 rounded border border-slate-300 font-mono font-bold text-[#8b0000]">
              {officialMailboxEmail}
            </code>
            <button
              type="button"
              onClick={handleCopyMailbox}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded hover:bg-slate-200 cursor-pointer font-medium"
              title="Copy Email Address"
            >
              {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span>Operator: <strong>{userSession.fullName}</strong></span>
            <span>&bull;</span>
            <span className="font-mono text-slate-700">{userSession.role}</span>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[480px]">
          {/* Sidebar */}
          <div className="w-full md:w-56 bg-slate-50 border-r border-slate-200 p-4 space-y-3 shrink-0">
            <button
              onClick={() => {
                setActiveFolder('compose');
                setSelectedMail(null);
              }}
              className="w-full py-2.5 px-3 rounded-lg bg-[#8b0000] hover:bg-[#730000] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Compose Email</span>
            </button>

            <div className="space-y-1 pt-2">
              <button
                onClick={() => {
                  setActiveFolder('inbox');
                  setSelectedMail(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeFolder === 'inbox'
                    ? 'bg-red-50 text-[#8b0000] border border-red-200'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Inbox className="w-4 h-4" />
                  <span>Inbox</span>
                </div>
                {unreadCount > 0 && (
                  <span className="bg-[#8b0000] text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveFolder('sent');
                  setSelectedMail(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeFolder === 'sent'
                    ? 'bg-red-50 text-[#8b0000] border border-red-200'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  <span>Sent Dispatches</span>
                </div>
                <span className="text-slate-500 text-[10px] font-mono font-semibold">
                  {sentMails.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveFolder('starred');
                  setSelectedMail(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeFolder === 'starred'
                    ? 'bg-red-50 text-[#8b0000] border border-red-200'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>Starred</span>
                </div>
                <span className="text-slate-500 text-[10px] font-mono font-semibold">
                  {[...inboxMails, ...sentMails].filter((m) => m.isStarred).length}
                </span>
              </button>
            </div>

            {/* Quick Filter Categories */}
            <div className="pt-4 border-t border-slate-200 space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 px-1">
                Filter by Category
              </span>
              {[
                { id: 'all', label: 'All Items' },
                { id: 'document_submission', label: 'Documents & IDs' },
                { id: 'renewal_request', label: 'Renewals' },
                { id: 'blood_donor', label: 'Blood Donors' },
                { id: 'official_notice', label: 'Official Notices' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-slate-200 text-slate-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* 1. COMPOSE VIEW */}
            {activeFolder === 'compose' ? (
              <form onSubmit={handleSendEmail} className="p-6 space-y-4 flex-1 overflow-y-auto">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#8b0000]" />
                    Compose Official Communication
                  </h4>
                  <span className="text-xs text-slate-500">From: {officialMailboxEmail}</span>
                </div>

                {sentSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Communication dispatched successfully and recorded in Sent Log!</span>
                  </div>
                )}

                {/* Fast Templates */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Quick Templates:
                  </span>
                  <button
                    type="button"
                    onClick={() => applyTemplate('card_ready')}
                    className="text-[11px] bg-white hover:bg-slate-100 border border-slate-300 px-2 py-1 rounded font-medium text-slate-700 cursor-pointer"
                  >
                    Card Ready for Download
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('renewal_reminder')}
                    className="text-[11px] bg-white hover:bg-slate-100 border border-slate-300 px-2 py-1 rounded font-medium text-slate-700 cursor-pointer"
                  >
                    Renewal Reminder
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('blood_call')}
                    className="text-[11px] bg-white hover:bg-slate-100 border border-slate-300 px-2 py-1 rounded font-medium text-slate-700 cursor-pointer"
                  >
                    Emergency Blood Donor Call
                  </button>
                </div>

                {/* Recipient Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    To (Recipient / Select Member)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      required
                      value={composeRecipient}
                      onChange={(e) => setComposeRecipient(e.target.value)}
                      placeholder="member@example.com"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-xs text-slate-900 focus:ring-1 focus:ring-[#8b0000] outline-none"
                    />
                    <select
                      onChange={(e) => {
                        if (e.target.value) setComposeRecipient(e.target.value);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-md text-xs bg-slate-50 text-slate-700 cursor-pointer"
                    >
                      <option value="">Quick Select Registered Member...</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.email}>
                          {m.fullName} ({m.membershipId}) - {m.unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    required
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="e.g. KCA Fujairah Membership ID Card Ready / Document Confirmation"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs text-slate-900 focus:ring-1 focus:ring-[#8b0000] outline-none font-medium"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Message Body
                  </label>
                  <textarea
                    rows={8}
                    required
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="Write official communication here..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs text-slate-900 focus:ring-1 focus:ring-[#8b0000] outline-none leading-relaxed"
                  />
                </div>

                {/* Dispatch Controls */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyMessageBody}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-100 cursor-pointer"
                    >
                      {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedMessage ? 'Copied Content' : 'Copy Formatted Text'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenInEmailApp}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-blue-300 bg-blue-50 text-blue-800 text-xs font-semibold rounded-md hover:bg-blue-100 cursor-pointer"
                      title="Open in Gmail / Outlook / System Mail"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Send via Email Client (Gmail/Outlook)</span>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveFolder('inbox')}
                      className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-md bg-[#8b0000] hover:bg-[#730000] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Record &amp; Dispatch</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : selectedMail ? (
              /* 2. DETAIL VIEW OF A SELECTED MAIL */
              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <button
                    onClick={() => setSelectedMail(null)}
                    className="text-xs text-[#8b0000] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    &larr; Back to {activeFolder === 'sent' ? 'Sent Dispatches' : 'Inbox'}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStar(selectedMail.id, activeFolder !== 'sent')}
                      className="p-1 rounded text-slate-400 hover:text-amber-500 cursor-pointer"
                      title={selectedMail.isStarred ? 'Unstar' : 'Star message'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          selectedMail.isStarred ? 'text-amber-500 fill-amber-400' : ''
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMail(selectedMail.id, activeFolder !== 'sent')}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Delete message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-slate-500">{formatDate(selectedMail.date)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedMail.subject}</h3>
                  <div className="flex flex-wrap items-center justify-between mt-2 text-xs text-slate-600 gap-2">
                    <div>
                      From: <strong>{selectedMail.senderName}</strong> &lt;{selectedMail.senderEmail}&gt;
                      {selectedMail.recipientEmail && (
                        <span className="block text-slate-500 text-[11px]">
                          To: {selectedMail.recipientEmail}
                        </span>
                      )}
                    </div>
                    {selectedMail.memberId && (
                      <span className="bg-red-50 text-[#8b0000] px-2 py-0.5 rounded font-mono font-bold border border-red-200">
                        Member ID: {selectedMail.memberId}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedMail.body}
                </div>

                {selectedMail.hasAttachment && (
                  <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-[#8b0000]" />
                      <span className="text-xs font-semibold text-slate-900">
                        {selectedMail.attachmentName || 'Attachment.pdf'}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        alert(`Opening official verified attachment: ${selectedMail.attachmentName}`)
                      }
                      className="text-xs text-[#8b0000] font-bold hover:underline cursor-pointer"
                    >
                      View &amp; Download Document
                    </button>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setComposeRecipient(
                        activeFolder === 'sent' && selectedMail.recipientEmail
                          ? selectedMail.recipientEmail
                          : selectedMail.senderEmail
                      );
                      setComposeSubject(`Re: ${selectedMail.subject}`);
                      setComposeBody(
                        `\n\n--- On ${formatDate(selectedMail.date)}, ${selectedMail.senderName} wrote:\n${selectedMail.body}`
                      );
                      setActiveFolder('compose');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#8b0000] text-white text-xs font-semibold hover:bg-[#730000] cursor-pointer"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    Reply
                  </button>

                  <button
                    onClick={() => {
                      const mailtoUrl = `mailto:${encodeURIComponent(
                        activeFolder === 'sent' && selectedMail.recipientEmail
                          ? selectedMail.recipientEmail
                          : selectedMail.senderEmail
                      )}?subject=${encodeURIComponent(`Re: ${selectedMail.subject}`)}`;
                      window.open(mailtoUrl, '_blank');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Reply via Email Client
                  </button>
                </div>
              </div>
            ) : (
              /* 3. MAIL LIST VIEW */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Search Bar */}
                <div className="p-3 border-b border-slate-200 flex items-center gap-2 bg-slate-50/50">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages by sender name, recipient, subject, or Member ID..."
                    className="w-full text-xs text-slate-800 bg-transparent outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Mail Items */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {filteredMails.length > 0 ? (
                    filteredMails.map((mail) => (
                      <div
                        key={mail.id}
                        onClick={() => {
                          setSelectedMail(mail);
                          setInboxMails((prev) =>
                            prev.map((m) => (m.id === mail.id ? { ...m, isRead: true } : m))
                          );
                        }}
                        className={`p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors ${
                          !mail.isRead ? 'bg-amber-50/40 font-semibold' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStar(mail.id, activeFolder !== 'sent');
                            }}
                            className="text-slate-300 hover:text-amber-500 cursor-pointer p-0.5"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                mail.isStarred ? 'text-amber-500 fill-amber-400' : ''
                              }`}
                            />
                          </button>

                          <div className="w-8 h-8 rounded-full bg-red-50 text-[#8b0000] flex items-center justify-center text-xs font-bold shrink-0 border border-red-100">
                            {mail.senderName.charAt(0)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-900 font-bold truncate">
                                {activeFolder === 'sent' && mail.recipientEmail
                                  ? `To: ${mail.recipientEmail}`
                                  : mail.senderName}
                              </span>
                              {mail.memberId && (
                                <span className="text-[10px] font-mono font-bold bg-slate-200 px-1.5 py-0.2 rounded text-slate-700">
                                  {mail.memberId}
                                </span>
                              )}
                              <span className="text-[9px] uppercase font-bold text-slate-500 bg-slate-100 px-1 rounded">
                                {mail.category.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 truncate">{mail.subject}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 text-right">
                          {mail.hasAttachment && (
                            <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span className="text-[11px] text-slate-400">
                            {formatDate(mail.date)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                      <Mail className="w-8 h-8 mx-auto text-slate-300" />
                      <p>No communications found matching your query.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#8b0000]" />
            <span>Kairali Cultural Association Fujairah Official Mail Desk</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
