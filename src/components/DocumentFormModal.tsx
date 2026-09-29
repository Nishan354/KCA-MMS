import React, { useState, useEffect } from 'react';
import {
  GeneralDocument,
  DocumentCategory,
  DOCUMENT_CATEGORIES,
  DocumentAccessLevel,
} from '../types/document';
import { UserSession } from '../types/member';
import {
  formatFileSize,
  generateNextDocumentReference,
} from '../utils/documentStorage';
import {
  X,
  Upload,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  FolderOpen,
  Calendar,
  Lock,
  Tag,
  Hash,
  Building2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface DocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (doc: GeneralDocument) => void;
  editingDocument?: GeneralDocument | null;
  existingDocuments?: GeneralDocument[];
  units: string[];
  userSession: UserSession;
}

export const DocumentFormModal: React.FC<DocumentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingDocument,
  existingDocuments = [],
  units,
  userSession,
}) => {
  const [title, setTitle] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [category, setCategory] = useState<string>(DOCUMENT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('Central');
  const [documentDate, setDocumentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [accessLevel, setAccessLevel] = useState<DocumentAccessLevel>('General / All Members');
  const [tagsInput, setTagsInput] = useState('');
  const [version, setVersion] = useState('v1.0');
  
  // File upload state
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<GeneralDocument['fileType']>('pdf');
  const [mimeType, setMimeType] = useState('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileDataUrl, setFileDataUrl] = useState<string | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingDocument) {
        setTitle(editingDocument.title);
        setReferenceCode(editingDocument.referenceCode);
        if (DOCUMENT_CATEGORIES.includes(editingDocument.category as DocumentCategory)) {
          setCategory(editingDocument.category);
          setIsCustomCategory(false);
          setCustomCategory('');
        } else {
          setCategory('Other');
          setIsCustomCategory(true);
          setCustomCategory(editingDocument.category);
        }
        setDescription(editingDocument.description || '');
        setUnit(editingDocument.unit || 'Central');
        setDocumentDate(editingDocument.documentDate || new Date().toISOString().split('T')[0]);
        setExpiryDate(editingDocument.expiryDate || '');
        setAccessLevel(editingDocument.accessLevel || 'General / All Members');
        setTagsInput((editingDocument.tags || []).join(', '));
        setVersion(editingDocument.version || 'v1.0');
        setFileName(editingDocument.fileName || '');
        setFileType(editingDocument.fileType || 'pdf');
        setMimeType(editingDocument.mimeType || '');
        setFileSize(editingDocument.fileSize || 0);
        setFileDataUrl(editingDocument.fileDataUrl);
        setErrorMsg('');
      } else {
        // Automatically generate unique sequential reference code based on active unit
        const targetUnit = userSession.unit && userSession.unit !== 'All' ? userSession.unit : 'Central';
        const nextRef = generateNextDocumentReference(targetUnit, existingDocuments);
        setTitle('');
        setReferenceCode(nextRef);
        setCategory(DOCUMENT_CATEGORIES[0]);
        setIsCustomCategory(false);
        setCustomCategory('');
        setDescription('');
        setUnit(targetUnit);
        setDocumentDate(new Date().toISOString().split('T')[0]);
        setExpiryDate('');
        setAccessLevel('General / All Members');
        setTagsInput('');
        setVersion('v1.0');
        setFileName('');
        setFileType('pdf');
        setMimeType('');
        setFileSize(0);
        setFileDataUrl(undefined);
        setErrorMsg('');
      }
    }
  }, [isOpen, editingDocument, userSession, existingDocuments]);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    setErrorMsg('');
    setFileName(file.name);
    setFileSize(file.size);
    setMimeType(file.type);

    // Auto-detect file type
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') {
      setFileType('pdf');
    } else if (['doc', 'docx', 'odt'].includes(ext)) {
      setFileType('word');
    } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
      setFileType('excel');
    } else if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext)) {
      setFileType('image');
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      setFileType('archive');
    } else if (['txt', 'rtf', 'md'].includes(ext)) {
      setFileType('text');
    } else {
      setFileType('other');
    }

    // Auto fill title if empty
    if (!title) {
      const cleanTitle = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      setTitle(cleanTitle);
    }

    // Read as Base64 Data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileDataUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setErrorMsg('');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Document title is required.');
      return;
    }
    if (!fileName.trim()) {
      setErrorMsg('Please upload a file or attach document name.');
      return;
    }

    const finalCategory = isCustomCategory && customCategory.trim() ? customCategory.trim() : category;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
      .filter(Boolean);

    const doc: GeneralDocument = {
      id: editingDocument ? editingDocument.id : `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      referenceCode: referenceCode.trim() || `DOC-KCA-${Date.now()}`,
      category: finalCategory,
      description: description.trim(),
      fileName: fileName.trim(),
      fileType,
      mimeType: mimeType || 'application/octet-stream',
      fileSize: fileSize || 1024,
      fileDataUrl,
      unit,
      documentDate,
      expiryDate: expiryDate || undefined,
      accessLevel,
      tags: parsedTags,
      version: version.trim() || 'v1.0',
      uploadedBy: editingDocument?.uploadedBy || userSession.username || userSession.role,
      createdAt: editingDocument?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(doc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div
          className="px-6 py-4 flex items-center justify-between text-white"
          style={{ backgroundColor: 'var(--color-primary, #881337)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {editingDocument ? 'Edit Archived Document' : 'Upload Document to Store'}
              </h2>
              <p className="text-xs text-white/80">
                General documents repository &amp; categorized archives
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* File Upload Drop Zone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Document File Upload <span className="text-rose-500">*</span>
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                  : fileName
                  ? 'border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/20'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/60'
              }`}
            >
              {fileName ? (
                <div className="flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      {fileType === 'pdf' ? (
                        <FileText className="w-5 h-5" />
                      ) : fileType === 'excel' ? (
                        <FileSpreadsheet className="w-5 h-5" />
                      ) : fileType === 'image' ? (
                        <ImageIcon className="w-5 h-5" />
                      ) : fileType === 'archive' ? (
                        <FileArchive className="w-5 h-5" />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{fileName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatFileSize(fileSize)} • {fileType.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <label className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer shrink-0">
                    Replace File
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileInputChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.zip,.rar,.txt"
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-rose-700 dark:text-rose-400 hover:underline cursor-pointer">
                      Click to choose a file
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileInputChange}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.zip,.rar,.txt"
                      />
                    </label>
                    <span className="text-xs text-slate-500 dark:text-slate-400"> or drag and drop here</span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Supports PDF, Word (.docx), Excel (.xlsx), Images (PNG/JPG), ZIP, and Text (No upload limit)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Document Title & Reference Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Document Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. NORKA Roots Affiliation Approval Certificate"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span>Reference ID</span>
              </label>
              <input
                type="text"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                placeholder="DOC-KCA-2026-001"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Category</span>
              </label>
              {!isCustomCategory ? (
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomCategory(true);
                      setCustomCategory('');
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer"
                >
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__custom__">+ Add Custom Category...</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category name"
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(false);
                      setCategory(DOCUMENT_CATEGORIES[0]);
                    }}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Unit / Jurisdiction</span>
              </label>
              <select
                value={unit}
                onChange={(e) => {
                  const newUnit = e.target.value;
                  setUnit(newUnit);
                  if (!editingDocument) {
                    const nextRef = generateNextDocumentReference(newUnit, existingDocuments);
                    setReferenceCode(nextRef);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer"
              >
                <option value="Central">Central / All Units</option>
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u} Unit
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates & Access Level */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Document Date</span>
              </label>
              <input
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Expiry / Renewal Date <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Access Level</span>
              </label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as DocumentAccessLevel)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer"
              >
                <option value="General / All Members">General / All Members</option>
                <option value="Executive Committee">Executive Committee</option>
                <option value="Confidential / Admin Only">Confidential / Admin Only</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Description &amp; Summary Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of document content, purpose, signatories or approval body..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          {/* Tags & Version */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Keywords / Tags</span> <span className="text-slate-400 font-normal text-[10px]">(Comma-separated)</span>
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="norka, affiliation, bylaws, 2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Version / Revision
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v1.0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-95 transition-all cursor-pointer flex items-center gap-2"
              style={{ backgroundColor: 'var(--color-primary, #881337)' }}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingDocument ? 'Save Changes' : 'Archive Document'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
