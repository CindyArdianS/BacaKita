-- Migrasi buku PDF. Jalankan sekali di Supabase SQL Editor.
-- Perbaiki policy profil lebih dahulu: upload Storage menggunakan is_admin().
alter table public.users enable row level security;
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
returns boolean language sql security definer set search_path = public
as $$ select exists (select 1 from public.users where id = auth.uid() and role = 'admin'); $$;

create policy "Users can read own data or admin can read all" on public.users for select
using (auth.uid() = id or public.is_admin());
create policy "Users can insert themselves" on public.users for insert
with check (auth.uid() = id);
create policy "Users can update own data or admin can update all" on public.users for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

alter table public.books add column if not exists category text;
alter table public.books add column if not exists cover text;
alter table public.books add column if not exists pdf_url text;
alter table public.books add column if not exists harga integer;

alter table public.books enable row level security;
drop policy if exists "Public can read active books" on public.books;
drop policy if exists "Admin can manage books" on public.books;
create policy "Public can read active books" on public.books for select
using (is_active = true);
create policy "Admin can manage books" on public.books for all
using (public.is_admin())
with check (public.is_admin());

-- Pertahankan data buku yang sudah ada pada kolom baru.
update public.books
set category = coalesce(category, genre),
    cover = coalesce(cover, cover_url),
    harga = coalesce(harga, price);

insert into storage.buckets (id, name, public)
values ('book-assets', 'book-assets', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
values ('book-pdfs', 'book-pdfs', true)
on conflict (id) do nothing;

drop policy if exists "Public can read book assets" on storage.objects;
drop policy if exists "Admins can upload book assets" on storage.objects;
drop policy if exists "Admins can update book assets" on storage.objects;
drop policy if exists "Admins can delete book assets" on storage.objects;

create policy "Public can read book assets" on storage.objects for select
using (bucket_id = 'book-assets');
create policy "Admins can upload book assets" on storage.objects for insert
with check (bucket_id = 'book-assets' and public.is_admin());
create policy "Admins can update book assets" on storage.objects for update
using (bucket_id = 'book-assets' and public.is_admin());
create policy "Admins can delete book assets" on storage.objects for delete
using (bucket_id = 'book-assets' and public.is_admin());

drop policy if exists "Public can read book PDFs" on storage.objects;
drop policy if exists "Admins can upload book PDFs" on storage.objects;
drop policy if exists "Admins can update book PDFs" on storage.objects;
drop policy if exists "Admins can delete book PDFs" on storage.objects;
create policy "Public can read book PDFs" on storage.objects for select
using (bucket_id = 'book-pdfs');
create policy "Admins can upload book PDFs" on storage.objects for insert
with check (bucket_id = 'book-pdfs' and public.is_admin());
create policy "Admins can update book PDFs" on storage.objects for update
using (bucket_id = 'book-pdfs' and public.is_admin());
create policy "Admins can delete book PDFs" on storage.objects for delete
using (bucket_id = 'book-pdfs' and public.is_admin());
