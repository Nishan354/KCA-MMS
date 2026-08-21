import { ThemePreset } from './theme';

// ==========================================
// USER & ROLE DEFINITIONS
// ==========================================
export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  email?: string;
  role: UserRole; // 'admin' or 'user'
  createdAt?: string;
}

// ==========================================
// PORTAL BRANDING CONFIGURATION
// ==========================================
export interface PortalBrandingConfig {
  portalName: string; // e.g. "Kairali Cultural Association Fujairah"
  shortName: string; // e.g. "KCA FUJAIRAH"
  subtitle: string; // e.g. "Official Central Register & Membership Portal"
  jurisdiction: string; // e.g. "Fujairah • East Coast UAE"
  affiliationText: string; // e.g. "NORKA Roots Affiliated"
  contactEmail: string; // e.g. "contact@kcafujairah.com"
  contactPhone: string; // e.g. "+971 9 222 3456"
  customLogoUrl?: string | null;
  theme?: ThemePreset;
  primaryColor?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_PORTAL_CONFIG: PortalBrandingConfig = {
  portalName: 'Kairali Cultural Association Fujairah',
  shortName: 'KCA FUJAIRAH',
  subtitle: 'Official Central Register & Membership Portal',
  jurisdiction: 'Fujairah • East Coast UAE',
  affiliationText: 'NORKA Roots Affiliated',
  contactEmail: 'contact@kcafujairah.com',
  contactPhone: '+971 9 222 3456',
  customLogoUrl: null,
};

export const STORAGE_KEY_PORTAL_CONFIG = 'kca_fujairah_portal_config_v2';
