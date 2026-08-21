export type MembershipType = 'General Member' | 'Executive Member' | 'Central Committee Member';

export type RegistrationCategory = 'New' | 'Renewal';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

export type UnitName = 'Fujairah' | 'Kalba' | 'Khorfakhan' | 'Dibba' | string;

export type PaymentStatus = 'Paid' | 'Pending' | 'Waived';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Credit/Debit Card' | 'UAE Pass / Online';

export type DocumentCategory =
  | 'emirates_id'
  | 'passport'
  | 'visa'
  | 'norka_card'
  | 'photo'
  | 'application_form'
  | 'other';

export interface MemberDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  fileData: string; // Base64 or object URL
  fileType: string; // MIME type (image/jpeg, image/png, application/pdf, etc.)
  fileSize?: number;
  uploadedAt: string;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  receiptNumber: string;
  amountAED: number;
  date: string;
  purpose: 'New Membership Fee' | 'Renewal Fee' | 'Welfare Fund' | 'Event Fee' | 'Other';
  status: PaymentStatus;
  method: PaymentMethod;
  notes?: string;
  recordedBy: string;
}

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'textarea'
  | 'phone'
  | 'email';

export interface CustomFieldDefinition {
  id: string; // unique slug e.g. "cf_visa_status"
  label: string; // e.g. "UAE Visa Status"
  type: FieldType;
  required?: boolean;
  options?: string[]; // for 'select' type dropdowns
  defaultValue?: string | number | boolean;
  section: 'core' | 'contact' | 'emergency' | 'work' | 'other';
  showOnIdCard?: boolean;
  showInTable?: boolean;
  placeholder?: string;
  description?: string;
  isSystemField?: boolean; // If modifying built-in field metadata
  systemKey?: keyof Member;
}

export interface Member {
  id: string; // Internal UUID
  membershipId: string; // e.g. KCA-FU-1001
  fullName: string;
  malayalamName?: string;
  gender?: 'Male' | 'Female' | 'Other' | string;
  dateOfBirth: string; // YYYY-MM-DD
  joinDate?: string; // Initial joining date YYYY-MM-DD
  bloodGroup: BloodGroup;
  unit: string; // "Fujairah", "Kalba", "Khorfakhan", "Dibba", etc.
  photoUrl: string; // Base64 or URL
  expiryDate: string; // Manually settable YYYY-MM-DD
  
  // Registration and Type tracking
  membershipType: MembershipType;
  registrationCategory: RegistrationCategory;
  registrationDate: string; // YYYY-MM-DD
  lastRenewalDate?: string;
  status: 'Active' | 'Expired' | 'Pending' | 'Suspended';

  // Contact details
  phoneUAE: string; // e.g. +971 50 123 4567
  whatsapp?: string;
  email: string;
  emiratesId?: string; // 784-XXXX-XXXXXXX-X
  passportNumber?: string;
  norkaId?: string; // Optional NORKA Pravasi ID
  profession?: string;
  companyName?: string;
  
  // Addresses
  uaeAddress: string;
  keralaAddress: string;
  keralaDistrict: string; // e.g. Kozhikode, Kannur, Thrissur, Ernakulam, etc.
  
  // Emergency Contact
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;

  // Payments in AED
  feeAmountAED: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  receiptNumber: string;
  paymentHistory: PaymentRecord[];

  // Supporting Documents
  documents?: MemberDocument[];

  // Dynamic Custom Fields Store (key: customFieldId -> value)
  customFields?: Record<string, any>;

  createdAt: string;
  updatedAt: string;
}

export type UserRole =
  | 'Super Admin'
  | 'Admin'
  | 'Executive Officer'
  | 'Unit Data Operator'
  | 'Unit Coordinator'
  | 'Desk Auditor';

export interface AdminAccountPermissions {
  canManageUsers?: boolean;
  canManageStorage?: boolean;
  canEditMembers?: boolean;
  canExportData?: boolean;
}

export interface AdminAccount {
  id: string;
  username: string;
  fullName: string;
  email: string;
  password?: string;
  role: UserRole;
  unit?: string; // Assigned unit for unit operators
  status: 'Active' | 'Inactive';
  createdAt: string;
  lastLoginAt?: string;
  permissions?: AdminAccountPermissions;
}

export interface UserSession {
  id: string;
  username: string;
  fullName: string;
  role: UserRole | string;
  unit?: string;
  email: string;
  isLoggedIn: boolean;
  permissions?: AdminAccountPermissions;
}

export interface BackupMetadata {
  lastBackupDate: string;
  totalMembers: number;
  localFolderName?: string;
  googleDriveFolderName?: string;
  googleDriveLinked: boolean;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RENEW' | 'RENEWAL' | 'PAYMENT' | 'EXPORT' | 'CARD_PRINT' | 'FIELD_CONFIG' | 'RESTORE';
  performedBy: string;
  details: string;
  memberId?: string;
  targetMemberId?: string;
  targetMembershipId?: string;
}

// Access Control & Permission Helper Functions

/**
 * Checks if the role is restricted to a single specific unit's data and operations
 */
export function isUnitOperatorRole(role?: string): boolean {
  return role === 'Unit Data Operator' || role === 'Unit Coordinator';
}

/**
 * Checks if the user is a top-level Super Admin or Admin (has database, cloud, and storage controls)
 */
export function isSuperAdminOrAdmin(role?: string): boolean {
  return role === 'Super Admin' || role === 'Admin';
}

/**
 * Checks if the user has central administration privileges (manage user accounts, units, backups)
 */
export function hasAdminPrivilege(role?: string): boolean {
  return role === 'Super Admin' || role === 'Admin' || role === 'Executive Officer';
}

/**
 * Checks if user has explicit permission to wipe, backup, or alter physical system storage
 */
export function canManageStorageAccess(session?: UserSession | null): boolean {
  if (!session || !session.isLoggedIn) return false;
  if (session.permissions?.canManageStorage !== undefined) {
    return session.permissions.canManageStorage;
  }
  return isSuperAdminOrAdmin(session.role);
}

/**
 * Checks if user can create, update, or remove administrative/staff user accounts
 */
export function canManageUserAccounts(session?: UserSession | null): boolean {
  if (!session || !session.isLoggedIn) return false;
  if (session.permissions?.canManageUsers !== undefined) {
    return session.permissions.canManageUsers;
  }
  return isSuperAdminOrAdmin(session.role);
}