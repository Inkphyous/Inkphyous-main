import { NextResponse } from "next/server";
import { getAuthorizedAdminEmail } from "@/lib/firebase/serverAdminAuth";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request) {
  try {
    const email = await getAuthorizedAdminEmail(request);
    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await adminDb.ref("users").once("value");
    const data = snapshot.val();
    
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Admin users API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
