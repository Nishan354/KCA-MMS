import React, { useState, useMemo } from 'react';
import { Member, CustomFieldDefinition, UserSession, hasAdminPrivilege, isUnitOperatorRole } from '../types/member';
import { formatDate, formatAED, getExpiryStatus } from '../utils/idGenerator';
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
} from 'lucide-react';

interface MemberTableProps {
  members: Member[];
  units: string[];
  customFields?: CustomFieldDefinition[];
  userSession?: UserSession;
  onSelectMember?: (member: Member) => void;
  onViewDetails?: (member: Member) => void;
  onViewIdCard?: (member: Member) => void;
  onViewReceipt?: (member: Member) => void;
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
}

type SortField = 'membershipId' | 'fullName' | 'unit' | 'joinDate' | 'expiryDate' | 'registrationDate' | 'feeAmountAED';

export const MemberTable: React.FC<MemberTableProps> = ({
  members,
  units,
  customFields = [],
  userSession,
  onSelectMember,
  onViewDetails,
  onViewIdCard,
  onViewReceipt,
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
}) => {
  const handleSelectMember = onSelectMember || onViewDetails || (() => {});
  const handleNewMember = onOpenNewMember || onAddNewMember || (() => {});
  const handleBatchPrint = onOpenBatchPrint || onBatchPrint || (() => {});
  const isAdmin = !userSession || hasAdminPrivilege(userSession.role);
  const isUnitOp = !!userSession && isUnitOperatorRole(userSession.role);

  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [bloodFilter, setBloodFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

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

      const matchesUnit = unitFilter === 'ALL' || m.unit === unitFilter;
      const matchesType = typeFilter === 'ALL' || m.membershipType === typeFilter;
      const matchesCategory = categoryFilter === 'ALL' || m.registrationCategory === categoryFilter;
      const matchesBlood = bloodFilter === 'ALL' || m.bloodGroup === bloodFilter;
      const matchesPayment = paymentFilter === 'ALL' || m.paymentStatus === paymentFilter;

      return matchesSearch && matchesUnit && matchesType && matchesCategory && matchesBlood && matchesPayment;
    });
  }, [members, searchQuery, unitFilter, typeFilter, categoryFilter, bloodFilter, paymentFilter]);

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

  return (
    <div className="space-y-4 pb-12 antialiased">
      {/* Top Filter and Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Name, ID, Unit, Phone, Emirates ID..."
              className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && onOpenFieldManager && (
              <button
                onClick={onOpenFieldManager}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
                title="Modify field attributes or add custom fields"
              >
                <Sliders className="w-3.5 h-3.5" style={{ color: 'var(--color-primary, #881337)' }} />
                <span>Fields ({customFields.length})</span>
              </button>
            )}

            {isAdmin && onOpenUnitManager && (
              <button
                onClick={onOpenUnitManager}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
                title="Manage Units (Fujairah, Kalba, Khorfakhan, Dibba)"
              >
                <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--color-primary, #881337)' }} />
                <span>Units ({units.length})</span>
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              style={{ backgroundColor: 'var(--color-primary, #881337)' }}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isUnitOp && userSession?.unit ? `+ ${userSession.unit} Member` : 'Register Member'}</span>
            </button>
          </div>
        </div>

        {/* Unit Scoped Banner for Unit Operators */}
        {isUnitOp && userSession?.unit && (
          <div className="flex items-center justify-between p-3 bg-blue-50/90 border border-blue-200 rounded-lg text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-700 shrink-0" />
              <span>
                <strong>{userSession.unit} Unit Portal</strong> &mdash; Managing registrations and ID cards for <strong>{userSession.unit}</strong>.
              </span>
            </div>
            <span className="font-mono text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
              Series: {userSession.unit.includes('Kal') ? 'KCA-KB-' : userSession.unit.includes('Khor') ? 'KCA-KF-' : userSession.unit.includes('Dib') ? 'KCA-DB-' : 'KCA-FU-'}1001
            </span>
          </div>
        )}

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-400 font-bold uppercase tracking-wider text-[10px] mr-1">
            <Filter className="w-3 h-3" />
            Filters:
          </div>

          {/* Unit Filter - Only show for Admins */}
          {isAdmin ? (
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 font-semibold focus:bg-white outline-none cursor-pointer"
            >
              <option value="ALL">All Units ({members.length})</option>
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          ) : (
            <div className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold text-xs flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Unit: {userSession?.unit || 'Assigned Unit'}</span>
            </div>
          )}

          {/* Membership Type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 font-medium focus:bg-white outline-none cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="General Member">General Member</option>
            <option value="Executive Member">Executive Member</option>
            <option value="Central Committee Member">Central Committee</option>
          </select>

          {/* Blood Group */}
          <select
            value={bloodFilter}
            onChange={(e) => setBloodFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 font-medium focus:bg-white outline-none cursor-pointer"
          >
            <option value="ALL">All Blood Groups</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </select>

          {/* Payment Status */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 font-medium focus:bg-white outline-none cursor-pointer"
          >
            <option value="ALL">All Payments</option>
            <option value="Paid">Paid (AED)</option>
            <option value="Pending">Pending Payment</option>
            <option value="Waived">Waived</option>
          </select>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 select-none">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <button onClick={toggleSelectAll} className="p-1 hover:text-slate-900 cursor-pointer">
                    {selectedIds.length === sortedMembers.length && sortedMembers.length > 0 ? (
                      <CheckSquare className="w-4 h-4" style={{ color: 'var(--color-primary, #881337)' }} />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th
                  onClick={() => handleSort('membershipId')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Member ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('fullName')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Member Details</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('unit')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
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
                  className="p-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Joined Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* Dynamic Custom Field Table Headers */}
                {tableCustomFields.map((cf) => (
                  <th key={cf.id} className="p-3.5 whitespace-nowrap text-slate-600 font-semibold">
                    {cf.label}
                  </th>
                ))}

                <th
                  onClick={() => handleSort('expiryDate')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Validity / Expiry</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('feeAmountAED')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Fee (AED)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5 text-center">Actions &amp; ID Card</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {sortedMembers.length === 0 ? (
                <tr>
                  <td colSpan={9 + tableCustomFields.length} className="p-12 text-center text-slate-500">
                    No members match your search criteria.
                  </td>
                </tr>
              ) : (
                sortedMembers.map((m) => {
                  const isSelected = selectedIds.includes(m.id);
                  const expiry = getExpiryStatus(m.expiryDate);
                  const isEditingUnit = editingUnitMemberId === m.id;

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      {/* Select checkbox */}
                      <td className="p-3.5 text-center">
                        <button onClick={() => toggleSelect(m.id)} className="p-1 cursor-pointer">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4" style={{ color: 'var(--color-primary, #881337)' }} />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                          )}
                        </button>
                      </td>

                      {/* ID No */}
                      <td className="p-3.5 font-mono font-bold whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-bold border"
                          style={{
                            color: 'var(--color-primary, #881337)',
                            backgroundColor: 'var(--color-primary-light, #fff1f2)',
                            borderColor: 'var(--color-primary-border, #9f1239)'
                          }}
                        >
                          {m.membershipId}
                        </span>
                      </td>

                      {/* Member Info */}
                      <td className="p-3.5 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <img
                            src={m.photoUrl}
                            alt={m.fullName}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0"
                          />
                          <div className="min-w-0">
                            <div
                              onClick={() => handleSelectMember(m)}
                              className="font-bold text-slate-900 hover:underline cursor-pointer truncate"
                              style={{ color: isSelected ? 'var(--color-primary, #881337)' : undefined }}
                            >
                              {m.fullName}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {m.phoneUAE}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {m.membershipType} &bull; {m.registrationCategory}
                            </div>
                          </div>
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
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200">
                          {m.bloodGroup}
                        </span>
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

                      {/* Fee in AED */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">
                          {formatAED(m.feeAmountAED)}
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {m.paymentStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {onViewIdCard && (
                            <button
                              onClick={() => onViewIdCard(m)}
                              className="p-1.5 rounded-lg text-white shadow-2xs transition-transform active:scale-95 cursor-pointer"
                              style={{ backgroundColor: 'var(--color-primary, #881337)' }}
                              title="Generate Official ID Card"
                            >
                              <IdCard className="w-4 h-4" />
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

        {/* Table Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing <strong className="text-slate-900">{sortedMembers.length}</strong> of{' '}
            <strong className="text-slate-900">{members.length}</strong> members
          </span>

          <span className="font-mono text-xs text-slate-700 font-semibold">
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
