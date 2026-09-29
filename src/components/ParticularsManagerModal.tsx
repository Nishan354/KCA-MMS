import React, { useState, useMemo, useEffect } from 'react';
import { FinancialParticular, TransactionType } from '../types/finance';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  FolderTree,
  Tag,
  ArrowRight,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  CornerDownRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface ParticularsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  particulars: FinancialParticular[];
  onSaveParticulars: (particulars: FinancialParticular[]) => void;
}

export const ParticularsManagerModal: React.FC<ParticularsManagerModalProps> = ({
  isOpen,
  onClose,
  particulars,
  onSaveParticulars,
}) => {
  const [activeType, setActiveType] = useState<TransactionType>('INCOME');
  const [searchTerm, setSearchTerm] = useState('');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Form state for creating / editing
  const [editingItem, setEditingItem] = useState<FinancialParticular | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [isSubParticular, setIsSubParticular] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; childCount: number } | null>(null);

  // Main particulars of current active type (for parent dropdown)
  const mainParticulars = useMemo(() => {
    return particulars.filter((p) => p.type === activeType && !p.parentId);
  }, [particulars, activeType]);

  // Hierarchical display list
  const structuredList = useMemo(() => {
    return mainParticulars.map((main) => {
      const subs = particulars.filter((p) => p.parentId === main.id);
      return { main, subs };
    }).filter(({ main, subs }) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const matchMain =
        main.name.toLowerCase().includes(term) ||
        main.code?.toLowerCase().includes(term) ||
        main.description?.toLowerCase().includes(term);
      const matchSub = subs.some(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.code?.toLowerCase().includes(term)
      );
      return matchMain || matchSub;
    });
  }, [mainParticulars, particulars, searchTerm]);

  if (!isOpen) return null;

  const handleOpenAdd = (defaultParentId?: string) => {
    setEditingItem(null);
    setName('');
    setCode('');
    setDescription('');
    if (defaultParentId) {
      setIsSubParticular(true);
      setSelectedParentId(defaultParentId);
    } else {
      setIsSubParticular(false);
      setSelectedParentId('');
    }
    setFormError(null);
  };

  const handleOpenEdit = (item: FinancialParticular) => {
    setEditingItem(item);
    setName(item.name);
    setCode(item.code || '');
    setDescription(item.description || '');
    if (item.parentId) {
      setIsSubParticular(true);
      setSelectedParentId(item.parentId);
    } else {
      setIsSubParticular(false);
      setSelectedParentId('');
    }
    setFormError(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Particular name is required.');
      return;
    }

    if (isSubParticular && !selectedParentId) {
      setFormError('Please select a Main Particular parent for this Sub Particular.');
      return;
    }

    let updated = [...particulars];

    if (editingItem) {
      // Edit existing
      updated = updated.map((p) => {
        if (p.id === editingItem.id) {
          return {
            ...p,
            name: name.trim(),
            code: code.trim() || undefined,
            description: description.trim() || undefined,
            parentId: isSubParticular ? selectedParentId : null,
          };
        }
        return p;
      });
    } else {
      // Create new
      const newId = `part_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const newItem: FinancialParticular = {
        id: newId,
        name: name.trim(),
        type: activeType,
        parentId: isSubParticular ? selectedParentId : null,
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      updated.push(newItem);
    }

    onSaveParticulars(updated);
    // Reset form
    setEditingItem(null);
    setName('');
    setCode('');
    setDescription('');
    setFormError(null);
  };

  const handleDelete = (id: string, itemName: string) => {
    // Check if it's a parent with children
    const children = particulars.filter((p) => p.parentId === id);
    setItemToDelete({ id, name: itemName, childCount: children.length });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-4 max-h-[92vh]"
      >
        {/* Top Header */}
        <div className="p-4 bg-[#881337] text-white flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 p-1 flex items-center justify-center">
              <FolderTree className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base tracking-tight leading-tight">
                Master Financial Particulars Creator
              </h2>
              <p className="text-[11px] text-rose-100 font-medium">
                Configure Main Particulars &amp; Parent-Child Sub Particular Hierarchies
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
            title="Close modal (Esc)"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Controls: Type Tabs & Search */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Income vs Expense Toggle */}
          <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setActiveType('INCOME');
                handleOpenAdd();
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeType === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Income Heads ({particulars.filter((p) => p.type === 'INCOME').length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveType('EXPENSE');
                handleOpenAdd();
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeType === 'EXPENSE'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Expense Heads ({particulars.filter((p) => p.type === 'EXPENSE').length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search particulars..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#881337] outline-none"
            />
          </div>
        </div>

        {/* Main Body Grid: Form on Left/Top, Tree List on Right/Bottom */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 overflow-y-auto flex-1">
          {/* Form Pane */}
          <div className="md:col-span-5 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs h-fit space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                {editingItem ? 'Edit Particular' : 'Create New Particular'}
              </span>
              {editingItem && (
                <button
                  type="button"
                  onClick={() => handleOpenAdd()}
                  className="text-[11px] text-rose-600 font-bold hover:underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-800 dark:text-rose-200 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              {/* Hierarchy Radio: Main vs Sub */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Particular Level:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 cursor-pointer">
                    <input
                      type="radio"
                      name="level"
                      checked={!isSubParticular}
                      onChange={() => {
                        setIsSubParticular(false);
                        setSelectedParentId('');
                      }}
                      className="text-[#881337] focus:ring-[#881337]"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Main Particular</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 cursor-pointer">
                    <input
                      type="radio"
                      name="level"
                      checked={isSubParticular}
                      onChange={() => {
                        setIsSubParticular(true);
                        if (!selectedParentId && mainParticulars[0]) {
                          setSelectedParentId(mainParticulars[0].id);
                        }
                      }}
                      className="text-[#881337] focus:ring-[#881337]"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Sub Particular</span>
                  </label>
                </div>
              </div>

              {/* Parent dropdown if Sub Particular */}
              {isSubParticular && (
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Link under Main Particular Parent *
                  </label>
                  <select
                    value={selectedParentId}
                    onChange={(e) => setSelectedParentId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 font-bold"
                  >
                    <option value="">Select Main Parent...</option>
                    {mainParticulars.map((mp) => (
                      <option key={mp.id} value={mp.id}>
                        {mp.name} {mp.code ? `(${mp.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Particular Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    isSubParticular
                      ? 'e.g. Title Event Sponsor or Auditorium Setup'
                      : 'e.g. Sponsorship & Donations or Event Production'
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 font-semibold"
                />
              </div>

              {/* Code */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Ledger Code (Optional)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. INC-SPON-01 or EXP-EVT-04"
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 font-mono"
                />
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Accounting notes or guidelines for this ledger entry..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 rounded-lg bg-[#881337] hover:bg-[#700f2b] text-white font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{editingItem ? 'Update Particular' : 'Save Particular'}</span>
              </button>
            </form>
          </div>

          {/* Tree View Pane */}
          <div className="md:col-span-7 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                {activeType} Particulars Tree ({structuredList.length} Groups)
              </span>
              <button
                onClick={() => handleOpenAdd()}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>New Main Head</span>
              </button>
            </div>

            {structuredList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                No particulars matching your search query.
              </div>
            ) : (
              <div className="space-y-3">
                {structuredList.map(({ main, subs }) => (
                  <div
                    key={main.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/30"
                  >
                    {/* Main Particular Row */}
                    <div className="p-3 bg-white dark:bg-slate-800 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            activeType === 'INCOME' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{main.name}</span>
                            {main.code && (
                              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded">
                                {main.code}
                              </span>
                            )}
                          </div>
                          {main.description && (
                            <div className="text-[10px] text-slate-500 line-clamp-1">
                              {main.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenAdd(main.id)}
                          className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[10px] font-bold inline-flex items-center gap-0.5"
                          title="Add Sub-Particular under this main category"
                        >
                          <Plus className="w-3 h-3" />
                          <span className="hidden sm:inline">Add Sub</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(main)}
                          className="p-1 rounded text-slate-500 hover:text-[#881337] dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                          title="Edit Main Particular"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(main.id, main.name)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete Main Particular and its subs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Sub Particulars List */}
                    {subs.length > 0 ? (
                      <div className="p-2 space-y-1.5 pl-6">
                        {subs.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs"
                          >
                            <div className="flex items-center gap-1.5">
                              <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {sub.name}
                              </span>
                              {sub.code && (
                                <span className="text-[9px] font-mono text-slate-400">
                                  ({sub.code})
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(sub)}
                                className="p-1 rounded text-slate-400 hover:text-[#881337] dark:hover:text-rose-400"
                                title="Edit Sub-Particular"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(sub.id, sub.name)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600"
                                title="Delete Sub-Particular"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 text-[11px] text-slate-400 italic pl-6">
                        No sub-particulars linked yet.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Particular Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        title="Delete Particular"
        itemName={itemToDelete?.name}
        message={
          itemToDelete?.childCount && itemToDelete.childCount > 0
            ? `Are you sure you want to delete "${itemToDelete?.name}"? WARNING: This will also delete its ${itemToDelete.childCount} nested Sub Particulars!`
            : `Are you sure you want to permanently delete "${itemToDelete?.name}"?`
        }
        confirmLabel="Delete Particular"
        onConfirm={() => {
          if (itemToDelete) {
            const updated = particulars.filter((p) => p.id !== itemToDelete.id && p.parentId !== itemToDelete.id);
            onSaveParticulars(updated);
            setItemToDelete(null);
          }
        }}
        onClose={() => setItemToDelete(null)}
      />
    </div>
  );
};
