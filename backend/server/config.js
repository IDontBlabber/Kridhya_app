// Server-side settings (Vercel Functions). Secrets here are read from environment variables only and never
// reach the browser - none of them start with VITE_. See backend/README.md for the full list.

const env = (k, d = '') => (process.env[k] ?? d).trim()
const num = (k, d) => (process.env[k] ? Number(process.env[k]) : d)

export const config = {
  supabaseUrl: env('VITE_SUPABASE_URL').replace(/\/+$/, ''),
  // new 'sb_secret_…' key (or the legacy service_role JWT). Server only.
  supabaseSecret: env('SUPABASE_SECRET_KEY') || env('SUPABASE_SERVICE_ROLE_KEY'),

  razorpay: {
    keyId: env('RAZORPAY_KEY_ID'),
    keySecret: env('RAZORPAY_KEY_SECRET'),
    webhookSecret: env('RAZORPAY_WEBHOOK_SECRET'),
  },

  shiprocket: {
    email: env('SHIPROCKET_EMAIL'),
    password: env('SHIPROCKET_PASSWORD'),
    pickupLocation: env('SHIPROCKET_PICKUP_LOCATION', 'Primary'), // the pickup address nickname in Shiprocket
    pickupPincode: env('SHIPROCKET_PICKUP_PINCODE'),
    webhookToken: env('SHIPROCKET_WEBHOOK_TOKEN'),
    // jewellery parcels: small box, light
    weightPerItemKg: num('SHIP_WEIGHT_PER_ITEM_KG', 0.15),
    box: { length: num('SHIP_BOX_LENGTH_CM', 15), breadth: num('SHIP_BOX_BREADTH_CM', 12), height: num('SHIP_BOX_HEIGHT_CM', 6) },
  },

  shipping: {
    flatFee: num('SHIPPING_FLAT_FEE', 99), // used when Shiprocket is not set up or unreachable
    freeAbove: num('FREE_SHIPPING_ABOVE', 0), // 0 = never free; e.g. 2999 = free shipping on orders of ₹2,999+
    codEnabled: env('COD_ENABLED', 'true') !== 'false',
    codFee: num('COD_FEE', 0), // extra charge for Cash on Delivery
    codMax: num('COD_MAX_ORDER', 10000), // no COD above this order value
  },

  unpaidHoldMinutes: num('UNPAID_ORDER_MINUTES', 30),
}

export const paymentsLive = () => !!(config.razorpay.keyId && config.razorpay.keySecret)
export const shiprocketLive = () => !!(config.shiprocket.email && config.shiprocket.password && config.shiprocket.pickupPincode)
export const serverReady = () => !!(config.supabaseUrl && config.supabaseSecret)
