'use client'

import { useEffect, useState } from 'react'
import { TriangleAlert, Compass, RefreshCw } from 'lucide-react'
import { Kaart, NogNiets, type Nadruk } from '@/components/lifeos/os/Kaart'
import { supabase } from '@/lib/supabase/supabase'
import { kiesWeergave, meekijkTekst, type SignalenAntwoord } from '@/lib/lifeos/vita/weergave'
import { SignaalRegel } from './SignaalRegel'
import type { Signaal } from '@/lib/lifeos/vita/signalen'

// ─── De drie staten ─────────────────────────────────────────────────────────
// fout · niets-gemeten · signalen. Expliciet gescheiden, want dit is precies
// waar het in MentaForce misging: "fout" en "leeg" renderden hetzelfde, en dan
// vertelt een netwerkstoring de gebruiker dat hij niets gemeten heeft.
//
// Wélke van de drie het wordt, beslist dit component niet: dat doet
// `kiesWeergave` (puur en getest, zie `lib/lifeos/vita/weergave`). Hier staat alleen
// hoe ze eruitzien. Zo kan de belangrijkste regel van dit project niet stukgaan
// aan een verkeerd geplaatste ternary in een render.

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; melding: string }
  | { fase: 'klaar'; antwoord: SignalenAntwoord }

function isAntwoord(v: unknown): v is SignalenAntwoord {
  if (typeof v !== 'object' || v === null) return false
  const a = v as Record<string, unknown>
  return (
    Array.isArray(a.signalen) &&
    typeof a.gemeten === 'boolean' &&
    Array.isArray(a.bronnenMetFout)
  )
  // `dagbriefing` staat hier bewust niet in: het veld is optioneel en de UI valt
  // bij afwezigheid terug op "geen belofte" (zie `meekijkTekst`). Zou het hier
  // verplicht zijn, dan maakte een gevallen briefing-query de hele kaart tot een
  // fout — en dan verdwijnen je signalen omdat we je briefing niet konden opzoeken.
}

interface VitaKaartProps {
  /**
   * Standaard `dragend`: zonder Vita is LifeOS tien slechtere apps, dus hij
   * draagt het moment. De pagina mag hem verkleinen, maar moet dat kiezen.
   */
  nadruk?: Nadruk
  /** Kopniveau; geef 3 mee als deze kaart in een lade staat. */
  niveau?: 2 | 3
}

/**
 * Haalt de signalen op en vertaalt élke afloop naar precies één staat.
 *
 * Geeft een staat terug in plaats van te setState'en: zo blijft het onderscheid
 * tussen "storing" en "niets gemeten" één keer, op één plek, gemaakt — en niet
 * verspreid over een effect, een catch en een render.
 */
async function haalSignalen(signaal: AbortSignal): Promise<Staat> {
  try {
    // `/api/lifeos/vita/*` verifieert het JWT lokaal uit de Authorization-header
    // (zie `lib/auth/api-auth`); er is geen cookie-sessie, dus het token moet er
    // expliciet bij. De browser-client ververst 'm zelf — wij lezen alleen.
    const { data: sessie, error } = await supabase.auth.getSession()
    const token = sessie.session?.access_token
    if (error || !token) return { fase: 'fout', melding: 'Je bent niet ingelogd.' }

    const respons = await fetch('/api/lifeos/vita/signalen', {
      signal: signaal,
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    })

    // Een storing is geen leeg dashboard — dat onderscheid houden we vast tot in
    // de UI. Een verlopen sessie is bovendien iets anders dan een kapotte
    // server: bij het eerste kun je zelf iets doen.
    if (respons.status === 401) return { fase: 'fout', melding: 'Je sessie is verlopen. Log opnieuw in.' }
    if (!respons.ok) return { fase: 'fout', melding: 'Vita kan er even niet bij.' }

    const data: unknown = await respons.json()
    if (!isAntwoord(data)) return { fase: 'fout', melding: 'Vita gaf een onverwacht antwoord.' }
    return { fase: 'klaar', antwoord: data }
  } catch {
    return { fase: 'fout', melding: 'Vita is niet bereikbaar.' }
  }
}

export function VitaKaart({ nadruk = 'dragend', niveau = 2 }: VitaKaartProps) {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const [poging, setPoging] = useState(0)

  useEffect(() => {
    const afbreker = new AbortController()
    async function laad() {
      const nieuw = await haalSignalen(afbreker.signal)
      // Afgebroken (unmount of nieuwe poging) → niets meer zeggen.
      if (!afbreker.signal.aborted) setStaat(nieuw)
    }
    void laad()
    return () => afbreker.abort()
  }, [poging])

  function opnieuw() {
    setStaat({ fase: 'laden' })
    setPoging((p) => p + 1)
  }

  return (
    <Kaart titel="Vita" nadruk={nadruk} niveau={niveau}>
      <Inhoud staat={staat} opnieuw={opnieuw} />
    </Kaart>
  )
}

// ─── Staten ─────────────────────────────────────────────────────────────────

function Inhoud({ staat, opnieuw }: { staat: Staat; opnieuw: () => void }) {
  if (staat.fase === 'laden') return <Skelet />
  if (staat.fase === 'fout') return <Fout melding={staat.melding} opnieuw={opnieuw} />

  const weergave = kiesWeergave(staat.antwoord)
  switch (weergave.soort) {
    case 'fout':
      return <Fout melding={weergave.melding} opnieuw={opnieuw} />
    case 'niets-gemeten':
      return (
        <NogNiets
          wat="Ik heb nog niets van je gemeten"
          waarom="Koppel je wearable of je agenda, dan begin ik mee te kijken. Tot die tijd verzin ik liever niets."
        />
      )
    case 'rustig':
      return (
        <>
          <Rustig dagbriefing={staat.antwoord.dagbriefing} />
          <DeelsMis bronnen={weergave.bronnenMetFout} />
        </>
      )
    case 'signalen':
      return (
        <>
          <Lijst signalen={weergave.signalen} />
          <DeelsMis bronnen={weergave.bronnenMetFout} />
        </>
      )
  }
}

/** Rustige placeholder in plaats van een spinner-spektakel. */
function Skelet() {
  return (
    <div aria-busy="true" aria-live="polite" style={{ minHeight: 72 }}>
      <span className="sr-only">Vita kijkt naar je dag.</span>
      <div
        aria-hidden="true"
        style={{
          height: 11,
          width: '68%',
          borderRadius: 999,
          background: 'var(--bg-raised)',
          marginBottom: 12,
        }}
      />
      <div
        aria-hidden="true"
        style={{ height: 9, width: '42%', borderRadius: 999, background: 'var(--bg-raised)' }}
      />
    </div>
  )
}

function Fout({ melding, opnieuw }: { melding: string; opnieuw: () => void }) {
  return (
    <div role="alert">
      <p
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          margin: '0 0 5px',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--status-laag)',
        }}
      >
        <TriangleAlert size={15} strokeWidth={2.2} aria-hidden="true" />
        {melding}
      </p>
      <p style={{ margin: '0 0 13px', fontSize: 12, lineHeight: 1.5, color: 'var(--text-4)' }}>
        Dit betekent niet dat er niets speelt — ik kan er alleen even niet bij.
      </p>
      <OpnieuwKnop opnieuw={opnieuw} />
    </div>
  )
}

/**
 * Altijd een weg terug uit een fout. Hover in state i.p.v. een klasse, omdat de
 * rest van deze kaart ook op tokens-in-stijl draait; de focus-ring komt uit
 * `globals.css` (`:focus-visible`) en blijft dus altijd zichtbaar.
 */
function OpnieuwKnop({ opnieuw }: { opnieuw: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={opnieuw}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '7px 13px',
        borderRadius: 999,
        border: `1px solid ${hover ? 'var(--brand)' : 'var(--line-strong)'}`,
        background: 'transparent',
        color: hover ? 'var(--brand)' : 'var(--text-2)',
        fontFamily: 'inherit',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'color 180ms var(--ease), border-color 180ms var(--ease)',
      }}
    >
      <RefreshCw size={13} strokeWidth={2.2} aria-hidden="true" />
      Opnieuw proberen
    </button>
  )
}

/**
 * Wél data, geen signalen. Een antwoord, geen leegte.
 *
 * Hier stond de enige regel in LifeOS die aantoonbaar loog: "Ik blijf meekijken en
 * tik je aan zodra er iets verandert." Er was geen cron, geen polling, geen push —
 * Vita draaide uitsluitend als je deze pagina opende.
 *
 * De zin komt nu uit `meekijkTekst`, en die keyt op BEWIJS uit `vita_briefingen`:
 * wat er écht bezorgd is. Geen bewijs → geen belofte. Zou deze tekst afgaan op het
 * bestaan van de cron-route, dan was de leugen alleen verplaatst — een cron die in
 * de codebase staat is niet hetzelfde als een cron die draait.
 */
function Rustig({ dagbriefing }: { dagbriefing: SignalenAntwoord['dagbriefing'] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
      <Compass
        size={16}
        strokeWidth={2}
        aria-hidden="true"
        style={{ color: 'var(--text-4)', flex: 'none', marginTop: 2 }}
      />
      <div>
        <p style={{ margin: '0 0 3px', fontSize: 15, color: 'var(--text-2)' }}>
          Niets dat nu je aandacht vraagt.
        </p>
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--text-4)' }}>
          {meekijkTekst(dagbriefing, new Date())}
        </p>
      </div>
    </div>
  )
}

function Lijst({ signalen }: { signalen: Signaal[] }) {
  return (
    <ol
      aria-live="polite"
      style={{ listStyle: 'none', margin: 0, padding: 0, display: 'block' }}
    >
      {signalen.map((signaal, i) => (
        <SignaalRegel key={signaal.soort} signaal={signaal} lead={i === 0} />
      ))}
    </ol>
  )
}

/** Deels gevallen bronnen. Zwijgen zou suggereren dat dit alles is wat er speelt. */
function DeelsMis({ bronnen }: { bronnen: string[] }) {
  if (bronnen.length === 0) return null
  return (
    <p
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        margin: '14px 0 0',
        paddingTop: 11,
        borderTop: '1px solid var(--line)',
        fontSize: 11,
        lineHeight: 1.5,
        color: 'var(--status-aandacht)',
      }}
    >
      <TriangleAlert size={12} strokeWidth={2.2} aria-hidden="true" style={{ flex: 'none' }} />
      Ik kon je {bronnen.join(' en ')} niet ophalen — er kan iets missen.
    </p>
  )
}
