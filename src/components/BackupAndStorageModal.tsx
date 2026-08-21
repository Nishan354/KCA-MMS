import React, { useState, useRef, useEffect } from 'react';
import { Member, AuditLogItem, BackupMetadata } from '../types/member';
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
}

export const BackupAndStorageModal: React.FC<BackupAndStorageModalProps> = ({
  members,
  auditLogs,
  isOpen,
  onClose,
  onRestoreBackup,
  fullDataPayload,
  onCloudStateReloaded,
}) => {
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

  // Supabase Cloud Configuration State
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
      
      // Auto sync config from server first to make sure this device has the global admin setup
      syncCredentialsFromServer().then(() => {
        const creds = getSupabaseCredentials();
        setSupabaseCreds(creds);
        setSupabaseUrlInput(creds.url);
        setSupabaseKeyInput(creds.anonKey);

        // Auto test connection on open
        testSupabaseConnection(creds.url, creds.anonKey).then((res) => {
          setSupabaseTestResult(res);
          if (!res.success && res.sqlNeeded) {
            setShowSqlSetup(true);
          }
        });
      });
    }
  }, [isOpen, members]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTestingSupabase(true);
    setSupabaseTestResult(null);
    try {
      const res = await testSupabaseConnection(supabaseUrlInput, supabaseKeyInput);
      setSupabaseTestResult(res);
      if (res.success) {
        confetti({ particleCount: 30, spread: 50 });
      } else if (res.sqlNeeded) {
        setShowSqlSetup(true);
      }
    } catch (e: any) {
      setSupabaseTestResult({
        success: false,
        tableExists: false,
        message: e.message || 'Connection test failed',
      });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleSaveCredentials = async () => {
    await saveCustomSupabaseCredentials(supabaseUrlInput, supabaseKeyInput);
    const updated = getSupabaseCredentials();
    setSupabaseCreds(updated);
    setCloudOpMessage({
      type: 'success',
      text: 'Global Supabase setup saved! All devices connecting to this app will automatically sync.',
    });
    setShowCredentialsForm(false);
    handleTestConnection();
  };

  const handleResetDefaultCredentials = async () => {
    await clearCustomSupabaseCredentials();
    const creds = getSupabaseCredentials();
    setSupabaseCreds(creds);
    setSupabaseUrlInput(creds.url);
    setSupabaseKeyInput(creds.anonKey);
    setCloudOpMessage({ type: 'success', text: 'Reset to default Supabase project credentials.' });
    setShowCredentialsForm(false);
    handleTestConnection();
  };

  const handleCopyDevicePairingLink = () => {
    const pairUrl = getDevicePairingUrl();
    if (!pairUrl) return;
    navigator.clipboard.writeText(pairUrl);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2500);
    confetti({ particleCount: 25, spread: 45 });
  };

  const handleForcePushToSupabase = async () => {
    setIsPushingCloud(true);
    setCloudOpMessage(null);
    try {
      const payloadToPush = fullDataPayload || {
        members,
        auditLogs,
      };

      const success = await pushFullRestore(payloadToPush, 'Admin Manual Cloud Push');
      if (success) {
        setCloudOpMessage({
          type: 'success',
          text: `Successfully pushed entire dataset (${members.length} members + records) to Supabase table "app_state"!`,
        });
        confetti({ particleCount: 45, spread: 65 });
      } else {
        setShowSqlSetup(true);
        setCloudOpMessage({
          type: 'error',
          text: 'Supabase push failed. The "app_state" table is missing or restricted by RLS policies. Run the SQL script below in Supabase.',
          showSqlAction: true,
        });
      }
    } catch (err: any) {
      setShowSqlSetup(true);
      setCloudOpMessage({
        type: 'error',
        text: err.message || 'Cloud push operation failed',
        showSqlAction: true,
      });
    } finally {
      setIsPushingCloud(false);
    }
  };

  const handleForcePullFromSupabase = async () => {
    setIsPullingCloud(true);
    setCloudOpMessage(null);
    try {
      const cloudData = await fetchCloudState();
      if (cloudData && Array.isArray(cloudData.members) && cloudData.members.length > 0) {
        onRestoreBackup(cloudData.members, cloudData.auditLogs || auditLogs);
        if (onCloudStateReloaded) {
          onCloudStateReloaded(cloudData);
        }
        setCloudOpMessage({
          type: 'success',
          text: `Pulled latest Supabase cloud state (v${cloudData.version}, ${cloudData.members.length} members).`,
        });
        confetti({ particleCount: 45, spread: 65 });
      } else if (cloudData) {
        setCloudOpMessage({
          type: 'success',
          text: 'Connected to Supabase cloud table. Ready for sync!',
        });
      } else {
        setShowSqlSetup(true);
        setCloudOpMessage({
          type: 'warning',
          text: 'Supabase table "app_state" needs initial creation. Follow the 10-second SQL guide below to activate cloud sync.',
          showSqlAction: true,
        });
      }
    } catch (err: any) {
      setShowSqlSetup(true);
      setCloudOpMessage({
        type: 'error',
        text: err.message || 'Cloud pull operation failed',
        showSqlAction: true,
      });
    } finally {
      setIsPullingCloud(false);
    }
  };

  const handleCopySql = () => {
    const sql = getSupabaseSqlSetupScript();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const directSqlEditorUrl = supabaseCreds.projectId
    ? `https://supabase.com/dashboard/project/${supabaseCreds.projectId}/sql/new`
    : 'https://supabase.com/dashboard';

  const handleRestoreSnapshot = (snapshot: LocalStorageSnapshot) => {
    if (snapshot.members.length === 0) return;
    onRestoreBackup(snapshot.members, auditLogs);
    setRecoverySuccessMsg(`Successfully restored ${snapshot.members.length} members from "${snapshot.label}".`);
    confetti({ particleCount: 40, spread: 60 });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleMergeAllHistorical = () => {
    const allKnown = new Map<string, Member>();
    members.forEach((m) => {
      if (m.id || m.membershipId) allKnown.set(m.id || m.membershipId, m);
    });
    recoverySnapshots.forEach((snap) => {
      snap.members.forEach((m) => {
        const key = m.id || m.membershipId;
        if (key && !allKnown.has(key)) {
          allKnown.set(key, m);
        }
      });
    });

    const combined = Array.from(allKnown.values());
    if (combined.length > members.length) {
      onRestoreBackup(combined, auditLogs);
      setRecoverySuccessMsg(`Recovered ${combined.length - members.length} lost member records! Total active members now: ${combined.length}`);
      confetti({ particleCount: 50, spread: 70 });
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setRecoverySuccessMsg(`All available browser records (${combined.length} members) are already loaded.`);
    }
  };

  const handleSaveToLocalFolder = async () => {
    setIsSavingLocal(true);
    setLocalStatusMessage(null);
    try {
      const res = await saveToLocalPcFolder(members, auditLogs);
      setLocalStatusMessage(res.message);
      setBackupMetaState(getBackupMetadata());
      if (res.success) {
        confetti({ particleCount: 40, spread: 60 });
      }
    } catch (err: any) {
      setLocalStatusMessage(`Error: ${err.message || 'Failed to save to local folder'}`);
    } finally {
      setIsSavingLocal(false);
    }
  };

  const handleExportForGoogleDrive = () => {
    downloadFullJsonBackup(members, auditLogs);
    window.open('https://drive.google.com/drive/my-drive', '_blank');
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (parsed && Array.isArray(parsed.members)) {
          onRestoreBackup(parsed.members, parsed.auditLogs || []);
          alert(`Successfully restored ${parsed.members.length} members from backup file.`);
          onClose();
        } else if (Array.isArray(parsed)) {
          onRestoreBackup(parsed, []);
          alert(`Successfully restored ${parsed.length} members.`);
          onClose();
        } else {
          setImportError('Invalid backup file format. Expected a valid KCA Fujairah JSON backup.');
        }
      } catch {
        setImportError('Failed to parse backup JSON file. Please verify file integrity.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-[#8b0000] text-white flex items-center justify-between border-b border-[#730000]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center text-white border border-white/20">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Multi-User Cloud Sync &amp; Database
              </h3>
              <p className="text-xs text-red-100">
                Supabase Real-Time Cloud, Branch synchronization, and PC backups
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          {/* Section 1: Supabase Realtime Cloud Sync */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    Supabase Real-Time Cloud Database
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Live multi-user sync across branches (Fujairah, Kalba, Khorfakhan, Dibba) and mobile devices.
                  </p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 font-mono ${
                supabaseTestResult?.success
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border-amber-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  supabaseTestResult?.success ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}></span>
                {supabaseTestResult?.success ? 'Real-Time Live' : 'Setup Required'}
              </span>
            </div>

            {/* Cloud Operational Feedback */}
            {cloudOpMessage && (
              <div
                className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-between gap-2 ${
                  cloudOpMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : cloudOpMessage.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {cloudOpMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>{cloudOpMessage.text}</span>
                </div>

                {cloudOpMessage.showSqlAction && (
                  <button
                    type="button"
                    onClick={() => setShowSqlSetup(true)}
                    className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold shrink-0 cursor-pointer"
                  >
                    View SQL Fix
                  </button>
                )}
              </div>
            )}

            {/* Step-by-Step 10-Second Setup Guide Callout (If table is not yet created) */}
            {(!supabaseTestResult?.success || showSqlSetup) && (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 text-amber-950 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <h5 className="text-xs font-bold font-display uppercase tracking-wider text-amber-900">
                      10-Second Supabase Activation Guide
                    </h5>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-amber-200/80 px-2 py-0.5 rounded text-amber-900">
                    Project: {supabaseCreds.projectId}
                  </span>
                </div>

                <p className="text-xs text-amber-900 leading-relaxed">
                  To enable permanent multi-device sync, run the auto-generated SQL setup script once in your Supabase SQL Editor to create the <code>app_state</code> table and configure real-time broadcasting.
                </p>

                {/* 3 Step Action Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSql ? '1. Copied to Clipboard!' : '1. Copy SQL Script'}
                  </button>

                  <a
                    href={directSqlEditorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                    2. Open SQL Editor
                  </a>

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTestingSupabase}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                    3. Verify &amp; Connect
                  </button>
                </div>
              </div>
            )}

            {/* Global Multi-Device Sharing & Pairing Banner */}
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 text-blue-900">
                <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Global Sync:</strong> Configuration is propagated across all devices automatically.
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyDevicePairingLink}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-bold transition-colors shadow-xs shrink-0 cursor-pointer"
                title="Copies a 1-click link to configure any phone, tablet, or other PC"
              >
                {copiedShareLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Smartphone className="w-3.5 h-3.5 text-blue-200" />}
                {copiedShareLink ? 'Link Copied!' : 'Copy Device Pairing Link'}
              </button>
            </div>

            {/* Supabase Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleForcePushToSupabase}
                disabled={isPushingCloud}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#8b0000] hover:bg-[#730000] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <ArrowUpCircle className={`w-4 h-4 ${isPushingCloud ? 'animate-spin' : ''}`} />
                {isPushingCloud ? 'Pushing to Cloud...' : 'Force Push to Supabase'}
              </button>

              <button
                type="button"
                onClick={handleForcePullFromSupabase}
                disabled={isPullingCloud}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <ArrowDownCircle className={`w-4 h-4 ${isPullingCloud ? 'animate-spin' : ''}`} />
                {isPullingCloud ? 'Pulling Cloud State...' : 'Force Pull from Supabase'}
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingSupabase}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                {isTestingSupabase ? 'Testing Ping...' : 'Test Connection'}
              </button>
            </div>

            {/* Test Connection Output */}
            {supabaseTestResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                  supabaseTestResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {supabaseTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>{supabaseTestResult.message}</span>
                </div>
                {supabaseTestResult.success && (
                  <span className="font-mono text-[10px] bg-emerald-200/60 px-2 py-0.5 rounded font-bold">
                    Status: OK
                  </span>
                )}
              </div>
            )}

            {/* Credentials / Advanced Options Toggles */}
            <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600 gap-2">
              <button
                type="button"
                onClick={() => setShowCredentialsForm(!showCredentialsForm)}
                className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                {showCredentialsForm ? 'Hide Supabase Credentials' : 'Configure Supabase URL & Keys'}
              </button>

              <button
                type="button"
                onClick={() => setShowSqlSetup(!showSqlSetup)}
                className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-900 font-semibold cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                {showSqlSetup ? 'Hide SQL Setup Script' : 'View SQL Setup Script'}
              </button>
            </div>

            {/* Custom Supabase Credentials Form */}
            {showCredentialsForm && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 animate-fadeIn">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Supabase Project URL:
                  </label>
                  <input
                    type="text"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono text-slate-900 focus:ring-1 focus:ring-[#8b0000] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Supabase Anon / Public API Key:
                  </label>
                  <input
                    type="password"
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono text-slate-900 focus:ring-1 focus:ring-[#8b0000] outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleResetDefaultCredentials}
                    className="text-[11px] text-slate-500 hover:text-slate-700 underline cursor-pointer"
                  >
                    Reset to Default Project
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCredentials}
                    className="px-3.5 py-1.5 bg-[#8b0000] hover:bg-[#730000] text-white text-xs font-bold rounded-md transition-colors cursor-pointer shadow-xs"
                  >
                    Save &amp; Broadcast to All Devices
                  </button>
                </div>
              </div>
            )}

            {/* Copyable SQL Setup Script */}
            {showSqlSetup && (
              <div className="p-4 bg-slate-900 rounded-lg text-slate-200 space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      Supabase SQL Editor Setup Script
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold border border-slate-700 cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedSql ? 'Copied!' : 'Copy SQL Script'}
                  </button>
                </div>

                <pre className="p-3 bg-black/60 rounded text-[10px] font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-56 border border-slate-800">
                  {getSupabaseSqlSetupScript()}
                </pre>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Copy and paste this into Supabase SQL Editor and click "Run".</span>
                  <a
                    href={directSqlEditorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1"
                  >
                    Open Supabase SQL Editor &rarr;
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Local Recovery Snapshots & Offline Redundancy */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#8b0000]" />
                Browser Local Storage &amp; Redundant Snapshots
              </h4>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                {members.length} Members in Cache
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              In addition to Supabase cloud sync, automatic snapshots are created in your browser memory so records are safe even during temporary internet disconnection.
            </p>

            {recoverySuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs font-medium text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{recoverySuccessMsg}</span>
              </div>
            )}

            {recoverySnapshots.length > 0 && (
              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span>Available Local Recovery Points:</span>
                  <button
                    type="button"
                    onClick={handleMergeAllHistorical}
                    className="text-[#8b0000] hover:underline cursor-pointer"
                  >
                    Merge All Snapshots
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {recoverySnapshots.map((snap) => (
                    <div
                      key={snap.key}
                      className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{snap.label}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {snap.members.length} members · {new Date(snap.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestoreSnapshot(snap)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-300 rounded text-[11px] font-semibold text-slate-800 cursor-pointer"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Save to Local PC Folder */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#8b0000]" />
                Direct Local PC Folder Export
              </h4>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                Offline File Backup
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Export data directly into a folder on your computer (e.g. <code>C:\KCA_Backups</code> or <code>Documents/KCA_Fujairah</code>). Both timestamped JSON and Excel/CSV formats are generated.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={handleSaveToLocalFolder}
                disabled={isSavingLocal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#8b0000] hover:bg-[#730000] text-white text-xs font-semibold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <FolderCheck className="w-4 h-4" />
                {isSavingLocal ? 'Saving to PC...' : 'Save to PC Folder'}
              </button>

              <button
                onClick={() => downloadMembersCsv(members)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                Export Excel/CSV
              </button>
            </div>

            {localStatusMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs font-medium text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{localStatusMessage}</span>
              </div>
            )}
          </div>

          {/* Section 4: Google Drive & JSON File Import */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-600" />
                Google Drive &amp; JSON File Restore
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleExportForGoogleDrive}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-300" />
                Download JSON &amp; Open Drive
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => importFileRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-600" />
                Restore from JSON File
              </button>

              <input
                type="file"
                ref={importFileRef}
                onChange={handleImportJsonFile}
                accept=".json"
                className="hidden"
              />
            </div>

            {importError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#8b0000] shrink-0" />
                <span>{importError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
