import { Member, AuditLogItem, BackupMetadata, CustomFieldDefinition, AdminAccount, UserSession } from '../types/member';
import { PortalBrandingConfig, DEFAULT_PORTAL_CONFIG, STORAGE_KEY_PORTAL_CONFIG } from '../types/portal';
import { INITIAL_CUSTOM_FIELDS, INITIAL_ADMIN_ACCOUNTS } from '../data/initialData';
import { saveMembersToIndexedDb } from './indexedDbStorage';
import { loadStudentsWing, saveStudentsWing } from './studentsWingStorage';
import { loadSavedTheme, saveAndApplyTheme } from './theme';

const STORAGE_KEY_MEMBERS = 'kca_fujairah_members_v2';
const STORAGE_KEY_EMERGENCY_BACKUP = 'kca_emergency_members_backup';
const STORAGE_KEY_LAST_KNOWN_GOOD = 'kca_members_last_known_good';
const STORAGE_KEY_AUDIT = 'kca_fujairah_audit_logs_v2';
const STORAGE_KEY_BACKUP_META = 'kca_fujairah_backup_meta_v2';
const STORAGE_KEY_CUSTOM_FIELDS = 'kca_fujairah_custom_fields_v2';
const STORAGE_KEY_ADMIN_ACCOUNTS = 'kca_fujairah_admin_accounts_v2';
const STORAGE_KEY_USER_SESSION = 'kca_fujairah_active_session_v2';
const STORAGE_KEY_CUSTOM_LOGO = 'kca_fujairah_custom_logo_v1';

/**
 * Prunes redundant daily snapshots and keeps only the latest 1 snapshot
 * to prevent exhausting browser localStorage quota.
 */
export function pruneStorageSnapshots(): void {
  try {
    const snapshotKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('kca_snapshot_')) {
        snapshotKeys.push(key);
      }
    }
    if (snapshotKeys.length > 1) {
      snapshotKeys.sort().reverse();
      // Keep only the most recent snapshot, delete earlier ones
      for (let i = 1; i < snapshotKeys.length; i++) {
        localStorage.removeItem(snapshotKeys[i]);
      }
    }
  } catch (err) {
    console.warn('Snapshot prune notice:', err);
  }
}

let inMemoryCustomLogo: string | null | undefined = undefined;
let inMemoryPortalConfig: PortalBrandingConfig | null = null;

/**
 * Save & Load Portal Branding Configuration
 */
export function loadPortalConfig(): PortalBrandingConfig {
  try {
    if (inMemoryPortalConfig) {
      const resolvedLogo =
        inMemoryCustomLogo !== undefined
          ? inMemoryCustomLogo
          : inMemoryPortalConfig.customLogoUrl;
      return {
        ...inMemoryPortalConfig,
        customLogoUrl: resolvedLogo ?? null,
      };
    }

    const raw = localStorage.getItem(STORAGE_KEY_PORTAL_CONFIG);
    const customLogo = localStorage.getItem(STORAGE_KEY_CUSTOM_LOGO);
    if (raw) {
      const parsed = JSON.parse(raw);
      const effectiveLogo =
        inMemoryCustomLogo !== undefined
          ? inMemoryCustomLogo
          : customLogo !== null
          ? customLogo
          : parsed.customLogoUrl ?? null;
      return {
        ...DEFAULT_PORTAL_CONFIG,
        ...parsed,
        customLogoUrl: effectiveLogo,
      };
    }
    if (inMemoryCustomLogo !== undefined || customLogo) {
      return {
        ...DEFAULT_PORTAL_CONFIG,
        customLogoUrl: inMemoryCustomLogo !== undefined ? inMemoryCustomLogo : customLogo,
      };
    }
  } catch (e) {
    console.warn('Failed to parse portal config:', e);
  }
  return {
    ...DEFAULT_PORTAL_CONFIG,
    customLogoUrl: inMemoryCustomLogo !== undefined ? inMemoryCustomLogo : DEFAULT_PORTAL_CONFIG.customLogoUrl,
  };
}

export function savePortalConfig(config: Partial<PortalBrandingConfig>): PortalBrandingConfig {
  const current = loadPortalConfig();
  const updated: PortalBrandingConfig = {
    ...current,
    ...config,
    updatedAt: new Date().toISOString(),
  };

  inMemoryPortalConfig = updated;
  if (config.customLogoUrl !== undefined) {
    inMemoryCustomLogo = config.customLogoUrl ?? null;
  }

  // Persist custom logo first cleanly (avoid writing oversized strings twice if quota is tight)
  if (config.customLogoUrl !== undefined) {
    try {
      if (updated.customLogoUrl) {
        localStorage.setItem(STORAGE_KEY_CUSTOM_LOGO, updated.customLogoUrl);
      } else {
        localStorage.removeItem(STORAGE_KEY_CUSTOM_LOGO);
      }
    } catch (logoErr) {
      console.warn('Could not persist custom logo in primary key, retrying after pruning snapshots:', logoErr);
      pruneStorageSnapshots();
      try {
        if (updated.customLogoUrl) {
          localStorage.setItem(STORAGE_KEY_CUSTOM_LOGO, updated.customLogoUrl);
        }
      } catch {}
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY_PORTAL_CONFIG, JSON.stringify(updated));
  } catch (error) {
    console.warn('Portal config full save hit quota; saving config without duplicate logo copy:', error);
    try {
      const leanConfig = { ...updated, customLogoUrl: updated.customLogoUrl ? undefined : null };
      localStorage.setItem(STORAGE_KEY_PORTAL_CONFIG, JSON.stringify(leanConfig));
    } catch (innerErr) {
      console.error('Failed to save portal config:', innerErr);
    }
  }

  // Always notify active views (Navbar, ID Cards, Batch Print, Certificates)
  if (typeof window !== 'undefined') {
    if (config.customLogoUrl !== undefined) {
      window.dispatchEvent(new CustomEvent('kca-custom-logo-changed', { detail: updated.customLogoUrl ?? null }));
    }
    window.dispatchEvent(new CustomEvent('kca-portal-config-changed', { detail: updated }));
  }

  return updated;
}

/**
 * Save & Load Custom Logo Image (data URL or image URL)
 */
export function saveCustomLogo(logoDataUrl: string | null): void {
  const normalizedLogo = logoDataUrl || null;
  inMemoryCustomLogo = normalizedLogo;

  const currentConfig = loadPortalConfig();
  const updatedConfig: PortalBrandingConfig = {
    ...currentConfig,
    customLogoUrl: normalizedLogo,
    updatedAt: new Date().toISOString(),
  };
  inMemoryPortalConfig = updatedConfig;

  try {
    if (normalizedLogo) {
      localStorage.setItem(STORAGE_KEY_CUSTOM_LOGO, normalizedLogo);
    } else {
      localStorage.removeItem(STORAGE_KEY_CUSTOM_LOGO);
    }
  } catch (error) {
    console.warn('Primary custom logo storage quota issue, pruning snapshots and retrying:', error);
    pruneStorageSnapshots();
    try {
      if (normalizedLogo) {
        localStorage.setItem(STORAGE_KEY_CUSTOM_LOGO, normalizedLogo);
      }
    } catch (retryErr) {
      console.error('Failed to persist custom logo to localStorage (active in memory):', retryErr);
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY_PORTAL_CONFIG, JSON.stringify(updatedConfig));
  } catch {
    try {
      // Store lean portal config without duplicate base64 logo payload if quota is constrained
      const leanConfig = { ...updatedConfig, customLogoUrl: normalizedLogo ? undefined : null };
      localStorage.setItem(STORAGE_KEY_PORTAL_CONFIG, JSON.stringify(leanConfig));
    } catch (cfgErr) {
      console.warn('Failed to update portal config logo reference:', cfgErr);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kca-custom-logo-changed', { detail: normalizedLogo }));
    window.dispatchEvent(new CustomEvent('kca-portal-config-changed', { detail: updatedConfig }));
  }
}

export function loadCustomLogo(): string | null {
  if (inMemoryCustomLogo !== undefined) {
    return inMemoryCustomLogo;
  }
  try {
    const directLogo = localStorage.getItem(STORAGE_KEY_CUSTOM_LOGO);
    if (directLogo) {
      return directLogo;
    }
    const portalConfig = loadPortalConfig();
    if (portalConfig.customLogoUrl) {
      return portalConfig.customLogoUrl;
    }
    return null;
  } catch {
    return null;
  }
}

export function resetCustomLogo(): void {
  saveCustomLogo(null);
}

/**
 * Save & Load Admin Accounts
 */
export function saveAdminAccounts(accounts: AdminAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_ACCOUNTS, JSON.stringify(accounts));
  } catch (error) {
    console.error('Failed to save admin accounts:', error);
  }
}

export function loadAdminAccounts(): AdminAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_ACCOUNTS);
    const parsed = raw ? JSON.parse(raw) : INITIAL_ADMIN_ACCOUNTS;
    const accounts = Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ADMIN_ACCOUNTS;

    return accounts.map((acc: AdminAccount) => ({
      ...acc,
      permissions: acc.permissions || {
        canManageUsers: acc.role === 'Super Admin' || acc.role === 'Admin',
        canManageStorage: acc.role === 'Super Admin' || acc.role === 'Admin',
        canEditMembers: true,
        canExportData: true,
      },
    }));
  } catch {
    return INITIAL_ADMIN_ACCOUNTS;
  }
}

/**
 * Save & Load Active User Session
 */
export function saveActiveUserSession(session: UserSession | null, rememberMe: boolean = false): void {
  try {
    if (session) {
      sessionStorage.setItem(STORAGE_KEY_USER_SESSION, JSON.stringify(session));
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY_USER_SESSION, JSON.stringify(session));
      } else {
        localStorage.removeItem(STORAGE_KEY_USER_SESSION);
      }
    } else {
      sessionStorage.removeItem(STORAGE_KEY_USER_SESSION);
      localStorage.removeItem(STORAGE_KEY_USER_SESSION);
    }
  } catch (error) {
    console.error('Failed to save user session:', error);
  }
}

export function loadActiveUserSession(): UserSession | null {
  try {
    const sessionRaw = sessionStorage.getItem(STORAGE_KEY_USER_SESSION) || localStorage.getItem(STORAGE_KEY_USER_SESSION);
    if (!sessionRaw) return null;

    const session: UserSession = JSON.parse(sessionRaw);

    if (session.isLoggedIn && (session.role === 'Super Admin' || session.role === 'Admin')) {
      session.permissions = {
        canManageUsers: true,
        canManageStorage: true,
        canEditMembers: true,
        canExportData: true,
        ...session.permissions,
      };
    }
    return session;
  } catch {
    return null;
  }
}

export function clearActiveUserSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY_USER_SESSION);
    localStorage.removeItem(STORAGE_KEY_USER_SESSION);
  } catch (error) {
    console.error('Failed to clear user session:', error);
  }
}

export function sanitizeMemberRecord(m: Member): Member {
  if (!m) return m;
  let updated = false;
  let des = m.designation;
  let coordDes = m.coordinationDesignation;

  if (des && /central\s+liaison(\s+officer)?/i.test(des)) {
    des = des.replace(/central\s+liaison(\s+officer)?/gi, '').trim();
    updated = true;
  }
  if (coordDes && /central\s+liaison(\s+officer)?/i.test(coordDes)) {
    coordDes = coordDes.replace(/central\s+liaison(\s+officer)?/gi, '').trim();
    updated = true;
  }
  if (!updated) return m;
  return {
    ...m,
    designation: des || undefined,
    coordinationDesignation: coordDes || undefined,
  };
}

/**
 * Save members to persistent storage with dual-layer safety (IndexedDB + localStorage)
 * Unlimited capacity in IndexedDB + quota-safe fallback in localStorage.
 */
export function saveMembersToStorage(members: Member[]): void {
  const sanitizedMembers = (members || []).map(sanitizeMemberRecord);
  // 1. Persist full dataset to IndexedDB (unlimited quota, supports 10,000+ members with photos)
  saveMembersToIndexedDb(sanitizedMembers).catch((err) => {
    console.warn('Background IndexedDB save notification:', err);
  });

  // 2. Persist to localStorage with active quota management
  try {
    pruneStorageSnapshots();
    const serialized = JSON.stringify(sanitizedMembers);
    localStorage.setItem(STORAGE_KEY_MEMBERS, serialized);
  } catch (error) {
    console.warn('LocalStorage quota limit detected, executing auto-recovery cleanup...', error);
    try {
      // Step A: Prune all daily snapshots & duplicate emergency backups
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (
          k &&
          (k.startsWith('kca_snapshot_') ||
            k === STORAGE_KEY_EMERGENCY_BACKUP ||
            k === STORAGE_KEY_LAST_KNOWN_GOOD)
        ) {
          localStorage.removeItem(k);
        }
      }

      // Step B: Trim audit logs to save space
      try {
        const rawAudit = localStorage.getItem(STORAGE_KEY_AUDIT);
        if (rawAudit) {
          const parsed = JSON.parse(rawAudit);
          if (Array.isArray(parsed) && parsed.length > 25) {
            localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(parsed.slice(0, 25)));
          }
        }
      } catch {}

      // Step C: Try saving primary members again
      const serialized = JSON.stringify(members);
      localStorage.setItem(STORAGE_KEY_MEMBERS, serialized);
    } catch (secondErr) {
      console.warn('Second attempt with full data failed, saving lean copy to localStorage (full data safely in IndexedDB)...', secondErr);
      try {
        // Step D: Strip bulky document attachments and oversized photo URLs (>25KB) from localStorage copy
        // (IndexedDB holds the full pristine copies and App.tsx hydrates them seamlessly)
        const leanMembers = members.map((m) => {
          const isBulkyPhoto = m.photoUrl && m.photoUrl.startsWith('data:image') && m.photoUrl.length > 25000;
          return {
            ...m,
            photoUrl: isBulkyPhoto ? '' : m.photoUrl,
            documents: (m.documents || []).map((d) => ({
              ...d,
              fileDataUrl: '', // Preserved in IndexedDB
            })),
          };
        });
        localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(leanMembers));
        console.log('Successfully saved quota-safe member records to localStorage');
      } catch (finalErr) {
        console.error('Critical localStorage write error (dataset preserved in IndexedDB):', finalErr);
      }
    }
  }
}

/**
 * Load members from persistent local storage with smart fallback
 */
export function loadMembersFromStorage(): Member[] | null {
  try {
    const mainRaw = localStorage.getItem(STORAGE_KEY_MEMBERS);
    if (mainRaw !== null) {
      try {
        const parsed = JSON.parse(mainRaw);
        if (Array.isArray(parsed)) {
          return parsed.map(sanitizeMemberRecord);
        }
      } catch {}
    }
    return null;
  } catch (error) {
    console.error('Failed to load members from localStorage:', error);
    return null;
  }
}

export interface LocalStorageSnapshot {
  key: string;
  label: string;
  memberCount: number;
  members: Member[];
  timestamp?: string;
}

export function getLocalRecoverySnapshots(): LocalStorageSnapshot[] {
  const snapshots: LocalStorageSnapshot[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (
        key.startsWith('kca_') ||
        key.includes('members') ||
        key.includes('backup') ||
        key.includes('snapshot')
      ) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          let candidateMembers: Member[] | null = null;

          if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].membershipId || parsed[0].fullName)) {
            candidateMembers = parsed;
          } else if (parsed && Array.isArray(parsed.members) && parsed.members.length > 0) {
            candidateMembers = parsed.members;
          }

          if (candidateMembers && candidateMembers.length > 0) {
            snapshots.push({
              key,
              label: key === STORAGE_KEY_MEMBERS ? 'Current Main Storage (v2)' : key === STORAGE_KEY_EMERGENCY_BACKUP ? 'Emergency Safety Backup' : key === STORAGE_KEY_LAST_KNOWN_GOOD ? 'Last Known Good Session' : key,
              memberCount: candidateMembers.length,
              members: candidateMembers,
              timestamp: parsed.exportDate || parsed.lastUpdated || undefined,
            });
          }
        } catch {}
      }
    }
  } catch (err) {
    console.error('Error scanning local recovery snapshots:', err);
  }
  return snapshots;
}

/**
 * Custom Fields Management
 */
export function saveCustomFieldsToStorage(fields: CustomFieldDefinition[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_FIELDS, JSON.stringify(fields));
  } catch (error) {
    console.error('Failed to save custom fields:', error);
  }
}

export const saveCustomFields = saveCustomFieldsToStorage;

export function loadCustomFieldsFromStorage(): CustomFieldDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_FIELDS);
    if (!raw) return INITIAL_CUSTOM_FIELDS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CUSTOM_FIELDS;
  } catch {
    return INITIAL_CUSTOM_FIELDS;
  }
}

export const loadCustomFields = loadCustomFieldsFromStorage;

/**
 * Audit Logs
 */
export function saveAuditLogs(logs: AuditLogItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(logs.slice(0, 500)));
  } catch (error) {
    console.error('Failed to save audit logs:', error);
  }
}

export function loadAuditLogs(): AuditLogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT) || localStorage.getItem('kca_fujairah_audit_logs_v1');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Backup Metadata
 */
export function getBackupMetadata(): BackupMetadata {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BACKUP_META);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    lastBackupDate: new Date().toISOString(),
    totalMembers: 0,
    googleDriveLinked: false,
  };
}

export function setBackupMetadata(meta: Partial<BackupMetadata>): void {
  try {
    const existing = getBackupMetadata();
    localStorage.setItem(STORAGE_KEY_BACKUP_META, JSON.stringify({ ...existing, ...meta }));
  } catch {}
}

/**
 * File Downloads & Exports
 */
export function triggerFileDownload(content: string, filename: string, mimeType = 'application/json'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function saveToLocalPcFolder(
  members: Member[],
  auditLogs: AuditLogItem[],
  customFields?: CustomFieldDefinition[]
): Promise<{ success: boolean; message: string; folderName?: string }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  // Export the complete, pristine system database snapshot containing all 18+ system tables
  const jsonString = exportFullDatabaseSnapshot();
  const filename = `KCA_Fujairah_Full_System_Backup_${timestamp}.json`;

  if ('showDirectoryPicker' in window) {
    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents',
      });

      // Save full system database snapshot JSON
      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(jsonString);
      await writable.close();

      // Also save members spreadsheet CSV
      const csvString = exportMembersToCsvString(members, customFields);
      const csvHandle = await dirHandle.getFileHandle(`KCA_Members_Spreadsheet_${timestamp}.csv`, { create: true });
      const csvWritable = await csvHandle.createWritable();
      await csvWritable.write(csvString);
      await csvWritable.close();

      setBackupMetadata({
        lastBackupDate: new Date().toISOString(),
        totalMembers: members.length,
        localFolderName: dirHandle.name,
      });

      return {
        success: true,
        message: `Successfully saved complete system database backup and member spreadsheet to PC folder: "${dirHandle.name}"`,
        folderName: dirHandle.name,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, message: 'Folder selection was cancelled.' };
      }
      console.warn('showDirectoryPicker failed, falling back to download:', err);
    }
  }

  triggerFileDownload(jsonString, filename, 'application/json');
  setBackupMetadata({
    lastBackupDate: new Date().toISOString(),
    totalMembers: members.length,
    localFolderName: 'Downloads folder (Browser default)',
  });

  return {
    success: true,
    message: `Saved complete system backup file "${filename}" to your PC Downloads folder.`,
    folderName: 'Downloads',
  };
}

export function exportMembersToCsvString(members: Member[], customFields?: CustomFieldDefinition[]): string {
  const fields = customFields || loadCustomFieldsFromStorage();

  const standardHeaders = [
    'Membership ID',
    'Full Name',
    'Malayalam Name',
    'Date of Birth',
    'Blood Group',
    'Unit',
    'Expiry Date',
    'Membership Type',
    'Registration Category',
    'Registration Date',
    'Status',
    'UAE Phone',
    'WhatsApp',
    'Email',
    'Emirates ID',
    'Passport Number',
    'Profession',
    'Company Name',
    'UAE Address',
    'Kerala Address',
    'Kerala District',
    'Emergency Contact Name',
    'Emergency Relation',
    'Emergency Phone',
    'Fee (AED)',
    'Payment Status',
    'Payment Method',
    'Receipt Number',
  ];

  const customFieldHeaders = fields.map((f) => f.label);
  const allHeaders = [...standardHeaders, ...customFieldHeaders];

  const escapeCsv = (val: any) => {
    if (val === undefined || val === null) return '""';
    if (typeof val === 'boolean') return val ? '"YES"' : '"NO"';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = members.map((m) => {
    const stdRow = [
      escapeCsv(m.membershipId),
      escapeCsv(m.fullName),
      escapeCsv(m.malayalamName || ''),
      escapeCsv(m.dateOfBirth),
      escapeCsv(m.bloodGroup),
      escapeCsv(m.unit),
      escapeCsv(m.expiryDate),
      escapeCsv(m.membershipType),
      escapeCsv(m.registrationCategory),
      escapeCsv(m.registrationDate),
      escapeCsv(m.status),
      escapeCsv(m.phoneUAE),
      escapeCsv(m.whatsapp || ''),
      escapeCsv(m.email),
      escapeCsv(m.emiratesId || ''),
      escapeCsv(m.passportNumber || ''),
      escapeCsv(m.profession || ''),
      escapeCsv(m.companyName || ''),
      escapeCsv(m.uaeAddress),
      escapeCsv(m.keralaAddress),
      escapeCsv(m.keralaDistrict),
      escapeCsv(m.emergencyContactName),
      escapeCsv(m.emergencyContactRelation),
      escapeCsv(m.emergencyContactPhone),
      escapeCsv(m.feeAmountAED),
      escapeCsv(m.paymentStatus),
      escapeCsv(m.paymentMethod),
      escapeCsv(m.receiptNumber),
    ];

    const customRow = fields.map((f) => {
      const val = m.customFields ? m.customFields[f.id] : undefined;
      return escapeCsv(val);
    });

    return [...stdRow, ...customRow];
  });

  return [allHeaders.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function downloadMembersCsv(members: Member[], customFields?: CustomFieldDefinition[]): void {
  const csv = exportMembersToCsvString(members, customFields);
  const dateStr = new Date().toISOString().split('T')[0];
  triggerFileDownload(csv, `KCA_Fujairah_Members_${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

export function downloadFullJsonBackup(
  members: Member[],
  auditLogs: AuditLogItem[],
  customFields?: CustomFieldDefinition[]
): void {
  downloadFullSystemDatabaseBackup();
}

/**
 * System Database Dump & Restore Utilities - Full System Backup across every part of the system
 */
export function exportFullDatabaseSnapshot(): string {
  // Safe loader helpers for all modules
  const getStorageJson = (key: string, defaultVal: any = []) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {}
    return defaultVal;
  };

  const membersData = loadMembersFromStorage() || [];
  const studentsWingData = loadStudentsWing() || [];
  const adminAccountsData = loadAdminAccounts() || [];
  const customFieldsData = loadCustomFieldsFromStorage() || [];
  const portalConfigData = loadPortalConfig();
  const auditLogsData = loadAuditLogs() || [];
  const financeTransactionsData = getStorageJson('kca_fujairah_finance_transactions_v1', []);
  const particularsData = getStorageJson('kca_fujairah_finance_particulars_v1', []);
  const unitBalancesData = getStorageJson('kca_fujairah_finance_unit_balances_v1', []);
  const inventoryItemsData = getStorageJson('kca_fujairah_inventory_items_v1', []);
  const inventoryLogsData = getStorageJson('kca_fujairah_inventory_logs_v1', []);
  const classesData = getStorageJson('kca_cultural_classes_v1', []) || getStorageJson('kca_fujairah_classes_v1', []);
  const participantsData = getStorageJson('kca_class_participants_v1', []) || getStorageJson('kca_fujairah_participants_v1', []);
  const attendanceData = getStorageJson('kca_class_attendance_v1', []) || getStorageJson('kca_fujairah_attendance_v1', []);
  const documentsData = getStorageJson('kca_fujairah_general_documents_v1', []);
  const lettersData = getStorageJson('kca_fujairah_letters_v1', []);
  const letterSeriesData = getStorageJson('kca_letter_series_config_v1', null);
  const contactsData = getStorageJson('kca_fujairah_contact_bank_v1', []);
  const unitsData = getStorageJson('kca_fujairah_units_v1', []);
  const signaturesData = getStorageJson('kca_fujairah_signatures_v1', []);
  const customLogoUrl = loadCustomLogo() || localStorage.getItem('kca_fujairah_custom_logo_v1') || localStorage.getItem('kca_portal_custom_logo') || localStorage.getItem('kca_custom_logo_data_url') || '';
  const portalTheme = loadSavedTheme();
  const themeMode = localStorage.getItem('kca_theme_mode') || 'light';
  const backupMeta = getBackupMetadata();

  const totalRecordCount =
    membersData.length +
    studentsWingData.length +
    financeTransactionsData.length +
    particularsData.length +
    inventoryItemsData.length +
    inventoryLogsData.length +
    classesData.length +
    participantsData.length +
    attendanceData.length +
    documentsData.length +
    lettersData.length +
    contactsData.length +
    signaturesData.length +
    adminAccountsData.length +
    auditLogsData.length;

  const backupPayload = {
    backupType: 'FULL_SYSTEM_DATABASE_BACKUP',
    organization: 'Kairali Cultural Association Fujairah (A NORKA Affiliated Organisation)',
    exportedAt: new Date().toISOString(),
    schemaVersion: '3.0',
    stats: {
      totalMembers: membersData.length,
      totalStudentsWing: studentsWingData.length,
      totalFinanceTransactions: financeTransactionsData.length,
      totalFinancialParticulars: particularsData.length,
      totalInventoryItems: inventoryItemsData.length,
      totalInventoryLogs: inventoryLogsData.length,
      totalClasses: classesData.length,
      totalClassParticipants: participantsData.length,
      totalClassAttendance: attendanceData.length,
      totalDocuments: documentsData.length,
      totalLetters: lettersData.length,
      totalContacts: contactsData.length,
      totalSignatures: signaturesData.length,
      totalAdminAccounts: adminAccountsData.length,
      totalAuditLogs: auditLogsData.length,
      totalUnits: unitsData.length,
      totalCustomFields: customFieldsData.length,
      totalRecords: totalRecordCount,
    },
    tables: {
      members: membersData,
      studentsWing: studentsWingData,
      adminAccounts: adminAccountsData,
      customFields: customFieldsData,
      portalConfig: portalConfigData,
      auditLogs: auditLogsData,
      financeTransactions: financeTransactionsData,
      financialParticulars: particularsData,
      unitCashBalances: unitBalancesData,
      inventoryItems: inventoryItemsData,
      inventoryLogs: inventoryLogsData,
      classes: classesData,
      classParticipants: participantsData,
      classAttendance: attendanceData,
      generalDocuments: documentsData,
      officialLetters: lettersData,
      letterSeriesConfig: letterSeriesData,
      contactBank: contactsData,
      units: unitsData,
      storedSignatures: signaturesData,
      customLogoUrl: customLogoUrl,
      portalTheme: portalTheme,
      themeConfig: portalTheme,
      themeMode: themeMode,
      backupMetadata: backupMeta,
    },
  };

  return JSON.stringify(backupPayload, null, 2);
}

export function downloadFullSystemDatabaseBackup(): void {
  const json = exportFullDatabaseSnapshot();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const filename = `KCA_Fujairah_Full_System_Backup_${dateStr}_${timeStr}.json`;
  triggerFileDownload(json, filename, 'application/json');
}

export interface RestoreResult {
  success: boolean;
  tablesRestored: number;
  totalRecordsRestored: number;
  details: Record<string, number>;
  error?: string;
}

export function importFullDatabaseSnapshot(jsonString: string): RestoreResult {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      return { success: false, tablesRestored: 0, totalRecordsRestored: 0, details: {}, error: 'Invalid backup format' };
    }

    // Support both schema v3 (nested in `tables`) and legacy v1/v2 flat structures
    const sourceTables = data.tables || data;
    const details: Record<string, number> = {};
    let tablesCount = 0;
    let recordsCount = 0;

    // Helper to safely write table
    const restoreTable = (keys: string[], tableData: any) => {
      if (Array.isArray(tableData)) {
        for (const key of keys) {
          localStorage.setItem(key, JSON.stringify(tableData));
        }
        details[keys[0]] = tableData.length;
        tablesCount++;
        recordsCount += tableData.length;
      }
    };

    // 1. Members
    if (Array.isArray(sourceTables.members)) {
      saveMembersToStorage(sourceTables.members);
      details['members'] = sourceTables.members.length;
      tablesCount++;
      recordsCount += sourceTables.members.length;
    }

    // 2. Children's Wing
    if (Array.isArray(sourceTables.studentsWing)) {
      saveStudentsWing(sourceTables.studentsWing);
      details['studentsWing'] = sourceTables.studentsWing.length;
      tablesCount++;
      recordsCount += sourceTables.studentsWing.length;
    }

    // 3. Admin Accounts
    if (Array.isArray(sourceTables.adminAccounts)) {
      saveAdminAccounts(sourceTables.adminAccounts);
      details['adminAccounts'] = sourceTables.adminAccounts.length;
      tablesCount++;
    }

    // 4. Custom Form Fields
    if (Array.isArray(sourceTables.customFields)) {
      saveCustomFieldsToStorage(sourceTables.customFields);
      details['customFields'] = sourceTables.customFields.length;
      tablesCount++;
    }

    // 5. Portal Branding Config
    if (sourceTables.portalConfig) {
      savePortalConfig(sourceTables.portalConfig);
      tablesCount++;
    }

    // 6. Security Audit Logs
    if (Array.isArray(sourceTables.auditLogs)) {
      saveAuditLogs(sourceTables.auditLogs);
      details['auditLogs'] = sourceTables.auditLogs.length;
      tablesCount++;
      recordsCount += sourceTables.auditLogs.length;
    }

    // 7. Finance Transactions, Particulars & Unit Balances
    restoreTable(['kca_fujairah_finance_transactions_v1'], sourceTables.financeTransactions);
    restoreTable(['kca_fujairah_finance_particulars_v1'], sourceTables.financialParticulars);
    restoreTable(['kca_fujairah_finance_unit_balances_v1'], sourceTables.unitCashBalances);

    // 8. Asset Inventory & Movement Logs
    restoreTable(['kca_fujairah_inventory_items_v1'], sourceTables.inventoryItems);
    restoreTable(['kca_fujairah_inventory_logs_v1'], sourceTables.inventoryLogs);

    // 9. Cultural Classes, Participants & Attendance
    restoreTable(['kca_cultural_classes_v1', 'kca_fujairah_classes_v1'], sourceTables.classes);
    restoreTable(['kca_class_participants_v1', 'kca_fujairah_participants_v1'], sourceTables.classParticipants);
    restoreTable(['kca_class_attendance_v1', 'kca_fujairah_attendance_v1'], sourceTables.classAttendance);

    // 10. Documents Archive
    restoreTable(['kca_fujairah_general_documents_v1'], sourceTables.generalDocuments);

    // 11. Official Letter Pad
    restoreTable(['kca_fujairah_letters_v1'], sourceTables.officialLetters || sourceTables.letters);

    // 12. Contact Bank
    restoreTable(['kca_fujairah_contact_bank_v1'], sourceTables.contactBank);

    // 13. Organizational Units
    restoreTable(['kca_fujairah_units_v1'], sourceTables.units);

    // 14. Digital Signatures
    restoreTable(['kca_fujairah_signatures_v1'], sourceTables.storedSignatures || sourceTables.signatures);

    // 15. Letter Series Configuration
    if (sourceTables.letterSeriesConfig) {
      localStorage.setItem('kca_letter_series_config_v1', JSON.stringify(sourceTables.letterSeriesConfig));
      tablesCount++;
    }

    // 16. Custom Organization Logo
    if (sourceTables.customLogoUrl) {
      saveCustomLogo(sourceTables.customLogoUrl);
      tablesCount++;
    }

    // 17. Theme Configuration (Solid Presets, Hex overrides)
    if (sourceTables.portalTheme || sourceTables.themeConfig) {
      const themePayload = sourceTables.portalTheme || sourceTables.themeConfig;
      if (typeof themePayload === 'object' && themePayload?.primary) {
        saveAndApplyTheme(themePayload);
      } else if (typeof themePayload === 'string' && themePayload.startsWith('{')) {
        try {
          saveAndApplyTheme(JSON.parse(themePayload));
        } catch {}
      }
      tablesCount++;
    }

    // 18. Theme Mode
    if (sourceTables.themeMode) {
      localStorage.setItem('kca_theme_mode', sourceTables.themeMode);
      tablesCount++;
    }

    // 19. Backup Metadata
    if (sourceTables.backupMetadata && typeof sourceTables.backupMetadata === 'object') {
      setBackupMetadata(sourceTables.backupMetadata);
      tablesCount++;
    }

    window.dispatchEvent(new CustomEvent('kca-full-system-restored', { detail: details }));
    window.dispatchEvent(new CustomEvent('kca_fujairah_sync', { detail: { type: 'ALL_SYNC', timestamp: Date.now() } }));

    return {
      success: true,
      tablesRestored: tablesCount,
      totalRecordsRestored: recordsCount,
      details,
    };
  } catch (error: any) {
    console.error('Failed to restore database snapshot:', error);
    return {
      success: false,
      tablesRestored: 0,
      totalRecordsRestored: 0,
      details: {},
      error: error?.message || 'Failed to parse JSON backup archive',
    };
  }
}