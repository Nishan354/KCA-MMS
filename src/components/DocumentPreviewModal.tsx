import React, { useState } from 'react';
import { GeneralDocument } from '../types/document';
import { formatFileSize, downloadDocumentFile } from '../utils/documentStorage';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  X,
  Download,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  Calendar,
  Building2,
  Lock,
  Tag,
  Hash,
  Clock,
  UserCheck,
  FolderOpen,
  Edit,
  Trash2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: GeneralDocument | null;
  onEdit?: (doc: GeneralDocument) => void;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  onEdit,
  onDelete,
  canEdit = true,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  if (!isOpen || !doc) return null;

  const isExpiringSoon = () => {
    if (!doc.expiryDate) return false;
    const expiry = new Date(doc.expiryDate).getTime();
    const now = new Date().getTime();
    const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 60;
  };

  const isExpired = () => {
    if (!doc.expiryDate) return false;
    return new Date(doc.expiryDate).getTime() < new Date().getTime();
  };

  const renderFileIcon = () => {
    switch (doc.fileType) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-rose-600 dark:text-rose-400" />;
      case 'excel':
        return <FileSpreadsheet className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />;
      case 'image':
        return <ImageIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />;
      case 'archive':
        return <FileArchive className="w-8 h-8 text-amber-600 dark:text-amber-400" />;
      default:
        return <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-6">
        {/* Modal Header */}
        <div
          className="px-6 py-4 flex items-center justify-between text-white"
          style={{ backgroundColor: 'var(--color-primary, #881337)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {doc.referenceCode}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30">
                  {doc.category}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-white truncate max-w-md sm:max-w-xl mt-1">
                {doc.title}
              </h2>
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
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Expiry Warning Banner */}
          {isExpired() && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
              <div>
                <p className="font-bold">Document Validity Expired</p>
                <p className="text-[11px] opacity-90">Expired on {doc.expiryDate}. Please renew or archive the updated revision.</p>
              </div>
            </div>
          )}

          {isExpiringSoon() && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
              <Clock className="w-5 h-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-bold">Expiring Soon</p>
                <p className="text-[11px] opacity-90">This document validity expires on {doc.expiryDate}.</p>
              </div>
            </div>
          )}

          {/* File Card & Actions */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
                {renderFileIcon()}
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  {doc.fileName}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  <span>{formatFileSize(doc.fileSize)}</span>
                  <span>•</span>
                  <span className="uppercase font-mono font-semibold">{doc.fileType}</span>
                  <span>•</span>
                  <span>Version {doc.version || 'v1.0'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={() => downloadDocumentFile(doc)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer"
                style={{ backgroundColor: 'var(--color-primary, #881337)' }}
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </button>
            </div>
          </div>

          {/* Inline Image Preview if available */}
          {doc.fileType === 'image' && doc.fileDataUrl && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-2 max-h-72">
              <img src={doc.fileDataUrl} alt={doc.title} className="max-h-64 object-contain rounded-lg shadow-xs" />
            </div>
          )}

          {/* Description & Summary */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Description &amp; Summary
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {doc.description || 'No detailed description provided for this archived record.'}
            </div>
          </div>

          {/* Metadata Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Archive Metadata &amp; Governance
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1 text-[10px] font-bold uppercase">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Unit Jurisdiction</span>
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200">{doc.unit} Unit</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1 text-[10px] font-bold uppercase">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Document Date</span>
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200">{doc.documentDate}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1 text-[10px] font-bold uppercase">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Access Level</span>
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200">{doc.accessLevel}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1 text-[10px] font-bold uppercase">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Expiry / Renewal</span>
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {doc.expiryDate ? doc.expiryDate : 'Perpetual / N/A'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1 text-[10px] font-bold uppercase">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Archived By</span>
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200">{doc.uploadedBy || 'Executive Secretariat'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1 text-[10px] font-bold uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Status</span>
                </div>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">Verified &amp; Archived</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {doc.tags && doc.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                <span>Search Keywords &amp; Tags</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {doc.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {canEdit && onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(doc);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>
            )}

            {canEdit && onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        title="Delete General Document"
        itemName={doc.title}
        message={`Are you sure you want to permanently delete "${doc.title}" (${doc.referenceCode})? This document file will be permanently removed from the system.`}
        confirmLabel="Delete Document"
        onConfirm={() => {
          if (onDelete) {
            onDelete(doc.id);
            setShowDeleteConfirm(false);
            onClose();
          }
        }}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
