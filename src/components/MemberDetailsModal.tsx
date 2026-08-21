import React, { useState, useRef, useEffect } from 'react';
import {
  Member,
  BloodGroup,
  MembershipType,
  PaymentStatus,
  CustomFieldDefinition,
  UserSession,
  hasAdminPrivilege,
  isUnitOperatorRole,
  MemberDocument,
  DocumentCategory,
} from '../types/member';
import { formatDate, formatAED, getExpiryStatus, formatCardDate, getMemberVerifyUrl } from '../utils/idGenerator';
import {
  X,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Calendar,
  HeartPulse,
  Award,
  IdCard as IdCardIcon,
  Printer,
  FileText,
  RefreshCw,
  Edit,
  ShieldCheck,
  Building,
  Check,
  ChevronDown,
  Sliders,
  Sparkles,
  Plus,
  Layers,
  Building2,
  Paperclip,
  Upload,
  Download,
  Trash2,
  FileUp,
  Send,
  Save,
  UserCheck,
} from 'lucide-react';

interface MemberDetailsModalProps {
  member: Member | null;
  units?: string[];
  customFields?: CustomFieldDefinition[];
  userSession?: UserSession;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (member: Member) => void;
  onViewIdCard: (member: Member) => void;
  onViewReceipt: (member: Member) => void;
  onRenew: (member: Member) => void;
  onUpdateMember?: (updatedMember: Member) => void;
  onUpdateUnit?: (member: Member, newUnit: string) => void;
  onOpenFieldManager?: () => void;
  onOpenWhatsApp?: (member: Member) => void;
  onUpdateMemberDocuments?: (member: Member, updatedDocuments: MemberDocument[]) => void;
  onDeleteMember?: (memberId: string) => void;
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

export const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({
  member,
  units = ['Fujairah', 'Kalba', 'Khorfakhan', 'Dibba'],
  customFields = [],
  userSession,
  isOpen,
  onClose,
  onEdit,
  onViewIdCard,
  onViewReceipt,
  onRenew,
  onUpdateMember,
  onUpdateUnit,
  onOpenFieldManager,
  onOpenWhatsApp,
  onUpdateMemberDocuments,
  onDeleteMember,
}) => {
  const isAdmin = !userSession || hasAdminPrivilege(userSession.role);
  const isUnitOp = !!userSession && isUnitOperatorRole(userSession.role);

  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Editable Form Fields State
  const [membershipId, setMembershipId] = useState('');
  const [fullName, setFullName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [unit, setUnit] = useState('');
  const [membershipType, setMembershipType] = useState<MembershipType>('General Member');
  const [expiryDate, setExpiryDate] = useState('');
  const [phoneUAE, setPhoneUAE] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [emiratesId, setEmiratesId] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [norkaId, setNorkaId] = useState('');
  const [profession, setProfession] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [uaeAddress, setUaeAddress] = useState('');
  const [keralaAddress, setKeralaAddress] = useState('');
  const [keralaDistrict, setKeralaDistrict] = useState('Kozhikode');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [status, setStatus] = useState<'Active' | 'Expired' | 'Pending' | 'Suspended'>('Active');

  const [isChangingUnit, setIsChangingUnit] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState('');

  const docInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [newDocCategory, setNewDocCategory] = useState<DocumentCategory>('emirates_id');
  const [newDocTitle, setNewDocTitle] = useState('');

  // Synchronize state from member
  useEffect(() => {
    if (member) {
      setMembershipId(member.membershipId || '');
      setFullName(member.fullName || '');
      setPhotoUrl(member.photoUrl || '');
      setDateOfBirth(member.dateOfBirth || '');
      setBloodGroup(member.bloodGroup || 'O+');
      setUnit(member.unit || units[0] || 'Fujairah');
      setMembershipType(member.membershipType || 'General Member');
      setExpiryDate(member.expiryDate || '');
      setPhoneUAE(member.phoneUAE || '');
      setWhatsapp(member.whatsapp || member.phoneUAE || '');
      setEmail(member.email || '');
      setEmiratesId(member.emiratesId || '');
      setPassportNumber(member.passportNumber || '');
      setNorkaId(member.norkaId || '');
      setProfession(member.profession || '');
      setCompanyName(member.companyName || '');
      setUaeAddress(member.uaeAddress || '');
      setKeralaAddress(member.keralaAddress || '');
      setKeralaDistrict(member.keralaDistrict || 'Kozhikode');
      setEmergencyContactName(member.emergencyContactName || '');
      setEmergencyContactRelation(member.emergencyContactRelation || '');
      setEmergencyContactPhone(member.emergencyContactPhone || '');
      setPaymentStatus(member.paymentStatus || 'Paid');
      setStatus(member.status || 'Active');
      setIsInlineEditing(false);
      setIsChangingUnit(false);
      setSaveSuccessMsg(false);
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  const expiry = getExpiryStatus(member.expiryDate);

  const handleSaveUnitChange = () => {
    if (selectedUnit && selectedUnit !== member.unit && onUpdateUnit) {
      onUpdateUnit(member, selectedUnit);
    }
    setIsChangingUnit(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveInlineEdits = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName.trim()) {
      alert('Please enter member full name');
      return;
    }

    const updatedMember: Member = {
      ...member,
      membershipId: membershipId.trim() || member.membershipId,
      fullName: fullName.trim(),
      photoUrl: photoUrl.trim() || member.photoUrl,
      dateOfBirth,
      bloodGroup,
      unit: unit.trim() || member.unit,
      membershipType,
      expiryDate,
      phoneUAE: phoneUAE.trim(),
      whatsapp: (whatsapp || phoneUAE).trim(),
      email: email.trim(),
      emiratesId: emiratesId.trim() || undefined,
      passportNumber: passportNumber.trim() || undefined,
      norkaId: norkaId.trim() || undefined,
      profession: profession.trim(),
      companyName: companyName.trim(),
      uaeAddress: uaeAddress.trim(),
      keralaAddress: keralaAddress.trim(),
      keralaDistrict,
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactRelation: emergencyContactRelation.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
      paymentStatus,
      status,
      updatedAt: new Date().toISOString(),
    };

    if (onUpdateMember) {
      onUpdateMember(updatedMember);
    }
    setIsInlineEditing(false);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3500);
  };

  const handleDirectUploadDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newDoc: MemberDocument = {
        id: `doc-${Date.now()}`,
        title: newDocTitle.trim() || file.name,
        category: newDocCategory,
        fileName: file.name,
        fileData: base64,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
      };
      const updatedDocs = [...(member.documents || []), newDoc];
      if (onUpdateMemberDocuments) {
        onUpdateMemberDocuments(member, updatedDocs);
      }
      setNewDocTitle('');
      if (docInputRef.current) docInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = (docId: string) => {
    const updatedDocs = (member.documents || []).filter((d) => d.id !== docId);
    if (onUpdateMemberDocuments) {
      onUpdateMemberDocuments(member, updatedDocs);
    }
  };

  const handleQuickWhatsApp = () => {
    if (onOpenWhatsApp) {
      onOpenWhatsApp(member);
    } else {
      const targetPhone = (member.whatsapp || member.phoneUAE || '').replace(/[^\d+]/g, '');
      const cleanPhone = targetPhone.startsWith('+') ? targetPhone.slice(1) : targetPhone;
      const verifyLink = getMemberVerifyUrl(member);
      const message = `*KAIRALI CULTURAL ASSOCIATION FUJAIRAH*\n*OFFICIAL DIGITAL MEMBERSHIP ID CARD*\n\nDear *${member.fullName}*,\n\nYour official KCA Fujairah Membership ID Card is ready and active in our database.\n\n📋 *Membership Details:*\n• *Member ID:* ${member.membershipId}\n• *Full Name:* ${member.fullName}${member.malayalamName ? ` (${member.malayalamName})` : ''}\n• *Unit:* ${member.unit} Unit\n• *Blood Group:* ${member.bloodGroup}\n• *Validity:* ${formatCardDate(member.expiryDate)}\n\n🔗 *View & Download Your ID Card:*\n${verifyLink}\n\nPlease keep this digital card for association events, programs, and welfare benefits.\n\n_Warm Regards,_\n*Kairali Cultural Association Fujairah*`;
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }
  };

  const memberCustomData = member.customFields || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-[#8b0000] text-white flex items-center justify-between border-b border-[#730000]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/40 shrink-0 shadow-sm">
              <img src={member.photoUrl} alt={member.fullName} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-xl text-white truncate">
                  {member.fullName}
                </h3>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-white/15 text-white border border-white/20">
                  {member.membershipId}
                </span>
                {saveSuccessMsg && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs animate-bounce">
                    <Check className="w-3 h-3" /> Saved!
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isInlineEditing ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsInlineEditing(false)}
                  className="px-3 py-1.5 rounded-md bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveInlineEdits}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Edits
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsInlineEditing(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors shadow-xs"
                  title="Directly edit member details"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>

                <button
                  onClick={() => onEdit(member)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
                  title="Open in full registration form"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Full Form</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-md transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          {/* INLINE EDIT MODE FORM */}
          {isInlineEditing ? (
            <div className="space-y-5 bg-white p-5 rounded-xl border border-amber-300 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-[#8b0000]" />
                  <h4 className="font-display font-bold text-sm text-slate-900">
                    Editing Member Profile: {member.membershipId}
                  </h4>
                </div>
                <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded font-medium border border-amber-200">
                  Direct Field Modification
                </span>
              </div>

              {/* Photo & Core Identity Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="relative group shrink-0">
                  <img
                    src={photoUrl || member.photoUrl}
                    alt={fullName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#8b0000] shadow-xs"
                  />
                  <input
                    type="file"
                    ref={photoInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#8b0000]" />
                      Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoUrl(
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
                        )
                      }
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-600 hover:bg-slate-50"
                    >
                      Male Preset
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoUrl(
                          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'
                        )
                      }
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-600 hover:bg-slate-50"
                    >
                      Female Preset
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Upload passport photo or portrait for digital ID card & public verification
                  </p>
                </div>
              </div>

              {/* Row 1: Member ID & Full Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Membership ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={membershipId}
                    onChange={(e) => setMembershipId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono font-bold text-[#8b0000] bg-white focus:ring-2 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none"
                    placeholder="e.g. KCA-FU-1001"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none"
                  />
                </div>
              </div>

              {/* Row 2: DOB, Blood Group, Unit, Membership Type */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-slate-900 bg-white focus:ring-2 focus:ring-[#8b0000] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Blood Group *
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-bold text-slate-900 bg-white focus:ring-2 focus:ring-[#8b0000] outline-none"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Unit (Area) *
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-[#8b0000] outline-none"
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Membership Type
                  </label>
                  <select
                    value={membershipType}
                    onChange={(e) => setMembershipType(e.target.value as MembershipType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:ring-2 focus:ring-[#8b0000] outline-none"
                  >
                    {MEMBERSHIP_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Contacts (Phone UAE, WhatsApp, Email) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    UAE Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={phoneUAE}
                    onChange={(e) => setPhoneUAE(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-[#8b0000] outline-none"
                    placeholder="+971 50 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-emerald-800 bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                    placeholder="+971 50 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:ring-2 focus:ring-[#8b0000] outline-none"
                    placeholder="name@domain.com"
                  />
                </div>
              </div>

              {/* Row 4: IDs & Profession */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Emirates ID
                  </label>
                  <input
                    type="text"
                    value={emiratesId}
                    onChange={(e) => setEmiratesId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-slate-900 bg-white focus:ring-2 focus:ring-[#8b0000] outline-none"
                    placeholder="784-1990-1234567-1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Passport No
                  </label>
                  <input
                    type="text"
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-slate-900 bg-white focus:ring-2 focus:ring-[#8b0000] outline-none"
                    placeholder="M1234567"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    NORKA ID
                  </label>
                  <input
                    type="text"
                    value={norkaId}
                    onChange={(e) => setNorkaId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-slate-900 bg-white focus:ring-2 focus:ring-[#8b0000] outline-none"
                    placeholder="NRK-123456"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Profession
                  </label>
                  <input
                    type="text"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:ring-2 focus:ring-[#8b0000] outline-none"
                    placeholder="e.g. Civil Engineer"
                  />
                </div>
              </div>

              {/* Row 5: Addresses */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    UAE Address
                  </label>
                  <input
                    type="text"
                    value={uaeAddress}
                    onChange={(e) => setUaeAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:ring-2 focus:ring-[#8b0000] outline-none"
                    placeholder="Flat 402, Hamad Tower, Fujairah"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kerala House Address
                  </label>
                  <input
                    type="text"
                    value={keralaAddress}
                    onChange={(e) => setKeralaAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:ring-2 focus:ring-[#8b0000] outline-none"
                    placeholder="House name, Post Office"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kerala District
                  </label>
                  <select
                    value={keralaDistrict}
                    onChange={(e) => setKeralaDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:ring-2 focus:ring-[#8b0000] outline-none"
                  >
                    {KERALA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 6: Emergency Contact & Card Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:ring-2 focus:ring-[#8b0000] outline-none"
                    placeholder="Contact Name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    value={emergencyContactRelation}
                    onChange={(e) => setEmergencyContactRelation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:ring-2 focus:ring-[#8b0000] outline-none"
                    placeholder="Spouse / Brother / Friend"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="text"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-slate-900 bg-white focus:ring-2 focus:ring-[#8b0000] outline-none"
                    placeholder="+971 50 ..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Card Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-slate-900 bg-white focus:ring-2 focus:ring-[#8b0000] outline-none"
                  />
                </div>
              </div>

              {/* Inline Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsInlineEditing(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveInlineEdits}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-md bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save & Apply Changes
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Quick Stat Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Unit Stat with Quick Edit */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Unit (Area)</span>
                    {!isChangingUnit && isAdmin && onUpdateUnit && (
                      <button
                        onClick={() => {
                          setSelectedUnit(member.unit);
                          setIsChangingUnit(true);
                        }}
                        className="text-[10px] font-semibold text-[#8b0000] hover:underline"
                      >
                        Change
                      </button>
                    )}
                  </div>

                  {isChangingUnit ? (
                    <div className="mt-1 flex items-center gap-1">
                      <select
                        value={selectedUnit}
                        onChange={(e) => setSelectedUnit(e.target.value)}
                        className="text-xs font-bold border border-slate-300 rounded px-1.5 py-0.5 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#8b0000] flex-1"
                      >
                        {units.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleSaveUnitChange}
                        className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs"
                        title="Save Unit"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setIsChangingUnit(false)}
                        className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs"
                        title="Cancel"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="font-bold text-sm text-[#8b0000] truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#8b0000] shrink-0" />
                      <span>{member.unit}</span>
                    </div>
                  )}
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Blood Group</div>
                  <div className="font-mono font-bold text-sm text-[#8b0000] mt-0.5">{member.bloodGroup}</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Validity Status</div>
                  <div className={`text-xs font-semibold px-2 py-0.5 rounded mt-0.5 inline-block ${expiry.color}`}>
                    {expiry.label}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Membership Type</div>
                  <div className="font-medium text-xs text-slate-800 truncate mt-0.5">{member.membershipType}</div>
                </div>
              </div>

              {/* Core Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Contact & Identity */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-[#8b0000]" />
                      Contact & Identification
                    </h4>
                    <button
                      onClick={() => setIsInlineEditing(true)}
                      className="text-[11px] font-semibold text-[#8b0000] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Edit className="w-3 h-3" /> Quick Edit
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">UAE Mobile:</span>
                      <span className="font-mono font-semibold text-slate-900">{member.phoneUAE}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">WhatsApp:</span>
                      <span className="font-mono font-semibold text-emerald-700">{member.whatsapp || member.phoneUAE}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Email:</span>
                      <span className="text-slate-900 truncate max-w-[200px]">{member.email}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Emirates ID:</span>
                      <span className="font-mono text-slate-800">{member.emiratesId || 'N/A'}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Passport No:</span>
                      <span className="font-mono text-slate-800">{member.passportNumber || 'N/A'}</span>
                    </div>

                    {member.norkaId && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">NORKA Pravasi ID:</span>
                        <span className="font-mono font-semibold text-slate-900">{member.norkaId}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Profession:</span>
                      <span className="text-slate-900 font-medium">{member.profession || 'N/A'}</span>
                    </div>

                    {member.companyName && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Company / Org:</span>
                        <span className="text-slate-900 font-medium">{member.companyName}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Date of Birth:</span>
                      <span className="font-mono text-slate-800">{formatDate(member.dateOfBirth)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Member Joined Date:</span>
                      <span className="font-mono font-bold text-slate-900">{formatDate(member.joinDate || member.registrationDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Address & Emergency */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#8b0000]" />
                      Address & Emergency
                    </h4>
                    <button
                      onClick={() => setIsInlineEditing(true)}
                      className="text-[11px] font-semibold text-[#8b0000] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Edit className="w-3 h-3" /> Quick Edit
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium block">UAE Address:</span>
                      <span className="text-slate-900 font-medium">{member.uaeAddress}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium block">Kerala Address:</span>
                      <span className="text-slate-900">
                        {member.keralaAddress ? `${member.keralaAddress}, ` : ''}{member.keralaDistrict} District, Kerala
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[#8b0000] font-bold block mb-1">Emergency Contact:</span>
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs">
                        <div className="font-semibold text-slate-900">{member.emergencyContactName} ({member.emergencyContactRelation})</div>
                        <div className="font-mono text-[#8b0000] font-bold">{member.emergencyContactPhone}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Custom Fields Section */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#8b0000]" />
                    Additional Data & Custom Fields
                  </h4>
                  {onOpenFieldManager && (
                    <button
                      onClick={onOpenFieldManager}
                      className="text-[11px] font-semibold text-[#8b0000] hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add / Modify Fields
                    </button>
                  )}
                </div>

                {customFields.length === 0 ? (
                  <div className="text-xs text-slate-400 py-2">
                    No custom fields defined. Click "Add / Modify Fields" above to create custom fields.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    {customFields.map((cf) => {
                      const val = memberCustomData[cf.id];
                      let displayVal = '—';
                      if (val !== undefined && val !== null && val !== '') {
                        if (typeof val === 'boolean') {
                          displayVal = val ? 'YES' : 'NO';
                        } else {
                          displayVal = String(val);
                        }
                      }

                      return (
                        <div key={cf.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                            {cf.label}
                          </span>
                          <span className="font-semibold text-slate-900 text-xs block mt-0.5 truncate">
                            {displayVal}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section: Attached Supporting Documents */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-[#8b0000]" />
                    Supporting Documents & Attachments ({member.documents?.length || 0})
                  </h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={docInputRef}
                      onChange={handleDirectUploadDoc}
                      accept="image/*,application/pdf"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => docInputRef.current?.click()}
                      className="text-[11px] font-semibold text-[#8b0000] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <FileUp className="w-3.5 h-3.5" /> Attach Document
                    </button>
                  </div>
                </div>

                {member.documents && member.documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {member.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded bg-red-100 text-[#8b0000] flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-slate-900 truncate">
                              {doc.title || doc.fileName}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                              <span className="capitalize text-[#8b0000] font-medium">{doc.category.replace('_', ' ')}</span>
                              <span>&bull;</span>
                              <span>{formatDate(doc.uploadedAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = doc.fileData;
                              link.download = doc.fileName || `${doc.title}.png`;
                              link.click();
                            }}
                            className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-200 rounded border border-slate-200 text-xs transition-colors cursor-pointer"
                            title="Download Document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveDoc(doc.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 text-xs transition-colors cursor-pointer"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                    No supporting documents attached yet. Click "Attach Document" above to upload Emirates ID, Passport, or Visa.
                  </div>
                )}
              </div>

              {/* Payment & AED Receipts History */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    Payment Records in United Arab Emirates Dirhams (AED)
                  </h4>
                  <button
                    onClick={() => onViewReceipt(member)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#8b0000] hover:text-[#730000] underline cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View Official Receipt
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Receipt No</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Purpose</th>
                        <th className="p-2">Method</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {member.paymentHistory && member.paymentHistory.length > 0 ? (
                        member.paymentHistory.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50">
                            <td className="p-2 font-mono font-bold text-slate-900">{rec.receiptNumber}</td>
                            <td className="p-2 text-slate-600">{formatDate(rec.date)}</td>
                            <td className="p-2 text-slate-800 font-medium">{rec.purpose}</td>
                            <td className="p-2 text-slate-600">{rec.method}</td>
                            <td className="p-2 font-mono font-bold text-emerald-700">{formatAED(rec.amountAED)}</td>
                            <td className="p-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                {rec.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="p-2 font-mono font-bold text-slate-900">{member.receiptNumber}</td>
                          <td className="p-2 text-slate-600">{formatDate(member.registrationDate)}</td>
                          <td className="p-2 text-slate-800 font-medium">{member.registrationCategory} Membership Fee</td>
                          <td className="p-2 text-slate-600">{member.paymentMethod}</td>
                          <td className="p-2 font-mono font-bold text-emerald-700">{formatAED(member.feeAmountAED)}</td>
                          <td className="p-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              {member.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRenew(member)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Renew Membership
            </button>
            <button
              onClick={() => setIsInlineEditing(!isInlineEditing)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              {isInlineEditing ? 'View Mode' : 'Edit Profile'}
            </button>
            {onDeleteMember && isAdmin && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer"
                title="Delete this member record"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleQuickWhatsApp}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
              title="Send Membership Digital ID link via WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              Send on WhatsApp
            </button>

            <button
              onClick={() => onViewReceipt(member)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Print Receipt
            </button>

            <button
              onClick={() => onViewIdCard(member)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md bg-[#8b0000] hover:bg-[#730000] text-white shadow-xs transition-colors cursor-pointer"
            >
              <IdCardIcon className="w-4 h-4" />
              Generate ID Card
            </button>
          </div>
        </div>
      </div>

      {/* Delete Member Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Delete Member Record</h3>
            <p className="text-sm text-slate-600 text-center mt-2">
              Are you sure you want to delete <strong className="text-slate-900">{member.fullName}</strong> ({member.membershipId})? This will immediately sync and remove the member for all units and operators.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteMember) {
                    onDeleteMember(member.id);
                    setShowDeleteModal(false);
                    onClose();
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
    </div>
  );
};
