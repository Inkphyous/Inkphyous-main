"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useStore } from './providers/StoreProvider';
import { getLegalContent } from '@/lib/LegalData';

export default function Legal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { t, language } = useStore();
  
  const pathParts = pathname.split('/').filter(Boolean);
  const slugFromPath = pathParts.length > 1 ? pathParts[1] : null;
  const initialTab = slugFromPath || searchParams.get('tab') || 'home';
  
  const [activePage, setActivePage] = useState(initialTab);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    const basePath = pathParts[0] || 'legal';
    const newUrl = activePage === 'home' ? `/${basePath}` : `/${basePath}/${activePage}`;
    
    if (pathname !== newUrl) {
      window.history.pushState(null, '', newUrl);
    }
  }, [activePage, pathname, pathParts]);

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

      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center min-h-[60vh] gap-12 md:gap-24">
        {/* Left Side */}
        <div className="flex-1 flex justify-center md:justify-end">
          <h1 className="text-5xl sm:text-6xl md:text-7xl title font-bold text-gray-900 tracking-tight">
            {t('legalities')}
          </h1>
        </div>

        {/* Center Line */}
        <div className="hidden md:block w-px h-[300px] bg-[#e11d48]" />
        {/* Mobile Horizontal Line */}
        <div className="block md:hidden w-32 h-px bg-[#e11d48] my-4" />

        {/* Right Side */}
        <div className="flex-1 flex flex-col items-center md:items-start justify-center">
          <button onClick={() => setActivePage('privacy')} className="text-xl sm:text-2xl font-semibold text-gray-800 hover:text-[#e11d48] transition-colors text-center md:text-left block" style={{ fontFamily: "'Google Sans Flex', sans-serif", marginBottom: '24px' }}>
            {t('privacyPolicy')}
          </button>
          <button onClick={() => setActivePage('terms')} className="text-xl sm:text-2xl font-semibold text-gray-800 hover:text-[#e11d48] transition-colors text-center md:text-left block" style={{ fontFamily: "'Google Sans Flex', sans-serif", marginBottom: '24px' }}>
            {t('termsConditions')}
          </button>
          <button onClick={() => setActivePage('shipping')} className="text-xl sm:text-2xl font-semibold text-gray-800 hover:text-[#e11d48] transition-colors text-center md:text-left block" style={{ fontFamily: "'Google Sans Flex', sans-serif", marginBottom: '24px' }}>
            {t('shippingPolicy')}
          </button>
          <button onClick={() => setActivePage('returns')} className="text-xl sm:text-2xl font-semibold text-gray-800 hover:text-[#e11d48] transition-colors text-center md:text-left block" style={{ fontFamily: "'Google Sans Flex', sans-serif", marginBottom: '24px' }}>
            {t('returnExchangePolicy')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderPolicyPage = (title, content) => (
    <div className="min-h-screen bg-transparent relative" style={{ paddingTop: '140px', paddingBottom: '100px' }}>
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

      <div className="w-full mx-auto" style={{ fontFamily: "'Google Sans Flex', sans-serif", paddingLeft: '6%', paddingRight: '6%', maxWidth: '1400px' }}>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 text-center" style={{ marginBottom: '80px' }}>
          {title}
        </h1>

        <div>
          {content.sections.map((section, idx) => (
            <div key={idx} id={`section-${idx}`} className="flex flex-col md:flex-row items-stretch">
              {/* Left Column (Topics) */}
              <div className="w-full md:w-48 lg:w-64 flex-shrink-0 mb-6 md:mb-0 py-8">
                <a href={`#section-${idx}`} className="text-lg md:text-xl font-bold text-gray-900 hover:text-[#e11d48] transition-colors block">
                  {section.title}
                </a>
              </div>
              
              {/* Center Red Line */}
              <div className="hidden md:block flex-shrink-0" style={{ width: '0.5px', backgroundColor: '#e11d48', marginLeft: '12px', marginRight: '24px' }} />
              <div className="block md:hidden h-[0.5px] w-16 bg-[#e11d48] my-6" />

              {/* Right Column (Content) */}
              <div className="flex-1 min-w-0 py-8">
                <div className="text-gray-800 text-sm md:text-base leading-relaxed">
                  <div className="[&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-4 [&_li]:pl-2 [&_h4]:font-bold [&_h4]:text-lg [&_h4]:mb-4 [&_h4]:mt-8 space-y-8">
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
