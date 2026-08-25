import { createClient } from '@supabase/supabase-js'

// ── Identificação de cliente no Totem (Perfil Mesa) ─────
// Fluxo sem senha, próprio do totem da bancada:
//  1) POST { phone }         → procura o cliente pelo telefone.
//                              achou   → { ok:true, cliente }
//                              não achou → { ok:true, novo:true }
//  2) POST { phone, nome }   → cadastra o cliente novo (só nome + telefone)
//                              e devolve { ok:true, cliente }
// A aprovação do agendamento segue o fluxo normal (status 'pending').

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
}

async function acharPorTelefone(supabase, digitos) {
  if (digitos.length < 8) return null
  const ult4 = digitos.slice(-4)
  const { data: cands } = await supabase
    .from('salon_clients')
    .select('*')
    .ilike('phone', `%${ult4}%`)
  return (cands || []).find(c => {
    const p = (c.phone || '').replace(/\D/g, '')
    return p.length >= 8 && (p === digitos || p.endsWith(digitos) || digitos.endsWith(p))
  }) || null
}

// remove senha/hash antes de devolver ao navegador
function limpo(c) {
  if (!c) return c
  const { senha, senha_hash, ...resto } = c
  return resto
}

export async function POST(req) {
  try {
    const body = await req.json()
    const digitos = String(body?.phone || '').replace(/\D/g, '')
    const nome = String(body?.nome || '').trim()

    if (digitos.length < 8) {
      return Response.json({ ok: false, erro: 'Informe um telefone válido (com DDD).' }, { status: 400 })
    }

    const supabase = getSupabase()
    const existente = await acharPorTelefone(supabase, digitos)

    // Já existe → libera direto (mesmo que tenham mandado nome)
    if (existente) {
      return Response.json({ ok: true, cliente: limpo(existente) })
    }

    // Não existe e não veio nome → pede o nome
    if (!nome) {
      return Response.json({ ok: true, novo: true })
    }

    // Cadastra o cliente novo (só nome + telefone)
    const { data, error } = await supabase
      .from('salon_clients')
      .insert({ full_name: nome, phone: digitos })
      .select()
      .single()
    if (error) throw error

    return Response.json({ ok: true, cliente: limpo(data), cadastrado: true })
  } catch (e) {
    return Response.json({ ok: false, erro: e.message || 'Erro no servidor' }, { status: 500 })
  }
}
