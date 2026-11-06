// POST /api/shipping/rates  { pincode, items:[{slug,finish,qty}], payment:'online'|'cod' } -> live Shiprocket quote
import { quote } from '../../backend/server/checkout.js'
import { handle, json, readJson } from '../../backend/server/http.js'

export const POST = handle(async (request) => json(await quote(await readJson(request))))
