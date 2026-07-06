import HomeClient from "./HomeClient";
import { getSupabaseAdmin, hasSupabaseAdminEnv } from "@/lib/supabase/server";

// Helper to fetch a single product from Supabase
async function getProductBySlugOrId(productId) {
  if (!hasSupabaseAdminEnv() || !productId) return null;
  const supabase = getSupabaseAdmin();
  
  // productId is technically variant_product_id in cart/wishlist, but the URL param usually passes the product id or variant id.
  // Actually, wait. The URL param `productId` is usually the `catalog_products.id` OR `catalog_products.slug`.
  // Let's check how the URL is constructed in the app. The URL uses `?productId=...`.
  // If it's a UUID, we query by id. If it's a string, we query by slug.
  let query = supabase.from("catalog_products").select("*").eq("is_active", true);
  
  // Simple UUID check
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
  if (isUUID) {
    query = query.eq("id", productId);
  } else {
    // If not UUID, it might be slug
    query = query.eq("slug", productId);
  }

  const { data, error } = await query.single();
  if (error || !data) {
    // Fallback: check if they passed a variant id directly
    const { data: variantData } = await supabase
      .from("product_variants")
      .select("product_ref_id")
      .eq("product_id", productId)
      .single();
      
    if (variantData && variantData.product_ref_id) {
       const { data: realProduct } = await supabase
        .from("catalog_products")
        .select("*")
        .eq("id", variantData.product_ref_id)
        .single();
       return realProduct;
    }
    return null;
  }
  
  return data;
}

export async function generateMetadata({ searchParams }) {
  // Await searchParams in Next.js 15
  const params = await searchParams;
  const productId = params?.productId;

  if (productId) {
    const product = await getProductBySlugOrId(productId);
    
    if (product) {
      const title = `${product.name} | INKPHYOUS`;
      const description = (product.description || product.summary || "Premium streetwear").substring(0, 150);
      const url = `https://inkphyous.com/?productId=${productId}`;

      return {
        title,
        description,
        alternates: {
          canonical: url,
        },
        openGraph: {
          title,
          description,
          url,
          siteName: 'INKPHYOUS',
          images: product.main_image_url ? [
            {
              url: product.main_image_url,
              width: 800,
              height: 800,
              alt: `${product.name} - oversized streetwear by INKPHYOUS`,
            }
          ] : [],
          locale: 'en_US',
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: product.main_image_url ? [product.main_image_url] : [],
        },
      };
    } else {
      return {
        title: "Product Not Found | INKPHYOUS",
        description: "The requested product could not be found.",
      };
    }
  }

  return {}; // Use default metadata from layout.jsx
}

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const productId = params?.productId;
  let product = null;

  if (productId) {
    product = await getProductBySlugOrId(productId);
  }

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "INKPHYOUS",
    "url": "https://inkphyous.com",
    "logo": "https://inkphyous.com/logo.png"
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "INKPHYOUS",
    "url": "https://inkphyous.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://inkphyous.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  let productJsonLd = null;
  if (product) {
    productJsonLd = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": product.main_image_url ? [product.main_image_url] : [],
      "description": product.description || product.summary,
      "sku": product.id,
      "brand": {
        "@type": "Brand",
        "name": "INKPHYOUS"
      },
      "url": `https://inkphyous.com/?productId=${productId}`,
      "offers": {
        "@type": "Offer",
        "url": `https://inkphyous.com/?productId=${productId}`,
        "priceCurrency": "INR",
        "price": product.discount_price_inr || product.price_inr,
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition"
      }
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      <HomeClient />
    </>
  );
}
