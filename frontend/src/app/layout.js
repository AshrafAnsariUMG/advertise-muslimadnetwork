import Script from "next/script";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import FloodlightTracker from "@/components/FloodlightTracker";
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
        {/* Google tag (gtag.js) — DoubleClick Floodlight DC-16361189.
            Loader + config here; FloodlightTracker fires the audience
            activity on every page view (incl. client-side navigations). */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=DC-16361189"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'DC-16361189');
          `}
        </Script>

        {children}

        <FloodlightTracker />

        {/* No-JS fallback for the Floodlight activity */}
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://ad.doubleclick.net/ddm/activity/src=16361189;type=manau0;cat=manss0;dc_lat=;dc_rdid=;tag_for_child_directed_treatment=;tfua=;npa=;gdpr=;gdpr_consent=;ord=1?"
            width="1"
            height="1"
            alt=""
          />
        </noscript>

        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
