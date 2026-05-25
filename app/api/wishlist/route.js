import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseAdminEnv } from "@/lib/supabase/server";

function jsonError(message, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

async function buildWishlistResponse(supabase, userId) {
  const { data: wishlistRows, error: wishlistError } = await supabase
    .from("wishlist_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (wishlistError) throw new Error(wishlistError.message);
  if (!wishlistRows?.length) return [];

  const variantIds = [...new Set(wishlistRows.map((item) => item.product_id).filter(Boolean))];

  const { data: variants, error: variantsError } = await supabase
    .from("product_variants")
    .select("*")
    .in("product_id", variantIds);
  if (variantsError) throw new Error(variantsError.message);

  const productRefIds = [
    ...new Set((variants || []).map((variant) => variant.product_ref_id).filter(Boolean)),
  ];
  const colorRefIds = [
    ...new Set((variants || []).map((variant) => variant.color_ref_id).filter(Boolean)),
  ];

  const [productsResult, colorsResult] = await Promise.all([
    productRefIds.length
      ? supabase.from("catalog_products").select("*").in("id", productRefIds)
      : Promise.resolve({ data: [], error: null }),
    colorRefIds.length
      ? supabase.from("product_colors").select("*").in("id", colorRefIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (productsResult.error) throw new Error(productsResult.error.message);
  if (colorsResult.error) throw new Error(colorsResult.error.message);

  const variantById = new Map((variants || []).map((variant) => [variant.product_id, variant]));
  const productById = new Map((productsResult.data || []).map((product) => [product.id, product]));
  const colorById = new Map((colorsResult.data || []).map((color) => [color.id, color]));

  return wishlistRows
    .map((row) => {
      const variant = variantById.get(row.product_id);
      if (!variant) return null;

      const product = productById.get(variant.product_ref_id);
      const color = colorById.get(variant.color_ref_id);

      return {
        id: row.id,
        userId: row.user_id,
        productId: row.product_id,
        productRefId: variant.product_ref_id,
        name: product?.name || "Product",
        nameAr: product?.name_ar || null,
        color: color?.color_name || variant.color_name || "Default",
        image: variant.main_image_url,
        imageUrl: variant.main_image_url,
      };
    })
    .filter(Boolean);
}

export async function GET(request) {
  if (!hasSupabaseAdminEnv()) {
    return jsonError("Supabase env vars are not configured.", 500);
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) return jsonError("Missing userId.");

  try {
    const supabase = getSupabaseAdmin();
    const items = await buildWishlistResponse(supabase, userId);
    return NextResponse.json({ success: true, items });
  } catch (error) {
    return jsonError(error.message || "Failed to load wishlist.", 500);
  }
}

export async function POST(request) {
  if (!hasSupabaseAdminEnv()) {
    return jsonError("Supabase env vars are not configured.", 500);
  }

  const body = await request.json();
  const userId = body?.userId;
  const productId = body?.productId;

  if (!userId || !productId) return jsonError("userId and productId are required.");

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("wishlist_items").upsert(
      {
        user_id: userId,
        product_id: productId,
      },
      { onConflict: "user_id,product_id" }
    );
    if (error) throw new Error(error.message);

    const items = await buildWishlistResponse(supabase, userId);
    return NextResponse.json({ success: true, items });
  } catch (error) {
    return jsonError(error.message || "Failed to add wishlist item.", 500);
  }
}

export async function DELETE(request) {
  if (!hasSupabaseAdminEnv()) {
    return jsonError("Supabase env vars are not configured.", 500);
  }

  const body = await request.json();
  const userId = body?.userId;
  const productId = body?.productId;

  if (!userId || !productId) return jsonError("userId and productId are required.");

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);

    if (error) throw new Error(error.message);

    const items = await buildWishlistResponse(supabase, userId);
    return NextResponse.json({ success: true, items });
  } catch (error) {
    return jsonError(error.message || "Failed to remove wishlist item.", 500);
  }
}
