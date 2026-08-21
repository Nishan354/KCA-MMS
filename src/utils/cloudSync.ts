import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
}

const STORAGE_KEY_SUPABASE_CONFIG = 'kca_custom_supabase_config_v1';

// Default fallback endpoints
const DEFAULT_SUPABASE_URL = 'https://jvwetoapdaxuweannrgq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export function getSupabaseCredentials(): { url: string; anonKey: string; projectId: string; isConfigured: boolean } {
  let url = '';
  let anonKey = '';

  // 1. Check URL parameters for instant 1-click device pairing (?sync_url=...&sync_key=... or #sb=...)
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get('sb_url') || params.get('sync_url');
      const keyParam = params.get('sb_key') || params.get('sync_key');
      if (urlParam && keyParam) {
        url = decodeURIComponent(urlParam).trim();
        anonKey = decodeURIComponent(keyParam).trim();
        // Save to localStorage immediately so future visits stay configured
        localStorage.setItem(
          STORAGE_KEY_SUPABASE_CONFIG,
          JSON.stringify({ url, anonKey, updatedAt: new Date().toISOString() })
        );
        // Clean up URL without reloading
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  } catch {}

  // 2. Check LocalStorage
  if (!url || !anonKey) {
    try {
      const custom = localStorage.getItem(STORAGE_KEY_SUPABASE_CONFIG);
      if (custom) {
        const parsed = JSON.parse(custom);
        if (parsed.url && parsed.anonKey) {
          url = parsed.url.trim();
          anonKey = parsed.anonKey.trim();
        }
      }
    } catch {}
  }

  // 3. Check environment variables
  if (!url || !anonKey) {
    const metaEnv = (import.meta as any).env || {};
    url =
      metaEnv.VITE_SUPABASE_URL ||
      metaEnv.NEXT_PUBLIC_SUPABASE_URL ||
      metaEnv.NEXT_PUBLIC_KCA_MMS_DB_STORAGE_SUPABASE_URL ||
      DEFAULT_SUPABASE_URL;

    anonKey =
      metaEnv.VITE_SUPABASE_ANON_KEY ||
      metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      metaEnv.NEXT_PUBLIC_KCA_MMS_DB_STORAGE_SUPABASE_PUBLISHABLE_KEY ||
      DEFAULT_SUPABASE_ANON_KEY;
  }

  // Extract Supabase Project Reference (e.g. 'jvwetoapdaxuweannrgq')
  let projectId = 'jvwetoapdaxuweannrgq';
  try {
    const clean = url.replace(/^https?:\/\//, '').split('.')[0];
    if (clean && clean.length > 3) {
      projectId = clean;
    }
  } catch {}

  const isConfigured = Boolean(anonKey && !anonKey.includes('placeholder'));

  return { url, anonKey, projectId, isConfigured };
}

/**
 * Saves Supabase credentials locally AND propagates to the backend server
 * so all other devices and users automatically inherit the same database config!
 */
export async function saveCustomSupabaseCredentials(url: string, anonKey: string): Promise<boolean> {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  // 1. Save to this device's localStorage
  try {
    localStorage.setItem(
      STORAGE_KEY_SUPABASE_CONFIG,
      JSON.stringify({ url: cleanUrl, anonKey: cleanKey, updatedAt: new Date().toISOString() })
    );
  } catch (e) {
    console.error('Failed to save Supabase config to local storage:', e);
  }

  // 2. Re-initialize active client on this device
  reinitializeSupabaseClient();

  // 3. Post to backend server so other devices get it automatically
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

function initClient(): SupabaseClient {
  const { url, anonKey } = getSupabaseCredentials();
  return createClient(url, anonKey, {
    auth: { persistSession: false },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

activeClient = initClient();

export function getSupabaseClient(): SupabaseClient {
  if (!activeClient) {
    activeClient = initClient();
  }
  return activeClient;
}

export function reinitializeSupabaseClient(): SupabaseClient {
  activeClient = initClient();
  return activeClient;
}

/**
 * Auto-fetch global server configuration on launch so new devices automatically connect
 */
export async function syncCredentialsFromServer(): Promise<boolean> {
  try {
    const res = await fetch('/api/config/supabase');
    if (res.ok) {
      const data = await res.json();
      if (data && data.url && data.anonKey && data.isConfigured) {
        const local = getSupabaseCredentials();
        if (!local.isConfigured || local.anonKey !== data.anonKey || local.url !== data.url) {
          localStorage.setItem(
            STORAGE_KEY_SUPABASE_CONFIG,
            JSON.stringify({ url: data.url, anonKey: data.anonKey, updatedAt: new Date().toISOString() })
          );
          reinitializeSupabaseClient();
          updateStatus({ isGloballyConfigured: true });
          return true;
        }
      }
    }
  } catch (e) {
    // offline or static mode
  }
  return false;
}

// In-memory master state cache
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

const APP_STATE_TABLE = 'app_state';
let detectedIdType: 'string' | 'integer' = 'string';

function getRowId() {
  return detectedIdType === 'integer' ? 1 : 'kca_main';
}

function extractStateFromRow(row: any): KcaCloudState | null {
  if (!row) return null;

  if (typeof row.id === 'number') {
    detectedIdType = 'integer';
  }

  // Case 1: Payload column has full JSON bundle
  if (row.payload && typeof row.payload === 'object') {
    const p = row.payload;
    return {
      version: Number(row.version || p.version || 1),
      lastUpdated: row.updated_at || p.lastUpdated || new Date().toISOString(),
      updatedBy: row.updated_by || p.updatedBy || 'Remote User',
      members: Array.isArray(p.members) ? p.members : Array.isArray(row.members) ? row.members : [],
      financeTransactions: Array.isArray(p.financeTransactions) ? p.financeTransactions : Array.isArray(row.financeTransactions) ? row.financeTransactions : [],
      inventoryItems: Array.isArray(p.inventoryItems) ? p.inventoryItems : Array.isArray(row.inventoryItems) ? row.inventoryItems : [],
      inventoryLogs: Array.isArray(p.inventoryLogs) ? p.inventoryLogs : Array.isArray(row.inventoryLogs) ? row.inventoryLogs : [],
      classes: Array.isArray(p.classes) ? p.classes : Array.isArray(row.classes) ? row.classes : [],
      classParticipants: Array.isArray(p.classParticipants) ? p.classParticipants : Array.isArray(row.classParticipants) ? row.classParticipants : [],
      classAttendance: Array.isArray(p.classAttendance) ? p.classAttendance : Array.isArray(row.classAttendance) ? row.classAttendance : [],
      adminAccounts: Array.isArray(p.adminAccounts) ? p.adminAccounts : Array.isArray(row.adminAccounts) ? row.adminAccounts : [],
      auditLogs: Array.isArray(p.auditLogs) ? p.auditLogs : Array.isArray(row.auditLogs) ? row.auditLogs : [],
      units: Array.isArray(p.units) ? p.units : Array.isArray(row.units) ? row.units : INITIAL_UNITS,
      customFields: Array.isArray(p.customFields) ? p.customFields : Array.isArray(row.customFields) ? row.customFields : INITIAL_CUSTOM_FIELDS,
      customLogoUrl: p.customLogoUrl || row.customLogoUrl || undefined,
    };
  }

  // Case 2: Direct columns on row
  if (Array.isArray(row.members) || row.version) {
    return {
      version: Number(row.version || 1),
      lastUpdated: row.updated_at || new Date().toISOString(),
      updatedBy: row.updated_by || 'Remote User',
      members: Array.isArray(row.members) ? row.members : [],
      financeTransactions: Array.isArray(row.financeTransactions) ? row.financeTransactions : [],
      inventoryItems: Array.isArray(row.inventoryItems) ? row.inventoryItems : [],
      inventoryLogs: Array.isArray(row.inventoryLogs) ? row.inventoryLogs : [],
      classes: Array.isArray(row.classes) ? row.classes : [],
      classParticipants: Array.isArray(row.classParticipants) ? row.classParticipants : [],
      classAttendance: Array.isArray(row.classAttendance) ? row.classAttendance : [],
      adminAccounts: Array.isArray(row.adminAccounts) ? row.adminAccounts : [],
      auditLogs: Array.isArray(row.auditLogs) ? row.auditLogs : [],
      units: Array.isArray(row.units) ? row.units : INITIAL_UNITS,
      customFields: Array.isArray(row.customFields) ? row.customFields : INITIAL_CUSTOM_FIELDS,
      customLogoUrl: row.customLogoUrl || undefined,
    };
  }

  return null;
}

/**
 * Fetch full live state from Supabase (with Server API fallback)
 */
export async function fetchCloudState(): Promise<KcaCloudState | null> {
  updateStatus({ isSyncing: true, error: null });
  const client = getSupabaseClient();

  try {
    // 1. Direct Supabase Query
    const { data, error } = await client
      .from(APP_STATE_TABLE)
      .select('*')
      .order('version', { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      const parsed = extractStateFromRow(data[0]);
      if (parsed) {
        cachedCloudState = { ...cachedCloudState, ...parsed };
        updateStatus({
          isConnected: true,
          isSyncing: false,
          lastSyncTime: new Date(),
          version: parsed.version,
          error: null,
          tableExists: true,
          syncedEntitiesCount: {
            members: parsed.members?.length || 0,
            finance: parsed.financeTransactions?.length || 0,
            inventory: parsed.inventoryItems?.length || 0,
            classes: parsed.classes?.length || 0,
          },
        });
        return parsed;
      }
    }

    if (error) {
      // 2. Fallback to Server Proxy Sync
      try {
        const serverRes = await fetch('/api/sync/state');
        if (serverRes.ok) {
          const sJson = await serverRes.json();
          if (sJson && sJson.data) {
            const parsedServer = extractStateFromRow(sJson.data);
            if (parsedServer) {
              cachedCloudState = { ...cachedCloudState, ...parsedServer };
              updateStatus({
                isConnected: true,
                isSyncing: false,
                lastSyncTime: new Date(),
                version: parsedServer.version,
                error: null,
                tableExists: true,
              });
              return parsedServer;
            }
          }
        }
      } catch {}

      const isMissingTable =
        error.code === '42P01' ||
        error.message.toLowerCase().includes('does not exist') ||
        error.message.toLowerCase().includes('relation');

      updateStatus({
        isSyncing: false,
        isConnected: false,
        error: error.message,
        errorCode: error.code,
        tableExists: !isMissingTable,
      });
      return null;
    }

    updateStatus({
      isConnected: true,
      isSyncing: false,
      lastSyncTime: new Date(),
      error: null,
      tableExists: true,
    });
    return null;
  } catch (err: any) {
    updateStatus({
      isSyncing: false,
      isConnected: false,
      error: err?.message || 'Network connection failed',
      tableExists: false,
    });
    return null;
  }
}

/**
 * Lightweight check for latest version in Supabase / Server
 */
export async function fetchCloudVersion(): Promise<{ version: number; lastUpdated: string } | null> {
  const client = getSupabaseClient();
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

    // Fallback: check server API
    const sRes = await fetch('/api/sync/version');
    if (sRes.ok) {
      const sData = await sRes.json();
      if (sData && sData.version) {
        return { version: Number(sData.version), lastUpdated: sData.updatedAt || new Date().toISOString() };
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Push entity data to Supabase and fallback to Server API
 */
export async function pushCloudEntity(
  entity: string,
  data: any,
  user: string = 'KCA User'
): Promise<boolean> {
  updateStatus({ isSyncing: true, error: null });
  const client = getSupabaseClient();

  // Merge the entity data into local cache
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
  else if (entity === 'all' && typeof data === 'object') {
    cachedCloudState = { ...cachedCloudState, ...data };
  }

  const nextVersion = (cachedCloudState.version || currentSyncStatus.version || 1) + 1;
  cachedCloudState.version = nextVersion;
  cachedCloudState.lastUpdated = new Date().toISOString();
  cachedCloudState.updatedBy = user;

  const payloadBundle = {
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
  };

  const idToUse = getRowId();

  try {
    let { error } = await client.from(APP_STATE_TABLE).upsert(
      {
        id: idToUse,
        entity: entity,
        payload: payloadBundle,
        version: nextVersion,
        updated_by: user,
        updated_at: cachedCloudState.lastUpdated,
      },
      { onConflict: 'id' }
    );

    // If string ID failed because table has integer ID type, retry with numeric 1
    if (error && (error.code === '22P02' || error.message.includes('integer'))) {
      detectedIdType = 'integer';
      const retryRes = await client.from(APP_STATE_TABLE).upsert(
        {
          id: 1,
          entity: entity,
          payload: payloadBundle,
          version: nextVersion,
          updated_by: user,
          updated_at: cachedCloudState.lastUpdated,
        },
        { onConflict: 'id' }
      );
      error = retryRes.error;
    }

    // If client direct push failed, try through backend server endpoint
    if (error) {
      try {
        const sRes = await fetch('/api/sync/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: 'kca_main',
            entity,
            payload: payloadBundle,
            version: nextVersion,
            updated_by: user,
          }),
        });
        if (sRes.ok) {
          updateStatus({
            isConnected: true,
            isSyncing: false,
            lastSyncTime: new Date(),
            version: nextVersion,
            error: null,
            tableExists: true,
          });
          return true;
        }
      } catch {}
    }

    if (error) {
      const isMissingTable =
        error.code === '42P01' || error.message.toLowerCase().includes('does not exist');

      updateStatus({
        isSyncing: false,
        isConnected: false,
        error: error.message,
        errorCode: error.code,
        tableExists: !isMissingTable,
      });
      return false;
    }

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
  } catch (err: any) {
    updateStatus({
      isSyncing: false,
      isConnected: false,
      error: err?.message || 'Push failed',
    });
    return false;
  }
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
  try {
    const client = url && anonKey ? createClient(url, anonKey, { auth: { persistSession: false } }) : getSupabaseClient();
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
          message: `Connected to Supabase project, but table "${APP_STATE_TABLE}" is not yet created. Run the updated SQL script in your Supabase SQL Editor.`,
        };
      }

      const isRlsError =
        error.code === '42501' || error.message.toLowerCase().includes('row-level security');

      if (isRlsError) {
        return {
          success: false,
          tableExists: true,
          sqlNeeded: true,
          errorCode: error.code,
          message: `Table "${APP_STATE_TABLE}" exists, but Row Level Security (RLS) is blocking access. Run the SQL script to grant permissions.`,
        };
      }

      return {
        success: false,
        tableExists: false,
        sqlNeeded: false,
        errorCode: error.code,
        message: `Supabase Error: ${error.message} (Code: ${error.code || 'N/A'})`,
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

/**
 * Returns a 1-click shareable URL that automatically pairs any mobile or second device
 */
export function getDevicePairingUrl(): string {
  if (typeof window === 'undefined') return '';
  const creds = getSupabaseCredentials();
  const base = window.location.origin + window.location.pathname;
  return `${base}?sb_url=${encodeURIComponent(creds.url)}&sb_key=${encodeURIComponent(creds.anonKey)}`;
}

export function getSupabaseSqlSetupScript(): string {
  return `-- ====================================================================
-- KCA FUJAIRAH - REALTIME CLOUD SYNCHRONIZATION SETUP (MULTI-DEVICE)
-- Copy and run this script in Supabase Dashboard -> SQL Editor -> New query
-- ====================================================================

-- 1. Create table with TEXT id or adapt existing table
CREATE TABLE IF NOT EXISTS public.app_state (
  id TEXT PRIMARY KEY DEFAULT 'kca_main',
  entity TEXT DEFAULT 'all',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  version BIGINT DEFAULT 1,
  updated_by TEXT DEFAULT 'KCA Admin',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Convert existing integer/bigint 'id' column to TEXT if already created
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
  
  -- Add payload column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'app_state' 
    AND column_name = 'payload'
  ) THEN
    ALTER TABLE public.app_state ADD COLUMN payload JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  -- Add entity column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'app_state' 
    AND column_name = 'entity'
  ) THEN
    ALTER TABLE public.app_state ADD COLUMN entity TEXT DEFAULT 'all';
  END IF;

  -- Add version column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'app_state' 
    AND column_name = 'version'
  ) THEN
    ALTER TABLE public.app_state ADD COLUMN version BIGINT DEFAULT 1;
  END IF;

  -- Add updated_by column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'app_state' 
    AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE public.app_state ADD COLUMN updated_by TEXT DEFAULT 'KCA Admin';
  END IF;

  -- Add updated_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'app_state' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.app_state ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- 3. Grant full permissions to anonymous and authenticated users
GRANT ALL ON TABLE public.app_state TO anon;
GRANT ALL ON TABLE public.app_state TO authenticated;
GRANT ALL ON TABLE public.app_state TO service_role;

-- 4. Enable Row Level Security with permissive read/write policy
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to app_state" ON public.app_state;
CREATE POLICY "Allow all access to app_state" 
ON public.app_state 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- 5. Enable Supabase Realtime WebSocket broadcast
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

-- 6. Seed initial record safely
INSERT INTO public.app_state (id, entity, payload, version, updated_by, updated_at)
VALUES ('kca_main', 'all', '{}'::jsonb, 1, 'System Initializer', now())
ON CONFLICT (id) DO NOTHING;

-- Verification query
SELECT * FROM public.app_state;
`;
}

/**
 * Start Real-Time Synchronizer with Supabase Channels + Heartbeat Fallback
 */
export function startCloudSyncManager(onRemoteUpdate: (cloudState: KcaCloudState) => void): () => void {
  let isRunning = true;
  let lastKnownVersion = currentSyncStatus.version;
  let pollInterval: any = null;
  let channel: any = null;

  async function handleCloudStatePayload(state: KcaCloudState) {
    if (!isRunning || !state) return;
    if (state.version >= lastKnownVersion) {
      lastKnownVersion = state.version;
      cachedCloudState = { ...cachedCloudState, ...state };
      onRemoteUpdate(state);
    }
  }

  // 1. Initial State Fetch with Server Config Sync
  syncCredentialsFromServer().then(() => {
    fetchCloudState().then((state) => {
      if (state && isRunning) {
        lastKnownVersion = state.version;
        onRemoteUpdate(state);
      }
    });
  });

  // 2. Set up Supabase Realtime WebSocket Listener
  try {
    const client = getSupabaseClient();
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
                syncedEntitiesCount: {
                  members: parsed.members?.length || 0,
                  finance: parsed.financeTransactions?.length || 0,
                  inventory: parsed.inventoryItems?.length || 0,
                  classes: parsed.classes?.length || 0,
                },
              });
              handleCloudStatePayload(parsed);
            }
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          updateStatus({ isConnected: true, error: null, tableExists: true });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          updateStatus({ isConnected: false });
        }
      });
  } catch (err: any) {
    console.warn('[Supabase Realtime Channel Init Error]:', err);
    updateStatus({ isConnected: false });
  }

  // 3. Fallback Heartbeat Polling (every 5 seconds) for multi-device sync
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
  }, 5000);

  return () => {
    isRunning = false;
    if (pollInterval) clearInterval(pollInterval);
    if (channel) {
      try {
        const client = getSupabaseClient();
        client.removeChannel(channel);
      } catch {}
    }
  };
}
