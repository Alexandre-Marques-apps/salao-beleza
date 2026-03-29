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
function Login({onAdmin,onProf,onCliente}){
  const [u,setU]=useState('')
  const [p,setP]=useState('')
  const [err,setErr]=useState('')
  const [ld,setLd]=useState(false)

  async function go(){
    if(!u.trim()){setErr('Informe seu nome');return}
    if(!p){setErr('Informe sua senha');return}
    setLd(true);setErr('')
    // verifica senha do admin
    const adminSenha=typeof window!=='undefined'?(localStorage.getItem('admin_senha')||ADMIN_PASS):ADMIN_PASS
    if(u.trim()===ADMIN&&p===adminSenha){setLd(false);onAdmin();return}
    // verifica profissional
    const{data:profData,error:profErr}=await supabase.from('salon_professionals').select('*').ilike('full_name',u.trim()).eq('active',true).single()
    if(!profErr&&profData){
      setLd(false)
      if(p!==(profData.senha||'123456')){setErr('Senha incorreta');return}
      onProf(profData);return
    }
    // verifica cliente
    const{data:cliData,error:cliErr}=await supabase.from('salon_clients').select('*').ilike('full_name',u.trim()).single()
    setLd(false)
    if(cliErr||!cliData){setErr('Usuário não encontrado');return}
    if(p!==(cliData.senha||'1234')){setErr('Senha incorreta');return}
    onCliente(cliData)
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
              <div className="sb-title">Joudat</div>
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

  const tabs2=[{id:'hoje',label:'Hoje',ic:'📅'},{id:'proximos',label:'Próximos',ic:'🗓'},{id:'agendar',label:'Agendar',ic:'➕'},{id:'notificacoes',label:'Avisos',ic:'🔔'},{id:'rendimentos',label:'Ganhos',ic:'◎'},{id:'bloqueios',label:'Bloqueios',ic:'🚫'},{id:'senha',label:'Senha',ic:'🔑'}]

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
    if(senhaAtual!==(cliente.senha||'1234')){setErr('Senha atual incorreta');return}
    if(!senhaNova||senhaNova.length<4){setErr('Nova senha deve ter pelo menos 4 caracteres');return}
    if(senhaNova!==senhaConf){setErr('As senhas não coincidem');return}
    const{error}=await supabase.from('salon_clients').update({senha:senhaNova}).eq('id',cliente.id)
    if(error){setErr('Erro: '+error.message);return}
    cliente.senha=senhaNova
    setOk('✅ Senha alterada com sucesso!')
    setSenhaAtual('');setSenhaNova('');setSenhaConf('')
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
      <button className="btn btn-primary" style={{width:'100%',marginTop:16,justifyContent:'center'}} onClick={salvar}>
        Salvar Nova Senha
      </button>
      <div style={{marginTop:10,fontSize:11,color:'#7a7a6a',textAlign:'center'}}>Senha padrão: 1234</div>
    </>
  )
}

// ══════════════════════════════════════════════════════
// PORTAL DO CLIENTE
// ══════════════════════════════════════════════════════
function PortalCliente({cliente,onLogout}){
  const [srvs,setSrvs]=useState([])
  const [profs,setProfs]=useState([])
  const [ags,setAgs]=useState([])
  const [form,setForm]=useState({service_name:'',professional_name:'',dmy:todayStr(),time:''})
  const [err,setErr]=useState('')
  const [ok,setOk]=useState('')
  const [minhasReservas,setMinhasReservas]=useState([])
  const F=k=>v=>setForm(f=>({...f,[k]:v}))

  useEffect(()=>{
    supabase.from('services').select('*').eq('active',true).order('name').then(({data})=>setSrvs(data||[]))
    supabase.from('salon_professionals').select('*').eq('active',true).order('full_name').then(({data})=>setProfs(data||[]))
    supabase.from('salon_bookings').select('*').eq('client_name',cliente.full_name).order('booking_date','desc').then(({data})=>setAgs(data||[]))
  },[cliente.full_name])

  const profsParaServico=()=>{
    const s=srvs.find(x=>x.name===form.service_name)
    if(!s||!s.tipo)return profs
    return profs.filter(p=>p.tipo===s.tipo)
  }

  const [todosAgs,setTodosAgs]=useState([])
  useEffect(()=>{
    // carrega TODOS agendamentos para validar conflitos corretamente
    supabase.from('salon_bookings').select('*').neq('status','cancelled').then(({data})=>setTodosAgs(data||[]))
  },[])

  const slotsLivres=()=>{
    if(!form.professional_name||!form.dmy||!form.service_name)return SLOTS
    // salão fechado neste dia
    if(!isDiaAberto(form.dmy))return[]
    const salonSlotsC=getSalonSlots(form.dmy)
    const p=profs.find(x=>x.full_name===form.professional_name)
    if(!p)return[]
    const hi=(p.schedule_start||'08:00').slice(0,5)
    const hf=(p.schedule_end||'18:00').slice(0,5)
    // MESMA regra: manicure/sobrancelha=1 | cabelereiro=2
    const maxSim=p.tipo==='cabelereiro'?2:1
    const srvNow=srvs.find(x=>x.name===form.service_name)
    const durNow=Number(srvNow?.duration_min)||30
    const taken=todosAgs
      .filter(a=>a.professional_name===form.professional_name&&isoToDmy(a.booking_date)===form.dmy)
      .map(a=>{
        const s=srvs.find(x=>x.name===a.service_name)
        const dur=Number(a.duration_min)||Number(s?.duration_min)||30
        return{ini:toMin((a.start_time||'').slice(0,5)),fim:toMin((a.start_time||'').slice(0,5))+dur}
      })
    return SLOTS.filter(h=>{
      if(h<hi||h>=hf)return false
      if(!salonSlotsC.includes(h))return false
      if(!isFuture(form.dmy,h))return false
      const ini=toMin(h),fim=ini+durNow
      if(fim>toMin(hf))return false
      // bloqueia qualquer sobreposição para manicure/sobrancelha
      const overlapping=taken.filter(t=>ini<t.fim&&fim>t.ini).length
      if(overlapping>=maxSim)return false
      return true
    })
  }

  async function enviarSolicitacao(){
    setErr('');setOk('')
    if(!form.service_name||!form.professional_name||!form.dmy||!form.time){setErr('Preencha todos os campos');return}
    const s=srvs.find(x=>x.name===form.service_name)
    const{error}=await supabase.from('salon_bookings').insert({
      client_name:cliente.full_name,
      service_name:form.service_name,
      professional_name:form.professional_name,
      booking_date:dmyToISO(form.dmy),
      start_time:form.time+':00',
      status:'pending',
      price_charged:s?.price||0,
      service_price:s?.price||0,
      duration_min:s?.duration_min||30,
    })
    if(error){setErr('Erro ao enviar: '+error.message);return}
    setOk('✅ Solicitação enviada! Aguarde a aprovação do salão.')
    setForm({service_name:'',professional_name:'',dmy:todayStr(),time:''})
    supabase.from('salon_bookings').select('*').eq('client_name',cliente.full_name).order('booking_date','desc').then(({data})=>setAgs(data||[]))
  }

  const minhasAgs=ags.map(a=>({
    id:a.id,dmy:isoToDmy(a.booking_date),time:(a.start_time||'').slice(0,5),
    srvName:a.service_name,profName:a.professional_name,status:a.status,
    price:Number(a.service_price)||0
  }))

  const statusInfo=(s)=>{
    if(s==='pending')   return {label:'⏳ Aguardando aprovação',bg:'#fdf3e0',color:'#8a6020'}
    if(s==='scheduled') return {label:'✅ Confirmado',bg:'#e8f5ec',color:'#3a7a4a'}
    if(s==='completed') return {label:'✓ Finalizado',bg:'#e8f5ec',color:'#3a7a4a'}
    if(s==='cancelled') return {label:'❌ Cancelado',bg:'#fbeaea',color:'#b33a3a'}
    return {label:s,bg:'#f4f3f1',color:'#7a7a6a'}
  }

  return(
    <>
      <style>{G}</style>
      <style>{`body{background:${T.surfaceLow}!important;}.pw{max-width:620px;margin:0 auto;padding:20px 16px 60px;}`}</style>
      <div className="pw">
        {/* Header */}
        <div className="card au" style={{marginBottom:16}}>
          <div style={{padding:'18px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:48,height:48,borderRadius:'50%',background:`linear-gradient(135deg,${T.primaryLight},${T.primary})`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Noto Serif,serif',fontSize:20,fontWeight:700,color:'white',flexShrink:0}}>
                {(cliente.full_name||'?')[0]}
              </div>
              <div>
                <div style={{fontFamily:'Noto Serif,serif',fontSize:20,fontWeight:600}}>Olá, {cliente.full_name.split(' ')[0]}!</div>
                <div style={{fontSize:11,color:T.onSurfaceLow,marginTop:2}}>Joudat Salon — Portal do Cliente</div>
              </div>
            </div>
            <button onClick={onLogout} className="btn btn-ghost btn-sm">Sair</button>
          </div>
        </div>

        {/* Formulário de solicitação */}
        <div className="card au1">
          <div className="card-hd"><span className="ch">Solicitar Agendamento</span></div>
          <div style={{padding:'0 20px 20px'}}>
            <div className="alert alert-info" style={{marginTop:10,marginBottom:4}}>
              💡 Sua solicitação será enviada ao salão e confirmada pelo administrador.
            </div>
            <Lbl c="Serviço *"/>
            <Sel v={form.service_name} set={v=>setForm(f=>({...f,service_name:v,professional_name:'',time:''}))}>
              <option value="">Selecionar serviço...</option>
              {srvs.map(s=><option key={s.id} value={s.name}>{s.name} — {fmtCurrency(s.price)} ({s.duration_min}min)</option>)}
            </Sel>
            <Lbl c="Profissional *"/>
            <Sel v={form.professional_name} set={v=>setForm(f=>({...f,professional_name:v,time:''}))}>
              <option value="">Selecionar profissional...</option>
              {profsParaServico().map(p=><option key={p.id} value={p.full_name}>{p.full_name} — {p.specialty}</option>)}
            </Sel>
            <Lbl c="Data *"/>
            <input type="date" min={todayISO()} value={dmyToISO(form.dmy)||''} onChange={e=>setForm(f=>({...f,dmy:isoToDmy(e.target.value),time:''}))} className="inp"/>
            <Lbl c="Horário *"/>
            <Sel v={form.time} set={F('time')}>
              <option value="">Selecionar horário...</option>
              {slotsLivres().map(h=><option key={h} value={h}>{h}</option>)}
            </Sel>
            {err&&<Alert type="danger" c={err}/>}
            {ok&&<Alert type="success" c={ok}/>}
            <button className="btn btn-primary" style={{width:'100%',marginTop:18,justifyContent:'center'}} onClick={enviarSolicitacao}>
              Enviar Solicitação
            </button>
          </div>
        </div>

        {/* Alterar senha */}
        <div className="card au2">
          <div className="card-hd"><span className="ch">🔑 Alterar Minha Senha</span></div>
          <div style={{padding:'0 20px 20px'}}>
            <AlterarSenhaCli cliente={cliente}/>
          </div>
        </div>

        {/* Minhas reservas */}
        <div className="card au3">
          <div className="card-hd"><span className="ch">Minhas Reservas</span></div>
          <div style={{padding:'0 14px 14px'}}>
            {minhasAgs.length===0
              ?<div style={{padding:24,textAlign:'center',color:T.onSurfaceLow,fontSize:13}}>Nenhuma reserva ainda</div>
              :minhasAgs.map(a=>{
                const si=statusInfo(a.status)
                return(
                  <div key={a.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px',borderRadius:12,background:si.bg,marginBottom:8,border:`1px solid ${si.color}22`}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:T.onSurface}}>{a.srvName}</div>
                      <div style={{fontSize:11,color:T.onSurfaceMed,marginTop:2}}>{a.profName} · {a.dmy} às {a.time}</div>
                      <div style={{fontSize:12,fontWeight:600,color:T.primary,marginTop:2}}>{fmtCurrency(a.price)}</div>
                    </div>
                    <span style={{padding:'4px 10px',borderRadius:8,fontSize:10,fontWeight:700,color:si.color,background:'rgba(255,255,255,.6)',flexShrink:0}}>{si.label}</span>
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>
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
    const senhaAtualSalva=localStorage.getItem('admin_senha')||'123456'
    if(senhaAtual!==senhaAtualSalva){setErr('Senha atual incorreta');return}
    if(!senhaNova||senhaNova.length<4){setErr('Nova senha deve ter pelo menos 4 caracteres');return}
    if(senhaNova!==senhaConf){setErr('As senhas não coincidem');return}
    localStorage.setItem('admin_senha',senhaNova)
    setOk('✅ Senha alterada com sucesso!')
    setSenhaAtual('');setSenhaNova('');setSenhaConf('')
    toast2('Senha do administrador alterada!')
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

  if(mode==='admin')   return <Admin onLogout={logout}/>
  if(mode==='prof'&&profData)   return <ProfPanel prof={profData} onLogout={logout}/>
  if(mode==='cliente'&&cliData) return <PortalCliente cliente={cliData} onLogout={logout}/>
  return <Login onAdmin={loginAdmin} onProf={loginProf} onCliente={loginCli}/>
}
