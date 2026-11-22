import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Member, BloodGroup } from '../types/member';
import {
  StudentWingMember,
  StudentWingRole,
  STUDENT_WING_ROLES,
} from '../types/studentsWing';
import {
  generateNextStudentWingId,
  normalizeChildrenWingId,
} from '../utils/studentsWingStorage';
import { loadPortalConfig } from '../utils/storage';
import { optimizeImageFile } from '../utils/imageOptimizer';
import {
  X,
  Upload,
  Trash2,
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  School,
  IdCard,
} from 'lucide-react';

interface StudentFormModalProps {
  isOpen: boolean;
  editingStudent: StudentWingMember | null;
  existingStudents: StudentWingMember[];
  kcaMembers: Member[];
  units: string[];
  lockedUnit?: string;
  onClose: () => void;
  onSave: (student: StudentWingMember, openIdCard?: boolean) => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  editingStudent,
  existingStudents,
  kcaMembers,
  units,
  lockedUnit,
  onClose,
  onSave,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const portalConfig = useMemo(() => loadPortalConfig(), [isOpen]);

  const defaultJoiningDate = new Date().toISOString().split('T')[0];
  const defaultExpiryDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d.toISOString().split('T')[0];
  }, []);

  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Institution & Wing Details (Grade / Year removed)
  const [schoolOrCollege, setSchoolOrCollege] = useState('');
  const [unit, setUnit] = useState(lockedUnit || units[0] || 'Fujairah');
  const [wingRole, setWingRole] = useState<StudentWingRole>("Children's Wing Member");
  const [talentsOrInterests, setTalentsOrInterests] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentEmail, setStudentEmail] = useState('');

  // Parent / Guardian Details
  const [isParentKcaMember, setIsParentKcaMember] = useState<boolean>(true);
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [parentMemberId, setParentMemberId] = useState('');
  const [parentMembershipId, setParentMembershipId] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentRelation, setParentRelation] = useState<'Father' | 'Mother' | 'Guardian'>('Father');
  const [secondaryParentName, setSecondaryParentName] = useState('');
  const [parentPhoneUAE, setParentPhoneUAE] = useState('');
  const [parentWhatsapp, setParentWhatsapp] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [residenceArea, setResidenceArea] = useState('');
  const [keralaDistrict, setKeralaDistrict] = useState('');

  // Status & Dates (No payment required)
  const [joiningDate, setJoiningDate] = useState(defaultJoiningDate);
  const [expiryDate, setExpiryDate] = useState(defaultExpiryDate);
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Alumni'>('Active');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFormError(null);
    setParentSearchQuery('');

    if (editingStudent) {
      setStudentId(normalizeChildrenWingId(editingStudent.studentId));
      setFullName(editingStudent.fullName);
      setGender(editingStudent.gender);
      setDateOfBirth(editingStudent.dateOfBirth || '');
      setBloodGroup(editingStudent.bloodGroup || '');
      setPhotoUrl(editingStudent.photoUrl || '');
      setSchoolOrCollege(editingStudent.schoolOrCollege || '');
      setUnit(lockedUnit || editingStudent.unit || units[0] || 'Fujairah');
      const normalizedRole = (editingStudent.wingRole || "Children's Wing Member")
        .replace(/Students Wing/gi, "Children's Wing")
        .replace(/^Student Member$/i, "Children's Wing Member");
      setWingRole(normalizedRole);
      setTalentsOrInterests(editingStudent.talentsOrInterests || '');
      setStudentPhone(editingStudent.studentPhone || '');
      setStudentEmail(editingStudent.studentEmail || '');

      setIsParentKcaMember(editingStudent.isParentKcaMember);
      setParentMemberId(editingStudent.parentMemberId || '');
      setParentMembershipId(editingStudent.parentMembershipId || '');
      setParentName(editingStudent.parentName || '');
      setParentRelation(editingStudent.parentRelation || 'Father');
      setSecondaryParentName(editingStudent.secondaryParentName || '');
      setParentPhoneUAE(editingStudent.parentPhoneUAE || '');
      setParentWhatsapp(editingStudent.parentWhatsapp || '');
      setParentEmail(editingStudent.parentEmail || '');
      setResidenceArea(editingStudent.residenceArea || '');
      setKeralaDistrict(editingStudent.keralaDistrict || '');

      setJoiningDate(editingStudent.joiningDate || defaultJoiningDate);
      setExpiryDate(editingStudent.expiryDate || defaultExpiryDate);
      setStatus(editingStudent.status || 'Active');
      setNotes(editingStudent.notes || '');
    } else {
      const initialUnit = lockedUnit || units[0] || 'Fujairah';
      setStudentId(generateNextStudentWingId(existingStudents, initialUnit));
      setFullName('');
      setGender('Male');
      setDateOfBirth('');
      setBloodGroup('');
      setPhotoUrl('');
      setSchoolOrCollege('');
      setUnit(initialUnit);
      setWingRole("Children's Wing Member");
      setTalentsOrInterests('');
      setStudentPhone('');
      setStudentEmail('');

      setIsParentKcaMember(kcaMembers.length > 0);
      setParentMemberId('');
      setParentMembershipId('');
      setParentName('');
      setParentRelation('Father');
      setSecondaryParentName('');
      setParentPhoneUAE('+971 ');
      setParentWhatsapp('+971 ');
      setParentEmail('');
      setResidenceArea('');
      setKeralaDistrict('');

      setJoiningDate(defaultJoiningDate);
      setExpiryDate(defaultExpiryDate);
      setStatus('Active');
      setNotes('');
    }
  }, [isOpen, editingStudent, existingStudents, kcaMembers.length, lockedUnit, units, defaultJoiningDate, defaultExpiryDate]);

  // Update auto-generated Member ID when unit changes for new member
  const handleUnitChange = (newUnit: string) => {
    setUnit(newUnit);
    if (!editingStudent) {
      setStudentId(generateNextStudentWingId(existingStudents, newUnit));
    }
  };

  // Filtered KCA Members for Parent Selection
  const filteredKcaMembers = useMemo(() => {
    const q = parentSearchQuery.trim().toLowerCase();
    if (!q) return kcaMembers;
    return kcaMembers.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.membershipId.toLowerCase().includes(q) ||
        (m.phoneUAE && m.phoneUAE.toLowerCase().includes(q)) ||
        (m.unit && m.unit.toLowerCase().includes(q))
    );
  }, [kcaMembers, parentSearchQuery]);

  // Select a KCA Member as Parent
  const handleSelectKcaParent = (memberId: string) => {
    setParentMemberId(memberId);
    const chosen = kcaMembers.find((m) => m.id === memberId);
    if (chosen) {
      setParentMembershipId(chosen.membershipId);
      setParentName(chosen.fullName);
      setParentRelation(chosen.gender === 'Female' ? 'Mother' : 'Father');
      setParentPhoneUAE(chosen.phoneUAE || '');
      setParentWhatsapp(chosen.whatsapp || chosen.phoneUAE || '');
      setParentEmail(chosen.email || '');
      const area = (chosen as any).residenceArea || chosen.uaeArea || chosen.uaeAddress;
      if (area) setResidenceArea(area);
      if (chosen.keralaDistrict) setKeralaDistrict(chosen.keralaDistrict);
      if (!lockedUnit && chosen.unit) {
        handleUnitChange(chosen.unit);
      }
    }
  };

  // Photo Upload Handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const optimized = await optimizeImageFile(file, {
        maxWidth: 480,
        maxHeight: 600,
        quality: 0.84,
      });
      if (optimized.dataUrl) {
        setPhotoUrl(optimized.dataUrl);
      }
    } catch (err) {
      console.error('Error optimizing photo:', err);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (openIdCardAfterSave: boolean) => {
    if (!fullName.trim()) {
      setFormError("Please enter the Member's Full Name.");
      return;
    }
    if (!parentName.trim()) {
      setFormError('Please select a KCA Member Parent or enter the Parent / Guardian Name.');
      return;
    }
    if (!parentPhoneUAE.trim()) {
      setFormError('Please enter the Parent Contact Mobile Number.');
      return;
    }

    const now = new Date().toISOString();
    const record: StudentWingMember = {
      id: editingStudent ? editingStudent.id : `cw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      studentId: normalizeChildrenWingId(studentId.trim()) || generateNextStudentWingId(existingStudents, unit),
      fullName: fullName.trim(),
      gender,
      dateOfBirth: dateOfBirth || '2012-01-01',
      bloodGroup,
      photoUrl: photoUrl || undefined,
      schoolOrCollege: schoolOrCollege.trim(),
      gradeOrCourse: '',
      unit,
      wingRole,
      talentsOrInterests: talentsOrInterests.trim() || undefined,
      studentPhone: studentPhone.trim() || undefined,
      studentEmail: studentEmail.trim() || undefined,
      isParentKcaMember,
      parentMemberId: isParentKcaMember ? parentMemberId || undefined : undefined,
      parentMembershipId: isParentKcaMember ? parentMembershipId.trim() || undefined : undefined,
      parentName: parentName.trim(),
      parentRelation,
      secondaryParentName: secondaryParentName.trim() || undefined,
      parentPhoneUAE: parentPhoneUAE.trim(),
      parentWhatsapp: parentWhatsapp.trim() || parentPhoneUAE.trim(),
      parentEmail: parentEmail.trim() || undefined,
      residenceArea: residenceArea.trim() || undefined,
      keralaDistrict: keralaDistrict.trim() || undefined,
      joiningDate,
      expiryDate,
      status,
      notes: notes.trim() || undefined,
      createdAt: editingStudent ? editingStudent.createdAt : now,
      updatedAt: now,
    };

    onSave(record, openIdCardAfterSave);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[93vh] flex flex-col overflow-hidden my-auto">
        {/* Top Modal Header */}
        <div
          className="px-6 py-4 text-white flex items-center justify-between border-b border-black/20"
          style={{
            backgroundColor: '#8b0000',
            backgroundImage: 'linear-gradient(135deg, var(--color-primary, #8b0000) 0%, var(--color-primary-dark, #520000) 100%)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
                <span>{portalConfig.shortName || portalConfig.portalName || 'KCA'} &bull; Dedicated Children&apos;s Wing</span>
              </div>
              <h2 className="font-display font-black text-xl text-white">
                {editingStudent ? `Edit Children's Wing Profile (${normalizeChildrenWingId(editingStudent.studentId)})` : "Register New Children's Wing Member"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* No-Payment Notice Banner */}
        <div className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800/60 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-red-950 dark:text-rose-200 font-semibold">
            <ShieldCheck className="w-4 h-4 text-red-700 shrink-0" />
            <span>
              <strong>Children&apos;s Wing Enrollment:</strong> No membership fee or payment is required for Children&apos;s Wing members. Separate from main Members list.
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-red-800 text-white font-bold text-[10px] uppercase tracking-wider">
            NO FEE REQUIRED
          </span>
        </div>

        {formError && (
          <div className="bg-rose-50 text-rose-800 px-6 py-2.5 border-b border-rose-200 text-xs font-bold">
            {formError}
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* SECTION 1: PHOTO + MEMBER IDENTITY */}
          <div className="grid grid-cols-1 md:grid-cols-[170px_1fr] gap-6 items-start bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* Member Photo Upload Box */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-38 rounded-2xl border-2 border-dashed border-red-700 bg-white dark:bg-slate-900 overflow-hidden flex flex-col items-center justify-center relative shadow-sm">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Member preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-3 text-slate-400">
                    <Sparkles className="w-9 h-9 mx-auto text-red-700/60 mb-1" />
                    <span className="text-[10px] font-bold uppercase block">Member Photo</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Passport Size</span>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <div className="mt-2.5 flex items-center gap-1.5 w-full justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-800 hover:bg-red-900 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingPhoto ? 'Optimizing...' : photoUrl ? 'Change' : 'Upload Photo'}</span>
                </button>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 transition-colors cursor-pointer"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Primary Member Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Member Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Member ID
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-mono text-sm font-bold text-red-900 dark:text-rose-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Gender *
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-rose-700 dark:text-rose-400"
                >
                  <option value="">-- Select Blood Group (Optional) --</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: INSTITUTION & WING ROLE DETAILS (Grade / Year removed) */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <School className="w-4 h-4 text-red-700" />
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                2. School / Institution &amp; Children&apos;s Wing Designation
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  School / Institution Name
                </label>
                <input
                  type="text"
                  value={schoolOrCollege}
                  onChange={(e) => setSchoolOrCollege(e.target.value)}
                  placeholder="e.g., Our Own English High School Fujairah / St. Mary's High School"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Children&apos;s Wing Role
                </label>
                <select
                  value={wingRole}
                  onChange={(e) => setWingRole(e.target.value as StudentWingRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-red-900 dark:text-rose-300"
                >
                  {STUDENT_WING_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  KCA Unit *
                </label>
                <select
                  value={unit}
                  disabled={!!lockedUnit}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white disabled:opacity-60"
                >
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Talents / Cultural Interests
                </label>
                <input
                  type="text"
                  value={talentsOrInterests}
                  onChange={(e) => setTalentsOrInterests(e.target.value)}
                  placeholder="e.g., Classical Dance, Music, Drawing, Chess, Elocution"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: PARENT / GUARDIAN DETAILS (CHOOSE FROM KCA MEMBER OR ADD MANUALLY) */}
          <div className="bg-rose-50/50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200/70 dark:border-rose-800/60 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-red-800 dark:text-rose-400" />
                <div>
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-red-950 dark:text-rose-200">
                    3. Parent / Guardian Details (KCA Member Link or Manual Entry)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    If the child&apos;s parent is a Kairali Cultural Association member, select them to auto-fill details.
                  </p>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="inline-flex rounded-xl bg-white dark:bg-slate-900 p-1 border border-rose-200 dark:border-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setIsParentKcaMember(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isParentKcaMember
                      ? 'bg-red-800 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Choose from KCA Members ({kcaMembers.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsParentKcaMember(false);
                    setParentMemberId('');
                    setParentMembershipId('');
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !isParentKcaMember
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Enter Parent Manually</span>
                </button>
              </div>
            </div>

            {/* KCA Member Selector Dropdown */}
            {isParentKcaMember && (
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-rose-200 dark:border-slate-800 space-y-2.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-red-900 dark:text-rose-300">
                  Search &amp; Select Parent from Existing KCA Members List
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={parentSearchQuery}
                      onChange={(e) => setParentSearchQuery(e.target.value)}
                      placeholder="Filter by Member Name, ID (e.g. KCA-FUJ-101), or Phone..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <select
                    value={parentMemberId}
                    onChange={(e) => handleSelectKcaParent(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-rose-300 dark:border-rose-700 bg-rose-50/40 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="">-- Select KCA Member Parent ({filteredKcaMembers.length} matches) --</option>
                    {filteredKcaMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.unit} Unit • {m.phoneUAE})
                      </option>
                    ))}
                  </select>
                </div>

                {parentMembershipId && (
                  <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Linked to KCA Member: <strong>{parentName}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setParentMemberId('');
                        setParentMembershipId('');
                      }}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Unlink
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Parent Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Primary Parent / Guardian Name *
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Father / Mother Full Name"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Relationship to Member
                </label>
                <select
                  value={parentRelation}
                  onChange={(e) => setParentRelation(e.target.value as 'Father' | 'Mother' | 'Guardian')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Parent KCA Membership ID (If Member)
                </label>
                <input
                  type="text"
                  value={parentMembershipId}
                  onChange={(e) => setParentMembershipId(e.target.value)}
                  placeholder={isParentKcaMember ? 'Auto-filled or type KCA ID' : 'Non-member (Optional)'}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm font-bold text-red-900 dark:text-rose-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Other Parent Name (Mother / Father)
                </label>
                <input
                  type="text"
                  value={secondaryParentName}
                  onChange={(e) => setSecondaryParentName(e.target.value)}
                  placeholder="Optional spouse / second parent name"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Parent UAE Mobile Number *
                </label>
                <input
                  type="text"
                  value={parentPhoneUAE}
                  onChange={(e) => setParentPhoneUAE(e.target.value)}
                  placeholder="+971 50 123 4567"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Parent WhatsApp Number
                </label>
                <input
                  type="text"
                  value={parentWhatsapp}
                  onChange={(e) => setParentWhatsapp(e.target.value)}
                  placeholder="+971 50 123 4567"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Parent Email Address
                </label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  UAE Residence Area
                </label>
                <input
                  type="text"
                  value={residenceArea}
                  onChange={(e) => setResidenceArea(e.target.value)}
                  placeholder="e.g., Faseel, Fujairah"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Kerala District (Native Place)
                </label>
                <input
                  type="text"
                  value={keralaDistrict}
                  onChange={(e) => setKeralaDistrict(e.target.value)}
                  placeholder="e.g., Thrissur, Ernakulam, Kannur"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: VALIDITY & STATUS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Enrollment Date
              </label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                ID Card Valid Until
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Member Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive' | 'Alumni')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-emerald-700 dark:text-emerald-400"
              >
                <option value="Active">Active Member</option>
                <option value="Alumni">Alumni</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{editingStudent ? 'Save Changes' : 'Save Member'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <IdCard className="w-4 h-4 text-amber-300" />
              <span>{editingStudent ? "Save & View Children's Wing ID Card" : "Save & Generate Children's Wing ID Card"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
