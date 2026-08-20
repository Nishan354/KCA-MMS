import React, { useState, useEffect } from 'react';
import { CulturalClass, ClassCategory, CLASS_CATEGORY_OPTIONS, CLASS_PRESET_NAMES } from '../types/classes';
import { UserSession, hasAdminPrivilege } from '../types/member';
import { generateNextClassCode } from '../utils/classesStorage';
import { X, GraduationCap, Building2, Clock, Calendar, DollarSign, UserCheck, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ClassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (classData: CulturalClass) => void;
  editingClass?: CulturalClass | null;
  units: string[];
  existingClasses: CulturalClass[];
  userSession: UserSession | null;
}

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ClassFormModal: React.FC<ClassFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingClass,
  units,
  existingClasses,
  userSession,
}) => {
  const isUnitOp = !!userSession && userSession.role === 'Unit Data Operator';
  const defaultUnit = isUnitOp && userSession?.unit ? userSession.unit : 'Fujairah';

  const [unit, setUnit] = useState<string>(defaultUnit);
  const [name, setName] = useState<string>('Chenda Melam (Beginners / Intermediate / Advanced)');
  const [customName, setCustomName] = useState<string>('');
  const [isCustomName, setIsCustomName] = useState<boolean>(false);
  const [category, setCategory] = useState<ClassCategory>('Instrumental');
  const [instructorName, setInstructorName] = useState<string>('');
  const [instructorContact, setInstructorContact] = useState<string>('');
  const [scheduleDays, setScheduleDays] = useState<string[]>(['Friday', 'Saturday']);
  const [scheduleTime, setScheduleTime] = useState<string>('04:30 PM - 06:30 PM');
  const [location, setLocation] = useState<string>('');
  const [monthlyFeeAED, setMonthlyFeeAED] = useState<number>(100);
  const [status, setStatus] = useState<'Active' | 'On Hold' | 'Completed'>('Active');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (editingClass) {
      setUnit(editingClass.unit);
      if (CLASS_PRESET_NAMES.includes(editingClass.name)) {
        setName(editingClass.name);
        setIsCustomName(false);
        setCustomName('');
      } else {
        setIsCustomName(true);
        setCustomName(editingClass.name);
      }
      setCategory(editingClass.category);
      setInstructorName(editingClass.instructorName);
      setInstructorContact(editingClass.instructorContact || '');
      setScheduleDays(editingClass.scheduleDays || ['Friday']);
      setScheduleTime(editingClass.scheduleTime || '');
      setLocation(editingClass.location || '');
      setMonthlyFeeAED(editingClass.monthlyFeeAED || 0);
      setStatus(editingClass.status || 'Active');
      setNotes(editingClass.notes || '');
    } else {
      setUnit(defaultUnit);
      setName(CLASS_PRESET_NAMES[0]);
      setIsCustomName(false);
      setCustomName('');
      setCategory('Instrumental');
      setInstructorName('');
      setInstructorContact('');
      setScheduleDays(['Friday', 'Saturday']);
      setScheduleTime('04:30 PM - 06:30 PM');
      setLocation(`${defaultUnit} Unit Cultural Hall`);
      setMonthlyFeeAED(100);
      setStatus('Active');
      setNotes('');
    }
  }, [editingClass, isOpen, defaultUnit]);

  if (!isOpen) return null;

  const handleToggleDay = (day: string) => {
    if (scheduleDays.includes(day)) {
      setScheduleDays(scheduleDays.filter((d) => d !== day));
    } else {
      setScheduleDays([...scheduleDays, day]);
    }
  };

  const handleNameSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'CUSTOM') {
      setIsCustomName(true);
      setCustomName('');
    } else {
      setIsCustomName(false);
      setName(val);
      // Auto-set suggested category
      if (val.includes('Dance') || val.includes('Bharatanatyam') || val.includes('Mohiniyattam') || val.includes('Kuchipudi')) {
        setCategory('Dance');
      } else if (val.includes('Chenda') || val.includes('Mridangam') || val.includes('Violin') || val.includes('Instrumental')) {
        setCategory('Instrumental');
      } else if (val.includes('Music') || val.includes('Vocal') || val.includes('Carnatic')) {
        setCategory('Music');
      } else if (val.includes('Malayalam') || val.includes('Language')) {
        setCategory('Language');
      } else if (val.includes('Yoga')) {
        setCategory('Fitness');
      } else if (val.includes('Karate')) {
        setCategory('Martial Arts');
      } else if (val.includes('Drawing') || val.includes('Painting')) {
        setCategory('Art & Craft');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = isCustomName ? customName.trim() : name;
    if (!finalName) {
      alert('Please enter or select a class name.');
      return;
    }
    if (!instructorName.trim()) {
      alert('Please enter the Instructor / Guru / Teacher name.');
      return;
    }

    const classCode = editingClass?.code || generateNextClassCode(unit, existingClasses);

    const classData: CulturalClass = {
      id: editingClass?.id || `cls-${Date.now()}`,
      code: classCode,
      name: finalName,
      category,
      unit,
      instructorName: instructorName.trim(),
      instructorContact: instructorContact.trim(),
      scheduleDays: scheduleDays.length > 0 ? scheduleDays : ['Friday'],
      scheduleTime: scheduleTime.trim() || 'TBD',
      location: location.trim() || `${unit} Unit Hall`,
      monthlyFeeAED: Number(monthlyFeeAED) || 0,
      status,
      notes: notes.trim(),
      createdAt: editingClass?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(classData);
    confetti({ particleCount: 30, spread: 60 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div
          className="p-5 text-white flex items-center justify-between"
          style={{ backgroundColor: 'var(--color-primary, #881337)' }}
        >
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-white/10 text-amber-300">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                {editingClass ? 'Edit Cultural Class / Batch' : 'Create New Unit Class / Training Course'}
              </h3>
              <p className="text-xs text-rose-100 mt-0.5">
                Manage Dance, Chenda Melam, Music, Yoga, Language, or Custom Arts batches
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Unit & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Unit Jurisdiction <span className="text-rose-500">*</span>
              </label>
              <select
                disabled={isUnitOp}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:bg-white outline-none"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u} Unit
                  </option>
                ))}
                <option value="Central">Central Secretariat</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Discipline / Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ClassCategory)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none"
              >
                {CLASS_CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Class Name Selection */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Class / Course Name <span className="text-rose-500">*</span>
            </label>
            {!isCustomName ? (
              <div className="space-y-2">
                <select
                  value={name}
                  onChange={handleNameSelect}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white outline-none"
                >
                  {CLASS_PRESET_NAMES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                  <option value="CUSTOM">➕ Add Custom Class / Workshop...</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Traditional Kathakali Padam Workshop / Kalarippayattu"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomName(false)}
                  className="text-[11px] font-semibold text-rose-700 hover:underline cursor-pointer"
                >
                  ← Select from standard presets
                </button>
              </div>
            )}
          </div>

          {/* Instructor Name & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Instructor / Guru / Master <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                placeholder="e.g. Kalamandalam Rajesh Asan"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Instructor UAE Contact (Phone / WhatsApp)
              </label>
              <input
                type="text"
                value={instructorContact}
                onChange={(e) => setInstructorContact(e.target.value)}
                placeholder="+971 50 123 4567"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>
          </div>

          {/* Schedule Days Multi-check */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Class Days / Schedule
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_DAYS.map((day) => {
                const isSelected = scheduleDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => handleToggleDay(day)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timing & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Batch Timing (e.g. 05:00 PM - 07:00 PM)
              </label>
              <input
                type="text"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                placeholder="05:00 PM - 07:00 PM"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Class Venue / Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. KCA Cultural Studio / Unit Hall"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          {/* Monthly Fee & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Monthly Fee (AED) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={monthlyFeeAED}
                  onChange={(e) => setMonthlyFeeAED(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-slate-50 focus:bg-white outline-none"
                />
                <span className="absolute right-3 top-2 text-slate-400 font-mono font-bold">
                  AED
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Batch Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Active">Active (Ongoing Sessions)</option>
                <option value="On Hold">On Hold / Vacation</option>
                <option value="Completed">Completed / Graduated</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Class Notes / Syllabus / Requirements
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Students must bring their own Chenda sticks / Salangai."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none"
            />
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
              className="px-5 py-2 rounded-xl text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--color-primary, #881337)' }}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{editingClass ? 'Save Changes' : 'Create Class Batch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
