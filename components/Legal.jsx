"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useStore } from './providers/StoreProvider';
import { getLegalContent } from '@/lib/LegalData';

export default function Legal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useStore();
  const initialTab = searchParams.get('tab') || 'home';
  const [activePage, setActivePage] = useState(initialTab);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activePage]);

  const renderHome = () => (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4 relative">
      <div className="fixed inset-0 -z-20">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 160% 80% at 50% 10%, #ffffff 0%, #f6f6f4 35%, #ececeb 65%, #e5e5e3 100%)",
          }}
        />
      </div>
      <button
        onClick={() => router.push('/')}
        className="shared-back-btn fixed top-[64px] left-4 sm:left-8 z-[60]"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        <span>{t('back')}</span>
      </button>

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[49%_52%]">
        <div className="w-full flex justify-center md:items-center p-6 sm:p-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl title font-bold text-gray-900 tracking-tight text-center">
            {t('legalities')}
          </h1>
        </div>

        <div className="w-full flex flex-col items-center justify-center space-y-4 sm:space-y-8 lg:space-y-12 p-6 sm:p-8 border-t md:border-t-0 md:border-l border-red-500">
          <button onClick={() => setActivePage('privacy')} className="block text-xl sm:text-2xl font-semibold text-gray-700 hover:text-red-500 cursor-pointer transition-colors duration-300 text-center" style={{ fontFamily: "'Google Sans Flex', sans-serif" }}>
            {t('privacyPolicy')}
          </button>
          <button onClick={() => setActivePage('terms')} className="block text-xl sm:text-2xl font-semibold text-gray-700 hover:text-red-500 cursor-pointer transition-colors duration-300 text-center" style={{ fontFamily: "'Google Sans Flex', sans-serif" }}>
            {t('termsConditions')}
          </button>
          <button onClick={() => setActivePage('shipping')} className="block text-xl sm:text-2xl font-semibold text-gray-700 hover:text-red-500 cursor-pointer transition-colors duration-300 text-center" style={{ fontFamily: "'Google Sans Flex', sans-serif" }}>
            {t('shippingPolicy')}
          </button>
          <button onClick={() => setActivePage('returns')} className="block text-xl sm:text-2xl font-semibold text-gray-700 hover:text-red-500 cursor-pointer transition-colors duration-300 text-center" style={{ fontFamily: "'Google Sans Flex', sans-serif" }}>
            {t('returnExchangePolicy')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderPolicyPage = (title, content) => (
    <div className="min-h-screen bg-transparent px-4 sm:px-6 md:px-8 relative" style={{ paddingTop: '120px', paddingBottom: '100px' }}>
      <div className="fixed inset-0 -z-20">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 160% 80% at 50% 10%, #ffffff 0%, #f6f6f4 35%, #ececeb 65%, #e5e5e3 100%)",
          }}
        />
      </div>
      <button
        onClick={() => setActivePage('home')}
        className="shared-back-btn fixed top-[64px] left-4 sm:left-8 z-[60]"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        <span>{t('back')}</span>
      </button>

      <div className="w-full sm:w-[95%] lg:w-[90%] mx-auto" style={{ fontFamily: "'Google Sans Flex', sans-serif" }}>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 text-center" style={{ marginBottom: '40px' }}>
          {title}
        </h1>

        <div className="space-y-14 sm:space-y-28">
          {content.sections.map((section, idx) => (
            <div key={idx} id={`section-${idx}`} className="flex flex-col lg:grid lg:grid-cols-[22%_1px_1fr] gap-6 lg:gap-x-12 items-start pt-4 sm:pt-6 mb-10 sm:mb-16">
              <div className="w-full lg:pr-4">
                <a href={`#section-${idx}`} className="block text-left text-base sm:text-lg font-bold text-gray-900 leading-snug hover:text-rose-600 transition">
                  {section.title}
                </a>
              </div>
              <div className="w-full lg:w-px h-px lg:h-auto lg:self-stretch">
                <div className="w-full lg:w-px h-px lg:h-full bg-red-500" />
              </div>
              <div className="w-full text-left">
                <div className="text-gray-700 text-sm sm:text-base leading-relaxed space-y-8">
                  <div className="[&_ul]:ml-5 sm:[&_ul]:ml-6 [&_ul]:list-disc [&_ul]:text-left [&_ol]:ml-5 sm:[&_ol]:ml-6 [&_ol]:text-left [&_li]:pl-1 [&_li]:mb-4">
                    {section.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const { shippingContent, termsContent, returnsContent, privacyContent } = getLegalContent(language, t);

  if (activePage === 'home') {
    return renderHome();
  } else if (activePage === 'privacy') {
    return renderPolicyPage(t('privacyPolicy'), privacyContent);
  } else if (activePage === 'terms') {
    return renderPolicyPage(t('termsConditions'), termsContent);
  } else if (activePage === 'shipping') {
    return renderPolicyPage(t('shippingPolicy'), shippingContent);
  } else if (activePage === 'returns') {
    return renderPolicyPage(t('returnExchangePolicy'), returnsContent);
  }
}
