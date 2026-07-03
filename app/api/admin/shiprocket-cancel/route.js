import { NextResponse } from "next/server";
import { getAuthorizedAdminEmail } from "@/lib/firebase/serverAdminAuth";
import { adminDb } from "@/lib/firebase-admin";
import { cancelShiprocketOrder } from "@/lib/shiprocketService";

export async function POST(request) {
  const email = await getAuthorizedAdminEmail(request);
  if (!email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId, shiprocketOrderId } = await request.json();

    if (!orderId || !shiprocketOrderId) {
      return NextResponse.json(
        { success: false, error: "Missing required orderId or shiprocketOrderId." },
        { status: 400 }
      );
    }

    try {
      await cancelShiprocketOrder([shiprocketOrderId]);
    } catch (apiError) {
      console.error("Shiprocket Cancel Error:", apiError);
      return NextResponse.json(
        { success: false, error: apiError.message || "Failed to cancel shipment." },
        { status: 500 }
      );
    }

    // Update the Order in Firebase Database
    await adminDb.ref(`orders/${orderId}`).update({
      status: "CANCELLED",
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Shiprocket Cancel error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
