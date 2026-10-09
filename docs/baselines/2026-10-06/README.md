# Ready for Quantum baseline — 6 October 2026

This snapshot records search visibility before the latest deployment and the current live site's technical performance after deployment. Keep both dates in mind when comparing future snapshots.

## Search visibility

Final Google Search Console data ends **4 October 2026**:

| Window | Clicks | Impressions | CTR | Average position |
|---|---:|---:|---:|---:|
| Last 28 days | 37 | 2,861 | 1.29% | 10.67 |
| Last 90 days | 60 | 10,017 | 0.60% | 15.87 |
| Last 365 days | 305 | 95,436 | 0.32% | 9.45 |

[Search baseline and repeat procedure](search-console.md) includes leading pages, previous-period totals, indexing samples and sitemap counts. CSV files preserve daily trends, pages, queries, devices and countries. [Raw Search Console snapshot](search-console.json) also preserves live metadata and repository versions.

Ten URL inspection samples: six indexed; four unknown to Google, including the new frontend guides and the new post-quantum category URL. This is a sample, not the complete Page Indexing report.

The live frontend sitemap contains 33 URLs. The blog sitemap contains 242 URLs, including 188 unique posts and 20 category archives. The captured blog build is `wKFt8Dm2Q82wVWBPSDZQo`, last modified 6 October at 18:40 UTC. Source revisions: frontend `2061844` (1.9.2), blog `ec6e62f` (1.3.7).

## Page performance

[Ten Lighthouse audits](lighthouse.md) cover the frontend homepage, blog homepage, category index and two leading articles, each on mobile and desktop. All completed without runtime errors.

| Page | Mobile performance | Desktop performance |
|---|---:|---:|
| Frontend homepage | 59 | 99 |
| Blog homepage | 50 | 100 |
| Categories | 59 | 99 |
| AI Nmap guide | 55 | 99 |
| Nmap vs Zenmap | 53 | 99 |

Scores are out of 100. These are single-run lab results; they do not measure real-user Core Web Vitals. Full reports retain diagnostics, accessibility findings, SEO checks, timings, payload sizes and environment details. [Structured results](lighthouse.json) and [CSV results](lighthouse.csv) support future comparisons.

Full HTML/JSON reports and test logs are archived at `/home/mahadeva/site-performance-baseline-2026-10-06.tar.gz`. The extracted reports remain in `/home/mahadeva/site-performance-baseline-2026-10-06/`. Current robots.txt responses are saved alongside this document.

## When and how to compare

- Recheck indexing in approximately two weeks, using the same inspected URLs.
- Compare a complete 28-day post-deployment window once Google has finalised it; review again after 90 days. Compare individual pages and queries as well as property totals.
- Repeat Lighthouse with the scripts linked in its report, on the same machine and version. Use three runs per page/profile and their median before interpreting small differences.
- Keep each new capture in a separate dated directory. Search Console final dates use Pacific time. Do not overwrite this snapshot.

Traffic can change with seasonality, query mix and competing sites. This baseline supports comparison; it cannot by itself establish that a particular code or content change caused a ranking change. No site functionality was changed during capture.
