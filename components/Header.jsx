"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowLeft, User, ChevronDown, Menu } from "lucide-react";
import InphyousLogo from "./InphyousLogo";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "./providers/StoreProvider";

const NavbarLogo3D = dynamic(() => import("./NavbarLogo3D"), {
  ssr: false,
  loading: () => <div style={{ width: 52, height: 52 }} />,
});

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    viewMode,
    switchView,
    closePDP,
    language,
    setLanguage,
    user,
    logout,
    userData,
    setEditProfilePopupOpen,
    cartItems,
    t,
    requireAuth,
  } = useStore();
  const isPDP = viewMode === "pdp";
  const [langOpen, setLangOpen] = useState(false);
  
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const cartItemCount = cartItems?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 0;

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth <= 600);
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className={`header${scrolled ? " header--scrolled" : ""}`}>
        {/* Inkphyous text logo — far left */}
        <Link
          href="/"
          className="header__logo-left"
          onClick={() => {
            closePDP();
            switchView("carousel");
          }}
        >
          <InphyousLogo height={isMobile ? "20" : "32"} />
        </Link>

        {/* Center: 3D logo only */}
        <div className="header__center-nav">
          <Link
            href="/"
            className="header__3d-logo-wrapper"
            onClick={() => {
              closePDP();
              switchView("carousel");
            }}
          >
            <NavbarLogo3D />
          </Link>
        </div>

        {/* Right icons */}
        <div className="header__right-icons">
          {/* Login / Profile Dropdown Button — placed FIRST (left) */}
          {user ? (
            <div className="header__profile-container" ref={profileRef} style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} 
                className="header__login-pill header__login-pill--logged-in" 
                aria-label="Profile"
              >
                <User size={15} strokeWidth={2.5} />
                <span>{userData?.name ? userData.name.split(" ")[0].toUpperCase() : ""}</span>
                <ChevronDown size={14} strokeWidth={2.5} style={{ marginLeft: "2px" }} />
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    className="header__lang-menu"
                    style={{ right: 0, minWidth: "120px", display: "flex", flexDirection: "column", marginTop: "4px" }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <button 
                      onClick={() => {
                        router.push("/wishlist");
                        setProfileDropdownOpen(false);
                      }} 
                      style={{ padding: "8px 12px", textAlign: "left", fontSize: "12px", width: "100%" }}
                    >
                      WISHLIST
                    </button>
                    <button 
                      onClick={() => { setEditProfilePopupOpen(true); setProfileDropdownOpen(false); }} 
                      style={{ padding: "8px 12px", textAlign: "left", fontSize: "12px", width: "100%" }}
                    >
                      {t("editProfile")}
                    </button>
                    <button 
                      onClick={() => { logout(); setProfileDropdownOpen(false); }} 
                      style={{ padding: "8px 12px", textAlign: "left", fontSize: "12px", color: "#e11d48", width: "100%" }}
                    >
                      {t("signOut")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/login" className="header__login-pill" aria-label="Login">
              <User size={15} strokeWidth={2.5} />
              <span>{t("login")}</span>
            </Link>
          )}

          {/* Cart / Bag Button — placed SECOND (right), icon only with badge */}
          <button
            className="header__cart-pill"
            aria-label="Bag"
            onClick={() => {
              if (!requireAuth("Login to continue")) return;
              if (viewMode === "pdp") {
                closePDP();
                switchView("carousel");
              }
              router.push("/cart");
            }}
          >
            <div className="header__bag-icon-wrap">
              <ShoppingBag size={15} strokeWidth={2.5} />
              {cartItemCount > 0 && (
                <span className="header__bag-badge">{cartItemCount}</span>
              )}
            </div>
          </button>

          {/* Mobile Menu Dropdown */}
          <div className="header__menu-dropdown" ref={menuRef}>
            <button
              className="header__menu-pill"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              <Menu size={16} strokeWidth={2.5} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="header__lang-menu header__menu-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <button
                    onClick={() => {
                      if (!requireAuth("Login to continue")) return;
                      router.push("/wishlist");
                      setMenuOpen(false);
                    }}
                    style={{ padding: "8px 12px", textAlign: "left", fontSize: "12px", width: "100%" }}
                  >
                    WISHLIST
                  </button>

                  {user ? (
                    <button
                      onClick={() => {
                        setEditProfilePopupOpen(true);
                        setMenuOpen(false);
                      }}
                      style={{ padding: "8px 12px", textAlign: "left", fontSize: "12px", width: "100%" }}
                    >
                      {t("editProfile")}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        router.push("/login");
                        setMenuOpen(false);
                      }}
                      style={{ padding: "8px 12px", textAlign: "left", fontSize: "12px", width: "100%" }}
                    >
                      LOGIN
                    </button>
                  )}

                  <div className="header__menu-section">
                    <span className="header__menu-label">LANGUAGE</span>
                    <div className="header__menu-lang">
                      <button onClick={() => { setLanguage("en"); setMenuOpen(false); }}>EN</button>
                      <button onClick={() => { setLanguage("ar"); setMenuOpen(false); }}>AR</button>
                    </div>
                  </div>

                  {user && (
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      style={{ padding: "8px 12px", textAlign: "left", fontSize: "12px", color: "#e11d48", width: "100%" }}
                    >
                      {t("signOut")}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Language Dropdown */}
          <div className="header__lang-dropdown">
            <button
              className="header__lang-toggle"
              onClick={() => setLangOpen(!langOpen)}
            >
              {language.toUpperCase()}
              <ChevronDown size={14} strokeWidth={2.5} />
            </button>
            
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  className="header__lang-menu"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <button onClick={() => { setLanguage("en"); setLangOpen(false); }}>EN</button>
                  <button onClick={() => { setLanguage("ar"); setLangOpen(false); }}>AR</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Back button — positioned BELOW the navbar */}
      <AnimatePresence>
        {isPDP && pathname === "/" && (
          <motion.button
            className="header__back-btn shared-back-btn"
            onClick={closePDP}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <ArrowLeft size={16} strokeWidth={2} />
            <span>{t("back")}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* View toggle — Separate containers with sliding indicator */}
      <AnimatePresence>
        {!isPDP && pathname === "/" && (
          <motion.div
            className="view-toggle"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="view-toggle__track">
              {/* Sliding grey background indicator */}
              <motion.div
                className="view-toggle__indicator"
                animate={{ x: viewMode === "grid" ? 0 : 38 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
              <button
                className={`view-toggle__btn ${viewMode === "grid" ? "view-toggle__btn--active" : ""}`}
                onClick={() => switchView("grid")}
                aria-label="Grid view"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="2" y="2" width="5" height="5" rx="1.5" />
                  <rect x="9" y="2" width="5" height="5" rx="1.5" />
                  <rect x="2" y="9" width="5" height="5" rx="1.5" />
                  <rect x="9" y="9" width="5" height="5" rx="1.5" />
                </svg>
              </button>
              <button
                className={`view-toggle__btn ${viewMode === "carousel" ? "view-toggle__btn--active" : ""}`}
                onClick={() => switchView("carousel")}
                aria-label="Carousel view"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="2.5" y="4" width="3" height="8" rx="1.5" />
                  <rect x="6.5" y="2" width="3" height="12" rx="1.5" />
                  <rect x="10.5" y="4" width="3" height="8" rx="1.5" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
