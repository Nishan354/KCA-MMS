export interface ThemePreset {
  id: string;
  name: string;
  subtitle?: string;
  primary: string; // e.g. '#8b0000'
  primaryHover: string; // e.g. '#730000'
  primaryLight: string; // e.g. '#fef2f2'
  primaryBorder: string; // e.g. '#730000'
  accent: string; // e.g. '#f59e0b'
  surface?: string;
  badge?: string;
  isCustom?: boolean;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'kca_maroon',
    name: 'KCA Heritage Maroon',
    subtitle: 'Official Kairali Cultural Association Crimson Palette',
    primary: '#881337',
    primaryHover: '#700c2b',
    primaryLight: '#fff1f2',
    primaryBorder: '#9f1239',
    accent: '#f59e0b',
    badge: 'Official',
  },
  {
    id: 'obsidian_crimson',
    name: 'Obsidian & Crimson Luxe',
    subtitle: 'Ultra-modern dark slate with fiery crimson accents',
    primary: '#0f172a',
    primaryHover: '#020617',
    primaryLight: '#f8fafc',
    primaryBorder: '#1e293b',
    accent: '#e11d48',
    badge: 'Sleek Dark',
  },
  {
    id: 'royal_navy',
    name: 'Nordic Midnight Navy',
    subtitle: 'High-contrast Scandinavian deep blue executive look',
    primary: '#1e293b',
    primaryHover: '#0f172a',
    primaryLight: '#f1f5f9',
    primaryBorder: '#334155',
    accent: '#38bdf8',
    badge: 'Executive',
  },
  {
    id: 'emerald_green',
    name: 'Emerald Kerala Green',
    subtitle: 'Rich Malabar deep forest green with gold trim',
    primary: '#064e3b',
    primaryHover: '#022c22',
    primaryLight: '#ecfdf5',
    primaryBorder: '#065f46',
    accent: '#10b981',
    badge: 'Malabar',
  },
  {
    id: 'deep_indigo',
    name: 'Deep Sapphire & Violet',
    subtitle: 'Vibrant modern tech and organization aesthetic',
    primary: '#3730a3',
    primaryHover: '#312e81',
    primaryLight: '#eef2ff',
    primaryBorder: '#4338ca',
    accent: '#818cf8',
    badge: 'Modern',
  },
  {
    id: 'golden_bronze',
    name: 'UAE Desert Gold & Bronze',
    subtitle: 'Prestigious Emirati golden amber & warm charcoal',
    primary: '#78350f',
    primaryHover: '#451a03',
    primaryLight: '#fefce8',
    primaryBorder: '#92400e',
    accent: '#d97706',
    badge: 'Emirates',
  },
  {
    id: 'slate_charcoal',
    name: 'Titanium Slate Minimal',
    subtitle: 'Clean architectural monochrome slate design',
    primary: '#18181b',
    primaryHover: '#09090b',
    primaryLight: '#f4f4f5',
    primaryBorder: '#27272a',
    accent: '#64748b',
    badge: 'Minimal',
  },
  {
    id: 'teal_marine',
    name: 'Gulf Marina Teal',
    subtitle: 'Fujairah coastal turquoise and deep sea navy',
    primary: '#115e59',
    primaryHover: '#134e4a',
    primaryLight: '#f0fdfa',
    primaryBorder: '#0f766e',
    accent: '#14b8a6',
    badge: 'Coastal',
  },
];

export const STORAGE_KEY_THEME = 'kca_fujairah_theme_v1';

