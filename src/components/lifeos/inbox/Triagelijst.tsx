'use client'

import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { gmailLink, type TriageMailJson } from '@/lib/lifeos/inbox/inbox'
import { tijdLabel } from '@/lib/lifeos/datum/datum'

// Presentationeel: props erin, UI eruit. Geen fetch, geen klok — de enige state
// is de hover van een regel.
//
// Die hover zit in state en niet in CSS omdat inline styles geen `:hover` kennen
// en `globals.css` niet van deze functie is. Zelfde afweging (en zelfde vorm) als
// `os/Knop.tsx`. De focus-ring komt wél uit globals.css (`:focus-visible`) en is
// er dus sowieso — ook als iemand deze component vergeet.
//
// DIT IS GEEN MAILCLIENT — en dat zie je aan wat er niet staat.
// Geen body, geen preview, geen snippet, geen "lees meer". Elke regel is precies
// genoeg om te herkennen wát er ligt, en één tik om het in Gmail te openen. Wie
// hier een preview aan toevoegt, is Gmail aan het nabouwen; dat is maanden werk
// en levert een slechtere Gmail (README §10).

interface TriagelijstProps {
  mails: TriageMailJson[]
  /** Hoeveel ongelezen mails er beoordeeld zijn. De noemer. */
  gescand: number
  /** Mails die er wel zijn maar die we niet konden lezen. Bijna altijd 0. */
  nietGelezen: number
}

export function Triagelijst({ mails, gescand, nietGelezen }: TriagelijstProps) {
  if (gescand === 0 && nietGelezen === 0) {
    // Wél gekeken, niets gevonden. Dat is een antwoord, geen lege staat: er ligt
    // gewoon geen ongelezen post van vandaag.
    return (
      <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
        Geen ongelezen mail van vandaag.
      </p>
    )
  }

  if (mails.length === 0) {
    return (
      <div>
        <p className="os-cijfer" style={{ fontSize: 30, lineHeight: 1, margin: '0 0 8px' }}>
          0
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 4px', fontWeight: 600 }}>
          Niets vraagt iets van je.
        </p>
        <Noemer gescand={gescand} getoond={0} />
        <Onleesbaar aantal={nietGelezen} />
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div>
        {/* Hiërarchie via schaal: het aantal is het cijfer waar je op mikt, de
            regels lezen daarna. */}
        <p
          className="os-cijfer"
          style={{ fontSize: 30, lineHeight: 1, margin: '0 0 8px', color: 'var(--brand)' }}
        >
          {mails.length}
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0, fontWeight: 600 }}>
          {mails.length === 1
            ? 'mail vraagt vandaag iets van je'
            : 'mails vragen vandaag iets van je'}
        </p>
      </div>

      <ul style={{ display: 'grid', gap: 2, listStyle: 'none', padding: 0, margin: 0 }}>
        {mails.map((mail) => (
          <li key={mail.id}>
            <Regel mail={mail} />
          </li>
        ))}
      </ul>

      <div>
        <Noemer gescand={gescand} getoond={mails.length} />
        <Onleesbaar aantal={nietGelezen} />
      </div>
    </div>
  )
}

/**
 * De halve storing.
 *
 * Gmail gaf het id wel, de metadata niet. Zwijgen zou de noemer hierboven tot een
 * leugen maken — "3 van de 12" terwijl er ook nog 6 zijn waar we niets van weten.
 * `role="status"`, geen `alert`: het is een mededeling, geen alarm.
 */
function Onleesbaar({ aantal }: { aantal: number }) {
  if (aantal === 0) return null

  return (
    <p
      role="status"
      style={{
        fontSize: 11,
        color: 'var(--status-aandacht)',
        margin: '6px 0 0',
        lineHeight: 1.5,
      }}
    >
      {aantal === 1
        ? 'Van 1 mail konden we de gegevens niet ophalen; die staat hier niet tussen.'
        : `Van ${aantal} mails konden we de gegevens niet ophalen; die staan hier niet tussen.`}
    </p>
  )
}

/**
 * De verantwoording.
 *
 * Zonder dit getal verbergt de kaart hoeveel er is weggefilterd, en is de
 * classificatie niet te controleren — precies het stille fout-negatief waar
 * `classificeer.ts` voor waarschuwt. "3 van de 47" zegt eerlijk: er zijn er 44
 * weggelaten, en als je twijfelt staat Gmail één tik verderop.
 */
function Noemer({ gescand, getoond }: { gescand: number; getoond: number }) {
  return (
    <p style={{ fontSize: 11, color: 'var(--text-4)', margin: 0, lineHeight: 1.5 }}>
      {`${getoond} van de ${gescand} ongelezen ${gescand === 1 ? 'mail' : 'mails'} van vandaag. `}
      De rest is nieuwsbrief, bulk of no-reply.
    </p>
  )
}

/**
 * Eén regel: afzender, onderwerp, tijd, en waaróm hij hier staat.
 *
 * De hele regel is de link — een klein pijltje als klikdoel is een pesterij op
 * een telefoon. `target="_blank"` met `rel="noopener noreferrer"`: zonder
 * `noopener` krijgt de geopende pagina `window.opener` en kan hij deze tab
 * wegnavigeren.
 */
function Regel({ mail }: { mail: TriageMailJson }) {
  const [hover, setHover] = useState(false)

  const afzender = mail.afzender ?? 'Onbekende afzender'
  const onderwerp = mail.onderwerp ?? 'Bericht zonder onderwerp'

  return (
    <a
      href={gmailLink(mail.id)}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      // De reden staat zichtbaar in de regel; voor een screenreader plakken we
      // 'm aan de link zodat de aankondiging compleet is zonder de tekst twee
      // keer voor te lezen.
      aria-label={`${afzender}: ${onderwerp}. ${mail.reden} Openen in Gmail, nieuw tabblad.`}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '0 10px',
        alignItems: 'baseline',
        padding: '9px 10px',
        margin: '0 -10px',
        borderRadius: 8,
        textDecoration: 'none',
        background: hover ? 'var(--bg-raised)' : 'transparent',
        // Alleen background: geen layout-properties animeren.
        transition: 'background 180ms var(--ease)',
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-2)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {afzender}
      </span>

      <span
        className="os-cijfer"
        style={{
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          color: hover ? 'var(--brand)' : 'var(--text-4)',
          transition: 'color 180ms var(--ease)',
        }}
      >
        {tijdLabel(new Date(mail.ontvangenOp))}
        <ArrowUpRight size={12} strokeWidth={2.2} aria-hidden="true" />
      </span>

      <span
        style={{
          gridColumn: '1 / -1',
          fontSize: 13,
          color: 'var(--text-3)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {onderwerp}
      </span>

      {/* De reden. Klein, maar altijd zichtbaar: een oordeel dat je niet kunt
          narekenen is geen oordeel. */}
      <span style={{ gridColumn: '1 / -1', fontSize: 10.5, color: 'var(--text-4)', marginTop: 3 }}>
        {mail.reden}
      </span>
    </a>
  )
}
