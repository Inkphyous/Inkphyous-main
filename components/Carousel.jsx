"use client";

import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "./providers/StoreProvider";

export default function Carousel() {
  const {
    filteredProducts: products,
    activeIndex,
    setActiveIndex,
    colorMap,
    getImageByColorIndex,
    openPDP,
    pdpProductId,
    pdpVariantId,
    pdpCategoryVacantLeft,
    setPdpCategoryVacantLeft,
    setPdpVariantId,
    switchPdpProduct,
    viewMode,
    t,
    language,
  } = useStore();

  const autoPlayRef = useRef(null);
  const isPDP = viewMode === "pdp";
  const [transitioning, setTransitioning] = useState(false);
  const prevIndexRef = useRef(activeIndex);
  const directionRef = useRef(1); // 1 = next (up), -1 = prev (down)
  const touchRef = useRef({ active: false, startX: 0, startY: 0, dx: 0, dy: 0 });

  if (products.length === 0) return null;

  // Calculate direction synchronously during render so Framer Motion
  // gets the exact correct direction before the exit animation starts.
  if (activeIndex !== prevIndexRef.current) {
    const diff = (activeIndex - prevIndexRef.current + products.length) % products.length;
    directionRef.current = diff <= products.length / 2 ? 1 : -1;
    prevIndexRef.current = activeIndex;
  }
  
  const direction = directionRef.current;

  // Auto-advance every 4 seconds — stops during PDP
  useEffect(() => {
    if (viewMode !== "carousel") return;
    autoPlayRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % products.length);
    }, 4000);
    return () => clearInterval(autoPlayRef.current);
  }, [viewMode, products.length, setActiveIndex]);

  const resetAutoPlay = useCallback(() => {
    clearInterval(autoPlayRef.current);
    if (viewMode === "carousel") {
      autoPlayRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % products.length);
      }, 4000);
    }
  }, [viewMode, products.length, setActiveIndex]);

  const nextProduct = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % products.length);
    resetAutoPlay();
  }, [products.length, setActiveIndex, resetAutoPlay]);

  const prevProduct = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + products.length) % products.length);
    resetAutoPlay();
  }, [products.length, setActiveIndex, resetAutoPlay]);

  useEffect(() => {
    if (viewMode !== "carousel") return;
    const handleKey = (e) => {
      if (e.key === "ArrowRight") nextProduct();
      if (e.key === "ArrowLeft") prevProduct();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewMode, nextProduct, prevProduct]);

  // Simultaneous PDP open with button transition
  const openPDPWithTransition = useCallback(
    (productIndex) => {
      setTransitioning(true);
      openPDP(productIndex); // Call immediately for simultaneous transition
      setTimeout(() => {
        setTransitioning(false);
      }, 350);
    },
    [openPDP]
  );

  const handleProductClick = useCallback(
    (i) => {
      resetAutoPlay();
      if (i === activeIndex) {
        openPDPWithTransition(i);
      } else {
        setActiveIndex(i);
        if (isPDP) {
          setTimeout(() => openPDP(i), 350);
        }
      }
    },
    [activeIndex, isPDP, openPDP, openPDPWithTransition, setActiveIndex, resetAutoPlay]
  );

  const activeProduct = products[activeIndex] || products[0];
  const pdpCenterProduct = useMemo(() => {
    if (!pdpProductId) return activeProduct;
    return products.find((product) => product.id === pdpProductId) || activeProduct;
  }, [pdpProductId, activeProduct, products]);

  const variants = pdpCenterProduct?.variants || [];
  const vLen = variants.length;
  const currentVariantIdx = variants.findIndex(v => v.id === (pdpVariantId || variants[0]?.id));
  const safeVariantIdx = currentVariantIdx === -1 ? 0 : currentVariantIdx;

  const isJerseyPDP = isPDP && String(pdpCenterProduct?.category || "").toLowerCase().includes("jersey");

  const swipeToNeighbor = useCallback(
    (dir) => {
      if (!isPDP) {
        if (dir === "next") nextProduct();
        if (dir === "prev") prevProduct();
        return;
      }
      
      if (vLen <= 1) {
        return;
      }

      if (vLen === 2) {
        if (dir === "next" && safeVariantIdx === 1) return;
        if (dir === "prev" && safeVariantIdx === 0) return;
      }

      const nextIdx =
        dir === "next"
          ? (safeVariantIdx + 1) % vLen
          : (safeVariantIdx - 1 + vLen) % vLen;
      setPdpCategoryVacantLeft(false);
      setPdpVariantId(variants[nextIdx].id);
    },
    [isPDP, nextProduct, prevProduct, vLen, safeVariantIdx, variants, setPdpCategoryVacantLeft, setPdpVariantId, activeIndex, products.length, openPDP]
  );

  useEffect(() => {
    const handleSwipe = (e) => swipeToNeighbor(e.detail.dir);
    window.addEventListener('pdp-swipe', handleSwipe);
    return () => window.removeEventListener('pdp-swipe', handleSwipe);
  }, [swipeToNeighbor]);

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchRef.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      dx: 0,
      dy: 0,
    };
  };

  const handleTouchMove = (event) => {
    if (!touchRef.current.active) return;
    const touch = event.touches[0];
    if (!touch) return;
    touchRef.current.dx = touch.clientX - touchRef.current.startX;
    touchRef.current.dy = touch.clientY - touchRef.current.startY;
  };

  const handleTouchEnd = () => {
    if (!touchRef.current.active) return;
    const { dx, dy } = touchRef.current;
    touchRef.current.active = false;
    
    // Extremely forgiving swipe threshold for mobile thumb arcs
    if (Math.abs(dx) < 20) return;
    
    swipeToNeighbor(dx < 0 ? "next" : "prev");
  };

  const getProductSlot = (i) => {
    const len = products.length;
    let delta = ((i - activeIndex) % len + len) % len;
    if (delta > len / 2) delta -= len;

    if (delta === 0) return "center";
    if (delta === -1) return "left";
    if (delta === 1) return "right";
    return delta < 0 ? "behindLeft" : "behindRight";
  };

  const variantTrackingRef = useRef({
    active: false,
    prevSafeVariantIdx: 0,
    continuousOffset: 0,
  });

  let displayActiveIndex = activeIndex;

  if (isPDP) {
    if (!variantTrackingRef.current.active) {
      variantTrackingRef.current = {
        active: true,
        prevSafeVariantIdx: safeVariantIdx,
        continuousOffset: 0,
      };
    } else if (variantTrackingRef.current.prevSafeVariantIdx !== safeVariantIdx) {
      const prev = variantTrackingRef.current.prevSafeVariantIdx;
      const curr = safeVariantIdx;
      
      let diff = curr - prev;
      if (vLen > 0) {
        if (diff > vLen / 2) diff -= vLen;
        else if (diff < -vLen / 2) diff += vLen;
      }
      
      variantTrackingRef.current.continuousOffset += diff;
      variantTrackingRef.current.prevSafeVariantIdx = curr;
    }
    
    displayActiveIndex = activeIndex + variantTrackingRef.current.continuousOffset;
  } else if (!isPDP && variantTrackingRef.current.active) {
    variantTrackingRef.current.active = false;
  }

  const carouselItems = useMemo(() => {
    if (isPDP && pdpCenterProduct && vLen > 0) {
      const paddedProducts = [...products];
      let virtualId = 1;
      while (paddedProducts.length < 3) {
        paddedProducts.push({
          id: `virtual-pad-${virtualId++}`,
          name: pdpCenterProduct.name,
          isVirtual: true,
        });
      }

      return paddedProducts.map((product, i) => {
        const len = paddedProducts.length;
        let delta = ((i - displayActiveIndex) % len + len) % len;
        if (delta > len / 2) delta -= len;

        if (delta === 0) {
          const currentVariant = variants[safeVariantIdx] || variants[0];
          return {
            key: product.id,
            slot: "center",
            product: pdpCenterProduct,
            variant: currentVariant,
            img: currentVariant.mainImage || currentVariant.image,
            alt: currentVariant.name || pdpCenterProduct.name,
          };
        } else if (delta === 1 && vLen > 1) {
          if (vLen === 2 && safeVariantIdx === 1) {
            return { key: product.id, slot: "hidden", product, variant: null, img: null, alt: product.name };
          }
          const rightVariant = variants[(safeVariantIdx + 1) % vLen];
          return {
            key: product.id,
            slot: "right",
            product: pdpCenterProduct,
            variant: rightVariant,
            img: rightVariant.mainImage || rightVariant.image,
            alt: rightVariant.name || pdpCenterProduct.name,
          };
        } else if (delta === -1 && vLen > 1 && !pdpCategoryVacantLeft) {
          if (vLen === 2 && safeVariantIdx === 0) {
            return { key: product.id, slot: "hidden", product, variant: null, img: null, alt: product.name };
          }
          const leftVariant = variants[(safeVariantIdx - 1 + vLen) % vLen];
          return {
            key: product.id,
            slot: "left",
            product: pdpCenterProduct,
            variant: leftVariant,
            img: leftVariant.mainImage || leftVariant.image,
            alt: leftVariant.name || pdpCenterProduct.name,
          };
        } else {
          return {
            key: product.id,
            slot: "hidden",
            product,
            variant: null,
            img: null,
            alt: product.name,
          };
        }
      });
    }

    return products.map((product, i) => {
      const cIdx = colorMap[product.id] || 0;
      return {
        key: product.id,
        slot: getProductSlot(i),
        product,
        variant: null,
        img: getImageByColorIndex(product, cIdx),
        alt: product.name,
      };
    });
  }, [
    isPDP,
    pdpCenterProduct,
    vLen,
    variants,
    safeVariantIdx,
    pdpCategoryVacantLeft,
    products,
    activeIndex,
    displayActiveIndex,
    colorMap,
    getImageByColorIndex,
  ]);

  const slotStyles = {
    center: { x: "0%", y: "0%", scale: 1, opacity: 1, filter: "blur(0px)", zIndex: 10 },
    left: { x: "-85%", y: "4%", scale: 0.5, opacity: 0.5, filter: "blur(6px)", zIndex: 4 },
    right: { x: "80%", y: "4%", scale: 0.5, opacity: 0.5, filter: "blur(6px)", zIndex: 4 },
    behindLeft: { x: "-25%", y: "6%", scale: 0.2, opacity: 0, filter: "blur(14px)", zIndex: 1 },
    behindRight: { x: "25%", y: "6%", scale: 0.2, opacity: 0, filter: "blur(14px)", zIndex: 1 },
    hidden: { x: "0%", y: "8%", scale: 0.2, opacity: 0, filter: "blur(14px)", zIndex: 0 },
  };

  // Direction-aware text animation: text slides behind a clipped mask
  // Transitions are embedded in variants so exit and entrance have independent timing
  const brandVariants = {
    initial: (dir) => ({
      y: `${dir * 150}%`,
      transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.35 },
    }),
    animate: {
      y: 0,
      transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.35 },
    },
    exit: (dir) => ({
      y: `${dir * -150}%`,
      transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0 },
    }),
  };

  const subtitleVariants = {
    initial: (dir) => ({
      y: `${dir * 150}%`,
      transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.45 },
    }),
    animate: {
      y: 0,
      transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.45 },
    },
    exit: (dir) => ({
      y: `${dir * -150}%`,
      transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0 },
    }),
  };

  if (!activeProduct || viewMode === "grid") return null;

  let homeDotSizes = [6, 10, 6];
  if (!isPDP && transitioning) {
    if (direction === -1) {
      homeDotSizes = [6, 6, 10];
    } else if (direction === 1) {
      homeDotSizes = [10, 6, 6];
    }
  }

  let activePdpDotIdx = safeVariantIdx;
  if (isPDP && transitioning && vLen > 0) {
    activePdpDotIdx = safeVariantIdx - direction;
    if (activePdpDotIdx < 0) activePdpDotIdx += vLen;
    if (activePdpDotIdx >= vLen) activePdpDotIdx -= vLen;
  }

  return (
    <>
    <div
      className="carousel"
      id="carousel-element"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`carousel__stage ${isPDP ? "carousel__stage--pdp" : ""}`}>
        <AnimatePresence>
        </AnimatePresence>

        {carouselItems.map(({ key, slot, product, img, alt }, idx) => {
          const isCenter = slot === "center";
          const isVisible = slot === "center" || slot === "left" || slot === "right";
          const isJersey = String(product.category || "").toLowerCase().includes("jersey");

          return (
            <motion.div
              key={key}
              className="carousel__item"
              animate={{
                x: slotStyles[slot].x,
                y: slotStyles[slot].y,
                scale: slotStyles[slot].scale,
                opacity: slotStyles[slot].opacity,
                filter: slotStyles[slot].filter,
              }}
              whileHover={
                isVisible
                  ? { scale: slotStyles[slot].scale * 1.08, transition: { duration: 0.25 } }
                  : {}
              }
              initial={{ scale: slotStyles[slot].scale * 0.85, opacity: 0, x: slotStyles[slot].x, y: slotStyles[slot].y }}
              transition={{
                type: "spring",
                stiffness: 85,
                damping: 18,
                mass: 0.9,
              }}
              style={{
                zIndex: slotStyles[slot]?.zIndex || 0,
                cursor: isVisible ? "pointer" : "default",
              }}
              onClick={() => {
                if (!isVisible) return;
                if (isPDP) {
                  if (slot === "left") {
                    swipeToNeighbor("prev");
                  } else if (slot === "right") {
                    swipeToNeighbor("next");
                  }
                  return;
                }
                handleProductClick(idx);
              }}
            >
              <div className="carousel__item-inner">
                <AnimatePresence mode="popLayout">
                  {slot !== "hidden" && img && (
                    <motion.img
                      key={img}
                      src={img}
                      alt={alt}
                      loading="lazy"
                      decoding="async"
                      className={isCenter && !isPDP ? "float-breathing" : ""}
                      style={{
                        height: isJerseyPDP && isPDP ? "62vh" : isJersey && !isPDP ? "62vh" : "48vh",
                        objectFit: "contain"
                      }}
                      initial={{ opacity: 0.3, filter: "blur(4px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0.3, filter: "blur(4px)" }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </AnimatePresence>
                <div className="carousel__shadow" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info section — only visible when NOT in PDP */}
      <AnimatePresence>
        {!isPDP && (
          <motion.div
            className="carousel__info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Mobile Dot Indicators for Homepage */}
            <div className="mobile-dots" style={{ marginBottom: "6px" }}>
              <AnimatePresence mode="popLayout">
                {[-1, 0, 1].map((offset) => {
                  const absoluteIdx = activeIndex + offset;
                  const idx = ((absoluteIdx % products.length) + products.length) % products.length;
                  return (
                    <motion.div
                      key={`home-dot-${absoluteIdx}`}
                      layout
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        width: offset === 0 ? 10 : 6,
                        height: offset === 0 ? 10 : 6,
                        backgroundColor: offset === 0 ? "var(--color-primary, #e11d48)" : "#000",
                      }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="mobile-dot"
                    />
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Brand text — exit starts immediately, entrance delayed */}
            <div className="carousel__text-clip--brand">
              <AnimatePresence mode="popLayout" custom={direction}>
                <motion.h2
                  key={`brand-${activeProduct.id}`}
                  className="carousel__brand"
                  custom={direction}
                  variants={brandVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {language === "ar" && activeProduct.brandAr ? activeProduct.brandAr : activeProduct.brand}
                </motion.h2>
              </AnimatePresence>
            </div>

            {/* Subtitle text — exit starts immediately, entrance slightly more delayed */}
            <div className="carousel__text-clip--subtitle">
              <AnimatePresence mode="popLayout" custom={direction}>
                <motion.p
                  key={`sub-${activeProduct.id}`}
                  className="carousel__subtitle"
                  custom={direction}
                  variants={subtitleVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {language === "ar" && activeProduct.taglineAr ? activeProduct.taglineAr : activeProduct.tagline || activeProduct.summary} | ₹
                  {activeProduct.discountPriceINR || activeProduct.priceINR}
                </motion.p>
              </AnimatePresence>
            </div>

            <motion.button
              className={`carousel__see-more ${transitioning ? "carousel__see-more--transitioning" : ""}`}
              onClick={() => openPDPWithTransition(activeIndex)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t("seeMore")}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
