"use client";

import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Carousel from "@/components/Carousel";
import ProductDetail from "@/components/ProductDetail";
import GridView from "@/components/GridView";
import Footer from "@/components/Footer";

const LogoScene = dynamic(() => import("@/components/LogoScene"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "black",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          position: "fixed",
          bottom: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          zIndex: 10001,
        }}
      >
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            color: "#999",
            fontWeight: 500,
            pointerEvents: "none",
            opacity: 0,
          }}
        >
          Loading...
        </p>
      </div>
    </div>
  ),
});

function HomePageInner() {
  const searchParams = useSearchParams();
  const openedFromQueryRef = useRef(false);
  const {
    showIntro,
    setShowIntro,
    viewMode,
    productsLoading,
    openPDPByProductAndVariant,
    categories,
    activeCategory,
    setActiveCategory,
    t,
  } = useStore();
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);

  useEffect(() => {
    if (productsLoading || openedFromQueryRef.current) return;

    let variantId = searchParams.get("variantId");
    let productId = searchParams.get("productId");

    // If not in URL, check if they refreshed while in a PDP session
    if (!variantId && !productId && typeof window !== "undefined") {
      const sessionViewMode = sessionStorage.getItem("inkViewMode");
      if (sessionViewMode === "pdp") {
        productId = sessionStorage.getItem("inkProductId");
        variantId = sessionStorage.getItem("inkVariantId") || null;
      }
    }

    if (!variantId && !productId) return;

    openedFromQueryRef.current = true;
    openPDPByProductAndVariant({ productId, variantId });
  }, [productsLoading, searchParams, openPDPByProductAndVariant]);

  useEffect(() => {
    if (viewMode !== "carousel") {
      setMobileCategoriesOpen(false);
    }
  }, [viewMode]);

  if (showIntro) {
    return <LogoScene onIntroComplete={() => setShowIntro(false)} />;
  }

  return (
    <>
      <Header />
      <Sidebar />

      {(viewMode === "carousel" || viewMode === "grid") && (
        <div className={`mobile-category-fab ${mobileCategoriesOpen ? "is-open" : ""}`}>
          <button
            className="mobile-category-fab__toggle"
            onClick={() => setMobileCategoriesOpen((prev) => !prev)}
            aria-label="Toggle categories"
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55)", 
              transform: mobileCategoriesOpen ? "rotate(45deg)" : "rotate(0deg)"
            }}>
              <Plus size={18} strokeWidth={2.5} />
            </div>
          </button>

          <AnimatePresence>
            {mobileCategoriesOpen && (
              <motion.div
                className="mobile-category-panel"
                initial={{ opacity: 0, scale: 0.2, y: -6, x: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.2, y: -6, x: -6 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                style={{ transformOrigin: "top left" }}
              >
                {categories.map((cat) => {
                  const isActive = activeCategory === cat;
                  return (
                    <motion.button
                      key={cat}
                      className={`sidebar__category mobile-category-panel__item ${
                        isActive ? "sidebar__category--active" : "sidebar__category--sm"
                      }`}
                      onClick={() => {
                        setActiveCategory(cat);
                        setMobileCategoriesOpen(false);
                      }}
                      layout
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      {cat === "All"
                        ? t("all").toUpperCase()
                        : t(cat.toLowerCase()).toUpperCase()}
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {(viewMode === "carousel" || viewMode === "pdp") && <Carousel />}

      <AnimatePresence mode="wait">
        {viewMode === "grid" && <GridView key="grid" />}
      </AnimatePresence>

      <AnimatePresence>
        {viewMode === "pdp" && <ProductDetail key="pdp" />}
      </AnimatePresence>

      <Footer />
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageInner />
    </Suspense>
  );
}
