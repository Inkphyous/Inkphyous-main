importScripts("https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyC3Kvn0CpnC9qaZjAQ8M5yTPSRMuFArikM",
  authDomain: "inkphyous-a1027.firebaseapp.com",
  databaseURL: "https://inkphyous-a1027-default-rtdb.firebaseio.com",
  projectId: "inkphyous-a1027",
  storageBucket: "inkphyous-a1027.firebasestorage.app",
  messagingSenderId: "344029907498",
  appId: "1:344029907498:web:4b605ef0933aa2922f1153",
  measurementId: "G-LGWWT1C5QG"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  const notificationTitle = payload.notification?.title || payload.data?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || "",
    icon: "/icon.png"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
