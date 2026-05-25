import { NextResponse } from "next/server";
import { getAuthorizedAdminEmail } from "@/lib/firebase/serverAdminAuth";

const FIREBASE_RTDB_URL =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  "https://inkphyous-a1027-default-rtdb.firebaseio.com";

function extractBearerToken(request) {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  return authHeader.slice(7).trim();
}

export async function GET(request) {
  try {
    const email = await getAuthorizedAdminEmail(request);
    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const idToken = extractBearerToken(request);
    const usersUrl = `${FIREBASE_RTDB_URL}/users.json?auth=${encodeURIComponent(idToken)}`;
    
    const response = await fetch(usersUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Admin users API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
