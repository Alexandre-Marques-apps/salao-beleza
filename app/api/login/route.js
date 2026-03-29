import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const ADMIN_USER = 'Alexandre'
const MAX_TENT = 5
const BLOQUEIO_MS = 15 * 60 * 1000
const tentativas = {}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
}

function getIP(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
}

function verificaBloqueio(ip) {
  const t = tentativas[ip]
  if (!t) return false
  if (t.bloqueadoAte && Date.now() < t.bloqueadoAte) return true
  if (t.bloqueadoAte && Date.now() >= t.bloqueadoAte) delete tentativas[ip]
  return false
}

function registraFalha(ip) {
  if (!tentativas[ip]) tentativas[ip] = { count: 0 }
  tentativas[ip].count++
  if (tentativas[ip].count >= MAX_TENT) {
    tentativas[ip].bloqueadoAte = Date.now() + BLOQUEIO_MS
  }
}

function resetaTentativas(ip) {
  delete tentativas[ip]
}

function restantes(ip) {
  return MAX_TENT - (tentativas[ip]?.count || 0)
}

export async function POST(req) {
  const ip = getIP(req)

  if (verificaBloqueio(ip)) {
    return Response.json({
      ok: false,
      erro: 'Muitas tentativas incorretas. Tente novamente em 15 minutos.'
    }, { status: 429 })
  }

  const { usuario, senha } = await req.json()

  if (!usuario || !senha) {
    return Response.json({ ok: false, erro: 'Usuário e senha são obrigatórios' }, { status: 400 })
  }

  const supabase = getSupabase()

  // ── ADMIN ──────────────────────────────────────────
  if (usuario.trim() === ADMIN_USER) {
    const senhaAdmin = process.env.ADMIN_SENHA || '123456'
    let ok = false
    if (senhaAdmin.startsWith('$2b$') || senhaAdmin.startsWith('$2a$')) {
      ok = await bcrypt.compare(senha, senhaAdmin)
    } else {
      ok = senha === senhaAdmin
    }
    if (!ok) {
      registraFalha(ip)
      const r = restantes(ip)
      return Response.json({
        ok: false,
        erro: r > 0 ? `Senha incorreta. ${r} tentativa(s) restante(s).` : 'Conta bloqueada por 15 minutos.'
      }, { status: 401 })
    }
    resetaTentativas(ip)
    return Response.json({ ok: true, perfil: 'admin' })
  }

  // ── PROFISSIONAL ───────────────────────────────────
  const { data: prof } = await supabase
    .from('salon_professionals')
    .select('*')
    .ilike('full_name', usuario.trim())
    .eq('active', true)
    .single()

  if (prof) {
    let ok = false
    if (prof.senha_hash) {
      ok = await bcrypt.compare(senha, prof.senha_hash)
    } else {
      ok = senha === (prof.senha || '123456')
    }
    if (!ok) {
      registraFalha(ip)
      const r = restantes(ip)
      return Response.json({
        ok: false,
        erro: r > 0 ? `Senha incorreta. ${r} tentativa(s) restante(s).` : 'Conta bloqueada por 15 minutos.'
      }, { status: 401 })
    }
    resetaTentativas(ip)
    return Response.json({ ok: true, perfil: 'profissional', dados: prof })
  }

  // ── CLIENTE ────────────────────────────────────────
  const { data: cli } = await supabase
    .from('salon_clients')
    .select('*')
    .ilike('full_name', usuario.trim())
    .single()

  if (cli) {
    let ok = false
    if (cli.senha_hash) {
      ok = await bcrypt.compare(senha, cli.senha_hash)
    } else {
      ok = senha === (cli.senha || '1234')
    }
    if (!ok) {
      registraFalha(ip)
      const r = restantes(ip)
      return Response.json({
        ok: false,
        erro: r > 0 ? `Senha incorreta. ${r} tentativa(s) restante(s).` : 'Conta bloqueada por 15 minutos.'
      }, { status: 401 })
    }
    resetaTentativas(ip)
    return Response.json({ ok: true, perfil: 'cliente', dados: cli })
  }

  registraFalha(ip)
  return Response.json({ ok: false, erro: 'Usuário não encontrado' }, { status: 401 })
}
