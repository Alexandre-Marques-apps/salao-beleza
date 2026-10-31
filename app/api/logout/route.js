import { cookiesLogout, json } from '../../../lib/session.js'

export async function POST() {
  return json({ ok: true }, { cookies: cookiesLogout() })
}
