import { getSupabase } from '../../../lib/db.js'
import { getSessao, cookieClienteTotem, cookieSairClienteTotem, json } from '../../../lib/session.js'

// ── Identificação de cliente no Totem (Perfil Mesa) ─────
// Só funciona com a sessão do totem (ou do admin) — ninguém de fora
// consegue consultar telefones por aqui.
//  1) POST { phone }         → procura a cliente pelo telefone
//                              achou     → { ok, cliente } + sessão curta dela (20 min)
//                              não achou → { ok, novo:true }
//  2) POST { phone, nome }   → cadastra a cliente nova e devolve { ok, cliente }
//  3) POST { action:'sair' } → encerra a sessão curta da cliente no totem
// A aprovação do agendamento segue o fluxo normal (status 'pending').

async function acharPorTelefone(supabase, digitos) {
  const { data: cands } = await supabase
    .from('salon_clients')
    .select('id,full_name,phone')
    .ilike('phone', `%${digitos.slice(-4)}%`)
  return (cands || []).find(c => {
    const p = (c.phone || '').replace(/\D/g, '')
    return p.length >= 8 && (p === digitos || p.endsWith(digitos) || digitos.endsWith(p))
  }) || null
}

// só o que o totem precisa para agendar
const publico = c => ({ id: c.id, full_name: c.full_name })

export async function POST(req) {
  const s = getSessao(req)
  if (!s || s.mc || (s.p !== 'mesa' && s.p !== 'admin')) {
    return json({ ok: false, erro: 'Disponível apenas no totem' }, { status: 403 })
  }
  try {
    const body = await req.json()
    if (body?.action === 'sair') return json({ ok: true }, { cookies: [cookieSairClienteTotem()] })

    const digitos = String(body?.phone || '').replace(/\D/g, '')
    const nome = String(body?.nome || '').trim().slice(0, 80)
    if (digitos.length < 10 || digitos.length > 13) {
      return json({ ok: false, erro: 'Informe um telefone válido (com DDD).' }, { status: 400 })
    }

    const supabase = getSupabase()
    const existente = await acharPorTelefone(supabase, digitos)
    if (existente) {
      return json({ ok: true, cliente: publico(existente) }, { cookies: [cookieClienteTotem(existente)] })
    }
    if (!nome) return json({ ok: true, novo: true })
    if (nome.length < 2) return json({ ok: false, erro: 'Digite seu nome, por favor.' }, { status: 400 })

    const { data, error } = await supabase
      .from('salon_clients')
      .insert({ full_name: nome, phone: digitos })
      .select('id,full_name')
      .single()
    if (error) throw error
    return json({ ok: true, cliente: publico(data), cadastrado: true }, { cookies: [cookieClienteTotem(data)] })
  } catch (e) {
    return json({ ok: false, erro: 'Não consegui concluir. Tente novamente.' }, { status: 500 })
  }
}
