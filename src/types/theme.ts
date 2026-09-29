export interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryBorder: string;
  accent: string;
  description?: string;
  subtitle?: string;
  badge?: string;
  bannerBg?: string;
  isCustom?: boolean;
}

export const STORAGE_KEY_THEME = 'kca_fujairah_active_theme_v2';

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'kca_maroon',
    name: 'KCA Deep Maroon (Official)',
    primary: '#8b0000',
    primaryHover: '#700000',
    primaryLight: '#fff1f2',
    primaryBorder: '#fda4af',
    accent: '#f59e0b',
    description: 'Official Kairali Fujairah signature heritage crimson',
  },
  {
    id: 'kerala_emerald',
    name: 'Emerald Oasis Green',
    primary: '#065f46',
    primaryHover: '#044e3a',
    primaryLight: '#ecfdf5',
    primaryBorder: '#6ee7b7',
    accent: '#34d399',
    description: 'Fresh evergreen and rainforest hues of God\'s own country',
  },
  {
    id: 'gulf_sapphire',
    name: 'Gulf Sapphire Blue',
    primary: '#1e3a8a',
    primaryHover: '#172e6e',
    primaryLight: '#eff6ff',
    primaryBorder: '#93c5fd',
    accent: '#38bdf8',
    description: 'Deep ocean navy and Arabian Sea royal sapphire',
  },
  {
    id: 'royal_amethyst',
    name: 'Royal Amethyst Purple',
    primary: '#581c87',
    primaryHover: '#441469',
    primaryLight: '#faf5ff',
    primaryBorder: '#d8b4fe',
    accent: '#c084fc',
    description: 'Imperial violet for cultural elegance, festivals and arts',
  },
  {
    id: 'corporate_slate',
    name: 'Corporate Slate & Steel',
    primary: '#0f172a',
    primaryHover: '#020617',
    primaryLight: '#f8fafc',
    primaryBorder: '#cbd5e1',
    accent: '#38bdf8',
    description: 'Ultra-clean minimalist executive slate and graphite',
  },
  {
    id: 'amber_heritage',
    name: 'Golden Sand & Terracotta',
    primary: '#9a3412',
    primaryHover: '#7c2d12',
    primaryLight: '#fff7ed',
    primaryBorder: '#fdba74',
    accent: '#f59e0b',
    description: 'Warm gold and terracotta celebrating UAE & Onam harvest',
  },
];
