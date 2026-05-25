import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../translations/translations";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // Default to English
    const [language, setLanguage] = useState("en");

    // Update document direction and lang attribute when language changes
    useEffect(() => {
        // const dir = language === "ar" ? "rtl" : "ltr";
        // document.documentElement.dir = dir;
        document.documentElement.lang = language;
    }, [language]);

    const t = (key, params = {}) => {
        const text = translations[language][key] || key;

        // Simple parameter replacement for strings like "Added {item} to cart"
        if (params && Object.keys(params).length > 0) {
            let replacedText = text;
            Object.keys(params).forEach(param => {
                replacedText = replacedText.replace(`{${param}}`, params[param]);
            });
            return replacedText;
        }

        return text;
    };

    const switchLanguage = (lang) => {
        setLanguage(lang);
    };

    return (
        <LanguageContext.Provider value={{ language, switchLanguage, t, isRTL: language === 'ar' }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
