import MyOrders from "@/components/MyOrders";
import Footer from "@/components/Footer";

export const metadata = {
  title: "My Orders | INKPHYOUS",
  description: "View your order history and track order status.",
};

export default function OrdersPage() {
  return (
    <>
      <MyOrders />
      <Footer />
    </>
  );
}
