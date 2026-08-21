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

// Plain text password matching login component check
export const INITIAL_ADMIN_ACCOUNTS = [
  {
    id: 'usr_admin_main',
    username: 'admin',
    password: '12345',
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