import "./globals.css";
import { StoreProvider } from "@/components/providers/StoreProvider";
import EditProfilePopup from "@/components/EditProfilePopup";
import LoginRequiredPopup from "@/components/LoginRequiredPopup";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "INKPHYOUS | Premium Streetwear",
  description: "Premium streetwear brand featuring oversized jerseys, shorts, and trackpants with signature embroidery and prints.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alkatra:wght@400..700&family=Caprasimo&family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Google+Sans+Flex:opsz,wght@6..144,1..1000&family=Jost:ital,wght@0,100..900;1,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Titillium+Web:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <StoreProvider>
          {children}
          <EditProfilePopup />
          <LoginRequiredPopup />
        </StoreProvider>
        <Analytics />
      </body>
    </html>
  );
}
