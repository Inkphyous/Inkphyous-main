const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

let tokenCache = null;
let tokenExpiry = null;

/**
 * Authenticates with Shiprocket and returns a Bearer token.
 * Tokens are cached in memory for 24 hours.
 */
async function getShiprocketToken() {
  if (tokenCache && tokenExpiry && Date.now() < tokenExpiry) {
    return tokenCache;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to authenticate with Shiprocket");
  }

  tokenCache = data.token;
  // Shiprocket tokens expire in 10 days, but we refresh every 24 hours to be safe
  tokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
  
  return tokenCache;
}

/**
 * Step 1: Create an Adhoc Order
 * @param {Object} orderData 
 */
export async function createShiprocketOrder(orderData) {
  const token = await getShiprocketToken();

  const response = await fetch(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });

  const data = await response.json();
  if (!response.ok) {
    const details = data.errors ? JSON.stringify(data.errors) : "";
    throw new Error(`${data.message || "Failed to create Shiprocket order"} ${details}`.trim());
  }

  return {
    order_id: data.order_id,
    shipment_id: data.shipment_id,
  };
}

/**
 * Step 2: Assign Courier (Generates AWB)
 * @param {String|Number} shipmentId 
 */
export async function assignCourier(shipmentId) {
  const token = await getShiprocketToken();

  const response = await fetch(`${SHIPROCKET_BASE_URL}/courier/assign/awb`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      shipment_id: shipmentId,
    }),
  });

  const data = await response.json();
  // Shiprocket returns 200 even when wallet balance is low, but awb_assign_status is 0
  if (!response.ok || data.awb_assign_status === 0) {
    throw new Error(data.response?.data?.awb_assign_error || data.message || "Failed to assign courier");
  }

  return data;
}

/**
 * Step 3: Request Pickup
 * @param {Array} shipmentIds - Array of shipment IDs
 */
export async function generatePickup(shipmentIds) {
  const token = await getShiprocketToken();

  const response = await fetch(`${SHIPROCKET_BASE_URL}/courier/generate/pickup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      shipment_id: shipmentIds,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to generate pickup");
  }

  return data;
}

const delay = (ms) => new Promise(res => setTimeout(res, ms));

/**
 * FULL WORKFLOW HELPER
 * Executes all 3 steps required to fulfill an order immediately
 */
export async function processShiprocketFulfillment(orderData) {
  // 1. Create Order
  const { order_id, shipment_id } = await createShiprocketOrder(orderData);
  
  return {
    shiprocket_order_id: order_id,
    shipment_id,
    awb_code: "Pending (Request created)",
    courier_name: "Pending",
    tracking_url: "",
  };
}

/**
 * Step 2 & 3: Assign Courier and Generate Pickup
 */
export async function scheduleShiprocketPickup(shipment_id) {
  // 1. Assign Courier & Generate AWB
  const courierData = await assignCourier(shipment_id);
  
  const awbCode = courierData?.response?.data?.awb_code;
  const courierName = courierData?.response?.data?.courier_name;

  // Wait 1.5s to ensure AWB is fully assigned
  await delay(1500);

  // 2. Generate Pickup
  await generatePickup([shipment_id]);

  return {
    awb_code: awbCode,
    courier_name: courierName,
    tracking_url: `https://shiprocket.co/tracking/${awbCode}`,
  };
}

/**
 * Cancel an existing Shiprocket Order
 * @param {Array<number>} orderIds - Array of Shiprocket order IDs to cancel
 */
export async function cancelShiprocketOrder(orderIds) {
  const token = await getShiprocketToken();

  const response = await fetch(`${SHIPROCKET_BASE_URL}/orders/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ids: orderIds }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to cancel Shiprocket order");
  }

  return data;
}

/* 
======================================================================
EXAMPLE: Calling from PhonePe Webhook Controller (app/api/webhook/route.js)
======================================================================

import { processShiprocketFulfillment } from "@/lib/shiprocketService";

export async function POST(req) {
  // ... Handle PhonePe Signature Verification ...
  
  // If payment is SUCCESSFUL:
  if (paymentStatus === "SUCCESS") {
    
    // Construct order details based on your DB order
    const shiprocketOrderPayload = {
      order_id: `ORD-${Date.now()}`, // Your internal unique order ID
      order_date: new Date().toISOString(),
      pickup_location: "Primary", // Setup in Shiprocket Dashboard
      billing_customer_name: order.shippingInfo.firstName,
      billing_last_name: order.shippingInfo.lastName,
      billing_address: order.shippingInfo.address,
      billing_city: order.shippingInfo.city,
      billing_pincode: order.shippingInfo.pincode,
      billing_state: order.shippingInfo.state,
      billing_country: "India",
      billing_email: order.shippingInfo.email,
      billing_phone: order.shippingInfo.phone,
      shipping_is_billing: true,
      order_items: order.items.map(item => ({
        name: item.name,
        sku: item.sku,
        units: item.quantity,
        selling_price: item.price,
        discount: "",
        tax: "",
        hsn: ""
      })),
      payment_method: "Prepaid",
      sub_total: order.subtotal,
      length: 10, // Must be provided in cm
      breadth: 10,
      height: 10,
      weight: 0.5 // Must be provided in kg
    };

    try {
      const fulfillmentDetails = await processShiprocketFulfillment(shiprocketOrderPayload);
      // Save fulfillmentDetails to DB
    } catch (e) {
      console.error("Shiprocket automation failed:", e.message);
    }
  }
}
*/
