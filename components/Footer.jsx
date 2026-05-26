"use client";
import React from "react";
import Link from "next/link";
import { useStore } from "./providers/StoreProvider";

const Footer = ({ isInline }) => {
  const { t, viewMode } = useStore();

  if (isInline) {
    return (
      <footer className="footer-links footer-links--relative">
        <Link href="/contact" className="footer-links__item title">{t("contact")}</Link>
        <Link href="/legal" className="footer-links__item title">{t("legalities")}</Link>
        <a href="https://instagram.com/inkphyous" target="_blank" rel="noopener noreferrer" className="footer-links__item title">{t("social")}</a>
      </footer>
    );
  }

  const isCarousel = viewMode === "carousel";
  const isPDP = viewMode === "pdp";
  const isFixed = isCarousel || isPDP;

  return (
    <footer 
      id="global-footer"
      className={`footer-links ${isFixed ? "footer-links--fixed" : "footer-links--relative"}`}
      style={{
        opacity: isPDP ? 0 : 1,
        visibility: isPDP ? "hidden" : "visible",
        transition: "opacity 0.3s ease, visibility 0.3s ease",
      }}
    >
      <Link href="/contact" className="footer-links__item title">{t("contact")}</Link>
      <Link href="/legal" className="footer-links__item title">{t("legalities")}</Link>
      <a href="https://instagram.com/inkphyous" target="_blank" rel="noopener noreferrer" className="footer-links__item title">{t("social")}</a>
    </footer>
  );
};

export default Footer;
