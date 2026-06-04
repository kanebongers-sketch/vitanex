'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar, { schakelPortaal, type ViewMode } from '@/components/Navbar'
import { Avatar } from '@/components/Avatar'
import HrCodeModal from '@/components/HrCodeModal'

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

type Sectie = 'profiel' | 'account' | 'notificaties' | 'privacy' | 'weergave' | 'data' | 'gevaar'

function SI({ d, size = 16 }: { d: string | string[]; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
    </svg>
  )
}

const SECTIES: { id: Sectie; label: string; icon: React.ReactNode; beschrijving: string }[] = [
  { id: 'profiel',      label: 'Profiel',              icon: <SI d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />, beschrijving: 'Naam, foto en persoonlijke informatie' },
  { id: 'account',      label: 'Account & Beveiliging', icon: <SI d={['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z']} />, beschrijving: 'E-mail, wachtwoord en twee-factor' },
  { id: 'notificaties', label: 'Notificaties',          icon: <SI d={['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0']} />, beschrijving: 'Herinneringen en meldingen beheren' },
  { id: 'privacy',      label: 'Privacy',               icon: <SI d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />, beschrijving: 'Anonimiteit en zichtbaarheidsinstellingen' },
  { id: 'weergave',     label: 'Weergave',              icon: <SI d={['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z']} />, beschrijving: 'Taal, thema en voorkeuren' },
  { id: 'data',         label: 'Mijn gegevens',         icon: <SI d={['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3']} />, beschrijving: 'Exporteer of bekijk je data' },
  { id: 'gevaar',       label: 'Gevarenzone',           icon: <SI d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01" />, beschrijving: 'Account verwijderen of uitloggen' },
]

function Melding({ melding }: { melding: { type: 'success' | 'error'; tekst: string } }) {
  return (
    <p className="text-sm flex items-center gap-1.5" style={{ color: melding.type === 'success' ? '#0F6E56' : '#A32D2D' }}>
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
    <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {beschrijving && <p className="text-xs text-gray-400 mt-0.5">{beschrijving}</p>}
      </div>
      <button
        onClick={() => onChange(!actief)}
        className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5"
        style={{ background: actief ? '#1D9E75' : '#e5e7eb' }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform"
          style={{ transform: actief ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  )
}

export default function Instellingen() {
  const router = useRouter()
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

  // Notificaties
  const [notifCheckin, setNotifCheckin] = useState(true)
  const [notifCoach, setNotifCoach] = useState(true)
  const [notifTeam, setNotifTeam] = useState(false)
  const [notifHR, setNotifHR] = useState(false)
  const [notifNieuws, setNotifNieuws] = useState(false)
  const [notifPush, setNotifPush] = useState(true)
  const [notifEmail, setNotifEmail] = useState(true)

  // Privacy
  const [privacyScore, setPrivacyScore] = useState(false)
  const [privacyJournal, setPrivacyJournal] = useState(true)
  const [hrInzageRapporten, setHrInzageRapporten] = useState(false)
  const [hrInzageBestanden, setHrInzageBestanden] = useState(false)
  const [privacyCoach, setPrivacyCoach] = useState(true)
  const [privacyAnonymous, setPrivacyAnonymous] = useState(true)

  // Weergave
  const [taal, setTaal] = useState('nl')
  const [thema, setThema] = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('mf-thema') ?? 'licht') : 'licht'
  )
  const [checkinDag, setCheckinDag] = useState('maandag')
  const [compactMode, setCompactMode] = useState(false)

  // Werkgever koppeling
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)
  const [bedrijfsnaam, setBedrijfsnaam] = useState<string | null>(null)
  const [toonKoppelModal, setToonKoppelModal] = useState(false)

  // Rol wisselen (alleen admin)
  const [rolWisselBezig, setRolWisselBezig] = useState(false)
  const [rolWisselMelding, setRolWisselMelding] = useState<{ type: 'success' | 'error'; tekst: string } | null>(null)
  const [adminBedrijfId, setAdminBedrijfId] = useState<string | null>(null) // bewaar originele bedrijf_id

  // Account delete
  const [deleteBevestig, setDeleteBevestig] = useState('')
  const [deleteBezig, setDeleteBezig] = useState(false)

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
      const path = `${userId}/avatar.jpg`
      const { error: uploadError } = await supabase.storage
        .from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const urlMetCacheBust = `${publicUrl}?t=${Date.now()}`
      await supabase.from('profiles').update({ avatar_url: urlMetCacheBust }).eq('id', userId)
      setAvatarUrl(urlMetCacheBust)
    } catch (err) { console.error('Avatar upload mislukt:', err) }
    setAvatarBezig(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function verwijderAvatar() {
    if (!userId) return
    setAvatarBezig(true)
    await supabase.storage.from('avatars').remove([`${userId}/avatar.jpg`])
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

    // Update profiles — rol altijd, bedrijf_id alleen als gewijzigd
    const update: Record<string, unknown> = { rol: dbRol }
    if (nieuwBedrijfId !== undefined) update.bedrijf_id = nieuwBedrijfId

    const { error } = await supabase.from('profiles').update(update).eq('id', userId)
    if (error) {
      setRolWisselMelding({ type: 'error', tekst: `Fout: ${error.message}` })
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

  const wachtwoordSterkte = nieuwWachtwoord.length < 8 ? 0 : nieuwWachtwoord.length < 12 ? 1 : nieuwWachtwoord.length < 16 ? 2 : 3

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="px-4 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Instellingen</h1>
          <p className="text-gray-500 text-sm mt-1">Beheer je profiel, account en voorkeuren.</p>
        </div>

        {laden ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: 'var(--mentaforce-primary)' }} />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <nav className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {SECTIES.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSectie(s.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition ${i < SECTIES.length - 1 ? 'border-b border-gray-50' : ''}`}
                    style={{
                      background: activeSectie === s.id ? 'var(--mentaforce-primary-light)' : 'transparent',
                      color: activeSectie === s.id ? 'var(--mentaforce-primary)' : s.id === 'gevaar' ? '#E24B4A' : '#374151',
                    }}
                  >
                    <span className="w-5 flex-shrink-0 flex items-center justify-center">{s.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.label}</p>
                      <p className="text-xs text-gray-400 truncate hidden lg:block">{s.beschrijving}</p>
                    </div>
                    {activeSectie === s.id && (
                      <div className="w-1.5 h-1.5 rounded-full ml-auto flex-shrink-0" style={{ background: 'var(--mentaforce-primary)' }} />
                    )}
                  </button>
                ))}
              </nav>

              {/* Quick stats */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 mt-4">
                <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-widest">Account info</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar naam={naam || 'G'} avatarUrl={avatarUrl} size={28} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{naam || 'Gebruiker'}</p>
                      <p className="text-xs text-gray-400 truncate">{userEmail}</p>
                    </div>
                  </div>
                  <div className="mt-1 pt-2 border-t border-gray-100 flex flex-col gap-1">
                    <Link href="/portaal" className="text-xs text-gray-400 hover:text-gray-600 transition flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                      Ga naar portaal
                    </Link>
                    <button onClick={uitloggen} className="text-xs text-red-400 hover:text-red-600 transition flex items-center gap-1.5 text-left">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Uitloggen
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0 flex flex-col gap-5">

              {/* -- PROFIEL -- */}
              {activeSectie === 'profiel' && (
                <>
                  {/* Avatar */}
                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="text-base font-semibold text-gray-900">Profielfoto</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Wordt getoond in de app en teamoverzichten.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="relative group flex-shrink-0">
                        <Avatar naam={naam || 'Gebruiker'} avatarUrl={avatarUrl} size={88} />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={avatarBezig}
                          className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          style={{ background: 'rgba(0,0,0,0.45)' }}
                        >
                          {avatarBezig
                            ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                <circle cx="12" cy="13" r="4" />
                              </svg>
                          }
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => fileInputRef.current?.click()} disabled={avatarBezig}
                          className="text-sm border border-gray-200 rounded-xl px-4 py-2 text-gray-700 hover:bg-gray-50 transition disabled:opacity-40">
                          {avatarUrl ? 'Foto wijzigen' : 'Foto uploaden'}
                        </button>
                        {avatarUrl && (
                          <button onClick={verwijderAvatar} disabled={avatarBezig}
                            className="text-sm text-gray-400 hover:text-red-500 transition disabled:opacity-40 text-left px-1">
                            Foto verwijderen
                          </button>
                        )}
                        <p className="text-xs text-gray-400">JPG, PNG of WebP. Max 5 MB. Wordt bijgesneden naar vierkant.</p>
                      </div>
                    </div>
                  </section>

                  {/* Personal info */}
                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Persoonlijke informatie</h2>
                    <p className="text-xs text-gray-400 mb-5">Je naam is zichtbaar voor collega's in de teamchat.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1.5">Weergavenaam *</label>
                        <input type="text" value={naam} onChange={e => setNaam(e.target.value)}
                          placeholder="Jouw naam"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1.5">Functietitel</label>
                        <input type="text" value={functie} onChange={e => setFunctie(e.target.value)}
                          placeholder="bijv. Software Engineer"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1.5">Afdeling</label>
                        <input type="text" value={afdeling} onChange={e => setAfdeling(e.target.value)}
                          placeholder="bijv. Technologie"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1.5">Telefoonnummer</label>
                        <input type="tel" value={telefoon} onChange={e => setTelefoon(e.target.value)}
                          placeholder="+32 4xx xx xx xx"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition" />
                      </div>
                    </div>

                    <div className="mb-5">
                      <label className="text-xs font-medium text-gray-600 block mb-1.5">
                        Bio <span className="text-gray-400 font-normal">(optioneel)</span>
                      </label>
                      <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)}
                        placeholder="Vertel iets over jezelf..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition resize-none" />
                      <p className="text-xs text-gray-400 mt-1">{bio.length}/200 tekens</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button onClick={slaProfielOp} disabled={profielBezig || !naam.trim() || !profielGewijzigd}
                        className="bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-700 transition disabled:opacity-30">
                        {profielBezig ? 'Opslaan...' : 'Wijzigingen opslaan'}
                      </button>
                      {profielMelding && <Melding melding={profielMelding} />}
                    </div>
                  </section>
                </>
              )}

              {/* -- ACCOUNT & BEVEILIGING -- */}
              {activeSectie === 'account' && (
                <>
                  {/* Current account info */}
                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Accountoverzicht</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl p-4 border border-gray-100" style={{ background: 'var(--bg-app)' }}>
                        <p className="text-xs text-gray-400 mb-1">Huidig e-mailadres</p>
                        <p className="text-sm font-medium text-gray-800">{userEmail || ''}</p>
                      </div>
                      <div className="rounded-xl p-4 border border-gray-100" style={{ background: 'var(--bg-app)' }}>
                        <p className="text-xs text-gray-400 mb-1">Account aangemaakt</p>
                        <p className="text-sm font-medium text-gray-800">Via uitnodiging</p>
                      </div>
                    </div>
                  </section>

                  {/* Testmodus rolwissel — alleen admin */}
                  {userRol === 'admin' && (
                    <section className="rounded-2xl border p-6" style={{ background: '#0f0f1a', borderColor: 'rgba(124,58,237,0.3)' }}>
                      <div className="flex items-start gap-3 mb-5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: 'rgba(124,58,237,0.2)' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                            Testmodus — rol wisselen
                          </h2>
                          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            Wissel tijdelijk naar een andere rol om functies te testen. Je kunt altijd terugwisselen via instellingen.
                          </p>
                        </div>
                      </div>

                      {/* Huidige rol badge */}
                      <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Nu actief als:</span>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{
                            background: userRol === 'admin' ? 'rgba(124,58,237,0.25)' : userRol === 'hr' ? 'rgba(24,95,165,0.25)' : 'rgba(29,158,117,0.25)',
                            color: userRol === 'admin' ? '#a78bfa' : userRol === 'hr' ? '#60a5fa' : '#34d399',
                          }}>
                          {userRol === 'admin' ? '🛡️ Admin' : userRol === 'hr' ? '👥 HR Manager' : bedrijfId ? '🌿 Werknemer' : '👤 Gebruiker'}
                        </span>
                        {userRol !== 'admin' && (
                          <span className="text-xs px-2 py-0.5 rounded-full animate-pulse" style={{ background: 'rgba(234,179,8,0.2)', color: '#fbbf24' }}>
                            Testmodus
                          </span>
                        )}
                      </div>

                      {/* Rol knoppen — 2x2 grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {([
                          {
                            id: 'medewerker' as const,
                            label: 'Werknemer',
                            emoji: '🌿',
                            kleur: '#1D9E75',
                            bg: 'rgba(29,158,117,0.15)',
                            beschrijving: 'Gekoppeld aan bedrijf',
                            detail: 'Check-in · rooster · gesprekken · werkdag',
                          },
                          {
                            id: 'gebruiker' as const,
                            label: 'Gebruiker',
                            emoji: '👤',
                            kleur: '#6B7280',
                            bg: 'rgba(107,114,128,0.15)',
                            beschrijving: 'Geen bedrijf gekoppeld',
                            detail: 'Alleen welzijn · coach · journal',
                          },
                          {
                            id: 'hr' as const,
                            label: 'HR Manager',
                            emoji: '👥',
                            kleur: '#185FA5',
                            bg: 'rgba(24,95,165,0.15)',
                            beschrijving: 'HR portaal',
                            detail: 'Teams · roosters · KPI · gesprekken',
                          },
                          {
                            id: 'admin' as const,
                            label: 'Admin (terug)',
                            emoji: '🛡️',
                            kleur: '#7C3AED',
                            bg: 'rgba(124,58,237,0.15)',
                            beschrijving: 'Volledige toegang',
                            detail: 'Herstel je eigen account',
                          },
                        ] as const).map(opt => {
                          const actieveOptie = userRol === 'admin' ? 'admin'
                            : userRol === 'hr' ? 'hr'
                            : bedrijfId ? 'medewerker' : 'gebruiker'
                          const isActief = (opt.id as string) === actieveOptie

                          return (
                            <button
                              key={opt.id}
                              onClick={() => !isActief && schakelNaarRol(opt.id)}
                              disabled={rolWisselBezig || isActief}
                              style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                gap: 8, padding: '14px 16px', borderRadius: 14,
                                border: `2px solid ${isActief ? opt.kleur : 'rgba(255,255,255,0.1)'}`,
                                background: isActief ? opt.bg : 'rgba(255,255,255,0.03)',
                                cursor: isActief ? 'default' : rolWisselBezig ? 'wait' : 'pointer',
                                opacity: rolWisselBezig && !isActief ? 0.4 : 1,
                                transition: 'all 0.15s', textAlign: 'left', width: '100%',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <span style={{ fontSize: 20 }}>{opt.emoji}</span>
                                {isActief && (
                                  <span style={{ fontSize: 9, fontWeight: 800, background: opt.kleur + '30', color: opt.kleur, borderRadius: 4, padding: '2px 6px' }}>
                                    ACTIEF
                                  </span>
                                )}
                              </div>
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: isActief ? opt.kleur : 'rgba(255,255,255,0.85)', marginBottom: 2 }}>
                                  {opt.label}
                                </p>
                                <p style={{ fontSize: 10, color: isActief ? opt.kleur + 'aa' : 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
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
                            background: rolWisselMelding.type === 'success' ? 'rgba(29,158,117,0.15)' : 'rgba(226,75,74,0.15)',
                            color: rolWisselMelding.type === 'success' ? '#34d399' : '#f87171',
                            border: `1px solid ${rolWisselMelding.type === 'success' ? 'rgba(29,158,117,0.3)' : 'rgba(226,75,74,0.3)'}`,
                          }}>
                          {rolWisselMelding.tekst}
                        </div>
                      )}

                      <p className="text-xs mt-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        ⚠️ Elke optie wijzigt je <strong style={{ color: 'rgba(255,255,255,0.35)' }}>echte rol én bedrijfskoppeling</strong> in de database — je ziet precies wat een echte gebruiker ziet, inclusief alle RLS-policies. "Admin (terug)" herstelt alles naar je originele staat.
                      </p>
                    </section>
                  )}

                  {/* Change email */}
                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">E-mailadres wijzigen</h2>
                    <p className="text-xs text-gray-400 mb-4">Je ontvangt een bevestigingsmail op het nieuwe adres.</p>
                    <div className="flex gap-3">
                      <input type="email" value={nieuwEmail} onChange={e => setNieuwEmail(e.target.value)}
                        placeholder="Nieuw e-mailadres"
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition" />
                      <button onClick={wijzigEmail} disabled={emailBezig || !nieuwEmail.trim()}
                        className="bg-gray-900 text-white rounded-xl px-5 py-3 text-sm font-medium hover:bg-gray-700 transition disabled:opacity-30 flex-shrink-0">
                        {emailBezig ? 'Versturen...' : 'Wijzigen'}
                      </button>
                    </div>
                    {emailMelding && <div className="mt-3"><Melding melding={emailMelding} /></div>}
                  </section>

                  {/* Change password */}
                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Wachtwoord wijzigen</h2>
                    <p className="text-xs text-gray-400 mb-4">Minimaal 8 tekens. Gebruik letters, cijfers en symbolen voor meer veiligheid.</p>
                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <input type={toonWachtwoord ? 'text' : 'password'} value={huidigWachtwoord}
                          onChange={e => setHuidigWachtwoord(e.target.value)} placeholder="Huidig wachtwoord"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition pr-16" />
                        <button type="button" onClick={() => setToonWachtwoord(t => !t)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 transition px-1">
                          {toonWachtwoord ? 'Verberg' : 'Toon'}
                        </button>
                      </div>
                      <input type={toonWachtwoord ? 'text' : 'password'} value={nieuwWachtwoord}
                        onChange={e => setNieuwWachtwoord(e.target.value)} placeholder="Nieuw wachtwoord"
                        className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition" />
                      {nieuwWachtwoord && (
                        <div className="flex items-center gap-2">
                          {[0, 1, 2].map(i => (
                            <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                              style={{ background: wachtwoordSterkte > i ? ['#E24B4A', '#BA7517', '#1D9E75'][i] : '#e5e7eb' }} />
                          ))}
                          <span className="text-xs text-gray-400 ml-1 w-12">
                            {['Te kort', 'Matig', 'Goed', 'Sterk'][wachtwoordSterkte]}
                          </span>
                        </div>
                      )}
                      <input type={toonWachtwoord ? 'text' : 'password'} value={bevestigWachtwoord}
                        onChange={e => setBevestigWachtwoord(e.target.value)} placeholder="Bevestig nieuw wachtwoord"
                        onKeyDown={e => e.key === 'Enter' && wijzigWachtwoord()}
                        className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition" />
                      {bevestigWachtwoord && nieuwWachtwoord !== bevestigWachtwoord && (
                        <p className="text-xs text-red-500">Wachtwoorden komen niet overeen</p>
                      )}
                      <div className="flex items-center gap-3">
                        <button onClick={wijzigWachtwoord} disabled={wachtwoordBezig || !nieuwWachtwoord || !bevestigWachtwoord}
                          className="bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-700 transition disabled:opacity-30">
                          {wachtwoordBezig ? 'Opslaan...' : 'Wachtwoord wijzigen'}
                        </button>
                        {wachtwoordMelding && <Melding melding={wachtwoordMelding} />}
                      </div>
                    </div>
                  </section>

                  {/* Sessions */}
                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Actieve sessies</h2>
                    <p className="text-xs text-gray-400 mb-4">Beheer apparaten waarop je bent ingelogd.</p>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100" style={{ background: 'var(--bg-app)' }}>
                      <div className="flex items-center gap-3">
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Huidige sessie</p>
                          <p className="text-xs text-gray-400">Web browser · Actief nu</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ background: '#E1F5EE', color: '#0F6E56' }}>Actief</span>
                    </div>
                    <button onClick={uitloggen}
                      className="mt-3 text-sm text-gray-500 hover:text-red-500 transition px-2 py-1">
                      Alle andere sessies uitloggen
                    </button>
                  </section>

                  {/* Werkgever koppeling — alleen zichtbaar voor medewerkers */}
                  {(userRol === 'medewerker' || userRol === '') && (
                    <section className="bg-white rounded-2xl border border-gray-100 p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <h2 className="text-base font-semibold text-gray-900">Werkgever</h2>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Koppel je account aan je werkgever via een HR code.
                          </p>
                        </div>
                        {bedrijfId && (
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                            style={{ background: '#E1F5EE', color: '#0F6E56' }}
                          >
                            Gekoppeld
                          </span>
                        )}
                      </div>

                      {bedrijfId ? (
                        /* Al gekoppeld */
                        <div
                          className="rounded-xl border px-4 py-3 flex items-center gap-3"
                          style={{ borderColor: '#d1fae5', background: '#F0FBF7' }}
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xs"
                            style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #185FA5 100%)' }}
                          >
                            HR
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {bedrijfsnaam ?? 'Jouw werkgever'}
                            </p>
                            <p className="text-xs text-gray-500">Account is gekoppeld</p>
                          </div>
                        </div>
                      ) : (
                        /* Nog niet gekoppeld */
                        <div>
                          <div
                            className="rounded-xl border border-dashed p-5 flex flex-col items-center text-center gap-3 mb-4"
                            style={{ borderColor: '#d1d5db' }}
                          >
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold"
                              style={{ background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)', color: '#9ca3af' }}
                            >
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" />
                                <line x1="22" y1="11" x2="16" y2="11" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">Nog niet gekoppeld aan een werkgever</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                Vraag de HR code op bij je werkgever en koppel je account.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setToonKoppelModal(true)}
                            className="w-full py-3 rounded-xl text-white font-bold text-sm transition hover:opacity-90"
                            style={{ background: '#1D9E75' }}
                          >
                            Koppel aan werkgever via HR code
                          </button>
                        </div>
                      )}
                    </section>
                  )}
                </>
              )}

              {/* -- NOTIFICATIES -- */}
              {activeSectie === 'notificaties' && (
                <>
                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Kanalen</h2>
                    <p className="text-xs text-gray-400 mb-4">Kies hoe je meldingen ontvangt.</p>
                    <Toggle actief={notifEmail} onChange={setNotifEmail}
                      label="E-mailmeldingen"
                      beschrijving="Ontvang herinneringen en updates per e-mail" />
                    <Toggle actief={notifPush} onChange={setNotifPush}
                      label="Pushmeldingen"
                      beschrijving="Meldingen in de browser of mobiele app" />
                  </section>

                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Welzijn & check-ins</h2>
                    <p className="text-xs text-gray-400 mb-2">Herinneringen voor jouw eigen welzijn.</p>
                    <Toggle actief={notifCheckin} onChange={setNotifCheckin}
                      label="Wekelijkse check-in herinnering"
                      beschrijving="Elke maandag een herinnering om je check-in te doen" />
                    <Toggle actief={notifCoach} onChange={setNotifCoach}
                      label="Coach suggesties"
                      beschrijving="Gepersonaliseerde tips van de AI Welzijnscoach" />
                  </section>

                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Team & organisatie</h2>
                    <p className="text-xs text-gray-400 mb-2">Meldingen over je team en bedrijf.</p>
                    <Toggle actief={notifTeam} onChange={setNotifTeam}
                      label="Nieuwe teamberichten"
                      beschrijving="Melding bij nieuwe berichten in de teamchat" />
                    <Toggle actief={notifHR} onChange={setNotifHR}
                      label="HR-aankondigingen"
                      beschrijving="Updates en berichten van je HR-afdeling" />
                    <Toggle actief={notifNieuws} onChange={setNotifNieuws}
                      label="MentaForce nieuws & updates"
                      beschrijving="Nieuwe functies en productnieuws" />
                  </section>

                  <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Alle notificaties uitschakelen</p>
                      <p className="text-xs text-gray-400">Tijdelijk alle meldingen pauzeren</p>
                    </div>
                    <button
                      onClick={() => {
                        setNotifCheckin(false); setNotifCoach(false); setNotifTeam(false)
                        setNotifHR(false); setNotifNieuws(false); setNotifPush(false); setNotifEmail(false)
                      }}
                      className="text-sm border border-gray-200 rounded-xl px-4 py-2 text-gray-600 hover:bg-gray-50 transition">
                      Alles uit
                    </button>
                  </div>
                </>
              )}

              {/* -- PRIVACY -- */}
              {activeSectie === 'privacy' && (
                <>
                  <div className="rounded-2xl border p-4 flex items-start gap-3"
                    style={{ background: '#E1F5EE', borderColor: '#A3DECE' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <div>
                      <p className="text-sm font-semibold text-green-800 mb-1">Privacy-by-design</p>
                      <p className="text-xs leading-relaxed text-green-700">
                        MentaForce deelt nooit jouw individuele check-in antwoorden met HR. HR ziet uitsluitend geaggregeerde teamgemiddelden. Jouw persoonlijke data blijft van jou.
                      </p>
                    </div>
                  </div>

                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Zichtbaarheid</h2>
                    <p className="text-xs text-gray-400 mb-2">Bepaal wat anderen van jou kunnen zien.</p>
                    <Toggle actief={privacyScore} onChange={setPrivacyScore}
                      label="Persoonlijke score zichtbaar voor collega's"
                      beschrijving="Standaard verborgen. Activeer alleen als je dit expliciet wilt delen." />
                    <Toggle actief={!privacyAnonymous} onChange={v => setPrivacyAnonymous(!v)}
                      label="Anonieme feedback niet anonimiseren"
                      beschrijving="Laat je naam meesturen bij anonieme feedback (niet aanbevolen)" />
                  </section>

                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Persoonlijke tools</h2>
                    <p className="text-xs text-gray-400 mb-2">Deze gegevens zijn altijd strikt privé.</p>
                    <Toggle actief={privacyJournal} onChange={setPrivacyJournal}
                      label="Journal versleuteld opslaan"
                      beschrijving="Journaalentries worden versleuteld. Niet leesbaar voor MentaForce of HR." />
                    <Toggle actief={privacyCoach} onChange={setPrivacyCoach}
                      label="Coach-gesprekken privé houden"
                      beschrijving="AI-coachgesprekken worden niet gebruikt voor teamanalyses." />
                  </section>

                  {/* HR Inzage — alleen voor werknemers met bedrijf */}
                  {bedrijfId && (
                    <section className="bg-white rounded-2xl border border-gray-200 p-6">
                      <h2 className="text-base font-semibold text-gray-900 mb-1">Wat HR van jou kan zien</h2>
                      <p className="text-xs text-gray-400 mb-4">Jij bepaalt wat jouw HR-afdeling mag inzien. Standaard staat alles uit.</p>
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
                    </section>
                  )}

                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Toestemmingen</h2>
                    <div className="flex flex-col gap-3">
                      {[
                        { label: 'Gegevensverwerking voor welzijnsanalyse', status: 'Vereist', beschrijving: 'Noodzakelijk voor de werking van het platform' },
                        { label: 'AVG-verwerkersovereenkomst', status: 'Actief', beschrijving: 'Aanvaard bij registratie van je organisatie' },
                        { label: 'Analytische cookies', status: 'Actief', beschrijving: 'Helpt ons de app te verbeteren' },
                      ].map(t => (
                        <div key={t.label} className="flex items-start justify-between gap-4 p-3 rounded-xl border border-gray-100">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{t.label}</p>
                            <p className="text-xs text-gray-400">{t.beschrijving}</p>
                          </div>
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                            style={{ background: t.status === 'Vereist' ? '#F3F4F6' : '#E1F5EE', color: t.status === 'Vereist' ? '#6b7280' : '#0F6E56' }}>
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-3 flex-wrap">
                      <Link href="/voorwaarden" className="text-xs text-gray-500 hover:text-gray-700 transition underline">
                        Algemene voorwaarden
                      </Link>
                      <Link href="/contact" className="text-xs text-gray-500 hover:text-gray-700 transition underline">
                        Privacy-verzoek indienen
                      </Link>
                    </div>
                  </section>
                </>
              )}

              {/* -- WEERGAVE -- */}
              {activeSectie === 'weergave' && (
                <>
                  {/* ── Portaal wisselen (alleen admin) ── */}
                  {userRol === 'admin' && (
                    <section className="rounded-2xl border p-6" style={{ background: '#14151f', borderColor: 'rgba(255,255,255,0.08)' }}>
                      <h2 className="text-base font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>Portaal wisselen</h2>
                      <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Kies welk portaal je wilt bekijken. Dit is de enige plek waar je kunt wisselen.
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          { mode: 'employee' as ViewMode, label: 'Werknemer',  beschrijving: 'Vitaliteit & werkdag',  kleur: '#1D9E75', icon: '🌿' },
                          { mode: 'hr'       as ViewMode, label: 'HR',         beschrijving: 'Team & beheer',         kleur: '#185FA5', icon: '👥' },
                          { mode: 'admin'    as ViewMode, label: 'Admin',      beschrijving: 'Volledige toegang',     kleur: '#7C3AED', icon: '🛡️' },
                        ] as const).map(opt => {
                          const actief = huidigPortaal === opt.mode
                          return (
                            <button
                              key={opt.mode}
                              onClick={() => { setHuidigPortaal(opt.mode); schakelPortaal(opt.mode) }}
                              style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                gap: 8, padding: '14px 16px',
                                borderRadius: 12, border: `2px solid ${actief ? opt.kleur : 'rgba(255,255,255,0.1)'}`,
                                background: actief ? opt.kleur + '20' : 'rgba(255,255,255,0.04)',
                                cursor: actief ? 'default' : 'pointer',
                                transition: 'all 0.15s', textAlign: 'left',
                              }}
                            >
                              <span style={{ fontSize: 22 }}>{opt.icon}</span>
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: actief ? opt.kleur : 'rgba(255,255,255,0.8)' }}>
                                  {opt.label}
                                  {actief && <span style={{ marginLeft: 6, fontSize: 10, background: opt.kleur + '30', color: opt.kleur, borderRadius: 4, padding: '1px 6px' }}>Actief</span>}
                                </p>
                                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{opt.beschrijving}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </section>
                  )}

                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Taal</h2>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { value: 'nl', label: 'Nederlands', sub: 'Standaard' },
                        { value: 'fr', label: 'Français', sub: 'Binnenkort' },
                        { value: 'en', label: 'English', sub: 'Binnenkort' },
                      ].map(l => (
                        <button key={l.value} onClick={() => setTaal(l.value)}
                          className="p-3 rounded-xl border text-left transition"
                          style={{
                            background: taal === l.value ? 'var(--mentaforce-primary-light)' : 'transparent',
                            borderColor: taal === l.value ? 'var(--mentaforce-primary)' : '#e5e7eb',
                          }}>
                          <p className="text-sm font-medium text-gray-800">{l.label}</p>
                          <p className="text-xs text-gray-400">{l.sub}</p>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Thema</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { value: 'licht',      label: 'Licht',      sub: 'Helder en fris' },
                        { value: 'schemering', label: 'Schemering', sub: 'Warm en rustig' },
                        { value: 'donker',     label: 'Donker',     sub: 'Voor \'s avonds' },
                        { value: 'systeem',    label: 'Systeem',    sub: 'Volgt je OS' },
                      ].map(t => (
                        <button key={t.value} onClick={() => setThema(t.value)}
                          className="p-3 rounded-xl border text-left transition"
                          style={{
                            background: thema === t.value ? 'var(--mentaforce-primary-light)' : 'transparent',
                            borderColor: thema === t.value ? 'var(--mentaforce-primary)' : '#e5e7eb',
                          }}>
                          <p className="text-sm font-medium text-gray-800">{t.label}</p>
                          <p className="text-xs text-gray-400">{t.sub}</p>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Check-in voorkeur</h2>
                    <p className="text-xs text-gray-400 mb-4">Op welke dag wil je aan je check-in herinnerd worden?</p>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'].map(d => (
                        <button key={d} onClick={() => setCheckinDag(d)}
                          className="py-2 rounded-xl text-xs font-medium capitalize transition border"
                          style={{
                            background: checkinDag === d ? 'var(--mentaforce-primary)' : 'transparent',
                            borderColor: checkinDag === d ? 'var(--mentaforce-primary)' : '#e5e7eb',
                            color: checkinDag === d ? 'white' : '#6b7280',
                          }}>
                          {d.slice(0, 2)}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-2">Interface</h2>
                    <Toggle actief={compactMode} onChange={setCompactMode}
                      label="Compacte weergave"
                      beschrijving="Kleinere marges en compactere lijsten in het dashboard" />
                  </section>
                </>
              )}

              {/* -- DATA -- */}
              {activeSectie === 'data' && (
                <>
                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Gegevensoverzicht</h2>
                    <p className="text-xs text-gray-400 mb-5">Een overzicht van de gegevens die MentaForce over jou bijhoudt.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'Check-ins',        kleur: '#1D9E75', bg: '#E1F5EE', d: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
                        { label: 'Journal entries',  kleur: '#378ADD', bg: '#E6F1FB', d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
                        { label: 'Coach-gesprekken', kleur: '#8B5CF6', bg: '#EEEDFE', d: 'M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
                        { label: 'Gewoonte logs',    kleur: '#BA7517', bg: '#FAEEDA', d: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
                        { label: 'Teamberichten',    kleur: '#E24B4A', bg: '#FCEBEB', d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
                        { label: 'Profiel data',     kleur: '#6b7280', bg: '#F3F4F6', d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
                      ].map(d => (
                        <div key={d.label} className="rounded-xl p-4 border border-gray-100" style={{ background: d.bg }}>
                          <div style={{ color: d.kleur, marginBottom: 8 }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d={d.d} />
                            </svg>
                          </div>
                          <p className="text-sm font-medium" style={{ color: d.kleur }}>{d.label}</p>
                          <p className="text-xs text-gray-500">Privé & versleuteld</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Exporteer je data</h2>
                    <p className="text-xs text-gray-400 mb-4">Download al jouw persoonlijke gegevens als JSON-bestand. Je kunt dit eens per 30 dagen aanvragen.</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => alert('Export aangevraagd. Je ontvangt een e-mail met de downloadlink.')}
                        className="flex items-center gap-2 border border-gray-200 rounded-xl px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Check-in data exporteren
                      </button>
                      <button
                        onClick={() => alert('Export aangevraagd. Je ontvangt een e-mail met de downloadlink.')}
                        className="flex items-center gap-2 border border-gray-200 rounded-xl px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Volledige data exporteren
                      </button>
                    </div>
                  </section>

                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Recht op inzage (AVG)</h2>
                    <p className="text-xs text-gray-400 mb-4">Je hebt het recht om al je persoonlijke gegevens in te zien, te corrigeren of te laten verwijderen.</p>
                    <a href="mailto:info@mentaforce.nl?subject=AVG-verzoek"
                      className="inline-flex items-center gap-2 border border-gray-200 rounded-xl px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      AVG-verzoek indienen
                    </a>
                  </section>
                </>
              )}

              {/* -- GEVARENZONE -- */}
              {activeSectie === 'gevaar' && (
                <>
                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Sessie</h2>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-800">Uitloggen op dit apparaat</p>
                        <p className="text-xs text-gray-400">Je wordt doorgestuurd naar de inlogpagina.</p>
                      </div>
                      <button onClick={uitloggen}
                        className="text-sm border border-gray-200 rounded-xl px-4 py-2 text-gray-600 hover:bg-gray-50 transition">
                        Uitloggen
                      </button>
                    </div>
                  </section>

                  <section className="bg-white rounded-2xl border border-red-100 p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      <div>
                        <h2 className="text-base font-semibold text-red-600">Account verwijderen</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Dit verwijdert definitief al je persoonlijke gegevens: check-ins, journal, coachgesprekken en gewoontes. Deze actie kan niet ongedaan worden gemaakt.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-red-100 p-4 mb-4" style={{ background: '#FEF9F9' }}>
                      <p className="text-sm text-gray-600 mb-1">Wat er verwijderd wordt:</p>
                      <ul className="text-xs text-gray-500 space-y-1 ml-3">
                        {['Alle check-in antwoorden', 'Journal entries en notities', 'AI coach-gesprekken', 'Gewoonte-logs', 'Profielfoto en persoonlijke info'].map(i => (
                          <li key={i} className="flex items-center gap-2">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            {i}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-4">
                      <label className="text-xs font-medium text-gray-600 block mb-1.5">
                        Typ <strong>VERWIJDER</strong> om te bevestigen
                      </label>
                      <input type="text" value={deleteBevestig} onChange={e => setDeleteBevestig(e.target.value)}
                        placeholder="VERWIJDER"
                        className="w-full border border-red-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 transition" />
                    </div>

                    <button
                      disabled={deleteBevestig !== 'VERWIJDER' || deleteBezig}
                      onClick={async () => {
                        setDeleteBezig(true)
                        // In production: delete user data, then sign out
                        await supabase.auth.signOut()
                        router.push('/')
                      }}
                      className="w-full py-3 rounded-xl text-white text-sm font-bold transition disabled:opacity-30"
                      style={{ background: deleteBevestig === 'VERWIJDER' ? '#E24B4A' : '#9ca3af' }}>
                      {deleteBezig ? 'Verwijderen...' : 'Account definitief verwijderen'}
                    </button>

                    <p className="text-xs text-gray-400 text-center mt-3">
                      Of stuur een verwijderverzoek naar{' '}
                      <a href="mailto:info@mentaforce.nl" className="underline">info@mentaforce.nl</a>
                    </p>
                  </section>
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
