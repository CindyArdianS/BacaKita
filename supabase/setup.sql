-- 1. Create a table for public profiles (users)
create table public.users (
  id uuid references auth.users not null primary key,
  email text not null,
  nama text,
  avatar_url text,
  role text default 'customer' check (role in ('customer', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security
alter table public.users enable row level security;

-- 3. Create RLS Policies
-- Users can view their own profile
create policy "Users can view own profile"
  on public.users for select
  using ( auth.uid() = id );

-- Users can update their own profile
create policy "Users can update own profile"
  on public.users for update
  using ( auth.uid() = id );

-- Admins can view all profiles
create policy "Admins can view all profiles"
  on public.users for select
  using ( (select role from public.users where id = auth.uid()) = 'admin' );

-- Admins can update all profiles
create policy "Admins can update all profiles"
  on public.users for update
  using ( (select role from public.users where id = auth.uid()) = 'admin' );

-- 4. Create a trigger to automatically create a profile for new users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, nama)
  values (new.id, new.email, new.raw_user_meta_data->>'nama');
  return new;
end;
$$;

-- 5. Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
