import React, { useState, useMemo } from 'react';
import { CulturalClass, ClassParticipant, ClassAttendanceRecord, AttendanceStatus, ParticipantAttendanceEntry } from '../types/classes';
import { UserSession } from '../types/member';
import { formatDate } from '../utils/idGenerator';
import { X, CheckCircle2, XCircle, Clock, Check, UserCheck, Calendar, BookOpen, Sparkles, Filter, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAttendance: (record: ClassAttendanceRecord) => void;
  onUpdateParticipantBatch?: (participantId: string, newBatch: string) => void;
  targetClass: CulturalClass;
  students: ClassParticipant[];
  userSession: UserSession | null;
  initialBatchFilter?: string;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  onSaveAttendance,
  onUpdateParticipantBatch,
  targetClass,
  students,
  userSession,
  initialBatchFilter = 'ALL',
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [topicCovered, setTopicCovered] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>(initialBatchFilter);
  const [customSessionBatchName, setCustomSessionBatchName] = useState<string>(
    initialBatchFilter !== 'ALL' ? initialBatchFilter : targetClass.batchName || 'General Batch'
  );

  // Extract all unique batches from students and class
  const existingBatches = useMemo(() => {
    const batchSet = new Set<string>();
    if (targetClass.batchName) batchSet.add(targetClass.batchName);
    students.forEach((s) => {
      if (s.batchName) batchSet.add(s.batchName);
    });
    return Array.from(batchSet);
  }, [students, targetClass]);

  // Filter students based on selected batch
  const filteredStudents = useMemo(() => {
    if (selectedBatch === 'ALL') return students;
    return students.filter((s) => (s.batchName || 'General Batch') === selectedBatch);
  }, [students, selectedBatch]);

  const [attendanceEntries, setAttendanceEntries] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>(
    () => {
      const initial: Record<string, { status: AttendanceStatus; remarks: string }> = {};
      students.forEach((s) => {
        initial[s.id] = { status: 'Present', remarks: '' };
      });
      return initial;
    }
  );

  if (!isOpen) return null;

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceEntries((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceEntries((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setAttendanceEntries((prev) => {
      const updated = { ...prev };
      filteredStudents.forEach((s) => {
        updated[s.id] = { ...updated[s.id], status };
      });
      return updated;
    });
  };

  const presentCount = filteredStudents.filter((s) => attendanceEntries[s.id]?.status === 'Present').length;
  const absentCount = filteredStudents.filter((s) => attendanceEntries[s.id]?.status === 'Absent').length;
  const lateCount = filteredStudents.filter((s) => attendanceEntries[s.id]?.status === 'Late').length;
  const excusedCount = filteredStudents.filter((s) => attendanceEntries[s.id]?.status === 'Excused').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredStudents.length === 0) {
      alert('There are no active students in this class/batch to record attendance for.');
      return;
    }

    const records: ParticipantAttendanceEntry[] = filteredStudents.map((s) => ({
      participantId: s.id,
      studentName: s.fullName,
      status: attendanceEntries[s.id]?.status || 'Present',
      remarks: attendanceEntries[s.id]?.remarks || '',
    }));

    const attendanceRecord: ClassAttendanceRecord = {
      id: `att-${Date.now()}`,
      classId: targetClass.id,
      className: targetClass.name,
      unit: targetClass.unit,
      batchName: selectedBatch !== 'ALL' ? selectedBatch : customSessionBatchName || targetClass.batchName || 'General Batch',
      date,
      topicCovered: topicCovered.trim(),
      recordedBy: userSession?.fullName || 'Unit Class Coordinator',
      records,
      totalStudents: filteredStudents.length,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      createdAt: new Date().toISOString(),
    };

    onSaveAttendance(attendanceRecord);
    confetti({ particleCount: 35, spread: 60 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div
          className="p-5 text-white flex items-center justify-between"
          style={{ backgroundColor: 'var(--color-primary, #881337)' }}
        >
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-white/10 text-amber-300">
              <UserCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Record Class Session Attendance
              </h3>
              <p className="text-xs text-rose-100 mt-0.5">
                {targetClass.name} • {targetClass.unit} Unit ({targetClass.instructorName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Attendance Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Top Controls: Date, Topic & Batch Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Session Date */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Session Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-white outline-none"
              />
            </div>

            {/* Target Batch Filter */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-rose-800" />
                <span>Student Batch Filter</span>
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">All Batches ({students.length} Students)</option>
                {existingBatches.map((b) => {
                  const count = students.filter((s) => (s.batchName || 'General Batch') === b).length;
                  return (
                    <option key={b} value={b}>
                      {b} ({count} Students)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Topic Covered */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Lessons / Topic Covered
              </label>
              <input
                type="text"
                value={topicCovered}
                onChange={(e) => setTopicCovered(e.target.value)}
                placeholder="e.g. Adavu 4 practice / Chenda Rhythm"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none"
              />
            </div>
          </div>

          {/* Quick Bulk Action Bar & Stats */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 font-bold">Quick Mark ({filteredStudents.length}):</span>
              <button
                type="button"
                onClick={() => handleMarkAll('Present')}
                className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[11px] transition-colors cursor-pointer"
              >
                ✓ All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('Absent')}
                className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[11px] transition-colors cursor-pointer"
              >
                ✕ All Absent
              </button>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                Present: {presentCount}
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                Absent: {absentCount}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                Late: {lateCount}
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                Excused: {excusedCount}
              </span>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 border-b border-slate-800 text-white font-bold sticky top-0 z-10 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Student Name &amp; Contact</th>
                  <th className="p-3">Assigned Batch</th>
                  <th className="p-3 text-center">Attendance Status</th>
                  <th className="p-3">Session Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No active students found in this selected batch.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => {
                    const current = attendanceEntries[student.id] || { status: 'Present', remarks: '' };
                    return (
                      <tr key={student.id} className="hover:bg-amber-50/40 odd:bg-white even:bg-slate-50/60 transition-colors">
                        <td className="p-3 font-mono text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{student.fullName}</div>
                          <div className="font-mono text-[10px] text-slate-400">
                            {student.studentId} • 📞 {student.guardianPhone}
                          </div>
                        </td>
                        <td className="p-3">
                          {onUpdateParticipantBatch ? (
                            <input
                              type="text"
                              value={student.batchName || ''}
                              onChange={(e) => onUpdateParticipantBatch(student.id, e.target.value)}
                              placeholder="e.g. Batch A"
                              className="px-2 py-1 border border-slate-200 rounded font-semibold text-slate-800 bg-white text-[11px] w-28 focus:w-36 transition-all"
                            />
                          ) : (
                            <span className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[10px] font-bold">
                              {student.batchName || 'General Batch'}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 border border-slate-200">
                            {(['Present', 'Absent', 'Late', 'Excused'] as AttendanceStatus[]).map((st) => {
                              const isSelected = current.status === st;
                              return (
                                <button
                                  type="button"
                                  key={st}
                                  onClick={() => handleStatusChange(student.id, st)}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? st === 'Present'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : st === 'Absent'
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : st === 'Late'
                                        ? 'bg-amber-500 text-white shadow-xs'
                                        : 'bg-blue-600 text-white shadow-xs'
                                      : 'text-slate-600 hover:bg-white'
                                  }`}
                                >
                                  {st}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="Optional remark..."
                            value={current.remarks}
                            onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-slate-50 focus:bg-white outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={filteredStudents.length === 0}
              className="px-5 py-2 rounded-xl text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary, #881337)' }}
            >
              <Check className="w-4 h-4 text-amber-300" />
              <span>Save Session Attendance ({filteredStudents.length} Students)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
