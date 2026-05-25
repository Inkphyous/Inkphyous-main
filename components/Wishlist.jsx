"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useStore } from "./providers/StoreProvider";

export default function Wishlist() {
  const router = useRouter();
  const {
    wishlistItems,
    removeFromWishlist,
    addToCart,
    products,
    user,
    authLoading,
    requireAuth,
    t,
    language,
  } = useStore();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      requireAuth("Login to continue");
      router.push("/");
    }
  }, [authLoading, requireAuth, router, user]);

  const handleMoveToCart = async (item) => {
    const product = products.find((p) => (p.variants || []).some((v) => v.id === item.productId));
    const variant = product?.variants?.find((v) => v.id === item.productId);
    if (!product || !variant) return;

    const sizes = (variant.sizes || []).filter((s) => s.inStock);
    if (sizes.length === 1) {
      const added = await addToCart({
        id: variant.id,
        name: product.name,
        image: variant.mainImage || variant.image,
        color: variant.color,
        size: sizes[0].size,
        priceINR: product.priceINR,
        discountPriceINR: product.discountPriceINR,
        quantity: 1,
      });
      if (added) await removeFromWishlist(variant.id);
      return;
    }

    router.push(`/?variantId=${encodeURIComponent(variant.id)}`);
  };

  if (!wishlistItems.length) {
    return (
      <div className="cart-page">
        <div className="cart-page__bg" />
        <button onClick={() => router.back()} className="cart-back-btn shared-back-btn">
          <ArrowLeft size={16} strokeWidth={2} />
          <span>{t("back")}</span>
        </button>
        <div className="cart-empty">
          <h1 className="cart-empty__title">WISHLIST</h1>
          <p className="cart-empty__text">No wishlisted products yet.</p>
          <button onClick={() => router.push("/")} className="cart-empty__cta">
            {t("continueShopping").toUpperCase()}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-page__bg" />
      <button onClick={() => router.back()} className="cart-back-btn shared-back-btn">
        <ArrowLeft size={16} strokeWidth={2} />
        <span>{t("back")}</span>
      </button>

      <div className="cart-layout">
        <div className="cart-selections" style={{ borderRight: "none", paddingRight: 0 }}>
          <div className="cart-selections__header">
            <h2 className="cart-selections__title">WISHLIST</h2>
          </div>
          <div className="cart-selections__divider" />

          <div className="cart-selections__list">
            {wishlistItems.map((item) => {
              const product = products.find((p) => (p.variants || []).some((v) => v.id === item.productId));
              const variant = product?.variants?.find((v) => v.id === item.productId);
              const price = variant?.priceINR || product?.priceINR || item.priceINR || 0;
              
              return (
                <div key={item.productId} className="cart-item">
                  <button
                    className="cart-item__image"
                    onClick={() => router.push(`/?variantId=${encodeURIComponent(item.productId)}`)}
                  >
                    <img src={item.imageUrl || item.image} alt={item.name} />
                  </button>
                  <div className="cart-item__details">
                    <button
                      className="cart-item__name"
                      style={{ textAlign: "left", background: "transparent", border: "none", padding: 0 }}
                      onClick={() => router.push(`/?variantId=${encodeURIComponent(item.productId)}`)}
                    >
                      {language === "ar" && item.nameAr ? item.nameAr : item.name}
                    </button>
                    <p className="cart-item__meta">Style# {item.productId}</p>
                    <p className="cart-item__meta">Color: <strong>{item.color}</strong></p>
                    <div className="cart-item__actions">
                      <button className="cart-item__action-link" onClick={() => handleMoveToCart(item)}>
                        Move to Cart
                      </button>
                      <span className="cart-item__action-divider">|</span>
                      <button
                        className="cart-item__action-link"
                        onClick={() => removeFromWishlist(item.productId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="cart-item__price">₹{price}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

