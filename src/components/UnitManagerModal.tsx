import React, { useState } from 'react';
import { Member } from '../types/member';
import {
  X,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Check,
  Users,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface UnitManagerModalProps {
  isOpen: boolean;
  units: string[];
  members: Member[];
  onClose: () => void;
  onAddUnit: (newUnit: string) => void;
  onRenameUnit: (oldUnit: string, newUnit: string) => void;
  onDeleteUnit: (unitToDelete: string) => void;
}

export const UnitManagerModal: React.FC<UnitManagerModalProps> = ({
  isOpen,
  units,
  members,
  onClose,
  onAddUnit,
  onRenameUnit,
  onDeleteUnit,
}) => {
  const [newUnitName, setNewUnitName] = useState('');
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Calculate member count for each unit
  const unitStats = units.map((u) => {
    const count = members.filter((m) => m.unit.toLowerCase() === u.toLowerCase()).length;
    return { name: u, count };
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const trimmed = newUnitName.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a valid unit name.');
      return;
    }
    if (units.some((u) => u.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMessage(`Unit "${trimmed}" already exists.`);
      return;
    }
    onAddUnit(trimmed);
    setNewUnitName('');
  };

  const handleStartEdit = (unit: string) => {
    setEditingUnit(unit);
    setEditedName(unit);
    setErrorMessage('');
  };

  const handleSaveEdit = (oldUnit: string) => {
    setErrorMessage('');
    const trimmed = editedName.trim();
    if (!trimmed) {
      setErrorMessage('Unit name cannot be blank.');
      return;
    }
    if (trimmed.toLowerCase() !== oldUnit.toLowerCase() && units.some((u) => u.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMessage(`Unit "${trimmed}" already exists.`);
      return;
    }
    onRenameUnit(oldUnit, trimmed);
    setEditingUnit(null);
    setEditedName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-[#8b0000] text-white flex items-center justify-between border-b border-[#730000]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white border border-white/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Manage KCA Fujairah Units & Areas
              </h3>
              <p className="text-xs text-red-100">
                Add, rename, and organize membership units across Fujairah & East Coast
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          {/* Add New Unit Input Form */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#8b0000]" />
              Add New Fujairah Unit
            </h4>

            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                type="text"
                value={newUnitName}
                onChange={(e) => {
                  setNewUnitName(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="e.g. Al Bithnah, Masafi, Al Faseel, Khorfakkan North..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#8b0000] outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8b0000] hover:bg-[#730000] text-white text-xs font-semibold rounded-md shadow-xs transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Unit
              </button>
            </form>

            {errorMessage && (
              <div className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Existing Units List with Member Counts */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">
                Configured Units ({units.length})
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                Renaming a unit will automatically update all assigned members
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {unitStats.map(({ name: u, count }) => {
                const isEditing = editingUnit === u;

                return (
                  <div
                    key={u}
                    className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-md transition-colors"
                  >
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded font-semibold text-slate-900 focus:ring-1 focus:ring-[#8b0000] outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(u)}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                          title="Save Rename"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingUnit(null)}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition-colors"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <MapPin className="w-4 h-4 text-[#8b0000] shrink-0" />
                          <span className="font-semibold text-xs text-slate-900 truncate">
                            {u}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Member count pill */}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            <Users className="w-3 h-3 text-slate-500" />
                            {count} {count === 1 ? 'member' : 'members'}
                          </span>

                          {/* Action Buttons */}
                          <button
                            onClick={() => handleStartEdit(u)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            title="Rename Unit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (count > 0) {
                                alert(`Cannot delete "${u}" because ${count} active member(s) are registered in it. Please reassign them first.`);
                                return;
                              }
                              if (confirm(`Are you sure you want to remove unit "${u}"?`)) {
                                onDeleteUnit(u);
                              }
                            }}
                            className={`p-1.5 rounded transition-colors ${
                              count > 0
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={count > 0 ? `${count} members registered` : 'Delete Unit'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-md bg-[#8b0000] hover:bg-[#730000] text-white transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
