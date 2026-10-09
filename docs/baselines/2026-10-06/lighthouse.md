# Lighthouse baseline

Five public pages, each tested once on mobile and desktop using Lighthouse 13.5.0.

| Page | Profile | Performance | LCP (s) | CLS | Blocking (ms) | Payload (KiB) |
|---|---|---:|---:|---:|---:|---:|
| https://blog.readyforquantum.com/posts/automatingnmapscanswithaiastepbystepguide/ | desktop | 99 | 0.62 | 0.000 | 41 | 1795 |
| https://blog.readyforquantum.com/posts/automatingnmapscanswithaiastepbystepguide/ | mobile | 55 | 5.59 | 0.000 | 1059 | 1068 |
| https://blog.readyforquantum.com/categories/ | desktop | 99 | 0.66 | 0.010 | 70 | 1563 |
| https://blog.readyforquantum.com/categories/ | mobile | 59 | 4.71 | 0.011 | 1005 | 1064 |
| https://blog.readyforquantum.com/ | desktop | 100 | 0.63 | 0.001 | 50 | 1923 |
| https://blog.readyforquantum.com/ | mobile | 50 | 7.94 | 0.002 | 854 | 1548 |
| https://blog.readyforquantum.com/posts/nmapvs.zenmapchoosingtherightnetworkmappingtool/ | desktop | 99 | 0.80 | 0.000 | 36 | 1827 |
| https://blog.readyforquantum.com/posts/nmapvs.zenmapchoosingtherightnetworkmappingtool/ | mobile | 53 | 7.41 | 0.003 | 864 | 1101 |
| https://readyforquantum.com/ | desktop | 99 | 0.66 | 0.000 | 42 | 468 |
| https://readyforquantum.com/ | mobile | 59 | 5.21 | 0.000 | 541 | 468 |

| Page | Profile | Accessibility | Best practices | SEO |
|---|---|---:|---:|---:|
| https://blog.readyforquantum.com/posts/automatingnmapscanswithaiastepbystepguide/ | desktop | 92 | 92 | 92 |
| https://blog.readyforquantum.com/posts/automatingnmapscanswithaiastepbystepguide/ | mobile | 92 | 92 | 92 |
| https://blog.readyforquantum.com/categories/ | desktop | 96 | 92 | 100 |
| https://blog.readyforquantum.com/categories/ | mobile | 96 | 92 | 100 |
| https://blog.readyforquantum.com/ | desktop | 96 | 92 | 92 |
| https://blog.readyforquantum.com/ | mobile | 96 | 92 | 92 |
| https://blog.readyforquantum.com/posts/nmapvs.zenmapchoosingtherightnetworkmappingtool/ | desktop | 92 | 92 | 92 |
| https://blog.readyforquantum.com/posts/nmapvs.zenmapchoosingtherightnetworkmappingtool/ | mobile | 92 | 92 | 92 |
| https://readyforquantum.com/ | desktop | 77 | 92 | 100 |
| https://readyforquantum.com/ | mobile | 87 | 92 | 100 |

## Interpretation and reproduction

These are lab measurements, not real-user Core Web Vitals or ranking scores. Tests use a logged-out browser with the initial cookie interface. Mobile uses default simulated throttling; desktop uses the desktop preset. Audits run sequentially to avoid CPU contention. Environment details are retained in environment.txt and every raw report.

There is one run per page/profile. Repeat on the same machine and pinned Lighthouse version; use the median of at least three runs before interpreting small differences. Inspect raw reports for warnings and failed audits. Search rankings also depend on content, competition and crawl timing.

From the blog repo, with Node/npm and Chromium available:

```bash
scripts/capture-lighthouse-baseline.sh /path/to/new-reports
python3 scripts/summarize-lighthouse-baseline.py /path/to/new-reports /path/to/new-snapshot
```

## Full reports

- [blog-ai-nmap-desktop.report.html](/home/mahadeva/site-performance-baseline-2026-10-06/blog-ai-nmap-desktop.report.html)
- [blog-ai-nmap-mobile.report.html](/home/mahadeva/site-performance-baseline-2026-10-06/blog-ai-nmap-mobile.report.html)
- [blog-categories-desktop.report.html](/home/mahadeva/site-performance-baseline-2026-10-06/blog-categories-desktop.report.html)
- [blog-categories-mobile.report.html](/home/mahadeva/site-performance-baseline-2026-10-06/blog-categories-mobile.report.html)
- [blog-home-desktop.report.html](/home/mahadeva/site-performance-baseline-2026-10-06/blog-home-desktop.report.html)
- [blog-home-mobile.report.html](/home/mahadeva/site-performance-baseline-2026-10-06/blog-home-mobile.report.html)
- [blog-nmap-zenmap-desktop.report.html](/home/mahadeva/site-performance-baseline-2026-10-06/blog-nmap-zenmap-desktop.report.html)
- [blog-nmap-zenmap-mobile.report.html](/home/mahadeva/site-performance-baseline-2026-10-06/blog-nmap-zenmap-mobile.report.html)
- [main-home-desktop.report.html](/home/mahadeva/site-performance-baseline-2026-10-06/main-home-desktop.report.html)
- [main-home-mobile.report.html](/home/mahadeva/site-performance-baseline-2026-10-06/main-home-mobile.report.html)

Source: [Lighthouse CLI documentation](https://github.com/GoogleChrome/lighthouse#using-the-node-cli).
