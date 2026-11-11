// Server-side settings (Vercel Functions). Secrets here are read from environment variables only and never
// reach the browser - none of them start with VITE_. See backend/README.md for the full list.

const COD_HIDDEN = true

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
    autoAwb: env('SHIPROCKET_AUTO_AWB', 'false') === 'true', // assign courier + AWB right after the order reaches Shiprocket
    autoPickup: env('SHIPROCKET_AUTO_PICKUP', 'false') === 'true', // and request pickup
    pickupPincode: env('SHIPROCKET_PICKUP_PINCODE'),
    webhookToken: env('SHIPROCKET_WEBHOOK_TOKEN'),
    // jewellery parcels: small box, light
    weightPerItemKg: num('SHIP_WEIGHT_PER_ITEM_KG', 0.15),
    box: { length: num('SHIP_BOX_LENGTH_CM', 15), breadth: num('SHIP_BOX_BREADTH_CM', 12), height: num('SHIP_BOX_HEIGHT_CM', 6) },
  },

  shipping: {
    flatFee: num('SHIPPING_FLAT_FEE', 99), // used when Shiprocket is not set up or unreachable
    freeAbove: num('FREE_SHIPPING_ABOVE', 0), // 0 = never free; e.g. 2999 = free shipping on orders of ₹2,999+
    // Cash on Delivery is HIDDEN for now (client request, Nov 2026). Everything for COD is still built:
    // to bring it back, change COD_HIDDEN to false and redeploy (COD_ENABLED in Vercel then controls it as before).
    codEnabled: !COD_HIDDEN && env('COD_ENABLED', 'true') !== 'false',
    codFee: num('COD_FEE', 0), // extra charge for Cash on Delivery
    codMax: num('COD_MAX_ORDER', 10000), // no COD above this order value
  },

  unpaidHoldMinutes: num('UNPAID_ORDER_MINUTES', 30),

  // Transactional email (Brevo API). Sender must be verified in Brevo > Senders & IP.
  mail: {
    brevoKey: env('BREVO_API_KEY'),
    fromEmail: env('MAIL_FROM_EMAIL'),
    fromName: env('MAIL_FROM_NAME', 'Kridhya by Devanshi Agarwal'),
    adminEmail: env('ADMIN_NOTIFY_EMAIL'), // gets a copy of new orders, refunds and failures
  },
  siteUrl: (env('SITE_URL') || env('VITE_SITE_URL') || 'https://kridhyabydevanshi.com').replace(/\/+$/, ''),

}

export const paymentsLive = () => !!(config.razorpay.keyId && config.razorpay.keySecret)
export const shiprocketLive = () => !!(config.shiprocket.email && config.shiprocket.password && config.shiprocket.pickupPincode)
export const serverReady = () => !!(config.supabaseUrl && config.supabaseSecret)

export const mailLive = () => !!(config.mail.brevoKey && config.mail.fromEmail)
