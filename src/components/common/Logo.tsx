import React from 'react';

interface LogoProps {
  compact?: boolean;
  className?: string;
  isLightMode?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({
  compact = false,
  className = '',
  isLightMode = false,
  size = 'md',
}) => {
  // Dimension presets
  const iconSizes = {
    sm: { width: 28, height: 28 },
    md: { width: 36, height: 36 },
    lg: { width: 44, height: 44 },
    xl: { width: 56, height: 56 },
  };

  const currentIconSize = iconSizes[size] || iconSizes.md;

  // Generate unique gradient IDs in case multiple logos render on same page
  const idSuffix = React.useId().replace(/:/g, '');
  const purpleGradId = `crocus-purple-${idSuffix}`;
  const orangeGradId = `crocus-orange-${idSuffix}`;
  const textVioletGradId = `text-violet-${idSuffix}`;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Tulip / Crocus Line-Art Icon */}
      <svg
        width={currentIconSize.width}
        height={currentIconSize.height}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Violet to deep purple gradient */}
          <linearGradient id={purpleGradId} x1="6" y1="4" x2="38" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9B30FF" />
            <stop offset="100%" stopColor="#5B1FA8" />
          </linearGradient>

          {/* Warm orange-amber gradient */}
          <linearGradient id={orangeGradId} x1="12" y1="12" x2="32" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF9A1F" />
            <stop offset="100%" stopColor="#F26B1D" />
          </linearGradient>
        </defs>

        {/* Outer Petals: Rounded cup shape with pointed central tip in violet-purple gradient */}
        <path
          d="M22 4C14 9 8 19 8 28C8 34.5 13.5 39 22 39C30.5 39 36 34.5 36 28C36 19 30 9 22 4Z"
          stroke={`url(#${purpleGradId})`}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Side petal ridges */}
        <path
          d="M8.5 25C13 29 18 31 22 31C26 31 31 29 35.5 25"
          stroke={`url(#${purpleGradId})`}
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Inside: Two overlapping petals crossing each other in warm orange-amber gradient */}
        {/* Left inner petal curving right */}
        <path
          d="M15 17C17.5 22.5 22 28 28 32.5"
          stroke={`url(#${orangeGradId})`}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Right inner petal crossing over */}
        <path
          d="M29 17C26.5 22.5 22 28 16 32.5"
          stroke={`url(#${orangeGradId})`}
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Central pistil / saffron stigma accent */}
        <path
          d="M22 14V23"
          stroke={`url(#${orangeGradId})`}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Short stem curving at bottom left */}
        <path
          d="M19 38.5C18 41.5 15 43 11 43"
          stroke={`url(#${purpleGradId})`}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>

      {/* Brand Wordmark (hidden if compact) */}
      {!compact && (
        <div className="flex flex-col justify-center leading-none">
          <svg className="h-0 w-0 absolute">
            <defs>
              <linearGradient id={textVioletGradId} x1="0" y1="0" x2="100%" y2="0">
                <stop offset="0%" stopColor="#A020F0" />
                <stop offset="100%" stopColor="#6A1BB1" />
              </linearGradient>
            </defs>
          </svg>

          {/* Line 1: SAFRAN in large, bold, wide geometric sans-serif capitals */}
          <span
            className={`font-['Orbitron',sans-serif] tracking-[0.22em] font-extrabold uppercase ${
              size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : size === 'xl' ? 'text-3xl' : 'text-lg sm:text-xl'
            } ${isLightMode ? 'text-[#0B0B12]' : 'text-white dark:text-white'}`}
          >
            SAFRAN
          </span>

          {/* Line 2: BUSINESS (light purple) + CONSULTING (bold violet gradient) */}
          <div
            className={`flex items-center gap-1.5 font-['Exo_2',sans-serif] tracking-[0.25em] uppercase mt-0.5 ${
              size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-xs' : size === 'xl' ? 'text-sm' : 'text-[10px] sm:text-[11px]'
            }`}
          >
            <span className="font-light text-[#8A2BE2]">BUSINESS</span>
            <span className="font-bold bg-gradient-to-r from-[#A020F0] to-[#6A1BB1] bg-clip-text text-transparent">
              CONSULTING
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
