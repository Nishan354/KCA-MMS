import React, { useState } from 'react';
import { CustomFieldDefinition, FieldType, Member } from '../types/member';
import {
  X,
  Sliders,
  Plus,
  Edit2,
  Trash2,
  Check,
  IdCard,
  Table,
  HelpCircle,
  AlertCircle,
  Tag,
  Calendar,
  Type,
  Hash,
  ListFilter,
  CheckSquare,
  FileText,
  Phone,
  Mail,
  ShieldCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface FieldManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customFields: CustomFieldDefinition[];
  onSaveCustomFields: (fields: CustomFieldDefinition[]) => void;
  onQuickAddField?: (field: CustomFieldDefinition) => void;
  activeSection?: string;
}

const FIELD_TYPES: { type: FieldType; label: string; icon: React.FC<{ className?: string }>; description: string }[] = [
  { type: 'text', label: 'Short Text', icon: Type, description: 'Single line text (e.g. Sponsor Name, Room / Flat No, Sub-Unit)' },
  { type: 'number', label: 'Number', icon: Hash, description: 'Numeric values (e.g. Years in UAE, Salary Range, Family Count)' },
  { type: 'select', label: 'Dropdown / Select', icon: ListFilter, description: 'Pre-defined dropdown choices (e.g. Visa Status, Marital Status, Committee)' },
  { type: 'date', label: 'Date', icon: Calendar, description: 'Date picker (e.g. Visa Expiry, Emirates ID Expiry, Joining Date)' },
  { type: 'checkbox', label: 'Yes / No Checkbox', icon: CheckSquare, description: 'Boolean toggle (e.g. Active Blood Donor, Holds UAE License)' },
  { type: 'textarea', label: 'Multi-line Notes', icon: FileText, description: 'Detailed notes, cultural skills, remarks or health history' },
  { type: 'phone', label: 'Phone Number', icon: Phone, description: 'Telephone number with country code' },
  { type: 'email', label: 'Email Address', icon: Mail, description: 'Secondary or work email address' },
];

export const FieldManagerModal: React.FC<FieldManagerModalProps> = ({
  isOpen,
  onClose,
  customFields,
  onSaveCustomFields,
  activeSection = 'all',
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  // Form State for Add / Edit
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FieldType>('text');
  const [section, setSection] = useState<'core' | 'contact' | 'emergency' | 'work' | 'other'>('core');
  const [required, setRequired] = useState(false);
  const [showOnIdCard, setShowOnIdCard] = useState(false);
  const [showInTable, setShowInTable] = useState(true);
  const [placeholder, setPlaceholder] = useState('');
  const [description, setDescription] = useState('');
  const [optionsInput, setOptionsInput] = useState('Option 1, Option 2, Option 3');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingFieldId(null);
    setLabel('');
    setType('text');
    setSection(activeSection !== 'all' ? (activeSection as any) : 'core');
    setRequired(false);
    setShowOnIdCard(false);
    setShowInTable(true);
    setPlaceholder('');
    setDescription('');
    setOptionsInput('Option 1, Option 2, Option 3');
    setErrorMessage('');
    setIsAddingNew(true);
  };

  const handleStartEdit = (f: CustomFieldDefinition) => {
    setEditingFieldId(f.id);
    setLabel(f.label);
    setType(f.type);
    setSection(f.section || 'core');
    setRequired(!!f.required);
    setShowOnIdCard(!!f.showOnIdCard);
    setShowInTable(f.showInTable !== false);
    setPlaceholder(f.placeholder || '');
    setDescription(f.description || '');
    setOptionsInput(f.options ? f.options.join(', ') : '');
    setErrorMessage('');
    setIsAddingNew(true);
  };

  const handleSaveFieldForm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      setErrorMessage('Field Name / Label is required.');
      return;
    }

    let parsedOptions: string[] | undefined = undefined;
    if (type === 'select') {
      parsedOptions = optionsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!parsedOptions || parsedOptions.length === 0) {
        setErrorMessage('Please provide at least one dropdown option (comma-separated).');
        return;
      }
    }

    if (editingFieldId) {
      // Update existing
      const updated = customFields.map((f) => {
        if (f.id === editingFieldId) {
          return {
            ...f,
            label: trimmedLabel,
            type,
            section,
            required,
            showOnIdCard,
            showInTable,
            placeholder: placeholder.trim() || undefined,
            description: description.trim() || undefined,
            options: parsedOptions,
          };
        }
        return f;
      });
      onSaveCustomFields(updated);
    } else {
      // Create new custom field
      const newSlug = `cf_${trimmedLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
      const newField: CustomFieldDefinition = {
        id: newSlug,
        label: trimmedLabel,
        type,
        section,
        required,
        showOnIdCard,
        showInTable,
        placeholder: placeholder.trim() || undefined,
        description: description.trim() || undefined,
        options: parsedOptions,
      };
      onSaveCustomFields([...customFields, newField]);
    }

    setIsAddingNew(false);
    setEditingFieldId(null);
  };

  const handleDeleteField = (fieldId: string) => {
    if (confirm('Are you sure you want to delete this custom field? Existing data in member profiles will be preserved.')) {
      onSaveCustomFields(customFields.filter((f) => f.id !== fieldId));
    }
  };

  const getTypeIcon = (fType: FieldType) => {
    const found = FIELD_TYPES.find((t) => t.type === fType);
    const Icon = found ? found.icon : Type;
    return <Icon className="w-4 h-4 text-[#8b0000]" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-[#8b0000] text-white flex items-center justify-between border-b border-[#730000]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white border border-white/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Customize Member Data Fields & Attributes
              </h3>
              <p className="text-xs text-red-100">
                Modify existing fields or add custom fields to forms, tables, details & ID cards
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

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-display font-bold text-sm text-slate-900">
                Active Dynamic Custom Fields ({customFields.length})
              </h4>
              <p className="text-xs text-slate-500">
                Custom fields appear automatically in the registration form, member viewer, table, and ID cards.
              </p>
            </div>

            {!isAddingNew && (
              <button
                onClick={handleStartAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8b0000] hover:bg-[#730000] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New Field
              </button>
            )}
          </div>

          {/* Add / Edit Form Drawer */}
          {isAddingNew && (
            <div className="bg-white p-5 rounded-xl border-2 border-[#8b0000]/30 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h5 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#8b0000]" />
                  {editingFieldId ? `Modify Field: ${label}` : 'Create New Custom Data Field'}
                </h5>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSaveFieldForm} className="space-y-4">
                {/* Field Label & Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Field Label / Title <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="e.g. UAE Visa Status, Sponsor Name, Flat No..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#8b0000] outline-none"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Field Type <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as FieldType)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs font-semibold text-slate-900 bg-white focus:ring-1 focus:ring-[#8b0000] outline-none"
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.type} value={t.type}>
                          {t.label} ({t.type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* If Select / Dropdown, options input */}
                {type === 'select' && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                      Dropdown Choices (Comma-separated) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={optionsInput}
                      onChange={(e) => setOptionsInput(e.target.value)}
                      placeholder="Employment Visa, Investor Visa, Golden Visa, Visit Visa"
                      className="w-full px-3 py-1.5 border border-amber-300 rounded-md text-xs font-medium text-slate-900 bg-white focus:ring-1 focus:ring-amber-600 outline-none"
                    />
                    <span className="text-[11px] text-amber-800 mt-1 block">
                      Separate each option with a comma.
                    </span>
                  </div>
                )}

                {/* Section Assignment & Placeholder */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Form Section Placement
                    </label>
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs font-medium text-slate-800 bg-white focus:ring-1 focus:ring-[#8b0000] outline-none"
                    >
                      <option value="core">1. Core Membership & Identification</option>
                      <option value="contact">2. Contact & Residency</option>
                      <option value="work">3. Employment & Profession</option>
                      <option value="emergency">4. Emergency Contact</option>
                      <option value="other">5. Additional / Miscellaneous Info</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Placeholder / Hint
                    </label>
                    <input
                      type="text"
                      value={placeholder}
                      onChange={(e) => setPlaceholder(e.target.value)}
                      placeholder="e.g. Enter sponsor or company name"
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-slate-800 bg-white focus:ring-1 focus:ring-[#8b0000] outline-none"
                    />
                  </div>
                </div>

                {/* Toggles: Required, Show in Table, Show on ID Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={required}
                      onChange={(e) => setRequired(e.target.checked)}
                      className="rounded text-[#8b0000] focus:ring-[#8b0000]"
                    />
                    <span className="text-xs font-semibold text-slate-800">Mandatory / Required</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={showInTable}
                      onChange={(e) => setShowInTable(e.target.checked)}
                      className="rounded text-[#8b0000] focus:ring-[#8b0000]"
                    />
                    <span className="text-xs font-semibold text-slate-800">Show Column in Table</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={showOnIdCard}
                      onChange={(e) => setShowOnIdCard(e.target.checked)}
                      className="rounded text-[#8b0000] focus:ring-[#8b0000]"
                    />
                    <span className="text-xs font-semibold text-slate-800">Print Badge on ID Card</span>
                  </label>
                </div>

                {errorMessage && (
                  <div className="text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-4 py-2 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#8b0000] hover:bg-[#730000] text-white text-xs font-semibold rounded-md shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    {editingFieldId ? 'Update Field' : 'Create Field'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of Custom Fields */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100">
            {customFields.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Sliders className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-medium">No custom fields created yet.</p>
                <button
                  onClick={handleStartAdd}
                  className="text-xs font-bold text-[#8b0000] hover:underline"
                >
                  + Click here to add your first custom field
                </button>
              </div>
            ) : (
              customFields.map((f) => {
                return (
                  <div
                    key={f.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 mt-0.5">
                        {getTypeIcon(f.type)}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-900">{f.label}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                            {f.type}
                          </span>
                          {f.required && (
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-red-50 text-red-700 border border-red-200">
                              Required
                            </span>
                          )}
                          {f.showOnIdCard && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <IdCard className="w-2.5 h-2.5" /> On Card
                            </span>
                          )}
                          {f.showInTable && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                              <Table className="w-2.5 h-2.5" /> In Table
                            </span>
                          )}
                        </div>

                        {f.type === 'select' && f.options && (
                          <div className="text-[11px] text-slate-500 flex flex-wrap gap-1">
                            <span className="font-semibold text-slate-600">Options:</span>
                            {f.options.map((opt, i) => (
                              <span key={i} className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10.5px]">
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}

                        {f.description && (
                          <div className="text-[11px] text-slate-400">{f.description}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleStartEdit(f)}
                        className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Edit Field"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteField(f.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {customFields.length} active custom fields configured
          </span>
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
