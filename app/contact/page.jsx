"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Mail, Phone, MapPin } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const subjects = [
  "General Inquiry",
  "Order Status",
  "Return & Exchange",
  "Damages",
  "My Account",
  "Cancellation Request",
  "Others",
];

const titles = ["Mr.", "Mrs.", "Ms.", "Dr.", "Prof."];
const phonePrefixes = ["+971", "+91", "+1", "+44", "+966", "+965", "+974", "+973", "+968"];

export default function ContactPage() {
  const router = useRouter();
  const { t } = useStore();

  const [formData, setFormData] = useState({
    title: "",
    firstName: "",
    lastName: "",
    email: "",
    phonePrefix: "+91",
    phone: "",
    subject: "",
    message: "",
  });

  const [titleOpen, setTitleOpen] = useState(false);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [prefixOpen, setPrefixOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setFormData({
      title: "",
      firstName: "",
      lastName: "",
      email: "",
      phonePrefix: "+91",
      phone: "",
      subject: "",
      message: "",
    });
  };

  return (
    <>
      <Header />
      <main className="contact-page-main">
        {/* ─── LEFT COLUMN: info ─── */}
        <aside className="contact-info-col">
          <div className="contact-info-inner">
            <h1 className="contact-info-heading">CONTACT</h1>

            <div className="contact-info-block">
              <h2 className="contact-info-label">General Inquiries</h2>
              <a href="mailto:info@inkphyous.com" className="contact-info-link">
                info@inkphyous.com
              </a>
            </div>

            <div className="contact-info-block">
              <h2 className="contact-info-label">Customer Support</h2>
              <p className="contact-info-text">
                Monday – Friday<br />
                10:00 AM – 6:00 PM IST
              </p>
            </div>

            <div className="contact-info-block">
              <h2 className="contact-info-label">Returns &amp; Exchanges</h2>
              <p className="contact-info-text">
                For return and exchange queries,<br />
                please use the form alongside.
              </p>
            </div>

            <div className="contact-info-block">
              <h2 className="contact-info-label">Note</h2>
              <p className="contact-info-text">
                To ensure you receive emails from Inkphyous, please check your
                spam folder. Add{" "}
                <a href="mailto:info@inkphyous.com" className="contact-info-link">
                  info@inkphyous.com
                </a>{" "}
                to your Safe Senders list.
              </p>
            </div>
          </div>
        </aside>

        {/* ─── DIVIDER ─── */}
        <div className="contact-divider" />

        {/* ─── RIGHT COLUMN: form ─── */}
        <section className="contact-form-col">
          <div className="contact-form-inner">
            <h2 className="contact-form-heading">Send us a message</h2>

            {submitted && (
              <div className="contact-success-msg">
                ✓ Your message has been sent. We'll get back to you soon.
              </div>
            )}

            <form onSubmit={handleSubmit} className="contact-form">
              {/* Title dropdown */}
              <div className="cf-field cf-dropdown-wrap">
                <div
                  className="cf-select"
                  onClick={() => {
                    setTitleOpen(!titleOpen);
                    setSubjectOpen(false);
                    setPrefixOpen(false);
                  }}
                >
                  <span className={formData.title ? "cf-select-value" : "cf-select-placeholder"}>
                    {formData.title || "Title"}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`cf-chevron ${titleOpen ? "cf-chevron--open" : ""}`}
                  />
                </div>
                {titleOpen && (
                  <div className="cf-dropdown">
                    {titles.map((ti) => (
                      <div
                        key={ti}
                        className="cf-dropdown-option"
                        onClick={() => {
                          handleChange("title", ti);
                          setTitleOpen(false);
                        }}
                      >
                        {ti}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* First + Last Name */}
              <div className="cf-row">
                <div className="cf-field cf-float">
                  <input
                    type="text"
                    id="firstName"
                    placeholder=" "
                    className="cf-input"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    required
                  />
                  <label htmlFor="firstName" className="cf-label">First Name *</label>
                </div>
                <div className="cf-field cf-float">
                  <input
                    type="text"
                    id="lastName"
                    placeholder=" "
                    className="cf-input"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    required
                  />
                  <label htmlFor="lastName" className="cf-label">Last Name *</label>
                </div>
              </div>

              {/* Email */}
              <div className="cf-field cf-float">
                <input
                  type="email"
                  id="email"
                  placeholder=" "
                  className="cf-input"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
                <label htmlFor="email" className="cf-label">Email Address *</label>
              </div>

              {/* Phone: prefix + number */}
              <div className="cf-row cf-phone-row">
                <div className="cf-field cf-dropdown-wrap cf-prefix-wrap">
                  <div
                    className="cf-select cf-prefix-select"
                    onClick={() => {
                      setPrefixOpen(!prefixOpen);
                      setTitleOpen(false);
                      setSubjectOpen(false);
                    }}
                  >
                    <div className="cf-prefix-inner">
                      <span className="cf-prefix-label">Code</span>
                      <span className="cf-select-value">{formData.phonePrefix}</span>
                    </div>
                    <ChevronDown
                      size={12}
                      className={`cf-chevron ${prefixOpen ? "cf-chevron--open" : ""}`}
                    />
                  </div>
                  {prefixOpen && (
                    <div className="cf-dropdown cf-prefix-dropdown">
                      {phonePrefixes.map((p) => (
                        <div
                          key={p}
                          className="cf-dropdown-option"
                          onClick={() => {
                            handleChange("phonePrefix", p);
                            setPrefixOpen(false);
                          }}
                        >
                          {p}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="cf-field cf-float cf-phone-field">
                  <input
                    type="tel"
                    id="phone"
                    placeholder=" "
                    className="cf-input"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                  <label htmlFor="phone" className="cf-label">Phone Number</label>
                </div>
              </div>

              {/* Subject dropdown */}
              <div className="cf-field cf-dropdown-wrap">
                <div
                  className="cf-select"
                  onClick={() => {
                    setSubjectOpen(!subjectOpen);
                    setTitleOpen(false);
                    setPrefixOpen(false);
                  }}
                >
                  <span className={formData.subject ? "cf-select-value" : "cf-select-placeholder"}>
                    {formData.subject || "Subject *"}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`cf-chevron ${subjectOpen ? "cf-chevron--open" : ""}`}
                  />
                </div>
                {subjectOpen && (
                  <div className="cf-dropdown">
                    {subjects.map((s) => (
                      <div
                        key={s}
                        className="cf-dropdown-option"
                        onClick={() => {
                          handleChange("subject", s);
                          setSubjectOpen(false);
                        }}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message */}
              <div className="cf-field cf-float cf-textarea-wrap">
                <textarea
                  id="message"
                  placeholder=" "
                  className="cf-input cf-textarea"
                  rows={6}
                  maxLength={1000}
                  value={formData.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  required
                />
                <label htmlFor="message" className="cf-label">Your inquiry or comment *</label>
                <span className="cf-char-count">{formData.message.length}/1000</span>
              </div>

              {/* Submit */}
              <button type="submit" className="cf-submit-btn">
                SEND MESSAGE
              </button>

              <p className="cf-disclaimer">
                In case of any queries, you can also email us directly at{" "}
                <a href="mailto:info@inkphyous.com" className="cf-disclaimer-link">
                  info@inkphyous.com
                </a>
              </p>
            </form>
          </div>
        </section>
      </main>
      <Footer />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,1..1000&display=swap');

        .contact-page-main {
          font-family: 'Google Sans Flex', 'Google Sans', sans-serif;
          display: grid;
          grid-template-columns: 1fr 1px 1.4fr;
          min-height: calc(100vh - var(--header-height, 52px));
          margin-top: var(--header-height, 52px);
          background: #fff;
        }

        /* ── LEFT INFO COLUMN ── */
        .contact-info-col {
          padding: 80px 60px 80px 80px;
          background: #fff;
        }
        .contact-info-inner {
          max-width: 320px;
          position: sticky;
          top: calc(var(--header-height, 52px) + 40px);
        }
        .contact-info-heading {
          font-family: 'Barlow Condensed', 'Google Sans Flex', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #000;
          margin-bottom: 48px;
        }
        .contact-info-block {
          margin-bottom: 40px;
        }
        .contact-info-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #999;
          margin-bottom: 8px;
        }
        .contact-info-link {
          font-size: 13px;
          color: #000;
          text-decoration: none;
          border-bottom: 1px solid #000;
          padding-bottom: 1px;
          transition: color 0.2s;
        }
        .contact-info-link:hover {
          color: #e11d48;
          border-bottom-color: #e11d48;
        }
        .contact-info-text {
          font-size: 13px;
          color: #555;
          line-height: 1.7;
        }

        /* ── DIVIDER ── */
        .contact-divider {
          width: 1px;
          background: #e5e5e5;
          margin: 60px 0;
        }

        /* ── RIGHT FORM COLUMN ── */
        .contact-form-col {
          padding: 80px 80px 80px 60px;
          background: #fff;
        }
        .contact-form-inner {
          max-width: 560px;
        }
        .contact-form-heading {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #000;
          margin-bottom: 40px;
        }

        /* ── SUCCESS ── */
        .contact-success-msg {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
          padding: 12px 16px;
          font-size: 13px;
          margin-bottom: 24px;
          letter-spacing: 0.3px;
        }

        /* ── FORM FIELDS ── */
        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .cf-field {
          margin-bottom: 20px;
        }
        .cf-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        .cf-row .cf-field {
          margin-bottom: 0;
        }
        .cf-phone-row {
          grid-template-columns: 100px 1fr;
        }

        /* Floating label inputs */
        .cf-float {
          position: relative;
        }
        .cf-input {
          width: 100%;
          border: none;
          border-bottom: 1px solid #ccc;
          padding: 20px 0 8px;
          font-family: 'Google Sans Flex', 'Google Sans', sans-serif;
          font-size: 13px;
          color: #000;
          background: transparent;
          outline: none;
          transition: border-color 0.2s;
        }
        .cf-input:focus {
          border-bottom-color: #000;
        }
        .cf-label {
          position: absolute;
          left: 0;
          top: 20px;
          font-size: 13px;
          color: #999;
          pointer-events: none;
          transition: all 0.2s ease;
        }
        .cf-input:focus ~ .cf-label,
        .cf-input:not(:placeholder-shown) ~ .cf-label {
          top: 4px;
          font-size: 10px;
          letter-spacing: 1px;
          color: #000;
        }
        .cf-textarea {
          resize: none;
          padding-top: 24px;
        }
        .cf-textarea-wrap {
          position: relative;
        }
        .cf-char-count {
          position: absolute;
          bottom: 8px;
          right: 0;
          font-size: 10px;
          color: #bbb;
        }

        /* Dropdowns */
        .cf-dropdown-wrap {
          position: relative;
        }
        .cf-select {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 0 8px;
          border-bottom: 1px solid #ccc;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .cf-select:hover {
          border-bottom-color: #000;
        }
        .cf-select-placeholder {
          font-size: 13px;
          color: #999;
        }
        .cf-select-value {
          font-size: 13px;
          color: #000;
        }
        .cf-chevron {
          color: #999;
          transition: transform 0.2s;
          flex-shrink: 0;
        }
        .cf-chevron--open {
          transform: rotate(180deg);
        }
        .cf-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #fff;
          border: 1px solid #e5e5e5;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          z-index: 100;
          max-height: 200px;
          overflow-y: auto;
        }
        .cf-dropdown-option {
          padding: 12px 16px;
          font-size: 13px;
          color: #333;
          cursor: pointer;
          transition: background 0.15s;
        }
        .cf-dropdown-option:hover {
          background: #f7f7f7;
        }
        .cf-prefix-wrap {
          margin-bottom: 0;
        }
        .cf-prefix-select {
          padding: 12px 0 8px;
        }
        .cf-prefix-inner {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .cf-prefix-label {
          font-size: 10px;
          letter-spacing: 1px;
          color: #999;
          text-transform: uppercase;
        }
        .cf-prefix-dropdown {
          width: 120px;
        }
        .cf-phone-field {
          margin-bottom: 0;
        }

        /* Submit */
        .cf-submit-btn {
          margin-top: 12px;
          width: 100%;
          background: #000;
          color: #fff;
          font-family: 'Google Sans Flex', 'Google Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 3px;
          text-transform: uppercase;
          padding: 16px 24px;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }
        .cf-submit-btn:hover {
          background: #e11d48;
        }

        /* Disclaimer */
        .cf-disclaimer {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #f0f0f0;
          font-size: 12px;
          color: #999;
          line-height: 1.6;
        }
        .cf-disclaimer-link {
          color: #000;
          text-decoration: none;
          border-bottom: 1px solid #ccc;
          transition: color 0.2s, border-color 0.2s;
        }
        .cf-disclaimer-link:hover {
          color: #e11d48;
          border-bottom-color: #e11d48;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .contact-page-main {
            grid-template-columns: 1fr;
          }
          .contact-divider {
            width: 100%;
            height: 1px;
            margin: 0 40px;
          }
          .contact-info-col {
            padding: 48px 32px 32px;
          }
          .contact-info-inner {
            max-width: 100%;
            position: static;
          }
          .contact-form-col {
            padding: 32px 32px 64px;
          }
          .cf-row {
            grid-template-columns: 1fr;
          }
          .cf-phone-row {
            grid-template-columns: 100px 1fr;
          }
        }
        @media (max-width: 480px) {
          .contact-info-col {
            padding: 40px 20px 24px;
          }
          .contact-form-col {
            padding: 24px 20px 48px;
          }
        }
      `}</style>
    </>
  );
}
