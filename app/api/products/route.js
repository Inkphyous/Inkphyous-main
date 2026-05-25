import { NextResponse } from "next/server";
import {
  buildProductsFromLocal,
  composeProductsFromCatalogRows,
} from "@/lib/catalog/composeProducts";
import { getSupabaseAdmin, hasSupabaseAdminEnv } from "@/lib/supabase/server";

function localResponse(reason) {
  return NextResponse.json({
    success: true,
    source: "local-fallback",
    reason,
    products: buildProductsFromLocal(),
  });
}

export async function GET() {
  if (!hasSupabaseAdminEnv()) {
    return localResponse("Supabase env vars are not configured.");
  }

  try {
    const supabase = getSupabaseAdmin();

    const [categoriesResult, productsResult, colorsResult, variantsResult, imagesResult] =
      await Promise.all([
        supabase
          .from("product_categories")
          .select("*")
          .order("position", { ascending: true }),
        supabase
          .from("catalog_products")
          .select("*")
          .eq("is_active", true)
          .order("position", { ascending: true }),
        supabase
          .from("product_colors")
          .select("*")
          .eq("is_active", true)
          .order("position", { ascending: true }),
        supabase
          .from("product_variants")
          .select("*")
          .eq("is_active", true)
          .order("position", { ascending: true }),
        supabase
          .from("product_variant_images")
          .select("variant_product_id,image_url,position,is_active")
          .eq("is_active", true)
          .order("position", { ascending: true }),
      ]);

    let sizesResult = { data: [], error: null };
    try {
      sizesResult = await supabase
        .from("product_variant_sizes")
        .select("variant_product_id,size,in_stock,position")
        .order("position", { ascending: true });
    } catch {
      sizesResult = { data: [], error: null };
    }

    const errors = [
      categoriesResult.error,
      productsResult.error,
      colorsResult.error,
      variantsResult.error,
      imagesResult.error,
    ].filter(Boolean);

    if (errors.length) {
      return localResponse(
        errors.map((err) => err.message).join(" | ") || "Failed to load catalog rows."
      );
    }

    const composedProducts = composeProductsFromCatalogRows({
      categories: categoriesResult.data || [],
      products: productsResult.data || [],
      colors: colorsResult.data || [],
      variants: variantsResult.data || [],
      variantImages: imagesResult.data || [],
      variantSizes: sizesResult.data || [],
    });

    if (!composedProducts.length) {
      return localResponse("Supabase catalog is empty.");
    }

    return NextResponse.json({
      success: true,
      source: "supabase",
      products: composedProducts,
    });
  } catch (error) {
    return localResponse(error?.message || "Unexpected products API error.");
  }
}
