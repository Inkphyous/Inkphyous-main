"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Heart, ShoppingCart, ChevronDown, Share2 } from "lucide-react";
import { useStore } from "./providers/StoreProvider";

/*
 * MobilePDP — Pure content component (NO portal, NO overlay).
 * Rendered inside pdp-overlay by ProductDetail so transition is preserved.
 * Every style is inline — zero CSS file dependencies.
 */

function MobileAccordion({ title, content, isOpen, onClick }) {
  return (
    <div style={{ borderBottom: "1px solid #e5e5e5" }}>
      <button
        onClick={onClick}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 0",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-heading)",
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: "#000",
        }}
      >
        <span>{title}</span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                paddingBottom: "12px",
                fontSize: "12px",
                fontFamily: "var(--font-body)",
                color: "#555",
                lineHeight: 1.7,
              }}
            >
              {typeof content === "object" && content !== null ? (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {Object.entries(content).map(([key, val]) => {
                    if (typeof val === "object" || typeof val === "boolean" || !val)
                      return null;
                    return (
                      <li key={key} style={{ marginBottom: "4px" }}>
                        <strong style={{ textTransform: "capitalize" }}>
                          {key}:
                        </strong>{" "}
                        {val}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p style={{ margin: 0 }}>{content}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MobilePDP({
  product,
  variant,
  variantSizes,
  selectedSize,
  setSelectedSize,
  galleryImages,
  onAddToCart,
  onSetVariant,
  onLightbox,
  onNotify,
}) {
  const { isWishlisted, toggleWishlist, t, language } = useStore();
  const [activeAccordion, setActiveAccordion] = useState(null);
  const wishlisted = isWishlisted(variant.id);

  const isDisabled =
    !selectedSize ||
    !variantSizes.find((s) => s.size === selectedSize)?.inStock;

  return (
    <div style={{ width: "100%" }}>
      {/* Brand + Variant name */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <h1
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "28px",
              fontWeight: 800,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "var(--color-text)",
              margin: 0,
              lineHeight: 1,
            }}
          >
            {product.brand}
          </h1>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "18px",
              fontWeight: 800,
              color: "transparent",
              WebkitTextStroke: "1px #e11d48",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            {t(product.category.toLowerCase())}
          </span>
        </div>
        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "18px",
            fontWeight: 800,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: "var(--color-text)",
            margin: "6px 0 0 0",
          }}
        >
          {variant.name}
        </p>
      </div>

      {/* ---- PRICE ---- */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          width: "100%",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "28px",
            fontWeight: 700,
            color: "var(--color-text)",
            letterSpacing: "0.5px",
            lineHeight: 1,
          }}
        >
          ₹{product.discountPriceINR || product.priceINR}
        </div>
      </div>

      {/* ---- SWATCHES ---- */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          width: "100%",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "10px",
            alignItems: "center",
          }}
        >
          {product.variants.map((v) => (
            <div
              key={v.id}
              onClick={() => onSetVariant(v.id)}
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor:
                  v.colorHex || v.color?.toLowerCase() || "#ccc",
                border:
                  variant.id === v.id
                    ? "2px solid #000"
                    : "1.5px solid #ccc",
                cursor: "pointer",
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* ---- SIZES (right-aligned) ---- */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: "8px",
          justifyContent: "flex-end",
          width: "100%",
          marginBottom: "14px",
        }}
      >
        {variantSizes.map(({ size, inStock }) => (
          <div
            key={size}
            onClick={() => setSelectedSize(size)}
            style={{
              padding: "7px 14px",
              fontSize: "12px",
              borderRadius: "6px",
              cursor: "pointer",
              border:
                selectedSize === size
                  ? "2px solid #000"
                  : "1.5px solid #ccc",
              backgroundColor: !inStock
                ? "#f5f5f5"
                : selectedSize === size
                ? "#000"
                : "transparent",
              color: !inStock
                ? "#bbb"
                : selectedSize === size
                ? "#fff"
                : "#000",
              textDecoration: !inStock ? "line-through" : "none",
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              letterSpacing: "0.5px",
              userSelect: "none",
            }}
          >
            {size}
          </div>
        ))}
      </div>

      {/* ---- ACTIONS: Cart + Wishlist + Share ---- */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "8px",
          width: "100%",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <motion.div
          onClick={isDisabled ? undefined : onAddToCart}
          whileTap={isDisabled ? {} : { scale: 0.97 }}
          style={{
            flex: "1 1 0%",
            minWidth: 0,
            padding: "13px 12px",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "1.5px",
            borderRadius: "30px",
            cursor: isDisabled ? "default" : "pointer",
            backgroundColor: isDisabled ? "#e0e0e0" : "#000",
            color: isDisabled ? "#999" : "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            whiteSpace: "nowrap",
            fontFamily: "var(--font-body)",
          }}
        >
          {selectedSize
            ? variantSizes.find((s) => s.size === selectedSize)?.inStock
              ? t("addToBag").toUpperCase()
              : "OUT OF STOCK"
            : t("selectSize").toUpperCase()}
          <ShoppingCart size={14} />
        </motion.div>
        <motion.div
          onClick={() => toggleWishlist(variant.id)}
          whileTap={{ scale: 0.9 }}
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            border: "1.5px solid #ccc",
            backgroundColor: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: wishlisted ? "#e11d48" : "#000",
          }}
        >
          <Heart size={16} fill={wishlisted ? "currentColor" : "none"} />
        </motion.div>
        <motion.div
          onClick={async () => {
            const shareUrl = `${window.location.origin}/?productId=${product.id}&variantId=${variant.id}`;
            if (
              navigator.share &&
              /Mobi|Android/i.test(navigator.userAgent)
            ) {
              try {
                await navigator.share({ title: product.name, url: shareUrl });
              } catch (err) {}
            } else {
              try {
                await navigator.clipboard.writeText(shareUrl);
                onNotify("Link copied to clipboard!");
              } catch (err) {}
            }
          }}
          whileTap={{ scale: 0.9 }}
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            border: "1.5px solid #ccc",
            backgroundColor: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "#000",
          }}
        >
          <Share2 size={16} />
        </motion.div>
      </div>

      {/* Description */}
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          color: "#000",
          lineHeight: 1.7,
          margin: "0 0 14px 0",
        }}
        dangerouslySetInnerHTML={{
          __html: language === "ar" && product.descriptionAr
            ? product.descriptionAr
            : product.description
        }}
      />

      {/* Horizontal scroll preview images */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "12px",
          overflowX: "auto",
          overflowY: "hidden",
          padding: "6px 0 2px",
          width: "100%",
          WebkitOverflowScrolling: "touch",
          scrollSnapType: "x mandatory",
          touchAction: "pan-x",
          scrollbarWidth: "none",
          marginBottom: "14px",
        }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {galleryImages.map((img, idx) => (
          <div
            key={`mpdp-prev-${variant.id}-${idx}`}
            onClick={() => onLightbox(idx)}
            style={{
              width: "65vw",
              maxWidth: "240px",
              minWidth: "160px",
              aspectRatio: "3/4",
              borderRadius: "12px",
              overflow: "hidden",
              cursor: "pointer",
              flexShrink: 0,
              backgroundColor: "#f5f5f5",
            }}
          >
            <img
              src={img}
              alt={`${product.name} preview ${idx + 1}`}
              loading="lazy"
              decoding="async"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        ))}
      </div>

      {/* Accordions */}
      <MobileAccordion
        title={t("details")}
        content={
          language === "ar" && product.detailsAr
            ? product.detailsAr
            : product.details
        }
        isOpen={activeAccordion === "details"}
        onClick={() =>
          setActiveAccordion(activeAccordion === "details" ? null : "details")
        }
      />
      <MobileAccordion
        title="Free Delivery and Returns"
        content="Standard processing time for orders is up to 24 hours, with delivery typically completed within 3–5 business days after dispatch."
        isOpen={activeAccordion === "delivery"}
        onClick={() =>
          setActiveAccordion(
            activeAccordion === "delivery" ? null : "delivery"
          )
        }
      />
      <MobileAccordion
        title={`Reviews (${product.reviews})`}
        content={`${product.rating}/5 stars from ${product.reviews} reviews`}
        isOpen={activeAccordion === "reviews"}
        onClick={() =>
          setActiveAccordion(
            activeAccordion === "reviews" ? null : "reviews"
          )
        }
      />

      {/* PDP Footer links */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "16px",
          paddingTop: "18px",
          marginTop: "8px",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <Link href="/contact" className="footer-links__item title">
          {t("contact")}
        </Link>
        <Link href="/legal" className="footer-links__item title">
          {t("legalities")}
        </Link>
        <a
          href="https://instagram.com/inkphyous"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-links__item title"
        >
          {t("social")}
        </a>
      </div>
    </div>
  );
}
