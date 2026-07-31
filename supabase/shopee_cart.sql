-- ============================================================
-- Shopee-style Cart & Checkout Migration (FIXED)
-- Jalankan file ini di Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. CARTS TABLE
-- ============================================================
create table if not exists public.carts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.carts enable row level security;

-- Drop existing policies first to avoid duplicate errors
drop policy if exists "Users can view their own cart" on public.carts;
drop policy if exists "Users can insert their own cart" on public.carts;
drop policy if exists "Users can update their own cart" on public.carts;

create policy "Users can view their own cart"
  on public.carts for select using (auth.uid() = user_id);

create policy "Users can insert their own cart"
  on public.carts for insert with check (auth.uid() = user_id);

create policy "Users can update their own cart"
  on public.carts for update using (auth.uid() = user_id);

-- ============================================================
-- 2. CART ITEMS TABLE
-- ============================================================
drop table if exists public.cart_items cascade;

create table public.cart_items (
  id uuid default gen_random_uuid() primary key,
  cart_id uuid references public.carts(id) on delete cascade not null,
  book_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(cart_id, book_id)
);

alter table public.cart_items enable row level security;

drop policy if exists "Users can view their own cart items" on public.cart_items;
drop policy if exists "Users can insert their own cart items" on public.cart_items;
drop policy if exists "Users can delete their own cart items" on public.cart_items;

create policy "Users can view their own cart items"
  on public.cart_items for select
  using (
    exists (
      select 1 from public.carts
      where id = cart_items.cart_id and user_id = auth.uid()
    )
  );

create policy "Users can insert their own cart items"
  on public.cart_items for insert
  with check (
    exists (
      select 1 from public.carts
      where id = cart_items.cart_id and user_id = auth.uid()
    )
  );

create policy "Users can delete their own cart items"
  on public.cart_items for delete
  using (
    exists (
      select 1 from public.carts
      where id = cart_items.cart_id and user_id = auth.uid()
    )
  );

-- ============================================================
-- 3. ORDERS TABLE
-- ============================================================
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  total integer not null default 0,
  payment_method text,
  status text not null check (status in ('pending', 'success', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.orders enable row level security;

drop policy if exists "Users can view their own orders" on public.orders;
drop policy if exists "Users can insert their own orders" on public.orders;

create policy "Users can view their own orders"
  on public.orders for select using (auth.uid() = user_id);

create policy "Users can insert their own orders"
  on public.orders for insert with check (auth.uid() = user_id);

-- ============================================================
-- 4. ORDER ITEMS TABLE
-- ============================================================
create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  book_id text not null,
  price integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.order_items enable row level security;

drop policy if exists "Users can view their own order items" on public.order_items;
drop policy if exists "Users can insert their own order items" on public.order_items;

create policy "Users can view their own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where id = order_items.order_id and user_id = auth.uid()
    )
  );

create policy "Users can insert their own order items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders
      where id = order_items.order_id and user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. LIBRARY TABLE
-- ============================================================
create table if not exists public.library (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  book_id text not null,
  purchased_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, book_id)
);

alter table public.library enable row level security;

drop policy if exists "Users can view their own library" on public.library;
drop policy if exists "Users can insert their own library" on public.library;

create policy "Users can view their own library"
  on public.library for select using (auth.uid() = user_id);

create policy "Users can insert their own library"
  on public.library for insert with check (auth.uid() = user_id);

-- ============================================================
-- 6. MIGRATE DATA: owned_books -> library
-- (Jalankan sekali saja untuk migrasi data lama)
-- ============================================================
insert into public.library (user_id, book_id, purchased_at)
select user_id, book_id, purchased_at
from public.owned_books
where not exists (
  select 1 from public.library l
  where l.user_id = owned_books.user_id
    and l.book_id = owned_books.book_id
)
on conflict (user_id, book_id) do nothing;
