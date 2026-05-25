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

