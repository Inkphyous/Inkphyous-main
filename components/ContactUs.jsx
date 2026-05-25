"use client";

import React, { useState } from "react";
import { ChevronDown, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "./providers/StoreProvider";

const ContactUs = () => {
  const router = useRouter();
  const { t } = useStore();
  const [file, setFile] = useState(null);
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");

  const subjects = [
    "General Inquiry",
    "Order Status",
    "Return & Exchange",
    "Damages",
    "My Account",
    "Cancellation Request",
    "Others"
  ];

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = () => {
    console.log("Form submitted");
  };

  return (
    <div className="min-h-screen pt-32 pb-12 bg-transparent px-4 md:px-0 relative">
      {/* Background gradient */}
      <div className="fixed inset-0 -z-20">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 160% 80% at 50% 10%, #ffffff 0%, #f6f6f4 35%, #ececeb 65%, #e5e5e3 100%)",
          }}
        />
      </div>
      {/* BACK BUTTON */}
      <button
        onClick={() => router.push('/')}
        className="shared-back-btn absolute top-24 left-4 sm:top-24 sm:left-8 z-[60]"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        <span>{t('back')}</span>
      </button>

      {/* GRID SECTION */}
      <div className="w-full grid grid-cols-1 md:grid-cols-[49%_52%]">
        {/* LEFT SIDE */}
        <div className="flex flex-col text-center justify-center px-4 sm:px-6 md:px-12 py-8 sm:py-10 md:py-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-black title">
            {t('contactTitle')}
          </h1>

          <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
            {t('contactIntro')}
          </p>

          <p className="text-base sm:text-lg text-red-600 font-semibold mb-4 sm:mb-6">
            info@inkphyous.com
          </p>

          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            {t('contactAltIntro')}
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="relative px-4 sm:px-6 md:px-12 py-8 sm:py-10 md:py-12 border-t md:border-t-0 md:border-l border-red-500 flex flex-col justify-center">
          <div className="flex flex-col text-right space-y-3 sm:space-y-4">
            <input
              type="text"
              placeholder={t('name')}
              className="border text-right border-gray-400 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-700 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
            <div className="relative">
              <div
                className="border border-gray-400 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-right text-gray-700 placeholder-gray-600 cursor-pointer flex items-center justify-end gap-2 hover:border-gray-600 transition-colors"
                onClick={() => setIsSubjectOpen(!isSubjectOpen)}
              >
                <span className="text-right flex-1">{selectedSubject || t('subject')}</span>
                <ChevronDown
                  className={`transition-transform flex-shrink-0 ${isSubjectOpen ? "rotate-180" : ""}`}
                  size={18}
                />
              </div>

              {isSubjectOpen && (
                <div className="absolute z-20 w-full bg-white border border-gray-300 shadow-lg mt-1 text-right max-h-60 overflow-y-auto">
                  {subjects.map((sub, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedSubject(sub);
                        setIsSubjectOpen(false);
                      }}
                      className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      {sub}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input
              type="email"
              placeholder={t('email')}
              className="border text-right border-gray-400 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-700 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />

            <textarea
              rows="5"
              placeholder={t('description')}
              className="border text-right border-gray-400 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-700 placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            ></textarea>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-gray-600">
              <span className="truncate max-w-full sm:max-w-[60%] order-2 sm:order-1">
                {file ? file.name : t('noFileSelected')}
              </span>

              <label className="border border-gray-400 px-3 py-1.5 sm:py-1 cursor-pointer hover:bg-red-500 transition-all hover:text-white hover:border-red-500 text-gray-700 text-sm whitespace-nowrap order-1 sm:order-2 self-end sm:self-auto">
                {t('attachFile')}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 flex justify-center w-full px-4">
        <button
          onClick={handleSubmit}
          className="w-full sm:w-auto sm:min-w-[400px] md:w-[600px] lg:w-[800px] xl:w-[1000px] text-center border border-gray-400 py-2.5 sm:py-3 px-8 sm:px-12 text-base sm:text-lg text-gray-800 bg-transparent hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300 rounded font-medium cursor-pointer"
        >
          {t('submit')}
        </button>
      </div>
    </div>
  );
};

export default ContactUs;
