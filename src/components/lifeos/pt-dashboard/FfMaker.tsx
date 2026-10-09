// "Gemaakt door Kane Bongers" — één plek voor de makersregel onderaan elke pagina
// van de Fit Factory PT-app, zodat het overal hetzelfde zegt.

export const MAKER = 'Kane Bongers'

export function FfMaker() {
  return (
    <span className="ff-maker">
      Gemaakt door <strong>{MAKER}</strong>
    </span>
  )
}
