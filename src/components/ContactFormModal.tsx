import React, { useState, useEffect } from 'react';
import { ContactEntry, ContactPerson, ContactCategory, CONTACT_CATEGORIES } from '../types/contact';
import { UserSession, isUnitOperatorRole } from '../types/member';
import {
  X,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Plus,
  Trash2,
  Star,
  Tag,
  FileText,
  Save,
} from 'lucide-react';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: ContactEntry) => void;
  initialContact?: ContactEntry | null;
  units: string[];
  userSession?: UserSession | null;
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialContact,
  units,
  userSession,
}) => {
  const isUnitOp = !!userSession && isUnitOperatorRole(userSession.role);
  const defaultUnit = isUnitOp && userSession.unit ? userSession.unit : (units[0] || 'Fujairah');

  const [orgName, setOrgName] = useState('');
  const [malayalamName, setMalayalamName] = useState('');
  const [category, setCategory] = useState<ContactCategory>('Sponsor & Patron');
  const [unit, setUnit] = useState(defaultUnit);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Fujairah');
  const [emirate, setEmirate] = useState('Fujairah');
  const [poBox, setPoBox] = useState('');
  const [website, setWebsite] = useState('');
  const [generalPhone, setGeneralPhone] = useState('');
  const [generalEmail, setGeneralEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [contacts, setContacts] = useState<ContactPerson[]>([]);

  useEffect(() => {
    if (initialContact) {
      setOrgName(initialContact.organizationName || '');
      setMalayalamName(initialContact.malayalamName || '');
      setCategory(initialContact.category || 'Sponsor & Patron');
      setUnit(initialContact.unit || defaultUnit);
      setAddress(initialContact.address || '');
      setCity(initialContact.city || 'Fujairah');
      setEmirate(initialContact.emirate || 'Fujairah');
      setPoBox(initialContact.poBox || '');
      setWebsite(initialContact.website || '');
      setGeneralPhone(initialContact.generalPhone || '');
      setGeneralEmail(initialContact.generalEmail || '');
      setNotes(initialContact.notes || '');
      setTags(initialContact.tags || []);
      setContacts(
        initialContact.contacts && initialContact.contacts.length > 0
          ? initialContact.contacts
          : [
              {
                id: 'cp_' + Date.now(),
                name: '',
                designation: 'Contact Person',
                phone: '',
                whatsapp: '',
                email: '',
                isPrimary: true,
              },
            ]
      );
    } else {
      setOrgName('');
      setMalayalamName('');
      setCategory('Sponsor & Patron');
      setUnit(defaultUnit);
      setAddress('');
      setCity('Fujairah');
      setEmirate('Fujairah');
      setPoBox('');
      setWebsite('');
      setGeneralPhone('');
      setGeneralEmail('');
      setNotes('');
      setTags([]);
      setContacts([
        {
          id: 'cp_' + Date.now(),
          name: '',
          designation: 'Managing Director / Representative',
          phone: '',
          whatsapp: '',
          email: '',
          isPrimary: true,
        },
      ]);
    }
  }, [initialContact, isOpen, defaultUnit]);

  // Close on Escape key
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

  if (!isOpen) return null;

  const handleAddContactPerson = () => {
    setContacts([
      ...contacts,
      {
        id: 'cp_' + Date.now(),
        name: '',
        designation: 'Coordinator / Staff',
        phone: '',
        whatsapp: '',
        email: '',
        isPrimary: contacts.length === 0,
      },
    ]);
  };

  const handleRemoveContactPerson = (id: string) => {
    if (contacts.length <= 1) return;
    const remaining = contacts.filter((c) => c.id !== id);
    if (!remaining.some((c) => c.isPrimary) && remaining.length > 0) {
      remaining[0].isPrimary = true;
    }
    setContacts(remaining);
  };

  const handleSetPrimary = (id: string) => {
    setContacts(
      contacts.map((c) => ({
        ...c,
        isPrimary: c.id === id,
      }))
    );
  };

  const handleUpdateContactPerson = (id: string, field: keyof ContactPerson, value: any) => {
    setContacts(
      contacts.map((c) => {
        if (c.id === id) {
          return { ...c, [field]: value };
        }
        return c;
      })
    );
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      alert('Please enter the organization / entity name.');
      return;
    }

    const payload: ContactEntry = {
      id: initialContact?.id || 'cnt_' + Date.now(),
      organizationName: orgName.trim(),
      malayalamName: malayalamName.trim() || undefined,
      category,
      unit,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      emirate: emirate.trim() || undefined,
      poBox: poBox.trim() || undefined,
      website: website.trim() || undefined,
      generalPhone: generalPhone.trim() || undefined,
      generalEmail: generalEmail.trim() || undefined,
      notes: notes.trim() || undefined,
      tags,
      contacts: contacts.filter((c) => c.name.trim().length > 0),
      createdAt: initialContact?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(payload);
    onClose();
  };

  const availableUnits = ['Global / Central', ...units];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#881337] text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 border border-white/20">
              <Building2 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialContact ? 'Edit Contact Bank Entry' : 'New Contact Bank Entry'}
              </h2>
              <p className="text-xs text-rose-100">
                Sponsors, Government, NORKA, Associations &amp; Key Stakeholders
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
            title="Close modal (Esc)"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          {/* Organization Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#881337] dark:text-rose-400" />
              Organization &amp; Category
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Organization / Entity Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Al Ansari Exchange, NORKA Roots, Aster Clinic"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#881337] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Malayalam Name (Optional)
                </label>
                <input
                  type="text"
                  value={malayalamName}
                  onChange={(e) => setMalayalamName(e.target.value)}
                  placeholder="e.g. Al Ansari Exchange"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#881337] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category <span className="text-rose-600">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ContactCategory)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#881337] outline-none cursor-pointer"
                >
                  {CONTACT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Unit / Zone <span className="text-rose-600">*</span>
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  disabled={isUnitOp}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#881337] outline-none disabled:opacity-60 cursor-pointer"
                >
                  {availableUnits.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                {isUnitOp && (
                  <p className="text-[10px] text-slate-500 mt-1">Locked to your designated unit.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  City &amp; Emirate
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City (Fujairah)"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#881337] outline-none"
                  />
                  <select
                    value={emirate}
                    onChange={(e) => setEmirate(e.target.value)}
                    className="w-full px-2 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#881337] outline-none"
                  >
                    <option value="Fujairah">Fujairah</option>
                    <option value="Sharjah">Sharjah</option>
                    <option value="Dubai">Dubai</option>
                    <option value="Abu Dhabi">Abu Dhabi</option>
                    <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                    <option value="Ajman">Ajman</option>
                    <option value="Umm Al Quwain">Umm Al Quwain</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* General Contact & Address */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#881337] dark:text-rose-400" />
              General Organization Channels &amp; Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  General Landline / Phone
                </label>
                <input
                  type="text"
                  value={generalPhone}
                  onChange={(e) => setGeneralPhone(e.target.value)}
                  placeholder="+971 9 222 1234"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#881337] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  General Email
                </label>
                <input
                  type="email"
                  value={generalEmail}
                  onChange={(e) => setGeneralEmail(e.target.value)}
                  placeholder="info@organization.ae"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#881337] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Website / Social Link
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://organization.com"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#881337] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  P.O. Box &amp; Postal Info
                </label>
                <input
                  type="text"
                  value={poBox}
                  onChange={(e) => setPoBox(e.target.value)}
                  placeholder="P.O. Box 1234, Fujairah"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#881337] outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Street / Building Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Building Name, Street, Landmark"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#881337] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Multi-Contact Persons Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#881337] dark:text-rose-400" />
                Contact Persons &amp; Representatives ({contacts.length})
              </h3>
              <button
                type="button"
                onClick={handleAddContactPerson}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 hover:bg-amber-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Person
              </button>
            </div>

            <div className="space-y-3">
              {contacts.map((cp, idx) => (
                <div
                  key={cp.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    cp.isPrimary
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Contact Person #{idx + 1}
                      </span>
                      {cp.isPrimary ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                          <Star className="w-2.5 h-2.5 fill-current" /> Primary Contact
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(cp.id)}
                          className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
                        >
                          Set as Primary
                        </button>
                      )}
                    </div>

                    {contacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveContactPerson(cp.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove Contact Person"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                        Person Full Name <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={cp.name}
                        onChange={(e) => handleUpdateContactPerson(cp.id, 'name', e.target.value)}
                        placeholder="e.g. Mr. Sreevalsan Menon"
                        className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-[#881337] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                        Designation / Role
                      </label>
                      <input
                        type="text"
                        value={cp.designation || ''}
                        onChange={(e) => handleUpdateContactPerson(cp.id, 'designation', e.target.value)}
                        placeholder="e.g. Marketing Director / PRO / Manager"
                        className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-[#881337] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                        Mobile Phone / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={cp.phone || ''}
                        onChange={(e) => {
                          handleUpdateContactPerson(cp.id, 'phone', e.target.value);
                          if (!cp.whatsapp) {
                            handleUpdateContactPerson(cp.id, 'whatsapp', e.target.value);
                          }
                        }}
                        placeholder="+971 50 123 4567"
                        className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-[#881337] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={cp.email || ''}
                        onChange={(e) => handleUpdateContactPerson(cp.id, 'email', e.target.value)}
                        placeholder="person@organization.ae"
                        className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-[#881337] outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags & Association Notes */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#881337] dark:text-rose-400" />
              Tags &amp; Strategic Notes
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Classification Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="e.g. Festival Sponsor, Gold Sponsor, Medical Camp"
                  className="flex-1 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-[#881337] outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Add
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Collaboration Notes &amp; Association Privileges
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mention sponsorship tier, member discounts, annual contribution, or key agreement notes..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-[#881337] outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg bg-[#881337] hover:bg-[#700f2b] text-white shadow-md transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Contact Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
