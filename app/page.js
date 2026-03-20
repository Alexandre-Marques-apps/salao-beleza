'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

// THEME - CLEAN MINIMALIST
const THEME = {
  bg: '#F4F4F4',
  sidebar: '#EFEFEF',
  card: '#FFFFFF',
  primary: '#000000',
  text: '#1A1A1A',
  textLight: '#7A7A7A',
  border: '#EAEAEA'
}

const HORARIOS = Array.from({ length: 41 }, (_, i) => {
  const h = Math.floor((8 * 60 + i * 15) / 60)
  const m = (i * 15) % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

const timeToMin = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; }
const isPast = (date, time) => { if (!date || !time) return false; return new Date(`${date}T${time}:00`) < new Date() }

// ── TELA DE LOGIN ────────────────────────────────────────────
function LoginScreen({ onLoginSuccess }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    if (user === 'Alexandre' && pass === '123456') {
      onLoginSuccess('admin', { full_name: 'Alexandre' })
      return
    }
    const { data, error } = await supabase.from('salon_professionals').select('*').ilike('full_name', user.trim()).eq('active', true).single()
    if (error || !data || (data.senha || '123456') !== pass) {
      alert('Acesso negado')
      setLoading(false)
      return
    }
    onLoginSuccess('profissional', data)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: THEME.bg, fontFamily: 'sans-serif' }}>
      <div style={{ width: 350, background: '#fff', padding: 40, borderRadius: 20, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 30, letterSpacing: 2 }}>JOUDAT</h2>
        <input placeholder="Usuário" value={user} onChange={e => setUser(e.target.value)} style={{ width: '100%', padding: 12, marginBottom: 15, borderRadius: 8, border: '1px solid #ddd' }} />
        <input type="password" placeholder="Senha" value={pass} onChange={e => setPass(e.target.value)} style={{ width: '100%', padding: 12, marginBottom: 25, borderRadius: 8, border: '1px solid #ddd' }} />
        <button onClick={handleLogin} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}>ENTRAR</button>
      </div>
    </div>
  )
}

// ── APP PRINCIPAL ─────────────────────────────────────────────
export default function SalonApp() {
  const [role, setRole] = useState(null)
  const [me, setMe] = useState(null)
  const [tab, setTab] = useState('dashboard')
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0])

  const [profs, setProfs] = useState([])
  const [services, setServices] = useState([])
  const [bookings, setBookings] = useState([])
  const [clients, setClients] = useState([])
  
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('booking') // booking | professional | service | client
  const [form, setForm] = useState({})

  const loadData = useCallback(async () => {
    const [p, s, b, c] = await Promise.all([
      supabase.from('salon_professionals').select('*').eq('active', true),
      supabase.from('services').select('*').eq('active', true),
      supabase.from('salon_bookings').select('*'),
      supabase.from('salon_clients').select('*')
    ])
    setProfs(p.data || [])
    setServices(s.data || [])
    setBookings(b.data || [])
    setClients(c.data || [])
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // LÓGICA DE OCUPAÇÃO
  const checkOccupied = (profName, date, time) => {
    const slot = timeToMin(time)
    return bookings.find(b => {
      if (b.booking_date !== date || b.professional_name !== profName || b.status === 'cancelled') return false
      const start = timeToMin(b.start_time.slice(0, 5))
      const srv = services.find(s => s.name === b.service_name)
      const end = start + (srv?.duration_min || 30)
      return slot >= start && slot < end
    })
  }

  // SALVAR TUDO (CADASTROS E AGENDAMENTOS)
  const handleSave = async () => {
    if (modalType === 'booking') {
      const srv = services.find(s => s.name === form.service_name)
      const prof = profs.find(p => p.full_name === (form.profId || form.professional_name))
      
      const payload = {
        client_name: form.client_name,
        service_name: srv.name,
        professional_name: prof.full_name,
        booking_date: viewDate,
        start_time: form.time.slice(0, 5) + ':00',
        price_charged: srv.price,
        commission_pct: prof.commission_pct,
        status: 'scheduled'
      }

      if (form.id) {
        await supabase.from('salon_bookings').update(payload).eq('id', form.id)
      } else {
        await supabase.from('salon_bookings').insert(payload)
      }
    } 
    else if (modalType === 'professional') {
      const payload = { ...form, active: true, senha: form.senha || '123456' }
      if (form.id) await supabase.from('salon_professionals').update(payload).eq('id', form.id)
      else await supabase.from('salon_professionals').insert(payload)
    }
    else if (modalType === 'service') {
      if (form.id) await supabase.from('services').update(form).eq('id', form.id)
      else await supabase.from('services').insert(form)
    }
    else if (modalType === 'client') {
      if (form.id) await supabase.from('salon_clients').update(form).eq('id', form.id)
      else await supabase.from('salon_clients').insert(form)
    }

    setShowModal(false); setForm({}); loadData()
  }

  if (!role) return <LoginScreen onLoginSuccess={(r, u) => { setRole(r); setMe(u) }} />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: THEME.bg, fontFamily: 'sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: 240, background: THEME.sidebar, padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 40 }}>JOUDAT</div>
        
        <div onClick={() => setTab('dashboard')} style={{ padding: 12, cursor: 'pointer', background: tab === 'dashboard' ? '#fff' : 'transparent', borderRadius: 8 }}>■ Dashboard</div>
        <div onClick={() => setTab('agenda')} style={{ padding: 12, cursor: 'pointer', background: tab === 'agenda' ? '#fff' : 'transparent', borderRadius: 8 }}>📅 Agenda</div>
        
        {role === 'admin' && (
          <>
            <div onClick={() => setTab('profissionais')} style={{ padding: 12, cursor: 'pointer', background: tab === 'profissionais' ? '#fff' : 'transparent', borderRadius: 8 }}>👤 Profissionais</div>
            <div onClick={() => setTab('servicos')} style={{ padding: 12, cursor: 'pointer', background: tab === 'servicos' ? '#fff' : 'transparent', borderRadius: 8 }}>✂️ Serviços</div>
            <div onClick={() => setTab('clientes')} style={{ padding: 12, cursor: 'pointer', background: tab === 'clientes' ? '#fff' : 'transparent', borderRadius: 8 }}>👥 Clientes</div>
          </>
        )}
        
        <div style={{ marginTop: 'auto', color: THEME.textLight, cursor: 'pointer' }} onClick={() => setRole(null)}>ⓧ Sair</div>
      </aside>

      <main style={{ flex: 1, padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
          <h1 style={{ fontSize: 22 }}>{tab.toUpperCase()}</h1>
          <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd' }} />
        </header>

        {/* VIEW: DASHBOARD */}
        {tab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <div style={{ background: '#fff', padding: 25, borderRadius: 15 }}>
              <p style={{ fontSize: 12, color: THEME.textLight }}>Hoje</p>
              <h2>{bookings.filter(b => b.booking_date === viewDate && (role === 'admin' ? true : b.professional_name === me.full_name)).length}</h2>
            </div>
            {role === 'admin' && (
              <div style={{ background: '#fff', padding: 25, borderRadius: 15 }}>
                <p style={{ fontSize: 12, color: THEME.textLight }}>Receita Total</p>
                <h2>R$ {bookings.filter(b => b.status === 'completed').reduce((acc, b) => acc + Number(b.price_charged), 0)}</h2>
              </div>
            )}
            <div style={{ background: '#fff', padding: 25, borderRadius: 15 }}>
              <p style={{ fontSize: 12, color: THEME.textLight }}>Minha Comissão</p>
              <h2>R$ {bookings.filter(b => b.professional_name === me.full_name && b.status === 'completed').reduce((acc, b) => acc + Number(b.commission_value || 0), 0).toFixed(2)}</h2>
            </div>
          </div>
        )}

        {/* VIEW: AGENDA */}
        {tab === 'agenda' && (
          <div style={{ background: '#fff', padding: 30, borderRadius: 15, display: 'flex', gap: 20, overflowX: 'auto' }}>
            {(role === 'admin' ? profs : [me]).map(p => (
              <div key={p.id} style={{ minWidth: 200, flex: 1 }}>
                <h4 style={{ textAlign: 'center', marginBottom: 15 }}>{p.full_name}</h4>
                {HORARIOS.map(h => {
                  const b = checkOccupied(p.full_name, viewDate, h)
                  const isStart = b && b.start_time.slice(0, 5) === h
                  return (
                    <div key={h} onClick={() => {
                        if (b && isStart) { setForm({ ...b, time: b.start_time.slice(0,5) }); setModalType('booking'); setShowModal(true); }
                        else if (!b) { setForm({ profId: p.full_name, time: h }); setModalType('booking'); setShowModal(true); }
                      }}
                      style={{ padding: 10, borderBottom: `1px solid ${THEME.border}`, fontSize: 12, background: b ? '#F9F9F9' : '#fff', cursor: 'pointer' }}>
                      <span style={{ color: '#ccc', marginRight: 10 }}>{h}</span>
                      {isStart ? <strong>{b.client_name}</strong> : b ? '' : <span style={{ color: '#eee' }}>Livre</span>}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* VIEW: LISTAS (ADMIN) */}
        {role === 'admin' && tab === 'profissionais' && (
          <div style={{ background: '#fff', padding: 30, borderRadius: 15 }}>
            <button onClick={() => { setForm({}); setModalType('professional'); setShowModal(true) }}>+ Novo Profissional</button>
            <table style={{ width: '100%', marginTop: 20 }}>
              {profs.map(p => <tr key={p.id}><td>{p.full_name}</td><td>{p.specialty}</td><td>{p.commission_pct}%</td><td onClick={() => { setForm(p); setModalType('professional'); setShowModal(true) }}>✏️</td></tr>)}
            </table>
          </div>
        )}

        {role === 'admin' && tab === 'servicos' && (
          <div style={{ background: '#fff', padding: 30, borderRadius: 15 }}>
            <button onClick={() => { setForm({}); setModalType('service'); setShowModal(true) }}>+ Novo Serviço</button>
            <table style={{ width: '100%', marginTop: 20 }}>
              {services.map(s => <tr key={s.id}><td>{s.name}</td><td>R$ {s.price}</td><td>{s.duration_min}m</td><td onClick={() => { setForm(s); setModalType('service'); setShowModal(true) }}>✏️</td></tr>)}
            </table>
          </div>
        )}
      </main>

      {/* MODAL UNIFICADO */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: 40, borderRadius: 20, width: 400 }}>
            <h3>{form.id ? 'Editar' : 'Novo'} {modalType}</h3>
            
            {modalType === 'booking' && (
              <>
                <select value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} style={{ width: '100%', padding: 10, marginBottom: 15 }}>
                  <option>Selecionar Cliente</option>
                  {clients.map(c => <option key={c.id} value={c.full_name}>{c.full_name}</option>)}
                </select>
                <select value={form.service_name} onChange={e => setForm({...form, service_name: e.target.value})} style={{ width: '100%', padding: 10, marginBottom: 15 }}>
                  <option>Selecionar Serviço</option>
                  {services.filter(s => s.tipo === profs.find(p => p.full_name === (form.profId || form.professional_name))?.tipo).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                <input disabled={role !== 'admin'} value={form.profId || form.professional_name} style={{ width: '100%', padding: 10, marginBottom: 15 }} />
              </>
            )}

            {modalType === 'professional' && (
              <>
                <input placeholder="Nome" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} style={{ width: '100%', padding: 10, marginBottom: 10 }} />
                <input placeholder="Especialidade" value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value})} style={{ width: '100%', padding: 10, marginBottom: 10 }} />
                <input placeholder="Comissão %" value={form.commission_pct} onChange={e => setForm({...form, commission_pct: e.target.value})} style={{ width: '100%', padding: 10, marginBottom: 10 }} />
                <input placeholder="Senha (padrão 123456)" value={form.senha} onChange={e => setForm({...form, senha: e.target.value})} style={{ width: '100%', padding: 10, marginBottom: 10 }} />
                <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} style={{ width: '100%', padding: 10 }}>
                   <option value="cabelereiro">Cabelo</option>
                   <option value="manicure">Unha</option>
                </select>
              </>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={handleSave} style={{ flex: 1, padding: 10, background: '#000', color: '#fff' }}>Salvar</button>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 10 }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
