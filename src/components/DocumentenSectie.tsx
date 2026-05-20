'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const CATEGORIEËN = [
  { id: 'gesprek',       label: 'Pop-up gesprek',  kleur: '#185FA5', bg: '#E6F1FB' },
  { id: 'evaluatie',     label: 'Evaluatie',        kleur: '#0F6E56', bg: '#E1F5EE' },
  { id: 'loonsverhoging',label: 'Loonsverhoging',   kleur: '#854F0B', bg: '#FAEEDA' },
  { id: 'contract',      label: 'Contract',         kleur: '#3C3489', bg: '#EEEDFE' },
  { id: 'waarschuwing',  label: 'Waarschuwing',     kleur: '#A32D2D', bg: '#FCEBEB' },
  { id: 'overig',        label: 'Overig',           kleur: '#374151', bg: '#F3F4F6' },
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

function bestandsIcoon(mime: string | null) {
  if (!mime) return '📎'
  if (mime === 'application/pdf') return '📄'
  if (mime.startsWith('image/')) return '🖼'
  if (mime.includes('word')) return '📝'
  return '📎'
}

export default function DocumentenSectie({ userId, isHR, naamMedewerker }: Props) {
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

  useEffect(() => { laadDocumenten() }, [laadDocumenten])

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
      setFout(data.error ?? 'Upload mislukt')
    } else {
      setUploadOpen(false)
      setBestand(null)
      setBeschrijving('')
      setIntern(false)
      if (fileRef.current) fileRef.current.value = ''
      await laadDocumenten()
      setMelding('Document opgeslagen')
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
    if (!confirm('Weet je zeker dat je dit document permanent wilt verwijderen?')) return
    const res = await fetch(`/api/documenten/verwijder?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${await token()}` },
    })
    if (res.ok) setDocumenten(prev => prev.filter(d => d.id !== id))
  }

  const zichtbareDocumenten = isHR ? documenten : documenten.filter(d => !d.intern)

  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {isHR ? `Dossier${naamMedewerker ? ` — ${naamMedewerker}` : ''}` : 'Mijn documenten'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {isHR
              ? 'Alleen jij en andere HR-medewerkers van dit bedrijf hebben toegang.'
              : 'Zichtbaar voor jou en HR van jouw bedrijf. Nooit voor collega\'s.'}
          </p>
        </div>
        <button
          onClick={() => { setUploadOpen(o => !o); setFout(null) }}
          className="text-xs font-medium px-3 py-1.5 rounded-lg text-white transition"
          style={{ background: uploadOpen ? '#6b7280' : 'var(--mentaforce-primary)' }}
        >
          {uploadOpen ? 'Annuleer' : '+ Toevoegen'}
        </button>
      </div>

      {/* AVG notice */}
      <div className="mx-6 mt-4 px-3 py-2.5 rounded-xl flex items-start gap-2"
        style={{ background: '#F0F4FF', border: '1px solid #dbeafe' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mt-0.5">
          <circle cx="7" cy="7" r="6" stroke="#185FA5" strokeWidth="1.2" />
          <path d="M7 6v4M7 4.5v.5" stroke="#185FA5" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <p className="text-xs leading-relaxed" style={{ color: '#185FA5' }}>
          <strong>AVG:</strong> Bestanden worden versleuteld opgeslagen en zijn uitsluitend toegankelijk voor
          {isHR ? ' HR-medewerkers van dit bedrijf.' : ' jou en HR van jouw bedrijf. Collega\'s hebben nooit toegang.'}
        </p>
      </div>

      {/* Upload form */}
      {uploadOpen && (
        <div className="mx-6 mt-4 p-4 rounded-xl border border-dashed border-gray-300 bg-gray-50">
          <p className="text-xs font-semibold text-gray-600 mb-3">Nieuw document</p>

          {/* Categorie */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {CATEGORIEËN.map(c => (
              <button
                key={c.id}
                onClick={() => setCategorie(c.id)}
                className="text-xs px-2.5 py-1 rounded-full border transition"
                style={{
                  background: categorie === c.id ? c.bg : 'white',
                  borderColor: categorie === c.id ? c.kleur : '#e5e7eb',
                  color: categorie === c.id ? c.kleur : '#6b7280',
                  fontWeight: categorie === c.id ? 600 : 400,
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* File picker */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-gray-400 transition mb-3"
            style={{ background: bestand ? '#E1F5EE' : 'white' }}
          >
            {bestand ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">{bestandsIcoon(bestand.type)}</span>
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-700 truncate max-w-[200px]">{bestand.name}</p>
                  <p className="text-xs text-gray-400">{formatBytes(bestand.size)}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setBestand(null); if (fileRef.current) fileRef.current.value = '' }}
                  className="ml-2 text-gray-400 hover:text-gray-600 text-sm"
                >×</button>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500">Klik om bestand te kiezen</p>
                <p className="text-xs text-gray-300 mt-0.5">PDF, afbeelding of Word · max 10 MB</p>
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
            placeholder="Korte omschrijving (optioneel)"
            value={beschrijving}
            onChange={e => setBeschrijving(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-400 mb-3"
          />

          {/* HR: intern toggle */}
          {isHR && (
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <div
                onClick={() => setIntern(i => !i)}
                className="w-8 h-4 rounded-full transition relative"
                style={{ background: intern ? '#A32D2D' : '#e5e7eb' }}
              >
                <div
                  className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all"
                  style={{ left: intern ? '17px' : '2px' }}
                />
              </div>
              <span className="text-xs text-gray-600">
                Intern (niet zichtbaar voor medewerker)
              </span>
            </label>
          )}

          {fout && <p className="text-xs text-red-600 mb-2">{fout}</p>}

          <button
            onClick={upload}
            disabled={!bestand || uploadBezig}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-white transition disabled:opacity-40"
            style={{ background: 'var(--mentaforce-primary)' }}
          >
            {uploadBezig ? 'Uploaden...' : 'Opslaan'}
          </button>
        </div>
      )}

      {/* Success flash */}
      {melding && (
        <div className="mx-6 mt-3 px-3 py-2 rounded-xl text-xs font-medium"
          style={{ background: '#E1F5EE', color: '#0F6E56' }}>
          {melding}
        </div>
      )}

      {/* Document list */}
      <div className="p-6 pt-4">
        {laden ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 rounded-full border-2 border-gray-200 animate-spin"
              style={{ borderTopColor: 'var(--mentaforce-primary)' }} />
          </div>
        ) : zichtbareDocumenten.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            {documenten.length === 0 ? 'Nog geen documenten.' : 'Geen zichtbare documenten.'}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {zichtbareDocumenten.map(doc => {
              const cat = catCfg(doc.categorie)
              return (
                <div key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-xl border transition"
                  style={{
                    borderColor: doc.intern ? '#F5ABAB' : '#f3f4f6',
                    background: doc.intern ? '#FFF8F8' : '#FAFAFA',
                  }}>

                  <span className="text-xl flex-shrink-0">{bestandsIcoon(doc.mime_type)}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-xs font-medium text-gray-800 truncate max-w-[180px]">
                        {doc.bestandsnaam}
                      </p>
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: cat.bg, color: cat.kleur }}>
                        {cat.label}
                      </span>
                      {doc.intern && isHR && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: '#FCEBEB', color: '#A32D2D' }}>
                          Intern
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400">
                        {new Date(doc.aangemaakt_op).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {doc.uploader_rol !== 'medewerker' && (
                        <span className="text-xs text-gray-400">· Geüpload door HR</span>
                      )}
                      {doc.beschrijving && (
                        <span className="text-xs text-gray-400 truncate max-w-[140px]">· {doc.beschrijving}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => download(doc.id, doc.bestandsnaam)}
                      disabled={downloadBezig === doc.id}
                      className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 hover:bg-white transition disabled:opacity-40"
                    >
                      {downloadBezig === doc.id ? '...' : 'Download'}
                    </button>
                    {isHR && (
                      <button
                        onClick={() => verwijder(doc.id)}
                        className="text-xs border rounded-lg px-2 py-1.5 transition"
                        style={{ borderColor: '#FECACA', color: '#A32D2D' }}
                        title="Verwijder"
                      >
                        ✕
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
