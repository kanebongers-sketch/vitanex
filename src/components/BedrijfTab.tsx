'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

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

export default function BedrijfTab({ bedrijf, team, onCodeVernieuwd }: Props) {
  const [gekopieerd, setGekopieerd] = useState(false)
  const [vernieuwBezig, setVernieuwBezig] = useState(false)
  const [bewerkenActief, setBewerkenActief] = useState(false)
  const [bedrijfsnaam, setBedrijfsnaam] = useState(bedrijf?.naam || '')
  const [opslaanBezig, setOpslaanBezig] = useState(false)
  const [opslaanFeedback, setOpslaanFeedback] = useState<string | null>(null)

  function kopieerCode() {
    if (!bedrijf?.hr_code) return
    navigator.clipboard.writeText(bedrijf.hr_code).then(() => {
      setGekopieerd(true)
      setTimeout(() => setGekopieerd(false), 2000)
    })
  }

  async function vernieuwCode() {
    if (!bedrijf?.id) return
    setVernieuwBezig(true)
    const nieuweCode = Math.random().toString(36).slice(2, 8).toUpperCase()
    const { error } = await supabase
      .from('bedrijven')
      .update({ hr_code: nieuweCode })
      .eq('id', bedrijf.id)
    if (!error) onCodeVernieuwd(nieuweCode)
    setVernieuwBezig(false)
  }

  async function slaaNaamOp(e: React.FormEvent) {
    e.preventDefault()
    if (!bedrijf?.id || !bedrijfsnaam.trim()) return
    setOpslaanBezig(true)
    const { error } = await supabase
      .from('bedrijven')
      .update({ naam: bedrijfsnaam.trim() })
      .eq('id', bedrijf.id)
    if (!error) {
      setOpslaanFeedback('Naam opgeslagen.')
      setBewerkenActief(false)
      setTimeout(() => setOpslaanFeedback(null), 3000)
    }
    setOpslaanBezig(false)
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

  return (
    <div className="flex flex-col gap-4 max-w-lg">

      {/* Quick Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Medewerkers', value: String(team.length), color: '#185FA5', bg: '#E6F1FB' },
          { label: 'Gem. score', value: gemScore > 0 ? `${gemScore}/5` : '—', color: '#1D9E75', bg: '#E1F5EE' },
          { label: 'Participatie', value: `${participatie}%`, color: participatie >= 70 ? '#1D9E75' : '#BA7517', bg: participatie >= 70 ? '#E1F5EE' : '#FAEEDA' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center"
            style={{ borderTop: `3px solid ${stat.color}` }}>
            <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* HR Code card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <p className="text-sm font-semibold text-gray-700 mb-1">HR-code</p>
        <p className="text-xs text-gray-400 mb-4">
          Medewerkers gebruiken deze code om lid te worden van jouw bedrijf in MentaForce.
        </p>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 rounded-xl border-2 border-dashed border-gray-200 px-4 py-3 text-center">
            <p className="text-3xl font-bold tracking-widest" style={{ color: '#1D9E75', fontFamily: 'monospace' }}>
              {bedrijf?.hr_code || '......'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={kopieerCode}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition"
            style={{ background: '#E1F5EE', color: '#0F6E56' }}
          >
            {gekopieerd ? 'Gekopieerd!' : 'Kopieer code'}
          </button>
          <button
            onClick={vernieuwCode}
            disabled={vernieuwBezig}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40"
            style={{ color: '#6b7280' }}
          >
            {vernieuwBezig ? '...' : 'Vernieuwen'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Let op: bij vernieuwen werkt de oude code niet meer.
        </p>
      </div>

      {/* Bedrijfsinfo */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-700">Bedrijfsinformatie</p>
          <button
            onClick={() => setBewerkenActief(a => !a)}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
            style={{ color: '#6b7280' }}
          >
            {bewerkenActief ? 'Annuleren' : 'Bewerken'}
          </button>
        </div>

        {bewerkenActief ? (
          <form onSubmit={slaaNaamOp}>
            <label className="text-xs font-medium text-gray-500 block mb-1">Bedrijfsnaam</label>
            <input
              value={bedrijfsnaam}
              onChange={e => setBedrijfsnaam(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400 mb-3"
            />
            <button
              type="submit"
              disabled={opslaanBezig}
              className="w-full py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: '#1D9E75' }}
            >
              {opslaanBezig ? 'Opslaan...' : 'Opslaan'}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400">Naam</span>
              <span className="text-sm font-medium text-gray-700">{bedrijf?.naam || '—'}</span>
            </div>
            {bedrijf?.sector && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400">Sector</span>
                <span className="text-sm font-medium text-gray-700">{bedrijf.sector}</span>
              </div>
            )}
            {bedrijf?.grootte && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400">Teamgrootte</span>
                <span className="text-sm font-medium text-gray-700">{bedrijf.grootte} medewerkers</span>
              </div>
            )}
            {bedrijf?.stad && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400">Stad</span>
                <span className="text-sm font-medium text-gray-700">{bedrijf.stad}</span>
              </div>
            )}
            {bedrijf?.website && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400">Website</span>
                <a
                  href={bedrijf.website.startsWith('http') ? bedrijf.website : `https://${bedrijf.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium"
                  style={{ color: '#1D9E75' }}
                >
                  {bedrijf.website}
                </a>
              </div>
            )}
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400">Actieve medewerkers</span>
              <span className="text-sm font-medium text-gray-700">{team.length}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-gray-400">Bedrijf-ID</span>
              <span className="text-xs font-mono text-gray-400">{bedrijf?.id?.slice(0, 8)}...</span>
            </div>
          </div>
        )}

        {opslaanFeedback && (
          <div className="mt-3 rounded-xl p-2 text-xs font-medium" style={{ background: '#E1F5EE', color: '#0F6E56' }}>
            {opslaanFeedback}
          </div>
        )}
      </div>

      {/* Afdelingen overzicht */}
      {afdelingen.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Afdelingen ({afdelingen.length})</p>
          <div className="flex flex-wrap gap-2">
            {afdelingen.map(afd => {
              const aantalInAfd = team.filter(l => l.afdeling === afd).length
              return (
                <div
                  key={afd}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                  style={{ background: '#F3F4F6', color: '#374151' }}
                >
                  <span>{afd}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: '#E6F1FB', color: '#185FA5' }}>
                    {aantalInAfd}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
