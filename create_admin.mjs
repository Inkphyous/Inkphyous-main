const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC3Kvn0CpnC9qaZjAQ8M5yTPSRMuFArikM";
const email = "mayank@admin.com";
const password = "password123";

async function createUser() {
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    });
    const data = await res.json();
    if (data.error && data.error.message === "EMAIL_EXISTS") {
      console.log("User already exists.");
    } else if (data.error) {
      console.error("Error creating user:", data.error.message);
    } else {
      console.log("User created successfully with password:", password);
    }
  } catch (err) {
    console.error(err);
  }
}

createUser();
