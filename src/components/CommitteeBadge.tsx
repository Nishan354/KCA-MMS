import React from 'react';
import { Member } from '../types/member';
import {
  Crown,
  Shield,
  ShieldCheck,
  Award,
  Heart,
  Sparkles,
  Trophy,
  Megaphone,
  Globe,
  Music,
  Users,
  Star,
  Tag,
} from 'lucide-react';

interface CommitteeBadgeProps {
  member: Partial<Member>;
  size?: 'sm' | 'md' | 'lg';
  showSubcommitteeOnly?: boolean;
  className?: string;
}

export function isPresidentSecretaryOrTreasurer(designation?: string): boolean {
  if (!designation) return false;
  const d = designation.toLowerCase().trim();
  return (
    d.includes('president') ||
    d.includes('secretary') ||
    d.includes('secre') ||
    d.includes('treasurer') ||
    d.includes('treas')
  );
}

export const CommitteeBadge: React.FC<CommitteeBadgeProps> = ({
  member,
  size = 'sm',
  showSubcommitteeOnly = false,
  className = '',
}) => {
  const designation = member.designation?.trim();
  const isOfficer = isPresidentSecretaryOrTreasurer(designation);
  const isCentral =
    member.membershipType === 'Central Committee Member' ||
    member.committeeTier === 'Central' ||
    member.unit === 'Central';

  // Live badge is strictly for key officers: President, Secretary, Treasurer
  if (!isOfficer) {
    return null;
  }

  // Determine Icon and Styling based on officer role
  let IconComponent: React.FC<{ className?: string }> = Crown;
  let bgClasses = 'bg-amber-100 dark:bg-amber-950/90 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-700 shadow-xs font-black ring-1 ring-amber-400/40';
  let labelText = designation || 'Officer';

  const dLower = (designation || '').toLowerCase();
  if (dLower.includes('president')) {
    IconComponent = Crown;
    bgClasses = 'bg-amber-100 dark:bg-amber-950/90 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-700 shadow-xs font-black ring-1 ring-amber-400/40';
    labelText = designation || 'President';
  } else if (dLower.includes('secretary') || dLower.includes('secre')) {
    IconComponent = ShieldCheck;
    bgClasses = 'bg-blue-100 dark:bg-blue-950/90 text-blue-900 dark:text-blue-200 border-blue-400 dark:border-blue-700 shadow-xs font-black ring-1 ring-blue-400/40';
    labelText = designation || 'Secretary';
  } else {
    IconComponent = Award;
    bgClasses = 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-700 shadow-xs font-black ring-1 ring-emerald-400/40';
    labelText = designation || 'Treasurer';
  }

  const displayTitle = labelText;

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const textSizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-[11px] px-2.5 py-0.5',
    lg: 'text-xs px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider border select-none transition-all ${bgClasses} ${textSizes[size]} ${className}`}
      title={`Role: ${displayTitle}${isCentral ? ' (Central Scope)' : ''}`}
    >
      <IconComponent className={`${iconSizes[size]} shrink-0`} />
      <span className="truncate max-w-[170px]">{displayTitle}</span>
    </span>
  );
};
