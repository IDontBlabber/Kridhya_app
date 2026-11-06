# Kridhya backend

The website (`src/`) is deployed on **Vercel**. Everything it reads and writes lives in **Supabase**:
products, journal posts, the pop-up banner, orders, admin logins and uploaded photos.
This folder holds the backend code. Vercel ignores it; nothing here is published with the site.

```
backend/
  database/schema.sql          tables, security rules, order functions, photo storage (run in Supabase)
  database/002_payments_shipping.sql   payments + shipping additions (run after schema.sql)
  server/                      Razorpay, Shiprocket and checkout logic used by the /api server functions
  scripts/generate-seo.mjs     builds robots.txt, sitemap.xml, llms.txt (runs automatically on `npm run build`)
  scripts/set-admin-password.mjs   preview-mode admin password (only used without Supabase)
```

## How data flows

| Website feature | Reads / writes | Rule (in `schema.sql`) |
|---|---|---|
| Home, Shop, Collections, Product | `products` | visitors only see `published` rows |
| Journal, blog posts | `posts` | visitors only see published posts whose `publish_at` has passed (scheduling) |
| Festival pop-up | `settings` (key `popup`) | readable by everyone |
| Checkout → Place order | `place_order()` | prices come from the database, stock is checked and reduced in one step |
| Track your order | `track_order()` | needs order number + checkout phone; never returns address or email |
| Admin (`/admin`) | all tables + `media` storage | only users listed in `admins` |
| Admin → move order to next stage | `set_order_status()` | logs each step; cancelling puts stock back |

## One-time setup (about 10 minutes)

1. **Create the project.** Go to supabase.com → *New project*, region **Mumbai (ap-south-1)**, and choose a strong database password.
2. **Create the tables.** Open *SQL Editor* → *New query*, paste all of `backend/database/schema.sql` and click **Run**. It is safe to run again later.
3. **Create the client's login.** Go to *Authentication → Users → Add user → Create new user*: enter the client's email and a strong password, and tick *Auto Confirm User*. Then run this in the SQL Editor with that email:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'client@example.com' on conflict do nothing;
   ```
4. **Turn on live order alerts (optional).** Under *Database → Publications → supabase_realtime*, enable the `orders` table, so new orders pop up in the dashboard without a refresh.
5. **Add the website keys.** Copy them from *Project Settings → API*:
   - locally, in `.env.local`:
     ```
     VITE_SUPABASE_URL=https://xxxx.supabase.co
     VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # the publishable key - never the secret / service_role key
     SITE_URL=https://kridhyabydevanshi.com   # used for sitemap.xml / llms.txt
     ```
   - on Vercel, under *Project → Settings → Environment Variables*: add the same three, then **Redeploy**.
6. **Bring the catalogue in.** Sign in at `/admin` with the step 3 email. Go to **Data & backup → Import into the database**, then either:
   - **Copy this browser's preview edits** (includes photos uploaded in preview mode), or
   - **Import the original catalogue**.

Once these keys are set, the `VITE_ADMIN_USER` and `VITE_ADMIN_PASSWORD_HASH` preview login variables are no longer used. Admins sign in with their Supabase email and password.

## Order stages

`placed` → `confirmed` (accepted) → `packed` → `shipped` (courier + tracking number) → `out_for_delivery` → `delivered`, plus `cancelled`.
The customer tracking page (`/track-order`) shows the same steps. Labels live in `src/lib/orders.js`.

## Payments (Razorpay) and shipping (Shiprocket)

Server code: `backend/server/` (Razorpay, Shiprocket, checkout logic). Vercel runs the small entry files in `api/` as server functions. `npm run dev` also serves them locally.

### Checkout flow

1. The shopper enters a PIN code, and `/api/shipping/rates` returns a **live Shiprocket rate**: the recommended courier, its charge and the estimated delivery date. Free shipping and Cash on Delivery charges are added when they apply.
2. **Pay online:** `/api/checkout/create` recalculates prices, stock and shipping on the server. It creates the order as `awaiting_payment` (stock held) and a Razorpay order, and the Razorpay window opens.
3. After payment, `/api/checkout/verify` checks the signature and the amount with Razorpay, marks the order **paid**, and sends it to **Shiprocket**. `/api/webhooks/razorpay` does the same if the shopper closes the tab before the page can confirm.
4. **Cash on Delivery** orders go straight to Shiprocket as COD.
5. Orders left unpaid for 30 minutes are cancelled automatically and their stock is released.
6. In **Admin → Orders → (order)**, the *Shiprocket* panel handles the shipment: send to Shiprocket, assign courier & AWB, schedule pickup and print the shipping label. Courier updates (picked up, in transit, out for delivery, delivered, RTO) move the order automatically via `/api/webhooks/fulfillment`. The customer tracking page shows the same steps.

### Setup

1. **Database:** run `backend/database/002_payments_shipping.sql` in the Supabase SQL Editor, after `schema.sql`.
2. **Supabase secret key:** copy it from *Project Settings → API Keys → Secret keys* (`sb_secret_…`) into `SUPABASE_SECRET_KEY`. It's server only and must never start with `VITE_`.
3. **Razorpay:** copy the Key ID and Key Secret from *Dashboard → Account & Settings → API Keys*. Use test-mode keys first.
   Webhook: *Dashboard → Webhooks → Add*:
   - URL: `https://<your-site>/api/webhooks/razorpay`
   - Event: `payment.captured`
   - Secret: any long random string, also set as `RAZORPAY_WEBHOOK_SECRET`
4. **Shiprocket:**
   - Create an **API user** under *Settings → API → Configure → Create an API User*. Use its email and password, not your main login.
   - Add your pickup address under *Settings → Pickup Addresses*. Its nickname is `SHIPROCKET_PICKUP_LOCATION` and its PIN code is `SHIPROCKET_PICKUP_PINCODE`.
   - Webhook: *Settings → API → Webhooks*:
     - URL: `https://<your-site>/api/webhooks/fulfillment` (the address must **not** contain the word "shiprocket")
     - Token: any random string, also set as `SHIPROCKET_WEBHOOK_TOKEN`
5. Add all the variables below to **Vercel → Settings → Environment Variables**, and to `.env.local` for local testing. Then **Redeploy**.

| Variable | Example | Notes |
|---|---|---|
| `SUPABASE_SECRET_KEY` | `sb_secret_…` | required for checkout |
| `RAZORPAY_KEY_ID` | `rzp_test_…` / `rzp_live_…` | |
| `RAZORPAY_KEY_SECRET` | | |
| `RAZORPAY_WEBHOOK_SECRET` | random string | same as in the Razorpay webhook |
| `SHIPROCKET_EMAIL` / `SHIPROCKET_PASSWORD` | API user | |
| `SHIPROCKET_PICKUP_LOCATION` | `Primary` | pickup address nickname |
| `SHIPROCKET_PICKUP_PINCODE` | `560001` | where parcels are picked up |
| `SHIPROCKET_WEBHOOK_TOKEN` | random string | same as in the Shiprocket webhook |
| `SHIPPING_FLAT_FEE` | `99` | used if Shiprocket is not set up or unreachable |
| `FREE_SHIPPING_ABOVE` | `2999` | `0` = never free |
| `COD_ENABLED` / `COD_FEE` / `COD_MAX_ORDER` | `true` / `40` / `10000` | Cash on Delivery rules |
| `SHIP_WEIGHT_PER_ITEM_KG`, `SHIP_BOX_LENGTH_CM`, `SHIP_BOX_BREADTH_CM`, `SHIP_BOX_HEIGHT_CM` | `0.15`, `15`, `12`, `6` | parcel size used for rates |
| `UNPAID_ORDER_MINUTES` | `30` | how long stock is held for an unpaid online order |

Until `SUPABASE_SECRET_KEY` is set, checkout keeps the earlier no-payment flow, so nothing breaks while the accounts are being set up.

