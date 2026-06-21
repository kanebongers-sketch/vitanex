'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const FF = '#F5A623', DARK = '#0c0c11', CARD = '#131318', CARD2 = '#1a1a22'
const BORDER = 'rgba(255,255,255,0.06)', TEXT = 'rgba(255,255,255,0.88)', MUTED = 'rgba(255,255,255,0.35)'
const GREEN = 'var(--mf-green)', RED = 'var(--mf-red)'

const R_COLORS = ['var(--mf-amber)','var(--mf-orange)','var(--mf-red)']
const R_NAMEN  = ['Eerste contact','Follow-up','Afsluitend']

const STATUS_STYLE: Record<string, {bg:string;color:string;label:string}> = {
  wacht:             {bg:'#1e293b', color:'#94A3B8', label:'⏳ Wacht'},
  goedgekeurd:       {bg:'#14532d', color:GREEN,     label:'✅ Goed'},
  overgeslagen:      {bg:'#111',    color:'var(--text-2)',  label:'❌ Skip'},
  email_klaar:       {bg:'#1e1a2e', color:'#818CF8',  label:'📧 Email klaar'},
  email_goedgekeurd: {bg:'#064e3b', color:'#6EE7B7',  label:'✅ Email goed'},
  email_overgeslagen:{bg:'#111',    color:'var(--text-2)',  label:'❌ Email skip'},
  verstuurd:         {bg:'#14532d', color:GREEN,      label:'📤 Verstuurd'},
  gepland:           {bg:'#111',    color:'var(--text-2)',   label:'📅 Gepland'},
}

type Contact = {
  id:string; naam:string; email:string; stad:string; sector:string; score:number
  r1_status:string; r2_status:string; r3_status:string
  r1_onderwerp?:string; r1_body?:string
  r2_onderwerp?:string; r2_body?:string
  r3_onderwerp?:string; r3_body?:string
  op_zwarte_lijst?: boolean
}
type Batch = {
  id:string; naam:string; start_datum:string; ronde_2_datum:string; ronde_3_datum:string; status:string
  contacten?: Contact[]
}
type EditState = {
  id: string
  bodyKey: string; bodyVal: string
  onderwerpKey: string; onderwerpVal: string
}

export default function AgentPage() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [geladen, setGeladen] = useState(false)
  const [toegang, setToegang] = useState(false)
  const [activeBatch, setActiveBatch] = useState<string|null>(null)
  const [activeRonde, setActiveRonde] = useState(1)
  const [expandedBody, setExpandedBody] = useState<string|null>(null)
  const [approvingAll, setApprovingAll] = useState(false)
  const [nu, setNu] = useState(new Date())
  const [edit, setEdit] = useState<EditState|null>(null)
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState<string|null>(null)
  const [zoekBezig, setZoekBezig] = useState(false)
  const [zoekMelding, setZoekMelding] = useState<{ok:boolean;tekst:string}|null>(null)
  const [zoekTerm, setZoekTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('actie')

  useEffect(() => {
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }
      if (user.email?.toLowerCase() !== 'kanebongers@gmail.com') {
        window.location.href = '/home'; return
      }
      setToegang(true)
    })
  }, [])

  // Haalt batches+contacten op; state wordt in .then() gezet (geen setState
  // in de effect-body) en activeBatch via functionele update — geen cascade
  const haalBatches = useCallback(async (): Promise<Batch[]> => {
    const {data: bs} = await sb.from('agent_batches').select('id, naam, aangemaakt_op, status, totaal, verwerkt, actief, start_datum, ronde_2_datum, ronde_3_datum').order('aangemaakt_op', {ascending:false}).limit(10)
    if (!bs) return []
    const batchIds = bs.map(b => b.id)
    const {data: alleCs} = await sb.from('agent_contacten').select('id, batch_id, naam, bedrijf, email, telefoon, score, notities, r1_status, r2_status, r3_status, laatste_actie, aangemaakt_op, stad, sector').in('batch_id', batchIds).order('score', {ascending:false})
    const csPerBatch = new Map<string, typeof alleCs>()
    for (const c of alleCs ?? []) {
      const arr = csPerBatch.get(c.batch_id) ?? []
      arr.push(c)
      csPerBatch.set(c.batch_id, arr)
    }
    return bs.map(b => ({...b, contacten: csPerBatch.get(b.id) ?? []})) as Batch[]
  }, [])

  const laad = useCallback(() => {
    haalBatches().then(bs => {
      setBatches(bs)
      setActiveBatch(prev => prev ?? (bs.length > 0 ? bs[0].id : null))
      setGeladen(true)
      setNu(new Date())
    })
  }, [haalBatches])

  useEffect(()=>{ laad() }, [laad])
  useEffect(()=>{ const t=setInterval(laad,15000); return()=>clearInterval(t) }, [laad])

  const batch = batches.find(b => b.id === activeBatch)
  const alleContacten = batch?.contacten ?? []
  const vandaag = new Date().toISOString().split('T')[0]
  const totaal = alleContacten.length || 1

  // Filter logic
  const contacten = (() => {
    const col = `r${activeRonde}_status` as keyof Contact
    let result = alleContacten
    // Status filter
    if (filterStatus === 'actie') {
      result = result.filter(c => {
        const s = (c[col] as string) || 'gepland'
        return ['wacht','email_klaar','email_goedgekeurd'].includes(s)
      })
    } else if (filterStatus !== 'alle') {
      result = result.filter(c => (c[col] as string) === filterStatus)
    }
    // Zoekterm filter
    if (zoekTerm.trim()) {
      const term = zoekTerm.toLowerCase()
      result = result.filter(c =>
        c.naam.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.stad.toLowerCase().includes(term) ||
        c.sector.toLowerCase().includes(term)
      )
    }
    return result
  })()

  const rStats = (r:number) => {
    const col = `r${r}_status` as keyof Contact
    return {
      wacht:     alleContacten.filter(c => c[col] === 'wacht').length,
      goed:      alleContacten.filter(c => c[col] === 'goedgekeurd').length,
      verstuurd: alleContacten.filter(c => c[col] === 'verstuurd').length,
      klaar:     alleContacten.filter(c => c[col] === 'email_goedgekeurd').length,
      skip:      alleContacten.filter(c => ['overgeslagen','email_overgeslagen'].includes(c[col] as string)).length,
    }
  }

  // Stats voor de actieve batch
  const batchStats = (() => {
    if (!batch) return null
    const col = `r${activeRonde}_status` as keyof Contact
    const verstuurd = alleContacten.filter(c => c[col] === 'verstuurd').length
    const teReviewen = alleContacten.filter(c => {
      const s = (c[col] as string) || 'gepland'
      return ['wacht','email_klaar'].includes(s)
    }).length
    const pct = alleContacten.length ? Math.round(verstuurd / alleContacten.length * 100) : 0
    const zwarteLijst = alleContacten.filter(c => c.op_zwarte_lijst).length
    return { verstuurd, teReviewen, pct, zwarteLijst, totaal: alleContacten.length }
  })()

  async function keurGoed(contactId: string, ronde: number, type: 'bedrijf'|'email') {
    const val = type === 'bedrijf' ? 'goedgekeurd' : 'email_goedgekeurd'
    await sb.from('agent_contacten').update({[`r${ronde}_status`]: val}).eq('id', contactId)
    laad()
  }

  async function slaOver(contactId: string, ronde: number, type: 'bedrijf'|'email') {
    const val = type === 'bedrijf' ? 'overgeslagen' : 'email_overgeslagen'
    await sb.from('agent_contacten').update({[`r${ronde}_status`]: val}).eq('id', contactId)
    laad()
  }

  async function slaEmailOp() {
    if (!edit) return
    setSaving(true)
    await sb.from('agent_contacten').update({
      [edit.bodyKey]: edit.bodyVal,
      [edit.onderwerpKey]: edit.onderwerpVal,
    }).eq('id', edit.id)
    setSaving(false)
    setEdit(null)
    laad()
  }

  async function regenereerEmail(contactId: string, ronde: number) {
    setRegenerating(contactId)
    try {
      const { error } = await sb.from('agent_contacten').update({
        [`r${ronde}_body`]: '',
        [`r${ronde}_onderwerp`]: '',
        [`r${ronde}_status`]: 'goedgekeurd',
      }).eq('id', contactId)

      if (error) {
        console.error('Supabase fout:', error)
        setRegenerating(null)
        return
      }

      await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actie: 'trigger_workflow', stap: 'preview' }),
      })

      setExpandedBody(null)
      setEdit(null)
      setZoekMelding({ ok: true, tekst: '🔄 Email wordt opnieuw gegenereerd door de agent — duurt ~1 min.' })
      setTimeout(() => { setZoekMelding(null); laad() }, 8000)
    } catch (e) {
      console.error(e)
    }
    setRegenerating(null)
    laad()
  }

  // Batch update met .in() voor performance
  async function keurAllesGoed(ronde: number, type: 'bedrijf'|'email') {
    setApprovingAll(true)
    const col = `r${ronde}_status`
    const huidige = type === 'bedrijf' ? 'wacht' : 'email_klaar'
    const nieuw   = type === 'bedrijf' ? 'goedgekeurd' : 'email_goedgekeurd'
    const ids = alleContacten.filter(c => c[col as 'r1_status' | 'r2_status' | 'r3_status'] === huidige).map(c => c.id)
    if (ids.length > 0) {
      await sb.from('agent_contacten').update({[col]: nieuw}).in('id', ids)
    }
    setApprovingAll(false)
    laad()
  }

  async function voegBedrijvenToe() {
    setZoekBezig(true)
    setZoekMelding(null)
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ actie: 'trigger_workflow', stap: 'zoek' }),
      })
      const data = await res.json()
      if (data.ok) {
        setZoekMelding({ok:true, tekst:'✅ Agent gestart! Nieuwe bedrijven worden gezocht. Pagina vernieuwt automatisch.'})
        setTimeout(()=>{ setZoekMelding(null); laad() }, 5000)
      } else {
        setZoekMelding({ok:false, tekst:`❌ Fout: ${data.error ?? 'Onbekende fout'}`})
      }
    } catch {
      setZoekMelding({ok:false, tekst:'❌ Kan agent niet bereiken'})
    }
    setZoekBezig(false)
  }

  const wisselRonde = (r: number) => {
    if (edit) {
      if (!confirm('Je hebt niet-opgeslagen wijzigingen. Ronde wisselen en annuleren?')) return
      setEdit(null)
      setExpandedBody(null)
    }
    setActiveRonde(r)
    setFilterStatus('actie')
    setZoekTerm('')
  }

  const formatDatum = (d: string) => d ? new Date(d).toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short'}) : '—'

  if (!toegang) return (
    <div style={{minHeight:'100vh',background:DARK,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:32,height:32,borderRadius:'50%',border:'3px solid #333',borderTopColor:FF,animation:'spin 0.8s linear infinite'}} />
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:DARK,color:TEXT,fontFamily:'system-ui,-apple-system,sans-serif'}}>

      {/* HEADER */}
      <header style={{height:54,borderBottom:`1px solid ${BORDER}`,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',position:'sticky',top:0,background:DARK,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,background:FF,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>🤖</div>
          <div>
            <p style={{fontWeight:700,fontSize:13,color:'white',lineHeight:1}}>Fit Factory Agent</p>
            <p style={{fontSize:10,color:MUTED,marginTop:2}}>3 rondes · 2 dagen apart · Eersel 15km</p>
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:GREEN,boxShadow:'0 0 5px #22C55E'}}/>
          <span style={{fontSize:10,color:MUTED}}>{nu.toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})}</span>
          <button
            onClick={voegBedrijvenToe}
            disabled={zoekBezig}
            style={{background:zoekBezig?'rgba(245,166,35,0.05)':'rgba(245,166,35,0.12)',border:`1px solid ${FF}40`,borderRadius:6,color:zoekBezig?MUTED:FF,fontSize:11,padding:'5px 12px',cursor:zoekBezig?'not-allowed':'pointer',fontWeight:600,transition:'all 0.2s'}}
          >
            {zoekBezig ? '⏳ Zoeken...' : '+ 10 bedrijven'}
          </button>
          <button onClick={laad} style={{background:CARD2,border:`1px solid ${BORDER}`,borderRadius:6,color:MUTED,fontSize:11,padding:'5px 10px',cursor:'pointer'}}>↻</button>
        </div>
      </header>

      {/* Melding banner */}
      {zoekMelding && (
        <div style={{padding:'10px 24px',background:zoekMelding.ok?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)',borderBottom:`1px solid ${zoekMelding.ok?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}`,fontSize:12,color:zoekMelding.ok?GREEN:RED,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>{zoekMelding.tekst}</span>
          <button onClick={()=>setZoekMelding(null)} style={{background:'none',border:'none',color:MUTED,cursor:'pointer',fontSize:14}}>✕</button>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'260px 1fr',height:`calc(100vh - ${zoekMelding?94:54}px)`}}>

        {/* LINKER ZIJBALK */}
        <aside style={{borderRight:`1px solid ${BORDER}`,overflowY:'auto',padding:'12px 0',display:'flex',flexDirection:'column'}}>
          {/* Nav links */}
          <div style={{padding:'0 12px 12px',borderBottom:`1px solid ${BORDER}`,marginBottom:8}}>
            <Link href="/agent" style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:8,background:'rgba(245,166,35,0.1)',color:FF,fontSize:12,fontWeight:600,textDecoration:'none',marginBottom:4}}>
              🗂️ Campagne batches
            </Link>
            <Link href="/agent/bedrijven" style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:8,color:MUTED,fontSize:12,textDecoration:'none',transition:'all 0.15s'}}>
              📋 Alle bedrijven
            </Link>
          </div>

          <p style={{fontSize:10,fontWeight:700,color:MUTED,textTransform:'uppercase',letterSpacing:'0.1em',padding:'4px 16px 10px'}}>Campagne batches</p>

          {!geladen ? <p style={{color:MUTED,fontSize:12,padding:'0 16px'}}>Laden...</p>
          : batches.length === 0 ? (
            <div style={{padding:'16px',textAlign:'center'}}>
              <p style={{fontSize:12,color:MUTED,lineHeight:1.7}}>Nog geen batches.</p>
            </div>
          ) : batches.map(b => {
            const cs = b.contacten ?? []
            const r1v = cs.filter(c=>c.r1_status==='verstuurd').length
            const r2v = cs.filter(c=>c.r2_status==='verstuurd').length
            const r3v = cs.filter(c=>c.r3_status==='verstuurd').length
            const isActief = b.id === activeBatch
            const isVandaag = [b.start_datum, b.ronde_2_datum, b.ronde_3_datum].includes(vandaag)
            return (
              <button key={b.id} onClick={()=>setActiveBatch(b.id)} style={{
                width:'100%',textAlign:'left',background:isActief?'rgba(245,166,35,0.08)':'transparent',
                border:'none',borderLeft:isActief?`3px solid ${FF}`:'3px solid transparent',
                padding:'10px 16px',cursor:'pointer',transition:'all 0.15s',
              }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                  <p style={{fontSize:12,fontWeight:isActief?600:400,color:isActief?FF:TEXT,lineHeight:1.3,flex:1,marginRight:6}}>{b.naam}</p>
                  {isVandaag && <span style={{background:'rgba(245,166,35,0.2)',color:FF,borderRadius:4,padding:'1px 6px',fontSize:10,flexShrink:0}}>Vandaag</span>}
                </div>
                {/* Progress bars per ronde */}
                <div style={{display:'flex',flexDirection:'column',gap:3,marginBottom:4}}>
                  {[r1v,r2v,r3v].map((v,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontSize:9,color:v>0?R_COLORS[i]:MUTED,width:18}}>R{i+1}</span>
                      <div style={{flex:1,height:3,background:'rgba(255,255,255,0.06)',borderRadius:2}}>
                        <div style={{width:`${cs.length?v/cs.length*100:0}%`,height:'100%',background:v>0?R_COLORS[i]:'transparent',borderRadius:2,transition:'width 0.3s'}}/>
                      </div>
                      <span style={{fontSize:9,color:MUTED,width:24,textAlign:'right'}}>{v}/{cs.length}</span>
                    </div>
                  ))}
                </div>
                <p style={{fontSize:10,color:MUTED,marginTop:2}}>{formatDatum(b.start_datum)}</p>
              </button>
            )
          })}
        </aside>

        {/* HOOFD CONTENT */}
        <main style={{overflowY:'auto',padding:'20px 24px'}}>
          {!batch ? (
            <div style={{textAlign:'center',padding:'60px 20px'}}>
              <p style={{fontSize:36,marginBottom:12}}>📱</p>
              <p style={{fontSize:16,fontWeight:600,color:TEXT,marginBottom:8}}>Selecteer een batch</p>
              <p style={{fontSize:13,color:MUTED}}>Of wacht op de ochtend selectie via Telegram</p>
            </div>
          ) : (
            <>
              {/* Batch header */}
              <div style={{marginBottom:20}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                  <div>
                    <h1 style={{fontSize:18,fontWeight:700,color:'white',margin:0}}>{batch.naam}</h1>
                    <p style={{fontSize:12,color:MUTED,marginTop:4}}>
                      Status: <span style={{color:batch.status==='voltooid'?GREEN:FF}}>{batch.status}</span>
                    </p>
                  </div>
                  <div style={{display:'flex',gap:8,fontSize:12,color:MUTED}}>
                    <span>R1: {formatDatum(batch.start_datum)}</span>
                    <span>·</span>
                    <span>R2: {formatDatum(batch.ronde_2_datum)}</span>
                    <span>·</span>
                    <span>R3: {formatDatum(batch.ronde_3_datum)}</span>
                  </div>
                </div>

                {/* Stats header bar */}
                {batchStats && (
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
                    <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:8,padding:'10px 14px'}}>
                      <p style={{fontSize:10,color:MUTED,margin:'0 0 3px',textTransform:'uppercase',letterSpacing:'0.08em'}}>Totaal</p>
                      <p style={{fontSize:20,fontWeight:700,color:'white',margin:0,lineHeight:1}}>{batchStats.totaal}</p>
                      <p style={{fontSize:10,color:MUTED,margin:'2px 0 0'}}>contacten</p>
                    </div>
                    <div style={{background:CARD,border:`1px solid rgba(34,197,94,0.15)`,borderRadius:8,padding:'10px 14px'}}>
                      <p style={{fontSize:10,color:MUTED,margin:'0 0 3px',textTransform:'uppercase',letterSpacing:'0.08em'}}>Verstuurd R{activeRonde}</p>
                      <p style={{fontSize:20,fontWeight:700,color:GREEN,margin:0,lineHeight:1}}>{batchStats.verstuurd}</p>
                      <p style={{fontSize:10,color:MUTED,margin:'2px 0 0'}}>{batchStats.pct}% van batch</p>
                    </div>
                    <div style={{background:CARD,border:`1px solid rgba(245,166,35,0.15)`,borderRadius:8,padding:'10px 14px'}}>
                      <p style={{fontSize:10,color:MUTED,margin:'0 0 3px',textTransform:'uppercase',letterSpacing:'0.08em'}}>Te reviewen</p>
                      <p style={{fontSize:20,fontWeight:700,color:batchStats.teReviewen>0?FF:MUTED,margin:0,lineHeight:1}}>{batchStats.teReviewen}</p>
                      <p style={{fontSize:10,color:MUTED,margin:'2px 0 0'}}>wacht op actie</p>
                    </div>
                    <div style={{background:CARD,border:`1px solid ${batchStats.zwarteLijst>0?'rgba(239,68,68,0.2)':BORDER}`,borderRadius:8,padding:'10px 14px'}}>
                      <p style={{fontSize:10,color:MUTED,margin:'0 0 3px',textTransform:'uppercase',letterSpacing:'0.08em'}}>Zwarte lijst</p>
                      <p style={{fontSize:20,fontWeight:700,color:batchStats.zwarteLijst>0?RED:MUTED,margin:0,lineHeight:1}}>{batchStats.zwarteLijst}</p>
                      <p style={{fontSize:10,color:MUTED,margin:'2px 0 0'}}>geblokkeerd</p>
                    </div>
                  </div>
                )}

                {/* Ronde tabs met voortgangsbars */}
                <div style={{display:'flex',gap:6}}>
                  {[1,2,3].map(r => {
                    const s = rStats(r)
                    const isVandaag = [batch.start_datum, batch.ronde_2_datum, batch.ronde_3_datum][r-1] === vandaag
                    const pct = Math.round(s.verstuurd / totaal * 100)
                    return (
                      <button key={r} onClick={()=>wisselRonde(r)} style={{
                        flex:1,padding:'10px',borderRadius:10,cursor:'pointer',transition:'all 0.15s',
                        background: activeRonde===r ? `rgba(${R_COLORS[r-1].slice(1).match(/.{2}/g)!.map(h=>parseInt(h,16)).join(',')},0.15)` : CARD2,
                        border: `1px solid ${activeRonde===r ? R_COLORS[r-1]+'44' : BORDER}`,
                      }}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                          <span style={{fontSize:12,fontWeight:600,color:activeRonde===r?R_COLORS[r-1]:TEXT}}>Ronde {r}</span>
                          <div style={{display:'flex',gap:4,alignItems:'center'}}>
                            {isVandaag && <span style={{background:'rgba(245,166,35,0.2)',color:FF,borderRadius:3,padding:'1px 5px',fontSize:9}}>Vandaag</span>}
                            <span style={{fontSize:9,color:s.verstuurd>0?GREEN:MUTED}}>{s.verstuurd}/{totaal}</span>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div style={{height:3,background:'rgba(255,255,255,0.06)',borderRadius:2,marginBottom:6}}>
                          <div style={{width:`${pct}%`,height:'100%',background:R_COLORS[r-1],borderRadius:2,transition:'width 0.4s'}}/>
                        </div>
                        <p style={{fontSize:10,color:MUTED,marginBottom:4}}>{R_NAMEN[r-1]}</p>
                        <div style={{display:'flex',gap:6,fontSize:10,flexWrap:'wrap'}}>
                          {s.verstuurd > 0 && <span style={{color:GREEN}}>✓ {s.verstuurd}</span>}
                          {s.wacht > 0 && <span style={{color:'#94A3B8'}}>⏳ {s.wacht}</span>}
                          {s.goed > 0 && <span style={{color:GREEN}}>✅ {s.goed}</span>}
                          {s.klaar > 0 && <span style={{color:'#6EE7B7'}}>📧 {s.klaar}</span>}
                          {s.skip > 0 && <span style={{color:'var(--text-2)'}}>❌ {s.skip}</span>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Bulk acties */}
              {(() => {
                const s = rStats(activeRonde)
                const col = `r${activeRonde}_status` as keyof Contact
                const heeftWacht = s.wacht > 0
                const heeftEmailKlaar = alleContacten.some(c => c[col] === 'email_klaar')
                const heeftEmailGoed = s.klaar > 0
                return (heeftWacht || heeftEmailKlaar || heeftEmailGoed) ? (
                  <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,padding:'12px 16px',marginBottom:16,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                    <span style={{fontSize:12,color:MUTED,flex:1}}>Bulk acties voor ronde {activeRonde}:</span>
                    {heeftWacht && (
                      <button onClick={()=>keurAllesGoed(activeRonde,'bedrijf')} disabled={approvingAll} style={{background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:7,color:GREEN,fontSize:12,padding:'7px 14px',cursor:'pointer',fontWeight:600}}>
                        ✅ Alle {s.wacht} bedrijven goedkeuren
                      </button>
                    )}
                    {heeftEmailKlaar && (
                      <button onClick={()=>keurAllesGoed(activeRonde,'email')} disabled={approvingAll} style={{background:'rgba(110,231,183,0.1)',border:'1px solid rgba(110,231,183,0.3)',borderRadius:7,color:'#6EE7B7',fontSize:12,padding:'7px 14px',cursor:'pointer',fontWeight:600}}>
                        ✅ Alle emails goedkeuren
                      </button>
                    )}
                    {heeftEmailGoed && (
                      <button
                        onClick={async () => {
                          setApprovingAll(true)
                          try {
                            const res = await fetch('/api/agent', {
                              method: 'POST',
                              headers: {'Content-Type':'application/json'},
                              body: JSON.stringify({ actie: 'trigger_workflow', stap: 'verstuur', batch_id: batch.id, ronde: activeRonde }),
                            })
                            const data = await res.json()
                            setZoekMelding(data.ok
                              ? {ok:true, tekst:`🚀 Verstuur gestart voor ronde ${activeRonde}! Agent verwerkt de emails.`}
                              : {ok:false, tekst:`❌ Fout: ${data.error ?? 'Onbekende fout'}`}
                            )
                          } catch { setZoekMelding({ok:false, tekst:'❌ Kan agent niet bereiken'}) }
                          setApprovingAll(false)
                        }}
                        disabled={approvingAll}
                        style={{background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.4)',borderRadius:7,color:GREEN,fontSize:12,padding:'7px 14px',cursor:'pointer',fontWeight:600}}
                      >
                        🚀 Verstuur {s.klaar} emails (ronde {activeRonde})
                      </button>
                    )}
                  </div>
                ) : null
              })()}

              {/* Zoek en filter bar */}
              <div style={{marginBottom:12}}>
                {/* Zoekbalk */}
                <div style={{position:'relative',marginBottom:8}}>
                  <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:13,color:MUTED,pointerEvents:'none'}}>🔍</span>
                  <input
                    type="text"
                    placeholder="Zoek op naam, email, stad of sector..."
                    value={zoekTerm}
                    onChange={e=>setZoekTerm(e.target.value)}
                    style={{width:'100%',background:CARD2,border:`1px solid ${BORDER}`,borderRadius:7,color:TEXT,fontSize:12,padding:'8px 10px 8px 32px',outline:'none',fontFamily:'inherit'}}
                  />
                  {zoekTerm && (
                    <button onClick={()=>setZoekTerm('')} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:MUTED,cursor:'pointer',fontSize:13,padding:0}}>✕</button>
                  )}
                </div>

                {/* Status filter pills */}
                <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                  {[
                    {key:'actie', label:'🎯 Actie vereist'},
                    {key:'alle',  label:'Alle'},
                    {key:'wacht', label:'⏳ Wacht'},
                    {key:'email_klaar', label:'📧 Email klaar'},
                    {key:'verstuurd', label:'📤 Verstuurd'},
                    {key:'overgeslagen', label:'❌ Skip'},
                  ].map(f => {
                    const count = f.key === 'alle' || f.key === 'actie' ? null
                      : alleContacten.filter(c => (c[`r${activeRonde}_status` as keyof Contact] as string) === f.key).length
                    return (
                      <button key={f.key} onClick={()=>setFilterStatus(f.key)} style={{
                        background: filterStatus===f.key ? 'rgba(245,166,35,0.15)' : CARD2,
                        border: `1px solid ${filterStatus===f.key ? FF+'66' : BORDER}`,
                        borderRadius:6, color: filterStatus===f.key ? FF : MUTED,
                        fontSize:11, padding:'5px 10px', cursor:'pointer',
                      }}>
                        {f.label}{count !== null ? ` (${count})` : ''}
                      </button>
                    )
                  })}
                  <span style={{fontSize:11,color:MUTED,marginLeft:4}}>
                    {contacten.length}/{alleContacten.length} zichtbaar
                  </span>
                </div>
              </div>

              {/* Contacten lijst */}
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {contacten.length === 0 && (
                  <div style={{textAlign:'center',padding:'32px 16px',color:MUTED,fontSize:13}}>
                    {zoekTerm ? `Geen resultaten voor "${zoekTerm}"` : 'Geen contacten voor deze filter.'}
                  </div>
                )}
                {contacten.map(c => {
                  const r = activeRonde
                  const statusKey = `r${r}_status` as keyof Contact
                  const onderwerpKey = `r${r}_onderwerp` as keyof Contact
                  const bodyKey = `r${r}_body` as keyof Contact
                  const status = c[statusKey] as string || 'gepland'
                  const st = STATUS_STYLE[status] ?? STATUS_STYLE['gepland']
                  const isExpanded = expandedBody === c.id
                  const isGepland = status === 'gepland'
                  const heeftEmail = !!c[onderwerpKey]
                  const isEditing = edit?.id === c.id
                  const isRegenerating = regenerating === c.id
                  const opZwarteLijst = !!c.op_zwarte_lijst

                  return (
                    <div key={c.id} style={{
                      background:CARD2,
                      border:`1px solid ${opZwarteLijst?'rgba(239,68,68,0.35)':isGepland?BORDER:st.bg+'44'}`,
                      borderRadius:10,
                      padding:'12px 14px',
                      opacity:isGepland?0.5:1,
                      position:'relative',
                    }}>
                      {/* Zwarte lijst stripe */}
                      {opZwarteLijst && (
                        <div style={{position:'absolute',top:0,left:0,bottom:0,width:3,background:RED,borderRadius:'10px 0 0 10px'}} />
                      )}
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap'}}>
                            <p style={{fontSize:13,fontWeight:600,color:TEXT,margin:0}}>{c.naam}</p>
                            <span style={{background:st.bg,color:st.color,borderRadius:5,padding:'2px 8px',fontSize:10}}>{st.label}</span>
                            <span style={{background:'rgba(245,166,35,0.1)',color:FF,borderRadius:5,padding:'2px 7px',fontSize:10}}>{c.score}pts</span>
                            {opZwarteLijst && (
                              <span style={{background:'rgba(239,68,68,0.15)',color:RED,borderRadius:5,padding:'2px 7px',fontSize:10,fontWeight:700,border:'1px solid rgba(239,68,68,0.3)'}}>ZL</span>
                            )}
                          </div>
                          <p style={{fontSize:11,color:MUTED,margin:0}}>{c.email} · {c.stad} · {c.sector}</p>
                          {heeftEmail && !isEditing && <p style={{fontSize:11,color:'#818CF8',marginTop:4}}>✉️ {c[onderwerpKey] as string}</p>}
                        </div>

                        {/* Actie knoppen */}
                        {!isGepland && (
                          <div style={{display:'flex',gap:6,flexShrink:0,marginLeft:10,flexWrap:'wrap',justifyContent:'flex-end'}}>
                            {status === 'wacht' && <>
                              <div style={{position:'relative',display:'inline-flex'}}>
                                <Btn color={GREEN} onClick={()=>keurGoed(c.id,r,'bedrijf')}>✅</Btn>
                                <span style={{position:'absolute',bottom:-18,left:'50%',transform:'translateX(-50%)',fontSize:9,color:MUTED,whiteSpace:'nowrap',pointerEvents:'none'}}>A</span>
                              </div>
                              <div style={{position:'relative',display:'inline-flex'}}>
                                <Btn color={RED}   onClick={()=>slaOver(c.id,r,'bedrijf')}>❌</Btn>
                                <span style={{position:'absolute',bottom:-18,left:'50%',transform:'translateX(-50%)',fontSize:9,color:MUTED,whiteSpace:'nowrap',pointerEvents:'none'}}>S</span>
                              </div>
                            </>}
                            {status === 'email_klaar' && <>
                              <div style={{position:'relative',display:'inline-flex'}}>
                                <Btn color={GREEN} onClick={()=>keurGoed(c.id,r,'email')}>✅ Email</Btn>
                                <span style={{position:'absolute',bottom:-18,left:'50%',transform:'translateX(-50%)',fontSize:9,color:MUTED,whiteSpace:'nowrap',pointerEvents:'none'}}>A</span>
                              </div>
                              <div style={{position:'relative',display:'inline-flex'}}>
                                <Btn color={RED}   onClick={()=>slaOver(c.id,r,'email')}>❌</Btn>
                                <span style={{position:'absolute',bottom:-18,left:'50%',transform:'translateX(-50%)',fontSize:9,color:MUTED,whiteSpace:'nowrap',pointerEvents:'none'}}>S</span>
                              </div>
                            </>}
                            {heeftEmail && !isEditing && (
                              <>
                                <Btn color={MUTED} onClick={()=>{ setExpandedBody(isExpanded?null:c.id); setEdit(null) }}>
                                  {isExpanded?'▲':'▼'}
                                </Btn>
                                <Btn color={FF} onClick={()=>{
                                  setExpandedBody(c.id)
                                  setEdit({
                                    id: c.id,
                                    bodyKey: bodyKey as string,
                                    bodyVal: c[bodyKey] as string ?? '',
                                    onderwerpKey: onderwerpKey as string,
                                    onderwerpVal: c[onderwerpKey] as string ?? '',
                                  })
                                }}>✏️</Btn>
                                <Btn color={'#A78BFA'} onClick={()=>regenereerEmail(c.id, r)} disabled={isRegenerating}>
                                  {isRegenerating ? '⏳' : '🔄'}
                                </Btn>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Email preview / edit */}
                      {isExpanded && (c[bodyKey] || isEditing) && (
                        <div style={{marginTop:12,background:'rgba(0,0,0,0.3)',borderRadius:8,padding:'12px 14px',borderLeft:`3px solid ${FF}`}}>
                          {isEditing ? (
                            <>
                              {/* Onderwerp edit */}
                              <p style={{fontSize:10,color:MUTED,margin:'0 0 4px'}}>Onderwerp</p>
                              <input
                                value={edit!.onderwerpVal}
                                onChange={e=>setEdit({...edit!, onderwerpVal:e.target.value})}
                                style={{width:'100%',background:'rgba(255,255,255,0.06)',color:TEXT,border:'1px solid rgba(255,255,255,0.15)',borderRadius:6,padding:'8px 10px',fontSize:12,fontFamily:'inherit',outline:'none',marginBottom:10}}
                              />
                              {/* Body edit */}
                              <p style={{fontSize:10,color:MUTED,margin:'0 0 4px'}}>Email tekst</p>
                              <textarea
                                value={edit!.bodyVal}
                                onChange={e=>setEdit({...edit!, bodyVal:e.target.value})}
                                style={{width:'100%',minHeight:220,background:'rgba(255,255,255,0.06)',color:TEXT,border:'1px solid rgba(255,255,255,0.15)',borderRadius:6,padding:'10px',fontSize:12,fontFamily:'inherit',lineHeight:1.7,resize:'vertical',outline:'none'}}
                              />
                              <div style={{display:'flex',gap:8,marginTop:10}}>
                                <button onClick={slaEmailOp} disabled={saving}
                                  style={{background:'rgba(34,197,94,0.15)',border:'1px solid rgba(34,197,94,0.4)',borderRadius:6,color:GREEN,fontSize:12,padding:'6px 14px',cursor:'pointer',fontWeight:600}}>
                                  {saving ? 'Opslaan...' : '💾 Opslaan'}
                                </button>
                                <button onClick={()=>setEdit(null)}
                                  style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:6,color:RED,fontSize:12,padding:'6px 14px',cursor:'pointer'}}>
                                  Annuleren
                                </button>
                              </div>
                            </>
                          ) : (
                            <pre style={{fontSize:12,color:'rgba(255,255,255,0.7)',whiteSpace:'pre-wrap',fontFamily:'inherit',margin:0,lineHeight:1.7}}>
                              {c[bodyKey] as string}
                            </pre>
                          )}
                        </div>
                      )}

                      {/* Regenereer melding */}
                      {isRegenerating && (
                        <p style={{fontSize:11,color:'#A78BFA',marginTop:8}}>⏳ Email wordt gereset — agent genereert opnieuw bij volgende run...</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

function Btn({color,onClick,children,disabled}:{color:string;onClick:()=>void;children:React.ReactNode;disabled?:boolean}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{background:`${color}15`,border:`1px solid ${color}40`,borderRadius:6,color,fontSize:11,padding:'5px 10px',cursor:disabled?'not-allowed':'pointer',fontWeight:600,whiteSpace:'nowrap',opacity:disabled?0.5:1}}>
      {children}
    </button>
  )
}
