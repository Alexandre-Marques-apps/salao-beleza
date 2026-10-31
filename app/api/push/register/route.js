import { getSupabase } from '../../../../lib/db.js'
import { getSessao, json } from '../../../../lib/session.js'

// Registra o token de notificação do aparelho para QUEM ESTÁ LOGADO.
// Perfil e dono vêm do crachá de sessão — nunca do que o aparelho diz.
export async function POST(req) {
  const s = getSessao(req)
  if (!s || s.mc || s.p === 'mesa') return json({ ok: false, erro: 'Faça login' }, { status: 401 })
  try {
    const { token } = await req.json()
    if (!token || typeof token !== 'string' || token.length > 4096) {
      return json({ ok: false, erro: 'token inválido' }, { status: 400 })
    }
    const ownerId = s.k === 'prof' || s.k === 'cli' ? s.id : null
    const { error } = await getSupabase()
      .from('push_tokens')
      .upsert({ token, role: s.p, owner_id: ownerId }, { onConflict: 'token' })
    if (error) throw error
    return json({ ok: true })
  } catch (e) {
    return json({ ok: false, erro: 'Não consegui registrar' }, { status: 500 })
  }
}
