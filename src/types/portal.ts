import { ThemePreset } from './theme';
import { IdCardDesignId } from './cardDesign';

export type OrgCategoryType =
  | 'association'
  | 'company'
  | 'society'
  | 'club'
  | 'ngo'
  | 'school'
  | 'other';

export type HeaderTitleStyle = 'standard' | 'official_lockup' | 'title_graphic';

export interface PortalBrandingConfig {
  portalName: string; // e.g. "Kairali Cultural Association Fujairah" or "Acme Corporation"
  shortName: string; // e.g. "KCA-MMS" or "ACME"
  subtitle: string; // e.g. "Official Membership & Management System"
  jurisdiction: string; // e.g. "Fujairah • East Coast UAE" or "Dubai • UAE"
  affiliationText: string; // e.g. "NORKA Roots Affiliated" or "Registered LLC No. 109823"
  contactEmail: string; // e.g. "kairalicaf@gmail.com"
  contactPhone: string; // e.g. "+971 9 222 3456"
  customLogoUrl?: string | null;
  appIconUrl?: string | null;
  theme?: string | ThemePreset;
  primaryColor?: string;
  defaultCardDesign?: IdCardDesignId;
  headerTitleStyle?: HeaderTitleStyle;
  titleLine1?: string;
  titleLine2?: string;
  titleLine3?: string;
  customTitleGraphicUrl?: string | null;
  applyTitleToMemberCards?: boolean;
  applyTitleToStudentCards?: boolean;
  applyTitleToCertificates?: boolean;
  idPrefix?: string; // e.g. "KCA", "EMP", "MEM", "ORG"
  orgType?: OrgCategoryType;
  unitTerm?: string; // e.g. "Unit", "Branch", "Department", "Chapter"
  unitTermPlural?: string; // e.g. "Units", "Branches", "Departments", "Chapters"
  tagline?: string;
  establishedYear?: string;
  websiteUrl?: string;
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
  theme: 'kca_maroon',
  primaryColor: '#8b0000',
  defaultCardDesign: 'classic_wave',
  headerTitleStyle: 'official_lockup',
  titleLine1: 'KAIRALI',
  titleLine2: 'CULTURAL ASSOCIATION',
  titleLine3: 'Fujairah',
  customTitleGraphicUrl: null,
  applyTitleToMemberCards: true,
  applyTitleToStudentCards: true,
  applyTitleToCertificates: true,
  idPrefix: 'KCA',
  orgType: 'association',
  unitTerm: 'Unit',
  unitTermPlural: 'Units',
  tagline: 'Central Management & Membership Register',
  establishedYear: '1978',
  websiteUrl: 'https://kca-fuj-mms.ai.studio',
};

export interface OrgBrandingPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  config: Partial<PortalBrandingConfig>;
}

export const ORG_BRANDING_PRESETS: OrgBrandingPreset[] = [
  {
    id: 'kca_fujairah',
    name: 'KCA Fujairah Cultural Association',
    badge: 'Cultural / Community',
    description: 'Original official setup for Kairali Cultural Association Fujairah with NORKA affiliation and Kerala crimson theme.',
    config: {
      portalName: 'Kairali Cultural Association Fujairah',
      shortName: 'KCA FUJAIRAH',
      subtitle: 'Official Central Register & Membership Portal',
      jurisdiction: 'Fujairah • East Coast UAE',
      affiliationText: 'A Norka affiliated Organisation',
      contactEmail: 'kairalicaf@gmail.com',
      contactPhone: '+971 9 222 3456',
      idPrefix: 'KCA',
      orgType: 'association',
      unitTerm: 'Unit',
      unitTermPlural: 'Units',
      primaryColor: '#8b0000',
      theme: 'kca_maroon',
      defaultCardDesign: 'classic_wave',
    },
  },
  {
    id: 'corporate_company',
    name: 'Corporate & Commercial Enterprise',
    badge: 'Company / Business',
    description: 'Tailored for corporations, LLCs, and private companies with branches, departments, and employee IDs.',
    config: {
      portalName: 'Al Majaz Global Enterprises LLC',
      shortName: 'AL MAJAZ',
      subtitle: 'Corporate Staff & Personnel Management Portal',
      jurisdiction: 'Dubai & Northern Emirates • UAE',
      affiliationText: 'Commercial Reg. No. 1029482 / DED Dubai',
      contactEmail: 'contact@almajaz-global.ae',
      contactPhone: '+971 4 398 2211',
      idPrefix: 'EMP',
      orgType: 'company',
      unitTerm: 'Branch',
      unitTermPlural: 'Branches',
      primaryColor: '#1e3a8a',
      theme: 'gulf_sapphire',
      defaultCardDesign: 'corporate_executive',
    },
  },
  {
    id: 'community_ngo',
    name: 'Non-Profit / NGO / Foundation',
    badge: 'Non-Profit / Charity',
    description: 'Optimized for charitable foundations, humanitarian organizations, and volunteer networks.',
    config: {
      portalName: 'Hope Horizon Community Foundation',
      shortName: 'HOPE FOUNDATION',
      subtitle: 'Volunteer & Beneficiary Registry System',
      jurisdiction: 'United Arab Emirates',
      affiliationText: 'Registered Civil Society & Community Initiative',
      contactEmail: 'info@hopehorizon-uae.org',
      contactPhone: '+971 2 444 8920',
      idPrefix: 'VOL',
      orgType: 'ngo',
      unitTerm: 'Chapter',
      unitTermPlural: 'Chapters',
      primaryColor: '#065f46',
      theme: 'kerala_emerald',
      defaultCardDesign: 'modern_minimalist',
    },
  },
  {
    id: 'sports_social_club',
    name: 'Sports, Recreation & Social Club',
    badge: 'Club / Sports',
    description: 'Ideal for sports clubs, recreational societies, alumni associations, and fitness clubs.',
    config: {
      portalName: 'Emirates Falcons Sports & Recreation Club',
      shortName: 'FALCONS CLUB',
      subtitle: 'Official Member & Athlete Management System',
      jurisdiction: 'Abu Dhabi & Al Ain • UAE',
      affiliationText: 'Registered Club Federation of UAE',
      contactEmail: 'membership@falconsclub.ae',
      contactPhone: '+971 2 688 1234',
      idPrefix: 'MEM',
      orgType: 'club',
      unitTerm: 'Division',
      unitTermPlural: 'Divisions',
      primaryColor: '#581c87',
      theme: 'royal_amethyst',
      defaultCardDesign: 'vibrant_diagonal',
    },
  },
  {
    id: 'academic_institute',
    name: 'Academy, College & Training Center',
    badge: 'Academic / School',
    description: 'Configured for academies, coaching institutions, cultural arts centers, and training bodies.',
    config: {
      portalName: 'Al Noor Academy of Arts & Sciences',
      shortName: 'AL NOOR ACADEMY',
      subtitle: 'Student Register & Cultural Arts Management',
      jurisdiction: 'Sharjah & Ajman • UAE',
      affiliationText: 'Accredited Cultural & Youth Education Center',
      contactEmail: 'admissions@alnooracademy.ae',
      contactPhone: '+971 6 523 4400',
      idPrefix: 'STU',
      orgType: 'school',
      unitTerm: 'Campus',
      unitTermPlural: 'Campuses',
      primaryColor: '#9a3412',
      theme: 'amber_heritage',
      defaultCardDesign: 'smart_compact',
    },
  },
];

export const STORAGE_KEY_PORTAL_CONFIG = 'kca_fujairah_portal_config_v2';

