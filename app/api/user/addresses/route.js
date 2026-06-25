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

  try {
    const url = `${FIREBASE_RTDB_URL}/addresses/${uid}.json?auth=${idToken}`;
    const response = await fetch(url, { cache: "no-store" });
    const data = await response.json();
    return NextResponse.json({ success: true, addresses: data || {} });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to fetch addresses" }, { status: 500 });
  }
}

export async function POST(request) {
  const idToken = extractBearerToken(request);
  if (!idToken) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const uid = await getUidFromFirebaseIdToken(idToken);
  if (!uid) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  try {
    const body = await request.json();
    // Use POST to push a new item to the list in RTDB REST API
    const url = `${FIREBASE_RTDB_URL}/addresses/${uid}.json?auth=${idToken}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, createdAt: new Date().toISOString() }),
    });
    const data = await response.json();
    return NextResponse.json({ success: true, name: data.name });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to add address" }, { status: 500 });
  }
}

export async function PUT(request) {
  const idToken = extractBearerToken(request);
  if (!idToken) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const uid = await getUidFromFirebaseIdToken(idToken);
  if (!uid) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, ...addressData } = body;
    if (!id) return NextResponse.json({ success: false, error: "Missing address id" }, { status: 400 });

    const url = `${FIREBASE_RTDB_URL}/addresses/${uid}/${id}.json?auth=${idToken}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addressData, updatedAt: new Date().toISOString() }),
    });
    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to update address" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const idToken = extractBearerToken(request);
  if (!idToken) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const uid = await getUidFromFirebaseIdToken(idToken);
  if (!uid) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "Missing address id" }, { status: 400 });

  try {
    const url = `${FIREBASE_RTDB_URL}/addresses/${uid}/${id}.json?auth=${idToken}`;
    const response = await fetch(url, { method: "DELETE" });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to delete address" }, { status: 500 });
  }
}
