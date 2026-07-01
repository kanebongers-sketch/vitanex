'use client'

// ════════════════════════════════════════════════════════════════════════════
// HR-onboarding (rol 'hr'). On-brand navy + cyan, lucide-iconen (geen emoji).
// De data-saves leven in page.tsx; deze component levert alleen de presentatie
// en roept de meegegeven handlers aan.
// ════════════════════════════════════════════════════════════════════════════

import { type Dispatch, type SetStateAction } from 'react'
import {
  Building2, KeyRound, BarChart3, UserRound, ArrowRight, PartyPopper, Rocket,
} from 'lucide-react'
import { VitaVeld, VitaInput, GesprekKnoppen } from './VitaKeuze'

export interface HrForm {
  naam: string
  functietitel: string
  telefoon: string
  bedrijfNaam: string
  stad: string
  kvk: string
  website: string
  sector: string
  grootte: string
}

export type HrStap = 'welkom' | 'gegevens' | 'bedrijf' | 'details' | 'klaar'
export const HR_STAPPEN: HrStap[] = ['welkom', 'gegevens', 'bedrijf', 'details', 'klaar']

const SECTOREN = [
  'Zorg & Welzijn', 'Technologie & IT', 'Logistiek & Transport',
  'Retail & E-commerce', 'Onderwijs & Onderzoek', 'Financiën & Verzekeringen',
  'Bouw & Vastgoed', 'Industrie & Productie', 'Horeca & Toerisme',
  'Overheid & Non-profit', 'Marketing & Communicatie', 'Juridisch & Advies',
  'Energie & Milieu', 'Landbouw & Voedsel', 'Anders',
]

const GROOTTES = [
  { val: '1-10',    label: '1 – 10',    sub: 'Klein team' },
  { val: '11-25',   label: '11 – 25',   sub: 'Groeiend bedrijf' },
  { val: '26-50',   label: '26 – 50',   sub: 'Middelgroot' },
  { val: '51-100',  label: '51 – 100',  sub: 'Groter bedrijf' },
  { val: '101-250', label: '101 – 250', sub: 'Groot bedrijf' },
  { val: '250+',    label: '250+',      sub: 'Enterprise' },
]

interface HrOnboardingProps {
  stap: HrStap
  setStap: (s: HrStap) => void
  hr: HrForm
  setHr: Dispatch<SetStateAction<HrForm>>
  bezig: boolean
  onAfronden: () => void
}

export default function HrOnboarding({ stap, setStap, hr, setHr, bezig, onAfronden }: HrOnboardingProps) {
  return (
    <>
      {stap === 'welkom' && (
        <div className="mf-animate-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="vita-samenvatting-icoon" aria-hidden style={{ width: 40, height: 40, borderRadius: 12 }}>
              <Building2 size={20} strokeWidth={1.75} />
            </span>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              {hr.naam ? `Welkom, ${hr.naam}` : 'Welkom, HR-professional'}
            </h1>
          </div>
          <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.65 }}>
            Laten we jouw organisatie instellen in MentaForce. Een paar vragen over jou en je bedrijf,
            zodat het platform direct op maat staat.
          </p>
          <ul className="vita-punten">
            {[
              { Icon: Building2, tekst: 'Jouw bedrijfsprofiel aanmaken' },
              { Icon: BarChart3, tekst: 'Sector en teamgrootte instellen' },
              { Icon: KeyRound, tekst: 'Automatisch een HR-code genereren voor werknemers' },
            ].map(({ Icon, tekst }) => (
              <li key={tekst}>
                <span className="vita-punt-check" aria-hidden><Icon size={13} strokeWidth={2} /></span>
                {tekst}
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setStap('gegevens')} className="vita-knop vita-knop-primary vita-knop-blok">
            Beginnen <ArrowRight size={17} strokeWidth={2.25} aria-hidden />
          </button>
          <p style={{ fontSize: 12.5, color: 'var(--text-4)', textAlign: 'center' }}>Minder dan 3 minuten · eenmalig</p>
        </div>
      )}

      {stap === 'gegevens' && (
        <div className="mf-animate-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <StapKop Icon={UserRound} titel="Jouw gegevens" sub="Hoe mogen we je noemen en wat is je rol?" />
          <VitaVeld label="Volledige naam" htmlFor="hr-naam">
            <VitaInput id="hr-naam" value={hr.naam} onChange={e => setHr(f => ({ ...f, naam: e.target.value }))} placeholder="Voor- en achternaam" autoFocus autoComplete="name" />
          </VitaVeld>
          <VitaVeld label="Functietitel" sub="Bijv. HR Manager, People & Culture Lead" htmlFor="hr-functie">
            <VitaInput id="hr-functie" value={hr.functietitel} onChange={e => setHr(f => ({ ...f, functietitel: e.target.value }))} placeholder="HR Manager" />
          </VitaVeld>
          <VitaVeld label="Telefoonnummer" sub="Optioneel — voor contact met het MentaForce-team" htmlFor="hr-tel">
            <VitaInput id="hr-tel" type="tel" value={hr.telefoon} onChange={e => setHr(f => ({ ...f, telefoon: e.target.value }))} placeholder="+32 4xx xx xx xx" autoComplete="tel" />
          </VitaVeld>
          <GesprekKnoppen onTerug={() => setStap('welkom')} onVolgende={() => setStap('bedrijf')} volgendeDisabled={!hr.naam.trim()} />
        </div>
      )}

      {stap === 'bedrijf' && (
        <div className="mf-animate-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <StapKop Icon={Building2} titel="Jouw organisatie" sub="Basisinformatie over het bedrijf" />
          <VitaVeld label="Bedrijfsnaam" htmlFor="hr-bedrijf">
            <VitaInput id="hr-bedrijf" value={hr.bedrijfNaam} onChange={e => setHr(f => ({ ...f, bedrijfNaam: e.target.value }))} placeholder="Naam van het bedrijf" autoFocus autoComplete="organization" />
          </VitaVeld>
          <VitaVeld label="Stad / vestigingsplaats" htmlFor="hr-stad">
            <VitaInput id="hr-stad" value={hr.stad} onChange={e => setHr(f => ({ ...f, stad: e.target.value }))} placeholder="Bijv. Amsterdam, Brussel…" />
          </VitaVeld>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <VitaVeld label="KvK-nummer" sub="Optioneel" htmlFor="hr-kvk">
              <VitaInput id="hr-kvk" value={hr.kvk} onChange={e => setHr(f => ({ ...f, kvk: e.target.value }))} placeholder="12345678" />
            </VitaVeld>
            <VitaVeld label="Website" sub="Optioneel" htmlFor="hr-web">
              <VitaInput id="hr-web" value={hr.website} onChange={e => setHr(f => ({ ...f, website: e.target.value }))} placeholder="www.bedrijf.nl" />
            </VitaVeld>
          </div>
          <GesprekKnoppen onTerug={() => setStap('gegevens')} onVolgende={() => setStap('details')} volgendeDisabled={!hr.bedrijfNaam.trim()} />
        </div>
      )}

      {stap === 'details' && (
        <div className="mf-animate-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <StapKop Icon={BarChart3} titel="Bedrijfsdetails" sub="Helpt ons het platform te optimaliseren voor jouw organisatie" />

          <VitaVeld label="Sector / branche">
            <div role="radiogroup" aria-label="Sector" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 240, overflowY: 'auto', paddingRight: 4 }}>
              {SECTOREN.map(s => (
                <button
                  key={s} type="button" role="radio" aria-checked={hr.sector === s}
                  onClick={() => setHr(f => ({ ...f, sector: s }))}
                  className="vita-chip" data-actief={hr.sector === s}
                  style={{ borderRadius: 10, textAlign: 'left', justifyContent: 'flex-start' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </VitaVeld>

          <VitaVeld label="Aantal medewerkers" sub="Hoe groot is de organisatie?">
            <div role="radiogroup" aria-label="Teamgrootte" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {GROOTTES.map(g => (
                <button
                  key={g.val} type="button" role="radio" aria-checked={hr.grootte === g.val}
                  onClick={() => setHr(f => ({ ...f, grootte: g.val }))}
                  className="vita-keuze-kaart" data-actief={hr.grootte === g.val}
                  style={{ textAlign: 'center', padding: '10px 8px' }}
                >
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>{g.label}</span>
                  <span style={{ display: 'block', fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>{g.sub}</span>
                </button>
              ))}
            </div>
          </VitaVeld>

          <GesprekKnoppen
            onTerug={() => setStap('bedrijf')}
            onVolgende={onAfronden}
            volgendeLabel={bezig ? 'Opslaan…' : 'Account activeren'}
            volgendeDisabled={bezig}
            bezig={bezig}
          />
        </div>
      )}

      {stap === 'klaar' && (
        <div className="mf-animate-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="vita-samenvatting-icoon" aria-hidden style={{ width: 40, height: 40, borderRadius: 12 }}>
              <PartyPopper size={20} strokeWidth={1.75} />
            </span>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Je bent klaar</h1>
          </div>
          <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.6 }}>
            Organisatie <strong style={{ color: 'var(--text-1)' }}>{hr.bedrijfNaam}</strong> is aangemaakt en jouw HR-account staat klaar.
          </p>
          <ul className="vita-samenvatting">
            {[
              { Icon: Building2, tekst: hr.bedrijfNaam, sub: `${hr.sector || 'Sector'} · ${hr.grootte || '?'} medewerkers` },
              { Icon: KeyRound, tekst: 'HR-code automatisch gegenereerd', sub: 'Deel met werknemers via Instellingen → Bedrijf' },
              { Icon: BarChart3, tekst: 'Dashboard klaar voor gebruik', sub: 'Data verschijnt zodra werknemers zich aanmelden' },
            ].map(item => (
              <li key={item.tekst} style={{ alignItems: 'flex-start' }}>
                <span className="vita-samenvatting-icoon" aria-hidden><item.Icon size={15} strokeWidth={2} /></span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>{item.tekst}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 400 }}>{item.sub}</span>
                </span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => { window.location.href = '/hr' }} className="vita-knop vita-knop-primary vita-knop-blok">
            Naar het HR-portaal <Rocket size={17} strokeWidth={2} aria-hidden />
          </button>
        </div>
      )}
    </>
  )
}

function StapKop({ Icon, titel, sub }: { Icon: typeof Building2; titel: string; sub: string }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
        <span className="vita-samenvatting-icoon" aria-hidden><Icon size={15} strokeWidth={1.75} /></span>
        <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-1)' }}>{titel}</h2>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-3)', paddingLeft: 38 }}>{sub}</p>
    </div>
  )
}
