import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const PRODUCTS_FILE = path.join(PROJECT_ROOT, "lib", "products.js");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const JERSEY_IMAGES_DIR = path.join(PROJECT_ROOT, "jersey images");

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return null;
  const idx = trimmed.indexOf("=");
  const key = trimmed.slice(0, idx).trim();
  const rawValue = trimmed.slice(idx + 1).trim();
  const value = rawValue.replace(/^['"]|['"]$/g, "");
  return { key, value };
}

async function loadEnvFileIfExists(relativePath) {
  const filePath = path.join(PROJECT_ROOT, relativePath);
  if (!(await exists(filePath))) return;

  const content = await fs.readFile(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const entry = parseEnvLine(line);
    if (!entry) continue;
    if (!process.env[entry.key]) {
      process.env[entry.key] = entry.value;
    }
  }
}

await loadEnvFileIfExists(".env.local");
await loadEnvFileIfExists(".env");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "product-images";
const DRY_RUN = process.argv.includes("--dry-run");
const UPLOAD_UNMAPPED = process.env.UPLOAD_UNMAPPED !== "false";
const MAX_UPLOAD_RETRIES = Number(process.env.SUPABASE_UPLOAD_RETRIES || 5);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const colorHexMap = {
  black: "#111111",
  white: "#f5f5f5",
  blue: "#1f4dd6",
  green: "#2f8f48",
  grey: "#8f8f8f",
  gray: "#8f8f8f",
  pink: "#d56793",
  red: "#c62828",
  brown: "#7b4b2a",
  beige: "#d8c3a5",
};

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizePathSegment(value) {
  return String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function inferMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "application/octet-stream";
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadLocalProducts() {
  const source = await fs.readFile(PRODUCTS_FILE, "utf8");
  const scriptSource = source.replace(/export default products;\s*$/m, "return products;");
  // This evaluates trusted local seed data from the repository.
  const products = new Function(scriptSource)();
  if (!Array.isArray(products)) {
    throw new Error("lib/products.js did not return an array.");
  }
  return products;
}

async function ensureBucket() {
  if (DRY_RUN) return;

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw new Error(`Unable to list buckets: ${listError.message}`);

  const bucketExists = (buckets || []).some((bucket) => bucket.name === STORAGE_BUCKET);
  if (bucketExists) return;

  const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
    public: true,
  });
  if (createError) {
    throw new Error(`Unable to create bucket "${STORAGE_BUCKET}": ${createError.message}`);
  }
}

async function upsertOne(table, payload, onConflict) {
  if (DRY_RUN) {
    return { ...payload, id: payload.id || `dry-${table}-${Math.random().toString(36).slice(2)}` };
  }

  const query = supabase.from(table).upsert(payload, onConflict ? { onConflict } : {}).select("*");
  const { data, error } = await query;
  if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  if (!data?.length) throw new Error(`${table} upsert returned no rows.`);
  return data[0];
}

async function deleteVariantImages(variantProductId) {
  if (DRY_RUN) return;

  const { error } = await supabase
    .from("product_variant_images")
    .delete()
    .eq("variant_product_id", variantProductId);
  if (error) throw new Error(`Failed deleting old images for ${variantProductId}: ${error.message}`);
}

async function insertVariantImages(variantProductId, imageUrls) {
  if (!imageUrls.length) return;
  if (DRY_RUN) return;

  const rows = imageUrls.map((url, index) => ({
    variant_product_id: variantProductId,
    image_url: url,
    position: index,
    is_active: true,
  }));

  const { error } = await supabase.from("product_variant_images").insert(rows);
  if (error) throw new Error(`Failed inserting images for ${variantProductId}: ${error.message}`);
}

async function deleteVariantSizes(variantProductId) {
  if (DRY_RUN) return;
  const { error } = await supabase
    .from("product_variant_sizes")
    .delete()
    .eq("variant_product_id", variantProductId);
  if (error) {
    if (/product_variant_sizes|schema cache|Could not find the table/i.test(error.message || "")) {
      return;
    }
    throw new Error(`Failed deleting old sizes for ${variantProductId}: ${error.message}`);
  }
}

async function insertVariantSizes(variantProductId, sizes) {
  if (DRY_RUN) return;
  if (!sizes?.length) return;
  const rows = sizes.map((size, position) => ({
    variant_product_id: variantProductId,
    size,
    in_stock: true,
    position,
  }));
  const { error } = await supabase.from("product_variant_sizes").insert(rows);
  if (error) {
    if (/product_variant_sizes|schema cache|Could not find the table/i.test(error.message || "")) {
      return;
    }
    throw new Error(`Failed inserting sizes for ${variantProductId}: ${error.message}`);
  }
}

function resolveLocalImagePath(imagePath) {
  if (!imagePath) return null;
  const cleaned = String(imagePath).replace(/\\/g, "/").replace(/^\/+/, "");
  const publicCandidate = path.join(PUBLIC_DIR, cleaned);
  return publicCandidate;
}

async function uploadToStorage(localPath, storagePath) {
  if (DRY_RUN) {
    return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`;
  }

  const fileBuffer = await fs.readFile(localPath);
  const contentType = inferMimeType(localPath);

  let lastError = null;
  for (let attempt = 1; attempt <= MAX_UPLOAD_RETRIES; attempt += 1) {
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true,
        cacheControl: "3600",
      });

    if (!uploadError) {
      lastError = null;
      break;
    }

    lastError = uploadError;
    const isRetryable =
      /timeout|gateway|503|504|408|network|fetch/i.test(uploadError.message || "");

    if (!isRetryable || attempt === MAX_UPLOAD_RETRIES) break;

    const backoffMs = Math.min(1500 * 2 ** (attempt - 1), 12000);
    await new Promise((resolve) => setTimeout(resolve, backoffMs));
  }

  if (lastError) {
    throw new Error(`Upload failed for ${localPath}: ${lastError.message}`);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

function buildDeterministicProductId({ categorySlug, productSlug, colorSlug }) {
  const fingerprint = `${categorySlug}|${productSlug}|${colorSlug}`;
  const hash = createHash("sha256").update(fingerprint).digest("hex").slice(0, 12).toUpperCase();
  return `INKP-${hash}`;
}

async function findVariantByNaturalKey(productRefId, colorRefId) {
  if (DRY_RUN) return null;
  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_ref_id", productRefId)
    .eq("color_ref_id", colorRefId)
    .maybeSingle();
  if (error) throw new Error(`Variant lookup failed: ${error.message}`);
  return data || null;
}

async function variantExistsByProductId(productId) {
  if (DRY_RUN) return false;
  const { data, error } = await supabase
    .from("product_variants")
    .select("product_id")
    .eq("product_id", productId)
    .maybeSingle();
  if (error) throw new Error(`Variant id lookup failed: ${error.message}`);
  return Boolean(data);
}

async function migrateVariantIdIfNeeded({
  existingVariant,
  canonicalProductId,
  productRow,
  colorRow,
  colorName,
  colorHex,
  variant,
  product,
  mainImageUrl,
  variantIndex,
}) {
  if (DRY_RUN || !existingVariant) return canonicalProductId;
  if (existingVariant.product_id === canonicalProductId) return canonicalProductId;

  const canonicalAlreadyExists = await variantExistsByProductId(canonicalProductId);
  if (!canonicalAlreadyExists) {
    const { error: insertCanonicalError } = await supabase.from("product_variants").insert({
      product_id: canonicalProductId,
      product_ref_id: productRow.id,
      color_ref_id: colorRow.id,
      sku: canonicalProductId,
      color_name: colorName,
      color_hex: colorHex,
      price_inr: Number(variant.priceINR || product.discountPriceINR || product.priceINR || 0),
      discount_price_inr: Number(
        product.discountPriceINR || variant.priceINR || product.priceINR || 0
      ),
      main_image_url: mainImageUrl,
      position: variantIndex,
      is_active: true,
    });
    if (insertCanonicalError) {
      throw new Error(
        `Failed creating canonical variant ${canonicalProductId}: ${insertCanonicalError.message}`
      );
    }
  }

  const [cartUpdate, wishlistUpdate] = await Promise.all([
    supabase
      .from("cart_items")
      .update({ product_id: canonicalProductId })
      .eq("product_id", existingVariant.product_id),
    supabase
      .from("wishlist_items")
      .update({ product_id: canonicalProductId })
      .eq("product_id", existingVariant.product_id),
  ]);

  if (cartUpdate.error) {
    throw new Error(
      `Failed updating cart items for product id migration: ${cartUpdate.error.message}`
    );
  }
  if (wishlistUpdate.error) {
    throw new Error(
      `Failed updating wishlist items for product id migration: ${wishlistUpdate.error.message}`
    );
  }

  const { error: deleteLegacyImagesError } = await supabase
    .from("product_variant_images")
    .delete()
    .eq("variant_product_id", existingVariant.product_id);
  if (deleteLegacyImagesError) {
    throw new Error(
      `Failed deleting legacy variant images (${existingVariant.product_id}): ${deleteLegacyImagesError.message}`
    );
  }

  const { error: deleteLegacyVariantError } = await supabase
    .from("product_variants")
    .delete()
    .eq("product_id", existingVariant.product_id);
  if (deleteLegacyVariantError) {
    throw new Error(
      `Failed deleting legacy variant (${existingVariant.product_id}): ${deleteLegacyVariantError.message}`
    );
  }

  return canonicalProductId;
}

async function uploadUnmappedImages() {
  if (!UPLOAD_UNMAPPED) return [];
  if (!(await exists(JERSEY_IMAGES_DIR))) return [];

  const files = await fs.readdir(JERSEY_IMAGES_DIR, { withFileTypes: true });
  const uploaded = [];

  for (const file of files) {
    if (!file.isFile()) continue;
    const ext = path.extname(file.name).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) continue;

    const localPath = path.join(JERSEY_IMAGES_DIR, file.name);
    const storagePath = `_unmapped/jersey-images/${sanitizePathSegment(file.name)}`;
    const url = await uploadToStorage(localPath, storagePath);
    uploaded.push({ localPath, storagePath, url });
  }

  return uploaded;
}

async function main() {
  console.log(`[seed-catalog] Starting${DRY_RUN ? " (dry run)" : ""}...`);
  await ensureBucket();

  const products = await loadLocalProducts();
  const categoriesCache = new Map();
  const productsCache = new Map();
  const colorsCache = new Map();

  let variantCount = 0;
  let imageCount = 0;

  for (const [productIndex, product] of products.entries()) {
    const categoryName = product.category || "Uncategorized";
    const categorySlug = slugify(categoryName);
    const productSlug = slugify(product.name);

    let categoryRow = categoriesCache.get(categorySlug);
    if (!categoryRow) {
      categoryRow = await upsertOne(
        "product_categories",
        {
          slug: categorySlug,
          name: categoryName,
          position: productIndex,
        },
        "slug"
      );
      categoriesCache.set(categorySlug, categoryRow);
    }

    const productKey = `${categoryRow.id}:${productSlug}`;
    let productRow = productsCache.get(productKey);
    if (!productRow) {
      productRow = await upsertOne(
        "catalog_products",
        {
          category_id: categoryRow.id,
          slug: productSlug,
          name: product.name,
          name_ar: product.nameAr || null,
          brand: product.brand || "Inkphyous",
          subcategory: product.subcategory || null,
          summary: product.summary || null,
          summary_ar: product.summaryAr || null,
          description: product.description || null,
          description_ar: product.descriptionAr || null,
          details: product.details || {},
          details_ar: product.detailsAr || {},
          size_options: Array.isArray(product.sizeOptions) ? product.sizeOptions : [],
          price_inr: Number(product.priceINR || 0),
          discount_price_inr: Number(product.discountPriceINR || product.priceINR || 0),
          rating: product.rating ?? null,
          reviews: Number(product.reviews || 0),
          main_image_url: null,
          position: productIndex,
          is_active: true,
        },
        "slug"
      );
      productsCache.set(productKey, productRow);
    }

    for (const [variantIndex, variant] of (product.variants || []).entries()) {
      const colorName = variant.color || "Default";
      const colorSlug = slugify(colorName);
      const colorKey = `${productRow.id}:${colorSlug}`;
      const colorHex = colorHexMap[colorSlug] || null;

      let colorRow = colorsCache.get(colorKey);
      if (!colorRow) {
        colorRow = await upsertOne(
          "product_colors",
          {
            product_id: productRow.id,
            slug: colorSlug,
            color_name: colorName,
            color_hex: colorHex,
            position: variantIndex,
            is_active: true,
          },
          "product_id,color_name"
        );
        colorsCache.set(colorKey, colorRow);
      }

      const imageSources = [];
      if (variant.image) imageSources.push(variant.image);
      for (const img of variant.images || []) {
        if (!imageSources.includes(img)) imageSources.push(img);
      }

      const imageUrls = [];
      for (const sourcePath of imageSources) {
        const localPath = resolveLocalImagePath(sourcePath);
        if (!localPath || !(await exists(localPath))) {
          console.warn(`[seed-catalog] Missing local image: ${sourcePath}`);
          continue;
        }

        const fileName = sanitizePathSegment(path.basename(localPath));
        const storagePath = `${categorySlug}/${productSlug}/${colorSlug}/${fileName}`;
        const publicUrl = await uploadToStorage(localPath, storagePath);
        imageUrls.push(publicUrl);
      }

      if (!imageUrls.length) {
        console.warn(
          `[seed-catalog] Skipping variant ${variant.id} because no images were uploaded.`
        );
        continue;
      }

      const mainImageUrl = imageUrls[0];

      const deterministicProductId = buildDeterministicProductId({
        categorySlug,
        productSlug,
        colorSlug,
      });
      const existingVariant = await findVariantByNaturalKey(productRow.id, colorRow.id);
      const canonicalProductId = await migrateVariantIdIfNeeded({
        existingVariant,
        canonicalProductId: deterministicProductId,
        productRow,
        colorRow,
        colorName,
        colorHex,
        variant,
        product,
        mainImageUrl,
        variantIndex,
      });

      await upsertOne(
        "product_variants",
        {
          product_id: canonicalProductId,
          product_ref_id: productRow.id,
          color_ref_id: colorRow.id,
          sku: canonicalProductId,
          color_name: colorName,
          color_hex: colorHex,
          price_inr: Number(variant.priceINR || product.discountPriceINR || product.priceINR || 0),
          discount_price_inr: Number(
            product.discountPriceINR || variant.priceINR || product.priceINR || 0
          ),
          main_image_url: mainImageUrl,
          position: variantIndex,
          is_active: true,
        },
        "product_id"
      );

      if (!DRY_RUN && variantIndex === 0) {
        const { error: mainImageUpdateError } = await supabase
          .from("catalog_products")
          .update({ main_image_url: mainImageUrl })
          .eq("id", productRow.id);
        if (mainImageUpdateError) {
          throw new Error(
            `Failed to update main image for ${product.name}: ${mainImageUpdateError.message}`
          );
        }
      }

      await deleteVariantImages(canonicalProductId);
      await insertVariantImages(canonicalProductId, imageUrls);
      await deleteVariantSizes(canonicalProductId);
      await insertVariantSizes(canonicalProductId, product.sizeOptions || []);

      variantCount += 1;
      imageCount += imageUrls.length;
    }
  }

  const unmappedUploads = await uploadUnmappedImages();

  console.log("[seed-catalog] Done.");
  console.log(`  Categories: ${categoriesCache.size}`);
  console.log(`  Products:   ${productsCache.size}`);
  console.log(`  Colors:     ${colorsCache.size}`);
  console.log(`  Variants:   ${variantCount}`);
  console.log(`  Images:     ${imageCount}`);
  console.log(`  Unmapped images uploaded: ${unmappedUploads.length}`);
  console.log(
    "  Local files are untouched. No files were deleted from the repository."
  );
}

main().catch((error) => {
  console.error(`[seed-catalog] Failed: ${error.message}`);
  process.exit(1);
});
