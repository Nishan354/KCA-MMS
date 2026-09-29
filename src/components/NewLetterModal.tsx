import React, { useState } from 'react';
import { DEFAULT_LETTER_TEMPLATES, LetterTemplate, OfficialLetter } from '../types/letter';
import { getNextReferenceNumber } from '../utils/letterStorage';
import {
  FileText,
  Sparkles,
  X,
  Building2,
  Check,
  ArrowRight,
  ShieldCheck,
  Award,
  Globe,
  HeartHandshake,
  BellRing,
  UserPlus,
  PenTool,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface NewLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: string[];
  currentUnit: string;
  onCreateLetter: (config: {
    unit: string;
    category: OfficialLetter['category'];
    subject: string;
    toAddress: string;
    salutation: string;
    bodyHtml: string;
  }) => void;
}

export const NewLetterModal: React.FC<NewLetterModalProps> = ({
  isOpen,
  onClose,
  units,
  currentUnit,
  onCreateLetter,
}) => {
  const [selectedUnit, setSelectedUnit] = useState<string>(currentUnit || 'Central');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl_general');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [customToAddress, setCustomToAddress] = useState<string>('');

  if (!isOpen) return null;

  const availableUnits = ['Central', ...units.filter((u) => u !== 'Central')];
  const refPreview = getNextReferenceNumber(selectedUnit);

  const templateIcons: Record<string, React.FC<{ className?: string }>> = {
    tpl_general: FileText,
    tpl_noc: ShieldCheck,
    tpl_embassy: Globe,
    tpl_sponsorship: HeartHandshake,
    tpl_notice: BellRing,
    tpl_appointment: UserPlus,
  };

  const selectedTemplate = DEFAULT_LETTER_TEMPLATES.find((t) => t.id === selectedTemplateId);

  const handleStartDraft = () => {
    if (selectedTemplateId === 'blank') {
      onCreateLetter({
        unit: selectedUnit,
        category: 'General',
        subject: customSubject.trim() || 'OFFICIAL COMMUNICATION',
        toAddress: customToAddress.trim() || 'To Whom It May Concern,\nRelevant Authorities,\nUnited Arab Emirates.',
        salutation: 'Respected Sir / Madam,',
        bodyHtml: '<p>Please write the official letter content here...</p>',
      });
    } else if (selectedTemplate) {
      onCreateLetter({
        unit: selectedUnit,
        category: selectedTemplate.category,
        subject: customSubject.trim() || selectedTemplate.subject,
        toAddress: customToAddress.trim() || selectedTemplate.toAddress,
        salutation: selectedTemplate.salutation,
        bodyHtml: selectedTemplate.bodyHtml,
      });
    }

    try {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    } catch (_) {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-rose-50/50 via-white to-amber-50/30 dark:from-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#881337] text-white flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-white">
                Create New Official Letter
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose an official template or start a clean custom draft
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Unit Scope & Sequential Reference Preview */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                Issuing Unit / Wing
              </label>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#881337] dark:text-rose-400" />
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#881337] outline-none"
                >
                  {availableUnits.map((u) => (
                    <option key={u} value={u}>
                      {u === 'Central' ? 'Central Committee' : `${u} Unit`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Assigned Reference Series
              </div>
              <div className="font-mono font-bold text-xs text-[#881337] dark:text-rose-300 mt-0.5 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-900/60 inline-block">
                {refPreview.referenceNumber}
              </div>
            </div>
          </div>

          {/* Template Selection Grid */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Select Letter Template
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEFAULT_LETTER_TEMPLATES.map((tpl) => {
                const IconComponent = templateIcons[tpl.id] || FileText;
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(tpl.id);
                      setCustomSubject('');
                      setCustomToAddress('');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-[#881337] bg-rose-50/50 dark:bg-rose-950/40 shadow-xs ring-1 ring-[#881337]/30'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-[#881337] text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {tpl.title}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#881337] dark:text-rose-400 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {tpl.subject}
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* Blank Custom Option */}
              <button
                type="button"
                onClick={() => {
                  setSelectedTemplateId('blank');
                  setCustomSubject('');
                  setCustomToAddress('');
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 sm:col-span-2 ${
                  selectedTemplateId === 'blank'
                    ? 'border-[#881337] bg-rose-50/50 dark:bg-rose-950/40 shadow-xs ring-1 ring-[#881337]/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    selectedTemplateId === 'blank'
                      ? 'bg-[#881337] text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Blank Custom Letter
                    </span>
                    {selectedTemplateId === 'blank' && (
                      <Check className="w-3.5 h-3.5 text-[#881337] dark:text-rose-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Start from an empty official letterhead canvas with custom subject and body
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleStartDraft}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#881337] hover:bg-[#700f2b] transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <span>Start Composing Letter</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
