'use client'

import { useState } from 'react'
import { ArrowUpRight, ChevronDown } from 'lucide-react'
import { gmailInboxLink, gmailLink, type TriageMailJson } from '@/lib/lifeos/inbox/inbox'
import { tijdLabel } from '@/lib/lifeos/datum/datum'
import type { HaalUitkomst } from '@/lib/lifeos/api/http'
import type { Suggestie } from '@/lib/lifeos/inbox/analyse'
import { actieVan, type ActieSuggestie } from './suggestie-actie'
import { SuggestieActie } from './SuggestieActie'
import { MailActies } from './MailActies'
import type { MailActieSoort } from './mail-acties'
import type { AnalyseStatus } from './useSuggesties'

// Presentationeel: props erin, UI eruit. De enige state is de hover van een regel
// en of "alles van vandaag" is uitgeklapt. De AI-suggesties komen als kant-en-klare
// lookup van boven (`suggestieVoor`) en de aanmaak-call als `onMaak`; deze lijst
// haalt dus nog steeds niets zelf op.
//
// ─── SUPER OVERZICHTELIJK: BELANGRIJK VOOROP ────────────────────────────────
// De kaart leidt met wat ertoe doet: de belangrijke mails van vandaag als rustige,
// scanbare kaartjes (afzender vet, onderwerp, een reden-pill die zegt wáárom het
// belangrijk is, en de acties eronder). Al het overige van vandaag — gelezen post
// en ruis — zit ingeklapt achter één knop, zodat het het belangrijke niet verdringt.
// Hiërarchie via schaal en een cyaan accent, niet via kleurenlawaai.
//
// DIT IS GEEN MAILCLIENT — en dat zie je aan wat er niet staat.
// Geen body, geen preview, geen snippet. Elke regel is precies genoeg om te
// herkennen wát er ligt, en één tik om het in Gmail te openen. De suggestie-knop
// maakt hoogstens een taak of afspraak aan; hij toont nooit mail-inhoud.

interface TriagelijstProps {
  /** Ongelezen post die om actie vraagt — de belangrijke mails, vooraan. */
  mails: TriageMailJson[]
  /** Al het overige van vandaag: gelezen post en ruis. Ingeklapt, het volledige overzicht. */
  overige: TriageMailJson[]
  /** Hoeveel mails van vandaag er beoordeeld zijn. */
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
  const [toonAlles, setToonAlles] = useState(false)

  if (gescand === 0 && nietGelezen === 0) {
    // Wél gekeken, niets gevonden. Dat is een antwoord, geen lege staat.
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
      {/* Belangrijk vandaag — de kop is het cijfer waar je op mikt. */}
      <section style={{ display: 'grid', gap: 12 }}>
        <div>
          <p
            className="os-cijfer"
            style={{ fontSize: 34, lineHeight: 1, margin: '0 0 4px', color: 'var(--brand)' }}
          >
            {mails.length}
          </p>
          <p style={{ fontSize: 13.5, color: 'var(--text-2)', margin: 0, fontWeight: 600 }}>
            {mails.length === 1 ? 'belangrijke mail vandaag' : 'belangrijke mails vandaag'}
          </p>
        </div>

        {mails.length > 0 ? (
          <ul style={LIJST_STIJL}>
            {mails.map((mail) => (
              <li key={mail.id}>
                <BelangrijkeMail
                  mail={mail}
                  actie={actieVan(suggestieVoor(mail.id))}
                  onMaak={onMaak}
                  onMailActie={onMailActie}
                  onConcept={onConcept}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
            Niets belangrijks ongelezen. Alles van vandaag staat hieronder.
          </p>
        )}

        <AnalyseStoring status={analyseStatus} />
      </section>

      {/* Alles van vandaag — ingeklapt, zodat het het belangrijke niet verdringt. */}
      {overige.length > 0 ? (
        <section style={{ display: 'grid', gap: 10 }}>
          <button
            type="button"
            onClick={() => setToonAlles((v) => !v)}
            aria-expanded={toonAlles}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              justifySelf: 'start',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-3)',
              background: 'transparent',
              border: 'none',
              padding: '4px 0',
              cursor: 'pointer',
            }}
          >
            <ChevronDown
              size={14}
              strokeWidth={2.2}
              aria-hidden="true"
              style={{
                transform: toonAlles ? 'rotate(180deg)' : 'none',
                transition: 'transform 180ms var(--ease)',
              }}
            />
            {toonAlles ? 'Verberg' : 'Toon'} alles van vandaag · {overige.length}
          </button>

          {toonAlles ? (
            <ul style={LIJST_STIJL}>
              {overige.map((mail) => (
                <li key={mail.id}>
                  <OverigeMail mail={mail} />
                </li>
              ))}
            </ul>
          ) : null}
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
 * terwijl we het niet hebben kunnen bepalen. Dus zeggen we het, rustig.
 * `role="status"`, geen `alert`: het is een mededeling, geen alarm.
 */
function AnalyseStoring({ status }: { status: AnalyseStatus }) {
  if (status !== 'fout') return null

  return (
    <p
      role="status"
      style={{ fontSize: 11, color: 'var(--text-4)', margin: 0, lineHeight: 1.5 }}
    >
      AI-suggesties zijn nu even niet beschikbaar. De mails hierboven kun je gewoon in Gmail openen.
    </p>
  )
}

/**
 * De halve storing.
 *
 * Gmail gaf het id wel, de metadata niet. Zwijgen zou de kaart tot een leugen
 * maken. `role="status"`, geen `alert`: het is een mededeling, geen alarm.
 */
function Onleesbaar({ aantal }: { aantal: number }) {
  if (aantal === 0) return null

  return (
    <p
      role="status"
      style={{
        fontSize: 11,
        color: 'var(--status-aandacht)',
        margin: 0,
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
 * Eén belangrijke mail als kaartje: afzender vet, onderwerp, een reden-pill die
 * zegt wáárom het belangrijk is, de tijd, en de acties eronder.
 *
 * De knoppen staan NAAST de link, niet erin: een `<button>` in een `<a>` is
 * ongeldige HTML en breekt toetsenbord- en screenreader-gedrag. `target="_blank"`
 * met `rel="noopener noreferrer"`: zonder `noopener` krijgt de geopende pagina
 * `window.opener` en kan hij deze tab wegnavigeren.
 */
function BelangrijkeMail({ mail, actie, onMaak, onMailActie, onConcept }: RegelProps) {
  const [hover, setHover] = useState(false)

  const afzender = mail.afzender ?? 'Onbekende afzender'
  const onderwerp = mail.onderwerp ?? 'Bericht zonder onderwerp'

  return (
    <div
      style={{
        display: 'grid',
        gap: 8,
        padding: '12px 14px',
        background: hover ? 'var(--bg-raised)' : 'var(--bg-card)',
        border: '1px solid var(--line)',
        // Het cyaan accent aan de linkerkant: dít is belangrijk. Semantisch, geen sier.
        borderLeft: '2px solid var(--brand)',
        borderRadius: 'var(--radius-card)',
        transition: 'background 180ms var(--ease)',
      }}
    >
      <a
        href={gmailLink(mail.id)}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label={`${afzender}: ${onderwerp}. ${mail.reden} Openen in Gmail, nieuw tabblad.`}
        style={{ display: 'grid', gap: 4, textDecoration: 'none' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-1)',
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
              whiteSpace: 'nowrap',
            }}
          >
            {tijdLabel(new Date(mail.ontvangenOp))}
            <ArrowUpRight size={12} strokeWidth={2.2} aria-hidden="true" />
          </span>
        </div>

        <span
          style={{
            fontSize: 13.5,
            color: 'var(--text-2)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {onderwerp}
        </span>
      </a>

      {/* Waarom dit belangrijk is — als pill, klein maar altijd zichtbaar: een
          oordeel dat je niet kunt narekenen is geen oordeel. */}
      <span
        style={{
          justifySelf: 'start',
          fontSize: 10.5,
          fontWeight: 600,
          color: 'var(--brand)',
          background: 'var(--brand-soft)',
          borderRadius: 999,
          padding: '2px 9px',
          lineHeight: 1.5,
        }}
      >
        {mail.reden}
      </span>

      {actie ? <SuggestieActie actie={actie} onMaak={onMaak} /> : null}

      {onMailActie && onConcept ? (
        <MailActies mail={mail} onActie={onMailActie} onConcept={onConcept} />
      ) : null}
    </div>
  )
}

/**
 * Eén regel uit "alles van vandaag": compact, één tik naar Gmail, geen acties.
 * Bewust rustiger dan `BelangrijkeMail` — dit is het overzicht, niet de to-do.
 */
function OverigeMail({ mail }: { mail: TriageMailJson }) {
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
      aria-label={`${afzender}: ${onderwerp}. Openen in Gmail, nieuw tabblad.`}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '0 10px',
        alignItems: 'baseline',
        padding: '7px 10px',
        margin: '0 -10px',
        borderRadius: 8,
        textDecoration: 'none',
        background: hover ? 'var(--bg-raised)' : 'transparent',
        transition: 'background 180ms var(--ease)',
      }}
    >
      <span
        style={{
          fontSize: 12.5,
          color: 'var(--text-3)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{afzender}</span>
        {'  ·  '}
        {onderwerp}
      </span>
      <span
        className="os-cijfer"
        style={{
          fontSize: 10.5,
          color: hover ? 'var(--brand)' : 'var(--text-4)',
          whiteSpace: 'nowrap',
          transition: 'color 180ms var(--ease)',
        }}
      >
        {tijdLabel(new Date(mail.ontvangenOp))}
      </span>
    </a>
  )
}
