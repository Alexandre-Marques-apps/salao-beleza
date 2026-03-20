'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

// CONFIGURAÇÃO VISUAL - AURA LUXE / L'ATELIER SALON
const THEME = {
  gold: '#8B5E34',        // Ocre/Dourado Aura
  goldLight: '#AF8B58',
  bg: '#F8F6F2',          // Fundo Off-white
  card: '#FFFFFF',
  text: '#1A1A1A',        // Preto suave
  textLight: '#7A7A7A',
  danger: '#A63D40',
  success: '#4A6741',
  busy: '#EFEBE6'         // Cor para slots ocupados
}

const HORARIOS = [
  '08:00','08:15','08:30','08:45','09:00','09:15','09:30','09:45',
  '10:00','10:15','10:30','10:45','11:00','11:15','11:30','11:45',
  '12:00','12:15','12:30','12:45','13:00','13:15','13:30','13:45',
  '14:00','14:15','14:30','14:45','15:00','15:15','15:30','15:45',
  '16:00','16:15','16:30','16:45','17:00','17:15','17:30','17:45','18:00',
]

// HELPERS
const timeToMin = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const isPast = (date, time) => {
  const now = new Date();
  const selected = new Date(`${date}T${time || '00:00'}:00`);
  return selected < now;
};

// ── COMPONENTES DE UI LUXO ─────────────────────────────────────────
const AuraCard = ({ children, style }) => (
  <div style={{ background: THEME.card, borderRadius: 12, border: '1px solid #EAE8E4', padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', ...style }}>
    {children}
  </div>
);

const GoldButton = ({ children, onClick, style, variant = 'full' }) => (
  <button onClick={onClick} style={{
    background: variant === 'full' ? THEME.gold : 'transparent',
    color: variant === 'full' ? '#FFF' : THEME.gold,
    border: variant === 'full' ? 'none' : `1.5px solid ${THEME.gold}`,
    padding: '12px 24px', borderRadius: 8, fontSize: 11, fontWeight: 700, 
    letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', ...style
  }}>
    {children}
  </button>
);

// ── TELA DE LOGIN LUXO ─────────────────────────────────────────────
function LoginScreen({ onLoginSuccess }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    if (user === 'Alexandre' && pass === '123456') {
      onLoginSuccess('admin', { full_name: 'Alexandre' });
      return;
    }
    const { data, error } = await supabase.from('salon_professionals').select('*').ilike('full_name', user.trim()).eq('active', true).single();
    if (!error && data && (data.senha || '123456') === pass) {
      onLoginSuccess('profissional', data);
    } else { alert('Credentials Incorrect.'); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: THEME.bg }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600&display=swap');`}</style>
      <div style={{ width: 400, textAlign: 'center', fontFamily: '"Inter", sans-serif' }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 36, color: THEME.gold, marginBottom: 40 }}>Aura Luxe</h1>
        <AuraCard>
          <p style={{ fontSize: 11, color: THEME.textLight, letterSpacing: 2, marginBottom: 30 }}>PREMIUM SALON MANAGEMENT</p>
          <input placeholder="Username" value={user} onChange={e => setUser(e.target.value)} style={{ width: '100%', padding: 14, borderRadius: 8, border: '1px solid #EAE8E4', marginBottom: 12, outline: 'none' }} />
          <input type="password" placeholder="Password" value={pass} onChange={e => setPass(e.target.value)} style={{ width: '100%', padding: 14, borderRadius: 8, border: '1px solid #EAE8E4', marginBottom: 25, outline: 'none' }} />
          <GoldButton onClick={handleLogin} style={{ width: '100%' }}>{loading ? 'Entering...' : 'Sign In'}</GoldButton>
        </AuraCard>
      </div>
    </div>
  );
}

// ── PAINEL PRINCIPAL ─────────────────────────────────────────
export default function SalonApp() {
  const [role, setRole] = useState(null);
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [profs, setProfs] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [form, setForm] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [p, s, b, c] = await Promise.all([
      supabase.from('salon_professionals').select('*').eq('active', true),
      supabase.from('services').select('*').eq('active', true),
      supabase.from('salon_bookings').select('*'),
      supabase.from('salon_clients').select('*')
    ]);
    setProfs(p.data || []); setServices(s.data || []); setBookings(b.data || []); setClients(c.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData() }, [loadData]);

  const isOccupied = (profName, date, time) => {
    const slotMin = timeToMin(time);
    return bookings.find(b => {
      if(b.booking_date !== date || b.professional_name !== profName || b.status === 'cancelled') return false;
      const start = timeToMin(b.start_time.slice(0, 5));
      const srv = services.find(s => s.name === b.service_name);
      const end = start + (srv?.duration_min || 30);
      return slotMin >= start && slotMin < end;
    });
  };

  async function handleAction() {
    if (isPast(viewDate, form.time)) return alert("Date/Time is past.");
    const srv = services.find(s => s.name === form.service_name);
    const prof = profs.find(p => p.full_name === (form.profId || form.professional_name));
    
    const payload = {
      client_name: form.client_name, service_name: srv.name, professional_name: prof.full_name,
      booking_date: form.booking_date || viewDate, start_time: (form.time || form.start_time).slice(0,5) + ':00',
      service_price: srv.price, commission_pct: prof.commission_pct, status: 'scheduled'
    };

    if (form.id) await supabase.from('salon_bookings').update(payload).eq('id', form.id);
    else await supabase.from('salon_bookings').insert(payload);
    setShowModal(false); loadData();
  }

  if (!role) return <LoginScreen onLoginSuccess={(r, u) => { setRole(r); setMe(u); }} />;

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, display: 'flex', fontFamily: '"Inter", sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600&display=swap');`}</style>
      
      {/* SIDEBAR NAVIGATION - LOOK AURA */}
      <aside style={{ width: 280, background: '#FFF', borderRight: '1px solid #EAE8E4', padding: '40px 24px', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh' }}>
        <h2 style={{ fontFamily: '"Playfair Display", serif', color: THEME.gold, fontSize: 24, marginBottom: 48 }}>Aura Luxe</h2>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '⬚', admin: true },
            { id: 'agenda', label: 'Schedule', icon: '◷', admin: false },
            { id: 'clientes', label: 'Clients', icon: '◎', admin: true },
            { id: 'servicos', label: 'Services', icon: '╳', admin: true },
          ].map(item => {
            if (item.admin && role !== 'admin') return null;
            const active = tab === item.id;
            return (
              <div key={item.id} onClick={() => setTab(item.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
                background: active ? '#F9F7F2' : 'transparent', color: active ? THEME.gold : THEME.textLight,
                fontSize: 13, fontWeight: active ? 600 : 400, transition: '0.2s'
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span> {item.label}
              </div>
            )
          })}
        </div>

        <GoldButton onClick={() => { setForm({ client_name: '', service_name: '', profId: me.full_name, time: '08:00' }); setModalType('booking'); setShowModal(true); }}>
          Book Appointment
        </GoldButton>
        <button onClick={() => setRole(null)} style={{ marginTop: 20, background: 'none', border: 'none', fontSize: 11, color: '#CCC', cursor: 'pointer' }}>Sign Out</button>
      </aside>

      {/* CONTENT AREA */}
      <main style={{ marginLeft: 280, flex: 1, padding: '60px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 32 }}>{tab === 'dashboard' ? 'Monthly Performance' : tab.charAt(0).toUpperCase() + tab.slice(1)}</h1>
          <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #EAE8E4', background: '#FFF' }} />
        </header>

        {tab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            <AuraCard><p style={{ fontSize: 11, color: THEME.textLight }}>TOTAL REVENUE</p><h2 style={{ fontSize: 28 }}>R$ {bookings.filter(b => b.status === 'completed').reduce((acc, b) => acc + Number(b.price_charged), 0)}</h2></AuraCard>
            <AuraCard><p style={{ fontSize: 11, color: THEME.textLight }}>TOTAL APPOINTMENTS</p><h2 style={{ fontSize: 28 }}>{bookings.length}</h2></AuraCard>
            <AuraCard style={{ background: THEME.gold, color: '#FFF' }}><p style={{ fontSize: 11, opacity: 0.8 }}>NET PROFIT</p><h2 style={{ fontSize: 28 }}>R$ {bookings.filter(b => b.status === 'completed').reduce((acc, b) => acc + (Number(b.price_charged) - Number(b.commission_value)), 0)}</h2></AuraCard>
          </div>
        )}

        {tab === 'agenda' && (
          <div style={{ display: 'flex', gap: 24, overflowX: 'auto' }}>
            {(role === 'admin' ? profs : [me]).map(p => (
              <div key={p.id} style={{ minWidth: 280 }}>
                <h4 style={{ marginBottom: 20, fontSize: 14 }}>{p.full_name} <span style={{ color: THEME.gold, fontSize: 10 }}>• {p.tipo}</span></h4>
                <div style={{ background: '#FFF', borderRadius: 12, border: '1px solid #EAE8E4' }}>
                  {HORARIOS.map(h => {
                    const b = isOccupied(p.full_name, viewDate, h);
                    const isStart = b && b.start_time.slice(0, 5) === h;
                    const past = isPast(viewDate, h);
                    return (
                      <div key={h} 
                        onClick={() => {
                          if (past || (b && b.status === 'completed')) return;
                          if (!b) { setForm({ profId: p.full_name, time: h }); setModalType('booking'); setShowModal(true); }
                          else if (isStart) { setForm({...b, time: b.start_time.slice(0,5)}); setModalType('edit'); setShowModal(true); }
                        }}
                        style={{ padding: '14px 16px', borderBottom: '1px solid #F9F7F2', display: 'flex', alignItems: 'center', gap: 12, 
                                 background: b ? THEME.busy : 'transparent', cursor: past ? 'default' : 'pointer', opacity: past ? 0.4 : 1 }}>
                        <span style={{ fontSize: 10, color: '#CCC', width: 35 }}>{h}</span>
                        <div style={{ flex: 1 }}>
                          {isStart ? <div style={{ fontSize: 11, fontWeight: 600 }}>{b.client_name}</div> : b ? null : <span style={{ fontSize: 10, color: '#EEE' }}>—</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL - AURA STYLE */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,26,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#FFF', width: 440, borderRadius: 16, padding: 40 }}>
              <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 24, marginBottom: 30 }}>{modalType === 'edit' ? 'Appointment Details' : 'Book Appointment'}</h2>
              
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: THEME.gold, display: 'block', marginBottom: 8 }}>CLIENT NAME</label>
              <input value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #EAE8E4', marginBottom: 20 }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: THEME.gold, display: 'block', marginBottom: 8 }}>PROFESSIONAL</label>
                  <select disabled={role !== 'admin'} value={form.profId || form.professional_name} onChange={e => setForm({...form, profId: e.target.value, professional_name: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #EAE8E4' }}>
                    {profs.map(p => <option key={p.id} value={p.full_name}>{p.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: THEME.gold, display: 'block', marginBottom: 8 }}>TIME</label>
                  <select value={form.time} onChange={e => setForm({...form, time: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #EAE8E4' }}>
                    {HORARIOS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <label style={{ fontSize: 10, fontWeight: 700, color: THEME.gold, display: 'block', marginBottom: 8 }}>SERVICE</label>
              <select value={form.service_name} onChange={e => setForm({...form, service_name: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #EAE8E4', marginBottom: 30 }}>
                <option value="">Select Service...</option>
                {services.filter(s => s.tipo === profs.find(p => p.full_name === (form.profId || form.professional_name))?.tipo).map(s => <option key={s.id} value={s.name}>{s.name} (R$ {s.price})</option>)}
              </select>

              <div style={{ display: 'flex', gap: 12 }}>
                <GoldButton onClick={handleAction} style={{ flex: 1 }}>{form.id ? 'Save Changes' : 'Confirm'}</GoldButton>
                {form.id && <GoldButton variant="outline" onClick={async () => {
                  const val = Number(form.price_charged || services.find(s=>s.name===form.service_name).price);
                  await supabase.from('salon_bookings').update({ status: 'completed', price_charged: val, commission_value: (val * (form.commission_pct/100)).toFixed(2) }).eq('id', form.id);
                  setShowModal(false); loadData();
                }} style={{ flex: 1 }}>Checkout</GoldButton>}
              </div>
              <button onClick={() => setShowModal(false)} style={{ width: '100%', marginTop: 20, background: 'none', border: 'none', color: '#CCC', fontSize: 11, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
