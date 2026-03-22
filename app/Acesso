'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const ADMIN = 'Alexandre'
const ADMIN_PASS = '123456'
const VERSION = 'v1.0'

const SLOTS = [
  '08:00','08:15','08:30','08:45','09:00','09:15','09:30','09:45',
  '10:00','10:15','10:30','10:45','11:00','11:15','11:30','11:45',
  '12:00','12:15','12:30','12:45','13:00','13:15','13:30','13:45',
  '14:00','14:15','14:30','14:45','15:00','15:15','15:30','15:45',
  '16:00','16:15','16:30','16:45','17:00','17:15','17:30','17:45','18:00',
]

// ── utils ──────────────────────────────────────────────
const todayStr = () => { const d=new Date(); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}` }
const todayISO = () => new Date().toISOString().slice(0,10)
const dmyToISO = s => { if(!s)return''; const[d,m,y]=s.split('/'); return`${y}-${m}-${d}` }
const isoToDmy = s => { if(!s)return''; const[y,m,d]=s.split('-'); return`${d}/${m}/${y}` }
const isFuture = (dmy,hm) => { if(!dmy||!hm)return false; const[d,m,y]=dmy.split('/');const[h,mi]=hm.split(':'); return new Date(+y,+m-1,+d,+h,+mi)>new Date() }
const toMin = s => { const[h,m]=(s||'00:00').split(':'); return+h*60+ +m }
const fmtCurrency = n => `R$ ${Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}`
const fmtPct = n => `${Number(n||0).toFixed(1)}%`

// ── DESIGN TOKENS ──────────────────────────────────────
const T = {
  surface:       '#faf9f6',
  surfaceLow:    '#f4f3f1',
  surfaceMed:    '#efeeeb',
  surfaceHigh:   '#e3e2e0',
  surfaceWhite:  '#ffffff',
  primary:       '#775a19',
  primaryLight:  '#d4ad65',
  primaryPale:   '#f5edd8',
  onSurface:     '#1a1c1a',
  onSurfaceMed:  '#4a4a3f',
  onSurfaceLow:  '#7a7a6a',
  hairGreen:     '#3d6b3d',
  hairGreenPale: '#e8f0e8',
  nailMauve:     '#7b5c6e',
  nailMauvePale: '#f0e8ed',
  danger:        '#b33a3a',
  dangerPale:    '#fbeaea',
  success:       '#3a7a4a',
  successPale:   '#e8f5ec',
  amber:         '#8a6020',
  amberPale:     '#fdf3e0',
}

// ── GLOBAL CSS ─────────────────────────────────────────
const G = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Manrope:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
html,body{font-family:'Manrope',sans-serif;background:${T.surface};color:${T.onSurface};min-height:100vh;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
::selection{background:${T.primaryPale};color:${T.primary};}
::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:${T.surfaceHigh};border-radius:4px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
.au{animation:fadeUp .45s cubic-bezier(.16,1,.3,1) both}
.au1{animation:fadeUp .45s .06s cubic-bezier(.16,1,.3,1) both}
.au2{animation:fadeUp .45s .12s cubic-bezier(.16,1,.3,1) both}
.au3{animation:fadeUp .45s .18s cubic-bezier(.16,1,.3,1) both}
.au4{animation:fadeUp .45s .24s cubic-bezier(.16,1,.3,1) both}

/* LAYOUT */
.sb{position:fixed;top:0;left:0;bottom:0;width:256px;background:${T.surfaceWhite};display:flex;flex-direction:column;z-index:200;transform:translateX(-256px);transition:transform .3s cubic-bezier(.4,0,.2,1);}
.sb.open{transform:translateX(0);box-shadow:8px 0 40px rgba(26,28,26,.1);}
@media(min-width:1000px){.sb{transform:translateX(0);}.ov{display:none!important;}.ml{margin-left:256px;}}
.ov{display:none;position:fixed;inset:0;background:rgba(26,28,26,.3);backdrop-filter:blur(2px);z-index:199;}
.ov.open{display:block;animation:fadeIn .2s ease;}
.ml{min-height:100vh;display:flex;flex-direction:column;}
.topbar{background:rgba(250,249,246,.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);padding:0 28px;height:62px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;border-bottom:1px solid rgba(119,90,25,.06);}
.content{padding:32px 28px 64px;flex:1;}
@media(max-width:700px){.content{padding:20px 16px 48px;}}

/* CARDS — no borders, tonal shift only */
.card{background:${T.surfaceWhite};border-radius:20px;overflow:hidden;margin-bottom:18px;}
.card-hd{padding:18px 22px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}
.ch{font-family:'Noto Serif',serif;font-size:17px;font-weight:600;color:${T.onSurface};}

/* KPI GRID */
.kpi-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:20px;}
@media(min-width:580px){.kpi-grid{grid-template-columns:repeat(4,1fr);}}
.kpi{background:${T.surfaceWhite};border-radius:18px;padding:20px 18px;}
.kpi-v{font-family:'Noto Serif',serif;font-size:26px;font-weight:700;color:${T.onSurface};line-height:1;margin-bottom:5px;}
.kpi-l{font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${T.onSurfaceLow};}
.kpi-delta{font-size:11px;font-weight:600;margin-top:6px;}
.kpi-bar{height:3px;border-radius:3px;background:${T.surfaceMed};margin-top:10px;overflow:hidden;}
.kpi-bar-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,${T.primary},${T.primaryLight});}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:10px 20px;border:none;border-radius:8px;font-family:'Manrope',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all .18s;white-space:nowrap;}
.btn-primary{background:linear-gradient(135deg,${T.primary},${T.primaryLight});color:white;box-shadow:0 2px 14px rgba(119,90,25,.25);}
.btn-primary:hover{filter:brightness(1.06);transform:translateY(-1px);box-shadow:0 4px 20px rgba(119,90,25,.32);}
.btn-ghost{background:transparent;color:${T.primary};font-weight:600;}
.btn-ghost:hover{background:${T.primaryPale};}
.btn-danger{background:transparent;color:${T.danger};font-weight:600;}
.btn-danger:hover{background:${T.dangerPale};}
.btn-success{background:transparent;color:${T.success};font-weight:600;}
.btn-success:hover{background:${T.successPale};}
.btn-sm{padding:7px 14px;font-size:11px;border-radius:7px;}

/* INPUTS */
.inp,.sel{width:100%;padding:13px 16px;background:${T.surfaceLow};border:none;border-radius:10px;font-family:'Manrope',sans-serif;font-size:14px;color:${T.onSurface};outline:none;transition:background .18s,box-shadow .18s;appearance:none;-webkit-appearance:none;box-sizing:border-box;}
.inp:focus,.sel:focus{background:${T.surfaceWhite};box-shadow:0 0 0 2px ${T.primaryLight}40;}
.inp:disabled{opacity:.55;cursor:not-allowed;}
.lbl{display:block;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${T.primary};margin-bottom:8px;margin-top:18px;}

/* ALERT */
.alert{padding:13px 16px;border-radius:12px;font-size:13px;margin-top:10px;line-height:1.6;}
.alert-danger{background:${T.dangerPale};color:${T.danger};}
.alert-success{background:${T.successPale};color:${T.success};}
.alert-amber{background:${T.amberPale};color:${T.amber};}
.alert-info{background:${T.primaryPale};color:${T.primary};}

/* BADGE */
.bdg{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.5px;white-space:nowrap;}
.bdg-hair{background:${T.hairGreenPale};color:${T.hairGreen};}
.bdg-nail{background:${T.nailMauvePale};color:${T.nailMauve};}

/* AGENDA CARDS */
.ag-card{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:14px;background:${T.surfaceLow};margin-bottom:8px;transition:background .18s;}
.ag-card:hover{background:${T.surfaceMed};}
.ag-card.done{background:${T.successPale};}
.tp{min-width:54px;height:54px;border-radius:13px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;}

/* GRADE */
.grade-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
.grade{border-collapse:collapse;min-width:380px;width:100%;}
.grade th{padding:12px 8px;text-align:center;background:${T.surfaceLow};font-size:11px;font-weight:700;letter-spacing:.5px;color:${T.onSurfaceMed};}
.grade th.tc{background:${T.surfaceMed};color:${T.primary};min-width:60px;font-family:'Noto Serif',serif;}
.grade td{padding:1px 2px;vertical-align:top;min-width:120px;height:36px;position:relative;}
.grade td.tc{background:${T.surfaceLow};padding:7px 10px;font-size:11px;font-weight:600;color:${T.primary};text-align:center;font-family:'Noto Serif',serif;}
.grade td.grey{background:${T.surfaceLow};opacity:.5;}
.grade td.free{cursor:pointer;transition:background .15s;}
.grade td.free:hover{background:${T.primaryPale};}
.cell{border-radius:8px;padding:5px 22px 5px 8px;height:100%;min-height:32px;position:relative;}
.cell-del{position:absolute;top:3px;right:3px;background:rgba(26,28,26,.1);border:none;border-radius:6px;width:20px;height:20px;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;transition:background .15s;}
.cell-del:hover{background:rgba(179,58,58,.2);}
.cell-cont{height:100%;min-height:30px;position:relative;}

/* PROF / SRV GRIDS */
.prof-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:14px;padding:18px;}
.srv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:12px;padding:18px;}
.pcard{background:${T.surfaceLow};border-radius:18px;padding:20px 16px;text-align:center;transition:background .18s;}
.pcard:hover{background:${T.surfaceMed};}
.pav{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,${T.primaryLight},${T.primary});display:flex;align-items:center;justify-content:center;font-family:'Noto Serif',serif;font-size:22px;font-weight:700;color:white;margin:0 auto 12px;box-shadow:0 4px 16px rgba(119,90,25,.2);}
.scard{background:${T.surfaceLow};border-radius:14px;padding:16px;transition:background .18s;}
.scard:hover{background:${T.surfaceMed};}

/* TABLE */
.tbl{width:100%;border-collapse:collapse;}
.tbl th{padding:10px 18px;text-align:left;font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${T.onSurfaceLow};}
.tbl td{padding:13px 18px;font-size:13px;border-top:1px solid ${T.surfaceLow};}
.tbl tr:hover td{background:${T.surfaceLow};}

/* SEARCH */
.srch-wrap{position:relative;margin-bottom:18px;}
.srch-ic{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:14px;color:${T.onSurfaceLow};}
.srch{width:100%;padding:12px 14px 12px 40px;background:${T.surfaceLow};border:none;border-radius:10px;font-family:'Manrope';font-size:14px;color:${T.onSurface};outline:none;box-sizing:border-box;transition:background .18s;}
.srch:focus{background:${T.surfaceMed};}

/* MODAL */
.moverlay{position:fixed;inset:0;background:rgba(26,28,26,.45);backdrop-filter:blur(4px);z-index:999;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;animation:fadeIn .2s ease;}
.modal{background:${T.surfaceWhite};border-radius:24px;width:100%;max-width:460px;max-height:92vh;overflow-y:auto;box-shadow:0 32px 80px rgba(26,28,26,.2);animation:scaleIn .25s cubic-bezier(.16,1,.3,1);}
.modal-hd{padding:20px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:${T.surfaceWhite};z-index:1;border-radius:24px 24px 0 0;}
.modal-title{font-family:'Noto Serif',serif;font-size:20px;font-weight:600;color:${T.onSurface};}
.modal-close{width:32px;height:32px;border-radius:50%;border:none;background:${T.surfaceLow};color:${T.onSurfaceMed};cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;transition:background .15s;}
.modal-close:hover{background:${T.surfaceMed};}
.modal-body{padding:4px 24px 24px;}

/* TOAST */
.toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);padding:13px 26px;border-radius:12px;font-size:13px;font-weight:600;z-index:9999;color:white;box-shadow:0 8px 32px rgba(26,28,26,.2);animation:fadeUp .3s cubic-bezier(.16,1,.3,1);white-space:nowrap;}

/* TABS */
.tabs{display:flex;overflow-x:auto;-webkit-overflow-scrolling:touch;gap:2px;padding:0 18px;background:${T.surface};}
.tab{flex-shrink:0;padding:13px 16px;background:none;border:none;border-bottom:2px solid transparent;font-family:'Manrope';font-size:12px;font-weight:600;color:${T.onSurfaceLow};cursor:pointer;display:flex;align-items:center;gap:6px;transition:color .18s;margin-bottom:-1px;white-space:nowrap;}
.tab.active{color:${T.primary};border-bottom-color:${T.primary};}
.tab:hover:not(.active){color:${T.onSurfaceMed};}

/* FIN GRID */
.fin-grid{display:grid;grid-template-columns:1fr;gap:16px;}
@media(min-width:700px){.fin-grid{grid-template-columns:1fr 1fr;}}

/* CHART BAR */
.bar-chart{display:flex;align-items:flex-end;gap:6px;height:80px;margin-top:12px;}
.bar-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;}
.bar-fill{width:100%;border-radius:4px 4px 0 0;background:linear-gradient(180deg,${T.primaryLight},${T.primary});min-height:4px;transition:height .4s cubic-bezier(.16,1,.3,1);}
.bar-lbl{font-size:9px;color:${T.onSurfaceLow};font-weight:600;}
`

// ── UI ATOMS ───────────────────────────────────────────
function Modal({title,onClose,children}){
  return(
    <div className="moverlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-hd">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
const Lbl = ({c})=><label className="lbl">{c}</label>
const Inp = ({v,set,type='text',ph,dis})=><input type={type} value={v??''} onChange={e=>set&&set(e.target.value)} placeholder={ph} disabled={dis} className="inp"/>
const Sel = ({v,set,children})=><select value={v??''} onChange={e=>set&&set(e.target.value)} className="sel">{children}</select>
const Alert = ({type,c})=><div className={`alert alert-${type}`}>{c}</div>
const Badge = ({tipo})=>{
  if(tipo==='manicure') return <span className="bdg bdg-nail">💅 Manicure</span>
  if(tipo==='sobrancelha') return <span className="bdg" style={{background:'#fce4ec',color:'#ad1457'}}>🪡 Sobrancelha</span>
  return <span className="bdg bdg-hair">✂️ Cabelereiro</span>
}

// ══════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════
function Login({onAdmin,onProf}){
  const [u,setU]=useState('')
  const [p,setP]=useState('')
  const [err,setErr]=useState('')
  const [ld,setLd]=useState(false)

  async function go(){
    if(!u.trim()){setErr('Informe seu nome');return}
    if(!p){setErr('Informe sua senha');return}
    setLd(true);setErr('')
    if(u.trim()===ADMIN&&p===ADMIN_PASS){setLd(false);onAdmin();return}
    const{data,error}=await supabase.from('salon_professionals').select('*').ilike('full_name',u.trim()).eq('active',true).single()
    setLd(false)
    if(error||!data){setErr('Usuário não encontrado');return}
    if(p!==(data.senha||'123456')){setErr('Senha incorreta');return}
    onProf(data)
  }

  return(
    <>
      <style>{G}</style>
      <style>{`
        body{background:${T.surfaceLow}!important;}
        .login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
        .login-card{background:${T.surfaceWhite};border-radius:28px;width:100%;max-width:400px;overflow:hidden;animation:scaleIn .4s cubic-bezier(.16,1,.3,1);}
        .login-hero{padding:44px 36px 36px;text-align:center;background:linear-gradient(160deg,${T.primaryPale},${T.surface});}
        .login-name{font-family:'Noto Serif',serif;font-size:38px;font-weight:700;color:${T.primary};letter-spacing:6px;text-transform:uppercase;}
        .login-tag{font-size:10px;font-weight:600;letter-spacing:5px;text-transform:uppercase;color:${T.primaryLight};margin-top:4px;}
        .login-body{padding:28px 36px 36px;}
        .login-btn{width:100%;padding:16px;background:linear-gradient(135deg,${T.primary},${T.primaryLight});border:none;border-radius:10px;font-family:'Manrope';font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:white;cursor:pointer;margin-top:22px;transition:filter .2s,transform .2s;box-shadow:0 4px 20px rgba(119,90,25,.25);}
        .login-btn:hover:not(:disabled){filter:brightness(1.08);transform:translateY(-1px);}
        .login-btn:disabled{opacity:.65;cursor:not-allowed;}
        .login-hint{text-align:center;margin-top:16px;font-size:11px;color:${T.onSurfaceLow};line-height:1.8;}
        .login-ver{text-align:center;margin-top:10px;font-size:10px;letter-spacing:2px;color:${T.surfaceHigh};}
      `}</style>
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-hero">
            <div className="login-name">Joudat</div>
            <div className="login-tag">The Digital Atelier</div>
          </div>
          <div className="login-body">
            <Lbl c="Usuário"/><Inp v={u} set={v=>{setU(v);setErr('')}} ph="Alexandre ou nome do profissional"/>
            <Lbl c="Senha"/>
            <input type="password" value={p} onChange={e=>{setP(e.target.value);setErr('')}} onKeyDown={e=>e.key==='Enter'&&go()} placeholder="••••••" className="inp"/>
            {err&&<Alert type="danger" c={err}/>}
            <button onClick={go} disabled={ld} className="login-btn">{ld?'Verificando…':'Entrar'}</button>
            <div className="login-hint">Admin: Alexandre &nbsp;·&nbsp; Profissionais: senha 123456</div>
            <div className="login-ver">{VERSION}</div>
          </div>
        </div>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════
// ADMIN PANEL
// ══════════════════════════════════════════════════════
function Admin({onLogout}){
  const [tab,setTab]=useState('dashboard')
  const [sb,setSb]=useState(false)
  const [agDate,setAgDate]=useState(todayStr())
  const [q,setQ]=useState('')
  const [toast,setToast]=useState(null)
  const [modal,setModal]=useState(null)
  const [form,setForm]=useState({})
  const [ferr,setFerr]=useState('')
  const [ld,setLd]=useState(false)
  const [ags,setAgs]=useState([])
  const [clients,setClients]=useState([])
  const [profs,setProfs]=useState([])
  const [srvs,setSrvs]=useState([])
  const [cats,setCats]=useState([])
  const [blocks,setBlocks]=useState([])

  const toast2=(m,ok=true)=>{setToast({m,ok});setTimeout(()=>setToast(null),3200)}
  const F=k=>v=>setForm(f=>({...f,[k]:v}))
  const closeM=()=>{setModal(null);setFerr('')}
  const openM=(t,d={})=>{setForm({...d});setModal(t);setFerr('')}

  const load=useCallback(async()=>{
    setLd(true)
    const[r1,r2,r3,r4,r5,r6]=await Promise.all([
      supabase.from('salon_bookings').select('*').order('booking_date').order('start_time'),
      supabase.from('salon_clients').select('*').order('full_name'),
      supabase.from('salon_professionals').select('*').eq('active',true).order('full_name'),
      supabase.from('services').select('*,service_categories(name)').eq('active',true).order('name'),
      supabase.from('service_categories').select('*').order('name'),
      supabase.from('salon_blocks').select('*').order('block_date').order('start_time'),
    ])
    setAgs(r1.data||[]);setClients(r2.data||[]);setProfs(r3.data||[]);setSrvs(r4.data||[]);setCats(r5.data||[]);setBlocks(r6.data||[])
    setLd(false)
  },[])

  useEffect(()=>{load()},[load])

  // compatible services
  const srvsFor=nom=>{const p=profs.find(x=>x.full_name===nom);if(!p||!p.tipo)return[];return srvs.filter(s=>s.tipo===p.tipo)}
  // extrai nome limpo sem duração do texto do option
  const cleanSrvName=v=>v.replace(/\s*\(\d+min\)\s*$/,'').trim()

  // free slots respecting duration
  // cabeleireiro: até 3 simultâneos | manicure/sobrancelha: 1
  const MAX_SIM={cabelereiro:3,manicure:1,sobrancelha:1}
  const freeSlotsFor=(nom,dmy)=>{
    if(!nom||!dmy)return SLOTS
    const p=profs.find(x=>x.full_name===nom);if(!p)return[]
    const hi=(p.schedule_start||'08:00').slice(0,5),hf=(p.schedule_end||'18:00').slice(0,5)
    const maxSim=MAX_SIM[p.tipo||'manicure']||1
    const taken=agRows.filter(a=>a.profName===nom&&a.dmy===dmy&&a.status!=='cancelled'&&a.id!==form.id)
      .map(a=>{const s=srvs.find(x=>x.name===a.srvName);const dur=Number(a.durMin)||Number(s?.duration_min)||30;return{ini:toMin(a.time),fim:toMin(a.time)+dur}})
    const srvNow=srvs.find(x=>x.name===form.service_name)
    const durNow=Number(srvNow?.duration_min)||30
    return SLOTS.filter(h=>{
      if(h<hi||h>hf)return false
      if(!isFuture(dmy,h))return false
      const ini=toMin(h),fim=ini+durNow
      if(fim>toMin(hf)+1)return false
      const overlapping=taken.filter(t=>ini<t.fim&&fim>t.ini).length
      if(overlapping>=maxSim)return false
      // bloqueia se qualquer slot do serviço cair num período bloqueado
      const dateISO=dmyToISO(dmy)
      const bloqueado=blocks.some(b=>{
        if(b.professional_name!==nom||b.block_date!==dateISO)return false
        const bIni=toMin((b.start_time||'').slice(0,5))
        const bFim=toMin((b.end_time||'').slice(0,5))
        return ini<bFim&&fim>bIni
      })
      if(bloqueado)return false
      return true
    })
  }

  // normalize booking rows
  const agRows=ags.map(a=>({
    id:a.id, dmy:isoToDmy(a.booking_date), time:(a.start_time||'').slice(0,5),
    cliName:a.client_name||'', srvName:a.service_name||'', profName:a.professional_name||'',
    status:a.status, price:Number(a.service_price)||Number(a.price_charged)||0,
    paid:Number(a.price_charged)||0, durMin:Number(a.duration_min)||30,
    comPct:Number(a.commission_pct)||0, comVal:Number(a.commission_value)||0,
  }))

  const today=todayStr()
  const agToday=agRows.filter(a=>a.dmy===today&&a.status!=='cancelled')
  const agDone=agRows.filter(a=>a.status==='completed')
  const agDay=agRows.filter(a=>a.dmy===agDate&&a.status!=='cancelled')

  // ── KPI CALCULATIONS ─────────────────────────────
  const fatToday=agToday.filter(a=>a.status==='completed').reduce((s,a)=>s+a.paid,0)
  const fatMonth=agDone.filter(a=>{const[,m,y]=a.dmy.split('/');const n=new Date();return+m-1===n.getMonth()&&+y===n.getFullYear()}).reduce((s,a)=>s+a.paid,0)
  const fatTotal=agDone.reduce((s,a)=>s+a.paid,0)
  const totalComissions=agDone.reduce((s,a)=>s+a.comVal,0)
  const netRevenue=fatTotal-totalComissions

  // occupancy rate — booked slots / total available slots today
  const totalSlotsToday=profs.reduce((s,p)=>{
    const hi=toMin((p.schedule_start||'08:00').slice(0,5)),hf=toMin((p.schedule_end||'18:00').slice(0,5))
    return s+Math.floor((hf-hi)/15)
  },0)
  const bookedMins=agToday.reduce((s,a)=>s+a.durMin,0)
  const occupancy=totalSlotsToday>0?Math.min(100,Math.round(bookedMins/15/totalSlotsToday*100)):0

  // avg ticket
  const avgTicket=agDone.length>0?(fatTotal/agDone.length):0

  // top services
  const srvCount=agDone.reduce((acc,a)=>{acc[a.srvName]=(acc[a.srvName]||0)+1;return acc},{})
  const topSrvs=Object.entries(srvCount).sort((a,b)=>b[1]-a[1]).slice(0,5)

  // monthly revenue for mini chart (last 6 months)
  const months=Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-5+i);return{m:d.getMonth(),y:d.getFullYear(),label:d.toLocaleString('pt-BR',{month:'short'})}})
  const monthlyRev=months.map(mo=>agDone.filter(a=>{const[,m,y]=a.dmy.split('/');return+m-1===mo.m&&+y===mo.y}).reduce((s,a)=>s+a.paid,0))
  const maxRev=Math.max(...monthlyRev,1)

  // top professionals
  const profRev=profs.map(p=>({name:p.full_name,rev:agDone.filter(a=>a.profName===p.full_name).reduce((s,a)=>s+a.paid,0),count:agDone.filter(a=>a.profName===p.full_name).length})).sort((a,b)=>b.rev-a.rev)

  // retention approx: clients with 2+ visits
  const retentionClientsCount=clients.filter(c=>(c.visits||0)>=2).length
  const retentionRate=clients.length>0?Math.round(retentionClientsCount/clients.length*100):0

  // grade helpers
  const getCel=(h,nom)=>{
    return agDay.find(a=>{if(a.profName!==nom)return false;const ini=toMin(a.time),fim=ini+a.durMin;return toMin(h)>=ini&&toMin(h)<fim})
  }
  const isStart=(h,nom)=>agDay.some(a=>a.profName===nom&&a.time===h)

  // verifica se horário está bloqueado pelo profissional
  const isBlocked=(h,nom)=>{
    const dateISO=dmyToISO(agDate)
    return blocks.some(b=>{
      if(b.professional_name!==nom)return false
      if(b.block_date!==dateISO)return false
      const bIni=(b.start_time||'').slice(0,5)
      const bFim=(b.end_time||'').slice(0,5)
      return h>=bIni&&h<bFim
    })
  }

  // ── CRUD ─────────────────────────────────────────
  async function saveAg(){
    setFerr('')
    if(!form.client_name||!form.service_name||!form.professional_name||!form.dmy||!form.time){setFerr('Preencha todos os campos');return}
    const p=profs.find(x=>x.full_name===form.professional_name)
    const s=srvs.find(x=>x.name===form.service_name)
    if(!p?.tipo){setFerr('Profissional sem classe definida — edite o cadastro');return}
    if(!s?.tipo){setFerr('Serviço sem classe definida — edite o cadastro');return}
    if(p.tipo!==s.tipo){setFerr(`❌ ${p.full_name} (${p.tipo}) não pode realizar "${s.name}" (${s.tipo})`);return}
    const pl={client_name:form.client_name,service_name:form.service_name,professional_name:form.professional_name,booking_date:dmyToISO(form.dmy),start_time:form.time.length===5?form.time+':00':form.time,status:'scheduled',price_charged:s.price||0,service_price:s.price||0,duration_min:s.duration_min||30}
    // Validação de conflito por tipo de profissional
    const pSave=profs.find(x=>x.full_name===form.professional_name)
    const isCabSave=(pSave?.tipo||'cabelereiro')==='cabelereiro'
    if(!isCabSave){
      // Manicure: bloqueia sobreposição de horário
      const durSave=Number(s?.duration_min)||30
      const takenSave=agRows.filter(a=>a.profName===form.professional_name&&a.dmy===form.dmy&&a.status!=='cancelled'&&a.id!==form.id)
        .map(a=>{const sv=srvs.find(x=>x.name===a.srvName);const d=Number(a.durMin)||Number(sv?.duration_min)||30;return{ini:toMin(a.time),fim:toMin(a.time)+d}})
      const iniSave=toMin(form.time),fimSave=iniSave+durSave
      if(takenSave.some(t=>iniSave<t.fim&&fimSave>t.ini)){setFerr(`❌ ${form.professional_name} já tem agendamento neste horário`);return}
    } else {
      // Cabelereiro: apenas bloqueia horário exato duplicado
      const exactSave=agRows.filter(a=>a.profName===form.professional_name&&a.dmy===form.dmy&&a.status!=='cancelled'&&a.id!==form.id).map(a=>a.time)
      if(exactSave.includes(form.time)){setFerr(`❌ ${form.professional_name} já tem agendamento às ${form.time}`);return}
    }
    const{error}=form.id?await supabase.from('salon_bookings').update(pl).eq('id',form.id):await supabase.from('salon_bookings').insert(pl)
    if(error){setFerr('Erro: '+error.message);return}
    closeM();toast2('Agendamento salvo!');load()
  }

  async function delAg(id){
    const a=agRows.find(x=>x.id===id)
    if(a?.status==='completed'){toast2('Atendimentos finalizados não podem ser excluídos',false);return}
    if(!window.confirm('Excluir agendamento?'))return
    await supabase.from('salon_bookings').delete().eq('id',id)
    toast2('Removido!');load()
  }

  function editAg(a){
    // abre modal de edição com dados do agendamento
    openM('editAg',{
      id:a.id,
      client_name:a.cliName,
      service_name:a.srvName,
      professional_name:a.profName,
      dmy:a.dmy,
      time:a.time,
      status:a.status,
      profFix:false,
    })
  }

  // profissionais compatíveis com um serviço (mesma classe)
  const profsFor=srvName=>{
    const s=srvs.find(x=>x.name===srvName)
    if(!s||!s.tipo)return profs
    return profs.filter(p=>p.tipo===s.tipo)
  }

  async function saveEditAg(){
    setFerr('')
    if(!form.professional_name||!form.dmy||!form.time){setFerr('Preencha profissional, data e horário');return}
    const p=profs.find(x=>x.full_name===form.professional_name)
    const s=srvs.find(x=>x.name===form.service_name)
    if(p&&s&&p.tipo&&s.tipo&&p.tipo!==s.tipo){
      setFerr(`❌ ${p.full_name} (${p.tipo}) não pode realizar "${s.name}" (${s.tipo})`);return
    }
    // verifica conflito de horário para o novo profissional
    const dur=Number(s?.duration_min)||30
    const pNovo=profs.find(x=>x.full_name===form.professional_name)
    const isCab=(pNovo?.tipo||'cabelereiro')==='cabelereiro'
    if(!isCab){
      // Manicure: verifica sobreposição completa
      const ocupados=agRows
        .filter(a=>a.profName===form.professional_name&&a.dmy===form.dmy&&a.status!=='cancelled'&&a.id!==form.id)
        .map(a=>{const sv=srvs.find(x=>x.name===a.srvName);const d=Number(a.durMin)||Number(sv?.duration_min)||30;return{ini:toMin(a.time),fim:toMin(a.time)+d}})
      const ini=toMin(form.time),fim=ini+dur
      if(ocupados.some(t=>ini<t.fim&&fim>t.ini)){
        setFerr(`❌ ${form.professional_name} já tem agendamento neste horário`);return
      }
    } else {
      // Cabelereiro: verifica apenas horário exato
      const exactTaken=agRows.filter(a=>a.profName===form.professional_name&&a.dmy===form.dmy&&a.status!=='cancelled'&&a.id!==form.id).map(a=>a.time)
      if(exactTaken.includes(form.time)){
        setFerr(`❌ ${form.professional_name} já tem agendamento às ${form.time}`);return
      }
    }
    const{error}=await supabase.from('salon_bookings').update({
      professional_name:form.professional_name,
      booking_date:dmyToISO(form.dmy),
      start_time:form.time.length===5?form.time+':00':form.time,
    }).eq('id',form.id)
    if(error){setFerr('Erro: '+error.message);return}
    closeM();toast2('Agendamento atualizado!');load()
  }

  async function closeAg(){
    if(!form.paid_val){setFerr('Informe o valor cobrado');return}
    const p=profs.find(x=>x.full_name===form.profName)
    const pct=p?.commission_pct||0,val=Number(form.paid_val)
    const{error}=await supabase.from('salon_bookings').update({status:'completed',price_charged:val,payment_method:form.payment_method||'cash',commission_pct:pct,commission_value:Math.round(val*(pct/100)*100)/100}).eq('id',form.id)
    if(error){setFerr('Erro: '+error.message);return}
    const cl=clients.find(c=>c.full_name===form.cliName)
    if(cl) await supabase.from('salon_clients').update({visits:(cl.visits||0)+1,total_spent:(Number(cl.total_spent)||0)+val,last_visit:dmyToISO(form.dmy)}).eq('id',cl.id)
    closeM();toast2('Atendimento finalizado ✓');load()
  }

  async function saveCli(){
    if(!form.full_name){setFerr('Informe o nome');return}
    const pl={full_name:form.full_name.trim(),phone:form.phone||'',email:form.email||''}
    const{error}=form.id?await supabase.from('salon_clients').update(pl).eq('id',form.id):await supabase.from('salon_clients').insert(pl)
    if(error){setFerr('Erro: '+error.message);return}
    closeM();toast2('Cliente salvo!');load()
  }

  async function saveProf(){
    if(!form.full_name){setFerr('Informe o nome');return}
    if(!form.tipo){setFerr('Selecione a classe do profissional');return}
    const pl={full_name:form.full_name.trim(),phone:form.phone||'',specialty:form.specialty||'',tipo:form.tipo,commission_pct:Number(form.commission_pct)||40,schedule_start:form.schedule_start||'08:00',schedule_end:form.schedule_end||'18:00',active:true,senha:form.senha||'123456'}
    const{error}=form.id?await supabase.from('salon_professionals').update(pl).eq('id',form.id):await supabase.from('salon_professionals').insert(pl)
    if(error){setFerr('Erro: '+error.message);return}
    closeM();toast2('Profissional salvo!');load()
  }

  async function saveSrv(){
    if(!form.name){setFerr('Informe o nome');return}
    if(!form.tipo){setFerr('Selecione a classe do serviço');return}
    const cat=cats.find(c=>c.name===form.categoria)
    const pl={name:form.name.trim(),price:Number(form.price)||0,duration_min:Number(form.duration_min)||30,category_id:cat?.id||null,tipo:form.tipo,active:true}
    const{error}=form.id?await supabase.from('services').update(pl).eq('id',form.id):await supabase.from('services').insert(pl)
    if(error){setFerr('Erro: '+error.message);return}
    closeM();toast2('Serviço salvo!');load()
  }

  const cliFilt=clients.filter(c=>(c.full_name||'').toLowerCase().includes(q.toLowerCase())||(c.phone||'').includes(q))

  const navItems=[
    {id:'dashboard',label:'Dashboard',icon:'⬡'},
    {id:'agenda',label:'Global Schedule',icon:'◷'},
    {id:'clientes',label:'Client Registration',icon:'◉'},
    {id:'profissionais',label:'Professional Registration',icon:'✦'},
    {id:'servicos',label:'Service Registration',icon:'◈'},
    {id:'financeiro',label:'Billing / Revenue',icon:'◎'},
  ]

  return(
    <>
      <style>{G}</style>
      <style>{`
        .sb-title{font-family:'Noto Serif',serif;font-size:24px;font-weight:700;color:${T.primary};letter-spacing:1px;}
        .sb-sub{font-size:9px;font-weight:600;letter-spacing:4px;text-transform:uppercase;color:${T.onSurfaceLow};margin-top:2px;}
        .nav-item{display:flex;align-items:center;gap:12px;padding:13px 20px;cursor:pointer;color:${T.onSurfaceLow};font-size:13px;font-weight:500;border-radius:10px;margin:2px 8px;transition:all .18s;}
        .nav-item:hover{background:${T.surfaceLow};color:${T.onSurfaceMed};}
        .nav-item.active{background:${T.primaryPale};color:${T.primary};font-weight:700;}
        .nav-icon{font-size:15px;width:20px;text-align:center;flex-shrink:0;}
        .topbar-title{font-family:'Noto Serif',serif;font-size:18px;font-weight:600;color:${T.onSurface};}
        .menu-btn{width:40px;height:40px;border-radius:10px;border:none;background:${T.surfaceLow};cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:17px;color:${T.onSurfaceMed};transition:background .15s;}
        .menu-btn:hover{background:${T.surfaceMed};}
        .fab{position:fixed;bottom:28px;right:28px;z-index:50;display:flex;align-items:center;gap:9px;padding:14px 22px;background:linear-gradient(135deg,${T.primary},${T.primaryLight});border:none;border-radius:14px;font-family:'Manrope';font-size:13px;font-weight:700;color:white;cursor:pointer;box-shadow:0 6px 32px rgba(119,90,25,.3),0 2px 8px rgba(119,90,25,.15);transition:all .2s;}
        .fab:hover{filter:brightness(1.08);transform:translateY(-2px);box-shadow:0 10px 40px rgba(119,90,25,.38);}
        @media(min-width:1000px){.fab{display:none;}}
      `}</style>

      <div className={`ov${sb?' open':''}`} onClick={()=>setSb(false)}/>

      {/* SIDEBAR */}
      <aside className={`sb${sb?' open':''}`} style={{borderRight:`1px solid ${T.surfaceLow}`}}>
        <div style={{padding:'28px 20px 20px',borderBottom:`1px solid ${T.surfaceLow}`}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div className="sb-title">Joudat</div>
              <div className="sb-sub">The Digital Atelier</div>
            </div>
            <button onClick={()=>setSb(false)} style={{background:'none',border:'none',cursor:'pointer',color:T.onSurfaceLow,fontSize:18,padding:4}}>×</button>
          </div>
        </div>
        <nav style={{flex:1,padding:'12px 0',overflowY:'auto'}}>
          {navItems.map(n=>(
            <div key={n.id} className={`nav-item${tab===n.id?' active':''}`} onClick={()=>{setTab(n.id);setQ('');setSb(false)}}>
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </div>
          ))}
        </nav>
        {/* NEW APPOINTMENT BUTTON in sidebar */}
        <div style={{padding:'16px 14px',borderTop:`1px solid ${T.surfaceLow}`}}>
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',borderRadius:12,padding:'14px'}}
            onClick={()=>openM('ag',{client_name:'',service_name:'',professional_name:'',dmy:agDate,time:'',profFix:false})}>
            + New Appointment
          </button>
        </div>
        <div style={{padding:'14px 20px',borderTop:`1px solid ${T.surfaceLow}`,display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:`linear-gradient(135deg,${T.primaryLight},${T.primary})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'white',flexShrink:0}}>A</div>
          <div><div style={{fontSize:13,fontWeight:600,color:T.onSurface}}>Alexandre</div><div style={{fontSize:9,letterSpacing:2,color:T.onSurfaceLow,textTransform:'uppercase'}}>Administrador</div></div>
          <button onClick={onLogout} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',fontSize:11,color:T.onSurfaceLow,fontWeight:600}}>Sair</button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="ml">
        <div className="topbar">
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <button className="menu-btn" onClick={()=>setSb(v=>!v)}>☰</button>
            <span className="topbar-title">{navItems.find(n=>n.id===tab)?.label}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{padding:'6px 14px',background:T.surfaceLow,borderRadius:20,fontSize:11,fontWeight:600,color:T.onSurfaceMed,whiteSpace:'nowrap'}}>
              {new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}
            </div>
            <button onClick={()=>load()} className="btn btn-ghost btn-sm" title="Atualizar">↻</button>
          </div>
        </div>

        <div className="content">
          {ld&&<div style={{textAlign:'center',padding:64,color:T.onSurfaceLow,fontSize:13}}>Carregando…</div>}
          {!ld&&(<>

          {/* ══ DASHBOARD ══ */}
          {tab==='dashboard'&&(<>
            {/* Headline */}
            <div className="au" style={{marginBottom:28}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:4,textTransform:'uppercase',color:T.onSurfaceLow,marginBottom:6}}>Visão Geral</div>
              <div style={{fontFamily:'Noto Serif,serif',fontSize:32,fontWeight:700,color:T.onSurface,lineHeight:1.15}}>Atelier Dashboard</div>
              <div style={{fontSize:13,color:T.onSurfaceLow,marginTop:6}}>{new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
            </div>

            {/* KPI ROW 1 */}
            <div className="kpi-grid au1">
              {[
                {l:'Fat. Hoje',v:fmtCurrency(fatToday),bar:Math.min(100,fatToday/5000*100),delta:agToday.filter(a=>a.status==='completed').length+' finalizados'},
                {l:'Fat. Mês',v:fmtCurrency(fatMonth),bar:Math.min(100,fatMonth/30000*100),delta:'acumulado no mês'},
                {l:'Ticket Médio',v:fmtCurrency(avgTicket),bar:Math.min(100,avgTicket/200*100),delta:agDone.length+' atendimentos'},
                {l:'Ocupação Hoje',v:fmtPct(occupancy),bar:occupancy,delta:agToday.length+' de '+profs.length+' prof.'},
              ].map(k=>(
                <div key={k.l} className="kpi">
                  <div className="kpi-l">{k.l}</div>
                  <div className="kpi-v" style={{marginTop:8}}>{k.v}</div>
                  <div className="kpi-delta" style={{color:T.onSurfaceLow}}>{k.delta}</div>
                  <div className="kpi-bar"><div className="kpi-bar-fill" style={{width:k.bar+'%'}}/></div>
                </div>
              ))}
            </div>

            {/* KPI ROW 2 */}
            <div className="kpi-grid au2">
              {[
                {l:'Receita Líquida',v:fmtCurrency(netRevenue),bar:Math.min(100,netRevenue/fatTotal*100||0),delta:'após comissões'},
                {l:'Total Comissões',v:fmtCurrency(totalComissions),bar:Math.min(100,totalComissions/fatTotal*100||0),delta:profs.length+' profissionais'},
                {l:'Retenção de Clientes',v:fmtPct(retentionRate),bar:retentionRate,delta:retentionClientsCount+' de '+clients.length+' clientes'},
                {l:'Agendamentos Hoje',v:agToday.length,bar:Math.min(100,agToday.length/20*100),delta:agToday.filter(a=>a.status==='completed').length+' concluídos'},
              ].map(k=>(
                <div key={k.l} className="kpi">
                  <div className="kpi-l">{k.l}</div>
                  <div className="kpi-v" style={{marginTop:8}}>{k.v}</div>
                  <div className="kpi-delta" style={{color:T.onSurfaceLow}}>{k.delta}</div>
                  <div className="kpi-bar"><div className="kpi-bar-fill" style={{width:k.bar+'%'}}/></div>
                </div>
              ))}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}} className="au3">
              {/* Mini chart - receita mensal */}
              <div className="card">
                <div className="card-hd"><span className="ch">Receita Mensal</span></div>
                <div style={{padding:'4px 22px 18px'}}>
                  <div className="bar-chart">
                    {monthlyRev.map((v,i)=>(
                      <div key={i} className="bar-item">
                        <div className="bar-fill" style={{height:`${Math.max(4,Math.round(v/maxRev*70))}px`}}/>
                        <div className="bar-lbl">{months[i].label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top serviços */}
              <div className="card">
                <div className="card-hd"><span className="ch">Top Serviços</span></div>
                <div style={{padding:'0 0 10px'}}>
                  {topSrvs.length===0?<div style={{padding:'18px 22px',color:T.onSurfaceLow,fontSize:13}}>Nenhum dado ainda</div>
                  :topSrvs.map(([name,count],i)=>(
                    <div key={name} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 22px',borderTop:i>0?`1px solid ${T.surfaceLow}`:'none'}}>
                      <div style={{width:22,height:22,borderRadius:6,background:T.primaryPale,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:T.primary,flexShrink:0}}>{i+1}</div>
                      <div style={{flex:1,fontSize:13,fontWeight:500}}>{name}</div>
                      <div style={{fontSize:12,fontWeight:700,color:T.primary}}>{count}×</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}} className="au4">
              {/* Top profissionais */}
              <div className="card">
                <div className="card-hd"><span className="ch">Equipe</span></div>
                <div style={{padding:'0 0 10px'}}>
                  {profRev.length===0?<div style={{padding:'18px 22px',color:T.onSurfaceLow,fontSize:13}}>Nenhum dado</div>
                  :profRev.map((p,i)=>(
                    <div key={p.name} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 22px',borderTop:i>0?`1px solid ${T.surfaceLow}`:'none'}}>
                      <div style={{width:32,height:32,borderRadius:'50%',background:`linear-gradient(135deg,${T.primaryLight},${T.primary})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'white',flexShrink:0}}>{p.name[0]}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.name}</div>
                        <div style={{fontSize:11,color:T.onSurfaceLow}}>{p.count} atend.</div>
                      </div>
                      <div style={{fontSize:13,fontWeight:700,color:T.primary}}>{fmtCurrency(p.rev)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agenda de hoje resumida */}
              <div className="card">
                <div className="card-hd">
                  <span className="ch">Agenda de Hoje</span>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setTab('agenda')}>Ver tudo →</button>
                </div>
                <div style={{padding:'0 14px 14px'}}>
                  {agToday.length===0?<div style={{padding:'18px 8px',color:T.onSurfaceLow,fontSize:13,textAlign:'center'}}>Nenhum agendamento hoje</div>
                  :agToday.slice(0,5).map(a=>(
                    <div key={a.id} className={`ag-card${a.status==='completed'?' done':''}`} style={{padding:'11px 14px'}}>
                      <div className="tp" style={{background:a.status==='completed'?T.successPale:T.primaryPale,minWidth:48,height:48}}>
                        <div style={{fontSize:12,fontWeight:700,color:a.status==='completed'?T.success:T.primary}}>{a.time}</div>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.cliName}</div>
                        <div style={{fontSize:11,color:T.onSurfaceLow}}>{a.srvName}</div>
                      </div>
                      <div style={{display:'flex',gap:6,flexShrink:0}}>
                        {a.status!=='completed'&&a.status!=='cancelled'&&(
                          <button className="btn btn-ghost btn-sm" style={{padding:'5px 8px'}} onClick={()=>editAg(a)}>✏️</button>
                        )}
                        {a.status!=='completed'&&<button className="btn btn-success btn-sm" onClick={()=>openM('close',{...a,paid_val:a.price})}>✓</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>)}

          {/* ══ AGENDA GRADE ══ */}
          {tab==='agenda'&&(<>
            <div className="card au">
              <div className="card-hd">
                <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                  <span className="ch">Master Schedule</span>
                  <input type="date" value={dmyToISO(agDate)} onChange={e=>setAgDate(isoToDmy(e.target.value))}
                    style={{padding:'8px 12px',background:T.surfaceLow,border:'none',borderRadius:9,fontFamily:'Manrope',fontSize:12,color:T.onSurface,outline:'none'}}/>
                </div>
                <button className="btn btn-primary btn-sm" onClick={()=>openM('ag',{client_name:'',service_name:'',professional_name:'',dmy:agDate,time:'',profFix:false})}>+ Agendar</button>
              </div>
              {profs.length===0?<div style={{padding:28,textAlign:'center',color:T.onSurfaceLow,fontSize:13}}>Cadastre profissionais primeiro</div>
              :<div className="grade-wrap">
                <table className="grade">
                  <thead>
                    <tr>
                      <th className="tc">Hora</th>
                      {profs.map(p=>(
                        <th key={p.id}>
                          <div style={{fontFamily:'Noto Serif,serif',fontSize:13,fontWeight:600,color:T.onSurface}}>{p.full_name}</div>
                          <div style={{fontSize:9,color:T.onSurfaceLow,marginTop:2}}>{p.specialty}</div>
                          <div style={{marginTop:4}}><Badge tipo={p.tipo}/></div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SLOTS.map(h=>(
                      <tr key={h}>
                        <td className="tc">{h}</td>
                        {profs.map(p=>{
                          const cel=getCel(h,p.full_name)
                          const start=isStart(h,p.full_name)
                          const blocked=isBlocked(h,p.full_name)
                          const hi=(p.schedule_start||'08:00').slice(0,5),hf=(p.schedule_end||'18:00').slice(0,5)
                          const inExp=h>=hi&&h<=hf
                          const past=!isFuture(agDate,h)
                          const grey=!inExp||(past&&!cel&&!blocked)
                          const free=inExp&&!past&&!cel&&!blocked
                          const done=cel?.status==='completed'
                          const bg=done?T.successPale:T.primaryPale
                          const fc=done?T.success:T.primary
                          if(grey)return<td key={p.id} className="grey"/>
                          if(blocked&&!cel)return(
                            <td key={p.id} style={{background:'#f0f0f0',cursor:'default'}}>
                              <div style={{width:'100%',height:'100%',minHeight:32,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#aaa',fontWeight:600}}>🚫</div>
                            </td>
                          )
                          return(
                            <td key={p.id} className={free?'free':''}
                              onClick={()=>{if(!free)return;openM('ag',{client_name:'',service_name:'',professional_name:p.full_name,dmy:agDate,time:h,profFix:true})}}>
                              {free&&<div style={{width:'100%',height:'100%',minHeight:32,display:'flex',alignItems:'center',justifyContent:'center',color:T.surfaceHigh,fontSize:14}}>+</div>}
                              {cel&&start&&(
                                <div className="cell" style={{background:bg}}>
                                  <div style={{fontSize:10,fontWeight:700,color:T.onSurfaceLow,textTransform:'uppercase',letterSpacing:.5,marginBottom:1}}>{cel.srvName}</div>
                                  <div style={{fontSize:11,fontWeight:600,color:fc}}>{cel.cliName}</div>
                                  {!done&&<button className="cell-del" onClick={e=>{e.stopPropagation();delAg(cel.id)}}>✕</button>}
                                </div>
                              )}
                              {cel&&!start&&<div className="cell-cont" style={{background:done?`${T.successPale}88`:`${T.primaryPale}88`,borderTop:`1px dashed ${done?T.success+'33':T.primary+'22'}`}}/>}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}
            </div>

            {/* Lista do dia */}
            <div className="card au1">
              <div className="card-hd"><span className="ch">Lista — {agDate}</span></div>
              {agDay.length===0?<div style={{padding:24,textAlign:'center',color:T.onSurfaceLow,fontSize:13}}>Nenhum agendamento</div>
              :<div style={{padding:'0 14px 14px'}}>
                {agDay.map(a=>(
                  <div key={a.id} className={`ag-card${a.status==='completed'?' done':''}`}>
                    <div className="tp" style={{background:a.status==='completed'?T.successPale:T.primaryPale}}>
                      <div style={{fontSize:12,fontWeight:700,color:a.status==='completed'?T.success:T.primary}}>{a.time}</div>
                      <div style={{fontSize:9,color:T.onSurfaceLow}}>{a.durMin}m</div>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.cliName}</div>
                      <div style={{fontSize:11,color:T.onSurfaceLow}}>{a.srvName} · {a.profName}</div>
                      {a.paid>0&&<div style={{fontSize:12,fontWeight:600,color:a.status==='completed'?T.success:T.primary}}>{fmtCurrency(a.paid)}</div>}
                    </div>
                    <div style={{display:'flex',gap:6,flexShrink:0}}>
                      {a.status!=='completed'&&a.status!=='cancelled'&&(
                        <button className="btn btn-ghost btn-sm" style={{padding:'6px 10px'}} onClick={()=>editAg(a)}>✏️ Editar</button>
                      )}
                      {a.status!=='completed'&&a.status!=='cancelled'&&<button className="btn btn-success btn-sm" onClick={()=>openM('close',{...a,paid_val:a.price})}>✓ Fechar</button>}
                      {a.status!=='completed'&&<button className="btn btn-danger btn-sm" onClick={()=>delAg(a.id)}>✕</button>}
                    </div>
                  </div>
                ))}
              </div>}
            </div>
          </>)}

          {/* ══ CLIENTES ══ */}
          {tab==='clientes'&&(<div className="au">
            <div className="card">
              <div className="card-hd">
                <div>
                  <span className="ch">Clientes</span>
                  <span style={{fontSize:13,color:T.onSurfaceLow,marginLeft:8}}>({clients.length})</span>
                </div>
                <button className="btn btn-primary btn-sm" onClick={()=>openM('cli',{full_name:'',phone:'',email:''})}>+ Novo Cliente</button>
              </div>
              <div style={{padding:'0 20px 8px'}}>
                <div className="srch-wrap">
                  <span className="srch-ic">🔍</span>
                  <input className="srch" placeholder="Buscar por nome ou telefone…" value={q} onChange={e=>setQ(e.target.value)}/>
                </div>
              </div>
              {cliFilt.length===0?<div style={{padding:24,textAlign:'center',color:T.onSurfaceLow,fontSize:13}}>Nenhum cliente encontrado</div>
              :<div style={{overflowX:'auto'}}>
                <table className="tbl">
                  <thead><tr><th>Nome</th><th>Telefone</th><th>Visitas</th><th>Total Gasto</th><th/></tr></thead>
                  <tbody>
                    {cliFilt.map(c=>(
                      <tr key={c.id}>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div style={{width:32,height:32,borderRadius:'50%',background:`linear-gradient(135deg,${T.primaryLight},${T.primary})`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Noto Serif,serif',fontSize:14,fontWeight:700,color:'white',flexShrink:0}}>{(c.full_name||'?')[0]}</div>
                            <span style={{fontWeight:600}}>{c.full_name}</span>
                          </div>
                        </td>
                        <td style={{color:T.onSurfaceLow,fontSize:12}}>{c.phone||'—'}</td>
                        <td>{c.visits||0}</td>
                        <td style={{fontWeight:600,color:T.primary}}>{fmtCurrency(c.total_spent)}</td>
                        <td>
                          <div style={{display:'flex',gap:6}}>
                            <button className="btn btn-ghost btn-sm" onClick={()=>openM('cli',c)}>Editar</button>
                            <button className="btn btn-danger btn-sm" onClick={()=>{if(window.confirm('Excluir?'))supabase.from('salon_clients').delete().eq('id',c.id).then(()=>{toast2('Removido!');load()})}}>✕</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}
            </div>
          </div>)}

          {/* ══ PROFISSIONAIS ══ */}
          {tab==='profissionais'&&(<div className="au">
            <div className="card">
              <div className="card-hd">
                <div><span className="ch">Profissionais</span><span style={{fontSize:13,color:T.onSurfaceLow,marginLeft:8}}>({profs.length})</span></div>
                <button className="btn btn-primary btn-sm" onClick={()=>openM('prof',{full_name:'',phone:'',specialty:'',tipo:'',commission_pct:40,schedule_start:'08:00',schedule_end:'18:00'})}>+ Novo Profissional</button>
              </div>
              {profs.length===0&&<div style={{padding:24,textAlign:'center',color:T.onSurfaceLow,fontSize:13}}>Nenhum profissional cadastrado</div>}
              <div className="prof-grid">
                {profs.map(p=>(
                  <div key={p.id} className="pcard">
                    <div className="pav">{(p.full_name||'?')[0]}</div>
                    <div style={{fontFamily:'Noto Serif,serif',fontSize:16,fontWeight:600,marginBottom:3}}>{p.full_name}</div>
                    <div style={{fontSize:11,color:T.onSurfaceLow,marginBottom:8}}>{p.specialty}</div>
                    <div style={{marginBottom:12}}><Badge tipo={p.tipo}/></div>
                    <div style={{display:'flex',justifyContent:'center',gap:14,marginBottom:14}}>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontFamily:'Noto Serif,serif',fontSize:19,fontWeight:700,color:T.primary}}>{p.commission_pct}%</div>
                        <div style={{fontSize:9,color:T.onSurfaceLow,letterSpacing:1,textTransform:'uppercase'}}>Comissão</div>
                      </div>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:11,fontWeight:600,color:T.onSurface}}>{(p.schedule_start||'').slice(0,5)}–{(p.schedule_end||'').slice(0,5)}</div>
                        <div style={{fontSize:9,color:T.onSurfaceLow,letterSpacing:1,textTransform:'uppercase'}}>Expediente</div>
                      </div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                      <button className="btn btn-ghost btn-sm" style={{width:'100%',justifyContent:'center'}} onClick={()=>openM('prof',{...p,tipo:p.tipo||''})}>Editar</button>
                      <button className="btn btn-sm" style={{width:'100%',justifyContent:'center',background:T.amberPale,color:T.amber,border:'none',borderRadius:7,fontFamily:'Manrope',fontSize:11,fontWeight:600,cursor:'pointer'}}
                        onClick={()=>{if(window.confirm(`Resetar senha de ${p.full_name} para 123456?`))supabase.from('salon_professionals').update({senha:'123456'}).eq('id',p.id).then(()=>toast2(`Senha de ${p.full_name} resetada!`))}}>
                        🔑 Resetar Senha
                      </button>
                      <button className="btn btn-danger btn-sm" style={{width:'100%',justifyContent:'center'}} onClick={()=>{if(window.confirm('Remover?'))supabase.from('salon_professionals').update({active:false}).eq('id',p.id).then(()=>{toast2('Removido!');load()})}}>Remover</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>)}

          {/* ══ SERVIÇOS ══ */}
          {tab==='servicos'&&(<div className="au">
            <div className="card">
              <div className="card-hd">
                <div><span className="ch">Serviços</span><span style={{fontSize:13,color:T.onSurfaceLow,marginLeft:8}}>({srvs.length})</span></div>
                <button className="btn btn-primary btn-sm" onClick={()=>openM('srv',{name:'',categoria:'',tipo:'',price:'',duration_min:30})}>+ Novo Serviço</button>
              </div>
              <div className="srv-grid">
                {srvs.map(s=>(
                  <div key={s.id} className="scard">
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:3,textTransform:'uppercase',color:T.primaryLight,marginBottom:6}}>{s.service_categories?.name||'—'}</div>
                    <div style={{fontFamily:'Noto Serif,serif',fontSize:15,fontWeight:600,marginBottom:4}}>{s.name}</div>
                    <div style={{fontFamily:'Noto Serif,serif',fontSize:22,fontWeight:700,color:T.primary,marginBottom:4}}>{fmtCurrency(s.price)}</div>
                    <div style={{fontSize:11,color:T.onSurfaceLow,marginBottom:8}}>⏱ {s.duration_min} min</div>
                    <div style={{marginBottom:10}}><Badge tipo={s.tipo}/></div>
                    <div style={{display:'flex',gap:6}}>
                      <button className="btn btn-ghost btn-sm" style={{flex:1,justifyContent:'center'}} onClick={()=>openM('srv',{...s,categoria:s.service_categories?.name||''})}>Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>{if(window.confirm('Excluir?'))supabase.from('services').update({active:false}).eq('id',s.id).then(()=>{toast2('Removido!');load()})}}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>)}

          {/* ══ FINANCEIRO ══ */}
          {tab==='financeiro'&&(<div className="au">
            <div className="kpi-grid">
              {[
                {l:'Receita Total',v:fmtCurrency(fatTotal),bar:100,delta:'todos os períodos'},
                {l:'Receita Mês',v:fmtCurrency(fatMonth),bar:Math.min(100,fatMonth/fatTotal*100||0),delta:'mês atual'},
                {l:'Comissões Pagas',v:fmtCurrency(totalComissions),bar:Math.min(100,totalComissions/fatTotal*100||0),delta:fmtPct(fatTotal>0?totalComissions/fatTotal*100:0)+' da receita'},
                {l:'Receita Líquida',v:fmtCurrency(netRevenue),bar:Math.min(100,netRevenue/fatTotal*100||0),delta:'após comissões'},
              ].map(k=>(
                <div key={k.l} className="kpi">
                  <div className="kpi-l">{k.l}</div>
                  <div className="kpi-v" style={{marginTop:8}}>{k.v}</div>
                  <div className="kpi-delta" style={{color:T.onSurfaceLow}}>{k.delta}</div>
                  <div className="kpi-bar"><div className="kpi-bar-fill" style={{width:k.bar+'%'}}/></div>
                </div>
              ))}
            </div>
            <div className="fin-grid">
              <div className="card">
                <div className="card-hd"><span className="ch">Atendimentos Finalizados</span></div>
                <div style={{overflowX:'auto'}}>
                  <table className="tbl">
                    <thead><tr><th>Cliente</th><th>Serviço</th><th>Profissional</th><th>Valor</th></tr></thead>
                    <tbody>{agDone.map(a=>(
                      <tr key={a.id}>
                        <td style={{fontWeight:600}}>{a.cliName}</td>
                        <td style={{color:T.onSurfaceLow,fontSize:12}}>{a.srvName}</td>
                        <td style={{fontSize:12}}>{a.profName}</td>
                        <td style={{fontWeight:700,color:T.success}}>{fmtCurrency(a.paid)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
              <div className="card">
                <div className="card-hd"><span className="ch">Comissões por Profissional</span></div>
                <div style={{overflowX:'auto'}}>
                  <table className="tbl">
                    <thead><tr><th>Profissional</th><th>%</th><th>Faturado</th><th>Comissão</th></tr></thead>
                    <tbody>{profs.map(p=>{
                      const base=agDone.filter(a=>a.profName===p.full_name).reduce((s,a)=>s+a.paid,0)
                      const com=ags.filter(a=>a.professional_name===p.full_name&&a.status==='completed').reduce((s,a)=>s+(Number(a.commission_value)||0),0)
                      return(
                        <tr key={p.id}>
                          <td style={{fontWeight:600}}>{p.full_name}</td>
                          <td><span className="bdg" style={{background:T.primaryPale,color:T.primary}}>{p.commission_pct}%</span></td>
                          <td style={{fontSize:12}}>{fmtCurrency(base)}</td>
                          <td style={{fontWeight:700,color:T.primary}}>{fmtCurrency(com)}</td>
                        </tr>
                      )
                    })}</tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>)}

          </>)}
        </div>
      </div>

      {/* FAB mobile */}
      <button className="fab" onClick={()=>openM('ag',{client_name:'',service_name:'',professional_name:'',dmy:agDate,time:'',profFix:false})}>
        + Novo Agendamento
      </button>

      {/* ══ MODAIS ══ */}

      {/* Agendamento rápido (célula) */}
      {modal==='ag'&&form.profFix&&(
        <Modal title={`Agendar — ${form.professional_name}`} onClose={closeM}>
          <div style={{background:T.primaryPale,borderRadius:14,padding:'14px 16px',marginBottom:4,display:'flex',gap:16,flexWrap:'wrap',alignItems:'center'}}>
            {[['Profissional',form.professional_name],['Data',form.dmy],['Horário',form.time]].map(([l,v])=>(
              <div key={l}><div style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',color:T.primary,marginBottom:3,opacity:.7}}>{l}</div><div style={{fontSize:15,fontWeight:700,color:T.primary}}>{v}</div></div>
            ))}
            <Badge tipo={profs.find(x=>x.full_name===form.professional_name)?.tipo}/>
          </div>
          {!profs.find(x=>x.full_name===form.professional_name)?.tipo&&<Alert type="danger" c="⚠️ Profissional sem classe — edite o cadastro antes de agendar."/>}
          <Lbl c="Cliente *"/><Sel v={form.client_name} set={F('client_name')}><option value="">Selecionar cliente…</option>{clients.map(c=><option key={c.id}>{c.full_name}</option>)}</Sel>
          <Lbl c={`Serviço * — ${profs.find(x=>x.full_name===form.professional_name)?.tipo==='manicure'?'💅 Manicure apenas':'✂️ Cabelereiro apenas'}`}/>
          <Sel v={form.service_name||''} set={F('service_name')}><option value="">Selecionar serviço…</option>{srvsFor(form.professional_name).map(s=><option key={s.id} value={s.name}>{s.name} ({s.duration_min}min)</option>)}</Sel>
          {ferr&&<Alert type="danger" c={ferr}/>}
          <div style={{display:'flex',gap:10,marginTop:20}}>
            <button className="btn btn-primary" style={{flex:1}} onClick={saveAg}>Salvar</button>
            <button className="btn btn-ghost" onClick={closeM}>Cancelar</button>
          </div>
        </Modal>
      )}

      {/* Agendamento completo */}
      {modal==='ag'&&!form.profFix&&(
        <Modal title={form.id?'Editar Agendamento':'Novo Agendamento'} onClose={closeM}>
          <Lbl c="Cliente *"/><Sel v={form.client_name} set={F('client_name')}><option value="">Selecionar…</option>{clients.map(c=><option key={c.id}>{c.full_name}</option>)}</Sel>
          <Lbl c="Profissional *"/><Sel v={form.professional_name} set={v=>{setForm(f=>({...f,professional_name:v,service_name:'',time:''}));setFerr('')}}><option value="">Selecionar…</option>{profs.map(p=><option key={p.id}>{p.full_name}</option>)}</Sel>
          <Lbl c={`Serviço *${form.professional_name?' — '+srvsFor(form.professional_name).length+' compatíveis':''}`}/>
          <Sel v={form.service_name||''} set={v=>{setForm(f=>({...f,service_name:v,time:''}));setFerr('')}}><option value="">Selecionar…</option>{srvsFor(form.professional_name).map(s=><option key={s.id} value={s.name}>{s.name} ({s.duration_min}min)</option>)}</Sel>
          <Lbl c="Data *"/><input type="date" value={dmyToISO(form.dmy)||''} onChange={e=>setForm(f=>({...f,dmy:isoToDmy(e.target.value),time:''}))} className="inp"/>
          <Lbl c="Horário *"/><Sel v={form.time} set={F('time')}><option value="">Selecionar…</option>{freeSlotsFor(form.professional_name,form.dmy).map(h=><option key={h}>{h}</option>)}</Sel>
          {ferr&&<Alert type="danger" c={ferr}/>}
          <div style={{display:'flex',gap:10,marginTop:20}}>
            <button className="btn btn-primary" style={{flex:1}} onClick={saveAg}>Salvar</button>
            <button className="btn btn-ghost" onClick={closeM}>Cancelar</button>
          </div>
        </Modal>
      )}

      {/* Fechar atendimento */}
      {modal==='close'&&(
        <Modal title="Fechar Atendimento" onClose={closeM}>
          <Alert type="success" c={<><strong>{form.cliName}</strong> — {form.srvName}<br/><span style={{fontSize:11,opacity:.8}}>{form.profName} · {form.dmy} às {form.time}</span></>}/>
          <Lbl c="Valor do serviço"/><Inp v={fmtCurrency(form.price)} dis/>
          <Lbl c="Valor cobrado *"/><Inp v={form.paid_val} set={F('paid_val')} type="number" ph="Valor recebido"/>
          {form.paid_val&&Number(form.paid_val)<form.price&&<Alert type="amber" c={`⚠️ Desconto de ${fmtCurrency(form.price-Number(form.paid_val))}`}/>}
          <Lbl c="Forma de pagamento"/>
          <Sel v={form.payment_method||'cash'} set={F('payment_method')}>
            <option value="cash">💵 Dinheiro</option>
            <option value="pix">📱 PIX</option>
            <option value="credit_card">💳 Crédito</option>
            <option value="debit_card">💳 Débito</option>
          </Sel>
          {ferr&&<Alert type="danger" c={ferr}/>}
          <div style={{display:'flex',gap:10,marginTop:20}}>
            <button className="btn btn-primary" style={{flex:1,background:'linear-gradient(135deg,#3a7a4a,#2e6040)'}} onClick={closeAg}>✓ Confirmar</button>
            <button className="btn btn-ghost" onClick={closeM}>Cancelar</button>
          </div>
        </Modal>
      )}

      {/* Cliente */}
      {modal==='cli'&&(
        <Modal title={form.id?'Editar Cliente':'Novo Cliente'} onClose={closeM}>
          <Lbl c="Nome *"/><Inp v={form.full_name} set={F('full_name')} ph="Nome completo"/>
          <Lbl c="Telefone"/><Inp v={form.phone} set={F('phone')} ph="(11) 99999-0000"/>
          <Lbl c="E-mail"/><Inp v={form.email} set={F('email')} ph="email@email.com"/>
          {ferr&&<Alert type="danger" c={ferr}/>}
          <div style={{display:'flex',gap:10,marginTop:20}}>
            <button className="btn btn-primary" style={{flex:1}} onClick={saveCli}>Salvar</button>
            <button className="btn btn-ghost" onClick={closeM}>Cancelar</button>
          </div>
        </Modal>
      )}

      {/* Profissional */}
      {modal==='prof'&&(
        <Modal title={form.id?'Editar Profissional':'Novo Profissional'} onClose={closeM}>
          <Lbl c="Nome *"/><Inp v={form.full_name} set={F('full_name')} ph="Nome completo"/>
          <Lbl c="Telefone"/><Inp v={form.phone} set={F('phone')} ph="(11) 99999-0000"/>
          <Lbl c="Especialidade"/><Inp v={form.specialty} set={F('specialty')} ph="Ex: Cabelereira"/>
          <Lbl c="Classe *"/>
          <Sel v={form.tipo||''} set={F('tipo')}>
            <option value="">Selecionar classe…</option>
            <option value="cabelereiro">✂️ Cabelereiro / Barbeiro</option>
            <option value="manicure">💅 Manicure / Pedicure / Estética</option>
            <option value="sobrancelha">🪡 Designer de Sobrancelha</option>
          </Sel>
          {form.tipo&&<Alert type="info" c={
            form.tipo==='manicure'?'💅 Realizará: Manicure, Pedicure, Estética':
            form.tipo==='sobrancelha'?'🪡 Realizará: Design de Sobrancelha, Depilação facial':
            '✂️ Realizará: Corte, Barba, Coloração, Escova, Tratamentos'
          }/>}
          <Lbl c="Comissão (%)"/><Inp v={form.commission_pct} set={F('commission_pct')} type="number" ph="40"/>
          <Lbl c="Início expediente"/><Sel v={(form.schedule_start||'08:00').slice(0,5)} set={F('schedule_start')}>{SLOTS.map(h=><option key={h}>{h}</option>)}</Sel>
          <Lbl c="Fim expediente"/><Sel v={(form.schedule_end||'18:00').slice(0,5)} set={F('schedule_end')}>{SLOTS.map(h=><option key={h}>{h}</option>)}</Sel>
          {!form.id&&<Alert type="info" c="🔑 Senha de acesso padrão: 123456"/>}
          {ferr&&<Alert type="danger" c={ferr}/>}
          <div style={{display:'flex',gap:10,marginTop:20}}>
            <button className="btn btn-primary" style={{flex:1}} onClick={saveProf}>Salvar</button>
            <button className="btn btn-ghost" onClick={closeM}>Cancelar</button>
          </div>
        </Modal>
      )}

      {/* Serviço */}
      {modal==='srv'&&(
        <Modal title={form.id?'Editar Serviço':'Novo Serviço'} onClose={closeM}>
          <Lbl c="Nome *"/><Inp v={form.name} set={F('name')} ph="Ex: Corte Feminino"/>
          <Lbl c="Categoria"/><Sel v={form.categoria||''} set={v=>setForm(f=>({...f,categoria:v,category_id:cats.find(c=>c.name===v)?.id}))}><option value="">Selecionar…</option>{cats.map(c=><option key={c.id}>{c.name}</option>)}</Sel>
          <Lbl c="Classe *"/><Sel v={form.tipo||''} set={F('tipo')}><option value="">Selecionar…</option><option value="cabelereiro">✂️ Cabelereiro / Barbeiro</option><option value="manicure">💅 Manicure / Pedicure / Estética</option><option value="sobrancelha">🪡 Designer de Sobrancelha</option></Sel>
          {form.tipo&&<Alert type="info" c={
            form.tipo==='manicure'?'💅 Somente Manicure pode realizar':
            form.tipo==='sobrancelha'?'🪡 Somente Designer de Sobrancelha pode realizar':
            '✂️ Somente Cabelereiro pode realizar'
          }/>}
          <Lbl c="Preço (R$)"/><Inp v={form.price} set={F('price')} type="number" ph="0"/>
          <Lbl c="Duração (min)"/><Inp v={form.duration_min} set={F('duration_min')} type="number" ph="30"/>
          {ferr&&<Alert type="danger" c={ferr}/>}
          <div style={{display:'flex',gap:10,marginTop:20}}>
            <button className="btn btn-primary" style={{flex:1}} onClick={saveSrv}>Salvar</button>
            <button className="btn btn-ghost" onClick={closeM}>Cancelar</button>
          </div>
        </Modal>
      )}

      {/* MODAL EDITAR AGENDAMENTO */}
      {modal==='editAg'&&(
        <Modal title="Editar Agendamento" onClose={closeM}>
          <div style={{background:T.surfaceLow,borderRadius:14,padding:'14px 16px',marginBottom:4}}>
            <div style={{fontSize:11,color:T.onSurfaceLow,marginBottom:4}}>Cliente · Serviço</div>
            <div style={{fontSize:15,fontWeight:700,color:T.onSurface}}>{form.client_name}</div>
            <div style={{fontSize:13,color:T.onSurfaceMed}}>{form.service_name}</div>
          </div>
          <div className="alert alert-info" style={{marginTop:8,marginBottom:4}}>
            ✏️ Você pode alterar o <strong>profissional</strong>, <strong>data</strong> e <strong>horário</strong>. O profissional deve ser da mesma classe do serviço.
          </div>
          <Lbl c="Profissional *"/>
          <Sel v={form.professional_name||''} set={v=>{setForm(f=>({...f,professional_name:v,time:''}));setFerr('')}}>
            <option value="">Selecionar...</option>
            {profsFor(form.service_name).map(p=><option key={p.id} value={p.full_name}>{p.full_name} — {p.specialty}</option>)}
          </Sel>
          {form.professional_name&&(
            <div style={{fontSize:11,color:T.onSurfaceLow,marginTop:6}}>
              ✅ Profissionais listados são da mesma classe do serviço
            </div>
          )}
          <Lbl c="Data *"/>
          <input type="date" value={dmyToISO(form.dmy)||''} onChange={e=>setForm(f=>({...f,dmy:isoToDmy(e.target.value),time:''}))} className="inp"/>
          <Lbl c="Horário *"/>
          <Sel v={form.time||''} set={F('time')}>
            <option value="">Selecionar...</option>
            {freeSlotsFor(form.professional_name,form.dmy).map(h=><option key={h} value={h}>{h}</option>)}
          </Sel>
          {ferr&&<Alert type="danger" c={ferr}/>}
          <div style={{display:'flex',gap:10,marginTop:20}}>
            <button className="btn btn-primary" style={{flex:1}} onClick={saveEditAg}>Salvar Alteração</button>
            <button className="btn btn-ghost" onClick={closeM}>Cancelar</button>
          </div>
        </Modal>
      )}

      {toast&&<div className="toast" style={{background:toast.ok?`linear-gradient(135deg,${T.success},#2e6040)`:`linear-gradient(135deg,${T.danger},#8b2020)`}}>{toast.m}</div>}
    </>
  )
}

// ══════════════════════════════════════════════════════
// PROFISSIONAL PANEL
// ══════════════════════════════════════════════════════
function ProfPanel({prof,onLogout}){
  const [tab,setTab]=useState('hoje')
  const [ld,setLd]=useState(false)
  const [toast,setToast]=useState(null)
  const [modal,setModal]=useState(null)
  const [form,setForm]=useState({})
  const [ferr,setFerr]=useState('')
  const [ags,setAgs]=useState([])
  const [blocks,setBlocks]=useState([])

  const toast2=(m,ok=true)=>{setToast({m,ok});setTimeout(()=>setToast(null),3200)}
  const F=k=>v=>setForm(f=>({...f,[k]:v}))
  const closeM=()=>{setModal(null);setFerr('')}
  const openM=(t,d={})=>{setForm({...d});setModal(t);setFerr('')}

  const load=useCallback(async()=>{
    setLd(true)
    const[r1,r2]=await Promise.all([
      supabase.from('salon_bookings').select('*,created_at').eq('professional_name',prof.full_name).order('booking_date').order('start_time'),
      supabase.from('salon_blocks').select('*').eq('professional_name',prof.full_name).order('block_date').order('start_time'),
    ])
    setAgs(r1.data||[]);setBlocks(r2.data||[])
    setLd(false)
  },[prof.full_name])

  useEffect(()=>{load()},[load])

  const rows=ags.map(a=>({
    id:a.id,dmy:isoToDmy(a.booking_date),time:(a.start_time||'').slice(0,5),
    cliName:a.client_name||'',srvName:a.service_name||'',status:a.status,
    price:Number(a.service_price)||Number(a.price_charged)||0,
    paid:Number(a.price_charged)||0,
    comPct:Number(a.commission_pct)||0,comVal:Number(a.commission_value)||0,
    durMin:Number(a.duration_min)||30,
  }))

  const today=todayStr()
  const todayRows=rows.filter(a=>a.dmy===today&&a.status!=='cancelled')
  const nextRows=rows.filter(a=>a.dmy>today&&a.status!=='cancelled'&&a.status!=='completed')
  const done=rows.filter(a=>a.status==='completed')
  const mo=new Date().getMonth(),yr=new Date().getFullYear()
  const monthRows=done.filter(a=>{const[,m,y]=a.dmy.split('/');return+m-1===mo&&+y===yr})
  const fatToday=todayRows.filter(a=>a.status==='completed').reduce((s,a)=>s+a.paid,0)
  const comToday=todayRows.filter(a=>a.status==='completed').reduce((s,a)=>s+a.comVal,0)
  const fatMonth=monthRows.reduce((s,a)=>s+a.paid,0)
  const comMonth=monthRows.reduce((s,a)=>s+a.comVal,0)

  async function finalizar(){
    if(!form.paid_val){setFerr('Informe o valor cobrado');return}
    const val=Number(form.paid_val),pct=prof.commission_pct||0
    const{error}=await supabase.from('salon_bookings').update({status:'completed',price_charged:val,payment_method:form.payment_method||'cash',commission_pct:pct,commission_value:Math.round(val*(pct/100)*100)/100}).eq('id',form.id)
    if(error){setFerr('Erro: '+error.message);return}
    closeM();toast2('Finalizado ✓');load()
  }

  async function saveBlock(){
    if(!form.block_date||!form.st||!form.et){setFerr('Preencha data, início e fim');return}
    if(form.st>=form.et){setFerr('Início deve ser antes do fim');return}
    const pl={professional_name:prof.full_name,block_date:form.block_date,start_time:form.st+':00',end_time:form.et+':00',reason:form.reason||''}
    const{error}=form.id?await supabase.from('salon_blocks').update(pl).eq('id',form.id):await supabase.from('salon_blocks').insert(pl)
    if(error){setFerr('Erro: '+error.message);return}
    closeM();toast2('Bloqueio salvo!');load()
  }

  const tabs2=[{id:'hoje',label:'Hoje',ic:'📅'},{id:'proximos',label:'Próximos',ic:'🗓'},{id:'agendar',label:'Agendar',ic:'➕'},{id:'notificacoes',label:'Notificações',ic:'🔔'},{id:'rendimentos',label:'Rendimentos',ic:'◎'},{id:'bloqueios',label:'Bloqueios',ic:'🚫'},{id:'senha',label:'Minha Senha',ic:'🔑'}]

  // ── AGENDAR (profissional agenda para si mesmo) ──────
  const [agSrvs,setAgSrvs]=useState([])
  const [agClients,setAgClients]=useState([])
  const [agForm,setAgForm]=useState({client_name:'',service_name:'',dmy:todayStr(),time:''})
  const [agErr,setAgErr]=useState('')

  useEffect(()=>{
    supabase.from('services').select('*').eq('active',true).eq('tipo',prof.tipo||'cabelereiro').then(({data})=>setAgSrvs(data||[]))
    supabase.from('salon_clients').select('*').order('full_name').then(({data})=>setAgClients(data||[]))
  },[prof.tipo])

  const AF=k=>v=>setAgForm(f=>({...f,[k]:v}))

  function freeSlotsProf(dmy){
    if(!dmy)return SLOTS
    const hi=(prof.schedule_start||'08:00').slice(0,5)
    const hf=(prof.schedule_end||'18:00').slice(0,5)
    const isCabelereiro=(prof.tipo||'cabelereiro')==='cabelereiro'
    const srvNow=agSrvs.find(x=>x.name===agForm.service_name)
    const durNow=Number(srvNow?.duration_min)||30
    return SLOTS.filter(h=>{
      if(h<hi||h>hf)return false
      if(!isFuture(dmy,h))return false
      const ini=toMin(h),fim=ini+durNow
      if(fim>toMin(hf)+1)return false
      // Manicure: bloqueia sobreposição
      if(!isCabelereiro){
        const taken=rows.filter(a=>a.dmy===dmy&&a.status!=='cancelled')
          .map(a=>{const s=agSrvs.find(x=>x.name===a.srvName);const dur=Number(a.durMin)||Number(s?.duration_min)||30;return{ini:toMin(a.time),fim:toMin(a.time)+dur}})
        if(taken.some(t=>ini<t.fim&&fim>t.ini))return false
      }
      // Cabelereiro: apenas bloqueia horário exato
      if(isCabelereiro){
        if(rows.filter(a=>a.dmy===dmy&&a.status!=='cancelled').map(a=>a.time).includes(h))return false
      }
      return true
    })
  }

  async function saveAgProf(){
    setAgErr('')
    if(!agForm.client_name||!agForm.service_name||!agForm.dmy||!agForm.time){setAgErr('Preencha todos os campos');return}
    const s=agSrvs.find(x=>x.name===agForm.service_name)
    const{error}=await supabase.from('salon_bookings').insert({
      client_name:agForm.client_name,
      service_name:agForm.service_name,
      professional_name:prof.full_name,
      booking_date:dmyToISO(agForm.dmy),
      start_time:agForm.time+':00',
      status:'scheduled',
      price_charged:s?.price||0,
      service_price:s?.price||0,
      duration_min:s?.duration_min||30,
    })
    if(error){setAgErr('Erro: '+error.message);return}
    shToast('Agendamento criado!');setAgForm({client_name:'',service_name:'',dmy:todayStr(),time:''});load()
  }

  // ── ALTERAR SENHA ────────────────────────────────────
  const [senhaAtual,setSenhaAtual]=useState('')
  const [senhaNova,setSenhaNova]=useState('')
  const [senhaConf,setSenhaConf]=useState('')
  const [senhaErr,setSenhaErr]=useState('')
  const [senhaOk,setSenhaOk]=useState('')

  async function alterarSenha(){
    setSenhaErr('');setSenhaOk('')
    if(!senhaAtual){setSenhaErr('Informe a senha atual');return}
    if(senhaAtual!==(prof.senha||'123456')){setSenhaErr('Senha atual incorreta');return}
    if(!senhaNova||senhaNova.length<4){setSenhaErr('Nova senha deve ter pelo menos 4 caracteres');return}
    if(senhaNova!==senhaConf){setSenhaErr('As senhas não coincidem');return}
    const{error}=await supabase.from('salon_professionals').update({senha:senhaNova}).eq('id',prof.id)
    if(error){setSenhaErr('Erro: '+error.message);return}
    prof.senha=senhaNova
    setSenhaOk('✅ Senha alterada com sucesso!')
    setSenhaAtual('');setSenhaNova('');setSenhaConf('')
  }

  // ── NOTIFICAÇÕES ─────────────────────────────────────
  // Busca agendamentos recentes (últimas 48h criados/cancelados)
  const notifs=ags.filter(a=>{
    const created=new Date(a.created_at||0)
    const diff=(Date.now()-created.getTime())/(1000*60*60)
    return diff<=48
  }).sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0))

  return(
    <>
      <style>{G}</style>
      <style>{`body{background:${T.surfaceLow}!important;}.pw{max-width:680px;margin:0 auto;padding:24px 18px 60px;}`}</style>
      <div className="pw">
        <div className="card au" style={{marginBottom:16}}>
          <div style={{padding:'18px 22px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:50,height:50,borderRadius:'50%',background:`linear-gradient(135deg,${T.primaryLight},${T.primary})`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Noto Serif,serif',fontSize:20,fontWeight:700,color:'white',flexShrink:0,boxShadow:`0 4px 16px rgba(119,90,25,.2)`}}>{(prof.full_name||'?')[0]}</div>
              <div>
                <div style={{fontFamily:'Noto Serif,serif',fontSize:20,fontWeight:600}}>Olá, {prof.full_name.split(' ')[0]}</div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:3,flexWrap:'wrap'}}>
                  <span style={{fontSize:11,color:T.onSurfaceLow}}>{prof.specialty}</span>
                  <Badge tipo={prof.tipo}/>
                  <span style={{fontSize:11,color:T.onSurfaceLow}}>{prof.commission_pct}% comissão</span>
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <div style={{padding:'6px 12px',background:T.primaryPale,borderRadius:20,fontSize:11,fontWeight:600,color:T.primary,whiteSpace:'nowrap'}}>{new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'})}</div>
              <button onClick={onLogout} className="btn btn-ghost btn-sm">Sair</button>
            </div>
          </div>
        </div>

        <div className="kpi-grid au1">
          {[
            {l:'Hoje',v:todayRows.length,bar:Math.min(100,todayRows.length/10*100),delta:'agendamentos'},
            {l:'Finalizados',v:todayRows.filter(a=>a.status==='completed').length,bar:0,delta:'hoje'},
            {l:'Fat. Hoje',v:fmtCurrency(fatToday),bar:Math.min(100,fatToday/1000*100),delta:'faturado'},
            {l:'Com. Hoje',v:fmtCurrency(comToday),bar:Math.min(100,comToday/500*100),delta:'sua comissão'},
          ].map(k=>(
            <div key={k.l} className="kpi">
              <div className="kpi-l">{k.l}</div>
              <div className="kpi-v" style={{marginTop:8,fontSize:22}}>{k.v}</div>
              <div className="kpi-delta" style={{color:T.onSurfaceLow}}>{k.delta}</div>
            </div>
          ))}
        </div>

        <div className="card au2">
          <div className="tabs" style={{borderBottom:`1px solid ${T.surfaceLow}`}}>
            {tabs2.map(t=><button key={t.id} className={`tab${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>{t.ic} {t.label}</button>)}
          </div>
          <div style={{padding:18}}>
            {ld&&<div style={{textAlign:'center',padding:32,color:T.onSurfaceLow,fontSize:13}}>Carregando…</div>}
            {!ld&&(<>
              {tab==='hoje'&&(todayRows.length===0?<div style={{textAlign:'center',padding:'28px',color:T.onSurfaceLow,fontSize:13}}>Nenhum agendamento hoje 🌸</div>
              :todayRows.map(a=>(
                <div key={a.id} className={`ag-card${a.status==='completed'?' done':''}`}>
                  <div className="tp" style={{background:a.status==='completed'?T.successPale:T.primaryPale,minWidth:52}}>
                    <div style={{fontSize:12,fontWeight:700,color:a.status==='completed'?T.success:T.primary}}>{a.time}</div>
                    <div style={{fontSize:9,color:T.onSurfaceLow}}>{a.durMin}m</div>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.cliName}</div>
                    <div style={{fontSize:11,color:T.onSurfaceLow}}>{a.srvName}</div>
                    {a.status==='completed'&&<div style={{fontSize:11,fontWeight:600,color:T.success}}>{fmtCurrency(a.paid)} · comissão {fmtCurrency(a.comVal)}</div>}
                  </div>
                  {a.status==='completed'?<span style={{fontSize:11,fontWeight:700,color:T.success,flexShrink:0}}>✓</span>
                  :<button className="btn btn-success btn-sm" onClick={()=>openM('fin',{...a,paid_val:a.price})}>✓ Finalizar</button>}
                </div>
              )))}

              {tab==='proximos'&&(nextRows.length===0?<div style={{textAlign:'center',padding:'28px',color:T.onSurfaceLow,fontSize:13}}>Nenhum agendamento próximo</div>
              :nextRows.map(a=>(
                <div key={a.id} className="ag-card">
                  <div className="tp" style={{background:T.primaryPale,minWidth:56}}>
                    <div style={{fontSize:10,fontWeight:600,color:T.primary}}>{a.dmy.slice(0,5)}</div>
                    <div style={{fontSize:12,fontWeight:700,color:T.primary}}>{a.time}</div>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.cliName}</div>
                    <div style={{fontSize:11,color:T.onSurfaceLow}}>{a.srvName}</div>
                  </div>
                  <span className="bdg" style={{background:T.amberPale,color:T.amber,flexShrink:0}}>Agendado</span>
                </div>
              )))}

              {tab==='rendimentos'&&(<>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                  {[{l:'Fat. Mês',v:fmtCurrency(fatMonth)},{l:'Com. Mês',v:fmtCurrency(comMonth)}].map(k=>(
                    <div key={k.l} style={{background:T.primaryPale,borderRadius:14,padding:'16px 14px'}}>
                      <div style={{fontSize:9,fontWeight:700,letterSpacing:3,textTransform:'uppercase',color:T.primary,marginBottom:6,opacity:.7}}>{k.l}</div>
                      <div style={{fontFamily:'Noto Serif,serif',fontSize:24,fontWeight:700,color:T.primary}}>{k.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:T.surfaceLow,borderRadius:14,padding:'14px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:14}}>
                  <div style={{width:46,height:46,borderRadius:'50%',background:`linear-gradient(135deg,${T.primaryLight},${T.primary})`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Noto Serif,serif',fontSize:17,fontWeight:700,color:'white',flexShrink:0}}>{prof.commission_pct}%</div>
                  <div><div style={{fontSize:13,fontWeight:600,marginBottom:2}}>Comissão atual: {prof.commission_pct}%</div><div style={{fontSize:11,color:T.onSurfaceLow,lineHeight:1.5}}>Fixada no fechamento — não muda retroativamente.</div></div>
                </div>
                {monthRows.length===0?<div style={{textAlign:'center',padding:20,color:T.onSurfaceLow,fontSize:13}}>Nenhum atendimento finalizado este mês</div>
                :monthRows.map(a=>(
                  <div key={a.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderTop:`1px solid ${T.surfaceLow}`}}>
                    <div><div style={{fontSize:13,fontWeight:600}}>{a.srvName}</div><div style={{fontSize:11,color:T.onSurfaceLow}}>{a.cliName} · {a.dmy} · {a.comPct}%</div></div>
                    <div style={{textAlign:'right'}}><div style={{fontSize:11,color:T.onSurfaceLow}}>{fmtCurrency(a.paid)}</div><div style={{fontSize:14,fontWeight:700,color:T.primary}}>+{fmtCurrency(a.comVal)}</div></div>
                  </div>
                ))}
              </>)}

              {tab==='agendar'&&(<>
                <div style={{marginBottom:16}}>
                  <div style={{fontFamily:'Noto Serif,serif',fontSize:17,fontWeight:600,marginBottom:4}}>Novo Agendamento</div>
                  <div style={{fontSize:12,color:T.onSurfaceLow}}>Agende um serviço em sua própria agenda</div>
                </div>
                <Lbl c="Cliente *"/>
                <Sel v={agForm.client_name} set={AF('client_name')}>
                  <option value="">Selecionar cliente…</option>
                  {agClients.map(c=><option key={c.id} value={c.full_name}>{c.full_name}</option>)}
                </Sel>
                <Lbl c="Serviço *"/>
                <Sel v={agForm.service_name} set={v=>setAgForm(f=>({...f,service_name:v,time:''}))} >
                  <option value="">Selecionar serviço…</option>
                  {agSrvs.map(s=><option key={s.id} value={s.name}>{s.name} ({s.duration_min}min) — R$ {s.price}</option>)}
                </Sel>
                <Lbl c="Data *"/>
                <input type="date" value={dmyToISO(agForm.dmy)||''} onChange={e=>setAgForm(f=>({...f,dmy:isoToDmy(e.target.value),time:''}))} className="inp"/>
                <Lbl c="Horário *"/>
                <Sel v={agForm.time} set={AF('time')}>
                  <option value="">Selecionar…</option>
                  {freeSlotsProf(agForm.dmy).map(h=><option key={h} value={h}>{h}</option>)}
                </Sel>
                {agErr&&<Alert type="danger" c={agErr}/>}
                <button className="btn btn-primary" style={{width:'100%',marginTop:20,justifyContent:'center'}} onClick={saveAgProf}>
                  Confirmar Agendamento
                </button>
              </>)}

              {tab==='notificacoes'&&(<>
                <div style={{marginBottom:16}}>
                  <div style={{fontFamily:'Noto Serif,serif',fontSize:17,fontWeight:600,marginBottom:4}}>Notificações</div>
                  <div style={{fontSize:12,color:T.onSurfaceLow}}>Agendamentos das últimas 48 horas</div>
                </div>
                {notifs.length===0
                  ? <div style={{textAlign:'center',padding:'28px',color:T.onSurfaceLow,fontSize:13}}>Nenhuma notificação recente 🔔</div>
                  : notifs.map(a=>{
                      const isoDate=isoToDmy(a.booking_date)
                      const time=(a.start_time||'').slice(0,5)
                      const cancelled=a.status==='cancelled'
                      const cli=agClients.find(c=>c.full_name===a.client_name)
                      return(
                        <div key={a.id} style={{
                          padding:'14px 16px',borderRadius:14,marginBottom:10,
                          background:cancelled?T.dangerPale:T.successPale,
                          border:`1px solid ${cancelled?T.danger+'22':T.success+'22'}`
                        }}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                            <span style={{fontSize:16}}>{cancelled?'❌':'✅'}</span>
                            <span style={{fontSize:12,fontWeight:700,color:cancelled?T.danger:T.success}}>
                              {cancelled?'Agendamento Cancelado':'Novo Agendamento'}
                            </span>
                            <span style={{fontSize:10,color:T.onSurfaceLow,marginLeft:'auto'}}>
                              {isoDate} às {time}
                            </span>
                          </div>
                          <div style={{fontSize:14,fontWeight:600,color:T.onSurface}}>{a.client_name}</div>
                          <div style={{fontSize:12,color:T.onSurfaceMed,marginTop:2}}>{a.service_name}</div>
                          {cli?.phone&&(
                            <div style={{fontSize:12,color:T.primary,marginTop:6,fontWeight:600}}>
                              📱 {cli.phone}
                            </div>
                          )}
                        </div>
                      )
                    })
                }
              </>)}

              {tab==='bloqueios'&&(<>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8}}>
                  <span style={{fontSize:13,color:T.onSurfaceLow}}>Indisponibilidades na agenda</span>
                  <button className="btn btn-primary btn-sm" onClick={()=>openM('blk',{block_date:'',st:'',et:'',reason:''})}>+ Novo Bloqueio</button>
                </div>
                {blocks.length===0?<div style={{textAlign:'center',padding:28,color:T.onSurfaceLow,fontSize:13}}>Nenhum bloqueio cadastrado</div>
                :blocks.map(b=>(
                  <div key={b.id} style={{display:'flex',alignItems:'center',gap:12,padding:'13px',borderRadius:12,background:T.surfaceLow,marginBottom:8}}>
                    <div style={{width:46,height:46,borderRadius:12,background:T.surfaceMed,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <div style={{fontSize:10,fontWeight:600,color:T.onSurfaceMed}}>{isoToDmy(b.block_date).slice(0,5)}</div>
                      <div style={{fontSize:9,color:T.onSurfaceLow}}>{(b.start_time||'').slice(0,5)}</div>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600}}>{(b.start_time||'').slice(0,5)} – {(b.end_time||'').slice(0,5)}</div>
                      <div style={{fontSize:11,color:T.onSurfaceLow}}>{isoToDmy(b.block_date)} · {b.reason||'Sem motivo'}</div>
                    </div>
                    <div style={{display:'flex',gap:6,flexShrink:0}}>
                      <button className="btn btn-ghost btn-sm" onClick={()=>openM('blk',{...b,id:b.id,st:(b.start_time||'').slice(0,5),et:(b.end_time||'').slice(0,5)})}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>{if(window.confirm('Remover?'))supabase.from('salon_blocks').delete().eq('id',b.id).then(()=>{toast2('Removido!');load()})}}>✕</button>
                    </div>
                  </div>
                ))}
              </>)}

              {tab==='senha'&&(<>
                <div style={{marginBottom:20}}>
                  <div style={{fontFamily:'Noto Serif,serif',fontSize:17,fontWeight:600,marginBottom:4}}>Alterar Senha</div>
                  <div style={{fontSize:12,color:T.onSurfaceLow}}>Altere sua senha de acesso ao sistema</div>
                </div>
                <Lbl c="Senha atual *"/>
                <input type="password" value={senhaAtual} onChange={e=>{setSenhaAtual(e.target.value);setSenhaErr('');setSenhaOk('')}} placeholder="Senha atual" className="inp"/>
                <Lbl c="Nova senha *"/>
                <input type="password" value={senhaNova} onChange={e=>{setSenhaNova(e.target.value);setSenhaErr('');setSenhaOk('')}} placeholder="Mínimo 4 caracteres" className="inp"/>
                <Lbl c="Confirmar nova senha *"/>
                <input type="password" value={senhaConf} onChange={e=>{setSenhaConf(e.target.value);setSenhaErr('');setSenhaOk('')}} placeholder="Repita a nova senha" className="inp"/>
                {senhaErr&&<Alert type="danger" c={senhaErr}/>}
                {senhaOk&&<Alert type="success" c={senhaOk}/>}
                <button className="btn btn-primary" style={{width:'100%',marginTop:20,justifyContent:'center'}} onClick={alterarSenha}>
                  Salvar Nova Senha
                </button>
                <div style={{marginTop:12,fontSize:11,color:T.onSurfaceLow,textAlign:'center'}}>
                  Senha padrão inicial: 123456
                </div>
              </>)}

            </>)}
          </div>
        </div>
      </div>

      {modal==='fin'&&(
        <Modal title="Finalizar Atendimento" onClose={closeM}>
          <Alert type="success" c={<><strong>{form.cliName}</strong> — {form.srvName}<br/><span style={{fontSize:11,opacity:.8}}>{form.dmy} às {form.time}</span></>}/>
          <Lbl c="Valor do serviço"/><Inp v={fmtCurrency(form.price)} dis/>
          <Lbl c="Valor cobrado *"/><Inp v={form.paid_val} set={F('paid_val')} type="number" ph="Valor recebido"/>
          {form.paid_val&&<Alert type="info" c={`💎 Sua comissão (${prof.commission_pct}%): ${fmtCurrency(Number(form.paid_val)*(prof.commission_pct/100))}`}/>}
          <Lbl c="Pagamento"/><Sel v={form.payment_method||'cash'} set={F('payment_method')}><option value="cash">💵 Dinheiro</option><option value="pix">📱 PIX</option><option value="credit_card">💳 Crédito</option><option value="debit_card">💳 Débito</option></Sel>
          {ferr&&<Alert type="danger" c={ferr}/>}
          <div style={{display:'flex',gap:10,marginTop:20}}>
            <button className="btn btn-primary" style={{flex:1,background:'linear-gradient(135deg,#3a7a4a,#2e6040)'}} onClick={finalizar}>✓ Confirmar</button>
            <button className="btn btn-ghost" onClick={closeM}>Cancelar</button>
          </div>
        </Modal>
      )}

      {modal==='blk'&&(
        <Modal title={form.id?'Editar Bloqueio':'Bloquear Horário'} onClose={closeM}>
          <Alert type="amber" c="🚫 Horários bloqueados ficam indisponíveis para agendamento."/>
          <Lbl c="Data *"/><input type="date" min={todayISO()} value={form.block_date||''} onChange={e=>setForm(f=>({...f,block_date:e.target.value}))} className="inp"/>
          <Lbl c="Início *"/><Sel v={form.st||''} set={F('st')}><option value="">Selecionar…</option>{SLOTS.map(h=><option key={h}>{h}</option>)}</Sel>
          <Lbl c="Fim *"/><Sel v={form.et||''} set={F('et')}><option value="">Selecionar…</option>{SLOTS.filter(h=>h>(form.st||'00:00')).map(h=><option key={h}>{h}</option>)}</Sel>
          <Lbl c="Motivo (opcional)"/><Inp v={form.reason} set={F('reason')} ph="Ex: Consulta médica…"/>
          {ferr&&<Alert type="danger" c={ferr}/>}
          <div style={{display:'flex',gap:10,marginTop:20}}>
            <button className="btn btn-primary" style={{flex:1}} onClick={saveBlock}>Salvar</button>
            <button className="btn btn-ghost" onClick={closeM}>Cancelar</button>
          </div>
        </Modal>
      )}

      {toast&&<div className="toast" style={{background:toast.ok?`linear-gradient(135deg,${T.success},#2e6040)`:`linear-gradient(135deg,${T.danger},#8b2020)`}}>{toast.m}</div>}
    </>
  )
}

// ══════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════
export default function Joudat(){
  const [mode,setMode]=useState(null)
  const [profData,setProfData]=useState(null)
  if(mode==='admin')   return <Admin onLogout={()=>setMode(null)}/>
  if(mode==='prof')    return <ProfPanel prof={profData} onLogout={()=>{setMode(null);setProfData(null)}}/>
  return <Login onAdmin={()=>setMode('admin')} onProf={p=>{setProfData(p);setMode('prof')}}/>
}
