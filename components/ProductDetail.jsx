"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Heart, ShoppingCart, ChevronDown, ChevronLeft, ChevronRight, X, Share2 } from "lucide-react";
import { useStore } from "./providers/StoreProvider";
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
              {typeof content === "object" && content !== null ? (
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
  const overlayRef = useRef(null);
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

  const pdpCategoryProducts = useMemo(() => {
    if (!product?.category) return [];
    return products.filter((entry) => entry.category === product.category);
  }, [products, product]);

  const pdpNeighbors = useMemo(() => {
    if (!product || pdpCategoryProducts.length === 0) {
      return { left: null, right: null };
    }
    const centerIdx = pdpCategoryProducts.findIndex((entry) => entry.id === product.id);
    if (centerIdx === -1) return { left: null, right: null };
    const len = pdpCategoryProducts.length;
    const left = len > 1 ? pdpCategoryProducts[(centerIdx - 1 + len) % len] : null;
    const right = len > 1 ? pdpCategoryProducts[(centerIdx + 1) % len] : null;
    return { left, right };
  }, [pdpCategoryProducts, product]);

  useEffect(() => {
    setSelectedSize("");
    setActiveAccordion(null);
  }, [pdpProductId, pdpVariantId]);

  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.classList.add("lightbox-open");
    } else {
      document.body.classList.remove("lightbox-open");
    }
    return () => document.body.classList.remove("lightbox-open");
  }, [lightboxIndex]);

  // Scroll handler — drives zoom/blur/center on the carousel behind
  const handleScroll = useCallback(() => {
    const el = overlayRef.current;
    if (!el) return;
    const scrollTop = el.scrollTop;
    // Progress 0→1 over first 400px of scroll. Clamp to 0 to prevent negative elastic bounce!
    const progress = Math.max(0, Math.min(scrollTop / 400, 1));

    const carouselEl = document.getElementById("carousel-element");
    if (carouselEl) {
      const stage = carouselEl.querySelector(".carousel__stage");
      if (stage) {
        // Mobile animations: start EXACTLY at CSS values (-16%, 1.05) to prevent jumping
        const isMobileSize = window.innerWidth <= 600;
        
        if (isMobileSize) {
          const baseScale = 1.05;
          const baseTranslateY = 16;
          
          // Gentle zoom and move down
          const extraScale = baseScale + progress * 0.1; // 1.05 -> 1.15
          const currentTranslateY = baseTranslateY - progress * 4; // 16 -> 12 (moves down)
          
          const blur = progress * 10;
          const opacity = 1 - progress * 0.3;
          
          stage.style.transform = `translateY(-${currentTranslateY}%) scale(${extraScale})`;
          stage.style.filter = `blur(${blur}px)`;
          stage.style.opacity = `${opacity}`;
        } else {
          // Desktop animations
          const extraScale = 1.2 + progress * 0.3; // 1.2 → 1.50
          const blur = progress * 10;
          const opacity = 1 - progress * 0.3;
          stage.style.transform = `translateY(-${18 - progress * 8}%) scale(${extraScale})`;
          stage.style.filter = `blur(${blur}px)`;
          stage.style.opacity = `${opacity}`;
        }
        
        // Remove CSS transition while scrolling so it tracks perfectly without lag.
        // Restore it when at the top so the initial/close animations are smooth.
        if (progress > 0) {
          stage.style.transition = "none";
        } else {
          stage.style.transition = "";
        }
      }

      // Show global footer when the right side has stopped scrolling (is sticky)
      const footerEl = document.getElementById("global-footer");
      if (footerEl) {
        // On desktop (fixed footer), show footer when details are fully scrolled
        const detailsEl = el.querySelector(".pdp-overlay__details-wrap");
        if (detailsEl) {
          const rect = detailsEl.getBoundingClientRect();
          if (rect.top <= 1) {
            footerEl.style.opacity = "1";
            footerEl.style.pointerEvents = "auto";
          } else {
            footerEl.style.opacity = "0";
            footerEl.style.pointerEvents = "none";
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      // Reset carousel transform on unmount
      const carouselEl = document.getElementById("carousel-element");
      if (carouselEl) {
        const stage = carouselEl.querySelector(".carousel__stage");
        if (stage) {
          stage.style.transform = "";
          stage.style.filter = "";
          stage.style.opacity = "";
          stage.style.transition = ""; // Critical to restore CSS transition if user exits while scrolled
        }
      }
    };
  }, [handleScroll]);

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth <= 600);
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  // Hide global footer when mobile PDP is open (it has its own footer inside)
  useEffect(() => {
    if (!isMobile) return;
    const footerEl = document.getElementById("global-footer");
    if (footerEl) {
      footerEl.style.display = "none";
      footerEl.style.opacity = "0";
      footerEl.style.pointerEvents = "none";
    }
    return () => {
      if (footerEl) {
        footerEl.style.display = "";
        footerEl.style.opacity = "1";
        footerEl.style.pointerEvents = "auto";
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
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) || Math.abs(dy) > 40) return;
    const target = dx < 0 ? pdpNeighbors.right : pdpNeighbors.left;
    if (!target) return;
    setPdpCategoryVacantLeft(false);
    switchPdpProduct(target.id);
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
    setNotificationMessage(`🛒 ${t("addedToBag")}`);
    setTimeout(() => setNotificationMessage(""), 3000);
  };

  // ───── MOBILE: render inside pdp-overlay (transition preserved) but OUTSIDE grid/details ─────
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
        {/* Transparent spacer — dashboard carousel visible behind */}
        <div className="pdp-overlay__spacer" />

        {/* Mobile PDP content — uses identical gradient class to desktop */}
        <div className="pdp-overlay__content">
          <MobilePDP
            product={product}
            variant={variant}
            variantSizes={variantSizes}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            galleryImages={galleryImages}
            onAddToCart={handleAddToCart}
            onSetVariant={setPdpVariantId}
            onLightbox={setLightboxIndex}
            onNotify={(msg) => {
              setNotificationMessage(msg);
              setTimeout(() => setNotificationMessage(""), 3000);
            }}
          />
        </div>

        {/* Notification */}
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

        {/* Image Lightbox */}
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
              {galleryImages.length > 1 && (
                <button className="pdp-lightbox__arrow pdp-lightbox__arrow--left"
                  style={{ zIndex: 99999, pointerEvents: "auto" }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLightboxIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1)); }}>
                  <ChevronLeft size={32} strokeWidth={2} style={{ pointerEvents: "none" }} />
                </button>
              )}
              <motion.div className="pdp-lightbox__image-wrap" key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()} style={{ zIndex: 1000 }}>
                <img src={galleryImages[lightboxIndex]} alt={`${product.name} view ${lightboxIndex + 1}`} className="pdp-lightbox__image" />
              </motion.div>
              {galleryImages.length > 1 && (
                <button className="pdp-lightbox__arrow pdp-lightbox__arrow--right"
                  style={{ zIndex: 99999, pointerEvents: "auto" }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLightboxIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0)); }}>
                  <ChevronRight size={32} strokeWidth={2} style={{ pointerEvents: "none" }} />
                </button>
              )}
              <div className="pdp-lightbox__counter">{lightboxIndex + 1} / {galleryImages.length}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ───── DESKTOP: render the original pdp-overlay (completely untouched) ─────
  return (
    <motion.div
      ref={overlayRef}
      className="pdp-overlay"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 100, damping: 20, mass: 0.8 }}
    >
      {/* Transparent spacer — products visible behind */}
      <div className="pdp-overlay__spacer" />

      {/* Content — semi-transparent background */}
      <motion.div
        className="pdp-overlay__content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 2-column: Gallery | Sticky details */}
        <div className="pdp-overlay__grid">
          {/* Left: Brand + Gallery */}
          <div className="pdp-overlay__gallery">
            <div className="pdp-overlay__brand-section" style={{ marginBottom: "20px" }}>
              <AnimatePresence mode="wait">
                <motion.div 
                  key={`header-${product.id}`}
                  style={{ display: "flex", alignItems: "baseline", gap: "14px" }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <h1 className="pdp-overlay__brand">{product.brand}</h1>
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
                  {variant.name}
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

          {/* Right: Sticky details */}
          <div className="pdp-overlay__details-wrap">
            <motion.div
              className="pdp-overlay__details"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 200, damping: 25 }}
            >
               {/* ====== DESKTOP PDP DETAILS ====== */}
                  <div className="pdp-overlay__mobile-header">
                    <div className="pdp-overlay__mobile-brand-row">
                      <h1 className="pdp-overlay__brand">{product.brand}</h1>
                      <span className="pdp-overlay__category">{t(product.category.toLowerCase())}</span>
                    </div>
                    <p className="pdp-overlay__variant">{variant.name}</p>
                  </div>

                  <div className="pdp-overlay__selection-block">
                    <div className="pdp-overlay__price-row">
                      <div className="pdp-overlay__swatches">
                        {product.variants.map((v) => (
                          <button key={v.id}
                            className={`pdp-overlay__color ${variant.id === v.id ? "pdp-overlay__color--active" : ""}`}
                            style={{ backgroundColor: v.colorHex || v.color?.toLowerCase() || "#ccc" }}
                            onClick={() => setPdpVariantId(v.id)} aria-label={`Select ${v.color}`} />
                        ))}
                      </div>
                      <div className="pdp-overlay__price-section">
                        <span className="pdp-overlay__price">₹{product.discountPriceINR || product.priceINR}</span>
                      </div>
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
                    <motion.p key={`desc-${product.id}`} className="pdp-overlay__description"
                      initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.25 }}>
                      {language === "ar" && product.descriptionAr ? product.descriptionAr : product.description}
                    </motion.p>
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
                  <Accordion title="Free Delivery and Returns" content="Standard processing time for orders is up to 24 hours, with delivery typically completed within 3–5 business days after dispatch."
                    isOpen={activeAccordion === "delivery"} onClick={() => setActiveAccordion(activeAccordion === "delivery" ? null : "delivery")} />
                  <Accordion title={`Reviews (${product.reviews})`} content={`${product.rating}/5 stars from ${product.reviews} reviews`}
                    isOpen={activeAccordion === "reviews"} onClick={() => setActiveAccordion(activeAccordion === "reviews" ? null : "reviews")} />

                  <div className="pdp-overlay__mobile-footer">
                    <Link href="/contact" className="footer-links__item title">{t("contact")}</Link>
                    <Link href="/legal" className="footer-links__item title">{t("legalities")}</Link>
                    <a href="https://instagram.com/inkphyous" target="_blank" rel="noopener noreferrer" className="footer-links__item title">{t("social")}</a>
                  </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Notification */}
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

      {/* Image Lightbox */}
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
      </AnimatePresence>
    </motion.div>
  );
}
