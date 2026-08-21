// --- ENHANCED SESSION & ADMIN STORAGE UTILITIES ---

/**
 * Load admin accounts with fallback and ensure permissions object exists
 */
export function loadAdminAccounts(): AdminAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_ACCOUNTS);
    const parsed = raw ? JSON.parse(raw) : INITIAL_ADMIN_ACCOUNTS;
    const accounts = Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ADMIN_ACCOUNTS;

    // Normalize accounts to ensure permissions exist
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
 * Enhanced active session loader that auto-attaches permission flags
 */
export function loadActiveUserSession(): UserSession | null {
  try {
    const sessionRaw = sessionStorage.getItem(STORAGE_KEY_USER_SESSION) || localStorage.getItem(STORAGE_KEY_USER_SESSION);
    if (!sessionRaw) return null;

    const session: UserSession = JSON.parse(sessionRaw);

    // Auto-grant full privileges to Super Admin and Admin roles
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

// --- SYSTEM DATABASE DUMP & RESTORE UTILITIES ---

/**
 * Export complete system state (Members, Admin Accounts, Portal Branding, Custom Fields, Audit Logs)
 */
export function exportFullDatabaseSnapshot(): string {
  const backupPayload = {
    organization: 'Kairali Cultural Association Fujairah',
    exportedAt: new Date().toISOString(),
    version: '2.0',
    members: loadMembersFromStorage() || [],
    adminAccounts: loadAdminAccounts(),
    customFields: loadCustomFieldsFromStorage(),
    portalConfig: loadPortalConfig(),
    auditLogs: loadAuditLogs(),
  };

  return JSON.stringify(backupPayload, null, 2);
}

/**
 * Restore complete system database snapshot from JSON string
 */
export function importFullDatabaseSnapshot(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);

    if (Array.isArray(data.members)) {
      saveMembersToStorage(data.members);
    }
    if (Array.isArray(data.adminAccounts)) {
      saveAdminAccounts(data.adminAccounts);
    }
    if (Array.isArray(data.customFields)) {
      saveCustomFieldsToStorage(data.customFields);
    }
    if (data.portalConfig) {
      savePortalConfig(data.portalConfig);
    }
    if (Array.isArray(data.auditLogs)) {
      saveAuditLogs(data.auditLogs);
    }

    return true;
  } catch (error) {
    console.error('Failed to restore database snapshot:', error);
    return false;
  }
}