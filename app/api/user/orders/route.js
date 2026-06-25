import { NextResponse } from "next/server";
import { extractBearerToken, getUidFromFirebaseIdToken } from "@/lib/firebase/serverAdminAuth";

const FIREBASE_RTDB_URL =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  "https://inkphyous-a1027-default-rtdb.firebaseio.com";

export async function GET(request) {
  const idToken = extractBearerToken(request);
  if (!idToken) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const uid = await getUidFromFirebaseIdToken(idToken);
  if (!uid) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get("transactionId");

  try {
    let url;
    if (transactionId) {
      // Fetch specific order (the rules will ensure we can only read if data.child('userId').val() === auth.uid)
      url = `${FIREBASE_RTDB_URL}/orders/${transactionId}.json?auth=${idToken}`;
    } else {
      // Fetch all orders for this user using indexed query
      url = `${FIREBASE_RTDB_URL}/orders.json?orderBy="userId"&equalTo="${uid}"&auth=${idToken}`;
    }

    const response = await fetch(url, { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ success: false, error: data?.error || "Failed to fetch orders" }, { status: 500 });
    }

    // If transactionId is provided, data is a single object or null.
    // Otherwise, data is an object map of orders.
    return NextResponse.json({ success: true, data: data || (transactionId ? null : {}) });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 });
  }
}
