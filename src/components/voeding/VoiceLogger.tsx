'use client'

import { useCallback, useRef, useState, type CSSProperties } from 'react'
import { Mic, Square, Check, X, Loader2 } from 'lucide-react'
import { MAALTIJD_VOLGORDE, MAALTIJD_VOL_LABEL } from './constants'
import { schaalNaarPortie } from './berekeningen'
import { leesVoiceRespons, type VoiceItem } from './voice-client'
import type { MaaltijdType } from './types'

// Voice-loggen: spreek je maaltijd in → we transcriberen en schatten de producten,
// jij corrigeert en bevestigt. De schatting is nooit stil: elk item is aanpasbaar
// (gram → macro's herschalen mee) vóór het opgeslagen wordt.

type Fase = 'idle' | 'opnemen' | 'verwerken' | 'review' | 'opslaan'

interface RegelItem {
  naam: string
  gram: number
  per100: { calorieen: number; eiwitten_g: number; koolhydraten_g: number; vetten_g: number; vezels_g: number }
  betrouwbaarheid: VoiceItem['betrouwbaarheid']
}

/** Van een AI-schatting (macro's voor een portie) naar per-100g, zodat gram-aanpassen herschaalt. */
function naarRegel(item: VoiceItem): RegelItem {
  const gram = item.portieGram && item.portieGram > 0 ? item.portieGram : 100
  const f = 100 / gram
  return {
    naam: item.naam,
    gram,
    per100: {
      calorieen: item.calorieen * f,
      eiwitten_g: item.eiwittenG * f,
      koolhydraten_g: item.koolhydratenG * f,
      vetten_g: item.vettenG * f,
      vezels_g: 0,
    },
    betrouwbaarheid: item.betrouwbaarheid,
  }
}

function standaardMaaltijd(): MaaltijdType {
  const u = new Date().getHours()
  if (u < 11) return 'ontbijt'
  if (u < 15) return 'lunch'
  if (u < 21) return 'diner'
  return 'avondsnack'
}

export function VoiceLogger({ token, datum, onKlaar, onSluit }: { token: string; datum: string; onKlaar: () => void; onSluit: () => void }) {
  const [fase, setFase] = useState<Fase>('idle')
  const [fout, setFout] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')
  const [regels, setRegels] = useState<RegelItem[]>([])
  const [maaltijd, setMaaltijd] = useState<MaaltijdType>(standaardMaaltijd())

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const verwerk = useCallback(async (blob: Blob) => {
    setFase('verwerken')
    const fd = new FormData()
    fd.append('audio', blob, 'voice.webm')
    try {
      const res = await fetch('/api/voeding/voice', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
      const data = leesVoiceRespons(await res.json().catch(() => null))
      if (!res.ok || data === null) {
        setFout('Kon je maaltijd niet verwerken. Probeer opnieuw of typ het handmatig.')
        setFase('idle')
        return
      }
      setTranscript(data.transcript)
      setRegels(data.items.map(naarRegel))
      setFase('review')
      if (data.items.length === 0) setFout('Ik hoorde geen voedsel. Probeer het nog eens.')
    } catch {
      setFout('Er ging iets mis bij het versturen.')
      setFase('idle')
    }
  }, [token])

  const startOpname = useCallback(async () => {
    setFout(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        void verwerk(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }))
      }
      recorderRef.current = recorder
      recorder.start()
      setFase('opnemen')
    } catch {
      setFout('Geen toegang tot de microfoon. Sta toegang toe in je browser.')
    }
  }, [verwerk])

  const stopOpname = useCallback(() => {
    recorderRef.current?.stop()
    recorderRef.current = null
  }, [])

  const zetGram = (i: number, waarde: string) => {
    const g = Math.max(0, Number(waarde) || 0)
    setRegels((r) => r.map((row, j) => (j === i ? { ...row, gram: g } : row)))
  }
  const verwijder = (i: number) => setRegels((r) => r.filter((_, j) => j !== i))

  const bewaar = useCallback(async () => {
    if (regels.length === 0) return
    setFase('opslaan')
    try {
      await Promise.all(regels.map((r) => {
        const m = schaalNaarPortie(r.per100, r.gram)
        return fetch('/api/voeding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ datum, maaltijd_type: maaltijd, omschrijving: r.naam, ...m, portie_gram: r.gram, bron: 'manueel' }),
        })
      }))
      onKlaar()
    } catch {
      setFout('Opslaan mislukt. Probeer opnieuw.')
      setFase('review')
    }
  }, [regels, token, datum, maaltijd, onKlaar])

  return (
    <div style={{ background: 'var(--bg-card, var(--bg-subtle))', border: '1px solid var(--border)', borderRadius: 16, padding: 16, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: 15, color: 'var(--text-1)' }}>Inspreken</strong>
        <button type="button" onClick={onSluit} aria-label="Sluiten" style={ikoonKnop}><X size={18} /></button>
      </div>

      {(fase === 'idle' || fase === 'opnemen') ? (
        <div style={{ display: 'grid', placeItems: 'center', gap: 10, padding: '12px 0' }}>
          <button
            type="button"
            onClick={fase === 'opnemen' ? stopOpname : startOpname}
            aria-label={fase === 'opnemen' ? 'Stop opname' : 'Start opname'}
            style={{
              width: 76, height: 76, borderRadius: 999, border: 'none', cursor: 'pointer',
              background: fase === 'opnemen' ? 'var(--mf-red)' : 'var(--mentaforce-primary)',
              color: '#fff', display: 'grid', placeItems: 'center',
              boxShadow: fase === 'opnemen' ? '0 0 0 6px var(--mf-red-light)' : '0 0 0 6px var(--mentaforce-primary-light)',
            }}
          >
            {fase === 'opnemen' ? <Square size={26} fill="#fff" /> : <Mic size={30} />}
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
            {fase === 'opnemen' ? 'Aan het luisteren… tik om te stoppen' : 'Tik en zeg wat je at — bijv. "twee eieren en een banaan"'}
          </span>
        </div>
      ) : null}

      {fase === 'verwerken' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', padding: '16px 0', color: 'var(--text-3)' }}>
          <Loader2 size={18} className="voeding-spin" /> Aan het verwerken…
        </div>
      ) : null}

      {(fase === 'review' || fase === 'opslaan') ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {transcript ? <p style={{ fontSize: 12, color: 'var(--text-4)', margin: 0, fontStyle: 'italic' }}>“{transcript}”</p> : null}
          <p style={{ fontSize: 11, color: 'var(--text-4)', margin: 0 }}>Schatting — controleer en pas de porties aan voor je opslaat.</p>

          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Maaltijd</span>
            <select value={maaltijd} onChange={(e) => setMaaltijd(e.target.value as MaaltijdType)} style={veld}>
              {MAALTIJD_VOLGORDE.map((m) => <option key={m} value={m}>{MAALTIJD_VOL_LABEL[m]}</option>)}
            </select>
          </label>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            {regels.map((r, i) => {
              const m = schaalNaarPortie(r.per100, r.gram)
              return (
                <li key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.naam}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{m.calorieen} kcal · E{m.eiwitten_g} K{m.koolhydraten_g} V{m.vetten_g}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input inputMode="numeric" value={String(r.gram)} onChange={(e) => zetGram(i, e.target.value)} aria-label={`Gram voor ${r.naam}`} style={{ ...veld, width: 60, textAlign: 'center' }} />
                    <span style={{ fontSize: 11, color: 'var(--text-4)' }}>g</span>
                  </div>
                  <button type="button" onClick={() => verwijder(i)} aria-label={`Verwijder ${r.naam}`} style={ikoonKnop}><X size={16} /></button>
                </li>
              )
            })}
          </ul>

          {fout ? <p style={{ fontSize: 12, color: 'var(--mf-red)', margin: 0 }}>{fout}</p> : null}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => { setFase('idle'); setRegels([]); setTranscript(''); setFout(null) }} style={{ ...knop, background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)' }}>Opnieuw</button>
            <button type="button" onClick={() => void bewaar()} disabled={regels.length === 0 || fase === 'opslaan'} style={{ ...knop, background: 'var(--mentaforce-primary)', color: '#fff', opacity: regels.length === 0 ? 0.5 : 1 }}>
              <Check size={15} /> {fase === 'opslaan' ? 'Bezig…' : `Toevoegen (${regels.length})`}
            </button>
          </div>
        </div>
      ) : null}

      {fout && fase === 'idle' ? <p style={{ fontSize: 12, color: 'var(--mf-red)', margin: 0 }}>{fout}</p> : null}
      <style>{`.voeding-spin{animation:voeding-spin 1s linear infinite}@keyframes voeding-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

const ikoonKnop: CSSProperties = { background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 4 }
const veld: CSSProperties = { height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-app, #fff)', color: 'var(--text-1)', fontSize: 14, padding: '0 8px' }
const knop: CSSProperties = { flex: 1, height: 44, borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }
