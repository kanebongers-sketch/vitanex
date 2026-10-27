// De verste laag van de held en de paginakoppen: schuine banen ochtendlicht in
// salie en creme, alleen CSS met de tokens (dag.css). Puur sier. In de held lezen
// de banen --px en --hs en schuiven ze het minst mee.

interface LichtvalProps {
  className?: string
}

export function Lichtval({ className }: LichtvalProps) {
  return (
    <div className={className ? `dag-licht ${className}` : 'dag-licht'} aria-hidden>
      <i />
      <i />
      <i />
    </div>
  )
}
