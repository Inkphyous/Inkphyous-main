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

create index if not exists idx_variant_sizes_variant on public.product_variant_sizes(variant_product_id);

drop trigger if exists trg_variant_sizes_updated_at on public.product_variant_sizes;
create trigger trg_variant_sizes_updated_at
before update on public.product_variant_sizes
for each row execute function public.set_updated_at();

