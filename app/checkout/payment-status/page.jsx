"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";

function PaymentStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("CHECKING");
  const [errorCode, setErrorCode] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    const txnId = searchParams.get("transactionId") ||
      (typeof window !== "undefined" ? sessionStorage.getItem("phonepe_transaction_id") : "");
    if (txnId) {
      setTransactionId(txnId);
    } else {
      setStatus("ERROR");
    }
  }, [searchParams]);

  const checkStatus = useCallback(async () => {
    if (!transactionId) return;
    try {
      const response = await fetch(
        `/api/phonepe/status?transactionId=${encodeURIComponent(transactionId)}`
      );
      const data = await response.json();
      // Check both data.success and also handle cases where status is returned
      if (data.status === "SUCCESS") {
        setStatus("SUCCESS");
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("phonepe_transaction_id");
        }
      } else if (data.status === "FAILED") {
        setStatus("FAILED");
        setErrorCode(data.code || "");
      } else if (data.success && data.status === "PENDING") {
        setStatus("PENDING");
      }
      // If data.success is false and no status, keep polling
    } catch (err) {
      console.error("Status check error:", err);
    }
  }, [transactionId]);

  // Poll for status
  useEffect(() => {
    if (!transactionId || status === "SUCCESS" || status === "FAILED" || status === "ERROR") return;

    // Check immediately
    checkStatus();

    // Poll every 5 seconds
    const interval = setInterval(() => {
      setPollCount((prev) => prev + 1);
      checkStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [transactionId, status, checkStatus]);

  // Countdown timer
  useEffect(() => {
    if (status === "SUCCESS" || status === "FAILED" || status === "ERROR") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStatus("TIMEOUT");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  // Auto-redirect on success
  useEffect(() => {
    if (status === "SUCCESS") {
      const timeout = setTimeout(() => {
        router.push(`/checkout/confirmation?transactionId=${encodeURIComponent(transactionId)}`);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [status, router, transactionId]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusContent = () => {
    switch (status) {
      case "CHECKING":
      case "PENDING":
        return {
          icon: <Loader2 size={56} className="payment-status__spinner" />,
          title: "Processing Payment",
          subtitle: "Please wait while we confirm your payment with PhonePe...",
          color: "#b45309",
        };
      case "SUCCESS":
        return {
          icon: <CheckCircle size={56} />,
          title: "Payment Successful!",
          subtitle: "Your payment has been confirmed. Redirecting to order confirmation...",
          color: "#16a34a",
        };
      case "FAILED": {
        const isCancelled = errorCode === "PAYMENT_CANCELLED" || errorCode === "TXN_CANCELLED" || errorCode === "ORDER_CANCELLED_BY_USER";
        return {
          icon: <XCircle size={56} />,
          title: isCancelled ? "Payment Cancelled" : "Payment Failed",
          subtitle: isCancelled ? "You cancelled the payment process." : "Your payment could not be processed. Please try again.",
          color: "#dc2626",
        };
      }
      case "TIMEOUT":
        return {
          icon: <Clock size={56} />,
          title: "Payment Timeout",
          subtitle: "We couldn't confirm your payment in time. If money was deducted, it will be refunded within 5-7 business days.",
          color: "#dc2626",
        };
      case "ERROR":
        return {
          icon: <XCircle size={56} />,
          title: "Something Went Wrong",
          subtitle: "We couldn't find your transaction details. Please contact support.",
          color: "#dc2626",
        };
      default:
        return {
          icon: <Loader2 size={56} className="payment-status__spinner" />,
          title: "Checking...",
          subtitle: "",
          color: "#6b7280",
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className="payment-status-page">
      <div className="address-page__bg" />

      <div className="payment-status__card">
        <div className="payment-status__icon" style={{ color: content.color }}>
          {content.icon}
        </div>

        <h1 className="payment-status__title" style={{ color: content.color }}>
          {content.title}
        </h1>

        <p className="payment-status__subtitle">{content.subtitle}</p>

        {transactionId && (
          <p className="payment-status__txn-id">
            Order ID: <strong>{transactionId}</strong>
          </p>
        )}

        {(status === "CHECKING" || status === "PENDING") && (
          <div className="payment-status__timer">
            <Clock size={16} />
            <span>Time remaining: {formatTime(timeLeft)}</span>
          </div>
        )}

        {(status === "FAILED" || status === "TIMEOUT") && (
          <div className="payment-status__actions">
            <button
              className="payment-status__btn payment-status__btn--primary"
              onClick={() => router.push("/cart")}
            >
              Return to Cart
            </button>
            <button
              className="payment-status__btn payment-status__btn--secondary"
              onClick={() => router.push("/")}
            >
              Continue Shopping
            </button>
          </div>
        )}

        {status === "ERROR" && (
          <button
            className="payment-status__btn payment-status__btn--secondary"
            onClick={() => router.push("/")}
          >
            Go to Home
          </button>
        )}
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="payment-status-page">
          <div className="address-page__bg" />
          <div className="payment-status__card">
            <Loader2 size={56} className="payment-status__spinner" />
            <h1 className="payment-status__title">Checking payment status...</h1>
          </div>
        </div>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  );
}
