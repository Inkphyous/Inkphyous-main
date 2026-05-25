"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useStore } from "./providers/StoreProvider";
import { db } from "@/lib/firebase";
import { ref, update } from "firebase/database";

export default function EditProfilePopup() {
  const { user, userData, editProfilePopupOpen, setEditProfilePopupOpen } = useStore();
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Sync state with global userData when popup opens
  useEffect(() => {
    if (editProfilePopupOpen && userData) {
      setName(userData.name || "");
      const phoneStr = userData.phone || "";
      const spaceIdx = phoneStr.indexOf(" ");
      if (spaceIdx !== -1) {
        setCountryCode(phoneStr.substring(0, spaceIdx));
        setPhone(phoneStr.substring(spaceIdx + 1));
      } else {
        setCountryCode("+91");
        setPhone(phoneStr);
      }
    }
  }, [editProfilePopupOpen, userData]);

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    setErrorMsg("");
    
    try {
      await update(ref(db, `users/${user.uid}`), {
        name: name.trim(),
        phone: `${countryCode} ${phone.trim()}`
      });
      setEditProfilePopupOpen(false);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!editProfilePopupOpen) return null;

  return (
    <AnimatePresence>
      <div className="popup-overlay">
        <motion.div
          className="popup-container"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <button
            className="popup-close"
            onClick={() => setEditProfilePopupOpen(false)}
            aria-label="Close Edit Profile"
          >
            <X size={24} strokeWidth={1.5} />
          </button>

          <h2 className="popup-title">EDIT PROFILE</h2>
          <p className="popup-subtitle">Update your personal details below.</p>
          
          {errorMsg && (
            <div style={{ color: "#e11d48", fontSize: "12px", marginBottom: "16px", textAlign: "center" }}>
              {errorMsg}
            </div>
          )}

          <div className="popup-form">
            <div className="floating-group">
              <input
                type="text"
                className="login-input"
                placeholder=" "
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <label className="floating-label">Full Name*</label>
            </div>

            <div className="phone-group" style={{ display: "flex", gap: "8px" }}>
              <select 
                className="login-input" 
                style={{ width: "100px", padding: "16px 8px" }}
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
              >
                <option value="+91">+91 (IN)</option>
                <option value="+1">+1 (US)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+61">+61 (AU)</option>
                <option value="+971">+971 (AE)</option>
              </select>
              <div className="floating-group" style={{ flex: 1 }}>
                <input
                  type="tel"
                  className="login-input"
                  placeholder=" "
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <label className="floating-label">Phone Number*</label>
              </div>
            </div>

            <button 
              className="popup-submit" 
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? "SAVING..." : "SAVE CHANGES"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
