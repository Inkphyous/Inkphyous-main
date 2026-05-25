"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useStore } from "./providers/StoreProvider";

export default function LoginRequiredPopup() {
  const router = useRouter();
  const { loginPromptOpen, loginPromptMessage, closeLoginPrompt } = useStore();

  return (
    <AnimatePresence>
      {loginPromptOpen && (
        <motion.div
          className="auth-popup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeLoginPrompt}
        >
          <motion.div
            className="auth-popup-card"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="auth-popup-close" onClick={closeLoginPrompt} aria-label="Close">
              <X size={16} strokeWidth={2.25} />
            </button>
            <h3 className="auth-popup-title">LOGIN REQUIRED</h3>
            <p className="auth-popup-message">{loginPromptMessage || "Login to continue"}</p>
            <button
              className="auth-popup-login-btn"
              onClick={() => {
                closeLoginPrompt();
                router.push("/login");
              }}
            >
              LOGIN
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

