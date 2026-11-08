import qrcode from './qrcode-generator.js'

// ── Pix da Morgane (QR Code estático, padrão BR Code do Banco Central) ──
// A chave fica FIXA aqui no código de propósito: não passa pelo banco de
// dados nem pelo painel, então ninguém consegue trocar o QR do totem por
// outra conta editando conteúdo. Mudar a chave exige alterar este arquivo
// e publicar uma nova versão.
// O QR é gerado no próprio aparelho (sem site externo) e sem valor: a
// cliente digita o valor no app do banco e confere quem vai receber.
export const PIX = Object.freeze({
  chave: '67758429000113',          // CNPJ, só dígitos (é assim que a chave vai no QR)
  cnpj: '67.758.429/0001-13',       // como a cliente confere no app do banco
  nome: 'MORGANE FAOLI',            // campo 59 (até 25 letras, sem acento)
  cidade: 'CURITIBA',               // campo 60 (até 15 letras, sem acento)
})

// dígitos verificadores do CNPJ
export function cnpjValido(cnpj) {
  const d = String(cnpj).replace(/\D/g, '')
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false
  const dv = base => {
    let soma = 0, peso = base.length - 7
    for (const n of base) { soma += Number(n) * peso--; if (peso < 2) peso = 9 }
    const r = soma % 11
    return r < 2 ? 0 : 11 - r
  }
  const d1 = dv(d.slice(0, 12)), d2 = dv(d.slice(0, 12) + d1)
  return d.endsWith(`${d1}${d2}`)
}

// campo EMV: id + tamanho (2 dígitos) + valor
const campo = (id, valor) => id + String(valor.length).padStart(2, '0') + valor
const semAcento = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()

// CRC16-CCITT (polinômio 0x1021, início 0xFFFF), como pede o BR Code
export function crc16(texto) {
  let crc = 0xffff
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// "Pix copia e cola" do QR estático (sem valor, reutilizável)
export function payloadPix({ chave, nome, cidade } = PIX) {
  const corpo =
    campo('00', '01') +                                              // formato
    campo('01', '11') +                                              // QR estático, pode pagar várias vezes
    campo('26', campo('00', 'br.gov.bcb.pix') + campo('01', chave)) + // conta Pix: a chave
    campo('52', '0000') +                                            // categoria
    campo('53', '986') +                                             // moeda: real
    campo('58', 'BR') +
    campo('59', semAcento(nome).slice(0, 25)) +
    campo('60', semAcento(cidade).slice(0, 15)) +
    campo('62', campo('05', '***')) +                                // sem identificador
    '6304'
  return corpo + crc16(corpo)
}

// lê os campos de um BR Code (para conferir o que foi gerado)
export function lerPayload(p) {
  const ler = s => {
    const out = {}
    for (let i = 0; i + 4 <= s.length;) {
      const id = s.slice(i, i + 2), n = Number(s.slice(i + 2, i + 4))
      out[id] = s.slice(i + 4, i + 4 + n); i += 4 + n
    }
    return out
  }
  const raiz = ler(p)
  return { raiz, conta: ler(raiz['26'] || '') }
}

// Gera e confere o Pix antes de mostrar. Se qualquer coisa não bater
// (CNPJ, chave dentro do QR, CRC), devolve erro e o totem NÃO mostra QR.
export function pixConferido() {
  if (!cnpjValido(PIX.chave) || PIX.cnpj.replace(/\D/g, '') !== PIX.chave) return { ok: false }
  const payload = payloadPix(PIX)
  const { raiz, conta } = lerPayload(payload)
  const crcOk = raiz['63'] === crc16(payload.slice(0, -4))
  if (!crcOk || conta['00'] !== 'br.gov.bcb.pix' || conta['01'] !== PIX.chave) return { ok: false }
  const qr = qrcode(0, 'M')
  qr.addData(payload)
  qr.make()
  const n = qr.getModuleCount()
  const modulos = []
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) modulos.push([c, r])
  return { ok: true, payload, n, modulos }
}
