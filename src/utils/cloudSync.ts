import { createClient } from '@supabase/supabase-js';

export interface SyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  version: number;
  error: string | null;
}

// Environment variables configured in Vercel / AI Studio
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://jvwetoapdaxuweannrgq.supabase.co';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

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

// Fetch live state directly from Supabase table
export async function fetchCloudState() {
  updateStatus({ isSyncing: true, error: null });
  try {
    const { data, error } = await supabase.from('app_state').select('*').single();
    if (error) throw error;

    updateStatus({
      isConnected: true,
      isSyncing: false,
      lastSyncTime: new Date(),
      version: data?.version || 1,
      error: null,
    });
    return data?.payload || null;
  } catch (err: any) {
    updateStatus({ isSyncing: false, isConnected: false, error: err.message });
    return null;
  }
}

export async function fetchCloudVersion() {
  try {
    const { data, error } = await supabase.from('app_state').select('version, updated_at').single();
    if (error) return null;
    return { version: data.version, lastUpdated: data.updated_at };
  } catch {
    return null;
  }
}

// Push local edits directly to Supabase so other devices receive updates
export async function pushCloudEntity(entity: string, data: any, user: string = 'KCA User'): Promise<boolean> {
  updateStatus({ isSyncing: true });
  try {
    const newVersion = currentSyncStatus.version + 1;
    const { error } = await supabase.from('app_state').upsert({
      id: 1,
      entity,
      payload: data,
      updated_by: user,
      version: newVersion,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    updateStatus({
      isSyncing: false,
      isConnected: true,
      lastSyncTime: new Date(),
      version: newVersion,
      error: null,
    });
    return true;
  } catch (err: any) {
    updateStatus({ isSyncing: false, isConnected: false, error: err.message });
    return false;
  }
}

// Full restore pushing entire dataset
export async function pushFullRestore(payload: any): Promise<boolean> {
  return pushCloudEntity('all', payload, 'System Restore');
}

// Subscribe to real-time changes across all connected devices
export function startCloudSyncManager(onRemoteUpdate: (cloudState: any) => void): () => void {
  fetchCloudState().then((state) => {
    if (state) onRemoteUpdate(state);
  });

  try {
    const channel = supabase
      .channel('realtime_kca_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_state' },
        (payload) => {
          if (payload.new && (payload.new as any).payload) {
            updateStatus({
              isConnected: true,
              lastSyncTime: new Date(),
              version: (payload.new as any).version || 1,
            });
            onRemoteUpdate((payload.new as any).payload);
          }
        }
      )
      .subscribe((status) => {
        updateStatus({ isConnected: status === 'SUBSCRIBED' });
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  } catch {
    return () => {};
  }
}
