import React from 'react';

export type AdinkraSymbolName = 
  | 'sankofa' 
  | 'nyansapo' 
  | 'adinkrahene' 
  | 'akoma' 
  | 'dono' 
  | 'dame-dame' 
  | 'sepow'
  | 'dwennimmen';

interface AdinkraGlyphProps {
  name: AdinkraSymbolName | string;
  className?: string;
  size?: number;
}

export const AdinkraGlyph: React.FC<AdinkraGlyphProps> = ({ name, className = 'text-amber-400', size = 20 }) => {
  const norm = name.toLowerCase().trim();

  // Sankofa - Bird turning head backwards with egg on back / stylized heart
  if (norm === 'sankofa') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M12 21C6 16 3 12 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 4-3 8-9 13Z" strokeDasharray="1 1.5" opacity="0.3" />
        <path d="M16 6c1.5 1 2 3 1 5-1 2-3.5 3-6 3H8c-2 0-3.5-1.5-3.5-3.5S6 7 8 7h2" />
        <circle cx="16" cy="4.5" r="1.5" fill="currentColor" />
        <path d="M8 7c0-2 1.5-3.5 3.5-3.5C13 3.5 14 4.5 14 6" />
        <path d="M9 14l-3 7m4-7l2 7m4-7l3 7" strokeWidth="1.5" />
      </svg>
    );
  }

  // Nyansapo - Wisdom Knot (interlocking loops)
  if (norm === 'nyansapo') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <rect x="7" y="7" width="10" height="10" rx="3" transform="rotate(45 12 12)" />
        <circle cx="12" cy="7" r="3" />
        <circle cx="12" cy="17" r="3" />
        <circle cx="7" cy="12" r="3" />
        <circle cx="17" cy="12" r="3" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    );
  }

  // Adinkrahene - Three concentric circles (Chief of symbols)
  if (norm === 'adinkrahene') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={className}
      >
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2" />
      </svg>
    );
  }

  // Akoma - The Heart (Patience & mutual understanding)
  if (norm === 'akoma') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        <circle cx="12" cy="11" r="2.5" strokeDasharray="1 1" />
      </svg>
    );
  }

  // Dono - Hourglass Talking Drum
  if (norm === 'dono') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <ellipse cx="12" cy="4" rx="7" ry="2" />
        <ellipse cx="12" cy="20" rx="7" ry="2" />
        <path d="M5 4c0 4 5 7 5 8s-5 4-5 8m14-16c0 4-5 7-5 8s5 4 5 8" />
        <line x1="8" y1="4" x2="16" y2="20" strokeWidth="1" opacity="0.6" />
        <line x1="16" y1="4" x2="8" y2="20" strokeWidth="1" opacity="0.6" />
      </svg>
    );
  }

  // Dame-Dame - Strategy game checkerboard
  if (norm === 'dame-dame') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={className}
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <rect x="3" y="3" width="9" height="9" fill="currentColor" fillOpacity="0.2" />
        <rect x="12" y="12" width="9" height="9" fill="currentColor" fillOpacity="0.2" />
        <line x1="12" y1="3" x2="12" y2="21" />
        <line x1="3" y1="12" x2="21" y2="12" />
      </svg>
    );
  }

  // Sepow - Precision / Sword of oath and execution
  if (norm === 'sepow') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
        <path d="M13 19l2 2 6-6-2-2" />
        <circle cx="18" cy="18" r="1" fill="currentColor" />
      </svg>
    );
  }

  // Default fallback: Nyansapo
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v16m-8-8h16" />
    </svg>
  );
};
