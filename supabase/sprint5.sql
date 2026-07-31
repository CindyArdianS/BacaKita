-- ============================================================
-- Sprint 5: Dashboard Customer & Admin (FINAL PERFECT FIX v3)
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. Tabel USERS
-- ============================================================
create table if not exists public.users (
  id uuid references auth.users not null primary key
);

alter table public.users add column if not exists email text;
alter table public.users add column if not exists nama text;
alter table public.users add column if not exists role text not null default 'customer';
alter table public.users add column if not exists bio text;
alter table public.users add column if not exists phone text;
alter table public.users add column if not exists avatar_url text;
alter table public.users add column if not exists is_active boolean not null default true;
alter table public.users add column if not exists is_subscribed boolean default false;
alter table public.users add column if not exists subscription_plan text;
alter table public.users add column if not exists created_at timestamp with time zone default timezone('utc'::text, now()) not null;

-- Migrasi User Lama: Masukkan semua user yang ada di auth.users tapi belum ada di public.users
insert into public.users (id, email, nama)
select id, email, coalesce(raw_user_meta_data->>'nama', 'User') from auth.users
on conflict (id) do nothing;

alter table public.users enable row level security;

-- ============================================================
-- 2. Fungsi is_admin (Anti-Recursion)
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- 3. RLS untuk USERS (Paling aman dari recursion)
-- ============================================================
-- Hapus SEMUA policy lama di users agar tidak bentrok
drop policy if exists "Admin can read all users" on public.users;
drop policy if exists "Users can insert themselves" on public.users;
drop policy if exists "Admin can update all users" on public.users;
drop policy if exists "Users can read own data" on public.users;
drop policy if exists "Users can update own data" on public.users;
drop policy if exists "Users can read own data or admin can read all" on public.users;
drop policy if exists "Users can update own data or admin can update all" on public.users;
drop policy if exists "Anyone can read users" on public.users;

-- Beri akses select ke semua orang (mencegah infinite recursion secara total)
create policy "Anyone can read users" on public.users for select using (true);

create policy "Users can insert themselves" on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update own data or admin can update all" on public.users for update
  using (auth.uid() = id or public.is_admin());

-- ============================================================
-- 4. Tabel FAVORITES
-- ============================================================
create table if not exists public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  book_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, book_id)
);
alter table public.favorites enable row level security;
drop policy if exists "Users can view their own favorites" on public.favorites;
drop policy if exists "Users can insert their own favorites" on public.favorites;
drop policy if exists "Users can delete their own favorites" on public.favorites;
create policy "Users can view their own favorites" on public.favorites for select using (auth.uid() = user_id);
create policy "Users can insert their own favorites" on public.favorites for insert with check (auth.uid() = user_id);
create policy "Users can delete their own favorites" on public.favorites for delete using (auth.uid() = user_id);

-- ============================================================
-- 5. Tabel READING GOALS
-- ============================================================
create table if not exists public.reading_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  target_books integer not null default 4,
  month integer not null,
  year integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, month, year)
);
alter table public.reading_goals enable row level security;
drop policy if exists "Users can manage their own reading goals" on public.reading_goals;
create policy "Users can manage their own reading goals" on public.reading_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 6. Tabel BOOKS (DROP dan RECREATE dengan format id TEXT)
-- ============================================================
drop table if exists public.chapters cascade;
drop table if exists public.books cascade;

create table public.books (
  id text primary key default gen_random_uuid()::text,
  title text not null default 'Untitled',
  author text not null default 'Unknown',
  description text,
  price integer not null default 0,
  old_price integer,
  cover_url text,
  genre text,
  badge text,
  pages integer default 0,
  publisher text,
  publish_year integer,
  rating numeric(3,1) default 0,
  review_count integer default 0,
  is_premium boolean default false,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.books enable row level security;
create policy "Public can read active books" on public.books for select using (is_active = true);
create policy "Admin can manage books" on public.books for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 7. Tabel CHAPTERS
-- ============================================================
create table public.chapters (
  id uuid default gen_random_uuid() primary key,
  book_id text references public.books(id) on delete cascade not null,
  title text not null default 'Chapter',
  content text,
  order_num integer not null default 1,
  is_free boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.chapters enable row level security;
create policy "Public can read chapters of active books" on public.chapters for select
  using (exists (select 1 from public.books where id = chapters.book_id and is_active = true));
create policy "Admin can manage chapters" on public.chapters for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 8. Admin RLS untuk Orders
-- ============================================================
drop policy if exists "Admin can read all orders" on public.orders;
create policy "Admin can read all orders" on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

-- ============================================================
-- 9. Storage Bucket untuk Avatar
-- ============================================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;

drop policy if exists "Avatar upload policy" on storage.objects;
create policy "Avatar upload policy" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid() is not null);
drop policy if exists "Avatar read policy" on storage.objects;
create policy "Avatar read policy" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "Avatar update policy" on storage.objects;
create policy "Avatar update policy" on storage.objects for update using (bucket_id = 'avatars' and auth.uid() is not null);

-- ============================================================
-- 10. Trigger untuk User Baru
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, nama, role, is_active)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nama', 'User'), 'customer', true)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
