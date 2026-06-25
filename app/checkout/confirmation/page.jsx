"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Package, MapPin, CreditCard } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, authLoading } = useStore();

  useEffect(() => {
    if (authLoading) return;
    const txnId = searchParams.get("transactionId");
    if (txnId && user) {
      loadOrder(txnId);
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [searchParams, user, authLoading]);

  const loadOrder = async (txnId) => {
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/user/orders?transactionId=${txnId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setOrder(data.data);
      }
    } catch (err) {
      console.error("Failed to load order:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="confirmation-page">
        <div className="address-page__bg" />
        <div className="address-page__loading">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="confirmation-page">
        <div className="address-page__bg" />
        <div className="confirmation-page__card">
          <h1>Order Not Found</h1>
          <p>We couldn&apos;t find this order. Please check your orders page.</p>
          <button className="confirmation-page__btn" onClick={() => router.push("/orders")}>
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <div className="address-page__bg" />

      <div className="confirmation-page__card">
        <div className="confirmation-page__success-icon">
          <CheckCircle size={64} strokeWidth={1.5} />
        </div>

        <h1 className="confirmation-page__title">Order Confirmed!</h1>
        <p className="confirmation-page__subtitle">
          Thank you for your order. We&apos;ll send you a confirmation once your items ship.
        </p>

        <div className="confirmation-page__order-id">
          <span>Order ID</span>
          <strong>{order.orderId}</strong>
        </div>

        <div className="confirmation-page__info-grid">
          {/* Order Items */}
          <div className="confirmation-page__section">
            <h3>
              <Package size={16} />
              Order Items
            </h3>
            <div className="confirmation-page__items">
              {(order.cartItems || []).map((item, idx) => (
                <div key={idx} className="confirmation-page__item">
                  <img src={item.image} alt={item.name} />
                  <div>
                    <p className="confirmation-page__item-name">{item.name}</p>
                    <p className="confirmation-page__item-meta">
                      Size: {item.size} | Qty: {item.quantity || 1}
                    </p>
                    <p className="confirmation-page__item-price">
                      ₹{(item.price * (item.quantity || 1)).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="confirmation-page__section">
            <h3>
              <MapPin size={16} />
              Shipping Address
            </h3>
            <p className="confirmation-page__addr-name">
              {order.shippingAddress?.receiverName}
            </p>
            <p className="confirmation-page__addr-text">
              {order.shippingAddress?.formattedAddress}
            </p>
            <p className="confirmation-page__addr-phone">
              {order.shippingAddress?.contactNumber}
            </p>
          </div>

          {/* Billing */}
          <div className="confirmation-page__section">
            <h3>
              <CreditCard size={16} />
              Billing Details
            </h3>
            <p className="confirmation-page__addr-name">
              {order.billingAddress?.billingName || order.billingAddress?.receiverName}
            </p>
            <p className="confirmation-page__addr-text">
              {order.billingAddress?.formattedAddress}
            </p>
          </div>

          {/* Payment */}
          <div className="confirmation-page__section">
            <h3>Payment Summary</h3>
            <div className="confirmation-page__payment-row">
              <span>Total Paid</span>
              <strong>₹{(order.amount || 0).toLocaleString()}</strong>
            </div>
            <div className="confirmation-page__payment-row">
              <span>Payment Method</span>
              <span>{order.paymentMethod || "PhonePe"}</span>
            </div>
            <div className="confirmation-page__payment-row">
              <span>Status</span>
              <span className="confirmation-page__status-badge">{order.status}</span>
            </div>
            <div className="confirmation-page__payment-row">
              <span>Date</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="confirmation-page__actions">
          <button
            className="confirmation-page__btn confirmation-page__btn--primary"
            onClick={() => router.push("/orders")}
          >
            View My Orders
          </button>
          <button
            className="confirmation-page__btn confirmation-page__btn--secondary"
            onClick={() => router.push("/")}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="confirmation-page">
          <div className="address-page__bg" />
          <div className="address-page__loading">Loading confirmation...</div>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
