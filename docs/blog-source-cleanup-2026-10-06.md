# Blog source and archive cleanup — 6 October 2026

Scope: credibility wording, stale test posts, product links, chronological
archives, and category consolidation. The MariaDB schema is unchanged. All work
was applied to the local `monitordb` database; the live database was not modified.

## Data changes

- Consolidated 82 `BlogCategories` labels into 20 durable topics using
  `config/blog-categories.json`. Removed only duplicate category assignments
  created by that consolidation: 297 category rows became 286.
- Aligned `BlogPictures.Category` labels with the same topics so the existing
  automatic image selection code can still match categories. Picture paths,
  usage flags and associations were retained. The media-only Featured label
  remains; it does not create a blog category archive.
- Replaced the old download-domain links in posts 460, 513, 515, 520 and 528
  with `https://readyforquantum.com/download`.
- Retained all 194 blog rows, all 944 Q&A rows and all 283 picture rows.
  There are 191 published blog-site records, representing 188 unique slugs.
- No Welcome/default test records existed in the synced database. The generated
  source folder still held `default1.md` and an integration-test post absent
  from the database; authoritative import pruning removed those stale files.
- Three duplicate slugs remain in the database: custom agents (379/460), server
  availability (377/479), and false-positive security alerts (422/431). The site
  consistently publishes the newest version for each URL. No source rows were
  deleted to resolve these publication collisions.

The earlier assistant links and corrected images are included in the cleaned
source export. No editorial rewrite of the articles was performed in this step.

## Blog code changes

- Removed the subscriber-count and weekly-delivery claims; corrected GitHub.
- Shared chronological ordering across archives, category pages and the homepage.
- Normalized imported categories through the editorial catalogue. New aliases
  must map to an existing topic; unsupported names stop the build with a clear
  error instead of generating more small archives.
- Pruned stale generated posts only after a successful, validated import.
- Generated 78 permanent category redirects, including historical TLS aliases
  and Test. Both production and local Apache configurations include them.
- Updated sitemap and public search index to use the cleaned categories/posts.
- Improved category cards for longer labels and made card previews display
  readable link labels rather than raw Markdown links.

See [category URL guidance](category-urls.md) for publication and HTTP checks.

## Backups and reproduction

The pre-cleanup data-only backup is:
`/home/mahadeva/blog-source-before-architecture-cleanup-20261006.sql.gz`.
The cleaned data-only export is:
`/home/mahadeva/blog-source-cleaned-20261006.sql.gz`.
Both contain Blogs, BlogCategories, BlogQNAs and BlogPictures, without table
creation statements. They require a data replacement/import into existing tables;
plainly importing INSERT statements into populated tables will cause duplicate
keys. Back up live data before replacing it.

`scripts/blog-source-cleanup.sql` is an alternative, repeatable data-only patch
for the category names, picture labels, known old download URLs and placeholder
publication flags. It does not add or alter tables, columns or indexes. Generate
it again after editing the catalogue with:

```sh
node scripts/generate-blog-cleanup.cjs
```

The normal export fetches the configured Blog API. To verify the local cleaned
source without replacing that production configuration, save the local API
response as a JSON snapshot and run:

```sh
BLOG_SOURCE_JSON=/path/to/local-blog-api-snapshot.json npm run export
```

The snapshot may be the Blog API response envelope or a direct array of posts.
The source override is optional; normal live builds continue using the existing
configured API. Import the cleaned data into live before rebuilding the live blog,
otherwise the build will fetch the old article text and category assignments.

New media should use catalogue category labels. Existing paths may stay in their
old folders. If the backend imports additional images from old-named folders,
rerun the data-only category patch to align their metadata labels.

## Verification

- 31 unit tests and 11 UI tests passed.
- Static export and publication validation passed.
- Isolated Apache served all 20 category pages directly with matching canonical
  URLs; all 78 redirects were checked with and without trailing slashes and with
  query strings. The removed placeholder returned 404 and redirect rules file 403.
- Verified chronological order in all 32 archive pages and 188 unique published
  URLs in the search index. All exported HTML was checked for old-domain links,
  placeholder links and the removed credibility wording.
- Checked category index and page 2 at desktop and mobile widths; no horizontal
  page overflow. Screenshot artifacts are in `/tmp/blog-architecture-*.png`.

For later content prioritization, see the
[Search Console clicks snapshot](search-console-clicks-2026-10-03.md).
