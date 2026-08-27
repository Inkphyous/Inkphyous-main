import AddressPage from "@/components/AddressPage";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Shipping & Billing Address | INKPHYOUS",
  description: "Enter your shipping and billing address to proceed with checkout.",
};

export default function CheckoutAddressPage() {
  return (
    <>
      <Header />
      <AddressPage />
      <Footer />
    </>
  );
}
