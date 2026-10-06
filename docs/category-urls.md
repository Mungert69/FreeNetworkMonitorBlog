# Category URL consistency

The editorial category catalogue lives in `config/blog-categories.json`.
`lib/category-catalog.cjs` normalizes imported labels into those 20 topics before
page generation, search indexing and sitemap creation. Unknown labels fail the
import with an instruction to map them to an existing topic; this prevents new
one-post archives from appearing accidentally.

Routes, rendered links and sitemap generation still share `lib/utils/slug.cjs`.
Consolidation changes the editorial label first: `SSL/TLS`, for example, becomes
`TLS and Encryption`, whose canonical slug is `tls-and-encryption`.

`lib/generate-category-redirects.cjs` generates `out/.category-redirects.conf`
after Next exports the site. Both Apache virtual hosts include these permanent
redirects before file/404 handling. Old categories and the two historical
`ssl-tls` aliases redirect directly to the new topic; Test redirects to the
category index. Both trailing-slash forms and query strings are supported.
The rules file is denied public HTTP access. Existing article URLs are retained.

Run `npm run test:unit`, `npm run test:ui`, and `npm run export` using Node 24.
Export checks every category in the sitemap and every redirect destination.
For an isolated Apache serving `out/` with the production Directory rules:

```sh
node scripts/check-category-urls.cjs http://localhost:PORT
```

This checks every category and every alias, including query preservation.
The generated `public/sitemap.xml` is tracked and should be included with changes.
Google's stored results require a new crawl after deployment.

## Publication and import policy

`lib/publication-policy.cjs` excludes drafts, 404 layouts and placeholder slugs
(`default`, `defaultN`, or entirely numeric slugs) consistently. Genuine testing
articles are not excluded merely because they mention testing.

Each successful import treats the Blog API response as authoritative for
`content/posts/`: old generated Markdown files absent from the response are
removed, while `_index.md` and other underscore-prefixed configuration files
remain. Keep manually maintained content outside this generated post folder.
Failed or malformed imports stop the build; they do not authorize pruning.

Archives, category pages and the homepage use the same descending date order,
with slug as a stable tie-breaker and invalid dates last. Dates without an
explicit timezone are interpreted as UTC. Duplicate source slugs retain their
newest version in publication without deleting the database records.

Export starts with a clean `out/`. Removed placeholders have no exported route
and receive the existing Apache 404 response. Homepage, category, related-post,
pagination and search data all use the filtered content. No Search Console
removal request is made by these changes.

## Article and category metadata

Article pages emit `BlogPosting` JSON-LD through `Baseof` using the same canonical,
headline, displayed author and description as the rendered article. Publication
dates retain supplied timezone information; modification dates appear only when
provided (`lastmod` or `dateModified`). Missing images/dates are omitted rather
than fabricated. Only HTTP(S) images are allowed. JSON-LD escapes `<` so article
text cannot terminate the script element. See Google's current guidance:
https://developers.google.com/search/docs/appearance/structured-data/article

Export validation checks every exported article has parseable `BlogPosting`
metadata whose URL/mainEntityOfPage agree with the canonical. These local checks
are not Google's Rich Results Test and do not guarantee a special search result.
After deployment, check representative URLs in that tool and request/await
recrawling as appropriate.

Category pages/index/sidebar display original frontmatter names (for example
SSL/TLS), preserving their existing slug URLs. Category titles and descriptions
use existing labels, counts and article titles. Categories remain indexable;
there is no blanket noindex policy for categories with a single article.

Sitemap generation updates one robots.txt Sitemap directive from the configured
site origin, retaining other crawler rules. Production and local Apache configs
redirect `/blog`, `/blog/` and `/blog/index.html` to the blog root with query
preservation. Any extra host-to-host redirect in an external reverse proxy must
be reviewed separately from these repository rules.
