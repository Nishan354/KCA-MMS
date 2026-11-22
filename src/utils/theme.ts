import { ThemePreset, THEME_PRESETS, STORAGE_KEY_THEME } from '../types/theme';

/**
 * Known alias mapping to translate organizational template themes or legacy names
 * to canonical ThemePreset objects.
 */
const THEME_ALIASES: Record<string, string> = {
  'crimson-kerala': 'kca_maroon',
  'kca-maroon': 'kca_maroon',
  'kca_maroon': 'kca_maroon',
  'sapphire-blue': 'gulf_sapphire',
  'gulf-sapphire': 'gulf_sapphire',
  'gulf_sapphire': 'gulf_sapphire',
  'emerald-green': 'kerala_emerald',
  'kerala-emerald': 'kerala_emerald',
  'kerala_emerald': 'kerala_emerald',
  'royal-purple': 'royal_amethyst',
  'royal-amethyst': 'royal_amethyst',
  'royal_amethyst': 'royal_amethyst',
  'corporate-slate': 'corporate_slate',
  'corporate_slate': 'corporate_slate',
  'amber-gold': 'amber_heritage',
  'amber-heritage': 'amber_heritage',
  'amber_heritage': 'amber_heritage',
};

/**
 * Converts a hex color string to RGB values with complete defensive guards
 */
export function hexToRgb(hex?: string | null): { r: number; g: number; b: number } {
  if (!hex || typeof hex !== 'string') {
    return { r: 139, g: 0, b: 0 }; // Default KCA Maroon #8b0000
  }
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) {
    return { r: 139, g: 0, b: 0 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function darkenColor(hex?: string | null, percent: number = 0): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = Math.max(0, 1 - Math.abs(percent) / 100);
  const newR = Math.round(r * factor);
  const newG = Math.round(g * factor);
  const newB = Math.round(b * factor);
  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
}

export function lightenColor(hex?: string | null, percent: number = 0): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = Math.min(1, Math.max(0, percent / 100));
  const newR = Math.round(r + (255 - r) * factor);
  const newG = Math.round(g + (255 - g) * factor);
  const newB = Math.round(b + (255 - b) * factor);
  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
}

export function adjustBrightness(hex?: string | null, percent: number = 0): string {
  if (percent >= 0) {
    return lightenColor(hex, percent);
  }
  return darkenColor(hex, Math.abs(percent));
}

/**
 * Generates full ThemePreset from any arbitrary primary hex color
 */
export function generateThemeFromPrimary(primaryHex?: string | null, name: string = 'Custom Theme'): ThemePreset {
  const safePrimary = primaryHex && typeof primaryHex === 'string' && primaryHex.trim() ? primaryHex.trim() : '#8b0000';
  const cleanHex = safePrimary.startsWith('#') ? safePrimary : `#${safePrimary}`;
  const primaryHover = darkenColor(cleanHex, 15);
  const primaryBorder = lightenColor(cleanHex, 70);
  const primaryLight = lightenColor(cleanHex, 93);

  return {
    id: `custom_${cleanHex.replace('#', '')}`,
    name,
    primary: cleanHex,
    primaryHover,
    primaryLight,
    primaryBorder,
    accent: '#f59e0b',
    isCustom: true,
  };
}

/**
 * Normalizes any theme input (ThemePreset object, theme id string, alias string, or raw hex color)
 * into a valid, complete ThemePreset object.
 */
export function resolveThemePreset(themeInput?: ThemePreset | string | null | any): ThemePreset {
  if (!themeInput) {
    return THEME_PRESETS[0];
  }

  // If already a ThemePreset object with a primary color
  if (typeof themeInput === 'object') {
    if (themeInput.primary && typeof themeInput.primary === 'string') {
      const primary = themeInput.primary.trim();
      return {
        id: themeInput.id || `theme_${primary.replace('#', '')}`,
        name: themeInput.name || 'Active Theme',
        primary,
        primaryHover: themeInput.primaryHover || darkenColor(primary, 15),
        primaryLight: themeInput.primaryLight || lightenColor(primary, 92),
        primaryBorder: themeInput.primaryBorder || lightenColor(primary, 72),
        accent: themeInput.accent || '#f59e0b',
        description: themeInput.description,
        subtitle: themeInput.subtitle,
        badge: themeInput.badge,
        bannerBg: themeInput.bannerBg,
        isCustom: themeInput.isCustom ?? false,
      };
    }

    // Object may contain id or theme property
    if (themeInput.id && typeof themeInput.id === 'string') {
      return resolveThemePreset(themeInput.id);
    }
    if (themeInput.theme) {
      return resolveThemePreset(themeInput.theme);
    }
    if (themeInput.primaryColor) {
      return resolveThemePreset(themeInput.primaryColor);
    }
  }

  // If string (ID, alias, JSON, or hex color)
  if (typeof themeInput === 'string') {
    const raw = themeInput.trim();

    // Try parsing if string is JSON
    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const parsed = JSON.parse(raw);
        return resolveThemePreset(parsed);
      } catch {
        // continue to normal string resolution
      }
    }

    // 1. Direct ID match in canonical THEME_PRESETS
    const matched = THEME_PRESETS.find((p) => p.id === raw || p.id.toLowerCase() === raw.toLowerCase());
    if (matched) return matched;

    // 2. Check alias map
    const aliasId = THEME_ALIASES[raw] || THEME_ALIASES[raw.toLowerCase()];
    if (aliasId) {
      const aliasPreset = THEME_PRESETS.find((p) => p.id === aliasId);
      if (aliasPreset) return aliasPreset;
    }

    // 3. Hex color match (e.g. "#8b0000" or "8b0000")
    const cleanHex = raw.replace('#', '');
    if (/^[0-9a-fA-F]{3,8}$/.test(cleanHex)) {
      return generateThemeFromPrimary(`#${cleanHex}`, 'Custom Brand Color');
    }
  }

  // Default fallback to official KCA Maroon
  return THEME_PRESETS[0];
}

/**
 * Loads the active theme from localStorage or returns the default KCA Maroon theme
 */
export function loadSavedTheme(): ThemePreset {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_THEME);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return resolveThemePreset(parsed);
      } catch {
        return resolveThemePreset(raw);
      }
    }
  } catch (e) {
    console.warn('Failed to load theme from storage:', e);
  }
  return THEME_PRESETS[0];
}

/**
 * Saves and applies a theme preset across the entire page DOM
 * Accepts a ThemePreset, preset ID string, alias, or hex color.
 */
export function saveAndApplyTheme(themeInput?: ThemePreset | string | null): ThemePreset {
  const resolved = resolveThemePreset(themeInput);
  try {
    localStorage.setItem(STORAGE_KEY_THEME, JSON.stringify(resolved));
  } catch (e) {
    console.warn('Failed to save theme to storage:', e);
  }
  applyThemeToCss(resolved);

  // Dispatch event for other tabs/components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kca-theme-changed', { detail: resolved }));
  }
  return resolved;
}

/**
 * Injects CSS variables and dynamic overrides onto :root to change the site-wide colors dynamically
 * Accepts a ThemePreset, preset ID string, alias, or hex color.
 */
export function applyThemeToCss(themeInput?: ThemePreset | string | null): void {
  if (typeof document === 'undefined') return;

  const theme = resolveThemePreset(themeInput);
  const root = document.documentElement;
  const rgb = hexToRgb(theme.primary);
  const primaryDark = darkenColor(theme.primary, 32);
  const primaryHover = theme.primaryHover || darkenColor(theme.primary, 15);
  const primaryLight = theme.primaryLight || lightenColor(theme.primary, 92);
  const primaryBorder = theme.primaryBorder || lightenColor(theme.primary, 72);
  const accent = theme.accent || '#f59e0b';

  // Compute rich dark gradient stops for sidebar according to primary hue
  const sidebarFrom = darkenColor(theme.primary, 82);
  const sidebarVia = darkenColor(theme.primary, 74);
  const sidebarTo = darkenColor(theme.primary, 88);

  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-primary-hover', primaryHover);
  root.style.setProperty('--color-primary-light', primaryLight);
  root.style.setProperty('--color-primary-border', primaryBorder);
  root.style.setProperty('--color-primary-accent', accent);
  root.style.setProperty('--color-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  root.style.setProperty('--color-primary-dark', primaryDark);
  root.style.setProperty('--color-primary-subtle', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`);
  root.style.setProperty('--theme-sidebar-from', sidebarFrom);
  root.style.setProperty('--theme-sidebar-via', sidebarVia);
  root.style.setProperty('--theme-sidebar-to', sidebarTo);
  root.style.setProperty('--color-surface-bg', '#f8fafc');
  root.style.setProperty('--color-surface-card', '#ffffff');
  root.style.setProperty('--color-surface-border', '#e2e8f0');

  // Inject or update dynamic style element so all Tailwind classes mapped to brand colors update instantaneously
  let styleEl = document.getElementById('kca-dynamic-theme-style') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'kca-dynamic-theme-style';
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    :root {
      --color-primary: ${theme.primary};
      --color-primary-hover: ${primaryHover};
      --color-primary-dark: ${primaryDark};
      --color-primary-light: ${primaryLight};
      --color-primary-border: ${primaryBorder};
      --color-primary-accent: ${accent};
      --color-primary-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};
      --theme-sidebar-from: ${sidebarFrom};
      --theme-sidebar-via: ${sidebarVia};
      --theme-sidebar-to: ${sidebarTo};
    }

    /* Primary buttons, badges and background elements */
    .theme-bg-primary,
    button[class*="bg-[#8b0000]"],
    button[class*="bg-[#700000]"],
    button[class*="bg-[#730000]"],
    button[class*="bg-red-800"],
    button[class*="bg-red-700"],
    button[class*="bg-red-900"],
    div[class*="bg-[#8b0000]"],
    span[class*="bg-[#8b0000]"],
    a[class*="bg-[#8b0000]"],
    [class*="bg-[#881337]"],
    [class*="bg-red-800"] {
      background-color: ${theme.primary} !important;
    }

    button[class*="hover:bg-[#700000]"]:hover,
    button[class*="hover:bg-[#730000]"]:hover,
    button[class*="hover:bg-red-900"]:hover,
    button[class*="hover:bg-red-800"]:hover,
    div[class*="hover:bg-[#700000]"]:hover,
    span[class*="hover:bg-[#700000]"]:hover,
    [class*="hover:bg-[#700000]"]:hover,
    [class*="hover:bg-[#730000]"]:hover,
    [class*="hover:bg-red-900"]:hover,
    [class*="hover:bg-red-800"]:hover {
      background-color: ${primaryHover} !important;
    }

    /* Primary text elements */
    .theme-text-primary,
    [class*="text-[#8b0000]"],
    [class*="text-[#700000]"],
    [class*="text-[#881337]"],
    [class*="text-red-800"],
    [class*="text-red-700"],
    [class*="text-red-900"] {
      color: ${theme.primary} !important;
    }

    /* Primary border elements */
    .theme-border-primary,
    [class*="border-[#8b0000]"],
    [class*="border-[#700000]"],
    [class*="border-[#881337]"],
    [class*="border-red-800"],
    [class*="border-red-700"],
    [class*="border-rose-800"] {
      border-color: ${theme.primary} !important;
    }

    /* Gradients */
    [class*="from-[#8b0000]"],
    [class*="from-red-950"] {
      --tw-gradient-from: ${theme.primary} var(--tw-gradient-from-position) !important;
      --tw-gradient-to: rgb(${rgb.r} ${rgb.g} ${rgb.b} / 0) var(--tw-gradient-to-position) !important;
      --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-position), var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-to) var(--tw-gradient-to-position)) !important;
    }

    [class*="to-[#700000]"],
    [class*="to-[#7a0000]"],
    [class*="to-[#520000]"],
    [class*="to-red-950"] {
      --tw-gradient-to: ${primaryDark} var(--tw-gradient-to-position) !important;
    }

    [class*="via-[#9e0000]"],
    [class*="via-[#a00000]"],
    [class*="via-rose-900"] {
      --tw-gradient-to: rgb(${rgb.r} ${rgb.g} ${rgb.b} / 0) var(--tw-gradient-to-position) !important;
      --tw-gradient-stops: var(--tw-gradient-from) var(--tw-gradient-from-position), ${primaryHover} var(--tw-gradient-via-position), var(--tw-gradient-to) var(--tw-gradient-to-position) !important;
    }

    /* Theme Sidebar dynamic background */
    aside[class*="bg-gradient-to-b"],
    .theme-sidebar {
      background: linear-gradient(180deg, ${sidebarFrom} 0%, ${sidebarVia} 50%, ${sidebarTo} 100%) !important;
    }

    /* Header solid background */
    header.theme-header,
    header[class*="bg-gradient-to-r"],
    header[class*="bg-[#8b0000]"],
    header[class*="bg-red-800"],
    header[class*="bg-red-900"],
    .theme-header-solid,
    .official-header-banner,
    div[class*="bg-gradient-to-r from-[#8b0000]"],
    div[class*="from-red-950 via-rose-900 to-red-950"] {
      background: ${theme.primary} !important;
      background-color: ${theme.primary} !important;
      background-image: none !important;
    }

    /* Mobile drawer panel dynamic background */
    div[class*="from-[#1a0505]"] {
      background: linear-gradient(180deg, ${sidebarFrom} 0%, ${sidebarVia} 50%, ${sidebarTo} 100%) !important;
    }

    .theme-btn-primary {
      background: linear-gradient(135deg, ${theme.primary} 0%, ${primaryHover} 100%) !important;
      box-shadow: 0 2px 8px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28) !important;
    }

    .theme-gradient-banner {
      background: linear-gradient(135deg, ${theme.primary} 0%, ${primaryHover} 50%, ${primaryDark} 100%) !important;
    }

    /* Focus rings & outlines */
    input:focus, select:focus, textarea:focus,
    [class*="focus:ring-[#8b0000]"]:focus {
      outline-color: ${theme.primary} !important;
      --tw-ring-color: ${theme.primary} !important;
    }

    [class*="selection:bg-[#8b0000]"]::selection {
      background-color: ${theme.primary} !important;
    }
  `;

  // Ensure dark class is removed for white app system
  root.classList.remove('dark');
}

export const STORAGE_KEY_DARK_MODE = 'kca_theme_mode';

/**
 * Checks if dark mode is currently active - system operates as white app
 */
export function getIsDarkMode(): boolean {
  return false;
}

/**
 * Sets dark mode on document element, localStorage and dispatches global event
 */
export function setDarkMode(_isDark: boolean = false): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove('dark');
  try {
    localStorage.removeItem(STORAGE_KEY_DARK_MODE);
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kca-darkmode-changed', { detail: { isDark: false } }));
  }
}

/**
 * Toggles dark mode state (maintained for API compatibility, enforces white mode)
 */
export function toggleDarkMode(): boolean {
  setDarkMode(false);
  return false;
}

