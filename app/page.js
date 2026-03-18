'use client'
import { useState } from 'react'

// ── AUTH ──────────────────────────────────────────────────
const ADMIN_USER = 'Alexandre'
const ADMIN_PASS = '123456'

// ── INITIAL DATA ─────────────────────────────────────────
const initialAgendamentos = [
  { id:1, cliente:'Maria Silva',   servico:'Corte Feminino',  profissional:'Ana',    data:'18/03/2025', horario:'09:00', status:'confirmado',     valor:90  },
  { id:2, cliente:'João Costa',    servico:'Barba',           profissional:'Carlos', data:'18/03/2025', horario:'09:30', status:'agendado',       valor:30  },
  { id:3, cliente:'Carla Mendes',  servico:'Manicure',        profissional:'Paula',  data:'18/03/2025', horario:'10:00', status:'em_atendimento', valor:35  },
  { id:4, cliente:'Pedro Alves',   servico:'Corte Masculino', profissional:'Carlos', data:'18/03/2025', horario:'11:00', status:'agendado',       valor:40  },
  { id:5, cliente:'Fernanda Lima', servico:'Escova',          profissional:'Ana',    data:'18/03/2025', horario:'13:00', status:'agendado',       valor:60  },
  { id:6, cliente:'Lucas Rocha',   servico:'Corte Masculino', profissional:'Carlos', data:'18/03/2025', horario:'14:00', status:'finalizado',     valor:40  },
  { id:7, cliente:'Beatriz Souza', servico:'Coloração',       profissional:'Ana',    data:'19/03/2025', horario:'10:00', status:'agendado',       valor:150 },
  { id:8, cliente:'Roberto Lima',  servico:'Barba',           profissional:'Carlos', data:'19/03/2025', horario:'11:00', status:'cancelado',      valor:30  },
]

const initialClientes = [
  { id:1, nome:'Maria Silva',   telefone:'(11) 99999-0001', email:'maria@email.com',    visitas:12, ultimo:'12/03/2025', gasto:1080 },
  { id:2, nome:'João Costa',    telefone:'(11) 99999-0002', email:'joao@email.com',     visitas:8,  ultimo:'10/03/2025', gasto:320  },
  { id:3, nome:'Carla Mendes',  telefone:'(11) 99999-0003', email:'carla@email.com',    visitas:20, ultimo:'15/03/2025', gasto:700  },
  { id:4, nome:'Pedro Alves',   telefone:'(11) 99999-0004', email:'pedro@email.com',    visitas:5,  ultimo:'08/03/2025', gasto:200  },
  { id:5, nome:'Fernanda Lima', telefone:'(11) 99999-0005', email:'fernanda@email.com', visitas:15, ultimo:'14/03/2025', gasto:900  },
]

const initialProfissionais = [
  { id:1, nome:'Ana',    especialidade:'Cabelereira', comissao:40, servicos:'Corte Feminino, Escova, Coloração', status:'ocupado',    atendimentos:156, avaliacao:'4.9' },
  { id:2, nome:'Carlos', especialidade:'Barbeiro',    comissao:35, servicos:'Barba, Corte Masculino',           status:'disponivel', atendimentos:203, avaliacao:'4.8' },
  { id:3, nome:'Paula',  especialidade:'Manicure',    comissao:50, servicos:'Manicure, Pedicure',               status:'ocupado',    atendimentos:98,  avaliacao:'4.7' },
  { id:4, nome:'Carla',  especialidade:'Cabelereira', comissao:40, servicos:'Corte Feminino, Escova',           status:'ausente',    atendimentos:87,  avaliacao:'4.6' },
]

const initialServicos = [
  { id:1, nome:'Corte Masculino', categoria:'Corte',      preco:40,  duracao:30, profissionais:'Carlos'      },
  { id:2, nome:'Corte Feminino',  categoria:'Corte',      preco:90,  duracao:60, profissionais:'Ana, Carla'  },
  { id:3, nome:'Barba',           categoria:'Barba',      preco:30,  duracao:20, profissionais:'Carlos'      },
  { id:4, nome:'Escova',          categoria:'Tratamento', preco:60,  duracao:40, profissionais:'Ana, Carla'  },
  { id:5, nome:'Manicure',        categoria:'Unhas',      preco:35,  duracao:30, profissionais:'Paula'       },
  { id:6, nome:'Coloração',       categoria:'Coloração',  preco:150, duracao:90, profissionais:'Ana'         },
]

const statusConfig = {
  agendado:       { label:'Agendado',       bg:'#fff3e0', color:'#f57c00' },
  confirmado:     { label:'Confirmado',     bg:'#e8f5e9', color:'#2e7d32' },
  em_atendimento: { label:'Em atendimento', bg:'#fce4ec', color:'#c2185b' },
  finalizado:     { label:'Finalizado',     bg:'#f3e5f5', color:'#7b1fa2' },
  cancelado:      { label:'Cancelado',      bg:'#ffebee', color:'#c62828' },
}

const profStatusConfig = {
  disponivel: { label:'Disponível', bg:'#e8f5e9', color:'#2e7d32' },
  ocupado:    { label:'Ocupado',    bg:'#fce4ec', color:'#c2185b' },
  ausente:    { label:'Ausente',    bg:'#fff3e0', color:'#f57c00' },
}

// ── MODAL ────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:480,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
        <div style={{padding:'20px 24px',borderBottom:'1px solid rgba(233,30,99,.1)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:18,color:'#1a1a1a'}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:'rgba(0,0,0,.4)',lineHeight:1}}>×</button>
        </div>
        <div style={{padding:24}}>{children}</div>
      </div>
    </div>
  )
}

// ── FORM FIELD ───────────────────────────────────────────
function Field({ label, value, onChange, type='text', options }) {
  return (
    <div style={{marginBottom:16}}>
      <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(194,24,91,.6)',marginBottom:8}}>{label}</label>
      {options ? (
        <select value={value} onChange={e=>onChange(e.target.value)} style={{width:'100%',padding:'12px 14px',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,color:'#1a1a1a',outline:'none',background:'#fafafa'}}>
          {options.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} style={{width:'100%',padding:'12px 14px',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,color:'#1a1a1a',outline:'none',background:'#fafafa'}}/>
      )}
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────
export default function AdminPanel() {
  // AUTH
  const [loggedIn, setLoggedIn]   = useState(false)
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginErr,  setLoginErr]  = useState('')

  // NAV
  const [activeTab,   setActiveTab]   = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // DATA
  const [agendamentos,   setAgendamentos]   = useState(initialAgendamentos)
  const [clientes,       setClientes]       = useState(initialClientes)
  const [profissionais,  setProfissionais]  = useState(initialProfissionais)
  const [servicos,       setServicos]       = useState(initialServicos)

  // SEARCH
  const [busca, setBusca] = useState('')

  // TOAST
  const [toast, setToast] = useState('')
  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(''),2500) }

  // MODALS
  const [modal, setModal] = useState(null) // { type, data }
  function openModal(type, data={}) { setModal({ type, data }) }
  function closeModal() { setModal(null) }

  // MODAL FORM STATE
  const [form, setForm] = useState({})
  function openEdit(type, data) { setForm({...data}); openModal(type, data) }
  function setF(k){ return v => setForm(f=>({...f,[k]:v})) }

  // ── LOGIN ──────────────────────────────────────────────
  function handleLogin() {
    if (loginUser===ADMIN_USER && loginPass===ADMIN_PASS) {
      setLoggedIn(true); setLoginErr('')
    } else {
      setLoginErr('Usuário ou senha incorretos')
    }
  }

  // ── CRUD AGENDAMENTOS ──────────────────────────────────
  function saveAgendamento() {
    if (form.id) {
      setAgendamentos(a=>a.map(x=>x.id===form.id?{...form}:x))
    } else {
      setAgendamentos(a=>[...a,{...form,id:Date.now()}])
    }
    closeModal(); showToast('Agendamento salvo!')
  }
  function deleteAgendamento(id) {
    setAgendamentos(a=>a.filter(x=>x.id!==id)); showToast('Agendamento removido!')
  }

  // ── CRUD CLIENTES ──────────────────────────────────────
  function saveCliente() {
    if (form.id) {
      setClientes(c=>c.map(x=>x.id===form.id?{...form}:x))
    } else {
      setClientes(c=>[...c,{...form,id:Date.now(),visitas:0,gasto:0,ultimo:'—'}])
    }
    closeModal(); showToast('Cliente salvo!')
  }
  function deleteCliente(id) {
    setClientes(c=>c.filter(x=>x.id!==id)); showToast('Cliente removido!')
  }

  // ── CRUD PROFISSIONAIS ─────────────────────────────────
  function saveProfissional() {
    if (form.id) {
      setProfissionais(p=>p.map(x=>x.id===form.id?{...form}:x))
    } else {
      setProfissionais(p=>[...p,{...form,id:Date.now(),atendimentos:0,avaliacao:'—'}])
    }
    closeModal(); showToast('Profissional salvo!')
  }
  function deleteProfissional(id) {
    setProfissionais(p=>p.filter(x=>x.id!==id)); showToast('Profissional removido!')
  }

  // ── CRUD SERVIÇOS ──────────────────────────────────────
  function saveServico() {
    if (form.id) {
      setServicos(s=>s.map(x=>x.id===form.id?{...form}:x))
    } else {
      setServicos(s=>[...s,{...form,id:Date.now()}])
    }
    closeModal(); showToast('Serviço salvo!')
  }
  function deleteServico(id) {
    setServicos(s=>s.filter(x=>x.id!==id)); showToast('Serviço removido!')
  }

  // ── FILTERS ───────────────────────────────────────────
  const clientesFiltrados = clientes.filter(c=>
    c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone?.includes(busca)
  )

  const faturamentoHoje = agendamentos
    .filter(a=>a.status!=='cancelado'&&a.data===agendamentos[0]?.data)
    .reduce((s,a)=>s+(Number(a.valor)||0),0)

  const menuItems = [
    { id:'dashboard',     icon:'⊞', label:'Dashboard'     },
    { id:'agenda',        icon:'◷', label:'Agenda'        },
    { id:'clientes',      icon:'◉', label:'Clientes'      },
    { id:'profissionais', icon:'✦', label:'Profissionais' },
    { id:'servicos',      icon:'✂', label:'Serviços'      },
    { id:'financeiro',    icon:'◎', label:'Financeiro'    },
    { id:'promocoes',     icon:'❋', label:'Promoções'     },
    { id:'configuracoes', icon:'⊙', label:'Configurações' },
  ]

  // ─────────────────────────────────────────────────────
  // ── LOGIN SCREEN ─────────────────────────────────────
  // ─────────────────────────────────────────────────────
  if (!loggedIn) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@300;400;500;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Montserrat',sans-serif;background:linear-gradient(160deg,#fce4ec,#fdf6f9);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}
      `}</style>
      <div style={{background:'#fff',borderRadius:24,width:'100%',maxWidth:400,overflow:'hidden',boxShadow:'0 8px 40px rgba(233,30,99,.12)'}}>
        <div style={{background:'linear-gradient(160deg,#fce4ec,#fdf6f9)',padding:'40px 32px 32px',textAlign:'center',borderBottom:'1px solid rgba(233,30,99,.08)'}}>
          <div style={{width:64,height:64,borderRadius:'50%',border:'2px solid #e91e63',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',background:'#fff'}}>
            <span style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:700,color:'#e91e63'}}>JOU</span>
          </div>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:26,fontWeight:700,color:'#c2185b',letterSpacing:3}}>JOUDAT SALON</div>
          <div style={{fontSize:10,letterSpacing:4,color:'rgba(194,24,91,.5)',textTransform:'uppercase',marginTop:6}}>Painel Administrativo</div>
        </div>
        <div style={{padding:32}}>
          <div style={{marginBottom:16}}>
            <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(194,24,91,.6)',marginBottom:8}}>Usuário</label>
            <input value={loginUser} onChange={e=>setLoginUser(e.target.value)} placeholder="Digite seu usuário" style={{width:'100%',padding:'13px 16px',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',background:'#fafafa'}}/>
          </div>
          <div style={{marginBottom:20}}>
            <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(194,24,91,.6)',marginBottom:8}}>Senha</label>
            <input type="password" value={loginPass} onChange={e=>setLoginPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="Digite sua senha" style={{width:'100%',padding:'13px 16px',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',background:'#fafafa'}}/>
          </div>
          {loginErr && <div style={{background:'#ffebee',color:'#c62828',padding:'10px 14px',borderRadius:8,fontSize:12,marginBottom:16,textAlign:'center'}}>{loginErr}</div>}
          <button onClick={handleLogin} style={{width:'100%',padding:16,background:'linear-gradient(135deg,#e91e63,#c2185b)',border:'none',borderRadius:12,fontFamily:'Montserrat,sans-serif',fontSize:11,fontWeight:600,letterSpacing:4,textTransform:'uppercase',color:'#fff',cursor:'pointer'}}>
            Entrar no Painel
          </button>
        </div>
      </div>
    </>
  )

  // ─────────────────────────────────────────────────────
  // ── DASHBOARD SCREEN ─────────────────────────────────
  // ─────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@300;400;500;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Montserrat',sans-serif;background:#fdf6f9;color:#1a1a1a;}
        .layout{display:flex;min-height:100vh;}
        .sidebar{width:${sidebarOpen?'230px':'64px'};background:linear-gradient(180deg,#c2185b,#880e4f);display:flex;flex-direction:column;transition:width .3s;overflow:hidden;flex-shrink:0;position:fixed;top:0;left:0;bottom:0;z-index:100;}
        .sb-hd{padding:22px 16px;border-bottom:1px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:10px;white-space:nowrap;}
        .sb-logo{width:34px;height:34px;flex-shrink:0;border-radius:50%;border:1.5px solid rgba(255,255,255,.6);display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:10px;font-weight:700;color:#fff;}
        .sb-title{font-family:'Playfair Display',serif;font-size:13px;font-weight:700;color:#fff;letter-spacing:2px;}
        .sb-sub{font-size:8px;letter-spacing:3px;color:rgba(255,255,255,.5);text-transform:uppercase;}
        .sb-nav{flex:1;padding:12px 0;overflow-y:auto;}
        .nav-item{display:flex;align-items:center;gap:12px;padding:12px 16px;cursor:pointer;white-space:nowrap;transition:background .2s;border-left:3px solid transparent;}
        .nav-item:hover{background:rgba(255,255,255,.08);}
        .nav-item.active{background:rgba(255,255,255,.15);border-left-color:#fff;}
        .nav-icon{font-size:15px;color:rgba(255,255,255,.65);flex-shrink:0;width:20px;text-align:center;}
        .nav-item.active .nav-icon,.nav-item.active .nav-label{color:#fff;font-weight:600;}
        .nav-label{font-size:12px;font-weight:500;color:rgba(255,255,255,.65);}
        .sb-ft{padding:14px;border-top:1px solid rgba(255,255,255,.1);white-space:nowrap;display:flex;align-items:center;gap:10px;}
        .adm-av{width:32px;height:32px;flex-shrink:0;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;font-weight:600;}
        .adm-nm{font-size:12px;font-weight:600;color:#fff;}
        .adm-rl{font-size:9px;letter-spacing:2px;color:rgba(255,255,255,.5);text-transform:uppercase;}
        .main{flex:1;margin-left:${sidebarOpen?'230px':'64px'};transition:margin-left .3s;display:flex;flex-direction:column;min-height:100vh;}
        .topbar{background:#fff;padding:13px 26px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(233,30,99,.08);position:sticky;top:0;z-index:50;}
        .tgl{width:34px;height:34px;border-radius:8px;border:1px solid rgba(233,30,99,.15);background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:17px;color:#c2185b;}
        .tgl:hover{background:#fce4ec;}
        .pg-title{font-family:'Playfair Display',serif;font-size:19px;}
        .date-b{padding:5px 12px;background:#fce4ec;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:1px;color:#c2185b;}
        .logout-btn{padding:6px 14px;background:none;border:1.5px solid rgba(233,30,99,.2);border-radius:8px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;letter-spacing:2px;color:#c2185b;cursor:pointer;text-transform:uppercase;}
        .logout-btn:hover{background:#fce4ec;}
        .content{padding:26px;flex:1;}
        .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;}
        .kpi-card{background:#fff;border-radius:14px;padding:20px;border:1px solid rgba(233,30,99,.06);box-shadow:0 2px 10px rgba(233,30,99,.04);transition:transform .2s;}
        .kpi-card:hover{transform:translateY(-2px);}
        .kpi-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
        .kpi-lbl{font-size:9px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(0,0,0,.35);}
        .kpi-ic{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;}
        .kpi-val{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#1a1a1a;margin-bottom:3px;}
        .kpi-sub{font-size:10px;color:rgba(0,0,0,.35);}
        .sec-grid{display:grid;grid-template-columns:1fr 290px;gap:20px;}
        .sec-card{background:#fff;border-radius:14px;border:1px solid rgba(233,30,99,.06);box-shadow:0 2px 10px rgba(233,30,99,.04);overflow:hidden;margin-bottom:20px;}
        .sec-hd{padding:16px 22px;border-bottom:1px solid rgba(233,30,99,.06);display:flex;align-items:center;justify-content:space-between;}
        .sec-title{font-family:'Playfair Display',serif;font-size:16px;}
        .tbl{width:100%;border-collapse:collapse;}
        .tbl th{padding:10px 20px;text-align:left;font-size:9px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(0,0,0,.3);border-bottom:1px solid rgba(233,30,99,.06);}
        .tbl td{padding:12px 20px;font-size:13px;border-bottom:1px solid rgba(233,30,99,.04);}
        .tbl tr:last-child td{border-bottom:none;}
        .tbl tr:hover td{background:#fdf6f9;}
        .badge{padding:3px 9px;border-radius:20px;font-size:10px;font-weight:600;white-space:nowrap;}
        .stat-row{display:flex;align-items:center;justify-content:space-between;padding:11px 22px;border-bottom:1px solid rgba(233,30,99,.04);}
        .stat-row:last-child{border-bottom:none;}
        .btn-pink{padding:10px 20px;background:linear-gradient(135deg,#e91e63,#c2185b);border:none;border-radius:10px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#fff;cursor:pointer;}
        .btn-pink:hover{opacity:.88;}
        .btn-out{padding:8px 14px;background:transparent;border:1.5px solid rgba(233,30,99,.25);border-radius:8px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#e91e63;cursor:pointer;}
        .btn-out:hover{border-color:#e91e63;background:#fdf6f9;}
        .btn-red{padding:8px 14px;background:transparent;border:1.5px solid rgba(198,40,40,.25);border-radius:8px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;color:#c62828;cursor:pointer;}
        .btn-red:hover{background:#ffebee;}
        .search-wrap{position:relative;margin-bottom:16px;}
        .search-ic{position:absolute;left:13px;top:50%;transform:translateY(-50%);font-size:14px;color:rgba(233,30,99,.4);}
        .search-inp{width:100%;padding:11px 11px 11px 38px;border:1.5px solid rgba(233,30,99,.15);border-radius:10px;font-family:'Montserrat',sans-serif;font-size:13px;outline:none;background:#fafafa;}
        .search-inp:focus{border-color:#e91e63;background:#fff;}
        .prof-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px;padding:20px;}
        .prof-card{border:1px solid rgba(233,30,99,.1);border-radius:12px;padding:18px;text-align:center;transition:box-shadow .2s;}
        .prof-card:hover{box-shadow:0 4px 20px rgba(233,30,99,.1);}
        .p-av{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#f48fb1,#e91e63);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;margin:0 auto 10px;}
        .serv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:16px;padding:20px;}
        .serv-card{border:1px solid rgba(233,30,99,.1);border-radius:12px;padding:16px;transition:box-shadow .2s;}
        .serv-card:hover{box-shadow:0 4px 20px rgba(233,30,99,.1);}
        .tag{padding:3px 8px;background:#fce4ec;border-radius:10px;font-size:9px;font-weight:600;color:#c2185b;}
        .promo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px;padding:20px;}
        .promo-card{background:linear-gradient(135deg,#fce4ec,#fdf6f9);border:1px solid rgba(233,30,99,.15);border-radius:14px;padding:18px;}
        .fin-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
        .form-inp{width:100%;padding:11px 14px;border:1.5px solid rgba(233,30,99,.2);border-radius:10px;font-family:'Montserrat',sans-serif;font-size:13px;outline:none;background:#fafafa;margin-bottom:2px;}
        .form-inp:focus{border-color:#e91e63;background:#fff;}
        .form-sel{width:100%;padding:11px 14px;border:1.5px solid rgba(233,30,99,.2);border-radius:10px;font-family:'Montserrat',sans-serif;font-size:13px;outline:none;background:#fafafa;}
        .form-lbl{display:block;font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(194,24,91,.6);margin-bottom:6px;margin-top:14px;}
        .toast{position:fixed;bottom:24px;right:24px;background:#2e7d32;color:#fff;padding:12px 22px;border-radius:10px;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;z-index:9999;}
        @media(max-width:1100px){.kpi-grid{grid-template-columns:repeat(2,1fr)}.sec-grid{grid-template-columns:1fr}}
        @media(max-width:700px){.content{padding:14px}.topbar{padding:11px 14px}.fin-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sb-hd">
            <div className="sb-logo">JOU</div>
            {sidebarOpen&&<div><div className="sb-title">JOUDAT</div><div className="sb-sub">Admin</div></div>}
          </div>
          <nav className="sb-nav">
            {menuItems.map(m=>(
              <div key={m.id} className={`nav-item${activeTab===m.id?' active':''}`} onClick={()=>{setActiveTab(m.id);setBusca('')}}>
                <span className="nav-icon">{m.icon}</span>
                {sidebarOpen&&<span className="nav-label">{m.label}</span>}
              </div>
            ))}
          </nav>
          <div className="sb-ft">
            <div className="adm-av">A</div>
            {sidebarOpen&&<div><div className="adm-nm">{ADMIN_USER}</div><div className="adm-rl">Admin</div></div>}
          </div>
        </aside>

        {/* MAIN */}
        <main className="main">
          <div className="topbar">
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <button className="tgl" onClick={()=>setSidebarOpen(!sidebarOpen)}>☰</button>
              <div className="pg-title">{menuItems.find(m=>m.id===activeTab)?.label}</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div className="date-b">{new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'})}</div>
              <button className="logout-btn" onClick={()=>setLoggedIn(false)}>Sair</button>
            </div>
          </div>

          <div className="content">

            {/* ══ DASHBOARD ══ */}
            {activeTab==='dashboard'&&(
              <>
                <div className="kpi-grid">
                  {[
                    {l:'Faturamento Hoje',v:`R$ ${faturamentoHoje}`,ic:'💰',bg:'#fce4ec',s:'Hoje'},
                    {l:'Agendamentos',    v:agendamentos.length,     ic:'📅',bg:'#e8f5e9',s:'Total'},
                    {l:'Em Atendimento', v:agendamentos.filter(a=>a.status==='em_atendimento').length,ic:'✂️',bg:'#fff3e0',s:'Agora'},
                    {l:'Clientes',       v:clientes.length,          ic:'👥',bg:'#f3e5f5',s:'Cadastrados'},
                  ].map(k=>(
                    <div key={k.l} className="kpi-card">
                      <div className="kpi-top"><div className="kpi-lbl">{k.l}</div><div className="kpi-ic" style={{background:k.bg}}>{k.ic}</div></div>
                      <div className="kpi-val">{k.v}</div><div className="kpi-sub">{k.s}</div>
                    </div>
                  ))}
                </div>
                <div className="sec-grid">
                  <div className="sec-card">
                    <div className="sec-hd"><div className="sec-title">Agenda de Hoje</div><button className="btn-out" onClick={()=>setActiveTab('agenda')}>Ver tudo</button></div>
                    <table className="tbl">
                      <thead><tr><th>Hora</th><th>Cliente</th><th>Serviço</th><th>Prof.</th><th>Status</th><th>Valor</th></tr></thead>
                      <tbody>{agendamentos.slice(0,5).map(a=>(
                        <tr key={a.id}>
                          <td style={{fontWeight:600,color:'#c2185b'}}>{a.horario}</td>
                          <td style={{fontWeight:600}}>{a.cliente}</td>
                          <td style={{color:'rgba(0,0,0,.6)'}}>{a.servico}</td>
                          <td>{a.profissional}</td>
                          <td><span className="badge" style={{background:statusConfig[a.status]?.bg,color:statusConfig[a.status]?.color}}>{statusConfig[a.status]?.label}</span></td>
                          <td style={{fontWeight:600}}>R$ {a.valor}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:20}}>
                    <div className="sec-card">
                      <div className="sec-hd"><div className="sec-title">Resumo</div></div>
                      {[{l:'Ticket médio',v:'R$ 59'},{l:'Ocupação',v:'78%'},{l:'Cancelamentos',v:agendamentos.filter(a=>a.status==='cancelado').length},{l:'Fat. mês',v:'R$ 12.450'},{l:'Novos clientes',v:'3'}].map(s=>(
                        <div key={s.l} className="stat-row"><span style={{fontSize:12,color:'rgba(0,0,0,.5)'}}>{s.l}</span><span style={{fontSize:14,fontWeight:700,color:'#c2185b'}}>{s.v}</span></div>
                      ))}
                    </div>
                    <div className="sec-card">
                      <div className="sec-hd"><div className="sec-title">Equipe</div></div>
                      {profissionais.map(p=>(
                        <div key={p.id} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 20px',borderBottom:'1px solid rgba(233,30,99,.04)'}}>
                          <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#f48fb1,#e91e63)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff',flexShrink:0}}>{p.nome[0]}</div>
                          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{p.nome}</div><div style={{fontSize:11,color:'rgba(0,0,0,.4)'}}>{p.especialidade}</div></div>
                          <span className="badge" style={{background:profStatusConfig[p.status]?.bg,color:profStatusConfig[p.status]?.color}}>{profStatusConfig[p.status]?.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ══ AGENDA ══ */}
            {activeTab==='agenda'&&(
              <div className="sec-card">
                <div className="sec-hd">
                  <div className="sec-title">Agenda Completa</div>
                  <button className="btn-pink" onClick={()=>openEdit('agendamento',{cliente:'',servico:'',profissional:'',data:'',horario:'',status:'agendado',valor:''})}>+ Novo Agendamento</button>
                </div>
                <table className="tbl">
                  <thead><tr><th>Data</th><th>Hora</th><th>Cliente</th><th>Serviço</th><th>Profissional</th><th>Status</th><th>Valor</th><th>Ações</th></tr></thead>
                  <tbody>{agendamentos.map(a=>(
                    <tr key={a.id}>
                      <td style={{fontSize:12,color:'rgba(0,0,0,.5)'}}>{a.data}</td>
                      <td style={{fontWeight:600,color:'#c2185b'}}>{a.horario}</td>
                      <td style={{fontWeight:600}}>{a.cliente}</td>
                      <td style={{color:'rgba(0,0,0,.6)'}}>{a.servico}</td>
                      <td>{a.profissional}</td>
                      <td><span className="badge" style={{background:statusConfig[a.status]?.bg,color:statusConfig[a.status]?.color}}>{statusConfig[a.status]?.label}</span></td>
                      <td style={{fontWeight:600}}>R$ {a.valor}</td>
                      <td style={{display:'flex',gap:6}}>
                        <button className="btn-out" onClick={()=>openEdit('agendamento',a)}>Editar</button>
                        <button className="btn-red" onClick={()=>deleteAgendamento(a.id)}>✕</button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            {/* ══ CLIENTES ══ */}
            {activeTab==='clientes'&&(
              <div className="sec-card">
                <div className="sec-hd">
                  <div className="sec-title">Clientes Cadastrados</div>
                  <button className="btn-pink" onClick={()=>openEdit('cliente',{nome:'',telefone:'',email:''})}>+ Novo Cliente</button>
                </div>
                <div style={{padding:'16px 20px 0'}}>
                  <div className="search-wrap">
                    <span className="search-ic">🔍</span>
                    <input className="search-inp" placeholder="Buscar por nome ou telefone..." value={busca} onChange={e=>setBusca(e.target.value)}/>
                  </div>
                </div>
                <table className="tbl">
                  <thead><tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Visitas</th><th>Último</th><th>Total</th><th>Ações</th></tr></thead>
                  <tbody>{clientesFiltrados.map(c=>(
                    <tr key={c.id}>
                      <td style={{fontWeight:600}}>{c.nome}</td>
                      <td style={{color:'rgba(0,0,0,.6)'}}>{c.telefone}</td>
                      <td style={{color:'rgba(0,0,0,.6)',fontSize:12}}>{c.email}</td>
                      <td style={{textAlign:'center'}}><span className="badge" style={{background:'#fce4ec',color:'#c2185b'}}>{c.visitas}x</span></td>
                      <td style={{fontSize:12,color:'rgba(0,0,0,.5)'}}>{c.ultimo}</td>
                      <td style={{fontWeight:600,color:'#c2185b'}}>R$ {c.gasto}</td>
                      <td style={{display:'flex',gap:6}}>
                        <button className="btn-out" onClick={()=>openEdit('cliente',c)}>Editar</button>
                        <button className="btn-red" onClick={()=>deleteCliente(c.id)}>✕</button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            {/* ══ PROFISSIONAIS ══ */}
            {activeTab==='profissionais'&&(
              <div className="sec-card">
                <div className="sec-hd">
                  <div className="sec-title">Equipe de Profissionais</div>
                  <button className="btn-pink" onClick={()=>openEdit('profissional',{nome:'',especialidade:'',comissao:'',servicos:'',status:'disponivel'})}>+ Novo Profissional</button>
                </div>
                <div className="prof-grid">
                  {profissionais.map(p=>(
                    <div key={p.id} className="prof-card">
                      <div className="p-av">{p.nome[0]}</div>
                      <div style={{fontSize:15,fontWeight:600,marginBottom:4}}>{p.nome}</div>
                      <div style={{fontSize:11,color:'rgba(0,0,0,.4)',marginBottom:10,letterSpacing:1}}>{p.especialidade}</div>
                      <span className="badge" style={{background:profStatusConfig[p.status]?.bg,color:profStatusConfig[p.status]?.color,marginBottom:12,display:'inline-block'}}>{profStatusConfig[p.status]?.label}</span>
                      <div style={{display:'flex',justifyContent:'center',gap:18,marginBottom:12}}>
                        {[{v:p.atendimentos,l:'Atend.'},{v:p.avaliacao+'⭐',l:'Aval.'},{v:p.comissao+'%',l:'Comissão'}].map(s=>(
                          <div key={s.l} style={{textAlign:'center'}}>
                            <div style={{fontSize:16,fontWeight:700,color:'#c2185b'}}>{s.v}</div>
                            <div style={{fontSize:9,letterSpacing:2,color:'rgba(0,0,0,.35)',textTransform:'uppercase'}}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:4,justifyContent:'center',marginBottom:12}}>
                        {p.servicos.split(',').map(s=><span key={s} className="tag">{s.trim()}</span>)}
                      </div>
                      <div style={{display:'flex',gap:8}}>
                        <button className="btn-out" style={{flex:1}} onClick={()=>openEdit('profissional',p)}>Editar</button>
                        <button className="btn-red" onClick={()=>deleteProfissional(p.id)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ SERVIÇOS ══ */}
            {activeTab==='servicos'&&(
              <div className="sec-card">
                <div className="sec-hd">
                  <div className="sec-title">Serviços Cadastrados</div>
                  <button className="btn-pink" onClick={()=>openEdit('servico',{nome:'',categoria:'',preco:'',duracao:'',profissionais:''})}>+ Novo Serviço</button>
                </div>
                <div className="serv-grid">
                  {servicos.map(s=>(
                    <div key={s.id} className="serv-card">
                      <div style={{fontSize:9,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'#e91e63',marginBottom:6}}>{s.categoria}</div>
                      <div style={{fontSize:15,fontWeight:600,marginBottom:4}}>{s.nome}</div>
                      <div style={{fontFamily:'Playfair Display,serif',fontSize:22,fontWeight:700,color:'#c2185b',marginBottom:4}}>R$ {s.preco}</div>
                      <div style={{fontSize:11,color:'rgba(0,0,0,.4)',marginBottom:10}}>⏱ {s.duracao} min</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:12}}>
                        {s.profissionais.split(',').map(p=><span key={p} className="tag">{p.trim()}</span>)}
                      </div>
                      <div style={{display:'flex',gap:8}}>
                        <button className="btn-out" style={{flex:1}} onClick={()=>openEdit('servico',s)}>Editar</button>
                        <button className="btn-red" onClick={()=>deleteServico(s.id)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ FINANCEIRO ══ */}
            {activeTab==='financeiro'&&(
              <>
                <div className="kpi-grid" style={{marginBottom:20}}>
                  {[
                    {l:'Faturamento Hoje',v:`R$ ${faturamentoHoje}`,ic:'💰',bg:'#fce4ec'},
                    {l:'Faturamento Mês', v:'R$ 12.450',             ic:'📈',bg:'#e8f5e9'},
                    {l:'Ticket Médio',    v:'R$ 59',                 ic:'🎯',bg:'#fff3e0'},
                    {l:'Comissões Mês',   v:'R$ 3.820',              ic:'🤝',bg:'#f3e5f5'},
                  ].map(k=>(
                    <div key={k.l} className="kpi-card">
                      <div className="kpi-top"><div className="kpi-lbl">{k.l}</div><div className="kpi-ic" style={{background:k.bg}}>{k.ic}</div></div>
                      <div className="kpi-val">{k.v}</div>
                    </div>
                  ))}
                </div>
                <div className="fin-grid">
                  <div className="sec-card">
                    <div className="sec-hd"><div className="sec-title">Serviços Mais Vendidos</div></div>
                    <table className="tbl">
                      <thead><tr><th>Serviço</th><th>Qtd</th><th>Total</th></tr></thead>
                      <tbody>{[
                        {n:'Corte Feminino',q:18,t:'R$ 1.620'},{n:'Coloração',q:8,t:'R$ 1.200'},
                        {n:'Escova',q:15,t:'R$ 900'},{n:'Barba',q:22,t:'R$ 660'},{n:'Manicure',q:14,t:'R$ 490'},
                      ].map(s=>(
                        <tr key={s.n}>
                          <td style={{fontWeight:600}}>{s.n}</td>
                          <td><span className="badge" style={{background:'#fce4ec',color:'#c2185b'}}>{s.q}x</span></td>
                          <td style={{fontWeight:700,color:'#c2185b'}}>{s.t}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <div className="sec-card">
                    <div className="sec-hd"><div className="sec-title">Comissões da Equipe</div></div>
                    <table className="tbl">
                      <thead><tr><th>Profissional</th><th>%</th><th>Total</th></tr></thead>
                      <tbody>{profissionais.map(p=>{
                        const total = agendamentos.filter(a=>a.profissional===p.nome&&a.status==='finalizado').reduce((s,a)=>s+(Number(a.valor)||0),0)
                        const comissao = Math.round(total*(p.comissao/100))
                        return(
                          <tr key={p.id}>
                            <td style={{fontWeight:600}}>{p.nome}</td>
                            <td><span className="badge" style={{background:'#f3e5f5',color:'#7b1fa2'}}>{p.comissao}%</span></td>
                            <td style={{fontWeight:700,color:'#c2185b'}}>R$ {comissao}</td>
                          </tr>
                        )
                      })}</tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ══ PROMOÇÕES ══ */}
            {activeTab==='promocoes'&&(
              <div className="sec-card">
                <div className="sec-hd"><div className="sec-title">Promoções Ativas</div><button className="btn-pink">+ Nova Promoção</button></div>
                <div className="promo-grid">
                  {[
                    {tag:'Semanal',    title:'Terça da Barba',       desc:'Todo terça-feira 20% de desconto na barba', badge:'-20%'},
                    {tag:'Combo',      title:'Corte + Barba',         desc:'Combo completo por R$ 60 — economize R$ 10', badge:'R$ 60'},
                    {tag:'Novos',      title:'Bem-vindo ao Salão',    desc:'10% de desconto na primeira visita',         badge:'-10%'},
                    {tag:'Fidelidade', title:'10ª Visita Grátis',     desc:'A cada 10 serviços ganhe 1 grátis',          badge:'Grátis'},
                    {tag:'Especial',   title:'Aniversariante',        desc:'15% off no mês do seu aniversário',          badge:'-15%'},
                    {tag:'Cashback',   title:'Cashback 5%',           desc:'5% de volta em saldo na próxima visita',     badge:'5% back'},
                  ].map(p=>(
                    <div key={p.title} className="promo-card">
                      <div style={{fontSize:9,fontWeight:700,letterSpacing:3,color:'#e91e63',textTransform:'uppercase',marginBottom:6}}>{p.tag}</div>
                      <div style={{fontFamily:'Playfair Display,serif',fontSize:17,marginBottom:6}}>{p.title}</div>
                      <div style={{fontSize:12,color:'rgba(0,0,0,.5)',marginBottom:12}}>{p.desc}</div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <span style={{padding:'4px 12px',background:'#e91e63',borderRadius:20,fontSize:11,fontWeight:700,color:'#fff'}}>{p.badge}</span>
                        <button className="btn-out" style={{fontSize:9,padding:'5px 10px'}}>Editar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ CONFIGURAÇÕES ══ */}
            {activeTab==='configuracoes'&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                {[
                  {title:'Dados do Salão',fields:[{l:'Nome do Salão',k:'nome',ph:'Joudat Salon'},{l:'Telefone/WhatsApp',k:'tel',ph:'(11) 99999-0000'},{l:'Endereço',k:'end',ph:'Rua, número, bairro'},{l:'E-mail',k:'email',ph:'contato@salao.com'}]},
                  {title:'Funcionamento',fields:[{l:'Horário',k:'hr',ph:'09:00 – 19:00'},{l:'Dias',k:'dias',ph:'Segunda a Sábado'},{l:'Intervalo entre Atend.',k:'int',ph:'10 minutos'},{l:'Notificações',k:'notif',ph:'E-mail + WhatsApp'}]},
                ].map(sec=>(
                  <div key={sec.title} className="sec-card">
                    <div className="sec-hd"><div className="sec-title">{sec.title}</div></div>
                    <div style={{padding:22}}>
                      {sec.fields.map(f=>(
                        <div key={f.k} style={{marginBottom:14}}>
                          <label className="form-lbl">{f.l}</label>
                          <input className="form-inp" placeholder={f.ph}/>
                        </div>
                      ))}
                      <button className="btn-pink" onClick={()=>showToast('Configurações salvas!')}>Salvar Alterações</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ══ MODALS ══ */}
      {modal?.type==='agendamento'&&(
        <Modal title={form.id?'Editar Agendamento':'Novo Agendamento'} onClose={closeModal}>
          <label className="form-lbl">Cliente</label><input className="form-inp" value={form.cliente||''} onChange={e=>setF('cliente')(e.target.value)} placeholder="Nome do cliente"/>
          <label className="form-lbl">Serviço</label>
          <select className="form-sel" value={form.servico||''} onChange={e=>setF('servico')(e.target.value)}>
            <option value="">Selecionar...</option>
            {servicos.map(s=><option key={s.id}>{s.nome}</option>)}
          </select>
          <label className="form-lbl">Profissional</label>
          <select className="form-sel" value={form.profissional||''} onChange={e=>setF('profissional')(e.target.value)}>
            <option value="">Selecionar...</option>
            {profissionais.map(p=><option key={p.id}>{p.nome}</option>)}
          </select>
          <label className="form-lbl">Data</label><input className="form-inp" type="date" value={form.data||''} onChange={e=>setF('data')(e.target.value)}/>
          <label className="form-lbl">Horário</label><input className="form-inp" type="time" value={form.horario||''} onChange={e=>setF('horario')(e.target.value)}/>
          <label className="form-lbl">Status</label>
          <select className="form-sel" value={form.status||'agendado'} onChange={e=>setF('status')(e.target.value)}>
            {Object.entries(statusConfig).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
          <label className="form-lbl">Valor (R$)</label><input className="form-inp" type="number" value={form.valor||''} onChange={e=>setF('valor')(e.target.value)} placeholder="0"/>
          <div style={{display:'flex',gap:10,marginTop:20}}>
            <button className="btn-pink" style={{flex:1}} onClick={saveAgendamento}>Salvar</button>
            <button className="btn-out" onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {modal?.type==='cliente'&&(
        <Modal title={form.id?'Editar Cliente':'Novo Cliente'} onClose={closeModal}>
          <label className="form-lbl">Nome Completo</label><input className="form-inp" value={form.nome||''} onChange={e=>setF('nome')(e.target.value)} placeholder="Nome do cliente"/>
          <label className="form-lbl">Telefone</label><input className="form-inp" value={form.telefone||''} onChange={e=>setF('telefone')(e.target.value)} placeholder="(11) 99999-0000"/>
          <label className="form-lbl">E-mail</label><input className="form-inp" value={form.email||''} onChange={e=>setF('email')(e.target.value)} placeholder="cliente@email.com"/>
          <div style={{display:'flex',gap:10,marginTop:20}}>
            <button className="btn-pink" style={{flex:1}} onClick={saveCliente}>Salvar</button>
            <button className="btn-out" onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {modal?.type==='profissional'&&(
        <Modal title={form.id?'Editar Profissional':'Novo Profissional'} onClose={closeModal}>
          <label className="form-lbl">Nome</label><input className="form-inp" value={form.nome||''} onChange={e=>setF('nome')(e.target.value)} placeholder="Nome"/>
          <label className="form-lbl">Especialidade</label><input className="form-inp" value={form.especialidade||''} onChange={e=>setF('especialidade')(e.target.value)} placeholder="Ex: Cabelereira"/>
          <label className="form-lbl">Comissão (%)</label><input className="form-inp" type="number" value={form.comissao||''} onChange={e=>setF('comissao')(e.target.value)} placeholder="40"/>
          <label className="form-lbl">Serviços que realiza</label><input className="form-inp" value={form.servicos||''} onChange={e=>setF('servicos')(e.target.value)} placeholder="Corte, Escova, Coloração"/>
          <label className="form-lbl">Status</label>
          <select className="form-sel" value={form.status||'disponivel'} onChange={e=>setF('status')(e.target.value)}>
            <option value="disponivel">Disponível</option>
            <option value="ocupado">Ocupado</option>
            <option value="ausente">Ausente</option>
          </select>
          <div style={{display:'flex',gap:10,marginTop:20}}>
            <button className="btn-pink" style={{flex:1}} onClick={saveProfissional}>Salvar</button>
            <button className="btn-out" onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {modal?.type==='servico'&&(
        <Modal title={form.id?'Editar Serviço':'Novo Serviço'} onClose={closeModal}>
          <label className="form-lbl">Nome do Serviço</label><input className="form-inp" value={form.nome||''} onChange={e=>setF('nome')(e.target.value)} placeholder="Ex: Corte Feminino"/>
          <label className="form-lbl">Categoria</label>
          <select className="form-sel" value={form.categoria||''} onChange={e=>setF('categoria')(e.target.value)}>
            <option value="">Selecionar...</option>
            {['Corte','Barba','Coloração','Tratamento','Unhas','Estética'].map(c=><option key={c}>{c}</option>)}
          </select>
          <label className="form-lbl">Preço (R$)</label><input className="form-inp" type="number" value={form.preco||''} onChange={e=>setF('preco')(e.target.value)} placeholder="0"/>
          <label className="form-lbl">Duração (minutos)</label><input className="form-inp" type="number" value={form.duracao||''} onChange={e=>setF('duracao')(e.target.value)} placeholder="30"/>
          <label className="form-lbl">Profissionais</label><input className="form-inp" value={form.profissionais||''} onChange={e=>setF('profissionais')(e.target.value)} placeholder="Ana, Carlos"/>
          <div style={{display:'flex',gap:10,marginTop:20}}>
            <button className="btn-pink" style={{flex:1}} onClick={saveServico}>Salvar</button>
            <button className="btn-out" onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {toast&&<div className="toast">✓ {toast}</div>}
    </>
  )
}
