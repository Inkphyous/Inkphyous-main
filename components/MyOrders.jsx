"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "./providers/StoreProvider";
import { ArrowLeft, Package, ChevronDown, ChevronUp } from "lucide-react";

const STATUS_COLORS = {
  SUCCESS: { bg: "#dcfce7", color: "#166534", label: "Paid" },
  PENDING: { bg: "#fef9c3", color: "#854d0e", label: "Pending" },
  FAILED: { bg: "#fee2e2", color: "#991b1b", label: "Failed" },
};

export default function MyOrders() {
  const router = useRouter();
  const { user, authLoading, requireAuth } = useStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

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
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
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
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
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
  );
}
