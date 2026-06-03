'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const sb = createClient(
  'https://wicadprbktnzjnyexukl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpY2FkcHJia3RuempueWV4dWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4OTAxNDYsImV4cCI6MjA5MzQ2NjE0Nn0.jWTb0y0DgNUXZC6X84Ppm4SSP8R1rAX0yqJsRPuVVZE'
)

const FF = '#F5A623', DARK = '#0c0c11', CARD = '#131318', CARD2 = '#1a1a22'
const BORDER = 'rgba(255,255,255,0.06)', TEXT = 'rgba(255,255,255,0.88)', MUTED = 'rgba(255,255,255,0.35)'
const GREEN = '#22C55E', RED = '#EF4444'

const R_COLORS = ['#EAB308','#F97316','#EF4444']
const R_NAMEN  = ['Eerste contact','Follow-up','Afsluitend']

const STATUS_STYLE: Record<string, {bg:string;color:string;label:string}> = {
  wacht:             {bg:'#1e293b', color:'#94A3B8', label:'⏳ Wacht'},
  goedgekeurd:       {bg:'#14532d', color:GREEN,     label:'✅ Goed'},
  overgeslagen:      {bg:'#111',    color:'#6B7280',  label:'❌ Skip'},
  email_klaar:       {bg:'#1e1a2e', color:'#818CF8',  label:'📧 Email klaar'},
  email_goedgekeurd: {bg:'#064e3b', color:'#6EE7B7',  label:'✅ Email goed'},
  email_overgeslagen:{bg:'#111',    color:'#6B7280',  label:'❌ Email skip'},
  verstuurd:         {bg:'#14532d', color:GREEN,      label:'📤 Verstuurd'},
  gepland:           {bg:'#111',    color:'#374151',   label:'📅 Gepland'},
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

  useEffect(() => {
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }
      if (user.email?.toLowerCase() !== 'kanebongers@gmail.com') {
        window.location.href = '/home'; return
      }
      setToegang(true)
    })
  }, [])

  const laad = useCallback(async () => {
    const {data: bs} = await sb.from('agent_batches').select('*').order('aangemaakt_op', {ascending:false}).limit(10)
    if (!bs) { setGeladen(true); return }
    const batches_met_contacten = await Promise.all(bs.map(async (b) => {
      const {data: cs} = await sb.from('agent_contacten').select('*').eq('batch_id', b.id).order('score', {ascending:false})
      return {...b, contacten: cs ?? []}
    }))
    setBatches(batches_met_contacten as Batch[])
    if (!activeBatch && batches_met_contacten.length > 0) setActiveBatch(batches_met_contacten[0].id)
    setGeladen(true)
    setNu(new Date())
  }, [activeBatch])

  useEffect(()=>{ laad() }, [laad])
  useEffect(()=>{ const t=setInterval(laad,15000); return()=>clearInterval(t) }, [laad])

  const batch = batches.find(b => b.id === activeBatch)
  const contacten = batch?.contacten ?? []
  const vandaag = new Date().toISOString().split('T')[0]
  const totaal = contacten.length || 1

  const rStats = (r:number) => {
    const col = `r${r}_status` as keyof Contact
    return {
      wacht:     contacten.filter(c => c[col] === 'wacht').length,
      goed:      contacten.filter(c => c[col] === 'goedgekeurd').length,
      verstuurd: contacten.filter(c => c[col] === 'verstuurd').length,
      klaar:     contacten.filter(c => c[col] === 'email_goedgekeurd').length,
      skip:      contacten.filter(c => ['overgeslagen','email_overgeslagen'].includes(c[col] as string)).length,
    }
  }

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
    // Reset email velden → agent genereert opnieuw bij volgende run
    await sb.from('agent_contacten').update({
      [`r${ronde}_body`]: null,
      [`r${ronde}_onderwerp`]: null,
      [`r${ronde}_status`]: 'goedgekeurd',
    }).eq('id', contactId)
    setExpandedBody(null)
    setEdit(null)
    setRegenerating(null)
    laad()
  }

  async function keurAllesGoed(ronde: number, type: 'bedrijf'|'email') {
    setApprovingAll(true)
    const col = `r${ronde}_status`
    const huidige = type === 'bedrijf' ? 'wacht' : 'email_klaar'
    const nieuw   = type === 'bedrijf' ? 'goedgekeurd' : 'email_goedgekeurd'
    const ids = contacten.filter(c => (c as any)[col] === huidige).map(c => c.id)
    for (const id of ids) {
      await sb.from('agent_contacten').update({[col]: nieuw}).eq('id', id)
    }
    setApprovingAll(false)
    laad()
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
          <button onClick={laad} style={{background:CARD2,border:`1px solid ${BORDER}`,borderRadius:6,color:MUTED,fontSize:11,padding:'5px 10px',cursor:'pointer'}}>↻</button>
        </div>
      </header>

      <div style={{display:'grid',gridTemplateColumns:'260px 1fr',height:'calc(100vh - 54px)'}}>

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

                {/* Ronde tabs met voortgangsbars */}
                <div style={{display:'flex',gap:6}}>
                  {[1,2,3].map(r => {
                    const s = rStats(r)
                    const isVandaag = [batch.start_datum, batch.ronde_2_datum, batch.ronde_3_datum][r-1] === vandaag
                    const pct = Math.round(s.verstuurd / totaal * 100)
                    return (
                      <button key={r} onClick={()=>setActiveRonde(r)} style={{
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
                          {s.skip > 0 && <span style={{color:'#6B7280'}}>❌ {s.skip}</span>}
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
                const heeftEmailKlaar = contacten.some(c => c[col] === 'email_klaar')
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
                      <div style={{background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:7,padding:'7px 14px'}}>
                        <p style={{fontSize:12,color:GREEN,margin:0}}>🚀 Klaar om te versturen! Terminal: <code style={{fontFamily:'monospace',fontSize:11}}>python main.py verstuur_batch {batch.id} {activeRonde}</code></p>
                      </div>
                    )}
                  </div>
                ) : null
              })()}

              {/* Contacten lijst */}
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
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

                  return (
                    <div key={c.id} style={{background:CARD2,border:`1px solid ${c.op_zwarte_lijst?'#7f1d1d44':isGepland?BORDER:st.bg+'44'}`,borderRadius:10,padding:'12px 14px',opacity:isGepland?0.5:1}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap'}}>
                            <p style={{fontSize:13,fontWeight:600,color:TEXT,margin:0}}>{c.naam}</p>
                            <span style={{background:st.bg,color:st.color,borderRadius:5,padding:'2px 8px',fontSize:10}}>{st.label}</span>
                            <span style={{background:'rgba(245,166,35,0.1)',color:FF,borderRadius:5,padding:'2px 7px',fontSize:10}}>{c.score}pts</span>
                          </div>
                          <p style={{fontSize:11,color:MUTED,margin:0}}>{c.email} · {c.stad} · {c.sector}</p>
                          {heeftEmail && !isEditing && <p style={{fontSize:11,color:'#818CF8',marginTop:4}}>✉️ {c[onderwerpKey] as string}</p>}
                        </div>

                        {/* Actie knoppen */}
                        {!isGepland && (
                          <div style={{display:'flex',gap:6,flexShrink:0,marginLeft:10,flexWrap:'wrap',justifyContent:'flex-end'}}>
                            {status === 'wacht' && <>
                              <Btn color={GREEN} onClick={()=>keurGoed(c.id,r,'bedrijf')}>✅</Btn>
                              <Btn color={RED}   onClick={()=>slaOver(c.id,r,'bedrijf')}>❌</Btn>
                            </>}
                            {status === 'email_klaar' && <>
                              <Btn color={GREEN} onClick={()=>keurGoed(c.id,r,'email')}>✅ Email</Btn>
                              <Btn color={RED}   onClick={()=>slaOver(c.id,r,'email')}>❌</Btn>
                            </>}
                            {heeftEmail && !isEditing && (
                              <Btn color={MUTED} onClick={()=>{ setExpandedBody(isExpanded?null:c.id); setEdit(null) }}>
                                {isExpanded?'▲':'▼'}
                              </Btn>
                            )}
                            {heeftEmail && isExpanded && !isEditing && (
                              <Btn color={FF} onClick={()=>setEdit({
                                id: c.id,
                                bodyKey: bodyKey as string,
                                bodyVal: c[bodyKey] as string ?? '',
                                onderwerpKey: onderwerpKey as string,
                                onderwerpVal: c[onderwerpKey] as string ?? '',
                              })}>✏️</Btn>
                            )}
                            {heeftEmail && isExpanded && !isEditing && (
                              <Btn color={'#A78BFA'} onClick={()=>regenereerEmail(c.id, r)}>
                                {isRegenerating ? '⏳' : '🔄'}
                              </Btn>
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
