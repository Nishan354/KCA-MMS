import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CERTIFICATE_TEMPLATES,
  CertificateData,
  CertificateTemplate,
  SealStyle,
  generateCertificatePdf,
  generateBulkCertificatesPdf,
} from '../utils/certificateGenerator';
import { OFFICIAL_AFFILIATION, OFFICIAL_LOCATION } from '../config/constants';
import { KcaLogo, useCustomLogo, getActiveLogoDataUrl } from './Logo';
import { UserSession, isUnitOperatorRole, Member } from '../types/member';
import {
  loadStoredSignatures,
  saveStoredSignatures,
  StoredSignature,
} from '../utils/signatureStorage';
import {
  X,
  Award,
  Download,
  Printer,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Layers,
  FileCheck,
  RefreshCw,
  Eye,
  Check,
  Building2,
  Stamp,
  ShieldCheck,
  Sliders,
  BookmarkCheck,
  PenTool,
  Image,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

interface CertificateGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: string[];
  initialRecipientName?: string;
  initialMemberId?: string;
  initialUnit?: string;
  initialCourse?: string;
  initialCitation?: string;
  selectedMembersForBulk?: Member[];
  userSession?: UserSession | null;
}

interface PresetOption {
  id: string;
  label: string;
  icon: string;
  title: string;
  courseOrEvent: string;
  citation: string;
  suggestedTemplateId: string;
  sealType: SealStyle;
}

const PRESET_CERTIFICATES: PresetOption[] = [
  {
    id: 'kalolsavam_winner',
    label: '🏆 Arts / Kalolsavam Winner',
    icon: '🏆',
    title: 'CERTIFICATE OF EXCELLENCE',
    courseOrEvent: 'Annual Kerala Kalolsavam & Cultural Arts Festival 2026',
    citation: 'for securing First Place with A-Grade in Classical Dance & Performing Arts Competition',
    suggestedTemplateId: 'maroon_festive',
    sealType: 'traditional_kasavu',
  },
  {
    id: 'class_graduation',
    label: '🎓 Cultural Class Graduation',
    icon: '🎓',
    title: 'CERTIFICATE OF COURSE COMPLETION',
    courseOrEvent: 'Malayalam Heritage & Cultural Arts Education Program (Batch 2025-2026)',
    citation: 'for successfully completing the comprehensive curriculum with outstanding attendance and distinction',
    suggestedTemplateId: 'traditional_heritage',
    sealType: 'gold_guilloche',
  },
  {
    id: 'distinguished_merit',
    label: '🌟 Leadership & Merit Award',
    icon: '🌟',
    title: 'CERTIFICATE OF DISTINGUISHED MERIT',
    courseOrEvent: 'Annual Association Executive Board & Community Assembly',
    citation: 'in recognition of exceptional organizational commitment, executive leadership and exemplary service',
    suggestedTemplateId: 'classic_formal',
    sealType: 'royal_ribbon',
  },
  {
    id: 'sports_champion',
    label: '🏅 Sports & Athletic Champion',
    icon: '🏅',
    title: 'CERTIFICATE OF ATHLETIC ACHIEVEMENT',
    courseOrEvent: 'All-UAE Inter-Unit Badminton & Sports Tournament 2026',
    citation: 'for outstanding athletic prowess, sportsmanship and securing the Championship Trophy',
    suggestedTemplateId: 'emerald_flourish',
    sealType: 'gold_guilloche',
  },
  {
    id: 'volunteer_merit',
    label: '🤝 Community & Blood Donor Merit',
    icon: '🤝',
    title: 'CERTIFICATE OF APPRECIATION',
    courseOrEvent: 'Community Blood Donation Drive & Humanitarian Welfare Initiative',
    citation: 'with heartfelt appreciation for selfless social service, humanitarian blood donation and civic excellence',
    suggestedTemplateId: 'royal_navy_silver',
    sealType: 'association_crest',
  },
  {
    id: 'lifetime_honor',
    label: '📜 Lifetime Honorary Service',
    icon: '📜',
    title: 'LIFETIME ACHIEVEMENT AWARD',
    courseOrEvent: 'KCA Fujairah Silver Jubilee & Community Foundation Honors',
    citation: 'in grateful tribute to decades of distinguished dedication, visionary stewardship and cultural preservation',
    suggestedTemplateId: 'vintage_parchment',
    sealType: 'gold_guilloche',
  },
];

export const CertificateGeneratorModal: React.FC<CertificateGeneratorModalProps> = ({
  isOpen,
  onClose,
  units,
  initialRecipientName = '',
  initialMemberId = '',
  initialUnit = 'Fujairah',
  initialCourse = 'Annual Kerala Kalolsavam & Cultural Excellence',
  initialCitation = 'for outstanding artistic performance and securing First Place with A-Grade in Classical Dance',
  selectedMembersForBulk = [],
  userSession,
}) => {
  const { customLogo } = useCustomLogo();
  const isUnitOp = !!userSession && isUnitOperatorRole(userSession.role);
  const defaultUnit = isUnitOp && userSession.unit ? userSession.unit : (initialUnit || units[0] || 'Fujairah');

  const [activeMode, setActiveMode] = useState<'single' | 'bulk'>('single');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('classic_formal');
  const [selectedSealType, setSelectedSealType] = useState<SealStyle>('gold_guilloche');
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [numSignatories, setNumSignatories] = useState<2 | 3>(2);

  // Stored Digital Signatures
  const [storedSignatures, setStoredSignatures] = useState<StoredSignature[]>(() => loadStoredSignatures());

  // Single Certificate State (Ad-Hoc Manual Custom Generation)
  const [recipientName, setRecipientName] = useState(initialRecipientName || 'Smt. Ananya Nair');
  const [memberOrStudentId, setMemberOrStudentId] = useState(initialMemberId || 'KCA-FU-2026');
  const [certTitle, setCertTitle] = useState('CERTIFICATE OF EXCELLENCE');
  const [courseOrEvent, setCourseOrEvent] = useState(initialCourse || 'Annual Kerala Kalolsavam & Arts Festival');
  const [citation, setCitation] = useState(initialCitation);
  const [unit, setUnit] = useState(defaultUnit);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [certNumber, setCertNumber] = useState(`KCA-CERT-${Date.now().toString().slice(-6)}`);
  const [norkaRegNumber, setNorkaRegNumber] = useState('NORKA/FUJ/2026/7821');

  // Signatories
  const [signatory1Name, setSignatory1Name] = useState('K. P. Radhakrishnan');
  const [signatory1Title, setSignatory1Title] = useState('General Secretary');
  const [signatory1SignatureUrl, setSignatory1SignatureUrl] = useState<string>('');

  const [signatory2Name, setSignatory2Name] = useState('Dr. Surendran Menon');
  const [signatory2Title, setSignatory2Title] = useState('President');
  const [signatory2SignatureUrl, setSignatory2SignatureUrl] = useState<string>('');

  const [signatory3Name, setSignatory3Name] = useState('Vidwan Manoj Kumar');
  const [signatory3Title, setSignatory3Title] = useState('Cultural Convener');
  const [signatory3SignatureUrl, setSignatory3SignatureUrl] = useState<string>('');

  // QR preview state
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Bulk Generation State
  const [bulkCsvRows, setBulkCsvRows] = useState<Partial<CertificateData>[]>([]);
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkDoneMessage, setBulkDoneMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sig1InputRef = useRef<HTMLInputElement | null>(null);
  const sig2InputRef = useRef<HTMLInputElement | null>(null);
  const sig3InputRef = useRef<HTMLInputElement | null>(null);

  // Sync props on change
  useEffect(() => {
    if (isOpen) {
      if (initialRecipientName) setRecipientName(initialRecipientName);
      if (initialMemberId) setMemberOrStudentId(initialMemberId);
      if (initialUnit) setUnit(initialUnit);
      if (initialCourse) setCourseOrEvent(initialCourse);
      if (initialCitation) setCitation(initialCitation);
      setStoredSignatures(loadStoredSignatures());
    }
  }, [isOpen, initialRecipientName, initialMemberId, initialUnit, initialCourse, initialCitation]);

  // If selectedMembersForBulk is provided, populate bulk rows
  useEffect(() => {
    if (selectedMembersForBulk && selectedMembersForBulk.length > 0) {
      const rows: Partial<CertificateData>[] = selectedMembersForBulk.map((m, idx) => ({
        certNumber: `KCA-CERT-${Date.now().toString().slice(-4)}-${idx + 1}`,
        recipientName: m.fullName,
        recipientMalayalamName: m.malayalamName,
        memberOrStudentId: m.membershipId || m.id,
        unit: m.unit || unit,
        title: certTitle,
        courseOrEvent: courseOrEvent,
        citation: citation,
        issueDate: issueDate,
      }));
      setBulkCsvRows(rows);
    }
  }, [selectedMembersForBulk, unit, certTitle, courseOrEvent, citation, issueDate]);

  const selectedTemplate = useMemo(() => {
    return CERTIFICATE_TEMPLATES.find((t) => t.id === selectedTemplateId) || CERTIFICATE_TEMPLATES[0];
  }, [selectedTemplateId]);

  // Apply quick preset
  const handleApplyPreset = (preset: PresetOption) => {
    setCertTitle(preset.title);
    setCourseOrEvent(preset.courseOrEvent);
    setCitation(preset.citation);
    setSelectedTemplateId(preset.suggestedTemplateId);
    setSelectedSealType(preset.sealType);
    confetti({ particleCount: 25, spread: 50 });
  };

  // Upload digital signature handler
  const handleSignatureUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 1 | 2 | 3
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (target === 1) setSignatory1SignatureUrl(dataUrl);
      if (target === 2) setSignatory2SignatureUrl(dataUrl);
      if (target === 3) setSignatory3SignatureUrl(dataUrl);

      // Auto save to stored signatures
      const name = target === 1 ? signatory1Name : target === 2 ? signatory2Name : signatory3Name;
      const title = target === 1 ? signatory1Title : target === 2 ? signatory2Title : signatory3Title;
      const updated: StoredSignature[] = [
        ...storedSignatures.filter((s) => s.name !== name),
        {
          id: `sig_${Date.now()}`,
          signatoryRole:
            title === 'President' || title === 'General Secretary' || title === 'Treasurer' || title === 'Convener'
              ? title
              : 'Custom',
          customTitle: title,
          name,
          unit: unit || 'Central',
          signatureDataUrl: dataUrl,
          uploadedAt: new Date().toISOString(),
        },
      ];
      setStoredSignatures(updated);
      saveStoredSignatures(updated);
    };
    reader.readAsDataURL(file);
  };

  // Update QR code when details change
  useEffect(() => {
    const qrString = `KCA OFFICIAL CERTIFICATE\nCert No: ${certNumber}\nIssued To: ${recipientName}\nID/Roll: ${memberOrStudentId || 'N/A'}\nAchievement: ${certTitle}\nCourse/Event: ${courseOrEvent}\nUnit: ${unit}\nDate: ${issueDate}\nA Norka affiliated Organisation`;
    QRCode.toDataURL(qrString, {
      margin: 1,
      width: 140,
      color: { dark: selectedTemplate.primaryColor, light: '#FFFFFF' },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch(() => {});
  }, [certNumber, recipientName, memberOrStudentId, certTitle, courseOrEvent, unit, issueDate, selectedTemplate]);

  if (!isOpen) return null;

  const currentCertificateData: CertificateData = {
    certNumber,
    templateId: selectedTemplateId,
    recipientName,
    memberOrStudentId,
    title: certTitle,
    courseOrEvent,
    citation,
    unit,
    issueDate,
    norkaRegNumber,
    signatory1Title,
    signatory1Name,
    signatory1SignatureUrl,
    signatory2Title,
    signatory2Name,
    signatory2SignatureUrl,
    signatory3Title: numSignatories === 3 ? signatory3Title : undefined,
    signatory3Name: numSignatories === 3 ? signatory3Name : undefined,
    signatory3SignatureUrl: numSignatories === 3 ? signatory3SignatureUrl : undefined,
    sealType: selectedSealType,
    showWatermark,
  };

  const handleDownloadSinglePdf = async () => {
    try {
      const pdf = await generateCertificatePdf(currentCertificateData);
      pdf.save(`${certNumber}_${recipientName.replace(/\s+/g, '_')}_Certificate.pdf`);
      confetti({ particleCount: 40, spread: 60 });
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  const handlePrintSingle = async () => {
    try {
      const pdf = await generateCertificatePdf(currentCertificateData);
      pdf.autoPrint();
      window.open(pdf.output('bloburl'), '_blank');
    } catch (err) {
      console.error('Error printing certificate:', err);
    }
  };

  // CSV Template download
  const handleDownloadSampleCsv = () => {
    const headers = [
      'RecipientName',
      'MemberOrStudentID',
      'CertificateTitle',
      'CourseOrEvent',
      'Citation',
      'Unit',
      'IssueDate',
      'NorkaRegNumber',
      'Signatory1Name',
      'Signatory1Title',
      'Signatory2Name',
      'Signatory2Title',
    ];
    const sampleRow = [
      'Devika Mohan',
      'KCA-FU-3042',
      'CERTIFICATE OF EXCELLENCE',
      'Annual Kalolsavam 2026',
      'for securing First Place with A-Grade in Classical Solo Dance',
      unit,
      new Date().toISOString().split('T')[0],
      'NORKA/FUJ/2026/8912',
      signatory1Name,
      signatory1Title,
      signatory2Name,
      signatory2Title,
    ];
    const csvContent = [headers.join(','), sampleRow.map((v) => `"${v}"`).join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'KCA_Bulk_Certificate_Template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Parse Uploaded CSV
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          alert('CSV file is empty or missing data rows.');
          return;
        }

        const dataRows: Partial<CertificateData>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const rawCols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          const cols = rawCols.map((c) => c.replace(/^"|"$/g, '').trim());

          if (cols[0]) {
            dataRows.push({
              recipientName: cols[0],
              memberOrStudentId: cols[1] || '',
              title: cols[2] || certTitle,
              courseOrEvent: cols[3] || courseOrEvent,
              citation: cols[4] || citation,
              unit: cols[5] || unit,
              issueDate: cols[6] || issueDate,
              norkaRegNumber: cols[7] || norkaRegNumber,
              signatory1Name: cols[8] || signatory1Name,
              signatory1Title: cols[9] || signatory1Title,
              signatory2Name: cols[10] || signatory2Name,
              signatory2Title: cols[11] || signatory2Title,
            });
          }
        }

        setBulkCsvRows(dataRows);
        setBulkDoneMessage(null);
      } catch (err) {
        console.error('Error parsing CSV:', err);
        alert('Failed to parse the CSV file. Please use the standard template.');
      }
    };
    reader.readAsText(file);
  };

  // Generate combined bulk PDF
  const handleGenerateBulkPdfs = async () => {
    if (bulkCsvRows.length === 0) return;
    setIsGeneratingBulk(true);
    setBulkProgress(0);

    try {
      let combinedDoc: jsPDF | null = null;

      for (let i = 0; i < bulkCsvRows.length; i++) {
        const row = bulkCsvRows[i];
        const certData: CertificateData = {
          certNumber: `KCA-BULK-${Date.now().toString().slice(-4)}-${i + 1}`,
          templateId: selectedTemplateId,
          recipientName: row.recipientName || 'Candidate',
          memberOrStudentId: row.memberOrStudentId || '',
          title: row.title || certTitle,
          courseOrEvent: row.courseOrEvent || courseOrEvent,
          citation: row.citation || citation,
          unit: row.unit || unit,
          issueDate: row.issueDate || issueDate,
          norkaRegNumber: row.norkaRegNumber || norkaRegNumber,
          signatory1Name: row.signatory1Name || signatory1Name,
          signatory1Title: row.signatory1Title || signatory1Title,
          signatory2Name: row.signatory2Name || signatory2Name,
          signatory2Title: row.signatory2Title || signatory2Title,
          signatory3Name: numSignatories === 3 ? signatory3Name : undefined,
          signatory3Title: numSignatories === 3 ? signatory3Title : undefined,
          sealType: selectedSealType,
          showWatermark,
        };

        const singlePdf = await generateCertificatePdf(certData);
        if (i === 0) {
          combinedDoc = singlePdf;
        } else if (combinedDoc) {
          combinedDoc.addPage('a4', 'landscape');
        }

        setBulkProgress(Math.round(((i + 1) / bulkCsvRows.length) * 100));
      }

      if (combinedDoc) {
        combinedDoc.save(`KCA_Bulk_${bulkCsvRows.length}_Certificates.pdf`);
      }
      setBulkDoneMessage(`Successfully exported ${bulkCsvRows.length} certificates in official NORKA format!`);
      confetti({ particleCount: 70, spread: 80 });
    } catch (err) {
      console.error('Error during bulk generation:', err);
      alert('An error occurred during bulk certificate generation.');
    } finally {
      setIsGeneratingBulk(false);
    }
  };

  const availableUnits = ['Central', ...units];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl max-w-6xl w-full border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-4 max-h-[94vh]">
        {/* Modal Header */}
        <div
          className="p-4 text-white flex items-center justify-between shadow-xs shrink-0"
          style={{ backgroundColor: 'var(--color-primary, #881337)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 p-1 flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base tracking-tight leading-tight">
                Official Certificate Engine &amp; Graphic Studio
              </h2>
              <p className="text-[11px] text-rose-100 font-medium">
                8 Graphic Themes • Dynamic Seals • NORKA Roots Affiliated Association • Ad-Hoc &amp; Bulk Generation
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex bg-black/20 p-0.5 rounded-lg border border-white/20 text-xs">
              <button
                type="button"
                onClick={() => setActiveMode('single')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  activeMode === 'single' ? 'bg-white text-slate-900 shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Single Certificate
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('bulk')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  activeMode === 'bulk' ? 'bg-white text-slate-900 shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Bulk CSV Generator
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Quick Preset Pickers */}
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                <BookmarkCheck className="w-4 h-4 text-amber-500" />
                <span className="uppercase tracking-wider">Quick Award Presets (1-Click Fill)</span>
              </div>
              <span className="text-[10px] text-slate-400">Click any preset to pre-fill titles, themes &amp; seal</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {PRESET_CERTIFICATES.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-400 bg-slate-50 dark:bg-slate-800/90 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-left transition-all cursor-pointer group"
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-700 dark:group-hover:text-amber-300">
                    {preset.label}
                  </div>
                  <div className="text-[9.5px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {preset.title}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 8 Multi-Theme Visual Selector */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Select Graphic Theme (8 High-Res Styles)
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Active: {selectedTemplate.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {CERTIFICATE_TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden h-28 ${
                      isSelected
                        ? 'border-2 border-[#881337] dark:border-rose-400 bg-rose-50/60 dark:bg-rose-950/40 shadow-md ring-2 ring-[#881337]/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                          style={{ backgroundColor: tmpl.primaryColor }}
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                          style={{ backgroundColor: tmpl.accentColor }}
                        />
                      </div>
                      {isSelected && (
                        <div className="w-3.5 h-3.5 bg-[#881337] dark:bg-rose-500 text-white rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="font-bold text-[11px] text-slate-900 dark:text-white leading-tight">
                        {tmpl.name}
                      </div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {tmpl.category}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SINGLE MODE */}
          {activeMode === 'single' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Form Controls */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 text-xs">
                <div className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-700 pb-1.5 flex items-center justify-between">
                  <span>Custom Details &amp; Graphics</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400 font-normal">{certNumber}</span>
                </div>

                {/* Graphic Seal & Watermark Controls */}
                <div className="bg-slate-50 dark:bg-slate-700/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Stamp className="w-3.5 h-3.5 text-amber-600" />
                      <span>Graphic Seal Stamp</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10.5px] text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={showWatermark}
                        onChange={(e) => setShowWatermark(e.target.checked)}
                        className="rounded text-[#881337] focus:ring-[#881337]"
                      />
                      <span>Watermark Motif</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {[
                      { id: 'gold_guilloche', label: 'Gold Guilloche' },
                      { id: 'royal_ribbon', label: 'Royal Ribbon' },
                      { id: 'association_crest', label: 'Embossed Crest' },
                      { id: 'traditional_kasavu', label: 'Kasavu Lotus' },
                      { id: 'none', label: 'No Seal' },
                    ].map((seal) => (
                      <button
                        key={seal.id}
                        type="button"
                        onClick={() => setSelectedSealType(seal.id as SealStyle)}
                        className={`px-2 py-1 rounded text-[10px] font-bold border text-center transition-all cursor-pointer ${
                          selectedSealType === seal.id
                            ? 'bg-[#881337] text-white border-[#881337] shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:border-slate-400'
                        }`}
                      >
                        {seal.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                      Certificate Title *
                    </label>
                    <input
                      type="text"
                      value={certTitle}
                      onChange={(e) => setCertTitle(e.target.value)}
                      placeholder="e.g. CERTIFICATE OF EXCELLENCE"
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md font-bold uppercase text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                      Unit Scope *
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      disabled={isUnitOp}
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 disabled:opacity-60 cursor-pointer"
                    >
                      {availableUnits.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                    Recipient Full Name (No DB Record required) *
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Master Adithyan Krishna / Smt. Suma Nair"
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                      Member / Student ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={memberOrStudentId}
                      onChange={(e) => setMemberOrStudentId(e.target.value)}
                      placeholder="e.g. KCA-FU-2026 or Roll #104"
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                      NORKA Reg Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={norkaRegNumber}
                      onChange={(e) => setNorkaRegNumber(e.target.value)}
                      placeholder="e.g. NORKA/FUJ/2026/7821"
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                    Course, Event, or Competition Name *
                  </label>
                  <input
                    type="text"
                    value={courseOrEvent}
                    onChange={(e) => setCourseOrEvent(e.target.value)}
                    placeholder="e.g. Annual Kerala Kalolsavam & Classical Dance Fest 2026"
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                    Citation / Achievement Description *
                  </label>
                  <textarea
                    rows={2}
                    value={citation}
                    onChange={(e) => setCitation(e.target.value)}
                    placeholder="e.g. for securing First Place with A-Grade in Classical Solo Dance..."
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                      Issue Date
                    </label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                      Certificate Number
                    </label>
                    <input
                      type="text"
                      value={certNumber}
                      onChange={(e) => setCertNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700"
                    />
                  </div>
                </div>

                {/* Signatories Controls */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                      Authorized Signatories
                    </span>
                    <div className="flex gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setNumSignatories(2)}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          numSignatories === 2
                            ? 'bg-[#881337] text-white font-bold'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600'
                        }`}
                      >
                        2 Signatures
                      </button>
                      <button
                        type="button"
                        onClick={() => setNumSignatories(3)}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          numSignatories === 3
                            ? 'bg-[#881337] text-white font-bold'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600'
                        }`}
                      >
                        3 Signatures
                      </button>
                    </div>
                  </div>

                  <div className={`grid ${numSignatories === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Left Signatory</label>
                      <input
                        type="text"
                        value={signatory1Name}
                        onChange={(e) => setSignatory1Name(e.target.value)}
                        placeholder="Secretary Name"
                        className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 font-semibold"
                      />
                      <input
                        type="text"
                        value={signatory1Title}
                        onChange={(e) => setSignatory1Title(e.target.value)}
                        placeholder="Secretary Title"
                        className="w-full px-2 py-0.5 border border-slate-200 dark:border-slate-600 rounded text-[10px] text-slate-500 dark:text-slate-400 mt-1 bg-white dark:bg-slate-700"
                      />
                      {/* Signature Attachment */}
                      <div className="mt-1.5 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => sig1InputRef.current?.click()}
                          className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 flex items-center gap-1 border border-slate-300 dark:border-slate-600 cursor-pointer"
                        >
                          <PenTool className="w-2.5 h-2.5 text-indigo-500" />
                          <span>{signatory1SignatureUrl ? 'Change Sig' : 'Add Sig'}</span>
                        </button>
                        {signatory1SignatureUrl && (
                          <button
                            type="button"
                            onClick={() => setSignatory1SignatureUrl('')}
                            className="text-[9px] text-rose-500 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                        <input
                          ref={sig1InputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleSignatureUpload(e, 1)}
                        />
                      </div>
                    </div>

                    {numSignatories === 3 && (
                      <div>
                        <label className="text-[10px] text-slate-500 block">Center Signatory</label>
                        <input
                          type="text"
                          value={signatory3Name}
                          onChange={(e) => setSignatory3Name(e.target.value)}
                          placeholder="Convener Name"
                          className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 font-semibold"
                        />
                        <input
                          type="text"
                          value={signatory3Title}
                          onChange={(e) => setSignatory3Title(e.target.value)}
                          placeholder="Convener Title"
                          className="w-full px-2 py-0.5 border border-slate-200 dark:border-slate-600 rounded text-[10px] text-slate-500 dark:text-slate-400 mt-1 bg-white dark:bg-slate-700"
                        />
                        {/* Signature Attachment */}
                        <div className="mt-1.5 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => sig3InputRef.current?.click()}
                            className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 flex items-center gap-1 border border-slate-300 dark:border-slate-600 cursor-pointer"
                          >
                            <PenTool className="w-2.5 h-2.5 text-indigo-500" />
                            <span>{signatory3SignatureUrl ? 'Change Sig' : 'Add Sig'}</span>
                          </button>
                          {signatory3SignatureUrl && (
                            <button
                              type="button"
                              onClick={() => setSignatory3SignatureUrl('')}
                              className="text-[9px] text-rose-500 hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                          <input
                            ref={sig3InputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleSignatureUpload(e, 3)}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] text-slate-500 block">Right Signatory</label>
                      <input
                        type="text"
                        value={signatory2Name}
                        onChange={(e) => setSignatory2Name(e.target.value)}
                        placeholder="President Name"
                        className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 font-semibold"
                      />
                      <input
                        type="text"
                        value={signatory2Title}
                        onChange={(e) => setSignatory2Title(e.target.value)}
                        placeholder="President Title"
                        className="w-full px-2 py-0.5 border border-slate-200 dark:border-slate-600 rounded text-[10px] text-slate-500 dark:text-slate-400 mt-1 bg-white dark:bg-slate-700"
                      />
                      {/* Signature Attachment */}
                      <div className="mt-1.5 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => sig2InputRef.current?.click()}
                          className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 flex items-center gap-1 border border-slate-300 dark:border-slate-600 cursor-pointer"
                        >
                          <PenTool className="w-2.5 h-2.5 text-indigo-500" />
                          <span>{signatory2SignatureUrl ? 'Change Sig' : 'Add Sig'}</span>
                        </button>
                        {signatory2SignatureUrl && (
                          <button
                            type="button"
                            onClick={() => setSignatory2SignatureUrl('')}
                            className="text-[9px] text-rose-500 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                        <input
                          ref={sig2InputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleSignatureUpload(e, 2)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={handleDownloadSinglePdf}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 bg-[#881337] hover:bg-[#700f2b]"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-300" />
                    <span>Download PDF Certificate</span>
                  </button>

                  <button
                    onClick={handlePrintSingle}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-600 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Live High-Resolution Certificate Preview */}
              <div className="lg:col-span-7 flex flex-col">
                <div className="bg-slate-900/5 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-300 dark:border-slate-700 flex-1 flex items-center justify-center">
                  <div
                    className="w-full bg-white shadow-xl rounded-lg p-6 relative aspect-[1.414/1] flex flex-col justify-between select-none overflow-hidden"
                    style={{
                      border: `5px solid ${selectedTemplate.primaryColor}`,
                      backgroundColor: selectedTemplate.bgColor,
                    }}
                  >
                    {/* Inner Accent Line */}
                    <div
                      className="absolute inset-2 border pointer-events-none rounded-xs"
                      style={{ borderColor: selectedTemplate.accentColor }}
                    />

                    {/* Watermark Background Graphic (if enabled - calibrated ultra-subtle ~3.5% opacity) */}
                    {showWatermark && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035]">
                        <svg className="w-64 h-64" viewBox="0 0 200 200" fill="none" stroke={selectedTemplate.accentColor}>
                          <circle cx="100" cy="100" r="30" strokeWidth="1" />
                          <circle cx="100" cy="100" r="50" strokeWidth="1.2" strokeDasharray="3 3" />
                          <circle cx="100" cy="100" r="70" strokeWidth="1" />
                          <circle cx="100" cy="100" r="90" strokeWidth="1.5" />
                          {Array.from({ length: 24 }).map((_, idx) => {
                            const angle = (idx * 360) / 24;
                            const rad = (angle * Math.PI) / 180;
                            return (
                              <line
                                key={idx}
                                x1={100 + Math.cos(rad) * 30}
                                y1={100 + Math.sin(rad) * 30}
                                x2={100 + Math.cos(rad) * 90}
                                y2={100 + Math.sin(rad) * 90}
                                strokeWidth="0.8"
                              />
                            );
                          })}
                        </svg>
                      </div>
                    )}

                    {/* Top Row: QR, Header, Logo */}
                    <div className="flex items-start justify-between relative z-10">
                      {/* Left: QR code */}
                      <div className="flex flex-col items-center">
                        {qrCodeDataUrl ? (
                          <img
                            src={qrCodeDataUrl}
                            alt="Verification QR"
                            className="w-12 h-12 object-contain rounded border border-slate-200 p-0.5 bg-white shadow-xs"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded" />
                        )}
                        <span className="text-[7.5px] font-bold text-slate-500 uppercase mt-0.5 font-mono">
                          Verify QR
                        </span>
                      </div>

                      {/* Center: Title & Org Header */}
                      <div className="text-center flex-1 px-3">
                        <div className="flex items-center justify-center gap-1.5 mb-0.5">
                          <span
                            className="font-display font-black text-sm sm:text-base tracking-tight uppercase"
                            style={{ color: selectedTemplate.primaryColor }}
                          >
                            KAIRALI CULTURAL ASSOCIATION FUJAIRAH
                          </span>
                        </div>
                        <div
                          className="font-bold text-[9.5px] sm:text-[10.5px] tracking-wide"
                          style={{ color: selectedTemplate.accentColor }}
                        >
                          A Norka affiliated Organisation
                        </div>
                        <div className="text-[8.5px] text-slate-500 font-medium">
                          {unit === 'Central' ? 'Central Committee' : `${unit} Unit`} • {OFFICIAL_LOCATION}
                        </div>
                      </div>

                      {/* Right: Official Logo / Emblem (Clean, no stray number) */}
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 p-0.5 bg-white rounded-full shadow-xs border border-slate-200 flex items-center justify-center overflow-hidden">
                          <KcaLogo size={42} />
                        </div>
                      </div>
                    </div>

                    {/* Middle: Recipient & Citation */}
                    <div className="text-center my-auto py-2 relative z-10">
                      <div
                        className="font-serif font-black text-base sm:text-xl tracking-wide uppercase mb-0.5"
                        style={{ color: selectedTemplate.primaryColor }}
                      >
                        {certTitle}
                      </div>

                      <div className="text-[9.5px] sm:text-[10.5px] text-slate-500 font-medium uppercase tracking-wider">
                        THIS IS PROUDLY PRESENTED TO
                      </div>

                      <div className="font-serif font-bold text-lg sm:text-2xl text-slate-900 my-1 underline decoration-amber-500 decoration-2 underline-offset-4">
                        {recipientName}
                      </div>

                      {memberOrStudentId && (
                        <div className="text-[8.5px] font-mono font-bold text-slate-600 mb-0.5">
                          ID / REG: {memberOrStudentId} • {unit === 'Central' ? 'Central Committee' : `${unit} Unit`}
                        </div>
                      )}

                      <p className="text-[10.5px] sm:text-xs text-slate-700 italic max-w-xl mx-auto leading-relaxed mt-1">
                        {citation} during the{' '}
                        <span className="font-bold not-italic text-slate-900">{courseOrEvent}</span> conducted by
                        Kairali Cultural Association Fujairah.
                      </p>

                      {/* Graphic Seal Stamp in Live Preview */}
                      {selectedSealType !== 'none' ? (
                        <div className="mt-2 flex items-center justify-center">
                          <div
                            className="w-16 h-16 sm:w-18 sm:h-18 rounded-full flex flex-col items-center justify-center text-center relative shadow-sm border-2 transition-all p-1"
                            style={{
                              borderColor: selectedTemplate.accentColor,
                              backgroundColor: selectedSealType === 'association_crest' ? '#FFFFFF' : '#FFFBEB',
                              color: selectedTemplate.primaryColor,
                            }}
                          >
                            {/* Inner concentric ring */}
                            <div
                              className="absolute inset-1 rounded-full border border-dashed pointer-events-none"
                              style={{ borderColor: selectedTemplate.accentColor }}
                            />

                            {selectedSealType === 'gold_guilloche' && (
                              <>
                                <span className="text-[6.5px] font-black uppercase tracking-tighter leading-none">OFFICIAL</span>
                                <span className="text-[9px] font-black text-amber-600 my-0.5 leading-none">★ ★ ★</span>
                                <span className="text-[6px] font-black uppercase tracking-wider leading-none">VERIFIED</span>
                              </>
                            )}

                            {selectedSealType === 'royal_ribbon' && (
                              <>
                                <span className="text-[6.5px] font-black uppercase tracking-tight leading-none">KCA MERIT</span>
                                <span className="text-[9.5px] text-amber-600 font-black leading-none my-0.5">★ ★ ★</span>
                                <span className="text-[5.5px] font-bold text-slate-500 uppercase leading-none">SEAL</span>
                              </>
                            )}

                            {selectedSealType === 'association_crest' && (
                              <>
                                <span className="text-[6px] font-black uppercase tracking-tight leading-none">KAIRALI</span>
                                <span className="text-[7.5px] font-black leading-none my-0.5" style={{ color: selectedTemplate.accentColor }}>FUJAIRAH</span>
                                <span className="text-[5px] font-bold text-slate-400 uppercase leading-none">OFFICIAL</span>
                              </>
                            )}

                            {selectedSealType === 'traditional_kasavu' && (
                              <>
                                <span className="text-[5.5px] font-bold uppercase tracking-tight leading-none" style={{ color: selectedTemplate.accentColor }}>KALOLSAVAM</span>
                                <span className="text-[8px] font-black leading-none my-0.5">✦ A-GRADE ✦</span>
                                <span className="text-[5.5px] font-bold uppercase leading-none">MERIT</span>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center justify-center gap-2">
                          <div className="w-12 h-px bg-amber-500" />
                          <span className="text-[8px] font-bold tracking-widest text-amber-700 uppercase">
                            OFFICIAL RECOGNITION
                          </span>
                          <div className="w-12 h-px bg-amber-500" />
                        </div>
                      )}
                    </div>

                    {/* Bottom: Signatures */}
                    <div className="flex items-end justify-between relative z-10 pt-2 border-t border-slate-200/80">
                      {/* Left Signatory */}
                      <div className="text-center w-28 sm:w-36">
                        {signatory1SignatureUrl && (
                          <img
                            src={signatory1SignatureUrl}
                            alt="Signature 1"
                            className="h-6 mx-auto object-contain mb-0.5"
                          />
                        )}
                        <div className="border-b border-slate-400 pb-0.5 mb-0.5 font-bold text-[10px] text-slate-900 truncate">
                          {signatory1Name}
                        </div>
                        <div className="text-[8px] text-slate-500 font-medium truncate">
                          {unit === 'Central' ? 'Central Committee' : `${unit} Unit`} {signatory1Title}
                        </div>
                      </div>

                      {/* Center Signatory (if 3) or Spacer */}
                      {numSignatories === 3 ? (
                        <div className="text-center w-28 sm:w-36">
                          {signatory3SignatureUrl && (
                            <img
                              src={signatory3SignatureUrl}
                              alt="Signature 3"
                              className="h-6 mx-auto object-contain mb-0.5"
                            />
                          )}
                          <div className="border-b border-slate-400 pb-0.5 mb-0.5 font-bold text-[10px] text-slate-900 truncate">
                            {signatory3Name}
                          </div>
                          <div className="text-[8px] text-slate-500 font-medium truncate">
                            {signatory3Title}
                          </div>
                        </div>
                      ) : (
                        <div className="w-16" />
                      )}

                      {/* Right Signatory */}
                      <div className="text-center w-28 sm:w-36">
                        {signatory2SignatureUrl && (
                          <img
                            src={signatory2SignatureUrl}
                            alt="Signature 2"
                            className="h-6 mx-auto object-contain mb-0.5"
                          />
                        )}
                        <div className="border-b border-slate-400 pb-0.5 mb-0.5 font-bold text-[10px] text-slate-900 truncate">
                          {signatory2Name}
                        </div>
                        <div className="text-[8px] text-slate-500 font-medium truncate">
                          {unit === 'Central' ? 'Central Committee' : `${unit} Unit`} {signatory2Title}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BULK MODE */}
          {activeMode === 'bulk' && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Bulk CSV Certificate Processing
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload a spreadsheet to generate hundreds of NORKA-affiliated certificates with the selected graphic theme ({selectedTemplate.name}) and seal ({selectedSealType}).
                  </p>
                </div>
                <button
                  onClick={handleDownloadSampleCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-600 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download Sample CSV Template</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-[#881337] dark:hover:border-rose-400 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/40"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCsvUpload}
                  accept=".csv"
                  className="hidden"
                />
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  Click to choose CSV file or drag &amp; drop
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  RecipientName, MemberOrStudentID, CertificateTitle, CourseOrEvent, Citation, Unit...
                </div>
              </div>

              {/* Parsed Rows Preview */}
              {bulkCsvRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Loaded {bulkCsvRows.length} Certificate Records
                    </span>
                    <button
                      onClick={() => setBulkCsvRows([])}
                      className="text-rose-600 font-semibold hover:underline"
                    >
                      Clear Data
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 sticky top-0">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">Recipient Name</th>
                          <th className="p-2">Title</th>
                          <th className="p-2">Event</th>
                          <th className="p-2">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {bulkCsvRows.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                            <td className="p-2 font-mono text-slate-400">{i + 1}</td>
                            <td className="p-2 font-bold text-slate-900 dark:text-white">{r.recipientName}</td>
                            <td className="p-2">{r.title}</td>
                            <td className="p-2">{r.courseOrEvent}</td>
                            <td className="p-2 font-mono">{r.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Progress bar */}
                  {isGeneratingBulk && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>Generating High-Quality Certificates...</span>
                        <span>{bulkProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#881337] transition-all duration-200"
                          style={{ width: `${bulkProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {bulkDoneMessage && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{bulkDoneMessage}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={handleGenerateBulkPdfs}
                      disabled={isGeneratingBulk}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#881337] hover:bg-[#700f2b] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-amber-300" />
                      <span>Export All {bulkCsvRows.length} Certificates</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
