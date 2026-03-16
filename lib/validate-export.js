const fs = require("fs");
const path = require("path");

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
};

const run = () => {
  const expectedSlug = resolveExpectedSlug();
  validateExportArtifacts({ expectedSlug });

  console.log(`Validated export artifacts for slug "${expectedSlug}".`);
};

if (require.main === module) {
  run();
}

module.exports = {
  resolveExpectedSlug,
  validateExportArtifacts,
  run,
};
