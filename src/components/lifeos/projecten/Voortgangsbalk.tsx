import { voortgangProcent, type Voortgang } from '@/lib/lifeos/projecten/voortgang'

// De voortgang van één project: een echte teller ("3/8 klaar") plus een dunne
// cyan balk. De balk is decoratie — de betekenis staat in de tekst en in de
// aria-waarden, nooit in kleur alleen. De breedte is statisch (geen transition):
// een animerende breedte triggert layout en dat willen we niet.

interface VoortgangsbalkProps {
  voortgang: Voortgang
}

export function Voortgangsbalk({ voortgang }: VoortgangsbalkProps) {
  const { klaar, totaal } = voortgang

  // Geen taken = geen voortgang om te tonen. Een lege balk zou "0% klaar"
  // suggereren, terwijl er simpelweg nog niets te doen is.
  if (totaal === 0) {
    return <p className="proj-voortgang-leeg">Nog geen taken</p>
  }

  return (
    <div className="proj-voortgang">
      <div
        className="proj-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={totaal}
        aria-valuenow={klaar}
        aria-valuetext={`${klaar} van ${totaal} taken klaar`}
      >
        <div className="proj-bar-fill" style={{ width: `${voortgangProcent(voortgang)}%` }} />
      </div>
      <span className="proj-voortgang-tekst os-cijfer">
        {klaar}/{totaal} klaar
      </span>
    </div>
  )
}
