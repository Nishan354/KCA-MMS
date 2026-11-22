import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Member, CustomFieldDefinition, UserSession, hasAdminPrivilege, isUnitOperatorRole } from '../types/member';
import { formatDate, formatAED, getExpiryStatus, isMemberEffectivelyActive, getEffectiveMemberStatus } from '../utils/idGenerator';
import { CommitteeBadge } from './CommitteeBadge';
import {
  Search,
  Filter,
  IdCard,
  FileText,
  Edit,
  Trash2,
  RefreshCw,
  Eye,
  CheckSquare,
  Square,
  ArrowUpDown,
  Printer,
  UserPlus,
  MapPin,
  Sliders,
  Building2,
  Send,
  X,
  Award,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  User,
  ChevronDown,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface MemberTableProps {
  members: Member[];
  units: string[];
  customFields?: CustomFieldDefinition[];
  userSession?: UserSession;
  initialGenderFilter?: string;
  isLadiesWingMode?: boolean;
  title?: string;
  subtitle?: string;
  onSelectMember?: (member: Member) => void;
  onViewDetails?: (member: Member) => void;
  onViewIdCard?: (member: Member) => void;
  onViewReceipt?: (member: Member) => void;
  onViewApplicationForm?: (member: Member | null) => void;
  onEditMember?: (member: Member) => void;
  onDeleteMember?: (id: string) => void;
  onBulkDeleteMembers?: (ids: string[]) => void;
  onRenewMember?: (member: Member) => void;
  onAddNewMember?: () => void;
  onOpenNewMember?: () => void;
  onBatchPrint?: (selectedMembers: Member[]) => void;
  onOpenBatchPrint?: (selectedMembers: Member[]) => void;
  onOpenWhatsApp?: (member: Member) => void;
  onOpenUnitManager?: () => void;
  onOpenFieldManager?: () => void;
  onUpdateMemberUnit?: (member: Member, newUnit: string) => void;
  onToggleMemberStatus?: (member: Member) => void;
  onOpenCertificateGenerator?: (initialData?: {
    name?: string;
    unit?: string;
    course?: string;
    memberId?: string;
    designation?: string;
    citation?: string;
    selectedMembers?: Member[];
  }) => void;
}

type SortField = 'membershipId' | 'fullName' | 'unit' | 'joinDate' | 'expiryDate' | 'registrationDate' | 'feeAmountAED' | 'status';

export const MemberTable: React.FC<MemberTableProps> = ({
  members,
  units,
  customFields = [],
  userSession,
  initialGenderFilter = 'ALL',
  isLadiesWingMode = false,
  title,
  subtitle,
  onSelectMember,
  onViewDetails,
  onViewIdCard,
  onViewReceipt,
  onViewApplicationForm,
  onEditMember,
  onDeleteMember,
  onBulkDeleteMembers,
  onRenewMember,
  onAddNewMember,
  onOpenNewMember,
  onBatchPrint,
  onOpenBatchPrint,
  onOpenWhatsApp,
  onOpenUnitManager,
  onOpenFieldManager,
  onUpdateMemberUnit,
  onToggleMemberStatus,
  onOpenCertificateGenerator,
}) => {
  const handleSelectMember = onSelectMember || onViewDetails || (() => {});
  const handleNewMember = onOpenNewMember || onAddNewMember || (() => {});
  const handleBatchPrint = onOpenBatchPrint || onBatchPrint || (() => {});
  const isAdmin = !userSession || hasAdminPrivilege(userSession.role);
  const isUnitOp = !!userSession && isUnitOperatorRole(userSession.role);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBloodGroups, setSelectedBloodGroups] = useState<string[]>([]);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>(() => {
    if (isLadiesWingMode || initialGenderFilter === 'Female') return ['Female'];
    if (initialGenderFilter && initialGenderFilter !== 'ALL') return [initialGenderFilter];
    return [];
  });
  const [openFilterMenu, setOpenFilterMenu] = useState<string | null>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setOpenFilterMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMultiFilter = (
    value: string,
    currentList: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(
      currentList.includes(value)
        ? currentList.filter((item) => item !== value)
        : [...currentList, value]
    );
  };

  // Discover all distinct member types & subcommittees/wings for multi-type filtering
  const availableTypeOptions = useMemo(() => {
    const baseTypes = [
      'General Member',
      'Executive Member',
      'Central Committee Member',
      'Central Coordination Committee',
      'Executive Coordination Committee',
      'Ladies Wing',
    ];
    const extraWings = new Set<string>();
    members.forEach((m) => {
      if (m.membershipType && !baseTypes.includes(m.membershipType)) {
        extraWings.add(m.membershipType);
      }
      if (m.subcommittee && m.subcommittee !== 'General' && !baseTypes.includes(m.subcommittee)) {
        extraWings.add(m.subcommittee);
      }
    });
    return [...baseTypes, ...Array.from(extraWings)];
  }, [members]);

  const activeFilterCount =
    selectedStatuses.length +
    selectedUnits.length +
    selectedTypes.length +
    selectedCategories.length +
    selectedBloodGroups.length +
    selectedPayments.length +
    (isLadiesWingMode ? 0 : selectedGenders.length);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedStatuses([]);
    setSelectedUnits([]);
    setSelectedTypes([]);
    setSelectedCategories([]);
    setSelectedBloodGroups([]);
    setSelectedPayments([]);
    if (!isLadiesWingMode) {
      setSelectedGenders([]);
    }
    setOpenFilterMenu(null);
  };

  const [sortField, setSortField] = useState<SortField>('membershipId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingUnitMemberId, setEditingUnitMemberId] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Visible custom field columns
  const tableCustomFields = useMemo(() => {
    return customFields.filter((cf) => cf.showInTable !== false);
  }, [customFields]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      
      let matchesCustom = false;
      if (q && m.customFields) {
        matchesCustom = Object.values(m.customFields).some((val) =>
          String(val).toLowerCase().includes(q)
        );
      }

      const matchesSearch =
        !q ||
        m.membershipId.toLowerCase().includes(q) ||
        m.fullName.toLowerCase().includes(q) ||
        (m.malayalamName && m.malayalamName.toLowerCase().includes(q)) ||
        m.phoneUAE.toLowerCase().includes(q) ||
        (m.emiratesId && m.emiratesId.toLowerCase().includes(q)) ||
        m.unit.toLowerCase().includes(q) ||
        (m.profession && m.profession.toLowerCase().includes(q)) ||
        matchesCustom;

      // Multi-select Status filtering based on effective activity and renewal status
      const isEffActive = isMemberEffectivelyActive(m);
      const memberEffStatusKey = isEffActive
        ? 'ACTIVE'
        : m.status === 'Pending'
        ? 'PENDING'
        : 'INACTIVE';
      const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(memberEffStatusKey);

      // Multi-select Unit filtering
      const matchesUnit = selectedUnits.length === 0 || selectedUnits.includes(m.unit);

      // Multi-select Member Type & Wing/Subcommittee filtering
      const genLower = (m.gender || '').toLowerCase().trim();
      const isFemaleMember =
        genLower === 'female' || genLower.startsWith('f') || genLower === 'woman';
      const matchesType =
        selectedTypes.length === 0 ||
        selectedTypes.some((selType) => {
          if (selType === 'Ladies Wing') {
            return m.subcommittee === 'Ladies Wing' || isFemaleMember;
          }
          if (selType === 'Central Committee Member') {
            return (
              m.membershipType === 'Central Committee Member' || m.committeeTier === 'Central'
            );
          }
          if (selType === 'Central Coordination Committee') {
            return (
              m.coordinationCommittee === 'Central Coordination Committee' ||
              m.committeeTier === 'Central Coordination'
            );
          }
          if (selType === 'Executive Coordination Committee') {
            return (
              m.coordinationCommittee === 'Executive Coordination Committee' ||
              m.committeeTier === 'Executive Coordination'
            );
          }
          if (selType === 'Executive Member') {
            return m.membershipType === 'Executive Member' || m.committeeTier === 'Unit';
          }
          return m.membershipType === selType || m.subcommittee === selType;
        });

      // Multi-select Registration Category filtering
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(m.registrationCategory);

      // Multi-select Blood Group filtering
      const matchesBlood =
        selectedBloodGroups.length === 0 || selectedBloodGroups.includes(m.bloodGroup);

      // Multi-select Payment Status filtering
      const matchesPayment =
        selectedPayments.length === 0 || selectedPayments.includes(m.paymentStatus);

      // Multi-select Gender filtering
      const normGender = isFemaleMember
        ? 'Female'
        : genLower === 'male' || genLower.startsWith('m') || genLower === 'man'
        ? 'Male'
        : 'Other';
      const matchesGender =
        selectedGenders.length === 0 || selectedGenders.includes(normGender);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesUnit &&
        matchesType &&
        matchesCategory &&
        matchesBlood &&
        matchesPayment &&
        matchesGender
      );
    });
  }, [
    members,
    searchQuery,
    selectedStatuses,
    selectedUnits,
    selectedTypes,
    selectedCategories,
    selectedBloodGroups,
    selectedPayments,
    selectedGenders,
  ]);

  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'feeAmountAED') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      if (sortField === 'membershipId') {
        const numA = parseInt(a.membershipId.replace(/[^0-9]/g, ''), 10) || 0;
        const numB = parseInt(b.membershipId.replace(/[^0-9]/g, ''), 10) || 0;
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }

      if (sortField === 'status') {
        const effA = isMemberEffectivelyActive(a) ? 'Active' : 'Inactive';
        const effB = isMemberEffectivelyActive(b) ? 'Active' : 'Inactive';
        return sortOrder === 'asc' ? effA.localeCompare(effB) : effB.localeCompare(effA);
      }

      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredMembers, sortField, sortOrder]);

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedMembers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedMembers.map((m) => m.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectedMemberList = members.filter((m) => selectedIds.includes(m.id));

  // High-performance pagination to eliminate tab switching latency
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedStatuses,
    selectedUnits,
    selectedTypes,
    selectedCategories,
    selectedBloodGroups,
    selectedPayments,
    selectedGenders,
    sortField,
    sortOrder,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedMembers.length / (pageSize === -1 ? sortedMembers.length || 1 : pageSize))
  );

  const paginatedMembers = useMemo(() => {
    if (pageSize === -1) return sortedMembers;
    const start = (currentPage - 1) * pageSize;
    return sortedMembers.slice(start, start + pageSize);
  }, [sortedMembers, currentPage, pageSize]);

  return (
    <div className="space-y-4 pb-12 antialiased">
      {/* Optional Ladies Wing / Custom Header Banner */}
      {isLadiesWingMode && (
        <div
          className="text-white p-5 rounded-2xl shadow-sm border border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-4"
          style={{ backgroundColor: 'var(--color-primary, #8b0000)' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-white border border-white/25 shrink-0 shadow-xs">
              <Award className="w-6 h-6 text-pink-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white font-display">
                  {title || 'Ladies Wing Register'}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  Dedicated Wing
                </span>
              </div>
              <p className="text-xs text-rose-100 mt-0.5">
                {subtitle || 'All female members are organized under KCA Fujairah Ladies Wing.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-black/20 px-3 py-1.5 rounded-xl border border-white/20 text-xs font-mono font-bold text-white">
              Total Enrolled: {members.filter((m) => (m.gender || '').toLowerCase().startsWith('f') || (m.gender || '').toLowerCase() === 'woman').length}
            </div>
          </div>
        </div>
      )}

      {/* Top Filter and Action Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Name, ID, Unit, Phone, Emirates ID..."
              className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && onOpenFieldManager && (
              <button
                type="button"
                onClick={onOpenFieldManager}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors border border-slate-200 shadow-2xs cursor-pointer"
                title="Customize Member Data Fields & Attributes"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-600" />
                <span>Customize Data Fields ({customFields.length})</span>
              </button>
            )}

            {isAdmin && selectedIds.length > 0 && onBulkDeleteMembers && (
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer animate-fadeIn"
                title="Delete all selected members"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            )}

            {selectedIds.length > 0 && onOpenCertificateGenerator && (
              <button
                type="button"
                onClick={() => onOpenCertificateGenerator({ selectedMembers: selectedMemberList })}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer animate-fadeIn"
                title="Generate certificates for all selected members"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Bulk Certificates ({selectedIds.length})</span>
              </button>
            )}

            {onViewApplicationForm && (
              <button
                type="button"
                onClick={() => onViewApplicationForm(null)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                title="View, Print or Download Blank Membership Application Form (Free Form)"
              >
                <FileText className="w-3.5 h-3.5 text-purple-700" />
                <span>Blank Application Form</span>
              </button>
            )}

            <button
              onClick={() => handleBatchPrint(selectedMemberList.length > 0 ? selectedMemberList : sortedMembers)}
              disabled={sortedMembers.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Batch Print {selectedIds.length > 0 ? `(${selectedIds.length})` : `(${sortedMembers.length})`}</span>
            </button>

            <button
              onClick={handleNewMember}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8b0000] hover:bg-[#700000] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 border border-[#700000]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isUnitOp && userSession?.unit ? `+ ${userSession.unit} Member` : 'Register Member'}</span>
            </button>
          </div>
        </div>

        {/* Unit Scoped Banner for Unit Operators */}
        {isUnitOp && userSession?.unit && (
          <div className="flex items-center justify-between p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#8b0000] shrink-0" />
              <span>
                <strong>{userSession.unit} Unit Portal</strong> &mdash; Managing registrations and ID cards for <strong>{userSession.unit}</strong>.
              </span>
            </div>
            <span className="font-mono text-[11px] bg-rose-100 text-[#8b0000] px-2 py-0.5 rounded font-bold border border-rose-300">
              Series: {userSession.unit.includes('Kal') ? 'KCA-KB-' : userSession.unit.includes('Khor') ? 'KCA-KF-' : userSession.unit.includes('Dib') ? 'KCA-DB-' : 'KCA-FU-'}1001
            </span>
          </div>
        )}

        {/* Multi-Select Filter Dropdowns & Quick Type Chooser */}
        <div ref={filterBarRef} className="space-y-2.5 pt-2 border-t border-slate-200 text-xs">
          {/* Quick Multi-Select Member Type & Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Choose Types (Multi-Select):
            </span>
            {availableTypeOptions.map((typeOpt) => {
              const isSelected = selectedTypes.includes(typeOpt);
              return (
                <button
                  key={typeOpt}
                  type="button"
                  onClick={() => toggleMultiFilter(typeOpt, selectedTypes, setSelectedTypes)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[#8b0000] text-white border-[#8b0000] shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  <span>{typeOpt}</span>
                </button>
              );
            })}
          </div>

          {/* Multi-Select Dropdown Menus Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Multi-Select Member Status */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenFilterMenu(openFilterMenu === 'status' ? null : 'status')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedStatuses.length > 0
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-400'
                    : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>
                  {selectedStatuses.length === 0
                    ? `All Statuses (${members.length})`
                    : `Status (${selectedStatuses.length} selected)`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
              {openFilterMenu === 'status' && (
                <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-30 space-y-1">
                  <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-500">
                    <span>Select Multiple Statuses</span>
                    {selectedStatuses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedStatuses([])}
                        className="text-rose-600 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  {[
                    {
                      id: 'ACTIVE',
                      label: `🟢 Active (${members.filter(isMemberEffectivelyActive).length})`,
                    },
                    {
                      id: 'INACTIVE',
                      label: `🔴 Inactive / Unrenewed (${members.filter((m) => !isMemberEffectivelyActive(m) && m.status !== 'Pending').length})`,
                    },
                    {
                      id: 'PENDING',
                      label: `🟡 Pending (${members.filter((m) => m.status === 'Pending').length})`,
                    },
                  ].map((opt) => {
                    const checked = selectedStatuses.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        onClick={() => toggleMultiFilter(opt.id, selectedStatuses, setSelectedStatuses)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer select-none ${
                          checked ? 'bg-rose-50 text-rose-900 font-bold border border-rose-200' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-[#8b0000] focus:ring-[#8b0000]"
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Multi-Select Units (Admins) */}
            {isAdmin ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenFilterMenu(openFilterMenu === 'unit' ? null : 'unit')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedUnits.length > 0
                      ? 'bg-rose-50 text-[#8b0000] border-rose-300 font-bold'
                      : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span>
                    {selectedUnits.length === 0
                      ? `All Units (${units.length})`
                      : `Units: ${selectedUnits.join(', ')}`}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>
                {openFilterMenu === 'unit' && (
                  <div className="absolute left-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-30 space-y-1 max-h-64 overflow-y-auto">
                    <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-500">
                      <span>Choose Multiple Units</span>
                      {selectedUnits.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedUnits([])}
                          className="text-[#8b0000] hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    {units.map((u) => {
                      const checked = selectedUnits.includes(u);
                      const count = members.filter((m) => m.unit === u).length;
                      return (
                        <label
                          key={u}
                          onClick={() => toggleMultiFilter(u, selectedUnits, setSelectedUnits)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer select-none ${
                            checked ? 'bg-rose-50 text-[#8b0000] font-bold border border-rose-200' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {}}
                              className="rounded border-slate-300 text-[#8b0000]"
                            />
                            <span>{u}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{count}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-bold text-xs flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#8b0000]" />
                <span>Unit: {userSession?.unit || 'Assigned Unit'}</span>
              </div>
            )}

            {/* 3. Multi-Select Member Types & Wings Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenFilterMenu(openFilterMenu === 'type' ? null : 'type')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedTypes.length > 0
                    ? 'bg-rose-50 text-[#8b0000] border-rose-300 font-bold'
                    : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>
                  {selectedTypes.length === 0
                    ? 'All Member Types'
                    : `Types (${selectedTypes.length} chosen)`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
              {openFilterMenu === 'type' && (
                <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-30 space-y-1 max-h-64 overflow-y-auto">
                  <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-500">
                    <span>Choose Multiple Member Types</span>
                    {selectedTypes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedTypes([])}
                        className="text-[#8b0000] hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  {availableTypeOptions.map((typeOpt) => {
                    const checked = selectedTypes.includes(typeOpt);
                    return (
                      <label
                        key={typeOpt}
                        onClick={() => toggleMultiFilter(typeOpt, selectedTypes, setSelectedTypes)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer select-none ${
                          checked ? 'bg-rose-50 text-[#8b0000] font-bold border border-rose-200' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-[#8b0000]"
                        />
                        <span>{typeOpt}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Multi-Select Registration Category (New / Renewal / Lifetime) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenFilterMenu(openFilterMenu === 'category' ? null : 'category')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedCategories.length > 0
                    ? 'bg-rose-50 text-[#8b0000] border-rose-300 font-bold'
                    : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>
                  {selectedCategories.length === 0
                    ? 'All Categories (New / Renewal)'
                    : `Category: ${selectedCategories.join(', ')}`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
              {openFilterMenu === 'category' && (
                <div className="absolute left-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-30 space-y-1">
                  <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-500">
                    <span>Choose Categories</span>
                    {selectedCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCategories([])}
                        className="text-[#8b0000] hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  {['New', 'Renewal', 'Lifetime'].map((cat) => {
                    const checked = selectedCategories.includes(cat);
                    return (
                      <label
                        key={cat}
                        onClick={() => toggleMultiFilter(cat, selectedCategories, setSelectedCategories)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer select-none ${
                          checked ? 'bg-rose-50 text-[#8b0000] font-bold border border-rose-200' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-[#8b0000]"
                        />
                        <span>{cat} Members</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. Multi-Select Gender */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenFilterMenu(openFilterMenu === 'gender' ? null : 'gender')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedGenders.length > 0
                    ? 'bg-rose-50 text-[#8b0000] border-rose-300 font-bold'
                    : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>
                  {selectedGenders.length === 0
                    ? 'All Genders'
                    : `Gender: ${selectedGenders.join(', ')}`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
              {openFilterMenu === 'gender' && (
                <div className="absolute left-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-30 space-y-1">
                  <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-500">
                    <span>Choose Gender</span>
                    {selectedGenders.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedGenders([])}
                        className="text-[#8b0000] hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  {[
                    { id: 'Male', label: '👨 Male' },
                    { id: 'Female', label: '👩 Female / Ladies Wing' },
                    { id: 'Other', label: 'Other' },
                  ].map((g) => {
                    const checked = selectedGenders.includes(g.id);
                    return (
                      <label
                        key={g.id}
                        onClick={() => toggleMultiFilter(g.id, selectedGenders, setSelectedGenders)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer select-none ${
                          checked ? 'bg-rose-50 text-[#8b0000] font-bold border border-rose-200' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-[#8b0000]"
                        />
                        <span>{g.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 6. Multi-Select Blood Group */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenFilterMenu(openFilterMenu === 'blood' ? null : 'blood')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedBloodGroups.length > 0
                    ? 'bg-rose-50 text-[#8b0000] border-rose-300 font-bold'
                    : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>
                  {selectedBloodGroups.length === 0
                    ? 'All Blood Groups'
                    : `Blood: ${selectedBloodGroups.join(', ')}`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
              {openFilterMenu === 'blood' && (
                <div className="absolute left-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 z-30">
                  <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-500">
                    <span>Choose Blood Groups</span>
                    {selectedBloodGroups.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedBloodGroups([])}
                        className="text-[#8b0000] hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => {
                      const checked = selectedBloodGroups.includes(bg);
                      return (
                        <button
                          key={bg}
                          type="button"
                          onClick={() =>
                            toggleMultiFilter(bg, selectedBloodGroups, setSelectedBloodGroups)
                          }
                          className={`py-1.5 rounded-lg font-mono text-xs font-bold border transition-colors cursor-pointer ${
                            checked
                              ? 'bg-[#8b0000] text-white border-[#8b0000]'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          }`}
                        >
                          {bg}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 7. Multi-Select Payment Status */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenFilterMenu(openFilterMenu === 'payment' ? null : 'payment')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedPayments.length > 0
                    ? 'bg-rose-50 text-[#8b0000] border-rose-300 font-bold'
                    : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>
                  {selectedPayments.length === 0
                    ? 'All Payments'
                    : `Payment: ${selectedPayments.join(', ')}`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
              {openFilterMenu === 'payment' && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-30 space-y-1">
                  <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-500">
                    <span>Payment Status</span>
                    {selectedPayments.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedPayments([])}
                        className="text-[#8b0000] hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  {['Paid', 'Pending', 'Waived'].map((pay) => {
                    const checked = selectedPayments.includes(pay);
                    return (
                      <label
                        key={pay}
                        onClick={() => toggleMultiFilter(pay, selectedPayments, setSelectedPayments)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer select-none ${
                          checked ? 'bg-rose-50 text-[#8b0000] font-bold border border-rose-200' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-[#8b0000]"
                        />
                        <span>{pay}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Filters ({activeFilterCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 select-none">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <button onClick={toggleSelectAll} className="p-1 hover:text-slate-900 cursor-pointer">
                    {selectedIds.length === sortedMembers.length && sortedMembers.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-[#8b0000]" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 hover:text-[#8b0000]" />
                    )}
                  </button>
                </th>
                <th
                  onClick={() => handleSort('membershipId')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Member ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('fullName')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Member Details</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                {/* Status Column Header */}
                <th
                  onClick={() => handleSort('status')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('unit')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Unit (Area)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5">Blood Group</th>

                {/* Member Joined Date */}
                <th
                  onClick={() => handleSort('joinDate')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Joined Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* Dynamic Custom Field Table Headers */}
                {tableCustomFields.map((cf) => (
                  <th key={cf.id} className="p-3.5 whitespace-nowrap text-slate-700 font-semibold">
                    {cf.label}
                  </th>
                ))}

                <th
                  onClick={() => handleSort('expiryDate')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Validity / Expiry</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('feeAmountAED')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Fee (AED)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5 text-center">Actions &amp; ID Card</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {sortedMembers.length === 0 ? (
                <tr>
                  <td colSpan={9 + tableCustomFields.length} className="p-12 text-center text-slate-500">
                    No members match your search criteria.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((m) => {
                  const isSelected = selectedIds.includes(m.id);
                  const expiry = getExpiryStatus(m.expiryDate);
                  const isEditingUnit = editingUnitMemberId === m.id;

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-rose-50/70' : ''
                      }`}
                    >
                      {/* Select checkbox */}
                      <td className="p-3.5 text-center">
                        <button onClick={() => toggleSelect(m.id)} className="p-1 cursor-pointer">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#8b0000]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                          )}
                        </button>
                      </td>

                      {/* ID No */}
                      <td className="p-3.5 font-mono font-bold whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-xs font-bold border bg-rose-50 text-[#8b0000] border-rose-200">
                          {m.membershipId}
                        </span>
                      </td>

                      {/* Member Info */}
                      <td className="p-3.5 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shadow-2xs shrink-0 bg-slate-100 flex items-center justify-center">
                            {m.photoUrl ? (
                              <img
                                src={m.photoUrl}
                                alt={m.fullName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <User className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <div
                              onClick={() => handleSelectMember(m)}
                              className="font-bold text-slate-900 hover:text-[#8b0000] hover:underline cursor-pointer truncate"
                            >
                              {m.fullName}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {m.phoneUAE}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {m.membershipType} &bull; {m.registrationCategory}
                            </div>
                            {/* Committee Badge & Coordination Committee Tag */}
                            {(m.subcommittee || m.designation || m.committeeTier || m.coordinationCommittee) && (
                              <div className="pt-0.5 flex flex-wrap items-center gap-1">
                                <CommitteeBadge member={m} size="sm" />
                                {m.coordinationCommittee && (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider border ${
                                      m.coordinationCommittee === 'Central Coordination Committee'
                                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                                        : 'bg-cyan-50 text-cyan-800 border-cyan-300'
                                    }`}
                                    title={`${m.coordinationCommittee}${m.coordinationDesignation ? ` — ${m.coordinationDesignation}` : ''}`}
                                  >
                                    <span>
                                      {m.coordinationCommittee === 'Central Coordination Committee'
                                        ? 'CCC'
                                        : 'ECC'}
                                      {m.coordinationDesignation
                                        ? `: ${m.coordinationDesignation}`
                                        : ''}
                                    </span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status with Color Segregation and Quick One-Click Toggle */}
                      <td className="p-3.5 whitespace-nowrap text-center">
                        <div className="flex flex-col items-center gap-1">
                          {isMemberEffectivelyActive(m) ? (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"
                              title="Active Member (Renewed & Valid)"
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                              <span>Active</span>
                            </span>
                          ) : m.status === 'Pending' ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                              title="Pending Approval"
                            >
                              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                              <span>Pending</span>
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs"
                              title={expiry.isExpired ? `Inactive: Membership Expired (${formatDate(m.expiryDate)})` : 'Inactive Member'}
                            >
                              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                              <span>Inactive</span>
                            </span>
                          )}

                          {/* Quick One-Click Active/Inactive Switch Button */}
                          {onToggleMemberStatus && (
                            <button
                              type="button"
                              onClick={() => onToggleMemberStatus(m)}
                              className={`text-[10px] font-bold underline px-1 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer ${
                                isMemberEffectivelyActive(m) ? 'text-rose-600 hover:text-rose-800' : 'text-emerald-700 hover:text-emerald-900'
                              }`}
                              title={
                                isMemberEffectivelyActive(m)
                                  ? 'Click to Mark Inactive'
                                  : 'Click to Mark Active & Reactivate'
                              }
                            >
                              {isMemberEffectivelyActive(m) ? 'Mark Inactive' : 'Mark Active'}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Unit with quick edit switcher */}
                      <td className="p-3.5 whitespace-nowrap">
                        {isEditingUnit && onUpdateMemberUnit ? (
                          <div className="flex items-center gap-1">
                            <select
                              defaultValue={m.unit}
                              onChange={(e) => {
                                onUpdateMemberUnit(m, e.target.value);
                                setEditingUnitMemberId(null);
                              }}
                              className="text-xs font-semibold border border-slate-300 rounded px-1.5 py-0.5 bg-white text-slate-900 focus:outline-none"
                              autoFocus
                            >
                              {units.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => setEditingUnitMemberId(null)}
                              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 group">
                            <span className="font-semibold text-slate-800">{m.unit}</span>
                            {onUpdateMemberUnit && (
                              <button
                                onClick={() => setEditingUnitMemberId(m.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-700 transition-opacity cursor-pointer"
                                title="Change Unit"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Blood Group */}
                      <td className="p-3.5 whitespace-nowrap">
                        {m.bloodGroup ? (
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200">
                            {m.bloodGroup}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* Member Joined Date */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs text-slate-800 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {formatDate(m.joinDate || m.registrationDate)}
                        </span>
                      </td>

                      {/* Dynamic Custom Field Values */}
                      {tableCustomFields.map((cf) => {
                        const val = m.customFields ? m.customFields[cf.id] : undefined;
                        let display = '—';
                        if (val !== undefined && val !== null && val !== '') {
                          if (typeof val === 'boolean') {
                            display = val ? '✓ Yes' : '✕ No';
                          } else {
                            display = String(val);
                          }
                        }

                        return (
                          <td key={cf.id} className="p-3.5 whitespace-nowrap font-medium text-slate-700">
                            <span className="truncate max-w-[140px] block" title={display}>
                              {display}
                            </span>
                          </td>
                        );
                      })}

                      {/* Validity */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-mono text-slate-800 font-semibold">{formatDate(m.expiryDate)}</div>
                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${expiry.color}`}>
                          {expiry.label}
                        </span>
                      </td>

                      {/* Fee in AED with Color Segregation */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">
                          {formatAED(m.feeAmountAED)}
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              m.paymentStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : m.paymentStatus === 'Pending'
                                ? 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {m.paymentStatus}
                          </span>
                          <span
                            className={`text-[9px] font-semibold px-1 py-0.5 rounded ${
                              m.registrationCategory === 'Renewal'
                                ? 'bg-orange-50 text-orange-800 border border-orange-200'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {m.registrationCategory === 'Renewal' ? 'Renewal' : 'New'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {onViewIdCard && (
                            <button
                              onClick={() => onViewIdCard(m)}
                              className="p-1.5 rounded-lg text-white bg-sky-700 hover:bg-sky-800 shadow-2xs transition-colors cursor-pointer"
                              title="Generate Official ID Card"
                            >
                              <IdCard className="w-4 h-4" />
                            </button>
                          )}

                          {onViewApplicationForm && (
                            <button
                              onClick={() => onViewApplicationForm(m)}
                              className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition-colors cursor-pointer"
                              title="Generate Membership Application Form (Committee Approval)"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleSelectMember(m)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
                            title="View Profile Details"
                          >
                            <Eye className="w-4 h-4 text-slate-600" />
                          </button>

                          {onOpenWhatsApp && (
                            <button
                              onClick={() => onOpenWhatsApp(m)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                              title="Send WhatsApp Card & Message"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}

                          {onOpenCertificateGenerator && (
                            <button
                              onClick={() =>
                                onOpenCertificateGenerator({
                                  name: m.fullName,
                                  unit: m.unit,
                                  memberId: m.membershipId,
                                  designation: m.designation,
                                  citation: m.designation
                                    ? `in recognition of exceptional service as ${m.designation} (${m.subcommittee || m.unit})`
                                    : undefined,
                                })
                              }
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
                              title="Generate Official KCA Certificate"
                            >
                              <Award className="w-4 h-4" />
                            </button>
                          )}

                          {onViewReceipt && (
                            <button
                              onClick={() => onViewReceipt(m)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
                              title="View AED Payment Receipt"
                            >
                              <FileText className="w-4 h-4 text-emerald-700" />
                            </button>
                          )}

                          {onRenewMember && (
                            <button
                              onClick={() => onRenewMember(m)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
                              title="Renew Membership"
                            >
                              <RefreshCw className="w-4 h-4 text-amber-600" />
                            </button>
                          )}

                          {onEditMember && (
                            <button
                              onClick={() => onEditMember(m)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
                              title="Edit Member Details"
                            >
                              <Edit className="w-4 h-4 text-slate-600" />
                            </button>
                          )}

                          {onDeleteMember && (
                            <button
                              onClick={() => setMemberToDelete(m)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-400 transition-colors cursor-pointer"
                              title="Delete Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Clean White / Slate Pagination */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-3 flex-wrap">
            <span>
              Showing{' '}
              <strong className="text-slate-900 font-mono">
                {sortedMembers.length === 0 ? 0 : (currentPage - 1) * (pageSize === -1 ? sortedMembers.length : pageSize) + 1}
              </strong>
              {' '}-{' '}
              <strong className="text-slate-900 font-mono">
                {pageSize === -1 ? sortedMembers.length : Math.min(currentPage * pageSize, sortedMembers.length)}
              </strong>
              {' '}of <strong className="text-slate-900 font-mono">{sortedMembers.length}</strong> members
            </span>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[11px] text-slate-500">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-2 py-1 outline-none focus:border-[#8b0000] cursor-pointer"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={-1}>All</option>
              </select>
            </div>
          </div>

          {/* Page Controls */}
          {totalPages > 1 && pageSize !== -1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-2">
                <span className="text-slate-500 text-xs">Page</span>
                <span className="font-bold text-slate-900 font-mono">{currentPage}</span>
                <span className="text-slate-500 text-xs">of</span>
                <span className="font-bold text-slate-900 font-mono">{totalPages}</span>
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <span className="font-mono text-xs text-slate-900 font-bold bg-white px-3 py-1 rounded-lg border border-slate-300 shadow-2xs">
            Total Fees: {formatAED(sortedMembers.reduce((s, m) => s + (m.feeAmountAED || 0), 0))}
          </span>
        </div>
      </div>

      {/* In-App Delete Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Delete Member Record</h3>
            <p className="text-sm text-slate-600 text-center mt-2">
              Are you sure you want to delete <strong className="text-slate-900">{memberToDelete.fullName}</strong> ({memberToDelete.membershipId})? This action will sync across all devices.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteMember && memberToDelete) {
                    onDeleteMember(memberToDelete.id);
                    setMemberToDelete(null);
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Delete {selectedIds.length} Members</h3>
            <p className="text-sm text-slate-600 text-center mt-2">
              Are you sure you want to delete <strong className="text-slate-900">{selectedIds.length}</strong> selected member records? This change will immediately synchronize across all devices.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onBulkDeleteMembers && selectedIds.length > 0) {
                    onBulkDeleteMembers(selectedIds);
                    setSelectedIds([]);
                    setShowBulkDeleteModal(false);
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Confirm Bulk Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
