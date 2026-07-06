"use client";

import { useState, useEffect, useMemo, useRef, useCallback, isValidElement } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Heart, ShoppingCart, ChevronDown, ChevronLeft, ChevronRight, X, Share2 } from "lucide-react";
import { useStore } from "./providers/StoreProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Footer from "./Footer";
import MobilePDP from "./MobilePDP";

function Accordion({ title, content, isOpen, onClick }) {
  return (
    <div className="pdp-accordion">
      <button className="pdp-accordion__trigger" onClick={onClick}>
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
            <div className="pdp-accordion__content">
              {isValidElement(content) ? (
                content
              ) : typeof content === "object" && content !== null ? (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {Object.entries(content).map(([key, val]) => {
                    if (typeof val === "object" || typeof val === "boolean" || !val) return null;
                    return (
                      <li key={key} style={{ marginBottom: "4px" }}>
                        <strong style={{ textTransform: "capitalize" }}>{key}:</strong> {val}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>{content}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SizeChartContent = ({ category }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChart = async () => {
      if (!category) return;
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data } = await supabase.from("size_charts").select("chart_data").eq("category", category).single();
      if (data && data.chart_data) {
        setChartData(data.chart_data);
      } else {
        // Fallback to default structure if category not found
        setChartData({
          columns: ["Size", "S", "M", "L", "XL"],
          rows: [
            { label: "Chest", values: ["19.5\"", "20.5\"", "21.5\"", "22.5\""] },
            { label: "Shoulder", values: ["18\"", "19\"", "20\"", "21\""] },
            { label: "Length", values: ["28\"", "29\"", "30\"", "31\""] }
          ]
        });
      }
      setLoading(false);
    };
    fetchChart();
  }, [category]);

  if (loading) return <div style={{ padding: "16px", color: "#555", fontSize: "14px" }}>Loading size chart...</div>;

  return (
    <div style={{ padding: "16px", backgroundColor: "transparent", borderRadius: "8px" }}>
      <p style={{ marginBottom: "16px", color: "#555", fontSize: "14px", lineHeight: "1.5" }}>
        To assist you in selecting the most accurate fit, please refer to the product measurement details provided for each item.
      </p>
      {chartData && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px", color: "#333" }}>
            <thead>
              <tr>
                {chartData.columns.map((col, idx) => (
                  <th key={idx} style={{ padding: "12px", border: "1px solid #ddd", fontWeight: "500", backgroundColor: "transparent" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>{row.label}</td>
                  {row.values.map((val, cIdx) => (
                    <td key={cIdx} style={{ padding: "12px", border: "1px solid #ddd" }}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default function ProductDetail() {
  const {
    products,
    viewMode,
    pdpProductId,
    pdpVariantId,
    setPdpVariantId,
    switchPdpProduct,
    setPdpCategoryVacantLeft,
    addToCart,
    isWishlisted,
    toggleWishlist,
    closePDP,
    t,
    language,
  } = useStore();

  const [selectedSize, setSelectedSize] = useState("");
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState(null);
  
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const initialDist = useRef(null);
  const initialScale = useRef(1);
  const lastTap = useRef(0);
  const lastTouch = useRef({ x: 0, y: 0 });
  const wasPinching = useRef(false);
  
  const overlayRef = useRef(null);
  const detailsWrapRef = useRef(null);
  const swipeRef = useRef({ active: false, startX: 0, startY: 0, dx: 0, dy: 0 });
  const [isMobile, setIsMobile] = useState(false);

  const product = useMemo(
    () => products.find((p) => p.id === pdpProductId),
    [products, pdpProductId]
  );

  const variant = useMemo(() => {
    if (!product) return null;
    return product.variants.find((v) => v.id === pdpVariantId) || product.variants[0];
  }, [product, pdpVariantId]);

  const galleryImages = useMemo(() => {
    if (!variant) return [];
    if (Array.isArray(variant.galleryImages) && variant.galleryImages.length) {
      return variant.galleryImages;
    }
    const full = variant.images || [variant.image];
    return full.filter((img) => img !== (variant.mainImage || variant.image));
  }, [variant]);

  const variantSizes = useMemo(() => {
    if (!variant) return [];
    if (product.details?.migrated_sizes) {
      return Array.isArray(variant.sizes) ? variant.sizes : [];
    }
    if (Array.isArray(variant.sizes) && variant.sizes.length) {
      return variant.sizes;
    }
    return (product.sizeOptions || []).map((size) => ({ size, inStock: true }));
  }, [product, variant]);


  useEffect(() => {
    setSelectedSize("");
    setActiveAccordion(null);
  }, [pdpProductId, pdpVariantId]);

  useEffect(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    if (lightboxIndex !== null) {
      document.body.classList.add("lightbox-open");
    } else {
      document.body.classList.remove("lightbox-open");
    }
    return () => document.body.classList.remove("lightbox-open");
  }, [lightboxIndex]);

  useEffect(() => {
    if (activeAccordion && detailsWrapRef.current) {
      // Small delay to allow DOM to expand during animation
      setTimeout(() => {
        if (detailsWrapRef.current) {
          detailsWrapRef.current.scrollTo({
            top: detailsWrapRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 150);
    }
  }, [activeAccordion]);

  const handlePanEnd = () => {
    setPanPosition({ x: 0, y: 0 });
  };

  const handleOverlayScroll = (e) => {
    const target = e.target;
    const details = detailsWrapRef.current;
    if (!details) return;

    // Check if the main overlay has reached the bottom
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 20;

    if (isAtBottom) {
      details.scrollTo({
        top: details.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const handleTouchStartLightbox = useCallback((e) => {
    if (e.touches.length === 2) {
      wasPinching.current = true;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialDist.current = dist;
      initialScale.current = zoomLevel;
    } else if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
    }
  }, [zoomLevel]);

  const handleTouchMoveLightbox = useCallback((e) => {
    if (e.touches.length === 2 && initialDist.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist / initialDist.current;
      const newScale = Math.max(1, Math.min(initialScale.current * delta, 4));
      setZoomLevel(newScale);
      if (newScale <= 1) {
        setPanPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && zoomLevel > 1) {
      const dx = e.touches[0].clientX - lastTouch.current.x;
      const dy = e.touches[0].clientY - lastTouch.current.y;
      setPanPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [zoomLevel]);

  const handleTouchEndLightbox = useCallback((e) => {
    if (e.touches.length < 2) {
      initialDist.current = null;
    }
    
    if (e.touches.length === 0) {
      if (wasPinching.current) {
        wasPinching.current = false;
        return;
      }
      
      if (e.changedTouches.length === 1) {
        const now = Date.now();
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const dx = endX - lastTouch.current.x;
        const dy = endY - lastTouch.current.y;
        const timeDiff = now - (lastTouch.current.time || now);

        if (zoomLevel === 1 && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) && timeDiff < 400) {
          if (dx > 0) {
            setLightboxIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
          } else {
            setLightboxIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
          }
          return;
        }

        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
          if (now - lastTap.current < 300) {
            if (zoomLevel > 1) {
              setZoomLevel(1);
              setPanPosition({ x: 0, y: 0 });
            } else {
              setZoomLevel(2.5);
            }
            lastTap.current = 0;
          } else {
            lastTap.current = now;
          }
        }
      }
    }
  }, [zoomLevel, galleryImages.length]);

  const handleScroll = useCallback(() => {
    const el = overlayRef.current;
    if (!el) return;
    const scrollTop = el.scrollTop;
    const progress = Math.max(0, Math.min(scrollTop / 400, 1));
    
    if (scrollTop <= 5) {
      const detailsEl = el.querySelector(".pdp-overlay__details-wrap");
      if (detailsEl && detailsEl.scrollTop > 0) {
        detailsEl.scrollTop = 0;
      }
    }
    
    window.dispatchEvent(new CustomEvent("pdp-scroll", { detail: scrollTop > 10 }));

    const carouselEl = document.getElementById("carousel-element");
    if (carouselEl) {
      const stage = carouselEl.querySelector(".carousel__stage");
      if (stage) {
        const isMobileSize = window.innerWidth <= 600;
        
        if (isMobileSize) {
          const baseScale = 1.05;
          const baseTranslateY = 16;
          
          const extraScale = baseScale + progress * 0.1;
          const currentTranslateY = baseTranslateY - progress * 4;
          
          const blur = progress * 10;
          const opacity = 1 - progress * 0.3;
          
          stage.style.transform = `translateY(-${currentTranslateY}%) scale(${extraScale})`;
          stage.style.filter = `blur(${blur}px)`;
          stage.style.opacity = `${opacity}`;
        } else {
          const extraScale = 1.2 + progress * 0.3;
          const blur = progress * 10;
          const opacity = 1 - progress * 0.3;
          stage.style.transform = `translateY(-${15 - progress * 8}%) scale(${extraScale})`;
          stage.style.filter = `blur(${blur}px)`;
          stage.style.opacity = `${opacity}`;
        }
        
        if (progress > 0) {
          stage.style.transition = "none";
        } else {
          stage.style.transition = "";
        }
      }

      const dotsEl = document.querySelector(".mobile-dots");
      if (dotsEl) {
        dotsEl.style.opacity = `${Math.max(0, 1 - progress * 5)}`;
      }

      const footerEl = document.getElementById("global-footer");
      if (footerEl) {
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
          footerEl.style.opacity = "1";
          footerEl.style.visibility = "visible";
        } else {
          footerEl.style.opacity = "0";
          footerEl.style.visibility = "hidden";
        }
      }
    }
  }, []);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    
    // Evaluate initial state immediately so the dashboard footer doesn't stay visible
    handleScroll();
    
    return () => {
      el.removeEventListener("scroll", handleScroll);
      const carouselEl = document.getElementById("carousel-element");
      if (carouselEl) {
        const stage = carouselEl.querySelector(".carousel__stage");
        if (stage) {
          stage.style.transform = "";
          stage.style.filter = "";
          stage.style.opacity = "";
          stage.style.transition = "";
        }

        const dotsEl = document.querySelector(".mobile-dots");
        if (dotsEl) {
          dotsEl.style.opacity = "";
        }
      }
      
      const footerEl = document.getElementById("global-footer");
      if (footerEl) {
        footerEl.style.opacity = "";
        footerEl.style.visibility = "";
      }
    };
  }, [handleScroll]);

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth <= 600);
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const footerEl = document.getElementById("global-footer");
    if (footerEl) {
      footerEl.style.display = "none";
      footerEl.style.opacity = "0";
      footerEl.style.visibility = "hidden";
    }
    return () => {
      if (footerEl) {
        footerEl.style.display = "";
        footerEl.style.opacity = "1";
        footerEl.style.visibility = "visible";
      }
    };
  }, [isMobile]);

  const handleTouchStart = (event) => {
    if (event.target && event.target.closest && event.target.closest(".pdp-overlay__mobile-previews")) return;
    const touch = event.touches[0];
    if (!touch) return;
    swipeRef.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      dx: 0,
      dy: 0,
    };
  };

  const handleTouchMove = (event) => {
    if (!swipeRef.current.active) return;
    const touch = event.touches[0];
    if (!touch) return;
    swipeRef.current.dx = touch.clientX - swipeRef.current.startX;
    swipeRef.current.dy = touch.clientY - swipeRef.current.startY;
  };

  const handleTouchEnd = () => {
    if (!swipeRef.current.active) return;
    const { dx, dy } = swipeRef.current;
    swipeRef.current.active = false;
    
    // Extremely forgiving swipe threshold for mobile thumb arcs
    if (Math.abs(dx) < 20) return;
    
    window.dispatchEvent(new CustomEvent('pdp-swipe', { detail: { dir: dx < 0 ? 'next' : 'prev' } }));
  };

  if (viewMode !== "pdp" || !product || !variant) return null;

  const wishlisted = isWishlisted(variant.id);

  const handleAddToCart = async () => {
    if (!selectedSize) return;
    const sizeObj = variantSizes.find((entry) => entry.size === selectedSize);
    if (sizeObj && !sizeObj.inStock) return;

    const added = await addToCart({
      id: variant.id,
      name: product.name,
      image: variant.mainImage || variant.image,
      color: variant.color,
      size: selectedSize,
      priceINR: product.priceINR,
      discountPriceINR: product.discountPriceINR,
      quantity: 1,
    });
    if (!added) return;
    setNotificationMessage(` ${t("addedToBag")}`);
    setTimeout(() => setNotificationMessage(""), 3000);
  };

  if (isMobile) {
    return (
      <motion.div
        ref={overlayRef}
        className="pdp-overlay"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 100, damping: 20, mass: 0.8 }}
      >
        <div 
          className="pdp-overlay__spacer" 
          style={{ pointerEvents: 'auto', touchAction: 'pan-y' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => {
            const { clientX } = e;
            const width = window.innerWidth;
            if (clientX < width * 0.3) {
              window.dispatchEvent(new CustomEvent('pdp-swipe', { detail: { dir: 'prev' } }));
            } else if (clientX > width * 0.7) {
              window.dispatchEvent(new CustomEvent('pdp-swipe', { detail: { dir: 'next' } }));
            }
          }}
        />

        <div className="pdp-overlay__content">
          <MobilePDP
            product={product}
            variant={variant}
            variantSizes={variantSizes}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            galleryImages={galleryImages}
            activeProductIdx={products.findIndex((p) => p.id === pdpProductId)}
            totalProducts={products.length}
            onAddToCart={handleAddToCart}
            onSetVariant={setPdpVariantId}
            onLightbox={setLightboxIndex}
            onNotify={(msg) => {
              setNotificationMessage(msg);
              setTimeout(() => setNotificationMessage(""), 3000);
            }}
          />
        </div>

        <AnimatePresence>
          {notificationMessage && (
            <motion.div
              className="notification"
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {notificationMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {createPortal(
          <AnimatePresence>
            {lightboxIndex !== null && (
              <motion.div
                className="pdp-lightbox"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setLightboxIndex(null)}
              >
                <button className="pdp-lightbox__close" style={{ zIndex: 99999, pointerEvents: "auto" }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLightboxIndex(null); }}>
                  <X size={24} strokeWidth={2} style={{ pointerEvents: "none" }} />
                </button>
                {galleryImages.length > 1 && zoomLevel === 1 && !isMobile && (
                  <button className="pdp-lightbox__arrow pdp-lightbox__arrow--left"
                    style={{ zIndex: 99999, pointerEvents: "auto" }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLightboxIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1)); }}>
                    <ChevronLeft size={32} strokeWidth={2} style={{ pointerEvents: "none" }} />
                  </button>
                )}
                <motion.div className="pdp-lightbox__image-wrap" key={lightboxIndex}
                  initial={{ opacity: 0, scale: 0.92, x: 0, y: 0 }} 
                  animate={{ opacity: 1, scale: zoomLevel, x: panPosition.x, y: panPosition.y }}
                  exit={{ opacity: 0, scale: 0.92, x: 0, y: 0 }} 
                  transition={{ duration: initialDist.current ? 0 : 0.2 }}
                  onClick={(e) => e.stopPropagation()} 
                  onTouchStart={handleTouchStartLightbox}
                  onTouchMove={handleTouchMoveLightbox}
                  onTouchEnd={handleTouchEndLightbox}
                  style={{ zIndex: 1000, touchAction: "none" }}>
                  <img src={galleryImages[lightboxIndex]} alt={`${product.name} view ${lightboxIndex + 1}`} className="pdp-lightbox__image" style={{ pointerEvents: "none" }} />
                </motion.div>
                {galleryImages.length > 1 && zoomLevel === 1 && !isMobile && (
                  <button className="pdp-lightbox__arrow pdp-lightbox__arrow--right"
                    style={{ zIndex: 99999, pointerEvents: "auto" }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLightboxIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0)); }}>
                    <ChevronRight size={32} strokeWidth={2} style={{ pointerEvents: "none" }} />
                  </button>
                )}
                <div className="pdp-lightbox__counter">{lightboxIndex + 1} / {galleryImages.length}</div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </motion.div>
    );
  }

  // Spacer click handler to simulate clicking left/right carousel items
  const handleSpacerClick = (e) => {
    const { clientX } = e;
    const width = window.innerWidth;
    
    // Left 30% of screen = click left item
    if (clientX < width * 0.3) {
      window.dispatchEvent(new CustomEvent('pdp-swipe', { detail: { dir: 'prev' } }));
    }
    // Right 30% of screen = click right item
    else if (clientX > width * 0.7) {
      window.dispatchEvent(new CustomEvent('pdp-swipe', { detail: { dir: 'next' } }));
    }
    // Center = do nothing (center item doesn't rotate)
  };

  return (
    <motion.div
      key="pdp-overlay"
      className="pdp-overlay"
      ref={overlayRef}
      onScroll={handleOverlayScroll}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 100, damping: 20, mass: 0.8 }}
    >
      <div className="pdp-overlay__spacer" />

      <motion.div
        className="pdp-overlay__content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div className="pdp-overlay__grid">
          <div className="pdp-overlay__gallery">
            <div className="pdp-overlay__brand-section" style={{ marginBottom: "20px" }}>
              <AnimatePresence mode="wait">
                <motion.div 
                  key={`header-${variant.id}`}
                  style={{ display: "flex", alignItems: "baseline", gap: "14px" }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <h1 className="pdp-overlay__brand">{variant.name || product.brand}</h1>
                  <span className="pdp-overlay__category">{t(product.category.toLowerCase())}</span>
                </motion.div>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.p
                  key={variant.id}
                  className="pdp-overlay__variant"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ margin: "4px 0 0 0" }}
                >
                  {variant.semiDescription || variant.name}
                </motion.p>
              </AnimatePresence>
            </div>

            {galleryImages.map((img, idx) => (
              <motion.div
                key={`${variant.id}-${idx}`}
                className="pdp-overlay__gallery-img"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.2 + idx * 0.1,
                  type: "spring",
                  stiffness: 200,
                  damping: 25,
                }}
                onClick={() => setLightboxIndex(idx)}
                style={{ cursor: "pointer" }}
              >
                <img src={img} alt={`${product.name} view ${idx + 1}`} loading="lazy" decoding="async" />
              </motion.div>
            ))}
          </div>

          <div className="pdp-overlay__details-wrap" ref={detailsWrapRef}>
            <motion.div
              className="pdp-overlay__details"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 200, damping: 25 }}
            >
                  <div className="pdp-overlay__mobile-header">
                    <div className="pdp-overlay__mobile-brand-row">
                      <h1 className="pdp-overlay__brand">{variant.name || product.brand}</h1>
                      <span className="pdp-overlay__category">{t(product.category.toLowerCase())}</span>
                    </div>
                    <p className="pdp-overlay__variant">{variant.semiDescription || variant.name}</p>
                  </div>

                  <div className="pdp-overlay__selection-block">
                    <div className="pdp-overlay__price-section" style={{ alignSelf: "flex-end", marginBottom: "8px" }}>
                      <span className="pdp-overlay__price">₹{product.discountPriceINR || product.priceINR}</span>
                    </div>
                    <div className="pdp-overlay__swatches" style={{ alignSelf: "flex-end", marginBottom: "8px" }}>
                      {product.variants.map((v) => (
                        <button key={v.id}
                          className={`pdp-overlay__color ${variant.id === v.id ? "pdp-overlay__color--active" : ""}`}
                          style={{ backgroundColor: v.colorHex || v.color?.toLowerCase() || "#ccc" }}
                          onClick={() => setPdpVariantId(v.id)} aria-label={`Select ${v.color}`} />
                      ))}
                    </div>
                    <div className="pdp-overlay__sizes pdp-overlay__sizes-row">
                      {variantSizes.map(({ size, inStock }) => (
                        <button key={size}
                          className={`pdp-overlay__size-btn ${selectedSize === size ? "pdp-overlay__size-btn--active" : ""} ${!inStock ? "pdp-overlay__size-btn--out" : ""}`}
                          onClick={() => setSelectedSize(size)}>{size}</button>
                      ))}
                    </div>
                  </div>

                  <div className="pdp-overlay__actions">
                    <motion.button className="pdp-overlay__cart-btn" onClick={handleAddToCart}
                      disabled={!selectedSize || !variantSizes.find((s) => s.size === selectedSize)?.inStock}
                      whileHover={{ scale: selectedSize && variantSizes.find((s) => s.size === selectedSize)?.inStock ? 1.03 : 1 }}
                      whileTap={{ scale: selectedSize && variantSizes.find((s) => s.size === selectedSize)?.inStock ? 0.97 : 1 }}>
                      {selectedSize ? (variantSizes.find((s) => s.size === selectedSize)?.inStock ? t("addToBag").toUpperCase() : "OUT OF STOCK") : t("selectSize").toUpperCase()}
                      <ShoppingCart size={14} />
                    </motion.button>
                    <motion.button className={`pdp-overlay__wish-btn ${wishlisted ? "pdp-overlay__wish-btn--active" : ""}`}
                      onClick={() => toggleWishlist(variant.id)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} aria-label="Wishlist">
                      <Heart size={16} fill={wishlisted ? "currentColor" : "none"} />
                    </motion.button>
                    <motion.button className="pdp-overlay__wish-btn"
                      onClick={async () => {
                        const shareUrl = `${window.location.origin}/?productId=${product.id}&variantId=${variant.id}`;
                        if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
                          try { await navigator.share({ title: product.name, url: shareUrl }); } catch (err) {}
                        } else {
                          try { await navigator.clipboard.writeText(shareUrl); setNotificationMessage("Link copied to clipboard!"); setTimeout(() => setNotificationMessage(""), 3000); } catch (err) {}
                        }
                      }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} aria-label="Share">
                      <Share2 size={16} />
                    </motion.button>
                  </div>

                    <AnimatePresence mode="wait">
                      <motion.div key={`desc-${product.id}`} className="pdp-overlay__description"
                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.25 }}
                        dangerouslySetInnerHTML={{ __html: language === "ar" && product.descriptionAr ? product.descriptionAr : product.description }}
                      />
                    </AnimatePresence>

                  <div className="pdp-overlay__mobile-previews hide-scrollbar"
                    onTouchStart={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}
                    style={{ scrollSnapType: "x mandatory", touchAction: "pan-x" }}>
                    {galleryImages.map((img, idx) => (
                      <button key={`mobile-preview-${variant.id}-${idx}`} className="pdp-overlay__mobile-preview"
                        onClick={() => setLightboxIndex(idx)} aria-label={`Preview image ${idx + 1}`}>
                        <img src={img} alt={`${product.name} preview ${idx + 1}`} loading="lazy" decoding="async" />
                      </button>
                    ))}
                  </div>

                  <Accordion title={t("details")} content={language === "ar" && product.detailsAr ? product.detailsAr : product.details}
                    isOpen={activeAccordion === "details"} onClick={() => setActiveAccordion(activeAccordion === "details" ? null : "details")} />
                  <Accordion title="Shipping Policy" content={
                    <ul style={{ paddingLeft: "20px", margin: 0, listStyleType: "disc" }}>
                      <li style={{ marginBottom: "8px" }}>Standard processing time for orders is up to 24 hours, with delivery typically completed within 5-7 business days after dispatch.</li>
                      <li>Read our full Shipping Policy for more details <Link href="/legal/shipping" style={{ color: "var(--color-primary, #e11d48)", textDecoration: "underline" }}>here</Link>.</li>
                    </ul>
                  }
                    isOpen={activeAccordion === "shipping"} onClick={() => setActiveAccordion(activeAccordion === "shipping" ? null : "shipping")} />
                  <Accordion title="Size Chart" content={<SizeChartContent category={product?.category || product?.subcategory || "Jerseys"} />}
                    isOpen={activeAccordion === "size-chart"} onClick={() => setActiveAccordion(activeAccordion === "size-chart" ? null : "size-chart")} />


            </motion.div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {notificationMessage && (
          <motion.div
            className="notification"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {notificationMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {createPortal(
        <AnimatePresence>
          {lightboxIndex !== null && (
            <motion.div
              className="pdp-lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setLightboxIndex(null)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setLightboxIndex(null);
                if (e.key === "ArrowLeft") setLightboxIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
                if (e.key === "ArrowRight") setLightboxIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
              }}
              tabIndex={0}
              ref={(el) => el && el.focus()}
            >
              {/* Close button */}
              <button
                className="pdp-lightbox__close"
                style={{ zIndex: 99999, pointerEvents: 'auto' }}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation(); 
                  setLightboxIndex(null); 
                }}
              >
                <X size={24} strokeWidth={2} style={{ pointerEvents: 'none' }} />
              </button>

              {/* Left arrow */}
              {galleryImages.length > 1 && (
                <button
                  className="pdp-lightbox__arrow pdp-lightbox__arrow--left"
                  style={{ zIndex: 99999, pointerEvents: 'auto' }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
                  }}
                >
                  <ChevronLeft size={32} strokeWidth={2} style={{ pointerEvents: 'none' }} />
                </button>
              )}

              {/* Image */}
              <motion.div
                className="pdp-lightbox__image-wrap"
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                style={{ zIndex: 1000 }}
              >
                <img
                  src={galleryImages[lightboxIndex]}
                  alt={`${product.name} view ${lightboxIndex + 1}`}
                  className="pdp-lightbox__image"
                />
              </motion.div>

              {/* Right arrow */}
              {galleryImages.length > 1 && (
                <button
                  className="pdp-lightbox__arrow pdp-lightbox__arrow--right"
                  style={{ zIndex: 99999, pointerEvents: 'auto' }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
                  }}
                >
                  <ChevronRight size={32} strokeWidth={2} style={{ pointerEvents: 'none' }} />
                </button>
              )}

              {/* Counter */}
              <div className="pdp-lightbox__counter">
                {lightboxIndex + 1} / {galleryImages.length}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}
