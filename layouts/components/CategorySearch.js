import { useEffect, useMemo, useState } from "react";
import Post from "@partials/Post";

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const MAX_RESULTS = 6;

const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length) return -Infinity;
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
};

const loadEmbedder = (() => {
  let embedderPromise = null;
  return async () => {
    if (!embedderPromise) {
      embedderPromise = (async () => {
        const { pipeline, env } = await import("@xenova/transformers");
        env.localModelPath = "/models";
        env.cacheDir = "indexeddb://transformers";
        env.allowLocalModels = true;
        env.allowRemoteModels = true;
        env.useBrowserCache = true;
        return pipeline("feature-extraction", MODEL_ID, { quantized: true });
      })();
    }
    return embedderPromise;
  };
})();

const CategorySearch = ({ posts }) => {
  const [query, setQuery] = useState("");
  const [vectors, setVectors] = useState(new Map());
  const [loadingIndex, setLoadingIndex] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);

  const postMap = useMemo(
    () => new Map(posts.map((post) => [post.slug, post])),
    [posts]
  );

  useEffect(() => {
    let active = true;
    const fetchIndex = async () => {
      try {
        const response = await fetch("/post-embeddings.json", {
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });
        const status = response.status;
        const contentType = response.headers.get("content-type") || "";
        const body = await response.text();
        if (!response.ok) {
          throw new Error(
            `Unable to load semantic search index (status ${status}).`
          );
        }
        if (!contentType.includes("application/json")) {
          const snippet = body.slice(0, 120).replace(/\s+/g, " ");
          throw new Error(
            `Search index response is not JSON (content-type ${contentType || "unknown"}). Snippet: ${snippet}`
          );
        }
        let payload;
        try {
          payload = JSON.parse(body);
        } catch (parseError) {
          const snippet = body.slice(0, 120).replace(/\s+/g, " ");
          throw new Error(
            `Search index response is not valid JSON. Snippet: ${snippet}`
          );
        }
        const map = new Map();
        for (const item of payload.embeddings || []) {
          map.set(item.slug, item.embedding);
        }
        if (active) {
          setVectors(map);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoadingIndex(false);
        }
      }
    };
    fetchIndex();
    return () => {
      active = false;
    };
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || vectors.size === 0) {
      setResults([]);
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const embedder = await loadEmbedder();
      const output = await embedder(trimmed, {
        pooling: "mean",
        normalize: true,
      });
      const queryVector = Array.from(output.data);

      const scored = [];
      for (const [slug, embedding] of vectors.entries()) {
        const score = cosineSimilarity(queryVector, embedding);
        if (score > -Infinity) {
          scored.push({ slug, score });
        }
      }

      scored.sort((a, b) => b.score - a.score);

      const topResults = scored
        .slice(0, MAX_RESULTS)
        .map(({ slug, score }) => ({
          slug,
          score,
          post: postMap.get(slug),
        }))
        .filter((item) => item.post);

      setResults(topResults);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <section className="section pt-0">
      <div className="container">
        <div className="mx-auto max-w-3xl rounded border border-border p-6 dark:border-darkmode-border">
          <h2 className="section-title mb-4 text-center">
            Smart Post Finder
          </h2>
          <p className="text-center text-sm text-light dark:text-darkmode-light">
            Search across the full post content using semantic similarity.
          </p>
          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            onSubmit={handleSearch}
          >
            <input
              className="w-full rounded border border-border px-4 py-3 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-darkmode-border dark:bg-darkmode-theme-dark"
              placeholder="Try typing “SSL troubleshooting tips”"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={loadingIndex || searching}
            />
            <button
              className="btn btn-primary whitespace-nowrap px-6 py-3"
              type="submit"
              disabled={loadingIndex || searching}
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </form>
          <div className="mt-4 text-center text-sm text-light dark:text-darkmode-light">
            {loadingIndex && "Loading search index..."}
            {!loadingIndex && vectors.size === 0 && !error
              ? "Search index is empty. Try rebuilding the site to refresh embeddings."
              : null}
            {error && <span className="text-red-500">{error}</span>}
          </div>
        </div>

        {results.length > 0 && (
          <div className="mt-12">
            <h3 className="section-title mb-8 text-center">
              Top semantic matches
            </h3>
            <div className="row">
              {results.map(({ post, slug }) => (
                <div key={slug} className="mt-10 md:col-6 xl:col-4">
                  <Post post={post} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CategorySearch;
