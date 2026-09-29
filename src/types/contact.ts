// Types for External Contact Bank (Sponsors, Associations, Government, Media & Stakeholders)

export type ContactCategory =
  | 'Sponsor & Patron'
  | 'Government / Embassy / NORKA'
  | 'Community & Cultural Association'
  | 'Media & Press'
  | 'Medical & Healthcare'
  | 'Vendor & Service Provider'
  | 'Educational & Arts Academy'
  | 'Other';

export const CONTACT_CATEGORIES: ContactCategory[] = [
  'Sponsor & Patron',
  'Government / Embassy / NORKA',
  'Community & Cultural Association',
  'Media & Press',
  'Medical & Healthcare',
  'Vendor & Service Provider',
  'Educational & Arts Academy',
  'Other',
];

export interface ContactPerson {
  id: string;
  name: string;
  designation?: string;
  roleDescription?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  isPrimary?: boolean;
}

export interface ContactEntry {
  id: string;
  organizationName: string;
  malayalamName?: string;
  category: ContactCategory;
  unit: string; // e.g. "Global / Central", "Fujairah", "Kalba", "Khorfakhan", "Dibba"
  address?: string;
  city?: string;
  emirate?: string;
  poBox?: string;
  website?: string;
  generalPhone?: string;
  generalEmail?: string;
  notes?: string;
  tags?: string[];
  contacts: ContactPerson[];
  createdAt: string;
  updatedAt?: string;
}

export interface ContactFilterOptions {
  search: string;
  category: string;
  unit: string;
  emirate: string;
}
