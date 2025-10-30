const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const POSTS_JSON = path.join(process.cwd(), ".json", "posts.json");
const OUTPUT_PATH = path.join(process.cwd(), "public", "post-embeddings.json");

const readJson = (targetPath) => {
  const raw = fs.readFileSync(targetPath, "utf-8");
  return JSON.parse(raw);
};

const createHash = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

const CACHE_DIR = path.join(process.cwd(), ".cache", "transformers");
const PUBLIC_MODEL_BASE = path.join(process.cwd(), "public", "models");
const MODEL_CACHE_DIR = path.join(CACHE_DIR, MODEL_ID);
const MODEL_PUBLIC_DIR = path.join(PUBLIC_MODEL_BASE, MODEL_ID);

const ensureEmbedder = (() => {
  let embedderPromise;
  return async () => {
    if (!embedderPromise) {
      embedderPromise = (async () => {
        const { pipeline, env } = await import("@xenova/transformers");
        await fs.promises.mkdir(CACHE_DIR, { recursive: true });
        await fs.promises.mkdir(PUBLIC_MODEL_BASE, { recursive: true });
        env.allowLocalModels = true;
        env.allowRemoteModels = true;
        env.cacheDir = CACHE_DIR;
        env.localModelPath = PUBLIC_MODEL_BASE;
        return pipeline("feature-extraction", MODEL_ID, { quantized: true });
      })();
    }
    return embedderPromise;
  };
})();

const syncModelToPublic = async () => {
  const existsInCache = fs.existsSync(MODEL_CACHE_DIR);
  if (!existsInCache) {
    // ensure cache is populated
    await ensureEmbedder();
  }

  if (!fs.existsSync(MODEL_CACHE_DIR)) {
    console.warn("Model cache directory not found; skipping copy.");
    return;
  }

  await fs.promises.mkdir(path.dirname(MODEL_PUBLIC_DIR), { recursive: true });

  await fs.promises.cp(MODEL_CACHE_DIR, MODEL_PUBLIC_DIR, {
    recursive: true,
    force: true,
  });
  console.log(`Model files synced to ${MODEL_PUBLIC_DIR}`);
};

const getExistingEmbeddings = () => {
  if (!fs.existsSync(OUTPUT_PATH)) {
    return {
      model: MODEL_ID,
      dimension: null,
      embeddings: [],
    };
  }

  try {
    const existing = readJson(OUTPUT_PATH);
    const embeddings = Array.isArray(existing.embeddings)
      ? existing.embeddings
      : [];
    return {
      model: existing.model || MODEL_ID,
      dimension: existing.dimension || null,
      embeddings,
    };
  } catch (error) {
    console.warn("Unable to parse existing embeddings:", error.message);
    return {
      model: MODEL_ID,
      dimension: null,
      embeddings: [],
    };
  }
};

const main = async () => {
  if (!fs.existsSync(POSTS_JSON)) {
    console.warn(
      "No posts.json found. Run lib/jsonGenerator.js before generating embeddings."
    );
    return;
  }

  const postsRaw = readJson(POSTS_JSON);
  const posts = Array.isArray(postsRaw) ? postsRaw : Object.values(postsRaw);

  if (!posts.length) {
    console.warn("No posts available to embed.");
    return;
  }

  const existing = getExistingEmbeddings();
  const existingMap = new Map(
    existing.embeddings.map((item) => [item.slug, item])
  );

  const results = [];
  const toProcess = [];
  let dimension = existing.dimension || null;

  for (const post of posts) {
    const slug = post.slug;
    const title = post.frontmatter?.title || "";
    const content = post.content || "";
    const text = `${title}\n${content}`.trim();

    if (!slug || !text) {
      continue;
    }

    const hash = createHash(text);
    const cached = existingMap.get(slug);

    if (
      cached &&
      cached.hash === hash &&
      Array.isArray(cached.embedding) &&
      cached.model === MODEL_ID
    ) {
      results.push(cached);
      if (!dimension) {
        dimension = cached.embedding.length;
      }
      continue;
    }

    toProcess.push({ slug, text, hash });
  }

  const embedder = await ensureEmbedder();
  if (toProcess.length) {
    for (const item of toProcess) {
      const output = await embedder(item.text, { pooling: "mean", normalize: true });
      const vector = Array.from(output.data);
      dimension = dimension || vector.length;
      results.push({ slug: item.slug, hash: item.hash, model: MODEL_ID, embedding: vector });
      console.log(`Generated embedding for ${item.slug}`);
    }
  }

  await syncModelToPublic();

  if (!dimension && results.length) {
    dimension = results[0].embedding.length;
  }

  results.sort((a, b) => a.slug.localeCompare(b.slug));

  const payload = {
    model: MODEL_ID,
    dimension: dimension || (results[0]?.embedding?.length ?? null),
    generatedAt: new Date().toISOString(),
    embeddings: results,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));
  console.log(
    `Embedding index updated at ${OUTPUT_PATH} (${results.length} entries)`
  );
};

main().catch((error) => {
  console.error("Embedding generation failed:", error);
  process.exitCode = 1;
});
