// ── Limite de tentativas (login / troca de senha) ───────
// Guardado no banco (salon_login_attempts) para valer entre todas as
// instâncias da Vercel — antes ficava na memória e zerava sozinho.

const JANELA_MIN = 15   // falhas contam dentro desta janela
const BLOQUEIO_MIN = 15 // tempo de bloqueio ao estourar o limite

// limite de falhas por tipo de chave (prefixo antes de ':')
const LIMITE = { ip: 15, conta: 6, senha: 5 }

function limiteDe(chave) {
  return LIMITE[chave.split(':')[0]] || 6
}

export async function estaBloqueado(supabase, chaves) {
  const { data } = await supabase
    .from('salon_login_attempts')
    .select('chave,bloqueado_ate')
    .in('chave', chaves)
  const agora = Date.now()
  return (data || []).some(r => r.bloqueado_ate && new Date(r.bloqueado_ate).getTime() > agora)
}

export async function registrarFalha(supabase, chaves) {
  const agora = Date.now()
  const { data } = await supabase
    .from('salon_login_attempts')
    .select('chave,falhas,atualizado_em')
    .in('chave', chaves)
  const atuais = new Map((data || []).map(r => [r.chave, r]))
  const linhas = chaves.map(chave => {
    const r = atuais.get(chave)
    const dentroDaJanela = r && agora - new Date(r.atualizado_em).getTime() < JANELA_MIN * 60000
    const falhas = (dentroDaJanela ? r.falhas : 0) + 1
    return {
      chave,
      falhas,
      bloqueado_ate: falhas >= limiteDe(chave) ? new Date(agora + BLOQUEIO_MIN * 60000).toISOString() : null,
      atualizado_em: new Date(agora).toISOString(),
    }
  })
  await supabase.from('salon_login_attempts').upsert(linhas, { onConflict: 'chave' })
}

export async function limparTentativas(supabase, chaves) {
  await supabase.from('salon_login_attempts').delete().in('chave', chaves)
}

export function ipDe(req) {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'desconhecido'
}
