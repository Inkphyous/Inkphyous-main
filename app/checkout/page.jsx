import { Suspense } from "react";
import Checkout from "@/components/Checkout";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Checkout | INKPHYOUS",
  description: "Secure checkout.",
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center pt-32">Loading checkout...</div>}>
      <Checkout />
      <Footer />
    </Suspense>
  );
}
