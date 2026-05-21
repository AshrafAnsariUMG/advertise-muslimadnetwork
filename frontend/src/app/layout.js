import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Advertise to Muslim Consumers | Muslim Ad Network",
  description:
    "Self-serve advertising platform to reach millions of engaged Muslim consumers worldwide.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
