import { getSupabaseAdmin, hasSupabaseAdminEnv } from "@/lib/supabase/server";

export const revalidate = 3600; // revalidate at most every hour

export default async function sitemap() {
  const baseUrl = "https://inkphyous.com";

  // Static routes
  const routes = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/contact-us`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/legal`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  if (hasSupabaseAdminEnv()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data: products } = await supabase
        .from("catalog_products")
        .select("id, updated_at")
        .eq("is_active", true);

      if (products) {
        const productRoutes = products.map((product) => ({
          url: `${baseUrl}/?productId=${product.id}`,
          lastModified: new Date(product.updated_at || new Date()),
          changeFrequency: "weekly",
          priority: 0.8,
        }));
        routes.push(...productRoutes);
      }

      // Also fetch all specific variants (colors)
      const { data: variants } = await supabase
        .from("product_variants")
        .select("id:product_id, product_ref_id, updated_at")
        .eq("is_active", true);

      if (variants) {
        const variantRoutes = variants.map((variant) => ({
          url: `${baseUrl}/?productId=${variant.product_ref_id}&variantId=${variant.id}`,
          lastModified: new Date(variant.updated_at || new Date()),
          changeFrequency: "weekly",
          priority: 0.7,
        }));
        routes.push(...variantRoutes);
      }
    } catch (e) {
      console.error("Failed to fetch products for sitemap", e);
    }
  }

  return routes;
}
