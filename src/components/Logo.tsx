import React from 'react'

/**
 * The MentaForce logo mark: a green rounded square with a white EKG/heartbeat
 * line whose two peaks form the letter M. Scales cleanly at any size.
 */
export function LogoIcon({ size = 36 }: { size?: number }) {
  const id = 'mf-bg'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="MentaForce logo"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#27D497" />
          <stop offset="100%" stopColor="#0A5C3E" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="48" height="48" rx="12" fill={`url(#${id})`} />

      {/* EKG / M mark */}
      <polyline
        points="4,24 14,24 19,10 24,38 29,10 34,24 44,24"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Icon + wordmark side by side */
export function LogoFull({
  iconSize = 36,
  className = '',
}: {
  iconSize?: number
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoIcon size={iconSize} />
      <span
        style={{
          fontSize: iconSize * 0.44,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: '#111827',
          lineHeight: 1,
        }}
      >
        Menta<span style={{ color: '#1D9E75' }}>Force</span>
      </span>
    </div>
  )
}
