import React from 'react'

export interface SentraLogoProps {
  variant?: 'full' | 'icon' | 'interlocking-s' | 'eye-radar' | 'sentinel'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showTagline?: boolean
  accentColor?: string
}

export const SentraLogo: React.FC<SentraLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showTagline = false,
  accentColor = '#14B8A6',
}) => {
  const iconDimensions = {
    sm: { width: 20, height: 20 },
    md: { width: 28, height: 28 },
    lg: { width: 36, height: 36 },
    xl: { width: 48, height: 48 },
  }[size]

  // Variant 1: Shield with abstract scanning eye & crosshair (Primary Brand Icon)
  const ShieldEyeIcon = (
    <svg
      width={iconDimensions.width}
      height={iconDimensions.height}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Outer geometric shield with sharp angular cuts */}
      <path
        d="M16 2.5L28 7.5V16C28 23.2 22.8 28.5 16 30.5C9.2 28.5 4 23.2 4 16V7.5L16 2.5Z"
        stroke={accentColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Abstract eye lens / scanning aperture */}
      <path
        d="M8.5 16C10.5 12.5 13 11 16 11C19 11 21.5 12.5 23.5 16C21.5 19.5 19 21 16 21C13 21 10.5 19.5 8.5 16Z"
        stroke={accentColor}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Central focal pupil / crosshair target point */}
      <circle cx="16" cy="16" r="2.5" fill={accentColor} />
      {/* Minimal vertical scanning crosshair tick */}
      <line x1="16" y1="8" x2="16" y2="10" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="22" x2="16" y2="24" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )

  // Variant 2: Interlocking 'S' built from two interlocking geometric shield cuts
  const InterlockingSIcon = (
    <svg
      width={iconDimensions.width}
      height={iconDimensions.height}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Upper shield half creating top curve of S */}
      <path
        d="M24 7L16 3L8 7V14C8 17.5 10.5 20.5 14 21.5L16 22L18 21.3C21 20.3 24 17.5 24 14V11"
        stroke={accentColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Lower interlocking shield half completing the S */}
      <path
        d="M8 25L16 29L24 25V18C24 14.5 21.5 11.5 18 10.5L16 10L14 10.7C11 11.7 8 14.5 8 18V21"
        stroke={accentColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )

  // Variant 3: Abstract Eye formed by circle inside pointed oval with radar sweep line
  const EyeRadarIcon = (
    <svg
      width={iconDimensions.width}
      height={iconDimensions.height}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Pointed oval contour */}
      <path
        d="M3 16C6.5 9.5 11 6 16 6C21 6 25.5 9.5 29 16C25.5 22.5 21 26 16 26C11 26 6.5 22.5 3 16Z"
        stroke={accentColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Central circular scanner iris */}
      <circle cx="16" cy="16" r="5.5" stroke={accentColor} strokeWidth="1.5" />
      {/* Radar sweep radial ray */}
      <line x1="16" y1="16" x2="22" y2="10" stroke={accentColor} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16" cy="16" r="2" fill={accentColor} />
    </svg>
  )

  // Variant 4: Watchtower / Sentinel point with geometric triangles and sentinel dot
  const SentinelIcon = (
    <svg
      width={iconDimensions.width}
      height={iconDimensions.height}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Sentinel beacon dot */}
      <circle cx="16" cy="5" r="2.2" fill={accentColor} />
      {/* Apex triangle crown */}
      <path d="M16 8L22 15H10L16 8Z" stroke={accentColor} strokeWidth="1.6" strokeLinejoin="round" />
      {/* Base watchtower ramparts */}
      <path
        d="M11 16L7 28H25L21 16H11Z"
        stroke={accentColor}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Central viewing aperture slit */}
      <line x1="16" y1="19" x2="16" y2="24" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )

  const selectedIcon = {
    full: ShieldEyeIcon,
    icon: ShieldEyeIcon,
    'interlocking-s': InterlockingSIcon,
    'eye-radar': EyeRadarIcon,
    sentinel: SentinelIcon,
  }[variant]

  if (variant !== 'full') {
    return <div className={`inline-flex items-center ${className}`}>{selectedIcon}</div>
  }

  // Wordmark font size
  const textSize = {
    sm: 'text-sm tracking-tight',
    md: 'text-base tracking-tight',
    lg: 'text-xl tracking-tight',
    xl: 'text-2xl tracking-tighter',
  }[size]

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {selectedIcon}
      <div className="flex flex-col">
        <span
          className={`font-sans font-semibold text-foreground leading-none ${textSize}`}
          style={{ letterSpacing: '-0.03em' }}
        >
          sentra
        </span>
        {showTagline && (
          <span className="text-[10px] text-muted-foreground font-mono mt-0.5 leading-none tracking-normal">
            See your risk before attackers do
          </span>
        )}
      </div>
    </div>
  )
}
