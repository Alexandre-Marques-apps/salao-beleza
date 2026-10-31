import crypto from 'crypto'

// ── Sessão assinada no servidor ─────────────────────────
// O "crachá" de quem está logado vive num cookie HttpOnly assinado com
// HMAC-SHA256. O navegador não consegue ler nem alterar o conteúdo: se
// alguém mexer em um caractere, a assinatura deixa de bater e a sessão
// é recusada. Todas as rotas /api confiam só nisto — nunca no localStorage.

const COOKIE_SESSAO = 'salao_sess'
const COOKIE_CLI_TOTEM = 'salao_mesa_cli'

// validade da sessão por perfil (dias)
const DIAS = { admin: 30, profissional: 30, cliente: 60, mesa: 365 }
// cliente identificada no totem: sessão curta, some sozinha
const MIN_CLI_TOTEM = 20

function segredo() {
  const s = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_KEY
  if (!s) throw new Error('Segredo de sessão ausente')
  return s
}

function hmac(texto) {
  return crypto.createHmac('sha256', segredo()).update(texto).digest('base64url')
}

export function assinar(payload) {
  const corpo = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${corpo}.${hmac(corpo)}`
}

export function verificar(token) {
  if (!token || typeof token !== 'string') return null
  const [corpo, assinatura] = token.split('.')
  if (!corpo || !assinatura) return null
  const a = Buffer.from(assinatura)
  const b = Buffer.from(hmac(corpo))
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const p = JSON.parse(Buffer.from(corpo, 'base64url').toString('utf8'))
    if (!p || !p.exp || Date.now() > p.exp) return null
    return p
  } catch {
    return null
  }
}

function lerCookie(req, nome) {
  const header = req.headers.get('cookie') || ''
  for (const parte of header.split(';')) {
    const i = parte.indexOf('=')
    if (i < 0) continue
    if (parte.slice(0, i).trim() === nome) {
      try { return decodeURIComponent(parte.slice(i + 1).trim()) } catch { return null }
    }
  }
  return null
}

// { t:'sess', p:perfil, k:tipo de conta, id, n:nome, mc:troca obrigatória, exp }
export function getSessao(req) {
  const p = verificar(lerCookie(req, COOKIE_SESSAO))
  return p && p.t === 'sess' ? p : null
}

// cliente identificada pelo telefone no totem (só vale junto de uma sessão de totem)
export function getClienteTotem(req) {
  const p = verificar(lerCookie(req, COOKIE_CLI_TOTEM))
  return p && p.t === 'mesa_cli' ? p : null
}

function cookie(nome, valor, maxAgeSeg) {
  const seguro = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${nome}=${encodeURIComponent(valor)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeg}${seguro}`
}

// perfil: admin | profissional | cliente | mesa
// conta (k): admin (Alexandre) | prof | cli | mesa
export function cookieSessao({ perfil, conta, id = null, nome = '', mc = false }) {
  const dias = DIAS[perfil] || 30
  const token = assinar({ t: 'sess', p: perfil, k: conta, id, n: nome, mc: mc ? 1 : 0, exp: Date.now() + dias * 86400000 })
  return cookie(COOKIE_SESSAO, token, dias * 86400)
}

export function cookieClienteTotem(cli) {
  const token = assinar({ t: 'mesa_cli', id: cli.id, n: cli.full_name, exp: Date.now() + MIN_CLI_TOTEM * 60000 })
  return cookie(COOKIE_CLI_TOTEM, token, MIN_CLI_TOTEM * 60)
}

export function cookieSairClienteTotem() {
  return cookie(COOKIE_CLI_TOTEM, '', 0)
}

export function cookiesLogout() {
  return [cookie(COOKIE_SESSAO, '', 0), cookie(COOKIE_CLI_TOTEM, '', 0)]
}

// resposta JSON com cookies opcionais
export function json(obj, { status = 200, cookies = [] } = {}) {
  const headers = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  for (const c of cookies) headers.append('Set-Cookie', c)
  return new Response(JSON.stringify(obj), { status, headers })
}

// remove senha e hash antes de qualquer dado ir para o navegador
export function semSenha(linha) {
  if (!linha) return linha
  const { senha, senha_hash, ...resto } = linha
  return resto
}

// senha fraca demais para admin/totem
const COMUNS = new Set([
  '123456', '1234567', '12345678', '123456789', '1234567890', '1234', '12345', '0000', '000000',
  '111111', '654321', 'senha', 'senha123', 'admin', 'admin123', 'totem', 'totem123', 'morgane',
  'qwerty', 'abc123', 'password', 'mudar123',
])
export function senhaFraca(s) {
  const v = String(s || '')
  return v.length < 8 || COMUNS.has(v.toLowerCase()) || /^(.)\1+$/.test(v)
}
