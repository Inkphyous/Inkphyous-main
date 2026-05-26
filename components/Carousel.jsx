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
    pdpCategoryVacantLeft,
    setPdpCategoryVacantLeft,
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

  if (!activeProduct) return null;

  const pdpCategoryProducts = useMemo(() => {
    if (!pdpCenterProduct?.category) return [];
    return products.filter((product) => product.category === pdpCenterProduct.category);
  }, [products, pdpCenterProduct]);

  const pdpNeighbors = useMemo(() => {
    if (!isPDP || !pdpCenterProduct || pdpCategoryProducts.length === 0) {
      return { left: null, right: null, center: pdpCenterProduct };
    }
    const centerIdx = pdpCategoryProducts.findIndex((product) => product.id === pdpCenterProduct.id);
    if (centerIdx === -1) return { left: null, right: null, center: pdpCenterProduct };

    const len = pdpCategoryProducts.length;
    const left = len > 1 ? pdpCategoryProducts[(centerIdx - 1 + len) % len] : null;
    const right = len > 1 ? pdpCategoryProducts[(centerIdx + 1) % len] : null;
    return { left, right, center: pdpCenterProduct };
  }, [isPDP, pdpCenterProduct, pdpCategoryProducts]);

  const swipeToNeighbor = useCallback(
    (dir) => {
      if (!isPDP) {
        if (dir === "next") nextProduct();
        if (dir === "prev") prevProduct();
        return;
      }
      const target = dir === "next" ? pdpNeighbors.right : pdpNeighbors.left;
      if (!target) return;
      setPdpCategoryVacantLeft(false);
      switchPdpProduct(target.id);
    },
    [isPDP, nextProduct, prevProduct, pdpNeighbors.left, pdpNeighbors.right, setPdpCategoryVacantLeft, switchPdpProduct]
  );

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
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) || Math.abs(dy) > 40) return;
    swipeToNeighbor(dx < 0 ? "next" : "prev");
  };

  const getSlot = (i) => {
    if (isPDP && pdpCenterProduct) {
      const current = products[i];
      if (!current || current.category !== pdpCenterProduct.category) return "hidden";
      if (current.id === pdpNeighbors.center?.id) return "center";
      if (current.id === pdpNeighbors.right?.id) return "right";
      if (
        !pdpCategoryVacantLeft &&
        current.id === pdpNeighbors.left?.id &&
        current.id !== pdpNeighbors.right?.id
      ) {
        return "left";
      }
      return "hidden";
    }

    if (i === activeIndex) return "center";
    const left = (activeIndex - 1 + products.length) % products.length;
    const right = (activeIndex + 1) % products.length;
    if (i === left) return "left";
    if (i === right) return "right";
    const diff = (i - activeIndex + products.length) % products.length;
    return diff > products.length / 2 ? "behindLeft" : "behindRight";
  };

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

  if (viewMode === "grid") return null;

  return (
    <div
      className="carousel"
      id="carousel-element"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Stage — uses CSS class for PDP animation (not Framer Motion, 
           because the PDP scroll handler needs to control transform directly) */}
      <div
        className={`carousel__stage ${isPDP ? "carousel__stage--pdp" : ""}`}
      >
        {products.map((product, i) => {
          const slot = getSlot(i);
          const cIdx = colorMap[i] || 0;
          const img = getImageByColorIndex(product, cIdx);
          const style = slotStyles[slot];
          const isCenter = i === activeIndex;
          const isVisible = slot === "center" || slot === "left" || slot === "right";
          const isJersey = String(product.category || "")
            .toLowerCase()
            .includes("jersey");

          return (
            <motion.div
              key={product.id}
              className="carousel__item"
              animate={{
                x: style.x,
                y: style.y,
                scale: style.scale,
                opacity: style.opacity,
                filter: style.filter,
              }}
              whileHover={
                !isPDP && isVisible
                  ? { scale: style.scale * 1.08, transition: { duration: 0.25 } }
                  : {}
              }
              initial={{ scale: style.scale * 0.85, opacity: 0, x: style.x, y: style.y }}
              transition={{
                type: "spring",
                stiffness: 85,
                damping: 18,
                mass: 0.9,
              }}
              style={{
                zIndex: style?.zIndex || 0,
                cursor: isVisible ? "pointer" : "default",
              }}
              onClick={() => {
                if (!isVisible) return;
                if (isPDP) {
                  if (slot === "left" || slot === "right") {
                    setPdpCategoryVacantLeft(false);
                    switchPdpProduct(product.id);
                  }
                  return;
                }
                handleProductClick(i);
              }}
            >
              <div className="carousel__item-inner">
                {slot !== "hidden" && (
                  <img
                    src={img}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className={isCenter && !isPDP ? "float-breathing" : ""}
                    style={{
                      height: isJersey ? "62vh" : "48vh"
                    }}
                  />
                )}
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
                  {language === "ar" && activeProduct.summaryAr ? activeProduct.summaryAr : activeProduct.summary} | ₹
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
  );
}
