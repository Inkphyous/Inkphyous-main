import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getSupabaseAdmin, hasSupabaseAdminEnv } from "@/lib/supabase/server";
import { getAuthorizedAdminEmail } from "@/lib/firebase/serverAdminAuth";

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function jsonError(message, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function makeVariantProductId({ categorySlug, productSlug, colorSlug }) {
  const fingerprint = `${categorySlug}|${productSlug}|${colorSlug}`;
  const hash = createHash("sha256").update(fingerprint).digest("hex").slice(0, 12).toUpperCase();
  return `INKP-${hash}`;
}

async function ensureAdmin(request) {
  const email = await getAuthorizedAdminEmail(request);
  if (!email) throw new Error("Unauthorized");
  return email;
}

async function getCatalog(supabase) {
  const [categories, products, colors, variants, images] = await Promise.all([
    supabase.from("product_categories").select("*").order("position", { ascending: true }),
    supabase.from("catalog_products").select("*").order("position", { ascending: true }),
    supabase.from("product_colors").select("*").order("position", { ascending: true }),
    supabase.from("product_variants").select("*").order("position", { ascending: true }),
    supabase
      .from("product_variant_images")
      .select("*")
      .order("position", { ascending: true }),
  ]);

  let sizes = await supabase
    .from("product_variant_sizes")
    .select("*")
    .order("position", { ascending: true });

  if (sizes.error && /product_variant_sizes|schema cache|Could not find the table/i.test(sizes.error.message || "")) {
    sizes = { data: [], error: null };
  }

  const errors = [categories, products, colors, variants, images, sizes]
    .map((result) => result.error)
    .filter(Boolean);
  if (errors.length) throw new Error(errors[0].message);

  return {
    categories: categories.data || [],
    products: products.data || [],
    colors: colors.data || [],
    variants: variants.data || [],
    images: images.data || [],
    sizes: sizes.data || [],
  };
}

async function upsertProductPayload(supabase, payload) {
  const categoryName = payload?.category?.name;
  const productInput = payload?.product;
  const variantsInput = Array.isArray(payload?.variants) ? payload.variants : [];

  if (!categoryName || !productInput?.name || variantsInput.length === 0) {
    throw new Error("category.name, product.name and variants are required.");
  }

  // Get existing variants for cleanup later
  let existingVariants = [];
  if (productInput.id) {
    const { data } = await supabase.from("product_variants").select("product_id, color_ref_id").eq("product_ref_id", productInput.id);
    if (data) existingVariants = data;
  }

  const categorySlug = payload?.category?.slug || slugify(categoryName);
  const { data: categoryRows, error: categoryError } = await supabase
    .from("product_categories")
    .upsert(
      {
        name: categoryName,
        slug: categorySlug,
        position: Number(payload?.category?.position || 0),
      },
      { onConflict: "slug" }
    )
    .select("*");
  if (categoryError) throw new Error(categoryError.message);
  const categoryRow = categoryRows?.[0];
  if (!categoryRow) throw new Error("Category upsert failed.");

  const productSlug = productInput.slug || slugify(productInput.name);
  const { data: productRows, error: productError } = await supabase
    .from("catalog_products")
    .upsert(
      {
        id: productInput.id || undefined,
        category_id: categoryRow.id,
        slug: productSlug,
        name: productInput.name,
        name_ar: productInput.nameAr || null,
        brand: productInput.brand || "Inkphyous",
        subcategory: productInput.subcategory || null,
        summary: productInput.summary || null,
        summary_ar: productInput.summaryAr || null,
        tagline: productInput.tagline || null,
        tagline_ar: productInput.taglineAr || null,
        description: productInput.description || null,
        description_ar: productInput.descriptionAr || null,
        details: productInput.details || {},
        details_ar: productInput.detailsAr || {},
        size_options: [],
        price_inr: Number(productInput.priceINR || 0),
        discount_price_inr: Number(productInput.discountPriceINR || productInput.priceINR || 0),
        rating: Number(productInput.rating || 0) || null,
        reviews: Number(productInput.reviews || 0),
        position: Number(productInput.position || 0),
        is_active: productInput.isActive !== false,
      },
      { onConflict: "slug" }
    )
    .select("*");
  if (productError) throw new Error(productError.message);
  const productRow = productRows?.[0];
  if (!productRow) throw new Error("Product upsert failed.");

  let firstMainImage = null;
  const enabledSizes = new Set();
  let canWriteVariantSizes = true;
  const variantSizesMap = {};
  const variantSemiDescriptionsMap = {};
  
  const incomingVariantSkus = new Set();
  const incomingColorIds = new Set();

  for (const [variantPosition, variantInput] of variantsInput.entries()) {
    const colorName = variantInput.colorName || variantInput.color || "Default";
    const colorSlug = variantInput.colorSlug || slugify(colorName);

    const sizeRows = Array.isArray(variantInput.sizes) ? variantInput.sizes : [];
    variantSizesMap[colorName] = sizeRows.map((sizeEntry, sIdx) => {
      const sizeValue = typeof sizeEntry === "string" ? sizeEntry : String(sizeEntry.size || "").trim();
      return {
        size: sizeValue,
        inStock: typeof sizeEntry === "string" ? true : Boolean(sizeEntry.inStock ?? true),
        position: sIdx,
      };
    });
    
    variantSemiDescriptionsMap[colorName] = variantInput.semiDescription || "";

    const { data: colorRows, error: colorError } = await supabase
      .from("product_colors")
      .upsert(
        {
          id: variantInput.colorId || undefined,
          product_id: productRow.id,
          slug: colorSlug,
          color_name: colorName,
          color_hex: variantInput.colorHex || null,
          variant_name: variantInput.variantName || null,
          variant_description: variantInput.description || null,
          position: variantPosition,
          is_active: variantInput.isActive !== false,
        },
        { onConflict: "product_id,color_name" }
      )
      .select("*");
    if (colorError) throw new Error(colorError.message);
    const colorRow = colorRows?.[0];
    if (!colorRow) throw new Error("Color upsert failed.");

    const productId =
      variantInput.productId ||
      makeVariantProductId({ categorySlug: categoryRow.slug, productSlug, colorSlug });
    const mainImage = variantInput.mainImage;
    if (!mainImage) throw new Error(`Main image is required for color ${colorName}.`);
    if (!firstMainImage) firstMainImage = mainImage;

    const { error: variantError } = await supabase.from("product_variants").upsert(
      {
        product_id: productId,
        product_ref_id: productRow.id,
        color_ref_id: colorRow.id,
        sku: productId,
        color_name: colorName,
        color_hex: variantInput.colorHex || null,
        price_inr: Number(variantInput.priceINR || productInput.priceINR || 0),
        discount_price_inr: Number(
          variantInput.discountPriceINR ||
            productInput.discountPriceINR ||
            variantInput.priceINR ||
            productInput.priceINR ||
            0
        ),
        main_image_url: mainImage,
        position: variantPosition,
        is_active: variantInput.isActive !== false,
      },
      { onConflict: "product_id" }
    );
    if (variantError) throw new Error(variantError.message);
    
    incomingVariantSkus.add(productId);
    incomingColorIds.add(colorRow.id);

    const imageUrls = [mainImage, ...(variantInput.galleryImages || [])];
    const dedupedImages = [...new Set(imageUrls)];
    const { error: deleteImagesError } = await supabase
      .from("product_variant_images")
      .delete()
      .eq("variant_product_id", productId);
    if (deleteImagesError) throw new Error(deleteImagesError.message);

    if (dedupedImages.length) {
      const { error: insertImagesError } = await supabase.from("product_variant_images").insert(
        dedupedImages.map((url, idx) => ({
          variant_product_id: productId,
          image_url: url,
          position: idx,
          is_active: true,
        }))
      );
      if (insertImagesError) throw new Error(insertImagesError.message);
    }

    sizeRows.forEach((sizeEntry) => {
      const sizeValue =
        typeof sizeEntry === "string" ? sizeEntry : String(sizeEntry.size || "").trim();
      if (sizeValue) enabledSizes.add(sizeValue);
    });

    if (canWriteVariantSizes) {
      const { error: deleteSizesError } = await supabase
        .from("product_variant_sizes")
        .delete()
        .eq("variant_product_id", productId);
      if (deleteSizesError) {
        if (/product_variant_sizes|schema cache|Could not find the table/i.test(deleteSizesError.message || "")) {
          canWriteVariantSizes = false;
        } else {
          throw new Error(deleteSizesError.message);
        }
      }
    }

    if (canWriteVariantSizes && sizeRows.length) {
      const { error: insertSizesError } = await supabase.from("product_variant_sizes").insert(
        sizeRows.map((sizeEntry, idx) => {
          const sizeValue =
            typeof sizeEntry === "string" ? sizeEntry : String(sizeEntry.size || "").trim();
          return {
            variant_product_id: productId,
            size: sizeValue,
            in_stock:
              typeof sizeEntry === "string" ? true : Boolean(sizeEntry.inStock ?? true),
            position: idx,
          };
        })
      );
      if (insertSizesError) {
        if (/product_variant_sizes|schema cache|Could not find the table/i.test(insertSizesError.message || "")) {
          canWriteVariantSizes = false;
        } else {
          throw new Error(insertSizesError.message);
        }
      }
    }
  }

  // Cleanup removed variants
  const variantsToDelete = existingVariants.filter(v => !incomingVariantSkus.has(v.product_id));
  if (variantsToDelete.length > 0) {
    const skusToDelete = variantsToDelete.map(v => v.product_id);
    const colorsToDelete = variantsToDelete.map(v => v.color_ref_id);
    
    await supabase.from("product_variant_sizes").delete().in("variant_product_id", skusToDelete);
    await supabase.from("product_variant_images").delete().in("variant_product_id", skusToDelete);
    await supabase.from("product_variants").delete().in("product_id", skusToDelete);
    await supabase.from("product_colors").delete().in("id", colorsToDelete);
  }

  const newDetails = productRow.details && typeof productRow.details === "object" ? { ...productRow.details } : {};
  newDetails.migrated_sizes = true;
  newDetails.variant_sizes = variantSizesMap;
  newDetails.variant_semi_descriptions = variantSemiDescriptionsMap;

  const sizeOptions = enabledSizes.size ? [...enabledSizes] : [];
  const { error: updateProductError } = await supabase
    .from("catalog_products")
    .update({
      size_options: sizeOptions,
      main_image_url: firstMainImage,
      details: newDetails,
    })
    .eq("id", productRow.id);
  if (updateProductError) throw new Error(updateProductError.message);
}

export async function GET(request) {
  if (!hasSupabaseAdminEnv()) {
    return jsonError("Supabase env vars are not configured.", 500);
  }
  try {
    await ensureAdmin(request);
    const supabase = getSupabaseAdmin();
    const data = await getCatalog(supabase);
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    if (error.message === "Unauthorized") return jsonError(error.message, 401);
    return jsonError(error.message || "Failed to fetch admin catalog.", 500);
  }
}

export async function POST(request) {
  if (!hasSupabaseAdminEnv()) {
    return jsonError("Supabase env vars are not configured.", 500);
  }
  try {
    await ensureAdmin(request);
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const operation = body?.operation || "upsertProduct";
    if (operation !== "upsertProduct") {
      return jsonError("Unsupported operation.");
    }

    await upsertProductPayload(supabase, body?.payload || {});
    const data = await getCatalog(supabase);
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    if (error.message === "Unauthorized") return jsonError(error.message, 401);
    return jsonError(error.message || "Failed to upsert product.", 500);
  }
}

export async function DELETE(request) {
  if (!hasSupabaseAdminEnv()) {
    return jsonError("Supabase env vars are not configured.", 500);
  }
  try {
    await ensureAdmin(request);
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const categoryId = searchParams.get("categoryId");

    if (categoryId) {
      // Delete category
      // Note: This may fail if there are products still referencing this category due to foreign keys.
      const { error } = await supabase.from("product_categories").delete().eq("id", categoryId);
      if (error) throw new Error(error.message);
      const data = await getCatalog(supabase);
      return NextResponse.json({ success: true, ...data });
    }

    if (!productId) return jsonError("Missing productId or categoryId.");

    // Find all variants for this product
    const { data: variants } = await supabase.from("product_variants").select("product_id, color_ref_id").eq("product_ref_id", productId);
    if (variants && variants.length > 0) {
      const skus = variants.map(v => v.product_id);
      const colorIds = variants.map(v => v.color_ref_id);
      
      // Cascade delete manually
      await supabase.from("product_variant_sizes").delete().in("variant_product_id", skus);
      await supabase.from("product_variant_images").delete().in("variant_product_id", skus);
      await supabase.from("product_variants").delete().in("product_id", skus);
      await supabase.from("product_colors").delete().in("id", colorIds);
    }

    const { error } = await supabase.from("catalog_products").delete().eq("id", productId);
    if (error) throw new Error(error.message);
    const data = await getCatalog(supabase);
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    if (error.message === "Unauthorized") return jsonError(error.message, 401);
    return jsonError(error.message || "Failed to delete product.", 500);
  }
}

export async function PATCH(request) {
  if (!hasSupabaseAdminEnv()) {
    return jsonError("Supabase env vars are not configured.", 500);
  }
  try {
    await ensureAdmin(request);
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { type, id, is_active } = body;

    if (type === "product") {
      const { error: prodErr } = await supabase.from("catalog_products").update({ is_active }).eq("id", id);
      if (prodErr) throw new Error(prodErr.message);
      
      // Also update variants and colors to match product visibility
      const { error: colorErr } = await supabase.from("product_colors").update({ is_active }).eq("product_id", id);
      if (colorErr) throw new Error(colorErr.message);
      
      const { error: varErr } = await supabase.from("product_variants").update({ is_active }).eq("product_ref_id", id);
      if (varErr) throw new Error(varErr.message);
    } else if (type === "category") {
      // Since product_categories doesn't have is_active, we toggle visibility by updating all products in it
      const { data: products } = await supabase.from("catalog_products").select("id").eq("category_id", id);
      if (products && products.length > 0) {
        const productIds = products.map(p => p.id);
        
        const { error: prodErr } = await supabase.from("catalog_products").update({ is_active }).in("id", productIds);
        if (prodErr) throw new Error(prodErr.message);
        
        await supabase.from("product_colors").update({ is_active }).in("product_id", productIds);
        await supabase.from("product_variants").update({ is_active }).in("product_ref_id", productIds);
      }
    } else {
      return jsonError("Invalid type for visibility toggle.");
    }

    const data = await getCatalog(supabase);
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    if (error.message === "Unauthorized") return jsonError(error.message, 401);
    return jsonError(error.message || "Failed to update visibility.", 500);
  }
}
