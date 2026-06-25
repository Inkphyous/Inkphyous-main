import SavedAddresses from "@/components/SavedAddresses";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Saved Addresses | INKPHYOUS",
  description: "View and manage your saved shipping addresses.",
};

export default function AddressesPage() {
  return (
    <>
      <SavedAddresses />
      <Footer />
    </>
  );
}
