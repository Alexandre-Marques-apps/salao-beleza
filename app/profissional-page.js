'use client'
import { useState } from 'react'

const PROFISSIONAIS = [
  { id:1, nome:'Ana',    senha:'ana123',    especialidade:'Cabelereira', comissao:40 },
  { id:2, nome:'Carlos', senha:'carlos123', especialidade:'Barbeiro',    comissao:35 },
  { id:3, nome:'Paula',  senha:'paula123',  especialidade:'Manicure',    comissao:50 },
  { id:4, nome:'Carla',  senha:'carla123',  especialidade:'Cabelereira', comissao:40 },
]

const AGENDAMENTOS = [
  { id:1,  profissional:'Ana',    cliente:'Maria Silva',   servico:'Corte Feminino', data:'18/03/2025', horario:'09:00', status:'confirmado',     valor:90  },
  { id:2,  profissional:'Carlos', cliente:'João Costa',    servico:'Barba',          data:'18/03/2025', horario:'09:30', status:'finalizado',     valor:30  },
  { id:3,  profissional:'Paula',  cliente:'Carla Mendes',  servico:'Manicure',       data:'18/03/2025', horario:'10:00', status:'em_atendimento', valor:35  },
  { id:4,  profissional:'Carlos', cliente:'Pedro Alves',   servico:'Corte Masculino',data:'18/03/2025', horario:'11:00', status:'agendado',       valor:40  },
  { id:5,  profissional:'Ana',    cliente:'Fernanda Lima', servico:'Escova',         data:'18/03/2025', horario:'13:00', status:'agendado',       valor:60  },
  { id:6,  profissional:'Carlos', cliente:'Lucas Rocha',   servico:'Corte Masculino',data:'18/03/2025', horario:'14:00', status:'finalizado',     valor:40  },
  { id:7,  profissional:'Ana',    cliente:'Beatriz Souza', servico:'Coloração',      data:'19/03/2025', horario:'10:00', status:'agendado',       valor:150 },
  { id:8,  profissional:'Carlos', cliente:'Roberto Lima',  servico:'Barba',          data:'19/03/2025', horario:'11:00', status:'agendado',       valor:30  },
  { id:9,  profissional:'Ana',    cliente:'Luciana Melo',  servico:'Corte Feminino', data:'19/03/2025', horario:'14:00', status:'agendado',       valor:90  },
  { id:10, profissional:'Paula',  cliente:'Tatiana Alves', servico:'Manicure',       data:'20/03/2025', horario:'09:00', status:'agendado',       valor:35  },
  { id:11, profissional:'Carlos', cliente:'Felipe Costa',  servico:'Barba',          data:'20/03/2025', horario:'10:30', status:'agendado',       valor:30  },
  { id:12, profissional:'Ana',    cliente:'Renata Lima',   servico:'Escova',         data:'20/03/2025', horario:'15:00', status:'agendado',       valor:60  },
  // mês anterior para rendimentos
  { id:13, profissional:'Ana',    cliente:'Cliente A',     servico:'Coloração',      data:'05/03/2025', horario:'10:00', status:'finalizado',     valor:150 },
  { id:14, profissional:'Ana',    cliente:'Cliente B',     servico:'Corte Feminino', data:'07/03/2025', horario:'11:00', status:'finalizado',     valor:90  },
  { id:15, profissional:'Carlos', cliente:'Cliente C',     servico:'Barba',          data:'06/03/2025', horario:'09:00', status:'finalizado',     valor:30  },
  { id:16, profissional:'Carlos', cliente:'Cliente D',     servico:'Corte Masculino',data:'08/03/2025', horario:'14:00', status:'finalizado',     valor:40  },
  { id:17, profissional:'Paula',  cliente:'Cliente E',     servico:'Manicure',       data:'04/03/2025', horario:'10:00', status:'finalizado',     valor:35  },
]

const statusConfig = {
  agendado:       { label:'Agendado',       bg:'#fff3e0', color:'#f57c00' },
  confirmado:     { label:'Confirmado',     bg:'#e8f5e9', color:'#2e7d32' },
  em_atendimento: { label:'Em Atendimento', bg:'#fce4ec', color:'#c2185b' },
  finalizado:     { label:'Finalizado',     bg:'#f3e5f5', color:'#7b1fa2' },
  cancelado:      { label:'Cancelado',      bg:'#ffebee', color:'#c62828' },
}

export default function ProfissionalPanel() {
  const [loggedIn, setLoggedIn]   = useState(false)
  const [prof,     setProf]       = useState(null)
  const [loginNome,setLoginNome]  = useState('')
  const [loginSenha,setLoginSenha]= useState('')
  const [loginErr, setLoginErr]   = useState('')
  const [activeTab,setActiveTab]  = useState('hoje')

  function handleLogin() {
    const found = PROFISSIONAIS.find(p=>p.nome.toLowerCase()===loginNome.toLowerCase()&&p.senha===loginSenha)
    if (found) { setProf(found); setLoggedIn(true); setLoginErr('') }
    else setLoginErr('Nome ou senha incorretos')
  }

  // Filtra agendamentos do profissional
  const meus = prof ? AGENDAMENTOS.filter(a=>a.profissional===prof.nome) : []
  const hoje  = meus.filter(a=>a.data==='18/03/2025')
  const proximos = meus.filter(a=>a.data!=='18/03/2025'&&a.status!=='finalizado'&&a.status!=='cancelado')
  const historico = meus.filter(a=>a.status==='finalizado')

  // Rendimentos
  const totalServicos = historico.reduce((s,a)=>s+(Number(a.valor)||0),0)
  const minhaComissao = prof ? Math.round(totalServicos*(prof.comissao/100)) : 0
  const mesAtual = meus.filter(a=>a.data.includes('/03/2025')&&a.status==='finalizado')
  const fatMes   = mesAtual.reduce((s,a)=>s+(Number(a.valor)||0),0)
  const comMes   = prof ? Math.round(fatMes*(prof.comissao/100)) : 0
  const fatHoje  = hoje.filter(a=>a.status==='finalizado').reduce((s,a)=>s+(Number(a.valor)||0),0)
  const comHoje  = prof ? Math.round(fatHoje*(prof.comissao/100)) : 0

  // ── LOGIN ──────────────────────────────────────────────
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
          <div style={{fontSize:10,letterSpacing:4,color:'rgba(194,24,91,.5)',textTransform:'uppercase',marginTop:6}}>Área do Profissional</div>
        </div>
        <div style={{padding:32}}>
          <div style={{marginBottom:16}}>
            <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(194,24,91,.6)',marginBottom:8}}>Seu Nome</label>
            <select value={loginNome} onChange={e=>setLoginNome(e.target.value)} style={{width:'100%',padding:'13px 16px',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',background:'#fafafa'}}>
              <option value="">Selecione seu nome...</option>
              {PROFISSIONAIS.map(p=><option key={p.id} value={p.nome}>{p.nome}</option>)}
            </select>
          </div>
          <div style={{marginBottom:20}}>
            <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(194,24,91,.6)',marginBottom:8}}>Senha</label>
            <input type="password" value={loginSenha} onChange={e=>setLoginSenha(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="Digite sua senha" style={{width:'100%',padding:'13px 16px',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',background:'#fafafa'}}/>
          </div>
          {loginErr&&<div style={{background:'#ffebee',color:'#c62828',padding:'10px 14px',borderRadius:8,fontSize:12,marginBottom:16,textAlign:'center'}}>{loginErr}</div>}
          <button onClick={handleLogin} style={{width:'100%',padding:16,background:'linear-gradient(135deg,#e91e63,#c2185b)',border:'none',borderRadius:12,fontFamily:'Montserrat,sans-serif',fontSize:11,fontWeight:600,letterSpacing:4,textTransform:'uppercase',color:'#fff',cursor:'pointer'}}>
            Acessar Minha Área
          </button>
          <div style={{textAlign:'center',marginTop:16,fontSize:10,color:'rgba(0,0,0,.3)',letterSpacing:1}}>
            Senhas de exemplo: ana123 · carlos123 · paula123
          </div>
        </div>
      </div>
    </>
  )

  // ── TABS ──────────────────────────────────────────────
  const tabs = [
    { id:'hoje',       label:'Hoje',      icon:'📅' },
    { id:'proximos',   label:'Próximos',  icon:'🗓' },
    { id:'historico',  label:'Histórico', icon:'📋' },
    { id:'rendimentos',label:'Rendimentos',icon:'💰'},
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@300;400;500;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Montserrat',sans-serif;background:linear-gradient(160deg,#fce4ec 0%,#fdf6f9 60%);min-height:100vh;}
      `}</style>

      <div style={{maxWidth:800,margin:'0 auto',padding:'24px 16px'}}>

        {/* HEADER */}
        <div style={{background:'#fff',borderRadius:20,padding:'24px 28px',marginBottom:20,boxShadow:'0 4px 20px rgba(233,30,99,.08)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{width:52,height:52,borderRadius:'50%',background:'linear-gradient(135deg,#f48fb1,#e91e63)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'#fff'}}>
              {prof.nome[0]}
            </div>
            <div>
              <div style={{fontFamily:'Playfair Display,serif',fontSize:20,color:'#1a1a1a'}}>Olá, {prof.nome}!</div>
              <div style={{fontSize:11,color:'rgba(0,0,0,.4)',letterSpacing:2,textTransform:'uppercase'}}>{prof.especialidade} · {prof.comissao}% comissão</div>
            </div>
          </div>
          <button onClick={()=>setLoggedIn(false)} style={{padding:'8px 16px',background:'none',border:'1.5px solid rgba(233,30,99,.2)',borderRadius:8,fontFamily:'Montserrat,sans-serif',fontSize:10,fontWeight:600,letterSpacing:2,color:'#c2185b',cursor:'pointer',textTransform:'uppercase'}}>
            Sair
          </button>
        </div>

        {/* KPIs */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:20}}>
          {[
            {l:'Atend. Hoje',  v:hoje.length,        ic:'📅', bg:'#fce4ec'},
            {l:'Fat. Hoje',    v:`R$ ${fatHoje}`,     ic:'💰', bg:'#e8f5e9'},
            {l:'Comissão Hoje',v:`R$ ${comHoje}`,     ic:'✨', bg:'#fff3e0'},
          ].map(k=>(
            <div key={k.l} style={{background:'#fff',borderRadius:14,padding:18,border:'1px solid rgba(233,30,99,.06)',boxShadow:'0 2px 10px rgba(233,30,99,.04)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div style={{fontSize:9,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(0,0,0,.35)'}}>{k.l}</div>
                <div style={{width:32,height:32,borderRadius:8,background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>{k.ic}</div>
              </div>
              <div style={{fontFamily:'Playfair Display,serif',fontSize:24,fontWeight:700,color:'#1a1a1a'}}>{k.v}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{background:'#fff',borderRadius:16,marginBottom:20,overflow:'hidden',boxShadow:'0 2px 10px rgba(233,30,99,.04)'}}>
          <div style={{display:'flex',borderBottom:'1px solid rgba(233,30,99,.08)'}}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{flex:1,padding:'14px 8px',background:'none',border:'none',borderBottom:`2px solid ${activeTab===t.id?'#e91e63':'transparent'}`,fontFamily:'Montserrat,sans-serif',fontSize:11,fontWeight:600,letterSpacing:1,color:activeTab===t.id?'#e91e63':'rgba(0,0,0,.4)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,transition:'all .2s',marginBottom:-1}}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>

          <div style={{padding:20}}>

            {/* HOJE */}
            {activeTab==='hoje'&&(
              hoje.length===0
                ? <div style={{textAlign:'center',padding:'40px 20px',color:'rgba(0,0,0,.35)',fontSize:14}}>Nenhum agendamento para hoje 🌸</div>
                : hoje.map(a=>(
                  <div key={a.id} style={{display:'flex',alignItems:'center',gap:16,padding:'14px 0',borderBottom:'1px solid rgba(233,30,99,.06)'}}>
                    <div style={{textAlign:'center',minWidth:54,background:'#fce4ec',borderRadius:10,padding:'8px 4px'}}>
                      <div style={{fontSize:18,fontWeight:700,color:'#c2185b',fontFamily:'Playfair Display,serif'}}>{a.horario}</div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:'#1a1a1a',marginBottom:3}}>{a.cliente}</div>
                      <div style={{fontSize:12,color:'rgba(0,0,0,.5)'}}>{a.servico}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:15,fontWeight:700,color:'#c2185b',marginBottom:4}}>R$ {a.valor}</div>
                      <span style={{padding:'3px 8px',borderRadius:20,fontSize:10,fontWeight:600,background:statusConfig[a.status]?.bg,color:statusConfig[a.status]?.color}}>{statusConfig[a.status]?.label}</span>
                    </div>
                  </div>
                ))
            )}

            {/* PRÓXIMOS */}
            {activeTab==='proximos'&&(
              proximos.length===0
                ? <div style={{textAlign:'center',padding:'40px 20px',color:'rgba(0,0,0,.35)',fontSize:14}}>Sem próximos agendamentos 📅</div>
                : proximos.map(a=>(
                  <div key={a.id} style={{display:'flex',alignItems:'center',gap:16,padding:'14px 0',borderBottom:'1px solid rgba(233,30,99,.06)'}}>
                    <div style={{textAlign:'center',minWidth:70,background:'#fce4ec',borderRadius:10,padding:'8px 6px'}}>
                      <div style={{fontSize:11,color:'#c2185b',fontWeight:600}}>{a.data.slice(0,5)}</div>
                      <div style={{fontSize:16,fontWeight:700,color:'#c2185b',fontFamily:'Playfair Display,serif'}}>{a.horario}</div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:'#1a1a1a',marginBottom:3}}>{a.cliente}</div>
                      <div style={{fontSize:12,color:'rgba(0,0,0,.5)'}}>{a.servico}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:15,fontWeight:700,color:'#c2185b',marginBottom:4}}>R$ {a.valor}</div>
                      <span style={{padding:'3px 8px',borderRadius:20,fontSize:10,fontWeight:600,background:statusConfig[a.status]?.bg,color:statusConfig[a.status]?.color}}>{statusConfig[a.status]?.label}</span>
                    </div>
                  </div>
                ))
            )}

            {/* HISTÓRICO */}
            {activeTab==='historico'&&(
              historico.length===0
                ? <div style={{textAlign:'center',padding:'40px 20px',color:'rgba(0,0,0,.35)',fontSize:14}}>Nenhum serviço finalizado ainda</div>
                : historico.map(a=>(
                  <div key={a.id} style={{display:'flex',alignItems:'center',gap:16,padding:'14px 0',borderBottom:'1px solid rgba(233,30,99,.06)'}}>
                    <div style={{textAlign:'center',minWidth:70,background:'#f3e5f5',borderRadius:10,padding:'8px 6px'}}>
                      <div style={{fontSize:11,color:'#7b1fa2',fontWeight:600}}>{a.data.slice(0,5)}</div>
                      <div style={{fontSize:16,fontWeight:700,color:'#7b1fa2',fontFamily:'Playfair Display,serif'}}>{a.horario}</div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:'#1a1a1a',marginBottom:3}}>{a.cliente}</div>
                      <div style={{fontSize:12,color:'rgba(0,0,0,.5)'}}>{a.servico}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:15,fontWeight:700,color:'#7b1fa2',marginBottom:4}}>R$ {a.valor}</div>
                      <div style={{fontSize:11,color:'rgba(0,0,0,.4)'}}>Comissão: R$ {Math.round(a.valor*(prof.comissao/100))}</div>
                    </div>
                  </div>
                ))
            )}

            {/* RENDIMENTOS */}
            {activeTab==='rendimentos'&&(
              <div>
                {/* KPIs rendimentos */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
                  {[
                    {l:'Fat. Total (serviços)',  v:`R$ ${totalServicos}`, ic:'📊'},
                    {l:'Sua Comissão Total',      v:`R$ ${minhaComissao}`, ic:'💎'},
                    {l:'Fat. Mês Atual',          v:`R$ ${fatMes}`,        ic:'📅'},
                    {l:'Comissão Mês Atual',      v:`R$ ${comMes}`,        ic:'✨'},
                  ].map(k=>(
                    <div key={k.l} style={{background:'linear-gradient(135deg,#fce4ec,#fdf6f9)',borderRadius:14,padding:18,border:'1px solid rgba(233,30,99,.1)'}}>
                      <div style={{fontSize:9,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(194,24,91,.6)',marginBottom:8}}>{k.l}</div>
                      <div style={{fontFamily:'Playfair Display,serif',fontSize:26,fontWeight:700,color:'#c2185b'}}>{k.v}</div>
                    </div>
                  ))}
                </div>

                {/* Detalhes por serviço */}
                <div style={{background:'#fdf6f9',borderRadius:12,padding:16,marginBottom:16}}>
                  <div style={{fontSize:10,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(194,24,91,.6)',marginBottom:12}}>Regra de Comissão</div>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:56,height:56,borderRadius:'50%',background:'linear-gradient(135deg,#e91e63,#c2185b)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:'#fff'}}>{prof.comissao}%</div>
                    <div>
                      <div style={{fontSize:14,fontWeight:600,color:'#1a1a1a'}}>Comissão por serviço realizado</div>
                      <div style={{fontSize:12,color:'rgba(0,0,0,.4)'}}>A cada R$ 100 em serviços → você recebe R$ {prof.comissao}</div>
                    </div>
                  </div>
                </div>

                {/* Serviços finalizados */}
                <div style={{fontSize:10,fontWeight:600,letterSpacing:3,textTransform:'uppercase',color:'rgba(194,24,91,.6)',marginBottom:12}}>Serviços Realizados</div>
                {historico.map(a=>(
                  <div key={a.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid rgba(233,30,99,.06)'}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a'}}>{a.servico}</div>
                      <div style={{fontSize:11,color:'rgba(0,0,0,.4)'}}>{a.cliente} · {a.data}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:13,color:'rgba(0,0,0,.5)'}}>R$ {a.valor}</div>
                      <div style={{fontSize:13,fontWeight:700,color:'#c2185b'}}>+R$ {Math.round(a.valor*(prof.comissao/100))}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
