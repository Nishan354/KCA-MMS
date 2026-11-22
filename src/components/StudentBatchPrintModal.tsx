import React, { useState, useEffect } from 'react';
import { StudentWingMember } from '../types/studentsWing';
import { StudentIdCard } from './StudentIdCard';
import { useCustomLogo } from './Logo';
import { usePortalConfig } from '../hooks/usePortalConfig';
import { captureElementAsPng } from '../utils/cardExporter';
import jsPDF from 'jspdf';
import { loadSavedTheme } from '../utils/theme';
import { ThemePreset } from '../types/theme';
import { HeaderTitleStyle } from '../types/portal';
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
  Sparkles,
  Type,
} from 'lucide-react';

interface StudentBatchPrintModalProps {
  students: StudentWingMember[];
  initialSelectedIds?: string[];
  isOpen: boolean;
  onClose: () => void;
}

export const StudentBatchPrintModal: React.FC<StudentBatchPrintModalProps> = ({
  students,
  initialSelectedIds,
  isOpen,
  onClose,
}) => {
  const { portalConfig } = usePortalConfig();
  const { customLogo } = useCustomLogo();
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    initialSelectedIds && initialSelectedIds.length > 0
      ? initialSelectedIds
      : students.map((s) => s.id)
  );
  const [printSide, setPrintSide] = useState<'front' | 'back' | 'both'>('front');
  const [layout, setLayout] = useState<'8_per_page' | '10_per_page'>('8_per_page');
  const [bothSideMode, setBothSideMode] = useState<'side_by_side' | 'duplex_pages'>('side_by_side');
  const [showCropMarks, setShowCropMarks] = useState<boolean>(true);
  const [batchTitleStyle, setBatchTitleStyle] = useState<HeaderTitleStyle | 'portal_default'>('portal_default');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);
  const [theme, setTheme] = useState<ThemePreset>(() => loadSavedTheme());

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      setTheme(e?.detail || loadSavedTheme());
    };
    window.addEventListener('kca-theme-changed', handleThemeChange);
    return () => window.removeEventListener('kca-theme-changed', handleThemeChange);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialSelectedIds && initialSelectedIds.length > 0) {
        setSelectedIds(initialSelectedIds);
      } else {
        setSelectedIds(students.map((s) => s.id));
      }
    }
  }, [isOpen, students, initialSelectedIds]);

  if (!isOpen) return null;

  const brandRevisionKey = `${customLogo ? customLogo.length : 'def'}-${portalConfig.updatedAt || '0'}-${portalConfig.headerTitleStyle || 'ol'}`;

  const toggleSelectAll = () => {
    if (selectedIds.length === students.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map((s) => s.id));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const studentsToPrint = students.filter((s) => selectedIds.includes(s.id));
  const cardsPerPage = layout === '8_per_page' ? 8 : 10;

  interface StudentBatchItem {
    id: string;
    domKey: string;
    student: StudentWingMember;
    side: 'front' | 'back';
  }

  const batchItems: StudentBatchItem[] = [];
  if (printSide === 'front') {
    studentsToPrint.forEach((s, idx) =>
      batchItems.push({
        id: `${s.id}-front-${idx}`,
        domKey: `stu-batch-front-${idx}`,
        student: s,
        side: 'front',
      })
    );
  } else if (printSide === 'back') {
    studentsToPrint.forEach((s, idx) =>
      batchItems.push({
        id: `${s.id}-back-${idx}`,
        domKey: `stu-batch-back-${idx}`,
        student: s,
        side: 'back',
      })
    );
  } else {
    if (bothSideMode === 'side_by_side') {
      studentsToPrint.forEach((s, idx) => {
        batchItems.push({
          id: `${s.id}-front-${idx}`,
          domKey: `stu-batch-pair-f-${idx}`,
          student: s,
          side: 'front',
        });
        batchItems.push({
          id: `${s.id}-back-${idx}`,
          domKey: `stu-batch-pair-b-${idx}`,
          student: s,
          side: 'back',
        });
      });
    } else {
      studentsToPrint.forEach((s, idx) =>
        batchItems.push({
          id: `${s.id}-front-${idx}`,
          domKey: `stu-batch-dup-f-${idx}`,
          student: s,
          side: 'front',
        })
      );
      studentsToPrint.forEach((s, idx) =>
        batchItems.push({
          id: `${s.id}-back-${idx}`,
          domKey: `stu-batch-dup-b-${idx}`,
          student: s,
          side: 'back',
        })
      );
    }
  }

  const totalPages = Math.max(1, Math.ceil(batchItems.length / cardsPerPage));

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (batchItems.length === 0 || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setPdfProgress({ current: 0, total: batchItems.length });

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const cardWidth = 85.6;
      const cardHeight = 54.0;
      const cols = 2;
      const colX = [16, 108.4];
      const rowY =
        layout === '8_per_page'
          ? [22, 84, 146, 208]
          : [15, 71, 127, 183, 239];

      const orgHeaderName = (portalConfig.shortName || portalConfig.portalName || 'OFFICIAL').toUpperCase();
      const drawPageDecoration = (pageNum: number, totalPageCount: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(127, 29, 29);
        doc.text(
          `${orgHeaderName} • CHILDREN'S WING OFFICIAL BATCH ID SHEET (CR-80 85.6 × 54mm)`,
          105,
          10,
          { align: 'center' }
        );
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Sheet ${pageNum} of ${totalPageCount} • Print at 100% Actual Size`,
          105,
          290,
          { align: 'center' }
        );
      };

      let processedCount = 0;

      for (let p = 0; p < totalPages; p++) {
        if (p > 0) doc.addPage('a4', 'portrait');
        drawPageDecoration(p + 1, totalPages);

        const pageCards = batchItems.slice(p * cardsPerPage, (p + 1) * cardsPerPage);

        for (let j = 0; j < pageCards.length; j++) {
          const item = pageCards[j];
          const isDuplexBackPage =
            printSide === 'both' &&
            bothSideMode === 'duplex_pages' &&
            item.side === 'back';

          const origCol = j % cols;
          const col = isDuplexBackPage ? (origCol === 0 ? 1 : 0) : origCol;
          const row = Math.floor(j / cols);
          const x = colX[col];
          const y = rowY[row];

          if (showCropMarks) {
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.3);
            doc.setLineDashPattern([2, 2], 0);
            doc.rect(x - 0.5, y - 0.5, cardWidth + 1, cardHeight + 1, 'S');
            doc.setLineDashPattern([], 0);
          }

          const domElementId = `${item.domKey}-${item.student.id}-${item.side}`;
          const el = document.getElementById(domElementId);
          if (el) {
            const cardDataUrl = await captureElementAsPng(el, {
              pixelRatio: 2.5,
              backgroundColor: '#ffffff',
            });
            doc.addImage(cardDataUrl, 'PNG', x, y, cardWidth, cardHeight);
          }

          processedCount++;
          setPdfProgress({ current: processedCount, total: batchItems.length });
        }
      }

      const cleanSide = printSide.toUpperCase();
      const dateStr = new Date().toISOString().split('T')[0];
      doc.save(`KCA_Childrens_Wing_Batch_ID_Cards_${cleanSide}_A4_${dateStr}.pdf`);
    } catch (e) {
      console.error("Children's Wing Batch PDF generation failed:", e);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
      <div className="batch-print-modal-container bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div
          className="no-print px-5 py-3.5 text-white flex items-center justify-between border-b"
          style={{
            backgroundColor: theme.primary,
            borderColor: theme.primaryHover,
          }}
        >
          <div>
            <h3 className="font-display font-bold text-base sm:text-lg text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Children&apos;s Wing Batch ID Card Print Studio</span>
              <span className="text-[11px] font-mono font-normal bg-white/20 px-2 py-0.5 rounded text-white">
                A4 ISO CR-80 (85.6 × 54mm)
              </span>
            </h3>
            <p className="text-xs text-rose-100 mt-0.5">
              Official Children&apos;s Wing ID Cards aligned in a 2-column A4 sheet for PVC cards, badges, and laminates
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
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  printSide === 'front'
                    ? 'bg-[#7f1d1d] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Front Only
              </button>
              <button
                type="button"
                onClick={() => setPrintSide('back')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  printSide === 'back'
                    ? 'bg-[#7f1d1d] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Back Only
              </button>
              <button
                type="button"
                onClick={() => setPrintSide('both')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  printSide === 'both'
                    ? 'bg-[#7f1d1d] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
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

            {/* Batch Title Header Style Selector */}
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-300 text-xs">
              <Type className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">Title:</span>
              <select
                value={batchTitleStyle}
                onChange={(e) => setBatchTitleStyle(e.target.value as any)}
                className="font-bold text-slate-800 outline-none bg-transparent cursor-pointer"
                title="Override title header style for all student cards or use portal default"
              >
                <option value="portal_default">System Default Title</option>
                <option value="official_lockup">Official KCA Title</option>
                <option value="title_graphic">Title Graphic Image</option>
                <option value="standard">Standard Org Text</option>
              </select>
            </div>

            {/* Crop marks toggle */}
            <label className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-md border border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer shadow-xs">
              <input
                type="checkbox"
                checked={showCropMarks}
                onChange={(e) => setShowCropMarks(e.target.checked)}
                className="rounded text-[#7f1d1d] focus:ring-0"
              />
              <Scissors className="w-3.5 h-3.5 text-slate-500" />
              <span>Cutting Guides</span>
            </label>
          </div>

          {/* Right: Selection count */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="inline-flex items-center gap-1.5 font-bold text-slate-800 hover:text-[#7f1d1d] cursor-pointer"
            >
              {selectedIds.length === students.length ? (
                <CheckSquare className="w-4 h-4 text-[#7f1d1d]" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {selectedIds.length === students.length ? 'Deselect All' : 'Select All'} ({selectedIds.length}/{students.length})
              </span>
            </button>
            <div className="h-4 w-px bg-slate-300"></div>
            <div className="text-slate-600 font-medium">
              Total: <span className="font-bold text-[#7f1d1d]">{batchItems.length}</span> cards ({totalPages} A4 {totalPages === 1 ? 'Sheet' : 'Sheets'})
            </div>
          </div>
        </div>

        {/* Print Layout Sheet Preview */}
        <div className="p-4 sm:p-6 bg-slate-200/90 overflow-y-auto flex-1 flex justify-center">
          {batchItems.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-slate-500 text-center max-w-md my-auto border border-slate-300 shadow-sm">
              <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-sm">No Children&apos;s Wing Members Selected</h4>
              <p className="text-xs text-slate-500 mt-1">
                Please select at least one Children&apos;s Wing member to preview and batch print ID cards.
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
                        <span className="px-2.5 py-1 bg-[#7f1d1d] text-white font-mono font-bold text-xs rounded">
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
                          key={`${item.id}-${brandRevisionKey}`}
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
                              onClick={() => toggleSelectStudent(item.student.id)}
                              className="p-1 bg-white/95 rounded-md shadow-md hover:bg-white text-[#7f1d1d] border border-slate-200 cursor-pointer"
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
                            <StudentIdCard
                              key={`${item.id}-${brandRevisionKey}`}
                              student={item.student}
                              side={item.side}
                              titleStyle={batchTitleStyle === 'portal_default' ? undefined : batchTitleStyle}
                              idPrefix={item.domKey}
                              showShadow={false}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Sheet Footer Note */}
                    <div className="no-print text-center text-[11px] text-slate-400 border-t border-slate-100 pt-3 mt-6">
                      Children&apos;s Wing • Print at 100% scale (Actual size) for exact CR-80 PVC card punch
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
              title="Download crystal-clear A4 Batch PDF with Children's Wing ID Cards"
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
              style={{ backgroundColor: theme.primary }}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-md text-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
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
