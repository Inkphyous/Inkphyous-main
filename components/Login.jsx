"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useStore } from "./providers/StoreProvider";
import { auth, googleProvider, db } from "@/lib/firebase";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set, get } from "firebase/database";

// Google "G" icon as inline SVG
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

// Apple icon
const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

// Slide transition variants
const slideVariants = {
  initial: (direction) => ({ 
    y: direction > 0 ? "100%" : "-100%", 
    opacity: 0 
  }),
  animate: { 
    y: 0, 
    opacity: 1, 
    transition: { type: "spring", stiffness: 200, damping: 25 } 
  },
  exit: (direction) => ({ 
    y: direction > 0 ? "-100%" : "100%", 
    opacity: 0, 
    transition: { duration: 0.35, ease: "easeInOut" } 
  }),
};

const Login = () => {
  const router = useRouter();
  const { t } = useStore();

  // "login-main" | "login-password" | "signup-email" | "signup-password"
  const [step, setStep] = useState("login-main");
  const [direction, setDirection] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleContinueEmail = useCallback(() => {
    if (!email.trim()) return;
    setErrorMsg("");
    setDirection(1);
    setStep("login-password");
  }, [email]);

  const handleSignup = useCallback(() => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setPhone("");
    setCountryCode("+91");
    setErrorMsg("");
    setDirection(1);
    setStep("signup-email");
  }, []);

  const handleSignupContinue = useCallback(() => {
    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }
    if (!email.trim()) {
      setErrorMsg("Please enter your email.");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("Please enter your phone number.");
      return;
    }
    setErrorMsg("");
    setDirection(1);
    setStep("signup-password");
  }, [name, email, phone]);

  const handleGoogleLogin = async () => {
    try {
      setErrorMsg("");
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      
      // Save profile if they are new
      const userRef = ref(db, `users/${result.user.uid}`);
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        await set(userRef, {
          name: result.user.displayName || "Google User",
          email: result.user.email,
          phone: result.user.phoneNumber || "",
          createdAt: Date.now()
        });
      }
      router.push("/");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to sign in with Google.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!password.trim()) {
      setErrorMsg("Please enter a password.");
      return;
    }
    
    const isLogin = step === "login-password";
    
    if (!isLogin && password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await set(ref(db, `users/${result.user.uid}`), {
          name: name.trim(),
          email: email.trim(),
          phone: `${countryCode} ${phone.trim()}`,
          createdAt: Date.now()
        });
      }
      router.push("/");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = useCallback(
    (e, action) => {
      if (e.key === "Enter") action();
    },
    []
  );

  return (
    <div className="login-page">
      <div className="login-page__bg" />

      {/* Back button below navbar */}
      <button
        onClick={() => {
          setDirection(-1);
          if (step === "login-main") {
            router.push("/");
          } else if (step === "login-password") {
            setStep("login-main");
            setPassword("");
          } else if (step === "signup-email") {
            setStep("login-main");
            setEmail("");
          } else if (step === "signup-password") {
            setStep("signup-email");
            setPassword("");
          }
        }}
        className="login-back-btn shared-back-btn"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        <span>{t("back")}</span>
      </button>

      <div className="login-container">
        <AnimatePresence mode="wait" custom={direction}>
          {/* STEP 1: Main Login */}
          {step === "login-main" && (
            <motion.div
              key="login-main"
              className="login-step"
              variants={slideVariants}
              custom={direction}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <h1 className="login-heading">{t("myAccount")}</h1>

              {errorMsg && (
                <div style={{ color: "#e11d48", fontSize: "12px", marginBottom: "16px", textAlign: "center", fontWeight: "500" }}>
                  {errorMsg}
                </div>
              )}

              <div className="login-social-buttons">
                <button
                  className="login-social-btn"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <GoogleIcon />
                  <span>{t("continueWithGoogle")}</span>
                </button>

                <button
                  className="login-social-btn"
                  onClick={() => alert("Apple login coming soon!")}
                >
                  <AppleIcon />
                  <span>{t("continueWithApple")}</span>
                </button>
              </div>

              <div className="login-or-divider">
                <span>{t("or")}</span>
              </div>

              <h2 className="login-email-heading">{t("continueWithEmail")}</h2>
              <p className="login-email-subtitle">
                {t("loginSubtitle")}
              </p>

              <div className="login-email-form">
                <div className="floating-group">
                  <input
                    type="email"
                    className="login-input"
                    placeholder=" "
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleContinueEmail)}
                  />
                  <label className="floating-label">Email*</label>
                </div>
                <button className="login-continue-btn" onClick={handleContinueEmail}>
                  {t("continue")}
                </button>
              </div>

              <button className="login-signup-link" onClick={handleSignup}>
                {t("signUp")}
              </button>
            </motion.div>
          )}

          {/* STEP 2: Login Password */}
          {step === "login-password" && (
            <motion.div
              key="login-password"
              className="login-step"
              variants={slideVariants}
              custom={direction}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <h2 className="login-email-heading">CONTINUE WITH YOUR EMAIL ADDRESS</h2>
              <p className="login-email-subtitle">
                Sign in with your email and password or create a profile if you are new.
              </p>

              <div className="login-email-form">
                <div className="login-input login-input--filled">
                  <span className="login-input-label">Email*</span>
                  <span className="login-input-value">{email}</span>
                </div>
                <div className="floating-group">
                  <input
                    type="password"
                    className="login-input"
                    placeholder=" "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleFinalSubmit)}
                    autoFocus
                  />
                  <label className="floating-label">Password*</label>
                </div>
                <button className="login-continue-btn" onClick={handleFinalSubmit}>
                  CONTINUE
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Signup Email */}
          {step === "signup-email" && (
            <motion.div
              key="signup-email"
              className="login-step"
              variants={slideVariants}
              custom={direction}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <h1 className="login-heading">CREATE YOUR ACCOUNT</h1>

              <p className="login-email-subtitle">
                Enter your details to create a new Inkphyous account.
              </p>

              <div className="login-email-form">
                <div className="floating-group">
                  <input
                    type="text"
                    className="login-input"
                    placeholder=" "
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                  <label className="floating-label">Full Name*</label>
                </div>

                <div className="floating-group">
                  <input
                    type="email"
                    className="login-input"
                    placeholder=" "
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <label className="floating-label">Email*</label>
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
                      onKeyDown={(e) => handleKeyDown(e, handleSignupContinue)}
                    />
                    <label className="floating-label">Phone Number*</label>
                  </div>
                </div>

                <button className="login-continue-btn" onClick={handleSignupContinue}>
                  CONTINUE
                </button>
              </div>

              <button
                className="login-signup-link"
                onClick={() => { setDirection(-1); setStep("login-main"); setEmail(""); setPassword(""); setPhone(""); setName(""); }}
              >
                Back to Login
              </button>
            </motion.div>
          )}

          {/* STEP 4: Signup Password */}
          {step === "signup-password" && (
            <motion.div
              key="signup-password"
              className="login-step"
              variants={slideVariants}
              custom={direction}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <h2 className="login-email-heading">CREATE YOUR ACCOUNT</h2>
              <p className="login-email-subtitle">
                Choose a password for your new account.
              </p>

              <div className="login-email-form">
                <div className="login-input login-input--filled">
                  <span className="login-input-label">Email*</span>
                  <span className="login-input-value">{email}</span>
                </div>
                <div className="floating-group">
                  <input
                    type="password"
                    className="login-input"
                    placeholder=" "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                  <label className="floating-label">Password*</label>
                </div>
                <div className="floating-group">
                  <input
                    type="password"
                    className="login-input"
                    placeholder=" "
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleFinalSubmit)}
                  />
                  <label className="floating-label">Confirm Password*</label>
                </div>
                
                <button 
                  className="login-continue-btn" 
                  onClick={handleFinalSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? "CREATING..." : "CREATE ACCOUNT"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Login;
