'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, MessageCircle, Mail, ChevronLeft, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { Avatar } from '@/components/Avatar'


type Bericht = {
  id: string
  user_id: string
  inhoud: string
  aangemaakt_op: string
}

type DmBericht = {
  id: string
  gesprek_id: string
  zender_id: string
  inhoud: string
  aangemaakt_op: string
}

type Profiel = {
  id: string
  naam: string
  rol: string
  avatar_url: string | null
}

function formatTijd(iso: string) {
  const d = new Date(iso)
  const nu = new Date()
  const gister = new Date(nu)
  gister.setDate(nu.getDate() - 1)
  const t = d.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === nu.toDateString()) return t
  if (d.toDateString() === gister.toDateString()) return `gisteren ${t}`
  return d.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' }) + ` ${t}`
}

function isDagScheiding(a: string, b: string) {
  return new Date(a).toDateString() !== new Date(b).toDateString()
}

function dagLabel(iso: string) {
  const d = new Date(iso)
  const nu = new Date()
  const gister = new Date(nu)
  gister.setDate(nu.getDate() - 1)
  if (d.toDateString() === nu.toDateString()) return 'Vandaag'
  if (d.toDateString() === gister.toDateString()) return 'Gisteren'
  return d.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function Chat() {
  const router = useRouter()

  const [ikId, setIkId] = useState<string | null>(null)
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)
  const [profielenMap, setProfielenMap] = useState<Map<string, Profiel>>(new Map())
  const [onlineSet, setOnlineSet] = useState<Set<string>>(new Set())
  const [laden, setLaden] = useState(true)

  // 'team' or a userId for DM
  const [actieveChat, setActieveChat] = useState<'team' | string>('team')
  // Mobile: true = show sidebar, false = show conversation
  const [mobielZijbalk, setMobielZijbalk] = useState(true)

  // Group chat
  const [teamBerichten, setTeamBerichten] = useState<Bericht[]>([])
  const [teamInput, setTeamInput] = useState('')
  const [teamVerzenden, setTeamVerzenden] = useState(false)

  // DM
  const [dmBerichten, setDmBerichten] = useState<DmBericht[]>([])
  const [gesprekId, setGesprekId] = useState<string | null>(null)
  const [dmInput, setDmInput] = useState('')
  const [dmVerzenden, setDmVerzenden] = useState(false)
  const [dmLaden, setDmLaden] = useState(false)

  const [hoverId, setHoverId] = useState<string | null>(null)

  const onderRef = useRef<HTMLDivElement>(null)
  const teamInputRef = useRef<HTMLTextAreaElement>(null)
  const dmInputRef = useRef<HTMLTextAreaElement>(null)
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const gesprekIdRef = useRef<string | null>(null)

  // Keep ref in sync so realtime handler isn't stale
  useEffect(() => { gesprekIdRef.current = gesprekId }, [gesprekId])

  // Init
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setIkId(user.id)

      const { data: mijnProfiel } = await supabase
        .from('profiles')
        .select('bedrijf_id')
        .eq('id', user.id)
        .single()

      if (!mijnProfiel?.bedrijf_id) { setLaden(false); return }
      const bid = mijnProfiel.bedrijf_id
      setBedrijfId(bid)

      const { data: profielen } = await supabase
        .from('profiles')
        .select('id, naam, rol, avatar_url')
        .eq('bedrijf_id', bid)

      const map = new Map<string, Profiel>()
      for (const p of profielen ?? []) map.set(p.id, p)
      setProfielenMap(map)

      const { data: msgs } = await supabase
        .from('berichten')
        .select('id, user_id, inhoud, aangemaakt_op')
        .eq('bedrijf_id', bid)
        .order('aangemaakt_op', { ascending: true })
        .limit(80)

      setTeamBerichten(msgs ?? [])
      setLaden(false)
    }
    init()
  }, [router])

  // Presence
  useEffect(() => {
    if (!bedrijfId || !ikId) return
    const ch = supabase.channel(`presence-${bedrijfId}`, {
      config: { presence: { key: ikId } },
    })
    ch.on('presence', { event: 'sync' }, () => {
      setOnlineSet(new Set(Object.keys(ch.presenceState())))
    })
    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await ch.track({ user_id: ikId })
    })
    presenceChannelRef.current = ch
    return () => { supabase.removeChannel(ch) }
  }, [bedrijfId, ikId])

  // Group chat realtime
  useEffect(() => {
    if (!bedrijfId) return
    const channel = supabase
      .channel(`berichten:${bedrijfId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'berichten', filter: `bedrijf_id=eq.${bedrijfId}` },
        async (payload) => {
          const nieuw = payload.new as Bericht
          if (!profielenMap.has(nieuw.user_id)) {
            const { data: p } = await supabase
              .from('profiles').select('id, naam, rol, avatar_url').eq('id', nieuw.user_id).single()
            if (p) setProfielenMap(prev => new Map(prev).set(p.id, p))
          }
          setTeamBerichten(prev => prev.some(b => b.id === nieuw.id) ? prev : [...prev, nieuw])
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [bedrijfId, profielenMap])

  // DM realtime — subscribes once per session, uses ref to check active gesprek
  useEffect(() => {
    if (!bedrijfId || !ikId) return
    const channel = supabase
      .channel(`dm:${bedrijfId}:${ikId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dm_berichten', filter: `bedrijf_id=eq.${bedrijfId}` },
        (payload) => {
          const nieuw = payload.new as DmBericht
          if (nieuw.gesprek_id === gesprekIdRef.current) {
            setDmBerichten(prev => prev.some(b => b.id === nieuw.id) ? prev : [...prev, nieuw])
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [bedrijfId, ikId])

  // Scroll to bottom on new messages
  useEffect(() => {
    onderRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [teamBerichten, dmBerichten])

  async function openDm(partnerId: string) {
    if (!ikId || !bedrijfId) return
    setActieveChat(partnerId)
    setMobielZijbalk(false)
    setDmLaden(true)
    setDmBerichten([])
    setGesprekId(null)

    const [d1, d2] = [ikId, partnerId].sort()

    const { data: bestaand } = await supabase
      .from('gesprekken')
      .select('id')
      .eq('deelnemer1_id', d1)
      .eq('deelnemer2_id', d2)
      .single()

    if (bestaand) {
      setGesprekId(bestaand.id)
      const { data: msgs } = await supabase
        .from('dm_berichten')
        .select('id, gesprek_id, zender_id, inhoud, aangemaakt_op')
        .eq('gesprek_id', bestaand.id)
        .order('aangemaakt_op', { ascending: true })
        .limit(80)
      setDmBerichten(msgs ?? [])
    }

    setDmLaden(false)
  }

  async function verstuurTeam() {
    const tekst = teamInput.trim()
    if (!tekst || !bedrijfId || !ikId || teamVerzenden) return
    setTeamVerzenden(true)
    setTeamInput('')
    if (teamInputRef.current) teamInputRef.current.style.height = 'auto'

    const optId = `opt-${Date.now()}`
    const nu = new Date().toISOString()
    setTeamBerichten(prev => [...prev, { id: optId, user_id: ikId, inhoud: tekst, aangemaakt_op: nu }])

    const { error } = await supabase.from('berichten').insert({ bedrijf_id: bedrijfId, user_id: ikId, inhoud: tekst })
    if (error) {
      setTeamBerichten(prev => prev.filter(b => b.id !== optId))
      setTeamInput(tekst)
    }
    setTeamVerzenden(false)
    teamInputRef.current?.focus()
  }

  async function verstuurDm() {
    const tekst = dmInput.trim()
    if (!tekst || !ikId || !bedrijfId || dmVerzenden || actieveChat === 'team') return
    const partnerId = actieveChat
    setDmVerzenden(true)
    setDmInput('')
    if (dmInputRef.current) dmInputRef.current.style.height = 'auto'

    let gId = gesprekId

    if (!gId) {
      const [d1, d2] = [ikId, partnerId].sort()
      const { data: nieuwGesprek, error: gErr } = await supabase
        .from('gesprekken')
        .insert({ deelnemer1_id: d1, deelnemer2_id: d2, bedrijf_id: bedrijfId })
        .select('id')
        .single()

      if (gErr || !nieuwGesprek) {
        // Race condition — gesprek may already exist
        const { data: bestaand } = await supabase
          .from('gesprekken').select('id').eq('deelnemer1_id', d1).eq('deelnemer2_id', d2).single()
        if (bestaand) gId = bestaand.id
        else { setDmVerzenden(false); setDmInput(tekst); return }
      } else {
        gId = nieuwGesprek.id
      }
      setGesprekId(gId)
    }

    const optId = `opt-${Date.now()}`
    const nu = new Date().toISOString()
    setDmBerichten(prev => [...prev, { id: optId, gesprek_id: gId!, zender_id: ikId, inhoud: tekst, aangemaakt_op: nu }])

    const { error } = await supabase
      .from('dm_berichten')
      .insert({ gesprek_id: gId, bedrijf_id: bedrijfId, zender_id: ikId, inhoud: tekst })

    if (error) {
      setDmBerichten(prev => prev.filter(b => b.id !== optId))
      setDmInput(tekst)
    }
    setDmVerzenden(false)
    dmInputRef.current?.focus()
  }

  const mijnProfiel = ikId ? profielenMap.get(ikId) : undefined
  const partnerProfiel = actieveChat !== 'team' ? profielenMap.get(actieveChat) : undefined
  const onlineAanwezig = [...onlineSet].filter(id => id !== ikId)
  const isTeam = actieveChat === 'team'

  const teamleden = [...profielenMap.values()]
    .filter(p => p.id !== ikId)
    .sort((a, b) => {
      const ao = onlineSet.has(a.id) ? 0 : 1
      const bo = onlineSet.has(b.id) ? 0 : 1
      if (ao !== bo) return ao - bo
      return a.naam.localeCompare(b.naam, 'nl')
    })

  // Shared bubble renderer
  function renderBubbles(
    berichten: Array<{ id: string; aangemaakt_op: string; inhoud: string }>,
    getUserId: (b: { id: string; aangemaakt_op: string; inhoud: string }) => string,
  ) {
    return berichten.map((b, i) => {
      const userId = getUserId(b)
      const isIk = userId === ikId
      const profiel = profielenMap.get(userId)
      const naam = profiel?.naam ?? 'Onbekend'
      const avatarUrl = profiel?.avatar_url ?? null
      const isOnline = onlineSet.has(userId)
      const isOptimistic = b.id.startsWith('opt-')

      const vorigeZelfde = i > 0 && getUserId(berichten[i - 1]) === userId
      const volgendeZelfde = i < berichten.length - 1 && getUserId(berichten[i + 1]) === userId
      const showDag = i === 0 || isDagScheiding(berichten[i - 1].aangemaakt_op, b.aangemaakt_op)
      const showHeader = !vorigeZelfde || showDag

      const r = 18; const rS = 4
      const borderRadius = isIk
        ? `${r}px ${vorigeZelfde && !showDag ? rS : r}px ${volgendeZelfde ? rS : r}px ${r}px`
        : `${vorigeZelfde && !showDag ? rS : r}px ${r}px ${r}px ${volgendeZelfde ? rS : r}px`

      return (
        <div key={b.id}>
          {showDag && (
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ color: 'var(--text-3)', background: 'var(--bg-subtle)' }}>{dagLabel(b.aangemaakt_op)}</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>
          )}
          <div
            className={`flex items-end gap-2 ${isIk ? 'flex-row-reverse' : 'flex-row'} ${showHeader ? 'mt-3' : 'mt-0.5'}`}
            onMouseEnter={() => setHoverId(b.id)}
            onMouseLeave={() => setHoverId(null)}
          >
            <div className="w-8 flex-shrink-0 flex justify-center items-end">
              {!volgendeZelfde && <Avatar naam={naam} avatarUrl={avatarUrl} size={32} online={isOnline} />}
            </div>
            <div className={`flex flex-col gap-0.5 max-w-[70%] ${isIk ? 'items-end' : 'items-start'}`}>
              {showHeader && !isIk && (
                <span className="text-xs font-semibold px-1 mb-0.5" style={{ color: 'var(--text-2)' }}>{naam}</span>
              )}
              <div
                className="px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap"
                style={{
                  background: isIk ? 'var(--mentaforce-primary)' : 'var(--bg-card)',
                  color: isIk ? 'var(--bg-app)' : 'var(--text-1)',
                  borderRadius,
                  boxShadow: isIk ? 'none' : 'var(--shadow-card)',
                  opacity: isOptimistic ? 0.55 : 1,
                  transition: 'opacity 0.15s',
                  maxWidth: '100%',
                  wordBreak: 'break-word',
                }}
              >
                {b.inhoud}
              </div>
              {hoverId === b.id && (
                <span className="text-xs px-1" style={{ color: 'var(--text-3)' }}>{formatTijd(b.aangemaakt_op)}</span>
              )}
            </div>
            <div className="w-8 flex-shrink-0" />
          </div>
        </div>
      )
    })
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex overflow-hidden" style={{ maxWidth: 1100, width: '100%', margin: '0 auto' }}>

        {/* Sidebar */}
        <div
          className="flex-shrink-0 flex flex-col"
          style={{
            width: 280,
            display: mobielZijbalk ? 'flex' : undefined,
            background: 'var(--bg-card)',
            borderRight: '1px solid var(--border)',
          }}
          // On desktop always show; on mobile toggle
        >
          <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Berichten</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Groepschat entry */}
            <button
              onClick={() => { setActieveChat('team'); setMobielZijbalk(false) }}
              className="w-full flex items-center gap-3 px-4 py-3 transition text-left"
              style={{ background: actieveChat === 'team' ? 'var(--mentaforce-primary-light)' : 'transparent' }}
              onMouseEnter={e => { if (actieveChat !== 'team') (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = actieveChat === 'team' ? 'var(--mentaforce-primary-light)' : 'transparent' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)' }}
              >
                <Users size={20} aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>Teamchat</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
                  {onlineAanwezig.length > 0 ? `${onlineAanwezig.length + 1} online` : `${profielenMap.size} leden`}
                </p>
              </div>
            </button>

            {/* Divider */}
            <div className="px-4 pt-4 pb-1">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Directe berichten</p>
            </div>

            {/* Team members */}
            {laden ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--mentaforce-primary)' }} />
              </div>
            ) : teamleden.map(lid => (
              <button
                key={lid.id}
                onClick={() => openDm(lid.id)}
                className="w-full flex items-center gap-3 px-4 py-3 transition text-left"
                style={{ background: actieveChat === lid.id ? 'var(--mentaforce-primary-light)' : 'transparent' }}
                onMouseEnter={e => { if (actieveChat !== lid.id) (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = actieveChat === lid.id ? 'var(--mentaforce-primary-light)' : 'transparent' }}
              >
                <Avatar naam={lid.naam} avatarUrl={lid.avatar_url} size={40} online={onlineSet.has(lid.id)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{lid.naam}</p>
                  <p className="text-xs truncate" style={{ color: onlineSet.has(lid.id) ? 'var(--mf-green)' : 'var(--text-3)' }}>
                    {onlineSet.has(lid.id) ? 'Online' : 'Offline'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation panel */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>

          {/* Conversation header */}
          <div className="px-5 py-3.5 flex items-center gap-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            {/* Mobile back */}
            <button
              onClick={() => setMobielZijbalk(true)}
              aria-label="Terug naar gesprekken"
              className="sm:hidden p-1 -ml-1 transition"
              style={{ color: 'var(--text-3)' }}
            >
              <ChevronLeft size={20} aria-hidden />
            </button>

            {isTeam ? (
              <>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)' }}>
                  <Users size={20} aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Teamchat</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                    {onlineAanwezig.length > 0 ? `${onlineAanwezig.length + 1} online` : `${profielenMap.size} leden`}
                  </p>
                </div>
                {onlineAanwezig.length > 0 && (
                  <div className="ml-auto flex -space-x-2">
                    {[ikId, ...onlineAanwezig].slice(0, 5).map(id => {
                      if (!id) return null
                      const p = profielenMap.get(id)
                      if (!p) return null
                      return (
                        <div key={id} title={id === ikId ? 'Jij' : p.naam} className="rounded-full" style={{ boxShadow: '0 0 0 2px var(--bg-card)' }}>
                          <Avatar naam={p.naam} avatarUrl={p.avatar_url} size={28} online />
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            ) : partnerProfiel ? (
              <>
                <Avatar naam={partnerProfiel.naam} avatarUrl={partnerProfiel.avatar_url} size={40} online={onlineSet.has(partnerProfiel.id)} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{partnerProfiel.naam}</p>
                  <p className="text-xs font-medium" style={{ color: onlineSet.has(partnerProfiel.id) ? 'var(--mf-green)' : 'var(--text-3)' }}>
                    {onlineSet.has(partnerProfiel.id) ? 'Online' : 'Offline'}
                  </p>
                </div>
              </>
            ) : null}
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-0.5">
            {laden || (!isTeam && dmLaden) ? (
              <div className="flex justify-center items-center h-full">
                <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--mentaforce-primary)' }} />
              </div>
            ) : isTeam && teamBerichten.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
                    <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--mentaforce-primary) 18%, transparent) 0%, transparent 70%)' }} />
                  </div>
                  <MessageCircle size={30} aria-hidden style={{ position: 'relative', zIndex: 1 }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>Nog geen berichten</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>Stuur het eerste bericht naar je team!</p>
              </div>
            ) : !isTeam && dmBerichten.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
                    <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--mentaforce-primary) 18%, transparent) 0%, transparent 70%)' }} />
                  </div>
                  <Mail size={30} aria-hidden style={{ position: 'relative', zIndex: 1 }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>Begin een gesprek</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>Stuur {partnerProfiel?.naam ?? 'een collega'} een bericht</p>
              </div>
            ) : isTeam ? (
              renderBubbles(teamBerichten, b => (b as Bericht).user_id)
            ) : (
              renderBubbles(dmBerichten, b => (b as DmBericht).zender_id)
            )}
            <div ref={onderRef} />
          </div>

          {/* Input bar */}
          <div className="px-4 py-3 flex-shrink-0" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
            <div className="flex items-end gap-2">
              {mijnProfiel && (
                <Avatar naam={mijnProfiel.naam} avatarUrl={mijnProfiel.avatar_url} size={36} className="mb-0.5" />
              )}
              <div className="flex-1 flex items-end gap-2 rounded-2xl px-3 py-2" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                <textarea
                  ref={isTeam ? teamInputRef : dmInputRef}
                  rows={1}
                  value={isTeam ? teamInput : dmInput}
                  onChange={e => {
                    if (isTeam) setTeamInput(e.target.value)
                    else setDmInput(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (isTeam) verstuurTeam()
                      else verstuurDm()
                    }
                  }}
                  placeholder={isTeam ? 'Stuur een bericht…' : `Stuur ${partnerProfiel?.naam ?? 'een bericht'}…`}
                  className="flex-1 bg-transparent text-sm outline-none resize-none leading-relaxed"
                  style={{ minHeight: 24, maxHeight: 120, color: 'var(--text-1)' }}
                />
                <button
                  onClick={isTeam ? verstuurTeam : verstuurDm}
                  disabled={isTeam ? (!teamInput.trim() || teamVerzenden) : (!dmInput.trim() || dmVerzenden)}
                  aria-label="Bericht verzenden"
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition disabled:opacity-30"
                  style={{ background: (isTeam ? teamInput.trim() : dmInput.trim()) ? 'var(--mentaforce-primary)' : 'var(--border)' }}
                >
                  <Send
                    size={14}
                    aria-hidden
                    style={{ color: (isTeam ? teamInput.trim() : dmInput.trim()) ? 'var(--bg-app)' : 'var(--text-3)' }}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
