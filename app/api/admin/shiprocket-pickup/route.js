import { NextResponse } from "next/server";
import { getAuthorizedAdminEmail } from "@/lib/firebase/serverAdminAuth";
import { adminDb } from "@/lib/firebase-admin";
import { scheduleShiprocketPickup } from "@/lib/shiprocketService";

export async function POST(request) {
  const email = await getAuthorizedAdminEmail(request);
  if (!email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId, shipmentId } = await request.json();

    if (!orderId || !shipmentId) {
      return NextResponse.json(
        { success: false, error: "Missing required orderId or shipmentId." },
        { status: 400 }
      );
    }

    let pickupDetails;
    try {
      pickupDetails = await scheduleShiprocketPickup(shipmentId);
    } catch (apiError) {
      console.error("Shiprocket Pickup Error:", apiError);
      return NextResponse.json(
        { success: false, error: apiError.message || "Failed to schedule pickup." },
        { status: 500 }
      );
    }

    // Fetch existing order to merge shiprocket details
    const orderRef = adminDb.ref(`orders/${orderId}`);
    const snapshot = await orderRef.once("value");
    const existingOrder = snapshot.val();

    if (!existingOrder) {
       return NextResponse.json(
        { success: false, error: "Order not found in database." },
        { status: 404 }
      );
    }

    const updatedShiprocket = {
      ...(existingOrder.shiprocket || {}),
      awb_code: pickupDetails.awb_code,
      courier_name: pickupDetails.courier_name,
      tracking_url: pickupDetails.tracking_url,
    };

    // Update the Order in Firebase Database
    await orderRef.update({
      status: "SHIPPED",
      shiprocket: updatedShiprocket,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, shiprocket: updatedShiprocket });
  } catch (error) {
    console.error("Admin Shiprocket Pickup error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
