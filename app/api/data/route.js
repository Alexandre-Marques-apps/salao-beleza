import { createClient } from '@supabase/supabase-js'

// ── Gateway de dados server-side ────────────────────────
// Todas as leituras e escritas do app passam por aqui, usando a
// service_role key (que NUNCA vai para o navegador). Com o RLS ligado
// no banco, este é o único caminho de acesso aos dados — a anon key
// deixa de dar acesso a qualquer coisa.

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
}

// Tabelas que podem ser lidas por este gateway
const READABLE = new Set([
  'salon_bookings', 'salon_clients', 'salon_professionals',
  'services', 'service_categories', 'salon_blocks', 'salon_settings',
])

// Colunas retornadas em leituras de tabelas sensíveis — jamais expõe
// senha/senha_hash ao navegador (o login roda em /api/login).
const SAFE_COLUMNS = {
  salon_clients: 'id,full_name,phone,email,visits,total_spent,last_visit,created_at',
  salon_professionals: 'id,full_name,specialty,tipo,commission_pct,schedule_start,schedule_end,active,created_at,phone',
}

// Colunas graváveis por tabela (whitelist — o resto do payload é descartado)
const WRITABLE = {
  salon_bookings: ['client_name', 'service_name', 'professional_name', 'booking_date', 'start_time', 'status', 'service_price', 'price_charged', 'commission_pct', 'commission_value', 'payment_method', 'duration_min', 'reference_photo', 'cancelled_at'],
  salon_clients: ['full_name', 'phone', 'email', 'visits', 'total_spent', 'senha', 'last_visit'],
  salon_professionals: ['full_name', 'specialty', 'tipo', 'commission_pct', 'schedule_start', 'schedule_end', 'senha', 'active', 'phone'],
  services: ['name', 'category', 'tipo', 'price', 'duration_min', 'active', 'category_id'],
  salon_blocks: ['professional_name', 'block_date', 'start_time', 'end_time', 'reason'],
}

// Tabelas onde é permitido apagar registros de fato
const DELETABLE = new Set(['salon_clients', 'salon_blocks'])

// Chaves de salon_settings que o cliente pode ler/escrever por aqui
// (admin_senha_hash é tratado só pelas rotas de login/senha)
const SETTINGS_KEYS = new Set(['funcionamento', 'portal'])

function pick(obj, cols) {
  const out = {}
  for (const k of cols) if (obj?.[k] !== undefined) out[k] = obj[k]
  return out
}

function applyFilters(query, filters = []) {
  for (const f of filters) {
    const [op, col, val] = f
    if (op === 'eq') query = query.eq(col, val)
    else if (op === 'neq') query = query.neq(col, val)
    else if (op === 'ilike') query = query.ilike(col, val)
  }
  return query
}

export async function POST(req) {
  let body
  try { body = await req.json() } catch { return Response.json({ ok: false, erro: 'JSON inválido' }, { status: 400 }) }

  const { op, table, columns, filters = [], orders = [], single = false, payload } = body || {}
  if (!table || typeof table !== 'string') return Response.json({ ok: false, erro: 'Tabela ausente' }, { status: 400 })

  const supabase = getSupabase()

  try {
    // ── SELECT ────────────────────────────────────────
    if (op === 'select') {
      if (!READABLE.has(table)) return Response.json({ ok: false, erro: 'Tabela não permitida' }, { status: 403 })
      // salon_settings: só libera chaves da whitelist (protege admin_senha_hash)
      if (table === 'salon_settings') {
        const keyF = filters.find(f => f[0] === 'eq' && f[1] === 'key')
        if (!keyF || !SETTINGS_KEYS.has(keyF[2])) return Response.json({ ok: false, erro: 'Chave não permitida' }, { status: 403 })
      }
      const cols = SAFE_COLUMNS[table] || columns || '*'
      let q = supabase.from(table).select(cols)
      q = applyFilters(q, filters)
      for (const [col, opt] of orders) {
        const asc = !(opt === 'desc' || (opt && opt.ascending === false))
        q = q.order(col, { ascending: asc })
      }
      if (single) {
        const { data, error } = await q.maybeSingle()
        return Response.json({ ok: !error, data: data || null, erro: error?.message })
      }
      const { data, error } = await q
      return Response.json({ ok: !error, data: data || [], erro: error?.message })
    }

    // ── INSERT ────────────────────────────────────────
    if (op === 'insert') {
      const cols = WRITABLE[table]
      if (!cols) return Response.json({ ok: false, erro: 'Tabela não gravável' }, { status: 403 })
      const clean = Array.isArray(payload) ? payload.map(p => pick(p, cols)) : pick(payload, cols)
      const { data, error } = await supabase.from(table).insert(clean).select()
      return Response.json({ ok: !error, data: data || null, erro: error?.message })
    }

    // ── UPDATE ────────────────────────────────────────
    if (op === 'update') {
      const cols = WRITABLE[table]
      if (!cols) return Response.json({ ok: false, erro: 'Tabela não gravável' }, { status: 403 })
      if (!filters.length) return Response.json({ ok: false, erro: 'Update exige filtro' }, { status: 400 })
      const clean = pick(payload, cols)
      let q = supabase.from(table).update(clean)
      q = applyFilters(q, filters)
      const { data, error } = await q.select()
      return Response.json({ ok: !error, data: data || null, erro: error?.message })
    }

    // ── UPSERT (apenas salon_settings / chaves whitelisted) ──
    if (op === 'upsert') {
      if (table !== 'salon_settings') return Response.json({ ok: false, erro: 'Upsert não permitido' }, { status: 403 })
      const key = payload?.key
      if (!SETTINGS_KEYS.has(key)) return Response.json({ ok: false, erro: 'Chave não permitida' }, { status: 403 })
      const row = { key, value: String(payload?.value ?? ''), updated_at: new Date().toISOString() }
      const { data, error } = await supabase.from('salon_settings').upsert(row).select()
      return Response.json({ ok: !error, data: data || null, erro: error?.message })
    }

    // ── DELETE ────────────────────────────────────────
    if (op === 'delete') {
      if (!DELETABLE.has(table)) return Response.json({ ok: false, erro: 'Delete não permitido' }, { status: 403 })
      if (!filters.length) return Response.json({ ok: false, erro: 'Delete exige filtro' }, { status: 400 })
      let q = supabase.from(table).delete()
      q = applyFilters(q, filters)
      const { data, error } = await q.select()
      return Response.json({ ok: !error, data: data || null, erro: error?.message })
    }

    return Response.json({ ok: false, erro: 'Operação inválida' }, { status: 400 })
  } catch (e) {
    return Response.json({ ok: false, erro: e.message || 'Erro no servidor' }, { status: 500 })
  }
}
