import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { buildCartResponse } from "@/app/api/cart/route";

const CLIENT_ID = process.env.PHONEPE_MERCHANT_ID;
const CLIENT_SECRET = process.env.PHONEPE_SALT_KEY;
const API_URL = process.env.PHONEPE_API_URL || "https://api-preprod.phonepe.com/apis/pg-sandbox";
const OAUTH_URL = process.env.PHONEPE_OAUTH_URL || "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";
const REDIRECT_URL = process.env.PHONEPE_REDIRECT_URL || "http://localhost:3000/checkout/payment-status";
const CALLBACK_URL = process.env.PHONEPE_CALLBACK_URL || "http://localhost:3000/api/phonepe/callback";

function generateOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `INK-${ts}-${rand}`;
}

async function getPhonePeAccessToken() {
  const response = await fetch(OAUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
  });

  const responseText = await response.text();
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (err) {
    throw new Error(`Failed to parse OAuth token response. Status: ${response.status}. Body: ${responseText.slice(0, 200)}`);
  }

  if (!response.ok || !data.access_token) {
    throw new Error(`Failed to get OAuth token: ${data.message || JSON.stringify(data)}`);
  }
  return data.access_token;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      userId,
      userName,
      userEmail,
      userPhone,
      shippingAddress,
      billingAddress,
    } = body;

    if (!userId || !shippingAddress || !billingAddress) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return NextResponse.json(
        { success: false, error: "Payment gateway not configured. Please set PHONEPE_MERCHANT_ID and PHONEPE_SALT_KEY." },
        { status: 500 }
      );
    }

    // Securely fetch cart and calculate amount
    const supabase = getSupabaseAdmin();
    const cartItems = await buildCartResponse(supabase, userId);

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Calculate total amount from trusted backend cart
    const calculatedAmount = cartItems.reduce((total, item) => {
      const price = item.discountPriceINR || item.priceINR || 0;
      return total + price * (item.quantity || 1);
    }, 0);

    const merchantTransactionId = generateOrderId();
    const amountInPaise = Math.round(calculatedAmount * 100);

    // Save initial order to Firebase RTDB
    const orderData = {
      orderId: merchantTransactionId,
      userId,
      userName: userName || "",
      userEmail: userEmail || "",
      userPhone: userPhone || "",
      cartItems,
      shippingAddress,
      billingAddress,
      amount: calculatedAmount,
      amountInPaise,
      status: "PENDING",
      paymentMethod: "PhonePe",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const orderRef = adminDb.ref(`orders/${merchantTransactionId}`);
    await orderRef.set(orderData);

    // Get OAuth Token
    const accessToken = await getPhonePeAccessToken();

    // V2 Payload
    const payload = {
      merchantOrderId: merchantTransactionId,
      amount: amountInPaise,
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: "Payment for Inkphyous order",
        merchantUrls: {
          redirectUrl: `${REDIRECT_URL}?transactionId=${merchantTransactionId}`,
          callbackUrl: CALLBACK_URL
        }
      }
    };

    // Call PhonePe V2 Checkout API
    const apiEndpoint = "/checkout/v2/pay";
    const phonepeResponse = await fetch(`${API_URL}${apiEndpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `O-Bearer ${accessToken}`
      },
      body: JSON.stringify(payload),
    });

    const phonepeResponseText = await phonepeResponse.text();
    let phonepeData;
    try {
      phonepeData = JSON.parse(phonepeResponseText);
    } catch (err) {
      throw new Error(`Failed to parse PhonePe API response. Status: ${phonepeResponse.status}. Body: ${phonepeResponseText.slice(0, 200)}`);
    }

    console.log("PhonePe API Response Status:", phonepeResponse.status);
    console.log("PhonePe API Response Body:", phonepeData);

    if (phonepeResponse.ok && phonepeData.redirectUrl) {
      return NextResponse.json({
        success: true,
        redirectUrl: phonepeData.redirectUrl,
        transactionId: merchantTransactionId,
      });
    }

    // Handle failure
    return NextResponse.json(
      {
        success: false,
        error: phonepeData.message || phonepeData.error || "Failed to initiate payment",
        code: phonepeData.code || "UNKNOWN",
        rawPhonepeData: phonepeData,
        status: phonepeResponse.status,
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("PhonePe initiate error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error", stack: error.stack },
      { status: 500 }
    );
  }
}
