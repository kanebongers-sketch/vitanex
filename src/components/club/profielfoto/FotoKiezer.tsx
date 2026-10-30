'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, ImagePlus, Trash2 } from 'lucide-react'
import { Avatar, type AvatarFoto } from '@/components/club/ontwerp/Avatar'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { PROFIELFOTO } from '@/lib/aiyourgym/taal/woorden/club/profielfoto'
import { uitsnede } from '@/lib/club/profielfoto/model'
import { leesBeeld, maakFotos, tekenUitsnede, type Beeld } from './bijsnijden'
import { WebcamOpname, webcamMogelijk } from './WebcamOpname'

// Een profielfoto uploaden of maken (webcam of camera van telefoon en tablet), vierkant bijsnijden (slepen en zoomen in
// een rond masker) en bewaren. Voor het lid in de ledenapp, de medewerker bij
// het eigen profiel en de sportschool bij een lid (dan met toestemmingsvinkje).

interface FotoKiezerProps {
  naam: string
  initialen?: string
  /** Van wie de foto is; versie null = nog geen foto. */
  foto: AvatarFoto
  /** POST (multipart f256, f512) en DELETE. */
  adres: string
  waar: 'club' | 'lid'
  voor?: string | null
  /** De sportschool zet een foto bij een lid: dan eerst het vinkje voor toestemming. */
  balie?: boolean
  /** Extra uitleg onder de knoppen (bijvoorbeeld wie de foto zette). */
  uitleg: string
  /** Weergavemaat van het rondje. */
  maat?: number
  /** Klasse van het rondje (ledenapp: club-lidapp-avatar). */
  avatarKlasse?: string
  /** Alleen kijken (voorvertoning): geen knoppen. */
  alleenLezen?: boolean
  /** Het rondje staat al elders op het scherm (bijvoorbeeld in de kop): alleen de knoppen. */
  zonderAvatar?: boolean
}

const VENSTER = 320

type Melding = { soort: 'ok' | 'fout'; tekst: string } | null

export function FotoKiezer({ naam, initialen, foto, adres, waar, voor, balie = false, uitleg, maat = 64, avatarKlasse, alleenLezen = false, zonderAvatar = false }: FotoKiezerProps) {
  const t = useTekst(PROFIELFOTO)
  const router = useRouter()
  const [versie, setVersie] = useState<string | null>(foto.versie ?? null)
  const [beeld, setBeeld] = useState<Beeld | null>(null)
  const [webcam, setWebcam] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [plek, setPlek] = useState({ x: 0, y: 0 })
  const [toestemming, setToestemming] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<Melding>(null)
  const doek = useRef<HTMLCanvasElement>(null)
  const kies = useRef<HTMLInputElement>(null)
  const maak = useRef<HTMLInputElement>(null)
  const sleep = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

  useEffect(() => setVersie(foto.versie ?? null), [foto.versie])
  useEffect(() => () => beeld?.sluit(), [beeld])

  useEffect(() => {
    if (beeld && doek.current) tekenUitsnede(doek.current, beeld, zoom, plek.x, plek.y, VENSTER * 2)
  }, [beeld, zoom, plek])

  const kiesBestand = useCallback(
    async (bestand: Blob | undefined) => {
      if (!bestand) return
      setMelding(null)
      const nieuw = await leesBeeld(bestand)
      if (!nieuw) return setMelding({ soort: 'fout', tekst: t.fouten.lezen })
      setBeeld(nieuw)
      setZoom(1)
      setPlek({ x: 0, y: 0 })
      setToestemming(false)
    },
    [t],
  )

  // Webcam in de pagina waar de browser dat kan; anders de camera-app van de telefoon.
  function maakFoto() {
    setMelding(null)
    if (webcamMogelijk()) setWebcam(true)
    else maak.current?.click()
  }

  function begin(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    sleep.current = { x: e.clientX, y: e.clientY, px: plek.x, py: plek.y }
  }

  function beweeg(e: ReactPointerEvent<HTMLDivElement>) {
    const s = sleep.current
    if (!s || !beeld) return
    const vak = uitsnede(beeld.breedte, beeld.hoogte, zoom)
    if (!vak) return
    const schaal = vak.zijde / e.currentTarget.clientWidth
    const stap = (ruimte: number, d: number) => (ruimte > 0 ? (-d * schaal) / (ruimte / 2) : 0)
    const klem = (v: number) => Math.min(1, Math.max(-1, v))
    setPlek({ x: klem(s.px + stap(beeld.breedte - vak.zijde, e.clientX - s.x)), y: klem(s.py + stap(beeld.hoogte - vak.zijde, e.clientY - s.y)) })
  }

  function stop() {
    beeld?.sluit()
    setBeeld(null)
  }

  async function bewaar() {
    if (!beeld || bezig) return
    if (balie && !toestemming) return setMelding({ soort: 'fout', tekst: t.fouten.toestemming })
    setBezig(true)
    setMelding(null)
    try {
      const gemaakt = await maakFotos(beeld, zoom, plek.x, plek.y)
      if (!gemaakt.ok) return setMelding({ soort: 'fout', tekst: gemaakt.code === 'webp' ? t.fouten.webp : t.fouten.teGroot })
      const form = new FormData()
      form.append('f256', gemaakt.bestanden[256], 'foto-256.webp')
      form.append('f512', gemaakt.bestanden[512], 'foto-512.webp')
      if (balie) form.append('toestemming', 'true')
      const res = await fetch(adres, { method: 'POST', body: form })
      const data = (await res.json().catch(() => null)) as { versie?: string; code?: string } | null
      if (!res.ok || !data?.versie) {
        const code = data?.code
        return setMelding({ soort: 'fout', tekst: code === 'toestemming' ? t.fouten.toestemming : code === 'teGroot' ? t.fouten.teGroot : res.status === 403 ? t.fouten.voorvertoning : t.fouten.opslaan })
      }
      setVersie(data.versie)
      stop()
      setMelding({ soort: 'ok', tekst: t.opgeslagen })
      router.refresh()
    } catch {
      setMelding({ soort: 'fout', tekst: t.fouten.opslaan })
    } finally {
      setBezig(false)
    }
  }

  async function haalWeg() {
    if (bezig) return
    setBezig(true)
    setMelding(null)
    try {
      const res = await fetch(adres, { method: 'DELETE' })
      if (!res.ok) return setMelding({ soort: 'fout', tekst: res.status === 403 ? t.fouten.voorvertoning : t.fouten.weghalen })
      setVersie(null)
      setMelding({ soort: 'ok', tekst: t.weggehaald })
      router.refresh()
    } catch {
      setMelding({ soort: 'fout', tekst: t.fouten.weghalen })
    } finally {
      setBezig(false)
    }
  }

  const huidig: AvatarFoto = { ...foto, versie }
  return (
    <div className="club-fotokiezer">
      <div className="club-fotokiezer-kop">
        {zonderAvatar ? null : <Avatar naam={naam} initialen={initialen} foto={huidig} maat={maat} waar={waar} voor={voor} className={avatarKlasse} decoratief={false} />}
        {!alleenLezen && !beeld && !webcam ? (
          <div className="club-fotokiezer-knoppen">
            <button type="button" className="club-knop" onClick={() => kies.current?.click()} disabled={bezig}>
              <ImagePlus aria-hidden size={16} /> {versie ? t.vervangen : t.kiezen}
            </button>
            <button type="button" className="club-knop club-knop--stil" onClick={maakFoto} disabled={bezig}>
              <Camera aria-hidden size={16} /> {t.maken}
            </button>
            {versie ? (
              <button type="button" className="club-knop club-knop--gevaar" onClick={haalWeg} disabled={bezig}>
                <Trash2 aria-hidden size={16} /> {t.weghalen}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <input ref={kies} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; void kiesBestand(f) }} />
      <input ref={maak} type="file" accept="image/*" capture="user" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; void kiesBestand(f) }} />
      {webcam && !beeld ? (
        <WebcamOpname
          onFoto={(f) => { setWebcam(false); void kiesBestand(f) }}
          onStop={() => setWebcam(false)}
          onKiesBestand={() => { setWebcam(false); kies.current?.click() }}
        />
      ) : null}
      {beeld ? (
        <div className="club-fotokiezer-snij">
          <div className="club-fotokiezer-venster" onPointerDown={begin} onPointerMove={beweeg} onPointerUp={() => (sleep.current = null)} onPointerCancel={() => (sleep.current = null)}>
            <canvas ref={doek} width={VENSTER * 2} height={VENSTER * 2} aria-label={t.versleep} role="img" />
          </div>
          <label className="club-fotokiezer-zoom">
            <span>{t.zoom}</span>
            <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
          </label>
          <p className="club-fotokiezer-uitleg">{t.versleep}</p>
          {balie ? (
            <label className="club-fotokiezer-toestemming">
              <input type="checkbox" checked={toestemming} onChange={(e) => setToestemming(e.target.checked)} />
              <span>{t.toestemming}</span>
            </label>
          ) : null}
          <div className="club-fotokiezer-knoppen">
            <button type="button" className="club-knop club-knop--primair" onClick={bewaar} disabled={bezig || (balie && !toestemming)}>
              {bezig ? t.bezig : t.opslaan}
            </button>
            <button type="button" className="club-knop club-knop--stil" onClick={stop} disabled={bezig}>
              {t.annuleren}
            </button>
          </div>
        </div>
      ) : null}
      <p className="club-fotokiezer-uitleg">{uitleg}</p>
      {melding ? (
        <p className="club-fotokiezer-melding" data-soort={melding.soort} role={melding.soort === 'fout' ? 'alert' : 'status'}>
          {melding.tekst}
        </p>
      ) : null}
    </div>
  )
}
