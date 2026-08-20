import React, { useState } from 'react';
import { CulturalClass, ClassParticipant, ClassAttendanceRecord, AttendanceStatus, ParticipantAttendanceEntry } from '../types/classes';
import { UserSession } from '../types/member';
import { formatDate } from '../utils/idGenerator';
import { X, CheckCircle2, XCircle, Clock, Check, UserCheck, Calendar, BookOpen, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAttendance: (record: ClassAttendanceRecord) => void;
  targetClass: CulturalClass;
  students: ClassParticipant[];
  userSession: UserSession | null;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  onSaveAttendance,
  targetClass,
  students,
  userSession,
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [topicCovered, setTopicCovered] = useState<string>('');
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
      students.forEach((s) => {
        updated[s.id] = { ...updated[s.id], status };
      });
      return updated;
    });
  };

  const presentCount = students.filter((s) => attendanceEntries[s.id]?.status === 'Present').length;
  const absentCount = students.filter((s) => attendanceEntries[s.id]?.status === 'Absent').length;
  const lateCount = students.filter((s) => attendanceEntries[s.id]?.status === 'Late').length;
  const excusedCount = students.filter((s) => attendanceEntries[s.id]?.status === 'Excused').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (students.length === 0) {
      alert('There are no active students in this class to record attendance for.');
      return;
    }

    const records: ParticipantAttendanceEntry[] = students.map((s) => ({
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
      date,
      topicCovered: topicCovered.trim(),
      recordedBy: userSession?.fullName || 'Unit Class Coordinator',
      records,
      totalStudents: students.length,
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
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
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
          {/* Date & Topic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
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

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Topic / Lessons Covered Today
              </label>
              <input
                type="text"
                value={topicCovered}
                onChange={(e) => setTopicCovered(e.target.value)}
                placeholder="e.g. Uruttu Kol & Thaalam / Adavu 4 practice"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none"
              />
            </div>
          </div>

          {/* Quick Bulk Action Bar & Stats */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 font-bold">Quick Mark:</span>
              <button
                type="button"
                onClick={() => handleMarkAll('Present')}
                className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[11px] transition-colors cursor-pointer"
              >
                ✓ All Present ({students.length})
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
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold sticky top-0 z-10">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3 text-center">Attendance Status</th>
                  <th className="p-3">Session Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      No active students enrolled in this class. Please add students first.
                    </td>
                  </tr>
                ) : (
                  students.map((student, idx) => {
                    const current = attendanceEntries[student.id] || { status: 'Present', remarks: '' };
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{student.fullName}</div>
                          <div className="font-mono text-[10px] text-slate-400">
                            {student.studentId} • {student.guardianPhone}
                          </div>
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
              disabled={students.length === 0}
              className="px-5 py-2 rounded-xl text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary, #881337)' }}
            >
              <Check className="w-4 h-4 text-amber-300" />
              <span>Save Session Attendance</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
