import bcrypt from 'bcryptjs'
import { getSupabase } from '../../../lib/db.js'
import { getSessao, getClienteTotem, json } from '../../../lib/session.js'

// ── Gateway de dados server-side ────────────────────────
// Todas as leituras e escritas do app passam por aqui, usando a service_role
// (que nunca vai para o navegador). Com o RLS ligado no banco, este é o único
// caminho até os dados — por isso cada pedido é autorizado pelo crachá de
// sessão (cookie assinado), conforme o perfil de quem pede:
//   sem login     → só o nome/horário de funcionamento do salão
//   cliente       → catálogo + os PRÓPRIOS agendamentos; da agenda alheia só
//                   vê horários ocupados (sem nome de ninguém)
//   totem         → catálogo; depois que a cliente se identifica pelo
//                   telefone, age como aquela cliente por 20 minutos
//   profissional  → a própria agenda e bloqueios; lista de clientes (nome/fone)
//   admin         → tudo

const READABLE = new Set([
  'salon_bookings', 'salon_clients', 'salon_professionals',
  'services', 'service_categories', 'salon_blocks', 'salon_settings',
])

// Colunas devolvidas ao admin em tabelas sensíveis — jamais senha/hash
const SAFE_COLUMNS = {
  salon_clients: 'id,full_name,phone,email,visits,total_spent,last_visit,created_at',
  salon_professionals: 'id,full_name,specialty,tipo,commission_pct,schedule_start,schedule_end,active,created_at,phone',
}

// Colunas devolvidas a quem não é admin (fixas; o pedido do navegador é ignorado)
const COLS_PROF_PUBLICO = 'id,full_name,specialty,tipo,schedule_start,schedule_end,active'
const COLS_AGENDA_LIVRE = 'id,professional_name,booking_date,start_time,duration_min,status'
const COLS_BLOQUEIO_LIVRE = 'id,professional_name,block_date,start_time,end_time'

// Colunas graváveis pelo admin (whitelist — o resto do payload é descartado)
const WRITABLE = {
  salon_bookings: ['client_name', 'service_name', 'professional_name', 'booking_date', 'start_time', 'status', 'service_price', 'price_charged', 'commission_pct', 'commission_value', 'payment_method', 'duration_min', 'reference_photo', 'cancelled_at'],
  salon_clients: ['full_name', 'phone', 'email', 'visits', 'total_spent', 'senha', 'last_visit'],
  salon_professionals: ['full_name', 'specialty', 'tipo', 'commission_pct', 'schedule_start', 'schedule_end', 'senha', 'active', 'phone'],
  services: ['name', 'category', 'tipo', 'price', 'duration_min', 'active', 'category_id'],
  salon_blocks: ['professional_name', 'block_date', 'start_time', 'end_time', 'reason'],
}
// O que a profissional pode alterar num agendamento DELA
const PROF_BOOKING_UPDATE = ['status', 'price_charged', 'payment_method', 'commission_pct', 'commission_value', 'reference_photo', 'booking_date', 'start_time', 'cancelled_at']
const PROF_BOOKING_INSERT = ['client_name', 'service_name', 'booking_date', 'start_time', 'service_price', 'price_charged', 'duration_min']

const DELETABLE = new Set(['salon_clients', 'salon_blocks', 'salon_bookings'])

// Chaves de salon_settings (admin_senha_hash / totem_senha_hash nunca passam por aqui)
const SETTINGS_PUBLICAS = new Set(['funcionamento'])
const SETTINGS_LEITURA = new Set(['funcionamento', 'portal', 'mesa'])

const negado = (erro = 'Acesso negado', status = 403) => json({ ok: false, erro }, { status })

function pick(obj, cols) {
  const out = {}
  for (const k of cols) if (obj?.[k] !== undefined) out[k] = obj[k]
  return out
}

function applyFilters(query, filters = []) {
  for (const f of filters) {
    const [op, col, val] = f
    if (typeof col !== 'string' || !/^[a-z_]+$/.test(col)) continue
    if (op === 'eq') query = query.eq(col, val)
    else if (op === 'neq') query = query.neq(col, val)
    else if (op === 'ilike') query = query.ilike(col, val)
  }
  return query
}

const filtroDe = (filters, col) => filters.find(f => f[0] === 'eq' && f[1] === col)
// remove filtros sobre uma coluna e impõe o valor do servidor
const forcar = (filters, col, val) => [...filters.filter(f => f[1] !== col), ['eq', col, val]]

// senha gravada pelo admin vira hash; texto puro nunca chega ao banco
async function protegerSenha(linha) {
  if (!linha || !('senha' in linha)) return linha
  const { senha, ...resto } = linha
  if (senha) { resto.senha_hash = await bcrypt.hash(String(senha), 10); resto.senha = null }
  return resto
}

// quem está pedindo?
async function contexto(req, supabase) {
  const s = getSessao(req)
  if (!s) return { papel: 'anon' }
  if (s.mc) return { papel: 'trocar' } // precisa trocar a senha antes de usar o sistema
  if (s.p === 'admin') return { papel: 'admin' }
  if (s.p === 'profissional') return { papel: 'prof', nome: s.n }
  if (s.p === 'cliente' || s.p === 'mesa') {
    const id = s.p === 'cliente' ? s.id : getClienteTotem(req)?.id
    if (!id) return { papel: s.p === 'mesa' ? 'mesa' : 'anon' }
    // nome atualizado direto do banco (os agendamentos guardam o nome)
    const { data } = await supabase.from('salon_clients').select('id,full_name').eq('id', id).maybeSingle()
    return data ? { papel: 'cli', nome: data.full_name } : { papel: s.p === 'mesa' ? 'mesa' : 'anon' }
  }
  return { papel: 'anon' }
}

async function executarSelect(supabase, { table, cols, filters, orders, single }) {
  let q = supabase.from(table).select(cols)
  q = applyFilters(q, filters)
  for (const [col, opt] of orders || []) {
    if (typeof col !== 'string' || !/^[a-z_]+$/.test(col)) continue
    q = q.order(col, { ascending: !(opt === 'desc' || (opt && opt.ascending === false)) })
  }
  if (single) {
    const { data, error } = await q.maybeSingle()
    return json({ ok: !error, data: data || null, erro: error?.message })
  }
  const { data, error } = await q
  return json({ ok: !error, data: data || [], erro: error?.message })
}

// ── SELECT ──────────────────────────────────────────────
async function select(supabase, ctx, b) {
  const { table, columns } = b
  let filters = Array.isArray(b.filters) ? b.filters : []
  if (!READABLE.has(table)) return negado('Tabela não permitida')

  if (table === 'salon_settings') {
    const keyF = filtroDe(filters, 'key')
    const chave = keyF?.[2]
    const permitidas = ctx.papel === 'anon' ? SETTINGS_PUBLICAS : SETTINGS_LEITURA
    if (!chave || !permitidas.has(chave)) return negado(ctx.papel === 'anon' ? 'Faça login' : 'Chave não permitida', ctx.papel === 'anon' ? 401 : 403)
    return executarSelect(supabase, { table, cols: 'value', filters: [['eq', 'key', chave]], single: b.single })
  }

  if (ctx.papel === 'anon') return negado('Faça login', 401)
  if (ctx.papel === 'trocar') return negado('Troque sua senha para continuar')

  if (ctx.papel === 'admin') {
    return executarSelect(supabase, { table, cols: SAFE_COLUMNS[table] || columns || '*', filters, orders: b.orders, single: b.single })
  }

  let cols
  if (table === 'services' || table === 'service_categories') cols = '*'
  else if (table === 'salon_professionals') cols = ctx.papel === 'prof' ? SAFE_COLUMNS.salon_professionals : COLS_PROF_PUBLICO
  else if (ctx.papel === 'prof') {
    if (table === 'salon_bookings' || table === 'salon_blocks') { cols = '*'; filters = forcar(filters, 'professional_name', ctx.nome) }
    else if (table === 'salon_clients') cols = 'id,full_name,phone'
  } else if (ctx.papel === 'cli' || ctx.papel === 'mesa') {
    if (table === 'salon_bookings') {
      const proprio = ctx.papel === 'cli' && filtroDe(filters, 'client_name')?.[2] === ctx.nome
      cols = proprio ? '*' : COLS_AGENDA_LIVRE
      if (proprio) filters = forcar(filters, 'client_name', ctx.nome)
    } else if (table === 'salon_blocks') cols = COLS_BLOQUEIO_LIVRE
  }
  if (!cols) return negado()
  return executarSelect(supabase, { table, cols, filters, orders: b.orders, single: b.single })
}

// ── INSERT ──────────────────────────────────────────────
async function insert(supabase, ctx, b) {
  const { table, payload } = b
  if (ctx.papel === 'admin') {
    const cols = WRITABLE[table]
    if (!cols) return negado('Tabela não gravável')
    const linhas = Array.isArray(payload) ? payload : [payload]
    const limpas = await Promise.all(linhas.map(p => protegerSenha(pick(p, cols))))
    const { data, error } = await supabase.from(table).insert(Array.isArray(payload) ? limpas : limpas[0]).select()
    return json({ ok: !error, data: data || null, erro: error?.message })
  }
  if (!payload || Array.isArray(payload)) return negado()

  if (ctx.papel === 'prof') {
    let linha
    if (table === 'salon_bookings') {
      linha = { ...pick(payload, PROF_BOOKING_INSERT), professional_name: ctx.nome, status: payload.status === 'pending' ? 'pending' : 'scheduled' }
    } else if (table === 'salon_blocks') {
      linha = { ...pick(payload, WRITABLE.salon_blocks), professional_name: ctx.nome }
    } else return negado()
    const { data, error } = await supabase.from(table).insert(linha).select()
    return json({ ok: !error, data: data || null, erro: error?.message })
  }

  if (ctx.papel === 'cli' && table === 'salon_bookings') {
    // o servidor monta o agendamento: nome da cliente, status e preço vêm do banco
    const { data: srvs } = await supabase.from('services').select('name,price,duration_min').eq('name', String(payload.service_name || '')).eq('active', true).limit(1)
    const { data: profs } = await supabase.from('salon_professionals').select('full_name,tipo').eq('full_name', String(payload.professional_name || '')).eq('active', true).limit(1)
    const srv = srvs && srvs[0], prof = profs && profs[0]
    if (!srv || !prof) return negado('Serviço ou profissional indisponível', 400)
    const data = String(payload.booking_date || ''), hora = String(payload.start_time || '')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{2}:\d{2}(:\d{2})?$/.test(hora)) return negado('Data ou horário inválido', 400)

    // trava de encavalamento no servidor (pega também dois pedidos simultâneos)
    const dur = Number(srv.duration_min) || 30
    const toMin = h => { const [H, M] = h.slice(0, 5).split(':').map(Number); return H * 60 + M }
    const ini = toMin(hora), fim = ini + dur
    const { data: doDia } = await supabase.from('salon_bookings').select('start_time,duration_min')
      .eq('professional_name', prof.full_name).eq('booking_date', data).neq('status', 'cancelled')
    const ocupados = (doDia || []).filter(a => { const i = toMin(a.start_time || '00:00'); return ini < i + (Number(a.duration_min) || 30) && fim > i }).length
    if (ocupados >= (prof.tipo === 'cabelereiro' ? 2 : 1)) return negado('Esse horário acabou de ser ocupado. Escolha outro, por favor.', 409)

    const linha = {
      client_name: ctx.nome, service_name: srv.name, professional_name: prof.full_name,
      booking_date: data, start_time: hora.length === 5 ? hora + ':00' : hora, status: 'pending',
      service_price: srv.price || 0, price_charged: srv.price || 0, duration_min: dur,
      reference_photo: typeof payload.reference_photo === 'string' ? payload.reference_photo : null,
    }
    const { data: criado, error } = await supabase.from('salon_bookings').insert(linha).select()
    return json({ ok: !error, data: criado || null, erro: error?.message })
  }
  return negado()
}

// a linha alvo (filtro por id) pertence a esta profissional?
async function daProfissional(supabase, table, filters, nome) {
  const idF = filtroDe(filters, 'id')
  if (!idF) return false
  const { data } = await supabase.from(table).select('professional_name').eq('id', idF[2]).maybeSingle()
  return !!data && data.professional_name === nome
}

// ── UPDATE ──────────────────────────────────────────────
async function update(supabase, ctx, b) {
  const { table, payload } = b
  const filters = Array.isArray(b.filters) ? b.filters : []
  if (!filters.length) return negado('Update exige filtro', 400)

  let limpo
  if (ctx.papel === 'admin') {
    const cols = WRITABLE[table]
    if (!cols) return negado('Tabela não gravável')
    limpo = await protegerSenha(pick(payload, cols))
    let q = applyFilters(supabase.from(table).update(limpo), filters)
    const { data, error } = await q.select()
    return json({ ok: !error, data: data || null, erro: error?.message })
  }

  if (ctx.papel === 'prof' && (table === 'salon_bookings' || table === 'salon_blocks')) {
    if (!(await daProfissional(supabase, table, filters, ctx.nome))) return negado()
    limpo = table === 'salon_bookings'
      ? pick(payload, PROF_BOOKING_UPDATE)
      : { ...pick(payload, WRITABLE.salon_blocks), professional_name: ctx.nome }
    let q = applyFilters(supabase.from(table).update(limpo), forcar(filters, 'professional_name', ctx.nome))
    const { data, error } = await q.select()
    return json({ ok: !error, data: data || null, erro: error?.message })
  }
  return negado()
}

// ── UPSERT (configurações) ──────────────────────────────
async function upsert(supabase, ctx, b) {
  if (ctx.papel !== 'admin') return negado()
  if (b.table !== 'salon_settings') return negado('Upsert não permitido')
  const key = b.payload?.key
  if (!SETTINGS_LEITURA.has(key)) return negado('Chave não permitida')
  const row = { key, value: String(b.payload?.value ?? ''), updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('salon_settings').upsert(row).select()
  return json({ ok: !error, data: data || null, erro: error?.message })
}

// ── DELETE ──────────────────────────────────────────────
async function remover(supabase, ctx, b) {
  const { table } = b
  const filters = Array.isArray(b.filters) ? b.filters : []
  if (!filters.length) return negado('Delete exige filtro', 400)
  let alvo = filters
  if (ctx.papel === 'admin') {
    if (!DELETABLE.has(table)) return negado('Delete não permitido')
  } else if (ctx.papel === 'prof' && table === 'salon_blocks') {
    if (!(await daProfissional(supabase, table, filters, ctx.nome))) return negado()
    alvo = forcar(filters, 'professional_name', ctx.nome)
  } else return negado()
  const { data, error } = await applyFilters(supabase.from(table).delete(), alvo).select()
  return json({ ok: !error, data: data || null, erro: error?.message })
}

export async function POST(req) {
  let body
  try { body = await req.json() } catch { return negado('JSON inválido', 400) }
  if (!body?.table || typeof body.table !== 'string') return negado('Tabela ausente', 400)

  const supabase = getSupabase()
  try {
    const ctx = await contexto(req, supabase)
    if (body.op === 'select') return await select(supabase, ctx, body)
    if (ctx.papel === 'anon') return negado('Faça login', 401)
    if (ctx.papel === 'trocar') return negado('Troque sua senha para continuar')
    if (body.op === 'insert') return await insert(supabase, ctx, body)
    if (body.op === 'update') return await update(supabase, ctx, body)
    if (body.op === 'upsert') return await upsert(supabase, ctx, body)
    if (body.op === 'delete') return await remover(supabase, ctx, body)
    return negado('Operação inválida', 400)
  } catch (e) {
    return json({ ok: false, erro: 'Erro no servidor' }, { status: 500 })
  }
}
