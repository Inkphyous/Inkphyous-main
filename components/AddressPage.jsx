"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "./providers/StoreProvider";
import AddressForm from "./AddressForm";
import { ArrowLeft, MapPin, Plus, Check } from "lucide-react";

export default function AddressPage() {
  const router = useRouter();
  const { user, userData, authLoading, requireAuth, cartItems, cartTotal } = useStore();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedShippingId, setSelectedShippingId] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [billingType, setBillingType] = useState("same"); // "same" or "different"
  const [billingAddress, setBillingAddress] = useState(null);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [billingName, setBillingName] = useState("");
  const [initiatingPayment, setInitiatingPayment] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      requireAuth("Login to continue");
      router.push("/");
      return;
    }
    loadAddresses();
  }, [authLoading, user]);

  useEffect(() => {
    if (userData?.name) {
      setBillingName(userData.name);
    }
  }, [userData]);

  useEffect(() => {
    if (cartItems.length === 0 && !authLoading) {
      router.push("/cart");
    }
  }, [cartItems, authLoading]);

  const loadAddresses = async () => {
    if (!user) return;
    setLoadingAddresses(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/user/addresses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.addresses) {
        const list = Object.entries(data.addresses).map(([id, addr]) => ({ id, ...addr }));
        setSavedAddresses(list);
        if (list.length > 0 && !selectedShippingId) {
          setSelectedShippingId(list[0].id);
        }
      } else {
        setSavedAddresses([]);
        setShowNewForm(true);
      }
    } catch (err) {
      console.error("Failed to load addresses:", err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSaveNewAddress = async (addressData) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressData),
      });
      const data = await res.json();
      if (data.success && data.name) {
        await loadAddresses();
        setSelectedShippingId(data.name);
        setShowNewForm(false);
      } else {
        throw new Error("Failed to save via API");
      }
    } catch (err) {
      console.error("Failed to save address:", err);
      alert("Failed to save address. Please try again.");
    }
  };

  const handleSaveBillingAddress = (addressData) => {
    setBillingAddress(addressData);
    setShowBillingForm(false);
  };

  const getSelectedAddress = () => {
    return savedAddresses.find((a) => a.id === selectedShippingId);
  };

  const formatAddress = (addr) => {
    if (!addr) return "";
    const parts = [addr.houseBuilding, addr.street, addr.city, addr.state, addr.pincode, addr.country].filter(Boolean);
    return parts.join(", ");
  };

  const handleProceedToPayment = async () => {
    const shippingAddr = getSelectedAddress();
    if (!shippingAddr) return;

    let finalBillingAddress;
    if (billingType === "same") {
      finalBillingAddress = {
        ...shippingAddr,
        billingName: billingName || userData?.name || shippingAddr.receiverName,
      };
    } else {
      if (!billingAddress) return;
      finalBillingAddress = {
        ...billingAddress,
        billingName: billingName || userData?.name || billingAddress.receiverName,
      };
    }

    setInitiatingPayment(true);

    try {
      const vatRate = 0.05;
      const vatAmount = Math.round(cartTotal * vatRate);
      const totalAmount = cartTotal + vatAmount;

      const response = await fetch("/api/phonepe/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          userName: billingName || userData?.name || "",
          userEmail: user.email || "",
          userPhone: shippingAddr.contactNumber || "",
          shippingAddress: {
            ...shippingAddr,
            formattedAddress: formatAddress(shippingAddr),
          },
          billingAddress: {
            ...finalBillingAddress,
            formattedAddress: formatAddress(finalBillingAddress),
          },
        }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server returned non-JSON response. Status: ${response.status}. Body: ${responseText.slice(0, 150)}... Please check Vercel Function Logs.`);
      }

      if (data.success && data.redirectUrl) {
        // Store transaction ID for status page
        if (typeof window !== "undefined") {
          sessionStorage.setItem("phonepe_transaction_id", data.transactionId);
        }
        window.location.href = data.redirectUrl;
      } else {
        console.error("PhonePe API Error:", data.rawPhonepeData || data);
        alert(`Failed to initiate payment: ${data.error || "Unknown Error"}. Status: ${data.status || ""}. Code: ${data.code || ""}`);
      }
    } catch (err) {
      console.error("Payment initiation error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setInitiatingPayment(false);
    }
  };

  if (authLoading || loadingAddresses) {
    return (
      <div className="address-page">
        <div className="address-page__bg" />
        <div className="address-page__loading">Loading...</div>
      </div>
    );
  }

  const vatAmount = Math.round(cartTotal * 0.05);
  const totalAmount = cartTotal + vatAmount;

  return (
    <div className="address-page">
      <div className="address-page__bg" />

      <button 
        onClick={() => {
          if (showNewForm) {
            setShowNewForm(false);
          } else if (showBillingForm) {
            setShowBillingForm(false);
          } else {
            router.back();
          }
        }} 
        className="cart-back-btn shared-back-btn"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        <span>BACK</span>
      </button>

      <div className="address-page__container">
        {/* Left - Address Selection */}
        <div className="address-page__left">
          {/* Shipping Address */}
          <div className="address-page__section">
            <h2 className="address-page__section-title">
              <MapPin size={18} />
              SHIPPING ADDRESS
            </h2>

            {savedAddresses.length > 0 && !showNewForm && (
              <div className="address-page__saved-list">
                {savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    className={`address-card ${selectedShippingId === addr.id ? "address-card--selected" : ""}`}
                    onClick={() => setSelectedShippingId(addr.id)}
                  >
                    <div className="address-card__radio">
                      {selectedShippingId === addr.id && <Check size={14} />}
                    </div>
                    <div className="address-card__content">
                      <p className="address-card__name">{addr.receiverName}</p>
                      <p className="address-card__text">{formatAddress(addr)}</p>
                      <p className="address-card__phone">{addr.contactNumber}</p>
                    </div>
                  </button>
                ))}

                <button
                  className="address-page__add-new-btn"
                  onClick={() => setShowNewForm(true)}
                >
                  <Plus size={16} />
                  Add New Address
                </button>
              </div>
            )}

            {(showNewForm || savedAddresses.length === 0) && (
              <div className="address-page__form-wrap">
                {savedAddresses.length > 0 && (
                  <button
                    className="address-page__back-to-saved"
                    onClick={() => setShowNewForm(false)}
                  >
                    ← Back to saved addresses
                  </button>
                )}
                <AddressForm
                  onSave={handleSaveNewAddress}
                  onCancel={savedAddresses.length > 0 ? () => setShowNewForm(false) : null}
                  submitLabel="Save & Use This Address"
                />
              </div>
            )}
          </div>

          {/* Billing Address */}
          <div className="address-page__section">
            <h2 className="address-page__section-title">BILLING ADDRESS</h2>

            <div className="address-page__billing-name">
              <label className="address-form__label">Billing Name</label>
              <input
                type="text"
                className="address-form__input"
                value={billingName}
                onChange={(e) => setBillingName(e.target.value)}
                placeholder="Name for billing (defaults to account name)"
              />
            </div>

            <div className="address-page__billing-options">
              <label className="address-page__billing-option">
                <input
                  type="radio"
                  name="billingType"
                  value="same"
                  checked={billingType === "same"}
                  onChange={() => setBillingType("same")}
                />
                <span>Same as shipping address</span>
              </label>
              <label className="address-page__billing-option">
                <input
                  type="radio"
                  name="billingType"
                  value="different"
                  checked={billingType === "different"}
                  onChange={() => setBillingType("different")}
                />
                <span>Use a different billing address</span>
              </label>
            </div>

            {billingType === "different" && (
              <div className="address-page__billing-form">
                {billingAddress && !showBillingForm ? (
                  <div className="address-card address-card--selected" style={{ cursor: "default" }}>
                    <div className="address-card__content">
                      <p className="address-card__name">{billingAddress.receiverName}</p>
                      <p className="address-card__text">{formatAddress(billingAddress)}</p>
                      <button
                        className="address-page__change-btn"
                        onClick={() => setShowBillingForm(true)}
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <AddressForm
                    initialData={billingAddress}
                    onSave={handleSaveBillingAddress}
                    onCancel={billingAddress ? () => setShowBillingForm(false) : null}
                    submitLabel="Use This Billing Address"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right - Order Summary */}
        <div className="address-page__right">
          <div className="address-page__summary">
            <h3 className="address-page__summary-title">ORDER SUMMARY</h3>

            <div className="address-page__summary-items">
              {cartItems.map((item, idx) => (
                <div key={idx} className="address-page__summary-item">
                  <img src={item.image} alt={item.name} className="address-page__summary-img" />
                  <div className="address-page__summary-details">
                    <p className="address-page__summary-name">{item.name}</p>
                    <p className="address-page__summary-meta">
                      Size: {item.size} | Qty: {item.quantity || 1}
                    </p>
                    <p className="address-page__summary-price">
                      ₹{((item.discountPriceINR || item.priceINR) * (item.quantity || 1)).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="address-page__summary-divider" />

            <div className="address-page__summary-row">
              <span>Subtotal</span>
              <span>₹{cartTotal.toLocaleString()}</span>
            </div>
            <div className="address-page__summary-row">
              <span>VAT (5%)</span>
              <span>₹{vatAmount.toLocaleString()}</span>
            </div>
            <div className="address-page__summary-row">
              <span>Shipping</span>
              <span style={{ color: "#16a34a" }}>Free</span>
            </div>

            <div className="address-page__summary-divider" />

            <div className="address-page__summary-row address-page__summary-row--total">
              <span>TOTAL</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>

            <button
              className="address-page__pay-btn"
              onClick={handleProceedToPayment}
              disabled={initiatingPayment || !selectedShippingId || (billingType === "different" && !billingAddress)}
            >
              {initiatingPayment ? "Redirecting to PhonePe..." : "PROCEED TO PAYMENT"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
