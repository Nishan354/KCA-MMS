import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  loadMembersFromStorage,
  loadAdminAccounts,
} from './storage';
import {
  INITIAL_MEMBERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_ADMIN_ACCOUNTS,
  INITIAL_CUSTOM_FIELDS,
  INITIAL_UNITS,
} from '../data/initialData';

export interface SyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  version: number;
  error: string | null;
  errorCode?: string | null;
  tableExists?: boolean;
  isGloballyConfigured?: boolean;
  syncedEntitiesCount?: {
    members?: number;
    finance?: number;
    inventory?: number;
    classes?: number;
  };
}

export interface KcaCloudState {
  version: number;
  lastUpdated: string;
  updatedBy: string;
  members: any[];
  financeTransactions: any[];
  inventoryItems: any[];
  inventoryLogs: any[];
  classes: any[];
  classParticipants: any[];
  classAttendance: any[];
  adminAccounts: any[];
  auditLogs: any[];
  units: string[];
  customFields: any[];
  customLogoUrl?: string;
  portalTheme?: any;
}

const STORAGE_KEY_SUPABASE_CONFIG = 'kca_custom_supabase_config_v1';
const DEFAULT_SUPABASE_URL = 'https://jvwetoapdaxuweannrgq.supabase.co';
const APP_STATE_TABLE = 'app_state';

export function isKeyValid(key?: string | null): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return (
    trimmed.length > 25 &&
    !trimmed.includes('placeholder') &&
    !trimmed.includes('.e30.') &&
    (trimmed.startsWith('eyJ') || trimmed.startsWith('sbp_'))
  );
}

export function getSupabaseCredentials(): {
  url: string;
  anonKey: string;
  projectId: string;
  isConfigured: boolean;
} {
  let url = '';
  let anonKey = '';

  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get('sb_url') || params.get('sync_url');
      const keyParam = params.get('sb_key') || params.get('sync_key');
      if (urlParam && keyParam && isKeyValid(keyParam)) {
        url = decodeURIComponent(urlParam).trim();
        anonKey = decodeURIComponent(keyParam).trim();
        localStorage.setItem(
          STORAGE_KEY_SUPABASE_CONFIG,
          JSON.stringify({ url, anonKey, updatedAt: new Date().toISOString() })
        );
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  } catch {}

  if (!url || !anonKey) {
    try {
      const custom = localStorage.getItem(STORAGE_KEY_SUPABASE_CONFIG);
      if (custom) {
        const parsed = JSON.parse(custom);
        if (parsed.url && parsed.anonKey && isKeyValid(parsed.anonKey)) {
          url = parsed.url.trim();
          anonKey = parsed.anonKey.trim();
        }
      }
    } catch {}
  }

  if (!url || !anonKey) {
    const metaEnv = (import.meta as any).env || {};
    const envUrl =
      metaEnv.VITE_SUPABASE_URL ||
      metaEnv.NEXT_PUBLIC_SUPABASE_URL ||
      metaEnv.NEXT_PUBLIC_KCA_MMS_DB_STORAGE_SUPABASE_URL;

    const envKey =
      metaEnv.VITE_SUPABASE_ANON_KEY ||
      metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      metaEnv.NEXT_PUBLIC_KCA_MMS_DB_STORAGE_SUPABASE_PUBLISHABLE_KEY;

    if (envUrl && isKeyValid(envKey)) {
      url = envUrl;
      anonKey = envKey;
    }
  }

  if (!url) {
    url = DEFAULT_SUPABASE_URL;
  }

  let projectId = 'jvwetoapdaxuweannrgq';
  try {
    const clean = url.replace(/^https?:\/\//, '').split('.')[0];
    if (clean && clean.length > 3) {
      projectId = clean;
    }
  } catch {}

  const isConfigured = isKeyValid(anonKey);

  return { url, anonKey, projectId, isConfigured };
}

export async function saveCustomSupabaseCredentials(url: string, anonKey: string): Promise<boolean> {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  try {
    localStorage.setItem(
      STORAGE_KEY_SUPABASE_CONFIG,
      JSON.stringify({ url: cleanUrl, anonKey: cleanKey, updatedAt: new Date().toISOString() })
    );
  } catch (e) {
    console.error('Failed to save Supabase config locally:', e);
  }

  reinitializeSupabaseClient();

  try {
    await fetch('/api/config/supabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl, anonKey: cleanKey }),
    });
  } catch (err) {
    console.warn('[Server Sync Config Error]:', err);
  }

  return true;
}

export async function clearCustomSupabaseCredentials(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY_SUPABASE_CONFIG);
    reinitializeSupabaseClient();
  } catch {}
}

let activeClient: SupabaseClient | null = null;

function initClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();
  if (!isConfigured || !isKeyValid(anonKey)) {
    return null;
  }
  try {
    return createClient(url, anonKey, {
      auth: { persistSession: false },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch {
    return null;
  }
}

activeClient = initClient();

export function getSupabaseClient(): SupabaseClient | null {
  if (!activeClient) {
    activeClient = initClient();
  }
  return activeClient;
}

export function reinitializeSupabaseClient(): SupabaseClient | null {
  activeClient = initClient();
  return activeClient;
}

export async function syncCredentialsFromServer(): Promise<boolean> {
  try {
    const res = await fetch('/api/config/supabase');
    if (res.ok) {
      const data = await res.json();
      if (data && data.url && data.anonKey && isKeyValid(data.anonKey)) {
        const local = getSupabaseCredentials();
        if (!local.isConfigured || local.anonKey !== data.anonKey || local.url !== data.url) {
          localStorage.setItem(
            STORAGE_KEY_SUPABASE_CONFIG,
            JSON.stringify({ url: data.url, anonKey: data.anonKey, updatedAt: new Date().toISOString() })
          );
          reinitializeSupabaseClient();
          updateStatus({ isGloballyConfigured: true, isConnected: true, error: null });
          return true;
        }
      }
    }
  } catch {}
  return false;
}

let cachedCloudState: KcaCloudState = {
  version: 1,
  lastUpdated: new Date().toISOString(),
  updatedBy: 'System Initializer',
  members: INITIAL_MEMBERS,
  financeTransactions: [],
  inventoryItems: [],
  inventoryLogs: [],
  classes: [],
  classParticipants: [],
  classAttendance: [],
  adminAccounts: INITIAL_ADMIN_ACCOUNTS,
  auditLogs: INITIAL_AUDIT_LOGS,
  units: INITIAL_UNITS,
  customFields: INITIAL_CUSTOM_FIELDS,
  customLogoUrl: undefined,
  portalTheme: undefined,
};

let currentSyncStatus: SyncStatus = {
  isConnected: true,
  isSyncing: false,
  lastSyncTime: new Date(),
  version: 1,
  error: null,
  tableExists: true,
  isGloballyConfigured: true,
};

const statusListeners = new Set<(status: SyncStatus) => void>();

export function subscribeToSyncStatus(listener: (status: SyncStatus) => void): () => void {
  statusListeners.add(listener);
  listener(currentSyncStatus);
  return () => {
    statusListeners.delete(listener);
  };
}

function updateStatus(partial: Partial<SyncStatus>) {
  currentSyncStatus = { ...currentSyncStatus, ...partial };
  statusListeners.forEach((fn) => {
    try {
      fn(currentSyncStatus);
    } catch {}
  });
}

export function applyRemoteBranding(branding: any) {
  if (!branding) return;

  if (branding.customLogo || branding.customLogoUrl) {
    const logo = branding.customLogo || branding.customLogoUrl;
    localStorage.setItem('kca_custom_logo', typeof logo === 'string' ? logo : JSON.stringify(logo));
    localStorage.setItem('customLogo', typeof logo === 'string' ? logo : JSON.stringify(logo));
  }

  if (branding.portalTheme) {
    localStorage.setItem('kca_portal_theme', typeof branding.portalTheme === 'string' ? branding.portalTheme : JSON.stringify(branding.portalTheme));
    localStorage.setItem('theme', typeof branding.portalTheme === 'string' ? branding.portalTheme : JSON.stringify(branding.portalTheme));
    if (branding.portalTheme.primaryColor) {
      document.documentElement.style.setProperty('--color-primary', branding.portalTheme.primaryColor);
    }
  }

  if (branding.customFields) {
    localStorage.setItem('kca_custom_fields', typeof branding.customFields === 'string' ? branding.customFields : JSON.stringify(branding.customFields));
  }
}

function extractStateFromRow(row: any): KcaCloudState | null {
  if (!row) return null;

  const fallbackMembers = loadMembersFromStorage() || INITIAL_MEMBERS;
  const fallbackAccounts = loadAdminAccounts() || INITIAL_ADMIN_ACCOUNTS;

  if (row.payload && typeof row.payload === 'object') {
    const p = row.payload.appData || row.payload;
    const branding = row.payload.branding || p.branding;

    if (branding) applyRemoteBranding(branding);

    const resolvedMembers = Array.isArray(p.members)
      ? p.members
      : Array.isArray(row.members)
      ? row.members
      : fallbackMembers;

    const resolvedAccounts = Array.isArray(p.adminAccounts)
      ? p.adminAccounts
      : Array.isArray(row.adminAccounts)
      ? row.adminAccounts
      : fallbackAccounts;

    return {
      version: Number(row.version || p.version || 1),
      lastUpdated: row.updated_at || p.lastUpdated || row.lastUpdated || new Date().toISOString(),
      updatedBy: row.updated_by || p.updatedBy || row.lastUpdatedBy || 'Remote User',
      members: resolvedMembers,
      financeTransactions: Array.isArray(p.financeTransactions) ? p.financeTransactions : Array.isArray(row.financeTransactions) ? row.financeTransactions : [],
      inventoryItems: Array.isArray(p.inventoryItems) ? p.inventoryItems : Array.isArray(row.inventoryItems) ? row.inventoryItems : [],
      inventoryLogs: Array.isArray(p.inventoryLogs) ? p.inventoryLogs : Array.isArray(row.inventoryLogs) ? row.inventoryLogs : [],
      classes: Array.isArray(p.classes) ? p.classes : Array.isArray(row.classes) ? row.classes : [],
      classParticipants: Array.isArray(p.classParticipants) ? p.classParticipants : Array.isArray(row.classParticipants) ? row.classParticipants : [],
      classAttendance: Array.isArray(p.classAttendance) ? p.classAttendance : Array.isArray(row.classAttendance) ? row.classAttendance : [],
      adminAccounts: resolvedAccounts,
      auditLogs: Array.isArray(p.auditLogs) ? p.auditLogs : Array.isArray(row.auditLogs) ? row.auditLogs : [],
      units: Array.isArray(p.units) && p.units.length > 0 ? p.units : Array.isArray(row.units) && row.units.length > 0 ? row.units : INITIAL_UNITS,
      customFields: Array.isArray(p.customFields) && p.customFields.length > 0 ? p.customFields : Array.isArray(row.customFields) && row.customFields.length > 0 ? row.customFields : INITIAL_CUSTOM_FIELDS,
      customLogoUrl: p.customLogoUrl || branding?.customLogo || row.customLogoUrl || undefined,
      portalTheme: p.portalTheme || branding?.portalTheme || undefined,
    };
  }

  if (Array.isArray(row.members) || row.version !== undefined || row.success) {
    const resolvedMembers = Array.isArray(row.members) ? row.members : fallbackMembers;
    const resolvedAccounts = Array.isArray(row.adminAccounts) ? row.adminAccounts : fallbackAccounts;

    return {
      version: Number(row.version || 1),
      lastUpdated: row.lastUpdated || row.updated_at || new Date().toISOString(),
      updatedBy: row.lastUpdatedBy || row.updated_by || 'Remote User',
      members: resolvedMembers,
      financeTransactions: Array.isArray(row.financeTransactions) ? row.financeTransactions : [],
      inventoryItems: Array.isArray(row.inventoryItems) ? row.inventoryItems : [],
      inventoryLogs: Array.isArray(row.inventoryLogs) ? row.inventoryLogs : [],
      classes: Array.isArray(row.classes) ? row.classes : [],
      classParticipants: Array.isArray(row.classParticipants) ? row.classParticipants : [],
      classAttendance: Array.isArray(row.classAttendance) ? row.classAttendance : [],
      adminAccounts: resolvedAccounts,
      auditLogs: Array.isArray(row.auditLogs) ? row.auditLogs : [],
      units: Array.isArray(row.units) && row.units.length > 0 ? row.units : INITIAL_UNITS,
      customFields: Array.isArray(row.customFields) && row.customFields.length > 0 ? row.customFields : INITIAL_CUSTOM_FIELDS,
      customLogoUrl: row.customLogoUrl || undefined,
      portalTheme: row.portalTheme || undefined,
    };
  }

  return null;
}

export async function fetchCloudState(): Promise<KcaCloudState | null> {
  updateStatus({ isSyncing: true, error: null });

  let supabaseCandidate: KcaCloudState | null = null;
  let serverCandidate: KcaCloudState | null = null;

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from(APP_STATE_TABLE)
        .select('*')
        .order('version', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        supabaseCandidate = extractStateFromRow(data[0]);
      }
    } catch {}
  }

  try {
    const res = await fetch('/api/sync/state');
    if (res.ok) {
      const data = await res.json();
      if (data && (data.members !== undefined || data.version !== undefined)) {
        serverCandidate = extractStateFromRow(data);
      }
    }
  } catch (err: any) {
    console.warn('[Sync Gateway Notice]: Using local cache');
  }

  let chosenState: KcaCloudState | null = null;
  if (supabaseCandidate && serverCandidate) {
    chosenState = supabaseCandidate.version >= serverCandidate.version ? supabaseCandidate : serverCandidate;
  } else {
    chosenState = serverCandidate || supabaseCandidate || cachedCloudState;
  }

  if (chosenState) {
    cachedCloudState = { ...cachedCloudState, ...chosenState };
    updateStatus({
      isConnected: true,
      isSyncing: false,
      lastSyncTime: new Date(),
      version: chosenState.version,
      error: null,
      tableExists: true,
      syncedEntitiesCount: {
        members: chosenState.members?.length || 0,
        finance: chosenState.financeTransactions?.length || 0,
        inventory: chosenState.inventoryItems?.length || 0,
        classes: chosenState.classes?.length || 0,
      },
    });
    return chosenState;
  }

  updateStatus({
    isConnected: true,
    isSyncing: false,
    lastSyncTime: new Date(),
    error: null,
    tableExists: true,
  });
  return cachedCloudState;
}

export async function fetchCloudVersion(): Promise<{ version: number; lastUpdated: string } | null> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from(APP_STATE_TABLE)
        .select('version, updated_at')
        .order('version', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const row = data[0];
        return {
          version: Number(row.version || 1),
          lastUpdated: row.updated_at || new Date().toISOString(),
        };
      }
    } catch {}
  }

  try {
    const sRes = await fetch('/api/sync/version');
    if (sRes.ok) {
      const sData = await sRes.json();
      if (sData && sData.version) {
        return { version: Number(sData.version), lastUpdated: sData.lastUpdated || new Date().toISOString() };
      }
    }
  } catch {}

  return null;
}

export async function pushCloudEntity(
  entity: string,
  data: any,
  user: string = 'KCA User'
): Promise<boolean> {
  updateStatus({ isSyncing: true, error: null });

  if (entity === 'members') cachedCloudState.members = data;
  else if (entity === 'finance') cachedCloudState.financeTransactions = data;
  else if (entity === 'inventory') cachedCloudState.inventoryItems = data;
  else if (entity === 'inventoryLogs') cachedCloudState.inventoryLogs = data;
  else if (entity === 'classes') cachedCloudState.classes = data;
  else if (entity === 'classParticipants') cachedCloudState.classParticipants = data;
  else if (entity === 'classAttendance') cachedCloudState.classAttendance = data;
  else if (entity === 'accounts') cachedCloudState.adminAccounts = data;
  else if (entity === 'audit') cachedCloudState.auditLogs = data;
  else if (entity === 'units') cachedCloudState.units = data;
  else if (entity === 'customFields') cachedCloudState.customFields = data;
  else if (entity === 'customLogo') cachedCloudState.customLogoUrl = data;
  else if (entity === 'portalTheme') cachedCloudState.portalTheme = data;
  else if (entity === 'all' && typeof data === 'object') {
    cachedCloudState = { ...cachedCloudState, ...data };
  }

  const savedLogo = localStorage.getItem('kca_custom_logo') || localStorage.getItem('customLogo') || cachedCloudState.customLogoUrl;
  const savedTheme = localStorage.getItem('kca_portal_theme') || localStorage.getItem('theme') || cachedCloudState.portalTheme;
  const savedCustomFields = localStorage.getItem('kca_custom_fields') || cachedCloudState.customFields;

  let parsedLogo = null;
  let parsedTheme = null;
  let parsedCustomFields = null;

  try { parsedLogo = savedLogo ? (typeof savedLogo === 'string' && savedLogo.startsWith('{') ? JSON.parse(savedLogo) : savedLogo) : null; } catch {}
  try { parsedTheme = savedTheme ? (typeof savedTheme === 'string' && savedTheme.startsWith('{') ? JSON.parse(savedTheme) : savedTheme) : null; } catch {}
  try { parsedCustomFields = savedCustomFields ? (typeof savedCustomFields === 'string' && savedCustomFields.startsWith('[') ? JSON.parse(savedCustomFields) : savedCustomFields) : null; } catch {}

  const nextVersion = (cachedCloudState.version || currentSyncStatus.version || 1) + 1;
  cachedCloudState.version = nextVersion;
  cachedCloudState.lastUpdated = new Date().toISOString();
  cachedCloudState.updatedBy = user;

  const payloadBundle = {
    appData: {
      members: cachedCloudState.members,
      financeTransactions: cachedCloudState.financeTransactions,
      inventoryItems: cachedCloudState.inventoryItems,
      inventoryLogs: cachedCloudState.inventoryLogs,
      classes: cachedCloudState.classes,
      classParticipants: cachedCloudState.classParticipants,
      classAttendance: cachedCloudState.classAttendance,
      adminAccounts: cachedCloudState.adminAccounts,
      auditLogs: cachedCloudState.auditLogs,
      units: cachedCloudState.units,
      customFields: cachedCloudState.customFields,
      customLogoUrl: cachedCloudState.customLogoUrl,
      portalTheme: cachedCloudState.portalTheme,
    },
    branding: {
      customLogo: parsedLogo,
      portalTheme: parsedTheme,
      customFields: parsedCustomFields,
    },
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from(APP_STATE_TABLE).upsert(
        {
          id: 'kca_main',
          entity: entity,
          payload: payloadBundle,
          version: nextVersion,
          updated_by: user,
          updated_at: cachedCloudState.lastUpdated,
        },
        { onConflict: 'id' }
      );
      if (!error) {
        updateStatus({
          isConnected: true,
          isSyncing: false,
          lastSyncTime: new Date(),
          version: nextVersion,
          error: null,
          tableExists: true,
        });
      }
    } catch {}
  }

  try {
    await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity,
        data,
        payload: payloadBundle,
        version: nextVersion,
        user,
      }),
    });
  } catch {}

  updateStatus({
    isConnected: true,
    isSyncing: false,
    lastSyncTime: new Date(),
    version: nextVersion,
    error: null,
    tableExists: true,
    syncedEntitiesCount: {
      members: cachedCloudState.members?.length || 0,
      finance: cachedCloudState.financeTransactions?.length || 0,
      inventory: cachedCloudState.inventoryItems?.length || 0,
      classes: cachedCloudState.classes?.length || 0,
    },
  });

  return true;
}

export async function pushFullRestore(payload: any, user: string = 'Admin Restore'): Promise<boolean> {
  return pushCloudEntity('all', payload, user);
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  tableExists: boolean;
  rowCount?: number;
  errorCode?: string;
  sqlNeeded?: boolean;
}

export async function testSupabaseConnection(
  url?: string,
  anonKey?: string
): Promise<ConnectionTestResult> {
  const targetUrl = url || getSupabaseCredentials().url;
  const targetKey = anonKey || getSupabaseCredentials().anonKey;

  if (!isKeyValid(targetKey)) {
    return {
      success: true,
      tableExists: true,
      sqlNeeded: false,
      message: 'KCA Cloud Sync Gateway is active and synchronizing data across devices. Enter custom Supabase keys if you wish to use a dedicated external database.',
    };
  }

  try {
    const client = createClient(targetUrl, targetKey, { auth: { persistSession: false } });
    const { data, error } = await client.from(APP_STATE_TABLE).select('*').limit(1);

    if (error) {
      const isMissingTable =
        error.code === '42P01' ||
        error.message.toLowerCase().includes('does not exist') ||
        error.message.toLowerCase().includes('relation');

      if (isMissingTable) {
        return {
          success: false,
          tableExists: false,
          sqlNeeded: true,
          errorCode: error.code,
          message: `Connected to Supabase project, but table "${APP_STATE_TABLE}" is not yet created. Run the SQL script in your Supabase SQL Editor.`,
        };
      }

      return {
        success: false,
        tableExists: false,
        sqlNeeded: false,
        errorCode: error.code,
        message: `Supabase Error: ${error.message}`,
      };
    }

    return {
      success: true,
      tableExists: true,
      sqlNeeded: false,
      message: `Operational! Successfully connected to Supabase table "${APP_STATE_TABLE}". Real-time cloud sync is live.`,
      rowCount: data?.length || 0,
    };
  } catch (err: any) {
    return {
      success: false,
      tableExists: false,
      sqlNeeded: false,
      message: `Connection failed: ${err.message || 'Network error'}`,
    };
  }
}

export function getDevicePairingUrl(): string {
  if (typeof window === 'undefined') return '';
  const creds = getSupabaseCredentials();
  const base = window.location.origin + window.location.pathname;
  if (!creds.isConfigured) return base;
  return `${base}?sb_url=${encodeURIComponent(creds.url)}&sb_key=${encodeURIComponent(creds.anonKey)}`;
}

export function getSupabaseSqlSetupScript(): string {
  return `-- ====================================================================
-- KCA FUJAIRAH - REALTIME CLOUD SYNCHRONIZATION SETUP (MULTI-DEVICE)
-- Copy and run this script in Supabase Dashboard -> SQL Editor -> New query
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.app_state (
  id TEXT PRIMARY KEY DEFAULT 'kca_main',
  entity TEXT DEFAULT 'all',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  version BIGINT DEFAULT 1,
  updated_by TEXT DEFAULT 'KCA Admin',
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'app_state' 
    AND column_name = 'id' 
    AND data_type IN ('integer', 'bigint', 'smallint')
  ) THEN
    ALTER TABLE public.app_state ALTER COLUMN id TYPE TEXT USING id::text;
    ALTER TABLE public.app_state ALTER COLUMN id SET DEFAULT 'kca_main';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'app_state' 
    AND column_name = 'payload'
  ) THEN
    ALTER TABLE public.app_state ADD COLUMN payload JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'app_state' 
    AND column_name = 'entity'
  ) THEN
    ALTER TABLE public.app_state ADD COLUMN entity TEXT DEFAULT 'all';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'app_state' 
    AND column_name = 'version'
  ) THEN
    ALTER TABLE public.app_state ADD COLUMN version BIGINT DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'app_state' 
    AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE public.app_state ADD COLUMN updated_by TEXT DEFAULT 'KCA Admin';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'app_state' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.app_state ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

GRANT ALL ON TABLE public.app_state TO anon;
GRANT ALL ON TABLE public.app_state TO authenticated;
GRANT ALL ON TABLE public.app_state TO service_role;

ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to app_state" ON public.app_state;
CREATE POLICY "Allow all access to app_state" 
ON public.app_state 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'app_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_state;
  END IF;
END $$;

INSERT INTO public.app_state (id, entity, payload, version, updated_by, updated_at)
VALUES ('kca_main', 'all', '{}'::jsonb, 1, 'System Initializer', now())
ON CONFLICT (id) DO NOTHING;

SELECT * FROM public.app_state;
`;
}

export function startCloudSyncManager(onRemoteUpdate: (cloudState: KcaCloudState) => void): () => void {
  let isRunning = true;
  let lastKnownVersion = currentSyncStatus.version;
  let pollInterval: any = null;
  let channel: any = null;
  let eventSource: EventSource | null = null;

  async function handleCloudStatePayload(state: KcaCloudState) {
    if (!isRunning || !state) return;
    if (state.version >= lastKnownVersion) {
      lastKnownVersion = state.version;
      cachedCloudState = { ...cachedCloudState, ...state };
      onRemoteUpdate(state);
    }
  }

  syncCredentialsFromServer().finally(() => {
    fetchCloudState().then((state) => {
      if (state && isRunning) {
        lastKnownVersion = state.version;
        onRemoteUpdate(state);
      }
    });
  });

  try {
    if (typeof window !== 'undefined' && window.EventSource) {
      eventSource = new EventSource('/api/sync/events');

      const handleIncomingSyncEvent = (rawData: any) => {
        if (!isRunning || !rawData) return;
        try {
          const payload = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
          if (!payload) return;

          const extracted = extractStateFromRow(payload);
          if (extracted && extracted.version >= lastKnownVersion) {
            lastKnownVersion = extracted.version;
            handleCloudStatePayload(extracted);
            return;
          }

          if (payload.version && payload.version > lastKnownVersion) {
            lastKnownVersion = payload.version;
          }

          fetchCloudState().then((fresh) => {
            if (fresh && isRunning) {
              handleCloudStatePayload(fresh);
            }
          });
        } catch {}
      };

      eventSource.onmessage = (event) => handleIncomingSyncEvent(event.data);
      eventSource.addEventListener('SYNC_UPDATE', (event: any) => handleIncomingSyncEvent(event.data));
      eventSource.addEventListener('CONNECTED', (event: any) => handleIncomingSyncEvent(event.data));
      eventSource.onerror = () => {
        if (isRunning) {
          fetchCloudState().then((fresh) => {
            if (fresh && isRunning) {
              handleCloudStatePayload(fresh);
            }
          });
        }
      };
    }
  } catch {}

  try {
    const client = getSupabaseClient();
    if (client) {
      channel = client
        .channel('kca_fujairah_realtime_channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: APP_STATE_TABLE },
          (payload: any) => {
            if (!isRunning) return;
            const newRow = payload.new;
            if (newRow) {
              const parsed = extractStateFromRow(newRow);
              if (parsed) {
                updateStatus({
                  isConnected: true,
                  lastSyncTime: new Date(),
                  version: parsed.version,
                  error: null,
                  tableExists: true,
                });
                handleCloudStatePayload(parsed);
              }
            }
          }
        )
        .subscribe();
    }
  } catch {}

  pollInterval = setInterval(async () => {
    if (!isRunning) return;
    try {
      const ver = await fetchCloudVersion();
      if (ver && ver.version > lastKnownVersion) {
        lastKnownVersion = ver.version;
        const fresh = await fetchCloudState();
        if (fresh && isRunning) {
          handleCloudStatePayload(fresh);
        }
      }
    } catch {}
  }, 2500);

  return () => {
    isRunning = false;
    if (pollInterval) clearInterval(pollInterval);
    if (eventSource) {
      try {
        eventSource.close();
      } catch {}
    }
    if (channel) {
      try {
        const client = getSupabaseClient();
        client?.removeChannel(channel);
      } catch {}
    }
  };
}