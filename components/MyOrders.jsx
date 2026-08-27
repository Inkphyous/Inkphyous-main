"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "./providers/StoreProvider";
import { ArrowLeft, Package, ChevronDown, ChevronUp } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";

const STATUS_COLORS = {
  SUCCESS: { bg: "#dcfce7", color: "#166534", label: "Order Placed" },
  PENDING: { bg: "#fef9c3", color: "#854d0e", label: "Pending" },
  FAILED: { bg: "#fee2e2", color: "#991b1b", label: "Failed" },
  SHIPPING: { bg: "#e0e7ff", color: "#4338ca", label: "Shipping" },
  SHIPPED: { bg: "#dbeafe", color: "#1e40af", label: "Order Shipped" },
};

export default function MyOrders() {
  const router = useRouter();
  const { user, authLoading, requireAuth } = useStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [liveTracking, setLiveTracking] = useState({});

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      requireAuth("Login to view your orders");
      router.push("/");
      return;
    }
    loadOrders();
  }, [authLoading, user]);

  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/user/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        const userOrders = Object.entries(data.data)
          .map(([id, order]) => ({ id, ...order }))
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setOrders(userOrders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error(err);
      if (!orders.length) setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async (order) => {
    const isExpanded = expandedOrder === order.id;
    if (isExpanded) {
      setExpandedOrder(null);
      return;
    }
    
    setExpandedOrder(order.id);
    
    // Fetch live tracking if we have an AWB and haven't fetched yet
    if (order.shiprocket?.awb_code && !liveTracking[order.id]) {
      setLiveTracking(prev => ({ ...prev, [order.id]: { loading: true } }));
      try {
        const res = await fetch(`/api/shiprocket/track?awb=${order.shiprocket.awb_code}`);
        const data = await res.json();
        if (data.success) {
          setLiveTracking(prev => ({ ...prev, [order.id]: { loading: false, status: data.currentStatus } }));
        } else {
          setLiveTracking(prev => ({ ...prev, [order.id]: { loading: false, status: "N/A" } }));
        }
      } catch (err) {
        setLiveTracking(prev => ({ ...prev, [order.id]: { loading: false, status: "Error" } }));
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="orders-page">
        <div className="address-page__bg" />
        <div className="address-page__loading">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="orders-page">
      <div className="address-page__bg" />

      <button onClick={() => router.back()} className="cart-back-btn shared-back-btn">
        <ArrowLeft size={16} strokeWidth={2} />
        <span>BACK</span>
      </button>

      <div className="orders-page__container">
        <h1 className="orders-page__title">
          <Package size={22} />
          MY ORDERS
        </h1>

        {orders.length === 0 ? (
          <div className="orders-page__empty">
            <Package size={48} strokeWidth={1} />
            <p>No orders yet.</p>
            <button onClick={() => router.push("/")} className="orders-page__shop-btn">
              START SHOPPING
            </button>
          </div>
        ) : (
          <div className="orders-page__list">
            {orders.map((order) => {
              const statusInfo = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;
              const isExpanded = expandedOrder === order.id;
              return (
                <div key={order.id} className="order-card">
                  <button
                    className="order-card__header"
                    onClick={() => handleExpand(order)}
                  >
                    <div className="order-card__main">
                      <div className="order-card__id">
                        <span className="order-card__label">Order ID</span>
                        <span className="order-card__value">{order.orderId || order.id}</span>
                      </div>
                      <div className="order-card__date">
                        <span className="order-card__label">Date</span>
                        <span className="order-card__value">{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="order-card__amount">
                        <span className="order-card__label">Total</span>
                        <span className="order-card__value">₹{(order.amount || 0).toLocaleString()}</span>
                      </div>
                      <span
                        className="order-card__status"
                        style={{ background: statusInfo.bg, color: statusInfo.color }}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {isExpanded && (
                    <div className="order-card__details">
                      {(order.status === "SHIPPING" || order.status === "SHIPPED") && order.shiprocket && (
                        <div className="order-card__section" style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                          <h4 style={{ display: "flex", alignItems: "center", gap: "6px", color: "#1e40af", margin: 0 }}>
                            <Package size={16} /> Tracking Details
                          </h4>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px", fontSize: "14px" }}>
                            <div>
                              <span style={{ color: "#64748b", display: "block", fontSize: "12px", marginBottom: "4px" }}>Courier Partner</span>
                              <strong style={{ color: "#0f172a" }}>{order.shiprocket.courier_name}</strong>
                            </div>
                            <div>
                              <span style={{ color: "#64748b", display: "block", fontSize: "12px", marginBottom: "4px" }}>Tracking Number</span>
                              <strong style={{ color: "#0f172a" }}>{order.shiprocket.awb_code}</strong>
                            </div>
                            {liveTracking[order.id] && (
                              <div style={{ gridColumn: "span 2", marginTop: "4px", paddingTop: "8px", borderTop: "1px solid #e2e8f0" }}>
                                <span style={{ color: "#64748b", display: "block", fontSize: "12px", marginBottom: "4px" }}>Live Status</span>
                                <strong style={{ color: "#059669", fontSize: "15px", display: "flex", alignItems: "center", gap: "6px" }}>
                                  {liveTracking[order.id].loading ? "Fetching..." : (liveTracking[order.id].status || "N/A")}
                                </strong>
                              </div>
                            )}
                          </div>
                          {order.shiprocket.tracking_url && (
                            <a 
                              href={order.shiprocket.tracking_url} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ display: "inline-block", marginTop: "16px", padding: "8px 16px", background: "#111", color: "#fff", textDecoration: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "600" }}
                            >
                              Track on Shiprocket
                            </a>
                          )}
                        </div>
                      )}

                      <div className="order-card__section">
                        <h4>Items</h4>
                        <div className="order-card__items">
                          {(order.cartItems || []).map((item, idx) => (
                            <div key={idx} className="order-card__item">
                              <img src={item.image} alt={item.name} className="order-card__item-img" />
                              <div>
                                <p className="order-card__item-name">{item.name}</p>
                                <p className="order-card__item-meta">
                                  Size: {item.size} | Qty: {item.quantity || 1} | ₹{(item.price * (item.quantity || 1)).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="order-card__addresses">
                        <div className="order-card__section">
                          <h4>Shipping Address</h4>
                          <p className="order-card__addr-name">{order.shippingAddress?.receiverName}</p>
                          <p className="order-card__addr-text">{order.shippingAddress?.formattedAddress}</p>
                          <p className="order-card__addr-phone">{order.shippingAddress?.contactNumber}</p>
                        </div>
                        <div className="order-card__section">
                          <h4>Billing Address</h4>
                          <p className="order-card__addr-name">{order.billingAddress?.billingName || order.billingAddress?.receiverName}</p>
                          <p className="order-card__addr-text">{order.billingAddress?.formattedAddress}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    <Footer />
    </>
  );
}
