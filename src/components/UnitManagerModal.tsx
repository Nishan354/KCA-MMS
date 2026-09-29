import React, { useState, useRef, useEffect } from 'react';
import { Member } from '../types/member';
import { PortalBrandingConfig } from '../types/portal';
import { loadPortalConfig, savePortalConfig, saveCustomLogo, resetCustomLogo } from '../utils/storage';
import { pushCloudEntity } from '../utils/cloudSync';
import { KcaLogo } from './Logo';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
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
  Building2,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  Save,
  Globe,
  Phone,
  Mail,
  Shield,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface UnitManagerModalProps {
  isOpen: boolean;
  units: string[];
  members: Member[];
  onClose: () => void;
  onAddUnit: (newUnit: string) => void;
  onRenameUnit: (oldUnit: string, newUnit: string) => void;
  onDeleteUnit: (unitToDelete: string) => void;
  initialTab?: 'units' | 'organisation';
}

export const UnitManagerModal: React.FC<UnitManagerModalProps> = ({
  isOpen,
  units,
  members,
  onClose,
  onAddUnit,
  onRenameUnit,
  onDeleteUnit,
  initialTab = 'units',
}) => {
  const [activeTab, setActiveTab] = useState<'units' | 'organisation'>(initialTab);

  // Unit State
  const [newUnitName, setNewUnitName] = useState('');
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [unitToDelete, setUnitToDelete] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [unitSuccessMessage, setUnitSuccessMessage] = useState('');

  // Organisation State
  const [orgConfig, setOrgConfig] = useState<PortalBrandingConfig>(() => loadPortalConfig());
  const [previewLogo, setPreviewLogo] = useState<string | null>(orgConfig.customLogoUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [orgSuccessMessage, setOrgSuccessMessage] = useState('');
  const [orgErrorMessage, setOrgErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const current = loadPortalConfig();
      setOrgConfig(current);
      setPreviewLogo(current.customLogoUrl || null);
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Calculate member count for each unit
  const unitStats = units.map((u) => {
    const count = members.filter((m) => m.unit.toLowerCase() === u.toLowerCase()).length;
    return { name: u, count };
  });

  // --- UNIT HANDLERS ---
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setUnitSuccessMessage('');
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
    setUnitSuccessMessage(`Added new unit "${trimmed}" successfully.`);
    setTimeout(() => setUnitSuccessMessage(''), 3000);
  };

  const handleStartEdit = (unit: string) => {
    setEditingUnit(unit);
    setEditedName(unit);
    setErrorMessage('');
    setUnitSuccessMessage('');
  };

  const handleSaveEdit = (oldUnit: string) => {
    setErrorMessage('');
    setUnitSuccessMessage('');
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
    setUnitSuccessMessage(`Renamed "${oldUnit}" to "${trimmed}". All associated member registers & financial ledgers updated!`);
    confetti({ particleCount: 30, spread: 50 });
    setTimeout(() => setUnitSuccessMessage(''), 4000);
  };

  // --- ORGANISATION & LOGO HANDLERS ---
  const handleLogoFile = (file: File) => {
    setOrgErrorMessage('');
    setOrgSuccessMessage('');

    if (!file.type.startsWith('image/')) {
      setOrgErrorMessage('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewLogo(dataUrl);
    };
    reader.onerror = () => {
      setOrgErrorMessage('Failed to read selected image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveOrgDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setOrgErrorMessage('');
    setOrgSuccessMessage('');

    if (!orgConfig.portalName.trim()) {
      setOrgErrorMessage('Organisation Legal Name is required.');
      return;
    }

    const updatedConfig: PortalBrandingConfig = {
      ...orgConfig,
      customLogoUrl: previewLogo,
      updatedAt: new Date().toISOString(),
    };

    savePortalConfig(updatedConfig);
    if (previewLogo !== undefined) {
      saveCustomLogo(previewLogo);
    }
    pushCloudEntity('portalConfig', updatedConfig, 'Admin');

    setOrgSuccessMessage('Organisation details and official logo updated successfully!');
    confetti({ particleCount: 40, spread: 60 });
    setTimeout(() => setOrgSuccessMessage(''), 4000);
  };

  const handleResetLogo = () => {
    resetCustomLogo();
    setPreviewLogo(null);
    setOrgConfig((prev) => ({ ...prev, customLogoUrl: null }));
    pushCloudEntity('customLogo', null, 'Admin');
    setOrgSuccessMessage('Emblem restored to default official KCA Fujairah logo.');
    setTimeout(() => setOrgSuccessMessage(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-scaleUp">
        {/* Header */}
        <div
          className="px-6 py-4.5 text-white flex items-center justify-between border-b"
          style={{ backgroundColor: 'var(--color-primary, #881337)', borderColor: '#730000' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
              <Building2 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Units, Organisation &amp; Logo Settings
              </h3>
              <p className="text-xs text-rose-100">
                Rename units, update official organization details, and manage association emblem
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('units')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'units'
                ? 'border-rose-900 text-rose-950 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4 text-rose-800" />
            <span>Manage &amp; Rename Units ({units.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('organisation')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'organisation'
                ? 'border-rose-900 text-rose-950 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-rose-800" />
            <span>Organisation Details &amp; Logo</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          
          {/* TAB 1: UNITS & BRANCH AREAS */}
          {activeTab === 'units' && (
            <div className="space-y-5">
              {unitSuccessMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 font-semibold animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{unitSuccessMessage}</span>
                </div>
              )}

              {/* Add New Unit Form */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-rose-800" />
                  Add New Association Unit / Branch
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
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-rose-800 outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                    style={{ backgroundColor: 'var(--color-primary, #881337)' }}
                  >
                    <Plus className="w-4 h-4 text-amber-300" />
                    <span>Add Unit</span>
                  </button>
                </form>

                {errorMessage && (
                  <div className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Existing Units List with Direct In-Line Renaming */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">
                      Configured Units ({units.length})
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Renaming a unit automatically migrates all member cards, finance ledger records, assets, and classes.
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {units.map((unit) => {
                    const stats = unitStats.find((s) => s.name === unit);
                    const count = stats ? stats.count : 0;
                    const isEditing = editingUnit === unit;

                    return (
                      <div
                        key={unit}
                        className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              autoFocus
                              placeholder="New Unit Name"
                              className="flex-1 px-3 py-1.5 border border-rose-800 rounded-lg text-xs font-bold text-slate-900 bg-white focus:outline-none ring-1 ring-rose-800"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(unit)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Save Name</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUnit(null);
                                setEditedName('');
                              }}
                              className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-medium cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-800 font-bold">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <span>{unit} Unit</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                  {count} {count === 1 ? 'member' : 'members'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {!isEditing && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(unit)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                              title={`Rename ${unit} Unit`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Rename</span>
                            </button>

                            {units.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (count > 0) {
                                    setErrorMessage(
                                      `Cannot delete "${unit}" because ${count} members are currently registered in this unit. Please transfer or reassign those members first.`
                                    );
                                    return;
                                  }
                                  setUnitToDelete(unit);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title={`Delete ${unit} Unit`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORGANISATION DETAILS & LOGO */}
          {activeTab === 'organisation' && (
            <form onSubmit={handleSaveOrgDetails} className="space-y-5 text-xs">
              {orgSuccessMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 font-semibold animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{orgSuccessMessage}</span>
                </div>
              )}

              {orgErrorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{orgErrorMessage}</span>
                </div>
              )}

              {/* Logo Section */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-rose-800" />
                    Official Organisation Emblem &amp; Logo
                  </h4>
                  {previewLogo && (
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      className="text-xs font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset to Original Logo</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Current Preview */}
                  <div className="flex flex-col items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl shrink-0">
                    <div className="w-24 h-24 rounded-xl bg-white border border-slate-200 p-2 flex items-center justify-center shadow-xs overflow-hidden">
                      {previewLogo ? (
                        <img
                          src={previewLogo}
                          alt="Association Logo Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <KcaLogo size="lg" />
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 font-semibold">
                      {previewLogo ? 'Custom Upload Active' : 'Default Official Emblem'}
                    </span>
                  </div>

                  {/* Drop zone / File Input */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleLogoFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                      isDragging
                        ? 'border-rose-800 bg-rose-50/50'
                        : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleLogoFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <Upload className="w-6 h-6 text-slate-400 mb-2" />
                    <p className="font-bold text-slate-800 text-xs">
                      Click to upload or drag &amp; drop new association logo
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Supports high-resolution PNG, JPG, SVG or WebP (Max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Organisation Info Fields */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-rose-800" />
                  Legal Title, Subtitle &amp; Affiliation
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Org Name */}
                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Full Organisation Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={orgConfig.portalName}
                      onChange={(e) => setOrgConfig({ ...orgConfig, portalName: e.target.value })}
                      placeholder="e.g. Kairali Cultural Association Fujairah"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-rose-800"
                    />
                  </div>

                  {/* Short Name / Acronym */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Short Name / Code
                    </label>
                    <input
                      type="text"
                      value={orgConfig.shortName}
                      onChange={(e) => setOrgConfig({ ...orgConfig, shortName: e.target.value })}
                      placeholder="e.g. KCA-MMS or KCA FUJAIRAH"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-rose-800"
                    />
                  </div>

                  {/* Subtitle */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Official Subtitle / Descriptor
                    </label>
                    <input
                      type="text"
                      value={orgConfig.subtitle}
                      onChange={(e) => setOrgConfig({ ...orgConfig, subtitle: e.target.value })}
                      placeholder="e.g. Official Central Register & Membership Portal"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none"
                    />
                  </div>

                  {/* Jurisdiction */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Jurisdiction / Territorial Scope
                    </label>
                    <input
                      type="text"
                      value={orgConfig.jurisdiction}
                      onChange={(e) => setOrgConfig({ ...orgConfig, jurisdiction: e.target.value })}
                      placeholder="e.g. Fujairah • East Coast UAE"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none"
                    />
                  </div>

                  {/* Affiliation */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Government / Community Affiliation
                    </label>
                    <input
                      type="text"
                      value={orgConfig.affiliationText}
                      onChange={(e) => setOrgConfig({ ...orgConfig, affiliationText: e.target.value })}
                      placeholder="e.g. NORKA Roots Affiliated"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none"
                    />
                  </div>

                  {/* Contact Phone */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>Official Contact Phone / Helpline</span>
                    </label>
                    <input
                      type="text"
                      value={orgConfig.contactPhone}
                      onChange={(e) => setOrgConfig({ ...orgConfig, contactPhone: e.target.value })}
                      placeholder="e.g. +971 9 222 3456"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50 focus:bg-white outline-none"
                    />
                  </div>

                  {/* Contact Email */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>Official Email Address</span>
                    </label>
                    <input
                      type="email"
                      value={orgConfig.contactEmail}
                      onChange={(e) => setOrgConfig({ ...orgConfig, contactEmail: e.target.value })}
                      placeholder="e.g. kairalicaf@gmail.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50 focus:bg-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-2"
                  style={{ backgroundColor: 'var(--color-primary, #881337)' }}
                >
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>Save Organisation Details &amp; Logo</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Delete Unit Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!unitToDelete}
        title="Delete Unit"
        itemName={unitToDelete || ''}
        message={`Are you sure you want to remove the unit "${unitToDelete}"? This unit will be removed from available organizational units.`}
        confirmLabel="Delete Unit"
        onConfirm={() => {
          if (unitToDelete) {
            onDeleteUnit(unitToDelete);
            setUnitToDelete(null);
          }
        }}
        onClose={() => setUnitToDelete(null)}
      />
    </div>
  );
};
