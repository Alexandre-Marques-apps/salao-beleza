'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

// CONFIGURAÇÃO VISUAL - CLEAN DASHBOARD
const THEME = {
  bg: '#F4F4F4',
  sidebar: '#EFEFEF',
  card: '#FFFFFF',
  primary: '#000000',
  text: '#1A1A1A',
  textLight: '#7A7A7A',
  border: '#EAEAEA',
  accent: '#000000',
  success: '#27AE60'
}

const HORARIOS = Array.from({ length: 41 }, (_, i) => {
  const h = Math.floor((8 * 60 + i * 15) / 60)
  const m = (i * 15) % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

// HELPERS
const timeToMin = (t) => {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const isPast = (date, time) => {
  if (!date || !time) return false
  return new Date(`${date}T${time}:00`) < new Date()
}

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

    const { data, error } = await supabase
      .from('salon_professionals')
      .select('*')
      .ilike('full_name', user.trim())
      .eq('active', true)
      .single()

    if (error || !data || (data.senha || '123456') !== pass) {
      alert('Credenciais incorretas')
      setLoading(false)
      return
    }

    onLoginSuccess('profissional', data)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: THEME.bg, fontFamily: 'sans-serif' }}>
      <div style={{ width: 350, background: '#fff', padding: 40, borderRadius: 20, boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: 24, marginBottom: 10 }}>JOUDAT</div>
        <p style={{ color: THEME.textLight, fontSize: 12, marginBottom: 30 }}>ACESSAR DASHBOARD</p>
        <input placeholder="Usuário" value={user} onChange={e => setUser(e.target.value)} style={{ width: '100%', padding: 12, marginBottom: 15, borderRadius: 8, border: '1px solid #ddd', outline: 'none' }} />
        <input type="password" placeholder="Senha" value={pass} onChange={e => setPass(e.target.value)} style={{ width: '100%', padding: 12, marginBottom: 25, borderRadius: 8, border: '1px solid #ddd', outline: 'none' }} />
        <button onClick={handleLogin} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#000', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
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
  const [form, setForm] = useState({})
  const [showModal, setShowModal] = useState(false)

  const loadData = useCallback(async () => {
    const [p, s, b] = await Promise.all([
      supabase.from('salon_professionals').select('*').eq('active', true),
      supabase.from('services').select('*').eq('active', true),
      supabase.from('salon_bookings').select('*')
    ])
    setProfs(p.data || [])
    setServices(s.data || [])
    setBookings(b.data || [])
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // LÓGICA DE OCUPAÇÃO POR DURAÇÃO
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

  const handleSave = async () => {
    if (!form.client_name || !form.service_name || !form.time) return alert('Preencha os dados')
    if (isPast(viewDate, form.time)) return alert('Não é possível agendar no passado')

    const srv = services.find(s => s.name === form.service_name)
    const prof = profs.find(p => p.full_name === (form.profId || form.professional_name))

    const payload = {
      client_name: form.client_name,
      service_name: srv.name,
      professional_name: prof.full_name,
      booking_date: viewDate,
      start_time: form.time.slice(0, 5) + ':00',
      status: 'scheduled',
      price_charged: srv.price,
      commission_pct: prof.commission_pct
    }

    if (form.id) {
      await supabase.from('salon_bookings').update(payload).eq('id', form.id)
    } else {
      await supabase.from('salon_bookings').insert(payload)
    }
    setShowModal(false); loadData()
  }

  const handleConfirm = async (booking) => {
    const val = Number(booking.price_charged)
    const com = Number((val * (booking.commission_pct / 100)).toFixed(2))
    await supabase.from('salon_bookings').update({ 
        status: 'completed', 
        commission_value: com 
    }).eq('id', booking.id)
    loadData()
  }

  if (!role) return <LoginScreen onLoginSuccess={(r, u) => { setRole(r); setMe(u) }} />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: THEME.bg, fontFamily: 'sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: 240, background: THEME.sidebar, padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 40, paddingLeft: 10 }}>LOGO</div>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: '■' },
          { id: 'agenda', label: 'Agendamentos', icon: '📅' },
          { id: 'profissionais', label: 'Profissionais', icon: '👤' },
          { id: 'clientes', label: 'Clientes', icon: '👥' },
          { id: 'relatorios', label: 'Relatórios', icon: '📊' },
          { id: 'config', label: 'Configurações', icon: '⚙' },
        ].map(item => (
          <div key={item.id} onClick={() => setTab(item.id)} style={{
            padding: '12px 15px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
            background: tab === item.id ? '#FFF' : 'transparent', fontWeight: tab === item.id ? '700' : '400',
            boxShadow: tab === item.id ? '0 4px 10px rgba(0,0,0,0.03)' : 'none'
          }}>
            <span>{item.icon}</span> {item.label}
          </div>
        ))}
        <div style={{ marginTop: 'auto', padding: '15px', cursor: 'pointer', color: THEME.textLight }} onClick={() => setRole(null)}>
          ⓧ Sair
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
             <span style={{ fontSize: 13, color: THEME.textLight }}>🔔 Admin</span>
             <div style={{ width: 35, height: 35, borderRadius: '50%', background: '#ddd' }}></div>
          </div>
        </header>

        {tab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 25 }}>
            {/* LEFT COLUMN */}
            <div>
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 25 }}>
                <div style={{ background: '#fff', padding: 25, borderRadius: 15 }}>
                  <p style={{ fontSize: 12, color: THEME.textLight }}>Hoje</p>
                  <h2 style={{ fontSize: 28 }}>{bookings.filter(b => b.booking_date === viewDate).length}</h2>
                  <p style={{ fontSize: 11, color: THEME.textLight }}>atendimentos</p>
                </div>
                <div style={{ background: '#fff', padding: 25, borderRadius: 15 }}>
                  <p style={{ fontSize: 12, color: THEME.textLight }}>Pendentes</p>
                  <h2 style={{ fontSize: 28 }}>{bookings.filter(b => b.status === 'scheduled').length}</h2>
                </div>
                <div style={{ background: '#fff', padding: 25, borderRadius: 15 }}>
                  <p style={{ fontSize: 12, color: THEME.textLight }}>Receitas</p>
                  <h2 style={{ fontSize: 28 }}>R$ {bookings.filter(b => b.status === 'completed').reduce((acc, b) => acc + Number(b.price_charged), 0)}</h2>
                </div>
              </div>

              {/* TABLE PENDENCIAS */}
              <div style={{ background: '#fff', padding: 30, borderRadius: 15 }}>
                <h3 style={{ marginBottom: 20 }}>Pendências</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: `1px solid ${THEME.border}`, color: THEME.textLight, fontSize: 13 }}>
                      <th style={{ padding: '10px 0' }}>Horário</th>
                      <th>Serviço</th>
                      <th>Profissional</th>
                      <th>Cliente</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.filter(b => b.status === 'scheduled').map(b => (
                      <tr key={b.id} style={{ borderBottom: `1px solid ${THEME.border}`, fontSize: 14 }}>
                        <td style={{ padding: '15px 0' }}>{b.start_time.slice(0, 5)}</td>
                        <td>{b.service_name}</td>
                        <td>{b.professional_name}</td>
                        <td>{b.client_name}</td>
                        <td>
                          <button onClick={() => handleConfirm(b)} style={{ padding: '6px 15px', borderRadius: 6, border: 'none', background: '#EFEFEF', cursor: 'pointer', fontSize: 12 }}>Confirmar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 25 }}>
              <div style={{ background: '#fff', padding: 25, borderRadius: 15 }}>
                <h3 style={{ fontSize: 14, marginBottom: 15 }}>Calendário</h3>
                <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} style={{ width: '100%', border: 'none', background: '#F9F9F9', padding: 10, borderRadius: 8 }} />
              </div>
              <div style={{ background: '#fff', padding: 25, borderRadius: 15 }}>
                <h3 style={{ fontSize: 14, marginBottom: 20 }}>Rendimento</h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
                  {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                    <div key={i} style={{ flex: 1, background: i === 5 ? '#000' : '#DDD', height: `${h}%`, borderRadius: '4px 4px 0 0' }}></div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 10, color: THEME.textLight }}>
                   <span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span><span>D</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW AGENDA (TRADICIONAL GRADE) */}
        {tab === 'agenda' && (
          <div style={{ background: '#fff', padding: 30, borderRadius: 15, overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 20 }}>
              {(role === 'admin' ? profs : [me]).map(p => (
                <div key={p.id} style={{ flex: 1, minWidth: 200 }}>
                  <h4 style={{ textAlign: 'center', marginBottom: 20 }}>{p.full_name}</h4>
                  {HORARIOS.map(h => {
                    const ocupado = checkOccupied(p.full_name, viewDate, h)
                    const isPastSlot = isPast(viewDate, h)
                    return (
                      <div key={h}
                        onClick={() => {
                          if (ocupado || isPastSlot) return
                          setForm({ profId: p.full_name, time: h })
                          setShowModal(true)
                        }}
                        style={{
                          padding: '12px', borderBottom: `1px solid ${THEME.border}`, fontSize: 12,
                          display: 'flex', justifyContent: 'space-between',
                          background: ocupado ? '#F9F9F9' : '#FFF',
                          cursor: (ocupado || isPastSlot) ? 'default' : 'pointer',
                          color: isPastSlot ? '#ccc' : '#000'
                        }}>
                        <span>{h}</span>
                        {ocupado ? <span style={{ fontWeight: 700 }}>{ocupado.client_name}</span> : <span style={{ color: '#EEE' }}>Livre</span>}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL AGENDAMENTO / EDIÇÃO */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 40, borderRadius: 20, width: 400 }}>
            <h3 style={{ marginBottom: 20 }}>{form.id ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
            
            <label style={{ fontSize: 11, color: THEME.textLight }}>CLIENTE</label>
            <input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} style={{ width: '100%', padding: 12, marginBottom: 15, borderRadius: 8, border: '1px solid #ddd' }} />

            <label style={{ fontSize: 11, color: THEME.textLight }}>SERVIÇO</label>
            <select value={form.service_name} onChange={e => setForm({ ...form, service_name: e.target.value })} style={{ width: '100%', padding: 12, marginBottom: 15, borderRadius: 8, border: '1px solid #ddd' }}>
              <option value="">Selecione o serviço</option>
              {services.filter(s => {
                  const prof = profs.find(p => p.full_name === (form.profId || form.professional_name))
                  return prof ? s.tipo === prof.tipo : true
              }).map(s => <option key={s.id} value={s.name}>{s.name} (R$ {s.price})</option>)}
            </select>

            <label style={{ fontSize: 11, color: THEME.textLight }}>PROFISSIONAL</label>
            <select disabled={role !== 'admin'} value={form.profId || form.professional_name} onChange={e => setForm({ ...form, profId: e.target.value, professional_name: e.target.value })} style={{ width: '100%', padding: 12, marginBottom: 20, borderRadius: 8, border: '1px solid #ddd' }}>
              {profs.map(p => <option key={p.id} value={p.full_name}>{p.full_name}</option>)}
            </select>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSave} style={{ flex: 1, padding: 12, background: '#000', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Salvar</button>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 12, background: '#eee', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
