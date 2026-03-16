const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const config = require("../config/config.json");

const staticPagesDefault = ["", "about", "contact"];
const invalidPostSlugPattern = /^(?:default\d*|\d+)$/i;

function normalizePathSegment(value = "") {
  return String(value).replace(/^\/+|\/+$/g, "");
}

function toCategorySlug(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toCanonicalUrl(baseUrl, pathname = "") {
  const cleanedBaseUrl = String(baseUrl || "").replace(/\/+$/g, "");
  const cleanedPath = normalizePathSegment(pathname);
  if (!cleanedPath) return `${cleanedBaseUrl}/`;
  return `${cleanedBaseUrl}/${cleanedPath}/`;
}

function isValidPostSlug(slug) {
  if (!slug) return false;
  return !invalidPostSlugPattern.test(String(slug));
}

function getAllPosts(folder, { cwd = process.cwd(), fsModule = fs, pathModule = path } = {}) {
  const dir = pathModule.join(cwd, "content", folder);
  const files = fsModule.readdirSync(dir);
  return files
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .map((file) => {
      const filePath = pathModule.join(dir, file);
      const raw = fsModule.readFileSync(filePath, "utf-8");
      const { data } = matter(raw);
      const slug = data.url ? data.url.replace(/\//g, "") : file.replace(".md", "");
      return {
        frontmatter: data,
        slug,
      };
    })
    .filter(
      (post) =>
        !post.frontmatter.draft &&
        post.frontmatter.layout !== "404" &&
        isValidPostSlug(post.slug),
    );
}

function getAllCategories(posts) {
  const categories = [];
  posts.forEach((post) => {
    if (Array.isArray(post.frontmatter.categories)) {
      post.frontmatter.categories.forEach((category) => {
        const slug = toCategorySlug(category);
        if (slug && !categories.includes(slug)) {
          categories.push(slug);
        }
      });
    }
  });
  return categories;
}

function getPaginatedPages(postsLength, postsPerPage) {
  const totalPages = Math.ceil(postsLength / postsPerPage);
  const pages = [];
  for (let i = 2; i <= totalPages; i += 1) {
    pages.push(`page/${i}`);
  }
  return pages;
}

function resolveStaticPages(
  staticPages = staticPagesDefault,
  { cwd = process.cwd(), fsModule = fs, pathModule = path } = {},
) {
  return staticPages.filter((page) => {
    const normalized = normalizePathSegment(page);
    if (!normalized) return true;
    return fsModule.existsSync(pathModule.join(cwd, "content", `${normalized}.md`));
  });
}

function buildUrls({
  baseUrl,
  posts,
  categories,
  staticPages = staticPagesDefault,
  postsPerPage,
}) {
  const paginatedPages = getPaginatedPages(posts.length, postsPerPage);

  return [
    ...staticPages.map((page) => toCanonicalUrl(baseUrl, page)),
    ...posts.map((post) => toCanonicalUrl(baseUrl, `posts/${post.slug}`)),
    ...categories.map((category) => toCanonicalUrl(baseUrl, `categories/${category}`)),
    ...paginatedPages.map((page) => toCanonicalUrl(baseUrl, page)),
  ];
}

function buildSitemapXml(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `<url>
  <loc>${url}</loc>
</url>`,
  )
  .join("\n")}
</urlset>`;
}

function generateSitemap({
  cfg = config,
  cwd = process.cwd(),
  fsModule = fs,
  pathModule = path,
  outputPath = pathModule.join(__dirname, "../public/sitemap.xml"),
  staticPages = staticPagesDefault,
} = {}) {
  const baseUrl = cfg.site.base_url;
  const blogFolder = cfg.settings.blog_folder;
  const postsPerPage = cfg.settings.pagination || 10;

  const posts = getAllPosts(blogFolder, { cwd, fsModule, pathModule });
  const categories = getAllCategories(posts);
  const resolvedStaticPages = resolveStaticPages(staticPages, {
    cwd,
    fsModule,
    pathModule,
  });

  const urls = buildUrls({
    baseUrl,
    posts,
    categories,
    staticPages: resolvedStaticPages,
    postsPerPage,
  });

  const sitemap = buildSitemapXml(urls);
  fsModule.writeFileSync(outputPath, sitemap);

  console.log("sitemap.xml generated in /public");

  return {
    posts,
    categories,
    urls,
    sitemap,
    outputPath,
  };
}

if (require.main === module) {
  generateSitemap();
}

module.exports = {
  getAllPosts,
  getAllCategories,
  getPaginatedPages,
  resolveStaticPages,
  isValidPostSlug,
  toCategorySlug,
  toCanonicalUrl,
  buildUrls,
  buildSitemapXml,
  generateSitemap,
};
