-- ============================================================
-- Sprint 6: Tabel REVIEWS (Rating & Ulasan Buku)
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Buat tabel reviews
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  book_id text not null,
  user_id uuid references auth.users not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(book_id, user_id)
);

-- Enable RLS
alter table public.reviews enable row level security;

-- Drop existing policies jika ada
drop policy if exists "Anyone can read reviews" on public.reviews;
drop policy if exists "Users can insert their own review" on public.reviews;
drop policy if exists "Users can update their own review" on public.reviews;
drop policy if exists "Users can delete their own review" on public.reviews;

-- Semua orang bisa lihat ulasan
create policy "Anyone can read reviews"
  on public.reviews for select using (true);

-- User hanya bisa insert ulasan untuk diri sendiri
create policy "Users can insert their own review"
  on public.reviews for insert
  with check (auth.uid() = user_id);

-- User hanya bisa update ulasan miliknya sendiri
create policy "Users can update their own review"
  on public.reviews for update
  using (auth.uid() = user_id);

-- User hanya bisa hapus ulasan miliknya sendiri
create policy "Users can delete their own review"
  on public.reviews for delete
  using (auth.uid() = user_id);
