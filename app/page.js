'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

// CONFIGURAÇÃO VISUAL - LUXURY THEME
const THEME = {
  primary: '#c4a484', // Dourado Champagne
  primaryDark: '#a68a6d',
  accent: '#fce4ec',   // Rosa Seco
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

// HELPERS
const timeToMin = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
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
    <span style={{ background: s.bg, color: s.c, padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
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
    } else { alert('Acesso negado.'); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: THEME.bg, padding: 20 }}>
      <div style={{ background: '#fff', padding: 40, borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.05)', width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'serif', fontSize: 32, color: THEME.primary, marginBottom: 10 }}>Joudat Salon</h1>
        <p style={{ fontSize: 10, letterSpacing: 3, color: '#ccc', marginBottom: 40 }}>EXCELLENCE IN BEAUTY</p>
        <input placeholder="Usuário" value={user} onChange={e => setUser(e.target.value)} style={{ width: '100%', padding: 15, borderRadius: 12, border: '1px solid #eee', marginBottom: 15, outline: 'none' }} />
        <input type="password" placeholder="Senha" value={pass} onChange={e => setPass(e.target.value)} style={{ width: '100%', padding: 15, borderRadius: 12, border: '1px solid #eee', marginBottom: 30, outline: 'none' }} />
        <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: 16, borderRadius: 12, background: THEME.primary, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>ENTRAR</button>
      </div>
    </div>
  );
}

// ── APP PRINCIPAL ─────────────────────────────────────────────
export default function JoudatApp() {
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
  const [modalType, setModalType] = useState(''); // booking, professional, service, client, checkout
  const [form, setForm] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [p, s, b, c] = await Promise.all([
      supabase.from('salon_professionals').select('*').eq('active', true).order('full_name'),
      supabase.from('services').select('*').eq('active', true).order('name'),
      supabase.from('salon_bookings').select('*').order('start_time'),
      supabase.from('salon_clients').select('*').order('full_name')
    ]);
    setProfs(p.data || []);
    setServices(s.data || []);
    setBookings(b.data || []);
    setClients(c.data || []);
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

  // HANDLERS DE CADASTRO
  async function saveProfessional() {
    const { error } = await supabase.from('salon_professionals').insert(form);
    if(!error) { setShowModal(false); loadData(); }
  }
  async function saveService() {
    const { error } = await supabase.from('services').insert(form);
    if(!error) { setShowModal(false); loadData(); }
  }
  async function saveClient() {
    const { error } = await supabase.from('salon_clients').insert(form);
    if(!error) { setShowModal(false); loadData(); }
  }
  async function handleSaveBooking() {
    const srv = services.find(s => s.name === form.service_name);
    const prof = profs.find(p => p.full_name === form.profId);
    await supabase.from('salon_bookings').insert({
      client_name: form.client_name, service_name: srv.name, professional_name: prof.full_name,
      booking_date: viewDate, start_time: form.time + ':00', status: 'scheduled',
      service_price: srv.price, commission_pct: prof.commission_pct
    });
    setShowModal(false); loadData();
  }
  async function handleCheckout() {
    const val = Number(form.price_charged);
    const pct = Number(form.commission_pct);
    await supabase.from('salon_bookings').update({
      status: 'completed', price_charged: val, commission_value: (val * (pct / 100)).toFixed(2)
    }).eq('id', form.id);
    setShowModal(false); loadData();
  }

  if (!role) return <LoginScreen onLoginSuccess={(r, u) => { setRole(r); setMe(u); }} />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: THEME.bg }}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside style={{ width: 260, background: '#fff', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', padding: '30px 20px', position: 'fixed', height: '100vh' }}>
        <h2 style={{ fontFamily: 'serif', color: THEME.primary, marginBottom: 40, textAlign: 'center' }}>Joudat Salon</h2>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊', adminOnly: true },
            { id: 'agenda', label: 'Agenda', icon: '📅', adminOnly: false },
            { id: 'financeiro', label: 'Financeiro', icon: '💰', adminOnly: true },
            { id: 'clientes', label: 'Clientes', icon: '👥', adminOnly: true },
            { id: 'profissionais', label: 'Equipe', icon: '✦', adminOnly: true },
            { id: 'servicos', label: 'Serviços', icon: '✂️', adminOnly: true },
          ].map(item => {
            if(item.adminOnly && role !== 'admin') return null;
            const active = tab === item.id;
            return (
              <button key={item.id} onClick={() => setTab(item.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '15px 20px', borderRadius: 12, border: 'none',
                background: active ? THEME.accent : 'transparent', color: active ? THEME.primaryDark : THEME.text,
                fontSize: 14, fontWeight: active ? 700 : 500, cursor: 'pointer', textAlign: 'left', transition: '0.2s'
              }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span> {item.label}
              </button>
            )
          })}
        </div>

        <button onClick={() => setRole(null)} style={{ padding: 15, borderRadius: 12, border: '1px solid #eee', background: 'none', cursor: 'pointer', color: THEME.danger }}>SAIR DA CONTA</button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ marginLeft: 260, flex: 1, padding: 40 }}>
        
        {/* HEADER DINÂMICO */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>{tab.toUpperCase()}</h1>
            <p style={{ color: THEME.textLight, fontSize: 13 }}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid #eee', outline: 'none', background: '#fff' }} />
        </header>

        {/* TELA: DASHBOARD */}
        {tab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            <div style={{ background: '#fff', padding: 30, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: THEME.textLight }}>FATURAMENTO HOJE</p>
              <h2 style={{ fontSize: 28, color: THEME.primary }}>R$ {bookings.filter(b => b.booking_date === viewDate && b.status === 'completed').reduce((acc, b) => acc + Number(b.price_charged), 0)}</h2>
            </div>
            <div style={{ background: '#fff', padding: 30, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: THEME.textLight }}>AGENDAMENTOS</p>
              <h2 style={{ fontSize: 28, color: THEME.primary }}>{bookings.filter(b => b.booking_date === viewDate).length}</h2>
            </div>
            {/* ... Adicionar outros KPIs aqui */}
          </div>
        )}

        {/* TELA: AGENDA (GRADE) */}
        {tab === 'agenda' && (
          <div style={{ background: '#fff', padding: 25, borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.03)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={{ padding: 15, textAlign: 'left', fontSize: 12, color: THEME.textLight }}>HORA</th>
                  {(role === 'admin' ? profs : [me]).map(p => (
                    <th key={p.id} style={{ padding: 15, textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{p.full_name}</div>
                      <Badge type={p.tipo}>{p.tipo}</Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HORARIOS.map(h => (
                  <tr key={h} style={{ borderTop: '1px solid #f9f9f9' }}>
                    <td style={{ padding: '15px', fontSize: 11, fontWeight: 700, color: '#ccc' }}>{h}</td>
                    {(role === 'admin' ? profs : [me]).map(p => {
                      const b = isOccupied(p.full_name, viewDate, h);
                      const isStart = b && b.start_time.slice(0, 5) === h;
                      return (
                        <td key={p.id} onClick={() => !b && role === 'admin' && (setForm({ profId: p.full_name, time: h }), setModalType('booking'), setShowModal(true))}
                          style={{ padding: 4, height: 50, background: b ? (b.status === 'completed' ? '#e8f5e9' : THEME.busy) : 'transparent', cursor: b ? 'default' : 'pointer' }}>
                          {isStart && (
                            <div style={{ fontSize: 10, padding: 5 }}>
                              <div style={{ fontWeight: 800 }}>{b.client_name}</div>
                              {b.status !== 'completed' && <button onClick={(e) => { e.stopPropagation(); setForm(b); setModalType('checkout'); setShowModal(true); }} style={{ marginTop: 4, padding: '2px 5px', border: '1px solid #ddd', borderRadius: 4, background: '#fff', fontSize: 9, cursor: 'pointer' }}>FECHAR</button>}
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

        {/* TELA: PROFISSIONAIS */}
        {tab === 'profissionais' && (
          <div>
            <button onClick={() => { setForm({ full_name: '', tipo: 'cabelereiro', commission_pct: 40 }); setModalType('professional'); setShowModal(true); }} style={{ marginBottom: 20, padding: '12px 25px', borderRadius: 12, background: THEME.primary, color: '#fff', border: 'none', cursor: 'pointer' }}>+ NOVO PROFISSIONAL</button>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {profs.map(p => (
                <div key={p.id} style={{ background: '#fff', padding: 25, borderRadius: 24, textAlign: 'center' }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: THEME.accent, margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{p.full_name[0]}</div>
                  <h3 style={{ fontSize: 16 }}>{p.full_name}</h3>
                  <Badge type={p.tipo}>{p.tipo}</Badge>
                  <p style={{ marginTop: 15, fontSize: 12, color: THEME.textLight }}>Comissão: <strong>{p.commission_pct}%</strong></p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TELA: SERVIÇOS */}
        {tab === 'servicos' && (
          <div>
            <button onClick={() => { setForm({ name: '', price: 0, duration_min: 30, tipo: 'cabelereiro' }); setModalType('service'); setShowModal(true); }} style={{ marginBottom: 20, padding: '12px 25px', borderRadius: 12, background: THEME.primary, color: '#fff', border: 'none', cursor: 'pointer' }}>+ NOVO SERVIÇO</button>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
              {services.map(s => (
                <div key={s.id} style={{ background: '#fff', padding: 20, borderRadius: 20, boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                  <Badge type={s.tipo}>{s.tipo}</Badge>
                  <h4 style={{ margin: '10px 0 5px' }}>{s.name}</h4>
                  <p style={{ fontSize: 20, fontWeight: 800, color: THEME.primary }}>R$ {s.price}</p>
                  <p style={{ fontSize: 11, color: '#ccc' }}>Duração: {s.duration_min} min</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TELA: FINANCEIRO */}
        {tab === 'financeiro' && (
          <div style={{ background: '#fff', padding: 30, borderRadius: 24 }}>
            <h3 style={{ marginBottom: 20 }}>Relatório de Comissões</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                  <th style={{ padding: 15 }}>PROFISSIONAL</th>
                  <th style={{ padding: 15 }}>TOTAL SERVIÇOS</th>
                  <th style={{ padding: 15 }}>A PAGAR (COMISSÃO)</th>
                </tr>
              </thead>
              <tbody>
                {profs.map(p => {
                  const myBookings = bookings.filter(b => b.professional_name === p.full_name && b.status === 'completed');
                  const totalCom = myBookings.reduce((acc, b) => acc + Number(b.commission_value), 0);
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                      <td style={{ padding: 15 }}>{p.full_name}</td>
                      <td style={{ padding: 15 }}>{myBookings.length}</td>
                      <td style={{ padding: 15, fontWeight: 700, color: THEME.primary }}>R$ {totalCom.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

      </main>

      {/* MODAL GENÉRICO PARA TUDO */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', padding: 35, borderRadius: 24, width: '100%', maxWidth: 450 }}>
            <h2 style={{ fontFamily: 'serif', marginBottom: 25, fontSize: 20 }}>{modalType.toUpperCase()}</h2>
            
            {/* CAMPOS DINÂMICOS CONFORME O TIPO */}
            {modalType === 'professional' && (
              <>
                <input placeholder="Nome Completo" onChange={e => setForm({...form, full_name: e.target.value})} style={{ width: '100%', padding: 12, marginBottom: 15, borderRadius: 10, border: '1px solid #eee' }} />
                <select onChange={e => setForm({...form, tipo: e.target.value})} style={{ width: '100%', padding: 12, marginBottom: 15, borderRadius: 10, border: '1px solid #eee' }}>
                  <option value="cabelereiro">Cabelereiro</option>
                  <option value="manicure">Manicure</option>
                </select>
                <input placeholder="% Comissão" type="number" onChange={e => setForm({...form, commission_pct: e.target.value})} style={{ width: '100%', padding: 12, marginBottom: 20, borderRadius: 10, border: '1px solid #eee' }} />
                <button onClick={saveProfessional} style={{ width: '100%', padding: 15, borderRadius: 12, background: THEME.primary, color: '#fff', border: 'none', fontWeight: 700 }}>SALVAR PROFISSIONAL</button>
              </>
            )}

            {modalType === 'service' && (
              <>
                <input placeholder="Nome do Serviço" onChange={e => setForm({...form, name: e.target.value})} style={{ width: '100%', padding: 12, marginBottom: 15, borderRadius: 10, border: '1px solid #eee' }} />
                <input placeholder="Preço R$" type="number" onChange={e => setForm({...form, price: e.target.value})} style={{ width: '100%', padding: 12, marginBottom: 15, borderRadius: 10, border: '1px solid #eee' }} />
                <input placeholder="Duração (minutos)" type="number" onChange={e => setForm({...form, duration_min: e.target.value})} style={{ width: '100%', padding: 12, marginBottom: 15, borderRadius: 10, border: '1px solid #eee' }} />
                <select onChange={e => setForm({...form, tipo: e.target.value})} style={{ width: '100%', padding: 12, marginBottom: 20, borderRadius: 10, border: '1px solid #eee' }}>
                  <option value="cabelereiro">Cabelo</option>
                  <option value="manicure">Unhas</option>
                </select>
                <button onClick={saveService} style={{ width: '100%', padding: 15, borderRadius: 12, background: THEME.primary, color: '#fff', border: 'none', fontWeight: 700 }}>SALVAR SERVIÇO</button>
              </>
            )}

            {modalType === 'booking' && (
              <>
                <input placeholder="Nome da Cliente" onChange={e => setForm({...form, client_name: e.target.value})} style={{ width: '100%', padding: 12, marginBottom: 15, borderRadius: 10, border: '1px solid #eee' }} />
                <select onChange={e => setForm({...form, service_name: e.target.value})} style={{ width: '100%', padding: 12, marginBottom: 20, borderRadius: 10, border: '1px solid #eee' }}>
                  <option value="">Selecione o Serviço...</option>
                  {services.filter(s => s.tipo === profs.find(p => p.full_name === form.profId)?.tipo).map(s => <option key={s.id} value={s.name}>{s.name} (R${s.price})</option>)}
                </select>
                <button onClick={handleSaveBooking} style={{ width: '100%', padding: 15, borderRadius: 12, background: THEME.primary, color: '#fff', border: 'none', fontWeight: 700 }}>CONFIRMAR AGENDAMENTO</button>
              </>
            )}

            {modalType === 'checkout' && (
              <>
                <p>Receber de: <strong>{form.client_name}</strong></p>
                <input type="number" defaultValue={form.service_price} onChange={e => setForm({...form, price_charged: e.target.value})} style={{ width: '100%', padding: 15, fontSize: 20, fontWeight: 700, margin: '20px 0', border: '2px solid #eee', borderRadius: 10 }} />
                <button onClick={handleCheckout} style={{ width: '100%', padding: 15, borderRadius: 12, background: THEME.success, color: '#fff', border: 'none', fontWeight: 700 }}>FINALIZAR PAGAMENTO</button>
              </>
            )}

            <button onClick={() => setShowModal(false)} style={{ width: '100%', marginTop: 10, padding: 10, background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}>FECHAR</button>
          </div>
        </div>
      )}

    </div>
  );
}
