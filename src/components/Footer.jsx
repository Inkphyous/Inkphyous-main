import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "./LanguageContext";

const Footer = () => {
  const { t } = useLanguage();
  return (
  <footer className=" py-10 w-full flex justify-end pr-12 pb-8 text-[18px] font-semibold text-black/90 gap-8">
      {/* Contact Link */}
      <Link
        to="/contact"
        className="transition-colors duration-200 hover:text-red-500 cursor-pointer title"
      >
        {t("contact")}
      </Link>

      {/* Legalities Link */}
      <Link
        to="/legal"
        className="transition-colors duration-200 hover:text-red-500 cursor-pointer title"
      >
        {t("legalities")}
      </Link>

      {/* Social Link */}
      <a
        href="https://instagram.com/inkphyous"
        target="_blank"
        rel="noopener noreferrer"
        className="transition-colors duration-200 hover:text-red-500 cursor-pointer title"
      >
        {t("social")}
      </a >
    </footer>
  );
};

export default Footer;