"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { buildProductsFromLocal } from "@/lib/catalog/composeProducts";
import { translations } from "@/translations/translations";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, onValue } from "firebase/database";

const StoreContext = createContext();

function normalizeProductSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapServerCartItems(items = []) {
  return items.map((item) => ({
    cartItemId: item.id,
    id: item.productId,
    productRefId: item.productRefId || null,
    name: item.name,
    nameAr: item.nameAr,
    image: item.image,
    imageUrl: item.imageUrl || item.image,
    color: item.color,
    size: item.size,
    quantity: Number(item.quantity || 1),
    priceINR: Number(item.priceINR || 0),
    discountPriceINR: Number(item.discountPriceINR || item.priceINR || 0),
  }));
}

export function StoreProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [catalogSource, setCatalogSource] = useState("local-fallback");
  const [productsLoading, setProductsLoading] = useState(true);

  // View state: "carousel" | "pdp" | "grid"
  const [viewMode, setViewMode] = useState("carousel");
  const [prevViewMode, setPrevViewMode] = useState("carousel");

  const [activeIndex, setActiveIndex] = useState(0);
  const [colorMap, setColorMap] = useState({});

  const [pdpProductId, setPdpProductId] = useState(null);
  const [pdpVariantId, setPdpVariantIdState] = useState(null);
  const [pdpCategoryVacantLeft, setPdpCategoryVacantLeft] = useState(false);

  const [activeCategoryState, setActiveCategoryState] = useState("All");
  const setActiveCategory = useCallback((cat) => {
    setActiveCategoryState(cat);
    setActiveIndex(0);
  }, []);
  const activeCategory = activeCategoryState;

  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [wishlistItems, setWishlistItems] = useState([]);

  const [language, setLanguage] = useState("en");
  const [showIntro, setShowIntro] = useState(true);
  const [contactPopupOpen, setContactPopupOpen] = useState(false);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [editProfilePopupOpen, setEditProfilePopupOpen] = useState(false);

  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState("Login to continue");

  const [isPDPScrolledToBottom, setIsPDPScrolledToBottom] = useState(false);

  const wishlistProductIds = useMemo(() => {
    return new Set(
      (wishlistItems || [])
        .map((item) => item.productId || item.id)
        .filter(Boolean)
    );
  }, [wishlistItems]);

  const categories = useMemo(() => {
    const uniqueCats = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return ["All", ...uniqueCats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "All") return products;
    return products.filter((p) => p.category === activeCategory);
  }, [products, activeCategory]);

  useEffect(() => {
    // setActiveIndex(0) is now handled synchronously in setActiveCategory
  }, []);

  const activeProduct = filteredProducts[activeIndex] || filteredProducts[0] || null;

  const getProductIndexById = useCallback(
    (productId) => products.findIndex((product) => product.id === productId),
    [products]
  );

  const getProductByVariantId = useCallback(
    (variantId) =>
      products.find((product) =>
        (product.variants || []).some((variant) => variant.id === variantId)
      ),
    [products]
  );

  const openLoginPrompt = useCallback((message = "Login to continue") => {
    setLoginPromptMessage(message);
    setLoginPromptOpen(true);
  }, []);

  const closeLoginPrompt = useCallback(() => {
    setLoginPromptOpen(false);
  }, []);

  const requireAuth = useCallback(
    (message = "Login to continue") => {
      if (user?.uid) return true;
      openLoginPrompt(message);
      return false;
    },
    [openLoginPrompt, user]
  );

  const getImageByColorIndex = useCallback((product, colorIdx) => {
    const colorName = product.availableColors?.[colorIdx];
    if (!colorName) return product.image;
    const variant = (product.variants || []).find(
      (v) => String(v.color).toLowerCase() === String(colorName).toLowerCase()
    );
    return variant?.mainImage || variant?.image || product.image;
  }, []);

  const setPdpVariantId = useCallback(
    (variantId) => {
      setPdpVariantIdState(variantId);
      setPdpCategoryVacantLeft(false);
      if (!variantId) return;
      const product = getProductByVariantId(variantId);
      if (!product) return;
      const variant = (product.variants || []).find((v) => v.id === variantId);
      if (!variant) return;
      const colorIndex = (product.availableColors || []).findIndex(
        (color) => String(color).toLowerCase() === String(variant.color).toLowerCase()
      );
      if (colorIndex !== -1) {
        setColorMap((prev) => ({ ...prev, [product.id]: colorIndex }));
      }
    },
    [getProductByVariantId]
  );

  const openProductById = useCallback(
    (productId, variantId = null, vacantLeft = true) => {
      let fIdx = filteredProducts.findIndex((p) => p.id === productId);
      if (fIdx === -1) {
        setActiveCategoryState("All");
        fIdx = products.findIndex((p) => p.id === productId);
      }
      if (fIdx === -1) return;

      const product = products.find((p) => p.id === productId);
      const colorIdx = colorMap[productId] || 0;
      const colorName = product.availableColors?.[colorIdx];
      let variant = variantId
        ? (product.variants || []).find((v) => v.id === variantId)
        : null;
      if (!variant) {
        variant =
          (product.variants || []).find(
            (v) => String(v.color).toLowerCase() === String(colorName).toLowerCase()
          ) || product.variants?.[0];
      }

      setPrevViewMode(viewMode);
      setActiveIndex(fIdx);
      setPdpProductId(product.id);
      setPdpVariantIdState(variant?.id || null);
      setPdpCategoryVacantLeft(vacantLeft);
      setViewMode("pdp");
    },
    [filteredProducts, products, colorMap, viewMode]
  );

  const openPDP = useCallback(
    (filteredIndex) => {
      const product = filteredProducts[filteredIndex];
      if (product) openProductById(product.id);
    },
    [filteredProducts, openProductById]
  );

  const openPDPByVariantId = useCallback(
    (variantId) => {
      if (!variantId) return;
      const product = getProductByVariantId(variantId);
      if (product) openProductById(product.id, variantId);
    },
    [getProductByVariantId, openProductById]
  );

  const openPDPByProductAndVariant = useCallback(
    ({ productId, variantId }) => {
      openProductById(productId, variantId);
    },
    [openProductById]
  );

  const switchPdpProduct = useCallback(
    (targetProductId) => {
      openProductById(targetProductId, null, false);
    },
    [openProductById]
  );

  const closePDP = useCallback(() => {
    setViewMode(prevViewMode === "pdp" ? "carousel" : prevViewMode);
    setTimeout(() => {
      setPdpProductId(null);
      setPdpVariantIdState(null);
      setPdpCategoryVacantLeft(false);
    }, 600);
  }, [prevViewMode]);

  const switchView = useCallback(
    (mode) => {
      setPrevViewMode(viewMode);
      setViewMode(mode);
    },
    [viewMode]
  );

  const setProductColor = useCallback((productId, colorIndex) => {
    setColorMap((prev) => ({ ...prev, [productId]: colorIndex }));

    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const colorName = product.availableColors?.[colorIndex];
    const variant = (product.variants || []).find(
      (v) => String(v.color).toLowerCase() === String(colorName).toLowerCase()
    );
    if (viewMode === "pdp" && product.id === pdpProductId && variant?.id) {
      setPdpVariantIdState(variant.id);
      setPdpCategoryVacantLeft(false);
    }
  }, [products, viewMode, pdpProductId]);

  const syncCartFromServer = useCallback(async (userId) => {
    if (!userId) {
      setCartLoading(false);
      return;
    }
    setCartLoading(true);
    try {
      const response = await fetch(`/api/cart?userId=${encodeURIComponent(userId)}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data?.success) return;
      setCartItems(mapServerCartItems(data.items || []));
    } catch {
      // Keep current state on failure.
    } finally {
      setCartLoading(false);
    }
  }, []);

  const syncWishlistFromServer = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/wishlist?userId=${encodeURIComponent(userId)}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data?.success) return;
      setWishlistItems(data.items || []);
    } catch {
      // Keep current state on failure.
    }
  }, []);

  useEffect(() => {
    let dbUnsubscribe = null;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        const userRef = ref(db, `users/${currentUser.uid}`);
        dbUnsubscribe = onValue(userRef, (snapshot) => {
          setUserData(snapshot.exists() ? snapshot.val() : null);
        });
        syncCartFromServer(currentUser.uid);
        syncWishlistFromServer(currentUser.uid);
      } else {
        setUserData(null);
        setCartItems([]);
        setWishlistItems([]);
        setCartLoading(false);
        if (dbUnsubscribe) {
          dbUnsubscribe();
          dbUnsubscribe = null;
        }
      }
    });

    return () => {
      unsubscribe();
      if (dbUnsubscribe) dbUnsubscribe();
    };
  }, [syncCartFromServer, syncWishlistFromServer]);

  const logout = useCallback(() => signOut(auth), []);

  const t = useCallback(
    (key, params = {}) => {
      const text = translations[language]?.[key] || key;
      if (params && Object.keys(params).length > 0) {
        let replacedText = text;
        Object.keys(params).forEach((param) => {
          replacedText = replacedText.replace(`{${param}}`, params[param]);
        });
        return replacedText;
      }
      return text;
    },
    [language]
  );

  useEffect(() => {
    let active = true;
    const loadCatalog = async () => {
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        const data = await response.json();
        if (!active) return;
        if (response.ok && data?.success && Array.isArray(data.products) && data.products.length) {
          setProducts(data.products);
          setCatalogSource(data.source || "supabase");
        } else {
          setProducts(buildProductsFromLocal());
          setCatalogSource("local-fallback");
        }
      } catch {
        if (!active) return;
        setProducts(buildProductsFromLocal());
        setCatalogSource("local-fallback");
      } finally {
        if (active) setProductsLoading(false);
      }
    };

    loadCatalog();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setColorMap((prev) => {
      const next = {};
      products.forEach((_, i) => {
        next[i] = Number.isInteger(prev[i]) ? prev[i] : 0;
      });
      return next;
    });
    setActiveIndex((prev) => {
      if (!products.length) return 0;
      return Math.min(prev, products.length - 1);
    });
  }, [products]);

  const addToCart = useCallback(
    async (item) => {
      if (!requireAuth("Login to continue")) return false;

      try {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            productId: item.id,
            size: item.size,
            quantity: item.quantity || 1,
          }),
        });
        const data = await response.json();
        if (response.ok && data?.success) {
          setCartItems(mapServerCartItems(data.items || []));
          setLastAddedItem(item);
          setTimeout(() => setLastAddedItem(null), 3000);
          return true;
        }
      } catch {
        // no-op
      }
      return false;
    },
    [requireAuth, user]
  );

  const removeFromCart = useCallback(
    async (index) => {
      const current = cartItems[index];
      if (!current || !user?.uid || !current.cartItemId) return;
      try {
        const response = await fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.uid, cartItemId: current.cartItemId }),
        });
        const data = await response.json();
        if (response.ok && data?.success) {
          setCartItems(mapServerCartItems(data.items || []));
        }
      } catch {
        // keep current UI
      }
    },
    [cartItems, user]
  );

  const updateQuantity = useCallback(
    async (index, newQuantity) => {
      const current = cartItems[index];
      if (!current || !user?.uid || !current.cartItemId) return;
      try {
        const response = await fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            cartItemId: current.cartItemId,
            quantity: newQuantity,
          }),
        });
        const data = await response.json();
        if (response.ok && data?.success) {
          setCartItems(mapServerCartItems(data.items || []));
        }
      } catch {
        // keep current UI
      }
    },
    [cartItems, user]
  );

  const editCartItem = useCallback(
    async (cartItemId, newProductId, newSize) => {
      if (!user?.uid || !cartItemId) return;
      try {
        const response = await fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            cartItemId,
            productId: newProductId,
            size: newSize,
          }),
        });
        const data = await response.json();
        if (response.ok && data?.success) {
          setCartItems(mapServerCartItems(data.items || []));
        }
      } catch {
        // keep current UI
      }
    },
    [user]
  );

  const isWishlisted = useCallback(
    (variantId) => wishlistProductIds.has(variantId),
    [wishlistProductIds]
  );

  const toggleWishlist = useCallback(
    async (variantId) => {
      if (!requireAuth("Login to continue")) return false;
      const alreadyWishlisted = wishlistProductIds.has(variantId);
      try {
        const response = await fetch("/api/wishlist", {
          method: alreadyWishlisted ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.uid, productId: variantId }),
        });
        const data = await response.json();
        if (response.ok && data?.success) {
          setWishlistItems(data.items || []);
          return true;
        }
      } catch {
        // no-op
      }
      return false;
    },
    [requireAuth, wishlistProductIds, user]
  );

  const removeFromWishlist = useCallback(
    async (variantId) => {
      if (!user?.uid) return;
      try {
        const response = await fetch("/api/wishlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.uid, productId: variantId }),
        });
        const data = await response.json();
        if (response.ok && data?.success) setWishlistItems(data.items || []);
      } catch {
        // no-op
      }
    },
    [user]
  );

  const cartTotal = useMemo(
    () =>
      cartItems.reduce((sum, item) => {
        const price = item.discountPriceINR || item.priceINR || 0;
        return sum + price * (item.quantity || 1);
      }, 0),
    [cartItems]
  );

  const value = {
    products,
    catalogSource,
    productsLoading,
    filteredProducts,
    categories,
    activeIndex,
    setActiveIndex,
    activeProduct,
    colorMap,
    setProductColor,
    getImageByColorIndex,
    activeCategory,
    setActiveCategory,

    viewMode,
    switchView,
    openPDP,
    closePDP,
    openPDPByVariantId,
    openPDPByProductAndVariant,
    switchPdpProduct,

    pdpProductId,
    pdpVariantId,
    setPdpVariantId,
    pdpCategoryVacantLeft,
    setPdpCategoryVacantLeft,

    cartItems,
    cartLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    editCartItem,
    cartTotal,
    lastAddedItem,

    wishlistItems,
    isWishlisted,
    toggleWishlist,
    removeFromWishlist,

    language,
    setLanguage,
    t,

    showIntro,
    setShowIntro,
    contactPopupOpen,
    setContactPopupOpen,

    user,
    authLoading,
    logout,
    userData,
    editProfilePopupOpen,
    setEditProfilePopupOpen,

    loginPromptOpen,
    loginPromptMessage,
    openLoginPrompt,
    closeLoginPrompt,
    requireAuth,

    isPDPScrolledToBottom,
    setIsPDPScrolledToBottom,

    normalizeProductSlug,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
};

