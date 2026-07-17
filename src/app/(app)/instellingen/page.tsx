'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Users, Leaf, User as UserIcon, AlertTriangle, LogOut, Camera, Mail, Download, Trash2, UserPlus, Eye, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import { avatarPad, vergeetAvatar } from '@/lib/avatars/avatars'
import Navbar, { schakelPortaal, type ViewMode } from '@/components/layout/Navbar'
import { Avatar } from '@/components/ui/Avatar'
import HrCodeModal from '@/components/hr/HrCodeModal'
import GezondheidDoelen from './GezondheidDoelen'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'


async function cropToSquareJpeg(file: File, size: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      const minDim = Math.min(img.width, img.height)
      const sx = (img.width - minDim) / 2
      const sy = (img.height - minDim) / 2
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('canvas leeg')), 'image/jpeg', 0.88)
    }
    img.onerror = reject
    img.src = url
  })
}

type Sectie = 'profiel' | 'gezondheid' | 'account' | 'privacy' | 'weergave' | 'data' | 'gevaar'

function SI({ d, size = 16 }: { d: string | string[]; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
    </svg>
  )
}

const SECTIES: { id: Sectie; label: string; icon: React.ReactNode; beschrijving: string }[] = [
  { id: 'profiel',      label: 'Profiel',              icon: <SI d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />, beschrijving: 'Naam, foto en persoonlijke informatie' },
  { id: 'gezondheid',   label: 'Gezondheid & doelen',  icon: <SI d={['M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z']} />, beschrijving: 'Gewicht, activiteit en dagdoelen' },
  { id: 'account',      label: 'Account & Beveiliging', icon: <SI d={['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z']} />, beschrijving: 'E-mail, wachtwoord en twee-factor' },
  { id: 'privacy',      label: 'Privacy',               icon: <SI d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />, beschrijving: 'Anonimiteit en zichtbaarheidsinstellingen' },
  { id: 'weergave',     label: 'Weergave',              icon: <SI d={['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z']} />, beschrijving: 'Taal, thema en voorkeuren' },
  { id: 'data',         label: 'Mijn gegevens',         icon: <SI d={['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3']} />, beschrijving: 'Exporteer of bekijk je data' },
  { id: 'gevaar',       label: 'Gevarenzone',           icon: <SI d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01" />, beschrijving: 'Account verwijderen of uitloggen' },
]

function Melding({ melding }: { melding: { type: 'success' | 'error'; tekst: string } }) {
  return (
    <p className="text-sm flex items-center gap-1.5" style={{ color: melding.type === 'success' ? 'var(--mf-green-dark)' : 'var(--mf-red)' }}>
      {melding.type === 'success'
        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      }
      {melding.tekst}
    </p>
  )
}

function Toggle({ actief, onChange, label, beschrijving }: {
  actief: boolean; onChange: (v: boolean) => void; label: string; beschrijving?: string
}) {
  return (
    <div className="mf-toggle-row flex items-start justify-between gap-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{label}</p>
        {beschrijving && <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>{beschrijving}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={actief}
        aria-label={label}
        onClick={() => onChange(!actief)}
        className="relative w-11 h-6 rounded-full flex-shrink-0 mt-0.5"
        style={{ background: actief ? 'var(--mentaforce-primary)' : 'var(--border-strong)', transition: 'background 0.2s var(--ease)' }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full"
          style={{ background: 'var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)', left: 2, transition: 'transform 0.2s var(--ease)', transform: actief ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  )
}

export default function Instellingen() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeSectie, setActiveSectie] = useState<Sectie>('profiel')
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [laden, setLaden] = useState(true)
  const [userRol, setUserRol] = useState('')
  const [huidigPortaal, setHuidigPortaal] = useState<ViewMode>('employee')

  // Profiel
  const [naam, setNaam] = useState('')
  const [origineelNaam, setOrigineelNaam] = useState('')
  const [functie, setFunctie] = useState('')
  const [origineelFunctie, setOrigineelFunctie] = useState('')
  const [afdeling, setAfdeling] = useState('')
  const [origineelAfdeling, setOrigineelAfdeling] = useState('')
  const [telefoon, setTelefoon] = useState('')
  const [origineelTelefoon, setOrigineelTelefoon] = useState('')
  const [bio, setBio] = useState('')
  const [origineelBio, setOrigineelBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarBezig, setAvatarBezig] = useState(false)
  const [profielBezig, setProfielBezig] = useState(false)
  const [profielMelding, setProfielMelding] = useState<{ type: 'success' | 'error'; tekst: string } | null>(null)

  // Wachtwoord
  const [huidigWachtwoord, setHuidigWachtwoord] = useState('')
  const [nieuwWachtwoord, setNieuwWachtwoord] = useState('')
  const [bevestigWachtwoord, setBevestigWachtwoord] = useState('')
  const [wachtwoordBezig, setWachtwoordBezig] = useState(false)
  const [wachtwoordMelding, setWachtwoordMelding] = useState<{ type: 'success' | 'error'; tekst: string } | null>(null)
  const [toonWachtwoord, setToonWachtwoord] = useState(false)

  // E-mail
  const [nieuwEmail, setNieuwEmail] = useState('')
  const [emailBezig, setEmailBezig] = useState(false)
  const [emailMelding, setEmailMelding] = useState<{ type: 'success' | 'error'; tekst: string } | null>(null)


  // Privacy — HR-inzage toggles (persist naar profiles)
  const [hrInzageRapporten, setHrInzageRapporten] = useState(false)
  const [hrInzageBestanden, setHrInzageBestanden] = useState(false)

  // Weergave
  const [taal, setTaal] = useState('nl')
  const [thema, setThema] = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('mf-thema') ?? 'licht') : 'licht'
  )

  // Werkgever koppeling
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)
  const [bedrijfsnaam, setBedrijfsnaam] = useState<string | null>(null)
  const [toonKoppelModal, setToonKoppelModal] = useState(false)

  // Rol wisselen (alleen admin)
  const [rolWisselBezig, setRolWisselBezig] = useState(false)
  const [rolWisselMelding, setRolWisselMelding] = useState<{ type: 'success' | 'error'; tekst: string } | null>(null)
  const [adminBedrijfId, setAdminBedrijfId] = useState<string | null>(null) // bewaar originele bedrijf_id

  // Data export
  const [exportBezig, setExportBezig] = useState(false)
  const [exportMelding, setExportMelding] = useState<{ type: 'success' | 'error'; tekst: string } | null>(null)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('thema-schemering', 'thema-donker')
    if (thema === 'schemering') root.classList.add('thema-schemering')
    if (thema === 'donker') root.classList.add('thema-donker')
    if (thema === 'systeem') {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (dark) root.classList.add('thema-donker')
    }
    localStorage.setItem('mf-thema', thema)
  }, [thema])

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      setUserEmail(user.email ?? '')

      const { data: profiel } = await supabase
        .from('profiles')
        .select('naam, avatar_url, functie, afdeling, telefoon, bio, rol, bedrijf_id, hr_inzage_rapporten, hr_inzage_bestanden')
        .eq('id', user.id)
        .single()

      const rol = profiel?.rol ?? ''
      setUserRol(rol)
      if (rol === 'admin') {
        const saved = localStorage.getItem('mf-view-mode') as ViewMode | null
        setHuidigPortaal(saved ?? 'admin')
      } else if (rol === 'hr') {
        setHuidigPortaal('hr')
      } else {
        setHuidigPortaal('employee')
      }

      const n = profiel?.naam ?? ''
      setNaam(n)
      setOrigineelNaam(n)
      setAvatarUrl(profiel?.avatar_url ?? null)
      setBedrijfId(profiel?.bedrijf_id ?? null)
      // Sla originele bedrijf_id op voor admin-herstel (alleen als echte admin)
      if (profiel?.rol === 'admin') {
        setAdminBedrijfId(profiel?.bedrijf_id ?? null)
      } else {
        // Mogelijk in testmodus — haal opgeslagen admin bedrijf_id op
        const opgeslagen = localStorage.getItem('mf-admin-bedrijf-id')
        if (opgeslagen) setAdminBedrijfId(opgeslagen)
      }

      // Bedrijfsnaam ophalen als er een bedrijf_id is
      if (profiel?.bedrijf_id) {
        const { data: bedrijf } = await supabase
          .from('bedrijven')
          .select('naam')
          .eq('id', profiel.bedrijf_id)
          .single()
        setBedrijfsnaam(bedrijf?.naam ?? null)
      }
      const f = profiel?.functie ?? ''
      const a = profiel?.afdeling ?? ''
      const t = profiel?.telefoon ?? ''
      const b = profiel?.bio ?? ''
      setFunctie(f); setOrigineelFunctie(f)
      setAfdeling(a); setOrigineelAfdeling(a)
      setTelefoon(t); setOrigineelTelefoon(t)
      setBio(b); setOrigineelBio(b)
      setHrInzageRapporten(profiel?.hr_inzage_rapporten ?? false)
      setHrInzageBestanden(profiel?.hr_inzage_bestanden ?? false)
      setLaden(false)
    }
    laad()
  }, [router])

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    if (!file.type.startsWith('image/')) return
    setAvatarBezig(true)
    try {
      const blob = await cropToSquareJpeg(file, 400)
      const pad = avatarPad(userId)
      const { error: uploadError } = await supabase.storage
        .from('avatars').upload(pad, blob, { upsert: true, contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      // Sinds 047 slaan we het PAD op, geen publieke URL: de bucket is privé,
      // dus zo'n URL zou niet meer werken. Avatar tekent er een tijdelijke URL
      // bij. De upload is een upsert op hetzelfde pad, dus de vorige getekende
      // URL moet weg — anders zie je een uur lang je oude foto.
      vergeetAvatar(pad)
      await supabase.from('profiles').update({ avatar_url: pad }).eq('id', userId)
      setAvatarUrl(pad)
    } catch {
      toast({ title: 'Uploaden mislukt', description: 'Probeer een andere afbeelding.', variant: 'error' })
    }
    setAvatarBezig(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function verwijderAvatar() {
    if (!userId) return
    setAvatarBezig(true)
    const pad = avatarPad(userId)
    await supabase.storage.from('avatars').remove([pad])
    vergeetAvatar(pad)
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId)
    setAvatarUrl(null)
    setAvatarBezig(false)
  }

  async function slaProfielOp() {
    if (!userId) return
    setProfielBezig(true)
    setProfielMelding(null)
    const { error } = await supabase.from('profiles').update({
      naam: naam.trim(),
      functie: functie.trim(),
      afdeling: afdeling.trim(),
      telefoon: telefoon.trim(),
      bio: bio.trim(),
    }).eq('id', userId)
    if (error) {
      setProfielMelding({ type: 'error', tekst: 'Opslaan mislukt.' })
    } else {
      setOrigineelNaam(naam.trim())
      setOrigineelFunctie(functie.trim())
      setOrigineelAfdeling(afdeling.trim())
      setOrigineelTelefoon(telefoon.trim())
      setOrigineelBio(bio.trim())
      setProfielMelding({ type: 'success', tekst: 'Profiel bijgewerkt.' })
      setTimeout(() => setProfielMelding(null), 3000)
    }
    setProfielBezig(false)
  }

  async function wijzigWachtwoord() {
    if (!nieuwWachtwoord || !bevestigWachtwoord) return
    if (nieuwWachtwoord !== bevestigWachtwoord) {
      setWachtwoordMelding({ type: 'error', tekst: 'Wachtwoorden komen niet overeen.' })
      return
    }
    if (nieuwWachtwoord.length < 8) {
      setWachtwoordMelding({ type: 'error', tekst: 'Minimaal 8 tekens vereist.' })
      return
    }
    setWachtwoordBezig(true)
    setWachtwoordMelding(null)
    const { error } = await supabase.auth.updateUser({ password: nieuwWachtwoord })
    if (error) {
      setWachtwoordMelding({ type: 'error', tekst: `Fout: ${error.message}` })
    } else {
      setHuidigWachtwoord(''); setNieuwWachtwoord(''); setBevestigWachtwoord('')
      setWachtwoordMelding({ type: 'success', tekst: 'Wachtwoord succesvol gewijzigd.' })
      setTimeout(() => setWachtwoordMelding(null), 4000)
    }
    setWachtwoordBezig(false)
  }

  async function wijzigEmail() {
    if (!nieuwEmail.trim() || !nieuwEmail.includes('@')) {
      setEmailMelding({ type: 'error', tekst: 'Voer een geldig e-mailadres in.' })
      return
    }
    setEmailBezig(true)
    setEmailMelding(null)
    const { error } = await supabase.auth.updateUser({ email: nieuwEmail.trim() })
    if (error) {
      setEmailMelding({ type: 'error', tekst: `Fout: ${error.message}` })
    } else {
      setEmailMelding({ type: 'success', tekst: 'Bevestigingsmail verstuurd naar nieuw adres.' })
      setNieuwEmail('')
      setTimeout(() => setEmailMelding(null), 5000)
    }
    setEmailBezig(false)
  }

  const profielGewijzigd =
    naam.trim() !== origineelNaam ||
    functie.trim() !== origineelFunctie ||
    afdeling.trim() !== origineelAfdeling ||
    telefoon.trim() !== origineelTelefoon ||
    bio.trim() !== origineelBio

  async function schakelNaarRol(nieuweRol: 'admin' | 'hr' | 'medewerker' | 'gebruiker') {
    if (!userId) return
    setRolWisselBezig(true)
    setRolWisselMelding(null)

    // Bepaal de DB-rol en bedrijf_id op basis van testmodus
    const dbRol = nieuweRol === 'gebruiker' ? 'medewerker' : nieuweRol
    let nieuwBedrijfId: string | null | undefined = undefined // undefined = niet wijzigen

    if (nieuweRol === 'admin') {
      // Herstel: terug naar admin + originele bedrijf_id
      nieuwBedrijfId = adminBedrijfId
      localStorage.removeItem('mf-view-mode')
      localStorage.removeItem('mf-admin-bedrijf-id')
    } else if (nieuweRol === 'gebruiker') {
      // Gebruiker = geen bedrijf gekoppeld
      // Sla huidige bedrijf_id op zodat we kunnen herstellen
      if (bedrijfId) localStorage.setItem('mf-admin-bedrijf-id', bedrijfId)
      nieuwBedrijfId = null
      localStorage.removeItem('mf-view-mode')
    } else if (nieuweRol === 'medewerker') {
      // Werknemer = wel bedrijf gekoppeld (admin z'n eigen bedrijf)
      if (bedrijfId) localStorage.setItem('mf-admin-bedrijf-id', bedrijfId)
      nieuwBedrijfId = adminBedrijfId ?? bedrijfId
      localStorage.removeItem('mf-view-mode')
    } else if (nieuweRol === 'hr') {
      if (bedrijfId) localStorage.setItem('mf-admin-bedrijf-id', bedrijfId)
      nieuwBedrijfId = adminBedrijfId ?? bedrijfId
      localStorage.removeItem('mf-view-mode')
    }

    // Rol-wissel loopt via een founder-gated server-route (service-role). De
    // guard-trigger op profiles blokkeert client-side rol-escalatie (migratie 044),
    // dus dit is de enige nog toegestane weg om te wisselen.
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/testrol', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        rol: dbRol,
        ...(nieuwBedrijfId !== undefined ? { bedrijf_id: nieuwBedrijfId } : {}),
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setRolWisselMelding({ type: 'error', tekst: `Fout: ${data.error ?? 'wisselen mislukt'}` })
      setRolWisselBezig(false)
      return
    }

    const LABELS: Record<string, string> = {
      admin:      'Admin',
      hr:         'HR Manager',
      medewerker: 'Werknemer',
      gebruiker:  'Gebruiker (geen bedrijf)',
    }
    setUserRol(dbRol)
    setRolWisselMelding({
      type: 'success',
      tekst: `Overgeschakeld naar ${LABELS[nieuweRol]}. Doorsturen...`,
    })

    setTimeout(() => {
      if (nieuweRol === 'admin') window.location.href = '/admin'
      else if (nieuweRol === 'hr') window.location.href = '/hr'
      else window.location.href = '/home'
    }, 900)

    setRolWisselBezig(false)
  }

  async function uitloggen() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Persoonlijke tabellen met een user_id-kolom die we naar de gebruiker exporteren.
  const CHECKIN_TABELLEN = ['checkin_sessies', 'checkin_antwoorden', 'checkin_analyses'] as const
  const VOLLEDIGE_TABELLEN = [
    'checkin_sessies', 'checkin_antwoorden', 'checkin_analyses',
    'disc_inzendingen', 'journal_entries', 'reflectie_entries',
    'focus_timer_logs', 'water_logs', 'training_logs', 'fitness_schemas',
    'oefening_logs', 'gewoonte_logs', 'survey_antwoorden', 'ai_rapporten',
    'notificatie_voorkeuren',
  ] as const

  async function exporteerData(tabellen: readonly string[], metProfiel: boolean, bestandsnaam: string) {
    if (exportBezig) return
    setExportBezig(true)
    setExportMelding(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const resultaat: Record<string, unknown> = {
        geexporteerd_op: new Date().toISOString(),
        gebruiker_id: user.id,
        email: user.email,
      }

      if (metProfiel) {
        // profiles gebruikt id als primaire sleutel, niet user_id
        const { data: profiel } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
        if (profiel) resultaat.profiel = profiel
      }

      // Onbekende of niet-bestaande tabellen falen stil en worden overgeslagen.
      for (const tabel of tabellen) {
        const { data, error } = await supabase.from(tabel).select('*').eq('user_id', user.id)
        if (!error && data) resultaat[tabel] = data
      }

      const blob = new Blob([JSON.stringify(resultaat, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${bestandsnaam}-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setExportMelding({ type: 'success', tekst: 'Je gegevens zijn gedownload als JSON-bestand.' })
    } catch {
      setExportMelding({ type: 'error', tekst: 'Export mislukt. Probeer het later opnieuw.' })
    } finally {
      setExportBezig(false)
    }
  }

  const wachtwoordSterkte = nieuwWachtwoord.length < 8 ? 0 : nieuwWachtwoord.length < 12 ? 1 : nieuwWachtwoord.length < 16 ? 2 : 3

  return (
    <div className="mf-mesh-bg min-h-screen">
      <Navbar />
      <main className="px-4 py-8" style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Profiel hero */}
        <div className="mb-6 rounded-2xl overflow-hidden mf-animate-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          {/* Gradient header */}
          <div className="h-20 relative" style={{ background: 'linear-gradient(135deg, var(--mf-green-dark) 0%, var(--mf-blue) 100%)' }}>
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, color-mix(in srgb, var(--text-1) 15%, transparent) 0%, transparent 60%)' }} />
          </div>

          {/* Info rij */}
          <div className="px-6 pb-5 relative">
            {/* Avatar — overlapt de header */}
            <div className="absolute -top-9 left-6">
              <div className="relative">
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
                  <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--mentaforce-primary) 18%, transparent) 0%, transparent 70%)' }} />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <Avatar naam={naam || 'G'} avatarUrl={avatarUrl} size={72} />
                </div>
                {/* Online dot */}
                <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2" style={{ background: 'var(--mf-green)', borderColor: 'var(--bg-card)', zIndex: 2 }} />
              </div>
            </div>

            {/* Ruimte voor avatar overlap */}
            <div className="h-10" />

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>
                    {naam || 'Gebruiker'}
                  </h1>
                  {/* Rol badge */}
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{
                    background: userRol === 'admin' ? 'var(--mf-purple-light)' : userRol === 'hr' ? 'var(--mf-blue-light)' : 'var(--mf-green-light)',
                    color: userRol === 'admin' ? 'var(--mf-purple)' : userRol === 'hr' ? 'var(--mf-blue)' : 'var(--mf-green-dark)',
                  }}>
                    {userRol === 'admin' ? 'Admin' : userRol === 'hr' ? 'HR Manager' : userRol === 'medewerker' ? 'Werknemer' : 'Gebruiker'}
                  </span>
                </div>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>{userEmail}</p>
                {(functie || afdeling) && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>
                    {[functie, afdeling].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>

              {/* Acties */}
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setActiveSectie('profiel')}>
                  Profiel bewerken
                </Button>
                <Button variant="danger" size="sm" onClick={uitloggen} leftIcon={<LogOut size={14} aria-hidden />}>
                  Uitloggen
                </Button>
              </div>
            </div>

            {/* Account info strip */}
            <div className="mt-4 pt-4 flex flex-wrap gap-x-6 gap-y-1" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-4)' }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>{userEmail}</span>
              </div>
              {bedrijfsnaam && (
                <div className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-4)' }}>
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  </svg>
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>{bedrijfsnaam}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-4)' }}>
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span className="text-xs" style={{ color: 'var(--text-4)' }}>MentaForce v0.9.0</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>Instellingen</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Beheer je profiel, account en voorkeuren.</p>
        </div>

        {laden ? (
          <div className="flex justify-center py-16">
            <div className="mf-spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <nav className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
                {SECTIES.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSectie(s.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition"
                    style={{
                      borderBottom: i < SECTIES.length - 1 ? '1px solid var(--border)' : undefined,
                      background: activeSectie === s.id ? 'var(--mf-green-light)' : 'transparent',
                      color: activeSectie === s.id ? 'var(--mf-green)' : s.id === 'gevaar' ? 'var(--mf-red)' : 'var(--text-2)',
                    }}
                  >
                    <span className="w-5 flex-shrink-0 flex items-center justify-center">{s.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.label}</p>
                      <p className="text-xs truncate hidden lg:block" style={{ color: 'var(--text-4)' }}>{s.beschrijving}</p>
                    </div>
                    {activeSectie === s.id && (
                      <div className="w-1.5 h-1.5 rounded-full ml-auto flex-shrink-0" style={{ background: 'var(--mf-green)' }} />
                    )}
                  </button>
                ))}
              </nav>

              {/* Uitloggen knop — rode warning look */}
              <Button
                variant="danger"
                onClick={uitloggen}
                leftIcon={<LogOut size={15} aria-hidden />}
                style={{ width: '100%', marginTop: 12 }}
              >
                Uitloggen
              </Button>

              {/* App versie */}
              <p className="text-center text-xs mt-4" style={{ color: 'var(--text-4)' }}>MentaForce v0.9.0</p>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0 flex flex-col gap-5">

              {/* -- PROFIEL -- */}
              {activeSectie === 'profiel' && (
                <>
                  {/* Avatar */}
                  <Card style={{ padding: 24 }}>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>Profielfoto</h2>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>Wordt getoond in de app en teamoverzichten.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="relative group flex-shrink-0">
                        <Avatar naam={naam || 'Gebruiker'} avatarUrl={avatarUrl} size={88} />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={avatarBezig}
                          aria-label={avatarUrl ? 'Foto wijzigen' : 'Foto uploaden'}
                          className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          style={{ background: 'color-mix(in srgb, var(--bg-app) 55%, transparent)' }}
                        >
                          {avatarBezig
                            ? <div className="mf-spinner" style={{ width: 20, height: 20 }} />
                            : <Camera size={20} aria-hidden style={{ color: 'var(--text-1)' }} />
                          }
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
                      </div>
                      <div className="flex flex-col gap-2 items-start">
                        <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={avatarBezig}>
                          {avatarUrl ? 'Foto wijzigen' : 'Foto uploaden'}
                        </Button>
                        {avatarUrl && (
                          <Button variant="ghost" size="sm" onClick={verwijderAvatar} disabled={avatarBezig} style={{ color: 'var(--mf-red)' }}>
                            Foto verwijderen
                          </Button>
                        )}
                        <p className="text-xs" style={{ color: 'var(--text-4)' }}>JPG, PNG of WebP. Max 5 MB. Wordt bijgesneden naar vierkant.</p>
                      </div>
                    </div>
                  </Card>

                  {/* Personal info */}
                  <Card style={{ padding: 24 }}>
                    <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Persoonlijke informatie</h2>
                    <p className="text-xs mb-5" style={{ color: 'var(--text-4)' }}>Je naam is zichtbaar voor collega&apos;s in de teamchat.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <Field label="Weergavenaam" required>
                        <Input type="text" value={naam} onChange={e => setNaam(e.target.value)} placeholder="Jouw naam" />
                      </Field>
                      <Field label="Functietitel">
                        <Input type="text" value={functie} onChange={e => setFunctie(e.target.value)} placeholder="bijv. Software Engineer" />
                      </Field>
                      <Field label="Afdeling">
                        <Input type="text" value={afdeling} onChange={e => setAfdeling(e.target.value)} placeholder="bijv. Technologie" />
                      </Field>
                      <Field label="Telefoonnummer">
                        <Input type="tel" value={telefoon} onChange={e => setTelefoon(e.target.value)} placeholder="+32 4xx xx xx xx" />
                      </Field>
                    </div>

                    <div className="mb-5">
                      <Field label="Bio (optioneel)" hint={`${bio.length}/200 tekens`}>
                        <Textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Vertel iets over jezelf..." />
                      </Field>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button onClick={slaProfielOp} loading={profielBezig} disabled={profielBezig || !naam.trim() || !profielGewijzigd}>
                        Wijzigingen opslaan
                      </Button>
                      {profielMelding && <Melding melding={profielMelding} />}
                    </div>
                  </Card>
                </>
              )}

              {/* -- GEZONDHEID & DOELEN -- */}
              {activeSectie === 'gezondheid' && userId && (
                <GezondheidDoelen userId={userId} />
              )}

              {/* -- ACCOUNT & BEVEILIGING -- */}
              {activeSectie === 'account' && (
                <>
                  {/* Current account info */}
                  <Card style={{ padding: 24 }}>
                    <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-1)' }}>Accountoverzicht</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl p-4" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                        <p className="text-xs mb-1" style={{ color: 'var(--text-4)' }}>Huidig e-mailadres</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{userEmail || ''}</p>
                      </div>
                      <div className="rounded-xl p-4" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                        <p className="text-xs mb-1" style={{ color: 'var(--text-4)' }}>Account aangemaakt</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Via uitnodiging</p>
                      </div>
                    </div>
                  </Card>

                  {/* Testmodus rolwissel — alleen admin */}
                  {userRol === 'admin' && (
                    <Card style={{ padding: 24, borderColor: 'color-mix(in srgb, var(--mf-purple) 30%, transparent)' }}>
                      <div className="flex items-start gap-3 mb-5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: 'color-mix(in srgb, var(--mf-purple) 18%, transparent)' }}>
                          <Shield size={16} aria-hidden style={{ color: 'var(--mf-purple)' }} />
                        </div>
                        <div>
                          <h2 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>
                            Testmodus — rol wisselen
                          </h2>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                            Wissel tijdelijk naar een andere rol om functies te testen. Je kunt altijd terugwisselen via instellingen.
                          </p>
                        </div>
                      </div>

                      {/* Huidige rol badge */}
                      <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                        <span className="text-xs" style={{ color: 'var(--text-3)' }}>Nu actief als:</span>
                        <Badge
                          style={{
                            background: `color-mix(in srgb, ${userRol === 'admin' ? 'var(--mf-purple)' : userRol === 'hr' ? 'var(--mf-blue)' : 'var(--mentaforce-primary)'} 22%, transparent)`,
                            color: userRol === 'admin' ? 'var(--mf-purple)' : userRol === 'hr' ? 'var(--mf-blue)' : 'var(--mentaforce-primary)',
                            border: 'none',
                          }}
                        >
                          {userRol === 'admin'
                            ? <><Shield size={12} aria-hidden /> Admin</>
                            : userRol === 'hr'
                            ? <><Users size={12} aria-hidden /> HR Manager</>
                            : bedrijfId
                            ? <><Leaf size={12} aria-hidden /> Werknemer</>
                            : <><UserIcon size={12} aria-hidden /> Gebruiker</>}
                        </Badge>
                        {userRol !== 'admin' && (
                          <Badge variant="warning">Testmodus</Badge>
                        )}
                      </div>

                      {/* Rol knoppen — 2x2 grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {([
                          {
                            id: 'medewerker' as const,
                            label: 'Werknemer',
                            Icon: Leaf,
                            kleur: 'var(--mentaforce-primary)',
                            beschrijving: 'Gekoppeld aan bedrijf',
                            detail: 'Check-in · rooster · gesprekken · werkdag',
                          },
                          {
                            id: 'gebruiker' as const,
                            label: 'Gebruiker',
                            Icon: UserIcon,
                            kleur: 'var(--text-2)',
                            beschrijving: 'Geen bedrijf gekoppeld',
                            detail: 'Alleen welzijn · coach · journal',
                          },
                          {
                            id: 'hr' as const,
                            label: 'HR Manager',
                            Icon: Users,
                            kleur: 'var(--mf-blue)',
                            beschrijving: 'HR portaal',
                            detail: 'Teams · roosters · KPI · gesprekken',
                          },
                          {
                            id: 'admin' as const,
                            label: 'Admin (terug)',
                            Icon: Shield,
                            kleur: 'var(--mf-purple)',
                            beschrijving: 'Volledige toegang',
                            detail: 'Herstel je eigen account',
                          },
                        ] as const).map(opt => {
                          const actieveOptie = userRol === 'admin' ? 'admin'
                            : userRol === 'hr' ? 'hr'
                            : bedrijfId ? 'medewerker' : 'gebruiker'
                          const isActief = (opt.id as string) === actieveOptie

                          const OptIcon = opt.Icon
                          return (
                            <button
                              key={opt.id}
                              onClick={() => !isActief && schakelNaarRol(opt.id)}
                              disabled={rolWisselBezig || isActief}
                              className="mf-pressable"
                              style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                gap: 8, padding: '14px 16px', borderRadius: 'var(--radius-md)',
                                border: `2px solid ${isActief ? opt.kleur : 'var(--border)'}`,
                                background: isActief ? `color-mix(in srgb, ${opt.kleur} 14%, transparent)` : 'var(--bg-subtle)',
                                cursor: isActief ? 'default' : rolWisselBezig ? 'wait' : 'pointer',
                                opacity: rolWisselBezig && !isActief ? 0.4 : 1,
                                transition: 'border-color 0.15s var(--ease), background 0.15s var(--ease)', textAlign: 'left', width: '100%',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <OptIcon size={20} aria-hidden style={{ color: isActief ? opt.kleur : 'var(--text-2)' }} />
                                {isActief && (
                                  <span style={{ fontSize: 9, fontWeight: 800, background: `color-mix(in srgb, ${opt.kleur} 20%, transparent)`, color: opt.kleur, borderRadius: 4, padding: '2px 6px' }}>
                                    ACTIEF
                                  </span>
                                )}
                              </div>
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: isActief ? opt.kleur : 'var(--text-1)', marginBottom: 2 }}>
                                  {opt.label}
                                </p>
                                <p style={{ fontSize: 10, color: isActief ? `color-mix(in srgb, ${opt.kleur} 70%, transparent)` : 'var(--text-3)', lineHeight: 1.4 }}>
                                  {opt.detail}
                                </p>
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      {rolWisselMelding && (
                        <div className="px-4 py-2.5 rounded-xl text-xs font-medium"
                          style={{
                            background: `color-mix(in srgb, ${rolWisselMelding.type === 'success' ? 'var(--mf-green)' : 'var(--mf-red)'} 15%, transparent)`,
                            color: rolWisselMelding.type === 'success' ? 'var(--mf-green)' : 'var(--mf-red)',
                            border: `1px solid color-mix(in srgb, ${rolWisselMelding.type === 'success' ? 'var(--mf-green)' : 'var(--mf-red)'} 30%, transparent)`,
                          }}>
                          {rolWisselMelding.tekst}
                        </div>
                      )}

                      <p className="text-xs mt-3 leading-relaxed flex items-start gap-1.5" style={{ color: 'var(--text-4)' }}>
                        <AlertTriangle size={13} aria-hidden style={{ flexShrink: 0, marginTop: 1, color: 'var(--mf-amber)' }} />
                        <span>Elke optie wijzigt je <strong style={{ color: 'var(--text-3)' }}>echte rol én bedrijfskoppeling</strong> in de database — je ziet precies wat een echte gebruiker ziet, inclusief alle RLS-policies. &quot;Admin (terug)&quot; herstelt alles naar je originele staat.</span>
                      </p>
                    </Card>
                  )}

                  {/* Change email */}
                  <Card style={{ padding: 24 }}>
                    <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-1)' }}>E-mailadres wijzigen</h2>
                    <p className="text-xs mb-4" style={{ color: 'var(--text-4)' }}>Je ontvangt een bevestigingsmail op het nieuwe adres.</p>
                    <div className="flex gap-3 items-start">
                      <div style={{ flex: 1 }}>
                        <Field label="Nieuw e-mailadres">
                          <Input type="email" value={nieuwEmail} onChange={e => setNieuwEmail(e.target.value)} placeholder="naam@bedrijf.nl" />
                        </Field>
                      </div>
                      <Button onClick={wijzigEmail} loading={emailBezig} disabled={emailBezig || !nieuwEmail.trim()} style={{ marginTop: 25, flexShrink: 0 }}>
                        Wijzigen
                      </Button>
                    </div>
                    {emailMelding && <div className="mt-3"><Melding melding={emailMelding} /></div>}
                  </Card>

                  {/* Change password */}
                  <Card style={{ padding: 24 }}>
                    <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Wachtwoord wijzigen</h2>
                    <p className="text-xs mb-4" style={{ color: 'var(--text-4)' }}>Minimaal 8 tekens. Gebruik letters, cijfers en symbolen voor meer veiligheid.</p>
                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <Input type={toonWachtwoord ? 'text' : 'password'} value={huidigWachtwoord}
                          onChange={e => setHuidigWachtwoord(e.target.value)} placeholder="Huidig wachtwoord"
                          aria-label="Huidig wachtwoord" style={{ paddingRight: 64 }} />
                        <button type="button" onClick={() => setToonWachtwoord(t => !t)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-1"
                          style={{ color: 'var(--text-3)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                          {toonWachtwoord ? 'Verberg' : 'Toon'}
                        </button>
                      </div>
                      <Input type={toonWachtwoord ? 'text' : 'password'} value={nieuwWachtwoord}
                        onChange={e => setNieuwWachtwoord(e.target.value)} placeholder="Nieuw wachtwoord" aria-label="Nieuw wachtwoord" />
                      {nieuwWachtwoord && (
                        <div className="flex items-center gap-2">
                          {[0, 1, 2].map(i => (
                            <div key={i} className="flex-1 h-1.5 rounded-full"
                              style={{ background: wachtwoordSterkte > i ? ['var(--mf-red)', 'var(--mf-amber)', 'var(--mentaforce-primary)'][i] : 'var(--border-strong)', transition: 'background 0.15s var(--ease)' }} />
                          ))}
                          <span className="text-xs ml-1 w-12" style={{ color: 'var(--text-4)' }}>
                            {['Te kort', 'Matig', 'Goed', 'Sterk'][wachtwoordSterkte]}
                          </span>
                        </div>
                      )}
                      <Input type={toonWachtwoord ? 'text' : 'password'} value={bevestigWachtwoord}
                        onChange={e => setBevestigWachtwoord(e.target.value)} placeholder="Bevestig nieuw wachtwoord"
                        aria-label="Bevestig nieuw wachtwoord"
                        onKeyDown={e => e.key === 'Enter' && wijzigWachtwoord()} />
                      {bevestigWachtwoord && nieuwWachtwoord !== bevestigWachtwoord && (
                        <p className="text-xs" style={{ color: 'var(--mf-red)' }}>Wachtwoorden komen niet overeen</p>
                      )}
                      <div className="flex items-center gap-3">
                        <Button onClick={wijzigWachtwoord} loading={wachtwoordBezig} disabled={wachtwoordBezig || !nieuwWachtwoord || !bevestigWachtwoord}>
                          Wachtwoord wijzigen
                        </Button>
                        {wachtwoordMelding && <Melding melding={wachtwoordMelding} />}
                      </div>
                    </div>
                  </Card>

                  {/* Werkgever koppeling — alleen zichtbaar voor medewerkers */}
                  {(userRol === 'medewerker' || userRol === '') && (
                    <Card style={{ padding: 24 }}>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <h2 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>Werkgever</h2>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
                            Koppel je account aan je werkgever via een HR code.
                          </p>
                        </div>
                        {bedrijfId && (
                          <Badge variant="success" style={{ flexShrink: 0 }}>Gekoppeld</Badge>
                        )}
                      </div>

                      {bedrijfId ? (
                        /* Al gekoppeld */
                        <div
                          className="rounded-xl px-4 py-3 flex items-center gap-3"
                          style={{ border: '1px solid color-mix(in srgb, var(--mentaforce-primary) 30%, transparent)', background: 'var(--mentaforce-primary-light)' }}
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs"
                            style={{ background: 'var(--mentaforce-primary)', color: 'var(--bg-app)' }}
                          >
                            HR
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>
                              {bedrijfsnaam ?? 'Jouw werkgever'}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Account is gekoppeld</p>
                          </div>
                        </div>
                      ) : (
                        /* Nog niet gekoppeld */
                        <div>
                          <div
                            className="rounded-xl p-5 flex flex-col items-center text-center gap-3 mb-4"
                            style={{ border: '1px dashed var(--border-strong)' }}
                          >
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center"
                              style={{ background: 'var(--bg-subtle)', color: 'var(--text-3)' }}
                            >
                              <UserPlus size={24} aria-hidden />
                            </div>
                            <div>
                              <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>Nog niet gekoppeld aan een werkgever</p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
                                Vraag de HR code op bij je werkgever en koppel je account.
                              </p>
                            </div>
                          </div>
                          <Button onClick={() => setToonKoppelModal(true)} style={{ width: '100%' }}>
                            Koppel aan werkgever via HR code
                          </Button>
                        </div>
                      )}
                    </Card>
                  )}
                </>
              )}

              {/* -- PRIVACY -- */}
              {activeSectie === 'privacy' && (
                <>
                  <div className="rounded-2xl p-4 flex items-start gap-3"
                    style={{ background: 'var(--mentaforce-primary-light)', border: '1px solid color-mix(in srgb, var(--mentaforce-primary) 35%, transparent)' }}>
                    <Eye size={20} aria-hidden style={{ flexShrink: 0, marginTop: 2, color: 'var(--mentaforce-primary)' }} />
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Privacy-by-design</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                        MentaForce deelt nooit jouw individuele check-in antwoorden met HR. HR ziet uitsluitend geaggregeerde teamgemiddelden. Jouw persoonlijke data blijft van jou.
                      </p>
                    </div>
                  </div>

                  {/* HR Inzage — alleen voor werknemers met bedrijf */}
                  {bedrijfId && (
                    <Card style={{ padding: 24 }}>
                      <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Wat HR van jou kan zien</h2>
                      <p className="text-xs mb-4" style={{ color: 'var(--text-4)' }}>Jij bepaalt wat jouw HR-afdeling mag inzien. Standaard staat alles uit.</p>
                      <Toggle
                        actief={hrInzageRapporten}
                        onChange={async (v) => {
                          setHrInzageRapporten(v)
                          if (userId) await supabase.from('profiles').update({ hr_inzage_rapporten: v }).eq('id', userId)
                        }}
                        label="HR mag mijn AI-rapporten inzien"
                        beschrijving="Check-in rapporten, DISC-profiel en onboarding samenvatting"
                      />
                      <Toggle
                        actief={hrInzageBestanden}
                        onChange={async (v) => {
                          setHrInzageBestanden(v)
                          if (userId) await supabase.from('profiles').update({ hr_inzage_bestanden: v }).eq('id', userId)
                        }}
                        label="HR mag mijn gedeelde bestanden bekijken"
                        beschrijving="Alleen bestanden die jij markeert als 'Deel met HR' in Mijn bestanden"
                      />
                    </Card>
                  )}

                  <Card style={{ padding: 24 }}>
                    <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-1)' }}>Toestemmingen</h2>
                    <div className="flex flex-col gap-3">
                      {[
                        { label: 'Gegevensverwerking voor welzijnsanalyse', status: 'Vereist', beschrijving: 'Noodzakelijk voor de werking van het platform' },
                        { label: 'AVG-verwerkersovereenkomst', status: 'Actief', beschrijving: 'Aanvaard bij registratie van je organisatie' },
                        { label: 'Analytische cookies', status: 'Actief', beschrijving: 'Helpt ons de app te verbeteren' },
                      ].map(t => (
                        <div key={t.label} className="flex items-start justify-between gap-4 p-3 rounded-xl" style={{ border: '1px solid var(--border)' }}>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{t.label}</p>
                            <p className="text-xs" style={{ color: 'var(--text-4)' }}>{t.beschrijving}</p>
                          </div>
                          <Badge variant={t.status === 'Vereist' ? 'neutral' : 'success'} style={{ flexShrink: 0 }}>
                            {t.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-3 flex-wrap">
                      <Link href="/voorwaarden" className="text-xs underline" style={{ color: 'var(--text-3)' }}>
                        Algemene voorwaarden
                      </Link>
                      <Link href="/contact" className="text-xs underline" style={{ color: 'var(--text-3)' }}>
                        Privacy-verzoek indienen
                      </Link>
                    </div>
                  </Card>
                </>
              )}

              {/* -- WEERGAVE -- */}
              {activeSectie === 'weergave' && (
                <>
                  {/* ── Portaal wisselen (alleen admin) ── */}
                  {userRol === 'admin' && (
                    <Card style={{ padding: 24 }}>
                      <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Portaal wisselen</h2>
                      <p className="text-xs mb-5" style={{ color: 'var(--text-3)' }}>
                        Kies welk portaal je wilt bekijken. Dit is de enige plek waar je kunt wisselen.
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          { mode: 'employee' as ViewMode, label: 'Werknemer',  beschrijving: 'Vitaliteit & werkdag',  kleur: 'var(--mentaforce-primary)', Icon: Leaf },
                          { mode: 'hr'       as ViewMode, label: 'HR',         beschrijving: 'Team & beheer',         kleur: 'var(--mf-blue)', Icon: Users },
                          { mode: 'admin'    as ViewMode, label: 'Admin',      beschrijving: 'Volledige toegang',     kleur: 'var(--mf-purple)', Icon: Shield },
                        ] as const).map(opt => {
                          const actief = huidigPortaal === opt.mode
                          const OptIcon = opt.Icon
                          return (
                            <button
                              key={opt.mode}
                              onClick={() => { setHuidigPortaal(opt.mode); schakelPortaal(opt.mode) }}
                              className="mf-pressable"
                              style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                gap: 8, padding: '14px 16px',
                                borderRadius: 'var(--radius-md)', border: `2px solid ${actief ? opt.kleur : 'var(--border)'}`,
                                background: actief ? `color-mix(in srgb, ${opt.kleur} 14%, transparent)` : 'var(--bg-subtle)',
                                cursor: actief ? 'default' : 'pointer',
                                transition: 'border-color 0.15s var(--ease), background 0.15s var(--ease)', textAlign: 'left',
                              }}
                            >
                              <OptIcon size={22} aria-hidden style={{ color: actief ? opt.kleur : 'var(--text-2)' }} />
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: actief ? opt.kleur : 'var(--text-1)' }}>
                                  {opt.label}
                                  {actief && <span style={{ marginLeft: 6, fontSize: 10, background: `color-mix(in srgb, ${opt.kleur} 20%, transparent)`, color: opt.kleur, borderRadius: 4, padding: '1px 6px' }}>Actief</span>}
                                </p>
                                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{opt.beschrijving}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </Card>
                  )}

                  <Card style={{ padding: 24 }}>
                    <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-1)' }}>Taal</h2>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { value: 'nl', label: 'Nederlands', sub: 'Standaard' },
                        { value: 'fr', label: 'Français', sub: 'Binnenkort' },
                        { value: 'en', label: 'English', sub: 'Binnenkort' },
                      ].map(l => (
                        <button key={l.value} onClick={() => setTaal(l.value)}
                          className="mf-pressable p-3 rounded-xl text-left"
                          style={{
                            background: taal === l.value ? 'var(--mentaforce-primary-light)' : 'transparent',
                            border: `1px solid ${taal === l.value ? 'var(--mentaforce-primary)' : 'var(--border)'}`,
                            transition: 'border-color 0.15s var(--ease), background 0.15s var(--ease)',
                          }}>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{l.label}</p>
                          <p className="text-xs" style={{ color: 'var(--text-4)' }}>{l.sub}</p>
                        </button>
                      ))}
                    </div>
                  </Card>

                  <Card style={{ padding: 24 }}>
                    <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-1)' }}>Thema</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { value: 'licht',      label: 'Licht',      sub: 'Helder en fris' },
                        { value: 'schemering', label: 'Schemering', sub: 'Warm en rustig' },
                        { value: 'donker',     label: 'Donker',     sub: 'Voor \'s avonds' },
                        { value: 'systeem',    label: 'Systeem',    sub: 'Volgt je OS' },
                      ].map(t => (
                        <button key={t.value} onClick={() => setThema(t.value)}
                          className="mf-pressable p-3 rounded-xl text-left"
                          style={{
                            background: thema === t.value ? 'var(--mentaforce-primary-light)' : 'transparent',
                            border: `1px solid ${thema === t.value ? 'var(--mentaforce-primary)' : 'var(--border)'}`,
                            transition: 'border-color 0.15s var(--ease), background 0.15s var(--ease)',
                          }}>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{t.label}</p>
                          <p className="text-xs" style={{ color: 'var(--text-4)' }}>{t.sub}</p>
                        </button>
                      ))}
                    </div>
                  </Card>

                </>
              )}

              {/* -- DATA -- */}
              {activeSectie === 'data' && (
                <>
                  <Card style={{ padding: 24 }}>
                    <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Gegevensoverzicht</h2>
                    <p className="text-xs mb-5" style={{ color: 'var(--text-4)' }}>Een overzicht van de gegevens die MentaForce over jou bijhoudt.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'Check-ins',        kleur: 'var(--mf-green)', bg: 'var(--mf-green-light)', d: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
                        { label: 'Journal entries',  kleur: 'var(--mf-blue)', bg: 'var(--mf-blue-light)', d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
                        { label: 'Coach-gesprekken', kleur: 'var(--mf-purple)', bg: 'var(--mf-purple-light)', d: 'M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
                        { label: 'Gewoonte logs',    kleur: 'var(--mf-amber)', bg: 'var(--mf-amber-light)', d: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
                        { label: 'Teamberichten',    kleur: 'var(--mf-red)', bg: 'var(--mf-red-light)', d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
                        { label: 'Profiel data',     kleur: 'var(--text-2)', bg: 'var(--bg-subtle)', d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
                      ].map(d => (
                        <div key={d.label} className="rounded-xl p-4" style={{ background: d.bg, border: '1px solid var(--border)' }}>
                          <div style={{ color: d.kleur, marginBottom: 8 }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d={d.d} />
                            </svg>
                          </div>
                          <p className="text-sm font-medium" style={{ color: d.kleur }}>{d.label}</p>
                          <p className="text-xs" style={{ color: 'var(--text-4)' }}>Alleen zichtbaar voor jou</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card style={{ padding: 24 }}>
                    <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Exporteer je data</h2>
                    <p className="text-xs mb-4" style={{ color: 'var(--text-4)' }}>Download direct al jouw persoonlijke gegevens als JSON-bestand. Het bestand wordt lokaal in je browser opgebouwd.</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => exporteerData(CHECKIN_TABELLEN, false, 'mentaforce-checkins')}
                        disabled={exportBezig}
                        leftIcon={<Download size={15} aria-hidden />}>
                        Check-in data exporteren
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => exporteerData(VOLLEDIGE_TABELLEN, true, 'mentaforce-volledig')}
                        loading={exportBezig}
                        disabled={exportBezig}
                        leftIcon={<Download size={15} aria-hidden />}>
                        {exportBezig ? 'Bezig met exporteren…' : 'Volledige data exporteren'}
                      </Button>
                    </div>
                    {exportMelding && (
                      <p className="text-xs mt-3" style={{ color: exportMelding.type === 'success' ? 'var(--mentaforce-primary)' : 'var(--mf-red)' }}>
                        {exportMelding.tekst}
                      </p>
                    )}
                  </Card>

                  <Card style={{ padding: 24 }}>
                    <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Recht op inzage (AVG)</h2>
                    <p className="text-xs mb-4" style={{ color: 'var(--text-4)' }}>Je hebt het recht om al je persoonlijke gegevens in te zien, te corrigeren of te laten verwijderen.</p>
                    <a href="mailto:info@mentaforce.nl?subject=AVG-verzoek"
                      className="mf-pressable inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium"
                      style={{ border: '1px solid var(--border-strong)', color: 'var(--text-1)', background: 'var(--bg-subtle)', textDecoration: 'none' }}>
                      <Mail size={15} aria-hidden />
                      AVG-verzoek indienen
                    </a>
                  </Card>
                </>
              )}

              {/* -- GEVARENZONE -- */}
              {activeSectie === 'gevaar' && (
                <>
                  <Card style={{ padding: 24 }}>
                    <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-1)' }}>Sessie</h2>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: 'var(--text-1)' }}>Uitloggen op dit apparaat</p>
                        <p className="text-xs" style={{ color: 'var(--text-4)' }}>Je wordt doorgestuurd naar de inlogpagina.</p>
                      </div>
                      <Button variant="secondary" size="sm" onClick={uitloggen}>
                        Uitloggen
                      </Button>
                    </div>
                  </Card>

                  <Card style={{ padding: 24, borderColor: 'color-mix(in srgb, var(--mf-red) 30%, transparent)' }}>
                    <div className="flex items-start gap-3 mb-4">
                      <Trash2 size={20} aria-hidden style={{ flexShrink: 0, marginTop: 2, color: 'var(--mf-red)' }} />
                      <div>
                        <h2 className="text-base font-semibold" style={{ color: 'var(--mf-red)' }}>Account &amp; gegevens verwijderen</h2>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                          Vraag verwijdering aan van je account en al je persoonlijke gegevens. We verwerken je verzoek conform de AVG (recht op vergetelheid) en bevestigen per e-mail zodra het is uitgevoerd.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--mf-red-light)', border: '1px solid color-mix(in srgb, var(--mf-red) 25%, transparent)' }}>
                      <p className="text-sm mb-1" style={{ color: 'var(--text-2)' }}>Wat er verwijderd wordt:</p>
                      <ul className="text-xs space-y-1 ml-3" style={{ color: 'var(--text-3)' }}>
                        {['Alle check-in antwoorden', 'Journal entries en notities', 'AI coach-gesprekken', 'Gewoonte-logs', 'Profielfoto en persoonlijke info'].map(i => (
                          <li key={i} className="flex items-center gap-2">
                            <X size={10} aria-hidden style={{ color: 'var(--mf-red)', flexShrink: 0 }} />
                            {i}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <p className="text-xs mb-3" style={{ color: 'var(--text-4)' }}>
                      Tip: exporteer eerst je gegevens via <strong style={{ color: 'var(--text-2)' }}>Mijn gegevens</strong> als je een kopie wilt bewaren.
                    </p>

                    <a
                      href={`mailto:info@mentaforce.nl?subject=${encodeURIComponent('Verzoek tot verwijdering van mijn account en gegevens')}&body=${encodeURIComponent('Hallo,\n\nIk wil mijn MentaForce-account en al mijn persoonlijke gegevens definitief laten verwijderen conform de AVG (recht op vergetelheid).\n\nMet vriendelijke groet,')}`}
                      className="mf-pressable w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                      style={{ background: 'var(--mf-red)', color: 'var(--bg-app)', textDecoration: 'none' }}>
                      <Mail size={15} aria-hidden />
                      Verwijderverzoek indienen
                    </a>
                  </Card>
                </>
              )}

            </div>
          </div>
        )}
      </main>

      {/* HR code koppelmodal */}
      <HrCodeModal
        open={toonKoppelModal}
        onSluit={() => setToonKoppelModal(false)}
        onGekoppeld={({ bedrijf_id, bedrijfsnaam: naam }) => {
          setBedrijfId(bedrijf_id)
          setBedrijfsnaam(naam)
          setToonKoppelModal(false)
        }}
      />
    </div>
  )
}
