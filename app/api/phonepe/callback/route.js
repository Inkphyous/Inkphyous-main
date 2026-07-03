import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebase-admin";

const CLIENT_ID = process.env.PHONEPE_MERCHANT_ID;
const CLIENT_SECRET = process.env.PHONEPE_SALT_KEY;
const API_URL = process.env.PHONEPE_API_URL || "https://api-preprod.phonepe.com/apis/pg-sandbox";
const OAUTH_URL = process.env.PHONEPE_OAUTH_URL || "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";

async function getPhonePeAccessToken() {
  const response = await fetch(OAUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error("Failed to get OAuth token");
  }
  return data.access_token;
}

export async function POST(request) {
  try {
    const rawBody = await request.text();
    let payload;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      try {
        const decoded = Buffer.from(rawBody, "base64").toString("utf-8");
        payload = JSON.parse(decoded);
      } catch {
        return NextResponse.json({ success: false, error: "Invalid payload format" }, { status: 400 });
      }
    }

    console.log("PhonePe callback received payload:", JSON.stringify(payload));

    // Extract order ID from webhook payload (try multiple locations)
    let merchantOrderId = null;

    if (payload.data?.merchantOrderId) {
      merchantOrderId = payload.data.merchantOrderId;
    } else if (payload.data?.merchantTransactionId) {
      merchantOrderId = payload.data.merchantTransactionId;
    } else if (payload.merchantOrderId) {
      merchantOrderId = payload.merchantOrderId;
    } else if (payload.merchantTransactionId) {
      merchantOrderId = payload.merchantTransactionId;
    }

    // Also check for base64 response in V1 format
    if (!merchantOrderId && payload.response) {
      try {
        const decodedResponse = JSON.parse(Buffer.from(payload.response, "base64").toString("utf-8"));
        merchantOrderId = decodedResponse?.data?.merchantTransactionId || decodedResponse?.data?.merchantOrderId;
      } catch {
        // ignore decode errors
      }
    }

    if (!merchantOrderId) {
      console.error("PhonePe callback: could not extract merchantOrderId from payload");
      return NextResponse.json(
        { success: false, error: "Missing transaction ID in callback payload" },
        { status: 400 }
      );
    }

    // Secure out-of-band V2 Status Check API call to PhonePe
    const accessToken = await getPhonePeAccessToken();
    const statusCheckUrl = `${API_URL}/checkout/v2/order/${merchantOrderId}/status`;

    const statusResponse = await fetch(statusCheckUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `O-Bearer ${accessToken}`
      }
    });

    const statusData = await statusResponse.json();
    console.log("PhonePe callback status check response:", JSON.stringify(statusData));

    // PhonePe V2 returns state at TOP level
    const paymentState = statusData.state || statusData.data?.state;
    const errorCode = statusData.errorCode || statusData.detailedErrorCode || "";
    let orderStatus = "PENDING";

    if (paymentState === "COMPLETED") {
      orderStatus = "SUCCESS";
    } else if (paymentState === "FAILED") {
      orderStatus = "FAILED";
    }

    // Update Firebase
    const orderRef = adminDb.ref(`orders/${merchantOrderId}`);
    const snapshot = await orderRef.once("value");

    if (snapshot.exists()) {
      await orderRef.update({
        status: orderStatus,
        errorCode: errorCode,
        paymentStatusDetails: statusData,
        updatedAt: new Date().toISOString(),
      });

      // Send Push Notification if SUCCESS
      if (orderStatus === "SUCCESS") {
        try {
          const tokensSnap = await adminDb.ref("adminFCMTokens").once("value");
          if (tokensSnap.exists()) {
            const tokens = Object.keys(tokensSnap.val());
            if (tokens.length > 0) {
              await adminMessaging.sendEachForMulticast({
                tokens,
                notification: {
                  title: "New Order Received! 🎉",
                  body: `Order ${merchantOrderId} has been successfully placed.`
                }
              });
              console.log(`Pushed notification to ${tokens.length} admins.`);
            }
          }
        } catch (fcmErr) {
          console.error("Failed to send FCM push notification:", fcmErr);
        }
      }
    }

    return NextResponse.json({ success: true, orderId: merchantOrderId, status: orderStatus });
  } catch (error) {
    console.error("PhonePe callback error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
