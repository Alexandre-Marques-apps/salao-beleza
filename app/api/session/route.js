import { getSupabase } from '../../../lib/db.js'
import { getSessao, cookieSessao, cookiesLogout, json, semSenha } from '../../../lib/session.js'

// GET  → diz ao app quem está logado (a fonte da verdade é o cookie assinado)
// POST { action:'mesa' } → admin transforma este aparelho em totem
//      (troca a sessão de admin por uma sessão de totem, sem poderes de admin)

export async function GET(req) {
  const s = getSessao(req)
  if (!s) return json({ ok: false }, { status: 401 })

  if (s.p === 'mesa') return json({ ok: true, perfil: 'mesa' })
  if (s.p === 'admin' && s.k === 'admin') return json({ ok: true, perfil: 'admin', nome: s.n, trocarSenha: !!s.mc })

  const supabase = getSupabase()
  if (s.k === 'prof') {
    const { data: prof } = await supabase.from('salon_professionals').select('*').eq('id', s.id).eq('active', true).maybeSingle()
    if (!prof) return json({ ok: false }, { status: 401, cookies: cookiesLogout() })
    const perfil = prof.is_admin ? 'admin' : 'profissional'
    if (perfil !== s.p) return json({ ok: false }, { status: 401, cookies: cookiesLogout() })
    return json({ ok: true, perfil, nome: prof.full_name, dados: semSenha(prof), trocarSenha: !!s.mc })
  }
  if (s.k === 'cli') {
    const { data: cli } = await supabase.from('salon_clients').select('*').eq('id', s.id).maybeSingle()
    if (!cli) return json({ ok: false }, { status: 401, cookies: cookiesLogout() })
    return json({ ok: true, perfil: 'cliente', dados: semSenha(cli) })
  }
  return json({ ok: false }, { status: 401, cookies: cookiesLogout() })
}

export async function POST(req) {
  const s = getSessao(req)
  let body = {}
  try { body = await req.json() } catch {}
  if (body?.action === 'mesa') {
    if (!s || s.p !== 'admin' || s.mc) return json({ ok: false, erro: 'Somente o admin pode abrir o totem' }, { status: 403 })
    return json({ ok: true, perfil: 'mesa' }, { cookies: [cookieSessao({ perfil: 'mesa', conta: 'mesa', id: 'mesa', nome: 'Totem' })] })
  }
  return json({ ok: false, erro: 'Ação inválida' }, { status: 400 })
}
