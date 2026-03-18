'use client'
import { useState } from 'react'

const ADMIN_USER = 'Alexandre'
const ADMIN_PASS = '123456'
const DEFAULT_PROF_PASS = '123456'

const HORARIOS = ['08:00','08:15','08:30','08:45','09:00','09:15','09:30','09:45','10:00','10:15','10:30','10:45','11:00','11:15','11:30','11:45','12:00','12:15','12:30','12:45','13:00','13:15','13:30','13:45','14:00','14:15','14:30','14:45','15:00','15:15','15:30','15:45','16:00','16:15','16:30','16:45','17:00','17:15','17:30','17:45','18:00']

const initialServicos = [
  { id:1, nome:'Corte Masculino', categoria:'Corte',      preco:40,  duracao:30 },
  { id:2, nome:'Corte Feminino',  categoria:'Corte',      preco:90,  duracao:60 },
  { id:3, nome:'Barba',           categoria:'Barba',      preco:30,  duracao:20 },
  { id:4, nome:'Escova',          categoria:'Tratamento', preco:60,  duracao:40 },
  { id:5, nome:'Manicure',        categoria:'Unhas',      preco:35,  duracao:30 },
  { id:6, nome:'Coloração',       categoria:'Coloração',  preco:150, duracao:90 },
  { id:7, nome:'Pedicure',        categoria:'Unhas',      preco:40,  duracao:40 },
]

const initialProfissionais = [
  { id:1, nome:'Ana',    especialidade:'Cabelereira', comissao:40, senha:DEFAULT_PROF_PASS, status:'ocupado'    },
  { id:2, nome:'Carlos', especialidade:'Barbeiro',    comissao:35, senha:DEFAULT_PROF_PASS, status:'disponivel' },
  { id:3, nome:'Paula',  especialidade:'Manicure',    comissao:50, senha:DEFAULT_PROF_PASS, status:'ocupado'    },
  { id:4, nome:'Carla',  especialidade:'Cabelereira', comissao:40, senha:DEFAULT_PROF_PASS, status:'ausente'    },
]

const initialAgendamentos = [
  { id:1, cliente:'Maria Silva',   servico:'Corte Feminino',  profissional:'Ana',    data:'18/03/2025', horario:'09:00', status:'confirmado',     valor:90  },
  { id:2, cliente:'João Costa',    servico:'Barba',           profissional:'Carlos', data:'18/03/2025', horario:'09:30', status:'agendado',       valor:30  },
  { id:3, cliente:'Carla Mendes',  servico:'Manicure',        profissional:'Paula',  data:'18/03/2025', horario:'10:00', status:'em_atendimento', valor:35  },
  { id:4, cliente:'Pedro Alves',   servico:'Corte Masculino', profissional:'Carlos', data:'18/03/2025', horario:'11:00', status:'agendado',       valor:40  },
  { id:5, cliente:'Fernanda Lima', servico:'Escova',          profissional:'Ana',    data:'18/03/2025', horario:'13:00', status:'agendado',       valor:60  },
  { id:6, cliente:'Lucas Rocha',   servico:'Corte Masculino', profissional:'Carlos', data:'18/03/2025', horario:'14:00', status:'finalizado',     valor:40  },
  { id:7, cliente:'Beatriz Souza', servico:'Coloração',       profissional:'Ana',    data:'19/03/2025', horario:'10:00', status:'agendado',       valor:150 },
]

const initialClientes = [
  { id:1, nome:'Maria Silva',   telefone:'(11) 99999-0001', email:'maria@email.com',    visitas:12, ultimo:'12/03/2025', gasto:1080 },
  { id:2, nome:'João Costa',    telefone:'(11) 99999-0002', email:'joao@email.com',     visitas:8,  ultimo:'10/03/2025', gasto:320  },
  { id:3, nome:'Carla Mendes',  telefone:'(11) 99999-0003', email:'carla@email.com',    visitas:20, ultimo:'15/03/2025', gasto:700  },
  { id:4, nome:'Pedro Alves',   telefone:'(11) 99999-0004', email:'pedro@email.com',    visitas:5,  ultimo:'08/03/2025', gasto:200  },
  { id:5, nome:'Fernanda Lima', telefone:'(11) 99999-0005', email:'fernanda@email.com', visitas:15, ultimo:'14/03/2025', gasto:900  },
]

const statusConfig = {
  agendado:       { label:'Agendado',       bg:'#fff3e0', color:'#f57c00' },
  confirmado:     { label:'Confirmado',     bg:'#e8f5e9', color:'#2e7d32' },
  em_atendimento: { label:'Em atendimento', bg:'#fce4ec', color:'#c2185b' },
  finalizado:     { label:'Finalizado',     bg:'#f3e5f5', color:'#7b1fa2' },
  cancelado:      { label:'Cancelado',      bg:'#ffebee', color:'#c62828' },
}

const profStatusConfig = {
  disponivel:{ label:'Disponível', bg:'#e8f5e9', color:'#2e7d32' },
  ocupado:   { label:'Ocupado',    bg:'#fce4ec', color:'#c2185b' },
  ausente:   { label:'Ausente',    bg:'#fff3e0', color:'#f57c00' },
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:500,maxHeight:'92vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
        <div style={{padding:'18px 22px',borderBottom:'1px solid rgba(233,30,99,.1)',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'#fff',zIndex:1}}>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:17,color:'#1a1a1a'}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:'rgba(0,0,0,.4)',lineHeight:1}}>×</button>
        </div>
        <div style={{padding:22}}>{children}</div>
      </div>
    </div>
  )
}

function Lbl({ children }) {
  return <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(194,24,91,.6)',marginBottom:6,marginTop:14}}>{children}</label>
}

function Inp({ value, onChange, type='text', placeholder, disabled }) {
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
    style={{width:'100%',padding:'11px 13px',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',background:disabled?'#f5f5f5':'#fafafa',color:disabled?'#999':'#1a1a1a'}}/>
}

function Sel({ value, onChange, children }) {
  return <select value={value} onChange={e=>onChange(e.target.value)}
    style={{width:'100%',padding:'11px 13px',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',background:'#fafafa'}}>{children}</select>
}

export default function AdminPanel() {
  const [loggedIn,    setLoggedIn]    = useState(false)
  const [loginUser,   setLoginUser]   = useState('')
  const [loginPass,   setLoginPass]   = useState('')
  const [loginErr,    setLoginErr]    = useState('')
  const [activeTab,   setActiveTab]   = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [agendamentos,setAgendamentos]= useState(initialAgendamentos)
  const [clientes,    setClientes]    = useState(initialClientes)
  const [profissionais,setProfissionais]=useState(initialProfissionais)
  const [servicos,    setServicos]    = useState(initialServicos)
  const [busca,       setBusca]       = useState('')
  const [agendaData,  setAgendaData]  = useState('18/03/2025')
  const [toast,       setToast]       = useState('')
  const [modal,       setModal]       = useState(null)
  const [form,        setForm]        = useState({})

  function showToast(msg){ setToast(msg); setTimeout(()=>setToast(''),2500) }
  function openEdit(type,data){ setForm({...data}); setModal({type}) }
  function closeModal(){ setModal(null) }
  function setF(k){ return v=>setForm(f=>({...f,[k]:v})) }

  function handleLogin(){
    if(loginUser===ADMIN_USER&&loginPass===ADMIN_PASS){ setLoggedIn(true); setLoginErr('') }
    else setLoginErr('Usuário ou senha incorretos')
  }

  // quando seleciona serviço, preenche valor automaticamente
  function onServicoChange(nome){
    const s = servicos.find(x=>x.nome===nome)
    setForm(f=>({...f, servico:nome, valor: s ? s.preco : f.valor}))
  }

  function saveAgendamento(){
    if(!form.cliente||!form.servico||!form.profissional||!form.horario){
      showToast('Preencha todos os campos!'); return
    }
    if(form.id){
      setAgendamentos(a=>a.map(x=>x.id===form.id?{...form}:x))
    } else {
      setAgendamentos(a=>[...a,{...form,id:Date.now()}])
    }
    closeModal(); showToast('Agendamento salvo!')
  }

  function deleteAgendamento(id){ setAgendamentos(a=>a.filter(x=>x.id!==id)); showToast('Removido!') }

  function saveCliente(){
    if(!form.nome){ showToast('Informe o nome!'); return }
    if(form.id){ setClientes(c=>c.map(x=>x.id===form.id?{...form}:x)) }
    else setClientes(c=>[...c,{...form,id:Date.now(),visitas:0,gasto:0,ultimo:'—'}])
    closeModal(); showToast('Cliente salvo!')
  }
  function deleteCliente(id){ setClientes(c=>c.filter(x=>x.id!==id)); showToast('Removido!') }

  function saveProfissional(){
    if(!form.nome){ showToast('Informe o nome!'); return }
    if(form.id){ setProfissionais(p=>p.map(x=>x.id===form.id?{...form}:x)) }
    else setProfissionais(p=>[...p,{...form,id:Date.now(),atendimentos:0,avaliacao:'—',senha:DEFAULT_PROF_PASS}])
    closeModal(); showToast('Profissional salvo!')
  }
  function deleteProfissional(id){ setProfissionais(p=>p.filter(x=>x.id!==id)); showToast('Removido!') }
  function resetSenha(id){
    setProfissionais(p=>p.map(x=>x.id===id?{...x,senha:DEFAULT_PROF_PASS}:x))
    showToast('Senha resetada para 123456!')
  }

  function saveServico(){
    if(!form.nome){ showToast('Informe o nome!'); return }
    if(form.id){ setServicos(s=>s.map(x=>x.id===form.id?{...form}:x)) }
    else setServicos(s=>[...s,{...form,id:Date.now()}])
    closeModal(); showToast('Serviço salvo!')
  }
  function deleteServico(id){ setServicos(s=>s.filter(x=>x.id!==id)); showToast('Removido!') }

  const clientesFiltrados = clientes.filter(c=>
    c.nome?.toLowerCase().includes(busca.toLowerCase())||c.telefone?.includes(busca)
  )

  const agendaHoje = agendamentos.filter(a=>a.data===agendaData)
  const faturamentoHoje = agendamentos.filter(a=>a.status!=='cancelado').reduce((s,a)=>s+(Number(a.valor)||0),0)

  // ── GRADE DA AGENDA ──────────────────────────────────
  function getCelula(horario, nomeProfissional){
    return agendaHoje.find(a=>a.horario===horario&&a.profissional===nomeProfissional)
  }

  const menuItems = [
    {id:'dashboard',     icon:'⊞', label:'Dashboard'     },
    {id:'agenda',        icon:'◷', label:'Agenda'        },
    {id:'clientes',      icon:'◉', label:'Clientes'      },
    {id:'profissionais', icon:'✦', label:'Profissionais' },
    {id:'servicos',      icon:'✂', label:'Serviços'      },
    {id:'financeiro',    icon:'◎', label:'Financeiro'    },
    {id:'promocoes',     icon:'❋', label:'Promoções'     },
    {id:'configuracoes', icon:'⊙', label:'Configurações' },
  ]

  // ── LOGIN ─────────────────────────────────────────────
  if(!loggedIn) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@300;400;500;600&display=swap');*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Montserrat',sans-serif;background:linear-gradient(160deg,#fce4ec,#fdf6f9);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}`}</style>
      <div style={{background:'#fff',borderRadius:24,width:'100%',maxWidth:400,overflow:'hidden',boxShadow:'0 8px 40px rgba(233,30,99,.12)'}}>
        <div style={{background:'linear-gradient(160deg,#fce4ec,#fdf6f9)',padding:'40px 32px 32px',textAlign:'center',borderBottom:'1px solid rgba(233,30,99,.08)'}}>
          <div style={{width:64,height:64,borderRadius:'50%',border:'2px solid #e91e63',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',background:'#fff'}}>
            <span style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:700,color:'#e91e63'}}>JOU</span>
          </div>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:26,fontWeight:700,color:'#c2185b',letterSpacing:3}}>JOUDAT SALON</div>
          <div style={{fontSize:10,letterSpacing:4,color:'rgba(194,24,91,.5)',textTransform:'uppercase',marginTop:6}}>Painel Administrativo</div>
        </div>
        <div style={{padding:32}}>
          <Lbl>Usuário</Lbl>
          <Inp value={loginUser} onChange={setLoginUser} placeholder="Digite seu usuário"/>
          <Lbl>Senha</Lbl>
          <Inp type="password" value={loginPass} onChange={v=>{setLoginPass(v)}} placeholder="Digite sua senha"/>
          {loginErr&&<div style={{background:'#ffebee',color:'#c62828',padding:'10px 14px',borderRadius:8,fontSize:12,margin:'12px 0',textAlign:'center'}}>{loginErr}</div>}
          <button onClick={handleLogin} onKeyDown={e=>e.key==='Enter'&&handleLogin()} style={{width:'100%',padding:16,background:'linear-gradient(135deg,#e91e63,#c2185b)',border:'none',borderRadius:12,fontFamily:'Montserrat,sans-serif',fontSize:11,fontWeight:600,letterSpacing:4,textTransform:'uppercase',color:'#fff',cursor:'pointer',marginTop:16}}>
            Entrar no Painel
          </button>
        </div>
      </div>
    </>
  )

  // ── PAINEL ────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@300;400;500;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Montserrat',sans-serif;background:#fdf6f9;color:#1a1a1a;}
        .layout{display:flex;min-height:100vh;}
        .sidebar{width:${sidebarOpen?'226px':'62px'};background:linear-gradient(180deg,#c2185b,#880e4f);display:flex;flex-direction:column;transition:width .3s;overflow:hidden;flex-shrink:0;position:fixed;top:0;left:0;bottom:0;z-index:100;}
        .sb-hd{padding:20px 14px;border-bottom:1px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:10px;white-space:nowrap;}
        .sb-logo{width:32px;height:32px;flex-shrink:0;border-radius:50%;border:1.5px solid rgba(255,255,255,.6);display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:10px;font-weight:700;color:#fff;}
        .sb-nav{flex:1;padding:10px 0;overflow-y:auto;}
        .ni{display:flex;align-items:center;gap:11px;padding:11px 14px;cursor:pointer;white-space:nowrap;transition:background .2s;border-left:3px solid transparent;}
        .ni:hover{background:rgba(255,255,255,.08);}
        .ni.active{background:rgba(255,255,255,.15);border-left-color:#fff;}
        .ni-ic{font-size:14px;color:rgba(255,255,255,.65);flex-shrink:0;width:18px;text-align:center;}
        .ni.active .ni-ic,.ni.active .ni-lb{color:#fff;font-weight:600;}
        .ni-lb{font-size:12px;font-weight:500;color:rgba(255,255,255,.65);}
        .sb-ft{padding:12px 14px;border-top:1px solid rgba(255,255,255,.1);white-space:nowrap;display:flex;align-items:center;gap:10px;}
        .main{flex:1;margin-left:${sidebarOpen?'226px':'62px'};transition:margin-left .3s;display:flex;flex-direction:column;min-height:100vh;}
        .topbar{background:#fff;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(233,30,99,.08);position:sticky;top:0;z-index:50;}
        .content{padding:22px;flex:1;}
        .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
        .kpi{background:#fff;border-radius:14px;padding:18px;border:1px solid rgba(233,30,99,.06);box-shadow:0 2px 8px rgba(233,30,99,.04);transition:transform .2s;}
        .kpi:hover{transform:translateY(-2px);}
        .sc{background:#fff;border-radius:14px;border:1px solid rgba(233,30,99,.06);box-shadow:0 2px 8px rgba(233,30,99,.04);overflow:hidden;margin-bottom:18px;}
        .sc-hd{padding:14px 20px;border-bottom:1px solid rgba(233,30,99,.06);display:flex;align-items:center;justify-content:space-between;}
        .sc-title{font-family:'Playfair Display',serif;font-size:15px;}
        .tbl{width:100%;border-collapse:collapse;}
        .tbl th{padding:9px 18px;text-align:left;font-size:9px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(0,0,0,.3);border-bottom:1px solid rgba(233,30,99,.06);}
        .tbl td{padding:11px 18px;font-size:13px;border-bottom:1px solid rgba(233,30,99,.04);}
        .tbl tr:last-child td{border-bottom:none;}
        .tbl tr:hover td{background:#fdf6f9;}
        .bdg{padding:3px 8px;border-radius:20px;font-size:10px;font-weight:600;white-space:nowrap;}
        .btn-pk{padding:9px 18px;background:linear-gradient(135deg,#e91e63,#c2185b);border:none;border-radius:9px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#fff;cursor:pointer;}
        .btn-pk:hover{opacity:.88;}
        .btn-ot{padding:7px 12px;background:transparent;border:1.5px solid rgba(233,30,99,.25);border-radius:8px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;color:#e91e63;cursor:pointer;}
        .btn-ot:hover{border-color:#e91e63;background:#fdf6f9;}
        .btn-rd{padding:7px 12px;background:transparent;border:1.5px solid rgba(198,40,40,.25);border-radius:8px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;color:#c62828;cursor:pointer;}
        .btn-rd:hover{background:#ffebee;}
        .btn-bl{padding:7px 12px;background:transparent;border:1.5px solid rgba(13,71,161,.25);border-radius:8px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;color:#0d47a1;cursor:pointer;}
        .btn-bl:hover{background:#e3f2fd;}
        .sr{display:flex;align-items:center;justify-content:space-between;padding:10px 20px;border-bottom:1px solid rgba(233,30,99,.04);}
        .sr:last-child{border-bottom:none;}
        .search-w{position:relative;margin-bottom:14px;}
        .s-ic{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:14px;color:rgba(233,30,99,.4);}
        .s-inp{width:100%;padding:10px 10px 10px 36px;border:1.5px solid rgba(233,30,99,.15);border-radius:10px;font-family:'Montserrat',sans-serif;font-size:13px;outline:none;background:#fafafa;}
        .s-inp:focus{border-color:#e91e63;background:#fff;}
        .prof-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;padding:18px;}
        .pc{border:1px solid rgba(233,30,99,.1);border-radius:12px;padding:16px;text-align:center;transition:box-shadow .2s;}
        .pc:hover{box-shadow:0 4px 20px rgba(233,30,99,.1);}
        .serv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;padding:18px;}
        .svc{border:1px solid rgba(233,30,99,.1);border-radius:12px;padding:14px;transition:box-shadow .2s;}
        .svc:hover{box-shadow:0 4px 16px rgba(233,30,99,.1);}
        .tag{padding:3px 7px;background:#fce4ec;border-radius:10px;font-size:9px;font-weight:600;color:#c2185b;}
        .fin-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
        .promo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;padding:18px;}
        .prc{background:linear-gradient(135deg,#fce4ec,#fdf6f9);border:1px solid rgba(233,30,99,.15);border-radius:14px;padding:16px;}

        /* ── AGENDA GRADE ── */
        .agenda-wrap{overflow-x:auto;padding:0;}
        .agenda-table{border-collapse:collapse;min-width:100%;}
        .agenda-table th{padding:10px 14px;background:#fce4ec;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c2185b;border:1px solid rgba(233,30,99,.12);text-align:center;white-space:nowrap;}
        .agenda-table th.hora-col{background:#fff3e0;color:#f57c00;min-width:70px;}
        .agenda-table td{border:1px solid rgba(233,30,99,.08);padding:4px 6px;vertical-align:top;min-width:130px;height:38px;}
        .agenda-table td.hora-cell{background:#fafafa;padding:8px 10px;font-size:12px;font-weight:600;color:#c2185b;text-align:center;white-space:nowrap;min-width:70px;}
        .agenda-table tr:hover td{background:#fdf6f9;}
        .agenda-table tr:hover td.hora-cell{background:#fafafa;}
        .cell-item{background:linear-gradient(135deg,#fce4ec,#f8bbd0);border-radius:6px;padding:4px 7px;cursor:pointer;transition:box-shadow .2s;}
        .cell-item:hover{box-shadow:0 2px 8px rgba(233,30,99,.25);}
        .cell-nome{font-size:11px;font-weight:700;color:#c2185b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .cell-serv{font-size:10px;color:rgba(0,0,0,.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

        .toast{position:fixed;bottom:22px;right:22px;background:#2e7d32;color:#fff;padding:11px 20px;border-radius:10px;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;z-index:9999;}
        @media(max-width:1100px){.kpi-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:700px){.content{padding:12px}.topbar{padding:10px 12px}.fin-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sb-hd">
            <div className="sb-logo">JOU</div>
            {sidebarOpen&&<div><div style={{fontFamily:'Playfair Display,serif',fontSize:13,fontWeight:700,color:'#fff',letterSpacing:2}}>JOUDAT</div><div style={{fontSize:8,letterSpacing:3,color:'rgba(255,255,255,.5)',textTransform:'uppercase'}}>Admin</div></div>}
          </div>
          <nav className="sb-nav">
            {menuItems.map(m=>(
              <div key={m.id} className={`ni${activeTab===m.id?' active':''}`} onClick={()=>{setActiveTab(m.id);setBusca('')}}>
                <span className="ni-ic">{m.icon}</span>
                {sidebarOpen&&<span className="ni-lb">{m.label}</span>}
              </div>
            ))}
          </nav>
          <div className="sb-ft">
            <div style={{width:30,height:30,flexShrink:0,borderRadius:'50%',background:'rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#fff',fontWeight:600}}>A</div>
            {sidebarOpen&&<div><div style={{fontSize:12,fontWeight:600,color:'#fff'}}>{ADMIN_USER}</div><div style={{fontSize:9,letterSpacing:2,color:'rgba(255,255,255,.5)',textTransform:'uppercase'}}>Admin</div></div>}
          </div>
        </aside>

        {/* MAIN */}
        <main className="main">
          <div className="topbar">
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <button onClick={()=>setSidebarOpen(!sidebarOpen)} style={{width:32,height:32,borderRadius:8,border:'1px solid rgba(233,30,99,.15)',background:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:'#c2185b'}}>☰</button>
              <div style={{fontFamily:'Playfair Display,serif',fontSize:18}}>{menuItems.find(m=>m.id===activeTab)?.label}</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{padding:'5px 12px',background:'#fce4ec',borderRadius:20,fontSize:11,fontWeight:600,letterSpacing:1,color:'#c2185b'}}>{new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'})}</div>
              <button onClick={()=>setLoggedIn(false)} style={{padding:'6px 14px',background:'none',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:8,fontFamily:'Montserrat,sans-serif',fontSize:10,fontWeight:600,letterSpacing:2,color:'#c2185b',cursor:'pointer',textTransform:'uppercase'}}>Sair</button>
            </div>
          </div>

          <div className="content">

            {/* ══ DASHBOARD ══ */}
            {activeTab==='dashboard'&&(<>
              <div className="kpi-grid">
                {[
                  {l:'Faturamento Hoje',v:`R$ ${faturamentoHoje}`,ic:'💰',bg:'#fce4ec'},
                  {l:'Agendamentos',    v:agendamentos.length,     ic:'📅',bg:'#e8f5e9'},
                  {l:'Em Atendimento', v:agendamentos.filter(a=>a.status==='em_atendimento').length,ic:'✂️',bg:'#fff3e0'},
                  {l:'Clientes',       v:clientes.length,          ic:'👥',bg:'#f3e5f5'},
                ].map(k=>(
                  <div key={k.l} className="kpi">
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                      <div style={{fontSize:9,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(0,0,0,.35)'}}>{k.l}</div>
                      <div style={{width:34,height:34,borderRadius:10,background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{k.ic}</div>
                    </div>
                    <div style={{fontFamily:'Playfair Display,serif',fontSize:28,fontWeight:700}}>{k.v}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:18}}>
                <div className="sc">
                  <div className="sc-hd"><div className="sc-title">Agenda de Hoje — Resumo</div><button className="btn-ot" onClick={()=>setActiveTab('agenda')}>Ver Grade →</button></div>
                  <table className="tbl">
                    <thead><tr><th>Hora</th><th>Cliente</th><th>Serviço</th><th>Profissional</th><th>Status</th><th>Valor</th></tr></thead>
                    <tbody>{agendamentos.filter(a=>a.data===agendaData).slice(0,6).map(a=>(
                      <tr key={a.id}>
                        <td style={{fontWeight:600,color:'#c2185b'}}>{a.horario}</td>
                        <td style={{fontWeight:600}}>{a.cliente}</td>
                        <td style={{color:'rgba(0,0,0,.6)',fontSize:12}}>{a.servico}</td>
                        <td>{a.profissional}</td>
                        <td><span className="bdg" style={{background:statusConfig[a.status]?.bg,color:statusConfig[a.status]?.color}}>{statusConfig[a.status]?.label}</span></td>
                        <td style={{fontWeight:600}}>R$ {a.valor}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:18}}>
                  <div className="sc">
                    <div className="sc-hd"><div className="sc-title">Resumo</div></div>
                    {[{l:'Ticket médio',v:'R$ 59'},{l:'Ocupação',v:'78%'},{l:'Cancelamentos',v:agendamentos.filter(a=>a.status==='cancelado').length},{l:'Fat. mês',v:'R$ 12.450'}].map(s=>(
                      <div key={s.l} className="sr"><span style={{fontSize:12,color:'rgba(0,0,0,.5)'}}>{s.l}</span><span style={{fontSize:14,fontWeight:700,color:'#c2185b'}}>{s.v}</span></div>
                    ))}
                  </div>
                  <div className="sc">
                    <div className="sc-hd"><div className="sc-title">Equipe</div></div>
                    {profissionais.map(p=>(
                      <div key={p.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 18px',borderBottom:'1px solid rgba(233,30,99,.04)'}}>
                        <div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,#f48fb1,#e91e63)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0}}>{p.nome[0]}</div>
                        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{p.nome}</div><div style={{fontSize:11,color:'rgba(0,0,0,.4)'}}>{p.especialidade}</div></div>
                        <span className="bdg" style={{background:profStatusConfig[p.status]?.bg,color:profStatusConfig[p.status]?.color}}>{profStatusConfig[p.status]?.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>)}

            {/* ══ AGENDA GRADE ══ */}
            {activeTab==='agenda'&&(<>
              <div className="sc" style={{marginBottom:16}}>
                <div className="sc-hd">
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div className="sc-title">Grade de Agenda</div>
                    <input type="date" value={agendaData.split('/').reverse().join('-')}
                      onChange={e=>{const [y,m,d]=e.target.value.split('-');setAgendaData(`${d}/${m}/${y}`)}}
                      style={{padding:'6px 12px',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:8,fontFamily:'Montserrat,sans-serif',fontSize:12,outline:'none',background:'#fafafa'}}/>
                  </div>
                  <button className="btn-pk" onClick={()=>openEdit('agendamento',{cliente:'',servico:'',profissional:'',data:agendaData,horario:'',status:'agendado',valor:''})}>+ Novo Agendamento</button>
                </div>

                {/* GRADE */}
                <div className="agenda-wrap">
                  <table className="agenda-table">
                    <thead>
                      <tr>
                        <th className="hora-col">Horário</th>
                        {profissionais.map(p=>(
                          <th key={p.id}>
                            <div>{p.nome}</div>
                            <div style={{fontSize:9,fontWeight:400,opacity:.7,letterSpacing:1}}>{p.especialidade}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {HORARIOS.map(h=>(
                        <tr key={h}>
                          <td className="hora-cell">{h}</td>
                          {profissionais.map(p=>{
                            const cel = getCelula(h, p.nome)
                            return (
                              <td key={p.id} onClick={()=>!cel&&openEdit('agendamento',{cliente:'',servico:'',profissional:p.nome,data:agendaData,horario:h,status:'agendado',valor:''})
                              } style={{cursor:cel?'default':'pointer'}}>
                                {cel&&(
                                  <div className="cell-item" onClick={e=>{e.stopPropagation();openEdit('agendamento',cel)}}>
                                    <div className="cell-nome">{cel.cliente}</div>
                                    <div className="cell-serv">{cel.servico}</div>
                                    <div style={{fontSize:10,fontWeight:600,color:'#c2185b',marginTop:1}}>R$ {cel.valor}</div>
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* LEGENDA */}
                <div style={{padding:'12px 20px',borderTop:'1px solid rgba(233,30,99,.06)',display:'flex',gap:16,flexWrap:'wrap'}}>
                  {Object.entries(statusConfig).map(([k,v])=>(
                    <div key={k} style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:10,height:10,borderRadius:'50%',background:v.color}}></div>
                      <span style={{fontSize:11,color:'rgba(0,0,0,.5)'}}>{v.label}</span>
                    </div>
                  ))}
                  <div style={{fontSize:11,color:'rgba(0,0,0,.35)',marginLeft:'auto'}}>💡 Clique em célula vazia para agendar · Clique no card para editar</div>
                </div>
              </div>

              {/* LISTA ABAIXO DA GRADE */}
              <div className="sc">
                <div className="sc-hd"><div className="sc-title">Lista do Dia — {agendaData}</div></div>
                {agendaHoje.length===0
                  ? <div style={{padding:24,textAlign:'center',color:'rgba(0,0,0,.35)',fontSize:13}}>Nenhum agendamento para esta data</div>
                  : <table className="tbl">
                      <thead><tr><th>Hora</th><th>Cliente</th><th>Serviço</th><th>Profissional</th><th>Status</th><th>Valor</th><th>Ações</th></tr></thead>
                      <tbody>{agendaHoje.map(a=>(
                        <tr key={a.id}>
                          <td style={{fontWeight:600,color:'#c2185b'}}>{a.horario}</td>
                          <td style={{fontWeight:600}}>{a.cliente}</td>
                          <td style={{color:'rgba(0,0,0,.6)',fontSize:12}}>{a.servico}</td>
                          <td>{a.profissional}</td>
                          <td><span className="bdg" style={{background:statusConfig[a.status]?.bg,color:statusConfig[a.status]?.color}}>{statusConfig[a.status]?.label}</span></td>
                          <td style={{fontWeight:600}}>R$ {a.valor}</td>
                          <td style={{display:'flex',gap:6}}>
                            <button className="btn-ot" onClick={()=>openEdit('agendamento',a)}>Editar</button>
                            <button className="btn-rd" onClick={()=>deleteAgendamento(a.id)}>✕</button>
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                }
              </div>
            </>)}

            {/* ══ CLIENTES ══ */}
            {activeTab==='clientes'&&(
              <div className="sc">
                <div className="sc-hd">
                  <div className="sc-title">Clientes Cadastrados</div>
                  <button className="btn-pk" onClick={()=>openEdit('cliente',{nome:'',telefone:'',email:''})}>+ Novo Cliente</button>
                </div>
                <div style={{padding:'14px 18px 0'}}>
                  <div className="search-w"><span className="s-ic">🔍</span><input className="s-inp" placeholder="Buscar por nome ou telefone..." value={busca} onChange={e=>setBusca(e.target.value)}/></div>
                </div>
                <table className="tbl">
                  <thead><tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Visitas</th><th>Último</th><th>Total</th><th>Ações</th></tr></thead>
                  <tbody>{clientesFiltrados.map(c=>(
                    <tr key={c.id}>
                      <td style={{fontWeight:600}}>{c.nome}</td>
                      <td style={{color:'rgba(0,0,0,.6)'}}>{c.telefone}</td>
                      <td style={{color:'rgba(0,0,0,.6)',fontSize:12}}>{c.email}</td>
                      <td><span className="bdg" style={{background:'#fce4ec',color:'#c2185b'}}>{c.visitas}x</span></td>
                      <td style={{fontSize:12,color:'rgba(0,0,0,.5)'}}>{c.ultimo}</td>
                      <td style={{fontWeight:600,color:'#c2185b'}}>R$ {c.gasto}</td>
                      <td style={{display:'flex',gap:6}}>
                        <button className="btn-ot" onClick={()=>openEdit('cliente',c)}>Editar</button>
                        <button className="btn-rd" onClick={()=>deleteCliente(c.id)}>✕</button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            {/* ══ PROFISSIONAIS ══ */}
            {activeTab==='profissionais'&&(
              <div className="sc">
                <div className="sc-hd">
                  <div className="sc-title">Equipe de Profissionais</div>
                  <button className="btn-pk" onClick={()=>openEdit('profissional',{nome:'',especialidade:'',comissao:'',status:'disponivel'})}>+ Novo Profissional</button>
                </div>
                <div className="prof-grid">
                  {profissionais.map(p=>(
                    <div key={p.id} className="pc">
                      <div style={{width:50,height:50,borderRadius:'50%',background:'linear-gradient(135deg,#f48fb1,#e91e63)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:'#fff',margin:'0 auto 10px'}}>{p.nome[0]}</div>
                      <div style={{fontSize:15,fontWeight:600,marginBottom:3}}>{p.nome}</div>
                      <div style={{fontSize:11,color:'rgba(0,0,0,.4)',marginBottom:8,letterSpacing:1}}>{p.especialidade}</div>
                      <span className="bdg" style={{background:profStatusConfig[p.status]?.bg,color:profStatusConfig[p.status]?.color,marginBottom:10,display:'inline-block'}}>{profStatusConfig[p.status]?.label}</span>
                      <div style={{display:'flex',justifyContent:'center',gap:16,marginBottom:12}}>
                        <div style={{textAlign:'center'}}><div style={{fontSize:16,fontWeight:700,color:'#c2185b'}}>{p.comissao}%</div><div style={{fontSize:9,letterSpacing:2,color:'rgba(0,0,0,.35)',textTransform:'uppercase'}}>Comissão</div></div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:6}}>
                        <button className="btn-ot" onClick={()=>openEdit('profissional',p)}>✏️ Editar</button>
                        <button className="btn-bl" onClick={()=>resetSenha(p.id)}>🔑 Resetar Senha</button>
                        <button className="btn-rd" onClick={()=>deleteProfissional(p.id)}>✕ Remover</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ SERVIÇOS ══ */}
            {activeTab==='servicos'&&(
              <div className="sc">
                <div className="sc-hd">
                  <div className="sc-title">Serviços Cadastrados</div>
                  <button className="btn-pk" onClick={()=>openEdit('servico',{nome:'',categoria:'',preco:'',duracao:''})}>+ Novo Serviço</button>
                </div>
                <div className="serv-grid">
                  {servicos.map(s=>(
                    <div key={s.id} className="svc">
                      <div style={{fontSize:9,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'#e91e63',marginBottom:5}}>{s.categoria}</div>
                      <div style={{fontSize:14,fontWeight:600,marginBottom:3}}>{s.nome}</div>
                      <div style={{fontFamily:'Playfair Display,serif',fontSize:20,fontWeight:700,color:'#c2185b',marginBottom:3}}>R$ {s.preco}</div>
                      <div style={{fontSize:11,color:'rgba(0,0,0,.4)',marginBottom:10}}>⏱ {s.duracao} min</div>
                      <div style={{display:'flex',gap:6}}>
                        <button className="btn-ot" style={{flex:1}} onClick={()=>openEdit('servico',s)}>Editar</button>
                        <button className="btn-rd" onClick={()=>deleteServico(s.id)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ FINANCEIRO ══ */}
            {activeTab==='financeiro'&&(<>
              <div className="kpi-grid" style={{marginBottom:18}}>
                {[
                  {l:'Faturamento Hoje',v:`R$ ${faturamentoHoje}`,ic:'💰',bg:'#fce4ec'},
                  {l:'Faturamento Mês', v:'R$ 12.450',             ic:'📈',bg:'#e8f5e9'},
                  {l:'Ticket Médio',    v:'R$ 59',                 ic:'🎯',bg:'#fff3e0'},
                  {l:'Comissões Mês',   v:'R$ 3.820',              ic:'🤝',bg:'#f3e5f5'},
                ].map(k=>(
                  <div key={k.l} className="kpi">
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                      <div style={{fontSize:9,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(0,0,0,.35)'}}>{k.l}</div>
                      <div style={{width:34,height:34,borderRadius:10,background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{k.ic}</div>
                    </div>
                    <div style={{fontFamily:'Playfair Display,serif',fontSize:28,fontWeight:700}}>{k.v}</div>
                  </div>
                ))}
              </div>
              <div className="fin-grid">
                <div className="sc">
                  <div className="sc-hd"><div className="sc-title">Serviços Mais Vendidos</div></div>
                  <table className="tbl">
                    <thead><tr><th>Serviço</th><th>Qtd</th><th>Total</th></tr></thead>
                    <tbody>{[{n:'Corte Feminino',q:18,t:'R$ 1.620'},{n:'Coloração',q:8,t:'R$ 1.200'},{n:'Escova',q:15,t:'R$ 900'},{n:'Barba',q:22,t:'R$ 660'},{n:'Manicure',q:14,t:'R$ 490'}].map(s=>(
                      <tr key={s.n}><td style={{fontWeight:600}}>{s.n}</td><td><span className="bdg" style={{background:'#fce4ec',color:'#c2185b'}}>{s.q}x</span></td><td style={{fontWeight:700,color:'#c2185b'}}>{s.t}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
                <div className="sc">
                  <div className="sc-hd"><div className="sc-title">Comissões da Equipe</div></div>
                  <table className="tbl">
                    <thead><tr><th>Profissional</th><th>%</th><th>Comissão</th></tr></thead>
                    <tbody>{profissionais.map(p=>{
                      const total=agendamentos.filter(a=>a.profissional===p.nome&&a.status==='finalizado').reduce((s,a)=>s+(Number(a.valor)||0),0)
                      return(<tr key={p.id}><td style={{fontWeight:600}}>{p.nome}</td><td><span className="bdg" style={{background:'#f3e5f5',color:'#7b1fa2'}}>{p.comissao}%</span></td><td style={{fontWeight:700,color:'#c2185b'}}>R$ {Math.round(total*(p.comissao/100))}</td></tr>)
                    })}</tbody>
                  </table>
                </div>
              </div>
            </>)}

            {/* ══ PROMOÇÕES ══ */}
            {activeTab==='promocoes'&&(
              <div className="sc">
                <div className="sc-hd"><div className="sc-title">Promoções Ativas</div><button className="btn-pk">+ Nova Promoção</button></div>
                <div className="promo-grid">
                  {[{tag:'Semanal',title:'Terça da Barba',desc:'20% de desconto na barba toda terça',badge:'-20%'},{tag:'Combo',title:'Corte + Barba',desc:'Combo por R$ 60 — economize R$ 10',badge:'R$ 60'},{tag:'Novos',title:'1ª Visita',desc:'10% de desconto na primeira visita',badge:'-10%'},{tag:'Fidelidade',title:'10ª Visita Grátis',desc:'A cada 10 serviços ganhe 1 grátis',badge:'Grátis'},{tag:'Especial',title:'Aniversariante',desc:'15% off no mês do seu aniversário',badge:'-15%'},{tag:'Cashback',title:'Cashback 5%',desc:'5% de volta na próxima visita',badge:'5% back'}].map(p=>(
                    <div key={p.title} className="prc">
                      <div style={{fontSize:9,fontWeight:700,letterSpacing:3,color:'#e91e63',textTransform:'uppercase',marginBottom:5}}>{p.tag}</div>
                      <div style={{fontFamily:'Playfair Display,serif',fontSize:16,marginBottom:5}}>{p.title}</div>
                      <div style={{fontSize:12,color:'rgba(0,0,0,.5)',marginBottom:12}}>{p.desc}</div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <span style={{padding:'4px 10px',background:'#e91e63',borderRadius:20,fontSize:11,fontWeight:700,color:'#fff'}}>{p.badge}</span>
                        <button className="btn-ot" style={{fontSize:9,padding:'5px 10px'}}>Editar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ CONFIGURAÇÕES ══ */}
            {activeTab==='configuracoes'&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
                {[{title:'Dados do Salão',fields:[{l:'Nome do Salão',ph:'Joudat Salon'},{l:'Telefone/WhatsApp',ph:'(11) 99999-0000'},{l:'Endereço',ph:'Rua, número, bairro'},{l:'E-mail',ph:'contato@salao.com'}]},{title:'Funcionamento',fields:[{l:'Horário',ph:'09:00 – 19:00'},{l:'Dias',ph:'Segunda a Sábado'},{l:'Intervalo',ph:'10 minutos'},{l:'Notificações',ph:'E-mail + WhatsApp'}]}].map(sec=>(
                  <div key={sec.title} className="sc">
                    <div className="sc-hd"><div className="sc-title">{sec.title}</div></div>
                    <div style={{padding:20}}>
                      {sec.fields.map(f=>(
                        <div key={f.l} style={{marginBottom:12}}>
                          <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(194,24,91,.6)',marginBottom:6}}>{f.l}</label>
                          <input placeholder={f.ph} style={{width:'100%',padding:'11px 13px',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',background:'#fafafa'}}/>
                        </div>
                      ))}
                      <button className="btn-pk" onClick={()=>showToast('Configurações salvas!')}>Salvar Alterações</button>
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
          <Lbl>Cliente</Lbl>
          <Sel value={form.cliente||''} onChange={setF('cliente')}>
            <option value="">Selecionar cliente...</option>
            {clientes.map(c=><option key={c.id}>{c.nome}</option>)}
          </Sel>
          <Lbl>Serviço</Lbl>
          <Sel value={form.servico||''} onChange={onServicoChange}>
            <option value="">Selecionar serviço...</option>
            {servicos.map(s=><option key={s.id}>{s.nome}</option>)}
          </Sel>
          <Lbl>Profissional</Lbl>
          <Sel value={form.profissional||''} onChange={setF('profissional')}>
            <option value="">Selecionar profissional...</option>
            {profissionais.map(p=><option key={p.id}>{p.nome}</option>)}
          </Sel>
          <Lbl>Data</Lbl><Inp type="date" value={form.data?.split('/').reverse().join('-')||''} onChange={v=>{const[y,m,d]=v.split('-');setF('data')(`${d}/${m}/${y}`)}}/>
          <Lbl>Horário</Lbl>
          <Sel value={form.horario||''} onChange={setF('horario')}>
            <option value="">Selecionar horário...</option>
            {HORARIOS.map(h=><option key={h}>{h}</option>)}
          </Sel>
          <Lbl>Status</Lbl>
          <Sel value={form.status||'agendado'} onChange={setF('status')}>
            {Object.entries(statusConfig).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </Sel>
          <Lbl>Valor (R$) — preenchido automaticamente pelo serviço</Lbl>
          <Inp type="number" value={form.valor||''} onChange={setF('valor')} placeholder="Preenchido automaticamente"/>
          <div style={{fontSize:11,color:'rgba(0,0,0,.4)',marginTop:4,marginBottom:4}}>⚙️ Apenas o administrador pode alterar o valor manualmente.</div>
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button className="btn-pk" style={{flex:1}} onClick={saveAgendamento}>Salvar</button>
            <button className="btn-ot" onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {modal?.type==='cliente'&&(
        <Modal title={form.id?'Editar Cliente':'Novo Cliente'} onClose={closeModal}>
          <Lbl>Nome Completo</Lbl><Inp value={form.nome||''} onChange={setF('nome')} placeholder="Nome do cliente"/>
          <Lbl>Telefone</Lbl><Inp value={form.telefone||''} onChange={setF('telefone')} placeholder="(11) 99999-0000"/>
          <Lbl>E-mail</Lbl><Inp value={form.email||''} onChange={setF('email')} placeholder="cliente@email.com"/>
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button className="btn-pk" style={{flex:1}} onClick={saveCliente}>Salvar</button>
            <button className="btn-ot" onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {modal?.type==='profissional'&&(
        <Modal title={form.id?'Editar Profissional':'Novo Profissional'} onClose={closeModal}>
          <Lbl>Nome</Lbl><Inp value={form.nome||''} onChange={setF('nome')} placeholder="Nome"/>
          <Lbl>Especialidade</Lbl><Inp value={form.especialidade||''} onChange={setF('especialidade')} placeholder="Ex: Cabelereira"/>
          <Lbl>Comissão (%)</Lbl><Inp type="number" value={form.comissao||''} onChange={setF('comissao')} placeholder="40"/>
          <Lbl>Status</Lbl>
          <Sel value={form.status||'disponivel'} onChange={setF('status')}>
            <option value="disponivel">Disponível</option>
            <option value="ocupado">Ocupado</option>
            <option value="ausente">Ausente</option>
          </Sel>
          {!form.id&&<div style={{background:'#e8f5e9',padding:'10px 14px',borderRadius:8,fontSize:12,color:'#2e7d32',marginTop:12}}>🔑 Senha padrão: <strong>123456</strong></div>}
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button className="btn-pk" style={{flex:1}} onClick={saveProfissional}>Salvar</button>
            <button className="btn-ot" onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {modal?.type==='servico'&&(
        <Modal title={form.id?'Editar Serviço':'Novo Serviço'} onClose={closeModal}>
          <Lbl>Nome do Serviço</Lbl><Inp value={form.nome||''} onChange={setF('nome')} placeholder="Ex: Corte Feminino"/>
          <Lbl>Categoria</Lbl>
          <Sel value={form.categoria||''} onChange={setF('categoria')}>
            <option value="">Selecionar...</option>
            {['Corte','Barba','Coloração','Tratamento','Unhas','Estética'].map(c=><option key={c}>{c}</option>)}
          </Sel>
          <Lbl>Preço (R$)</Lbl><Inp type="number" value={form.preco||''} onChange={setF('preco')} placeholder="0"/>
          <Lbl>Duração (minutos)</Lbl><Inp type="number" value={form.duracao||''} onChange={setF('duracao')} placeholder="30"/>
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button className="btn-pk" style={{flex:1}} onClick={saveServico}>Salvar</button>
            <button className="btn-ot" onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {toast&&<div className="toast">✓ {toast}</div>}
    </>
  )
}
