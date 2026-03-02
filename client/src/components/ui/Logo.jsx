import Link from 'next/link';

/**
 * CREWUPFILMS logo component.
 * Props:
 *   size   – 'sm' | 'md' (default) | 'lg'
 *   href   – wraps in a <Link> when provided (default '/')
 *   noLink – render without anchor wrapper
 *   light  – white wordmark variant (for dark backgrounds)
 */
export default function Logo({ size = 'md', href = '/', noLink = false, light = false }) {
  const dims = { sm: 28, md: 36, lg: 48 };
  const h = dims[size] ?? dims.md;
  const w = Math.round(h * (200 / 44)); // maintain aspect ratio

  const mark = (
    <svg
      width={w}
      height={h}
      viewBox="0 0 200 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="CREWUPFILMS"
    >
      {/* Icon mark ─ dark rounded square */}
      <rect width="44" height="44" rx="10" fill={light ? 'white' : '#0e0e0d'} />

      {/* Film perforations */}
      <rect x="5"  y="11" width="5" height="5" rx="1.5" fill={light ? '#0e0e0d' : 'white'} opacity="0.5" />
      <rect x="5"  y="28" width="5" height="5" rx="1.5" fill={light ? '#0e0e0d' : 'white'} opacity="0.5" />
      <rect x="34" y="11" width="5" height="5" rx="1.5" fill={light ? '#0e0e0d' : 'white'} opacity="0.5" />
      <rect x="34" y="28" width="5" height="5" rx="1.5" fill={light ? '#0e0e0d' : 'white'} opacity="0.5" />

      {/* Film frame border */}
      <rect x="13" y="7" width="18" height="30" rx="2"
        stroke={light ? '#0e0e0d' : 'white'} strokeWidth="1.5" fill="none" opacity="0.6" />

      {/* Play triangle */}
      <polygon points="19,16 19,28 30,22" fill={light ? '#0e0e0d' : 'white'} />

      {/* Wordmark: CREWUP */}
      <text
        x="56" y="28"
        fontFamily="Inter, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="22"
        fill={light ? 'white' : '#0e0e0d'}
        letterSpacing="-0.8"
      >
        CREWUP
      </text>

      {/* Wordmark: FILMS */}
      <text
        x="58" y="40"
        fontFamily="Inter, -apple-system, sans-serif"
        fontWeight="600"
        fontSize="10"
        fill="#d97706"
        letterSpacing="5"
      >
        FILMS
      </text>
    </svg>
  );

  if (noLink) return mark;

  return (
    <Link href={href} className="inline-flex items-center group hover:opacity-80 transition-opacity">
      {mark}
    </Link>
  );
}
