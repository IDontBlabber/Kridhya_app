// GET /api/store/config - what the checkout can offer (no secrets).
import { config, mailLive, paymentsLive, serverReady, shiprocketLive } from '../../backend/server/config.js'
import { json } from '../../backend/server/http.js'

export function GET() {
  return json({
    ready: serverReady(),
    onlinePayments: paymentsLive(),
    cod: config.shipping.codEnabled,
    codFee: config.shipping.codFee,
    freeShippingAbove: config.shipping.freeAbove,
    liveRates: shiprocketLive(),
    emails: mailLive(),
    // safe diagnostic: only the TYPE of Brevo key that is set, never the key itself
    mailKeyType: mailKeyType(config.mail.brevoKey),
  })
}

function mailKeyType(k) {
  if (!k) return 'missing'
  if (/^["']|["']$/.test(k)) return 'has quotes - remove them'
  if (/\s/.test(k)) return 'has spaces or line breaks - re-paste it'
  if (k.includes('=')) return 'contains "=" - paste only the key value'
  if (k.startsWith('xsmtpsib-')) return 'SMTP key (wrong type - needs the API key starting xkeysib-)'
  if (k.startsWith('xkeysib-')) return `API key (looks right, ${k.length} characters)`
  return 'unknown format - not a Brevo API key'
}
