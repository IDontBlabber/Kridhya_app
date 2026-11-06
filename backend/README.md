# Kridhya backend

The website (`src/`) is deployed on **Vercel**. Everything it reads and writes lives in **Supabase**:
products, journal posts, the pop-up banner, orders, admin logins and uploaded photos.
This folder holds the backend code. Vercel ignores it; nothing here is published with the site.

```
backend/
  database/schema.sql          tables, security rules, order functions, photo storage (run in Supabase)
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

## Coming next (needs the client's accounts)

- **Razorpay online payments.** Needs the Razorpay Key ID and Key Secret. Server code for creating the payment and verifying its signature will live in `backend/functions/` (Supabase Edge Functions); orders then move to `paid` automatically.
- **Delivery partner** (Shiprocket, Delhivery, etc.). Needs API credentials. Booking a shipment from the order page will fill in the courier and tracking number automatically.
