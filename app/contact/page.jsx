import ContactUs from "@/components/ContactUs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Contact | INKPHYOUS",
  description: "Get in touch with us.",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <ContactUs />
      <Footer isInline={true} />
    </>
  );
}
