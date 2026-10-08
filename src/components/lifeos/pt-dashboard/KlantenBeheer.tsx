'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { isLopend, vatKlantenSamen, type PtKlant } from '@/lib/lifeos/pt-dashboard/abonnementen'
import type { Club } from '@/lib/lifeos/pt-dashboard/clubs'
import { KlantFormulier } from './KlantFormulier'
import { KlantKaart } from './KlantKaart'
import { Voorwaarden } from './Voorwaarden'
import { Tegel } from './Tegel'

// Container: de PT-klanten van één PT'er met hun abonnement. Tellers bovenaan,
// filter op status, toevoegen/bijwerken. Een klant-geworden lead komt hier
// binnen via ?vanLead=<id> met naam/contact/club al ingevuld.

type Filter = 'lopend' | 'bevroren' | 'opgezegd' | 'gestopt' | 'alles'

interface Props {
  code: string
  vandaag: string
  begin: PtKlant[]
  standaardClub: Club | null
  vanLead: { id: string; naam: string; contact: string | null; club: Club | null } | null
  startNieuw: boolean
}

const FILTERS: { sleutel: Filter; label: string }[] = [
  { sleutel: 'lopend', label: 'Lopend' },
  { sleutel: 'bevroren', label: 'Bevroren' },
  { sleutel: 'opgezegd', label: 'Opgezegd' },
  { sleutel: 'gestopt', label: 'Gestopt' },
  { sleutel: 'alles', label: 'Alles' },
]

function past(k: PtKlant, f: Filter, vandaag: string): boolean {
  if (f === 'lopend') return isLopend(k, vandaag) || k.startdatum > vandaag
  if (f === 'alles') return true
  return k.status === f
}

export function KlantenBeheer({ code, vandaag, begin, standaardClub, vanLead, startNieuw }: Props) {
  const router = useRouter()
  const [klanten, setKlanten] = useState<PtKlant[]>(begin)
  const [filter, setFilter] = useState<Filter>('lopend')
  const [nieuw, setNieuw] = useState(startNieuw || vanLead !== null)
  const [bewerk, setBewerk] = useState<string | null>(null)
  const s = useMemo(() => vatKlantenSamen(klanten, vandaag), [klanten, vandaag])
  const tellers = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.sleutel, klanten.filter((k) => past(k, f.sleutel, vandaag)).length])) as Record<Filter, number>,
    [klanten, vandaag],
  )
  const zichtbaar = klanten.filter((k) => past(k, filter, vandaag))

  function vervang(k: PtKlant) {
    setKlanten((ks) => (ks.some((x) => x.id === k.id) ? ks.map((x) => (x.id === k.id ? k : x)) : [k, ...ks]))
    router.refresh()
  }

  return (
    <section className="ptd-sectie" aria-labelledby="klanten-kop">
      <div className="ptd-tegels">
        <Tegel getal={String(s.lopend)} label="Lopende abonnementen" uitleg={`${s.personen} ${s.personen === 1 ? 'persoon' : 'personen'}`} />
        <Tegel getal={String(s.sessiesPerWeek)} label="Sessies per week" uitleg="volgens abonnement" />
        <Tegel getal={String(s.vastBijnaKlaar.length)} label="Vaste periode bijna klaar" uitleg="binnen 30 dagen" />
      </div>

      <div className="ptd-sectiekop">
        <h2 id="klanten-kop">PT-klanten</h2>
        <span>{klanten.length} totaal</span>
      </div>

      {nieuw ? (
        <KlantFormulier
          code={code}
          vandaag={vandaag}
          standaardClub={standaardClub}
          vanLead={vanLead ?? undefined}
          onOpgeslagen={(k) => {
            vervang(k)
            setNieuw(false)
            if (vanLead) router.replace(`/${code}/klanten`)
          }}
          onAnnuleer={() => {
            setNieuw(false)
            if (vanLead) router.replace(`/${code}/klanten`)
          }}
        />
      ) : (
        <button type="button" className="ptd-knop ptd-knop--primair" onClick={() => setNieuw(true)}>
          <Plus size={18} aria-hidden /> Nieuwe klant
        </button>
      )}

      <div className="ptd-filters" role="group" aria-label="Filter klanten">
        {FILTERS.map((f) => (
          <button key={f.sleutel} type="button" className="ptd-chip" aria-pressed={filter === f.sleutel} onClick={() => setFilter(f.sleutel)}>
            {f.label} <small>{tellers[f.sleutel]}</small>
          </button>
        ))}
      </div>

      {zichtbaar.length === 0 ? (
        <p className="ptd-leeg">
          {klanten.length === 0
            ? 'Nog geen PT-klanten ingevuld. Zet hier wie bij jou traint en met welk abonnement — dan zie jij (en Kane) precies hoe je ervoor staat.'
            : 'Niets in deze lijst.'}
        </p>
      ) : (
        <ul className="ptd-lijst">
          {zichtbaar.map((k) =>
            bewerk === k.id ? (
              <li key={k.id}>
                <KlantFormulier
                  code={code}
                  vandaag={vandaag}
                  standaardClub={standaardClub}
                  klant={k}
                  onOpgeslagen={(x) => {
                    vervang(x)
                    setBewerk(null)
                  }}
                  onVerwijderd={(id) => {
                    setKlanten((ks) => ks.filter((x) => x.id !== id))
                    setBewerk(null)
                    router.refresh()
                  }}
                  onAnnuleer={() => setBewerk(null)}
                />
              </li>
            ) : (
              <KlantKaart key={k.id} klant={k} vandaag={vandaag} onBewerk={() => setBewerk(k.id)} dossierHref={`/${code}/klanten/${k.id}`} />
            ),
          )}
        </ul>
      )}

      <Voorwaarden />
    </section>
  )
}
