import localProducts from "@/lib/products";

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function composeProductsFromCatalogRows({
  categories = [],
  products = [],
  colors = [],
  variants = [],
  variantImages = [],
  variantSizes = [],
}) {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const colorsByProduct = new Map();
  const variantsByProduct = new Map();
  const imagesByVariant = new Map();
  const sizesByVariant = new Map();

  for (const color of colors) {
    const bucket = colorsByProduct.get(color.product_id) || [];
    bucket.push(color);
    colorsByProduct.set(color.product_id, bucket);
  }

  for (const image of variantImages) {
    const bucket = imagesByVariant.get(image.variant_product_id) || [];
    bucket.push(image);
    imagesByVariant.set(image.variant_product_id, bucket);
  }

  for (const variant of variants) {
    const bucket = variantsByProduct.get(variant.product_ref_id) || [];
    bucket.push(variant);
    variantsByProduct.set(variant.product_ref_id, bucket);
  }

  for (const sizeRow of variantSizes) {
    const bucket = sizesByVariant.get(sizeRow.variant_product_id) || [];
    bucket.push(sizeRow);
    sizesByVariant.set(sizeRow.variant_product_id, bucket);
  }

  return products
    .map((product) => {
      const category = categoryById.get(product.category_id);
      const productColors = (colorsByProduct.get(product.id) || []).sort((a, b) =>
        (a.position ?? 0) - (b.position ?? 0)
      );
      const productVariants = (variantsByProduct.get(product.id) || []).sort((a, b) =>
        (a.position ?? 0) - (b.position ?? 0)
      );

      const colorById = new Map(productColors.map((c) => [c.id, c]));

      const mappedVariants = productVariants.map((variant) => {
        const mappedColor = colorById.get(variant.color_ref_id);
        const variantGalleryOrdered = (imagesByVariant.get(variant.product_id) || [])
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map((img) => img.image_url);
        const variantSizesRows = (sizesByVariant.get(variant.product_id) || []).sort(
          (a, b) => (a.position ?? 0) - (b.position ?? 0)
        );
        let variantSizesMapped = variantSizesRows.map((row) => ({
          size: row.size,
          inStock: Boolean(row.in_stock),
        }));

        const colorName = mappedColor?.color_name || variant.color_name || "Default";
        if (variantSizesMapped.length === 0 && product.details && typeof product.details === "object") {
           const fallbackSizes = product.details.variant_sizes?.[colorName] || [];
           if (fallbackSizes.length > 0) {
             variantSizesMapped = fallbackSizes;
           }
        }

        const mainImage = variant.main_image_url;
        const fullImages =
          variantGalleryOrdered.length > 0 ? variantGalleryOrdered : [mainImage];
        const galleryImages = fullImages.filter((img) => img !== mainImage);

        return {
          id: variant.product_id,
          name: mappedColor?.variant_name || product.name,
          description: mappedColor?.variant_description || product.description,
          color: mappedColor?.color_name || variant.color_name || "Default",
          colorHex: mappedColor?.color_hex || variant.color_hex || null,
          sku: variant.sku || null,
          priceINR: toNumber(variant.price_inr, toNumber(product.price_inr)),
          image: mainImage,
          mainImage,
          imageUrl: mainImage,
          images: fullImages,
          galleryImages,
          sizes: variantSizesMapped,
        };
      });

      const fallbackVariant = mappedVariants[0] || null;
      const availableColors = mappedVariants.map((v) => v.color);

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        nameAr: product.name_ar,
        brand: product.brand || "Inkphyous",
        category: category?.name || "Uncategorized",
        categorySlug: category?.slug || "uncategorized",
        subcategory: product.subcategory || "",
        image: fallbackVariant?.image || product.main_image_url || "",
        summary: product.summary || "",
        summaryAr: product.summary_ar || "",
        tagline: product.tagline || "",
        taglineAr: product.tagline_ar || "",
        description: product.description || "",
        descriptionAr: product.description_ar || "",
        priceINR: toNumber(product.price_inr, fallbackVariant?.priceINR || 0),
        discountPriceINR: toNumber(
          product.discount_price_inr,
          fallbackVariant?.priceINR || 0
        ),
        sizeOptions: Array.isArray(product.size_options) ? product.size_options : [],
        color: availableColors[0] || "Default",
        availableColors,
        details:
          product.details && typeof product.details === "object" ? product.details : {},
        detailsAr:
          product.details_ar && typeof product.details_ar === "object"
            ? product.details_ar
            : {},
        variants: mappedVariants,
        rating: toNumber(product.rating, 0),
        reviews: toNumber(product.reviews, 0),
      };
    })
    .filter((product) => product.variants.length > 0);
}

export function buildProductsFromLocal() {
  return localProducts.map((product) => ({
    ...product,
    slug:
      product.slug ||
      String(product.name || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    categorySlug:
      String(product.category || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "uncategorized",
    variants: (product.variants || []).map((variant) => ({
      ...variant,
      mainImage: variant.image,
      galleryImages: (variant.images || []).filter((img) => img !== variant.image),
      sizes: (product.sizeOptions || []).map((size, position) => ({
        size,
        inStock: true,
        position,
      })),
      imageUrl: variant.image,
    })),
  }));
}
