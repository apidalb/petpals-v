-- ============================================================
-- PetPals - Supabase Schema Setup
-- Jalankan file ini di: Supabase Dashboard → SQL Editor
-- Urutan eksekusi: jalankan semua sekaligus (Run All)
-- ============================================================


-- ============================================================
-- 1. TABEL: pets
-- ============================================================
create table if not exists public.pets (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  type        text        not null check (type in ('Dog', 'Cat', 'Bird', 'Reptile')),
  breed       text,
  age_years   numeric(4,1),
  status      text        not null default 'Available'
                          check (status in ('Available', 'Adopted', 'In Process')),
  description text,
  image_url   text,
  created_at  timestamptz not null default now()
);


-- ============================================================
-- 2. TABEL: profiles
-- Dibuat otomatis saat user register (lihat trigger di bawah)
-- ============================================================
create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text        not null default 'adopter'
                          check (role in ('adopter', 'admin')),
  phone       text,
  address     text,
  city        text,
  state       text,
  updated_at  timestamptz default now()
);


-- ============================================================
-- 3. TABEL: adoptions
-- ============================================================
create table if not exists public.adoptions (
  id                      uuid        primary key default gen_random_uuid(),
  user_id                 uuid        not null references auth.users(id) on delete cascade,
  pet_id                  uuid        not null references public.pets(id) on delete cascade,
  status                  text        not null default 'Pending'
                                      check (status in ('Pending', 'Approved', 'Rejected')),
  -- Form data
  note                    text,       -- motivation
  full_name               text,
  phone                   text,
  address                 text,
  home_type               text,
  rented_house            boolean,
  have_yard               boolean,
  owned_before            boolean,
  other_pet_types         text,
  maintenance_costs_ready boolean,
  created_at              timestamptz not null default now()
);


-- ============================================================
-- 4. TABEL: favorites
-- ============================================================
create table if not exists public.favorites (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  pet_id     uuid        not null references public.pets(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, pet_id)
);


-- ============================================================
-- 5. AKTIFKAN ROW LEVEL SECURITY
-- ============================================================
alter table public.pets      enable row level security;
alter table public.profiles  enable row level security;
alter table public.adoptions enable row level security;
alter table public.favorites enable row level security;


-- ============================================================
-- 6. HELPER: baca role user dari JWT (menghindari rekursi RLS)
-- ============================================================
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
as $$
  select coalesce(
    auth.jwt() -> 'user_metadata' ->> 'role',
    'adopter'
  )
$$;


-- ============================================================
-- 7. RLS POLICIES: pets
-- ============================================================
drop policy if exists "pets: public read"   on public.pets;
drop policy if exists "pets: admin insert"  on public.pets;
drop policy if exists "pets: admin update"  on public.pets;
drop policy if exists "pets: admin delete"  on public.pets;

-- Siapa saja bisa lihat daftar hewan
create policy "pets: public read"
  on public.pets for select
  using (true);

-- Hanya admin yang bisa tambah/edit/hapus
create policy "pets: admin insert"
  on public.pets for insert
  to authenticated
  with check (public.current_user_role() = 'admin');

create policy "pets: admin update"
  on public.pets for update
  to authenticated
  using (public.current_user_role() = 'admin');

create policy "pets: admin delete"
  on public.pets for delete
  to authenticated
  using (public.current_user_role() = 'admin');


-- ============================================================
-- 8. RLS POLICIES: profiles
-- ============================================================
drop policy if exists "profiles: user reads own"    on public.profiles;
drop policy if exists "profiles: admin reads all"   on public.profiles;
drop policy if exists "profiles: user updates own"  on public.profiles;
drop policy if exists "profiles: user inserts own"  on public.profiles;

create policy "profiles: user reads own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles: admin reads all"
  on public.profiles for select
  to authenticated
  using (public.current_user_role() = 'admin');

create policy "profiles: user inserts own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles: user updates own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ============================================================
-- 9. RLS POLICIES: adoptions
-- ============================================================
drop policy if exists "adoptions: user reads own"      on public.adoptions;
drop policy if exists "adoptions: admin reads all"     on public.adoptions;
drop policy if exists "adoptions: user inserts own"    on public.adoptions;
drop policy if exists "adoptions: admin updates status" on public.adoptions;

create policy "adoptions: user reads own"
  on public.adoptions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "adoptions: admin reads all"
  on public.adoptions for select
  to authenticated
  using (public.current_user_role() = 'admin');

create policy "adoptions: user inserts own"
  on public.adoptions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "adoptions: admin updates status"
  on public.adoptions for update
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');


-- ============================================================
-- 10. RLS POLICIES: favorites
-- ============================================================
drop policy if exists "favorites: user reads own"   on public.favorites;
drop policy if exists "favorites: user inserts own" on public.favorites;
drop policy if exists "favorites: user deletes own" on public.favorites;

create policy "favorites: user reads own"
  on public.favorites for select
  to authenticated
  using (auth.uid() = user_id);

create policy "favorites: user inserts own"
  on public.favorites for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "favorites: user deletes own"
  on public.favorites for delete
  to authenticated
  using (auth.uid() = user_id);


-- ============================================================
-- 11. TRIGGER: auto-buat profile saat user register
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'adopter')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- 12. STORAGE BUCKET: pet-images
-- (bisa juga dijalankan terpisah dari file prk22-47-storage.sql)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-images',
  'pet-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read pet images"          on storage.objects;
drop policy if exists "Authenticated upload pet images"  on storage.objects;
drop policy if exists "Authenticated update pet images"  on storage.objects;
drop policy if exists "Authenticated delete pet images"  on storage.objects;

create policy "Public read pet images"
  on storage.objects for select
  using (bucket_id = 'pet-images');

create policy "Authenticated upload pet images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'pet-images');

create policy "Authenticated update pet images"
  on storage.objects for update
  to authenticated
  using  (bucket_id = 'pet-images')
  with check (bucket_id = 'pet-images');

create policy "Authenticated delete pet images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'pet-images');