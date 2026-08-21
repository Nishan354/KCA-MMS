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

// Default Supabase project endpoints with fallback support
const DEFAULT_SUPABASE_URL = 'https://jvwetoapdaxuweannrgq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  try {
    const custom = localStorage.getItem(STORAGE_KEY_SUPABASE_CONFIG);
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed.url && parsed.anonKey) {
        return { url: parsed.url.trim(), anonKey: parsed.anonKey.trim() };
      }
    }
  } catch {}

  const metaEnv = (import.meta as any).env || {};
  const url =
    metaEnv.VITE_SUPABASE_URL ||
    metaEnv.NEXT_PUBLIC_SUPABASE_URL ||
    metaEnv.NEXT_PUBLIC_KCA_MMS_DB_STORAGE_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;

  const anonKey =
    metaEnv.VITE_SUPABASE_ANON_KEY ||
    metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    metaEnv.NEXT_PUBLIC_KCA_MMS_DB_STORAGE_SUPABASE_PUBLISHABLE_KEY ||
    DEFAULT_SUPABASE_ANON_KEY;

  return { url, anonKey };
}

export function saveCustomSupabaseCredentials(url: string, anonKey: string): void {
  try {
    localStorage.setItem(
      STORAGE_KEY_SUPABASE_CONFIG,
      JSON.stringify({ url: url.trim(), anonKey: anonKey.trim(), updatedAt: new Date().toISOString() })
    );
    reinitializeSupabaseClient();
  } catch (e) {
    console.error('Failed to save Supabase config to storage:', e);
  }
}

export function clearCustomSupabaseCredentials(): void {
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

// In-memory master state cache to allow atomic merging
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

// Standard table names used for synchronization
const APP_STATE_TABLE = 'app_state';
const STATE_ROW_ID = 'kca_main';

/**
 * Normalizes incoming data from Supabase into our standard KcaCloudState structure
 */
function extractStateFromRow(row: any): KcaCloudState | null {
  if (!row) return null;

  // Case 1: Payload column has full bundle
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

  // Case 2: Individual JSON columns directly on table row
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
 * Fetch full live state from Supabase
 */
export async function fetchCloudState(): Promise<KcaCloudState | null> {
  updateStatus({ isSyncing: true, error: null });
  const client = getSupabaseClient();

  try {
    // Attempt 1: Fetch from 'app_state' table
    const { data, error } = await client
      .from(APP_STATE_TABLE)
      .select('*')
      .order('version', { ascending: false })
      .limit(1);

    if (error) {
      // If table doesn't exist or RLS policy restricts, record status gracefully
      console.warn('[Supabase Sync] Fetch warning:', error.message);
      updateStatus({
        isSyncing: false,
        isConnected: false,
        error: error.message,
      });
      return null;
    }

    if (data && data.length > 0) {
      const parsed = extractStateFromRow(data[0]);
      if (parsed) {
        cachedCloudState = { ...cachedCloudState, ...parsed };
        updateStatus({
          isConnected: true,
          isSyncing: false,
          lastSyncTime: new Date(),
          version: parsed.version,
          error: null,
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

    // If database table is connected but empty, initialize it with current state
    updateStatus({
      isConnected: true,
      isSyncing: false,
      lastSyncTime: new Date(),
      error: null,
    });
    return null;
  } catch (err: any) {
    updateStatus({
      isSyncing: false,
      isConnected: false,
      error: err?.message || 'Network connection failed',
    });
    return null;
  }
}

/**
 * Lightweight check for latest version in Supabase
 */
export async function fetchCloudVersion(): Promise<{ version: number; lastUpdated: string } | null> {
  const client = getSupabaseClient();
  try {
    const { data, error } = await client
      .from(APP_STATE_TABLE)
      .select('version, updated_at')
      .order('version', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return null;

    const row = data[0];
    return {
      version: Number(row.version || 1),
      lastUpdated: row.updated_at || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Atomic Push: Updates a specific entity inside the master cloud state without overwriting other entities
 */
export async function pushCloudEntity(
  entity:
    | 'members'
    | 'finance'
    | 'inventory'
    | 'inventoryLogs'
    | 'classes'
    | 'classParticipants'
    | 'classAttendance'
    | 'accounts'
    | 'audit'
    | 'units'
    | 'customFields'
    | 'customLogo'
    | 'all'
    | string,
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

  try {
    const { error } = await client.from(APP_STATE_TABLE).upsert(
      {
        id: STATE_ROW_ID,
        entity: entity,
        payload: payloadBundle,
        version: nextVersion,
        updated_by: user,
        updated_at: cachedCloudState.lastUpdated,
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.warn('[Supabase Sync] Push error:', error.message);
      updateStatus({
        isSyncing: false,
        isConnected: false,
        error: error.message,
      });
      return false;
    }

    updateStatus({
      isConnected: true,
      isSyncing: false,
      lastSyncTime: new Date(),
      version: nextVersion,
      error: null,
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

/**
 * Full Restore & Sync to Supabase
 */
export async function pushFullRestore(payload: any, user: string = 'Admin Restore'): Promise<boolean> {
  return pushCloudEntity('all', payload, user);
}

/**
 * Test Connection helper to verify Supabase credentials and table availability
 */
export async function testSupabaseConnection(
  url?: string,
  anonKey?: string
): Promise<{ success: boolean; message: string; rowCount?: number }> {
  try {
    const client = url && anonKey ? createClient(url, anonKey, { auth: { persistSession: false } }) : getSupabaseClient();
    const { data, error } = await client.from(APP_STATE_TABLE).select('*').limit(1);

    if (error) {
      if (error.code === '42P01' || error.message.includes('relation "app_state" does not exist')) {
        return {
          success: false,
          message: `Connected to Supabase successfully, but the table "${APP_STATE_TABLE}" is not yet created. Use the SQL setup script below to create it.`,
        };
      }
      return {
        success: false,
        message: `Supabase Error: ${error.message} (Code: ${error.code || 'N/A'})`,
      };
    }

    return {
      success: true,
      message: `Successfully connected to Supabase table "${APP_STATE_TABLE}". Real-time cloud sync is operational!`,
      rowCount: data?.length || 0,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Connection failed: ${err.message || 'Network error'}`,
    };
  }
}

/**
 * Generates copy-pasteable SQL setup script for Supabase SQL Editor
 */
export function getSupabaseSqlSetupScript(): string {
  return `-- 1. Create the master app_state table for KCA Fujairah MMS
CREATE TABLE IF NOT EXISTS public.app_state (
  id TEXT PRIMARY KEY DEFAULT 'kca_main',
  entity TEXT DEFAULT 'all',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  version BIGINT DEFAULT 1,
  updated_by TEXT DEFAULT 'KCA Admin',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Disable RLS or allow anonymous read/write for live sync
ALTER TABLE public.app_state DISABLE ROW LEVEL SECURITY;

-- 3. Enable Supabase Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_state;

-- 4. Insert initial seed row if not exists
INSERT INTO public.app_state (id, entity, payload, version, updated_by, updated_at)
VALUES ('kca_main', 'all', '{}'::jsonb, 1, 'System Initializer', now())
ON CONFLICT (id) DO NOTHING;
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

  // 1. Initial State Fetch
  fetchCloudState().then((state) => {
    if (state && isRunning) {
      lastKnownVersion = state.version;
      onRemoteUpdate(state);
    }
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
          updateStatus({ isConnected: true, error: null });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          updateStatus({ isConnected: false });
        }
      });
  } catch (err: any) {
    console.warn('[Supabase Realtime Channel Init Error]:', err);
    updateStatus({ isConnected: false });
  }

  // 3. Fallback Heartbeat Polling (every 6 seconds) for bulletproof sync across proxies / mobile networks
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
  }, 6000);

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
