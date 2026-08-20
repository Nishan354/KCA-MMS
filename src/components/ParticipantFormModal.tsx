import React, { useState, useEffect } from 'react';
import { CulturalClass, ClassParticipant, ParticipantFeeStatus, ParticipantStatus } from '../types/classes';
import { UserSession } from '../types/member';
import { generateNextStudentId } from '../utils/classesStorage';
import { X, UserPlus, GraduationCap, Building2, Plus, Trash2, Phone, Mail, Sparkles, Tag } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ParticipantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (participant: ClassParticipant, generateReceipt?: boolean) => void;
  editingParticipant?: ClassParticipant | null;
  classes: CulturalClass[];
  units: string[];
  existingParticipants: ClassParticipant[];
  userSession: UserSession | null;
  preselectedClassId?: string;
}

export const ParticipantFormModal: React.FC<ParticipantFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingParticipant,
  classes,
  units,
  existingParticipants,
  userSession,
  preselectedClassId,
}) => {
  const isUnitOp = !!userSession && userSession.role === 'Unit Data Operator';
  const defaultUnit = isUnitOp && userSession?.unit ? userSession.unit : 'Fujairah';

  const [unit, setUnit] = useState<string>(defaultUnit);
  const [classId, setClassId] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [guardianName, setGuardianName] = useState<string>('');
  const [guardianPhone, setGuardianPhone] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [joiningDate, setJoiningDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [feeStatus, setFeeStatus] = useState<ParticipantFeeStatus>('Paid');
  const [feeAmountAED, setFeeAmountAED] = useState<number>(100);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [receiptNumber, setReceiptNumber] = useState<string>(`REC-STU-${Date.now().toString().slice(-6)}`);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [autoGenerateReceipt, setAutoGenerateReceipt] = useState<boolean>(true);
  const [status, setStatus] = useState<ParticipantStatus>('Active');
  const [notes, setNotes] = useState<string>('');

  // Custom key-value options list
  const [customFieldsList, setCustomFieldsList] = useState<Array<{ key: string; value: string }>>([
    { key: 'Skill Level', value: 'Beginner' },
  ]);

  // Filter available classes matching selected unit
  const availableClasses = classes.filter(
    (c) => c.unit.toLowerCase().trim() === unit.toLowerCase().trim() && c.status === 'Active'
  );

  useEffect(() => {
    if (editingParticipant) {
      setUnit(editingParticipant.unit);
      setClassId(editingParticipant.classId);
      setFullName(editingParticipant.fullName);
      setAge(editingParticipant.age ? String(editingParticipant.age) : '');
      setGender(editingParticipant.gender);
      setGuardianName(editingParticipant.guardianName || '');
      setGuardianPhone(editingParticipant.guardianPhone || '');
      setWhatsapp(editingParticipant.whatsapp || '');
      setEmail(editingParticipant.email || '');
      setAddress(editingParticipant.address || '');
      setJoiningDate(editingParticipant.joiningDate || new Date().toISOString().split('T')[0]);
      setFeeStatus(editingParticipant.feeStatus || 'Paid');
      setFeeAmountAED(editingParticipant.feeAmountAED !== undefined ? editingParticipant.feeAmountAED : 100);
      setPaymentMethod(editingParticipant.paymentMethod || 'Cash');
      setReceiptNumber(editingParticipant.receiptNumber || `REC-STU-${Date.now().toString().slice(-6)}`);
      setPaymentDate(editingParticipant.paymentDate || editingParticipant.joiningDate || new Date().toISOString().split('T')[0]);
      setStatus(editingParticipant.status || 'Active');
      setNotes(editingParticipant.notes || '');

      if (editingParticipant.customOptions) {
        const list = Object.entries(editingParticipant.customOptions).map(([k, v]) => ({
          key: k,
          value: String(v),
        }));
        setCustomFieldsList(list.length > 0 ? list : [{ key: 'Skill Level', value: 'Beginner' }]);
      } else {
        setCustomFieldsList([{ key: 'Skill Level', value: 'Beginner' }]);
      }
    } else {
      const initialUnit = isUnitOp && userSession?.unit ? userSession.unit : 'Fujairah';
      setUnit(initialUnit);
      const matching = classes.filter(
        (c) => c.unit.toLowerCase().trim() === initialUnit.toLowerCase().trim()
      );
      if (preselectedClassId) {
        setClassId(preselectedClassId);
        const sel = classes.find((c) => c.id === preselectedClassId);
        if (sel) {
          setUnit(sel.unit);
          setFeeAmountAED(sel.monthlyFeeAED || 100);
        }
      } else if (matching.length > 0) {
        setClassId(matching[0].id);
        setFeeAmountAED(matching[0].monthlyFeeAED || 100);
      } else if (classes.length > 0) {
        setClassId(classes[0].id);
        setFeeAmountAED(classes[0].monthlyFeeAED || 100);
      }
      setFullName('');
      setAge('');
      setGender('Male');
      setGuardianName('');
      setGuardianPhone('');
      setWhatsapp('');
      setEmail('');
      setAddress('');
      setJoiningDate(new Date().toISOString().split('T')[0]);
      setFeeStatus('Paid');
      setPaymentMethod('Cash');
      setReceiptNumber(`REC-STU-${Date.now().toString().slice(-6)}`);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setAutoGenerateReceipt(true);
      setStatus('Active');
      setNotes('');
      setCustomFieldsList([
        { key: 'Batch Timing', value: 'Weekend Evening' },
        { key: 'Skill Level', value: 'Beginner' },
      ]);
    }
  }, [editingParticipant, isOpen, defaultUnit, preselectedClassId]);

  if (!isOpen) return null;

  const handleUnitChange = (newUnit: string) => {
    setUnit(newUnit);
    const matching = classes.filter((c) => c.unit.toLowerCase().trim() === newUnit.toLowerCase().trim());
    if (matching.length > 0) {
      setClassId(matching[0].id);
      setFeeAmountAED(matching[0].monthlyFeeAED || 100);
    } else {
      setClassId('');
    }
  };

  const handleClassChange = (newClassId: string) => {
    setClassId(newClassId);
    const sel = classes.find((c) => c.id === newClassId);
    if (sel) {
      setFeeAmountAED(sel.monthlyFeeAED || 100);
    }
  };

  const handleAddCustomField = () => {
    setCustomFieldsList([...customFieldsList, { key: '', value: '' }]);
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFieldsList(customFieldsList.filter((_, i) => i !== index));
  };

  const handleCustomFieldChange = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...customFieldsList];
    updated[index][field] = val;
    setCustomFieldsList(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('Please enter student / participant full name.');
      return;
    }
    if (!classId) {
      alert('Please select a class / course for enrollment.');
      return;
    }
    if (!guardianPhone.trim()) {
      alert('Please enter parent / guardian UAE phone number.');
      return;
    }

    const selectedClass = classes.find((c) => c.id === classId);
    const className = selectedClass ? selectedClass.name : 'Unit Cultural Class';

    const customOptionsRecord: Record<string, string> = {};
    customFieldsList.forEach((item) => {
      if (item.key.trim()) {
        customOptionsRecord[item.key.trim()] = item.value.trim();
      }
    });

    const studentId = editingParticipant?.studentId || generateNextStudentId(unit, existingParticipants);

    const isPaid = feeStatus === 'Paid';
    const cleanReceiptNo = receiptNumber.trim() || `REC-STU-${Date.now().toString().slice(-6)}`;

    const participantData: ClassParticipant = {
      id: editingParticipant?.id || `stu-${Date.now()}`,
      studentId,
      classId,
      className,
      unit,
      fullName: fullName.trim(),
      age: age ? Number(age) : undefined,
      gender,
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      whatsapp: (whatsapp || guardianPhone).trim(),
      email: email.trim(),
      address: address.trim(),
      joiningDate,
      feeStatus,
      feeAmountAED: Number(feeAmountAED) || 0,
      paymentMethod: isPaid ? paymentMethod : undefined,
      receiptNumber: isPaid ? cleanReceiptNo : undefined,
      paymentDate: isPaid ? paymentDate : undefined,
      status,
      customOptions: Object.keys(customOptionsRecord).length > 0 ? customOptionsRecord : undefined,
      notes: notes.trim(),
      createdAt: editingParticipant?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(participantData, isPaid && autoGenerateReceipt);
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
              <UserPlus className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                {editingParticipant ? 'Edit Student / Participant Record' : 'Register New Student / Participant'}
              </h3>
              <p className="text-xs text-rose-100 mt-0.5">
                Enroll student in Dance, Chenda Melam, Music, Yoga or Arts with custom details
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
          {/* Unit & Class Enrollment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Unit Jurisdiction <span className="text-rose-500">*</span>
              </label>
              <select
                disabled={isUnitOp}
                value={unit}
                onChange={(e) => handleUnitChange(e.target.value)}
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
                Enrolled Class / Course <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={classId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white outline-none"
              >
                {availableClasses.length === 0 ? (
                  <option value="">No active classes in {unit} Unit</option>
                ) : (
                  availableClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.instructorName})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Student Name & Age/Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Student Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aarav Rahul Nair"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  min="3"
                  max="90"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="12"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Parent / Guardian Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Parent / Guardian Name
              </label>
              <input
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="e.g. Rahul K. Nair"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Parent / Guardian Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                placeholder="+971 50 123 4567"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>
          </div>

          {/* WhatsApp & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">WhatsApp Number</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+971 50 123 4567"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parent.email@gmail.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          {/* Course Fee, Payment Status & Finance Linkage */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Class Fee &amp; Payment Status</span>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  feeStatus === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : feeStatus === 'Exempt'
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {feeStatus === 'Paid' ? 'Paid & Linked to Finance' : feeStatus === 'Exempt' ? 'Fee Exempt' : 'Payment Not Paid / Due'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Monthly Course Fee (AED)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={feeAmountAED}
                    onChange={(e) => setFeeAmountAED(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-white focus:ring-1 focus:ring-rose-800 outline-none"
                  />
                  <span className="absolute right-2.5 top-2 text-slate-400 font-mono font-bold">
                    AED
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Status <span className="text-rose-500">*</span></label>
                <select
                  value={feeStatus}
                  onChange={(e) => {
                    const newStatus = e.target.value as ParticipantFeeStatus;
                    setFeeStatus(newStatus);
                    if (newStatus === 'Paid' && !receiptNumber) {
                      setReceiptNumber(`REC-STU-${Date.now().toString().slice(-6)}`);
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-bold outline-none ${
                    feeStatus === 'Paid'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                      : feeStatus === 'Exempt'
                      ? 'border-slate-300 bg-slate-100 text-slate-800'
                      : 'border-amber-300 bg-amber-50 text-amber-900'
                  }`}
                >
                  <option value="Paid">✓ Paid (Collected)</option>
                  <option value="Pending">⚠ Not Paid / Pending Due</option>
                  <option value="Exempt">✕ Exempt / Scholarship</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white outline-none"
                >
                  <option value="Active">Active Student</option>
                  <option value="Inactive">Inactive / On Leave</option>
                  <option value="Graduated">Graduated / Completed</option>
                </select>
              </div>
            </div>

            {/* When Paid: Show Payment Method, Receipt Number, Date, and Auto-Receipt Checkbox */}
            {feeStatus === 'Paid' && (
              <div className="pt-2 border-t border-slate-200 space-y-2.5 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white outline-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer / Online</option>
                      <option value="Card / POS">Card / POS</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Online">Online / UPI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Receipt Number</label>
                    <input
                      type="text"
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      placeholder="REC-STU-1001"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-white text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoGenerateReceipt}
                      onChange={(e) => setAutoGenerateReceipt(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                    />
                    <span>Link with <strong>{unit} Unit Finance Ledger</strong> and pop up official printable receipt</span>
                  </label>
                  <span className="text-[11px] font-mono font-bold text-emerald-700">
                    AED {feeAmountAED}
                  </span>
                </div>
              </div>
            )}

            {feeStatus === 'Pending' && (
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center justify-between">
                <span>
                  <strong>Note:</strong> Student marked as <strong>Not Paid / Due</strong>. You can collect fee and generate receipt anytime directly from the student list.
                </span>
                <span className="font-mono font-bold text-amber-900">Due: AED {feeAmountAED}</span>
              </div>
            )}
          </div>

          {/* CUSTOM OPTIONS & PARTICIPANT ATTRIBUTES */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Tag className="w-4 h-4 text-rose-800" />
                <span>Custom Options &amp; Attributes</span>
              </div>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Custom Option</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Add any custom options such as Batch Timing, Instrument Status, Uniform Size, Level, or Preferences.
            </p>

            <div className="space-y-2">
              {customFieldsList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Option Name (e.g. Batch, Costume Size)"
                    value={item.key}
                    onChange={(e) => handleCustomFieldChange(idx, 'key', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Saturday Morning, Size 32)"
                    value={item.value}
                    onChange={(e) => handleCustomFieldChange(idx, 'value', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomField(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Remove custom option"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Address & Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Residential Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Flat 302, Al Sharq Tower, Fujairah"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Special Notes / Medical / Instructions</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Allergic to certain materials / Previous dance experience in Kerala."
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
              <span>{editingParticipant ? 'Save Changes' : 'Register Student'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
