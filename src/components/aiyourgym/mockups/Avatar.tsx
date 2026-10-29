import { avatarVan, initialenVan } from './avatars'

// Profielfoto van een voorbeeldlid of coach in de productbeelden: rond, met een
// iron-randje (.ayg-avatar in mockups.css) en een vaste maat (geen verschuiving
// bij het laden). Zonder foto de initialen. Geen hooks: werkt in server- en
// clientcomponenten. De naam staat er bijna altijd naast, daarom standaard alt="".

interface AvatarProps {
  /** Volledige naam; de voornaam kiest de foto. */
  naam: string
  /** Breedte en hoogte in px. */
  maat: number
  /** Extra klasse voor de plek (bijv. aygp-avatar), die de maat in css ook zet. */
  className?: string
  /** Alt-tekst; leeg als de naam er al naast staat. */
  alt?: string
  /** Lazy laden (standaard), uit voor foto's boven de vouw. */
  lui?: boolean
}

export function Avatar({ naam, maat, className, alt = '', lui = true }: AvatarProps) {
  const foto = avatarVan(naam)
  const klasse = ['ayg-avatar', className].filter(Boolean).join(' ')
  if (!foto) {
    return (
      <span className={klasse} style={{ width: maat, height: maat }} aria-hidden={alt === '' || undefined} aria-label={alt || undefined} role={alt ? 'img' : undefined}>
        {initialenVan(naam)}
      </span>
    )
  }
  // Een gewone img: kleine vaste webp met 1x en 2x, next/image voegt hier niets toe.
  return (
    <img
      className={klasse}
      src={foto.src}
      srcSet={`${foto.src} 1x, ${foto.src2x} 2x`}
      width={maat}
      height={maat}
      alt={alt}
      loading={lui ? 'lazy' : 'eager'}
      decoding="async"
      draggable={false}
    />
  )
}
