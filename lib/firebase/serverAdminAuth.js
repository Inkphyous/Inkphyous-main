const FIREBASE_WEB_API_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC3Kvn0CpnC9qaZjAQ8M5yTPSRMuFArikM";
const FIREBASE_RTDB_URL =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  "https://inkphyous-a1027-default-rtdb.firebaseio.com";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function extractBearerToken(request) {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  return authHeader.slice(7).trim();
}

async function getEmailFromFirebaseIdToken(idToken) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    }
  );
  if (!response.ok) return null;
  const data = await response.json();
  const email = data?.users?.[0]?.email;
  return normalizeEmail(email);
}

function isEmailAllowedByAdminTree(tree, email) {
  if (!tree || !email) return false;

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return false;

  const values = Object.values(tree);
  for (const value of values) {
    if (typeof value === "string" && normalizeEmail(value) === normalizedEmail) {
      return true;
    }
    if (value && typeof value === "object") {
      if (typeof value.email === "string" && normalizeEmail(value.email) === normalizedEmail) {
        return true;
      }
    }
  }
  return false;
}

async function fetchAdminTree(idToken) {
  const withAuthUrl = `${FIREBASE_RTDB_URL}/admin.json?auth=${encodeURIComponent(idToken)}`;
  const response = await fetch(withAuthUrl, { cache: "no-store" });
  if (response.ok) return response.json();
  return null;
}

export async function getAuthorizedAdminEmail(request) {
  const idToken = extractBearerToken(request);
  if (!idToken) return null;

  const email = await getEmailFromFirebaseIdToken(idToken);
  if (!email) return null;

  const adminTree = await fetchAdminTree(idToken);
  if (!isEmailAllowedByAdminTree(adminTree, email)) return null;
  return email;
}

