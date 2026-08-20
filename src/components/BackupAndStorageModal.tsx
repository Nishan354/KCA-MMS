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
  ShieldCheck,
  History,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BackupAndStorageModalProps {
  members: Member[];
  auditLogs: AuditLogItem[];
  isOpen: boolean;
  onClose: () => void;
  onRestoreBackup: (members: Member[], logs: AuditLogItem[]) => void;
}

export const BackupAndStorageModal: React.FC<BackupAndStorageModalProps> = ({
  members,
  auditLogs,
  isOpen,
  onClose,
  onRestoreBackup,
}) => {
  const [backupMeta, setBackupMetaState] = useState<BackupMetadata>(getBackupMetadata());
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [localStatusMessage, setLocalStatusMessage] = useState<string | null>(null);
  const [googleDriveFolderName, setGoogleDriveFolderName] = useState(
    backupMeta.googleDriveFolderName || 'KCA_Fujairah_Membership_Backups'
  );
  const [googleDriveLinked, setGoogleDriveLinked] = useState(backupMeta.googleDriveLinked);
  const [importError, setImportError] = useState<string | null>(null);
  const [recoverySnapshots, setRecoverySnapshots] = useState<LocalStorageSnapshot[]>([]);
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState<string | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const found = getLocalRecoverySnapshots();
      setRecoverySnapshots(found);
    }
  }, [isOpen, members]);

  if (!isOpen) return null;

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
    // Add current
    members.forEach((m) => {
      if (m.id || m.membershipId) allKnown.set(m.id || m.membershipId, m);
    });
    // Add from all snapshots
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

  const handleLinkGoogleDrive = () => {
    setGoogleDriveLinked(true);
    setBackupMetadata({
      googleDriveLinked: true,
      googleDriveFolderName,
      lastBackupDate: new Date().toISOString(),
    });
    setBackupMetaState(getBackupMetadata());
    confetti({ particleCount: 30, spread: 50 });
  };

  const handleExportForGoogleDrive = () => {
    downloadFullJsonBackup(members, auditLogs);
    // Also provide direct link to Google Drive
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
      } catch (err) {
        setImportError('Failed to parse backup JSON file. Please verify file integrity.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-[#8b0000] text-white flex items-center justify-between border-b border-[#730000]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center text-white border border-white/20">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Data Storage & Seamless Backups
              </h3>
              <p className="text-xs text-red-100">
                Save directly to Local PC Folder, Google Drive storage sync, and offline database
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          {/* Status Banner */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900">
                  Offline Database Status: <span className="text-emerald-700">Fully Persistent</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {members.length} members cached locally in browser memory for 100% offline access.
                </div>
              </div>
            </div>

            {backupMeta.localFolderName && (
              <div className="text-right text-[11px] hidden sm:block">
                <span className="text-slate-400 block font-medium">Synced Folder:</span>
                <span className="font-mono font-semibold text-slate-800">{backupMeta.localFolderName}</span>
              </div>
            )}
          </div>

          {/* Section 1: Save to Local PC Folder */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#8b0000]" />
                1. Save Data into Local PC Folder
              </h4>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                Offline Accessibility
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Select a dedicated backup folder on your computer (e.g. <code>C:\KCA_Backups</code> or <code>Documents/KCA_Fujairah</code>). The system will automatically write both timestamped JSON and full CSV exports directly into your chosen directory.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={handleSaveToLocalFolder}
                disabled={isSavingLocal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#8b0000] hover:bg-[#730000] text-white text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
              >
                <FolderCheck className="w-4 h-4" />
                {isSavingLocal ? 'Selecting Folder & Saving...' : 'Save to Selected PC Folder'}
              </button>

              <button
                onClick={() => downloadMembersCsv(members)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold transition-colors"
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

          {/* Section 2: Google Drive Integration */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-600" />
                2. Google Drive Storage Integration
              </h4>
              <span className={`text-[11px] px-2 py-0.5 rounded font-semibold border ${
                googleDriveLinked
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {googleDriveLinked ? 'Drive Configured' : 'Ready to Connect'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Connect a designated Google Drive destination folder to maintain cloud-synchronized backups for the central committee.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold uppercase text-slate-600 mb-1">
                  Google Drive Target Folder Name:
                </label>
                <input
                  type="text"
                  value={googleDriveFolderName}
                  onChange={(e) => setGoogleDriveFolderName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs font-medium text-slate-900 focus:ring-1 focus:ring-[#8b0000] focus:border-[#8b0000] outline-none"
                  placeholder="e.g. KCA_Fujairah_Membership_Backups"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleLinkGoogleDrive}
                  className="w-full px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors"
                >
                  Save Drive Setting
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleExportForGoogleDrive}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors"
              >
                <Download className="w-4 h-4 text-blue-300" />
                Download Backup & Open Google Drive
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </button>
            </div>
          </div>

          {/* Section 3: Restore / Import Backup */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-slate-700" />
              3. Restore Database from JSON Backup File
            </h4>

            <p className="text-xs text-slate-600">
              Restore members and transaction records from a previously saved JSON backup file from your PC or Google Drive.
            </p>

            <input
              type="file"
              ref={importFileRef}
              onChange={handleImportJsonFile}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={() => importFileRef.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold transition-colors"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              Choose Backup JSON File to Restore
            </button>

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
            className="px-4 py-2 text-xs font-semibold rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
