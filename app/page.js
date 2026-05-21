'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
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

// ── FUNCIONAMENTO DO SALÃO ────────────────────────────
const DIAS_KEY_MAP = {0:'dom',1:'seg',2:'ter',3:'qua',4:'qui',5:'sex',6:'sab'}
const DEFAULT_FUNC = {
  seg:{ativo:true,ini:'08:00',fim:'18:00'},ter:{ativo:true,ini:'08:00',fim:'18:00'},
  qua:{ativo:true,ini:'08:00',fim:'18:00'},qui:{ativo:true,ini:'08:00',fim:'18:00'},
  sex:{ativo:true,ini:'08:00',fim:'18:00'},sab:{ativo:true,ini:'08:00',fim:'13:00'},
  dom:{ativo:false,ini:'08:00',fim:'12:00'}
}
function getFuncionamento(){
  try{
    const s=typeof window!=='undefined'?localStorage.getItem('joudat_funcionamento'):null
    return s?JSON.parse(s):DEFAULT_FUNC
  }catch{return DEFAULT_FUNC}
}
// Retorna true se a data (dd/mm/yyyy) está dentro do funcionamento do salão
function isDiaAberto(dmy){
  if(!dmy)return false
  const[dd,mm,yyyy]=dmy.split('/')
  const dow=new Date(Number(yyyy),Number(mm)-1,Number(dd)).getDay()
  const key=DIAS_KEY_MAP[dow]
  const func=getFuncionamento()
  return !!(func[key]?.ativo)
}
// Retorna slots válidos dentro do horário de funcionamento do salão naquele dia
function getSalonSlots(dmy){
  if(!dmy)return []
  const[dd,mm,yyyy]=dmy.split('/')
  const dow=new Date(Number(yyyy),Number(mm)-1,Number(dd)).getDay()
  const key=DIAS_KEY_MAP[dow]
  const func=getFuncionamento()
  const dia=func[key]
  if(!dia?.ativo)return []
  return SLOTS.filter(h=>h>=dia.ini&&h<dia.fim)
}

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
.tab{flex-shrink:0;padding:12px 10px;background:none;border:none;border-bottom:2px solid transparent;font-family:'Manrope';font-size:11px;font-weight:600;color:${T.onSurfaceLow};cursor:pointer;display:flex;align-items:center;gap:4px;transition:color .18s;margin-bottom:-1px;white-space:nowrap;}
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
const Badge = ({tipo})=>
  tipo==='manicure'?<span className="bdg bdg-nail">💅 Manicure</span>:
  tipo==='sobrancelha'?<span className="bdg" style={{background:'#f8e8f0',color:'#880e4f'}}>🪡 Sobrancelha</span>:
  <span className="bdg bdg-hair">✂️ Cabelereiro</span>

// ══════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════
function Login({onAdmin,onProf,onCliente,salonName='Joudat Salon'}){
  const [u,setU]=useState('')
  const [p,setP]=useState('')
  const [err,setErr]=useState('')
  const [ld,setLd]=useState(false)

  async function go(){
    if(!u.trim()){setErr('Informe seu nome');return}
    if(!p){setErr('Informe sua senha');return}
    setLd(true);setErr('')
    try{
      const res=await fetch('/api/login',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({usuario:u.trim(),senha:p})
      })
      const json=await res.json()
      setLd(false)
      if(!json.ok){setErr(json.erro||'Erro ao fazer login');return}
      if(json.perfil==='admin'){onAdmin();return}
      if(json.perfil==='profissional'){onProf(json.dados);return}
      if(json.perfil==='cliente'){onCliente(json.dados);return}
    }catch(e){
      setLd(false)
      setErr('Erro de conexão. Tente novamente.')
    }
  }

  return(
    <>
      <style>{G}</style>
      <style>{`
        body{background:${T.surfaceLow}!important;}
        .login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
        .login-card{background:${T.surfaceWhite};border-radius:28px;width:100%;max-width:400px;overflow:hidden;animation:scaleIn .4s cubic-bezier(.16,1,.3,1);}
        .login-hero{padding:44px 36px 36px;text-align:center;background:#ffffff;}
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
          <div className="login-hero" style={{paddingTop:36,paddingBottom:28}}>
            <img src="data:image/png;base64,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" alt="Logo"
              style={{width:240,height:240,objectFit:'contain',display:'block',margin:'0 auto'}}/>
          </div>
          <div className="login-body">
            <Lbl c="Usuário"/><Inp v={u} set={v=>{setU(v);setErr('')}} ph="Alexandre ou nome do profissional"/>
            <Lbl c="Senha"/>
            <input type="password" value={p} onChange={e=>{setP(e.target.value);setErr('')}} onKeyDown={e=>e.key==='Enter'&&go()} placeholder="••••••" className="inp"/>
            {err&&<Alert type="danger" c={err}/>}
            <button onClick={go} disabled={ld} className="login-btn">{ld?'Verificando…':'Entrar'}</button>
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
function Admin({onLogout,salonName='Joudat Salon'}){
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
  const [retPeriod,setRetPeriod]=useState(30)

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

  // ── FUNÇÃO CENTRAL DE SLOTS LIVRES ─────────────────────
  // Regra única aplicada para Admin, Profissional e Cliente
  // manicure/sobrancelha: 0 sobreposição tolerada
  // cabelereiro: até 2 simultâneos
  const MAX_SIM={cabelereiro:2,manicure:1,sobrancelha:1}

  function calcSlotsLivres({nomProf, dmy, srvName, excludeId=null, allBookings, bloqueios=[], profsData, srvsData}){
    const p=profsData.find(x=>x.full_name===nomProf)
    if(!p||!dmy||!srvName)return[]
    // bloqueia se o salão estiver fechado neste dia
    if(!isDiaAberto(dmy))return[]
    const salonSlots=getSalonSlots(dmy)
    const hi=(p.schedule_start||'08:00').slice(0,5)
    const hf=(p.schedule_end||'18:00').slice(0,5)
    const maxSim=MAX_SIM[p.tipo||'manicure']||1
    const srvNow=srvsData.find(x=>x.name===srvName)
    const durNow=Number(srvNow?.duration_min)||30
    // pega TODOS os agendamentos ativos do profissional neste dia (inclui pending)
    const taken=allBookings
      .filter(a=>{
        const aDmy=isoToDmy(a.booking_date)
        const aTime=(a.start_time||'').slice(0,5)
        return a.professional_name===nomProf
          && aDmy===dmy
          && a.status!=='cancelled'
          && a.id!==excludeId
      })
      .map(a=>{
        const s=srvsData.find(x=>x.name===a.service_name)
        const dur=Number(a.duration_min)||Number(s?.duration_min)||30
        return{ini:toMin((a.start_time||'').slice(0,5)),fim:toMin((a.start_time||'').slice(0,5))+dur}
      })
    const dateISO=dmyToISO(dmy)
    return SLOTS.filter(h=>{
      if(h<hi||h>=hf)return false
      // respeita horário de funcionamento do salão
      if(!salonSlots.includes(h))return false
      if(!isFuture(dmy,h))return false
      const ini=toMin(h),fim=ini+durNow
      if(fim>toMin(hf))return false
      // verifica sobreposição considerando TODA a duração do novo serviço
      const overlapping=taken.filter(t=>ini<t.fim&&fim>t.ini).length
      if(overlapping>=maxSim)return false
      // verifica bloqueios
      const bloqueado=bloqueios.some(b=>{
        if(b.professional_name!==nomProf||b.block_date!==dateISO)return false
        const bIni=toMin((b.start_time||'').slice(0,5))
        const bFim=toMin((b.end_time||'').slice(0,5))
        return ini<bFim&&fim>bIni
      })
      if(bloqueado)return false
      return true
    })
  }

  const freeSlotsFor=(nom,dmy)=>calcSlotsLivres({
    nomProf:nom, dmy, srvName:form.service_name,
    excludeId:form.id||null,
    allBookings:ags, bloqueios:blocks,
    profsData:profs, srvsData:srvs
  })


  // normalize booking rows
  const agRows=ags.map(a=>({
    id:a.id, dmy:isoToDmy(a.booking_date), time:(a.start_time||'').slice(0,5),
    cliName:a.client_name||'', srvName:a.service_name||'', profName:a.professional_name||'',
    status:a.status, price:Number(a.service_price)||Number(a.price_charged)||0,
    paid:Number(a.price_charged)||0, durMin:Number(a.duration_min)||30,
    refPhoto:a.reference_photo||null,
    comPct:Number(a.commission_pct)||0, comVal:Number(a.commission_value)||0,
  }))

  // ── SOLICITAÇÕES (status='pending') ─────────────────
  const solicitacoes=agRows.filter(a=>a.status==='pending')
  const pendCount=solicitacoes.length

  async function aprovarSol(id){
    await supabase.from('salon_bookings').update({status:'scheduled'}).eq('id',id)
    toast2('Agendamento aprovado! ✓');load()
  }
  async function recusarSol(id){
    if(!window.confirm('Recusar esta solicitação?'))return
    await supabase.from('salon_bookings').update({status:'cancelled'}).eq('id',id)
    toast2('Solicitação recusada.');load()
  }

  // ── RETENÇÃO ─────────────────────────────────────────
  const hoje=new Date()
  const retClientes=clients.map(c=>{
    const ult=c.last_visit?new Date(c.last_visit):null
    const diasSemVisita=ult?Math.floor((hoje-ult)/(1000*60*60*24)):999
    return{...c,diasSemVisita,ultVisitaDmy:c.last_visit?isoToDmy(c.last_visit):'Nunca'}
  })
  const semRetorno=retClientes.filter(c=>c.diasSemVisita>=retPeriod).sort((a,b)=>b.diasSemVisita-a.diasSemVisita)
  const maisFrequentes=retClientes.filter(c=>(c.visits||0)>0).sort((a,b)=>(b.visits||0)-(a.visits||0)).slice(0,10)

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
    // bloqueia se o salão estiver fechado neste dia
    if(!isDiaAberto(form.dmy)){
      const[dd,mm,yyyy]=form.dmy.split('/')
      const dow=new Date(Number(yyyy),Number(mm)-1,Number(dd)).getDay()
      const nomeDia=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][dow]
      setFerr(`❌ O salão está fechado na ${nomeDia}. Verifique os horários em Funcionamento.`)
      return
    }
    if(form.time&&!isFuture(form.dmy,form.time)){setFerr('❌ Não é possível agendar em horário passado.');return}
    const p=profs.find(x=>x.full_name===form.professional_name)
    const s=srvs.find(x=>x.name===form.service_name)
    if(!p?.tipo){setFerr('Profissional sem classe definida — edite o cadastro');return}
    if(!s?.tipo){setFerr('Serviço sem classe definida — edite o cadastro');return}
    if(p.tipo!==s.tipo){setFerr(`❌ ${p.full_name} (${p.tipo}) não pode realizar "${s.name}" (${s.tipo})`);return}
    // valida sobreposição — regra inviolável
    const maxSim2=p.tipo==='cabelereiro'?2:1
    const dur2=Number(s.duration_min)||30
    const ini2=toMin(form.time),fim2=ini2+dur2
    const taken2=ags.filter(a=>
      a.professional_name===form.professional_name&&
      isoToDmy(a.booking_date)===form.dmy&&
      a.status!=='cancelled'&&
      a.id!==form.id
    ).map(a=>{
      const sv=srvs.find(x=>x.name===a.service_name)
      const d=Number(a.duration_min)||Number(sv?.duration_min)||30
      return{ini:toMin((a.start_time||'').slice(0,5)),fim:toMin((a.start_time||'').slice(0,5))+d}
    })
    const overlap2=taken2.filter(t=>ini2<t.fim&&fim2>t.ini).length
    if(overlap2>=maxSim2){
      setFerr(`❌ Conflito de horário — ${p.full_name} já tem ${overlap2} serviço(s) neste período. Máximo: ${maxSim2}`);return
    }
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
    if(!window.confirm('Cancelar este agendamento? O profissional será notificado.'))return
    // Marca como cancelado em vez de deletar — profissional verá na aba Avisos
    const{error}=await supabase.from('salon_bookings').update({
      status:'cancelled',
      cancelled_at: new Date().toISOString(),
    }).eq('id',id)
    if(error){
      // Se coluna não existir, tenta só o status
      await supabase.from('salon_bookings').update({status:'cancelled'}).eq('id',id)
    }
    toast2('Agendamento cancelado! Profissional notificado.');load()
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
    const{error}=await supabase.from('salon_bookings').update({status:'completed',price_charged:val,payment_method:form.payment_method||'cash',commission_pct:pct,commission_value:Math.round(val*(pct/100)*100)/100,reference_photo:null}).eq('id',form.id)
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
    {id:'agenda',label:'Agenda',icon:'◷'},
    {id:'solicitacoes',label:'Solicitações',icon:'🔔'},
    {id:'clientes',label:'Clientes',icon:'◉'},
    {id:'retencao',label:'Retenção',icon:'📊'},
    {id:'profissionais',label:'Profissionais',icon:'✦'},
    {id:'servicos',label:'Serviços',icon:'◈'},
    {id:'financeiro',label:'Financeiro',icon:'◎'},
    {id:'funcionamento',label:'Funcionamento',icon:'🕐'},
    {id:'minha_senha',label:'Minha Senha',icon:'🔑'},
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
              <div className="sb-title">{salonName}</div>
              <div className="sb-sub">Painel de Gestão</div>
            </div>
            <button onClick={()=>setSb(false)} style={{background:'none',border:'none',cursor:'pointer',color:T.onSurfaceLow,fontSize:18,padding:4}}>×</button>
          </div>
        </div>
        <nav style={{flex:1,padding:'12px 0',overflowY:'auto'}}>
          {navItems.map(n=>(
            <div key={n.id} className={`nav-item${tab===n.id?' active':''}`} onClick={()=>{setTab(n.id);setQ('');setSb(false)}}>
              <span className="nav-icon">{n.icon}</span>
              <span style={{flex:1}}>{n.label}</span>
              {n.id==='solicitacoes'&&pendCount>0&&(
                <span style={{background:'#b33a3a',color:'white',borderRadius:'50%',width:18,height:18,fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{pendCount}</span>
              )}
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
            <button onClick={()=>load()} className="btn btn-ghost" style={{fontSize:16,padding:'8px 14px'}} title="Atualizar dados">↻ Atualizar</button>
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
              <div style={{fontFamily:'Noto Serif,serif',fontSize:32,fontWeight:700,color:T.onSurface,lineHeight:1.15}}>Painel de Controle</div>
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
                  <span className="ch">Grade de Horários</span>
                  <input type="date" value={dmyToISO(agDate)} onChange={e=>setAgDate(isoToDmy(e.target.value))}
                    style={{padding:'8px 12px',background:T.surfaceLow,border:'none',borderRadius:9,fontFamily:'Manrope',fontSize:12,color:T.onSurface,outline:'none'}}/>
                  {!isDiaAberto(agDate)&&(
                    <span style={{padding:'5px 12px',background:'#fbeaea',color:'#b33a3a',borderRadius:8,fontSize:11,fontWeight:700}}>
                      🚫 Salão fechado neste dia
                    </span>
                  )}
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

          {/* ══ SOLICITAÇÕES ══ */}
          {tab==='solicitacoes'&&(<div className="au">
            <div className="card">
              <div className="card-hd">
                <span className="ch">Solicitações de Clientes</span>
                <span style={{fontSize:12,color:T.onSurfaceLow}}>{pendCount} pendente{pendCount!==1?'s':''}</span>
              </div>
              {solicitacoes.length===0
                ?<div style={{padding:32,textAlign:'center',color:T.onSurfaceLow,fontSize:13}}>
                  Nenhuma solicitação pendente 🎉
                 </div>
                :<div style={{padding:'0 14px 14px'}}>
                  {solicitacoes.map(a=>(
                    <div key={a.id} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',borderRadius:14,background:T.amberPale,border:`1px solid ${T.amber}22`,marginBottom:10}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                          <span style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:T.amber}}>⏳ Aguardando Aprovação</span>
                          <span style={{fontSize:10,color:T.onSurfaceLow}}>{a.dmy} às {a.time}</span>
                        </div>
                        <div style={{fontSize:14,fontWeight:700,color:T.onSurface}}>{a.cliName}</div>
                        <div style={{fontSize:12,color:T.onSurfaceMed,marginTop:2}}>{a.srvName} · {a.profName}</div>
                        <div style={{fontSize:12,color:T.primary,marginTop:2,fontWeight:600}}>{fmtCurrency(a.price)}</div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}>
                        <button className="btn btn-success btn-sm" onClick={()=>aprovarSol(a.id)}>✓ Aprovar</button>
                        <button className="btn btn-danger btn-sm" onClick={()=>recusarSol(a.id)}>✕ Recusar</button>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>
          </div>)}

          {/* ══ RETENÇÃO ══ */}
          {tab==='retencao'&&(<div className="au">
            <div className="card">
              <div className="card-hd">
                <span className="ch">Análise de Retenção</span>
                <div style={{display:'flex',gap:6}}>
                  {[30,60,120].map(d=>(
                    <button key={d} onClick={()=>setRetPeriod(d)}
                      style={{padding:'6px 12px',border:'none',borderRadius:8,cursor:'pointer',fontSize:11,fontWeight:700,
                        background:retPeriod===d?T.primary:T.surfaceLow,
                        color:retPeriod===d?'white':T.onSurfaceMed,transition:'all .18s'}}>
                      {d} dias
                    </button>
                  ))}
                </div>
              </div>

              {/* KPIs retenção */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,padding:'0 18px 18px'}}>
                {[
                  {l:'Total Clientes',v:clients.length,ic:'👥'},
                  {l:`Sem retorno +${retPeriod}d`,v:semRetorno.length,ic:'⚠️'},
                  {l:'Retornaram',v:clients.filter(c=>(c.visits||0)>=2).length,ic:'✅'},
                ].map(k=>(
                  <div key={k.l} style={{background:T.surfaceLow,borderRadius:14,padding:'14px 12px',textAlign:'center'}}>
                    <div style={{fontSize:20,marginBottom:4}}>{k.ic}</div>
                    <div style={{fontFamily:'Noto Serif,serif',fontSize:22,fontWeight:700,color:T.onSurface}}>{k.v}</div>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:T.onSurfaceLow,marginTop:3}}>{k.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top mais frequentes */}
            <div className="card">
              <div className="card-hd"><span className="ch">🏆 Clientes Mais Frequentes</span></div>
              {maisFrequentes.length===0
                ?<div style={{padding:24,textAlign:'center',color:T.onSurfaceLow,fontSize:13}}>Nenhum dado ainda</div>
                :<div style={{overflowX:'auto'}}>
                  <table className="tbl">
                    <thead><tr><th>#</th><th>Cliente</th><th>Telefone</th><th>Visitas</th><th>Total Gasto</th><th>Última Visita</th></tr></thead>
                    <tbody>
                      {maisFrequentes.map((c,i)=>(
                        <tr key={c.id}>
                          <td><span style={{background:T.primaryPale,color:T.primary,borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:700}}>{i+1}</span></td>
                          <td style={{fontWeight:600}}>{c.full_name}</td>
                          <td style={{color:T.onSurfaceLow,fontSize:12}}>{c.phone||'—'}</td>
                          <td><span style={{fontWeight:700,color:T.primary}}>{c.visits||0}</span></td>
                          <td style={{fontWeight:600,color:T.success}}>{fmtCurrency(c.total_spent)}</td>
                          <td style={{fontSize:12,color:T.onSurfaceLow}}>{c.ultVisitaDmy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              }
            </div>

            {/* Clientes sem retorno */}
            <div className="card">
              <div className="card-hd">
                <span className="ch">⚠️ Sem Retorno há +{retPeriod} dias</span>
                <span style={{fontSize:12,color:T.onSurfaceLow}}>{semRetorno.length} clientes</span>
              </div>
              {semRetorno.length===0
                ?<div style={{padding:24,textAlign:'center',color:T.onSurfaceLow,fontSize:13}}>Todos os clientes retornaram dentro do período! 🎉</div>
                :<div style={{overflowX:'auto'}}>
                  <table className="tbl">
                    <thead><tr><th>Cliente</th><th>Telefone</th><th>Última Visita</th><th>Dias sem retorno</th><th>Visitas</th></tr></thead>
                    <tbody>
                      {semRetorno.map(c=>(
                        <tr key={c.id}>
                          <td style={{fontWeight:600}}>{c.full_name}</td>
                          <td>
                            {c.phone
                              ?<a href={`https://wa.me/55${c.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                                  style={{color:T.success,fontWeight:600,fontSize:12,textDecoration:'none'}}>
                                  📱 {c.phone}
                                </a>
                              :<span style={{color:T.onSurfaceLow,fontSize:12}}>—</span>
                            }
                          </td>
                          <td style={{fontSize:12,color:T.onSurfaceLow}}>{c.ultVisitaDmy}</td>
                          <td>
                            <span style={{
                              background:c.diasSemVisita>=120?T.dangerPale:c.diasSemVisita>=60?T.amberPale:T.primaryPale,
                              color:c.diasSemVisita>=120?T.danger:c.diasSemVisita>=60?T.amber:T.primary,
                              borderRadius:8,padding:'3px 10px',fontSize:11,fontWeight:700
                            }}>{c.diasSemVisita===999?'Nunca visitou':c.diasSemVisita+' dias'}</span>
                          </td>
                          <td style={{fontSize:12,color:T.onSurfaceLow}}>{c.visits||0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>)}

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
                          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                            <button className="btn btn-ghost btn-sm" onClick={()=>openM('cli',c)}>Editar</button>
                            <button className="btn btn-sm" style={{background:T.amberPale,color:T.amber,border:'none',borderRadius:7,fontFamily:'Manrope',fontSize:11,fontWeight:600,cursor:'pointer',padding:'7px 10px'}}
                              onClick={()=>{if(window.confirm(`Resetar senha de ${c.full_name} para 1234?`))supabase.from('salon_clients').update({senha:'1234'}).eq('id',c.id).then(()=>toast2(`Senha de ${c.full_name} resetada para 1234!`))}}>
                              🔑 Senha
                            </button>
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

          {tab==='funcionamento'&&(<div className="au">
            <FuncionamentoAdmin toast2={toast2}/>
          </div>)}

          {tab==='minha_senha'&&(<div className="au">
            <div className="card">
              <div className="card-hd"><span className="ch">Alterar Senha do Administrador</span></div>
              <div style={{padding:20,maxWidth:420}}>
                <div style={{fontSize:13,color:T.onSurfaceLow,marginBottom:16}}>Altere a senha de acesso ao painel administrativo.</div>
                <AdminSenhaComp toast2={toast2}/>
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
function ProfPanel({prof,onLogout,salonName='Joudat Salon'}){
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
    refPhoto:a.reference_photo||null,
  }))

  const today=todayStr()
  const todayRows=rows.filter(a=>a.dmy===today&&a.status!=='cancelled')
  const nextRows=rows.filter(a=>dmyToISO(a.dmy)>todayISO()&&a.status!=='cancelled'&&a.status!=='completed')
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
    const{error}=await supabase.from('salon_bookings').update({status:'completed',price_charged:val,payment_method:form.payment_method||'cash',commission_pct:pct,commission_value:Math.round(val*(pct/100)*100)/100,reference_photo:null}).eq('id',form.id)
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

  const pendProf=ags.filter(a=>a.status==='pending')
  const tabs2=[{id:'pedidos',label:'Pedidos',ic:'🔔'},{id:'agenda',label:'Agenda',ic:'◷'},{id:'hoje',label:'Hoje',ic:'📅'},{id:'proximos',label:'Próximos',ic:'🗓'},{id:'rendimentos',label:'Ganhos',ic:'◎'},{id:'bloqueios',label:'Bloqueios',ic:'🚫'},{id:'senha',label:'Senha',ic:'🔑'}]

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
    if(!dmy||!agForm.service_name)return SLOTS
    // salão fechado neste dia
    if(!isDiaAberto(dmy))return[]
    const salonSlotsP=getSalonSlots(dmy)
    const hi=(prof.schedule_start||'08:00').slice(0,5)
    const hf=(prof.schedule_end||'18:00').slice(0,5)
    // MESMA regra: manicure/sobrancelha=1 | cabelereiro=2
    const maxSim=prof.tipo==='cabelereiro'?2:1
    const srvNow=agSrvs.find(x=>x.name===agForm.service_name)
    const durNow=Number(srvNow?.duration_min)||30
    // usa ags brutos do banco para garantir que pending também conta
    const taken=ags
      .filter(a=>a.professional_name===prof.full_name&&isoToDmy(a.booking_date)===dmy&&a.status!=='cancelled')
      .map(a=>{
        const s=agSrvs.find(x=>x.name===a.service_name)
        const dur=Number(a.duration_min)||Number(s?.duration_min)||30
        return{ini:toMin((a.start_time||'').slice(0,5)),fim:toMin((a.start_time||'').slice(0,5))+dur}
      })
    return SLOTS.filter(h=>{
      if(h<hi||h>=hf)return false
      if(!salonSlotsP.includes(h))return false
      if(!isFuture(dmy,h))return false
      const ini=toMin(h),fim=ini+durNow
      if(fim>toMin(hf))return false
      // sobreposição total — qualquer parte do novo serviço que bata com existente
      const overlapping=taken.filter(t=>ini<t.fim&&fim>t.ini).length
      if(overlapping>=maxSim)return false
      return true
    })
  }

  const [agLoading,setAgLoading]=useState(false)
  const [agConfirm,setAgConfirm]=useState(false)

  // ── AGENDA VISUAL ────────────────────────────────────
  const [agendaDia,setAgendaDia]=useState(todayStr())
  const [fotoModal,setFotoModal]=useState(null) // URL da foto no popup
  const [reagModal,setReagModal]=useState(false)
  const [reagAg,setReagAg]=useState(null)
  const [reagDmy,setReagDmy]=useState('')
  const [reagTime,setReagTime]=useState('')
  const [reagErr,setReagErr]=useState('')

  // Modal novo agendamento via slot livre
  const [novoAgModal,setNovoAgModal]=useState(false)
  const [novoAgSlot,setNovoAgSlot]=useState({dmy:'',time:''})
  const [novoAgCli,setNovoAgCli]=useState('')
  const [novoAgSrv,setNovoAgSrv]=useState('')
  const [novoAgErr,setNovoAgErr]=useState('')
  const [novoAgLoading,setNovoAgLoading]=useState(false)

  async function salvarNovoAg(){
    if(!novoAgCli||!novoAgSrv){setNovoAgErr('Selecione cliente e serviço');return}
    if(!isFuture(novoAgSlot.dmy,novoAgSlot.time)){setNovoAgErr('❌ Não é possível agendar em horário passado.');return}
    setNovoAgLoading(true);setNovoAgErr('')
    const s=agSrvs.find(x=>x.name===novoAgSrv)
    const{error}=await supabase.from('salon_bookings').insert({
      client_name:novoAgCli,
      service_name:novoAgSrv,
      professional_name:prof.full_name,
      booking_date:dmyToISO(novoAgSlot.dmy),
      start_time:novoAgSlot.time+':00',
      status:'scheduled',
      price_charged:s?.price||0,
      service_price:s?.price||0,
      duration_min:s?.duration_min||30,
    })
    setNovoAgLoading(false)
    if(error){setNovoAgErr('Erro: '+error.message);return}
    setNovoAgModal(false);setNovoAgCli('');setNovoAgSrv('')
    toast2('Agendamento criado! ✓');load()
  }

  // Slots de agenda visual para o dia selecionado
  function getAgendaVisual(dmy){
    const hi=toMin((prof.schedule_start||'08:00').slice(0,5))
    const hf=toMin((prof.schedule_end||'18:00').slice(0,5))
    const salonSlots=getSalonSlots(dmy)
    const agendados=rows.filter(a=>a.dmy===dmy&&a.status!=='cancelled')
    return SLOTS.filter(h=>h>=(prof.schedule_start||'08:00').slice(0,5)&&h<(prof.schedule_end||'18:00').slice(0,5)&&salonSlots.includes(h))
      .map(h=>{
        const ocupado=agendados.find(a=>{
          const ini=toMin(a.time),fim=ini+a.durMin
          return toMin(h)>=ini&&toMin(h)<fim
        })
        const passado=!isFuture(dmy,h)
        return{h,ocupado:ocupado||null,passado}
      })
  }

  // Slots livres para reagendamento
  function getSlotsReag(dmy,excludeId){
    if(!dmy)return[]
    if(!isDiaAberto(dmy))return[]
    const sc=getSalonSlots(dmy)
    const hi=(prof.schedule_start||'08:00').slice(0,5)
    const hf=(prof.schedule_end||'18:00').slice(0,5)
    const maxSim=prof.tipo==='cabelereiro'?2:1
    const ag=reagAg
    const dur=ag?.durMin||30
    const taken=ags.filter(a=>isoToDmy(a.booking_date)===dmy&&a.status!=='cancelled'&&a.id!==excludeId)
      .map(a=>{const d=Number(a.duration_min)||30;return{ini:toMin((a.start_time||'').slice(0,5)),fim:toMin((a.start_time||'').slice(0,5))+d}})
    return SLOTS.filter(h=>{
      if(h<hi||h>=hf)return false
      if(!sc.includes(h))return false
      const ini=toMin(h),fim=ini+dur
      if(fim>toMin(hf))return false
      return taken.filter(t=>ini<t.fim&&fim>t.ini).length<maxSim
    })
  }

  async function salvarReag(){
    if(!reagDmy||!reagTime){setReagErr('Selecione data e horário');return}
    if(!isFuture(reagDmy,reagTime)){setReagErr('❌ Não é possível reagendar para horário passado.');return}
    setReagErr('')
    await supabase.from('salon_bookings').update({
      booking_date:dmyToISO(reagDmy),
      start_time:reagTime+':00'
    }).eq('id',reagAg.id)
    setReagModal(false);setReagAg(null)
    toast2('Reagendamento salvo! ✓');load()
  }

  function confirmarAgProf(){
    setAgErr('')
    if(!agForm.client_name||!agForm.service_name||!agForm.dmy||!agForm.time){setAgErr('Preencha todos os campos');return}
    setAgConfirm(true) // abre popup de confirmação
  }

  async function saveAgProf(){
    setAgConfirm(false)
    setAgLoading(true)
    const s=agSrvs.find(x=>x.name===agForm.service_name)
    // bloqueia se o salão estiver fechado neste dia
    if(!isDiaAberto(agForm.dmy)){
      setAgLoading(false)
      setAgErr('❌ O salão está fechado neste dia. Escolha outra data.')
      return
    }
    // validação final antes de salvar — regra inviolável
    const maxSimP=prof.tipo==='cabelereiro'?2:1
    const durP=Number(s?.duration_min)||30
    const iniP=toMin(agForm.time),fimP=iniP+durP
    const overlapP=ags.filter(a=>{
      if(a.professional_name!==prof.full_name)return false
      if(isoToDmy(a.booking_date)!==agForm.dmy)return false
      if(a.status==='cancelled')return false
      const sv=agSrvs.find(x=>x.name===a.service_name)
      const d=Number(a.duration_min)||Number(sv?.duration_min)||30
      const ai=toMin((a.start_time||'').slice(0,5))
      return iniP<ai+d&&fimP>ai
    }).length
    if(overlapP>=maxSimP){
      setAgLoading(false)
      setAgErr('❌ Conflito de horário — este período já está ocupado para '+prof.full_name)
      return
    }
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
    setAgLoading(false)
    if(error){setAgErr('Erro: '+error.message);return}
    shToast('Agendamento criado! ✓')
    setAgForm({client_name:'',service_name:'',dmy:todayStr(),time:''})
    load()
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
    if(!senhaNova||senhaNova.length<6){setSenhaErr('Nova senha deve ter pelo menos 6 caracteres');return}
    if(senhaNova!==senhaConf){setSenhaErr('As senhas não coincidem');return}
    try{
      const res=await fetch('/api/alterar-senha',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({tipo:'profissional',id:prof.id,senhaAtual,senhaNova})
      })
      const json=await res.json()
      if(!json.ok){setSenhaErr(json.erro||'Erro ao alterar');return}
      setSenhaOk('✅ Senha alterada com sucesso!')
      setSenhaAtual('');setSenhaNova('');setSenhaConf('')
    }catch(e){setSenhaErr('Erro de conexão. Tente novamente.')}
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
              <button onClick={()=>load()} style={{background:'none',border:`1px solid ${T.border||'rgba(119,90,25,.2)'}`,borderRadius:9,padding:'7px 11px',cursor:'pointer',fontSize:15,color:T.primary,fontWeight:600,transition:'background .18s'}} title="Atualizar dados">↻</button>
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
            {tabs2.map(t=>(
              <button key={t.id} className={`tab${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}
                style={{position:'relative',display:'flex',alignItems:'center',gap:4}}>
                {t.ic} {t.label}
                {t.id==='pedidos'&&pendProf.length>0&&(
                  <span style={{background:'#b33a3a',color:'white',borderRadius:'50%',width:16,height:16,
                    fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {pendProf.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div style={{padding:18}}>
            {ld&&<div style={{textAlign:'center',padding:32,color:T.onSurfaceLow,fontSize:13}}>Carregando…</div>}
            {!ld&&(<>
              {tab==='pedidos'&&(
              <div>
                {pendProf.length===0
                  ?<div style={{padding:32,textAlign:'center',color:T.onSurfaceLow,fontSize:13}}>
                    <div style={{fontSize:28,marginBottom:8}}>🎉</div>
                    Nenhuma solicitação pendente
                  </div>
                  :pendProf.map(a=>{
                    const dmy=isoToDmy(a.booking_date)
                    const time=(a.start_time||'').slice(0,5)
                    return(
                      <div key={a.id} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',
                        borderRadius:14,background:T.amberPale,border:`1px solid ${T.amber}22`,marginBottom:10}}>
                        <div style={{flex:1,minWidth:0}}>
                          <span style={{fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:T.amber}}>⏳ Aguardando aprovação</span>
                          <div style={{fontSize:14,fontWeight:700,marginTop:4}}>{a.client_name}</div>
                          <div style={{fontSize:12,color:T.onSurfaceLow,marginTop:2}}>{a.service_name}</div>
                          <div style={{fontSize:12,color:T.onSurfaceLow,marginTop:2}}>📅 {dmy} às {time}</div>
                          <div style={{fontSize:13,fontWeight:600,color:T.primary,marginTop:4}}>{fmtCurrency(Number(a.service_price)||0)}</div>
                          {a.reference_photo&&(
                            <div style={{marginTop:8}}>
                              <div style={{fontSize:10,fontWeight:700,color:T.primary,marginBottom:4}}>📎 Referência da cliente:</div>
                              <img src={a.reference_photo} alt="Referência"
                                style={{width:'100%',maxHeight:180,objectFit:'cover',borderRadius:10,border:`1px solid ${T.primaryPale}`}}/>
                            </div>
                          )}
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:8,flexShrink:0}}>
                          <button className="btn btn-success btn-sm" onClick={async()=>{
                            await supabase.from('salon_bookings').update({status:'scheduled'}).eq('id',a.id)
                            toast2('Agendamento aprovado! ✓');load()
                          }}>✓ Aprovar</button>
                          <button className="btn btn-danger btn-sm" onClick={async()=>{
                            if(!window.confirm('Recusar esta solicitação?'))return
                            await supabase.from('salon_bookings').update({status:'cancelled'}).eq('id',a.id)
                            toast2('Solicitação recusada.');load()
                          }}>✕ Recusar</button>
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            )}

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
                  <div style={{display:'flex',flexDirection:'column',gap:4,alignItems:'flex-end',flexShrink:0}}>
                    <span className="bdg" style={{background:T.amberPale,color:T.amber}}>Agendado</span>
                    {a.refPhoto&&(
                      <button onClick={()=>setFotoModal(a.refPhoto)}
                        style={{padding:'3px 8px',background:T.primaryPale,border:`1px solid ${T.primary}44`,
                          borderRadius:8,fontFamily:'Manrope,sans-serif',fontSize:10,
                          fontWeight:700,color:T.primary,cursor:'pointer'}}>
                        📎 Ref.
                      </button>
                    )}
                    <button onClick={async()=>{
                      if(!window.confirm('Cancelar este atendimento?'))return
                      await supabase.from('salon_bookings').update({status:'cancelled'}).eq('id',a.id)
                      toast2('Atendimento cancelado.');load()
                    }} style={{padding:'3px 8px',background:'#fbeaea',border:'1px solid #e0a0a0',
                      borderRadius:8,fontFamily:'Manrope,sans-serif',fontSize:10,
                      fontWeight:700,color:'#b33a3a',cursor:'pointer'}}>
                      ✕ Cancelar
                    </button>
                  </div>
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

              {tab==='agenda'&&(()=>{
                const slots=getAgendaVisual(agendaDia)
                return(
                  <div>
                    {/* Seletor de dia */}
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                      <input type="date" value={dmyToISO(agendaDia)||''} onChange={e=>setAgendaDia(isoToDmy(e.target.value))}
                        style={{flex:1,padding:'10px 14px',background:T.surfaceLow,border:'none',borderRadius:10,
                          fontFamily:'Manrope,sans-serif',fontSize:14,color:T.onSurface,outline:'none'}}/>
                      <button onClick={()=>setAgendaDia(todayStr())}
                        style={{padding:'10px 14px',background:T.primaryPale,border:'none',borderRadius:10,
                          fontFamily:'Manrope,sans-serif',fontSize:12,fontWeight:700,color:T.primary,cursor:'pointer',whiteSpace:'nowrap'}}>
                        Hoje
                      </button>
                    </div>
                    {/* Legenda */}
                    <div style={{display:'flex',gap:12,marginBottom:14,flexWrap:'wrap'}}>
                      {[{c:T.primaryPale,b:`1px solid ${T.primary}44`,l:'Ocupado'},
                        {c:T.surfaceLow,b:'1px solid #ddd',l:'Livre'},
                        {c:T.surfaceLow,b:'1px dashed #ccc',l:'Fora do salão'}].map(x=>(
                        <div key={x.l} style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:14,height:14,borderRadius:4,background:x.c,border:x.b}}/>
                          <span style={{fontSize:11,color:T.onSurfaceLow}}>{x.l}</span>
                        </div>
                      ))}
                    </div>
                    {/* Grade de horários */}
                    {slots.length===0
                      ?<div style={{padding:32,textAlign:'center',color:T.onSurfaceLow,fontSize:13}}>
                        Salão fechado neste dia
                      </div>
                      :<div style={{display:'flex',flexDirection:'column',gap:6}}>
                        {slots.map(({h,ocupado,passado})=>(
                          <div key={h} style={{display:'flex',alignItems:'center',gap:10,
                            padding:'12px 14px',borderRadius:12,
                            background:ocupado?T.primaryPale:passado?'#f7f7f7':T.surfaceLow,
                            border:ocupado?`1px solid ${T.primary}44`:passado?'1px solid #e8e3db':'1px solid #e8e3db',
                            opacity:passado&&!ocupado?.5:1}}>
                            <div style={{fontSize:14,fontWeight:700,color:ocupado?T.primary:passado?'#ccc':T.onSurfaceLow,
                              minWidth:44,flexShrink:0}}>{h}</div>
                            {ocupado?(
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:13,fontWeight:700,color:T.onSurface,
                                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                  {ocupado.cliName}
                                </div>
                                <div style={{fontSize:11,color:T.onSurfaceLow,marginTop:1}}>{ocupado.srvName}</div>

                              </div>
                            ):(
                              <div style={{flex:1,fontSize:12,color:passado?'#ccc':T.onSurfaceLow}}>
                                {passado?'Horário passado':'Horário livre'}
                              </div>
                            )}
                            {!ocupado&&!passado&&(
                              <button onClick={()=>{setNovoAgSlot({dmy:agendaDia,time:h});setNovoAgCli('');setNovoAgSrv('');setNovoAgErr('');setNovoAgModal(true)}}
                                style={{padding:'5px 12px',background:T.primaryPale,border:`1px solid ${T.primary}44`,
                                  borderRadius:8,fontFamily:'Manrope,sans-serif',fontSize:11,
                                  fontWeight:700,color:T.primary,cursor:'pointer',flexShrink:0,whiteSpace:'nowrap'}}>
                                ➕ Agendar
                              </button>
                            )}
                            {ocupado&&ocupado.status==='scheduled'&&(
                              <div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}>
                                {ocupado.refPhoto&&ocupado.status!=='completed'&&(
                                  <button onClick={()=>setFotoModal(ocupado.refPhoto)}
                                    style={{padding:'5px 12px',background:T.primaryPale,border:`1px solid ${T.primary}44`,
                                      borderRadius:8,fontFamily:'Manrope,sans-serif',fontSize:11,
                                      fontWeight:700,color:T.primary,cursor:'pointer',whiteSpace:'nowrap'}}>
                                    📎 Referência
                                  </button>
                                )}
                                <button onClick={()=>{setReagAg(ocupado);setReagDmy(ocupado.dmy);setReagTime(ocupado.time);setReagModal(true)}}
                                  style={{padding:'5px 12px',background:'#fff',border:`1px solid ${T.primary}44`,
                                    borderRadius:8,fontFamily:'Manrope,sans-serif',fontSize:11,
                                    fontWeight:700,color:T.primary,cursor:'pointer',whiteSpace:'nowrap'}}>
                                  ✏️ Reagendar
                                </button>
                                <button onClick={async()=>{
                                  if(!window.confirm('Cancelar este atendimento?'))return
                                  await supabase.from('salon_bookings').update({status:'cancelled'}).eq('id',ocupado.id)
                                  toast2('Atendimento cancelado.');load()
                                }} style={{padding:'5px 12px',background:'#fbeaea',border:'1px solid #e0a0a0',
                                    borderRadius:8,fontFamily:'Manrope,sans-serif',fontSize:11,
                                    fontWeight:700,color:'#b33a3a',cursor:'pointer',whiteSpace:'nowrap'}}>
                                  ✕ Cancelar
                                </button>
                              </div>
                            )}
                            {ocupado&&<span style={{fontSize:10,padding:'3px 8px',borderRadius:20,flexShrink:0,
                              fontWeight:700,
                              background:ocupado.status==='completed'?T.successPale:ocupado.status==='pending'?T.amberPale:T.primaryPale,
                              color:ocupado.status==='completed'?T.success:ocupado.status==='pending'?T.amber:T.primary}}>
                              {ocupado.status==='completed'?'Finalizado':ocupado.status==='pending'?'Pendente':'Confirmado'}
                            </span>}
                          </div>
                        ))}
                      </div>
                    }
                  </div>
                )
              })()}

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
                {agErr&&<Alert type="danger" c={agErr}/>}
                <button className="btn btn-primary" 
                  style={{width:'100%',marginTop:18,justifyContent:'center',opacity:agLoading?.7:1,cursor:agLoading?'not-allowed':'pointer'}} 
                  onClick={confirmarAgProf}
                  disabled={agLoading}>
                  {agLoading?'Salvando…':'Confirmar Agendamento'}
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

      {/* MODAL CONFIRMAÇÃO AGENDAMENTO */}
      {agConfirm&&(()=>{
        const s=agSrvs.find(x=>x.name===agForm.service_name)
        return(
          <Modal title="Confirmar Agendamento" onClose={()=>setAgConfirm(false)}>
            <div style={{background:T.primaryPale,borderRadius:14,padding:'16px',marginBottom:4}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                {[
                  ['Cliente',agForm.client_name],
                  ['Serviço',agForm.service_name],
                  ['Data',agForm.dmy],
                  ['Horário',agForm.time],
                  ['Duração',`${s?.duration_min||30} min`],
                  ['Valor',fmtCurrency(s?.price||0)],
                ].map(([l,v])=>(
                  <div key={l}>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:T.primary,opacity:.7,marginBottom:3}}>{l}</div>
                    <div style={{fontSize:13,fontWeight:600,color:T.onSurface}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <Alert type="info" c="Verifique os dados antes de confirmar. Após salvo, o agendamento aparece na grade do admin."/>
            <div style={{display:'flex',gap:10,marginTop:18}}>
              <button className="btn btn-primary" style={{flex:1}} onClick={saveAgProf}>✓ Confirmar</button>
              <button className="btn btn-ghost" onClick={()=>setAgConfirm(false)}>Voltar</button>
            </div>
          </Modal>
        )
      })()}

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

      {/* Modal Novo Agendamento via Slot */}
      {novoAgModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:'24px 24px 0 0',padding:'28px 24px 36px',width:'100%',maxWidth:480}}>
            <div style={{fontFamily:'Noto Serif,serif',fontSize:18,fontWeight:700,marginBottom:4}}>➕ Novo Agendamento</div>
            <div style={{fontSize:12,color:T.onSurfaceLow,marginBottom:16}}>
              📅 {novoAgSlot.dmy} às {novoAgSlot.time}
            </div>
            <Lbl c="Cliente *"/>
            <Sel v={novoAgCli} set={setNovoAgCli}>
              <option value="">Selecionar cliente…</option>
              {agClients.map(c=><option key={c.id} value={c.full_name}>{c.full_name}</option>)}
            </Sel>
            <Lbl c="Serviço *"/>
            <Sel v={novoAgSrv} set={setNovoAgSrv}>
              <option value="">Selecionar serviço…</option>
              {agSrvs.map(s=><option key={s.id} value={s.name}>{s.name} ({s.duration_min}min) — {fmtCurrency(s.price)}</option>)}
            </Sel>
            {novoAgErr&&<Alert type="danger" c={novoAgErr}/>}
            <div style={{display:'flex',gap:10,marginTop:18}}>
              <button className="btn btn-ghost" style={{flex:1,justifyContent:'center'}} onClick={()=>setNovoAgModal(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{flex:2,justifyContent:'center',opacity:novoAgLoading?.65:1}}
                onClick={salvarNovoAg} disabled={novoAgLoading}>
                {novoAgLoading?'Salvando…':'✓ Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Foto de Referência */}
      {fotoModal&&(
        <div onClick={()=>setFotoModal(null)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:300,
            display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div onClick={e=>e.stopPropagation()}
            style={{background:'#fff',borderRadius:20,overflow:'hidden',maxWidth:440,width:'100%'}}>
            <div style={{padding:'14px 18px',display:'flex',justifyContent:'space-between',alignItems:'center',
              borderBottom:'1px solid #f0ede8'}}>
              <span style={{fontWeight:700,fontSize:14}}>📎 Foto de Referência</span>
              <button onClick={()=>setFotoModal(null)}
                style={{background:'none',border:'none',cursor:'pointer',fontSize:20,color:'#aaa',padding:4}}>×</button>
            </div>
            <img src={fotoModal} alt="Referência"
              style={{width:'100%',maxHeight:460,objectFit:'contain',display:'block',background:'#fafafa'}}/>
          </div>
        </div>
      )}

      {/* Modal Reagendamento */}
      {reagModal&&reagAg&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:'24px 24px 0 0',padding:'28px 24px 36px',width:'100%',maxWidth:480}}>
            <div style={{fontFamily:'Noto Serif,serif',fontSize:18,fontWeight:700,marginBottom:4}}>✏️ Reagendar</div>
            <div style={{fontSize:12,color:T.onSurfaceLow,marginBottom:18}}>
              {reagAg.cliName} · {reagAg.srvName}
            </div>
            <div style={{background:T.primaryPale,borderRadius:12,padding:'12px 14px',marginBottom:16,fontSize:12,color:T.primary,fontWeight:600}}>
              📅 Atual: {reagAg.dmy} às {reagAg.time}
            </div>
            <Lbl c="Nova data *"/>
            <input type="date" min={todayISO()} value={dmyToISO(reagDmy)||''}
              onChange={e=>{setReagDmy(isoToDmy(e.target.value));setReagTime('')}}
              className="inp"/>
            <Lbl c="Novo horário *"/>
            {reagDmy&&(()=>{
              const slots=getSlotsReag(reagDmy,reagAg.id)
              return slots.length===0
                ?<div style={{padding:12,background:T.surfaceLow,borderRadius:10,fontSize:12,color:T.onSurfaceLow,textAlign:'center',marginBottom:16}}>
                  Nenhum horário disponível nesta data
                </div>
                :<div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16}}>
                  {slots.map(h=>(
                    <button key={h} onClick={()=>setReagTime(h)}
                      style={{padding:'8px 14px',borderRadius:10,border:'none',cursor:'pointer',
                        fontFamily:'Manrope,sans-serif',fontSize:12,fontWeight:700,
                        background:reagTime===h?T.primary:T.surfaceLow,
                        color:reagTime===h?'#fff':T.onSurface,
                        boxShadow:reagTime===h?'0 2px 8px rgba(119,90,25,.3)':'none'}}>
                      {h}
                    </button>
                  ))}
                </div>
            })()}
            {reagErr&&<Alert type="danger" c={reagErr}/>}
            <div style={{display:'flex',gap:10,marginTop:8}}>
              <button className="btn btn-ghost" style={{flex:1,justifyContent:'center'}} onClick={()=>setReagModal(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{flex:2,justifyContent:'center'}} onClick={salvarReag}>Salvar Reagendamento</button>
            </div>
          </div>
        </div>
      )}

      {toast&&<div className="toast" style={{background:toast.ok?`linear-gradient(135deg,${T.success},#2e6040)`:`linear-gradient(135deg,${T.danger},#8b2020)`}}>{toast.m}</div>}
    </>
  )
}

// ══════════════════════════════════════════════════════
// COMPONENTE ALTERAR SENHA CLIENTE
// ══════════════════════════════════════════════════════
function AlterarSenhaCli({cliente}){
  const [senhaAtual,setSenhaAtual]=useState('')
  const [senhaNova,setSenhaNova]=useState('')
  const [senhaConf,setSenhaConf]=useState('')
  const [err,setErr]=useState('')
  const [ok,setOk]=useState('')

  async function salvar(){
    setErr('');setOk('')
    if(!senhaAtual){setErr('Informe a senha atual');return}
    if(!senhaNova||senhaNova.length<6){setErr('Nova senha deve ter pelo menos 6 caracteres');return}
    if(senhaNova!==senhaConf){setErr('As senhas não coincidem');return}
    try{
      const res=await fetch('/api/alterar-senha',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({tipo:'cliente',id:cliente.id,senhaAtual,senhaNova})
      })
      const json=await res.json()
      if(!json.ok){setErr(json.erro||'Erro ao alterar');return}
      setOk('✅ Senha alterada com sucesso!')
      setSenhaAtual('');setSenhaNova('');setSenhaConf('')
    }catch(e){setErr('Erro de conexão. Tente novamente.')}
  }

  return(
    <>
      <label className="lbl">Senha atual *</label>
      <input type="password" value={senhaAtual} onChange={e=>{setSenhaAtual(e.target.value);setErr('');setOk('')}} placeholder="Senha atual" className="inp"/>
      <label className="lbl">Nova senha *</label>
      <input type="password" value={senhaNova} onChange={e=>{setSenhaNova(e.target.value);setErr('');setOk('')}} placeholder="Mínimo 6 caracteres" className="inp"/>
      <label className="lbl">Confirmar nova senha *</label>
      <input type="password" value={senhaConf} onChange={e=>{setSenhaConf(e.target.value);setErr('');setOk('')}} onKeyDown={e=>e.key==='Enter'&&salvar()} placeholder="Repita a nova senha" className="inp"/>
      {err&&<div className="alert alert-danger" style={{marginTop:10}}>{err}</div>}
      {ok&&<div className="alert alert-success" style={{marginTop:10}}>{ok}</div>}
      <button className="btn btn-primary" style={{width:'100%',marginTop:16,justifyContent:'center'}} onClick={salvar}>
        Salvar Nova Senha
      </button>
      <div style={{marginTop:10,fontSize:11,color:'#7a7a6a',textAlign:'center'}}>Senha padrão: 1234</div>
    </>
  )
}

// ══════════════════════════════════════════════════════
// COMPONENTE FOTO DE REFERÊNCIA
// ══════════════════════════════════════════════════════
function FotoReferencia({onFoto}){
  const [preview,setPreview]=useState(null)
  const fileRef=useRef(null)
  const camRef=useRef(null)
  const T={primary:'#775a19',primaryPale:'#f5edd8',surfaceWhite:'#ffffff',onSurface:'#1a1c1a',onSurfaceLow:'#7a7a6a'}
  function handleFile(e){
    const file=e.target.files?.[0];if(!file)return
    const reader=new FileReader()
    reader.onload=ev=>{setPreview(ev.target.result);onFoto&&onFoto(ev.target.result)}
    reader.readAsDataURL(file)
  }
  function remover(){setPreview(null);onFoto&&onFoto(null)}
  return(
    <div style={{background:T.surfaceWhite,borderRadius:20,overflow:'hidden',marginBottom:16}}>
      <div style={{padding:'18px 22px'}}>
        <span style={{fontFamily:"'Noto Serif',serif",fontSize:17,fontWeight:600,color:T.onSurface}}>📸 Foto de Referência</span>
      </div>
      <div style={{padding:'0 20px 20px'}}>
        <div style={{fontSize:12,color:T.onSurfaceLow,marginBottom:14,lineHeight:1.6}}>
          Envie uma foto do estilo desejado. A profissional verá a referência ao atender seu pedido.
        </div>
        {!preview?(
          <div style={{display:'flex',gap:10}}>
            <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleFile}/>
            <input ref={camRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={handleFile}/>
            <button onClick={()=>fileRef.current?.click()}
              style={{flex:1,padding:'12px 14px',background:T.primaryPale,border:'none',borderRadius:10,
                fontFamily:"'Manrope',sans-serif",fontSize:13,fontWeight:600,color:T.primary,cursor:'pointer'}}>
              🖼️ Galeria
            </button>
            <button onClick={()=>camRef.current?.click()}
              style={{flex:1,padding:'12px 14px',background:T.primaryPale,border:'none',borderRadius:10,
                fontFamily:"'Manrope',sans-serif",fontSize:13,fontWeight:600,color:T.primary,cursor:'pointer'}}>
              📸 Câmera
            </button>
          </div>
        ):(
          <div>
            <div style={{borderRadius:'14px 14px 0 0',overflow:'hidden',border:'2px solid #f5edd8',borderBottom:'none'}}>
              <img src={preview} alt="Referência" style={{width:'100%',maxHeight:280,objectFit:'cover',display:'block'}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
              padding:'10px 14px',background:T.primaryPale,borderRadius:'0 0 12px 12px',
              border:'2px solid #f5edd8',borderTop:'none'}}>
              <span style={{fontSize:12,color:T.primary,fontWeight:600}}>✓ Foto adicionada ao pedido</span>
              <button onClick={remover} style={{background:'none',border:'none',cursor:'pointer',fontSize:12,color:T.onSurfaceLow,fontWeight:600}}>Remover</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// PORTAL DO CLIENTE
// ══════════════════════════════════════════════════════
function PortalCliente({cliente,onLogout,salonName='Joudat Salon'}){
  const [tab,setTab]=useState('agendar')
  const [srvs,setSrvs]=useState([])
  const [profs,setProfs]=useState([])
  const [ags,setAgs]=useState([])
  const [todosAgs,setTodosAgs]=useState([])
  const [selProf,setSelProf]=useState(null)
  const [selSrv,setSelSrv]=useState(null)
  const [selDmy,setSelDmy]=useState(todayStr())
  const [selTime,setSelTime]=useState('')
  const [fotoPreview,setFotoPreview]=useState(null)
  const [fotoBase64,setFotoBase64]=useState(null)
  const [err,setErr]=useState('')
  const [ok,setOk]=useState('')
  const [sending,setSending]=useState(false)
  const [showConfirm,setShowConfirm]=useState(false)
  const [fotoPopup,setFotoPopup]=useState(null)
  const fileRef=useRef(null)

  useEffect(()=>{
    supabase.from('services').select('*').eq('active',true).order('name').then(({data})=>setSrvs(data||[]))
    supabase.from('salon_professionals').select('*').eq('active',true).order('full_name').then(({data})=>setProfs(data||[]))
    supabase.from('salon_bookings').select('*').eq('client_name',cliente.full_name).order('booking_date','desc').then(({data})=>setAgs(data||[]))
    supabase.from('salon_bookings').select('*').neq('status','cancelled').then(({data})=>setTodosAgs(data||[]))
  },[cliente.full_name])

  // Serviços filtrados pelo tipo do profissional selecionado
  const srvsDoProf=selProf?srvs.filter(s=>!selProf.tipo||s.tipo===selProf.tipo||!s.tipo):srvs

  function getSlotsLivres(dmy){
    if(!selProf||!dmy||!selSrv)return[]
    if(!isDiaAberto(dmy))return[]
    const sc=getSalonSlots(dmy)
    const hi=(selProf.schedule_start||'08:00').slice(0,5)
    const hf=(selProf.schedule_end||'18:00').slice(0,5)
    const maxSim=selProf.tipo==='cabelereiro'?2:1
    const dur=Number(selSrv.duration_min)||30
    const taken=todosAgs.filter(a=>a.professional_name===selProf.full_name&&isoToDmy(a.booking_date)===dmy)
      .map(a=>{const d2=Number(a.duration_min)||30;return{ini:toMin((a.start_time||'').slice(0,5)),fim:toMin((a.start_time||'').slice(0,5))+d2}})
    return SLOTS.filter(h=>{
      if(h<hi||h>=hf)return false
      if(!sc.includes(h))return false
      if(!isFuture(dmy,h))return false
      const ini=toMin(h),fim=ini+dur
      if(fim>toMin(hf))return false
      return taken.filter(t=>ini<t.fim&&fim>t.ini).length<maxSim
    })
  }

  const slotsLivres=getSlotsLivres(selDmy)

  function handleFoto(e){
    const f=e.target.files?.[0];if(!f)return
    const r=new FileReader()
    r.onload=ev=>{setFotoPreview(ev.target.result);setFotoBase64(ev.target.result)}
    r.readAsDataURL(f)
  }

  async function confirmar(){
    setSending(true);setErr('')
    const{error}=await supabase.from('salon_bookings').insert({
      client_name:cliente.full_name,
      service_name:selSrv.name,
      professional_name:selProf.full_name,
      booking_date:dmyToISO(selDmy),
      start_time:selTime+':00',
      status:'pending',
      price_charged:selSrv.price||0,
      service_price:selSrv.price||0,
      duration_min:selSrv.duration_min||30,
      reference_photo:fotoBase64||null,
    })
    setSending(false)
    if(error){setErr('Erro: '+error.message);setShowConfirm(false);return}
    setShowConfirm(false)
    setOk('✅ Solicitação enviada! Aguarde confirmação do salão.')
    setSelProf(null);setSelSrv(null);setSelDmy(todayStr());setSelTime('');setFotoPreview(null);setFotoBase64(null)
    supabase.from('salon_bookings').select('*').eq('client_name',cliente.full_name).order('booking_date','desc').then(({data})=>setAgs(data||[]))
    setTimeout(()=>{setOk('');setTab('historico')},2200)
  }

  const minhasAgs=ags.map(a=>({
    id:a.id,dmy:isoToDmy(a.booking_date),time:(a.start_time||'').slice(0,5),
    srvName:a.service_name,profName:a.professional_name,status:a.status,price:Number(a.service_price)||0,
    refPhoto:a.reference_photo||null
  }))
  const statusInfo=s=>{
    if(s==='pending')  return{label:'Aguardando',bg:'#fdf3e0',color:'#8a6020'}
    if(s==='scheduled')return{label:'Confirmado',bg:'#e8f5ec',color:'#3a7a4a'}
    if(s==='completed')return{label:'Finalizado',bg:'#e8f5ec',color:'#3a7a4a'}
    if(s==='cancelled')return{label:'Cancelado',bg:'#fbeaea',color:'#b33a3a'}
    return{label:s,bg:'#f4f3f1',color:'#7a7a6a'}
  }

  const P='#9A7D56',PA='#C5A880',PP='rgba(197,168,128,.1)',PB='rgba(197,168,128,.3)'
  const css=`
    body{background:#FAFAFA!important;margin:0;}
    .cpw{max-width:440px;margin:0 auto;padding:0 16px 80px;}
    .tab-bar{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#f0ede8;padding:5px;border-radius:14px;margin-bottom:20px;}
    .tab-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;border:none;border-radius:10px;
      font-family:'Manrope',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;background:transparent;color:#999;}
    .tab-btn.on{background:#fff;color:${P};box-shadow:0 1px 6px rgba(0,0,0,.08);}
    .srv-card{background:#fff;border-radius:14px;padding:14px 16px;border:2px solid #eee;
      cursor:pointer;transition:all .18s;margin-bottom:10px;box-shadow:0 1px 4px rgba(0,0,0,.04);}
    .srv-card:active{transform:scale(.98);}
    .srv-card.sel{border-color:${PA};background:${PP};}
    .prof-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:4px;}
    .prof-card{background:#fff;border:2px solid #eee;border-radius:14px;padding:14px 10px;
      text-align:center;cursor:pointer;transition:all .18s;box-shadow:0 1px 4px rgba(0,0,0,.04);}
    .prof-card.sel{border-color:${PA};background:${PP};}
    .time-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px;}
    .tc{padding:9px 4px;border:2px solid #eee;border-radius:10px;background:#fff;
      font-family:'Manrope',sans-serif;font-size:12px;font-weight:600;cursor:pointer;
      text-align:center;transition:all .18s;color:#444;box-shadow:0 1px 3px rgba(0,0,0,.04);}
    .tc.sel{background:${PA};border-color:${PA};color:#fff;}
    .upload-area{border:2px dashed ${PA};border-radius:14px;padding:24px 16px;
      text-align:center;cursor:pointer;transition:all .18s;background:#fdf9f3;}
    .upload-area:hover{background:${PP};}
    .lbl-s{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
      color:#aaa;display:flex;align-items:center;gap:6px;margin-bottom:10px;}
    .res-card{background:#fff;border-radius:14px;padding:14px 16px;border:1px solid #f0ede8;
      box-shadow:0 1px 4px rgba(0,0,0,.04);display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;}
    .hdr{background:#fff;border-bottom:1px solid #f0ede8;position:sticky;top:0;z-index:100;box-shadow:0 1px 8px rgba(0,0,0,.06);}
    .overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:200;display:flex;align-items:flex-end;justify-content:center;}
    .popup{background:#fff;border-radius:24px 24px 0 0;padding:28px 24px 36px;width:100%;max-width:440px;animation:slideUp .28s ease;}
    @keyframes slideUp{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}
  `

  return(
    <>
      <style>{G}</style>
      <style>{css}</style>

      {/* HEADER */}
      <div className="hdr">
        <div style={{maxWidth:440,margin:'0 auto',padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:40,height:40,borderRadius:'50%',
              background:`linear-gradient(135deg,${PA},${P})`,
              display:'flex',alignItems:'center',justifyContent:'center',
              fontFamily:'Noto Serif,serif',fontSize:17,fontWeight:700,color:'#fff',
              boxShadow:'0 2px 8px rgba(197,168,128,.35)'}}>
              {(cliente.full_name||'?')[0]}
            </div>
            <div>
              <div style={{fontSize:11,color:'#aaa',fontWeight:500}}>Olá, bem-vindo!</div>
              <div style={{fontSize:13,fontWeight:700,color:'#333'}}>{cliente.full_name.split(' ')[0]}</div>
            </div>
          </div>
          <button onClick={onLogout} style={{fontSize:11,fontWeight:700,color:'#e53e3e',
            background:'#fff5f5',border:'none',padding:'6px 14px',borderRadius:20,cursor:'pointer'}}>Sair</button>
        </div>
      </div>

      <div className="cpw" style={{marginTop:16}}>
        {/* TABS */}
        <div className="tab-bar">
          {[{id:'agendar',ic:'✨',l:'Novo Agendamento'},{id:'historico',ic:'📋',l:'Minhas Reservas'}].map(t=>(
            <button key={t.id} className={`tab-btn${tab===t.id?' on':''}`} onClick={()=>setTab(t.id)}>
              <span>{t.ic}</span>{t.l}
            </button>
          ))}
        </div>

        {/* ── ABA AGENDAR ── */}
        {tab==='agendar'&&(
          <div>
            {ok&&<div className="alert alert-success" style={{marginBottom:16}}>{ok}</div>}

            <div style={{background:'#fffbf2',border:'1px solid #f5e6c8',borderRadius:14,
              padding:'12px 14px',display:'flex',gap:10,marginBottom:20,alignItems:'flex-start'}}>
              <span style={{fontSize:16,flexShrink:0}}>✅</span>
              <p style={{fontSize:12,color:'#8a6020',margin:0,lineHeight:1.6}}>
                Sua solicitação será enviada ao salão e confirmada em tempo real pela nossa equipe.
              </p>
            </div>

            {/* 1. PROFISSIONAL */}
            <div style={{marginBottom:20}}>
              <div className="lbl-s">👤 1. Com quem você quer ser atendida? *</div>
              <div className="prof-grid">
                {profs.map(p=>(
                  <div key={p.id} className={`prof-card${selProf?.id===p.id?' sel':''}`}
                    onClick={()=>{setSelProf(p);setSelSrv(null);setSelTime('')}}>
                    <div style={{width:46,height:46,borderRadius:'50%',margin:'0 auto 8px',
                      background:selProf?.id===p.id?`linear-gradient(135deg,${PA},${P})`:'#f0ede8',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontFamily:'Noto Serif,serif',fontSize:18,fontWeight:700,
                      color:selProf?.id===p.id?'#fff':'#aaa'}}>
                      {(p.full_name||'?')[0]}
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color:'#333',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.full_name.split(' ')[0]}</div>
                    <div style={{fontSize:10,color:'#aaa',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.specialty||'Especialista'}</div>
                    {selProf?.id===p.id&&<div style={{fontSize:10,color:P,marginTop:4,fontWeight:700}}>✓ Selecionada</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* 2. SERVIÇO — filtrado pelo tipo da profissional */}
            {selProf&&(
              <div style={{marginBottom:20}}>
                <div className="lbl-s">✂️ 2. Qual procedimento? *</div>
                {srvsDoProf.length===0
                  ?<div style={{background:'#f9f9f9',border:'1px dashed #ddd',borderRadius:12,padding:16,textAlign:'center',fontSize:12,color:'#aaa'}}>
                    Nenhum serviço disponível para esta profissional
                  </div>
                  :srvsDoProf.map(s=>(
                    <div key={s.id} className={`srv-card${selSrv?.id===s.id?' sel':''}`}
                      onClick={()=>{setSelSrv(s);setSelTime('')}}>
                      <div style={{fontSize:13,fontWeight:700,color:'#222',marginBottom:3}}>{s.name}</div>
                      <div style={{fontSize:11,color:'#aaa',lineHeight:1.5}}>
                        {s.description||`${s.duration_min} min de duração`}
                      </div>
                      {selSrv?.id===s.id&&<div style={{fontSize:10,color:P,marginTop:6,fontWeight:700}}>✓ Selecionado</div>}
                    </div>
                  ))
                }
              </div>
            )}

            {/* 3. DATA */}
            {selSrv&&(
              <div style={{marginBottom:20}}>
                <div className="lbl-s">📅 3. Quando? *</div>
                <input type="date" min={todayISO()} value={dmyToISO(selDmy)||''}
                  onChange={e=>{setSelDmy(isoToDmy(e.target.value));setSelTime('')}}
                  style={{width:'100%',background:'#fff',border:'1px solid #e8e3db',borderRadius:12,
                    padding:'12px 14px',fontSize:14,fontFamily:'Manrope,sans-serif',outline:'none',
                    boxSizing:'border-box',boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}/>
              </div>
            )}

            {/* 4. HORÁRIO */}
            {selSrv&&selDmy&&(
              <div style={{marginBottom:20}}>
                <div className="lbl-s">🕐 4. Horário disponível *</div>
                {slotsLivres.length===0
                  ?<div style={{background:'#f9f9f9',border:'1px dashed #ddd',borderRadius:12,
                      padding:16,textAlign:'center',fontSize:12,color:'#aaa'}}>
                    Nenhum horário disponível para esta data
                  </div>
                  :<div className="time-grid">
                    {slotsLivres.map(h=>(
                      <div key={h} className={`tc${selTime===h?' sel':''}`} onClick={()=>setSelTime(h)}>{h}</div>
                    ))}
                  </div>
                }
              </div>
            )}

            {/* 5. FOTO (opcional) */}
            {selTime&&(
              <div style={{marginBottom:20}}>
                <div className="lbl-s">📎 Foto de referência <span style={{textTransform:'none',letterSpacing:0,fontWeight:400}}>(opcional)</span></div>
                <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleFoto}/>
                {!fotoPreview
                  ?<div className="upload-area" onClick={()=>fileRef.current?.click()}>
                    <div style={{fontSize:28,marginBottom:6}}>📎</div>
                    <div style={{fontSize:13,fontWeight:600,color:P}}>Toque para subir da galeria</div>
                    <div style={{fontSize:11,color:'#aaa',marginTop:4}}>A profissional verá sua referência</div>
                  </div>
                  :<div style={{borderRadius:14,overflow:'hidden',border:`2px solid ${PB}`}} onClick={()=>fileRef.current?.click()}>
                    <img src={fotoPreview} alt="Ref" style={{width:'100%',maxHeight:200,objectFit:'cover',display:'block'}}/>
                    <div style={{padding:'8px 14px',background:PP,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:12,color:P,fontWeight:600}}>✓ Foto adicionada</span>
                      <button onClick={e=>{e.stopPropagation();setFotoPreview(null)}}
                        style={{background:'none',border:'none',cursor:'pointer',fontSize:12,color:'#aaa'}}>Remover</button>
                    </div>
                  </div>
                }
              </div>
            )}

            {err&&<div className="alert alert-danger" style={{marginBottom:12}}>{err}</div>}

            {/* BOTÃO CONFIRMAR */}
            {selProf&&selSrv&&selDmy&&selTime&&(
              <button onClick={()=>setShowConfirm(true)}
                style={{width:'100%',background:`linear-gradient(135deg,${PA},${P})`,color:'#fff',border:'none',
                  borderRadius:14,padding:15,fontFamily:'Manrope,sans-serif',fontSize:12,fontWeight:800,
                  letterSpacing:2,textTransform:'uppercase',cursor:'pointer',
                  boxShadow:'0 4px 16px rgba(197,168,128,.4)'}}>
                Confirmar Agendamento
              </button>
            )}
          </div>
        )}

        {/* ── ABA HISTÓRICO ── */}
        {tab==='historico'&&(
          <div>
            <div className="lbl-s" style={{marginBottom:12}}>📋 Seu histórico de solicitações</div>
            {minhasAgs.length===0
              ?<div style={{background:'#fff',border:'1px solid #f0ede8',borderRadius:14,
                  padding:40,textAlign:'center',color:'#aaa',fontSize:13,boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
                  <div style={{fontSize:32,marginBottom:8}}>📅</div>
                  Você ainda não possui nenhum agendamento registrado.
                </div>
              :minhasAgs.map(a=>{
                  const si=statusInfo(a.status)
                  return(
                    <div key={a.id} className="res-card" style={{flexDirection:'column',alignItems:'stretch'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                        <div style={{flex:1,minWidth:0}}>
                          <span style={{fontSize:10,padding:'3px 8px',borderRadius:20,fontWeight:700,
                            textTransform:'uppercase',background:si.bg,color:si.color,display:'inline-block',marginBottom:6}}>
                            {si.label}
                          </span>
                          <div style={{fontSize:14,fontWeight:700,color:'#222'}}>{a.srvName}</div>
                          <div style={{fontSize:11,color:'#aaa',marginTop:2}}>{a.profName} · {a.dmy} às {a.time}</div>
                        </div>
                        <div style={{fontSize:14,fontWeight:800,color:P,flexShrink:0,marginLeft:10}}>{fmtCurrency(a.price)}</div>
                      </div>
                      {a.status!=='completed'&&a.refPhoto&&(
                        <button onClick={()=>setFotoPopup(a.refPhoto)}
                          style={{marginTop:8,background:'none',border:'none',cursor:'pointer',
                            display:'flex',alignItems:'center',gap:6,padding:0}}>
                          <span style={{fontSize:18}}>📎</span>
                          <span style={{fontSize:12,color:'#9A7D56',fontWeight:700,textDecoration:'underline'}}>
                            Ver foto de referência
                          </span>
                        </button>
                      )}
                    </div>
                  )
                })
            }
            <div style={{background:'#fff',border:'1px solid #f0ede8',borderRadius:14,
              padding:16,marginTop:20,boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
              <div className="lbl-s">🔒 Segurança da conta</div>
              <AlterarSenhaCli cliente={cliente}/>
            </div>
          </div>
        )}
      </div>

      {/* Popup Foto de Referência */}
      {fotoPopup&&(
        <div onClick={()=>setFotoPopup(null)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:300,
            display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div onClick={e=>e.stopPropagation()}
            style={{background:'#fff',borderRadius:20,overflow:'hidden',maxWidth:440,width:'100%'}}>
            <div style={{padding:'14px 18px',display:'flex',justifyContent:'space-between',alignItems:'center',
              borderBottom:'1px solid #f0ede8'}}>
              <span style={{fontWeight:700,fontSize:14}}>📎 Minha Referência</span>
              <button onClick={()=>setFotoPopup(null)}
                style={{background:'none',border:'none',cursor:'pointer',fontSize:20,color:'#aaa',padding:4}}>×</button>
            </div>
            <img src={fotoPopup} alt="Referência"
              style={{width:'100%',maxHeight:460,objectFit:'contain',display:'block',background:'#fafafa'}}/>
          </div>
        </div>
      )}

      {/* ── POPUP DE CONFIRMAÇÃO ── */}
      {showConfirm&&(
        <div className="overlay" onClick={()=>setShowConfirm(false)}>
          <div className="popup" onClick={e=>e.stopPropagation()}>
            <div style={{textAlign:'center',marginBottom:20}}>
              <div style={{fontSize:32,marginBottom:6}}>📋</div>
              <div style={{fontFamily:'Noto Serif,serif',fontSize:18,fontWeight:700,color:'#222'}}>Confirmar Agendamento</div>
              <div style={{fontSize:12,color:'#aaa',marginTop:4}}>Revise os detalhes antes de enviar</div>
            </div>
            <div style={{background:'#fdf9f3',borderRadius:16,padding:18,marginBottom:20,border:'1px solid #f5e6c8'}}>
              {[
                {ic:'👤',l:'Profissional',v:selProf?.full_name},
                {ic:'✂️',l:'Serviço',v:selSrv?.name},
                {ic:'📅',l:'Data',v:selDmy},
                {ic:'🕐',l:'Horário',v:selTime},
                {ic:'💰',l:'Valor',v:fmtCurrency(selSrv?.price||0)},
              ].map(x=>(
                <div key={x.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                  padding:'10px 0',borderBottom:'1px solid #f0e8d8'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:15}}>{x.ic}</span>
                    <span style={{fontSize:12,color:'#aaa',fontWeight:600}}>{x.l}</span>
                  </div>
                  <span style={{fontSize:13,fontWeight:700,color:'#222'}}>{x.v}</span>
                </div>
              ))}
            </div>
            {err&&<div className="alert alert-danger" style={{marginBottom:12}}>{err}</div>}
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setShowConfirm(false)}
                style={{flex:1,padding:13,background:'#f4f3f1',border:'none',borderRadius:12,
                  fontFamily:'Manrope,sans-serif',fontSize:12,fontWeight:700,color:'#666',cursor:'pointer'}}>
                Voltar
              </button>
              <button onClick={confirmar} disabled={sending}
                style={{flex:2,padding:13,background:sending?'#ccc':`linear-gradient(135deg,${PA},${P})`,
                  border:'none',borderRadius:12,fontFamily:'Manrope,sans-serif',fontSize:12,
                  fontWeight:800,color:'#fff',cursor:sending?'not-allowed':'pointer',
                  letterSpacing:1,textTransform:'uppercase',boxShadow:'0 4px 14px rgba(197,168,128,.35)'}}>
                {sending?'Enviando…':'✓ Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ══════════════════════════════════════════════════════
// COMPONENTE FUNCIONAMENTO DO SALÃO
// ══════════════════════════════════════════════════════
const DIAS_SEMANA = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']
const DIAS_KEY    = ['seg','ter','qua','qui','sex','sab','dom']

function FuncionamentoAdmin({toast2}){
  const defaultConfig={
    seg:{ativo:true, ini:'08:00', fim:'18:00'},
    ter:{ativo:true, ini:'08:00', fim:'18:00'},
    qua:{ativo:true, ini:'08:00', fim:'18:00'},
    qui:{ativo:true, ini:'08:00', fim:'18:00'},
    sex:{ativo:true, ini:'08:00', fim:'18:00'},
    sab:{ativo:true, ini:'08:00', fim:'13:00'},
    dom:{ativo:false,ini:'08:00', fim:'12:00'},
    nome:'Joudat Salon',
    telefone:'',
    mensagem:'Bem-vindo ao Joudat Salon! Agende seu horário pelo nosso portal.',
  }

  const [cfg,setCfg]=useState(()=>{
    try{
      const saved=localStorage.getItem('joudat_funcionamento')
      return saved?JSON.parse(saved):defaultConfig
    }catch{return defaultConfig}
  })
  const [saved,setSaved]=useState(false)

  function setDia(key,field,val){
    setCfg(c=>({...c,[key]:{...c[key],[field]:val}}))
    setSaved(false)
  }

  function salvar(){
    localStorage.setItem('joudat_funcionamento',JSON.stringify(cfg))
    window.dispatchEvent(new StorageEvent('storage',{key:'joudat_funcionamento',newValue:JSON.stringify(cfg)}))
    setSaved(true)
    toast2('Configurações salvas!')
    setTimeout(()=>setSaved(false),3000)
  }

  const T2={
    surface:'#faf9f6',surfaceLow:'#f4f3f1',surfaceMed:'#efeeeb',
    primary:'#775a19',primaryLight:'#d4ad65',primaryPale:'#f5edd8',
    onSurface:'#1a1c1a',onSurfaceLow:'#7a7a6a',success:'#3a7a4a',successPale:'#e8f5ec',
  }

  const HORAS=['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
    '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
    '16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00']

  return(
    <div style={{maxWidth:680}}>
      {/* Dados do salão */}
      <div style={{background:'white',borderRadius:20,overflow:'hidden',marginBottom:16}}>
        <div style={{padding:'16px 20px',borderBottom:`1px solid ${T2.surfaceLow}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontFamily:'Noto Serif,serif',fontSize:17,fontWeight:600,color:T2.onSurface}}>Dados do Salão</span>
        </div>
        <div style={{padding:'0 20px 20px'}}>
          <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:T2.primary,marginBottom:8,marginTop:18}}>Nome do Salão</label>
          <input value={cfg.nome||''} onChange={e=>setCfg(c=>({...c,nome:e.target.value}))} className="inp" placeholder="Nome do seu salão"/>
          <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:T2.primary,marginBottom:8,marginTop:18}}>Telefone / WhatsApp</label>
          <input value={cfg.telefone||''} onChange={e=>setCfg(c=>({...c,telefone:e.target.value}))} className="inp" placeholder="(11) 99999-0000"/>
          <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:T2.primary,marginBottom:8,marginTop:18}}>Mensagem de Boas-vindas</label>
          <input value={cfg.mensagem||''} onChange={e=>setCfg(c=>({...c,mensagem:e.target.value}))} className="inp" placeholder="Mensagem exibida no portal do cliente"/>
        </div>
      </div>

      {/* Dias e horários */}
      <div style={{background:'white',borderRadius:20,overflow:'hidden',marginBottom:16}}>
        <div style={{padding:'16px 20px',borderBottom:`1px solid ${T2.surfaceLow}`}}>
          <span style={{fontFamily:'Noto Serif,serif',fontSize:17,fontWeight:600,color:T2.onSurface}}>Dias e Horários de Funcionamento</span>
        </div>
        <div style={{padding:'8px 0 16px'}}>
          {DIAS_KEY.map((key,i)=>{
            const d=cfg[key]||{ativo:false,ini:'08:00',fim:'18:00'}
            return(
              <div key={key} style={{
                display:'flex',alignItems:'center',gap:12,padding:'12px 20px',
                borderBottom:`1px solid ${T2.surfaceLow}`,flexWrap:'wrap',
                background:d.ativo?'white':T2.surfaceLow,
                opacity:d.ativo?1:.65,
                transition:'all .18s',
              }}>
                {/* Toggle ativo */}
                <div style={{display:'flex',alignItems:'center',gap:8,minWidth:110}}>
                  <div onClick={()=>setDia(key,'ativo',!d.ativo)} style={{
                    width:40,height:22,borderRadius:11,cursor:'pointer',
                    background:d.ativo?T2.primary:T2.surfaceMed,
                    position:'relative',transition:'background .2s',flexShrink:0
                  }}>
                    <div style={{
                      position:'absolute',top:3,left:d.ativo?20:3,
                      width:16,height:16,borderRadius:'50%',background:'white',
                      transition:'left .2s',boxShadow:'0 1px 4px rgba(0,0,0,.2)'
                    }}/>
                  </div>
                  <span style={{fontSize:13,fontWeight:d.ativo?700:400,color:d.ativo?T2.onSurface:T2.onSurfaceLow,minWidth:70}}>{DIAS_SEMANA[i]}</span>
                </div>
                {d.ativo
                  ?<div style={{display:'flex',alignItems:'center',gap:8,flex:1}}>
                    <div>
                      <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:T2.primary,marginBottom:4}}>Abertura</div>
                      <select value={d.ini} onChange={e=>setDia(key,'ini',e.target.value)} className="sel" style={{width:90,padding:'8px 10px'}}>
                        {HORAS.map(h=><option key={h}>{h}</option>)}
                      </select>
                    </div>
                    <span style={{color:T2.onSurfaceLow,marginTop:16,fontWeight:600}}>até</span>
                    <div>
                      <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:T2.primary,marginBottom:4}}>Fechamento</div>
                      <select value={d.fim} onChange={e=>setDia(key,'fim',e.target.value)} className="sel" style={{width:90,padding:'8px 10px'}}>
                        {HORAS.filter(h=>h>d.ini).map(h=><option key={h}>{h}</option>)}
                      </select>
                    </div>
                    <div style={{marginLeft:'auto',padding:'6px 12px',background:T2.primaryPale,borderRadius:8,fontSize:11,fontWeight:600,color:T2.primary,whiteSpace:'nowrap'}}>
                      {d.ini} – {d.fim}
                    </div>
                  </div>
                  :<span style={{fontSize:12,color:T2.onSurfaceLow,fontStyle:'italic'}}>Fechado</span>
                }
              </div>
            )
          })}
        </div>
      </div>

      {/* Resumo visual */}
      <div style={{background:'white',borderRadius:20,overflow:'hidden',marginBottom:16}}>
        <div style={{padding:'14px 20px',borderBottom:`1px solid ${T2.surfaceLow}`}}>
          <span style={{fontFamily:'Noto Serif,serif',fontSize:15,fontWeight:600,color:T2.onSurface}}>Resumo de Funcionamento</span>
        </div>
        <div style={{padding:'14px 20px',display:'flex',flexWrap:'wrap',gap:8}}>
          {DIAS_KEY.map((key,i)=>{
            const d=cfg[key]||{ativo:false}
            return(
              <div key={key} style={{
                padding:'8px 12px',borderRadius:10,fontSize:11,fontWeight:600,
                background:d.ativo?T2.primaryPale:T2.surfaceLow,
                color:d.ativo?T2.primary:T2.onSurfaceLow,
              }}>
                <div style={{marginBottom:2}}>{DIAS_SEMANA[i].slice(0,3)}</div>
                {d.ativo
                  ?<div style={{fontSize:10,fontWeight:400}}>{d.ini}–{d.fim}</div>
                  :<div style={{fontSize:10,fontWeight:400,fontStyle:'italic'}}>Fechado</div>
                }
              </div>
            )
          })}
        </div>
      </div>

      <button onClick={salvar} className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:14,fontSize:13}}>
        {saved?'✓ Configurações Salvas!':'Salvar Configurações'}
      </button>
      <div style={{marginTop:10,fontSize:11,color:T2.onSurfaceLow,textAlign:'center'}}>
        As configurações ficam salvas no navegador deste dispositivo.
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// COMPONENTE ALTERAR SENHA ADMIN
// ══════════════════════════════════════════════════════
function AdminSenhaComp({toast2}){
  const [senhaAtual,setSenhaAtual]=useState('')
  const [senhaNova,setSenhaNova]=useState('')
  const [senhaConf,setSenhaConf]=useState('')
  const [err,setErr]=useState('')
  const [ok,setOk]=useState('')

  // Senha do admin fica numa variável de ambiente ou armazenada localmente
  // Como não temos tabela de admin, usamos localStorage para persistir
  async function salvar(){
    setErr('');setOk('')
    if(!senhaAtual){setErr('Informe a senha atual');return}
    if(!senhaNova||senhaNova.length<6){setErr('Nova senha deve ter pelo menos 6 caracteres');return}
    if(senhaNova!==senhaConf){setErr('As senhas não coincidem');return}
    try{
      const res=await fetch('/api/alterar-senha',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({tipo:'admin',senhaAtual,senhaNova})
      })
      const json=await res.json()
      if(!json.ok){setErr(json.erro||'Erro ao alterar');return}
      setOk('✅ Senha alterada com sucesso!')
      setSenhaAtual('');setSenhaNova('');setSenhaConf('')
      toast2('Senha do administrador alterada!')
    }catch(e){setErr('Erro de conexão. Tente novamente.')}
  }

  return(
    <>
      <label className="lbl">Senha atual *</label>
      <input type="password" value={senhaAtual} onChange={e=>{setSenhaAtual(e.target.value);setErr('');setOk('')}} placeholder="Senha atual" className="inp"/>
      <label className="lbl">Nova senha *</label>
      <input type="password" value={senhaNova} onChange={e=>{setSenhaNova(e.target.value);setErr('');setOk('')}} placeholder="Mínimo 4 caracteres" className="inp"/>
      <label className="lbl">Confirmar nova senha *</label>
      <input type="password" value={senhaConf} onChange={e=>{setSenhaConf(e.target.value);setErr('');setOk('')}} onKeyDown={e=>e.key==='Enter'&&salvar()} placeholder="Repita a nova senha" className="inp"/>
      {err&&<div className="alert alert-danger" style={{marginTop:10}}>{err}</div>}
      {ok&&<div className="alert alert-success" style={{marginTop:10}}>{ok}</div>}
      <button className="btn btn-primary" style={{width:'100%',marginTop:20,justifyContent:'center'}} onClick={salvar}>
        Salvar Nova Senha
      </button>
      <div style={{marginTop:12,fontSize:11,color:'#7a7a6a',textAlign:'center'}}>Senha padrão inicial: 123456</div>
    </>
  )
}

// ══════════════════════════════════════════════════════
// ROOT — login unificado
// ══════════════════════════════════════════════════════
export default function Joudat(){
  const [salonName,setSalonName]=useState('Joudat Salon')
  // Carregar nome do salão só no cliente (localStorage não existe no servidor)
  useEffect(()=>{
    try{
      const c=localStorage.getItem('joudat_funcionamento')
      if(c){const p=JSON.parse(c);if(p.nome)setSalonName(p.nome)}
    }catch{}
    function onStorage(e){
      if(e.key==='joudat_funcionamento'&&e.newValue){
        try{const c=JSON.parse(e.newValue);if(c.nome)setSalonName(c.nome)}catch{}
      }
    }
    window.addEventListener('storage',onStorage)
    return()=>window.removeEventListener('storage',onStorage)
  },[])

  // Restaura sessão do localStorage ao carregar
  const [mode,setMode]=useState(()=>{
    try{ return localStorage.getItem('joudat_mode')||null }catch{return null}
  })
  const [profData,setProfData]=useState(()=>{
    try{
      const d=localStorage.getItem('joudat_prof')
      return d?JSON.parse(d):null
    }catch{return null}
  })
  const [cliData,setCliData]=useState(()=>{
    try{
      const d=localStorage.getItem('joudat_cli')
      return d?JSON.parse(d):null
    }catch{return null}
  })

  function loginAdmin(){
    localStorage.setItem('joudat_mode','admin')
    localStorage.removeItem('joudat_prof')
    localStorage.removeItem('joudat_cli')
    setMode('admin')
  }
  function loginProf(p){
    localStorage.setItem('joudat_mode','prof')
    localStorage.setItem('joudat_prof',JSON.stringify(p))
    localStorage.removeItem('joudat_cli')
    setProfData(p);setMode('prof')
  }
  function loginCli(c){
    localStorage.setItem('joudat_mode','cliente')
    localStorage.setItem('joudat_cli',JSON.stringify(c))
    localStorage.removeItem('joudat_prof')
    setCliData(c);setMode('cliente')
  }
  function logout(){
    localStorage.removeItem('joudat_mode')
    localStorage.removeItem('joudat_prof')
    localStorage.removeItem('joudat_cli')
    setMode(null);setProfData(null);setCliData(null)
  }

  if(mode==='admin')   return <Admin onLogout={logout} salonName={salonName}/>
  if(mode==='prof'&&profData)   return <ProfPanel prof={profData} onLogout={logout}/>
  if(mode==='cliente'&&cliData) return <PortalCliente cliente={cliData} onLogout={logout} salonName={salonName}/>
  return <Login onAdmin={loginAdmin} onProf={loginProf} onCliente={loginCli} salonName={salonName}/>
}
