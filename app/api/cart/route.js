import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseAdminEnv } from "@/lib/supabase/server";

function jsonError(message, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function buildCartResponse(supabase, userId) {
  const { data: cartRows, error: cartError } = await supabase
    .from("cart_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (cartError) throw new Error(cartError.message);
  if (!cartRows?.length) return [];

  const variantIds = [...new Set(cartRows.map((item) => item.product_id).filter(Boolean))];

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

  return cartRows
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
        name: color?.variant_name || product?.name || "Product",
        nameAr: product?.name_ar || null,
        brand: product?.brand || "Inkphyous",
        color: color?.color_name || variant.color_name || "Default",
        size: row.size,
        quantity: Number(row.quantity || 1),
        image: variant.main_image_url,
        imageUrl: variant.main_image_url,
        priceINR: Number(variant.price_inr ?? product?.price_inr ?? 0),
        discountPriceINR: Number(
          variant.discount_price_inr ?? product?.discount_price_inr ?? variant.price_inr ?? 0
        ),
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
    const cart = await buildCartResponse(supabase, userId);

    return NextResponse.json({ success: true, items: cart });
  } catch (error) {
    return jsonError(error.message || "Failed to load cart.", 500);
  }
}

export async function POST(request) {
  if (!hasSupabaseAdminEnv()) {
    return jsonError("Supabase env vars are not configured.", 500);
  }

  const body = await request.json();
  const userId = body?.userId;
  const productId = body?.productId;
  const size = body?.size;
  const quantityToAdd = Number(body?.quantity || 1);

  if (!userId || !productId || !size) {
    return jsonError("userId, productId, and size are required.");
  }

  if (!Number.isFinite(quantityToAdd) || quantityToAdd <= 0) {
    return jsonError("Quantity must be a positive number.");
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: existingRow, error: existingError } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .eq("size", size)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);

    if (existingRow) {
      const { error: updateError } = await supabase
        .from("cart_items")
        .update({
          quantity: Number(existingRow.quantity || 1) + quantityToAdd,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRow.id);

      if (updateError) throw new Error(updateError.message);
    } else {
      const { error: insertError } = await supabase.from("cart_items").insert({
        user_id: userId,
        product_id: productId,
        size,
        quantity: quantityToAdd,
      });
      if (insertError) throw new Error(insertError.message);
    }

    const items = await buildCartResponse(supabase, userId);
    return NextResponse.json({ success: true, items });
  } catch (error) {
    return jsonError(error.message || "Failed to add item to cart.", 500);
  }
}

export async function PATCH(request) {
  if (!hasSupabaseAdminEnv()) {
    return jsonError("Supabase env vars are not configured.", 500);
  }

  const body = await request.json();
  const userId = body?.userId;
  const cartItemId = body?.cartItemId;
  const quantity = body?.quantity !== undefined ? Number(body.quantity) : undefined;
  const newProductId = body?.productId;
  const newSize = body?.size;

  if (!userId || !cartItemId) return jsonError("userId and cartItemId are required.");

  try {
    const supabase = getSupabaseAdmin();

    const { data: currentItem, error: fetchError } = await supabase
      .from("cart_items")
      .select("*")
      .eq("id", cartItemId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) throw new Error(fetchError.message);
    if (!currentItem) throw new Error("Cart item not found");

    const finalQuantity = quantity !== undefined ? quantity : currentItem.quantity;
    const finalProductId = newProductId || currentItem.product_id;
    const finalSize = newSize || currentItem.size;

    if (finalQuantity <= 0) {
      const { error: deleteError } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", cartItemId)
        .eq("user_id", userId);
      if (deleteError) throw new Error(deleteError.message);
    } else {
      if (newProductId || newSize) {
        const { data: existingTarget } = await supabase
          .from("cart_items")
          .select("*")
          .eq("user_id", userId)
          .eq("product_id", finalProductId)
          .eq("size", finalSize)
          .neq("id", cartItemId)
          .maybeSingle();

        if (existingTarget) {
          const { error: mergeError } = await supabase
            .from("cart_items")
            .update({
              quantity: existingTarget.quantity + finalQuantity,
              updated_at: new Date().toISOString()
            })
            .eq("id", existingTarget.id);
          if (mergeError) throw new Error(mergeError.message);

          const { error: delError } = await supabase
            .from("cart_items")
            .delete()
            .eq("id", cartItemId);
          if (delError) throw new Error(delError.message);
        } else {
          const { error: updateError } = await supabase
            .from("cart_items")
            .update({
              quantity: finalQuantity,
              product_id: finalProductId,
              size: finalSize,
              updated_at: new Date().toISOString()
            })
            .eq("id", cartItemId);
          if (updateError) throw new Error(updateError.message);
        }
      } else {
        const { error: updateError } = await supabase
          .from("cart_items")
          .update({ quantity: finalQuantity, updated_at: new Date().toISOString() })
          .eq("id", cartItemId)
          .eq("user_id", userId);
        if (updateError) throw new Error(updateError.message);
      }
    }

    const items = await buildCartResponse(supabase, userId);
    return NextResponse.json({ success: true, items });
  } catch (error) {
    return jsonError(error.message || "Failed to update cart item.", 500);
  }
}

export async function DELETE(request) {
  if (!hasSupabaseAdminEnv()) {
    return jsonError("Supabase env vars are not configured.", 500);
  }

  const body = await request.json();
  const userId = body?.userId;
  const cartItemId = body?.cartItemId;

  if (!userId || !cartItemId) return jsonError("userId and cartItemId are required.");

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    const items = await buildCartResponse(supabase, userId);
    return NextResponse.json({ success: true, items });
  } catch (error) {
    return jsonError(error.message || "Failed to remove cart item.", 500);
  }
}
