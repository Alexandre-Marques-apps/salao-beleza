import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
}

export async function POST(req) {
  try {
    const { token, role, ownerId } = await req.json()
    if (!token || !role) {
      return Response.json({ error: 'token e role são obrigatórios' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { error } = await supabase
      .from('push_tokens')
      .upsert({ token, role, owner_id: ownerId ?? null }, { onConflict: 'token' })

    if (error) throw error
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
