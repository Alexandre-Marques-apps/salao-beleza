import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
}

export async function POST(req) {
  const { tipo, id, senhaAtual, senhaNova } = await req.json()

  if (!tipo || !id || !senhaAtual || !senhaNova) {
    return Response.json({ ok: false, erro: 'Dados incompletos' }, { status: 400 })
  }

  if (senhaNova.length < 6) {
    return Response.json({ ok: false, erro: 'Nova senha deve ter pelo menos 6 caracteres' }, { status: 400 })
  }

  const supabase = getSupabase()

  // PROFISSIONAL
  if (tipo === 'profissional') {
    const { data: prof } = await supabase
      .from('salon_professionals')
      .select('senha, senha_hash')
      .eq('id', id)
      .single()

    if (!prof) return Response.json({ ok: false, erro: 'Profissional não encontrado' }, { status: 404 })

    let ok = false
    if (prof.senha_hash) {
      ok = await bcrypt.compare(senhaAtual, prof.senha_hash)
    } else {
      ok = senhaAtual === (prof.senha || '123456')
    }
    if (!ok) return Response.json({ ok: false, erro: 'Senha atual incorreta' }, { status: 401 })

    const novoHash = await bcrypt.hash(senhaNova, 12)
    await supabase
      .from('salon_professionals')
      .update({ senha_hash: novoHash, senha: null })
      .eq('id', id)

    return Response.json({ ok: true })
  }

  // CLIENTE
  if (tipo === 'cliente') {
    const { data: cli } = await supabase
      .from('salon_clients')
      .select('senha, senha_hash')
      .eq('id', id)
      .single()

    if (!cli) return Response.json({ ok: false, erro: 'Cliente não encontrado' }, { status: 404 })

    let ok = false
    if (cli.senha_hash) {
      ok = await bcrypt.compare(senhaAtual, cli.senha_hash)
    } else {
      ok = senhaAtual === (cli.senha || '1234')
    }
    if (!ok) return Response.json({ ok: false, erro: 'Senha atual incorreta' }, { status: 401 })

    const novoHash = await bcrypt.hash(senhaNova, 12)
    await supabase
      .from('salon_clients')
      .update({ senha_hash: novoHash, senha: null })
      .eq('id', id)

    return Response.json({ ok: true })
  }

  return Response.json({ ok: false, erro: 'Tipo inválido' }, { status: 400 })
}
