import React, { useState, useEffect } from 'react';
import { subscribeToSyncStatus, fetchCloudState, SyncStatus } from '../utils/cloudSync';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, ShieldCheck, Wifi, WifiOff } from 'lucide-react';

interface LiveSyncIndicatorProps {
  onManualSync?: () => void;
}

export const LiveSyncIndicator: React.FC<LiveSyncIndicatorProps> = ({ onManualSync }) => {
  const [status, setStatus] = useState<SyncStatus>({
    isConnected: true,
    isSyncing: false,
    lastSyncTime: new Date(),
    version: 1,
    error: null,
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

  const handleForceSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onManualSync) {
      onManualSync();
    } else {
      await fetchCloudState();
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleForceSync}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border shadow-2xs cursor-pointer ${
          status.isSyncing
            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            : status.isConnected
            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-950/60'
            : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
        }`}
        title="Click to force refresh latest cloud data"
      >
        <span className="relative flex h-2 w-2">
          {status.isConnected && !status.isSyncing && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              status.isSyncing
                ? 'bg-amber-400 animate-spin'
                : status.isConnected
                ? 'bg-emerald-400'
                : 'bg-rose-400'
            }`}
          ></span>
        </span>

        <span className="hidden sm:inline font-mono tracking-tight">
          {status.isSyncing
            ? 'Syncing...'
            : status.isConnected
            ? `Live Cloud: ${timeAgo}`
            : 'Offline Cache'}
        </span>
        <span className="sm:hidden font-mono">
          {status.isSyncing ? 'Sync...' : 'Live'}
        </span>

        <RefreshCw
          className={`w-3 h-3 text-slate-300 hover:text-white transition-transform ${
            status.isSyncing ? 'animate-spin' : 'hover:rotate-180 duration-300'
          }`}
        />
      </button>

      {/* Hover Info Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-1.5 w-64 p-3 bg-slate-900 text-white rounded-lg shadow-xl border border-slate-700 text-xs z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
            <Wifi className="w-3.5 h-3.5" />
            <span>Centralized Live Synchronization</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            All 5 user locations, unit operators &amp; central management dashboards are linked in real-time. Any update made on any device is instantly synchronized.
          </p>
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>Server Version: v{status.version}</span>
            <span>Status: {status.isConnected ? 'Connected 🟢' : 'Reconnecting 🔴'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
