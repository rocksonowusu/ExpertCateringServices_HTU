-- ============================================================================
-- HTU Cafeteria — Supabase schema
-- Run this once in your Supabase project: Dashboard ▸ SQL Editor ▸ paste ▸ Run
-- ============================================================================

-- ---------------------------------------------------------------------------
-- MENU ITEMS
-- ---------------------------------------------------------------------------
create table if not exists public.menu_items (
  id            text primary key,
  name          text not null,
  description   text not null default '',
  price         numeric not null,
  category      text not null,
  image         text not null default '',
  rating        numeric not null default 0,
  review_count  integer not null default 0,
  prep_time     text not null default '',
  is_available  boolean not null default true,
  is_popular    boolean not null default false,
  is_featured   boolean not null default false,
  calories      integer,
  tags          text[] not null default '{}',
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ORDERS  (items are stored inline as JSON to keep the app simple)
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  code           text unique not null,                       -- friendly id shown in the UI (e.g. HTU482931)
  user_id        text,                                       -- client id of the student who ordered
  customer_name  text,
  items          jsonb not null default '[]',                -- [{ name, quantity, price }]
  total          numeric not null,
  status         text not null default 'pending'
                   check (status in ('pending','preparing','ready','delivered','cancelled')),
  payment_method text not null check (payment_method in ('on_delivery','momo')),
  pickup_time    text,
  notes          text,
  created_at     timestamptz not null default now()
);

create index if not exists orders_user_id_idx     on public.orders (user_id);
create index if not exists orders_created_at_idx   on public.orders (created_at desc);

-- Payment tracking (safe to run on an existing orders table)
alter table public.orders add column if not exists payment_status text not null default 'unpaid';
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists channel text not null default 'app'; -- 'app' | 'pos'
do $$ begin
  alter table public.orders add constraint orders_payment_status_chk
    check (payment_status in ('unpaid','paid','refunded'));
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- NOTE: these policies are permissive (open to the anon key) so the demo works
-- without a full auth migration. Tighten them before any real-world launch.
-- ---------------------------------------------------------------------------
alter table public.menu_items enable row level security;
alter table public.orders     enable row level security;

drop policy if exists "menu read"  on public.menu_items;
drop policy if exists "menu write" on public.menu_items;
create policy "menu read"  on public.menu_items for select using (true);
create policy "menu write" on public.menu_items for all    using (true) with check (true);

drop policy if exists "orders read"   on public.orders;
drop policy if exists "orders insert" on public.orders;
drop policy if exists "orders update" on public.orders;
create policy "orders read"   on public.orders for select using (true);
create policy "orders insert" on public.orders for insert with check (true);
create policy "orders update" on public.orders for update using (true) with check (true);

-- ---------------------------------------------------------------------------
-- REALTIME  (so the admin dashboard updates live as orders come in / change)
-- ---------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.menu_items;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- STORAGE  (public bucket for uploaded menu images)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

do $$ begin
  create policy "menu-images read" on storage.objects
    for select using (bucket_id = 'menu-images');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "menu-images write" on storage.objects
    for insert with check (bucket_id = 'menu-images');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "menu-images update" on storage.objects
    for update using (bucket_id = 'menu-images');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- MENU SEED
-- ---------------------------------------------------------------------------
insert into public.menu_items
  (id, name, description, price, category, image, rating, review_count, prep_time, is_available, is_popular, is_featured, calories, tags)
values
  ('1',  'Jollof Rice + Chicken', $$Aromatic tomato-based rice slow-cooked with spices, served with juicy grilled or fried chicken. HTU's most-loved dish!$$, 35, 'Rice Dishes',   'https://i.pinimg.com/736x/8a/5c/63/8a5c634bf5269e331f9046f2cf7f9b03.jpg', 4.8, 214, '15–20 min', true, true,  true,  680, ARRAY['Popular','Staff Pick']),
  ('2',  'Jollof Rice + Fish',    $$Classic tomato jollof rice paired with crispy fried tilapia or mackerel. A cafeteria staple.$$, 28, 'Rice Dishes',   'https://i.pinimg.com/736x/87/c3/c9/87c3c99b29a54f29d8e9a2f23baeab19.jpg', 4.6, 187, '15–20 min', true, true,  false, 600, ARRAY['Popular']),
  ('3',  'Fried Rice + Chicken',  $$Golden stir-fried rice with vegetables, eggs, and seasoning, served with tender chicken.$$, 38, 'Rice Dishes',   'https://i.pinimg.com/736x/72/09/c5/7209c530fb18ccf4599b7ab841964f03.jpg', 4.7, 163, '15–20 min', true, true,  true,  720, ARRAY['Popular']),
  ('4',  'Waakye',                $$Traditional Ghanaian rice and beans cooked together, served with spaghetti, wele, and fish stew. A national favourite!$$, 22, 'Rice Dishes', 'https://i.pinimg.com/736x/fe/b2/21/feb2217cdf4b59601ec8603d66dfdb77.jpg', 4.9, 289, '10–15 min', true, true, true, 580, ARRAY['Popular','Best Value']),
  ('5',  'Plain Rice + Stew',     $$Fluffy plain white rice served with rich tomato stew. Simple, filling, and affordable.$$, 20, 'Rice Dishes',   'https://i.pinimg.com/736x/ca/75/3a/ca753a5ba47a9fdc41d5619e76ec04c4.jpg', 4.4, 98,  '10 min',    true, false, false, 520, ARRAY['Best Value']),
  ('6',  'Banku + Tilapia',       $$Fermented corn and cassava dough served with grilled whole tilapia, garden egg stew, and shito (pepper sauce). A true Ghanaian delicacy.$$, 45, 'Soups & Stews', 'https://i.pinimg.com/736x/b3/fe/44/b3fe44ddb27dc2783677efad95f6170b.jpg', 4.9, 312, '20–25 min', true, true, true, 750, ARRAY['Popular','Staff Pick']),
  ('7',  'Fufu + Light Soup',     $$Hand-pounded cassava and plantain fufu served with spicy chicken light soup. Comfort in a bowl.$$, 40, 'Soups & Stews', 'https://i.pinimg.com/736x/83/c4/71/83c471aaa1d2117adb30d7b35168bec7.jpg', 4.8, 241, '20–25 min', true, true, false, 700, ARRAY['Popular']),
  ('8',  'Fufu + Palmnut Soup',   $$Smooth fufu served with rich, creamy palmnut (banga) soup cooked with goat meat or chicken.$$, 42, 'Soups & Stews', 'https://i.pinimg.com/736x/a0/7e/cf/a07ecfea2a53cb9cd69706170d80d054.jpg', 4.9, 267, '20–25 min', true, true, false, 780, ARRAY['Popular','Chef''s Choice']),
  ('9',  'Omotuo + Groundnut Soup', $$Soft rice balls served with thick, nutty groundnut (peanut) soup, garnished with chicken.$$, 38, 'Soups & Stews', 'https://i.pinimg.com/736x/49/01/6b/49016bf581f03fa7abc6b6d6abea081a.jpg', 4.7, 178, '20–25 min', true, false, false, 720, ARRAY[]::text[]),
  ('10', 'Fried Chicken + Chips', $$Crispy seasoned fried chicken pieces served with golden french fries and ketchup.$$, 45, 'Fast Food', 'https://i.pinimg.com/736x/7a/a6/3d/7aa63d339069857c4c5484d0a6645a1e.jpg', 4.6, 145, '15–20 min', true, true, false, 820, ARRAY['Popular']),
  ('11', 'Meat Pie',              $$Flaky pastry filled with seasoned minced meat and vegetables. Great for a quick bite.$$, 12, 'Fast Food', 'https://i.pinimg.com/736x/a0/3a/83/a03a83d104fb6335fe183d93570a32cb.jpg', 4.3, 89, '5 min', true, false, false, 280, ARRAY['Quick Bite']),
  ('12', 'Spring Rolls (3 pcs)',  $$Crispy golden spring rolls filled with vegetables and chicken, served with sweet chili sauce.$$, 22, 'Fast Food', 'https://i.pinimg.com/736x/8d/51/b6/8d51b69c4c89973402663d4da4a78d2a.jpg', 4.5, 112, '10 min', true, false, false, 320, ARRAY[]::text[]),
  ('13', 'Kelewele',              $$Spiced ripe plantain cubes deep-fried to perfection. Seasoned with ginger, pepper, and spices.$$, 15, 'Snacks', 'https://i.pinimg.com/736x/0c/9b/f9/0c9bf9aea3b4cc4d016fe8846e14491b.jpg', 4.7, 203, '10 min', true, true, false, 380, ARRAY['Popular','Vegan']),
  ('14', 'Koose (Bean Cakes)',    $$Fried bean cakes made from black-eyed peas, crispy outside and soft inside. Served with pepper.$$, 8, 'Snacks', 'https://i.pinimg.com/736x/5a/41/d8/5a41d81c0f98943373ec50d71a8a8c00.jpg', 4.4, 76, '5 min', true, false, false, 210, ARRAY['Vegan','Best Value']),
  ('15', 'Club Sandwich',         $$Triple-layered sandwich with grilled chicken, lettuce, tomato, egg, and mayo on toasted bread.$$, 25, 'Snacks', 'https://i.pinimg.com/736x/75/0b/0e/750b0e4c2ab4984025c744818bdc5d4f.jpg', 4.5, 134, '5–10 min', true, false, false, 450, ARRAY[]::text[]),
  ('16', 'Sobolo',                $$Refreshing chilled hibiscus (roselle) drink with ginger and cloves. Ghana's beloved natural juice.$$, 8, 'Drinks', 'https://i.pinimg.com/736x/15/45/5e/15455ef587affa5c92bdeb9b99161ead.jpg', 4.8, 319, '1–2 min', true, true, false, 45, ARRAY['Popular','Vegan']),
  ('17', 'Mineral (Coke/Fanta/Sprite)', $$Cold bottled soft drink. Choose from Coca-Cola, Fanta Orange, or Sprite.$$, 8, 'Drinks', 'https://i.pinimg.com/736x/29/27/eb/2927ebf28962a656a365cdef7b400825.jpg', 4.5, 201, '1 min', true, false, false, 140, ARRAY[]::text[]),
  ('18', 'Malta Guiness',         $$Non-alcoholic malt drink, sweet and nourishing. A cafeteria classic.$$, 12, 'Drinks', 'https://i.pinimg.com/736x/17/8d/4a/178d4af2cffb1234affb528226e636f4.jpg', 4.6, 167, '1 min', true, false, false, 190, ARRAY[]::text[]),
  ('19', 'Fresh Fruit Yoghurt',   $$Creamy chilled yoghurt with fresh fruit toppings. Healthy and delicious.$$, 15, 'Drinks', 'https://i.pinimg.com/736x/b8/3f/f6/b83ff637185d809705ecf83c06fcee6d.jpg', 4.7, 98, '2 min', true, false, false, 160, ARRAY['Healthy']),
  ('20', 'Pure Water (Sachet)',   $$Cold chilled sachet water. Refreshing and budget-friendly.$$, 2, 'Drinks', 'https://i.pinimg.com/736x/25/98/e3/2598e3bd9b14c3a11b33fe90c949f537.jpg', 5.0, 543, '1 min', true, false, false, 0, ARRAY['Best Value']),
  ('21', 'Hausa Koko + Bread',    $$Warm, spicy millet porridge served with sliced bread. The perfect morning energy boost.$$, 15, 'Breakfast', 'https://i.pinimg.com/736x/99/e0/43/99e043bc17a723e167ddf7c1a27dd1a1.jpg', 4.8, 187, '5 min', true, true, false, 380, ARRAY['Popular','Morning Special']),
  ('22', 'Bread + Egg (Boiled/Fried)', $$Sliced bread served with boiled or fried eggs. Simple, nutritious, and filling.$$, 18, 'Breakfast', 'https://i.pinimg.com/736x/37/3b/7d/373b7d47f49ed2dc68917ac9b6b6853c.jpg', 4.6, 143, '5–10 min', true, false, false, 320, ARRAY['Morning Special']),
  ('23', 'Tea + Bread',           $$Hot Lipton tea served with fresh bread and butter or margarine. Classic morning comfort.$$, 12, 'Breakfast', 'https://i.pinimg.com/736x/6b/74/9b/6b749b00d364577f0a77127a01477dca.jpg', 4.5, 112, '5 min', true, false, false, 280, ARRAY['Morning Special','Best Value'])
on conflict (id) do nothing;
