import { NextResponse } from "next/server";
import { getAuthorizedAdminEmail } from "@/lib/firebase/serverAdminAuth";
import { checkCourierServiceability } from "@/lib/shiprocketService";

export async function GET(request) {
  const email = await getAuthorizedAdminEmail(request);
  if (!email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const shiprocketOrderId = searchParams.get("shiprocket_order_id");

    if (!shiprocketOrderId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameter: shiprocket_order_id" },
        { status: 400 }
      );
    }

    const couriers = await checkCourierServiceability(shiprocketOrderId);

    return NextResponse.json({ success: true, couriers });
  } catch (error) {
    console.error("Fetch couriers error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch couriers", stack: error.stack },
      { status: 500 }
    );
  }
}
