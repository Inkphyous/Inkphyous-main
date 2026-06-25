import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantTransactionId = searchParams.get("transactionId");

    if (!merchantTransactionId) {
      return NextResponse.json(
        { success: false, error: "Missing transactionId" },
        { status: 400 }
      );
    }

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return NextResponse.json(
        { success: false, error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    // Perform V2 Status Check
    const accessToken = await getPhonePeAccessToken();
    const statusCheckUrl = `${API_URL}/checkout/v2/order/${merchantTransactionId}/status`;

    const response = await fetch(statusCheckUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `O-Bearer ${accessToken}`
      }
    });

    const responseData = await response.json();
    console.log("PhonePe V2 status raw response:", JSON.stringify(responseData));

    // PhonePe V2 returns state at TOP level, NOT nested under "data"
    // Example: { merchantId, merchantOrderId, state: "FAILED", errorCode: "TXN_CANCELLED", ... }
    const paymentState = responseData.state || responseData.data?.state;
    const errorCode = responseData.errorCode || responseData.detailedErrorCode || responseData.data?.errorCode || "";

    if (!paymentState) {
      console.error("PhonePe status check - no state found:", responseData);
      return NextResponse.json(
        { success: false, error: "Unable to determine payment status" },
        { status: 400 }
      );
    }

    let orderStatus = "PENDING";

    if (paymentState === "COMPLETED") {
      orderStatus = "SUCCESS";
    } else if (paymentState === "FAILED") {
      orderStatus = "FAILED";
    }

    // Update Firebase if it's a final state
    if (orderStatus === "SUCCESS" || orderStatus === "FAILED") {
      const orderRef = adminDb.ref(`orders/${merchantTransactionId}`);
      const snapshot = await orderRef.once("value");

      if (snapshot.exists()) {
        await orderRef.update({
          status: orderStatus,
          errorCode: errorCode,
          paymentStatusDetails: responseData,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      status: orderStatus,
      code: errorCode || paymentState,
      transactionId: merchantTransactionId,
      phonepeTransactionId: responseData.orderId || "",
      amount: responseData.amount ? responseData.amount / 100 : 0,
    });
  } catch (error) {
    console.error("PhonePe status check error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
