'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

// THEME - CLEAN LUXURY
const THEME = {
  bg: '#F4F4F4',
  sidebar: '#EFEFEF',
  card: '#FFFFFF',
  primary: '#000000',
  text: '#1A1A1A',
  textLight: '#7A7A7A',
  border: '#EAEAEA',
  danger: '#D32F2F',
  success: '#2E7D32'
}

const HORARIOS = Array.from({ length: 41 }, (_, i) => {
  const h = Math.floor((8 * 60 + i * 15) / 60)
  const m = (i * 15) % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

const timeToMin = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; }
const isPast = (date, time) => { if (!date || !time) return false; return new Date(`${date}T${time}:00`) < new Date() }

// ── LOGIN ────────────────────────────────────────────────────
function LoginScreen({ onLoginSuccess }) {
  const [user, setUser] = useState(''); const [pass, setPass] = useState(''); const [loading, setLoading] = useState(false)
  async function handleLogin() {
    setLoading(true)
    if (user === 'Alexandre' && pass === '123456') { onLoginSuccess('admin', { full_name: 'Alexandre' }); return }
    const { data, error } = await supabase.from('salon_professionals').select('*').ilike('full_name', user.trim()).eq('active', true).single()
    if (error || !data || (data.senha || '123456') !== pass) { alert('Acesso negado'); setLoading(false); return }
    onLoginSuccess('profissional', data); setLoading(false)
  }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: THEME.bg, fontFamily: 'sans-serif' }}>
      <div style={{ width: 350, background: '#fff', padding: 40, borderRadius: 20, textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <h2 style={{ marginBottom: 30, letterSpacing: 2 }}>JOUDAT</h2>
        <input placeholder="Usuário" value={user} onChange={e => setUser(e.target.value)} style={{ width: '100%', padding: 12, marginBottom: 15, borderRadius: 8, border: '1px solid #ddd', outline: 'none' }} />
        <input type="password" placeholder="Senha" value={pass} onChange={e => setPass(e.target.value)} style={{ width: '100%', padding: 12, marginBottom: 25, borderRadius: 8, border: '1px solid #ddd', outline: 'none' }} />
        <button onClick={handleLogin} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#000', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>ENTRAR</button>
      </div>
    </div>
  )
}

// ── APP ──────────────────────────────────────────────────────
export default function SalonApp() {
  const [role, setRole] = useState(null); const [me, setMe] = useState(null); const [tab, setTab] = useState('dashboard')
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0])
  const [profs, setProfs] = useState([]); const [services, setServices] = useState([]); const [bookings, setBookings] = useState([]); const [clients, setClients] = useState([])
  const [showModal, setShowModal] = useState(false); const [modalType, setModalType] = useState('booking'); const [form, setForm] = useState({})

  const loadData = useCallback(async () => {
    const [p, s, b, c] = await Promise.all([
      supabase.from('salon_professionals').select('*').eq('active', true),
      supabase.from('services').select('*').eq('active', true),
      supabase.from('salon_bookings').select('*').neq('status', 'cancelled'),
      supabase.from('salon_clients').select('*').order('full_name')
    ])
    setProfs(p.data || []); setServices(s.data || []); setBookings(b.data || []); setClients(c.data || [])
  }, [])

  useEffect(() => { loadData() }, [loadData])

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
    if (modalType === 'booking') {
      const srv = services.find(s => s.name === form.service_name)
      const prof = profs.find(p => p.full_name === (form.profId || form.professional_name))
      const payload = {
        client_name: form.client_name, service_name: srv.name, professional_name: prof.full_name,
        booking_date: viewDate, start_time: form.time.slice(0, 5) + ':00',
        price_charged: srv.price, commission_pct: prof.commission_pct, status: 'scheduled'
      }
      if (form.id) await supabase.from('salon_bookings').update(payload).eq('id', form.id)
      else await supabase.from('salon_bookings').insert(payload)
    } 
    else if (modalType === 'client') {
      const payload = { full_name: form.full_name, phone: form.phone }
      if (form.id) await supabase.from('salon_clients').update(payload).eq('id', form.id)
      else await supabase.from('salon_clients').insert(payload)
    }
    // Adicionar lógica de save para Professional e Service aqui se necessário
    setShowModal(false); setForm({}); loadData()
  }

  const cancelBooking = async () => {
    if (!form.id) return
    if (confirm("Deseja realmente desmarcar este atendimento?")) {
      await supabase.from('salon_bookings').update({ status: 'cancelled' }).eq('id', form.id)
      setShowModal(false); loadData()
    }
  }

  if (!role) return <LoginScreen onLoginSuccess={(r, u) => { setRole(r); setMe(u); if(r==='profissional') setTab('agenda') }} />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: THEME.bg, fontFamily: 'sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: 240, background: THEME.sidebar, padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 40 }}>JOUDAT</div>
        <div onClick={() => setTab('dashboard')} style={{ padding: 12, cursor: 'pointer', background: tab === 'dashboard' ? '#fff' : 'transparent', borderRadius: 8 }}>Dashboard</div>
        <div onClick={() => setTab('agenda')} style={{ padding: 12, cursor: 'pointer', background: tab === 'agenda' ? '#fff' : 'transparent', borderRadius: 8 }}>Agenda</div>
        {role === 'admin' && (
          <>
            <div onClick={() => setTab('clientes')} style={{ padding: 12, cursor: 'pointer', background: tab === 'clientes' ? '#fff' : 'transparent', borderRadius: 8 }}>Clientes</div>
            <div onClick={() => setTab('profissionais')} style={{ padding: 12, cursor: 'pointer', background: tab === 'profissionais' ? '#fff' : 'transparent', borderRadius: 8 }}>Profissionais</div>
          </>
        )}
        <div style={{ marginTop: 'auto', color: THEME.textLight, cursor: 'pointer' }} onClick={() => setRole(null)}>Sair</div>
      </aside>

      <main style={{ flex: 1, padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
          <h1 style={{ fontSize: 22 }}>{tab.toUpperCase()}</h1>
          <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #eee' }} />
        </header>

        {/* AGENDA GRID */}
        {tab === 'agenda' && (
          <div style={{ background: '#fff', padding: 25, borderRadius: 15, display: 'flex', gap: 20, overflowX: 'auto' }}>
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
                      {isStart ? <strong>{b.client_name}</strong> : b ? '' : <span style={{ color: '#eee' }}>—</span>}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* CADASTRO DE CLIENTES */}
        {tab === 'clientes' && (
          <div style={{ background: '#fff', padding: 30, borderRadius: 15 }}>
            <button onClick={() => { setForm({}); setModalType('client'); setShowModal(true) }} style={{ padding: '10px 20px', background: '#000', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>+ NOVO CLIENTE</button>
            <table style={{ width: '100%', marginTop: 20, borderCollapse: 'collapse' }}>
              <thead><tr style={{ textAlign: 'left', color: '#ccc', fontSize: 12 }}><th style={{ padding: 10 }}>NOME</th><th>TELEFONE</th><th>AÇÕES</th></tr></thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td style={{ padding: 15 }}>{c.full_name}</td>
                    <td>{c.phone}</td>
                    <td onClick={() => { setForm(c); setModalType('client'); setShowModal(true) }} style={{ cursor: 'pointer' }}>✏️</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 40, borderRadius: 20, width: 400 }}>
            <h3 style={{ marginBottom: 25 }}>{form.id ? 'Editar' : 'Novo'} {modalType === 'booking' ? 'Agendamento' : 'Cliente'}</h3>
            
            {modalType === 'booking' && (
              <>
                <label style={{ fontSize: 11, color: THEME.textLight }}>CLIENTE</label>
                <select value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} style={{ width: '100%', padding: 12, marginBottom: 15, borderRadius: 8, border: '1px solid #eee' }}>
                  <option value="">Selecionar Cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.full_name}>{c.full_name}</option>)}
                </select>

                <label style={{ fontSize: 11, color: THEME.textLight }}>SERVIÇO</label>
                <select value={form.service_name} onChange={e => setForm({...form, service_name: e.target.value})} style={{ width: '100%', padding: 12, marginBottom: 15, borderRadius: 8, border: '1px solid #eee' }}>
                  <option value="">Selecionar Serviço...</option>
                  {services.filter(s => s.tipo === profs.find(p => p.full_name === (form.profId || form.professional_name))?.tipo).map(s => <option key={s.id} value={s.name}>{s.name} (R${s.price})</option>)}
                </select>

                <label style={{ fontSize: 11, color: THEME.textLight }}>PROFISSIONAL</label>
                <input disabled={role !== 'admin'} value={form.profId || form.professional_name} style={{ width: '100%', padding: 12, marginBottom: 20, borderRadius: 8, border: '1px solid #eee', background: '#f9f9f9' }} />

                {form.id && (
                  <button onClick={cancelBooking} style={{ width: '100%', padding: 10, background: 'none', border: `1px solid ${THEME.danger}`, color: THEME.danger, borderRadius: 8, cursor: 'pointer', marginBottom: 10, fontWeight: 700 }}>DESMARCAR SERVIÇO</button>
                )}
              </>
            )}

            {modalType === 'client' && (
              <>
                <input placeholder="Nome Completo" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} style={{ width: '100%', padding: 12, marginBottom: 15, borderRadius: 8, border: '1px solid #eee' }} />
                <input placeholder="Telefone (WhatsApp)" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={{ width: '100%', padding: 12, marginBottom: 20, borderRadius: 8, border: '1px solid #eee' }} />
              </>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSave} style={{ flex: 1, padding: 12, background: '#000', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>SALVAR</button>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 12, background: '#eee', border: 'none', borderRadius: 8, cursor: 'pointer' }}>FECHAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
