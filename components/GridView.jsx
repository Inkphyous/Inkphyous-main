"use client";

import { motion } from "framer-motion";
import { useStore } from "./providers/StoreProvider";

export default function GridView() {
  const {
    filteredProducts: products,
    viewMode,
    colorMap,
    setProductColor,
    getImageByColorIndex,
    openPDP,
    setActiveIndex,
    language,
  } = useStore();

  if (viewMode !== "grid") return null;

  return (
    <div className="grid-view">
      <div className="grid-view__grid">
        {products.map((product, i) => {
          const cIdx = colorMap[i] || 0;
          const img = getImageByColorIndex(product, cIdx);

          return (
            <motion.div
              key={product.id}
              className="grid-view__item"
              initial={{ opacity: 0, y: "30vh" }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: i * 0.08,
                type: "spring",
                stiffness: 150,
                damping: 25,
              }}
              onClick={() => {
                setActiveIndex(i);
                openPDP(i);
              }}
            >
              <div className="grid-view__image-container">
                <img
                  src={img}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                />
                <div className="grid-view__image-overlay">
                  <span className="grid-view__brand">{product.brand}</span>
                  <span className="grid-view__price">
                    ₹{product.discountPriceINR || product.priceINR}
                  </span>
                </div>
              </div>

              <div className="grid-view__details-card">
                <div className="grid-view__mobile-brand-price">
                  <span className="grid-view__brand">{product.brand}</span>
                  <span className="grid-view__price">
                    ₹{product.discountPriceINR || product.priceINR}
                  </span>
                </div>
                <span className="grid-view__name">
                  {language === "ar" && product.nameAr ? product.nameAr : product.summary.split("|")[0].trim()}
                </span>
                
                {/* Color dots */}
                <div style={{ display: "flex", gap: "6px", paddingTop: "8px" }}>
                {product.availableColors.map((color, idx) => {
                  const matchedVariant = (product.variants || []).find(
                    (variant) =>
                      String(variant.color).toLowerCase() === String(color).toLowerCase()
                  );

                  return (
                    <button
                      key={color}
                      onClick={(e) => {
                        e.stopPropagation();
                        setProductColor(i, idx);
                      }}
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        backgroundColor:
                          matchedVariant?.colorHex || String(color).toLowerCase(),
                        border: cIdx === idx ? "2px solid #000" : "1px solid #ddd",
                        cursor: "pointer",
                        padding: 0,
                        transition: "all 0.2s ease",
                        transform: cIdx === idx ? "scale(1.2)" : "scale(1)",
                      }}
                      aria-label={`Select ${color}`}
                    />
                  );
                })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
