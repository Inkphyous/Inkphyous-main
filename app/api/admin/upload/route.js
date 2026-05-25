import { NextResponse } from "next/server";
import path from "node:path";
import { getSupabaseAdmin, hasSupabaseAdminEnv } from "@/lib/supabase/server";
import { getAuthorizedAdminEmail } from "@/lib/firebase/serverAdminAuth";

function jsonError(message, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function sanitizeSegment(value) {
  return String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

export async function POST(request) {
  if (!hasSupabaseAdminEnv()) return jsonError("Supabase env vars are not configured.", 500);

  const adminEmail = await getAuthorizedAdminEmail(request);
  if (!adminEmail) return jsonError("Unauthorized", 401);

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "admin/uploads";
    if (!file || typeof file === "string") return jsonError("file is required.");

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name || "").toLowerCase();
    const safeName = `${Date.now()}-${sanitizeSegment(path.basename(file.name || "image", ext))}${ext || ".jpg"}`;
    const safeFolder = String(folder)
      .split("/")
      .map((segment) => sanitizeSegment(segment))
      .filter(Boolean)
      .join("/");
    const storagePath = `${safeFolder}/${safeName}`;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "product-images";

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from(bucket).upload(storagePath, fileBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
      cacheControl: "3600",
    });
    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    return NextResponse.json({
      success: true,
      uploadedBy: adminEmail,
      url: data.publicUrl,
      path: storagePath,
    });
  } catch (error) {
    return jsonError(error.message || "Failed to upload file.", 500);
  }
}
