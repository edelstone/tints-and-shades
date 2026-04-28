import { site } from "../data/site";

const pages = ["/", "/about/"];

export function GET() {
  const lastmod = new Date().toISOString();
  const body = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pages.map((pathname) => {
      const loc = new URL(pathname, site.url).toString();
      return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`;
    }),
    "</urlset>"
  ].join("");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
}
