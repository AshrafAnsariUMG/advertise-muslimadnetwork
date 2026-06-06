/** @type {import('next').NextConfig} */

/*
 * Content-Security-Policy for advertise.muslimadnetwork.com.
 *
 * Allow-lists every third-party origin the app actually uses:
 *  - Google Tag Manager / DoubleClick (Floodlight retargeting tag)
 *  - Pipedrive (embedded charity web-form + scheduler)
 *  - OpenStreetMap tiles + cdnjs leaflet marker icons (location picker)
 *  - Stripe / PayPal (redirect checkout — included for forward-compat)
 *
 * NOTE on scripts: pages are statically prerendered, so a nonce-based CSP
 * (which needs per-request rendering) isn't viable without forcing dynamic
 * rendering everywhere. We use 'unsafe-inline' for Next's bootstrap +
 * gtag + JSON-LD inline scripts. `eval` is NOT permitted. Everything else
 * (object-src, base-uri, frame-ancestors, host allow-lists) is locked down.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://webforms.pipedrive.com https://*.pipedrive.com https://js.stripe.com https://www.paypal.com https://www.paypalobjects.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.googletagmanager.com https://ad.doubleclick.net https://*.g.doubleclick.net https://*.google.com https://www.google.com https://cdnjs.cloudflare.com https://*.tile.openstreetmap.org https://webforms.pipedrive.com https://*.pipedrive.com",
  "font-src 'self' data:",
  "connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://*.g.doubleclick.net https://*.google.com https://api.stripe.com https://webforms.pipedrive.com https://*.pipedrive.com",
  "frame-src 'self' https://webforms.pipedrive.com https://*.pipedrive.com https://js.stripe.com https://hooks.stripe.com https://*.paypal.com https://*.doubleclick.net",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.pipedrive.com https://checkout.stripe.com https://www.paypal.com",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // HTTPS-only for a year (no includeSubDomains/preload — scoped to this host).
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Allow geolocation for the map's "use current location"; deny the rest.
  { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=(), payment=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
