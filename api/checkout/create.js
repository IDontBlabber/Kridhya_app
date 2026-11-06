// POST /api/checkout/create  { customer, address, items, note, payment:'online'|'cod' }
// Creates the order (prices + stock from the database, shipping from Shiprocket) and, for online payment, the Razorpay order.
import { createCheckout } from '../../backend/server/checkout.js'
import { handle, json, readJson } from '../../backend/server/http.js'

export const POST = handle(async (request) => json(await createCheckout(await readJson(request))))
