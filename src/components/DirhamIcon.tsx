import React from 'react';

export const DirhamIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-4 h-4',
  size,
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* UAE Dirham Currency Symbol: Capital 'D' with custom central balance stroke, or Arabic/Latin hybrid styling */}
      <path d="M5 4h6a7 7 0 0 1 7 7v2a7 7 0 0 1-7 7H5V4z" />
      <path d="M3 11h14" />
      <path d="M3 15h14" />
    </svg>
  );
};

export const DirhamBadge: React.FC<{ className?: string }> = ({
  className = 'text-[10px] font-black font-mono tracking-tighter px-1 py-0.5 rounded bg-amber-400/20 text-amber-950 border border-amber-400/40',
}) => {
  return <span className={className}>AED</span>;
};
