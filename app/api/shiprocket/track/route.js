import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const awb = searchParams.get("awb");

    if (!awb || awb.toLowerCase().includes("pending")) {
      return NextResponse.json({ success: true, currentStatus: "Pending (Request Created)" });
    }

    // Authenticate with Shiprocket
    const authRes = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }),
    });
    
    const authData = await authRes.json();
    if (!authData.token) {
      throw new Error("Failed to authenticate with Shiprocket");
    }

    // Fetch tracking data
    const trackRes = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`, {
      headers: {
        Authorization: `Bearer ${authData.token}`,
      },
    });

    const trackData = await trackRes.json();

    if (!trackRes.ok) {
      if (trackData.message && trackData.message.toLowerCase().includes("cancelled")) {
        return NextResponse.json({
          success: true,
          currentStatus: "Cancelled",
          raw_data: trackData
        });
      }
      throw new Error(trackData.message || "Failed to fetch tracking data");
    }

    // Extract current status
    let currentStatus = "N/A";
    if (trackData.tracking_data && trackData.tracking_data.track_status === 1 && trackData.tracking_data.shipment_track && trackData.tracking_data.shipment_track.length > 0) {
        currentStatus = trackData.tracking_data.shipment_track[0].current_status;
    }

    return NextResponse.json({
      success: true,
      currentStatus,
      raw_data: trackData
    });
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An error occurred while tracking" },
      { status: 500 }
    );
  }
}
