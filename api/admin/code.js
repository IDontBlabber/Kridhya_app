// POST /api/admin/code  { action: 'send' }  or  { action: 'verify', code }
// Admin sign-in step 2 - emails a one-time code after the password and verifies it (Authorization: Bearer <token>).
import { CodeError, sendCode, verifyCode } from '../../backend/server/adminCode.js'
import { handle, json, readJson } from '../../backend/server/http.js'

export const POST = handle(async (request) => {
  const body = await readJson(request)
  try {
    if (body.action === 'send') return json(await sendCode(request))
    if (body.action === 'verify') return json(await verifyCode(request, body.code))
    return json({ error: 'Unknown action' }, 400)
  } catch (e) {
    if (e instanceof CodeError) return json({ error: e.message }, 400)
    if (/brevo/i.test(e?.message || '')) return json({ error: `The code email could not be sent (${e.message}).` }, 502)
    throw e
  }
})
