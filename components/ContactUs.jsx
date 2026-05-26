"use client";

import React, { useState } from "react";
import { ChevronDown, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "./providers/StoreProvider";
import { db } from "@/lib/firebase";
import { ref, push, serverTimestamp } from "firebase/database";

const FloatingInput = ({ value, onChange, placeholder, type = "text" }) => {
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || value.trim() !== "";
  
  return (
    <div style={{ position: "relative", width: "100%", height: "45px" }}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: "100%",
          height: "100%",
          border: "1px solid #d1d5db",
          padding: isActive ? "18px 16px 4px" : "0 16px",
          fontSize: "12px",
          fontFamily: "var(--font-body)",
          color: "#000",
          outline: "none",
          backgroundColor: "transparent",
          margin: 0,
          transition: "padding 0.2s ease"
        }}
      />
      <label
        style={{
          position: "absolute",
          left: "16px",
          top: isActive ? "8px" : "50%",
          transform: isActive ? "none" : "translateY(-50%)",
          fontSize: isActive ? "9px" : "12px",
          color: isActive ? "#999" : "#a0a0a0",
          pointerEvents: "none",
          transition: "all 0.2s ease",
          fontFamily: "var(--font-heading)",
          letterSpacing: "1px",
          fontWeight: "bold",
          textTransform: "uppercase"
        }}
      >
        {placeholder}
      </label>
    </div>
  );
};

const FloatingDropdown = ({ value, onClick, isOpen, subjects, onSelect, placeholder }) => {
  const isActive = true; // Dropdown always has a value or default active state
  return (
    <div style={{ position: "relative", width: "100%", height: "45px" }}>
      <div
        onClick={onClick}
        style={{
          width: "100%",
          height: "100%",
          border: "1px solid #d1d5db",
          padding: isActive ? "18px 16px 4px" : "0 16px",
          fontSize: "12px",
          fontFamily: "var(--font-heading)",
          color: "#000",
          outline: "none",
          backgroundColor: "transparent",
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          fontWeight: "bold",
          letterSpacing: "1px"
        }}
      >
        <span style={{ color: value ? "#000" : "#9ca3af" }}>{value || "GENERAL INQUIRY"}</span>
        <ChevronDown style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} size={16} />
      </div>
      <label
        style={{
          position: "absolute",
          left: "16px",
          top: isActive ? "8px" : "50%",
          transform: isActive ? "none" : "translateY(-50%)",
          fontSize: isActive ? "9px" : "12px",
          color: isActive ? "#999" : "#a0a0a0",
          pointerEvents: "none",
          transition: "all 0.2s ease",
          fontFamily: "var(--font-heading)",
          letterSpacing: "1px",
          fontWeight: "bold",
          textTransform: "uppercase"
        }}
      >
        {placeholder}
      </label>
      
      {isOpen && (
        <div style={{ position: "absolute", zIndex: 20, width: "100%", background: "#fff", border: "1px solid #d1d5db", borderTop: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", maxHeight: "240px", overflowY: "auto" }}>
          {subjects.map((sub, idx) => (
            <div
              key={idx}
              onClick={() => onSelect(sub)}
              style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "bold", letterSpacing: "1px", fontFamily: "var(--font-heading)", cursor: "pointer", color: "#000", borderBottom: idx !== subjects.length - 1 ? "1px solid #f3f4f6" : "none" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              {sub}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FloatingTextarea = ({ value, onChange, placeholder }) => {
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || value.trim() !== "";
  
  return (
    <div style={{ position: "relative", width: "100%", height: "150px" }}>
      <textarea
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: "100%",
          height: "100%",
          border: "1px solid #d1d5db",
          padding: isActive ? "24px 16px 14px" : "14px 16px",
          fontSize: "12px",
          fontFamily: "var(--font-body)",
          color: "#000",
          outline: "none",
          resize: "none",
          backgroundColor: "transparent",
          margin: 0,
          transition: "padding 0.2s ease"
        }}
      />
      <label
        style={{
          position: "absolute",
          left: "16px",
          top: isActive ? "8px" : "14px",
          fontSize: isActive ? "9px" : "12px",
          color: isActive ? "#999" : "#a0a0a0",
          pointerEvents: "none",
          transition: "all 0.2s ease",
          fontFamily: "var(--font-heading)",
          letterSpacing: "1px",
          fontWeight: "bold",
          textTransform: "uppercase"
        }}
      >
        {placeholder}
      </label>
    </div>
  );
};

const ContactUs = () => {
  const router = useRouter();
  const { t } = useStore();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // null | 'success' | 'error'

  const subjects = [
    "General Inquiry",
    "Order Status",
    "Return & Exchange",
    "Damages",
    "My Account",
    "Cancellation Request",
    "Others"
  ];

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim() || !selectedSubject.trim()) return;
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      const queriesRef = ref(db, 'queries');
      await push(queriesRef, {
        name: name.trim(),
        email: email.trim(),
        subject: selectedSubject.trim(),
        message: message.trim(),
        status: 'pending',
        timestamp: serverTimestamp()
      });
      setSubmitStatus('success');
      setName("");
      setEmail("");
      setMessage("");
      setSelectedSubject("");
      setTimeout(() => setSubmitStatus(null), 5000);
    } catch (error) {
      console.error("Error submitting query:", error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFilled = name.trim() !== "" && email.trim() !== "" && message.trim() !== "" && selectedSubject.trim() !== "";

  // Button dynamic styles
  let btnBg = "transparent";
  let btnColor = "#000";
  let btnBorder = "1px solid #000";

  if (isFilled) {
    if (isHovered) {
      btnBg = "#e11d48";
      btnColor = "#fff";
      btnBorder = "1px solid #e11d48";
    } else {
      btnBg = "#000";
      btnColor = "#fff";
      btnBorder = "1px solid #000";
    }
  } else {
    if (isHovered) {
      btnBg = "transparent";
      btnColor = "#e11d48";
      btnBorder = "1px solid #e11d48";
    } else {
      btnBg = "transparent";
      btnColor = "#000";
      btnBorder = "1px solid #000";
    }
  }

  const labelStyle = {
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "2px",
    fontFamily: "var(--font-heading)",
    color: "#000",
    textTransform: "uppercase"
  };

  return (
    <div style={{ minHeight: "100vh", paddingTop: "140px", paddingBottom: "100px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
      {/* Background gradient */}
      <div style={{ position: "fixed", inset: 0, zIndex: -20, background: "radial-gradient(ellipse 160% 80% at 50% 10%, #ffffff 0%, #f6f6f4 35%, #ececeb 65%, #e5e5e3 100%)" }} />

      {/* BACK BUTTON */}
      <button
        onClick={() => router.push('/')}
        className="shared-back-btn"
        style={{ position: "absolute", top: "100px", left: "32px", zIndex: 60 }}
      >
        <ArrowLeft size={16} strokeWidth={2} />
        <span>{t('back')}</span>
      </button>

      {/* MAIN CONTAINER */}
      <div style={{ width: "100%", maxWidth: "800px", padding: "0 24px" }}>
        
        {/* TOP TEXT SECTION */}
        <div style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "20px", letterSpacing: "4px", marginBottom: "40px", fontFamily: "var(--font-heading)", fontWeight: "600", color: "#000" }}>CONTACT</h1>
          
          <h2 style={{ fontSize: "11px", letterSpacing: "2px", fontWeight: "bold", marginBottom: "8px", fontFamily: "var(--font-heading)", color: "#000" }}>ENQUIRIES</h2>
          <p style={{ fontSize: "11px", letterSpacing: "2px", fontWeight: "bold", marginBottom: "40px", fontFamily: "var(--font-heading)", color: "#000" }}>INFO@INKPHYYOUS.COM</p>
          
          <h2 style={{ fontSize: "11px", letterSpacing: "2px", fontWeight: "bold", marginBottom: "16px", fontFamily: "var(--font-heading)", color: "#000" }}>SEND US A MESSAGE</h2>
          <p style={{ fontSize: "13px", lineHeight: "1.6", color: "#333", fontFamily: "var(--font-body)", maxWidth: "700px" }}>
            If you have any questions about your order or need further assistance, you can always contact us at info@inkphyous.com. Alternatively, please complete the form by selecting a subject and entering your question or comment. Our Customer Service team will review your message and respond as soon as possible.
          </p>
        </div>

        {/* FORM SECTION */}
        <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
          {/* LABELS COLUMN */}
          <div style={{ width: "120px", borderRight: "1.5px solid #e11d48", paddingRight: "24px", display: "flex", flexDirection: "column", gap: "24px", flexShrink: 0 }}>
            <div style={{ height: "45px", display: "flex", alignItems: "center" }}><span style={labelStyle}>NAME</span></div>
            <div style={{ height: "45px", display: "flex", alignItems: "center" }}><span style={labelStyle}>SUBJECT</span></div>
            <div style={{ height: "45px", display: "flex", alignItems: "center" }}><span style={labelStyle}>EMAIL</span></div>
            <div style={{ height: "150px", display: "flex", alignItems: "flex-start", paddingTop: "14px" }}><span style={labelStyle}>MESSAGE</span></div>
            <div style={{ height: "45px" }}></div>
          </div>

          {/* INPUTS COLUMN */}
          <div style={{ flex: 1, paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
            <FloatingInput
              placeholder="NAME"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <FloatingDropdown
              placeholder="SUBJECT"
              value={selectedSubject}
              isOpen={isSubjectOpen}
              onClick={() => setIsSubjectOpen(!isSubjectOpen)}
              subjects={subjects}
              onSelect={(sub) => {
                setSelectedSubject(sub);
                setIsSubjectOpen(false);
              }}
            />

            <FloatingInput
              placeholder="EMAIL"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <FloatingTextarea
              placeholder="MESSAGE"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <button
              onClick={handleSubmit}
              disabled={!isFilled || isSubmitting}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                width: "100%",
                height: "45px",
                backgroundColor: !isFilled ? "transparent" : (isHovered ? "#e11d48" : "#000"),
                color: !isFilled ? (isHovered ? "#e11d48" : "#000") : "#fff",
                border: !isFilled ? (isHovered ? "1px solid #e11d48" : "1px solid #000") : (isHovered ? "1px solid #e11d48" : "1px solid #000"),
                fontSize: "11px",
                fontWeight: "bold",
                letterSpacing: "2px",
                fontFamily: "var(--font-heading)",
                textTransform: "uppercase",
                cursor: (!isFilled || isSubmitting) ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                margin: 0,
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? "SENDING..." : "SEND"}
            </button>
            
            {submitStatus === 'success' && (
              <div style={{ color: "#2f8f48", fontSize: "12px", fontWeight: "bold", fontFamily: "var(--font-heading)", letterSpacing: "1px", textAlign: "center" }}>
                Message sent successfully! We will get back to you soon.
              </div>
            )}
            {submitStatus === 'error' && (
              <div style={{ color: "#e11d48", fontSize: "12px", fontWeight: "bold", fontFamily: "var(--font-heading)", letterSpacing: "1px", textAlign: "center" }}>
                Failed to send message. Please try again later.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
