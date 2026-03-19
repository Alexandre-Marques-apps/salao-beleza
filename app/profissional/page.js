'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

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
function hojeISO() { return new Date().toISOString().slice(0,10) }
function dmyToISO(dmy) {
  if(!dmy) return ''
  const [dd,mm,yyyy] = dmy.split('/')
  return `${yyyy}-${mm}-${dd}`
}
function isoToDmy(iso) {
  if(!iso) return ''
  const [yyyy,mm,dd] = iso.split('-')
  return `${dd}/${mm}/${yyyy}`
}
function isFuturo(data, horario) {
  if(!data||!horario) return false
  const [dd,mm,yyyy] = data.split('/')
  const [hh,min] = horario.split(':')
  return new Date(Number(yyyy),Number(mm)-1,Number(dd),Number(hh),Number(min)) > new Date()
}

const P='#e91e63', PD='#c2185b', PL='#fce4ec'

// ── UI ─────────────────────────────────────────────────
function Modal({title,onClose,children}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:16,overflowY:'auto'}}>
      <div style={{background:'#fff',borderRadius:20,width:'100%',maxWidth:440,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 80px rgba(0,0,0,.2)'}}>
        <div style={{padding:'16px 20px',borderBottom:`1px solid ${PL}`,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'#fff',zIndex:1,borderRadius:'20px 20px 0 0'}}>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:16}}>{title}</div>
          <button onClick={onClose} style={{background:PL,border:'none',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:18,color:PD,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
        </div>
        <div style={{padding:20}}>{children}</div>
      </div>
    </div>
  )
}
function Lbl({children}){return <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'rgba(194,24,91,.7)',marginBottom:6,marginTop:14}}>{children}</label>}
function Inp({value,onChange,type='text',placeholder,disabled}){
  return <input type={type} value={value??''} onChange={e=>onChange&&onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
    style={{width:'100%',padding:'12px 14px',border:`1.5px solid ${disabled?'rgba(233,30,99,.1)':'rgba(233,30,99,.25)'}`,borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',background:disabled?'#f5f5f5':'#fff',color:disabled?'#aaa':'#1a1a1a',boxSizing:'border-box'}}/>
}
function Sel({value,onChange,children}){
  return <select value={value??''} onChange={e=>onChange&&onChange(e.target.value)}
    style={{width:'100%',padding:'12px 14px',border:'1.5px solid rgba(233,30,99,.25)',borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',background:'#fff',boxSizing:'border-box'}}>{children}</select>
}
function Box({cor,children}){
  const map={amarelo:{bg:'#fff8e1',c:'#e65100'},vermelho:{bg:'#ffebee',c:'#c62828'},verde:{bg:'#e8f5e9',c:'#1b5e20'},azul:{bg:'#e3f2fd',c:'#0d47a1'},rosa:{bg:PL,c:PD}}
  const t=map[cor]||map.amarelo
  return <div style={{background:t.bg,color:t.c,padding:'10px 14px',borderRadius:10,fontSize:12,marginTop:8,lineHeight:1.6}}>{children}</div>
}

export default function Profissional() {
  const [ok,      setOk]      = useState(false)
  const [prof,    setProf]    = useState(null)
  const [loginNome,setLoginNome]= useState('')
  const [loginSenha,setLoginSenha]= useState('')
  const [loginErr,setLoginErr]= useState('')
  const [tab,     setTab]     = useState('hoje')
  const [loading, setLoading] = useState(false)
  const [toast,   setToast]   = useState(null)
  const [modal,   setModal]   = useState(null)
  const [form,    setForm]    = useState({})
  const [ferr,    setFerr]    = useState('')
  const [agData,  setAgData]  = useState(hojeStr())

  // dados
  const [ags,     setAgs]     = useState([])
  const [blocks,  setBlocks]  = useState([])
  const [allProfs,setAllProfs]= useState([])

  function shToast(msg,ok=true){setToast({msg,ok});setTimeout(()=>setToast(null),3000)}
  function F(k){return v=>setForm(f=>({...f,[k]:v}))}
  function closeModal(){setModal(null);setFerr('')}
  function openModal(t,data={}){setForm({...data});setModal(t);setFerr('')}

  // ── CARREGAR ────────────────────────────────────────
  const load = useCallback(async (nomProf) => {
    if(!nomProf) return
    setLoading(true)
    try {
      const [r1,r2,r3] = await Promise.all([
        supabase.from('salon_bookings').select('*')
          .eq('professional_name', nomProf)
          .order('booking_date').order('start_time'),
        supabase.from('salon_blocks').select('*')
          .eq('professional_name', nomProf)
          .order('block_date').order('start_time'),
        supabase.from('salon_professionals').select('*').eq('active',true).order('full_name'),
      ])
      setAgs(r1.data||[])
      setBlocks(r2.data||[])
      setAllProfs(r3.data||[])
    } catch(e) {
      shToast('Erro ao carregar: '+e.message, false)
    }
    setLoading(false)
  }, [])

  useEffect(()=>{ if(ok&&prof) load(prof.full_name) },[ok,prof,load])

  // ── LOGIN ──────────────────────────────────────────
  async function login() {
    if(!loginNome){ setLoginErr('Selecione seu nome'); return }
    if(!loginSenha){ setLoginErr('Digite sua senha'); return }
    setLoading(true)
    const {data,error} = await supabase
      .from('salon_professionals')
      .select('*')
      .eq('full_name', loginNome)
      .eq('active', true)
      .single()
    setLoading(false)
    if(error||!data){ setLoginErr('Profissional não encontrado'); return }
    // senha: usa a coluna 'senha' do banco, se vazia usa padrão 123456
    const senhaCorreta = data.senha || '123456'
    if(loginSenha !== senhaCorreta){
      setLoginErr('Senha incorreta. Senha padrão: 123456')
      return
    }
    setProf(data)
    setOk(true)
    setLoginErr('')
  }

  // ── FINALIZAR ATENDIMENTO ──────────────────────────
  async function finalizarAtendimento() {
    if(!form.valorCobrado){ setFerr('Informe o valor cobrado'); return }
    const valor = Number(form.valorCobrado)
    const comissao_snapshot = prof?.commission_pct || 0
    const valor_comissao = Math.round(valor*(comissao_snapshot/100)*100)/100
    const {error} = await supabase.from('salon_bookings').update({
      status:           'completed',
      price_charged:    valor,
      payment_method:   form.payment_method||'cash',
      commission_pct:   comissao_snapshot,
      commission_value: valor_comissao,
    }).eq('id', form.id)
    if(error){ setFerr('Erro: '+error.message); return }
    closeModal(); shToast('Atendimento finalizado!'); load(prof.full_name)
  }

  // ── BLOQUEIOS ──────────────────────────────────────
  async function salvarBloqueio() {
    if(!form.block_date||!form.start_time||!form.end_time){
      setFerr('Preencha data, início e fim'); return
    }
    if(form.start_time >= form.end_time){
      setFerr('Horário de início deve ser antes do fim'); return
    }
    const payload = {
      professional_name: prof.full_name,
      block_date:        form.block_date,
      start_time:        form.start_time+':00',
      end_time:          form.end_time+':00',
      reason:            form.reason||'',
    }
    const {error} = form.id
      ? await supabase.from('salon_blocks').update(payload).eq('id',form.id)
      : await supabase.from('salon_blocks').insert(payload)
    if(error){ setFerr('Erro: '+error.message); return }
    closeModal(); shToast('Bloqueio salvo!'); load(prof.full_name)
  }

  async function delBloqueio(id) {
    if(!window.confirm('Remover este bloqueio?')) return
    await supabase.from('salon_blocks').delete().eq('id',id)
    shToast('Bloqueio removido!'); load(prof.full_name)
  }

  // ── COMPUTED ──────────────────────────────────────
  const agRows = ags.map(a=>({
    id:           a.id,
    data:         isoToDmy(a.booking_date),
    horario:      (a.start_time||'').slice(0,5),
    client_name:  a.client_name||'',
    service_name: a.service_name||'',
    status:       a.status,
    valorOriginal:Number(a.service_price)||Number(a.price_charged)||0,
    valorCobrado: Number(a.price_charged)||0,
    commission_pct:   Number(a.commission_pct)||0,
    commission_value: Number(a.commission_value)||0,
    payment_method:   a.payment_method||'',
  }))

  const hoje       = hojeStr()
  const agHoje     = agRows.filter(a=>a.data===hoje&&a.status!=='cancelled')
  const agProximos = agRows.filter(a=>a.data>hoje&&a.status!=='cancelled'&&a.status!=='completed')
  const agHistorico= agRows.filter(a=>a.status==='completed')

  // rendimentos
  const mesAtual = new Date().getMonth()
  const anoAtual = new Date().getFullYear()
  const agMes = agHistorico.filter(a=>{
    if(!a.data) return false
    const [dd,mm,yyyy]=a.data.split('/')
    return Number(mm)-1===mesAtual&&Number(yyyy)===anoAtual
  })
  const fatHoje  = agHoje.filter(a=>a.status==='completed').reduce((s,a)=>s+a.valorCobrado,0)
  const comHoje  = agHoje.filter(a=>a.status==='completed').reduce((s,a)=>s+a.commission_value,0)
  const fatMes   = agMes.reduce((s,a)=>s+a.valorCobrado,0)
  const comMes   = agMes.reduce((s,a)=>s+a.commission_value,0)
  const fatTotal = agHistorico.reduce((s,a)=>s+a.valorCobrado,0)
  const comTotal = agHistorico.reduce((s,a)=>s+a.commission_value,0)

  // bloqueios do dia selecionado
  const blocksHoje = blocks.filter(b=>b.block_date===dmyToISO(agData))

  function isBlocked(horario) {
    return blocksHoje.some(b=>{
      const hi=(b.start_time||'').slice(0,5)
      const hf=(b.end_time||'').slice(0,5)
      return horario>=hi&&horario<hf
    })
  }

  const tabs = [
    {id:'hoje',        label:'Hoje',        icon:'📅'},
    {id:'proximos',    label:'Próximos',    icon:'🗓'},
    {id:'agenda',      label:'Minha Agenda',icon:'📋'},
    {id:'rendimentos', label:'Rendimentos', icon:'💰'},
    {id:'bloqueios',   label:'Bloqueios',   icon:'🚫'},
  ]

  // ── LOGIN SCREEN ──────────────────────────────────
  if(!ok) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@300;400;500;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Montserrat',sans-serif;background:linear-gradient(135deg,#fce4ec,#fff);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px;}
      `}</style>
      <div style={{background:'#fff',borderRadius:24,width:'100%',maxWidth:420,overflow:'hidden',boxShadow:'0 12px 50px rgba(233,30,99,.15)'}}>
        <div style={{background:`linear-gradient(135deg,${PL},#fff9fb)`,padding:'36px 28px 28px',textAlign:'center',borderBottom:`1px solid ${PL}`}}>
          <div style={{width:64,height:64,borderRadius:'50%',border:`2px solid ${P}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',background:'#fff'}}>
            <span style={{fontFamily:'Playfair Display,serif',fontSize:15,fontWeight:700,color:P}}>JOU</span>
          </div>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:24,fontWeight:700,color:PD,letterSpacing:3}}>JOUDAT SALON</div>
          <div style={{fontSize:10,letterSpacing:4,color:'rgba(194,24,91,.5)',textTransform:'uppercase',marginTop:5}}>Área do Profissional</div>
        </div>
        <div style={{padding:28}}>
          <Lbl>Seu nome</Lbl>
          <Sel value={loginNome} onChange={v=>{setLoginNome(v);setLoginErr('')}}>
            <option value="">— Selecione —</option>
            {allProfs.length===0
              ? <option disabled>Carregando...</option>
              : allProfs.map(p=><option key={p.id} value={p.full_name}>{p.full_name} — {p.specialty}</option>)
            }
          </Sel>
          <Lbl>Senha</Lbl>
          <input
            type="password" value={loginSenha}
            onChange={e=>{setLoginSenha(e.target.value);setLoginErr('')}}
            onKeyDown={e=>e.key==='Enter'&&login()}
            placeholder="123456"
            style={{width:'100%',padding:'12px 14px',border:`1.5px solid rgba(233,30,99,.25)`,borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',boxSizing:'border-box',marginBottom:4}}
          />
          {loginErr&&<Box cor="vermelho">{loginErr}</Box>}
          <button onClick={login} style={{width:'100%',padding:15,background:`linear-gradient(135deg,${P},${PD})`,border:'none',borderRadius:12,fontFamily:'Montserrat,sans-serif',fontSize:11,fontWeight:700,letterSpacing:4,textTransform:'uppercase',color:'#fff',cursor:'pointer',marginTop:16}}>
            {loading ? 'Carregando...' : 'Acessar Minha Área'}
          </button>
          <div style={{textAlign:'center',marginTop:12,fontSize:11,color:'rgba(0,0,0,.3)',letterSpacing:1}}>Senha padrão: 123456</div>
        </div>
      </div>
      {/* carrega lista de profissionais mesmo antes do login */}
      {allProfs.length===0&&<LoadProfs setAllProfs={setAllProfs}/>}
    </>
  )

  // ── PAINEL ────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@300;400;500;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        html,body{font-family:'Montserrat',sans-serif;background:linear-gradient(160deg,#fce4ec 0%,#fdf6f9 60%);min-height:100vh;color:#1a1a1a;overflow-x:hidden;}
        .card{background:#fff;border-radius:16px;border:1px solid ${PL};box-shadow:0 2px 10px rgba(233,30,99,.05);overflow:hidden;margin-bottom:14px;}
        .card-hd{padding:14px 18px;border-bottom:1px solid ${PL};display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;}
        .card-title{font-family:'Playfair Display',serif;font-size:15px;}
        .btn-pk{padding:9px 14px;background:linear-gradient(135deg,${P},${PD});border:none;border-radius:10px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#fff;cursor:pointer;white-space:nowrap;}
        .btn-ot{padding:7px 11px;background:transparent;border:1.5px solid rgba(233,30,99,.3);border-radius:9px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;color:${P};cursor:pointer;}
        .btn-gr{padding:7px 11px;background:transparent;border:1.5px solid rgba(27,94,32,.3);border-radius:9px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;color:#1b5e20;cursor:pointer;}
        .btn-rd{padding:7px 10px;background:transparent;border:1.5px solid rgba(198,40,40,.25);border-radius:9px;font-family:'Montserrat',sans-serif;font-size:10px;color:#c62828;cursor:pointer;}
        .ag-card{background:#fdf6f9;border-radius:12px;padding:13px;border:1px solid ${PL};display:flex;align-items:center;gap:12px;margin-bottom:10px;}
        .ag-card.fin{background:#f1f8e9;border-color:#c8e6c9;}
        .ag-card.blk{background:#f5f5f5;border-color:#e0e0e0;}
        .kpi-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;}
        @media(min-width:500px){.kpi-grid{grid-template-columns:repeat(4,1fr);}}
        .kpi{background:#fff;border-radius:14px;padding:16px;border:1px solid ${PL};box-shadow:0 2px 8px rgba(233,30,99,.05);}
        .tabs-wrap{display:flex;overflow-x:auto;border-bottom:1px solid ${PL};-webkit-overflow-scrolling:touch;background:#fff;border-radius:16px 16px 0 0;}
        .tab-btn{flex-shrink:0;padding:13px 10px;background:none;border:none;border-bottom:2px solid transparent;font-family:'Montserrat',sans-serif;font-size:11px;font-weight:600;color:rgba(0,0,0,.4);cursor:pointer;display:flex;align-items:center;gap:5px;margin-bottom:-1px;white-space:nowrap;min-width:80px;justify-content:center;}
        .tab-btn.active{color:${P};border-bottom-color:${P};}
        .toast-box{position:fixed;bottom:20px;right:16px;left:16px;padding:13px 18px;border-radius:12px;font-size:13px;font-weight:700;z-index:9999;color:#fff;box-shadow:0 6px 20px rgba(0,0,0,.2);text-align:center;}
        @media(min-width:500px){.toast-box{left:auto;max-width:300px;}}

        /* Agenda grade simples */
        .ag-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
        .ag-tbl{border-collapse:collapse;min-width:200px;width:100%;}
        .ag-tbl th{padding:8px 10px;background:${PL};font-size:10px;font-weight:700;color:${PD};border:1px solid rgba(233,30,99,.12);text-align:center;}
        .ag-tbl td{border:1px solid rgba(233,30,99,.07);padding:4px 6px;height:32px;vertical-align:middle;}
        .ag-tbl td.hcell{background:#fafafa;font-size:11px;font-weight:700;color:${PD};text-align:center;padding:6px 8px;}
        .ag-tbl td.livre{background:#f9fbe7;cursor:default;}
        .ag-tbl td.ocupado{background:linear-gradient(135deg,#fce4ec,#f8bbd0);}
        .ag-tbl td.bloqueado{background:#f0f0f0;}
        .ag-tbl td.fora{background:#fafafa;}
        .ag-tbl td.finalizado{background:linear-gradient(135deg,#c8e6c9,#a5d6a7);}
      `}</style>

      <div style={{maxWidth:800,margin:'0 auto',padding:'16px 14px 40px'}}>

        {/* HEADER */}
        <div className="card" style={{marginBottom:14}}>
          <div style={{padding:'16px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:46,height:46,borderRadius:'50%',background:`linear-gradient(135deg,#f48fb1,${P})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:'#fff',flexShrink:0}}>
                {(prof.full_name||'?')[0]}
              </div>
              <div>
                <div style={{fontFamily:'Playfair Display,serif',fontSize:18}}>Olá, {prof.full_name.split(' ')[0]}!</div>
                <div style={{fontSize:10,color:'rgba(0,0,0,.4)',letterSpacing:2,textTransform:'uppercase'}}>{prof.specialty} · {prof.commission_pct}% comissão</div>
              </div>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <div style={{padding:'5px 10px',background:PL,borderRadius:20,fontSize:10,fontWeight:600,color:PD,whiteSpace:'nowrap'}}>
                {new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'})}
              </div>
              <button onClick={()=>{setOk(false);setProf(null)}} style={{padding:'6px 12px',background:'none',border:`1.5px solid ${PL}`,borderRadius:8,fontFamily:'Montserrat,sans-serif',fontSize:10,fontWeight:600,color:PD,cursor:'pointer',textTransform:'uppercase',letterSpacing:1}}>Sair</button>
            </div>
          </div>
        </div>

        {/* KPI RÁPIDO */}
        <div className="kpi-grid">
          {[
            {l:'Hoje',       v:agHoje.length,       ic:'📅',bg:PL},
            {l:'Finalizados',v:agHoje.filter(a=>a.status==='completed').length,ic:'✅',bg:'#e8f5e9'},
            {l:'Fat. Hoje',  v:`R$ ${fatHoje}`,     ic:'💰',bg:'#fff3e0'},
            {l:'Com. Hoje',  v:`R$ ${comHoje.toFixed(2)}`,ic:'💎',bg:'#f3e5f5'},
          ].map(k=>(
            <div key={k.l} className="kpi">
              <div style={{width:34,height:34,borderRadius:10,background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,marginBottom:8}}>{k.ic}</div>
              <div style={{fontFamily:'Playfair Display,serif',fontSize:20,fontWeight:700,marginBottom:2}}>{k.v}</div>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'rgba(0,0,0,.35)'}}>{k.l}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="card">
          <div className="tabs-wrap">
            {tabs.map(t=>(
              <button key={t.id} className={`tab-btn${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div style={{padding:16}}>
            {loading&&<div style={{textAlign:'center',padding:30,color:'rgba(0,0,0,.3)',fontSize:13}}>Carregando...</div>}

            {!loading&&(<>

              {/* ── HOJE ── */}
              {tab==='hoje'&&(
                agHoje.length===0
                  ? <div style={{textAlign:'center',padding:'30px 20px',color:'rgba(0,0,0,.3)',fontSize:13}}>Nenhum agendamento hoje 🌸</div>
                  : agHoje.map(a=>(
                    <div key={a.id} className={`ag-card${a.status==='completed'?' fin':''}`}>
                      <div style={{width:42,height:42,borderRadius:10,background:a.status==='completed'?'#c8e6c9':PL,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <div style={{fontSize:11,fontWeight:700,color:a.status==='completed'?'#1b5e20':PD}}>{a.horario}</div>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.client_name}</div>
                        <div style={{fontSize:11,color:'rgba(0,0,0,.5)'}}>{a.service_name}</div>
                        {a.status==='completed'&&<div style={{fontSize:11,fontWeight:600,color:'#2e7d32'}}>R$ {a.valorCobrado} · comissão R$ {a.commission_value.toFixed(2)}</div>}
                      </div>
                      <div style={{flexShrink:0}}>
                        {a.status==='completed'
                          ? <span style={{fontSize:11,fontWeight:700,color:'#2e7d32'}}>✓ Finalizado</span>
                          : <button className="btn-gr" style={{fontSize:10,padding:'6px 10px'}} onClick={()=>openModal('finalizar',{...a,valorCobrado:a.valorOriginal})}>✓ Finalizar</button>
                        }
                      </div>
                    </div>
                  ))
              )}

              {/* ── PRÓXIMOS ── */}
              {tab==='proximos'&&(
                agProximos.length===0
                  ? <div style={{textAlign:'center',padding:'30px 20px',color:'rgba(0,0,0,.3)',fontSize:13}}>Nenhum agendamento próximo 📅</div>
                  : agProximos.map(a=>(
                    <div key={a.id} className="ag-card">
                      <div style={{width:52,height:52,borderRadius:10,background:PL,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <div style={{fontSize:10,fontWeight:600,color:PD}}>{a.data.slice(0,5)}</div>
                        <div style={{fontSize:12,fontWeight:700,color:PD}}>{a.horario}</div>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.client_name}</div>
                        <div style={{fontSize:11,color:'rgba(0,0,0,.5)'}}>{a.service_name}</div>
                      </div>
                      <span style={{padding:'3px 8px',borderRadius:20,fontSize:10,fontWeight:600,background:'#fff3e0',color:'#f57c00',flexShrink:0}}>Agendado</span>
                    </div>
                  ))
              )}

              {/* ── AGENDA VISUAL ── */}
              {tab==='agenda'&&(
                <>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,flexWrap:'wrap'}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a'}}>Data:</div>
                    <input type="date" value={dmyToISO(agData)} onChange={e=>setAgData(isoToDmy(e.target.value))}
                      style={{padding:'7px 10px',border:`1.5px solid ${PL}`,borderRadius:9,fontFamily:'Montserrat,sans-serif',fontSize:12,outline:'none'}}/>
                    <button className="btn-pk" style={{fontSize:10,padding:'7px 12px'}} onClick={()=>openModal('bloqueio',{block_date:dmyToISO(agData),start_time:'',end_time:'',reason:''})}>
                      🚫 Bloquear horário
                    </button>
                  </div>
                  <div className="ag-wrap">
                    <table className="ag-tbl">
                      <thead>
                        <tr>
                          <th style={{minWidth:58}}>Horário</th>
                          <th>Status</th>
                          <th>Cliente</th>
                          <th>Serviço</th>
                        </tr>
                      </thead>
                      <tbody>
                        {HORARIOS.filter(h=>{
                          const hi=(prof.schedule_start||'00:00').slice(0,5)
                          const hf=(prof.schedule_end||'23:59').slice(0,5)
                          return h>=hi&&h<=hf
                        }).map(h=>{
                          const ag  = agRows.find(a=>a.data===agData&&a.horario===h)
                          const blk = isBlocked(h)
                          const passado = !isFuturo(agData,h)
                          let cls_name='livre', statusLabel='Livre'
                          if(blk){ cls_name='bloqueado'; statusLabel='🚫 Bloqueado' }
                          else if(ag?.status==='completed'){ cls_name='finalizado'; statusLabel='✅ Finalizado' }
                          else if(ag){ cls_name='ocupado'; statusLabel='📌 Agendado' }
                          else if(passado){ cls_name='fora'; statusLabel='—' }
                          return (
                            <tr key={h}>
                              <td className="hcell">{h}</td>
                              <td className={cls_name} style={{fontSize:11,fontWeight:600}}>{statusLabel}</td>
                              <td style={{fontSize:12}}>{ag?.client_name||''}</td>
                              <td style={{fontSize:12,color:'rgba(0,0,0,.5)'}}>{ag?.service_name||''}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ── RENDIMENTOS ── */}
              {tab==='rendimentos'&&(
                <>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                    {[
                      {l:'Fat. Mês',    v:`R$ ${fatMes.toFixed(2)}`,   ic:'📊'},
                      {l:'Com. Mês',    v:`R$ ${comMes.toFixed(2)}`,   ic:'💎'},
                      {l:'Fat. Total',  v:`R$ ${fatTotal.toFixed(2)}`, ic:'📈'},
                      {l:'Com. Total',  v:`R$ ${comTotal.toFixed(2)}`, ic:'🏆'},
                    ].map(k=>(
                      <div key={k.l} style={{background:`linear-gradient(135deg,${PL},#fdf6f9)`,borderRadius:14,padding:16,border:`1px solid rgba(233,30,99,.1)`}}>
                        <div style={{fontSize:9,fontWeight:700,letterSpacing:3,textTransform:'uppercase',color:'rgba(194,24,91,.6)',marginBottom:8}}>{k.l}</div>
                        <div style={{fontFamily:'Playfair Display,serif',fontSize:22,fontWeight:700,color:PD}}>{k.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Regra de comissão */}
                  <div style={{background:'#f3e5f5',borderRadius:12,padding:'14px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:14}}>
                    <div style={{width:48,height:48,borderRadius:'50%',background:`linear-gradient(135deg,${P},${PD})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#fff',flexShrink:0}}>{prof.commission_pct}%</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:3}}>Comissão atual: {prof.commission_pct}%</div>
                      <div style={{fontSize:11,color:'rgba(0,0,0,.5)'}}>Cada comissão é registrada no momento do fechamento e não muda mesmo se a % for alterada depois.</div>
                    </div>
                  </div>

                  {/* Lista de serviços do mês */}
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:'uppercase',color:'rgba(194,24,91,.6)',marginBottom:12}}>Serviços do mês atual</div>
                  {agMes.length===0
                    ? <div style={{textAlign:'center',padding:20,color:'rgba(0,0,0,.3)',fontSize:13}}>Nenhum serviço finalizado este mês</div>
                    : agMes.map(a=>(
                      <div key={a.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 0',borderBottom:`1px solid rgba(233,30,99,.06)`}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:600}}>{a.service_name}</div>
                          <div style={{fontSize:11,color:'rgba(0,0,0,.4)'}}>{a.client_name} · {a.data} · {a.commission_pct}%</div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:12,color:'rgba(0,0,0,.4)'}}>R$ {a.valorCobrado}</div>
                          <div style={{fontSize:13,fontWeight:700,color:PD}}>+R$ {a.commission_value.toFixed(2)}</div>
                        </div>
                      </div>
                    ))
                  }
                </>
              )}

              {/* ── BLOQUEIOS ── */}
              {tab==='bloqueios'&&(
                <>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8}}>
                    <div style={{fontSize:13,color:'rgba(0,0,0,.5)'}}>Gerencie suas ausências e indisponibilidades</div>
                    <button className="btn-pk" onClick={()=>openModal('bloqueio',{block_date:'',start_time:'',end_time:'',reason:''})}>+ Novo Bloqueio</button>
                  </div>
                  {blocks.length===0
                    ? <div style={{textAlign:'center',padding:30,color:'rgba(0,0,0,.3)',fontSize:13}}>Nenhum bloqueio cadastrado 🗓</div>
                    : blocks.map(b=>(
                      <div key={b.id} style={{border:`1px solid #e0e0e0`,borderRadius:12,padding:'13px 14px',marginBottom:10,display:'flex',alignItems:'center',gap:12,background:'#f9f9f9'}}>
                        <div style={{width:42,height:42,borderRadius:10,background:'#f0f0f0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <div style={{fontSize:10,fontWeight:600,color:'#666'}}>{isoToDmy(b.block_date).slice(0,5)}</div>
                          <div style={{fontSize:10,color:'#888'}}>{(b.start_time||'').slice(0,5)}</div>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a'}}>{(b.start_time||'').slice(0,5)} – {(b.end_time||'').slice(0,5)}</div>
                          <div style={{fontSize:11,color:'rgba(0,0,0,.5)'}}>{isoToDmy(b.block_date)} · {b.reason||'Sem motivo informado'}</div>
                        </div>
                        <div style={{display:'flex',gap:6,flexShrink:0}}>
                          <button className="btn-ot" style={{fontSize:10,padding:'5px 8px'}} onClick={()=>openModal('bloqueio',{...b,block_date:b.block_date,start_time:(b.start_time||'').slice(0,5),end_time:(b.end_time||'').slice(0,5)})}>✏️</button>
                          <button className="btn-rd" style={{fontSize:10,padding:'5px 8px'}} onClick={()=>delBloqueio(b.id)}>🗑</button>
                        </div>
                      </div>
                    ))
                  }
                </>
              )}

            </>)}
          </div>
        </div>
      </div>

      {/* ══ MODAL FINALIZAR ══ */}
      {modal==='finalizar'&&(
        <Modal title="✓ Finalizar Atendimento" onClose={closeModal}>
          <Box cor="verde">
            <strong>{form.client_name}</strong> — {form.service_name}<br/>
            <span style={{fontSize:11,opacity:.8}}>{form.data} às {form.horario}</span>
          </Box>
          <Lbl>Valor do serviço</Lbl>
          <Inp value={`R$ ${form.valorOriginal||0}`} disabled/>
          <Lbl>Valor cobrado * (ajuste se houve desconto)</Lbl>
          <Inp type="number" value={form.valorCobrado||''} onChange={F('valorCobrado')} placeholder="Valor recebido"/>
          {form.valorCobrado&&Number(form.valorCobrado)<Number(form.valorOriginal)&&(
            <Box cor="amarelo">⚠️ Desconto de R$ {(Number(form.valorOriginal)-Number(form.valorCobrado)).toFixed(2)}</Box>
          )}
          {form.valorCobrado&&(
            <Box cor="azul">
              💎 Sua comissão ({prof.commission_pct}%): <strong>R$ {(Number(form.valorCobrado)*(prof.commission_pct/100)).toFixed(2)}</strong>
              <br/><span style={{fontSize:10,opacity:.7}}>Este valor fica registrado e não muda se a comissão for alterada futuramente.</span>
            </Box>
          )}
          <Lbl>Forma de pagamento</Lbl>
          <Sel value={form.payment_method||'cash'} onChange={F('payment_method')}>
            <option value="cash">💵 Dinheiro</option>
            <option value="pix">📱 PIX</option>
            <option value="credit_card">💳 Crédito</option>
            <option value="debit_card">💳 Débito</option>
          </Sel>
          {ferr&&<Box cor="vermelho">{ferr}</Box>}
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button className="btn-pk" style={{flex:1,background:'linear-gradient(135deg,#2e7d32,#1b5e20)'}} onClick={finalizarAtendimento}>✓ Confirmar</button>
            <button className="btn-ot" onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL BLOQUEIO ══ */}
      {modal==='bloqueio'&&(
        <Modal title={form.id?'Editar Bloqueio':'Novo Bloqueio de Agenda'} onClose={closeModal}>
          <Box cor="amarelo">🚫 Os horários bloqueados ficarão indisponíveis para agendamento pelo admin.</Box>
          <Lbl>Data *</Lbl>
          <input type="date" min={hojeISO()} value={form.block_date||''} onChange={e=>setForm(f=>({...f,block_date:e.target.value}))}
            style={{width:'100%',padding:'12px 14px',border:`1.5px solid rgba(233,30,99,.25)`,borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
          <Lbl>Horário início *</Lbl>
          <Sel value={form.start_time||''} onChange={F('start_time')}>
            <option value="">Selecionar...</option>
            {HORARIOS.map(h=><option key={h}>{h}</option>)}
          </Sel>
          <Lbl>Horário fim *</Lbl>
          <Sel value={form.end_time||''} onChange={F('end_time')}>
            <option value="">Selecionar...</option>
            {HORARIOS.filter(h=>h>(form.start_time||'00:00')).map(h=><option key={h}>{h}</option>)}
          </Sel>
          <Lbl>Motivo (opcional)</Lbl>
          <Inp value={form.reason} onChange={F('reason')} placeholder="Ex: Consulta médica, folga..."/>
          {ferr&&<Box cor="vermelho">{ferr}</Box>}
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button className="btn-pk" style={{flex:1}} onClick={salvarBloqueio}>Salvar</button>
            <button className="btn-ot" onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {toast&&<div className="toast-box" style={{background:toast.ok?'#2e7d32':'#c62828'}}>{toast.msg}</div>}
    </>
  )
}

// Componente auxiliar para carregar profissionais antes do login
function LoadProfs({setAllProfs}) {
  useEffect(()=>{
    supabase.from('salon_professionals').select('*').eq('active',true).order('full_name')
      .then(({data})=>{ if(data) setAllProfs(data) })
  },[setAllProfs])
  return null
}
