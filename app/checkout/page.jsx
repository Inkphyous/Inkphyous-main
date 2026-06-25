import { redirect } from "next/navigation";

export const metadata = {
  title: "Checkout | INKPHYOUS",
  description: "Secure checkout.",
};

export default function CheckoutPage() {
  redirect("/checkout/address");
}
