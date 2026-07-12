'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

export type BedrijfInfo = {
  id: string
  naam: string
  hr_code: string
  sector?: string | null
  grootte?: string | null
  stad?: string | null
  website?: string | null
}

type TeamLidMinimal = {
  id: string
  naam: string
  afdeling?: string | null
  laatste_score?: number | null
  deze_week_ingevuld?: boolean
}

type Props = {
  bedrijf: BedrijfInfo | null
  team: TeamLidMinimal[]
  onCodeVernieuwd: (nieuweCode: string) => void
}

function gemiddelde(arr: number[]) {
  if (!arr.length) return 0
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
}

const infoRijStijl: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '8px 0', borderBottom: '1px solid var(--border)',
}

export default function BedrijfTab({ bedrijf, team, onCodeVernieuwd }: Props) {
  const { toast } = useToast()
  const [gekopieerd, setGekopieerd] = useState(false)
  const [vernieuwBezig, setVernieuwBezig] = useState(false)
  const [bewerkenActief, setBewerkenActief] = useState(false)
  const [bedrijfsnaam, setBedrijfsnaam] = useState(bedrijf?.naam || '')
  const [opslaanBezig, setOpslaanBezig] = useState(false)

  function kopieerCode() {
    if (!bedrijf?.hr_code) return
    navigator.clipboard.writeText(bedrijf.hr_code).then(
      () => {
        setGekopieerd(true)
        setTimeout(() => setGekopieerd(false), 2000)
      },
      () => {
        toast({ title: 'Kopiëren mislukt', description: 'Kopieer de code handmatig.', variant: 'error' })
      },
    )
  }

  async function vernieuwCode() {
    if (!bedrijf?.id) return
    setVernieuwBezig(true)
    const nieuweCode = Math.random().toString(36).slice(2, 8).toUpperCase()
    const { error } = await supabase
      .from('bedrijven')
      .update({ hr_code: nieuweCode })
      .eq('id', bedrijf.id)
    setVernieuwBezig(false)
    if (error) {
      toast({ title: 'Vernieuwen mislukt', description: error.message, variant: 'error' })
      return
    }
    onCodeVernieuwd(nieuweCode)
    toast({ title: 'Nieuwe HR-code gegenereerd', variant: 'success' })
  }

  async function slaaNaamOp(e: React.FormEvent) {
    e.preventDefault()
    if (!bedrijf?.id || !bedrijfsnaam.trim()) return
    setOpslaanBezig(true)
    const { error } = await supabase
      .from('bedrijven')
      .update({ naam: bedrijfsnaam.trim() })
      .eq('id', bedrijf.id)
    setOpslaanBezig(false)
    if (error) {
      toast({ title: 'Opslaan mislukt', description: error.message, variant: 'error' })
      return
    }
    setBewerkenActief(false)
    toast({ title: 'Naam opgeslagen', variant: 'success' })
  }

  // Bereken stats uit team data
  const teamMetScore = team.filter(l => l.laatste_score !== null && l.laatste_score !== undefined)
  const gemScore = gemiddelde(teamMetScore.map(l => l.laatste_score as number))
  const ingevuld = team.filter(l => l.deze_week_ingevuld).length
  const participatie = team.length > 0 ? Math.round((ingevuld / team.length) * 100) : 0

  // Unieke afdelingen
  const afdelingen = [...new Set(
    team
      .map(l => l.afdeling)
      .filter((a): a is string => !!a && a.trim() !== '')
  )].sort()

  const stats: { label: string; value: string }[] = [
    { label: 'Medewerkers', value: String(team.length) },
    { label: 'Gem. score', value: gemScore > 0 ? `${gemScore}/5` : '—' },
    { label: 'Participatie', value: `${participatie}%` },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 512 }}>

      {/* Quick Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {stats.map(stat => (
          <Card key={stat.label} style={{ padding: 16, textAlign: 'center', borderTop: '2px solid var(--mentaforce-primary)' }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>{stat.value}</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* HR Code card */}
      <Card style={{ padding: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>HR-code</p>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>
          Medewerkers gebruiken deze code om lid te worden van jouw bedrijf in MentaForce.
        </p>
        <div style={{ marginBottom: 16 }}>
          <div style={{ borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)', background: 'var(--bg-subtle)', padding: '12px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 30, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--mentaforce-primary)', fontFamily: 'monospace' }}>
              {bedrijf?.hr_code || '......'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={kopieerCode} variant="secondary" style={{ flex: 1 }}>
            {gekopieerd ? 'Gekopieerd!' : 'Kopieer code'}
          </Button>
          <Button onClick={vernieuwCode} variant="ghost" loading={vernieuwBezig}>
            Vernieuwen
          </Button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 12 }}>
          Let op: bij vernieuwen werkt de oude code niet meer.
        </p>
      </Card>

      {/* Bedrijfsinfo */}
      <Card style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>Bedrijfsinformatie</p>
          <Button onClick={() => setBewerkenActief(a => !a)} variant="ghost" size="sm">
            {bewerkenActief ? 'Annuleren' : 'Bewerken'}
          </Button>
        </div>

        {bewerkenActief ? (
          <form onSubmit={slaaNaamOp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Bedrijfsnaam">
              <Input value={bedrijfsnaam} onChange={e => setBedrijfsnaam(e.target.value)} />
            </Field>
            <Button type="submit" loading={opslaanBezig} style={{ width: '100%' }}>
              Opslaan
            </Button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={infoRijStijl}>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Naam</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>{bedrijf?.naam || '—'}</span>
            </div>
            {bedrijf?.sector && (
              <div style={infoRijStijl}>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Sector</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>{bedrijf.sector}</span>
              </div>
            )}
            {bedrijf?.grootte && (
              <div style={infoRijStijl}>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Teamgrootte</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>{bedrijf.grootte} medewerkers</span>
              </div>
            )}
            {bedrijf?.stad && (
              <div style={infoRijStijl}>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Stad</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>{bedrijf.stad}</span>
              </div>
            )}
            {bedrijf?.website && (
              <div style={infoRijStijl}>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Website</span>
                <a
                  href={bedrijf.website.startsWith('http') ? bedrijf.website : `https://${bedrijf.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 14, fontWeight: 500, color: 'var(--mentaforce-primary)' }}
                >
                  {bedrijf.website}
                </a>
              </div>
            )}
            <div style={infoRijStijl}>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Actieve medewerkers</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>{team.length}</span>
            </div>
            <div style={{ ...infoRijStijl, borderBottom: 'none' }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Bedrijf-ID</span>
              <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-3)' }}>{bedrijf?.id?.slice(0, 8)}...</span>
            </div>
          </div>
        )}
      </Card>

      {/* Afdelingen overzicht */}
      {afdelingen.length > 0 && (
        <Card style={{ padding: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 12 }}>Afdelingen ({afdelingen.length})</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {afdelingen.map(afd => {
              const aantalInAfd = team.filter(l => l.afdeling === afd).length
              return (
                <Badge key={afd} variant="neutral">
                  <span>{afd}</span>
                  <span style={{
                    padding: '1px 6px', borderRadius: 100, fontSize: 10, fontWeight: 700,
                    background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)',
                  }}>
                    {aantalInAfd}
                  </span>
                </Badge>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
