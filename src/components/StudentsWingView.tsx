import React, { useState, useEffect, useMemo } from 'react';
import { Member, UserSession, isUnitOperatorRole } from '../types/member';
import { StudentWingMember, STUDENT_WING_ROLES } from '../types/studentsWing';
import { StudentIdCard } from './StudentIdCard';
import { StudentBatchPrintModal } from './StudentBatchPrintModal';
import { normalizeChildrenWingId } from '../utils/studentsWingStorage';
import { formatCardDate } from '../utils/idGenerator';
import { loadSavedTheme } from '../utils/theme';
import { ThemePreset } from '../types/theme';
import {
  UserPlus,
  Search,
  IdCard,
  Edit3,
  Trash2,
  Users,
  School,
  Award,
  Download,
  LayoutGrid,
  List,
  ShieldCheck,
  User,
  ExternalLink,
  Printer,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';

interface StudentsWingViewProps {
  students: StudentWingMember[];
  kcaMembers: Member[];
  units: string[];
  userSession?: UserSession | null;
  onOpenAddStudent: () => void;
  onEditStudent: (student: StudentWingMember) => void;
  onDeleteStudent: (studentId: string) => void;
  onViewStudentIdCard: (student: StudentWingMember) => void;
  onSelectKcaParentMember?: (member: Member) => void;
}

export const StudentsWingView: React.FC<StudentsWingViewProps> = ({
  students,
  kcaMembers,
  units,
  userSession,
  onOpenAddStudent,
  onEditStudent,
  onDeleteStudent,
  onViewStudentIdCard,
  onSelectKcaParentMember,
}) => {
  const isUnitOp = !!userSession && isUnitOperatorRole(userSession.role);
  const assignedUnit = userSession?.unit;

  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState<string>(isUnitOp && assignedUnit ? assignedUnit : 'ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [parentTypeFilter, setParentTypeFilter] = useState<'ALL' | 'KCA_MEMBER' | 'MANUAL'>('ALL');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'Male' | 'Female'>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'id_gallery'>('cards');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatchPrintModal, setShowBatchPrintModal] = useState(false);
  const [theme, setTheme] = useState<ThemePreset>(() => loadSavedTheme());

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      setTheme(e?.detail || loadSavedTheme());
    };
    window.addEventListener('kca-theme-changed', handleThemeChange);
    return () => window.removeEventListener('kca-theme-changed', handleThemeChange);
  }, []);

  const toggleSelectStudent = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFiltered = () => {
    if (
      filteredStudents.length > 0 &&
      filteredStudents.every((s) => selectedIds.includes(s.id))
    ) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.id));
    }
  };

  // Scope members by Unit Operator if applicable
  const scopedStudents = useMemo(() => {
    if (isUnitOp && assignedUnit) {
      return students.filter((s) => s.unit.toLowerCase() === assignedUnit.toLowerCase());
    }
    return students;
  }, [students, isUnitOp, assignedUnit]);

  // Filtered Children's Wing members
  const filteredStudents = useMemo(() => {
    return scopedStudents.filter((s) => {
      if (unitFilter !== 'ALL' && s.unit.toLowerCase() !== unitFilter.toLowerCase()) {
        return false;
      }
      if (roleFilter !== 'ALL' && s.wingRole !== roleFilter) {
        return false;
      }
      if (parentTypeFilter === 'KCA_MEMBER' && !s.isParentKcaMember) {
        return false;
      }
      if (parentTypeFilter === 'MANUAL' && s.isParentKcaMember) {
        return false;
      }
      if (genderFilter !== 'ALL' && s.gender !== genderFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.fullName.toLowerCase().includes(q);
        const matchId = s.studentId.toLowerCase().includes(q);
        const matchSchool = (s.schoolOrCollege || '').toLowerCase().includes(q);
        const matchParent = (s.parentName || '').toLowerCase().includes(q);
        const matchParentId = (s.parentMembershipId || '').toLowerCase().includes(q);
        const matchPhone = (s.parentPhoneUAE || '').toLowerCase().includes(q);
        return matchName || matchId || matchSchool || matchParent || matchParentId || matchPhone;
      }

      return true;
    });
  }, [scopedStudents, unitFilter, roleFilter, parentTypeFilter, genderFilter, searchQuery]);

  // Metrics
  const totalStudents = scopedStudents.length;
  const kcaParentLinkedCount = scopedStudents.filter((s) => s.isParentKcaMember).length;
  const officeBearersCount = scopedStudents.filter(
    (s) => s.wingRole !== "Children's Wing Member" && s.wingRole !== 'Student Member'
  ).length;
  const uniqueSchoolsCount = new Set(
    scopedStudents.map((s) => (s.schoolOrCollege || '').trim().toLowerCase()).filter(Boolean)
  ).size;

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Member ID',
      'Full Name',
      'Gender',
      'DOB',
      'Blood Group',
      "Children's Wing Role",
      'School / Institution',
      'Unit',
      'Parent Name',
      'Relation',
      'KCA Member Parent?',
      'Parent KCA ID',
      'Parent Phone UAE',
      'Residence Area',
      'Kerala District',
      'Status',
      'Valid Until',
    ];

    const rows = filteredStudents.map((s) => [
      normalizeChildrenWingId(s.studentId),
      s.fullName,
      s.gender,
      s.dateOfBirth,
      s.bloodGroup,
      s.wingRole,
      s.schoolOrCollege,
      s.unit,
      s.parentName,
      s.parentRelation,
      s.isParentKcaMember ? 'Yes' : 'No',
      s.parentMembershipId || '',
      s.parentPhoneUAE,
      s.residenceArea || '',
      s.keralaDistrict || '',
      s.status,
      s.expiryDate,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KCA_Fujairah_Childrens_Wing_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const findLinkedKcaMember = (student: StudentWingMember): Member | undefined => {
    if (!student.isParentKcaMember) return undefined;
    return kcaMembers.find(
      (m) =>
        (student.parentMemberId && m.id === student.parentMemberId) ||
        (student.parentMembershipId &&
          m.membershipId.toLowerCase() === student.parentMembershipId.toLowerCase())
    );
  };

  return (
    <div className="space-y-5 pb-12 font-sans antialiased">
      {/* 1. Header Banner with Primary Solid Theme Color (Matches other sections) */}
      <div
        className="text-white p-5 rounded-2xl shadow-xs border border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
        style={{ backgroundColor: 'var(--color-primary, #8b0000)' }}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-white border border-white/25 shrink-0 shadow-xs">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white font-display">
                Children&apos;s Wing
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                Dedicated Wing
              </span>
            </div>
            <p className="text-xs text-white/85 mt-0.5">
              Membership directory and official ID card studio for children of association members.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="bg-black/20 px-3 py-1.5 rounded-xl border border-white/20 text-xs font-mono font-bold text-white">
            Total Enrolled: {totalStudents}
          </div>

          <button
            type="button"
            onClick={() => setShowBatchPrintModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>
              Batch Print IDs
              {selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddStudent}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-white/90 text-slate-900 font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5 text-slate-800" />
            <span>+ Add Member</span>
          </button>
        </div>
      </div>

      {/* 2. Streamlined KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Enrolled
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {totalStudents}
            </div>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}
          >
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Parent Linked
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {kcaParentLinkedCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Institutions
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {uniqueSchoolsCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <School className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Wing Leaders
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {officeBearersCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Search, Filters & View Switcher Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, school, parent or phone..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-400 transition-colors"
            />
          </div>

          {/* Selection & View Mode Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAllFiltered}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
            >
              {filteredStudents.length > 0 &&
              filteredStudents.every((s) => selectedIds.includes(s.id)) ? (
                <CheckSquare className="w-3.5 h-3.5" style={{ color: theme.primary }} />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>
                {selectedIds.length > 0
                  ? `${selectedIds.length} Selected`
                  : 'Select All'}
              </span>
            </button>

            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                style={viewMode === 'cards' ? { backgroundColor: theme.primary } : undefined}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={viewMode === 'table' ? { backgroundColor: theme.primary } : undefined}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('id_gallery')}
                style={viewMode === 'id_gallery' ? { backgroundColor: theme.primary } : undefined}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'id_gallery'
                    ? 'text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <IdCard className="w-3.5 h-3.5" />
                <span>ID Gallery</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {!isUnitOp && (
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:border-slate-400"
            >
              <option value="ALL">All Units ({scopedStudents.length})</option>
              {units.map((u) => (
                <option key={u} value={u}>
                  {u} Unit
                </option>
              ))}
            </select>
          )}

          <select
            value={parentTypeFilter}
            onChange={(e) => setParentTypeFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="ALL">All Parent Types</option>
            <option value="KCA_MEMBER">Parent is KCA Member ({kcaParentLinkedCount})</option>
            <option value="MANUAL">Non-Member Parent ({totalStudents - kcaParentLinkedCount})</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="ALL">All Wing Roles</option>
            {STUDENT_WING_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="ALL">All Genders</option>
            <option value="Male">Boys</option>
            <option value="Female">Girls</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredStudents.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-slate-900">
              No Children&apos;s Wing Records Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No members match the current filter or search criteria.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAddStudent}
            style={{ backgroundColor: theme.primary }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer hover:opacity-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Member</span>
          </button>
        </div>
      )}

      {/* VIEW MODE 1: MEMBER PROFILE CARDS */}
      {viewMode === 'cards' && filteredStudents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const linkedParent = findLinkedKcaMember(student);
            const displayRole = (student.wingRole || "Children's Wing Member")
              .replace(/Students Wing/gi, "Children's Wing")
              .replace(/^Student Member$/i, "Children's Wing Member");
            return (
              <div
                key={student.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between transition-all hover:border-slate-300"
              >
                {/* Card Top Strip */}
                <div
                  className="px-4 py-2 text-white flex items-center justify-between text-xs"
                  style={{ backgroundColor: theme.primary }}
                >
                  <button
                    type="button"
                    onClick={() => toggleSelectStudent(student.id)}
                    className="inline-flex items-center gap-2 font-mono font-bold text-white/95 cursor-pointer"
                    title="Select for Batch Print"
                  >
                    {selectedIds.includes(student.id) ? (
                      <CheckSquare className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-white/70" />
                    )}
                    <span>ID: {normalizeChildrenWingId(student.studentId)}</span>
                  </button>
                  <span className="px-2 py-0.5 rounded-md bg-white/20 text-white font-semibold text-[10px]">
                    {student.unit}
                  </span>
                </div>

                {/* Main Content */}
                <div className="p-4 space-y-3.5 flex-1">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-16 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center border border-slate-200 shadow-2xs"
                    >
                      {student.photoUrl ? (
                        <img
                          src={student.photoUrl}
                          alt={student.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-7 h-7 text-slate-300" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {displayRole}
                        </span>
                        {student.bloodGroup && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold">
                            {student.bloodGroup}
                          </span>
                        )}
                      </div>

                      <h3 className="font-display font-bold text-sm text-slate-900 mt-1 truncate">
                        {student.fullName}
                      </h3>

                      {student.schoolOrCollege && (
                        <div className="text-xs text-slate-600 truncate mt-0.5">
                          {student.schoolOrCollege}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {student.gender} · DOB: {formatCardDate(student.dateOfBirth)}
                      </div>
                    </div>
                  </div>

                  {/* Parent / Guardian Box */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">
                        Parent ({student.parentRelation})
                      </span>
                      {student.isParentKcaMember ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (linkedParent && onSelectKcaParentMember) {
                              onSelectKcaParentMember(linkedParent);
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>KCA Parent</span>
                          {linkedParent && <ExternalLink className="w-2.5 h-2.5" />}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">Direct Parent</span>
                      )}
                    </div>

                    <div className="font-semibold text-slate-900 flex items-center justify-between">
                      <span className="truncate">{student.parentName}</span>
                      <span className="font-mono text-slate-600 text-[11px] shrink-0">
                        {student.parentPhoneUAE}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Bar */}
                <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onViewStudentIdCard(student)}
                    style={{ backgroundColor: theme.primary }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-95 cursor-pointer shadow-2xs"
                  >
                    <IdCard className="w-3.5 h-3.5" />
                    <span>ID Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditStudent(student)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    title="Edit Member Details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove ${student.fullName} from Children's Wing?`)) {
                        onDeleteStudent(student.id);
                      }
                    }}
                    className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                    title="Delete Member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: REGISTER TABLE */}
      {viewMode === 'table' && filteredStudents.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAllFiltered}
                      className="p-1 text-white cursor-pointer"
                    >
                      {filteredStudents.length > 0 &&
                      filteredStudents.every((s) => selectedIds.includes(s.id)) ? (
                        <CheckSquare className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Member ID &amp; Role</th>
                  <th className="py-3 px-4">School / Institution</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Parent</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredStudents.map((student) => {
                  const linkedParent = findLinkedKcaMember(student);
                  const displayRole = (student.wingRole || "Children's Wing Member")
                    .replace(/Students Wing/gi, "Children's Wing")
                    .replace(/^Student Member$/i, "Children's Wing Member");
                  const isSelected = selectedIds.includes(student.id);
                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectStudent(student.id)}
                          className="p-1 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5" style={{ color: theme.primary }} />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500" />
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center border border-slate-200">
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{student.fullName}</div>
                            <div className="text-[11px] text-slate-500">
                              {student.gender}{student.bloodGroup ? ` · ${student.bloodGroup}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-4">
                        <div className="font-mono font-bold" style={{ color: theme.primary }}>
                          {normalizeChildrenWingId(student.studentId)}
                        </div>
                        <div className="text-[11px] text-slate-500">{displayRole}</div>
                      </td>

                      <td className="py-2.5 px-4">
                        <div className="text-slate-700">
                          {student.schoolOrCollege || '—'}
                        </div>
                      </td>

                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 text-[11px]">
                          {student.unit}
                        </span>
                      </td>

                      <td className="py-2.5 px-4">
                        <div className="font-medium text-slate-900">
                          {student.parentName} <span className="text-slate-400 font-normal">({student.parentRelation})</span>
                        </div>
                        {student.isParentKcaMember && (
                          <div className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>KCA Member</span>
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-4 font-mono text-slate-600">
                        {student.parentPhoneUAE}
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onViewStudentIdCard(student)}
                            style={{ backgroundColor: theme.primary }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-white text-[11px] font-semibold cursor-pointer hover:opacity-95"
                          >
                            <IdCard className="w-3 h-3" />
                            <span>ID</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditStudent(student)}
                            className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete ${student.fullName}?`)) {
                                onDeleteStudent(student.id);
                              }
                            }}
                            className="p-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* VIEW MODE 3: LIVE CHILDREN'S WING HORIZONTAL ID CARDS GALLERY */}
      {viewMode === 'id_gallery' && filteredStudents.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 justify-items-center bg-slate-100 p-6 rounded-2xl border border-slate-200">
          {filteredStudents.map((student) => (
            <div key={student.id} className="flex flex-col items-center gap-2.5 overflow-x-auto max-w-full">
              <div
                onClick={() => onViewStudentIdCard(student)}
                className="cursor-pointer transition-transform hover:scale-[1.01]"
                title="Click to open ID Studio"
              >
                <StudentIdCard
                  student={student}
                  side="front"
                  idPrefix="gallery-student-card"
                />
              </div>
              <button
                type="button"
                onClick={() => onViewStudentIdCard(student)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Dual-Sided ID &amp; Download</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Batch Print ID Cards Modal */}
      <StudentBatchPrintModal
        isOpen={showBatchPrintModal}
        students={
          selectedIds.length > 0
            ? scopedStudents.filter((s) => selectedIds.includes(s.id))
            : filteredStudents
        }
        onClose={() => setShowBatchPrintModal(false)}
      />
    </div>
  );
};
