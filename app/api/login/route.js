import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// Usa a chave SERVICE (secreta, só no servidor) para bypassar RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const ADMIN_USER = 'Alexandre'

// Controle de tentativas por IP (em memória — reseta com deploy)
const tentativas = {}
const MAX_TENT = 5
const BLOQUEIO_MS = 15 * 60 * 1000 // 15 minutos

function getIP(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
}

function verificaBloqueio(ip) {
  const t = tentativas[ip]
  if (!t) return false
  if (t.bloqueadoAte && Date.now() < t.bloqueadoAte) return true
  if (t.bloqueadoAte && Date.now() >= t.bloqueadoAte) {
    delete tentativas[ip] // desbloqueia
  }
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

export async function POST(req) {
  const ip = getIP(req)

  // Verifica bloqueio por tentativas
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

  // ── LOGIN ADMIN ────────────────────────────────────
  if (usuario.trim() === ADMIN_USER) {
    const senhaAdmin = process.env.ADMIN_SENHA || '123456'
    // Admin ainda usa comparação direta (pode migrar para hash depois)
    // Compara com hash se existir, senão compara direto
    let ok = false
    if (senhaAdmin.startsWith('$2b$') || senhaAdmin.startsWith('$2a$')) {
      ok = await bcrypt.compare(senha, senhaAdmin)
    } else {
      ok = senha === senhaAdmin
    }
    if (!ok) {
      registraFalha(ip)
      const restantes = MAX_TENT - (tentativas[ip]?.count || 0)
      return Response.json({
        ok: false,
        erro: restantes > 0
          ? `Senha incorreta. ${restantes} tentativa(s) restante(s).`
          : 'Conta bloqueada por 15 minutos.'
      }, { status: 401 })
    }
    resetaTentativas(ip)
    return Response.json({ ok: true, perfil: 'admin' })
  }

  // ── LOGIN PROFISSIONAL ─────────────────────────────
  const { data: prof, error: profErr } = await supabase
    .from('salon_professionals')
    .select('*')
    .ilike('full_name', usuario.trim())
    .eq('active', true)
    .single()

  if (!profErr && prof) {
    let ok = false
    if (prof.senha_hash) {
      // Usa bcrypt se já tiver hash
      ok = await bcrypt.compare(senha, prof.senha_hash)
    } else {
      // Fallback para senha em texto (migração gradual)
      ok = senha === (prof.senha || '123456')
    }
    if (!ok) {
      registraFalha(ip)
      const restantes = MAX_TENT - (tentativas[ip]?.count || 0)
      return Response.json({
        ok: false,
        erro: restantes > 0
          ? `Senha incorreta. ${restantes} tentativa(s) restante(s).`
          : 'Conta bloqueada por 15 minutos.'
      }, { status: 401 })
    }
    resetaTentativas(ip)
    return Response.json({ ok: true, perfil: 'profissional', dados: prof })
  }

  // ── LOGIN CLIENTE ──────────────────────────────────
  const { data: cli, error: cliErr } = await supabase
    .from('salon_clients')
    .select('*')
    .ilike('full_name', usuario.trim())
    .single()

  if (!cliErr && cli) {
    let ok = false
    if (cli.senha_hash) {
      ok = await bcrypt.compare(senha, cli.senha_hash)
    } else {
      ok = senha === (cli.senha || '1234')
    }
    if (!ok) {
      registraFalha(ip)
      const restantes = MAX_TENT - (tentativas[ip]?.count || 0)
      return Response.json({
        ok: false,
        erro: restantes > 0
          ? `Senha incorreta. ${restantes} tentativa(s) restante(s).`
          : 'Conta bloqueada por 15 minutos.'
      }, { status: 401 })
    }
    resetaTentativas(ip)
    return Response.json({ ok: true, perfil: 'cliente', dados: cli })
  }

  // Usuário não encontrado
  registraFalha(ip)
  return Response.json({ ok: false, erro: 'Usuário não encontrado' }, { status: 401 })
}
