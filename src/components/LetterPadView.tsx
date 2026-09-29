import React, { useState, useEffect, useRef } from 'react';
import { OfficialLetter, DEFAULT_LETTER_TEMPLATES, LetterSignatory } from '../types/letter';
import { loadLetters, saveLetters, getNextReferenceNumber, downloadLetterPdf, UNIT_CODE_MAP } from '../utils/letterStorage';
import { loadStoredSignatures, StoredSignature, upsertStoredSignature, clearStoredSignature } from '../utils/signatureStorage';
import { UserSession, isUnitOperatorRole, hasAdminPrivilege } from '../types/member';
import { KcaLogo } from './Logo';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { NewLetterModal } from './NewLetterModal';
import { OFFICIAL_ORG_NAME, OFFICIAL_AFFILIATION, OFFICIAL_LOCATION, OFFICIAL_LETTER_EMAIL } from '../config/constants';
import {
  FileText,
  Plus,
  Printer,
  Download,
  Save,
  CheckCircle2,
  Trash2,
  Copy,
  Edit3,
  Search,
  Building2,
  Calendar,
  Hash,
  Upload,
  UserCheck,
  Sparkles,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Eye,
  Layers,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  X,
  RotateCcw,
} from 'lucide-react';

interface LetterPadViewProps {
  units: string[];
  userSession?: UserSession | null;
}

export const LetterPadView: React.FC<LetterPadViewProps> = ({ units, userSession }) => {
  const isUnitOp = !!userSession && isUnitOperatorRole(userSession.role);
  const defaultUnit = isUnitOp && userSession?.unit ? userSession.unit : 'Central';

  const [letters, setLetters] = useState<OfficialLetter[]>(() => loadLetters());
  const [activeLetterId, setActiveLetterId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewTab, setViewTab] = useState<'editor' | 'archive'>('editor');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnit, setFilterUnit] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [editorKey, setEditorKey] = useState(0);

  // Stored digital signatures
  const [storedSignatures, setStoredSignatures] = useState<StoredSignature[]>(() => loadStoredSignatures());

  // Form State for Active Letter
  const [unit, setUnit] = useState<string>(defaultUnit);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [seriesNumber, setSeriesNumber] = useState<number>(1);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [toAddress, setToAddress] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [salutation, setSalutation] = useState<string>('Respected Sir / Madam,');
  const [bodyHtml, setBodyHtml] = useState<string>('');
  const [category, setCategory] = useState<OfficialLetter['category']>('General');
  const [status, setStatus] = useState<OfficialLetter['status']>('Draft');

  const [signatory1Name, setSignatory1Name] = useState('K. V. Mohanan');
  const [signatory1Title, setSignatory1Title] = useState('President');
  const [signatory1ShowSig, setSignatory1ShowSig] = useState(true);
  const [signatory1SigImg, setSignatory1SigImg] = useState<string>('');

  const [signatory2Name, setSignatory2Name] = useState('Suresh Kumar Pillai');
  const [signatory2Title, setSignatory2Title] = useState('General Secretary');
  const [signatory2ShowSig, setSignatory2ShowSig] = useState(true);
  const [signatory2SigImg, setSignatory2SigImg] = useState<string>('');

  const [isExporting, setIsExporting] = useState(false);
  const [showSigUploadModal, setShowSigUploadModal] = useState<1 | 2 | null>(null);
  const [letterToDelete, setLetterToDelete] = useState<OfficialLetter | null>(null);
  const [showNewLetterModal, setShowNewLetterModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const composerTopRef = useRef<HTMLDivElement>(null);

  const DEFAULT_INITIAL_BODY = `<p>We are writing on behalf of <strong>Kairali Cultural Association Fujairah (A Norka affiliated Organisation)</strong> to officially convey that the Association hereby confirms and ratifies the following resolution.</p><p>We kindly request the concerned authorities to extend all necessary cooperation and assistance.</p>`;

  // Clear toast after 3.5s
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Initialize a fresh new letter on mount if none selected
  useEffect(() => {
    if (!activeLetterId) {
      handleCreateNewLetter(defaultUnit);
    }
  }, []);

  const handleCreateNewLetter = (targetUnit: string = defaultUnit) => {
    const currentLetters = loadLetters();
    setLetters(currentLetters);
    const nextRef = getNextReferenceNumber(targetUnit);
    setUnit(targetUnit);
    setReferenceNumber(nextRef.referenceNumber);
    setSeriesNumber(nextRef.seriesNumber);
    setDate(new Date().toISOString().split('T')[0]);
    setToAddress('To Whom It May Concern,\nRelevant Authorities,\nUnited Arab Emirates.');
    setSubject('OFFICIAL COMMUNICATION / NOTIFICATION');
    setSalutation('Respected Sir / Madam,');
    setBodyHtml(DEFAULT_INITIAL_BODY);
    if (editorRef.current) {
      editorRef.current.innerHTML = DEFAULT_INITIAL_BODY;
    }
    setEditorKey((k) => k + 1);
    setCategory('General');
    setStatus('Draft');
    setActiveLetterId(null);
    setIsEditing(true);
    setViewTab('editor');

    // Default Signatories from stored signatures
    const pres = storedSignatures.find((s) => s.signatoryRole === 'President');
    const sec = storedSignatures.find((s) => s.signatoryRole === 'General Secretary');
    if (pres) {
      setSignatory1Name(pres.name);
      setSignatory1SigImg(pres.signatureDataUrl || '');
      setSignatory1ShowSig(Boolean(pres.signatureDataUrl));
    } else {
      setSignatory1SigImg('');
      setSignatory1ShowSig(false);
    }
    if (sec) {
      setSignatory2Name(sec.name);
      setSignatory2SigImg(sec.signatureDataUrl || '');
      setSignatory2ShowSig(Boolean(sec.signatureDataUrl));
    } else {
      setSignatory2SigImg('');
      setSignatory2ShowSig(false);
    }

    setToastMessage({
      text: `Started New Letter Draft (${nextRef.referenceNumber})`,
      type: 'success',
    });

    setTimeout(() => {
      composerTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      subjectInputRef.current?.focus();
    }, 100);
  };

  const handleCreateLetterFromModal = (config: {
    unit: string;
    category: OfficialLetter['category'];
    subject: string;
    toAddress: string;
    salutation: string;
    bodyHtml: string;
  }) => {
    const currentLetters = loadLetters();
    setLetters(currentLetters);
    const nextRef = getNextReferenceNumber(config.unit);
    setUnit(config.unit);
    setReferenceNumber(nextRef.referenceNumber);
    setSeriesNumber(nextRef.seriesNumber);
    setDate(new Date().toISOString().split('T')[0]);
    setToAddress(config.toAddress);
    setSubject(config.subject);
    setSalutation(config.salutation);
    setBodyHtml(config.bodyHtml);
    if (editorRef.current) {
      editorRef.current.innerHTML = config.bodyHtml;
    }
    setEditorKey((k) => k + 1);
    setCategory(config.category);
    setStatus('Draft');
    setActiveLetterId(null);
    setIsEditing(true);
    setViewTab('editor');

    // Default Signatories from stored signatures
    const pres = storedSignatures.find((s) => s.signatoryRole === 'President');
    const sec = storedSignatures.find((s) => s.signatoryRole === 'General Secretary');
    if (pres) {
      setSignatory1Name(pres.name);
      setSignatory1SigImg(pres.signatureDataUrl || '');
      setSignatory1ShowSig(Boolean(pres.signatureDataUrl));
    } else {
      setSignatory1SigImg('');
      setSignatory1ShowSig(false);
    }
    if (sec) {
      setSignatory2Name(sec.name);
      setSignatory2SigImg(sec.signatureDataUrl || '');
      setSignatory2ShowSig(Boolean(sec.signatureDataUrl));
    } else {
      setSignatory2SigImg('');
      setSignatory2ShowSig(false);
    }

    setToastMessage({
      text: `Draft Created (${nextRef.referenceNumber}): ${config.subject}`,
      type: 'success',
    });

    setTimeout(() => {
      composerTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      subjectInputRef.current?.focus();
    }, 100);
  };

  const handleLoadTemplate = (tplId: string) => {
    const tpl = DEFAULT_LETTER_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    setSubject(tpl.subject);
    setToAddress(tpl.toAddress);
    setSalutation(tpl.salutation);
    setBodyHtml(tpl.bodyHtml);
    if (editorRef.current) {
      editorRef.current.innerHTML = tpl.bodyHtml;
    }
    setEditorKey((k) => k + 1);
    setCategory(tpl.category);
  };

  const handleUnitChange = (newUnit: string) => {
    setUnit(newUnit);
    if (!activeLetterId) {
      const nextRef = getNextReferenceNumber(newUnit);
      setReferenceNumber(nextRef.referenceNumber);
      setSeriesNumber(nextRef.seriesNumber);
    }
  };

  const handleSaveLetter = (newStatus?: OfficialLetter['status']) => {
    const effectiveStatus = newStatus || status;
    const effectiveBody = editorRef.current ? editorRef.current.innerHTML : bodyHtml;

    const currentLetter: OfficialLetter = {
      id: activeLetterId || `let_${Date.now()}`,
      referenceNumber,
      seriesNumber,
      date,
      unit,
      toAddress,
      subject,
      salutation,
      bodyHtml: effectiveBody,
      signatories: [
        {
          id: 'sig_1',
          title: signatory1Title,
          name: signatory1Name,
          unit,
          signatureDataUrl: signatory1SigImg,
          showSignature: signatory1ShowSig,
        },
        {
          id: 'sig_2',
          title: signatory2Title,
          name: signatory2Name,
          unit,
          signatureDataUrl: signatory2SigImg,
          showSignature: signatory2ShowSig,
        },
      ],
      status: effectiveStatus,
      category,
      createdAt: activeLetterId ? (letters.find((l) => l.id === activeLetterId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      issuedAt: effectiveStatus === 'Issued' ? new Date().toISOString() : undefined,
      createdByName: userSession?.fullName || 'Administrator',
    };

    let updated: OfficialLetter[];
    const idx = letters.findIndex((l) => l.id === currentLetter.id);
    if (idx >= 0) {
      updated = [...letters];
      updated[idx] = currentLetter;
    } else {
      updated = [currentLetter, ...letters];
    }

    setLetters(updated);
    saveLetters(updated);
    setActiveLetterId(currentLetter.id);
    setStatus(effectiveStatus);
    setBodyHtml(effectiveBody);
  };

  const handleRemoveSignature = (sigIndex: 1 | 2, removeFromDefaults: boolean = true) => {
    if (sigIndex === 1) {
      setSignatory1SigImg('');
      setSignatory1ShowSig(false);
      if (removeFromDefaults) {
        clearStoredSignature('President');
        setStoredSignatures(loadStoredSignatures());
      }
    } else {
      setSignatory2SigImg('');
      setSignatory2ShowSig(false);
      if (removeFromDefaults) {
        clearStoredSignature('General Secretary');
        setStoredSignatures(loadStoredSignatures());
      }
    }

    // Immediately persist update if active letter is being edited
    if (activeLetterId) {
      const currentLetters = loadLetters();
      const updated = currentLetters.map((l) => {
        if (l.id === activeLetterId) {
          const sigs = [...(l.signatories || [])];
          if (sigIndex === 1 && sigs[0]) {
            sigs[0] = { ...sigs[0], signatureDataUrl: '', showSignature: false };
          } else if (sigIndex === 2 && sigs[1]) {
            sigs[1] = { ...sigs[1], signatureDataUrl: '', showSignature: false };
          }
          return { ...l, signatories: sigs, updatedAt: new Date().toISOString() };
        }
        return l;
      });
      setLetters(updated);
      saveLetters(updated);
    }

    setToastMessage({
      text: `Signatory ${sigIndex} signature permanently removed and cleared from defaults.`,
      type: 'success',
    });
  };

  const handleOpenLetterForEdit = (letItem: OfficialLetter) => {
    setActiveLetterId(letItem.id);
    setUnit(letItem.unit);
    setReferenceNumber(letItem.referenceNumber);
    setSeriesNumber(letItem.seriesNumber || 1);
    setDate(letItem.date);
    setToAddress(letItem.toAddress);
    setSubject(letItem.subject);
    setSalutation(letItem.salutation);
    setBodyHtml(letItem.bodyHtml);
    if (editorRef.current) {
      editorRef.current.innerHTML = letItem.bodyHtml;
    }
    setEditorKey((k) => k + 1);
    setCategory(letItem.category);
    setStatus(letItem.status);

    if (letItem.signatories?.[0]) {
      setSignatory1Name(letItem.signatories[0].name);
      setSignatory1Title(letItem.signatories[0].title);
      setSignatory1ShowSig(letItem.signatories[0].showSignature ?? true);
      setSignatory1SigImg(letItem.signatories[0].signatureDataUrl || '');
    }
    if (letItem.signatories?.[1]) {
      setSignatory2Name(letItem.signatories[1].name);
      setSignatory2Title(letItem.signatories[1].title);
      setSignatory2ShowSig(letItem.signatories[1].showSignature ?? true);
      setSignatory2SigImg(letItem.signatories[1].signatureDataUrl || '');
    }

    setViewTab('editor');
  };

  const handleDuplicateLetter = (letItem: OfficialLetter) => {
    const nextRef = getNextReferenceNumber(letItem.unit);
    const duplicated: OfficialLetter = {
      ...letItem,
      id: `let_${Date.now()}`,
      referenceNumber: nextRef.referenceNumber,
      seriesNumber: nextRef.seriesNumber,
      date: new Date().toISOString().split('T')[0],
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [duplicated, ...letters];
    setLetters(updated);
    saveLetters(updated);
    handleOpenLetterForEdit(duplicated);
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    const currentLetter: OfficialLetter = {
      id: activeLetterId || `let_${Date.now()}`,
      referenceNumber,
      seriesNumber,
      date,
      unit,
      toAddress,
      subject,
      salutation,
      bodyHtml,
      signatories: [
        {
          id: 'sig_1',
          title: signatory1Title,
          name: signatory1Name,
          unit,
          signatureDataUrl: signatory1SigImg,
          showSignature: signatory1ShowSig,
        },
        {
          id: 'sig_2',
          title: signatory2Title,
          name: signatory2Name,
          unit,
          signatureDataUrl: signatory2SigImg,
          showSignature: signatory2ShowSig,
        },
      ],
      status,
      category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await downloadLetterPdf(currentLetter);
    } catch (err) {
      console.error('Error generating letter PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDirectPrint = () => {
    window.print();
  };

  // Upload custom digital signature image
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>, targetSig: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (targetSig === 1) {
        setSignatory1SigImg(dataUrl);
        setSignatory1ShowSig(true);
        const newSig: StoredSignature = {
          id: `sig_pres_${Date.now()}`,
          signatoryRole: 'President',
          name: signatory1Name,
          unit,
          signatureDataUrl: dataUrl,
          uploadedAt: new Date().toISOString(),
        };
        const updated = upsertStoredSignature(newSig);
        setStoredSignatures(updated);
      } else {
        setSignatory2SigImg(dataUrl);
        setSignatory2ShowSig(true);
        const newSig: StoredSignature = {
          id: `sig_sec_${Date.now()}`,
          signatoryRole: 'General Secretary',
          name: signatory2Name,
          unit,
          signatureDataUrl: dataUrl,
          uploadedAt: new Date().toISOString(),
        };
        const updated = upsertStoredSignature(newSig);
        setStoredSignatures(updated);
      }
      setShowSigUploadModal(null);
      setToastMessage({
        text: `Signatory ${targetSig} signature uploaded and saved to official settings.`,
        type: 'success',
      });
    };
    reader.readAsDataURL(file);
  };

  // Rich Text Editor formatting commands
  const applyFormat = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setBodyHtml(editorRef.current.innerHTML);
    }
  };

  const filteredLetters = letters.filter((l) => {
    if (filterUnit !== 'ALL' && l.unit !== filterUnit) return false;
    if (filterCategory !== 'ALL' && l.category !== filterCategory) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        l.referenceNumber.toLowerCase().includes(term) ||
        l.subject.toLowerCase().includes(term) ||
        l.toAddress.toLowerCase().includes(term) ||
        l.unit.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const availableUnits = ['Central', ...units.filter((u) => u !== 'Central')];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-[#881337] dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                <FileText className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase font-display">
                Official Letter Pad &amp; Notices
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                Automated Reference Series
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Draft, issue, and export official KCA Fujairah correspondence, consulate petitions, NOCs, notices, and appointment letters with sequential reference series and digital leadership sign-offs.
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewTab('editor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewTab === 'editor'
                    ? 'bg-white dark:bg-slate-700 text-[#881337] dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                Letter Composer
              </button>
              <button
                type="button"
                onClick={() => setViewTab('archive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewTab === 'archive'
                    ? 'bg-white dark:bg-slate-700 text-[#881337] dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 inline mr-1" />
                Issued Archive ({letters.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowNewLetterModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#881337] hover:bg-[#700f2b] text-white shadow-sm transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Letter</span>
            </button>
          </div>
        </div>

        {/* Live Feedback / Toast Notification */}
        {toastMessage && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded text-emerald-700 dark:text-emerald-400 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {viewTab === 'editor' ? (
        /* TWO-COLUMN LAYOUT: Controls & Form on Left, Official Live Preview on Right */
        <div ref={composerTopRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Composer Controls */}
          <div className="lg:col-span-5 space-y-4">
            {/* Quick Templates Accordion / Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Quick Letter Templates
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_LETTER_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleLoadTemplate(tpl.id)}
                    className="p-2 text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 hover:border-[#881337] dark:hover:border-rose-400 hover:bg-rose-50/40 transition-colors text-xs cursor-pointer"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {tpl.title}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{tpl.category}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Letter Metadata Form */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                Letter Configuration &amp; Scope
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {/* Issuing Unit */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Issuing Unit / Wing
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => handleUnitChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#881337] outline-none"
                  >
                    {availableUnits.map((u) => (
                      <option key={u} value={u}>
                        {u === 'Central' ? 'Central Committee' : `${u} Unit`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Document Type
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#881337] outline-none"
                  >
                    <option value="General">General Correspondence</option>
                    <option value="NOC">No Objection (NOC)</option>
                    <option value="Embassy / Consulate">Embassy / Consulate</option>
                    <option value="Sponsorship">Sponsorship Appeal</option>
                    <option value="Notice">Official Notice / Circular</option>
                    <option value="Appointment">Appointment Letter</option>
                  </select>
                </div>
              </div>

              {/* Reference Number & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1 flex items-center justify-between">
                    <span>Reference Series No.</span>
                    <span className="text-[10px] text-amber-600 font-mono">Auto</span>
                  </label>
                  <div className="relative">
                    <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#881337] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Issue Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#881337] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Recipient Address */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Recipient Address Block
                </label>
                <textarea
                  rows={3}
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="To Whom It May Concern..."
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#881337] outline-none"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Subject Line
                </label>
                <input
                  ref={subjectInputRef}
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. PARTICIPATION IN KERALA KALOLSAVAM"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#881337] outline-none"
                />
              </div>

              {/* Salutation */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Salutation
                </label>
                <input
                  type="text"
                  value={salutation}
                  onChange={(e) => setSalutation(e.target.value)}
                  placeholder="e.g. Respected Sir / Madam,"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#881337] outline-none"
                />
              </div>

              {/* Rich Body Toolbar & Editor */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Letter Body &amp; Narrative
                </label>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                  {/* Rich Text Toolbar */}
                  <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => applyFormat('bold')}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                      title="Bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat('italic')}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                      title="Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat('underline')}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                      title="Underline"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => applyFormat('justifyLeft')}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                      title="Align Left"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat('justifyCenter')}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                      title="Align Center"
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat('justifyFull')}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                      title="Justify"
                    >
                      <AlignJustify className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => applyFormat('insertUnorderedList')}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                      title="Bullet List"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat('insertOrderedList')}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                      title="Numbered List"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* ContentEditable / Raw Input Area */}
                  <div
                    key={editorKey}
                    ref={editorRef}
                    contentEditable
                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                    onBlur={(e) => setBodyHtml(e.currentTarget.innerHTML)}
                    className="p-3.5 min-h-[160px] max-h-[300px] overflow-y-auto text-xs text-slate-800 dark:text-slate-200 leading-relaxed outline-none focus:ring-1 focus:ring-[#881337]"
                  />
                </div>
              </div>

              {/* Leadership Signatories & Upload Block */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase flex items-center justify-between">
                  <span>Authorized Signatories &amp; Digital Seals</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Signatory 1 (President) */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Signatory 1 (President)</span>
                      <button
                        type="button"
                        onClick={() => setShowSigUploadModal(1)}
                        className="text-[10px] font-bold text-rose-700 dark:text-rose-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        {signatory1SigImg ? 'Change' : 'Upload'}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={signatory1Name}
                      onChange={(e) => setSignatory1Name(e.target.value)}
                      placeholder="President Name"
                      className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={signatory1Title}
                      onChange={(e) => setSignatory1Title(e.target.value)}
                      placeholder="Title"
                      className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900"
                    />

                    {/* Signature display toggle */}
                    <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                      <label className="flex items-center gap-2 text-[11px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={signatory1ShowSig}
                          onChange={(e) => setSignatory1ShowSig(e.target.checked)}
                          className="rounded border-slate-300 text-[#881337] focus:ring-[#881337] w-3.5 h-3.5"
                        />
                        <span>Print Digital Signature</span>
                      </label>

                      {signatory1SigImg ? (
                        <div className="flex items-center justify-between gap-2 p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <img src={signatory1SigImg} alt="Signature 1" className="h-6 max-w-[90px] object-contain" />
                            <span className="text-[9px] text-emerald-600 font-bold truncate">Active</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSignature(1, true)}
                            className="text-[10px] text-rose-600 hover:text-rose-800 hover:underline font-bold cursor-pointer shrink-0"
                            title="Permanently remove signature and clear from defaults"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic">No signature image attached (manual signing line)</div>
                      )}
                    </div>
                  </div>

                  {/* Signatory 2 (General Secretary) */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Signatory 2 (Secretary)</span>
                      <button
                        type="button"
                        onClick={() => setShowSigUploadModal(2)}
                        className="text-[10px] font-bold text-rose-700 dark:text-rose-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        {signatory2SigImg ? 'Change' : 'Upload'}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={signatory2Name}
                      onChange={(e) => setSignatory2Name(e.target.value)}
                      placeholder="Secretary Name"
                      className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={signatory2Title}
                      onChange={(e) => setSignatory2Title(e.target.value)}
                      placeholder="Title"
                      className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900"
                    />

                    {/* Signature display toggle */}
                    <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                      <label className="flex items-center gap-2 text-[11px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={signatory2ShowSig}
                          onChange={(e) => setSignatory2ShowSig(e.target.checked)}
                          className="rounded border-slate-300 text-[#881337] focus:ring-[#881337] w-3.5 h-3.5"
                        />
                        <span>Print Digital Signature</span>
                      </label>

                      {signatory2SigImg ? (
                        <div className="flex items-center justify-between gap-2 p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <img src={signatory2SigImg} alt="Signature 2" className="h-6 max-w-[90px] object-contain" />
                            <span className="text-[9px] text-emerald-600 font-bold truncate">Active</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSignature(2, true)}
                            className="text-[10px] text-rose-600 hover:text-rose-800 hover:underline font-bold cursor-pointer shrink-0"
                            title="Permanently remove signature and clear from defaults"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic">No signature image attached (manual signing line)</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveLetter('Draft')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Draft</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCreateNewLetter(unit)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    title="Reset current draft to clean new letter template"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Draft</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveLetter('Issued')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save &amp; Issue</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={isExporting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#881337] hover:bg-[#700f2b] text-white shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExporting ? 'Generating...' : 'Export PDF'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Live Authentic Letter Pad View & Print Layout */}
          <div className="lg:col-span-7">
            <div className="bg-slate-200 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-inner">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-mono">
                  <Eye className="w-4 h-4 text-rose-700" />
                  Official A4 Letter Pad Live Preview
                </span>
                <button
                  type="button"
                  onClick={handleDirectPrint}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Direct Print</span>
                </button>
              </div>

              {/* A4 Sheet Container */}
              <div
                id="kca-letterpad-print-area"
                className="bg-white text-slate-900 rounded-lg shadow-xl border border-slate-300 p-8 sm:p-12 max-w-[650px] mx-auto min-h-[780px] flex flex-col justify-between select-text relative font-sans"
                style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
              >
                {/* Letter Top Accent Bars */}
                <div className="absolute top-0 left-0 right-0 h-2.5 bg-[#881337] rounded-t-lg" />
                <div className="absolute top-2.5 left-0 right-0 h-1 bg-amber-500" />

                {/* Letter Content Container */}
                <div>
                  {/* Top Header Block */}
                  <div className="flex items-start justify-between gap-4 pt-3 pb-4 border-b border-slate-300">
                    <div className="w-14 h-14 rounded-full bg-white p-0.5 shadow-xs border border-slate-200 flex items-center justify-center shrink-0">
                      <KcaLogo size={48} />
                    </div>

                    <div className="flex-1 text-left">
                      <h2 className="font-display font-black text-base tracking-tight text-[#881337] uppercase leading-tight">
                        KAIRALI CULTURAL ASSOCIATION FUJAIRAH
                      </h2>
                      <div className="text-[10.5px] font-bold text-amber-700 tracking-wide mt-0.5">
                        {OFFICIAL_AFFILIATION}
                      </div>
                      <div className="text-[9px] text-slate-500 font-medium mt-0.5">
                        {unit === 'Central' ? 'Central Committee' : `${unit} Unit`} • {OFFICIAL_LOCATION} • Email: {OFFICIAL_LETTER_EMAIL}
                      </div>
                    </div>
                  </div>

                  {/* Ref & Date Row */}
                  <div className="flex items-center justify-between text-xs py-3 border-b border-slate-200 font-mono">
                    <div className="font-bold text-slate-800">
                      <span className="text-slate-500 font-normal">Ref: </span>
                      {referenceNumber || `KCA/${UNIT_CODE_MAP[unit] || 'CENTRAL'}/REF/2026/001`}
                    </div>
                    <div className="font-bold text-slate-800">
                      <span className="text-slate-500 font-normal">Date: </span>
                      {new Date(date || new Date()).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  {/* To Address */}
                  {toAddress && (
                    <div className="mt-4 text-xs leading-relaxed text-slate-800 whitespace-pre-line font-medium">
                      {toAddress}
                    </div>
                  )}

                  {/* Subject Line */}
                  {subject && (
                    <div className="mt-4 text-xs font-bold text-slate-900 underline decoration-[#881337] decoration-2 underline-offset-4 uppercase tracking-wide">
                      SUBJECT: {subject}
                    </div>
                  )}

                  {/* Salutation */}
                  {salutation && (
                    <div className="mt-4 text-xs font-bold text-slate-800">
                      {salutation}
                    </div>
                  )}

                  {/* Main Letter Body */}
                  <div
                    className="mt-3 text-xs text-slate-800 leading-relaxed space-y-2.5"
                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                  />

                  {/* Sign-off Greeting */}
                  <div className="mt-6 text-xs text-slate-800">
                    <div>Yours faithfully,</div>
                    <div className="font-bold uppercase tracking-wider text-[#881337] text-[11px] mt-0.5">
                      For KAIRALI CULTURAL ASSOCIATION FUJAIRAH
                    </div>
                  </div>
                </div>

                {/* Bottom Leadership Signatures */}
                <div className="pt-8 mt-12 border-t border-slate-200">
                  <div className="grid grid-cols-2 gap-8">
                    {/* Signatory 1 (President) */}
                    <div className="text-left">
                      {signatory1SigImg && signatory1ShowSig ? (
                        <img
                          src={signatory1SigImg}
                          alt="President Signature"
                          className="h-10 object-contain mb-1"
                        />
                      ) : (
                        <div className="h-10 border-b border-slate-400 border-dashed mb-1 w-36" />
                      )}
                      <div className="font-bold text-xs text-slate-900">{signatory1Name}</div>
                      <div className="text-[10px] text-slate-500">
                        {signatory1Title}, KCA Fujairah ({unit === 'Central' ? 'Central Committee' : `${unit} Unit`})
                      </div>
                    </div>

                    {/* Signatory 2 (General Secretary) */}
                    <div className="text-left">
                      {signatory2SigImg && signatory2ShowSig ? (
                        <img
                          src={signatory2SigImg}
                          alt="General Secretary Signature"
                          className="h-10 object-contain mb-1"
                        />
                      ) : (
                        <div className="h-10 border-b border-slate-400 border-dashed mb-1 w-36" />
                      )}
                      <div className="font-bold text-xs text-slate-900">{signatory2Name}</div>
                      <div className="text-[10px] text-slate-500">
                        {signatory2Title}, KCA Fujairah ({unit === 'Central' ? 'Central Committee' : `${unit} Unit`})
                      </div>
                    </div>
                  </div>

                  {/* Subtle Official Footer Stamp */}
                  <div className="mt-6 pt-2 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-400 font-mono">
                    <span>{OFFICIAL_ORG_NAME}</span>
                    <span>Ref: {referenceNumber}</span>
                    <span>Status: {status.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ARCHIVE / ISSUED LETTERS DIRECTORY VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Archive Filter Bar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by reference series, recipient, subject, or unit..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="ALL">All Units</option>
                {availableUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="General">General</option>
                <option value="NOC">NOC</option>
                <option value="Embassy / Consulate">Embassy / Consulate</option>
                <option value="Sponsorship">Sponsorship</option>
                <option value="Notice">Notice</option>
                <option value="Appointment">Appointment</option>
              </select>
            </div>
          </div>

          {/* Letters List */}
          {filteredLetters.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="font-bold text-xs">No letters found matching criteria</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredLetters.map((letter) => (
                <div
                  key={letter.id}
                  className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                        {letter.referenceNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {letter.unit}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          letter.status === 'Issued'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {letter.status}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {letter.date}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {letter.subject}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-1 max-w-2xl">
                      {letter.toAddress.replace(/\n/g, ', ')}
                    </p>
                  </div>

                  {/* Row Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenLetterForEdit(letter)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit / View</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadLetterPdf(letter)}
                      className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-[#881337] dark:text-rose-300 cursor-pointer"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicateLetter(letter)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                      title="Duplicate as New Reference"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setLetterToDelete(letter)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Delete Letter"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hidden File input for digital signature image uploads */}
      {showSigUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-rose-700" />
                Upload Digital Signature ({showSigUploadModal === 1 ? 'President' : 'General Secretary'})
              </h3>
              <button
                type="button"
                onClick={() => setShowSigUploadModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please upload a transparent PNG, JPG or WEBP image of the signature. It will be securely stored for instant reuse across letters and certificates.
            </p>

            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={(e) => handleSignatureUpload(e, showSigUploadModal)}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#881337] file:text-white hover:file:bg-[#700f2b] cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Delete Letter Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!letterToDelete}
        title="Delete Official Letter"
        itemName={letterToDelete?.referenceNumber || 'this letter'}
        message={`Are you sure you want to permanently delete official letter "${letterToDelete?.referenceNumber}" ("${letterToDelete?.subject}")?`}
        confirmLabel="Delete Letter"
        onConfirm={() => {
          if (letterToDelete) {
            const updated = letters.filter((l) => l.id !== letterToDelete.id);
            setLetters(updated);
            saveLetters(updated);
            if (activeLetterId === letterToDelete.id) {
              handleCreateNewLetter();
            }
            setLetterToDelete(null);
          }
        }}
        onClose={() => setLetterToDelete(null)}
      />

      {/* New Letter Template & Config Modal */}
      <NewLetterModal
        isOpen={showNewLetterModal}
        onClose={() => setShowNewLetterModal(false)}
        units={units}
        currentUnit={unit}
        onCreateLetter={handleCreateLetterFromModal}
      />
    </div>
  );
};
