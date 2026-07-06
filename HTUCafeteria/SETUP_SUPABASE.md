# Supabase Backend Setup (5 minutes)

The app already runs **without** a backend — it falls back to local/in-memory data,
so nothing is broken before you do this. Wiring Supabase makes orders **persist** and
sync **live** from student phones to the admin dashboard.

## 1. Create a project
1. Go to https://supabase.com → **New project** (the free tier is fine).
2. Pick a name + database password, wait ~2 min for it to provision.

## 2. Create the tables
1. In the project: **SQL Editor** → **New query**.
2. Open [`supabase/schema.sql`](./supabase/schema.sql), copy everything, paste, click **Run**.
   - This creates the `orders` and `menu_items` tables, security policies,
     turns on realtime for orders, and seeds the 23 menu items.

## 3. Add your keys to the app
1. In Supabase: **Project Settings → API**. Copy the **Project URL** and the **anon public** key.
2. In the `HTUCafeteria` folder, copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
3. Paste your two values into `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
4. **Restart the dev server** so Expo picks up the env vars:
   ```
   npx expo start -c
   ```

## 4. Try it
- Place an order from the app → it writes a row to `orders` in Supabase.
- Open **Table Editor → orders** to see it.
- Log in as the admin (`admin@htu.edu.gh` / `admin123`) → **Manage Orders** shows it,
  and advancing the status updates the row live (and reflects on the student's "My Orders").

## What's wired
| Screen | Behaviour |
|--------|-----------|
| Checkout → Place Order | Inserts a real order, shows its code on the success screen |
| My Orders (student) | Loads that student's orders from Postgres on focus |
| Admin → Manage Orders | Loads all orders + **realtime**; status buttons persist to DB |
| Admin → Dashboard | Live order counts / revenue |

## Security note
The SQL uses **permissive** row-level-security policies (open to the anon key) so the
demo works without a full auth migration. Before any real launch, tighten the policies
in `schema.sql` (e.g. require Supabase Auth and scope orders to `auth.uid()`).

## Re-run the schema after updates
The app now also uses **payment tracking** and **menu image uploads**. If your
project was created before these, just open `supabase/schema.sql` and run it
again — every statement is idempotent (safe to re-run). It will:
- add `payment_status`, `paid_at`, `channel` columns to `orders`
- create a public **`menu-images`** Storage bucket (for uploaded dish photos)

After that:
- **Transactions** page shows the real payment ledger; **Mark Paid / Refund** persist.
- **POS** counter sales write real paid orders (channel = pos).
- **Customers** page is derived live from orders.
- **Menu** Add/Edit/Sold-Out/Featured **persist to `menu_items`**, and uploaded
  images go to Supabase Storage. The student app reads the same `menu_items`,
  so menu changes show up in the app.

## Next steps (not done yet)
- Migrate login from the mock `authStore` to real Supabase Auth.
- Real MoMo gateway (Paystack / Hubtel) so payments are auto-verified.
