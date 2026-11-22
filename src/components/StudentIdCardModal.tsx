import React, { useState } from 'react';
import { StudentWingMember } from '../types/studentsWing';
import { StudentIdCard } from './StudentIdCard';
import { normalizeChildrenWingId } from '../utils/studentsWingStorage';
import { captureElementAsPng, downloadDataUrl } from '../utils/cardExporter';
import { loadSavedTheme } from '../utils/theme';
import { ThemePreset } from '../types/theme';
import { HeaderTitleStyle } from '../types/portal';
import { usePortalConfig } from '../hooks/usePortalConfig';
import { resolveEffectiveTitleStyle } from '../utils/titleGraphic';
import {
  X,
  Download,
  Printer,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Share2,
  IdCard,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudentIdCardModalProps {
  student: StudentWingMember | null;
  onClose: () => void;
}

export const StudentIdCardModal: React.FC<StudentIdCardModalProps> = ({
  student,
  onClose,
}) => {
  const { portalConfig, updateConfig } = usePortalConfig();
  const [selectedTitleStyle, setSelectedTitleStyle] = useState<HeaderTitleStyle>(
    () => resolveEffectiveTitleStyle(portalConfig, 'student_card')
  );
  const [side, setSide] = useState<'front' | 'both'>('both');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [copiedInfo, setCopiedInfo] = useState(false);
  const [theme, setTheme] = useState<ThemePreset>(() => loadSavedTheme());

  React.useEffect(() => {
    const handleThemeChange = (e: any) => {
      setTheme(e?.detail || loadSavedTheme());
    };
    window.addEventListener('kca-theme-changed', handleThemeChange);
    return () => window.removeEventListener('kca-theme-changed', handleThemeChange);
  }, []);

  const handleApplyTitleToAllStudents = (styleToApply: HeaderTitleStyle) => {
    setSelectedTitleStyle(styleToApply);
    updateConfig({
      headerTitleStyle: styleToApply,
      applyTitleToStudentCards: styleToApply !== 'standard',
    });
    const label =
      styleToApply === 'official_lockup'
        ? 'Official KCA Title Lockup'
        : styleToApply === 'title_graphic'
        ? 'Official Title Graphic Banner'
        : 'Standard Header';
    setExportMessage(`Applied "${label}" to all Children's Wing / Student ID cards!`);
    confetti({ particleCount: 30, spread: 50 });
    setTimeout(() => setExportMessage(null), 3500);
  };

  if (!student) return null;

  const displayMemberId = normalizeChildrenWingId(student.studentId);

  const handleDownloadCard = async (targetSide: 'front' | 'back' = 'front') => {
    setIsExporting(true);
    setExportError(null);
    setExportMessage(`Generating High-Resolution Children's Wing ID Card (${targetSide.toUpperCase()})...`);

    try {
      const domId = `student-modal-card-${student.id}-${targetSide}`;
      const el = document.getElementById(domId);
      if (!el) {
        throw new Error('Card preview element not found');
      }
      const dataUrl = await captureElementAsPng(el, {
        pixelRatio: 3,
        backgroundColor: '#ffffff',
      });
      const safeName = student.fullName.replace(/[^a-zA-Z0-9_-]/g, '_');
      downloadDataUrl(dataUrl, `KCA_ChildrensWing_${displayMemberId}_${safeName}_${targetSide}.png`);
      setExportMessage(`Children's Wing ID Card (${targetSide.toUpperCase()}) downloaded!`);
      confetti({ particleCount: 40, spread: 60 });
      setTimeout(() => setExportMessage(null), 3500);
    } catch (err: any) {
      console.error("Children's Wing ID Card export error:", err);
      setExportError(`Export failed: ${err?.message || 'Unable to export PNG'}. Use Print Card instead.`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyShareText = () => {
    const text = [
      `*Kairali Cultural Association Fujairah – Children's Wing*`,
      `Member ID: ${displayMemberId}`,
      `Name: ${student.fullName}`,
      `Role: ${student.wingRole}`,
      student.schoolOrCollege ? `Institution: ${student.schoolOrCollege}` : '',
      `Unit: ${student.unit} Unit`,
      `Parent: ${student.parentName}`,
    ]
      .filter(Boolean)
      .join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedInfo(true);
      setTimeout(() => setCopiedInfo(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div
          className="px-6 py-4 text-white flex items-center justify-between border-b"
          style={{
            backgroundColor: theme.primary,
            borderColor: theme.primaryHover,
          }}
        >
          <div>
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Children&apos;s Wing Official ID Studio</span>
            </div>
            <h3 className="font-display font-black text-xl text-white mt-0.5">
              {student.fullName} (Member ID: {displayMemberId})
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar (Title Style & Side Toggle) */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold" style={{ color: theme.primary }}>
              <IdCard className="w-4 h-4" style={{ color: theme.primary }} />
              <span>Official Horizontal Children&apos;s Wing Identity Card</span>
            </div>

            {/* Side Toggle */}
            <div className="inline-flex rounded-lg bg-slate-200/80 dark:bg-slate-900 p-0.5">
              <button
                type="button"
                onClick={() => setSide('front')}
                style={side === 'front' ? { backgroundColor: theme.primary } : undefined}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  side === 'front'
                    ? 'text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Front Only
              </button>
              <button
                type="button"
                onClick={() => setSide('both')}
                style={side === 'both' ? { backgroundColor: theme.primary } : undefined}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  side === 'both'
                    ? 'text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Front &amp; Back
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/70">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Header Title:
              </span>
              <div className="inline-flex rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-0.5 text-[11px] font-semibold">
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
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleApplyTitleToAllStudents(selectedTitleStyle)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#8b0000] border border-rose-200 text-[11px] font-bold cursor-pointer transition-colors"
              title="Apply selected title style to all Student / Children's Wing ID cards"
            >
              <Check className="w-3 h-3" />
              <span>Apply Title to All Student Cards</span>
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {exportMessage && (
          <div className="bg-emerald-50 text-emerald-800 px-6 py-2.5 border-b border-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportMessage}</span>
          </div>
        )}

        {exportError && (
          <div className="bg-red-50 text-red-800 px-6 py-2.5 border-b border-red-200 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{exportError}</span>
          </div>
        )}

        {/* Card Preview Canvas */}
        <div className="p-6 md:p-8 bg-slate-100 dark:bg-slate-950 overflow-y-auto flex-1 flex flex-col items-center justify-center">
          <StudentIdCard
            student={student}
            side={side}
            titleStyle={selectedTitleStyle}
            idPrefix="student-modal-card"
            showShadow={true}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-5 text-center max-w-lg">
            Official <strong>{portalConfig.shortName || 'KCA'} Children&apos;s Wing Identity Card</strong> featuring official emblem, title lockup, parent &amp; emergency details, and Member ID verification QR.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyShareText}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              {copiedInfo ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-600" />}
              <span>{copiedInfo ? 'Copied Member Details!' : 'Copy Details'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print ID Card</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadCard('front')}
              disabled={isExporting}
              style={{ backgroundColor: theme.primary }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg text-white transition-opacity shadow-xs disabled:opacity-50 cursor-pointer hover:opacity-90"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-amber-300" />}
              <span>Download Front (PNG)</span>
            </button>

            {side === 'both' && (
              <button
                type="button"
                onClick={() => handleDownloadCard('back')}
                disabled={isExporting}
                style={{ backgroundColor: theme.primaryHover }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg text-white transition-opacity shadow-xs disabled:opacity-50 cursor-pointer hover:opacity-90"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>Download Back (PNG)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
