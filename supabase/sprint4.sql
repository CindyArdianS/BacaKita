-- Sprint 4: Pembayaran (Simulasi) & Langganan

-- 1. Tambah kolom subscription di tabel users
alter table public.users
add column if not exists is_subscribed boolean default false,
add column if not exists subscription_plan text,
add column if not exists subscription_expiry timestamp with time zone;

-- 2. Buat tabel transactions
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  subtotal integer not null default 0,
  tax integer not null default 0,
  total integer not null default 0,
  payment_method text,
  status text not null check (status in ('pending', 'success', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for transactions
alter table public.transactions enable row level security;

-- Policies for transactions
create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions (simulation)"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions (simulation)"
  on public.transactions for update
  using (auth.uid() = user_id);

-- 3. Buat tabel transaction_items
create table if not exists public.transaction_items (
  id uuid default gen_random_uuid() primary key,
  transaction_id uuid references public.transactions(id) on delete cascade not null,
  book_id text not null,
  price integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for transaction_items
alter table public.transaction_items enable row level security;

-- Policies for transaction_items
create policy "Users can view their own transaction items"
  on public.transaction_items for select
  using (
    exists (
      select 1 from public.transactions
      where id = transaction_items.transaction_id
      and user_id = auth.uid()
    )
  );

create policy "Users can insert their own transaction items (simulation)"
  on public.transaction_items for insert
  with check (
    exists (
      select 1 from public.transactions
      where id = transaction_items.transaction_id
      and user_id = auth.uid()
    )
  );
