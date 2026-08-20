import React, { useState, useMemo } from 'react';
import {
  CulturalClass,
  ClassParticipant,
  ClassAttendanceRecord,
  CLASS_CATEGORY_OPTIONS,
} from '../types/classes';
import { UserSession, hasAdminPrivilege, isUnitOperatorRole } from '../types/member';
import { formatAED, formatDate } from '../utils/idGenerator';
import { exportParticipantsCsv, downloadAttendanceSheetPdf } from '../utils/classesStorage';
import {
  GraduationCap,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  PlusCircle,
  Download,
  Edit2,
  Trash2,
  Building2,
  Phone,
  MessageCircle,
  Tag,
  UserPlus,
  BookOpen,
  ArrowUpDown,
  X,
  FileSpreadsheet,
  Printer,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ClassesViewProps {
  classes: CulturalClass[];
  participants: ClassParticipant[];
  attendanceRecords: ClassAttendanceRecord[];
  units: string[];
  userSession: UserSession | null;
  onOpenAddClass: () => void;
  onEditClass: (classData: CulturalClass) => void;
  onDeleteClass: (classId: string) => void;
  onOpenAddParticipant: (classId?: string) => void;
  onEditParticipant: (participant: ClassParticipant) => void;
  onDeleteParticipant: (participantId: string) => void;
  onOpenTakeAttendance: (targetClass: CulturalClass) => void;
  onViewReceipt?: (participant: ClassParticipant) => void;
  onQuickPayFee?: (participant: ClassParticipant) => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  classes,
  participants,
  attendanceRecords,
  units,
  userSession,
  onOpenAddClass,
  onEditClass,
  onDeleteClass,
  onOpenAddParticipant,
  onEditParticipant,
  onDeleteParticipant,
  onOpenTakeAttendance,
  onViewReceipt,
  onQuickPayFee,
}) => {
  const isAdmin = !userSession || hasAdminPrivilege(userSession.role);
  const isUnitOp = !!userSession && isUnitOperatorRole(userSession.role);
  const assignedUnit = userSession?.unit;

  const [activeSubTab, setActiveSubTab] = useState<'classes' | 'students' | 'attendance'>('classes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>(
    isUnitOp && assignedUnit ? assignedUnit : 'ALL'
  );
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedFeeStatus, setSelectedFeeStatus] = useState<string>('ALL');

  // Scoped Classes
  const scopedClasses = useMemo(() => {
    return classes.filter((c) => {
      if (isUnitOp && assignedUnit) {
        if (c.unit.toLowerCase().trim() !== assignedUnit.toLowerCase().trim()) return false;
      }
      if (selectedUnit !== 'ALL' && c.unit.toLowerCase() !== selectedUnit.toLowerCase()) {
        return false;
      }
      if (selectedCategory !== 'ALL' && c.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (c.name || '').toLowerCase().includes(q);
        const matchesCode = (c.code || '').toLowerCase().includes(q);
        const matchesGuru = (c.instructorName || '').toLowerCase().includes(q);
        const matchesLoc = (c.location || '').toLowerCase().includes(q);
        return matchesName || matchesCode || matchesGuru || matchesLoc;
      }
      return true;
    });
  }, [classes, isUnitOp, assignedUnit, selectedUnit, selectedCategory, searchQuery]);

  // Scoped Participants / Students
  const scopedParticipants = useMemo(() => {
    return participants.filter((p) => {
      if (isUnitOp && assignedUnit) {
        if (p.unit.toLowerCase().trim() !== assignedUnit.toLowerCase().trim()) return false;
      }
      if (selectedUnit !== 'ALL' && p.unit.toLowerCase() !== selectedUnit.toLowerCase()) {
        return false;
      }
      if (selectedClassId !== 'ALL' && p.classId !== selectedClassId) {
        return false;
      }
      if (selectedFeeStatus !== 'ALL' && p.feeStatus !== selectedFeeStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (p.fullName || '').toLowerCase().includes(q);
        const matchesId = (p.studentId || '').toLowerCase().includes(q);
        const matchesClass = (p.className || '').toLowerCase().includes(q);
        const matchesPhone = (p.guardianPhone || '').includes(q);
        const matchesParent = (p.guardianName || '').toLowerCase().includes(q);
        return matchesName || matchesId || matchesClass || matchesPhone || matchesParent;
      }
      return true;
    });
  }, [participants, isUnitOp, assignedUnit, selectedUnit, selectedClassId, selectedFeeStatus, searchQuery]);

  // Scoped Attendance Records
  const scopedAttendance = useMemo(() => {
    return attendanceRecords.filter((a) => {
      if (isUnitOp && assignedUnit) {
        if (a.unit.toLowerCase().trim() !== assignedUnit.toLowerCase().trim()) return false;
      }
      if (selectedUnit !== 'ALL' && a.unit.toLowerCase() !== selectedUnit.toLowerCase()) {
        return false;
      }
      if (selectedClassId !== 'ALL' && a.classId !== selectedClassId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesClass = (a.className || '').toLowerCase().includes(q);
        const matchesTopic = (a.topicCovered || '').toLowerCase().includes(q);
        const matchesBy = (a.recordedBy || '').toLowerCase().includes(q);
        return matchesClass || matchesTopic || matchesBy;
      }
      return true;
    });
  }, [attendanceRecords, isUnitOp, assignedUnit, selectedUnit, selectedClassId, searchQuery]);

  // Metrics
  const totalStudentsCount = scopedParticipants.length;
  const activeClassesCount = scopedClasses.filter((c) => c.status === 'Active').length;
  const totalCollectedAED = scopedParticipants
    .filter((p) => p.feeStatus === 'Paid')
    .reduce((sum, p) => sum + (p.feeAmountAED || 0), 0);
  const totalPendingAED = scopedParticipants
    .filter((p) => p.feeStatus === 'Pending' || p.feeStatus === 'Not Paid')
    .reduce((sum, p) => sum + (p.feeAmountAED || 0), 0);
  const paidStudentsCount = scopedParticipants.filter((p) => p.feeStatus === 'Paid').length;
  const pendingStudentsCount = scopedParticipants.filter((p) => p.feeStatus === 'Pending' || p.feeStatus === 'Not Paid').length;

  const handleExportStudents = () => {
    exportParticipantsCsv(
      scopedParticipants,
      `KCA_Class_Students_${selectedUnit}_${new Date().toISOString().split('T')[0]}.csv`
    );
    confetti({ particleCount: 35, spread: 60 });
  };

  const handlePrintAttendanceSheet = (c: CulturalClass) => {
    const classStudents = participants.filter((p) => p.classId === c.id && p.status === 'Active');
    const classHistory = attendanceRecords.filter((a) => a.classId === c.id);
    downloadAttendanceSheetPdf(c, classStudents, classHistory);
    confetti({ particleCount: 35, spread: 60 });
  };

  return (
    <div className="space-y-6 pb-16 antialiased">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="p-1.5 rounded-lg text-white"
              style={{ backgroundColor: 'var(--color-primary, #881337)' }}
            >
              <GraduationCap className="w-5 h-5 text-amber-300" />
            </span>
            <h2 className="font-display font-bold text-xl text-slate-900 tracking-tight">
              Unit Cultural Classes &amp; Student Attendance
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Manage unit-specific training classes (Chenda Melam, Classical Dance, Music, Yoga, Malayalam Padanam) &amp; participant attendance registries.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenAddParticipant()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>+ Register Student</span>
          </button>

          <button
            onClick={onOpenAddClass}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            style={{ backgroundColor: 'var(--color-primary, #881337)' }}
          >
            <PlusCircle className="w-4 h-4 text-amber-300" />
            <span>+ Create Class Batch</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Enrolled Students
            </span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="font-mono font-bold text-2xl text-slate-900 mt-2">
            {totalStudentsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {paidStudentsCount} Paid • {pendingStudentsCount} Due
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Fees Collected (AED)
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="font-mono font-bold text-2xl text-emerald-700 mt-2">
            {formatAED(totalCollectedAED)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            Linked to Unit Finance
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Fees (AED)
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <Tag className="w-4 h-4" />
            </span>
          </div>
          <div className="font-mono font-bold text-2xl text-amber-600 mt-2">
            {formatAED(totalPendingAED)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {pendingStudentsCount} pending collections
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Batches
            </span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <GraduationCap className="w-4 h-4" />
            </span>
          </div>
          <div className="font-mono font-bold text-2xl text-blue-700 mt-2">
            {activeClassesCount} Batches
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {scopedAttendance.length} Attendance logs
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('classes')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'classes'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Classes &amp; Batches ({scopedClasses.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('students')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'students'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Students &amp; Participants ({scopedParticipants.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'attendance'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Attendance Registers &amp; History ({scopedAttendance.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 mb-2">
          {activeSubTab === 'students' && (
            <button
              onClick={handleExportStudents}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export Students CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, course, instructor, phone number..."
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

          {/* Unit & Category Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Unit */}
            {!isUnitOp && (
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white outline-none cursor-pointer"
              >
                <option value="ALL">All Units</option>
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u} Unit
                  </option>
                ))}
                <option value="Central">Central Secretariat</option>
              </select>
            )}

            {/* Category / Discipline */}
            {activeSubTab === 'classes' && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white outline-none cursor-pointer"
              >
                <option value="ALL">All Disciplines</option>
                {CLASS_CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {/* Class filter for students/attendance */}
            {activeSubTab !== 'classes' && (
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white outline-none cursor-pointer"
              >
                <option value="ALL">All Classes / Batches</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.unit})
                  </option>
                ))}
              </select>
            )}

            {/* Fee Status filter */}
            {activeSubTab === 'students' && (
              <select
                value={selectedFeeStatus}
                onChange={(e) => setSelectedFeeStatus(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white outline-none cursor-pointer"
              >
                <option value="ALL">All Fee Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending Due</option>
                <option value="Exempt">Exempt / Scholarship</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: Classes & Batches Grid */}
      {activeSubTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scopedClasses.length === 0 ? (
            <div className="col-span-full bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
              No cultural training classes found matching your search.
            </div>
          ) : (
            scopedClasses.map((cls) => {
              const enrolledStudents = participants.filter(
                (p) => p.classId === cls.id && p.status === 'Active'
              );
              const lastAttendance = attendanceRecords
                .filter((a) => a.classId === cls.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {cls.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          cls.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {cls.status}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-base text-slate-900 mt-2 leading-snug">
                      {cls.name}
                    </h3>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-rose-800" />
                        <span>{cls.unit} Unit</span>
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200">
                        {cls.category}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-2.5 text-xs text-slate-600">
                    <div>
                      <span className="font-bold text-slate-700">Guru / Instructor:</span>{' '}
                      <span className="font-semibold text-slate-900">{cls.instructorName}</span>
                      {cls.instructorContact && (
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          📞 {cls.instructorContact}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cls.scheduleDays.join(', ')}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cls.scheduleTime}</span>
                    </div>

                    {cls.location && (
                      <div className="text-[11px] text-slate-500 italic">
                        📍 {cls.location}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Monthly Fee</div>
                        <div className="font-mono font-bold text-sm text-rose-900">
                          {formatAED(cls.monthlyFeeAED)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Enrolled Students</div>
                        <div className="font-mono font-bold text-sm text-slate-900">
                          {enrolledStudents.length} Active
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => onOpenTakeAttendance(cls)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                      style={{ backgroundColor: 'var(--color-primary, #881337)' }}
                      title="Take class session attendance"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                      <span>Take Attendance</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePrintAttendanceSheet(cls)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Print / Download PDF Attendance Sheet"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onOpenAddParticipant(cls.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="Add student to this batch"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onEditClass(cls)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Edit Class Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete class "${cls.name}"?`)) {
                              onDeleteClass(cls.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Class"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUB-TAB 2: Students & Participants Registry Table */}
      {activeSubTab === 'students' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider select-none">
                <tr>
                  <th className="p-3.5">Student ID</th>
                  <th className="p-3.5">Student Name &amp; Contact</th>
                  <th className="p-3.5">Class / Course &amp; Unit</th>
                  <th className="p-3.5">Custom Attributes &amp; Options</th>
                  <th className="p-3.5 text-center">Fee (AED) &amp; Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {scopedParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">
                      No student records found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  scopedParticipants.map((p) => {
                    const cleanPhone = (p.whatsapp || p.guardianPhone || '').replace(/[^0-9]/g, '');
                    const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : null;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Student ID */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                            {p.studentId}
                          </span>
                          <div className="text-[10px] text-slate-400 font-mono mt-1">
                            Joined: {formatDate(p.joiningDate)}
                          </div>
                        </td>

                        {/* Student Name & Contact */}
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 text-sm leading-snug">
                            {p.fullName}
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            {p.age && <span>Age: {p.age} yrs • </span>}
                            <span>Parent: {p.guardianName || 'Guardian'}</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <span>📞 {p.guardianPhone}</span>
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-0.5"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>WA</span>
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Class & Unit */}
                        <td className="p-3.5">
                          <div className="font-bold text-slate-800">{p.className}</div>
                          <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" style={{ color: 'var(--color-primary, #881337)' }} />
                            <span>{p.unit} Unit</span>
                          </div>
                        </td>

                        {/* Custom Options & Attributes */}
                        <td className="p-3.5">
                          {p.customOptions && Object.keys(p.customOptions).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(p.customOptions).map(([key, val]) => (
                                <span
                                  key={key}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200"
                                >
                                  <span className="font-bold text-slate-900">{key}:</span> {val}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">—</span>
                          )}
                          {p.notes && (
                            <div className="text-[10px] text-slate-400 italic mt-1">"{p.notes}"</div>
                          )}
                        </td>

                        {/* Fee Status & Quick Action */}
                        <td className="p-3.5 whitespace-nowrap text-center">
                          <div className="font-mono font-bold text-slate-900">
                            {formatAED(p.feeAmountAED)}
                          </div>
                          <div className="flex flex-col items-center gap-1 mt-1">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.feeStatus === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : p.feeStatus === 'Exempt'
                                  ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {p.feeStatus === 'Paid' ? '✓ Paid' : p.feeStatus === 'Exempt' ? 'Exempt' : '⚠ Not Paid'}
                            </span>

                            {/* If Not Paid / Pending, allow quick fee collection and receipt generation */}
                            {(p.feeStatus === 'Pending' || (p.feeStatus as any) === 'Not Paid') && onQuickPayFee && (
                              <button
                                onClick={() => onQuickPayFee(p)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
                                title="Collect payment and issue official receipt"
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Pay &amp; Receipt</span>
                              </button>
                            )}

                            {/* If Paid and has receipt number, show mini receipt link */}
                            {p.feeStatus === 'Paid' && onViewReceipt && (
                              <button
                                onClick={() => onViewReceipt(p)}
                                className="inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                                title="Click to view & print official receipt"
                              >
                                <Printer className="w-2.5 h-2.5" />
                                <span>{p.receiptNumber || 'Receipt'}</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1">
                            {p.feeStatus === 'Paid' && onViewReceipt && (
                              <button
                                onClick={() => onViewReceipt(p)}
                                className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                title="Print / Download Student Fee Receipt"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {(p.feeStatus === 'Pending' || (p.feeStatus as any) === 'Not Paid') && onQuickPayFee && (
                              <button
                                onClick={() => onQuickPayFee(p)}
                                className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                                title="Record Fee & Issue Receipt"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => onEditParticipant(p)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Edit Student Record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to remove student "${p.fullName}"?`)) {
                                    onDeleteParticipant(p.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Student Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* SUB-TAB 3: Attendance History & Session Logs */}
      {activeSubTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Class / Batch &amp; Unit</th>
                  <th className="p-3.5">Topic / Syllabus Covered</th>
                  <th className="p-3.5 text-center">Attendance Breakdown</th>
                  <th className="p-3.5">Recorded By</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {scopedAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-500">
                      No attendance registers recorded yet. Click "Take Attendance" on any class to start tracking sessions.
                    </td>
                  </tr>
                ) : (
                  scopedAttendance.map((rec) => {
                    const presentRate = rec.totalStudents > 0 ? Math.round((rec.presentCount / rec.totalStudents) * 100) : 0;
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 whitespace-nowrap font-mono font-bold text-slate-900">
                          {formatDate(rec.date)}
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{rec.className}</div>
                          <div className="text-[11px] text-slate-500 font-semibold">{rec.unit} Unit</div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800">
                            {rec.topicCovered || 'Regular Practice Session'}
                          </div>
                        </td>

                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {rec.presentCount} Present
                            </span>
                            <span className="font-mono text-slate-400">/ {rec.totalStudents}</span>
                            <span className="font-mono font-bold text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              {presentRate}%
                            </span>
                          </div>
                        </td>

                        <td className="p-3.5 whitespace-nowrap text-slate-600 font-medium">
                          {rec.recordedBy}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
