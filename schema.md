# Inkphyous Supabase Schema And Flow

## 1) Storage structure (Supabase Storage bucket: `product-images`)

Images are uploaded in this folder hierarchy:

```text
product-images/
  {category-slug}/
    {product-name-slug}/
      {color-slug}/
        {image-file-1}
        {image-file-2}
        ...
```

Example:

```text
product-images/
  jerseys/
    jersey-reptile/
      red/
        jr1-red-main.png
        jr1-red-1.jpeg
        jr1-red-2.jpeg
```

Local files are not deleted. They are only uploaded/copy-synced to Supabase.

---

## 2) SQL hierarchy (category -> product name -> color -> product_id)

The SQL schema lives in: `supabase/schema.sql`

Main tables:

1. `product_categories`
2. `catalog_products`
3. `product_colors`
4. `product_variants` (this contains the canonical `product_id` used everywhere)
5. `product_variant_images` (ordered PDP image URLs)
6. `product_variant_sizes` (size + stock per color variant)
7. `cart_items` (references `product_id` only, plus size/quantity)
8. `wishlist_items` (references `product_id` only)

---

## 3) Table purpose

### `product_categories`
- One row per top-level category (Jerseys, Pants, Shorts, etc.)

### `catalog_products`
- One row per product name under a category (example: `Jersey Lizard`)

### `product_colors`
- One row per color variant under a product (example: `Red`)

### `product_variants`
- One row per `(product + color)` variant
- Contains:
  - `product_id` (primary key, canonical ID, deterministic format: `INKP-{12-char-hash}`)
  - price and discount price
  - `main_image_url`
  - links to category/product/color via foreign keys

### `product_variant_images`
- Ordered gallery for PDP (`position` column)
- Stores image URLs for all additional product photos

### `product_variant_sizes`
- Stores sizes per color variant with stock flags
- Used to render disabled/crossed sizes on PDP when out of stock

### `cart_items`
- Stores only:
  - `user_id`
  - `product_id` (FK to `product_variants.product_id`)
  - `size`
  - `quantity`

### `wishlist_items`
- Stores only:
  - `user_id`
  - `product_id` (FK to `product_variants.product_id`)

---

## 4) Product flow in app

1. Dashboard card click opens **product name** (not just one color).
2. PDP loads all variants from `product_variants` for that product.
3. Color switch on PDP changes selected variant (`product_id`) and its image URLs.
4. Add to cart stores only `product_id` (+ size/qty) in `cart_items`.
5. Wishlist stores only `product_id` in `wishlist_items`.
6. Cart/wishlist images are fetched from variant URLs in DB (already from Supabase Storage).
7. PDP gallery uses `galleryImages` (main image excluded), while carousel/main uses variant `mainImage`.

---

## 5) Backend/API endpoints added

1. `GET /api/products`
   - Reads Supabase catalog tables and composes the existing frontend product shape.
   - Falls back to local seed data if Supabase is unavailable.

2. `GET/POST/PATCH/DELETE /api/cart`
   - Stores and updates cart rows by `user_id + product_id + size`.
   - Returns cart items with variant image URLs for UI.

3. `GET/POST/DELETE /api/wishlist`
   - Stores wishlist rows by `user_id + product_id`.

---

## 6) Migration and seed

Seed script:

```bash
node scripts/supabase/seed-catalog.mjs
```

Dry run:

```bash
node scripts/supabase/seed-catalog.mjs --dry-run
```

What it does:

1. Loads local products from `lib/products.js`
2. Uploads product images to Supabase Storage with `category/product/color` folders
3. Inserts/updates category/product/color/variant/image tables
4. Uploads extra images from `jersey images/` into `_unmapped/jersey-images/` (no local deletion)
5. Retries transient Storage upload failures (timeouts/503/504) automatically

Required env vars:

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `SUPABASE_SERVICE_ROLE_KEY`
3. Optional: `SUPABASE_STORAGE_BUCKET` (defaults to `product-images`)
4. Optional: `NEXT_PUBLIC_FIREBASE_API_KEY` (for admin token verification endpoint)
5. Optional: `NEXT_PUBLIC_FIREBASE_DATABASE_URL` (for RTDB admin allowlist lookup)

The seed script auto-loads `.env.local` and `.env` if present.

---

## 7) Example hierarchy row mapping

Example:

- Category: `Jersey`
- Product Name: `Jersey Lizard`
- Color: `Red`
- Variant row: `product_id = JSY-2025-RPT-RED-M`

Variant row contains:

1. description context via linked product record
2. price
3. main image URL
4. ordered additional image URLs (via `product_variant_images`)

Cart and wishlist use only `product_id` to reference this full dataset.
