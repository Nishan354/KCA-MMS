import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Terminal,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Laptop,
  Wifi,
  Sparkles,
  Server,
  FolderOpen,
  Play,
} from 'lucide-react';
import { downloadSystemDocumentationPdf } from '../utils/systemDocumentationPdfGenerator';
import { loadSavedTheme } from '../utils/theme';
import { ThemePreset } from '../types/theme';

interface SystemManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export const SystemManualModal: React.FC<SystemManualModalProps> = ({
  isOpen,
  onClose,
  userName = 'KCA System Administration',
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedBatch, setCopiedBatch] = useState(false);
  const [copiedFirewall, setCopiedFirewall] = useState(false);
  const [theme, setTheme] = useState<ThemePreset>(() => loadSavedTheme());

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      setTheme(e?.detail || loadSavedTheme());
    };
    window.addEventListener('kca-theme-changed', handleThemeChange);
    return () => window.removeEventListener('kca-theme-changed', handleThemeChange);
  }, []);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const windowsSteps = [
    {
      step: 'Step 1',
      title: 'Verify Node.js Environment',
      command: 'node -v\nnpm -v',
      desc: 'Verify that Node.js v18.x or v20.x+ is installed. If not installed, download the official Windows Installer (.msi) from https://nodejs.org',
    },
    {
      step: 'Step 2',
      title: 'Create Working Directory on Drive C:',
      command: 'mkdir C:\\KCA-Fujairah\ncd /d C:\\KCA-Fujairah',
      desc: 'Creates the dedicated application directory and navigates into it in Command Prompt (cmd) or PowerShell.',
    },
    {
      step: 'Step 3',
      title: 'Clone Repository or Extract Files',
      command: 'git clone <repo-url> .\nREM Or extract all project files from ZIP directly into C:\\KCA-Fujairah',
      desc: 'Populates the root folder with package.json, source code, and configuration assets.',
    },
    {
      step: 'Step 4',
      title: 'Install All Application Packages',
      command: 'npm install',
      desc: 'Installs all dependencies (React, Vite, Tailwind CSS, Lucide icons, jsPDF, offline database engines) into node_modules.',
    },
    {
      step: 'Step 5',
      title: 'Compile Production Optimized Bundle',
      command: 'npm run build',
      desc: 'Runs TypeScript compiler and Vite production builder to generate ultra-hardened static files inside the dist/ directory.',
    },
    {
      step: 'Step 6',
      title: 'Launch Local Production Server (Port 3000)',
      command: 'npx serve -s dist -l 3000',
      desc: 'Spins up high-speed local server on http://localhost:3000 with offline cache and instant loading.',
    },
    {
      step: 'Step 7',
      title: 'Launch as Standalone Windows Desktop App',
      command: 'start msedge --app=http://localhost:3000',
      desc: 'Opens the application in clean standalone desktop window mode (PWA) with zero browser URL bar or tab distractions.',
    },
  ];

  const batchScriptContent = `@echo off
title KCA Fujairah Management Portal
echo ========================================================
echo Starting KCA Fujairah Central Register & Management System
echo ========================================================
cd /d C:\\KCA-Fujairah
start "" msedge --app=http://localhost:3000
npx serve -s dist -l 3000
pause`;

  const handleDownloadBatchFile = () => {
    const blob = new Blob([batchScriptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'start-kca.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-fadeIn">
        {/* Modal Header: Solid Theme Color */}
        <div
          className="px-6 py-4 text-white flex items-center justify-between border-b"
          style={{
            backgroundColor: theme.primary,
            borderColor: theme.primaryHover,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0 shadow-xs">
              <FileText className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Official System Documentation</span>
              </div>
              <h3 className="font-display font-black text-lg sm:text-xl text-white">
                KCA Fujairah System Manual &amp; Windows PC Setup Guide
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadSystemDocumentationPdf(userName)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer border border-white/30"
              title="Download Full 3-Page System Manual PDF"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Export PDF Manual</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable Documentation */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-xs">
          {/* Quick Notice Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Laptop className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-950 text-sm">
                Complete Command-Line Setup for Windows 10, 11 &amp; Windows Server
              </h4>
              <p className="text-amber-900/90 text-xs mt-0.5">
                Follow these standard commands in Windows Command Prompt (<code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">cmd.exe</code>) or Windows PowerShell to run the KCA Fujairah Central Register locally and completely offline.
              </p>
            </div>
          </div>

          {/* Section: 7-Step Command-Line Setup */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-display font-black text-sm text-slate-900 uppercase tracking-wide">
              <Terminal className="w-4 h-4" style={{ color: theme.primary }} />
              <span>Windows PC Command-Line Installation Steps</span>
            </div>

            <div className="space-y-3">
              {windowsSteps.map((step, idx) => (
                <div
                  key={step.step}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider font-mono"
                        style={{ backgroundColor: theme.primary }}
                      >
                        {step.step}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">{step.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(step.command, idx)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-2.5 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed select-all">
                    {step.command}
                  </pre>

                  <p className="text-slate-600 text-[11.5px] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section: 1-Click Batch Launcher (start-kca.bat) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-display font-black text-sm text-slate-900 uppercase tracking-wide">
                <Play className="w-4 h-4 text-emerald-600" />
                <span>1-Click Windows Auto-Launch Batch File (start-kca.bat)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(batchScriptContent);
                    setCopiedBatch(true);
                    setTimeout(() => setCopiedBatch(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
                >
                  {copiedBatch ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBatch ? 'Copied Script!' : 'Copy Script'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadBatchFile}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download start-kca.bat</span>
                </button>
              </div>
            </div>

            <p className="text-slate-600 text-xs">
              Save this file as <code className="font-mono font-bold bg-slate-100 px-1 py-0.5 rounded">C:\KCA-Fujairah\start-kca.bat</code> on your Windows PC. Whenever office staff double-click it, the local server and standalone desktop window open automatically in one second:
            </p>

            <pre className="p-3 rounded-lg bg-slate-950 text-amber-300 font-mono text-[11px] overflow-x-auto leading-relaxed select-all">
              {batchScriptContent}
            </pre>
          </div>

          {/* Section: Office LAN Access & Windows Defender Firewall */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-display font-black text-sm text-slate-900 uppercase tracking-wide">
                <Wifi className="w-4 h-4 text-blue-600" />
                <span>Office LAN Sharing &amp; Windows Defender Firewall</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('netsh advfirewall firewall add rule name="KCA Portal" dir=in action=allow protocol=TCP localport=3000');
                  setCopiedFirewall(true);
                  setTimeout(() => setCopiedFirewall(false), 2000);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
              >
                {copiedFirewall ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFirewall ? 'Copied Firewall Rule!' : 'Copy Firewall Command'}</span>
              </button>
            </div>

            <p className="text-slate-600 text-xs">
              To allow other office PCs, laptops, and tablets on the same Wi-Fi / LAN to access the portal:
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900 text-white">
                <div className="text-[10px] text-slate-400 font-sans mb-1 font-bold">1. Open Windows Defender Firewall Port 3000 (Run in Administrator cmd):</div>
                <div className="text-amber-400">netsh advfirewall firewall add rule name=&quot;KCA Portal&quot; dir=in action=allow protocol=TCP localport=3000</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 text-white">
                <div className="text-[10px] text-slate-400 font-sans mb-1 font-bold">2. Start Server with LAN Binding:</div>
                <div className="text-emerald-400">npx serve -s dist -l 3000 --listen tcp://0.0.0.0:3000</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 text-white">
                <div className="text-[10px] text-slate-400 font-sans mb-1 font-bold">3. Find Host PC IP Address:</div>
                <div className="text-sky-300">ipconfig <span className="text-slate-400 font-sans">(Look for IPv4 Address e.g. 192.168.1.150)</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>KCA Fujairah Management Portal &bull; Standalone &amp; Offline Compatible</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadSystemDocumentationPdf(userName)}
              style={{ backgroundColor: theme.primary }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs transition-opacity hover:opacity-90 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Full PDF Manual</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
