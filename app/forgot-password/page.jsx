import ForgotPassword from "@/components/ForgotPassword";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Forgot Password | INKPHYOUS",
  description: "Reset your password.",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <ForgotPassword />
      <Footer />
    </>
  );
}
