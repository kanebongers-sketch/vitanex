'use client'

import { useCallback, useEffect, useRef, type MouseEvent } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ArrowLeft, Bell, Building2, CalendarDays, ChevronRight, Dumbbell, MapPin, Palette, Smartphone, Users, Wand2, type LucideIcon } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { BEHEER } from '@/lib/aiyourgym/taal/woorden/club/beheer'
import { isInstelGroep, type InstelGroep } from '@/lib/club/kern/instel-paginas'
import type { CentrumCategorie, CentrumRegel, CentrumStart } from './typen'

// Het instellingencentrum: links de categorieen, rechts de inhoud van de
// gekozen categorie (zoals de instellingen van macOS of Linear). Op de telefoon
// eerst de lijst, na een tik de inhoud met een weg terug. De categorie staat in
// de url (?categorie=), zodat Ctrl K, een link of de terugknop meteen de juiste
// opent. Elke categorie is een gewone link: zonder JavaScript werkt het ook.

const ICOON: Record<InstelGroep, LucideIcon> = {
  merk: Palette,
  vestigingen: MapPin,
  team: Users,
  groepslessen: CalendarDays,
  coaching: Dumbbell,
  leden: Smartphone,
  communicatie: Bell,
  bedrijf: Building2,
}

/** Tot deze breedte staan lijst en inhoud na elkaar (zelfde grens als de css). */
const SMAL = '(max-width: 899px)'

interface InstelCentrumProps {
  categorieen: CentrumCategorie[]
  /** De startwizard als losse link, alleen voor de eigenaar. */
  start: CentrumStart | null
}

/** De url van het centrum met deze categorie (of zonder), met behoud van ?v=. */
function urlMet(pad: string, zoek: string, categorie: InstelGroep | null): string {
  const p = new URLSearchParams(zoek)
  if (categorie) p.set('categorie', categorie)
  else p.delete('categorie')
  const rest = p.toString()
  return rest ? `${pad}?${rest}` : pad
}

/** Een gewone klik (geen nieuw tabblad of venster)? */
function gewoneKlik(e: MouseEvent<HTMLAnchorElement>): boolean {
  return !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
}

export function InstelCentrum({ categorieen, start }: InstelCentrumProps) {
  const t = useTekst(BEHEER).centrum
  const zoek = useSearchParams()
  const pad = usePathname()
  const url = useCallback((c: InstelGroep | null) => urlMet(pad, zoek.toString(), c), [pad, zoek])
  const gevraagd = zoek.get('categorie')
  const gekozen = isInstelGroep(gevraagd) && categorieen.some((c) => c.sleutel === gevraagd) ? gevraagd : null
  const actief = categorieen.find((c) => c.sleutel === gekozen) ?? categorieen[0]
  const kop = useRef<HTMLHeadingElement>(null)
  const zelfGeduwd = useRef(false)
  const vorige = useRef(gekozen)

  // Op de telefoon wisselt het hele scherm: de focus gaat naar de nieuwe kop.
  useEffect(() => {
    if (vorige.current !== gekozen && gekozen && window.matchMedia(SMAL).matches) kop.current?.focus()
    vorige.current = gekozen
  }, [gekozen])

  const kies = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, sleutel: InstelGroep) => {
      if (!gewoneKlik(e)) return
      e.preventDefault()
      // Op de telefoon een stap in de geschiedenis (terugknop = lijst), op de pc alleen de url bijwerken.
      if (window.matchMedia(SMAL).matches && !gekozen) {
        zelfGeduwd.current = true
        window.history.pushState(null, '', url(sleutel))
      } else {
        window.history.replaceState(null, '', url(sleutel))
      }
    },
    [gekozen, url],
  )

  const terug = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (!gewoneKlik(e)) return
      e.preventDefault()
      if (zelfGeduwd.current) {
        zelfGeduwd.current = false
        window.history.back()
      } else {
        window.history.replaceState(null, '', url(null))
      }
    },
    [url],
  )

  if (!actief) return null

  return (
    <div className="club-ic" data-open={gekozen ? 'true' : 'false'}>
      <nav className="club-ic-nav" aria-label={t.categorieen}>
        <ul role="list">
          {categorieen.map((c) => {
            const Icoon = ICOON[c.sleutel]
            const hier = c.sleutel === actief.sleutel
            return (
              <li key={c.sleutel}>
                <a href={url(c.sleutel)} onClick={(e) => kies(e, c.sleutel)} className="club-ic-cat" aria-current={hier ? 'true' : undefined}>
                  <span className="club-ic-cat-icoon"><Icoon aria-hidden size={17} /></span>
                  <span className="club-ic-cat-tekst">
                    <span className="club-ic-cat-naam">{c.label}</span>
                    <span className="club-ic-cat-uitleg">{c.uitleg}</span>
                  </span>
                  {c.let && <span className="club-ic-stip" aria-hidden />}
                  <ChevronRight aria-hidden size={16} className="club-ic-cat-pijl" />
                </a>
              </li>
            )
          })}
        </ul>
        {start && (
          <Link href={start.href} className="club-ic-start">
            <Wand2 aria-hidden size={15} />
            <span>{t.startwizard}</span>
            {start.stand && <span className="club-ic-start-stand">{start.stand}</span>}
          </Link>
        )}
      </nav>

      <section className="club-ic-paneel" aria-labelledby="club-ic-titel" key={actief.sleutel}>
        <a href={url(null)} onClick={terug} className="club-ic-terug">
          <ArrowLeft aria-hidden size={16} /> {t.terug}
        </a>
        <header className="club-ic-paneelkop">
          <h2 id="club-ic-titel" ref={kop} tabIndex={-1}>{actief.label}</h2>
          <p>{actief.uitleg}</p>
        </header>
        <ul className="club-ic-rijen" role="list">
          {actief.rijen.map((r) => (
            <Rij key={r.id} regel={r} ookHier={t.ookHier} />
          ))}
        </ul>
      </section>
    </div>
  )
}

function Rij({ regel: r, ookHier }: { regel: CentrumRegel; ookHier: string }) {
  const inhoud = (
    <>
      <span className="club-ic-rij-tekst">
        <span className="club-ic-rij-naam">{r.titel}</span>
        <span className="club-ic-rij-uitleg">{r.uitleg}</span>
      </span>
      {r.stand && <span className={`club-ic-stand${r.let ? ' is-let' : ''}`}>{r.stand}</span>}
      {r.href && <ChevronRight aria-hidden size={17} className="club-ic-rij-pijl" />}
    </>
  )
  return (
    <li className="club-ic-rij-item">
      {r.href ? (
        <Link href={r.href} className="club-ic-rij">{inhoud}</Link>
      ) : (
        <div className="club-ic-rij is-uit">{inhoud}</div>
      )}
      {r.links.length > 0 && (
        <p className="club-ic-links">
          <span>{ookHier}</span>
          {r.links.map((l) => (
            <Link key={l.id} href={l.href}>{l.titel}</Link>
          ))}
        </p>
      )}
    </li>
  )
}
