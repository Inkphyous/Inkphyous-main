"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "./providers/StoreProvider";

export default function Sidebar() {
  const { viewMode, activeCategory, setActiveCategory, categories, t } = useStore();
  const isVisible = viewMode === "carousel" || viewMode === "grid";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          className="sidebar"
          initial={{ x: -220, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -220, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        >

          {/* Categories — active one is large, others are small */}
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <div key={cat}>
                <motion.button
                  className={`sidebar__category ${
                    isActive ? "sidebar__category--active" : "sidebar__category--sm"
                  }`}
                  onClick={() => setActiveCategory(cat)}
                  layout
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {cat === "All" ? t("all").toUpperCase() : t(cat.toLowerCase()).toUpperCase()}
                </motion.button>
              </div>
            );
          })}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
