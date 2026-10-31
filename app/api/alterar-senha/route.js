import bcrypt from 'bcryptjs'
import { getSupabase } from '../../../lib/db.js'
import { getSessao, cookieSessao, json, senhaFraca } from '../../../lib/session.js'
import { estaBloqueado, registrarFalha, limparTentativas } from '../../../lib/limite.js'

// ── Troca de senha ──────────────────────────────────────
// Sempre da PRÓPRIA conta de quem está logado (o crachá diz quem é).
//  tipo 'obrigatoria' → troca forçada após login com senha fraca (sem senha atual)
//  tipo 'admin'       → "Minha Senha" no painel admin (Alexandre ou Morgane)
//  tipo 'profissional'/'cliente' → a própria conta, confirmando a senha atual
//  tipo 'totem'       → admin define a senha do totem, confirmando a própria senha
// Toda senha nova é gravada só como hash (bcrypt).

async function hashDoAdmin(supabase) {
  const { data } = await supabase.from('salon_settings').select('value').eq('key', 'admin_senha_hash').maybeSingle()
  return data?.value || null
}

// confere a senha atual da conta logada
async function confereAtual(supabase, s, senhaAtual) {
  if (s.k === 'admin') {
    const h = await hashDoAdmin(supabase)
    return !!h && bcrypt.compare(senhaAtual, h)
  }
  const tabela = s.k === 'prof' ? 'salon_professionals' : s.k === 'cli' ? 'salon_clients' : null
  if (!tabela) return false
  const { data } = await supabase.from(tabela).select('senha,senha_hash').eq('id', s.id).maybeSingle()
  if (!data) return false
  if (data.senha_hash) return bcrypt.compare(senhaAtual, data.senha_hash)
  return !!data.senha && senhaAtual === data.senha
}

async function gravarPropria(supabase, s, senhaNova) {
  const hash = await bcrypt.hash(senhaNova, 12)
  if (s.k === 'admin') {
    return supabase.from('salon_settings').upsert({ key: 'admin_senha_hash', value: hash, updated_at: new Date().toISOString() })
  }
  const tabela = s.k === 'prof' ? 'salon_professionals' : 'salon_clients'
  return supabase.from(tabela).update({ senha_hash: hash, senha: null }).eq('id', s.id)
}

export async function POST(req) {
  const s = getSessao(req)
  if (!s) return json({ ok: false, erro: 'Faça login novamente' }, { status: 401 })

  let body
  try { body = await req.json() } catch { return json({ ok: false, erro: 'Dados inválidos' }, { status: 400 }) }
  const { tipo } = body || {}
  const senhaAtual = String(body?.senhaAtual || '')
  const senhaNova = String(body?.senhaNova || '')
  const supabase = getSupabase()
  const chave = `senha:${s.k}:${s.id}`

  // ── Troca obrigatória (login com senha fraca) ──
  if (tipo === 'obrigatoria') {
    if (!s.mc) return json({ ok: false, erro: 'Nada a trocar' }, { status: 400 })
    if (senhaFraca(senhaNova)) return json({ ok: false, erro: 'Use pelo menos 8 caracteres e evite senhas óbvias (ex.: 123456).' }, { status: 400 })
    const { error } = await gravarPropria(supabase, s, senhaNova)
    if (error) return json({ ok: false, erro: 'Não consegui salvar. Tente novamente.' }, { status: 500 })
    return json({ ok: true }, { cookies: [cookieSessao({ perfil: s.p, conta: s.k, id: s.id, nome: s.n, mc: false })] })
  }

  if (s.mc) return json({ ok: false, erro: 'Defina sua nova senha primeiro' }, { status: 403 })
  if (!senhaAtual || !senhaNova) return json({ ok: false, erro: 'Dados incompletos' }, { status: 400 })
  if (await estaBloqueado(supabase, [chave])) {
    return json({ ok: false, erro: 'Muitas tentativas incorretas. Tente novamente em 15 minutos.' }, { status: 429 })
  }

  // quem pode usar cada tipo
  const permitido =
    (tipo === 'admin' && s.p === 'admin') ||
    (tipo === 'totem' && s.p === 'admin') ||
    (tipo === 'profissional' && s.k === 'prof') ||
    (tipo === 'cliente' && s.k === 'cli')
  if (!permitido) return json({ ok: false, erro: 'Operação não permitida' }, { status: 403 })

  // força mínima: admin e totem exigem senha forte; demais, 6+ caracteres
  if (tipo === 'admin' || tipo === 'totem' || s.p === 'admin') {
    if (senhaFraca(senhaNova)) return json({ ok: false, erro: 'Use pelo menos 8 caracteres e evite senhas óbvias (ex.: 123456).' }, { status: 400 })
  } else if (senhaNova.length < 6) {
    return json({ ok: false, erro: 'A nova senha deve ter pelo menos 6 caracteres' }, { status: 400 })
  }

  if (!(await confereAtual(supabase, s, senhaAtual))) {
    await registrarFalha(supabase, [chave])
    return json({ ok: false, erro: tipo === 'totem' ? 'Sua senha de administrador está incorreta' : 'Senha atual incorreta' }, { status: 401 })
  }
  await limparTentativas(supabase, [chave])

  if (tipo === 'totem') {
    const { error } = await supabase.from('salon_settings').upsert({ key: 'totem_senha_hash', value: await bcrypt.hash(senhaNova, 12), updated_at: new Date().toISOString() })
    if (error) return json({ ok: false, erro: 'Não consegui salvar. Tente novamente.' }, { status: 500 })
    return json({ ok: true })
  }

  const { error } = await gravarPropria(supabase, s, senhaNova)
  if (error) return json({ ok: false, erro: 'Não consegui salvar. Tente novamente.' }, { status: 500 })
  return json({ ok: true })
}
