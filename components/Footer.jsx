"use client";
import React from "react";
import Link from "next/link";
import { useStore } from "./providers/StoreProvider";

const Footer = () => {
  const { t } = useStore();

  return (
    <footer 
      id="global-footer"
      className="footer-links"
    >
      {/* Contact Link */}
      <Link
        href="/contact"
        className="footer-links__item title"
      >
        {t("contact")}
      </Link>

      {/* Legalities Link */}
      <Link
        href="/legal"
        className="footer-links__item title"
      >
        {t("legalities")}
      </Link>

      {/* Social Link */}
      <a
        href="https://instagram.com/inkphyous"
        target="_blank"
        rel="noopener noreferrer"
        className="footer-links__item title"
      >
        {t("social")}
      </a>
    </footer>
  );
};

export default Footer;
