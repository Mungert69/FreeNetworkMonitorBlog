# Quantum Ready Monitor Blog – Technical Guide

This document complements the project README with deep‑dive notes on how the repository is structured, how data flows through the build, and what happens at runtime. It is intended for engineers maintaining or extending the site.

---

## 1. High-Level Architecture

- **Framework**: Next.js 14 (Pages Router) rendered as a fully static export (`next export`) and served by Apache inside Docker.
- **Styling**: TailwindCSS with additional SCSS layers (`styles/style.scss`) compiled by Next.js. Colors, typography, and breakpoints are driven by JSON theme files in `config/theme.json`.
- **Content Source**: Blog posts originate from an external API (Quantum Network Monitor backend). Responses are converted into Markdown files and JSON indexes during the build.
- **Search**: Semantic search served by the `NetworkMonitorService` backend, which fans out queries over RabbitMQ to the OpenSearch-based `NetworkMonitorSearch` service.

The combination delivers a static site that rebuilds itself from remote data whenever `npm run export` (or `npm run build`) is invoked.

---

## 2. Repository Layout Overview

```
config/                 Site, theme, menu, and social JSON configuration.
content/                Markdown content for static pages and generated posts.
context/                React context (search data feed) and environment JSON.
layouts/                Shared React layouts, components, partials, shortcodes.
lib/                    Node utilities for content parsing, sitemap, embeddings.
pages/                  Next.js page routes (Pages Router).
public/                 Static assets copied verbatim to the export (images, JSON).
.json/posts.json        Build-time cache of blog entries fetched from API.
public/post-embeddings.json  Embedding index consumed by client search.
public/models/          Exported model files for client-side semantic search.
```

Important entry points:

- `pages/index.js` – home page assembly from configs and parsed content.
- `pages/posts/[single].js` – post detail page using MDX rendering.
- `pages/categories/index.js` – category listing plus semantic search UI.
- `pages/page/[slug].js` – pagination for `/posts/<page>` routes.
- `pages/[regular].js` – static CMS-style pages (`about`, `contact`, etc.).

---

## 3. Content Ingestion Pipeline

1. **Configuration**  
   `config/config.json` declares the blog folder (`posts`), pagination size, widgets, GA, etc. `config/menu.json` & `config/social.json` populate navigation and social links.

2. **Remote Fetch** – `lib/jsonGenerator.js`  
   - Reads the target API URL from `public/runConfig.json` (copied in per-environment by `build-run*` scripts).  
   - POSTs to `${apiLoadBalancerUrl}/Blog/BlogsJson` and expects a JSON payload with `{ slug, frontmatter, content }` entries.  
   - Writes raw JSON to `.json/posts.json`.  
   - Generates Markdown files for each post under `content/posts/*.md`, escaping content where necessary.  
   - Ensures the folder exists and `_index.md` is scaffolded on first run.

3. **Markdown Parsing** – `lib/contentParser.js`  
   - Reads Markdown from the filesystem.  
   - Uses `gray-matter` to split frontmatter and body.  
   - Converts HTML-incompatible characters, filters out drafts, and normalizes slugs (prefers explicit `url` fields in frontmatter).  
   - Returns arrays of posts to page components.

4. **Taxonomy Extraction** – `lib/taxonomyParser.js`  
   - Pulls category names from frontmatter arrays.  
   - Slugifies them with `github-slugger` for consistent routing.  
   - Deduplicates via `Set`.

Because the build is deterministic, everything downstream consumes the generated Markdown (rather than hitting the API directly during render).

---

## 4. Build & Export Workflow

### npm scripts (`package.json`)

```
dev    : node lib/jsonGenerator.js
         next dev

build  : node lib/jsonGenerator.js
         node lib/generate-sitemap.js
         next build

export : node lib/jsonGenerator.js
         node lib/generate-sitemap.js
         next build && next export
generate-sitemap    : node lib/generate-sitemap.js
```

The static export generates an `out/` directory containing:

- Pre-rendered HTML for every route.
- Copied assets from `public/`.
- Generated sitemap (`public/sitemap.xml`).
- Generated search index (`post-embeddings.json`) and local model files (`models/...`).

### Docker Deployment

- `build-run` / `build-run-local` scripts install dependencies, generate static output, and build/push Docker images.
- `Dockerfile` copies `out/` into `/var/www/html/` on top of `ubuntu/apache2`, enables necessary Apache modules, and exposes port 443.
- No server-side Node code runs in production; Apache serves the static files.

---

## 5. Semantic Search Pipeline

### Build Time (static assets)

- `lib/jsonGenerator.js` produces Markdown files plus `.json/posts.json` and the new
  `public/blog-index.json` (canonical payload for RabbitMQ-driven OpenSearch indexing).
- `lib/generate-sitemap.js` creates `public/sitemap.xml`.

### Runtime Workflow

1. The `/categories/` page fetches `/runConfig.json` to discover the API base (`apiLoadBalancerUrl`).
2. When the user submits a query, the front-end POSTs to `${apiLoadBalancerUrl}/Search/Query`.
3. `NetworkMonitorService`’s `SearchController` wraps the request in a `QueryIndexRequest`
   (supplying the encrypted service credentials) and hands it to `IQueryCoordinator`.
4. `QueryCoordinator` publishes the message over RabbitMQ to the `NetworkMonitorSearch`
   service, which performs the OpenSearch query and returns top matches (`QueryResultObj` list).
5. The front-end receives a standardized payload `{ success, message, data: { hits, raw } }`
   and heuristically maps each hit back to the closest local blog post. If no confident match
   is found, the raw text is rendered as a fallback card.

All cross-origin requests remain same-origin because the static site and API share the load balancer; CORS rules must permit the blog origin.

---

## 6. Page Composition & Layouts

- `layouts/Baseof.js` – Shared wrapper for all pages:
  - Builds `<head>` metadata using `config/config.json`.
  - Computes canonical URLs, strips query/fragment, and enforces lowercase/trailing slash.
  - Injects header/footer partials.

- `pages/index.js` – Home page:
  - Binds to `content/_index.md` for hero/banner settings.
  - Assembles sections: featured posts, promotion banner, recent posts, sidebar.
  - Passes category counts to `Sidebar`.

- `pages/posts/[single].js` – Post page:
  - Pulls a post via `getSinglePage`.
  - Renders MDX using `next-mdx-remote` with custom shortcodes (`layouts/shortcodes`).
  - Adds JSON-LD FAQ structured data when frontmatter includes `questions`/`answers`.
  - Sidebar lists categories and other posts (filtered).

- `pages/categories/[category].js` – Category detail:
  - Filters posts matching the category slug.
  - Uses the same sidebar structure, reusing precomputed counts.

- `pages/categories/index.js` – Category index + search (see above).

- `pages/page/[slug].js` – Paginates posts (e.g., `/posts/2`).  
  Works in tandem with the `Pagination` component (`layouts/components/Pagination.js`), which builds numeric navigation with ellipsis compaction.

- `pages/[regular].js` – Renders Markdown pages from `content/` using specialized layouts for contact/about and default fallback.

---

## 7. Styling & Assets

- Tailwind configuration (`tailwind.config.js`) reads color and typography tokens from `config/theme.json`.
- Global styles: `styles/style.scss` (with nested imports under `styles/`).
- Components use utility-first classes with occasional custom SCSS.
- Feature images leverage `layouts/components/ImageFallback.js`, which swaps to a fallback source if the primary image fails.
- Category chips were softened with translucent backgrounds, blur, and shadow to blend with underlying imagery.

Static assets (images, logos, runConfig JSON) live in `public/` so they’re available at runtime without a build step.

---

## 8. Environment & Configuration Management

- **runConfig files** (`public/runConfig*.json/js`):  
  Control which API endpoint `jsonGenerator` targets (live vs. dev). Deployment scripts copy the appropriate version into `public/runConfig.json` before builds.

- **Context** (`context/state.js`):  
  Imports the generated `.json/posts.json` bundle at runtime and exposes it to React via `JsonContext`. The search page leverages this to display post cards without refetching from disk.

- **Analytics** (`pages/_app.js`):  
  - Loads fonts defined in `theme.json` from Google Fonts.  
  - Attaches Google Analytics 4 when in production and `config.params.google_analytics_id` is set.  
  - Wraps the app in `ThemeProvider` for dark/light/system switching (controlled by config).

---

## 9. Deployment Notes

- **Static Export Quirk**: Because the site runs in pure static mode, direct navigation must map onto generated files. `next.config.js` sets `trailingSlash: true`, ensuring URLs like `/categories/` map to `categories/index.html`. Without it, Apache returned a 403 for the slashless variant.

- **Search Assets**: `public/blog-index.json` is consumed by the OpenSearch import job; the blog build no longer produces client-side embeddings.

- **Caching**: Some browsers cache previous fetch failures aggressively (e.g., Brave). The fetch layer appends a timestamp query parameter to circumvent caching stale HTML from a prior error.

- **Server Hosting**: The site remains a static export served by Apache, but semantic
  queries depend on the `NetworkMonitorService` API (specifically `/Search/Query`). Ensure
  that service is reachable from the blog domain and that CORS/SSL settings permit the calls.

---

## 10. Developer Workflow Tips

- **Install dependencies**: `npm install` (Node 18+ recommended; project includes `.nvm` guidance in `README-npm-tests.md`).
- **Local dev**: `npm run dev` – rebuilds posts, embeddings, and starts Next.js dev server at `http://localhost:3000`.
- **Static export preview**: `npm run export && npx serve out`.
- **Semantic search debugging**:
  - Check `public/post-embeddings.json` (size ~2 MB, `embeddings.length === post count`).
  - Verify `public/models/.../model_quantized.onnx` exists.
  - In browser console, inspect network request to `/post-embeddings.json?v=...` and confirm status 200 with `application/json`.

- **Content Updates**: Re-run the build/export or just `node lib/jsonGenerator.js` if you need to refresh the generated JSON after content changes.
- **Extending Frontmatter**: Additional fields can be added to Markdown; components read from `post.frontmatter`. Remember to update `jsonGenerator` if the API payload changes shape.

---

## 11. Future Enhancements (Ideas)

- **Server-side Search API**: Offload embedding to a Node microservice to reduce client download weight, or fallback to lexical search for quick responses.
- **Incremental Revalidation**: If moving away from static export, consider Next.js ISR to regenerate pages when backend data changes without a full rebuild.
- **Automated QA**: Add lightweight tests around content parsing and embedding generation (e.g., verifying slug uniqueness).
- **Observability**: Instrument fetch/logging for `jsonGenerator` to detect API issues during CI/CD.

---

## 12. Reference Commands

| Task                              | Command                                   |
|-----------------------------------|-------------------------------------------|
| Fetch posts & run dev server      | `npm run dev`                             |
| Refresh blog JSON (no export)     | `node lib/jsonGenerator.js`               |
| Generate sitemap                  | `npm run generate-sitemap`                |
| Production build (no export)      | `npm run build`                           |
| Static export (for Docker)        | `npm run export`                          |
| Preview exported site             | `npm run export && npx serve out`         |

These scripts encapsulate all prerequisites (content fetch, embeddings, sitemap) in the correct order.

---

## 13. Troubleshooting Quick Reference

| Symptom                                                       | Likely Cause / Fix                                                                 |
|---------------------------------------------------------------|-------------------------------------------------------------------------------------|
| `/categories` returns 403 / HTML                              | Trailing slash missing – `next.config.js` now enforces slashes. Ensure redeploy.    |
| Semantic search error `Unexpected token '<'`                  | Browser cached HTML error; query param added to fetch, but clear cache if repeat.   |
| Semantic search never finishes loading                        | Model files missing; verify `public/models/...` shipped with deployment.            |
| New blogs not showing after build                             | Older date filter removed; ensure `jsonGenerator` succeeded and posts are present.  |
| Category counts always zero                                   | Resolved by slug-aware matching (`slugify`) + zero-count filtering.                 |
| GA not firing locally                                         | GA only initializes in production with ID present (see `_app.js`).                  |

---

For further questions or deeper modifications (API changes, search offloading, etc.), refer to the relevant sections above and update both build-time scripts and runtime components accordingly. This guide should provide the necessary context to extend the Quantum Ready Monitor Blog safely and confidently.
