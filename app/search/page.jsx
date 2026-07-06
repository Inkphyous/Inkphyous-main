import { getSupabaseAdmin, hasSupabaseAdminEnv } from "@/lib/supabase/server";
import { GET as getProducts } from "@/app/api/products/route";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image"; // Note: Inkphyous codebase usually uses standard <img /> but let's stick to standard HTML img if that's what's used everywhere. Let's use <img> for consistency.

export const metadata = {
  title: "Search Results | INKPHYOUS",
  description: "Search the INKPHYOUS premium streetwear catalog.",
};

export default async function SearchPage({ searchParams }) {
  // Await searchParams in Next.js 15
  const params = await searchParams;
  const query = params?.q || "";

  let products = [];
  let errorMsg = null;

  if (query.trim()) {
    try {
      const res = await getProducts();
      const data = await res.json();
      const allProducts = data.products || [];
      
      const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
      
      let matchedResults = [];

      allProducts.forEach(p => {
        const pText = `${p.name || ''} ${p.description || ''} ${p.category || ''}`.toLowerCase();
        let matchedVariants = [];

        p.variants?.forEach(v => {
           const vText = `${pText} ${v.name || ''} ${v.color || ''} ${v.semiDescription || ''} ${v.sku || ''}`.toLowerCase();
           
           // Does this variant match ALL search terms?
           const vMatchesAll = tokens.every(token => vText.includes(token));
           
           if (vMatchesAll) {
              // Did it match specifically because of its color or SKU?
              const matchesSpecifics = tokens.some(token => 
                (v.color?.toLowerCase().includes(token)) || 
                (v.sku?.toLowerCase().includes(token))
              );
              
              if (matchesSpecifics) {
                 matchedVariants.push(v);
              }
           }
        });

        const pMatchesAll = tokens.every(token => pText.includes(token));

        if (matchedVariants.length > 0) {
           // Show the specific matched variants
           matchedVariants.forEach(v => {
              matchedResults.push({
                 id: v.id || `${p.id}-${v.color}`,
                 linkHref: `/?productId=${p.id}&variantId=${v.id}`,
                 displayImage: v.mainImage || p.mainImage || p.main_image_url || p.variants?.[0]?.mainImage || "/logo.png",
                 displayName: v.name || `${p.name} - ${v.color}`,
                 displayCategory: p.category,
                 displayPrice: v.discountPriceINR || p.discountPriceINR || p.discount_price_inr || v.priceINR || p.priceINR || p.price_inr,
                 displayOldPrice: v.priceINR || p.priceINR || p.price_inr,
              });
           });
        } else if (pMatchesAll) {
           // Show the parent product
           matchedResults.push({
              id: p.id,
              linkHref: `/?productId=${p.id}`,
              displayImage: p.mainImage || p.main_image_url || p.variants?.[0]?.mainImage || "/logo.png",
              displayName: p.name,
              displayCategory: p.category,
              displayPrice: p.discountPriceINR || p.discount_price_inr || p.priceINR || p.price_inr,
              displayOldPrice: p.priceINR || p.price_inr,
           });
        }
      });
      
      products = matchedResults;
      
    } catch (err) {
      console.error("Search error:", err);
      errorMsg = "An error occurred while searching. Please try again.";
    }
  }

  return (
    <>
      <Header />
      <main style={{ minHeight: "70vh", paddingTop: "100px", paddingBottom: "40px", backgroundColor: "#fff", color: "#111" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px", fontFamily: "'Fraunces', serif" }}>
            Search Results
          </h1>
          {query ? (
            <p style={{ color: "#666", marginBottom: "32px", fontSize: "14px" }}>
              Showing results for &quot;<strong>{query}</strong>&quot;
            </p>
          ) : (
            <p style={{ color: "#666", marginBottom: "32px", fontSize: "14px" }}>
              Please enter a search term above.
            </p>
          )}

          {errorMsg && (
            <p style={{ color: "#e11d48", backgroundColor: "#ffe4e6", padding: "12px", borderRadius: "8px" }}>
              {errorMsg}
            </p>
          )}

          {!errorMsg && query && products.length === 0 && (
            <div style={{ textAlign: "center", padding: "64px 0", borderTop: "1px solid #eaeaea" }}>
              <p style={{ fontSize: "18px", color: "#666", marginBottom: "16px" }}>No products found for &apos;{query}&apos;</p>
              <Link href="/" style={{ display: "inline-block", padding: "10px 24px", backgroundColor: "#111", color: "#fff", textDecoration: "none", borderRadius: "24px", fontSize: "14px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "1px" }}>
                Back to Shop
              </Link>
            </div>
          )}

          {!errorMsg && products.length > 0 && (
            <div className="grid-view" style={{ background: "transparent", minHeight: "auto", padding: 0 }}>
              <div className="grid-view__grid" style={{ paddingTop: 0 }}>
                {products.map((product) => (
                  <Link 
                    key={product.id} 
                    href={product.linkHref}
                    className="grid-view__item"
                    style={{ textDecoration: "none" }}
                  >
                    <div className="grid-view__image-container">
                      <img 
                        src={product.displayImage} 
                        alt={`${product.displayName} - ${product.displayCategory || 'Apparel'} by INKPHYOUS`}
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="grid-view__image-overlay">
                        <span className="grid-view__brand">INKPHYOUS</span>
                        <span className="grid-view__price">₹{product.displayPrice}</span>
                      </div>
                    </div>
                    <div className="grid-view__details-card">
                      <div className="grid-view__mobile-brand-price">
                        <span className="grid-view__brand">INKPHYOUS</span>
                        <span className="grid-view__price">
                          ₹{product.displayPrice}
                          {product.displayPrice && product.displayOldPrice > product.displayPrice && (
                            <span style={{ color: "#999", textDecoration: "line-through", fontSize: "13px", marginLeft: "6px" }}>₹{product.displayOldPrice}</span>
                          )}
                        </span>
                      </div>
                      <span className="grid-view__name">{product.displayName}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
