'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

// CONFIGURAÇÕES DE CORES (LUXURY SALON THEME)
const COLORS = {
  primary: '#d4a373', // Dourado suave
  secondary: '#e9edc9',
  accent: '#faedcd',
  pink: '#fce4ec',
  pinkDark: '#f06292',
  text: '#4a4a4a',
  bg: '#fffaff'
}

const HORARIOS = [
  '08:00','08:15','08:30','08:45','09:00','09:15','09:30','09:45',
  '10:00','10:15','10:30','10:45','11:00','11:15','11:30','11:45',
  '12:00','12:15','12:30','12:45','13:00','13:15','13:30','13:45',
  '14:00','14:15','14:30','14:45','15:00','15:15','15:30','15:45',
  '16:00','16:15','16:30','16:45','17:00','17:15','17:30','17:45','18:00',
]

// HELPERS DE TEMPO
function timeToMin(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// ── COMPONENTES DE UI REUTILIZÁVEIS ──────────────────────────
const Card = ({ children, style }) => (
  <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', padding: 20, marginBottom: 16, ...style }}>
    {children}
  </div>
)

const Button = ({ children, variant = 'primary', ...props }) => {
  const bg = variant === 'primary' ? `linear-gradient(135deg, ${COLORS.primary}, #b08968)` : '#fff'
  const color = variant === 'primary' ? '#fff' : COLORS.primary
  const border = variant === 'primary' ? 'none' : `1px solid ${COLORS.primary}`
  
  return (
    <button {...props} style={{
      padding: '12px 24px', borderRadius: 12, border, background: bg, color,
      fontSize: 11, fontWeight: 700, letterSpacing: 1, cursor: 'pointer',
      transition: 'all 0.2s', textTransform: 'uppercase', ...props.style
    }}>
      {children}
    </button>
  )
}

// ── TELA DE LOGIN ────────────────────────────────────────────
function LoginScreen({ onLoginSuccess }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    if (user === 'Alexandre' && pass === '123456') {
      onLoginSuccess('admin', null)
      return
    }

    const { data, error } = await supabase
      .from('salon_professionals')
      .select('*')
      .ilike('full_name', user.trim())
      .eq('active', true)
      .single()

    if (error || !data || (data.senha || '123456') !== pass) {
      alert('Usuário ou senha inválidos. Tente novamente.')
      setLoading(false)
      return
    }

    onLoginSuccess('profissional', data)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bg, padding: 20 }}>
      <Card style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: '40px 30px' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', border: `2px solid ${COLORS.primary}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <span style={{ color: COLORS.primary, fontWeight: 'bold' }}>JOU</span>
        </div>
        <h1 style={{ fontFamily: 'serif', color: COLORS.primary, fontSize: 26, marginBottom: 8 }}>Joudat Salon</h1>
        <p style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 30 }}>Área de Acesso</p>
        
        <input placeholder="Usuário (Nome Completo)" value={user} onChange={e => setUser(e.target.value)} style={{ width: '100%', padding: 14, borderRadius: 10, border: '1px solid #eee', marginBottom: 12, outline: 'none', fontSize: 14 }} />
        <input type="password" placeholder="Senha" value={pass} onChange={e => setPass(e.target.value)} style={{ width: '100%', padding: 14, borderRadius: 10, border: '1px solid #eee', marginBottom: 20, outline: 'none', fontSize: 14 }} />
        
        <Button onClick={handleLogin} disabled={loading} style={{ width: '100%' }}>{loading ? 'Verificando...' : 'ENTRAR'}</Button>
      </Card>
    </div>
  )
}

// ── PAINEL PRINCIPAL ─────────────────────────────────────────
export default function SalonApp() {
  const [role, setRole] = useState(null)
  const [userLogged, setUserLogged] = useState(null)
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0])
  const [bookings, setBookings] = useState([])
  const [profs, setProfs] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({ client: '', serviceId: '', profId: '', time: '' })

  const loadData = useCallback(async () => {
    setLoading(true)
    const [b, p, s] = await Promise.all([
      supabase.from('salon_bookings').select('*'),
      supabase.from('salon_professionals').select('*').eq('active', true),
      supabase.from('services').select('*').eq('active', true)
    ])
    setBookings(b.data || [])
    setProfs(p.data || [])
    setServices(s.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // LÓGICA DE FILTRAGEM (PROBLEMA 1)
  const filteredServices = useMemo(() => {
    const p = profs.find(x => x.full_name === form.profId)
    if (!p) return services
    const tipoProf = p.tipo || 'cabelereiro'
    return services.filter(s => (s.tipo || 'cabelereiro') === tipoProf)
  }, [form.profId, profs, services])

  // LÓGICA DE BLOQUEIO POR DURAÇÃO (PROBLEMA 2)
  const checkAvailability = (profName, date, timeSlot) => {
    const dayBookings = bookings.filter(b => b.booking_date === date && b.professional_name === profName && b.status !== 'cancelled')
    const slotMin = timeToMin(timeSlot)
    
    return dayBookings.find(b => {
      const start = timeToMin(b.start_time.slice(0, 5))
      const srv = services.find(s => s.name === b.service_name)
      const duration = srv?.duration_min || 30
      const end = start + duration
      return slotMin >= start && slotMin < end
    })
  }

  async function handleSaveBooking() {
    if (!form.client || !form.serviceId || !form.profId || !form.time) return alert('Por favor, preencha todos os campos.')
    
    const srv = services.find(s => s.name === form.serviceId)
    const { error } = await supabase.from('salon_bookings').insert({
      client_name: form.client,
      service_name: form.serviceId,
      professional_name: form.profId,
      booking_date: viewDate,
      start_time: form.time + ':00',
      status: 'scheduled',
      service_price: srv?.price || 0
    })

    if (error) alert(error.message)
    else { setIsModalOpen(false); loadData(); }
  }

  if (!role) return <LoginScreen onLoginSuccess={(r, u) => { setRole(r); setUserLogged(u) }} />

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.text }}>
      <header style={{ background: '#fff', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div>
          <h2 style={{ fontSize: 18, color: COLORS.primary }}>{role === 'admin' ? 'Painel Admin' : 'Minha Agenda'}</h2>
          <p style={{ fontSize: 11, color: '#aaa' }}>{role === 'admin' ? 'Gerenciamento Geral' : userLogged?.full_name}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} style={{ padding: '8px', borderRadius: 8, border: '1px solid #eee', fontSize: 12 }} />
          <Button variant="outline" onClick={() => {setRole(null); setUserLogged(null)}} style={{ padding: '8px 15px' }}>Sair</Button>
        </div>
      </header>

      <main style={{ padding: '20px' }}>
        <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 20 }}>
          {(role === 'admin' ? profs : [userLogged]).map(p => (
            <div key={p.id} style={{ minWidth: 280, flex: 1 }}>
              <Card style={{ textAlign: 'center', padding: '15px' }}>
                <div style={{ fontSize: 14, fontWeight: 'bold' }}>{p.full_name}</div>
                <div style={{ fontSize: 10, color: COLORS.primary, letterSpacing: 1 }}>{p.tipo?.toUpperCase()}</div>
                
                <div style={{ marginTop: 20 }}>
                  {HORARIOS.map(h => {
                    const booking = checkAvailability(p.full_name, viewDate, h)
                    const isStart = booking && booking.start_time.slice(0, 5) === h
                    
                    return (
                      <div key={h} 
                        onClick={() => !booking && role === 'admin' && (setForm({ ...form, profId: p.full_name, time: h }), setIsModalOpen(true))}
                        style={{
                          padding: '10px', borderBottom: '1px solid #fcfcfc', display: 'flex', alignItems: 'center', gap: 10,
                          background: booking ? (isStart ? '#fff0f3' : '#f9f9f9') : 'transparent',
                          borderRadius: 8, cursor: booking ? 'default' : 'pointer'
                        }}>
                        <span style={{ fontSize: 10, color: '#ccc', width: 35 }}>{h}</span>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          {isStart ? (
                            <div style={{ fontSize: 11 }}>
                              <strong style={{ color: COLORS.pinkDark }}>{booking.client_name}</strong>
                              <div style={{ fontSize: 9, color: '#999' }}>{booking.service_name}</div>
                            </div>
                          ) : booking ? (
                            <div style={{ height: 4, background: '#eee', borderRadius: 2, width: '30%' }}></div>
                          ) : (
                            <span style={{ fontSize: 10, color: '#eee' }}>—</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          ))}
        </div>
      </main>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <Card style={{ width: '100%', maxWidth: 400 }}>
            <h3 style={{ marginBottom: 20, fontSize: 18 }}>Novo Agendamento</h3>
            
            <label style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, display: 'block', marginBottom: 5 }}>NOME DA CLIENTE</label>
            <input value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', marginBottom: 15 }} />

            <label style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, display: 'block', marginBottom: 5 }}>SERVIÇO DISPONÍVEL</label>
            <select value={form.serviceId} onChange={e => setForm({ ...form, serviceId: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', marginBottom: 20 }}>
              <option value="">Selecione...</option>
              {filteredServices.map(s => <option key={s.id} value={s.name}>{s.name} ({s.duration_min}min)</option>)}
            </select>

            <div style={{ display: 'flex', gap: 10 }}>
              <Button onClick={handleSaveBooking} style={{ flex: 1 }}>Confirmar</Button>
              <Button variant="outline" onClick={() => setIsModalOpen(false)} style={{ flex: 1 }}>Voltar</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
