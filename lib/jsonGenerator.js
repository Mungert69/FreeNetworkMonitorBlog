const fs = require("fs");
const path = require("path");
const config = require("../config/config.json");
const axios = require("axios");
const { normalizeCategories } = require("./category-catalog.cjs");
const { sortByDate } = require("./utils/post-order.cjs");
const { isPublishedPost, resolvePostSlug } = require("./publication-policy.cjs");

const runConfig = require("../public/runConfig.json");

const { blog_folder } = config.settings;
const repoRoot = path.resolve(__dirname, "..");
const getDefaultPaths = (rootDir = repoRoot) => {
  const resolvedRoot = path.resolve(rootDir);
  return {
    repoRoot: resolvedRoot,
    jsonDir: path.join(resolvedRoot, ".json"),
    contentRoot: path.join(resolvedRoot, "content"),
    publicDir: path.join(resolvedRoot, "public"),
  };
};
const defaultPaths = getDefaultPaths();
const jsonDir = defaultPaths.jsonDir;
const baseSiteUrl = (config.site?.base_url || "").replace(/\/$/, "");
const defaultAuthor = config.metadata?.meta_author || "";

const toPlainText = (markdown = "") =>
  markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\(([^)]+)\)/g, "$1")
    .replace(/[#>*_~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (text = "", length = 320) =>
  text.length > length ? `${text.slice(0, length).trim()}…` : text;

const escapeMdxCurlyBracesOutsideCodeFences = (content = "") => {
  const lines = String(content).split("\n");
  let inCodeFence = false;

  return lines
    .map((line) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("```")) {
        inCodeFence = !inCodeFence;
        return line;
      }

      if (inCodeFence) {
        return line;
      }

      return line.replace(/[{}]/g, "\\$&");
    })
    .join("\n");
};

const escapeMdxAngleBracketPlaceholdersOutsideCode = (content = "") => {
  const lines = String(content).split("\n");
  let inCodeFence = false;

  return lines
    .map((line) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("```")) {
        inCodeFence = !inCodeFence;
        return line;
      }

      if (inCodeFence) {
        return line;
      }

      // Preserve inline code spans; only sanitize plain-text segments.
      const parts = line.split("`");
      for (let i = 0; i < parts.length; i += 2) {
        parts[i] = parts[i].replace(
          /<([A-Za-z][A-Za-z0-9_-]{0,63})>/g,
          "&lt;$1&gt;",
        );
      }
      return parts.join("`");
    })
    .join("\n");
};

const escapeDoubleQuotes = (value) => String(value).replace(/"/g, '\\"');

const createFrontmatterBlock = (frontmatter = {}) => {
  const lines = Object.keys(frontmatter).map((key) => {
    const value = frontmatter[key];

    if (key === "categories" && Array.isArray(value)) {
      return `${key}: [${value
        .map((category) => `"${escapeDoubleQuotes(category)}"`)
        .join(", ")}]`;
    }

    if ((key === "questions" || key === "answers") && Array.isArray(value)) {
      if (value.length === 0) {
        return `${key}: []`;
      }
      return `${key}:\n${value
        .map((item) => `  - "${escapeDoubleQuotes(item)}"`)
        .join("\n")}`;
    }

    return `${key}: ${value}`;
  });

  return `---\n${lines.join("\n")}\n---\n`;
};

const buildPostMarkdown = (post) => {
  const frontmatter = createFrontmatterBlock(post.frontmatter || {});
  const safeContentWithCurlyEscaped = escapeMdxCurlyBracesOutsideCodeFences(post.content || "");
  const safeContent = escapeMdxAngleBracketPlaceholdersOutsideCode(
    safeContentWithCurlyEscaped,
  );
  return `${frontmatter}${safeContent}`;
};

const ensureBlogFolder = ({
  fsModule = fs,
  pathModule = path,
  contentRoot = defaultPaths.contentRoot,
  blogFolder = blog_folder,
}) => {
  const blogPath = pathModule.join(contentRoot, blogFolder);
  if (!fsModule.existsSync(blogPath)) {
    fsModule.mkdirSync(blogPath, { recursive: true });

    const source = pathModule.join(contentRoot, "_index.md");
    const destination = pathModule.join(blogPath, "_index.md");
    if (fsModule.existsSync(source) && !fsModule.existsSync(destination)) {
      fsModule.copyFileSync(source, destination);
    }
  }

  return blogPath;
};

const writePostsToMarkdown = ({
  postsArray,
  fsModule = fs,
  pathModule = path,
  contentRoot = defaultPaths.contentRoot,
  blogFolder = blog_folder,
  pruneStalePosts = false,
}) => {
  const blogPath = ensureBlogFolder({
    fsModule,
    pathModule,
    contentRoot,
    blogFolder,
  });

  if (pruneStalePosts) {
    if (!Array.isArray(postsArray) || postsArray.some(post => !post?.slug || !post.frontmatter)) {
      throw new Error("Refusing to prune blog files from a malformed import.");
    }
    const expected = new Set(postsArray.map(post => `${post.slug}.md`));
    for (const filename of fsModule.readdirSync(blogPath)) {
      if (filename.endsWith('.md') && !filename.startsWith('_') && !expected.has(filename)) {
        fsModule.unlinkSync(pathModule.join(blogPath, filename));
      }
    }
  }
  const written = new Set();
  for (const post of postsArray) {
    if (!post?.slug || !post.frontmatter) {
      // Preserve old behavior: skip malformed posts.
      console.error("Skipping post with missing slug or frontmatter:", post);
      continue;
    }

    const filename = `${post.slug}.md`;
    // Imports are newest first: don't overwrite a duplicate slug with older data.
    if (written.has(filename)) continue;
    written.add(filename);
    const content = buildPostMarkdown(post);
    fsModule.writeFileSync(pathModule.join(blogPath, filename), content);
  }
};

const buildBlogIndex = (
  postsArray,
  { siteBaseUrl = baseSiteUrl, authorFallback = defaultAuthor } = {},
) =>
  postsArray.filter(isPublishedPost).map((post) => {
    const frontmatter = post.frontmatter || {};
    const rawContent = post.content || "";
    const plainContent = toPlainText(rawContent);
    const summarySource = frontmatter.description || frontmatter.summary || plainContent;

    return {
      title: frontmatter.title || post.slug,
      slug: resolvePostSlug(post.slug, frontmatter),
      summary: truncate(summarySource, 360),
      content: truncate(plainContent, 4000),
      categories: Array.isArray(frontmatter.categories) ? frontmatter.categories : [],
      url: siteBaseUrl ? `${siteBaseUrl}/posts/${resolvePostSlug(post.slug, frontmatter)}` : `/posts/${resolvePostSlug(post.slug, frontmatter)}`,
      image: frontmatter.image || "",
      author: frontmatter.author || authorFallback,
      publishedAt: frontmatter.date || null,
    };
  });

const getBlogJson = async ({
  apiLoadBalancerUrl = runConfig.apiLoadBalancerUrl,
  sourceJsonPath = process.env.BLOG_SOURCE_JSON,
  axiosInstance = axios,
  // Leave the agent unset by default so Axios uses Node's normal certificate
  // validation. Tests may still inject a custom agent explicitly.
  httpsAgent,
  fsModule = fs,
  pathModule = path,
  outputJsonDir = jsonDir,
  contentRoot = defaultPaths.contentRoot,
  publicDir = defaultPaths.publicDir,
  blogFolder = blog_folder,
  siteBaseUrl = baseSiteUrl,
  authorFallback = defaultAuthor,
} = {}) => {
  console.log(`apiLoadBalancerUrl is ${apiLoadBalancerUrl}`);

  let result;
  try {
    if (sourceJsonPath) {
      const snapshot = JSON.parse(fsModule.readFileSync(sourceJsonPath, 'utf8'));
      result = { data: Array.isArray(snapshot) ? { data: JSON.stringify(snapshot) } : snapshot };
      console.log(`Using local blog source snapshot: ${sourceJsonPath}`);
    } else result = await axiosInstance({
      method: "post",
      url: `${apiLoadBalancerUrl}/Blog/BlogsJson`,
      data: "",
      httpsAgent,
    });
  } catch (error) {
    console.log(`jsonGenerator.getBlogsJson Axios Error was : ${error}`);
    return "{}";
  }

  let data;
  try {
    ensureBlogFolder({
      fsModule,
      pathModule,
      contentRoot,
      blogFolder,
    });
    data = result.data.data;
  } catch (error) {
    console.log(`jsonGenerator.getBlogJson Mapping Data Error was : ${error}`);
    if (result !== undefined && result.data?.message !== undefined) {
      console.log(`Api Result.Message was ${result.data.message}`);
    }
    return "{}";
  }

  console.log(`ServiceAPI.getBlogJson Got data ${data.length} characters`);

  if (!fsModule.existsSync(outputJsonDir)) {
    fsModule.mkdirSync(outputJsonDir, { recursive: true });
  }

  fsModule.writeFileSync(pathModule.join(outputJsonDir, "posts.json"), data);

  const importedPosts = JSON.parse(data);
  if (!Array.isArray(importedPosts) || importedPosts.some(post =>
    !post?.slug || !post.frontmatter || typeof post.frontmatter !== 'object' || typeof post.content !== 'string'
  )) throw new Error("Blog API response contains malformed posts; refusing to replace source files.");
  const seenSlugs = new Set();
  const postsArray = sortByDate(importedPosts.filter(isPublishedPost).map(post => ({
    ...post,
    frontmatter: { ...post.frontmatter, categories: normalizeCategories(post.frontmatter.categories) },
  }))).filter(post => {
    const slug = resolvePostSlug(post.slug, post.frontmatter);
    if (seenSlugs.has(slug)) return false;
    seenSlugs.add(slug);
    return true;
  });
  writePostsToMarkdown({
    postsArray,
    pruneStalePosts: true,
    fsModule,
    pathModule,
    contentRoot,
    blogFolder,
  });

  const blogIndex = buildBlogIndex(postsArray, {
    siteBaseUrl,
    authorFallback,
  });

  try {
    fsModule.writeFileSync(
      pathModule.join(publicDir, "blog-index.json"),
      JSON.stringify(blogIndex, null, 2),
    );
  } catch (error) {
    console.error("Failed to write blog-index.json", error);
  }

  return data;
};

const run = async () => {
  console.log(`runConfig is ${runConfig}`);

  try {
    if (!fs.existsSync(jsonDir)) {
      fs.mkdirSync(jsonDir, { recursive: true });
    }

    const data = await getBlogJson();
    if (data === "{}") throw new Error("Blog import failed; refusing to build from stale source files.");
    console.log("Got data:", data.length, "characters");
    fs.writeFileSync(path.join(jsonDir, "posts.json"), data);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
};

if (require.main === module) {
  void run();
}

module.exports = {
  getDefaultPaths,
  escapeMdxCurlyBracesOutsideCodeFences,
  toPlainText,
  truncate,
  createFrontmatterBlock,
  buildPostMarkdown,
  ensureBlogFolder,
  writePostsToMarkdown,
  buildBlogIndex,
  getBlogJson,
  run,
};
