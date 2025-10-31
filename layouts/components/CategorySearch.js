import { useEffect, useState } from "react";
import Post from "@partials/Post";

const normalize = (value) =>
  value?.toString().toLowerCase().replace(/\s+/g, " ").trim() ?? "";

const parseMetadataValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value) || typeof value === "object") {
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "null") {
    return null;
  }

  const firstChar = trimmed[0];
  const lastChar = trimmed[trimmed.length - 1];
  if (
    (firstChar === "[" && lastChar === "]") ||
    (firstChar === "{" && lastChar === "}")
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  return trimmed;
};

const extractSlugFromUrl = (urlValue) => {
  if (!urlValue) return "";
  try {
    const url = new URL(urlValue);
    const parts = url.pathname.split("/").filter(Boolean);
    return normalize(parts.pop());
  } catch {
    const parts = urlValue.split("/").filter(Boolean);
    return normalize(parts.pop());
  }
};

const CategorySearch = ({ posts }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  const findBestMatch = (hit, metadata) => {
    const slugMeta = normalize(metadata?.slug);
    if (slugMeta) {
      const bySlug = posts.find((post) => normalize(post.slug) === slugMeta);
      if (bySlug) {
        return bySlug;
      }
    }

    const urlSlug = extractSlugFromUrl(metadata?.url);
    if (urlSlug) {
      const byUrlSlug = posts.find((post) => normalize(post.slug) === urlSlug);
      if (byUrlSlug) {
        return byUrlSlug;
      }
    }

    const haystack = normalize(
      `${metadata?.title ?? hit?.input ?? ""} ${metadata?.summary ?? hit?.output ?? ""}`
    );
    if (!haystack) return null;

    let bestPost = null;
    let bestScore = 0;

    posts.forEach((post) => {
      const title = normalize(post.frontmatter?.title);
      const slug = normalize(post.slug);
      const summary = normalize(post.content?.slice(0, 200));
      const categories = (post.frontmatter?.categories ?? []).map(normalize);

      let score = 0;
      if (title && haystack.includes(title)) {
        score += Math.min(title.length, 20);
      }
      if (slug && haystack.includes(slug)) {
        score += slug.length;
      }
      categories.forEach((cat) => {
        if (cat && haystack.includes(cat)) {
          score += 2;
        }
      });
      if (summary) {
        const summaryWords = summary.split(" ").slice(0, 8).join(" ");
        if (summaryWords && haystack.includes(summaryWords)) {
          score += 4;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestPost = post;
      }
    });

    return bestScore > 0 ? bestPost : null;
  };

  useEffect(() => {
    let active = true;
    const fetchConfig = async () => {
      try {
        const response = await fetch("/runConfig.json", { cache: "no-store" });
        const body = await response.text();
        if (!response.ok) {
          throw new Error(
            `Unable to load search configuration (status ${response.status}).`
          );
        }
        const payload = JSON.parse(body);
        const baseUrl = payload.apiLoadBalancerUrl?.replace(/\/+$/, "");
        if (!baseUrl) {
          throw new Error("Search configuration missing 'apiLoadBalancerUrl'.");
        }
        if (active) {
          setApiBaseUrl(baseUrl);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoadingConfig(false);
        }
      }
    };
    fetchConfig();
    return () => {
      active = false;
    };
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();
    setSearchSubmitted(true);
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearchSubmitted(false); // Reset so "No matches" doesn't show on empty query
      return;
    }
    if (!apiBaseUrl) {
      setError("Search service is not available.");
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/Search/Query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          queryText: trimmed,
          indexName: "blogs",
          vectorSearchMode: "content",
        }),
      });

      const body = await response.text();
      if (!response.ok) {
        throw new Error(
          `Search request failed (status ${response.status}).`
        );
      }

      let payload;
      try {
        payload = JSON.parse(body);
      } catch (parseError) {
        throw new Error("Search service returned invalid JSON.");
      }

      const success = payload.success ?? payload.Success ?? false;
      if (!success) {
        const serviceMessage = payload.message || payload.Message;
        throw new Error(
          serviceMessage || "Search service reported an error."
        );
      }

      const payloadData = payload.data ?? payload.Data ?? {};
      const hits = payloadData.hits ?? payloadData.Hits ?? [];

      const mapped = hits.map((hit, index) => {
        const metadata = Object.entries(hit.metadata ?? hit.Metadata ?? {}).reduce(
          (acc, [key, value]) => {
            const parsed = parseMetadataValue(value);
            if (parsed === null || parsed === undefined) {
              return acc;
            }
            acc[key] = parsed;
            return acc;
          },
          {}
        );

        if (typeof metadata.categories === "string") {
          metadata.categories = metadata.categories
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        }

        const matchedPost = findBestMatch(hit, metadata);
        return {
          id: metadata.slug || hit?.input || `hit-${index}`,
          hit: {
            ...hit,
            metadata,
          },
          post: matchedPost ?? null,
        };
      });

      setResults(mapped);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const renderFallbackCard = (item) => {
    const metadata = item.hit?.metadata ?? {};
    const title = metadata.title || item.hit?.input || "Search Match";
    const snippet = metadata.summary || item.hit?.output || "No additional context returned.";
    const url = metadata.url;
    const categories = Array.isArray(metadata.categories)
      ? metadata.categories
      : [];
    return (
      <article className="h-full rounded border border-border p-4 dark:border-darkmode-border">
        <h4 className="text-lg font-semibold">
          {url ? (
            <a href={url} target="_blank" rel="noreferrer" className="hover:text-primary">
              {title}
            </a>
          ) : (
            title
          )}
        </h4>
        <p className="mt-3 text-sm leading-relaxed text-light dark:text-darkmode-light">
          {snippet}
        </p>
        {categories.length > 0 && (
          <p className="mt-3 text-xs uppercase tracking-wide text-light dark:text-darkmode-light">
            {categories.join(", ")}
          </p>
        )}
      </article>
    );
  };

  const renderResultCard = (item) => {
    if (item.post) {
      return <Post post={item.post} />;
    }
    return renderFallbackCard(item);
  };

  const hasResults = results.length > 0;

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
              placeholder="Try typing “quantum computing”"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={loadingConfig || searching}
            />
            <button
              className="btn btn-primary whitespace-nowrap px-6 py-3"
              type="submit"
              disabled={loadingConfig || searching}
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </form>
          <div className="mt-4 text-center text-sm text-light dark:text-darkmode-light">
            {loadingConfig && "Connecting to search service..."}
            {!loadingConfig && !apiBaseUrl && !error
              ? "Search service is unavailable."
              : null}
            {error && <span className="text-red-500">{error}</span>}
          </div>
        </div>

        {hasResults && (
          <div className="mt-12">
            <h3 className="section-title mb-8 text-center">
              Top semantic matches
            </h3>
            <div className="row">
              {results.map((item) => (
                <div key={item.id} className="mt-10 md:col-6 xl:col-4">
                  {renderResultCard(item)}
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasResults && !loadingConfig && !searching && !error && searchSubmitted && query.trim() && (
          <div className="mt-12 rounded border border-border p-6 text-center text-sm text-light dark:border-darkmode-border dark:text-darkmode-light">
            No matches found for “{query}”.
          </div>
        )}
      </div>
    </section>
  );
};

export default CategorySearch;
