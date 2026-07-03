const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k.trim()] = v.trim().replace(/^['"]|['"]$/g, '');
  return acc;
}, {});

async function testTracking() {
  const email = env.SHIPROCKET_EMAIL;
  const password = env.SHIPROCKET_PASSWORD;

  // Authenticate
  const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const authData = await authRes.json();
  const token = authData.token;
  
  if(!token) {
    console.error("Auth failed", authData);
    return;
  }
  
  // Pick an AWB from the recent tests
  // We'll just fetch orders first to get an AWB
  const ordersRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders?per_page=5', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const ordersData = await ordersRes.json();
  
  console.log("Orders found:", ordersData.data.length);
  
  for(const order of ordersData.data) {
    if(order.shipments && order.shipments.length > 0) {
      const awb = order.shipments[0].awb;
      if(awb) {
        console.log(`Tracking AWB: ${awb}`);
        const trackRes = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const trackData = await trackRes.json();
        console.log("Tracking JSON:", JSON.stringify(trackData, null, 2).substring(0, 1500));
        return;
      }
    }
  }
  
  console.log("No AWB found in recent orders to test.");
}

testTracking();
