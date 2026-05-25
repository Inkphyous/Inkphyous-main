"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import { app as defaultApp } from "@/lib/firebase";
import { Plus, Save, Trash2, LogOut, Users } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const COLOR_PALETTE = [
  { name: "Black", hex: "#111111" },
  { name: "White", hex: "#f5f5f5" },
  { name: "Grey", hex: "#8f8f8f" },
  { name: "Blue", hex: "#1f4dd6" },
  { name: "Green", hex: "#2f8f48" },
  { name: "Pink", hex: "#d56793" },
  { name: "Red", hex: "#c62828" },
  { name: "Brown", hex: "#7b4b2a" },
  { name: "Beige", hex: "#d8c3a5" },
  { name: "Purple", hex: "#6b46c1" },
  { name: "Orange", hex: "#f97316" },
  { name: "Yellow", hex: "#eab308" },
];

function emptyVariant(colorName = "Black", colorHex = "#111111") {
  return {
    productId: "",
    colorId: "",
    colorName,
    colorHex,
    priceINR: "",
    discountPriceINR: "",
    mainImage: "",
    galleryImages: [],
    sizes: ALL_SIZES.map((size, position) => ({
      size,
      exists: true,
      inStock: true,
      position,
    })),
    isActive: true,
  };
}

function emptyDraft() {
  return {
    category: { id: "", name: "", slug: "" },
    product: {
      id: "",
      slug: "",
      name: "",
      nameAr: "",
      brand: "Inkphyous",
      subcategory: "",
      summary: "",
      summaryAr: "",
      description: "",
      descriptionAr: "",
      details: { fit: "", fabric: "", features: "", washCare: "" },
      detailsAr: {},
      priceINR: "",
      discountPriceINR: "",
      rating: "",
      reviews: "",
      position: 0,
      isActive: true,
    },
    variants: [emptyVariant()],
  };
}

function groupProducts(catalog) {
  if (!catalog) return [];
  const categoryById = new Map((catalog.categories || []).map((c) => [c.id, c]));
  const colorsByProduct = new Map();
  const variantsByProduct = new Map();
  const imagesByVariant = new Map();
  const sizesByVariant = new Map();

  for (const color of catalog.colors || []) {
    const bucket = colorsByProduct.get(color.product_id) || [];
    bucket.push(color);
    colorsByProduct.set(color.product_id, bucket);
  }
  for (const variant of catalog.variants || []) {
    const bucket = variantsByProduct.get(variant.product_ref_id) || [];
    bucket.push(variant);
    variantsByProduct.set(variant.product_ref_id, bucket);
  }
  for (const image of catalog.images || []) {
    const bucket = imagesByVariant.get(image.variant_product_id) || [];
    bucket.push(image);
    imagesByVariant.set(image.variant_product_id, bucket);
  }
  for (const sizeRow of catalog.sizes || []) {
    const bucket = sizesByVariant.get(sizeRow.variant_product_id) || [];
    bucket.push(sizeRow);
    sizesByVariant.set(sizeRow.variant_product_id, bucket);
  }

  const grouped = [];
  for (const product of catalog.products || []) {
    const category = categoryById.get(product.category_id) || { id: "unknown", name: "Uncategorized" };
    const colors = colorsByProduct.get(product.id) || [];
    const colorById = new Map(colors.map((c) => [c.id, c]));
    const variants = (variantsByProduct.get(product.id) || []).map((variant) => {
      const c = colorById.get(variant.color_ref_id);
      const orderedImages = (imagesByVariant.get(variant.product_id) || [])
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((i) => i.image_url);
      const galleryImages = orderedImages.filter((i) => i !== variant.main_image_url);
      const sizesFromDb = sizesByVariant.get(variant.product_id) || [];
      const colorName = c?.color_name || variant.color_name || "Default";
      const fallbackSizesFromDetails = product.details?.variant_sizes?.[colorName] || [];
      
      const sizes = ALL_SIZES.map((sizeName, position) => {
        const found = sizesFromDb.find(s => s.size === sizeName);
        if (found) {
          return { size: sizeName, exists: true, inStock: !!found.in_stock, position: found.position ?? position };
        }
        
        const foundInDetails = fallbackSizesFromDetails.find(s => s.size === sizeName);
        if (foundInDetails) {
          return { size: sizeName, exists: true, inStock: !!foundInDetails.inStock, position: foundInDetails.position ?? position };
        }
        
        const isMigrated = product.details?.migrated_sizes;
        if (!isMigrated && sizesFromDb.length === 0 && fallbackSizesFromDetails.length === 0 && Array.isArray(product.size_options) && product.size_options.includes(sizeName)) {
          return { size: sizeName, exists: true, inStock: true, position };
        }
        
        return { size: sizeName, exists: false, inStock: false, position };
      });

      return {
        productId: variant.product_id,
        colorId: c?.id || "",
        colorName: c?.color_name || variant.color_name || "Default",
        colorHex: c?.color_hex || variant.color_hex || "#111111",
        priceINR: variant.price_inr,
        discountPriceINR: variant.discount_price_inr,
        mainImage: variant.main_image_url,
        galleryImages,
        sizes,
        isActive: !!variant.is_active,
      };
    });

    grouped.push({
      category: category || null,
      product,
      variants,
    });
  }
  return grouped;
}

export default function AdminPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [idToken, setIdToken] = useState("");
  const [catalog, setCatalog] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [usersList, setUsersList] = useState([]);
  const [draft, setDraft] = useState(emptyDraft());
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [uploadingKey, setUploadingKey] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const adminAuth = useMemo(() => {
    const adminApp = getApps().find(a => a.name === "AdminApp") || initializeApp(defaultApp.options, "AdminApp");
    return getAuth(adminApp);
  }, []);

  const groupedProducts = useMemo(() => groupProducts(catalog), [catalog]);

  const categories = useMemo(
    () => [...new Set(groupedProducts.map((p) => p.category?.name).filter(Boolean))],
    [groupedProducts]
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(adminAuth, async (user) => {
      if (!user) {
        setAuthLoading(false);
        setIsAdmin(false);
        return;
      }

      const token = await user.getIdToken();
      setIdToken(token);
      const res = await fetch("/api/admin/auth", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setIsAdmin(Boolean(data?.success));
      setAuthLoading(false);
    });
    return () => unsub();
  }, [adminAuth]);

  const loadCatalog = async (token) => {
    setCatalogLoading(true);
    try {
      const res = await fetch("/api/admin/catalog", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.success) {
        alert(data?.error || "An unknown error occurred while loading the catalog.");
        return;
      }
      setCatalog(data);
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && idToken) loadCatalog(idToken);
  }, [idToken, isAdmin]);

  const loadUsers = async (token) => {
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        const list = Object.entries(resData.data).map(([uid, details]) => ({
          uid,
          ...details,
        }));
        setUsersList(list);
      } else {
        setUsersList([]);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
      setUsersList([]);
    }
  };

  useEffect(() => {
    if (isAdmin && idToken && activeTab === "users") {
      loadUsers(idToken);
    }
  }, [isAdmin, activeTab, idToken]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(adminAuth, email, password);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const startAddNew = () => {
    setDraft(emptyDraft());
    setIsNewCategory(false);
    setActiveTab("add");
  };

  const startEdit = (entry) => {
    const category = entry.category || {};
    const product = entry.product || {};
    setDraft({
      category: {
        id: category.id || "",
        name: category.name || "",
        slug: category.slug || "",
      },
      product: {
        id: product.id || "",
        slug: product.slug || "",
        name: product.name || "",
        nameAr: product.name_ar || "",
        brand: product.brand || "Inkphyous",
        subcategory: product.subcategory || "",
        summary: product.summary || "",
        summaryAr: product.summary_ar || "",
        description: product.description || "",
        descriptionAr: product.description_ar || "",
        details: {
          fit: product.details?.fit || "",
          fabric: product.details?.fabric || "",
          features: product.details?.features || "",
          washCare: product.details?.washCare || "",
        },
        detailsAr: product.details_ar || {},
        priceINR: product.price_inr || "",
        discountPriceINR: product.discount_price_inr || "",
        rating: product.rating || "",
        reviews: product.reviews || "",
        position: product.position || 0,
        isActive: product.is_active !== false,
      },
      variants: entry.variants?.length ? entry.variants : [emptyVariant()],
    });
    setIsNewCategory(false);
    setActiveTab("add");
  };

  const handleUpload = async (file, folder, variantIndex, isMain) => {
    if (!file || !idToken) return;
    const key = `${variantIndex}-${isMain ? "main" : "gallery"}`;
    setUploadingKey(key);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data?.success) return;
      const url = data.url;

      setDraft((prev) => {
        const next = structuredClone(prev);
        if (!next.variants[variantIndex]) return prev;
        if (isMain) {
          next.variants[variantIndex].mainImage = url;
        } else {
          next.variants[variantIndex].galleryImages.push(url);
        }
        return next;
      });
    } finally {
      setUploadingKey("");
    }
  };

  const saveDraft = async () => {
    if (!idToken) return;
    setSaveLoading(true);
    try {
      const payload = {
        category: draft.category,
        product: {
          ...draft.product,
          details: {
            fit: draft.product.details?.fit || "",
            fabric: draft.product.details?.fabric || "",
            features: draft.product.details?.features || "",
            washCare: draft.product.details?.washCare || "",
          },
        },
        variants: draft.variants.map((variant) => ({
          ...variant,
          sizes: variant.sizes
            .filter((sizeEntry) => sizeEntry.exists)
            .map((sizeEntry) => ({
              size: sizeEntry.size,
              inStock: !!sizeEntry.inStock,
            })),
        })),
      };

      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ operation: "upsertProduct", payload }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.success) {
        alert(data?.error || "An unknown error occurred while saving.");
        return;
      }
      await loadCatalog(idToken); // Reload properly from backend
      setActiveTab("products");
      setDraft(emptyDraft());
    } finally {
      setSaveLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!idToken || !productId) return;
    const res = await fetch(`/api/admin/catalog?productId=${encodeURIComponent(productId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${idToken}` },
    });
    const data = await res.json();
    if (res.ok && data?.success) {
      setCatalog(data);
    }
  };

  if (authLoading) {
    return <div className="admin-page"><div className="admin-shell">Checking admin access...</div></div>;
  }

  if (!idToken) {
    return (
      <div className="login-page">
        <div className="login-page__bg" />
        <div className="login-container" style={{ margin: "auto" }}>
          <div className="login-step" style={{ padding: "2rem" }}>
            <h1 className="login-heading">Admin Dashboard</h1>
            <h2 className="login-email-heading">Secure Login</h2>
            <p className="login-email-subtitle">Please sign in with your administrator credentials.</p>

            <form onSubmit={handleLogin} className="login-email-form">
              <div className="floating-group">
                <input
                  type="email"
                  className="login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label className="floating-label">Admin Email</label>
              </div>

              <div className="floating-group">
                <input
                  type="password"
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <label className="floating-label">Password</label>
              </div>

              {loginError && (
                <div style={{ color: "#e11d48", fontSize: "12px", marginBottom: "16px", textAlign: "center", fontWeight: "500" }}>
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="login-btn login-btn--dark"
                disabled={isLoggingIn}
                style={{ marginTop: "1rem" }}
              >
                {isLoggingIn ? "Authenticating..." : "Login to Dashboard"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <div className="admin-shell">
          <h1 className="admin-title">Unauthorized</h1>
          <p className="admin-muted">You do not have admin access.</p>
          <button className="admin-btn" style={{ marginTop: "1rem" }} onClick={() => signOut(adminAuth)}>
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <aside className="admin-sidebar" style={{ fontFamily: '"Google Sans", sans-serif' }}>
        <h2 className="admin-sidebar__brand">INKPHYOUS Admin</h2>
        <button
          className={`admin-sidebar__btn ${activeTab === "products" ? "is-active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          Products
        </button>
        <button
          className={`admin-sidebar__btn ${activeTab === "users" ? "is-active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <Users size={14} />
          Users
        </button>
        <button
          className={`admin-sidebar__btn ${activeTab === "add" ? "is-active" : ""}`}
          onClick={startAddNew}
        >
          <Plus size={14} />
          Add New Product
        </button>
        <div style={{ flexGrow: 1 }} />
        <button
          className="admin-sidebar__btn"
          style={{ color: "#ef4444", marginTop: "auto" }}
          onClick={() => signOut(adminAuth)}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </aside>

      <main className="admin-main">
        {activeTab === "products" && (
          <section>
            <h1 className="admin-title">Products</h1>
            {catalogLoading ? <p className="admin-muted">Loading...</p> : null}
            {categories.map((categoryName) => (
              <div key={categoryName} className="admin-category-block">
                <h3>{categoryName}</h3>
                <div className="admin-product-grid">
                  {groupedProducts
                    .filter((entry) => entry.category?.name === categoryName)
                    .map((entry) => (
                      <article key={entry.product.id} className="admin-product-card">
                        <div className="admin-product-card__head">
                          <div>
                            <h4>{entry.product.name}</h4>
                            <p className="admin-muted">{entry.variants.length} color variants</p>
                          </div>
                          <div className="admin-row">
                            <button className="admin-btn" onClick={() => startEdit(entry)}>Edit</button>
                            <button
                              className="admin-btn admin-btn--danger"
                              onClick={() => deleteProduct(entry.product.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="admin-chip-row">
                          {entry.variants.map((variant) => (
                            <span key={variant.productId} className="admin-chip">
                              {variant.colorName}
                            </span>
                          ))}
                        </div>
                      </article>
                    ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {activeTab === "users" && (
          <section>
            <h1 className="admin-title">Users</h1>
            {usersList.length === 0 ? (
              <p className="admin-muted">No users found.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  <thead>
                    <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                      <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151" }}>UID</th>
                      <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151" }}>Name</th>
                      <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151" }}>Email</th>
                      <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151" }}>Phone Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u, i) => (
                      <tr key={u.uid} style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: i % 2 === 0 ? "white" : "#fcfcfc" }}>
                        <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "14px", fontFamily: "monospace" }}>{u.uid}</td>
                        <td style={{ padding: "12px 16px", color: "#111827", fontWeight: "500" }}>
                          {u.name || u.displayName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "N/A"}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#374151" }}>{u.email || "N/A"}</td>
                        <td style={{ padding: "12px 16px", color: "#374151" }}>{u.mobileNumber || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeTab === "add" && (
          <section className="admin-form-wrap">
            <h1 className="admin-title">{draft.product.id ? "Edit Product" : "Add Product"}</h1>
            <div className="admin-form-grid">
              <label>
                Category
                <select
                  value={isNewCategory ? "+ Add New Category" : draft.category.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "+ Add New Category") {
                      setIsNewCategory(true);
                      setDraft((prev) => ({ ...prev, category: { ...prev.category, name: "" } }));
                    } else {
                      setIsNewCategory(false);
                      setDraft((prev) => ({ ...prev, category: { ...prev.category, name: val } }));
                    }
                  }}
                  style={{ marginBottom: isNewCategory ? "0.5rem" : "0", backgroundColor: "#1e1e1e", color: "#fff" }}
                >
                  <option value="" disabled style={{ backgroundColor: "#1e1e1e", color: "#fff" }}>Select Category</option>
                  {categories.filter(c => c && c !== "Uncategorized").map((cat) => (
                    <option key={cat} value={cat} style={{ backgroundColor: "#1e1e1e", color: "#fff" }}>{cat}</option>
                  ))}
                  <option value="+ Add New Category" style={{ backgroundColor: "#1e1e1e", color: "#fff" }}>+ Add New Category</option>
                </select>
                {isNewCategory && (
                  <input
                    value={draft.category.name}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, category: { ...prev.category, name: e.target.value } }))
                    }
                    placeholder="New Category Name (e.g., Jerseys)"
                  />
                )}
              </label>
              <label>
                Product Name
                <input
                  value={draft.product.name}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, product: { ...prev.product, name: e.target.value } }))
                  }
                  placeholder="Jersey Elements"
                />
              </label>
              <label>
                Price
                <input
                  value={draft.product.priceINR}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, product: { ...prev.product, priceINR: e.target.value } }))
                  }
                  placeholder="1945"
                />
              </label>
              <label>
                Discount Price
                <input
                  value={draft.product.discountPriceINR}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      product: { ...prev.product, discountPriceINR: e.target.value },
                    }))
                  }
                  placeholder="1745"
                />
              </label>
            </div>

            <label className="admin-textarea-label">
              Description
              <textarea
                value={draft.product.description}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    product: { ...prev.product, description: e.target.value },
                  }))
                }
                rows={4}
              />
            </label>

            <div className="admin-details-grid">
              {["fit", "fabric", "features", "washCare"].map((key) => (
                <label key={key}>
                  {key}
                  <input
                    value={draft.product.details?.[key] || ""}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        product: {
                          ...prev.product,
                          details: { ...prev.product.details, [key]: e.target.value },
                        },
                      }))
                    }
                    placeholder={`Optional ${key}`}
                  />
                </label>
              ))}
            </div>

            <div className="admin-palette">
              <p>Quick add colors:</p>
              <div className="admin-palette__chips">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color.name}
                    className="admin-color-chip"
                    style={{ background: color.hex }}
                    onClick={() =>
                      setDraft((prev) => {
                        const exists = prev.variants.some(
                          (variant) =>
                            variant.colorName.toLowerCase() === color.name.toLowerCase()
                        );
                        if (exists) return prev;
                        return {
                          ...prev,
                          variants: [...prev.variants, emptyVariant(color.name, color.hex)],
                        };
                      })
                    }
                    title={color.name}
                  />
                ))}
                <input
                  type="color"
                  title="Add Custom Color"
                  onChange={(e) => {
                    const hex = e.target.value;
                    setDraft((prev) => ({
                      ...prev,
                      variants: [...prev.variants, emptyVariant("Custom", hex)],
                    }));
                    e.target.value = "#000000"; // Reset after adding
                  }}
                  style={{
                    width: "24px",
                    height: "24px",
                    padding: "0",
                    border: "1px solid #333",
                    borderRadius: "50%",
                    cursor: "pointer",
                    background: "transparent",
                    overflow: "hidden"
                  }}
                />
              </div>
            </div>

            <div className="admin-variants">
              {draft.variants.map((variant, variantIndex) => (
                <div key={`${variant.colorName}-${variantIndex}`} className="admin-variant-card">
                  <div className="admin-row admin-row--space">
                    <h4>Color Variant #{variantIndex + 1}</h4>
                    <button
                      className="admin-btn admin-btn--danger"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          variants: prev.variants.filter((_, i) => i !== variantIndex),
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>

                  <div className="admin-form-grid">
                    <label>
                      Color Name
                      <input
                        value={variant.colorName}
                        onChange={(e) =>
                          setDraft((prev) => {
                            const next = structuredClone(prev);
                            next.variants[variantIndex].colorName = e.target.value;
                            return next;
                          })
                        }
                      />
                    </label>
                    <label>
                      Color Hex
                      <input
                        value={variant.colorHex}
                        onChange={(e) =>
                          setDraft((prev) => {
                            const next = structuredClone(prev);
                            next.variants[variantIndex].colorHex = e.target.value;
                            return next;
                          })
                        }
                      />
                    </label>
                    <label>
                      Variant Price
                      <input
                        value={variant.priceINR}
                        onChange={(e) =>
                          setDraft((prev) => {
                            const next = structuredClone(prev);
                            next.variants[variantIndex].priceINR = e.target.value;
                            return next;
                          })
                        }
                      />
                    </label>
                    <label>
                      Variant Discount
                      <input
                        value={variant.discountPriceINR}
                        onChange={(e) =>
                          setDraft((prev) => {
                            const next = structuredClone(prev);
                            next.variants[variantIndex].discountPriceINR = e.target.value;
                            return next;
                          })
                        }
                      />
                    </label>
                  </div>

                  <div className="admin-upload-row" style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                    <label 
                      style={{ border: "2px dashed #ccc", borderRadius: "8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "120px", height: "120px", overflow: "hidden", position: "relative" }}
                    >
                      {variant.mainImage ? (
                        <img src={variant.mainImage} alt="Main" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: "12px", color: "#666", fontWeight: "500" }}>+ Main Image</span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) =>
                          handleUpload(
                            e.target.files?.[0],
                            `admin/${draft.category.name || "misc"}/${draft.product.name || "product"}/${variant.colorName || "color"}`,
                            variantIndex,
                            true
                          )
                        }
                      />
                    </label>
                    <label 
                      style={{ border: "2px dashed #ccc", borderRadius: "8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "120px", height: "120px", background: "#fafafa" }}
                    >
                      <span style={{ fontSize: "12px", color: "#666", fontWeight: "500", textAlign: "center", padding: "0 10px" }}>+ Add Gallery Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) =>
                          handleUpload(
                            e.target.files?.[0],
                            `admin/${draft.category.name || "misc"}/${draft.product.name || "product"}/${variant.colorName || "color"}`,
                            variantIndex,
                            false
                          )
                        }
                      />
                    </label>
                    {uploadingKey === `${variantIndex}-main` ||
                    uploadingKey === `${variantIndex}-gallery` ? (
                      <span className="admin-muted" style={{ alignSelf: "center" }}>Uploading...</span>
                    ) : null}
                  </div>

                  <div className="admin-image-preview-row" style={{ marginTop: "1rem", flexWrap: "wrap" }}>
                    {variant.galleryImages.map((img, imageIndex) => (
                      <div key={`${img}-${imageIndex}`} className="admin-image-preview" style={{ width: "80px", height: "80px", position: "relative" }}>
                        <img src={img} alt={`Gallery ${imageIndex + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px" }} />
                        <button
                          className="admin-btn admin-btn--danger"
                          style={{ position: "absolute", top: "4px", right: "4px", padding: "4px", minWidth: "auto", minHeight: "auto" }}
                          onClick={() =>
                            setDraft((prev) => {
                              const next = structuredClone(prev);
                              next.variants[variantIndex].galleryImages = next.variants[
                                variantIndex
                              ].galleryImages.filter((_, i) => i !== imageIndex);
                              return next;
                            })
                          }
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="admin-size-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "1rem" }}>
                    {variant.sizes.map((sizeEntry, sizeIndex) => (
                      <div key={sizeEntry.size} style={{ display: "flex", flexDirection: "column", gap: "0.25rem", background: "#1e1e1e", border: "1px solid #333", padding: "0.5rem", borderRadius: "4px" }}>
                        <span style={{ fontWeight: 600, fontSize: "14px" }}>{sizeEntry.size}</span>
                        <label className="admin-size-row" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "12px", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={!!sizeEntry.exists}
                            onChange={(e) =>
                              setDraft((prev) => {
                                const next = structuredClone(prev);
                                next.variants[variantIndex].sizes[sizeIndex].exists = e.target.checked;
                                if (!e.target.checked) next.variants[variantIndex].sizes[sizeIndex].inStock = false;
                                return next;
                              })
                            }
                          />
                          Exists
                        </label>
                        <label className="admin-size-row" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "12px", cursor: sizeEntry.exists ? "pointer" : "not-allowed" }}>
                          <input
                            type="checkbox"
                            checked={!!sizeEntry.inStock}
                            disabled={!sizeEntry.exists}
                            onChange={(e) =>
                              setDraft((prev) => {
                                const next = structuredClone(prev);
                                next.variants[variantIndex].sizes[sizeIndex].inStock = e.target.checked;
                                return next;
                              })
                            }
                          />
                          In Stock
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-row">
              <button className="admin-btn" onClick={() => setDraft((prev) => ({ ...prev, variants: [...prev.variants, emptyVariant()] }))}>
                <Plus size={14} /> Add Color Variant
              </button>
              <button className="admin-btn admin-btn--primary" onClick={saveDraft} disabled={saveLoading}>
                <Save size={14} /> {saveLoading ? "Saving..." : "Save Product"}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
