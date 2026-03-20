'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

// CONFIGURAÇÃO VISUAL - LUXURY THEME
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

// HELPERS DE VALIDAÇÃO
const timeToMin = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };

const isPast = (date, time) => {
  const now = new Date();
  const selected = new Date(`${date}T${time || '00:00'}:00`);
  return selected < now;
};

// ── COMPONENTES DE UI ─────────────────────────────────────────
const Badge = ({ children, type }) => {
  const styles = {
    cabelereiro: { bg: '#e8f5e9', c: '#2e7d32', icon: '✂️' },
    manicure: { bg: '#f3e5f5', c: '#7b1fa2', icon: '💅' },
    scheduled: { bg: '#fff3e0', c: '#e65100', icon: '⏳' },
    completed: { bg: '#e8f5e9', c: '#2e7d32', icon: '✅' }
  };
  const s = styles[type] || styles.scheduled;
  return (
    <span style={{ background: s.bg, color: s.c, padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {s.icon} {children}
    </span>
  );
};

// ── TELA DE LOGIN ─────────────────────────────────────────────
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
    } else { alert('Acesso negado. Verifique usuário e senha.'); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: THEME.bg, padding: 20 }}>
      <div style={{ background: '#fff', padding: 40, borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.05)', width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'serif', fontSize: 32, color: THEME.primary, marginBottom: 10 }}>Joudat Salon</h1>
        <p style={{ fontSize: 10, letterSpacing: 3, color: '#ccc', marginBottom: 40 }}>V0.9 · ÁREA RESTRITA</p>
        <input placeholder="Usuário" value={user} onChange={e => setUser(e.target.value)} style={{ width: '100%', padding: 15, borderRadius: 12, border: '1px solid #eee', marginBottom: 15, outline: 'none' }} />
        <input type="password" placeholder="Senha" value={pass} onChange={e => setPass(e.target.value)} style={{ width: '100%', padding: 15, borderRadius: 12, border: '1px solid #eee', marginBottom: 30, outline: 'none' }} />
        <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: 16, borderRadius: 12, background: THEME.primary, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>ACESSAR PAINEL</button>
      </div>
    </div>
  );
}

// ── APP PRINCIPAL ─────────────────────────────────────────────
export default function JoudatApp() {
  const [role, setRole] = useState(null);
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState('agenda');
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [profs, setProfs] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // booking, checkout, edit_booking
  const [form, setForm] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [p, s, b] = await Promise.all([
      supabase.from('salon_professionals').select('*').eq('active', true),
      supabase.from('services').select('*').eq('active', true),
      supabase.from('salon_bookings').select('*')
    ]);
    setProfs(p.data || []);
    setServices(s.data || []);
    setBookings(b.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData() }, [loadData]);

  // LÓGICA DE OCUPAÇÃO
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

  // SALVAR / EDITAR AGENDAMENTO
  async function handleSaveBooking() {
    if (isPast(viewDate, form.time)) return alert("Não é possível agendar ou editar para um horário que já passou.");
    
    const srv = services.find(s => s.name === form.service_name);
    const prof = profs.find(p => p.full_name === (form.profId || form.professional_name));
    
    const payload = {
      client_name: form.client_name,
      service_name: srv.name,
      professional_name: prof.full_name,
      booking_date: form.booking_date || viewDate,
      start_time: (form.time || form.start_time).slice(0,5) + ':00',
      service_price: srv.price,
      commission_pct: prof.commission_pct,
      status: 'scheduled'
    };

    let error;
    if (form.id) {
      const { error: err } = await supabase.from('salon_bookings').update(payload).eq('id', form.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('salon_bookings').insert(payload);
      error = err;
    }

    if(!error) { setShowModal(false); loadData(); } else { alert(error.message); }
  }

  if (!role) return <LoginScreen onLoginSuccess={(r, u) => { setRole(r); setMe(u); if(r === 'profissional') setTab('agenda'); }} />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: THEME.bg }}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside style={{ width: 260, background: '#fff', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', padding: '30px 20px', position: 'fixed', height: '100vh' }}>
        <h2 style={{ fontFamily: 'serif', color: THEME.primary, marginBottom: 40, textAlign: 'center' }}>Joudat Salon</h2>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {role === 'admin' && <button onClick={() => setTab('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 15, borderRadius: 12, border: 'none', background: tab === 'dashboard' ? THEME.accent : 'transparent', cursor: 'pointer' }}>📊 Dashboard</button>}
          
          <button onClick={() => setTab('agenda')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 15, borderRadius: 12, border: 'none', background: tab === 'agenda' ? THEME.accent : 'transparent', cursor: 'pointer' }}>📅 Minha Agenda</button>
          
          {role === 'admin' && (
            <>
              <button onClick={() => setTab('financeiro')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 15, borderRadius: 12, border: 'none', background: tab === 'financeiro' ? THEME.accent : 'transparent', cursor: 'pointer' }}>💰 Financeiro Geral</button>
              <button onClick={() => setTab('equipe')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 15, borderRadius: 12, border: 'none', background: tab === 'equipe' ? THEME.accent : 'transparent', cursor: 'pointer' }}>✦ Gestão de Equipe</button>
            </>
          )}

          {role === 'profissional' && <button onClick={() => setTab('meus_ganhos')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 15, borderRadius: 12, border: 'none', background: tab === 'meus_ganhos' ? THEME.accent : 'transparent', cursor: 'pointer' }}>💎 Meus Rendimentos</button>}
        </div>

        <button onClick={() => setRole(null)} style={{ padding: 15, borderRadius: 12, border: '1px solid #eee', background: 'none', cursor: 'pointer', color: THEME.danger, fontWeight: 'bold' }}>SAIR</button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ marginLeft: 260, flex: 1, padding: 40 }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>{tab.toUpperCase()}</h1>
          <input type="date" min={new Date().toISOString().split('T')[0]} value={viewDate} onChange={e => setViewDate(e.target.value)} style={{ padding: '12px', borderRadius: 12, border: '1px solid #eee' }} />
        </header>

        {/* TELA: AGENDA */}
        {tab === 'agenda' && (
          <div style={{ background: '#fff', padding: 25, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.02)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ padding: 15, textAlign: 'left', color: '#ccc', fontSize: 12 }}>HORA</th>
                  {(role === 'admin' ? profs : [me]).map(p => <th key={p.id} style={{ padding: 15 }}>{p.full_name} <br/><Badge type={p.tipo}>{p.tipo}</Badge></th>)}
                </tr>
              </thead>
              <tbody>
                {HORARIOS.map(h => (
                  <tr key={h} style={{ borderTop: '1px solid #f9f9f9' }}>
                    <td style={{ padding: 15, fontSize: 11, fontWeight: 700, color: '#ccc' }}>{h}</td>
                    {(role === 'admin' ? profs : [me]).map(p => {
                      const b = isOccupied(p.full_name, viewDate, h);
                      const isPastSlot = isPast(viewDate, h);
                      const isStart = b && b.start_time.slice(0, 5) === h;

                      return (
                        <td key={p.id} 
                          onClick={() => {
                            if(isPastSlot || (b && b.status === 'completed')) return;
                            if(!b) { setForm({ profId: p.full_name, time: h }); setModalType('booking'); setShowModal(true); }
                            else if(isStart) { setForm({...b, time: b.start_time.slice(0,5)}); setModalType('edit_booking'); setShowModal(true); }
                          }}
                          style={{ padding: 4, height: 50, background: b ? (b.status === 'completed' ? '#e8f5e9' : THEME.busy) : 'transparent', cursor: isPastSlot ? 'default' : 'pointer', opacity: isPastSlot ? 0.4 : 1 }}>
                          {isStart && (
                            <div style={{ fontSize: 10, padding: 5 }}>
                              <div style={{ fontWeight: 800 }}>{b.client_name}</div>
                              <div style={{ fontSize: 9, opacity: 0.6 }}>{b.service_name}</div>
                              {b.status !== 'completed' && <div style={{ color: THEME.primary, fontWeight: 'bold', marginTop: 5 }}>EDITAR / FECHAR</div>}
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
        )}

        {/* TELA: RENDIMENTOS DO PROFISSIONAL */}
        {tab === 'meus_ganhos' && (
          <div style={{ maxWidth: 800 }}>
            <div style={{ background: THEME.primary, color: '#fff', padding: 30, borderRadius: 24, marginBottom: 30 }}>
              <p style={{ fontSize: 12, opacity: 0.8 }}>MINHA COMISSÃO ACUMULADA (MÊS)</p>
              <h2 style={{ fontSize: 36 }}>R$ {bookings.filter(b => b.professional_name === me.full_name && b.status === 'completed').reduce((acc, b) => acc + Number(b.commission_value), 0).toFixed(2)}</h2>
            </div>
            <div style={{ background: '#fff', padding: 30, borderRadius: 24 }}>
              <h3>Histórico de Serviços</h3>
              {bookings.filter(b => b.professional_name === me.full_name && b.status === 'completed').map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #f9f9f9' }}>
                  <div><strong>{b.client_name}</strong><br/><small>{b.booking_date} - {b.service_name}</small></div>
                  <div style={{ textAlign: 'right', color: THEME.success }}>+ R$ {b.commission_value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* OUTRAS TELAS DE ADMIN (SIMPLIFICADAS PARA O EXEMPLO) */}
        {role === 'admin' && tab === 'financeiro' && <div style={{ background: '#fff', padding: 30, borderRadius: 24 }}><h3>Relatório Geral de Vendas</h3><p>Total Geral: R$ {bookings.filter(b => b.status === 'completed').reduce((acc, b) => acc + Number(b.price_charged), 0)}</p></div>}
      </main>

      {/* MODAL DE AGENDAMENTO / EDIÇÃO */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', padding: 35, borderRadius: 24, width: '100%', maxWidth: 450 }}>
            <h2 style={{ fontFamily: 'serif', marginBottom: 25 }}>{modalType === 'edit_booking' ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
            
            <label style={{ fontSize: 11, fontWeight: 700, color: THEME.primary }}>NOME DA CLIENTE</label>
            <input value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #eee', marginBottom: 15 }} />

            <label style={{ fontSize: 11, fontWeight: 700, color: THEME.primary }}>DATA</label>
            <input type="date" value={form.booking_date || viewDate} onChange={e => setForm({...form, booking_date: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #eee', marginBottom: 15 }} />

            <label style={{ fontSize: 11, fontWeight: 700, color: THEME.primary }}>HORÁRIO</label>
            <select value={form.time} onChange={e => setForm({...form, time: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #eee', marginBottom: 15 }}>
              {HORARIOS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>

            <label style={{ fontSize: 11, fontWeight: 700, color: THEME.primary }}>PROFISSIONAL {role !== 'admin' && '(Apenas Admin pode alterar)'}</label>
            <select 
              disabled={role !== 'admin'} 
              value={form.profId || form.professional_name} 
              onChange={e => setForm({...form, profId: e.target.value, professional_name: e.target.value})} 
              style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #eee', marginBottom: 15, background: role !== 'admin' ? '#f5f5f5' : '#fff' }}>
              {profs.map(p => <option key={p.id} value={p.full_name}>{p.full_name}</option>)}
            </select>

            <label style={{ fontSize: 11, fontWeight: 700, color: THEME.primary }}>SERVIÇO</label>
            <select value={form.service_name} onChange={e => setForm({...form, service_name: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #eee', marginBottom: 25 }}>
              <option value="">Selecione...</option>
              {services.filter(s => s.tipo === profs.find(p => p.full_name === (form.profId || form.professional_name))?.tipo).map(s => <option key={s.id} value={s.name}>{s.name} (R${s.price})</option>)}
            </select>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSaveBooking} style={{ flex: 1, padding: 15, borderRadius: 12, background: THEME.primary, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>{form.id ? 'ATUALIZAR' : 'RESERVAR'}</button>
              {form.id && <button onClick={() => { setModalType('checkout'); }} style={{ flex: 1, padding: 15, borderRadius: 12, background: THEME.success, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>FECHAR $$$</button>}
            </div>
            <button onClick={() => setShowModal(false)} style={{ width: '100%', marginTop: 15, background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}>CANCELAR</button>
          </div>
        </div>
      )}

      {/* MODAL DE CHECKOUT (VALOR FINAL) */}
      {showModal && modalType === 'checkout' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}>
          <div style={{ background: '#fff', padding: 35, borderRadius: 24, width: '100%', maxWidth: 400, textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'serif', marginBottom: 10 }}>Finalizar Atendimento</h2>
            <p style={{ color: THEME.textLight, marginBottom: 20 }}>{form.client_name} - {form.service_name}</p>
            <input type="number" defaultValue={form.service_price} onChange={e => setForm({...form, price_charged: e.target.value})} style={{ width: '100%', padding: 20, fontSize: 24, textAlign: 'center', borderRadius: 15, border: '2px solid #eee', marginBottom: 20, fontWeight: 800 }} />
            <button onClick={async () => {
              const val = Number(form.price_charged || form.service_price);
              const pct = Number(form.commission_pct);
              await supabase.from('salon_bookings').update({
                status: 'completed', price_charged: val, commission_value: (val * (pct / 100)).toFixed(2)
              }).eq('id', form.id);
              setShowModal(false); loadData();
            }} style={{ width: '100%', padding: 15, borderRadius: 12, background: THEME.success, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>CONFIRMAR RECEBIMENTO</button>
            <button onClick={() => setModalType('edit_booking')} style={{ marginTop: 15, background: 'none', border: 'none', color: THEME.primary, cursor: 'pointer' }}>VOLTAR</button>
          </div>
        </div>
      )}

    </div>
  );
}
