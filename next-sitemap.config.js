/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://solum-challenge.vercel.app",
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: ["/api/*"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/*"],
      },
    ],
  },
};
