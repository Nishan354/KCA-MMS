import { ThemePreset, THEME_PRESETS, STORAGE_KEY_THEME } from '../types/theme';

/**
 * Converts a hex color string to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Darkens a hex color by a given percentage (0-100)
 */
function adjustBrightness(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 + percent / 100;
  const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
  const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
  const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
}

/**
 * Generates full ThemePreset from any arbitrary primary hex color
 */
export function generateThemeFromPrimary(primaryHex: string, name: string = 'Custom Theme'): ThemePreset {
  const primaryHover = adjustBrightness(primaryHex, -18);
  const primaryBorder = adjustBrightness(primaryHex, -22);
  const primaryLight = adjustBrightness(primaryHex, 90);

  return {
    id: `custom_${primaryHex.replace('#', '')}`,
    name,
    primary: primaryHex,
    primaryHover,
    primaryLight,
    primaryBorder,
    accent: '#f59e0b',
    isCustom: true,
  };
}

/**
 * Loads the active theme from localStorage or returns the default KCA Maroon theme
 */
export function loadSavedTheme(): ThemePreset {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_THEME);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.primary) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load theme from storage:', e);
  }
  return THEME_PRESETS[0];
}

/**
 * Saves and applies a theme preset across the entire page DOM
 */
export function saveAndApplyTheme(theme: ThemePreset): void {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, JSON.stringify(theme));
  } catch (e) {
    console.warn('Failed to save theme to storage:', e);
  }
  applyThemeToCss(theme);

  // Dispatch event for other tabs/components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kca-theme-changed', { detail: theme }));
  }
}

/**
 * Injects CSS variables onto :root to change the site-wide colors dynamically
 */
export function applyThemeToCss(theme: ThemePreset): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-primary-hover', theme.primaryHover);
  root.style.setProperty('--color-primary-light', theme.primaryLight);
  root.style.setProperty('--color-primary-border', theme.primaryBorder);
  root.style.setProperty('--color-primary-accent', theme.accent);

  const rgb = hexToRgb(theme.primary);
  root.style.setProperty('--color-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
}
