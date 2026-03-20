Esta é a versão definitiva e profissional do seu Webapp, reconstruída do zero para atender a todas as regras de negócio e ao visual Luxury Boutique que você solicitou.

O código abaixo resolve os problemas de:

Conflito de Classe: Manicure só faz Unha, Cabelereiro só faz Cabelo.

Bloqueio por Duração: Um serviço de 60min bloqueia 4 slots de 15min.

Segurança de Login: Login único que identifica o nível de acesso.

Comissão Snapshot: O valor da comissão é gravado no fechamento e não muda mais.

1. Configuração do Banco de Dados (Supabase)

Antes de colar o código, certifique-se de que suas tabelas no Supabase tenham estas colunas:

salon_professionals: full_name, tipo (cabelereiro/manicure), commission_pct, schedule_start, schedule_end, senha, active.

services: name, tipo (cabelereiro/manicure), price, duration_min, category, active.

salon_bookings: client_name, service_name, professional_name, booking_date, start_time, status, service_price, price_charged, commission_pct, commission_value, payment_method.

salon_blocks: professional_name, block_date, start_time, end_time, reason.

2. O Código (Copie e substitua no seu page.js)
code
JavaScript
download
content_copy
expand_less
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

// ── COMPONENTES ATOMICOS ──────────────────────────────────────
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

// ── TELA DE LOGIN UNIFICADA ───────────────────────────────────
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
        <p style={{ marginTop: 20, fontSize: 11, color: '#ccc' }}>Senha padrão para profissionais: 123456</p>
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
  
  // Data States
  const [profs, setProfs] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('booking'); // booking | checkout
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

  // LÓGICA DE BLOQUEIO POR DURAÇÃO (PROBLEMA 2)
  const isOccupied = (profName, date, time) => {
    const slotMin = timeToMin(time);
    const dayBookings = bookings.filter(b => b.booking_date === date && b.professional_name === profName && b.status !== 'cancelled');
    const dayBlocks = blocks.filter(bl => bl.block_date === date && bl.professional_name === profName);

    // Checar agendamentos (considerando duração)
    const bookingFound = dayBookings.find(b => {
      const start = timeToMin(b.start_time.slice(0, 5));
      const srv = services.find(s => s.name === b.service_name);
      const end = start + (srv?.duration_min || 30);
      return slotMin >= start && slotMin < end;
    });

    if (bookingFound) return { type: 'booking', data: bookingFound };

    // Checar bloqueios manuais
    const blockFound = dayBlocks.find(bl => {
      const start = timeToMin(bl.start_time.slice(0, 5));
      const end = timeToMin(bl.end_time.slice(0, 5));
      return slotMin >= start && slotMin < end;
    });

    if (blockFound) return { type: 'block', data: blockFound };

    return null;
  };

  // LÓGICA DE FILTRO POR CLASSE (PROBLEMA 1)
  const filteredServicesForModal = useMemo(() => {
    const prof = profs.find(p => p.full_name === form.profId);
    if (!prof) return services;
    return services.filter(s => s.tipo === prof.tipo);
  }, [form.profId, profs, services]);

  // FINALIZAR ATENDIMENTO (COM SNAPSHOT DE COMISSÃO)
  async function handleCheckout() {
    const val = Number(form.price_charged);
    const pct = Number(form.commission_pct);
    const comValue = (val * (pct / 100)).toFixed(2);

    const { error } = await supabase.from('salon_bookings').update({
      status: 'completed',
      price_charged: val,
      commission_value: comValue,
      payment_method: form.payment_method || 'PIX'
    }).eq('id', form.id);

    if (!error) { setShowModal(false); loadData(); }
  }

  // AGENDAR
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
      commission_pct: prof.commission_pct // Snapshot da comissão atual
    });

    if (!error) { setShowModal(false); loadData(); }
    else alert(error.message);
  }

  if (!role) return <LoginScreen onLoginSuccess={(r, u) => { setRole(r); setMe(u); }} />;

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, color: THEME.text, fontFamily: 'sans-serif' }}>
      
      {/* NAVBAR */}
      <nav style={{ background: '#fff', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: THEME.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{me.full_name[0]}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{me.full_name}</div>
            <div style={{ fontSize: 10, color: THEME.primary, fontWeight: 700, letterSpacing: 1 }}>{role === 'admin' ? 'ADMINISTRADOR' : me.tipo?.toUpperCase()}</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 10 }}>
          <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #eee', outline: 'none' }} />
          <button onClick={() => setRole(null)} style={{ padding: '8px 15px', borderRadius: 10, border: `1px solid ${THEME.accent}`, background: 'none', color: THEME.text, fontSize: 12, cursor: 'pointer' }}>SAIR</button>
        </div>
      </nav>

      <div style={{ padding: 30 }}>
        
        {/* DASHBOARD ADMIN */}
        {role === 'admin' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
              {[
                { label: 'Faturamento Hoje', val: `R$ ${bookings.filter(b => b.booking_date === viewDate && b.status === 'completed').reduce((acc, b) => acc + Number(b.price_charged), 0)}`, icon: '💰' },
                { label: 'Agendamentos', val: bookings.filter(b => b.booking_date === viewDate).length, icon: '📅' },
                { label: 'Profissionais', val: profs.length, icon: '✦' },
                { label: 'Serviços Ativos', val: services.length, icon: '✂️' }
              ].map(k => (
                <div key={k.label} style={{ background: '#fff', padding: 25, borderRadius: 20, boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: 24, marginBottom: 10 }}>{k.icon}</div>
                  <div style={{ fontSize: 11, color: THEME.textLight, fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>{k.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: THEME.primary }}>{k.val}</div>
                </div>
              ))}
            </div>

            {/* GRADE HORÁRIA ADMIN */}
            <div style={{ background: '#fff', borderRadius: 24, padding: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.03)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                <thead>
                  <tr>
                    <th style={{ padding: 15, textAlign: 'left', fontSize: 12, color: THEME.textLight }}>HORÁRIO</th>
                    {profs.map(p => (
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
                      <td style={{ padding: '12px 15px', fontSize: 11, fontWeight: 700, color: '#ccc' }}>{h}</td>
                      {profs.map(p => {
                        const status = isOccupied(p.full_name, viewDate, h);
                        const isPast = viewDate < new Date().toISOString().split('T')[0] || (viewDate === new Date().toISOString().split('T')[0] && h < new Date().toLocaleTimeString('pt-BR').slice(0,5));

                        return (
                          <td key={p.id} 
                            onClick={() => !status && !isPast && (setForm({ profId: p.full_name, time: h }), setModalType('booking'), setShowModal(true))}
                            style={{ 
                              padding: 4, 
                              height: 45, 
                              background: status?.type === 'booking' ? (status.data.status === 'completed' ? '#e8f5e9' : THEME.busy) : status?.type === 'block' ? '#eee' : 'transparent',
                              cursor: status || isPast ? 'default' : 'pointer',
                              position: 'relative'
                            }}>
                            {status?.type === 'booking' && status.data.start_time.slice(0,5) === h && (
                              <div style={{ padding: '5px 10px', fontSize: 10 }}>
                                <div style={{ fontWeight: 800, color: status.data.status === 'completed' ? '#2e7d32' : '#c2185b' }}>{status.data.client_name}</div>
                                <div style={{ opacity: 0.6 }}>{status.data.service_name}</div>
                                {status.data.status !== 'completed' && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setForm(status.data); setModalType('checkout'); setShowModal(true); }}
                                    style={{ marginTop: 5, padding: '2px 6px', background: '#fff', border: '1px solid #eee', borderRadius: 4, fontSize: 9, cursor: 'pointer' }}>
                                    FECHAR ✓
                                  </button>
                                )}
                              </div>
                            )}
                            {status?.type === 'block' && status.data.start_time.slice(0,5) === h && (
                              <div style={{ fontSize: 9, color: '#999', textAlign: 'center' }}>🚫 BLOQUEADO</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* PAINEL PROFISSIONAL */}
        {role === 'profissional' && (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 30 }}>
              <div style={{ background: '#fff', padding: 20, borderRadius: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: THEME.textLight }}>COMISSÃO HOJE</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: THEME.primary }}>R$ {bookings.filter(b => b.booking_date === viewDate && b.professional_name === me.full_name && b.status === 'completed').reduce((acc, b) => acc + Number(b.commission_value), 0).toFixed(2)}</div>
              </div>
              <div style={{ background: '#fff', padding: 20, borderRadius: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: THEME.textLight }}>ATENDIMENTOS HOJE</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: THEME.primary }}>{bookings.filter(b => b.booking_date === viewDate && b.professional_name === me.full_name).length}</div>
              </div>
            </div>

            <h3 style={{ marginBottom: 20, fontSize: 16, color: THEME.textLight }}>AGENDA DO DIA</h3>
            {HORARIOS.map(h => {
              const status = isOccupied(me.full_name, viewDate, h);
              return (
                <div key={h} style={{ background: '#fff', padding: 15, borderRadius: 15, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 20, borderLeft: status?.type === 'booking' ? `4px solid ${THEME.primary}` : '4px solid #eee' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ccc', width: 50 }}>{h}</div>
                  <div style={{ flex: 1 }}>
                    {status?.type === 'booking' ? (
                      <div>
                        <div style={{ fontWeight: 700 }}>{status.data.client_name}</div>
                        <div style={{ fontSize: 11, color: THEME.textLight }}>{status.data.service_name}</div>
                      </div>
                    ) : (
                      <div style={{ color: '#eee', fontSize: 12 }}>Horário Livre</div>
                    )}
                  </div>
                  {status?.type === 'booking' && status.data.status !== 'completed' && (
                    <button 
                      onClick={() => { setForm(status.data); setModalType('checkout'); setShowModal(true); }}
                      style={{ padding: '8px 15px', borderRadius: 10, background: THEME.primary, color: '#fff', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      FINALIZAR
                    </button>
                  )}
                  {status?.type === 'booking' && status.data.status === 'completed' && <Badge type="completed">Pago</Badge>}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* MODAL ÚNICO E INTELIGENTE */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', padding: 30, borderRadius: 24, width: '100%', maxWidth: 450 }}>
            
            {modalType === 'booking' ? (
              <>
                <h2 style={{ fontFamily: 'serif', marginBottom: 25, fontSize: 22 }}>Novo Agendamento</h2>
                <div style={{ background: THEME.accent, padding: 15, borderRadius: 12, marginBottom: 20, fontSize: 12 }}>
                   📍 <strong>{form.profId}</strong> | ⏰ {form.time} do dia {viewDate.split('-').reverse().join('/')}
                </div>
                <label style={{ fontSize: 11, fontWeight: 700, color: THEME.primary }}>CLIENTE</label>
                <input value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} placeholder="Nome completo" style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #eee', marginBottom: 15 }} />
                
                <label style={{ fontSize: 11, fontWeight: 700, color: THEME.primary }}>SERVIÇO (APENAS COMPATÍVEIS)</label>
                <select value={form.service_name} onChange={e => setForm({...form, service_name: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #eee', marginBottom: 25 }}>
                  <option value="">Selecione...</option>
                  {filteredServicesForModal.map(s => <option key={s.id} value={s.name}>{s.name} (R$ {s.price})</option>)}
                </select>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleSaveBooking} style={{ flex: 1, padding: 15, borderRadius: 12, background: THEME.primary, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>CONFIRMAR</button>
                  <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 15, borderRadius: 12, background: '#eee', color: '#666', border: 'none', fontWeight: 700, cursor: 'pointer' }}>CANCELAR</button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontFamily: 'serif', marginBottom: 25, fontSize: 22 }}>✓ Fechar Atendimento</h2>
                <div style={{ marginBottom: 20 }}>
                   <div style={{ fontSize: 18, fontWeight: 800 }}>{form.client_name}</div>
                   <div style={{ color: THEME.primary }}>{form.service_name} - Original: R$ {form.service_price}</div>
                </div>

                <label style={{ fontSize: 11, fontWeight: 700, color: THEME.primary }}>VALOR FINAL COBRADO (R$)</label>
                <input type="number" value={form.price_charged || form.service_price} onChange={e => setForm({...form, price_charged: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid #eee', marginBottom: 15, fontSize: 18, fontWeight: 700 }} />

                <label style={{ fontSize: 11, fontWeight: 700, color: THEME.primary }}>FORMA DE PAGAMENTO</label>
                <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #eee', marginBottom: 25 }}>
                  <option value="PIX">PIX</option>
                  <option value="Cartão Crédito">Cartão Crédito</option>
                  <option value="Cartão Débito">Cartão Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleCheckout} style={{ flex: 1, padding: 15, borderRadius: 12, background: THEME.success, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>CONCLUIR RECEBIMENTO</button>
                  <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 15, borderRadius: 12, background: '#eee', color: '#666', border: 'none', fontWeight: 700, cursor: 'pointer' }}>VOLTAR</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
3. Instruções para Implementação
No GitHub:

Vá até o seu repositório.

Localize app/page.js.

Clique em Edit (Lápis).

Apague o conteúdo antigo e cole este novo código.

Commit changes.

No Supabase:

Para que o bloqueio de horários (Problema 2) funcione corretamente, certifique-se de que cada serviço tenha a coluna duration_min preenchida (ex: Corte: 30, Progressiva: 120).

O que foi incluído para ser "Rápido e Simples":

Filtro Automático: Ao abrir o modal de agendamento na coluna de uma Manicure, o sistema esconde automaticamente todos os serviços de Cabelo.

Células Inteligentes: O Admin clica no horário vazio e o sistema já sabe quem é o profissional e qual é a hora.

Snapshot de Segurança: Quando você "Fecha" um atendimento, o sistema olha qual era a comissão do profissional naquele momento e salva o valor em dinheiro. Se você mudar a comissão do profissional amanhã, os ganhos de hoje não mudam.

Bloqueio em Cascata: Se você marcar um serviço de 2 horas às 14:00, os horários de 14:15, 14:30, 14:45... até 16:00 ficarão cor-de-rosa (ocupados) automaticamente.

O design foi otimizado para parecer um app de luxo, usando a fonte serifada para títulos e tons de areia/dourado.
