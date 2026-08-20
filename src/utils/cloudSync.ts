/**
 * KCA Fujairah Centralized Cloud Synchronization Engine
 * Enables seamless live data synchronization across 5+ distributed users,
 * multiple devices, different browsers, and central management dashboards.
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
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    if (data.success) {
      updateStatus({
        isConnected: true,
        isSyncing: false,
        lastSyncTime: new Date(),
        version: data.version || 1,
        error: null,
      });
      return data;
    }
    throw new Error(data.error || 'Failed to fetch cloud state');
  } catch (err: any) {
    updateStatus({
      isSyncing: false,
      isConnected: false,
      error: err.message,
    });
    console.warn('[CloudSync] Fetch failed, relying on local storage cache:', err);
    return null;
  }
}

export async function fetchCloudVersion(): Promise<{ version: number; lastUpdated: string } | null> {
  try {
    const res = await fetch('/api/sync/version', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success) {
      updateStatus({ isConnected: true, error: null });
      return { version: data.version, lastUpdated: data.lastUpdated };
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
      if (resp.success) {
        updateStatus({
          isSyncing: false,
          isConnected: true,
          lastSyncTime: new Date(),
          version: resp.version,
          error: null,
        });
        return true;
      }
    }
    throw new Error('Failed to push update to cloud server');
  } catch (err: any) {
    updateStatus({
      isSyncing: false,
      error: err.message,
    });
    console.warn('[CloudSync] Push error, saved locally:', err);
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
      if (data.success) {
        updateStatus({
          isSyncing: false,
          isConnected: true,
          lastSyncTime: new Date(),
          version: data.version,
          error: null,
        });
        return true;
      }
    }
    throw new Error('Restore failed on server');
  } catch (err: any) {
    updateStatus({ isSyncing: false, error: err.message });
    return false;
  }
}

/**
 * Start Real-Time Synchronizer using Server-Sent Events (SSE) + Automatic Reconnect + Fast Polling Fallback
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
        // Retry SSE in 5 seconds
        if (isRunning) {
          setTimeout(connectSSE, 5000);
        }
      };
    } catch {
      // SSE not supported, will use poll fallback
    }
  }

  async function fetchAndNotify() {
    const fullState = await fetchCloudState();
    if (fullState && isRunning) {
      lastKnownVersion = fullState.version;
      onRemoteUpdate(fullState);
    }
  }

  // Initial fetch on mount
  fetchAndNotify();

  // Connect SSE
  connectSSE();

  // Background polling every 8 seconds as safety net across firewalls
  pollInterval = setInterval(async () => {
    if (!isRunning) return;
    const remote = await fetchCloudVersion();
    if (remote && remote.version > lastKnownVersion) {
      lastKnownVersion = remote.version;
      fetchAndNotify();
    }
  }, 8000);

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
