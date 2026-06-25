import AddressPage from "@/components/AddressPage";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Shipping & Billing Address | INKPHYOUS",
  description: "Enter your shipping and billing address to proceed with checkout.",
};

export default function CheckoutAddressPage() {
  return (
    <>
      <AddressPage />
      <Footer />
    </>
  );
}
