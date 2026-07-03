const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k.trim()] = v.trim().replace(/^['"]|['"]$/g, '');
  return acc;
}, {});

async function run() {
  const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.SHIPROCKET_EMAIL, password: env.SHIPROCKET_PASSWORD })
  });
  const token = (await authRes.json()).token;

  const res = await fetch('https://apiv2.shiprocket.in/v1/external/settings/company/pickup', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await res.json();
  const primary = data.data.shipping_address.find(a => a.pickup_location === "Primary");
  console.log("Primary Pickup Address:", primary);
}
run();
