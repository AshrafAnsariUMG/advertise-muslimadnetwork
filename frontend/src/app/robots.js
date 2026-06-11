// Keep the SSCO test sandbox + admin + transactional pages out of search
// indexes. Public marketing pages + the wizard stay crawlable.
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/ssco-test', '/admin', '/payment', '/application-success'],
      },
    ],
  };
}
