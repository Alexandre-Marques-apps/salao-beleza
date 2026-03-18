'use client'
import { useState } from 'react'

// ── MOCK DATA ──────────────────────────────────────────────
const mockAgendamentos = [
  { id:1, cliente:'Maria Silva',   servico:'Corte Feminino',  profissional:'Ana',    horario:'09:00', status:'confirmado',     valor:90  },
  { id:2, cliente:'João Costa',    servico:'Barba',           profissional:'Carlos', horario:'09:30', status:'agendado',       valor:30  },
  { id:3, cliente:'Carla Mendes',  servico:'Manicure',        profissional:'Paula',  horario:'10:00', status:'em_atendimento', valor:35  },
  { id:4, cliente:'Pedro Alves',   servico:'Corte Masculino', profissional:'Carlos', horario:'11:00', status:'agendado',       valor:40  },
  { id:5, cliente:'Fernanda Lima', servico:'Escova',          profissional:'Ana',    horario:'13:00', status:'agendado',       valor:60  },
  { id:6, cliente:'Lucas Rocha',   servico:'Corte Masculino', profissional:'Carlos', horario:'14:00', status:'finalizado',     valor:40  },
  { id:7, cliente:'Beatriz Souza', servico:'Coloração',       profissional:'Ana',    horario:'15:00', status:'agendado',       valor:150 },
  { id:8, cliente:'Roberto Lima',  servico:'Barba',           profissional:'Carlos', horario:'16:00', status:'cancelado',      valor:30  },
]

const mockClientes = [
  { id:1, nome:'Maria Silva',   telefone:'(11) 99999-0001', email:'maria@email.com',   visitas:12, ultimo:'12/03/2025', gasto:'R$ 1.080' },
  { id:2, nome:'João Costa',    telefone:'(11) 99999-0002', email:'joao@email.com',    visitas:8,  ultimo:'10/03/2025', gasto:'R$ 320'   },
  { id:3, nome:'Carla Mendes',  telefone:'(11) 99999-0003', email:'carla@email.com',   visitas:20, ultimo:'15/03/2025', gasto:'R$ 700'   },
  { id:4, nome:'Pedro Alves',   telefone:'(11) 99999-0004', email:'pedro@email.com',   visitas:5,  ultimo:'08/03/2025', gasto:'R$ 200'   },
  { id:5, nome:'Fernanda Lima', telefone:'(11) 99999-0005', email:'fernanda@email.com',visitas:15, ultimo:'14/03/2025', gasto:'R$ 900'   },
  { id:6, nome:'Lucas Rocha',   telefone:'(11) 99999-0006', email:'lucas@email.com',   visitas:3,  ultimo:'05/03/2025', gasto:'R$ 120'   },
]

const mockProfissionais = [
  { id:1, nome:'Ana',    especialidade:'Cabelereira', comissao:40, servicos:['Corte Feminino','Escova','Coloração'], status:'ocupado',     atendimentos:156, avaliacao:'4.9' },
  { id:2, nome:'Carlos', especialidade:'Barbeiro',    comissao:35, servicos:['Barba','Corte Masculino'],            status:'disponivel',  atendimentos:203, avaliacao:'4.8' },
  { id:3, nome:'Paula',  especialidade:'Manicure',    comissao:50, servicos:['Manicure','Pedicure'],                status:'ocupado',     atendimentos:98,  avaliacao:'4.7' },
  { id:4, nome:'Carla',  especialidade:'Cabelereira', comissao:40, servicos:['Corte Feminino','Escova'],            status:'ausente',     atendimentos:87,  avaliacao:'4.6' },
]

const mockServicos = [
  { id:1, nome:'Corte Masculino', categoria:'Corte',     preco:40,  duracao:30, profissionais:['Carlos']      },
  { id:2, nome:'Corte Feminino',  categoria:'Corte',     preco:90,  duracao:60, profissionais:['Ana','Carla'] },
  { id:3, nome:'Barba',           categoria:'Barba',     preco:30,  duracao:20, profissionais:['Carlos']      },
  { id:4, nome:'Escova',          categoria:'Tratamento',preco:60,  duracao:40, profissionais:['Ana','Carla'] },
  { id:5, nome:'Manicure',        categoria:'Unhas',     preco:35,  duracao:30, profissionais:['Paula']       },
  { id:6, nome:'Coloração',       categoria:'Coloração', preco:150, duracao:90, profissionais:['Ana']         },
  { id:7, nome:'Pedicure',        categoria:'Unhas',     preco:40,  duracao:40, profissionais:['Paula']       },
]

const mockFinanceiro = {
  faturamentoHoje: 475,
  faturamentoMes: 12450,
  ticketMedio: 59,
  comissoes: 3820,
  servicos: [
    { nome:'Corte Feminino', qtd:18, total:'R$ 1.620' },
    { nome:'Coloração',      qtd:8,  total:'R$ 1.200' },
    { nome:'Escova',         qtd:15, total:'R$ 900'   },
    { nome:'Barba',          qtd:22, total:'R$ 660'   },
    { nome:'Manicure',       qtd:14, total:'R$ 490'   },
  ],
  comissoesProfissionais: [
    { nome:'Ana',    total:'R$ 1.488', pct:'40%' },
    { nome:'Carlos', total:'R$ 1.050', pct:'35%' },
    { nome:'Paula',  total:'R$ 735',   pct:'50%' },
    { nome:'Carla',  total:'R$ 547',   pct:'40%' },
  ]
}

const statusConfig = {
  agendado:       { label:'Agendado',        bg:'#fff3e0', color:'#f57c00' },
  confirmado:     { label:'Confirmado',      bg:'#e8f5e9', color:'#2e7d32' },
  em_atendimento: { label:'Em atendimento',  bg:'#fce4ec', color:'#c2185b' },
  finalizado:     { label:'Finalizado',      bg:'#f3e5f5', color:'#7b1fa2' },
  cancelado:      { label:'Cancelado',       bg:'#ffebee', color:'#c62828' },
}

const profStatusConfig = {
  disponivel: { label:'Disponível', bg:'#e8f5e9', color:'#2e7d32' },
  ocupado:    { label:'Ocupado',    bg:'#fce4ec', color:'#c2185b' },
  ausente:    { label:'Ausente',    bg:'#fff3e0', color:'#f57c00' },
}

// ── COMPONENT ─────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [buscarCliente, setBuscarCliente] = useState('')
  const [salaoNome, setSalaoNome] = useState('Joudat Salon')
  const [salaoTel, setSalaoTel] = useState('(11) 99999-0000')
  const [salaoHorario, setSalaoHorario] = useState('09:00 – 19:00')
  const [savedMsg, setSavedMsg] = useState(false)

  const clientesFiltrados = mockClientes.filter(c =>
    c.nome.toLowerCase().includes(buscarCliente.toLowerCase()) ||
    c.telefone.includes(buscarCliente)
  )

  const faturamentoHoje = mockAgendamentos
    .filter(a => a.status !== 'cancelado')
    .reduce((s, a) => s + a.valor, 0)

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

  function handleSave() {
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2500)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@300;400;500;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Montserrat',sans-serif;background:#fdf6f9;color:#1a1a1a;min-height:100vh;}

        /* ── LAYOUT ── */
        .layout{display:flex;min-height:100vh;}

        /* ── SIDEBAR ── */
        .sidebar{
          width:${sidebarOpen?'230px':'64px'};
          background:linear-gradient(180deg,#c2185b 0%,#880e4f 100%);
          display:flex;flex-direction:column;
          transition:width .3s ease;overflow:hidden;flex-shrink:0;
          position:fixed;top:0;left:0;bottom:0;z-index:100;
        }
        .sb-header{padding:24px 16px;border-bottom:1px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:10px;white-space:nowrap;}
        .sb-logo{width:34px;height:34px;flex-shrink:0;border-radius:50%;border:1.5px solid rgba(255,255,255,.6);display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:10px;font-weight:700;color:#fff;letter-spacing:1px;}
        .sb-title{font-family:'Playfair Display',serif;font-size:13px;font-weight:700;color:#fff;letter-spacing:2px;line-height:1.2;}
        .sb-sub{font-size:8px;letter-spacing:3px;color:rgba(255,255,255,.5);text-transform:uppercase;}
        .sb-nav{flex:1;padding:12px 0;}
        .nav-item{display:flex;align-items:center;gap:12px;padding:12px 16px;cursor:pointer;white-space:nowrap;transition:background .2s;border-left:3px solid transparent;}
        .nav-item:hover{background:rgba(255,255,255,.08);}
        .nav-item.active{background:rgba(255,255,255,.15);border-left-color:#fff;}
        .nav-icon{font-size:15px;color:rgba(255,255,255,.65);flex-shrink:0;width:20px;text-align:center;}
        .nav-item.active .nav-icon{color:#fff;}
        .nav-label{font-size:12px;font-weight:500;letter-spacing:.5px;color:rgba(255,255,255,.65);}
        .nav-item.active .nav-label{color:#fff;font-weight:600;}
        .sb-footer{padding:16px;border-top:1px solid rgba(255,255,255,.1);white-space:nowrap;}
        .adm-info{display:flex;align-items:center;gap:10px;}
        .adm-avatar{width:32px;height:32px;flex-shrink:0;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;font-weight:600;}
        .adm-name{font-size:12px;font-weight:600;color:#fff;}
        .adm-role{font-size:9px;letter-spacing:2px;color:rgba(255,255,255,.5);text-transform:uppercase;}

        /* ── MAIN ── */
        .main{flex:1;margin-left:${sidebarOpen?'230px':'64px'};transition:margin-left .3s ease;display:flex;flex-direction:column;min-height:100vh;}

        /* ── TOPBAR ── */
        .topbar{background:#fff;padding:14px 28px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(233,30,99,.08);position:sticky;top:0;z-index:50;}
        .topbar-left{display:flex;align-items:center;gap:14px;}
        .toggle-btn{width:34px;height:34px;border-radius:8px;border:1px solid rgba(233,30,99,.15);background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:17px;color:#c2185b;transition:background .2s;}
        .toggle-btn:hover{background:#fce4ec;}
        .page-title{font-family:'Playfair Display',serif;font-size:19px;color:#1a1a1a;}
        .topbar-right{display:flex;align-items:center;gap:10px;}
        .date-badge{padding:5px 12px;background:#fce4ec;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:1px;color:#c2185b;}
        .notif-btn{width:34px;height:34px;border-radius:8px;border:1px solid rgba(233,30,99,.15);background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:17px;position:relative;}
        .notif-dot{position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:#e91e63;}

        /* ── CONTENT ── */
        .content{padding:28px;flex:1;}

        /* ── KPI ── */
        .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:28px;}
        .kpi-card{background:#fff;border-radius:14px;padding:22px;border:1px solid rgba(233,30,99,.06);box-shadow:0 2px 10px rgba(233,30,99,.04);transition:transform .2s;}
        .kpi-card:hover{transform:translateY(-2px);}
        .kpi-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
        .kpi-label{font-size:9px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(0,0,0,.35);}
        .kpi-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;}
        .kpi-value{font-family:'Playfair Display',serif;font-size:30px;font-weight:700;color:#1a1a1a;margin-bottom:3px;}
        .kpi-sub{font-size:10px;color:rgba(0,0,0,.35);letter-spacing:1px;}

        /* ── SECTION CARD ── */
        .sec-grid{display:grid;grid-template-columns:1fr 300px;gap:22px;}
        .sec-card{background:#fff;border-radius:14px;border:1px solid rgba(233,30,99,.06);box-shadow:0 2px 10px rgba(233,30,99,.04);overflow:hidden;margin-bottom:22px;}
        .sec-head{padding:18px 22px;border-bottom:1px solid rgba(233,30,99,.06);display:flex;align-items:center;justify-content:space-between;}
        .sec-title{font-family:'Playfair Display',serif;font-size:16px;color:#1a1a1a;}
        .sec-action{font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#e91e63;cursor:pointer;border:none;background:none;padding:0;}

        /* ── TABLE ── */
        .tbl{width:100%;border-collapse:collapse;}
        .tbl th{padding:11px 22px;text-align:left;font-size:9px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(0,0,0,.3);border-bottom:1px solid rgba(233,30,99,.06);}
        .tbl td{padding:13px 22px;font-size:13px;border-bottom:1px solid rgba(233,30,99,.04);}
        .tbl tr:last-child td{border-bottom:none;}
        .tbl tr:hover td{background:#fdf6f9;}

        /* ── BADGES ── */
        .badge{padding:3px 10px;border-radius:20px;font-size:10px;font-weight:600;letter-spacing:.5px;white-space:nowrap;}

        /* ── SIDE PANELS ── */
        .side-panels{display:flex;flex-direction:column;gap:22px;}
        .stat-item{display:flex;align-items:center;justify-content:space-between;padding:11px 22px;border-bottom:1px solid rgba(233,30,99,.04);}
        .stat-item:last-child{border-bottom:none;}
        .stat-label{font-size:12px;color:rgba(0,0,0,.5);}
        .stat-value{font-size:14px;font-weight:700;color:#c2185b;}

        /* ── PROF CARDS ── */
        .prof-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px;padding:22px;}
        .prof-card{border:1px solid rgba(233,30,99,.1);border-radius:12px;padding:20px;text-align:center;transition:box-shadow .2s;}
        .prof-card:hover{box-shadow:0 4px 20px rgba(233,30,99,.1);}
        .prof-avatar{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#f48fb1,#e91e63);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff;margin:0 auto 12px;}
        .prof-name{font-size:15px;font-weight:600;color:#1a1a1a;margin-bottom:4px;}
        .prof-role{font-size:11px;color:rgba(0,0,0,.4);margin-bottom:12px;letter-spacing:1px;}
        .prof-stats{display:flex;justify-content:center;gap:20px;margin-bottom:14px;}
        .prof-stat-val{font-size:16px;font-weight:700;color:#c2185b;}
        .prof-stat-lbl{font-size:9px;letter-spacing:2px;color:rgba(0,0,0,.35);text-transform:uppercase;}
        .prof-tags{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-bottom:14px;}
        .tag{padding:3px 8px;background:#fce4ec;border-radius:10px;font-size:9px;font-weight:600;color:#c2185b;letter-spacing:.5px;}

        /* ── SERVIÇOS GRID ── */
        .serv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:18px;padding:22px;}
        .serv-card{border:1px solid rgba(233,30,99,.1);border-radius:12px;padding:18px;transition:box-shadow .2s;}
        .serv-card:hover{box-shadow:0 4px 20px rgba(233,30,99,.1);}
        .serv-cat{font-size:9px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#e91e63;margin-bottom:8px;}
        .serv-name{font-size:15px;font-weight:600;color:#1a1a1a;margin-bottom:4px;}
        .serv-price{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#c2185b;margin-bottom:4px;}
        .serv-dur{font-size:11px;color:rgba(0,0,0,.4);}

        /* ── FINANCEIRO ── */
        .fin-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px;}

        /* ── CONFIG FORM ── */
        .form-sec{padding:22px;}
        .form-row{margin-bottom:18px;}
        .form-lbl{display:block;font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(194,24,91,.6);margin-bottom:8px;}
        .form-inp{width:100%;padding:13px 16px;border:1.5px solid rgba(233,30,99,.2);border-radius:10px;font-family:'Montserrat',sans-serif;font-size:13px;color:#1a1a1a;outline:none;transition:border-color .3s;background:#fafafa;}
        .form-inp:focus{border-color:#e91e63;background:#fff;}
        .form-sel{width:100%;padding:13px 16px;border:1.5px solid rgba(233,30,99,.2);border-radius:10px;font-family:'Montserrat',sans-serif;font-size:13px;color:#1a1a1a;outline:none;background:#fafafa;cursor:pointer;}

        /* ── BUTTONS ── */
        .btn-pink{padding:12px 24px;background:linear-gradient(135deg,#e91e63,#c2185b);border:none;border-radius:10px;font-family:'Montserrat',sans-serif;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#fff;cursor:pointer;transition:opacity .3s;}
        .btn-pink:hover{opacity:.88;}
        .btn-outline{padding:10px 20px;background:transparent;border:1.5px solid rgba(233,30,99,.25);border-radius:10px;font-family:'Montserrat',sans-serif;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#e91e63;cursor:pointer;transition:border-color .3s;}
        .btn-outline:hover{border-color:#e91e63;}

        /* ── SEARCH ── */
        .search-wrap{position:relative;margin-bottom:18px;}
        .search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:15px;color:rgba(233,30,99,.4);}
        .search-inp{width:100%;padding:12px 12px 12px 40px;border:1.5px solid rgba(233,30,99,.15);border-radius:10px;font-family:'Montserrat',sans-serif;font-size:13px;color:#1a1a1a;outline:none;transition:border-color .3s;background:#fafafa;}
        .search-inp:focus{border-color:#e91e63;background:#fff;}

        /* ── PROMO ── */
        .promo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px;padding:22px;}
        .promo-card{background:linear-gradient(135deg,#fce4ec,#fdf6f9);border:1px solid rgba(233,30,99,.15);border-radius:14px;padding:20px;}
        .promo-tag{font-size:9px;font-weight:700;letter-spacing:3px;color:#e91e63;text-transform:uppercase;margin-bottom:8px;}
        .promo-title{font-family:'Playfair Display',serif;font-size:18px;color:#1a1a1a;margin-bottom:6px;}
        .promo-desc{font-size:12px;color:rgba(0,0,0,.5);margin-bottom:14px;}
        .promo-badge{display:inline-block;padding:4px 12px;background:#e91e63;border-radius:20px;font-size:11px;font-weight:700;color:#fff;}

        /* ── SAVED ── */
        .saved-toast{position:fixed;bottom:24px;right:24px;background:#2e7d32;color:#fff;padding:12px 24px;border-radius:10px;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;z-index:999;animation:fadeIn .3s ease;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

        @media(max-width:1100px){.kpi-grid{grid-template-columns:repeat(2,1fr)}.sec-grid{grid-template-columns:1fr}}
        @media(max-width:700px){.kpi-grid{grid-template-columns:repeat(2,1fr)}.content{padding:16px}.topbar{padding:12px 16px}.fin-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="layout">

        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sb-header">
            <div className="sb-logo">JOU</div>
            {sidebarOpen && <div><div className="sb-title">JOUDAT</div><div className="sb-sub">Admin Panel</div></div>}
          </div>
          <nav className="sb-nav">
            {menuItems.map(m => (
              <div key={m.id} className={`nav-item ${activeTab===m.id?'active':''}`} onClick={()=>setActiveTab(m.id)}>
                <span className="nav-icon">{m.icon}</span>
                {sidebarOpen && <span className="nav-label">{m.label}</span>}
              </div>
            ))}
          </nav>
          <div className="sb-footer">
            <div className="adm-info">
              <div className="adm-avatar">A</div>
              {sidebarOpen && <div><div className="adm-name">Administrador</div><div className="adm-role">Gerente</div></div>}
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="main">

          {/* ── TOPBAR ── */}
          <div className="topbar">
            <div className="topbar-left">
              <button className="toggle-btn" onClick={()=>setSidebarOpen(!sidebarOpen)}>☰</button>
              <div className="page-title">{menuItems.find(m=>m.id===activeTab)?.label}</div>
            </div>
            <div className="topbar-right">
              <div className="date-badge">{new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'})}</div>
              <button className="notif-btn">🔔<span className="notif-dot"></span></button>
            </div>
          </div>

          <div className="content">

            {/* ══ DASHBOARD ══ */}
            {activeTab==='dashboard' && (
              <>
                <div className="kpi-grid">
                  {[
                    {label:'Faturamento Hoje', value:`R$ ${faturamentoHoje}`, icon:'💰', bg:'#fce4ec', sub:'↑ 12% vs ontem'},
                    {label:'Agendamentos',      value:mockAgendamentos.length, icon:'📅', bg:'#e8f5e9', sub:'Hoje'},
                    {label:'Em Atendimento',    value:mockAgendamentos.filter(a=>a.status==='em_atendimento').length, icon:'✂️', bg:'#fff3e0', sub:'Agora'},
                    {label:'Clientes Ativos',   value:mockClientes.length,     icon:'👥', bg:'#f3e5f5', sub:'Este mês'},
                  ].map(k=>(
                    <div key={k.label} className="kpi-card">
                      <div className="kpi-top"><div className="kpi-label">{k.label}</div><div className="kpi-icon" style={{background:k.bg}}>{k.icon}</div></div>
                      <div className="kpi-value">{k.value}</div>
                      <div className="kpi-sub">{k.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="sec-grid">
                  <div>
                    <div className="sec-card">
                      <div className="sec-head"><div className="sec-title">Agenda de Hoje</div><button className="sec-action" onClick={()=>setActiveTab('agenda')}>Ver tudo →</button></div>
                      <table className="tbl">
                        <thead><tr><th>Horário</th><th>Cliente</th><th>Serviço</th><th>Profissional</th><th>Status</th><th>Valor</th></tr></thead>
                        <tbody>
                          {mockAgendamentos.slice(0,5).map(a=>(
                            <tr key={a.id}>
                              <td style={{fontWeight:600,color:'#c2185b'}}>{a.horario}</td>
                              <td style={{fontWeight:600}}>{a.cliente}</td>
                              <td style={{color:'rgba(0,0,0,.6)'}}>{a.servico}</td>
                              <td>{a.profissional}</td>
                              <td><span className="badge" style={{background:statusConfig[a.status]?.bg,color:statusConfig[a.status]?.color}}>{statusConfig[a.status]?.label}</span></td>
                              <td style={{fontWeight:600}}>R$ {a.valor}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="side-panels">
                    <div className="sec-card">
                      <div className="sec-head"><div className="sec-title">Resumo do Dia</div></div>
                      {[
                        {label:'Ticket médio',      value:'R$ 59'},
                        {label:'Taxa de ocupação',  value:'78%'},
                        {label:'Cancelamentos',     value:'1'},
                        {label:'Faturamento mês',   value:'R$ 12.450'},
                        {label:'Novos clientes',    value:'3'},
                      ].map(s=>(
                        <div key={s.label} className="stat-item"><span className="stat-label">{s.label}</span><span className="stat-value">{s.value}</span></div>
                      ))}
                    </div>
                    <div className="sec-card">
                      <div className="sec-head"><div className="sec-title">Profissionais</div></div>
                      {mockProfissionais.map(p=>(
                        <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 22px',borderBottom:'1px solid rgba(233,30,99,.04)'}}>
                          <div className="prof-avatar" style={{width:36,height:36,fontSize:14,margin:0}}>{p.nome[0]}</div>
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
            {activeTab==='agenda' && (
              <div className="sec-card">
                <div className="sec-head">
                  <div className="sec-title">Agenda Completa</div>
                  <button className="btn-pink" style={{fontSize:10,padding:'8px 16px'}}>+ Novo Agendamento</button>
                </div>
                <table className="tbl">
                  <thead><tr><th>Horário</th><th>Cliente</th><th>Serviço</th><th>Profissional</th><th>Status</th><th>Valor</th><th>Ações</th></tr></thead>
                  <tbody>
                    {mockAgendamentos.map(a=>(
                      <tr key={a.id}>
                        <td style={{fontWeight:600,color:'#c2185b'}}>{a.horario}</td>
                        <td style={{fontWeight:600}}>{a.cliente}</td>
                        <td style={{color:'rgba(0,0,0,.6)'}}>{a.servico}</td>
                        <td>{a.profissional}</td>
                        <td><span className="badge" style={{background:statusConfig[a.status]?.bg,color:statusConfig[a.status]?.color}}>{statusConfig[a.status]?.label}</span></td>
                        <td style={{fontWeight:600}}>R$ {a.valor}</td>
                        <td><button className="btn-outline" style={{fontSize:9,padding:'5px 10px'}}>Editar</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ══ CLIENTES ══ */}
            {activeTab==='clientes' && (
              <div className="sec-card">
                <div className="sec-head">
                  <div className="sec-title">Clientes Cadastrados</div>
                  <button className="btn-pink" style={{fontSize:10,padding:'8px 16px'}}>+ Novo Cliente</button>
                </div>
                <div style={{padding:'18px 22px 0'}}>
                  <div className="search-wrap">
                    <span className="search-icon">🔍</span>
                    <input className="search-inp" placeholder="Buscar por nome ou telefone..." value={buscarCliente} onChange={e=>setBuscarCliente(e.target.value)}/>
                  </div>
                </div>
                <table className="tbl">
                  <thead><tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Visitas</th><th>Último Atend.</th><th>Total Gasto</th><th>Ações</th></tr></thead>
                  <tbody>
                    {clientesFiltrados.map(c=>(
                      <tr key={c.id}>
                        <td style={{fontWeight:600}}>{c.nome}</td>
                        <td style={{color:'rgba(0,0,0,.6)'}}>{c.telefone}</td>
                        <td style={{color:'rgba(0,0,0,.6)'}}>{c.email}</td>
                        <td style={{textAlign:'center'}}><span className="badge" style={{background:'#fce4ec',color:'#c2185b'}}>{c.visitas}x</span></td>
                        <td style={{color:'rgba(0,0,0,.5)',fontSize:12}}>{c.ultimo}</td>
                        <td style={{fontWeight:600,color:'#c2185b'}}>{c.gasto}</td>
                        <td><button className="btn-outline" style={{fontSize:9,padding:'5px 10px'}}>Ver</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ══ PROFISSIONAIS ══ */}
            {activeTab==='profissionais' && (
              <div className="sec-card">
                <div className="sec-head">
                  <div className="sec-title">Equipe de Profissionais</div>
                  <button className="btn-pink" style={{fontSize:10,padding:'8px 16px'}}>+ Novo Profissional</button>
                </div>
                <div className="prof-grid">
                  {mockProfissionais.map(p=>(
                    <div key={p.id} className="prof-card">
                      <div className="prof-avatar">{p.nome[0]}</div>
                      <div className="prof-name">{p.nome}</div>
                      <div className="prof-role">{p.especialidade}</div>
                      <span className="badge" style={{background:profStatusConfig[p.status]?.bg,color:profStatusConfig[p.status]?.color,marginBottom:12,display:'inline-block'}}>{profStatusConfig[p.status]?.label}</span>
                      <div className="prof-stats">
                        <div style={{textAlign:'center'}}><div className="prof-stat-val">{p.atendimentos}</div><div className="prof-stat-lbl">Atend.</div></div>
                        <div style={{textAlign:'center'}}><div className="prof-stat-val">{p.avaliacao}⭐</div><div className="prof-stat-lbl">Avaliação</div></div>
                        <div style={{textAlign:'center'}}><div className="prof-stat-val">{p.comissao}%</div><div className="prof-stat-lbl">Comissão</div></div>
                      </div>
                      <div className="prof-tags">{p.servicos.map(s=><span key={s} className="tag">{s}</span>)}</div>
                      <button className="btn-outline" style={{width:'100%'}}>Editar</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ SERVIÇOS ══ */}
            {activeTab==='servicos' && (
              <div className="sec-card">
                <div className="sec-head">
                  <div className="sec-title">Serviços Cadastrados</div>
                  <button className="btn-pink" style={{fontSize:10,padding:'8px 16px'}}>+ Novo Serviço</button>
                </div>
                <div className="serv-grid">
                  {mockServicos.map(s=>(
                    <div key={s.id} className="serv-card">
                      <div className="serv-cat">{s.categoria}</div>
                      <div className="serv-name">{s.nome}</div>
                      <div className="serv-price">R$ {s.preco}</div>
                      <div className="serv-dur">⏱ {s.duracao} minutos</div>
                      <div style={{marginTop:10,display:'flex',flexWrap:'wrap',gap:4}}>
                        {s.profissionais.map(p=><span key={p} className="tag">{p}</span>)}
                      </div>
                      <div style={{marginTop:14,display:'flex',gap:8}}>
                        <button className="btn-outline" style={{flex:1,fontSize:9,padding:'6px'}}>Editar</button>
                        <button className="btn-outline" style={{flex:1,fontSize:9,padding:'6px',color:'#c62828',borderColor:'rgba(198,40,40,.25)'}}>Remover</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ FINANCEIRO ══ */}
            {activeTab==='financeiro' && (
              <>
                <div className="kpi-grid" style={{marginBottom:22}}>
                  {[
                    {label:'Faturamento Hoje', value:`R$ ${mockFinanceiro.faturamentoHoje}`, icon:'💰', bg:'#fce4ec'},
                    {label:'Faturamento Mês',  value:`R$ ${mockFinanceiro.faturamentoMes.toLocaleString()}`, icon:'📈', bg:'#e8f5e9'},
                    {label:'Ticket Médio',     value:`R$ ${mockFinanceiro.ticketMedio}`, icon:'🎯', bg:'#fff3e0'},
                    {label:'Comissões',        value:`R$ ${mockFinanceiro.comissoes.toLocaleString()}`, icon:'🤝', bg:'#f3e5f5'},
                  ].map(k=>(
                    <div key={k.label} className="kpi-card">
                      <div className="kpi-top"><div className="kpi-label">{k.label}</div><div className="kpi-icon" style={{background:k.bg}}>{k.icon}</div></div>
                      <div className="kpi-value">{k.value}</div>
                    </div>
                  ))}
                </div>
                <div className="fin-grid">
                  <div className="sec-card">
                    <div className="sec-head"><div className="sec-title">Serviços Mais Vendidos</div></div>
                    <table className="tbl">
                      <thead><tr><th>Serviço</th><th>Qtd</th><th>Total</th></tr></thead>
                      <tbody>
                        {mockFinanceiro.servicos.map(s=>(
                          <tr key={s.nome}>
                            <td style={{fontWeight:600}}>{s.nome}</td>
                            <td><span className="badge" style={{background:'#fce4ec',color:'#c2185b'}}>{s.qtd}x</span></td>
                            <td style={{fontWeight:700,color:'#c2185b'}}>{s.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="sec-card">
                    <div className="sec-head"><div className="sec-title">Comissões da Equipe</div></div>
                    <table className="tbl">
                      <thead><tr><th>Profissional</th><th>%</th><th>Total</th></tr></thead>
                      <tbody>
                        {mockFinanceiro.comissoesProfissionais.map(c=>(
                          <tr key={c.nome}>
                            <td style={{fontWeight:600}}>{c.nome}</td>
                            <td><span className="badge" style={{background:'#f3e5f5',color:'#7b1fa2'}}>{c.pct}</span></td>
                            <td style={{fontWeight:700,color:'#c2185b'}}>{c.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ══ PROMOÇÕES ══ */}
            {activeTab==='promocoes' && (
              <div className="sec-card">
                <div className="sec-head">
                  <div className="sec-title">Promoções Ativas</div>
                  <button className="btn-pink" style={{fontSize:10,padding:'8px 16px'}}>+ Nova Promoção</button>
                </div>
                <div className="promo-grid">
                  {[
                    {tag:'Semanal',    title:'Terça da Barba',          desc:'Todo terça-feira, barba com 20% de desconto',       badge:'-20%'},
                    {tag:'Combo',      title:'Corte + Barba',            desc:'Combo completo por R$ 60 — economize R$ 10',        badge:'R$ 60'},
                    {tag:'Novos',      title:'Bem-vindo ao Salão',       desc:'10% de desconto na primeira visita',                badge:'-10%'},
                    {tag:'Fidelidade', title:'10ª Visita Grátis',        desc:'A cada 10 serviços, ganhe 1 grátis',                badge:'Grátis'},
                    {tag:'Especial',   title:'Aniversariante do Mês',    desc:'Desconto especial de 15% no mês do seu aniversário', badge:'-15%'},
                    {tag:'Cashback',   title:'Cashback 5%',              desc:'5% de volta em saldo para próxima visita',          badge:'5% back'},
                  ].map(p=>(
                    <div key={p.title} className="promo-card">
                      <div className="promo-tag">{p.tag}</div>
                      <div className="promo-title">{p.title}</div>
                      <div className="promo-desc">{p.desc}</div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <span className="promo-badge">{p.badge}</span>
                        <button className="btn-outline" style={{fontSize:9,padding:'5px 10px'}}>Editar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ CONFIGURAÇÕES ══ */}
            {activeTab==='configuracoes' && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:22}}>
                <div className="sec-card">
                  <div className="sec-head"><div className="sec-title">Dados do Salão</div></div>
                  <div className="form-sec">
                    <div className="form-row"><label className="form-lbl">Nome do Salão</label><input className="form-inp" value={salaoNome} onChange={e=>setSalaoNome(e.target.value)}/></div>
                    <div className="form-row"><label className="form-lbl">Telefone / WhatsApp</label><input className="form-inp" value={salaoTel} onChange={e=>setSalaoTel(e.target.value)}/></div>
                    <div className="form-row"><label className="form-lbl">Endereço</label><input className="form-inp" placeholder="Rua, número, bairro"/></div>
                    <div className="form-row"><label className="form-lbl">E-mail</label><input className="form-inp" placeholder="contato@salao.com"/></div>
                    <button className="btn-pink" onClick={handleSave}>Salvar Alterações</button>
                  </div>
                </div>
                <div className="sec-card">
                  <div className="sec-head"><div className="sec-title">Funcionamento</div></div>
                  <div className="form-sec">
                    <div className="form-row"><label className="form-lbl">Horário de Funcionamento</label><input className="form-inp" value={salaoHorario} onChange={e=>setSalaoHorario(e.target.value)}/></div>
                    <div className="form-row"><label className="form-lbl">Dias de Funcionamento</label>
                      <select className="form-sel">
                        <option>Segunda a Sábado</option>
                        <option>Segunda a Domingo</option>
                        <option>Terça a Sábado</option>
                      </select>
                    </div>
                    <div className="form-row"><label className="form-lbl">Intervalo entre Atendimentos</label>
                      <select className="form-sel">
                        <option>Sem intervalo</option>
                        <option>5 minutos</option>
                        <option>10 minutos</option>
                        <option>15 minutos</option>
                      </select>
                    </div>
                    <div className="form-row"><label className="form-lbl">Notificações</label>
                      <select className="form-sel">
                        <option>E-mail + WhatsApp</option>
                        <option>Apenas E-mail</option>
                        <option>Apenas WhatsApp</option>
                      </select>
                    </div>
                    <button className="btn-pink" onClick={handleSave}>Salvar Alterações</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {savedMsg && <div className="saved-toast">✓ Salvo com sucesso!</div>}
    </>
  )
}
