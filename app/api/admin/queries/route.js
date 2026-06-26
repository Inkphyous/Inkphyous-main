import { NextResponse } from "next/server";
import { getAuthorizedAdminEmail } from "@/lib/firebase/serverAdminAuth";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request) {
  try {
    const email = await getAuthorizedAdminEmail(request);
    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await adminDb.ref("queries").once("value");
    const data = snapshot.val();
    
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Admin queries API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const email = await getAuthorizedAdminEmail(request);
    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: "Query ID required" }, { status: 400 });
    }

    await adminDb.ref(`queries/${id}`).remove();
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin queries DELETE error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
