"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, onIdTokenChanged, getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import { app as defaultApp } from "@/lib/firebase";
import { Plus, Save, Trash2, LogOut, Users, MessageSquare, Download, Package, X, Eye, EyeOff, CheckCircle, Truck, Bell } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { getMessaging, getToken } from "firebase/messaging";
import { db } from "@/lib/firebase";
import AdminSizeChart from "@/components/admin/AdminSizeChart";
import AdminLegalities from "@/components/admin/AdminLegalities";
import { FileText, Ruler } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

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
    variantName: "",
    semiDescription: "",
    description: "",
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
      tagline: "",
      taglineAr: "",
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
        variantName: c?.variant_name || "",
        semiDescription: product.details?.variant_semi_descriptions?.[colorName] || "",
        description: c?.variant_description || "",
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

function ColorEditor({ value, onChange, colors }) {
  const [refObj, setRefObj] = useState(null);
  const [formatState, setFormatState] = useState({ bold: false, italic: false, color: "" });

  useEffect(() => {
    if (refObj && value !== refObj.innerHTML) {
      refObj.innerHTML = value;
    }
  }, [value, refObj]);

  const updateFormatState = () => {
    if (!refObj) return;
    const isBold = document.queryCommandState("bold");
    const isItalic = document.queryCommandState("italic");
    const color = document.queryCommandValue("foreColor");
    
    let hexColor = "";
    if (color && color.startsWith("rgb")) {
      const rgb = color.match(/\d+/g);
      if (rgb && rgb.length === 3) {
        hexColor = "#" + rgb.map(x => parseInt(x).toString(16).padStart(2, "0")).join("");
      }
    } else {
      hexColor = color;
    }

    setFormatState({
      bold: isBold,
      italic: isItalic,
      color: hexColor,
    });
  };

  const applyColor = (hex) => {
    document.execCommand("styleWithCSS", false, true);
    document.execCommand("foreColor", false, hex);
    if (refObj) refObj.focus();
    if (refObj) onChange(refObj.innerHTML);
    updateFormatState();
  };

  const applyFormat = (command) => {
    document.execCommand(command, false, null);
    if (refObj) refObj.focus();
    if (refObj) onChange(refObj.innerHTML);
    updateFormatState();
  };

  return (
    <div style={{ background: "white", color: "black", borderRadius: "8px", overflow: "hidden", border: "1px solid #ccc" }}>
      <div style={{ padding: "8px", borderBottom: "1px solid #eee", display: "flex", gap: "6px", flexWrap: "wrap", background: "#f8f9fa", alignItems: "center" }}>
         <button
           type="button"
           onClick={(e) => { e.preventDefault(); applyFormat("bold"); }}
           style={{ width: "24px", height: "24px", background: "#fff", border: formatState.bold ? "2px solid #000" : "1px solid #d1d5db", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", padding: 0 }}
           title="Bold"
         >
           B
         </button>
         <button
           type="button"
           onClick={(e) => { e.preventDefault(); applyFormat("italic"); }}
           style={{ width: "24px", height: "24px", background: "#fff", border: formatState.italic ? "2px solid #000" : "1px solid #d1d5db", borderRadius: "4px", cursor: "pointer", fontStyle: "italic", padding: 0 }}
           title="Italic"
         >
           I
         </button>
         <div style={{ width: "1px", height: "16px", background: "#ccc", margin: "0 4px" }} />
         {colors.map(c => {
           // Basic comparison (document.queryCommandValue might return uppercase hex)
           const isActive = formatState.color && formatState.color.toLowerCase() === c.hex.toLowerCase();
           return (
             <button 
               key={c.hex} 
               type="button" 
               onClick={(e) => { e.preventDefault(); applyColor(c.hex); }}
               style={{ width: "24px", height: "24px", background: c.hex, border: isActive ? "2px solid #000" : "1px solid #d1d5db", borderRadius: "50%", cursor: "pointer", padding: 0 }}
               title={c.name}
             />
           );
         })}
      </div>
      <div 
        ref={setRefObj}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onKeyUp={updateFormatState}
        onMouseUp={updateFormatState}
        onFocus={updateFormatState}
        style={{ padding: "12px", minHeight: "120px", outline: "none", fontSize: "14px", fontFamily: "inherit", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      />
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const pathParts = pathname.split("/");
  const currentTabFromUrl = pathParts.length > 2 && pathParts[2] ? pathParts[2] : "products";

  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [idToken, setIdToken] = useState("");
  const [catalog, setCatalog] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  
  const [activeTab, setActiveTabState] = useState(currentTabFromUrl);

  useEffect(() => {
    if (currentTabFromUrl) {
      setActiveTabState(currentTabFromUrl);
    }
    
    // Handle browser back/forward buttons seamlessly
    const handlePopState = () => {
      const parts = window.location.pathname.split("/");
      const tab = parts.length > 2 && parts[2] ? parts[2] : "products";
      setActiveTabState(tab);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentTabFromUrl]);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    window.history.pushState(null, "", `/admin/${tab}`);
  };
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState("idle");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        setNotificationStatus("success");
      }
    }
  }, []);

  const handleAllowNotifications = async () => {
    try {
      setNotificationStatus("loading");
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
        const messaging = getMessaging(defaultApp);
        const token = await getToken(messaging, { 
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration
        });
        
        if (token) {
          // Send token to backend
          const res = await fetch("/api/admin/fcm-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token })
          });
          if (res.ok) {
            setNotificationStatus("success");
            alert("Notifications enabled! You will now be alerted for new orders.");
          } else {
            throw new Error("Failed to save token to database");
          }
        } else {
          throw new Error("No token returned from Firebase.");
        }
      } else {
        setNotificationStatus("error");
        alert("Permission denied. Please allow notifications in your browser settings.");
      }
    } catch (err) {
      console.error("Error allowing notifications:", err);
      setNotificationStatus("error");
      alert(`Failed to enable notifications: ${err.message}. Ensure VAPID key is set in .env.local.`);
    }
  };
  const [queriesList, setQueriesList] = useState([]);
  const [queriesLoading, setQueriesLoading] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [uploadingKey, setUploadingKey] = useState("");
  const [ordersList, setOrdersList] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shipmentForm, setShipmentForm] = useState(null);
  const [orderSubTab, setOrderSubTab] = useState("successful");
  const [shippingSubTab, setShippingSubTab] = useState("shipping");
  const [pendingUploads, setPendingUploads] = useState({});
  const [deletedImages, setDeletedImages] = useState([]);
  const [saveStatus, setSaveStatus] = useState("");
  const [compressingKey, setCompressingKey] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const adminAuth = useMemo(() => {
    const adminApp = getApps().find(a => a.name === "AdminApp") || initializeApp(defaultApp.options, "AdminApp");
    return getAuth(adminApp);
  }, []);

  const groupedProducts = useMemo(() => groupProducts(catalog), [catalog]);

  useEffect(() => {
    const unsub = onIdTokenChanged(adminAuth, async (user) => {
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
    setUsersLoading(true);
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
    } finally {
      setUsersLoading(false);
    }
  };

  const loadQueries = async (token) => {
    setQueriesLoading(true);
    try {
      const res = await fetch("/api/admin/queries", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        const list = Object.entries(resData.data)
          .map(([id, details]) => ({ id, ...details }))
          .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        setQueriesList(list);
      } else {
        setQueriesList([]);
      }
    } catch (err) {
      console.error("Failed to load queries:", err);
      setQueriesList([]);
    } finally {
      setQueriesLoading(false);
    }
  };

  const handleExportQueries = () => {
    if (queriesList.length === 0) return;
    const headers = ["Date", "Name", "Email", "Subject", "Message"];
    const csvContent = [
      headers.join(","),
      ...queriesList.map((q) => {
        const date = q.timestamp ? new Date(q.timestamp).toLocaleDateString() : "N/A";
        return `"${date}","${(q.name || "").replace(/"/g, '""')}","${(q.email || "").replace(/"/g, '""')}","${(q.subject || "").replace(/"/g, '""')}","${(q.message || "").replace(/"/g, '""')}"`;
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "queries.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteQuery = async (queryId) => {
    if (!window.confirm("Are you sure you want to delete this query?")) return;
    try {
      const res = await fetch("/api/admin/queries", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ id: queryId }),
      });
      const data = await res.json();
      if (data.success) {
        setQueriesList((prev) => prev.filter((q) => q.id !== queryId));
      } else {
        alert("Failed to delete query.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting query.");
    }
  };

  useEffect(() => {
    if (isAdmin && idToken && activeTab === "users") {
      loadUsers(idToken);
    } else if (isAdmin && idToken && activeTab === "queries") {
      loadQueries(idToken);
    }
  }, [isAdmin, activeTab, idToken]);

  const loadOrders = async (token) => {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const resData = await res.json();
      if (resData.success && resData.orders) {
        setOrdersList(resData.orders);
      } else {
        setOrdersList([]);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
      setOrdersList([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && idToken && activeTab === "orders") {
      loadOrders(idToken);
    }
  }, [isAdmin, activeTab, idToken]);

  const handleMoveToShipment = (order) => {
    setSelectedOrder(null);
    setShipmentForm({
      order,
      weight: "0.5",
      length: "10",
      breadth: "10",
      height: "10"
    });
  };

  const submitShipment = async (e) => {
    e.preventDefault();
    if (!shipmentForm || !shipmentForm.order) return;
    
    setSaveLoading(true);
    setSaveStatus("Creating Shiprocket Order...");
    try {
      const res = await fetch("/api/admin/shiprocket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          orderId: shipmentForm.order.orderId || shipmentForm.order.id,
          orderData: shipmentForm.order,
          packageDetails: {
            weight: Number(shipmentForm.weight),
            length: Number(shipmentForm.length),
            breadth: Number(shipmentForm.breadth),
            height: Number(shipmentForm.height)
          }
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrdersList(prev => prev.map(o => 
          (o.id === (shipmentForm.order.orderId || shipmentForm.order.id))
            ? { ...o, status: "SHIPPING", shiprocket: data.fulfillmentDetails }
            : o
        ));
        setShipmentForm(null);
        setSelectedOrder(null);
        alert("Order successfully moved to shipment!");
      } else {
        alert(data.error || "Failed to process shipment");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaveLoading(false);
      setSaveStatus("");
    }
  };

  const handleSchedulePickup = async (orderId, shipmentId) => {
    if (!confirm("Are you sure you want to schedule delivery (assign courier & generate pickup) for this order?")) return;
    
    try {
      const res = await fetch("/api/admin/shiprocket-pickup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ orderId, shipmentId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrdersList(prev => prev.map(o => 
          (o.id === orderId || o.orderId === orderId)
            ? { ...o, status: "SHIPPED", shiprocket: data.shiprocket }
            : o
        ));
        alert("Pickup successfully scheduled! Status is now SHIPPED.");
      } else {
        alert(data.error || "Failed to schedule pickup");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleCancelShipping = async (orderId, shiprocketOrderId) => {
    if (!confirm("Are you sure you want to cancel this shipping request? This will cancel the order in Shiprocket and mark it as CANCELLED.")) return;
    
    try {
      const res = await fetch("/api/admin/shiprocket-cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ orderId, shiprocketOrderId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrdersList(prev => prev.map(o => 
          (o.id === orderId || o.orderId === orderId)
            ? { ...o, status: "CANCELLED" }
            : o
        ));
        setSelectedOrder(null);
        alert("Shipping successfully cancelled!");
      } else {
        alert(data.error || "Failed to cancel shipping");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleExportOrders = () => {
    if (ordersList.length === 0) return;
    const headers = ["Order ID", "Date", "Customer Name", "Customer Contact", "Receiver Name", "Receiver Contact", "Shipping Address", "Billing Address", "Total Amount", "Status"];
    const csvContent = [
      headers.join(","),
      ...ordersList.map((o) => {
        const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "N/A";
        const customerName = (o.billingAddress?.billingName || o.userName || "").replace(/"/g, '""');
        const customerContact = (o.userPhone || o.billingAddress?.contactNumber || "").replace(/"/g, '""');
        const receiverName = (o.shippingAddress?.receiverName || "").replace(/"/g, '""');
        const receiverContact = (o.shippingAddress?.contactNumber || "").replace(/"/g, '""');
        const shippingAddr = (o.shippingAddress?.formattedAddress || "").replace(/"/g, '""');
        const billingAddr = (o.billingAddress?.formattedAddress || "").replace(/"/g, '""');
        return `"${o.orderId || o.id}","${date}","${customerName}","${customerContact}","${receiverName}","${receiverContact}","${shippingAddr}","${billingAddr}","${o.amount || 0}","${o.status || "PENDING"}"`;
      }),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMarkSuccess = async (orderId) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ orderId, status: "SUCCESS" }),
      });
      const data = await res.json();
      if (data.success) {
        setOrdersList(prev => prev.map(o => o.id === orderId || o.orderId === orderId ? { ...o, status: "SUCCESS" } : o));
        setSelectedOrder(prev => prev && (prev.id === orderId || prev.orderId === orderId) ? { ...prev, status: "SUCCESS" } : prev);
      } else {
        alert(data.error || "Failed to update order");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating order status");
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ orderId, status: "CANCELLED" }),
      });
      const data = await res.json();
      if (data.success) {
        setOrdersList(prev => prev.map(o => o.id === orderId || o.orderId === orderId ? { ...o, status: "CANCELLED" } : o));
        setSelectedOrder(prev => prev && (prev.id === orderId || prev.orderId === orderId) ? { ...prev, status: "CANCELLED" } : prev);
      } else {
        alert(data.error || "Failed to cancel order");
      }
    } catch (err) {
      console.error(err);
      alert("Error canceling order");
    }
  };

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
        tagline: product.tagline || "",
        taglineAr: product.tagline_ar || "",
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

  const compressToWebP = (file) => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: "image/webp" }));
        }, "image/webp", 0.85);
      };
      img.onerror = (err) => reject(err);
    });
  };

  const handleUpload = async (file, folder, variantIndex, isMain) => {
    if (!file || !idToken) return;
    const fileKeyBase = `${variantIndex}-${isMain ? "main" : "gallery"}`;
    setCompressingKey(fileKeyBase);
    try {
      const webpFile = await compressToWebP(file);
      const previewUrl = URL.createObjectURL(webpFile);
      const fileKey = `${fileKeyBase}-${Date.now()}`;
      
      setPendingUploads(prev => ({ ...prev, [fileKey]: { file: webpFile, folder } }));

      setDraft((prev) => {
        const next = structuredClone(prev);
        if (!next.variants[variantIndex]) return prev;
        
        let oldUrl = null;
        if (isMain) {
          oldUrl = next.variants[variantIndex].mainImage;
          next.variants[variantIndex].mainImage = previewUrl;
          next.variants[variantIndex]._mainPendingKey = fileKey;
        } else {
          next.variants[variantIndex].galleryImages.push(previewUrl);
          if (!next.variants[variantIndex]._galleryPendingKeys) next.variants[variantIndex]._galleryPendingKeys = [];
          next.variants[variantIndex]._galleryPendingKeys.push(fileKey);
        }
        
        if (oldUrl && oldUrl.startsWith("http")) {
          setDeletedImages(prevD => [...prevD, oldUrl]);
        }
        return next;
      });
    } catch (err) {
      alert("Failed to compress image");
    } finally {
      setCompressingKey("");
    }
  };

  const saveDraft = async () => {
    if (!idToken) return;
    setSaveLoading(true);
    setSaveStatus("Uploading Images...");
    try {
      // 1. Upload pending images
      const uploadPromises = Object.entries(pendingUploads).map(async ([key, uploadInfo]) => {
        const formData = new FormData();
        formData.append("file", uploadInfo.file);
        formData.append("folder", uploadInfo.folder);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || !data?.success) throw new Error("Failed to upload " + key);
        return { key, url: data.url };
      });
      
      const uploadedResults = await Promise.all(uploadPromises);
      const uploadedMap = uploadedResults.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.url }), {});

      // 2. Prepare payload and swap preview URLs with real ones
      const autoName = draft.variants[0]?.variantName || draft.product.name || "Untitled";
      const autoDesc = draft.variants[0]?.description || draft.product.description || "";
      
      const variantsWithRealUrls = draft.variants.map((variant) => {
        const v = { ...variant };
        if (v._mainPendingKey && uploadedMap[v._mainPendingKey]) {
          v.mainImage = uploadedMap[v._mainPendingKey];
        }
        if (v._galleryPendingKeys && v._galleryPendingKeys.length > 0) {
          // Re-map gallery images. We assume the array order corresponds, 
          // or we can just replace any blob URL that has a matching pending key.
          // For safety, let's just use the fact that we pushed the URLs in order.
          // But a simpler way: let's filter out blobs and push the new URLs.
          // Wait, preview URLs are in the array, let's find and replace.
          v.galleryImages = v.galleryImages.map(imgUrl => {
            if (imgUrl.startsWith("blob:")) {
              const matchingKey = v._galleryPendingKeys.find(k => pendingUploads[k]?.file && URL.createObjectURL(pendingUploads[k].file) === imgUrl);
              // Since we don't have direct reverse map for URL, we'll just consume from the map in order.
              // Actually, since we only append blobs, let's just filter out blobs and concat all new uploaded map URLs for gallery.
            }
            return imgUrl; // Fallback
          });
          
          // Better approach for gallery:
          const newGalleryUrls = v._galleryPendingKeys.map(k => uploadedMap[k]).filter(Boolean);
          v.galleryImages = v.galleryImages.filter(img => !img.startsWith("blob:")).concat(newGalleryUrls);
        }
        
        delete v._mainPendingKey;
        delete v._galleryPendingKeys;
        
        return {
          ...v,
          sizes: v.sizes
            .filter((sizeEntry) => sizeEntry.exists)
            .map((sizeEntry) => ({
              size: sizeEntry.size,
              inStock: !!sizeEntry.inStock,
            })),
        };
      });

      const payload = {
        category: draft.category,
        product: {
          ...draft.product,
          name: autoName,
          description: autoDesc,
          details: {
            fit: draft.product.details?.fit || "",
            fabric: draft.product.details?.fabric || "",
            features: draft.product.details?.features || "",
            washCare: draft.product.details?.washCare || "",
          },
        },
        variants: variantsWithRealUrls,
      };

      setSaveStatus("Saving Product Data...");

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
      
      // 3. Delete replaced images from Supabase
      if (deletedImages.length > 0) {
        try {
          await fetch("/api/admin/upload", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ urls: deletedImages }),
          });
        } catch (e) {
          console.error("Failed to clean up old images");
        }
      }
      
      // Reset pending state
      setPendingUploads({});
      setDeletedImages([]);

      await loadCatalog(idToken); // Reload properly from backend
      alert("Product saved successfully!");
      setActiveTab("products");
      setDraft(emptyDraft());
    } finally {
      setSaveLoading(false);
      setSaveStatus("");
    }
  };

  const deleteProduct = async (productId) => {
    if (!idToken || !productId) return;
    if (!window.confirm("Are you sure you want to delete this product? This will also delete all its variants, images, and sizes.")) return;
    setSaveLoading(true);
    setSaveStatus("Deleting product...");
    try {
      const res = await fetch(`/api/admin/catalog?productId=${encodeURIComponent(productId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setCatalog(data);
      } else {
        alert(data.error || "Failed to delete product.");
      }
    } finally {
      setSaveLoading(false);
      setSaveStatus("");
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!idToken || !categoryId) return;
    if (!window.confirm("Are you sure you want to delete this category? Make sure no products are still referencing it.")) return;
    setSaveLoading(true);
    setSaveStatus("Deleting category...");
    try {
      const res = await fetch(`/api/admin/catalog?categoryId=${encodeURIComponent(categoryId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setCatalog(data);
      } else {
        alert(data.error || "Failed to delete category.");
      }
    } finally {
      setSaveLoading(false);
      setSaveStatus("");
    }
  };

  const toggleVisibility = async (type, id, is_active) => {
    if (!idToken || !id) return;
    setSaveLoading(true);
    setSaveStatus("Updating visibility...");
    try {
      const res = await fetch(`/api/admin/catalog`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}` 
        },
        body: JSON.stringify({ type, id, is_active })
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setCatalog(data);
      } else {
        alert(data.error || `Failed to update ${type} visibility.`);
      }
    } finally {
      setSaveLoading(false);
      setSaveStatus("");
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
          className={`admin-sidebar__btn ${activeTab === "queries" ? "is-active" : ""}`}
          onClick={() => setActiveTab("queries")}
        >
          <MessageSquare size={14} />
          Queries
        </button>
        <button
          className={`admin-sidebar__btn ${activeTab === "add" ? "is-active" : ""}`}
          onClick={startAddNew}
        >
          <Plus size={14} />
          Add New Product
        </button>
        <button
          className={`admin-sidebar__btn ${activeTab === "orders" ? "is-active" : ""}`}
          onClick={() => { setActiveTab("orders"); setOrderSubTab("successful"); }}
        >
          <Package size={14} />
          Orders
        </button>
        <button
          className={`admin-sidebar__btn ${activeTab === "shipping" ? "is-active" : ""}`}
          onClick={() => setActiveTab("shipping")}
        >
          <Truck size={14} />
          Shipping
        </button>
        <button
          className={`admin-sidebar__btn ${activeTab === "size_chart" ? "is-active" : ""}`}
          onClick={() => setActiveTab("size_chart")}
        >
          <Ruler size={14} />
          Size Chart
        </button>
        <button
          className={`admin-sidebar__btn ${activeTab === "legalities" ? "is-active" : ""}`}
          onClick={() => setActiveTab("legalities")}
        >
          <FileText size={14} />
          Legalities
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
        {activeTab === "size_chart" && <AdminSizeChart />}
        {activeTab === "legalities" && <AdminLegalities />}
        
        {activeTab === "products" && (
          <section>
            <h1 className="admin-title">Products</h1>
            {catalogLoading ? <p className="admin-muted">Loading...</p> : null}
            {(catalog?.categories || []).sort((a, b) => a.position - b.position).map((category) => {
              const categoryProducts = groupedProducts.filter((entry) => entry.category?.id === category.id);
              // A category is considered active if AT LEAST ONE product in it is active (or if it has no products, it defaults to active so it can be seen).
              const categoryIsActive = categoryProducts.length === 0 || categoryProducts.some((entry) => entry.product.is_active !== false);

              return (
              <div key={category.id} className="admin-category-block" style={{ opacity: categoryIsActive ? 1 : 0.6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3>{category.name} {!categoryIsActive && "(Hidden)"}</h3>
                  <div className="admin-row">
                    <button 
                      className="admin-btn" 
                      onClick={() => toggleVisibility('category', category.id, !categoryIsActive)}
                    >
                       {categoryIsActive ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> Show</>}
                    </button>
                    <button
                      className="admin-btn admin-btn--danger"
                      onClick={() => deleteCategory(category.id)}
                      title="Delete Category"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="admin-product-grid">
                  {categoryProducts
                    .map((entry) => (
                      <article key={entry.product.id} className="admin-product-card" style={{ opacity: entry.product.is_active !== false ? 1 : 0.6 }}>
                        <div className="admin-product-card__head">
                          <div>
                            <h4>{entry.product.brand || "No Brand"} {entry.product.is_active === false && <span style={{color: "#ef4444", fontSize: "12px"}}>(Unpublished)</span>}</h4>
                            <p className="admin-muted">{entry.product.name} • {entry.variants.length} color variants</p>
                          </div>
                          <div className="admin-row">
                            <button 
                              className="admin-btn" 
                              onClick={() => toggleVisibility('product', entry.product.id, entry.product.is_active === false)}
                            >
                               {entry.product.is_active !== false ? "Unpublish" : "Publish"}
                            </button>
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
            )})}
          </section>
        )}

        {activeTab === "users" && (
          <section>
            <h1 className="admin-title">Users</h1>
            {usersLoading ? (
              <p className="admin-muted">Loading...</p>
            ) : usersList.length === 0 ? (
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

        {activeTab === "queries" && (
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h1 className="admin-title" style={{ marginBottom: 0 }}>Customer Queries</h1>
              <button
                onClick={handleExportQueries}
                disabled={queriesList.length === 0}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  background: queriesList.length === 0 ? "#ccc" : "#111",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: queriesList.length === 0 ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontFamily: "'Google Sans Flex', sans-serif"
                }}
              >
                <Download size={14} />
                Export CSV
              </button>
            </div>
            {queriesLoading ? (
              <p className="admin-muted">Loading...</p>
            ) : queriesList.length === 0 ? (
              <p className="admin-muted">No queries found.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  <thead>
                    <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                      <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151" }}>Date</th>
                      <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151" }}>Name</th>
                      <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151" }}>Email</th>
                      <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151" }}>Subject</th>
                      <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151" }}>Message</th>
                      <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151" }}>Attachment</th>
                      <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151", width: "60px", textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queriesList.map((q, i) => (
                      <tr key={q.id} style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: i % 2 === 0 ? "white" : "#fcfcfc", verticalAlign: "top" }}>
                        <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "14px", whiteSpace: "nowrap" }}>
                          {q.timestamp ? new Date(q.timestamp).toLocaleDateString() : "N/A"}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#111827", fontWeight: "500" }}>{q.name}</td>
                        <td style={{ padding: "12px 16px", color: "#374151" }}>{q.email}</td>
                        <td style={{ padding: "12px 16px", color: "#374151", fontWeight: "500" }}>{q.subject}</td>
                        <td style={{ padding: "12px 16px", color: "#4b5563", fontSize: "14px", minWidth: "300px" }}>{q.message}</td>
                        <td style={{ padding: "12px 16px" }}>
                          {q.attachmentUrl ? (
                            <a href={q.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", border: "1px solid #d1d5db", borderRadius: "4px", overflow: "hidden", lineHeight: 0 }}>
                              <img src={q.attachmentUrl} alt="Attachment" style={{ width: "40px", height: "40px", objectFit: "cover" }} />
                            </a>
                          ) : (
                            <span style={{ color: "#9ca3af", fontSize: "12px" }}>None</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <button
                            onClick={() => handleDeleteQuery(q.id)}
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444" }}
                            title="Delete Query"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeTab === "orders" && (() => {
          const displayedOrders = ordersList.filter(o => {
            const isSuccess = ["SUCCESS", "COMPLETED", "PAYMENT_SUCCESS"].includes(o.status);
            const isShippingOrShipped = o.status === "SHIPPING" || o.status === "SHIPPED";
            
            // Exclude from Orders tab entirely
            if (isShippingOrShipped) return false;

            if (orderSubTab === "successful") return isSuccess;
            if (orderSubTab === "cancelled") return o.status === "CANCELLED";
            if (orderSubTab === "others") return !isSuccess && o.status !== "CANCELLED";
            
            // "all" tab
            return true;
          });


          return (
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h1 className="admin-title" style={{ marginBottom: 0 }}>Orders</h1>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={handleAllowNotifications}
                  disabled={notificationStatus === "loading" || notificationStatus === "success"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    background: notificationStatus === "success" ? "#166534" : "#1f4dd6",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: (notificationStatus === "loading" || notificationStatus === "success") ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontFamily: "'Google Sans Flex', sans-serif"
                  }}
                >
                  <Bell size={14} />
                  {notificationStatus === "loading" ? "Setting up..." : notificationStatus === "success" ? "Notifications Active" : "Allow Notifications"}
                </button>
                <button
                onClick={handleExportOrders}
                disabled={ordersList.length === 0}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  background: ordersList.length === 0 ? "#ccc" : "#111",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: ordersList.length === 0 ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontFamily: "'Google Sans Flex', sans-serif"
                }}
              >
                <Download size={14} />
                  Export CSV
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "2px", marginBottom: "16px", borderBottom: "1px solid #e5e7eb" }}>
              {["all", "successful", "cancelled", "others"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setOrderSubTab(tab)}
                  style={{
                    padding: "8px 20px",
                    background: orderSubTab === tab ? "white" : "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    borderBottom: "none",
                    borderTop: orderSubTab === tab ? "3px solid #e11d48" : "1px solid #e5e7eb",
                    borderRadius: "6px 6px 0 0",
                    fontWeight: orderSubTab === tab ? "600" : "500",
                    color: orderSubTab === tab ? "#111" : "#6b7280",
                    cursor: "pointer",
                    textTransform: "capitalize",
                    fontFamily: "'Google Sans Flex', sans-serif",
                    marginTop: orderSubTab === tab ? "-2px" : "0",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            {ordersLoading ? (
              <p className="admin-muted">Loading...</p>
            ) : displayedOrders.length === 0 ? (
              <p className="admin-muted">No orders found for this tab.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  <thead>
                    <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                      <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151", fontSize: "13px" }}>Order ID</th>
                      <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151", fontSize: "13px" }}>Date</th>
                      <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151", fontSize: "13px" }}>Customer Name</th>
                      <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151", fontSize: "13px" }}>Customer Contact</th>
                      <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151", fontSize: "13px" }}>Receiver Name</th>
                      <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151", fontSize: "13px" }}>Receiver Contact</th>
                      <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151", fontSize: "13px" }}>Shipping Address</th>
                      <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151", fontSize: "13px" }}>Amount</th>
                      <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151", fontSize: "13px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedOrders.map((o, i) => (
                      <tr
                        key={o.id}
                        onClick={() => setSelectedOrder(o)}
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          backgroundColor: i % 2 === 0 ? "white" : "#fcfcfc",
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f4ff"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = i % 2 === 0 ? "white" : "#fcfcfc"}
                      >
                        <td style={{ padding: "12px 16px", color: "#6b46c1", fontWeight: "600", fontSize: "13px", fontFamily: "monospace", whiteSpace: "nowrap" }}>{o.orderId || o.id}</td>
                        <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px", whiteSpace: "nowrap" }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "N/A"}</td>
                        <td style={{ padding: "12px 16px", color: "#111827", fontWeight: "500", fontSize: "13px" }}>{o.billingAddress?.billingName || o.userName || "N/A"}</td>
                        <td style={{ padding: "12px 16px", color: "#374151", fontSize: "13px" }}>{o.userPhone || o.billingAddress?.contactNumber || "N/A"}</td>
                        <td style={{ padding: "12px 16px", color: "#111827", fontWeight: "500", fontSize: "13px" }}>{o.shippingAddress?.receiverName || "N/A"}</td>
                        <td style={{ padding: "12px 16px", color: "#374151", fontSize: "13px" }}>{o.shippingAddress?.contactNumber || "N/A"}</td>
                        <td style={{ padding: "12px 16px", color: "#4b5563", fontSize: "13px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.shippingAddress?.formattedAddress || "N/A"}</td>
                        <td style={{ padding: "12px 16px", color: "#111827", fontWeight: "600", fontSize: "13px" }}>₹{(o.amount || 0).toLocaleString()}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            padding: "3px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            background: o.status === "SUCCESS" ? "#dcfce7" : o.status === "FAILED" ? "#fee2e2" : "#fef9c3",
                            color: o.status === "SUCCESS" ? "#166534" : o.status === "FAILED" ? "#991b1b" : "#854d0e"
                          }}>
                            {o.status || "PENDING"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          );
        })()}

        {activeTab === "shipping" && (() => {
          const shippedOrders = ordersList.filter(o => {
            if (shippingSubTab === "shipping") return o.status === "SHIPPING";
            if (shippingSubTab === "shipped") return o.status === "SHIPPED";
            return false;
          });
          
          return (
            <section>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h1 className="admin-title" style={{ marginBottom: 0 }}>Shipping</h1>
              </div>

              <div style={{ display: "flex", gap: "2px", marginBottom: "16px", borderBottom: "1px solid #e5e7eb" }}>
                {["shipping", "shipped"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setShippingSubTab(tab)}
                    style={{
                      padding: "8px 20px",
                      background: shippingSubTab === tab ? "white" : "#f3f4f6",
                      border: "1px solid #e5e7eb",
                      borderBottom: "none",
                      borderTop: shippingSubTab === tab ? "3px solid #e11d48" : "1px solid #e5e7eb",
                      borderRadius: "6px 6px 0 0",
                      fontWeight: shippingSubTab === tab ? "600" : "500",
                      color: shippingSubTab === tab ? "#111" : "#6b7280",
                      cursor: "pointer",
                      textTransform: "capitalize",
                      position: "relative",
                      marginTop: shippingSubTab === tab ? "-2px" : "0",
                      zIndex: shippingSubTab === tab ? 1 : 0
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {ordersLoading ? (
                <p className="admin-muted">Loading...</p>
              ) : shippedOrders.length === 0 ? (
                <p className="admin-muted">No {shippingSubTab} orders found.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <thead>
                      <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                        <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151" }}>Order ID</th>
                        <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151" }}>Date</th>
                        <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151" }}>Customer</th>
                        <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151" }}>AWB Code</th>
                        <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151" }}>Courier</th>
                        <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151", textAlign: "center" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shippedOrders.map((order, i) => (
                        <tr 
                          key={order.orderId || order.id} 
                          onClick={() => setSelectedOrder(order)}
                          style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: i % 2 === 0 ? "white" : "#fcfcfc", cursor: "pointer", transition: "background-color 0.2s" }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = i % 2 === 0 ? "white" : "#fcfcfc"}
                        >
                          <td style={{ padding: "12px 16px", color: "#111827", fontWeight: "600" }}>{order.orderId || order.id}</td>
                          <td style={{ padding: "12px 16px", color: "#4b5563" }}>{new Date(order.createdAt).toLocaleString()}</td>
                          <td style={{ padding: "12px 16px", color: "#374151", fontWeight: "500" }}>{order.shippingAddress?.receiverName || order.userName || "N/A"}</td>
                          <td style={{ padding: "12px 16px", color: "#2563eb", fontWeight: "600" }}>{order.shiprocket?.awb_code || "N/A"}</td>
                          <td style={{ padding: "12px 16px", color: "#4b5563" }}>{order.shiprocket?.courier_name || "N/A"}</td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                            {order.status === "SHIPPING" && order.shiprocket?.shipment_id && (
                              <button 
                                className="admin-btn" 
                                style={{ background: "#4338ca", color: "#fff", border: "none", fontSize: "12px", padding: "6px 12px" }}
                                onClick={() => handleSchedulePickup(order.orderId || order.id, order.shiprocket.shipment_id)}
                              >
                                Schedule Pickup
                              </button>
                            )}
                            {order.shiprocket?.tracking_url && (
                              <a 
                                href={order.shiprocket.tracking_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="admin-btn" 
                                style={{ marginLeft: "8px", textDecoration: "none", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", fontSize: "12px", padding: "5px 12px" }}
                              >
                                Track
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })()}

        {activeTab === "add" && (
          <section className="admin-form-wrap">
            <h1 className="admin-title">{draft.product.id ? "Edit Product" : "Add Product"}</h1>
            <div className="admin-form-grid">
              <label>
                Category
                <select
                  className="admin-light-select"
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
                  style={{ marginBottom: isNewCategory ? "0.5rem" : "0" }}
                >
                  <option value="" disabled>Select Category</option>
                  {(catalog?.categories || []).map(c => c.name).filter(c => c && c !== "Uncategorized").map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="+ Add New Category">+ Add New Category</option>
                </select>
                {isNewCategory && (
                  <input
                    className="admin-light-input"
                    value={draft.category.name}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, category: { ...prev.category, name: e.target.value } }))
                    }
                    placeholder="New Category Name (e.g., Jerseys)"
                  />
                )}
              </label>
              <label>
                Brand
                <input
                  className="admin-light-input"
                  value={draft.product.brand}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, product: { ...prev.product, brand: e.target.value } }))
                  }
                  placeholder="Inkphyous"
                />
              </label>

              <label>
                Tagline (EN)
                <input
                  className="admin-light-input"
                  value={draft.product.tagline}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, product: { ...prev.product, tagline: e.target.value } }))
                  }
                  placeholder="e.g. Essential comfort"
                />
              </label>

              <label>
                Tagline (AR)
                <input
                  className="admin-light-input"
                  value={draft.product.taglineAr}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, product: { ...prev.product, taglineAr: e.target.value } }))
                  }
                  placeholder="Arabic tagline"
                  dir="auto"
                />
              </label>

              <label>
                Price
                <input
                  className="admin-light-input"
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
                  className="admin-light-input"
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



            <div className="admin-details-grid">
              {["fit", "fabric", "features", "washCare"].map((key) => (
                <label key={key}>
                  {key}
                  <input
                    className="admin-light-input"
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
                      Variant Name
                      <input
                        value={variant.variantName}
                        onChange={(e) =>
                          setDraft((prev) => {
                            const next = structuredClone(prev);
                            next.variants[variantIndex].variantName = e.target.value;
                            return next;
                          })
                        }
                        placeholder="e.g. Jersey Reptile"
                      />
                    </label>
                    <label>
                      Semi Description
                      <input
                        value={variant.semiDescription || ""}
                        onChange={(e) =>
                          setDraft((prev) => {
                            const next = structuredClone(prev);
                            next.variants[variantIndex].semiDescription = e.target.value;
                            return next;
                          })
                        }
                      />
                    </label>
                    <label>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        Color Hex
                        <div 
                          style={{ 
                            width: "16px", 
                            height: "16px", 
                            borderRadius: "50%", 
                            backgroundColor: variant.colorHex,
                            border: "1px solid #333"
                          }} 
                        />
                      </div>
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

                  <label className="admin-textarea-label" style={{ display: "block", marginTop: "1rem", marginBottom: "1rem" }}>
                    <span style={{ display: "block", marginBottom: "0.5rem" }}>Variant Description</span>
                    <ColorEditor
                      value={variant.description}
                      onChange={(content) =>
                        setDraft((prev) => {
                          const next = structuredClone(prev);
                          next.variants[variantIndex].description = content;
                          return next;
                        })
                      }
                      colors={COLOR_PALETTE.concat([{ name: "Inkphyous Red", hex: "#e11d48" }])}
                    />
                  </label>

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
                    {compressingKey === `${variantIndex}-main` || compressingKey === `${variantIndex}-gallery` ? (
                      <span className="admin-muted" style={{ alignSelf: "center", color: "#e11d48", fontWeight: "600" }}>Compressing...</span>
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
                              const removedImg = next.variants[variantIndex].galleryImages[imageIndex];
                              if (removedImg && removedImg.startsWith("http")) {
                                setDeletedImages(prevD => [...prevD, removedImg]);
                              }
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

      {/* Order Detail Popup */}
      {selectedOrder && (
        <div className="admin-order-modal">
          <div className="admin-order-modal__overlay" onClick={() => setSelectedOrder(null)} />
          <div className="admin-order-modal__content" style={{ maxWidth: "900px", width: "95%" }}>
            <div className="admin-order-modal__header">
              <h2>Order Details — {selectedOrder.orderId || selectedOrder.id}</h2>
              <button onClick={() => setSelectedOrder(null)}><X size={20} /></button>
            </div>
            <div className="admin-order-modal__body" style={{ display: "flex", gap: "24px", paddingTop: "16px" }}>
              {/* Left Column */}
              <div style={{ flex: 1, borderRight: "1px solid #e5e7eb", paddingRight: "24px" }}>
                <div className="admin-order-modal__section" style={{ marginBottom: "20px" }}>
                  <h4 style={{ color: "#374151", marginBottom: "8px", borderBottom: "1px solid #eee", paddingBottom: "4px" }}>Customer Info</h4>
                  <p><strong>Name:</strong> {selectedOrder.billingAddress?.billingName || selectedOrder.userName || "N/A"}</p>
                  <p><strong>Contact:</strong> {selectedOrder.userPhone || selectedOrder.billingAddress?.contactNumber || "N/A"}</p>
                  <p><strong>Email:</strong> {selectedOrder.userEmail || "N/A"}</p>
                </div>

                <div className="admin-order-modal__section" style={{ marginBottom: "20px" }}>
                  <h4 style={{ color: "#374151", marginBottom: "8px", borderBottom: "1px solid #eee", paddingBottom: "4px" }}>Shipping Address</h4>
                  <p><strong>Receiver:</strong> {selectedOrder.shippingAddress?.receiverName || "N/A"}</p>
                  <p><strong>Contact:</strong> {selectedOrder.shippingAddress?.contactNumber || "N/A"}</p>
                  <p style={{ marginTop: "4px", whiteSpace: "pre-wrap", background: "#f9fafb", padding: "8px", borderRadius: "4px", fontSize: "13px" }}>
                    {selectedOrder.shippingAddress?.formattedAddress || "N/A"}
                  </p>
                </div>
                
                <div className="admin-order-modal__section">
                  <h4 style={{ color: "#374151", marginBottom: "8px", borderBottom: "1px solid #eee", paddingBottom: "4px" }}>Billing Address</h4>
                  <p style={{ whiteSpace: "pre-wrap", background: "#f9fafb", padding: "8px", borderRadius: "4px", fontSize: "13px" }}>
                    {selectedOrder.billingAddress?.formattedAddress || "N/A"}
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div style={{ flex: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div>
                    <h4 style={{ color: "#374151", marginBottom: "4px" }}>Order Status</h4>
                    <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : "N/A"} • {selectedOrder.paymentMethod || "PhonePe"}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ padding: "4px 12px", borderRadius: "16px", fontSize: "13px", fontWeight: "600", background: selectedOrder.status === "SUCCESS" ? "#dcfce7" : selectedOrder.status === "FAILED" ? "#fee2e2" : "#fef9c3", color: selectedOrder.status === "SUCCESS" ? "#166534" : selectedOrder.status === "FAILED" ? "#991b1b" : "#854d0e" }}>
                      {selectedOrder.status || "PENDING"}
                    </span>
                    {selectedOrder.status !== "SUCCESS" && selectedOrder.status !== "SHIPPED" && selectedOrder.status !== "SHIPPING" && (
                      <button
                        className="admin-btn"
                        style={{ padding: "6px 14px", background: "#111", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                        onClick={() => handleMarkSuccess(selectedOrder.orderId || selectedOrder.id)}
                      >
                        <CheckCircle size={14} /> Mark as Success
                      </button>
                    )}
                    {selectedOrder.status === "SHIPPING" && selectedOrder.shiprocket?.shiprocket_order_id && (
                      <button
                        className="admin-btn"
                        style={{ padding: "6px 14px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                        onClick={() => handleCancelShipping(selectedOrder.orderId || selectedOrder.id, selectedOrder.shiprocket.shiprocket_order_id)}
                      >
                        <Trash2 size={14} /> Cancel Shipping
                      </button>
                    )}
                    {selectedOrder.status === "SUCCESS" && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="admin-btn"
                          style={{ padding: "6px 14px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                          onClick={() => handleCancelOrder(selectedOrder.orderId || selectedOrder.id)}
                        >
                          <X size={14} /> Cancel Order
                        </button>
                        <button
                          className="admin-btn"
                          style={{ padding: "6px 14px", background: "#111", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                          onClick={() => setShipmentForm({ order: selectedOrder, weight: 0.5, length: 20, breadth: 20, height: 10 })}
                        >
                          <Truck size={14} /> Move to Shipment
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="admin-order-modal__section">
                  <h4 style={{ color: "#374151", marginBottom: "8px", borderBottom: "1px solid #eee", paddingBottom: "4px" }}>Items</h4>
                  <div style={{ maxHeight: "300px", overflowY: "auto", paddingRight: "8px" }}>
                    {(selectedOrder.cartItems || []).map((item, idx) => (
                      <div key={idx} style={{ display: "flex", gap: "12px", padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
                        {item.image ? (
                          <img src={item.image} alt="" style={{ width: "60px", height: "75px", objectFit: "cover", borderRadius: "6px", border: "1px solid #eee" }} />
                        ) : (
                          <div style={{ width: "60px", height: "75px", background: "#f3f4f6", borderRadius: "6px" }} />
                        )}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: "600", fontSize: "14px", color: "#111" }}>{item.name}</p>
                            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }}>{item.brand} • {item.category}</p>
                            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#374151", fontWeight: "500" }}>{item.size} {item.colorName ? `| ${item.colorName}` : ""}</p>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <p style={{ margin: 0, fontWeight: "600", fontSize: "14px" }}>₹{((item.discountPriceINR || item.priceINR || item.price || 0) * (item.quantity || 1)).toLocaleString()}</p>
                          <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>Qty: {item.quantity || 1}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "16px", borderTop: "2px solid #e5e7eb" }}>
                    <span style={{ fontSize: "16px", fontWeight: "600" }}>Total Amount</span>
                    <span style={{ fontSize: "20px", fontWeight: "700", color: "#111" }}>₹{(selectedOrder.amount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipment Form Popup */}
      {shipmentForm && (
        <div className="admin-order-modal">
          <div className="admin-order-modal__overlay" onClick={() => setShipmentForm(null)} />
          <div className="admin-order-modal__content" style={{ maxWidth: "500px", width: "95%" }}>
            <div className="admin-order-modal__header">
              <h2>Move to Shipment</h2>
              <button onClick={() => setShipmentForm(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-order-modal__body" style={{ paddingTop: "16px" }}>
              <p style={{ marginBottom: "16px", color: "#4b5563" }}>
                Confirm package details for Shiprocket Adhoc Order. This will generate an AWB and schedule a pickup.
              </p>
              
              <div style={{ background: "#f9fafb", padding: "16px", borderRadius: "8px", marginBottom: "20px", color: "#111" }}>
                <p style={{ margin: "0 0 6px" }}><strong>Order ID:</strong> {shipmentForm.order.orderId || shipmentForm.order.id}</p>
                <p style={{ margin: "0 0 6px" }}><strong>Customer:</strong> {shipmentForm.order.shippingAddress?.receiverName || "N/A"}</p>
                <p style={{ margin: "0 0 16px" }}><strong>Phone:</strong> {shipmentForm.order.shippingAddress?.contactNumber || "N/A"}</p>
                
                <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "12px" }}>
                  <p style={{ margin: "0 0 8px", fontWeight: "600", fontSize: "14px" }}>Items to ship:</p>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", color: "#374151" }}>
                    {(shipmentForm.order.cartItems || []).map((item, idx) => (
                      <li key={idx} style={{ marginBottom: "6px" }}>
                        <strong>{item.quantity || 1}x</strong> {item.name} 
                        <span style={{ color: "#6b7280", marginLeft: "6px" }}>({item.size}{item.colorName ? ` - ${item.colorName}` : ""})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <form onSubmit={submitShipment} className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", color: "#111" }}>
                <label style={{ color: "#111" }}>
                  Weight (kg) *
                  <input type="number" step="0.01" className="admin-light-input" required value={shipmentForm.weight} onChange={(e) => setShipmentForm({ ...shipmentForm, weight: e.target.value })} style={{ color: "#111" }} />
                </label>
                <label style={{ color: "#111" }}>
                  Length (cm) *
                  <input type="number" step="1" className="admin-light-input" required value={shipmentForm.length} onChange={(e) => setShipmentForm({ ...shipmentForm, length: e.target.value })} style={{ color: "#111" }} />
                </label>
                <label style={{ color: "#111" }}>
                  Breadth (cm) *
                  <input type="number" step="1" className="admin-light-input" required value={shipmentForm.breadth} onChange={(e) => setShipmentForm({ ...shipmentForm, breadth: e.target.value })} style={{ color: "#111" }} />
                </label>
                <label style={{ color: "#111" }}>
                  Height (cm) *
                  <input type="number" step="1" className="admin-light-input" required value={shipmentForm.height} onChange={(e) => setShipmentForm({ ...shipmentForm, height: e.target.value })} style={{ color: "#111" }} />
                </label>
                
                <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                  <button type="button" className="admin-btn" onClick={() => setShipmentForm(null)}>Cancel</button>
                  <button type="submit" className="admin-btn" style={{ background: "#e11d48", color: "#fff", border: "none" }}>Confirm & Ship</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Global Saving Overlay */}
      {saveStatus && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999,
          flexDirection: "column", gap: "16px"
        }}>
          <div style={{
            width: "48px", height: "48px",
            border: "4px solid #f3f4f6", borderTop: "4px solid #e11d48",
            borderRadius: "50%", animation: "spin 1s linear infinite"
          }} />
          <h2 style={{ margin: 0, color: "#111", fontSize: "20px" }}>{saveStatus}</h2>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}} />
        </div>
      )}
    </div>
  );
}
