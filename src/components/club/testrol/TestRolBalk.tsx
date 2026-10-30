'use client'

import { useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { TESTROL } from '@/lib/aiyourgym/taal/woorden/club/testrol'
import { ROLLEN_TEKST } from '@/lib/aiyourgym/taal/woorden/club/rollen'
import { ROLLEN, type Rol } from '@/lib/club/rollen/typen'
import './testrol.css'

// Een smalle balk boven Club voor het master account in een testaccount:
// kies rollen en zie en gebruik Club als die rollen (rollen/testrol.ts). De
// server rekent daarna met die rechten; na wisselen laadt de pagina opnieuw
// op de startpagina van de rol, zodat er niets van het master account blijft hangen.

interface Props {
  /** De rollen waarmee nu getest wordt; leeg = master account. */
  actief: readonly Rol[]
}

export function TestRolBalk({ actief }: Props) {
  const t = useTekst(TESTROL)
  const namen = useTekst(ROLLEN_TEKST).rollen
  const [gekozen, setGekozen] = useState<Rol[]>(actief.length > 0 ? [...actief] : ['trainer'])
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function zet(rollen: readonly Rol[]) {
    setBezig(true)
    setFout(null)
    try {
      const res = await fetch('/api/club/platform/testrol', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rollen }) })
      if (!res.ok) throw new Error('wisselen')
      window.location.assign(rollen.length > 0 ? '/club?start=1' : '/club')
    } catch {
      setFout(t.fout)
      setBezig(false)
    }
  }

  function wissel(rol: Rol) {
    setGekozen((nu) => (nu.includes(rol) ? nu.filter((r) => r !== rol) : ROLLEN.filter((r) => r === rol || nu.includes(r))))
  }

  const lijst = actief.map((r) => namen[r])
  const tekst = actief.length > 0 ? t.aan(lijst.length > 1 ? `${lijst.slice(0, -1).join(', ')} ${t.en} ${lijst[lijst.length - 1]}` : lijst[0]) : t.uit
  return (
    <section className="club-testrol" data-actief={actief.length > 0 || undefined} aria-label={t.label}>
      <p className="club-testrol-tekst">
        <FlaskConical aria-hidden size={16} />
        <span>{tekst}</span>
      </p>
      <fieldset className="club-testrol-keus" disabled={bezig}>
        <legend className="club-sr">{t.label}</legend>
        {ROLLEN.map((rol) => (
          <label key={rol} className="club-testrol-rol">
            <input type="checkbox" checked={gekozen.includes(rol)} onChange={() => wissel(rol)} />
            <span>{namen[rol]}</span>
          </label>
        ))}
      </fieldset>
      <div className="club-testrol-knoppen">
        <button type="button" className="club-knop club-knop--klein club-knop--primair" disabled={bezig || gekozen.length === 0} onClick={() => void zet(gekozen)}>
          {bezig ? t.bezig : t.toepassen}
        </button>
        {actief.length > 0 && (
          <button type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => void zet([])}>
            {t.stoppen}
          </button>
        )}
      </div>
      {gekozen.length === 0 && <p className="club-testrol-melding">{t.kies}</p>}
      {fout && <p className="club-testrol-melding" role="alert">{fout}</p>}
    </section>
  )
}
