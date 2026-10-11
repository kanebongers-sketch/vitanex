'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/supabase'
import { Paperclip, FileText, Image as ImageIcon, X, Info } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE } from '@/lib/i18n/talen'

const CATEGORIEËN = [
  { id: 'gesprek',       label: 'gesprek',         kleur: 'var(--mf-blue)',   bg: 'color-mix(in srgb, var(--mf-blue) 12%, transparent)' },
  { id: 'evaluatie',     label: 'evaluatie',        kleur: 'var(--mf-green)',  bg: 'color-mix(in srgb, var(--mf-green) 12%, transparent)' },
  { id: 'loonsverhoging',label: 'loonsverhoging',   kleur: 'var(--mf-amber)',  bg: 'color-mix(in srgb, var(--mf-amber) 12%, transparent)' },
  { id: 'contract',      label: 'contract',         kleur: 'var(--mf-purple)', bg: 'color-mix(in srgb, var(--mf-purple) 12%, transparent)' },
  { id: 'waarschuwing',  label: 'waarschuwing',     kleur: 'var(--mf-red)',    bg: 'color-mix(in srgb, var(--mf-red) 12%, transparent)' },
  { id: 'overig',        label: 'overig',           kleur: 'var(--text-3)',    bg: 'var(--bg-subtle)' },
]

type Document = {
  id: string
  categorie: string
  bestandsnaam: string
  bestandsgrootte: number | null
  mime_type: string | null
  beschrijving: string | null
  intern: boolean
  aangemaakt_op: string
  uploader_rol: string
}

type Props = {
  userId: string
  isHR: boolean
  naamMedewerker?: string
}

function catCfg(id: string) {
  return CATEGORIEËN.find(c => c.id === id) ?? CATEGORIEËN[CATEGORIEËN.length - 1]
}

function formatBytes(b: number | null) {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

function bestandsIcoon(mime: string | null): LucideIcon {
  if (!mime) return Paperclip
  if (mime === 'application/pdf') return FileText
  if (mime.startsWith('image/')) return ImageIcon
  if (mime.includes('word')) return FileText
  return Paperclip
}

export default function DocumentenSectie({ userId, isHR, naamMedewerker }: Props) {
  const { t, taal } = useVertaling()
  const [documenten, setDocumenten] = useState<Document[]>([])
  const [laden, setLaden] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [bestand, setBestand] = useState<File | null>(null)
  const [categorie, setCategorie] = useState('gesprek')
  const [beschrijving, setBeschrijving] = useState('')
  const [intern, setIntern] = useState(false)
  const [uploadBezig, setUploadBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [melding, setMelding] = useState<string | null>(null)
  const [downloadBezig, setDownloadBezig] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function token() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? ''
  }

  const laadDocumenten = useCallback(async () => {
    setLaden(true)
    try {
      const res = await fetch(`/api/documenten/lijst?userId=${userId}`, {
        headers: { Authorization: `Bearer ${await token()}` },
      })
      if (res.ok) {
        const data = await res.json()
        setDocumenten(data.documenten ?? [])
      }
    } finally {
      setLaden(false)
    }
  }, [userId])

  useEffect(() => {
    // Buiten de synchrone effect-body starten (react-compiler regel)
    Promise.resolve().then(laadDocumenten)
  }, [laadDocumenten])

  async function upload() {
    if (!bestand) return
    setUploadBezig(true)
    setFout(null)
    const form = new FormData()
    form.append('bestand', bestand)
    form.append('user_id', userId)
    form.append('categorie', categorie)
    form.append('beschrijving', beschrijving)
    if (isHR) form.append('intern', String(intern))

    const res = await fetch('/api/documenten/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${await token()}` },
      body: form,
    })
    const data = await res.json()
    if (!res.ok) {
      setFout((taal === 'nl' ? data.error : null) ?? t('werk.documenten.uploadMislukt'))
    } else {
      setUploadOpen(false)
      setBestand(null)
      setBeschrijving('')
      setIntern(false)
      if (fileRef.current) fileRef.current.value = ''
      await laadDocumenten()
      setMelding(t('werk.documenten.opgeslagen'))
      setTimeout(() => setMelding(null), 3000)
    }
    setUploadBezig(false)
  }

  async function download(id: string, naam: string) {
    setDownloadBezig(id)
    const res = await fetch(`/api/documenten/download?id=${id}`, {
      headers: { Authorization: `Bearer ${await token()}` },
    })
    const data = await res.json()
    if (data.url) {
      const a = document.createElement('a')
      a.href = data.url
      a.download = naam
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
    setDownloadBezig(null)
  }

  async function verwijder(id: string) {
    if (!confirm(t('werk.documenten.verwijderBevestig'))) return
    const res = await fetch(`/api/documenten/verwijder?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${await token()}` },
    })
    if (res.ok) setDocumenten(prev => prev.filter(d => d.id !== id))
  }

  const zichtbareDocumenten = isHR ? documenten : documenten.filter(d => !d.intern)

  return (
    <div className="rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
            {isHR
              ? (naamMedewerker ? t('werk.documenten.dossierVan', { naam: naamMedewerker }) : t('werk.documenten.dossier'))
              : t('werk.documenten.mijnDocumenten')}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
            {isHR ? t('werk.documenten.toegangHr') : t('werk.documenten.toegangMedewerker')}
          </p>
        </div>
        <button
          onClick={() => { setUploadOpen(o => !o); setFout(null) }}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition"
          style={{ background: uploadOpen ? 'var(--bg-subtle)' : 'var(--mentaforce-primary)', color: uploadOpen ? 'var(--text-2)' : 'var(--bg-app)' }}
        >
          {uploadOpen ? t('werk.documenten.annuleer') : t('werk.documenten.toevoegen')}
        </button>
      </div>

      {/* AVG notice */}
      <div className="mx-6 mt-4 px-3 py-2.5 rounded-xl flex items-start gap-2"
        style={{ background: 'color-mix(in srgb, var(--mf-blue) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--mf-blue) 25%, transparent)' }}>
        <Info size={14} strokeWidth={1.6} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--mf-blue)' }} aria-hidden />
        <p className="text-xs leading-relaxed" style={{ color: 'var(--mf-blue)' }}>
          <strong>{t('werk.documenten.avgLabel')}</strong> {isHR ? t('werk.documenten.avgHr') : t('werk.documenten.avgMedewerker')}
        </p>
      </div>

      {/* Upload form */}
      {uploadOpen && (
        <div className="mx-6 mt-4 p-4 rounded-xl border border-dashed" style={{ borderColor: 'var(--border-strong)', background: 'var(--bg-subtle)' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-2)' }}>{t('werk.documenten.nieuwDocument')}</p>

          {/* Categorie */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {CATEGORIEËN.map(c => (
              <button
                key={c.id}
                onClick={() => setCategorie(c.id)}
                className="text-xs px-2.5 py-1 rounded-full border transition"
                style={{
                  background: categorie === c.id ? c.bg : 'var(--bg-card)',
                  borderColor: categorie === c.id ? c.kleur : 'var(--border)',
                  color: categorie === c.id ? c.kleur : 'var(--text-3)',
                  fontWeight: categorie === c.id ? 600 : 400,
                }}
              >
                {t(`werk.documenten.categorie.${c.label}`)}
              </button>
            ))}
          </div>

          {/* File picker */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border border-dashed rounded-xl p-4 text-center cursor-pointer transition mb-3"
            style={{ borderColor: 'var(--border-strong)', background: bestand ? 'color-mix(in srgb, var(--mf-green) 12%, transparent)' : 'var(--bg-card)' }}
          >
            {bestand ? (
              <div className="flex items-center justify-center gap-2">
                {(() => { const BestandIcon = bestandsIcoon(bestand.type); return <BestandIcon size={18} strokeWidth={1.6} style={{ color: 'var(--text-2)' }} aria-hidden /> })()}
                <div className="text-left">
                  <p className="text-xs font-medium truncate max-w-[200px]" style={{ color: 'var(--text-2)' }}>{bestand.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-4)' }}>{formatBytes(bestand.size)}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setBestand(null); if (fileRef.current) fileRef.current.value = '' }}
                  className="ml-2 inline-flex items-center"
                  style={{ color: 'var(--text-4)' }}
                  aria-label={t('werk.documenten.bestandVerwijderen')}
                ><X size={14} strokeWidth={2} /></button>
              </div>
            ) : (
              <>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t('werk.documenten.kiesBestand')}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>{t('werk.documenten.bestandTypes')}</p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
            className="hidden"
            onChange={e => setBestand(e.target.files?.[0] ?? null)}
          />

          {/* Beschrijving */}
          <input
            type="text"
            placeholder={t('werk.documenten.omschrijvingPlaceholder')}
            value={beschrijving}
            onChange={e => setBeschrijving(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-xs outline-none mb-3"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-1)' }}
          />

          {/* HR: intern toggle */}
          {isHR && (
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <div
                onClick={() => setIntern(i => !i)}
                className="w-8 h-4 rounded-full transition relative"
                style={{ background: intern ? 'var(--mf-red)' : 'var(--border-strong)' }}
              >
                <div
                  className="absolute top-0.5 w-3 h-3 rounded-full shadow transition-all"
                  style={{ left: intern ? '17px' : '2px', background: 'var(--bg-app)' }}
                />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-2)' }}>
                {t('werk.documenten.internToggle')}
              </span>
            </label>
          )}

          {fout && <p className="text-xs mb-2" style={{ color: 'var(--mf-red)' }}>{fout}</p>}

          <button
            onClick={upload}
            disabled={!bestand || uploadBezig}
            className="w-full py-2.5 rounded-xl text-xs font-semibold transition disabled:opacity-40"
            style={{ background: 'var(--mentaforce-primary)', color: 'var(--bg-app)' }}
          >
            {uploadBezig ? t('werk.documenten.uploaden') : t('werk.documenten.opslaan')}
          </button>
        </div>
      )}

      {/* Success flash */}
      {melding && (
        <div className="mx-6 mt-3 px-3 py-2 rounded-xl text-xs font-medium"
          style={{ background: 'color-mix(in srgb, var(--mf-green) 12%, transparent)', color: 'var(--mf-green)' }}>
          {melding}
        </div>
      )}

      {/* Document list */}
      <div className="p-6 pt-4">
        {laden ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--border)', borderTopColor: 'var(--mentaforce-primary)' }} />
          </div>
        ) : zichtbareDocumenten.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: 'var(--text-4)' }}>
            {documenten.length === 0 ? t('werk.documenten.nogGeen') : t('werk.documenten.geenZichtbaar')}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {zichtbareDocumenten.map(doc => {
              const cat = catCfg(doc.categorie)
              const DocIcon = bestandsIcoon(doc.mime_type)
              return (
                <div key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-xl border transition"
                  style={{
                    borderColor: doc.intern ? 'color-mix(in srgb, var(--mf-red) 35%, transparent)' : 'var(--border)',
                    background: doc.intern ? 'color-mix(in srgb, var(--mf-red) 8%, transparent)' : 'var(--bg-subtle)',
                  }}>

                  <DocIcon size={20} strokeWidth={1.6} className="flex-shrink-0" style={{ color: 'var(--text-3)' }} aria-hidden />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-xs font-medium truncate max-w-[180px]" style={{ color: 'var(--text-1)' }}>
                        {doc.bestandsnaam}
                      </p>
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: cat.bg, color: cat.kleur }}>
                        {t(`werk.documenten.categorie.${cat.label}`)}
                      </span>
                      {doc.intern && isHR && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: 'color-mix(in srgb, var(--mf-red) 12%, transparent)', color: 'var(--mf-red)' }}>
                          {t('werk.documenten.intern')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs" style={{ color: 'var(--text-4)' }}>
                        {new Date(doc.aangemaakt_op).toLocaleDateString(INTL_LOCALE[taal], { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {doc.uploader_rol !== 'medewerker' && (
                        <span className="text-xs" style={{ color: 'var(--text-4)' }}>· {t('werk.documenten.doorHr')}</span>
                      )}
                      {doc.beschrijving && (
                        <span className="text-xs truncate max-w-[140px]" style={{ color: 'var(--text-4)' }}>· {doc.beschrijving}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => download(doc.id, doc.bestandsnaam)}
                      disabled={downloadBezig === doc.id}
                      className="text-xs rounded-lg px-2.5 py-1.5 transition disabled:opacity-40"
                      style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}
                    >
                      {downloadBezig === doc.id ? '...' : t('werk.documenten.download')}
                    </button>
                    {isHR && (
                      <button
                        onClick={() => verwijder(doc.id)}
                        className="text-xs rounded-lg px-2 py-1.5 transition inline-flex items-center"
                        style={{ border: '1px solid color-mix(in srgb, var(--mf-red) 35%, transparent)', color: 'var(--mf-red)' }}
                        title={t('werk.documenten.verwijder')}
                        aria-label={t('werk.documenten.verwijderDocument')}

                      >
                        <X size={13} strokeWidth={2} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
