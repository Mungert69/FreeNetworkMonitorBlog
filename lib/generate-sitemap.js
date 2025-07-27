const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const config = require("../config/config.json");

const baseUrl = config.site.base_url;
const blog_folder = config.settings.blog_folder;

// Helper to get all posts
function getAllPosts(folder) {
  const dir = path.join(process.cwd(), "content", folder);
  const files = fs.readdirSync(dir);
  return files
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .map((file) => {
      const filePath = path.join(dir, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(raw);
      const slug = data.url ? data.url.replace("/", "") : file.replace(".md", "");
      return {
        frontmatter: data,
        slug,
      };
    })
    .filter(
      (post) =>
        !post.frontmatter.draft &&
        post.frontmatter.layout !== "404" &&
        new Date(post.frontmatter.date || new Date()) <= new Date()
    );
}

// Helper to get all categories
function getAllCategories(posts) {
  const cats = [];
  posts.forEach((post) => {
    if (Array.isArray(post.frontmatter.categories)) {
      post.frontmatter.categories.forEach((cat) => {
        if (!cats.includes(cat)) cats.push(cat);
      });
    }
  });
  return cats;
}

const posts = getAllPosts(blog_folder);
const categories = getAllCategories(posts);

const staticPages = [
  "",
  "about",
  "contact",
  // add more static pages if needed
];

const postsPerPage = config.settings.pagination || 10;
const totalPages = Math.ceil(posts.length / postsPerPage);
const paginatedPages = [];
for (let i = 2; i <= totalPages; i++) {
  paginatedPages.push(`posts/${i}`);
}

const urls = [
  ...staticPages.map((page) => `${baseUrl}/${page}`),
  ...posts.map((post) => `${baseUrl}/posts/${post.slug}`),
  ...categories.map((cat) => `${baseUrl}/categories/${cat.replace(/\s+/g, "-")}`),
  ...paginatedPages.map((page) => `${baseUrl}/${page}`),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `<url>
  <loc>${url}</loc>
</url>`
  )
  .join("\n")}
</urlset>`;

fs.writeFileSync(path.join(__dirname, "../public/sitemap.xml"), sitemap);

console.log("sitemap.xml generated in /public");
