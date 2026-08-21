import { Member, AuditLogItem, BackupMetadata, CustomFieldDefinition, AdminAccount, UserSession } from '../types/member';
import { INITIAL_CUSTOM_FIELDS, INITIAL_ADMIN_ACCOUNTS } from '../data/initialData';

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
 * Save & Load Custom Logo Image (data URL or image URL)
 */
export function saveCustomLogo(logoDataUrl: string | null): void {
  try {
    if (logoDataUrl) {
      localStorage.setItem(STORAGE_KEY_CUSTOM_LOGO, logoDataUrl);
    } else {
      localStorage.removeItem(STORAGE_KEY_CUSTOM_LOGO);
    }
    // Dispatch event to notify components in real-time
    window.dispatchEvent(new CustomEvent('kca-custom-logo-changed', { detail: logoDataUrl }));
  } catch (error) {
    console.error('Failed to save custom logo:', error);
  }
}

export function loadCustomLogo(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_CUSTOM_LOGO);
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
    if (!raw) return INITIAL_ADMIN_ACCOUNTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ADMIN_ACCOUNTS;
  } catch {
    return INITIAL_ADMIN_ACCOUNTS;
  }
}

/**
 * Save & Load Active User Session (defaults to sessionStorage for secure session management)
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
    // Check sessionStorage first for current tab session
    const sessionRaw = sessionStorage.getItem(STORAGE_KEY_USER_SESSION);
    if (sessionRaw) return JSON.parse(sessionRaw);

    // Fallback to localStorage only if rememberMe was previously set
    const localRaw = localStorage.getItem(STORAGE_KEY_USER_SESSION);
    return localRaw ? JSON.parse(localRaw) : null;
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

/**
 * Save members to persistent local storage with multi-layer rollback safety snapshots
 */
export function saveMembersToStorage(members: Member[]): void {
  try {
    const serialized = JSON.stringify(members);
    localStorage.setItem(STORAGE_KEY_MEMBERS, serialized);
    // Keep rolling safety snapshots so user data is never lost across server restarts or accidental cleans
    if (Array.isArray(members) && members.length > 0) {
      localStorage.setItem(STORAGE_KEY_EMERGENCY_BACKUP, serialized);
      localStorage.setItem(STORAGE_KEY_LAST_KNOWN_GOOD, serialized);
      localStorage.setItem(`kca_snapshot_${new Date().toISOString().split('T')[0]}`, serialized);
    }
  } catch (error) {
    console.error('Failed to save members to localStorage:', error);
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
          return parsed;
        }
      } catch {}
    }

    const candidateKeys = [
      STORAGE_KEY_EMERGENCY_BACKUP,
      STORAGE_KEY_LAST_KNOWN_GOOD,
      'kca_fujairah_members_v1',
    ];

    for (const key of candidateKeys) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {}
      }
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

/**
 * Scan all browser localStorage keys for historical Member datasets & snapshots
 */
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
 * Save custom field definitions
 */
export function saveCustomFieldsToStorage(fields: CustomFieldDefinition[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_FIELDS, JSON.stringify(fields));
  } catch (error) {
    console.error('Failed to save custom fields:', error);
  }
}

export const saveCustomFields = saveCustomFieldsToStorage;

/**
 * Load custom field definitions
 */
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
 * Save audit logs
 */
export function saveAuditLogs(logs: AuditLogItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(logs.slice(0, 500))); // Keep last 500
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
 * Trigger download of any text/blob file
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

/**
 * Save data into a selected Local PC Folder using File System Access API
 */
export async function saveToLocalPcFolder(
  members: Member[],
  auditLogs: AuditLogItem[],
  customFields?: CustomFieldDefinition[]
): Promise<{ success: boolean; message: string; folderName?: string }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupData = {
    organization: 'Kairali Cultural Association Fujairah (Norka Affiliated)',
    exportDate: new Date().toISOString(),
    version: '2.0',
    totalMembers: members.length,
    customLogo: loadCustomLogo(),
    customFields: customFields || loadCustomFieldsFromStorage(),
    members,
    auditLogs,
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const filename = `KCA_Fujairah_Backup_${timestamp}.json`;

  if ('showDirectoryPicker' in window) {
    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents',
      });

      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(jsonString);
      await writable.close();

      const csvString = exportMembersToCsvString(members, customFields);
      const csvHandle = await dirHandle.getFileHandle(`KCA_Members_${timestamp}.csv`, { create: true });
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
        message: `Successfully saved backup files to PC folder: "${dirHandle.name}"`,
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
    message: `Saved backup file "${filename}" to your PC Downloads folder.`,
    folderName: 'Downloads',
  };
}

/**
 * Convert Members list to formatted CSV String (including all dynamic custom fields)
 */
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

/**
 * Export CSV download
 */
export function downloadMembersCsv(members: Member[], customFields?: CustomFieldDefinition[]): void {
  const csv = exportMembersToCsvString(members, customFields);
  const dateStr = new Date().toISOString().split('T')[0];
  triggerFileDownload(csv, `KCA_Fujairah_Members_${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export JSON backup download
 */
export function downloadFullJsonBackup(
  members: Member[],
  auditLogs: AuditLogItem[],
  customFields?: CustomFieldDefinition[]
): void {
  const backup = {
    organization: 'Kairali Cultural Association Fujairah (Norka Affiliated)',
    exportDate: new Date().toISOString(),
    totalMembers: members.length,
    customFields: customFields || loadCustomFieldsFromStorage(),
    members,
    auditLogs,
  };
  const dateStr = new Date().toISOString().split('T')[0];
  triggerFileDownload(JSON.stringify(backup, null, 2), `KCA_Fujairah_FullBackup_${dateStr}.json`, 'application/json');
}
