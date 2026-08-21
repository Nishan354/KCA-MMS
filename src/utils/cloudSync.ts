/**
 * KCA Fujairah Centralized Cloud Synchronization Engine
 * Enables live data synchronization with resilient client-side fallbacks.
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

export async function fetchCloudState() {
  updateStatus({ isSyncing: true, error: null });
  try {
    const res = await fetch('/api/sync/state', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    
    if (!res.ok) {
      updateStatus({ isConnected: false, isSyncing: false });
      return null;
    }
    
    const data = await res.json();
    if (data.success || data.status === 'success') {
      updateStatus({
        isConnected: true,
        isSyncing: false,
        lastSyncTime: new Date(),
        version: data.version || 1,
        error: null,
      });
      return data;
    }
    updateStatus({ isConnected: false, isSyncing: false });
    return null;
  } catch (err: any) {
    updateStatus({
      isSyncing: false,
      isConnected: false,
      error: null,
    });
    return null;
  }
}

export async function fetchCloudVersion(): Promise<{ version: number; lastUpdated: string } | null> {
  try {
    const res = await fetch('/api/sync/version', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) {
      updateStatus({ isConnected: false });
      return null;
    }
    const data = await res.json();
    if (data.success || data.version) {
      updateStatus({ isConnected: true, error: null });
      return { version: data.version || 1, lastUpdated: data.lastUpdated || new Date().toISOString() };
    }
    return null;
  } catch {
    updateStatus({ isConnected: false });
    return null;
  }
}

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
    | 'all',
  data: any,
  user: string = 'KCA User'
): Promise<boolean> {
  updateStatus({ isSyncing: true });
  try {
    const res = await fetch('/api/sync/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entity, data, user }),
    });

    if (res.ok) {
      const resp = await res.json();
      if (resp.success || resp.status === 'success') {
        updateStatus({
          isSyncing: false,
          isConnected: true,
          lastSyncTime: new Date(),
          version: resp.version || 1,
          error: null,
        });
        return true;
      }
    }
    updateStatus({ isSyncing: false, isConnected: false });
    return false;
  } catch (err: any) {
    updateStatus({
      isSyncing: false,
      isConnected: false,
      error: null,
    });
    return false;
  }
}

export async function pushFullRestore(payload: any): Promise<boolean> {
  updateStatus({ isSyncing: true });
  try {
    const res = await fetch('/api/sync/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success || data.status === 'success') {
        updateStatus({
          isSyncing: false,
          isConnected: true,
          lastSyncTime: new Date(),
          version: data.version || 1,
          error: null,
        });
        return true;
      }
    }
    updateStatus({ isSyncing: false, isConnected: false });
    return false;
  } catch (err: any) {
    updateStatus({ isSyncing: false, isConnected: false });
    return false;
  }
}

/**
 * Start Real-Time Synchronizer with Safe Fallbacks
 */
export function startCloudSyncManager(onRemoteUpdate: (cloudState: any) => void): () => void {
  let eventSource: EventSource | null = null;
  let pollInterval: any = null;
  let isRunning = true;
  let lastKnownVersion = currentSyncStatus.version;

  function connectSSE() {
    if (!isRunning) return;

    try {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource('/api/sync/events');

      eventSource.addEventListener('CONNECTED', (e: any) => {
        try {
          const info = JSON.parse(e.data);
          if (info.version > lastKnownVersion) {
            lastKnownVersion = info.version;
            fetchAndNotify();
          }
          updateStatus({ isConnected: true, error: null });
        } catch {}
      });

      eventSource.addEventListener('SYNC_UPDATE', (e: any) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.version > lastKnownVersion) {
            lastKnownVersion = payload.version;
            fetchAndNotify();
          }
        } catch {}
      });

      eventSource.onerror = () => {
        updateStatus({ isConnected: false });
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
      };
    } catch {
      updateStatus({ isConnected: false });
    }
  }

  async function fetchAndNotify() {
    const fullState = await fetchCloudState();
    if (fullState && isRunning) {
      lastKnownVersion = fullState.version || 1;
      onRemoteUpdate(fullState);
    }
  }

  // Initial fetch on mount
  fetchAndNotify();

  // Connect SSE
  connectSSE();

  // Background polling interval
  pollInterval = setInterval(async () => {
    if (!isRunning) return;
    const remote = await fetchCloudVersion();
    if (remote && remote.version > lastKnownVersion) {
      lastKnownVersion = remote.version;
      fetchAndNotify();
    }
  }, 12000);

  return () => {
    isRunning = false;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    if (pollInterval) {
      clearInterval(pollInterval);
    }
  };
}
