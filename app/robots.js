export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/checkout', '/cart', '/admin', '/addresses', '/orders', '/login', '/forgot-password'],
    },
    sitemap: 'https://inkphyous.com/sitemap.xml',
  }
}
