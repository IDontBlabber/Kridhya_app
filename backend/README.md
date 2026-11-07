# Kridhya backend

The website (`src/`) is deployed on **Vercel**. Everything it reads and writes lives in **Supabase**:
products, journal posts, the pop-up banner, orders, admin logins and uploaded photos.
This folder holds the backend code. Vercel ignores it; nothing here is published with the site.

```
backend/
  database/schema.sql          tables, security rules, order functions, photo storage (run in Supabase)
  database/002_payments_shipping.sql   payments + shipping additions (run after schema.sql)
  database/003_customers.sql           customer accounts, saved bags, My orders
  database/004_payments_refunds_shipping.sql   refunds, failed payments, webhook de-duplication, Shiprocket token store
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

## Accounts, payments, refunds and shipping (migration 004)

Run `backend/database/003_customers.sql` and then `backend/database/004_payments_refunds_shipping.sql` in the Supabase SQL Editor.

### Customer accounts (Supabase Auth: signed JWT sessions)

Customers can:
- **create an account** with email and password (the email must be confirmed)
- **sign in** with a password, or with a **6-digit email code**
- use **forgot password**, which leads to `/account/reset`
- see **My account**: orders, tracking, **Complete payment** on unpaid orders, and refunds

Checkout requires signing in. The bag is saved to the account.

Settings in Supabase:
- **Authentication → Sign In / Providers → Email:** turn on *Confirm email*, and set the minimum password length to **8**.
- **Authentication → URL Configuration:**
  - Site URL: `https://<your-site>`
  - Redirect URLs: `https://<your-site>/**`, `http://localhost:5173/**`
- **Authentication → Emails → SMTP Settings → Enable custom SMTP (Brevo):**
  - Host `smtp-relay.brevo.com`, port `587`
  - Username = your Brevo SMTP login
  - Password = a Brevo **SMTP key** (Brevo → SMTP & API → SMTP)
  - Sender = a sender verified in Brevo
- **Authentication → Emails → Templates → Magic Link:** add `{{ .Token }}` so the email shows the 6-digit code.

### Order emails (Brevo API)

The server sends customers emails for:
- **order confirmed:** paid online, or Cash on Delivery
- **payment not completed:** once per order, after the first failed attempt
- **shipped:** with the tracking number
- **out for delivery**
- **delivered**
- **cancelled**
- **refund started** and **refund processed**

The shop gets a copy (bcc) of confirmations, cancellations and refunds, sent to `ADMIN_NOTIFY_EMAIL`.

### Payments (Razorpay)

| Situation | What happens |
|---|---|
| Paid | Signature and amount checked with Razorpay. The order is marked **Paid** and sent to Shiprocket, and the customer is emailed. The checkout page and the webhook can both confirm the order; only the first counts. |
| Payment failed | Recorded on the order (attempt count and reason). The order stays open for 30 minutes, and the customer can **Complete payment** from My account on the same Razorpay order. After that, it expires and the stock is released. |
| Customer paid, but the page closed | The `payment.captured` webhook confirms the order. An admin can also click **Check with Razorpay** on the order. |
| Paid after the order expired | Kept and flagged on the timeline. Refund it from the order page. |
| Refund | Admin → Order → **Payment → Refund**, full or partial. It can never exceed what's left. Razorpay's `refund.processed` / `refund.failed` webhooks update the order (**Partly refunded** / **Refunded**). Refunds made in the Razorpay dashboard are recorded too. |
| Webhook replays | Every event is stored once (`payment_events`). Repeats are ignored. |

Razorpay webhook events to tick: `payment.captured`, `payment.failed`, `order.paid`, `refund.created`, `refund.processed`, `refund.failed`.

### Shipping (Shiprocket)

- **Login is shared and protected.** The login token is saved in the database and shared by every server instance, so the server logs in roughly every 9 days. If a login is rejected, logins pause for 30 minutes, so the account can't get locked. After fixing the login details, use **Try Shiprocket login again** on any order.
- **Order page actions:**
  - **Send to Shiprocket:** happens automatically after payment or a COD order
  - **Choose courier:** lists couriers with price, ETA and rating
  - **Auto-assign best courier** (AWB)
  - **Schedule pickup**
  - **Shipping label**
  - **Update tracking**
  - **Cancel shipment** (also cancelled automatically when the order is cancelled)
- **Automatic courier and pickup (optional):** `SHIPROCKET_AUTO_AWB=true` and `SHIPROCKET_AUTO_PICKUP=true`.
- **Courier updates** move the order through the webhook. A **daily job** (`/api/cron/daily`, set in `vercel.json`) also syncs tracking and expires unpaid orders. Set `CRON_SECRET` in Vercel to any random string; Vercel sends it automatically.

### New environment variables

| Variable | Notes |
|---|---|
| `BREVO_API_KEY` | Brevo → SMTP & API → **API keys** |
| `MAIL_FROM_EMAIL` / `MAIL_FROM_NAME` | a sender verified in Brevo |
| `ADMIN_NOTIFY_EMAIL` | the shop's inbox for copies |
| `SITE_URL` | `https://<your-site>`, used in email links |
| `CRON_SECRET` | random string, for the daily job |
| `SHIPROCKET_AUTO_AWB` / `SHIPROCKET_AUTO_PICKUP` | `true` / `false` |
