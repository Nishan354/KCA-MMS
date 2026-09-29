import { ThemePreset } from './theme';

export interface PortalBrandingConfig {
  portalName: string; // e.g. "Kairali Cultural Association Fujairah"
  shortName: string; // e.g. "KCA-MMS" or "KCA FUJAIRAH"
  subtitle: string; // e.g. "Official Membership & Management System"
  jurisdiction: string; // e.g. "Fujairah • East Coast UAE"
  affiliationText: string; // e.g. "NORKA Roots Affiliated"
  contactEmail: string; // e.g. "kairalicaf@gmail.com"
  contactPhone: string; // e.g. "+971 9 222 3456"
  customLogoUrl?: string | null;
  appIconUrl?: string | null;
  theme?: string | ThemePreset;
  primaryColor?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_PORTAL_CONFIG: PortalBrandingConfig = {
  portalName: 'Kairali Cultural Association Fujairah',
  shortName: 'KCA-MMS',
  subtitle: 'Official Membership & Management System',
  jurisdiction: 'Fujairah • East Coast UAE',
  affiliationText: 'NORKA Roots Affiliated',
  contactEmail: 'kairalicaf@gmail.com',
  contactPhone: '+971 9 222 3456',
  customLogoUrl: null,
  appIconUrl: null,
  theme: 'crimson-kerala',
  primaryColor: '#8b0000',
};

export const STORAGE_KEY_PORTAL_CONFIG = 'kca_fujairah_portal_config_v2';
