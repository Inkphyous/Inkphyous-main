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
    const queriesUrl = `${FIREBASE_RTDB_URL}/queries.json?auth=${encodeURIComponent(idToken)}`;
    
    const response = await fetch(queriesUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch queries: ${response.statusText}`);
    }

    const data = await response.json();
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

    const idToken = extractBearerToken(request);
    const deleteUrl = `${FIREBASE_RTDB_URL}/queries/${id}.json?auth=${encodeURIComponent(idToken)}`;
    
    const response = await fetch(deleteUrl, { method: "DELETE", cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to delete query: ${response.statusText}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin queries DELETE error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
