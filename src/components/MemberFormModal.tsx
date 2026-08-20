import React, { useState, useEffect, useRef } from 'react';
import {
  Member,
  MembershipType,
  RegistrationCategory,
  BloodGroup,
  PaymentMethod,
  PaymentStatus,
  CustomFieldDefinition,
  UserSession,
  MemberDocument,
  DocumentCategory,
} from '../types/member';
import { getNextMembershipId, getDefaultExpiryDate, getNextMarch31Date, getUnitIdPrefix, getNextMemberReceiptNumber } from '../utils/idGenerator';
import { DynamicFieldInput } from './DynamicFieldInput';
import {
  X,
  User,
  Calendar,
  HeartPulse,
  MapPin,
  Camera,
  Upload,
  CreditCard,
  Phone,
  ShieldCheck,
  Sparkles,
  Check,
  RefreshCw,
  Plus,
  Sliders,
  Briefcase,
  Layers,
  Lock,
  Building2,
  FileText,
  Paperclip,
  Trash2,
  Download,
  FileUp,
} from 'lucide-react';

interface MemberFormModalProps {
  member?: Member | null;
  existingMembers: Member[];
  units: string[];
  customFields: CustomFieldDefinition[];
  lockedUnit?: string;
  userSession?: UserSession;
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Member) => void;
  onOpenFieldManager: () => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const MEMBERSHIP_TYPES: MembershipType[] = ['General Member', 'Executive Member', 'Central Committee Member'];
const KERALA_DISTRICTS = [
  'Alappuzha',
  'Ernakulam',
  'Idukki',
  'Kannur',
  'Kasaragod',
  'Kollam',
  'Kottayam',
  'Kozhikode',
  'Malappuram',
  'Palakkad',
  'Pathanamthitta',
  'Thiruvananthapuram',
  'Thrissur',
  'Wayanad',
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
];

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  member,
  existingMembers,
  units,
  customFields,
  lockedUnit,
  userSession,
  isOpen,
  onClose,
  onSave,
  onOpenFieldManager,
}) => {
  const isEditing = !!member;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine active unit default
  const effectiveDefaultUnit = lockedUnit || units[0] || 'Fujairah';

  // Form State
  const [membershipId, setMembershipId] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1990-01-01');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [unit, setUnit] = useState(effectiveDefaultUnit);
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [customUnitInput, setCustomUnitInput] = useState('');
  const [photoUrl, setPhotoUrl] = useState(PRESET_AVATARS[0]);
  const [expiryDate, setExpiryDate] = useState(getDefaultExpiryDate());
  const [membershipType, setMembershipType] = useState<MembershipType>('General Member');
  const [registrationCategory, setRegistrationCategory] = useState<RegistrationCategory>('New');
  const [paymentPurpose, setPaymentPurpose] = useState<'New Membership Fee' | 'Renewal Fee'>('New Membership Fee');
  const [registrationDate, setRegistrationDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Active' | 'Expired' | 'Pending' | 'Suspended'>('Active');

  // Contact
  const [phoneUAE, setPhoneUAE] = useState('+971 50 ');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [emiratesId, setEmiratesId] = useState('784-');
  const [passportNumber, setPassportNumber] = useState('');
  const [norkaId, setNorkaId] = useState('');
  const [profession, setProfession] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Supporting Documents
  const [documents, setDocuments] = useState<MemberDocument[]>([]);
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const [docCategory, setDocCategory] = useState<DocumentCategory>('emirates_id');
  const [docTitle, setDocTitle] = useState('');

  // Address
  const [uaeAddress, setUaeAddress] = useState('Fujairah, UAE');
  const [keralaAddress, setKeralaAddress] = useState('');
  const [keralaDistrict, setKeralaDistrict] = useState('Kozhikode');

  // Emergency
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('Spouse');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('+971 ');

  // Payment in AED
  const [feeAmountAED, setFeeAmountAED] = useState<number>(30);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [receiptNumber, setReceiptNumber] = useState('');

  // Dynamic Custom Field Values Record
  const [customValues, setCustomValues] = useState<Record<string, any>>({});

  const prevIsOpenRef = useRef(false);
  const prevMemberIdRef = useRef<string | undefined>(undefined);

  // Synchronize state ONLY when modal opens or target member ID changes
  useEffect(() => {
    const isJustOpening = isOpen && !prevIsOpenRef.current;
    const isDifferentMember = isOpen && member?.id !== prevMemberIdRef.current;

    if (isOpen && (isJustOpening || isDifferentMember)) {
      prevMemberIdRef.current = member?.id;

      if (member) {
        setMembershipId(member.membershipId);
        setFullName(member.fullName);
        setDateOfBirth(member.dateOfBirth || '1990-01-01');
        setBloodGroup(member.bloodGroup || 'O+');

        if (units.includes(member.unit)) {
          setUnit(member.unit);
          setIsCustomUnit(false);
          setCustomUnitInput('');
        } else {
          setUnit(member.unit);
          setIsCustomUnit(true);
          setCustomUnitInput(member.unit);
        }

        setPhotoUrl(member.photoUrl || PRESET_AVATARS[0]);
        setExpiryDate(member.expiryDate || getDefaultExpiryDate());
        setMembershipType(member.membershipType || 'General Member');
        setRegistrationCategory(member.registrationCategory || 'Renewal');
        setPaymentPurpose(member.registrationCategory === 'New' ? 'New Membership Fee' : 'Renewal Fee');
        setRegistrationDate(member.registrationDate || new Date().toISOString().split('T')[0]);
        setStatus(member.status || 'Active');

        setPhoneUAE(member.phoneUAE || '+971 50 ');
        setWhatsapp(member.whatsapp || member.phoneUAE || '');
        setEmail(member.email || '');
        setEmiratesId(member.emiratesId || '784-');
        setPassportNumber(member.passportNumber || '');
        setNorkaId(member.norkaId || '');
        setProfession(member.profession || '');
        setCompanyName(member.companyName || '');
        setDocuments(member.documents || []);

        setUaeAddress(member.uaeAddress || 'Fujairah, UAE');
        setKeralaAddress(member.keralaAddress || '');
        setKeralaDistrict(member.keralaDistrict || 'Kozhikode');

        setEmergencyContactName(member.emergencyContactName || '');
        setEmergencyContactRelation(member.emergencyContactRelation || 'Spouse');
        setEmergencyContactPhone(member.emergencyContactPhone || member.phoneUAE || '+971 ');

        setFeeAmountAED(member.feeAmountAED !== undefined ? member.feeAmountAED : 30);
        setPaymentStatus(member.paymentStatus || 'Paid');
        setPaymentMethod(member.paymentMethod || 'Cash');
        setReceiptNumber(member.receiptNumber || `REC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
        setCustomValues(member.customFields || {});
      } else {
        // Reset for new registration
        const targetUnit = lockedUnit || units[0] || 'Fujairah';
        setMembershipId(getNextMembershipId(existingMembers, targetUnit));
        setFullName('');
        setDateOfBirth('1990-01-01');
        setBloodGroup('O+');
        setUnit(targetUnit);
        setIsCustomUnit(false);
        setCustomUnitInput('');
        setPhotoUrl(PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)]);
        setExpiryDate(getDefaultExpiryDate());
        setMembershipType('General Member');
        setRegistrationCategory('New');
        setPaymentPurpose('New Membership Fee');
        setRegistrationDate(new Date().toISOString().split('T')[0]);
        setStatus('Active');

        setPhoneUAE('+971 50 ');
        setWhatsapp('');
        setEmail('');
        setEmiratesId('784-');
        setPassportNumber('');
        setNorkaId('');
        setProfession('');
        setCompanyName('');
        setDocuments([]);

        setUaeAddress('Fujairah, UAE');
        setKeralaAddress('');
        setKeralaDistrict('Kozhikode');

        setEmergencyContactName('');
        setEmergencyContactRelation('Spouse');
        setEmergencyContactPhone('+971 ');

        setFeeAmountAED(30);
        setPaymentStatus('Paid');
        setPaymentMethod('Cash');
        setReceiptNumber(getNextMemberReceiptNumber(existingMembers, targetUnit));

        // Initialize default custom field values
        const initCustom: Record<string, any> = {};
        customFields.forEach((cf) => {
          if (cf.defaultValue !== undefined) {
            initCustom[cf.id] = cf.defaultValue;
          }
        });
        setCustomValues(initCustom);
      }
    }

    prevIsOpenRef.current = isOpen;
  }, [isOpen, member?.id]);

  const handleUnitSelect = (newUnit: string) => {
    setUnit(newUnit);
    if (!isEditing) {
      setMembershipId(getNextMembershipId(existingMembers, newUnit));
      setReceiptNumber(getNextMemberReceiptNumber(existingMembers, newUnit));
    }
  };

  if (!isOpen) return null;

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSetQuickExpiry = (years: number) => {
    const d = new Date();
    // Calculate March 31 of (current year + years)
    setExpiryDate(getNextMarch31Date(d, years - 1));
  };

  const handleTypeChange = (newType: MembershipType) => {
    setMembershipType(newType);
    if (!isEditing) {
      setFeeAmountAED(30);
    }
  };

  const handleCustomFieldChange = (fieldId: string, val: any) => {
    setCustomValues((prev) => ({
      ...prev,
      [fieldId]: val,
    }));
  };

  const handleUploadDocumentFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      const newDoc: MemberDocument = {
        id: `doc-${Date.now()}`,
        title: docTitle.trim() || file.name,
        category: docCategory,
        fileName: file.name,
        fileData: base64Data,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
      };
      setDocuments((prev) => [...prev, newDoc]);
      setDocTitle('');
      if (docFileInputRef.current) docFileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('Please enter member full name');
      return;
    }

    const finalUnit = isCustomUnit && customUnitInput.trim() ? customUnitInput.trim() : unit;

    let updatedPaymentHistory = member?.paymentHistory || [];

    if (!member) {
      // New member initial payment record
      const newPaymentRecord = {
        id: `pay-${Date.now()}`,
        receiptNumber: receiptNumber || `REC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        amountAED: Number(feeAmountAED),
        date: registrationDate,
        purpose: paymentPurpose,
        status: paymentStatus,
        method: paymentMethod,
        recordedBy: userSession?.fullName || 'Admin Desk',
      };
      updatedPaymentHistory = [newPaymentRecord];
    } else if (registrationCategory === 'Renewal' && member.registrationCategory !== 'Renewal') {
      // If converted to renewal, record new renewal payment
      const renewalPaymentRecord = {
        id: `pay-${Date.now()}`,
        receiptNumber: receiptNumber || `REC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        amountAED: Number(feeAmountAED),
        date: registrationDate,
        purpose: 'Renewal Fee' as const,
        status: paymentStatus,
        method: paymentMethod,
        recordedBy: userSession?.fullName || 'Admin Desk',
      };
      updatedPaymentHistory = [renewalPaymentRecord, ...(member.paymentHistory || [])];
    }

    const savedMember: Member = {
      id: member?.id || `kca-mem-${Date.now()}`,
      membershipId: membershipId.trim(),
      fullName: fullName.trim(),
      dateOfBirth,
      bloodGroup,
      unit: finalUnit,
      photoUrl,
      expiryDate,
      membershipType,
      registrationCategory,
      registrationDate,
      lastRenewalDate: registrationCategory === 'Renewal' ? registrationDate : member?.lastRenewalDate,
      status,
      phoneUAE: phoneUAE.trim(),
      whatsapp: (whatsapp || phoneUAE).trim(),
      email: email.trim() || 'member@kca-fujairah.ae',
      emiratesId: emiratesId.trim() || undefined,
      passportNumber: passportNumber.trim() || undefined,
      norkaId: norkaId.trim() || undefined,
      profession: profession.trim(),
      companyName: companyName.trim(),
      uaeAddress: uaeAddress.trim(),
      keralaAddress: keralaAddress.trim(),
      keralaDistrict,
      emergencyContactName: emergencyContactName.trim() || 'KCA Helpline',
      emergencyContactRelation: emergencyContactRelation.trim() || 'Relation',
      emergencyContactPhone: emergencyContactPhone.trim() || phoneUAE,
      feeAmountAED: Number(feeAmountAED),
      paymentStatus,
      paymentMethod,
      receiptNumber,
      paymentHistory: updatedPaymentHistory,
      documents,
      customFields: customValues,
      createdAt: member?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(savedMember);
    onClose();
  };

  // Group custom fields by section
  const coreCustomFields = customFields.filter((f) => f.section === 'core');
  const contactCustomFields = customFields.filter((f) => f.section === 'contact');
  const workCustomFields = customFields.filter((f) => f.section === 'work');
  const emergencyCustomFields = customFields.filter((f) => f.section === 'emergency');
  const otherCustomFields = customFields.filter((f) => f.section === 'other' || !f.section);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-[#8b0000] text-white flex items-center justify-between border-b border-[#730000]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white border border-white/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white leading-none">
                {isEditing ? `Edit Member: ${member?.fullName} (${member?.membershipId})` : 'Register New KCA Member'}
              </h3>
              <p className="text-xs text-red-100 mt-1">
                Kairali Cultural Association Fujairah &bull; NORKA Affiliated
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenFieldManager}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors border border-white/20"
              title="Add or edit data fields"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Modify / Add Fields</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          {/* Section 1: Core Identification & Card Data */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8b0000]"></span>
                Membership ID & Core Identity
              </h4>
              <button
                type="button"
                onClick={onOpenFieldManager}
                className="text-[11px] font-semibold text-[#8b0000] hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Custom Field
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Membership ID <span className="text-red-600">*</span>
                  </label>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setMembershipId(getNextMembershipId(existingMembers, unit))}
                      className="text-[10.5px] text-[#8b0000] hover:underline inline-flex items-center gap-0.5"
                      title="Regenerate next sequential ID for unit"
                    >
                      <RefreshCw className="w-3 h-3" /> Auto
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={membershipId}
                  onChange={(e) => setMembershipId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none"
                  placeholder="KCA-FU-1001"
                />
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                  Series: <strong className="text-[#8b0000]">{getUnitIdPrefix(unit)}1001</strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Registration Category <span className="text-red-600">*</span>
                </label>
                <select
                  value={registrationCategory}
                  onChange={(e) => setRegistrationCategory(e.target.value as RegistrationCategory)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-800 bg-white font-medium focus:ring-1 focus:ring-[#8b0000] outline-none"
                >
                  <option value="New">New Member Registration</option>
                  <option value="Renewal">Membership Renewal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Membership Type <span className="text-red-600">*</span>
                </label>
                <select
                  value={membershipType}
                  onChange={(e) => handleTypeChange(e.target.value as MembershipType)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-800 bg-white font-medium focus:ring-1 focus:ring-[#8b0000] outline-none"
                >
                  {MEMBERSHIP_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 font-semibold focus:ring-1 focus:ring-[#8b0000] outline-none"
                placeholder="e.g. Suresh Kumar Pillai"
              />
            </div>

            {/* DOB, Blood Group, Unit Editing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Date of Birth <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 font-mono text-sm focus:ring-1 focus:ring-[#8b0000] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Blood Group <span className="text-red-600">*</span>
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 font-bold bg-white focus:ring-1 focus:ring-[#8b0000] outline-none"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit selector: Fujairah, Kalba, Khorfakhan, Dibba */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Unit <span className="text-red-600">*</span>
                  </label>
                  {!lockedUnit && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomUnit(!isCustomUnit);
                        if (!isCustomUnit) setCustomUnitInput('');
                      }}
                      className="text-[11px] font-semibold text-[#8b0000] hover:underline inline-flex items-center gap-0.5"
                    >
                      {isCustomUnit ? 'Choose from list' : '+ Custom Unit'}
                    </button>
                  )}
                </div>

                {lockedUnit ? (
                  <div className="w-full px-3 py-2 border border-blue-200 bg-blue-50/70 rounded-md text-blue-950 font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#8b0000]" />
                      <span>{unit}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10.5px] bg-blue-100 text-blue-800 font-mono px-2 py-0.5 rounded">
                      <Lock className="w-3 h-3 text-blue-700" />
                      Assigned Unit
                    </span>
                  </div>
                ) : isCustomUnit ? (
                  <input
                    type="text"
                    required
                    value={customUnitInput}
                    onChange={(e) => {
                      setCustomUnitInput(e.target.value);
                      handleUnitSelect(e.target.value);
                    }}
                    placeholder="Type new unit name..."
                    className="w-full px-3 py-2 border border-amber-300 bg-amber-50/50 rounded-md text-slate-900 font-semibold focus:ring-1 focus:ring-[#8b0000] outline-none text-xs"
                    autoFocus
                  />
                ) : (
                  <select
                    value={unit}
                    onChange={(e) => handleUnitSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 font-semibold bg-white focus:ring-1 focus:ring-[#8b0000] outline-none"
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>
                        {u} ({getUnitIdPrefix(u)}1001)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Render any Custom Fields assigned to Core Section */}
            {coreCustomFields.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                {coreCustomFields.map((cf) => (
                  <DynamicFieldInput
                    key={cf.id}
                    field={cf}
                    value={customValues[cf.id]}
                    onChange={(v) => handleCustomFieldChange(cf.id, v)}
                  />
                ))}
              </div>
            )}

            {/* Member Joined Date & Manually Settable Expiry Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Member Joined Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={registrationDate}
                  onChange={(e) => setRegistrationDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-slate-900 font-mono font-bold text-sm bg-white focus:ring-1 focus:ring-[#8b0000] outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Date when member officially joined KCA
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Validity & Expiry Date <span className="text-red-600">*</span>
                  </label>
                  <div className="flex gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSetQuickExpiry(1)}
                      className="px-1.5 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-700 font-semibold"
                    >
                      +1Y
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickExpiry(2)}
                      className="px-1.5 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-700 font-semibold"
                    >
                      +2Y
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickExpiry(3)}
                      className="px-1.5 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-700 font-semibold"
                    >
                      +3Y
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-slate-900 font-mono font-bold text-sm bg-white focus:ring-1 focus:ring-[#8b0000] outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Printed on the generated CR80 ID card
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Member Photo */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Camera className="w-4 h-4 text-[#8b0000]" />
              Member ID Photograph
            </h4>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Photo Preview */}
              <div className="relative w-28 h-32 rounded-lg border-2 border-[#8b0000] overflow-hidden shadow-xs bg-slate-100 shrink-0">
                <img
                  src={photoUrl}
                  alt="Member Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Upload Controls & Presets */}
              <div className="flex-1 space-y-3 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-slate-900 hover:bg-black text-white text-xs font-medium transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Photo from PC
                  </button>

                  <input
                    type="text"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="Or paste photo image URL..."
                    className="flex-1 min-w-[200px] px-3 py-1.5 border border-slate-200 rounded-md text-xs font-mono text-slate-700 focus:ring-1 focus:ring-[#8b0000] outline-none"
                  />
                </div>

                {/* Preset sample avatars */}
                <div>
                  <div className="text-[11px] font-medium text-slate-500 mb-1.5">
                    Or select sample portrait avatar:
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {PRESET_AVATARS.map((avatar, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPhotoUrl(avatar)}
                        className={`w-9 h-9 rounded-md overflow-hidden border-2 transition-all shrink-0 ${
                          photoUrl === avatar ? 'border-[#8b0000] scale-105 shadow-xs' : 'border-slate-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={avatar} alt="Preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Contact & Residency Details */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#8b0000]" />
                Contact & Residency Details
              </h4>
              <button
                type="button"
                onClick={onOpenFieldManager}
                className="text-[11px] font-semibold text-[#8b0000] hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Custom Field
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  UAE Mobile Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={phoneUAE}
                  onChange={(e) => setPhoneUAE(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 font-mono text-sm focus:ring-1 focus:ring-[#8b0000] outline-none"
                  placeholder="+971 50 123 4567"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  WhatsApp Number
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 font-mono text-sm focus:ring-1 focus:ring-[#8b0000] outline-none"
                  placeholder="+971 50 123 4567"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 text-sm focus:ring-1 focus:ring-[#8b0000] outline-none"
                  placeholder="member@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Emirates ID No.
                </label>
                <input
                  type="text"
                  value={emiratesId}
                  onChange={(e) => setEmiratesId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 font-mono text-sm focus:ring-1 focus:ring-[#8b0000] outline-none"
                  placeholder="784-1985-1234567-1"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Passport Number
                </label>
                <input
                  type="text"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 font-mono text-sm focus:ring-1 focus:ring-[#8b0000] outline-none"
                  placeholder="e.g. Z1234567"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  NORKA Pravasi ID <span className="text-[10px] font-normal text-slate-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={norkaId}
                  onChange={(e) => setNorkaId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 font-mono text-sm focus:ring-1 focus:ring-[#8b0000] outline-none"
                  placeholder="e.g. NRK-108239"
                />
              </div>
            </div>

            {/* Custom fields in Contact Section */}
            {contactCustomFields.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                {contactCustomFields.map((cf) => (
                  <DynamicFieldInput
                    key={cf.id}
                    field={cf}
                    value={customValues[cf.id]}
                    onChange={(v) => handleCustomFieldChange(cf.id, v)}
                  />
                ))}
              </div>
            )}

            {/* Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  UAE Address / Area (Fujairah / East Coast)
                </label>
                <input
                  type="text"
                  value={uaeAddress}
                  onChange={(e) => setUaeAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 text-sm focus:ring-1 focus:ring-[#8b0000] outline-none"
                  placeholder="Building, Road, Area, Fujairah"
                />
              </div>

              <div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Kerala District
                    </label>
                    <select
                      value={keralaDistrict}
                      onChange={(e) => setKeralaDistrict(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 text-sm bg-white focus:ring-1 focus:ring-[#8b0000] outline-none"
                    >
                      {KERALA_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Permanent Home
                    </label>
                    <input
                      type="text"
                      value={keralaAddress}
                      onChange={(e) => setKeralaAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 text-sm focus:ring-1 focus:ring-[#8b0000] outline-none"
                      placeholder="House name, Post"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Employment & Work Details */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#8b0000]" />
                Profession & Employment
              </h4>
              <button
                type="button"
                onClick={onOpenFieldManager}
                className="text-[11px] font-semibold text-[#8b0000] hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Custom Field
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Profession / Occupation
                </label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 text-sm focus:ring-1 focus:ring-[#8b0000] outline-none"
                  placeholder="e.g. Project Manager / Teacher / Accountant"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 text-sm focus:ring-1 focus:ring-[#8b0000] outline-none"
                  placeholder="e.g. Fujairah Port Authority"
                />
              </div>
            </div>

            {/* Custom fields in Work Section */}
            {workCustomFields.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                {workCustomFields.map((cf) => (
                  <DynamicFieldInput
                    key={cf.id}
                    field={cf}
                    value={customValues[cf.id]}
                    onChange={(v) => handleCustomFieldChange(cf.id, v)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Emergency Contact */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8b0000]" />
                Emergency Contact (UAE / Kerala)
              </h4>
              <button
                type="button"
                onClick={onOpenFieldManager}
                className="text-[11px] font-semibold text-[#8b0000] hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Custom Field
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Emergency Contact Person
                </label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs bg-white text-slate-800 focus:ring-1 focus:ring-[#8b0000] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  value={emergencyContactRelation}
                  onChange={(e) => setEmergencyContactRelation(e.target.value)}
                  placeholder="e.g. Spouse / Brother / Father"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs bg-white text-slate-800 focus:ring-1 focus:ring-[#8b0000] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Emergency Telephone
                </label>
                <input
                  type="text"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="Emergency Phone Number"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs font-mono bg-white text-slate-800 focus:ring-1 focus:ring-[#8b0000] outline-none"
                />
              </div>
            </div>

            {/* Custom fields in Emergency Section */}
            {emergencyCustomFields.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                {emergencyCustomFields.map((cf) => (
                  <DynamicFieldInput
                    key={cf.id}
                    field={cf}
                    value={customValues[cf.id]}
                    onChange={(v) => handleCustomFieldChange(cf.id, v)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Section 6: Other / Miscellaneous Dynamic Fields */}
          {otherCustomFields.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#8b0000]" />
                  Additional Custom Fields & Remarks
                </h4>
                <button
                  type="button"
                  onClick={onOpenFieldManager}
                  className="text-[11px] font-semibold text-[#8b0000] hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Field
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {otherCustomFields.map((cf) => (
                  <DynamicFieldInput
                    key={cf.id}
                    field={cf}
                    value={customValues[cf.id]}
                    onChange={(v) => handleCustomFieldChange(cf.id, v)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section: Supporting Documents (Upload from Local PC) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-[#8b0000]" />
                Supporting Documents & Member Files
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                {documents.length} {documents.length === 1 ? 'file attached' : 'files attached'}
              </span>
            </div>

            {/* Document Upload Input */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Document Category
                  </label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-semibold bg-white text-slate-800 outline-none"
                  >
                    <option value="emirates_id">Emirates ID Copy (Front/Back)</option>
                    <option value="passport">Passport Copy</option>
                    <option value="visa">UAE Residence Visa Copy</option>
                    <option value="norka_card">NORKA Pravasi Card / Slip</option>
                    <option value="photo">Passport Size Photograph</option>
                    <option value="application_form">Signed Application Form</option>
                    <option value="other">Other Supporting Document</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Document Title / Description (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="e.g. Emirates ID 2026 Renewal Copy"
                      className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white text-slate-900 outline-none"
                    />

                    <input
                      type="file"
                      ref={docFileInputRef}
                      onChange={handleUploadDocumentFile}
                      accept="image/*,application/pdf"
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => docFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8b0000] hover:bg-[#730000] text-white text-xs font-semibold rounded-md shadow-xs transition-colors shrink-0"
                    >
                      <FileUp className="w-3.5 h-3.5" />
                      <span>Upload from PC</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* List of Attached Documents */}
            {documents.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-3 bg-white flex items-center justify-between hover:bg-slate-50 gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded bg-red-50 text-[#8b0000] flex items-center justify-center shrink-0 border border-red-100">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-slate-900 truncate">
                          {doc.title || doc.fileName}
                        </div>
                        <div className="text-[10.5px] text-slate-500 flex items-center gap-2">
                          <span className="capitalize text-[#8b0000] font-medium">{doc.category.replace('_', ' ')}</span>
                          <span>&bull;</span>
                          <span>{doc.fileName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = doc.fileData;
                          link.download = doc.fileName || `${doc.title}.png`;
                          link.click();
                        }}
                        className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded text-xs transition-colors"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(doc.id)}
                        className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded text-xs transition-colors"
                        title="Remove Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                No supporting documents attached yet. Click "Upload from PC" to attach Emirates ID, Passport, Visa, or NORKA card.
              </div>
            )}
          </div>

          {/* Section 7: Membership Fee & Payment */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="font-display font-bold text-sm text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                Membership Fee & Payment (AED)
              </span>
              <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                AED Currency
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Particular / Type <span className="text-red-600">*</span>
                </label>
                <select
                  value={paymentPurpose}
                  onChange={(e) => {
                    const val = e.target.value as 'New Membership Fee' | 'Renewal Fee';
                    setPaymentPurpose(val);
                    if (val === 'Renewal Fee') {
                      setRegistrationCategory('Renewal');
                    } else {
                      setRegistrationCategory('New');
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 font-semibold bg-white focus:ring-1 focus:ring-[#8b0000] outline-none"
                >
                  <option value="New Membership Fee">New Membership Fee (Particular)</option>
                  <option value="Renewal Fee">Annual Renewal Fee (Renewal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Fee Amount (AED) <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">AED</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="5"
                    value={feeAmountAED}
                    onChange={(e) => setFeeAmountAED(parseFloat(e.target.value) || 0)}
                    className="w-full pl-12 pr-3 py-2 border border-slate-200 rounded-md text-slate-900 font-mono font-bold text-base focus:ring-1 focus:ring-[#8b0000] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 font-bold bg-white focus:ring-1 focus:ring-[#8b0000] outline-none"
                >
                  <option value="Paid">Paid (Confirmed)</option>
                  <option value="Pending">Pending Payment</option>
                  <option value="Waived">Waived / Complimentary</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 font-medium bg-white focus:ring-1 focus:ring-[#8b0000] outline-none"
                >
                  <option value="Cash">Cash (Dirhams)</option>
                  <option value="Bank Transfer">Bank Transfer (UAE)</option>
                  <option value="Credit/Debit Card">Credit/Debit Card</option>
                  <option value="UAE Pass / Online">UAE Pass / Online</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Receipt Number
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 font-mono text-sm focus:ring-1 focus:ring-[#8b0000] outline-none"
                  placeholder="REC-2025-XXX"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Registration Category
                </label>
                <select
                  value={registrationCategory}
                  onChange={(e) => {
                    const cat = e.target.value as RegistrationCategory;
                    setRegistrationCategory(cat);
                    setPaymentPurpose(cat === 'New' ? 'New Membership Fee' : 'Renewal Fee');
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 font-medium bg-white focus:ring-1 focus:ring-[#8b0000] outline-none"
                >
                  <option value="New">New Member Registration</option>
                  <option value="Renewal">Membership Renewal</option>
                </select>
              </div>
            </div>

            {/* Central Committee vs Local Unit Ledger Routing Callout */}
            <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
              membershipType === 'Central Committee Member'
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            }`}>
              <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${
                membershipType === 'Central Committee Member' ? 'text-amber-700' : 'text-emerald-700'
              }`} />
              <div>
                {membershipType === 'Central Committee Member' ? (
                  <p>
                    <strong>Central Committee Finance Ledger:</strong> As a <strong>Central Committee Member</strong> assigned to <strong>{unit || 'Unit'}</strong>, this membership payment of <strong>AED {feeAmountAED}</strong> will be recorded in the <strong>Central Unit finance ledger</strong>, with zero payment deducted in the local {unit || 'Unit'} ledger.
                  </p>
                ) : (
                  <p>
                    <strong>Unit Finance Ledger:</strong> Membership payment of <strong>AED {feeAmountAED}</strong> will be credited directly to the <strong>{unit || 'Fujairah'} Unit finance ledger</strong>.
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenFieldManager}
              className="px-3.5 py-2 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#8b0000]" />
              Add More Fields
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold rounded-md bg-[#8b0000] hover:bg-[#730000] text-white transition-colors shadow-xs"
            >
              <Check className="w-4 h-4" />
              {isEditing ? 'Save Changes' : 'Save & Generate ID Card'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
