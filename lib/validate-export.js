const fs = require("fs");
const path = require("path");
const { isValidPostSlug } = require("./publication-policy.cjs");

const repoRoot = path.resolve(__dirname, "..");
const outDir = path.join(repoRoot, "out");
const blogIndexPath = path.join(repoRoot, "public", "blog-index.json");

const resolveExpectedSlug = ({
  fsModule = fs,
  blogIndexFilePath = blogIndexPath,
  overrideSlug = process.env.BLOG_EXPORT_VALIDATE_SLUG || process.argv[2],
} = {}) => {
  if (overrideSlug) {
    return String(overrideSlug).trim();
  }

  if (!fsModule.existsSync(blogIndexFilePath)) {
    throw new Error(`Missing blog index at ${blogIndexFilePath}`);
  }

  const blogIndex = JSON.parse(fsModule.readFileSync(blogIndexFilePath, "utf-8"));
  if (!Array.isArray(blogIndex) || blogIndex.length === 0) {
    throw new Error("public/blog-index.json has no entries.");
  }

  const latestSlug = blogIndex[0]?.slug;
  if (!latestSlug) {
    throw new Error("First blog-index entry is missing slug.");
  }

  return latestSlug;
};

const validateExportArtifacts = ({
  fsModule = fs,
  outDirectory = outDir,
  expectedSlug = resolveExpectedSlug({ fsModule }),
} = {}) => {
  const expectedPostPath = path.join(outDirectory, "posts", expectedSlug, "index.html");
  const postsIndexPath = path.join(outDirectory, "posts", "index.html");
  const sitemapPath = path.join(outDirectory, "sitemap.xml");

  [expectedPostPath, postsIndexPath, sitemapPath].forEach((artifactPath) => {
    if (!fsModule.existsSync(artifactPath)) {
      throw new Error(`Missing expected export artifact: ${artifactPath}`);
    }
  });

  // A successful export must include every category submitted in its sitemap.
  // This catches slug drift before publishing another sitemap with broken URLs.
  const sitemap = fsModule.readFileSync(sitemapPath, "utf-8");
  for (const [, location] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const pathname = new URL(location).pathname;
    if (!pathname.startsWith("/categories/")) continue;
    const categoryFile = path.join(outDirectory, pathname.slice(1), "index.html");
    if (!fsModule.existsSync(categoryFile)) {
      throw new Error(`Sitemap category has no exported page: ${location}`);
    }
  }
};

const validatePublicationArtifacts = ({ outDirectory = outDir, fsModule = fs } = {}) => {
  for (const entry of fsModule.readdirSync(path.join(outDirectory, "posts"), { withFileTypes: true })) {
    if (entry.isDirectory() && !isValidPostSlug(entry.name)) {
      throw new Error(`Placeholder post was exported: ${entry.name}`);
    }
    if (entry.isDirectory()) {
      const html = fsModule.readFileSync(path.join(outDirectory, "posts", entry.name, "index.html"), "utf8");
      const jsonLd = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
      const article = jsonLd.find(data => data["@type"] === "BlogPosting");
      const canonicalTag = (html.match(/<link\b[^>]*>/g) || []).find(tag => tag.includes('rel="canonical"'));
      const canonical = canonicalTag?.match(/href="([^"]+)"/)?.[1];
      if (!article || !canonical || article.url !== canonical || article.mainEntityOfPage?.["@id"] !== canonical) {
        throw new Error(`Missing or inconsistent article structured data: ${entry.name}`);
      }
    }
  }
  const index = JSON.parse(fsModule.readFileSync(path.join(outDirectory, "blog-index.json"), "utf8"));
  for (const post of index) {
    if (!isValidPostSlug(post.slug)) throw new Error(`Placeholder appears in blog index: ${post.slug}`);
  }
};

const run = () => {
  const expectedSlug = resolveExpectedSlug();
  validateExportArtifacts({ expectedSlug });
  validatePublicationArtifacts();

  console.log(`Validated export artifacts for slug "${expectedSlug}".`);
};

if (require.main === module) {
  run();
}

module.exports = {
  validatePublicationArtifacts,
  resolveExpectedSlug,
  validateExportArtifacts,
  run,
};
