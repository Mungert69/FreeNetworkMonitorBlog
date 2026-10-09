# Search performance baseline

Captured 2026-10-06T18:52:46.944385+00:00. Final Web Search data ends 2026-10-04. This traffic predates the 6 October deployment.

| Window | Clicks | Impressions | CTR | Average position |
|---|---:|---:|---:|---:|
| 28d | 37 | 2861 | 1.29% | 10.67 |
| previous-28d | 10 | 3020 | 0.33% | 21.35 |
| 90d | 60 | 10017 | 0.60% | 15.87 |
| previous-90d | 58 | 44650 | 0.13% | 6.20 |
| 365d | 305 | 95436 | 0.32% | 9.45 |

## Leading pages — last 90 days

| Page | Clicks | Impressions | CTR | Average position |
|---|---:|---:|---:|---:|
| https://blog.readyforquantum.com/posts/automatingnmapscanswithaiastepbystepguide | 14 | 800 | 1.75% | 7.49 |
| https://readyforquantum.com | 13 | 609 | 2.13% | 6.35 |
| https://readyforquantum.com/dashboard | 11 | 336 | 3.27% | 10.14 |
| https://blog.readyforquantum.com/posts/nmapvs.zenmapchoosingtherightnetworkmappingtool | 7 | 3200 | 0.22% | 13.37 |
| https://blog.readyforquantum.com/posts/nmapandhoneypotsenhancingnetworkdeceptiontechniques | 5 | 134 | 3.73% | 6.41 |
| https://blog.readyforquantum.com/posts/metasploitandowasptop10addressingwebapplicationvulnerabilities | 3 | 97 | 3.09% | 8.15 |
| https://readyforquantum.com/huggingface_gguf_selection_guide.html | 3 | 1554 | 0.19% | 12.73 |
| https://blog.readyforquantum.com/posts/metasploitvs.otherexploitationframeworksacomparativeanalysis | 2 | 293 | 0.68% | 16.83 |
| https://blog.readyforquantum.com/posts/nmapandcomplianceusingnetworkmappingforregulatoryrequirements | 1 | 15 | 6.67% | 16.00 |
| https://blog.readyforquantum.com/posts/nmapperformancetuningoptimizingscansforlargenetworks | 1 | 975 | 0.10% | 18.69 |
| https://blog.readyforquantum.com | 0 | 281 | 0.00% | 4.76 |
| https://blog.readyforquantum.com/categories | 0 | 33 | 0.00% | 10.91 |
| https://blog.readyforquantum.com/categories/agents | 0 | 2 | 0.00% | 4.50 |
| https://blog.readyforquantum.com/categories/change-management | 0 | 38 | 0.00% | 16.13 |
| https://blog.readyforquantum.com/categories/collaboration | 0 | 43 | 0.00% | 12.02 |

## Google URL inspection samples

| URL | Verdict | Coverage | Last crawl | Google canonical |
|---|---|---|---|---|
| https://readyforquantum.com/ | PASS | Submitted and indexed | 2026-10-06T18:51:16Z | https://readyforquantum.com/ |
| https://readyforquantum.com/features | NEUTRAL | URL is unknown to Google | — | — |
| https://readyforquantum.com/docs/getting-started | NEUTRAL | URL is unknown to Google | — | — |
| https://readyforquantum.com/docs/quantum | NEUTRAL | URL is unknown to Google | — | — |
| https://blog.readyforquantum.com/ | PASS | Submitted and indexed | 2026-10-06T03:46:45Z | https://blog.readyforquantum.com/ |
| https://blog.readyforquantum.com/categories/ | PASS | Submitted and indexed | 2026-10-06T07:46:59Z | https://blog.readyforquantum.com/categories/ |
| https://blog.readyforquantum.com/categories/post-quantum-security/ | NEUTRAL | URL is unknown to Google | — | — |
| https://blog.readyforquantum.com/posts/automatingnmapscanswithaiastepbystepguide/ | PASS | Submitted and indexed | 2026-09-26T16:49:12Z | https://blog.readyforquantum.com/posts/automatingnmapscanswithaiastepbystepguide/ |
| https://blog.readyforquantum.com/posts/nmapvs.zenmapchoosingtherightnetworkmappingtool/ | PASS | Submitted and indexed | 2026-09-28T23:19:58Z | https://blog.readyforquantum.com/posts/nmapvs.zenmapchoosingtherightnetworkmappingtool/ |
| https://blog.readyforquantum.com/posts/howtoperformquantumsafecheckswiththeassistant/ | PASS | Submitted and indexed | 2026-08-24T14:55:25Z | https://blog.readyforquantum.com/posts/howtoperformquantumsafecheckswiththeassistant/ |

## Live sitemap and deployment state

- readyforquantum.com: 33 sitemap URLs, including 0 post URLs and 0 topic archives.
- blog.readyforquantum.com: 242 sitemap URLs, including 188 post URLs and 20 topic archives.
- https://blog.readyforquantum.com/: 20 categories; Next build `wKFt8Dm2Q82wVWBPSDZQo`; last modified `Tue, 06 Oct 2026 18:40:07 GMT`.
- https://blog.readyforquantum.com/categories/: 20 categories; Next build `wKFt8Dm2Q82wVWBPSDZQo`; last modified `Tue, 06 Oct 2026 18:40:07 GMT`.
- https://blog.readyforquantum.com/categories/post-quantum-security/: 20 categories; Next build `wKFt8Dm2Q82wVWBPSDZQo`; last modified `Tue, 06 Oct 2026 18:40:07 GMT`.

## Interpretation and repeat procedure

Use matching 28-day windows for short-term comparisons and 90 days for more stable trends. Compare clicks, impressions, CTR, queries, devices and the same URLs. Check seasonal changes before attributing changes to the deployment.

Property totals and page-group totals use different aggregation methods and should not be added together. Query-level rows can omit anonymized searches; the API returns its available top rows, not a complete analytics event log. Slash/no-slash variants are combined only in the overview table; raw rows remain in JSON and CSV.

URL inspections describe Google’s stored indexed version, not a live indexing test. The API does not expose the full Page Indexing report or total crawled-but-not-indexed counts; these samples and submitted sitemap status are the API-accessible baseline.

Repeat from the blog repo with `python3 scripts/capture-search-baseline.py`. Dependencies: `requests` and `PyJWT[crypto]`; credentials default to `../securefiles/google-service-account.json`. Use `--output PATH` to save another snapshot without overwriting this one. No private key or access token is saved.

Sources: [Search Analytics API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query), [URL Inspection API](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect).
