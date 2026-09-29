import React, { useState, useEffect } from 'react';
import {
  CulturalClass,
  ClassParticipant,
  ParticipantFeeStatus,
  ParticipantStatus,
  StudentSplitPayment,
} from '../types/classes';
import { UserSession } from '../types/member';
import { generateNextStudentId } from '../utils/classesStorage';
import { formatAED } from '../utils/idGenerator';
import {
  X,
  UserPlus,
  GraduationCap,
  Building2,
  Plus,
  Trash2,
  Phone,
  Mail,
  Sparkles,
  Tag,
  CreditCard,
  Split,
  Calendar,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
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
  const [batchName, setBatchName] = useState<string>('Batch 1 - Regular');
  const [fullName, setFullName] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [guardianName, setGuardianName] = useState<string>('');
  const [guardianPhone, setGuardianPhone] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [joiningDate, setJoiningDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Fee & Payment Architecture
  const [feeAmountAED, setFeeAmountAED] = useState<number>(100);
  const [paymentModeType, setPaymentModeType] = useState<'single' | 'split'>('single');
  const [feeStatus, setFeeStatus] = useState<ParticipantFeeStatus>('Paid');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [receiptNumber, setReceiptNumber] = useState<string>(`REC-STU-${Date.now().toString().slice(-6)}`);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [autoGenerateReceipt, setAutoGenerateReceipt] = useState<boolean>(true);
  
  // Split Payments Table
  const [splitPayments, setSplitPayments] = useState<StudentSplitPayment[]>([]);

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
      setBatchName(editingParticipant.batchName || 'Batch 1 - Regular');
      setFullName(editingParticipant.fullName);
      setAge(editingParticipant.age ? String(editingParticipant.age) : '');
      setGender(editingParticipant.gender || 'Male');
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

      const existingSplits = editingParticipant.splitPayments || editingParticipant.paymentHistory || [];
      if (existingSplits.length > 0) {
        setSplitPayments(existingSplits);
        setPaymentModeType('split');
      } else {
        setSplitPayments([]);
        setPaymentModeType('single');
      }

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
          setBatchName(sel.batchName || 'Batch 1 - Regular');
        }
      } else if (matching.length > 0) {
        setClassId(matching[0].id);
        setFeeAmountAED(matching[0].monthlyFeeAED || 100);
        setBatchName(matching[0].batchName || 'Batch 1 - Regular');
      } else if (classes.length > 0) {
        setClassId(classes[0].id);
        setFeeAmountAED(classes[0].monthlyFeeAED || 100);
        setBatchName(classes[0].batchName || 'Batch 1 - Regular');
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
      setPaymentModeType('single');
      setFeeStatus('Paid');
      setPaymentMethod('Cash');
      setReceiptNumber(`REC-STU-${Date.now().toString().slice(-6)}`);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setAutoGenerateReceipt(true);
      setSplitPayments([]);
      setStatus('Active');
      setNotes('');
      setCustomFieldsList([
        { key: 'Batch Timing', value: 'Weekend Evening' },
        { key: 'Skill Level', value: 'Beginner' },
      ]);
    }
  }, [editingParticipant, isOpen, defaultUnit, preselectedClassId]);

  // Dynamic calculations for split payments
  const totalPaidInSplits = splitPayments.reduce((sum, p) => sum + (Number(p.amountAED) || 0), 0);
  const effectiveTotalPaid = paymentModeType === 'split' 
    ? totalPaidInSplits 
    : (feeStatus === 'Paid' ? feeAmountAED : (feeStatus === 'Exempt' ? 0 : 0));
  const remainingBalance = Math.max(0, feeAmountAED - effectiveTotalPaid);

  const handleUnitChange = (newUnit: string) => {
    setUnit(newUnit);
    const matching = classes.filter((c) => c.unit.toLowerCase().trim() === newUnit.toLowerCase().trim());
    if (matching.length > 0) {
      setClassId(matching[0].id);
      setFeeAmountAED(matching[0].monthlyFeeAED || 100);
      setBatchName(matching[0].batchName || 'Batch 1 - Regular');
    } else {
      setClassId('');
    }
  };

  const handleClassChange = (newClassId: string) => {
    setClassId(newClassId);
    const sel = classes.find((c) => c.id === newClassId);
    if (sel) {
      setFeeAmountAED(sel.monthlyFeeAED || 100);
      if (sel.batchName) setBatchName(sel.batchName);
    }
  };

  // Add Split Payment Entry
  const handleAddSplitPayment = () => {
    const defaultInstallmentAmount = remainingBalance > 0 ? remainingBalance : Math.round(feeAmountAED / 2);
    const newSplit: StudentSplitPayment = {
      id: `split-${Date.now()}-${splitPayments.length + 1}`,
      receiptNumber: `REC-SPLIT-${Date.now().toString().slice(-5)}`,
      amountAED: defaultInstallmentAmount,
      date: new Date().toISOString().split('T')[0],
      method: paymentMethod || 'Cash',
      notes: `Installment #${splitPayments.length + 1}`,
      recordedBy: userSession?.fullName || 'Finance Desk',
    };
    setSplitPayments([...splitPayments, newSplit]);
  };

  const handleRemoveSplitPayment = (id: string) => {
    setSplitPayments(splitPayments.filter((p) => p.id !== id));
  };

  const handleUpdateSplitPayment = (id: string, field: keyof StudentSplitPayment, value: any) => {
    setSplitPayments(
      splitPayments.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
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

  if (!isOpen) return null;

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

    // Auto-calculate fee status based on payments
    let calculatedStatus: ParticipantFeeStatus = feeStatus;
    if (paymentModeType === 'split') {
      if (splitPayments.length === 0 || totalPaidInSplits === 0) {
        calculatedStatus = 'Pending';
      } else if (totalPaidInSplits >= feeAmountAED) {
        calculatedStatus = 'Paid';
      } else {
        calculatedStatus = 'Partial';
      }
    }

    const cleanReceiptNo = receiptNumber.trim() || `REC-STU-${Date.now().toString().slice(-6)}`;
    const isFullPaid = calculatedStatus === 'Paid';

    const participantData: ClassParticipant = {
      id: editingParticipant?.id || `stu-${Date.now()}`,
      studentId,
      classId,
      className,
      unit,
      batchName: batchName.trim() || undefined,
      fullName: fullName.trim(),
      age: age ? Number(age) : undefined,
      gender,
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      whatsapp: (whatsapp || guardianPhone).trim(),
      email: email.trim(),
      address: address.trim(),
      joiningDate,
      feeStatus: calculatedStatus,
      feeAmountAED: Number(feeAmountAED) || 0,
      totalPaidAED: paymentModeType === 'split' ? totalPaidInSplits : (isFullPaid ? Number(feeAmountAED) || 0 : 0),
      balanceDueAED: remainingBalance,
      paymentMethod: paymentModeType === 'single' && isFullPaid ? paymentMethod : (paymentModeType === 'split' ? 'Split Installments' : undefined),
      receiptNumber: paymentModeType === 'single' && isFullPaid ? cleanReceiptNo : undefined,
      paymentDate: paymentModeType === 'single' && isFullPaid ? paymentDate : undefined,
      splitPayments: paymentModeType === 'split' ? splitPayments : undefined,
      paymentHistory: paymentModeType === 'split' ? splitPayments : undefined,
      status,
      customOptions: Object.keys(customOptionsRecord).length > 0 ? customOptionsRecord : undefined,
      notes: notes.trim(),
      createdAt: editingParticipant?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(participantData, autoGenerateReceipt && (isFullPaid || (paymentModeType === 'split' && splitPayments.length > 0)));
    confetti({ particleCount: 30, spread: 60 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
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
                Enroll student in Cultural Academies with multiple split installment payment support
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
          {/* Unit, Class & Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      {c.name} ({c.scheduleTime || 'Regular'})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Batch Timing / Slot
              </label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="e.g. Batch 1 - Friday Morning"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white outline-none"
              />
            </div>
          </div>

          {/* Student Profile Information */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-[#8b0000]" />
              Student Profile
            </h4>

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
                  placeholder="e.g. Ananya Krishna"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 bg-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Age / Gender
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    min="3"
                    max="90"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Age"
                    className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs bg-white text-center font-bold"
                  />
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-1.5 py-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Parent / Guardian Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Parent / Guardian Name
                </label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="e.g. Radhakrishnan K"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>UAE Phone Number *</span>
                </label>
                <input
                  type="tel"
                  required
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  placeholder="+971 50 123 4567"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-blue-600" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FEE & MULTI-TIME SPLIT PAYMENT SYSTEM                                    */}
          {/* ========================================================================= */}
          <div className="p-4 bg-gradient-to-r from-amber-50/70 to-orange-50/70 rounded-xl border border-amber-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-600 text-white">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wide">
                    Course Tuition Fee &amp; Payment Options
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    Supports single lump-sum payment or multiple split installments for the same class
                  </p>
                </div>
              </div>

              {/* Toggle: Single vs Split Payment */}
              <div className="flex items-center bg-white p-1 rounded-lg border border-amber-300 shrink-0">
                <button
                  type="button"
                  onClick={() => setPaymentModeType('single')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    paymentModeType === 'single'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  Single Full Payment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentModeType('split');
                    if (splitPayments.length === 0) {
                      handleAddSplitPayment();
                    }
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    paymentModeType === 'split'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  <Split className="w-3 h-3" />
                  <span>Split Installments</span>
                </button>
              </div>
            </div>

            {/* Total Fee & Balance Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white rounded-lg border border-amber-200 shadow-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Total Course Fee (AED) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={feeAmountAED}
                  onChange={(e) => setFeeAmountAED(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-mono font-black text-[#8b0000] outline-none"
                />
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-600 mb-1">Total Paid So Far</div>
                <div className="font-mono font-bold text-sm text-emerald-700 pt-1.5">
                  {formatAED(effectiveTotalPaid)}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-600 mb-1">Remaining Balance Due</div>
                <div className={`font-mono font-bold text-sm pt-1.5 ${remainingBalance > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                  {formatAED(remainingBalance)}
                </div>
              </div>
            </div>

            {/* Single Payment Mode Form */}
            {paymentModeType === 'single' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fee Status</label>
                  <select
                    value={feeStatus}
                    onChange={(e) => setFeeStatus(e.target.value as ParticipantFeeStatus)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold text-xs bg-white"
                  >
                    <option value="Paid">Paid (Full)</option>
                    <option value="Pending">Pending Payment</option>
                    <option value="Exempt">Fee Exempt (Scholarship)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card / POS">Card / POS Terminal</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Online">Online / UAE Pass</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI / Digital</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Receipt Number</label>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold bg-white"
                  />
                </div>
              </div>
            ) : (
              /* Split Installments Mode Form */
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-950">
                    Recorded Installments ({splitPayments.length}):
                  </span>
                  <button
                    type="button"
                    onClick={handleAddSplitPayment}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Installment</span>
                  </button>
                </div>

                {splitPayments.length === 0 ? (
                  <div className="p-3 text-center text-slate-500 bg-white rounded-lg border border-amber-200">
                    No installments added yet. Click "+ Add Installment" to record a partial payment.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {splitPayments.map((split, idx) => (
                      <div
                        key={split.id}
                        className="p-2.5 bg-white rounded-lg border border-amber-200 flex flex-wrap sm:flex-nowrap items-center gap-2 shadow-2xs"
                      >
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>

                        {/* Amount */}
                        <div className="w-24 shrink-0">
                          <input
                            type="number"
                            min="1"
                            value={split.amountAED}
                            onChange={(e) =>
                              handleUpdateSplitPayment(split.id, 'amountAED', Number(e.target.value) || 0)
                            }
                            placeholder="AED"
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono font-bold text-emerald-800 text-right"
                          />
                        </div>

                        {/* Date */}
                        <div className="w-28 shrink-0">
                          <input
                            type="date"
                            value={split.date}
                            onChange={(e) => handleUpdateSplitPayment(split.id, 'date', e.target.value)}
                            className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs font-mono"
                          />
                        </div>

                        {/* Method */}
                        <div className="w-28 shrink-0">
                          <select
                            value={split.method}
                            onChange={(e) => handleUpdateSplitPayment(split.id, 'method', e.target.value)}
                            className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs"
                          >
                            <option value="Cash">Cash</option>
                            <option value="Card / POS">Card</option>
                            <option value="Bank Transfer">Transfer</option>
                            <option value="Online">Online</option>
                            <option value="Cheque">Cheque</option>
                            <option value="UPI">UPI</option>
                          </select>
                        </div>

                        {/* Receipt No */}
                        <div className="flex-1 min-w-[100px]">
                          <input
                            type="text"
                            value={split.receiptNumber}
                            onChange={(e) => handleUpdateSplitPayment(split.id, 'receiptNumber', e.target.value)}
                            placeholder="Receipt #"
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono font-semibold"
                          />
                        </div>

                        {/* Notes / Reason */}
                        <div className="flex-1 min-w-[100px]">
                          <input
                            type="text"
                            value={split.notes || ''}
                            onChange={(e) => handleUpdateSplitPayment(split.id, 'notes', e.target.value)}
                            placeholder="Remarks (e.g. 1st installment)"
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                          />
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => handleRemoveSplitPayment(split.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Remove installment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Auto finance sync notification */}
            <div className="flex items-center gap-2 pt-1 text-[11px] text-amber-900 font-medium">
              <input
                type="checkbox"
                id="autoGenReceipt"
                checked={autoGenerateReceipt}
                onChange={(e) => setAutoGenerateReceipt(e.target.checked)}
                className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="autoGenReceipt" className="cursor-pointer">
                Automatically generate official receipts and sync fee payments to Central/Unit Finance Income Ledger
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--color-primary, #881337)' }}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>{editingParticipant ? 'Save Changes' : 'Register Student & Save'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
