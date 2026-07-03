import { NextResponse } from "next/server";
import { getAuthorizedAdminEmail } from "@/lib/firebase/serverAdminAuth";
import { adminDb } from "@/lib/firebase-admin";
import { processShiprocketFulfillment } from "@/lib/shiprocketService";

export async function POST(request) {
  const email = await getAuthorizedAdminEmail(request);
  if (!email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId, orderData, packageDetails } = await request.json();

    if (!orderId || !orderData || !packageDetails) {
      return NextResponse.json(
        { success: false, error: "Missing required order data or package details." },
        { status: 400 }
      );
    }

    // 1. Format data for Shiprocket Adhoc Order API
    const shiprocketOrderPayload = {
      order_id: orderId,
      order_date: new Date(orderData.createdAt || Date.now()).toISOString(),
      pickup_location: "Primary", // Matches the Address Nickname in Shiprocket dashboard
      billing_customer_name: orderData.billingAddress?.billingName || orderData.shippingAddress?.receiverName || orderData.userName || "Customer",
      billing_last_name: "",
      billing_address: orderData.billingAddress?.formattedAddress || orderData.shippingAddress?.formattedAddress || "N/A",
      billing_city: orderData.billingAddress?.city || orderData.shippingAddress?.city || "Delhi",
      billing_pincode: String(orderData.billingAddress?.pincode || orderData.shippingAddress?.pincode || "110001").replace(/\D/g, "").slice(0, 6).padEnd(6, "1"),
      billing_state: orderData.billingAddress?.state || orderData.shippingAddress?.state || "Delhi",
      billing_country: "India",
      billing_email: orderData.userEmail || "customer@example.com",
      billing_phone: (() => {
        let p = String(orderData.billingAddress?.contactNumber || orderData.shippingAddress?.contactNumber || orderData.userPhone || "").replace(/\D/g, "").slice(-10);
        if (p.length !== 10 || /^[0-5]/.test(p)) return "9876543210";
        return p;
      })(),
      shipping_is_billing: true,
      order_items: (orderData.cartItems || []).map((item) => ({
        name: item.name,
        sku: item.sku || item.id || "N/A",
        units: item.quantity || 1,
        selling_price: item.discountPriceINR || item.priceINR || item.price || 0,
        discount: "",
        tax: "",
        hsn: "",
      })),
      payment_method: "Prepaid",
      sub_total: orderData.amount || 0,
      // Package Details from the Admin Popup
      length: packageDetails.length,
      breadth: packageDetails.breadth,
      height: packageDetails.height,
      weight: packageDetails.weight,
    };

    // 2. Call Shiprocket Service to execute the 3-step workflow
    let fulfillmentDetails;
    try {
      fulfillmentDetails = await processShiprocketFulfillment(shiprocketOrderPayload);
    } catch (apiError) {
      console.error("Shiprocket API Error:", apiError);
      return NextResponse.json(
        { success: false, error: apiError.message || "Shiprocket processing failed." },
        { status: 500 }
      );
    }

    // 3. Update the Order in Firebase Database
    const sanitizedFulfillmentDetails = JSON.parse(JSON.stringify(fulfillmentDetails));
    
    await adminDb.ref(`orders/${orderId}`).update({
      status: "SHIPPING",
      shiprocket: sanitizedFulfillmentDetails,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, fulfillmentDetails });
  } catch (error) {
    console.error("Admin Shiprocket integration error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error", stack: error.stack },
      { status: 500 }
    );
  }
}
