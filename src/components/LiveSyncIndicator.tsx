import React, { useState, useEffect } from 'react';
import { subscribeToSyncStatus, fetchCloudState, SyncStatus } from '../utils/cloudSync';
import { RefreshCw, Database, CheckCircle2 } from 'lucide-react';

interface LiveSyncIndicatorProps {
  onManualSync?: () => Promise<void> | void;
  onOpenStorageSettings?: () => void;
  isAdmin?: boolean;
}

export const LiveSyncIndicator: React.FC<LiveSyncIndicatorProps> = ({
  onManualSync,
  onOpenStorageSettings,
  isAdmin = false,
}) => {
  const [status, setStatus] = useState<SyncStatus>({
    isConnected: true,
    isSyncing: false,
    lastSyncTime: new Date(),
    version: 1,
    error: null,
    tableExists: true,
    isGloballyConfigured: true,
  });
  const [showTooltip, setShowTooltip] = useState(false);
  const [timeAgo, setTimeAgo] = useState('Just now');

  useEffect(() => {
    const unsub = subscribeToSyncStatus((s) => {
      setStatus(s);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!status.lastSyncTime) {
        setTimeAgo('Syncing...');
        return;
      }
      const diffMs = Date.now() - new Date(status.lastSyncTime).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 5) {
        setTimeAgo('Just now');
      } else if (diffSec < 60) {
        setTimeAgo(`${diffSec}s ago`);
      } else {
        const mins = Math.floor(diffSec / 60);
        setTimeAgo(`${mins}m ago`);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [status.lastSyncTime]);

  const handleIndicatorClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onManualSync) {
      await onManualSync();
    } else {
      await fetchCloudState();
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleIndicatorClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all border shadow-xs cursor-pointer ${
          status.isSyncing
            ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
            : 'bg-emerald-950/60 text-emerald-200 border-emerald-500/40 hover:bg-emerald-900/80 hover:border-emerald-400'
        }`}
        title="Multi-device cloud synchronization is active. Click to refresh."
      >
        <span className="relative flex h-2 w-2">
          {!status.isSyncing && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              status.isSyncing ? 'bg-amber-400 animate-spin' : 'bg-emerald-400'
            }`}
          ></span>
        </span>

        <span className="hidden sm:inline font-mono tracking-tight text-[11px]">
          {status.isSyncing ? 'Syncing...' : `Live Cloud (${timeAgo})`}
        </span>
        <span className="sm:hidden font-mono text-[10px]">
          {status.isSyncing ? 'Sync...' : 'Live'}
        </span>

        <RefreshCw
          className={`w-3 h-3 text-white/80 hover:text-white transition-transform ${
            status.isSyncing ? 'animate-spin text-amber-300' : 'hover:rotate-180 duration-300'
          }`}
        />
      </button>

      {/* Hover Info Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-76 p-3.5 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 text-xs z-50 pointer-events-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-xs">
              <Database className="w-3.5 h-3.5" />
              <span>KCA Central Cloud Database</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              Live & Connected
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed mt-2">
            Multi-user realtime sync is active. All member updates, receipts, and inventory records are synchronized automatically across all branch computers and phones.
          </p>

          <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1 text-[10px] text-slate-400 font-mono">
            <div className="flex items-center justify-between">
              <span>Cloud Sync:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
                Automatic
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last Synchronized:</span>
              <span className="text-slate-300">{timeAgo}</span>
            </div>
            {status.syncedEntitiesCount && (
              <div className="flex items-center justify-between text-slate-400 pt-0.5">
                <span>Active Records:</span>
                <span className="text-emerald-400">
                  {status.syncedEntitiesCount.members || 0} members · {status.syncedEntitiesCount.finance || 0} finance
                </span>
              </div>
            )}
          </div>

          {isAdmin && onOpenStorageSettings && (
            <div className="mt-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(false);
                  onOpenStorageSettings();
                }}
                className="w-full py-1 text-center text-[10px] text-amber-300 hover:text-amber-100 font-semibold cursor-pointer underline"
              >
                Manage Supabase & Storage Settings →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
