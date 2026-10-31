import { getSupabase } from '../../../lib/db.js'
import { getSessao, json } from '../../../lib/session.js'

// ── Upload de fotos do Totem (Perfil Mesa) ──────────────
// Só o admin envia ou apaga fotos. A imagem chega em base64 (data URL),
// vai para o bucket público 'mesa' do Supabase Storage e o app guarda só o link.

const BUCKET = 'mesa'
const EXT_BY_MIME = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

export async function POST(req) {
  const s = getSessao(req)
  if (!s || s.mc || s.p !== 'admin') return json({ ok: false, erro: 'Somente o admin pode alterar as fotos' }, { status: 403 })
  try {
    const body = await req.json()
    const supabase = getSupabase()

    // ── Remover uma foto do bucket ──
    if (body?.action === 'delete') {
      const path = String(body.path || '')
      if (!/^fotos\/[\w.-]+$/.test(path)) return json({ ok: false, erro: 'Caminho inválido' }, { status: 400 })
      const { error } = await supabase.storage.from(BUCKET).remove([path])
      if (error) throw error
      return json({ ok: true })
    }

    // ── Enviar uma foto ──
    const m = String(body?.dataUrl || '').match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/)
    if (!m) return json({ ok: false, erro: 'Formato de imagem inválido' }, { status: 400 })
    const mime = m[1]
    const buffer = Buffer.from(m[2], 'base64')
    if (buffer.length > 8 * 1024 * 1024) return json({ ok: false, erro: 'Imagem muito grande (máx. 8 MB)' }, { status: 400 })

    const path = `fotos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${EXT_BY_MIME[mime] || 'jpg'}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType: mime, upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return json({ ok: true, url: data.publicUrl, path })
  } catch (e) {
    return json({ ok: false, erro: 'Não consegui salvar a foto. Tente novamente.' }, { status: 500 })
  }
}
