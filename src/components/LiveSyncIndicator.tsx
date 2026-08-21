import React, { useState, useEffect } from 'react';
import { subscribeToSyncStatus, fetchCloudState, SyncStatus } from '../utils/cloudSync';
import { RefreshCw, Database, AlertTriangle, Sparkles } from 'lucide-react';

interface LiveSyncIndicatorProps {
  onManualSync?: () => Promise<void> | void;
  onOpenStorageSettings?: () => void;
}

export const LiveSyncIndicator: React.FC<LiveSyncIndicatorProps> = ({
  onManualSync,
  onOpenStorageSettings,
}) => {
  const [status, setStatus] = useState<SyncStatus>({
    isConnected: true,
    isSyncing: false,
    lastSyncTime: new Date(),
    version: 1,
    error: null,
    tableExists: true,
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
    if (!status.isConnected || status.tableExists === false || status.error) {
      if (onOpenStorageSettings) {
        onOpenStorageSettings();
        return;
      }
    }
    if (onManualSync) {
      await onManualSync();
    } else {
      await fetchCloudState();
    }
  };

  const isSetupNeeded = !status.isConnected || status.tableExists === false || Boolean(status.error);

  return (
    <div className="relative inline-block">
      <button
        onClick={handleIndicatorClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all border shadow-xs cursor-pointer ${
          status.isSyncing
            ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
            : isSetupNeeded
            ? 'bg-amber-950/70 text-amber-200 border-amber-500/40 hover:bg-amber-900/90'
            : 'bg-emerald-950/60 text-emerald-200 border-emerald-500/40 hover:bg-emerald-900/80 hover:border-emerald-400'
        }`}
        title={isSetupNeeded ? 'Click to open Supabase setup guide' : 'Click to sync with Supabase Cloud'}
      >
        <span className="relative flex h-2 w-2">
          {status.isConnected && !status.isSyncing && !isSetupNeeded && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              status.isSyncing
                ? 'bg-amber-400 animate-spin'
                : isSetupNeeded
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
          ></span>
        </span>

        <span className="hidden sm:inline font-mono tracking-tight text-[11px]">
          {status.isSyncing
            ? 'Syncing Supabase...'
            : isSetupNeeded
            ? 'Supabase: Setup Table'
            : `Supabase Live (${timeAgo})`}
        </span>
        <span className="sm:hidden font-mono text-[10px]">
          {status.isSyncing ? 'Sync...' : isSetupNeeded ? 'Setup DB' : 'Live'}
        </span>

        {isSetupNeeded ? (
          <Sparkles className="w-3 h-3 text-amber-300" />
        ) : (
          <RefreshCw
            className={`w-3 h-3 text-white/80 hover:text-white transition-transform ${
              status.isSyncing ? 'animate-spin text-amber-300' : 'hover:rotate-180 duration-300'
            }`}
          />
        )}
      </button>

      {/* Hover Info Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-76 p-3.5 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 text-xs z-50 pointer-events-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-xs">
              <Database className="w-3.5 h-3.5" />
              <span>Supabase Real-Time Cloud</span>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
              !isSetupNeeded ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950 text-amber-300 border border-amber-500/30'
            }`}>
              {!isSetupNeeded ? 'Connected' : 'Action Required'}
            </span>
          </div>

          {isSetupNeeded ? (
            <div className="mt-2 space-y-2">
              <div className="flex items-start gap-2 text-amber-200 text-[11px] leading-relaxed">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Supabase database table <code>app_state</code> needs to be created or permissions granted via SQL script.
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Click below to open the 10-second setup guide and copy the SQL script.
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-slate-300 leading-relaxed mt-2">
              Multi-user realtime sync is active. Updates made by any user across branches/devices are synchronized instantly and permanently saved.
            </p>
          )}

          <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1 text-[10px] text-slate-400 font-mono">
            <div className="flex items-center justify-between">
              <span>Cloud Version:</span>
              <span className="text-white font-bold">v{status.version}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last Synced:</span>
              <span className="text-slate-300">{timeAgo}</span>
            </div>
            {status.syncedEntitiesCount && (
              <div className="flex items-center justify-between text-slate-400 pt-0.5">
                <span>Cached Data:</span>
                <span className="text-emerald-400">
                  {status.syncedEntitiesCount.members || 0} members · {status.syncedEntitiesCount.finance || 0} finance
                </span>
              </div>
            )}
          </div>

          {onOpenStorageSettings && (
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
                {isSetupNeeded ? '⚡ Open 10-Second SQL Setup Guide →' : 'Configure Cloud & Supabase Settings →'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
