# Category URL consistency

Category routes, rendered links and sitemap generation share `lib/utils/slug.cjs`,
which uses the existing github-slugger algorithm. Preserve this algorithm when
adding categories: `SSL/TLS` becomes `ssltls`, not `ssl-tls`. Article source data
and existing category URLs remain unchanged.

Both Apache virtual-host configurations redirect the previously submitted
`/categories/ssl-tls/` and `/categories/ssl-tls-security/` aliases permanently to
their existing canonical routes. These redirects run before file/404 handling,
accept either trailing-slash form, and preserve query strings.

Run `npm run test:unit`, `npm run test:ui`, and `npm run export` using the project's
current Node environment (verified with Node 24). Export validation now rejects a
sitemap category without a corresponding `out/categories/.../index.html` file.
To verify deployed HTTP behaviour, serve `out/` in an isolated Apache instance
using the Directory rules from `default-ssl.conf`, then run:

```sh
node scripts/check-category-urls.cjs http://localhost:PORT
```

This verifies every sitemap category returns 200 directly with its matching
canonical, and both incorrect aliases redirect permanently to a working page.
The generated `public/sitemap.xml` is tracked and should be included with the fix.
Google's stored 404 results will require a new crawl after deployment to update.

## Publication policy

`lib/publication-policy.cjs` is shared by content/page generation, the sitemap,
and the public `blog-index.json` builder. Drafts, 404 layouts, and the existing
placeholder slug pattern (`default`, `defaultN`, or entirely numeric slugs) are
excluded consistently. Frontmatter URL aliases are resolved identically before
checking publication. Titles/categories containing “test” are not exclusion
criteria: genuine testing articles remain published.

The importer still retains the original source content. This policy does not
change the database, Markdown bodies or frontmatter. Export starts from a clean
`out/`, so excluded posts have no exported route and receive the existing Apache
404 response after deployment. Homepage, category, related-post, pagination and
search data all obtain their posts through the filtered content reader.

`npm run export` also checks that no placeholder route or public index entry was
exported. Run the unit/UI suites and category HTTP checker, then confirm
`/posts/default1/` returns 404, normal articles still return 200, and no exported
HTML links to the removed post. Stored Google indexing results will require a
fresh crawl; no Search Console deletion request is made by these code changes.

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
