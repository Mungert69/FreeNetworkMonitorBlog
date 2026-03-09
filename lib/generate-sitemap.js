const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const config = require("../config/config.json");

const staticPagesDefault = ["", "about", "contact"];

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
    .filter((post) => !post.frontmatter.draft && post.frontmatter.layout !== "404" && post);
}

function getAllCategories(posts) {
  const categories = [];
  posts.forEach((post) => {
    if (Array.isArray(post.frontmatter.categories)) {
      post.frontmatter.categories.forEach((category) => {
        if (!categories.includes(category)) {
          categories.push(category);
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
    pages.push(`posts/${i}`);
  }
  return pages;
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
    ...staticPages.map((page) => `${baseUrl}/${page}`),
    ...posts.map((post) => `${baseUrl}/posts/${post.slug}`),
    ...categories.map((category) => `${baseUrl}/categories/${category.replace(/\s+/g, "-")}`),
    ...paginatedPages.map((page) => `${baseUrl}/${page}`),
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

  const urls = buildUrls({
    baseUrl,
    posts,
    categories,
    staticPages,
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
  buildUrls,
  buildSitemapXml,
  generateSitemap,
};
