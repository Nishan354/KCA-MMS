import React, { useState, useRef, useEffect } from 'react';
import { Member, AuditLogItem, BackupMetadata, UserSession, isSuperAdminOrAdmin } from '../types/member';
import {
  saveToLocalPcFolder,
  downloadMembersCsv,
  downloadFullJsonBackup,
  getBackupMetadata,
  setBackupMetadata,
  getLocalRecoverySnapshots,
  LocalStorageSnapshot,
} from '../utils/storage';
import {
  getSupabaseCredentials,
  saveCustomSupabaseCredentials,
  clearCustomSupabaseCredentials,
  testSupabaseConnection,
  getSupabaseSqlSetupScript,
  pushFullRestore,
  fetchCloudState,
  syncCredentialsFromServer,
  getDevicePairingUrl,
  ConnectionTestResult,
} from '../utils/cloudSync';
import {
  X,
  HardDrive,
  Cloud,
  Download,
  Upload,
  FolderPlus,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  FolderCheck,
  ExternalLink,
  Database,
  Key,
  Copy,
  Check,
  Layers,
  ArrowUpCircle,
  ArrowDownCircle,
  Terminal,
  Sparkles,
  Share2,
  Smartphone,
  Globe,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BackupAndStorageModalProps {
  members: Member[];
  auditLogs: AuditLogItem[];
  isOpen: boolean;
  onClose: () => void;
  onRestoreBackup: (members: Member[], logs: AuditLogItem[]) => void;
  fullDataPayload?: any;
  onCloudStateReloaded?: (state: any) => void;
  userSession?: UserSession | null;
}

export const BackupAndStorageModal: React.FC<BackupAndStorageModalProps> = ({
  members,
  auditLogs,
  isOpen,
  onClose,
  onRestoreBackup,
  fullDataPayload,
  onCloudStateReloaded,
  userSession,
}) => {
  const isAdmin = userSession ? isSuperAdminOrAdmin(userSession.role) : false;

  const [backupMeta, setBackupMetaState] = useState<BackupMetadata>(getBackupMetadata());
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [localStatusMessage, setLocalStatusMessage] = useState<string | null>(null);
  const [googleDriveFolderName] = useState(
    backupMeta.googleDriveFolderName || 'KCA_Fujairah_Membership_Backups'
  );
  const [importError, setImportError] = useState<string | null>(null);
  const [recoverySnapshots, setRecoverySnapshots] = useState<LocalStorageSnapshot[]>([]);
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState<string | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Supabase Cloud Configuration State (Admin Only)
  const [supabaseCreds, setSupabaseCreds] = useState(() => getSupabaseCredentials());
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(supabaseCreds.url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(supabaseCreds.anonKey);
  const [showCredentialsForm, setShowCredentialsForm] = useState(false);
  const [showSqlSetup, setShowSqlSetup] = useState(false);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<ConnectionTestResult | null>(null);
  const [isPushingCloud, setIsPushingCloud] = useState(false);
  const [isPullingCloud, setIsPullingCloud] = useState(false);
  const [cloudOpMessage, setCloudOpMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
    showSqlAction?: boolean;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const found = getLocalRecoverySnapshots();
      setRecoverySnapshots(found);

      if (isAdmin) {
        syncCredentialsFromServer().then(() => {
          const creds = getSupabaseCredentials();
          setSupabaseCreds(creds);
          setSupabaseUrlInput(creds.url);
          setSupabaseKeyInput(creds.anonKey);

          testSupabaseConnection(creds.url, creds.anonKey).then((res) => {
            setSupabaseTestResult(res);
            if (!res.success && res.sqlNeeded) {
              setShowSqlSetup(true);
            }
          });
        });
      }
    }
  }, [isOpen, isAdmin]);

  if (!isOpen) return null;

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    setCloudOpMessage(null);
    try {
      const res = await testSupabaseConnection(supabaseUrlInput, supabaseKeyInput);
      setSupabaseTestResult(res);
      if (res.success) {
        setCloudOpMessage({ type: 'success', text: res.message });
      } else {
        setCloudOpMessage({
          type: res.sqlNeeded ? 'warning' : 'error',
          text: res.message,
          showSqlAction: res.sqlNeeded,
        });
        if (res.sqlNeeded) {
          setShowSqlSetup(true);
        }
      }
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrlInput || !supabaseKeyInput) {
      setCloudOpMessage({ type: 'error', text: 'Please fill in both Supabase URL and Key.' });
      return;
    }

    setIsTestingSupabase(true);
    try {
      await saveCustomSupabaseCredentials(supabaseUrlInput, supabaseKeyInput);
      setSupabaseCreds(getSupabaseCredentials());
      setShowCredentialsForm(false);

      const testRes = await testSupabaseConnection(supabaseUrlInput, supabaseKeyInput);
      setSupabaseTestResult(testRes);

      if (testRes.success) {
        setCloudOpMessage({
          type: 'success',
          text: 'Supabase credentials saved and active. Real-time sync is operational across all devices.',
        });
        try {
          confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
        } catch {}
      } else {
        setCloudOpMessage({
          type: testRes.sqlNeeded ? 'warning' : 'error',
          text: testRes.message,
          showSqlAction: testRes.sqlNeeded,
        });
        if (testRes.sqlNeeded) {
          setShowSqlSetup(true);
        }
      }
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleCopyPairingLink = () => {
    const url = getDevicePairingUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  const handleForcePushToCloud = async () => {
    setIsPushingCloud(true);
    setCloudOpMessage(null);
    try {
      const payloadToPush = fullDataPayload || { members, auditLogs };
      const success = await pushFullRestore(payloadToPush, userSession?.username || 'Admin Force Push');
      if (success) {
        setCloudOpMessage({
          type: 'success',
          text: `Successfully uploaded ${members.length} members & full database to Cloud. All devices are synchronized.`,
        });
        try {
          confetti({ particleCount: 40, spread: 70, origin: { y: 0.5 } });
        } catch {}
      } else {
        setCloudOpMessage({
          type: 'error',
          text: 'Push failed. Please verify Supabase setup script in SQL Editor.',
          showSqlAction: true,
        });
        setShowSqlSetup(true);
      }
    } catch (err: any) {
      setCloudOpMessage({ type: 'error', text: `Push error: ${err.message}` });
    } finally {
      setIsPushingCloud(false);
    }
  };

  const handleForcePullFromCloud = async () => {
    setIsPullingCloud(true);
    setCloudOpMessage(null);
    try {
      const cloudState = await fetchCloudState();
      if (cloudState && Array.isArray(cloudState.members)) {
        if (onCloudStateReloaded) {
          onCloudStateReloaded(cloudState);
        } else {
          onRestoreBackup(cloudState.members, cloudState.auditLogs || []);
        }
        setCloudOpMessage({
          type: 'success',
          text: `Pulled latest version (v${cloudState.version}) with ${cloudState.members.length} members from Cloud.`,
        });
      } else {
        setCloudOpMessage({
          type: 'warning',
          text: 'No cloud database record found. Use "Force Push to Supabase" to initialize the master state.',
        });
      }
    } catch (err: any) {
      setCloudOpMessage({ type: 'error', text: `Pull error: ${err.message}` });
    } finally {
      setIsPullingCloud(false);
    }
  };

  const handleCopySqlScript = () => {
    const script = getSupabaseSqlSetupScript();
    navigator.clipboard.writeText(script);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSaveToFolder = async () => {
    setIsSavingLocal(true);
    setLocalStatusMessage(null);
    try {
      const success = await saveToLocalPcFolder(members, auditLogs);
      if (success) {
        setBackupMetaState(getBackupMetadata());
        setLocalStatusMessage('Backup saved to PC folder successfully!');
      } else {
        setLocalStatusMessage('Folder saving was cancelled or failed.');
      }
    } catch {
      setLocalStatusMessage('Error saving to folder.');
    } finally {
      setIsSavingLocal(false);
    }
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        let parsedMembers: Member[] = [];
        let parsedLogs: AuditLogItem[] = [];

        if (Array.isArray(parsed)) {
          parsedMembers = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.members)) {
            parsedMembers = parsed.members;
          }
          if (Array.isArray(parsed.auditLogs)) {
            parsedLogs = parsed.auditLogs;
          }
        }

        if (parsedMembers.length === 0) {
          throw new Error('No valid member records found in this JSON file.');
        }

        onRestoreBackup(parsedMembers, parsedLogs);
        setBackupMetadata({ lastBackupDate: new Date().toISOString() });
        setBackupMetaState(getBackupMetadata());
        alert(`Successfully restored ${parsedMembers.length} member records!`);
        onClose();
      } catch (err: any) {
        setImportError(err.message || 'Failed to read or parse JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreSnapshot = (snap: LocalStorageSnapshot) => {
    const timeStr = snap.timestamp ? new Date(snap.timestamp).toLocaleString() : 'Saved Snapshot';
    if (confirm(`Restore data snapshot (${snap.label} - ${snap.memberCount} members)?`)) {
      onRestoreBackup(snap.members, auditLogs);
      setRecoverySuccessMsg(`Restored ${snap.memberCount} members from snapshot.`);
      setTimeout(() => setRecoverySuccessMsg(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scaleUp">
        {/* Header */}
        <div
          className="p-5 text-white flex items-center justify-between"
          style={{ backgroundColor: 'var(--color-primary, #881337)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isAdmin ? 'Multi-User Cloud Sync & Database Settings' : 'KCA Multi-Device Cloud Sync'}
              </h2>
              <p className="text-xs text-white/80">
                {isAdmin
                  ? 'Supabase Real-Time Cloud, Branch synchronization, and PC backups'
                  : 'Automatic real-time synchronization across all branch devices'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          
          {/* ========================================================================= */}
          {/* NON-ADMIN VIEW: Clean, Simple, Zero Technical Errors */}
          {/* ========================================================================= */}
          {!isAdmin ? (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-emerald-950">
                      Cloud Real-Time Synchronization is Active
                    </h3>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      Your device is continuously synchronized with the KCA Central Cloud Database. Any changes you make (adding members, recording fees, issuing inventory, marking class attendance) are automatically saved and broadcast across all branch PCs and mobile phones without any manual steps.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-xs">
                      <span className="px-3 py-1 bg-emerald-100/80 text-emerald-900 font-bold rounded-lg border border-emerald-300/60 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {members.length} Members Synchronized
                      </span>
                      <span className="px-3 py-1 bg-teal-100/80 text-teal-900 font-bold rounded-lg border border-teal-300/60">
                        Zero Manual Action Required
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Export Options for Staff */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                  <Download className="w-4 h-4 text-slate-600" />
                  Offline Data Export & Reports
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => downloadMembersCsv(members)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800 group-hover:text-emerald-800">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      Download Excel / CSV Roster
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Export all {members.length} member profiles with contact details to spreadsheet.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadFullJsonBackup(members, auditLogs)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800 group-hover:text-blue-800">
                      <Download className="w-4 h-4 text-blue-600" />
                      Download Personal Backup (JSON)
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Download complete structured JSON snapshot for personal record keeping.
                    </p>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  Database configuration, Supabase credentials, and SQL schema migrations are managed exclusively by System Administrators.
                </span>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* ADMIN VIEW: Full Suite of Technical & Database Management Tools          */
            /* ========================================================================= */
            <div className="space-y-6">
              {/* SECTION 1: 10-Second Activation Guide */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                    <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      10-Second Supabase Activation Guide
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                    Project: <code className="font-mono">{supabaseCreds.projectId}</code>
                  </span>
                </div>

                <p className="text-xs text-amber-900 mt-3 leading-relaxed">
                  To enable permanent multi-device sync, run the auto-generated SQL setup script once in your Supabase SQL Editor to create the <code>app_state</code> table and configure real-time broadcasting.
                </p>

                {/* 3 Steps Action Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  <button
                    onClick={handleCopySqlScript}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedSql ? '✓ Script Copied!' : '1. Copy SQL Script'}</span>
                  </button>

                  <a
                    href={`https://supabase.com/dashboard/project/${supabaseCreds.projectId}/sql/new`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-amber-400" />
                    <span>2. Open SQL Editor</span>
                  </a>

                  <button
                    onClick={handleTestSupabase}
                    disabled={isTestingSupabase}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-amber-400 text-amber-950 font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 text-amber-700 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                    <span>{isTestingSupabase ? 'Verifying...' : '3. Verify & Connect'}</span>
                  </button>
                </div>
              </div>

              {/* SECTION 2: 1-Click Mobile & Device Pairing */}
              <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                      Global Sync & Instant Device Pairing
                    </div>
                    <p className="text-[11px] text-sky-800">
                      Settings are automatically propagated to all devices. Use the link below to instantly pair new mobile phones or branch laptops.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPairingLink}
                  className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white text-xs font-bold whitespace-nowrap shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copiedShareLink ? <Check className="w-4 h-4 text-emerald-200" /> : <Share2 className="w-4 h-4" />}
                  <span>{copiedShareLink ? '✓ Pairing Link Copied!' : 'Copy Device Pairing Link'}</span>
                </button>
              </div>

              {/* SECTION 3: Operations & Status Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={handleForcePushToCloud}
                  disabled={isPushingCloud}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-900 hover:bg-rose-950 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <ArrowUpCircle className={`w-4 h-4 ${isPushingCloud ? 'animate-bounce' : ''}`} />
                  <span>{isPushingCloud ? 'Pushing Data...' : 'Force Push to Supabase'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleForcePullFromCloud}
                  disabled={isPullingCloud}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <ArrowDownCircle className={`w-4 h-4 ${isPullingCloud ? 'animate-bounce' : ''}`} />
                  <span>{isPullingCloud ? 'Pulling Data...' : 'Force Pull from Supabase'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestSupabase}
                  disabled={isTestingSupabase}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                  <span>{isTestingSupabase ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>

              {/* Status Message Callout */}
              {cloudOpMessage && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    cloudOpMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : cloudOpMessage.type === 'warning'
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-rose-50 text-rose-900 border-rose-300'
                  }`}
                >
                  {cloudOpMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div>{cloudOpMessage.text}</div>
                    {cloudOpMessage.showSqlAction && (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopySqlScript}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold cursor-pointer"
                        >
                          {copiedSql ? '✓ Script Copied' : 'Copy SQL Script'}
                        </button>
                        <a
                          href={`https://supabase.com/dashboard/project/${supabaseCreds.projectId}/sql/new`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold cursor-pointer"
                        >
                          Open SQL Editor →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Collapsible Credentials & SQL Editor */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCredentialsForm(!showCredentialsForm)}
                  className="hover:text-slate-900 underline flex items-center gap-1 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  {showCredentialsForm ? 'Hide Supabase Keys' : 'Configure Custom Supabase Keys'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowSqlSetup(!showSqlSetup)}
                  className="hover:text-slate-900 underline flex items-center gap-1 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  {showSqlSetup ? 'Hide SQL Setup Script' : 'View SQL Setup Script'}
                </button>
              </div>

              {/* Custom Supabase Keys Input Form */}
              {showCredentialsForm && (
                <form
                  onSubmit={handleSaveSupabaseConfig}
                  className="p-4 bg-slate-100 rounded-xl border border-slate-300 space-y-3"
                >
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Custom Supabase Project Credentials
                  </h4>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Supabase Project URL
                    </label>
                    <input
                      type="url"
                      value={supabaseUrlInput}
                      onChange={(e) => setSupabaseUrlInput(e.target.value)}
                      placeholder="https://xyzcompany.supabase.co"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Anon / Public API Key
                    </label>
                    <input
                      type="text"
                      value={supabaseKeyInput}
                      onChange={(e) => setSupabaseKeyInput(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCredentialsForm(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isTestingSupabase}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                    >
                      Save & Propagate Globally
                    </button>
                  </div>
                </form>
              )}

              {/* SQL Script Viewer */}
              {showSqlSetup && (
                <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs border border-slate-800 relative">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                    <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                      <Terminal className="w-4 h-4" />
                      Supabase SQL Editor Setup Script
                    </span>
                    <button
                      onClick={handleCopySqlScript}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSql ? 'Copied' : 'Copy SQL Script'}</span>
                    </button>
                  </div>
                  <pre className="max-h-56 overflow-y-auto text-[11px] text-slate-300 leading-relaxed font-mono select-all">
                    {getSupabaseSqlSetupScript()}
                  </pre>
                </div>
              )}

              {/* Traditional Backup & Recovery Options */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Local Backups & Spreadsheet Exports
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => downloadMembersCsv(members)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-left transition-all hover:shadow-xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800 group-hover:text-emerald-700">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      Download Excel / CSV
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Export member list spreadsheet</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadFullJsonBackup(members, auditLogs)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-left transition-all hover:shadow-xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800 group-hover:text-blue-700">
                      <Download className="w-4 h-4 text-blue-600" />
                      Download JSON Backup
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Full database state file</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => importFileRef.current?.click()}
                    className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-left transition-all hover:shadow-xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800 group-hover:text-amber-700">
                      <Upload className="w-4 h-4 text-amber-600" />
                      Restore from JSON
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Import file to restore state</p>
                  </button>
                  <input
                    ref={importFileRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportJsonFile}
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            KCA Fujairah Central Multi-Location Management System
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
