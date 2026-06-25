import { NextResponse } from "next/server";
import { getAuthorizedAdminEmail } from "@/lib/firebase/serverAdminAuth";

const FIREBASE_RTDB_URL =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  "https://inkphyous-a1027-default-rtdb.firebaseio.com";

const FIREBASE_WEB_API_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC3Kvn0CpnC9qaZjAQ8M5yTPSRMuFArikM";

function extractBearerToken(request) {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  return authHeader.slice(7).trim();
}

export async function GET(request) {
  const email = await getAuthorizedAdminEmail(request);
  if (!email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const idToken = extractBearerToken(request);
    const url = `${FIREBASE_RTDB_URL}/orders.json?auth=${encodeURIComponent(idToken)}`;
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch orders" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const orders = data
      ? Object.entries(data)
          .map(([id, order]) => ({ id, ...order }))
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      : [];

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("Admin orders fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const email = await getAuthorizedAdminEmail(request);
  if (!email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId, status } = await request.json();
    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: "Missing orderId or status" },
        { status: 400 }
      );
    }

    const idToken = extractBearerToken(request);
    const url = `${FIREBASE_RTDB_URL}/orders/${orderId}.json?auth=${encodeURIComponent(idToken)}`;
    const updateResponse = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, updatedAt: new Date().toISOString() }),
    });

    if (!updateResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to update order" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin order update error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
