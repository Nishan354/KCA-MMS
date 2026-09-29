import React, { useState, useMemo } from 'react';
import { ContactEntry, ContactCategory, CONTACT_CATEGORIES, ContactPerson } from '../types/contact';
import { UserSession, isUnitOperatorRole, hasAdminPrivilege } from '../types/member';
import { exportContactsCsv, exportContactsVCard } from '../utils/contactStorage';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  Building2,
  Users,
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  MapPin,
  Globe,
  ExternalLink,
  MessageCircle,
  Download,
  Printer,
  Edit2,
  Trash2,
  Star,
  Tag,
  ShieldAlert,
  ChevronRight,
  UserCheck,
  Award,
  Sparkles,
  LayoutGrid,
  List,
} from 'lucide-react';

interface ContactBankViewProps {
  contacts: ContactEntry[];
  units: string[];
  userSession?: UserSession | null;
  onOpenAddContact: () => void;
  onEditContact: (contact: ContactEntry) => void;
  onDeleteContact: (id: string) => void;
}

export const ContactBankView: React.FC<ContactBankViewProps> = ({
  contacts,
  units,
  userSession,
  onOpenAddContact,
  onEditContact,
  onDeleteContact,
}) => {
  const isUnitOp = !!userSession && isUnitOperatorRole(userSession.role);
  const isAdmin = !userSession || hasAdminPrivilege(userSession.role);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedUnit, setSelectedUnit] = useState<string>(
    isUnitOp && userSession.unit ? userSession.unit : 'ALL'
  );
  const [selectedEmirate, setSelectedEmirate] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [contactToDelete, setContactToDelete] = useState<ContactEntry | null>(null);

  // Filter contacts based on unit restriction (RBAC) and UI search/filters
  const visibleContacts = useMemo(() => {
    return contacts.filter((c) => {
      // 1. RBAC unit scoping: Unit Operators can only see their unit + Global / Central contacts
      if (isUnitOp && userSession?.unit) {
        const isAssigned = c.unit === userSession.unit || c.unit === 'Global / Central' || c.unit === 'Central';
        if (!isAssigned) return false;
      }

      // 2. Unit filter dropdown (if Admin chooses specific unit)
      if (selectedUnit !== 'ALL') {
        if (c.unit !== selectedUnit) return false;
      }

      // 3. Category filter
      if (selectedCategory !== 'ALL' && c.category !== selectedCategory) {
        return false;
      }

      // 4. Emirate filter
      if (selectedEmirate !== 'ALL' && c.emirate !== selectedEmirate) {
        return false;
      }

      // 5. Search query
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchOrg = c.organizationName.toLowerCase().includes(term);
        const matchMalayalam = c.malayalamName?.toLowerCase().includes(term);
        const matchCity = c.city?.toLowerCase().includes(term);
        const matchNotes = c.notes?.toLowerCase().includes(term);
        const matchTags = c.tags?.some((t) => t.toLowerCase().includes(term));
        const matchPerson = c.contacts.some(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.designation?.toLowerCase().includes(term) ||
            p.phone?.includes(term) ||
            p.email?.toLowerCase().includes(term)
        );
        return matchOrg || matchMalayalam || matchCity || matchNotes || matchTags || matchPerson;
      }

      return true;
    });
  }, [contacts, isUnitOp, userSession, selectedUnit, selectedCategory, selectedEmirate, searchTerm]);

  // Metric aggregates
  const stats = useMemo(() => {
    const totalOrgs = visibleContacts.length;
    const totalPeople = visibleContacts.reduce((acc, c) => acc + (c.contacts?.length || 0), 0);
    const totalSponsors = visibleContacts.filter((c) => c.category === 'Sponsor & Patron').length;
    const totalGovtNorka = visibleContacts.filter(
      (c) => c.category === 'Government / Embassy / NORKA'
    ).length;
    return { totalOrgs, totalPeople, totalSponsors, totalGovtNorka };
  }, [visibleContacts]);

  const handlePrintDirectory = () => {
    window.print();
  };

  const availableUnits = ['ALL', 'Global / Central', ...units];

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-[#881337] dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                <Building2 className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase font-display">
                External Contact Bank
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                Directory &amp; Sponsors
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Centralized repository for NORKA Roots, Government Consulates, Title Sponsors, Cultural Associations, Media Partners, and Unit Stakeholders.
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportContactsCsv(visibleContacts)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
              title="Export filtered directory to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrintDirectory}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
              title="Print contact directory"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Directory</span>
            </button>

            <button
              onClick={onOpenAddContact}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#881337] hover:bg-[#700f2b] text-white shadow-md transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Contact</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Organizations / Entities
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.totalOrgs}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Key Representatives
            </div>
            <div className="text-xl font-black text-rose-700 dark:text-rose-400 mt-0.5">
              {stats.totalPeople}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Sponsors &amp; Patrons
            </div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {stats.totalSponsors}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              NORKA &amp; Government
            </div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {stats.totalGovtNorka}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by organization name, person, phone, designation, or keyword..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#881337] outline-none transition-all"
            />
          </div>

          {/* Unit and Category Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Unit selector (Disabled/locked if Unit Operator) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Unit:</span>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                disabled={isUnitOp}
                className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#881337] outline-none disabled:opacity-60 cursor-pointer"
              >
                {availableUnits.map((u) => (
                  <option key={u} value={u}>
                    {u === 'ALL' ? 'All Units' : u}
                  </option>
                ))}
              </select>
            </div>

            {/* Emirate filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Emirate:</span>
              <select
                value={selectedEmirate}
                onChange={(e) => setSelectedEmirate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#881337] outline-none cursor-pointer"
              >
                <option value="ALL">All Emirates</option>
                <option value="Fujairah">Fujairah</option>
                <option value="Sharjah">Sharjah</option>
                <option value="Dubai">Dubai</option>
                <option value="Abu Dhabi">Abu Dhabi</option>
                <option value="Ras Al Khaimah">RAK</option>
                <option value="Ajman">Ajman</option>
                <option value="Umm Al Quwain">UAQ</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-[#881337] dark:text-rose-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-[#881337] dark:text-rose-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-[#881337] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Categories ({contacts.length})
          </button>
          {CONTACT_CATEGORIES.map((cat) => {
            const count = contacts.filter((c) => c.category === cat).length;
            const isCatActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isCatActive
                    ? 'bg-[#881337] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Directory Display Area */}
      {visibleContacts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs">
          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Contact Records Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedCategory !== 'ALL' || selectedUnit !== 'ALL'
              ? 'No matching contacts for the current search/filter combination.'
              : 'The Contact Bank is currently empty. Add your first sponsor or organization stakeholder.'}
          </p>
          <button
            onClick={onOpenAddContact}
            className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 rounded-lg text-xs font-bold bg-[#881337] hover:bg-[#700f2b] text-white shadow-md transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Contact Entry
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {visibleContacts.map((contact) => {
            const primaryPerson = contact.contacts?.find((p) => p.isPrimary) || contact.contacts?.[0];
            const hasMoreContacts = contact.contacts?.length > 1;

            return (
              <div
                key={contact.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top Banner */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-[#881337] dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60">
                      {contact.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {contact.unit}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white group-hover:text-[#881337] dark:group-hover:text-rose-400 transition-colors">
                    {contact.organizationName}
                  </h3>
                  {contact.malayalamName && (
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      {contact.malayalamName}
                    </div>
                  )}

                  {contact.city && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="truncate">
                        {contact.address ? `${contact.address}, ` : ''}
                        {contact.city}, {contact.emirate || 'UAE'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary Contact Person Highlight Box */}
                <div className="p-5 space-y-3.5 flex-1 bg-slate-50/50 dark:bg-slate-800/20">
                  {primaryPerson ? (
                    <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {primaryPerson.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                          {primaryPerson.designation || 'Lead'}
                        </span>
                      </div>

                      {/* Phone & WhatsApp Actions */}
                      <div className="flex items-center gap-2 mt-2">
                        {primaryPerson.phone && (
                          <a
                            href={`tel:${primaryPerson.phone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span className="font-mono text-[11px]">{primaryPerson.phone}</span>
                          </a>
                        )}

                        {primaryPerson.whatsapp && (
                          <a
                            href={`https://wa.me/${primaryPerson.whatsapp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {primaryPerson.email && (
                          <a
                            href={`mailto:${primaryPerson.email}`}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 transition-colors"
                            title="Send Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs italic text-slate-400">No representative assigned</div>
                  )}

                  {/* Additional contacts indicator */}
                  {hasMoreContacts && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>+{contact.contacts.length - 1} more contact person(s) registered</span>
                    </div>
                  )}

                  {/* Notes / Tags */}
                  {contact.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic">
                      "{contact.notes}"
                    </p>
                  )}

                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => exportContactsVCard(contact)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                    title="Download vCard contact file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>vCard</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditContact(contact)}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-[#881337] dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Edit Contact"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setContactToDelete(contact)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete Contact"
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
        /* Tabular Directory View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Organization / Entity</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Unit</th>
                  <th className="p-3.5">Primary Contact</th>
                  <th className="p-3.5">Phone &amp; WhatsApp</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {visibleContacts.map((contact) => {
                  const primaryPerson = contact.contacts?.find((p) => p.isPrimary) || contact.contacts?.[0];
                  return (
                    <tr key={contact.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {contact.organizationName}
                        </div>
                        {contact.malayalamName && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {contact.malayalamName}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono">
                          {contact.city || 'UAE'}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-[#881337] dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60">
                          {contact.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold font-mono">{contact.unit}</td>
                      <td className="p-3.5">
                        {primaryPerson ? (
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {primaryPerson.name}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {primaryPerson.designation || 'Representative'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono">
                        {primaryPerson?.phone ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${primaryPerson.phone}`}
                              className="text-slate-800 dark:text-slate-200 hover:underline"
                            >
                              {primaryPerson.phone}
                            </a>
                            {primaryPerson.whatsapp && (
                              <a
                                href={`https://wa.me/${primaryPerson.whatsapp.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:text-emerald-700"
                                title="WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ) : (
                          contact.generalPhone || '-'
                        )}
                      </td>
                      <td className="p-3.5 font-mono">
                        {primaryPerson?.email ? (
                          <a
                            href={`mailto:${primaryPerson.email}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[150px] inline-block"
                          >
                            {primaryPerson.email}
                          </a>
                        ) : (
                          contact.generalEmail || '-'
                        )}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => exportContactsVCard(contact)}
                            className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            title="vCard"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditContact(contact)}
                            className="p-1 rounded text-slate-500 hover:text-[#881337] dark:hover:text-rose-400"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setContactToDelete(contact)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Contact Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!contactToDelete}
        title="Delete Contact Entry"
        itemName={contactToDelete?.organizationName}
        message={`Are you sure you want to permanently delete "${contactToDelete?.organizationName}" from the Contact Bank?`}
        confirmLabel="Delete Contact"
        onConfirm={() => {
          if (contactToDelete) {
            onDeleteContact(contactToDelete.id);
            setContactToDelete(null);
          }
        }}
        onClose={() => setContactToDelete(null)}
      />
    </div>
  );
};
