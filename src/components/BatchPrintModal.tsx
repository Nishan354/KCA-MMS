import React, { useState } from 'react';
import { Member, CustomFieldDefinition } from '../types/member';
import { IdCard } from './IdCard';
import {
  X,
  Printer,
  CheckSquare,
  Square,
  Download,
  Layers,
  FileCheck,
  Scissors,
  Loader2,
} from 'lucide-react';
import { generateBatchIdCardsPdf } from '../utils/pdfGenerator';

interface BatchPrintModalProps {
  members: Member[];
  customFields?: CustomFieldDefinition[];
  isOpen: boolean;
  onClose: () => void;
}

export const BatchPrintModal: React.FC<BatchPrintModalProps> = ({
  members,
  customFields = [],
  isOpen,
  onClose,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(members.map((m) => m.id));
  const [printSide, setPrintSide] = useState<'front' | 'back' | 'both'>('front');
  const [layout, setLayout] = useState<'8_per_page' | '10_per_page'>('8_per_page');
  const [bothSideMode, setBothSideMode] = useState<'side_by_side' | 'duplex_pages'>('side_by_side');
  const [showCropMarks, setShowCropMarks] = useState<boolean>(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedIds.length === members.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(members.map((m) => m.id));
    }
  };

  const toggleSelectMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const membersToPrint = members.filter((m) => selectedIds.includes(m.id));
  const cardsPerPage = layout === '8_per_page' ? 8 : 10;

  // Calculate items to print
  interface BatchItem {
    id: string;
    member: Member;
    side: 'front' | 'back';
  }

  const batchItems: BatchItem[] = [];
  if (printSide === 'front') {
    membersToPrint.forEach((m) => batchItems.push({ id: `${m.id}-front`, member: m, side: 'front' }));
  } else if (printSide === 'back') {
    membersToPrint.forEach((m) => batchItems.push({ id: `${m.id}-back`, member: m, side: 'back' }));
  } else {
    // Both sides
    if (bothSideMode === 'side_by_side') {
      membersToPrint.forEach((m) => {
        batchItems.push({ id: `${m.id}-front`, member: m, side: 'front' });
        batchItems.push({ id: `${m.id}-back`, member: m, side: 'back' });
      });
    } else {
      // Duplex: all fronts then all backs
      membersToPrint.forEach((m) => batchItems.push({ id: `${m.id}-front`, member: m, side: 'front' }));
      membersToPrint.forEach((m) => batchItems.push({ id: `${m.id}-back`, member: m, side: 'back' }));
    }
  }

  const totalPages = Math.max(1, Math.ceil(batchItems.length / cardsPerPage));

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (membersToPrint.length === 0 || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setPdfProgress({ current: 0, total: membersToPrint.length * (printSide === 'both' ? 2 : 1) });

    try {
      await generateBatchIdCardsPdf(membersToPrint, {
        side: printSide,
        layout,
        showCropMarks,
        bothSideMode,
        customFields,
        onProgress: (current, total) => {
          setPdfProgress({ current, total });
        },
      });
    } catch (e) {
      console.error('Batch PDF generation failed:', e);
      alert('Error generating batch PDF. Falling back to browser print.');
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="batch-print-modal-container bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="no-print px-5 py-3.5 bg-[#8b0000] text-white flex items-center justify-between border-b border-[#730000]">
          <div>
            <h3 className="font-display font-bold text-base sm:text-lg text-white flex items-center gap-2">
              <span>Batch ID Card Print Studio</span>
              <span className="text-[11px] font-mono font-normal bg-white/20 px-2 py-0.5 rounded text-white">
                A4 ISO CR-80 (85.6 × 54mm)
              </span>
            </h3>
            <p className="text-xs text-red-100 mt-0.5">
              Standard 2-column layout aligned for standard A4 PVC card sheets, badges, and laminates
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-md transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="no-print px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Card side & layout controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Side selection */}
            <div className="flex bg-white p-1 rounded-md border border-slate-300 text-xs font-semibold shadow-xs">
              <button
                type="button"
                onClick={() => setPrintSide('front')}
                className={`px-3 py-1 rounded transition-colors ${
                  printSide === 'front' ? 'bg-[#8b0000] text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Front Only
              </button>
              <button
                type="button"
                onClick={() => setPrintSide('back')}
                className={`px-3 py-1 rounded transition-colors ${
                  printSide === 'back' ? 'bg-[#8b0000] text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Back Only
              </button>
              <button
                type="button"
                onClick={() => setPrintSide('both')}
                className={`px-3 py-1 rounded transition-colors ${
                  printSide === 'both' ? 'bg-[#8b0000] text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Both Sides
              </button>
            </div>

            {/* If both sides, show paired mode */}
            {printSide === 'both' && (
              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-300 text-xs">
                <span className="text-slate-500 font-medium">Layout:</span>
                <select
                  value={bothSideMode}
                  onChange={(e) => setBothSideMode(e.target.value as any)}
                  className="font-bold text-slate-800 outline-none bg-transparent"
                >
                  <option value="side_by_side">Side-by-Side (Pair)</option>
                  <option value="duplex_pages">Duplex Pages (Front/Back)</option>
                </select>
              </div>
            )}

            {/* Density Selector */}
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-300 text-xs">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">A4 Grid:</span>
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value as any)}
                className="font-bold text-slate-800 outline-none bg-transparent"
              >
                <option value="8_per_page">8 Cards (2×4 Grid - Recommended)</option>
                <option value="10_per_page">10 Cards (2×5 Grid - High Density)</option>
              </select>
            </div>

            {/* Crop marks toggle */}
            <label className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-md border border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer shadow-xs">
              <input
                type="checkbox"
                checked={showCropMarks}
                onChange={(e) => setShowCropMarks(e.target.checked)}
                className="rounded text-[#8b0000] focus:ring-0"
              />
              <Scissors className="w-3.5 h-3.5 text-slate-500" />
              <span>Cutting Guides</span>
            </label>
          </div>

          {/* Right: Selection count */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="inline-flex items-center gap-1.5 font-bold text-slate-800 hover:text-[#8b0000] cursor-pointer"
            >
              {selectedIds.length === members.length ? (
                <CheckSquare className="w-4 h-4 text-[#8b0000]" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {selectedIds.length === members.length ? 'Deselect All' : 'Select All'} ({selectedIds.length}/{members.length})
              </span>
            </button>
            <div className="h-4 w-px bg-slate-300"></div>
            <div className="text-slate-600 font-medium">
              Total: <span className="font-bold text-[#8b0000]">{batchItems.length}</span> cards ({totalPages} A4 {totalPages === 1 ? 'Sheet' : 'Sheets'})
            </div>
          </div>
        </div>

        {/* Print Layout Sheet Preview */}
        <div className="p-4 sm:p-6 bg-slate-200/90 overflow-y-auto flex-1 flex justify-center">
          {batchItems.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-slate-500 text-center max-w-md my-auto border border-slate-300 shadow-sm">
              <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-sm">No Members Selected</h4>
              <p className="text-xs text-slate-500 mt-1">
                Please check at least one member to preview and print batch ID cards.
              </p>
            </div>
          ) : (
            <div className="space-y-8 w-full max-w-4xl">
              {Array.from({ length: totalPages }).map((_, pageIdx) => {
                const pageCards = batchItems.slice(pageIdx * cardsPerPage, (pageIdx + 1) * cardsPerPage);

                return (
                  <div
                    key={pageIdx}
                    className="bg-white rounded-xl p-6 sm:p-8 shadow-md border border-slate-300 relative print-sheet-page"
                  >
                    {/* Sheet Header Label */}
                    <div className="no-print flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-[#8b0000] text-white font-mono font-bold text-xs rounded">
                          A4 Sheet {pageIdx + 1} of {totalPages}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          {layout === '8_per_page' ? '2 Columns × 4 Rows' : '2 Columns × 5 Rows'} • CR-80 Standard (85.6mm × 54mm)
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {pageCards.length} Cards on this sheet
                      </span>
                    </div>

                    {/* Cards Grid Container */}
                    <div
                      className="print-card-sheet grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 justify-items-center items-center"
                      style={{
                        margin: '0 auto',
                      }}
                    >
                      {pageCards.map((item) => (
                        <div
                          key={item.id}
                          className={`batch-card-cell relative transition-transform hover:scale-[1.01] ${
                            showCropMarks ? 'border border-dashed border-slate-300' : ''
                          }`}
                          style={{
                            width: '384px',
                            height: '240px',
                            overflow: 'hidden',
                            borderRadius: '12px',
                          }}
                        >
                          <div className="no-print absolute top-2 right-2 z-20">
                            <button
                              type="button"
                              onClick={() => toggleSelectMember(item.member.id)}
                              className="p-1 bg-white/95 rounded-md shadow-md hover:bg-white text-[#8b0000] border border-slate-200 cursor-pointer"
                              title="Toggle member"
                            >
                              <CheckSquare className="w-4 h-4" />
                            </button>
                          </div>

                          <div
                            style={{
                              transform: 'scale(0.8)',
                              transformOrigin: 'top left',
                              width: '480px',
                              height: '300px',
                            }}
                          >
                            <IdCard
                              member={item.member}
                              customFields={customFields}
                              side={item.side}
                              idPrefix={`batch-${item.side}`}
                              showShadow={false}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Sheet Footer Note */}
                    <div className="no-print text-center text-[11px] text-slate-400 border-t border-slate-100 pt-3 mt-6">
                      Kairali Cultural Association Fujairah • Print at 100% scale (No scaling / Actual size) for exact PVC card punch
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="no-print px-5 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Print Recommendation:</span>
            <span>Use standard A4 250gsm+ card stock or PVC pre-cut sheet, set scale to 100%</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>

            {/* Direct A4 PDF Batch Download Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={batchItems.length === 0 || isGeneratingPdf}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              title="Download crystal-clear, millimeter-precise A4 PDF with exact CR-80 alignment"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    Generating PDF...{' '}
                    {pdfProgress ? `(${pdfProgress.current}/${pdfProgress.total})` : ''}
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download A4 Batch PDF</span>
                </>
              )}
            </button>

            {/* Direct Browser Print Button */}
            <button
              type="button"
              onClick={handleBrowserPrint}
              disabled={batchItems.length === 0 || isGeneratingPdf}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-md bg-[#8b0000] hover:bg-[#730000] text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Sheets ({totalPages})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

