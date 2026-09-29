import React, { useState, useMemo } from 'react';
import {
  GeneralDocument,
  DocumentCategory,
  DOCUMENT_CATEGORIES,
  DocumentAccessLevel,
} from '../types/document';
import { UserSession, hasAdminPrivilege } from '../types/member';
import {
  formatFileSize,
  downloadDocumentFile,
  exportDocumentsCsv,
} from '../utils/documentStorage';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  Folder,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  Search,
  Plus,
  Download,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Building2,
  Lock,
  Layers,
  LayoutGrid,
  List,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Tag,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';

interface DocumentsViewProps {
  documents: GeneralDocument[];
  units: string[];
  userSession: UserSession;
  onOpenUploadModal: () => void;
  onOpenEditModal: (doc: GeneralDocument) => void;
  onDeleteDocument: (id: string) => void;
  onPreviewDocument: (doc: GeneralDocument) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  units,
  userSession,
  onOpenUploadModal,
  onOpenEditModal,
  onDeleteDocument,
  onPreviewDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedUnit, setSelectedUnit] = useState<string>('All');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<string>('All');
  const [selectedFileType, setSelectedFileType] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'folders'>('grid');
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const [docToDelete, setDocToDelete] = useState<GeneralDocument | null>(null);

  const isAdmin = hasAdminPrivilege(userSession.role);

  // Dynamic list of unique categories from documents + default categories
  const allCategories = useMemo(() => {
    const set = new Set<string>(DOCUMENT_CATEGORIES);
    documents.forEach((d) => {
      if (d.category) set.add(d.category);
    });
    return Array.from(set);
  }, [documents]);

  // Statistics
  const stats = useMemo(() => {
    const totalDocs = documents.length;
    const totalBytes = documents.reduce((acc, d) => acc + (d.fileSize || 0), 0);
    const expiringCount = documents.filter((d) => {
      if (!d.expiryDate) return false;
      const expiry = new Date(d.expiryDate).getTime();
      const now = new Date().getTime();
      const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 60;
    }).length;

    const categoryCounts: Record<string, number> = {};
    documents.forEach((d) => {
      categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
    });

    return {
      totalDocs,
      totalBytes,
      expiringCount,
      categoryCounts,
    };
  }, [documents]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (doc.title || '').toLowerCase().includes(q);
        const matchRef = (doc.referenceCode || '').toLowerCase().includes(q);
        const matchDesc = (doc.description || '').toLowerCase().includes(q);
        const matchFile = (doc.fileName || '').toLowerCase().includes(q);
        const matchTags = (doc.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchRef && !matchDesc && !matchFile && !matchTags) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'All' && doc.category !== selectedCategory) {
        return false;
      }

      // 3. Unit Filter
      if (selectedUnit !== 'All' && doc.unit !== selectedUnit) {
        return false;
      }

      // 4. Access Level Filter
      if (selectedAccessLevel !== 'All' && doc.accessLevel !== selectedAccessLevel) {
        return false;
      }

      // 5. File Type Filter
      if (selectedFileType !== 'All' && doc.fileType !== selectedFileType) {
        return false;
      }

      // 6. Expiring filter
      if (showExpiringOnly) {
        if (!doc.expiryDate) return false;
        const expiry = new Date(doc.expiryDate).getTime();
        const now = new Date().getTime();
        const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
        if (diffDays < 0 || diffDays > 60) return false;
      }

      return true;
    });
  }, [
    documents,
    searchQuery,
    selectedCategory,
    selectedUnit,
    selectedAccessLevel,
    selectedFileType,
    showExpiringOnly,
  ]);

  const renderFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-500" />;
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-purple-500" />;
      case 'archive':
        return <FileArchive className="w-5 h-5 text-amber-500" />;
      default:
        return <FileText className="w-5 h-5 text-blue-500" />;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Legal & Governance':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
      case 'Government & NORKA':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
      case 'Minutes & Resolutions':
        return 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60';
      case 'Financial & Audit':
        return 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60';
      case 'Events & Programs':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
      case 'Circulars & Notices':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
      case 'Forms & Templates':
        return 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800/60';
      case 'Unit Administration':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
              style={{ backgroundColor: 'var(--color-primary, #881337)' }}
            >
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  General Documents Store
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  Categorized Vault
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official repository for bylaws, NORKA approvals, MoUs, minutes, reports, and administrative files.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => exportDocumentsCsv(filteredDocuments)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onOpenUploadModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-95 transition-all cursor-pointer"
              style={{ backgroundColor: 'var(--color-primary, #881337)' }}
            >
              <Plus className="w-4 h-4" />
              <span>+ Upload Document</span>
            </button>
          </div>
        </div>

        {/* 2. Key Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Documents
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                {stats.totalDocs}
              </span>
              <span className="text-[11px] text-slate-500">Records</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Categories
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                {allCategories.length}
              </span>
              <span className="text-[11px] text-slate-500">Folders</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Archive Size
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                {formatFileSize(stats.totalBytes)}
              </span>
              <span className="text-[11px] text-slate-500">Stored</span>
            </div>
          </div>

          <div
            onClick={() => setShowExpiringOnly(!showExpiringOnly)}
            className={`p-3 rounded-xl border transition-colors cursor-pointer ${
              showExpiringOnly
                ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Action / Renewals
              </span>
              {stats.expiringCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-lg font-black font-mono ${stats.expiringCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                {stats.expiringCount}
              </span>
              <span className="text-[11px] text-slate-500">Expiring</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Category Carousel & Filter Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5" />
            <span>Store Categories</span>
          </h3>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              Reset Category Filter
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
              selectedCategory === 'All'
                ? 'text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            style={selectedCategory === 'All' ? { backgroundColor: 'var(--color-primary, #881337)' } : undefined}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>All Categories</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === 'All' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              {documents.length}
            </span>
          </button>

          {allCategories.map((cat) => {
            const count = stats.categoryCounts[cat] || 0;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                style={isSelected ? { backgroundColor: 'var(--color-primary, #881337)' } : undefined}
              >
                <Folder className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Search & Multi-Filter Control Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by title, reference code, tags, or file name..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Unit, Access Level & Format Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="All">All Units</option>
              <option value="Central">Central</option>
              {units.map((u) => (
                <option key={u} value={u}>
                  {u} Unit
                </option>
              ))}
            </select>

            <select
              value={selectedAccessLevel}
              onChange={(e) => setSelectedAccessLevel(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="All">All Access</option>
              <option value="General / All Members">General</option>
              <option value="Executive Committee">Executive</option>
              <option value="Confidential / Admin Only">Confidential</option>
            </select>

            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="All">All File Types</option>
              <option value="pdf">PDF Documents</option>
              <option value="excel">Spreadsheets</option>
              <option value="word">Word Documents</option>
              <option value="image">Images</option>
              <option value="archive">Archives (ZIP)</option>
            </select>

            {/* View Switcher */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                title="Grid View"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('folders')}
                title="Folder Explorer"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'folders'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Folder className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <span>
            Showing <strong className="text-slate-900 dark:text-white">{filteredDocuments.length}</strong> of{' '}
            {documents.length} archived documents
          </span>
          {(selectedCategory !== 'All' || selectedUnit !== 'All' || selectedAccessLevel !== 'All' || selectedFileType !== 'All' || showExpiringOnly) && (
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedUnit('All');
                setSelectedAccessLevel('All');
                setSelectedFileType('All');
                setShowExpiringOnly(false);
                setSearchQuery('');
              }}
              className="text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* 5. Document List Rendering */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No documents found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'All'
              ? 'No documents match your active search or category filters. Try resetting the criteria.'
              : 'The general documents repository is currently empty. Upload your first official document now.'}
          </p>
          <button
            onClick={onOpenUploadModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-95 cursor-pointer"
            style={{ backgroundColor: 'var(--color-primary, #881337)' }}
          >
            <Plus className="w-4 h-4" />
            <span>+ Upload Document</span>
          </button>
        </div>
      ) : viewMode === 'folders' ? (
        /* Folder Explorer Mode */
        <div className="space-y-6">
          {allCategories
            .filter((cat) => (selectedCategory === 'All' ? true : selectedCategory === cat))
            .map((cat) => {
              const catDocs = filteredDocuments.filter((d) => d.category === cat);
              if (catDocs.length === 0) return null;
              const catBytes = catDocs.reduce((acc, d) => acc + (d.fileSize || 0), 0);
              return (
                <div
                  key={cat}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{cat}</h3>
                        <p className="text-[11px] text-slate-500">
                          {catDocs.length} documents • {formatFileSize(catBytes)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {catDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs transition-all flex flex-col justify-between group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {renderFileIcon(doc.fileType)}
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {doc.referenceCode}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {doc.unit}
                            </span>
                          </div>

                          <h4
                            onClick={() => onPreviewDocument(doc)}
                            className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2 cursor-pointer"
                          >
                            {doc.title}
                          </h4>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                            {doc.description || doc.fileName}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500">
                          <span>{doc.documentDate}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onPreviewDocument(doc)}
                              className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer"
                              title="Preview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => downloadDocumentFile(doc)}
                              className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid / Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const isExpiring = doc.expiryDate && new Date(doc.expiryDate).getTime() < new Date().getTime() + 60 * 86400000;
            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Top Bar: Reference & Category Pill */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {renderFileIcon(doc.fileType)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 block truncate">
                          {doc.referenceCode}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatFileSize(doc.fileSize)} • {doc.version || 'v1.0'}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${getCategoryColor(doc.category)}`}>
                      {doc.category}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3
                      onClick={() => onPreviewDocument(doc)}
                      className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2 cursor-pointer"
                    >
                      {doc.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {doc.description || 'Official KCA Fujairah archived document record.'}
                    </p>
                  </div>

                  {/* Metadata Badges */}
                  <div className="flex items-center gap-2 flex-wrap text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{doc.unit}</span>
                    </span>

                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{doc.documentDate}</span>
                    </span>

                    {doc.expiryDate && (
                      <span className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 ${
                        isExpiring
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>Exp: {doc.expiryDate}</span>
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400"
                        >
                          #{tag}
                        </span>
                      ))}
                      {doc.tags.length > 3 && (
                        <span className="text-[9px] text-slate-400">+{doc.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    By {doc.uploadedBy || 'Admin'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onPreviewDocument(doc)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[10px]">Preview</span>
                    </button>

                    <button
                      onClick={() => downloadDocumentFile(doc)}
                      className="p-1.5 rounded-lg text-white text-xs font-semibold transition-all shadow-2xs hover:opacity-90 cursor-pointer flex items-center gap-1"
                      style={{ backgroundColor: 'var(--color-primary, #881337)' }}
                      title="Download File"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => onOpenEditModal(doc)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Metadata"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => setDocToDelete(doc)}
                        className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table / Ledger View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Document Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Doc Date</th>
                  <th className="py-3 px-4">Access Level</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 min-w-[240px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          {renderFileIcon(doc.fileType)}
                        </div>
                        <div className="min-w-0">
                          <p
                            onClick={() => onPreviewDocument(doc)}
                            className="font-bold text-slate-900 dark:text-white hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer truncate max-w-xs"
                          >
                            {doc.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span>{doc.referenceCode}</span>
                            <span>•</span>
                            <span>{doc.fileName}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${getCategoryColor(doc.category)}`}>
                        {doc.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {doc.unit}
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                      {doc.documentDate}
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {doc.accessLevel}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {formatFileSize(doc.fileSize)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onPreviewDocument(doc)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadDocumentFile(doc)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => onOpenEditModal(doc)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => setDocToDelete(doc)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Delete Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Document Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!docToDelete}
        title="Delete General Document"
        itemName={docToDelete?.title}
        message={`Are you sure you want to permanently delete "${docToDelete?.title}" (${docToDelete?.referenceCode})? This document file will be permanently removed from the system.`}
        confirmLabel="Delete Document"
        onConfirm={() => {
          if (docToDelete) {
            onDeleteDocument(docToDelete.id);
            setDocToDelete(null);
          }
        }}
        onClose={() => setDocToDelete(null)}
      />
    </div>
  );
};
