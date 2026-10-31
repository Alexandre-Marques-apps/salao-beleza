import { createClient } from '@supabase/supabase-js'

// Cliente do banco com a service_role. SÓ no servidor (rotas /api).
export function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  )
}
