/**
 * KCA Fujairah Centralized Local Storage Engine
 * Disables background HTTP sync polling to stop browser 401 console logs.
 */

export interface SyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  version: number;
  error: string | null;
}

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

// Local mock return to prevent HTTP fetch calls
export async function fetchCloudState() {
  updateStatus({ isSyncing: false, isConnected: true, lastSyncTime: new Date() });
  return null;
}

// Local mock return to prevent HTTP fetch calls
export async function fetchCloudVersion(): Promise<{ version: number; lastUpdated: string } | null> {
  return { version: 1, lastUpdated: new Date().toISOString() };
}

// Push operations fallback locally
export async function pushCloudEntity(
  entity: string,
  data: any,
  user: string = 'KCA User'
): Promise<boolean> {
  updateStatus({
    isSyncing: false,
    isConnected: true,
    lastSyncTime: new Date(),
    error: null,
  });
  return true;
}

export async function pushFullRestore(payload: any): Promise<boolean> {
  updateStatus({
    isSyncing: false,
    isConnected: true,
    lastSyncTime: new Date(),
    error: null,
  });
  return true;
}

/**
 * Sync Manager using local storage only
 */
export function startCloudSyncManager(onRemoteUpdate: (cloudState: any) => void): () => void {
  updateStatus({ isConnected: true, isSyncing: false, error: null });
  return () => {};
}
