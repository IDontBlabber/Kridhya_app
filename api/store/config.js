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
  })
}
