import { PortalBrandingConfig } from '../types/portal';

export const INITIAL_PORTAL_CONFIG: PortalBrandingConfig = {
  portalName: 'Kairali Cultural Association Fujairah',
  shortName: 'KCA FUJAIRAH',
  subtitle: 'Official Central Register & Membership Portal',
  jurisdiction: 'Fujairah • East Coast UAE',
  affiliationText: 'NORKA Roots Affiliated',
  contactEmail: 'contact@kcafujairah.com',
  contactPhone: '+971 9 222 3456',
  customLogoUrl: null,
};

export const INITIAL_ADMIN_ACCOUNTS = [
  {
    id: 'usr_admin_main',
    username: 'admin',
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // SHA-256 for 12345 or handle authentication via runtime state
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_UNITS = ['Fujairah Town', 'Dibba', 'Khorfakkan', 'Kalba'];
export const INITIAL_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const INITIAL_MEMBERS = [];
export const INITIAL_FINANCE_TRANSACTIONS = [];
export const INITIAL_INVENTORY_ITEMS = [];
export const INITIAL_CLASSES = [];
export const INITIAL_AUDIT_LOGS = [];
export const INITIAL_CUSTOM_FIELDS = [];