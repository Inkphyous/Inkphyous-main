"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "./providers/StoreProvider";
import { ArrowLeft, Printer, Heart, Plus, X, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";

const Cart = () => {
  const router = useRouter();
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    editCartItem,
    cartTotal,
    t,
    language,
    user,
    authLoading,
    requireAuth,
    toggleWishlist,
    isWishlisted,
    products,
    cartLoading,
  } = useStore();
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      requireAuth("Login to continue");
      router.push("/");
    }
  }, [authLoading, requireAuth, router, user]);

  const handleSaveToWishlist = async (item, index) => {
    if (!isWishlisted(item.id)) {
      await toggleWishlist(item.id);
    }
    await removeFromCart(index);
  };

  const handleEditClick = (item, index) => {
    const product = products.find(p => (p.variants || []).some(v => v.id === item.id));
    if (!product) return;
    const variant = product.variants.find(v => v.id === item.id);
    
    setEditingItem({
      item,
      index,
      product,
      selectedVariant: variant,
      selectedSize: item.size
    });
  };

  // Generate a fake order ID
  const orderId = cartItems.length > 0
    ? `INKCART${Date.now().toString().slice(-10)}`
    : "";

  // Calculate VAT (assuming 5% VAT)
  // VAT removed per request

  if (authLoading || cartLoading) {
    return (
      <div className="cart-page">
        <div className="cart-page__bg" />
        <div className="address-page__loading">Loading...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-page__bg" />
        <button
          onClick={() => router.back()}
          className="cart-back-btn shared-back-btn"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          <span>{t("back")}</span>
        </button>

        <div className="cart-empty">
          <h1 className="cart-empty__title">{t("yourSelections").toUpperCase()}</h1>
          <p className="cart-empty__text">
            {t("emptyBagMessage")}
          </p>
          <button
            onClick={() => router.push("/")}
            className="cart-empty__cta"
          >
            {t("continueShopping").toUpperCase()}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-page__bg" />
      <button
        onClick={() => router.back()}
        className="cart-back-btn shared-back-btn"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        <span>{t("back")}</span>
      </button>

      <div className="cart-layout">
        {/* Left — YOUR SELECTIONS */}
        <div className="cart-selections">
          <div className="cart-selections__header">
            <h2 className="cart-selections__title">{t("yourSelections").toUpperCase()}</h2>
            <button className="cart-selections__print" onClick={() => window.print()}>
              <Printer size={14} strokeWidth={2} />
              <span>{t("print")}</span>
            </button>
          </div>

          <div className="cart-selections__divider" />

          <div className="cart-selections__list">
            {cartItems.map((item, index) => (
              <div key={index} className="cart-item">
                {/* Product Image */}
                <button
                  className="cart-item__image"
                    onClick={() => router.push(`/?productId=${item.productRefId}&variantId=${encodeURIComponent(item.id)}`)}
                >
                  <img src={item.image} alt={item.name} />
                </button>

                {/* Product Details */}
                <div className="cart-item__details">
                  <button
                    className="cart-item__name"
                      onClick={() => router.push(`/?productId=${item.productRefId}&variantId=${encodeURIComponent(item.id)}`)}
                    style={{ textAlign: "left", background: "transparent", border: "none", padding: 0 }}
                  >
                    {language === "ar" && item.nameAr ? item.nameAr : item.name}
                  </button>
                  <p className="cart-item__meta">
                    {t("style")}# {item.id}
                  </p>
                  {item.color && (
                    <p className="cart-item__meta">
                      {t("color")}: <strong>{item.color}</strong>
                    </p>
                  )}
                  {item.size && (
                    <p className="cart-item__meta">
                      {t("size")}: <strong>{item.size}</strong>
                    </p>
                  )}

                  {/* Actions row */}
                  <div className="cart-item__actions">
                    <button 
                      className="cart-item__action-link"
                      onClick={() => handleEditClick(item, index)}
                    >
                      {t("edit")}
                    </button>
                    <span className="cart-item__action-divider">|</span>
                    <button
                      className="cart-item__action-link"
                      onClick={() => removeFromCart(index)}
                    >
                      {t("remove")}
                    </button>
                    <span className="cart-item__action-divider">|</span>
                    <button 
                      className="cart-item__action-link cart-item__action-link--save"
                      onClick={() => handleSaveToWishlist(item, index)}
                    >
                      <Heart size={12} strokeWidth={2} />
                      {t("savedItems")}
                    </button>
                  </div>
                </div>

                {/* QTY Dropdown */}
                <div className="cart-item__qty">
                  <div className="cart-item__qty-select">
                    <span className="cart-item__qty-label">{t("qty")}: {item.quantity || 1}</span>
                    <ChevronDown size={14} style={{ marginLeft: "8px", color: "#666" }} />
                    <select
                      value={item.quantity || 1}
                      onChange={(e) => updateQuantity(index, parseInt(e.target.value))}
                      className="cart-item__qty-dropdown"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price */}
                <div className="cart-item__price">
                  ₹{((item.discountPriceINR || item.priceINR) * (item.quantity || 1)).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — ORDER SUMMARY */}
        <div className="cart-summary">
          <div className="cart-summary__inner">
            <h3 className="cart-summary__title">{t("orderSummary").toUpperCase()}</h3>
            <p className="cart-summary__order-id">{orderId}</p>

            <div className="cart-summary__divider" />

            <div className="cart-summary__row">
              <span>{t("subtotal")}</span>
              <span>₹{cartTotal.toLocaleString()}</span>
            </div>

            <div className="cart-summary__row">
              <span>{t("shipping")}</span>
              <span 
                className="cart-summary__shipping-free" 
                style={{ cursor: "pointer", textDecoration: "underline" }}
                onClick={() => router.push("/legal/shipping")}
              >
                View Shipping Policy
              </span>
            </div>

            <div className="cart-summary__divider" />

            <div className="cart-summary__row cart-summary__row--total">
              <span>{t("total").toUpperCase()}</span>
              <span>₹{cartTotal.toLocaleString()}</span>
            </div>



            <div className="cart-summary__divider" />

            {/* VIEW DETAILS collapsible */}
            <button
              className="cart-summary__view-details"
              onClick={() => setViewDetailsOpen(!viewDetailsOpen)}
            >
              <span>{t("details").toUpperCase()}</span>
              <Plus
                size={14}
                strokeWidth={2}
                style={{
                  transform: viewDetailsOpen ? "rotate(45deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>

            {viewDetailsOpen && (
              <div className="cart-summary__details-content">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="cart-summary__detail-row">
                    <span>{language === "ar" && item.nameAr ? item.nameAr : item.name} × {item.quantity || 1}</span>
                    <span>₹{((item.discountPriceINR || item.priceINR) * (item.quantity || 1)).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="cart-summary__divider" />

            {/* <p className="cart-summary__disclaimer">
              You will be charged only at the time of shipment except for DIY orders where the <em>full amount</em> is charged at the time of purchase.
            </p> */}

            <button
              className="cart-summary__checkout"
              onClick={() => router.push("/checkout/address")}
            >
              {t("checkout").toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {editingItem && (
        <div className="cart-edit-modal">
          <div className="cart-edit-modal__overlay" onClick={() => setEditingItem(null)} />
          <div className="cart-edit-modal__content">
            <div className="cart-edit-modal__header">
              <h3>{t("edit")} {editingItem.item.name}</h3>
              <button onClick={() => setEditingItem(null)}><X size={20} /></button>
            </div>
            
            <div className="pdp-overlay__color-wrapper" style={{ marginTop: '10px' }}>
              <p className="pdp-overlay__section-title" style={{ fontSize: '12px', marginBottom: '8px', opacity: 0.8 }}>{t("color")}</p>
              <div className="pdp-overlay__colors" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {editingItem.product.availableColors?.map((colorName) => {
                  const variant = editingItem.product.variants.find(v => String(v.color).toLowerCase() === String(colorName).toLowerCase());
                  if (!variant) return null;
                  const isActive = editingItem.selectedVariant.id === variant.id;
                  return (
                    <button 
                      key={colorName} 
                      className={`pdp-overlay__color ${isActive ? "pdp-overlay__color--active" : ""}`}
                      style={{ backgroundColor: variant.colorHex || "#ccc" }} 
                      onClick={() => setEditingItem(prev => ({...prev, selectedVariant: variant, selectedSize: null }))} 
                      title={colorName}
                    />
                  );
                })}
              </div>
            </div>

            <div className="pdp-overlay__size-wrapper" style={{ marginTop: '15px' }}>
              <p className="pdp-overlay__section-title" style={{ fontSize: '12px', marginBottom: '8px', opacity: 0.8 }}>{t("size")}</p>
              <div className="pdp-overlay__sizes" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(() => {
                  const variant = editingItem.selectedVariant;
                  let sizes = variant.sizes || [];
                  if (!sizes.length && editingItem.product.details?.migrated_sizes) {
                    sizes = [];
                  } else if (!sizes.length && editingItem.product.details?.variant_sizes) {
                    sizes = editingItem.product.details.variant_sizes[variant.color] || [];
                  }
                  if (!sizes.length && !editingItem.product.details?.migrated_sizes) {
                    sizes = (editingItem.product.sizeOptions || []).map(s => ({ size: s, inStock: true }));
                  }
                  return sizes.map(s => (
                    <button 
                      key={s.size} 
                      className={`pdp-overlay__size-btn ${editingItem.selectedSize === s.size ? "pdp-overlay__size-btn--active" : ""} ${!s.inStock ? "pdp-overlay__size-btn--out" : ""}`}
                      onClick={() => s.inStock && setEditingItem(prev => ({...prev, selectedSize: s.size}))}
                    >
                      {s.size}
                    </button>
                  ));
                })()}
              </div>
            </div>

            <motion.button 
              className="cart-edit-modal__save" 
              disabled={!editingItem.selectedSize}
              whileTap={!editingItem.selectedSize ? {} : { scale: 0.97, backgroundColor: "#e11d48", borderColor: "#e11d48", color: "#fff" }}
              onClick={async () => {
                await editCartItem(editingItem.item.cartItemId, editingItem.selectedVariant.id, editingItem.selectedSize);
                setEditingItem(null);
              }}
            >
              {t("Save changes") || "Save Changes"}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
