'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

// Supabase inline — evita problemas de import de caminho
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const ADMIN_USER = 'Alexandre'
const ADMIN_PASS = '123456'

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
const SB_W = 220

// ── UI HELPERS ─────────────────────────────────────────
function Modal({title, onClose, children}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16,overflowY:'auto'}}>
      <div style={{background:'#fff',borderRadius:20,width:'100%',maxWidth:460,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 80px rgba(0,0,0,.2)'}}>
        <div style={{padding:'16px 20px',borderBottom:`1px solid ${PL}`,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'#fff',zIndex:1,borderRadius:'20px 20px 0 0'}}>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:16,color:'#1a1a1a'}}>{title}</div>
          <button onClick={onClose} style={{background:PL,border:'none',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:18,color:PD,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>×</button>
        </div>
        <div style={{padding:20}}>{children}</div>
      </div>
    </div>
  )
}

function Lbl({children}) {
  return <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'rgba(194,24,91,.7)',marginBottom:6,marginTop:14}}>{children}</label>
}
function Inp({value, onChange, type='text', placeholder, disabled}) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange && onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width:'100%',padding:'12px 14px',
        border:`1.5px solid ${disabled?'rgba(233,30,99,.1)':'rgba(233,30,99,.25)'}`,
        borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',
        background:disabled?'#f5f5f5':'#fff',color:disabled?'#aaa':'#1a1a1a',
        boxSizing:'border-box',
      }}
    />
  )
}
function Sel({value, onChange, children}) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange && onChange(e.target.value)}
      style={{
        width:'100%',padding:'12px 14px',
        border:'1.5px solid rgba(233,30,99,.25)',
        borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',
        background:'#fff',boxSizing:'border-box',
      }}
    >
      {children}
    </select>
  )
}
function Box({cor, children}) {
  const map = {
    amarelo:{bg:'#fff8e1',c:'#e65100'},
    vermelho:{bg:'#ffebee',c:'#c62828'},
    verde:{bg:'#e8f5e9',c:'#1b5e20'},
    azul:{bg:'#e3f2fd',c:'#0d47a1'},
    rosa:{bg:PL,c:PD},
  }
  const t = map[cor] || map.amarelo
  return <div style={{background:t.bg,color:t.c,padding:'10px 14px',borderRadius:10,fontSize:12,marginTop:8,lineHeight:1.6}}>{children}</div>
}

// ── MAIN COMPONENT ─────────────────────────────────────
export default function Admin() {
  const [ok,      setOk]      = useState(false)
  const [lu,      setLu]      = useState('')
  const [lp,      setLp]      = useState('')
  const [lerr,    setLerr]    = useState('')
  const [tab,     setTab]     = useState('dashboard')
  const [sbOpen,  setSbOpen]  = useState(false)
  const [agData,  setAgData]  = useState(hojeStr())
  const [busca,   setBusca]   = useState('')
  const [toast,   setToast]   = useState(null)
  const [modal,   setModal]   = useState(null)
  const [form,    setForm]    = useState({})
  const [ferr,    setFerr]    = useState('')
  const [loading, setLoading] = useState(false)

  const [ags,   setAgs]   = useState([])
  const [cls,   setCls]   = useState([])
  const [profs, setProfs] = useState([])
  const [srvs,  setSrvs]  = useState([])
  const [cats,  setCats]  = useState([])

  function shToast(msg, ok=true) {
    setToast({msg, ok})
    setTimeout(() => setToast(null), 3000)
  }
  function F(k) { return v => setForm(f => ({...f, [k]:v})) }
  function closeModal() { setModal(null); setFerr('') }
  function openModal(t, data={}) { setForm({...data}); setModal(t); setFerr('') }

  // ── LOAD ──────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [r1,r2,r3,r4,r5] = await Promise.all([
        supabase.from('salon_bookings').select('*').order('booking_date').order('start_time'),
        supabase.from('salon_clients').select('*').order('full_name'),
        supabase.from('salon_professionals').select('*').eq('active',true).order('full_name'),
        supabase.from('services').select('*, service_categories(name)').eq('active',true).order('name'),
        supabase.from('service_categories').select('*').order('name'),
      ])
      if(r1.error) throw new Error('bookings: '+r1.error.message)
      if(r2.error) throw new Error('clients: '+r2.error.message)
      if(r3.error) throw new Error('professionals: '+r3.error.message)
      setAgs(r1.data||[])
      setCls(r2.data||[])
      setProfs(r3.data||[])
      setSrvs(r4.data||[])
      setCats(r5.data||[])
    } catch(e) {
      shToast('Erro: '+e.message, false)
    }
    setLoading(false)
  }, [])

  useEffect(() => { if(ok) load() }, [ok, load])

  function login() {
    if(lu===ADMIN_USER && lp===ADMIN_PASS) { setOk(true); setLerr('') }
    else setLerr('Usuário ou senha incorretos')
  }

  // ── AGENDAMENTOS ──────────────────────────────────────
  async function saveAg() {
    setFerr('')
    if(!form.client_name||!form.service_name||!form.professional_name||!form.data||!form.start_time) {
      setFerr('Preencha todos os campos'); return
    }
    const srv = srvs.find(s => s.name === form.service_name)
    const payload = {
      client_name:       form.client_name,
      service_name:      form.service_name,
      professional_name: form.professional_name,
      booking_date:      dmyToISO(form.data),
      start_time:        form.start_time.length===5 ? form.start_time+':00' : form.start_time,
      status:            'scheduled',
      price_charged:     srv?.price||0,
      service_price:     srv?.price||0,
    }
    const {error} = form.id
      ? await supabase.from('salon_bookings').update(payload).eq('id',form.id)
      : await supabase.from('salon_bookings').insert(payload)
    if(error) { setFerr('Erro: '+error.message); return }
    closeModal(); shToast('Agendamento salvo!'); load()
  }

  async function delAg(id) {
    if(!window.confirm('Excluir este agendamento?')) return
    const {error} = await supabase.from('salon_bookings').delete().eq('id',id)
    if(error) { shToast('Erro: '+error.message, false); return }
    shToast('Removido!'); load()
  }

  async function confirmarFechamento() {
    if(!form.valorCobrado) { setFerr('Informe o valor cobrado'); return }
    const {error} = await supabase.from('salon_bookings').update({
      status:         'completed',
      price_charged:  Number(form.valorCobrado),
      payment_method: form.payment_method||'cash',
    }).eq('id', form.id)
    if(error) { setFerr('Erro: '+error.message); return }
    const cliente = cls.find(c => c.full_name === form.client_name)
    if(cliente) {
      await supabase.from('salon_clients').update({
        visits:      (cliente.visits||0)+1,
        total_spent: (Number(cliente.total_spent)||0)+Number(form.valorCobrado),
        last_visit:  dmyToISO(form.data),
      }).eq('id', cliente.id)
    }
    closeModal(); shToast('Atendimento finalizado!'); load()
  }

  // ── CLIENTES ──────────────────────────────────────────
  async function saveCl() {
    if(!form.full_name) { setFerr('Informe o nome'); return }
    const payload = { full_name:form.full_name.trim(), phone:form.phone||'', email:form.email||'' }
    const {error} = form.id
      ? await supabase.from('salon_clients').update(payload).eq('id',form.id)
      : await supabase.from('salon_clients').insert(payload)
    if(error) { setFerr('Erro: '+error.message); return }
    closeModal(); shToast('Cliente salvo!'); load()
  }

  async function delCl(id) {
    if(!window.confirm('Excluir cliente?')) return
    await supabase.from('salon_clients').delete().eq('id',id)
    shToast('Removido!'); load()
  }

  // ── PROFISSIONAIS ─────────────────────────────────────
  async function saveProf() {
    if(!form.full_name) { setFerr('Informe o nome'); return }
    const payload = {
      full_name:      form.full_name.trim(),
      phone:          form.phone||'',
      specialty:      form.specialty||'',
      commission_pct: Number(form.commission_pct)||40,
      schedule_start: form.schedule_start||'08:00',
      schedule_end:   form.schedule_end||'18:00',
      active:         true,
    }
    const {error} = form.id
      ? await supabase.from('salon_professionals').update(payload).eq('id',form.id)
      : await supabase.from('salon_professionals').insert(payload)
    if(error) { setFerr('Erro: '+error.message); return }
    closeModal(); shToast('Profissional salvo!'); load()
  }

  async function delProf(id) {
    if(!window.confirm('Remover profissional?')) return
    await supabase.from('salon_professionals').update({active:false}).eq('id',id)
    shToast('Removido!'); load()
  }

  // ── SERVIÇOS ──────────────────────────────────────────
  async function saveSrv() {
    if(!form.name) { setFerr('Informe o nome'); return }
    const cat = cats.find(c => c.name === form.categoria)
    const payload = {
      name:         form.name.trim(),
      price:        Number(form.price)||0,
      duration_min: Number(form.duration_min)||30,
      category_id:  cat?.id||null,
      active:       true,
    }
    const {error} = form.id
      ? await supabase.from('services').update(payload).eq('id',form.id)
      : await supabase.from('services').insert(payload)
    if(error) { setFerr('Erro: '+error.message); return }
    closeModal(); shToast('Serviço salvo!'); load()
  }

  async function delSrv(id) {
    if(!window.confirm('Excluir serviço?')) return
    await supabase.from('services').update({active:false}).eq('id',id)
    shToast('Removido!'); load()
  }

  // ── COMPUTED ──────────────────────────────────────────
  const agRows = ags.map(a => ({
    id:               a.id,
    data:             isoToDmy(a.booking_date),
    horario:          (a.start_time||'').slice(0,5),
    client_name:      a.client_name||'',
    service_name:     a.service_name||'',
    professional_name:a.professional_name||'',
    status:           a.status,
    valorOriginal:    Number(a.service_price)||Number(a.price_charged)||0,
    valorCobrado:     Number(a.price_charged)||0,
    payment_method:   a.payment_method||'',
  }))

  const hoje      = hojeStr()
  const agHoje    = agRows.filter(a => a.data===hoje && a.status!=='cancelled')
  const agendaDia = agRows.filter(a => a.data===agData && a.status!=='cancelled')
  const fatHoje   = agRows.filter(a => a.data===hoje && a.status==='completed').reduce((s,a)=>s+a.valorCobrado,0)
  const fatMes    = agRows.filter(a => a.status==='completed').reduce((s,a)=>s+a.valorCobrado,0)

  function getCel(h, nomP) { return agendaDia.find(a => a.horario===h && a.professional_name===nomP) }

  function horariosLivres(nomeProf, data) {
    if(!nomeProf||!data) return HORARIOS
    const p = profs.find(x => x.full_name===nomeProf)
    const hi = (p?.schedule_start||'00:00').slice(0,5)
    const hf = (p?.schedule_end||'23:59').slice(0,5)
    return HORARIOS.filter(h => {
      if(h<hi||h>hf) return false
      if(!isFuturo(data,h)) return false
      return !agRows.find(a => a.professional_name===nomeProf&&a.data===data&&a.horario===h&&a.status!=='cancelled'&&a.id!==form.id)
    })
  }

  const clsFilt = cls.filter(c =>
    (c.full_name||'').toLowerCase().includes(busca.toLowerCase()) ||
    (c.phone||'').includes(busca)
  )

  const menus = [
    {id:'dashboard',     icon:'◈', label:'Dashboard'},
    {id:'agenda',        icon:'◷', label:'Agenda'},
    {id:'clientes',      icon:'◉', label:'Clientes'},
    {id:'profissionais', icon:'✦', label:'Profissionais'},
    {id:'servicos',      icon:'✂', label:'Serviços'},
    {id:'financeiro',    icon:'◎', label:'Financeiro'},
    {id:'configuracoes', icon:'⊙', label:'Config.'},
  ]

  // ── LOGIN ─────────────────────────────────────────────
  if(!ok) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@300;400;500;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Montserrat',sans-serif;background:linear-gradient(135deg,#fce4ec,#fff);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px;}
      `}</style>
      <div style={{background:'#fff',borderRadius:24,width:'100%',maxWidth:400,overflow:'hidden',boxShadow:'0 12px 50px rgba(233,30,99,.15)'}}>
        <div style={{background:`linear-gradient(135deg,${PL},#fff9fb)`,padding:'36px 28px 28px',textAlign:'center',borderBottom:`1px solid ${PL}`}}>
          <div style={{width:64,height:64,borderRadius:'50%',border:`2px solid ${P}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',background:'#fff'}}>
            <span style={{fontFamily:'Playfair Display,serif',fontSize:15,fontWeight:700,color:P}}>JOU</span>
          </div>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:24,fontWeight:700,color:PD,letterSpacing:3}}>JOUDAT SALON</div>
          <div style={{fontSize:10,letterSpacing:4,color:'rgba(194,24,91,.5)',textTransform:'uppercase',marginTop:5}}>Painel Administrativo</div>
        </div>
        <div style={{padding:28}}>
          <Lbl>Usuário</Lbl>
          <Inp value={lu} onChange={setLu} placeholder="Alexandre"/>
          <Lbl>Senha</Lbl>
          <input
            type="password" value={lp}
            onChange={e=>setLp(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&login()}
            placeholder="••••••"
            style={{width:'100%',padding:'12px 14px',border:`1.5px solid rgba(233,30,99,.25)`,borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',boxSizing:'border-box'}}
          />
          {lerr && <Box cor="vermelho">{lerr}</Box>}
          <button onClick={login} style={{width:'100%',padding:15,background:`linear-gradient(135deg,${P},${PD})`,border:'none',borderRadius:12,fontFamily:'Montserrat,sans-serif',fontSize:11,fontWeight:700,letterSpacing:4,textTransform:'uppercase',color:'#fff',cursor:'pointer',marginTop:16}}>
            Entrar
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
        html,body{font-family:'Montserrat',sans-serif;background:#fdf6f9;color:#1a1a1a;min-height:100vh;overflow-x:hidden;}

        /* OVERLAY */
        .ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:200;}
        .ov.on{display:block;}

        /* SIDEBAR */
        .sb{
          position:fixed;top:0;left:0;bottom:0;width:${SB_W}px;
          background:linear-gradient(180deg,${PD} 0%,#880e4f 100%);
          display:flex;flex-direction:column;
          z-index:300;
          transform:translateX(-${SB_W}px);
          transition:transform .28s cubic-bezier(.4,0,.2,1);
          box-shadow:4px 0 20px rgba(0,0,0,.15);
        }
        .sb.on{transform:translateX(0);}

        /* MAIN sempre ocupa 100% da tela */
        .main{
          width:100%;min-height:100vh;
          display:flex;flex-direction:column;
        }

        /* TOPBAR */
        .topbar{
          background:#fff;
          padding:12px 16px;
          display:flex;align-items:center;justify-content:space-between;
          border-bottom:1px solid ${PL};
          position:sticky;top:0;z-index:100;
          box-shadow:0 2px 8px rgba(233,30,99,.06);
          width:100%;
        }

        /* CONTENT */
        .content{padding:16px;flex:1;width:100%;overflow-x:hidden;}

        /* KPIS */
        .kpis{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;}
        @media(min-width:600px){.kpis{grid-template-columns:repeat(4,1fr);}}

        .kpi{background:#fff;border-radius:14px;padding:16px;border:1px solid ${PL};box-shadow:0 2px 8px rgba(233,30,99,.05);}

        /* CARD */
        .card{background:#fff;border-radius:14px;border:1px solid ${PL};box-shadow:0 2px 8px rgba(233,30,99,.05);overflow:hidden;margin-bottom:14px;width:100%;}
        .card-hd{padding:13px 16px;border-bottom:1px solid ${PL};display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;}
        .card-title{font-family:'Playfair Display',serif;font-size:15px;}

        /* BOTÕES */
        .btn-pk{padding:9px 14px;background:linear-gradient(135deg,${P},${PD});border:none;border-radius:10px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#fff;cursor:pointer;white-space:nowrap;flex-shrink:0;}
        .btn-pk:active{opacity:.85;}
        .btn-ot{padding:7px 11px;background:transparent;border:1.5px solid rgba(233,30,99,.3);border-radius:9px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;color:${P};cursor:pointer;white-space:nowrap;}
        .btn-ot:active{background:${PL};}
        .btn-gr{padding:7px 11px;background:transparent;border:1.5px solid rgba(27,94,32,.3);border-radius:9px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;color:#1b5e20;cursor:pointer;white-space:nowrap;}
        .btn-gr:active{background:#e8f5e9;}
        .btn-rd{padding:7px 10px;background:transparent;border:1.5px solid rgba(198,40,40,.25);border-radius:9px;font-family:'Montserrat',sans-serif;font-size:10px;color:#c62828;cursor:pointer;}
        .btn-rd:active{background:#ffebee;}
        .btn-bl{padding:7px 11px;background:transparent;border:1.5px solid rgba(13,71,161,.25);border-radius:9px;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;color:#0d47a1;cursor:pointer;}

        /* TABELA */
        .tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
        .tbl{width:100%;border-collapse:collapse;min-width:400px;}
        .tbl th{padding:9px 12px;text-align:left;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(0,0,0,.3);border-bottom:1px solid ${PL};white-space:nowrap;}
        .tbl td{padding:11px 12px;font-size:13px;border-bottom:1px solid rgba(233,30,99,.04);}
        .tbl tr:last-child td{border-bottom:none;}
        .bdg{padding:3px 8px;border-radius:20px;font-size:10px;font-weight:600;white-space:nowrap;}

        /* AG CARDS */
        .ag-cards{display:flex;flex-direction:column;gap:10px;padding:12px;}
        .ag-card{background:#fdf6f9;border-radius:12px;padding:13px;border:1px solid ${PL};display:flex;align-items:center;gap:12px;width:100%;}
        .ag-card.fin{background:#f1f8e9;border-color:#c8e6c9;}

        /* GRADE AGENDA */
        .ag-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;width:100%;}
        .ag-tbl{border-collapse:collapse;min-width:400px;}
        .ag-tbl th{padding:8px 8px;background:${PL};font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${PD};border:1px solid rgba(233,30,99,.12);text-align:center;white-space:nowrap;}
        .ag-tbl th.hcol{background:#fff3e0;color:#f57c00;min-width:52px;}
        .ag-tbl td{border:1px solid rgba(233,30,99,.07);padding:2px 3px;vertical-align:top;min-width:100px;height:34px;position:relative;}
        .ag-tbl td.hcell{background:#fafafa;padding:6px 8px;font-size:11px;font-weight:700;color:${PD};text-align:center;cursor:default;min-width:52px;}
        .ag-tbl td.cinza{background:#f0f0f0;cursor:default;}
        .ag-tbl td.livre{cursor:pointer;}
        .ag-tbl td.livre:hover{background:#fdf0f5;}
        .cell-card{border-radius:6px;padding:4px 22px 4px 6px;height:100%;min-height:28px;position:relative;cursor:pointer;}
        .del-btn{position:absolute;top:2px;right:2px;background:rgba(0,0,0,.12);border:none;border-radius:4px;width:18px;height:18px;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;}

        /* GRIDS */
        .prof-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;padding:14px;}
        .prof-card{border:1px solid ${PL};border-radius:14px;padding:14px;text-align:center;}
        .srv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;padding:14px;}
        .srv-card{border:1px solid ${PL};border-radius:12px;padding:13px;}
        .fin-grid{display:grid;grid-template-columns:1fr;gap:14px;}
        @media(min-width:700px){.fin-grid{grid-template-columns:1fr 1fr;}}

        /* SEARCH */
        .sw{position:relative;margin-bottom:12px;}
        .si{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:13px;color:rgba(233,30,99,.4);}
        .sinp{width:100%;padding:11px 11px 11px 34px;border:1.5px solid ${PL};border-radius:10px;font-family:'Montserrat',sans-serif;font-size:13px;outline:none;background:#fff;box-sizing:border-box;}
        .sinp:focus{border-color:${P};}

        /* TOAST */
        .toast-box{position:fixed;bottom:20px;right:16px;left:16px;padding:13px 18px;border-radius:12px;font-size:13px;font-weight:700;z-index:9999;color:#fff;box-shadow:0 6px 20px rgba(0,0,0,.2);text-align:center;}
        @media(min-width:500px){.toast-box{left:auto;width:auto;max-width:320px;}}
      `}</style>

      {/* OVERLAY */}
      <div className={`ov${sbOpen?' on':''}`} onClick={()=>setSbOpen(false)}/>

      {/* SIDEBAR */}
      <aside className={`sb${sbOpen?' on':''}`}>
        <div style={{padding:'18px 14px',borderBottom:'1px solid rgba(255,255,255,.12)',display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,borderRadius:'50%',border:'1.5px solid rgba(255,255,255,.5)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Playfair Display,serif',fontSize:10,fontWeight:700,color:'#fff',flexShrink:0}}>JOU</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:'Playfair Display,serif',fontSize:13,fontWeight:700,color:'#fff',letterSpacing:2}}>JOUDAT</div>
            <div style={{fontSize:8,letterSpacing:3,color:'rgba(255,255,255,.5)',textTransform:'uppercase'}}>Admin</div>
          </div>
          <button
            onClick={()=>setSbOpen(false)}
            style={{background:'rgba(255,255,255,.15)',border:'none',borderRadius:8,width:30,height:30,cursor:'pointer',color:'#fff',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}
          >×</button>
        </div>
        <nav style={{flex:1,padding:'8px 0',overflowY:'auto'}}>
          {menus.map(m=>(
            <div
              key={m.id}
              onClick={()=>{ setTab(m.id); setBusca(''); setSbOpen(false) }}
              style={{
                display:'flex',alignItems:'center',gap:12,padding:'13px 16px',
                cursor:'pointer',
                borderLeft:`3px solid ${tab===m.id?'#fff':'transparent'}`,
                background:tab===m.id?'rgba(255,255,255,.15)':'transparent',
                transition:'background .2s',
              }}
            >
              <span style={{fontSize:14,color:tab===m.id?'#fff':'rgba(255,255,255,.6)',width:18,textAlign:'center',flexShrink:0}}>{m.icon}</span>
              <span style={{fontSize:12,fontWeight:tab===m.id?700:400,color:tab===m.id?'#fff':'rgba(255,255,255,.7)'}}>{m.label}</span>
            </div>
          ))}
        </nav>
        <div style={{padding:'12px 14px',borderTop:'1px solid rgba(255,255,255,.12)',display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:30,height:30,borderRadius:'50%',background:'rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#fff',fontWeight:700,flexShrink:0}}>A</div>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:'#fff'}}>{ADMIN_USER}</div>
            <div style={{fontSize:9,letterSpacing:2,color:'rgba(255,255,255,.5)',textTransform:'uppercase'}}>Admin</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main">

        {/* TOPBAR */}
        <div className="topbar">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <button
              onClick={()=>setSbOpen(v=>!v)}
              style={{width:38,height:38,borderRadius:10,border:`1.5px solid ${PL}`,background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,color:PD,flexShrink:0}}
            >☰</button>
            <div style={{fontFamily:'Playfair Display,serif',fontSize:16,color:'#1a1a1a',whiteSpace:'nowrap'}}>{menus.find(m=>m.id===tab)?.label}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{padding:'5px 10px',background:PL,borderRadius:20,fontSize:10,fontWeight:600,color:PD,whiteSpace:'nowrap'}}>
              {new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'})}
            </div>
            <button onClick={()=>load()} style={{width:34,height:34,borderRadius:8,border:`1px solid ${PL}`,background:'#fff',cursor:'pointer',fontSize:16,color:PD,display:'flex',alignItems:'center',justifyContent:'center'}} title="Atualizar">↻</button>
            <button onClick={()=>setOk(false)} style={{padding:'6px 10px',background:'none',border:`1.5px solid ${PL}`,borderRadius:8,fontFamily:'Montserrat,sans-serif',fontSize:10,fontWeight:600,color:PD,cursor:'pointer',textTransform:'uppercase',letterSpacing:1}}>Sair</button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="content">
          {loading && <div style={{textAlign:'center',padding:40,color:'rgba(0,0,0,.35)',fontSize:13}}>Carregando...</div>}

          {!loading && (<>

            {/* ══ DASHBOARD ══ */}
            {tab==='dashboard' && (<>
              <div className="kpis">
                {[
                  {l:'Fat. Hoje',    v:`R$ ${fatHoje}`,  ic:'💰', bg:PL},
                  {l:'Agendamentos', v:agHoje.length,     ic:'📅', bg:'#e8f5e9'},
                  {l:'Clientes',     v:cls.length,         ic:'👥', bg:'#fff3e0'},
                  {l:'Profissionais',v:profs.length,       ic:'✦',  bg:'#f3e5f5'},
                ].map(k=>(
                  <div key={k.l} className="kpi">
                    <div style={{width:36,height:36,borderRadius:10,background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,marginBottom:10}}>{k.ic}</div>
                    <div style={{fontFamily:'Playfair Display,serif',fontSize:24,fontWeight:700,marginBottom:2}}>{k.v}</div>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'rgba(0,0,0,.35)'}}>{k.l}</div>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card-hd">
                  <div className="card-title">Agenda de Hoje</div>
                  <button className="btn-ot" onClick={()=>setTab('agenda')}>Ver grade →</button>
                </div>
                <div className="ag-cards">
                  {agHoje.length===0
                    ? <div style={{textAlign:'center',padding:20,color:'rgba(0,0,0,.3)',fontSize:13}}>Nenhum agendamento hoje</div>
                    : agHoje.map(a=>(
                      <div key={a.id} className={`ag-card${a.status==='completed'?' fin':''}`}>
                        <div style={{width:42,height:42,borderRadius:10,background:a.status==='completed'?'#c8e6c9':PL,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <div style={{fontSize:11,fontWeight:700,color:a.status==='completed'?'#1b5e20':PD}}>{a.horario}</div>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.client_name}</div>
                          <div style={{fontSize:11,color:'rgba(0,0,0,.5)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.service_name} · {a.professional_name}</div>
                        </div>
                        {a.status==='completed'
                          ? <span style={{fontSize:11,fontWeight:700,color:'#2e7d32',flexShrink:0}}>✓ R$ {a.valorCobrado}</span>
                          : <button className="btn-gr" style={{fontSize:10,padding:'5px 9px',flexShrink:0}} onClick={()=>openModal('fechamento',{...a,valorCobrado:a.valorOriginal})}>✓ Fechar</button>
                        }
                      </div>
                    ))
                  }
                </div>
              </div>

              <div className="card">
                <div className="card-hd"><div className="card-title">Equipe</div></div>
                {profs.length===0
                  ? <div style={{padding:16,textAlign:'center',color:'rgba(0,0,0,.3)',fontSize:13}}>Nenhum profissional cadastrado</div>
                  : profs.map(p=>(
                    <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:`1px solid rgba(233,30,99,.04)`}}>
                      <div style={{width:34,height:34,borderRadius:'50%',background:`linear-gradient(135deg,#f48fb1,${P})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff',flexShrink:0}}>{(p.full_name||'?')[0]}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.full_name}</div>
                        <div style={{fontSize:11,color:'rgba(0,0,0,.4)'}}>{p.specialty} · {p.commission_pct}%</div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </>)}

            {/* ══ AGENDA ══ */}
            {tab==='agenda' && (<>
              <div className="card">
                <div className="card-hd">
                  <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                    <div className="card-title">Grade</div>
                    <input
                      type="date"
                      value={dmyToISO(agData)}
                      onChange={e=>setAgData(isoToDmy(e.target.value))}
                      style={{padding:'7px 10px',border:`1.5px solid ${PL}`,borderRadius:9,fontFamily:'Montserrat,sans-serif',fontSize:12,outline:'none'}}
                    />
                  </div>
                  <button className="btn-pk" onClick={()=>openModal('agendamento',{client_name:'',service_name:'',professional_name:'',data:agData,start_time:'',profissionalFixo:false})}>+ Agendar</button>
                </div>
                {profs.length===0
                  ? <div style={{padding:20,textAlign:'center',color:'rgba(0,0,0,.3)',fontSize:13}}>Cadastre profissionais primeiro</div>
                  : <div className="ag-wrap">
                      <table className="ag-tbl">
                        <thead>
                          <tr>
                            <th className="hcol">Hora</th>
                            {profs.map(p=>(
                              <th key={p.id}>
                                <div>{p.full_name}</div>
                                <div style={{fontSize:9,opacity:.7,fontWeight:400}}>{p.specialty}</div>
                                <div style={{fontSize:9,opacity:.6,fontWeight:400}}>{(p.schedule_start||'').slice(0,5)}–{(p.schedule_end||'').slice(0,5)}</div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {HORARIOS.map(h=>(
                            <tr key={h}>
                              <td className="hcell">{h}</td>
                              {profs.map(p=>{
                                const cel = getCel(h, p.full_name)
                                const hi = (p.schedule_start||'00:00').slice(0,5)
                                const hf = (p.schedule_end||'23:59').slice(0,5)
                                const dentroExp = h>=hi && h<=hf
                                const passado = !isFuturo(agData, h)
                                const cinza = !dentroExp || (passado&&!cel)
                                const livre = dentroExp && !passado && !cel
                                const bg = cel?.status==='completed'
                                  ? 'linear-gradient(135deg,#c8e6c9,#a5d6a7)'
                                  : 'linear-gradient(135deg,#fce4ec,#f8bbd0)'
                                const cc = cel?.status==='completed' ? '#1b5e20' : PD
                                return (
                                  <td
                                    key={p.id}
                                    className={cinza?'cinza':livre?'livre':''}
                                    onClick={()=>{
                                      if(!livre) return
                                      openModal('agendamento',{client_name:'',service_name:'',professional_name:p.full_name,data:agData,start_time:h,profissionalFixo:true})
                                    }}
                                  >
                                    {livre && <div style={{width:'100%',height:'100%',minHeight:28,display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(233,30,99,.2)',fontSize:16}}>+</div>}
                                    {cel && (
                                      <div className="cell-card" style={{background:bg}}>
                                        <div style={{fontSize:11,fontWeight:700,color:cc,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{cel.client_name}</div>
                                        <div style={{fontSize:10,color:'rgba(0,0,0,.5)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{cel.service_name}</div>
                                        {cel.valorCobrado>0 && <div style={{fontSize:10,fontWeight:600,color:cc}}>R$ {cel.valorCobrado}</div>}
                                        <button className="del-btn" onClick={e=>{e.stopPropagation();delAg(cel.id)}} title="Excluir">🗑</button>
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
                }
              </div>

              <div className="card">
                <div className="card-hd"><div className="card-title">Lista — {agData}</div></div>
                {agRows.filter(a=>a.data===agData).length===0
                  ? <div style={{padding:20,textAlign:'center',color:'rgba(0,0,0,.3)',fontSize:13}}>Nenhum agendamento</div>
                  : <div className="ag-cards">
                      {agRows.filter(a=>a.data===agData).map(a=>(
                        <div key={a.id} className={`ag-card${a.status==='completed'?' fin':''}`}>
                          <div style={{width:42,height:42,borderRadius:10,background:a.status==='completed'?'#c8e6c9':PL,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                            <div style={{fontSize:11,fontWeight:700,color:a.status==='completed'?'#1b5e20':PD}}>{a.horario}</div>
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.client_name}</div>
                            <div style={{fontSize:11,color:'rgba(0,0,0,.5)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.service_name} · {a.professional_name}</div>
                            {a.valorCobrado>0 && <div style={{fontSize:11,fontWeight:600,color:a.status==='completed'?'#2e7d32':PD}}>R$ {a.valorCobrado}</div>}
                          </div>
                          <div style={{display:'flex',gap:6,flexShrink:0}}>
                            {a.status!=='completed'&&a.status!=='cancelled' && (
                              <button className="btn-gr" style={{fontSize:10,padding:'5px 8px'}} onClick={()=>openModal('fechamento',{...a,valorCobrado:a.valorOriginal})}>✓</button>
                            )}
                            <button className="btn-rd" style={{fontSize:12,padding:'5px 8px'}} onClick={()=>delAg(a.id)}>🗑</button>
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>
            </>)}

            {/* ══ CLIENTES ══ */}
            {tab==='clientes' && (
              <div className="card">
                <div className="card-hd">
                  <div className="card-title">Clientes ({cls.length})</div>
                  <button className="btn-pk" onClick={()=>openModal('cliente',{full_name:'',phone:'',email:''})}>+ Novo</button>
                </div>
                <div style={{padding:'12px 14px 0'}}>
                  <div className="sw"><span className="si">🔍</span><input className="sinp" placeholder="Buscar..." value={busca} onChange={e=>setBusca(e.target.value)}/></div>
                </div>
                {clsFilt.length===0
                  ? <div style={{padding:16,textAlign:'center',color:'rgba(0,0,0,.3)',fontSize:13}}>Nenhum cliente encontrado</div>
                  : <div style={{padding:'0 14px 14px'}}>
                      {clsFilt.map(c=>(
                        <div key={c.id} style={{border:`1px solid ${PL}`,borderRadius:12,padding:'12px',marginBottom:10,display:'flex',alignItems:'center',gap:12}}>
                          <div style={{width:36,height:36,borderRadius:'50%',background:`linear-gradient(135deg,#f48fb1,${P})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff',flexShrink:0}}>{(c.full_name||'?')[0]}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.full_name}</div>
                            <div style={{fontSize:11,color:'rgba(0,0,0,.5)'}}>{c.phone||'—'} · {c.visits||0}x · R$ {c.total_spent||0}</div>
                          </div>
                          <div style={{display:'flex',gap:6,flexShrink:0}}>
                            <button className="btn-ot" style={{fontSize:10,padding:'6px 9px'}} onClick={()=>openModal('cliente',c)}>✏️</button>
                            <button className="btn-rd" style={{fontSize:10,padding:'6px 9px'}} onClick={()=>delCl(c.id)}>🗑</button>
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>
            )}

            {/* ══ PROFISSIONAIS ══ */}
            {tab==='profissionais' && (
              <div className="card">
                <div className="card-hd">
                  <div className="card-title">Equipe ({profs.length})</div>
                  <button className="btn-pk" onClick={()=>openModal('profissional',{full_name:'',phone:'',specialty:'',commission_pct:40,schedule_start:'08:00',schedule_end:'18:00'})}>+ Novo</button>
                </div>
                {profs.length===0 && <div style={{padding:20,textAlign:'center',color:'rgba(0,0,0,.3)',fontSize:13}}>Nenhum profissional cadastrado</div>}
                <div className="prof-grid">
                  {profs.map(p=>(
                    <div key={p.id} className="prof-card">
                      <div style={{width:46,height:46,borderRadius:'50%',background:`linear-gradient(135deg,#f48fb1,${P})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,fontWeight:700,color:'#fff',margin:'0 auto 10px'}}>{(p.full_name||'?')[0]}</div>
                      <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{p.full_name}</div>
                      <div style={{fontSize:11,color:'rgba(0,0,0,.4)',marginBottom:8}}>{p.specialty}</div>
                      <div style={{display:'flex',justifyContent:'center',gap:12,marginBottom:12}}>
                        <div style={{textAlign:'center'}}>
                          <div style={{fontSize:14,fontWeight:700,color:PD}}>{p.commission_pct}%</div>
                          <div style={{fontSize:9,color:'rgba(0,0,0,.35)',letterSpacing:1,textTransform:'uppercase'}}>Comissão</div>
                        </div>
                        <div style={{textAlign:'center'}}>
                          <div style={{fontSize:11,fontWeight:700,color:PD}}>{(p.schedule_start||'').slice(0,5)}–{(p.schedule_end||'').slice(0,5)}</div>
                          <div style={{fontSize:9,color:'rgba(0,0,0,.35)',letterSpacing:1,textTransform:'uppercase'}}>Horário</div>
                        </div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:6}}>
                        <button className="btn-ot" onClick={()=>openModal('profissional',p)}>✏️ Editar</button>
                        <button className="btn-rd" onClick={()=>delProf(p.id)}>✕ Remover</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ SERVIÇOS ══ */}
            {tab==='servicos' && (
              <div className="card">
                <div className="card-hd">
                  <div className="card-title">Serviços ({srvs.length})</div>
                  <button className="btn-pk" onClick={()=>openModal('servico',{name:'',categoria:'',price:'',duration_min:30})}>+ Novo</button>
                </div>
                <div className="srv-grid">
                  {srvs.map(s=>(
                    <div key={s.id} className="srv-card">
                      <div style={{fontSize:9,fontWeight:700,letterSpacing:3,textTransform:'uppercase',color:P,marginBottom:4}}>{s.service_categories?.name||'—'}</div>
                      <div style={{fontSize:13,fontWeight:700,marginBottom:2}}>{s.name}</div>
                      <div style={{fontFamily:'Playfair Display,serif',fontSize:19,fontWeight:700,color:PD,marginBottom:2}}>R$ {s.price}</div>
                      <div style={{fontSize:11,color:'rgba(0,0,0,.4)',marginBottom:8}}>⏱ {s.duration_min} min</div>
                      <div style={{display:'flex',gap:6}}>
                        <button className="btn-ot" style={{flex:1,fontSize:10}} onClick={()=>openModal('servico',{...s,categoria:s.service_categories?.name||''})}>Editar</button>
                        <button className="btn-rd" style={{fontSize:10}} onClick={()=>delSrv(s.id)}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ FINANCEIRO ══ */}
            {tab==='financeiro' && (<>
              <div className="kpis" style={{marginBottom:14}}>
                {[
                  {l:'Fat. Hoje', v:`R$ ${fatHoje}`,ic:'💰',bg:PL},
                  {l:'Fat. Mês',  v:`R$ ${fatMes}`, ic:'📈',bg:'#e8f5e9'},
                  {l:'Finalizados',v:agRows.filter(a=>a.status==='completed').length,ic:'✅',bg:'#fff3e0'},
                  {l:'Agendados', v:agRows.filter(a=>a.status==='scheduled').length,ic:'📅',bg:'#f3e5f5'},
                ].map(k=>(
                  <div key={k.l} className="kpi">
                    <div style={{width:36,height:36,borderRadius:10,background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,marginBottom:10}}>{k.ic}</div>
                    <div style={{fontFamily:'Playfair Display,serif',fontSize:24,fontWeight:700,marginBottom:2}}>{k.v}</div>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'rgba(0,0,0,.35)'}}>{k.l}</div>
                  </div>
                ))}
              </div>
              <div className="fin-grid">
                <div className="card">
                  <div className="card-hd"><div className="card-title">Finalizados</div></div>
                  <div className="tbl-wrap">
                    <table className="tbl">
                      <thead><tr><th>Cliente</th><th>Serviço</th><th>Prof.</th><th>Valor</th></tr></thead>
                      <tbody>{agRows.filter(a=>a.status==='completed').map(a=>(
                        <tr key={a.id}>
                          <td style={{fontWeight:600}}>{a.client_name}</td>
                          <td style={{fontSize:12,color:'rgba(0,0,0,.5)'}}>{a.service_name}</td>
                          <td style={{fontSize:12}}>{a.professional_name}</td>
                          <td style={{fontWeight:700,color:'#2e7d32'}}>R$ {a.valorCobrado}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
                <div className="card">
                  <div className="card-hd"><div className="card-title">Comissões</div></div>
                  <div className="tbl-wrap">
                    <table className="tbl">
                      <thead><tr><th>Profissional</th><th>%</th><th>Comissão</th></tr></thead>
                      <tbody>{profs.map(p=>{
                        const base = agRows.filter(a=>a.professional_name===p.full_name&&a.status==='completed').reduce((s,a)=>s+a.valorCobrado,0)
                        return (
                          <tr key={p.id}>
                            <td style={{fontWeight:600}}>{p.full_name}</td>
                            <td><span className="bdg" style={{background:'#f3e5f5',color:'#7b1fa2'}}>{p.commission_pct}%</span></td>
                            <td style={{fontWeight:700,color:PD}}>R$ {Math.round(base*(p.commission_pct/100))}</td>
                          </tr>
                        )
                      })}</tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>)}

            {/* ══ CONFIGURAÇÕES ══ */}
            {tab==='configuracoes' && (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
                {[
                  {title:'Dados do Salão',fields:['Nome do Salão','Telefone/WhatsApp','Endereço','E-mail']},
                  {title:'Funcionamento',fields:['Horário padrão','Dias','Intervalo','Notificações']},
                ].map(sec=>(
                  <div key={sec.title} className="card">
                    <div className="card-hd"><div className="card-title">{sec.title}</div></div>
                    <div style={{padding:14}}>
                      {sec.fields.map(f=>(
                        <div key={f} style={{marginBottom:12}}>
                          <Lbl>{f}</Lbl>
                          <input placeholder={f} style={{width:'100%',padding:'11px 13px',border:`1.5px solid rgba(233,30,99,.2)`,borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                        </div>
                      ))}
                      <button className="btn-pk" onClick={()=>shToast('Salvo!')}>Salvar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </>)}
        </div>
      </div>

      {/* ══ MODAL AGENDAR (clique na célula) ══ */}
      {modal==='agendamento' && form.profissionalFixo && (
        <Modal title={`${form.professional_name} · ${form.start_time}`} onClose={closeModal}>
          <Box cor="rosa">👤 <strong>{form.professional_name}</strong> &nbsp;·&nbsp; 📅 {form.data} &nbsp;·&nbsp; 🕐 {form.start_time}</Box>
          <Lbl>Cliente *</Lbl>
          <Sel value={form.client_name||''} onChange={F('client_name')}>
            <option value="">Selecionar cliente...</option>
            {cls.map(c=><option key={c.id}>{c.full_name}</option>)}
          </Sel>
          <Lbl>Serviço *</Lbl>
          <Sel value={form.service_name||''} onChange={F('service_name')}>
            <option value="">Selecionar serviço...</option>
            {srvs.map(s=><option key={s.id}>{s.name}</option>)}
          </Sel>
          {ferr && <Box cor="vermelho">{ferr}</Box>}
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button className="btn-pk" style={{flex:1}} onClick={saveAg}>Salvar</button>
            <button className="btn-ot" onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL AGENDAR (botão +) ══ */}
      {modal==='agendamento' && !form.profissionalFixo && (
        <Modal title={form.id?'Editar Agendamento':'Novo Agendamento'} onClose={closeModal}>
          <Lbl>Cliente *</Lbl>
          <Sel value={form.client_name||''} onChange={F('client_name')}>
            <option value="">Selecionar...</option>
            {cls.map(c=><option key={c.id}>{c.full_name}</option>)}
          </Sel>
          <Lbl>Profissional *</Lbl>
          <Sel value={form.professional_name||''} onChange={v=>{setForm(f=>({...f,professional_name:v}));setFerr('')}}>
            <option value="">Selecionar...</option>
            {profs.map(p=><option key={p.id}>{p.full_name}</option>)}
          </Sel>
          <Lbl>Serviço *</Lbl>
          <Sel value={form.service_name||''} onChange={F('service_name')}>
            <option value="">Selecionar...</option>
            {srvs.map(s=><option key={s.id}>{s.name}</option>)}
          </Sel>
          <Lbl>Data *</Lbl>
          <input
            type="date"
            value={dmyToISO(form.data)||''}
            onChange={e=>setForm(f=>({...f,data:isoToDmy(e.target.value)}))}
            style={{width:'100%',padding:'12px 14px',border:`1.5px solid rgba(233,30,99,.25)`,borderRadius:10,fontFamily:'Montserrat,sans-serif',fontSize:13,outline:'none',boxSizing:'border-box'}}
          />
          <Lbl>Horário *</Lbl>
          <Sel value={form.start_time||''} onChange={F('start_time')}>
            <option value="">Selecionar...</option>
            {horariosLivres(form.professional_name, form.data).map(h=><option key={h}>{h}</option>)}
          </Sel>
          {ferr && <Box cor="vermelho">{ferr}</Box>}
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button className="btn-pk" style={{flex:1}} onClick={saveAg}>Salvar</button>
            <button className="btn-ot" onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL FECHAMENTO ══ */}
      {modal==='fechamento' && (
        <Modal title="✓ Fechar Atendimento" onClose={closeModal}>
          <Box cor="verde">
            <strong>{form.client_name}</strong> — {form.service_name}<br/>
            <span style={{fontSize:11,opacity:.8}}>{form.professional_name} · {form.data} às {form.horario}</span>
          </Box>
          <Lbl>Valor do serviço</Lbl>
          <Inp value={`R$ ${form.valorOriginal||0}`} disabled/>
          <Lbl>Valor cobrado *</Lbl>
          <Inp type="number" value={form.valorCobrado||''} onChange={F('valorCobrado')} placeholder="Valor recebido"/>
          {form.valorCobrado && Number(form.valorCobrado)<Number(form.valorOriginal) && (
            <Box cor="amarelo">⚠️ Desconto de R$ {Number(form.valorOriginal)-Number(form.valorCobrado)}</Box>
          )}
          <Lbl>Forma de pagamento</Lbl>
          <Sel value={form.payment_method||'cash'} onChange={F('payment_method')}>
            <option value="cash">💵 Dinheiro</option>
            <option value="pix">📱 PIX</option>
            <option value="credit_card">💳 Crédito</option>
            <option value="debit_card">💳 Débito</option>
          </Sel>
          {ferr && <Box cor="vermelho">{ferr}</Box>}
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button className="btn-pk" style={{flex:1,background:'linear-gradient(135deg,#2e7d32,#1b5e20)'}} onClick={confirmarFechamento}>✓ Confirmar</button>
            <button className="btn-ot" onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL CLIENTE ══ */}
      {modal==='cliente' && (
        <Modal title={form.id?'Editar Cliente':'Novo Cliente'} onClose={closeModal}>
          <Lbl>Nome *</Lbl><Inp value={form.full_name} onChange={F('full_name')} placeholder="Nome completo"/>
          <Lbl>Telefone</Lbl><Inp value={form.phone} onChange={F('phone')} placeholder="(11) 99999-0000"/>
          <Lbl>E-mail</Lbl><Inp value={form.email} onChange={F('email')} placeholder="email@email.com"/>
          {ferr && <Box cor="vermelho">{ferr}</Box>}
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button className="btn-pk" style={{flex:1}} onClick={saveCl}>Salvar</button>
            <button className="btn-ot" onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL PROFISSIONAL ══ */}
      {modal==='profissional' && (
        <Modal title={form.id?'Editar Profissional':'Novo Profissional'} onClose={closeModal}>
          <Lbl>Nome *</Lbl><Inp value={form.full_name} onChange={F('full_name')} placeholder="Nome completo"/>
          <Lbl>Telefone</Lbl><Inp value={form.phone} onChange={F('phone')} placeholder="(11) 99999-0000"/>
          <Lbl>Especialidade</Lbl><Inp value={form.specialty} onChange={F('specialty')} placeholder="Ex: Cabelereira"/>
          <Lbl>Comissão (%)</Lbl><Inp type="number" value={form.commission_pct} onChange={F('commission_pct')} placeholder="40"/>
          <Lbl>Início expediente</Lbl>
          <Sel value={(form.schedule_start||'08:00').slice(0,5)} onChange={F('schedule_start')}>
            {HORARIOS.map(h=><option key={h}>{h}</option>)}
          </Sel>
          <Lbl>Fim expediente</Lbl>
          <Sel value={(form.schedule_end||'18:00').slice(0,5)} onChange={F('schedule_end')}>
            {HORARIOS.map(h=><option key={h}>{h}</option>)}
          </Sel>
          {!form.id && <Box cor="verde">🔑 Senha padrão: <strong>123456</strong></Box>}
          {ferr && <Box cor="vermelho">{ferr}</Box>}
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button className="btn-pk" style={{flex:1}} onClick={saveProf}>Salvar</button>
            <button className="btn-ot" onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL SERVIÇO ══ */}
      {modal==='servico' && (
        <Modal title={form.id?'Editar Serviço':'Novo Serviço'} onClose={closeModal}>
          <Lbl>Nome *</Lbl><Inp value={form.name} onChange={F('name')} placeholder="Ex: Corte Feminino"/>
          <Lbl>Categoria</Lbl>
          <Sel value={form.categoria||''} onChange={v=>setForm(f=>({...f,categoria:v,category_id:cats.find(c=>c.name===v)?.id}))}>
            <option value="">Selecionar...</option>
            {cats.map(c=><option key={c.id}>{c.name}</option>)}
          </Sel>
          <Lbl>Preço (R$)</Lbl><Inp type="number" value={form.price} onChange={F('price')} placeholder="0"/>
          <Lbl>Duração (min)</Lbl><Inp type="number" value={form.duration_min} onChange={F('duration_min')} placeholder="30"/>
          {ferr && <Box cor="vermelho">{ferr}</Box>}
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button className="btn-pk" style={{flex:1}} onClick={saveSrv}>Salvar</button>
            <button className="btn-ot" onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
      )}

      {toast && (
        <div className="toast-box" style={{background:toast.ok?'#2e7d32':'#c62828'}}>
          {toast.msg}
        </div>
      )}
    </>
  )
}
