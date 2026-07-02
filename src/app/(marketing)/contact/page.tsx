'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  Presentation, Euro, Wrench, Lock, Handshake, MessageCircle,
  Mail, Clock, MapPin, Check, ShieldCheck, Server, type LucideIcon,
} from 'lucide-react'
import Nav from '@/components/marketing/landing/Nav'
import Footer from '@/components/marketing/landing/Footer'
import { COLORS, FONT, MAXW, EASE, glassPanel } from '@/components/marketing/theme'

interface Onderwerp { id: string; label: string; beschrijving: string; icoon: LucideIcon }

const ONDERWERPEN: Onderwerp[] = [
  { id: 'demo', label: 'Demo aanvragen', beschrijving: 'Ontdek hoe MentaForce werkt voor jouw team', icoon: Presentation },
  { id: 'pricing', label: 'Prijsinformatie', beschrijving: 'Maatwerk offerte voor jouw organisatie', icoon: Euro },
  { id: 'technisch', label: 'Technische vraag', beschrijving: 'Support, integraties en API', icoon: Wrench },
  { id: 'privacy', label: 'Privacy & AVG', beschrijving: 'Vragen over gegevensverwerking', icoon: Lock },
  { id: 'partnership', label: 'Partnership', beschrijving: 'Samenwerking en reseller-programma', icoon: Handshake },
  { id: 'anders', label: 'Overig', beschrijving: 'Een andere vraag of opmerking', icoon: MessageCircle },
]

const FAQ = [
  {
    vraag: 'Ziet HR de individuele antwoorden van medewerkers?',
    antwoord: 'Nee. HR ziet uitsluitend geaggregeerde teamdata — gemiddelden en trends. Individuele check-in antwoorden zijn nooit zichtbaar voor HR.',
  },
  {
    vraag: 'Hoe worden de gegevens van medewerkers beschermd?',
    antwoord: 'MentaForce is volledig AVG-conform. Check-ins zijn anoniem en alle data wordt opgeslagen binnen de EU.',
  },
  {
    vraag: 'Wat kost MentaForce?',
    antwoord: 'Neem contact op voor prijzen en mogelijkheden — we denken graag mee op basis van de grootte en wensen van jouw organisatie.',
  },
  {
    vraag: 'Kan MentaForce integreren met ons HR-systeem?',
    antwoord: 'Neem contact op voor prijzen en mogelijkheden. We bespreken graag wat er voor jouw organisatie kan.',
  },
]

const TRUST: { icoon: LucideIcon; tekst: string }[] = [
  { icoon: Lock, tekst: 'Anonieme check-ins' },
  { icoon: ShieldCheck, tekst: 'Volledig AVG-conform' },
  { icoon: Server, tekst: 'Data opgeslagen in de EU' },
]

const veldStijl: React.CSSProperties = {
  width: '100%',
  background: COLORS.navyElev,
  border: `1px solid ${COLORS.line}`,
  borderRadius: 12,
  padding: '12px 16px',
  fontSize: 14,
  color: COLORS.ink,
  fontFamily: FONT.grotesk,
  outline: 'none',
  transition: `border-color .2s ${EASE}`,
}

const labelStijl: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: COLORS.inkDim,
  marginBottom: 6,
}

function veldFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = COLORS.cyan
}
function veldBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = COLORS.line
}

export default function Contact() {
  const [geselecteerd, setGeselecteerd] = useState<string | null>(null)
  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  const [organisatie, setOrganisatie] = useState('')
  const [teamgrootte, setTeamgrootte] = useState('')
  const [bericht, setBericht] = useState('')
  const [verzonden, setVerzonden] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  const formRef = useRef<HTMLDivElement>(null)
  const naamRef = useRef<HTMLInputElement>(null)

  async function verstuur(e: React.FormEvent) {
    e.preventDefault()
    if (!naam.trim() || !email.trim() || !bericht.trim()) return
    setBezig(true)
    setFout(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onderwerp: geselecteerd ?? '', naam, email, organisatie, teamgrootte, bericht }),
      })
      if (res.ok) {
        setVerzonden(true)
      } else {
        const json: unknown = await res.json().catch(() => null)
        const melding = typeof json === 'object' && json !== null && 'error' in json && typeof (json as { error: unknown }).error === 'string'
          ? (json as { error: string }).error
          : 'Je bericht kon niet worden verstuurd.'
        setFout(melding)
      }
    } catch {
      setFout('Je bericht kon niet worden verstuurd. Controleer je verbinding en probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  function kiesDemo() {
    setGeselecteerd('demo')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    formRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    naamRef.current?.focus({ preventScroll: true })
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.navy, color: COLORS.ink, fontFamily: FONT.grotesk }}>
      <Nav />

      <main>
        {/* Hero */}
        <section style={{ position: 'relative', overflow: 'hidden', padding: '72px 0 80px', borderBottom: `1px solid ${COLORS.line}` }}>
          <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 70% 80% at 50% 0%, ${COLORS.cyanSoft} 0%, transparent 60%)` }} />
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 28px', textAlign: 'center', position: 'relative' }}>
            <p style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '6px 16px', margin: '0 0 24px', fontSize: 12, fontWeight: 600, border: `1px solid ${COLORS.lineStrong}`, background: COLORS.cyanSoft, color: COLORS.ink }}>
              <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.cyan }} />
              Reactie binnen 24 uur op werkdagen
            </p>
            <h1 style={{ fontWeight: 700, fontSize: 'clamp(34px, 6vw, 56px)', lineHeight: 1.04, letterSpacing: '-0.035em', color: COLORS.ink, margin: '0 0 18px' }}>
              Neem contact op
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: COLORS.inkDim, margin: 0 }}>
              Vraag een demo aan, bespreek de mogelijkheden of stel een vraag. We staan klaar om te helpen.
            </p>
          </div>
        </section>

        {/* Formulier + info */}
        <section style={{ maxWidth: MAXW, margin: '0 auto', padding: '64px 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48 }}>

          {/* Links: formulier */}
          <div ref={formRef} style={{ scrollMarginTop: 96 }}>
            {verzonden ? (
              <div role="status" aria-live="polite" style={{ ...glassPanel, padding: '56px 40px', textAlign: 'center' }}>
                <span style={{ width: 72, height: 72, borderRadius: '50%', background: COLORS.cyanSoft, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <Check aria-hidden size={32} style={{ color: COLORS.cyan }} />
                </span>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.ink, margin: '0 0 12px' }}>Bericht verstuurd</h2>
                <p style={{ color: COLORS.inkDim, margin: '0 0 8px', lineHeight: 1.6 }}>
                  We hebben je bericht ontvangen en nemen zo snel mogelijk contact op.
                </p>
                <p style={{ fontSize: 14, color: COLORS.inkDim, margin: '0 0 32px' }}>
                  Verwacht een reactie op <span style={{ color: COLORS.cyan }}>{email}</span> binnen 24 uur op werkdagen.
                </p>
                <button
                  onClick={() => { setVerzonden(false); setFout(null); setNaam(''); setEmail(''); setOrganisatie(''); setTeamgrootte(''); setBericht(''); setGeselecteerd(null) }}
                  style={{ fontSize: 14, fontWeight: 500, color: COLORS.ink, background: 'transparent', border: `1px solid ${COLORS.lineStrong}`, padding: '12px 24px', borderRadius: 12, cursor: 'pointer', fontFamily: FONT.grotesk, transition: `border-color .2s ${EASE}` }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.cyan }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.lineStrong }}
                >
                  Nieuw bericht sturen
                </button>
              </div>
            ) : (
              <form onSubmit={verstuur}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.ink, margin: '0 0 24px' }}>Stuur ons een bericht</h2>

                {/* Onderwerp */}
                <div role="group" aria-label="Onderwerp" style={{ marginBottom: 24 }}>
                  <p style={{ ...labelStijl, marginBottom: 12 }}>Onderwerp</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                    {ONDERWERPEN.map((o) => {
                      const actief = geselecteerd === o.id
                      const Icoon = o.icoon
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setGeselecteerd(o.id)}
                          aria-pressed={actief}
                          style={{
                            textAlign: 'left', padding: 12, borderRadius: 12, cursor: 'pointer',
                            fontFamily: FONT.grotesk,
                            background: actief ? COLORS.cyanSoft : COLORS.navyElev,
                            border: `1px solid ${actief ? COLORS.cyan : COLORS.line}`,
                            transition: `border-color .2s ${EASE}, background .2s ${EASE}`,
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Icoon aria-hidden size={15} style={{ color: actief ? COLORS.cyan : COLORS.inkDim, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{o.label}</span>
                          </span>
                          <span style={{ fontSize: 12, lineHeight: 1.4, color: COLORS.inkDim }}>{o.beschrijving}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Naam + e-mail */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label htmlFor="contact-naam" style={labelStijl}>Naam *</label>
                    <input
                      id="contact-naam" ref={naamRef} type="text" value={naam}
                      onChange={(e) => setNaam(e.target.value)} placeholder="Jan Janssen" required
                      style={veldStijl} onFocus={veldFocus} onBlur={veldBlur}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" style={labelStijl}>E-mailadres *</label>
                    <input
                      id="contact-email" type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)} placeholder="jan@bedrijf.nl" required
                      style={veldStijl} onFocus={veldFocus} onBlur={veldBlur}
                    />
                  </div>
                </div>

                {/* Organisatie + teamgrootte */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label htmlFor="contact-organisatie" style={labelStijl}>Organisatie</label>
                    <input
                      id="contact-organisatie" type="text" value={organisatie}
                      onChange={(e) => setOrganisatie(e.target.value)} placeholder="Bedrijfsnaam"
                      style={veldStijl} onFocus={veldFocus} onBlur={veldBlur}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-teamgrootte" style={labelStijl}>Teamgrootte</label>
                    <select
                      id="contact-teamgrootte" value={teamgrootte}
                      onChange={(e) => setTeamgrootte(e.target.value)}
                      style={{ ...veldStijl, appearance: 'none', color: teamgrootte ? COLORS.ink : COLORS.inkDim }}
                      onFocus={veldFocus} onBlur={veldBlur}
                    >
                      <option value="" disabled>Selecteer grootte</option>
                      <option value="10-24">10 – 24 medewerkers</option>
                      <option value="25-49">25 – 49 medewerkers</option>
                      <option value="50-99">50 – 99 medewerkers</option>
                      <option value="100-249">100 – 249 medewerkers</option>
                      <option value="250+">250+ medewerkers</option>
                    </select>
                  </div>
                </div>

                {/* Bericht */}
                <div style={{ marginBottom: 24 }}>
                  <label htmlFor="contact-bericht" style={labelStijl}>Bericht *</label>
                  <textarea
                    id="contact-bericht" rows={5} value={bericht}
                    onChange={(e) => setBericht(e.target.value)} placeholder="Beschrijf je vraag of verzoek..." required
                    style={{ ...veldStijl, resize: 'none' }} onFocus={veldFocus} onBlur={veldBlur}
                  />
                </div>

                {fout && (
                  <div role="alert" style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 12, border: `1px solid ${COLORS.lineStrong}`, background: COLORS.navyElev, fontSize: 14, lineHeight: 1.6, color: COLORS.ink }}>
                    {fout}{' '}
                    Of mail ons direct op{' '}
                    <a href="mailto:info@mentaforce.nl" style={{ color: COLORS.cyan, textDecorationColor: COLORS.cyan }}>info@mentaforce.nl</a>.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={bezig || !naam.trim() || !email.trim() || !bericht.trim()}
                  style={{
                    width: '100%', padding: '15px 0', borderRadius: 12, border: 'none', cursor: bezig ? 'wait' : 'pointer',
                    fontFamily: FONT.grotesk, fontSize: 15, fontWeight: 600,
                    color: COLORS.navyDeep, background: COLORS.cyan,
                    boxShadow: `0 10px 36px ${COLORS.cyanSoft}`,
                    opacity: bezig || !naam.trim() || !email.trim() || !bericht.trim() ? 0.5 : 1,
                    transition: `opacity .2s ${EASE}, transform .2s ${EASE}`,
                  }}
                >
                  {bezig ? 'Versturen...' : 'Bericht versturen →'}
                </button>

                <p style={{ fontSize: 12, textAlign: 'center', marginTop: 16, color: COLORS.inkDim }}>
                  Door te versturen ga je akkoord met onze{' '}
                  <Link href="/voorwaarden" style={{ color: COLORS.inkDim, textDecoration: 'underline' }}>Voorwaarden</Link>.
                </p>
              </form>
            )}
          </div>

          {/* Rechts: info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 420 }}>

            {/* Direct bereikbaar */}
            <div style={{ ...glassPanel, padding: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, margin: '0 0 16px' }}>Direct bereikbaar</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <a href="mailto:info@mentaforce.nl" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, textDecoration: 'none' }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: COLORS.cyanSoft, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail aria-hidden size={16} style={{ color: COLORS.cyan }} />
                  </span>
                  <span>
                    <span style={{ display: 'block', fontSize: 12, color: COLORS.inkDim, marginBottom: 2 }}>E-mail</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.ink }}>info@mentaforce.nl</span>
                  </span>
                </a>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: COLORS.cyanSoft, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock aria-hidden size={16} style={{ color: COLORS.cyan }} />
                  </span>
                  <span>
                    <span style={{ display: 'block', fontSize: 12, color: COLORS.inkDim, marginBottom: 2 }}>Reactietijd</span>
                    <span style={{ fontSize: 14, color: COLORS.ink }}>Binnen 24 uur op werkdagen</span>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: COLORS.cyanSoft, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin aria-hidden size={16} style={{ color: COLORS.cyan }} />
                  </span>
                  <span>
                    <span style={{ display: 'block', fontSize: 12, color: COLORS.inkDim, marginBottom: 2 }}>Locatie</span>
                    <span style={{ fontSize: 14, color: COLORS.ink }}>Amsterdam, Nederland</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Demo CTA */}
            <div style={{ ...glassPanel, padding: 24, textAlign: 'center', borderColor: COLORS.lineStrong }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: COLORS.cyanSoft, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Presentation aria-hidden size={20} style={{ color: COLORS.cyan }} />
              </span>
              <p style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink, margin: '0 0 8px' }}>Demo van 30 minuten</p>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: COLORS.inkDim, margin: '0 0 16px' }}>
                We tonen het platform live en beantwoorden al je vragen.
              </p>
              <button
                onClick={kiesDemo}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                  fontFamily: FONT.grotesk, fontSize: 14, fontWeight: 600,
                  color: COLORS.navyDeep, background: COLORS.cyan,
                  transition: `transform .2s ${EASE}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                Demo aanvragen
              </button>
            </div>

            {/* Vertrouwen */}
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', margin: 0, padding: '0 4px' }}>
              {TRUST.map(({ icoon: Icoon, tekst }) => (
                <li key={tekst} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icoon aria-hidden size={15} style={{ color: COLORS.cyan, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: COLORS.inkDim }}>{tekst}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ borderTop: `1px solid ${COLORS.line}`, padding: '80px 0' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 28px' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontWeight: 700, fontSize: 'clamp(26px, 4vw, 36px)', letterSpacing: '-0.03em', color: COLORS.ink, margin: '0 0 12px' }}>
                Veelgestelde vragen
              </h2>
              <p style={{ fontSize: 15, color: COLORS.inkDim, margin: 0 }}>
                Vind je het antwoord niet? Stuur ons een bericht.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {FAQ.map((item, i) => (
                <div key={item.vraag} style={{ ...glassPanel, overflow: 'hidden' }}>
                  <button
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    aria-expanded={faqOpen === i}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '18px 24px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: FONT.grotesk,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.ink }}>{item.vraag}</span>
                    <span aria-hidden style={{ color: COLORS.cyan, fontSize: 18, marginLeft: 16, flexShrink: 0, transform: faqOpen === i ? 'rotate(45deg)' : 'rotate(0deg)', transition: `transform .2s ${EASE}` }}>
                      +
                    </span>
                  </button>
                  {faqOpen === i && (
                    <p style={{ padding: '0 24px 20px', margin: 0, fontSize: 14, lineHeight: 1.7, color: COLORS.inkDim }}>
                      {item.antwoord}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
