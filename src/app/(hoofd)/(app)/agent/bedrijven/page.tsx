'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import {
  Bot, RefreshCw, ArrowLeft, ClipboardList, Send, X, Ban, Check,
  Search, Mail, Calendar, Clock, type LucideIcon,
} from 'lucide-react'


const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const FF = 'var(--mentaforce-primary)', DARK = 'var(--bg-app)', CARD = 'var(--bg-card)', CARD2 = 'var(--bg-subtle)'
const BORDER = 'var(--border)', TEXT = 'var(--text-1)', MUTED = 'var(--text-3)'
const GREEN = 'var(--mf-green)', RED = 'var(--mf-red)'

type Contact = {
  id: string; naam: string; email: string; stad: string; sector: string; score: number
  r1_status: string; r2_status: string; r3_status: string
  batch_id: string; op_zwarte_lijst?: boolean
  batch_naam?: string
}

interface RawContact {
  id: string
  naam: string
  email: string
  stad: string
  sector: string
  score: number
  r1_status: string
  r2_status: string
  r3_status: string
  batch_id: string
  op_zwarte_lijst?: boolean
  agent_batches?: { naam: string } | null
}

type Filter = 'alles' | 'verstuurd' | 'zwarte_lijst' | 'overgeslagen'

export default function BedrijvenPage() {
  const [contacten, setContacten] = useState<Contact[]>([])
  const [geladen, setGeladen] = useState(false)
  const [toegang, setToegang] = useState(false)
  const [filter, setFilter] = useState<Filter>('alles')
  const [zoek, setZoek] = useState('')
  const [nu, setNu] = useState(new Date())

  useEffect(() => {
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }
      if (user.email?.toLowerCase() !== 'kanebongers@gmail.com') {
        window.location.href = '/home'; return
      }
      setToegang(true)
    })
  }, [])

  // Haalt contacten op; state wordt pas in .then() gezet zodat laden en
  // state-updates gescheiden blijven (geen setState in de effect-body zelf)
  const haalContacten = useCallback(async (): Promise<Contact[]> => {
    const { data: cs } = await sb
      .from('agent_contacten')
      .select('*, agent_batches(naam)')
      .order('score', { ascending: false })

    return ((cs ?? []) as RawContact[]).map((c) => ({
      ...c,
      batch_naam: c.agent_batches?.naam ?? '—',
    }))
  }, [])

  const laad = useCallback(() => {
    haalContacten().then(mapped => {
      setContacten(mapped)
      setGeladen(true)
      setNu(new Date())
    })
  }, [haalContacten])

  useEffect(() => {
    if (toegang) laad()
  }, [toegang, laad])

  async function toggleZwarteLijst(id: string, huidig: boolean) {
    await sb.from('agent_contacten').update({ op_zwarte_lijst: !huidig }).eq('id', id)
    laad()
  }

  const gefilterd = contacten.filter(c => {
    const matchZoek = !zoek || c.naam.toLowerCase().includes(zoek.toLowerCase()) || c.email.toLowerCase().includes(zoek.toLowerCase()) || c.sector.toLowerCase().includes(zoek.toLowerCase())
    if (!matchZoek) return false
    if (filter === 'zwarte_lijst') return c.op_zwarte_lijst
    if (filter === 'verstuurd') return c.r1_status === 'verstuurd' || c.r2_status === 'verstuurd' || c.r3_status === 'verstuurd'
    if (filter === 'overgeslagen') return c.r1_status === 'overgeslagen' || c.r2_status === 'overgeslagen' || c.r3_status === 'overgeslagen'
    return true
  })

  const totaal = contacten.length
  const verstuurdCount = contacten.filter(c => c.r1_status === 'verstuurd' || c.r2_status === 'verstuurd' || c.r3_status === 'verstuurd').length
  const zwarteLijstCount = contacten.filter(c => c.op_zwarte_lijst).length

  const rondeStatus = (c: Contact, r: number): { color: string; Icon: LucideIcon } | null => {
    const s = c[`r${r}_status` as 'r1_status' | 'r2_status' | 'r3_status']
    if (!s || s === 'gepland') return null
    const colors: Record<string, string> = {
      verstuurd: GREEN, goedgekeurd: GREEN, email_goedgekeurd: 'var(--mf-green-light)',
      wacht: 'var(--text-3)', email_klaar: 'var(--mf-purple)',
      overgeslagen: 'var(--text-2)', email_overgeslagen: 'var(--text-2)',
    }
    const icons: Record<string, LucideIcon> = {
      verstuurd: Send, goedgekeurd: Check, email_goedgekeurd: Mail,
      wacht: Clock, email_klaar: Mail,
      overgeslagen: X, email_overgeslagen: X,
    }
    return { color: colors[s] ?? MUTED, Icon: icons[s] ?? Calendar }
  }

  if (!toegang) return (
    <div style={{minHeight:'100vh',background:DARK,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:32,height:32,borderRadius:'50%',border:'3px solid var(--border-strong)',borderTopColor:FF,animation:'spin 0.8s linear infinite'}} />
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:DARK,color:TEXT,fontFamily:'system-ui,-apple-system,sans-serif'}}>

      {/* HEADER */}
      <header style={{height:54,borderBottom:`1px solid ${BORDER}`,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',position:'sticky',top:0,background:DARK,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,background:FF,display:'flex',alignItems:'center',justifyContent:'center'}}><Bot size={16} color="var(--bg-app)" aria-hidden /></div>
          <div>
            <p style={{fontWeight:700,fontSize:13,color:TEXT,lineHeight:1}}>Fit Factory Agent</p>
            <p style={{fontSize:10,color:MUTED,marginTop:2}}>Alle bedrijven overzicht</p>
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:GREEN,boxShadow:'0 0 5px color-mix(in srgb, var(--mf-green) 60%, transparent)'}}/>
          <span style={{fontSize:10,color:MUTED}}>{nu.toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})}</span>
          <button onClick={laad} aria-label="Vernieuwen" style={{background:CARD2,border:`1px solid ${BORDER}`,borderRadius:6,color:MUTED,fontSize:11,padding:'5px 10px',cursor:'pointer',display:'inline-flex',alignItems:'center'}}><RefreshCw size={13} aria-hidden /></button>
        </div>
      </header>

      <div style={{display:'grid',gridTemplateColumns:'220px 1fr',height:'calc(100vh - 54px)'}}>

        {/* ZIJBALK */}
        <aside style={{borderRight:`1px solid ${BORDER}`,padding:'16px 12px',display:'flex',flexDirection:'column',gap:4}}>
          <Link href="/agent" style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:8,color:MUTED,fontSize:12,textDecoration:'none',marginBottom:4}}>
            <ArrowLeft size={14} aria-hidden /> Terug naar batches
          </Link>

          <p style={{fontSize:10,fontWeight:700,color:MUTED,textTransform:'uppercase',letterSpacing:'0.1em',padding:'8px 10px 6px'}}>Filter</p>

          {([
            ['alles', ClipboardList, `Alle bedrijven`, totaal],
            ['verstuurd', Send, 'Verstuurd', verstuurdCount],
            ['overgeslagen', X, 'Overgeslagen', contacten.filter(c=>c.r1_status==='overgeslagen').length],
            ['zwarte_lijst', Ban, 'Zwarte lijst', zwarteLijstCount],
          ] as [Filter, LucideIcon, string, number][]).map(([f, Icon, label, count]) => (
            <button key={f} onClick={()=>setFilter(f)} style={{
              display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'8px 10px',borderRadius:8,border:'none',cursor:'pointer',
              background: filter===f ? (f==='zwarte_lijst'?'color-mix(in srgb, var(--mf-red) 10%, transparent)':'color-mix(in srgb, var(--mentaforce-primary) 8%, transparent)') : 'transparent',
              color: filter===f ? (f==='zwarte_lijst'?RED:FF) : MUTED,
              fontSize:12,
            }}>
              <span style={{display:'inline-flex',alignItems:'center',gap:7}}><Icon size={14} aria-hidden /> {label}</span>
              <span style={{fontSize:10,background:'var(--border)',borderRadius:10,padding:'1px 7px'}}>{count}</span>
            </button>
          ))}

          {/* Stats */}
          <div style={{marginTop:'auto',padding:'12px 10px',background:CARD,borderRadius:8}}>
            <p style={{fontSize:10,color:MUTED,marginBottom:8}}>Overzicht</p>
            <div style={{display:'flex',flexDirection:'column',gap:4}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}>
                <span style={{color:MUTED}}>Totaal benaderd</span>
                <span style={{color:TEXT}}>{totaal}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}>
                <span style={{color:MUTED}}>Email verstuurd</span>
                <span style={{color:GREEN}}>{verstuurdCount}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}>
                <span style={{color:MUTED}}>Zwarte lijst</span>
                <span style={{color:RED}}>{zwarteLijstCount}</span>
              </div>
              {totaal > 0 && (
                <div style={{marginTop:6}}>
                  <div style={{height:3,background:'var(--border)',borderRadius:2}}>
                    <div style={{width:`${verstuurdCount/totaal*100}%`,height:'100%',background:GREEN,borderRadius:2}}/>
                  </div>
                  <p style={{fontSize:9,color:MUTED,marginTop:3}}>{Math.round(verstuurdCount/totaal*100)}% conversie</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* HOOFD CONTENT */}
        <main style={{overflowY:'auto',padding:'20px 24px'}}>
          {/* Zoekbalk */}
          <div style={{marginBottom:16,position:'relative'}}>
            <Search size={15} color={MUTED} aria-hidden style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}} />
            <input
              value={zoek}
              onChange={e=>setZoek(e.target.value)}
              placeholder="Zoek op naam, email of sector..."
              style={{width:'100%',background:CARD2,border:`1px solid ${BORDER}`,borderRadius:8,padding:'10px 14px 10px 36px',color:TEXT,fontSize:13,outline:'none'}}
            />
          </div>

          {/* Resultaten teller */}
          <p style={{fontSize:11,color:MUTED,marginBottom:12}}>{gefilterd.length} bedrijven{zoek ? ` voor "${zoek}"` : ''}</p>

          {!geladen ? (
            <p style={{color:MUTED,fontSize:12}}>Laden...</p>
          ) : gefilterd.length === 0 ? (
            <div style={{textAlign:'center',padding:'40px',color:MUTED}}>
              <div style={{position:'relative',display:'inline-block',marginBottom:8}}>
                <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:0,pointerEvents:'none'}}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--mentaforce-primary) 18%, transparent) 0%, transparent 70%)' }} />
                </div>
                <Search size={32} color={MUTED} aria-hidden style={{position:'relative',zIndex:1}} />
              </div>
              <p>Geen bedrijven gevonden</p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {gefilterd.map(c => (
                <div key={c.id} style={{
                  background: c.op_zwarte_lijst ? 'color-mix(in srgb, var(--mf-red) 14%, transparent)' : CARD2,
                  border: `1px solid ${c.op_zwarte_lijst ? 'color-mix(in srgb, var(--mf-red) 30%, transparent)' : BORDER}`,
                  borderRadius:10, padding:'12px 14px',
                  display:'flex', justifyContent:'space-between', alignItems:'center', gap:12,
                }}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2,flexWrap:'wrap'}}>
                      <p style={{fontSize:13,fontWeight:600,color:c.op_zwarte_lijst?'var(--mf-red-light)':TEXT,margin:0}}>{c.naam}</p>
                      {c.op_zwarte_lijst && <span style={{background:'color-mix(in srgb, var(--mf-red) 15%, transparent)',color:RED,borderRadius:4,padding:'1px 7px',fontSize:10,display:'inline-flex',alignItems:'center',gap:4}}><Ban size={11} aria-hidden /> Zwarte lijst</span>}
                      <span style={{background:'color-mix(in srgb, var(--mentaforce-primary) 10%, transparent)',color:FF,borderRadius:4,padding:'1px 6px',fontSize:10}}>{c.score}pts</span>
                    </div>
                    <p style={{fontSize:11,color:MUTED,margin:'0 0 4px'}}>{c.email} · {c.stad} · {c.sector}</p>
                    <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                      <span style={{fontSize:10,color:MUTED}}>Batch: {c.batch_naam}</span>
                      {/* Ronde statussen */}
                      <div style={{display:'flex',gap:4}}>
                        {[1,2,3].map(r => {
                          const s = rondeStatus(c, r)
                          return s ? (
                            <span key={r} style={{fontSize:10,color:s.color,background:`color-mix(in srgb, ${s.color} 13%, transparent)`,borderRadius:4,padding:'1px 6px',display:'inline-flex',alignItems:'center',gap:3}}>
                              R{r} <s.Icon size={10} aria-hidden />
                            </span>
                          ) : null
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Zwarte lijst knop */}
                  <button
                    onClick={()=>toggleZwarteLijst(c.id, !!c.op_zwarte_lijst)}
                    title={c.op_zwarte_lijst ? 'Van zwarte lijst verwijderen' : 'Op zwarte lijst plaatsen'}
                    style={{
                      background: c.op_zwarte_lijst ? 'color-mix(in srgb, var(--mf-red) 15%, transparent)' : 'color-mix(in srgb, var(--text-1) 4%, transparent)',
                      border: `1px solid ${c.op_zwarte_lijst ? 'color-mix(in srgb, var(--mf-red) 40%, transparent)' : BORDER}`,
                      borderRadius:8, color: c.op_zwarte_lijst ? RED : MUTED,
                      fontSize:11, padding:'6px 12px', cursor:'pointer', whiteSpace:'nowrap', fontWeight:600,
                      transition:'all 0.15s', display:'inline-flex', alignItems:'center', gap:6,
                    }}
                  >
                    {c.op_zwarte_lijst ? <><Check size={13} aria-hidden /> Verwijder uit lijst</> : <><Ban size={13} aria-hidden /> Zwarte lijst</>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 3px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
