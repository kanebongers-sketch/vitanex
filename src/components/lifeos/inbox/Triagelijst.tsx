'use client'

import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { gmailInboxLink, gmailLink, type TriageMailJson } from '@/lib/lifeos/inbox/inbox'
import { tijdLabel } from '@/lib/lifeos/datum/datum'
import type { HaalUitkomst } from '@/lib/lifeos/api/http'
import type { Suggestie } from '@/lib/lifeos/inbox/analyse'
import { actieVan, type ActieSuggestie } from './suggestie-actie'
import { SuggestieActie } from './SuggestieActie'
import { MailActies } from './MailActies'
import type { MailActieSoort } from './mail-acties'
import type { AnalyseStatus } from './useSuggesties'

// Presentationeel: props erin, UI eruit. Geen fetch, geen klok — de enige state
// is de hover van een regel. De AI-suggesties komen als kant-en-klare lookup van
// boven (`suggestieVoor`) en de aanmaak-call als `onMaak`; deze lijst haalt dus
// nog steeds niets zelf op.
//
// Die hover zit in state en niet in CSS omdat inline styles geen `:hover` kennen
// en `globals.css` niet van deze functie is. Zelfde afweging (en zelfde vorm) als
// `os/Knop.tsx`. De focus-ring komt wél uit globals.css (`:focus-visible`) en is
// er dus sowieso — ook als iemand deze component vergeet.
//
// DIT IS GEEN MAILCLIENT — en dat zie je aan wat er niet staat.
// Geen body, geen preview, geen snippet, geen "lees meer". Elke regel is precies
// genoeg om te herkennen wát er ligt, en één tik om het in Gmail te openen. De
// suggestie-knop maakt hoogstens een taak of afspraak aan; hij toont nooit
// mail-inhoud. Wie hier een preview aan toevoegt, is Gmail aan het nabouwen; dat
// is maanden werk en levert een slechtere Gmail (README §10).

interface TriagelijstProps {
  /** Ongelezen post die om actie vraagt — je to-do, bovenaan. */
  mails: TriageMailJson[]
  /** Al het overige van vandaag: gelezen post en ruis. Het volledige overzicht. */
  overige: TriageMailJson[]
  /** Hoeveel mails van vandaag er beoordeeld zijn. De noemer. */
  gescand: number
  /** Mails die er wel zijn maar die we niet konden lezen. Bijna altijd 0. */
  nietGelezen: number
  /** De AI-suggestie per mail, of null. Kant-en-klaar van de container. */
  suggestieVoor: (externId: string) => Suggestie | null
  /** Staat van de suggestie-analyse, zodat een storing eerlijk gemeld wordt. */
  analyseStatus: AnalyseStatus
  /** Maakt de taak/afspraak aan. De container is de enige plek met de fetch. */
  onMaak: (actie: ActieSuggestie) => Promise<HaalUitkomst<true>>
  /** Archiveert of markeert als gelezen — raakt Gmail zelf. Weglaten = geen knoppen. */
  onMailActie?: (soort: MailActieSoort, mail: TriageMailJson) => Promise<HaalUitkomst<true>>
  /** Laat Vita een concept-antwoord schrijven. Weglaten = geen concept-knop. */
  onConcept?: (mail: TriageMailJson) => Promise<HaalUitkomst<true>>
}

const LIJST_STIJL = { display: 'grid', gap: 10, listStyle: 'none', padding: 0, margin: 0 } as const

export function Triagelijst({
  mails,
  overige,
  gescand,
  nietGelezen,
  suggestieVoor,
  analyseStatus,
  onMaak,
  onMailActie,
  onConcept,
}: TriagelijstProps) {
  if (gescand === 0 && nietGelezen === 0) {
    // Wél gekeken, niets gevonden. Dat is een antwoord, geen lege staat: er ligt
    // gewoon geen post van vandaag.
    return (
      <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
        <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
          Geen mail van vandaag.
        </p>
        <OpenInGmail />
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Vraagt actie — je to-do: alleen ongelezen post die er inhoudelijk toe doet. */}
      <section style={{ display: 'grid', gap: 12 }}>
        {mails.length > 0 ? (
          <>
            <div>
              {/* Hiërarchie via schaal: het aantal is het cijfer waar je op mikt,
                  de regels lezen daarna. */}
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

            <ul style={LIJST_STIJL}>
              {mails.map((mail) => (
                <li key={mail.id}>
                  <Regel
                    mail={mail}
                    actie={actieVan(suggestieVoor(mail.id))}
                    onMaak={onMaak}
                    onMailActie={onMailActie}
                    onConcept={onConcept}
                  />
                </li>
              ))}
            </ul>
            <AnalyseStoring status={analyseStatus} />
          </>
        ) : (
          <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
            Niets ongelezen vraagt vandaag om actie.
          </p>
        )}
      </section>

      {/* Alles van vandaag — het volledige overzicht: gelezen post en de ruis die
          de to-do niet haalde. Geen actieknoppen; puur om te zien wát er ligt. */}
      {overige.length > 0 ? (
        <section style={{ display: 'grid', gap: 10 }}>
          <h3
            style={{
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-4)',
              fontWeight: 600,
              margin: 0,
            }}
          >
            Alles van vandaag · {gescand}
          </h3>
          <ul style={LIJST_STIJL}>
            {overige.map((mail) => (
              <li key={mail.id}>
                <Regel mail={mail} actie={null} onMaak={onMaak} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
        <Onleesbaar aantal={nietGelezen} />
        <OpenInGmail />
      </div>
    </div>
  )
}

/**
 * De sprong naar Gmail zelf. De kaart is geen mailclient (zie de kop); voor "alles
 * echt lezen, beantwoorden, verwijderen" is Gmail één tik verderop.
 */
function OpenInGmail() {
  return (
    <a
      href={gmailInboxLink()}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--brand)',
        textDecoration: 'none',
      }}
    >
      Alles openen in Gmail
      <ArrowUpRight size={12} strokeWidth={2.2} aria-hidden="true" />
    </a>
  )
}

/**
 * De halve storing van de suggesties.
 *
 * Lukt de AI-analyse niet, dan verschijnt er bij geen enkele mail een knop.
 * Zwijgen zou dat laten lezen als "geen van deze mails vraagt om een taak" —
 * terwijl we het niet hebben kunnen bepalen. Dus zeggen we het, rustig: de mails
 * hierboven werken gewoon, alleen de suggestie ontbreekt. Fout ≠ leeg.
 * `role="status"`, geen `alert`: het is een mededeling, geen alarm.
 */
function AnalyseStoring({ status }: { status: AnalyseStatus }) {
  if (status !== 'fout') return null

  return (
    <p
      role="status"
      style={{ fontSize: 11, color: 'var(--text-4)', margin: '6px 0 0', lineHeight: 1.5 }}
    >
      AI-suggesties zijn nu even niet beschikbaar. De mails hierboven kun je gewoon in Gmail openen.
    </p>
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

interface RegelProps {
  mail: TriageMailJson
  /** De aanmaakbare actie voor deze mail, of null (geen suggestie → geen knop). */
  actie: ActieSuggestie | null
  onMaak: (actie: ActieSuggestie) => Promise<HaalUitkomst<true>>
  onMailActie?: TriagelijstProps['onMailActie']
  onConcept?: TriagelijstProps['onConcept']
}

/**
 * Eén regel: de mail als Gmail-link, en — als de AI er een taak of afspraak in
 * zag — een aparte knop eronder.
 *
 * De knop staat NAAST de link, niet erin: een `<button>` in een `<a>` is
 * ongeldige HTML en breekt toetsenbord- en screenreader-gedrag. De mail-info
 * blijft één groot kliktoel naar Gmail; de suggestie-knop is een tweede,
 * duidelijk aparte actie. `target="_blank"` met `rel="noopener noreferrer"`:
 * zonder `noopener` krijgt de geopende pagina `window.opener` en kan hij deze tab
 * wegnavigeren.
 */
function Regel({ mail, actie, onMaak, onMailActie, onConcept }: RegelProps) {
  const [hover, setHover] = useState(false)

  const afzender = mail.afzender ?? 'Onbekende afzender'
  const onderwerp = mail.onderwerp ?? 'Bericht zonder onderwerp'

  return (
    <div style={{ display: 'grid', gap: 6 }}>
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

      {actie ? <SuggestieActie actie={actie} onMaak={onMaak} /> : null}

      {onMailActie && onConcept ? (
        <MailActies mail={mail} onActie={onMailActie} onConcept={onConcept} />
      ) : null}
    </div>
  )
}
