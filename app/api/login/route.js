import bcrypt from 'bcryptjs'
import { getSupabase } from '../../../lib/db.js'
import { cookieSessao, json, semSenha, senhaFraca } from '../../../lib/session.js'
import { estaBloqueado, registrarFalha, limparTentativas, ipDe } from '../../../lib/limite.js'

const ADMIN_USER = 'Alexandre'
const TOTEM_USER = 'totem'

// hash fictício: quando o usuário não existe, comparamos mesmo assim para o
// tempo de resposta não revelar quais contas existem
let HASH_FICTICIO = null
function hashFicticio() {
  if (!HASH_FICTICIO) HASH_FICTICIO = bcrypt.hashSync('nao-existe-' + Math.random(), 10)
  return HASH_FICTICIO
}

// confere a senha; se ainda estiver em texto puro e bater, já converte para hash
async function confereSenha(supabase, tabela, linha, senha) {
  if (linha.senha_hash) return bcrypt.compare(senha, linha.senha_hash)
  if (!linha.senha) { await bcrypt.compare(senha, hashFicticio()); return false }
  const ok = senha === linha.senha
  if (ok) {
    const hash = await bcrypt.hash(senha, 10)
    await supabase.from(tabela).update({ senha_hash: hash, senha: null }).eq('id', linha.id)
  }
  return ok
}

export async function POST(req) {
  let body
  try { body = await req.json() } catch { return json({ ok: false, erro: 'Requisição inválida' }, { status: 400 }) }
  const usuario = String(body?.usuario || '').trim()
  const senha = String(body?.senha || '')
  if (!usuario || !senha) return json({ ok: false, erro: 'Usuário e senha são obrigatórios' }, { status: 400 })

  const supabase = getSupabase()
  const ip = ipDe(req)
  const digitos = usuario.replace(/\D/g, '')
  const chaveConta = 'conta:' + (digitos.length >= 8 ? digitos : usuario.toLowerCase())
  const chaves = ['ip:' + ip, chaveConta]

  if (await estaBloqueado(supabase, chaves)) {
    return json({ ok: false, erro: 'Muitas tentativas incorretas. Tente novamente em 15 minutos.' }, { status: 429 })
  }

  const falha = async () => {
    await registrarFalha(supabase, chaves)
    return json({ ok: false, erro: 'Usuário ou senha incorretos' }, { status: 401 })
  }
  const sucesso = async (resposta, sessao) => {
    await limparTentativas(supabase, [chaveConta])
    return json(resposta, { cookies: [cookieSessao(sessao)] })
  }

  // ── ADMIN ──────────────────────────────────────────
  if (usuario.toLowerCase() === ADMIN_USER.toLowerCase()) {
    const { data: setting } = await supabase.from('salon_settings').select('value').eq('key', 'admin_senha_hash').maybeSingle()
    let ok = false
    if (setting?.value) {
      ok = await bcrypt.compare(senha, setting.value)
    } else {
      // primeira configuração: aceita a senha do env e grava o hash
      const senhaEnv = process.env.ADMIN_SENHA
      ok = !!senhaEnv && senha === senhaEnv
      if (ok) {
        await supabase.from('salon_settings').upsert({ key: 'admin_senha_hash', value: await bcrypt.hash(senhaEnv, 12), updated_at: new Date().toISOString() })
      }
    }
    if (!ok) return falha()
    const mc = senhaFraca(senha)
    return sucesso(
      { ok: true, perfil: 'admin', nome: ADMIN_USER, trocarSenha: mc },
      { perfil: 'admin', conta: 'admin', id: 'admin', nome: ADMIN_USER, mc }
    )
  }

  // ── TOTEM (tablet da bancada) ──────────────────────
  if (usuario.toLowerCase() === TOTEM_USER) {
    const { data: setting } = await supabase.from('salon_settings').select('value').eq('key', 'totem_senha_hash').maybeSingle()
    if (!setting?.value) {
      return json({ ok: false, erro: 'O totem ainda não tem senha. Defina uma no painel do admin, aba Totem / Mesa.' }, { status: 403 })
    }
    if (!(await bcrypt.compare(senha, setting.value))) return falha()
    if (senhaFraca(senha)) {
      return json({ ok: false, erro: 'A senha do totem é fraca demais. Defina uma nova no painel do admin, aba Totem / Mesa (mínimo 8 caracteres).' }, { status: 403 })
    }
    return sucesso({ ok: true, perfil: 'mesa' }, { perfil: 'mesa', conta: 'mesa', id: 'mesa', nome: 'Totem' })
  }

  // ── PROFISSIONAL ───────────────────────────────────
  const { data: profs } = await supabase
    .from('salon_professionals')
    .select('*')
    .ilike('full_name', usuario)
    .eq('active', true)
    .limit(1)
  const prof = profs && profs[0]
  if (prof) {
    if (!(await confereSenha(supabase, 'salon_professionals', prof, senha))) return falha()
    const perfil = prof.is_admin ? 'admin' : 'profissional'
    const mc = !!prof.is_admin && senhaFraca(senha)
    return sucesso(
      { ok: true, perfil, nome: prof.full_name, dados: semSenha(prof), trocarSenha: mc },
      { perfil, conta: 'prof', id: prof.id, nome: prof.full_name, mc }
    )
  }

  // ── CLIENTE (telefone OU nome) ─────────────────────
  let cli = null
  if (digitos.length >= 8) {
    const { data: cands } = await supabase
      .from('salon_clients')
      .select('*')
      .ilike('phone', `%${digitos.slice(-4)}%`)
    cli = (cands || []).find(c => {
      const p = (c.phone || '').replace(/\D/g, '')
      return p.length >= 8 && (p === digitos || p.endsWith(digitos) || digitos.endsWith(p))
    }) || null
  }
  if (!cli) {
    const { data: porNome } = await supabase.from('salon_clients').select('*').ilike('full_name', usuario).limit(1)
    if (porNome && porNome.length) cli = porNome[0]
  }
  if (cli) {
    if (!(await confereSenha(supabase, 'salon_clients', cli, senha))) return falha()
    return sucesso(
      { ok: true, perfil: 'cliente', dados: semSenha(cli) },
      { perfil: 'cliente', conta: 'cli', id: cli.id, nome: cli.full_name }
    )
  }

  await bcrypt.compare(senha, hashFicticio())
  return falha()
}
