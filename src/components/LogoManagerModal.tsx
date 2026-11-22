import React, { useState, useRef, useEffect } from 'react';
import { KcaLogo, useCustomLogo, invalidateLogoCache } from './Logo';
import { saveCustomLogo, resetCustomLogo } from '../utils/storage';
import { optimizeLogoFile } from '../utils/imageOptimizer';
import { pushCloudEntity } from '../utils/cloudSync';
import { invalidateTitleGraphicCache } from '../utils/titleGraphic';
import { X, Upload, RotateCcw, Check, Image as ImageIcon, AlertCircle, Sparkles, Type } from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePortalConfig } from '../hooks/usePortalConfig';
import { BrandTitleLockup } from './BrandTitleLockup';

interface LogoManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOrgSettings?: () => void;
}

export const LogoManagerModal: React.FC<LogoManagerModalProps> = ({
  isOpen,
  onClose,
  onOpenOrgSettings,
}) => {
  const { portalConfig } = usePortalConfig();
  const { customLogo } = useCustomLogo();
  const [previewLogo, setPreviewLogo] = useState<string | null>(customLogo);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPreviewLogo(customLogo);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, customLogo]);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, SVG, or WebP).');
      return;
    }

    try {
      const optimized = await optimizeLogoFile(file, 512);
      if (optimized.dataUrl) {
        setPreviewLogo(optimized.dataUrl);
      } else {
        setErrorMsg('Failed to read image file.');
      }
    } catch {
      setErrorMsg('Failed to process selected logo file.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSave = () => {
    saveCustomLogo(previewLogo);
    invalidateLogoCache();
    invalidateTitleGraphicCache();
    pushCloudEntity('customLogo', previewLogo, 'Logo Admin');

    // Update dynamic browser / electron window favicon
    if (previewLogo) {
      const favEl = document.getElementById('app-favicon') as HTMLLinkElement;
      if (favEl) favEl.href = previewLogo;
    }

    setSuccessMsg(`${portalConfig.shortName || portalConfig.portalName} Logo updated successfully! All ID cards, batch print sheets, certificates & headers are now synchronized.`);
    confetti({ particleCount: 35, spread: 60 });
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleResetToDefault = () => {
    resetCustomLogo();
    invalidateLogoCache();
    invalidateTitleGraphicCache();
    pushCloudEntity('customLogo', null, 'Logo Admin');
    setPreviewLogo(null);
    const favEl = document.getElementById('app-favicon') as HTMLLinkElement;
    if (favEl) favEl.href = '/favicon.ico';
    setSuccessMsg('Reset to official default emblem & vector monogram.');
    setTimeout(() => {
      onClose();
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-auto animate-fadeIn">
        {/* Header */}
        <div
          className="px-6 py-4 text-white flex items-center justify-between border-b border-black/10"
          style={{ backgroundColor: portalConfig.primaryColor || '#8b0000' }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                {portalConfig.shortName || 'Organisation'} Logo Customizer
              </h3>
              <p className="text-xs text-white/90">
                Customize official emblem, window icons, and ID card headers for {portalConfig.portalName}
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

        {/* Content Body */}
        <div className="p-6 space-y-5 text-slate-800">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 font-semibold">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#8b0000] bg-red-50/50 scale-[0.99]'
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-red-100 text-[#8b0000] flex items-center justify-center shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div className="font-semibold text-slate-800 text-sm">
                Click to browse or drag & drop logo here
              </div>
              <p className="text-xs text-slate-500">
                Supports PNG, SVG, JPG, WebP (Transparent background recommended)
              </p>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Live ID Card & Portal Preview:
            </div>
            <div className="flex items-center justify-around p-3 bg-white rounded-lg border border-slate-200">
              <div className="flex flex-col items-center gap-1.5">
                <KcaLogo size={64} customLogoUrl={previewLogo} />
                <span className="text-[11px] font-medium text-slate-600">ID Card Header</span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <KcaLogo size={44} customLogoUrl={previewLogo} />
                <span className="text-[11px] font-medium text-slate-600">Navbar Size</span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <KcaLogo size={32} customLogoUrl={previewLogo} />
                <span className="text-[11px] font-medium text-slate-600">Compact</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {previewLogo
                  ? 'Custom logo loaded. Click "Save & Apply Logo" to update the application.'
                  : 'Currently showing original built-in vector KCA emblem.'}
              </span>
            </div>

            {/* Active Header Title Lockup Summary */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
              <div className="bg-white rounded-md border border-slate-200 px-2.5 py-1.5 flex items-center gap-2 overflow-hidden">
                <BrandTitleLockup
                  styleMode={portalConfig.headerTitleStyle || 'official_lockup'}
                  portalConfig={{ ...portalConfig, customLogoUrl: previewLogo }}
                  variant="compact_card"
                  logoSize={28}
                  primaryColor={portalConfig.primaryColor || '#8b0000'}
                />
              </div>
              {onOpenOrgSettings && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenOrgSettings();
                  }}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors cursor-pointer"
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Customize Title Lockup</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md text-slate-700 hover:text-red-700 hover:bg-red-50 border border-slate-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Original Seal
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-md bg-[#8b0000] hover:bg-[#730000] text-white shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              Save & Apply Logo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
