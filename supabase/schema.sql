-- Inkphyous catalog schema for:
-- category -> product name -> color -> product_id (variant)
-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;

-- =========================
-- Catalog hierarchy tables
-- =========================

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.product_categories(id) on delete restrict,
  slug text not null unique,
  name text not null,
  name_ar text,
  brand text not null default 'Inkphyous',
  subcategory text,
  summary text,
  summary_ar text,
  description text,
  description_ar text,
  details jsonb not null default '{}'::jsonb,
  details_ar jsonb not null default '{}'::jsonb,
  size_options text[] not null default '{}',
  price_inr integer not null default 0,
  discount_price_inr integer not null default 0,
  rating numeric(3,2),
  reviews integer not null default 0,
  main_image_url text,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, name)
);

create table if not exists public.product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.catalog_products(id) on delete cascade,
  slug text not null,
  color_name text not null,
  color_hex text,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, slug),
  unique (product_id, color_name)
);

-- product_id is the canonical variant ID used by cart and wishlist.
create table if not exists public.product_variants (
  product_id text primary key,
  product_ref_id uuid not null references public.catalog_products(id) on delete cascade,
  color_ref_id uuid not null references public.product_colors(id) on delete cascade,
  sku text unique,
  color_name text,
  color_hex text,
  price_inr integer not null default 0,
  discount_price_inr integer not null default 0,
  main_image_url text not null,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'product_variants_product_color_unique'
  ) then
    alter table public.product_variants
      add constraint product_variants_product_color_unique
      unique (product_ref_id, color_ref_id);
  end if;
end $$;

create table if not exists public.product_variant_images (
  id uuid primary key default gen_random_uuid(),
  variant_product_id text not null references public.product_variants(product_id) on delete cascade,
  image_url text not null,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (variant_product_id, position)
);

create table if not exists public.product_variant_sizes (
  id uuid primary key default gen_random_uuid(),
  variant_product_id text not null references public.product_variants(product_id) on delete cascade,
  size text not null,
  in_stock boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (variant_product_id, size)
);

-- =========================
-- Cart + Wishlist tables
-- =========================

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  product_id text not null references public.product_variants(product_id) on delete restrict,
  size text not null,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id, size)
);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  product_id text not null references public.product_variants(product_id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- =========================
-- Indexes
-- =========================

create index if not exists idx_catalog_products_category on public.catalog_products(category_id);
create index if not exists idx_product_colors_product on public.product_colors(product_id);
create index if not exists idx_product_variants_product_ref on public.product_variants(product_ref_id);
create index if not exists idx_product_variants_color_ref on public.product_variants(color_ref_id);
create index if not exists idx_variant_images_variant on public.product_variant_images(variant_product_id);
create index if not exists idx_variant_sizes_variant on public.product_variant_sizes(variant_product_id);
create index if not exists idx_cart_items_user on public.cart_items(user_id);
create index if not exists idx_wishlist_items_user on public.wishlist_items(user_id);

-- =========================
-- updated_at trigger
-- =========================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_product_categories_updated_at on public.product_categories;
create trigger trg_product_categories_updated_at
before update on public.product_categories
for each row execute function public.set_updated_at();

drop trigger if exists trg_catalog_products_updated_at on public.catalog_products;
create trigger trg_catalog_products_updated_at
before update on public.catalog_products
for each row execute function public.set_updated_at();

drop trigger if exists trg_product_colors_updated_at on public.product_colors;
create trigger trg_product_colors_updated_at
before update on public.product_colors
for each row execute function public.set_updated_at();

drop trigger if exists trg_product_variants_updated_at on public.product_variants;
create trigger trg_product_variants_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

drop trigger if exists trg_product_variant_images_updated_at on public.product_variant_images;
create trigger trg_product_variant_images_updated_at
before update on public.product_variant_images
for each row execute function public.set_updated_at();

drop trigger if exists trg_cart_items_updated_at on public.cart_items;
create trigger trg_cart_items_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

drop trigger if exists trg_variant_sizes_updated_at on public.product_variant_sizes;
create trigger trg_variant_sizes_updated_at
before update on public.product_variant_sizes
for each row execute function public.set_updated_at();

-- =========================
-- Storage bucket + policy
-- =========================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
on storage.objects
for select
to public
using (bucket_id = 'product-images');
