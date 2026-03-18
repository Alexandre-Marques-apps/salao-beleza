'use client'
import { useState } from 'react'

const ADMIN_USER = 'Alexandre'
const ADMIN_PASS = '123456'

const HORARIOS = ['08:00','08:15','08:30','08:45','09:00','09:15','09:30','09:45',
  '10:00','10:15','10:30','10:45','11:00','11:15','11:30','11:45','12:00','12:15',
  '12:30','12:45','13:00','13:15','13:30','13:45','14:00','14:15','14:30','14:45',
  '15:00','15:15','15:30','15:45','16:00','16:15','16:30','16:45','17:00','17:15',
  '17:30','17:45','18:00']

// Hoje no formato DD/MM/YYYY
function hojeStr() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}
function hojeISO() {
  const d = new Date()
  return d.toISOString().slice(0,10)
}
function parseData(dmy) {
  if(!dmy) return null
  const [dd,mm,yyyy] = dmy.split('/')
  return new Date(`${yyyy}-${mm}-${dd}`)
}
function isFuturo(data, horario) {
  const agora = new Date()
  const [dd,mm,yyyy] = data.split('/')
  const [hh,min] = (horario||'00:00').split(':')
  const dt = new Date(Number(yyyy), Number(mm)-1, Number(dd), Number(hh), Number(min))
  return dt > agora
}

const CATEGORIAS_SERVICO = {
  'Corte':      'cabelereiro',
  'Barba':      'cabelereiro',
  'Coloração':  'cabelereiro',
  'Tratamento': 'cabelereiro',
  'Unhas':      'manicure',
  'Estética':   'estetica',
}

const initialServicos = [
  { id:1, nome:'Corte Masculino', categoria:'Corte',      tipo:'cabelereiro', preco:40,  duracao:30 },
  { id:2, nome:'Corte Feminino',  categoria:'Corte',      tipo:'cabelereiro', preco:90,  duracao:60 },
  { id:3, nome:'Barba',           categoria:'Barba',      tipo:'cabelereiro', preco:30,  duracao:20 },
  { id:4, nome:'Escova',          categoria:'Tratamento', tipo:'cabelereiro', preco:60,  duracao:40 },
  { id:5, nome:'Manicure',        categoria:'Unhas',      tipo:'manicure',    preco:35,  duracao:30 },
  { id:6, nome:'Coloração',       categoria:'Coloração',  tipo:'cabelereiro', preco:150, duracao:90 },
  { id:7, nome:'Pedicure',        categoria:'Unhas',      tipo:'manicure',    preco:40,  duracao:40 },
]

const initialProfissionais = [
  { id:1, nome:'Ana',    especialidade:'Cabelereira', tipo:'cabelereiro', comissao:40, senha:'123456', status:'disponivel', horarioInicio:'08:00', horarioFim:'18:00' },
  { id:2, nome:'Carlos', especialidade:'Barbeiro',    tipo:'cabelereiro', comissao:35, senha:'123456', status:'disponivel', horarioInicio:'09:00', horarioFim:'17:00' },
  { id:3, nome:'Paula',  especialidade:'Manicure',    tipo:'manicure',    comissao:50, senha:'123456', status:'disponivel', horarioInicio:'09:00', horarioFim:'17:00' },
  { id:4, nome:'Carla',  especialidade:'Cabelereira', tipo:'cabelereiro', comissao:40, senha:'123456', status:'ausente',    horarioInicio:'08:00', horarioFim:'18:00' },
]

const initialClientes = [
  { id:1, nome:'Maria Silva',   telefone:'(11) 99999-0001', email:'maria@email.com',    visitas:12, ultimo:hojeStr(), gasto:1080 },
  { id:2, nome:'João Costa',    telefone:'(11) 99999-0002', email:'joao@email.com',     visitas:8,  ultimo:hojeStr(), gasto:320  },
  { id:3, nome:'Carla Mendes',  telefone:'(11) 99999-0003', email:'carla@email.com',    visitas:20, ultimo:hojeStr(), gasto:700  },
  { id:4, nome:'Pedro Alves',   telefone:'(11) 99999-0004', email:'pedro@email.com',    visitas:5,  ultimo:hojeStr(), gasto:200  },
  { id:5, nome:'Fernanda Lima', telefone:'(11) 99999-0005', email:'fernanda@email.com', visitas:15, ultimo:hojeStr(), gasto:900  },
]

const initialAgendamentos = [
  { id:1, cliente:'Maria Silva',   servico:'Corte Feminino',  profissional:'Ana',    data:hojeStr(), horario:'09:00', status:'confirmado',     valorOriginal:90,  valorCobrado:90,  pago:false },
  { id:2, cliente:'João Costa',    servico:'Barba',           profissional:'Carlos', data:hojeStr(), horario:'09:30', status:'agendado',       valorOriginal:30,  valorCobrado:30,  pago:false },
  { id:3, cliente:'Carla Mendes',  servico:'Manicure',        profissional:'Paula',  data:hojeStr(), horario:'10:00', status:'em_atendimento', valorOriginal:35,  valorCobrado:35,  pago:false },
  { id:4, cliente:'Pedro Alves',   servico:'Corte Masculino', profissional:'Carlos', data:hojeStr(), horario:'11:00', status:'agendado',       valorOriginal:40,  valorCobrado:40,  pago:false },
  { id:5, cliente:'Fernanda Lima', servico:'Escova',          profissional:'Ana',    data:hojeStr(), horario:'13:00', status:'agendado',       valorOriginal:60,  valorCobrado:60,  pago:false },
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
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:500,maxHeight:'92vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(233,30,99,.1)',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'#fff',zIndex:1}}>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:17}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:'rgba(0,0,0,.4)',lineHeight:1}}>×</button>
        </div>
        <div style={{padding:20}}>{children}</div>
      </div>
    </div>
  )
}

function Lbl({children}){return <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(194,24,91,.6)',marginBottom:6,marginTop:14}}>{children}</label>}
function Inp({value,onChange,type='text',placeholder,disabled}){return <input type={type} value={value||''} onChange={e=>onChange&&onChange(e.target.value)} placeholder={placeholder} disabled={disabled} style={{width:'100%',padding:'11px 13px',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',background:disabled?'#f5f5f5':'#fafafa',color:disabled?'#999':'#1a1a1a'}}/>}
function Sel({value,onChange,children}){return <select value={value||''} onChange={e=>onChange(e.target.value)} style={{width:'100%',padding:'11px 13px',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',background:'#fafafa'}}>{children}</select>}
function Alerta({cor,children}){const bgs={amarelo:'#fff8e1',vermelho:'#ffebee',verde:'#e8f5e9',azul:'#e3f2fd'};const cs={amarelo:'#f57c00',vermelho:'#c62828',verde:'#2e7d32',azul:'#0d47a1'};return <div style={{background:bgs[cor]||bgs.amarelo,color:cs[cor]||cs.amarelo,padding:'9px 13px',borderRadius:8,fontSize:12,marginTop:8}}>{children}</div>}

export default function AdminPanel() {
  const [loggedIn,     setLoggedIn]     = useState(false)
  const [loginUser,    setLoginUser]    = useState('')
  const [loginPass,    setLoginPass]    = useState('')
  const [loginErr,     setLoginErr]     = useState('')
  const [activeTab,    setActiveTab]    = useState('dashboard')
  const [sidebarOpen,  setSidebarOpen]  = useState(true)
  const [agendamentos, setAgendamentos] = useState(initialAgendamentos)
  const [clientes,     setClientes]     = useState(initialClientes)
  const [profissionais,setProfissionais]= useState(initialProfissionais)
  const [servicos,     setServicos]     = useState(initialServicos)
  const [busca,        setBusca]        = useState('')
  const [agendaData,   setAgendaData]   = useState(hojeStr())
  const [toast,        setToast]        = useState('')
  const [toastOk,      setToastOk]      = useState(true)
  const [modal,        setModal]        = useState(null)
  const [form,         setForm]         = useState({})
  const [formErr,      setFormErr]      = useState('')

  function showToast(msg, ok=true){ setToast(msg); setToastOk(ok); setTimeout(()=>setToast(''),3000) }
  function closeModal(){ setModal(null); setFormErr('') }
  function setF(k){ return v=>setForm(f=>({...f,[k]:v})) }

  function handleLogin(){
    if(loginUser===ADMIN_USER&&loginPass===ADMIN_PASS){ setLoggedIn(true); setLoginErr('') }
    else setLoginErr('Usuário ou senha incorretos')
  }

  // Ao selecionar serviço → guarda o preço internamente mas não exibe no form
  function onServicoChange(nome){
    const s = servicos.find(x=>x.nome===nome)
    setForm(f=>({...f, servico:nome, valorOriginal: s?s.preco:f.valorOriginal, valorCobrado: s?s.preco:f.valorCobrado, tipoServico: s?s.tipo:''}))
    setFormErr('')
  }

  // Valida compatibilidade serviço x profissional
  function validarCompatibilidade(nomeServico, nomeProf){
    const s = servicos.find(x=>x.nome===nomeServico)
    const p = profissionais.find(x=>x.nome===nomeProf)
    if(!s||!p) return null
    if(s.tipo!==p.tipo) return `⚠️ "${nomeProf}" é ${p.especialidade} e não realiza "${nomeServico}" (${s.categoria})`
    return null
  }

  // Valida data/hora futura
  function validarFuturo(data, horario){
    if(!data||!horario) return null
    if(!isFuturo(data, horario)) return '⚠️ Não é possível agendar em data/horário passado'
    return null
  }

  // Valida horário dentro do expediente do profissional
  function validarExpediente(nomeProf, horario){
    const p = profissionais.find(x=>x.nome===nomeProf)
    if(!p||!horario) return null
    if(horario < p.horarioInicio || horario > p.horarioFim)
      return `⚠️ Fora do expediente de ${nomeProf} (${p.horarioInicio}–${p.horarioFim})`
    return null
  }

  function saveAgendamento(){
    setFormErr('')
    if(!form.cliente||!form.servico||!form.profissional||!form.data||!form.horario){
      setFormErr('Preencha todos os campos obrigatórios'); return
    }
    const errFuturo = validarFuturo(form.data, form.horario)
    if(errFuturo){ setFormErr(errFuturo); return }
    const errComp = validarCompatibilidade(form.servico, form.profissional)
    if(errComp){ setFormErr(errComp); return }
    const errExp = validarExpediente(form.profissional, form.horario)
    if(errExp){ setFormErr(errExp); return }
    // verifica conflito de horário (mesmo profissional, mesma data e horário)
    const conflito = agendamentos.find(a=>
      a.profissional===form.profissional &&
      a.data===form.data &&
      a.horario===form.horario &&
      a.status!=='cancelado' &&
      a.id!==form.id
    )
    if(conflito){ setFormErr(`⚠️ ${form.profissional} já tem atendimento às ${form.horario}`); return }

    if(form.id){
      setAgendamentos(a=>a.map(x=>x.id===form.id?{...form}:x))
    } else {
      setAgendamentos(a=>[...a,{...form,id:Date.now(),pago:false}])
    }
    closeModal(); showToast('Agendamento salvo!')
  }

  // Fechar atendimento com confirmação de valor
  function abrirFechamento(ag){
    setForm({...ag, valorCobrado: ag.valorCobrado||ag.valorOriginal})
    setModal({type:'fechamento'})
    setFormErr('')
  }

  function confirmarFechamento(){
    if(!form.valorCobrado||Number(form.valorCobrado)<0){ setFormErr('Informe o valor cobrado'); return }
    setAgendamentos(a=>a.map(x=>x.id===form.id
      ? {...x, status:'finalizado', valorCobrado:Number(form.valorCobrado), pago:true,
         desconto: Number(form.valorOriginal)-Number(form.valorCobrado)>0
           ? Number(form.valorOriginal)-Number(form.valorCobrado) : 0 }
      : x
    ))
    // atualiza gasto do cliente
    setClientes(c=>c.map(x=>x.nome===form.cliente
      ? {...x, visitas:x.visitas+1, gasto:x.gasto+Number(form.valorCobrado), ultimo:form.data}
      : x
    ))
    closeModal(); showToast('Atendimento finalizado!')
  }

  function deleteAgendamento(id){ setAgendamentos(a=>a.filter(x=>x.id!==id)); showToast('Removido!') }

  function saveCliente(){
    if(!form.nome){ setFormErr('Informe o nome'); return }
    if(form.id){ setClientes(c=>c.map(x=>x.id===form.id?{...form}:x)) }
    else setClientes(c=>[...c,{...form,id:Date.now(),visitas:0,gasto:0,ultimo:'—'}])
    closeModal(); showToast('Cliente salvo!')
  }
  function deleteCliente(id){ setClientes(c=>c.filter(x=>x.id!==id)); showToast('Removido!') }

  function saveProfissional(){
    if(!form.nome){ setFormErr('Informe o nome'); return }
    if(form.id){ setProfissionais(p=>p.map(x=>x.id===form.id?{...form}:x)) }
    else setProfissionais(p=>[...p,{...form,id:Date.now(),senha:'123456'}])
    closeModal(); showToast('Profissional salvo!')
  }
  function deleteProfissional(id){ setProfissionais(p=>p.filter(x=>x.id!==id)); showToast('Removido!') }
  function resetSenha(id){ setProfissionais(p=>p.map(x=>x.id===id?{...x,senha:'123456'}:x)); showToast('Senha resetada para 123456!') }

  function saveServico(){
    if(!form.nome){ setFormErr('Informe o nome'); return }
    const tipo = CATEGORIAS_SERVICO[form.categoria]||'cabelereiro'
    if(form.id){ setServicos(s=>s.map(x=>x.id===form.id?{...form,tipo}:x)) }
    else setServicos(s=>[...s,{...form,id:Date.now(),tipo}])
    closeModal(); showToast('Serviço salvo!')
  }
  function deleteServico(id){ setServicos(s=>s.filter(x=>x.id!==id)); showToast('Removido!') }

  const clientesFiltrados = clientes.filter(c=>
    c.nome?.toLowerCase().includes(busca.toLowerCase())||c.telefone?.includes(busca)
  )

  // Agenda do dia filtrada — cancelados NÃO aparecem na grade (liberam espaço)
  const agendaHoje = agendamentos.filter(a=>a.data===agendaData&&a.status!=='cancelado')
  const agendaHojeComCancelados = agendamentos.filter(a=>a.data===agendaData)

  function getCelula(horario, nomeProfissional){
    return agendaHoje.find(a=>a.horario===horario&&a.profissional===nomeProfissional)
  }

  // Faturamento: considera valorCobrado dos finalizados
  const faturamentoHoje = agendamentos
    .filter(a=>a.data===hojeStr()&&a.status==='finalizado')
    .reduce((s,a)=>s+(Number(a.valorCobrado)||0),0)
  const faturamentoMes = agendamentos
    .filter(a=>a.status==='finalizado')
    .reduce((s,a)=>s+(Number(a.valorCobrado)||0),0)

  const menuItems = [
    {id:'dashboard',     icon:'⊞', label:'Dashboard'     },
    {id:'agenda',        icon:'◷', label:'Agenda'        },
    {id:'clientes',      icon:'◉', label:'Clientes'      },
    {id:'profissionais', icon:'✦', label:'Profissionais' },
    {id:'servicos',      icon:'✂', label:'Serviços'      },
    {id:'financeiro',    icon:'◎', label:'Financeiro'    },
    {id:'configuracoes', icon:'⊙', label:'Configurações' },
  ]

  // Serviços compatíveis com o profissional selecionado
  function servicosDoProf(nomeProf){
    const p = profissionais.find(x=>x.nome===nomeProf)
    if(!p) return servicos
    return servicos.filter(s=>s.tipo===p.tipo)
  }

  // Horários disponíveis para um profissional (dentro do expediente e futuros)
  function horariosDisponiveis(nomeProf, data){
    const p = profissionais.find(x=>x.nome===nomeProf)
    if(!p) return HORARIOS
    return HORARIOS.filter(h=>{
      if(h<p.horarioInicio||h>p.horarioFim) return false
      if(!isFuturo(data,h)) return false
      const ocupado = agendamentos.find(a=>a.profissional===nomeProf&&a.data===data&&a.horario===h&&a.status!=='cancelado'&&a.id!==form.id)
      return !ocupado
    })
  }

  // ── LOGIN ──────────────────────────────────────────────
  if(!loggedIn) return(
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
          <Lbl>Usuário</Lbl><Inp value={loginUser} onChange={setLoginUser} placeholder="Alexandre"/>
          <Lbl>Senha</Lbl><Inp type="password" value={loginPass} onChange={setLoginPass} placeholder="••••••"/>
          {loginErr&&<Alerta cor="vermelho">{loginErr}</Alerta>}
          <button onClick={handleLogin} style={{width:'100%',padding:16,background:'linear-gradient(135deg,#e91e63,#c2185b)',border:'none',borderRadius:12,fontFamily:'Montserrat,sans-serif',fontSize:11,fontWeight:600,letterSpacing:4,textTransform:'uppercase',color:'#fff',cursor:'pointer',marginTop:16}}>
            Entrar no Painel
          </button>
        </div>
      </div>
    </>
  )

  // ── PAINEL ─────────────────────────────────────────────
  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@300;400;500;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Montserrat',sans-serif;background:#fdf6f9;color:#1a1a1a;}
        .layout{display:flex;min-height:100vh;}
        .sb{width:${sidebarOpen?'226px':'62px'};background:linear-gradient(180deg,#c2185b,#880e4f);display:flex;flex-direction:column;transition:width .3s;overflow:hidden;flex-shrink:0;position:fixed;top:0;left:0;bottom:0;z-index:100;}
        .sb-hd{padding:20px 14px;border-bottom:1px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:10px;white-space:nowrap;}
        .sb-logo{width:32px;height:32px;flex-shrink:0;border-radius:50%;border:1.5px solid rgba(255,255,255,.6);display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:10px;font-weight:700;color:#fff;}
        .sb-nav{flex:1;padding:10px 0;overflow-y:auto;}
        .ni{display:flex;align-items:center;gap:11px;padding:11px 14px;cursor:pointer;white-space:nowrap;transition:background .2s;border-left:3px solid transparent;}
        .ni:hover{background:rgba(255,255,255,.08);}
        .ni.act{background:rgba(255,255,255,.15);border-left-color:#fff;}
        .ni-ic{font-size:14px;color:rgba(255,255,255,.65);flex-shrink:0;width:18px;text-align:center;}
        .ni.act .ni-ic,.ni.act .ni-lb{color:#fff;font-weight:600;}
        .ni-lb{font-size:12px;font-weight:500;color:rgba(255,255,255,.65);}
        .sb-ft{padding:12px 14px;border-top:1px solid rgba(255,255,255,.1);white-space:nowrap;display:flex;align-items:center;gap:10px;}
        .main{flex:1;margin-left:${sidebarOpen?'226px':'62px'};transition:margin-left .3s;display:flex;flex-direction:column;min-height:100vh;}
        .topbar{background:#fff;padding:12px 24px;display:'flex';align-items:center;justify-content:space-between;border-bottom:1px solid rgba(233,30,99,.08);position:sticky;top:0;z-index:50;display:flex;}
        .content{padding:22px;flex:1;}
        .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
        .kpi{background:#fff;border-radius:14px;padding:18px;border:1px solid rgba(233,30,99,.06);box-shadow:0 2px 8px rgba(233,30,99,.04);transition:transform .2s;}
        .kpi:hover{transform:translateY(-2px);}
        .sc{background:#fff;border-radius:14px;border:1px solid rgba(233,30,99,.06);box-shadow:0 2px 8px rgba(233,30,99,.04);overflow:hidden;margin-bottom:18px;}
        .sc-hd{padding:14px 20px;border-bottom:1px solid rgba(233,30,99,.06);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}
        .sc-title{font-family:'Playfair Display',serif;font-size:15px;}
        .tbl{width:100%;border-collapse:collapse;}
        .tbl th{padding:9px 16px;text-align:left;font-size:9px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(0,0,0,.3);border-bottom:1px solid rgba(233,30,99,.06);}
        .tbl td{padding:11px 16px;font-size:13px;border-bottom:1px solid rgba(233,30,99,.04);}
        .tbl tr:last-child td{border-bottom:none;}
        .tbl tr:hover td{background:#fdf6f9;}
        .bdg{padding:3px 8px;border-radius:20px;font-size:10px;font-weight:600;white-space:nowrap;}
        .btn-pk{padding:9px 16px;background:linear-gradient(135deg,#e91e63,#c2185b);border:none;border-radius:9px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#fff;cursor:pointer;}
        .btn-pk:hover{opacity:.88;}
        .btn-ot{padding:7px 11px;background:transparent;border:1.5px solid rgba(233,30,99,.25);border-radius:8px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;color:#e91e63;cursor:pointer;}
        .btn-ot:hover{border-color:#e91e63;background:#fdf6f9;}
        .btn-rd{padding:7px 11px;background:transparent;border:1.5px solid rgba(198,40,40,.25);border-radius:8px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;color:#c62828;cursor:pointer;}
        .btn-rd:hover{background:#ffebee;}
        .btn-bl{padding:7px 11px;background:transparent;border:1.5px solid rgba(13,71,161,.25);border-radius:8px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;color:#0d47a1;cursor:pointer;}
        .btn-bl:hover{background:#e3f2fd;}
        .btn-gr{padding:7px 11px;background:transparent;border:1.5px solid rgba(27,94,32,.25);border-radius:8px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;color:#1b5e20;cursor:pointer;}
        .btn-gr:hover{background:#e8f5e9;}
        .sw{position:relative;margin-bottom:14px;}
        .si{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:13px;color:rgba(233,30,99,.4);}
        .sinp{width:100%;padding:10px 10px 10px 34px;border:1.5px solid rgba(233,30,99,.15);border-radius:10px;font-family:'Montserrat',sans-serif;font-size:13px;outline:none;background:#fafafa;}
        .sinp:focus{border-color:#e91e63;}
        .prof-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px;padding:18px;}
        .pc{border:1px solid rgba(233,30,99,.1);border-radius:12px;padding:16px;text-align:center;transition:box-shadow .2s;}
        .pc:hover{box-shadow:0 4px 20px rgba(233,30,99,.1);}
        .svc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;padding:18px;}
        .svc{border:1px solid rgba(233,30,99,.1);border-radius:12px;padding:14px;}
        .svc:hover{box-shadow:0 3px 14px rgba(233,30,99,.1);}
        .fin-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
        .ag-wrap{overflow-x:auto;}
        .ag-tbl{border-collapse:collapse;min-width:100%;}
        .ag-tbl th{padding:9px 12px;background:#fce4ec;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c2185b;border:1px solid rgba(233,30,99,.12);text-align:center;white-space:nowrap;}
        .ag-tbl th.h-col{background:#fff3e0;color:#f57c00;min-width:68px;}
        .ag-tbl td{border:1px solid rgba(233,30,99,.07);padding:3px 5px;vertical-align:top;min-width:130px;height:36px;cursor:pointer;}
        .ag-tbl td:hover{background:#fdf6f9;}
        .ag-tbl td.h-cell{background:#fafafa;padding:7px 9px;font-size:12px;font-weight:600;color:#c2185b;text-align:center;cursor:default;min-width:68px;}
        .ag-tbl td.h-cell:hover{background:#fafafa;}
        .cell-it{background:linear-gradient(135deg,#fce4ec,#f8bbd0);border-radius:6px;padding:4px 6px;cursor:pointer;}
        .cell-it:hover{box-shadow:0 2px 8px rgba(233,30,99,.25);}
        .cell-nm{font-size:11px;font-weight:700;color:#c2185b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .cell-sv{font-size:10px;color:rgba(0,0,0,.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .tag{padding:3px 7px;background:#fce4ec;border-radius:10px;font-size:9px;font-weight:600;color:#c2185b;}
        .toast{position:fixed;bottom:22px;right:22px;padding:11px 20px;border-radius:10px;font-size:12px;font-weight:600;letter-spacing:1px;z-index:9999;color:#fff;}
        @media(max-width:1100px){.kpis{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:700px){.content{padding:12px}.topbar{padding:10px 12px}.fin-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sb">
          <div className="sb-hd">
            <div className="sb-logo">JOU</div>
            {sidebarOpen&&<div><div style={{fontFamily:'Playfair Display,serif',fontSize:13,fontWeight:700,color:'#fff',letterSpacing:2}}>JOUDAT</div><div style={{fontSize:8,letterSpacing:3,color:'rgba(255,255,255,.5)',textTransform:'uppercase'}}>Admin</div></div>}
          </div>
          <nav className="sb-nav">
            {menuItems.map(m=>(
              <div key={m.id} className={`ni${activeTab===m.id?' act':''}`} onClick={()=>{setActiveTab(m.id);setBusca('')}}>
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
              <button onClick={()=>setLoggedIn(false)} style={{padding:'6px 13px',background:'none',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:8,fontFamily:'Montserrat,sans-serif',fontSize:10,fontWeight:600,letterSpacing:2,color:'#c2185b',cursor:'pointer',textTransform:'uppercase'}}>Sair</button>
            </div>
          </div>

          <div className="content">

            {/* ══ DASHBOARD ══ */}
            {activeTab==='dashboard'&&(<>
              <div className="kpis">
                {[
                  {l:'Faturamento Hoje',v:`R$ ${faturamentoHoje}`,ic:'💰',bg:'#fce4ec'},
                  {l:'Agendamentos',    v:agendamentos.filter(a=>a.data===hojeStr()&&a.status!=='cancelado').length,ic:'📅',bg:'#e8f5e9'},
                  {l:'Em Atendimento', v:agendamentos.filter(a=>a.status==='em_atendimento').length,ic:'✂️',bg:'#fff3e0'},
                  {l:'Clientes',       v:clientes.length,ic:'👥',bg:'#f3e5f5'},
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
                  <div className="sc-hd"><div className="sc-title">Agenda de Hoje</div><button className="btn-ot" onClick={()=>setActiveTab('agenda')}>Ver Grade →</button></div>
                  <table className="tbl">
                    <thead><tr><th>Hora</th><th>Cliente</th><th>Serviço</th><th>Prof.</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody>{agendamentos.filter(a=>a.data===hojeStr()).map(a=>(
                      <tr key={a.id}>
                        <td style={{fontWeight:600,color:'#c2185b'}}>{a.horario}</td>
                        <td style={{fontWeight:600}}>{a.cliente}</td>
                        <td style={{color:'rgba(0,0,0,.6)',fontSize:12}}>{a.servico}</td>
                        <td>{a.profissional}</td>
                        <td><span className="bdg" style={{background:statusConfig[a.status]?.bg,color:statusConfig[a.status]?.color}}>{statusConfig[a.status]?.label}</span></td>
                        <td style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          {(a.status==='em_atendimento'||a.status==='confirmado')&&(
                            <button className="btn-gr" onClick={()=>abrirFechamento(a)}>✓ Fechar</button>
                          )}
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:18}}>
                  <div className="sc">
                    <div className="sc-hd"><div className="sc-title">Resumo</div></div>
                    {[{l:'Fat. hoje',v:`R$ ${faturamentoHoje}`},{l:'Fat. mês',v:`R$ ${faturamentoMes}`},{l:'Cancelamentos',v:agendamentos.filter(a=>a.status==='cancelado').length},{l:'Finalizados hoje',v:agendamentos.filter(a=>a.data===hojeStr()&&a.status==='finalizado').length}].map(s=>(
                      <div key={s.l} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 18px',borderBottom:'1px solid rgba(233,30,99,.04)'}}>
                        <span style={{fontSize:12,color:'rgba(0,0,0,.5)'}}>{s.l}</span><span style={{fontSize:14,fontWeight:700,color:'#c2185b'}}>{s.v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="sc">
                    <div className="sc-hd"><div className="sc-title">Equipe</div></div>
                    {profissionais.map(p=>(
                      <div key={p.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderBottom:'1px solid rgba(233,30,99,.04)'}}>
                        <div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,#f48fb1,#e91e63)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0}}>{p.nome[0]}</div>
                        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{p.nome}</div><div style={{fontSize:11,color:'rgba(0,0,0,.4)'}}>{p.horarioInicio}–{p.horarioFim}</div></div>
                        <span className="bdg" style={{background:profStatusConfig[p.status]?.bg,color:profStatusConfig[p.status]?.color}}>{profStatusConfig[p.status]?.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>)}

            {/* ══ AGENDA GRADE ══ */}
            {activeTab==='agenda'&&(<>
              <div className="sc">
                <div className="sc-hd">
                  <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                    <div className="sc-title">Grade de Agenda</div>
                    <input type="date" min={hojeISO()} value={agendaData.split('/').reverse().join('-')}
                      onChange={e=>{const[y,m,d]=e.target.value.split('-');setAgendaData(`${d}/${m}/${y}`)}}
                      style={{padding:'6px 10px',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:8,fontFamily:'Montserrat,sans-serif',fontSize:12,outline:'none',background:'#fafafa'}}/>
                  </div>
                  <button className="btn-pk" onClick={()=>{setForm({cliente:'',servico:'',profissional:'',data:agendaData,horario:'',status:'agendado',valorOriginal:'',valorCobrado:'',pago:false});setModal({type:'agendamento'});setFormErr('')}}>+ Novo Agendamento</button>
                </div>
                <div className="ag-wrap">
                  <table className="ag-tbl">
                    <thead>
                      <tr>
                        <th className="h-col">Horário</th>
                        {profissionais.map(p=>(
                          <th key={p.id}><div>{p.nome}</div><div style={{fontSize:9,fontWeight:400,opacity:.7}}>{p.especialidade} · {p.horarioInicio}–{p.horarioFim}</div></th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {HORARIOS.map(h=>(
                        <tr key={h}>
                          <td className="h-cell">{h}</td>
                          {profissionais.map(p=>{
                            const cel = getCelula(h, p.nome)
                            const dentroExp = h>=p.horarioInicio&&h<=p.horarioFim
                            const passado   = !isFuturo(agendaData, h)
                            // cinza: fora do expediente OU horário passado sem agendamento
                            const cinza     = !dentroExp || (passado && !cel)
                            const disponivel= dentroExp && !passado && !cel

                            // cor do card por status
                            const cardBg = cel?.status==='finalizado'
                              ? 'linear-gradient(135deg,#c8e6c9,#a5d6a7)'
                              : cel?.status==='cancelado'
                              ? 'linear-gradient(135deg,#ffcdd2,#ef9a9a)'
                              : 'linear-gradient(135deg,#fce4ec,#f8bbd0)'
                            const cardColor = cel?.status==='finalizado' ? '#1b5e20'
                              : cel?.status==='cancelado' ? '#b71c1c'
                              : '#c2185b'

                            return(
                              <td key={p.id}
                                style={{
                                  background: cinza ? '#f0f0f0' : undefined,
                                  cursor: disponivel ? 'pointer' : 'default',
                                  position: 'relative',
                                }}
                                onClick={()=>{
                                  if(!disponivel) return
                                  // abre modal com profissional e horário já preenchidos — não exibe campo profissional
                                  setForm({
                                    cliente:'', servico:'',
                                    profissional: p.nome,
                                    profissionalFixo: true,  // flag para esconder o campo no modal
                                    data: agendaData, horario: h,
                                    status:'agendado', valorOriginal:'', valorCobrado:'', pago:false
                                  })
                                  setModal({type:'agendamento'}); setFormErr('')
                                }}>

                                {/* ícone + em células disponíveis */}
                                {disponivel && (
                                  <div style={{width:'100%',height:'100%',minHeight:34,display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(233,30,99,.25)',fontSize:20,fontWeight:300}}>+</div>
                                )}

                                {/* cinza sem agendamento */}
                                {cinza && !cel && (
                                  <div style={{width:'100%',height:'100%',minHeight:34}}/>
                                )}

                                {/* card de agendamento */}
                                {cel&&(
                                  <div style={{background:cardBg,borderRadius:6,padding:'5px 6px 5px 6px',cursor:'pointer',position:'relative',minHeight:34}}
                                    onClick={e=>{e.stopPropagation();setForm({...cel,profissionalFixo:false});setModal({type:'agendamento'});setFormErr('')}}>
                                    <div style={{fontSize:11,fontWeight:700,color:cardColor,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',paddingRight:20}}>{cel.cliente}</div>
                                    <div style={{fontSize:10,color:'rgba(0,0,0,.55)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{cel.servico}</div>
                                    {cel.valorCobrado>0&&<div style={{fontSize:10,fontWeight:600,color:cardColor}}>R$ {cel.valorCobrado}</div>}
                                    <span style={{padding:'1px 5px',borderRadius:8,fontSize:9,fontWeight:600,background:statusConfig[cel.status]?.bg,color:statusConfig[cel.status]?.color,display:'inline-block',marginTop:2}}>{statusConfig[cel.status]?.label}</span>
                                    {/* LIXEIRA — sempre visível, canto superior direito */}
                                    <button
                                      onClick={e=>{e.stopPropagation();if(window.confirm('Excluir este agendamento?'))deleteAgendamento(cel.id)}}
                                      style={{position:'absolute',top:3,right:3,background:'rgba(198,40,40,.18)',border:'none',borderRadius:4,width:20,height:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#c62828',flexShrink:0}}
                                      title="Excluir">
                                      🗑
                                    </button>
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
                <div style={{padding:'10px 18px',borderTop:'1px solid rgba(233,30,99,.06)',display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
                  {Object.entries(statusConfig).map(([k,v])=>(
                    <div key={k} style={{display:'flex',alignItems:'center',gap:5}}>
                      <div style={{width:9,height:9,borderRadius:'50%',background:v.color}}></div>
                      <span style={{fontSize:11,color:'rgba(0,0,0,.45)'}}>{v.label}</span>
                    </div>
                  ))}
                  <div style={{fontSize:11,color:'rgba(0,0,0,.3)',marginLeft:'auto'}}>— = fora do expediente · Cancelados liberam o espaço</div>
                </div>
              </div>

              {/* LISTA */}
              <div className="sc">
                <div className="sc-hd"><div className="sc-title">Todos os agendamentos — {agendaData}</div></div>
                {agendaHojeComCancelados.length===0
                  ? <div style={{padding:24,textAlign:'center',color:'rgba(0,0,0,.3)',fontSize:13}}>Nenhum agendamento</div>
                  : <table className="tbl">
                      <thead><tr><th>Hora</th><th>Cliente</th><th>Serviço</th><th>Prof.</th><th>Status</th><th>Vlr orig.</th><th>Vlr cobrado</th><th>Ações</th></tr></thead>
                      <tbody>{agendaHojeComCancelados.map(a=>(
                        <tr key={a.id} style={{background:a.status==='finalizado'?'#f1f8e9':undefined}}>
                          <td style={{fontWeight:600,color:'#c2185b'}}>{a.horario}</td>
                          <td style={{fontWeight:600}}>{a.cliente}</td>
                          <td style={{fontSize:12,color:'rgba(0,0,0,.6)'}}>{a.servico}</td>
                          <td>{a.profissional}</td>
                          <td><span className="bdg" style={{background:statusConfig[a.status]?.bg,color:statusConfig[a.status]?.color}}>{statusConfig[a.status]?.label}</span></td>
                          <td style={{color:'rgba(0,0,0,.5)'}}>R$ {a.valorOriginal||'—'}</td>
                          <td style={{fontWeight:600,color:a.desconto>0?'#c62828':a.status==='finalizado'?'#2e7d32':'#c2185b'}}>
                            {a.valorCobrado>0?`R$ ${a.valorCobrado}`:'—'}
                            {a.desconto>0&&<span style={{fontSize:10,color:'#c62828',marginLeft:4}}>(-R${a.desconto})</span>}
                          </td>
                          <td style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
                            {a.status!=='finalizado'&&a.status!=='cancelado'&&(<>
                              {(a.status==='em_atendimento'||a.status==='confirmado')&&<button className="btn-gr" onClick={()=>abrirFechamento(a)}>✓ Fechar</button>}
                              <button className="btn-ot" onClick={()=>{setForm({...a});setModal({type:'agendamento'});setFormErr('')}}>Editar</button>
                            </>)}
                            <button className="btn-rd" style={{padding:'5px 8px'}} onClick={()=>deleteAgendamento(a.id)} title="Excluir">🗑</button>
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
                  <div className="sc-title">Clientes</div>
                  <button className="btn-pk" onClick={()=>{setForm({nome:'',telefone:'',email:''});setModal({type:'cliente'});setFormErr('')}}>+ Novo Cliente</button>
                </div>
                <div style={{padding:'14px 18px 0'}}>
                  <div className="sw"><span className="si">🔍</span><input className="sinp" placeholder="Buscar..." value={busca} onChange={e=>setBusca(e.target.value)}/></div>
                </div>
                <table className="tbl">
                  <thead><tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Visitas</th><th>Último</th><th>Total</th><th>Ações</th></tr></thead>
                  <tbody>{clientesFiltrados.map(c=>(
                    <tr key={c.id}>
                      <td style={{fontWeight:600}}>{c.nome}</td>
                      <td style={{color:'rgba(0,0,0,.6)'}}>{c.telefone}</td>
                      <td style={{fontSize:12,color:'rgba(0,0,0,.6)'}}>{c.email}</td>
                      <td><span className="bdg" style={{background:'#fce4ec',color:'#c2185b'}}>{c.visitas}x</span></td>
                      <td style={{fontSize:12,color:'rgba(0,0,0,.5)'}}>{c.ultimo}</td>
                      <td style={{fontWeight:600,color:'#c2185b'}}>R$ {c.gasto}</td>
                      <td style={{display:'flex',gap:5}}>
                        <button className="btn-ot" onClick={()=>{setForm({...c});setModal({type:'cliente'});setFormErr('')}}>Editar</button>
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
                  <div className="sc-title">Equipe</div>
                  <button className="btn-pk" onClick={()=>{setForm({nome:'',especialidade:'',tipo:'cabelereiro',comissao:'',status:'disponivel',horarioInicio:'08:00',horarioFim:'18:00'});setModal({type:'profissional'});setFormErr('')}}>+ Novo Profissional</button>
                </div>
                <div className="prof-grid">
                  {profissionais.map(p=>(
                    <div key={p.id} className="pc">
                      <div style={{width:50,height:50,borderRadius:'50%',background:'linear-gradient(135deg,#f48fb1,#e91e63)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:'#fff',margin:'0 auto 10px'}}>{p.nome[0]}</div>
                      <div style={{fontSize:14,fontWeight:600,marginBottom:3}}>{p.nome}</div>
                      <div style={{fontSize:11,color:'rgba(0,0,0,.4)',marginBottom:6,letterSpacing:1}}>{p.especialidade}</div>
                      <span className="bdg" style={{background:profStatusConfig[p.status]?.bg,color:profStatusConfig[p.status]?.color,marginBottom:8,display:'inline-block'}}>{profStatusConfig[p.status]?.label}</span>
                      <div style={{display:'flex',justifyContent:'center',gap:14,marginBottom:10}}>
                        <div style={{textAlign:'center'}}><div style={{fontSize:15,fontWeight:700,color:'#c2185b'}}>{p.comissao}%</div><div style={{fontSize:9,letterSpacing:2,color:'rgba(0,0,0,.35)',textTransform:'uppercase'}}>Comissão</div></div>
                        <div style={{textAlign:'center'}}><div style={{fontSize:12,fontWeight:700,color:'#c2185b'}}>{p.horarioInicio}–{p.horarioFim}</div><div style={{fontSize:9,letterSpacing:2,color:'rgba(0,0,0,.35)',textTransform:'uppercase'}}>Expediente</div></div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:6}}>
                        <button className="btn-ot" onClick={()=>{setForm({...p});setModal({type:'profissional'});setFormErr('')}}>✏️ Editar</button>
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
                  <div className="sc-title">Serviços</div>
                  <button className="btn-pk" onClick={()=>{setForm({nome:'',categoria:'Corte',preco:'',duracao:''});setModal({type:'servico'});setFormErr('')}}>+ Novo Serviço</button>
                </div>
                <div className="svc-grid">
                  {servicos.map(s=>(
                    <div key={s.id} className="svc">
                      <div style={{fontSize:9,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'#e91e63',marginBottom:4}}>{s.categoria}</div>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:3}}>{s.nome}</div>
                      <div style={{fontFamily:'Playfair Display,serif',fontSize:20,fontWeight:700,color:'#c2185b',marginBottom:3}}>R$ {s.preco}</div>
                      <div style={{fontSize:11,color:'rgba(0,0,0,.4)',marginBottom:6}}>⏱ {s.duracao} min</div>
                      <span className="bdg" style={{background:s.tipo==='manicure'?'#f3e5f5':'#e8f5e9',color:s.tipo==='manicure'?'#7b1fa2':'#2e7d32',marginBottom:10,display:'inline-block'}}>{s.tipo==='manicure'?'💅 Manicure':'✂️ Cabelereiro'}</span>
                      <div style={{display:'flex',gap:6}}>
                        <button className="btn-ot" style={{flex:1}} onClick={()=>{setForm({...s});setModal({type:'servico'});setFormErr('')}}>Editar</button>
                        <button className="btn-rd" onClick={()=>deleteServico(s.id)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ FINANCEIRO ══ */}
            {activeTab==='financeiro'&&(<>
              <div className="kpis" style={{marginBottom:18}}>
                {[
                  {l:'Faturamento Hoje',v:`R$ ${faturamentoHoje}`,ic:'💰',bg:'#fce4ec'},
                  {l:'Faturamento Mês', v:`R$ ${faturamentoMes}`, ic:'📈',bg:'#e8f5e9'},
                  {l:'Descontos',       v:`R$ ${agendamentos.filter(a=>a.status==='finalizado').reduce((s,a)=>s+(a.desconto||0),0)}`,ic:'🏷️',bg:'#fff3e0'},
                  {l:'Comissões',       v:`R$ ${profissionais.reduce((s,p)=>{const t=agendamentos.filter(a=>a.profissional===p.nome&&a.status==='finalizado').reduce((ss,a)=>ss+(Number(a.valorCobrado)||0),0);return s+Math.round(t*(p.comissao/100))},0)}`,ic:'🤝',bg:'#f3e5f5'},
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
                  <div className="sc-hd"><div className="sc-title">Atendimentos Finalizados</div></div>
                  <table className="tbl">
                    <thead><tr><th>Cliente</th><th>Serviço</th><th>Prof.</th><th>Vlr orig.</th><th>Vlr cobrado</th><th>Desconto</th></tr></thead>
                    <tbody>{agendamentos.filter(a=>a.status==='finalizado').map(a=>(
                      <tr key={a.id}>
                        <td style={{fontWeight:600}}>{a.cliente}</td>
                        <td style={{fontSize:12,color:'rgba(0,0,0,.6)'}}>{a.servico}</td>
                        <td>{a.profissional}</td>
                        <td style={{color:'rgba(0,0,0,.5)'}}>R$ {a.valorOriginal}</td>
                        <td style={{fontWeight:600,color:'#c2185b'}}>R$ {a.valorCobrado}</td>
                        <td style={{color:a.desconto>0?'#c62828':'rgba(0,0,0,.3)'}}>{a.desconto>0?`-R$ ${a.desconto}`:'—'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                <div className="sc">
                  <div className="sc-hd"><div className="sc-title">Comissões da Equipe</div></div>
                  <table className="tbl">
                    <thead><tr><th>Profissional</th><th>%</th><th>Base</th><th>Comissão</th></tr></thead>
                    <tbody>{profissionais.map(p=>{
                      const base=agendamentos.filter(a=>a.profissional===p.nome&&a.status==='finalizado').reduce((s,a)=>s+(Number(a.valorCobrado)||0),0)
                      return(<tr key={p.id}><td style={{fontWeight:600}}>{p.nome}</td><td><span className="bdg" style={{background:'#f3e5f5',color:'#7b1fa2'}}>{p.comissao}%</span></td><td>R$ {base}</td><td style={{fontWeight:700,color:'#c2185b'}}>R$ {Math.round(base*(p.comissao/100))}</td></tr>)
                    })}</tbody>
                  </table>
                </div>
              </div>
            </>)}

            {/* ══ CONFIGURAÇÕES ══ */}
            {activeTab==='configuracoes'&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
                {[{title:'Dados do Salão',fields:[{l:'Nome do Salão',ph:'Joudat Salon'},{l:'Telefone/WhatsApp',ph:'(11) 99999-0000'},{l:'Endereço',ph:'Rua, número, bairro'},{l:'E-mail',ph:'contato@salao.com'}]},{title:'Funcionamento',fields:[{l:'Horário padrão',ph:'09:00 – 19:00'},{l:'Dias',ph:'Segunda a Sábado'},{l:'Intervalo entre atend.',ph:'10 minutos'},{l:'Notificações',ph:'E-mail + WhatsApp'}]}].map(sec=>(
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

      {/* ══ MODAL AGENDAMENTO ══ */}
      {modal?.type==='agendamento'&&(
        <Modal title={form.id?'Editar Agendamento': form.profissionalFixo ? `Agendar — ${form.profissional} · ${form.data} · ${form.horario}` : 'Novo Agendamento'} onClose={closeModal}>

          {/* MODO EDIÇÃO — campos restritos */}
          {form.id ? (<>
            <Alerta cor="amarelo">
              ✏️ Na edição só é possível ajustar <strong>profissional, horário e status</strong>. Para alterar o serviço ou cliente, exclua este agendamento e crie um novo.
            </Alerta>
            <Lbl>Cliente (não editável)</Lbl>
            <Inp value={form.cliente||''} disabled/>
            <Lbl>Serviço (não editável)</Lbl>
            <Inp value={form.servico||''} disabled/>
            <Lbl>Profissional *</Lbl>
            <Sel value={form.profissional||''} onChange={v=>{
              const errComp = validarCompatibilidade(form.servico, v.split(' ')[0])
              if(errComp){ setFormErr(errComp); return }
              setF('profissional')(v); setFormErr('')
            }}>
              {profissionais.map(p=><option key={p.id}>{p.nome} ({p.especialidade})</option>)}
            </Sel>
            <Lbl>Data *</Lbl>
            <input type="date" min={hojeISO()} value={form.data?.split('/').reverse().join('-')||''}
              onChange={e=>{const[y,m,d]=e.target.value.split('-');setF('data')(`${d}/${m}/${y}`)}}
              style={{width:'100%',padding:'11px 13px',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',background:'#fafafa'}}/>
            <Lbl>Horário *</Lbl>
            <Sel value={form.horario||''} onChange={setF('horario')}>
              <option value="">Selecionar...</option>
              {horariosDisponiveis(form.profissional?.split(' ')[0], form.data).map(h=><option key={h}>{h}</option>)}
            </Sel>
            <Lbl>Status</Lbl>
            <Sel value={form.status||'agendado'} onChange={setF('status')}>
              {Object.entries(statusConfig).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </Sel>
          </>) : (<>
          {/* MODO NOVO AGENDAMENTO */}
            {form.profissionalFixo ? (<>
              {/* CLIQUE NA CÉLULA — ultra simples */}
              <div style={{background:'#fce4ec',borderRadius:10,padding:'12px 16px',marginBottom:4,display:'flex',gap:16,flexWrap:'wrap'}}>
                <div><div style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',color:'rgba(194,24,91,.5)',marginBottom:2}}>Profissional</div><div style={{fontSize:14,fontWeight:700,color:'#c2185b'}}>{form.profissional}</div></div>
                <div><div style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',color:'rgba(194,24,91,.5)',marginBottom:2}}>Data</div><div style={{fontSize:14,fontWeight:700,color:'#c2185b'}}>{form.data}</div></div>
                <div><div style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',color:'rgba(194,24,91,.5)',marginBottom:2}}>Horário</div><div style={{fontSize:14,fontWeight:700,color:'#c2185b'}}>{form.horario}</div></div>
              </div>
              <Lbl>Cliente *</Lbl>
              <Sel value={form.cliente||''} onChange={setF('cliente')}>
                <option value="">Selecionar cliente...</option>
                {clientes.map(c=><option key={c.id}>{c.nome}</option>)}
              </Sel>
              <Lbl>Serviço *</Lbl>
              <Sel value={form.servico||''} onChange={onServicoChange}>
                <option value="">Selecionar serviço...</option>
                {servicosDoProf(form.profissional?.split(' ')[0]||'').map(s=><option key={s.id}>{s.nome}</option>)}
              </Sel>
            </>) : (<>
              {/* BOTÃO NOVO AGENDAMENTO — todos os campos */}
              <Lbl>Cliente *</Lbl>
              <Sel value={form.cliente||''} onChange={setF('cliente')}>
                <option value="">Selecionar...</option>
                {clientes.map(c=><option key={c.id}>{c.nome}</option>)}
              </Sel>
              <Lbl>Profissional *</Lbl>
              <Sel value={form.profissional||''} onChange={v=>{setForm(f=>({...f,profissional:v,servico:'',valorOriginal:'',valorCobrado:''}));setFormErr('')}}>
                <option value="">Selecionar...</option>
                {profissionais.map(p=><option key={p.id}>{p.nome} ({p.especialidade})</option>)}
              </Sel>
              <Lbl>Serviço *{form.profissional&&<span style={{fontSize:10,color:'rgba(0,0,0,.4)',letterSpacing:0,textTransform:'none'}}> — compatível com {form.profissional.split(' ')[0]}</span>}</Lbl>
              <Sel value={form.servico||''} onChange={onServicoChange}>
                <option value="">Selecionar...</option>
                {servicosDoProf(form.profissional?.split(' ')[0]||'').map(s=><option key={s.id}>{s.nome}</option>)}
              </Sel>
              <Lbl>Data *</Lbl>
              <input type="date" min={hojeISO()} value={form.data?.split('/').reverse().join('-')||''}
                onChange={e=>{const[y,m,d]=e.target.value.split('-');setF('data')(`${d}/${m}/${y}`)}}
                style={{width:'100%',padding:'11px 13px',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',background:'#fafafa'}}/>
              <Lbl>Horário *{form.profissional&&form.data&&<span style={{fontSize:10,color:'rgba(0,0,0,.4)',letterSpacing:0,textTransform:'none'}}> — disponíveis para {form.profissional.split(' ')[0]}</span>}</Lbl>
              <Sel value={form.horario||''} onChange={setF('horario')}>
                <option value="">Selecionar...</option>
                {horariosDisponiveis(form.profissional?.split(' ')[0]||'', form.data||'').map(h=><option key={h}>{h}</option>)}
              </Sel>
            </>)}
          </>)}

          {formErr&&<Alerta cor="vermelho">{formErr}</Alerta>}
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button className="btn-pk" style={{flex:1}} onClick={saveAgendamento}>Salvar</button>
            <button className="btn-ot" onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL FECHAMENTO ══ */}
      {modal?.type==='fechamento'&&(
        <Modal title="✓ Fechar Atendimento" onClose={closeModal}>
          <div style={{background:'#e8f5e9',padding:'12px 16px',borderRadius:10,marginBottom:4}}>
            <div style={{fontSize:13,fontWeight:600,color:'#1b5e20',marginBottom:4}}>{form.cliente} — {form.servico}</div>
            <div style={{fontSize:12,color:'rgba(0,0,0,.6)'}}>Profissional: {form.profissional} · {form.data} às {form.horario}</div>
          </div>
          <Lbl>Valor original do serviço</Lbl>
          <Inp value={`R$ ${form.valorOriginal}`} disabled/>
          <Lbl>Valor cobrado (confirme ou ajuste se houver desconto) *</Lbl>
          <Inp type="number" value={form.valorCobrado||''} onChange={setF('valorCobrado')} placeholder="Valor recebido"/>
          {form.valorCobrado&&Number(form.valorCobrado)<Number(form.valorOriginal)&&(
            <Alerta cor="amarelo">⚠️ Desconto de R$ {Number(form.valorOriginal)-Number(form.valorCobrado)} aplicado. Este valor será registrado no financeiro.</Alerta>
          )}
          {form.valorCobrado&&Number(form.valorCobrado)>Number(form.valorOriginal)&&(
            <Alerta cor="azul">ℹ️ Valor acima do preço padrão. Certifique-se que está correto.</Alerta>
          )}
          <Lbl>Forma de pagamento</Lbl>
          <Sel value={form.formaPgto||'dinheiro'} onChange={setF('formaPgto')}>
            <option value="dinheiro">Dinheiro</option>
            <option value="pix">PIX</option>
            <option value="credito">Cartão de Crédito</option>
            <option value="debito">Cartão de Débito</option>
          </Sel>
          {formErr&&<Alerta cor="vermelho">{formErr}</Alerta>}
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button className="btn-pk" style={{flex:1,background:'linear-gradient(135deg,#2e7d32,#1b5e20)'}} onClick={confirmarFechamento}>✓ Confirmar Fechamento</button>
            <button className="btn-ot" onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL CLIENTE ══ */}
      {modal?.type==='cliente'&&(
        <Modal title={form.id?'Editar Cliente':'Novo Cliente'} onClose={closeModal}>
          <Lbl>Nome *</Lbl><Inp value={form.nome} onChange={setF('nome')} placeholder="Nome completo"/>
          <Lbl>Telefone</Lbl><Inp value={form.telefone} onChange={setF('telefone')} placeholder="(11) 99999-0000"/>
          <Lbl>E-mail</Lbl><Inp value={form.email} onChange={setF('email')} placeholder="cliente@email.com"/>
          {formErr&&<Alerta cor="vermelho">{formErr}</Alerta>}
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button className="btn-pk" style={{flex:1}} onClick={saveCliente}>Salvar</button>
            <button className="btn-ot" onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL PROFISSIONAL ══ */}
      {modal?.type==='profissional'&&(
        <Modal title={form.id?'Editar Profissional':'Novo Profissional'} onClose={closeModal}>
          <Lbl>Nome *</Lbl><Inp value={form.nome} onChange={setF('nome')} placeholder="Nome"/>
          <Lbl>Especialidade</Lbl><Inp value={form.especialidade} onChange={setF('especialidade')} placeholder="Ex: Cabelereira"/>
          <Lbl>Tipo de serviço</Lbl>
          <Sel value={form.tipo||'cabelereiro'} onChange={setF('tipo')}>
            <option value="cabelereiro">✂️ Cabelereiro / Barbeiro</option>
            <option value="manicure">💅 Manicure / Pedicure</option>
            <option value="estetica">🌿 Esteticista</option>
          </Sel>
          <Lbl>Comissão (%)</Lbl><Inp type="number" value={form.comissao} onChange={setF('comissao')} placeholder="40"/>
          <Lbl>Horário início do expediente</Lbl>
          <Sel value={form.horarioInicio||'08:00'} onChange={setF('horarioInicio')}>
            {HORARIOS.map(h=><option key={h}>{h}</option>)}
          </Sel>
          <Lbl>Horário fim do expediente</Lbl>
          <Sel value={form.horarioFim||'18:00'} onChange={setF('horarioFim')}>
            {HORARIOS.map(h=><option key={h}>{h}</option>)}
          </Sel>
          <Lbl>Status</Lbl>
          <Sel value={form.status||'disponivel'} onChange={setF('status')}>
            <option value="disponivel">Disponível</option>
            <option value="ocupado">Ocupado</option>
            <option value="ausente">Ausente</option>
          </Sel>
          {!form.id&&<Alerta cor="verde">🔑 Senha padrão: <strong>123456</strong></Alerta>}
          {formErr&&<Alerta cor="vermelho">{formErr}</Alerta>}
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button className="btn-pk" style={{flex:1}} onClick={saveProfissional}>Salvar</button>
            <button className="btn-ot" onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL SERVIÇO ══ */}
      {modal?.type==='servico'&&(
        <Modal title={form.id?'Editar Serviço':'Novo Serviço'} onClose={closeModal}>
          <Lbl>Nome *</Lbl><Inp value={form.nome} onChange={setF('nome')} placeholder="Ex: Corte Feminino"/>
          <Lbl>Categoria</Lbl>
          <Sel value={form.categoria||'Corte'} onChange={v=>{setF('categoria')(v);setForm(f=>({...f,categoria:v,tipo:CATEGORIAS_SERVICO[v]||'cabelereiro'}))}}>
            {Object.keys(CATEGORIAS_SERVICO).map(c=><option key={c}>{c}</option>)}
          </Sel>
          <div style={{background:'#f3e5f5',padding:'8px 12px',borderRadius:8,fontSize:12,color:'#7b1fa2',marginTop:8}}>
            Tipo automático: {CATEGORIAS_SERVICO[form.categoria]||'cabelereiro'} — apenas profissionais deste tipo poderão realizar este serviço.
          </div>
          <Lbl>Preço (R$)</Lbl><Inp type="number" value={form.preco} onChange={setF('preco')} placeholder="0"/>
          <Lbl>Duração (minutos)</Lbl><Inp type="number" value={form.duracao} onChange={setF('duracao')} placeholder="30"/>
          {formErr&&<Alerta cor="vermelho">{formErr}</Alerta>}
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button className="btn-pk" style={{flex:1}} onClick={saveServico}>Salvar</button>
            <button className="btn-ot" onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {toast&&<div className="toast" style={{background:toastOk?'#2e7d32':'#c62828'}}>{toast}</div>}
    </>
  )
}
