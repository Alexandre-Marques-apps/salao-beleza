'use client'
import { useState } from 'react'

const PROFISSIONAIS_BASE = [
  { id:1, nome:'Ana',    senha:'123456', especialidade:'Cabelereira', comissao:40 },
  { id:2, nome:'Carlos', senha:'123456', especialidade:'Barbeiro',    comissao:35 },
  { id:3, nome:'Paula',  senha:'123456', especialidade:'Manicure',    comissao:50 },
  { id:4, nome:'Carla',  senha:'123456', especialidade:'Cabelereira', comissao:40 },
]

const SERVICOS_BASE = [
  { id:1, nome:'Corte Masculino', preco:40  },
  { id:2, nome:'Corte Feminino',  preco:90  },
  { id:3, nome:'Barba',           preco:30  },
  { id:4, nome:'Escova',          preco:60  },
  { id:5, nome:'Manicure',        preco:35  },
  { id:6, nome:'Coloração',       preco:150 },
  { id:7, nome:'Pedicure',        preco:40  },
]

const AGENDAMENTOS_INICIAIS = [
  { id:1,  profissional:'Ana',    cliente:'Maria Silva',   servico:'Corte Feminino',  data:'18/03/2025', horario:'09:00', status:'confirmado',     valor:90  },
  { id:2,  profissional:'Carlos', cliente:'João Costa',    servico:'Barba',           data:'18/03/2025', horario:'09:30', status:'finalizado',     valor:30  },
  { id:3,  profissional:'Paula',  cliente:'Carla Mendes',  servico:'Manicure',        data:'18/03/2025', horario:'10:00', status:'em_atendimento', valor:35  },
  { id:4,  profissional:'Carlos', cliente:'Pedro Alves',   servico:'Corte Masculino', data:'18/03/2025', horario:'11:00', status:'agendado',       valor:40  },
  { id:5,  profissional:'Ana',    cliente:'Fernanda Lima', servico:'Escova',          data:'18/03/2025', horario:'13:00', status:'agendado',       valor:60  },
  { id:6,  profissional:'Carlos', cliente:'Lucas Rocha',   servico:'Corte Masculino', data:'18/03/2025', horario:'14:00', status:'finalizado',     valor:40  },
  { id:7,  profissional:'Ana',    cliente:'Beatriz Souza', servico:'Coloração',       data:'19/03/2025', horario:'10:00', status:'agendado',       valor:150 },
  { id:8,  profissional:'Carlos', cliente:'Roberto Lima',  servico:'Barba',           data:'19/03/2025', horario:'11:00', status:'agendado',       valor:30  },
  { id:9,  profissional:'Ana',    cliente:'Luciana Melo',  servico:'Corte Feminino',  data:'19/03/2025', horario:'14:00', status:'agendado',       valor:90  },
  { id:10, profissional:'Paula',  cliente:'Tatiana Alves', servico:'Manicure',        data:'20/03/2025', horario:'09:00', status:'agendado',       valor:35  },
  { id:11, profissional:'Carlos', cliente:'Felipe Costa',  servico:'Barba',           data:'20/03/2025', horario:'10:30', status:'agendado',       valor:30  },
  { id:12, profissional:'Ana',    cliente:'Renata Lima',   servico:'Escova',          data:'20/03/2025', horario:'15:00', status:'agendado',       valor:60  },
  { id:13, profissional:'Ana',    cliente:'Cliente A',     servico:'Coloração',       data:'05/03/2025', horario:'10:00', status:'finalizado',     valor:150 },
  { id:14, profissional:'Ana',    cliente:'Cliente B',     servico:'Corte Feminino',  data:'07/03/2025', horario:'11:00', status:'finalizado',     valor:90  },
  { id:15, profissional:'Carlos', cliente:'Cliente C',     servico:'Barba',           data:'06/03/2025', horario:'09:00', status:'finalizado',     valor:30  },
  { id:16, profissional:'Carlos', cliente:'Cliente D',     servico:'Corte Masculino', data:'08/03/2025', horario:'14:00', status:'finalizado',     valor:40  },
  { id:17, profissional:'Paula',  cliente:'Cliente E',     servico:'Manicure',        data:'04/03/2025', horario:'10:00', status:'finalizado',     valor:35  },
]

const statusConfig = {
  agendado:       { label:'Agendado',       bg:'#fff3e0', color:'#f57c00' },
  confirmado:     { label:'Confirmado',     bg:'#e8f5e9', color:'#2e7d32' },
  em_atendimento: { label:'Em Atendimento', bg:'#fce4ec', color:'#c2185b' },
  finalizado:     { label:'Finalizado',     bg:'#f3e5f5', color:'#7b1fa2' },
  cancelado:      { label:'Cancelado',      bg:'#ffebee', color:'#c62828' },
}

const HORARIOS = ['08:00','08:15','08:30','08:45','09:00','09:15','09:30','09:45','10:00','10:15','10:30','10:45','11:00','11:15','11:30','11:45','12:00','13:00','13:15','13:30','13:45','14:00','14:15','14:30','14:45','15:00','15:15','15:30','15:45','16:00','16:15','16:30','16:45','17:00','17:15','17:30','17:45','18:00']

function Modal({ title, onClose, children }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:440,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(233,30,99,.1)',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'#fff'}}>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:16}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:'rgba(0,0,0,.4)',lineHeight:1}}>×</button>
        </div>
        <div style={{padding:20}}>{children}</div>
      </div>
    </div>
  )
}

export default function ProfissionalPanel() {
  const [profissionais, setProfissionais] = useState(PROFISSIONAIS_BASE)
  const [agendamentos,  setAgendamentos]  = useState(AGENDAMENTOS_INICIAIS)
  const [loggedIn,  setLoggedIn]  = useState(false)
  const [prof,      setProf]      = useState(null)
  const [loginNome, setLoginNome] = useState('')
  const [loginSenha,setLoginSenha]= useState('')
  const [loginErr,  setLoginErr]  = useState('')
  const [activeTab, setActiveTab] = useState('hoje')
  const [toast,     setToast]     = useState('')
  const [modal,     setModal]     = useState(null)
  const [form,      setForm]      = useState({})

  function showToast(m){ setToast(m); setTimeout(()=>setToast(''),2500) }
  function closeModal(){ setModal(null) }
  function setF(k){ return v=>setForm(f=>({...f,[k]:v})) }

  function handleLogin(){
    const found = profissionais.find(p=>p.nome.toLowerCase()===loginNome.toLowerCase()&&p.senha===loginSenha)
    if(found){ setProf(found); setLoggedIn(true); setLoginErr('') }
    else setLoginErr('Nome ou senha incorretos')
  }

  // quando seleciona serviço no modal, valor preenchido pelo cadastro (profissional NÃO pode alterar valor)
  function onServicoChange(nome){
    const s = SERVICOS_BASE.find(x=>x.nome===nome)
    setForm(f=>({...f, servico:nome, valor: s ? s.preco : f.valor}))
  }

  // profissional pode editar status e transferir SEUS agendamentos para outro profissional
  // mas NÃO pode puxar agendamentos de outros para si
  function saveEdicao(){
    const original = agendamentos.find(a=>a.id===form.id)
    if(!original){ showToast('Agendamento não encontrado'); return }
    // regra: se o profissional original não é este prof, bloquear
    if(original.profissional !== prof.nome){
      showToast('❌ Você não pode editar agendamentos de outros profissionais!'); closeModal(); return
    }
    // se está tentando alterar o valor, bloquear
    if(Number(form.valor) !== Number(original.valor)){
      showToast('❌ Apenas o admin pode alterar o valor!'); 
      setForm(f=>({...f, valor: original.valor}))
      return
    }
    setAgendamentos(a=>a.map(x=>x.id===form.id?{...form}:x))
    closeModal(); showToast('Agendamento atualizado!')
  }

  const meus     = prof ? agendamentos.filter(a=>a.profissional===prof.nome) : []
  const hoje     = meus.filter(a=>a.data==='18/03/2025')
  const proximos = meus.filter(a=>a.data!=='18/03/2025'&&a.status!=='finalizado'&&a.status!=='cancelado')
  const historico= meus.filter(a=>a.status==='finalizado')

  const fatTotal = historico.reduce((s,a)=>s+(Number(a.valor)||0),0)
  const comTotal = prof ? Math.round(fatTotal*(prof.comissao/100)) : 0
  const fatMes   = meus.filter(a=>a.data.includes('/03/2025')&&a.status==='finalizado').reduce((s,a)=>s+(Number(a.valor)||0),0)
  const comMes   = prof ? Math.round(fatMes*(prof.comissao/100)) : 0
  const fatHoje  = hoje.filter(a=>a.status==='finalizado').reduce((s,a)=>s+(Number(a.valor)||0),0)
  const comHoje  = prof ? Math.round(fatHoje*(prof.comissao/100)) : 0

  const S = { // inline styles helpers
    card: {background:'#fff',borderRadius:14,border:'1px solid rgba(233,30,99,.06)',boxShadow:'0 2px 8px rgba(233,30,99,.04)',overflow:'hidden',marginBottom:16},
    hd:   {padding:'14px 20px',borderBottom:'1px solid rgba(233,30,99,.06)',display:'flex',alignItems:'center',justifyContent:'space-between'},
    lbl:  {display:'block',fontSize:10,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(194,24,91,.6)',marginBottom:6,marginTop:14},
    inp:  {width:'100%',padding:'11px 13px',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',background:'#fafafa'},
    inpD: {width:'100%',padding:'11px 13px',border:'1.5px solid rgba(233,30,99,.1)',borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',background:'#f5f5f5',color:'#999'},
    sel:  {width:'100%',padding:'11px 13px',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',background:'#fafafa'},
    pk:   {padding:'10px 20px',background:'linear-gradient(135deg,#e91e63,#c2185b)',border:'none',borderRadius:9,fontFamily:'Montserrat,sans-serif',fontSize:10,fontWeight:600,letterSpacing:2,textTransform:'uppercase',color:'#fff',cursor:'pointer'},
    ot:   {padding:'8px 14px',background:'transparent',border:'1.5px solid rgba(233,30,99,.25)',borderRadius:8,fontFamily:'Montserrat,sans-serif',fontSize:10,fontWeight:600,color:'#e91e63',cursor:'pointer'},
  }

  // ── LOGIN ──────────────────────────────────────────────
  if(!loggedIn) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@300;400;500;600&display=swap');*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Montserrat',sans-serif;background:linear-gradient(160deg,#fce4ec,#fdf6f9);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}`}</style>
      <div style={{background:'#fff',borderRadius:24,width:'100%',maxWidth:400,overflow:'hidden',boxShadow:'0 8px 40px rgba(233,30,99,.12)'}}>
        <div style={{background:'linear-gradient(160deg,#fce4ec,#fdf6f9)',padding:'40px 32px 32px',textAlign:'center',borderBottom:'1px solid rgba(233,30,99,.08)'}}>
          <div style={{width:64,height:64,borderRadius:'50%',border:'2px solid #e91e63',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',background:'#fff'}}>
            <span style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:700,color:'#e91e63'}}>JOU</span>
          </div>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:26,fontWeight:700,color:'#c2185b',letterSpacing:3}}>JOUDAT SALON</div>
          <div style={{fontSize:10,letterSpacing:4,color:'rgba(194,24,91,.5)',textTransform:'uppercase',marginTop:6}}>Área do Profissional</div>
        </div>
        <div style={{padding:32}}>
          <label style={S.lbl}>Seu Nome</label>
          <select value={loginNome} onChange={e=>setLoginNome(e.target.value)} style={S.sel}>
            <option value="">Selecione seu nome...</option>
            {profissionais.map(p=><option key={p.id} value={p.nome}>{p.nome} — {p.especialidade}</option>)}
          </select>
          <label style={S.lbl}>Senha</label>
          <input type="password" value={loginSenha} onChange={e=>setLoginSenha(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="Digite sua senha" style={S.inp}/>
          {loginErr&&<div style={{background:'#ffebee',color:'#c62828',padding:'10px 14px',borderRadius:8,fontSize:12,margin:'12px 0',textAlign:'center'}}>{loginErr}</div>}
          <button onClick={handleLogin} style={{...S.pk,width:'100%',padding:16,fontSize:11,letterSpacing:4,marginTop:16}}>Acessar Minha Área</button>
          <div style={{textAlign:'center',marginTop:14,fontSize:10,color:'rgba(0,0,0,.3)',letterSpacing:1}}>Senha padrão: 123456</div>
        </div>
      </div>
    </>
  )

  const tabs = [
    {id:'hoje',        label:'Hoje',       icon:'📅'},
    {id:'proximos',    label:'Próximos',   icon:'🗓'},
    {id:'historico',   label:'Histórico',  icon:'📋'},
    {id:'rendimentos', label:'Rendimentos',icon:'💰'},
  ]

  function AgendCard({ a, editavel=false }) {
    return (
      <div style={{display:'flex',alignItems:'center',gap:14,padding:'13px 0',borderBottom:'1px solid rgba(233,30,99,.06)'}}>
        <div style={{textAlign:'center',minWidth:66,background:'#fce4ec',borderRadius:10,padding:'7px 4px',flexShrink:0}}>
          <div style={{fontSize:10,color:'#c2185b',fontWeight:600}}>{a.data.slice(0,5)}</div>
          <div style={{fontSize:15,fontWeight:700,color:'#c2185b',fontFamily:'Playfair Display,serif'}}>{a.horario}</div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:600,color:'#1a1a1a',marginBottom:2}}>{a.cliente}</div>
          <div style={{fontSize:12,color:'rgba(0,0,0,.5)'}}>{a.servico}</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:14,fontWeight:700,color:'#c2185b',marginBottom:4}}>R$ {a.valor}</div>
          <span style={{padding:'3px 8px',borderRadius:20,fontSize:10,fontWeight:600,background:statusConfig[a.status]?.bg,color:statusConfig[a.status]?.color}}>{statusConfig[a.status]?.label}</span>
        </div>
        {editavel&&(
          <button style={{...S.ot,padding:'6px 10px',flexShrink:0}} onClick={()=>{setForm({...a});setModal({type:'editar'})}}>✏️</button>
        )}
      </div>
    )
  }

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@300;400;500;600&display=swap');*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Montserrat',sans-serif;background:linear-gradient(160deg,#fce4ec,#fdf6f9);min-height:100vh;}.toast{position:fixed;bottom:22px;right:22px;background:#c62828;color:#fff;padding:11px 20px;border-radius:10px;font-size:12px;font-weight:600;z-index:9999;}`}</style>
      <style>{`.toast-ok{background:#2e7d32!important;}`}</style>

      <div style={{maxWidth:780,margin:'0 auto',padding:'20px 14px'}}>

        {/* HEADER */}
        <div style={{background:'#fff',borderRadius:18,padding:'20px 24px',marginBottom:16,boxShadow:'0 4px 16px rgba(233,30,99,.08)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,#f48fb1,#e91e63)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:'#fff'}}>{prof.nome[0]}</div>
            <div>
              <div style={{fontFamily:'Playfair Display,serif',fontSize:19}}>Olá, {prof.nome}!</div>
              <div style={{fontSize:10,color:'rgba(0,0,0,.4)',letterSpacing:2,textTransform:'uppercase'}}>{prof.especialidade} · {prof.comissao}% comissão</div>
            </div>
          </div>
          <button onClick={()=>setLoggedIn(false)} style={{...S.ot,fontSize:10,letterSpacing:2}}>Sair</button>
        </div>

        {/* KPIs */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
          {[{l:'Atend. Hoje',v:hoje.length,ic:'📅',bg:'#fce4ec'},{l:'Fat. Hoje',v:`R$ ${fatHoje}`,ic:'💰',bg:'#e8f5e9'},{l:'Comissão Hoje',v:`R$ ${comHoje}`,ic:'✨',bg:'#fff3e0'}].map(k=>(
            <div key={k.l} style={{background:'#fff',borderRadius:13,padding:16,border:'1px solid rgba(233,30,99,.06)',boxShadow:'0 2px 8px rgba(233,30,99,.04)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div style={{fontSize:9,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(0,0,0,.35)'}}>{k.l}</div>
                <div style={{width:30,height:30,borderRadius:8,background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>{k.ic}</div>
              </div>
              <div style={{fontFamily:'Playfair Display,serif',fontSize:22,fontWeight:700}}>{k.v}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={S.card}>
          <div style={{display:'flex',borderBottom:'1px solid rgba(233,30,99,.08)'}}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{flex:1,padding:'13px 6px',background:'none',border:'none',borderBottom:`2px solid ${activeTab===t.id?'#e91e63':'transparent'}`,fontFamily:'Montserrat,sans-serif',fontSize:11,fontWeight:600,letterSpacing:1,color:activeTab===t.id?'#e91e63':'rgba(0,0,0,.4)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:5,marginBottom:-1}}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <div style={{padding:18}}>

            {/* HOJE */}
            {activeTab==='hoje'&&(
              hoje.length===0
                ?<div style={{textAlign:'center',padding:'36px 20px',color:'rgba(0,0,0,.35)',fontSize:13}}>Nenhum agendamento para hoje 🌸</div>
                :hoje.map(a=><AgendCard key={a.id} a={a} editavel={true}/>)
            )}

            {/* PRÓXIMOS */}
            {activeTab==='proximos'&&(
              proximos.length===0
                ?<div style={{textAlign:'center',padding:'36px 20px',color:'rgba(0,0,0,.35)',fontSize:13}}>Sem próximos agendamentos 📅</div>
                :proximos.map(a=><AgendCard key={a.id} a={a} editavel={true}/>)
            )}

            {/* HISTÓRICO */}
            {activeTab==='historico'&&(
              historico.length===0
                ?<div style={{textAlign:'center',padding:'36px 20px',color:'rgba(0,0,0,.35)',fontSize:13}}>Nenhum serviço finalizado ainda</div>
                :historico.map(a=>(
                  <div key={a.id} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 0',borderBottom:'1px solid rgba(233,30,99,.06)'}}>
                    <div style={{textAlign:'center',minWidth:66,background:'#f3e5f5',borderRadius:10,padding:'7px 4px',flexShrink:0}}>
                      <div style={{fontSize:10,color:'#7b1fa2',fontWeight:600}}>{a.data.slice(0,5)}</div>
                      <div style={{fontSize:15,fontWeight:700,color:'#7b1fa2',fontFamily:'Playfair Display,serif'}}>{a.horario}</div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600}}>{a.cliente}</div>
                      <div style={{fontSize:12,color:'rgba(0,0,0,.5)'}}>{a.servico}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:13,color:'rgba(0,0,0,.5)'}}>R$ {a.valor}</div>
                      <div style={{fontSize:13,fontWeight:700,color:'#c2185b'}}>+R$ {Math.round(a.valor*(prof.comissao/100))}</div>
                    </div>
                  </div>
                ))
            )}

            {/* RENDIMENTOS */}
            {activeTab==='rendimentos'&&(
              <>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:18}}>
                  {[{l:'Fat. Total',v:`R$ ${fatTotal}`,ic:'📊'},{l:'Comissão Total',v:`R$ ${comTotal}`,ic:'💎'},{l:'Fat. Mês',v:`R$ ${fatMes}`,ic:'📅'},{l:'Comissão Mês',v:`R$ ${comMes}`,ic:'✨'}].map(k=>(
                    <div key={k.l} style={{background:'linear-gradient(135deg,#fce4ec,#fdf6f9)',borderRadius:12,padding:16,border:'1px solid rgba(233,30,99,.1)'}}>
                      <div style={{fontSize:9,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(194,24,91,.6)',marginBottom:8}}>{k.l}</div>
                      <div style={{fontFamily:'Playfair Display,serif',fontSize:24,fontWeight:700,color:'#c2185b'}}>{k.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:'#fdf6f9',borderRadius:10,padding:14,marginBottom:14}}>
                  <div style={{fontSize:10,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(194,24,91,.6)',marginBottom:10}}>Regra de Comissão</div>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:50,height:50,borderRadius:'50%',background:'linear-gradient(135deg,#e91e63,#c2185b)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#fff'}}>{prof.comissao}%</div>
                    <div><div style={{fontSize:13,fontWeight:600}}>Comissão por serviço realizado</div><div style={{fontSize:11,color:'rgba(0,0,0,.4)'}}>A cada R$ 100 → você recebe R$ {prof.comissao}</div></div>
                  </div>
                </div>
                <div style={{fontSize:10,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(194,24,91,.6)',marginBottom:10}}>Serviços Realizados</div>
                {historico.map(a=>(
                  <div key={a.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 0',borderBottom:'1px solid rgba(233,30,99,.06)'}}>
                    <div><div style={{fontSize:13,fontWeight:600}}>{a.servico}</div><div style={{fontSize:11,color:'rgba(0,0,0,.4)'}}>{a.cliente} · {a.data}</div></div>
                    <div style={{textAlign:'right'}}><div style={{fontSize:12,color:'rgba(0,0,0,.5)'}}>R$ {a.valor}</div><div style={{fontSize:13,fontWeight:700,color:'#c2185b'}}>+R$ {Math.round(a.valor*(prof.comissao/100))}</div></div>
                  </div>
                ))}
              </>
            )}

          </div>
        </div>
      </div>

      {/* MODAL EDITAR AGENDAMENTO */}
      {modal?.type==='editar'&&(
        <Modal title="Editar Agendamento" onClose={closeModal}>
          <div style={{background:'#fff3e0',padding:'10px 14px',borderRadius:8,fontSize:12,color:'#f57c00',marginBottom:4}}>
            ⚠️ Você pode atualizar o status e transferir para outro profissional. Não é possível alterar o valor.
          </div>
          <label style={S.lbl}>Cliente</label>
          <input value={form.cliente||''} disabled style={S.inpD}/>
          <label style={S.lbl}>Serviço</label>
          <input value={form.servico||''} disabled style={S.inpD}/>
          <label style={S.lbl}>Valor (R$) — somente o admin pode alterar</label>
          <input value={`R$ ${form.valor}`} disabled style={S.inpD}/>
          <label style={S.lbl}>Status</label>
          <select value={form.status||''} onChange={e=>setF('status')(e.target.value)} style={S.sel}>
            {Object.entries(statusConfig).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
          <label style={S.lbl}>Transferir para outro profissional</label>
          <select value={form.profissional||''} onChange={e=>setF('profissional')(e.target.value)} style={S.sel}>
            {PROFISSIONAIS_BASE.map(p=><option key={p.id} value={p.nome}>{p.nome}{p.nome===prof.nome?' (você)':''}</option>)}
          </select>
          {form.profissional!==prof.nome&&(
            <div style={{background:'#fce4ec',padding:'10px 14px',borderRadius:8,fontSize:12,color:'#c2185b',marginTop:8}}>
              ⚠️ Este agendamento será transferido para <strong>{form.profissional}</strong>. Após salvar, ele sairá da sua agenda.
            </div>
          )}
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button style={{...S.pk,flex:1}} onClick={saveEdicao}>Salvar</button>
            <button style={S.ot} onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {toast&&<div className="toast" style={{background: toast.startsWith('❌')?'#c62828':'#2e7d32'}}>{toast}</div>}
    </>
  )
}
