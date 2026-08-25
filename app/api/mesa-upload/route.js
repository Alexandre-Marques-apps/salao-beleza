import { createClient } from '@supabase/supabase-js'

// ── Upload de fotos do Totem (Perfil Mesa) ──────────────
// Recebe a imagem em base64 (data URL), grava no bucket público
// 'mesa' do Supabase Storage usando a service_role key (que nunca
// vai para o navegador) e devolve a URL pública. Assim o app guarda
// só o link — nada de imagem pesada no banco.

const BUCKET = 'mesa'
const EXT_BY_MIME = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
}

export async function POST(req) {
  try {
    const body = await req.json()

    // ── Remover uma foto do bucket ──
    if (body?.action === 'delete') {
      const path = String(body.path || '')
      if (!path) return Response.json({ ok: false, erro: 'Caminho ausente' }, { status: 400 })
      const supabase = getSupabase()
      const { error } = await supabase.storage.from(BUCKET).remove([path])
      if (error) throw error
      return Response.json({ ok: true })
    }

    // ── Enviar uma foto (data URL base64) ──
    const dataUrl = String(body?.dataUrl || '')
    const m = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/)
    if (!m) return Response.json({ ok: false, erro: 'Formato de imagem inválido' }, { status: 400 })

    const mime = m[1]
    const buffer = Buffer.from(m[2], 'base64')
    if (buffer.length > 8 * 1024 * 1024) {
      return Response.json({ ok: false, erro: 'Imagem muito grande (máx. 8 MB)' }, { status: 400 })
    }

    const ext = EXT_BY_MIME[mime] || 'jpg'
    const path = `fotos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const supabase = getSupabase()
    const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
      contentType: mime,
      upsert: false,
    })
    if (error) throw error

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return Response.json({ ok: true, url: data.publicUrl, path })
  } catch (e) {
    return Response.json({ ok: false, erro: e.message || 'Erro no servidor' }, { status: 500 })
  }
}
