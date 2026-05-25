"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import products from "@/lib/products";
import { IndianRupee } from "lucide-react";

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [userDetails, setUserDetails] = useState({
    name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
  });
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardDetails, setCardDetails] = useState({
    name: "",
    number: "",
    expiry: "",
    cvc: "",
  });
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();

  const validPromoCodes = {
    SAVE10: 0.1,
    SAVE20: 0.2,
    FREESHIP: 0.15,
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const productId = searchParams.get("productId");
    const variantId = searchParams.get("variantId");
    const size = searchParams.get("size");

    if (productId && variantId && size) {
      const product = products.find((p) => String(p.id) === String(productId));
      if (product) {
        const variant = product.variants.find((v) => v.id === variantId);
        if (variant) {
          setCart([
            {
              id: product.id,
              variantId: variant.id,
              name: `${product.name} (${variant.color})`,
              size: size,
              price: variant.priceINR,
              quantity: 1,
              image: variant.image,
            },
          ]);
        } else {
          alert("Selected variant not found.");
          router.push("/");
        }
      } else {
        alert("Product not found.");
        router.push("/");
      }
    }
  }, [searchParams, router]);

  const handleInputChange = (e, section = "user") => {
    const { name, value } = e.target;
    if (section === "user") {
      setUserDetails((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else if (section === "address") {
      setUserDetails((prev) => ({
        ...prev,
        address: { ...prev.address, [name]: value },
      }));
    } else if (section === "card") {
      setCardDetails((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePromoCode = () => {
    const discount = validPromoCodes[promoCode.toUpperCase()];
    if (discount) {
      setPromoDiscount(discount);
    } else {
      setPromoDiscount(0);
      alert("Invalid promo code.");
    }
  };

  const handlePayment = () => {
    if (
      !userDetails.name ||
      !userDetails.address.street ||
      !userDetails.address.city ||
      !userDetails.address.state ||
      !userDetails.address.postalCode ||
      !userDetails.address.country ||
      (paymentMethod === "card" &&
        (!cardDetails.name || !cardDetails.number || !cardDetails.expiry || !cardDetails.cvc))
    ) {
      alert("Please fill in all required fields.");
      return;
    }
    alert(`Thank you, ${userDetails.name}! Your order has been placed successfully.`);
    router.push("/");
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const standardDiscount = subtotal * 0.1;
    const promoDiscountAmount = subtotal * promoDiscount;
    const tax = subtotal * 0.05;
    return (subtotal - standardDiscount - promoDiscountAmount + tax).toFixed(2);
  };

  return (
    <div className="min-h-screen py-18 px-4 sm:px-6 lg:px-8 bg-transparent pt-32">
      <div className="fixed inset-0 -z-20">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 160% 80% at 50% 10%, #ffffff 0%, #f6f6f4 35%, #ececeb 65%, #e5e5e3 100%)",
          }}
        />
      </div>
      <motion.div
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8 overflow-y-auto">
            <motion.div
              className="rounded-lg p-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Customer Details</h2>
              <div className="space-y-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={userDetails.name}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email ID</label>
                  <input
                    type="email"
                    name="email"
                    value={userDetails.email}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={userDetails.phone}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your mobile number"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              className="rounded-lg p-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Delivery Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Street Address *</label>
                  <input
                    type="text"
                    name="street"
                    value={userDetails.address.street}
                    onChange={(e) => handleInputChange(e, "address")}
                    className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Street address"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={userDetails.address.city}
                    onChange={(e) => handleInputChange(e, "address")}
                    className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="City"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State/Province *</label>
                  <input
                    type="text"
                    name="state"
                    value={userDetails.address.state}
                    onChange={(e) => handleInputChange(e, "address")}
                    className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="State/Province"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Postal Code *</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={userDetails.address.postalCode}
                    onChange={(e) => handleInputChange(e, "address")}
                    className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Postal Code"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Country *</label>
                  <input
                    type="text"
                    name="country"
                    value={userDetails.address.country}
                    onChange={(e) => handleInputChange(e, "address")}
                    className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Country"
                    required
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Details</h2>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    {[
                      { value: "card", label: "Debit/Credit Card" },
                      { value: "upi", label: "UPI" },
                      { value: "paypal", label: "PayPal" },
                      { value: "bank", label: "Bank Transfer" },
                      { value: "cod", label: "Cash on Delivery" },
                    ].map((method) => (
                      <label key={method.value} className="flex items-center">
                        <input
                          type="radio"
                          name="payment"
                          value={method.value}
                          checked={paymentMethod === method.value}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-2"
                        />
                        {method.label}
                      </label>
                    ))}
                  </div>

                  {paymentMethod === "card" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name on Card *</label>
                        <input
                          type="text"
                          name="name"
                          value={cardDetails.name}
                          onChange={(e) => handleInputChange(e, "card")}
                          className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter name on card"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Card Number *</label>
                        <input
                          type="text"
                          name="number"
                          value={cardDetails.number}
                          onChange={(e) => handleInputChange(e, "card")}
                          className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="1234 5678 9012 3456"
                          required
                        />
                      </div>
                      <div className="flex space-x-4">
                        <div className="w-1/2">
                          <label className="block text-sm font-medium text-gray-700">Expiry Date *</label>
                          <input
                            type="text"
                            name="expiry"
                            value={cardDetails.expiry}
                            onChange={(e) => handleInputChange(e, "card")}
                            className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="MM/YY"
                            required
                          />
                        </div>
                        <div className="w-1/2">
                          <label className="block text-sm font-medium text-gray-700">CVC *</label>
                          <input
                            type="text"
                            name="cvc"
                            value={cardDetails.cvc}
                            onChange={(e) => handleInputChange(e, "card")}
                            className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="123"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {paymentMethod === "upi" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">UPI ID *</label>
                      <input
                        type="text"
                        className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="example@upi"
                        required
                      />
                    </div>
                  )}
                  {paymentMethod === "paypal" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">PayPal Email *</label>
                      <input
                        type="email"
                        className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="example@paypal.com"
                        required
                      />
                    </div>
                  )}
                  {paymentMethod === "bank" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bank Account Number *</label>
                        <input
                          type="text"
                          className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter account number"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">IFSC Code *</label>
                        <input
                          type="text"
                          className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter IFSC code"
                          required
                        />
                      </div>
                    </div>
                  )}
                  {paymentMethod === "cod" && (
                    <p className="text-sm text-gray-600 flex items-center">You will pay <IndianRupee size={12} className="mx-0.5" strokeWidth={3} />{calculateTotal()} upon delivery.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="rounded-3xl p-4 border border-gray-300 h-fit lg:sticky lg:top-20"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div
                  key={`${item.variantId}-${item.size}`}
                  className="flex items-center mb-4 border-b pb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-contain mr-4 rounded"
                  />
                  <div>
                    <p className="font-medium text-gray-800">
                      {userDetails.name ? `${userDetails.name}'s ` : ""}{item.name}
                    </p>
                    <p className="text-sm text-gray-600">Size: {item.size}</p>
                    <p className="font-bold text-gray-800 flex items-center"><IndianRupee size={14} className="mr-0.5" strokeWidth={3} />{item.price} x {item.quantity}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Promo Code</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter promo code"
                  />
                  <motion.button
                    className="mt-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePromoCode}
                  >
                    Apply
                  </motion.button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Try these promo codes: SAVE10, SAVE20, FREESHIP
                </p>
              </div>
              <p className="flex justify-between">
                <span>Subtotal:</span>
                <span className="flex items-center"><IndianRupee size={12} className="mr-0.5" strokeWidth={3} />{cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</span>
              </p>
              <p className="flex justify-between">
                <span>Discount (10%):</span>
                <span>
                  <span className="flex items-center"> -<IndianRupee size={12} className="mx-0.5" strokeWidth={3} />{cart.reduce((sum, item) => sum + item.price * item.quantity * 0.1, 0).toFixed(2)}</span>
                </span>
              </p>
              {promoDiscount > 0 && (
                <p className="flex justify-between">
                  <span>Promo Discount ({promoCode}):</span>
                  <span>
                    <span className="flex items-center"> -<IndianRupee size={12} className="mx-0.5" strokeWidth={3} />
                    {cart
                      .reduce((sum, item) => sum + item.price * item.quantity * promoDiscount, 0)
                      .toFixed(2)}</span>
                  </span>
                </p>
              )}
              <p className="flex justify-between">
                <span>Tax (5%):</span>
                <span className="flex items-center"><IndianRupee size={12} className="mr-0.5" strokeWidth={3} />{cart.reduce((sum, item) => sum + item.price * item.quantity * 0.05, 0).toFixed(2)}</span>
              </p>
              <p className="flex justify-between">
                <span>Shipping:</span>
                <span>Free</span>
              </p>
              <p className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="flex items-center"><IndianRupee size={16} className="mr-0.5" strokeWidth={3} />{calculateTotal()}</span>
              </p>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Estimated Delivery By {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
            <div className="flex justify-center">
              <motion.button
                className="w-full mt-6 px-6 py-3 border border-gray-800 text-gray-800 rounded-md hover:bg-gray-900 hover:text-white transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePayment}
              >
                Verify & Pay
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
