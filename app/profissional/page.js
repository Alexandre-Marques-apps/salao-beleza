'use client'
import { useState } from 'react'

// ── DADOS BASE ────────────────────────────────────────────
const PROFISSIONAIS_INIT = [
  { id:1, nome:'Ana',    senha:'123456', especialidade:'Cabelereira', tipo:'cabelereiro', comissao:40, horarioInicio:'08:00', horarioFim:'18:00' },
  { id:2, nome:'Carlos', senha:'123456', especialidade:'Barbeiro',    tipo:'cabelereiro', comissao:35, horarioInicio:'09:00', horarioFim:'17:00' },
  { id:3, nome:'Paula',  senha:'123456', especialidade:'Manicure',    tipo:'manicure',    comissao:50, horarioInicio:'09:00', horarioFim:'17:00' },
  { id:4, nome:'Carla',  senha:'123456', especialidade:'Cabelereira', tipo:'cabelereiro', comissao:40, horarioInicio:'08:00', horarioFim:'18:00' },
]

const HORARIOS = [
  '08:00','08:15','08:30','08:45','09:00','09:15','09:30','09:45',
  '10:00','10:15','10:30','10:45','11:00','11:15','11:30','11:45',
  '12:00','12:15','12:30','12:45','13:00','13:15','13:30','13:45',
  '14:00','14:15','14:30','14:45','15:00','15:15','15:30','15:45',
  '16:00','16:15','16:30','16:45','17:00','17:15','17:30','17:45','18:00',
]

function hojeStr() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}
function hojeISO() {
  return new Date().toISOString().slice(0,10)
}
function isFuturo(data, horario) {
  if(!data||!horario) return false
  const [dd,mm,yyyy] = data.split('/')
  const [hh,min] = horario.split(':')
  return new Date(Number(yyyy),Number(mm)-1,Number(dd),Number(hh),Number(min)) > new Date()
}

const AGENDAMENTOS_INIT = [
  { id:1,  profissional:'Ana',    cliente:'Maria Silva',   servico:'Corte Feminino',  data:hojeStr(), horario:'09:00', status:'confirmado',     valorOriginal:90,  valorCobrado:90,  pago:false, desconto:0 },
  { id:2,  profissional:'Carlos', cliente:'João Costa',    servico:'Barba',           data:hojeStr(), horario:'09:30', status:'em_atendimento', valorOriginal:30,  valorCobrado:30,  pago:false, desconto:0 },
  { id:3,  profissional:'Paula',  cliente:'Carla Mendes',  servico:'Manicure',        data:hojeStr(), horario:'10:00', status:'em_atendimento', valorOriginal:35,  valorCobrado:35,  pago:false, desconto:0 },
  { id:4,  profissional:'Carlos', cliente:'Pedro Alves',   servico:'Corte Masculino', data:hojeStr(), horario:'11:00', status:'agendado',       valorOriginal:40,  valorCobrado:40,  pago:false, desconto:0 },
  { id:5,  profissional:'Ana',    cliente:'Fernanda Lima', servico:'Escova',          data:hojeStr(), horario:'13:00', status:'agendado',       valorOriginal:60,  valorCobrado:60,  pago:false, desconto:0 },
  { id:6,  profissional:'Carlos', cliente:'Lucas Rocha',   servico:'Corte Masculino', data:hojeStr(), horario:'14:00', status:'finalizado',     valorOriginal:40,  valorCobrado:40,  pago:true,  desconto:0 },
  { id:7,  profissional:'Ana',    cliente:'Beatriz Souza', servico:'Coloração',       data:'19/03/2025', horario:'10:00', status:'agendado',    valorOriginal:150, valorCobrado:150, pago:false, desconto:0 },
  { id:8,  profissional:'Carlos', cliente:'Roberto Lima',  servico:'Barba',           data:'19/03/2025', horario:'11:00', status:'agendado',    valorOriginal:30,  valorCobrado:30,  pago:false, desconto:0 },
  { id:9,  profissional:'Ana',    cliente:'Luciana Melo',  servico:'Corte Feminino',  data:'19/03/2025', horario:'14:00', status:'agendado',    valorOriginal:90,  valorCobrado:90,  pago:false, desconto:0 },
  { id:10, profissional:'Paula',  cliente:'Tatiana Alves', servico:'Manicure',        data:'20/03/2025', horario:'09:00', status:'agendado',    valorOriginal:35,  valorCobrado:35,  pago:false, desconto:0 },
  { id:11, profissional:'Carlos', cliente:'Felipe Costa',  servico:'Barba',           data:'20/03/2025', horario:'10:30', status:'agendado',    valorOriginal:30,  valorCobrado:30,  pago:false, desconto:0 },
  { id:12, profissional:'Ana',    cliente:'Renata Lima',   servico:'Escova',          data:'20/03/2025', horario:'15:00', status:'agendado',    valorOriginal:60,  valorCobrado:60,  pago:false, desconto:0 },
  { id:13, profissional:'Ana',    cliente:'Cliente A',     servico:'Coloração',       data:'05/03/2025', horario:'10:00', status:'finalizado',  valorOriginal:150, valorCobrado:140, pago:true,  desconto:10 },
  { id:14, profissional:'Ana',    cliente:'Cliente B',     servico:'Corte Feminino',  data:'07/03/2025', horario:'11:00', status:'finalizado',  valorOriginal:90,  valorCobrado:90,  pago:true,  desconto:0 },
  { id:15, profissional:'Carlos', cliente:'Cliente C',     servico:'Barba',           data:'06/03/2025', horario:'09:00', status:'finalizado',  valorOriginal:30,  valorCobrado:30,  pago:true,  desconto:0 },
  { id:16, profissional:'Carlos', cliente:'Cliente D',     servico:'Corte Masculino', data:'08/03/2025', horario:'14:00', status:'finalizado',  valorOriginal:40,  valorCobrado:40,  pago:true,  desconto:0 },
  { id:17, profissional:'Paula',  cliente:'Cliente E',     servico:'Manicure',        data:'04/03/2025', horario:'10:00', status:'finalizado',  valorOriginal:35,  valorCobrado:35,  pago:true,  desconto:0 },
]

const statusConfig = {
  agendado:       { label:'Agendado',       bg:'#fff3e0', color:'#f57c00' },
  confirmado:     { label:'Confirmado',     bg:'#e8f5e9', color:'#2e7d32' },
  em_atendimento: { label:'Em Atendimento', bg:'#fce4ec', color:'#c2185b' },
  finalizado:     { label:'Finalizado',     bg:'#f3e5f5', color:'#7b1fa2' },
  cancelado:      { label:'Cancelado',      bg:'#ffebee', color:'#c62828' },
}

// ── MODAL ─────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:460,maxHeight:'92vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(233,30,99,.1)',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'#fff',zIndex:1}}>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:17}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:'rgba(0,0,0,.4)',lineHeight:1}}>×</button>
        </div>
        <div style={{padding:20}}>{children}</div>
      </div>
    </div>
  )
}

// ── ESTILOS REUTILIZÁVEIS ─────────────────────────────────
const ST = {
  lbl: {display:'block',fontSize:10,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(194,24,91,.6)',marginBottom:6,marginTop:14},
  inp: {width:'100%',padding:'11px 13px',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',background:'#fafafa',color:'#1a1a1a'},
  inpD:{width:'100%',padding:'11px 13px',border:'1.5px solid rgba(233,30,99,.1)',borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',background:'#f5f5f5',color:'#999'},
  sel: {width:'100%',padding:'11px 13px',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',background:'#fafafa',color:'#1a1a1a'},
  pk:  {padding:'10px 20px',background:'linear-gradient(135deg,#e91e63,#c2185b)',border:'none',borderRadius:9,fontFamily:'Montserrat,sans-serif',fontSize:10,fontWeight:600,letterSpacing:2,textTransform:'uppercase',color:'#fff',cursor:'pointer'},
  ot:  {padding:'8px 14px',background:'transparent',border:'1.5px solid rgba(233,30,99,.25)',borderRadius:8,fontFamily:'Montserrat,sans-serif',fontSize:10,fontWeight:600,color:'#e91e63',cursor:'pointer'},
  gr:  {padding:'8px 14px',background:'transparent',border:'1.5px solid rgba(27,94,32,.3)',borderRadius:8,fontFamily:'Montserrat,sans-serif',fontSize:10,fontWeight:600,color:'#1b5e20',cursor:'pointer'},
  card:{background:'#fff',borderRadius:14,border:'1px solid rgba(233,30,99,.06)',boxShadow:'0 2px 8px rgba(233,30,99,.04)',overflow:'hidden',marginBottom:16},
  hd:  {padding:'14px 20px',borderBottom:'1px solid rgba(233,30,99,.06)',display:'flex',alignItems:'center',justifyContent:'space-between'},
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────
export default function ProfissionalPanel() {
  const [profissionais, setProfissionais] = useState(PROFISSIONAIS_INIT)
  const [agendamentos,  setAgendamentos]  = useState(AGENDAMENTOS_INIT)

  // AUTH
  const [loggedIn,   setLoggedIn]   = useState(false)
  const [prof,       setProf]       = useState(null)
  const [loginNome,  setLoginNome]  = useState('')
  const [loginSenha, setLoginSenha] = useState('')
  const [loginErr,   setLoginErr]   = useState('')

  // NAV
  const [activeTab, setActiveTab] = useState('hoje')

  // MODALS
  const [modal,    setModal]    = useState(null)
  const [form,     setForm]     = useState({})
  const [formErr,  setFormErr]  = useState('')

  // PERFIL EDIT
  const [editandoPerfil, setEditandoPerfil] = useState(false)
  const [perfilForm,     setPerfilForm]     = useState({})

  // TOAST
  const [toast,   setToast]   = useState('')
  const [toastOk, setToastOk] = useState(true)
  function showToast(msg, ok=true){ setToast(msg); setToastOk(ok); setTimeout(()=>setToast(''),3000) }

  function setF(k){ return v=>setForm(f=>({...f,[k]:v})) }
  function closeModal(){ setModal(null); setFormErr('') }

  // ── LOGIN ──────────────────────────────────────────────
  function handleLogin() {
    if(!loginNome){ setLoginErr('Selecione seu nome'); return }
    if(!loginSenha){ setLoginErr('Digite sua senha'); return }
    const found = profissionais.find(p =>
      p.nome.toLowerCase() === loginNome.toLowerCase() &&
      p.senha === loginSenha
    )
    if(found){
      setProf({...found})
      setLoggedIn(true)
      setLoginErr('')
    } else {
      setLoginErr('Nome ou senha incorretos. Senha padrão: 123456')
    }
  }

  // ── FILTROS DE AGENDAMENTOS ────────────────────────────
  const meus     = prof ? agendamentos.filter(a => a.profissional === prof.nome) : []
  const hoje     = meus.filter(a => a.data === hojeStr() && a.status !== 'cancelado')
  const proximos = meus.filter(a => {
    if(a.status === 'cancelado' || a.status === 'finalizado') return false
    if(a.data === hojeStr()) return false
    return isFuturo(a.data, a.horario)
  })
  const historico = meus.filter(a => a.status === 'finalizado')

  // ── RENDIMENTOS ────────────────────────────────────────
  const mesAtual     = new Date().getMonth()
  const anoAtual     = new Date().getFullYear()

  function getMesAno(dmy){
    if(!dmy) return null
    const [dd,mm,yyyy] = dmy.split('/')
    return { mes: Number(mm)-1, ano: Number(yyyy) }
  }

  const histMes  = historico.filter(a => {
    const ma = getMesAno(a.data)
    return ma && ma.mes === mesAtual && ma.ano === anoAtual
  })

  const fatHoje  = hoje.filter(a=>a.status==='finalizado').reduce((s,a)=>s+(Number(a.valorCobrado)||0),0)
  const comHoje  = prof ? Math.round(fatHoje*(prof.comissao/100)) : 0

  const fatMes   = histMes.reduce((s,a)=>s+(Number(a.valorCobrado)||0),0)
  const comMes   = prof ? Math.round(fatMes*(prof.comissao/100)) : 0

  const fatTotal = historico.reduce((s,a)=>s+(Number(a.valorCobrado)||0),0)
  const comTotal = prof ? Math.round(fatTotal*(prof.comissao/100)) : 0

  const atendHoje     = hoje.length
  const finalizadosHoje = hoje.filter(a=>a.status==='finalizado').length

  // ── FINALIZAR ATENDIMENTO (profissional) ────────────────
  function abrirFinalizar(ag){
    setForm({...ag, valorCobrado: ag.valorCobrado || ag.valorOriginal})
    setModal({type:'finalizar'})
    setFormErr('')
  }

  function confirmarFinalizar(){
    if(!form.valorCobrado||Number(form.valorCobrado)<0){ setFormErr('Informe o valor cobrado'); return }
    setAgendamentos(a=>a.map(x=>x.id===form.id
      ? {...x,
          status:'finalizado',
          valorCobrado: Number(form.valorCobrado),
          pago: true,
          desconto: Math.max(0, Number(form.valorOriginal)-Number(form.valorCobrado))
        }
      : x
    ))
    // Atualiza prof no estado local para refletir rendimentos
    closeModal()
    showToast('✓ Atendimento finalizado!')
  }

  // ── EDITAR AGENDAMENTO (só os seus, sem alterar valor) ──
  function abrirEditar(ag){
    setForm({...ag})
    setModal({type:'editar'})
    setFormErr('')
  }

  function salvarEdicao(){
    const original = agendamentos.find(a=>a.id===form.id)
    if(!original){ showToast('Agendamento não encontrado',false); return }
    if(original.profissional !== prof.nome){
      showToast('❌ Você não pode editar agendamentos de outros profissionais',false)
      closeModal(); return
    }
    if(Number(form.valorCobrado) !== Number(original.valorCobrado) ||
       Number(form.valorOriginal) !== Number(original.valorOriginal)){
      setFormErr('❌ O valor não pode ser alterado — somente o administrador pode fazer isso')
      return
    }
    setAgendamentos(a=>a.map(x=>x.id===form.id ? {...form} : x))
    closeModal()
    showToast('Agendamento atualizado!')
  }

  // ── EDITAR PERFIL ──────────────────────────────────────
  function abrirPerfil(){
    setPerfilForm({...prof})
    setEditandoPerfil(true)
  }

  function salvarPerfil(){
    if(!perfilForm.senhaAtual){ showToast('Digite sua senha atual',false); return }
    if(perfilForm.senhaAtual !== prof.senha){ showToast('Senha atual incorreta',false); return }
    const atualizado = {
      ...prof,
      horarioInicio: perfilForm.horarioInicio,
      horarioFim:    perfilForm.horarioFim,
      ...(perfilForm.novaSenha ? { senha: perfilForm.novaSenha } : {}),
    }
    setProfissionais(p=>p.map(x=>x.id===prof.id ? atualizado : x))
    setProf(atualizado)
    setEditandoPerfil(false)
    showToast('Perfil atualizado!')
  }

  // ── CARD DE AGENDAMENTO ────────────────────────────────
  function AgCard({ a, mostrarBotoes=false }) {
    return (
      <div style={{display:'flex',alignItems:'center',gap:14,padding:'13px 0',borderBottom:'1px solid rgba(233,30,99,.06)'}}>
        <div style={{textAlign:'center',minWidth:68,background:'#fce4ec',borderRadius:10,padding:'7px 4px',flexShrink:0}}>
          <div style={{fontSize:10,color:'#c2185b',fontWeight:600,letterSpacing:1}}>{a.data.slice(0,5)}</div>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:700,color:'#c2185b'}}>{a.horario}</div>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:600,color:'#1a1a1a',marginBottom:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.cliente}</div>
          <div style={{fontSize:12,color:'rgba(0,0,0,.5)'}}>{a.servico}</div>
        </div>
        <div style={{textAlign:'right',flexShrink:0}}>
          <div style={{fontSize:14,fontWeight:700,color:'#c2185b',marginBottom:4}}>R$ {a.valorCobrado}</div>
          <span style={{padding:'3px 8px',borderRadius:20,fontSize:10,fontWeight:600,background:statusConfig[a.status]?.bg,color:statusConfig[a.status]?.color}}>{statusConfig[a.status]?.label}</span>
        </div>
        {mostrarBotoes&&(
          <div style={{display:'flex',flexDirection:'column',gap:5,flexShrink:0}}>
            {(a.status==='em_atendimento'||a.status==='confirmado'||a.status==='agendado')&&(
              <button style={ST.gr} onClick={()=>abrirFinalizar(a)}>✓ Finalizar</button>
            )}
            {a.status!=='finalizado'&&a.status!=='cancelado'&&(
              <button style={ST.ot} onClick={()=>abrirEditar(a)}>✏️ Editar</button>
            )}
          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────
  // ── LOGIN SCREEN ──────────────────────────────────────
  // ─────────────────────────────────────────────────────
  if(!loggedIn) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@300;400;500;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Montserrat',sans-serif;background:linear-gradient(160deg,#fce4ec 0%,#fdf6f9 60%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}
      `}</style>
      <div style={{background:'#fff',borderRadius:24,width:'100%',maxWidth:420,overflow:'hidden',boxShadow:'0 8px 40px rgba(233,30,99,.12)'}}>
        {/* Header */}
        <div style={{background:'linear-gradient(160deg,#fce4ec,#fdf6f9)',padding:'40px 32px 28px',textAlign:'center',borderBottom:'1px solid rgba(233,30,99,.08)'}}>
          <div style={{width:66,height:66,borderRadius:'50%',border:'2px solid #e91e63',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',background:'#fff'}}>
            <span style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:700,color:'#e91e63'}}>JOU</span>
          </div>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:26,fontWeight:700,color:'#c2185b',letterSpacing:3}}>JOUDAT SALON</div>
          <div style={{fontSize:10,letterSpacing:4,color:'rgba(194,24,91,.5)',textTransform:'uppercase',marginTop:6}}>Área do Profissional</div>
        </div>

        {/* Form */}
        <div style={{padding:32}}>
          <label style={ST.lbl}>Selecione seu nome</label>
          <select
            value={loginNome}
            onChange={e=>{ setLoginNome(e.target.value); setLoginErr('') }}
            style={ST.sel}
          >
            <option value="">— Selecione —</option>
            {profissionais.map(p=>(
              <option key={p.id} value={p.nome}>{p.nome} — {p.especialidade}</option>
            ))}
          </select>

          <label style={ST.lbl}>Senha</label>
          <input
            type="password"
            value={loginSenha}
            onChange={e=>{ setLoginSenha(e.target.value); setLoginErr('') }}
            onKeyDown={e=>e.key==='Enter'&&handleLogin()}
            placeholder="Digite sua senha"
            style={ST.inp}
          />

          {loginErr&&(
            <div style={{background:'#ffebee',color:'#c62828',padding:'10px 14px',borderRadius:8,fontSize:12,margin:'12px 0',textAlign:'center'}}>
              {loginErr}
            </div>
          )}

          <button
            onClick={handleLogin}
            style={{...ST.pk,width:'100%',padding:16,fontSize:11,letterSpacing:4,marginTop:16}}
          >
            Acessar Minha Área
          </button>

          <div style={{textAlign:'center',marginTop:14,fontSize:11,color:'rgba(0,0,0,.3)',letterSpacing:1}}>
            Senha padrão: <strong>123456</strong>
          </div>
        </div>
      </div>
    </>
  )

  // ─────────────────────────────────────────────────────
  // ── PAINEL DO PROFISSIONAL ────────────────────────────
  // ─────────────────────────────────────────────────────
  const tabs = [
    {id:'hoje',        label:'Hoje',       icon:'📅'},
    {id:'proximos',    label:'Próximos',   icon:'🗓'},
    {id:'historico',   label:'Histórico',  icon:'📋'},
    {id:'rendimentos', label:'Rendimentos',icon:'💰'},
    {id:'perfil',      label:'Meu Perfil', icon:'👤'},
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@300;400;500;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Montserrat',sans-serif;background:linear-gradient(160deg,#fce4ec 0%,#fdf6f9 60%);min-height:100vh;}
        .toast-box{position:fixed;bottom:22px;right:22px;padding:11px 20px;border-radius:10px;font-size:12px;font-weight:600;letter-spacing:1px;z-index:9999;color:#fff;}
      `}</style>

      <div style={{maxWidth:800,margin:'0 auto',padding:'20px 14px'}}>

        {/* HEADER */}
        <div style={{background:'#fff',borderRadius:18,padding:'18px 22px',marginBottom:16,boxShadow:'0 4px 16px rgba(233,30,99,.08)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:46,height:46,borderRadius:'50%',background:'linear-gradient(135deg,#f48fb1,#e91e63)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:'#fff',flexShrink:0}}>
              {prof.nome[0]}
            </div>
            <div>
              <div style={{fontFamily:'Playfair Display,serif',fontSize:19}}>Olá, {prof.nome}!</div>
              <div style={{fontSize:10,color:'rgba(0,0,0,.4)',letterSpacing:2,textTransform:'uppercase'}}>
                {prof.especialidade} · {prof.comissao}% comissão · {prof.horarioInicio}–{prof.horarioFim}
              </div>
            </div>
          </div>
          <button onClick={()=>setLoggedIn(false)} style={{...ST.ot,fontSize:10,letterSpacing:2}}>Sair</button>
        </div>

        {/* KPI CARDS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
          {[
            {l:'Agendamentos Hoje', v:atendHoje,        ic:'📅', bg:'#fce4ec'},
            {l:'Finalizados Hoje',  v:finalizadosHoje,  ic:'✅', bg:'#e8f5e9'},
            {l:'Comissão Hoje',     v:`R$ ${comHoje}`,  ic:'💰', bg:'#fff3e0'},
          ].map(k=>(
            <div key={k.l} style={{background:'#fff',borderRadius:13,padding:16,border:'1px solid rgba(233,30,99,.06)',boxShadow:'0 2px 8px rgba(233,30,99,.04)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div style={{fontSize:9,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(0,0,0,.35)'}}>{k.l}</div>
                <div style={{width:30,height:30,borderRadius:8,background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>{k.ic}</div>
              </div>
              <div style={{fontFamily:'Playfair Display,serif',fontSize:22,fontWeight:700,color:'#1a1a1a'}}>{k.v}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={ST.card}>
          {/* Tab Headers */}
          <div style={{display:'flex',borderBottom:'1px solid rgba(233,30,99,.08)',overflowX:'auto'}}>
            {tabs.map(t=>(
              <button
                key={t.id}
                onClick={()=>setActiveTab(t.id)}
                style={{
                  flexShrink:0,padding:'13px 10px',background:'none',border:'none',
                  borderBottom:`2px solid ${activeTab===t.id?'#e91e63':'transparent'}`,
                  fontFamily:'Montserrat,sans-serif',fontSize:11,fontWeight:600,letterSpacing:1,
                  color:activeTab===t.id?'#e91e63':'rgba(0,0,0,.4)',cursor:'pointer',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:5,
                  marginBottom:-1,transition:'all .2s',whiteSpace:'nowrap',minWidth:80,
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div style={{padding:18}}>

            {/* ── HOJE ── */}
            {activeTab==='hoje'&&(
              hoje.length===0
                ? <div style={{textAlign:'center',padding:'36px 20px',color:'rgba(0,0,0,.35)',fontSize:13}}>Nenhum agendamento para hoje 🌸</div>
                : hoje.map(a=><AgCard key={a.id} a={a} mostrarBotoes={true}/>)
            )}

            {/* ── PRÓXIMOS ── */}
            {activeTab==='proximos'&&(
              proximos.length===0
                ? <div style={{textAlign:'center',padding:'36px 20px',color:'rgba(0,0,0,.35)',fontSize:13}}>Sem próximos agendamentos 📅</div>
                : proximos.map(a=><AgCard key={a.id} a={a} mostrarBotoes={true}/>)
            )}

            {/* ── HISTÓRICO ── */}
            {activeTab==='historico'&&(
              historico.length===0
                ? <div style={{textAlign:'center',padding:'36px 20px',color:'rgba(0,0,0,.35)',fontSize:13}}>Nenhum atendimento finalizado ainda</div>
                : historico.map(a=>(
                  <div key={a.id} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 0',borderBottom:'1px solid rgba(233,30,99,.06)'}}>
                    <div style={{textAlign:'center',minWidth:68,background:'#f3e5f5',borderRadius:10,padding:'7px 4px',flexShrink:0}}>
                      <div style={{fontSize:10,color:'#7b1fa2',fontWeight:600}}>{a.data.slice(0,5)}</div>
                      <div style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:700,color:'#7b1fa2'}}>{a.horario}</div>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:600}}>{a.cliente}</div>
                      <div style={{fontSize:12,color:'rgba(0,0,0,.5)'}}>{a.servico}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:12,color:'rgba(0,0,0,.4)'}}>R$ {a.valorOriginal}</div>
                      <div style={{fontSize:14,fontWeight:700,color:'#c2185b'}}>R$ {a.valorCobrado}</div>
                      {a.desconto>0&&<div style={{fontSize:10,color:'#c62828'}}>-R$ {a.desconto} desc.</div>}
                      <div style={{fontSize:11,color:'#2e7d32',fontWeight:600}}>+R$ {Math.round(a.valorCobrado*(prof.comissao/100))}</div>
                    </div>
                  </div>
                ))
            )}

            {/* ── RENDIMENTOS ── */}
            {activeTab==='rendimentos'&&(
              <>
                {/* KPIs rendimentos */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:18}}>
                  {[
                    {l:'Fat. Hoje',         v:`R$ ${fatHoje}`,  ic:'📅'},
                    {l:'Comissão Hoje',      v:`R$ ${comHoje}`,  ic:'💰'},
                    {l:'Fat. Mês',           v:`R$ ${fatMes}`,   ic:'📊'},
                    {l:'Comissão Mês',       v:`R$ ${comMes}`,   ic:'💎'},
                  ].map(k=>(
                    <div key={k.l} style={{background:'linear-gradient(135deg,#fce4ec,#fdf6f9)',borderRadius:12,padding:16,border:'1px solid rgba(233,30,99,.1)'}}>
                      <div style={{fontSize:9,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(194,24,91,.6)',marginBottom:8}}>{k.l}</div>
                      <div style={{fontFamily:'Playfair Display,serif',fontSize:24,fontWeight:700,color:'#c2185b'}}>{k.v}</div>
                    </div>
                  ))}
                </div>

                {/* Regra comissão */}
                <div style={{background:'#fdf6f9',borderRadius:10,padding:14,marginBottom:16,display:'flex',alignItems:'center',gap:14}}>
                  <div style={{width:50,height:50,borderRadius:'50%',background:'linear-gradient(135deg,#e91e63,#c2185b)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#fff',flexShrink:0}}>{prof.comissao}%</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:3}}>Comissão por atendimento finalizado</div>
                    <div style={{fontSize:11,color:'rgba(0,0,0,.4)'}}>A cada R$ 100 em serviços → você recebe R$ {prof.comissao}</div>
                    <div style={{fontSize:11,color:'rgba(0,0,0,.4)'}}>Total histórico: R$ {fatTotal} faturado · R$ {comTotal} em comissões</div>
                  </div>
                </div>

                {/* Lista atendimentos do mês */}
                <div style={{fontSize:10,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(194,24,91,.6)',marginBottom:12}}>
                  Atendimentos finalizados — mês atual
                </div>
                {histMes.length===0
                  ? <div style={{textAlign:'center',padding:'20px',color:'rgba(0,0,0,.35)',fontSize:13}}>Nenhum atendimento finalizado este mês</div>
                  : histMes.map(a=>(
                    <div key={a.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 0',borderBottom:'1px solid rgba(233,30,99,.06)'}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:600}}>{a.servico}</div>
                        <div style={{fontSize:11,color:'rgba(0,0,0,.4)'}}>{a.cliente} · {a.data}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:13,color:'rgba(0,0,0,.5)'}}>R$ {a.valorCobrado}</div>
                        <div style={{fontSize:13,fontWeight:700,color:'#c2185b'}}>+R$ {Math.round(a.valorCobrado*(prof.comissao/100))}</div>
                      </div>
                    </div>
                  ))
                }
              </>
            )}

            {/* ── MEU PERFIL ── */}
            {activeTab==='perfil'&&(
              !editandoPerfil ? (
                <>
                  {/* Visualização */}
                  <div style={{textAlign:'center',paddingBottom:16,borderBottom:'1px solid rgba(233,30,99,.06)',marginBottom:16}}>
                    <div style={{width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#f48fb1,#e91e63)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:700,color:'#fff',margin:'0 auto 12px'}}>{prof.nome[0]}</div>
                    <div style={{fontFamily:'Playfair Display,serif',fontSize:20,marginBottom:4}}>{prof.nome}</div>
                    <div style={{fontSize:11,color:'rgba(0,0,0,.4)',letterSpacing:2,textTransform:'uppercase'}}>{prof.especialidade}</div>
                  </div>
                  {[
                    {l:'Comissão',          v:`${prof.comissao}%`},
                    {l:'Horário de início', v:prof.horarioInicio},
                    {l:'Horário de fim',    v:prof.horarioFim},
                    {l:'Tipo de serviço',   v:prof.tipo==='manicure'?'💅 Manicure/Pedicure':'✂️ Cabelereiro/Barbeiro'},
                  ].map(r=>(
                    <div key={r.l} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid rgba(233,30,99,.04)'}}>
                      <span style={{fontSize:12,color:'rgba(0,0,0,.5)'}}>{r.l}</span>
                      <span style={{fontSize:14,fontWeight:600,color:'#c2185b'}}>{r.v}</span>
                    </div>
                  ))}
                  <button style={{...ST.pk,marginTop:20,width:'100%'}} onClick={abrirPerfil}>
                    ✏️ Editar Meu Perfil
                  </button>
                </>
              ) : (
                <>
                  {/* Edição de perfil */}
                  <div style={{background:'#fff3e0',padding:'10px 14px',borderRadius:8,fontSize:12,color:'#f57c00',marginBottom:4}}>
                    ⚠️ Você pode alterar seu horário de expediente e senha. Comissão e especialidade são definidas pelo admin.
                  </div>
                  <label style={ST.lbl}>Horário de início do expediente</label>
                  <select value={perfilForm.horarioInicio||''} onChange={e=>setPerfilForm(f=>({...f,horarioInicio:e.target.value}))} style={ST.sel}>
                    {HORARIOS.map(h=><option key={h}>{h}</option>)}
                  </select>
                  <label style={ST.lbl}>Horário de fim do expediente</label>
                  <select value={perfilForm.horarioFim||''} onChange={e=>setPerfilForm(f=>({...f,horarioFim:e.target.value}))} style={ST.sel}>
                    {HORARIOS.map(h=><option key={h}>{h}</option>)}
                  </select>
                  <label style={ST.lbl}>Nova senha (deixe em branco para manter)</label>
                  <input type="password" value={perfilForm.novaSenha||''} onChange={e=>setPerfilForm(f=>({...f,novaSenha:e.target.value}))} placeholder="Nova senha" style={ST.inp}/>
                  <label style={ST.lbl}>Senha atual (obrigatório para salvar) *</label>
                  <input type="password" value={perfilForm.senhaAtual||''} onChange={e=>setPerfilForm(f=>({...f,senhaAtual:e.target.value}))} placeholder="Confirme sua senha atual" style={ST.inp}/>
                  <div style={{display:'flex',gap:10,marginTop:18}}>
                    <button style={{...ST.pk,flex:1}} onClick={salvarPerfil}>Salvar</button>
                    <button style={ST.ot} onClick={()=>setEditandoPerfil(false)}>Cancelar</button>
                  </div>
                </>
              )
            )}

          </div>
        </div>
      </div>

      {/* ══ MODAL FINALIZAR ══ */}
      {modal?.type==='finalizar'&&(
        <Modal title="✓ Finalizar Atendimento" onClose={closeModal}>
          <div style={{background:'#e8f5e9',padding:'12px 16px',borderRadius:10,marginBottom:4}}>
            <div style={{fontSize:13,fontWeight:600,color:'#1b5e20',marginBottom:4}}>{form.cliente} — {form.servico}</div>
            <div style={{fontSize:12,color:'rgba(0,0,0,.6)'}}>{form.data} às {form.horario}</div>
          </div>
          <label style={ST.lbl}>Valor original do serviço</label>
          <input value={`R$ ${form.valorOriginal}`} disabled style={ST.inpD}/>
          <label style={ST.lbl}>Valor cobrado (confirme ou informe com desconto) *</label>
          <input type="number" value={form.valorCobrado||''} onChange={e=>setForm(f=>({...f,valorCobrado:e.target.value}))} placeholder="Valor recebido do cliente" style={ST.inp}/>
          {form.valorCobrado&&Number(form.valorCobrado)<Number(form.valorOriginal)&&(
            <div style={{background:'#fff8e1',color:'#f57c00',padding:'9px 13px',borderRadius:8,fontSize:12,marginTop:8}}>
              ⚠️ Desconto de R$ {Number(form.valorOriginal)-Number(form.valorCobrado)} — o admin verá este ajuste no financeiro.
            </div>
          )}
          {formErr&&<div style={{background:'#ffebee',color:'#c62828',padding:'9px 13px',borderRadius:8,fontSize:12,marginTop:8}}>{formErr}</div>}
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button style={{...ST.pk,flex:1,background:'linear-gradient(135deg,#2e7d32,#1b5e20)'}} onClick={confirmarFinalizar}>✓ Confirmar</button>
            <button style={ST.ot} onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL EDITAR AGENDAMENTO ══ */}
      {modal?.type==='editar'&&(
        <Modal title="Editar Agendamento" onClose={closeModal}>
          <div style={{background:'#fff3e0',padding:'10px 14px',borderRadius:8,fontSize:12,color:'#f57c00',marginBottom:4}}>
            ⚠️ Você pode alterar o status e transferir para outro profissional. O valor não pode ser alterado.
          </div>
          <label style={ST.lbl}>Cliente</label>
          <input value={form.cliente||''} disabled style={ST.inpD}/>
          <label style={ST.lbl}>Serviço</label>
          <input value={form.servico||''} disabled style={ST.inpD}/>
          <label style={ST.lbl}>Valor — somente o admin pode alterar</label>
          <input value={`R$ ${form.valorOriginal}`} disabled style={ST.inpD}/>
          <label style={ST.lbl}>Status</label>
          <select value={form.status||''} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={ST.sel}>
            {Object.entries(statusConfig).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
          <label style={ST.lbl}>Transferir para outro profissional</label>
          <select value={form.profissional||''} onChange={e=>setForm(f=>({...f,profissional:e.target.value}))} style={ST.sel}>
            {PROFISSIONAIS_INIT.map(p=>(
              <option key={p.id} value={p.nome}>{p.nome}{p.nome===prof.nome?' (você)':''}</option>
            ))}
          </select>
          {form.profissional!==prof.nome&&(
            <div style={{background:'#fce4ec',padding:'9px 13px',borderRadius:8,fontSize:12,color:'#c2185b',marginTop:8}}>
              ⚠️ Este agendamento será transferido para <strong>{form.profissional}</strong> e sairá da sua agenda.
            </div>
          )}
          {formErr&&<div style={{background:'#ffebee',color:'#c62828',padding:'9px 13px',borderRadius:8,fontSize:12,marginTop:8}}>{formErr}</div>}
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button style={{...ST.pk,flex:1}} onClick={salvarEdicao}>Salvar</button>
            <button style={ST.ot} onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {toast&&<div className="toast-box" style={{background:toastOk?'#2e7d32':'#c62828'}}>{toast}</div>}
    </>
  )
}
