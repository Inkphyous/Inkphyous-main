"use client";

import Cart from "@/components/Cart";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CartPage() {
  return (
    <div className="cart-page-wrapper">
      <Header />
      <Cart />
      <Footer />
    </div>
  );
}
