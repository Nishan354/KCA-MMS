import { Member, AuditLogItem, BackupMetadata, CustomFieldDefinition, AdminAccount, UserSession } from '../types/member';
import { PortalBrandingConfig, DEFAULT_PORTAL_CONFIG, STORAGE_KEY_PORTAL_CONFIG } from '../types/portal';
import { INITIAL_CUSTOM_FIELDS, INITIAL_ADMIN_ACCOUNTS } from '../data/initialData';
import { saveMembersToIndexedDb } from './indexedDbStorage';

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

/**
 * Save & Load Portal Branding Configuration
 */
export function loadPortalConfig(): PortalBrandingConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PORTAL_CONFIG);
    const customLogo = localStorage.getItem(STORAGE_KEY_CUSTOM_LOGO);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PORTAL_CONFIG,
        ...parsed,
        customLogoUrl: parsed.customLogoUrl !== undefined ? parsed.customLogoUrl : customLogo || null,
      };
    }
    if (customLogo) {
      return { ...DEFAULT_PORTAL_CONFIG, customLogoUrl: customLogo };
    }
  } catch (e) {
    console.warn('Failed to parse portal config:', e);
  }
  return DEFAULT_PORTAL_CONFIG;
}

export function savePortalConfig(config: Partial<PortalBrandingConfig>): PortalBrandingConfig {
  try {
    const current = loadPortalConfig();
    const updated: PortalBrandingConfig = {
      ...current,
      ...config,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_PORTAL_CONFIG, JSON.stringify(updated));

    if (updated.customLogoUrl !== undefined) {
      if (updated.customLogoUrl) {
        localStorage.setItem(STORAGE_KEY_CUSTOM_LOGO, updated.customLogoUrl);
      } else {
        localStorage.removeItem(STORAGE_KEY_CUSTOM_LOGO);
      }
      window.dispatchEvent(new CustomEvent('kca-custom-logo-changed', { detail: updated.customLogoUrl }));
    }

    window.dispatchEvent(new CustomEvent('kca-portal-config-changed', { detail: updated }));
    return updated;
  } catch (error) {
    console.error('Failed to save portal config:', error);
    return DEFAULT_PORTAL_CONFIG;
  }
}

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
    const currentConfig = loadPortalConfig();
    currentConfig.customLogoUrl = logoDataUrl;
    localStorage.setItem(STORAGE_KEY_PORTAL_CONFIG, JSON.stringify(currentConfig));

    window.dispatchEvent(new CustomEvent('kca-custom-logo-changed', { detail: logoDataUrl }));
    window.dispatchEvent(new CustomEvent('kca-portal-config-changed', { detail: currentConfig }));
  } catch (error) {
    console.error('Failed to save custom logo:', error);
  }
}

export function loadCustomLogo(): string | null {
  try {
    const portalConfig = loadPortalConfig();
    if (portalConfig.customLogoUrl !== undefined) {
      return portalConfig.customLogoUrl;
    }
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

/**
 * Save members to persistent storage with dual-layer safety (IndexedDB + localStorage)
 * Unlimited capacity in IndexedDB + quota-safe fallback in localStorage.
 */
export function saveMembersToStorage(members: Member[]): void {
  // 1. Persist full dataset to IndexedDB (unlimited quota, supports 10,000+ members with photos)
  saveMembersToIndexedDb(members).catch((err) => {
    console.warn('Background IndexedDB save notification:', err);
  });

  // 2. Persist to localStorage with active quota management
  try {
    pruneStorageSnapshots();
    const serialized = JSON.stringify(members);
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
          return parsed;
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
 * System Database Dump & Restore Utilities - Full System Backup across all modules
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
  const customLogoUrl = localStorage.getItem('kca_portal_custom_logo') || localStorage.getItem('kca_custom_logo_data_url') || '';
  const portalTheme = localStorage.getItem('kca_portal_theme') || localStorage.getItem('theme') || '';
  const themeMode = localStorage.getItem('kca_theme_mode') || 'light';

  const totalRecordCount =
    membersData.length +
    financeTransactionsData.length +
    inventoryItemsData.length +
    classesData.length +
    participantsData.length +
    documentsData.length +
    lettersData.length +
    contactsData.length +
    auditLogsData.length;

  const backupPayload = {
    backupType: 'FULL_SYSTEM_DATABASE_BACKUP',
    organization: 'Kairali Cultural Association Fujairah (A NORKA Affiliated Organisation)',
    exportedAt: new Date().toISOString(),
    schemaVersion: '3.0',
    stats: {
      totalMembers: membersData.length,
      totalFinanceTransactions: financeTransactionsData.length,
      totalInventoryItems: inventoryItemsData.length,
      totalClasses: classesData.length,
      totalClassParticipants: participantsData.length,
      totalDocuments: documentsData.length,
      totalLetters: lettersData.length,
      totalContacts: contactsData.length,
      totalAuditLogs: auditLogsData.length,
      totalRecords: totalRecordCount,
    },
    tables: {
      members: membersData,
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
      themeMode: themeMode,
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

    if (Array.isArray(sourceTables.members)) {
      saveMembersToStorage(sourceTables.members);
      details['members'] = sourceTables.members.length;
      tablesCount++;
      recordsCount += sourceTables.members.length;
    }

    if (Array.isArray(sourceTables.adminAccounts)) {
      saveAdminAccounts(sourceTables.adminAccounts);
      details['adminAccounts'] = sourceTables.adminAccounts.length;
      tablesCount++;
    }

    if (Array.isArray(sourceTables.customFields)) {
      saveCustomFieldsToStorage(sourceTables.customFields);
      details['customFields'] = sourceTables.customFields.length;
      tablesCount++;
    }

    if (sourceTables.portalConfig) {
      savePortalConfig(sourceTables.portalConfig);
      tablesCount++;
    }

    if (Array.isArray(sourceTables.auditLogs)) {
      saveAuditLogs(sourceTables.auditLogs);
      details['auditLogs'] = sourceTables.auditLogs.length;
      tablesCount++;
      recordsCount += sourceTables.auditLogs.length;
    }

    restoreTable(['kca_fujairah_finance_transactions_v1'], sourceTables.financeTransactions);
    restoreTable(['kca_fujairah_finance_particulars_v1'], sourceTables.financialParticulars);
    restoreTable(['kca_fujairah_finance_unit_balances_v1'], sourceTables.unitCashBalances);
    restoreTable(['kca_fujairah_inventory_items_v1'], sourceTables.inventoryItems);
    restoreTable(['kca_fujairah_inventory_logs_v1'], sourceTables.inventoryLogs);
    restoreTable(['kca_cultural_classes_v1', 'kca_fujairah_classes_v1'], sourceTables.classes);
    restoreTable(['kca_class_participants_v1', 'kca_fujairah_participants_v1'], sourceTables.classParticipants);
    restoreTable(['kca_class_attendance_v1', 'kca_fujairah_attendance_v1'], sourceTables.classAttendance);
    restoreTable(['kca_fujairah_general_documents_v1'], sourceTables.generalDocuments);
    restoreTable(['kca_fujairah_letters_v1'], sourceTables.officialLetters);
    restoreTable(['kca_fujairah_contact_bank_v1'], sourceTables.contactBank);
    restoreTable(['kca_fujairah_units_v1'], sourceTables.units);
    restoreTable(['kca_fujairah_signatures_v1'], sourceTables.storedSignatures);

    if (sourceTables.letterSeriesConfig) {
      localStorage.setItem('kca_letter_series_config_v1', JSON.stringify(sourceTables.letterSeriesConfig));
      tablesCount++;
    }

    if (sourceTables.customLogoUrl) {
      localStorage.setItem('kca_portal_custom_logo', sourceTables.customLogoUrl);
      localStorage.setItem('kca_custom_logo_data_url', sourceTables.customLogoUrl);
      localStorage.setItem('kca_fujairah_custom_logo_v1', sourceTables.customLogoUrl);
      window.dispatchEvent(new CustomEvent('kca-custom-logo-changed', { detail: sourceTables.customLogoUrl }));
      tablesCount++;
    }

    if (sourceTables.portalTheme) {
      localStorage.setItem('kca_portal_theme', typeof sourceTables.portalTheme === 'string' ? sourceTables.portalTheme : JSON.stringify(sourceTables.portalTheme));
      localStorage.setItem('theme', typeof sourceTables.portalTheme === 'string' ? sourceTables.portalTheme : JSON.stringify(sourceTables.portalTheme));
      tablesCount++;
    }

    if (sourceTables.themeMode) {
      localStorage.setItem('kca_theme_mode', sourceTables.themeMode);
      if (sourceTables.themeMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
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