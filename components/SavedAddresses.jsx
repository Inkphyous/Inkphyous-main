"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "./providers/StoreProvider";
import AddressForm from "./AddressForm";
import { ArrowLeft, MapPin, Pencil, Trash2, Plus, X } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";

export default function SavedAddresses() {
  const router = useRouter();
  const { user, authLoading, requireAuth } = useStore();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      requireAuth("Login to view saved addresses");
      router.push("/");
      return;
    }
    loadAddresses();
  }, [authLoading, user]);

  const loadAddresses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/user/addresses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.addresses) {
        const list = Object.entries(data.addresses).map(([id, addr]) => ({ id, ...addr }));
        setAddresses(list);
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.error("Failed to load addresses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNew = async (addressData) => {
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
      if (res.ok) {
        await loadAddresses();
        setShowAddForm(false);
      } else {
        throw new Error("API failed");
      }
    } catch (err) {
      console.error("Failed to save address:", err);
      alert("Failed to save address.");
    }
  };

  const handleUpdate = async (addressData) => {
    if (!user || !editingId) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/user/addresses", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: editingId, ...addressData }),
      });
      if (res.ok) {
        await loadAddresses();
        setEditingId(null);
      } else {
        throw new Error("API failed");
      }
    } catch (err) {
      console.error("Failed to update address:", err);
      alert("Failed to update address.");
    }
  };

  const handleDelete = async (id) => {
    if (!user || !window.confirm("Are you sure you want to delete this address?")) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/user/addresses?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      } else {
        throw new Error("API failed");
      }
    } catch (err) {
      console.error("Failed to delete address:", err);
      alert("Failed to delete address.");
    }
  };

  const formatAddress = (addr) => {
    const parts = [addr.houseBuilding, addr.street, addr.city, addr.state, addr.pincode, addr.country].filter(Boolean);
    return parts.join(", ");
  };

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <div className="saved-addresses-page">
          <div className="address-page__bg" />
          <div className="address-page__loading">Loading...</div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="saved-addresses-page">
      <div className="address-page__bg" />

      <button 
        onClick={() => {
          if (showAddForm) {
            setShowAddForm(false);
          } else if (editingId) {
            setEditingId(null);
          } else {
            router.back();
          }
        }} 
        className="cart-back-btn shared-back-btn"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        <span>BACK</span>
      </button>

      <div className="saved-addresses-page__container">
        <div className="saved-addresses-page__header">
          <h1 className="saved-addresses-page__title">
            <MapPin size={22} />
            SAVED ADDRESSES
          </h1>
          {!showAddForm && (
            <button
              className="address-page__add-new-btn"
              onClick={() => { setShowAddForm(true); setEditingId(null); }}
            >
              <Plus size={16} />
              Add New Address
            </button>
          )}
        </div>

        {showAddForm && (
          <div className="saved-addresses-page__form-section">
            <h3>Add New Address</h3>
            <AddressForm
              onSave={handleSaveNew}
              onCancel={() => setShowAddForm(false)}
              submitLabel="Save Address"
            />
          </div>
        )}

        {editingId && (
          <div className="saved-addresses-page__form-section">
            <div className="saved-addresses-page__form-header">
              <h3>Edit Address</h3>
              <button onClick={() => setEditingId(null)} className="saved-addresses-page__close-btn">
                <X size={18} />
              </button>
            </div>
            <AddressForm
              initialData={addresses.find((a) => a.id === editingId)}
              onSave={handleUpdate}
              onCancel={() => setEditingId(null)}
              submitLabel="Update Address"
            />
          </div>
        )}

        {addresses.length === 0 && !showAddForm ? (
          <div className="saved-addresses-page__empty">
            <MapPin size={48} strokeWidth={1} />
            <p>No saved addresses yet.</p>
            <button className="address-page__add-new-btn" onClick={() => setShowAddForm(true)}>
              <Plus size={16} />
              Add Your First Address
            </button>
          </div>
        ) : (
          <div className="saved-addresses-page__grid">
            {addresses.map((addr) => (
              <div key={addr.id} className="address-card address-card--static">
                <div className="address-card__content">
                  <p className="address-card__name">{addr.receiverName}</p>
                  <p className="address-card__text">{formatAddress(addr)}</p>
                  <p className="address-card__phone">{addr.contactNumber}</p>
                </div>
                <div className="address-card__actions">
                  <button
                    className="address-card__action-btn"
                    onClick={() => { setEditingId(addr.id); setShowAddForm(false); }}
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="address-card__action-btn address-card__action-btn--danger"
                    onClick={() => handleDelete(addr.id)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    <Footer />
    </>
  );
}
