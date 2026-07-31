-- Perbaikan akses role admin untuk AuthContext dan tombol Dashboard Admin.
-- Jalankan sekali di Supabase SQL Editor.

alter table public.users enable row level security;

-- Hapus policy lama yang dapat saling membaca tabel users dan menyebabkan
-- error "infinite recursion detected in policy" / HTTP 500.
drop policy if exists "Users can view own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Admins can view all profiles" on public.users;
drop policy if exists "Admins can update all profiles" on public.users;
drop policy if exists "Admin can read all users" on public.users;
drop policy if exists "Users can insert themselves" on public.users;
drop policy if exists "Admin can update all users" on public.users;
drop policy if exists "Users can read own data" on public.users;
drop policy if exists "Users can update own data" on public.users;
drop policy if exists "Users can read own data or admin can read all" on public.users;
drop policy if exists "Users can update own data or admin can update all" on public.users;
drop policy if exists "Anyone can read users" on public.users;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$;

create policy "Users can read own data or admin can read all"
  on public.users for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can insert themselves"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update own data or admin can update all"
  on public.users for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- Pastikan akun admin yang sudah ada memang memiliki role lowercase "admin".
-- Ganti placeholder berikut dengan email akun admin, lalu jalankan bila perlu:
-- update public.users set role = 'admin' where email = 'admin@contoh.com';
