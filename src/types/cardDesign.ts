export type IdCardDesignId =
  | 'classic_wave'
  | 'modern_minimalist'
  | 'corporate_executive'
  | 'prestige_royal'
  | 'vibrant_diagonal'
  | 'smart_compact';

export interface IdCardDesignOption {
  id: IdCardDesignId;
  name: string;
  badge: string;
  description: string;
  previewColors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    isDark?: boolean;
  };
  recommendedFor: string;
}

export const ID_CARD_DESIGNS: IdCardDesignOption[] = [
  {
    id: 'classic_wave',
    name: 'Classic Heritage Wave',
    badge: 'Signature',
    description: 'Traditional official KCA crimson flowing waves with faceted geometric watermark, CR80 boxed photo, and QR verification.',
    previewColors: {
      primary: '#8b0000',
      secondary: '#b91c1c',
      accent: '#f59e0b',
      background: '#ffffff',
    },
    recommendedFor: 'Cultural associations, diaspora organizations & traditional community bodies',
  },
  {
    id: 'modern_minimalist',
    name: 'Modern Clean Edge',
    badge: 'Contemporary',
    description: 'Scandinavian clean aesthetic with vertical primary color pillar, micro-dot pattern, clean two-column credentials, and crisp typography.',
    previewColors: {
      primary: '#0f172a',
      secondary: '#2563eb',
      accent: '#38bdf8',
      background: '#f8fafc',
    },
    recommendedFor: 'Modern NGOs, non-profits, creative studios & modern associations',
  },
  {
    id: 'corporate_executive',
    name: 'Corporate Executive & Tech',
    badge: 'Enterprise',
    description: 'Full-width dark header with metallic ribbon separator, embedded security smart-chip motif, guilloché lines, and tabular credentials.',
    previewColors: {
      primary: '#1e3a8a',
      secondary: '#0f172a',
      accent: '#f59e0b',
      background: '#ffffff',
    },
    recommendedFor: 'Commercial enterprises, LLCs, corporations & professional institutions',
  },
  {
    id: 'prestige_royal',
    name: 'Prestige Royal Sovereign',
    badge: 'Luxury VIP',
    description: 'Deep royal midnight background with ornate metallic gold framing, gold gradient typography, royal crest watermark, and VIP styling.',
    previewColors: {
      primary: '#091428',
      secondary: '#172554',
      accent: '#eab308',
      background: '#091428',
      isDark: true,
    },
    recommendedFor: 'VIP patrons, lifetime members, executive councils & elite clubs',
  },
  {
    id: 'vibrant_diagonal',
    name: 'Dynamic Vibrant Angle',
    badge: 'Energetic',
    description: 'Contemporary 38-degree angular gradient banner with glowing photo halo, modern section highlights, and dynamic badge styling.',
    previewColors: {
      primary: '#6b21a8',
      secondary: '#be185d',
      accent: '#f59e0b',
      background: '#ffffff',
    },
    recommendedFor: 'Youth wings, sports & recreational clubs, festival bodies & creative arts',
  },
  {
    id: 'smart_compact',
    name: 'Smart Security Identity',
    badge: 'Official',
    description: 'Official biometric security smart-card with metallic microchip, guilloché security background, security barcode simulation, and high-density credentials.',
    previewColors: {
      primary: '#047857',
      secondary: '#0f172a',
      accent: '#10b981',
      background: '#ffffff',
    },
    recommendedFor: 'Educational academies, licensed training centers & official registries',
  },
];

export const DEFAULT_CARD_DESIGN_ID: IdCardDesignId = 'classic_wave';

export function getIdCardDesign(id?: string | null): IdCardDesignOption {
  if (!id) return ID_CARD_DESIGNS[0];
  const found = ID_CARD_DESIGNS.find((d) => d.id === id);
  return found || ID_CARD_DESIGNS[0];
}
