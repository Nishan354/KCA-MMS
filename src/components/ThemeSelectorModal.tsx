import React, { useState, useEffect } from 'react';
import { ThemePreset, THEME_PRESETS } from '../types/theme';
import { loadSavedTheme, saveAndApplyTheme, generateThemeFromPrimary } from '../utils/theme';
import {
  Palette,
  Check,
  RotateCcw,
  Sparkles,
  X,
  Sliders,
  CheckCircle2,
  Brush,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ isOpen, onClose }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>(() => loadSavedTheme());
  const [customHex, setCustomHex] = useState('#881337');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const active = loadSavedTheme();
      setCurrentTheme(active);
      setCustomHex(active.primary);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: ThemePreset) => {
    setCurrentTheme(preset);
    saveAndApplyTheme(preset);
    setShowSuccess(true);
    confetti({ particleCount: 30, spread: 60 });
    setTimeout(() => setShowSuccess(false), 2200);
  };

  const handleApplyCustomColor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customHex) return;
    const generated = generateThemeFromPrimary(customHex, 'Custom Modern Theme');
    setCurrentTheme(generated);
    saveAndApplyTheme(generated);
    setShowSuccess(true);
    confetti({ particleCount: 35, spread: 65 });
    setTimeout(() => setShowSuccess(false), 2200);
  };

  const handleResetDefault = () => {
    const defaultTheme = THEME_PRESETS[0];
    setCurrentTheme(defaultTheme);
    saveAndApplyTheme(defaultTheme);
    setCustomHex(defaultTheme.primary);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl flex flex-col overflow-hidden my-auto animate-fadeIn">
        {/* Header */}
        <div
          className="px-6 py-4 text-white flex items-center justify-between transition-colors duration-300 border-b border-black/10"
          style={{ backgroundColor: currentTheme.primary }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white border border-white/20 shadow-xs">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white tracking-tight flex items-center gap-2">
                Executive Portal Themes &amp; Color Scheme
              </h3>
              <p className="text-xs text-white/80">
                Instantly style navigation, cards, accent lines, and receipts across all views
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Active Alert */}
          {showSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-medium flex items-center gap-2 animate-fadeIn shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Theme updated and applied across the entire portal instantly!</span>
            </div>
          )}

          {/* Current Live Preview Banner */}
          <div
            className="p-4 rounded-xl text-white transition-all shadow-sm flex items-center justify-between"
            style={{ backgroundColor: currentTheme.primary }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center border border-white/20 font-bold text-sm">
                Aa
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/75">
                  Currently Active Theme
                </div>
                <div className="font-bold text-sm text-white">{currentTheme.name}</div>
                {currentTheme.subtitle && (
                  <div className="text-[11px] text-white/70">{currentTheme.subtitle}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs bg-black/25 px-2.5 py-1 rounded-md border border-white/20 font-bold">
                {currentTheme.primary}
              </span>
            </div>
          </div>

          {/* Preset Palettes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Curated Design Themes
              </label>
              <span className="text-[11px] text-slate-500 font-medium">Click any theme to activate</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {THEME_PRESETS.map((preset) => {
                const isSelected =
                  currentTheme.id === preset.id ||
                  currentTheme.primary.toLowerCase() === preset.primary.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 ring-2 ring-slate-900 bg-slate-50/90 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2 w-full">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg shadow-xs border border-white flex items-center justify-center shrink-0"
                          style={{ backgroundColor: preset.primary }}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 leading-tight">
                            {preset.name}
                          </div>
                          {preset.subtitle && (
                            <div className="text-[10px] text-slate-500 line-clamp-1">
                              {preset.subtitle}
                            </div>
                          )}
                        </div>
                      </div>

                      {preset.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                          {preset.badge}
                        </span>
                      )}
                    </div>

                    {/* Color Swatch Bar */}
                    <div className="flex items-center gap-1.5 mt-1 pt-2 border-t border-slate-100">
                      <div
                        className="h-2 rounded-full flex-1"
                        style={{ backgroundColor: preset.primary }}
                        title="Primary"
                      />
                      <div
                        className="h-2 rounded-full w-6"
                        style={{ backgroundColor: preset.primaryHover }}
                        title="Dark Accent"
                      />
                      <div
                        className="h-2 rounded-full w-4"
                        style={{ backgroundColor: preset.accent }}
                        title="Highlight"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Hex Color Picker */}
          <div className="pt-4 border-t border-slate-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>Custom Hex Palette Generator</span>
            </label>

            <form onSubmit={handleApplyCustomColor} className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 border border-slate-300 rounded-xl p-1.5 bg-slate-50">
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  placeholder="#881337"
                  className="w-24 px-2.5 py-1 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-md outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                style={{ backgroundColor: currentTheme.primary }}
              >
                <Brush className="w-3.5 h-3.5" />
                <span>Apply Custom Theme</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleResetDefault}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium py-1 px-2.5 rounded-lg hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset to Official Maroon</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold cursor-pointer transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

