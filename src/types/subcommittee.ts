export interface SubcommitteeDefinition {
  id: string;
  name: string;
  scope: 'Central' | 'Unit' | 'Both';
  iconName: string; // Lucide icon identifier
  colorScheme: string; // Tailwind color theme identifier
  description?: string;
  isSystem?: boolean;
}

export const PREDEFINED_SUBCOMMITTEES: SubcommitteeDefinition[] = [
  {
    id: 'sub_ladies_wing',
    name: 'Ladies Wing',
    scope: 'Both',
    iconName: 'Heart',
    colorScheme: 'fuchsia',
    description: 'Empowerment, women welfare programs, culinary and family cultural initiatives',
    isSystem: true,
  },
  {
    id: 'sub_bala_kairali',
    name: 'Bala Kairali',
    scope: 'Both',
    iconName: 'Sparkles',
    colorScheme: 'amber',
    description: 'Children education, youth arts, Malayalam language training & talent development',
    isSystem: true,
  },
  {
    id: 'sub_sports_wing',
    name: 'Sports Wing',
    scope: 'Both',
    iconName: 'Trophy',
    colorScheme: 'emerald',
    description: 'Football, badminton, cricket leagues, athletics & fitness meets',
    isSystem: true,
  },
  {
    id: 'sub_media_wing',
    name: 'Media Wing',
    scope: 'Both',
    iconName: 'Megaphone',
    colorScheme: 'indigo',
    description: 'Press releases, social media broadcast, event journalism & documentation',
    isSystem: true,
  },
  {
    id: 'sub_norka_support',
    name: 'NORKA Support',
    scope: 'Both',
    iconName: 'Globe',
    colorScheme: 'cyan',
    description: 'Pravasi Raksha, NRI ID card liaison, emergency repatriation & welfare helpdesk',
    isSystem: true,
  },
  {
    id: 'sub_cultural_wing',
    name: 'Cultural Wing',
    scope: 'Both',
    iconName: 'Music',
    colorScheme: 'violet',
    description: 'Kalolsavam, stage drama, Onam/Vishu festivals, musical programs & literary seminars',
    isSystem: true,
  },
];

// Designations for Executive / Central Committee Members
export const EXECUTIVE_DESIGNATIONS = [
  'President',
  'General Secretary',
  'Treasurer',
  'Vice President',
  'Joint Secretary',
  'Joint Treasurer',
  'Advisory Board Member',
  'Executive Committee Member',
];

// Designations for Subcommittee Members
export const SUBCOMMITTEE_DESIGNATIONS = [
  'Convener',
  'Joint Convener',
  'Subcommittee Member',
  'Coordinator',
  'Advisor',
  'Team Lead',
];

export const STORAGE_KEY_CUSTOM_SUBCOMMITTEES = 'kca_fujairah_custom_subcommittees_v1';

export function loadSubcommittees(): SubcommitteeDefinition[] {
  if (typeof window === 'undefined') return PREDEFINED_SUBCOMMITTEES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_SUBCOMMITTEES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Merge system presets with custom definitions
        const customItems = parsed.filter((item: any) => !PREDEFINED_SUBCOMMITTEES.some((p) => p.id === item.id));
        return [...PREDEFINED_SUBCOMMITTEES, ...customItems];
      }
    }
  } catch (err) {
    console.error('Error loading subcommittees from storage:', err);
  }
  return PREDEFINED_SUBCOMMITTEES;
}

export function saveCustomSubcommittees(subcommittees: SubcommitteeDefinition[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_SUBCOMMITTEES, JSON.stringify(subcommittees));
  } catch (err) {
    console.error('Error saving subcommittees to storage:', err);
  }
}
