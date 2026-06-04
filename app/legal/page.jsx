"use client";

import { Suspense } from "react";
import Legal from "@/components/Legal";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function LegalPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center pt-32">Loading legal policies...</div>}>
        <Legal />
      </Suspense>
      <Footer />
    </>
  );
}
