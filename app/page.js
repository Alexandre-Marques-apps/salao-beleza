'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const THEME = {
  primary: '#c4a484',
  primaryDark: '#a68a6d',
  accent: '#fce4ec',
  text: '#2c2c2c',
  textLight: '#8e8e8e',
  bg: '#fdfbf9',
  white: '#ffffff',
  success: '#689f38',
  danger: '#d32f2f',
  busy: '#f8bbd0'
}

const HORARIOS = [
  '08:00','08:15','08:30','08:45','09:00','09:15','09:30','09:45',
  '10:00','10:15','10:30','10:45','11:00','11:15','11:30','11:45',
  '12:00','12:15','12:30','12:45','13:00','13:15','13:30','13:45',
  '14:00','14:15','14:30','14:45','15:00','15:15','15:30','15:45',
  '16:00','16:15','16:30','16:45','17:00','17:15','17:30','17:45','18:00',
]

const timeToMin = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const Badge = ({ children, type }) => {
  const styles = {
    cabelereiro: { bg: '#e8f5e9', c: '#2e7d32', icon: '✂️' },
    manicure: { bg: '#f3e5f5', c: '#7b1fa2', icon: '💅' },
    scheduled: { bg: '#fff3e0', c: '#e65100', icon: '⏳' },
    completed: { bg: '#e8f5e9', c: '#2e7d32', icon: '✅' }
  };
  const s = styles[type] || styles.scheduled;
  return (
    <span style={{ background: s.bg, color: s.c, padding: '4px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
      {s.icon} {children}
    </span>
  );
};

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
    } else {
      alert('Acesso negado. Verifique usuário e senha.');
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: THEME.bg, padding: 20 }}>
      <div style={{ background: '#fff', padding: 40, borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.05)', width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'serif', fontSize: 32, color: THEME.primary, marginBottom: 10 }}>Joudat Salon</h1>
        <p style={{ fontSize: 12, letterSpacing: 3, color: THEME.textLight, marginBottom: 40 }}>V0.8 · GESTÃO INTEGRADA</p>
        <input placeholder="Usuário" value={user} onChange={e => setUser(e.target.value)} style={{ width: '100%', padding: 15, borderRadius: 12, border: '1px solid #eee', marginBottom: 15, outline: 'none' }} />
        <input type="password" placeholder="Senha" value={pass} onChange={e => setPass(e.target.value)} style={{ width: '100%', padding: 15, borderRadius: 12, border: '1px solid #eee', marginBottom: 30, outline: 'none' }} />
        <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: 16, borderRadius: 12, background: THEME.primary, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
          {loading ? 'AUTENTICANDO...' : 'ENTRAR NO SISTEMA'}
        </button>
      </div>
    </div>
  );
}

export default function JoudatApp() {
  const [role, setRole] = useState(null);
  const [me, setMe] = useState(null);
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  const [profs, setProfs] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('booking');
  const [form, setForm] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [p, s, b, bl] = await Promise.all([
      supabase.from('salon_professionals').select('*').eq('active', true),
      supabase.from('services').select('*').eq('active', true),
      supabase.from('salon_bookings').select('*'),
      supabase.from('salon_blocks').select('*')
    ]);
    setProfs(p.data || []);
    setServices(s.data || []);
    setBookings(b.data || []);
    setBlocks(bl.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData() }, [loadData]);

  const isOccupied = (profName, date, time) => {
    const slotMin = timeToMin(time);
    const dayBookings = bookings.filter(b => b.booking_date === date && b.professional_name === profName && b.status !== 'cancelled');
    const dayBlocks = blocks.filter(bl => bl.block_date === date && bl.professional_name === profName);

    const bookingFound = dayBookings.find(b => {
      const start = timeToMin(b.start_time.slice(0, 5));
      const srv = services.find(s => s.name === b.service_name);
      const end = start + (srv?.duration_min || 30);
      return slotMin >= start && slotMin < end;
    });

    if (bookingFound) return { type: 'booking', data: bookingFound };

    const blockFound = dayBlocks.find(bl => {
      const start = timeToMin(bl.start_time.slice(0, 5));
      const end = timeToMin(bl.end_time.slice(0, 5));
      return slotMin >= start && slotMin < end;
    });

    if (blockFound) return { type: 'block', data: blockFound };
    return null;
  };

  const filteredServicesForModal = useMemo(() => {
    const prof = profs.find(p => p.full_name === form.profId);
    if (!prof) return services;
    return services.filter(s => s.tipo === prof.tipo);
  }, [form.profId, profs, services]);

  async function handleCheckout() {
    const val = Number(form.price_charged);
    const pct = Number(form.commission_pct || 40);
    const comValue = (val * (pct / 100)).toFixed(2);
    const { error } = await supabase.from('salon_bookings').update({
      status: 'completed',
      price_charged: val,
      commission_value: comValue,
      payment_method: form.payment_method || 'PIX'
    }).eq('id', form.id);
    if (!error) { setShowModal(false); loadData(); }
  }

  async function handleSaveBooking() {
    const srv = services.find(s => s.name === form.service_name);
    const prof = profs.find(p => p.full_name === form.profId);
    if (!form.client_name || !srv || !prof) return alert('Preencha os dados');
    const { error } = await supabase.from('salon_bookings').insert({
      client_name: form.client_name,
      service_name: srv.name,
      professional_name: prof.full_name,
      booking_date: viewDate,
      start_time: form.time + ':00',
      status: 'scheduled',
      service_price: srv.price,
      commission_pct: prof.commission_pct || 40
    });
    if (!error) { setShowModal(false); loadData(); }
    else alert(error.message);
  }

  if (!role) return <LoginScreen onLoginSuccess={(r, u) => { setRole(r); setMe(u); }} />;

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, color: THEME.text }}>
      <nav style={{ background: '#fff', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: THEME.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{me.full_name[0]}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{me.full_name}</div>
            <div style={{ fontSize: 10, color: THEME.primary, fontWeight: 700 }}>{role.toUpperCase()}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} style={{ padding: '8px', borderRadius: 10, border: '1px solid #eee' }} />
          <button onClick={() => setRole(null)} style={{ padding: '8px 15px', borderRadius: 10, border: '1px solid #eee', background: 'none', cursor: 'pointer' }}>SAIR</button>
        </div>
      </nav>

      <div style={{ padding: 20 }}>
        {role === 'admin' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 20 }}>
              <thead>
                <tr>
                  <th style={{ padding: 15, textAlign: 'left' }}>HORA</th>
                  {profs.map(p => <th key={p.id} style={{ padding: 15 }}>{p.full_name}</th>)}
                </tr>
              </thead>
              <tbody>
                {HORARIOS.map(h => (
                  <tr key={h} style={{ borderTop: '1px solid #f9f9f9' }}>
                    <td style={{ padding: 15, fontSize: 11, color: '#ccc' }}>{h}</td>
                    {profs.map(p => {
                      const status = isOccupied(p.full_name, viewDate, h);
                      return (
                        <td key={p.id} 
                          onClick={() => !status && (setForm({ profId: p.full_name, time: h }), setModalType('booking'), setShowModal(true))}
                          style={{ padding: 5, height: 45, background: status ? THEME.busy : 'transparent', cursor: 'pointer' }}>
                          {status?.type === 'booking' && status.data.start_time.slice(0,5) === h && (
                            <div style={{ fontSize: 10 }}>
                              <strong>{status.data.client_name}</strong>
                              {status.data.status !== 'completed' && <div onClick={(e) => { e.stopPropagation(); setForm(status.data); setModalType('checkout'); setShowModal(true); }} style={{ color: THEME.primary, fontWeight: 'bold' }}>FECHAR</div>}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            {HORARIOS.map(h => {
              const status = isOccupied(me.full_name, viewDate, h);
              return (
                <div key={h} style={{ background: '#fff', padding: 15, borderRadius: 15, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{h}</span>
                  <strong>{status?.type === 'booking' ? status.data.client_name : 'Livre'}</strong>
                  {status?.type === 'booking' && status.data.status !== 'completed' && <button onClick={() => { setForm(status.data); setModalType('checkout'); setShowModal(true); }}>FINALIZAR</button>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 30, borderRadius: 20, width: '100%', maxWidth: 400 }}>
            {modalType === 'booking' ? (
              <>
                <h3>Novo Agendamento</h3>
                <input placeholder="Cliente" onChange={e => setForm({...form, client_name: e.target.value})} style={{ width: '100%', marginBottom: 10, padding: 10 }} />
                <select onChange={e => setForm({...form, service_name: e.target.value})} style={{ width: '100%', marginBottom: 10, padding: 10 }}>
                  <option value="">Serviço...</option>
                  {filteredServicesForModal.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                <button onClick={handleSaveBooking}>SALVAR</button>
              </>
            ) : (
              <>
                <h3>Fechar Atendimento</h3>
                <input type="number" defaultValue={form.service_price} onChange={e => setForm({...form, price_charged: e.target.value})} style={{ width: '100%', marginBottom: 10, padding: 10 }} />
                <button onClick={handleCheckout}>CONCLUIR</button>
              </>
            )}
            <button onClick={() => setShowModal(false)}>FECHAR</button>
          </div>
        </div>
      )}
    </div>
  );
}
