// POST /api/checkout/retry  { orderNo }  (signed-in customer) - reopen payment for their own unpaid order.
import { retryPayment } from '../../backend/server/checkout.js'
import { currentUser } from '../../backend/server/db.js'
import { handle, json, readJson } from '../../backend/server/http.js'

export const POST = handle(async (request) => {
  const { orderNo } = await readJson(request)
  return json(await retryPayment(String(orderNo || ''), await currentUser(request)))
})
