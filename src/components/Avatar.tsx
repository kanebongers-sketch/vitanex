type AvatarProps = {
  naam: string
  avatarUrl?: string | null
  size?: number
  online?: boolean
  className?: string
  style?: React.CSSProperties
}

function initialen(naam: string) {
  const delen = naam.trim().split(' ')
  if (delen.length >= 2) return (delen[0][0] + delen[delen.length - 1][0]).toUpperCase()
  return naam.slice(0, 2).toUpperCase()
}

export function Avatar({ naam, avatarUrl, size = 32, online, className = '', style }: AvatarProps) {
  const fontSize = Math.round(size * 0.36)
  const dotSize = Math.round(size * 0.28)
  const dotOffset = Math.round(size * 0.04)

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={naam}
          className="rounded-full object-cover w-full h-full"
          draggable={false}
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center font-medium w-full h-full select-none"
          style={{
            background: 'var(--mentaforce-primary-light)',
            color: 'var(--mentaforce-primary)',
            fontSize,
          }}
        >
          {initialen(naam || '?')}
        </div>
      )}

      {online !== undefined && (
        <span
          className="absolute rounded-full border-2 border-white"
          style={{
            width: dotSize,
            height: dotSize,
            background: online ? '#22c55e' : '#d1d5db',
            bottom: dotOffset,
            right: dotOffset,
          }}
        />
      )}
    </div>
  )
}
