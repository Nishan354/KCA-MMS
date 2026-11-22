import React, { useState, useRef, useEffect } from 'react';
import { Member } from '../types/member';
import {
  PortalBrandingConfig,
  ORG_BRANDING_PRESETS,
  OrgCategoryType,
  HeaderTitleStyle,
} from '../types/portal';
import { THEME_PRESETS } from '../types/theme';
import { ID_CARD_DESIGNS } from '../types/cardDesign';
import { loadPortalConfig, savePortalConfig, resetCustomLogo } from '../utils/storage';
import { optimizeLogoFile } from '../utils/imageOptimizer';
import { saveAndApplyTheme } from '../utils/theme';
import { pushCloudEntity } from '../utils/cloudSync';
import { KcaLogo, invalidateLogoCache } from './Logo';
import { BrandTitleLockup } from './BrandTitleLockup';
import { OFFICIAL_TITLE_ASSET_PATH, invalidateTitleGraphicCache } from '../utils/titleGraphic';
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
  CreditCard,
  Type,
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
  const titleGraphicInputRef = useRef<HTMLInputElement>(null);

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
  const handleLogoFile = async (file: File) => {
    setOrgErrorMessage('');
    setOrgSuccessMessage('');

    if (!file.type.startsWith('image/')) {
      setOrgErrorMessage('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    try {
      const optimized = await optimizeLogoFile(file, 512);
      if (optimized.dataUrl) {
        setPreviewLogo(optimized.dataUrl);
      } else {
        setOrgErrorMessage('Failed to read selected image file.');
      }
    } catch {
      setOrgErrorMessage('Failed to read selected image file.');
    }
  };

  const handleTitleGraphicFile = (file: File) => {
    setOrgErrorMessage('');
    setOrgSuccessMessage('');

    if (!file.type.startsWith('image/')) {
      setOrgErrorMessage('Please upload a valid image file (PNG, JPG, SVG, WebP) for the header title banner.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      invalidateTitleGraphicCache();
      setOrgConfig((prev) => ({
        ...prev,
        headerTitleStyle: 'title_graphic',
        customTitleGraphicUrl: dataUrl,
      }));
      setOrgSuccessMessage('Custom Title Graphic uploaded! Click Save to apply across ID cards and certificates.');
      setTimeout(() => setOrgSuccessMessage(''), 4000);
    };
    reader.onerror = () => {
      setOrgErrorMessage('Failed to read selected title graphic file.');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPreset = (presetId: string) => {
    const found = ORG_BRANDING_PRESETS.find((p) => p.id === presetId);
    if (!found) return;

    const merged: PortalBrandingConfig = {
      ...orgConfig,
      ...found.config,
    };
    setOrgConfig(merged);

    // Apply preset theme immediately if defined
    if (found.config.theme) {
      saveAndApplyTheme(found.config.theme);
    } else if (found.config.primaryColor) {
      saveAndApplyTheme(found.config.primaryColor);
    }

    setOrgSuccessMessage(`Applied template: "${found.name}"! Click Save to permanently synchronize.`);
    setTimeout(() => setOrgSuccessMessage(''), 4500);
  };

  const handleSelectTheme = (themeId: string) => {
    const preset = THEME_PRESETS.find((t) => t.id === themeId);
    if (preset) {
      saveAndApplyTheme(preset);
      setOrgConfig((prev) => ({
        ...prev,
        theme: preset.id,
        primaryColor: preset.primary,
      }));
    }
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

    if (updatedConfig.theme) {
      saveAndApplyTheme(updatedConfig.theme);
    } else if (updatedConfig.primaryColor) {
      saveAndApplyTheme(updatedConfig.primaryColor);
    }

    savePortalConfig(updatedConfig);
    invalidateLogoCache();
    invalidateTitleGraphicCache();
    pushCloudEntity('portalConfig', updatedConfig, 'Admin');
    if (previewLogo) {
      const favEl = document.getElementById('app-favicon') as HTMLLinkElement;
      if (favEl) favEl.href = previewLogo;
    }

    setOrgSuccessMessage('Organisation details, theme, title lockup, and logo updated successfully! All ID cards, batch print sheets, headers, receipts and certificates are now in sync.');
    confetti({ particleCount: 45, spread: 65 });
    setTimeout(() => setOrgSuccessMessage(''), 5000);
  };

  const handleResetLogo = () => {
    resetCustomLogo();
    invalidateLogoCache();
    invalidateTitleGraphicCache();
    setPreviewLogo(null);
    setOrgConfig((prev) => ({ ...prev, customLogoUrl: null }));
    pushCloudEntity('customLogo', null, 'Admin');
    setOrgSuccessMessage('Emblem restored to default official logo.');
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
                Organisation, Branding &amp; {orgConfig.unitTermPlural || 'Units'}
              </h3>
              <p className="text-xs text-rose-100">
                Customise names, themes, logos, ID prefixes, and {orgConfig.unitTermPlural?.toLowerCase() || 'units'} for any organization or company
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
            onClick={() => setActiveTab('organisation')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'organisation'
                ? 'border-rose-900 text-rose-950 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-rose-800" />
            <span>Organisation Details, Themes &amp; Logo</span>
          </button>

          <button
            onClick={() => setActiveTab('units')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'units'
                ? 'border-rose-900 text-rose-950 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4 text-rose-800" />
            <span>{orgConfig.unitTermPlural || 'Units'} &amp; Branches ({units.length})</span>
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

              {/* 1. Quick Organization Templates / Presets */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Quick Organization Templates (1-Click Switch)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Select a template to instantly customize for a company, non-profit, sports club, or cultural association
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                  {ORG_BRANDING_PRESETS.map((preset) => {
                    const isActive =
                      orgConfig.portalName.toLowerCase() === (preset.config.portalName || '').toLowerCase();
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isActive
                            ? 'bg-rose-50/70 border-rose-800 ring-2 ring-rose-800/20'
                            : 'bg-slate-50 hover:bg-white hover:border-slate-300 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {preset.name}
                          </span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 shrink-0">
                            {preset.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Live Brand Header & Monogram Preview */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-rose-800" />
                    Live Brand Preview
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Real-Time Header &amp; Card Appearance
                  </span>
                </div>

                {/* Banner Preview Card */}
                <div
                  className="rounded-xl p-4 text-white shadow-xs border border-white/20 transition-all flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left"
                  style={{ backgroundColor: orgConfig.primaryColor || 'var(--color-primary, #8b0000)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white p-1 border border-white/20 shrink-0 flex items-center justify-center shadow-xs">
                      <KcaLogo size={40} customLogoUrl={previewLogo} />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/20 text-[9px] font-bold text-white/95 uppercase tracking-wider mb-0.5">
                        {orgConfig.affiliationText || 'Official Register'}
                      </div>
                      <h3 className="font-display font-black text-sm uppercase tracking-tight leading-snug">
                        {orgConfig.portalName || 'Organization Name'}
                      </h3>
                      <p className="text-[11px] text-white/80 font-medium">
                        {orgConfig.subtitle || 'Management Portal'} &bull; {orgConfig.jurisdiction || 'Territory'}
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:block text-right shrink-0">
                    <div className="bg-black/20 px-3 py-1.5 rounded-lg border border-white/15">
                      <div className="text-[9px] text-white/70 uppercase font-semibold tracking-wider">
                        Prefix: <span className="font-mono text-white font-bold">{orgConfig.idPrefix || 'KCA'}</span>
                      </div>
                      <div className="text-[10px] font-bold text-white uppercase">
                        {orgConfig.shortName || 'Portal'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Emblem / Custom Logo Upload */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-rose-800" />
                    Official Crest, Emblem &amp; Logo Upload
                  </h4>
                  {previewLogo && (
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      className="text-xs font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset to Monogram / Original</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="flex flex-col items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl shrink-0">
                    <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs overflow-hidden">
                      <KcaLogo size={64} customLogoUrl={previewLogo} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 font-semibold">
                      {previewLogo ? 'Custom Upload Active' : 'Automatic Vector Monogram'}
                    </span>
                  </div>

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
                      Click to upload or drag &amp; drop organization logo
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Supports transparent PNG, SVG, JPG or WebP (Max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Core Organization Fields */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-rose-800" />
                  Legal Name, Brand Identity &amp; Classification
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category Type */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Organization Category
                    </label>
                    <select
                      value={orgConfig.orgType || 'association'}
                      onChange={(e) => setOrgConfig({ ...orgConfig, orgType: e.target.value as OrgCategoryType })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white outline-none"
                    >
                      <option value="association">Cultural / Community Association</option>
                      <option value="company">Commercial Company / Corporate LLC</option>
                      <option value="ngo">Non-Profit / NGO / Foundation</option>
                      <option value="club">Sports &amp; Social Club</option>
                      <option value="school">Academy / School / Institute</option>
                      <option value="society">Cooperative / Society</option>
                      <option value="other">Other Organization</option>
                    </select>
                  </div>

                  {/* Full Legal Name */}
                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Full Legal Organization Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={orgConfig.portalName}
                      onChange={(e) => setOrgConfig({ ...orgConfig, portalName: e.target.value })}
                      placeholder="e.g. Kairali Cultural Association Fujairah or Al Majaz Global LLC"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-rose-800"
                    />
                  </div>

                  {/* Short Name / Acronym */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Short Name / Brand Acronym
                    </label>
                    <input
                      type="text"
                      value={orgConfig.shortName}
                      onChange={(e) => setOrgConfig({ ...orgConfig, shortName: e.target.value })}
                      placeholder="e.g. KCA FUJAIRAH or AL MAJAZ"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white outline-none"
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

                  {/* Jurisdiction / Territorial Scope */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Territorial Scope / Jurisdiction
                    </label>
                    <input
                      type="text"
                      value={orgConfig.jurisdiction}
                      onChange={(e) => setOrgConfig({ ...orgConfig, jurisdiction: e.target.value })}
                      placeholder="e.g. Fujairah • East Coast UAE or Dubai • UAE"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none"
                    />
                  </div>

                  {/* Government / Commercial Affiliation */}
                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Registration, License or Affiliation
                    </label>
                    <input
                      type="text"
                      value={orgConfig.affiliationText}
                      onChange={(e) => setOrgConfig({ ...orgConfig, affiliationText: e.target.value })}
                      placeholder="e.g. A Norka affiliated Organisation or Commercial Reg. No. 1029482"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none"
                    />
                  </div>

                  {/* ID Prefix Code */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Member / Employee ID Prefix
                    </label>
                    <input
                      type="text"
                      value={orgConfig.idPrefix || 'KCA'}
                      onChange={(e) => setOrgConfig({ ...orgConfig, idPrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                      placeholder="e.g. KCA, EMP, MEM, VOL"
                      maxLength={6}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Regional Structure & Branch Terminology */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-rose-800" />
                  Regional Structure &amp; Branch Terminology
                </h4>
                <p className="text-[11px] text-slate-500">
                  Customize what internal groupings are called throughout the application (e.g. &quot;Branch&quot; for companies, &quot;Department&quot; for enterprises, &quot;Unit&quot; for associations).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Group Singular Term
                    </label>
                    <input
                      type="text"
                      value={orgConfig.unitTerm || 'Unit'}
                      onChange={(e) => setOrgConfig({ ...orgConfig, unitTerm: e.target.value })}
                      placeholder="e.g. Unit, Branch, Department, Chapter, Division"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Group Plural Term
                    </label>
                    <input
                      type="text"
                      value={orgConfig.unitTermPlural || 'Units'}
                      onChange={(e) => setOrgConfig({ ...orgConfig, unitTermPlural: e.target.value })}
                      placeholder="e.g. Units, Branches, Departments, Chapters, Divisions"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:bg-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 6. Theme & Color Palette Selector */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-rose-800" />
                  Primary Brand Color &amp; Theme Palette
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
                  {THEME_PRESETS.map((t) => {
                    const isSelected =
                      orgConfig.theme === t.id ||
                      orgConfig.primaryColor?.toLowerCase() === t.primary.toLowerCase();
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectTheme(t.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-slate-100 border-slate-800 ring-2 ring-slate-800/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full shrink-0 shadow-2xs border border-white"
                          style={{ backgroundColor: t.primary }}
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-[11px] text-slate-900 truncate">
                            {t.name.split('(')[0]}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 7. Default Member ID Card Design Template */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-rose-800" />
                    Default Member ID Card Design Template
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    CR80 Standard
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Select the default credential design applied to new members. Individual members can also have custom card designs assigned.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {ID_CARD_DESIGNS.map((d) => {
                    const isSelected = (orgConfig.defaultCardDesign || 'classic_wave') === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setOrgConfig({ ...orgConfig, defaultCardDesign: d.id })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-rose-50/70 border-rose-800 ring-2 ring-rose-800/20 shadow-xs'
                            : 'bg-slate-50 hover:bg-white hover:border-slate-300 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-2xs"
                              style={{ backgroundColor: d.previewColors.primary }}
                            />
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {d.name}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 shrink-0">
                            {d.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                          {d.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 8. Official Title Lockup & Graphic Banner for ID Cards & Certificates */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Type className="w-4 h-4 text-rose-800" />
                      Official Header Title Lockup (Member IDs, Student IDs &amp; Certificates)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Configure the stacked crimson serif &amp; black title lockup or the official title image banner across all credentials.
                    </p>
                  </div>
                </div>

                {/* Live Title Lockup Preview Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex-1 flex items-center justify-center bg-white border border-slate-200 rounded-lg px-4 py-3 min-h-[76px] w-full">
                    <BrandTitleLockup
                      styleMode={orgConfig.headerTitleStyle || 'official_lockup'}
                      portalConfig={{ ...orgConfig, customLogoUrl: previewLogo }}
                      variant="preview"
                      logoSize={48}
                      primaryColor={orgConfig.primaryColor || '#8b0000'}
                    />
                  </div>
                  <div className="flex flex-col items-center sm:items-end gap-1.5 shrink-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Built-in Title Asset
                    </div>
                    <img
                      src={orgConfig.customTitleGraphicUrl || OFFICIAL_TITLE_ASSET_PATH}
                      alt="Official Title Graphic"
                      className="h-12 w-auto object-contain bg-white border border-slate-200 rounded-md px-2 py-1"
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={titleGraphicInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleTitleGraphicFile(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => titleGraphicInputRef.current?.click()}
                        className="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload Banner</span>
                      </button>
                      {orgConfig.customTitleGraphicUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            invalidateTitleGraphicCache();
                            setOrgConfig((prev) => ({ ...prev, customTitleGraphicUrl: null }));
                          }}
                          className="px-2 py-1 rounded text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer"
                        >
                          Use Built-in Graphic
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Title Style Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(
                    [
                      {
                        id: 'official_lockup' as HeaderTitleStyle,
                        title: 'Official Typographic Lockup',
                        desc: 'Crisp serif Line 1 + stacked uppercase Line 2 & Location with active logo.',
                      },
                      {
                        id: 'title_graphic' as HeaderTitleStyle,
                        title: 'Official Title Graphic Image',
                        desc: 'Renders the high-res official emblem + KAIRALI title image artwork directly.',
                      },
                      {
                        id: 'standard' as HeaderTitleStyle,
                        title: 'Standard Single-Line Header',
                        desc: 'Classic organization legal name & jurisdiction header layout.',
                      },
                    ]
                  ).map((mode) => {
                    const isActive = (orgConfig.headerTitleStyle || 'official_lockup') === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setOrgConfig({ ...orgConfig, headerTitleStyle: mode.id })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isActive
                            ? 'bg-rose-50/70 border-rose-800 ring-2 ring-rose-800/20 shadow-xs'
                            : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                          <span>{mode.title}</span>
                          {isActive && <Check className="w-3.5 h-3.5 text-rose-800 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{mode.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Customizable 3-Line Lockup Texts */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Lockup Line 1 (Primary Headline)
                    </label>
                    <input
                      type="text"
                      value={orgConfig.titleLine1 ?? 'KAIRALI'}
                      onChange={(e) => setOrgConfig({ ...orgConfig, titleLine1: e.target.value })}
                      placeholder="e.g. KAIRALI"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-serif font-bold uppercase text-rose-700 bg-slate-50 focus:bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Lockup Line 2 (Sub-Headline)
                    </label>
                    <input
                      type="text"
                      value={orgConfig.titleLine2 ?? 'CULTURAL ASSOCIATION'}
                      onChange={(e) => setOrgConfig({ ...orgConfig, titleLine2: e.target.value })}
                      placeholder="e.g. CULTURAL ASSOCIATION"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold uppercase text-slate-900 bg-slate-50 focus:bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Lockup Line 3 (Location / Branch)
                    </label>
                    <input
                      type="text"
                      value={orgConfig.titleLine3 ?? 'Fujairah'}
                      onChange={(e) => setOrgConfig({ ...orgConfig, titleLine3: e.target.value })}
                      placeholder="e.g. Fujairah"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                {/* Surface Toggles */}
                <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Enable Title Lockup On:
                  </span>
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={orgConfig.applyTitleToMemberCards !== false}
                      onChange={(e) =>
                        setOrgConfig({ ...orgConfig, applyTitleToMemberCards: e.target.checked })
                      }
                      className="rounded text-rose-800 focus:ring-rose-800"
                    />
                    <span>All Member ID Cards</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={orgConfig.applyTitleToStudentCards !== false}
                      onChange={(e) =>
                        setOrgConfig({ ...orgConfig, applyTitleToStudentCards: e.target.checked })
                      }
                      className="rounded text-rose-800 focus:ring-rose-800"
                    />
                    <span>All Student / Children&apos;s Wing ID Cards</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={orgConfig.applyTitleToCertificates !== false}
                      onChange={(e) =>
                        setOrgConfig({ ...orgConfig, applyTitleToCertificates: e.target.checked })
                      }
                      className="rounded text-rose-800 focus:ring-rose-800"
                    />
                    <span>All Certificates (Single &amp; Bulk)</span>
                  </label>
                </div>
              </div>

              {/* 9. Contact Details */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-rose-800" />
                  Official Contact &amp; Communication Channels
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>Official Email Address</span>
                    </label>
                    <input
                      type="email"
                      value={orgConfig.contactEmail}
                      onChange={(e) => setOrgConfig({ ...orgConfig, contactEmail: e.target.value })}
                      placeholder="e.g. info@organization.ae"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50 focus:bg-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-2 hover:brightness-110"
                  style={{ backgroundColor: orgConfig.primaryColor || 'var(--color-primary, #881337)' }}
                >
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>Save Organisation Details, Theme &amp; Logo</span>
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
