-- Sprint 3: Tables for Cart and Owned Books

-- 1. Create table for cart items
create table public.cart_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  book_id text not null, -- using text because we use string IDs from local JSON
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for cart_items
alter table public.cart_items enable row level security;

-- Policies for cart_items
create policy "Users can view their own cart items"
  on public.cart_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own cart items"
  on public.cart_items for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own cart items"
  on public.cart_items for delete
  using (auth.uid() = user_id);


-- 2. Create table for owned books
create table public.owned_books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  book_id text not null,
  purchased_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for owned_books
alter table public.owned_books enable row level security;

-- Policies for owned_books
create policy "Users can view their own books"
  on public.owned_books for select
  using (auth.uid() = user_id);

-- Normally, inserting to owned_books is done by server-side logic after payment success,
-- but for simulation purposes, we'll allow users to insert their own records.
create policy "Users can insert their own books (simulation)"
  on public.owned_books for insert
  with check (auth.uid() = user_id);


-- 3. Create table for reading progress
create table public.reading_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  book_id text not null,
  last_chapter integer default 0,
  progress_percentage integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, book_id)
);

-- Enable RLS for reading_progress
alter table public.reading_progress enable row level security;

-- Policies for reading_progress
create policy "Users can view own reading progress"
  on public.reading_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own reading progress"
  on public.reading_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reading progress"
  on public.reading_progress for update
  using (auth.uid() = user_id);
