// POST /api/checkout/verify  { razorpay_order_id, razorpay_payment_id, razorpay_signature } - after the Razorpay window succeeds
import { confirmPayment } from '../../backend/server/checkout.js'
import { handle, json, readJson } from '../../backend/server/http.js'

export const POST = handle(async (request) => json(await confirmPayment(await readJson(request))))
