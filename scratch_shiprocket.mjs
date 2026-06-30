import { assignCourier } from "./lib/shiprocketService.js";

async function run() {
  try {
    const res = await assignCourier(1422798405);
    console.log("Success", res);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
